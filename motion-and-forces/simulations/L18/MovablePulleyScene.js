import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPulley, drawMassBlock, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * MovablePulleyScene — companion to blk-l18-s3.
 *
 * Process Statement: a pulley that hangs from the load itself (rather than
 * being fixed) is held up by TWO string segments, both carrying the same
 * tension since it's all one ideal string over ideal pulleys. Isolating the
 * box+pulley as one system, those two segments must together balance its
 * weight at rest: 2T = W, so T = W/2 — half the force to hold the same load.
 */

const W = 900;
const H = 600;

const CEIL_Y = 50;
const MOVABLE_X = 450, MOVABLE_Y = 280, MOVABLE_R = 26;
const ANCHOR_X = MOVABLE_X - (MOVABLE_R + 6);
const FIXED_X = 610, FIXED_Y = 90, FIXED_R = 22;
const HAND_X = FIXED_X + (FIXED_R + 6), HAND_Y = 420;
const BOX_MASS_KG = 8;
const G = 9.8;
const WEIGHT = BOX_MASS_KG * G; // 78.4 N

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  box:     ['--sim-motion-shape', FORCE_COLORS.applied],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  weight:  ['--sim-force-gravity', FORCE_COLORS.gravity],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'Isolate the box and its movable pulley as one system.' },
  { caption: 'Two string segments hold it up, both carrying the same tension T.' },
  { caption: 'Both pull up — together they must balance the weight: 2T = W.' },
  { caption: 'T = W ÷ 2. Two segments share the load — half the force.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class MovablePulleyScene extends CanvasSimulation {
  static simId = 'movable-pulley-force';
  static label = { en: 'A movable pulley halves the force' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A box hangs from a movable pulley. A string loops under that pulley: one end ties to a fixed point on the ' +
    'ceiling, the other runs up and over a separate fixed pulley and down to a hand. The scene highlights both ' +
    'string segments carrying the same tension, shows they together balance the box’s weight (2T equals W at ' +
    'rest), and concludes that the pulling force needed is only half the box’s weight.';

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
    const highlight = this.stepIndex >= 1;

    // ceiling anchor
    ctx.save();
    ctx.fillStyle = c.muted;
    ctx.beginPath();
    ctx.moveTo(ANCHOR_X - 10, CEIL_Y - 14);
    ctx.lineTo(ANCHOR_X + 10, CEIL_Y - 14);
    ctx.lineTo(ANCHOR_X, CEIL_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // string
    ctx.save();
    ctx.strokeStyle = highlight ? c.tension : c.label;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ANCHOR_X, CEIL_Y);
    ctx.lineTo(ANCHOR_X, MOVABLE_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(MOVABLE_X, MOVABLE_Y, MOVABLE_R + 6, Math.PI, 0, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(MOVABLE_X + MOVABLE_R + 6, MOVABLE_Y);
    ctx.lineTo(FIXED_X - FIXED_R - 6, FIXED_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(FIXED_X, FIXED_Y, FIXED_R + 6, Math.PI, 0, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(HAND_X, FIXED_Y);
    ctx.lineTo(HAND_X, HAND_Y);
    ctx.stroke();
    ctx.restore();

    drawPulley(ctx, MOVABLE_X, MOVABLE_Y, MOVABLE_R, c);
    drawPulley(ctx, FIXED_X, FIXED_Y, FIXED_R, c);

    // hand
    ctx.save();
    ctx.fillStyle = c.muted;
    ctx.beginPath();
    ctx.arc(HAND_X, HAND_Y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.fillText('hand pulls', HAND_X, HAND_Y + 32);
    ctx.restore();

    // box, hanging from the movable pulley
    const boxTop = MOVABLE_Y + MOVABLE_R + 16;
    const box = drawMassBlock(ctx, MOVABLE_X, boxTop, { width: 84, height: 70, color: c.box, label: `${BOX_MASS_KG} kg` });
    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MOVABLE_X, MOVABLE_Y + MOVABLE_R);
    ctx.lineTo(MOVABLE_X, boxTop);
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex >= 1) {
      const alpha = clamp01(this._stepEnterTime / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawLabelPill(ctx, 'T', ANCHOR_X, (CEIL_Y + MOVABLE_Y) / 2, { color: c.tension, height: 22 });
      drawLabelPill(ctx, 'T', (MOVABLE_X + FIXED_X) / 2 + 10, (MOVABLE_Y + FIXED_Y) / 2 - 10, { color: c.tension, height: 22 });
      ctx.restore();
    }

    if (this.stepIndex >= 2) {
      drawForceArrow(ctx, MOVABLE_X, box.bottom, { angle: Math.PI / 2, length: 44, color: c.weight, label: 'W' });
    }

    if (this.stepIndex === 2) {
      drawLabelPill(ctx, '2T = W', W / 2, 500, { color: c.good, font: '700 16px Inter, system-ui', height: 30 });
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 190, 470, 380, 62, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('T = W ÷ 2', W / 2, 498);
      ctx.fillStyle = c.label;
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillText(`${WEIGHT.toFixed(1)} N ÷ 2 = ${(WEIGHT / 2).toFixed(1)} N`, W / 2, 520);
      ctx.restore();
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 560, 660, 24, 'center');
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
