import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, rr, ellipse, mix, alpha, lighten, darken, pill, vectorArrow,
  drawBackdrop, drawFloor, drawShadow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawSpring, drawBall } from 'simulations/base/kit/SimApparatus.js';

// blk-l04-s03, three beats.
// b0 the gulel: band held stretched, U full beside it; Let go: U empties into K on the stone.
// b1 the spring (book Fig 7.14): rest -> squashed by a push F (U rises) -> Let go (U into K).
// b2 the same squashed spring: the forces inside push back; Let go: they push the ball.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];
const S_BAND = 0, S_SPRING = 1, S_INSIDE = 2;

const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;
const easeIO = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const BARS = [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }];
const PANEL = { x: 520, y: 24, h: 120 };

// -- b0: the gulel (same boy and fork as blk-l04-s01) --------------------------
const GROUND_Y = 410;
const G_REST = { x: 206, y: 208 };
const G_HELD = { x: 157, y: 263 };
const TINE_N = { x: 188, y: 164 };
const TINE_F = { x: 228, y: 174 };
const CROTCH = { x: 206, y: 224 };
const GRIP = { x: 206, y: 258 };
// The hero (boy, gulel, band, held stone) is drawn in its own frame, scaled up
// about the boy's feet so it fills a third of the stage on the near floor.
const HERO = { k: 1.6, x: 150, y: 482, px: 128, py: 410 };
const HERO_AT = (p) => ({ x: HERO.x + (p.x - HERO.px) * HERO.k, y: HERO.y + (p.y - HERO.py) * HERO.k });
const ARC = [HERO_AT({ x: 206, y: 204 }), { x: 440, y: 118 }, { x: 600, y: 416 }];
const SNAP_S = 0.3, FLY_S = 0.9;
const STONE_R = 15; // in the hero frame
const FLY_R = STONE_R * HERO.k; // the same stone on the stage

// -- b1, b2: the spring against the wall ----------------------------------------
const AXIS = 306;
const COIL_R = 46;
const SP_X = 60;
const REST_LEN = 320;
const SQ_LEN = 150;
const BALL_R = 54;
const BALL_Y = AXIS + COIL_R + 4 - BALL_R;
const RUN_END = 610;
const SQUASH_S = 0.8, WAIT_S = 0.45, OPEN_S = 0.32, ROLL_S = 0.7;

function quad(p, u) {
  const v = 1 - u;
  return { x: v * v * p[0].x + 2 * v * u * p[1].x + u * u * p[2].x, y: v * v * p[0].y + 2 * v * u * p[1].y + u * u * p[2].y };
}

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

// An arm as upper arm + forearm with the elbow dropped, and the hand that
// closes on something at the end of it.
function forearm(ctx, sx, sy, hx, hy, w, fill, shade) {
  const dx = hx - sx, dy = hy - sy;
  const d = Math.hypot(dx, dy) || 1;
  const ex = sx + dx * 0.34 - (dy / d) * w * 0.9;
  const ey = sy + dy * 0.34 + (dx / d) * w * 0.9;
  limb(ctx, sx, sy, ex, ey, w, fill, shade);
  limb(ctx, ex, ey, hx, hy, w * 0.88, fill, shade);
  ctx.beginPath();
  ctx.arc(hx, hy, w * 0.66, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx - w * 0.14, hy - w * 0.18, w * 0.24, 0, TAU);
  ctx.fillStyle = alpha(lighten(fill, 0.3), 0.5);
  ctx.fill();
}

export class SpringStagesScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL =
    'Step 1: a boy holds a gulel with the band stretched; a U bar beside the band is full. ' +
    'Let go and the U bar empties into a K bar beside the flying stone. Step 2: a spring ' +
    'against a wall with a ball at its free end; a push F squashes it and the U bar rises; ' +
    'let go and the spring pushes the ball away as U turns into K. Step 3: the squashed ' +
    'spring with small arrows inside it pushing back; let go and they push the ball.';
  static CONTROLS = [
    { type: 'button', id: 'release', label: 'Let go' },
    { type: 'button', id: 'again', label: 'Again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._phase = 'hold';
    this._t = 0;
  }

  enter(stage) {
    this._phase = stage === S_SPRING ? 'squash' : 'hold';
    this._t = 0;
  }

  isControlHidden(id) {
    if (id === 'release') return this._phase === 'done';
    return this._phase !== 'done';
  }
  isControlDisabled() { return this._phase === 'run' || this._phase === 'squash'; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'release' && this._phase === 'hold') { this._phase = 'run'; this._t = 0; }
    else if (id === 'again' && this._phase === 'done') {
      this._phase = this.stage === S_SPRING ? 'squash' : 'hold';
      this._t = 0;
    }
    this.requestUiUpdate?.();
  }

  _runLen() { return this.stage === S_BAND ? SNAP_S + FLY_S : OPEN_S + ROLL_S; }

  update(d) {
    if (this._phase === 'squash') {
      this._t += d;
      if (this._t >= WAIT_S + SQUASH_S) { this._phase = 'hold'; this._t = 0; this.requestUiUpdate?.(); }
    } else if (this._phase === 'run') {
      this._t += d;
      if (this._t >= this._runLen()) { this._phase = 'done'; this.requestUiUpdate?.(); }
    }
  }

  busy() { return this._phase === 'squash' || this._phase === 'run'; }

  draw(ctx, c, t) {
    if (this.stage === S_BAND) this._drawBand(ctx, c);
    else this._drawSpring(ctx, c, t);
  }

  // -- b0 ---------------------------------------------------------------------------

  _bandState() {
    const ph = this._phase, t = this._t;
    if (ph === 'hold') return { pouch: G_HELD, stone: { x: G_HELD.x, y: G_HELD.y - 4 }, u: -1, U: 1, K: 0, pull: 1 };
    const tt = ph === 'done' ? SNAP_S + FLY_S : t;
    const e = tt >= SNAP_S ? 1 : 1 - Math.exp(-5.2 * tt / SNAP_S) * Math.cos(9.5 * tt / SNAP_S);
    const pouch = { x: lerp(G_HELD.x, G_REST.x, e), y: lerp(G_HELD.y, G_REST.y, e) };
    const give = clamp01(tt / SNAP_S);
    const U = (1 - give) * (1 - give);
    let stone, u = -1;
    if (tt < SNAP_S * 0.6) stone = { x: pouch.x, y: pouch.y - 4 };
    else { u = clamp01((tt - SNAP_S * 0.6) / (SNAP_S * 0.4 + FLY_S)); stone = quad(ARC, u); }
    return { pouch, stone, u, U, K: 1 - U, pull: 1 - clamp01(tt / SNAP_S) };
  }

  _drawBand(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this._field(ctx, c);
    const s = this._bandState();
    if (s.u >= 0) {
      // the path flown, dashed, then equal-time ghost stones on it
      ctx.save();
      ctx.setLineDash([10, 9]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = alpha(mix(c.stroke, c.bgDeep, 0.25), 0.45);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const p = quad(ARC, (i / 40) * s.u);
        if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
      for (let i = 1; i <= 7; i++) {
        const v = (i / 8) * s.u;
        if (s.u - v < 0.06) continue;
        const p = quad(ARC, v);
        ctx.save();
        ctx.globalAlpha *= 0.22 + 0.06 * i;
        stoneAt(ctx, c, { x: p.x, y: p.y, r: FLY_R * (0.72 + 0.03 * i) }, false);
        ctx.restore();
      }
    }
    const hand = this._phase === 'hold' ? G_HELD : G_HELD;
    ctx.save();
    ctx.translate(HERO.x, HERO.y);
    ctx.scale(HERO.k, HERO.k);
    ctx.translate(-HERO.px, -HERO.py);
    drawFigure(ctx, c,
      { x: 128, y: GROUND_Y, height: 224, build: 'kid', facing: 1, pose: { name: 'stand' }, autoReach: false,
        hands: [{ x: hand.x - 6, y: hand.y }, { x: GRIP.x - 6, y: GRIP.y }] },
      { skin: 1, hairStyle: 'short', top: c.s3, mood: this._phase === 'hold' ? 'effort' : 'smile', t: this.clock });
    fork(ctx, c);
    band(ctx, c, s.pouch, s.pull);
    if (s.u < 0) stoneAt(ctx, c, s.stone, false);
    ctx.restore();
    if (s.u >= 0) stoneAt(ctx, c, { ...s.stone, r: FLY_R }, true);
    const held = HERO_AT(s.u < 0 ? s.stone : { x: 198, y: 214 });
    const anchor = s.u < 0 ? { x: held.x, y: held.y - FLY_R - 6 } : { x: s.stone.x, y: s.stone.y - FLY_R - 6 };
    drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: PANEL.x, y: PANEL.y, h: PANEL.h, max: 1, bars: BARS, values: { K: s.K, U: s.U }, anchor });
  }

  // An open ground: a low hedge line and a dusty path, not the s01 garden wall.
  _field(ctx, c) {
    const hedge = mix(c.s3, c.bgDeep, 0.35);
    ctx.fillStyle = hedge;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= W; x += 34) ctx.quadraticCurveTo(x + 17, GROUND_Y - 62 - 10 * Math.sin(x * 0.07), x + 34, GROUND_Y - 44);
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha(lighten(hedge, 0.25), 0.55);
    for (let x = 12; x < W; x += 34) { ellipse(ctx, x, GROUND_Y - 46 - 6 * Math.sin(x * 0.07), 9, 5, -0.3); ctx.fill(); }
    ctx.fillStyle = alpha(darken(hedge, 0.3), 0.5);
    ctx.fillRect(0, GROUND_Y - 10, W, 10);
    drawFloor(ctx, c, GROUND_Y, { col: mix(c.bgDeep, c.s8, 0.22), seams: false });
    for (let x = 30; x < W; x += 58) {
      ctx.fillStyle = alpha(mix(c.bgDeep, c.s8, 0.45), 0.7);
      ellipse(ctx, x + (x % 3) * 7, GROUND_Y + 22 + (x % 5) * 6, 6, 3, 0);
      ctx.fill();
    }
  }

  // -- b1, b2 -------------------------------------------------------------------------

  _springState() {
    const ph = this._phase, t = this._t;
    let len = SQ_LEN, ballX = null, push = 1;
    if (ph === 'squash') {
      const u = easeIO(clamp01((t - WAIT_S) / SQUASH_S));
      len = lerp(REST_LEN, SQ_LEN, u);
      push = clamp01((t - WAIT_S * 0.4) / 0.3);
    } else if (ph === 'run' || ph === 'done') {
      const tt = ph === 'done' ? OPEN_S + ROLL_S : t;
      const uo = clamp01(tt / OPEN_S);
      len = lerp(SQ_LEN, REST_LEN, Math.sin(uo * Math.PI / 2));
      push = 0;
      if (tt > OPEN_S) ballX = lerp(SP_X + REST_LEN + BALL_R, RUN_END, clamp01((tt - OPEN_S) / ROLL_S));
    }
    if (ballX == null) ballX = SP_X + len + BALL_R;
    const comp = (REST_LEN - len) / (REST_LEN - SQ_LEN);
    const U = comp * comp;
    const K = ph === 'run' || ph === 'done' ? 1 - U : 0;
    return { len, ballX, push, comp, U, K };
  }

  _drawSpring(ctx, c, t) {
    drawBackdrop(ctx, c, 'grid');
    drawFloor(ctx, c, AXIS + COIL_R + 16, { seams: true });
    const s = this._springState();
    const inside = this.stage === S_INSIDE;
    const moved = this._phase === 'run' || this._phase === 'done';
    if (moved && s.ballX > SP_X + REST_LEN + BALL_R + 4) {
      const x0 = SP_X + REST_LEN + BALL_R;
      for (let i = 1; i <= 4; i++) {
        const x = lerp(x0, s.ballX, i / 5);
        ctx.beginPath();
        ctx.arc(x, BALL_Y, BALL_R * (0.6 + 0.08 * i), 0, TAU);
        ctx.fillStyle = alpha(c.s6, 0.08 + 0.06 * i);
        ctx.fill();
      }
    }
    drawSpring(ctx, c, { x: SP_X, y: AXIS, len: s.len, rest: REST_LEN, r: COIL_R, wire: 7, wall: true, floorLen: 610 });
    drawShadow(ctx, c, s.ballX, AXIS + COIL_R + 4, BALL_R * 0.8, 6, 0.6);
    drawBall(ctx, c, { x: s.ballX, y: BALL_Y, r: BALL_R, tone: 6 });
    if (s.push > 0.01) {
      const x = s.ballX + BALL_R + 8;
      vectorArrow(ctx, c, x + 96, BALL_Y, { angle: Math.PI, length: 96, width: 8, head: 20, col: c.accent, alpha: s.push });
      pill(ctx, c, 'F', x + 56, BALL_Y - 34, { bg: c.accent, size: 26, alpha: s.push });
    }
    if (inside && s.comp > 0.05) this._insideForces(ctx, c, s);
    drawEnergyBars(ctx, c, { size: 26, minSize: 26, x: PANEL.x, y: PANEL.y, h: PANEL.h, max: 1, bars: BARS,
      values: { K: s.K, U: s.U }, anchor: { x: s.ballX, y: BALL_Y - BALL_R - 4 }, alpha: inside ? 0.38 : 1 });
  }

  // Small arrows along the squashed coils: the spring pushing back, out towards the ball.
  _insideForces(ctx, c, s) {
    const n = 2;
    const L = 24 + 22 * s.comp;
    for (let i = 0; i < n; i++) {
      const x = SP_X + (s.len * (i + 0.5)) / n - L / 2;
      vectorArrow(ctx, c, x, AXIS, { angle: 0, length: L, width: 10, head: 18, col: c.bgSurface, alpha: 0.9 });
      vectorArrow(ctx, c, x, AXIS, { angle: 0, length: L, width: 5, head: 14, col: c.s5 });
    }
    pill(ctx, c, 'forces inside', SP_X + 120, AXIS - COIL_R - 44, { bg: c.s5, size: 26 });
  }
}

// -- The gulel parts (module functions: no names claimed on the scene) -------------

function fork(ctx, c) {
  const wood = mix(c.s8, c.bgDeep, 0.3);
  const shade = darken(wood, 0.34);
  limb(ctx, GRIP.x, GRIP.y + 14, CROTCH.x, CROTCH.y, 14, wood, shade);
  limb(ctx, CROTCH.x, CROTCH.y, TINE_N.x, TINE_N.y, 11, wood, shade);
  limb(ctx, CROTCH.x, CROTCH.y, TINE_F.x, TINE_F.y, 11, shade, null);
  ctx.fillStyle = mix(c.s8, c.bgDeep, 0.58);
  rr(ctx, GRIP.x - 11, GRIP.y - 15, 22, 32, 7);
  ctx.fill();
  ctx.fillStyle = alpha(lighten(c.s8, 0.2), 0.3);
  rr(ctx, GRIP.x - 11, GRIP.y - 15, 22, 5, 2.5);
  ctx.fill();
}

function band(ctx, c, p, u) {
  const th = 8 - 4 * u;
  const sag = 11 * (1 - u);
  for (const [tip, ex, ey, col] of [
    [TINE_F, p.x + 7, p.y - 4, darken(c.s6, 0.28)],
    [TINE_N, p.x - 7, p.y - 4, c.s6],
  ]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = th;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + ex) / 2, (tip.y + ey) / 2 + sag, ex, ey);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(0.35);
  ctx.fillStyle = mix(c.s8, c.bgDeep, 0.52);
  rr(ctx, -12, -8, 24, 17, 5);
  ctx.fill();
  ctx.fillStyle = alpha(lighten(c.s8, 0.3), 0.28);
  rr(ctx, -12, -8, 24, 5, 2.5);
  ctx.fill();
  ctx.restore();
}

function stoneAt(ctx, c, p, flying) {
  const r = p.r ?? STONE_R;
  const base = mix(c.stroke, c.bgDeep, 0.35);
  if (flying) drawShadow(ctx, c, p.x + 4, HERO.y + 2, r * 0.9, 4.5, 0.5);
  ctx.save();
  ctx.translate(p.x, p.y);
  ellipse(ctx, 0, 0, r * 1.08, r * 0.92, -0.3);
  ctx.fillStyle = base;
  ctx.fill();
  ellipse(ctx, r * 0.28, r * 0.22, r * 0.72, r * 0.58, -0.3);
  ctx.fillStyle = alpha(darken(base, 0.3), 0.7);
  ctx.fill();
  ellipse(ctx, -r * 0.35, -r * 0.32, r * 0.42, r * 0.26, -0.5);
  ctx.fillStyle = alpha(lighten(base, 0.45), 0.75);
  ctx.fill();
  ctx.strokeStyle = alpha(darken(base, 0.45), 0.9);
  ctx.lineWidth = 2;
  ellipse(ctx, 0, 0, r * 1.08, r * 0.92, -0.3);
  ctx.stroke();
  ctx.restore();
}
