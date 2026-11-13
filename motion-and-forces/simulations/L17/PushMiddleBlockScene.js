import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * PushMiddleBlockScene — companion to blk-l17-s24 (reused by q-l17-s25, q-l17-s26).
 *
 * Process Statement: three blocks A—B—C touch in a row. Pushing the MIDDLE
 * block B toward C carries B and C along together (B can push C), but A is
 * left behind entirely — contact forces only ever push, never pull, so
 * nothing acts on A once B moves away from it. This is the same "normal
 * forces only push" rule from earlier in the lesson, now applied to
 * block-on-block contact instead of a block on a surface.
 */

const W = 900;
const H = 600;

const FLOOR_Y = 340;
const BLOCK_W = 80, BLOCK_H = 70;
const A_X0 = 220, B_X0 = A_X0 + BLOCK_W, C_X0 = B_X0 + BLOCK_W; // touching, left edges at rest
const M_B = 3, M_C = 4, F = 21;
const A_ACCEL_PX = 90; // how far B/C travel across the beat while A stays put

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  blockA:  ['--sim-motion-cart', FORCE_COLORS.muted],
  blockB:  ['--sim-motion-shape', FORCE_COLORS.applied],
  blockC:  ['--sim-motion-wedge', FORCE_COLORS.reaction],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
  bad:     ['--sim-motion-bad', FORCE_COLORS.netBad],
};

const STEPS = [
  { caption: 'Blocks can only PUSH through contact — never pull. Same rule as a normal force.', drift: 0 },
  { caption: 'Push B toward C: B presses into C, so B carries C along. But B is moving away from A.', drift: 0 },
  { caption: 'Nothing pulls A after them — no force acts on it at all once contact with B is lost.', drift: 1 },
  { caption: 'B and C move together: a = F ÷ (mB + mC). A’s acceleration is exactly zero.', drift: 1 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class PushMiddleBlockScene extends CanvasSimulation {
  static simId = 'push-middle-block';
  static label = { en: 'Pushing the middle block of three' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Three blocks A, B, and C sit touching in a row on a frictionless floor. A hand pushes the middle block B ' +
    'toward C. The scene shows B pressing into C and carrying it along, while block A is left behind entirely, ' +
    'since contact forces only ever push and nothing pulls A after them. B and C accelerate together while A' +
    's acceleration stays at zero throughout.';

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
    const drift = step.drift ? clamp01(this._stepEnterTime / 1.2) * A_ACCEL_PX : 0;

    drawGround(ctx, 120, 780, FLOOR_Y + BLOCK_H, c, { kind: 'ice' });

    this._block(ctx, A_X0, c.blockA, 'A', '2 kg');
    this._block(ctx, B_X0 + drift, c.blockB, 'B', `${M_B} kg`);
    this._block(ctx, C_X0 + drift, c.blockC, 'C', `${M_C} kg`);

    if (this.stepIndex >= 1) {
      drawForceArrow(ctx, B_X0 + drift - 50, FLOOR_Y + BLOCK_H / 2, { angle: 0, length: 40, color: c.good, label: 'F' });
    }

    if (this.stepIndex >= 2) {
      drawLabelPill(ctx, 'no force on A — stays put', A_X0 + BLOCK_W / 2, FLOOR_Y - 30, { color: c.bad, font: '700 13px Inter, system-ui', height: 24 });
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 200, 470, 400, 44, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText(`a(B,C) = F ÷ (mB+mC) = ${F} ÷ ${M_B + M_C} = ${(F / (M_B + M_C)).toFixed(2)} m/s²   a(A) = 0`, W / 2, 498);
      ctx.restore();
    }

    this._drawCaption(ctx, step.caption);
  }

  _block(ctx, x0, color, label, massLabel) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(color, 0.22);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x0, FLOOR_Y, BLOCK_W, BLOCK_H, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 20px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(label, x0 + BLOCK_W / 2, FLOOR_Y + BLOCK_H / 2 - 2);
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillText(massLabel, x0 + BLOCK_W / 2, FLOOR_Y + BLOCK_H / 2 + 18);
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 550, 660, 24, 'center');
    ctx.restore();
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
