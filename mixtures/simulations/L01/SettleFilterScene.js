// SettleFilterScene.js - the settling clock and the filter-paper cone, on the bench of L01.
//
// Two slides, told apart by beat count.
//   3  blk-l01-s04, the three beakers of MixtureBenchScene.
//      b0 leave them ten minutes: only B changes. b1 pour each through paper: B leaves chalk, C runs
//      through cloudy. b2 all three tests as one row of discs under each beaker, filled where the test
//      found something: A none, B all three, C only the beam. That pattern is the lesson.
//   2  blk-l01-s07, a beaker and a saline bottle. Every test finds nothing on either. b1 sets the two
//      amounts of salt beside them, which no test measured.
//
// Rules this file follows (briefs/reference/scene-rules.md has the rest):
//   - colours only from `c` (this.colors) and mix/alpha/lighten/darken of them, never a hex
//   - a run is credited to the stage that launched it, delayed work uses this.after()
//   - busy() is true while anything that matters moves; every run ends on its own
//   - onControlChange starts with the _guard, and the host sends segmented values as STRINGS
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, lighten, darken, rr, pill,
  inOutSine, outBack, drawBackdrop, drawDepth, drawNoteLine, drawShadow, font, inkOn,
} from 'simulations/base/kit/SimLook.js';
import {
  BENCH, BENCH3, GLASS,
  beakerBox, benchLiquid, liquidLevel, scatterGrains, settledGrain,
  drawBenchBackdrop, drawBeaker, drawPaperLabel, drawLiquid, drawSediment,
  drawChalk, drawClock, drawBeam,
} from './MixtureBenchKit.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

// -- the benches ------------------------------------------------------------------------------
// The s04 bench is the sibling scene's bench to the pixel: the same three beakers at the same x.
// The s07 bench is a different bench - one labelled beaker and one glass drip bottle, both clear.
const VESSELS_S04 = [
  { key: 'A', cx: BENCH3.cx.A, shape: 'beaker', label: 'A', labelSize: fs(22), labelY: 34, holds: null, cake: false, found: [0, 0, 0] },
  { key: 'B', cx: BENCH3.cx.B, shape: 'beaker', label: 'B', labelSize: fs(22), labelY: 34, holds: 'chalk', cake: true, found: [1, 1, 1] },
  { key: 'C', cx: BENCH3.cx.C, shape: 'beaker', label: 'C', labelSize: fs(22), labelY: 34, holds: null, cake: false, found: [1, 0, 0] },
];
const VESSELS_S07 = [
  { key: 'beaker', cx: 158, shape: 'beaker', label: 'beaker', labelSize: fs(18), labelY: 34, holds: null, cake: false, salt: { g: '10 g', rx: 54, ry: 36 } },
  { key: 'bottle', cx: 452, shape: 'bottle', label: 'saline', labelSize: fs(18), labelY: 56, holds: null, cake: false, salt: { g: '0.9 g', rx: 15, ry: 9 } },
];
const BOTTLE = { w: 134, h: 240 };              // the drip bottle's drawn body and neck
const SIZE = { w: BENCH3.w, h: BENCH3.h };
const TESTS = ['beam', 'clock', 'paper'];

// -- the model's own numbers (design note, "Model numbers") ------------------------------------
const DEPTH = beakerBox(BENCH3.cx.A, SIZE).floor - liquidLevel(beakerBox(BENCH3.cx.A, SIZE), BENCH3.frac);
const GRAIN_N = 32;                  // chalk grains held up in B
const GRAIN_SEED = 7;
const SETTLE_S = 4.0;                // the ten-minute run, compressed
const FALL_S = 1.5;                  // how long one grain takes to reach the bed
const SED_FRAC = 0.2;                // the bed's final depth, as a share of B's liquid depth
const MOVE_S = 0.35;                 // the filter stand travelling to a new vessel
const LOWER_S = 0.68;                // travel done, and the cone fully seated
const POUR_S = 2.85;                 // the pour itself; the result then stands
const START_F = BENCH3.frac;          // the level before anything is poured
const LOW_F = 0.05;                  // the lowest the level gets, mid-pour
const END_F = 0.54;                  // the filtrate that stands afterwards
const CLOCK = { cx: 56, cy: 96, r: 30 };
const ARM_Y = 104;                   // the filter stand's horizontal arm
const HANG_Y = 112;                  // where a cone hangs, clear of every rim
const PARK_ROD = 648;                // the stand's resting place at the right end of the bench
const PARK_CONE = 600;               // ...with its cone out on the arm, clear of every rim
const CONE_HW_PARK = 40;             // a parked cone hangs further off and reads a little smaller

const S_CLOCK = 0, S_PAPER = 1, S_ALL = 2;
const S_SAME = 0, S_AMOUNT = 1;
const PAPER_CARD = [S_CLOCK, S_PAPER, S_ALL].map((i) => [{ idx: i, dwellMs: null }]);
const PAPER_BOTTLE = [S_SAME, S_AMOUNT].map((i) => [{ idx: i, dwellMs: null }]);

export class SettleFilterScene extends SimScene {
  static BEAT_STEP_MAP = PAPER_CARD;
  static BEAT_MAPS = { 3: PAPER_CARD, 2: PAPER_BOTTLE };
  static CONTROLS_IN_SIGHT = true;
  static NOTE_STAGE = 0;
  static ARIA_LABEL =
    'A wooden bench of glassware. On the three-beaker bench: A nearly clear, B cloudy with chalk grains, C evenly '
    + 'cloudy with milk. Leaving them ten minutes settles B into a pale layer while A and C do not change. Pouring '
    + 'through filter paper leaves chalk on the paper from B; A and C run through and leave nothing, and C is still cloudy. '
    + 'The last view shows which tests found something: none for A, all three for B, only the beam for C. '
    + 'On the two-container bench a beaker and a saline bottle stand clear, and no test finds anything in either, '
    + 'although one holds 10 g of salt and the other 0.9 g.';
  static CONTROLS = [
    { type: 'button', id: 'settle', label: 'Leave it 10 minutes' },
    { type: 'segmented', id: 'which', label: 'Which beaker', value: 'A', options: ['A', 'B', 'C'] },
    { type: 'segmented', id: 'which2', label: 'Which one', value: 'beaker', options: [
      { value: 'beaker', label: 'Beaker' }, { value: 'bottle', label: 'Bottle' }] },
    { type: 'button', id: 'pour', label: 'Pour through the paper' },
  ];

  constructor(container, config) {
    super(container, config);
    // Grains are scattered ONCE and only re-positioned afterwards: re-scattering at the start of a
    // run would read as a different liquid each time, which is the one thing this bench is about.
    this._grains = scatterGrains(GRAIN_N, GRAIN_SEED, { depth: DEPTH });
    this._vessels = null;            // built once the mount is known
    this._built = false;
    this._started = false;           // enter(0) resets ONCE - later beats inherit what was made
    this._clockRun = null;           // { t, stage } while the ten minutes are passing
    this._clockDone = false;         // the clock has been run through at least once
    this._p = 0;                     // the clock hand, 0..1
    this._pour = null;               // { key, t, stage, fromX, toX } while a pour is going
    this._move = null;               // { from, to, t } while the stand travels
    this._aim = null;                // the vessel key the stand is over
    this._drag = false;
    this._foundMilk = false;
    this._held = null;
  }

  noteRows() {
    if (PHONE || this._mount === 's07' || this.stage !== S_CLOCK) return [];   // the note is about the clock; at phone size it cannot be read
    return [{ text: 'ten minutes, shown in about four seconds' }];
  }

  // -- which mount this is ----------------------------------------------------------------------
  // Fail-closed: before the beat count lands (it reads 0 for the single frame SimScene paints
  // inside setup()) the mount reads s07 - the bench that cannot show a sediment by accident.
  get _mount() { return this.beatCount === 3 ? 's04' : 's07'; }
  get _known() { return this.beatCount !== 0 || this.age > 0.25; }

  /** Build the bench for this mount. Every mount is fresh, so this never runs twice. */
  _ensureMount() {
    if (this._built || !this._known) return;
    this._built = true;
    const list = this._mount === 's04' ? VESSELS_S04 : VESSELS_S07;
    this._vessels = list.map((v) => {
      const box = v.shape === 'bottle' ? beakerBox(v.cx, BOTTLE) : beakerBox(v.cx, SIZE);
      return { ...v, box, half: box.w / 2 - 2, rodX: v.cx + box.w / 2 + 30, state: { poured: false } };
    });
    this._aim = this._vessels[0].key;
  }

  /**
   * The bench is reset once, on the first enter, so what the learner produced is still standing on the
   * next beat. The last beat of the three-beaker bench needs every result, so it finishes any test the
   * learner skipped: a lesson resumed there, or a learner who only read, sees the same end state.
   */
  enter(stage) {
    this._ensureMount();
    this._age0 = this.clock;
    if (!this._started) {
      this._started = true;
      this._clockRun = null;
      this._pour = null;
      this._move = null;
      this._p = 0;
      this._clockDone = false;
      this._drag = false;
      this._foundMilk = false;
      if (this._vessels) for (const v of this._vessels) v.state.poured = false;
    }
    if (this._mount !== 's04' || !this._vessels) return;
    if (stage === S_ALL) {
      this._clockRun = null; this._pour = null; this._move = null;
      this._held = { p: this._p, done: this._clockDone, poured: this._vessels.map((v) => v.state.poured) };
      this._p = 1; this._clockDone = true;
      for (const v of this._vessels) v.state.poured = true;
    } else if (this._held) {                 // back from the summary: the learner's own bench again
      this._p = this._held.p; this._clockDone = this._held.done;
      this._vessels.forEach((v, i) => { v.state.poured = this._held.poured[i]; });
      this._held = null;
    }
  }

  isControlHidden(id) {
    if (this._mount === 's07') return id === 'which' || this.stage === S_AMOUNT;
    if (id === 'which2') return true;
    if (id === 'settle') return this.stage !== S_CLOCK;
    return this.stage !== S_PAPER;
  }

  getControlValue(id) {
    if (id === 'which' || id === 'which2') return this._aim ?? (id === 'which' ? 'A' : 'beaker');
    return super.getControlValue(id);
  }

  get _aimed() { return this._vessels?.find((v) => v.key === this._aim) ?? null; }

  /** Where the stand's rod is now: mid-travel it eases between the two, otherwise it is parked. */
  get _standX() {
    const m = this._move;
    if (!m) return this._aimed ? this._aimed.rodX : PARK_ROD;
    return lerp(m.from, m.to, inOutSine(clamp01(m.t / MOVE_S)));
  }

  // -- the two runs -----------------------------------------------------------------------------
  /**
   * Ten minutes, compressed. The clock hand sweeps and B's grains fall into a bed; A and C have no
   * time term at all in this model, so the clock leaves them pixel-identical.
   */
  _launchSettle() {
    if (!this._vessels) return;
    this._pour = null;
    this._clockRun = { t: 0, stage: this.stage };
    this._clockDone = false;
    this.animateFor(600);
  }

  /**
   * The pour. The cone is seated in the aimed beaker's own mouth and the filtrate drips off its tip
   * back into it, so the result ends up standing in the glass the learner is looking at and all
   * three results can be compared side by side afterwards.
   */
  _launchPour() {
    const v = this._aimed;
    if (!v) return;
    v.state.poured = false;
    this._clockRun = null;
    this._move = null;
    this._pour = { key: v.key, t: 0, stage: this.stage, fromX: this._standX, toX: v.rodX };
    this.animateFor(800);
    if (v.key === 'C' && this._mount === 's04') this.after(POUR_S + 0.1, () => this._milkFound());
  }

  /** The find: C has run through the paper, nothing is on it, and it is still cloudy. */
  _milkFound() {
    if (this._foundMilk) return;
    this._foundMilk = true;
    const v = this._vessels.find((x) => x.key === 'C');
    this.celebrate(v.box.cx, v.box.y + 120, 22, { key: 'milk-passes', lookAt: true });
  }

  /** u is how far through the pour itself this vessel is, 0..1. */
  get _u() {
    const r = this._pour;
    if (!r) return 0;
    return clamp01((r.t - LOWER_S) / (POUR_S - LOWER_S));
  }

  /** The level in a vessel that is mid-pour or already poured. */
  _levelFrac(u) {
    if (u >= 0.85) return END_F;
    if (u < 0.42) return lerp(START_F, LOW_F, u / 0.42);
    return lerp(LOW_F, END_F, (u - 0.42) / 0.43);
  }

  /** How much liquid is standing in the cone: it fills as the beaker empties, then drains. */
  _coneFill(u) {
    if (u <= 0.42) return u / 0.42;
    return Math.max(0, 1 - (u - 0.42) / 0.43);
  }

  /** The sediment a vessel is showing: the clock's bed in B, and nothing anywhere ever else. */
  _sedPx(v) {
    if (!v.holds || v.state.poured) return 0;
    const t = this._clockRun ? Math.max(0, (this._p - 0.3) / 0.7) : (this._clockDone ? 1 : 0);
    return SED_FRAC * DEPTH * t;
  }

  /** Where one chalk grain is drawn, in the beaker-local scatter space `drawChalk` expects. */
  _grainAt(g) {
    const sedPx = SED_FRAC * DEPTH;
    const row = g.bed * (sedPx * 0.55);
    const to = 1 - (row + 3) / DEPTH;
    if (!this._clockRun) return settledGrain(g, this._clockDone ? 1 : 0, { settledGy: to });
    const start = g.rank * (SETTLE_S - FALL_S - 0.2);
    const raw = clamp01((this._clockRun.t - start) / FALL_S);
    return settledGrain(g, raw * raw, { settledGy: to });     // eases in: a grain falls slowly at first
  }

  // -- the loop ---------------------------------------------------------------------------------
  update(d) {
    if (this._move) {
      this._move.t += d;
      if (this._move.t >= MOVE_S) this._move = null;
    }
    if (this._clockRun) {
      this._clockRun.t += d;
      this._p = clamp01(this._clockRun.t / SETTLE_S);
      if (this._clockRun.t >= SETTLE_S) {
        this._p = 1;
        this._clockDone = true;
        this._clockRun = null;
      }
    }
    const r = this._pour;
    if (r) {
      r.t += d;
      if (r.t >= POUR_S) {
        const v = this._vessels.find((x) => x.key === r.key);
        if (v) v.state.poured = true;
        this._pour = null;
      }
    }
  }

  busy() { return !!this._clockRun || !!this._pour || !!this._move || this._drag; }

  /** Both buttons unlock the moment the run that was holding them ends. */
  isControlDisabled(id) {
    return this.busy() && (id === 'settle' || id === 'pour');
  }

  // -- drawing ----------------------------------------------------------------------------------
  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawDepth(ctx, c);
    drawBenchBackdrop(ctx, c, { wallRect: { x: 12, y: 112, w: 656, h: 280 } });
    this._ensureMount();
    if (!this._vessels) return;
    const s04 = this._mount === 's04';

    // The s07 bench shows the beam already sent and silent on both containers.
    if (!s04) {
      for (const v of this._vessels) {
        drawBeam(ctx, c, v.box, {
          inside: false, lit: true, y: v.box.floor - 60,
          headX: v.box.x + v.box.w + 42, wallX: v.box.x + GLASS.wall - 40,
          entryAlpha: 0.45, patchAlpha: 0.24, patch: 15, thin: 2,
        });
      }
    }
    const paper = s04 ? this.stage !== S_CLOCK : this.stage === S_SAME;
    for (const v of this._vessels) this._drawVessel(ctx, c, v);
    if (paper && (this.stage !== S_ALL || !s04)) this._drawStand(ctx, c);
    if (paper) this._drawCones(ctx, c);

    const showClock = !s04 || this.stage === S_CLOCK;
    if (showClock) {
      drawClock(ctx, c, CLOCK.cx, CLOCK.cy, CLOCK.r, this._p, { ticks: 10 });
      pill(ctx, c, this._clockRun ? 'settling' : this._clockDone ? '10 min' : '0 min',
        s04 ? CLOCK.cx + CLOCK.r + 44 : CLOCK.cx, s04 ? CLOCK.cy : CLOCK.cy + CLOCK.r + 22, { bg: this._clockRun ? c.accent : c.raised, size: fs(16) });
    }
    if (s04 && this.stage === S_ALL) this._drawResults(ctx, c);
    if (!s04 && this.stage === S_AMOUNT) this._drawSalt(ctx, c);
    drawNoteLine(ctx, c, { rows: this.noteRows() });
  }

  /** One row of discs under each beaker: filled where the test found something. */
  _drawResults(ctx, c) {
    const a = outBack(clamp01((this.clock - (this._age0 ?? 0)) / 0.45));
    pill(ctx, c, 'filled: the test found something', 340, 74, { bg: c.raised, size: fs(18) });
    for (const v of this._vessels) {
      TESTS.forEach((t, i) => {
        const x = v.cx + (i - 1) * 52, y = 464, r = 21 * a, on = v.found[i];
        ctx.fillStyle = darken(on ? c.s5 : c.raised, 0.25);
        ctx.beginPath(); ctx.arc(x, y + 3, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = on ? c.s5 : c.raised;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        this._testGlyph(ctx, on ? inkOn(c, c.s5) : c.labelMuted, t, x, y, a);
        ctx.fillStyle = c.label;
        ctx.font = font(c, 700, PHONE ? 19 : 14);       // three labels 52 apart: 25 would run them together
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, x, 500);
      });
    }
  }

  _testGlyph(ctx, col, t, x, y, k) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (t === 'beam') { ctx.moveTo(x - 12 * k, y); ctx.lineTo(x + 12 * k, y); ctx.moveTo(x + 7 * k, y - 5 * k); ctx.lineTo(x + 12 * k, y); ctx.lineTo(x + 7 * k, y + 5 * k); }
    else if (t === 'clock') { ctx.arc(x, y, 11 * k, 0, Math.PI * 2); ctx.moveTo(x, y); ctx.lineTo(x, y - 7 * k); ctx.moveTo(x, y); ctx.lineTo(x + 5 * k, y + 3 * k); }
    else { ctx.moveTo(x - 12 * k, y - 8 * k); ctx.lineTo(x + 12 * k, y - 8 * k); ctx.lineTo(x, y + 11 * k); ctx.closePath(); }
    ctx.stroke();
  }

  /** The salt each container holds, in a heap on a dish beside it. No test measured this. */
  _drawSalt(ctx, c) {
    const a = outBack(clamp01((this.clock - (this._age0 ?? 0)) / 0.45));
    for (const v of this._vessels) {
      const x = v.box.x + v.box.w + 72, y = BENCH.y - 8;
      const white = lighten(c.glass, 0.92);
      drawShadow(ctx, c, x, y + 8, 64, 6);
      ctx.fillStyle = lighten(c.glass, 0.5);
      ctx.beginPath(); ctx.ellipse(x, y, 64 * a, 11 * a, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = darken(white, 0.12);
      ctx.beginPath(); ctx.ellipse(x, y - 2, v.salt.rx * a, v.salt.ry * 1.2 * a, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = white;
      ctx.beginPath(); ctx.ellipse(x - v.salt.rx * 0.1, y - 3, v.salt.rx * 0.84 * a, v.salt.ry * 1.05 * a, 0, Math.PI, Math.PI * 2); ctx.fill();
      pill(ctx, c, v.salt.g, x, y - 76, { bg: c.accent, size: 26, display: true });
    }
  }

  /** One vessel: the glass, the liquid standing in it, and anything settled at the bottom. */
  _drawVessel(ctx, c, v) {
    const box = v.box;
    const running = this._pour?.key === v.key;
    const u = running ? this._u : (v.state.poured ? 1 : 0);
    const frac = running || v.state.poured ? this._levelFrac(u) : START_F;
    const look = this._liquidOf(c, v);

    if (v.shape === 'bottle') this._drawBottle(ctx, c, box);
    else drawBeaker(ctx, c, box, {});

    // Once the beaker is nearly empty the filtrate starts arriving, and it replaces what went in.
    // A liquid with no `through` tone is the same liquid on the other side of the paper, so it is
    // drawn once at its own opacity - C pours and ends up exactly as cloudy as it started.
    const through = look.through;
    const f = through && (running || v.state.poured) ? clamp01((u - 0.42) / 0.13) : 0;
    const clear = v.holds && !running && !v.state.poured ? (this._clockDone ? 1 : Math.max(0, (this._p - 0.25) / 0.75)) : 0;
    const gone = Math.max(f, clear);            // settling clears B just as the paper does
    drawLiquid(ctx, c, box, { frac, fill: look.fill, alphaMix: look.mix * (1 - gone) });
    if (gone > 0 && through) drawLiquid(ctx, c, box, { frac, fill: through.fill, alphaMix: through.mix * gone });
    if (v.holds) drawSediment(ctx, c, box, this._sedPx(v), { fill: lighten(c.glass, 0.8) });
    // Grains are drawn here only while the vessel is standing still with chalk still in it; the
    // ones rising into the cone during a pour are drawn after the cone, so they can be seen in it.
    const standing = v.holds && !running && !v.state.poured && !this._clockDone;
    if (standing) drawChalk(ctx, c, box, this._grains.map((g) => this._grainAt(g)), { depth: DEPTH });
    drawPaperLabel(ctx, c, v.label, box.cx, BENCH.y + 24, undefined, v.labelSize);
  }

  /** Both containers on the two-vessel bench hold a clear solution, the same look as A. */
  _liquidOf(c, v) { return benchLiquid(c, this._mount === 's07' ? 'A' : v.key); }

  /**
   * The glass bottle on the s07 bench. Its neck is wide enough for a filter cone to sit in it.
   */
  _drawBottle(ctx, c, box) {
    const { cx } = box;
    const lip = box.y;
    const shoulder = box.y + 26;
    const baseY = box.floor + GLASS.wall;
    const half = box.w / 2;
    const nw = half - 8;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(cx - nw, lip);
      ctx.lineTo(cx - nw, shoulder - 8);
      ctx.lineTo(cx - half, shoulder);
      ctx.lineTo(cx - half, baseY - 8);
      ctx.quadraticCurveTo(cx - half, baseY, cx - half + 8, baseY);
      ctx.lineTo(cx + half - 8, baseY);
      ctx.quadraticCurveTo(cx + half, baseY, cx + half, baseY - 8);
      ctx.lineTo(cx + half, shoulder);
      ctx.lineTo(cx + nw, shoulder - 8);
      ctx.lineTo(cx + nw, lip);
      ctx.closePath();
    };
    ctx.fillStyle = alpha(c.glass, 0.16);                 // the far wall seen through the glass
    path(); ctx.fill();
    ctx.fillStyle = alpha(c.glass, 0.2);
    path(); ctx.fill();
    ctx.strokeStyle = alpha(c.glass, 0.85);
    ctx.lineWidth = 2;
    path(); ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.glass, 0.4), 0.85);   // the rolled lip of the bottle
    rr(ctx, cx - nw - 3, lip - 3, (nw + 3) * 2, 8, 3);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.glass, 0.55), 0.5);   // a highlight down the lit side
    ctx.fillRect(cx - half + GLASS.wall + 3, shoulder + 8, 4, baseY - shoulder - 30);
    drawShadow(ctx, c, cx, baseY + 4, box.w * 0.42, 6);
  }

  /**
   * The filter stand: a rod on the bench with an arm out over the vessel the learner aimed at, and
   * the hanger its cone hangs from. The rod TRAVELS rather than pivoting from a fixed bench end,
   * because a stand parked at the end of the bench would have to pour across the other beakers.
   * The cones themselves are drawn by `_drawCones`, in front of it.
   */
  _drawStand(ctx, c) {
    const v = this._aimed;
    const rodX = this._standX;
    const coneX = v ? v.box.cx : PARK_CONE;
    const ringY = (v ? this._mouthY(v) : HANG_Y) - 4;

    drawShadow(ctx, c, rodX, BENCH.y + 6, 26, 6);
    ctx.fillStyle = alpha(c.gold, 0.55);
    rr(ctx, rodX - 22, BENCH.y - 5, 44, 7, 3); ctx.fill();
    ctx.fillStyle = darken(c.stroke, 0.2);
    rr(ctx, rodX - 4, Math.min(ARM_Y, ringY), 8, BENCH.y - Math.min(ARM_Y, ringY) - 2, 3); ctx.fill();
    ctx.fillStyle = alpha(c.label, 0.14);
    rr(ctx, rodX - 2, Math.min(ARM_Y, ringY) + 2, 2.5, BENCH.y - ARM_Y - 10, 2); ctx.fill();
    if (coneX !== rodX) {                                  // the arm, reaching out over the vessel
      ctx.fillStyle = darken(c.stroke, 0.14);
      rr(ctx, coneX, ARM_Y - 4, rodX - coneX, 8, 3); ctx.fill();
    }
    if (ringY > ARM_Y) {                                   // the hanger down to the wire ring
      ctx.fillStyle = darken(c.stroke, 0.14);
      rr(ctx, coneX - 2.5, ARM_Y + 2, 5, ringY - ARM_Y - 2, 2); ctx.fill();
    }
  }

  /**
   * Every cone on the bench. A used one STAYS in the beaker it was poured through - the slide says
   * to drop a cone over EACH beaker, and B's chalk cake has to still be on the paper on the next
   * beat. A cone that is not used yet hangs in the stand's ring, over whichever vessel is aimed,
   * and the stand's own cone is parked at the right end of the bench until something is aimed.
   */
  _drawCones(ctx, c) {
    const u = this._u;
    for (const v of this._vessels) {
      const st = this._coneFor(v, u);
      if (st) this._drawCone(ctx, c, v.box.cx, st.y, v.half, st.fill, this._liquidOf(c, v), st.cake, st.hooked);
    }
    if (!this._aimed) this._drawCone(ctx, c, PARK_CONE, HANG_Y, CONE_HW_PARK, 0, benchLiquid(c, 'A'), false, false);

    // what is on its way into the paper has to be drawn after the cone to be seen inside it
    const r = this._pour;
    const pv = r && this._vessels.find((v) => v.key === r.key);
    if (pv) {
      if (pv.holds && u < 0.85) this._drawRisingGrains(ctx, c, pv, u);
      this._drawDrips(ctx, c, pv, this._mouthY(pv), this._levelFrac(u), this._liquidOf(c, pv));
    }
  }

  /** What, if anything, this vessel is showing under a cone right now. */
  _coneFor(v, u) {
    const running = this._pour?.key === v.key;
    if (v.state.poured) return { y: v.box.y + 8, fill: 0, cake: v.cake, hooked: true };
    if (running) return { y: this._mouthY(v), fill: this._coneFill(u), cake: this._cakeShown(v, u), hooked: true };
    if (this._aim === v.key) return { y: HANG_Y, fill: 0, cake: false, hooked: false };
    return null;
  }

  /** The cone: a hollow paper V, its wire ring, whatever is standing in it, and any cake. */
  _drawCone(ctx, c, cx, mouthY, half, fill01, look, cake, hooked) {
    const tipY = mouthY + half * 0.86;
    // Paper is paper in BOTH themes. mix(bgSurface, label, 0.9) is the helper's own tone for a
    // small label card, where the inkOn() text carries it; across a whole cone it turns the funnel
    // black in the light theme and white in the dark one, so it is built off the glass token
    // instead - the one tone that means the same pale blue in either theme.
    const paper = lighten(c.glass, 0.9);
    const v = (inset) => {
      ctx.beginPath();
      ctx.moveTo(cx - half + inset, mouthY + inset * 0.5);
      ctx.lineTo(cx, tipY);
      ctx.lineTo(cx + half - inset, mouthY + inset * 0.5);
      ctx.closePath();
    };
    ctx.fillStyle = paper; v(0); ctx.fill();
    ctx.fillStyle = alpha(darken(paper, 0.06), 0.85);       // the faint shading on the near panel
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx + half, mouthY);
    ctx.lineTo(cx + half * 0.46, mouthY + half * 0.06);
    ctx.lineTo(cx, tipY - half * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha(darken(paper, 0.16), 0.7);      // the open mouth, seen from outside
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, half, half * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (fill01 > 0.02) {                                   // what is standing in the cone
      ctx.save();
      v(2); ctx.clip();
      const topY = tipY - (tipY - mouthY - 2) * Math.min(1, fill01);
      ctx.fillStyle = alpha(look.fill, look.mix);
      ctx.fillRect(cx - half, topY, half * 2, tipY - topY);
      ctx.fillStyle = alpha(lighten(look.fill, 0.3), 0.5);
      ctx.fillRect(cx - half, topY, half * 2, 2.5);
      ctx.restore();
    }
    ctx.strokeStyle = alpha(darken(paper, 0.34), 0.7);     // the two creases down the paper
    ctx.lineWidth = 2;
    v(1); ctx.stroke();
    // the throat of the cone is in shadow, so a white cake has something to read against
    ctx.fillStyle = alpha(darken(paper, 0.45), 0.3);
    ctx.beginPath();
    ctx.ellipse(cx, tipY - 6, half * 0.34, half * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (cake) {
      const cakeFill = lighten(c.glass, 0.95);
      ctx.fillStyle = alpha(darken(paper, 0.5), 0.5);  // the cake's own shadow on the paper
      ctx.beginPath();
      ctx.ellipse(cx + 1, tipY - 15, 28, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cakeFill;                         // a white layer of chalk, sitting on it
      ctx.beginPath();
      ctx.ellipse(cx, tipY - 18, 27, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = alpha(darken(paper, 0.15), 0.6);
      ctx.beginPath();
      ctx.ellipse(cx + 6, tipY - 15, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const wire = lighten(c.glass, 0.4);
    if (hooked) {                                         // a cone left in a beaker stands on the rim
      ctx.strokeStyle = alpha(wire, 0.85);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - half - 7, mouthY - 4);
      ctx.lineTo(cx - half - 1, mouthY + 3);
      ctx.moveTo(cx + half + 7, mouthY - 4);
      ctx.lineTo(cx + half + 1, mouthY + 3);
      ctx.stroke();
    }
    ctx.strokeStyle = alpha(wire, 0.9);                    // the wire ring that holds the cone
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, mouthY - 4, half + 7, (half + 7) * 0.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Where the cone's mouth is: hanging in the arm, or lowered into the vessel it is pouring into. */
  _mouthY(v) {
    const seated = v.box.y + 8;
    if (v.state.poured) return seated;
    const r = this._pour;
    if (!r || r.key !== v.key) return HANG_Y;
    if (r.t <= MOVE_S) return HANG_Y;
    if (r.t >= LOWER_S) return seated;
    return lerp(HANG_Y, seated, outBack(clamp01((r.t - MOVE_S) / (LOWER_S - MOVE_S))));
  }

  /** A cake is only ever drawn in a vessel that has something coarse enough to be caught. */
  _cakeShown(v, u) {
    if (!v.cake) return false;
    return u > 0.5;
  }

  /** B's chalk on its way off the bottom of the beaker and up into the paper. */
  _drawRisingGrains(ctx, c, v, u) {
    const box = v.box;
    const top = liquidLevel(box, START_F);
    const e = clamp01((u - 0.05) / 0.37);
    const coneY = box.y + 8 + v.half * 0.86;
    const lifted = this._grains.map((g, i) => {
      const from = this._grainAt(g);
      const toGx = 0.5 + (g.gx - 0.5) * 0.5;
      const toGy = (coneY - 15 - (i % 2) * 5 - top) / DEPTH;
      return {
        ...g,
        gx: lerp(from.gx, toGx, e),
        gy: lerp(from.gy, toGy, e),
      };
    });
    drawChalk(ctx, c, box, lifted, { depth: DEPTH });
  }

  /** The filtrate coming off the cone's tip and falling back into the beaker it came from. */
  _drawDrips(ctx, c, v, mouthY, frac, look) {
    const tipY = mouthY + v.half * 0.86;
    const levelY = liquidLevel(v.box, frac);
    const t = (this.clock * 1.5) % 1;
    for (let i = 0; i < 3; i++) {
      const ph = (t + i / 3) % 1;
      const y = tipY + (levelY - tipY) * ph;
      ctx.fillStyle = alpha(darken((look.through ?? look).fill, 0.08), 0.55 * (1 - ph * 0.4));
      rr(ctx, v.box.cx - 10 + i * 10 - 1.5, y - 3, 3, 6, 1.5);
      ctx.fill();
    }
  }

  // -- controls ---------------------------------------------------------------------------------
  // `v` is true for a button; the host sends segmented values as strings.
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this._ensureMount();
    if (id === 'settle') this._launchSettle();
    else if (id === 'pour') this._launchPour();
    else if (id === 'which' || id === 'which2') this._setAimKey(String(v));
    this.requestUiUpdate?.();
  }

  // -- pointer ----------------------------------------------------------------------------------
  /** A tap on the glass does what the Which control does. */
  pointerDown(p) {
    if (this.busy() || !this._vessels) return;
    if (this._mount === 's04' && this.stage !== S_PAPER) return;
    const v = this._vessels.find((x) => p.x > x.box.x - 10 && p.x < x.box.x + x.box.w + 10 && p.y > x.box.y - 14 && p.y < BENCH.y + 6);
    if (!v) return;
    this._setAimKey(v.key);
    this.requestUiUpdate?.();
    this.animateFor(500);
  }

  _setAimKey(key) {
    if (key === this._aim || !this._vessels?.some((x) => x.key === key)) return;
    this._move = { from: this._standX, to: this._vessels.find((x) => x.key === key).rodX, t: 0 };
    this._aim = key;
  }
}
