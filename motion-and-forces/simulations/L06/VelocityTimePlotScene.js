import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * VelocityTimePlotScene — companion to blk-l06-s1 (Fig 4.17).
 * Three velocity-time graphs: a flat line (constant velocity, zero
 * acceleration), a rising line (constant acceleration with velocity) and a
 * falling line (constant acceleration opposite to velocity). Each beat
 * highlights one shape.
 */

const W = 900;
const H = 600;

const PANELS = [
  { x: 70, y: 120, w: 230, h: 290, type: 'flat', colorKey: 'shape', title: '(a) steady cruise' },
  { x: 335, y: 120, w: 230, h: 290, type: 'rising', colorKey: 'wedge', title: '(b) speeding up' },
  { x: 600, y: 120, w: 230, h: 290, type: 'falling', colorKey: 'good', title: '(c) slowing down' },
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
  { caption: 'A velocity-time graph shows how velocity changes with time. Three cars to read.' },
  { caption: 'A flat line: velocity stays constant, so the acceleration is zero.' },
  { caption: 'A rising line: velocity increases with constant acceleration, in the direction of motion.' },
  { caption: 'A falling line: velocity decreases with constant acceleration, opposite to the direction of motion.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class VelocityTimePlotScene extends CanvasSimulation {
  static simId = 'velocity-time-plot';
  static label = { en: 'Shapes of velocity-time graphs' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Three velocity-time graphs. A flat line means constant velocity and zero acceleration. A rising line ' +
    'means velocity increasing with constant acceleration in the direction of motion. A falling line means ' +
    'velocity decreasing with constant acceleration opposite to the motion.';

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

    const ox = panel.x + 45;
    const oy = panel.y + panel.h - 45;
    const pw = panel.w - 80;
    const ph = panel.h - 120;

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
    ctx.fillText('Time', ox + pw / 2, oy + 16);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (panel.type === 'flat') {
      ctx.moveTo(ox, oy - ph * 0.45);
      ctx.lineTo(ox + pw, oy - ph * 0.45);
    } else if (panel.type === 'rising') {
      ctx.moveTo(ox, oy - ph * 0.1);
      ctx.lineTo(ox + pw, oy - ph * 0.9);
    } else {
      ctx.moveTo(ox, oy - ph * 0.9);
      ctx.lineTo(ox + pw, oy - ph * 0.1);
    }
    ctx.stroke();

    ctx.fillStyle = c.label;
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(panel.title, panel.x + panel.w / 2, panel.y + 24);

    if (active) {
      ctx.fillStyle = color;
      ctx.font = '700 14px Inter, system-ui';
      const labels = ['velocity constant, acceleration = 0', 'constant acceleration (with velocity)', 'constant acceleration (opposite velocity)'];
      this._wrapText(ctx, labels[idx], panel.x + panel.w / 2, panel.y + panel.h - 16, panel.w - 30, 18, 'center');
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