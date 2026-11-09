import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * HoldTheTeamTogetherGame - mini-game for les-02, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). blk-l02-s04 prints a three-row table - no
 * boundary, solid box, flexible boundary - scored against "keeps molecules
 * together" and "allows exchange", and asks the student which they would
 * choose. Read, the answer is the row with two ticks. Played, each losing row
 * has to actually lose, for its own reason:
 *
 *   no boundary   the molecules drift off and the chemistry never starts
 *   solid shell   they stay, react in a burst, then stop - nothing gets in
 *   too loose     they stay, but too spread out to meet often enough
 *
 * Only a flexible boundary drawn tight enough sustains a whole day, which is
 * blk-l02-s03's requirement stated as a win condition rather than a bullet
 * list. Both dimensions are load-bearing: the default size loses even with the
 * right boundary chosen, so picking "flexible" is not by itself the answer.
 *
 * Deterministic - a day is 12 ticks of closed-form arithmetic, no rAF - so the
 * same inputs always give the same verdict and the game can be probed
 * headlessly (tools/probe-games.mjs).
 */

const W = 900;
const H = 600;

const TICKS = 12;
const START_STORE = 6;
const MAX_STORE = 12;
/** Molecules that manage to meet per tick when packed as tight as it gets. */
const MEET_MAX = 3;
/** Radius at which meeting is still certain; past it, crowding falls off. */
const TIGHT_R = 90;
const INTAKE = 3;
const TARGET = 24;

const CX = 330;
const CY = 300;

/** 12 useful molecules, three kinds, on a fixed spiral so a render is stable. */
const KINDS = ['fuel', 'builder', 'helper'];
const MOLECULES = Array.from({ length: 12 }, (_, i) => ({
  kind: KINDS[i % 3],
  // Golden-angle spiral: even coverage at any radius, no random seed needed.
  a: i * 2.399963,
  t: Math.sqrt((i + 0.5) / 12),
}));

const CSS = `
.htt { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.htt .ocean {
  position: absolute; left: 30px; top: 60px; width: 600px; height: 480px;
  border-radius: 24px; background: var(--sim-water); opacity: 0.18;
}
.htt .oceanlabel {
  position: absolute; left: 44px; top: 34px; font-size: 12px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}

.htt .boundary {
  position: absolute; border-radius: 50%;
  transition: width 240ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), height 240ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)),
              left 240ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), top 240ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}
.htt .boundary.none { border: 3px dashed var(--sim-label-muted); opacity: 0.35; }
.htt .boundary.solid { border: 7px solid var(--sim-cell-wall); }
.htt .boundary.flexible { border: 4px solid var(--sim-membrane); box-shadow: 0 0 18px var(--sim-membrane-glow); }

.htt .mol {
  position: absolute; width: 18px; height: 18px; border-radius: 50%;
  margin: -9px 0 0 -9px; border: 2px solid var(--sim-bg-deep);
  transition: left 300ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), top 300ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), opacity 300ms;
}
.htt .mol.fuel { background: var(--sim-nutrient); }
.htt .mol.builder { background: var(--sim-protein); }
.htt .mol.helper { background: var(--sim-atp); }
.htt .mol.gone { opacity: 0.12; }

.htt .panel {
  position: absolute; right: 34px; top: 60px; width: 214px;
  background: var(--sim-bg-surface); border: 3px solid var(--sim-border);
  border-radius: 18px; padding: 14px 16px; box-sizing: border-box;
}
.htt .panel h4 {
  margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.htt .big { font-family: var(--sim-font-display); font-size: 34px; line-height: 1; }
.htt .big.ok { color: var(--sim-good); }
.htt .big.no { color: var(--sim-bad); }
.htt .panel p { margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: var(--sim-label-muted); }

.htt .day { position: absolute; right: 34px; top: 258px; width: 214px; }
.htt .day h4 {
  margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.htt .bars { display: flex; align-items: flex-end; gap: 4px; height: 76px; }
.htt .bar { flex: 1; background: var(--sim-track); border-radius: 3px 3px 0 0; min-height: 3px; }
.htt .bar.live { background: var(--sim-accent); }
.htt .daynote { margin: 6px 0 0; font-size: 11px; color: var(--sim-label-muted); }

.htt .hintline {
  position: absolute; left: 34px; right: 300px; bottom: 20px;
  margin: 0; font-size: 14px; line-height: 1.5; color: var(--sim-label-muted);
}
.htt .hintline b { color: var(--sim-accent); }
`;

export class HoldTheTeamTogetherGame extends withChallenge(DomSimulation) {
  static simId = 'hold-the-team-together-game';
  static label = { en: 'Hold the Team Together' };
  static category = 'biology.cells';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Twelve useful molecules in the ancient ocean. Choose a boundary - none, a solid shell, or a '
    + 'flexible membrane - and set how tightly it is drawn, then see how much chemistry survives a whole day.';

  static OBJECTIVE = {
    prompt: {
      en: 'Keep the chemistry running for a whole day. You need at least '
        + `${TARGET} reactions, and they have to still be happening at the end.`,
    },
  };
  static SCORING = { mode: 'accuracy' };

  static CONTROLS = [
    {
      type: 'select',
      id: 'boundary',
      label: 'Boundary',
      options: [
        { value: 'none', label: 'No boundary' },
        { value: 'solid', label: 'Solid shell' },
        { value: 'flexible', label: 'Flexible membrane' },
      ],
    },
    { type: 'slider', id: 'radius', label: 'Drawn at', min: 40, max: 220, step: 5, value: 170, suffix: ' px' },
  ];

  constructor(container, config) {
    super(container, config);
    this.boundary = 'none';
    this.radius = 170;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="htt">
        <p class="oceanlabel">The ancient ocean</p>
        <div class="ocean"></div>
        <div class="boundary"></div>
        ${MOLECULES.map((m, i) => `<div class="mol ${m.kind}" data-mol="${i}"></div>`).join('')}
        <div class="panel">
          <h4>Reactions today</h4>
          <div class="big">0</div>
          <p class="verdict"></p>
        </div>
        <div class="day">
          <h4>Through the day</h4>
          <div class="bars">${Array.from({ length: TICKS }, () => '<div class="bar"></div>').join('')}</div>
          <p class="daynote">dawn to dusk</p>
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._boundaryEl = this.root.querySelector('.boundary');
    this._molEls = Array.from(this.root.querySelectorAll('.mol'));
    this._bigEl = this.root.querySelector('.big');
    this._verdictEl = this.root.querySelector('.verdict');
    this._barEls = Array.from(this.root.querySelectorAll('.bar'));
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 790, y: 548, height: 122, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Three boundaries on offer. Only one of them gets you to dusk.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id === 'boundary') this.boundary = String(value);
    else if (id === 'radius') this.radius = Number(value);
    else return;
    this._moved = true;
    this._render();
  }

  /**
   * One day, twelve ticks. Molecules only react when they are both together
   * (inside a boundary) and close enough to meet; a solid shell keeps them
   * together but lets nothing new in, so its store runs down and stops.
   * @returns {{total:number, log:number[], sustained:boolean}}
   */
  simulateDay() {
    const meet = Math.min(1, (TIGHT_R * TIGHT_R) / (this.radius * this.radius));
    const intake = this.boundary === 'flexible' ? INTAKE : 0;
    let store = START_STORE;
    let total = 0;
    const log = [];

    for (let t = 0; t < TICKS; t += 1) {
      if (this.boundary === 'none') { log.push(0); continue; }
      store = Math.min(MAX_STORE, store + intake);
      const runs = Math.min(MEET_MAX * meet, store);
      store -= runs;
      total += runs;
      log.push(runs);
    }
    // "Still happening at the end" - a burst that dies before dusk is the
    // solid shell's whole failure, and a total alone would hide it.
    const sustained = log.slice(-3).every((r) => r > 0.5);
    return { total, log, sustained };
  }

  _render() {
    const { total, log, sustained } = this.simulateDay();
    const r = this.radius;

    this._boundaryEl.className = `boundary ${this.boundary}`;
    this._boundaryEl.style.left = `${CX - r}px`;
    this._boundaryEl.style.top = `${CY - r}px`;
    this._boundaryEl.style.width = `${r * 2}px`;
    this._boundaryEl.style.height = `${r * 2}px`;

    // With no boundary the molecules scatter past the edge of the water.
    this._molEls.forEach((el, i) => {
      const m = MOLECULES[i];
      const spread = this.boundary === 'none' ? 300 : r * 0.82;
      el.style.left = `${CX + Math.cos(m.a) * spread * m.t}px`;
      el.style.top = `${CY + Math.sin(m.a) * spread * m.t}px`;
      el.classList.toggle('gone', this.boundary === 'none');
    });

    const won = total >= TARGET && sustained;
    this._bigEl.textContent = total.toFixed(0);
    this._bigEl.className = `big ${this._moved ? (won ? 'ok' : 'no') : ''}`;
    this._verdictEl.textContent = !this._moved ? `Target: ${TARGET}, still running at dusk.`
      : won ? 'Sustained all day.'
      : sustained ? `Still going, but only ${total.toFixed(0)} of ${TARGET}.`
      : 'Stopped before dusk.';

    const peak = Math.max(MEET_MAX, ...log);
    this._barEls.forEach((el, t) => {
      el.style.height = `${Math.max(3, (log[t] / peak) * 76)}px`;
      el.classList.toggle('live', log[t] > 0.5);
    });

    this._hint.innerHTML = 'Molecules react only when they are <b>held together</b> '
      + 'and the boundary still <b>lets the ocean in</b>.';
  }

  checkObjective() {
    if (!this._moved) return null;
    const { total, sustained } = this.simulateDay();

    if (total >= TARGET && sustained) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    let hint;
    if (this.boundary === 'none') {
      hint = 'Nothing reacted at all. The molecules were never the problem - they drifted apart '
        + 'before they could meet. That is the whole reason a boundary is worth having.';
    } else if (this.boundary === 'solid') {
      hint = 'It started well and then stopped. A sealed shell holds the molecules together but '
        + 'nothing new can get in, so the chemistry runs until the store is gone. A boundary that '
        + 'isolates completely is not much better than no boundary at all.';
    } else {
      hint = 'The right boundary, drawn too wide. The molecules are all still inside - they just '
        + 'rarely meet. Holding them together means holding them CLOSE.';
    }
    return { ok: false, hint };
  }
}
