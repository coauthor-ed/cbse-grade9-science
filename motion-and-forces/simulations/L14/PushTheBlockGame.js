import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * PushTheBlockGame - mini-game for les-14, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). Newton's second law: a = F / m. The student
 * has to pick the (F, m) pair that gives a target acceleration, given
 * multiple choices.
 *
 * Setup: target a = 4 m/s^2.
 *   correct pairs (F, m): (4, 1), (8, 2), (12, 3), (16, 4), (20, 5)
 *
 * The student sees 6 options, exactly one of which gives a = 4:
 *   (4, 1) -> 4
 *   (8, 2) -> 4
 *   (12, 3) -> 4
 *   (10, 2) -> 5  (wrong)
 *   (8, 4) -> 2  (wrong)
 *   (12, 2) -> 6  (wrong)
 *
 * The wrong attractor: students multiply F * m (= F applied over m
 * distance) instead of dividing. The lesson is divide, not multiply.
 *
 * Built on DomSimulation - multi-card choice with a result table on the
 * side is the documented content shape, and Quill drops in via
 * SimMascotDom.
 */

const W = 900;
const H = 600;

const TARGET_A = 4;
const OPTIONS = [
  { F: 4,  m: 1, right: true,  why: '4 N on 1 kg -> a = 4 / 1 = 4 m/s^2. Hit.' },
  { F: 8,  m: 2, right: true,  why: '8 N on 2 kg -> a = 8 / 2 = 4 m/s^2. Hit.' },
  { F: 12, m: 3, right: true,  why: '12 N on 3 kg -> a = 12 / 3 = 4 m/s^2. Hit.' },
  { F: 10, m: 2, right: false, why: '10 N on 2 kg -> a = 10 / 2 = 5 m/s^2. Too much.' },
  { F: 8,  m: 4, right: false, why: '8 N on 4 kg -> a = 8 / 4 = 2 m/s^2. Too little.' },
  { F: 12, m: 2, right: false, why: '12 N on 2 kg -> a = 12 / 2 = 6 m/s^2. Too much.' },
];

const CSS = `
.pb { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.pb .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.pb h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.pb h2 b { color: var(--sim-accent); }

.pb .target { padding: 14px 16px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 18px; }
.pb .target .kicker { margin: 0; }
.pb .target .v { font: 700 22px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.pb .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.pb .card { padding: 14px 16px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 12px; cursor: pointer; transition: border-color 140ms, transform 140ms; }
.pb .card:hover { border-color: var(--sim-accent); transform: translateY(-2px); }
.pb .card[data-picked="1"] { border-color: var(--sim-accent); background: var(--sim-accent); color: var(--sim-bg-deep); }
.pb .card[data-good="1"] { border-color: var(--sim-good); background: var(--sim-good); color: var(--sim-bg-deep); }
.pb .card[data-bad="1"]  { border-color: var(--sim-bad);  background: var(--sim-bad);  color: var(--sim-bg-deep); }
.pb .card p { margin: 0; font: 700 16px var(--sim-font, system-ui); text-align: center; }

.pb .why { padding: 14px 16px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; margin-top: 14px; min-height: 60px; }
.pb .why p { margin: 0; font: 600 14px var(--sim-font, system-ui); }
.pb .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class PushTheBlockGame extends withChallenge(DomSimulation) {
  static simId = 'push-the-block-game';
  static label = { en: 'Push the Block' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'Pick the F and m pair that gives an acceleration of 4 m/s^2.';
  static OBJECTIVE = {
    prompt: {
      en: 'Newton: a = F / m. Pick the (force, mass) pair that gives an acceleration of EXACTLY 4 m/s^2.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.picked = null;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="pb">
        <p class="kicker">Newton's second law</p>
        <h2>Pick the (F, m) pair that gives a = <b>4 m/s&sup2;</b>.</h2>
        <div class="target">
          <p class="kicker">Target acceleration</p>
          <span class="v">4 m/s&sup2;</span>
        </div>
        <div class="grid">
          ${OPTIONS.map((o, i) => `
            <button type="button" class="card" data-idx="${i}" data-picked="0">
              <p>F = <b>${o.F} N</b>, m = <b>${o.m} kg</b></p>
            </button>
          `).join('')}
        </div>
        <div class="why" id="pb-why">
          <p>Pick the pair that gives a = 4 m/s^2.</p>
        </div>
        <p class="foot">a = F / m. The force is on top, the mass is below. Divide, do not multiply.</p>
      </div>
    `);

    this._why = this.root.querySelector('#pb-why');
    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => {
        this.picked = Number(el.dataset.idx);
        this._render();
      });
    });

    this.quill.speak('Six pairs. Find one where F divided by m lands on four.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _render() {
    this.root.querySelectorAll('.card').forEach((el) => {
      el.dataset.picked = (this.picked !== null && Number(el.dataset.idx) === this.picked) ? '1' : '0';
    });
  }

  checkObjective() {
    if (this.picked === null) return null;
    const o = OPTIONS[this.picked];
    if (o.right) {
      this.quill?.perform('hop');
      this.root.querySelectorAll('.card').forEach((el) => {
        el.dataset.good = (OPTIONS[Number(el.dataset.idx)].right) ? '1' : '0';
      });
      this._why.innerHTML = `<p><b>Right.</b> ${o.why} (4/1, 8/2, 12/3, 16/4, 20/5 all work.)</p>`;
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    this.root.querySelectorAll('.card').forEach((el) => {
      el.dataset.good = (OPTIONS[Number(el.dataset.idx)].right) ? '1' : '0';
      if (Number(el.dataset.idx) === this.picked) el.dataset.bad = '1';
    });
    this._why.innerHTML = `<p><b>${o.why}</b> The right ones are highlighted.</p>`;
    return { ok: false, hint: o.why };
  }
}
