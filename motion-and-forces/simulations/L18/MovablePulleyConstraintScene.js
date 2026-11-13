import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPulley, drawMassBlock, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * MovablePulleyConstraintScene — companion to blk-l18-s4.
 *
 * Process Statement: the same movable-pulley rig from the previous slide,
 * now examined for distance instead of force. Two string segments support
 * the box, so lifting it by a distance d shortens BOTH segments by d —
 * meaning 2d of string must be pulled in at the hand. Half the force always
 * comes paired with twice the distance. The final beat is a freeplay
 * slider over how much string is pulled in, with the box's rise animating
 * live at exactly half that distance.
 */

const W = 900;
const H = 600;

const CEIL_Y = 50;
const MOVABLE_X = 450, MOVABLE_R = 26;
const MOVABLE_Y0 = 300; // resting position (0 string pulled)
const ANCHOR_X = MOVABLE_X - (MOVABLE_R + 6);
const FIXED_X = 610, FIXED_Y = 90, FIXED_R = 22;
const HAND_X = FIXED_X + (FIXED_R + 6), HAND_Y = 420;
const PX_PER_M = 50;
const MAX_PULL_M = 2;

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
  { caption: 'Lifting the box 1 metre sounds like it should take 1 metre of string. It doesn’t.', pull: 0 },
  { caption: 'Both segments support the box — lift it 1 m, and BOTH segments must each shorten by 1 m.', pull: 1 },
  { caption: 'That’s 2 m of string pulled in at your hand — for the box to rise just 1 m.', pull: 2 },
  { caption: 'Half the force, but twice the distance. Drag the slider to try any pull length.', pull: 2 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class MovablePulleyConstraintScene extends CanvasSimulation {
  static simId = 'movable-pulley-constraint';
  static label = { en: 'A movable pulley doubles the pulled distance' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'The same movable-pulley rig, now measuring distance. Two string segments support the box, so lifting it by ' +
    'one metre shortens each segment by one metre — two metres pulled in at the hand in total. A freeplay slider ' +
    'on the final beat sets how much string is pulled in, and the box rises live at exactly half that distance.';

  static CONTROLS = [
    { type: 'slider', id: 'pull', label: 'String pulled in (m):', min: 0, max: MAX_PULL_M, step: 0.1, value: 2, suffix: 'm' },
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
    this._pull = 0;
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
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'pull') {
      this._pull = Number(value);
      const rise = this._pull / 2;
      this._announce(`String pulled: ${this._pull.toFixed(1)} metres. Box rises: ${rise.toFixed(2)} metres.`);
      this.requestUiUpdate?.();
    }
  }

  isControlHidden() {
    return this.stepIndex < 3;
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
    const rise = this._pull / 2;
    const movableY = MOVABLE_Y0 - rise * PX_PER_M;

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
    const box = drawMassBlock(ctx, MOVABLE_X, boxTop, { width: 84, height: 70, color: c.box, label: 'M' });
    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MOVABLE_X, movableY + MOVABLE_R);
    ctx.lineTo(MOVABLE_X, boxTop);
    ctx.stroke();
    ctx.restore();

    // measurement callouts
    if (this.stepIndex === 1) {
      drawLabelPill(ctx, 'each segment: −1 m', (MOVABLE_X + FIXED_X) / 2 + 20, (movableY + FIXED_Y) / 2 - 10, { color: c.tension, font: '700 13px Inter, system-ui', height: 24 });
      drawLabelPill(ctx, 'box rises: 1 m', MOVABLE_X - 140, movableY, { color: c.good, font: '700 13px Inter, system-ui', height: 24 });
    } else if (this.stepIndex === 2) {
      drawLabelPill(ctx, 'string pulled in: 2 m total', HAND_X - 10, HAND_Y - 60, { color: c.tension, font: '700 13px Inter, system-ui', height: 24 });
      drawLabelPill(ctx, 'box rises: only 1 m', MOVABLE_X - 140, movableY, { color: c.good, font: '700 13px Inter, system-ui', height: 24 });
    } else if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 190, 500, 380, 44, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 14px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText(`pulled: ${this._pull.toFixed(1)} m  →  box rises: ${rise.toFixed(2)} m`, W / 2, 526);
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
