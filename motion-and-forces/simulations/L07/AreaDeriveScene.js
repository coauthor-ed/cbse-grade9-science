/**
 * AreaDeriveScene - slide blk-l07-s19 "The second equation, from the area" (3 beats; Fig 4.19).
 * The symbolic velocity-time graph on the left, card 2 on the right.
 *   b0  the area under the line from 0 to t splits (kit areaUnder): the rectangle OACD (tone 1,
 *       "u x t") sweeps in, then the triangle ABC (tone 2) with its height BC = v - u and its tag
 *       "1/2 x t x (v - u)"; the whole area gets a dashed s-tone outline and card 2 writes
 *       [s] = u x t + 1/2 x t x (v - u), each term underlined in its area's tone.
 *   b1  the triangle's height label flips v - u -> at (and its tag); card 2 writes
 *       v - u = at, s = ut + 1/2 x t x at, then s = ut + 1/2 at^2 boxed.
 *   b2  the two areas merge into one trapezium (tone 4, dashed), parallel sides u and v, width t;
 *       the boxed equation moves up; below it, smaller, "try at home" s = 1/2 (u + v) t.
 */
import { KinematicsSetupScene } from './KinematicsSetupScene.js';
import { drawBackdrop, font, clamp01, outBack, inOutSine, lerp, alpha, rr } from 'simulations/base/kit/SimLook.js';
import { slopeTriangle, areaUnder } from 'simulations/base/kit/SimPlot.js';
import { drawPoint, drawTag } from '../shared/MotionGraph.js';

const M = '\u2212', X = '\u00d7', SQ = '\u00b2';
const P = { x: 376, y: 20, w: 296, h: 480 };
const HALF = { f: ['1', '2'] };

export class AreaDeriveScene extends KinematicsSetupScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A velocity-time graph with no numbers: velocity u at time zero rising in a straight line to v at time t. The area under the line is the displacement s. It splits into a rectangle u times t and a triangle one half times t times v minus u. Since v minus u equals a t, the working gives s equals u t plus one half times t times a t, that is, s equals u t plus one half a t squared, boxed. Then the two parts merge into one trapezium with parallel sides u and v and width t; its area gives another equation to try at home, s equals one half times u plus v times t.';

  busy() { return this.age < [5.0, 4.0, 2.4][this.key]; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const k = this.key, a = this.age, f = this.gf;
    const A = this.gpt('A'), B = this.gpt('B');
    const aRest = k === 0 ? a : 99;                                // b1, b2 open on b0 at rest
    const dim = k === 0 ? 1 - 0.3 * clamp01((a - 3.0) / 0.5) : 0.7;
    this.symGraph(ctx, c, { alpha: dim, lineK: k === 0 ? clamp01(a / 0.5) : 1, guides: 0 });
    const merge = k === 2 ? inOutSine(clamp01((a - 0.2) / 0.7)) : 0;
    // Rectangle, then triangle (kit areaUnder split).
    const r = clamp01((aRest - 0.7) / 0.6), tri = clamp01((aRest - 1.6) / 0.6);
    const [ax, ay] = f.at(A), [bx] = f.at(B);
    const fa = 0.32 * (1 - merge);                                 // the kit fill alpha, fading as they merge
    if (r > 0 && merge < 1) areaUnder(ctx, c, f, [A, [B[0] * r, A[1]]], { col: c.s1, alpha: fa });
    if (tri > 0 && merge < 1) {
      ctx.save();
      ctx.beginPath(); ctx.rect(ax - 2, f.plot.y, (bx - ax) * tri + 4, ay - f.plot.y); ctx.clip();
      areaUnder(ctx, c, f, [A, B], { split: true, tones: [c.s1, c.s2], alpha: fa });
      ctx.restore();
    }
    if (merge > 0) this.trapezium(ctx, c, merge);
    // Triangle height BC: v - u, flipping to at in b1.
    const legs = clamp01((aRest - 2.1) / 0.3) * (1 - merge), flip = k >= 1 ? clamp01((a - 0.3) / 0.4) : 0;
    if (legs > 0) {
      ctx.save(); ctx.globalAlpha = legs * (1 - flip);
      slopeTriangle(ctx, c, f, A, B, { letters: false, rise: 'v ' + M + ' u', run: null, col: c.annot, fill: 0 });
      ctx.restore();
      if (flip > 0) {
        ctx.save(); ctx.globalAlpha = legs * flip;
        slopeTriangle(ctx, c, f, A, B, { letters: false, rise: 'at', run: null, col: c.annot, fill: 0 });
        ctx.restore();
      }
    }
    drawPoint(ctx, c, f, A, k === 0 ? a - 0.4 : 9, { col: c.s1 });
    drawPoint(ctx, c, f, B, k === 0 ? a - 0.5 : 9, { col: c.s1 });
    // Area tags.
    const tr = clamp01((aRest - 1.3) / 0.3) * (1 - merge), tt = clamp01((aRest - 2.4) / 0.3) * (1 - merge);
    let box = null;
    if (tr > 0) box = drawTag(ctx, c, 'u ' + X + ' t', f.px(4), f.py(1.5), { col: c.s1, alpha: tr });
    if (tt > 0) {
      const g = f.at([2 * 8 / 3, 5]), tx = f.px(4.6), ty = f.py(10.5);
      ctx.save();
      ctx.globalAlpha = tt; ctx.strokeStyle = c.s2; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(tx, ty + 20); ctx.lineTo(g[0], g[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c.s2; ctx.beginPath(); ctx.arc(g[0], g[1], 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const t0 = '1/2 ' + X + ' t ' + X + ' (v ' + M + ' u)', t1 = '1/2 ' + X + ' t ' + X + ' at';
      drawTag(ctx, c, t0, tx, ty, { col: c.s2, alpha: tt * (1 - flip), avoid: box ? [box] : [] });
      if (flip > 0) drawTag(ctx, c, t1, tx, ty, { col: c.s2, alpha: tt * flip, avoid: box ? [box] : [] });
    }
    // The whole area is s: a dashed s-tone outline (b0).
    const so = k === 0 ? clamp01((a - 2.8) / 0.4) : 0;
    if (so > 0) this.outline(ctx, c, so, false);
    if (k === 0) this.cardB0(ctx, c, a);
    else if (k === 1) this.cardB1(ctx, c, a);
    else this.cardB2(ctx, c, a);
  }

  /** The area OABD as one outline (dashed, s tone); filled when merged. */
  outline(ctx, c, k, fill) {
    const f = this.gf, pts = ['O', 'A', 'B', 'D'].map((n) => f.at(this.gpt(n)));
    ctx.save();
    ctx.globalAlpha = k;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    if (fill) { ctx.fillStyle = alpha(c.s4, 0.26); ctx.fill(); }
    ctx.strokeStyle = c.s4; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  /** b2: the trapezium, its parallel sides u and v and its width t. */
  trapezium(ctx, c, k) {
    const f = this.gf;
    this.outline(ctx, c, k, true);
    const [, ay] = f.at(this.gpt('A')), [dx, dy] = f.at(this.gpt('D')), [, by] = f.at(this.gpt('B')), [ox] = f.at([0, 0]);
    const yw = f.py(0.8);
    ctx.save();
    ctx.globalAlpha = k; ctx.strokeStyle = c.s4; ctx.fillStyle = c.s4; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox + 10, yw); ctx.lineTo(dx - 10, yw); ctx.stroke();
    [[ox + 6, 1], [dx - 6, -1]].forEach(([x, s]) => { ctx.beginPath(); ctx.moveTo(x, yw); ctx.lineTo(x + 14 * s, yw - 8); ctx.lineTo(x + 14 * s, yw + 8); ctx.closePath(); ctx.fill(); });
    ctx.restore();
    const col = c.s4;
    drawTag(ctx, c, 't', (ox + dx) / 2, yw, { col, alpha: k });
    drawTag(ctx, c, 'u', ox + 16, (ay + dy) / 2 - 14, { col: this.symCol(c, 'u'), align: 'left', alpha: k });
    drawTag(ctx, c, 'v', dx + 16, (by + dy) / 2, { col: this.symCol(c, 'v'), align: 'left', alpha: k });
  }

  /** Underline an eq() item in its area's tone. */
  under(ctx, r, i, col, y, k) {
    if (k <= 0) return;
    const b = r.boxes[i];
    ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = col;
    ctx.fillRect(b.x, y, b.w * k, 6);
    ctx.restore();
  }

  /** b0: [s] = u x t + 1/2 x t x (v - u). */
  cardB0(ctx, c, a) {
    const k0 = clamp01((a - 2.9) / 0.3);
    if (k0 <= 0) return;
    this.algebraCard(ctx, c, P, '2', k0);
    const y1 = P.y + 150, y2 = P.y + 270;
    this.chip(ctx, c, 's', P.x + 52, y1, { scale: outBack(k0), r: 30 });
    const k1 = clamp01((a - 3.1) / 0.8), k2 = clamp01((a - 3.8) / 0.8);
    const r1 = this.eq(ctx, c, [' = ', 'u ' + X + ' t'], P.x + 82, y1, 36, { align: 'left', k: k1 });
    this.under(ctx, r1, 1, c.s1, y1 + 30, k1);
    const r2 = this.eq(ctx, c, ['+ ', HALF, ' ' + X + ' t ' + X + ' (v ' + M + ' u)'], P.x + P.w / 2, y2, 30, { k: k2 });
    ctx.save(); ctx.globalAlpha = k2; ctx.fillStyle = c.s2;
    ctx.fillRect(r2.boxes[1].x, y2 + 50, r2.x1 - r2.boxes[1].x, 6);
    ctx.restore();
  }

  /** b1: v - u = at; s = ut + 1/2 x t x at; s = ut + 1/2 at^2 boxed. */
  cardB1(ctx, c, a) {
    this.algebraCard(ctx, c, P, '2');
    const cx = P.x + P.w / 2;
    const k1 = clamp01((a - 0.3) / 0.8), k2 = clamp01((a - 1.3) / 0.8), k3 = clamp01((a - 2.3) / 0.8), bx = clamp01((a - 3.1) / 0.4);
    this.eq(ctx, c, ['v ' + M + ' u = at'], cx, P.y + 110, 34, { k: k1, alpha: 1 - 0.25 * k2 });
    this.eq(ctx, c, ['s = ut + ', HALF, ' ' + X + ' t ' + X + ' at'], cx, P.y + 230, 28, { k: k2, alpha: 1 - 0.25 * k3 });
    this.hero(ctx, c, cx, P.y + 370, k3, bx);
  }

  /** The boxed s = ut + 1/2 at^2. */
  hero(ctx, c, cx, y, k, bx) {
    if (k <= 0) return;
    const r = this.eq(ctx, c, ['s = ut + ', HALF, ' at' + SQ], cx, y, 44, { k });
    this.heroBox(ctx, c, r, bx);
  }

  /** b2: the boxed equation moves up; "try at home": s = 1/2 (u + v) t, smaller. */
  cardB2(ctx, c, a) {
    this.algebraCard(ctx, c, P, '2');
    const cx = P.x + P.w / 2, mv = inOutSine(clamp01(a / 0.5));
    this.hero(ctx, c, cx, lerp(P.y + 370, P.y + 120, mv), 1, 1);
    const k1 = clamp01((a - 1.0) / 0.4), k2 = clamp01((a - 1.3) / 0.8);
    if (k1 > 0) {
      ctx.save();
      ctx.globalAlpha = k1; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.labelMuted;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('try at home', cx, P.y + 270);
      ctx.restore();
    }
    const r = this.eq(ctx, c, ['s = ', HALF, ' (u + v) t'], cx, P.y + 350, 32, { k: k2 });
    if (k2 > 0) {
      ctx.save();
      ctx.globalAlpha = k2; ctx.strokeStyle = c.s4; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
      rr(ctx, r.x0 - 14, r.y0 - 8, r.x1 - r.x0 + 28, r.y1 - r.y0 + 16, 12); ctx.stroke();
      ctx.restore();
    }
  }
}
