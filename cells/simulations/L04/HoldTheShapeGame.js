import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * HoldTheShapeGame - mini-game for les-04, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson gives the cell two additions and is
 * careful to say they do different jobs: blk-l04-s06 "Two Layers, Two Jobs"
 * (wall for strength, membrane for control) and blk-l04-s07a "A Place to Store
 * Water - Solving Two Problems at Once" (the vacuole). Nothing forces a
 * student to believe both are needed; the obvious reading is that a strong
 * enough wall handles everything.
 *
 * So the cell is tested in BOTH environments the lesson names, and each
 * single-component answer fails in exactly one of them:
 *
 *   wall only     survives fresh water, shrivels in salty - a wall is rigid,
 *                 and the membrane simply pulls away inside it (plasmolysis)
 *   vacuole only  stays supplied in salty water, bursts in fresh
 *   neither       floppy and shrivelled - the lesson's opening state, which is
 *                 what "Too Soft to Survive" is the title of
 *
 * Only a wall strong enough for the water the vacuole is holding passes both,
 * and because the burst threshold rises WITH the stored water the two controls
 * cannot be tuned independently. That coupling is the whole point.
 */

const W = 900;
const H = 600;

/** Pressure a full cell puts on its wall in fresh water, as wall units. */
const BASE_PRESSURE = 40;
const PRESSURE_PER_WATER = 0.6;
/** Water a salty day costs; below this reserve the membrane pulls away. */
const SALT_LOSS = 55;
/** Below these the cell is floppy even when it is not bursting or shrivelled. */
const FIRM_WALL = 30;
const FIRM_WATER = 40;

const CSS = `
.hts { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.hts .tests {
  position: absolute; left: 34px; right: 34px; top: 56px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 22px;
}
.hts .test {
  border: 3px solid var(--sim-border); border-radius: 20px; padding: 14px 16px 16px;
  background: var(--sim-bg-surface); box-sizing: border-box; min-height: 306px;
  display: flex; flex-direction: column;
}
.hts .test.pass { border-color: var(--sim-good); }
.hts .test.fail { border-color: var(--sim-bad); }
.hts .test h4 {
  margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.hts .test .sub { margin: 3px 0 0; font-size: 12px; color: var(--sim-label-muted); }

.hts .dish {
  flex: 1; margin: 12px 0 10px; border-radius: 14px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.hts .dish.fresh { background: var(--sim-water); }
.hts .dish.salty { background: var(--sim-salt); }

/* The cell: wall ring, membrane inside it, vacuole inside that. Sized by
   state so the picture is the verdict, not a caption next to it. */
.hts .cell {
  position: relative; width: 150px; height: 150px; border-radius: 50%;
  background: var(--sim-cell-wall); display: flex; align-items: center; justify-content: center;
  transition: width 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), height 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)),
              border-radius 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), opacity 260ms;
}
.hts .membrane {
  position: absolute; border-radius: 50%; background: var(--sim-cytoplasm);
  border: 3px solid var(--sim-membrane);
  transition: width 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), height 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
  display: flex; align-items: center; justify-content: center;
}
.hts .vacuole {
  border-radius: 50%; background: var(--sim-vacuole);
  transition: width 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), height 260ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}
.hts .cell.burst { border-radius: 42% 58% 35% 65% / 55% 32% 68% 45%; opacity: 0.45; }
.hts .cell.floppy { border-radius: 48% 52% 60% 40% / 58% 44% 56% 42%; }

.hts .outcome { font-size: 14px; font-weight: 700; margin: 0; }
.hts .test.pass .outcome { color: var(--sim-good); }
.hts .test.fail .outcome { color: var(--sim-bad); }
.hts .why { margin: 4px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--sim-label-muted); }

.hts .gauge {
  position: absolute; left: 34px; right: 300px; top: 392px;
  display: grid; grid-template-columns: 118px 1fr 54px; gap: 10px 12px; align-items: center;
  font-size: 13px;
}
.hts .gauge .track {
  height: 12px; border-radius: 6px; background: var(--sim-track); position: relative; overflow: hidden;
}
.hts .gauge .fill {
  position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px;
  transition: width 220ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}
.hts .gauge .fill.wall { background: var(--sim-cell-wall); }
.hts .gauge .fill.water { background: var(--sim-vacuole); }
.hts .gauge .need {
  position: absolute; top: -3px; bottom: -3px; width: 3px; background: var(--sim-accent);
  transition: left 220ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}
.hts .gauge .val { text-align: right; color: var(--sim-label-muted); }

.hts .hintline {
  position: absolute; left: 34px; right: 300px; bottom: 20px; margin: 0;
  font-size: 14px; line-height: 1.5; color: var(--sim-label-muted);
}
.hts .hintline b { color: var(--sim-accent); }
`;

export class HoldTheShapeGame extends withChallenge(DomSimulation) {
  static simId = 'hold-the-shape-game';
  static label = { en: 'Hold the Shape' };
  static category = 'biology.cells';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'One cell tested twice: in fresh water, where water floods in, and in salty water, where water '
    + 'drains out. Set how strong its wall is and how much water its vacuole holds.';

  static OBJECTIVE = {
    prompt: {
      en: 'Build one cell that survives a flood of fresh water AND a salty day - and is firm, '
        + 'not floppy, in both.',
    },
  };
  static SCORING = { mode: 'accuracy' };

  static CONTROLS = [
    { type: 'slider', id: 'wall', label: 'Wall strength', min: 0, max: 100, step: 5, value: 0, suffix: '%' },
    { type: 'slider', id: 'water', label: 'Water stored', min: 0, max: 100, step: 5, value: 0, suffix: '%' },
  ];

  constructor(container, config) {
    super(container, config);
    this.wall = 0;
    this.water = 0;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="hts">
        <div class="tests">
          <div class="test" data-test="fresh">
            <h4>Fresh water</h4>
            <p class="sub">Water floods in. Something has to take the pressure.</p>
            <div class="dish fresh">
              <div class="cell"><div class="membrane"><div class="vacuole"></div></div></div>
            </div>
            <p class="outcome"></p>
            <p class="why"></p>
          </div>
          <div class="test" data-test="salty">
            <h4>Salty water</h4>
            <p class="sub">Water drains out. Something has to have kept some.</p>
            <div class="dish salty">
              <div class="cell"><div class="membrane"><div class="vacuole"></div></div></div>
            </div>
            <p class="outcome"></p>
            <p class="why"></p>
          </div>
        </div>

        <div class="gauge">
          <span>Wall strength</span>
          <div class="track"><div class="fill wall"></div><div class="need" data-need="wall"></div></div>
          <span class="val" data-val="wall"></span>
          <span>Water stored</span>
          <div class="track"><div class="fill water"></div><div class="need" data-need="water"></div></div>
          <span class="val" data-val="water"></span>
        </div>

        <p class="hintline"></p>
      </div>
    `);

    this._tests = {
      fresh: this.root.querySelector('[data-test="fresh"]'),
      salty: this.root.querySelector('[data-test="salty"]'),
    };
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 800, y: 550, height: 120, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Two dishes, one cell design. It has to come through both.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id === 'wall') this.wall = Number(value);
    else if (id === 'water') this.water = Number(value);
    else return;
    this._moved = true;
    this._render();
  }

  /** Wall strength this much stored water demands in fresh water. */
  get pressure() { return BASE_PRESSURE + PRESSURE_PER_WATER * this.water; }

  /**
   * @returns {{fresh:{ok:boolean,state:string,why:string},
   *            salty:{ok:boolean,state:string,why:string}}}
   */
  audit() {
    const burst = this.wall < this.pressure;
    const floppy = this.wall < FIRM_WALL || this.water < FIRM_WATER;
    const shrivelled = this.water < SALT_LOSS;

    const fresh = burst
      ? { ok: false, state: 'burst', why: 'Water kept coming in and the wall gave way.' }
      : floppy
        ? { ok: false, state: 'floppy', why: 'It held together, but there is nothing pressing out against the wall. Limp.' }
        : { ok: true, state: 'firm', why: 'Full, and the wall is taking the pressure. Firm.' };

    const salty = shrivelled
      ? { ok: false, state: 'shrivelled', why: 'Water drained out and there was no reserve. The membrane pulled away from the wall.' }
      : floppy
        ? { ok: false, state: 'floppy', why: 'Enough water left, but nothing rigid to press against.' }
        : { ok: true, state: 'firm', why: 'The store covered the loss. Still firm.' };

    return { fresh, salty };
  }

  _paintCell(el, state, water) {
    const cell = el.querySelector('.cell');
    const membrane = el.querySelector('.membrane');
    const vacuole = el.querySelector('.vacuole');

    const size = state === 'shrivelled' ? 116 : 150;
    cell.style.width = `${size}px`;
    cell.style.height = `${size}px`;
    cell.classList.toggle('burst', state === 'burst');
    cell.classList.toggle('floppy', state === 'floppy');

    // Plasmolysis is the membrane shrinking away INSIDE a wall that does not
    // move, so the wall keeps its size and only the membrane pulls in.
    const inner = state === 'shrivelled' ? size * 0.56 : size * 0.86;
    membrane.style.width = `${inner}px`;
    membrane.style.height = `${inner}px`;

    const v = inner * 0.86 * Math.sqrt(Math.max(0, water) / 100);
    vacuole.style.width = `${v}px`;
    vacuole.style.height = `${v}px`;
  }

  _render() {
    const result = this.audit();

    for (const key of ['fresh', 'salty']) {
      const el = this._tests[key];
      const r = result[key];
      el.classList.toggle('pass', this._moved && r.ok);
      el.classList.toggle('fail', this._moved && !r.ok);
      el.querySelector('.outcome').textContent = this._moved
        ? ({ burst: 'Burst', shrivelled: 'Shrivelled', floppy: 'Floppy', firm: 'Survived' })[r.state]
        : 'Not tested yet';
      el.querySelector('.why').textContent = this._moved ? r.why : '';
      this._paintCell(el, r.state, key === 'salty' ? Math.max(0, this.water - SALT_LOSS + 20) : this.water);
    }

    this.root.querySelector('.fill.wall').style.width = `${this.wall}%`;
    this.root.querySelector('.fill.water').style.width = `${this.water}%`;
    this.root.querySelector('[data-need="wall"]').style.left = `${Math.min(100, this.pressure)}%`;
    this.root.querySelector('[data-need="water"]').style.left = `${SALT_LOSS}%`;
    this.root.querySelector('[data-val="wall"]').textContent = `${this.wall}%`;
    this.root.querySelector('[data-val="water"]').textContent = `${this.water}%`;

    this._hint.innerHTML = 'The marks show what each test demands. Storing more water moves the '
      + '<b>wall</b> mark right - the two are not independent.';
  }

  checkObjective() {
    if (!this._moved) return null;
    const { fresh, salty } = this.audit();
    if (fresh.ok && salty.ok) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    let hint;
    if (fresh.state === 'burst' && salty.state === 'shrivelled') {
      hint = 'It burst in one dish and shrivelled in the other - this is the bare cell the lesson '
        + 'opened with. Neither problem is solved by being softer.';
    } else if (fresh.state === 'burst') {
      hint = 'It survived the salty day and burst in fresh water. You are storing water with nothing '
        + 'strong enough to hold it. Notice the wall mark moved right when you filled the vacuole.';
    } else if (salty.state === 'shrivelled') {
      hint = 'It came through fresh water and shrivelled in salt. A wall is rigid, so it keeps its '
        + 'shape while the membrane pulls away inside it - strength is no substitute for a reserve.';
    } else {
      hint = 'Nothing burst and nothing shrivelled, but it is limp. Being firm takes a wall to push '
        + 'against AND water pushing against it.';
    }
    return { ok: false, hint };
  }
}
