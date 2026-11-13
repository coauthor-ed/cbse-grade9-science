import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SinkOrFloatGame - mini-game for les-12, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). A block of material of a given density is
 * placed in a fluid of a given density. The student has to predict
 * whether the block SINKS or FLOATS. The rule: object density vs fluid
 * density. Sinks if rho_object > rho_fluid. Floats otherwise.
 *
 * Setup: the student sees 4 cards, each a (object, fluid) pair:
 *   iron block (7800) in water (1000)     -> SINKS
 *   wood block (600)  in water (1000)     -> FLOATS
 *   iron block (7800) in mercury (13600)  -> FLOATS
 *   air balloon (1.2) in air (1.2)        -> HOVER (treated as floats)
 *
 * The student sorts each card into "Sinks" or "Floats". The wrong
 * attractor: "iron always sinks" (it floats in mercury). The lesson's
 * whole point: compare densities, not materials.
 *
 * Built on DomSimulation - two-bin sorter is the documented content
 * shape, and Quill drops in via SimMascotDom.
 */

const W = 900;
const H = 600;

const CARDS = [
  { key: 'iron-water',  obj: 'Iron block',  objD: 7800,  fluid: 'water',   fluidD: 1000,  sinks: true  },
  { key: 'wood-water',  obj: 'Wood block',  objD: 600,   fluid: 'water',   fluidD: 1000,  sinks: false },
  { key: 'iron-hg',     obj: 'Iron block',  objD: 7800,  fluid: 'mercury', fluidD: 13600, sinks: false },
  { key: 'balloon-air', obj: 'Air balloon', objD: 1.2,   fluid: 'air',     fluidD: 1.2,   sinks: false },
];

const CSS = `
.sf { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.sf .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.sf h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.sf h2 b { color: var(--sim-accent); }

.sf .shelf { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; margin-bottom: 16px; min-height: 64px; }
.sf .shelf .empty { color: var(--sim-label-muted); font: 600 14px var(--sim-font, system-ui); }
.sf .bins { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sf .bin { padding: 14px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 14px; min-height: 200px; }
.sf .bin h3 { font: 700 18px var(--sim-font-display, system-ui); margin: 0 0 10px; }
.sf .bin h3 b { color: var(--sim-accent); }
.sf .bin.down h3 b { color: var(--sim-bad); }
.sf .slot { display: flex; flex-wrap: wrap; gap: 8px; }
.sf .card-btn { padding: 10px 14px; border: 2px solid var(--sim-border); background: var(--sim-bg-surface); color: var(--sim-label); border-radius: 10px; font: 700 14px var(--sim-font, system-ui); cursor: pointer; }
.sf .card-btn:hover { border-color: var(--sim-accent); }
.sf .card-btn[data-good="1"] { background: var(--sim-good); color: var(--sim-bg-deep); border-color: var(--sim-good); }
.sf .card-btn[data-bad="1"]  { background: var(--sim-bad);  color: var(--sim-bg-deep); border-color: var(--sim-bad); }

.sf .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class SinkOrFloatGame extends withChallenge(DomSimulation) {
  static simId = 'sink-or-float-game';
  static label = { en: 'Sink or Float' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'Four cards. Sort each into Sinks or Floats based on density.';
  static OBJECTIVE = {
    prompt: {
      en: 'An object sinks if its density is GREATER than the fluid around it. Sort the four cards.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.binOf = {};
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="sf">
        <p class="kicker">Buoyancy vs weight</p>
        <h2>An object <b>sinks</b> when its density is bigger than the fluid. Sort the four cards.</h2>
        <div class="shelf" id="sf-shelf">
          <span class="empty">Cards you have not sorted yet:</span>
        </div>
        <div class="bins">
          <div class="bin down">
            <h3>Sinks <b>(rho &gt; rho_fluid)</b></h3>
            <div class="slot" data-bin="sink"></div>
          </div>
          <div class="bin">
            <h3>Floats <b>(rho &le; rho_fluid)</b></h3>
            <div class="slot" data-bin="float"></div>
          </div>
        </div>
        <p class="foot">Compare densities, not the material name. Iron sinks in water but floats in mercury.</p>
      </div>
    `);

    this._shelf = this.root.querySelector('#sf-shelf');
    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Densities are on the back of the cards. The bigger one wins.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _put(key, bin) {
    this.binOf[key] = bin;
    this._render();
  }

  _render() {
    const onShelf = CARDS.filter((c) => !this.binOf[c.key]);
    this._shelf.innerHTML = onShelf.length
      ? onShelf.map((c) => `
          <button class="card-btn" data-key="${c.key}" data-bin="sink">Sinks: <b>${c.obj} in ${c.fluid}</b> (${c.objD} vs ${c.fluidD})</button>
          <button class="card-btn" data-key="${c.key}" data-bin="float">Floats: <b>${c.obj} in ${c.fluid}</b> (${c.objD} vs ${c.fluidD})</button>
        `).join('')
      : '<span class="empty">All sorted. Look at the result.</span>';

    ['sink', 'float'].forEach((bin) => {
      const slot = this.root.querySelector(`[data-bin="${bin}"]`);
      slot.innerHTML = '';
      CARDS.filter((c) => this.binOf[c.key] === bin).forEach((c) => {
        const b = document.createElement('button');
        b.className = 'card-btn';
        b.dataset.key = c.key;
        b.innerHTML = `${c.obj} in ${c.fluid} <span style="opacity:0.7">x</span>`;
        b.dataset.good = '0';
        b.dataset.bad = '0';
        b.addEventListener('click', () => this._put(c.key, null));
        slot.appendChild(b);
      });
    });

    this._shelf.querySelectorAll('button.card-btn').forEach((b) => {
      b.addEventListener('click', () => this._put(b.dataset.key, b.dataset.bin));
    });
  }

  checkObjective() {
    const sorted = Object.keys(this.binOf).length;
    if (sorted === 0) return null;
    if (sorted < CARDS.length) {
      this.quill?.setExpression('surprised');
      return { ok: false, hint: `Sort all 4 cards first. ${CARDS.length - sorted} still on the shelf.` };
    }
    const wrong = [];
    for (const c of CARDS) {
      const got = this.binOf[c.key];
      const want = c.sinks ? 'sink' : 'float';
      const good = got === want;
      const btn = this.root.querySelector(`.bin [data-key="${c.key}"]`);
      if (btn) {
        btn.dataset.good = good ? '1' : '0';
        btn.dataset.bad  = good ? '0' : '1';
      }
      if (!good) wrong.push(`${c.obj} in ${c.fluid}`);
    }
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    return { ok: false, hint: `Recheck: ${wrong.join('; ')}.` };
  }
}
