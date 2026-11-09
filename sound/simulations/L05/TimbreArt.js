// TimbreArt.js - shared drawing for the L05 tone / note / timbre scenes and PitchMatchGame. New 2026-11-03.
// Not a scene. Every curve here is COMPUTED: a sum of sines (a fundamental plus overtones at whole-number
// multiples of its frequency, fixed amplitude and phase per sound), normalised so its largest swing is 1.
// The curves are plotted on the kit density graph (green paper) through a graph field of their own:
// density = 1 + amp * shape(time), sampled every 1 px, so the kit draws paper, axes and the curve itself.
import { alpha, pill, chipSize, font } from 'simulations/base/kit/SimLook.js';
import { drawDensityGraph } from 'simulations/base/kit/SimWave.js';

const TAU = Math.PI * 2;

// [harmonic number, amplitude, phase]. Harmonic 1 is the fundamental; the rest are overtones.
export const PARTS = {
  tone: [[1, 1, 0]],
  voice: [[1, 1, 0], [2, 0.46, 0.7], [3, 0.36, 2.1], [4, 0.2, 0.4], [6, 0.13, 2.6], [9, 0.07, 1.1]],
  flute: [[1, 1, 0], [2, 0.2, 1.3], [3, 0.07, 0.5]],
  ektara: [[1, 1, 0], [2, 0.52, 0], [3, 0.36, 0], [4, 0.26, 0], [5, 0.2, 0], [6, 0.15, 0], [7, 0.11, 0]],
  tabla: [[1, 1, 0], [2, 0.62, 1.6], [3, 0.5, 0.25], [4, 0.34, 2.4], [5, 0.16, 1.0]],
};

const NORM = {};
for (const k of Object.keys(PARTS)) {
  let m = 0;
  for (let i = 0; i < 2000; i++) m = Math.max(m, Math.abs(raw(PARTS[k], i / 2000)));
  NORM[k] = m;
}
function raw(parts, u) { let s = 0; for (const [n, a, p] of parts) s += a * Math.sin(TAU * n * u + p); return s; }

/** The sound's curve at u cycles (u = 1 is one repeat), largest swing 1. */
export function shape(kind, u) { return raw(PARTS[kind], u) / NORM[kind]; }
/** The fundamental alone, at the size it has inside the normalised sum. */
export function fundamental(kind, u) { const [, a, p] = PARTS[kind][0]; return (a * Math.sin(TAU * u + p)) / NORM[kind]; }

/**
 * A density-against-time graph of one sound on the kit paper.
 * o: x, y, w, h, kind, cycles (repeats across w), amp (0..1 of the swing room), progress, tone, axes, avg.
 * Returns the kit graph ({ yOf, avgY, box, ... }) plus period (px of one repeat).
 */
export function plotSound(ctx, c, o) {
  const { x, w, kind, cycles } = o, amp = o.amp ?? 0.78, period = w / cycles;
  const G = { origin: x, dir: 1, xAt: (d) => x + d, rhoLin: (d) => 1 + amp * shape(kind, d / period), rhoRangeLin: [1 - amp, 1 + amp] };
  const g = drawDensityGraph(ctx, c, { x, y: o.y, w, h: o.h, field: G, t: 0, linear: true, range: o.range ?? [0.12, 1.88],
    progress: o.progress ?? 1, tone: o.tone ?? 1, marks: false, avg: o.avg ?? true, axes: o.axes ?? {}, cell: o.cell ?? 10 });
  return { ...g, period };
}

/** Another curve on an existing graph's own yOf (same time axis): fn(u) in -1..1 of that graph's swing. */
export function overlayCurve(ctx, c, g, o) {
  const { x, w } = o, amp = o.amp ?? 0.78, period = o.period ?? g.period, upTo = x + (o.progress ?? 1) * w;
  ctx.save();
  ctx.strokeStyle = o.col; ctx.lineWidth = o.width ?? 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  for (let X = x; X <= upTo; X += 1) { const Y = g.yOf(1 + amp * o.fn((X - x) / period)); if (X === x) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();
  ctx.restore();
}

/** Dashed upright guides at x0 + k * period through [y0, y1]: where each repeat starts. */
export function repeatGuides(ctx, c, { x, w, period, y0, y1, k = 1 }) {
  if (k <= 0) return;
  ctx.save(); ctx.strokeStyle = alpha(c.label, 0.8 * k); ctx.lineWidth = 2.6; ctx.setLineDash([7, 6]);
  for (let X = x; X <= x + w + 0.5; X += period) { ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y1); ctx.stroke(); }
  ctx.restore();
}

/**
 * A row of dimension brackets, one per repeat, at height by, with a small gap between neighbours so each
 * repeat reads as its own span; the label (if any) sits in a chip just under bracket `labelAt`.
 * u (0..1) grows them in from the left.
 */
export function repeatBrackets(ctx, c, { x, w, period, by, label = null, labelAt = 0, u = 1, size = 26 }) {
  if (u <= 0) return;
  const n = Math.round(w / period), shown = Math.max(1, Math.ceil(n * u - 1e-6));
  ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < shown; i++) {
    const a = x + i * period + 5, b = x + (i + 1) * period - 5;
    ctx.beginPath(); ctx.moveTo(a, by - 11); ctx.lineTo(a, by + 11); ctx.moveTo(b, by - 11); ctx.lineTo(b, by + 11);
    ctx.moveTo(a + 2, by); ctx.lineTo(b - 2, by); ctx.stroke();
    const head = (X, s) => { ctx.beginPath(); ctx.moveTo(X, by); ctx.lineTo(X - s * 11, by - 6); ctx.lineTo(X - s * 11, by + 6); ctx.closePath(); ctx.fill(); };
    head(a + 2, -1); head(b - 2, 1);
  }
  ctx.restore();
  if (label != null && labelAt < shown) pill(ctx, c, label, x + (labelAt + 0.5) * period, by + 34, { bg: c.raised, size, display: true });
}

/** A short key: a dashed (or solid) line swatch, then a word. Returns the right edge. */
export function keyLine(ctx, c, { x, y, col, word, dash = null, size = 26 }) {
  ctx.save();
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.setLineDash([]);
  ctx.font = font(c, 700, size, true); ctx.fillStyle = c.label; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(word, x + 50, y + 1);
  const r = x + 50 + ctx.measureText(word).width;
  ctx.restore();
  return r;
}
