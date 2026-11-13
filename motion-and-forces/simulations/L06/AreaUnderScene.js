/**
 * AreaUnderScene - slide blk-l06-s4 "Area gives displacement" (1 beat; Fig 4.18 a).
 * AreaSplitScene subclasses it for blk-l06-n01 (static MODE = 'split'; Fig 4.18 b).
 *   'rect'  axes 0-6 s, 0-30 m/s; the first car's flat line at 20 m/s. A sweep line runs
 *           0 -> 6 s and the rectangle fills behind it (kit areaUnder) while the car on the
 *           road above moves by x = 20 t; its nose is its position, marked down to the metre
 *           scale. The area-so-far tag and the road counter share one tone and one value
 *           (at 3 s both read 60 m). Rest: OABC whole, 20 m/s x 6 s = 120 m, car nose at 120 m.
 *   'split' axes 0-30 s, 0-15 m/s; car 2's rising line v = 0.5 t; the 10-20 s strip: the
 *           rectangle ACDE fills (tone 1, "50 m"), then the triangle ABC (tone 2, "25 m"), then
 *           50 m + 25 m = 75 m with 75 m the hero. Book letters A, B, C, D, E. No car.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01 } from 'simulations/base/kit/SimLook.js';
import { areaUnder } from 'simulations/base/kit/SimPlot.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawScale } from 'simulations/base/kit/SimTrack.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, curveData, drawTag, drawSheet } from '../shared/MotionGraph.js';

const V1 = 20, T1 = 6, LEAD = 0.3, RUN = 3.0, CAR = 140, CAR_M = 4.2;
const FLAT = [[0, V1], [T1, V1]];
const UP = curveData((t) => 0.5 * t, 0, 30, 12);
const PA = [10, 5], PB = [20, 10], PC = [20, 5], PD = [20, 0], PE = [10, 0];
const X = '\u00d7';

export class AreaUnderScene extends SimScene {
  static MODE = 'rect';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A car moves at a steady 20 metres per second for 6 seconds. As time runs, the area under its flat velocity-time line fills as a rectangle while the car moves along the road, and the area so far always equals the metres travelled so far: 60 metres at 3 seconds. The full rectangle OABC is 20 metres per second times 6 seconds, which is 120 metres, and the car stands with its front at the 120 metre mark. The area under a velocity-time graph gives the displacement.';

  constructor(container, config) {
    super(container, config);
    const split = this.constructor.MODE === 'split';
    this.f = split
      ? graphFrame({ x: 6, y: 12, w: 392, h: 500 }, { x: { max: 30, step: 5, title: 'time (s)' }, y: { max: 15, step: 5, minor: 10, title: 'velocity (m/s)' } })
      : graphFrame({ x: 6, y: 206, w: 424, h: 312 }, { x: { max: T1, step: 1, title: 'time (s)' }, y: { max: 30, step: 10, title: 'velocity (m/s)' } });
  }

  busy() { return this.age < (this.constructor.MODE === 'split' ? 3.8 : LEAD + RUN + 1.4); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'split') this.drawSplit(ctx, c);
    else this.drawRect(ctx, c);
  }

  /** Small book letters with a halo, off the lines. */
  letters(ctx, c, f, list, al) {
    if (al <= 0) return;
    ctx.save();
    ctx.globalAlpha = al; ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    list.forEach(([s, p, dx, dy]) => {
      const [x, y] = f.at(p);
      ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.strokeText(s, x + dx, y + dy);
      ctx.fillStyle = c.annot; ctx.fillText(s, x + dx, y + dy);
    });
    ctx.restore();
  }

  // -- 'rect': Fig 4.18 a with the car --------------------------------------------------------
  drawRect(ctx, c) {
    const a = this.age, t = T1 * clamp01((a - LEAD) / RUN), x = V1 * t, tone = c.s2, f = this.f;
    const tq = Math.floor(t * 10 + 1e-6) / 10;      // clock, counter and area tag read the same instant
    const done = clamp01((a - LEAD - RUN - 0.2) / 0.5);
    // The road: the car's nose is its position, marked down to the metre scale.
    const spec = trackSpec({ from: -40, to: 160, x0: 16, x1: 664, y: 112 });
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 40 });
    drawScale(ctx, c, { vertical: false, at: tr.bottom + 12, p0: spec.toPx(0), p1: spec.toPx(120), from: 0, to: 120, every: 20, side: 1 });
    const nx = spec.toPx(x);
    drawCar(ctx, c, { x: nx - CAR / 2, y: spec.y, length: CAR, roll: (x * spec.scale) / (CAR / CAR_M), tone: 1 });
    ctx.save();
    ctx.strokeStyle = tone; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nx, spec.y + 2); ctx.lineTo(nx, tr.bottom + 4); ctx.stroke();
    ctx.restore();
    const label = Math.round(V1 * tq) + ' m';
    drawTag(ctx, c, label, nx + 12, (spec.y + tr.bottom) / 2, { align: 'left', col: tone });
    // The graph: the rectangle fills behind the sweep line.
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    if (t > 0.001) areaUnder(ctx, c, f, [[0, V1], [t, V1]], { col: c.s1 });
    drawThrough(ctx, c, f, FLAT, 1, { width: 6 });
    if (done < 1) {
      const px = f.px(t);
      ctx.save();
      ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, f.base); ctx.lineTo(px, f.plot.y); ctx.stroke();
      ctx.restore();
    }
    if (t > 0.3) {
      const [x0] = f.at([0, V1]), [x1, y1] = f.at([t, V1]);
      drawTag(ctx, c, label, (x0 + x1) / 2, (y1 + f.base) / 2 + 6, { col: tone });
    }
    this.letters(ctx, c, f, [['A', [0, V1], 20, 22], ['B', [T1, V1], -20, 22], ['C', [T1, 0], -20, -20]], done);
    drawTag(ctx, c, 't = ' + (tq % 1 ? tq.toFixed(1) : tq) + ' s', 556, 236);
    // Rest: 20 m/s x 6 s = 120 m, 120 m the hero.
    if (done > 0) {
      const P = { x: 444, y: 290, w: 228, h: 180 }, cx = P.x + P.w / 2;
      drawSheet(ctx, c, P, { alpha: done });
      ctx.save();
      ctx.globalAlpha = done * 0.75; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.label;
      ctx.fillText('20 m/s ' + X + ' 6 s', cx, P.y + 52);
      ctx.globalAlpha = done; ctx.font = font(c, 900, 44, true); ctx.fillStyle = tone;
      ctx.fillText('= 120 m', cx, P.y + 118);
      ctx.restore();
    }
  }

  // -- 'split': Fig 4.18 b ----------------------------------------------------------------------
  drawSplit(ctx, c) {
    const a = this.age, f = this.f;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    const r = clamp01((a - 1.0) / 0.6), tri = clamp01((a - 1.9) / 0.6);
    const [ax, ay] = f.at(PA), [bx, by] = f.at(PB);
    if (r > 0) areaUnder(ctx, c, f, [PA, [10 + 10 * r, 5]], { col: c.s1 });
    if (tri > 0) {                     // the triangle ABC sweeps in, clipped above the rectangle
      ctx.save();
      ctx.beginPath(); ctx.rect(ax - 2, f.plot.y, (bx - ax) * tri + 4, ay - f.plot.y); ctx.clip();
      areaUnder(ctx, c, f, [PA, PB], { split: true, tones: [c.s1, c.s2] });
      ctx.restore();
    }
    drawThrough(ctx, c, f, UP, clamp01(a / 0.5), { width: 6 });
    drawPoint(ctx, c, f, PA, a - 0.55);
    drawPoint(ctx, c, f, PB, a - 0.8);
    // Dashed guides at 10 s and 20 s down to the time axis.
    const g = clamp01((a - 0.8) / 0.3);
    if (g > 0) {
      ctx.save();
      ctx.globalAlpha = g; ctx.strokeStyle = c.annot; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, f.base); ctx.moveTo(bx, by); ctx.lineTo(bx, f.base); ctx.stroke();
      ctx.restore();
    }
    this.letters(ctx, c, f, [['A', PA, -22, -18], ['B', PB, -22, -18], ['C', PC, 20, -16], ['D', PD, 18, -18], ['E', PE, -18, -18]], g);
    const s1 = clamp01((a - 1.6) / 0.3), s2 = clamp01((a - 2.5) / 0.3);
    let box = null;
    if (s1 > 0) box = drawTag(ctx, c, '50 m', (ax + bx) / 2, (ay + f.base) / 2, { col: c.s1, alpha: s1 });
    if (s2 > 0) drawTag(ctx, c, '25 m', (ax + 2 * bx) / 3 + 4, (2 * ay + by) / 3 - 4, { col: c.s2, alpha: s2, avoid: box ? [box] : [] });
    // 50 m + 25 m = 75 m, 75 m the hero.
    const l1 = clamp01((a - 2.8) / 0.4), l2 = clamp01((a - 3.2) / 0.4);
    if (l1 <= 0) return;
    const P = { x: 428, y: 130, w: 244, h: 200 }, cx = P.x + P.w / 2;
    drawSheet(ctx, c, P, { alpha: l1 });
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = l1 * (1 - 0.3 * l2); ctx.font = font(c, 800, 28, true);
    const w1 = ctx.measureText('50 m').width, w2 = ctx.measureText(' + ').width, w3 = ctx.measureText('25 m').width, x0 = cx - (w1 + w2 + w3) / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = c.s1; ctx.fillText('50 m', x0, P.y + 60);
    ctx.fillStyle = c.label; ctx.fillText(' + ', x0 + w1, P.y + 60);
    ctx.fillStyle = c.s2; ctx.fillText('25 m', x0 + w1 + w2, P.y + 60);
    if (l2 > 0) {
      const s = 0.85 + 0.15 * l2;
      ctx.globalAlpha = l2; ctx.textAlign = 'center';
      ctx.translate(cx, P.y + 132); ctx.scale(s, s);
      ctx.font = font(c, 900, 46, true); ctx.fillStyle = c.annot;
      ctx.fillText('= 75 m', 0, 0);
    }
    ctx.restore();
  }
}
