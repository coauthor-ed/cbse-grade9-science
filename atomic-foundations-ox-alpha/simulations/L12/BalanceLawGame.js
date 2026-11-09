import { GameBoard, mountGame, onTap, formula } from '../shared/GameFrame.js';

/**
 * BalanceLawGame - mini-game for les-12, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Atoms are rearranged, never created or destroyed,
 * so the student balances three reactions by setting the whole number in front
 * of each molecule until every kind of atom has the same count on both sides.
 *
 *   H2 + Cl2 -> 2 HCl      (1, 1, 2)
 *   2 H2 + O2 -> 2 H2O     (2, 1, 2)
 *   N2 + 3 H2 -> 2 NH3     (1, 3, 2)
 *
 * Plus and minus buttons, not typing: a molecule comes whole, so the control can
 * only give a whole number, and no phone keyboard covers the equation. The
 * equation is built once per step and only its numbers change, so a button
 * keeps its focus and the page does not jump.
 */

const REACTIONS = [
  { lhs: ['H2', 'Cl2'], rhs: ['HCl'] },
  { lhs: ['H2', 'O2'],  rhs: ['H2O'] },
  { lhs: ['N2', 'H2'],  rhs: ['NH3'] },
];

const COMPOSITIONS = {
  H2:  { H: 2 }, Cl2: { Cl: 2 }, HCl: { H: 1, Cl: 1 },
  O2:  { O: 2 }, H2O: { H: 2, O: 1 },
  N2:  { N: 2 }, NH3: { N: 1, H: 3 },
};

const MIN = 1;
const MAX = 9;

const CSS = `
.bg .eqn { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 12px 14px;
           display: flex; align-items: center; gap: 14px; }
.bg .eqn[data-good="1"] { border-color: var(--sim-good); }
.bg .side { display: flex; align-items: center; gap: 10px; }
.bg .mid { font-size: 28px; font-weight: 800; color: var(--sim-label-muted); }
.bg .plus { font-size: 20px; font-weight: 800; color: var(--sim-label-muted); }
.bg .mol { display: inline-flex; align-items: center; gap: 4px; }
.bg .step { width: 48px; padding: 0; font-size: 24px; line-height: 1; }
.bg .coef { min-width: 30px; text-align: center; font-family: var(--sim-font-display); font-size: 24px; font-weight: 700;
            color: var(--sim-accent); font-variant-numeric: tabular-nums; }
.bg .fm { font-size: 22px; font-weight: 800; margin-left: 4px; min-width: 52px; }
.bg .counts { display: flex; gap: 8px; flex-wrap: wrap; }
.bg .ac { font-size: 16px; font-weight: 700; padding: 6px 12px; border-radius: 10px; background: var(--sim-bg-deep);
          border: 2px solid var(--sim-bad); font-variant-numeric: tabular-nums; }
.bg .ac[data-ok="1"] { border-color: var(--sim-good); }
.bg .controls { display: flex; gap: 8px; align-items: center; }
.bg .nav { color: var(--sim-label-muted); font-size: 15px; margin-left: auto; }

.sim-dom-root--portrait .bg .eqn { flex-direction: column; align-items: stretch; gap: 4px; padding: 8px 10px; }
.sim-dom-root--portrait .bg .side { flex-direction: column; align-items: stretch; gap: 2px; }
.sim-dom-root--portrait .bg .mol { justify-content: flex-start; }
.sim-dom-root--portrait .bg .mid, .sim-dom-root--portrait .bg .plus { text-align: center; line-height: 1; font-size: 20px; }
.sim-dom-root--portrait .bg .controls { flex-wrap: wrap; }
.sim-dom-root--portrait .bg .controls .btn { flex: 1 1 0; }
.sim-dom-root--portrait .bg .nav { flex: 1 0 100%; margin: 0; text-align: center; order: -1; }
`;

export class BalanceLawGame extends GameBoard {
  static simId = 'balance-law-game';
  static label = { en: 'Balance the Atoms' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Three unbalanced chemical equations. Use plus and minus to set the whole number in front of each molecule until both sides have the same count of every kind of atom.';
  static OBJECTIVE = {
    prompt: { en: 'Three equations. Set the number in front of each molecule, so that every kind of atom has the same count on both sides.' },
  };

  constructor(container, config) {
    super(container, config);
    this.idx = 0;
    this.answers = REACTIONS.map((r) => Object.fromEntries([...r.lhs, ...r.rhs].map((m) => [m, 1])));
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm bg">
          <div class="gm-head">
            <p class="kicker">Count the atoms</p>
            <h2>Whole numbers only, <b>no fractions</b>.</h2>
            <p class="sub">Each number counts whole molecules. Green means that atom matches on both sides.</p>
          </div>
          <div id="bg-eqn"></div>
          <div class="counts" id="bg-counts"></div>
          <div class="controls">
            <button class="tap btn" type="button" id="bg-prev">&larr; Previous</button>
            <button class="tap btn" type="button" id="bg-next">Next &rarr;</button>
            <span class="nav" id="bg-nav" aria-live="polite"></span>
          </div>
        </div>`,
    });
    this._eqn = this.root.querySelector('#bg-eqn');
    onTap(this.root.querySelector('#bg-prev'), () => this._go(-1));
    onTap(this.root.querySelector('#bg-next'), () => this._go(1));
    this._eqn.addEventListener('click', (e) => {
      const b = e.target.closest('.step');
      if (b) this._nudge(b.dataset.mol, Number(b.dataset.d));
    });
    this._build();
    this.quill.speak('Count each kind of atom on both sides.', 5200);
  }

  _go(delta) {
    this.idx = Math.max(0, Math.min(REACTIONS.length - 1, this.idx + delta));
    this._build();
  }

  _nudge(mol, d) {
    const a = this.answers[this.idx];
    a[mol] = Math.max(MIN, Math.min(MAX, a[mol] + d));
    this._moved = true;
    this._paint();
  }

  _build() {
    const r = REACTIONS[this.idx];
    const side = (mols) => mols.map((m) => this._molHtml(m)).join('<span class="plus">+</span>');
    this._eqn.innerHTML = `
      <div class="eqn">
        <div class="side">${side(r.lhs)}</div>
        <div class="mid" aria-label="gives">&rarr;</div>
        <div class="side">${side(r.rhs)}</div>
      </div>`;
    this._paint();
  }

  _molHtml(mol) {
    return `
      <div class="mol">
        <button class="tap btn step" type="button" data-mol="${mol}" data-d="-1" aria-label="one fewer ${mol}">&minus;</button>
        <span class="coef" data-mol="${mol}"></span>
        <button class="tap btn step" type="button" data-mol="${mol}" data-d="1" aria-label="one more ${mol}">+</button>
        <span class="fm">${formula(mol)}</span>
      </div>`;
  }

  _paint() {
    const r = REACTIONS[this.idx];
    const ans = this.answers[this.idx];
    this._eqn.querySelectorAll('.coef').forEach((el) => { el.textContent = String(ans[el.dataset.mol]); });
    this._eqn.querySelector('.eqn').dataset.good = this._isBalanced(r, ans) ? '1' : '0';
    const { left, right } = this._atomCounts(r, ans);
    this.root.querySelector('#bg-counts').innerHTML = [...new Set([...Object.keys(left), ...Object.keys(right)])]
      .map((el) => `<span class="ac" data-ok="${left[el] === right[el] ? '1' : '0'}">${el}: ${left[el] ?? 0} and ${right[el] ?? 0}</span>`)
      .join('');
    this.root.querySelector('#bg-nav').textContent = `Equation ${this.idx + 1} of ${REACTIONS.length}`;
  }

  _atomCounts(r, coeffs) {
    const sum = (mols) => {
      const out = {};
      for (const m of mols) {
        for (const [el, n] of Object.entries(COMPOSITIONS[m])) out[el] = (out[el] || 0) + coeffs[m] * n;
      }
      return out;
    };
    return { left: sum(r.lhs), right: sum(r.rhs) };
  }

  _isBalanced(r, coeffs) {
    const { left, right } = this._atomCounts(r, coeffs);
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].every((el) => left[el] === right[el]);
  }

  checkObjective() {
    if (!this._moved) return null;
    const open = REACTIONS.findIndex((r, i) => !this._isBalanced(r, this.answers[i]));
    if (open < 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    if (open === this.idx) {
      return { ok: false, hint: 'The atoms do not match yet. Add up each element on both sides and fix the gap.' };
    }
    return { ok: false, hint: `This one is balanced. Equation ${open + 1} is not finished yet.` };
  }
}
