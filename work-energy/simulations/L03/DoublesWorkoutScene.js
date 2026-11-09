import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, drawBackdrop, drawCard, drawFace, pill, font, alpha, darken, lighten, rr,
} from 'simulations/base/kit/SimLook.js';

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the vehicle, and then the same vehicle
  [{ idx: 1, dwellMs: null }], // where the four comes from
  [{ idx: 2, dwellMs: null }], // turn the dial yourself
];

// -- the slide's own numbers ---------------------------------------------------------
const V_MIN = 5;
const V_MAX = 60; // m/s, the speed dial
const V_STEP = 1;
const V_START = 10; // the "first speed" the slide doubles

const KG_MIN = 500;
const KG_MAX = 3000; // kg, the mass dial
const KG_STEP = 50;
const KG_START = 1200; // a small hatchback

// One joule scale for both bars, so the two shapes can be compared.
const J_MAX = 250000;

// -- layout (680 x 520 design space) -------------------------------------------------
const CARD = { x: 16, y: 74, w: 648, h: 372 };
const GUT_X = 26; // the label column, left of every bar
const AX0 = 156;
const AX1 = 600;
const AXW = AX1 - AX0;
const JSCALE_X = 658; // right-aligned joule scale, right of both bars

const ROAD_TOP = 176;
const ROAD_BOT = 206;
const CAR_W = 104;
const CAR_H = 70;

const K_TOP = 258;
const K_BOT = 338;
const M_TOP = 386;
const M_BOT = 434;
const PX = (K_BOT - K_TOP) / J_MAX; // px per joule, the same on both bars
const GRID = 50000; // a gridline every 50 000 J
const MS_Y = 350; // the mass dial's track
const GHOST_LABEL_Y = 240; // the empty band above the K bar
const GHOST_LEGEND = 'dashed: if it were straight';

const STAGE_CHIP = ['the same vehicle, twice', 'where the four comes from', 'turn the dial yourself'];

function kilojoules(v, kg) {
  return 0.5 * kg * v * v;
}

function xOfV(v) {
  return AX0 + (v / V_MAX) * AXW;
}

function xOfKg(kg) {
  return AX0 + (kg / KG_MAX) * AXW;
}

function fmtJ(j) {
  return `${Math.round(j).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} J`;
}

function fmtKg(m) {
  return `${Math.round(m).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kg`;
}

export class DoublesWorkoutScene extends SimScene {
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A car on a straight road with a speed dial under it and a mass dial; a kinetic energy bar that bends upward as the speed rises and a second bar that rises in a straight line as the mass rises, both read against one joule scale.';
  static NOTE_STAGE = 0;
  static CONTROLS = [
    { type: 'slider', id: 'v', label: 'Speed v (m/s)', min: V_MIN, max: V_MAX, step: V_STEP, value: V_START, suffix: ' m/s' },
    { type: 'slider', id: 'kg', label: 'Mass m (kg)', min: KG_MIN, max: KG_MAX, step: KG_STEP, value: KG_START, suffix: ' kg' },
  ];

  noteRows() {
    return [
      { text: 'no time or height here' },
      { text: 'both bars: one energy' },
    ];
  }

  async setup() {
    // Before super.setup(): it enters stage 0, and enter() reads these.
    this._v = V_START;
    this._kg = KG_START;
    this._vShown = V_START;
    this._kgShown = KG_START;
    this._vText = V_START;
    this._kgText = KG_START;
    this._txtT = 0;
    this._drag = null;
    this._touched = false;
    await super.setup();
  }

  enter(stage) {
    this._vShown = this._v;
    this._kgShown = this._kg;
    this._vText = this._v;
    this._kgText = this._kg;
    this.requestUiUpdate?.();
  }

  isControlDisabled() {
    return false; // both dials are live from the first beat
  }

  getControlValue(id) {
    if (id === 'v') return this._v;
    if (id === 'kg') return this._kg;
    return undefined;
  }

  onControlChange(id, value) {
    if (!this._guard(id)) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (id === 'v') this._v = clamp(n, V_MIN, V_MAX, V_STEP);
    else if (id === 'kg') this._kg = clamp(n, KG_MIN, KG_MAX, KG_STEP);
    this.requestUiUpdate?.();
  }

  update(d) {
    // The bar travels to a new setting instead of snapping, so the bend is
    // followed even when the dial is jumped.
    const k = 1 - Math.exp(-d / 0.08);
    this._vShown += (this._v - this._vShown) * k;
    this._kgShown += (this._kg - this._kgShown) * k;
    // Held figures, refreshed about four times a second, not once per frame.
    this._txtT += d;
    if (this._txtT >= 0.22) {
      this._txtT = 0;
      this._vText = this._v;
      this._kgText = this._kg;
    }
  }

  busy() {
    return Math.abs(this._v - this._vShown) > 0.05 || Math.abs(this._kg - this._kgShown) > 1;
  }

  // The dials are the scene: the road is the speed scale and the strip below the
  // bars is the mass scale, so both can be swept by dragging them.
  _grab(p) {
    if (p.x < AX0 - 40 || p.x > AX1 + 40) return null;
    if (p.y >= ROAD_TOP - CAR_H - 30 && p.y <= ROAD_BOT + 8) return 'v';
    if (p.y >= MS_Y - 18 && p.y <= MS_Y + 36) return 'kg';
    return null;
  }

  _sweep(which, p) {
    if (which === 'v') {
      this._v = clamp(((p.x - AX0) / AXW) * V_MAX, V_MIN, V_MAX, V_STEP);
    } else {
      this._kg = clamp(((p.x - AX0) / AXW) * KG_MAX, KG_MIN, KG_MAX, KG_STEP);
    }
    this._touched = true;
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    this._drag = this._grab(p);
    if (this._drag) this._sweep(this._drag, p);
  }

  pointerMove(p) {
    if (!this._drag) return;
    this._sweep(this._drag, p);
  }

  pointerUp() {
    this._drag = null;
  }

  draw(ctx, c) {
    const v = this._vShown;
    const kg = this._kgShown;
    const shownJ = kilojoules(this._vText, this._kgText);

    drawBackdrop(ctx, c, 'dots');
    drawCard(ctx, c, CARD.x, CARD.y, CARD.w, CARD.h, 1, { r: 14 });

    this._tracks(ctx, c);
    this._grid(ctx, c);
    this._road(ctx, c, v);
    this._massDial(ctx, c, kg);
    this._kBar(ctx, c, v, kg, shownJ);
    this._mBar(ctx, c, v, kg, shownJ);
    if (this.stage >= 1) this._ghost(ctx, c, v, kg);

    pill(ctx, c, STAGE_CHIP[this.stage] ?? STAGE_CHIP[0], W / 2, 26, { align: 'center', bg: c.accent, size: 15 });
    if (!this._touched) pill(ctx, c, 'turn either dial', W / 2, 470, { align: 'center', bg: c.accent, size: 15 });
  }

  // The straight line the slide argues against: K proportional to v, drawn from
  // the axis origin through the reading on the dial and carried on to 2v. It
  // sits above the real curve everywhere, which is the whole point.
  _ghost(ctx, c, v, kg) {
    const here = kilojoules(v, kg);
    if (here > J_MAX) return; // off the scale: a chord from nowhere says nothing
    const y0 = K_BOT;
    const y1 = K_BOT - here * PX;
    const x2v = 2 * v;
    const x1 = xOfV(v);
    const x2 = xOfV(Math.min(V_MAX, x2v));

    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.75);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(AX0, y0);
    ctx.lineTo(x2, K_BOT - Math.min(2 * here, J_MAX) * PX);
    ctx.stroke();
    ctx.restore();

    // what a straight climb would have said at twice the speed
    if (2 * here <= J_MAX) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x2, K_BOT - 2 * here * PX, 7, 0, Math.PI * 2);
      ctx.fillStyle = c.bgSurface;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, K_BOT - 2 * here * PX, 7, 0, Math.PI * 2);
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
    // where the square actually puts it
    if (4 * here <= J_MAX) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x2, K_BOT - 4 * here * PX, 7, 0, Math.PI * 2);
      ctx.fillStyle = c.good;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, K_BOT - 4 * here * PX, 7, 0, Math.PI * 2);
      ctx.strokeStyle = c.bgSurface;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } else {
      chevron(ctx, c, x2, K_TOP, c.good);
    }

    // The chord's own name, in the free band above the bars where nothing else
    // is drawn, and the outcome pill beside it.
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    ctx.fillStyle = c.labelMuted;
    ctx.fillText(GHOST_LEGEND, AX0, GHOST_LABEL_Y);
    const legendEnd = AX0 + ctx.measureText(GHOST_LEGEND).width;
    ctx.restore();
    const px = Math.max(legendEnd + 20 + 52, Math.min(x2, 556));
    pill(ctx, c, x2v <= V_MAX ? '4x, not 2x' : '4x off the top', px, GHOST_LABEL_Y,
      { align: 'center', bg: c.good, ink: darken(c.good, 0.72), size: 13 });
    // the axis origin the chord starts from
    ctx.save();
    ctx.beginPath();
    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
    ctx.fillStyle = c.label;
    ctx.fill();
    ctx.restore();
  }

  // An empty track behind each bar, so a bar is a bar and the two can be read
  // as two bars on one scale. Drawn before the grid, so the grid shows through.
  _tracks(ctx, c) {
    for (const [top, bot] of [[K_TOP, K_BOT], [M_TOP, M_BOT]]) {
      ctx.save();
      rr(ctx, AX0, top, AXW, bot - top, 10);
      ctx.fillStyle = c.track;
      ctx.fill();
      ctx.restore();
    }
    // Faint uprights on each bar's own scale, so the road's ruler and the mass
    // strip's ruler carry down into the bars they drive.
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.13);
    ctx.lineWidth = 2;
    for (let s = 0; s <= V_MAX; s += 20) {
      const x = Math.round(xOfV(s)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, K_TOP);
      ctx.lineTo(x, K_BOT);
      ctx.stroke();
    }
    for (let m = KG_MIN; m <= KG_MAX; m += 500) {
      const x = Math.round(xOfKg(m)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, M_TOP);
      ctx.lineTo(x, M_BOT);
      ctx.stroke();
    }
    ctx.restore();
  }

  // The shared joule scale: one grid, both bars, drawn once behind them.
  _grid(ctx, c) {
    ctx.save();
    for (let j = GRID; j <= J_MAX + 1; j += GRID) {
      const y = Math.round(K_BOT - j * PX) + 0.5;
      const strong = j % 100000 === 0;
      ctx.strokeStyle = alpha(c.stroke, strong ? 0.85 : 0.4);
      ctx.lineWidth = strong ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(AX0, y);
      ctx.lineTo(AX1, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    ctx.fillStyle = c.labelMuted;
    for (const j of [0, 100000, 200000, 250000]) {
      ctx.fillText(j === 0 ? '0' : fmtJ(j).replace(' J', ''), JSCALE_X, K_BOT - j * PX - (j === 250000 ? 8 : 0));
    }
    ctx.fillText('J', JSCALE_X, K_TOP - 34);
    ctx.restore();
  }

  // The road is the speed axis: the car sits at the current v, and the ticks
  // under it are the same scale the K bar's x runs on.
  _road(ctx, c, v) {
    ctx.save();
    rr(ctx, AX0 - 22, ROAD_TOP, AXW + 44, ROAD_BOT - ROAD_TOP, 8);
    ctx.fillStyle = darken(c.bgSurface, 0.3);
    ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(AX0 - 22, ROAD_TOP + 0.5);
    ctx.lineTo(AX1 + 22, ROAD_TOP + 0.5);
    ctx.stroke();
    // lane dashes
    ctx.strokeStyle = alpha(c.label, 0.22);
    ctx.lineWidth = 3;
    for (let x = AX0 - 8; x < AX1 + 12; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, ROAD_BOT - 9);
      ctx.lineTo(x + 18, ROAD_BOT - 9);
      ctx.stroke();
    }
    ctx.restore();

    // ticks and numbers inside the asphalt
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    for (let s = 0; s <= V_MAX; s += 5) {
      const x = xOfV(s);
      const big = s % 20 === 0;
      ctx.strokeStyle = alpha(c.label, big ? 0.7 : 0.3);
      ctx.lineWidth = big ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x, ROAD_BOT - (big ? 16 : 8));
      ctx.lineTo(x, ROAD_BOT);
      ctx.stroke();
      if (big) {
        ctx.fillStyle = alpha(c.label, 0.75);
        ctx.fillText(String(s), x, ROAD_BOT - 20);
      }
    }
    ctx.restore();

    this._car(ctx, c, xOfV(v), v);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    ctx.fillStyle = c.labelMuted;
    ctx.fillText('speed v (m/s)', GUT_X, ROAD_TOP + 6);
    ctx.restore();
  }

  _car(ctx, c, x, v) {
    const left = x - CAR_W / 2;
    const base = ROAD_TOP;
    const body = c.s2;
    ctx.save();
    // cabin
    rr(ctx, left + 20, base - CAR_H, CAR_W - 44, 30, 9);
    ctx.fillStyle = darken(body, 0.3);
    ctx.fill();
    rr(ctx, left + 20, base - CAR_H - 4, CAR_W - 44, 30, 9);
    ctx.fillStyle = body;
    ctx.fill();
    // glass
    rr(ctx, left + 28, base - CAR_H + 2, CAR_W - 60, 18, 6);
    ctx.fillStyle = c.glass;
    ctx.fill();
    // body
    rr(ctx, left, base - 40, CAR_W, 30, 10);
    ctx.fillStyle = darken(body, 0.3);
    ctx.fill();
    rr(ctx, left, base - 44, CAR_W, 30, 10);
    ctx.fillStyle = body;
    ctx.fill();
    // headlight
    rr(ctx, left + CAR_W - 12, base - 38, 9, 8, 3);
    ctx.fillStyle = lighten(c.gold, 0.3);
    ctx.fill();
    // wheels
    for (const wx of [left + 24, left + CAR_W - 24]) {
      ctx.beginPath();
      ctx.arc(wx, base - 9, 9, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.bgDeep, 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx, base - 9, 4, 0, Math.PI * 2);
      ctx.fillStyle = c.stroke;
      ctx.fill();
    }
    ctx.restore();
    // eyes on the front wing: the car squints as it is pushed harder
    drawFace(ctx, left + CAR_W - 30, base - 30, 13, { col: body, c, mood: v > 34 ? 'squint' : 'smile', t: this.clock });
    pill(ctx, c, `${v.toFixed(0)} m/s`, x, base - CAR_H - 22, { bg: c.raised, ink: c.label, size: 13 });
  }

  _massDial(ctx, c, kg) {
    const x = xOfKg(kg);
    ctx.save();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(AX0, MS_Y);
    ctx.lineTo(AX1, MS_Y);
    ctx.stroke();
    for (let m = KG_MIN; m <= KG_MAX; m += 250) {
      const tx = xOfKg(m);
      const big = m % 500 === 0;
      ctx.strokeStyle = alpha(c.label, big ? 0.6 : 0.25);
      ctx.lineWidth = big ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(tx, MS_Y - (big ? 6 : 3));
      ctx.lineTo(tx, MS_Y + (big ? 6 : 3));
      ctx.stroke();
    }
    // the handle
    rr(ctx, x - 9, MS_Y - 13, 18, 26, 8);
    ctx.fillStyle = c.s3;
    ctx.fill();
    rr(ctx, x - 4, MS_Y - 9, 8, 4, 2);
    ctx.fillStyle = lighten(c.s3, 0.5);
    ctx.fill();
    ctx.restore();

    pill(ctx, c, fmtKg(kg), x, MS_Y + 20, { bg: c.raised, ink: c.label, size: 13 });
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    ctx.fillStyle = c.labelMuted;
    ctx.fillText('mass m (kg)', GUT_X, MS_Y);
    ctx.restore();
  }

  // The K bar: the energy at every speed, at the mass on the dial. Its top edge
  // is the parabola, so it is bent by construction and never drawn by eye.
  _kBar(ctx, c, v, kg, shownJ) {
    const top = K_BOT - Math.min(kilojoules(v, kg), J_MAX) * PX;
    const vCeil = clampCeil(Math.sqrt((J_MAX * 2) / kg), V_MIN, V_MAX); // where the curve leaves the top
    const xEnd = xOfV(Math.min(V_MAX, vCeil));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(AX0, K_BOT);
    for (let s = 0; s <= Math.min(V_MAX, vCeil); s += 1) {
      ctx.lineTo(xOfV(s), K_BOT - kilojoules(s, kg) * PX);
    }
    ctx.lineTo(xEnd, top);
    ctx.lineTo(xEnd, K_BOT);
    ctx.closePath();
    ctx.fillStyle = c.s1;
    ctx.fill();
    ctx.strokeStyle = lighten(c.s1, 0.35);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let s = 0; s <= Math.min(V_MAX, vCeil); s += 1) {
      const x = xOfV(s);
      const y = K_BOT - kilojoules(s, kg) * PX;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // the curve leaves the top of the scale here, and the chevron says so
    if (vCeil < V_MAX) chevron(ctx, c, xEnd, K_TOP, c.warning);

    this._marker(ctx, c, xOfV(v), Math.max(top, K_TOP), K_BOT, kilojoules(v, kg) > J_MAX);
    this._gutter(ctx, c, 'K', fmtJ(shownJ), '0.5 x m x v squared', 292, 320, c.s1);
  }

  // The M bar: the energy at every mass, at the speed on the dial. K is
  // proportional to m at a fixed speed, so this top edge is one straight
  // segment from the origin - drawn as two points, never as a curve.
  _mBar(ctx, c, v, kg, shownJ) {
    const top = M_BOT - Math.min(kilojoules(v, kg), J_MAX) * PX;
    const mCeil = clampCeil((J_MAX * 2) / (v * v), KG_MIN, KG_MAX);
    const xEnd = xOfKg(mCeil);
    const yEnd = Math.max(M_BOT - kilojoules(v, mCeil) * PX, M_TOP);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(AX0, M_BOT);
    ctx.lineTo(xEnd, yEnd);
    ctx.lineTo(xEnd, M_BOT);
    ctx.closePath();
    ctx.fillStyle = c.s3;
    ctx.fill();
    // the straight edge, drawn heavy, and straight by two points
    ctx.strokeStyle = lighten(c.s3, 0.4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(AX0, M_BOT);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
    ctx.restore();

    if (mCeil < KG_MAX) chevron(ctx, c, xEnd, M_TOP, c.warning);

    this._marker(ctx, c, xOfKg(kg), Math.max(top, M_TOP), M_BOT, kilojoules(v, kg) > J_MAX);
    this._gutter(ctx, c, 'M', fmtJ(shownJ), '0.5 x v x m', 404, 428, c.s3);
  }

  _marker(ctx, c, x, yTop, yBase, offScale) {
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.6);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, yTop);
    ctx.lineTo(x + 0.5, yBase);
    ctx.stroke();
    ctx.restore();
    if (offScale) {
      chevron(ctx, c, x, yTop, c.warning);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, yTop, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = c.label;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, yTop, 5.5, 0, Math.PI * 2);
    ctx.strokeStyle = c.bgSurface;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  _gutter(ctx, c, letter, value, formula, yMain, yFormula, col) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, 20);
    ctx.fillStyle = col;
    ctx.fillText(letter, GUT_X, yMain);
    ctx.font = font(c, 800, value.length > 8 ? 18 : 21, true);
    ctx.fillStyle = c.label;
    ctx.fillText(value, GUT_X + 24, yMain);
    ctx.font = font(c, 600, 13);
    ctx.fillStyle = c.labelMuted;
    ctx.fillText(formula, GUT_X, yFormula);
    ctx.restore();
  }
}

function clamp(n, lo, hi, step) {
  return Math.round(Math.max(lo, Math.min(hi, n)) / step) * step;
}

// The on-scale end of a trace, never inside the dial's own travel.
function clampCeil(n, lo, hi) {
  if (!Number.isFinite(n)) return hi;
  return Math.max(lo, Math.min(hi, n));
}

function chevron(ctx, c, x, y, col) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 8);
  ctx.lineTo(x, y - 6);
  ctx.lineTo(x + 8, y + 8);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
