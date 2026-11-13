import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';
import { drawPerson, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * ThirdLawPairsScene — companion to blk-l15-s1 (Fig 6.28).
 *
 * Process Statement: the SAME interaction produces two forces, equal and
 * opposite, at the same instant, on two different objects — push harder and
 * BOTH arrows grow together, always staying equal, because they're the same
 * event seen from two sides, not two independent pushes that happen to
 * match.
 *
 * Freeplay: a paddle-push-strength slider live-scales both force arrows
 * together (never independently — the whole point) and, on "Paddle!",
 * drives the canoe's glide with a genuine accelerate/cruise/drag model
 * (SimMotion.cruise for the stroke, a small drag term so the canoe settles
 * rather than gliding forever) — repeated paddling is needed to keep it
 * moving, the same way it would be on real water.
 */

const W = 900;
const H = 600;

const CANOE_Y0 = 340; // resting position, no offset
const WATER_Y0 = CANOE_Y0 + 10;
const DRAG = 0.35; // per-second velocity decay while coasting

// Paddle geometry: a shaft pivoting at the paddler's grip, angle measured
// from straight-down (positive = blade tilted forward/ahead of the canoe,
// negative = blade swept backward past vertical). A stroke sweeps the
// blade from the entry angle to the exit angle — the actual motion that
// pushes water backward — rather than holding one fixed pose throughout.
const PADDLE_PIVOT_DX = 95, PADDLE_PIVOT_DY = -55;
const PADDLE_SHAFT_LEN = Math.hypot(25, 75); // matches the scene's original static pose
const PADDLE_THETA_ENTRY = Math.atan2(25, 75);  // ~18°, blade forward — poised to push
const PADDLE_THETA_EXIT = -0.61;                // ~-35°, blade swept back — mid/end of push
const PADDLE_BLADE_ROT_OFFSET = 0.5 - PADDLE_THETA_ENTRY; // preserves the original blade-to-shaft angle
// A weak paddle strength barely tilts/sweeps the blade at all and takes its
// time about it; a strong one sweeps the full entry-to-exit arc in a quick,
// punchy stroke — the paddle's own motion reflecting the slider, not just
// the force arrows and the resulting canoe speed.
const STROKE_DURATION_MIN = 0.32, STROKE_DURATION_MAX = 0.55;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  water:    ['--sim-motion-water', '#38bdf8'],
  canoe:    ['--sim-motion-wedge', '#fbbf24'],
  applied:  ['--sim-force-applied', FORCE_COLORS.applied],
  reaction: ['--sim-force-reaction', FORCE_COLORS.reaction],
};

const STEPS = [
  { caption: 'A canoeist pushes the water backwards with her paddle.' },
  { caption: 'The water pushes the paddle and canoe forward, with an equal force.' },
  { caption: 'The two forces act on two different objects — paddle and water — so they do not cancel.' },
  { caption: 'Paddle it yourself: push harder and watch both force arrows grow together, always equal.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class ThirdLawPairsScene extends CanvasSimulation {
  static simId = 'third-law-pairs';
  static label = { en: 'Push the water, and it pushes back' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A canoeist pushes water backwards with her paddle. The water pushes the paddle and canoe forward with an ' +
    'equal force. The two forces act on two different objects, the paddle and the water, so they never cancel. ' +
    'A freeplay paddle-strength slider scales both force arrows together and drives the canoe forward when the ' +
    'student presses Paddle, with the canoe gradually slowing between strokes.';

  static CONTROLS = [
    { type: 'slider', id: 'strength', label: 'Paddle strength:', min: 10, max: 100, step: 5, value: 55, suffix: '%' },
    { type: 'button', id: 'paddle', label: 'Paddle!' },
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

    this._strength = 55; // %
    this._canoeV = 0; // px/s
    this._canoeX = 0; // cumulative offset, wraps for a looping "open water" feel
    this._strokeFlash = 0; // seconds remaining on the current stroke's arrow pulse
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
    if (id === 'strength') {
      this._strength = Math.round(Number(value));
    } else if (id === 'paddle') {
      this._canoeV += (this._strength / 100) * 130;
      this._strokeFlash = this._strokeDuration();
      this._announce(`Paddled at ${this._strength} percent strength.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    if (this.stepIndex === 3) {
      this._canoeX += this._canoeV * dt;
      this._canoeV = Math.max(0, this._canoeV - this._canoeV * DRAG * dt - 6 * dt);
      this._strokeFlash = Math.max(0, this._strokeFlash - dt);
    }
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
    this._drawWater(ctx);

    const freeplay = this.stepIndex === 3;
    const canoeX = 320 + (freeplay ? this._canoeX % 420 : 0);
    this._drawCanoe(ctx, canoeX, this._paddleTheta(freeplay));

    const showForward = this.stepIndex >= 1 || freeplay;
    if (showForward) {
      const strengthFrac = freeplay ? this._strength / 100 : (this.stepIndex === 3 ? 1 : 0.6);
      const pulse = freeplay ? 1 + this._strokeFlash * 0.5 : 1;
      this._drawForcePair(ctx, canoeX, strengthFrac * pulse);
    }

    if (freeplay) this._drawSpeedReadout(ctx);
    this._drawCaption(ctx, step.caption);
  }

  _drawWater(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.water, 0.1);
    ctx.fillRect(40, WATER_Y0, W - 80, 190);
    ctx.strokeStyle = SimDraw.withAlpha(c.water, 0.45);
    ctx.lineWidth = 2;
    const scroll = (this.stepIndex === 3 ? this._canoeX : 0) % 34;
    for (let x = 60 - scroll; x < W - 40; x += 34) {
      ctx.beginPath();
      ctx.arc(x, CANOE_Y0 + 30 + Math.sin(x * 0.3) * 4, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** A harder paddle strength gets a shorter, snappier stroke — a light
   *  10% push shouldn't take as long to "complete" as a full 100% haul. */
  _strokeDuration() {
    const strengthFrac = clamp01(this._strength / 100);
    return STROKE_DURATION_MAX - (STROKE_DURATION_MAX - STROKE_DURATION_MIN) * strengthFrac;
  }

  /** How far through an active stroke we are (0 = just entered the water,
   *  1 = swept all the way back), or null when idle/resting between
   *  strokes — driven by the same _strokeFlash countdown "paddle" already
   *  sets, so no extra state is needed to know a stroke is in progress. */
  _strokeProgress(freeplay) {
    if (!freeplay || this._strokeFlash <= 0) return null;
    return clamp01(1 - this._strokeFlash / this._strokeDuration());
  }

  /** The paddle's shaft angle for the current frame: sweeping from the
   *  forward entry angle toward the backward exit angle over an active
   *  freeplay stroke (the actual "push the water back" motion) — how FAR
   *  it sweeps scales with paddle strength (a light push barely tilts the
   *  blade; a full-strength one sweeps the whole entry-to-exit arc), and
   *  snaps to a fixed entry/exit pose for the scripted, non-animated
   *  beats. */
  _paddleTheta(freeplay) {
    const progress = this._strokeProgress(freeplay);
    if (progress != null) {
      const strengthFrac = clamp01(this._strength / 100);
      const exitTheta = PADDLE_THETA_ENTRY + (PADDLE_THETA_EXIT - PADDLE_THETA_ENTRY) * strengthFrac;
      return PADDLE_THETA_ENTRY + (exitTheta - PADDLE_THETA_ENTRY) * cruise(progress);
    }
    if (freeplay || this.stepIndex === 0) return PADDLE_THETA_ENTRY;
    return PADDLE_THETA_EXIT; // beats 1-2: "has just pushed the water back"
  }

  _drawCanoe(ctx, canoeX, paddleTheta) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = c.canoe;
    ctx.beginPath();
    ctx.moveTo(canoeX, CANOE_Y0);
    ctx.quadraticCurveTo(canoeX + 120, CANOE_Y0 - 60, canoeX + 240, CANOE_Y0);
    ctx.quadraticCurveTo(canoeX + 120, CANOE_Y0 + 26, canoeX, CANOE_Y0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(c.canoe, -0.25);
    ctx.lineWidth = 2;
    ctx.stroke();

    // paddler, seated (a low "brace" leg pose reads as sitting-in-a-canoe well
    // enough at this silhouette scale)
    drawPerson(ctx, canoeX + 40, CANOE_Y0 - 12, {
      scale: 0.85,
      color: c.label,
      legPose: 'brace',
      armPose: 'push',
      facing: 1,
    });

    // paddle shaft + blade — pivots at the grip, sweeping through
    // paddleTheta rather than a single fixed pose, so an actual stroke is
    // something the student watches happen, not just infers from arrows.
    const pivotX = canoeX + PADDLE_PIVOT_DX;
    const pivotY = CANOE_Y0 + PADDLE_PIVOT_DY;
    const bladeX = pivotX + Math.sin(paddleTheta) * PADDLE_SHAFT_LEN;
    const bladeY = pivotY + Math.cos(paddleTheta) * PADDLE_SHAFT_LEN;
    ctx.strokeStyle = c.water;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bladeX, bladeY);
    ctx.stroke();
    ctx.fillStyle = c.water;
    ctx.beginPath();
    ctx.ellipse(bladeX, bladeY, 10, 26, paddleTheta + PADDLE_BLADE_ROT_OFFSET, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawForcePair(ctx, canoeX, strengthFrac) {
    const c = this.colors;
    const armX = canoeX + 120;
    const y = CANOE_Y0 + 34;
    const magnitude = 6 + strengthFrac * 22; // arbitrary "force units" both arrows share

    drawForceArrow(ctx, armX, y, {
      angle: Math.PI, // pointing left — paddle pushes water back
      magnitude, pxPerUnit: 6, minLen: 40, maxLen: 190,
      color: c.reaction,
      label: 'paddle pushes water back',
    });
    drawForceArrow(ctx, armX, y - 50, {
      angle: 0, // pointing right — water pushes canoe forward
      magnitude, pxPerUnit: 6, minLen: 40, maxLen: 190,
      color: c.applied,
      label: 'water pushes canoe forward',
    });
    drawLabelPill(ctx, 'always equal', armX, y - 92, { color: c.muted, bg: SimDraw.withAlpha(c.panelBg, 0.85) });
  }

  _drawSpeedReadout(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.font = '700 13px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = c.muted;
    ctx.fillText(`canoe speed: ${(this._canoeV / 20).toFixed(1)} m/s`, 24, 40);
    ctx.restore();
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
