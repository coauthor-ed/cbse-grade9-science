import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * PositionReferenceLineScene — companion to blk-l01-s1, "describing position".
 * A number line with an origin O shows that a position is a distance AND a
 * direction from a reference point; that changing the reference point changes
 * the answer; and that +/− signs encode direction. Beat 3 animates the object
 * along the line to make "position changes over time => motion" visible.
 */

const W = 900;
const H = 600;

const LINE_Y = 300;
const LINE_X0 = 150;   // -100 m
const LINE_X1 = 750;   // +100 m
const O_X = 450;       // origin at 0 m
const PX_PER_M = 3;

const OBJ_M = 40;      // object position in metres
const OBJ_X = O_X + OBJ_M * PX_PER_M;
const O2_X = O_X + 80 * PX_PER_M; // second origin at +80 m

const OSC_MIN = -20;
const OSC_MAX = 60;

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
  { caption: 'To say where an object is, name a reference point, then give a distance AND a direction from it.' },
  { caption: 'Change the reference point and the same object gets a different position. There is no single absolute answer.' },
  { caption: 'On a straight line we agree on a convention: to the right of the reference point is positive, to the left is negative.' },
  { caption: 'If the position keeps changing relative to the reference point, the object is in motion.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class PositionReferenceLineScene extends CanvasSimulation {
  static simId = 'position-reference-line';
  static label = { en: 'Position depends on the reference point' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A number line in metres. An origin O marks the reference point and an object sits at plus forty metres. ' +
    'Adding a second reference point O two at plus eighty metres makes the same object read as minus forty metres. ' +
    'Positions right of the reference are positive, left are negative. Then the object slides back and forth, ' +
    'showing that a changing position relative to the reference means the object is in motion.';

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
    this._osc = 0;
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
    this._osc += dt;
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

  _currentObjX() {
    if (this.stepIndex === 3) {
      const t = (Math.sin(this._osc * 0.7) + 1) / 2; // 0..1
      return O_X + (OSC_MIN + (OSC_MAX - OSC_MIN) * t) * PX_PER_M;
    }
    return OBJ_X;
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const objX = this._currentObjX();

    this._drawAxis(ctx);
    if (this.stepIndex >= 1) this._drawSecondOrigin(ctx, objX);
    if (this.stepIndex === 2) this._drawSigns(ctx);
    this._drawObject(ctx, objX, this.stepIndex === 3);
    this._drawOriginMarker(ctx);

    if (this.stepIndex === 3) {
      SimDraw.drawLabel(ctx, 'position changes with time', objX, LINE_Y + 84, { bg: c.panelBg, color: c.wedge });
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawAxis(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.6);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(LINE_X0, LINE_Y);
    ctx.lineTo(LINE_X1, LINE_Y);
    ctx.stroke();
    // arrowhead
    ctx.fillStyle = c.label;
    ctx.beginPath();
    ctx.moveTo(LINE_X1, LINE_Y);
    ctx.lineTo(LINE_X1 - 12, LINE_Y - 6);
    ctx.lineTo(LINE_X1 - 12, LINE_Y + 6);
    ctx.closePath();
    ctx.fill();

    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    for (let m = -80; m <= 80; m += 40) {
      const x = O_X + m * PX_PER_M;
      ctx.beginPath();
      ctx.moveTo(x, LINE_Y - 6);
      ctx.lineTo(x, LINE_Y + 6);
      ctx.stroke();
      ctx.fillText(`${m > 0 ? '+' : ''}${m} m`, x, LINE_Y + 24);
    }
    ctx.restore();
  }

  _drawOriginMarker(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = c.good;
    ctx.beginPath();
    ctx.moveTo(O_X, LINE_Y - 14);
    ctx.lineTo(O_X + 10, LINE_Y + 4);
    ctx.lineTo(O_X - 10, LINE_Y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.good;
    ctx.fillText('reference point O', O_X, LINE_Y - 24);
    ctx.restore();
  }

  _drawSecondOrigin(ctx, objX) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = c.wedge;
    ctx.beginPath();
    ctx.moveTo(O2_X, LINE_Y - 14);
    ctx.lineTo(O2_X + 10, LINE_Y + 4);
    ctx.lineTo(O2_X - 10, LINE_Y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.wedge;
    ctx.fillText('reference point O₂', O2_X, LINE_Y - 24);

    const objNow = this.stepIndex === 3 ? objX : OBJ_X;
    const fromO = objNow - O_X;
    const fromO2 = objNow - O2_X;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.good;
    ctx.beginPath(); ctx.moveTo(objNow, LINE_Y - 8); ctx.lineTo(objNow, LINE_Y - 70); ctx.stroke();
    ctx.strokeStyle = c.wedge;
    ctx.beginPath(); ctx.moveTo(objNow, LINE_Y - 8); ctx.lineTo(objNow, LINE_Y - 98); ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.font = '600 13px Inter, system-ui';
    ctx.fillStyle = c.good;
    ctx.fillText(`${fromO >= 0 ? '+' : ''}${Math.round(fromO / PX_PER_M)} m from O`, objNow, LINE_Y - 78);
    ctx.fillStyle = c.wedge;
    ctx.fillText(`${fromO2 >= 0 ? '+' : ''}${Math.round(fromO2 / PX_PER_M)} m from O₂`, objNow, LINE_Y - 106);
    ctx.restore();
  }

  _drawSigns(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.font = '700 20px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = c.good;
    ctx.fillText('+', O_X + 260, LINE_Y - 44);
    ctx.fillText('positive', O_X + 260, LINE_Y - 22);
    ctx.fillStyle = c.bad;
    ctx.fillText('−', O_X - 260, LINE_Y - 44);
    ctx.fillText('negative', O_X - 260, LINE_Y - 22);
    ctx.restore();
  }

  _drawObject(ctx, objX, animate) {
    const c = this.colors;
    ctx.save();
    ctx.beginPath();
    ctx.arc(objX, LINE_Y - 16, 12, 0, Math.PI * 2);
    ctx.fillStyle = c.shape;
    ctx.fill();
    ctx.strokeStyle = SimDraw.withAlpha(c.shape, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objX, LINE_Y - 16);
    ctx.lineTo(objX, LINE_Y - 34);
    ctx.stroke();

    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.label;
    if (animate) {
      const t = (this._osc * 0.7) % 1;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * Math.PI * 2);
    }
    ctx.fillText('object', objX, LINE_Y - 46);
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 430, 660, 24, 'center');
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