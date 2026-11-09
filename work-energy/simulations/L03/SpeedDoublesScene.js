import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';

// SpeedDoublesScene - blk-l03-s02, Twice as Fast (predict setup; hostRole 'setup').
// Two identical cars on two lanes start together. The lower car covers twice
// the distance in the same time: a faded car is left where each car was every
// second, so the faded cars are twice as far apart on the lower lane.
// Speed tags v and 2v only. No energy is shown: that is the question.

const TAU = Math.PI * 2;
const CAR_L = 172, WHEEL_R = 21;
const LANES = [
  { ground: 236, speed: 1, tag: 'v' },
  { ground: 446, speed: 2, tag: '2v' },
];
const X0 = 128;                  // car centre at the start line
const PX_S = 90;                 // the slower car: px per second
const RUN_S = 2;                 // both run for two seconds
const LINE_X = X0 + CAR_L / 2;   // the start line, under the front bumpers

// A side-view car (front to the right). Body, cabin with two windows, wheel
// arches, tyres with turning spokes; light side, shade side and an inner line.
function drawCar(ctx, c, x, gy, o = {}) {
  const L = o.len ?? CAR_L, r = o.r ?? WHEEL_R, col = o.col ?? c.s2;
  const x0 = x - L / 2, x1 = x + L / 2;
  const bodyTop = gy - r - 40, bodyBot = gy - r * 0.55;
  const roofY = bodyTop - 36;
  const glass = mix(c.s1, c.bgSurface, 0.55);
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  drawShadow(ctx, c, x, gy + 2, L * 0.52, 7, 0.85);
  // cabin
  ctx.beginPath();
  ctx.moveTo(x0 + L * 0.2, bodyTop + 2);
  ctx.lineTo(x0 + L * 0.3, roofY + 4);
  ctx.quadraticCurveTo(x0 + L * 0.31, roofY, x0 + L * 0.35, roofY);
  ctx.lineTo(x0 + L * 0.6, roofY);
  ctx.quadraticCurveTo(x0 + L * 0.64, roofY, x0 + L * 0.66, roofY + 4);
  ctx.lineTo(x0 + L * 0.78, bodyTop + 2);
  ctx.closePath();
  ctx.fillStyle = darken(col, 0.06);
  ctx.fill();
  ctx.strokeStyle = darken(col, 0.42);
  ctx.lineWidth = 2;
  ctx.stroke();
  // windows (rear and front), a pillar between
  const wy0 = roofY + 7, wy1 = bodyTop - 1;
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(x0 + L * 0.27, wy1); ctx.lineTo(x0 + L * 0.33, wy0); ctx.lineTo(x0 + L * 0.47, wy0); ctx.lineTo(x0 + L * 0.47, wy1);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0 + L * 0.51, wy1); ctx.lineTo(x0 + L * 0.51, wy0); ctx.lineTo(x0 + L * 0.62, wy0); ctx.lineTo(x0 + L * 0.71, wy1);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = alpha(c.bgSurface, 0.55);
  ctx.fillRect(x0 + L * 0.35, wy0 + 3, 10, 4);
  ctx.fillRect(x0 + L * 0.53, wy0 + 3, 10, 4);
  // body
  rr(ctx, x0, bodyTop, L, bodyBot - bodyTop, 14);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.fillStyle = lighten(col, 0.3);
  ctx.fillRect(x0 + 10, bodyTop + 5, L - 30, 4);
  ctx.fillStyle = darken(col, 0.22);
  ctx.fillRect(x0 + 6, bodyBot - 13, L - 12, 9);
  // door line and handle
  ctx.strokeStyle = darken(col, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + L * 0.49, bodyTop + 2); ctx.lineTo(x0 + L * 0.49, bodyBot - 6);
  ctx.stroke();
  ctx.fillStyle = darken(col, 0.4);
  ctx.fillRect(x0 + L * 0.53, bodyTop + 13, 12, 4);
  // lamps: amber at the front, red at the back
  ctx.fillStyle = c.gold;
  rr(ctx, x1 - 9, bodyTop + 9, 8, 10, 3); ctx.fill();
  ctx.fillStyle = c.bad;
  rr(ctx, x0 + 1, bodyTop + 9, 6, 10, 3); ctx.fill();
  rr(ctx, x0, bodyTop, L, bodyBot - bodyTop, 14);
  ctx.strokeStyle = darken(col, 0.45);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // wheels: arch, tyre, rim, five spokes turning with distance
  const ang = o.wheelAngle ?? 0;
  for (const wx of [x0 + L * 0.21, x0 + L * 0.79]) {
    ctx.fillStyle = darken(col, 0.5);
    ctx.beginPath(); ctx.arc(wx, gy - r, r + 5, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = darken(c.stroke, 0.55);
    ctx.beginPath(); ctx.arc(wx, gy - r, r, 0, TAU); ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.35);
    ctx.beginPath(); ctx.arc(wx, gy - r, r * 0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = darken(c.stroke, 0.25);
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = ang + (k * TAU) / 5;
      ctx.moveTo(wx, gy - r);
      ctx.lineTo(wx + Math.cos(a) * r * 0.58, gy - r + Math.sin(a) * r * 0.58);
    }
    ctx.stroke();
    ctx.strokeStyle = lighten(c.stroke, 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx, gy - r, r * 0.6, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  }
  ctx.restore();
  return { top: roofY, front: x1, back: x0 };
}

const BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];

export class SpeedDoublesScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two identical cars on two lanes start from the same line at the same time. The upper car is tagged v and the lower car 2v. A faded car marks where each car was every second: the lower faded cars are twice as far apart, so the lower car goes twice as far in the same time.';

  enter() { this.motionT = 0; }
  pointerDown() { this.motionT = 0; this.animateFor(800); }
  update(d) { this.motionT = Math.min(RUN_S + 0.1, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < RUN_S + 0.1; }

  draw(ctx, c) {
    const t = Math.min(this.motionT ?? 0, RUN_S);
    drawBackdrop(ctx, c, 'sky');
    this.verge(ctx, c);
    for (const lane of LANES) this.road(ctx, c, lane.ground);
    this.startLine(ctx, c);
    pill(ctx, c, 'faded: equal time gaps', W / 2, 32, { bg: mix(c.label, c.bgSurface, 0.45), size: 28 });
    for (const lane of LANES) {
      const dist = PX_S * lane.speed * t;
      this.ghosts(ctx, c, lane, t);
      const x = X0 + dist;
      const car = drawCar(ctx, c, x, lane.ground, { wheelAngle: dist / WHEEL_R });
      this.streaks(ctx, c, car.back - 8, lane.ground - 52, lane.speed);
      pill(ctx, c, lane.tag, x, car.top - 30, { bg: c.s1, size: 30 });
    }
  }

  verge(ctx, c) {
    ctx.save();
    const g = mix(c.good, c.bgSurface, 0.5);
    ctx.fillStyle = g;
    ctx.fillRect(0, 266, W, 48);
    ctx.fillStyle = lighten(g, 0.15);
    ctx.fillRect(0, 266, W, 4);
    // a low hedge between the lanes
    ctx.fillStyle = darken(g, 0.12);
    for (let x = -10; x < W; x += 46) {
      ctx.beginPath();
      ctx.arc(x + 23, 296, 20, Math.PI, TAU);
      ctx.fill();
    }
    ctx.fillStyle = darken(g, 0.25);
    ctx.fillRect(0, 294, W, 20);
    ctx.restore();
  }

  road(ctx, c, gy) {
    const tar = mix(c.label, c.bgSurface, 0.62);
    ctx.save();
    ctx.fillStyle = tar;
    ctx.fillRect(0, gy - 6, W, 36);
    ctx.fillStyle = lighten(tar, 0.14);
    ctx.fillRect(0, gy - 6, W, 4);
    ctx.fillStyle = darken(tar, 0.2);
    ctx.fillRect(0, gy + 24, W, 6);
    ctx.restore();
  }

  startLine(ctx, c) {
    ctx.save();
    ctx.fillStyle = alpha(c.bgSurface, 0.92);
    for (const lane of LANES) {
      for (let i = 0; i < 4; i++) ctx.fillRect(LINE_X - 3 + (i % 2) * 6, lane.ground - 4 + i * 8, 6, 8);
    }
    ctx.restore();
  }

  // A faded car where the car was at each whole second. Drawn solid into one
  // layer, each over the last, then laid down faded once, so overlaps read as
  // clean steps.
  ghosts(ctx, c, lane, t) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (!this._ghost || this._ghost.width !== cw || this._ghost.height !== ch) {
      this._ghost = document.createElement('canvas');
      this._ghost.width = cw; this._ghost.height = ch;
    }
    const g = this._ghost.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cw, ch);
    g.setTransform(ctx.getTransform());
    let any = false;
    for (let s = 0; s < RUN_S; s++) {
      if (t < s + 1 - 0.001) break;
      const d = PX_S * lane.speed * s;
      drawCar(g, c, X0 + d, lane.ground, { wheelAngle: d / WHEEL_R });
      any = true;
    }
    if (!any) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= 0.3;
    ctx.drawImage(this._ghost, 0, 0);
    ctx.restore();
  }

  streaks(ctx, c, x, y, k) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(c.s1, 0.5);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const len = (20 + 18 * k) - i * 6;
      ctx.beginPath();
      ctx.moveTo(x - len, y + i * 14);
      ctx.lineTo(x, y + i * 14);
      ctx.stroke();
    }
    ctx.restore();
  }
}
