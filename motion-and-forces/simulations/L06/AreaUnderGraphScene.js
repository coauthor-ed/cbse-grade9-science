import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * AreaUnderGraphScene — companion to blk-l06-s4 (Example 4.18b).
 * Between 10 s and 20 s a car's velocity rises from 5 to 10 m/s. The area
 * under the graph splits into a rectangle (5 x 10 = 50 m) and a triangle
 * (1/2 x 10 x 5 = 25 m), total 75 m — the displacement.
 */

const W = 900;
const H = 600;

const GX0 = 180, GY0 = 400, GX1 = 800, GY1 = 80;
const T_MIN = 0, T_MAX = 30;
const V_MAX = 15;
const PX_PER_S = (GX1 - GX0) / (T_MAX - T_MIN);
const PX_PER_V = (GY0 - GY1) / V_MAX;

const TA = 10, TB = 20;
const VA = 5, VB = 10;

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
  { caption: 'Between 10 s and 20 s, a car’s velocity rises steadily from 5 m s⁻¹ to 10 m s⁻¹.' },
  { caption: 'Shade the area under that part of the graph. It splits into a rectangle and a triangle.' },
  { caption: 'Rectangle 5 × 10 = 50 m. Triangle ½ × 10 × 5 = 25 m. Total = 75 m — the displacement.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class AreaUnderGraphScene extends CanvasSimulation {
  static simId = 'area-under-velocity-time';
  static label = { en: 'Displacement as area under a velocity-time graph' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph where the velocity rises from five metres per second at ten seconds to ten metres ' +
    'per second at twenty seconds. The area under the graph splits into a rectangle of five by ten metres ' +
    'and a triangle of half times ten times five metres, giving seventy-five metres of displacement.';

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

  _tx(t) { return GX0 + (t - T_MIN) * PX_PER_S; }
  _vy(v) { return GY0 - v * PX_PER_V; }

  _drawScene(ctx, step) {
    const c = this.colors;
    this._drawAxes(ctx);

    // line segments: 0..TA at VA, TA..TB rising VA->VB, TB..end flat at VB
    ctx.save();
    ctx.strokeStyle = c.shape;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this._tx(0), this._vy(VA));
    ctx.lineTo(this._tx(TA), this._vy(VA));
    ctx.lineTo(this._tx(TB), this._vy(VB));
    ctx.lineTo(this._tx(T_MAX), this._vy(VB));
    ctx.stroke();
    ctx.restore();

    const xA = this._tx(TA), xB = this._tx(TB);
    const yA = this._vy(VA), yB = this._vy(VB);

    if (this.stepIndex >= 1) {
      // shaded area
      ctx.save();
      ctx.fillStyle = SimDraw.withAlpha(c.good, 0.2);
      ctx.beginPath();
      ctx.moveTo(xA, GY0);
      ctx.lineTo(xA, yA);
      ctx.lineTo(xB, yB);
      ctx.lineTo(xB, GY0);
      ctx.closePath();
      ctx.fill();

      // rectangle + triangle split
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(xA, yA); ctx.lineTo(xB, yA);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = SimDraw.withAlpha(c.wedge, 0.18);
      ctx.beginPath();
      ctx.moveTo(xA, GY0); ctx.lineTo(xA, yA); ctx.lineTo(xB, yA); ctx.lineTo(xB, GY0);
      ctx.closePath();
      ctx.fill();

      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = c.wedge;
      ctx.fillText('rectangle', (xA + xB) / 2, (GY0 + yA) / 2);
      ctx.fillStyle = c.good;
      ctx.fillText('triangle', (xA + xB) / 2, (yA + yB) / 2 + 4);
      ctx.restore();
    }

    if (this.stepIndex === 2) {
      SimDraw.drawPanel(ctx, W / 2 - 240, 460, 480, 72, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.wedge;
      ctx.fillText('rectangle: 5 × 10 = 50 m', W / 2, 488);
      ctx.fillStyle = c.good;
      ctx.fillText('triangle: ½ × 10 × 5 = 25 m   →   total 75 m', W / 2, 514);
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
    for (let s = 0; s <= T_MAX; s += 10) {
      ctx.fillText(`${s}`, this._tx(s), GY0 + 20);
    }
    ctx.fillText('Time (s)', (GX0 + GX1) / 2, GY0 + 44);
    ctx.textAlign = 'right';
    for (let v = 0; v <= V_MAX; v += 5) {
      ctx.fillText(`${v}`, GX0 - 10, this._vy(v) + 4);
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
    this._wrapText(ctx, caption, W / 2 - 330, 400, 660, 24, 'center');
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