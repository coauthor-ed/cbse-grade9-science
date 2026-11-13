import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, lerp, cruise } from 'simulations/base/SimMotion.js';
import { drawPerson, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * ThirdLawBoatScene — companion to blk-l15-s5, iesc1-ch6 (newtons-third-law).
 *
 * Process Statement: this scene exists specifically to defuse "a heavier
 * object must push back harder" style thinking — the SAME third-law force
 * pair (jumper's push on the boat, boat's push on the jumper, always equal)
 * produces very different boat recoil distances depending on the boat's
 * mass, because recoil is a SECOND-law question (a = F/m) riding on top of
 * a THIRD-law force that never itself changes. This is the same lesson
 * ShipVsCanoeScene (a few slides earlier) already taught with a swimmer —
 * this scene reinforces it a second time with a fresh example.
 *
 * A rocket beat closes the scene with the same pattern at a different
 * scale (exhaust gas / rocket, rather than boat / jumper).
 */

const W = 900;
const H = 600;

const WATER_Y = 400;
const DOCK_X = W - 110;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  water:   ['--sim-motion-water', '#0ea5e9'],
  boat:    ['--sim-shape-alt', '#a16207'],
  person:  ['--sim-motion-person', FORCE_COLORS.reaction],
  forceA:  ['--sim-force-applied', FORCE_COLORS.applied],
  forceB:  ['--sim-force-reaction', FORCE_COLORS.reaction],
  rocket:  ['--sim-series-1', '#e2e8f0'],
  flame:   ['--sim-motion-flame', '#f97316'],
};

const STEP_STILL = 0;
const STEP_JUMP = 1;
const STEP_PAIR = 2;
const STEP_ROCKET = 3;

const STEPS = [
  { caption: 'A person stands in a small boat, near a dock.' },
  { caption: 'They jump toward the dock — and the boat shoots backward.' },
  { caption: 'Try a lighter or heavier boat: the push is always the same, but a lighter boat recoils much farther.' },
  { caption: 'A rocket does the same thing: it pushes gas down, the gas pushes the rocket up.' },
];

const BEAT_STEP_MAP = [
  [{ idx: STEP_STILL, dwellMs: null }],
  [{ idx: STEP_JUMP, dwellMs: null }],
  [{ idx: STEP_PAIR, dwellMs: null }],
  [{ idx: STEP_ROCKET, dwellMs: null }],
];

export class ThirdLawBoatScene extends CanvasSimulation {
  static simId = 'newtons-third-law-boat';
  static label = { en: "Newton's Third Law: The Boat and the Rocket" };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A person jumps from a small boat toward a dock. The boat recoils backward as the person moves forward, ' +
    'with labelled equal-and-opposite force arrows on the person and the boat. A boat-mass slider shows the same ' +
    'fixed push producing very different recoil distances depending on the boat\'s mass. A rocket is then shown ' +
    'expelling exhaust downward while lifting off upward, the same action-reaction pattern at a different scale.';

  static CONTROLS = [
    { type: 'button', id: 'prev', label: '← Back' },
    { type: 'button', id: 'next', label: 'Next →' },
    { type: 'slider', id: 'mass', label: 'Boat mass (kg):', min: 40, max: 300, step: 10, value: 90, suffix: '' },
    { type: 'button', id: 'replay', label: 'Replay jump' },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_STILL;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._liveRegion = null;
    this._boatMass = 90; // kg
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._canvas.tabIndex = 0;
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce(STEPS[STEP_STILL].caption);
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  isControlHidden(id) {
    if (id === 'prev') return this.stepIndex === STEP_STILL;
    if (id === 'next') return this.stepIndex === STEP_ROCKET;
    if (id === 'replay') return this.stepIndex !== STEP_JUMP && this.stepIndex !== STEP_PAIR;
    if (id === 'mass') return this.stepIndex !== STEP_JUMP && this.stepIndex !== STEP_PAIR;
    return false;
  }

  onBeatChange(beatIndex) {
    this._lessonLinked = true;
    const clamped = Math.max(0, Math.min(beatIndex, BEAT_STEP_MAP.length - 1));
    this._jumpToStep(BEAT_STEP_MAP[clamped][0].idx);
  }

  _jumpToStep(i) {
    this.stepIndex = i;
    this._stepEnterTime = 0;
    this._announce(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'next') this._jumpToStep(Math.min(STEP_ROCKET, this.stepIndex + 1));
    else if (id === 'prev') this._jumpToStep(Math.max(STEP_STILL, this.stepIndex - 1));
    else if (id === 'replay') this._stepEnterTime = 0;
    else if (id === 'mass') {
      this._boatMass = Math.round(Number(value));
      this._stepEnterTime = 0;
      this._announce(`Boat mass set to ${this._boatMass} kilograms.`);
    }
    this.requestUiUpdate?.();
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

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    if (this.stepIndex === STEP_ROCKET) this._drawRocket(ctx);
    else this._drawBoat(ctx);
    this._drawCaption(ctx, STEPS[this.stepIndex].caption);
  }

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  /** Boat recoil, in px, scaled so the fixed light-boat default (90 kg)
   *  reads similarly to the scene's original fixed 90px recoil — heavier
   *  boats recoil less, per a = F/m. */
  _boatRecoilPx() {
    const REFERENCE_RECOIL = 90; // px, at the default 90 kg
    return REFERENCE_RECOIL * (90 / this._boatMass);
  }

  _drawBoat(ctx) {
    const c = this.colors;
    const step = this.stepIndex;
    const startBoatX = DOCK_X - 200;
    const recoil = this._boatRecoilPx();

    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.water, 0.35);
    ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = c.muted;
    ctx.fillRect(DOCK_X, WATER_Y - 24, 70, H - WATER_Y + 24);
    ctx.restore();

    let boatX = startBoatX, personX = startBoatX + 10;
    if (step >= STEP_JUMP) {
      const prog = (step === STEP_JUMP || step === STEP_PAIR) ? cruise(clamp01(this._stepEnterTime / 1.2)) : 1;
      boatX = lerp(startBoatX, startBoatX - recoil, prog);
      personX = lerp(startBoatX + 10, DOCK_X + 20, prog);
    }

    ctx.save();
    ctx.fillStyle = c.boat;
    ctx.beginPath();
    ctx.ellipse(boatX + 40, WATER_Y - 4, 55, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(c.boat, -0.25);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    drawPerson(ctx, personX, WATER_Y - 15, {
      scale: 1.1,
      color: c.person,
      armPose: step >= STEP_JUMP ? 'raise' : 'hang',
      legPose: 'brace',
    });

    if (step >= STEP_PAIR && step < STEP_ROCKET) {
      drawForceArrow(ctx, personX, WATER_Y - 60, { angle: 0, length: 60, color: c.forceA, label: 'boat pushes feet forward' });
      drawForceArrow(ctx, boatX + 40, WATER_Y - 30, { angle: Math.PI, length: 60, color: c.forceB, label: 'feet push boat backward' });
      drawLabelPill(ctx, `boat mass: ${this._boatMass} kg — recoil ${recoil.toFixed(0)} px`, W / 2, 90, { color: c.muted, bg: SimDraw.withAlpha(c.panelBg, 0.85) });
    }
  }

  _drawRocket(ctx) {
    const c = this.colors;
    const t = clamp01(this._stepEnterTime / 2.2);
    const groundY = H - 90;
    const rocketY = lerp(groundY - 60, 80, cruise(t));
    const rx = W / 2;

    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, groundY);
    ctx.lineTo(W - 60, groundY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = c.flame;
    ctx.beginPath();
    ctx.moveTo(rx - 14, rocketY + 40);
    ctx.lineTo(rx + 14, rocketY + 40);
    ctx.lineTo(rx, rocketY + 40 + 24 + 12 * Math.sin(this._stepEnterTime * 20));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = c.rocket;
    ctx.beginPath();
    ctx.moveTo(rx, rocketY - 36);
    ctx.lineTo(rx - 16, rocketY + 40);
    ctx.lineTo(rx + 16, rocketY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(c.rocket, -0.2);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    drawForceArrow(ctx, rx + 40, rocketY + 40, { angle: -Math.PI / 2, length: 55, color: c.forceA, label: 'gas pushes rocket up' });
    drawForceArrow(ctx, rx - 40, rocketY + 40, { angle: Math.PI / 2, length: 55, color: c.forceB, label: 'rocket pushes gas down' });
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 550, 660, 24, 'center');
    ctx.restore();
  }
}
