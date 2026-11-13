import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * PulleyMAGame - mini-game for les-18, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). A movable pulley gives a mechanical advantage
 * of 2: the load is split between two rope segments, so the effort is
 * half the load. A fixed pulley only changes direction (MA = 1).
 *
 *   Fixed pulley alone:      MA = 1
 *   Movable pulley alone:    MA = 2
 *   Movable + fixed (block & tackle, 2 rope segments to load):
 *                           MA = 2 (load still has 2 supporting segments)
 *   Block & tackle with 4 supporting rope segments:
 *                           MA = 4
 *
 * The student is given three loads and three pulley setups. They have
 * to type the effort (F = Load / MA) for each. The lesson's point:
 * count the rope segments supporting the load; that count is the MA.
 *
 * The wrong attractor: a fixed pulley alone does not help - effort =
 * load. Students type "effort = 1/2 load" for a fixed pulley because
 * they think "a pulley helps". A movable pulley DOES help; a fixed
 * pulley does not.
 *
 * Built on DomSimulation - three-row input table is the documented
 * content shape, and Quill drops in via SimMascotDom.
 */

const W = 900;
const H = 600;

const SCENES = [
  { key: 'fixed',     name: 'Fixed pulley alone',        ma: 1, load: 100, why: 'A fixed pulley only changes the direction of the pull. MA = 1. Effort = Load.' },
  { key: 'movable',   name: 'Movable pulley alone',      ma: 2, load: 100, why: 'The load is supported by 2 rope segments, so the effort is half the load. MA = 2.' },
  { key: 'tackle4',   name: 'Block & tackle (4 strands)', ma: 4, load: 200, why: 'The load is supported by 4 rope segments, so the effort is one quarter of the load. MA = 4.' },
];

const CSS = `
.pu { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.pu .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.pu h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.pu h2 b { color: var(--sim-accent); }

.pu .intro { padding: 12px 14px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; margin-bottom: 14px; font: 600 14px var(--sim-font, system-ui); }
.pu .intro b { color: var(--sim-accent); }

.pu .row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; align-items: center; gap: 12px; padding: 12px 14px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 12px; margin-bottom: 10px; }
.pu .row .lab { font: 700 15px var(--sim-font, system-ui); }
.pu .row .chip { font: 700 15px var(--sim-font, system-ui); color: var(--sim-label-muted); }
.pu .row .chip b { color: var(--sim-accent); }
.pu .row input { padding: 8px 10px; font: 700 16px var(--sim-font, system-ui); text-align: right; background: var(--sim-bg-surface); color: var(--sim-label); border: 2px solid var(--sim-border); border-radius: 8px; }
.pu .row[data-good="1"] { border-color: var(--sim-good); }
.pu .row[data-bad="1"]  { border-color: var(--sim-bad); }

.pu .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class PulleyMAGame extends withChallenge(DomSimulation) {
  static simId = 'pulley-ma-game';
  static label = { en: 'Pulley Effort' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'Three pulley setups. For each, type the effort (force) needed to lift the load.';
  static OBJECTIVE = {
    prompt: {
      en: 'Type the EFFORT (force) needed to lift each load. Effort = Load / MA, where MA is the number of rope segments supporting the load.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.values = { fixed: null, movable: null, tackle4: null };
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="pu">
        <p class="kicker">Movable pulleys and mechanical advantage</p>
        <h2>Type the <b>effort</b> (force you pull with) for each setup.</h2>
        <div class="intro">Rule: <b>Effort = Load / MA</b>. Count the rope segments supporting the load; that count is the MA.</div>
        <div class="row" data-key="fixed">
          <span class="lab">${SCENES[0].name}</span>
          <span class="chip">Load <b>${SCENES[0].load} N</b></span>
          <span class="chip">MA <b>${SCENES[0].ma}</b></span>
          <input type="number" step="1" min="0" data-key="fixed" aria-label="Effort for fixed pulley" placeholder="N">
        </div>
        <div class="row" data-key="movable">
          <span class="lab">${SCENES[1].name}</span>
          <span class="chip">Load <b>${SCENES[1].load} N</b></span>
          <span class="chip">MA <b>${SCENES[1].ma}</b></span>
          <input type="number" step="1" min="0" data-key="movable" aria-label="Effort for movable pulley" placeholder="N">
        </div>
        <div class="row" data-key="tackle4">
          <span class="lab">${SCENES[2].name}</span>
          <span class="chip">Load <b>${SCENES[2].load} N</b></span>
          <span class="chip">MA <b>${SCENES[2].ma}</b></span>
          <input type="number" step="1" min="0" data-key="tackle4" aria-label="Effort for block and tackle" placeholder="N">
        </div>
        <p class="foot">A fixed pulley only changes direction. A movable pulley (or any block & tackle) gains MA by adding more supporting rope segments.</p>
      </div>
    `);

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        this.values[inp.dataset.key] = Number(inp.value);
        this._moved = true;
      });
    });

    this.quill.speak('Three setups. Effort is load divided by MA. The MA is the number of rope strands sharing the load.', 5600);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  checkObjective() {
    if (!this._moved) return null;
    const empties = Object.entries(this.values).filter(([, v]) => v === null || isNaN(v));
    if (empties.length) {
      this.quill?.setExpression('surprised');
      return { ok: false, hint: `Type the effort for all three setups. ${empties.length} still empty.` };
    }
    const wrong = [];
    for (const s of SCENES) {
      const v = this.values[s.key];
      const want = s.load / s.ma;
      const row = this.root.querySelector(`[data-key="${s.key}"]`);
      if (Math.abs(v - want) <= 1) row.dataset.good = '1';
      else { row.dataset.bad = '1'; wrong.push(s.name); }
    }
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const fix = wrong.find((n) => n.includes('Fixed'));
    return { ok: false, hint: fix
      ? 'A fixed pulley alone does not change the effort. MA = 1, so effort = load. It only changes direction.'
      : 'Effort = Load / MA. Count the rope segments supporting the load - that is the MA.' };
  }
}
