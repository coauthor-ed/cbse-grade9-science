import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, mix, alpha, darken, lighten, font, rr,
  drawBackdrop, drawDepth, drawFloor, drawVignette, drawCard,
  drawShadow, drawBadge, pill, chipRow, popAt,
} from 'simulations/base/kit/SimLook.js';

// blk-l06-s07 is the only slide attached here and it has three beats, so one
// map with one entry per beat. Each entry's idx is the stage that beat owns.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the flag at the foot, the pace dial live
  [{ idx: 1, dwellMs: null }], // the same flag raised slowly, then quickly
  [{ idx: 2, dwellMs: null }], // the load half, and the two halves side by side
];

// g = 10 N/kg, the bundle's convention. Both halves are set so the bill
// multiplies out with no rounding anywhere: the flag's work never changes, and
// the load's power lands on a whole four times its own first raise.
const G = 10;                          // N/kg

// The flag: a fixed 1.0 kg on an 8.0 m pole, so the work is 80 J whatever the
// pace. The pole's length is a fact of the scene and never a dial.
const FLAG_MASS = 1.0;                 // kg
const FLAG_PULL = FLAG_MASS * G;       // 10 N
const FLAG_H = 8.0;                    // m
const FLAG_WORK = FLAG_PULL * FLAG_H;  // 80 J

// The raise pace, in the four stops a real hoist crew would call. Every stop is
// a clean double or a clean half of its neighbour, so "the power doubles" is
// one tap and the readings are 5 / 10 / 20 / 40 W.
const PACE_SLOW = 8, PACE_FAST = 4, PACE_START = 8;

// The load: 2.0 kg on a 16.0 m pole. Its first raise - 8.0 m in 16.0 s - is the
// fixed reference the factor chip is measured against, and it is the same 10 W
// the flag's 8 s starts from, so the two halves' factors are comparable.
const LOAD_MASS = 2.0;                              // kg
const LOAD_PULL = LOAD_MASS * G;                    // 20 N
const LOAD_POLE_H = 16.0;                           // m
const LOAD_REF_H = 8.0, LOAD_REF_T = 16.0;          // m, s
const LOAD_REF_WORK = LOAD_PULL * LOAD_REF_H;       // 160 J
const LOAD_REF_POWER = LOAD_REF_WORK / LOAD_REF_T; // 10 W
const LOAD_H_S = [4, 8, 12, 16];
const LOAD_T_S = [4, 8, 12, 16, 20, 24, 28, 32];
const LOAD_H_START = 16, LOAD_T_START = 8;

// One shared scale for the whole panel, so "twice as high" is a fact about the
// drawing and not a claim. 20 px per metre: the 16 m pole fills the hero and
// the 8 m flag pole lands exactly on the ruler's 8 m tick.
const PX_PER_M = 20;
const GROUND_Y = 418;
const POLE_A_X = 250, POLE_B_X = 430, RULER_X = 340;
const POLE_W = 12;
const POLE_A_TOP = GROUND_Y - PX_PER_M * FLAG_H;       // 258
const POLE_B_TOP = GROUND_Y - PX_PER_M * LOAD_POLE_H;  // 98

// The cards own their columns outright, so a pole can never slide under one.
const FLAG_CARD = { x: 16, y: 96, w: 170, h: 154, rows: [158, 190, 222] };
const LOAD_CARD = { x: 494, y: 96, w: 170, h: 186, rows: [158, 190, 222, 254] };
const REF_STRIP = { x: 494, y: 292, w: 170, h: 90, rows: [344, 368] };

// A raise is drawn over this long whatever the dial says, so the longest script
// sits inside the 8 s a beat grants. The seconds on the cards are the dial's.
const RAISE_S = 2.2, DOWN_S = 0.4;
const START_DELAY = 0.3, HOLD_S = 0.45;

const STAGE_CHIP = ['the flag', 'the same flag faster', 'the two halves'];
const DASH = '\u2014';

const NOTE = [
  { text: 'Each raise is drawn in about 2 s; the seconds on the card are the dial\u2019s own.' },
  { text: 'The pole is the same length every run, so the work reading never moves.' },
  { text: 'The load\u2019s power is its work divided by its time - nothing else.' },
];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

export class FlagpolePowerScene extends SimScene {
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static NOTE_STAGE = 0;
  static ARIA_LABEL = 'Two poles stand on a lawn beside a metre ruler. On the left a flag on an 8 metre pole, with a card showing its work and its power; on the right a 2 kilogram bag on a 16 metre pole, with a card showing its mass, height, time, work and power. Raising the flag at a chosen pace changes only its power. Raising the load to a chosen height in a chosen time changes both, and a chip in the top corner reads the resulting factor.';

  static CONTROLS = [
    {
      type: 'select', id: 'pace', label: 'Raise pace', value: String(PACE_START),
      options: [16, 8, 4, 2].map((s) => ({ value: String(s), label: s + ' s' })),
    },
    { type: 'button', id: 'raiseFlag', label: 'Raise the flag' },
    {
      type: 'select', id: 'loadH', label: 'Load height', value: String(LOAD_H_START),
      options: LOAD_H_S.map((v) => ({ value: String(v), label: fmt1(v) + ' m' })),
    },
    {
      type: 'select', id: 'loadT', label: 'Load time', value: String(LOAD_T_START),
      options: LOAD_T_S.map((v) => ({ value: String(v), label: v + ' s' })),
    },
    { type: 'button', id: 'raiseLoad', label: 'Raise the load' },
  ];

  async setup() {
    this._run = null;
    this._own = null;     // the learner's own flag raise, stage 0
    this._slow = null;    // the scripted 8 s raise, stages 1 and 2
    this._fast = null;    // the scripted 4 s raise, stages 1 and 2
    this._flagSeen = false;
    this._load = null;    // the load's posted readings, stage 2
    this._loadH = LOAD_H_START;
    this._loadT = LOAD_T_START;
    this._hint = 0;
    this._hit = { flag: null, load: null };
    this._c = null;
    await super.setup();
  }

  enter(stage) {
    // A raise belongs to the stage that started it, so nothing survives a beat
    // change: the next beat runs its own script from the foot. The dials are
    // facts rather than beat state and deliberately survive.
    this._run = null;
    this._load = null;
    this._hint = this.stage === 0 ? 0 : -1;
    this._plan();
    this.requestUiUpdate?.();
  }

  // The stage's own script. Stage 0 is the learner's and waits for a press;
  // stage 1 raises the flag slowly and then quickly; stage 2 adds the load half
  // and, on a cold mount, earns the flag's two readings first.
  _plan() {
    let at = START_DELAY;
    if (this.stage === 1) {
      this._slow = null;
      this._fast = null;
      this.after(at, () => this._raiseFlag(PACE_SLOW, 'slow', true));
      at += RAISE_S + HOLD_S;
      this.after(at, () => this._raiseFlag(PACE_FAST, 'fast', false));
      at += RAISE_S;
    } else if (this.stage === 2) {
      if (!this._slow || !this._fast) {
        this.after(at, () => this._raiseFlag(PACE_SLOW, 'slow', true));
        at += RAISE_S + HOLD_S;
        this.after(at, () => this._raiseFlag(PACE_FAST, 'fast', false));
        at += RAISE_S + HOLD_S;
      }
      this.after(at, () => this._raiseLoad(false));
      at += RAISE_S;
    }
    this.animateFor(at * 1000 + 500);
  }

  isControlHidden(id) {
    // The load's two dials and its button only make sense once the second half
    // of the slide is on screen. The pace dial belongs to stage 0 alone: from
    // stage 1 the script owns the flag, and a learner's raise must not be able
    // to wipe the two readings that beat is about.
    if (id === 'loadH' || id === 'loadT' || id === 'raiseLoad') return this.stage < 2;
    if (id === 'pace') return this.stage > 0;
    return false;
  }

  isControlDisabled(id) {
    if (id === 'pace' || id === 'raiseFlag') return this.stage > 0 || !!this._run;
    if (id === 'raiseLoad') return !!this._run;
    return false;
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'loadH') this._loadH = Number(v);
    if (id === 'loadT') this._loadT = Number(v);
    if (id === 'raiseFlag') this._raiseFlag(this.paceSecs(), 'own', true);
    if (id === 'raiseLoad') this._raiseLoad(true);
    this.requestUiUpdate?.();
  }

  // A tap on the flag, the flagpole or the bag is the phone-usable form of the
  // two buttons.
  pointerDown(p) {
    if (this._run) return;
    const f = this._hit.flag;
    if (this.stage === 0 && f && p.x >= f.x0 && p.x <= f.x1 && p.y >= f.y0 && p.y <= f.y1) {
      this._raiseFlag(this.paceSecs(), 'own', true);
      return;
    }
    const l = this._hit.load;
    if (this.stage === 2 && l && p.x >= l.x0 && p.x <= l.x1 && p.y >= l.y0 && p.y <= l.y1) this._raiseLoad(true);
  }

  paceSecs() {
    const v = Number(this.getControlValue('pace'));
    return Number.isFinite(v) && v > 0 ? v : PACE_START;
  }
  flagPowerW(secs) { return FLAG_WORK / secs; }
  loadWorkJ(h) { return LOAD_PULL * h; }
  loadPowerW(h, t) { return (LOAD_PULL * h) / t; }

  _raiseFlag(secs, which, retract) {
    if (this._run) return;
    this._run = { kind: 'flag', secs, which, retract, t: 0, t0: 0, phase: 'up', u: 0 };
    this._hint = -1;
    this.animateFor((RAISE_S + DOWN_S + 0.4) * 1000);
  }

  _raiseLoad(retract) {
    if (this._run) return;
    this._run = {
      kind: 'load', h: this._loadH, secs: this._loadT, retract,
      from: this._load ? this._load.h : 0, to: this._loadH,
      t: 0, t0: 0, phase: 'up', u: 0,
    };
    this.animateFor((RAISE_S + DOWN_S + 0.4) * 1000);
  }

  update(d) {
    const r = this._run;
    if (!r) return;
    r.t += d;
    if (r.phase === 'up') {
      r.u = clamp(r.t / RAISE_S, 0, 1);
      if (r.t >= RAISE_S) { r.u = 1; this._landUp(r); }
    } else {
      r.u = 1 - clamp((r.t - r.t0) / DOWN_S, 0, 1);
      if (r.t - r.t0 >= DOWN_S) this._run = null;
    }
  }

  // Every figure on the panel is read back out of the run that produced it, so
  // no reading can outlive the settings that made it. The work row is the one
  // exception and it is the point: it is a constant, posted from the first
  // frame and never touched again.
  _landUp(r) {
    this._flagSeen = true;
    const c = this._c;
    if (r.kind === 'flag') {
      const w = this.flagPowerW(r.secs);
      if (r.which === 'slow') this._slow = { secs: r.secs, watts: w };
      else if (r.which === 'fast') this._fast = { secs: r.secs, watts: w };
      else this._own = { secs: r.secs, watts: w };
      this.celebrate(POLE_A_X + 26, POLE_A_TOP - 4, 20);
      this.floatText(r.which === 'fast' ? 'x2' : '80 J, again', POLE_A_X + 26, POLE_A_TOP - 32,
        { bg: c ? c.s1 : undefined, size: 16 });
    } else {
      this._load = {
        h: r.h, secs: r.secs,
        joules: this.loadWorkJ(r.h),
        watts: this.loadPowerW(r.h, r.secs),
      };
      const y = GROUND_Y - PX_PER_M * r.h;
      this.celebrate(POLE_B_X, y - 30, 26);
      this.floatText('x' + this._factor(), POLE_B_X, y - 60, { bg: c ? c.s4 : undefined, size: 17 });
    }
    if (r.retract) { r.phase = 'down'; r.t0 = r.t; }
    else this._run = null;
  }

  // The load's power against the 10 W of its own first raise. Computed from the
  // posted readings, never typed, so every combination the panel can show is
  // the one the division gives.
  _factor() {
    const k = (this._load ? this._load.watts : LOAD_REF_POWER) / LOAD_REF_POWER;
    const r = Math.round(k * 100) / 100;
    return Number.isInteger(r) ? String(r) : String(r);
  }

  busy() { return !!this._run; }

  draw(ctx, c, t) {
    this._c = c;
    drawBackdrop(ctx, c, 'dots', { t });
    drawDepth(ctx, c, { t });
    drawFloor(ctx, c, GROUND_Y);
    this._drawHedge(ctx, c);
    this._drawYard(ctx, c);
    this._drawRuler(ctx, c);
    this._drawPoles(ctx, c);
    this._drawFlagCard(ctx, c);
    this._drawLoadCard(ctx, c);
    this._drawRefStrip(ctx, c);
    drawVignette(ctx, c);
    this._drawChips(ctx, c);
  }

  // -- Set -------------------------------------------------------------------------

  _drawHedge(ctx, c) {
    // A low hedge along the back of the lawn: set dressing, never on evidence.
    const y = GROUND_Y - 30;
    ctx.save();
    ctx.fillStyle = mix(c.bgSurface, c.good, 0.16);
    for (let x = 6; x < W; x += 36) {
      const h = 15 + ((x * 7) % 10);
      rr(ctx, x, y - h, 34, h + 10, 9);
      ctx.fill();
    }
    ctx.fillStyle = darken(mix(c.bgSurface, c.good, 0.16), 0.35);
    rr(ctx, 6, y + 4, W - 12, 10, 4);
    ctx.fill();
    ctx.restore();
  }

  _drawRuler(ctx, c) {
    // One shared metre scale between the poles, so "twice as high" is measurable
    // and the flag's own top lands on the 8 m tick. A slim rail and its numbers,
    // with no plate behind them: a card-width slab here read as a wall and
    // swallowed the dashed reference line.
    ctx.save();
    ctx.strokeStyle = alpha(c.stroke, 0.95);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(RULER_X, POLE_B_TOP - 2);
    ctx.lineTo(RULER_X, GROUND_Y);
    ctx.stroke();
    ctx.textBaseline = 'middle';
    for (let m = 0; m <= LOAD_POLE_H; m += 4) {
      const y = GROUND_Y - PX_PER_M * m;
      if (m > 0) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(RULER_X - 8, y);
        ctx.lineTo(RULER_X + 8, y);
        ctx.stroke();
      }
      ctx.font = font(c, 800, 12);
      ctx.fillStyle = c.label;
      ctx.textAlign = 'left';
      // 10 px above its own tick: the 8 m tick is where the dashed reference
      // line runs, and a number centred on it is struck through.
      ctx.fillText(m === LOAD_POLE_H ? m + ' m' : String(m), RULER_X + 14, y - 10);
    }
    // The flag's height, carried across to the load pole as a dashed reference.
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = c.s1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(POLE_A_X + POLE_W / 2, POLE_A_TOP);
    ctx.lineTo(POLE_B_X - POLE_W / 2, POLE_A_TOP);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // The left column's lower half is otherwise dead lawn: a crate of rope and a
  // few tufts, which is what stands at the foot of a real flagpole.
  _drawYard(ctx, c) {
    const wood = mix(c.raised, c.gold, 0.35);
    ctx.save();
    drawShadow(ctx, c, 84, GROUND_Y + 6, 62, 8);
    ctx.fillStyle = darken(wood, 0.3);
    rr(ctx, 28, 340, 112, 72, 7);
    ctx.fill();
    ctx.fillStyle = wood;
    rr(ctx, 30, 336, 108, 68, 6);
    ctx.fill();
    ctx.fillStyle = darken(wood, 0.4);
    for (let i = 1; i < 3; i++) {
      rr(ctx, 30, 336 + i * 22, 108, 4, 2);
      ctx.fill();
    }
    ctx.fillStyle = darken(wood, 0.5);
    rr(ctx, 30, 336, 108, 6, 3);
    ctx.fill();
    // a coil of the flag's own rope, lying on the grass by the crate
    const rope = mix(c.raised, c.gold, 0.5);
    drawShadow(ctx, c, 162, GROUND_Y + 2, 24, 6);
    ctx.strokeStyle = darken(rope, 0.35);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(162, GROUND_Y - 10, 23 - i * 7, 8 - i * 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = lighten(rope, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(162, GROUND_Y - 12, 23, 8, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    // tufts along the lawn, so the floor is not a bare band
    ctx.strokeStyle = mix(c.bgSurface, c.good, 0.5);
    ctx.lineWidth = 3;
    for (const x of [206, 300, 372, 500, 592, 648]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 5, GROUND_Y - 2);
        ctx.lineTo(x + i * 8, GROUND_Y - 12 - (i ? 3 : 6));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawPoles(ctx, c) {
    const pole = (x, top, col) => {
      drawShadow(ctx, c, x, GROUND_Y + 6, 26, 6);
      ctx.fillStyle = darken(col, 0.45);
      rr(ctx, x - POLE_W / 2 - 2, top - 4, POLE_W + 4, GROUND_Y - top + 4, 5);
      ctx.fill();
      ctx.fillStyle = col;
      rr(ctx, x - POLE_W / 2, top - 2, POLE_W, GROUND_Y - top + 2, 4);
      ctx.fill();
      ctx.fillStyle = lighten(col, 0.55);
      rr(ctx, x - POLE_W / 2 + 1.5, top + 2, 2.5, GROUND_Y - top - 12, 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, top - 9, 7, 0, Math.PI * 2);
      ctx.fill();
      // a stone plinth at the foot of each pole
      ctx.fillStyle = darken(c.raised, 0.3);
      rr(ctx, x - 21, GROUND_Y - 11, 42, 15, 5);
      ctx.fill();
    };
    pole(POLE_A_X, POLE_A_TOP, c.s1);
    pole(POLE_B_X, POLE_B_TOP, c.s4);
    this._drawFlag(ctx, c);
    this._drawLoad(ctx, c);
  }

  // The flag is at the foot until a raise that stays up has finished: the
  // scripted fast raise on stage 1, or the learner's own on stage 0 once it
  // has come back down.
  _flagU() {
    const r = this._run;
    if (r && r.kind === 'flag') return r.u;
    return this._fast ? 1 : 0;
  }

  _drawFlag(ctx, c) {
    const u = this._flagU();
    const y = GROUND_Y - PX_PER_M * FLAG_H * u + 8;
    const x0 = POLE_A_X + POLE_W / 2;
    ctx.save();
    ctx.fillStyle = c.s1;
    ctx.beginPath();
    ctx.moveTo(x0, y - 2);
    ctx.quadraticCurveTo(x0 + 28, y - 8, x0 + 56, y - 2);
    ctx.lineTo(x0 + 56, y + 32);
    ctx.quadraticCurveTo(x0 + 28, y + 26, x0, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(c.s1, 0.32);
    ctx.beginPath();
    ctx.moveTo(x0, y + 17);
    ctx.quadraticCurveTo(x0 + 28, y + 11, x0 + 56, y + 17);
    ctx.lineTo(x0 + 56, y + 32);
    ctx.quadraticCurveTo(x0 + 28, y + 26, x0, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lighten(c.s1, 0.5);
    ctx.beginPath();
    ctx.arc(x0 + 14, y + 13, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // The whole flagpole is the tap target, not just the cloth: a phone has no
    // hover and the cloth is 56 px of a pole that is 160 tall.
    this._hit.flag = { x0: x0 - 26, x1: x0 + 62, y0: POLE_A_TOP - 20, y1: GROUND_Y + 10 };
  }

  _loadU() {
    const r = this._run;
    if (r && r.kind === 'load') return r.from + (r.to - r.from) * r.u;
    return this._load ? this._load.h : 0;
  }

  _drawLoad(ctx, c) {
    const h = this._loadU();
    const x = POLE_B_X;
    const top = GROUND_Y - PX_PER_M * h;
    if (h > 0) {
      ctx.save();
      ctx.fillStyle = alpha(c.s4, 0.85);
      rr(ctx, x - POLE_W / 2, top, POLE_W, GROUND_Y - top, 4);
      ctx.fill();
      ctx.strokeStyle = c.s4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 9, top);
      ctx.lineTo(x + 9, top);
      ctx.stroke();
      ctx.restore();
    }
    const by = GROUND_Y - PX_PER_M * h;
    ctx.save();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, by - 36);
    ctx.stroke();
    drawShadow(ctx, c, x, GROUND_Y + 6, 24, 6);
    ctx.fillStyle = c.s4;
    rr(ctx, x - 26, by - 36, 52, 42, 8);
    ctx.fill();
    ctx.fillStyle = darken(c.s4, 0.34);
    rr(ctx, x - 26, by - 14, 52, 20, 7);
    ctx.fill();
    ctx.fillStyle = lighten(c.s4, 0.4);
    rr(ctx, x - 26, by - 36, 52, 6, 3);
    ctx.fill();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, by - 37, 9, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
    this._hit.load = { x0: x - 36, x1: x + 36, y0: POLE_B_TOP - 20, y1: GROUND_Y + 10 };
  }

  // -- Cards -----------------------------------------------------------------------

  // A raised pill with a light label, not a coloured one: the ink has to read
  // against the card in both themes, and the half's colour is carried by the
  // card's own header stripe and by its pole.
  _cardHead(ctx, c, box, title, accent) {
    drawCard(ctx, c, box.x, box.y, box.w, box.h, 1, { accent });
    pill(ctx, c, title, box.x + 12, box.y + 26, { bg: c.raised, ink: c.label, size: 13, align: 'left' });
  }

  // One row, label left and value right, with a muted dash for a reading that
  // has not been earned yet. Values are posted, never redrawn per frame.
  _row(ctx, c, x, w, y, label, value, col, badge, small) {
    let lx = x + 14;
    if (badge) { drawBadge(ctx, c, badge, x + 24, y, 9); lx = x + 40; }
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, small ? 12 : 14);
    ctx.fillStyle = c.labelMuted;
    ctx.textAlign = 'left';
    ctx.fillText(label, lx, y);
    ctx.font = font(c, 800, small ? 15 : 19, true);
    ctx.fillStyle = col;
    ctx.textAlign = 'right';
    ctx.fillText(value, x + w - 14, y);
  }

  _drawFlagCard(ctx, c) {
    const b = FLAG_CARD;
    this._cardHead(ctx, c, b, 'the flag', c.s1);
    // The work is fixed by the height and the force, so it is posted from the
    // first frame and never animates and never moves, on any beat.
    this._row(ctx, c, b.x, b.w, b.rows[0], 'WORK', FLAG_WORK + ' J', c.label, this._flagSeen ? 'check' : null);
    if (this.stage >= 1) {
      this._row(ctx, c, b.x, b.w, b.rows[1], 'slow ' + PACE_SLOW + ' s',
        this._slow ? this._slow.watts + ' W' : DASH, this._slow ? c.s1 : c.labelMuted);
      this._row(ctx, c, b.x, b.w, b.rows[2], 'fast ' + PACE_FAST + ' s',
        this._fast ? this._fast.watts + ' W' : DASH, this._fast ? c.s1 : c.labelMuted);
    } else {
      this._row(ctx, c, b.x, b.w, b.rows[1], 'PACE', this.paceSecs() + ' s', c.labelMuted);
      this._row(ctx, c, b.x, b.w, b.rows[2], 'POWER',
        this._own ? this._own.watts + ' W' : DASH, this._own ? c.s1 : c.labelMuted);
    }
  }

  _drawLoadCard(ctx, c) {
    const b = LOAD_CARD;
    const live = this.stage >= 2;
    // The mass is a tag in the head, not a row: it never changes, so it has no
    // business sitting in a column the earnable readings are read down.
    this._cardHead(ctx, c, b, 'the load  ' + fmt1(LOAD_MASS) + ' kg', c.s4);
    this._row(ctx, c, b.x, b.w, b.rows[0], 'HEIGHT', live ? fmt1(this._loadH) + ' m' : DASH, live ? c.label : c.labelMuted);
    this._row(ctx, c, b.x, b.w, b.rows[1], 'TIME', live ? fmt1(this._loadT) + ' s' : DASH, live ? c.label : c.labelMuted);
    this._row(ctx, c, b.x, b.w, b.rows[2], 'WORK', this._load ? this._load.joules + ' J' : DASH, this._load ? c.label : c.labelMuted);
    this._row(ctx, c, b.x, b.w, b.rows[3], 'POWER', this._load ? this._load.watts + ' W' : DASH, this._load ? c.s4 : c.labelMuted);
  }

  // The load's first raise, fixed and muted: the 10 W every factor chip is
  // measured against, on the panel from the beat that introduces the load.
  _drawRefStrip(ctx, c) {
    if (this.stage < 2) return;
    const p = popAt(this.age, 0.4);
    const b = REF_STRIP;
    ctx.save();
    ctx.globalAlpha = p ? p.alpha : 0;
    drawCard(ctx, c, b.x, b.y, b.w, b.h, 1, { accent: c.stroke });
    pill(ctx, c, 'the first raise', b.x + 12, b.y + 22, { bg: c.raised, ink: c.label, size: 12, align: 'left' });
    this._row(ctx, c, b.x, b.w, b.rows[0], fmt1(LOAD_REF_H) + ' m in ' + fmt1(LOAD_REF_T) + ' s', LOAD_REF_WORK + ' J', c.labelMuted, null, true);
    this._row(ctx, c, b.x, b.w, b.rows[1], 'its power', LOAD_REF_POWER + ' W', c.labelMuted, null, true);
    ctx.restore();
  }

  // -- Chips -----------------------------------------------------------------------

  _drawChips(ctx, c) {
    // ink: c.label on every raised chip - the pill default is c.bgDeep, which
    // on a raised fill is 1.2:1 in both themes, i.e. unreadable.
    chipRow(ctx, c, [{ text: STAGE_CHIP[clamp(this.stage, 0, 2)], bg: c.raised, ink: c.label }], 16, 26,
      { align: 'left', age: this.age, at: 0 });
    const items = [];
    if (this.stage >= 1 && this._fast) items.push({ text: 'x2 power', bg: c.s1, age: this.age, at: 0.4 });
    if (this._load) items.push({ text: 'x' + this._factor() + ' power', bg: c.s4, age: this.age, at: 0.9 });
    if (items.length) chipRow(ctx, c, items, 664, 26, { align: 'right' });
    if (this._hint >= 0) {
      const k = 0.66 + 0.34 * (0.5 + 0.5 * Math.sin(this.clock * 3.4));
      pill(ctx, c, 'Raise the flag', 340, 468, { bg: c.s1, size: 15, alpha: k });
    }
  }

  noteRows() { return [NOTE[clamp(this.stage, 0, 2)]]; }
}
