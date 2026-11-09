// MixtureBenchKit.js - the bench every mixtures scene stands its glassware on.
// Shared by L01 MixtureBenchScene, L01 SettleFilterScene and L02 ConcentrationBenchScene.
// It is BENCHWARE, not lesson state: nothing here knows what a solute is, what 10 g means, or
// which slide is mounted. Every scene passes in its own numbers and its own colours.
//
// A scene owns its lesson: its beat map, its controls, its numbers and its copy. If two scenes
// need to agree on something, that is a shared CONSTANT here, never a shared field. Never import
// another scene file from here or from a scene - those carry their own beat maps and their own
// answer state, and importing one leaks its verdict onto a slide that must not have it.
//
// Design space is 680 x 520 (SimLook W/H). Every drawing takes explicit x/y/w/h in design-space
// pixels and never reads ZONES itself, so a scene lays the bench out however its content needs.
//
// Colours: every function takes the resolved palette `c` from `loadColors` and uses only `c.<key>`
// and the SimLook derivates mix / alpha / lighten / darken. There is no hex and no new --sim-*
// token anywhere in this file. Keys used: stroke, label, labelMuted, glass, water, shape, track,
// raised, gold, good, bad, accent, bgSurface.

import {
  alpha, lighten, darken, font, pill, rr, ellipse, drawShadow,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';

/**
 * The bench top's y in design space. The default every scene starts from; a scene with tall
 * glassware can pass its own `y` to drawBench. Chosen so a vessel up to ~300 px tall stands on it
 * with its shoulder inside the hero band and the note line below the apron.
 */
export const BENCH_Y = 392;

/** Clamp any value into 0..1. Used for every level/fraction an outside caller supplies. */
export function clamp01(v) {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

/**
 * massPercent(solute, solution) -> number, solute/solution as a percentage.
 * The shared definition of the one number several mixtures scenes read out, so no two scenes can
 * round it differently. NOT rounded: the caller decides how many decimals to show.
 */
export function massPercent(solute, solution) {
  if (!Number.isFinite(solute) || !Number.isFinite(solution) || solution <= 0) return 0;
  return (solute / solution) * 100;
}

/**
 * drawBench(ctx, c, o) - the bench the scene stands on: a slab with a front apron, a lit lip
 * along its top edge and two stubby legs, all on a contact shadow.
 * o: { x0, x1, y = BENCH_Y, legs = true, seams = true }
 * Contract: draws nothing above `y`. The top edge line is drawn at exactly `y`, so a vessel whose
 * base is at `y` sits on it rather than floating or sinking.
 */
export function drawBench(ctx, c, o = {}) {
  const x0 = o.x0 ?? 12;
  const x1 = o.x1 ?? 668;
  const y = o.y ?? BENCH_Y;
  const h = 26;                                  // apron depth; legs hang below it
  drawShadow(ctx, c, (x0 + x1) / 2, y + h + 16, (x1 - x0) * 0.42, 9);
  ctx.fillStyle = darken(c.gold, 0.45);           // legs
  if (o.legs !== false) {
    ctx.fillRect(x0 + 26, y + h, 16, 20);
    ctx.fillRect(x1 - 42, y + h, 16, 20);
  }
  ctx.fillStyle = c.gold;                         // slab
  ctx.fillRect(x0, y, x1 - x0, h);
  ctx.fillStyle = lighten(c.gold, 0.3);           // top face, a notch lighter than the apron
  ctx.fillRect(x0, y, x1 - x0, 7);
  ctx.fillStyle = darken(c.gold, 0.22);           // the lit lip along the very top edge
  ctx.fillRect(x0, y, x1 - x0, 3);
  if (o.seams !== false) {                        // faint board seams on the top face
    ctx.strokeStyle = alpha(darken(c.gold, 0.4), 0.5);
    ctx.lineWidth = 1;
    for (let x = x0 + 70; x < x1 - 40; x += 78) {
      ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 7); ctx.stroke();
    }
  }
}

/**
 * drawVessel(ctx, c, o) - one piece of glassware, empty. Draws the glass only; the liquid, the
 * settled layer and the label are separate calls drawn in the caller's order.
 * o: { x, y, w, h, shape = 'beaker' | 'jar' | 'bottle' }
 *   'bottle' - shoulders and a neck at the top of the box (an IV bottle, a reagent bottle).
 *   'beaker' - straight sides, a slight flare at the lip (the L01 benchware).
 *   'jar'    - the same body plus a short neck and a screw band (L02's wide-mouthed jar).
 * Returns the INTERIOR rect { x, y, w, h } that the caller must draw liquid and layers inside:
 * it is inset for the glass wall and for the lip, and every helper below clips to it. A caller
 * that ignores the return value and draws liquid in the full rect will overshoot the glass.
 */
export function drawVessel(ctx, c, o) {
  const { x, y, w, h } = o;
  const shape = o.shape === 'jar' || o.shape === 'bottle' ? o.shape : 'beaker';
  // The glass wall, capped: a proportional wall is right on a small beaker but on a wide jar it
  // eats 20 % of the interior and the liquid stops reading as a full jar. 3..6 px is glass.
  const wall = Math.min(6, Math.max(3, Math.round(w * 0.03)));
  // A 'jar' keeps a short WIDE collar above the box (a preserving jar, not a bottle).
  const neckH = shape === 'jar' ? h * 0.12 : 0;
  const g = glassBox(shape, x, y - neckH, w, h + neckH, { wall, r: Math.min(12, w * 0.1) });
  drawGlass(ctx, c, g, { shadow: false });
  // The interior callers draw in: unchanged from the old drawing, so no caller moves.
  const inset = wall * 2.4;
  const inner = { x: x + inset, y: y + inset * 0.6, w: w - inset * 2, h: h - inset * 2.2 };
  if (VESSELS.size > 64) VESSELS.clear();            // a moving vessel keys a new rect each frame
  VESSELS.set(keyOf(inner), g);
  return inner;
}

// The glass each interior rect came from, so drawFill paints the liquid in the same glass.
const VESSELS = new Map();
const keyOf = (r) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

/**
 * drawFill(ctx, c, o) - liquid standing in a vessel, clipped to the interior rect.
 * o: { x, y, w, h, level = 0.6 (0..1 of h, measured from the base), col = c.water,
 *      sparkle = true, meniscus = true }
 * Contract: `level` 0 draws nothing; `level` 1 fills to the very top of `h`. The liquid's top is
 * a flat meniscus with a lighter band, so a rising level reads as a liquid surface rather than a
 * rectangle edge. Pass the interior rect from drawVessel, not the vessel's outer rect.
 */
export function drawFill(ctx, c, o) {
  const level = clamp01(o.level);
  if (level <= 0) return;
  const { x, y, w, h } = o;
  const g = VESSELS.get(keyOf(o)) ?? glassBox('beaker', x, y, w, h, { wall: 0, r: 4 });
  const side = { ...g, inner: { x, y, w, h }, floor: y + h, top: y };
  drawGlassLiquid(ctx, c, side, {
    // a clear solution: lighter than the token and thinner, as the old flat fill was
    surface: y + h * (1 - level), fill: lighten(o.col ?? c.water, 0.18), opacity: 0.62, meniscus: o.meniscus,
  });
}

/**
 * drawLayer(ctx, c, o) - something settled at the base of a vessel: a sediment, a packed solid.
 * Drawn as a band `frac` of the interior height with a bumpy, uneven top edge (the piles are never
 * flat in a real jar) and a couple of darker grains. Always draw it AFTER drawFill.
 * o: { x, y, w, h (the interior rect), frac = 0.12 (0..1 of h), col, grain = false }
 *   `grain: true` scatters bright dry granules instead, for a jar of loose solid.
 * Contract: `frac` is measured up from the vessel's base, so the layer keeps its thickness as the
 * liquid above it rises - which is what makes "the solid did not change" visible.
 */
export function drawLayer(ctx, c, o) {
  const frac = clamp01(o.frac);
  if (frac <= 0) return;
  const { x, y, w, h } = o;
  const base = y + h;
  const thick = h * frac;
  const top = base - thick;
  const col = o.col ?? lighten(c.glass, 0.55);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top - 4, w, thick + 8);
  ctx.clip();
  ctx.fillStyle = alpha(col, 0.85);
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x, top + thick * 0.22);
  for (let i = 0; i <= 6; i++) {                      // an uneven settled surface
    const px = x + (w * i) / 6;
    const py = top + thick * (i % 2 === 0 ? 0.05 : 0.3);
    ctx.quadraticCurveTo(px - w / 24, py + (i % 2 ? -thick * 0.1 : thick * 0.12), px, py);
  }
  ctx.lineTo(x + w, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = alpha(darken(col, 0.22), 0.7);      // grains catching the light
  for (let i = 0; i < 9; i++) {
    const gx = x + ((i * 37) % 100) / 100 * w;
    const gy = top + thick * (0.35 + ((i * 53) % 60) / 100 * 0.6);
    ctx.beginPath(); ctx.arc(gx, gy, Math.max(1, w * 0.014), 0, 6.3); ctx.fill();
  }
  ctx.restore();
}

/**
 * drawLabel(ctx, c, o) - a paper label taped to the glass, centred text on a slightly off-white
 * card with two tape corners. The A / B / C label the L01 scenes identify beakers by.
 * o: { x, y (top-left of the card), text, w, h = 22, size = 14, col }
 * Contract: returns the card's rect so a caller can place a leader line to it.
 */
export function drawLabel(ctx, c, o) {
  const w = o.w ?? 30;
  const h = o.h ?? 22;
  const { x, y } = o;
  ctx.fillStyle = alpha(c.bgSurface, 0.92);
  rr(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = alpha(c.stroke, 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = alpha(c.gold, 0.55);                 // tape at both top corners
  ctx.fillRect(x + 2, y - 3, 9, 6);
  ctx.fillRect(x + w - 11, y - 3, 9, 6);
  ctx.fillStyle = o.col ?? c.label;
  ctx.font = font(c, 700, o.size ?? 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(o.text ?? ''), x + w / 2, y + h / 2 + 1);
  ctx.textAlign = 'left';
  return { x, y, w, h };
}

/**
 * drawGraduations(ctx, c, o) - a graduation band up one side of a vessel: a vertical rule with a
 * tick and a label per step. Drawn on the glass, so the caller draws it last.
 * o: { x, y, h (the band's vertical span), w = 34, steps = [{ at (0..1 up the band), label }],
 *      side = 'left' | 'right', col, size = 10 }
 * Contract: `at` is 0 at the BOTTOM of the band and 1 at the top, so a caller that wants a mark at
 * 100 g on a jar whose full scale is 110 g passes at: 100/110. Stepping is the caller's business:
 * this helper draws whatever steps it is given, in the order given.
 */
export function drawGraduations(ctx, c, o) {
  const steps = o.steps ?? [];
  if (!steps.length) return;
  const { x, y, h } = o;
  const right = o.side === 'right';
  const w = o.w ?? 34;
  const rx = right ? x : x - w;
  ctx.strokeStyle = alpha(c.stroke, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(right ? x : x, y);
  ctx.lineTo(right ? x : x, y + h);
  ctx.stroke();
  ctx.font = font(c, 700, o.size ?? 13);
  ctx.textBaseline = 'middle';
  ctx.textAlign = right ? 'left' : 'right';
  for (const s of steps) {
    const ty = y + h - clamp01(s.at) * h;
    ctx.strokeStyle = alpha(c.stroke, 0.45);
    ctx.beginPath();
    ctx.moveTo(right ? x : x, ty);
    ctx.lineTo(right ? x + 8 : x - 8, ty);
    ctx.stroke();
    ctx.fillStyle = alpha(c.label, 0.85);
    ctx.fillText(String(s.label ?? ''), right ? x + 11 : x - 11, ty);
  }
  ctx.textAlign = 'left';
}

/**
 * drawBalance(ctx, c, o) - a two-pan balance: a column on a foot, a beam that tilts, and two pans
 * hanging on chains. It IS the mass readout, so the pans carry their own labels.
 * o: { x (centre of the column), y (the bench top it stands on), w = 150 (overall width),
 *       stand = 58 (how far the beam sits above `y`), tilt = 0 (-1 left pan down .. +1 right pan
 *       down), left = 'text', right = 'text', labelPos = 'below' | 'beside' }
 * Contract: `tilt` is a POSITION, not a speed - the caller eases it. Pass tilt 0 and the beam is
 * level and both pans hang level, which is what an unloaded balance looks like. `stand` sets how
 * tall the balance is, so a scene whose hero is tall can stand a tall balance beside it and keep
 * the two heights reading as a pair. `labelPos` defaults to 'below': each pan's reading is drawn
 * centred UNDER its pan, which is where a real balance's readout sits and - unlike 'beside' -
 * cannot collide with whatever stands next to the balance. A label is never drawn on a pan, so the
 * pans stay readable as pans. Leave `left`/`right` empty for an unloaded balance and nothing is
 * drawn there at all.
 */
export function drawBalance(ctx, c, o) {
  const cx = o.x;
  const y = o.y;
  const w = o.w ?? 150;
  const stand = o.stand ?? 58;
  const tilt = Number.isFinite(o.tilt) ? Math.max(-1, Math.min(1, o.tilt)) : 0;
  const half = w * 0.36;
  const drop = tilt * 9;                              // how far the low pan hangs
  const panR = w * 0.13;

  drawShadow(ctx, c, cx, y + 4, w * 0.26, 6);
  ctx.fillStyle = darken(c.gold, 0.4);                // the foot
  rr(ctx, cx - w * 0.2, y - 8, w * 0.4, 10, 4);
  ctx.fill();
  ctx.fillStyle = c.gold;                             // the column
  ctx.fillRect(cx - 4, y - stand, 8, stand - 6);

  const beamY = y - stand;
  const lx = cx - half, rx = cx + half;
  const ly = beamY - drop, ry = beamY + drop;
  ctx.strokeStyle = c.gold;                           // the beam
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.fillStyle = darken(c.gold, 0.3);                // the pivot
  ctx.beginPath(); ctx.arc(cx, beamY, 6, 0, 6.3); ctx.fill();

  const pan = (px, py, label, side) => {
    ctx.strokeStyle = alpha(c.stroke, 0.55);          // the chain
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + panR * 0.75);
    ctx.stroke();
    ctx.fillStyle = c.gold;                           // the pan
    ctx.beginPath();
    ellipse(ctx, px, py + panR * 0.75, panR, panR * 0.34);
    ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (label != null && label !== '') {              // the reading, never on the pan
      ctx.fillStyle = alpha(c.label, 0.92);
      ctx.font = font(c, 700, 13);
      ctx.textBaseline = 'middle';
      if (o.labelPos === 'beside') {
        ctx.textAlign = side === 'left' ? 'right' : 'left';
        ctx.fillText(String(label), px + (side === 'left' ? -panR - 7 : panR + 7), py + panR * 0.75);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(String(label), px, py + panR * 1.55);
      }
      ctx.textAlign = 'left';
    }
  };
  pan(lx, ly, o.left, 'left');
  pan(rx, ry, o.right, 'right');
}

/**
 * drawScoop(ctx, c, o) - a small scoop standing in a jar of loose solid: a half-round cup on a
 * straight handle leaning out of the mouth.
 * o: { x (the cup's centre), y (the bench top), s = 1 (scale), lean = 0.18 (radians) }
 * Contract: draws the scoop standing upright and leaning `lean` to the right. The caller draws it
 * AFTER the vessel's glass so the handle reads as being in front of the rim.
 */
export function drawScoop(ctx, c, o) {
  const s = o.s ?? 1;
  const lean = o.lean ?? 0.18;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = alpha(c.gold, 0.9);               // the handle
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -44);
  ctx.stroke();
  ctx.fillStyle = lighten(c.glass, 0.5);              // the cup, a half disc
  ctx.beginPath();
  ctx.moveTo(-13, -6);
  ctx.arc(0, -6, 13, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = alpha(c.stroke, 0.45);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/**
 * drawMassChip(ctx, c, o) - the bench's chip for a mass reading: a measured pill carrying
 * `value g`, in a tone the caller picks. Use it beside the thing it measures (a pan, a jar), never
 * on it, and pass `col` from the palette (c.accent, c.good, c.gold, ...). Never hand-place its x:
 * chain the returned widths or pass align 'center'/'right'.
 * o: { x, y (the pill's CENTRE), value, unit = 'g', col, size = 15, align = 'left' | 'center' | 'right' }
 * Contract: returns the pill's rect { x, y, w, h } in top-left form, so a caller can chain chips
 * or centre a row of them without measuring twice.
 */
export function drawMassChip(ctx, c, o) {
  const size = o.size ?? 15;
  const text = `${o.value}${o.unit ?? 'g'}`;
  const r = pill(ctx, c, text, o.x, o.y, { bg: o.col ?? c.accent, size, align: o.align });
  return { x: r.x0, y: r.y0, w: r.w, h: r.h };
}