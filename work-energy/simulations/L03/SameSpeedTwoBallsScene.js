import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, drawBackdrop, drawFloor, drawShadow, drawSpotlight, drawFace, pill, chipSize,
  alpha, lighten, darken, mix, luma,
} from 'simulations/base/kit/SimLook.js';

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // two balls, one speed
  [{ idx: 1, dwellMs: null }], // the wrong answer, and the trouble with it
  [{ idx: 2, dwellMs: null }], // neither ball will tell you
];

// -- The slide's own numbers ------------------------------------------------------

const G_MIN = 20;          // the table-tennis ball, exactly as the slide gives it
const G_MAX = 2000;        // the iron ball, exactly as the slide gives it
const G_STEP = 20;         // so both slide figures are reachable, not approximated
const V_MIN = 1;
const V_MAX = 10;
const V_STEP = 0.5;
const V_START = 3;

// The two balls' default tags read 20 g and 2 kg.
const LIGHT_G = G_MIN;
const HEAVY_G = G_MAX;

// -- Drawn geometry ----------------------------------------------------------------

const TBL_X0 = 20;
const TBL_X1 = 660;
const FACE_Y0 = 178;       // far edge of the table top
const FACE_Y1 = 462;       // near edge of the table top
const APRON_Y = 462;
const LEG_Y = 500;         // floor line

const RAIL = [
  { y: 212, key: 'light' },
  { y: 438, key: 'heavy' },
];
const RAIL_H = 12;         // the rail bar's own thickness
const GATE_X = 44;
const TAG_TOP = 100;       // no mass tag is ever drawn higher than this
const CHIP_TOP = 30;       // the one state chip in the top band

// One run, from off the left edge to the place where both balls stop.
const RUN_X0 = -50;
const RUN_X1 = 470;        // both balls come to rest here, mid-table, so the
                           // still frame is a balanced picture and not a queue
const RUN_SPAN = RUN_X1 - RUN_X0;

// Drawn radius. 20 g -> 15 px, 2000 g -> 45 px, i.e. exactly three times wider:
// the stub's "the iron ball is only about three times wider". The exponent is
// log(3)/log(100), so the drawn ratio at the two slide masses is exactly 3.
const R_BASE = 19;
const R_EXP = Math.log(3) / Math.log(100);

function radiusFor(g) {
  return R_BASE * Math.pow(g / G_MIN, R_EXP);
}

// Drawn speed. The dial's ten-to-one range is drawn as about three to one,
// because a linear map would put the 1 m/s pass at 8.7 s - past the budget.
function pxPerSec(v) {
  return 100 * Math.sqrt(v);
}

function passDur(v) {
  return RUN_SPAN / pxPerSec(v) + DECEL_S / 2;
}

const DECEL_S = 0.45;      // rolling resistance at the end of a pass
const REST_EASE = 0.03;    // the run starts and ends on zero velocity, not on a cut

// The fallback is the dial's own declared value, so a mount whose control bar
// has not reported yet still opens on the slide's two figures: 20 g and 2 kg.
function controlG(id, dflt) {
  const v = Number(this.getControlValue(id));
  return Number.isFinite(v) ? Math.max(G_MIN, Math.min(G_MAX, v)) : dflt;
}

function controlV() {
  const v = Number(this.getControlValue('speed'));
  return Number.isFinite(v) ? Math.max(V_MIN, Math.min(V_MAX, v)) : V_START;
}

// Grams below a kilogram read in grams, a kilogram and above read in kilograms.
function massText(g) {
  if (g < 1000) return `${Math.round(g)} g`;
  const kg = g / 1000;
  const s = Number.isInteger(kg) ? String(kg) : String(Math.round(kg * 100) / 100);
  return `${s} kg`;
}

// ONE function, ONE argument: both balls read the same string, so the shared
// speed tag cannot differ between the lanes in any code path.
function speedText(v) {
  const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10);
  return `${s} m/s`;
}

// The whole motion of the scene. One clock, one x, both balls.
function xAt(t, v) {
  const dur = passDur(v);
  if (t >= dur) return RUN_X1;
  const T = dur * (1 - REST_EASE);
  if (t <= T) return RUN_X0 + (t / T) * RUN_SPAN;
  // A smoothstep tail: velocity falls from cruise to zero over DECEL_S, which
  // is rolling resistance rather than a wall.
  const u = (t - T) / (dur - T);
  const s = u * u * (3 - 2 * u);
  return RUN_X0 + RUN_SPAN + (s - 1) * (RUN_SPAN * REST_EASE);
}

export class SameSpeedTwoBallsScene extends SimScene {
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'Two balls rolling left to right along a long table, a small pale one in the far lane and a large dark one in the near lane, both at the same speed, each carrying a mass tag. The panel reports no value for either ball.';
  static NOTE_STAGE = 0;
  static NOTE_TITLE = 'NOTE';
  static CONTROLS = [
    { id: 'massLight', label: 'Table-tennis ball (g)', type: 'slider', min: G_MIN, max: G_MAX, step: G_STEP, value: LIGHT_G, suffix: ' g' },
    { id: 'massHeavy', label: 'Iron ball (g)', type: 'slider', min: G_MIN, max: G_MAX, step: G_STEP, value: HEAVY_G, suffix: ' g' },
    { id: 'speed', label: 'Speed of both (m/s)', type: 'slider', min: V_MIN, max: V_MAX, step: V_STEP, value: V_START, suffix: ' m/s' },
  ];

  noteRows() {
    return [
      { text: 'Sizes are not to scale', sub: 'Only the difference is shown' },
      { text: 'Speeds from 1 to 10 m/s', sub: 'Drawn slower at the top end' },
      { text: 'Energy is not shown yet', sub: 'You find its rule in this lesson' },
    ];
  }

  async setup() {
    await super.setup();
    this._runT = 0;
    this._run = true;
  }

  enter() {
    // Every beat shows the same picture with the balls rolling: the stub's beat
    // 2 is "unchanged and still running". The dial values are the learner's.
    this._runT = 0;
    this._run = true;
    this.requestUiUpdate?.();
  }

  isControlHidden() { return false; }

  // Nothing is locked, on any beat: the stub's beat 0 says so outright.
  isControlDisabled() { return false; }

  onControlChange() {
    // Any dial change re-enters both balls from the left at the new setting.
    this._runT = 0;
    this._run = true;
    this.animateFor(260);
  }

  pointerDown() {
    // A tap anywhere re-runs the pass, so the scene is never a still picture.
    this._runT = 0;
    this._run = true;
  }

  update(d) {
    if (!this._run) return;
    this._runT += d;
    if (this._runT >= passDur(controlV.call(this))) this._run = false;
  }

  // True only while a pass is in flight; every pass ends, so it goes false.
  busy() {
    return this._run;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this._table(ctx, c);
    this._rails(ctx, c);
    this._balls(ctx, c);
    pill(ctx, c, 'one speed - two balls', W / 2, CHIP_TOP, { align: 'center', bg: c.accent, size: 15 });
  }

  _table(ctx, c) {
    drawFloor(ctx, c, LEG_Y, { seams: true });
    const top = mix(c.bgSurface, c.s8, 0.2);
    // the top face, in shallow oblique so both lanes are visible at once
    ctx.save();
    ctx.fillStyle = top;
    ctx.fillRect(TBL_X0, FACE_Y0, TBL_X1 - TBL_X0, FACE_Y1 - FACE_Y0);
    // a lit far lip and a shadowed near edge, so the slab reads as a surface
    ctx.fillStyle = lighten(top, 0.34);
    ctx.fillRect(TBL_X0, FACE_Y0, TBL_X1 - TBL_X0, 5);
    ctx.fillStyle = darken(top, 0.24);
    ctx.fillRect(TBL_X0, FACE_Y1 - 6, TBL_X1 - TBL_X0, 6);
    // faint board seams running with the table
    ctx.strokeStyle = alpha(darken(top, 0.34), 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const y = FACE_Y0 + ((FACE_Y1 - FACE_Y0) * i) / 4;
      ctx.moveTo(TBL_X0, y);
      ctx.lineTo(TBL_X1, y);
    }
    ctx.stroke();
    // a pool of light on the table, so the middle band is a lit stage
    drawSpotlight(ctx, c, W / 2, 340, 330, 0.5);
    ctx.restore();
    // the apron and two stubby legs
    ctx.save();
    ctx.fillStyle = darken(top, 0.42);
    ctx.fillRect(TBL_X0, APRON_Y, TBL_X1 - TBL_X0, 20);
    ctx.fillStyle = lighten(darken(top, 0.42), 0.16);
    ctx.fillRect(TBL_X0, APRON_Y, TBL_X1 - TBL_X0, 3);
    ctx.fillStyle = darken(top, 0.55);
    for (const lx of [96, TBL_X1 - 126]) ctx.fillRect(lx, APRON_Y + 20, 24, LEG_Y - APRON_Y - 20);
    ctx.restore();
    drawShadow(ctx, c, W / 2, LEG_Y + 3, (TBL_X1 - TBL_X0) / 2, 10);
  }

  _rails(ctx, c) {
    const col = mix(c.bgSurface, c.s5, 0.42);
    for (const lane of RAIL) {
      ctx.save();
      // the rail bar: one colour for BOTH lanes, so nothing in the set says
      // which ball is the heavy one
      ctx.fillStyle = darken(col, 0.34);
      ctx.fillRect(TBL_X0, lane.y, TBL_X1 - TBL_X0, RAIL_H);
      ctx.fillStyle = col;
      ctx.fillRect(TBL_X0, lane.y, TBL_X1 - TBL_X0, RAIL_H - 4);
      ctx.fillStyle = lighten(col, 0.36);
      ctx.fillRect(TBL_X0, lane.y + 1, TBL_X1 - TBL_X0, 3);
      // the far rail casts a soft shadow down the table, which is what stops
      // the slab between the lanes from reading as dead colour
      if (lane === RAIL[0]) {
        ctx.fillStyle = alpha(darken(mix(c.bgSurface, c.s8, 0.2), 0.4), 0.5);
        ctx.fillRect(TBL_X0, lane.y + RAIL_H, TBL_X1 - TBL_X0, 26);
      }
      // the start gate, identical on both lanes
      ctx.fillStyle = darken(col, 0.46);
      ctx.fillRect(GATE_X - 5, lane.y - 34, 8, 34);
      ctx.fillRect(GATE_X + 5, lane.y - 34, 8, 34);
      ctx.fillStyle = lighten(col, 0.2);
      ctx.fillRect(GATE_X - 5, lane.y - 34, 8, 3);
      ctx.fillRect(GATE_X + 5, lane.y - 34, 8, 3);
      ctx.restore();
    }
  }

  _balls(ctx, c) {
    const v = controlV.call(this);
    const t = this._run ? this._runT : passDur(v);
    const x = xAt(t, v);
    const gs = {
      light: controlG.call(this, 'massLight', LIGHT_G),
      heavy: controlG.call(this, 'massHeavy', HEAVY_G),
    };
    for (const lane of RAIL) {
      const r = radiusFor(gs[lane.key]);
      const cy = lane.y - r;
      this._ball(ctx, c, x, cy, r, lane.key);
      // the mass tag rides on a short stem off the top of its own ball, clear
      // of the ball itself and clamped so it never leaves the frame
      const mTag = massText(gs[lane.key]);
      const mSize = chipSize(ctx, c, mTag, 14);
      const mX = Math.max(mSize.w / 2 + 8, Math.min(W - mSize.w / 2 - 8, x));
      const mY = Math.max(TAG_TOP, cy - r - 20);
      pill(ctx, c, mTag, mX, mY, { align: 'center', bg: c.accent, size: 14 });
      ctx.save();
      ctx.strokeStyle = alpha(c.labelMuted, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mX, mY + mSize.h / 2);
      ctx.lineTo(x, cy - r - 3);
      ctx.stroke();
      ctx.restore();
      // ONE speedText() call, so the two tags cannot differ
      const sTag = speedText(v);
      const sSize = chipSize(ctx, c, sTag, 14);
      const sX = Math.max(sSize.w / 2 + 8, Math.min(W - sSize.w / 2 - 8, x));
      const sY = Math.max(TAG_TOP - 30, mY - sSize.h - 10);
      pill(ctx, c, sTag, sX, sY, { align: 'center', bg: c.s5, size: 14 });
    }
  }

  _ball(ctx, c, x, y, r, kind) {
    // A table-tennis ball is white and an iron ball is grey, and that has to
    // hold in BOTH themes - which a mix toward c.label cannot do, because
    // c.label is near-white in the dark theme and near-black in the light one.
    // So the two bodies are picked from tokens that keep their lightness in
    // both themes, and a rim stroke guarantees separation from the table in
    // either one.
    const light = luma(c.bgSurface) > 0.5;
    const body = kind === 'light'
      ? (light ? c.raised : mix(c.bgSurface, c.label, 0.9))
      : (light ? darken(c.waste, 0.1) : c.waste);
    drawShadow(ctx, c, x, y + r + 2, r * 0.95, r * 0.15, 0.85);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = darken(body, 0.42);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    // one darker cushion shade under, one lighter gloss on top
    ctx.fillStyle = darken(body, 0.22);
    ctx.fillRect(x - r, y + r * 0.3, r * 2, r);
    ctx.fillStyle = lighten(body, 0.42);
    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.46, r * 0.36, r * 0.2, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // the seam turns through distance / radius, so the small ball's seam really
    // does spin about three times faster over the same ground. It is drawn as
    // a short arc near the rim, not a diameter, so it never cuts across the face.
    const travel = Math.max(0, x - RUN_X0);
    const spin = -travel / r;
    ctx.strokeStyle = alpha(darken(body, 0.6), 0.8);
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.74, spin, spin + 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.74, spin + Math.PI, spin + Math.PI + 0.7);
    ctx.stroke();
    // a face on each, looking the way they are going. Both get the SAME mood:
    // the set must not say which ball is the heavy one.
    drawFace(ctx, x, y + r * 0.06, r * 0.5, {
      c, col: body, mood: 'happy', t: this.clock, look: { x: 1, y: 0.2 },
    });
    // motion streaks, only while a pass is in flight, so the still frame is still
    if (this._run) {
      ctx.strokeStyle = alpha(c.labelMuted, 0.32);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 1; i <= 3; i++) {
        const sx = x - r - 12 - i * 16;
        const len = 10 + i * 6;
        ctx.beginPath();
        ctx.moveTo(sx, y - r * 0.4);
        ctx.lineTo(sx - len, y - r * 0.4);
        ctx.moveTo(sx, y + r * 0.4);
        ctx.lineTo(sx - len, y + r * 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
