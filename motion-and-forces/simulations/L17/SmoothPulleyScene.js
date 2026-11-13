import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPulley, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * SmoothPulleyScene — companion to blk-l17-s5.
 *
 * Process Statement: an ideal (smooth, light) pulley redirects a string's
 * pull without changing its size — the tension reads the same on both
 * sides no matter how hard you pull. A freeplay slider on the final beat
 * lets the student drag the pull strength and watch both readouts move
 * together, always equal.
 *
 * On that same final beat the rig is also shown actually moving: the hand
 * steadily takes in and pays out the string, the suspended weight bobs up
 * and down in response, and the string carries an animated dash flow —
 * moving down on the hand's side, up on the weight's side, while the weight
 * rises — so the pulley reads as a live mechanism, not a frozen diagram.
 */

const W = 900;
const H = 600;

const PULLEY_X = 450, PULLEY_Y = 180, PULLEY_R = 40;
const LEFT_X = PULLEY_X - 180, RIGHT_X = PULLEY_X + 180;
const HAND_Y = 420;
const BOB_AMPLITUDE = 20; // px the suspended weight bobs above/below its resting height
const BOB_SPEED = 1.2; // rad/s

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  string:  ['--sim-motion-shape', '#e2e8f0'],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'A string runs over a smooth, light pulley — one end pulled by a hand, the other end free.', pull: 20 },
  { caption: 'Watch both readouts as the pull changes. Same tension, both sides, always.', pull: 20 },
  { caption: 'Drag the slider yourself. The two sides never disagree.', pull: 20 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class SmoothPulleyScene extends CanvasSimulation {
  static simId = 'smooth-pulley';
  static label = { en: 'A smooth pulley keeps tension equal on both sides' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A string runs over a smooth, light pulley, pulled by a hand on one side. Numeric tension readouts appear on ' +
    'both sides of the string and always show the same number, even as a freeplay slider changes how hard the ' +
    'hand pulls, showing that an ideal pulley redirects a string without changing its tension.';

  static CONTROLS = [
    { type: 'slider', id: 'pull', label: 'Pull strength (N):', min: 5, max: 40, step: 1, value: 20, suffix: 'N' },
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
    this._pull = 20;
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
      this._announce(`Pull set to ${this._pull} newtons. Both sides read ${this._pull} newtons.`);
      this.requestUiUpdate?.();
    }
  }

  isControlHidden() {
    return this.stepIndex < 2;
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

    // Beat 2 only: the hand steadily pulls, the weight bobs, the string
    // visibly flows over the pulley. Earlier beats keep the original static
    // pose (weightY === HAND_Y, no motion) exactly as before.
    const moving = this.stepIndex === 2;
    const t = this._stepEnterTime;
    const bobOffset = moving ? BOB_AMPLITUDE * Math.sin(t * BOB_SPEED) : 0;
    const weightY = HAND_Y + bobOffset;
    // d(weightY)/dt < 0 means the weight is currently rising — the hand is
    // actively taking the string in.
    const rising = moving && Math.cos(t * BOB_SPEED) < 0;
    const dashSpeed = 42; // px/s the marching dashes travel
    const risingSign = rising ? 1 : -1;

    ctx.save();
    ctx.strokeStyle = c.string;
    ctx.lineWidth = 3;
    if (moving) ctx.setLineDash([9, 7]);

    // Hand-side segment: hand up, then the short horizontal run into the
    // pulley's left tangent point — the same geometry a single continuous
    // path (moveTo → lineTo → arc) would auto-bridge with an implicit
    // connector, made explicit here since each segment now needs its own
    // dash offset and so can no longer share one path. Flows down (toward
    // the hand) while the weight rises.
    ctx.lineDashOffset = moving ? risingSign * t * dashSpeed : 0;
    ctx.beginPath();
    ctx.moveTo(LEFT_X, HAND_Y);
    ctx.lineTo(LEFT_X, PULLEY_Y);
    ctx.lineTo(PULLEY_X - PULLEY_R - 6, PULLEY_Y);
    ctx.stroke();

    // Over the top of the pulley.
    ctx.beginPath();
    ctx.arc(PULLEY_X, PULLEY_Y, PULLEY_R + 6, Math.PI, 0, false);
    ctx.stroke();

    // Weight-side segment: the pulley's right tangent point, horizontal run
    // out, then down to the weight (same bridging logic as the hand side).
    // Flows up (toward the pulley) while the weight rises.
    ctx.lineDashOffset = moving ? -risingSign * t * dashSpeed : 0;
    ctx.beginPath();
    ctx.moveTo(PULLEY_X + PULLEY_R + 6, PULLEY_Y);
    ctx.lineTo(RIGHT_X, PULLEY_Y);
    ctx.lineTo(RIGHT_X, weightY);
    ctx.stroke();
    if (moving) ctx.setLineDash([]);
    ctx.restore();

    drawPulley(ctx, PULLEY_X, PULLEY_Y, PULLEY_R, c);

    // hand pulling left side
    ctx.save();
    ctx.fillStyle = c.muted;
    ctx.beginPath();
    ctx.arc(LEFT_X, HAND_Y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.fillText('hand pulls', LEFT_X, HAND_Y + 40);
    ctx.restore();

    // suspended weight — bobs on beat 2, static (at HAND_Y) otherwise
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.tension, 0.25);
    ctx.strokeStyle = c.tension;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(RIGHT_X - 24, weightY, 48, 40, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex >= 1) {
      drawLabelPill(ctx, `${this._pull.toFixed(0)} N`, LEFT_X, PULLEY_Y + 60, { color: c.tension, font: '700 15px Inter, system-ui', height: 26 });
      const rightLabelY = moving ? weightY - 18 : PULLEY_Y + 60;
      drawLabelPill(ctx, `${this._pull.toFixed(0)} N`, RIGHT_X, rightLabelY, { color: c.tension, font: '700 15px Inter, system-ui', height: 26 });
      drawLabelPill(ctx, 'same number, both sides', W / 2, 100, { color: c.good, font: '700 14px Inter, system-ui', height: 26 });
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
    wrapText(ctx, caption, W / 2 - 330, 540, 660, 24, 'center');
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
