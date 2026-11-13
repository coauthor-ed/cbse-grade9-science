import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * PathMysteryGame - mini-game for les-02, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). A bug walks a 3-by-4-by-5 right triangle path:
 *   A=(0,0) -> B=(4,0) -> C=(4,3) -> A=(0,0)
 * Distance walked = 4 + 3 + 5 = 12 m
 * Displacement (start to end) = 0 m
 *
 * Three answer slots, three measurements the lesson distinguishes:
 *   distance walked: 12
 *   shortest gap:    0
 *   displacement:    0
 *
 * The trap answer: "displacement = 12" because the bug moved 12 m. The
 * lesson is that displacement is the straight-line gap between start and
 * end - here the bug returned to A, so the gap is 0 even though it walked
 * 12 m. Many students pick displacement = 12 because they conflate
 * distance walked with displacement.
 *
 * Built on DomSimulation for the kit's documented reason: SVG paths and
 * labelled cards are exactly what DomSimulation's pick-by-content-shape
 * table says to use.
 */

const W = 900;
const H = 600;

const TARGETS = {
  distance: 12,    // metres walked
  shortest: 0,     // straight-line gap start-to-end
  displacement: 0, // displacement magnitude (same as shortest here)
};

const SLOTS = [
  { key: 'distance',     label: 'Distance walked',         target: TARGETS.distance },
  { key: 'shortest',     label: 'Shortest path home',      target: TARGETS.shortest },
  { key: 'displacement', label: 'Displacement of the bug', target: TARGETS.displacement },
];

const TOL = 0.5;  // metres

const CSS = `
.pm { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.pm .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.pm h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 16px; line-height: 1.2; }
.pm h2 b { color: var(--sim-accent); }

.pm .map { position: relative; width: 360px; height: 280px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; margin: 0 0 18px; }
.pm .map svg { width: 100%; height: 100%; display: block; }
.pm .grid { stroke: var(--sim-border); stroke-width: 0.6; fill: none; }
.pm .leg  { stroke: var(--sim-series-3); stroke-width: 6; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.pm .dot  { fill: var(--sim-accent); stroke: var(--sim-bg-deep); stroke-width: 2; }
.pm .lab  { font: 700 14px var(--sim-font, system-ui); fill: var(--sim-label); }

.pm .col { display: flex; flex-direction: column; gap: 10px; }
.pm .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); }
.pm .row .lab { font-weight: 700; font-size: 16px; flex: 1; }
.pm .row input { width: 90px; padding: 8px 10px; font: 700 18px var(--sim-font); text-align: right; background: var(--sim-bg-surface); color: var(--sim-label); border: 2px solid var(--sim-border); border-radius: 8px; }
.pm .row .unit { color: var(--sim-label-muted); font-weight: 700; }
.pm .row[data-good="1"] { border-color: var(--sim-good); }
.pm .row[data-bad="1"]  { border-color: var(--sim-bad); }

.pm .foot { font-size: 14px; color: var(--sim-label-muted); margin: 16px 0 0; }
`;

export class PathMysteryGame extends withChallenge(DomSimulation) {
  static simId = 'path-mystery-game';
  static label = { en: 'Path Mystery' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A bug walks a triangle path. Type the distance walked, the shortest path back to start, and the displacement.';
  static OBJECTIVE = {
    prompt: {
      en: 'The bug walks a 4 m, 3 m, 5 m triangle back to where it started. Fill in the three numbers: distance walked, shortest path home, and displacement.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.values = { distance: null, shortest: null, displacement: null };
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="pm">
        <p class="kicker">Path length vs straight-line gap</p>
        <h2>Bug walks <b>4 m, 3 m, 5 m</b> - then turns around and walks home.</h2>
        <div class="map">
          <svg viewBox="0 0 360 280" aria-hidden="true">
            <g class="grid">
              <path d="M 40 60 H 320 M 40 100 H 320 M 40 140 H 320 M 40 180 H 320 M 40 220 H 320 M 40 260 H 320"/>
              <path d="M 60 40 V 260 M 100 40 V 260 M 140 40 V 260 M 180 40 V 260 M 220 40 V 260 M 260 40 V 260 M 300 40 V 260"/>
            </g>
            <path class="leg" d="M 100 220 L 220 220 L 220 140 L 100 220 Z"/>
            <circle class="dot" cx="100" cy="220" r="9"/>
            <text class="lab" x="92" y="240">A</text>
            <text class="lab" x="225" y="240">B</text>
            <text class="lab" x="225" y="135">C</text>
            <text class="lab" x="60" y="135" font-size="11" fill="var(--sim-label-muted)">4 m</text>
            <text class="lab" x="225" y="185" font-size="11" fill="var(--sim-label-muted)">3 m</text>
            <text class="lab" x="150" y="180" font-size="11" fill="var(--sim-label-muted)">5 m</text>
          </svg>
        </div>
        <div class="col">
          ${SLOTS.map((s) => `
            <div class="row" data-key="${s.key}">
              <span class="lab">${s.label}</span>
              <input type="number" step="0.5" min="0" inputmode="decimal" data-key="${s.key}" aria-label="${s.label}">
              <span class="unit">m</span>
            </div>`).join('')}
        </div>
        <p class="foot">Distance is the full path. Displacement is the straight line from start to end.</p>
      </div>
    `);

    this.quill = SimMascotDom.mount(this.root, { x: 770, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        this.values[inp.dataset.key] = Number(inp.value);
        this._moved = true;
      });
    });

    this.quill.speak('A bug walks 4 m, 3 m, 5 m, then turns back. How much ground did it cover?', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  checkObjective() {
    if (!this._moved) return null;
    const errors = SLOTS.filter((s) => this.values[s.key] === null || isNaN(this.values[s.key]));
    if (errors.length) {
      this.quill?.setExpression('surprised');
      return { ok: false, hint: 'Fill in all three numbers first.' };
    }
    let wrong = [];
    SLOTS.forEach((s) => {
      const row = this.root.querySelector(`[data-key="${s.key}"]`);
      const v = this.values[s.key];
      if (Math.abs(v - s.target) <= TOL) row.dataset.good = '1';
      else { row.dataset.bad = '1'; wrong.push(s.label.toLowerCase()); }
    });
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const note = wrong.includes('displacement of the bug')
      ? ' Displacement is the straight line from start to end, not the path length.'
      : '';
    return { ok: false, hint: (wrong.length ? `Not quite: ${wrong.join(', ')}.` : 'Try again.') + note };
  }
}
