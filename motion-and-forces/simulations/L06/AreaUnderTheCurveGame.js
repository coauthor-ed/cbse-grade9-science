import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * AreaUnderTheCurveGame - mini-game for les-06, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson's key insight: on a v-t graph the
 * AREA under the line equals the displacement. The student is given a v-t
 * graph with a constant velocity (a flat horizontal line at 8 m/s for 5 s,
 * so the area is 8*5 = 40 m). They have to drag a base line to the right
 * so the rectangle under the curve EXACTLY covers 40 m of displacement.
 *
 * The rig:
 *   - v-axis fixed: the line is at v = 8 m/s (a flat line)
 *   - t-axis: the student drags a "t-end" handle. The base of the
 *     rectangle stretches from t=0 to whatever t they picked.
 *   - live readout: t, area = v * t
 *   - target: area = 40 m
 *
 * Because v is fixed at 8 m/s, the trap is the student moves the handle to
 * 5 s - that gives the right answer. The wrong attractor: they assume the
 * lesson's "v-t graph" idea means they should drag the v handle, but it is
 * locked. The other wrong attractor: they conflate area with the height
 * (v) alone and stop at v=8.
 *
 * Built on DomSimulation - SVG plot, drag handle, and live number readouts
 * are the documented DomSimulation content shape, and Quill drops in
 * through SimMascotDom.
 */

const W = 900;
const H = 600;

const V_LINE = 8;       // m/s, the constant velocity (a flat line)
const T_MAX = 10;       // seconds, the right edge of the plot
const LEFT = 120;
const RIGHT = 840;
const TOP = 80;
const BOT = 420;
const W_PLOT = RIGHT - LEFT;
const H_PLOT = BOT - TOP;

const TARGET_AREA = 40; // m of displacement
const TARGET_T = TARGET_AREA / V_LINE; // 5 s

const xToPx = (t) => LEFT + (t / T_MAX) * W_PLOT;
const xToPy = (v) => BOT - (v / V_MAX) * H_PLOT;
const pxToT = (px) => Math.max(0, Math.min(T_MAX, ((px - LEFT) / W_PLOT) * T_MAX));
const V_MAX = 12;       // for vertical scale

const CSS = `
.ac { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.ac .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.ac h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.ac h2 b { color: var(--sim-accent); }

.ac .plot { position: relative; width: 900px; height: 380px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; box-sizing: border-box; }
.ac svg { display: block; width: 100%; height: 100%; touch-action: none; }
.ac .axis { stroke: var(--sim-label-muted); stroke-width: 1.5; }
.ac .tick { font: 600 12px var(--sim-font, system-ui); fill: var(--sim-label-muted); }
.ac .grid { stroke: var(--sim-border); stroke-width: 0.5; fill: none; opacity: 0.6; }
.ac .vline { stroke: var(--sim-accent); stroke-width: 4; stroke-linecap: round; fill: none; }
.ac .area { fill: var(--sim-series-3); opacity: 0.45; }
.ac .handle { fill: var(--sim-gold); stroke: var(--sim-bg-deep); stroke-width: 3; cursor: grab; }
.ac svg:focus-visible .handle { stroke: var(--sim-accent); stroke-width: 5; }

.ac .panel { position: absolute; right: 28px; top: 80px; width: 240px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 14px; padding: 14px 16px; box-sizing: border-box; }
.ac .panel .row { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-top: 1px solid var(--sim-border); }
.ac .panel .row:first-of-type { border-top: none; }
.ac .panel .row span:first-child { color: var(--sim-label-muted); font-size: 13px; }
.ac .panel .row span:last-child { font: 700 18px var(--sim-font, system-ui); color: var(--sim-label); }
.ac .area-out { color: var(--sim-accent); }

.ac .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class AreaUnderTheCurveGame extends withChallenge(DomSimulation) {
  static simId = 'area-under-the-curve-game';
  static label = { en: 'Area Under the Curve' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A velocity-time graph with a flat line at 8 m/s. Drag the right edge to make the area under it equal to 40 m.';
  static OBJECTIVE = {
    prompt: {
      en: 'The v-t line is flat at 8 m/s. Drag the right edge so the rectangle under the line has area EXACTLY 40 m.',
    },
  };
  // +-0.5 m = +-5% (about +-0.06 s, since area = 8 * dt)
  static SCORING = { mode: 'accuracy', tolerance: 0.012 };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.tEnd = 0.5; // start with a small area, definitely wrong
    this._dragging = false;
    this._moved = false;
    this._onDown = this._handleDown.bind(this);
    this._onMove = this._handleMove.bind(this);
    this._onUp   = this._handleUp.bind(this);
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="ac">
        <p class="kicker">Velocity-time graph</p>
        <h2>Velocity is locked at <b>8 m/s</b>. Drag the right edge so the area under the line = <b>40 m</b>.</h2>
        <div class="plot">
          <svg viewBox="0 0 ${W} 380" tabindex="0" role="img"
               aria-label="${this.constructor.ARIA_LABEL}">
            <g class="grid">
              ${Array.from({ length: T_MAX + 1 }, (_, i) => `<path d="M ${xToPx(i)} ${TOP} V ${BOT}"/>`).join('')}
              ${Array.from({ length: V_MAX / 2 + 1 }, (_, i) => `<path d="M ${LEFT} ${xToPy(i * 2)} H ${RIGHT}"/>`).join('')}
            </g>
            <line class="axis" x1="${LEFT}" y1="${BOT}" x2="${RIGHT}" y2="${BOT}"/>
            <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${BOT}"/>
            ${Array.from({ length: T_MAX + 1 }, (_, i) => `<text class="tick" x="${xToPx(i)}" y="${BOT + 18}" text-anchor="middle">${i}s</text>`).join('')}
            ${Array.from({ length: V_MAX / 2 + 1 }, (_, i) => `<text class="tick" x="${LEFT - 8}" y="${xToPy(i * 2) + 4}" text-anchor="end">${i * 2}</text>`).join('')}
            <text class="tick" x="${LEFT - 50}" y="${TOP + 6}">v (m/s)</text>
            <text class="tick" x="${RIGHT - 4}" y="${BOT + 32}">t (s)</text>
            <rect class="area" id="ac-area" x="0" y="0" width="0" height="0"></rect>
            <line class="vline" x1="${LEFT}" y1="${xToPy(V_LINE)}" x2="${RIGHT}" y2="${xToPy(V_LINE)}"/>
            <circle class="handle" id="ac-h" cx="0" cy="${xToPy(V_LINE)}" r="14"></circle>
          </svg>
        </div>
        <div class="panel">
          <p class="kicker" style="margin: 0 0 6px;">Area = displacement</p>
          <div class="row"><span>v</span><span>${V_LINE} m/s</span></div>
          <div class="row"><span>t</span><span id="ac-t">0.0 s</span></div>
          <div class="row"><span>Area</span><span class="area-out" id="ac-a">0.0 m</span></div>
        </div>
        <p class="foot">On a v-t graph, the area under the line equals the displacement. Make it 40.</p>
      </div>
    `);

    this._svg    = this.root.querySelector('svg');
    this._area   = this.root.querySelector('#ac-area');
    this._handle = this.root.querySelector('#ac-h');
    this._tOut   = this.root.querySelector('#ac-t');
    this._aOut   = this.root.querySelector('#ac-a');

    this.quill = SimMascotDom.mount(this.root, { x: 720, y: 565, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._svg.addEventListener('pointerdown', this._onDown);
    this._svg.addEventListener('pointermove', this._onMove);
    this._svg.addEventListener('pointerup',   this._onUp);
    this._svg.addEventListener('pointercancel', this._onUp);

    this._render();
    this.quill.speak('The line is flat at 8. Make the rectangle under it 40.', 5200);
  }

  destroy() {
    this._svg?.removeEventListener('pointerdown', this._onDown);
    this._svg?.removeEventListener('pointermove', this._onMove);
    this._svg?.removeEventListener('pointerup',   this._onUp);
    this._svg?.removeEventListener('pointercancel', this._onUp);
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _toScene(e) {
    const r = this._svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * 380 };
  }

  _handleDown(e) {
    this._dragging = true;
    this._svg.setPointerCapture?.(e.pointerId);
    this.tEnd = pxToT(this._toScene(e).x);
    this._moved = true;
    this._render();
  }

  _handleMove(e) {
    if (!this._dragging) return;
    this.tEnd = pxToT(this._toScene(e).x);
    this._render();
  }

  _handleUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this._svg.releasePointerCapture?.(e.pointerId);
  }

  _render() {
    const xPx = xToPx(this.tEnd);
    const yPx = xToPy(V_LINE);
    this._area.setAttribute('x', LEFT);
    this._area.setAttribute('y', yPx);
    this._area.setAttribute('width', xPx - LEFT);
    this._area.setAttribute('height', BOT - yPx);
    this._handle.setAttribute('cx', xPx);
    this._handle.setAttribute('cy', yPx);
    const area = V_LINE * this.tEnd;
    this._tOut.textContent = `${this.tEnd.toFixed(1)} s`;
    this._aOut.textContent = `${area.toFixed(1)} m`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const area = V_LINE * this.tEnd;
    const rel = Math.abs(area - TARGET_AREA) / TARGET_AREA;
    if (rel > 0.012) {
      this.quill?.setExpression('surprised');
      const too = area < TARGET_AREA ? 'too small' : 'too big';
      return {
        value: area,
        target: TARGET_AREA,
        hint: too === 'too small'
          ? 'Area = v * t. With v fixed at 8, you need t to grow until 8 * t = 40.'
          : 'Area = v * t. With v fixed at 8, you overshot - drag back until 8 * t = 40.',
      };
    }
    this.quill?.perform('hop');
    return { value: area, target: TARGET_AREA, hint: 'Area under v-t = displacement. The rectangle and the ruler agree.' };
  }
}
