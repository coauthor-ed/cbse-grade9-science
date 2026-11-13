/**
 * PlotPositionScene - slide blk-l05-s1 "A picture of motion" (2 beats); PlotPointsScene
 * subclasses it for blk-l05-n01 (static MODE = 'points', 2 more beats).
 * Data: Table 4.3, x = 20 t m for t = 0..6 s.
 *   b0 (key 0): a car drives the 0-120 m road once at 20 m/s (compressed); a mark drops
 *       on the road each second and the matching table column lights. Rest: car at 120 m.
 *   b1 (key 1): the road shrinks to a strip, the graph paper grows; axes build; one
 *       5-square run on each axis is outlined: "5 squares = 1 s", "5 squares = 20 m".
 *   key 2: guides rise from 1 s and turn at 20 m; the 1 s point pops; the other six rows
 *       plot one by one while their table rows light.
 *   key 3: the line draws on through the 7 points; the in-between point (2.5 s, 50 m)
 *       gets guides to both axes and a tag.
 * Portrait (config.isPortrait): the b0 table is transposed into two columns.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, font, rr, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawStrobe, drawScale } from 'simulations/base/kit/SimTrack.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawGuides, drawThrough, drawCellRun, drawTag, drawSheet, DIM } from '../shared/MotionGraph.js';

const TIMES = [0, 1, 2, 3, 4, 5, 6];
const POS = TIMES.map((t) => 20 * t);
const DRIVE = 3.6;                // s on screen for the book's 6 s
const CAR = 140;
const ORDER = [0, 2, 3, 4, 5, 6]; // after the 1 s hero
const STEP = 0.45, HERO_AT = 1.35, REST_AT = 2.1;
const MID = [2.5, 50];

export class PlotPositionScene extends SimScene {
  static MODE = 'scale';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A car drives along a straight road from 0 to 120 metres at a steady speed. A mark drops on the road every second and a table lists its position: 0, 20, 40, 60, 80, 100 and 120 metres at 0 to 6 seconds. Then graph paper appears with time on the X-axis and position on the Y-axis; 5 small squares stand for 1 second and 5 small squares stand for 20 metres.';

  get key() { return (this.constructor.MODE === 'points' ? 2 : 0) + Math.max(0, Math.min(1, this.stage | 0)); }
  get tall() { return this.config?.isPortrait === true; }

  busy() {
    const k = this.key, a = this.age;
    return k === 0 ? a < DRIVE + 0.8 : k === 1 ? a < 4.2 : k === 2 ? a < REST_AT + ORDER.length * STEP + 0.6 : a < 4.4;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.key === 0) this.drawDrive(ctx, c);
    else this.drawGraphBeat(ctx, c);
  }

  // -- b0: the drive and the table ------------------------------------------------------------
  drawDrive(ctx, c) {
    const tall = this.tall, t = Math.min(6, (6 * this.age) / DRIVE), x = 20 * t;
    const spec = trackSpec({ from: -34, to: 126, x0: 16, x1: 664, y: tall ? 120 : 186 });
    this.road(ctx, c, spec, x, t, 1, 56);
    const lit = TIMES.map((ti) => (t + 1e-6 >= ti ? (this.age - (ti / 6) * DRIVE) : null));
    const rect = tall ? { x: 150, y: 258, w: 380, h: 254 } : { x: 16, y: 326, w: 648, h: 150 };
    this.table(ctx, c, rect, tall, lit, 1);
  }

  /** The road with O and 20 m marks, the strobe marks up to time t, the car with its nose at x. */
  road(ctx, c, spec, x, t, a, depth) {
    ctx.save(); ctx.globalAlpha = a;
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth });
    if (depth > 40) drawScale(ctx, c, { vertical: false, at: tr.bottom + 12, p0: spec.toPx(0), p1: spec.toPx(120), from: 0, to: 120, every: 20, side: 1 });
    drawStrobe(ctx, c, spec, { at: POS.slice(0, Math.floor(t + 1e-6) + 1), marks: 'dots' });
    drawCar(ctx, c, { x: spec.toPx(x) - CAR / 2, y: spec.y, length: CAR, roll: x, tone: 1 });
    if (depth > 40) drawTag(ctx, c, 't = ' + Math.floor(t + 1e-6) + ' s', 26, spec.y - 96, { align: 'left' });
    ctx.restore();
  }

  /** Table 4.3: two rows (landscape) or two columns (tall). lit[i]: seconds since the row lit, or null. */
  table(ctx, c, R, tall, lit, a) {
    ctx.save(); ctx.globalAlpha = a;
    drawSheet(ctx, c, R, { r: 14 });
    const n = TIMES.length, heads = [['time', '(s)'], ['position', '(m)']];
    const cells = [];
    if (tall) {
      const hh = 66, rh = (R.h - hh - 12) / n, cw = (R.w - 16) / 2;
      for (let j = 0; j < 2; j++) cells.push({ x: R.x + 8 + j * cw, y: R.y + 6, w: cw, h: hh, head: heads[j] });
      for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) cells.push({ x: R.x + 8 + j * cw, y: R.y + 6 + hh + i * rh, w: cw, h: rh, i, text: String(j ? POS[i] : TIMES[i]) });
    } else {
      const hw = 168, cw = (R.w - 16 - hw) / n, rh = (R.h - 12) / 2;
      for (let j = 0; j < 2; j++) cells.push({ x: R.x + 8, y: R.y + 6 + j * rh, w: hw, h: rh, head: [heads[j][0] + ' ' + heads[j][1]] });
      for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) cells.push({ x: R.x + 8 + hw + i * cw, y: R.y + 6 + j * rh, w: cw, h: rh, i, text: String(j ? POS[i] : TIMES[i]) });
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const q of cells) {
      if (q.head) {
        rr(ctx, q.x + 2, q.y + 2, q.w - 4, q.h - 4, 8); ctx.fillStyle = alpha(c.stroke, 0.18); ctx.fill();
        ctx.fillStyle = c.label; ctx.font = font(c, 800, 26);
        q.head.forEach((s, k) => ctx.fillText(s, q.x + q.w / 2, q.y + q.h / 2 + (k - (q.head.length - 1) / 2) * 28));
        continue;
      }
      const age = lit[q.i];
      if (age != null) {
        const f = clamp01(age / 0.5);
        rr(ctx, q.x + 3, q.y + 3, q.w - 6, q.h - 6, 8);
        ctx.fillStyle = alpha(c.s2, 0.16 + 0.34 * (1 - f)); ctx.fill();
      }
      ctx.globalAlpha = a * (age != null ? 1 : DIM);
      ctx.fillStyle = c.label; ctx.font = font(c, 800, 26);
      ctx.fillText(q.text, q.x + q.w / 2, q.y + q.h / 2 + 1);
      ctx.globalAlpha = a;
    }
    // Inner rules.
    ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 1.5; ctx.beginPath();
    if (tall) { const x = R.x + R.w / 2; ctx.moveTo(x, R.y + 12); ctx.lineTo(x, R.y + R.h - 12); ctx.moveTo(R.x + 12, R.y + 72); ctx.lineTo(R.x + R.w - 12, R.y + 72); }
    else { const y = R.y + R.h / 2; ctx.moveTo(R.x + 12, y); ctx.lineTo(R.x + R.w - 12, y); ctx.moveTo(R.x + 176, R.y + 12); ctx.lineTo(R.x + 176, R.y + R.h - 12); }
    ctx.stroke();
    ctx.restore();
  }

  // -- the graph beats ---------------------------------------------------------------------------
  frame(centre) {
    return graphFrame({ x: centre ? 128 : 8, y: 112, w: 424, h: 404 }, { x: { max: 6, step: 1, title: 'time (s)' }, y: { max: 120, step: 20, title: 'position (m)' } });
  }

  drawGraphBeat(ctx, c) {
    const k = this.key, a = this.age;
    const strip = trackSpec({ from: -34, to: 126, x0: 16, x1: 664, y: 78 });
    this.road(ctx, c, strip, 120, 6, DIM, 30);
    const f = this.frame(k === 1);
    ctx.save();
    if (k === 1) {   // the paper grows into place
      const g = clamp01(a / 0.6), s = 0.6 + 0.4 * (1 - (1 - g) ** 3), cx = f.sheet.x + f.sheet.w / 2, cy = f.sheet.y + f.sheet.h / 2;
      ctx.globalAlpha = g; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
    }
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, k === 1 ? a - 0.5 : 99);
    ctx.restore();
    if (k === 1) {
      const kx = clamp01((a - 1.9) / 0.6), ky = clamp01((a - 2.7) / 0.6);
      const bx = drawCellRun(ctx, c, f, 'x', 0, 1, kx);
      const by = drawCellRun(ctx, c, f, 'y', 100, 120, ky);
      if (kx >= 1) drawTag(ctx, c, '5 squares = 1 s', bx.x + 4, bx.y - 30, { align: 'left', col: c.annot, alpha: clamp01((a - 2.5) / 0.3) });
      if (ky >= 1) drawTag(ctx, c, '5 squares = 20 m', by.x + by.w + 12, by.y + by.h / 2, { align: 'left', col: c.annot, alpha: clamp01((a - 3.3) / 0.3) });
      return;
    }
    // Table 4.3 beside the graph (transposed).
    const when = (i) => (i === 1 ? HERO_AT : REST_AT + ORDER.indexOf(i) * STEP);
    const lit = TIMES.map((_, i) => (k === 3 ? 9 : a >= when(i) ? a - when(i) : null));
    this.table(ctx, c, { x: 434, y: 116, w: 240, h: 396 }, true, lit, k === 3 ? DIM : 1);
    if (k === 2) {
      drawGuides(ctx, c, f, [1, 20], clamp01((a - 0.2) / 1.1));
      TIMES.forEach((ti, i) => drawPoint(ctx, c, f, [ti, POS[i]], a - when(i), { r: i === 1 ? 11 : 9, col: i === 1 ? c.annot : c.s1 }));
      return;
    }
    // key 3: join the points, then read an in-between time.
    const data = TIMES.map((ti, i) => [ti, POS[i]]);
    drawThrough(ctx, c, f, data, clamp01((a - 0.2) / 1.5));
    data.forEach((d) => drawPoint(ctx, c, f, d, 9));
    drawGuides(ctx, c, f, MID, clamp01((a - 1.9) / 0.9));
    const pm = drawPoint(ctx, c, f, MID, a - 2.8, { r: 11, col: c.annot });
    if (pm && a > 3.0) {
      drawTag(ctx, c, '2.5 s, 50 m', pm[0] + 18, pm[1] - 30, { align: 'left', col: c.annot, alpha: clamp01((a - 3.0) / 0.3), segs: data.map(f.at), prefer: [[0, 0], [0, 62], [-200, -20]] });
    }
  }
}
