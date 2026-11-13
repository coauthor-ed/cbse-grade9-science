import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * MomentumConservationScene — companion to blk-l15-s14.
 * Same collision as blk-l15-s13 (A: 3 kg, 8→4 m/s; B: 2 kg, 2→8 m/s), now
 * with a formula pill that morphs through combining the two second-law
 * forces with the third law, ending in m₁u₁+m₂u₂ = m₁v₁+m₂v₂ — checked
 * live against these exact numbers (28 = 28) rather than left abstract.
 */

const W = 900;
const H = 600;
const TRACK_Y = 300;
const M1 = 3, U1 = 8, V1 = 4;
const M2 = 2, U2 = 2, V2 = 8;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  ballA:   ['--sim-motion-shape', FORCE_COLORS.applied],
  ballB:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: "Newton's third law: the two forces are equal in size, opposite in direction.", eq: 'F on A = −(F on B)' },
  { caption: 'Write each force as a rate of change of momentum.', eq: 'm₁(v₁−u₁)/t = −m₂(v₂−u₂)/t' },
  { caption: 'Both sides share the same collision time t — multiply through and it cancels.', eq: 'm₁(v₁−u₁) = −m₂(v₂−u₂)' },
  { caption: 'Expand both sides.', eq: 'm₁v₁ − m₁u₁ = −m₂v₂ + m₂u₂' },
  { caption: 'Gather the "before" terms on one side, the "after" terms on the other.', eq: 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂' },
  { caption: 'Total momentum before the collision equals total momentum after — conservation of momentum.', eq: 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂', showCheck: true },
];

const BEAT_STEP_MAP = STEPS.map((_, i) => [{ idx: i, dwellMs: null }]);

export class MomentumConservationScene extends CanvasSimulation {
  static simId = 'momentum-conservation';
  static label = { en: 'Conservation of Momentum' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'The same two-ball collision as the previous scene. A formula underneath morphs step by step from the ' +
    'third law force pair through to total momentum before equals total momentum after, checked live ' +
    'against the actual numbers: twenty eight equals twenty eight.';

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

  _drawBall(ctx, x, y, color, r = 18) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SimDraw.withAlpha(SimDraw.shade(color, -0.3), 0.9);
    ctx.beginPath();
    ctx.arc(x, y + 4, r, Math.PI * 0.15, Math.PI * 0.85);
    ctx.fill();
    ctx.restore();
  }

  _drawScene(ctx, step) {
    const c = this.colors;

    ctx.font = '700 15px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText('before', 260, TRACK_Y - 60);
    ctx.fillText('after', 640, TRACK_Y - 60);

    this._drawBall(ctx, 220, TRACK_Y, c.ballA);
    this._drawBall(ctx, 320, TRACK_Y, c.ballB, 15);
    drawLabelPill(ctx, `m₁=${M1}, u₁=${U1}`, 220, TRACK_Y + 34, { color: c.ballA });
    drawLabelPill(ctx, `m₂=${M2}, u₂=${U2}`, 320, TRACK_Y + 34, { color: c.ballB });

    this._drawBall(ctx, 600, TRACK_Y, c.ballA);
    this._drawBall(ctx, 700, TRACK_Y, c.ballB, 15);
    drawLabelPill(ctx, `v₁=${V1}`, 600, TRACK_Y + 34, { color: c.ballA });
    drawLabelPill(ctx, `v₂=${V2}`, 700, TRACK_Y + 34, { color: c.ballB });

    drawLabelPill(ctx, step.eq, W / 2, 440, {
      color: step.showCheck ? c.good : c.muted,
      font: '700 18px Inter, system-ui', height: 40,
    });

    if (step.showCheck) {
      const before = M1 * U1 + M2 * U2;
      const after = M1 * V1 + M2 * V2;
      drawLabelPill(ctx, `${M1}×${U1} + ${M2}×${U2} = ${before}     and     ${M1}×${V1} + ${M2}×${V2} = ${after} ✓`,
        W / 2, 500, { color: c.good, font: '700 15px Inter, system-ui', height: 34 });
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
    wrapText(ctx, caption, W / 2 - 330, 555, 660, 24, 'center');
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
