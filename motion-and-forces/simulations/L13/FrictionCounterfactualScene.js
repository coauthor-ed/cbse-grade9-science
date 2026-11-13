import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawPerson, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * FrictionCounterfactualScene — companion to blk-l13-s9.
 * A ball is launched at 10 m/s on a surface with adjustable friction
 * (simple linear deceleration model: a = -k, ball stops at t = v0/k).
 * Beats: a net force of zero is the only case with no slowdown at all ->
 * a little friction gives a little (slow) deceleration -> push friction
 * lower and the stopping distance grows, but it's still finite -> the rule.
 * Freeplay: a friction slider from near-zero to high lets the student watch
 * the same ball travel dramatically different distances before stopping,
 * making explicit that "friction" is not a binary on/off switch.
 */

const W = 900;
const H = 600;

const TRACK_Y = 380;
const START_X = 120;
const MAX_X = 820;
const V0 = 10; // m/s

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', FORCE_COLORS.applied],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
  person:  ['--sim-motion-person', '#fbbf24'],
  track:   ['--sim-motion-track', '#475569'],
};

/** k (deceleration, m/s^2) -> a `drawGround` surface kind, so the track's
 *  own texture reads the friction level, not just the numeric readout. */
function groundKindFor(k) {
  if (k <= 0.05) return 'ice';
  if (k <= 0.35) return 'solid';
  return 'rough';
}

// friction deceleration constants (m/s^2) for the three fixed beats
const K_ZERO = 0;
const K_TINY = 0.6;
const K_LOWER = 0.25;

const STEPS = [
  { caption: 'With truly zero friction, the ball never slows at all — constant velocity, forever.', k: K_ZERO },
  { caption: 'Add a little friction: a small net force now acts, and the ball decelerates — slowly.', k: K_TINY },
  { caption: 'Lower the friction further and the ball travels much farther before stopping — but it still stops.', k: K_LOWER },
  { caption: 'Drag the slider: watch how far the ball gets before friction finally brings it to rest.', k: K_TINY },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

function stopTime(k) {
  return k > 0 ? V0 / k : Infinity;
}

function distanceAt(k, t) {
  const tStop = stopTime(k);
  const tt = Math.min(t, tStop);
  return V0 * tt - 0.5 * k * tt * tt;
}

export class FrictionCounterfactualScene extends CanvasSimulation {
  static simId = 'friction-counterfactual';
  static label = { en: 'What if friction is almost, but not quite, zero?' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A ball launched on a surface with adjustable friction. With truly zero friction it never slows. With a ' +
    'small amount of friction it decelerates slowly and travels a long distance before stopping. A slider lets ' +
    'the student adjust the friction level and watch the stopping distance change.';

  static CONTROLS = [
    { type: 'slider', id: 'friction', label: 'Friction level:', min: 1, max: 20, step: 1, value: 6, suffix: '' },
    { type: 'button', id: 'launch', label: 'Launch Ball' },
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

    this._frictionSlider = 6; // maps to k = slider/40 (max 0.5)
    this._running = false;
    this._elapsed = 0;
    this._ballRotation = 0;
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
    this._running = this.stepIndex < 3; // auto-run the fixed demo cases; freeplay waits for Launch
    this._elapsed = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'friction') {
      this._frictionSlider = Math.round(Number(value));
      this._announce(`Friction level set to ${this._frictionSlider}.`);
    } else if (id === 'launch') {
      this._running = true;
      this._elapsed = 0;
      this._announce('Launching the ball.');
    }
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    return this.stepIndex < 3;
  }

  _currentK() {
    if (this.stepIndex < 3) return STEPS[this.stepIndex].k;
    return this._frictionSlider / 40; // 1..20 -> 0.025..0.5
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    if (this._running) this._elapsed += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[Math.min(this.stepIndex, 3)]);
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
    const k = this._currentK();
    const tStop = stopTime(k);
    const dTotal = isFinite(tStop) ? distanceAt(k, tStop) : 60; // 60 m nominal "keeps going" cap for display

    drawGround(ctx, START_X - 40, MAX_X + 20, TRACK_Y, c, { kind: groundKindFor(k), color: c.track });

    // a launcher figure gives the ball a human scale reference and a "who
    // gave it its push" story beat — she doesn't move once the ball is
    // launched, only her arm pose (already mid-push) marks the moment.
    drawPerson(ctx, START_X - 34, TRACK_Y, { scale: 1.3, color: c.person, armPose: 'push', facing: 1 });

    const pxPerM = (MAX_X - START_X) / Math.max(dTotal, 20);
    const tNow = isFinite(tStop) ? Math.min(this._elapsed, tStop) : this._elapsed;
    const dNow = distanceAt(k, tNow);
    const ballX = Math.min(START_X + dNow * pxPerM, MAX_X - 14);
    const speed = isFinite(tStop) ? Math.max(0, 10 - k * tNow) : 10;
    this._ballRotation += speed * 0.05;

    this._drawBall(ctx, ballX, TRACK_Y - 14, c.shape);

    const stopped = isFinite(tStop) && this._elapsed >= tStop;
    const label = k === 0
      ? 'friction = 0 → never stops'
      : stopped
        ? `stopped after ${dTotal.toFixed(1)} m`
        : `k ≈ ${k.toFixed(2)} m/s² deceleration`;

    SimDraw.drawPanel(ctx, W / 2 - 260, 100, 520, 60, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
    ctx.font = '700 17px Inter, system-ui';
    ctx.fillStyle = c.good;
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2, 136);

    this._drawCaption(ctx, step.caption);
  }

  _drawBall(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this._ballRotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SimDraw.withAlpha(SimDraw.shade(color, -0.3), 0.85);
    ctx.beginPath();
    ctx.arc(3, 3, 11, 0.2, Math.PI * 0.9);
    ctx.arc(0, 0, 14, Math.PI * 0.9, 0.2, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = SimDraw.withAlpha('#0a0f1e', 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 0);
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
    wrapText(ctx, caption, W / 2 - 330, 480, 660, 24, 'center');
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
    this._announce(STEPS[Math.min(this.stepIndex, 3)].caption);
  }
}
