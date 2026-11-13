import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawVehicle, drawForceArrow, drawGround, drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';

/**
 * SignOfAccelerationScene — companion to blk-l07-s9.
 * A car on a horizontal track with a chosen positive direction (rightward).
 * Beats walk through: pick a direction -> speeding up (v & a same sign) ->
 * braking (v & a opposite signs) -> the general rule. Freeplay (after beat 3)
 * lets the student flip between three labelled cases with buttons, including
 * a car reversing while speeding up (v negative, a negative — same sign,
 * still "speeding up"), the case most likely to break a naive "negative a
 * means going backwards" rule.
 */

const W = 900;
const H = 600;

const TRACK_Y = 300;
const CENTER_X = 450;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', '#38bdf8'],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', '#34d399'],
  bad:     ['--sim-motion-bad', '#f87171'],
  velocity: ['--sim-accent', '#818cf8'], // indigo — velocity is a motion quantity, not a force; kept visually distinct from FORCE_COLORS
};

// case: { carDir: +1|-1 (which way the car is currently moving),
//          aDir: +1|-1 (which way acceleration points), label, verdict }
const CASES = [
  { carDir: 0,  aDir: 0,  label: 'Pick a positive direction (→) first.', verdict: 'Everything below is measured against this arrow.' },
  { carDir: 1,  aDir: 1,  label: 'Speeding up, moving right (+)', verdict: 'v is +, a is + — SAME sign → speeding up.' },
  { carDir: 1,  aDir: -1, label: 'Braking, moving right (+)', verdict: 'v is +, a is − — OPPOSITE sign → slowing down.' },
  { carDir: 1,  aDir: -1, label: 'The rule', verdict: 'Same sign as v → speeding up. Opposite sign → slowing down.' },
];

const FREEPLAY_CASES = [
  { carDir: 1,  aDir: 1,  label: 'Speeding up, moving right (+)', verdict: 'v is +, a is + — same sign → speeding up.' },
  { carDir: 1,  aDir: -1, label: 'Braking, moving right (+)', verdict: 'v is +, a is − — opposite sign → slowing down.' },
  { carDir: -1, aDir: -1, label: 'Reversing AND speeding up (v is −)', verdict: 'v is −, a is − — same sign again → still speeding up, just backwards.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SignOfAccelerationScene extends CanvasSimulation {
  static simId = 'sign-of-acceleration';
  static label = { en: 'Sign of velocity vs. sign of acceleration' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A car on a horizontal track with a chosen positive direction pointing right. Velocity and acceleration ' +
    'arrows are shown for different cases: speeding up with matching signs, braking with opposite signs, and ' +
    'reversing while speeding up, again with matching signs.';

  static CONTROLS = [
    { type: 'button', id: 'case-speed-up', label: 'Speeding Up' },
    { type: 'button', id: 'case-brake', label: 'Braking' },
    { type: 'button', id: 'case-reverse', label: 'Reverse & Speed Up' },
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
    this._freeplayCaseIdx = 0;
    this._wheelAngle = 0;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._canvas.tabIndex = 0;
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce(CASES[0].label);
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
    this.stepIndex = Math.max(0, Math.min(CASES.length - 1, i));
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'case-speed-up') this._freeplayCaseIdx = 0;
    else if (id === 'case-brake') this._freeplayCaseIdx = 1;
    else if (id === 'case-reverse') this._freeplayCaseIdx = 2;
    else return;
    this._stepEnterTime = 0;
    this._announce(FREEPLAY_CASES[this._freeplayCaseIdx].label);
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    const active = this.stepIndex === 3 ? FREEPLAY_CASES[this._freeplayCaseIdx] : CASES[this.stepIndex];
    if (active.carDir !== 0) this._wheelAngle += active.carDir * 3 * dt;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, active);
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

  _drawScene(ctx, active) {
    const c = this.colors;

    drawGround(ctx, 60, W - 60, TRACK_Y, c, { kind: 'solid' });

    // positive-direction reference arrow, above the track
    drawForceArrow(ctx, 620, TRACK_Y + 150, { angle: 0, length: 80, color: c.muted, label: null });
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.muted;
    ctx.fillText('chosen positive direction', 660, TRACK_Y + 138);

    const facing = active.carDir >= 0 ? 1 : -1;
    drawVehicle(ctx, CENTER_X, TRACK_Y, {
      type: 'car',
      scale: 0.85,
      color: c.velocity,
      facing,
      wheelAngle: this._wheelAngle,
      speedLines: active.carDir !== 0,
    });

    if (active.carDir !== 0) {
      const vAngle = active.carDir > 0 ? 0 : Math.PI;
      drawForceArrow(ctx, CENTER_X, TRACK_Y - 95, {
        angle: vAngle,
        magnitude: 10,
        pxPerUnit: 7,
        color: c.velocity,
        label: `v (${active.carDir > 0 ? '+' : '−'})`,
      });

      const aColor = active.aDir === active.carDir ? c.good : c.bad;
      const aAngle = active.aDir > 0 ? 0 : Math.PI;
      drawForceArrow(ctx, CENTER_X, TRACK_Y + 70, {
        angle: aAngle,
        magnitude: 10,
        pxPerUnit: 7,
        color: aColor,
        label: `a (${active.aDir > 0 ? '+' : '−'})`,
      });
    }

    // labels/verdict panel
    SimDraw.drawPanel(ctx, W / 2 - 300, 90, 600, 90, { bg: c.panelBg, radius: 12, stroke: c.wedge, lineWidth: 1.5 });
    ctx.textAlign = 'center';
    ctx.font = '700 18px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.fillText(active.label, W / 2, 122);
    ctx.font = '600 15px Inter, system-ui';
    ctx.fillStyle = active.carDir !== 0 && active.aDir === active.carDir ? c.good : (active.carDir !== 0 ? c.bad : c.muted);
    wrapText(ctx, active.verdict, W / 2 - 270, 155, 540, 20, 'center');
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
    this._announce(CASES[this.stepIndex].label);
  }
}
