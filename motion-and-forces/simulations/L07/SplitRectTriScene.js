import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';
import { computeGraph, drawVTAxes, drawVTLine, drawRectangle, drawTriangle } from '../shared/KinematicGraphKit.js';

/**
 * SplitRectTriScene — companion to blk-l07-s19.
 * Reveals the rectangle (u × t) and triangle (½ × t × (v−u)) one at a
 * time, then on beat 2 contrasts the real straight top edge against a
 * faint dashed curved alternative, to make "why constant acceleration
 * makes this a triangle" a visible fact rather than an assertion.
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
  bad:     ['--sim-motion-bad', '#f87171'],
};

const STEPS = [
  { caption: 'The bottom piece is a rectangle: width t, height u.' },
  { caption: 'The top piece is a triangle: base t, height (v − u), the extra velocity gained.' },
  { caption: 'This only works because the top edge is perfectly straight — constant acceleration. A curved edge would not be a triangle.' },
  { caption: 'Displacement is the whole shaded area: rectangle plus triangle.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SplitRectTriScene extends CanvasSimulation {
  static simId = 'split-rect-tri';
  static label = { en: 'Splitting the Trapezium' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph trapezium split into a bottom rectangle, width t and height u, and a top ' +
    'triangle, base t and height v minus u. A faint curved dashed line contrasts with the real straight ' +
    'edge, showing why constant acceleration is what makes the top piece a true triangle.';

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
    drawRectangle(ctx, c, g);
    if (this.stepIndex >= 1) drawTriangle(ctx, c, g);

    if (this.stepIndex === 2) {
      ctx.save();
      ctx.strokeStyle = SimDraw.withAlpha(c.bad, 0.85);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(g.x0, g.uY);
      const midX = (g.x0 + g.tX) / 2, midY = g.uY - (g.uY - g.vY) * 0.25;
      ctx.quadraticCurveTo(midX, midY, g.tX, g.vY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      drawLabelPill(ctx, 'a curved top edge would not be a triangle', g.tX - 60, g.vY - 30, { color: c.bad });
    }

    drawVTLine(ctx, c, g, { drop: false });

    if (this.stepIndex === 3) {
      drawLabelPill(ctx, 's = ut + ½t(v − u)', W / 2, 500, { color: c.good, font: '700 20px Inter, system-ui', height: 40 });
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
