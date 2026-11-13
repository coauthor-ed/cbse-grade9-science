import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * FbdOverviewScene — companion to blk-l17-s1.
 *
 * Process Statement: a real object can have several forces on it at once —
 * this scene shows a block on a table, pulled by a string, resisting via
 * friction, and dramatizes the transition from "a busy real scene" to "the
 * block, isolated, with just its force arrows" — the whole point of a
 * free-body diagram.
 */

const W = 900;
const H = 600;

const BOX_X = 470, BOX_Y = 300, BOX_W = 90, BOX_H = 70;
const TABLE_Y = BOX_Y + BOX_H;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  block:   ['--sim-motion-shape', FORCE_COLORS.applied],
  weight:  ['--sim-force-gravity', FORCE_COLORS.gravity],
  normal:  ['--sim-force-normal', FORCE_COLORS.normal],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  friction:['--sim-force-friction', FORCE_COLORS.friction],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'A block on a table, pulled by a string, resisted by friction, pulled down by gravity, held up by the table. Four forces, all at once.' },
  { caption: 'Isolate the block. Forget the table, the hand, the floor — draw only the block, and only the forces touching it.' },
  { caption: 'A free-body diagram: the object, and every force acting on it, each one a labeled arrow. That is the whole trick.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class FbdOverviewScene extends CanvasSimulation {
  static simId = 'fbd-overview';
  static label = { en: 'Isolating a free-body diagram' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A block sits on a table, pulled sideways by a string held by a hand, resisted by friction, with gravity ' +
    'pulling it down and the table pushing it up. The scene then fades away everything except the block itself, ' +
    'leaving just the block and four labeled force arrows: weight, normal force, tension, and friction — a free-body diagram.';

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
    const sceneAlpha = this.stepIndex === 0 ? 1 : clamp01(1 - this._stepEnterTime / 0.6);
    const isolatedAlpha = this.stepIndex === 0 ? 0 : clamp01(this._stepEnterTime / 0.6);

    // ── Busy real scene (table, hand, floor) — fades out after beat 0 ──
    if (sceneAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = sceneAlpha;
      drawGround(ctx, 120, 780, TABLE_Y + 40, c, { kind: 'table' });
      // hand + string pulling right
      ctx.strokeStyle = c.muted;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(700, BOX_Y + 25);
      ctx.lineTo(BOX_X + BOX_W, BOX_Y + 25);
      ctx.stroke();
      ctx.fillStyle = c.muted;
      ctx.beginPath();
      ctx.arc(715, BOX_Y + 25, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '600 12px Inter, system-ui';
      ctx.fillStyle = c.label;
      ctx.textAlign = 'center';
      ctx.fillText('a hand pulls', 715, BOX_Y - 5);
      ctx.restore();
    }

    // ── The block itself (present throughout) ──
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.block, 0.25);
    ctx.strokeStyle = c.block;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ── Isolated free-body arrows — fade in from beat 1 onward ──
    if (isolatedAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = isolatedAlpha;
      const cx = BOX_X + BOX_W / 2, cy = BOX_Y + BOX_H / 2;
      drawForceArrow(ctx, cx, BOX_Y + BOX_H, { angle: Math.PI / 2, length: 78, color: c.weight, label: 'weight' });
      drawForceArrow(ctx, cx, BOX_Y, { angle: -Math.PI / 2, length: 78, color: c.normal, label: 'normal' });
      drawForceArrow(ctx, BOX_X + BOX_W, cy, { angle: 0, length: 88, color: c.tension, label: 'tension' });
      drawForceArrow(ctx, BOX_X, cy, { angle: Math.PI, length: 58, color: c.friction, label: 'friction' });
      ctx.restore();
    }

    if (this.stepIndex === 2) {
      drawLabelPill(ctx, 'free-body diagram: the object + its force arrows, nothing else', W / 2, 460, { color: c.good, font: '700 14px Inter, system-ui', height: 28 });
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
