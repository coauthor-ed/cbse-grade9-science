// MechanicalColumnsScene.js
//
// The uncollapsed mount of the two-column sort, on blk-l02-s09: it opens as
// a bare board with the six non-mechanical form names greyed along its bottom
// edge, and the learner presses Collapse to watch the board rebuild itself as
// the two columns. The other mount of the same board, MechanicalColumnsScene-lit
// (blk-l02-s12), opens already collapsed; it shares the board, the two
// headings, the one ball and the lit/dim rules through MechanicalColumnsBoard.js
// and differs only in the entry state and in whether Collapse exists.
//
// The board is mounted and laid out from the first frame and held back with
// opacity, so the empty board waiting for it is exactly the footprint the two
// columns will occupy and the rebuild cannot shift anything under the learner.
// Before the collapse that wrapper is inert, so the columns are neither
// tabbable nor spoken.

import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc, simTag } from 'simulations/base/SimUi.js';
import {
  BOARD_CSS, boardHtml, bindBoard, nextLit, paintBoard,
} from './MechanicalColumnsBoard.js';

// The six names the s09 beat pushes aside, in the prose's own order. They are
// names, not definitions: nothing on this board explains one.
const PUSHED_ASIDE = ['Light', 'Sound', 'Thermal', 'Electrical', 'Nuclear', 'Chemical'];

// One board, two stages: the bare board and the two columns. The board is
// already the two columns on beat 1, so the stages differ by nothing but
// whether the rebuild has happened.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // bare board, Collapse live
  [{ idx: 1, dwellMs: null }], // rebuilt as the two columns, both lit
];

// Scene CSS only. Nothing here restates a sim-* component class; the board's
// own rules are the shared helper's, and what is added is the empty board
// waiting to be filled, the greyed names along its bottom edge, and the timing
// of the rebuild.
const CSS = `
${BOARD_CSS}
.mcs-card { flex: 1 1 auto; }
.mcs-head { display: flex; align-items: center; justify-content: space-between; gap: var(--sim-space-2); min-width: 0; }
.mcs-collapse { flex: none; padding: var(--sim-space-2) var(--sim-space-3); border: 2px solid var(--sim-accent); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 800; cursor: pointer; transition: border-color 200ms ease, background-color 200ms ease; }
.mcs-collapse:hover { background: var(--sim-bg-deep); }
.mcs-collapse:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }

/* stage: the empty board and the two columns are one cell, so the space
   waiting for the board is the board's own footprint, not a guess at its size */
.mcs-stage { display: grid; grid-template-columns: minmax(0, 1fr); flex: 1 1 auto; min-height: 0; }
.mcs-slot, .mcs-built { grid-area: 1 / 1; }
.mcs-slot { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-3); padding: var(--sim-space-3); border: 2px dashed var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-deep); color: var(--sim-label); font: inherit; cursor: pointer; transition: border-color 260ms ease, background-color 260ms ease; }
.mcs-slot:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
/* the chip takes the slack on both sides, so it sits in the middle of the
   empty board rather than pinned under its top edge */
.mcs-wait { margin-top: auto; margin-bottom: auto; transition: opacity 240ms ease, transform 240ms ease; }
.mcs-names { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: var(--sim-space-1); transition: opacity 300ms ease; }
.mcs-names .sim-tag { color: var(--sim-label-muted); border-color: var(--sim-stroke); border-style: dashed; transition: opacity 300ms ease, transform 340ms ease; }
.mcs-built { opacity: 0; transform: translateY(12px); pointer-events: none; transition: opacity 420ms ease-out 300ms, transform 420ms ease-out 300ms; }

/* collapsed: the whole rebuild, in CSS, from one attribute on the card */
.mcs-card[data-collapsed="1"] .mcs-slot { border-color: transparent; background: transparent; pointer-events: none; }
.mcs-card[data-collapsed="1"] .mcs-built { opacity: 1; transform: none; pointer-events: auto; }
.mcs-card[data-collapsed="1"] .mcs-wait { opacity: 0; transform: scale(0.9); }
.mcs-card[data-collapsed="1"] .mcs-names { opacity: 1; }
.mcs-card[data-collapsed="1"] .mcs-names .sim-tag { opacity: 0; transform: scale(0.82); transition-delay: calc(var(--i) * 50ms); }
.mcs-card[data-collapsed="1"] .mcb-col { animation: mcs-land 700ms cubic-bezier(0.34, 1.25, 0.64, 1) 300ms both; }

@keyframes mcs-land {
  0% { transform: translateY(10px) scale(0.97); }
  60%, 100% { transform: none; }
}
`;

export class MechanicalColumnsScene extends DomSimulation {
  static WIDTH = 560;
  static HEIGHT = 440; // sim-layout natural 430 (beat 0, the taller one) + padding
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 872; // sim-layout natural 862 (beat 0, columns stacked) + padding
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A board with six energy-form names greyed along its bottom edge. Pressing Collapse clears them and rebuilds the board as two equal columns, MOTION and POSITION, each holding the same ball drawn at the same size.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this._collapsed = false;
    this._lit = 'all';

    this.render({
      css: CSS,
      html: `<div class="sim-card mcs-card" data-card data-collapsed="0">
        <div class="mcs-head">
          <span data-status aria-live="polite">${simTag('waiting to be rebuilt', { accent: true })}</span>
          <button type="button" class="mcs-collapse" data-collapse>Collapse</button>
        </div>
        <div class="mcs-stage" data-stage>
          <button type="button" class="mcs-slot" data-slot>
            <span class="mcs-wait" data-wait>${simTag('no columns yet')}</span>
            <span class="mcs-names" data-names>${PUSHED_ASIDE.map((n, i) => `<span class="sim-tag" style="--i: ${i}">${esc(n)}</span>`).join('')}</span>
          </button>
          <div class="mcs-built" data-built aria-hidden="true" inert>${boardHtml({ lit: 'all', numbers: true })}</div>
        </div>
        <p class="sim-meta">This board sorts; it does not measure.</p>
      </div>`,
    });

    this._card = this.root?.querySelector?.('[data-card]') || null;
    this._built = this.root?.querySelector?.('[data-built]') || null;
    this._slot = this.root?.querySelector?.('[data-slot]') || null;
    this._names = this.root?.querySelector?.('[data-names]') || null;
    this._wait = this.root?.querySelector?.('[data-wait]') || null;
    this._status = this.root?.querySelector?.('[data-status]') || null;
    this._collapseBtn = this.root?.querySelector?.('[data-collapse]') || null;
    this._board = this._built?.querySelector?.('[data-board]') || null;

    // The sim-test harness DOM has no HTML parser, so this markup never becomes
    // a node tree and every lookup is null there. All optional chaining, so the
    // scene still runs at rest; in a browser the taps are live from mount.
    this._collapseBtn?.addEventListener?.('click', () => this._collapse());
    this._slot?.addEventListener?.('click', () => this._collapse());
    bindBoard(this._board, (id) => this._pick(id));

    this.onStep();
  }

  onStep() {
    // The beat owns the board's state. Beat 0 is the bare board with Collapse
    // live; beat 1 opens "the board has been rebuilt", so entering it rebuilds
    // a board the learner never pressed Collapse on. Either way the state is
    // set from the beat, not from what happened before it.
    this._setCollapsed((this.stepIndex ?? 0) >= 1);
    // Both stages are equally lit: this is one object sorted two ways, never a
    // board preferring one of its two columns.
    this._lit = 'all';
    paintBoard(this._board, this._lit);
  }

  _collapse() {
    // One shot. The button is hidden the moment the board is collapsed, so a
    // second press is impossible rather than ignored.
    this._setCollapsed(true);
  }

  _setCollapsed(on) {
    if (this._collapsed === !!on) return;
    this._collapsed = !!on;
    if (this._card) this._card.dataset.collapsed = on ? '1' : '0';
    // The board is inert and unspoken until it is standing, and the empty
    // board it replaces takes the opposite state.
    if (this._built) {
      this._built.inert = !on;
      this._built.setAttribute?.('aria-hidden', String(!on));
    }
    if (this._slot) this._slot.setAttribute?.('aria-hidden', String(on));
    if (this._names) this._names.setAttribute?.('aria-hidden', String(on));
    if (this._wait) this._wait.setAttribute?.('aria-hidden', String(on));
    if (this._collapseBtn) this._collapseBtn.hidden = on;
    if (this._status) {
      this._status.innerHTML = on
        ? simTag('one ball, sorted two ways', { accent: true })
        : simTag('waiting to be rebuilt', { accent: true });
    }
  }

  _pick(id) {
    if (this._collapsed !== true) return;
    this._lit = nextLit(this._lit, id);
    paintBoard(this._board, this._lit);
  }

  destroy() {
    this._card = null;
    this._built = null;
    this._slot = null;
    this._names = null;
    this._wait = null;
    this._status = null;
    this._collapseBtn = null;
    this._board = null;
    super.destroy();
  }
}
