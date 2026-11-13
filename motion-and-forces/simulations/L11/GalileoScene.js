/**
 * GalileoScene - slide blk-l13-s1 "Galileo's idea" (2 beats). Side views.
 *   b0 'idea'    a ball rolls down a short ramp onto a long level ideal floor (glassy, dashed edge) that
 *                runs off the right edge. On the floor it keeps its speed: the v arrow stays the same and
 *                equal-time dots behind it have equal gaps; tag "keeps moving". Name card "Galileo Galilei,
 *                17th century" (no portrait). Rest: the ball near the right edge, dots and v arrow shown.
 *   b1 'answer'  four lanes stacked: rough floor, tiles, ice (MotionCast surfaces) and the ideal floor. The
 *                same ball arrives on each at the same speed (same v arrow). On the first three it slows at a
 *                constant rate and stops at 1/4, 1/2, 3/4 of the lane (stop mark); on the ideal lane it does
 *                not slow ("zero friction: never stops"), then turns into the L10 coin stack (side view),
 *                gliding on: "the coin stack too". Lanes start 0.8 s apart. Rest: every lane at its end state.
 * Physics: one arrival speed V on every lane; lane k decelerates at a = V^2 / (2 d_k), so x = V t - a t^2 / 2
 * until rest. Dots every DT seconds come from x(t). Every frame is a function of the beat and its age only.
 * This file is also the L11 base: the ideal floor (idealFloor) is the L10 imagined glass surface, drawn
 * with the same CoinStackScene surf('glass') and the same dashed edge as ThoughtExperimentScene.
 * FirstLawScene, NoForceGraphsScene and ForceToChangeScene subclass it.
 */
import { SpringPullScene } from '../L10/SpringPullScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { propRig, drawRamp } from 'simulations/base/kit/SimProps.js';
import { trackSpec, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawMotionArrow, drawSurface } from '../shared/MotionCast.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const DT = 0.25;                                   // dot interval (s)
// b0
const FLOOR = 396, FH = 48, R0 = 32, RAMP = { x0: 10, x1: 220, rise: 168 }, TR = 1.2, T0 = 0.3, XREST = 520, BALL = 4;
// b1
const V = 300, LX = 56, LANE_STOP = [150, 300, 450], LSTEP = 0.8, LT0 = 0.3, R1 = 21, MORPH = 300, XCOIN = 520;
const LANES = [
  { y0: 4, kind: 'rough', name: 'rough floor' },
  { y0: 116, kind: 'tiles', name: 'tiles' },
  { y0: 228, kind: 'ice', name: 'ice' },
  { y0: 340, kind: 'ideal', name: 'zero friction: never stops' },
];

export class GalileoScene extends SpringPullScene {
  static MODE = 'galileo';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = {};
  static ARIA_LABEL = 'Galileo\'s idea. A ball rolls down a short ramp onto a long, perfectly smooth level floor. On the floor it keeps the same speed: the dots it leaves at equal times are equally spaced, and it keeps moving. Then the same ball arrives at the same speed on four floors: on a rough floor it stops soonest, on tiles farther, on ice farther still, and on a floor with zero friction it never slows down and never stops. The coin stack from the thought experiment would do the same.';

  isSetup() { return false; }
  busy() { return this.age < (this.cur === 0 ? T0 + TR + (XREST - 240) / 260 + 0.8 : LT0 + 2 * LSTEP + 3 + 0.8); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.idea(ctx, c); else this.answer(ctx, c);
  }

  // -- shared L11 parts ----------------------------------------------------------------------------------
  /** The ideal floor, side view: the L10 glass surface (sheen bands, inner line) with a dashed outline edge. */
  idealFloor(ctx, c, x0, x1, y, h, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    this.surf(ctx, c, 'glass', x0, x1, y, h, { r: 8, rim: alpha(c.glass, 0), rimW: 0.01, seed: 5 });
    ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.9); ctx.lineWidth = 2; ctx.lineCap = 'round';   // sheen line
    ctx.beginPath(); ctx.moveTo(x0 + 10, y + 4); ctx.lineTo(x1 - 10, y + 4); ctx.stroke();
    ctx.setLineDash([10, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = darken(c.glass, 0.35);
    rr(ctx, x0, y, x1 - x0, h, 8); ctx.stroke();
    ctx.restore();
  }
  /** A floor of any kind: 'ideal' or a MotionCast surface. */
  floor(ctx, c, kind, x0, x1, y, h, o = {}) {
    if (kind === 'ideal') return this.idealFloor(ctx, c, x0, x1, y, h, o);
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; drawSurface(ctx, c, kind, x0, x1, y, { h, seed: o.seed }); ctx.restore();
  }
  /** Equal-time dots on a floor line y, at px positions xs; optional equal-gap brackets under the strip at by. */
  dots(ctx, c, xs, y, o = {}) {
    if (!xs.length) return;
    const spec = trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y });
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    drawStrobe(ctx, c, spec, { at: xs, marks: 'dots' });
    if (o.by != null && xs.length > 1) {                       // brackets with the legs up, toward the dots
      ctx.save(); ctx.translate(0, 2 * o.by); ctx.scale(1, -1);
      drawStrobe(ctx, c, spec, { at: xs, gaps: true, bracketY: o.by, gapLabels: xs.map(() => ''), tone: 'annot' });
      ctx.restore();
    }
    ctx.restore();
  }
  /** Bold text on a paper halo. */
  word(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, o.weight ?? 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }

  // -- b0: the ramp and the ideal floor ------------------------------------------------------------------
  idea(ctx, c) {
    const a = this.age, t = a - T0;
    drawRamp(ctx, c, propRig({ x0: 0, scale: 1, groundY: FLOOR }), { from: RAMP.x0, to: RAMP.x1, rise: RAMP.rise });
    this.idealFloor(ctx, c, RAMP.x1 - 6, 720, FLOOR, FH);
    const th = Math.atan2(RAMP.rise, RAMP.x1 - RAMP.x0), Ls = Math.hypot(RAMP.rise, RAMP.x1 - RAMP.x0);
    const s0 = 0.12 * Ls, L = Ls - s0, acc = 2 * L / (TR * TR), Vf = acc * TR;             // down the ramp, then Vf on the floor
    const foot = { x: RAMP.x1 + R0 * Math.sin(th), y: FLOOR - R0 * Math.cos(th) };
    let x, y, v, ang;
    if (t < TR) {
      const s = s0 + 0.5 * acc * Math.max(0, t) ** 2, u = s / Ls;
      x = RAMP.x0 + (RAMP.x1 - RAMP.x0) * u + R0 * Math.sin(th); y = FLOOR - RAMP.rise * (1 - u) - R0 * Math.cos(th);
      v = acc * Math.max(0, t); ang = th;
    } else {
      const tf = t - TR; x = Math.min(foot.x + Vf * tf, XREST); y = FLOOR - R0 - (FLOOR - R0 - foot.y) * Math.max(0, 1 - tf / 0.12);
      v = Vf; ang = 0;
    }
    const xs = [];
    for (let k = 0; foot.x + Vf * DT * k <= x + 0.5; k++) if (t >= TR) xs.push(foot.x + Vf * DT * k);
    this.dots(ctx, c, xs, FLOOR);
    drawBall(ctx, c, { x, y, r: R0, tone: BALL, shadowY: ang === 0 ? FLOOR + 2 : undefined });
    const len = 26 + 78 * clamp01(v / Vf);
    if (v > 1) {
      const nx = Math.sin(ang), ny = -Math.cos(ang);
      drawMotionArrow(ctx, c, 'v', x + nx * (R0 + 22), y + ny * (R0 + 22), { length: len, angle: ang, label: 'v', side: 1 });
    }
    // name card, top left (no portrait)
    const card = { x: 16, y: 18, w: 340, h: 92 };
    drawSheet(ctx, c, card);
    this.word(ctx, c, 'Galileo Galilei', card.x + 22, card.y + 32, { align: 'left', size: 28 });
    this.word(ctx, c, '17th century', card.x + 22, card.y + 66, { align: 'left', weight: 700, col: c.labelMuted ?? c.label });
    const kt = ease(t, TR + 0.6, 0.5);
    if (kt > 0) drawTag(ctx, c, 'keeps moving', 664, 228, { align: 'right', size: 28, col: c.accent, alpha: kt });
  }

  // -- b1: four lanes ------------------------------------------------------------------------------------
  /** Lane i: x of the ball t s after it arrives, and its speed. */
  laneRun(i, t) {
    t = Math.max(0, t);
    if (i === 3) return { x: Math.min(LX + V * t, XCOIN), v: V, done: LX + V * t >= XCOIN };
    const d = LANE_STOP[i], acc = V * V / (2 * d), T = V / acc, tt = Math.min(t, T);
    return { x: LX + V * tt - 0.5 * acc * tt * tt, v: V - acc * tt, done: t >= T };
  }
  answer(ctx, c) {
    const a = this.age;
    LANES.forEach((ln, i) => {
      const hero = i === 3, fy = hero ? ln.y0 + 140 : ln.y0 + 80, fh = 32, t = a - LT0 - i * LSTEP;
      const started = t > 0, r = this.laneRun(i, t), cy = fy - R1;
      this.floor(ctx, c, ln.kind, 20, hero ? 720 : 664, fy, fh, { seed: 11 + i });
      drawTag(ctx, c, ln.name, 20, ln.y0 + 24, { align: 'left', size: 26, col: hero ? c.accent : c.label });
      const xs = [];
      for (let k = 0; started && k * DT <= t + 1e-6; k++) { const p = this.laneRun(i, k * DT); if (k > 0 && p.done && xs.length && Math.abs(p.x - xs[xs.length - 1]) < 1) break; xs.push(p.x); }
      this.dots(ctx, c, xs, fy, { alpha: 0.9 });
      if (!hero && r.done) {
        const k = ease(t, 2 * LANE_STOP[i] / V + 0.05, 0.3);
        ctx.save(); ctx.globalAlpha *= k; ctx.setLineDash([7, 6]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(r.x, fy - 2 * R1 - 18); ctx.lineTo(r.x, fy + fh + 4); ctx.stroke(); ctx.restore();
      }
      const morph = hero ? ease(r.x, MORPH, 70) : 0;
      if (!started) return;
      if (morph < 1) { ctx.save(); ctx.globalAlpha *= 1 - morph; drawBall(ctx, c, { x: r.x, y: cy, r: R1, tone: BALL, shadowY: fy + 2 }); ctx.restore(); }
      if (morph > 0) { ctx.save(); ctx.globalAlpha *= morph; this.coinsSide(ctx, c, r.x, fy, 1.9); ctx.restore(); }
      if (r.v > 1) drawMotionArrow(ctx, c, 'v', r.x + (morph > 0.5 ? 36 : R1 + 6), cy - (hero ? 8 : 0), { length: 26 + 50 * (r.v / V), label: 'v', side: 1, alpha: 1 });
      const kc = hero ? ease(t, (XCOIN - LX) / V + 0.1, 0.4) : 0;
      if (kc > 0) drawTag(ctx, c, 'the coin stack too', XCOIN - 50, ln.y0 + 100, { align: 'right', prefer: [[0, 0]], size: 26, col: c.accent, alpha: kc });
    });
  }
}
