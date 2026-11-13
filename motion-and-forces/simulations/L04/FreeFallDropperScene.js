import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * FreeFallDropperScene — companion to blk-l04-s4 (Example 4.4, Fig 4.10).
 * An object dropped from rest falls in a straight line. Its velocity grows by
 * the same 9.8 m/s every second — constant acceleration, the acceleration due
 * to the Earth's gravitational force, g.
 */

const W = 900;
const H = 600;

const DROP_X = 300;
const TOP_Y = 90;
const BOTTOM_Y = 510;
const G = 9.8;
const MAX_T = 4;
const SCALE = (BOTTOM_Y - TOP_Y) / (0.5 * G * MAX_T * MAX_T); // px per metre

const FALL_SEC = 3.4;

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
  { caption: 'An object is dropped from rest. It falls in a straight vertical line towards the ground.' },
  { caption: 'Each second the velocity grows by the same amount: 9.8 m s⁻¹.' },
  { caption: 'A constant gain every second means a constant acceleration — the acceleration due to the Earth’s gravitational force, called g = 9.8 m s⁻².' },
  { caption: 'We chose the origin at the drop point and down as positive. The choice is ours — but once made, it should not change mid-problem.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class FreeFallDropperScene extends CanvasSimulation {
  static simId = 'free-fall-dropper';
  static label = { en: 'Free fall: velocity grows by 9.8 m/s every second' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'An object falls from rest. Its velocity after one second is nine point eight metres per second, after two ' +
    'seconds nineteen point six, after three seconds twenty-nine point four, after four seconds thirty-nine ' +
    'point two. The same gain every second means a constant acceleration, called g, equal to nine point eight ' +
    'metres per second squared.';

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

  _fallTime() {
    if (this.stepIndex === 0) return 0;
    return Math.min(FALL_SEC * (this._stepEnterTime / FALL_SEC), MAX_T);
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const t = this._fallTime();
    const y = TOP_Y + 0.5 * G * t * t * SCALE;

    this._drawRuler(ctx);

    // velocity labels along the path
    ctx.save();
    ctx.font = '600 13px Inter, system-ui';
    ctx.fillStyle = c.wedge;
    ctx.textAlign = 'left';
    for (let s = 1; s <= 4; s++) {
      const yy = TOP_Y + 0.5 * G * s * s * SCALE;
      ctx.beginPath();
      ctx.arc(DROP_X + 90, yy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`v = ${(G * s).toFixed(1)} m s⁻¹`, DROP_X + 102, yy + 5);
    }
    ctx.restore();

    this._drawBall(ctx, y);

    if (this.stepIndex === 2) {
      SimDraw.drawPanel(ctx, W / 2 - 240, 150, 480, 70, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 17px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('same gain every second → constant acceleration', W / 2, 182);
      ctx.fillStyle = c.wedge;
      ctx.fillText('g = 9.8 m s⁻² (downwards)', W / 2, 206);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawRuler(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.5);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(DROP_X - 40, TOP_Y - 20);
    ctx.lineTo(DROP_X - 40, BOTTOM_Y + 20);
    ctx.stroke();
    ctx.font = '600 11px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'right';
    for (let m = 0; m <= 78; m += 10) {
      const y = TOP_Y + m * SCALE;
      ctx.beginPath();
      ctx.moveTo(DROP_X - 46, y);
      ctx.lineTo(DROP_X - 34, y);
      ctx.stroke();
      ctx.fillText(`${m} m`, DROP_X - 52, y + 4);
    }
    ctx.restore();
  }

  _drawBall(ctx, y) {
    const c = this.colors;
    ctx.save();
    ctx.beginPath();
    ctx.arc(DROP_X, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = c.shape;
    ctx.fill();
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.label;
    ctx.fillText('t = 0 s, u = 0 m s⁻¹', DROP_X, TOP_Y - 26);
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 555, 660, 24, 'center');
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