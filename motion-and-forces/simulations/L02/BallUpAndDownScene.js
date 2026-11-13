import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * BallUpAndDownScene — companion to blk-l02-s4 (Activity 4.1, Fig 4.5).
 * A ball is thrown vertically up from O, reaches B (140 cm), and falls back
 * to O. At the top, distance and displacement both equal 140 cm. Back at O,
 * the total distance is 280 cm but the displacement is zero.
 */

const W = 900;
const H = 600;

const RULER_X = 120;
const BOTTOM_Y = 470;
const PX_PER_CM = 2.2;   // 140 cm -> 308 px
const TOP_Y = BOTTOM_Y - 140 * PX_PER_CM;
const BALL_R = 16;

const RISE_SEC = 2.4;
const FALL_SEC = 2.0;

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
  { caption: 'A ball is thrown straight up from O at ground level. Its highest point is B, 140 cm up.' },
  { caption: 'On the way up, every centimetre climbed is both distance and displacement: 140 cm upward.' },
  { caption: 'It falls back to O. The trip up plus the trip down: total distance 280 cm.' },
  { caption: 'But the ball is back where it started. Distance 280 cm — displacement zero.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class BallUpAndDownScene extends CanvasSimulation {
  static simId = 'ball-up-and-down';
  static label = { en: 'Distance vs displacement for a thrown ball' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A ball is thrown straight up from the ground and falls back down. The highest point B is one hundred and ' +
    'forty centimetres above the ground. The total distance travelled is two hundred and eighty centimetres, ' +
    'but since it returns to the start, the displacement is zero.';

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

  _ballY() {
    const t = this._stepEnterTime;
    if (this.stepIndex === 0) return BOTTOM_Y;
    if (this.stepIndex === 1) {
      return lerp(BOTTOM_Y, TOP_Y, cruise(t / RISE_SEC));
    }
    if (this.stepIndex === 2) {
      return lerp(TOP_Y, BOTTOM_Y, cruise(t / FALL_SEC));
    }
    return BOTTOM_Y; // step 3
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const ballY = this._ballY();

    this._drawRuler(ctx);
    this._drawPath(ctx, ballY);
    this._drawBall(ctx, ballY);

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 240, 120, 480, 92, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillStyle = c.wedge;
      ctx.fillText('total distance travelled = 280 cm', W / 2, 150);
      ctx.fillStyle = c.good;
      ctx.fillText('displacement = 0 cm (back to O)', W / 2, 180);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawRuler(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.55);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(RULER_X, TOP_Y - 20);
    ctx.lineTo(RULER_X, BOTTOM_Y + 20);
    ctx.stroke();
    ctx.font = '600 11px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'left';
    for (let cm = 0; cm <= 140; cm += 20) {
      const y = BOTTOM_Y - cm * PX_PER_CM;
      ctx.beginPath();
      ctx.moveTo(RULER_X - 6, y);
      ctx.lineTo(RULER_X + 6, y);
      ctx.stroke();
      ctx.fillText(`${cm} cm`, RULER_X + 12, y + 4);
    }
    ctx.fillStyle = c.wedge;
    ctx.font = '700 14px Inter, system-ui';
    ctx.fillText('B (140 cm)', RULER_X + 12, TOP_Y + 4);
    ctx.restore();
  }

  _drawPath(ctx, ballY) {
    const c = this.colors;
    ctx.save();
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const leftX = RULER_X + 150;
    if (this.stepIndex === 1) {
      // rising: trail the path already covered
      ctx.strokeStyle = c.wedge;
      ctx.beginPath();
      ctx.moveTo(leftX, BOTTOM_Y);
      ctx.lineTo(leftX, ballY);
      ctx.stroke();
    }
    if (this.stepIndex === 2) {
      // falling: full up-path stays, the return leg fades in from the top
      ctx.strokeStyle = c.wedge;
      ctx.beginPath();
      ctx.moveTo(leftX, BOTTOM_Y);
      ctx.lineTo(leftX, TOP_Y);
      ctx.stroke();
      ctx.strokeStyle = SimDraw.withAlpha(c.wedge, 0.55);
      ctx.beginPath();
      ctx.moveTo(leftX, TOP_Y);
      ctx.lineTo(leftX, ballY);
      ctx.stroke();
    }
    if (this.stepIndex === 3) {
      // verdict: the whole 280 cm trip is complete
      ctx.strokeStyle = c.wedge;
      ctx.beginPath();
      ctx.moveTo(leftX, BOTTOM_Y);
      ctx.lineTo(leftX, TOP_Y);
      ctx.stroke();
      ctx.strokeStyle = SimDraw.withAlpha(c.wedge, 0.55);
      ctx.beginPath();
      ctx.moveTo(leftX, TOP_Y);
      ctx.lineTo(leftX, BOTTOM_Y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBall(ctx, y) {
    const c = this.colors;
    const x = RULER_X + 150;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = c.shape;
    ctx.fill();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 18);
    ctx.lineTo(x + 12, y + 18);
    ctx.stroke();
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 400, 660, 24, 'center');
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