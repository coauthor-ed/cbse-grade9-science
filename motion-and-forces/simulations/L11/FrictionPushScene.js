import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';

/**
 * FrictionPushScene — companion to blk-l11-s1 / blk-l11-s3 (Fig 6.10).
 * A box on the floor. Friction opposes the push; the box moves only when the
 * push exceeds friction. Once the push stops, friction brings the box to rest.
 */

const W = 900;
const H = 600;

const BOX_Y = 360;
const N_PX = 4;

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
  { caption: 'Push a box gently. Friction pushes back just as hard — net force zero, the box stays put.' },
  { caption: 'Push harder than friction: a net force appears in your direction and the box starts to move.' },
  { caption: 'Stop pushing: friction is the only force left, and it slows the box to rest.' },
  { caption: 'Friction always acts opposite to the motion (or the intended motion) of the object.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class FrictionPushScene extends CanvasSimulation {
  static simId = 'friction-push';
  static label = { en: 'Push force versus friction' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A box on the floor. Pushing gently, friction matches the push and the box stays still. Pushing harder than ' +
    'friction creates a net force and the box slides. When the push stops, friction alone slows the box to rest. ' +
    'Friction always acts opposite to the motion of the object.';

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

  // returns { push, friction, boxDx } for the current step
  _state() {
    const p = clamp01(this._stepEnterTime / 1.8);
    if (this.stepIndex === 0) return { push: 40, friction: 40, dx: 0 };
    if (this.stepIndex === 1) return { push: 55, friction: 40, dx: 150 * p };
    if (this.stepIndex === 2) return { push: 0, friction: 40, dx: 150 - 150 * p };
    return { push: 0, friction: 40, dx: 0 };
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const { push, friction, dx } = this._state();
    const bx = 260 + dx;

    // floor
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, BOX_Y + 50);
    ctx.lineTo(W - 40, BOX_Y + 50);
    ctx.stroke();

    // box
    ctx.fillStyle = SimDraw.withAlpha(c.shape, 0.2);
    ctx.strokeStyle = c.shape;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx, BOX_Y, 110, 60, 6);
    ctx.fill();
    ctx.stroke();

    // push arrow
    if (push > 0) {
      this._arrow(ctx, bx + 110, BOX_Y + 30, push * N_PX, c.wedge, `${push} N (you)`);
    }
    // friction arrow
    if (friction > 0) {
      this._arrow(ctx, bx, BOX_Y + 12, -friction * N_PX, c.bad, `${friction} N (friction)`);
    }
    // net arrow for unbalanced beat
    if (this.stepIndex === 1) {
      this._arrow(ctx, bx + 110, BOX_Y + 52, 15 * N_PX, c.good, 'net 15 N');
    }

    this._drawCaption(ctx, step.caption);
  }

  _arrow(ctx, fromX, y, len, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fromX, y);
    ctx.lineTo(fromX + len, y);
    ctx.stroke();
    const dir = len >= 0 ? 1 : -1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromX + len, y);
    ctx.lineTo(fromX + len - dir * 14, y - 7);
    ctx.lineTo(fromX + len - dir * 14, y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 13px Inter, system-ui';
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
    this._wrapText(ctx, caption, W / 2 - 330, 470, 660, 24, 'center');
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