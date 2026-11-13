import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * CollisionForcesSetupScene — companion to blk-l15-s13.
 * Ball A (3 kg, 8 m/s) catches up to slower ball B (2 kg, 2 m/s) from
 * behind. After the collision A has slowed to 4 m/s and B has sped up to
 * 8 m/s — numbers chosen so momentum is genuinely conserved (3×8+2×2 =
 * 3×4+2×8 = 28), so blk-l15-s14's derivation checks out against a real
 * collision rather than an abstract one. This scene builds the two
 * second-law forces; blk-l15-s14 combines them with the third law.
 */

const W = 900;
const H = 600;
const TRACK_Y = 340;
const M1 = 3, U1 = 8, V1 = 4;
const M2 = 2, U2 = 2, V2 = 8;
const T_COLLIDE = 0.5;
const F_ON_A = M1 * (V1 - U1) / T_COLLIDE; // -24 N
const F_ON_B = M2 * (V2 - U2) / T_COLLIDE; // +24 N

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
  { caption: 'Ball A (3 kg, 8 m/s) catches up to ball B (2 kg, 2 m/s) from behind and collides for a short time t.', phase: 'before' },
  { caption: "During the collision, B pushes back on A. By the second law, that's A's mass times its own rate of velocity change.", phase: 'collide', showForceA: true },
  { caption: 'At the same instant, A pushes B forward — exactly as hard, in the opposite sense.', phase: 'collide', showForceA: true, showForceB: true },
  { caption: "These two forces — B on A, A on B — are exactly a Newton's-third-law pair.", phase: 'after', showForceA: true, showForceB: true },
];

const BEAT_STEP_MAP = STEPS.map((_, i) => [{ idx: i, dwellMs: null }]);

export class CollisionForcesSetupScene extends CanvasSimulation {
  static simId = 'collision-forces-setup';
  static label = { en: 'Two Balls, One Collision' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Ball A, three kilograms at eight metres per second, catches up to ball B, two kilograms at two metres ' +
    'per second, and collides. During the collision, B pushes back on A with twenty four newtons, and A ' +
    'pushes forward on B with twenty four newtons in the opposite direction — a Newton\'s third law pair.';

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

  _drawBall(ctx, x, color, r = 18) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, TRACK_Y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SimDraw.withAlpha(SimDraw.shade(color, -0.3), 0.9);
    ctx.beginPath();
    ctx.arc(x, TRACK_Y + 4, r, Math.PI * 0.15, Math.PI * 0.85);
    ctx.fill();
    ctx.restore();
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const collideX = 500;
    const axU = step.phase === 'before' ? 320 : collideX - 30;
    const bxU = step.phase === 'before' ? 560 : collideX + 30;

    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, TRACK_Y);
    ctx.lineTo(820, TRACK_Y);
    ctx.stroke();
    ctx.restore();

    this._drawBall(ctx, axU, c.ballA);
    this._drawBall(ctx, bxU, c.ballB, 15);

    const labelA = step.phase === 'before' ? `A: m₁=${M1} kg, u₁=${U1} m/s` : `A: v₁=${V1} m/s`;
    const labelB = step.phase === 'before' ? `B: m₂=${M2} kg, u₂=${U2} m/s` : `B: v₂=${V2} m/s`;
    drawLabelPill(ctx, labelA, axU, TRACK_Y - 70, { color: c.ballA });
    drawLabelPill(ctx, labelB, bxU, TRACK_Y - 46, { color: c.ballB });

    if (step.showForceA) {
      drawForceArrow(ctx, axU - 10, TRACK_Y + 50, { angle: Math.PI, magnitude: Math.abs(F_ON_A), pxPerUnit: 2, color: c.ballB, label: `F on A = ${Math.abs(F_ON_A)} N` });
    }
    if (step.showForceB) {
      drawForceArrow(ctx, bxU + 10, TRACK_Y + 50, { angle: 0, magnitude: Math.abs(F_ON_B), pxPerUnit: 2, color: c.ballA, label: `F on B = ${Math.abs(F_ON_B)} N` });
    }

    if (this.stepIndex === STEPS.length - 1) {
      drawLabelPill(ctx, 'a Newton\'s-third-law pair: equal size, opposite direction', W / 2, 500, { color: c.good, font: '700 16px Inter, system-ui', height: 34 });
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
