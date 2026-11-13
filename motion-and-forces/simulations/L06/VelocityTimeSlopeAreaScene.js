import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * VelocityTimeSlopeAreaScene — companion to blk-l06-s3.
 * A velocity-time graph of a car speeding up at constant acceleration.
 * Slope = acceleration; the area under the line = displacement.
 */

const W = 900;
const H = 600;

const GX0 = 180, GY0 = 420, GX1 = 800, GY1 = 80;
const T_MAX = 6;
const V_MAX = 20;
const PX_PER_S = (GX1 - GX0) / T_MAX;
const PX_PER_V = (GY0 - GY1) / V_MAX;

const T1 = 2, T2 = 5; // slope/area interval

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
  { caption: 'A velocity-time graph of a car speeding up at constant acceleration.' },
  { caption: 'Slope of the line = change in velocity per second = acceleration.' },
  { caption: 'Area enclosed between the line and the time axis = displacement in that interval.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class VelocityTimeSlopeAreaScene extends CanvasSimulation {
  static simId = 'velocity-time-slope-area';
  static label = { en: 'Slope gives acceleration, area gives displacement' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph rising in a straight line. The slope of the line is the change in velocity divided ' +
    'by the change in time, which is the acceleration. The area enclosed between the line and the time axis is ' +
    'velocity multiplied by time, which is the displacement.';

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

  _v(t) { return t * (V_MAX / T_MAX); }

  _drawScene(ctx, step) {
    const c = this.colors;
    this._drawAxes(ctx);

    // line from origin to (T_MAX, V_MAX)
    ctx.save();
    ctx.strokeStyle = c.shape;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX0 + T_MAX * PX_PER_S, GY0 - V_MAX * PX_PER_V);
    ctx.stroke();
    ctx.restore();

    const x1 = GX0 + T1 * PX_PER_S;
    const x2 = GX0 + T2 * PX_PER_S;
    const y1 = GY0 - this._v(T1) * PX_PER_V;
    const y2 = GY0 - this._v(T2) * PX_PER_V;

    if (this.stepIndex === 1) {
      // slope triangle
      ctx.save();
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '700 15px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = c.wedge;
      ctx.fillText('v − u', x2 + 52, (y1 + y2) / 2);
      ctx.fillText('t₂ − t₁', (x1 + x2) / 2, y1 + 28);
      ctx.fillStyle = c.label;
      ctx.fillText('slope = (v − u) ÷ (t₂ − t₁) = acceleration', W / 2, 170);
      ctx.restore();
    }

    if (this.stepIndex === 2) {
      // shaded area between x1..x2 under the line
      ctx.save();
      ctx.fillStyle = SimDraw.withAlpha(c.good, 0.22);
      ctx.beginPath();
      ctx.moveTo(x1, GY0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, GY0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c.good;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x1, GY0);
      ctx.moveTo(x2, y2); ctx.lineTo(x2, GY0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '700 15px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = c.good;
      ctx.fillText('area under graph = displacement', W / 2, 170);
      ctx.restore();
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
    for (let s = 0; s <= T_MAX; s += 2) {
      ctx.fillText(`${s}`, GX0 + s * PX_PER_S, GY0 + 20);
    }
    ctx.fillText('Time (s)', (GX0 + GX1) / 2, GY0 + 44);
    ctx.textAlign = 'right';
    for (let v = 0; v <= V_MAX; v += 10) {
      ctx.fillText(`${v}`, GX0 - 10, GY0 - v * PX_PER_V + 4);
    }
    ctx.save();
    ctx.translate(GX0 - 10, (GY0 + GY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Velocity (m s⁻¹)', 0, 0);
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
    this._wrapText(ctx, caption, W / 2 - 330, 490, 660, 24, 'center');
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