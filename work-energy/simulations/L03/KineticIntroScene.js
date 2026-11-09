import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, inOutSine, clamp01,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { bicycleRig, drawBicycle } from 'simulations/base/kit/SimProps.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';

// KineticIntroScene - blk-l03-s01, Energy of Motion.
// b0: a student rides a bicycle and a ball rolls along the same road. Each
//     moving thing carries a K bar (no numbers: the bars only say "it has some").
// b1: the ball slows and stops; its K bar drains with its speed (K goes as v
//     squared) and ends empty: K = 0. The bicycle rides on, its bar full.

const GROUND = 440;
const RIDER_H = 230;
const BIKE_X0 = 128, BALL_X0 = 404;
const RIDE_S = 2.2;                 // b0: both move at a steady speed
const STOP_S = 1.8;                 // b1: the ball slows to rest
const V_BIKE = 56, V_BALL = 56;     // px per second
const BALL_R = 42;
const K_BIKE = 1, K_BALL = 0.55, K_MAX = 1.05;
const BIKE_BAR = { x: 22, y: 26 }, BALL_BAR = { x: 574, y: 26 };
const BAR_H = 170;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class KineticIntroScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student rides a bicycle along a road and a ball rolls ahead of it. Each has a kinetic energy bar, K, that is filled while it moves. Then the ball slows down and stops; its K bar empties to zero while the bicycle rides on with a full bar.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get stopBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.stopBeat ? STOP_S : RIDE_S) + 0.1; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // Everything comes from the beat and the beat's own clock.
  model() {
    const t = this.motionT ?? 0;
    const ride = Math.min(t, RIDE_S);
    if (!this.stopBeat) {
      return {
        bikeX: BIKE_X0 + V_BIKE * ride, ballX: BALL_X0 + V_BALL * ride,
        ballV: 1, bikeD: V_BIKE * ride, ballD: V_BALL * ride, intro: clamp01(t / 0.5),
      };
    }
    const s = Math.min(t, STOP_S), f = s / STOP_S;
    const ballGone = V_BALL * (s - (s * s) / (2 * STOP_S));
    const b0 = BALL_X0 + V_BALL * RIDE_S;
    return {
      bikeX: BIKE_X0 + V_BIKE * (RIDE_S + s), ballX: b0 + ballGone,
      ballV: 1 - f, bikeD: V_BIKE * (RIDE_S + s), ballD: V_BALL * RIDE_S + ballGone, intro: 1,
    };
  }

  draw(ctx, c) {
    const m = this.model();
    drawBackdrop(ctx, c, 'sky');
    this.scenery(ctx, c);
    drawFloor(ctx, c, GROUND, { seams: false });
    this.road(ctx, c);
    this.streaks(ctx, c, m.bikeX - 128, GROUND - 150, 1, c.s1);
    if (m.ballV > 0.04) this.streaks(ctx, c, m.ballX - BALL_R - 14, GROUND - BALL_R, m.ballV, c.s6);
    this.ball(ctx, c, m);
    this.bike(ctx, c, m);
    this.bars(ctx, c, m);
  }

  scenery(ctx, c) {
    // a low wall with posts far behind the road: still, so only the riders move
    const y = GROUND - 64;
    const wall = mix(c.bgSurface, c.label, 0.12);
    ctx.save();
    ctx.fillStyle = wall;
    ctx.fillRect(0, y, W, 30);
    ctx.fillStyle = lighten(wall, 0.18);
    ctx.fillRect(0, y, W, 5);
    ctx.fillStyle = darken(wall, 0.14);
    ctx.fillRect(0, y + 24, W, 6);
    for (let x = 20; x < W; x += 92) {
      ctx.fillStyle = darken(wall, 0.08);
      ctx.fillRect(x, y - 10, 18, 40);
      ctx.fillStyle = lighten(wall, 0.22);
      ctx.fillRect(x, y - 10, 5, 40);
      ctx.fillStyle = darken(wall, 0.26);
      ctx.fillRect(x + 14, y - 10, 4, 40);
    }
    ctx.fillStyle = mix(c.good, c.bgSurface, 0.45);
    ctx.fillRect(0, y + 30, W, GROUND - y - 30);
    ctx.restore();
  }

  road(ctx, c) {
    const top = GROUND, bot = GROUND + 52;
    const tar = mix(c.label, c.bgSurface, 0.62);
    ctx.save();
    ctx.fillStyle = tar;
    ctx.fillRect(0, top, W, bot - top);
    ctx.fillStyle = lighten(tar, 0.12);
    ctx.fillRect(0, top, W, 4);
    ctx.fillStyle = darken(tar, 0.18);
    ctx.fillRect(0, bot - 6, W, 6);
    ctx.fillStyle = alpha(c.bgSurface, 0.85);
    for (let x = 10; x < W; x += 70) ctx.fillRect(x, top + 24, 36, 5);
    ctx.restore();
  }

  streaks(ctx, c, x, y, k, col) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(col, 0.55 * k);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const len = (52 - i * 10) * k;
      ctx.beginPath();
      ctx.moveTo(x - len, y + i * 22);
      ctx.lineTo(x, y + i * 22);
      ctx.stroke();
    }
    ctx.restore();
  }

  ball(ctx, c, m) {
    const x = m.ballX, y = GROUND - BALL_R;
    drawBall(ctx, c, { x, y, r: BALL_R, tone: 6, shadowY: GROUND + 2 });
    // two seams that turn with the roll (angle = distance / radius)
    const a = m.ballD / BALL_R;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, BALL_R - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = alpha(darken(c.s6, 0.45), 0.8);
    ctx.lineWidth = 4;
    for (const off of [0]) {
      const ang = a + off;
      ctx.beginPath();
      ctx.ellipse(x, y, BALL_R * 0.98, BALL_R * 0.34, ang, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  bike(ctx, c, m) {
    const x = m.bikeX;
    const bike = bicycleRig({ x, y: GROUND, forHeight: RIDER_H, facing: 1, dist: m.bikeD, tone: 1, build: 'teen' });
    const base = figureFor(this, { role: 'student', pose: 'cycle', x, y: GROUND, height: RIDER_H, facing: 1 });
    const spec = { ...base, ...bike.rider, pose: 'cycle', build: base.build ?? bike.rider.build };
    drawShadow(ctx, c, x, GROUND + 4, bike.box.w * 0.55, 8, 0.9);
    drawFigure(ctx, c, spec, base.look, {
      behind: () => drawBicycle(ctx, c, bike, { part: 'back' }),
      between: () => drawBicycle(ctx, c, bike, { part: 'front' }),
    });
    this.bikeTop = { x: x - 52, y: GROUND - RIDER_H * 0.5 };
  }

  bars(ctx, c, m) {
    const a = inOutSine(m.intro);
    const one = [{ id: 'K', label: 'K', tone: 1 }];
    drawEnergyBars(ctx, c, {
      ...BIKE_BAR, h: BAR_H, max: K_MAX, bars: one, values: { K: K_BIKE * a }, alpha: a, size: 24,
      anchor: this.bikeTop,
    });
    const kBall = K_BALL * m.ballV * m.ballV * a;
    drawEnergyBars(ctx, c, {
      ...BALL_BAR, h: BAR_H, max: K_MAX, bars: one, values: { K: kBall }, alpha: a, size: 24,
      anchor: { x: m.ballX + 10, y: GROUND - 2 * BALL_R - 4 },
    });
    if (this.stopBeat && m.ballV < 0.02) {
      pill(ctx, c, 'K = 0', BALL_BAR.x - 54, BALL_BAR.y + BAR_H * 0.55, { bg: c.s1, size: 26 });
      pill(ctx, c, 'at rest', m.ballX, GROUND + 26, { bg: c.s6, size: 24 });
    }
  }
}
