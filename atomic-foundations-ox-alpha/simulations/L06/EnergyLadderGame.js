import { GameBoard, mountGame } from '../shared/GameFrame.js';

/**
 * EnergyLadderGame - mini-game for les-06, hosted by mini-game@1.
 *
 * The lesson's claim: an electron cannot stop between shells, and each jump
 * takes exactly the energy difference between two shells. The student takes
 * one electron up an atom with four shells and back down, one jump at a time,
 * typing the exact energy of each jump. Levels are plain positive heights in
 * units, as in the lesson's predict (K to L costs 10): K 0, L 10, M 12, N 13.
 * The steps get smaller going up, as they really do. No formula, no negative
 * energies.
 *
 * The last row is the point: a fall from N to K is one flash carrying the
 * whole difference, 13 units, which is the sum of the three steps. The wrong
 * attractor there is 1 (the last step) or 10 (the biggest one).
 */

const LEVELS = [
  { name: 'K', energy: 0 },
  { name: 'L', energy: 10 },
  { name: 'M', energy: 12 },
  { name: 'N', energy: 13 },
];

const JUMPS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 0 },
];
const costOf = (j) => Math.abs(LEVELS[j.to].energy - LEVELS[j.from].energy);

const CSS = `
.el .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 440px minmax(0, 1fr); gap: 14px; align-items: start; }
.el svg { width: 100%; height: auto; display: block; border-radius: 12px; }
.el .steps { font-size: 15px; color: var(--sim-label-muted); margin: 6px 0 0; }
.el .steps b { color: var(--sim-label); }
.el .panel { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 8px 12px; min-width: 0; }
.el .panel h3 { font-size: 15px; font-weight: 800; color: var(--sim-label-muted); margin: 0 0 2px; }
.el .row { display: grid; grid-template-columns: 74px 72px minmax(0, 1fr); gap: 10px; align-items: center; padding: 3px 0; }
.el .n { font-family: var(--sim-font-display); font-weight: 700; font-size: 17px; color: var(--sim-accent); }
.el .row .num { width: 100%; }
.el .row[data-good="1"] .num { border-color: var(--sim-good); }
.el .row[data-bad="1"] .num { border-color: var(--sim-bad); }
.el .check { font-size: 15px; font-weight: 700; }
.el .check.ok { color: var(--sim-good); }
.el .check.bad { color: var(--sim-bad); }

.sim-dom-root--portrait .el .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .el .ladder, .sim-dom-root--portrait .el .panel { width: 100%; }
.sim-dom-root--portrait .el svg text { font-size: 28px; }
.sim-dom-root--portrait .el svg .unit { display: none; }
.sim-dom-root--portrait .el .row { padding: 2px 0; }
`;

export class EnergyLadderGame extends GameBoard {
  static simId = 'energy-ladder-game';
  static label = { en: 'The Energy Ladder' };
  static category = 'science.physics';
  static ARIA_LABEL =
    'An atom with four shells, K, L, M and N, drawn as energy levels. Type the exact energy of each jump, up to N and back down to K.';
  static OBJECTIVE = {
    prompt: { en: 'Enter the exact energy of each jump, up to shell N and back down to K.' },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.02 };

  constructor(container, config) {
    super(container, config);
    this.answers = JUMPS.map(() => ({ typed: '' }));
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm el">
          <div class="gm-head">
            <p class="kicker">Why does an atom not collapse?</p>
            <h2>Move the electron with <b>exact jumps</b>.</h2>
            <p class="sub">An electron cannot make part of a jump: each takes exactly the difference between two shells. Go up to N, then fall to K in one jump.</p>
          </div>
          <div class="board">
            <div class="ladder">
              <svg viewBox="0 0 540 270" role="img" aria-label="Energy levels of an atom with four shells">
                <rect x="0" y="0" width="540" height="270" fill="var(--sim-bg-deep)"></rect>
                <text x="52" y="26" text-anchor="end" fill="var(--sim-label-muted)" font-size="15" font-weight="700">13</text>
                <text x="52" y="248" text-anchor="end" fill="var(--sim-label-muted)" font-size="15" font-weight="700">0</text>
                <text class="unit" x="52" y="266" text-anchor="end" fill="var(--sim-label-muted)" font-size="15">units</text>
                <line x1="60" y1="16" x2="60" y2="254" stroke="var(--sim-stroke)" stroke-width="2"></line>
                <g id="el-rungs"></g>
                <circle id="el-electron" cx="280" r="12" fill="var(--sim-electron)"></circle>
              </svg>
              <p class="steps">Steps: K to L is <b>10</b>, L to M is <b>2</b>, M to N is <b>1</b>.</p>
            </div>
            <div class="panel">
              <h3>Energy of each jump (units)</h3>
              ${JUMPS.map((j, i) => `
                <div class="row" data-i="${i}">
                  <span class="n">${LEVELS[j.from].name} &rarr; ${LEVELS[j.to].name}</span>
                  <input class="tap num" type="number" inputmode="numeric" step="1" data-i="${i}" placeholder="?" aria-label="energy for the jump from ${LEVELS[j.from].name} to ${LEVELS[j.to].name}">
                  <span class="check" data-check="${i}"></span>
                </div>`).join('')}
            </div>
          </div>
        </div>`,
    });
    this._rungsG = this.root.querySelector('#el-rungs');
    this._electron = this.root.querySelector('#el-electron');
    // M and N are close together, because the steps shrink going up: M stops short so that
    // the two labels sit side by side and stay readable at phone size.
    this._rungsG.innerHTML = LEVELS.map((l) => {
      const y = this._y(l.energy);
      const end = l.name === 'M' ? 440 : 490;
      return `
        <line x1="80" y1="${y}" x2="${end}" y2="${y}" stroke="var(--sim-stroke)" stroke-width="3"></line>
        <text x="${end + 12}" y="${y + 9}" fill="var(--sim-label-muted)" font-size="16" font-weight="700">${l.name}</text>`;
    }).join('');
    this.root.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        this.answers[Number(e.target.dataset.i)].typed = e.target.value;
        this._moved = true;
        this._render();
      });
    });
    this._render();
    this.quill.speak('The electron starts in K. Give it the exact energy for each jump.', 5200);
  }

  /** Map an energy in [0, 13] to a y in the picture. */
  _y(energy) {
    return 240 - (energy / 13) * 216;
  }

  _right(i) {
    const a = this.answers[i].typed;
    return a !== '' && Number(a) === costOf(JUMPS[i]);
  }

  _render() {
    JUMPS.forEach((j, i) => {
      const row = this.root.querySelector(`.row[data-i="${i}"]`);
      const chk = this.root.querySelector(`[data-check="${i}"]`);
      const blank = this.answers[i].typed === '';
      const right = this._right(i);
      chk.textContent = blank ? '' : (right ? 'exact' : 'not exact');
      chk.className = `check ${blank ? '' : (right ? 'ok' : 'bad')}`;
      row.dataset.good = right ? '1' : '0';
      row.dataset.bad = !blank && !right ? '1' : '0';
    });
    // The electron stands where the last unbroken run of right answers has taken it.
    let at = 0;
    for (let i = 0; i < JUMPS.length && this._right(i); i += 1) at = JUMPS[i].to;
    this._electron.setAttribute('cy', this._y(LEVELS[at].energy).toFixed(1));
  }

  checkObjective() {
    if (!this._moved) return null;
    if (this.answers.some((a) => a.typed === '')) return null;
    if (JUMPS.every((j, i) => this._right(i))) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    if (!this._right(3) && this._right(0) && this._right(1) && this._right(2)) {
      return { ok: false, hint: 'One fall from N to K gives out the whole difference between N and K. Add up the steps.' };
    }
    return { ok: false, hint: 'Each jump takes exactly the difference between the two shells. Read the steps under the picture.' };
  }
}
