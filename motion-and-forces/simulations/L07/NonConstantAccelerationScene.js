import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';

/**
 * NonConstantAccelerationScene — companion to blk-l07-s12.
 * A drone's real acceleration ramps linearly from 0 to 4 m/s^2 over 4 s, so
 * a(t) = t, v(t) = t^2/2, s(t) = t^3/6 (real, curved). The wrong constant-a
 * prediction assumes a = 4 m/s^2 for the whole interval: v(t) = 4t (straight
 * line), s(4) = 1/2 * 4 * 16 = 32 m. Real s(4) = 64/6 ~ 10.67 m — the
 * constant-a shortcut overshoots badly. Beats: setup -> real curve appears ->
 * constant-a line overlays, areas shade -> numeric comparison + two drone
 * markers on a flight-path bar showing how far apart the predictions land.
 */

const W = 900;
const H = 600;

const GX0 = 160, GY0 = 380, GX1 = 740, GY1 = 90;
const T_MAX = 4;
const DEFAULT_A_FINAL = 4;
const BAR_X0 = 160, BAR_X1 = 740, BAR_Y = 500;

// a(t) ramps linearly 0 -> aFinal over T_MAX. v(t) = aFinal/(2*T_MAX) * t^2.
// s(T_MAX) = aFinal*T_MAX^2/6 (real). Wrong shortcut assumes aFinal for the
// WHOLE interval: s(T_MAX) = 0.5*aFinal*T_MAX^2 (assumed) — exactly 3x the
// real value, for ANY aFinal, since it's a ratio of a cubic to a linear
// ramp's areas, not a coincidence tied to one specific number. That
// invariance is itself worth letting the student discover via the slider.
function realDistance(aFinal) { return (aFinal * T_MAX * T_MAX) / 6; }
function assumedDistance(aFinal) { return 0.5 * aFinal * T_MAX * T_MAX; }
function realVelocityAt(aFinal, t) { return (aFinal / (2 * T_MAX)) * t * t; }

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', '#38bdf8'],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', '#34d399'],
};

const STEPS = [
  { caption: 'The drone’s real acceleration ramps up smoothly from 0 to 4 m/s² over 4 seconds.' },
  { caption: 'Its true velocity-time graph curves — flat at first, steepening as thrust builds.' },
  { caption: 'The wrong shortcut assumes a = 4 m/s² the whole time — a straight line, much steeper early on.' },
  { caption: 'Real distance ≈ 10.7 m. The constant-a shortcut predicts 32 m — almost three times too far.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class NonConstantAccelerationScene extends CanvasSimulation {
  static simId = 'non-constant-acceleration';
  static label = { en: 'When acceleration is not constant' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A velocity-time graph comparing a drone’s real, curving motion (acceleration ramping from zero to a final ' +
    'value over four seconds) against a wrong straight-line prediction that assumes the final acceleration value ' +
    'applied for the whole four seconds. A freeplay slider lets the student change the final acceleration and ' +
    'see both the real and wrong predicted distances update — the wrong shortcut is always three times too far, ' +
    'whatever value is chosen.';

  static CONTROLS = [
    { type: 'slider', id: 'aFinal', label: 'Final acceleration (m/s²):', min: 2, max: 8, step: 0.5, value: DEFAULT_A_FINAL, suffix: '' },
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
    this._aFinal = DEFAULT_A_FINAL;
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
    if (id === 'replay') this._stepEnterTime = 0;
    else if (id === 'aFinal') {
      this._aFinal = Number(value);
      this._announce(`Final acceleration set to ${this._aFinal} metres per second squared.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  /** Locked beats (0-2) always show the original a=4 worked example, same
   *  reasoning as KinematicDerivationScene — the captions reference "4
   *  m/s²" by name until freeplay unlocks. */
  _activeAFinal() {
    return this.stepIndex === STEPS.length - 1 ? this._aFinal : DEFAULT_A_FINAL;
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
    const aFinal = this._activeAFinal();
    const vMax = Math.max(16, aFinal * T_MAX * 1.05);
    const pxPerS = (GX1 - GX0) / T_MAX;
    const pxPerV = (GY0 - GY1) / vMax;
    const tx = (t) => GX0 + t * pxPerS;
    const vy = (v) => GY0 - v * pxPerV;

    this._drawAxes(ctx);

    // real curve: v(t) = aFinal/(2*T_MAX) * t^2, always visible from step 0 on
    ctx.save();
    ctx.strokeStyle = c.good;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = (T_MAX * i) / 40;
      const v = realVelocityAt(aFinal, t);
      const x = tx(t), y = vy(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex >= 1) {
      // shade real area
      ctx.save();
      ctx.fillStyle = SimDraw.withAlpha(c.good, 0.2);
      ctx.beginPath();
      ctx.moveTo(GX0, GY0);
      for (let i = 0; i <= 40; i++) {
        const t = (T_MAX * i) / 40;
        ctx.lineTo(tx(t), vy(realVelocityAt(aFinal, t)));
      }
      ctx.lineTo(tx(T_MAX), GY0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (this.stepIndex >= 2) {
      // wrong constant-a line: v(t) = aFinal * t
      ctx.save();
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(tx(0), vy(0));
      ctx.lineTo(tx(T_MAX), vy(aFinal * T_MAX));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.font = '700 13px Inter, system-ui';
      ctx.fillStyle = c.wedge;
      ctx.textAlign = 'left';
      ctx.fillText(`wrong: assumes a = ${fmt(aFinal)} m/s² throughout`, tx(1.6), vy(aFinal * 2.6));
      ctx.fillStyle = c.good;
      ctx.fillText('real curve', tx(2.4), vy(realVelocityAt(aFinal, 2.4)) + 22);
    }

    if (this.stepIndex >= 3) {
      const sReal = realDistance(aFinal);
      const sAssumed = assumedDistance(aFinal);
      const barMax = Math.max(40, sAssumed * 1.15);

      ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BAR_X0, BAR_Y);
      ctx.lineTo(BAR_X1, BAR_Y);
      ctx.stroke();

      const realX = BAR_X0 + (sReal / barMax) * (BAR_X1 - BAR_X0);
      const assumedX = BAR_X0 + (sAssumed / barMax) * (BAR_X1 - BAR_X0);

      this._drawDrone(ctx, realX, BAR_Y, c.good);
      ctx.fillStyle = c.good;
      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`real: ${sReal.toFixed(1)} m`, realX, BAR_Y + 32);

      this._drawDrone(ctx, assumedX, BAR_Y, c.wedge);
      ctx.fillStyle = c.wedge;
      ctx.fillText(`assumed: ${sAssumed.toFixed(1)} m`, assumedX, BAR_Y - 24);

      drawLabelPill(ctx, `always ${(sAssumed / sReal).toFixed(1)}× too far, whatever a you pick`, W / 2, 70, { color: c.muted });
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawDrone(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 6); ctx.lineTo(x - 6, y - 6);
    ctx.moveTo(x + 6, y - 6); ctx.lineTo(x + 16, y - 6);
    ctx.stroke();
    ctx.restore();
  }

  _drawAxes(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX1 + 20, GY0);
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX0, GY1 - 20);
    ctx.stroke();

    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', (GX0 + GX1) / 2, GY0 + 30);
    ctx.save();
    ctx.translate(GX0 - 36, (GY0 + GY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Velocity (m/s)', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 340, 565, 680, 24, 'center');
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

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
