/**
 * GraphShapesScene - slide blk-l05-s4 "What the shape tells you" (2 beats; Fig 4.13 a and b).
 * Two graph panels side by side, as in the book figure.
 *   b0 panel (a) is the hero: x = 20 t (0-6 s, 0-120 m). The 2-3 s and 5-6 s strips shade on
 *      the time axis, and two brackets grow on the line, 20 m each: equal. Panel (b) is dim.
 *   b1 panel (b) is the hero: x = t2 / 4 (0-12 s, 0-40 m). The 4-6 s and 10-12 s strips shade,
 *      and the brackets grow: 5 m (4 to 9) and 11 m (25 to 36): unequal. Panel (a) is dim.
 * Each bracket is the rise over its strip: the first one hangs below the line at the strip's
 * end (horizontal run from the strip's start), the second one stands above the line at the
 * strip's start (run back from the strip's end), so every label sits in empty paper.
 * Data comes from the formulas; the curve is computed, never drawn by hand.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01 } from 'simulations/base/kit/SimLook.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, curveData, drawBracket, DIM } from '../shared/MotionGraph.js';

const LINE = (t) => 20 * t;
const CURVE = (t) => (t * t) / 4;
const PANELS = [
  {
    fn: LINE, data: curveData(LINE, 0, 6, 12),
    rect: { x: 10, y: 120, w: 330, h: 370 },
    axes: { x: { max: 6, step: 1, title: 'time (s)' }, y: { max: 120, step: 20, title: 'position (m)' } },
    strips: [[2, 3], [5, 6]],
  },
  {
    fn: CURVE, data: curveData(CURVE, 0, 12, 72),
    rect: { x: 350, y: 20, w: 320, h: 486 },
    axes: { x: { max: 12, step: 2, title: 'time (s)' }, y: { max: 40, step: 5, title: 'position (m)' } },
    strips: [[4, 6], [10, 12]],
  },
];
const DRAW_S = 0.9, STRIP_AT = 1.0, B1_AT = 1.5, B2_AT = 2.4, GROW = 0.6;

export class GraphShapesScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two position-time graphs side by side. Graph (a) is a straight line: between 2 and 3 seconds and between 5 and 6 seconds the position grows by the same 20 metres, so the velocity is constant. Graph (b) is a curve: between 4 and 6 seconds the position grows by 5 metres, and between 10 and 12 seconds by 11 metres, so the velocity is changing and the motion is accelerated.';

  constructor(container, config) {
    super(container, config);
    this.frames = PANELS.map((p) => graphFrame(p.rect, p.axes));
  }

  get hero() { return Math.max(0, Math.min(1, this.stage | 0)); }

  busy() { return this.age < B2_AT + GROW + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    PANELS.forEach((p, i) => this.panel(ctx, c, p, this.frames[i], i === this.hero));
  }

  panel(ctx, c, p, f, hero) {
    const a = this.age, al = hero ? 1 : DIM;
    drawGraphPaper(ctx, c, f, { alpha: al });
    drawAxes(ctx, c, f, 99, { alpha: al });
    if (!hero) { drawThrough(ctx, c, f, p.data, 1, { width: 5, alpha: DIM }); return; }
    const tone = c.annot;
    // The two equal-time strips shade on the time axis (under the line).
    const s = clamp01((a - STRIP_AT) / 0.4);
    if (s > 0) {
      const P = f.plot;
      ctx.save();
      p.strips.forEach(([t1, t2]) => {
        const x1 = f.px(t1), x2 = f.px(t2);
        ctx.globalAlpha = 0.13 * s; ctx.fillStyle = tone;
        ctx.fillRect(x1, P.y, x2 - x1, P.h);
        ctx.globalAlpha = 0.55 * s;
        ctx.fillRect(x1, f.base - 9, x2 - x1, 9);
      });
      ctx.restore();
    }
    drawThrough(ctx, c, f, p.data, clamp01(a / DRAW_S), { width: 6 });
    p.strips.forEach(([t1, t2], i) => {
      const k = clamp01((a - (i ? B2_AT : B1_AT)) / GROW);
      if (k <= 0) return;
      const x1 = p.fn(t1), x2 = p.fn(t2);
      // First strip: run along the bottom from t1, rise at t2 (below the line).
      // Second strip: rise at t1, run along the top back from t2 (above the line).
      const at = i ? t1 : t2, run = i ? [[t1, x2], [t2, x2]] : [[t1, x1], [t2, x1]];
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.strokeStyle = tone; ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]);
      const [r0, r1] = run.map(f.at);
      ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]); ctx.stroke();
      ctx.restore();
      drawPoint(ctx, c, f, [t1, x1], a - (i ? B2_AT : B1_AT), { r: 7, col: c.s1 });
      drawPoint(ctx, c, f, [t2, x2], a - (i ? B2_AT : B1_AT), { r: 7, col: c.s1 });
      const from = x1, to = x1 + (x2 - x1) * k;
      const lab = k >= 1 ? Math.round(x2 - x1) + ' m' : '';
      drawBracket(ctx, c, f, [at, from], [at, to], lab, { side: i ? -1 : 1, gap: 14, col: tone });
    });
  }
}
