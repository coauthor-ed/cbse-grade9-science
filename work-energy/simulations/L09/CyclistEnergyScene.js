// CyclistEnergyScene.js
//
// blk-l09-s02 (poe-predict, role "setup", NO steps) and blk-l09-s03 (2 steps):
// the same rider-effort panel at two scales. On the first mount it opens cold as
// a question - a bicycle on a flat road and nothing else. On the second it is the
// argument: three channels on the cyclist, the same three-panel card on a braking
// car, where the reaction plateau comes before any slowing at all.
//
// The scene is only ever told a beat COUNT, and the two mounts have different
// ones (0 and 2), so the count IS the mount: BEAT_MAPS = { 2, 0 }. The 0 map
// lands on S_ASK, which reveals nothing - no dial, no run, no third channel.
//
// Both halves are motion, which is why this is a canvas scene: the road scrolls
// at the vehicle's own speed, so the dashes bunch when the car slows, and the
// graph under it is drawn as the run happens.
//
// Every joule is accounted for by construction: the three channel shares are one
// array that sums to 1, and the car carries (1 - posted) of its own KE while the
// three posted shares take the rest - so the four tiles read 100 % at every
// instant of the run, not only at the end.

import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, alpha, chipColumn, chipRow, darken, drawBadge, drawBackdrop, drawCard,
  drawMeter, drawShadow, ellipse, font, lighten, luma, mix, pill, rr,
} from 'simulations/base/kit/SimLook.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- the numbers
const EFFORT_MIN = 20, EFFORT_MAX = 100, EFFORT_STEP = 5, EFFORT_START = 55;
// The rider's power and the speed it buys: P = 2.0 x effort W, and on a flat road
// that is worth v = 2.0 + 8.0 x effort/100 m/s. A fit rider on the flat, both ends.
const powerOf = (e) => 2.0 * e;
const speedOf = (e) => 2.0 + 8.0 * (e / 100);
const RIDE_S = 2.6;                       // one burst: from rest to that speed
// The split. Fixed, never a dial, and the three sum to 1 by construction.
const CY_SHARE = [0.24, 0.72, 0.04];
const CY_TILES = [
  { label: 'motion', sub: 'the moving bicycle', col: 's3', icon: 'motion' },
  { label: 'heat', sub: 'body, tyres, chain, air', col: 's2', icon: 'heat' },
  { label: 'sound', sub: 'tyres, chain, breath', col: 's7', icon: 'sound' },
];

const KMH_MIN = 30, KMH_MAX = 90, KMH_STEP = 10, KMH_START = 60;
const CAR_KG = 1200;
const T_REACT = 1.5;                      // the driver has to notice first
const T_ANIM = 4.0;                       // every run plays in 4 s whatever the real time
const POST_S = 1.0;                       // and the posting takes 1 s more
const TAIL_S = 0.4;                       // the burst's hold at the top speed
const NUM_STEP = 0.25;                    // a live figure is re-read four times a second at most
const CAR_SHARE = [0.70, 0.23, 0.07];
const CAR_TILES = [
  { label: 'brakes', sub: '', col: 's2', icon: 'brake' },
  { label: 'tyres, road', sub: '', col: 's1', icon: 'tyre' },
  { label: 'sound', sub: '', col: 's7', icon: 'sound' },
  { label: 'carried', sub: '', col: 's3', icon: 'carry' },
];

// The stopping point is reachable only where a real brake could put it: a = v^2/2d
// between v/3.5 and 8 m/s^2 (0.07 g to 0.82 g). The drag and the slider share it.
const stopLo = (v) => (v * v) / 16;
const stopHi = (v) => 1.75 * v;

// ---------------------------------------------------------------- the frames
const STAGE_CYCLIST = 0, STAGE_CAR = 1, STAGE_ASK = 2;
const EXPLAIN = [[{ idx: STAGE_CYCLIST, dwellMs: null }], [{ idx: STAGE_CAR, dwellMs: null }]];
const ASK = [[{ idx: STAGE_ASK, dwellMs: null }]];

// Beat 0, beat 1, and the beat-less predict mount.
const ROAD_Y = 384, ROAD_X0 = 206, ROAD_X1 = 474;
const SKY_Y = 92, HORIZON_Y = 330, C_HORIZON_Y = 150;
const BIKE_X = 340, WHEEL_R = 25;
const SCROLL_PX = 9;                      // px of road per (m/s * s)
const DASH = 34, POST_SP = 132;

// Beat 1's two panels inside the hero.
const C_ROAD_Y = C_HORIZON_Y, C_ROAD_H = 32;
const CAR_X = 252;
const GX0 = 232, GX1 = 470, GY0 = 250, GY1 = 402;
const CHIP_Y = 216;

const L = ZONES.left, R = ZONES.right, HERO = ZONES.hero;
const TILE_Y0 = 112;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function kmh(n) { return Math.round(n); }

// pill's default ink is --sim-bg-deep, which is a LIGHT colour in the light
// theme, so every tinted chip in this scene asks for its own ink off its own
// fill. The threshold is on RELATIVE luminance, so it sits near a third, not at
// half: a tinted series colour reads mid-tone at luma 0.2-0.3 and takes a dark
// ink. Same rule as the bundle's amber-text fix.
function inkOn(bg) { return luma(bg) > 0.35 ? darken(bg, 0.82) : lighten(bg, 0.7); }
function chip(item, bg) { return { ...item, bg, ink: inkOn(bg) }; }
function mute(c, t = 0.3) { return mix(c.label, c.bgSurface, t); }

function label(ctx, c, str, x, y, px, col, o = {}) {
  ctx.font = font(c, o.weight ?? 700, px, o.display);
  ctx.fillStyle = col;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'baseline';
  ctx.fillText(String(str), x, y);
}

// ---------------------------------------------------------------- the icons
function iconMotion(ctx, c, x, y, r, col, t, hot) {
  const bx = x + r * 0.6, by = y + r * 0.52;
  ctx.lineCap = 'round';
  ctx.strokeStyle = alpha(col, hot ? 0.95 : 0.4);
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 2; i += 1) {
    const len = r * (0.45 + 0.3 * i) * (0.55 + 0.45 * hot);
    const yy = by - 5 + i * 10;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.62 - len, yy);
    ctx.lineTo(bx - r * 0.62, yy);
    ctx.stroke();
  }
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(bx + (hot ? Math.sin(t * 9) * r * 0.08 : 0), by, r * 0.33, 0, TAU);
  ctx.fill();
}
function iconHeat(ctx, c, x, y, r, col, t, hot) {
  const base = y + r * 0.9;
  ctx.fillStyle = alpha(col, 0.45);
  rr(ctx, x + r * 0.22, base - 4, r * 0.6, 5, 2.5);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const wx = x + r * 0.32 + i * r * 0.26;
    const amp = (hot ? r * 0.15 : r * 0.09) * (hot ? 1 + 0.5 * Math.sin(t * 6 + i * 1.7) : 1);
    ctx.beginPath();
    ctx.moveTo(wx, base - 7);
    ctx.bezierCurveTo(wx + amp, base - 7 - r * 0.3, wx - amp, base - 7 - r * 0.52, wx, base - 7 - r * 0.72);
    ctx.stroke();
  }
}
function iconSound(ctx, c, x, y, r, col, t, hot) {
  const sx = x + r * 0.26, sy = y + r * 0.52;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(sx, sy, r * 0.15, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = alpha(col, hot ? 0.95 : 0.45);
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 1; i <= 3; i += 1) {
    const rad = r * (0.28 + i * 0.21) * (hot ? 1 + 0.1 * Math.sin(t * 7 + i) : 1);
    ctx.beginPath();
    ctx.arc(sx, sy, rad, -0.95, 0.95);
    ctx.stroke();
  }
}
function iconBrake(ctx, c, x, y, r, col, t, hot) {
  const cx = x + r * 0.5, cy = y + r * 0.62;
  ctx.fillStyle = alpha(col, hot ? 0.95 : 0.5);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.34, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = alpha(c.bgDeep, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.14, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = hot ? c.warning : mix(col, c.bgSurface, 0.35);
  rr(ctx, cx - r * 0.16, cy - r * 0.62, r * 0.32, r * 0.34, 3);
  ctx.fill();
}
function iconTyre(ctx, c, x, y, r, col, t, hot) {
  const cy = y + r * 0.72;
  ctx.fillStyle = alpha(col, hot ? 0.95 : 0.5);
  rr(ctx, x + r * 0.08, cy + r * 0.12, r * 0.84, 4, 2);
  ctx.fill();
  ctx.strokeStyle = alpha(col, hot ? 0.95 : 0.5);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + r * 0.5, cy - r * 0.14, r * 0.3, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = c.warning;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const wx = x + r * 0.26 + i * r * 0.24;
    const h = r * (hot ? 0.3 + 0.1 * Math.sin(t * 6 + i) : 0.16);
    ctx.beginPath();
    ctx.moveTo(wx, cy + r * 0.06);
    ctx.lineTo(wx + (i - 1) * 2, cy + r * 0.06 - h);
    ctx.stroke();
  }
}
const ICONS = { motion: iconMotion, carry: iconMotion, heat: iconHeat, sound: iconSound, brake: iconBrake, tyre: iconTyre };

export class CyclistEnergyScene extends SimScene {
  static BEAT_MAPS = { 2: EXPLAIN, 0: ASK };
  static BEAT_STEP_MAP = EXPLAIN;
  static NOTE_STAGE = 0;
  static ARIA_LABEL = 'A bicycle on a flat road: an effort dial sets how hard the rider pedals, and three meters fill at once - motion, heat and sound. The same panel then runs a braking car, drawing its speed against time with the flat reacting time first.';
  static CONTROLS = [
    { type: 'slider', id: 'effort', label: 'Rider effort', min: EFFORT_MIN, max: EFFORT_MAX, step: EFFORT_STEP, value: EFFORT_START, suffix: ' %' },
    { type: 'button', id: 'pedal', label: 'Pedal' },
    { type: 'slider', id: 'kmh', label: 'Starting speed', min: KMH_MIN, max: KMH_MAX, step: KMH_STEP, value: KMH_START, suffix: ' km/h' },
    { type: 'slider', id: 'stop', label: 'Stopping distance', min: 15, max: 60, step: 1, value: 23, suffix: ' m' },
    { type: 'button', id: 'brake', label: 'Brake' },
  ];

  constructor(container, config) {
    super(container, config);
    this._effort = EFFORT_START;
    this._kmh = KMH_START;
    this._stop = 23;
    this._ride = null;
    this._run = null;
    this._post = 0;
    this._m = [0, 0, 0, 0];
    this._seenSound = false;
    this._hint = true;
    this._wheel = 0;
    this._scroll = 0;
    this._numT = 0;
    this._posted = [0, 0, 0, 0];
    this._curveEnd = 0;
    this._carry = 0;
    this._carryT = 0;
    this._hit = { ride: null, car: null };
    this._clampStop();
  }

  // ---- the model ----------------------------------------------------------
  _v0() { return this._kmh / 3.6; }
  _stopM() { return this._stop; }
  _aN() { const v = this._v0(); return (v * v) / (2 * this._stopM()); }
  _tBrake() { return (2 * this._stopM()) / this._v0(); }
  _tReal() { return T_REACT + this._tBrake(); }
  _ke() { return 0.5 * CAR_KG * this._v0() * this._v0(); }
  _clampStop() {
    const v = this._v0();
    this._stop = clamp(Math.round(this._stop), stopLo(v), stopHi(v));
  }
  // The speed at this instant: nothing on the ask mount, and nothing between
  // runs - a burst ends on a still frame, because the panel is a measurement.
  _vNow() {
    if (this.stage === STAGE_CYCLIST && this._ride) return speedOf(this._effort) * Math.min(1, this._ride.t / RIDE_S);
    if (this.stage === STAGE_CAR && this._run) {
      const tr = (this._run.t / T_ANIM) * this._tReal();
      return tr <= T_REACT ? this._v0() : Math.max(0, this._v0() - this._aN() * (tr - T_REACT));
    }
    return 0;
  }
  _tRealNow() { return this._run ? (this._run.t / T_ANIM) * this._tReal() : 0; }

  // ---- stages -------------------------------------------------------------
  enter(stage) {
    this._ride = null;
    this._run = null;
    this._post = 0;
    this._posted = [0, 0, 0, 0];
    this._wheel = 0;
    this._scroll = 0;
    this._hint = true;
    this._seenSound = false;
    this._curveEnd = 0;
    this._carry = stage === STAGE_CAR ? this._ke() : 0;
    this._carryT = 0;
    // The car is carrying everything it has before it brakes: that is the state
    // a mount arrives at, so a learner who never presses Brake still reads it.
    this._m = stage === STAGE_CAR ? [0, 0, 0, 1] : [0, 0, 0, 0];
    if (stage === STAGE_CYCLIST) this.after(0.55, () => this._startRide());
    this.requestUiUpdate?.();
  }

  _startRide() {
    if (this.stage !== STAGE_CYCLIST) return;
    this._run = null;
    this._post = 0;
    this._ride = { t: 0, stage: this.stage, posted: false };
    this._hint = false;
    this._numT = 0;
    this._posted = [0, 0, 0, 0];
    for (let i = 0; i < 3; i += 1) this._m[i] = 0;
    this.animateFor((RIDE_S + TAIL_S) * 1000);
    this.requestUiUpdate?.();
  }

  _startRun() {
    if (this.stage !== STAGE_CAR) return;
    this._ride = null;
    this._curveEnd = 0;
    this._run = { t: 0, stage: this.stage };
    this._post = 0;
    this._numT = 0;
    this._posted = [0, 0, 0, 0];
    this._m = [0, 0, 0, 1];
    this.animateFor((T_ANIM + POST_S) * 1000);
    this.requestUiUpdate?.();
  }

  // ---- frame --------------------------------------------------------------
  update(d) {
    const v = this._vNow();
    this._scroll += v * d * SCROLL_PX;
    this._wheel = (this._wheel + (v / WHEEL_R) * d) % TAU;
    this._numT += d;
    if (this._ride) {
      const r = this._ride;
      r.t += d;
      const p = Math.min(1, r.t / RIDE_S);
      for (let i = 0; i < 3; i += 1) this._m[i] = CY_SHARE[i] * p;
      if (p >= 1 && !r.posted) {
        r.posted = true;
        // The concept is found when the third tile is full, not when Pedal is
        // pressed: the burst is one run, and the sound is the last of the three.
        if (!this._seenSound) {
          this._seenSound = true;
          // Over the sound tile's own row, and no higher: the burst is a ring,
          // so a centre far above the tile fires it across the heat figure too.
          this.celebrate(L.x + L.w / 2, TILE_Y0 + 2 * 96 + 46, 18);
        }
      }
      if (r.t >= RIDE_S + TAIL_S) this._ride = null;
    } else if (this._run) {
      const r = this._run;
      r.t += d;
      if (r.t >= T_ANIM) {
        this._run = null;
        // The curve LATCHES at the stop. Without this the graph emptied itself
        // the instant the run ended - the plateau and the descent, the whole
        // point of beat 1, vanished a frame after the learner watched them.
        this._curveEnd = this._tReal();
        this._post = 1e-4;
        this.celebrate(CAR_X, C_ROAD_Y - 40, 18);
      }
    } else if (this._post > 0) {
      this._post = Math.min(1, this._post + d / POST_S);
      // The four tiles ARE the kinetic energy: what has been paid out so far, and
      // what is still carried. They add to 1 at every instant, so at the end the
      // car is carrying nothing because its speed is nothing.
      for (let i = 0; i < 3; i += 1) this._m[i] = CAR_SHARE[i] * this._post;
      this._m[3] = 1 - this._post;
    }
    // What the top chip claims the car is carrying has to agree with the fourth
    // tile, so it is read off the same _m[3] and latched at the same rate: a chip
    // frozen at the starting KE beside a tile reading 0.0 kJ is a contradiction.
    this._carryT += d;
    if (this.stage === STAGE_CAR && (this._carryT >= NUM_STEP || (this._post >= 1 && !this._run))) {
      this._carryT = 0;
      this._carry = this._ke() * this._m[3];
    }
  }

  busy() { return !!this._ride || !!this._run || (this._post > 0 && this._post < 1); }

  // ---- controls -----------------------------------------------------------
  isControlHidden(id) {
    if (this.stage === STAGE_ASK) return true;
    if (this.stage === STAGE_CAR) return id === 'effort' || id === 'pedal';
    return id === 'kmh' || id === 'stop' || id === 'brake';
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'effort') {
      this._effort = Number(v);
      this._startRide();
    } else if (id === 'pedal') this._startRide();
    else if (id === 'kmh') {
      this._kmh = Number(v);
      this._clampStop();
      this._startRun();
    } else if (id === 'stop') {
      this._stop = Number(v);
      this._clampStop();
      this._startRun();
    } else if (id === 'brake') this._startRun();
    this.requestUiUpdate?.();
  }

  getControlValue(id) {
    if (id === 'effort') return this._effort;
    if (id === 'kmh') return this._kmh;
    if (id === 'stop') return this._stopM();
    return undefined;
  }

  pointerDown(p) {
    const b = this._hit.ride;
    if (b && p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) { this._startRide(); return; }
    const c = this._hit.car;
    if (c && p.x >= c.x0 && p.x <= c.x1 && p.y >= c.y0 && p.y <= c.y1) { this._startRun(); }
  }

  // ---- the note -----------------------------------------------------------
  noteRows() {
    if (this.stage === STAGE_ASK) return [];
    if (this.stage === STAGE_CAR) return [{ text: 'a 1200 kg car, a 1.5 s reaction, and the whole stop played in 4 s' }];
    return [{ text: 'one burst is 2.6 s; the 65 / 27 / 8 split is drawn to be seen, not measured' }];
  }

  // ---- draw ---------------------------------------------------------------
  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this._hit = { ride: null, car: null };
    // The predict mount stops here: no tiles, no figures, nothing that could hint
    // that there are three channels.
    if (this.stage === STAGE_ASK) { this._drawAsk(ctx, c); return; }
    if (this.stage === STAGE_CAR) this._drawCar(ctx, c);
    else this._drawRide(ctx, c);
    this._drawTiles(ctx, c);
    this._drawNumbers(ctx, c);
    if (this.stage === STAGE_CAR) this._drawGraph(ctx, c);
  }

  // -- the predict mount: the situation, and nothing else
  _drawAsk(ctx, c) {
    drawCard(ctx, c, HERO.x, HERO.y, HERO.w, HERO.h);
    this._horizon(ctx, c, ROAD_X0, ROAD_X1, HORIZON_Y, SKY_Y, this._scroll, 'trees');
    this._road(ctx, c, ROAD_X0, ROAD_X1, ROAD_Y, ROAD_Y + 56, this._scroll);
    this._bike(ctx, c, BIKE_X, ROAD_Y, 0, 0, false);
    this._hit.ride = { x0: BIKE_X - 90, x1: BIKE_X + 90, y0: ROAD_Y - 110, y1: ROAD_Y + 10 };
    chipRow(ctx, c, [chip({ text: 'flat road' }, mix(c.accent, c.bgSurface, 0.25))], ZONES.top.x, 40, { align: 'left' });
    chipRow(ctx, c, [chip({ text: 'no height to gain' }, mix(c.label, c.bgSurface, 0.45))], ZONES.top.x + ZONES.top.w, 40, { align: 'right' });
    // The card that is not here yet.
    drawCard(ctx, c, L.x, L.y, L.w, L.h, 0.45);
    ctx.save();
    ctx.globalAlpha = 0.5;
    pill(ctx, c, 'the question', L.x + 12, L.y + 22, { bg: c.label, ink: inkOn(c.label), size: 14, align: 'left' });
    ctx.restore();
    label(ctx, c, '?', L.x + L.w / 2, L.y + 128, 74, mute(c, 0.2), { align: 'center', display: true });
    // Two short lines, not one long one: at 14 px the sentence is ~167 px wide
    // and a 170 px card cannot hold it, so it ran off the left of the canvas.
    label(ctx, c, 'your muscles', L.x + L.w / 2, L.y + 186, 14, mute(c, 0.3), { align: 'center' });
    label(ctx, c, 'supply all of it', L.x + L.w / 2, L.y + 206, 14, mute(c, 0.3), { align: 'center' });
    this._numbersCard(ctx, c, 'the rider', [
      { label: 'flat road', value: 'yes' },
      { label: 'to climb', value: 'nothing' },
    ]);
  }

  // -- beat 0: the rider
  _drawRide(ctx, c) {
    drawCard(ctx, c, HERO.x, HERO.y, HERO.w, HERO.h);
    this._horizon(ctx, c, ROAD_X0, ROAD_X1, HORIZON_Y, SKY_Y, this._scroll, 'trees');
    this._road(ctx, c, ROAD_X0, ROAD_X1, ROAD_Y, ROAD_Y + 56, this._scroll);
    const v = this._vNow();
    this._bike(ctx, c, BIKE_X, ROAD_Y, this._wheel, v, !!this._ride);
    this._hit.ride = { x0: BIKE_X - 90, x1: BIKE_X + 90, y0: ROAD_Y - 110, y1: ROAD_Y + 10 };
    chipRow(ctx, c, [chip({ text: 'flat road' }, mix(c.accent, c.bgSurface, 0.25))], ZONES.top.x, 40, { align: 'left' });
    chipRow(ctx, c, [chip({ text: 'the smallest share' }, c.warning)], ZONES.top.x + ZONES.top.w, 40, { align: 'right' });
    if (this._hint) {
      pill(ctx, c, 'turn effort, or tap the bike', BIKE_X, ROAD_Y - 128, { bg: c.accent, ink: inkOn(c.accent), size: 14, alpha: 0.75 + 0.25 * Math.sin(this.clock * 4) });
    }
    chipRow(ctx, c, [chip({ text: 'none of the three comes back', size: 14 }, mix(c.good, c.bgSurface, 0.3))], HERO.x + HERO.w / 2, 478, { align: 'center' });
    const e = this._effort;
    const h = this._numbersCard(ctx, c, 'the rider', [
      { label: 'effort', value: `${e} %`, meter: (e - EFFORT_MIN) / (EFFORT_MAX - EFFORT_MIN), col: c.accent },
      { label: 'gives the bicycle', value: `${Math.round(powerOf(e))} W` },
      { label: 'reaches', value: `${kmh(speedOf(e) * 3.6)} km/h` },
    ]);
    this._shareStrip(ctx, c, CY_SHARE, CY_TILES, R.y + h + 16);
  }

  // Everything behind the road, on the same scroll as the road itself (the clouds
  // at a third of it, which is the only parallax there is). It fills the upper
  // half of the hero and gives the motion something to move against.
  _horizon(ctx, c, x0, x1, horizon, sky, scroll, kind) {
    const h = horizon - sky;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, sky, x1 - x0, h);
    ctx.clip();
    ctx.fillStyle = mix(c.bgSurface, c.water, 0.16);
    ctx.fillRect(x0, sky, x1 - x0, h);
    ctx.fillStyle = alpha(c.s2, kind === 'trees' ? 0.85 : 0.6);
    ctx.beginPath();
    ctx.arc(x0 + 62, sky + 26, 15, 0, TAU);
    ctx.fill();
    // clouds, a third of the scroll
    const co = ((-scroll / 3) % 150 + 150) % 150;
    ctx.fillStyle = alpha(lighten(c.label, 0.4), 0.32);
    for (let x = x0 - 150; x < x1 + 150; x += 150) {
      const cx = x + co;
      ellipse(ctx, cx, sky + 30, 22, 8);
      ctx.fill();
      ellipse(ctx, cx + 16, sky + 26, 14, 7);
      ctx.fill();
    }
    // the skyline or the treeline, on the road's own scroll
    const step = kind === 'trees' ? 46 : 62;
    const off = ((-scroll % step) + step) % step;
    if (kind === 'trees') {
      ctx.fillStyle = mix(c.good, c.bgSurface, 0.42);
      ctx.fillRect(x0, horizon - 6, x1 - x0, 6);
      for (let x = x0 - step; x < x1 + step; x += step) {
        const bx = x + off + 14;
        ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.35);
        ctx.fillRect(bx, horizon - 22, 5, 22);
        ctx.fillStyle = mix(c.good, c.bgSurface, 0.55);
        ctx.beginPath();
        ctx.arc(bx + 2.5, horizon - 32, 15, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx - 8, horizon - 25, 11, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx + 13, horizon - 26, 10, 0, TAU);
        ctx.fill();
      }
    } else {
      for (let x = x0 - step; x < x1 + step; x += step) {
        const bx = x + off;
        const bh = 26 + ((x / step) % 3) * 11;
        ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.42);
        ctx.fillRect(bx, horizon - bh, 34, bh);
        ctx.fillStyle = alpha(c.s2, 0.5);
        for (let k = 0; k < 3; k += 1) {
          ctx.fillRect(bx + 6 + (k % 2) * 14, horizon - bh + 8 + k * 9, 7, 5);
        }
      }
      ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.3);
      ctx.fillRect(x0, horizon - 2, x1 - x0, 4);
    }
    ctx.restore();
  }

  _road(ctx, c, x0, x1, yTop, yBot, scroll) {
    rr(ctx, x0, yTop, x1 - x0, yBot - yTop, 10);
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.12);
    ctx.fill();
    rr(ctx, x0, yTop, x1 - x0, 5, 2.5);
    ctx.fillStyle = alpha(lighten(c.label, 0.25), 0.55);
    ctx.fill();
    // Posts above the kerb, at the same scroll as the dashes: the only evidence
    // of how fast this is.
    const off = ((-scroll % POST_SP) + POST_SP) % POST_SP;
    ctx.fillStyle = alpha(c.label, 0.3);
    for (let x = x0 - POST_SP; x < x1 + POST_SP; x += POST_SP) {
      rr(ctx, x + off, yTop - 17, 5, 17, 2);
      ctx.fill();
    }
    const dOff = ((-scroll % DASH) + DASH) % DASH;
    ctx.fillStyle = alpha(c.label, 0.42);
    const my = yTop + (yBot - yTop) * 0.62;
    for (let x = x0 - DASH; x < x1 + DASH; x += DASH) {
      rr(ctx, x + dOff, my, 15, 4, 2);
      ctx.fill();
    }
  }

  _bike(ctx, c, x, y, wheel, v, moving) {
    const frame = c.s1, skin = c.s4, ink = c.label;
    const wxA = x - 54, wxB = x + 54;
    drawShadow(ctx, c, x, y + 7, 96, 8, 0.5);
    // wheels
    for (const wx of [wxA, wxB]) {
      const wr = WHEEL_R;
      ctx.strokeStyle = mix(c.label, c.bgSurface, 0.45);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(wx, y - wr, wr, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = alpha(ink, 0.32);
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 6; i += 1) {
        const a = wheel + (i * TAU) / 6;
        ctx.beginPath();
        ctx.moveTo(wx, y - wr);
        ctx.lineTo(wx + Math.cos(a) * (wr - 4), y - wr + Math.sin(a) * (wr - 4));
        ctx.stroke();
      }
      ctx.fillStyle = frame;
      ctx.beginPath();
      ctx.arc(wx, y - wr, 4.5, 0, TAU);
      ctx.fill();
    }
    const bbY = y - 30;                       // bottom bracket
    const seatX = wxA + 14, seatY = y - 78;
    const barX = wxB - 2, barY = y - 74;
    ctx.strokeStyle = frame;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wxA, y - WHEEL_R);
    ctx.lineTo(seatX, seatY);
    ctx.lineTo(bbX(x), bbY);
    ctx.lineTo(wxA, y - WHEEL_R);
    ctx.moveTo(bbX(x), bbY);
    ctx.lineTo(barX, barY);
    ctx.lineTo(wxB, y - WHEEL_R);
    ctx.stroke();
    // saddle and bar
    ctx.strokeStyle = darken(frame, 0.35);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(seatX - 10, seatY - 2);
    ctx.lineTo(seatX + 8, seatY - 2);
    ctx.moveTo(barX, barY);
    ctx.lineTo(barX - 6, barY - 12);
    ctx.moveTo(barX, barY);
    ctx.lineTo(barX + 10, barY - 6);
    ctx.stroke();
    // the crank, and the leg that turns it
    const crank = wheel / 2.6;
    const px = bbX(x) + Math.sin(crank) * 13;
    const py = bbY + Math.cos(crank) * 13;
    const hipX = seatX + 2, hipY = seatY - 16;
    ctx.strokeStyle = darken(skin, 0.35);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.quadraticCurveTo((hipX + px) / 2 - 12, (hipY + py) / 2 - 16, px, py);
    ctx.stroke();
    ctx.strokeStyle = frame;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bbX(x), bbY, 11, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bbX(x), bbY);
    ctx.lineTo(px, py);
    ctx.stroke();
    // torso, arm, head
    const shX = hipX + 30, shY = hipY - 6;
    ctx.strokeStyle = skin;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shX, shY);
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(shX, shY + 4);
    ctx.quadraticCurveTo((shX + barX) / 2 + 10, (shY + barY) / 2 + 16, barX - 4, barY + 2);
    ctx.stroke();
    const headX = shX + 14, headY = shY - 16;
    ctx.fillStyle = lighten(skin, 0.2);
    ctx.beginPath();
    ctx.arc(headX, headY, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c.bgDeep;
    ctx.beginPath();
    ctx.arc(headX + 5, headY - 2, 1.9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = c.bgDeep;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(headX + 4, headY + 1, 5, 0.35, 1.5);
    ctx.stroke();
    if (moving && v > 0.5) {
      ctx.strokeStyle = alpha(c.s3, 0.8);
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const len = 14 + v * 3.4 + i * 9;
        const yy = y - 96 + i * 13;
        ctx.beginPath();
        ctx.moveTo(x - 80 - len, yy);
        ctx.lineTo(x - 80, yy);
        ctx.stroke();
      }
    }
  }

  // -- beat 1: the car, its graph, and where the joules went
  _drawCar(ctx, c) {
    drawCard(ctx, c, HERO.x, HERO.y, HERO.w, HERO.h);
    this._horizon(ctx, c, ROAD_X0, ROAD_X1, C_HORIZON_Y, SKY_Y, this._scroll, 'city');
    this._road(ctx, c, ROAD_X0, ROAD_X1, C_ROAD_Y, C_ROAD_Y + C_ROAD_H, this._scroll);
    const v = this._vNow();
    const braking = this._run && this._tRealNow() > T_REACT;
    this._car(ctx, c, CAR_X, C_ROAD_Y, this._wheel, braking, this._post);
    this._hit.car = { x0: CAR_X - 42, x1: CAR_X + 42, y0: C_ROAD_Y - 52, y1: C_ROAD_Y + 6 };
    chipRow(ctx, c, [chip({ text: 'the same scene, much larger', size: 14 }, mix(c.accent, c.bgSurface, 0.25))], ZONES.top.x, 40, { align: 'left' });
    chipRow(ctx, c, [chip({ text: `carrying ${(this._carry / 1000).toFixed(1)} kJ`, size: 14 }, c.s3)], ZONES.top.x + ZONES.top.w, 40, { align: 'right' });
    const v0 = this._v0();
    const h = this._numbersCard(ctx, c, 'the car', [
      { label: 'while it reacts', value: `${(v0 * T_REACT).toFixed(1)} m` },
      { label: 'then stops in', value: `${this._stopM().toFixed(1)} m` },
      { label: 'braking', value: `${this._aN().toFixed(1)} m/s^2`, col: c.warning },
    ]);
    this._shareStrip(ctx, c, CAR_SHARE, CAR_TILES, R.y + h + 16);
  }

  _car(ctx, c, x, y, wheel, braking, post) {
    const body = c.s3, glass = mix(c.water, c.bgSurface, 0.35);
    drawShadow(ctx, c, x, y + 6, 44, 6, 0.5);
    ctx.fillStyle = body;
    rr(ctx, x - 32, y - 24, 64, 18, 6);
    ctx.fill();
    ctx.fillStyle = mix(body, c.bgSurface, 0.35);
    rr(ctx, x - 22, y - 38, 40, 16, 7);
    ctx.fill();
    ctx.fillStyle = glass;
    rr(ctx, x - 18, y - 34, 32, 11, 4);
    ctx.fill();
    for (const wx of [x - 19, x + 19]) {
      ctx.fillStyle = mix(c.label, c.bgSurface, 0.35);
      ctx.beginPath();
      ctx.arc(wx, y, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = mix(c.label, c.bgDeep, 0.35);
      ctx.beginPath();
      ctx.arc(wx, y, 3.4, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(wx, y);
      ctx.rotate(wheel);
      ctx.strokeStyle = alpha(c.label, 0.5);
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i += 1) {
        const a = (i * TAU) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        ctx.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.fillStyle = braking ? c.warning : mix(c.label, c.bgSurface, 0.4);
    rr(ctx, x - 32, y - 20, 5, 7, 2);
    ctx.fill();
    // heat off the brakes and the tyres, once the posting has started
    if (post > 0) {
      const n = 4;
      ctx.strokeStyle = alpha(c.warning, 0.5 + 0.4 * Math.min(1, post));
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i += 1) {
        const h = 8 + 22 * Math.min(1, post) * (0.7 + 0.3 * Math.sin(this.clock * 6 + i * 1.6));
        const sx = x - 19 + i * 12;
        ctx.beginPath();
        ctx.moveTo(sx, y - 27);
        ctx.quadraticCurveTo(sx + 4, y - 27 - h * 0.6, sx, y - 27 - h);
        ctx.stroke();
      }
    }
  }

  _drawGraph(ctx, c) {
    const v0 = this._v0(), tR = this._tReal();
    const xOf = (t) => GX0 + ((GX1 - GX0) * t) / tR;
    const yOf = (v) => GY1 - ((GY1 - GY0) * v) / v0;
    const half = Math.round((v0 * 3.6) / 2 / 5) * 5;
    const top = Math.round((v0 * 3.6) / 5) * 5;
    ctx.strokeStyle = alpha(c.stroke, 0.35);
    ctx.lineWidth = 1.4;
    for (const s of [0, half, top]) {
      const y = yOf(s / 3.6);
      ctx.beginPath();
      ctx.moveTo(GX0, y);
      ctx.lineTo(GX1, y);
      ctx.stroke();
      label(ctx, c, s, GX0 - 8, y + 5, 14, mute(c, 0.3), { align: 'right' });
    }
    label(ctx, c, 'km/h', GX0 - 4, GY0 - 6, 14, mute(c, 0.3), { align: 'right' });
    ctx.strokeStyle = alpha(c.stroke, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0 - 4);
    ctx.lineTo(GX0, GY1);
    ctx.lineTo(GX1, GY1);
    ctx.stroke();
    const secs = Math.min(6, Math.ceil(tR));
    for (let s = 0; s <= secs; s += 1) {
      if (s > 0 && s / tR > 1) break;
      const x = xOf(s);
      ctx.strokeStyle = alpha(c.stroke, 0.55);
      ctx.beginPath();
      ctx.moveTo(x, GY1);
      ctx.lineTo(x, GY1 + 5);
      ctx.stroke();
      label(ctx, c, s, x, GY1 + 19, 14, mute(c, 0.3), { align: 'center' });
    }
    label(ctx, c, 'seconds', (GX0 + GX1) / 2, GY1 + 36, 14, mute(c, 0.3), { align: 'center' });

    // The reacting window, which is a dial setting and so is on the frame before
    // the run: a band and the line that ends it.
    const xr = xOf(T_REACT);
    ctx.fillStyle = alpha(c.warning, 0.1);
    ctx.fillRect(GX0, GY0, xr - GX0, GY1 - GY0);
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = alpha(c.warning, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xr, C_ROAD_Y - 4);
    ctx.lineTo(xr, GY1);
    ctx.stroke();
    ctx.restore();

    const tNow = this._tRealNow();
    // The drawn curve runs to wherever the run has got to, and stays at the stop
    // afterwards. This is the beat's whole claim - the plateau comes FIRST - so a
    // graph that emptied itself at the end of the run was erasing the evidence.
    const tDraw = Math.min(this._run ? tNow : (this._curveEnd || tNow), tR);
    if (tDraw > 0.02) {
      ctx.beginPath();
      ctx.moveTo(GX0, GY1);
      const steps = 46;
      for (let i = 0; i <= steps; i += 1) {
        const t = (tDraw * i) / steps;
        const v = t <= T_REACT ? v0 : Math.max(0, v0 - this._aN() * (t - T_REACT));
        ctx.lineTo(xOf(t), yOf(v));
      }
      ctx.lineTo(xOf(tDraw), GY1);
      ctx.closePath();
      ctx.fillStyle = alpha(c.s3, 0.16);
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const t = (tDraw * i) / steps;
        const v = t <= T_REACT ? v0 : Math.max(0, v0 - this._aN() * (t - T_REACT));
        if (i === 0) ctx.moveTo(xOf(t), yOf(v));
        else ctx.lineTo(xOf(t), yOf(v));
      }
      ctx.strokeStyle = c.s3;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      // The head rides the curve only while the run is live: parked at the stop
      // it would sit on the axis corner, where it says nothing.
      if (this._run) {
        const vHead = tDraw <= T_REACT ? v0 : Math.max(0, v0 - this._aN() * (tDraw - T_REACT));
        ctx.fillStyle = c.s3;
        ctx.beginPath();
        ctx.arc(xOf(tDraw), yOf(vHead), 6, 0, TAU);
        ctx.fill();
      }
    }
    if (this._post > 0) {
      drawBadge(ctx, c, 'check', xOf(tR) - 13, GY0 + 16, 11, c.good);
      label(ctx, c, 'stopped', xOf(tR) - 30, GY0 + 21, 14, c.label, { align: 'right' });
    } else if (this._run) {
      const braking = tNow > T_REACT;
      pill(ctx, c, braking ? 'braking now' : 'not slowing at all', (braking ? xr + GX1 : GX0 + xr) / 2, CHIP_Y, {
        bg: braking ? c.warning : c.accent, ink: inkOn(braking ? c.warning : c.accent), size: 14,
      });
    } else {
      pill(ctx, c, `reacting ${T_REACT.toFixed(1)} s`, (GX0 + xr) / 2, CHIP_Y, { bg: c.accent, ink: inkOn(c.accent), size: 14, alpha: 0.85 });
    }
    chipRow(ctx, c, [chip({ text: 'nothing stored', size: 14 }, mix(c.good, c.bgSurface, 0.3)), chip({ text: 'none of it came back', size: 14 }, mix(c.good, c.bgSurface, 0.3))], HERO.x + HERO.w / 2, 478, { align: 'center' });
  }

  // -- the shared left card: three channels, or four
  _tiles() { return this.stage === STAGE_CAR ? CAR_TILES : CY_TILES; }

  _drawTiles(ctx, c) {
    const tiles = this._tiles();
    const n = tiles.length;
    const tileH = n === 4 ? 72 : 96;
    const iconR = n === 4 ? 13 : 16;
    drawCard(ctx, c, L.x, L.y, L.w, L.h, 1, { accent: c.accent });
    pill(ctx, c, 'where it went', L.x + 12, L.y + 22, { bg: c.accent, ink: inkOn(c.accent), size: 14, align: 'left' });
    tiles.forEach((t, i) => {
      const ty = TILE_Y0 + i * tileH;
      const hot = this._m[i] > 0.02;
      const col = c[t.col];
      const fn = ICONS[t.icon];
      fn(ctx, c, L.x + 8, ty + 4, iconR, col, this.clock, hot);
      label(ctx, c, t.label, L.x + 40, ty + (n === 4 ? 20 : 24), n === 4 ? 14 : 15, c.label, { weight: 800 });
      drawMeter(ctx, c, L.x + 10, ty + (n === 4 ? 32 : 40), L.w - 20, 11, this._m[i], {
        col,
        target: this._targetShare(i),
        targetCol: mix(c.label, c.bgSurface, 0.3),
      });
      // The four-tile layout has no sub row: a 170 px card cannot hold the widest
      // name and the widest figure on one line, so the name goes on the icon row and
      // the figure on its own row under the meter.
      if (n !== 4) label(ctx, c, t.sub, L.x + 10, ty + 74, 14, mute(c, 0.3));
      if (this.stage === STAGE_CYCLIST && t.icon === 'sound' && !this._seenSound) {
        drawBadge(ctx, c, 'star', L.x + L.w - 16, ty + (n === 4 ? 20 : 24), 9, c.warning);
      }
    });
  }

  _targetShare(i) {
    if (this.stage === STAGE_CAR) return i === 3 ? 1 : CAR_SHARE[i];
    return CY_SHARE[i];
  }

  // -- the joules. A number redrawn every frame reads as overlapping text, so a
  // tile holds its figure: the cyclist's tile shows the target dimmed while the
  // burst fills and bright at the end, and the car's four figures are re-read at
  // most four times a second while the posting runs.
  _drawNumbers(ctx, c) {
    const car = this.stage === STAGE_CAR;
    const n = car ? 4 : 3;
    const tileH = car ? 72 : 96;
    const ke = this._ke();
    const eIn = powerOf(this._effort) * RIDE_S;
    const posting = this._post > 0;
    const settle = car ? (posting ? this._post >= 1 : true) : (!this._ride || this._ride.t >= RIDE_S);
    for (let i = 0; i < n; i += 1) {
      const ty = TILE_Y0 + i * tileH;
      const y0 = ty + (car ? 20 : 24);
      if (car) {
        // Nothing moves until the car has stopped: until then the fourth tile
        // holds the whole sum and the other three read nothing at all.
        if (!posting) this._posted[i] = i === 3 ? ke : 0;
        else if (this._numT >= NUM_STEP || this._post >= 1) this._posted[i] = ke * this._m[i];
      } else {
        this._posted[i] = eIn * CY_SHARE[i];
      }
      const j = this._posted[i];
      const str = car ? `${(j / 1000).toFixed(1)} kJ` : `${Math.round(j)} J`;
      // On the four-tile layout the name above is short enough to leave the sub row
      // free, so the figure sits there, right-aligned, and never touches the name.
      const yy = car ? ty + 58 : y0;
      label(ctx, c, str, car ? L.x + 10 : L.x + L.w - 10, yy, car ? 14 : 16, settle ? c[this._tiles()[i].col] : mute(c, 0.45), { align: car ? 'left' : 'right', weight: 800, display: true });
    }
  }

  // drawReadout's one-line row puts an 18 px figure against a 15 px label, and in
  // a 170 px card the two touch. These rows are two lines instead - the name small
  // above, the figure large under it - which is also how the tiles read. Returns the
  // card's height so the caller can hang the share strip off it.
  _numbersCard(ctx, c, title, rows) {
    const rowH = 44;
    const h = 46 + rows.length * rowH;
    drawCard(ctx, c, R.x, R.y, R.w, h, 1, { accent: c.accent });
    pill(ctx, c, title, R.x + 12, R.y + 22, { bg: c.accent, ink: inkOn(c.accent), size: 14, align: 'left' });
    rows.forEach((r, i) => {
      const y = R.y + 46 + i * rowH;
      label(ctx, c, r.label, R.x + 14, y + 12, 13, mute(c, 0.25));
      label(ctx, c, r.value, R.x + 14, y + 34, 17, r.col ?? c.label, { weight: 800, display: true });
      if (r.meter != null) drawMeter(ctx, c, R.x + 14, y + 38, R.w - 28, 9, r.meter, { col: c.accent });
    });
    return h;
  }

  // The shares printed as they add up: the third tile's share is the one a
  // reader can check, so it is on the frame rather than in a sentence.
  _shareStrip(ctx, c, shares, tiles, top) {
    const boxes = chipColumn(ctx, c, shares.map((s, i) => chip({
      text: `${tiles[i].label} ${Math.round(s * 100)}%`,
      size: 13,
    }, mix(c[tiles[i].col], c.bgSurface, 0.3))), R.x + 8, top, { align: 'left' });
    const last = boxes[boxes.length - 1];
    pill(ctx, c, `all three = ${Math.round(shares.reduce((a, b) => a + b, 0) * 100)}%`, R.x + 8, last.y0 + last.h + 24, { bg: mix(c.good, c.bgSurface, 0.3), ink: inkOn(mix(c.good, c.bgSurface, 0.3)), size: 13, align: 'left' });
  }
}

// The bottom bracket sits a little ahead of the wheels' midpoint.
function bbX(x) { return x + 6; }
