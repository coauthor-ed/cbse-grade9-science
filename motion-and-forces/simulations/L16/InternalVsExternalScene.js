import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * InternalVsExternalScene — companion to blk-l15-s4.
 * For a system of two connected boxes: the weight and the normal force are
 * external and balance vertically; the string tension is internal and
 * cancels. Only the external force F determines the horizontal acceleration.
 */

const W = 900;
const H = 600;

const BOX2_X = 300, BOX1_X = 540;
const BOX_Y = 250, BOX_W = 150, BOX_H = 90;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', '#38bdf8'],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', '#34d399'],
  bad:      ['--sim-motion-bad', '#f87171'],
};

const STEPS = [
  { caption: 'The system also feels external forces besides F: its combined weight pulls down, and the ground’s normal force pushes up.' },
  { caption: 'The string tension is internal — equal and opposite pulls inside the system — so it cancels out.' },
  { caption: 'Only external forces change the system’s motion. Vertically they balance, horizontally only F acts: a = F ÷ (m₁ + m₂).' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class InternalVsExternalScene extends CanvasSimulation {
  static simId = 'internal-vs-external';
  static label = { en: 'Internal forces cancel, external forces matter' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'For a system of two connected boxes, the combined weight pushes down and the normal force from the ground ' +
    'pushes up; they balance. The tension in the connecting string is internal and cancels. Only the external ' +
    "force F changes the system's motion, giving acceleration F divided by the total mass.";

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

    this._drawBox(ctx, BOX1_X, 'm₁', c.shape);
    this._drawBox(ctx, BOX2_X, 'm₂', c.wedge);
    // string
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(BOX2_X + BOX_W, BOX_Y + 30);
    ctx.lineTo(BOX1_X, BOX_Y + 30);
    ctx.stroke();

    if (this.stepIndex === 0) {
      // weight down, normal up (external, balanced)
      this._vArrow(ctx, BOX1_X + BOX_W / 2, BOX_Y + BOX_H, 55, c.bad, '(m₁+m₂)g');
      this._vArrow(ctx, BOX2_X + BOX_W / 2, BOX_Y, -55, c.good, 'N');
      this._vArrow(ctx, BOX2_X + BOX_W / 2, BOX_Y + BOX_H, 55, c.bad, '');
      this._vArrow(ctx, BOX1_X + BOX_W / 2, BOX_Y, -55, c.good, '');
      ctx.fillStyle = c.label;
      ctx.font = '700 14px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('weight + normal force: balanced', W / 2, 120);
    } else if (this.stepIndex === 1) {
      this._hArrow(ctx, BOX1_X, BOX_Y + 50, -100, c.bad, 'T');
      this._hArrow(ctx, BOX2_X + BOX_W, BOX_Y + 50, 100, c.bad, 'T');
      ctx.fillStyle = c.bad;
      ctx.font = '700 14px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('internal tension — cancels', W / 2, 120);
    } else {
      this._hArrow(ctx, BOX1_X + BOX_W, BOX_Y - 30, 150, c.good, 'F');
      SimDraw.drawPanel(ctx, W / 2 - 260, 430, 520, 72, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('only external F changes the motion', W / 2, 464);
      ctx.fillStyle = c.label;
      ctx.fillText('a = F ÷ (m₁ + m₂)', W / 2, 492);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawBox(ctx, x, label, color) {
    const c = this.colors;
    ctx.fillStyle = SimDraw.withAlpha(color, 0.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, BOX_Y, BOX_W, BOX_H, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 18px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + BOX_W / 2, BOX_Y + BOX_H / 2 + 6);
  }

  _hArrow(ctx, fromX, y, len, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fromX, y);
    ctx.lineTo(fromX + len, y);
    ctx.stroke();
    const dir = len >= 0 ? 1 : -1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromX + len, y);
    ctx.lineTo(fromX + len - dir * 14, y - 7);
    ctx.lineTo(fromX + len - dir * 14, y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(label, fromX + len / 2, y - 14);
    ctx.restore();
  }

  _vArrow(ctx, fromX, fromY, len, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX, fromY + len);
    ctx.stroke();
    const dir = len >= 0 ? 1 : -1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY + len);
    ctx.lineTo(fromX - 7, fromY + len - dir * 14);
    ctx.lineTo(fromX + 7, fromY + len - dir * 14);
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(label, fromX, fromY + len / 2);
    }
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 520, 660, 24, 'center');
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
    const prev = ctx.textAlign;
    ctx.textAlign = align;
    const words = text.split(' ');
    let line = '';
    let cy = y;
    const drawX = align === 'center' ? x + maxWidth / 2 : x;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, drawX, cy);
        line = word;
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, drawX, cy);
    ctx.textAlign = prev;
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
