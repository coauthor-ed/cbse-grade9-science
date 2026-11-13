import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * NetForcePullerGame - mini-game for les-10, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). A box on a frictionless floor has two pulls
 * acting on it: F1 to the right, F2 to the left. The student adjusts each
 * pull with a slider. The live readout shows the net force. The challenge:
 * set the two pulls so the net force is EXACTLY 6 N to the right.
 *
 * Setup:
 *   F1: 0..20 N, default 4 N (right)
 *   F2: 0..20 N, default 4 N (left)
 *   target: net = +6 N -> F1 - F2 = 6
 *
 * The wrong attractor: the student makes F1=10, F2=4 and stops, thinking
 * "net is 10 - 4 = 6". But they had it right - the trap is they may also
 * try F1=6, F2=0 (net is 6 but only one force is acting). That is actually
 * valid here; we use F1=10, F2=4 as the canonical two-force solution.
 * Either works because we ask for the net value, not a specific pair.
 *
 * Built on DomSimulation - sliders and a side panel with a number readout
 * are the documented content shape, and Quill drops in via SimMascotDom.
 */

const W = 900;
const H = 600;

const TARGET_NET = 6;     // N to the right
const F1_DEFAULT = 4;
const F2_DEFAULT = 4;

const CSS = `
.nf { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.nf .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.nf h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.nf h2 b { color: var(--sim-accent); }

.nf .scene { position: relative; width: 900px; height: 220px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; box-sizing: border-box; margin-bottom: 18px; }
.nf svg { display: block; width: 100%; height: 100%; }
.nf .floor { stroke: var(--sim-border); stroke-width: 3; }
.nf .box { fill: var(--sim-series-1); stroke: var(--sim-bg-deep); stroke-width: 3; }
.nf .arrow-r { stroke: var(--sim-accent); stroke-width: 6; stroke-linecap: round; fill: none; }
.nf .arrow-l { stroke: var(--sim-series-2); stroke-width: 6; stroke-linecap: round; fill: none; }
.nf .arrow-net { stroke: var(--sim-gold); stroke-width: 7; stroke-linecap: round; fill: none; }
.nf .arrowhead-r { fill: var(--sim-accent); }
.nf .arrowhead-l { fill: var(--sim-series-2); }
.nf .arrowhead-net { fill: var(--sim-gold); }
.nf .lab { font: 700 14px var(--sim-font, system-ui); fill: var(--sim-label); }

.nf .row { display: grid; grid-template-columns: 90px 1fr 80px; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin-bottom: 10px; }
.nf .row .name { font: 700 16px var(--sim-font, system-ui); }
.nf .row input[type="range"] { width: 100%; }
.nf .row .val { font: 700 18px var(--sim-font-display, system-ui); text-align: right; }

.nf .netbox { padding: 14px 16px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); display: flex; align-items: center; justify-content: space-between; }
.nf .netbox .kicker { margin: 0; }
.nf .netbox .v { font: 700 22px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.nf .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class NetForcePullerGame extends withChallenge(DomSimulation) {
  static simId = 'net-force-puller-game';
  static label = { en: 'Pull to Net Six' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A box with two pulls. Adjust F1 to the right and F2 to the left so the net force is 6 N to the right.';
  static OBJECTIVE = {
    prompt: {
      en: 'Two pulls act on a box on a frictionless floor. Set the sliders so the net force on the box is +6 N (to the right).',
    },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.05 };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.f1 = F1_DEFAULT;
    this.f2 = F2_DEFAULT;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="nf">
        <p class="kicker">Balanced vs unbalanced</p>
        <h2>Set the two pulls so the net force is <b>+6 N</b> to the right.</h2>
        <div class="scene">
          <svg viewBox="0 0 900 220" aria-hidden="true">
            <line class="floor" x1="20" y1="170" x2="880" y2="170"/>
            <rect class="box" x="410" y="120" width="80" height="50"></rect>
            <line class="arrow-r" id="nf-a1" x1="0" y1="0" x2="0" y2="0"></line>
            <polygon class="arrowhead-r" id="nf-h1" points=""></polygon>
            <line class="arrow-l" id="nf-a2" x1="0" y1="0" x2="0" y2="0"></line>
            <polygon class="arrowhead-l" id="nf-h2" points=""></polygon>
            <line class="arrow-net" id="nf-an" x1="0" y1="0" x2="0" y2="0"></line>
            <polygon class="arrowhead-net" id="nf-hn" points=""></polygon>
            <text class="lab" x="450" y="115" text-anchor="middle">box</text>
          </svg>
        </div>
        <div class="row">
          <span class="name">F<sub>1</sub> &rarr;</span>
          <input type="range" id="nf-f1" min="0" max="20" step="0.5" value="${F1_DEFAULT}">
          <span class="val" id="nf-v1">${F1_DEFAULT} N</span>
        </div>
        <div class="row">
          <span class="name">&larr; F<sub>2</sub></span>
          <input type="range" id="nf-f2" min="0" max="20" step="0.5" value="${F2_DEFAULT}">
          <span class="val" id="nf-v2">${F2_DEFAULT} N</span>
        </div>
        <div class="netbox">
          <p class="kicker">Net force</p>
          <span class="v" id="nf-net">+0.0 N</span>
        </div>
        <p class="foot">Net force = F1 - F2 (taking right as positive). The two arrows do not always cancel.</p>
      </div>
    `);

    this._f1In  = this.root.querySelector('#nf-f1');
    this._f2In  = this.root.querySelector('#nf-f2');
    this._v1    = this.root.querySelector('#nf-v1');
    this._v2    = this.root.querySelector('#nf-v2');
    this._net   = this.root.querySelector('#nf-net');
    this._a1    = this.root.querySelector('#nf-a1');
    this._h1    = this.root.querySelector('#nf-h1');
    this._a2    = this.root.querySelector('#nf-a2');
    this._h2    = this.root.querySelector('#nf-h2');
    this._an    = this.root.querySelector('#nf-an');
    this._hn    = this.root.querySelector('#nf-hn');

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._f1In.addEventListener('input', () => {
      this.f1 = Number(this._f1In.value);
      this._moved = true;
      this._render();
    });
    this._f2In.addEventListener('input', () => {
      this.f2 = Number(this._f2In.value);
      this._moved = true;
      this._render();
    });

    this._render();
    this.quill.speak('Two pulls. Make them add up to six newtons in the right direction.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _arrow(id, hId, x1, y1, x2, y2) {
    id.setAttribute('x1', x1); id.setAttribute('y1', y1);
    id.setAttribute('x2', x2); id.setAttribute('y2', y2);
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    if (L < 1) { hId.setAttribute('points', ''); return; }
    const ux = dx / L, uy = dy / L;
    const t = 12;
    const px = -uy, py = ux;
    hId.setAttribute('points',
      `${x2},${y2} ${(x2 - ux * t + px * t * 0.6).toFixed(2)},${(y2 - uy * t + py * t * 0.6).toFixed(2)} ${(x2 - ux * t - px * t * 0.6).toFixed(2)},${(y2 - uy * t - py * t * 0.6).toFixed(2)}`
    );
  }

  _render() {
    this._v1.textContent = `${this.f1.toFixed(1)} N`;
    this._v2.textContent = `${this.f2.toFixed(1)} N`;
    const net = this.f1 - this.f2;
    this._net.textContent = `${net >= 0 ? '+' : ''}${net.toFixed(1)} N`;

    // F1 rightward, from left edge of box.
    const boxL = 410, boxR = 490, boxY = 145;
    const f1Len = this.f1 * 8;
    this._arrow(this._a1, this._h1, boxL - 10, boxY, boxL - 10 + f1Len, boxY);
    const f2Len = this.f2 * 8;
    this._arrow(this._a2, this._h2, boxR + 10, boxY, boxR + 10 - f2Len, boxY);

    // Net force: drawn above the box, magnitude = |net| * 8, direction = sign.
    const netLen = Math.abs(net) * 8;
    if (netLen > 4) {
      const y = 80;
      if (net >= 0) this._arrow(this._an, this._hn, boxL - 10, y, boxL - 10 + netLen, y);
      else          this._arrow(this._an, this._hn, boxR + 10, y, boxR + 10 - netLen, y);
    } else {
      this._an.setAttribute('x1', 0); this._an.setAttribute('y1', 0);
      this._an.setAttribute('x2', 0); this._an.setAttribute('y2', 0);
      this._hn.setAttribute('points', '');
    }
  }

  checkObjective() {
    if (!this._moved) return null;
    const net = this.f1 - this.f2;
    if (Math.abs(net - TARGET_NET) / TARGET_NET > 0.05) {
      this.quill?.setExpression('surprised');
      const hint = net < TARGET_NET
        ? 'Net is too small (or pointing left). Push harder right, or ease the left pull back.'
        : 'Net is too big. Drop F1 a touch, or raise F2 a touch.';
      return { value: net, target: TARGET_NET, hint };
    }
    this.quill?.perform('hop');
    return { value: net, target: TARGET_NET, hint: 'Two pulls, one net. The two arrows add to a single arrow of 6 N to the right.' };
  }
}
