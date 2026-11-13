import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * SwimmerSpeedVelocityScene — companion to blk-l03-s1 / blk-l03-s3.
 * Sarang swims across a 25 m pool and back in 50 s. Average speed is 1 m/s
 * (50 m / 50 s) while average velocity is 0 m/s (displacement zero).
 * Beats: setup -> first leg -> return leg -> the two-numbers verdict.
 */

const W = 900;
const H = 600;

const POOL_Y = 330;
const POOL_X0 = 150;
const POOL_X1 = 750;
const WALL_LABEL = '25 m';
const SWIM_SEC = 2.4;

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
  { caption: 'A 25 m pool. Sarang swims from one end to the other and back, covering 50 m of water in 50 s.' },
  { caption: 'First leg: he crosses the 25 m pool.' },
  { caption: 'Then he turns and swims the 25 m back — 50 m of swimming in all.' },
  { caption: 'He ends exactly where he began. Average speed 1 m s⁻¹, average velocity 0 m s⁻¹. Two questions, two answers.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SwimmerSpeedVelocityScene extends CanvasSimulation {
  static simId = 'swimmer-speed-velocity';
  static label = { en: 'Speed vs velocity for a pool swimmer' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A swimmer crosses a twenty-five metre pool and swims back to the starting wall, covering fifty metres in ' +
    'fifty seconds. His average speed is one metre per second because distance is fifty metres, but his average ' +
    'velocity is zero because he returns to the starting point, so his displacement is zero.';

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

  _swimmerX() {
    const t = this._stepEnterTime;
    if (this.stepIndex === 0) return POOL_X0;
    if (this.stepIndex === 1) return lerp(POOL_X0, POOL_X1, cruise(t / SWIM_SEC));
    if (this.stepIndex === 2) {
      return lerp(POOL_X1, POOL_X0, cruise(t / SWIM_SEC));
    }
    return POOL_X0; // settled back at the start wall
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const x = this._swimmerX();
    this._drawPool(ctx, x);

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 260, 430, 520, 100, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 17px Inter, system-ui';
      ctx.fillStyle = c.wedge;
      ctx.fillText('average speed = 50 m ÷ 50 s = 1 m s⁻¹', W / 2, 462);
      ctx.fillStyle = c.good;
      ctx.fillText('average velocity = 0 m ÷ 50 s = 0 m s⁻¹', W / 2, 492);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawPool(ctx, swimmerX) {
    const c = this.colors;
    ctx.save();
    // water
    ctx.fillStyle = SimDraw.withAlpha(c.shape, 0.10);
    ctx.fillRect(POOL_X0, POOL_Y - 60, POOL_X1 - POOL_X0, 120);
    // walls
    ctx.fillStyle = c.muted;
    ctx.fillRect(POOL_X0 - 10, POOL_Y - 60, 10, 120);
    ctx.fillRect(POOL_X1, POOL_Y - 60, 10, 120);
    // water surface line
    ctx.strokeStyle = SimDraw.withAlpha(c.shape, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(POOL_X0, POOL_Y - 60);
    ctx.lineTo(POOL_X1, POOL_Y - 60);
    ctx.stroke();

    // distance label
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.muted;
    ctx.fillText(WALL_LABEL, (POOL_X0 + POOL_X1) / 2, POOL_Y + 40);

    // swimmer
    ctx.beginPath();
    ctx.arc(swimmerX, POOL_Y, 15, 0, Math.PI * 2);
    ctx.fillStyle = c.wedge;
    ctx.fill();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(swimmerX - 12, POOL_Y + 24);
    ctx.lineTo(swimmerX + 12, POOL_Y + 24);
    ctx.stroke();
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 560, 660, 24, 'center');
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