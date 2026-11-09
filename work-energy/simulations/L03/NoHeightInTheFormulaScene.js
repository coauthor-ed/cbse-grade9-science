import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml } from 'simulations/base/kit/SimLookDom.js';

const W = 640;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the list is two long, and both dials are live
  [{ idx: 1, dwellMs: null }], // the ball goes off the table, and nothing is measured
];

// Dial ranges. Speed is a magnitude, so its minimum is 0 and "set the speed to
// zero" is the end stop - exactly reachable, and the reading empties there at
// any mass. The starting pair is chosen so the opening reading is a whole
// number: 0.5 x 0.5 x 4^2 = 4 J.
const MASS_MIN = 0.1;
const MASS_MAX = 10;
const MASS_STEP = 0.1;
const MASS_START = 0.5;
const SPEED_MIN = 0;
const SPEED_MAX = 20;
const SPEED_STEP = 0.5;
const SPEED_START = 4;

// Fall geometry, measured off the room's own layout rather than guessed:
// sky 128 + slab 16 puts the table face at 36, the ball's centre at 23, and
// the floor line at 128, so the centre travels 92px and the ball's bottom
// arrives exactly on the floor. The drift is not decoration - a ball rolling
// off an edge keeps its horizontal speed all the way down, and 48 across 92 is
// about the arc a gently rolling ball makes; it is also what carries the ball
// clear of the table's near leg.
const SKY_H = 128;
const SLAB_H = 16;
const LEG_H = 76;
const BALL = 26;
const FALL_MS = 700;
const FALL_DY = 92;
const FALL_DX = 48;
const BALL_GAP = 24; // the ball's own right margin on the slab, clear of the leg
// Long enough that a learner arriving cold on beat 1 sees the ball at rest on
// the table before it goes, long enough not to be a flicker.
const AUTO_DROP_MS = 650;

const NOTE_ROWS = [
  { text: 'Two dials, one reading', sub: 'nothing else is on the panel' },
  { text: 'The fall is drawn', sub: 'nothing about it is measured' },
];

const CSS = `
.nhf-formula { font-size: calc(var(--sim-text-2xl) * 1.4); font-weight: 800; line-height: 1.2; }
.nhf-formula i { font-style: italic; }
.nhf-formula sup { font-size: 0.58em; }
.nhf-frac { display: inline-flex; flex-direction: column; align-items: stretch; text-align: center; vertical-align: middle; font-size: var(--sim-text-xl); line-height: 1.1; margin: 0 0.14em; }
.nhf-frac > span:first-child { padding: 0 4px 1px; border-bottom: 2px solid currentColor; }
.nhf-frac > span:last-child { padding: 1px 4px 0; }

.nhf-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 132px; gap: var(--sim-space-3); align-items: end; }
.nhf-dial { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.nhf-dtag { align-self: flex-start; border-radius: var(--sim-radius-sm); letter-spacing: 0.09em; }
.nhf-dial input[type="range"] { width: 100%; margin: 0; accent-color: var(--sim-accent); }

.nhf-read { position: relative; overflow: hidden; }
.nhf-read .sim-field__label { font-size: var(--sim-text-xl); font-weight: 800; }
.nhf-read .sim-field__value { font-size: var(--sim-text-2xl); font-weight: 800; font-variant-numeric: tabular-nums; }
.nhf-read--empty { border-style: dashed; }
.nhf-read--empty .sim-field__label,
.nhf-read--empty .sim-field__value { color: var(--sim-label-muted); }

.nhf-room { display: flex; flex-direction: column; padding: var(--sim-space-2); border: var(--sim-border); border-radius: var(--sim-radius-md); background-color: var(--sim-bg-deep); }
.nhf-drop { align-self: flex-start; flex: none; padding: 5px 15px; border: 2px solid var(--sim-accent); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 700; cursor: pointer; }
.nhf-drop:hover { background: color-mix(in oklab, var(--sim-accent) 22%, var(--sim-bg-surface)); }
[data-step="1"][data-go="0"] .nhf-drop { animation: nhf-pulse 1.5s ease-in-out infinite; }
@keyframes nhf-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--sim-accent) 40%, transparent); } 50% { box-shadow: 0 0 0 5px transparent; } }

.nhf-sky { display: flex; align-items: flex-end; justify-content: space-between; height: ${SKY_H}px; }
.nhf-table { width: 60%; display: flex; flex-direction: column; }
.nhf-slab { display: flex; align-items: flex-end; height: ${SLAB_H}px; border-radius: 4px 4px 2px 2px; background: color-mix(in oklab, var(--sim-series-2) 52%, var(--sim-bg-deep)); box-shadow: inset 0 3px 0 color-mix(in oklab, var(--sim-series-2) 50%, var(--sim-label)); }
.nhf-legs { display: flex; justify-content: space-between; height: ${LEG_H}px; padding: 0 7px; }
.nhf-legs i { width: 11px; height: 100%; border-radius: 0 0 3px 3px; background: color-mix(in oklab, var(--sim-series-2) 40%, var(--sim-bg-deep)); }

/* the ball: a flex child of the slab, lifted by exactly the slab's own height,
   so its bottom sits on the table face without one pixel of positioning */
.nhf-ball { position: relative; z-index: 3; flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; width: ${BALL}px; height: ${BALL}px; padding-top: 5px; margin: 0 ${BALL_GAP}px ${SLAB_H}px auto; border-radius: 50%; background: var(--sim-series-6); box-shadow: inset -4px -4px 0 color-mix(in oklab, var(--sim-bg-deep) 62%, transparent); transition: transform ${FALL_MS}ms cubic-bezier(0.5, 0, 0.9, 0.4); }
.nhf-eye { flex: none; width: 5px; height: 6px; border-radius: 50%; background: var(--sim-bg-deep); }
[data-go="1"] .nhf-ball { transform: translate(${FALL_DX}px, ${FALL_DY}px) rotate(96deg); }

.nhf-floor { display: flex; align-items: flex-start; height: 46px; border-top: 3px solid color-mix(in oklab, var(--sim-stroke) 62%, var(--sim-label)); border-radius: 0 0 var(--sim-radius-sm) var(--sim-radius-sm); background-color: color-mix(in oklab, var(--sim-stroke) 30%, var(--sim-bg-deep)); background-image: repeating-linear-gradient(90deg, transparent 0 86px, color-mix(in oklab, var(--sim-stroke) 50%, transparent) 86px 88px); }
.nhf-hit { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 26px; margin: 2px 0 0 calc(60% - 2px); }
.nhf-land { width: 22px; height: 6px; border-radius: 50%; background: color-mix(in oklab, var(--sim-label) 24%, transparent); opacity: 0; transition: opacity 220ms ease 600ms; }
[data-go="1"] .nhf-land { opacity: 1; }
.nhf-dust { display: flex; align-items: flex-end; gap: 4px; height: 10px; }
.nhf-dust i { width: 6px; height: 6px; border-radius: 50%; background: var(--sim-label-muted); opacity: 0; }
[data-go="1"] .nhf-dust i { animation: nhf-puff 560ms ease-out both; animation-delay: calc(620ms + var(--i, 0) * 40ms); }
@keyframes nhf-puff { from { opacity: 0.85; transform: translateY(5px) scale(0.4); } to { opacity: 0; transform: translateY(-7px) scale(1.35); } }
.nhf-tile { width: 42px; height: 26px; margin: 4px 6px 0 auto; border: 2px solid color-mix(in oklab, var(--sim-stroke) 45%, var(--sim-label)); border-radius: 3px; background-color: color-mix(in oklab, var(--sim-series-1) 22%, var(--sim-bg-surface)); }

.nhf-note { display: block; }
.nhf-note .sl-note { position: static; display: block; padding: 0; background: none; animation: none; }
.nhf-note .sl-note__card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--sim-space-3); width: 100%; margin-top: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px; gap: 5px; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); animation: none; }
.nhf-note .sl-note__badge { font-size: var(--sim-text-sm); padding: 1px 9px; }
.nhf-note .sl-note__row { grid-template-columns: 20px minmax(0, 1fr); column-gap: var(--sim-space-2); animation: none; }
.nhf-note .sl-note__icon { width: 20px; height: 20px; }
.nhf-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.nhf-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; }

.sim-dom-root--portrait .nhf-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.sim-dom-root--portrait .nhf-read { grid-column: 1 / -1; }
.sim-dom-root--portrait .nhf-note .sl-note__card { grid-template-columns: minmax(0, 1fr); }
`;

function fmtJ(j) {
  const r = Math.round(j * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function roomHtml() {
  return `<section class="nhf-room sl-backdrop" data-room data-go="0">
    <div class="nhf-sky">
      <div class="nhf-table">
        <div class="nhf-slab">
          <span class="nhf-ball"><i class="nhf-eye"></i><i class="nhf-eye"></i></span>
        </div>
        <div class="nhf-legs"><i></i><i></i></div>
      </div>
      <button class="nhf-drop" type="button" data-drop>Drop</button>
    </div>
    <div class="nhf-floor">
      <span class="nhf-hit">
        <span class="nhf-land"></span>
        <span class="nhf-dust"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i></span>
      </span>
      <span class="nhf-tile"></span>
    </div>
  </section>`;
}

export class NoHeightInTheFormulaScene extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = 463; // sim-layout tallest landscape beat 451 + padding
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 546; // sim-layout tallest portrait beat 527 + padding
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A formula panel with a mass dial and a speed dial and one reading in joules, and beside it a ball resting on a table that can be dropped to the floor.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this._timers = [];
    this.render({
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="sim-card">
        <section class="nhf-panel">
          <h2 class="sim-title nhf-formula"><i>K</i> = <span class="nhf-frac"><span>1</span><span>2</span></span><i>m</i><i>v</i><sup>2</sup></h2>
          <div class="nhf-grid">
            <label class="nhf-dial">
              <span class="sim-tag nhf-dtag">MASS</span>
              <input type="range" data-mass min="${MASS_MIN}" max="${MASS_MAX}" step="${MASS_STEP}" value="${MASS_START}" aria-label="Mass, in kilograms">
            </label>
            <label class="nhf-dial">
              <span class="sim-tag nhf-dtag">SPEED</span>
              <input type="range" data-speed min="${SPEED_MIN}" max="${SPEED_MAX}" step="${SPEED_STEP}" value="${SPEED_START}" aria-label="Speed, in metres per second">
            </label>
            <div class="sim-field nhf-read" data-read>
              <span class="sim-field__label">K</span>
              <span class="sim-field__value"><b data-j>0</b> J</span>
            </div>
          </div>
        </section>
        ${roomHtml()}
        <div class="nhf-note">${noteCardHtml(NOTE_ROWS, 'NOTE')}</div>
      </div>`,
    });

    this._mass = this.root?.querySelector?.('[data-mass]') ?? null;
    this._speed = this.root?.querySelector?.('[data-speed]') ?? null;
    this._j = this.root?.querySelector?.('[data-j]') ?? null;
    this._read = this.root?.querySelector?.('[data-read]') ?? null;
    this._room = this.root?.querySelector?.('[data-room]') ?? null;
    this._drop = this.root?.querySelector?.('[data-drop]') ?? null;

    this._mass?.addEventListener('input', () => this._paint());
    this._speed?.addEventListener('input', () => this._paint());
    this._drop?.addEventListener('click', () => this._dropBall());
    this._paint();
    this.onStep();
  }

  onStep() {
    this._clearTimers();
    // A step owns the ball: it comes back to the table face, and only beat 1
    // then drops it, so a learner arriving cold on this beat sees the ball at
    // rest first. The learner's two dial settings are never touched.
    this._restBall();
    if (this.stepIndex >= 1) {
      this._timers.push(setTimeout(() => this._dropBall(), AUTO_DROP_MS));
    }
  }

  _clearTimers() {
    for (const id of this._timers) clearTimeout(id);
    this._timers = [];
  }

  _massVal() {
    const v = this._mass ? Number(this._mass.value) : MASS_START;
    return Number.isFinite(v) ? v : MASS_START;
  }

  _speedVal() {
    const v = this._speed ? Number(this._speed.value) : SPEED_START;
    return Number.isFinite(v) ? v : SPEED_START;
  }

  _paint() {
    const k = 0.5 * this._massVal() * Math.pow(this._speedVal(), 2);
    if (this._j) this._j.textContent = fmtJ(k);
    // Zero is a real reading, not a missing one, so it is the number and the
    // label that go quiet - and the box that loses its solid edge. Nothing
    // sparkles: on this slide an empty reading is a dead end, not a score.
    if (this._read) this._read.classList.toggle('nhf-read--empty', k === 0);
  }

  _restBall() {
    if (!this._room) return;
    this._room.dataset.go = '0';
  }

  // Replayed from the top every time, so a second Drop is the same short fall
  // again rather than a ball already lying on the floor.
  _dropBall() {
    if (!this._room) return;
    this._room.dataset.go = '0';
    void this._room.offsetWidth;
    this._room.dataset.go = '1';
  }

  destroy() {
    this._clearTimers();
    this._mass = null;
    this._speed = null;
    this._j = null;
    this._read = null;
    this._room = null;
    this._drop = null;
    super.destroy();
  }
}
