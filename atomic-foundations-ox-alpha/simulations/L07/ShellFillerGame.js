import { GameBoard, mountGame, onTap } from '../shared/GameFrame.js';

/**
 * ShellFillerGame - mini-game for les-07, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson's rule is 2n^2: shell n holds at most
 * 2n^2 electrons, so 2, 8, 18, 32. The student fills four atoms, one at a time,
 * by tapping a shell to add an electron, until the count equals Z.
 *
 *   H  : Z=1  ->  1
 *   C  : Z=6  ->  2, 4
 *   O  : Z=8  ->  2, 6
 *   Na : Z=11 ->  2, 8, 1
 *
 * The wrong attractor is opening a new shell before the inner one is full, so
 * Carbon's 2, 4 would become 6 in shell 2. The board refuses that move and says
 * why. A whole shell row is the tap target; its dots only show how full it is.
 */

const SHELL_CAP = [2, 8, 18, 32];

const ATOMS = [
  { name: 'Hydrogen', symbol: 'H',  Z: 1  },
  { name: 'Carbon',   symbol: 'C',  Z: 6  },
  { name: 'Oxygen',   symbol: 'O',  Z: 8  },
  { name: 'Sodium',   symbol: 'Na', Z: 11 },
];

const CSS = `
.sf .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 16px; align-items: start; }
.sf .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.sf .tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.sf .tab { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 12px; padding: 2px;
           font-family: var(--sim-font-display); font-size: 20px; font-weight: 700; min-height: 54px; }
.sf .tab[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; color: var(--sim-accent); }
.sf .tab[data-good="1"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.sf .tab[data-bad="1"] { border-color: var(--sim-bad); }
.sf .info { font-size: 16px; font-weight: 700; margin: 0; }
.sf .info b { color: var(--sim-accent); }
.sf .msg { font-size: 15px; line-height: 1.3; color: var(--sim-label-muted); margin: 0; min-height: 40px; }
.sf .msg.no { color: var(--sim-bad); font-weight: 700; }
.sf .rows { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.sf .shell { width: 100%; display: grid; grid-template-columns: 92px minmax(0, 1fr) 34px; gap: 8px; align-items: center;
             text-align: left; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 12px;
             padding: 3px 10px; min-height: 50px; }
.sf .lbl { font-size: 15px; font-weight: 800; line-height: 1.15; }
.sf .lbl span { display: block; font-size: 14px; font-weight: 600; color: var(--sim-label-muted); }
.sf .dots { display: flex; flex-wrap: wrap; gap: 3px; }
.sf .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--sim-bg-deep); border: 1.5px solid var(--sim-stroke); }
.sf .dot.on { background: var(--sim-electron); border-color: var(--sim-electron); }
.sf .cnt { font-size: 18px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }

.sim-dom-root--portrait .sf .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .sf .side { display: contents; }
.sim-dom-root--portrait .sf .rows { width: 100%; order: 4; }
.sim-dom-root--portrait .sf .tabs { width: 100%; order: 1; }
.sim-dom-root--portrait .sf .info { order: 2; }
.sim-dom-root--portrait .sf .msg { order: 3; min-height: 20px; }
.sim-dom-root--portrait .sf #sf-undo { order: 5; width: 100%; }
.sim-dom-root--portrait .sf .shell { grid-template-columns: 74px minmax(0, 1fr) 28px; padding: 4px 8px; }
.sim-dom-root--portrait .sf .dot { width: 9px; height: 9px; }
`;

export class ShellFillerGame extends GameBoard {
  static simId = 'shell-filler-game';
  static label = { en: 'Fill the Shells' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Four atoms. Pick an atom, then tap a shell to add an electron. Shells fill from the inside out, and shell n holds at most 2n squared electrons.';
  static OBJECTIVE = {
    prompt: { en: 'Build four atoms. Tap a shell to add an electron, from the inside out, until the electrons equal Z.' },
  };

  constructor(container, config) {
    super(container, config);
    this.shells = ATOMS.map(() => SHELL_CAP.map(() => 0)); // [atomIdx][shellIdx] = electron count
    this.at = 0;
    this._moved = false;
    this._note = { text: 'Tap shell 1 to add the first electron.', no: false };
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm sf">
          <div class="gm-head">
            <p class="kicker">The shell map</p>
            <h2>Fill each atom: <b>2n<sup>2</sup> per shell</b>.</h2>
            <p class="sub">Tap a shell to add one electron. Inner shells fill first.</p>
          </div>
          <div class="board">
            <div class="side">
              <div class="tabs">
                ${ATOMS.map((a, i) => `<button class="tap tab" type="button" data-i="${i}" aria-label="${a.name}">${a.symbol}</button>`).join('')}
              </div>
              <p class="info" id="sf-info"></p>
              <p class="msg" id="sf-msg" aria-live="polite"></p>
              <button class="tap btn" type="button" id="sf-undo">Take one off</button>
            </div>
            <div class="rows">
              ${SHELL_CAP.map((cap, s) => `
                <button class="tap shell" type="button" data-s="${s}">
                  <span class="lbl">Shell ${s + 1}<span>max ${cap}</span></span>
                  <span class="dots">${'<span class="dot"></span>'.repeat(cap)}</span>
                  <span class="cnt">0</span>
                </button>`).join('')}
            </div>
          </div>
        </div>`,
    });
    this.root.querySelectorAll('.tab').forEach((b) => onTap(b, () => {
      this.at = Number(b.dataset.i);
      this._note = { text: '', no: false };
      this._render();
    }));
    this.root.querySelectorAll('.shell').forEach((b) => onTap(b, () => this._add(Number(b.dataset.s))));
    onTap(this.root.querySelector('#sf-undo'), () => this._undo());
    this._render();
    this.quill.speak('Inner shell first. Add them one tap at a time.', 5200);
  }

  _refuse(text) {
    this._note = { text, no: true };
    this.quill?.setExpression('surprised');
    this._render();
  }

  _add(s) {
    const sh = this.shells[this.at];
    this._moved = true;
    if (s > 0 && sh[s - 1] < SHELL_CAP[s - 1]) {
      this._refuse(`Shell ${s} is not full yet, so shell ${s + 1} cannot open.`);
      return;
    }
    if (sh[s] >= SHELL_CAP[s]) {
      this._refuse(`Shell ${s + 1} is full: it holds at most ${SHELL_CAP[s]}.`);
      return;
    }
    sh[s] += 1;
    this._note = { text: '', no: false };
    this._render();
  }

  /** Takes off the last electron placed, which is always in the outermost shell in use. */
  _undo() {
    const sh = this.shells[this.at];
    const s = sh.reduce((last, c, k) => (c > 0 ? k : last), -1);
    if (s < 0) return;
    sh[s] -= 1;
    this._moved = true;
    this._note = { text: '', no: false };
    this._render();
  }

  _total(i) {
    return this.shells[i].reduce((a, b) => a + b, 0);
  }

  _render() {
    const atom = ATOMS[this.at];
    const total = this._total(this.at);
    this.root.querySelector('#sf-info').innerHTML = `${atom.name}, Z = ${atom.Z}: <b>${total}</b> of ${atom.Z} placed`;
    const msg = this.root.querySelector('#sf-msg');
    msg.textContent = this._note.text;
    msg.className = this._note.no ? 'msg no' : 'msg';
    this.root.querySelectorAll('.shell').forEach((row) => {
      const s = Number(row.dataset.s);
      const cnt = this.shells[this.at][s];
      row.querySelector('.cnt').textContent = String(cnt);
      row.setAttribute('aria-label', `Shell ${s + 1}, holds at most ${SHELL_CAP[s]}, ${cnt} placed. Add an electron.`);
      row.querySelectorAll('.dot').forEach((d, k) => d.classList.toggle('on', k < cnt));
    });
    this.root.querySelectorAll('.tab').forEach((b) => {
      const i = Number(b.dataset.i);
      const n = this._total(i);
      b.setAttribute('aria-pressed', i === this.at ? 'true' : 'false');
      b.dataset.good = n === ATOMS[i].Z ? '1' : '0';
      b.dataset.bad = n > ATOMS[i].Z ? '1' : '0';
    });
  }

  checkObjective() {
    if (!this._moved) return null;
    const off = ATOMS.filter((a, i) => this._total(i) !== a.Z);
    if (off.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const a = off[0];
    if (this._total(ATOMS.indexOf(a)) > a.Z) {
      return { ok: false, hint: `${a.name} has too many electrons. The total must equal Z, which is ${a.Z}.` };
    }
    return { ok: false, hint: `${a.name} is not finished. Keep adding electrons until the total equals Z, which is ${a.Z}.` };
  }
}
