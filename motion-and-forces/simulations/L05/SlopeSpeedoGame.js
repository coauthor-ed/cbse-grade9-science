import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SlopeSpeedoGame - mini-game for les-05, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Position-time graphs use a fixed rule: the slope
 * of the line IS the velocity. The student sees an empty p-t grid. They drag
 * a "start" handle and an "end" handle, and a live slope readout shows the
 * velocity. The challenge: place the two handles so the slope reads EXACTLY
 * +5 m/s. The handles start in the wrong place (slope = 0, a flat line at
 * 2 m), so the student has to actually move both points - they cannot
 * satisfy the objective just by leaving the rig alone.
 *
 * Setup parameters (chosen so the math is "draw yourself a +5 m/s line"):
 *   - t-axis: 0..8 s, 90 px/s -> LEFT=120, RIGHT=840
 *   - x-axis: 0..20 m, 30 px/m -> BOT=460, TOP=100
 *   - target slope: 5 m/s over 4 s -> position must rise 20 m
 *   - initial handles: (2 s, 2 m) and (6 s, 2 m) -> flat, slope 0
 *
 * The trap: the student moves the START handle up by a lot and the END
 * handle up by a lot, but in a way that the line goes through (0,0) and
 * (4, 20) - that gives slope 5 BUT the readout is +5 m/s only if the
 * delta-x / delta-t matches. Dragging both up equally gives slope 0.
 * The only way across is to move the two handles asymmetrically so the
 * rise-over-run works out to 5.
 *
 * Built on DomSimulation so the SVG plot is the natural shape, the input
 * controls are exactly what DomSimulation's content-shape table lists, and
 * Quill drops in through SimMascotDom.
 */

const W = 900;
const H = 600;

const T_MAX = 8;        // seconds on the t axis
const X_MAX = 20;       // metres on the x axis
const LEFT = 120;       // px, left edge of plot
const RIGHT = 840;      // px, right edge of plot
const TOP = 100;        // px, top of plot (x = 20 m)
const BOT = 460;        // px, bottom of plot (x = 0 m)
const W_PLOT = RIGHT - LEFT;
const H_PLOT = BOT - TOP;

const TARGET_V = 5;     // target velocity in m/s

// Initial handle positions in data space (t, x):
// flat line at x = 2 m -> slope 0, not the target.
const START_INIT = { t: 2, x: 2 };
const END_INIT   = { t: 6, x: 2 };

const xToPx = (t) => LEFT + (t / T_MAX) * W_PLOT;
const xToPy = (x) => BOT - (x / X_MAX) * H_PLOT;
const pxToT = (px) => Math.max(0, Math.min(T_MAX, ((px - LEFT) / W_PLOT) * T_MAX));
const pxToX = (py) => Math.max(0, Math.min(X_MAX, ((BOT - py) / H_PLOT) * X_MAX));

const CSS = `
.ss { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.ss .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.ss h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.ss h2 b { color: var(--sim-accent); }

.ss .plot { position: relative; width: 900px; height: 380px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; box-sizing: border-box; }
.ss svg { display: block; width: 100%; height: 100%; touch-action: none; }
.ss .axis { stroke: var(--sim-label-muted); stroke-width: 1.5; }
.ss .tick { font: 600 12px var(--sim-font, system-ui); fill: var(--sim-label-muted); }
.ss .grid { stroke: var(--sim-border); stroke-width: 0.5; fill: none; opacity: 0.6; }
.ss .line { stroke: var(--sim-accent); stroke-width: 4; fill: none; stroke-linecap: round; }
.ss .handle { fill: var(--sim-gold); stroke: var(--sim-bg-deep); stroke-width: 3; cursor: grab; }
.ss .handle[data-drag="1"] { cursor: grabbing; }
.ss svg:focus-visible .handle { stroke: var(--sim-accent); stroke-width: 5; }
.ss .targetline { stroke: var(--sim-good); stroke-width: 3; stroke-dasharray: 8 6; fill: none; opacity: 0; }
.ss .targetline[data-on="1"] { opacity: 0.6; }

.ss .panel { position: absolute; right: 28px; top: 80px; width: 240px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 14px; padding: 14px 16px; box-sizing: border-box; }
.ss .panel .row { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-top: 1px solid var(--sim-border); }
.ss .panel .row:first-of-type { border-top: none; }
.ss .panel .row span:first-child { color: var(--sim-label-muted); font-size: 13px; }
.ss .panel .row span:last-child { font: 700 18px var(--sim-font, system-ui); color: var(--sim-label); }
.ss .vel { color: var(--sim-accent); }

.ss .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class SlopeSpeedoGame extends withChallenge(DomSimulation) {
  static simId = 'slope-speedo-game';
  static label = { en: 'Slope Speedo' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A position-time graph. Drag two handles so the line slope reads +5 m/s.';
  static OBJECTIVE = {
    prompt: {
      en: 'The slope of a position-time line IS the velocity. Drag the two dots so the line shows exactly +5 m/s.',
    },
  };
  // +-0.2 m/s = +-0.04, generous because rounding the handles to 1 s / 1 m
  // quantises the slopes the student can produce.
  static SCORING = { mode: 'accuracy', tolerance: 0.04 };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.start = { ...START_INIT };
    this.end   = { ...END_INIT };
    this._dragging = null; // 'start' | 'end' | null
    this._moved = false;
    this._onDown = this._handleDown.bind(this);
    this._onMove = this._handleMove.bind(this);
    this._onUp   = this._handleUp.bind(this);
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="ss">
        <p class="kicker">Position-time graph</p>
        <h2>Drag the two dots until the line slope reads <b>+5 m/s</b>.</h2>
        <div class="plot">
          <svg viewBox="0 0 ${W} 380" tabindex="0" role="img"
               aria-label="${this.constructor.ARIA_LABEL}">
            <g class="grid">
              ${Array.from({ length: T_MAX + 1 }, (_, i) => `<path d="M ${xToPx(i)} ${TOP} V ${BOT}"/>`).join('')}
              ${Array.from({ length: X_MAX / 2 + 1 }, (_, i) => `<path d="M ${LEFT} ${xToPy(i * 2)} H ${RIGHT}"/>`).join('')}
            </g>
            <line class="axis" x1="${LEFT}" y1="${BOT}" x2="${RIGHT}" y2="${BOT}"/>
            <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${BOT}"/>
            ${Array.from({ length: T_MAX + 1 }, (_, i) => `<text class="tick" x="${xToPx(i)}" y="${BOT + 18}" text-anchor="middle">${i}s</text>`).join('')}
            ${Array.from({ length: X_MAX / 2 + 1 }, (_, i) => `<text class="tick" x="${LEFT - 8}" y="${xToPy(i * 2) + 4}" text-anchor="end">${i * 2}</text>`).join('')}
            <text class="tick" x="${LEFT - 50}" y="${TOP + 6}">x (m)</text>
            <text class="tick" x="${RIGHT - 4}" y="${BOT + 32}">t (s)</text>
            <path class="line" id="ss-line" d=""></path>
            <path class="targetline" id="ss-target" d=""></path>
            <circle class="handle" id="ss-h-start" data-which="start" cx="0" cy="0" r="13"></circle>
            <circle class="handle" id="ss-h-end"   data-which="end"   cx="0" cy="0" r="13"></circle>
          </svg>
        </div>
        <div class="panel">
          <p class="kicker" style="margin: 0 0 6px;">Slope = velocity</p>
          <div class="row"><span>&Delta;x</span><span id="ss-dx">0.0 m</span></div>
          <div class="row"><span>&Delta;t</span><span id="ss-dt">0.0 s</span></div>
          <div class="row"><span>Velocity</span><span class="vel" id="ss-v">+0.0 m/s</span></div>
        </div>
        <p class="foot">Slope = rise over run. On a position-time graph, that number is the velocity.</p>
      </div>
    `);

    this._svg     = this.root.querySelector('svg');
    this._line    = this.root.querySelector('#ss-line');
    this._target  = this.root.querySelector('#ss-target');
    this._hStart  = this.root.querySelector('#ss-h-start');
    this._hEnd    = this.root.querySelector('#ss-h-end');
    this._dxOut   = this.root.querySelector('#ss-dx');
    this._dtOut   = this.root.querySelector('#ss-dt');
    this._vOut    = this.root.querySelector('#ss-v');

    // Show a faint +5 m/s reference line through the origin so the student
    // can see what they are aiming for. It's behind the active line.
    this._target.setAttribute('d', `M ${xToPx(0)} ${xToPy(0)} L ${xToPx(T_MAX)} ${xToPy(TARGET_V * T_MAX)}`);
    this._target.dataset.on = '1';

    this.quill = SimMascotDom.mount(this.root, { x: 720, y: 565, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._svg.addEventListener('pointerdown', this._onDown);
    this._svg.addEventListener('pointermove', this._onMove);
    this._svg.addEventListener('pointerup',   this._onUp);
    this._svg.addEventListener('pointercancel', this._onUp);

    this._render();
    this.quill.speak('A flat line has no velocity. Tilt it: move one dot up, the other stays.', 5400);
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
    const t = e.target;
    if (!t.dataset || !t.dataset.which) return;
    this._dragging = t.dataset.which;
    t.dataset.drag = '1';
    this._svg.setPointerCapture?.(e.pointerId);
    this._updateFromPoint(this._toScene(e));
    this._moved = true;
  }

  _handleMove(e) {
    if (!this._dragging) return;
    this._updateFromPoint(this._toScene(e));
  }

  _handleUp(e) {
    if (!this._dragging) return;
    const t = this.root.querySelector(`[data-which="${this._dragging}"]`);
    if (t) t.dataset.drag = '0';
    this._dragging = null;
    this._svg.releasePointerCapture?.(e.pointerId);
  }

  _updateFromPoint(p) {
    const t = pxToT(p.x);
    const x = pxToX(p.y);
    if (this._dragging === 'start') this.start = { t, x };
    else if (this._dragging === 'end') this.end = { t, x };
    this._render();
  }

  _velocity() {
    const dt = this.end.t - this.start.t;
    if (Math.abs(dt) < 0.05) return 0;
    return (this.end.x - this.start.x) / dt;
  }

  _render() {
    const sx = xToPx(this.start.t), sy = xToPy(this.start.x);
    const ex = xToPx(this.end.t),   ey = xToPy(this.end.x);
    this._hStart.setAttribute('cx', sx.toFixed(1));
    this._hStart.setAttribute('cy', sy.toFixed(1));
    this._hEnd.setAttribute('cx', ex.toFixed(1));
    this._hEnd.setAttribute('cy', ey.toFixed(1));
    this._line.setAttribute('d', `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`);
    const dt = this.end.t - this.start.t;
    const dx = this.end.x - this.start.x;
    const v  = this._velocity();
    this._dxOut.textContent = `${dx.toFixed(1)} m`;
    this._dtOut.textContent = `${dt.toFixed(1)} s`;
    const sign = v >= 0 ? '+' : '';
    this._vOut.textContent  = `${sign}${v.toFixed(1)} m/s`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const v = this._velocity();
    const rel = Math.abs(v - TARGET_V) / TARGET_V;
    if (rel > 0.04) {
      this.quill?.setExpression('surprised');
      const sign = v < TARGET_V ? 'too small' : 'too steep';
      return {
        value: v,
        target: TARGET_V,
        hint: sign === 'too small'
          ? 'Tilt the line more. A bigger rise over the same run gives a larger velocity.'
          : 'Tilt the line less. The slope is rise over RUN - a longer run at the same rise flattens the slope.',
      };
    }
    this.quill?.perform('hop');
    return { value: v, target: TARGET_V, hint: 'Slope = velocity. The graph and the speedometer agree.' };
  }
}
