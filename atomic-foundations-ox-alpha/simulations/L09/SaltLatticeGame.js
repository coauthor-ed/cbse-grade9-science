import { GameBoard, mountGame, onTap } from '../shared/GameFrame.js';

/**
 * SaltLatticeGame - mini-game for les-09, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson's claim is that a salt crystal is not a
 * pile of NaCl molecules: it is a lattice of alternating Na+ and Cl- ions. The
 * student places ions on a 3x3 grid so that it becomes a chessboard, and either
 * chessboard is a true piece of the crystal.
 *
 * The wrong attractor is "build pairs first": Na+ next to Cl- in rows, which
 * puts ions of the same charge side by side. Same charges push each other apart.
 */

const SIZE = 3;

const IONS = [
  { id: 'Na', label: 'Na<sup>+</sup>', aria: 'Sodium ion' },
  { id: 'Cl', label: 'Cl<sup>-</sup>', aria: 'Chloride ion' },
];
const ionHtml = (id) => IONS.find((i) => i.id === id)?.label ?? '';

const CSS = `
.sl .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 18px; align-items: start; }
.sl .lattice { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 8px;
               display: grid; grid-template-columns: repeat(${SIZE}, minmax(0, 1fr)); grid-auto-rows: 84px; gap: 6px; }
.sl .cell { background: var(--sim-bg-deep); border: var(--sim-border); border-radius: 10px; padding: 0;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; }
.sl .cell[data-ion="Na"], .sl .ion[data-ion="Na"] { background: color-mix(in oklab, var(--sim-cation) 24%, var(--sim-bg-surface)); border-color: var(--sim-cation); }
.sl .cell[data-ion="Cl"], .sl .ion[data-ion="Cl"] { background: color-mix(in oklab, var(--sim-anion) 24%, var(--sim-bg-surface)); border-color: var(--sim-anion); }
.sl .cell[data-good="1"] { outline: 3px solid var(--sim-good); outline-offset: 1px; }
.sl .cell[data-bad="1"] { outline: 3px solid var(--sim-bad); outline-offset: 1px; }
.sl .panel { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 420px; }
.sl .tray { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.sl .ion { min-height: 60px; border-radius: 12px; border: var(--sim-border); padding: 0;
           font-family: var(--sim-font-display); font-size: 22px; font-weight: 700; }
.sl .ion[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.sl .verdict { font-size: 15px; font-weight: 700; line-height: 1.3; min-height: 40px; margin: 0; }
.sl .verdict.ok { color: var(--sim-good); }
.sl .verdict.bad { color: var(--sim-bad); }
.sl .verdict.dim { color: var(--sim-label-muted); }

.sim-dom-root--portrait .sl .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .sl .panel { display: contents; }
.sim-dom-root--portrait .sl .tray { width: 100%; order: 1; }
.sim-dom-root--portrait .sl .lattice { width: 100%; order: 2; grid-auto-rows: 74px; }
.sim-dom-root--portrait .sl .verdict { order: 3; min-height: 20px; }
.sim-dom-root--portrait .sl #sl-reset { order: 4; width: 100%; }
`;

export class SaltLatticeGame extends GameBoard {
  static simId = 'salt-lattice-game';
  static label = { en: 'The Salt Lattice' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'A 3 by 3 grid. Tap an ion, then a cell to place it. Build an alternating Na+ and Cl- chessboard.';
  static OBJECTIVE = {
    prompt: { en: 'Build a small piece of the salt crystal, so that every ion has only opposite ions beside it.' },
  };

  constructor(container, config) {
    super(container, config);
    this.grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    this._active = 'Na';
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm sl">
          <div class="gm-head">
            <p class="kicker">One crystal, not molecules</p>
            <h2>Build a <b>chessboard of ions</b>.</h2>
            <p class="sub">Pick an ion, then tap a cell. Tap a cell again to clear it.</p>
          </div>
          <div class="board">
            <div class="lattice">
              ${Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => `
                <button class="tap cell" type="button" data-r="${r}" data-c="${c}" data-ion="" aria-label="Row ${r + 1}, column ${c + 1}"></button>
              `).join('')).join('')}
            </div>
            <div class="panel">
              <div class="tray">
                ${IONS.map((ion) => `<button class="tap ion" type="button" data-ion="${ion.id}" aria-label="${ion.aria}" aria-pressed="false">${ion.label}</button>`).join('')}
              </div>
              <p class="verdict dim" id="sl-verdict" aria-live="polite"></p>
              <button class="tap btn" type="button" id="sl-reset">Clear the board</button>
            </div>
          </div>
        </div>`,
    });
    this._verdict = this.root.querySelector('#sl-verdict');
    this.root.querySelectorAll('.ion').forEach((el) => onTap(el, () => { this._active = el.dataset.ion; this._render(); }));
    this.root.querySelectorAll('.cell').forEach((el) => onTap(el, () => this._tapCell(el)));
    onTap(this.root.querySelector('#sl-reset'), () => {
      this.grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
      this._moved = true;
      this._render();
    });
    this._render();
    this.quill.speak('Like a chessboard: Na, Cl, Na, Cl...', 5200);
  }

  _tapCell(el) {
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    this.grid[r][c] = this.grid[r][c] === this._active ? null : this._active;
    this._moved = true;
    this._render();
  }

  _filled() {
    return this.grid.flat().every((v) => v !== null);
  }

  _clash(r, c) {
    const v = this.grid[r][c];
    return [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]
      .some(([a, b]) => a >= 0 && b >= 0 && a < SIZE && b < SIZE && this.grid[a][b] === v);
  }

  // Either chessboard is a true piece of the crystal: Na or Cl may sit at the corner.
  _isCorrect() {
    return this._filled() && this.grid.every((row, r) => row.every((_, c) => !this._clash(r, c)));
  }

  _render() {
    const full = this._filled();
    const correct = this._isCorrect();
    this.root.querySelectorAll('.ion').forEach((el) => el.setAttribute('aria-pressed', el.dataset.ion === this._active ? 'true' : 'false'));
    this.root.querySelectorAll('.cell').forEach((cell) => {
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      const v = this.grid[r][c];
      cell.dataset.ion = v || '';
      cell.innerHTML = ionHtml(v);
      cell.dataset.good = correct ? '1' : '0';
      cell.dataset.bad = full && !correct && this._clash(r, c) ? '1' : '0';
    });
    if (!full) {
      this._verdict.textContent = `Filled ${this.grid.flat().filter(Boolean).length} of 9.`;
      this._verdict.className = 'verdict dim';
    } else if (correct) {
      this._verdict.textContent = 'That is a piece of a salt crystal.';
      this._verdict.className = 'verdict ok';
    } else {
      this._verdict.textContent = 'Two ions with the same charge are side by side, and same charges push apart.';
      this._verdict.className = 'verdict bad';
    }
  }

  checkObjective() {
    if (!this._moved) return null;
    if (!this._filled()) return null;
    if (this._isCorrect()) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    return { ok: false, hint: 'Two ions with the same charge are side by side. Every neighbour must have the opposite charge.' };
  }
}
