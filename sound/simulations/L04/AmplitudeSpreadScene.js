// AmplitudeSpreadScene - blk-l04-s04 (explain), 4 beats.
// Beats 0-2: one fixed-wavelength sound wave across the panel - a particle strip
// whose dots bunch at each crest, the density curve under it with the dashed average
// line and the double-headed amplitude arrow, and a grains-on-a-sheet vignette at the
// side that answers the same dial. Beat 3: the apparatus is gone, and a point source
// sends fronts widening over the field while the learner drags a listener outward.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, alpha, mix, lighten, darken, pill, leader, rr, ellipse,
  font, mulberry32, popAt, drawBackdrop, drawCard, drawFloor, drawShadow,
  drawMeter, drawSpotlight,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';

const RAD = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// -- the wave card: strip, curve, average line, amplitude arrow ----------------------
const WAVE = { x0: 24, y0: 88, x1: 470, y1: 430 };
const AX = 44, BX = 450;             // the strip and the curve share this x span
const LAM = (BX - AX) / 3;           // 135.33 px - LOCKED, never recomputed
const ROWS = [112, 136, 160];        // the three dot rows of the strip
const DOT_R = 3.4;
const N_DOT = 28;
const S0 = (BX - AX) / N_DOT;        // 14.5 px: the dot step at level 0
const DENS_K = 0.72;                 // how hard the strip bunches at full amplitude
const AYC = 300;                     // the average density line
const AMP = 62;                      // crest half-height in px at level 1
const ARROW_X = AX + LAM / 4 + LAM; // 213.2 - the middle crest, where the arrow stands
const ARROW_MIN = 8;                 // so the double head is visible at level 0
const TAG_Y = 176;                   // the band the amplitude tags sit in
const BRACKET_Y = 380;
const MIN_AMP = 8;                   // px of arrow so a zero dial still shows heads

// -- the vignette: plate above, bowl and grains below, front between ------------------
const VIG = { x0: 486, y0: 88, x1: 656, y1: 430 };
const PLATE = { x0: 512, x1: 630, top: 150, th: 12 };
const BOWL = { x0: 506, x1: 636, rim: 330, bot: 396 };
const SHEET_Y = BOWL.rim;
const N_GRAIN = 26;
const HOP_0 = 0.04, HOP_DT = 0.35, HOP_T = 0.42, GAP_T = 0.10, HOP_T2 = 0.26, GAP2_T = 0.10;
const FRONT_V = 840;                 // px/s down the vignette
const ARRIVE = GAP_T + (SHEET_Y - (PLATE.top + PLATE.th)) / FRONT_V;   // 0.30 s
const RUN_END = ARRIVE + HOP_DT + HOP_T + GAP2_T + HOP_T2 + 0.22;      // 2.05 s
const Q_TAU = 0.5, Q_HZ = 6.0;

// -- beat 3: the point source and the listener ---------------------------------------
const B3 = {
  src: { x: 86, y: 380 },
  ground: 380,
  card: { x: 60, y: 92, w: 250, h: 84 },
  track: { x0: 230, x1: 600 },
  figH: 132,
  nFronts: 5, frontDt: 0.62, frontV: 170, rMax: 520,   // rMax clears the track's far end, so the band is never negative
  d0: 168,                          // the listener's nearest distance = a full meter
  rayA: -40 * RAD, rayB: -12 * RAD,
};
const RUN3 = B3.rMax / B3.frontV;      // 3.29 s: the run ends as the first front leaves the field

const MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];
const S_APPARATUS = 0, S_ARROW = 1, S_SHEET = 2, S_SOURCE = 3;

export class AmplitudeSpreadScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTINUOUS = false;
  static NOTE_STAGE = 0;
  static ARIA_LABEL = 'A sound wave of fixed crest spacing. A slider sets how far the crests rise from the dashed average line, and the particle strip above bunches tighter as it grows. A bowl with grains on a sheet stands at the side: tapping the plate makes the grains jump, higher at bigger amplitude. The last beat shows a point source sending widening fronts over a field; dragging the listener outward lowers the intensity reaching it.';
  static CONTROLS = [
    { type: 'slider', id: 'amplitude', label: 'amplitude', min: 0, max: 100, step: 1, value: 50 },
    { type: 'button', id: 'strike', label: 'strike plate' },
  ];

  constructor(container, config) {
    super(container, config);
    this._lvl = 0.5;                       // 0..1, what the amplitude dial says
    this._run = null;                      // { t, stage, lifted } while a strike plays
    this._ring = null;                     // time since the first lift, for the celebration
    this._emit = null;                     // { t } the beat-3 fronts, frozen at RUN3 when done
    this._going = false;
    this._drag = false;
    this._grab = 0;
    this._lx = B3.track.x0 + 24;           // the listener's distance along the ground
    this._lowDone = false;
    this._dotCache = null;
    const rnd = mulberry32(7);            // one seed: the same grains and the same dots, always
    this._grains = [];
    const rnd2 = mulberry32(23);           // the air between the plate and the sheet: it shakes in place
    this._motes = [];
    for (let i = 0; i < 46; i++) {
      this._motes.push({ x: PLATE.x0 + 8 + rnd2() * (PLATE.x1 - PLATE.x0 - 16), y: PLATE.top + PLATE.th + 10 + rnd2() * (SHEET_Y - PLATE.top - PLATE.th - 20), r: 1.4 + rnd2() * 1.3 });
    }
    for (let i = 0; i < N_GRAIN; i++) {
      this._grains.push({
        x: BOWL.x0 + 4 + ((i + 0.5) / N_GRAIN) * (BOWL.x1 - BOWL.x0 - 8) + (rnd() - 0.5) * 2.2,
        r: 2.2 + rnd() * 0.8,
        dy: (rnd() - 0.5) * 3.6,
        peak: 12 + rnd() * 58,            // px at level 1
        delay: rnd() * HOP_DT,
        again: rnd() < 0.6,
        wander: (rnd() - 0.5) * 9,
      });
    }
  }

  noteRows() {
    return [{ text: 'fronts are flat rings, spread exaggerated: same energy over more air' }];
  }

  // -- the model, all pure functions of level or run time -----------------------------

  // Local air density at x. The wave's own crests are where this peaks.
  _dens(x, lvl) { return 1 + DENS_K * lvl * Math.sin((2 * Math.PI * (x - AX)) / LAM); }

  // The density curve, in px. Amplitude is the only thing the dial moves.
  _curveY(x, lvl) { return AYC - AMP * lvl * Math.sin((2 * Math.PI * (x - AX)) / LAM); }

  crestX(k) { return AX + LAM / 4 + k * LAM; }

  // Dot x positions: step by 14.5 px worth of AIR, so denser air takes less room.
  _dotXs(lvl) {
    const lv = Math.round(lvl * 50) / 50;
    if (this._dotCache && this._dotCache.lv === lv) return this._dotCache.xs;
    const xs = [];
    for (let x = AX; x < BX;) {
      xs.push(x);
      x += S0 / this._dens(x + S0 / 2, lvl);
    }
    this._dotCache = { lv, xs };
    return xs;
  }

  // Strike timing: front down, then sheet shivering, then hops.
  _frontP(t) {
    if (t < GAP_T) return -1;
    const p = (t - GAP_T) * FRONT_V / (SHEET_Y - (PLATE.top + PLATE.th));
    return p > 1 ? -1 : p;
  }

  _quiver(t) {
    const u = t - ARRIVE;
    if (u <= 0) return 0;
    return Math.exp(-u / Q_TAU) * (1 - Math.exp(-u / 0.035));
  }

  _hopU(g, t, k) {
    const t0 = ARRIVE + HOP_0 + g.delay;
    const u = (t - t0 - (k ? HOP_T + GAP2_T : 0)) / (k ? HOP_T2 : HOP_T);
    return u > 0 && u < 1 ? u : null;
  }

  _hopH(g, u, k, lvl) { return k ? lvl * g.peak * 0.34 * 4 * u * (1 - u) : lvl * g.peak * 4 * u * (1 - u); }

  // Height of a grain above the sheet at run time t (0 = at rest).
  _grainH(g, t) {
    if (t < 0) return { h: 0, u: null };
    let u = this._hopU(g, t, 0);
    if (u !== null) return { h: this._hopH(g, u, 0, this._lvl), u };
    if (g.again) {
      u = this._hopU(g, t, 1);
      if (u !== null) return { h: this._hopH(g, u, 1, this._lvl), u };
    }
    return { h: 0, u: null };
  }

  // Beat 3: how much of the source's energy lands on one patch of the front.
  _intensity() {
    const d = this._lx - B3.src.x;
    const v = Math.pow(B3.d0 / Math.max(1, d), 2);
    return { d, v, word: v > 0.5 ? 'high' : v > 0.12 ? 'lower' : 'low' };
  }

  // -- run control -------------------------------------------------------------------

  _strike() {
    this._run = { t: 0, stage: this.stage, lifted: false };
    this._ring = null;
    this.animateFor(2600);
  }

  // The fronts widen out once and stop where they stand: t freezes at RUN3 and
  // `_going` goes false, so the field keeps its fronts after the run.
  _emitFronts() {
    this._emit = { t: 0 };
    this._going = true;
    this.animateFor(4000);
  }

  enter(stage) {
    this._run = null;
    this._ring = null;
    if (stage === S_SHEET) {
      this.animateFor(2600);
      this.after(0.35, () => this._strike());      // the beat's own moment, on screen
    }
    if (stage === S_SOURCE) {
      this._lx = B3.track.x0 + 24;                  // near end: the fall is the learner's to watch
      this._lowDone = false;
      this._lowAt = undefined;
      this._emitFronts();
    } else {
      this._emit = null;
      this._going = false;
    }
  }

  update(d) {
    const r = this._run;
    if (r) {
      r.t += d;
      if (!r.lifted && r.t >= ARRIVE + HOP_0) {
        r.lifted = true;
        if (r.stage === this.stage) { this._ring = 0; this.flash(0.2); }
      }
      if (this._ring !== null && (this._ring += d) > 0.6) this._ring = null;
      if (r.t >= RUN_END) this._run = null;
    }
    if (this._going && (this._emit.t += d) >= RUN3) { this._emit.t = RUN3; this._going = false; }
    if (this.stage === S_SOURCE && !this._lowDone && this._intensity().word === 'low') {
      this._lowDone = true;
      this._lowAt = 0;                              // the ring that marks the far end
    }
    if (this._lowDone && this._lowAt !== undefined && (this._lowAt += d) > 0.8) this._lowAt = undefined;
  }

  busy() { return !!this._run || this._going || this._drag; }

  // -- the host's control bar --------------------------------------------------------

  isControlHidden(id) {
    return this.stage === S_SOURCE && (id === 'amplitude' || id === 'strike');
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'amplitude') this._lvl = clamp(Number(v) / 100, 0, 1);
    else if (id === 'strike') this._strike();
    this.requestUiUpdate?.();
  }

  getControlValue(id) {
    return id === 'amplitude' ? Math.round(this._lvl * 100) : super.getControlValue(id);
  }

  // -- pointer: tap the plate to strike, drag the listener on beat 3 -----------------

  pointerDown(p) {
    if (this.stage === S_SOURCE) {
      this.animateFor(6400);
      if (Math.hypot(p.x - B3.src.x, p.y - (B3.src.y - 12)) < 46) { this._emitFronts(); return; }
      if (this._near(p)) {
        this._drag = true;
        // grabbed ON the figure, it keeps its grip; tapped anywhere else in the
        // band, the listener walks to that spot - a tap is a move, not a dead click
        this._grab = Math.abs(p.x - this._lx) < 46 ? p.x - this._lx : 0;
        this._move(p);
      }
      return;
    }
    this.animateFor(2600);
    if (this._onPlate(p)) this._strike();
  }

  pointerMove(p) {
    if (!this._drag) return false;
    this._move(p);
    this.animateFor(400);
    return true;
  }

  pointerUp() { this._drag = false; }

  _onPlate(p) {
    return p.x > PLATE.x0 - 24 && p.x < PLATE.x1 + 24 && p.y > PLATE.top - 26 && p.y < PLATE.top + PLATE.th + 26;
  }

  // Generous: anywhere in the band the listener stands in, or on the track itself,
  // grabs it. A phone finger is 40 px wide and the figure is 132 tall.
  _near(p) {
    return p.x > B3.track.x0 - 60 && p.x < B3.track.x1 + 60
      && p.y > B3.ground - B3.figH - 34 && p.y < B3.ground + 16;
  }

  _move(p) {
    this._lx = clamp(p.x - (this._grab || 0), B3.track.x0, B3.track.x1);
    this._lowAt = undefined;
  }

  // -- drawing -----------------------------------------------------------------------

  draw(ctx, c) {
    const t = this.clock;
    drawBackdrop(ctx, c, 'dots', { t });
    if (this.stage === S_SOURCE) { this._beat3(ctx, c, t); return; }
    this._wave(ctx, c, t);
    this._vignette(ctx, c, t);
    this._waveTags(ctx, c, t);
  }

  // -- beats 0-2: the wave ------------------------------------------------------------

  _wave(ctx, c, t) {
    const lvl = this._lvl;
    drawCard(ctx, c, WAVE.x0, WAVE.y0, WAVE.x1 - WAVE.x0, WAVE.y1 - WAVE.y0, 1, { accent: c.accent });
    this._strip(ctx, c, lvl);
    this._curve(ctx, c, lvl);
    this._arrow(ctx, c, lvl, t);
    this._bracket(ctx, c);
  }

  // The strip: one density field, three rows, so a compression band is a vertical slab.
  _strip(ctx, c, lvl) {
    const xs = this._dotXs(lvl);
    ctx.fillStyle = mix(c.accent, c.label, 0.28);
    for (const x of xs) for (const y of ROWS) { ellipse(ctx, x, y, DOT_R, DOT_R); ctx.fill(); }
  }

  _curve(ctx, c, lvl) {
    // the lobe between the curve and the average line
    ctx.fillStyle = alpha(c.accent, 0.12);
    ctx.beginPath();
    ctx.moveTo(AX, AYC);
    for (let x = AX; x <= BX; x += 4) ctx.lineTo(x, this._curveY(x, lvl));
    ctx.lineTo(BX, AYC);
    ctx.closePath();
    ctx.fill();
    // faint drops from the strip's crests to the curve's, so the two are one air
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.2);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    for (let k = 0; k < 3; k++) {
      const x = this.crestX(k);
      ctx.beginPath();
      ctx.moveTo(x, ROWS[2] + 8);
      ctx.lineTo(x, this._curveY(x, lvl));
      ctx.stroke();
    }
    ctx.restore();
    // the curve itself
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = AX; x <= BX; x += 4) {
      const y = this._curveY(x, lvl);
      if (x === AX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // the average line the arrow is measured from
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.55);
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(AX - 6, AYC);
    ctx.lineTo(BX + 8, AYC);
    ctx.stroke();
    ctx.restore();
  }

  // The double-headed arrow: the greatest change from the average, and nothing else.
  _arrow(ctx, c, lvl, t) {
    const hot = this.stage === S_ARROW;
    const len = Math.max(MIN_AMP, AMP * lvl);
    const top = AYC - len;
    const col = hot ? lighten(c.warning, 0.22) : c.warning;
    if (hot) {
      const p = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.fillStyle = alpha(c.warning, 0.1 + 0.06 * p);
      rr(ctx, ARROW_X - 22, top - 16, 44, len + 32, 16);
      ctx.fill();
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = hot ? 4.5 : 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ARROW_X, top + 6);
    ctx.lineTo(ARROW_X, AYC - 6);
    ctx.stroke();
    const head = (y, dir) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(ARROW_X, y);
      ctx.lineTo(ARROW_X - 9, y + 12 * dir);
      ctx.lineTo(ARROW_X + 9, y + 12 * dir);
      ctx.closePath();
      ctx.fill();
    };
    head(top + 2, 1);
    head(AYC - 2, -1);
    // where the arrow stands, so the tag has something to point at
    ctx.fillStyle = col;
    ellipse(ctx, ARROW_X, AYC, 4.5, 4.5);
    ctx.fill();
  }

  // The locked spacing: crest to crest, with the middle crest ticked.
  _bracket(ctx, c) {
    const x0 = this.crestX(0), x2 = this.crestX(2), xm = this.crestX(1);
    ctx.strokeStyle = alpha(c.label, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, BRACKET_Y);
    ctx.lineTo(x2, BRACKET_Y);
    for (const x of [x0, xm, x2]) { ctx.moveTo(x, BRACKET_Y - 7); ctx.lineTo(x, BRACKET_Y + 7); }
    ctx.stroke();
  }

  // -- the vignette: the same energy, shown as grains --------------------------------

  _vignette(ctx, c, t) {
    const rt = this._run ? this._run.t : -1;
    const lvl = this._lvl;
    if (this.stage === S_SHEET) {
      const pop = popAt(this.age, 0);
      if (pop) drawSpotlight(ctx, c, (VIG.x0 + VIG.x1) / 2, (VIG.y0 + VIG.y1) / 2, 190, 0.5 * pop.alpha);
      ctx.strokeStyle = alpha(c.gold, 0.85 * (1 - Math.min(1, this.age / 0.7)));
      ctx.lineWidth = 3;
      rr(ctx, VIG.x0 - 2, VIG.y0 - 2, VIG.x1 - VIG.x0 + 4, VIG.y1 - VIG.y0 + 4, 12);
      ctx.stroke();
    }
    drawCard(ctx, c, VIG.x0, VIG.y0, VIG.x1 - VIG.x0, VIG.y1 - VIG.y0, 1, { accent: c.gold });
    this._motesDraw(ctx, c, rt);
    this._plate(ctx, c, rt);
    this._front(ctx, c, rt);
    this._bowl(ctx, c, rt, lvl);
    if (this.stage === S_APPARATUS) {
      // a soft ring round the plate: the only tappable thing on this beat
      const p = 0.5 + 0.5 * Math.sin(t * 2.6);
      ctx.strokeStyle = alpha(c.gold, 0.3 + 0.35 * p);
      ctx.lineWidth = 2;
      rr(ctx, PLATE.x0 - 12, PLATE.top - 12, PLATE.x1 - PLATE.x0 + 24, PLATE.th + 24, 10);
      ctx.stroke();
    }
    // the tag, only while grains are off the sheet
    let air = 0;
    for (const g of this._grains) air = Math.max(air, this._grainH(g, rt).h);
    if (air > 6) {
      const box = pill(ctx, c, 'more energy', VIG.x0 + 8, VIG.y0 + 12, { bg: c.gold, size: 14, align: 'left' });
      leader(ctx, box.x0 + box.w / 2, box.y0 + box.h, PLATE.x0 + 18, PLATE.top + PLATE.th, alpha(c.gold, 0.7), 0.8, t);
    }
  }

  // Air motes: they shake sideways as the front passes and return to the same spot.
  _motesDraw(ctx, c, rt) {
    const p = this._frontP(rt);
    for (const m of this._motes) {
      let o = 0;
      if (p >= 0) {
        const near = Math.abs(m.y - (PLATE.top + PLATE.th + p * (SHEET_Y - PLATE.top - PLATE.th)));
        if (near < 26) o = (1 - near / 26) * 2.6 * Math.sin(p * 22 + m.x * 0.05);
      }
      ctx.fillStyle = alpha(c.label, 0.3);
      ellipse(ctx, m.x + o, m.y, m.r, m.r);
      ctx.fill();
    }
  }

  _plate(ctx, c, rt) {
    const steel = mix(c.stroke, c.label, 0.45);
    const q = rt < 0 ? 0 : this._quiver(rt - ARRIVE) * 5 * this._lvl;
    const dy = Math.sin((rt < 0 ? 0 : rt) * 90) * q;
    ctx.fillStyle = steel;
    rr(ctx, PLATE.x0, PLATE.top + dy, PLATE.x1 - PLATE.x0, PLATE.th, 3);
    ctx.fill();
    ctx.fillStyle = lighten(steel, 0.32);
    rr(ctx, PLATE.x0 + 3, PLATE.top + dy + 1.5, PLATE.x1 - PLATE.x0 - 6, 3.5, 1.75);
    ctx.fill();
    if (rt >= 0 && rt < 0.18) {                    // the tap itself, on the plate
      ctx.fillStyle = alpha(c.gold, 0.9 * (1 - rt / 0.18));
      ellipse(ctx, (PLATE.x0 + PLATE.x1) / 2, PLATE.top + dy + 4, 12 + 40 * (rt / 0.18), 4 + 12 * (rt / 0.18));
      ctx.fill();
    }
  }

  // The front, bowing down the gap from the plate to the sheet.
  _front(ctx, c, rt) {
    const p = this._frontP(rt);
    if (p < 0) return;
    const y0 = PLATE.top + PLATE.th, y1 = SHEET_Y;
    const y = y0 + (y1 - y0) * p;
    const inset = 22 * (1 - p) + 3;
    ctx.strokeStyle = alpha(c.accent, 0.85 * (1 - p * 0.35));
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(PLATE.x0 + inset, y - 5 * p);
    ctx.quadraticCurveTo((PLATE.x0 + PLATE.x1) / 2, y + 10 * p, PLATE.x1 - inset, y - 5 * p);
    ctx.stroke();
  }

  _bowl(ctx, c, rt, lvl) {
    const { x0, x1, rim, bot } = BOWL;
    const q = rt < 0 ? 0 : this._quiver(rt) * 3.5 * lvl;
    const clay = mix(c.gold, c.bgDeep, 0.28);
    drawShadow(ctx, c, (x0 + x1) / 2, bot + 6, 52, 9);
    ctx.fillStyle = clay;
    ctx.beginPath();
    ctx.moveTo(x0, rim);
    ctx.bezierCurveTo(x0 + 3, rim + 40, x0 + 26, bot, (x0 + x1) / 2, bot);
    ctx.bezierCurveTo(x1 - 26, bot, x1 - 3, rim + 40, x1, rim);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(clay, 0.32);            // inside the rim
    ctx.beginPath();
    ctx.moveTo(x0 + 6, rim + 3);
    ctx.quadraticCurveTo((x0 + x1) / 2, rim + 20, x1 - 6, rim + 3);
    ctx.lineTo(x1 - 8, rim);
    ctx.lineTo(x0 + 8, rim);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lighten(clay, 0.18);
    rr(ctx, x0 - 5, rim + 3, x1 - x0 + 10, 8, 4);
    ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.label, 0.5);  // a peg at each end of the sheet
    for (const px of [x0 + 3, x1 - 3]) { rr(ctx, px - 3, rim - 8, 6, 15, 2); ctx.fill(); }
    ctx.strokeStyle = c.glass;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const x = x0 + 2 + ((x1 - x0 - 4) * i) / 20;
      const y = SHEET_Y - (rt < 0 ? 0 : Math.sin((rt - ARRIVE) * 38) * q);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    this._grainsDraw(ctx, c, rt);
    this._ringDraw(ctx, c, rt);
  }

  _grainsDraw(ctx, c, rt) {
    for (const g of this._grains) {
      const { h, u } = this._grainH(g, rt);
      const x = clamp(g.x + (u === null ? 0 : g.wander * Math.sin(Math.PI * u)), BOWL.x0 + 4, BOWL.x1 - 4);
      const y = SHEET_Y - 3 - g.dy - h;
      ctx.fillStyle = h > 3 ? lighten(c.gold, 0.18) : mix(c.gold, c.bgDeep, 0.3);
      ellipse(ctx, x, y, g.r, g.r * 0.76);
      ctx.fill();
      if (h > 8) {
        ctx.fillStyle = alpha(lighten(c.gold, 0.42), 0.85);
        ellipse(ctx, x - g.r * 0.25, y - g.r * 0.4, g.r * 0.5, g.r * 0.3);
        ctx.fill();
      }
    }
  }

  // A ring on the sheet as the first grains take off: no confetti, it reads as debris.
  _ringDraw(ctx, c, rt) {
    if (this._ring === null || this._ring === undefined) return;
    const u = clamp(this._ring / 0.6, 0, 1);
    if (u <= 0 || u >= 1) return;
    const cx = (BOWL.x0 + BOWL.x1) / 2;
    ctx.strokeStyle = alpha(c.gold, 0.85 * (1 - u));
    ctx.lineWidth = 4;
    ellipse(ctx, cx, SHEET_Y - 4, 14 + 56 * u, 5 + 16 * u);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI + (i * Math.PI) / 7;
      const d = 22 + 48 * u;
      const s = (1 - u) * 6;
      if (s < 0.6) continue;
      ctx.fillStyle = alpha(lighten(c.gold, 0.3), 1 - u);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, SHEET_Y - 6 + Math.sin(a) * d * 0.3, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -- the wave card's tags ----------------------------------------------------------

  _waveTags(ctx, c, t) {
    const bg = mix(c.bgSurface, c.label, 0.16);
    const lvl = this._lvl;
    const len = Math.max(MIN_AMP, AMP * lvl);
    // the arrow's own tag, swapped on beat 1 without moving
    const text = this.stage === S_ARROW ? 'max change from average' : 'amplitude';
    const col = this.stage === S_ARROW ? c.warning : c.accent;
    const box = pill(ctx, c, text, 226, TAG_Y, { bg, size: 14, align: 'left' });
    leader(ctx, box.x0 + 20, box.y0 + box.h, ARROW_X, AYC - len, alpha(col, 0.8), 0.9, t);
    // what the dashed line is
    const dbox = pill(ctx, c, 'average density', 40, TAG_Y, { bg, size: 14, align: 'left' });
    leader(ctx, dbox.x0 + 16, dbox.y0 + dbox.h, AX - 4, AYC, alpha(c.label, 0.55), 0.85, t);
    // the locked spacing, named under its bracket
    pill(ctx, c, 'spacing stays the same', ARROW_X, BRACKET_Y + 14, { bg, size: 14, col: c.labelMuted });
  }

  // -- beat 3: the point source ------------------------------------------------------

  _beat3(ctx, c, t) {
    drawFloor(ctx, c, B3.ground);
    const I = this._intensity();
    this._field(ctx, c, t, I);
    this._source(ctx, c, t);
    this._listener(ctx, c, t, I);
    this._tags3(ctx, c, t, I);
    this._intensityCard(ctx, c, I);
  }

  // Wedge, rays, and the fronts - all clipped to the air above the ground.
  _field(ctx, c, t, I) {
    const { src, rayA, rayB, rMax } = B3;
    ctx.save();
    ctx.beginPath();                       // clipped to the air above the ground only: a front
    ctx.rect(0, 0, ZONES.heroWide.x + ZONES.heroWide.w, B3.ground);   // leaves the top edge, it does not get chopped
    ctx.clip();
    // the widening sector: the same energy, over more and more of the field
    ctx.fillStyle = alpha(c.accent, 0.09);
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.arc(src.x, src.y, rMax, rayA, rayB);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.3);
    ctx.lineWidth = 2;
    ctx.save();
    ctx.setLineDash([6, 7]);
    for (const a of [rayA, rayB]) {
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(src.x + Math.cos(a) * rMax, src.y + Math.sin(a) * rMax);
      ctx.stroke();
    }
    ctx.restore();
    // the fronts, as they widen out and stop where they stand
    if (this._emit) {
      for (let j = 0; j < B3.nFronts; j++) {
        const age = this._emit.t - j * B3.frontDt;
        if (age <= 0) continue;
        const r = Math.min(age * B3.frontV, rMax);
        const u = r / rMax;
        ctx.strokeStyle = alpha(c.accent, 0.8 * (1 - 0.45 * u));
        ctx.lineWidth = 4 - 1.6 * u;
        ctx.beginPath();
        ctx.arc(src.x, src.y, r, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    }
    // the front standing at the listener's distance: the same arc, drawn heavier,
    // with the patch it now covers shaded - that patch is what "intensity" is per
    ctx.strokeStyle = alpha(c.accent, 0.16);
    ctx.lineWidth = B3.rMax - I.d;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(src.x, src.y, I.d + (B3.rMax - I.d) / 2, rayA, rayB);
    ctx.stroke();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(src.x, src.y, I.d, rayA, rayB);
    ctx.stroke();
    ctx.fillStyle = c.gold;                       // where that front meets the listener
    ellipse(ctx, src.x + I.d, src.y - 2, 5.5, 5.5);
    ctx.fill();
    // one soft ring where the readout first reads low
    if (this._lowAt !== undefined) {
      const u = clamp(this._lowAt / 0.8, 0, 1);
      ctx.strokeStyle = alpha(c.gold, 0.8 * (1 - u));
      ctx.lineWidth = 4;
      ellipse(ctx, src.x + I.d, B3.ground - 6, 16 + 60 * u, 6 + 20 * u);
      ctx.stroke();
    }
    ctx.restore();
  }

  _source(ctx, c, t) {
    const { x, y } = B3.src;
    const p = 0.5 + 0.5 * Math.sin(t * 2.2);
    ctx.fillStyle = alpha(c.accent, 0.16 + 0.08 * p);
    ellipse(ctx, x, y, 20, 20);
    ctx.fill();
    ctx.fillStyle = c.accent;
    ellipse(ctx, x, y, 9, 9);
    ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 12); ctx.lineTo(x + 16, y + 12);
    ctx.stroke();
  }

  _listener(ctx, c, t, I) {
    const { x0, x1, ground, figH } = B3;
    const lx = this._lx;
    // the track it slides along
    ctx.strokeStyle = alpha(c.label, 0.28);
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.moveTo(x0, ground - 8);
    ctx.lineTo(x1, ground - 8);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const x of [x0, x1]) {
      ctx.fillStyle = alpha(c.label, 0.4);
      ellipse(ctx, x, ground - 8, 4, 4);
      ctx.fill();
    }
    drawShadow(ctx, c, lx, ground + 4, 30, 8);
    drawFigure(ctx, c,
      { x: lx, y: ground, height: figH, facing: -1, pose: 'stand' },
      { top: c.s4, skin: 1, hairStyle: 'short', mood: 'smile', t });
    // the ears face the source, and the front reaches them
    ctx.fillStyle = alpha(c.gold, 0.9);
    ellipse(ctx, lx - 7, ground - figH * 0.88, 3, 3);
    ctx.fill();
  }

  _tags3(ctx, c, t, I) {
    const bg = mix(c.bgSurface, c.label, 0.16);
    const box = pill(ctx, c, 'point source', 96, 330, { bg, size: 14 });
    leader(ctx, box.x0 + box.w / 2, box.y0, B3.src.x, B3.src.y - 14, alpha(c.label, 0.55), 0.85, t);
    // the widening sector's tag sits in the fixed top-right air, clear of everything that moves
    const mid = (B3.rayA + B3.rayB) / 2;
    const tag = pill(ctx, c, 'same energy, more air', 470, 112, { bg: mix(c.bgSurface, c.gold, 0.3), size: 14 });
    leader(ctx, tag.x0 + tag.w / 2, tag.y0 + tag.h,
      B3.src.x + Math.cos(mid) * I.d, B3.src.y + Math.sin(mid) * I.d, alpha(c.gold, 0.75), 0.8, t);
    // the listener's own name, beside its head, never across it
    const lb = pill(ctx, c, 'listener', clamp(this._lx - 122, 14, 640), B3.ground - B3.figH - 22, { bg, size: 14, align: 'left' });
    leader(ctx, lb.x0 + lb.w / 2, lb.y0 + lb.h, this._lx - 6, B3.ground - B3.figH * 0.9, alpha(c.label, 0.55), 0.85, t);
  }

  // The readout: one word and one shrinking meter. No decibels, no number.
  _intensityCard(ctx, c, I) {
    const k = B3.card;
    drawCard(ctx, c, k.x, k.y, k.w, k.h, 1, { accent: c.accent });
    pill(ctx, c, 'what arrives here', k.x + 12, k.y + 22, { bg: c.accent, size: 14, align: 'left' });
    const ry = k.y + 46;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = font(c, 700, 15);
    ctx.fillStyle = c.label;
    ctx.fillText('intensity', k.x + 14, ry);
    ctx.textAlign = 'right';
    ctx.font = font(c, 800, 19, true);
    ctx.fillStyle = I.word === 'low' ? c.warning : I.word === 'lower' ? c.gold : c.good;
    ctx.fillText(I.word, k.x + k.w - 14, ry);
    drawMeter(ctx, c, k.x + 14, ry + 14, k.w - 28, 12, clamp(I.v, 0, 1),
      { col: I.word === 'low' ? c.warning : c.good });
  }
}
