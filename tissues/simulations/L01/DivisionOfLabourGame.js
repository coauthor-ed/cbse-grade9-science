import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * DivisionOfLabourGame - mini-game for les-01, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson's claim is that a bigger organism is not
 * a more capable one: adding copies of the same cell raises the head count and
 * changes nothing else. This game makes that claim the win condition rather
 * than a caption.
 *
 * Four jobs need doing. A group of similar cells covers one job, and only if
 * the group has at least 3 cells in it. So with `kinds = 1` NO number of cells
 * ever finishes more than one job - the student can drag the cell slider to 40
 * and watch three jobs stay unstaffed, which is the misconception failing in
 * front of them. Splitting too far fails the other way: 6 kinds out of 12 cells
 * is 2 per group and staffs nothing.
 *
 * The objective asks for all four jobs on the FEWEST cells, so the answer is
 * exactly 4 kinds x 3 cells = 12, and both wrong instincts (pile them up,
 * split them thin) are losing moves.
 *
 * Built on DomSimulation per the kit default for new games: Quill's SVG rig
 * drops in through SimMascotDom with no canvas port, and every colour is a
 * live var(--sim-*) with no fallback table to go stale.
 */

const W = 900;
const H = 600;

const JOBS = [
  { key: 'cover',   label: 'Cover the outside' },
  { key: 'carry',   label: 'Carry food inward' },
  { key: 'hold',    label: 'Hold the shape up' },
  { key: 'make',    label: 'Make new cells' },
];

const PER_JOB = 3;                       // cells a group needs before its job is done
const BEST_CELLS = JOBS.length * PER_JOB; // 12

/** Split `cells` as evenly as possible into `kinds` groups. */
function groupSizes(cells, kinds) {
  const base = Math.floor(cells / kinds);
  const extra = cells % kinds;
  return Array.from({ length: kinds }, (_, i) => base + (i < extra ? 1 : 0));
}

const CSS = `
.dol { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.dol .body {
  position: absolute; left: 48px; top: 74px; width: 400px; height: 400px;
  border: 3px solid var(--sim-border); border-radius: 46% 54% 52% 48% / 50% 46% 54% 50%;
  background: var(--sim-bg-surface);
  display: flex; flex-wrap: wrap; align-content: center; justify-content: center;
  gap: 9px; padding: 44px; box-sizing: border-box;
}
.dol .cell {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--sim-bg-deep);
  transition: background var(--motion-base, 240ms) ease;
}
.dol .k0 { background: var(--sim-series-1); }
.dol .k1 { background: var(--sim-series-2); }
.dol .k2 { background: var(--sim-series-3); }
.dol .k3 { background: var(--sim-series-4); }
.dol .k4 { background: var(--sim-series-5); }
.dol .k5 { background: var(--sim-series-6); }

.dol .bodylabel {
  position: absolute; left: 48px; top: 40px; width: 400px; text-align: center;
  font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--sim-label-muted);
}

.dol .panel {
  position: absolute; left: 496px; top: 40px; width: 356px;
  background: var(--sim-panel); border: 2px solid var(--sim-border);
  border-radius: 18px; padding: 20px 22px; box-sizing: border-box;
}
.dol .kicker {
  font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--sim-label-muted); margin: 0 0 12px;
}
.dol .job {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-top: 1px solid var(--sim-border);
}
.dol .mark {
  width: 24px; height: 24px; flex: 0 0 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: var(--sim-bg-deep);
  background: var(--sim-bad);
}
.dol .job.done .mark { background: var(--sim-good); }
.dol .job .name { flex: 1; font-size: 15px; }
.dol .job .staff { font-size: 14px; color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.dol .job.done .name { font-weight: 700; }

.dol .tally {
  margin-top: 16px; padding-top: 12px; border-top: 2px solid var(--sim-border);
  display: flex; justify-content: space-between; align-items: baseline;
}
.dol .tally span:first-child { color: var(--sim-label-muted); font-size: 15px; }
.dol .tally .big { font-family: var(--sim-font-display); font-size: 26px; font-weight: 700; color: var(--sim-accent); }

.dol .hintline {
  position: absolute; left: 496px; top: 402px; width: 356px;
  font-size: 14px; line-height: 1.5; color: var(--sim-label-muted); margin: 0;
}
.dol .spare { color: var(--sim-warning); font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .dol .cell { transition: none; }
}
`;

export class DivisionOfLabourGame extends withChallenge(DomSimulation) {
  static simId = 'division-of-labour-game';
  static label = { en: 'Staff the Organism' };
  static category = 'biology.tissues';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'An organism made of cells. Two sliders set how many cells there are and how many '
    + 'different kinds of cell. Four jobs are listed; a job is done when a group of at '
    + 'least three cells of one kind is on it.';

  static OBJECTIVE = {
    prompt: {
      en: 'Get all four jobs done - using as few cells as you can. There is a smallest number that works.',
    },
  };
  // +-0.02 of 12 is +-0.24, so only exactly 12 counts.
  static SCORING = { mode: 'accuracy', tolerance: 0.02 };

  static CONTROLS = [
    { type: 'slider', id: 'cells', label: 'Cells in the organism:', min: 4, max: 40, step: 1, value: 10 },
    { type: 'slider', id: 'kinds', label: 'Kinds of cell:', min: 1, max: 6, step: 1, value: 1 },
  ];

  constructor(container, config) {
    super(container, config);
    this.cells = 10;
    this.kinds = 1;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="dol">
        <p class="bodylabel">The organism</p>
        <div class="body"></div>
        <div class="panel">
          <p class="kicker">The jobs that need doing</p>
          ${JOBS.map((j) => `
            <div class="job" data-job="${j.key}">
              <span class="mark">&times;</span>
              <span class="name">${j.label}</span>
              <span class="staff">0 cells</span>
            </div>`).join('')}
          <div class="tally">
            <span>Cells used</span>
            <span class="big">10</span>
          </div>
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._body = this.root.querySelector('.body');
    this._jobRows = JOBS.map((j) => this.root.querySelector(`[data-job="${j.key}"]`));
    this._tally = this.root.querySelector('.tally .big');
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 250, y: 552, height: 132, bubbleSide: 'right' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Ten cells, all the same kind. Add more and see how far it gets you.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  /** mini-game@1 pokes onBeatChange once on mount; a game wants its own state. */
  onBeatChange() { /* no beats - this scene is a game, not a paced explainer */ }

  onControlChange(id, value) {
    const v = Number(value);
    if (id === 'cells') this.cells = v;
    else if (id === 'kinds') this.kinds = v;
    else return;
    this._moved = true;
    this._render();
  }

  /** @returns {{sizes:number[], done:boolean[], staffed:number}} */
  _state() {
    const sizes = groupSizes(this.cells, this.kinds);
    const done = JOBS.map((_, i) => (sizes[i] ?? 0) >= PER_JOB);
    return { sizes, done, staffed: done.filter(Boolean).length };
  }

  _render() {
    const { sizes, done, staffed } = this._state();

    // one dot per cell, coloured by which group it lands in
    const dots = [];
    sizes.forEach((n, k) => {
      for (let i = 0; i < n; i += 1) dots.push(`<span class="cell k${k}"></span>`);
    });
    this._body.innerHTML = dots.join('');

    this._jobRows.forEach((row, i) => {
      const n = sizes[i] ?? 0;
      row.classList.toggle('done', done[i]);
      row.querySelector('.mark').innerHTML = done[i] ? '&check;' : '&times;';
      row.querySelector('.staff').textContent = `${n} cell${n === 1 ? '' : 's'}`;
    });

    this._tally.textContent = String(this.cells);

    const spare = this.kinds > JOBS.length
      ? `<span class="spare">${sizes.slice(JOBS.length).reduce((a, b) => a + b, 0)} cells are in kinds with no job to do.</span>`
      : '';
    this._hint.innerHTML =
      `${staffed} of ${JOBS.length} jobs done. A job needs ${PER_JOB} cells of one kind. ${spare}`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const { staffed } = this._state();

    if (staffed < JOBS.length) {
      this.quill?.setExpression('surprised');
      const hint = this.kinds === 1
        ? 'Every cell is the same kind, so they can only ever do one job between them. More of the same is still one job.'
        : this.kinds > JOBS.length
          ? 'Too many kinds now - the groups are too small to finish a job, and some kinds have no job at all.'
          : `Only ${this.kinds} kinds of cell, so at most ${this.kinds} of the four jobs can be covered.`;
      return { ok: false, hint };
    }

    if (this.cells > BEST_CELLS) this.quill?.setExpression('surprised');
    else this.quill?.perform('hop');

    return {
      value: this.cells,
      target: BEST_CELLS,
      hint: `All four jobs are done, but on ${this.cells} cells. Each job needs only ${PER_JOB}. What is the smallest organism that still covers all four?`,
    };
  }
}
