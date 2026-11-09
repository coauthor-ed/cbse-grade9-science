// CentrifugeBenchKit.js - the bench the L07 centrifuge scenes stand their tube on.
// Written by the BloodSpinScene run and shared with CentrifugeScene.
//
// It is BENCHWARE, not lesson state. Nothing in this file knows what a buffy coat is, what a
// "useful speed" is, or which slide is mounted. A scene passes in its own numbers, its own bands,
// its own beat map and its own words. If two scenes must agree on something, that is a shared
// CONSTANT or a shared FUNCTION here, never a shared field.
//
// Never import a scene from here or from a scene. Scene files carry their own beat maps and their
// own answer state, and importing one leaks its verdict onto a slide that must not have it.
//
// Design space is 680 x 520 (SimLook W / H). Every function takes explicit design-space x/y/w/h and
// never reads ZONES itself, so a scene lays the bench out however its own content needs.
//
// Colours: every function takes the resolved palette `c` from loadColors and uses only `c.<key>`,
// the SimLook derivates mix / alpha / lighten / darken, and hsl() for tones that must not drift
// between themes. There is no hex literal and no new --sim-* token anywhere in this file.

import {
  alpha, darken, hsl, lighten, mix, rr, font, drawShadow, luma,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, glassPath, drawGlass, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

/** Clamp any value into 0..1. Every fraction an outside caller supplies goes through this. */
export function clamp01(v) {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

/**
 * The one biological palette in the kit: what a column of blood looks like, as four tones.
 * `mixed` is the uniform dark red an unsorted sample is; the other three are what it resolves into.
 * The split between the three is NOT here - that is the scene's model number - only the colours,
 * so no two scenes in the chapter can draw the same layer in two different reds.
 */
export const BLOOD_TONES = {
  mixed: hsl(353, 0.66, 0.30),      // one uniform dark red column, top to bottom
  cells: hsl(351, 0.72, 0.23),      // the dense opaque packed red at the bottom
  coat: hsl(40, 0.30, 0.90),        // the thin pale line: platelet-and-white-cell buff, near white
  plasma: hsl(46, 0.78, 0.64),      // straw-yellow and slightly cloudy, never clear
};

/** The smallest stop gap that still renders as a hard edge rather than a hair of blend. */
const HARD = 0.0006;

/** The blue cap a blood tube is sealed with, from the theme's water token so it stays blue in both. */
export function capTone(c) {
  return mix(c.water, c.bgDeep, 0.22);
}

/** Oak: the rack a capped tube stands in. Warm in both themes, and darker than the bench it stands on. */
export function woodTone(c) {
  return darken(mix(c.gold, c.bad, 0.30), 0.30);
}

// ---------------------------------------------------------------------------------------------
// The tube
// ---------------------------------------------------------------------------------------------

/** The rounded-bottom outline of a test tube. Public so a caller can clip its own contents to it. */
export function tubePath(ctx, x, y, w, h, r) {
  const rad = Math.max(1, Math.min(r ?? w / 2, w / 2, h));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h - rad);
  ctx.quadraticCurveTo(x, y + h, x + rad, y + h);
  ctx.lineTo(x + w - rad, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - rad);
  ctx.lineTo(x + w, y);
  ctx.closePath();
}

/**
 * drawTube(ctx, c, o) - one cylindrical glass tube with a rounded bottom, standing upright.
 * o: { x, y, w, h, cap = true, rim = true, glass = 0.5 }
 * Contract: `x/y/w/h` is the OUTER box. The glass is filled first and the contents go on top of it,
 * so a caller paints: drawTube -> contents -> drawTubeSheen. It draws no label and no liquid.
 * Returns the inner box { x, y, w, h }, inset by WALL, which is where contents belong.
 */
export const WALL = 5;                 // the glass wall thickness in design-space px

export function drawTube(ctx, c, o) {
  const { x, y, w, h } = o;
  // The glass is the kit's (SimGlass); `glass` still scales how much tint the body carries.
  // The cavity keeps the old pale tint: a thin pale band between strata reads against it.
  const k = o.glass ?? 0.5;
  drawGlass(ctx, c, glassBox('tube', x, y, w, h, { wall: WALL }), { shadow: false, rim: o.rim !== false, far: luma(c.bgDeep) > 0.5 ? k * 2 : k });
  return { x: x + WALL, y: y + WALL, w: w - WALL * 2, h: h - WALL * 2 - 4 };
}

/** The cap: a blue screw cap standing proud of the mouth. Draw AFTER the contents. */
export function drawTubeCap(ctx, c, o) {
  const { x, y, w, h = 20 } = o;
  const over = 5;                       // a cap overhangs the tube it closes
  const cx = x + w / 2, hw = w / 2 + over;
  const col = capTone(c);
  ctx.save();
  rr(ctx, cx - hw, y, hw * 2, h, 6);
  ctx.fillStyle = darken(col, 0.3);     // the body of the cap
  ctx.fill();
  rr(ctx, cx - hw, y, hw * 2, h * 0.52, 6);
  ctx.fillStyle = col;                  // its lit top half
  ctx.fill();
  ctx.strokeStyle = alpha(darken(col, 0.45), 0.9);
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 2; i++) {        // two grip ridges, so it reads as a screw cap
    const gy = y + (h * i) / 3;
    ctx.beginPath(); ctx.moveTo(cx - hw + 3, gy); ctx.lineTo(cx + hw - 3, gy); ctx.stroke();
  }
  ctx.restore();
}

/** The highlight down the lit side of a tube, drawn over the contents. */
export function drawTubeSheen(ctx, c, o) {
  drawGlassFront(ctx, c, glassBox('tube', o.x, o.y, o.w, o.h, { wall: WALL }));
}

// ---------------------------------------------------------------------------------------------
// Strata inside the tube
// ---------------------------------------------------------------------------------------------

/**
 * paintStrata(ctx, c, o) - one column of liquid in bands, as a spun sample resolves into them.
 * o: {
 *   x, y, w, h        the column's own box; the box is filled edge to edge
 *   u                0..1, how far the sorting has run. At u = 0 the column is `mixed` everywhere
 *                    and has no boundary at all; the bands only ever sum to u, so the liquid
 *                    never disappears - it only becomes legible. That is what the bands being
 *                    "there all along" means in a drawing.
 *   bands            [{ frac, col }] from the TOP of the column down. frac is the band's share
 *                    of the column at u = 1; the caller's model, not the kit's.
 *   soft             0..1, the width of each moving interface as a share of the column. 0 gives the
 *                    hard flat edges a settled sample has.
 *   mixed            the colour of the not-yet-sorted part.
 * }
 * Contract: one gradient over the column, so it is cheap enough to call every frame. Interiors are
 * flat; only the interfaces blend.
 */
export function paintStrata(ctx, c, o) {
  const { x, y, w, h } = o;
  const u = clamp01(o.u);
  const bands = (o.bands ?? []).filter((b) => b.frac > 0);
  const mixed = o.mixed ?? BLOOD_TONES.mixed;
  const softFrac = clamp01(o.soft ?? 0);

  ctx.save();
  ctx.fillStyle = mixed;
  ctx.fillRect(x, y, w, h);
  if (u <= 0 || !bands.length) { ctx.restore(); return; }

  const g = ctx.createLinearGradient(0, y, 0, y + h);
  const stops = [{ at: 0, col: mixed }];
  let prev = mixed;
  let acc = 0;
  for (let i = 0; i < bands.length; i++) {
    const col = bands[i].col;
    const frac = bands[i].frac;
    const enter = acc;
    acc += frac * u;
    const exit = acc;
    const next = i + 1 < bands.length ? bands[i + 1].col : mixed;
    // A band's own thickness bounds how soft its interfaces can be: two fades may not eat it.
    const room = Math.min(1, (exit - enter) / Math.max(1e-6, frac * u));
    const wIn = enter <= HARD ? 0 : Math.min(softFrac, room * 0.45);
    const wOut = exit >= 1 - HARD ? 0 : Math.min(softFrac, room * 0.45);
    push(stops, enter, wIn, prev, col);
    push(stops, exit, wOut, col, next);
    prev = col;
  }
  stops.push({ at: 1, col: prev });        // below the sorted part the column is mixed again
  for (const s of stops) g.addColorStop(Math.max(0, Math.min(1, s.at)), s.col);

  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function push(stops, edge, soft, before, after) {
  const half = Math.max(soft, HARD) / 2;
  stops.push({ at: edge - half, col: before });
  stops.push({ at: edge + half, col: after });
}

// ---------------------------------------------------------------------------------------------
// The rack, the dial, the lens
// ---------------------------------------------------------------------------------------------

/**
 * drawRack(ctx, c, o) - a wooden test-tube rack: a slab with drilled holes the tubes drop into.
 * o: { x, y, w, h = 56, holes = [{ cx, r }] }
 * Contract: `y` is the TOP edge of the rack and `y + h` is the bench it stands on. A hole is a dark
 * ring, not a hole cut through, so a tube drawn behind the rack still reads as standing in it.
 */
export function drawRack(ctx, c, o) {
  const { x, y, w, h = 56 } = o;
  const wood = woodTone(c);
  drawShadow(ctx, c, x + w / 2, y + h + 4, w * 0.46, 8);
  ctx.save();
  rr(ctx, x, y, w, h, 7);
  ctx.fillStyle = darken(wood, 0.22);
  ctx.fill();
  rr(ctx, x, y, w, h * 0.34, 7);
  ctx.fillStyle = lighten(wood, 0.16);   // the lit top face
  ctx.fill();
  ctx.strokeStyle = alpha(darken(wood, 0.45), 0.8);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (const ho of o.holes ?? []) {      // the drilled holes, ringed so a tube sits in one
    ctx.beginPath();
    ctx.arc(ho.cx, y + h * 0.42, ho.r, 0, Math.PI * 2);
    ctx.fillStyle = darken(wood, 0.55);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ho.cx, y + h * 0.42, ho.r, Math.PI * 0.95, Math.PI * 2.05);
    ctx.strokeStyle = alpha(darken(wood, 0.6), 0.9);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * drawBenchTop(ctx, c, o) - the bench the rack and the machine stand on: a slab with a lit top
 * edge, a front apron and a contact shadow. `y` is the TOP surface, so a thing whose base is at
 * `y` sits on it.
 * o: { x0, x1, y, legs = true }
 */
export function drawBenchTop(ctx, c, o = {}) {
  const x0 = o.x0 ?? 16, x1 = o.x1 ?? 664, y = o.y ?? 396;
  const h = 22;
  drawShadow(ctx, c, (x0 + x1) / 2, y + h + 20, (x1 - x0) * 0.46, 10);
  ctx.save();
  ctx.fillStyle = darken(c.gold, 0.34);
  if (o.legs !== false) {
    ctx.fillRect(x0 + 22, y + h, 15, 22);
    ctx.fillRect(x1 - 37, y + h, 15, 22);
  }
  ctx.fillStyle = darken(c.gold, 0.16);
  ctx.fillRect(x0, y + 4, x1 - x0, h);
  ctx.fillStyle = c.gold;                          // the lit top face
  ctx.fillRect(x0, y, x1 - x0, 6);
  ctx.fillStyle = lighten(c.gold, 0.3);
  ctx.fillRect(x0, y, x1 - x0, 2);
  ctx.strokeStyle = alpha(darken(c.gold, 0.5), 0.55);
  ctx.lineWidth = 1;
  for (let x = x0 + 66; x < x1 - 30; x += 74) {   // faint board seams
    ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x, y + 5); ctx.stroke();
  }
  ctx.restore();
}

/**
 * drawShelfTop(ctx, c, o) - a wall shelf: a thinner board on two brackets, no apron and no legs,
 * because nothing stands on it but one tube. `y` is its top surface, as for drawBenchTop.
 * o: { x0, x1, y }
 */
export function drawShelfTop(ctx, c, o = {}) {
  const x0 = o.x0 ?? 16, x1 = o.x1 ?? 664, y = o.y ?? 356;
  const h = 13;
  ctx.save();
  ctx.fillStyle = darken(c.gold, 0.5);
  for (const bx of [x0 + 34, x1 - 58]) {
    ctx.beginPath();
    ctx.moveTo(bx, y + h);
    ctx.lineTo(bx + 24, y + h);
    ctx.lineTo(bx, y + h + 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = darken(c.gold, 0.2);
  ctx.fillRect(x0, y + 5, x1 - x0, h);
  ctx.fillStyle = c.gold;
  ctx.fillRect(x0, y, x1 - x0, 6);
  ctx.fillStyle = lighten(c.gold, 0.28);
  ctx.fillRect(x0, y, x1 - x0, 2);
  ctx.restore();
}

/**
 * drawDial(ctx, c, o) - the knob a learner turns, with the stops spelled beside it.
 * o: { cx, cy, r = 40, v = 0..1, label, stops = ['off','low','high'] }
 * Contract: the arc runs from -135 deg (v = 0, lower left) to +135 deg (v = 1, lower right), so a
 * caller's `v` is the same number everywhere. Draws no warning state: a value below the useful
 * range simply sits where it sits.
 * Returns the knob centre and radius so the caller can hit-test a drag on it.
 */
export function drawDial(ctx, c, o) {
  const cx = o.cx, cy = o.cy, r = o.r ?? 40;
  const v = clamp01(o.v);
  const A0 = Math.PI * 0.75, A1 = Math.PI * 2.25;
  const ang = A0 + (A1 - A0) * v;
  const kx = cx + Math.cos(ang) * r * 0.66;
  const ky = cy + Math.sin(ang) * r * 0.66;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = c.track;
  ctx.beginPath(); ctx.arc(cx, cy, r, A0, A1); ctx.stroke();
  ctx.strokeStyle = mix(c.accent, c.label, 0.1);
  ctx.beginPath(); ctx.arc(cx, cy, r, A0, ang); ctx.stroke();
  const stops = o.stops ?? [];
  stops.forEach((s, i) => {                     // the stops, each at its own angle along the arc
    const sv = stops.length > 1 ? i / (stops.length - 1) : 0;
    const a = A0 + (A1 - A0) * sv;
    const lx = cx + Math.cos(a) * (r + 13), ly = cy + Math.sin(a) * (r + 13);
    ctx.fillStyle = c.labelMuted;
    ctx.font = font(c, 600, 13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, lx, ly);
  });
  ctx.beginPath(); ctx.arc(kx, ky, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = mix(c.accent, c.label, 0.25);
  ctx.fill();
  ctx.beginPath(); ctx.arc(kx, ky, r * 0.3, 0, Math.PI * 2);
  ctx.strokeStyle = darken(c.accent, 0.35);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  if (o.label) {
    ctx.fillStyle = c.label;
    ctx.font = font(c, 700, 13, true);
    ctx.fillText(o.label, cx, cy + r + 34);
  }
  ctx.restore();
  return { cx: kx, cy: ky, r: r * 0.42 };
}

/** The circular path of a magnifier lens, so a caller can clip its own enlarged view inside it. */
export function lensPath(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
}

/**
 * drawLens(ctx, c, o) - a hand lens: the rim, the glass and the handle hanging off it.
 * o: { cx, cy, r = 60, handle = 'down' | 'up' | 'none', angle }
 * Contract: draws the frame ONLY. The caller clips its own view to `lensPath` at the same cx/cy/r
 * and calls drawLens after it, so the enlarged view sits inside the glass. Handle points down-right
 * by default.
 */
export function drawLens(ctx, c, o) {
  const cx = o.cx, cy = o.cy, r = o.r ?? 60;
  const ang = o.angle ?? Math.PI / 4;
  ctx.save();
  if (o.handle !== 'none') {                   // the handle first, so the rim overlaps its collar
    const hx = cx + Math.cos(ang) * (r + 12), hy = cy + Math.sin(ang) * (r + 12);
    ctx.strokeStyle = darken(c.gold, 0.4);
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r * 0.9, cy + Math.sin(ang) * r * 0.9);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.gold, 0.2), 0.6);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r * 0.9, cy + Math.sin(ang) * r * 0.9);
    ctx.lineTo(hx, hy);
    ctx.stroke();
  }
  lensPath(ctx, cx, cy, r);
  ctx.fillStyle = alpha(c.glass, 0.16);        // the glass itself, barely there
  ctx.fill();
  ctx.strokeStyle = darken(c.gold, 0.25);
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = alpha(lighten(c.gold, 0.3), 0.85);
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// A sample tube, filled: glass, a liquid column clipped to the round bottom, a meniscus, the cap
// ---------------------------------------------------------------------------------------------

/**
 * paintSpun(ctx, o) - a column as a spin (or a long wait) sorts it. Unlike paintStrata, the sorted
 * bands grow in from BOTH ends: the light ones from the top down, the heavy ones from the bottom up,
 * and the still-mixed sample is the shrinking middle. That is how a real tube clears.
 * o: { x, y, w, h, u 0..1, top: [{ frac, col }] (top down), bottom: [{ frac, col }] (top down),
 *      mixed, soft 0..1 (the width of the moving edges, as a share of the column) }
 * At u = 1 the fracs should sum to 1 and the middle is gone.
 */
export function paintSpun(ctx, o) {
  const { x, y, w, h } = o;
  const u = clamp01(o.u);
  const mixed = o.mixed ?? BLOOD_TONES.mixed;
  const soft = clamp01(o.soft ?? 0);
  const top = (o.top ?? []).filter((b) => b.frac > 0);
  const bot = (o.bottom ?? []).filter((b) => b.frac > 0);
  ctx.save();
  ctx.fillStyle = mixed;
  ctx.fillRect(x, y, w, h);
  if (u > 0) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    const stops = [];
    let at = 0;
    let prev = top.length ? top[0].col : mixed;
    for (let i = 0; i < top.length; i++) {
      const s = top[i];
      if (i > 0) edge(stops, at, Math.min(soft, s.frac * u * 0.45), prev, s.col);
      else stops.push({ at: 0, col: s.col });
      at += s.frac * u;
      prev = s.col;
    }
    const topEnd = at;
    const botH = bot.reduce((a, b) => a + b.frac * u, 0);
    const botStart = 1 - botH;
    if (botStart - topEnd > 1e-4) {
      edge(stops, topEnd, soft, prev, mixed);
      prev = mixed;
    }
    at = botStart;
    for (const s of bot) {
      edge(stops, at, at <= topEnd + 1e-4 ? HARD : Math.min(soft, s.frac * u * 0.45), prev, s.col);
      at += s.frac * u;
      prev = s.col;
    }
    stops.push({ at: 1, col: prev });
    if (!top.length) stops.unshift({ at: 0, col: mixed });
    for (const s of stops) g.addColorStop(Math.max(0, Math.min(1, s.at)), s.col);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function edge(stops, at, soft, before, after) {
  const half = Math.max(soft, HARD) / 2;
  stops.push({ at: at - half, col: before });
  stops.push({ at: at + half, col: after });
}

/**
 * drawSampleTube(ctx, c, o) - one capped sample tube with a liquid column in it, upright in its own
 * frame (mouth at y, round bottom at y + h). Rotate the frame to lay it in a bucket.
 * o: { x, y, w, h, fill = 0.84 (share of the cavity the liquid fills), paint(ctx, col) (draws the
 *      column into col = { x, y, w, h }, already clipped to the glass), surface (the colour at the
 *      top of the column, for the meniscus), cap = true, capH, shadow = false }
 * Returns { g, col } - the glass geometry and the column box, for a lens or a label leader.
 */
export function drawSampleTube(ctx, c, o) {
  const { x, y, w, h } = o;
  const wall = o.wall ?? Math.max(3, Math.min(WALL, Math.round(w * 0.12)));
  const g = glassBox('tube', x, y, w, h, { wall });
  const capH = o.capH ?? Math.max(10, Math.round(w * 0.55));
  drawGlass(ctx, c, g, { shadow: !!o.shadow, rim: o.cap === false });
  const inner = g.inner;
  const sy = g.floor - inner.h * clamp01(o.fill ?? 0.84);
  const col = { x: inner.x, y: sy, w: inner.w, h: g.floor - sy };
  const lift = Math.min(5, inner.w * 0.12);
  ctx.save();
  glassPath(ctx, g, inner);
  ctx.clip();
  ctx.beginPath();                                   // the concave surface: liquid climbs both walls
  ctx.moveTo(inner.x, sy - lift);
  ctx.quadraticCurveTo(inner.x + inner.w / 2, sy + lift * 0.7, inner.x + inner.w, sy - lift);
  ctx.lineTo(inner.x + inner.w, g.floor + 2);
  ctx.lineTo(inner.x, g.floor + 2);
  ctx.closePath();
  ctx.clip();
  o.paint?.(ctx, { x: col.x, y: sy - lift, w: col.w, h: col.h + lift });
  const sc = o.surface;
  if (sc) {                                          // the lit skin of the meniscus
    ctx.beginPath();
    ctx.moveTo(inner.x, sy - lift);
    ctx.quadraticCurveTo(inner.x + inner.w / 2, sy + lift * 0.7, inner.x + inner.w, sy - lift);
    ctx.strokeStyle = alpha(lighten(sc, 0.5), 0.9);
    ctx.lineWidth = Math.max(1.5, inner.w * 0.05);
    ctx.stroke();
  }
  // Round body: the contents darken toward the far wall and catch the light near the lit one.
  const sg = ctx.createLinearGradient(inner.x, 0, inner.x + inner.w, 0);
  sg.addColorStop(0, alpha(lighten(c.glass, 0.7), 0.16));
  sg.addColorStop(0.3, alpha(lighten(c.glass, 0.7), 0));
  sg.addColorStop(0.7, alpha(darken(c.bgDeep, 0.6), 0));
  sg.addColorStop(1, alpha(darken(c.bgDeep, 0.6), 0.22));
  ctx.fillStyle = sg;
  ctx.fillRect(inner.x, sy - lift, inner.w, col.h + lift);
  ctx.restore();
  drawGlassFront(ctx, c, g, { shade: 0 });
  if (o.cap !== false) drawTubeCap(ctx, c, { x, y: y - capH + Math.round(capH * 0.35), w, h: capH });
  return { g, col };
}

// ---------------------------------------------------------------------------------------------
// The machine: a bench centrifuge with a swing-out rotor, front wall cut away
// ---------------------------------------------------------------------------------------------

/**
 * drawCentrifuge(ctx, c, o) - a bench centrifuge seen from the front, its front wall cut away to
 * show the bowl: a motor post, the spindle, a two-arm rotor and two swing-out buckets hanging from
 * pins at the arm ends. At rest the buckets hang straight down; with `swing` = 1 they stand straight
 * out, the tube bottoms pointing away from the spindle. The two buckets are always drawn the same,
 * so the rotor is balanced.
 *
 * Spin is shown the way a textbook cutaway shows it: the two buckets are drawn in the plane of the
 * cut, and the turning is the swept ring their path makes, streaks running round it, a curved arrow
 * over the hub and the rpm on the front panel. The lid is shut whenever the rotor turns.
 *
 * o: { cx, base (the bench top), w = 284, h = 190, lid 0..1 (1 = standing open), swing 0..1,
 *      spin (rad, the streak phase), omega 0..1 (how fast; 0 draws no motion), rpm (number, or null for a blank read-out),
 *      arm = 28, bucketW = 30, bucketH = 92,
 *      tube(ctx, i, box) draws tube i (0 right, 1 left) in the bucket frame: box is the tube's
 *      outer box, mouth toward the pin, bottom away from it. }
 * Returns { top, bottom, hub, chamber, lidTop, tip(i), frame(i) } in design space.
 */
export function drawCentrifuge(ctx, c, o) {
  const cx = o.cx, base = o.base;
  const W = o.w ?? 284, H = o.h ?? 190;
  const lid = clamp01(o.lid), omega = clamp01(o.omega);
  const sw = clamp01(o.swing);
  const phi = (Math.PI / 2) * (sw * sw * (3 - 2 * sw));
  const arm = o.arm ?? 28, bw = o.bucketW ?? 30, bh = o.bucketH ?? 92;
  const x0 = cx - W / 2, bottom = base - 8, top = bottom - H;
  const ch = { x0: x0 + 14, x1: x0 + W - 14, y0: top + 10, y1: bottom - 44, r: 44 };
  const hub = { x: cx, y: ch.y0 + 34 };
  const shell = mix(c.raised, c.stroke, 0.35);
  const lidCol = mix(c.shape, c.raised, 0.18);
  const well = darken(mix(c.stroke, c.label, 0.3), 0.58);
  const metal = lighten(c.stroke, 0.38);
  const frames = [
    { x: cx + arm, y: hub.y, a: -phi },
    { x: cx - arm, y: hub.y, a: phi },
  ];
  const tipOf = (f) => ({ x: f.x - Math.sin(f.a) * bh, y: f.y + Math.cos(f.a) * bh });

  ctx.save();
  drawShadow(ctx, c, cx, base + 2, W * 0.5, 9);
  ctx.fillStyle = darken(shell, 0.5);                // four rubber feet
  for (const dx of [-0.4, -0.15, 0.15, 0.4]) { rr(ctx, cx + dx * W - 10, bottom - 2, 20, 10, 4); ctx.fill(); }

  // The lid, standing open behind the body: its inner face, a viewing window and the grip.
  const oh = (o.lidRise ?? 84) * lid;
  const lidTop = top - 12 - oh;
  if (lid > 0.02) {
    rr(ctx, x0 + 10, lidTop, W - 20, oh + 26, 16);
    ctx.fillStyle = darken(lidCol, 0.12);
    ctx.fill();
    ctx.strokeStyle = alpha(darken(lidCol, 0.45), 0.9);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (oh > 30) {
      rr(ctx, cx - W * 0.28, lidTop + 14, W * 0.56, oh - 18, 10);
      ctx.fillStyle = alpha(mix(c.glass, well, 0.55), 0.85);
      ctx.fill();
      ctx.fillStyle = alpha(lighten(c.glass, 0.8), 0.35);
      ctx.fillRect(cx - W * 0.24, lidTop + 20, W * 0.12, 4);
    }
    rr(ctx, cx - 30, lidTop - 6, 60, 12, 6);
    ctx.fillStyle = darken(lidCol, 0.3);
    ctx.fill();
  }

  // The body: a rounded shell, lit along its top, with a darker skirt.
  rr(ctx, x0, top, W, H, 20);
  ctx.fillStyle = shell;
  ctx.fill();
  ctx.save();
  rr(ctx, x0, top, W, H, 20);
  ctx.clip();
  ctx.fillStyle = darken(shell, 0.12);
  ctx.fillRect(x0, bottom - 40, W, 40);
  ctx.fillStyle = alpha(lighten(shell, 0.5), 0.6);
  ctx.fillRect(x0, top, W, 3);
  ctx.restore();
  rr(ctx, x0, top, W, H, 20);
  ctx.strokeStyle = alpha(darken(shell, 0.45), 0.9);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // The cut: the bowl inside, darker toward the floor.
  const bowl = () => {
    ctx.beginPath();
    ctx.moveTo(ch.x0, ch.y0);
    ctx.lineTo(ch.x1, ch.y0);
    ctx.lineTo(ch.x1, ch.y1 - ch.r);
    ctx.quadraticCurveTo(ch.x1, ch.y1, ch.x1 - ch.r, ch.y1);
    ctx.lineTo(ch.x0 + ch.r, ch.y1);
    ctx.quadraticCurveTo(ch.x0, ch.y1, ch.x0, ch.y1 - ch.r);
    ctx.closePath();
  };
  bowl();
  const bg = ctx.createLinearGradient(0, ch.y0, 0, ch.y1);
  bg.addColorStop(0, lighten(well, 0.1));
  bg.addColorStop(1, darken(well, 0.25));
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.save();
  bowl();
  ctx.clip();
  ctx.strokeStyle = alpha(lighten(well, 0.25), 0.5);  // the back wall's curve, so the bowl reads round
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, ch.y1 - 26, (ch.x1 - ch.x0) * 0.46, 16, 0, 0, Math.PI);
  ctx.stroke();

  // The motor post and the spindle.
  ctx.fillStyle = darken(metal, 0.35);
  ctx.beginPath();
  ctx.ellipse(cx, ch.y1 - 2, 18, 12, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = darken(metal, 0.15);
  rr(ctx, cx - 5, hub.y, 10, ch.y1 - hub.y - 10, 4);
  ctx.fill();

  // The turning: the ring the bucket tips sweep, seen a little from above.
  const reach = Math.max(arm + bw / 2, arm + Math.sin(phi) * bh + Math.cos(phi) * bw / 2);
  const ringY = hub.y + Math.cos(phi) * bh * 0.55;
  const ry = 10 + 12 * Math.sin(phi);
  if (omega > 0) {
    ctx.strokeStyle = alpha(metal, 0.12 + 0.16 * omega);
    ctx.lineWidth = bw * 0.9;
    ctx.beginPath();
    ctx.ellipse(cx, ringY, reach - bw * 0.35, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // The buckets, each with its tube, hanging from the pins at the arm ends.
  for (let i = 0; i < 2; i++) {
    const f = frames[i];
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.a);
    ctx.strokeStyle = metal;                         // the two trunnion straps up to the pin
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-bw / 2 + 2, 10); ctx.lineTo(0, 0); ctx.lineTo(bw / 2 - 2, 10);
    ctx.stroke();
    const cup = () => {
      ctx.beginPath();
      ctx.moveTo(-bw / 2, 8);
      ctx.lineTo(-bw / 2, bh - bw / 2);
      ctx.arc(0, bh - bw / 2, bw / 2, Math.PI, 0, true);
      ctx.lineTo(bw / 2, 8);
    };
    cup();
    ctx.fillStyle = alpha(darken(metal, 0.4), 0.55);  // the bucket's back half, seen past the tube
    ctx.fill();
    const tw = bw - 10;
    o.tube?.(ctx, i, { x: -tw / 2, y: 18, w: tw, h: bh - 22 });
    cup();
    ctx.strokeStyle = metal;                         // the cut edge of the bucket wall
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = metal;
    rr(ctx, -bw / 2 - 2, 6, bw + 4, 6, 3);           // the bucket's collar
    ctx.fill();
    ctx.restore();
  }

  // The rotor: a yoke across the spindle, a hub and the two pins.
  ctx.fillStyle = metal;
  rr(ctx, cx - arm - 6, hub.y - 6, (arm + 6) * 2, 12, 6);
  ctx.fill();
  ctx.strokeStyle = alpha(darken(metal, 0.5), 0.8);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, hub.y, 11, 0, Math.PI * 2);
  ctx.fillStyle = lighten(metal, 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, hub.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = darken(metal, 0.4);
  ctx.fill();
  for (const f of frames) {
    ctx.beginPath(); ctx.arc(f.x, f.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(metal, 0.3);
    ctx.fill();
  }

  if (omega > 0) {
    // Streaks running round the near half of the ring, faster dial, longer and brighter streaks.
    const len = 0.25 + 0.5 * omega;
    ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const a0 = (o.spin ?? 0) + (k * Math.PI) / 2;
      const a = ((a0 % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (a > Math.PI) continue;                     // only the near half crosses in front
      ctx.strokeStyle = alpha(lighten(metal, 0.5), 0.25 + 0.45 * omega);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, ringY, reach, ry + 4, 0, Math.max(0, a - len), a);
      ctx.stroke();
    }
    // The curved arrow over the hub: which way it turns.
    const ax = 40, ay = 9, ty = hub.y - 22;
    const arrow = lighten(c.accent, 0.45);
    ctx.strokeStyle = arrow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, ty, ax, ay, 0, Math.PI * 0.15, Math.PI * 0.95);
    ctx.stroke();
    const ex = cx + Math.cos(Math.PI * 0.15) * ax, ey = ty + Math.sin(Math.PI * 0.15) * ay;
    ctx.fillStyle = arrow;
    ctx.beginPath();
    ctx.moveTo(ex + 7, ey - 7); ctx.lineTo(ex + 3, ey + 6); ctx.lineTo(ex - 8, ey - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();                                     // ends the bowl clip

  bowl();                                            // the cut edge of the shell, lit
  ctx.strokeStyle = alpha(lighten(shell, 0.35), 0.95);
  ctx.lineWidth = 4;
  ctx.stroke();
  bowl();
  ctx.strokeStyle = alpha(darken(well, 0.4), 0.8);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // The shut lid: a domed slab across the top, with its grip at the front.
  if (lid <= 0.02) {
    rr(ctx, x0 + 2, top - 14, W - 4, 24, 12);
    ctx.fillStyle = lidCol;
    ctx.fill();
    ctx.fillStyle = alpha(lighten(lidCol, 0.45), 0.7);
    ctx.fillRect(x0 + 16, top - 11, W - 32, 3);
    ctx.strokeStyle = alpha(darken(lidCol, 0.45), 0.9);
    ctx.lineWidth = 2.5;
    rr(ctx, x0 + 2, top - 14, W - 4, 24, 12);
    ctx.stroke();
    rr(ctx, cx - 30, top + 4, 60, 9, 4);
    ctx.fillStyle = darken(lidCol, 0.3);
    ctx.fill();
  }

  // The front panel: the rpm read-out, the run light and a start button.
  const py = bottom - 34;
  const plate = darken(c.stroke, 0.68);
  // Phone: the bench is under half size, so the read-out plate and its number grow together.
  const big = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
  rr(ctx, x0 + 22, big ? py - 12 : py, big ? 176 : 104, big ? 40 : 24, 6);
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.font = font(c, 700, big ? 28 : 14, true);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = omega > 0 ? lighten(c.good, 0.35) : alpha(lighten(c.good, 0.35), 0.45);
  if (o.rpm != null) ctx.fillText(`${Math.round(o.rpm)} rpm`, big ? x0 + 188 : x0 + 118, big ? py + 9 : py + 13);
  ctx.beginPath(); ctx.arc(x0 + W - 82, py + 12, 6, 0, Math.PI * 2);
  ctx.fillStyle = omega > 0 ? c.good : darken(shell, 0.3);
  ctx.fill();
  rr(ctx, x0 + W - 62, py + 2, 40, 20, 8);
  ctx.fillStyle = darken(shell, 0.28);
  ctx.fill();
  ctx.restore();

  return {
    top, bottom, hub, chamber: ch, lidTop: lid > 0.02 ? lidTop : top - 14,
    tip: (i) => tipOf(frames[i]),
    frame: (i) => ({ ...frames[i] }),
  };
}
