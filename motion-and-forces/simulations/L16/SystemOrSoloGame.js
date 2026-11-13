import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SystemOrSoloGame - mini-game for les-16, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). When two blocks A and B are connected by a
 * string and pushed by an external force F, there are two ways to set up
 * the problem: treat (A+B) as a system, or treat A and B separately.
 *
 *   As a system (A+B): mass = 2m, external force F -> a = F / 2m.
 *                       The string tension T is internal and cancels.
 *   Separately: T is the force on A from the string; a = (F - T) / m.
 *
 * The student has to choose, for each of three questions, which setup
 * (system or solo) makes the problem EASIER.
 *
 *   Q1. Find the acceleration of (A + B). -> system (treat as one body)
 *   Q2. Find the tension T in the string. -> solo (need both equations)
 *   Q3. Find the force A exerts on B. -> solo
 *
 * The wrong attractor: "always use the system setup because it is
 * simpler" - true for acceleration, false for tension. The lesson's
 * point: the internal forces cancel in the system view, so you cannot
 * read them off without going back to the solo view.
 *
 * Built on DomSimulation - tabbed multi-question picker is the
 * documented content shape, and Quill drops in via SimMascotDom.
 */

const W = 900;
const H = 600;

const QUESTIONS = [
  { q: 'Find the acceleration of (A + B) together',            right: 'system', hint: 'A and B move together with the same acceleration. Treat them as one body of mass 2m; tension cancels.' },
  { q: 'Find the tension T in the string',                    right: 'solo',   hint: 'Tension is an internal force. In the system view it cancels out - you cannot read it. Use the solo view of block A.' },
  { q: 'Find the force A exerts on B (through the string)',   right: 'solo',   hint: 'Same as tension - internal. Use the solo view of one block to back it out.' },
];

const CSS = `
.ss { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.ss .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.ss h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.ss h2 b { color: var(--sim-accent); }

.ss .scene { position: relative; width: 900px; height: 130px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; margin-bottom: 14px; }
.ss svg { display: block; width: 100%; height: 100%; }
.ss .floor { stroke: var(--sim-border); stroke-width: 3; }
.ss .block { fill: var(--sim-series-1); stroke: var(--sim-bg-deep); stroke-width: 2; }
.ss .string { stroke: var(--sim-label-muted); stroke-width: 2; }
.ss .farr { stroke: var(--sim-accent); stroke-width: 5; stroke-linecap: round; fill: none; }
.ss .farr-head { fill: var(--sim-accent); }

.ss .rows { display: grid; grid-template-columns: 1fr; gap: 10px; }
.ss .row { display: grid; grid-template-columns: 1.4fr 1fr 1fr; align-items: center; gap: 10px; padding: 12px 14px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 12px; }
.ss .row .q { font: 700 15px var(--sim-font, system-ui); }
.ss .row .pick { padding: 8px 12px; border: 2px solid var(--sim-border); background: var(--sim-bg-surface); color: var(--sim-label); border-radius: 10px; font: 700 14px var(--sim-font, system-ui); cursor: pointer; }
.ss .row .pick:hover { border-color: var(--sim-accent); }
.ss .row .pick[data-good="1"] { background: var(--sim-good); color: var(--sim-bg-deep); border-color: var(--sim-good); }
.ss .row .pick[data-bad="1"]  { background: var(--sim-bad);  color: var(--sim-bg-deep); border-color: var(--sim-bad); }
.ss .row .pick[data-picked="1"] { border-color: var(--sim-accent); }

.ss .why { padding: 12px 14px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 12px; margin-top: 14px; min-height: 50px; }
.ss .why p { margin: 0; font: 600 14px var(--sim-font, system-ui); }
.ss .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class SystemOrSoloGame extends withChallenge(DomSimulation) {
  static simId = 'system-or-solo-game';
  static label = { en: 'System or Solo?' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'Two blocks A and B on a string, pushed by F. For each question, pick the easier setup: system (A+B) or solo (one block).';
  static OBJECTIVE = {
    prompt: {
      en: 'Two blocks A and B (each mass m) are on a string, pushed by force F. For each question, pick the easier setup: SYSTEM (A+B together) or SOLO (one block).',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.picked = new Array(QUESTIONS.length).fill(null);
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="ss">
        <p class="kicker">Forces on a system</p>
        <h2>Two blocks, one string, force F. Pick the easier setup for each question.</h2>
        <div class="scene">
          <svg viewBox="0 0 900 130" aria-hidden="true">
            <line class="floor" x1="20" y1="100" x2="880" y2="100"/>
            <rect class="block" x="320" y="65" width="80" height="35"></rect>
            <text x="350" y="60" font-family="var(--sim-font, system-ui)" font-size="14" fill="var(--sim-label)" font-weight="700">A</text>
            <line class="string" x1="400" y1="80" x2="500" y2="80"></line>
            <rect class="block" x="500" y="65" width="80" height="35"></rect>
            <text x="530" y="60" font-family="var(--sim-font, system-ui)" font-size="14" fill="var(--sim-label)" font-weight="700">B</text>
            <line class="farr" x1="240" y1="80" x2="320" y2="80"></line>
            <polygon class="farr-head" points="320,80 304,74 304,86"></polygon>
            <text x="240" y="65" font-family="var(--sim-font, system-ui)" font-size="14" fill="var(--sim-accent)" font-weight="700">F</text>
          </svg>
        </div>
        <div class="rows">
          ${QUESTIONS.map((qq, i) => `
            <div class="row" data-i="${i}">
              <span class="q">${i + 1}. ${qq.q}</span>
              <button type="button" class="pick" data-i="${i}" data-pick="system" data-picked="${this.picked[i] === 'system' ? '1' : '0'}">SYSTEM (A + B)</button>
              <button type="button" class="pick" data-i="${i}" data-pick="solo" data-picked="${this.picked[i] === 'solo' ? '1' : '0'}">SOLO (one block)</button>
            </div>
          `).join('')}
        </div>
        <div class="why" id="ss-why">
          <p>Pick an approach for each of the three questions.</p>
        </div>
        <p class="foot">System view: internal forces cancel. Solo view: internal forces appear. Pick the view that hides what you do not need.</p>
      </div>
    `);

    this._why = this.root.querySelector('#ss-why');
    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('.pick').forEach((b) => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        this.picked[i] = b.dataset.pick;
        this._renderPick();
      });
    });

    this._renderPick();
    this.quill.speak('Same picture, three questions. The right view depends on what you need.', 5400);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _renderPick() {
    this.root.querySelectorAll('.pick').forEach((b) => {
      const i = Number(b.dataset.i);
      b.dataset.picked = (this.picked[i] === b.dataset.pick) ? '1' : '0';
      b.dataset.good = '0';
      b.dataset.bad = '0';
    });
  }

  checkObjective() {
    if (this.picked.every((p) => p === null)) return null;
    if (this.picked.some((p) => p === null)) {
      this.quill?.setExpression('surprised');
      return { ok: false, hint: 'Pick an approach for all three questions first.' };
    }
    const wrong = [];
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      if (this.picked[i] !== q.right) wrong.push(q.q);
      // mark
      this.root.querySelectorAll(`.row[data-i="${i}"] .pick`).forEach((b) => {
        if (b.dataset.pick === q.right) b.dataset.good = '1';
        if (b.dataset.pick === this.picked[i] && b.dataset.pick !== q.right) b.dataset.bad = '1';
      });
    }
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    this._why.innerHTML = `<p><b>Recheck:</b> ${wrong.join('; ')}. The system view HIDES internal forces; the solo view SHOWS them.</p>`;
    return { ok: false, hint: 'Use the system view when you want internal forces to cancel out (acceleration). Use the solo view when you need an internal force (tension, contact force).' };
  }
}
