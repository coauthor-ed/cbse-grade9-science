import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, rr, ellipse, mix, alpha, lighten, darken,
  drawBackdrop, drawFloor, drawVignette,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';

// blk-l04-s01 (one beat): the band is drawn back and held; Let go (or a tap on
// the band) snaps it, the stone flies, and a K bar rides with the stone.
// blk-l04-s02 mounts this file as a predict setup (hostRole 'setup'): the same
// held band, nothing moving, no bars, no words, no controls.
const MAP_S01 = [[{ idx: 0, dwellMs: null }]];

const PULL_MAX = 20;
const PULL_HOLD = 15;    // the held draw-back, in the band's own units
const PULL_PX = 3.3;
const PULL_DY = 3.7;
const POUCH_REST = { x: 206, y: 194 };
const POUCH_AT = (p) => ({ x: POUCH_REST.x - PULL_PX * p, y: POUCH_REST.y + PULL_DY * p });

const TINE_N = { x: 188, y: 150 };
const TINE_F = { x: 228, y: 160 };
const CROTCH = { x: 206, y: 210 };
const GRIP = { x: 206, y: 244 };

const WALL_Y = 100, GROUND_Y = 396;
const SHELF = { x0: 14, x1: 120, y: 132 };
const DISH = { x: 420, y: 396 };
const VINE = { x: 342, top: 176 };

// The run: the band snaps (SNAP_S), the stone flies one arc and is held in the
// air at the end with its trail, so the K bar has a stone to stand beside.
const DRAW_S = 0.6;      // s01 opens with the boy drawing the band back
const SNAP_S = 0.30;
// The hero (boy, gulel, band, held stone) is drawn in its own frame, scaled
// up about the boy's feet so it fills a third of the stage and stands on the
// near floor; HERO_AT maps a point of that frame to the stage.
const HERO = { k: 1.6, x: 150, y: 474, px: 128, py: 396 };
const HERO_AT = (p) => ({ x: HERO.x + (p.x - HERO.px) * HERO.k, y: HERO.y + (p.y - HERO.py) * HERO.k });
const LAUNCH = HERO_AT({ x: 206, y: 190 });
const AIR_CTRL = { x: 440, y: 118 };
const AIR_END = { x: 600, y: 410 };
const FLIGHT_S = 0.9;
const RUN_S = SNAP_S + FLIGHT_S;
const BARS = [{ id: 'K', label: 'K', tone: 1 }];
const BAR_AT = { x: 548, y: 24 };

const STONE_R = 15; // in the hero frame
const FLY_R = STONE_R * HERO.k; // the same stone on the stage
const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;

function snapEase(u) {
  if (u >= 1) return 1;
  return 1 - Math.exp(-5.2 * u) * Math.cos(9.5 * u);
}

function quad(p0, p1, p2, u) {
  const v = 1 - u;
  return { x: v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x, y: v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y };
}

// A flat capsule limb: flat fills, one darker cushion shade, no stroke widths.
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

export class SlingshotBandScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static BEAT_STEP_MAP = MAP_S01;
  static ARIA_LABEL =
    'A boy holds a wooden gulel with a stone in the leather pouch and the band drawn back. ' +
    'Let go and the band snaps forward and the stone flies off in an arc; a bar marked K ' +
    'rises beside the flying stone.';
  static CONTROLS = [
    { type: 'button', id: 'release', label: 'Let go' },
    { type: 'button', id: 'again', label: 'Again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._ask = false;
    this._phase = 'hold';
    this._runT = 0;
    this._pull = PULL_HOLD;
    this._down = null;
  }

  enter() {
    this._ask = this.hostRole === 'setup';
    this._phase = 'hold';
    this._runT = 0;
    this._down = null;
    this._pull = PULL_HOLD;
    this._redraw = null;
    this._wasDrawing = false;
  }

  isControlHidden(id) {
    if (this._ask) return true;
    if (id === 'release') return this._phase === 'done';
    return this._phase !== 'done';
  }
  isControlDisabled() { return this._phase === 'run' || this._drawK() < 1; }

  onControlChange(id) {
    if (!this._guard(id) || this._ask) return;
    if (id === 'release') this._release();
    else if (id === 'again') this._reset();
    this.requestUiUpdate?.();
  }

  // A tap on the band or the pouch lets go too (s01 only).
  pointerDown(p) {
    if (this._ask || this._phase !== 'hold') return;
    const lx = HERO.px + (p.x - HERO.x) / HERO.k, ly = HERO.py + (p.y - HERO.y) / HERO.k;
    if (lx < 120 || lx > 270 || ly < 130 || ly > 300) return;
    this._down = { x: p.x, y: p.y };
  }
  pointerMove() { return false; }
  pointerUp(p) {
    const d = this._down;
    this._down = null;
    if (!d || (p && Math.hypot(p.x - d.x, p.y - d.y) > 10)) return;
    this._release();
    this.requestUiUpdate?.();
  }

  _release() {
    if (this._ask || this._phase !== 'hold' || this._drawK() < 1) return;
    this._phase = 'run';
    this._runT = 0;
  }

  _reset() {
    this._phase = 'hold';
    this._runT = 0;
    this._redraw = this.clock;
  }

  // 0..1: how far the band is drawn back at landing (setup: already held).
  _drawK() {
    if (this._ask) return 1;
    const t0 = this._redraw ?? 0;
    const since = this._redraw != null ? this.clock - t0 : this.age;
    return clamp01(since / DRAW_S);
  }

  update(d) {
    if (this._phase === 'run') {
      this._runT = Math.min(RUN_S, this._runT + d);
      if (this._runT >= RUN_S) { this._phase = 'done'; this.requestUiUpdate?.(); }
    }
    if (this._drawK() >= 1 && this._wasDrawing) { this._wasDrawing = false; this.requestUiUpdate?.(); }
    if (this._drawK() < 1) this._wasDrawing = true;
  }

  busy() { return this._phase === 'run' || this._drawK() < 1; }

  _held() {
    const k = this._drawK();
    return POUCH_AT(PULL_HOLD * (1 - Math.pow(1 - k, 2)));
  }

  _pouch() {
    if (this._phase === 'hold') return this._held();
    const u = clamp01(this._runT / SNAP_S);
    const from = POUCH_AT(PULL_HOLD);
    if (u >= 1) return POUCH_REST;
    const e = snapEase(u);
    return { x: lerp(from.x, POUCH_REST.x, e), y: lerp(from.y, POUCH_REST.y, e) };
  }

  // The stone: in the pouch, then riding the pouch forward, then on its arc.
  _stone() {
    if (this._phase === 'hold') { const p = this._pouch(); return { x: p.x, y: p.y - 4, u: -1 }; }
    const t = this._runT;
    if (t < SNAP_S * 0.6) { const p = this._pouch(); return { x: p.x, y: p.y - 4, u: -1 }; }
    const u = clamp01((t - SNAP_S * 0.6) / (RUN_S - SNAP_S * 0.6));
    const p = quad(LAUNCH, AIR_CTRL, AIR_END, u);
    return { x: p.x, y: p.y, u };
  }

  // K: 0 while held, rises as the band gives up its stretch, then stays.
  _kin() {
    if (this._phase === 'hold') return 0;
    return barsAt({ K: 0 }, { K: 1 }, clamp01(this._runT / (SNAP_S + 0.25))).K;
  }

  draw(ctx, c, t) {
    this._pull = this._phase === 'hold' ? PULL_HOLD * this._drawK() : (this._phase === 'run' && this._runT < SNAP_S ? PULL_HOLD * (1 - clamp01(this._runT / SNAP_S)) : 0);
    this._wall(ctx, c);
    drawFloor(ctx, c, GROUND_Y, { col: mix(c.bgDeep, c.s3, 0.17), seams: false });
    this._tufts(ctx, c);
    this._shelf(ctx, c);
    this._grassThings(ctx, c);
    const s = this._stone();
    if (s.u >= 0) this._trail(ctx, c, s.u);
    ctx.save();
    ctx.translate(HERO.x, HERO.y);
    ctx.scale(HERO.k, HERO.k);
    ctx.translate(-HERO.px, -HERO.py);
    this._boy(ctx, c);
    this._fork(ctx, c);
    this._band(ctx, c, this._pouch());
    if (s.u < 0) this._ball(ctx, c, s, false);
    if (!this._ask && this._phase === 'hold' && this._drawK() >= 1) this._cue(ctx, c, t);
    ctx.restore();
    if (s.u >= 0) this._ball(ctx, c, s, true);
    drawVignette(ctx, c, 0.45);
    if (!this._ask && this._phase !== 'hold') {
      const a = clamp01(this._runT / 0.2);
      drawEnergyBars(ctx, c, { x: BAR_AT.x, y: BAR_AT.y, h: 132, max: 1, bars: BARS,
        values: { K: this._kin() }, anchor: (s.u < 0 ? { x: HERO_AT(s).x, y: HERO_AT(s).y - FLY_R - 6 } : { x: s.x, y: s.y - FLY_R - 6 }), alpha: a });
    }
  }

  // Faded stones along the arc already flown: the motion stays readable at rest.
  _trail(ctx, c, u) {
    // the path flown, as a dashed line, then equal-time ghost stones on it
    ctx.save();
    ctx.setLineDash([10, 9]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(mix(c.stroke, c.bgDeep, 0.25), 0.45);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const p = quad(LAUNCH, AIR_CTRL, AIR_END, (i / 40) * u);
      if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
    for (let i = 1; i <= 7; i++) {
      const v = (i / 8) * u;
      if (u - v < 0.06) continue;
      const p = quad(LAUNCH, AIR_CTRL, AIR_END, v);
      ctx.save();
      ctx.globalAlpha *= 0.22 + 0.06 * i;
      this._ball(ctx, c, { x: p.x, y: p.y, r: FLY_R * (0.72 + 0.03 * i) }, false);
      ctx.restore();
    }
  }

  // A soft ring round the pouch: the band is the thing to let go.
  _cue(ctx, c, t) {
    const p = this._pouch();
    const k = 0.5 + 0.5 * Math.sin(t * 3.4);
    ctx.save();
    ctx.strokeStyle = alpha(c.accent, 0.35 + 0.35 * k);
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30 + 3 * k, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  _tufts(ctx, c) {
    for (let x = 24; x < W; x += 46) {
      ctx.fillStyle = alpha(mix(c.bgDeep, c.s3, 0.42), 0.8);
      ctx.beginPath();
      ctx.ellipse(x + ((x / 46) % 3) * 5, GROUND_Y + 7, 9, 5, 0, 0, TAU);
      ctx.fill();
    }
  }

  _boy(ctx, c) {
    const hand = this._phase === 'hold' ? this._pouch() : POUCH_AT(PULL_HOLD);
    const k = this._phase === 'hold' ? this._pull / PULL_MAX : 0.2;
    drawFigure(ctx, c,
      { x: 128, y: GROUND_Y, height: 224, build: 'kid', facing: 1,
        pose: { name: 'stand' }, autoReach: false,
        hands: [{ x: hand.x - 6, y: hand.y }, { x: GRIP.x - 6, y: GRIP.y }] },
      { skin: 1, hairStyle: 'short', top: c.s3, mood: this._phase === 'hold' && k > 0.5 ? 'effort' : 'smile', t: this._ask ? 0 : this.clock });
  }

  // A river stone: lit side, shade side, a seam line; never a face.
  _ball(ctx, c, p, flying) {
    const r = p.r ?? (flying ? FLY_R : STONE_R);
    const base = mix(c.stroke, c.bgDeep, 0.35);
    if (flying) {
      ctx.fillStyle = alpha(darken(c.bgDeep, 0.1), 0.25);
      ctx.beginPath();
      ctx.ellipse(p.x + 4, HERO.y + 2, r * 0.9, 4.5, 0, 0, TAU);
      ctx.fill();
    }
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

  _wall(ctx, c) {
    drawBackdrop(ctx, c, 'dots', { t: 0 });
    const wall = mix(c.bgSurface, c.s8, 0.2);
    ctx.fillStyle = wall;
    ctx.fillRect(0, WALL_Y, W, GROUND_Y - WALL_Y);
    for (let row = 0, y = WALL_Y; y < GROUND_Y; row++, y += 30) {
      ctx.fillStyle = alpha(darken(wall, 0.34), 0.7);
      ctx.fillRect(0, y + 29, W, 1.5);
      const off = row % 2 ? 44 : 0;
      for (let x = off; x < W; x += 88) ctx.fillRect(x, y, 1.5, 30);
      if (row % 3 === 1) {
        ctx.fillStyle = alpha(lighten(wall, 0.1), 0.5);
        ctx.fillRect(0, y + 1, W, 2);
      }
    }
    for (const [px, py, pw, ph] of [[30, 150, 150, 90], [230, 300, 190, 70], [40, 300, 120, 80]]) {
      ctx.fillStyle = alpha(darken(wall, 0.12), 0.55);
      rr(ctx, px, py, pw, ph, 14);
      ctx.fill();
    }
    ctx.fillStyle = lighten(wall, 0.16);
    ctx.fillRect(0, WALL_Y, W, 14);
    ctx.fillStyle = alpha(lighten(wall, 0.4), 0.7);
    ctx.fillRect(0, WALL_Y, W, 3);
    ctx.fillStyle = alpha(darken(c.bgDeep, 0.1), 0.28);
    ctx.fillRect(0, WALL_Y + 14, W, 16);
    this._vine(ctx, c);
  }

  // A climber up the wall: the middle band behind the flight is garden, not a
  // blank field of brick.
  _vine(ctx, c) {
    const stem = mix(c.s3, c.bgDeep, 0.3);
    ctx.strokeStyle = stem;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(VINE.x + 6, GROUND_Y);
    ctx.bezierCurveTo(VINE.x - 14, 320, VINE.x + 18, 260, VINE.x - 4, VINE.top);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const y = GROUND_Y - u * (GROUND_Y - VINE.top);
      const x = VINE.x + Math.sin(u * 5.4) * 13;
      const side = i % 2 ? 1 : -1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(side * 0.7 + u * 0.5);
      ellipse(ctx, side * 11, 0, 11, 6, 0);
      ctx.fillStyle = alpha(mix(c.s3, c.bgDeep, 0.18 + 0.1 * (i % 3)), 0.9);
      ctx.fill();
      ctx.restore();
    }
  }

  // A shelf of pots high on the wall, clear of the pellet's flight.
  _shelf(ctx, c) {
    const wood = lighten(c.gold, 0.05);
    const shade = darken(c.gold, 0.34);
    ctx.fillStyle = shade;
    ctx.fillRect(SHELF.x0, SHELF.y + 12, SHELF.x1 - SHELF.x0, 7);
    ctx.fillStyle = wood;
    ctx.fillRect(SHELF.x0, SHELF.y, SHELF.x1 - SHELF.x0, 12);
    ctx.fillStyle = alpha(lighten(wood, 0.4), 0.7);
    ctx.fillRect(SHELF.x0, SHELF.y, SHELF.x1 - SHELF.x0, 3);
    for (const bx of [SHELF.x0 + 20, SHELF.x1 - 32]) {
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(bx, SHELF.y + 12);
      ctx.lineTo(bx + 12, SHELF.y + 12);
      ctx.lineTo(bx, SHELF.y + 34);
      ctx.closePath();
      ctx.fill();
    }
    for (const [px, sc] of [[SHELF.x0 + 44, 1], [SHELF.x0 + 106, 0.82], [SHELF.x1 - 54, 0.78]]) {
      ctx.save();
      ctx.translate(px, SHELF.y);
      ctx.scale(sc, sc);
      ctx.fillStyle = mix(c.s6, c.bgDeep, 0.24);
      ctx.beginPath();
      ctx.moveTo(-19, 0);
      ctx.lineTo(19, 0);
      ctx.lineTo(14, -26);
      ctx.lineTo(-14, -26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mix(c.s6, c.bgDeep, 0.08);
      rr(ctx, -22, -33, 44, 9, 3);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(SHELF.x0 + 46, SHELF.y - 30);
    ctx.strokeStyle = c.s3;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const [a, len] of [[-0.55, 32], [0.05, 40], [0.6, 28]]) {
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(Math.sin(a) * len * 0.5, -len * 0.7, Math.sin(a) * len, -len);
      ctx.stroke();
      ellipse(ctx, Math.sin(a) * len, -len, 8, 14, a);
      ctx.fillStyle = mix(c.s3, c.bgDeep, 0.12);
      ctx.fill();
    }
    ctx.restore();
  }

  // A dish of spare pellets on the lawn: the lower middle is not a dead band,
  // and these are the pellets the boy is about to use.
  _grassThings(ctx, c) {
    ctx.fillStyle = alpha(darken(c.bgDeep, 0.1), 0.35);
    ctx.beginPath();
    ctx.ellipse(DISH.x, GROUND_Y + 2, 30, 7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mix(c.s6, c.bgDeep, 0.3);
    ctx.beginPath();
    ctx.ellipse(DISH.x, GROUND_Y - 6, 26, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mix(c.s6, c.bgDeep, 0.14);
    ctx.beginPath();
    ctx.ellipse(DISH.x, GROUND_Y - 9, 26, 9, 0, 0, TAU);
    ctx.fill();
    for (const [dx, dy] of [[-9, -13], [2, -16], [12, -12], [-3, -21], [8, -21]]) {
      ctx.beginPath();
      ctx.arc(DISH.x + dx, GROUND_Y - 12 + dy, 5, 0, TAU);
      ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.35);
      ctx.fill();
      ctx.strokeStyle = alpha(darken(mix(c.stroke, c.bgDeep, 0.35), 0.45), 0.9);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  _fork(ctx, c) {
    // A mid-brown fork: the same warm family as the boy's skin, so the fork is
    // a value darker than the hand that holds it and the two never merge.
    const wood = mix(c.s8, c.bgDeep, 0.3);
    const shade = darken(wood, 0.34);
    limb(ctx, GRIP.x, GRIP.y + 14, CROTCH.x, CROTCH.y, 14, wood, shade);
    limb(ctx, CROTCH.x, CROTCH.y, TINE_N.x, TINE_N.y, 11, wood, shade);
    limb(ctx, CROTCH.x, CROTCH.y, TINE_F.x, TINE_F.y, 11, shade, null);
    // the leather wrap round the grip, where the far hand closes on it
    ctx.fillStyle = mix(c.s8, c.bgDeep, 0.58);
    rr(ctx, GRIP.x - 11, GRIP.y - 15, 22, 32, 7);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.s8, 0.2), 0.3);
    rr(ctx, GRIP.x - 11, GRIP.y - 15, 22, 5, 2.5);
    ctx.fill();
  }

  // The band: two strands over the two tines, sagging when slack, straight and
  // thin when drawn back.
  _band(ctx, c, p) {
    const u = this._pull / PULL_MAX;
    const th = 8 - 4 * u;
    const sag = 11 * (1 - u);
    for (const [tip, ex, ey, col] of [
      [TINE_F, p.x + 7, p.y - 4, darken(c.s6, 0.28)],
      [TINE_N, p.x - 7, p.y - 4, c.s6],
    ]) {
      const mx = (tip.x + ex) / 2;
      const my = (tip.y + ey) / 2 + sag;
      ctx.strokeStyle = col;
      ctx.lineWidth = th;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.quadraticCurveTo(mx, my, ex, ey);
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
}
