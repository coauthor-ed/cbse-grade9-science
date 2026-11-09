import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SealOrBreatheGame - mini-game for les-06, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). Slide blk-l06-s3 states the conflict outright: the
 * same surface has to cut water loss AND let carbon dioxide in. The game runs
 * a leaf through six stretches of one day and asks for a surface that survives
 * all of them.
 *
 * The load-bearing property is that NO FIXED SURFACE CAN WIN. Sealed collects
 * no carbon dioxide at all; permanently open loses far too much water in the
 * dry stretches. Only the adjustable surface can pass, and only when its
 * closing threshold sits between the humid air it should stay open in and the
 * dry air it should shut for. So the answer is not a setting - it is the fact
 * that stomata respond, which is the slide's actual claim.
 */

const W = 900;
const H = 600;

/** One day: humidity in percent, and whether there is light to photosynthesise by. */
const DAY = [
  { name: 'Dawn',      humidity: 80, light: true },
  { name: 'Mid-morn',  humidity: 55, light: true },
  { name: 'Noon',      humidity: 20, light: true },
  { name: 'Afternoon', humidity: 15, light: true },
  { name: 'Evening',   humidity: 45, light: true },
  { name: 'Night',     humidity: 70, light: false },
];

const CO2_PER_OPEN_LIT_PHASE = 10;
const CO2_NEEDED = 30;
const WATER_BUDGET = 12;

const CSS = `
.sob { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.sob .leaf {
  position: absolute; left: 46px; top: 60px; width: 380px; height: 300px;
  background: var(--sim-bg-surface);
  border: 3px solid var(--sim-border);
  border-radius: 62% 38% 55% 45% / 55% 52% 48% 45%;
  display: flex; align-items: center; justify-content: center; gap: 22px;
}
.sob .pore { width: 54px; height: 76px; position: relative; }
.sob .pore i {
  position: absolute; top: 0; width: 22px; height: 76px; border-radius: 60% / 50%;
  background: var(--sim-series-4); border: 2px solid var(--sim-bg-deep); box-sizing: border-box;
  transition: transform var(--motion-base, 240ms) var(--ease-settle, ease);
}
.sob .pore i.l { left: 4px; }
.sob .pore i.r { right: 4px; }
.sob .pore.open i.l { transform: translateX(-7px); }
.sob .pore.open i.r { transform: translateX(7px); }
.sob .leaflabel {
  position: absolute; left: 46px; top: 28px; width: 380px; text-align: center;
  font-size: 13px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.sob .porestate {
  position: absolute; left: 46px; top: 372px; width: 380px; text-align: center;
  font-size: 15px; color: var(--sim-label-muted);
}

.sob .day { position: absolute; left: 46px; top: 410px; width: 380px; display: flex; gap: 6px; }
.sob .ph {
  flex: 1; border-radius: 10px; padding: 7px 4px; text-align: center;
  border: 2px solid var(--sim-border); background: var(--sim-bg-surface); font-size: 11px;
}
.sob .ph.open { border-color: var(--sim-good); }
.sob .ph .h { display: block; font-weight: 800; font-size: 13px; }
.sob .ph .n { color: var(--sim-label-muted); }

.sob .panel {
  position: absolute; left: 470px; top: 46px; width: 386px;
  background: var(--sim-panel); border: 2px solid var(--sim-border);
  border-radius: 18px; padding: 20px 22px; box-sizing: border-box;
}
.sob .kicker {
  font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--sim-label-muted); margin: 0 0 14px;
}
.sob .gauge { margin-bottom: 18px; }
.sob .gauge .top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.sob .gauge .lab { font-size: 15px; }
.sob .gauge .val { font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums; }
.sob .bar { height: 14px; border-radius: 999px; background: var(--sim-track); overflow: hidden; border: 1px solid var(--sim-border); }
.sob .bar i { display: block; height: 100%; background: var(--sim-bad); transition: width var(--motion-base, 240ms) ease; }
.sob .gauge.ok .bar i { background: var(--sim-good); }
.sob .gauge.ok .val { color: var(--sim-good); }
.sob .gauge:not(.ok) .val { color: var(--sim-bad); }
.sob .need { font-size: 13px; color: var(--sim-label-muted); margin-top: 5px; display: block; }

.sob .hintline {
  position: absolute; left: 470px; top: 340px; width: 386px;
  font-size: 14px; line-height: 1.55; color: var(--sim-label-muted); margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sob .pore i, .sob .bar i { transition: none; }
}
`;

export class SealOrBreatheGame extends withChallenge(DomSimulation) {
  static simId = 'seal-or-breathe-game';
  static label = { en: 'Seal or Breathe' };
  static category = 'biology.tissues';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A leaf surface run through six stretches of one day. Choose the surface design, and if it '
    + 'is adjustable, the humidity below which the pores close. Two gauges show carbon dioxide '
    + 'collected and water lost.';

  static OBJECTIVE = {
    prompt: {
      en: 'Get this leaf through the whole day: collect enough carbon dioxide AND stay inside the water budget.',
    },
  };
  static SCORING = { mode: 'accuracy' };   // checkObjective returns {ok}, so tolerance is unused

  static CONTROLS = [
    { type: 'select', id: 'surface', label: 'Leaf surface:', value: 'sealed', options: [
      { value: 'sealed', label: 'Sealed - no openings at all' },
      { value: 'open', label: 'Permanently open pores' },
      { value: 'adjustable', label: 'Adjustable pores' },
    ] },
    { type: 'slider', id: 'threshold', label: 'In daylight, close the pores below humidity:', min: 0, max: 100, step: 5, value: 0, suffix: '%' },
  ];

  constructor(container, config) {
    super(container, config);
    this.surface = 'sealed';
    this.threshold = 0;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="sob">
        <p class="leaflabel">The leaf surface at noon</p>
        <div class="leaf">
          <div class="pore"><i class="l"></i><i class="r"></i></div>
          <div class="pore"><i class="l"></i><i class="r"></i></div>
          <div class="pore"><i class="l"></i><i class="r"></i></div>
        </div>
        <p class="porestate"></p>
        <div class="day">
          ${DAY.map((d) => `
            <div class="ph" data-ph="${d.name}">
              <span class="h">${d.humidity}%</span>
              <span class="n">${d.name}</span>
            </div>`).join('')}
        </div>
        <div class="panel">
          <p class="kicker">End of the day</p>
          <div class="gauge" data-g="co2">
            <div class="top"><span class="lab">Carbon dioxide collected</span><span class="val">0</span></div>
            <div class="bar"><i style="width:0%"></i></div>
            <span class="need">needs at least ${CO2_NEEDED}</span>
          </div>
          <div class="gauge" data-g="water">
            <div class="top"><span class="lab">Water lost</span><span class="val">0</span></div>
            <div class="bar"><i style="width:0%"></i></div>
            <span class="need">budget is ${WATER_BUDGET}</span>
          </div>
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._pores = Array.from(this.root.querySelectorAll('.pore'));
    this._phaseEls = Array.from(this.root.querySelectorAll('.ph'));
    this._poreState = this.root.querySelector('.porestate');
    this._co2 = this.root.querySelector('[data-g="co2"]');
    this._water = this.root.querySelector('[data-g="water"]');
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 640, y: 548, height: 128, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Seal it and it starves. Open it and it dries. Both, please.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  isControlHidden(id) {
    return id === 'threshold' && this.surface !== 'adjustable';
  }

  onControlChange(id, value) {
    if (id === 'surface') this.surface = String(value);
    else if (id === 'threshold') this.threshold = Number(value);
    else return;
    this._moved = true;
    this._render();
  }

  _isOpen(phase) {
    if (this.surface === 'sealed') return false;
    if (this.surface === 'open') return true;
    // Adjustable pores shut in the dark as well as in dry air: staying open at
    // night costs water and returns no carbon dioxide, so a humidity rule alone
    // never gets this leaf through the day.
    return phase.light && phase.humidity >= this.threshold;
  }

  /** @returns {{co2:number, water:number, opens:boolean[]}} */
  _runDay() {
    let co2 = 0;
    let water = 0;
    const opens = DAY.map((phase) => {
      const open = this._isOpen(phase);
      if (open) {
        water += (100 - phase.humidity) / 10;
        if (phase.light) co2 += CO2_PER_OPEN_LIT_PHASE;
      }
      return open;
    });
    return { co2, water: Math.round(water * 10) / 10, opens };
  }

  _render() {
    const { co2, water, opens } = this._runDay();
    const noonOpen = opens[2];

    this._pores.forEach((p) => p.classList.toggle('open', noonOpen));
    this._poreState.textContent = noonOpen
      ? 'At noon (20% humidity) the pores are open.'
      : 'At noon (20% humidity) the pores are shut.';

    this._phaseEls.forEach((el, i) => el.classList.toggle('open', opens[i]));

    const co2ok = co2 >= CO2_NEEDED;
    const waterok = water <= WATER_BUDGET;
    this._co2.classList.toggle('ok', co2ok);
    this._co2.querySelector('.val').textContent = String(co2);
    this._co2.querySelector('.bar i').style.width = `${Math.min(100, (co2 / 50) * 100)}%`;
    this._water.classList.toggle('ok', waterok);
    this._water.querySelector('.val').textContent = water.toFixed(1);
    this._water.querySelector('.bar i').style.width = `${Math.min(100, (water / 32) * 100)}%`;

    this._hint.textContent = `${opens.filter(Boolean).length} of ${DAY.length} stretches with the pores open.`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const { co2, water } = this._runDay();
    const co2ok = co2 >= CO2_NEEDED;
    const waterok = water <= WATER_BUDGET;

    if (co2ok && waterok) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    let hint;
    if (this.surface === 'sealed') {
      hint = 'Nothing got in. A perfect seal keeps the water and starves the leaf - the plastic-wrapped leaf from the slide.';
    } else if (this.surface === 'open') {
      hint = 'Plenty of carbon dioxide, far too little water left. Holes that never close cost you every dry stretch of the day.';
    } else if (!co2ok) {
      hint = 'The pores are shutting on air that was still humid enough to work in. Close later, not sooner.';
    } else {
      hint = 'Still open when the air is at its driest. Which stretches of the day are costing you the most water?';
    }
    return { ok: false, hint };
  }
}
