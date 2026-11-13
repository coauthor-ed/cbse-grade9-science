import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';

/**
 * SpeedingAndBrakingScene — companion to blk-l04-s1 / blk-l04-s3.
 * A bus on a straight highway: speed up (acceleration with velocity), brake
 * (acceleration opposite to velocity), then cruise at constant velocity
 * (acceleration zero). The velocity arrow's length tracks speed; the
 * acceleration arrow's direction tracks the sign of a.
 */

const W = 900;
const H = 600;

const ROAD_Y = 360;
const CAR_X = 300;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', '#38bdf8'],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', '#34d399'],
  bad:      ['--sim-motion-bad', '#f87171'],
};

const STEPS = [
  { caption: 'You sit in a bus at a stop. The driver presses the accelerator and you feel a jolt — your velocity is changing.' },
  { caption: 'Speeding up: the acceleration points in the direction of the velocity.' },
  { caption: 'Braking: the velocity shrinks, and the acceleration points opposite to the motion.' },
  { caption: 'At a steady 72 km/h nothing changes — velocity constant, acceleration zero.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SpeedingAndBrakingScene extends CanvasSimulation {
  static simId = 'speeding-and-braking';
  static label = { en: 'Acceleration when speeding up and braking' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A bus on a straight road. When it speeds up, an arrow shows acceleration pointing in the direction of ' +
    'motion. When it brakes, acceleration points opposite to the motion. When it cruises at constant velocity, ' +
    'acceleration is zero. Acceleration depends on how quickly velocity changes, not on how fast the bus is going.';

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

  // returns { vLen, aLen, aDir } where aDir is +1 (with velocity) or -1
  _arrowState() {
    const t = this._stepEnterTime;
    const p = clamp01(t / 1.2);
    switch (this.stepIndex) {
      case 0: return { vLen: 20, aLen: 0, aDir: 1 };
      case 1: return { vLen: 40 + 90 * p, aLen: 56, aDir: 1 };
      case 2: return { vLen: 130 * (1 - 0.6 * p), aLen: 56, aDir: -1 };
      case 3: return { vLen: 120, aLen: 0, aDir: 1 };
    }
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const { vLen, aLen, aDir } = this._arrowState();

    this._drawRoad(ctx);

    const carL = CAR_X - 55, carT = ROAD_Y - 40, carW = 110, carH = 40;
    ctx.save();
    ctx.fillStyle = c.shape;
    ctx.beginPath();
    ctx.roundRect(carL, carT, carW, carH, 10);
    ctx.fill();
    ctx.fillStyle = c.bgDeep;
    ctx.beginPath();
    ctx.arc(carL + 24, ROAD_Y + 4, 9, 0, Math.PI * 2);
    ctx.arc(carL + carW - 24, ROAD_Y + 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // velocity arrow (from car's right edge)
    this._drawArrow(ctx, CAR_X, ROAD_Y - 26, vLen, c.wedge, 'velocity v');
    // acceleration arrow (below car)
    if (aLen > 0) {
      const ax = CAR_X + aDir * (aLen * 0.5);
      this._drawArrow(ctx, CAR_X - aDir * (aLen * 0.5), ROAD_Y + 44, aLen * aDir, c.bad, 'acceleration a');
    }

    // label of the current message
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 15px Inter, system-ui';
    ctx.fillStyle = c.label;
    if (this.stepIndex === 1) {
      ctx.fillText('speeding up: acceleration with velocity', W / 2, 150);
    } else if (this.stepIndex === 2) {
      ctx.fillText('braking: acceleration opposite to velocity', W / 2, 150);
    } else if (this.stepIndex === 3) {
      ctx.fillText('constant velocity → acceleration = 0', W / 2, 150);
    }
    ctx.restore();

    this._drawCaption(ctx, step.caption);
  }

  _drawRoad(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, ROAD_Y);
    ctx.lineTo(W - 40, ROAD_Y);
    ctx.stroke();
    ctx.setLineDash([18, 14]);
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, ROAD_Y + 16);
    ctx.lineTo(W - 40, ROAD_Y + 16);
    ctx.stroke();
    ctx.restore();
  }

  _drawArrow(ctx, fromX, y, len, color, label) {
    const c = this.colors;
    const toX = fromX + len;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fromX, y);
    ctx.lineTo(toX, y);
    ctx.stroke();
    const ang = len >= 0 ? 0 : Math.PI;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, y);
    ctx.lineTo(toX - Math.sign(len || 1) * 14, y - 7);
    ctx.lineTo(toX - Math.sign(len || 1) * 14, y + 7);
    ctx.closePath();
    ctx.fill();

    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(label, fromX + len / 2, y - 14);
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