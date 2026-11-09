import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, rr, ellipse, mix, alpha, lighten, darken, pill, vectorArrow,
  drawBackdrop, drawBench, drawShadow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawSpring, drawBall, drawMagnet, drawCharge } from 'simulations/base/kit/SimApparatus.js';

// Two slides, told apart by beat count.
// blk-l04-s04 (3 beats): magnets (and a pea), charges, ball + Earth as one system.
// blk-l04-n01 (2 beats): the four stored-energy pictures, each with its U bar; then
// the ball and the Earth, where the Earth hardly moves, and the name.
const MAP3 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
const MAP2 = [[{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];
const S_MAG = 0, S_CHG = 1, S_SYS = 2, S_FOUR = 3, S_NAME = 4;

const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;
const KU = [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }];
const ONLY_U = [{ id: 'U', label: 'U', tone: 3 }];
const PANEL = { x: 540, y: 24, h: 120 };

const RUSH_S = 0.65;      // the pair rushing together (accelerating)
const CRUSH_S = 0.45;     // the magnets' kinetic energy going into the crushed pea
const FALL_S = 0.7;

// Magnets on a bench, a pea between them.
const BENCH_Y = 352;
const MAG = { w: 150, h: 56, y: BENCH_Y - 28, apart: 92, cx: 340 };
const PEA_R = 16;

// Charges.
const CHG = { y: 250, r: 46, apart: 150, touch: 48 };

// The Earth: a huge circle whose top is the ground line.
const EARTH_TOP = 424;
const EARTH_R = 1100;
const BALL_R = 34;
const LIFT_Y = 150;
const LAND_Y = EARTH_TOP - BALL_R - 6;

function limb(ctx, x1, y1, x2, y2, w, fill, shade) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  ctx.save();
  ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  rr(ctx, -len / 2, -w / 2, len, w, w / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (shade) {
    rr(ctx, -len / 2, w * 0.14, len, w * 0.32, w * 0.16);
    ctx.fillStyle = shade;
    ctx.fill();
  }
  ctx.restore();
}


export class SystemSeparationScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static BEAT_STEP_MAP = MAP3;
  static BEAT_MAPS = { 3: MAP3, 2: MAP2 };
  static ARIA_LABEL =
    'Two bar magnets with unlike poles facing are held apart with a pea between them; a U bar is full. ' +
    'Let go and they rush together, U turns into K, and the pea is crushed. Next, a plus and a minus ' +
    'charge held apart; let go and they move together. Next, a ball lifted above the Earth, one arrow ' +
    'on the ball pointing down and an equal one on the Earth pointing up, a dashed outline marked system. ' +
    'On the next slide, four pictures each with a U bar: a stretched gulel band, a squashed spring, two ' +
    'magnets apart and a lifted ball; then the ball falls a long way while the Earth hardly moves, and ' +
    'the U bar is named gravitational potential energy.';
  static CONTROLS = [
    { type: 'button', id: 'release', label: 'Let go' },
    { type: 'button', id: 'again', label: 'Again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._phase = 'hold';
    this._t = 0;
  }

  enter() { this._phase = 'hold'; this._t = 0; }

  isControlHidden(id) {
    if (this.stage === S_FOUR) return true;
    if (id === 'release') return this._phase === 'done';
    return this._phase !== 'done';
  }
  isControlDisabled() { return this._phase === 'run'; }

  onControlChange(id) {
    if (!this._guard(id) || this.stage === S_FOUR) return;
    if (id === 'release' && this._phase === 'hold') { this._phase = 'run'; this._t = 0; }
    else if (id === 'again' && this._phase === 'done') { this._phase = 'hold'; this._t = 0; }
    this.requestUiUpdate?.();
  }

  _runLen() { return this.stage === S_MAG ? RUSH_S + CRUSH_S : this.stage === S_CHG ? RUSH_S : FALL_S; }

  update(d) {
    if (this._phase !== 'run') return;
    this._t += d;
    if (this.stage === S_MAG && !this._hit && this._t >= RUSH_S) { this._hit = true; this.shake(5); }
    if (this._t >= this._runLen()) { this._phase = 'done'; this._hit = false; this.requestUiUpdate?.(); }
  }

  busy() { return this._phase === 'run' || (this.stage === S_FOUR && this.age < 2.4); }

  // 0..1 along the run (done = 1); u2 = accelerating closing fraction.
  _u() {
    if (this._phase === 'hold') return 0;
    if (this._phase === 'done') return 1;
    return clamp01(this._t / (this.stage === S_MAG || this.stage === S_CHG ? RUSH_S : FALL_S));
  }

  draw(ctx, c, t) {
    const st = this.stage;
    if (st === S_MAG) this._magnets(ctx, c);
    else if (st === S_CHG) this._charges(ctx, c);
    else if (st === S_SYS) this._earthScene(ctx, c, true);
    else if (st === S_FOUR) this._four(ctx, c);
    else this._earthScene(ctx, c, false);
  }

  _pullArrows(ctx, c, xl, xr, y) {
    if (this._phase !== 'hold') return;
    vectorArrow(ctx, c, xl, y, { angle: Math.PI, length: 62, width: 8, head: 20, col: c.accent });
    vectorArrow(ctx, c, xr, y, { angle: 0, length: 62, width: 8, head: 20, col: c.accent });
    pill(ctx, c, 'F', xl - 32, y - 36, { bg: c.accent, size: 26 });
    pill(ctx, c, 'F', xr + 32, y - 36, { bg: c.accent, size: 26 });
  }

  // -- b0: magnets and the pea ------------------------------------------------------
  _magnets(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawBench(ctx, c, 30, 650, BENCH_Y, { h: 120 });
    const u = this._u();
    const close = u * u;
    const half = lerp(MAG.apart, PEA_R * 0.45, close);
    const lx = MAG.cx - half - MAG.w / 2, rx = MAG.cx + half + MAG.w / 2;
    const tc = this._phase === 'done' ? 1 : this._phase === 'run' ? clamp01((this._t - RUSH_S) / CRUSH_S) : 0;
    const crushed = this._phase === 'done' || (this._phase === 'run' && this._t >= RUSH_S);
    for (const x of [lx, rx]) drawShadow(ctx, c, x, BENCH_Y + 2, MAG.w * 0.5, 6, 0.8);
    if (!crushed) this._pea(ctx, c, MAG.cx, BENCH_Y - PEA_R, false);
    drawMagnet(ctx, c, { x: lx, y: MAG.y, w: MAG.w, h: MAG.h, flip: true, size: 26 });
    drawMagnet(ctx, c, { x: rx, y: MAG.y, w: MAG.w, h: MAG.h, flip: true, size: 26 });
    if (crushed) this._pea(ctx, c, MAG.cx, BENCH_Y - PEA_R, true);
    this._pullArrows(ctx, c, lx - MAG.w / 2 - 6, rx + MAG.w / 2 + 6, MAG.y);
    const K = crushed ? 1 - tc : close, U = 1 - close, heat = crushed ? tc : 0;
    drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: 330, y: 24, h: 120, max: 1, values: { K, U, heat } });
  }

  // A garden pea: lit side, shade side, a dimple; when crushed, two flat halves and crumbs.
  _pea(ctx, c, x, y, crushed) {
    const base = mix(c.s3, c.bgDeep, 0.1);
    if (!crushed) {
      ctx.beginPath(); ctx.arc(x, y, PEA_R, 0, TAU); ctx.fillStyle = base; ctx.fill();
      ellipse(ctx, x + 4, y + 4, PEA_R * 0.7, PEA_R * 0.6, 0); ctx.fillStyle = alpha(darken(base, 0.3), 0.6); ctx.fill();
      ellipse(ctx, x - 5, y - 5, 4, 3, -0.5); ctx.fillStyle = alpha(lighten(base, 0.5), 0.8); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, PEA_R, 0, TAU); ctx.strokeStyle = darken(base, 0.4); ctx.lineWidth = 2; ctx.stroke();
      return;
    }
    for (const [dx, rot] of [[-13, -1.2], [13, 1.2]]) {
      ellipse(ctx, x + dx, y + PEA_R * 0.8, 9, 4.5, rot * 0.1);
      ctx.fillStyle = base; ctx.fill();
      ctx.strokeStyle = darken(base, 0.4); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = lighten(base, 0.2);
    for (const [dx, dy, r] of [[-26, 12, 3], [24, 13, 2.5], [0, 2, 3], [-6, 14, 2.5], [8, 15, 3], [34, 14, 2]]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill();
    }
  }

  // -- b1: charges -------------------------------------------------------------------
  _charges(ctx, c) {
    drawBackdrop(ctx, c, 'grid');
    const u = this._u();
    const close = u * u;
    const half = lerp(CHG.apart, CHG.touch, close);
    const lx = 340 - half, rx = 340 + half;
    if (u > 0.05) {
      for (let i = 1; i <= 4; i++) {
        const h = lerp(CHG.apart, half, i / 5);
        for (const [x, tone] of [[340 - h, c.s6], [340 + h, c.s1]]) {
          ctx.beginPath(); ctx.arc(x, CHG.y, CHG.r * 0.9, 0, TAU);
          ctx.fillStyle = alpha(tone, 0.06 + 0.05 * i); ctx.fill();
        }
      }
    }
    drawShadow(ctx, c, lx, CHG.y + CHG.r + 40, CHG.r * 0.8, 7, 0.5);
    drawShadow(ctx, c, rx, CHG.y + CHG.r + 40, CHG.r * 0.8, 7, 0.5);
    drawCharge(ctx, c, { x: lx, y: CHG.y, r: CHG.r, sign: '+' });
    drawCharge(ctx, c, { x: rx, y: CHG.y, r: CHG.r, sign: '-' });
    this._pullArrows(ctx, c, lx - CHG.r - 6, rx + CHG.r + 6, CHG.y);
    drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: 296, y: 328, h: 100, max: 1, bars: KU, values: { K: close, U: 1 - close } });
  }

  // -- b2 / n01 b1: the ball and the Earth ---------------------------------------------
  _earth(ctx, c, dy) {
    const cx = 340, cy = EARTH_TOP + EARTH_R + dy;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, EARTH_R + 10, 0, TAU);
    ctx.fillStyle = alpha(c.s1, 0.18); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, EARTH_R, 0, TAU);
    const sea = mix(c.s1, c.bgDeep, 0.25);
    ctx.fillStyle = sea; ctx.fill();
    ctx.clip();
    ctx.fillStyle = mix(c.s3, c.bgDeep, 0.2);
    for (const [x, y, rx, ry, r] of [[120, 18, 130, 26, 0.05], [470, 30, 170, 34, -0.04], [300, 70, 90, 20, 0.1], [620, 80, 80, 18, 0]]) {
      ellipse(ctx, x, EARTH_TOP + dy + y, rx, ry, r); ctx.fill();
    }
    ctx.fillStyle = alpha(darken(sea, 0.35), 0.55);
    ctx.fillRect(0, EARTH_TOP + dy + 58, W, 200);
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, EARTH_R, Math.PI * 1.3, Math.PI * 1.7);
    ctx.strokeStyle = alpha(lighten(sea, 0.6), 0.8); ctx.lineWidth = 3; ctx.stroke();
  }

  _cricketBall(ctx, c, x, y) {
    drawBall(ctx, c, { x, y, r: BALL_R, tone: 6 });
    ctx.save();
    ctx.strokeStyle = alpha(lighten(c.s6, 0.7), 0.9);
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(x + k * 5, y, BALL_R * 0.35, BALL_R * 0.92, 0, k > 0 ? -1.3 : 1.84, k > 0 ? 1.3 : 4.44); ctx.stroke();
    }
    ctx.restore();
  }

  _earthScene(ctx, c, isSys) {
    drawBackdrop(ctx, c, 'dots');
    const bx = isSys ? 300 : 250;
    const u = this._u();
    const y = lerp(LIFT_Y, LAND_Y, u * u);
    this._earth(ctx, c, 0);
    if (u > 0.05) {
      for (let i = 1; i <= 4; i++) {
        const yy = lerp(LIFT_Y, y, i / 5);
        ctx.beginPath(); ctx.arc(bx, yy, BALL_R * (0.6 + 0.08 * i), 0, TAU);
        ctx.fillStyle = alpha(c.s6, 0.06 + 0.06 * i); ctx.fill();
      }
    }
    this._cricketBall(ctx, c, bx, y);
    if (isSys) {
      vectorArrow(ctx, c, bx, y + BALL_R + 6, { angle: Math.PI / 2, length: 74, width: 8, head: 20, col: c.accent });
      vectorArrow(ctx, c, bx, EARTH_TOP + 84, { angle: -Math.PI / 2, length: 74, width: 8, head: 20, col: c.accent });
      pill(ctx, c, 'F', bx + 34, y + BALL_R + 46, { bg: c.accent, size: 26 });
      pill(ctx, c, 'F', bx + 34, EARTH_TOP + 46, { bg: c.accent, size: 26 });
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = c.label; ctx.lineWidth = 3;
      rr(ctx, bx - 110, LIFT_Y - 64, 220, 520 - LIFT_Y + 64 - 10, 22); ctx.stroke();
      ctx.restore();
      pill(ctx, c, 'system', bx, LIFT_Y - 64, { bg: c.bgSurface, ink: c.label, size: 26 });
      drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: 470, y: 120, h: 130, max: 1, bars: KU, values: { K: u * u, U: 1 - u * u },
        anchor: { x: bx + BALL_R + 4, y } });
    } else {
      if (this._phase === 'hold') {
        this._dashed(ctx, c, bx - 60, LIFT_Y, bx - 60, EARTH_TOP - 8, 'h');
        this._dashed(ctx, c, bx + 120, EARTH_TOP + 22, bx + 120, EARTH_TOP + 16, null);
      }
      drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: 500, y: 110, h: 130, max: 1, bars: KU, values: { K: u * u, U: 1 - u * u },
        anchor: { x: bx + BALL_R + 4, y } });
      pill(ctx, c, 'gravitational potential energy', 664, 72, { align: 'right', bg: c.s3, size: 26 });
    }
  }

  // A dashed displacement arrow from (x1, y1) to (x2, y2).
  _dashed(ctx, c, x1, y1, x2, y2, label) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3.5;
    ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * 8, y2 - Math.sin(ang) * 8); ctx.stroke();
    ctx.setLineDash([]);
    const hd = 12;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hd * Math.cos(ang - 0.5), y2 - hd * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - hd * Math.cos(ang + 0.5), y2 - hd * Math.sin(ang + 0.5));
    ctx.closePath(); ctx.fill();
    ctx.restore();
    if (label) pill(ctx, c, label, x1 - 26, (y1 + y2) / 2, { bg: c.bgSurface, ink: c.label, size: 26 });
  }

  // -- n01 b0: the four kinds, each with its own U bar -------------------------------
  _four(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const cells = [[0, 0], [340, 0], [0, 260], [340, 260]];
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.18); ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(340, 20); ctx.lineTo(340, 500); ctx.moveTo(20, 260); ctx.lineTo(660, 260); ctx.stroke();
    ctx.restore();
    const draws = [this._miniBand, this._miniSpring, this._miniMagnets, this._miniBall];
    cells.forEach(([x, y], i) => {
      ctx.save(); ctx.translate(x, y);
      draws[i].call(this, ctx, c);
      const v = clamp01((this.age - 0.3 - 0.45 * i) / 0.4);
      drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: 252, y: 40, h: 140, barW: 42, max: 1, bars: ONLY_U, values: { U: v } });
      ctx.restore();
    });
  }

  _miniBand(ctx, c) {
    const wood = mix(c.s8, c.bgDeep, 0.3), shade = darken(wood, 0.34);
    limb(ctx, 150, 220, 150, 150, 16, wood, shade);
    limb(ctx, 150, 150, 120, 60, 13, wood, shade);
    limb(ctx, 150, 150, 182, 70, 13, shade, null);
    const p = { x: 60, y: 168 };
    for (const [tip, col] of [[{ x: 182, y: 70 }, darken(c.s6, 0.28)], [{ x: 120, y: 60 }, c.s6]]) {
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(p.x + 6, p.y - 4); ctx.stroke();
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.6);
    ctx.fillStyle = mix(c.s8, c.bgDeep, 0.52); rr(ctx, -14, -9, 28, 19, 6); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.s8, 0.3), 0.3); rr(ctx, -14, -9, 28, 5, 2.5); ctx.fill();
    ctx.restore();
    const sb = mix(c.stroke, c.bgDeep, 0.35);
    ellipse(ctx, p.x + 4, p.y - 10, 13, 11, -0.3); ctx.fillStyle = sb; ctx.fill();
    ellipse(ctx, p.x + 7, p.y - 7, 9, 7, -0.3); ctx.fillStyle = alpha(darken(sb, 0.3), 0.7); ctx.fill();
    ellipse(ctx, p.x, p.y - 14, 5, 3, -0.5); ctx.fillStyle = alpha(lighten(sb, 0.45), 0.75); ctx.fill();
    ctx.fillStyle = mix(c.s8, c.bgDeep, 0.58); rr(ctx, 139, 186, 22, 36, 7); ctx.fill();
  }

  _miniSpring(ctx, c) {
    const s = drawSpring(ctx, c, { x: 36, y: 150, len: 82, rest: 170, r: 26, wire: 5, wall: true, floorLen: 180 });
    drawBall(ctx, c, { x: s.free.x + 30, y: 150 + 26 + 4 - 30, r: 30, tone: 6 });
    vectorArrow(ctx, c, s.free.x + 120, 150, { angle: Math.PI, length: 48, width: 7, head: 16, col: c.accent });
  }

  _miniMagnets(ctx, c) {
    drawMagnet(ctx, c, { x: 54, y: 130, w: 90, h: 38, flip: true, size: 26 });
    drawMagnet(ctx, c, { x: 192, y: 130, w: 90, h: 38, flip: true, size: 26 });
  }

  _miniBall(ctx, c) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 340, 258); ctx.clip();
    ctx.beginPath(); ctx.arc(130, 210 + 900, 900, 0, TAU);
    ctx.fillStyle = mix(c.s1, c.bgDeep, 0.25); ctx.fill();
    ctx.fillStyle = mix(c.s3, c.bgDeep, 0.2); ellipse(ctx, 90, 226, 110, 20, 0.04); ctx.fill();
    ctx.restore();
    drawBall(ctx, c, { x: 130, y: 70, r: 26, tone: 6 });
    this._dashed(ctx, c, 70, 70, 70, 200, 'h');
  }
}

