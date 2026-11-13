/**
 * DeriveVScene - slide blk-l07-s17 "The first equation: v = u + at" (1 beat; Fig 4.19, Eq 4.4a).
 * The symbolic velocity-time graph (u at t = 0, v at time t) on the left; card 1 on the right.
 *   The line draws on from A (0, u) to B (t, v); the kit slope triangle draws its run CA = t, then
 *   its rise BC = v - u. Card 1 writes three lines, 0.8 s each, the older ones dimming:
 *   a = (v - u) / t, then at = v - u (the rise label flips to "at"), then v = u + at, boxed:
 *   as it lands, DC (height u) lights in the u tone under CB (now "at"), so the picture shows v
 *   built as u plus at. The graph dims while the algebra writes, except the parts each line names.
 */
import { KinematicsSetupScene } from './KinematicsSetupScene.js';
import { drawBackdrop, clamp01, outBack } from 'simulations/base/kit/SimLook.js';
import { slopeTriangle } from 'simulations/base/kit/SimPlot.js';
import { drawPoint, drawTag } from '../shared/MotionGraph.js';

const MINUS = ' \u2212 ';
const L1 = 2.0, L2 = 2.9, L3 = 3.8, WR = 0.8;
const P = { x: 376, y: 20, w: 296, h: 480 };

export class DeriveVScene extends KinematicsSetupScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A velocity-time graph with no numbers: the velocity is u at time zero and v at time t, joined by a straight line. A slope triangle under the line has a run of t and a rise of v minus u. Beside it the working is written line by line: a equals v minus u over t; multiply both sides by t: a t equals v minus u; so v equals u plus a t, boxed. On the graph the height u and the rise a t stack up to make v.';

  busy() { return this.age < L3 + WR + 1.0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age, f = this.gf;
    const k1 = clamp01((a - L1) / WR), k2 = clamp01((a - L2) / WR), k3 = clamp01((a - L3) / WR);
    const dim = 1 - 0.35 * k1;                                     // the graph steps back once the algebra starts
    this.symGraph(ctx, c, { alpha: dim, lineK: clamp01(a / 0.6), lineAlpha: dim, lit: { u: k3, v: k3 } });
    // The slope triangle: run CA, then rise BC (labels lit while the lines name them).
    const A = this.gpt('A'), B = this.gpt('B'), C = this.gpt('C');
    const ca = clamp01((a - 0.8) / 0.4), bc = clamp01((a - 1.3) / 0.4), col = c.annot;
    if (ca > 0 && bc <= 0) slopeTriangle(ctx, c, f, A, [A[0] + (B[0] - A[0]) * ca, A[1]], { letters: false, col });
    if (bc > 0) {
      const flip = k2;                                             // v - u becomes at
      const Bp = [B[0], A[1] + (B[1] - A[1]) * bc];
      ctx.save(); ctx.globalAlpha = 1 - flip;
      slopeTriangle(ctx, c, f, A, Bp, { letters: false, col, rise: bc >= 1 ? 'v' + MINUS + 'u' : null, run: 't' });
      ctx.restore();
      if (flip > 0) {
        ctx.save(); ctx.globalAlpha = flip;
        slopeTriangle(ctx, c, f, A, Bp, { letters: false, col, rise: 'at', run: 't' });
        ctx.restore();
      }
    }
    drawPoint(ctx, c, f, A, a - 0.4, { col: c.s1 });
    drawPoint(ctx, c, f, B, a - 0.6, { col: c.s1 });
    // v = u + at on the picture: DC (height u) lights under CB (at).
    if (k3 > 0) {
      const [dx, dy] = f.at(this.gpt('D')), [, cy] = f.at(C);
      ctx.save();
      ctx.globalAlpha = k3; ctx.strokeStyle = this.symCol(c, 'u'); ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy + (cy - dy) * k3); ctx.stroke();
      ctx.restore();
      drawTag(ctx, c, 'u', dx + 16, (dy + cy) / 2, { col: this.symCol(c, 'u'), align: 'left', alpha: k3 });
    }
    this.algebra(ctx, c, k1, k2, k3, clamp01((a - L3 - WR) / 0.4));
  }

  /** Card 1: three lines, the newest the hero. */
  algebra(ctx, c, k1, k2, k3, box) {
    if (k1 <= 0) return;
    const cx = P.x + P.w / 2;
    this.algebraCard(ctx, c, P, '1', clamp01(k1 * 3));
    this.eq(ctx, c, ['a = ', { f: ['v' + MINUS + 'u', 't'] }], cx, P.y + 130, 36, { k: k1, alpha: 1 - 0.25 * k2 });
    this.eq(ctx, c, ['at = v' + MINUS + 'u'], cx, P.y + 240, 36, { k: k2, alpha: 1 - 0.25 * k3 });
    if (k3 <= 0) return;
    const s = 0.9 + 0.1 * outBack(k3);
    const ctxS = ctx;
    ctxS.save();
    ctxS.translate(cx, P.y + 360); ctxS.scale(s, s); ctxS.translate(-cx, -(P.y + 360));
    const r = this.eq(ctx, c, ['v = u + at'], cx, P.y + 360, 50, { k: k3 });
    this.heroBox(ctx, c, r, box);
    ctxS.restore();
  }
}
