import { GameBoard, mountGame, onTap } from '../shared/GameFrame.js';

/**
 * RecipeCheckerGame - mini-game for les-12, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson explains two laws with atoms. The
 * student gets four reaction cards and marks each POSSIBLE or IMPOSSIBLE:
 * atoms must match on both sides, masses must match, and molecules come whole.
 *
 *   Card A  : 2 H2 + O2 -> 2 H2O      (4 + 32 = 36)        -> POSSIBLE
 *   Card B  : H2 + O2 -> 2 H2O        (2 + 32 is not 36)   -> IMPOSSIBLE
 *   Card C  : 1.5 H2 + O2 -> 1.5 H2O  (half a molecule)    -> IMPOSSIBLE
 *   Card D  : 2 H2O2 -> 2 H2O + O2    (68 = 36 + 32)       -> POSSIBLE
 *
 * Masses are grams for the numbers of molecules shown, taking H2 = 2 g, O2 = 32 g.
 *
 * Built on DomSimulation per the kit default: a column of cards with a
 * POSSIBLE / IMPOSSIBLE toggle.
 */

const CARDS = [
  {
    id: 'a',
    eq: '2 H\u2082 + O\u2082 \u2192 2 H\u2082O',
    input: '4 g + 32 g, then 36 g',
    judgment: 'possible',
    why: 'There are 4 H and 2 O on both sides, and the masses match.',
  },
  {
    id: 'b',
    eq: 'H\u2082 + O\u2082 \u2192 2 H\u2082O',
    input: '2 g + 32 g, then 36 g',
    judgment: 'impossible',
    why: 'There are 2 H before and 4 H after, so atoms would have to appear from nowhere. The masses do not match either.',
  },
  {
    id: 'c',
    eq: '1.5 H\u2082 + O\u2082 \u2192 1.5 H\u2082O',
    input: 'half a molecule?',
    judgment: 'impossible',
    why: 'There is no half a molecule, and the oxygen does not match: 2 atoms before and 1.5 after.',
  },
  {
    id: 'd',
    eq: '2 H\u2082O\u2082 \u2192 2 H\u2082O + O\u2082',
    input: '68 g, then 36 g + 32 g',
    judgment: 'possible',
    why: 'There are 4 H and 4 O on both sides, and the masses match. This is hydrogen peroxide breaking down.',
  },
];

const CSS = `
.rc .grid { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: start; align-content: start; }
.rc .card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 8px 12px;
            display: grid; grid-template-columns: minmax(0, 1fr) 216px; gap: 2px 10px; align-items: center; }
.rc .card[data-good="1"] { border-color: var(--sim-good); }
.rc .card[data-bad="1"] { border-color: var(--sim-bad); }
.rc .say { min-width: 0; }
.rc .eq { font-family: var(--sim-font-display); font-size: 18px; font-weight: 700; color: var(--sim-accent); line-height: 1.2; }
.rc .note { font-size: 15px; color: var(--sim-label-muted); }
.rc .row { display: flex; gap: 6px; }
.rc .btn { flex: 1 1 0; padding: 4px; font-size: 14px; background: var(--sim-bg-deep); }
.rc .btn[data-active="1"][data-j="possible"] { background: color-mix(in oklab, var(--sim-good) 26%, var(--sim-bg-surface)); border-color: var(--sim-good); }
.rc .btn[data-active="1"][data-j="impossible"] { background: color-mix(in oklab, var(--sim-bad) 26%, var(--sim-bg-surface)); border-color: var(--sim-bad); }
.rc .why { grid-column: 1 / -1; font-size: 14px; line-height: 1.25; color: var(--sim-label-muted); }
.rc .why:empty { display: none; }
.rc .why b { color: var(--sim-label); }

.sim-dom-root--portrait .rc .grid { grid-template-columns: minmax(0, 1fr); gap: 8px; }
.sim-dom-root--portrait .rc .card { grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 8px 10px; }
.sim-dom-root--portrait .rc .eq { font-size: 19px; }
`;

export class RecipeCheckerGame extends GameBoard {
  static simId = 'recipe-checker-game';
  static label = { en: 'Could This Reaction Happen?' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Four reaction cards. For each, decide POSSIBLE or IMPOSSIBLE by counting atoms and checking the masses.';
  static OBJECTIVE = {
    prompt: {
      en: 'Four reactions. Mark each one Possible or Impossible.',
    },
  };

  constructor(container, config) {
    super(container, config);
    this.judgments = {}; // cardId -> 'possible' / 'impossible'
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm rc">
          <div class="gm-head">
            <p class="kicker">Count the atoms</p>
            <h2>Could this reaction <b>really happen</b>?</h2>
            <p class="sub">Check three things: the atoms match on both sides, the masses match, and molecules come whole.</p>
          </div>
          <div class="grid">
            ${CARDS.map((c) => `
              <div class="card" data-id="${c.id}">
                <div class="say">
                  <div class="eq">${c.eq}</div>
                  <div class="note">${c.input}</div>
                </div>
                <div class="row">
                  <button class="tap btn" type="button" data-j="possible">Possible</button>
                  <button class="tap btn" type="button" data-j="impossible">Impossible</button>
                </div>
                <div class="why" id="rc-why-${c.id}"></div>
              </div>`).join('')}
          </div>
        </div>`,
    });
    this.root.querySelectorAll('.card').forEach((card) => {
      card.querySelectorAll('.btn').forEach((btn) => onTap(btn, () => {
        this.judgments[card.dataset.id] = btn.dataset.j;
        this._moved = true;
        this._render();
      }));
    });
    this._render();
    this.quill.speak('Count the atoms on each side first.', 5200);
  }

  _render() {
    for (const c of CARDS) {
      const card = this.root.querySelector(`.card[data-id="${c.id}"]`);
      const j = this.judgments[c.id];
      const why = this.root.querySelector(`#rc-why-${c.id}`);
      card.querySelectorAll('.btn').forEach((b) => b.dataset.active = b.dataset.j === j ? '1' : '0');
      if (!j) {
        card.dataset.good = '0';
        card.dataset.bad = '0';
        why.innerHTML = '';
      } else if (j === c.judgment) {
        card.dataset.good = '1';
        card.dataset.bad = '0';
        why.innerHTML = `<b>Right.</b> ${c.why}`;
      } else {
        card.dataset.good = '0';
        card.dataset.bad = '1';
        why.innerHTML = `<b>Look again.</b> ${c.why}`;
      }
    }
  }

  checkObjective() {
    if (!this._moved) return null;
    if (Object.keys(this.judgments).length < CARDS.length) return null;
    const wrong = CARDS.filter((c) => this.judgments[c.id] !== c.judgment);
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    return { ok: false, hint: `Check the card ${wrong[0].eq} again. Count the atoms on each side and check the masses.` };
  }
}
