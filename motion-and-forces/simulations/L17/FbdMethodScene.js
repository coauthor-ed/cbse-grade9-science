import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * FbdMethodScene — companion to blk-l17-s4.
 *
 * Process Statement: walks the four-step free-body-diagram method
 * (isolate, list, draw, apply the second law) against one worked example —
 * a block on a table, pulled sideways by a string, resisted by friction —
 * building the checklist and the arrows one piece at a time, then closing
 * on the two equations (vertical balance, horizontal net force).
 */

const W = 900;
const H = 600;

const BOX_X = 470, BOX_Y = 280, BOX_W = 90, BOX_H = 70;
const TABLE_Y = BOX_Y + BOX_H;

const FORCE_LIST = ['Weight', 'Normal force', 'Tension', 'Friction'];

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
  { caption: 'Step 1: isolate the block. Forget the table, the hand, the floor.' },
  { caption: 'Step 2: list every force actually touching it — weight, normal, tension, friction.' },
  { caption: 'Step 3: draw each one as a labeled arrow, starting at the block.' },
  { caption: 'Step 4: apply the second law along each direction — vertical balance, horizontal net force.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class FbdMethodScene extends CanvasSimulation {
  static simId = 'fbd-method';
  static label = { en: 'The four-step free-body-diagram method' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A worked example of the free-body-diagram method on a block pulled sideways across a table, resisted by ' +
    'friction. The scene isolates the block, builds a checklist of weight, normal force, tension and friction, ' +
    'draws each as a labeled arrow, then shows the resulting vertical-balance and horizontal-net-force equations.';

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

    if (this.stepIndex === 0) {
      drawGround(ctx, 260, 700, TABLE_Y + 40, c, { kind: 'table' });
      ctx.save();
      ctx.strokeStyle = c.muted;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(660, BOX_Y + 25);
      ctx.lineTo(BOX_X + BOX_W, BOX_Y + 25);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.block, 0.25);
    ctx.strokeStyle = c.block;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex >= 1) {
      this._drawChecklist(ctx);
    }

    if (this.stepIndex >= 2) {
      const cx = BOX_X + BOX_W / 2, cy = BOX_Y + BOX_H / 2;
      const alpha = clamp01(this._stepEnterTime / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawForceArrow(ctx, cx, BOX_Y + BOX_H, { angle: Math.PI / 2, length: 72, color: c.weight, label: 'weight' });
      drawForceArrow(ctx, cx, BOX_Y, { angle: -Math.PI / 2, length: 72, color: c.normal, label: 'normal' });
      drawForceArrow(ctx, BOX_X + BOX_W, cy, { angle: 0, length: 80, color: c.tension, label: 'tension' });
      drawForceArrow(ctx, BOX_X, cy, { angle: Math.PI, length: 54, color: c.friction, label: 'friction' });
      ctx.restore();
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 220, 420, 440, 68, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('vertical: normal = weight', W / 2, 448);
      ctx.fillText('horizontal: tension − friction = mass × acceleration', W / 2, 472);
      ctx.restore();
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawChecklist(ctx) {
    const c = this.colors;
    const x0 = 80, y0 = 100;
    ctx.save();
    ctx.font = '700 15px Inter, system-ui';
    ctx.textAlign = 'left';
    FORCE_LIST.forEach((name, i) => {
      ctx.fillStyle = c.good;
      ctx.fillText(`✓ ${name}`, x0, y0 + i * 28);
    });
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
