/**
 * PushLetGoScene - predict blk-l14-s9 "Push, then let go" (setup) and explain blk-l14-s10 "When the push ends"
 * (1 beat). A cart (kit cart) on the ideal floor (glassy, dashed edge) on a table top; your hand pushes it
 * from behind with a steady force, then lifts away.
 *   setup  the hand pushes with a steady F arrow, the cart speeds up (v arrow grows); the frame freezes at the
 *          instant the hand lifts off. No graph, no dots after the release, no answer.
 *   b0     top: the cart run; bottom: a v-t graph (no numbers) drawn in step. While the hand pushes: F and a
 *          arrows on the cart, v grows, the graph rises in a straight line ("push"). At "let go" the F arrow
 *          goes, the a arrow becomes the kit dot "a = 0", the graph turns flat; the cart glides on with equal
 *          dots. Rest: graph complete, cart gliding.
 * Physics: constant force F for TP s gives constant a = V1 / TP, x = 1/2 a t sq, v = a t; then zero force,
 * v = V1, x grows by V1 per second. Dots every DT from x(t). Every frame is a function of the beat and its age.
 * Subclasses CartLabScene for the ideal floor, the hand and the dots.
 */
import { CartLabScene } from './CartLabScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix } from 'simulations/base/kit/SimLook.js';
import { propRig, drawCart } from 'simulations/base/kit/SimProps.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag, graphFrame, drawGraphPaper, drawAxes, drawThrough } from '../shared/MotionGraph.js';
import { drawForce } from '../shared/ForceCast.js';

const SETUP = 9;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const NOX = () => '';
const T0 = 0.5, TP = 1.4, TG = 1.9, V1 = 160, DT = 0.2, CW = 150, X0 = 60;
const ACC = V1 / TP, XP = 0.5 * V1 * TP;

export class PushLetGoScene extends CartLabScene {
  static MODE = 'push';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Push, then let go. A cart stands on a table with no friction. Your hand pushes it from behind with a steady force: the cart has a constant acceleration and its velocity keeps rising, and on the velocity-time graph the line rises straight. Then the hand lets go: the force is zero, so the acceleration becomes zero at once. The cart keeps the velocity it had at that instant: the dots it leaves at equal times are now equally spaced, and the graph turns flat.';

  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < (this.isSetup() ? T0 + TP + 0.6 : T0 + TP + TG + 0.8); }

  /** Cart back edge (px from X0) and velocity t s after the push starts. */
  motion(t) {
    if (t <= 0) return { x: 0, v: 0, push: false };
    if (t < TP) return { x: 0.5 * ACC * t * t, v: ACC * t, push: true };
    const tg = Math.min(t - TP, TG);
    return { x: XP + V1 * tg, v: V1, push: false };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.isSetup()) this.setupFrame(ctx, c); else this.ends(ctx, c);
  }

  /**
   * A plain disc wheel with a hub (drawn over the kit cart's wheel: its three spokes read as a small face at
   * 1x). Same tokens as the kit wheel: dark tyre, a pale disc, a lower shade, a hub, a highlight top left.
   */
  discWheel(ctx, c, x, y, r) {
    const tyre = mix(c.bgDeep, c.label, 0.28), disc = mix(c.bgSurface, c.label, 0.35);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y + 2, r + 1, 0, Math.PI * 2); ctx.fillStyle = darken(tyre, 0.4); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2); ctx.fillStyle = tyre; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.64, 0, Math.PI * 2); ctx.fillStyle = disc; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(disc, 0.18); ctx.fillRect(x - r, y + r * 0.15, 2 * r, r); ctx.restore();
    ctx.strokeStyle = darken(disc, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.26, 0, Math.PI * 2); ctx.fillStyle = darken(disc, 0.32); ctx.fill();
    ctx.fillStyle = alpha(lighten(tyre, 0.5), 0.5);
    ctx.beginPath(); ctx.ellipse(x - r * 0.45, y - r * 0.5, r * 0.28, r * 0.14, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** The cart and your hand on floor FL at run state m; hand lift k (0 on, 1 gone). */
  rigAt(ctx, c, FL, m, lift) {
    const back = X0 + m.x, cart = drawCart(ctx, c, propRig({ x0: 0, scale: 1, groundY: FL }), back + CW / 2, { w: CW, h: 56, tone: 5, wheelAngle: m.x / 11 });
    for (const f of [0.24, 0.76]) this.discWheel(ctx, c, back + CW * f, FL - 11, 11);
    const P = { x: Math.min(cart.left.x, X0 + XP) - 14 * lift, y: cart.left.y - 16 * lift };
    this.hand(ctx, c, P, { len: 84, view: 'back', dir: -Math.PI / 2, palm: 1, arm: { x: P.x - 240, y: P.y - 50 }, alpha: 1 - 0.3 * clamp01((lift - 0.4) / 0.6) });
    return cart;
  }

  // -- setup: push, freeze as the hand lifts off ------------------------------------------------------------
  setupFrame(ctx, c) {
    const FL = 300, t = Math.min(this.age - T0, TP), m = this.motion(t), lift = ease(this.age, T0 + TP, 0.25) * 0.5;
    this.table(ctx, c, { x0: 16, x1: 664, Y: FL + 24, floor: 508, k: 1 }, {});
    this.idealFloor(ctx, c, 16, 664, FL, 30);
    const cart = this.rigAt(ctx, c, FL, m, lift);
    if (m.push && this.age < T0 + TP - 0.02) drawForce(ctx, c, cart.right.x, cart.right.y, { length: 90, label: 'F', fit: false });
    if (m.v > 1) drawMotionArrow(ctx, c, 'v', cart.top.x - 30, cart.top.y - 40, { length: 26 + 110 * m.v / V1, label: 'v', side: 1 });
  }

  // -- b0: the push ends -------------------------------------------------------------------------------------
  ends(ctx, c) {
    const a = this.age, t = a - T0, m = this.motion(t), FL = 186;
    const off = clamp01((t - TP) / 0.3), lift = t > TP ? ease(t, TP, 0.5) : 0;
    this.idealFloor(ctx, c, 16, 720, FL, 30);
    const xs = [];
    for (let k = 0; t >= 0 && k * DT <= Math.min(t, TP + TG) + 1e-6; k++) xs.push(X0 + this.motion(k * DT).x);
    this.dots(ctx, c, xs, FL);
    const cart = this.rigAt(ctx, c, FL, m, lift);
    if (m.push) {
      drawForce(ctx, c, cart.right.x, cart.right.y, { length: 84, label: 'F', fit: false, alpha: ease(t, 0, 0.15) });
      drawMotionArrow(ctx, c, 'a', cart.top.x - 30, cart.top.y - 30, { length: 80, label: 'a', side: 1, alpha: ease(t, 0, 0.15) });
    } else if (t > TP) {
      drawMotionArrow(ctx, c, 'a', cart.top.x, cart.top.y - 30, { length: 0, label: 'a = 0', side: 1, alpha: off });
    }
    // the v-t graph, drawn in step with the cart
    const TT = TP + TG, f = graphFrame({ x: 8, y: 248, w: 664, h: 268 }, { x: { max: 8, step: 8, minor: 24, title: 'time (s)', fmt: NOX }, y: { max: 3, step: 3, minor: 9, title: 'velocity (m/s)', fmt: NOX } });
    drawGraphPaper(ctx, c, f); drawAxes(ctx, c, f, 99);
    const g = (tt) => [8 * tt / TT, 2.3 * this.motion(tt).v / V1];
    const tn = clamp01(t / TT) * TT, data = [];
    if (t > 0) {
      data.push(g(0));
      if (tn < TP) data.push(g(tn)); else { data.push(g(TP)); data.push(g(tn)); }
      drawThrough(ctx, c, f, data, 1);
    }
    const [lx, ly] = f.at(g(TP)), boxes = [];
    if (t > 0.4) boxes.push(drawTag(ctx, c, 'push', f.at(g(TP * 0.45))[0] - 22, f.at(g(TP * 0.45))[1] - 50, { align: 'center', alpha: ease(t, 0.4, 0.3), prefer: [[0, 0]], col: c.accent }));
    if (t > TP) {
      const k = ease(t, TP, 0.3);
      ctx.save(); ctx.globalAlpha *= k; ctx.setLineDash([8, 7]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, f.base); ctx.lineTo(lx, ly - 8); ctx.stroke(); ctx.restore();
      boxes.push(drawTag(ctx, c, 'let go', lx + 40, ly - 40, { align: 'left', alpha: k, avoid: boxes, prefer: [[0, 0], [0, -20]], col: c.accent }));
    }
  }
}
