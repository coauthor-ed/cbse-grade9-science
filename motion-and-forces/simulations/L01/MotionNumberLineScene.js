import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * MotionNumberLineScene — companion to blk-l01-s2, iesc1-ch4 (linear-motion /
 * instantaneous-position / direction-in-motion). Draws the athlete's track as
 * a signed number line: origin O, +/- direction arrows, then places an
 * athlete marker at point B (+40 m) and later point A (+100 m), matching the
 * lesson markdown's own beats one-for-one. Hands off to a free-drag slider
 * once the explanation is done, so the student can place the marker anywhere
 * and read its signed position for themself.
 */

const W = 900;
const H = 320;

const AXIS_Y = 170;
const AXIS_LEFT_X = 60;
const AXIS_RIGHT_X = W - 60;
const MIN_VAL = -60;
const MAX_VAL = 120;
const PX_PER_M = (AXIS_RIGHT_X - AXIS_LEFT_X) / (MAX_VAL - MIN_VAL);

const POS_B = 40;
const POS_A = 100;
const SLIDER_MIN = -60;
const SLIDER_MAX = 120;
const SLIDER_STEP = 10;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-numberline-muted', '#94a3b8'],
  axis:     ['--sim-numberline-axis', '#94a3b8'],
  positive: ['--sim-series-1', '#38bdf8'],
  negative: ['--sim-series-2', '#fb923c'],
  pointB:   ['--sim-series-4', '#34d399'],
  pointA:   ['--sim-series-3', '#f472b6'],
};

const STEP_LINE = 0;
const STEP_DIR = 1;
const STEP_B = 2;
const STEP_A = 3;
const STEP_RECAP = 4;
const STEP_FREEPLAY = 5;

const STEPS = [
  { caption: "The track, drawn as a number line. O marks the athlete's starting point." },
  { caption: 'Right of O is positive. Left of O is negative — the sign is the direction.' },
  { caption: 'At one instant, the athlete is at point B: position +40 m.' },
  { caption: 'A little later, she is at point A: position +100 m.' },
  { caption: 'Reference point, distance, and direction — together they pin down a position.' },
  { caption: 'Drag the slider to place the marker anywhere and read its signed position.' },
];

// blk-l01-s2.json's markdown has five <!-- STEP --> beats (line, directions,
// pointB, pointA, instant); freeplay has no beat of its own — reached only
// via this scene's own "Try it yourself" control once the last beat lands.
const BEAT_STEP_MAP = [
  [{ idx: STEP_LINE, dwellMs: null }],
  [{ idx: STEP_DIR, dwellMs: null }],
  [{ idx: STEP_B, dwellMs: null }],
  [{ idx: STEP_A, dwellMs: null }],
  [{ idx: STEP_RECAP, dwellMs: null }],
];

function xOf(val) { return AXIS_LEFT_X + (val - MIN_VAL) * PX_PER_M; }

function fmtSigned(v) {
  return `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v)} m`;
}

export class MotionNumberLineScene extends CanvasSimulation {
  static simId = 'motion-number-line';
  static label = { en: 'Position on a Number Line' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    "Position on a number line. An athlete's straight track is drawn as a signed number line with an " +
    'origin O, showing the athlete at point B, forty metres in the positive direction, then at point A, ' +
    'one hundred metres in the positive direction, then hands off to a free-drag slider to place the ' +
    'marker anywhere and read its signed position.';

  static CONTROLS = [
    { type: 'button', id: 'explore', label: 'Try it yourself →' },
    { type: 'slider', id: 'pos', label: 'Position (m):', min: SLIDER_MIN, max: SLIDER_MAX, step: SLIDER_STEP, value: POS_B },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_LINE;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this.freeVal = POS_B;
    this._liveRegion = null;
    this._unbindArrows = null;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._canvas.tabIndex = 0;
    this._unbindArrows = this.bindArrowNavigation(this._canvas, (dir) => {
      if (this.stepIndex !== STEP_FREEPLAY) return false;
      this.freeVal = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, this.freeVal + dir * SLIDER_STEP));
      this._announce(`Position ${fmtSigned(this.freeVal)}.`);
      this.requestUiUpdate?.();
      return true;
    });
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce("Position on a number line. Here's the track, drawn as a number line, with origin O.");
  }

  destroy() {
    if (this._unbindArrows) this._unbindArrows();
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  _isBeatLocked() { return this._lessonLinked && this.stepIndex < STEP_FREEPLAY; }

  isControlHidden(id) {
    if (id === 'explore') return this.stepIndex !== STEP_RECAP;
    if (id === 'pos') return this.stepIndex !== STEP_FREEPLAY;
    return false;
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
    this.stepIndex = i;
    this._stepEnterTime = 0;
    this._announce(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (this._canvas) this._canvas.focus({ preventScroll: true });
    if (id === 'explore') {
      this._jumpToStep(STEP_FREEPLAY);
    } else if (id === 'pos') {
      this.freeVal = Math.round(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Number(value))) / SLIDER_STEP) * SLIDER_STEP;
      this._announce(`Position ${fmtSigned(this.freeVal)}.`);
    }
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx);
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

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawScene(ctx) {
    const c = this.colors;
    const step = this.stepIndex;

    // Axis
    ctx.save();
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(AXIS_LEFT_X, AXIS_Y);
    ctx.lineTo(AXIS_RIGHT_X, AXIS_Y);
    ctx.stroke();
    ctx.restore();

    // Tick marks every 20 m
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.7);
    ctx.fillStyle = c.muted;
    ctx.font = '500 11px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1.5;
    for (let v = MIN_VAL; v <= MAX_VAL; v += 20) {
      const x = xOf(v);
      ctx.beginPath();
      ctx.moveTo(x, AXIS_Y - 7);
      ctx.lineTo(x, AXIS_Y + 7);
      ctx.stroke();
      ctx.fillText(`${v} m`, x, AXIS_Y + 26);
    }
    ctx.restore();

    // Origin O
    const ox = xOf(0);
    ctx.save();
    ctx.fillStyle = c.label;
    ctx.font = '700 15px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('O', ox, AXIS_Y - 20);
    ctx.beginPath();
    ctx.arc(ox, AXIS_Y, 4, 0, Math.PI * 2);
    ctx.fillStyle = c.label;
    ctx.fill();
    ctx.restore();

    // Direction arrows (from step 1 onward)
    if (step >= STEP_DIR) {
      const fade = step === STEP_DIR ? clamp01(this._stepEnterTime / 0.5) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      SimDraw.drawArrow(ctx, ox + 10, AXIS_Y - 45, AXIS_RIGHT_X, AXIS_Y - 45, { color: c.positive, lineWidth: 3 });
      ctx.fillStyle = c.positive;
      ctx.font = '700 14px Inter, system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('+ (positive direction)', ox + 15, AXIS_Y - 55);
      SimDraw.drawArrow(ctx, ox - 10, AXIS_Y - 45, AXIS_LEFT_X, AXIS_Y - 45, { color: c.negative, lineWidth: 3 });
      ctx.fillStyle = c.negative;
      ctx.textAlign = 'right';
      ctx.fillText('- (negative direction)', ox - 15, AXIS_Y - 55);
      ctx.restore();
    }

    // Point B marker (from step 2 onward)
    if (step >= STEP_B) {
      const dim = step > STEP_B && step < STEP_RECAP + 1 ? 1 : 1;
      this._drawMarker(ctx, POS_B, 'B', c.pointB, dim, step === STEP_B);
    }

    // Point A marker (from step 3 onward)
    if (step >= STEP_A) {
      this._drawMarker(ctx, POS_A, 'A', c.pointA, 1, step === STEP_A);
    }

    // Freeplay marker
    if (step === STEP_FREEPLAY) {
      this._drawMarker(ctx, this.freeVal, null, c.positive, 1, false, true);
    }

    this._drawCaption(ctx, STEPS[step].caption);
  }

  _drawMarker(ctx, val, label, color, alpha, justArrived, isFree = false) {
    const x = xOf(val);
    const riseProgress = justArrived ? clamp01(this._stepEnterTime / 0.4) : 1;
    const y = AXIS_Y - 8 - 30 * riseProgress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(color, -0.3);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = SimDraw.withAlpha(color, 0.6);
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x, AXIS_Y);
    ctx.stroke();
    ctx.restore();

    const tag = label ? `${label}: ${fmtSigned(val)}` : fmtSigned(val);
    SimDraw.drawLabel(ctx, tag, x, y - 14, { bg: this.colors.panelBg, color, offsetY: 0 });
    if (isFree) {
      ctx.save();
      ctx.fillStyle = this.colors.muted;
      ctx.font = '600 11px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('drag the slider below', x, y - 44);
      ctx.restore();
    }
  }

  _drawCaption(ctx, caption) {
    ctx.save();
    ctx.font = '600 15px Inter, system-ui';
    ctx.fillStyle = this.colors.label;
    ctx.textAlign = 'center';
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.fillText(caption, W / 2, H - 24);
    ctx.restore();
  }
}
