import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * CompareSlopesScene — companion to blk-l05-s2 / blk-l05-s3 (Example 4.7).
 * Position-time graphs of two objects A and B from the same origin. In the
 * same time interval B travels further, so B's line is steeper and B's
 * velocity is higher. Slope of a position-time graph = velocity.
 */

const W = 900;
const H = 600;

const GX0 = 160, GY0 = 400, GX1 = 820, GY1 = 90;
const T_MAX = 5;
const S_MAX = 100;
const PX_PER_S = (GX1 - GX0) / T_MAX;
const PX_PER_M = (GY0 - GY1) / S_MAX;

// A: 50 m in 5 s (10 m/s); B: 100 m in 5 s (20 m/s)
const A_POS = 50, B_POS = 100;
const T_CMP = 3; // comparison instant

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
  { caption: 'Two objects A and B start together at the origin. Their position-time graphs are straight lines of different steepness.' },
  { caption: 'At the same instant, B is further from the origin than A. In the same time interval, B has the larger displacement.' },
  { caption: 'The slope of a position-time graph is the velocity. B’s steeper line means B’s velocity is higher.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class CompareSlopesScene extends CanvasSimulation {
  static simId = 'compare-position-time-slopes';
  static label = { en: 'Slope of a position-time graph is velocity' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Two position-time graphs, A and B, both starting at the origin. In the same time interval B travels ' +
    'further, so its line is steeper. The slope of a position-time graph gives the velocity, so B has the ' +
    'higher velocity.';

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

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
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

  _drawInitialFrame(ctx) {
    this._tick(ctx, 0);
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    this._drawAxes(ctx);

    // lines
    ctx.save();
    ctx.strokeStyle = c.shape;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX0 + T_MAX * PX_PER_S, GY0 - A_POS * PX_PER_M);
    ctx.stroke();
    ctx.strokeStyle = c.wedge;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX0 + T_MAX * PX_PER_S, GY0 - B_POS * PX_PER_M);
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex >= 1) {
      // vertical dashed line at T_CMP and displacement measures
      const x = GX0 + T_CMP * PX_PER_S;
      const aY = GY0 - (A_POS / T_MAX) * T_CMP * PX_PER_M;
      const bY = GY0 - (B_POS / T_MAX) * T_CMP * PX_PER_M;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, GY0);
      ctx.lineTo(x, GY1 - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = c.shape;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, aY);
      ctx.lineTo(x + 60, aY);
      ctx.stroke();
      ctx.strokeStyle = c.wedge;
      ctx.beginPath();
      ctx.moveTo(x, bY);
      ctx.lineTo(x + 60, bY);
      ctx.stroke();

      ctx.font = '700 14px Inter, system-ui';
      ctx.textAlign = 'left';
      ctx.fillStyle = c.wedge;
      ctx.fillText('B: larger displacement', x + 70, bY);
      ctx.fillStyle = c.shape;
      ctx.fillText('A: smaller displacement', x + 70, aY);
      ctx.restore();
    }

    if (this.stepIndex === 2) {
      SimDraw.drawPanel(ctx, W / 2 - 260, 470, 520, 70, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillStyle = c.label;
      ctx.fillText('slope of position-time graph = velocity', W / 2, 504);
      ctx.fillStyle = c.wedge;
      ctx.fillText('steeper slope → higher velocity (B)', W / 2, 528);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawAxes(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX1 + 20, GY0);
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX0, GY1 - 20);
    ctx.stroke();

    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    for (let s = 0; s <= T_MAX; s++) {
      ctx.fillText(`${s}`, GX0 + s * PX_PER_S, GY0 + 20);
    }
    ctx.fillText('Time (s)', (GX0 + GX1) / 2, GY0 + 44);
    ctx.textAlign = 'right';
    for (let m = 0; m <= S_MAX; m += 50) {
      ctx.fillText(`${m}`, GX0 - 10, GY0 - m * PX_PER_M + 4);
    }
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 565, 660, 24, 'center');
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
    const prev = ctx.textAlign;
    ctx.textAlign = align;
    const words = text.split(' ');
    let line = '';
    let cy = y;
    const drawX = align === 'center' ? x + maxWidth / 2 : x;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, drawX, cy);
        line = word;
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, drawX, cy);
    ctx.textAlign = prev;
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