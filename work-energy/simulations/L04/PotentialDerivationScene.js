import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml, burst } from 'simulations/base/kit/SimLookDom.js';

const W = 660;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the rule, nothing lifted, both readings zero
  [{ idx: 1, dwellMs: null }], // the height raised, the two readings equal
  [{ idx: 2, dwellMs: null }], // the zero line moved, the block not
  [{ idx: 3, dwellMs: null }], // unchanged and still live: the caveat is prose
];

// g is the chapter's own number, and the stub forbids a dial for it, so it is a
// constant and is named once in the note card. With g = 10, an integer mass and
// a half-metre step, every reading in the panel is a whole number of joules.
const G = 10; // N per kg

const MASS_MIN = 1;
const MASS_MAX = 20;
const MASS_STEP = 1;
const MASS_START = 2;

const HEIGHT_MIN = 0;
const HEIGHT_MAX = 10;
const HEIGHT_STEP = 0.5;
const HEIGHT_START = 0;
const DEMO_HEIGHT = 3.0; // the height beat 1 lifts to if the learner has not moved it

// The 10 m end is the slide's own "put the zero ten metres higher".
const ZERO_MIN = 0;
const ZERO_MAX = 10;
const ZERO_STEP = 0.5;
const ZERO_START = 0;
const DEMO_ZERO = 2.0; // the zero line beat 2 moves to if the learner has not moved it

// Drawing scale, shared by both halves so a height compared across them really
// is the same height. 5.6 px per metre: the full 10 m of either dial is 56 px,
// so a 3 m lift and a 2 m zero line are both plainly visible moves - at the
// 3.4 px/m first tried, 3 m was 10 px and the reference level being the whole
// point of beat 2 - was indistinguishable from the ground.
const PX_PER_M = 5.6;
const CUBE = 32;
const ARROW_H = 26;
const AIR_H = 118; // ground to the top of the force arrow, plus 56 px of headroom
const LIFT_MS = 700;

// The force arrow: a fixed 26 px at every mass, because it labels the force
// rather than measuring it. The number is what the mass dial changes.
const ARROW = `<svg class="pd-arrow" viewBox="0 0 14 26" width="14" height="${ARROW_H}" aria-hidden="true" focusable="false">
  <path d="M7 25 V7" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M7 1 L13 9 H1 Z" fill="currentColor"/>
</svg>`;

const NOTE_ROWS = [
  { text: 'The lift is imagined slow and steady.', sub: 'so the push equals the weight and none of the work buys speed' },
  { text: 'This panel fixes g at 10 N/kg.', sub: 'no friction, no motor, no time, no speed' },
];

const CSS = `
.pd-card { gap: var(--sim-space-3); }
.pd-half { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.pd-head { display: flex; align-items: center; gap: var(--sim-space-2); flex-wrap: wrap; }
.pd-head .sim-tag { border-radius: var(--sim-radius-sm); letter-spacing: 0.08em; }
.pd-ledger { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-2); }
.pd-lower { position: relative; }

/* the stage: a room, not a void, with the ground drawn as its own bottom edge */
.pd-stage { display: flex; gap: var(--sim-space-3); padding: var(--sim-space-2) var(--sim-space-3) 0; border: var(--sim-border); border-radius: var(--sim-radius-md); border-bottom-width: 3px; border-bottom-color: color-mix(in oklab, var(--sim-stroke) 60%, var(--sim-label)); background-color: var(--sim-bg-deep); background-image: radial-gradient(color-mix(in oklab, var(--sim-series-2) 14%, transparent) 2px, transparent 2.6px); background-size: 34px 34px; }

/* the height dimension: a label riding on top of a bar that grows from the ground */
/* width max-content so the widest reading ("h = 10.0 m") always fits its own
   column, in either orientation; min-width keeps the two stages' bars aligned. */
.pd-dim { display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; flex: none; width: max-content; min-width: 66px; height: ${AIR_H}px; padding-bottom: 4px; }
.pd-dimlab { font-size: var(--sim-text-sm); font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pd-dimbar { width: 18px; height: max(3px, calc(var(--lift, 0) * 1px)); border-left: 2px solid var(--sim-accent); border-top: 2px solid var(--sim-accent); border-top-left-radius: 4px; transition: height ${LIFT_MS}ms ease; }
/* the lower dimension: a spacer as tall as the zero line, so the bar above it
   starts on the dashed line and ends on the block's base */
.pd-dimfill { flex: none; width: 18px; height: calc(var(--z, 0) * 1px); transition: height ${LIFT_MS}ms ease; }

/* the block's slot. The ghost outline and the lifted block are two children of
   one grid cell, so they occupy the same ground position without one of them
   being positioned by hand. */
.pd-air { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; flex: 1 1 auto; min-width: 0; height: ${AIR_H}px; }
.pd-anchor { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto; align-items: end; width: 100%; }
.pd-ghost { grid-area: 1 / 1; justify-self: center; width: ${CUBE}px; height: ${CUBE}px; border: 2px dashed color-mix(in oklab, var(--sim-label) 42%, transparent); border-radius: 5px; }
/* The mass label sits BESIDE the cube, not under it: a label under the cube
   would make the column's bottom the label, so at h = 0 the block would stand
   clear of its own ghost outline. Beside it, the lift column's bottom edge is
   the cube's bottom edge, which is the point the height dimension measures. */
.pd-lift { grid-area: 1 / 1; justify-self: center; display: flex; flex-direction: column; align-items: center; gap: 4px; transform: translateY(calc(-1 * var(--lift, 0) * 1px)); transition: transform ${LIFT_MS}ms ease; }
.pd-force { display: flex; align-items: center; gap: 5px; }
.pd-arrow { color: var(--sim-accent); flex: none; }
.pd-forcelab { font-size: var(--sim-text-sm); font-weight: 800; color: var(--sim-accent); white-space: nowrap; }
.pd-massrow { display: flex; align-items: center; gap: 6px; }
.pd-cube { flex: none; width: ${CUBE}px; height: ${CUBE}px; border-radius: 5px; background: color-mix(in oklab, var(--sim-series-2) 62%, var(--sim-bg-surface)); box-shadow: inset -4px -4px 0 color-mix(in oklab, var(--sim-bg-deep) 55%, transparent), 0 0 0 2px color-mix(in oklab, var(--sim-series-2) 40%, var(--sim-bg-deep)); }
.pd-masslab { font-size: var(--sim-text-sm); font-weight: 800; color: var(--sim-label); white-space: nowrap; }

/* the zero line: a zero-height row with a dashed top edge, lifted by its margin.
   It is a grid child of the same cell, bottom-anchored, so the block never moves.
   The tag rides at the RIGHT end, clear of the height dimension on the left. */
.pd-zero { grid-area: 1 / 1; justify-self: stretch; align-self: end; height: 0; margin-bottom: calc(var(--z, 0) * 1px); border-top: 2px dashed var(--sim-accent); transition: margin-bottom ${LIFT_MS}ms ease; }
.pd-zerotag { grid-area: 1 / 1; justify-self: end; align-self: end; margin: 0 2px calc(var(--z, 0) * 1px + 5px) 0; border-radius: var(--sim-radius-sm); letter-spacing: 0.08em; white-space: nowrap; }

/* the dials */
.pd-ctls { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); }
.pd-dial { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.pd-dialrow { display: flex; align-items: center; justify-content: space-between; gap: var(--sim-space-2); min-width: 0; }
.pd-dial .sim-tag { border-radius: var(--sim-radius-sm); letter-spacing: 0.08em; white-space: nowrap; }
.pd-dial input[type="range"] { width: 100%; margin: 0; accent-color: var(--sim-accent); }
.pd-dialval { font-size: var(--sim-text-sm); font-weight: 800; font-variant-numeric: tabular-nums; color: var(--sim-label-muted); white-space: nowrap; }
.pd-dial .sim-meta { text-align: right; }

/* the ledger: the number, and the substitution that produced it */
.pd-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; border-radius: var(--sim-radius-sm); }
.pd-fld { flex-wrap: wrap; }
.pd-fld .sim-field__label { font-size: var(--sim-text-lg); font-weight: 800; white-space: nowrap; }
.pd-fld .sim-field__value { font-size: var(--sim-text-xl); font-weight: 800; font-variant-numeric: tabular-nums; }
.pd-sub { margin: 0; padding: 0 2px; font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
[data-step="1"] .pd-cell { animation: pd-flash 900ms ease both; }
[data-step="1"] .pd-cell:nth-child(2) { animation-delay: 160ms; }
@keyframes pd-flash {
  0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--sim-accent) 0%, transparent); }
  38% { box-shadow: 0 0 0 4px color-mix(in oklab, var(--sim-accent) 62%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--sim-accent) 0%, transparent); }
}

/* the note card, in flow at the foot rather than dimming the panel */
.pd-note { display: block; }
.pd-note .sl-note { position: static; display: block; padding: 0; background: none; animation: none; }
.pd-note .sl-note__card { width: 100%; margin-top: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px; gap: 5px; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); animation: none; }
.pd-note .sl-note__badge { font-size: var(--sim-text-sm); padding: 1px 9px; }
.pd-note .sl-note__row { grid-template-columns: 22px minmax(0, 1fr); column-gap: var(--sim-space-2); animation: none; }
.pd-note .sl-note__icon { width: 22px; height: 22px; }
.pd-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.pd-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; }

.sim-dom-root--portrait .pd-fld .sim-field__label { font-size: var(--sim-text-md); }
.sim-dom-root--portrait .pd-fld .sim-field__value { font-size: var(--sim-text-lg); }
`;

function fmt1(v) {
  return v.toFixed(1);
}

function fmtN(v) {
  return String(Math.round(v));
}

// The upper stage's dimension measures h from the ground line; the lower one's
// measures the same block's height above the dashed line, so the two read
// h and h - z off the same block at the same scale.
function stageHtml(withForce) {
  const dim = withForce
    ? `<div class="pd-dim" data-dim>
        <span class="pd-dimlab" data-dimlab>h = 0.0 m</span>
        <span class="pd-dimbar"></span>
      </div>`
    : `<div class="pd-dim" data-dim2>
        <span class="pd-dimlab" data-dim2lab>h = 0.0 m</span>
        <span class="pd-dimbar"></span>
        <span class="pd-dimfill"></span>
      </div>`;
  return `<div class="pd-stage">
    ${dim}
    <div class="pd-air">
      <div class="pd-anchor">
        <span class="pd-ghost"></span>
        <span class="pd-lift" data-lift>
          ${withForce ? `<span class="pd-force">${ARROW}<span class="pd-forcelab" data-forcelab>F = mg</span></span>` : ''}
          <span class="pd-massrow"><span class="pd-cube"></span><span class="pd-masslab" data-cube>0 kg</span></span>
        </span>
        ${withForce ? '' : '<span class="pd-zero" data-zero></span><span class="sim-tag pd-zerotag" data-zerotag>U = 0</span>'}
      </div>
    </div>
  </div>`;
}

export class PotentialDerivationScene extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = 780; // sim-layout natural 764 (tallest beat, interact 6) + padding
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1025; // sim-layout natural 1009 (tallest portrait beat) + padding
  // Two stacked panels and 14px text: too tall to earn a side panel at a
  // readable scale, so ask for the full width below the text instead.
  static MIN_SCALE = 1.3;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'Two stacked panels. In the upper one a mass on a ground line with an upward force arrow, a height dimension, a mass dial and a height dial, and two readings - the work done and the stored energy - that show the same number. In the lower one the same mass above a dashed zero line that a third dial slides up and down, with its own stored-energy reading and the change that moving the line makes.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.render({
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="sim-card pd-card">
        <section class="pd-half" data-upper>
          <div class="pd-head">
            <span class="sim-tag sim-tag--accent">zero: ground</span>
            <h2 class="sim-title">W = F &#215; s, and F = mg</h2>
          </div>
          ${stageHtml(true)}
          <div class="pd-ctls">
            <label class="pd-dial">
              <span class="pd-dialrow"><span class="sim-tag">MASS</span><span class="pd-dialval" data-massval>${MASS_START} kg</span></span>
              <input type="range" data-mass min="${MASS_MIN}" max="${MASS_MAX}" step="${MASS_STEP}" value="${MASS_START}" aria-label="Mass, in kilograms">
            </label>
            <label class="pd-dial">
              <span class="pd-dialrow"><span class="sim-tag">HEIGHT</span><span class="pd-dialval" data-heightval>0.0 m</span></span>
              <input type="range" data-height min="${HEIGHT_MIN}" max="${HEIGHT_MAX}" step="${HEIGHT_STEP}" value="${HEIGHT_START}" aria-label="Height above the ground, in metres">
            </label>
          </div>
          <div class="pd-ledger" data-ledger>
            <div class="pd-cell">
              <div class="sim-field pd-fld">
                <span class="sim-field__label">W = F &#215; s</span>
                <span class="sim-field__value"><b data-w>0</b> J</span>
              </div>
              <p class="pd-sub" data-wsub>0 N &#215; 0.0 m</p>
            </div>
            <div class="pd-cell">
              <div class="sim-field pd-fld">
                <span class="sim-field__label">U = m g h</span>
                <span class="sim-field__value"><b data-u>0</b> J</span>
              </div>
              <p class="pd-sub" data-usub>0 kg &#215; 0 N/kg &#215; 0.0 m</p>
            </div>
          </div>
        </section>
        <section class="pd-half" data-lower>
          <div class="pd-head">
            <span class="sim-tag sim-tag--accent">zero: dashed line</span>
            <h2 class="sim-title">The same mass, a different zero</h2>
          </div>
          ${stageHtml(false)}
          <div class="pd-ctls">
            <label class="pd-dial">
              <span class="pd-dialrow"><span class="sim-tag">ZERO LINE</span><span class="pd-dialval" data-zeroval>0.0 m</span></span>
              <input type="range" data-zerodial min="${ZERO_MIN}" max="${ZERO_MAX}" step="${ZERO_STEP}" value="${ZERO_START}" aria-label="Height of the zero line above the ground, in metres">
            </label>
            <div class="pd-dial">
              <span class="pd-dialrow"><span class="sim-tag">BLOCK</span><span class="pd-dialval">unchanged</span></span>
              <span class="sim-meta">moves only with HEIGHT</span>
            </div>
          </div>
          <div class="pd-ledger" data-ledger2>
            <div class="pd-cell">
              <div class="sim-field pd-fld">
                <span class="sim-field__label">U = m g h</span>
                <span class="sim-field__value"><b data-u2>0</b> J</span>
              </div>
              <p class="pd-sub" data-u2sub>0 kg &#215; 0 N/kg &#215; 0.0 m</p>
            </div>
            <div class="pd-cell">
              <div class="sim-field pd-fld">
                <span class="sim-field__label">change</span>
                <span class="sim-field__value"><b data-d>0</b> J</span>
              </div>
              <p class="pd-sub" data-dsub>&#8722; mg &#215; 0.0 m</p>
            </div>
          </div>
        </section>
        <div class="pd-note">${noteCardHtml(NOTE_ROWS, 'NOTE')}</div>
      </div>`,
    });

    this._mass = this.root?.querySelector?.('[data-mass]') ?? null;
    this._height = this.root?.querySelector?.('[data-height]') ?? null;
    this._zerodial = this.root?.querySelector?.('[data-zerodial]') ?? null;

    this._massVal = this.root?.querySelector?.('[data-massval]') ?? null;
    this._heightVal = this.root?.querySelector?.('[data-heightval]') ?? null;
    this._zeroVal = this.root?.querySelector?.('[data-zeroval]') ?? null;

    this._forcelab = this.root?.querySelector?.('[data-forcelab]') ?? null;
    this._cubelab = this.root?.querySelector?.('[data-cube]') ?? null;
    this._dimlab = this.root?.querySelector?.('[data-dimlab]') ?? null;
    this._dim = this.root?.querySelector?.('[data-dim]') ?? null;
    this._dim2 = this.root?.querySelector?.('[data-dim2]') ?? null;
    this._dim2lab = this.root?.querySelector?.('[data-dim2lab]') ?? null;

    this._w = this.root?.querySelector?.('[data-w]') ?? null;
    this._u = this.root?.querySelector?.('[data-u]') ?? null;
    this._wsub = this.root?.querySelector?.('[data-wsub]') ?? null;
    this._usub = this.root?.querySelector?.('[data-usub]') ?? null;

    this._u2 = this.root?.querySelector?.('[data-u2]') ?? null;
    this._d = this.root?.querySelector?.('[data-d]') ?? null;
    this._u2sub = this.root?.querySelector?.('[data-u2sub]') ?? null;
    this._dsub = this.root?.querySelector?.('[data-dsub]') ?? null;

    this._ledgers = [
      this.root?.querySelector?.('[data-ledger]') ?? null,
      this.root?.querySelector?.('[data-ledger2]') ?? null,
    ];
    this._lifts = Array.from(this.root?.querySelectorAll?.('[data-lift]') ?? []);
    this._cubes = Array.from(this.root?.querySelectorAll?.('[data-cube]') ?? []);
    this._zeros = Array.from(this.root?.querySelectorAll?.('[data-zero]') ?? []);
    this._zerotags = Array.from(this.root?.querySelectorAll?.('[data-zerotag]') ?? []);

    this._sang = false;

    this._mass?.addEventListener('input', () => this._paint());
    this._height?.addEventListener('input', () => this._paint());
    // The one celebration in the scene, and it can only be reached by hand: the
    // zero line has to be dragged up until U lands exactly on 0 with the block
    // still in the air and the upper work reading still where it was.
    this._zerodial?.addEventListener('input', () => {
      this._paint();
      this._checkZero();
    });

    this._paint();
    this.onStep(0, 4);
  }

  onStep(step) {
    if (step === 0) {
      this._setHeight(HEIGHT_START);
      this._setZero(ZERO_START);
      this._paint();
      return;
    }
    // A beat's own state has to be true when the learner arrives on it, so an
    // untouched dial is set to the demonstration value. A dial the learner has
    // moved is never overridden - the two halves are theirs to explore.
    if (this._heightNum() === 0) this._setHeight(DEMO_HEIGHT);
    if (step >= 2 && this._zeroNum() === 0) this._setZero(DEMO_ZERO);
    this._paint();
  }

  _heightNum() {
    const v = this._height ? Number(this._height.value) : HEIGHT_START;
    return Number.isFinite(v) ? v : HEIGHT_START;
  }

  _zeroNum() {
    const v = this._zerodial ? Number(this._zerodial.value) : ZERO_START;
    return Number.isFinite(v) ? v : ZERO_START;
  }

  _massNum() {
    const v = this._mass ? Number(this._mass.value) : MASS_START;
    return Number.isFinite(v) ? v : MASS_START;
  }

  _setHeight(v) {
    if (this._height) this._height.value = String(v);
  }

  _setZero(v) {
    if (this._zerodial) this._zerodial.value = String(v);
  }

  _checkZero() {
    if (this._sang) return;
    const h = this._heightNum();
    const z = this._zeroNum();
    // U = 0 exactly, which needs z = h exactly, and the block still off the
    // ground: the value has been driven to nothing by a decision alone.
    if (h > 0 && Math.abs(z - h) < 1e-9) {
      this._sang = true;
      if (this._ledgers[1]) burst(this._ledgers[1]);
    }
  }

  _paint() {
    const m = this._massNum();
    const h = this._heightNum();
    const z = this._zeroNum();

    const f = G * m; // N - the push, which equals the weight on a slow lift
    const j = f * h; // J - ONE number, written into both upper readings
    const above = h - z;
    const j2 = f * above;
    const dj = -f * z;

    const liftPx = h * PX_PER_M;
    const zeroPx = z * PX_PER_M;

    if (this._massVal) this._massVal.textContent = `${fmtN(m)} kg`;
    if (this._heightVal) this._heightVal.textContent = `${fmt1(h)} m`;
    if (this._zeroVal) this._zeroVal.textContent = `${fmt1(z)} m`;

    if (this._forcelab) this._forcelab.textContent = `F = mg = ${fmtN(f)} N`;
    for (const el of this._cubes) el.textContent = `${fmtN(m)} kg`;
    for (const el of this._lifts) el.style.setProperty('--lift', String(liftPx));
    for (const el of this._zeros) el.style.setProperty('--z', String(zeroPx));
    for (const el of this._zerotags) el.style.setProperty('--z', String(zeroPx));

    // The upper dimension runs from the ground to the block: height h.
    if (this._dim) this._dim.style.setProperty('--lift', String(liftPx));
    // The lower dimension runs from the dashed line to the block: height h - z.
    // Its spacer below the bar is as tall as the zero line.
    if (this._dim2) {
      this._dim2.style.setProperty('--z', String(zeroPx));
      this._dim2.style.setProperty('--lift', String(above * PX_PER_M));
    }
    if (this._dimlab) this._dimlab.textContent = `h = ${fmt1(h)} m`;
    if (this._dim2lab) this._dim2lab.textContent = `h = ${fmt1(above)} m`;

    if (this._w) this._w.textContent = fmtN(j);
    if (this._u) this._u.textContent = fmtN(j);
    if (this._wsub) this._wsub.textContent = `${fmtN(f)} N \u00d7 ${fmt1(h)} m`;
    if (this._usub) this._usub.textContent = `${fmtN(m)} kg \u00d7 ${G} N/kg \u00d7 ${fmt1(h)} m`;

    if (this._u2) this._u2.textContent = fmtN(j2);
    if (this._d) this._d.textContent = fmtN(dj);
    if (this._u2sub) this._u2sub.textContent = `${fmtN(m)} kg \u00d7 ${G} N/kg \u00d7 ${fmt1(above)} m`;
    if (this._dsub) this._dsub.textContent = `\u2212 mg \u00d7 ${fmt1(z)} m`;
  }

  destroy() {
    this._mass = null;
    this._height = null;
    this._zerodial = null;
    this._massVal = null;
    this._heightVal = null;
    this._zeroVal = null;
    this._forcelab = null;
    this._cubelab = null;
    this._dimlab = null;
    this._dim = null;
    this._dim2 = null;
    this._dim2lab = null;
    this._w = null;
    this._u = null;
    this._wsub = null;
    this._usub = null;
    this._u2 = null;
    this._d = null;
    this._u2sub = null;
    this._dsub = null;
    this._ledgers = null;
    this._lifts = null;
    this._cubes = null;
    this._zeros = null;
    this._zerotags = null;
    super.destroy();
  }
}
