import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * PlotPositionTimeScene — companion to blk-l05-s1 (Activity 4.3, Fig 4.11).
 * A vehicle moves along a straight road while its position each second is
 * plotted live on a position-time graph. The points fall on a straight line.
 */

const W = 900;
const H = 600;

const ROAD_Y = 150;
const ROAD_X0 = 140;
const ROAD_X1 = 820;
const MAX_POS = 120;

const GX0 = 330;      // graph origin x
const GY0 = 420;      // graph origin y (bottom of plot)
const GX1 = 820;
const GY1 = 90;       // top of plot
const T_MAX = 6;
const PX_PER_S = (GX1 - GX0) / T_MAX;
const PX_PER_M = (GY0 - GY1) / MAX_POS;

const DATA = [0, 20, 40, 60, 80, 100, 120]; // position at t = 0..6 s
const SCENE_SEC = 4;

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
  { caption: 'A vehicle moves along a straight road. The table records its position at each second: 0, 20, 40, 60, 80, 100, 120 m.' },
  { caption: 'Each second, a point is plotted: position on the vertical axis, time on the horizontal axis.' },
  { caption: 'Connect the points and they fall on a straight line. That straight line is the position-time graph.' },
  { caption: 'A graph is not a route map. It does not show the route — it shows how position changes with time.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class PlotPositionTimeScene extends CanvasSimulation {
  static simId = 'plot-position-time';
  static label = { en: 'Plotting a position-time graph' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A car drives along a straight road. Each second its position is plotted on a graph with time on the ' +
    'horizontal axis and position on the vertical axis. At zero seconds the car is at zero metres, at one second ' +
    'twenty metres, and so on up to one hundred and twenty metres at six seconds. The points fall on a straight ' +
    'line, which is the position-time graph.';

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

  _simTime() {
    if (this.stepIndex === 0) return 0;
    return Math.min(T_MAX, (this._stepEnterTime / SCENE_SEC) * T_MAX);
  }

  _plottedCount() {
    if (this.stepIndex === 0) return 1;
    return Math.max(1, Math.min(DATA.length, Math.floor(this._simTime() / 0.6) + 1));
  }

  _carX() {
    const pos = 20 * this._simTime();
    const frac = Math.min(1, pos / MAX_POS);
    return ROAD_X0 + frac * (ROAD_X1 - ROAD_X0);
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    this._drawRoad(ctx);
    this._drawCar(ctx);
    this._drawGraph(ctx);
    this._drawCaption(ctx, step.caption);
  }

  _drawRoad(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ROAD_X0 - 60, ROAD_Y);
    ctx.lineTo(ROAD_X1 + 40, ROAD_Y);
    ctx.stroke();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText('road', (ROAD_X0 + ROAD_X1) / 2, ROAD_Y - 24);
    ctx.restore();
  }

  _drawCar(ctx) {
    const c = this.colors;
    const x = this._carX();
    ctx.save();
    ctx.fillStyle = c.shape;
    ctx.beginPath();
    ctx.roundRect(x - 26, ROAD_Y - 26, 52, 24, 8);
    ctx.fill();
    ctx.fillStyle = c.bgDeep;
    ctx.beginPath();
    ctx.arc(x - 12, ROAD_Y - 2, 6, 0, Math.PI * 2);
    ctx.arc(x + 12, ROAD_Y - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(20 * this._simTime())} m`, x, ROAD_Y - 38);
    ctx.restore();
  }

  _drawGraph(ctx) {
    const c = this.colors;
    ctx.save();
    // axes
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
      const x = GX0 + s * PX_PER_S;
      ctx.fillText(`${s}`, x, GY0 + 20);
    }
    ctx.fillText('Time (s)', (GX0 + GX1) / 2, GY0 + 44);
    ctx.textAlign = 'right';
    for (let m = 0; m <= MAX_POS; m += 40) {
      const y = GY0 - m * PX_PER_M;
      ctx.fillText(`${m}`, GX0 - 10, y + 4);
    }
    ctx.save();
    ctx.translate(GX0 - 10, (GY0 + GY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Position (m)', 0, 0);
    ctx.restore();

    const count = this._plottedCount();
    if (this.stepIndex >= 1) {
      // plotted points
      for (let i = 0; i < count; i++) {
        const t = i;
        const x = GX0 + t * PX_PER_S;
        const y = GY0 - DATA[i] * PX_PER_M;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = c.wedge;
        ctx.fill();
      }
      // connecting line once enough points exist
      if (count === DATA.length) {
        ctx.strokeStyle = c.shape;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(GX0, GY0);
        ctx.lineTo(GX0 + 6 * PX_PER_S, GY0 - 120 * PX_PER_M);
        ctx.stroke();
      }
      // table
      SimDraw.drawPanel(ctx, 60, 60, 210, 230, { bg: c.panelBg, radius: 8, stroke: SimDraw.withAlpha(c.muted, 0.3), lineWidth: 1 });
      ctx.font = '600 12px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'left';
      ctx.fillText('Time (s)', 80, 88);
      ctx.fillText('Position (m)', 190, 88);
      ctx.fillStyle = c.label;
      let rowY = 108;
      for (let i = 0; i <= 6; i++) {
        const active = i < count;
        ctx.fillStyle = active ? c.wedge : c.muted;
        ctx.fillText(`${i}`, 80, rowY);
        ctx.fillStyle = active ? c.label : c.muted;
        ctx.fillText(`${DATA[i]}`, 200, rowY);
        rowY += 20;
      }
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
    this._wrapText(ctx, caption, W / 2 - 330, 500, 660, 24, 'center');
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