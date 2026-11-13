import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * FormulaPickerGame - mini-game for les-07, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The four kinematic equations are not all equally
 * useful in every problem. Given u, a, t and asked to find displacement s,
 * the right pick is:
 *   s = u*t + (1/2)*a*t^2
 * because the other three ask for v, v^2, or a quantity that is not asked.
 * The wrong attractors:
 *   v = u + a*t           (gives v, not s - common mix-up)
 *   v^2 = u^2 + 2as       (asks for v, not s)
 *   s = (u+v)/2 * t       (needs v, which we do not have)
 *
 * Setup: u = 5 m/s, a = 2 m/s^2, t = 4 s.
 *   correct: s = 5*4 + 0.5*2*16 = 20 + 16 = 36 m
 *
 * The student is shown u, a, t and asked for s. They have to pick the
 * equation that goes straight to s in one step. After choosing, the
 * equation is highlighted and the right answer is computed and shown -
 * the student can compare to confirm.
 *
 * Built on DomSimulation because the content shape is a multi-card
 * choice with a side panel of the equation expansion, and Quill drops in
 * through SimMascotDom.
 */

const W = 900;
const H = 600;

// Problem setup. u, a, t given; s = u*t + 0.5*a*t^2 = 5*4 + 0.5*2*16 = 36 m.
const U = 5;
const A = 2;
const T = 4;
const S = U * T + 0.5 * A * T * T; // 36 m

const FORMULAS = [
  {
    key: 'vt',
    label: 'v = u + a * t',
    expand: 'gives v = 5 + 2*4 = 13 m/s',
    gives: 'velocity',
    right: false,
    why: 'This equation gives v, not s. The question asks for s.',
  },
  {
    key: 's',
    label: 's = u * t + (1/2) * a * t^2',
    expand: 'gives s = 5*4 + 0.5*2*16 = 36 m',
    gives: 'displacement',
    right: true,
    why: 'Direct hit: s on the left, u, a, t on the right. Plug in and you are done.',
  },
  {
    key: 'v2',
    label: 'v^2 = u^2 + 2 * a * s',
    expand: 'solving for s here: 13^2 = 25 + 4*s, so s = (169-25)/4 = 36 m',
    gives: 'velocity squared',
    right: false,
    why: 'You do not know v yet. Using this means you have to solve a second equation to get v first.',
  },
  {
    key: 's2',
    label: 's = (u + v) / 2 * t',
    expand: 'needs v, which the problem does not give',
    gives: 'displacement (using v)',
    right: false,
    why: 'You do not know v. Compute v first with v = u + a*t, then come back - two steps.',
  },
];

const CSS = `
.fp { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.fp .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.fp h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.fp h2 b { color: var(--sim-accent); }

.fp .given { display: flex; gap: 18px; flex-wrap: wrap; padding: 14px 16px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; margin-bottom: 16px; }
.fp .given .chip { font: 700 16px var(--sim-font, system-ui); }
.fp .given .chip b { color: var(--sim-accent); margin-left: 6px; }
.fp .ask { font: 700 18px var(--sim-font, system-ui); margin: 0 0 14px; }
.fp .ask b { color: var(--sim-accent); }

.fp .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
.fp .card { padding: 16px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 14px; cursor: pointer; transition: border-color 140ms, transform 140ms; }
.fp .card:hover { border-color: var(--sim-accent); transform: translateY(-2px); }
.fp .card[data-picked="1"] { border-color: var(--sim-accent); background: var(--sim-accent); color: var(--sim-bg-deep); }
.fp .card[data-good="1"] { border-color: var(--sim-good); background: var(--sim-good); color: var(--sim-bg-deep); }
.fp .card[data-bad="1"]  { border-color: var(--sim-bad);  background: var(--sim-bad);  color: var(--sim-bg-deep); }
.fp .eq { font: 700 18px var(--sim-font-display, system-ui); margin-bottom: 6px; }
.fp .exp { font: 600 13px var(--sim-font, system-ui); opacity: 0.85; }

.fp .why { padding: 14px 16px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; min-height: 60px; }
.fp .why b { color: var(--sim-accent); }
.fp .why p { margin: 0; font: 600 14px var(--sim-font, system-ui); }
.fp .answerline { font: 700 22px var(--sim-font-display, system-ui); color: var(--sim-good); margin-top: 8px; }
`;

export class FormulaPickerGame extends withChallenge(DomSimulation) {
  static simId = 'formula-picker-game';
  static label = { en: 'Pick the Right Formula' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A kinematics problem. Pick the equation that solves for displacement s in one step.';
  static OBJECTIVE = {
    prompt: {
      en: 'A car starts at 5 m/s and accelerates at 2 m/s^2 for 4 s. Pick the kinematic equation that gives the displacement s in a SINGLE step.',
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
      <div class="fp">
        <p class="kicker">Strategy: which equation solves s in one step?</p>
        <h2>You have <b>u</b>, <b>a</b>, <b>t</b>. You need <b>s</b>.</h2>
        <div class="given">
          <span class="chip">u = <b>${U} m/s</b></span>
          <span class="chip">a = <b>${A} m/s&sup2;</b></span>
          <span class="chip">t = <b>${T} s</b></span>
        </div>
        <p class="ask">Find <b>s</b> in one step. Which equation do you use?</p>
        <div class="grid">
          ${FORMULAS.map((f) => `
            <button type="button" class="card" data-key="${f.key}" data-picked="0">
              <div class="eq">${f.label}</div>
              <div class="exp">${f.expand}</div>
            </button>
          `).join('')}
        </div>
        <div class="why" id="fp-why">
          <p>Pick the equation that solves s in one step.</p>
        </div>
      </div>
    `);

    this.quill = SimMascotDom.mount(this.root, { x: 760, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._why = this.root.querySelector('#fp-why');
    this.root.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => {
        this.picked = el.dataset.key;
        this._render();
      });
    });

    this.quill.speak('Four equations. Only one solves s with what you already know.', 5400);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _render() {
    this.root.querySelectorAll('.card').forEach((el) => {
      el.dataset.picked = (this.picked && el.dataset.key === this.picked) ? '1' : '0';
    });
  }

  checkObjective() {
    if (!this.picked) return null;
    const f = FORMULAS.find((x) => x.key === this.picked);
    if (f.right) {
      this.quill?.perform('hop');
      this.root.querySelectorAll('.card').forEach((el) => {
        if (el.dataset.key === this.picked) el.dataset.good = '1';
      });
      this._why.innerHTML = `<p><b>Right.</b> ${f.why}</p><div class="answerline">s = ${S} m</div>`;
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    this.root.querySelectorAll('.card').forEach((el) => {
      if (el.dataset.key === this.picked) el.dataset.bad = '1';
      const fx = FORMULAS.find((x) => x.key === el.dataset.key);
      if (fx && fx.right) el.dataset.good = '1';
    });
    this._why.innerHTML = `<p><b>${f.why}</b> The right one is highlighted.</p>`;
    return { ok: false, hint: f.why };
  }
}
