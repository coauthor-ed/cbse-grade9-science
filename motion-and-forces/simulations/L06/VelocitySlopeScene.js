/**
 * VelocitySlopeScene - explain blk-l06-s3 "Slope gives acceleration" (2 beats; Fig 4.17 d, e).
 * Velocity-time graph 0-30 s, 0-15 m/s (the book's scale for cars 2 and 3), panel right.
 *   b0  the rising line v = 0.5 t; A (10 s, 5 m/s) and B (20 s, 10 m/s) pop; the kit slope
 *       triangle draws CA, then BC; tags "CA = 10 s", "BC = 5 m/s"; the panel builds
 *       a = BC / CA, = 5 m/s / 10 s, = 0.5 m/s2 (the hero).
 *   b1  the rising line and its triangle dim; the falling line v = 15 - 0.5 t with its
 *       triangle A (10 s, 10 m/s), B (20 s, 5 m/s), C (20 s, 10 m/s): the vertical leg points
 *       down; tags "10 s", "-5 m/s"; the panel builds to -0.5 m/s2; below it a car with v
 *       forward and a backward gives the minus sign a picture.
 * Only one triangle carries the letters A, B, C at a time.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01 } from 'simulations/base/kit/SimLook.js';
import { slopeTriangle } from 'simulations/base/kit/SimPlot.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, curveData, drawTag, drawSheet, DIM } from '../shared/MotionGraph.js';

const UP = curveData((t) => 0.5 * t, 0, 30, 12), DOWN = curveData((t) => 15 - 0.5 * t, 0, 30, 12);
const BEATS = [
  { line: UP, A: [10, 5], B: [20, 10], run: 'CA = 10 s', rise: 'BC = 5 m/s', top: '5 m/s', res: '0.5 m/s\u00b2' },
  { line: DOWN, A: [10, 10], B: [20, 5], run: '10 s', rise: '-5 m/s', top: '-5 m/s', res: '-0.5 m/s\u00b2' },
];
const PANEL = { x: 428, y: 20, w: 244, h: 272 };

export class VelocitySlopeScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A velocity-time graph. On the rising line, point A is at 10 seconds and 5 metres per second, point B at 20 seconds and 10 metres per second. BC is 5 metres per second and CA is 10 seconds, so the acceleration is 5 divided by 10, 0.5 metres per second squared. On the falling line, from 10 seconds to 20 seconds the velocity falls from 10 to 5 metres per second: BC is minus 5 metres per second, so the acceleration is minus 0.5 metres per second squared, opposite to the velocity. A car moving forward has its acceleration arrow pointing backward.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.f = graphFrame({ x: 6, y: 12, w: 392, h: 500 }, { x: { max: 30, step: 5, title: 'time (s)' }, y: { max: 15, step: 5, minor: 10, title: 'velocity (m/s)' } });
  }

  enter(stage) { this.cur = stage; }
  get key() { return Math.max(0, Math.min(1, this.cur | 0)); }
  busy() { return this.age < 3.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const f = this.f, k = this.key, a = this.age;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    if (k === 1) {                         // the rising line stays dim; its triangle is a soft fill only (no dashed legs)
      const [p, q] = [f.at(BEATS[0].A), f.at(BEATS[0].B)];
      ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = c.labelMuted;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill();
      ctx.restore();
      drawThrough(ctx, c, f, UP, 1, { width: 5, alpha: DIM });
    }
    this.triangle(ctx, c, f, BEATS[k], a, k === 1 ? c.s4 : c.s1);
    this.equation(ctx, c, BEATS[k], a);
    if (k === 1) this.car(ctx, c, clamp01((a - 2.8) / 0.5));
  }

  /** The line draws on; A and B pop; CA then BC draw; their tags; letters once whole. */
  triangle(ctx, c, f, B, a, lineCol) {
    const col = c.annot;
    drawThrough(ctx, c, f, B.line, clamp01(a / 0.5), { width: 6, col: lineCol });
    const ca = clamp01((a - 1.0) / 0.4), bc = clamp01((a - 1.5) / 0.4);
    const [A0, A1] = B.A, [B0, B1] = B.B;
    if (ca > 0 && bc <= 0) slopeTriangle(ctx, c, f, B.A, [A0 + (B0 - A0) * ca, A1], { letters: false, col });
    if (bc > 0) slopeTriangle(ctx, c, f, B.A, [B0, A1 + (B1 - A1) * bc], { letters: bc >= 1, col });
    drawPoint(ctx, c, f, B.A, a - 0.55, { col: lineCol });
    drawPoint(ctx, c, f, B.B, a - 0.8, { col: lineCol });
    const [ax, ay] = f.at(B.A), [bx, by] = f.at(B.B);
    if (bc > 0 && B1 < A1) {                // the vertical leg runs down from C to B: a head at its end
      const [, cy] = f.at([B0, A1]), y = cy + ((by - cy) * bc) / 2 + 8;   // mid-leg, pointing down
      ctx.save();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx, y + 4); ctx.lineTo(bx - 11, y - 14); ctx.lineTo(bx + 11, y - 14); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    const down = B1 < A1, hb = 1 - 0.2 * clamp01((a - 2.0) / 0.4);
    let run = null;
    if (ca >= 1) run = drawTag(ctx, c, B.run, (ax + bx) / 2, down ? ay - 46 : ay + 48, { col, alpha: hb });
    if (bc >= 1) drawTag(ctx, c, B.rise, bx + 16, (ay + by) / 2, { col, align: 'left', alpha: hb, avoid: run ? [run] : [] });
  }

  /** a = BC / CA, = rise / run, = result: line by line, the newest the hero. */
  equation(ctx, c, B, a) {
    const P = PANEL, l1 = clamp01((a - 2.0) / 0.4), l2 = clamp01((a - 2.4) / 0.4), l3 = clamp01((a - 2.8) / 0.5);
    if (l1 <= 0) return;
    drawSheet(ctx, c, P, { alpha: l1 });
    const cx = P.x + P.w / 2, ink = c.label;
    ctx.save();
    ctx.textBaseline = 'middle';
    const frac = (x, y, top, bot, size, al) => {
      ctx.globalAlpha = al; ctx.font = font(c, 800, size, true); ctx.fillStyle = ink; ctx.textAlign = 'center';
      const w = Math.max(ctx.measureText(top).width, ctx.measureText(bot).width) + 12;
      ctx.fillText(top, x, y - size * 0.62); ctx.fillText(bot, x, y + size * 0.66);
      ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke();
    };
    const dimOld = (later) => 1 - 0.45 * later;
    let al = l1 * dimOld(l2), y = P.y + 56;
    ctx.globalAlpha = al; ctx.font = font(c, 800, 28, true); ctx.fillStyle = ink; ctx.textAlign = 'right';
    ctx.fillText('a =', cx - 2, y);
    frac(cx + 44, y, 'BC', 'CA', 26, al);
    if (l2 > 0) {
      al = l2 * dimOld(l3); y = P.y + 148;
      ctx.globalAlpha = al; ctx.font = font(c, 800, 28, true); ctx.fillStyle = ink; ctx.textAlign = 'right';
      ctx.fillText('=', cx - 52, y);
      frac(cx + 10, y, B.top, '10 s', 28, al);
    }
    if (l3 > 0) {
      const s = 0.85 + 0.15 * l3;
      ctx.globalAlpha = l3; ctx.textAlign = 'center';
      ctx.translate(cx, P.y + 228); ctx.scale(s, s);
      ctx.font = font(c, 900, 42, true); ctx.fillStyle = c.annot;
      ctx.fillText('= ' + B.res, 0, 0);
    }
    ctx.restore();
  }

  /** A car moving forward while it slows: v forward, a backward. */
  car(ctx, c, k) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k;
    const spec = trackSpec({ from: 0, to: 10, x0: 432, x1: 668, y: 474 });
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 22 });
    const cx = 528;
    const body = drawCar(ctx, c, { x: cx, y: spec.y, length: 140, roll: 0, tone: 4 });
    const roof = body.box ? body.box.y0 : spec.y - 64;
    ctx.restore();
    drawMotionArrow(ctx, c, 'v', cx, roof - 14, { length: 110, label: 'v', side: 1, alpha: k });
    drawMotionArrow(ctx, c, 'a', cx, roof - 58, { length: 70, angle: Math.PI, label: 'a', side: -1, alpha: k });
  }
}
