import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';

/**
 * SystemOfBoxesScene — companion to blk-l15-s3 (Fig 6.34).
 * Two boxes of mass m1 and m2 connected by a string, pulled by a force F.
 * Treated as one system, the internal tension cancels and the pair
 * accelerates as a single object of mass m1 + m2: a = F / (m1 + m2).
 */

const W = 900;
const H = 600;

const BOX2_X = 240, BOX1_X = 500;
const BOX_Y = 300, BOX_W = 150, BOX_H = 90;
const F_PX = 150;
const RUN_SEC = 1.8;

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
  { caption: 'Two boxes of mass m₁ and m₂ sit on a frictionless surface, joined by a string. A force F pulls Box 1 to the right.' },
  { caption: 'Look at the two boxes together as one system — the pair accelerates together.' },
  { caption: 'The string’s tension is internal: it pulls Box 2 forward and Box 1 backward with equal strength, so it cancels inside the system.' },
  { caption: 'Only the external force F matters: a = F ÷ (m₁ + m₂). The pair accelerates like one object of mass m₁ + m₂.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class SystemOfBoxesScene extends CanvasSimulation {
  static simId = 'system-of-boxes';
  static label = { en: 'Two boxes as one system' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Two boxes of mass m one and m two are connected by a string on a frictionless surface and pulled by a ' +
    'force F. The tension in the string is internal, pulling one box forward and the other backward equally, so ' +
    'it cancels. The pair accelerates as one object of mass m one plus m two, with acceleration a equals F ' +
    'divided by the total mass.';

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

  _dx() {
    if (this.stepIndex === 0) return 0;
    return 180 * cruise(clamp01(this._stepEnterTime / RUN_SEC));
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const dx = this._dx();
    const b1x = BOX1_X + dx, b2x = BOX2_X + dx;

    this._drawGround(ctx);

    // boxes
    this._drawBox(ctx, b1x, 'm₁', c.shape);
    this._drawBox(ctx, b2x, 'm₂', c.wedge);

    // string between
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b2x + BOX_W, BOX_Y + 30);
    ctx.lineTo(b1x, BOX_Y + 30);
    ctx.stroke();

    // external force F
    if (this.stepIndex >= 0) {
      this._arrow(ctx, b1x + BOX_W, BOX_Y - 30, F_PX, c.good, 'F');
    }

    // internal tension arrows on step 2
    if (this.stepIndex === 2) {
      this._arrow(ctx, b1x, BOX_Y + 20, -110, c.bad, 'T');
      this._arrow(ctx, b2x + BOX_W, BOX_Y + 20, 110, c.bad, 'T');
      ctx.fillStyle = c.bad;
      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('internal tension — cancels', (b1x + b2x) / 2, BOX_Y - 70);
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 260, 440, 520, 76, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 17px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('a = F ÷ (m₁ + m₂)', W / 2, 478);
      ctx.fillStyle = c.label;
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillText('accelerates like a single object of mass m₁ + m₂', W / 2, 504);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawGround(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, BOX_Y + BOX_H + 6);
    ctx.lineTo(W - 40, BOX_Y + BOX_H + 6);
    ctx.stroke();
    ctx.restore();
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

  _arrow(ctx, fromX, y, len, color, label) {
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

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 540, 660, 24, 'center');
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