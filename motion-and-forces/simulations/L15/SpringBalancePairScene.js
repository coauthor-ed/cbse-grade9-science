import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawSpringBalance, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * SpringBalancePairScene — companion to blk-l15-s3 (Activity 6.6, Fig 6.26).
 *
 * Process Statement: however hard you pull, two balances connected end-to-
 * end always read the same number — because they are not measuring two
 * different forces, they are measuring the two ends of ONE third-law pair.
 *
 * Both balances' `reading` are driven from the SAME `_pull` value every
 * frame (never two independently-tracked numbers that could be nudged out
 * of sync by a bug) — the strongest way to make "always equal" true of the
 * code, not just asserted by the caption. Freeplay: a pull-strength slider
 * drives both in perfect lockstep, with a highlighted "=" between them that
 * pulses briefly whenever the slider moves.
 */

const W = 900;
const H = 600;

const Y = 300;
const LEFT_X = 260;
const RIGHT_X = 640;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  tension:  ['--sim-force-tension', FORCE_COLORS.tension],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
};

const MAX_READING = 20;
const STEPS = [
  { caption: 'Two spring balances are hooked together and pulled in opposite directions.', pull: 0 },
  { caption: 'Pull as hard as you like — both balances show exactly the same reading.', pull: 11 },
  { caption: 'Try a different pull — the two readings are still equal.', pull: 6 },
  { caption: 'Drag the slider yourself: however hard you pull, the two readings never disagree.', pull: 8 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SpringBalancePairScene extends CanvasSimulation {
  static simId = 'spring-balance-pair';
  static label = { en: 'Two balances, always equal' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Two spring balances are hooked together and pulled in opposite directions. No matter how hard or how ' +
    'gently the student pulls, both balances show the same reading, since they measure the two ends of a single ' +
    'action-reaction pair. A freeplay slider drives both readings in perfect lockstep.';

  static CONTROLS = [
    { type: 'slider', id: 'pull', label: 'Pull strength (N):', min: 0, max: MAX_READING, step: 1, value: 8, suffix: ' N' },
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

    this._pull = 0; // current displayed reading, both balances share it
    this._targetPull = 0;
    this._eqFlash = 0;
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
    this._targetPull = STEPS[this.stepIndex].pull;
    this._eqFlash = 0.6;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'pull') {
      this._targetPull = Number(value);
      this._eqFlash = 0.6;
      this._announce(`Pull set to ${this._targetPull} newtons on both balances.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    // exponential catch-up toward the target pull — overshoot-free, and one
    // single number both balances read from (see class doc)
    this._pull += (this._targetPull - this._pull) * 5 * dt;
    this._eqFlash = Math.max(0, this._eqFlash - dt);
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

    // hands pulling outward
    drawForceArrow(ctx, LEFT_X - 90, Y, { angle: Math.PI, magnitude: 6 + this._pull * 0.6, pxPerUnit: 4, color: c.muted, label: 'pull' });
    drawForceArrow(ctx, RIGHT_X + 90, Y, { angle: 0, magnitude: 6 + this._pull * 0.6, pxPerUnit: 4, color: c.muted, label: 'pull' });

    // the two balances — driven by the SAME `this._pull` value
    drawSpringBalance(ctx, LEFT_X, Y, { orientation: 'horizontal', reading: this._pull, maxReading: MAX_READING, color: c.tension, caseLength: 110, springLength: 50 });
    drawSpringBalance(ctx, RIGHT_X - 40, Y, { orientation: 'horizontal', reading: this._pull, maxReading: MAX_READING, color: c.tension, caseLength: 110, springLength: 50 });

    // connecting hook between the two case ends
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(LEFT_X + 110, Y);
    ctx.lineTo(RIGHT_X - 40, Y);
    ctx.stroke();

    const eqScale = 1 + this._eqFlash * 0.4;
    drawLabelPill(ctx, `${this._pull.toFixed(1)} N  =  ${this._pull.toFixed(1)} N`, W / 2, Y - 90, {
      color: this._eqFlash > 0 ? c.good : c.muted,
      font: `700 ${Math.round(15 * eqScale)}px Inter, system-ui`,
      bg: SimDraw.withAlpha(c.panelBg, 0.9),
    });

    this._drawCaption(ctx, step.caption);
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 460, 660, 24, 'center');
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
