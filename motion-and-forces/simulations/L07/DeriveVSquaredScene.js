import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';
import { computeGraph, drawVTAxes, drawVTLine, drawVTPoints, fmt } from '../shared/KinematicGraphKit.js';

/**
 * DeriveVSquaredScene — companion to blk-l07-s22.
 * Same braking-car picture as blk-l07-s21 (u=15, a=-4, v=0), held static
 * in the background while the formula pill morphs through each algebra
 * step of eliminating t, ending in v² = u² + 2as with a live numeric
 * check against the same numbers blk-l07-s3 uses next.
 */

const W = 900;
const H = 600;
const U = 15, A = -4, T = 3.75;

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
  { caption: 'Substitute t = (v−u)÷a into s = ut + ½at² everywhere t appears.', eq: 's = u(v-u)/a + ½a[(v-u)/a]²' },
  { caption: 'Squaring the fraction and cancelling one factor of a in the second term.', eq: 's = u(v-u)/a + (v-u)²/2a' },
  { caption: 'Both terms already share the denominator a — write over a common 2a.', eq: 's = [2u(v-u) + (v-u)²] / 2a' },
  { caption: 'Factor (v − u) out of the numerator.', eq: '2u(v-u)+(v-u)² = (v-u)(v+u)' },
  { caption: '(v − u)(v + u) is the difference-of-squares pattern: v² − u².', eq: 's = (v² - u²) / 2a' },
  { caption: 'Multiply by 2a and rearrange — the third kinematic equation.', eq: 'v² = u² + 2as' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
  [{ idx: 5, dwellMs: null }],
];

export class DeriveVSquaredScene extends CanvasSimulation {
  static simId = 'derive-v-squared';
  static label = { en: 'Deriving v² = u² + 2as' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph for a braking car, fifteen metres per second decelerating at four metres per ' +
    'second squared to rest. Underneath, an algebra formula morphs step by step from substituting t into ' +
    'the second equation, through factoring and the difference of squares, to the final third kinematic ' +
    'equation, v squared equals u squared plus two a s, with a live numeric check against the same numbers.';

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
    const g = computeGraph(U, A, T);
    const v = U + A * T;
    const s = U * T + 0.5 * A * T * T;

    drawVTAxes(ctx, c, g);
    drawVTLine(ctx, c, g);
    drawVTPoints(ctx, c, g, { labelU: false, labelV: false });
    drawLabelPill(ctx, `u = ${fmt(U)}, v = ${fmt(v)}, a = ${fmt(A)}, s = ${fmt(s)}`, W / 2, 130, { color: c.muted, font: '600 13px Inter, system-ui' });

    drawLabelPill(ctx, step.eq, W / 2, 500, {
      color: this.stepIndex === STEPS.length - 1 ? c.good : c.wedge,
      font: '700 16px Inter, system-ui',
      height: 34,
    });

    if (this.stepIndex === STEPS.length - 1) {
      const lhs = v * v;
      const rhs = U * U + 2 * A * s;
      drawLabelPill(ctx, `check: ${fmt(v)}² = ${fmt(lhs)}   and   ${fmt(U)}² + 2(${fmt(A)})(${fmt(s)}) = ${fmt(rhs)} ✓`,
        W / 2, 540, { color: c.good, font: '700 13px Inter, system-ui', height: 28 });
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
    wrapText(ctx, caption, W / 2 - 340, 572, 680, 22, 'center');
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
