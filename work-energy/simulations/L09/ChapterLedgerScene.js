// ChapterLedgerScene.js
//
// blk-l09-s05 (3 beats): the chapter's At a Glance as a live accounting page.
// Six rows - work, energy, kinetic, potential, power, machines - each with the one
// line saying what that idea was for, and ONE rule line drawn under the lot.
//
// The scene's whole job is the reading move the slide asks for: read down the
// panel, then read across it, and find the same sentence in every row. So the
// rule is posted once, in a band beneath the table, and the six rows carry the
// compressed form of it. On beat 1 the sentence arrives with a visible gap where
// its condition belongs (`condition: ?`) and the balance beam is tilted; on beat
// 2 the condition fills in and the beam levels. There is no beat on which the
// panel shows an unconditional law, because the stub's hard requirement is that
// the rule is never stated without its condition.
//
// One mount, no run, no dial, no total that can move: a ledger that could be
// adjusted would be arguing against the sentence it is printing.

import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import { esc, simTag } from 'simulations/base/SimUi.js';

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // six rows, one at a time; no rule band
  [{ idx: 1, dwellMs: null }], // the rule line once, across all six rows, condition still missing
  [{ idx: 2, dwellMs: null }], // the condition attached; the beam levels
];

// The six rows, in the chapter's own order. `for` is the row's own label: what
// that idea was for, cut to label length. The slide carries the sentences.
const ROWS = [
  { key: 'work', name: 'work', for: 'what a force did' },
  { key: 'energy', name: 'energy', for: 'what there was to spend' },
  { key: 'kinetic', name: 'kinetic', for: 'the store, held by motion' },
  { key: 'potential', name: 'potential', for: 'the store, held by position' },
  { key: 'power', name: 'power', for: 'how fast the work is spent' },
  { key: 'machines', name: 'machines', for: 'rearrange the spending' },
];

// The rule cell. The same two words in all six rows, which is the whole claim:
// whatever else the chapter did, the books closed the same way every time.
const RULE_CELL = 'in = out';

// Posted once, in full, and the only place on the panel the rule appears as a
// sentence. Its tail is a live slot: a dashed `condition: ?` on beat 1, the
// condition itself on beat 2.
const RULE_SENTENCE = 'What goes in comes out. Energy only ever changes form.';
const CONDITION_ASK = 'condition: ?';
const CONDITION = 'only while nothing outside is adding to or taking';

const NOTE_ROWS = [
  { text: 'a ledger, not a measurement', sub: 'no number on this page can be moved' },
];

const BURST_GAP_MS = 700; // a guard so a mashed button is not a confetti machine

const CSS = `
.sim-dom-root .cl-board { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.sim-dom-root .cl-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2); }
.sim-dom-root .cl-count { border-radius: var(--sim-radius-sm); font-variant-numeric: tabular-nums; }
.sim-dom-root .cl-btn {
  font: inherit; font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 7px var(--sim-space-3); border: var(--sim-border);
  border-radius: var(--sim-radius-sm); background: var(--sim-accent); color: var(--sim-bg-deep);
  cursor: pointer;
}
.sim-dom-root .cl-btn:focus-visible { outline: 3px solid var(--sim-label); outline-offset: 2px; }
.sim-dom-root .cl-hint { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
@media (prefers-reduced-motion: no-preference) {
  .sim-dom-root .cl-hint:not([hidden]) { animation: cl-pulse 1.6s ease-in-out infinite; }
}
@keyframes cl-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }

/* ---- the table. Two columns to begin with: the rule column arrives with the
   rule, on beat 1, so there is never a hole where a column should be. */
.sim-dom-root .cl-table {
  display: grid; grid-template-columns: minmax(84px, auto) minmax(0, 1fr);
  column-gap: var(--sim-space-3); row-gap: var(--sim-space-2); align-items: center;
}
.sim-dom-root[data-step="1"] .cl-table,
.sim-dom-root[data-step="2"] .cl-table {
  grid-template-columns: minmax(84px, auto) minmax(0, 1fr) auto 16px;
}
.sim-dom-root .cl-th {
  font-size: var(--sim-text-sm); font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--sim-label-muted); padding-bottom: 2px;
  border-bottom: 2px solid var(--sim-stroke);
}
.sim-dom-root .cl-rowname { justify-self: start; }
.sim-dom-root .cl-for {
  font-size: var(--sim-text-md); font-weight: 600; line-height: 1.25; color: var(--sim-label);
  min-width: 0; overflow-wrap: anywhere;
}
.sim-dom-root .cl-cell {
  justify-self: start; padding: 2px var(--sim-space-2); border: 2px solid var(--sim-accent);
  border-radius: var(--sim-radius-pill); background: var(--sim-accent); color: var(--sim-bg-deep);
  font-size: var(--sim-text-sm); font-weight: 800; white-space: nowrap;
}
/* The bracket down the rule column. It is what makes the six cells read as one
   group rather than six separate chips. */
.sim-dom-root .cl-rail {
  border: 3px solid var(--sim-accent); border-left: none; border-radius: 0 8px 8px 0;
  align-self: stretch;
}

/* ---- the rule band: the one sentence, its tail, and the beam that reads as
   balanced only once the condition is on the page. */
.sim-dom-root .cl-band {
  display: flex; flex-direction: column; gap: var(--sim-space-2); align-items: flex-start;
  padding: var(--sim-space-3); border: 2px solid var(--sim-accent);
  border-radius: var(--sim-radius-md);
  background: color-mix(in oklab, var(--sim-accent) 10%, var(--sim-bg-surface));
}
.sim-dom-root .cl-bandtop {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: var(--sim-space-2); align-self: stretch;
}
.sim-dom-root .cl-sent { margin: 0; font-size: var(--sim-text-lg); font-weight: 800; line-height: 1.3; }
.sim-dom-root .cl-tail {
  display: inline-block; font-size: var(--sim-text-md); font-weight: 800; line-height: 1.3;
}
.sim-dom-root .cl-tail--ask {
  padding: 1px var(--sim-space-2); border: 2px dashed var(--sim-label-muted);
  border-radius: var(--sim-radius-sm); color: var(--sim-label-muted);
}
.sim-dom-root .cl-tail--set { color: var(--sim-accent); }
.sim-dom-root .cl-beam { display: block; width: 120px; height: auto; flex: none; }
.sim-dom-root .cl-beamline { stroke: var(--sim-label); stroke-width: 5; stroke-linecap: round; }
.sim-dom-root .cl-hang { stroke: var(--sim-label-muted); stroke-width: 3.5; fill: none; }
.sim-dom-root .cl-pan {
  fill: color-mix(in oklab, var(--sim-series-2) 40%, var(--sim-bg-surface));
  stroke: var(--sim-accent); stroke-width: 4; stroke-linejoin: round;
}
.sim-dom-root .cl-foot { fill: var(--sim-label-muted); }
.sim-dom-root .cl-arm {
  transform-box: view-box; transform-origin: 120px 40px;
  transform: rotate(6deg);
  transition-property: transform;
  transition-duration: 420ms;
  transition-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
}
.sim-dom-root[data-step="2"] .cl-arm { transform: rotate(0deg); }

/* ---- the press that re-reads the six cells as one sentence. */
.sim-dom-root .cl-flash { animation: cl-read 620ms ease-out; }
@keyframes cl-read {
  0% { background-color: var(--sim-accent); }
  100% { background-color: transparent; }
}
.sim-dom-root .cl-rail.cl-flash { background-color: var(--sim-accent); }

/* ---- the note, laid out as a strip at the foot rather than the kit's modal
   overlay, which would dim a page the learner is meant to be reading. */
.sim-dom-root .cl-note:empty { display: none; }
.sim-dom-root .cl-note .sl-note { position: static; inset: auto; z-index: auto; display: block; padding: 0; background: none; animation: none; }
.sim-dom-root .cl-note .sl-note__card {
  width: 100%; margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px;
  gap: var(--sim-space-2); animation: none;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep));
}
.sim-dom-root .cl-note .sl-note__badge { position: static; inset: auto; transform: none; align-self: flex-start; font-size: var(--sim-text-sm); padding: 1px 9px; }
.sim-dom-root .cl-note .sl-note__row { grid-template-columns: 22px minmax(0, 1fr); column-gap: var(--sim-space-2); animation: none; }
.sim-dom-root .cl-note .sl-note__icon { width: 22px; height: 22px; }
.sim-dom-root .cl-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.sim-dom-root .cl-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; }
`;

function beamSvg() {
  // Drawn at 2 units per px, pivot dead centre. The tilt is the whole figure: a
  // beam that hangs crooked is the claim "the books do not close" made without
  // a word, and levelling it is the condition landing.
  return `<svg class="cl-beam" viewBox="0 0 240 84" role="img"
      aria-label="A balance beam on a triangular pivot. It hangs tilted while the rule has no condition, and levels when the condition is stated.">
    <path class="cl-foot" d="M 120 40 L 146 80 L 94 80 Z"/>
    <g class="cl-arm">
      <line class="cl-beamline" x1="16" y1="40" x2="224" y2="40"/>
      <path class="cl-hang" d="M 60 40 L 60 52 M 180 40 L 180 52"/>
      <path class="cl-pan" d="M 38 52 q 22 22 44 0 Z M 158 52 q 22 22 44 0 Z"/>
    </g>
  </svg>`;
}

// The table. Every cell carries its own place in the grid (data-row / data-col),
// placed once in setup(), because the rule column and the rail only exist from
// beat 1 and a grid that reflows under the learner is a table that lies.
function tableHtml() {
  const head = `<div class="cl-th cl-rowname" data-row="0" data-col="1">idea</div>`
    + `<div class="cl-th" data-row="0" data-col="2">what it was for</div>`
    + `<div class="cl-th" data-row="0" data-col="3">${esc(RULE_CELL)}</div>`;
  const body = ROWS.map((r, i) => {
    const n = i + 1;
    return `<div class="cl-rowname" data-row="${n}" data-col="1">${simTag(esc(r.name))}</div>`
      + `<div class="cl-for" data-row="${n}" data-col="2">${esc(r.for)}</div>`
      + `<div class="cl-cell" data-row="${n}" data-col="3" data-cell="${r.key}">${esc(RULE_CELL)}</div>`;
  }).join('');
  return `<div class="cl-table" data-table>${head}<div class="cl-rail" data-rail data-row="1" data-col="4"></div>${body}</div>`;
}

const HTML = `<div class="sim-card sl-backdrop cl-board">
  <div class="cl-head">
    <span class="sim-tag cl-count" data-count>row 1 of 6</span>
    <button class="cl-btn" type="button" data-next>next row</button>
    <span class="cl-hint" data-hint>add the rows one at a time</span>
  </div>
  ${tableHtml()}
  <div class="cl-band" data-band>
    <div class="cl-bandtop">
      ${simTag('one rule, six rows', { accent: true })}
      ${beamSvg()}
    </div>
    <p class="cl-sent">${esc(RULE_SENTENCE)}</p>
    <span class="cl-tail cl-tail--ask" data-tail>${esc(CONDITION_ASK)}</span>
  </div>
  <div class="cl-note" data-note>${noteCardHtml(NOTE_ROWS, 'NOTE')}</div>
</div>`;

export class ChapterLedgerScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 565; // sim-layout naturals 248 (b0) - 561 (b1) in landscape; FIT sizes the rest
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 975; // sim-layout naturals 293 (b0) - 972 (b2) in portrait
  static MIN_SCALE = 1;
  // Read-only page whose beats differ a lot in height: beat 0 is a half-built
  // table, beats 1-2 add a whole rule band under it.
  static FIT = true;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL =
    'The chapter in six rows: work, energy, kinetic, potential, power and machines, each with one line '
    + 'saying what that idea was for. A button adds the rows one at a time. Under the table a single rule '
    + 'line is posted once for all six rows - what goes in comes out, energy only ever changes form - with a '
    + 'gap where its condition belongs; the last beat fills that gap in with the condition, and a balance '
    + 'beam beside the rule levels when it does.';
  static CONTROLS = []; // the stub's one control is the in-panel button; there is no dial

  constructor(container, config) {
    super(container, config);
    this.shown = 1; // row 1 is up on mount, so the page is never blank
    this.lastBurst = 0;
  }

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, html: HTML });

    this._count = this.root?.querySelector?.('[data-count]') ?? null;
    this._btn = this.root?.querySelector?.('[data-next]') ?? null;
    this._hint = this.root?.querySelector?.('[data-hint]') ?? null;
    this._band = this.root?.querySelector?.('[data-band]') ?? null;
    this._tail = this.root?.querySelector?.('[data-tail]') ?? null;
    this._rail = this.root?.querySelector?.('[data-rail]') ?? null;
    this._cells = new Map();
    // One grid, placed once: the header on row 1, row n of the table on row n+1,
    // and the rail bracketing rows 2..7 - exactly the six data rows.
    for (const el of this.root?.querySelectorAll?.('[data-row]') ?? []) {
      const row = Number(el.dataset.row);
      const col = Number(el.dataset.col);
      if (col === 4) {
        el.style.gridRow = `2 / span ${ROWS.length}`;
        el.style.gridColumn = '4';
        continue;
      }
      el.style.gridRow = String(row + 1);
      el.style.gridColumn = String(col);
      if (el.dataset.cell) this._cells.set(el.dataset.cell, el);
    }

    this._btn?.addEventListener?.('click', () => this.press());
    this.onStep();
  }

  destroy() {
    this._count = null;
    this._btn = null;
    this._hint = null;
    this._band = null;
    this._tail = null;
    this._rail = null;
    this._cells = null;
    super.destroy();
  }

  // ------------------------------------------------------------------ beats

  onStep() {
    // The rule is posted on beat 1, so it has to span all six rows: a rail drawn
    // across three visible rows would be a lie about the page. A lesson resumed
    // straight on beat 1 or 2 therefore mounts with every row already up.
    if ((this.stepIndex ?? 0) >= 1) this.shown = ROWS.length;
    if (this.shown < 1) this.shown = 1;
    this._paint();
  }

  // A plain method, not a getter: the host's own harness reaches the scene's
  // members by name, and a getter is not one it finds.
  beatNo() {
    return Number.isFinite(this.stepIndex) ? Number(this.stepIndex) : 0;
  }

  // ------------------------------------------------------------------ press

  // One control, two jobs, and which job it is depends only on how many rows
  // are up: add the next row, or - once they are all there - re-read the six as
  // one sentence. There is no dial, because there is no total on this page that
  // a dial could move.
  press() {
    if (this.shown < ROWS.length) {
      this.shown += 1;
      this._paint();
      this.refit?.();
      return true;
    }
    this._flashAll();
    this._burst();
    return true;
  }

  // ------------------------------------------------------------------ paint

  _paint() {
    if (!this.root) return;
    const step = this.beatNo();
    const ruled = step >= 1;

    // One pass over every cell: a cell is on when its row is up AND its column
    // exists. Rows above the learner's count are display:none, never a reserved
    // void, and the rule column is hidden outright before the rule is posted -
    // a column-3 cell on a two-column grid is placed in an implicit third track,
    // which is how a rule cell ends up on the panel a beat before the rule is.
    for (const el of this.root?.querySelectorAll?.('[data-row]') ?? []) {
      const row = Number(el.dataset.row);
      const col = Number(el.dataset.col);
      if (col === 4) continue; // the rail spans every row; _rail.hidden owns it
      const on = (row === 0 || row <= this.shown) && (col !== 3 || ruled);
      if (el.hidden !== !on) el.hidden = !on;
    }
    if (this._band) this._band.hidden = !ruled;
    if (this._rail) this._rail.hidden = !ruled;
    if (this._tail) {
      this._tail.textContent = step >= 2 ? CONDITION : CONDITION_ASK;
      this._tail.className = step >= 2 ? 'cl-tail cl-tail--set' : 'cl-tail cl-tail--ask';
    }
    if (this._count) this._count.textContent = `row ${this.shown} of ${ROWS.length}`;
    if (this._btn) this._btn.textContent = this.shown < ROWS.length ? 'next row' : 'read it across';
    if (this._hint) {
      this._hint.hidden = ruled;
      this._hint.textContent = this.shown < ROWS.length ? 'add the rows one at a time' : 'now read across';
    }
  }

  // The six cells and the rail flash together: one sentence in six places, said
  // once. A class swap on an animation restarts it without a timer.
  _flashAll() {
    const els = [...(this._cells?.values?.() ?? [])];
    if (this._rail) els.push(this._rail);
    for (const el of els) {
      if (!el) continue;
      el.classList.remove('cl-flash');
      void el.offsetWidth;
      el.classList.add('cl-flash');
    }
  }

  // The concept is six rows reading as one sentence, not a button press. Once
  // per beat window, and never on a press that is only adding a row.
  _burst() {
    const now = Date.now();
    if (now - this.lastBurst < BURST_GAP_MS) return;
    this.lastBurst = now;
    burst?.(this._band ?? this.root);
  }
}
