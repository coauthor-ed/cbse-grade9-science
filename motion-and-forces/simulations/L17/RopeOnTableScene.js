import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * RopeOnTableScene — companion to blk-l17-s21 (reused by q-l17-s22).
 *
 * Process Statement: a uniform rope on a frictionless table, part of it
 * hanging over the edge, is one system with two regions — the on-table
 * part (weight cancelled by the normal force, same balance as any block on
 * a table) and the hanging part (nothing to cancel its weight). Only the
 * hanging fraction's weight drives the whole rope: a = (l/L)g. The total
 * mass cancels out completely — a heavier rope slides at exactly the same
 * rate for the same hanging fraction. The final beat is a freeplay slider
 * over the hanging fraction, with a live acceleration readout.
 */

const W = 900;
const H = 600;

const TABLE_Y = 260;
const TABLE_X0 = 140, TABLE_X1 = 620;
const EDGE_X = TABLE_X1;
const ROPE_THICK = 16;
const TOTAL_LEN_PX = 300; // full rope length on screen
const G = 9.8;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  onTable: ['--sim-force-normal', FORCE_COLORS.normal],
  hanging: ['--sim-force-gravity', FORCE_COLORS.gravity],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'Treat the whole rope as one system: total mass M, total length L. A length l hangs over the edge.', frac: 0.3 },
  { caption: 'On the table, weight and normal force cancel — same balance as any block on a table.', frac: 0.3 },
  { caption: 'Over the edge, only gravity acts: that hanging weight, (l/L)Mg, is the only unbalanced force on the system.', frac: 0.3 },
  { caption: 'a = (l/L)g — the total mass M cancels out completely. A heavier rope slides no faster or slower.', frac: 0.3 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class RopeOnTableScene extends CanvasSimulation {
  static simId = 'rope-on-table';
  static label = { en: 'A rope sliding off a frictionless table' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A uniform rope lies on a frictionless table with part of it hanging over the edge. The scene highlights the ' +
    'on-table portion, where weight and normal force cancel, and the hanging portion, where only gravity acts, ' +
    'then shows that only the hanging fraction of the rope’s weight drives the whole rope, with the total mass ' +
    'cancelling out of the final acceleration formula. A freeplay slider on the final beat changes how much of ' +
    'the rope hangs over the edge, with a live acceleration readout.';

  static CONTROLS = [
    { type: 'slider', id: 'frac', label: 'Fraction hanging over the edge:', min: 0.05, max: 0.7, step: 0.05, value: 0.3, suffix: '' },
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
    this._frac = 0.3;
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
    this._frac = STEPS[this.stepIndex].frac;
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'frac') {
      this._frac = Number(value);
      const a = this._frac * G;
      this._announce(`Hanging fraction set to ${(this._frac * 100).toFixed(0)} percent. Acceleration: ${a.toFixed(2)} metres per second squared.`);
      this.requestUiUpdate?.();
    }
  }

  isControlHidden() {
    return this.stepIndex < 3;
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
    const hangLenPx = TOTAL_LEN_PX * this._frac;
    const onTableLenPx = TOTAL_LEN_PX - hangLenPx;
    const ropeStartX = EDGE_X - onTableLenPx;

    drawGround(ctx, TABLE_X0, TABLE_X1, TABLE_Y, c, { kind: 'ice' });
    // table support (the vertical edge face)
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TABLE_X1, TABLE_Y);
    ctx.lineTo(TABLE_X1, TABLE_Y + 30);
    ctx.stroke();
    ctx.restore();

    // on-table portion
    const onTableAlpha = this.stepIndex === 2 ? 0.35 : 1;
    ctx.save();
    ctx.globalAlpha = onTableAlpha;
    ctx.fillStyle = SimDraw.withAlpha(c.onTable, 0.35);
    ctx.strokeStyle = c.onTable;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(ropeStartX, TABLE_Y - ROPE_THICK, onTableLenPx, ROPE_THICK, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // hanging portion
    const hangingAlpha = this.stepIndex === 1 ? 0.35 : 1;
    ctx.save();
    ctx.globalAlpha = hangingAlpha;
    ctx.fillStyle = SimDraw.withAlpha(c.hanging, 0.35);
    ctx.strokeStyle = c.hanging;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(EDGE_X - ROPE_THICK, TABLE_Y, ROPE_THICK, hangLenPx, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (this.stepIndex === 1) {
      drawForceArrow(ctx, ropeStartX + onTableLenPx / 2, TABLE_Y - ROPE_THICK, { angle: Math.PI / 2, length: 46, color: c.hanging, label: 'weight' });
      drawForceArrow(ctx, ropeStartX + onTableLenPx / 2, TABLE_Y, { angle: -Math.PI / 2, length: 46, color: c.onTable, label: 'normal' });
      drawLabelPill(ctx, 'cancels — no effect on motion', ropeStartX + onTableLenPx / 2, 140, { color: c.good, font: '700 13px Inter, system-ui', height: 24 });
    } else if (this.stepIndex === 2) {
      drawForceArrow(ctx, EDGE_X - ROPE_THICK / 2, TABLE_Y + hangLenPx, { angle: Math.PI / 2, length: 50, color: c.hanging, label: '(l/L)Mg' });
      drawLabelPill(ctx, 'unbalanced — this drives the whole rope', EDGE_X + 90, TABLE_Y + hangLenPx / 2, { color: c.hanging, font: '700 13px Inter, system-ui', height: 24 });
    }

    if (this.stepIndex >= 2) {
      SimDraw.drawPanel(ctx, W / 2 - 210, 478, 420, 40, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 14px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText(`a = (l/L) × g = ${(this._frac * G).toFixed(2)} m/s²  (l/L = ${(this._frac * 100).toFixed(0)}%)`, W / 2, 503);
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
