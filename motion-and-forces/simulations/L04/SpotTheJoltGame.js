import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SpotTheJoltGame - mini-game for les-04, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Five segments on a v-t graph, one of them
 * is the jolt: the steepest slope, where velocity changes fastest.
 *
 *   A: 0 -> 9  m/s over 5 s, slope  1.8 m/s/s
 *   B: 9 -> 12 m/s over 5 s, slope  0.6 m/s/s
 *   C: 12 -> 12 m/s over 5 s, slope  0 m/s/s
 *   D: 12 -> 22 m/s over 5 s, slope  2 m/s/s
 *   E: 22 -> 14 m/s over 5 s, slope -1.6 m/s/s
 *
 * D has the largest positive change in velocity (10, vs A's 9) and is
 * also the steepest positive slope - unambiguous. (An earlier draft had
 * A tied with D at Delta-v = 10, which meant the "correct" answer A was
 * scored wrong; A's endpoint was lowered by 1 m/s, with B's start moved
 * to match so the graph stays continuous.)
 *
 * The trap: picking E because it is the steepest. E has the largest
 * |slope|, but acceleration can be negative - the question asks for the
 * largest positive change, and E is slowing down.
 *
 * Built on DomSimulation so a clickable SVG graph is the natural shape
 * and Quill drops in through SimMascotDom.
 */

const W = 900;
const H = 600;

const SEGS = [
  { key: 'A', v0: 0,  v1: 9,  color: '--sim-series-1' },
  { key: 'B', v0: 9,  v1: 12, color: '--sim-series-2' },
  { key: 'C', v0: 12, v1: 12, color: '--sim-series-3' },
  { key: 'D', v0: 12, v1: 22, color: '--sim-series-4' },
  { key: 'E', v0: 22, v1: 14, color: '--sim-series-5' },
];
const TARGET = 'D';

const T = 5;                  // 5 seconds per segment
const V_MAX = 24;
const V_MIN = 0;
const LEFT = 90;
const RIGHT = 820;
const TOP = 80;
const BOT = 380;
const W_PLOT = RIGHT - LEFT;
const H_PLOT = BOT - TOP;

const xAt = (segIndex, t) => LEFT + (segIndex * T + t) * (W_PLOT / (SEGS.length * T));
const yAt = (v) => BOT - (v - V_MIN) * (H_PLOT / (V_MAX - V_MIN));

const CSS = `
.sj { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.sj .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.sj h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 16px; line-height: 1.2; }
.sj h2 b { color: var(--sim-accent); }

.sj .plot { background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; padding: 8px; box-sizing: border-box; }
.sj svg { display: block; width: 100%; height: 320px; }
.sj .axis { stroke: var(--sim-label-muted); stroke-width: 1.5; }
.sj .tick { font: 600 12px var(--sim-font, system-ui); fill: var(--sim-label-muted); }
.sj .seg { fill: transparent; stroke-width: 3; cursor: pointer; opacity: 0.18; }
.sj .seg:hover { opacity: 0.32; }
.sj .seg[data-picked="1"] { opacity: 0.55; }
.sj .seg[data-good="1"]  { opacity: 0.7; }
.sj .seg[data-bad="1"]   { opacity: 0.7; }

.sj .legend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.sj .chip { padding: 6px 10px; border-radius: 999px; font: 700 12px var(--sim-font); background: var(--sim-panel); border: 2px solid var(--sim-border); }
.sj .foot { font-size: 14px; color: var(--sim-label-muted); margin: 14px 0 0; }
`;

export class SpotTheJoltGame extends withChallenge(DomSimulation) {
  static simId = 'spot-the-jolt-game';
  static label = { en: 'Spot the Jolt' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A velocity-time graph with five segments. Click the segment where acceleration is largest positive.';
  static OBJECTIVE = {
    prompt: {
      en: 'A bus drives in five 5-second segments. Click the segment where the velocity rises the most - the largest positive acceleration.',
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
      <div class="sj">
        <p class="kicker">Acceleration is the slope of v-t</p>
        <h2>Click the segment with the <b>biggest positive jolt</b>.</h2>
        <div class="plot">
          <svg viewBox="0 0 ${RIGHT + 30} ${BOT + 30}" aria-hidden="true">
            <line class="axis" x1="${LEFT}" y1="${BOT}" x2="${RIGHT}" y2="${BOT}"/>
            <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${BOT}"/>
            ${Array.from({ length: 5 }, (_, i) => `<text class="tick" x="${LEFT + i * (W_PLOT / 5) + 12}" y="${BOT + 18}">${i * 5}s</text>`).join('')}
            ${[0, 6, 12, 18, 24].map((v) => `<text class="tick" x="${LEFT - 8}" y="${yAt(v) + 4}" text-anchor="end">${v}</text>`).join('')}
            <text class="tick" x="${LEFT - 50}" y="${TOP + 6}">v (m/s)</text>
            <text class="tick" x="${RIGHT - 6}" y="${BOT + 28}">t (s)</text>
            <path d="${SEGS.map((s, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i, 0)} ${yAt(s.v0)} L ${xAt(i, T)} ${yAt(s.v1)}`).join(' ')}"
                  fill="none" stroke="var(--sim-accent)" stroke-width="3" stroke-linejoin="round"/>
            ${SEGS.map((s, i) => `
              <rect class="seg" data-seg="${s.key}" data-picked="0"
                    x="${xAt(i, 0)}" y="${TOP}" width="${xAt(i, T) - xAt(i, 0)}" height="${H_PLOT}"
                    fill="var(${s.color})"/>
            `).join('')}
          </svg>
        </div>
        <div class="legend">
          ${SEGS.map((s) => `<span class="chip" style="border-color: var(${s.color});">${s.key}: ${s.v0} -> ${s.v1} m/s</span>`).join('')}
        </div>
        <p class="foot">Acceleration is the slope of the line - how fast velocity changes, in m/s per second.</p>
      </div>
    `);

    this.quill = SimMascotDom.mount(this.root, { x: 800, y: 565, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('.seg').forEach((el) => {
      el.addEventListener('click', () => {
        this.picked = el.dataset.seg;
        this._render();
      });
    });

    this.quill.speak('Five pieces. Which one makes the velocity jump the most?', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _render() {
    this.root.querySelectorAll('.seg').forEach((el) => {
      el.dataset.picked = (this.picked && el.dataset.seg === this.picked) ? '1' : '0';
    });
  }

  checkObjective() {
    if (!this.picked) return null;
    if (this.picked === TARGET) {
      this.quill?.perform('hop');
      this.root.querySelectorAll('.seg').forEach((el) => {
        el.dataset.good = (el.dataset.seg === TARGET) ? '1' : '0';
      });
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    this.root.querySelectorAll('.seg').forEach((el) => {
      el.dataset.good = (el.dataset.seg === TARGET) ? '1' : '0';
      el.dataset.bad  = (el.dataset.seg === this.picked) ? '1' : '0';
    });
    return { ok: false, hint: 'Look at the change in velocity, not the steepness of the line. E is steepest but the velocity is going DOWN, not up.' };
  }
}
