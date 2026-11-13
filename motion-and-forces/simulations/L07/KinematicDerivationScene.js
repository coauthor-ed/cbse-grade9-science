import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';

/**
 * KinematicDerivationScene — companion to blk-l07-s1.
 *
 * Process Statement: v = u + at and s = ut + ½at² are not two separate
 * facts to memorise — they ARE the velocity-time graph's own slope and
 * area, read off algebraically. The lesson beats walk through that
 * derivation once with fixed numbers; freeplay (u/a/t sliders, unlocked on
 * the final beat) lets the student re-run the exact same derivation against
 * any numbers they choose, so "the rectangle-plus-triangle area always
 * equals ut + ½at²" is something they can check for themselves, not just
 * watch demonstrated once.
 */

const W = 900;
const H = 600;

const GX0 = 190, GY0 = 430, GX1 = 800, GY1 = 90;

const DEFAULT_U = 8, DEFAULT_A = 2, DEFAULT_T = 6;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', '#38bdf8'],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', '#34d399'],
};

const STEPS = [
  { caption: 'An object starts at velocity u and accelerates at a constant rate for time t, reaching velocity v.' },
  { caption: 'From a = (v − u) ÷ t, the first kinematic equation: v = u + at.' },
  { caption: 'The displacement is the area under the velocity-time graph — a rectangle plus a triangle.' },
  { caption: 'That area gives the second equation: s = ut + ½ at². Try your own u, a and t below.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class KinematicDerivationScene extends CanvasSimulation {
  static simId = 'kinematic-derivation';
  static label = { en: 'Deriving v = u + at and s = ut + ½at²' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph starting at an initial velocity u and rising at constant acceleration to a final ' +
    'velocity v at time t. The slope of the line gives v equals u plus a t. The area under the line is a ' +
    'rectangle plus a triangle, giving the displacement s equals u t plus one half a t squared. On the final ' +
    'beat, sliders let the student set their own u, a and t and watch both the graph and the computed values ' +
    'update live.';

  static CONTROLS = [
    { type: 'slider', id: 'u', label: 'u (m/s):', min: 0, max: 16, step: 1, value: DEFAULT_U, suffix: '' },
    { type: 'slider', id: 'a', label: 'a (m/s²):', min: -4, max: 4, step: 0.5, value: DEFAULT_A, suffix: '' },
    { type: 'slider', id: 't', label: 't (s):', min: 1, max: 8, step: 0.5, value: DEFAULT_T, suffix: '' },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;

    this._u = DEFAULT_U;
    this._a = DEFAULT_A;
    this._t = DEFAULT_T;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._canvas.tabIndex = 0;
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce(STEPS[0].caption);
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() {
    this.colors = readSimColors(this.container, COLOR_TOKEN_MAP);
  }

  onBeatChange(beatIndex) {
    this._lessonLinked = true;
    const clamped = Math.max(0, Math.min(beatIndex, BEAT_STEP_MAP.length - 1));
    const chain = BEAT_STEP_MAP[clamped];
    this._beatChain = chain;
    this._beatChainPos = 0;
    this._beatChainDwell = chain[0].dwellMs != null ? chain[0].dwellMs / 1000 : null;
    this._jumpToStep(chain[0].idx);
  }

  _jumpToStep(i) {
    this.stepIndex = Math.max(0, Math.min(STEPS.length - 1, i));
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'u') this._u = Number(value);
    else if (id === 'a') this._a = Number(value);
    else if (id === 't') this._t = Number(value);
    this._announce(`u = ${this._u}, a = ${this._a}, t = ${this._t}`);
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < STEPS.length - 1;
  }

  _tickBeatChain(dt) {
    if (!this._lessonLinked || this._beatChainDwell == null) return;
    this._beatChainDwell -= dt;
    if (this._beatChainDwell > 0) return;
    this._beatChainPos++;
    const next = this._beatChain?.[this._beatChainPos];
    if (!next) { this._beatChainDwell = null; return; }
    this._jumpToStep(next.idx);
    this._beatChainDwell = next.dwellMs != null ? next.dwellMs / 1000 : null;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _drawInitialFrame(ctx) {
    this._tick(ctx, 0);
  }

  /** On the locked beats (0-2) the graph always shows the original worked
   *  example so the derivation reads consistently; only once freeplay
   *  unlocks (final beat) does it reflect the slider values — otherwise
   *  dragging u/a/t mid-derivation would pull the rug out from under the
   *  beat 1/2 captions, which reference the original numbers by name. */
  _activeValues() {
    const freeplay = this.stepIndex === STEPS.length - 1;
    return freeplay
      ? { u: this._u, a: this._a, t: this._t }
      : { u: DEFAULT_U, a: DEFAULT_A, t: DEFAULT_T };
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const { u, a, t } = this._activeValues();
    const v = u + a * t;
    const s = u * t + 0.5 * a * t * t;

    // dynamic axis scale so any slider combination stays fully on screen
    const tMax = Math.max(8, t * 1.15);
    const vMax = Math.max(16, Math.abs(u) + 2, Math.abs(v) + 2);
    const pxPerS = (GX1 - GX0) / tMax;
    const pxPerV = (GY0 - GY1) / (vMax * 2);
    const zeroY = GY0 - vMax * pxPerV; // v=0 line, so negative v (braking past zero) still shows
    const tx = (tt) => GX0 + tt * pxPerS;
    const vy = (vv) => zeroY - vv * pxPerV;

    this._drawAxes(ctx, tx, vy, zeroY, tMax);

    const uY = vy(u);
    const tX = tx(t);
    const vY = vy(v);

    ctx.save();
    ctx.strokeStyle = c.shape;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(GX0, uY);
    ctx.lineTo(tX, vY);
    ctx.stroke();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tX, vY);
    ctx.lineTo(tX, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (this.stepIndex >= 2) {
      ctx.save();
      ctx.fillStyle = SimDraw.withAlpha(c.good, 0.18);
      ctx.beginPath();
      ctx.moveTo(GX0, zeroY);
      ctx.lineTo(GX0, uY);
      ctx.lineTo(tX, vY);
      ctx.lineTo(tX, zeroY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(GX0, uY);
      ctx.lineTo(tX, uY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = SimDraw.withAlpha(c.wedge, 0.16);
      ctx.beginPath();
      ctx.moveTo(GX0, zeroY);
      ctx.lineTo(GX0, uY);
      ctx.lineTo(tX, uY);
      ctx.lineTo(tX, zeroY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = c.wedge;
      ctx.fillText('rectangle: u × t', GX0 + (tX - GX0) / 2 - 40, (zeroY + uY) / 2);
      ctx.fillStyle = c.good;
      ctx.fillText('triangle: ½ × t × (v − u)', GX0 + (tX - GX0) / 2 + 90, (uY + vY) / 2);
    }

    if (this.stepIndex === 1 || this.stepIndex === 3) {
      const eq = this.stepIndex === 1 ? `v = u + at = ${fmt(u)} + ${fmt(a)}×${fmt(t)} = ${fmt(v)} m/s` : `s = ut + ½at² = ${fmt(s)} m`;
      drawLabelPill(ctx, eq, W / 2, 500, { color: c.good, font: '700 18px Inter, system-ui', height: 40 });
    }

    if (this.stepIndex === STEPS.length - 1) {
      drawLabelPill(ctx, `u=${fmt(u)}  a=${fmt(a)}  t=${fmt(t)}  →  v=${fmt(v)}, s=${fmt(s)}`, W / 2, 60, { color: c.wedge, font: '700 14px Inter, system-ui' });
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawAxes(ctx, tx, vy, zeroY, tMax) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0 + 20);
    ctx.lineTo(GX1 + 20, GY0 + 20);
    ctx.moveTo(GX0, GY0 + 20);
    ctx.lineTo(GX0, GY1 - 20);
    ctx.stroke();

    // zero-velocity reference line (only meaningful once braking can cross it)
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.35);
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(GX0, zeroY);
    ctx.lineTo(GX1 + 20, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', (GX0 + GX1) / 2, GY0 + 46);
    ctx.save();
    ctx.translate(GX0 - 32, (GY0 + GY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Velocity (m/s)', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 565, 660, 24, 'center');
    ctx.restore();
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) {
    if (this._liveRegion) this._liveRegion.textContent = text;
  }

  _announceStep() {
    this._announce(STEPS[this.stepIndex].caption);
  }
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
