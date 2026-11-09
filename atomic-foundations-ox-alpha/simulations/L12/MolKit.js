// MolKit - parts shared by the L12 and L13 scenes, on top of SimAtom and L07/AtomBoard.
// The stage only scales on a phone, so a label here is 24 design px or more (AtomBoard's TXT).
import { alpha, darken, lighten, mix, luma, contrast, rr, clamp01 } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { drawBall, atomTone } from 'simulations/base/kit/SimAtom.js';
import { say, chipInk } from '../L07/AtomBoard.js';

const TAU = Math.PI * 2;

/** Hydrogen peroxide in drawMolecule units: H-O-O-H, in the bent shape it really has. */
export const H2O2 = {
  atoms: [{ sym: 'O', x: -1.25, y: -0.45 }, { sym: 'O', x: 1.25, y: -0.45 }, { sym: 'H', x: -2.55, y: 0.75 }, { sym: 'H', x: 2.55, y: -1.65 }],
  bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]],
};

export const ATOM_MASS = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, S: 32, Cl: 35.5, Ca: 40 };

/**
 * A round window into the small world, with a heavy rim. Draws its own ground and clips to it for
 * paint(). o: { tone }
 */
export function drawLens(ctx, c, x, y, r, paint, o = {}) {
  const L = lookOf(), day = luma(c.bgDeep) > 0.5;
  ctx.save();
  ctx.beginPath(); ctx.arc(x + 3, y + 7, r + 9, 0, TAU);
  ctx.fillStyle = alpha(darken(c.bgDeep, 0.4), day ? 0.14 : 0.4);
  ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r + 8, 0, TAU);
  ctx.fillStyle = c.raised;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 3 * L.rim;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = o.tone ?? (day ? lighten(c.bgSurface, 0.2) : mix(c.bgDeep, c.bgSurface, 0.6));
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  paint();
  ctx.restore();
  ctx.restore();
}

/** A leader from a point on the rig to the lens: two straight lines, as a magnifier is drawn. */
export function lensLeader(ctx, c, x, y, lx, ly, lr) {
  const a = Math.atan2(y - ly, x - lx), s = 0.42;
  ctx.save();
  ctx.fillStyle = alpha(c.glass, luma(c.bgDeep) > 0.5 ? 0.3 : 0.16);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(lx + Math.cos(a - s) * lr, ly + Math.sin(a - s) * lr);
  ctx.lineTo(lx + Math.cos(a + s) * lr, ly + Math.sin(a + s) * lr);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Letters on a ball: the lighter ink wherever it is legible, as drawMolecule does. */
export function ballInk(c, bg) {
  const light = luma(c.label) > luma(c.bgDeep) ? c.label : c.bgDeep;
  return contrast(bg, light) >= 2.4 ? light : chipInk(c, bg);
}

/** One atom as a chunky ball with its symbol, for scenes that move atoms one by one. */
export function atomBall(ctx, c, sym, x, y, r, o = {}) {
  const col = atomTone(c, sym);
  drawBall(ctx, c, x, y, r, col, o);
  if (r >= 22) say(ctx, c, sym, x, y + 1, { size: Math.round(r * 0.86), col: ballInk(c, col) });
}

/** A count bar: n blocks in tone, side by side from (x, y) growing right. Returns the end x. */
export function massBlocks(ctx, c, x, y, n, tone, o = {}) {
  const s = o.s ?? 18, gap = o.gap ?? 3, h = o.h ?? 34;
  const L = lookOf();
  for (let i = 0; i < n; i++) {
    const bx = x + i * (s + gap);
    rr(ctx, bx, y + 4 * L.lip, s, h, 5 * L.radius);
    ctx.fillStyle = darken(tone, 0.34);
    ctx.fill();
    rr(ctx, bx, y, s, h, 5 * L.radius);
    ctx.fillStyle = tone;
    ctx.fill();
  }
  return x + n * (s + gap);
}

/** Ease by parts: progress 0..1 of [a, b]. */
export const span = (t, a, b) => clamp01((t - a) / (b - a));
