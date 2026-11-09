import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, clamp01, outBack,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';

// SpeedSquareScene - blk-l03-s05, Double the Speed.
// The two identical cars of the predict (SpeedDoublesScene), each over its own
// K bar drawn as stacked equal blocks on one scale.
// b0: car m at v -> 1 block; car m at 2v -> 4 blocks, stacked one at a time.
// b1: the 2v column dims; double the mass is two identical cars driving
//     together, side by side (tagged 2m) at v -> 2 blocks. Speed is squared,
//     mass is not.

const TAU = Math.PI * 2;
const CAR_L = 172, WHEEL_R = 21;
const GROUND = 452;
const BLOCK = 50;                // one block of K, design px
const BAR_W = 72;
const COLS = [
  { x: 118, tag: 'm, v', blocks: 1, speed: 1, load: false },
  { x: 340, tag: 'm, 2v', blocks: 4, speed: 2, load: false },
  { x: 562, tag: '2m, v', blocks: 2, speed: 1, load: true },
];
const STEP_S = 0.55;             // one block per step

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

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class SpeedSquareScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two identical cars, one at speed v and one at speed 2v, each under a kinetic energy bar made of equal blocks: the car at v has 1 block, the car at 2v has 4 blocks. Then double the mass, 2m, at speed v: two identical cars driving together side by side; their bar has 2 blocks.';

  enter() { this.motionT = 0; }
  pointerDown() { this.motionT = 0; this.animateFor(800); }
  get massBeat() { return this.stage >= 1; }
  // b0 stacks 1 + 4 blocks, b1 stacks 2
  get motionEnd() { return (this.massBeat ? 2 : 5) * STEP_S + 0.6; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // How many blocks of a column are shown now (fractional while one pops in).
  shown(i) {
    const t = this.motionT ?? 0;
    if (this.massBeat) {
      if (i < 2) return COLS[i].blocks;
      return clamp01((t - 0.3) / STEP_S) + clamp01((t - 0.3 - STEP_S) / STEP_S);
    }
    if (i === 2) return 0;
    const start = i === 0 ? 0.2 : 0.2 + STEP_S + 0.3;
    let n = 0;
    for (let k = 0; k < COLS[i].blocks; k++) n += clamp01((t - start - k * STEP_S) / STEP_S);
    return n;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky');
    this.road(ctx, c);
    COLS.forEach((col, i) => {
      const on = i < 2 || this.massBeat;
      if (!on) return;
      const dim = this.massBeat && i === 1 ? 0.32 : 1;
      const fade = i === 2 ? clamp01((this.motionT ?? 0) / 0.3) : 1;
      ctx.save();
      ctx.globalAlpha = dim * fade;
      this.column(ctx, c, col, this.shown(i));
      ctx.restore();
    });
  }

  road(ctx, c) {
    const tar = mix(c.label, c.bgSurface, 0.62);
    ctx.save();
    ctx.fillStyle = tar;
    ctx.fillRect(0, GROUND - 6, W, 40);
    ctx.fillStyle = lighten(tar, 0.14);
    ctx.fillRect(0, GROUND - 6, W, 4);
    ctx.fillStyle = darken(tar, 0.2);
    ctx.fillRect(0, GROUND + 28, W, 6);
    const g = mix(c.good, c.bgSurface, 0.5);
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND + 34, W, H - GROUND - 34);
    ctx.restore();
  }

  column(ctx, c, col, n) {
    if (col.load) {
      // double the mass: a second identical car beside the first, in the far
      // half of the road, the two moving together at the same speed
      drawCar(ctx, c, col.x + 22, GROUND - 16, { col: darken(c.s2, 0.12) });
    }
    const car = drawCar(ctx, c, col.x - (col.load ? 6 : 0), GROUND, { col: c.s2 });
    this.streaks(ctx, c, car.back - 8, GROUND - 52, col.speed);
    pill(ctx, c, col.tag, col.x, GROUND + 15, { bg: c.s2, size: 26 });
    // the K bar: one common scale, value counted in blocks
    const full = Math.floor(n + 1e-6), part = n - full;
    const val = full + outBack(part) * (part > 0 ? 1 : 0);
    const panelW = BAR_W + 32;
    const y0 = 14;
    const box = drawEnergyBars(ctx, c, {
      x: col.x - panelW / 2, y: y0, h: 4 * BLOCK, max: 4, barW: BAR_W, size: 24,
      bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: Math.min(val, col.blocks) },
    });
    const b = box && box.bars && box.bars[0];
    if (!b) return;
    // block seams across the filled part
    ctx.save();
    ctx.strokeStyle = alpha(c.bgSurface, 0.95);
    ctx.lineWidth = 4;
    for (let k = 1; k < Math.min(val, col.blocks); k++) {
      const y = box.baseY - k * BLOCK;
      ctx.beginPath();
      ctx.moveTo(b.x + 2, y);
      ctx.lineTo(b.x + b.w - 2, y);
      ctx.stroke();
    }
    ctx.restore();
    if (n >= col.blocks - 0.02) {
      // the count sits centred in the top block of its own bar
      pill(ctx, c, String(col.blocks), b.x + b.w / 2, box.baseY - col.blocks * BLOCK + BLOCK / 2, { bg: c.s1, size: 30 });
    }
  }

  streaks(ctx, c, x, y, k) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(c.s1, 0.5);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const len = (14 + 16 * k) - i * 5;
      ctx.beginPath();
      ctx.moveTo(x - len, y + i * 14);
      ctx.lineTo(x, y + i * 14);
      ctx.stroke();
    }
    ctx.restore();
  }
}
