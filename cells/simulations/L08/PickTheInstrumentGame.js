import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * PickTheInstrumentGame - mini-game for les-08, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). blk-l08-s03 says "the greater the magnification AND
 * CLARITY, the more details become visible", and blk-l08-s04b's table says the
 * electron microscope has "much higher magnification" but the light microscope
 * "can observe living cells". Read quickly, both reduce to "the electron one is
 * better", which is the misconception this game exists to break.
 *
 * Five observations, three independent requirements, and no instrument meets
 * all of them:
 *
 *   magnification  big enough to see the thing at all - a slider, so the
 *                  student can try winding it up and watch it not help
 *   clarity        the light microscope stops resolving below about 200 nm,
 *                  and no amount of magnification moves that limit
 *   alive          an electron beam gives a beautifully detailed dead cell
 *
 * So "use the best microscope for everything" loses two observations and "keep
 * everything on the light microscope" loses two others. The only passing answer
 * splits the work by what each job actually needs.
 */

const W = 900;
const H = 600;

/** Finest detail each instrument can separate, in nanometres. */
const LIGHT_RESOLUTION = 200;
const ELECTRON_RESOLUTION = 0.5;

const JOBS = [
  {
    id: 'streaming',
    what: 'Watch cytoplasm streaming inside a leaf cell',
    detail: 2000, minMag: 200, alive: true,
  },
  {
    id: 'chloroplasts',
    what: 'Count the chloroplasts in one leaf cell',
    detail: 3000, minMag: 150, alive: false,
  },
  {
    id: 'cristae',
    what: 'See the folds inside a single mitochondrion',
    detail: 50, minMag: 0, alive: false,
  },
  {
    id: 'ribosomes',
    what: 'Make out individual ribosomes',
    detail: 25, minMag: 0, alive: false,
  },
  {
    id: 'amoeba',
    what: 'Watch an amoeba change shape as it moves',
    detail: 5000, minMag: 100, alive: true,
  },
];

const CSS = `
.pti { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.pti .head {
  position: absolute; left: 34px; top: 26px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}

.pti .jobs { position: absolute; left: 34px; right: 34px; top: 54px; }
.pti .job {
  display: grid; grid-template-columns: 1fr 210px 178px; gap: 14px; align-items: center;
  border: 3px solid var(--sim-border); border-radius: 16px; background: var(--sim-bg-surface);
  padding: 10px 14px; margin-bottom: 10px; box-sizing: border-box;
}
.pti .job.pass { border-color: var(--sim-good); }
.pti .job.fail { border-color: var(--sim-bad); }
.pti .job .what { font-size: 14px; font-weight: 600; }
.pti .job .spec { display: block; font-size: 11.5px; font-weight: 400; color: var(--sim-label-muted); margin-top: 2px; }

.pti .pick { display: flex; gap: 6px; }
.pti .pick button {
  flex: 1; font: inherit; font-size: 12px; font-weight: 700; padding: 7px 4px;
  border-radius: 10px; cursor: pointer; color: var(--sim-label);
  background: var(--sim-bg-deep); border: 2px solid var(--sim-border);
}
.pti .pick button[aria-pressed="true"] { border-color: var(--sim-accent); color: var(--sim-accent); }
.pti .pick button:focus-visible { outline: 3px solid var(--sim-gold); outline-offset: 2px; }

.pti .result { font-size: 12.5px; line-height: 1.4; }
.pti .job.pass .result { color: var(--sim-good); }
.pti .job.fail .result { color: var(--sim-bad); }

.pti .limits {
  position: absolute; left: 34px; right: 250px; bottom: 46px;
  font-size: 12.5px; color: var(--sim-label-muted); margin: 0; line-height: 1.55;
}
.pti .limits b { color: var(--sim-accent); }
.pti .limits .warn { color: var(--sim-warning); font-weight: 700; }

.pti .tally {
  position: absolute; left: 34px; bottom: 16px; margin: 0;
  font-family: var(--sim-font-display); font-size: 19px;
}
.pti .tally.ok { color: var(--sim-good); }
.pti .tally.no { color: var(--sim-bad); }
`;

export class PickTheInstrumentGame extends withChallenge(DomSimulation) {
  static simId = 'pick-the-instrument-game';
  static label = { en: 'Pick the Instrument' };
  static category = 'biology.cells';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Five things to observe and two microscopes. Choose an instrument for each observation and set '
    + 'the light microscope magnification.';

  static OBJECTIVE = {
    prompt: {
      en: 'Get all five observations. One microscope cannot do them all, and turning the '
        + 'magnification up does not fix everything.',
    },
  };
  static SCORING = { mode: 'accuracy' };

  static CONTROLS = [
    { type: 'slider', id: 'mag', label: 'Light microscope', min: 100, max: 2000, step: 100, value: 100, suffix: 'x' },
  ];

  constructor(container, config) {
    super(container, config);
    this.mag = 100;
    this.choice = Object.fromEntries(JOBS.map((j) => [j.id, 'light']));
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="pti">
        <p class="head">Five things to look at</p>
        <div class="jobs">
          ${JOBS.map((j) => `
            <div class="job" data-job="${j.id}">
              <div class="what">${j.what}
                <span class="spec">detail ${j.detail} nm${j.alive ? ' &middot; must still be alive' : ''}</span>
              </div>
              <div class="pick">
                <button type="button" data-pickfor="${j.id}" data-inst="light">Light</button>
                <button type="button" data-pickfor="${j.id}" data-inst="electron">Electron</button>
              </div>
              <div class="result"></div>
            </div>`).join('')}
        </div>
        <p class="limits"></p>
        <p class="tally"></p>
      </div>
    `);

    this.root.querySelectorAll('[data-pickfor]').forEach((b) => {
      b.addEventListener('click', () => {
        this.choice[b.dataset.pickfor] = b.dataset.inst;
        this._moved = true;
        this._render();
      });
    });

    this._limits = this.root.querySelector('.limits');
    this._tally = this.root.querySelector('.tally');

    this.quill = SimMascotDom.mount(this.root, { x: 808, y: 560, height: 112, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Bigger is not the same as clearer. Two different problems.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id !== 'mag') return;
    this.mag = Number(value);
    this._moved = true;
    this._render();
  }

  /** @returns {{id:string, ok:boolean, why:string}[]} */
  audit() {
    return JOBS.map((j) => {
      const electron = this.choice[j.id] === 'electron';

      if (electron && j.alive) {
        return { id: j.id, ok: false, why: 'Beautifully detailed - and dead. The beam killed it before it moved.' };
      }
      const resolution = electron ? ELECTRON_RESOLUTION : LIGHT_RESOLUTION;
      if (j.detail < resolution) {
        return {
          id: j.id,
          ok: false,
          why: `A blur at ${this.mag}x. Light cannot separate anything finer than ${LIGHT_RESOLUTION} nm, whatever the magnification.`,
        };
      }
      if (!electron && this.mag < j.minMag) {
        return { id: j.id, ok: false, why: `Too small to make out at ${this.mag}x. Needs at least ${j.minMag}x.` };
      }
      return { id: j.id, ok: true, why: electron ? 'Clearly resolved.' : `Seen clearly at ${this.mag}x.` };
    });
  }

  _render() {
    const rows = this.audit();
    const got = rows.filter((r) => r.ok).length;

    for (const r of rows) {
      const el = this.root.querySelector(`[data-job="${r.id}"]`);
      el.classList.toggle('pass', this._moved && r.ok);
      el.classList.toggle('fail', this._moved && !r.ok);
      el.querySelector('.result').textContent = this._moved ? r.why : '';
      el.querySelectorAll('[data-pickfor]').forEach((b) => {
        b.setAttribute('aria-pressed', String(this.choice[r.id] === b.dataset.inst));
      });
    }

    const blurred = rows.some((r) => !r.ok && r.why.startsWith('A blur'));
    this._limits.innerHTML = `Light microscope: magnifies to <b>${this.mag}x</b>, separates down to `
      + `<b>${LIGHT_RESOLUTION} nm</b>, specimen survives. Electron microscope: separates down to `
      + `<b>${ELECTRON_RESOLUTION} nm</b>, specimen does not.`
      + (blurred && this.mag >= 1000 ? ' <span class="warn">Winding the magnification up is not making it clearer.</span>' : '');

    this._tally.textContent = this._moved ? `${got} of ${JOBS.length} observations` : `${JOBS.length} to go`;
    this._tally.className = `tally ${this._moved ? (got === JOBS.length ? 'ok' : 'no') : ''}`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const rows = this.audit();
    if (rows.every((r) => r.ok)) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    const killed = rows.filter((r) => !r.ok && r.why.startsWith('Beautifully')).length;
    const blurred = rows.filter((r) => !r.ok && r.why.startsWith('A blur')).length;
    const small = rows.filter((r) => !r.ok && r.why.startsWith('Too small')).length;

    let hint;
    if (killed && blurred) {
      hint = 'Both instruments are being asked to do something they cannot. Sort the five jobs by what '
        + 'each one actually demands: does it have to be alive, and how fine is the detail?';
    } else if (killed) {
      hint = `${killed} observation${killed > 1 ? 's are' : ' is'} of something moving, and an electron `
        + 'beam does not leave anything alive to move. Finer detail is no use if the thing has stopped.';
    } else if (blurred) {
      hint = `${blurred} observation${blurred > 1 ? 's need' : ' needs'} detail finer than light can `
        + 'separate. That limit is not a magnification setting - making the blur bigger just makes a '
        + 'bigger blur.';
    } else if (small) {
      hint = 'Right instruments, but the light microscope is turned down too low to make everything out. '
        + 'Magnification is not enough on its own, but you do still need some.';
    } else {
      hint = 'Close. One job is still on the wrong instrument.';
    }
    return { ok: false, hint };
  }
}
