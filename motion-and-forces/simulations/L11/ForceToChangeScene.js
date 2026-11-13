/**
 * ForceToChangeScene - slide blk-l13-s9 "A force to change motion, not to keep it" (2 beats). Side views.
 *   b0 'change'  one long ideal-floor lane (GalileoScene.idealFloor), a wooden block in three stages:
 *                start: a hand pushes it from rest, F "push", v grows (dots spread out);
 *                keep moving: the hand has gone, it glides, equal dots with equal gaps, v constant,
 *                "net force = 0", "no force needed" (the hero);
 *                stop: a second hand ahead pushes back, F backward, v shrinks to "v = 0" (dots close up).
 *                Stage tags "start", "keep moving", "stop" above the lane. Hands are the CartLab hand (palm flat
 *                on the block, a sleeve that leaves the frame). Rest: the whole run; a faint record of the start
 *                (block outline, hand, "push"); the block stopped with the hand on it and its backward push.
 *   b1 'real'    a tiled floor, "you" (ForceCast drawPusher) and a crate. First you stop pushing: friction
 *                alone at the bottom of the crate, v shrinks, the crate slows (dots close up). Then you push
 *                again with a push equal to friction: two equal arrows, "net force = 0", steady speed,
 *                equal dots. Rest: steady, equal arrows.
 * Physics: start and stop with the same constant acceleration A (x = A t^2 / 2), glide at V = A T1; b1: constant
 * deceleration while friction acts alone, then constant velocity. Dots from x(t) at equal times.
 * Every frame is a function of the beat and its age only.
 */
import { GalileoScene } from './GalileoScene.js';
import { drawBackdrop, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn, drawPusher } from '../shared/ForceCast.js';
import { CartLabScene } from '../L12/CartLabScene.js';

const HAND = CartLabScene.prototype;              // the CartLab hand (hand, limb, skin): one hand look in L11-L12

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const NET0 = [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }];
// b0: start 100 px in T1, glide 250 px, stop 100 px in T1
const T0 = 0.4, T1 = 1.2, X0 = 104, D1 = 100, DK = 250, A = 2 * D1 / (T1 * T1), V = A * T1, TK = DK / V, DTD = 0.3;
const FL = 330, BW = 110, BH = 78, FPX = 84;
// b1: friction alone from V0 to V1 in TA, then push = friction at V1 for TB
const R = { T0: 0.3, TA: 1.4, TB: 2.2, V0: 110, V1: 60, X0: 220, FL: 404, W: 150, H: 128, F: 86, DT: 0.6 };

export class ForceToChangeScene extends GalileoScene {
  static MODE = 'change';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = {};
  static ARIA_LABEL = 'A force to change motion, not to keep it. On a floor with no friction, a hand pushes a block from rest and it speeds up; then the hand is gone and the block glides on at a steady speed with no force at all, its dots equally spaced; then a second hand ahead pushes back and the block slows to a stop. On a real tiled floor, when you stop pushing a moving crate, friction alone acts backward and the crate slows down. When you push again with a push equal to friction, the net force is zero and the crate moves at a steady speed.';

  busy() { return this.age < (this.cur === 0 ? T0 + 2 * T1 + TK + 0.9 : R.T0 + R.TA + R.TB + 0.6); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.change(ctx, c); else this.real(ctx, c);
  }

  /** b0 run: x and v t s after the start. */
  run(t) {
    t = Math.max(0, t);
    if (t < T1) return { x: X0 + 0.5 * A * t * t, v: A * t, st: 0 };
    if (t < T1 + TK) return { x: X0 + D1 + V * (t - T1), v: V, st: 1 };
    const u = Math.min(t - T1 - TK, T1);
    return { x: X0 + D1 + DK + V * u - 0.5 * A * u * u, v: V - A * u, st: u >= T1 ? 3 : 2 };
  }
  /**
   * Your hand flat against a block face (the CartLab hand: palm, four fingers up, a sleeve that leaves the
   * frame). (x, y) = the contact point; fromLeft: the hand is left of the block and pushes right.
   */
  handAt(ctx, c, x, y, fromLeft, k) {
    if (k <= 0) return;
    const s = fromLeft ? -1 : 1;
    HAND.hand.call(HAND, ctx, c, { x: x + s * 2, y }, { len: 62, view: 'back', dir: -Math.PI / 2, palm: -s, arm: { x: x + s * 230, y: y + 70 }, alpha: k });
  }

  // -- b0: start, keep moving, stop --------------------------------------------------------------------
  change(ctx, c) {
    const a = this.age, t = a - T0, r = this.run(t), cy = FL - BH / 2;
    const xa = X0 + D1, xb = X0 + D1 + DK;                   // stage boundaries (block centre)
    const tagAt = [[(X0 + xa) / 2 - 10, 'start'], [(xa + xb) / 2, 'keep moving'], [xb + 60, 'stop']];
    tagAt.forEach(([x, s], i) => drawTag(ctx, c, s, x, 44, { size: 26, col: i === 1 ? c.accent : c.label, prefer: [[0, 0]] }));
    this.idealFloor(ctx, c, -12, 720, FL, 36);
    // stage dividers on the floor
    ctx.save(); ctx.setLineDash([6, 7]); ctx.strokeStyle = c.labelMuted ?? c.label; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.6;
    for (const x of [xa, xb]) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, FL - 4); ctx.stroke(); }
    ctx.restore();
    const xs = [], ks = [];
    for (let k = 0; k * DTD <= t + 1e-6; k++) { const p = this.run(k * DTD); xs.push(p.x); if (p.st === 1) ks.push(p.x); }
    this.dots(ctx, c, xs, FL);
    if (ks.length > 1) this.dots(ctx, c, ks, FL, { by: FL + 36 + 18 });
    // start stage, once the hand has let go: a faint record (block outline, hand, "push")
    const kr = ease(t, T1 + 0.2, 0.4) * 0.38;
    if (kr > 0) {
      ctx.save(); ctx.globalAlpha *= kr;
      const g = drawBoxOn(ctx, c, { x: X0, y: FL, w: BW, h: BH, kind: 'block' });
      ctx.restore();
      this.handAt(ctx, c, g.back.x, cy + 8, true, kr);
      drawForce(ctx, c, g.front.x, cy, { length: FPX, label: 'push', fit: false, at: 0.5, alpha: Math.min(1, kr * 1.8) });
    }
    // the live hands: the push from the left lets go at the end of the start stage
    const kh1 = t < T1 ? 1 : 1 - ease(t, T1, 0.35), back = r.x - BW / 2;
    this.handAt(ctx, c, back - 30 * (1 - kh1), cy + 8, true, kh1);
    const kh2 = ease(t, T1 + TK - 0.5, 0.4), front = r.x + BW / 2;
    const b = drawBoxOn(ctx, c, { x: r.x, y: FL, w: BW, h: BH, kind: 'block' });
    this.handAt(ctx, c, r.st >= 2 ? front : X0 + D1 + DK + BW / 2 + 40 * (1 - kh2), cy + 8, false, kh2);
    // forces: the push while it acts; the stopping push stays on at the end, softer, as the record
    if (t > 0 && r.st === 0) drawForce(ctx, c, front, cy, { length: FPX, label: 'push', fit: false, at: 0.5 });
    if (r.st >= 2) drawForce(ctx, c, back, cy, { length: FPX, angle: Math.PI, label: 'push', fit: false, at: 0.5, alpha: r.st === 3 ? 0.6 : 1 });
    // velocity: the same arrow, faint, at two dots of the glide (once the glide is over)
    const kg = ease(t, T1 + TK, 0.4);
    if (kg > 0 && ks.length > 4) for (const i of [1, 4]) drawMotionArrow(ctx, c, 'v', ks[i] - 20, b.top.y - 28, { length: 26 + 0.5 * V, label: 'v', side: 1, alpha: 0.35 * kg });
    if (r.v > 0.5) drawMotionArrow(ctx, c, 'v', r.x - 20, b.top.y - 28, { length: 26 + 0.5 * r.v, label: 'v', side: 1 });
    else if (t > 0) drawMotionArrow(ctx, c, 'v', r.x, b.top.y - 28, { length: 0, label: 'v = 0', side: 1 });
    // the middle stage: no force
    const kn = ease(t, T1 + 0.3, 0.4);
    if (kn > 0) {
      drawNet(ctx, c, (xa + xb) / 2 - 80, FL + 104, NET0, { label: 'net force = 0', side: -1, alpha: kn });
      drawTag(ctx, c, 'no force needed', (xa + xb) / 2, 112, { size: 28, col: c.accent, alpha: kn, prefer: [[0, 0]] });
    }
  }

  // -- b1: a real floor --------------------------------------------------------------------------------
  realRun(t) {
    t = Math.max(0, t);
    const dec = (R.V0 - R.V1) / R.TA;
    if (t < R.TA) return { x: R.X0 + R.V0 * t - 0.5 * dec * t * t, v: R.V0 - dec * t, push: false };
    const xA = R.X0 + R.V0 * R.TA - 0.5 * dec * R.TA * R.TA, u = Math.min(t - R.TA, R.TB);
    return { x: xA + R.V1 * u, v: R.V1, push: true };
  }
  real(ctx, c) {
    const a = this.age, t = a - R.T0, r = this.realRun(t);
    const xs = [];
    for (let k = 0; k * R.DT <= Math.min(t, R.TA + R.TB) + 1e-6; k++) { xs.push(this.realRun(k * R.DT).x); }
    // floor, then dots, then the crate and you
    this.floor(ctx, c, 'tiles', 0, 680, R.FL, 34);
    this.dots(ctx, c, xs, R.FL);
    const gap = 46 * ease(t, 0, 0.4) - 46 * ease(t, R.TA - 0.4, 0.4), effort = 0.55 * ease(t, R.TA - 0.4, 0.4);
    const back = r.x - R.W / 2;
    drawPusher(ctx, c, { at: { x: back - gap, y: R.FL - R.H + 40 }, y: R.FL, height: 214, effort, facing: 1 });
    const b = drawBoxOn(ctx, c, { x: r.x, y: R.FL, w: R.W, h: R.H, kind: 'crate' });
    drawForce(ctx, c, b.bottom.x, b.bottom.y - 2, { length: R.F, angle: Math.PI, label: '', fit: false });
    drawTag(ctx, c, 'friction', b.bottom.x - R.F * 0.55, R.FL + 62, { size: 26, col: c.s3ink ?? c.label, prefer: [[0, 0]] });
    const kp = ease(t, R.TA, 0.3);
    if (kp > 0) drawForce(ctx, c, b.centre.x, b.top.y + 30, { length: R.F, label: 'push', at: 0.72, fit: false, alpha: kp });
    drawMotionArrow(ctx, c, 'v', r.x - 30, b.top.y - 30, { length: 26 + 0.8 * r.v, label: 'v', side: 1 });
    if (kp > 0) drawNet(ctx, c, 120, R.FL + 62, NET0, { label: 'net force = 0', side: -1, alpha: kp });
  }
}
