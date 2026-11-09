// MixtureBenchKit.js - the bench of L01, drawn once for every scene that stands a beaker on it.
//
// Two scenes import this file and neither imports the other: `MixtureBenchScene` (the laser) and
// `SettleFilterScene` (the settling clock and the filter cone). Keeping the bench here is what
// stops the two from drawing two different benches - the beaker that shows a beam in L01 is the
// same beaker, to the pixel, that grows a sediment layer later.
//
// This module is DRAWING ONLY. It holds no lesson state, no control ids, no stage logic and no
// colour of its own beyond mixing the palette a caller passes in - a caller that changes nothing
// about its own model gets the same bench. Nothing here imports a scene, and a scene that imports
// this file must not edit it: add a new export instead.
//
// What every export takes:
//   ctx  the 2D context, in the 680x520 design space
//   c    this.colors, the resolved token palette (from loadColors)
// Colour rule for all of it: palette tokens and mix/alpha/lighten/darken/hsl of them, never a hex.
//
// The one thing this file will not do is decide anything. Whether a beam is lit, whether a liquid
// has settled, what a label says - all of that belongs to the scene. Where a function needs to know
// something, it takes it as an option with an obvious default.
//
// 2026-10-27 look lift (rich materials, no API or geometry change): lit tiled wall, glass with
// edge density + streak highlights (thinner tint in the light theme), liquid with depth and side
// shading and a meniscus that climbs the glass.
// 2026-10-28: the glass and liquid moved into the kit (SimGlass.js); same API and geometry here.

import {
  alpha, mix, lighten, darken, hsl, rr, font, inkOn, mulberry32,
  drawShadow, drawBench, drawCard,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';

// -- the bench's own measurements -------------------------------------------------------------
// These are the ONE set of numbers the bench is drawn from. A scene that wants a beaker somewhere
// else passes its own box to `beakerBox`; it does not re-derive glass thickness from these.

/** The glass: outer width, height above the bench, and the drawn wall thickness. */
export const GLASS = { w: 104, h: 228, wall: 6, rim: 5 };

/** The bench top: x span, the y of its upper surface, and how deep the apron and legs run. */
export const BENCH = { x0: 16, x1: 664, y: 392, depth: 48 };

/** The wall panel the beam lands on, drawn behind the bench. */
export const WALL = { x: 40, y: 96, w: 600, h: 296 };

/** The liquid in a freshly stirred beaker, as a fraction of the inner depth. "A little under half full." */
export const FILL_FRAC = 0.46;

/** The three-beaker bench both L01 scenes stand on: glass size, how full, and where each beaker is. */
export const BENCH3 = { w: 150, h: 240, frac: 0.62, cx: { A: 118, B: 328, C: 538 } };

/**
 * What each liquid looks like, built from the glass token, which holds its colour in both themes.
 * A is nearly clear, B a white chalky cloud, C milk. `through` is what comes out of filter paper.
 */
export function benchLiquid(c, key) {
  return {
    A: { fill: lighten(c.water, 0.55), mix: 0.12 },
    B: { fill: lighten(c.glass, 0.86), mix: 0.8, through: { fill: lighten(c.water, 0.55), mix: 0.14 } },
    C: { fill: lighten(c.glass, 0.94), mix: 0.97 },
  }[key];
}

// -- geometry ------------------------------------------------------------------------------

/**
 * The drawn box of one beaker standing on the bench, from its centre x.
 *
 * Returns { x, y, w, h, cx, cy, iw, ih, floor, top, mid } where `iw`/`ih` are the INNER cavity
 * (what the liquid is drawn inside), `floor` is the inner bottom y, `top` the inner top y, and
 * `mid` the vertical middle of the inner cavity - which is where a beam through the beaker runs.
 * A scene passes the result to every other function here instead of re-computing the box.
 */
export function beakerBox(cx, o = {}) {
  const w = o.w ?? GLASS.w;
  const h = o.h ?? GLASS.h;
  const base = o.baseY ?? BENCH.y;            // the bench surface the beaker stands on
  const y = base - h;
  const iw = w - GLASS.wall * 2;
  const ih = h - GLASS.wall * 2;
  const floor = base - GLASS.wall;
  const top = y + GLASS.wall;
  return { x: cx - w / 2, y, w, h, cx, cy: y + h / 2, iw, ih, floor, top, mid: (floor + top) / 2 };
}

/**
 * The y of a liquid surface at `frac` of the inner depth, for a beaker box from `beakerBox`.
 * frac 0 is an empty beaker, 1 a beaker filled to the rim.
 */
export function liquidLevel(box, frac = FILL_FRAC) {
  return box.floor - box.ih * Math.max(0, Math.min(1, frac));
}

/**
 * The middle of the liquid column - the height a beam through the beaker runs at, and the height
 * the pointer has to fire at. Deliberately the liquid's middle and not the cavity's, so a beam can
 * never be drawn through the empty head-space above a half-full beaker.
 */
export function liquidMid(box, frac = FILL_FRAC) {
  return (liquidLevel(box, frac) + box.floor) / 2;
}

/**
 * A fixed scatter of grains for a beaker, seeded so every mount of every scene draws the same
 * ones. Returned grains are in beaker-LOCAL coordinates: `gx` 0..1 across the inner width and
 * `gy` 0..1 up the LIQUID column (0 = at the surface, 1 = at the floor), each with a radius in px
 * and a `rank` in 0..1 - the order the grains settle in, first to last. A scene that draws a
 * grain at (box.x + wall + gx*box.iw, box.floor - gy*depth) always draws the same grain; a
 * settling run animates `gy` toward 1 and never re-scatters.
 *
 * `depth` is the liquid depth in px - `box.floor - liquidLevel(box, frac)` - so grains are
 * scattered in the LIQUID, never in the empty head-space above it, and gy 0 is the surface.
 *
 * count 0 returns an empty array; the seed is the caller's so two scenes can differ on purpose.
 */
export function scatterGrains(count, seed = 7, o = {}) {
  const rnd = mulberry32(seed);
  const depth = o.depth ?? 100;                // the liquid depth in px, for clamping
  const rMin = o.rMin ?? 1.5, rMax = o.rMax ?? 3.2;
  const out = [];
  for (let i = 0; i < count; i++) {
    const r = rMin + rnd() * (rMax - rMin);
    out.push({
      gx: 0.08 + rnd() * 0.84,                  // keep grains off the glass wall
      gy: 0.05 + rnd() * 0.90,
      r,
      rank: i / Math.max(1, count - 1),         // 0 settles first, 1 last
      bed: i % 2,                               // which row of the bed it packs into
      spin: rnd() * Math.PI,
    });
  }
  return out;
}

/**
 * Where one grain has got to after `p` (0..1) of a settling run: it keeps its x, its radius and
 * its drawn shape, and only its depth changes - easing in, because a grain falls slowly at first.
 *
 * It settles to `o.settledGy` (default 1, the floor) rather than always to the floor, so a caller
 * with a sediment bed can pack grains into the bed at different heights: every grain landing on
 * exactly gy = 1 draws a single jagged row along the bottom, which reads as a torn edge rather
 * than as a layer of chalk.
 */
export function settledGrain(g, p, o = {}) {
  const t = Math.max(0, Math.min(1, p));
  const to = o.settledGy ?? 1;
  return { ...g, gy: g.gy + (to - g.gy) * t };
}

// -- the set ---------------------------------------------------------------------------------

/**
 * The whole background the bench stands against: the theme backdrop, a wall panel with a lit top
 * edge and a shadowed foot, and the wooden bench itself.
 *
 * `wall` (default true) draws the panel the beam lands on; pass false for a scene whose beam
 * lands somewhere else or whose backdrop is already busy. `floorY` (default the bench y) puts a
 * contact shadow line under the bench so it does not float.
 */
export function drawBenchBackdrop(ctx, c, o = {}) {
  const { x0, x1, y, depth } = o.bench ?? BENCH;
  drawShadow(ctx, c, (x0 + x1) / 2, y + depth + 6, (x1 - x0) / 2 - 20, 10);
  if (o.wall !== false) {
    const w = o.wallRect ?? WALL;
    const base = mix(c.bgSurface, c.label, o.wallLight ?? 0.07);
    rr(ctx, w.x, w.y, w.w, w.h, 12);
    const g = ctx.createLinearGradient(w.x, w.y, w.x + w.w * 0.6, w.y + w.h);   // key light, top left
    g.addColorStop(0, lighten(base, 0.06));
    g.addColorStop(1, darken(base, 0.05));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();                                              // faint wall tiles
    rr(ctx, w.x, w.y, w.w, w.h, 12);
    ctx.clip();
    ctx.strokeStyle = alpha(darken(base, 0.2), 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let ty = w.y + 37; ty < w.y + w.h - 6; ty += 37) { ctx.moveTo(w.x, ty + 0.5); ctx.lineTo(w.x + w.w, ty + 0.5); }
    for (let row = 0, ty = w.y; ty < w.y + w.h; row++, ty += 37) {
      for (let tx = w.x + (row % 2 ? 37 : 0) + 37; tx < w.x + w.w; tx += 74) { ctx.moveTo(tx + 0.5, ty); ctx.lineTo(tx + 0.5, Math.min(ty + 37, w.y + w.h)); }
    }
    ctx.stroke();
    const glow = ctx.createRadialGradient(w.x + w.w * 0.22, w.y + 10, 10, w.x + w.w * 0.22, w.y + 10, w.w * 0.55);
    glow.addColorStop(0, alpha(lighten(base, 0.5), 0.35));
    glow.addColorStop(1, alpha(lighten(base, 0.5), 0));
    ctx.fillStyle = glow;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    const foot = ctx.createLinearGradient(0, w.y + w.h - 34, 0, w.y + w.h);   // soft shade where it meets the bench
    foot.addColorStop(0, alpha(darken(base, 0.35), 0));
    foot.addColorStop(1, alpha(darken(base, 0.35), 0.5));
    ctx.fillStyle = foot;
    ctx.fillRect(w.x, w.y + w.h - 34, w.w, 34);
    ctx.restore();
    ctx.fillStyle = alpha(lighten(c.bgSurface, 0.18), 0.7);
    ctx.fillRect(w.x + 10, w.y + 3, w.w - 20, 3);          // the lit top edge of a wall
  }
  drawBench(ctx, c, x0, x1, y, { h: depth, col: o.benchCol ?? c.gold });
}

/**
 * One empty glass beaker standing on the bench: the far wall seen through the glass, a body, the
 * rolled rim, a highlight down the left and the contact shadow on the bench.
 *
 * Draw it BEFORE `drawLiquid`, or the liquid covers the far wall. `label` (optional) tapes a
 * paper label to the glass at (cx, top + 26) - the stub's own "paper label taped to the glass".
 * Pass no label for a beaker the scene does not name.
 */
export function drawBeaker(ctx, c, box, o = {}) {
  // The glass itself is the kit's (SimGlass), so every bench in the course shares one material.
  drawGlass(ctx, c, glassOf(box), { far: o.far, body: (o.body ?? 0.2) / 0.2, edge: o.edge });
  if (o.label != null) drawPaperLabel(ctx, c, o.label, box.cx, box.y + 26, o.labelCol);
}

/** The SimGlass geometry of a beaker box from `beakerBox`. */
export function glassOf(box) {
  return glassBox('beaker', box.x, box.y, box.w, box.h, { wall: GLASS.wall, r: 9 });
}

/**
 * A paper label taped to the glass: a small pale card, a tape strip across its top, and the text.
 * `col` (optional) tints the paper; it defaults to the palette's own paper tone.
 */
export function drawPaperLabel(ctx, c, text, cx, cy, col, size = 17) {
  const paper = col ?? mix(c.bgSurface, c.label, 0.9);
  ctx.font = font(c, 700, size, true);
  const tw = ctx.measureText(String(text)).width + size + 6;
  const bw = Math.max(size + 16, tw), bh = size + 9;
  ctx.fillStyle = darken(paper, 0.22);                       // the lift under the card
  rr(ctx, cx - bw / 2, cy - bh / 2 + 3, bw, bh, 5);
  ctx.fill();
  ctx.fillStyle = paper;
  rr(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 5);
  ctx.fill();
  ctx.fillStyle = alpha(c.waste, 0.55);                       // the tape
  rr(ctx, cx - bw / 2 + 2, cy - bh / 2 - 3, bw - 4, 7, 2);
  ctx.fill();
  // The letter takes whichever of the two text tokens reads better ON this paper, so a label is
  // legible in both themes rather than dark-on-dark in one of them. `inkOn` takes the palette.
  ctx.fillStyle = inkOn(c, paper);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), cx, cy + 1);
}

/**
 * The liquid inside a beaker, filled to `frac` of the inner depth and clipped to the cavity, with
 * the flat surface line the meniscus would make and a lighter band just under it.
 *
 * Call it AFTER `drawBeaker`. `fill` is a colour the caller chooses (a scattering liquid is not a
 * palette token); `alphaMix` (default 0.85) sets how solid it reads, so an opaque milk and a
 * nearly clear solution use the same call.
 */
export function drawLiquid(ctx, c, box, o = {}) {
  drawGlassLiquid(ctx, c, glassOf(box), {
    level: o.frac ?? FILL_FRAC, fill: o.fill ?? hsl(200, 0.45, 0.55), opacity: o.alphaMix ?? 0.85,
    sheen: o.sheen, surfaceAlpha: o.surface, front: o.front,
  });
}

/**
 * The pale sediment layer a suspension leaves across the bottom of a beaker, `h` px tall, drawn as
 * a soft bed with a gently uneven top edge. Pass h = 0 for none: the function returns rather than
 * drawing a zero-height sliver that reads as a line.
 */
export function drawSediment(ctx, c, box, h, o = {}) {
  if (h <= 0.5) return;
  const fill = o.fill ?? hsl(210, 0.10, 0.86);
  const y = box.floor - h;
  ctx.save();
  ctx.beginPath();
  rr(ctx, box.x + GLASS.wall, y, box.iw, h, 5);
  ctx.clip();
  ctx.fillStyle = alpha(fill, o.alphaMix ?? 0.95);
  ctx.fillRect(box.x + GLASS.wall, y, box.iw, h);
  ctx.fillStyle = alpha(lighten(fill, 0.14), 0.5);            // the soft, uneven top of the bed
  for (let i = 0; i < 4; i++) {
    const bx = box.x + GLASS.wall + i * (box.iw / 4);
    ctx.beginPath();
    ctx.ellipse(bx + box.iw / 8, y + 1, box.iw / 8, 2.6, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The wash that clears the liquid above a sediment bed as a suspension settles: the cloudy liquid
 * fades toward `fill` from the bed's surface up to the liquid's own surface, so "the liquid above
 * it clears" is a drawn difference and not a caption.
 *
 * `depth` is the liquid depth in px and `sedH` the bed's current height; `frac` 0..1 is how far
 * the clearing has got. Call it AFTER `drawSediment` and AFTER `drawGrains`, or the grains it is
 * meant to expose get washed out themselves.
 */
export function drawCleared(ctx, c, box, o = {}) {
  const depth = o.depth ?? box.ih;
  const sedH = o.sedH ?? 0;
  const frac = Math.max(0, Math.min(1, o.frac ?? 0));
  if (frac <= 0.01) return;
  const top = box.floor - depth;
  const y0 = box.floor - sedH;
  ctx.save();
  ctx.beginPath();
  rr(ctx, box.x + GLASS.wall, y0, box.iw, top - y0, 4);
  ctx.clip();
  ctx.fillStyle = alpha(o.fill ?? hsl(198, 0.45, 0.72), (o.alphaMix ?? 0.8) * frac);
  ctx.fillRect(box.x + GLASS.wall, y0, box.iw, top - y0);
  ctx.restore();
}

/**
 * The grains themselves, from `scatterGrains` and (during a run) `settledGrain`. `grains` are
 * drawn at their current local positions; `fill` is the grain colour the caller chose and `depth`
 * the liquid depth in px - the same number the scatter was made against, so a grain cannot be
 * drawn outside the liquid it is suspended in.
 *
 * Draw them AFTER `drawLiquid` - grains in a liquid, not behind it - and BEFORE any beam.
 */
export function drawGrains(ctx, c, box, grains, o = {}) {
  const fill = o.fill ?? hsl(220, 0.18, 0.28);
  const depth = o.depth ?? box.ih;
  const top = box.floor - depth;              // the liquid surface, i.e. gy = 0
  for (const g of grains) {
    const gx = box.x + GLASS.wall + g.gx * box.iw;
    const gy = top + g.gy * depth;            // gy 0 at the surface, 1 on the floor
    ctx.fillStyle = alpha(darken(fill, 0.25), o.alphaMix ?? 0.95);
    ctx.beginPath();
    ctx.ellipse(gx, gy, g.r, g.r * 0.86, g.spin, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(fill, 0.35), 0.7);          // one lit face, so it reads as solid
    ctx.beginPath();
    ctx.ellipse(gx - g.r * 0.28, gy - g.r * 0.3, g.r * 0.42, g.r * 0.36, g.spin, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Chalk grains: the same scatter space as `drawGrains`, but pale. A near-white body built from the
 * glass token, the same white as the filter cake and the lens view, on a small dark contact edge,
 * which is what keeps a white grain visible in a pale cloudy liquid in either theme.
 */
export function drawChalk(ctx, c, box, grains, o = {}) {
  const depth = o.depth ?? box.ih;
  const top = box.floor - depth;              // the liquid surface, i.e. gy = 0
  const edge = alpha(darken(c.waste, 0.12), 0.62);
  const body = lighten(c.glass, 0.97);
  for (const g of grains) {
    const gx = box.x + GLASS.wall + g.gx * box.iw;
    const gy = top + g.gy * depth;
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.ellipse(gx + 0.5, gy + 0.8, g.r + 0.9, g.r * 0.86 + 0.9, g.spin, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(gx, gy, g.r, g.r * 0.86, g.spin, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A round clock dial with a hand that sweeps as `p` runs 0..1, for a face `r` px across.
 * `face` is the dial colour, `hand` the hand's colour, and `ticks` the number of marks around the
 * rim (default 12, minimum 3). Pass `p = null` for a dial with no hand at all.
 *
 * The hand sweeps CLOCKWISE from straight up, which is the way a wall clock's does, so a run that
 * goes 0 to 10 minutes reads as time passing rather than as a dial being wound backwards.
 */
export function drawClock(ctx, c, cx, cy, r, p, o = {}) {
  const face = o.face ?? mix(c.bgSurface, c.label, 0.82);
  ctx.fillStyle = darken(face, 0.25);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alpha(o.ring ?? c.glass, 0.8);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const ticks = Math.max(3, o.ticks ?? 12);
  ctx.strokeStyle = alpha(c.label, 0.5);
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
    const r0 = r * (i % 3 === 0 ? 0.74 : 0.84);
    ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5));
    ctx.stroke();
  }
  if (p != null) {
    const a = (Math.max(0, Math.min(1, p)) * 240 - 90) * (Math.PI / 180);   // 0..240 deg clockwise
    ctx.strokeStyle = o.hand ?? c.gold;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * r * 0.14, cy - Math.sin(a) * r * 0.14);
    ctx.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
    ctx.stroke();
    ctx.fillStyle = o.hand ?? c.gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The laser beam crossing one beaker, drawn in three pieces so a caller can light any of them:
 *   `entry`  a faint stub in the air, from the pointer head to the glass it enters
 *   `inside` the path through the liquid - ONLY for a scattering liquid, and this is the whole
 *            difference between a beaker that shows the beam and one that does not
 *   `exit`   a faint stub onward, out the far side, to a soft patch on the wall
 *
 * The beam always runs RIGHT to LEFT (the pointer stands to the right of the beaker it lights, as
 * in Fig. 5.3, and the glow lands on the wall to the left), so `headX` is expected to be right of
 * `box` and `wallX` left of it; both default to a short stub clear of the glass either way.
 *
 * `lit` false draws nothing at all, so an unlit beam is genuinely absent rather than drawn dim.
 * `insideColor` defaults to the palette's own red, and the entry stub, the path and the wall patch
 * are all tinted from it, so one caller cannot end up with a green path and a red patch.
 */
export function drawBeam(ctx, c, box, o = {}) {
  if (o.lit === false) return;
  const col = o.insideColor ?? c.bad;
  const y = o.y ?? liquidMid(box, o.frac ?? FILL_FRAC);
  const xIn = box.x + box.w - GLASS.wall;          // the inner face the beam enters
  const xOut = box.x + GLASS.wall;                 // the inner face it leaves by
  if (o.entry !== false) {
    ctx.strokeStyle = alpha(col, o.entryAlpha ?? 0.55);
    ctx.lineWidth = o.thin ?? 2;
    ctx.beginPath();
    ctx.moveTo(o.headX ?? xIn + 26, y);
    ctx.lineTo(xIn, y);
    ctx.stroke();
  }
  if (o.inside !== false) {
    ctx.strokeStyle = alpha(col, o.insideAlpha ?? 0.5);
    ctx.lineWidth = o.glow ?? 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xIn, y);
    ctx.lineTo(xOut, y);
    ctx.stroke();
    ctx.strokeStyle = alpha(lighten(col, 0.25), o.coreAlpha ?? 0.95);
    ctx.lineWidth = o.core ?? 2.5;
    ctx.beginPath();
    ctx.moveTo(xIn, y);
    ctx.lineTo(xOut, y);
    ctx.stroke();
  }
  if (o.exit !== false) {
    const wallX = o.wallX ?? xOut - 36;
    ctx.strokeStyle = alpha(col, o.exitAlpha ?? 0.45);
    ctx.lineWidth = o.thin ?? 2;
    ctx.beginPath();
    ctx.moveTo(xOut, y);
    ctx.lineTo(wallX, y);
    ctx.stroke();
    const pr = o.patch ?? 15;
    ctx.fillStyle = alpha(col, o.patchAlpha ?? 0.3);
    ctx.beginPath();
    ctx.arc(wallX, y, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.3), 0.35);
    ctx.beginPath();
    ctx.arc(wallX, y, pr * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The small red pointer on its pivot stand, in the gap BESIDE the beaker it lights - never at the
 * bench end, because a beam from there would have to cross the other beakers' glass.
 *
 * `cx` is the centre of the unit, `baseY` the bench surface it stands on, `lit` whether it is
 * firing, `headY` the y the beam leaves at - pass the same y as `drawBeam` or the beam will leave
 * the head somewhere else. The head sits on the LEFT face, because the beam fires leftward.
 * `label` (optional) tapes a small paper tag well above the beam.
 */
export function drawPointer(ctx, c, cx, baseY, o = {}) {
  const h = o.bodyH ?? 20;                        // a pointer, not a bead on a stick
  const headY = o.headY ?? baseY - 44;            // where the beam leaves, so the two always agree
  const top = headY - h / 2;
  const hx = o.headX ?? cx - 30;                  // the head, on the side that fires
  const glow = o.lit !== false ? c.bad : mix(c.stroke, c.label, 0.3);

  ctx.fillStyle = alpha(c.gold, 0.55);                       // the base plate
  rr(ctx, cx - 22, baseY - 4, 44, 6, 3);
  ctx.fill();
  ctx.fillStyle = darken(c.waste, 0.2);                      // the pivot stand, up to the body
  rr(ctx, cx - 5, top + h, 10, Math.max(6, baseY - top - h), 3);
  ctx.fill();
  ctx.fillStyle = alpha(c.waste, 0.5);                       // its pivot knuckle
  rr(ctx, cx - 8, top + h - 3, 16, 10, 4);
  ctx.fill();

  // the barrel the beam leaves from, then the body behind it
  ctx.fillStyle = darken(c.stroke, 0.3);
  rr(ctx, hx, headY - 4, 14, 8, 2);
  ctx.fill();
  ctx.fillStyle = darken(c.stroke, 0.12);                    // the body
  rr(ctx, hx + 12, top, 34, h, 5);
  ctx.fill();
  ctx.fillStyle = alpha(c.label, 0.16);                      // its top face
  rr(ctx, hx + 16, top + 2, 26, 4, 2);
  ctx.fill();
  ctx.fillStyle = alpha(c.gold, 0.75);                       // its switch
  rr(ctx, hx + 30, top + 5, 6, h - 10, 2);
  ctx.fill();
  ctx.fillStyle = darken(glow, 0.45);                        // the lens collar
  rr(ctx, hx - 2, headY - 5, 5, 10, 2);
  ctx.fill();
  ctx.fillStyle = glow;                                      // the lens
  ctx.beginPath();
  ctx.arc(hx + 1, headY, 3.4, 0, Math.PI * 2);
  ctx.fill();
  if (o.lit !== false) {                                     // lit, it throws a small halo
    ctx.fillStyle = alpha(lighten(glow, 0.35), 0.55);
    ctx.beginPath();
    ctx.arc(hx + 1, headY, 6.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (o.label != null) drawPaperLabel(ctx, c, o.label, cx, top - 14, o.labelCol, 13);
}

/**
 * A small caption card on the bench, for a scene that needs one line of its own text beside the
 * glassware - the settling scene's compression note, say. Returns nothing; `text` is drawn once,
 * left-aligned inside a card at (x, y) of the given size.
 */
export function drawBenchCard(ctx, c, text, x, y, w, o = {}) {
  const h = o.h ?? 52;
  drawCard(ctx, c, x, y, w, h, o.a ?? 0.92, { accent: o.accent, r: 10 });
  ctx.font = font(c, 600, 14);
  ctx.fillStyle = o.col ?? c.label;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const lines = String(text).split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 12, y + h / 2 + (i - (lines.length - 1) / 2) * 18);
  });
}