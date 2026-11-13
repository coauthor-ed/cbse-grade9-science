/**
 * CurvedGraphScene - slide blk-l05-n02 "A curved graph" (1 beat); NotARouteScene subclasses
 * it for blk-l05-n03 (static MODE = 'route').
 * Data: Table 4.4 (Example 4.5), a vehicle starting from rest: x = t2 / 4 m, so 0, 1, 4, 9,
 * 16, 25, 36 m at 0, 2, ..., 12 s. Book scale: X 5 small squares = 2 s, Y 5 small squares = 5 m.
 *   'curve': the car speeds up along the road strip by x = t2 / 4 (compressed); a mark drops on
 *       the road and a point plots on the graph every 2 s (the marks show growing gaps). A
 *       straight ruler line from the first point to the last appears; red gaps show the middle
 *       points sit below it; it fades, and the smooth curve (computed from the formula) draws on.
 *   'route': a prominent straight road with metre marks above the same graph. The car drives
 *       the road while a dot climbs the curve in step; one position tag in one tone sits on the
 *       car's mark on the road and at the dot's height on the Y-axis. Rest: both read 36 m.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawStrobe, drawScale } from 'simulations/base/kit/SimTrack.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, curveData, drawTag, DIM } from '../shared/MotionGraph.js';

const T_END = 12, DT = 2, CAR = 140;
const xOf = (t) => (t * t) / 4;
const TIMES = [0, 2, 4, 6, 8, 10, 12];
const DATA = TIMES.map((t) => [t, xOf(t)]);
const CURVE = curveData(xOf, 0, T_END, 72);

export class CurvedGraphScene extends SimScene {
  static MODE = 'curve';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A car starts from rest on a straight road and speeds up. Every 2 seconds a mark drops on the road and a point is plotted on a position-time graph: 0, 1, 4, 9, 16, 25 and 36 metres at 0 to 12 seconds. The gaps between the marks grow. A straight line from the first point to the last misses the middle points, which lie below it, so the points are joined by a smooth curve.';

  static DRIVE = 4.2;    // s on screen for the book's 12 s

  busy() { return this.age < (this.constructor.MODE === 'route' ? this.constructor.DRIVE + 0.8 : 9.0); }

  /** Book time (s) at this age, the drive compressed into DRIVE seconds. */
  bookT() { return T_END * clamp01(this.age / this.constructor.DRIVE); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'route') this.drawRoute(ctx, c);
    else this.drawCurve(ctx, c);
  }

  /** The car with its nose at x metres, the strobe marks every 2 s up to book time t, the clock. */
  roadAndCar(ctx, c, spec, t, depth, marks) {
    const x = xOf(t);
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth });
    if (marks) drawStrobe(ctx, c, spec, { at: TIMES.filter((ti) => ti <= t + 1e-6).map(xOf), marks: 'dots' });
    drawCar(ctx, c, { x: spec.toPx(x) - CAR / 2, y: spec.y, length: CAR, roll: x, tone: 1 });
    return tr;
  }

  drawClock(ctx, c, t, y) {
    drawTag(ctx, c, 't = ' + Math.floor(t + 1e-6) + ' s', 26, y, { align: 'left' });
  }

  // -- 'curve' ----------------------------------------------------------------------------------
  drawCurve(ctx, c) {
    const a = this.age, D = this.constructor.DRIVE, t = this.bookT();
    const spec = trackSpec({ from: -12, to: 39, x0: 16, x1: 664, y: 78 });
    this.roadAndCar(ctx, c, spec, t, 30, true);
    this.drawClock(ctx, c, t, 28);
    const f = graphFrame({ x: 128, y: 112, w: 424, h: 404 }, { x: { max: 12, step: 2, title: 'time (s)' }, y: { max: 40, step: 5, title: 'position (m)' } });
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    // The ruler: straight from the first point to the last; the middle points sit below it.
    const rd = clamp01((a - D - 0.4) / 0.6), r = Math.min(1, rd * 3) * (1 - clamp01((a - D - 2.25) / 0.5));
    if (r > 0) {
      const [x0, y0] = f.at(DATA[0]), [x1, y1] = f.at(DATA[6]);
      ctx.save();
      ctx.globalAlpha = 0.75 * r;
      ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * rd, y0 + (y1 - y0) * rd); ctx.stroke();
      ctx.globalAlpha = r;
      ctx.strokeStyle = c.bad; ctx.lineWidth = 3.5;
      for (let i = 1; i < 6; i++) {           // the gap from each middle point up to the ruler
        const g = clamp01((a - D - 1.0 - 0.25 * (i - 1)) / 0.25);   // gaps appear one by one
        if (g <= 0) continue;
        const [px, py] = f.at(DATA[i]), ly = y0 + ((y1 - y0) * (px - x0)) / (x1 - x0);
        ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(px, py - 12 + (ly + 3 - py + 12) * g); ctx.stroke();
      }
      ctx.restore();
    }
    const k = clamp01((a - D - 2.6) / 1.5);
    if (k > 0) drawThrough(ctx, c, f, CURVE, k, { width: 6 });
    DATA.forEach((d, i) => drawPoint(ctx, c, f, d, a - (TIMES[i] / T_END) * D, { col: c.s1 }));
  }

  // -- 'route' ----------------------------------------------------------------------------------
  drawRoute(ctx, c) {
    const t = this.bookT(), x = xOf(t), tone = c.s2;
    const spec = trackSpec({ from: -12, to: 39, x0: 16, x1: 664, y: 112 });
    const tr = this.roadAndCar(ctx, c, spec, t, 46, false);
    drawScale(ctx, c, { vertical: false, at: tr.bottom + 12, p0: spec.toPx(0), p1: spec.toPx(36), from: 0, to: 36, every: 6, side: 1 });
    this.drawClock(ctx, c, t, 30);
    const f = graphFrame({ x: 100, y: 218, w: 480, h: 300 }, { x: { max: 12, step: 2, title: 'time (s)' }, y: { max: 40, step: 10, title: 'position (m)' } });
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    drawThrough(ctx, c, f, CURVE, 1, { width: 5, alpha: 0.8 });
    DATA.forEach((d) => drawPoint(ctx, c, f, d, 9, { r: 7, alpha: DIM + 0.2 }));
    // One position, one tone: the mark on the road and the dot's height on the Y-axis.
    const label = Math.round(x) + ' m', nx = spec.toPx(x), [dx, dy] = f.at([t, x]);
    ctx.save();
    ctx.strokeStyle = tone; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(f.plot.x, dy); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nx, spec.y + 2); ctx.lineTo(nx, tr.bottom - 2); ctx.stroke();
    ctx.restore();
    drawPoint(ctx, c, f, [t, x], 9, { r: 11, col: tone });
    const right = nx > 520;   // near the far end the tag sits behind the mark
    drawTag(ctx, c, label, nx + (right ? -12 : 12), (spec.y + tr.bottom) / 2, { align: right ? 'right' : 'left', col: tone });
    drawTag(ctx, c, label, f.plot.x + 10, Math.min(dy, f.base - 24), { align: 'left', col: tone, segs: CURVE.map(f.at), prefer: [[0, 0], [0, -24], [0, 24]] });
    ctx.save(); ctx.fillStyle = alpha(tone, 0.9); ctx.beginPath(); ctx.arc(f.plot.x, dy, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
