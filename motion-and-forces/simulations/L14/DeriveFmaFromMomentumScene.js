import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawCart, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * DeriveFmaFromMomentumScene — companion to blk-l14-s14.
 * One cart, pushed by one steady force, sped from u to v over time t — the
 * same picture throughout, with a formula pill that morphs beat by beat
 * from Newton's own "rate of change of momentum" statement down to
 * F = ma, so the algebra reads as one continuous argument rather than six
 * disconnected lines.
 */

const W = 900;
const H = 600;
const TRACK_Y = 420;
const M = 4, U = 2, V = 6, T = 2; // kg, m/s, m/s, s -> a = 2 m/s^2, F = 8 N

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', FORCE_COLORS.applied],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: "Newton's second law, in its original form: the rate of change of momentum is proportional to the net force.", eq: null },
  { caption: '"Rate of change" means per second: Δp ÷ t = m(v − u) ÷ t.', eq: 'Δp/t = m(v-u)/t' },
  { caption: '(v − u) ÷ t is exactly acceleration, a. So the rate of change of momentum is m × a.', eq: 'Δp/t = ma' },
  { caption: 'Net force is proportional to that rate of change: F ∝ ma, or F = kma.', eq: 'F = kma' },
  { caption: 'The newton is defined so that a 1 kg object accelerating at 1 m/s² feels exactly 1 N — making k = 1.', eq: 'k = 1' },
  { caption: 'F = ma — the same equation the cart-and-coins experiment found by trial, now derived algebraically.', eq: 'F = ma' },
];

const BEAT_STEP_MAP = STEPS.map((_, i) => [{ idx: i, dwellMs: null }]);

export class DeriveFmaFromMomentumScene extends CanvasSimulation {
  static simId = 'derive-fma-momentum';
  static label = { en: 'Deriving F = ma From Momentum' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A cart pushed by a steady force speeds up from u to v over time t. A formula underneath morphs step ' +
    'by step from the rate of change of momentum through to F equals m a, showing the second law derived ' +
    'algebraically rather than only found by experiment.';

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;
    this.colors = null;
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

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

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

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawScene(ctx, step) {
    const c = this.colors;
    const a = (V - U) / T;
    const F = M * a;

    // faint "before" cart, solid "after" cart, ghosting the speed-up
    drawCart(ctx, 320, TRACK_Y, { color: SimDraw.withAlpha(c.muted, 0.5), width: 110 });
    drawCart(ctx, 560, TRACK_Y, { color: c.shape, width: 110 });
    drawForceArrow(ctx, 630, TRACK_Y - 60, { angle: 0, magnitude: F, pxPerUnit: 8, color: c.wedge, label: `F = ${F} N` });

    drawLabelPill(ctx, `m = ${M} kg`, 560, TRACK_Y + 40, { color: c.shape });
    drawLabelPill(ctx, `u = ${U} m/s`, 320, TRACK_Y - 60, { color: c.muted });
    drawLabelPill(ctx, `v = ${V} m/s, after t = ${T} s`, 560, TRACK_Y - 100, { color: c.shape });

    if (step.eq) {
      drawLabelPill(ctx, step.eq, W / 2, 485, {
        color: this.stepIndex === STEPS.length - 1 ? c.good : c.wedge,
        font: '700 20px Inter, system-ui', height: 40,
      });
    }

    if (this.stepIndex === STEPS.length - 1) {
      drawLabelPill(ctx, `F = ma = ${M} × ${a} = ${F} N`, W / 2, 525, { color: c.good, font: '700 15px Inter, system-ui', height: 30 });
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
    wrapText(ctx, caption, W / 2 - 340, 565, 680, 22, 'center');
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

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }
  _announceStep() { this._announce(STEPS[this.stepIndex].caption); }
}
