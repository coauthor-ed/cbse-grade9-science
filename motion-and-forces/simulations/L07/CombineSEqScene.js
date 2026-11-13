import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';
import { computeGraph, drawVTAxes, drawVTLine, drawRectangle, drawTriangle, drawRiseRun, fmt } from '../shared/KinematicGraphKit.js';

/**
 * CombineSEqScene — companion to blk-l07-s20.
 * Same rectangle+triangle picture as blk-l07-s19, now with the algebra
 * running underneath it: the triangle's own height bracket, (v−u), is
 * highlighted and tied back to "= at" from the first equation, then the
 * formula pill morphs beat by beat into s = ut + ½at². The final beat
 * repeats the u=0,a=2,t=3 check from blk-l07-s17, now checking s instead
 * of v, so the two "quick check" moments visibly use the same numbers.
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
  { caption: 'From the area: s = ut + ½t(v − u).', eq: 's = ut + ½t(v − u)' },
  { caption: 'That (v − u) is exactly what we found deriving the first equation: v − u = at.', eq: null, highlightRise: true },
  { caption: 'Substitute it in: s = ut + ½t(at).', eq: 's = ut + ½t(at)' },
  { caption: 'Simplify the second term: s = ut + ½at².', eq: 's = ut + ½at²' },
  { caption: 'The second kinematic equation. Check: u=0, a=2, t=3.', eq: null },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

export class CombineSEqScene extends CanvasSimulation {
  static simId = 'combine-s-eq';
  static label = { en: 'Deriving s = ut + ½at²' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph split into a rectangle and a triangle. The triangle height, v minus u, is ' +
    'highlighted and tied to a t from the first equation, and the displacement formula morphs step by ' +
    'step into s equals u t plus one half a t squared. The final beat checks the formula with a smaller ' +
    'example, u equals zero, a equals two, t equals three, giving s equals nine.';

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
    drawRectangle(ctx, c, g, { label: !isCheck });
    drawTriangle(ctx, c, g, { label: !isCheck });
    drawVTLine(ctx, c, g, { drop: false });

    if (step.highlightRise) {
      drawRiseRun(ctx, c, g, { showRun: false, riseLabel: 'v − u = at' });
    }

    if (step.eq) {
      drawLabelPill(ctx, step.eq, W / 2, 500, { color: c.good, font: '700 20px Inter, system-ui', height: 40 });
    }

    if (isCheck) {
      const s = CHECK_U * CHECK_T + 0.5 * CHECK_A * CHECK_T * CHECK_T;
      drawLabelPill(ctx, `s = ut + ½at² = ${fmt(s)} m`, W / 2, 500, { color: c.good, font: '700 20px Inter, system-ui', height: 40 });
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
