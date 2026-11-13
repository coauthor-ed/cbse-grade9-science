import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * FrictionSurfacesScene — companion to blk-l05-s2, iesc1-ch6 (friction-force).
 * A box on a horizontal surface. First shows a push arrow meeting a friction
 * arrow that opposes it (nothing sliding yet), then releases the box with a
 * fixed initial speed on a rough surface (short slide) and again on a smooth
 * surface (long slide) using simple constant-deceleration kinematics. Hands
 * off to a roughness slider + push button for free experimentation.
 */

const W = 900;
const H = 320;

const TRACK_Y = 190;
const START_X = 110;
const MAX_X = W - 80;

const V0 = 260; // px/s initial slide speed
const DECEL_MIN = 40;  // px/s^2 — smoothest surface
const DECEL_MAX = 260; // px/s^2 — roughest surface

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-friction-muted', '#94a3b8'],
  ground:   ['--sim-wedge', '#94a3b8'],
  box:      ['--sim-friction-box', '#e2e8f0'],
  push:     ['--sim-friction-push', '#38bdf8'],
  friction: ['--sim-friction-arrow', '#f472b6'],
  trail:    ['--sim-track', '#fbbf24'],
};

const STEP_PUSH = 0;
const STEP_FRICTION = 1;
const STEP_ROUGH = 2;
const STEP_SMOOTH = 3;
const STEP_RECAP = 4;
const STEP_FREEPLAY = 5;

const ROUGHNESS_AT_STEP = { [STEP_ROUGH]: 8, [STEP_SMOOTH]: 2 };

function decelFor(roughness) { return DECEL_MIN + (roughness / 10) * (DECEL_MAX - DECEL_MIN); }
function stopDistance(decel) { return (V0 * V0) / (2 * decel); }

const STEPS = [
  { caption: "You push the box — it resists more than you'd expect." },
  { caption: 'That resistance is friction, opposing your push.' },
  { caption: 'Rough surface: strong friction, short slide.' },
  { caption: 'Smooth surface: weak friction, long slide.' },
  { caption: 'Same push, same starting speed — very different stopping distances.' },
  { caption: 'Pick a roughness, press Push, and watch it slide to a stop.' },
];

const BEAT_STEP_MAP = [
  [{ idx: STEP_PUSH, dwellMs: null }],
  [{ idx: STEP_FRICTION, dwellMs: null }],
  [{ idx: STEP_ROUGH, dwellMs: null }],
  [{ idx: STEP_SMOOTH, dwellMs: null }],
  [{ idx: STEP_RECAP, dwellMs: null }],
];

export class FrictionSurfacesScene extends CanvasSimulation {
  static simId = 'friction-surfaces';
  static label = { en: 'Friction on Rough and Smooth Surfaces' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Friction on rough and smooth surfaces. A box is pushed and resists, then friction is shown opposing ' +
    'the push. Released with the same starting speed, the box slides only a short distance on a rough ' +
    'surface but a long distance on a smooth surface before friction brings it to rest, then hands off to ' +
    'a roughness slider and push button for free experimentation.';

  static CONTROLS = [
    { type: 'button', id: 'explore', label: 'Try it yourself →' },
    { type: 'slider', id: 'roughness', label: 'Surface roughness:', min: 0, max: 10, step: 1, value: 5 },
    { type: 'button', id: 'push', label: 'Push →' },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_PUSH;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this.freeRoughness = 5;
    this._freeElapsed = 0;
    this._freeRunning = false;
    this._liveRegion = null;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce("Friction. You push the box, and it resists more than you'd expect.");
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  isControlHidden(id) {
    if (id === 'explore') return this.stepIndex !== STEP_RECAP;
    if (id === 'roughness' || id === 'push') return this.stepIndex !== STEP_FREEPLAY;
    return false;
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
    this.stepIndex = i;
    this._stepEnterTime = 0;
    this._announce(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'explore') {
      this._jumpToStep(STEP_FREEPLAY);
    } else if (id === 'roughness') {
      this.freeRoughness = Math.round(Math.min(10, Math.max(0, Number(value))));
    } else if (id === 'push') {
      this._freeElapsed = 0;
      this._freeRunning = true;
      this._announce(`Pushed. Roughness ${this.freeRoughness}.`);
    }
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }

  // Position along the track (px from START_X), given elapsed slide time and a deceleration.
  _slideOffset(elapsed, decel) {
    const tStop = V0 / decel;
    const t = Math.min(elapsed, tStop);
    return V0 * t - 0.5 * decel * t * t;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    if (this._freeRunning) this._freeElapsed += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx);
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

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawScene(ctx) {
    const c = this.colors;
    const step = this.stepIndex;

    // Ground
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.ground, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, TRACK_Y + 26);
    ctx.lineTo(W - 60, TRACK_Y + 26);
    ctx.stroke();
    ctx.restore();

    let boxX = START_X;
    let showPush = false;
    let showFriction = false;
    let maxReached = 0;

    if (step === STEP_PUSH) {
      showPush = clamp01(this._stepEnterTime / 0.5) > 0.05;
    } else if (step === STEP_FRICTION) {
      showPush = true;
      showFriction = clamp01(this._stepEnterTime / 0.5) > 0.05;
    } else if (step === STEP_ROUGH || step === STEP_SMOOTH) {
      const decel = decelFor(ROUGHNESS_AT_STEP[step]);
      const offset = this._slideOffset(this._stepEnterTime, decel);
      maxReached = Math.min(offset, MAX_X - START_X);
      boxX = START_X + maxReached;
      showFriction = true;
    } else if (step === STEP_RECAP) {
      const roughOffset = Math.min(stopDistance(decelFor(8)), MAX_X - START_X);
      const smoothOffset = Math.min(stopDistance(decelFor(2)), MAX_X - START_X);
      this._drawGhostBox(ctx, START_X + roughOffset, c.trail, 'rough: stops here');
      this._drawGhostBox(ctx, START_X + smoothOffset, c.friction, 'smooth: stops here');
      boxX = START_X;
    } else if (step === STEP_FREEPLAY) {
      const decel = decelFor(this.freeRoughness);
      const offset = this._slideOffset(this._freeElapsed, decel);
      maxReached = Math.min(offset, MAX_X - START_X);
      boxX = START_X + maxReached;
      showFriction = this._freeRunning;
    }

    // Box
    ctx.save();
    SimDraw.drawPanel(ctx, boxX - 30, TRACK_Y - 22, 60, 44, { bg: c.box, radius: 6 });
    ctx.restore();

    if (showPush) {
      ctx.save();
      ctx.globalAlpha = step === STEP_PUSH ? clamp01(this._stepEnterTime / 0.5) : 1;
      SimDraw.drawArrow(ctx, boxX - 60, TRACK_Y, boxX - 32, TRACK_Y, { color: c.push, lineWidth: 4 });
      ctx.restore();
      SimDraw.drawLabel(ctx, 'push', boxX - 46, TRACK_Y - 16, { bg: c.panelBg, color: c.push });
    }
    if (showFriction) {
      ctx.save();
      ctx.globalAlpha = step === STEP_FRICTION ? clamp01(this._stepEnterTime / 0.5) : 1;
      SimDraw.drawArrow(ctx, boxX + 30, TRACK_Y, boxX + 58, TRACK_Y, { color: c.friction, lineWidth: 4 });
      ctx.restore();
      SimDraw.drawLabel(ctx, 'friction', boxX + 44, TRACK_Y - 16, { bg: c.panelBg, color: c.friction });
    }

    if (step === STEP_ROUGH || step === STEP_SMOOTH || step === STEP_FREEPLAY) {
      const label = step === STEP_ROUGH ? 'rough surface' : step === STEP_SMOOTH ? 'smooth surface' : `roughness ${this.freeRoughness}`;
      ctx.save();
      ctx.font = '600 12px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'left';
      ctx.fillText(label, 70, TRACK_Y + 60);
      ctx.restore();
    }

    this._drawCaption(ctx, STEPS[step].caption);
  }

  _drawGhostBox(ctx, x, color, label) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 30, TRACK_Y - 22, 60, 44);
    ctx.restore();
    SimDraw.drawLabel(ctx, label, x, TRACK_Y - 34, { bg: this.colors.panelBg, color });
  }

  _drawCaption(ctx, caption) {
    ctx.save();
    ctx.font = '600 15px Inter, system-ui';
    ctx.fillStyle = this.colors.label;
    ctx.textAlign = 'center';
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.fillText(caption, W / 2, H - 18);
    ctx.restore();
  }
}
