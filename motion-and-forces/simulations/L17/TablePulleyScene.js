import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawPulley, drawMassBlock, drawForceArrow, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * TablePulleyScene — companion to blk-l17-s10 (reused by q-l17-s11,
 * q-l17-s12, q-l17-s13).
 *
 * Process Statement: a block on a frictionless table, tied over a pulley to
 * a hanging block, needs two different free-body diagrams — the table
 * block's weight and normal force cancel vertically, leaving tension as its
 * only horizontal force, while the hanging block's weight drives the whole
 * system. Reuses the same "add the two equations" technique as the previous
 * scene, with a genuinely different pair of diagrams.
 */

const W = 900;
const H = 600;

const TABLE_Y = 315;
const BOX1_X0 = 260, BOX1_Y = TABLE_Y - 70, BOX1_W = 90, BOX1_H = 70;
const PULLEY_X = 560, PULLEY_Y = TABLE_Y - 35, PULLEY_R = 24;
const BOX2_X = PULLEY_X, BOX2_Y0 = PULLEY_Y + PULLEY_R + 56, BOX2_W = 70, BOX2_H = 70;
const M1 = 4, M2 = 2;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  mass1:   ['--sim-motion-shape', FORCE_COLORS.applied],
  mass2:   ['--sim-motion-wedge', FORCE_COLORS.reaction],
  weight:  ['--sim-force-gravity', FORCE_COLORS.gravity],
  normal:  ['--sim-force-normal', FORCE_COLORS.normal],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'A 4 kg block on a frictionless table, tied by a string over a pulley to a 2 kg hanging block.' },
  { caption: 'Table block: weight and normal force cancel vertically. Tension is the only force left — T = m₁a.' },
  { caption: 'Hanging block: weight down, tension up. It is the one falling, so m₂g − T = m₂a.' },
  { caption: 'Add the two equations — T cancels: a = m₂g ÷ (m₁ + m₂).' },
  { caption: "Only the hanging block's weight drives the motion. The table block adds mass, but no pulling weight." },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

export class TablePulleyScene extends CanvasSimulation {
  static simId = 'table-pulley';
  static label = { en: 'A table block and a hanging block over a pulley' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A 4 kilogram block sits on a frictionless table, tied by a string over a pulley fixed at the table edge to a ' +
    '2 kilogram block hanging below. Two free-body diagrams appear in turn: the table block shows weight and ' +
    'normal force cancelling vertically with tension as its only horizontal force, and the hanging block shows ' +
    'weight and tension driving its fall. The two equations combine to give the shared acceleration.';

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
    this._elapsed = 0;
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
    this._elapsed = 0;
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._elapsed += dt;
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
    const tCap = Math.min(this._elapsed, 1.6);
    const drop = this.stepIndex >= 2 ? clamp01((tCap * tCap) / 2.5) * 44 : 0;

    drawGround(ctx, 100, PULLEY_X + 20, TABLE_Y, c, { kind: 'ice' });

    const box1CX = BOX1_X0 + drop;
    const box1 = drawMassBlockOutline(ctx, box1CX, BOX1_Y, BOX1_W, BOX1_H, c.mass1, `${M1} kg`);

    const box2CY = BOX2_Y0 + drop;
    const box2 = drawMassBlock(ctx, BOX2_X, box2CY, { width: BOX2_W, height: BOX2_H, color: c.mass2, label: `${M2} kg` });

    // string: horizontal from box1 to pulley, arc, vertical down to box2
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(box1.right, PULLEY_Y);
    ctx.lineTo(PULLEY_X - PULLEY_R - 6, PULLEY_Y);
    ctx.arc(PULLEY_X, PULLEY_Y, PULLEY_R + 6, Math.PI, Math.PI / 2, true);
    ctx.lineTo(PULLEY_X, box2.top);
    ctx.stroke();
    ctx.restore();

    drawPulley(ctx, PULLEY_X, PULLEY_Y, PULLEY_R, c);

    if (this.stepIndex >= 1) {
      const alpha = clamp01(this._stepEnterTime / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (this.stepIndex !== 2) {
        drawForceArrow(ctx, box1CX, box1.bottom, { angle: Math.PI / 2, length: 58, color: c.weight, label: 'm₁g' });
        drawForceArrow(ctx, box1CX, box1.top, { angle: -Math.PI / 2, length: 58, color: c.normal, label: 'N' });
        drawForceArrow(ctx, box1.right, PULLEY_Y, { angle: 0, length: 58, color: c.tension, label: 'T' });
      }
      if (this.stepIndex !== 1) {
        drawForceArrow(ctx, BOX2_X, box2.bottom, { angle: Math.PI / 2, length: 58, color: c.weight, label: 'm₂g' });
        drawForceArrow(ctx, BOX2_X, box2.top, { angle: -Math.PI / 2, length: 58, color: c.tension, label: 'T' });
      }
      ctx.restore();
    }

    if (this.stepIndex >= 3) {
      const a = (M2 * 9.8) / (M1 + M2);
      SimDraw.drawPanel(ctx, W / 2 - 200, 460, 400, 44, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText(`a = m₂g ÷ (m₁ + m₂) = ${a.toFixed(2)} m/s²`, W / 2, 488);
      ctx.restore();
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
    wrapText(ctx, caption, W / 2 - 330, 550, 660, 24, 'center');
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

/** Box drawn centered horizontally on the table surface, top-anchored like
 *  `drawMassBlock`, but with its vertical position fixed (the table block
 *  slides sideways, never up/down) — a small local variant since
 *  `drawMassBlock` always anchors at its own top-center for a *hanging*
 *  mass, not a resting one. */
function drawMassBlockOutline(ctx, cx, top, w, h, color, label) {
  ctx.save();
  ctx.fillStyle = SimDraw.withAlpha(color, 0.22);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, top, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 14px Inter, system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, top + h / 2 + 5);
  ctx.restore();
  return { top, bottom: top + h, left: cx - w / 2, right: cx + w / 2 };
}
