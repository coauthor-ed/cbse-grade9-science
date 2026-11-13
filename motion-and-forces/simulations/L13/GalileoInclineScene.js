import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';
import { drawGround, drawLabelPill, wrapText, FORCE_COLORS, STROKE } from '../shared/PhysicsSceneKit.js';

/**
 * GalileoInclineScene — companion to blk-l13-s1.
 *
 * Process Statement: removing friction doesn't ADD motion — it removes the
 * ONLY thing that was ever stopping it. Inertia isn't "weaker resistance to
 * stopping"; it's the complete absence of anything resisting continued
 * motion once the opposing force is gone. The ramp is just a repeatable way
 * to launch the ball at the same speed every time, so the surface is the
 * only variable that changes.
 *
 * Freeplay: a labeled friction-stage selector (rough / medium / smooth /
 * (near) frictionless) re-releases the ball down the same ramp each time —
 * deliberately staged/qualitative rather than a continuous numeric slider,
 * so this stays the *introduction* and doesn't duplicate
 * FrictionCounterfactualScene's later, continuous near-zero exploration.
 * "Frictionless" settles the ball into a fixed on-screen position (rather
 * than looping back to the ramp — which visually reads as "coming back",
 * the opposite of what constant-velocity-forever means — or running off a
 * finite canvas) and switches to a treadmill illusion: the ramp recedes
 * out of view and the ground's own texture streams backward underneath the
 * still-spinning ball, exactly the way an endless-runner sells "still
 * moving" without needing infinite canvas width.
 */

const W = 900;
const H = 600;

const GROUND_Y = 430;
const RAMP_TOP = { x: 130, y: 260 };
const RAMP_FOOT = { x: 300, y: GROUND_Y };
const GROUND_X1 = W - 60;
const CENTER_X = 480; // where the ball settles once frictionless motion "cruises"

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', FORCE_COLORS.applied],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
  bad:      ['--sim-motion-bad', FORCE_COLORS.netBad],
  ramp:     ['--sim-shape', '#475569'],
};

// friction stages: id -> { groundKind (drawGround's `kind`), stopPx (px
// travelled along the ground before stopping, Infinity = never), label }
const STAGES = {
  rough:        { groundKind: 'rough', stopPx: 130, label: 'rough surface — stops almost immediately' },
  medium:       { groundKind: 'solid', stopPx: 300, label: 'medium friction — rolls a fair distance' },
  smooth:       { groundKind: 'ice',   stopPx: 480, label: 'smooth (low friction) — rolls much farther' },
  frictionless: { groundKind: 'ice',   stopPx: Infinity, label: 'no friction at all — never stops' },
};

const STEPS = [
  { caption: 'Galileo’s thought experiment: roll a ball down a ramp onto a horizontal surface.', stage: 'rough' },
  { caption: 'With friction present, the ball slows and stops — as you always see in real life.', stage: 'rough' },
  { caption: 'Make the surface smoother, and the ball travels much farther before stopping.', stage: 'smooth' },
  { caption: 'Remove friction completely, and nothing stops it — it rolls at constant velocity forever.', stage: 'frictionless' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

const RAMP_TIME = 1.0; // s, time to roll down the ramp
const GROUND_TIME = 2.2; // s, time to travel the full stop distance (finite stages)
const FREE_SPEED = 260; // px/s, constant speed once frictionless

export class GalileoInclineScene extends CanvasSimulation {
  static simId = 'galileo-incline';
  static label = { en: 'Galileo: what if friction vanished?' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A ball rolls down a ramp onto a horizontal surface whose friction level can be changed. On a rough surface ' +
    'the ball stops almost immediately. On a smoother surface it travels much farther. With friction removed ' +
    'entirely, the ball settles at a fixed position on screen and keeps spinning forever while the ramp scrolls ' +
    'out of view and the ground streams backward beneath it, showing constant velocity with no natural stopping ' +
    'point — inertia as the absence of an opposing force, not a weaker version of one. A freeplay selector lets ' +
    'the student choose the friction stage and re-release the ball.';

  static CONTROLS = [
    { type: 'select', id: 'stage', label: 'Surface:', options: [
      { value: 'rough', label: 'Rough' },
      { value: 'medium', label: 'Medium' },
      { value: 'smooth', label: 'Smooth' },
      { value: 'frictionless', label: '(Near) frictionless' },
    ] },
    { type: 'button', id: 'release', label: 'Release Ball' },
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

    this._freeStage = 'medium';
    this._freeplayActive = false;
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
    // Re-entering a beat (including the last one) always starts from that
    // beat's own scripted stage, matching its caption — a student's earlier
    // freeplay exploration shouldn't linger and silently contradict the
    // text the next time they arrive here.
    this._freeplayActive = false;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'stage') {
      this._freeStage = value;
      this._freeplayActive = true;
      this._stepEnterTime = 0;
      this._announce(`Surface set to ${STAGES[value]?.label || value}.`);
    } else if (id === 'release') {
      this._freeplayActive = true;
      this._stepEnterTime = 0;
      this._announce('Releasing the ball.');
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < STEPS.length - 1;
  }

  /** The scripted stage for the current beat, EXCEPT on the final beat
   *  once the student has actually touched the freeplay controls — until
   *  then, even the final beat (controls unlocked) still shows its own
   *  scripted "frictionless" stage so the visual matches that beat's own
   *  caption from the moment it's reached, not just after interaction. */
  _currentStage() {
    const isLastBeat = this.stepIndex === STEPS.length - 1;
    if (isLastBeat && this._freeplayActive) return STAGES[this._freeStage];
    return STAGES[STEPS[this.stepIndex].stage];
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

  _ballPos(stage) {
    const t = this._stepEnterTime;
    const rampP = cruise(clamp01(t / RAMP_TIME));
    const rx = RAMP_TOP.x + rampP * (RAMP_FOOT.x - RAMP_TOP.x);
    const ry = RAMP_TOP.y + rampP * (RAMP_FOOT.y - RAMP_TOP.y);
    if (t < RAMP_TIME) return { x: rx, y: ry - 14, onRamp: true, scrollOffset: 0 };

    const groundT = t - RAMP_TIME;

    if (!isFinite(stage.stopPx)) {
      // Frictionless: travel normally off the ramp foot toward a fixed
      // on-screen resting point (CENTER_X) at constant speed — a real,
      // visible bit of rolling, not a teleport. Once it reaches that point,
      // it stays there for good; any further "distance" the ball would
      // have covered becomes a scroll offset instead (see _drawScene /
      // _drawTreadmillGround), so the ball never has to loop back to where
      // it started, and never has to stop at a finite canvas edge either.
      const travelled = groundT * FREE_SPEED;
      const settleDist = CENTER_X - RAMP_FOOT.x;
      if (travelled <= settleDist) {
        return { x: RAMP_FOOT.x + travelled, y: GROUND_Y - 14, onRamp: false, scrollOffset: 0 };
      }
      return { x: CENTER_X, y: GROUND_Y - 14, onRamp: false, scrollOffset: travelled - settleDist };
    }

    const maxTravel = GROUND_X1 - RAMP_FOOT.x - 20;
    const stop = Math.min(stage.stopPx, maxTravel);
    const p = cruise(clamp01(groundT / GROUND_TIME));
    return { x: RAMP_FOOT.x + stop * p, y: GROUND_Y - 14, onRamp: false, scrollOffset: 0 };
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const stage = this._currentStage();
    const pos = this._ballPos(stage);
    const scrollOffset = pos.scrollOffset || 0;

    if (scrollOffset > 0) {
      // Cruising: the ramp has receded out of view and the ground itself
      // is the thing "moving" — the ball's own x is frozen at CENTER_X.
      this._drawRamp(ctx, -scrollOffset);
      this._drawTreadmillGround(ctx, scrollOffset);
    } else {
      this._drawRamp(ctx, 0);
      drawGround(ctx, RAMP_FOOT.x - 10, GROUND_X1, GROUND_Y, c, { kind: stage.groundKind, color: c.ramp });
    }

    this._ballRotation += (pos.onRamp ? 4 : 6) * 0.016;
    this._drawBall(ctx, pos.x, pos.y, c.shape);

    const labelColor = !isFinite(stage.stopPx) ? c.good : (stage.stopPx <= 150 ? c.bad : c.wedge);
    drawLabelPill(ctx, stage.label, W / 2, 150, { color: labelColor, bg: SimDraw.withAlpha(c.panelBg, 0.85) });

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
    // shading crescent (two-tone, not a gradient) + a spin tick so the ball
    // visibly rolls rather than slides
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

  /** @param {number} shiftX - horizontal offset (negative = leftward, out
   *  of view) applied while the frictionless ball is cruising. Skips
   *  drawing entirely once the ramp has fully scrolled off the left edge —
   *  "goes out of view" for real, not just visually implied. */
  _drawRamp(ctx, shiftX = 0) {
    if (RAMP_FOOT.x + shiftX < -20) return;
    const c = this.colors;
    ctx.save();
    ctx.translate(shiftX, 0);
    ctx.fillStyle = SimDraw.withAlpha(c.ramp, 0.35);
    ctx.strokeStyle = c.ramp;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(RAMP_TOP.x, RAMP_TOP.y);
    ctx.lineTo(RAMP_FOOT.x, RAMP_FOOT.y);
    ctx.lineTo(RAMP_TOP.x, RAMP_FOOT.y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(RAMP_TOP.x, RAMP_TOP.y);
    ctx.lineTo(RAMP_FOOT.x, RAMP_FOOT.y);
    ctx.stroke();
    ctx.restore();
  }

  /** The "endless ground" drawn once the frictionless ball has settled at
   *  CENTER_X: a full-width static ground line (the ball's own position
   *  never implies a start or end to this surface any more) with ice-shine
   *  ticks whose phase is driven by `scrollOffset`, streaming leftward
   *  underneath the stationary-but-spinning ball — the standard treadmill
   *  trick for depicting motion that has no natural stopping point without
   *  needing an infinite canvas. */
  _drawTreadmillGround(ctx, scrollOffset) {
    const c = this.colors;
    const x0 = 20, x1 = W - 20;
    ctx.save();
    ctx.strokeStyle = c.ramp;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, GROUND_Y);
    ctx.lineTo(x1, GROUND_Y);
    ctx.stroke();

    const spacing = 90;
    const phase = scrollOffset % spacing;
    ctx.strokeStyle = SimDraw.withAlpha('#7dd3fc', 0.55);
    ctx.lineWidth = STROKE.fine;
    for (let x = x0 + 30 - phase; x < x1 - 10; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      ctx.lineTo(x + 26, GROUND_Y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 500, 660, 24, 'center');
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
