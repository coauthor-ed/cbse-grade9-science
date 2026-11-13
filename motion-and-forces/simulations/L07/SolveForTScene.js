import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';
import { computeGraph, drawVTAxes, drawVTLine, drawVTPoints, fmt } from '../shared/KinematicGraphKit.js';

/**
 * SolveForTScene — companion to blk-l07-s21.
 * Uses the same braking-car numbers (u=15, a=-4, coming to rest at v=0)
 * that blk-l07-s3's worked example already uses, so this derivation and
 * that application visibly share one scenario. t itself is drawn as an
 * unknown — hidden behind a "?" — until the algebra solves for it.
 */

const W = 900;
const H = 600;
const U = 15, A = -4, T = 3.75; // v = 0 at t = 3.75s

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
  { caption: 'u, a and s are known here; t is not. A formula with no t at all would be more useful.' },
  { caption: 'Start again from the first equation: v = u + at.' },
  { caption: 'Subtract u, then divide by a: t = (v − u) ÷ a.' },
  { caption: 't is now written purely in terms of v, u and a — ready to substitute into the second equation.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SolveForTScene extends CanvasSimulation {
  static simId = 'solve-for-t';
  static label = { en: 'Solving for t' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph for a braking car, starting at fifteen metres per second, decelerating at four ' +
    'metres per second squared, coming to rest. The stopping time t is shown as an unknown, marked with a ' +
    'question mark, until the algebra solves t equals v minus u over a, revealing t equals three point ' +
    'seven five seconds.';

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
    const tKnown = this.stepIndex >= 2;

    drawVTAxes(ctx, c, g);
    drawVTLine(ctx, c, g, { drop: tKnown });
    drawVTPoints(ctx, c, g, { labelU: false, labelV: false });
    drawLabelPill(ctx, `u = ${fmt(U)}`, g.x0 - 8, g.uY - 20, { color: c.shape });
    drawLabelPill(ctx, `v = ${fmt(U + A * T)} (stopped)`, g.tX + 10, g.vY - 20, { color: c.shape });

    if (!tKnown) {
      drawLabelPill(ctx, 't = ?', g.tX, g.zeroY + 32, { color: c.wedge, font: '700 18px Inter, system-ui', height: 32 });
    } else {
      drawLabelPill(ctx, `t = ${fmt(T)} s`, g.tX, g.zeroY + 32, { color: c.good, font: '700 18px Inter, system-ui', height: 32 });
    }

    if (this.stepIndex === 1) {
      drawLabelPill(ctx, 'v = u + at', W / 2, 500, { color: c.good, font: '700 20px Inter, system-ui', height: 40 });
    }
    if (this.stepIndex === 2) {
      drawLabelPill(ctx, `t = (v − u) ÷ a = (${fmt(U + A * T)} − ${fmt(U)}) ÷ (${fmt(A)}) = ${fmt(T)} s`,
        W / 2, 500, { color: c.good, font: '700 16px Inter, system-ui', height: 36 });
    }
    if (this.stepIndex === 3) {
      drawLabelPill(ctx, 't = (v − u) ÷ a', W / 2, 500, { color: c.good, font: '700 20px Inter, system-ui', height: 40 });
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
