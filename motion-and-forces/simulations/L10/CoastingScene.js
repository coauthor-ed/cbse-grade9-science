/**
 * CoastingScene - predict blk-l11-s2 "Stop pedalling" (setup) and explain blk-l11-s3 "Friction slows things
 * down" (2 beats). Side view: a girl on a bicycle on a long level road; the road scrolls under her.
 *   setup       she pedals at a steady speed (legs turning, road scrolling), then her feet go still on the
 *               pedals and the picture freezes there. No slowing, no friction, no answer. Rest: feet still,
 *               full-length velocity arrow.
 *   b0 'slows'  she has stopped pedalling: the bicycle slows with a constant deceleration and stops (about
 *               3 s); "friction" backward at the tyres, constant length; v shrinks to the dot "v = 0". The
 *               pedals stay still while the wheels roll (freewheel). Then, on a floor below, a ball rolls in
 *               from a push and slows to rest with its own small "friction" arrow. Rest: both stopped.
 *   b1 'whatif' the same road imagined glassy and frictionless (cloud edge, sheen); bicycle and ball faint;
 *               a large "?" is the hero. Nothing moves that answers the question.
 * Physics: x = v0 t - a t^2 / 2 until v = 0 (bicycle and ball each their own a). Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { bicycleRig, drawBicycle } from 'simulations/base/kit/SimProps.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawMotionArrow, drawSurface, LOOKS } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce } from '../shared/ForceCast.js';

const SETUP = 9;
const G1 = 318, BIKE_X = 300, H = 196;            // road top, bicycle centre, rider height
const G2 = 470, BALL_R = 30;                       // floor top and ball radius
const V0 = 150, TB = 3.0, AB = V0 / TB;            // bicycle: px/s on screen, stops in TB s
const PX_PER_M = 30;                               // road scroll scale
const BU = 170, BT = 2.2, BA = BU / BT, BX0 = 70;   // ball: launch speed, time to rest, from x
const T_BALL = 3.7;                                // ball released at this age in b0
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const GIRL = { ...LOOKS.girl, outfit: 'kurti', top: 's6', bottom: 'denim', hairStyle: 'braid', shoeStyle: 'sandal' };

export class CoastingScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'A girl rides a bicycle along a long level road, pedalling at a steady speed. Then she stops pedalling: her feet rest still on the pedals. The bicycle slows down and stops, because friction keeps acting backward, against the motion. A ball pushed along a floor does the same: it rolls, slows down and stops. Then the road is imagined glassy, with no friction at all, and a large question mark asks how things would move then.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.isSetup() ? this.age < 2.6 : this.cur === 0 ? this.age < T_BALL + BT + 0.8 : this.age < 0.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.isSetup()) this.setupBeat(ctx, c);
    else if (this.cur === 0) this.slows(ctx, c);
    else this.whatif(ctx, c);
  }

  /** The road (scrolled by dist px), the girl on her bicycle; wheels roll with dist, cranks with crankDist. */
  ride(ctx, c, dist, crankDist, k = 1) {
    const spec = trackSpec({ from: 0, to: 680 / PX_PER_M, x0: 0, x1: 680, y: G1 });
    const road = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, scroll: dist / PX_PER_M, depth: 64 });
    const rw = bicycleRig({ x: BIKE_X, y: G1, forHeight: H, facing: 1, dist, build: 'teen' });
    const rc = bicycleRig({ x: BIKE_X, y: G1, forHeight: H, facing: 1, dist: crankDist, build: 'teen' });
    const bike = { ...rw, crank: rc.crank, pedals: rc.pedals, rider: rc.rider };
    ctx.save(); ctx.globalAlpha *= k;
    drawFigure(ctx, c, { ...bike.rider, pose: 'cycle' }, figureLook(c, GIRL),
      { behind: () => drawBicycle(ctx, c, bike, { part: 'back' }), between: () => drawBicycle(ctx, c, bike, { part: 'front' }) });
    ctx.restore();
    bike.road = road;
    return bike;
  }

  vArrow(ctx, c, v, k = 1) {
    const L = 150 * v / V0;
    return drawMotionArrow(ctx, c, 'v', BIKE_X - 70, 70, { length: v > 0.5 ? Math.max(26, L) : 0, label: v > 0.5 ? 'v' : 'v = 0', side: 1, alpha: k });
  }

  // -- setup: steady pedalling, then the feet go still; freeze -----------------------------------------------
  setupBeat(ctx, c) {
    const t = Math.min(this.age, 2.2), d = V0 * t;
    this.ride(ctx, c, d, d);
    this.vArrow(ctx, c, V0);
  }

  // -- b0: she has stopped pedalling; friction slows the bicycle, then a ball ---------------------------------
  slows(ctx, c) {
    const a = this.age, t = Math.min(Math.max(a - 0.3, 0), TB), d = V0 * t - 0.5 * AB * t * t, v = V0 - AB * t;
    const bike = this.ride(ctx, c, d, 0);
    this.vArrow(ctx, c, v);
    const kf = ease(a, 0.2, 0.3) * (1 - ease(a, 0.3 + TB - 0.1, 0.3));
    if (kf > 0) {
      const rear = bike.wheels?.[0] ?? { x: BIKE_X - 70 };
      drawForce(ctx, c, rear.x, G1 - 4, { length: 100, angle: Math.PI, label: '', alpha: kf, fit: false });
      drawTag(ctx, c, 'friction', rear.x - 50, G1 + 36, { size: 26, col: c.s3ink ?? darken(c.s3, 0.3), alpha: kf });
    }
    this.floor(ctx, c, a);
  }

  /** The floor below: a ball pushed from the left rolls, slows and stops. */
  floor(ctx, c, a, k = 1) {
    drawSurface(ctx, c, 'tiles', 16, 664, G2, { h: 34 });
    const t = Math.min(Math.max(a - T_BALL, 0), BT), x = BX0 + BU * t - 0.5 * BA * t * t, v = BU - BA * t;
    const kin = ease(a, T_BALL - 0.9, 0.4);
    ctx.save(); ctx.globalAlpha *= k * Math.max(kin, 0.0001);
    drawBall(ctx, c, { x, y: G2 - BALL_R, r: BALL_R, tone: 6, shadowY: G2 });
    ctx.restore();
    if (a < T_BALL + 0.2 && kin > 0) this.pushHand(ctx, c, x - BALL_R - 2 - 40 * ease(a, T_BALL, 0.25), G2 - BALL_R, kin * (1 - ease(a, T_BALL + 0.05, 0.2)));
    const kf = k * ease(a, T_BALL, 0.2) * (1 - ease(a, T_BALL + BT - 0.1, 0.3));
    if (kf > 0) {
      drawForce(ctx, c, x, G2 - 3, { length: 56, angle: Math.PI, label: '', alpha: kf, fit: false });
      drawTag(ctx, c, 'friction', x - 70, G2 - 64, { size: 26, col: c.s3ink ?? darken(c.s3, 0.3), alpha: kf });
    }
    if (a > T_BALL + BT && v <= 0.01 && k >= 1) drawMotionArrow(ctx, c, 'v', x + 70, G2 - 70, { length: 0, label: 'v = 0', alpha: ease(a, T_BALL + BT, 0.3) });
  }

  /** A flat hand from the left, palm against the ball at (x, y). */
  pushHand(ctx, c, x, y, k) {
    if (k <= 0) return;
    const skin = figureLook(c, { skin: 1 }).skin, sleeve = c.s6;
    ctx.save(); ctx.globalAlpha *= k;
    rr(ctx, x - 300, y - 22, 250, 44, 16); ctx.fillStyle = sleeve; ctx.fill(); ctx.strokeStyle = darken(sleeve, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    const body = () => rr(ctx, x - 62, y - 26, 62, 52, 18);
    body(); ctx.fillStyle = skin; ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.fillStyle = darken(skin, 0.13); ctx.fillRect(x - 70, y + 8, 80, 30); ctx.restore();
    body(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(skin, 0.4), 0.6); ctx.lineWidth = 1.6;
    for (const dy of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(x - 22, y + dy); ctx.lineTo(x - 4, y + dy); ctx.stroke(); }
    ctx.restore();
  }

  // -- b1: what if there were no friction? ------------------------------------------------------------------------
  whatif(ctx, c) {
    const a = this.age, kg = ease(a, 0.1, 0.5);
    ctx.save(); ctx.globalAlpha = 0.4; const bk = this.ride(ctx, c, 0, 0); ctx.restore();
    const RT = bk.road.top ?? G1 - 50, RB = bk.road.bottom ?? G1 + 30;
    // glassy sheen over the road: imagined, no friction
    ctx.save(); ctx.globalAlpha = kg;
    const g = ctx.createLinearGradient(0, RT, 0, RB); g.addColorStop(0, alpha(lighten(c.glass, 0.5), 0.85)); g.addColorStop(1, alpha(c.glass, 0.55));
    ctx.fillStyle = g; ctx.fillRect(0, RT, 680, RB - RT);
    ctx.fillStyle = alpha(lighten(c.glass, 0.9), 0.7);
    for (const [x0, w] of [[60, 120], [330, 60], [470, 150]]) { ctx.beginPath(); ctx.moveTo(x0, RT); ctx.lineTo(x0 + w, RT); ctx.lineTo(x0 + w - 40, RB); ctx.lineTo(x0 - 40, RB); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.4; drawSurface(ctx, c, 'ice', 16, 664, G2, { h: 34 }); drawBall(ctx, c, { x: 300, y: G2 - BALL_R, r: BALL_R, tone: 6, shadowY: G2 }); ctx.restore();
    // the imagine frame: a dashed cloud edge round the whole picture
    ctx.save(); ctx.globalAlpha = kg; ctx.setLineDash([10, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = darken(c.glass, 0.35);
    rr(ctx, 12, 14, 656, 494, 46); ctx.stroke(); ctx.setLineDash([]);
    for (const [x, y, r] of [[40, 44, 13], [66, 30, 8]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.9); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    const kq = ease(a, 0.3, 0.5);
    drawTag(ctx, c, 'no friction', 340, 82, { size: 30, col: c.accent, alpha: kq });
    ctx.save(); ctx.globalAlpha = kq; ctx.font = font(c, 900, 170, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = c.bgSurface; ctx.lineWidth = 14; ctx.strokeText('?', 520, 210);
    ctx.fillStyle = c.accent; ctx.fillText('?', 520, 210); ctx.restore();
  }
}
