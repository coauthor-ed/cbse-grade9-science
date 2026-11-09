import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * DivideOrDieGame - mini-game for les-07, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). blk-l07-s02 asserts that "eventually, being larger
 * becomes a disadvantage" and blk-l07-s04 gives the answer - divide instead of
 * growing - but a student can accept both and still hold the intuition that
 * dividing sooner is simply always better. The lesson does not name
 * surface-area-to-volume, so this game does not require it either: the strain
 * it models is the one the lesson DOES state, that a single copy of the
 * instructions has to coordinate an ever-larger cell (blk-l07-s03).
 *
 * The student sets one number - the size a cell grows to before it divides -
 * and both directions lose:
 *
 *   too large   growth slows to nothing while the strain on one DNA copy
 *               keeps mounting, and the lineage dies
 *   too small   the cell splits before the instructions are finished being
 *               copied, so a daughter comes out with nothing to run on -
 *               blk-l07-s06's "copy first, divide later", as a failure
 *
 * That lower bound is what stops the answer being "drag it to the minimum",
 * and it is the reason division has a floor at all.
 */

const W = 900;
const H = 600;

const TICKS = 60;
const START_D = 10;
/** Growth per tick falls off linearly and reaches zero at GROWTH_A/GROWTH_B. */
const GROWTH_A = 1.2;
const GROWTH_B = 0.03;
/** Past this width one copy of the instructions can no longer keep up. */
const STRAIN_D = 26;
const STRAIN_RATE = 3;
/** Copying the instructions takes time the cell does not spend growing. */
const DIVIDE_COST = 6;
/** A cell must be wide enough to hold two full sets before it can split. */
const MIN_DIVIDE_D = 16;
const RECOVER = 25;
const TARGET_CELLS = 16;

const CSS = `
.dod { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.dod .dish {
  position: absolute; left: 34px; top: 54px; width: 470px; height: 330px;
  border-radius: 22px; border: 3px solid var(--sim-border); background: var(--sim-bg-cell);
  display: flex; flex-wrap: wrap; align-content: center; justify-content: center;
  gap: 8px; padding: 16px; box-sizing: border-box; overflow: hidden;
}
.dod .dishlabel {
  position: absolute; left: 48px; top: 32px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}
.dod .cell {
  border-radius: 50%; background: var(--sim-cytoplasm); border: 3px solid var(--sim-membrane);
  display: flex; align-items: center; justify-content: center;
}
.dod .cell.strained { border-color: var(--sim-warning); }
.dod .cell.dead { border-color: var(--sim-bad); background: var(--sim-track); opacity: 0.5; }
.dod .cell i { display: block; border-radius: 50%; background: var(--sim-nucleus); }

.dod .panel {
  position: absolute; right: 34px; top: 54px; width: 320px;
  border: 3px solid var(--sim-border); border-radius: 20px; padding: 16px;
  background: var(--sim-bg-surface); box-sizing: border-box;
}
.dod .panel h4 {
  margin: 0 0 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.dod .big { font-family: var(--sim-font-display); font-size: 40px; line-height: 1.05; }
.dod .big.ok { color: var(--sim-good); }
.dod .big.no { color: var(--sim-bad); }
.dod .panel .fate { margin: 6px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--sim-label-muted); }

.dod .chart { position: absolute; left: 34px; right: 34px; top: 408px; height: 118px; }
.dod .chart h4 {
  margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.dod .plot {
  position: relative; height: 84px; border-bottom: 2px solid var(--sim-track);
  border-left: 2px solid var(--sim-track);
}
.dod .col { position: absolute; bottom: 0; width: 9px; border-radius: 2px 2px 0 0; }
.dod .col.grow { background: var(--sim-accent); }
.dod .col.strained { background: var(--sim-warning); }
.dod .col.split { background: var(--sim-good); }
.dod .col.dead { background: var(--sim-bad); }
.dod .strainline {
  position: absolute; left: 0; right: 0; height: 2px; background: var(--sim-warning);
  opacity: 0.55;
}
.dod .strainlabel {
  position: absolute; right: 2px; font-size: 10px; color: var(--sim-warning);
  transform: translateY(-13px);
}
.dod .floorlabel {
  position: absolute; right: 2px; font-size: 10px; color: var(--sim-label-muted);
  transform: translateY(-13px);
}
.dod .floorline {
  position: absolute; left: 0; right: 0; height: 2px; background: var(--sim-label-muted);
  opacity: 0.4;
}

.dod .hintline {
  position: absolute; left: 34px; right: 250px; bottom: 12px; margin: 0;
  font-size: 13.5px; line-height: 1.5; color: var(--sim-label-muted);
}
.dod .hintline b { color: var(--sim-accent); }
`;

export class DivideOrDieGame extends withChallenge(DomSimulation) {
  static simId = 'divide-or-die-game';
  static label = { en: 'Divide or Die' };
  static category = 'biology.cells';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'One cell growing over sixty days. Choose the width it grows to before it divides, and watch '
    + 'whether the lineage builds up a colony or fails.';

  static OBJECTIVE = {
    prompt: {
      en: `Choose when a cell should divide. Get to at least ${TARGET_CELLS} living cells in `
        + `${TICKS} days - growing too long and splitting too soon both fail.`,
    },
  };
  static SCORING = { mode: 'accuracy' };

  static CONTROLS = [
    { type: 'slider', id: 'threshold', label: 'Divide at width', min: 12, max: 34, step: 1, value: 34, suffix: ' um' },
  ];

  constructor(container, config) {
    super(container, config);
    this.threshold = 34;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="dod">
        <p class="dishlabel">Sixty days later</p>
        <div class="dish"></div>
        <div class="panel">
          <h4>Living cells</h4>
          <div class="big">-</div>
          <p class="fate"></p>
        </div>
        <div class="chart">
          <h4>Width of one cell, day by day</h4>
          <div class="plot">
            <div class="strainline"></div><span class="strainlabel">strain begins</span>
            <div class="floorline"></div><span class="floorlabel">instructions copied</span>
          </div>
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._dish = this.root.querySelector('.dish');
    this._big = this.root.querySelector('.big');
    this._fate = this.root.querySelector('.fate');
    this._plot = this.root.querySelector('.plot');
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 806, y: 556, height: 114, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Grow too long and it fails. Split too soon and it also fails.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id !== 'threshold') return;
    this.threshold = Number(value);
    this._moved = true;
    this._render();
  }

  /**
   * Sixty days of one lineage. Pure - no DOM, no randomness - so the verdict
   * and the drawn chart come from the same numbers.
   * @returns {{cells:number, alive:boolean, reason:string, trace:object[]}}
   */
  simulate() {
    let d = START_D;
    let cells = 1;
    let health = 100;
    let cooldown = 0;
    const trace = [];

    for (let t = 0; t < TICKS; t += 1) {
      if (cooldown > 0) {
        cooldown -= 1;
        trace.push({ d, kind: 'split' });
        continue;
      }

      d += Math.max(0, GROWTH_A - GROWTH_B * d);

      const strained = d > STRAIN_D;
      if (strained) health -= (d - STRAIN_D) * STRAIN_RATE;

      if (health <= 0) {
        trace.push({ d, kind: 'dead' });
        return {
          cells: 0,
          alive: false,
          reason: 'strain',
          trace,
        };
      }

      if (d >= this.threshold) {
        // Splitting before there are two full sets of instructions leaves a
        // daughter with nothing to run on, and the lineage collapses.
        if (d < MIN_DIVIDE_D) {
          trace.push({ d, kind: 'dead' });
          return { cells: 0, alive: false, reason: 'premature', trace };
        }
        cells *= 2;
        d /= Math.cbrt(2);
        cooldown = DIVIDE_COST;
        health = Math.min(100, health + RECOVER);
        trace.push({ d, kind: 'split' });
        continue;
      }

      trace.push({ d, kind: strained ? 'strained' : 'grow' });
    }

    return { cells, alive: true, reason: cells >= TARGET_CELLS ? 'ok' : 'slow', trace };
  }

  _render() {
    const { cells, alive, reason, trace } = this.simulate();
    const won = alive && cells >= TARGET_CELLS;

    const shown = Math.min(cells || 1, 32);
    const size = cells === 0 ? 54 : Math.max(18, Math.min(62, 150 / Math.sqrt(shown)));
    this._dish.innerHTML = Array.from({ length: shown }, () => `
      <div class="cell ${cells === 0 ? 'dead' : ''}" style="width:${size}px;height:${size}px">
        <i style="width:${size * 0.34}px;height:${size * 0.34}px"></i>
      </div>`).join('');

    this._big.textContent = this._moved ? String(cells) : '-';
    this._big.className = `big ${this._moved ? (won ? 'ok' : 'no') : ''}`;
    this._fate.textContent = !this._moved
      ? `You need ${TARGET_CELLS}. The slider starts at the largest setting.`
      : reason === 'strain' ? 'The cell kept growing, growth slowed to a crawl, and one copy of the instructions could not keep up.'
      : reason === 'premature' ? 'It split before the instructions had been copied. One daughter had nothing to run on.'
      : reason === 'slow' ? `Healthy, but only ${cells}. Too much of the sixty days went into growing.`
      : 'A healthy colony.';

    // Chart: one column per day, scaled to the widest cell the run reaches.
    const peak = Math.max(this.threshold, STRAIN_D, ...trace.map((p) => p.d));
    const colW = 100 / TICKS;
    this._plot.querySelectorAll('.col').forEach((c) => c.remove());
    trace.forEach((p, t) => {
      const el = document.createElement('div');
      el.className = `col ${p.kind}`;
      el.style.left = `${t * colW}%`;
      el.style.width = `${colW * 0.72}%`;
      el.style.height = `${Math.max(2, (p.d / peak) * 84)}px`;
      this._plot.appendChild(el);
    });
    this._plot.querySelector('.strainline').style.bottom = `${(STRAIN_D / peak) * 84}px`;
    this._plot.querySelector('.strainlabel').style.bottom = `${(STRAIN_D / peak) * 84}px`;
    this._plot.querySelector('.floorline').style.bottom = `${(MIN_DIVIDE_D / peak) * 84}px`;
    this._plot.querySelector('.floorlabel').style.bottom = `${(MIN_DIVIDE_D / peak) * 84}px`;

    this._hint.innerHTML = 'A cell takes in what it needs across its surface and has to supply '
      + 'everything inside it. <b>Growing makes that gap worse, not better.</b>';
  }

  checkObjective() {
    if (!this._moved) return null;
    const { cells, alive, reason } = this.simulate();

    if (alive && cells >= TARGET_CELLS) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    let hint;
    if (reason === 'strain') {
      hint = 'It never divided in time. Notice growth almost stops long before your setting - past a '
        + 'point the cell is taking in barely more than it spends, and one set of instructions is '
        + 'still trying to run all of it. Waiting for a bigger cell is waiting for a slower one.';
    } else if (reason === 'premature') {
      hint = 'It split too early. The instructions have to be copied BEFORE the cell divides, and '
        + 'that takes a cell wide enough to hold two full sets. There is a floor here, not just a ceiling.';
    } else {
      hint = `Healthy, but only ${cells} cells of the ${TARGET_CELLS} you need. Each round spent `
        + 'growing to your setting is a round not spent dividing - and growth gets slower the wider '
        + 'it gets. Try dividing sooner, but not below the floor on the chart.';
    }
    return { ok: false, hint };
  }
}
