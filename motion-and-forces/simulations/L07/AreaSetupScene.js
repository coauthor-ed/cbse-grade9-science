import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';
import { computeGraph, drawVTAxes, drawVTLine, drawVTPoints } from '../shared/KinematicGraphKit.js';

/**
 * AreaSetupScene — companion to blk-l07-s18.
 * Bridges "area under a velocity-time graph is displacement" (taught with
 * a numeric example in les-06) into the general trapezium this lesson is
 * about to split into a rectangle and a triangle. Beat 2 shades the whole
 * trapezium in one flat color; beat 3 previews the split with a dashed
 * line at height u, without yet coloring the two pieces differently —
 * that reveal is blk-l07-s19's job.
 */

const W = 900;
const H = 600;
const U = 8, A = 2, T = 6;

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
  { caption: 'The same velocity-time graph: a straight line from u to v over time t.' },
  { caption: 'From the velocity-time graphs lesson: the area under this line is the displacement.' },
  { caption: 'Shade the whole area from 0 to t — a shape called a trapezium.' },
  { caption: 'You have split a shape like this before, into a rectangle and a triangle. Let’s do it in general.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class AreaSetupScene extends CanvasSimulation {
  static simId = 'area-setup';
  static label = { en: 'From Slope to Area' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph, straight line from u to v over time t. The whole area under the line is shaded ' +
    'as a trapezium, representing the displacement. A dashed line at height u previews splitting that shape ' +
    'into a rectangle and a triangle.';

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

    drawVTAxes(ctx, c, g);

    if (this.stepIndex >= 2) {
      ctx.save();
      ctx.fillStyle = SimDraw.withAlpha(c.good, 0.16);
      ctx.beginPath();
      ctx.moveTo(g.x0, g.zeroY);
      ctx.lineTo(g.x0, g.uY);
      ctx.lineTo(g.tX, g.vY);
      ctx.lineTo(g.tX, g.zeroY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawVTLine(ctx, c, g);
    drawVTPoints(ctx, c, g, { labelU: this.stepIndex === 0, labelV: this.stepIndex === 0 });

    if (this.stepIndex === 1) {
      drawLabelPill(ctx, 'area under the line = displacement', W / 2, 500, { color: c.good, font: '700 18px Inter, system-ui', height: 36 });
    }
    if (this.stepIndex === 2) {
      drawLabelPill(ctx, 'this whole shaded region is called a trapezium', W / 2, 500, { color: c.good, font: '700 16px Inter, system-ui', height: 32 });
    }
    if (this.stepIndex === 3) {
      ctx.save();
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(g.x0, g.uY);
      ctx.lineTo(g.tX, g.uY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      drawLabelPill(ctx, 'split here: rectangle + triangle?', (g.x0 + g.tX) / 2, g.uY - 18, { color: c.wedge });
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
