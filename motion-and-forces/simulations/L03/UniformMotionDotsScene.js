import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * UniformMotionDotsScene — companion to blk-l03-s4.
 * Two cars on straight lanes drop a marker every equal time interval. The
 * uniform-motion car's markers are evenly spaced; the non-uniform (speeding
 * up) car's markers spread further apart. Uniform motion = equal distances in
 * equal times.
 */

const W = 900;
const H = 600;

const LANE_Y0 = 260;   // uniform lane
const LANE_Y1 = 380;   // non-uniform lane
const START_X = 140;
const END_X = 800;

const UNIFORM_SPEED = 130;        // px/s
const NONUNIFORM_ACCEL = 150;     // px/s^2 (x = 0.5 a t^2)
const DROP_INTERVAL = 0.62;       // s between marker drops
const SCENE_SEC = 3.4;

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
  { caption: 'Two cars on straight roads. One holds a steady speed; the other speeds up steadily.' },
  { caption: 'A camera drops a marker on each lane every second. Watch the spacing between markers.' },
  { caption: 'Equal distances in equal time intervals = uniform motion. Unequal distances in equal times = non-uniform motion.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class UniformMotionDotsScene extends CanvasSimulation {
  static simId = 'uniform-motion-dots';
  static label = { en: 'Uniform vs non-uniform motion' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Two cars, one moving at constant speed and one speeding up, drop a marker at equal time intervals. ' +
    'The constant-speed car leaves evenly spaced markers, which is uniform motion. The accelerating car leaves ' +
    'markers that spread further and further apart, which is non-uniform motion.';

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
    this._markers = { uniform: [], nonuniform: [] };
    this._nextDrop = DROP_INTERVAL;
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
    this._nextDrop = DROP_INTERVAL;
    this._markers = { uniform: [], nonuniform: [] };
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
    this._collectMarkers();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _collectMarkers() {
    if (this.stepIndex !== 1) return;
    const t = this._stepEnterTime;
    while (this._nextDrop <= t) {
      const mt = this._nextDrop;
      const ux = START_X + UNIFORM_SPEED * mt;
      const nx = START_X + 0.5 * NONUNIFORM_ACCEL * mt * mt;
      this._markers.uniform.push(ux);
      this._markers.nonuniform.push(nx);
      this._nextDrop += DROP_INTERVAL;
    }
  }

  _positions() {
    const t = this._stepEnterTime;
    const ux = this.stepIndex === 1 ? START_X + UNIFORM_SPEED * Math.min(t, SCENE_SEC) : START_X + UNIFORM_SPEED * SCENE_SEC;
    const tN = this.stepIndex === 1 ? Math.min(t, SCENE_SEC) : SCENE_SEC;
    const nx = START_X + 0.5 * NONUNIFORM_ACCEL * tN * tN;
    return { ux: Math.min(ux, END_X), nx: Math.min(nx, END_X) };
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    this._drawLane(ctx, LANE_Y0, 'uniform motion', c.shape, this._markers.uniform, this._positions().ux, 'steady speed');
    this._drawLane(ctx, LANE_Y1, 'non-uniform motion', c.wedge, this._markers.nonuniform, this._positions().nx, 'speeding up');

    if (this.stepIndex === 2) {
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.shape;
      ctx.fillText('equal distances in equal times', 440, 230);
      ctx.fillStyle = c.wedge;
      ctx.fillText('unequal distances in equal times', 440, 500);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawLane(ctx, laneY, label, color, markers, carX, carNote) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(START_X - 30, laneY);
    ctx.lineTo(END_X + 30, laneY);
    ctx.stroke();

    // markers
    for (const x of markers) {
      ctx.beginPath();
      ctx.arc(Math.min(x, END_X), laneY, 7, 0, Math.PI * 2);
      ctx.fillStyle = SimDraw.withAlpha(color, 0.75);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // car
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(carX - 26, laneY - 22, 52, 26, 8);
    ctx.fill();
    ctx.fillStyle = this.colors.bgDeep;
    ctx.beginPath();
    ctx.arc(carX - 12, laneY + 4, 6, 0, Math.PI * 2);
    ctx.arc(carX + 12, laneY + 4, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 15px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.fillText(label, 90, laneY - 34);
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.fillText(carNote, 90, laneY + 40);
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