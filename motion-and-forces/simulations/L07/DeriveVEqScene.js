import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';
import { computeGraph, drawVTAxes, drawVTLine, drawVTPoints, drawRiseRun, fmt } from '../shared/KinematicGraphKit.js';

/**
 * DeriveVEqScene — companion to blk-l07-s17.
 * Walks v = u + at algebra step by step, each beat updating one formula
 * pill while the same rise/run picture stays on screen underneath. The
 * final beat swaps to the slide's own "quick check" numbers (u=0, a=2,
 * t=3) so the viewer sees a visibly different, smaller line confirming the
 * equation isn't tied to one specific worked example.
 */

const W = 900;
const H = 600;
const U = 8, A = 2, T = 6;
const CHECK_U = 0, CHECK_A = 2, CHECK_T = 3;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', '#38bdf8'],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', '#34d399'],
};

const STEPS = [
  { caption: 'Start from the definition of acceleration: a = (v − u) ÷ t.', eq: null },
  { caption: 'Multiply both sides by t to clear the fraction: at = v − u.', eq: 'at = v − u' },
  { caption: 'Add u to both sides: u + at = v.', eq: 'u + at = v' },
  { caption: 'Written the usual way round — the first kinematic equation.', eq: 'v = u + at' },
  { caption: 'Quick check with different numbers: u = 0, a = 2, t = 3.', eq: null },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

export class DeriveVEqScene extends CanvasSimulation {
  static simId = 'derive-v-eq';
  static label = { en: 'Deriving v = u + at' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph with the rise, v minus u, and run, t, marked. Step by step, the algebra a equals ' +
    'v minus u over t is rearranged into v equals u plus a t. On the final beat, the same picture redraws ' +
    'with a smaller check example, u equals zero, a equals two, t equals three, giving v equals six.';

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;
    this.colors = null;
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

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

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

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawScene(ctx, step) {
    const c = this.colors;
    const isCheck = this.stepIndex === STEPS.length - 1;
    const g = isCheck ? computeGraph(CHECK_U, CHECK_A, CHECK_T) : computeGraph(U, A, T);

    drawVTAxes(ctx, c, g);
    drawVTLine(ctx, c, g);
    drawVTPoints(ctx, c, g, { labelU: !isCheck, labelV: !isCheck });
    if (!isCheck) drawRiseRun(ctx, c, g);

    if (step.eq) {
      drawLabelPill(ctx, step.eq, W / 2, 500, { color: c.good, font: '700 22px Inter, system-ui', height: 40 });
    }

    if (isCheck) {
      const v = CHECK_U + CHECK_A * CHECK_T;
      drawLabelPill(ctx, `v = ${fmt(CHECK_U)} + (${fmt(CHECK_A)})(${fmt(CHECK_T)}) = ${fmt(v)} m/s`,
        W / 2, 500, { color: c.good, font: '700 20px Inter, system-ui', height: 40 });
    }

    this._drawCaption(ctx, step.caption);
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

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }
  _announceStep() { this._announce(STEPS[this.stepIndex].caption); }
}
