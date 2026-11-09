import { GameBoard, mountGame } from '../shared/GameFrame.js';

/**
 * NucleusBuilderGame - mini-game for les-05, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson's notation is A = Z + N: the mass number
 * is the proton count plus the neutron count, and the atomic number is just the
 * protons. The student fills in four nuclei, given Z and A for each.
 *
 *   H  : Z=1,  A=1  -> 1p, 0n
 *   He : Z=2,  A=4  -> 2p, 2n
 *   C  : Z=6,  A=12 -> 6p, 6n
 *   Na : Z=11, A=23 -> 11p, 12n
 *
 * The wrong attractor is "A = Z": forgetting the neutrons. Setting neutrons to 0
 * on sodium is exactly that mistake. The card must give Z and must not give the
 * answer: the row marks only what the learner has typed.
 */

const NUCLEI = [
  { symbol: 'H',  name: 'Hydrogen', Z: 1,  A: 1  },
  { symbol: 'He', name: 'Helium',   Z: 2,  A: 4  },
  { symbol: 'C',  name: 'Carbon',   Z: 6,  A: 12 },
  { symbol: 'Na', name: 'Sodium',   Z: 11, A: 23 },
];

const CSS = `
.nb .grid { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; align-items: start; }
.nb .card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 8px 10px;
            display: flex; flex-direction: column; gap: 4px; }
.nb .card[data-good="1"] { border-color: var(--sim-good); }
.nb .top { display: flex; align-items: baseline; gap: 8px; }
.nb .sym { font-family: var(--sim-font-display); font-size: 26px; font-weight: 700; color: var(--sim-accent); line-height: 1.1; }
.nb .nm { font-size: 15px; color: var(--sim-label-muted); }
.nb .given { font-size: 16px; font-weight: 800; }
.nb .row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.nb .label { font-size: 15px; color: var(--sim-label-muted); }
.nb .sum { font-size: 15px; font-weight: 700; color: var(--sim-label-muted); min-height: 20px; }
.nb .sum.ok { color: var(--sim-good); }
.nb .sum.bad { color: var(--sim-bad); }

.sim-dom-root--portrait .nb .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.sim-dom-root--portrait .nb .card { padding: 6px 8px; }
.sim-dom-root--portrait .nb .top { justify-content: space-between; }
.sim-dom-root--portrait .nb .nm { font-size: 14px; }
`;

export class NucleusBuilderGame extends GameBoard {
  static simId = 'nucleus-builder-game';
  static label = { en: 'Count the Nucleus' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Four nuclei. For each one, type the number of protons and the number of neutrons, so that they add up to the mass number A.';
  static OBJECTIVE = {
    prompt: { en: 'For each element, enter the number of protons and the number of neutrons.' },
  };

  constructor(container, config) {
    super(container, config);
    this.answers = NUCLEI.map(() => ({ p: 0, n: 0 }));
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm nb">
          <div class="gm-head">
            <p class="kicker">Inside the nucleus</p>
            <h2>Build each <b>nucleus</b>.</h2>
            <p class="sub">Z is the number of protons. A is protons + neutrons.</p>
          </div>
          <div class="grid">
            ${NUCLEI.map((nuc, i) => `
              <div class="card" data-i="${i}">
                <div class="top"><span class="sym">${nuc.symbol}</span><span class="nm">${nuc.name}</span></div>
                <div class="given">Z = ${nuc.Z}, A = ${nuc.A}</div>
                <label class="row"><span class="label">Protons</span>
                  <input class="tap num" type="number" inputmode="numeric" min="0" step="1" placeholder="0" data-i="${i}" data-k="p" aria-label="protons in ${nuc.name}"></label>
                <label class="row"><span class="label">Neutrons</span>
                  <input class="tap num" type="number" inputmode="numeric" min="0" step="1" placeholder="0" data-i="${i}" data-k="n" aria-label="neutrons in ${nuc.name}"></label>
                <div class="sum" data-sum="${i}"></div>
              </div>`).join('')}
          </div>
        </div>`,
    });
    this.root.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        const i = Number(e.target.dataset.i);
        this.answers[i][e.target.dataset.k] = Number.isFinite(v) && v >= 0 ? v : 0;
        this._moved = true;
        this._render();
      });
    });
    this._render();
    this.quill.speak('A counts protons and neutrons together.', 5200);
  }

  _render() {
    NUCLEI.forEach((nuc, i) => {
      const ans = this.answers[i];
      const sum = ans.p + ans.n;
      const card = this.root.querySelector(`.card[data-i="${i}"]`);
      const out = this.root.querySelector(`[data-sum="${i}"]`);
      out.textContent = sum > 0 ? `${ans.p} + ${ans.n} = ${sum}` : '';
      out.className = `sum ${sum === 0 ? '' : (sum === nuc.A ? 'ok' : 'bad')}`;
      card.dataset.good = ans.p === nuc.Z && ans.n === nuc.A - nuc.Z ? '1' : '0';
    });
  }

  checkObjective() {
    if (!this._moved) return null;
    const allOk = NUCLEI.every((nuc, i) => {
      const a = this.answers[i];
      return a.p === nuc.Z && a.n === nuc.A - nuc.Z;
    });
    if (allOk) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const wrongP = NUCLEI.filter((nuc, i) => this.answers[i].p !== nuc.Z).length;
    if (wrongP > 0) return { ok: false, hint: 'The number of protons is Z. Check the protons on each card first.' };
    return { ok: false, hint: 'A counts protons and neutrons together, so subtract the protons from A to get the neutrons.' };
  }
}
