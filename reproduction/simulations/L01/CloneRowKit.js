// CloneRowKit.js - the one row of rose cuttings, shared by every L01 mount that shows it.
// CloneRowScene.js (growth, then the speck) and CloneRowScene-verdict.js (the flowering
// verdict, its soil cutaway and its method cards) both draw the row through this file, so
// the plants a learner has already watched grow are literally the same drawing.
//
// Nothing here knows about beats. A caller passes the state it wants and gets the row.
// Colours come from `c` only; `roseRed(c)` is the single flower colour in the kit, which is
// what makes "every flower is the same red" structural rather than a promise.
import { alpha, mix, lighten, darken, ellipse, rr, pill } from 'simulations/base/kit/SimLook.js';

// The bed. Seven cuttings on one continuous slab of dark soil.
export const ROW_N = 7;
export const BED = { x: 26, y: 386, w: 628, h: 76 };     // the soil slab; y is its top surface
export const CARD_BAND = { x: 26, y: 54, w: 628, h: 116 };// where the three method cards go
export const SET = { x: 26, y: 178, w: 628, h: 270 };     // the shaded back wall the row stands against
export const CHIP_Y = 30;                                  // the beat's single chip, above the row

// One height per plant, measured up from the soil surface. The row is not a picket fence -
// but the flowers are all the same size whatever the height.
const STEM_H = [140, 162, 128, 156, 134, 160, 146];

// The one flower. Every flower in the row is this colour at this radius with this petal count.
const PETALS = 5;
const FLOWER_R = 14;

// Which plant carries the soil cutaway, counting from 0. Exactly one, on purpose.
export const CUTAWAY_INDEX = 3;

const SPACING = (BED.w - 72) / (ROW_N - 1);

export function plantX(i) { return BED.x + 36 + i * SPACING; }
export function plantTop(i) { return BED.y - STEM_H[i]; }
export function stemHeight(i) { return STEM_H[i]; }

/** The single flower colour. There is no second one; that is the point of the row. */
export function roseRed(c) { return darken(mix(c.bad, c.flame, 0.42), 0.12); }
export function stemGreen(c) { return mix(c.good, c.waste, 0.44); }
export function leafGreen(c) { return mix(c.good, c.waste, 0.2); }
/** Dark brown soil: the waste token's warm grey pushed brown, never a flat grey slab. */
export function soilColour(c) { return darken(mix(c.waste, c.flame, 0.16), 0.52); }
export function soilCutColour(c) { return darken(mix(c.waste, c.flame, 0.2), 0.24); }

/** Which plant is under a point, or -1. Hit box is a column around the stem. */
export function rowHit(p, halfW = 26) {
  for (let i = 0; i < ROW_N; i++) {
    if (Math.abs(p.x - plantX(i)) <= halfW && p.y >= plantTop(i) - 12 && p.y <= BED.y + 34) return i;
  }
  return -1;
}

/**
 * The set the row stands in: a shaded glasshouse wall behind the bed, so the plants are read
 * against something rather than against bare backdrop. Drawn first, before the cards.
 */
export function drawRowSet(ctx, c) {
  ctx.save();
  rr(ctx, SET.x, SET.y, SET.w, SET.h, 16);
  ctx.fillStyle = darken(mix(c.bgDeep, c.water, 0.12), 0.12);
  ctx.fill();
  ctx.save();
  rr(ctx, SET.x, SET.y, SET.w, SET.h, 16);
  ctx.clip();
  // glazing bars: the wall of a greenhouse, faint enough to stay behind the plants
  ctx.strokeStyle = alpha(lighten(mix(c.bgDeep, c.water, 0.12), 0.3), 0.35);
  ctx.lineWidth = 3;
  for (let i = 1; i < 6; i++) {
    const x = SET.x + (SET.w / 6) * i;
    ctx.beginPath(); ctx.moveTo(x, SET.y); ctx.lineTo(x, SET.y + SET.h); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(SET.x, SET.y + 96); ctx.lineTo(SET.x + SET.w, SET.y + 96); ctx.stroke();
  ctx.restore();
  // lit top edge and shadowed base, so the wall has a direction
  ctx.strokeStyle = alpha(lighten(mix(c.bgDeep, c.water, 0.12), 0.34), 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(SET.x + 8, SET.y + 1.5); ctx.lineTo(SET.x + SET.w - 8, SET.y + 1.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * The bed, and (k > 0) the soil cutaway on its front face under CUTAWAY_INDEX.
 * o = { cutaway: 0..1 fade, cutRoots: 0..1 root growth }
 */
export function drawCloneBed(ctx, c, o = {}) {
  const k = o.cutaway ?? 0;
  ctx.save();
  rr(ctx, BED.x, BED.y, BED.w, BED.h, 14);
  ctx.fillStyle = soilColour(c);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // grit: a few fixed flecks so the soil is not a flat slab
  ctx.fillStyle = alpha(lighten(soilColour(c), 0.18), 0.5);
  for (let i = 0; i < 46; i++) {
    const x = BED.x + 8 + ((i * 137) % (BED.w - 16));
    const y = BED.y + 10 + ((i * 61) % (BED.h - 20));
    ctx.beginPath(); ctx.arc(x, y, 1.1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // the lit surface line, so the bed reads as soil you could push a stick into
  ctx.strokeStyle = alpha(lighten(soilColour(c), 0.3), 0.9);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(BED.x + 6, BED.y + 1.5); ctx.lineTo(BED.x + BED.w - 6, BED.y + 1.5); ctx.stroke();

  if (k > 0.01) drawCutaway(ctx, c, k, o.cutRoots ?? 1);
  ctx.restore();
}

/** The wedge of cut soil on the front face: one stem's buried end and its roots. */
function drawCutaway(ctx, c, k, rootK) {
  const cx = plantX(CUTAWAY_INDEX);
  const top = BED.y + 6, h = 60;
  const wTop = 24, wBot = 46;
  ctx.save();
  ctx.globalAlpha *= k;
  // the wedge: same soil, cut open, so it is lighter and has a rim
  ctx.beginPath();
  ctx.moveTo(cx - wTop, top);
  ctx.lineTo(cx + wTop, top);
  ctx.lineTo(cx + wBot, top + h);
  ctx.lineTo(cx - wBot, top + h);
  ctx.closePath();
  ctx.fillStyle = soilCutColour(c);
  ctx.fill();
  ctx.strokeStyle = alpha(lighten(soilCutColour(c), 0.25), 0.95);
  ctx.lineWidth = 2;
  ctx.stroke();

  // the bare buried end of the stem, in the same green as the stem above ground
  const yEnd = top + 18;
  ctx.strokeStyle = darken(stemGreen(c), 0.2);
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, top - 6); ctx.lineTo(cx, yEnd); ctx.stroke();
  ctx.fillStyle = alpha(darken(stemGreen(c), 0.25), 0.9);
  ctx.beginPath(); ctx.arc(cx, yEnd, 3.2, 0, Math.PI * 2); ctx.fill();

  // four pale roots pushing out of that end - the only roots anywhere in this lesson
  const pale = lighten(mix(c.gold, c.label, 0.4), 0.1);
  const dirs = [-1, -0.45, 0.45, 1];
  const spread = [34, 22, 22, 34];
  const len = [30, 32, 32, 30];
  ctx.strokeStyle = pale;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const dx = dirs[i] * spread[i];
    const ex = cx + dx * Math.min(1, rootK);
    const ey = yEnd + len[i] * Math.min(1, rootK);
    ctx.beginPath();
    ctx.moveTo(cx, yEnd - 1);
    ctx.quadraticCurveTo(cx + dx * 0.45, yEnd + len[i] * 0.35, ex, ey);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + dx * 0.5, yEnd + len[i] * 0.38);
    ctx.quadraticCurveTo(cx + dx * 0.78, yEnd + len[i] * 0.6, cx + dx * 0.95, yEnd + len[i] * 0.82);
    ctx.stroke();
    ctx.lineWidth = 3;
  }
  ctx.restore();
}

/**
 * One cutting: stem, leaves, and (k > 0) its flower. Identical code for every i, which is
 * how the row stays uniform.
 * o = { leaf: 0..1, flower: 0..1, bud: 0..1, speck: bool, ring: 0..1 }
 */
export function drawCutting(ctx, c, i, o = {}) {
  const x = plantX(i), y0 = BED.y + 10, h = STEM_H[i], top = y0 - h;
  const g = stemGreen(c), leaf = leafGreen(c);
  ctx.save();
  if (o.ring) {
    ctx.strokeStyle = alpha(c.accent, 0.95 * o.ring);
    ctx.lineWidth = 3;
    rr(ctx, x - 22, top - 16, 44, h + 34, 16);
    ctx.stroke();
  }
  ctx.strokeStyle = g;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, top + 6); ctx.stroke();

  if (o.leaf) {
    const ly = top + 26;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(x + s * 4, ly);
      ctx.rotate(s * -0.5);
      ctx.fillStyle = leaf;
      ellipse(ctx, s * 13, -4, 13, 6.5, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(x, top + 48);
    ctx.fillStyle = lighten(leaf, 0.08);
    ellipse(ctx, -11, 3, 10, 5, -0.4);
    ctx.fill();
    ctx.restore();
  }
  if (o.bud) {
    ctx.fillStyle = mix(roseRed(c), leafGreen(c), 0.45);
    ellipse(ctx, x, top - 4, 5.5, 9);
    ctx.fill();
  }
  if (o.flower) {
    const r = FLOWER_R * o.flower;
    const red = roseRed(c);
    for (let p = 0; p < PETALS; p++) {
      const a = (p / PETALS) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = red;
      ellipse(ctx, x + Math.cos(a) * r * 0.62, top - 8 + Math.sin(a) * r * 0.62, r * 0.6, r * 0.46, a);
      ctx.fill();
    }
    ctx.fillStyle = lighten(mix(c.gold, red, 0.25), 0.1);
    ctx.beginPath(); ctx.arc(x, top - 8, r * 0.3, 0, Math.PI * 2); ctx.fill();
  }
  if (o.speck) {
    ctx.fillStyle = darken(mix(c.waste, c.bgDeep, 0.35), 0.2);
    ctx.beginPath(); ctx.arc(x + 17, top + 21, 4.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/**
 * A chip beside the plant it names, never over it. Right-hand plants get their chip on the
 * left so it cannot run off the panel. The verdict mount draws its own chip with a leader
 * instead; this is here for the growth mount, whose chip sits low beside the bare stem.
 */
export function drawPlantChip(ctx, c, text, i, y, o = {}) {
  const x = plantX(i);
  const left = i <= 2;
  return pill(ctx, c, text, x + (left ? 30 : -30), y, {
    size: o.size ?? 13, bg: o.bg ?? c.accent, alpha: o.alpha ?? 1,
    align: left ? 'left' : 'right',
  });
}