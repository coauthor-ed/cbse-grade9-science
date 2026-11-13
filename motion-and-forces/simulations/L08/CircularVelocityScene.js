import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * CircularVelocityScene — companion to blk-l08-s1 / blk-l08-s3.
 * A child on a merry-go-round moves on a circle of radius R. The distance is
 * the curved arc swept; the displacement is the straight chord. One full
 * revolution: distance = 2*pi*R, displacement = 0. Speed = 2*pi*R / T; the
 * velocity direction keeps turning, so there is acceleration.
 */

const W = 900;
const H = 600;

const CX = 330, CY = 310, R = 200;
const START_ANGLE = -Math.PI / 2; // top

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', '#38bdf8'],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', '#34d399'],
};

const STEPS = [
  { caption: 'A child on a merry-go-round moves along a circle of radius R.' },
  { caption: 'The distance travelled is the curved arc. The displacement is the straight chord from start to finish.' },
  { caption: 'After one full revolution: distance = 2πR, but displacement = 0 — back where she started.' },
  { caption: 'Speed = 2πR ÷ T. The velocity’s direction keeps turning even at constant speed, so the motion is accelerated.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class CircularVelocityScene extends CanvasSimulation {
  static simId = 'circular-velocity';
  static label = { en: 'Distance, displacement and speed on a circle' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A point moves on a circle of radius R. The distance travelled is the curved arc swept out. The ' +
    'displacement is the straight chord from the starting point to the current point. After one full ' +
    'revolution the distance is two pi R but the displacement is zero. The speed is two pi R divided by the ' +
    'period, and the direction of velocity keeps changing, so the motion is accelerated.';

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

  // returns the current sweep angle (from START_ANGLE) in radians
  _sweep() {
    const t = this._stepEnterTime;
    if (this.stepIndex === 0) return 0;
    if (this.stepIndex === 1) return (Math.PI * 2 / 3) * cruise(t / 2.6); // 120 deg
    if (this.stepIndex === 2) return Math.PI * 2 * cruise(t / 3.2);
    return Math.PI * 2 * (0.4 + 0.1 * Math.sin(t * 1.2)); // small oscillation, full circle-ish
  }

  _point(angle) {
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const sweep = this._sweep();
    const curAngle = START_ANGLE + sweep;
    const start = this._point(START_ANGLE);
    const cur = this._point(curAngle);
    const fullRev = this.stepIndex === 2 || this.stepIndex === 3;

    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // radius
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('R', CX + (R / 2) * Math.cos(curAngle) + 14, CY + (R / 2) * Math.sin(curAngle) + 4);
    ctx.restore();

    // centre
    ctx.fillStyle = c.label;
    ctx.beginPath();
    ctx.arc(CX, CY, 5, 0, Math.PI * 2);
    ctx.fill();

    if (this.stepIndex >= 1) {
      // arc (distance) in wedge
      ctx.save();
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(CX, CY, R, START_ANGLE, curAngle);
      ctx.stroke();
      ctx.restore();
      // chord (displacement) in green
      ctx.save();
      ctx.strokeStyle = c.good;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(cur.x, cur.y);
      ctx.stroke();
      ctx.restore();

      // labels
      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = c.wedge;
      ctx.fillText('distance = arc', CX + R * 0.55, CY - R * 0.62);
      ctx.fillStyle = c.good;
      ctx.fillText('displacement = chord', CX - R * 0.7, CY - R * 0.2);
    }

    // point
    ctx.fillStyle = c.shape;
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 10, 0, Math.PI * 2);
    ctx.fill();

    if (this.stepIndex === 2) {
      SimDraw.drawPanel(ctx, W / 2 - 200, 120, 400, 76, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.wedge;
      ctx.fillText('distance (1 revolution) = 2πR', W / 2, 150);
      ctx.fillStyle = c.good;
      ctx.fillText('displacement = 0', W / 2, 176);
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 220, 120, 440, 76, { bg: c.panelBg, radius: 10, stroke: c.wedge, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillStyle = c.wedge;
      ctx.fillText('speed = 2πR ÷ T', W / 2, 152);
      ctx.fillStyle = c.label;
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillText('direction of velocity changes → accelerated', W / 2, 180);
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
    this._wrapText(ctx, caption, 520, 520, 360, 24, 'center');
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