import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPulley, drawMassBlock, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * MovablePulleyDynamicScene — companion to blk-l18-s8 (reused by q-l18-s9).
 *
 * Process Statement: pull harder than W/2 on a movable-pulley rig and the
 * box+pulley system is no longer in equilibrium — the same second law
 * applies, just with 2T (both segments) in place of a single tension:
 * 2T − W = Ma. The final beat is a freeplay slider over the pulling force,
 * with the box's acceleration recomputed live and animated rising when the
 * pull exceeds W/2.
 */

const W = 900;
const H = 600;

const CEIL_Y = 50;
const MOVABLE_X = 450, MOVABLE_R = 26;
const MOVABLE_Y0 = 300;
const ANCHOR_X = MOVABLE_X - (MOVABLE_R + 6);
const FIXED_X = 610, FIXED_Y = 90, FIXED_R = 22;
const HAND_X = FIXED_X + (FIXED_R + 6), HAND_Y = 420;
const BOX_MASS_KG = 8;
const G = 9.8;
const WEIGHT = BOX_MASS_KG * G; // 78.4 N
const TRAVEL_PX = 46;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  box:     ['--sim-motion-shape', FORCE_COLORS.applied],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'Not in equilibrium anymore — apply the second law to the box+pulley system.', pull: 50 },
  { caption: '2T − W = Ma. Two segments now provide 2T of upward pull, not just T.', pull: 50 },
  { caption: 'Pull with 50 N: a = (2×50 − 78.4) ÷ 8 = 2.7 m/s².', pull: 50 },
  { caption: 'Pull harder than half the weight, and the box accelerates upward. Try other pulls yourself.', pull: 50 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class MovablePulleyDynamicScene extends CanvasSimulation {
  static simId = 'movable-pulley-dynamic';
  static label = { en: 'Accelerating a box with a movable pulley' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'The movable-pulley rig, now pulled harder than needed to hold the box still. The scene applies Newton’s ' +
    'second law to the box and pulley as one system, two tension segments providing 2T of upward force against ' +
    'the box’s weight, computes the resulting acceleration for a 50 newton pull, and animates the box rising. A ' +
    'freeplay slider on the final beat changes the pulling force, recomputing acceleration live.';

  static CONTROLS = [
    { type: 'slider', id: 'pull', label: 'Pull force (N):', min: 30, max: 70, step: 1, value: 50, suffix: 'N' },
    { type: 'button', id: 'replay', label: 'Replay' },
  ];

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
    this._pull = 50;
    this._elapsed = 0;
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
    this._pull = STEPS[this.stepIndex].pull;
    this._elapsed = 0;
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'pull') {
      this._pull = Number(value);
      this._elapsed = 0;
      const a = this._accel();
      this._announce(`Pull set to ${this._pull} newtons. Acceleration: ${a.toFixed(2)} metres per second squared.`);
    } else if (id === 'replay') {
      this._elapsed = 0;
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _accel() {
    return (2 * this._pull - WEIGHT) / BOX_MASS_KG;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._elapsed += dt;
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
    const a = this._accel();
    const rising = this.stepIndex >= 2 && a > 0.05;

    let movableY = MOVABLE_Y0;
    if (rising) {
      const tCap = Math.min(this._elapsed, 1.6);
      const frac = clamp01((tCap * tCap) / 2.2);
      movableY = MOVABLE_Y0 - frac * TRAVEL_PX;
    }

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

    ctx.save();
    ctx.strokeStyle = c.tension;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ANCHOR_X, CEIL_Y);
    ctx.lineTo(ANCHOR_X, movableY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(MOVABLE_X, movableY, MOVABLE_R + 6, Math.PI, 0, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(MOVABLE_X + MOVABLE_R + 6, movableY);
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

    drawPulley(ctx, MOVABLE_X, movableY, MOVABLE_R, c);
    drawPulley(ctx, FIXED_X, FIXED_Y, FIXED_R, c);

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

    const boxTop = movableY + MOVABLE_R + 16;
    const box = drawMassBlock(ctx, MOVABLE_X, boxTop, { width: 84, height: 70, color: c.box, label: `${BOX_MASS_KG} kg` });
    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MOVABLE_X, movableY + MOVABLE_R);
    ctx.lineTo(MOVABLE_X, boxTop);
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex >= 1) {
      drawLabelPill(ctx, '2T', (MOVABLE_X + FIXED_X) / 2 + 10, (movableY + FIXED_Y) / 2 - 10, { color: c.tension, height: 22 });
    }

    if (this.stepIndex >= 2) {
      SimDraw.drawPanel(ctx, W / 2 - 220, 470, 440, 66, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText(`a = (2T − W) ÷ M = (2×${this._pull.toFixed(0)} − ${WEIGHT.toFixed(1)}) ÷ ${BOX_MASS_KG}`, W / 2, 496);
      ctx.fillText(`a = ${a.toFixed(2)} m/s²  ${a < 0 ? '(negative — it can’t lift off, T is too small)' : ''}`, W / 2, 520);
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
