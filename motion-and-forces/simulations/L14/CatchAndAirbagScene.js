import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';
import { drawPerson, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * CatchAndAirbagScene — companion to blk-l14-s4 (Fig 6.18-6.19).
 *
 * Process Statement: the ball's change in velocity (Δv) is fixed by the
 * situation — it arrives fast and must end at rest, no more, no less. The
 * only thing under the fielder's control is the TIME that takes, and
 * F = mΔv/Δt means stretching that time is the entire trick behind a soft
 * catch, bent knees, and an airbag: same Δv, longer Δt, smaller force.
 *
 * A fixed ball mass and incoming speed (so Δv never changes) drives a real
 * F = mΔv/Δt computation from the stopping TIME — the demo beats (stiff
 * catch: ~0.05 s, soft catch: ~0.3 s) are just two points on the same curve
 * a freeplay slider (active in the last beat) lets the student sweep
 * continuously, watching the force arrow shrink as stopping time grows.
 */

const W = 900;
const H = 600;

const BALL_M = 0.16; // kg, roughly a cricket ball
const BALL_V = 28;   // m/s incoming — this is the fixed Delta-v

const FIELDER_X = 560;
const GROUND_Y = 470;
const PERSON_SCALE = 2.3;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  ball:     ['--sim-shape', FORCE_COLORS.applied],
  person:   ['--sim-motion-person', '#fbbf24'],
  bad:      ['--sim-motion-bad', FORCE_COLORS.netBad],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
};

// stiff catch: ~0.05s, soft catch: ~0.3s
const STOP_TIME_STIFF = 0.05;
const STOP_TIME_SOFT = 0.3;

const STEPS = [
  { caption: 'A fast cricket ball reaches a fielder. She can catch it in two very different ways.', stopTime: null },
  { caption: 'Stiff hands stop the ball in a tiny time — the force on her hands is enormous.', stopTime: STOP_TIME_STIFF },
  { caption: 'Pulling her hands back with the ball lengthens the stopping time — the force shrinks.', stopTime: STOP_TIME_SOFT },
  { caption: 'Try the slider yourself: stretch the stopping time and watch the force shrink — this is why airbags work.', stopTime: STOP_TIME_SOFT },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

function forceFor(stopTime) {
  return (BALL_M * BALL_V) / Math.max(0.005, stopTime);
}

export class CatchAndAirbagScene extends CanvasSimulation {
  static simId = 'catch-and-airbag';
  static label = { en: 'More time to stop, smaller force' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A fielder catches a fast cricket ball. Stiff hands stop it in a very short time, producing an enormous ' +
    'force arrow. Pulling her hands back over a longer time shrinks the force arrow dramatically. A freeplay ' +
    'slider lets the student sweep the stopping time continuously and watch the computed force respond, the ' +
    'same principle an airbag uses.';

  static CONTROLS = [
    { type: 'slider', id: 'stopTime', label: 'Stopping time (s):', min: 0.02, max: 0.5, step: 0.01, value: 0.3, suffix: 's' },
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
    this._freeStopTime = STOP_TIME_SOFT;
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

  onControlChange(id, value) {
    if (id === 'stopTime') {
      this._freeStopTime = Number(value);
      this._announce(`Stopping time set to ${this._freeStopTime.toFixed(2)} seconds.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _currentStopTime() {
    if (this.stepIndex === 3) return this._freeStopTime;
    return STEPS[this.stepIndex].stopTime ?? STOP_TIME_SOFT;
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
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, GROUND_Y);
    ctx.lineTo(W - 60, GROUND_Y);
    ctx.stroke();

    const showForce = this.stepIndex >= 1;
    const stopTime = this._currentStopTime();
    const F = forceFor(stopTime);
    // the hand's resting catch point, and how far further back it gives —
    // the "give" is literally the distance implied by decelerating BALL_V
    // over stopTime, longer stopping time visibly pulls the hand back further
    const HAND_REST_X = FIELDER_X - 26 * PERSON_SCALE;
    const HAND_Y = GROUND_Y - 62 * PERSON_SCALE;
    const giveDx = Math.min(130, 70 * (stopTime / STOP_TIME_SOFT));
    const p = this.stepIndex === 0 ? 0 : cruise(clamp01(this._stepEnterTime / 1.2));
    const handPullback = showForce ? giveDx * p : 0;
    const handX = HAND_REST_X - handPullback;

    drawPerson(ctx, FIELDER_X, GROUND_Y, {
      scale: PERSON_SCALE,
      color: c.person,
      armPose: 'push',
      facing: -1,
    });

    // ball sits at the (moving) hand position once caught; before that, it
    // approaches from the right, travelling left toward the fielder
    const ballX = this.stepIndex === 0 ? HAND_REST_X + 260 * (1 - p) : handX - 4;
    ctx.fillStyle = c.ball;
    ctx.beginPath();
    ctx.arc(ballX, HAND_Y, 13, 0, Math.PI * 2);
    ctx.fill();

    if (showForce) {
      const forceColor = F > 300 ? c.bad : c.good;
      // the stopping force on the ball points back the way it came from —
      // rightward, back toward the fielder's body — arrow tail starts at
      // the ball and points into the body, arrowhead landing near the chest
      drawForceArrow(ctx, ballX, HAND_Y - 4, {
        angle: 0,
        magnitude: F,
        pxPerUnit: 0.35,
        minLen: 26,
        maxLen: 220,
        color: forceColor,
        label: `${F.toFixed(0)} N`,
      });
    }

    drawLabelPill(ctx, `Δv fixed (28 m/s → 0). Stopping time = ${stopTime.toFixed(2)} s`, W / 2, 80, { color: c.muted });

    if (this.stepIndex === 3) {
      drawLabelPill(ctx, 'An airbag works on exactly this: stretch Δt, shrink F', W / 2, 120, { color: c.good });
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
