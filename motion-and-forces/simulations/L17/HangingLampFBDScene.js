import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * HangingLampFBDScene — companion to blk-l17-s3.
 *
 * Process Statement: a lamp hanging at rest from one string has exactly two
 * forces on it — weight and tension — and because it isn't accelerating,
 * Newton's first law forces them to be equal and opposite: T = mg. This
 * scene isolates the lamp, reveals the two arrows one at a time, then shows
 * the balance and the resulting equation.
 */

const W = 900;
const H = 600;

const CEIL_Y = 90;
const LAMP_X = 450;
const STRING_LEN = 110;
const LAMP_Y = CEIL_Y + STRING_LEN;
const LAMP_R = 30;
const MASS_KG = 2;
const G = 9.8;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  lamp:    ['--sim-motion-shape', FORCE_COLORS.applied],
  weight:  ['--sim-force-gravity', FORCE_COLORS.gravity],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'Isolate the lamp. Forget the ceiling and the rest of the room — just the lamp.' },
  { caption: 'Two forces touch the lamp: weight pulling down, tension pulling up.' },
  { caption: 'At rest means no acceleration — so the two forces must be equal and opposite.' },
  { caption: 'T = mg. A 2 kg lamp needs 19.6 N of tension to hang still.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class HangingLampFBDScene extends CanvasSimulation {
  static simId = 'hanging-lamp-fbd';
  static label = { en: 'Free-body diagram of a hanging lamp' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A lamp hangs at rest from a string tied to the ceiling. The scene isolates the lamp, then draws its weight ' +
    'arrow pointing down and its tension arrow pointing up, shows the two arrows are equal length since the lamp ' +
    'is not accelerating, and displays the equation tension equals mass times g, with the numeric answer for a ' +
    '2 kilogram lamp.';

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
      // ceiling still visible, string drawn, no arrows yet
      ctx.save();
      ctx.fillStyle = c.panelBg;
      ctx.fillRect(300, CEIL_Y - 24, 300, 24);
      ctx.restore();
      this._drawString(ctx);
    }
    // from beat 1 onward: fully isolated, no ceiling/string chrome
    this._drawLamp(ctx);

    if (this.stepIndex >= 1) {
      const arrowAlpha = clamp01(this._stepEnterTime / 0.5);
      ctx.save();
      ctx.globalAlpha = arrowAlpha;
      drawForceArrow(ctx, LAMP_X, LAMP_Y + LAMP_R, { angle: Math.PI / 2, length: 90, color: c.weight, label: 'weight (mg)' });
      drawForceArrow(ctx, LAMP_X, LAMP_Y - LAMP_R, { angle: -Math.PI / 2, length: 90, color: c.tension, label: 'tension (T)' });
      ctx.restore();
    }

    if (this.stepIndex >= 2) {
      drawLabelPill(ctx, 'not accelerating → balanced → equal arrows', W / 2, 400, { color: c.good, font: '700 14px Inter, system-ui', height: 28 });
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, W / 2 - 190, 440, 380, 60, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('T = mg', W / 2, 468);
      ctx.fillStyle = c.label;
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillText(`${MASS_KG} kg × ${G} N/kg = ${(MASS_KG * G).toFixed(1)} N`, W / 2, 490);
      ctx.restore();
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawString(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LAMP_X, CEIL_Y);
    ctx.lineTo(LAMP_X, LAMP_Y - LAMP_R);
    ctx.stroke();
    ctx.restore();
  }

  _drawLamp(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.lamp, 0.25);
    ctx.strokeStyle = c.lamp;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(LAMP_X, LAMP_Y, LAMP_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.lamp;
    ctx.font = '700 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${MASS_KG} kg`, LAMP_X, LAMP_Y + 5);
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 560, 660, 24, 'center');
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
