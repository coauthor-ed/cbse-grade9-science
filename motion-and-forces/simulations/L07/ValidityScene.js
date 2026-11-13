/**
 * ValidityScene - slide blk-l07-s4 "When the equations work" (2 beats; the Note on page 65).
 *   b0  two small velocity-time graphs (0-5 s, 0-10 m/s). Left: v = 1 + 2t, a straight line.
 *       Right: v = 1 + t2/2, a curve (points of the formula). A kit slope triangle with a 1 s run
 *       slides along each line; it leaves a faint copy at t = 0.2, 1.5 and 2.8 s. On the line
 *       every copy is the same shape (rise 2 m/s); on the curve the rise grows (0.7, 2.0, 3.3 m/s).
 *       Then the badges: a tick ("a constant") and a cross ("a changes").
 *   b1  a two-lane highway with the + direction arrow under it: car 1 speeds up (v forward and
 *       growing, a forward, "a +"), car 2 slows down (v forward and shrinking, a backward, "a -").
 *       Both run x = u t +- 1/2 a t2 on screen (same |a|), 3 s.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, outBack, vectorArrow, font, darken, lighten, alpha } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawMotionArrow, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { slopeTriangle } from 'simulations/base/kit/SimPlot.js';
import { graphFrame, drawGraphPaper, drawAxes, drawThrough, curveData, drawTag } from '../shared/MotionGraph.js';

const MINUS = "\u2212";
const LINES = [(t) => 1 + 2 * t, (t) => 1 + 0.5 * t * t];
const DATA = LINES.map((fn) => curveData(fn, 0, 4, 48));
const STOPS = [0.2, 1.5, 2.8], LEAD = 0.5, SLIDE = 2.8, BADGE = LEAD + SLIDE + 0.2;
// b1 (screen units): |a| = 60 px/s2 for 3 s; car 1 u = 60 px/s, car 2 u = 240 px/s.
const RUN = 3, GO = 0.4, AC = 60, CAR = 140, NOSE0 = 160, V_PX = 0.5, A_LEN = 80;
const LANES = [{ g: 186, u: 60, a: 1, tone: 1 }, { g: 410, u: 240, a: -1, tone: 5 }];
const fmt = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');

export class ValidityScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two velocity-time graphs. On the straight line a slope triangle slides along and keeps the same shape: the acceleration is constant and the equations work. On the curve the same triangle grows as it slides: the acceleration changes and the equations do not apply. Then a highway with the direction of motion marked positive: a car speeding up has its acceleration forward, a plus; a car slowing down has its acceleration backward, a minus.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    const ax = { x: { max: 5, step: 1, title: 'time (s)' }, y: { max: 10, step: 2, title: 'velocity (m/s)' } };
    this.fs = [graphFrame({ x: 4, y: 92, w: 332, h: 424 }, ax), graphFrame({ x: 344, y: 92, w: 332, h: 424 }, ax)];
  }

  enter(stage) { this.cur = stage; }
  get key() { return Math.max(0, Math.min(1, this.cur | 0)); }
  busy() { return this.age < (this.key === 0 ? BADGE + 0.8 : GO + RUN + 0.3); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.key === 0) this.graphs(ctx, c); else this.highway(ctx, c);
  }

  // ---- b0 ---------------------------------------------------------------------------------
  graphs(ctx, c) {
    const u = clamp01((this.age - LEAD) / SLIDE), t0 = STOPS[0] + (STOPS[2] - STOPS[0]) * inOutSine(u);
    this.fs.forEach((f, i) => {
      drawGraphPaper(ctx, c, f);
      drawAxes(ctx, c, f, 99);
      drawThrough(ctx, c, f, DATA[i], clamp01(this.age / 0.5), { col: c.s1, width: 5 });
      const tri = (ta, o) => slopeTriangle(ctx, c, f, [ta, LINES[i](ta)], [ta + 1, LINES[i](ta + 1)], { letters: false, ...o });
      // Faint copies where the triangle has already passed: the proof that stays at rest.
      STOPS.forEach((s, j) => {
        if (j === 2 || t0 < s - 1e-6) return;
        ctx.save(); ctx.globalAlpha = 0.4; tri(s, { rise: null, run: null, col: c.s4, fill: 0.1 }); ctx.restore();
      });
      const rise = LINES[i](t0 + 1) - LINES[i](t0);
      tri(t0, { rise: fmt(rise) + ' m/s', run: '1 s', col: c.annot, fill: 0.18 });
      this.badge(ctx, c, f, i === 0);
    });
  }

  /** A round badge (tick or cross) and a short label above the graph, popping after the slide. */
  badge(ctx, c, f, good) {
    const k = outBack(clamp01((this.age - BADGE) / 0.45));
    if (k <= 0) return;
    const x = f.sheet.x + 40, y = 40, r = 22 * k, col = good ? c.good : c.bad;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y + 3, r, 0, Math.PI * 2); ctx.fillStyle = darken(col, 0.35); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.6, Math.PI * 1.05, Math.PI * 1.6); ctx.strokeStyle = alpha(lighten(col, 0.6), 0.8); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = c.bgSurface; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (good) { ctx.moveTo(x - r * 0.45, y + r * 0.02); ctx.lineTo(x - r * 0.1, y + r * 0.38); ctx.lineTo(x + r * 0.48, y - r * 0.35); }
    else { const q = r * 0.36; ctx.moveTo(x - q, y - q); ctx.lineTo(x + q, y + q); ctx.moveTo(x + q, y - q); ctx.lineTo(x - q, y + q); }
    ctx.stroke();
    ctx.restore();
    if (k > 0.5) drawTag(ctx, c, good ? 'a constant' : 'a changes', x + 34, y, { col, align: 'left', alpha: clamp01((k - 0.5) * 2) });
  }

  // ---- b1 ---------------------------------------------------------------------------------
  highway(ctx, c) {
    const t = RUN * clamp01((this.age - GO) / RUN);
    LANES.forEach((L, i) => {
      const spec = trackSpec({ from: 0, to: 100, x0: 16, x1: 664, y: L.g + 10 });
      drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 56 });
      const x = L.u * t + 0.5 * L.a * AC * t * t, v = L.u + L.a * AC * t, nose = NOSE0 + x;
      // Equal-time marks (every 0.5 s) under the car: spreading out when it speeds up, closing up when it slows.
      const at = [0, 0.5, 1, 1.5, 2, 2.5, 3].filter((s) => s <= t + 1e-6).map((s) => NOSE0 + L.u * s + 0.5 * L.a * AC * s * s);
      drawStrobe(ctx, c, trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y: L.g + 22 }), { at, marks: 'dots', markTone: L.tone, timeLabels: at.map(() => '') });
      const body = drawCar(ctx, c, { x: nose - CAR / 2, y: L.g, length: CAR, roll: x / (CAR / 4.2), tone: L.tone });
      const roof = body.box ? body.box.y0 : L.g - 74, vy = roof - 16, ay = vy - 40;
      drawMotionArrow(ctx, c, 'v', nose - CAR + 10, vy, { length: Math.max(26, v * V_PX), label: 'v', side: 1 });
      drawMotionArrow(ctx, c, 'a', L.a > 0 ? nose - CAR + 10 : nose - 20, ay, { length: A_LEN, angle: L.a > 0 ? 0 : Math.PI, label: L.a > 0 ? 'a +' : 'a ' + MINUS, side: L.a > 0 ? 1 : -1 });
    });
    this.plus(ctx, c);
  }

  /** The positive direction: a kit vector arrow with a "+" and its words, under both lanes. */
  plus(ctx, c) {
    const y = 494, x0 = 70, len = 250;
    ctx.save();
    ctx.font = font(c, 800, 48, true); ctx.fillStyle = c.s1ink ?? c.s1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', x0 - 30, y + 1);
    ctx.restore();
    vectorArrow(ctx, c, x0, y, { length: len, col: c.s1ink ?? c.s1, width: 5, head: 16 });
    drawTag(ctx, c, 'direction of motion', x0 + len + 20, y, { align: 'left', col: c.s1ink ?? c.s1 });
  }
}
