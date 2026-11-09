// MachineWorkLedgerScene.js
//
// L07 s02 (predict setup, no beats) and s03 (4 beats): the chapter's bag, the
// chapter's shelf, and the two routes between them - each with a ledger beside
// it, at the same scale, so "the ramp made it easier, not smaller" is one
// glance rather than an argument.
//
// Two mounts, one file, and the scene is only ever told a beat COUNT. The count
// is the mount: 4 is the explain slide, 0 is the predict slide, which must open
// cold as a question with nothing posted and no way to post anything.
//
// Every figure on the panel is derived from two numbers - the load and the ramp
// length - and the invariant the slide rests on, work IN = work OUT, is
// arithmetic rather than a stored answer: the total printed in each card is
// that card's own effort times its own distance.

import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import { simTag } from 'simulations/base/SimUi.js';

const DIV = '\u00f7'; // the one non-ASCII glyph on the panel

// ---------------------------------------------------------------- the job
// g = 10 N per kg, the value every lesson in this bundle uses, so these are the
// numbers the prose can be checked against. Bag, shelf and load are the same
// three numbers blk-l07-s01's panel already posted, so this panel is that one
// rebuilt with two ledgers and a drag.
const G = 10;
const LOAD_KG = 200;
const LOAD_N = LOAD_KG * G; // 2000 N
const H_M = 1.0; // the shelf above the floor, so the job is 2000 J

// The ramp-length drag: 3 m to 5 m for a 1 m shelf, long enough that the effort
// really does fall to a fifth, which is the whole claim. The default
// (4.0 m -> 500 N) is the pair the previous slide's panel already showed.
const L_MIN = 3.0;
const L_MAX = 5.0;
const L_STEP = 0.5;
const L_START = 4.0;
const clampL = (m) => Math.max(L_MIN, Math.min(L_MAX, Math.round(m / L_STEP) * L_STEP));

// ---------------------------------------------------------------- the figure
// The hero's own drawing space. No number is printed inside it: every quantity
// the panel quotes is quoted once, in a ledger, and a figure that prints a
// second copy of it is a figure that can disagree with it.
const VB_W = 660;
const VB_H = 152;
const PPM = 76; // px per metre - ONE scale, never rescaled
const SHELF_Y = 58; // the board's top surface
const BOARD_H = 11;
const FLOOR_Y = SHELF_Y + H_M * PPM; // 134: the gap between them IS the 1 m
const HEAD_X = 600; // the plank's head, fixed against the board, in from the edge
const HOME_X = 168; // the bag's bottom centre, where it starts and where it ends
const BAG_HW = 40;
const BAG_H = 58;
const DROP = FLOOR_Y - SHELF_Y;
const ROUTE_X = HOME_X; // the straight route runs up the bag's own x
const RUNG_F = [0.24, 0.46, 0.68, 0.88];

// Where the plank's foot stands for a given length, and how steep it is. The
// head never moves: a plank is leaned against a fixed board and its foot slides.
const runOf = (m) => Math.sqrt(m * m - H_M * H_M) * PPM;
const footX = (m) => HEAD_X - runOf(m);
const degOf = (m) => (Math.atan2(-DROP, runOf(m)) * 180) / Math.PI;

// ---------------------------------------------------------------- the run
const TICK_MS = 50;
const RUN_ARM_MS = 400; // the beat lands, then the run starts
const RETURN_PLANK_MS = 420; // back down the plank
const RETURN_FLOOR_MS = 300; // and then along the floor to the start
const LIFT_MS = 950;
const TO_FOOT_MS = 300;
const PUSH_MS = 1250;
const HOLD_MS = 300;

// ---------------------------------------------------------------- the maps
// The explain slide's four beats, from its own STEP list.
const VERDICT_MAP = [
  [{ idx: 0, dwellMs: null }], // the verdict: both counters read the same
  [{ idx: 1, dwellMs: null }], // the three names
  [{ idx: 2, dwellMs: null }], // the ratio
  [{ idx: 3, dwellMs: null }], // the trade
];
// The beat-less setup mount (blk-l07-s02, role: "setup") arrives with a count of
// 0, so it is given a stage of its own: the same two ledgers with every entry
// unknown, no dial and no run, because anything that could post a number here
// would answer the question before it is asked.
const ASK_IDX = 3;
const ASK_MAP = [[{ idx: ASK_IDX, dwellMs: null }]];

const ROUTES = [
  { key: 'lift', tag: 'straight up' },
  { key: 'ramp', tag: 'up the ramp' },
];

const NOTE = [
  { text: 'One scale, no friction: the plank drawn is the plank measured.', sub: '200 kg and g = 10 N per kg make the 2000 N load' },
];

// The two measures' full scales, shared by both cards: that is what makes the
// two bars comparable at a glance.
const FORCE_FULL = LOAD_N;
const DIST_FULL = L_MAX;

// A force that drops its decimal when it is whole: 2000 N, 500 N and 400 N
// beside 666.7 N.
function fmtF(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
const fmtM = (m) => m.toFixed(1);
const qMark = () => '<span class="sim-q" aria-hidden="true">?</span>';

const CSS = `
.mwl-card { gap: var(--sim-space-3); }
.mwl-top { gap: var(--sim-space-2); }
.mwl-state { border-color: var(--sim-accent); color: var(--sim-accent); }
.mwl-hint { border-color: var(--sim-gold); color: var(--sim-gold); }
@media (prefers-reduced-motion: no-preference) {
  .mwl-hint:not([hidden]) { animation: mwl-pulse 1.6s ease-in-out infinite; }
}
@keyframes mwl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

/* The figure. The only things pinned over it are two names, and every pin is a
   percentage of the viewBox, so a pin lands on the same drawn point in
   landscape and in portrait. */
.mwl-figwrap { position: relative; min-width: 0; }
.mwl-fig { display: block; width: 100%; height: auto; }
.mwl-ground { fill: var(--sim-track); }
.mwl-floor { fill: var(--sim-stroke); }
.mwl-board { fill: var(--sim-wedge); }
.mwl-route { stroke: var(--sim-label-muted); stroke-width: 3; stroke-dasharray: 9 7; }
.mwl-route-head { stroke: var(--sim-label-muted); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
.mwl-plank { stroke: var(--sim-height); stroke-width: 13; stroke-linecap: butt; }
.mwl-rung { stroke: var(--sim-wedge); stroke-width: 4; stroke-linecap: round; }
.mwl-bag-shadow { fill: var(--sim-bg-deep); opacity: 0.35; }
.mwl-bag { fill: var(--sim-series-3); stroke: var(--sim-border); stroke-width: 2.5; }
.mwl-bag-shade { fill: var(--sim-bg-deep); opacity: 0.2; }
.mwl-bag-tie { fill: var(--sim-bg-surface); }

.mwl-pin {
  position: absolute;
  padding: 2px 10px;
  border: 2px solid var(--sim-accent);
  border-radius: var(--sim-radius-pill);
  background: var(--sim-bg-surface);
  color: var(--sim-accent);
  font-size: var(--sim-text-sm);
  font-weight: 800;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
}
.mwl-pin--load { transform: translate(-100%, -50%) scale(0.9); }
.mwl-pin--machine { transform: translate(-50%, 0) scale(0.9); }
[data-mount="verdict"][data-step="1"] .mwl-pin { opacity: 1; }
[data-mount="verdict"][data-step="1"] .mwl-pin--load { transform: translate(-100%, -50%) scale(1); }
[data-mount="verdict"][data-step="1"] .mwl-pin--machine { transform: translate(-50%, 0) scale(1); }
@media (prefers-reduced-motion: no-preference) {
  .mwl-pin { transition: opacity 240ms ease, transform 240ms ease; }
}

/* One row of actions, then the drag. */
.mwl-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-3); }
.mwl-btn {
  padding: var(--sim-space-2) var(--sim-space-4);
  border: var(--sim-border);
  border-radius: var(--sim-radius-pill);
  background: var(--sim-accent);
  color: var(--sim-bg-deep);
  font: inherit;
  font-size: var(--sim-text-md);
  font-weight: 800;
  cursor: pointer;
}
.mwl-btn--alt { background: var(--sim-bg-surface); color: var(--sim-label); }
.mwl-btn[disabled] { opacity: 0.5; cursor: progress; }
.mwl-btn:focus-visible, .mwl-dial input:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.mwl-dial { display: grid; grid-template-columns: auto minmax(90px, 1fr) 62px; align-items: center; gap: var(--sim-space-2); flex: 1 1 250px; min-width: 0; }
.mwl-dial input[type="range"] { width: 100%; }
.mwl-dial input[type="range"]:disabled { opacity: 0.5; }
.mwl-dial-val { font-size: var(--sim-text-md); font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
.mwl-lab { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
/* The moment the slide names the effort, the word on the entry the learner
   supplies is the thing that changes. */
[data-mount="verdict"][data-step="1"] .mwl-lab--effort {
  color: var(--sim-accent);
  padding: 1px 6px;
  border: 2px solid var(--sim-accent);
  border-radius: var(--sim-radius-pill);
}
[data-mount="verdict"][data-step="3"] .mwl-dial-lab {
  color: var(--sim-gold);
  padding: 1px 9px;
  border: 2px solid var(--sim-gold);
  border-radius: var(--sim-radius-pill);
}

/* The two ledgers: same width, same rows, same bar tracks. */
.mwl-ledgers { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); align-items: start; }
.mwl-led { gap: var(--sim-space-2); }
.mwl-entry { display: grid; grid-template-columns: 80px minmax(0, 1fr) 70px; align-items: center; gap: var(--sim-space-2); }
.mwl-bar { display: block; height: 14px; border-radius: var(--sim-radius-pill); background: var(--sim-bg-deep); border: 2px solid var(--sim-stroke); overflow: hidden; }
.mwl-bar-fill { display: block; height: 100%; width: 0%; background: var(--sim-accent); border-radius: var(--sim-radius-pill); }
.mwl-val { font-size: var(--sim-text-md); line-height: 1.2; font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
.mwl-total { display: flex; align-items: baseline; gap: var(--sim-space-2); margin-top: var(--sim-space-1); padding-top: var(--sim-space-2); border-top: 2px solid var(--sim-stroke); }
.mwl-total-lab { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
.mwl-total-val { margin-left: auto; font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.05; }
.mwl-held { align-self: center; }
.mwl-led--posted { border-color: var(--sim-accent); box-shadow: 0 var(--sim-lift) 0 var(--sim-accent); }
.mwl-led--posted .mwl-total { border-top-color: var(--sim-accent); }
.mwl-flash { animation: mwl-hold 560ms ease-out; }
@keyframes mwl-hold {
  0% { box-shadow: 0 0 0 3px var(--sim-gold); }
  100% { box-shadow: 0 0 0 0 var(--sim-gold); }
}
@media (prefers-reduced-motion: no-preference) {
  .mwl-bar-fill, .mwl-val, .mwl-total-val { transition: width 220ms ease, color 200ms ease; }
}
/* On the ratio beat the work is on the panel but out of the fraction. */
[data-mount="verdict"][data-step="2"] .mwl-total-lab,
[data-mount="verdict"][data-step="2"] .mwl-total-val { opacity: 0.4; }

/* The advantage: the only new figure on beat 2. Every child is flex: none, so
   the row is one line at any width that fits it and wraps as a whole in
   portrait - never one figure at a time. */
.mwl-ma { flex-direction: row; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2) var(--sim-space-3); }
.mwl-ma > * { flex: none; }
.mwl-num { font-size: var(--sim-text-lg); font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mwl-op { font-size: var(--sim-text-lg); font-weight: 800; color: var(--sim-label-muted); }
.mwl-adv { font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--sim-accent); }

/* The note is permanent background here, not a modal the learner opens: stock
   .sl-note is a full-cover overlay, which would hide the bag and both totals. */
.mwl-note:empty { display: none; }
.mwl-note .sl-note { position: static; inset: auto; z-index: auto; display: block; padding: 0; background: none; animation: none; }
.mwl-note .sl-note__card { width: 100%; margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px; gap: var(--sim-space-2); animation: none; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); }
.mwl-note .sl-note__badge { position: static; inset: auto; transform: none; align-self: flex-start; font-size: var(--sim-text-sm); padding: 1px 9px; }
.mwl-note .sl-note__row { grid-template-columns: 22px minmax(0, 1fr); column-gap: var(--sim-space-2); animation: none; }
.mwl-note .sl-note__icon { width: 22px; height: 22px; }
.mwl-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.mwl-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; }

.sim-dom-root--portrait .mwl-ledgers { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .mwl-ma { flex-direction: column; align-items: flex-start; }
.sim-dom-root--portrait .mwl-ma { flex-direction: column; align-items: flex-start; }
.sim-dom-root--portrait .mwl-dial { grid-template-columns: minmax(0, 1fr) 62px; flex: 1 1 100%; }
.sim-dom-root--portrait .mwl-dial-lab { grid-column: 1 / -1; }
`;

// The figure, minus the two moving parts (the plank's foot and the bag), which
// are placed by code. The rungs are real elements placed by code too, so the
// plank is never re-parsed out of a string.
function figureSvg() {
  return `<svg class="mwl-fig" viewBox="0 0 ${VB_W} ${VB_H}" role="img"
      aria-label="A sack on the floor under a shelf one metre above it, with a plank leaning from the floor up to the far end of the shelf.">
    <rect class="mwl-ground" x="0" y="${FLOOR_Y}" width="${VB_W}" height="${VB_H - FLOOR_Y}"/>
    <rect class="mwl-floor" x="0" y="${FLOOR_Y - 4}" width="${VB_W}" height="6" rx="3"/>
    <rect class="mwl-board" x="14" y="${SHELF_Y}" width="${VB_W - 14}" height="${BOARD_H}" rx="5"/>
    <rect class="mwl-board" x="14" y="${SHELF_Y + BOARD_H}" width="12" height="${FLOOR_Y - SHELF_Y - BOARD_H}" rx="4"/>
    <rect class="mwl-board" x="86" y="${SHELF_Y + BOARD_H}" width="10" height="14" rx="3"/>
    <line class="mwl-plank" data-plank x1="${footX(L_START).toFixed(1)}" y1="${FLOOR_Y}" x2="${HEAD_X}" y2="${SHELF_Y}"/>
    ${RUNG_F.map((f, i) => {
      const px = footX(L_START) + (HEAD_X - footX(L_START)) * f;
      const py = FLOOR_Y - DROP * f;
      return `<line class="mwl-rung" data-rung="${i}" x1="${(px - 4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px + 4).toFixed(1)}" y2="${py.toFixed(1)}"/>`;
    }).join('')}
    <g data-bag>
      <ellipse class="mwl-bag-shadow" cx="0" cy="2" rx="${BAG_HW + 8}" ry="5"/>
      <rect class="mwl-bag" x="${-BAG_HW}" y="${-BAG_H + 15}" width="${BAG_HW * 2}" height="${BAG_H - 15}" rx="17"/>
      <rect class="mwl-bag-shade" x="${-BAG_HW}" y="-26" width="${BAG_HW * 2}" height="26" rx="17"/>
      <rect class="mwl-bag" x="-16" y="${-BAG_H}" width="32" height="16" rx="7"/>
      <rect class="mwl-bag-tie" x="-20" y="${-BAG_H + 15}" width="40" height="7" rx="3"/>
    </g>
    <line class="mwl-route" x1="${ROUTE_X}" y1="${FLOOR_Y}" x2="${ROUTE_X}" y2="${SHELF_Y + 3}"/>
    <path class="mwl-route-head" d="M ${ROUTE_X - 9} ${SHELF_Y + 15} L ${ROUTE_X} ${SHELF_Y + 3} L ${ROUTE_X + 9} ${SHELF_Y + 15}"/>
  </svg>`;
}

function entryRow(key, kind, label) {
  const lab = kind === 'effort' && key === 'ramp' ? ' mwl-lab--effort' : '';
  return `<div class="mwl-entry" data-entry="${key}-${kind}">
      <span class="mwl-lab${lab}">${label}</span>
      <span class="mwl-bar"><span class="mwl-bar-fill" data-bar="${key}-${kind}"></span></span>
      <span class="mwl-val" data-val="${key}-${kind}">${qMark()}</span>
    </div>`;
}

// One route, one card: its name, the two entries it posts, and the total that
// does not move. A dashed border and six question marks are the predict mount's
// whole state.
function ledgerCard(key, tag) {
  return `<div class="sim-card mwl-led" data-led="${key}">
      <div class="sim-row mwl-led-top">${simTag(tag)}</div>
      ${entryRow(key, 'effort', 'effort')}
      ${entryRow(key, 'dist', 'distance')}
      <div class="mwl-total" data-total="${key}">
        <span class="mwl-total-lab">work</span>
        <span class="mwl-total-val" data-work="${key}">${qMark()}</span>
        <span class="sim-tag mwl-held" data-held="${key}" hidden>held</span>
      </div>
    </div>`;
}

function panelHtml() {
  return `<div class="sim-card mwl-card">
    <div class="sim-row mwl-top">
      <span class="sim-tag mwl-state" data-state>on the floor</span>
      <span class="sim-tag mwl-hint" data-hint hidden>run the lift</span>
    </div>
    <div class="mwl-figwrap">
      ${figureSvg()}
      <span class="mwl-pin mwl-pin--load" data-pin="load">load</span>
      <span class="mwl-pin mwl-pin--machine" data-pin="machine">simple machine</span>
    </div>
    <div class="mwl-actions" data-acts>
      <button class="mwl-btn" type="button" data-run="lift">Run the lift</button>
      <button class="mwl-btn mwl-btn--alt" type="button" data-run="ramp">Run the ramp</button>
      <label class="mwl-dial">
        <span class="mwl-lab mwl-dial-lab">ramp length</span>
        <input type="range" min="${L_MIN}" max="${L_MAX}" step="${L_STEP}" value="${L_START}" data-len aria-label="Ramp length in metres">
        <span class="mwl-dial-val" data-len-out>${fmtM(L_START)} m</span>
      </label>
    </div>
    <div class="mwl-ledgers" data-ledgers>
      ${ROUTES.map((r) => ledgerCard(r.key, r.tag)).join('')}
    </div>
    <div class="sim-card mwl-ma" data-ma hidden>
      ${simTag('mechanical advantage', { accent: true })}
      <span class="mwl-num" data-frac-load>${fmtF(LOAD_N)} N</span>
      <span class="mwl-op">${DIV}</span>
      <span class="mwl-num" data-frac-eff>${fmtF(LOAD_N / L_START)} N</span>
      <span class="mwl-op">=</span>
      <b class="mwl-adv" data-frac-val>${(LOAD_N / (LOAD_N / L_START)).toFixed(2)}</b>
    </div>
    <div class="mwl-note" data-note></div>
  </div>`;
}

export class MachineWorkLedgerScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 560; // sim-layout natural 549 landscape
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 795; // sim-layout naturals 777-783 portrait
  static MIN_SCALE = 1;
  // The setup mount is a question and the explain mount is an argument, and the
  // two carry different amounts of panel, so the frame follows what is showing.
  static FIT = true;
  static BEAT_STEP_MAP = VERDICT_MAP;
  static BEAT_MAPS = { 4: VERDICT_MAP, 0: ASK_MAP };
  static ARIA_LABEL =
    'A sack on the floor under a shelf, with a plank leaning against the shelf. A ramp-length dial sets '
    + 'the plank from three to five metres. Each of the two routes has a ledger beside it: the straight '
    + 'lift posts two thousand newtons over one metre, the ramp posts a smaller force over a longer '
    + 'distance, and both ledgers read two thousand joules. Buttons run each route in turn.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.mount = 'verdict';
    this.beat = 0;
    this.rampM = L_START;
    this.posted = { lift: false, ramp: false };
    this.bag = { x: HOME_X, y: FLOOR_Y, deg: 0, on: 'floor' };
    this.run = null;
    this.timers = [];
    this.dragged = false;
    this.celebrated = false;
  }

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, rootClass: 'mwl-root', html: panelHtml() });

    const find = (sel) => this.root?.querySelector?.(sel) ?? null;
    this._state = find('[data-state]');
    this._hint = find('[data-hint]');
    this._acts = find('[data-acts]');
    this._dial = find('[data-len]');
    this._dialOut = find('[data-len-out]');
    this._plank = find('[data-plank]');
    this._rungs = RUNG_F.map((f, i) => find(`[data-rung="${i}"]`));
    this._bag = find('[data-bag]');
    this._pinLoad = find('[data-pin="load"]');
    this._pinMachine = find('[data-pin="machine"]');
    this._ma = find('[data-ma]');
    this._fracLoad = find('[data-frac-load]');
    this._fracEff = find('[data-frac-eff]');
    this._fracVal = find('[data-frac-val]');
    this._note = find('[data-note]');
    this._burstHost = find('[data-ledgers]');
    this._cards = {};
    for (const r of ROUTES) {
      this._cards[r.key] = {
        card: find(`[data-led="${r.key}"]`),
        eff: find(`[data-val="${r.key}-effort"]`),
        dist: find(`[data-val="${r.key}-dist"]`),
        work: find(`[data-work="${r.key}"]`),
        barEff: find(`[data-bar="${r.key}-effort"]`),
        barDist: find(`[data-bar="${r.key}-dist"]`),
        held: find(`[data-held="${r.key}"]`),
        total: find(`[data-total="${r.key}"]`),
      };
    }
    this._btns = { lift: find('[data-run="lift"]'), ramp: find('[data-run="ramp"]') };

    this._dial?.addEventListener?.('input', () => this.setRamp(Number(this._dial.value), true));
    this._btns.lift?.addEventListener?.('click', () => this.runRoute('lift'));
    this._btns.ramp?.addEventListener?.('click', () => this.runRoute('ramp'));
    if (this._note) this._note.innerHTML = noteCardHtml(NOTE);
    this.onStep();
  }

  destroy() {
    this.stopRun();
    this._state = null;
    this._hint = null;
    this._acts = null;
    this._dial = null;
    this._dialOut = null;
    this._plank = null;
    this._rungs = null;
    this._bag = null;
    this._pinLoad = null;
    this._pinMachine = null;
    this._ma = null;
    this._fracLoad = null;
    this._fracEff = null;
    this._fracVal = null;
    this._note = null;
    this._burstHost = null;
    this._cards = null;
    this._btns = null;
    super.destroy();
  }

  // ------------------------------------------------------------------ beats

  // The host hands over a count and never the slide, so the count IS the mount.
  onBeatChange(beatIndex, beatCount) {
    const map = this.constructor.BEAT_MAPS[beatCount] ?? this.constructor.BEAT_STEP_MAP;
    this.mount = map === ASK_MAP ? 'ask' : 'verdict';
    const n = Number.isFinite(beatIndex) ? Math.trunc(beatIndex) : 0;
    this.beat = Math.max(0, Math.min(n, map.length - 1));
    this.stepIndex = this.mount === 'ask' ? ASK_IDX : this.beat;
    this._syncDataset();
    this.onStep();
  }

  _syncDataset() {
    if (!this.root) return;
    this.root.dataset.step = String(this.mount === 'ask' ? ASK_IDX : this.beat);
    this.root.dataset.mount = this.mount;
  }

  onStep() {
    // A run belongs to the beat that launched it, so a beat change drops it. The
    // postings do not: every beat of this slide is talking about the two numbers
    // the run put on the panel, and a posting that vanished on the next beat
    // would be a number this beat never earned.
    this.stopRun();
    this._syncDataset();
    this._paint();
    // A learner arriving on any beat of the explain mount with an empty panel is
    // a resumed lesson: post both routes, or the slide's numbers are not there.
    if (this.mount === 'verdict' && !this.posted.lift && !this.posted.ramp) {
      this._arm(RUN_ARM_MS, () => this._runOne('lift', true));
    }
  }

  // ------------------------------------------------------------------ dial

  // The learner's own dial. It locks during a run, so a posting is never made at
  // one length and read at another.
  setRamp(m, fromHand) {
    if (this.mount !== 'verdict' || this.run) return false;
    const next = clampL(Number.isFinite(m) ? m : L_START);
    if (next === this.rampM) return false;
    this.rampM = next;
    if (this._dial) this._dial.value = String(next);
    if (fromHand) {
      this.dragged = true;
      // The concept is found when the effort is a quarter of the load and the
      // total does not move: not when the dial was touched.
      const quarter = Math.abs(next - L_START) < 1e-9;
      if (!this.celebrated && quarter && this.mount === 'verdict') {
        this.celebrated = true;
        this._flashBoth();
        this._celebrate();
      } else if (this.mount === 'verdict') {
        this._flashBoth();
      }
    }
    this._paint();
    return true;
  }

  _flashBoth() {
    for (const r of ROUTES) this._flash(r.key);
  }

  _flash(key) {
    const el = this._cards?.[key]?.total;
    if (!el) return;
    el.classList.remove('mwl-flash');
    void el.offsetWidth;
    el.classList.add('mwl-flash');
  }

  _celebrate() {
    if (this._burstHost) burst(this._burstHost);
  }

  // ------------------------------------------------------------------ run

  _arm(ms, fn) {
    const id = setTimeout(() => {
      this.timers = this.timers.filter((t) => t !== id);
      fn();
    }, ms);
    this.timers.push(id);
  }

  stopRun() {
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
    this.run = null;
  }

  runRoute(key) {
    if (this.mount !== 'verdict' || this.run) return false;
    this._runOne(key, false);
    return true;
  }

  _runOne(key, chained) {
    if (this.mount !== 'verdict' || this.run) return;
    const phases = this._phases(key);
    this.run = { key, phases, i: 0, t: 0, chained };
    this.posted[key] = true;
    this.animateFor?.(phases.reduce((s, p) => s + p.ms, 0) + 400);
    this.advanceRun(TICK_MS);
  }

  // A run is a list of poses to travel between, so the bag is somewhere real on
  // every tick, every run ends with the bag back on the floor, and the posting -
  // not the bag - is the evidence a run leaves behind.
  _phases(key) {
    const out = [];
    // Whatever the bag is doing when the learner presses the button, it goes
    // back to the foot of its route first: down the plank if it is on the plank.
    if (this.bag.on === 'plank') out.push({ kind: 'plank', from: 1, to: 0, ms: RETURN_PLANK_MS, counts: false });
    const offHome = this.bag.on !== 'floor' || Math.abs(this.bag.x - HOME_X) > 0.5 || Math.abs(this.bag.y - FLOOR_Y) > 0.5;
    if (offHome) out.push({ kind: 'home', ms: RETURN_FLOOR_MS, counts: false });
    if (key === 'lift') {
      out.push({ kind: 'floor', from: this.poseHome(), to: { x: HOME_X, y: SHELF_Y + 2, deg: 0 }, ms: LIFT_MS, counts: true });
    } else {
      out.push({ kind: 'floor', from: this.poseHome(), to: this.poseAt(0), ms: TO_FOOT_MS, counts: false });
      out.push({ kind: 'plank', from: 0, to: 1, ms: PUSH_MS, counts: true });
    }
    out.push({ kind: 'hold', ms: HOLD_MS, counts: false });
    if (key === 'ramp') out.push({ kind: 'plank', from: 1, to: 0, ms: RETURN_PLANK_MS, counts: false });
    out.push({ kind: 'home', ms: RETURN_FLOOR_MS, counts: false });
    return out;
  }

  poseHome() {
    return { x: HOME_X, y: FLOOR_Y, deg: 0 };
  }

  poseAt(f) {
    const m = this.rampM;
    const fx = footX(m);
    return {
      x: fx + (HEAD_X - fx) * f,
      y: FLOOR_Y + (SHELF_Y - FLOOR_Y) * f,
      deg: degOf(m),
    };
  }

  // NOT named _tick: DomSimulation opens a real rAF loop for any subclass that
  // defines _tick, and this chain already advances on its own timer. It takes an
  // argument only so the drive script can step the same chain.
  advanceRun(ms = TICK_MS) {
    const r = this.run;
    if (!r) return;
    r.t += ms;
    const ph = r.phases[r.i];
    const f = Math.min(1, r.t / ph.ms);
    if (ph.kind === 'plank') {
      const p = this.poseAt(ph.from + (ph.to - ph.from) * f);
      this.bag = { x: p.x, y: p.y, deg: p.deg, on: 'plank' };
    } else if (ph.kind === 'home') {
      // Captured once, on the first tick: after that it is a straight lerp to
      // the floor from wherever this run found the bag.
      if (!ph.from) ph.from = { x: this.bag.x, y: this.bag.y, deg: this.bag.deg };
      this.bag = {
        x: ph.from.x + (HOME_X - ph.from.x) * f,
        y: ph.from.y + (FLOOR_Y - ph.from.y) * f,
        deg: ph.from.deg * (1 - f),
        on: 'floor',
      };
    } else if (ph.kind === 'floor') {
      this.bag = {
        x: ph.from.x + (ph.to.x - ph.from.x) * f,
        y: ph.from.y + (ph.to.y - ph.from.y) * f,
        deg: ph.from.deg + (ph.to.deg - ph.from.deg) * f,
        on: 'floor',
      };
    }
    this._paint();
    if (r.t >= ph.ms) {
      r.t = 0;
      r.i += 1;
      if (r.i >= r.phases.length) {
        const chained = r.chained;
        this.run = null;
        this._paint();
        // The lift has landed; the ramp's own run carries the bag out and back.
        if (chained) this._arm(140, () => this._runOne('ramp', false));
        return;
      }
    }
    this._arm(TICK_MS, () => this.advanceRun(TICK_MS));
  }

  // ------------------------------------------------------------------ paint

  // Each route's three figures come out of its own two numbers, on every paint,
  // at every dial setting: no figure can outlive the length that made it.
  _nums(key) {
    const L = this.rampM;
    const effort = key === 'lift' ? LOAD_N : LOAD_N / L;
    const dist = key === 'lift' ? H_M : L;
    return { effort, dist, work: effort * dist };
  }

  _paint() {
    if (!this._cards) return;
    const ask = this.mount === 'ask';
    const live = this.run ? this.run.key : null;
    for (const r of ROUTES) {
      const c = this._cards[r.key];
      if (!c) continue;
      const n = this._nums(r.key);
      const shown = !ask && this.posted[r.key];
      if (c.eff) c.eff.innerHTML = shown ? `${fmtF(n.effort)} N` : qMark();
      if (c.dist) c.dist.innerHTML = shown ? `${fmtM(n.dist)} m` : qMark();
      if (c.barEff) c.barEff.style.width = shown ? `${((n.effort / FORCE_FULL) * 100).toFixed(1)}%` : '0%';
      if (c.barDist) c.barDist.style.width = shown ? `${((n.dist / DIST_FULL) * 100).toFixed(1)}%` : '0%';
      if (c.work) {
        // A counter on its way up is a whole number of joules; the figure it
        // lands on is this card's own effort times this card's own distance.
        const w = shown ? Math.round((live === r.key ? this._workFrac() : 1) * n.work) : null;
        c.work.innerHTML = w == null ? qMark() : `${w} J`;
      }
      c.card?.classList.toggle('mwl-led--posted', !!shown);
      if (c.held) c.held.hidden = !shown || this.beat !== 3;
    }

    if (this._dialOut) this._dialOut.textContent = `${fmtM(this.rampM)} m`;
    if (this._acts) this._acts.hidden = ask;
    if (this._dial) this._dial.disabled = !!this.run;
    for (const key of ['lift', 'ramp']) {
      if (this._btns?.[key]) this._btns[key].disabled = !!this.run;
    }

    // The advantage is a fraction of the two posted numbers, computed here and
    // not carried: it moves when the drag moves the effort. It appears only once
    // there is a posting to divide, so it never shows a question mark.
    const rampN = this._nums('ramp');
    const postedRamp = !ask && this.posted.ramp;
    if (this._ma) this._ma.hidden = ask || this.beat !== 2 || !postedRamp;
    if (this._fracLoad) this._fracLoad.textContent = `${fmtF(LOAD_N)} N`;
    if (this._fracEff) this._fracEff.textContent = `${fmtF(rampN.effort)} N`;
    if (this._fracVal) this._fracVal.textContent = (LOAD_N / rampN.effort).toFixed(2);

    if (this._state) {
      this._state.textContent = ask
        ? 'same bag, same shelf'
        : (this.run
          ? 'on its way'
          : (!this.posted.lift && !this.posted.ramp ? 'nothing posted' : (this.posted.ramp ? 'both routes posted' : 'one route posted')));
    }
    if (this._hint) {
      const done = this.posted.lift && this.posted.ramp;
      this._hint.hidden = ask || !!this.run || (done && (this.beat !== 3 || this.dragged));
      this._hint.textContent = !this.posted.lift ? 'run the lift' : (this.posted.ramp ? 'drag the ramp' : 'run the ramp');
    }

    this._placePlank();
    this._placeBag();
  }

  // How far the posting route's own product has climbed, over the travelling
  // phase only: the bag walking out to the plank has not pushed anything yet.
  _workFrac() {
    const r = this.run;
    if (!r) return 1;
    let total = 0;
    let done = 0;
    for (let i = 0; i < r.phases.length; i += 1) {
      const ph = r.phases[i];
      if (!ph.counts) continue;
      total += ph.ms;
      if (i < r.i) done += ph.ms;
      else if (i === r.i) done += Math.min(ph.ms, r.t);
    }
    return total > 0 ? Math.min(1, done / total) : 1;
  }

  // The plank's foot slides, its head does not, and its drawn length is the
  // ledger's distance: one scale, so the drawing is the measurement.
  _placePlank() {
    const fx = footX(this.rampM);
    const run = HEAD_X - fx;
    const len = Math.hypot(run, DROP);
    const nx = DROP / len;
    const ny = run / len;
    this._plank?.setAttribute('x1', fx.toFixed(1));
    this._rungs?.forEach((el, i) => {
      if (!el) return;
      const px = fx + run * RUNG_F[i];
      const py = FLOOR_Y - DROP * RUNG_F[i];
      el.setAttribute('x1', (px - nx * 4.5).toFixed(1));
      el.setAttribute('y1', (py - ny * 4.5).toFixed(1));
      el.setAttribute('x2', (px + nx * 4.5).toFixed(1));
      el.setAttribute('y2', (py + ny * 4.5).toFixed(1));
    });
    // The name rides under the middle of the plank, in the plank's own units.
    this._pinAt(this._pinMachine, fx + run * 0.5 + nx * 20, FLOOR_Y - DROP * 0.5 + ny * 20);
    this._pinAt(this._pinLoad, HOME_X - BAG_HW - 12, FLOOR_Y - BAG_H * 0.42);
  }

  // A pin is a percentage of the viewBox, so it lands on the same drawn point at
  // whatever width the host gives the frame.
  _pinAt(el, x, y) {
    if (!el) return;
    el.style.left = `${((x / VB_W) * 100).toFixed(2)}%`;
    el.style.top = `${((y / VB_H) * 100).toFixed(2)}%`;
  }

  _placeBag() {
    const b = this.bag;
    if (!this._bag) return;
    const deg = Math.abs(b.deg) < 0.05 ? '' : ` rotate(${b.deg.toFixed(2)})`;
    this._bag.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})${deg}`);
  }
}
