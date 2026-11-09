// MechanicalColumnsScene-lit.js
//
// The already-collapsed mount of the two-column board: it opens as the two
// columns with both lit, there is nothing to rebuild and no Collapse control,
// and the two columns are the whole interface. Mounted once and memory-less,
// so it opens in that state whatever happened on any other mount.
//
// The board, the two headings, the shared ball and the lit/dim rules all live
// in MechanicalColumnsBoard.js, which this scene shares with the uncollapsed
// mount. This file holds only the entry state and the beat wiring.

import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { simTag } from 'simulations/base/SimUi.js';
import {
  BOARD_CSS, boardHtml, bindBoard, nextLit, paintBoard, setNumbers,
} from './MechanicalColumnsBoard.js';

const W = 560;

// The entry state, and the state beat 1 returns to: both columns lit. The stub
// is explicit that the board is already the two columns the moment the slide
// appears, with both lit, because this slide's prose opens on "Both columns on
// the board are lit".
const ENTRY_LIT = 'all';

// Two beats, and the board is the same board on both: the second beat names
// the awkward part, that neither column has a number on it, so the scene adds
// the board's dashed "?" field and resolves nothing.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // both columns lit, no number field
  [{ idx: 1, dwellMs: null }], // still both lit, a "?" where a number would be
];

export class MechanicalColumnsSceneLit extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = 440; // sim-layout natural 422 (tallest beat) + padding
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 888; // sim-layout natural 870 (columns stack) + padding
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A board of two columns, MOTION and POSITION, holding the same ball in three drawings: rolling on grass, up in the air, and at rest on a shelf. Both columns are lit.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    // The entry state is baked into the markup, not applied after mount: the
    // columns and both lit states are in the first frame the learner sees.
    this.render({
      css: BOARD_CSS,
      html: `<div class="sim-card">
        <div class="sim-row">
          ${simTag('one ball', { accent: true })}
          ${simTag('tap a column')}
        </div>
        ${boardHtml({ lit: ENTRY_LIT, numbers: false })}
        <p class="sim-meta">Neither column has a number on it yet.</p>
      </div>`,
    });

    this._board = this.root?.querySelector('[data-board]');
    this._lit = ENTRY_LIT;

    // The sim-test harness DOM has no HTML parser, so this markup never
    // becomes a node tree and the board is null there. Optional chaining
    // keeps the scene at rest; in a browser the taps are live from mount.
    bindBoard(this._board, (id) => this._pick(id));
    this.onStep();
  }

  onStep() {
    // The "?" field is this beat's content: the columns still carry no
    // number, and the field is the board's way of showing that rather than a
    // caption saying it. It never becomes a number on any later beat.
    setNumbers(this._board, this.stepIndex >= 1);
    // Beat 1's prose asserts both columns are lit, so entering it returns the
    // board to the both-lit state rather than leaving one dimmed.
    this._lit = ENTRY_LIT;
    paintBoard(this._board, this._lit);
  }

  _pick(id) {
    this._lit = nextLit(this._lit, id);
    paintBoard(this._board, this._lit);
  }

  destroy() {
    this._board = null;
    super.destroy();
  }
}
