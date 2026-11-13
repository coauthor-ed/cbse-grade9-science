import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * PositionTimeShapesScene — companion to blk-l05-s4 (Figs 4.13, 4.15).
 * Three position-time shapes side by side: a straight line (constant
 * velocity), a curve (changing velocity, accelerated motion), and a
 * horizontal line (at rest). Each beat highlights one shape and names its
 * meaning.
 */

const W = 900;
const H = 600;

const PANELS = [
  { x: 70, y: 110, w: 230, h: 300, type: 'line', colorKey: 'shape', title: '(a) straight line' },
  { x: 335, y: 110, w: 230, h: 300, type: 'curve', colorKey: 'wedge', title: '(b) curve' },
  { x: 600, y: 110, w: 230, h: 300, type: 'flat', colorKey: 'good', title: '(c) horizontal line' },
];

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
  { caption: 'The shape of a position-time graph reveals the nature of the motion. Three shapes to read.' },
  { caption: 'A straight line: equal displacements in equal times — constant velocity.' },
  { caption: 'A curve: the displacements keep growing — velocity is changing, so the motion is accelerated.' },
  { caption: 'A horizontal line: the position never changes — the object is at rest.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class PositionTimeShapesScene extends CanvasSimulation {
  static simId = 'position-time-shapes';
  static label = { en: 'Reading position-time graph shapes' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Three position-time graphs. A straight rising line means constant velocity. A curved line means the ' +
    'velocity is changing, so the motion is accelerated. A horizontal line means the object is at rest.';

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
    for (let i = 0; i < PANELS.length; i++) {
      this._drawPanel(ctx, PANELS[i], i);
    }
    this._drawCaption(ctx, step.caption);
  }

  _drawPanel(ctx, panel, idx) {
    const c = this.colors;
    const color = c[panel.colorKey];
    const active = this.stepIndex === idx + 1;

    ctx.save();
    SimDraw.drawPanel(ctx, panel.x, panel.y, panel.w, panel.h, {
      bg: c.panelBg,
      radius: 10,
      stroke: active ? color : SimDraw.withAlpha(c.muted, 0.3),
      lineWidth: active ? 3 : 1.5,
    });

    const ox = panel.x + 50;
    const oy = panel.y + panel.h - 50;
    const pw = panel.w - 90;
    const ph = panel.h - 130;

    // axes
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + pw, oy);
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy - ph);
    ctx.stroke();

    ctx.font = '600 11px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText('Time', ox + pw / 2, oy + 18);
    ctx.textAlign = 'left';
    ctx.fillText('Position', ox - 40, oy - ph - 8);

    // shape
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (panel.type === 'line') {
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + pw, oy - ph);
    } else if (panel.type === 'curve') {
      ctx.moveTo(ox, oy);
      ctx.bezierCurveTo(ox + pw * 0.4, oy - ph * 0.2, ox + pw * 0.6, oy - ph * 0.9, ox + pw, oy - ph * 0.35);
    } else {
      ctx.moveTo(ox, oy - ph * 0.5);
      ctx.lineTo(ox + pw, oy - ph * 0.5);
    }
    ctx.stroke();

    ctx.fillStyle = c.label;
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(panel.title, panel.x + panel.w / 2, panel.y + 26);

    if (active) {
      ctx.fillStyle = color;
      ctx.font = '700 14px Inter, system-ui';
      const labels = ['constant velocity', 'changing velocity → accelerated', 'at rest'];
      this._wrapText(ctx, labels[idx], panel.x + panel.w / 2, panel.y + panel.h - 18, panel.w - 30, 18, 'center');
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
    this._wrapText(ctx, caption, W / 2 - 330, 460, 660, 24, 'center');
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