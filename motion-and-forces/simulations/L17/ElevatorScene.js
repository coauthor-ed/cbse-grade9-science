import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPerson, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * ElevatorScene — companion to blk-l17-s17 (and reused by q-l17-s18, q-l17-s19).
 *
 * Process Statement: a scale under someone's feet reads the normal force,
 * not their true weight — and those only agree when acceleration is zero.
 * Accelerating upward, N = m(g+a) > mg (feels heavier); accelerating
 * downward, N = m(g-a) < mg (feels lighter); in true free fall, a = g and
 * N = 0 — apparent weightlessness, even though gravity never switched off.
 * The final beat is a freeplay slider sweeping acceleration from -g to +g,
 * with a live scale readout.
 *
 * The cabin itself never moves — instead, a scrolling shaft background
 * (tick marks in the margins either side of the cabin) gives the sense of
 * real motion: ticks drift downward past a rising cabin, upward past a
 * falling one, fast during free fall. Every beat also draws both forces on
 * the person as labeled arrows — weight (mg, fixed length, it never
 * changes) and the scale's normal force (N, length tracking the actual
 * reading) — so the two can be visually compared beat to beat, not just
 * read off a number.
 */

const W = 900;
const H = 600;

const MASS_KG = 60;
const G = 9.8;
const TRUE_WEIGHT = MASS_KG * G; // 588 N

const CABIN_X0 = 320, CABIN_X1 = 580, CABIN_Y0 = 110, CABIN_Y1 = 490;
const SCALE_X = 450, SCALE_Y = 460, SCALE_W = 100, SCALE_H = 16;
const ARROW_X = 640;
const WEIGHT_ARROW_X = SCALE_X - 95, NORMAL_ARROW_X = SCALE_X + 95;
const FORCE_PX_PER_N = 0.12;
const TICK_SPACING = 50;
const TICK_SCROLL_PX_PER_S = 14; // px/s of scroll per 1 m/s² of acceleration

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  cabin:    ['--sim-motion-shape', FORCE_COLORS.applied],
  person:   ['--sim-motion-cart', '#e2e8f0'],
  scale:    ['--sim-force-normal', FORCE_COLORS.normal],
  weight:   ['--sim-force-gravity', FORCE_COLORS.gravity],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
  bad:      ['--sim-motion-bad', FORCE_COLORS.netBad],
};

const STEPS = [
  { caption: 'Isolate the person: weight mg down, and the scale pushes up with normal force N — the reading.', accel: 0 },
  { caption: 'Accelerating upward: N − mg = ma, so N = m(g+a). Bigger than true weight — you feel heavier.', accel: 2 },
  { caption: 'Accelerating downward: mg − N = ma, so N = m(g−a). Smaller than true weight — you feel lighter.', accel: -2 },
  { caption: 'Cable snaps: free fall, a = g. N = m(g−g) = 0. The scale reads zero — apparent weightlessness.', accel: -9.8 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class ElevatorScene extends CanvasSimulation {
  static simId = 'elevator-apparent-weight';
  static label = { en: 'Apparent weight in an accelerating lift' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A person stands on a bathroom scale inside a lift cabin. The scene isolates the person, showing weight down ' +
    'and the scale’s normal force up. As the cabin accelerates upward the reading rises above true weight; ' +
    'accelerating downward it drops below; in free fall, after the cable snaps, the reading falls to zero. A ' +
    'freeplay slider on the final beat sweeps the cabin’s acceleration from free fall to a strong upward push, ' +
    'with the scale reading updating live.';

  static CONTROLS = [
    { type: 'slider', id: 'accel', label: 'Lift acceleration (m/s², + is up):', min: -9.8, max: 9.8, step: 0.2, value: -9.8, suffix: 'm/s²' },
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
    this._accel = 0;
    this._bgOffset = 0;
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
    this._accel = STEPS[this.stepIndex].accel;
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'accel') {
      this._accel = Number(value);
      const n = this._reading();
      this._announce(`Acceleration set to ${this._accel.toFixed(1)} metres per second squared. Scale reads ${n.toFixed(0)} newtons.`);
      this.requestUiUpdate?.();
    }
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _reading() {
    return Math.max(0, MASS_KG * (G + this._accel));
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    // Positive acceleration (cabin rising) scrolls the shaft ticks downward
    // past it; negative (cabin falling) scrolls them upward — the same
    // "scenery slides the opposite way to real motion" cue as a moving car.
    this._bgOffset += this._accel * TICK_SCROLL_PX_PER_S * dt;
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

  /**
   * Scrolling tick marks in the margins either side of the cabin — never
   * the cabin itself, which stays perfectly still. This is what sells "the
   * lift is moving" without touching the cabin/person/scale layout at all.
   */
  _drawShaftBackground(ctx) {
    const c = this.colors;
    const wrapped = ((this._bgOffset % TICK_SPACING) + TICK_SPACING) % TICK_SPACING;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.35);
    ctx.lineWidth = 2;
    for (let y = -TICK_SPACING + wrapped; y < H + TICK_SPACING; y += TICK_SPACING) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(CABIN_X0 - 24, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CABIN_X1 + 24, y);
      ctx.lineTo(840, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const snapped = this.stepIndex === 3;
    const reading = this._reading();
    const floating = reading < 1; // visually let the person's feet lift off the scale

    this._drawShaftBackground(ctx);

    // cable
    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 4;
    if (snapped) {
      ctx.beginPath();
      ctx.moveTo(450, 0);
      ctx.lineTo(450, 40);
      ctx.lineTo(440, 52);
      ctx.lineTo(460, 64);
      ctx.lineTo(450, 76);
      ctx.stroke();
      ctx.fillStyle = c.bad;
      ctx.font = '700 12px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('cable snapped', 450, 30);
    } else {
      ctx.beginPath();
      ctx.moveTo(450, 0);
      ctx.lineTo(450, CABIN_Y0);
      ctx.stroke();
    }
    ctx.restore();

    // cabin
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.cabin, 0.12);
    ctx.strokeStyle = c.cabin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(CABIN_X0, CABIN_Y0, CABIN_X1 - CABIN_X0, CABIN_Y1 - CABIN_Y0, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // person on the scale (feet lift slightly when reading is ~0)
    const feetY = floating ? SCALE_Y - 10 : SCALE_Y;
    drawPerson(ctx, SCALE_X, feetY, { scale: 1.15, color: c.person, armPose: floating ? 'out-balance' : 'hang' });

    // scale
    ctx.save();
    ctx.fillStyle = c.panelBg;
    ctx.strokeStyle = c.scale;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(SCALE_X - SCALE_W / 2, SCALE_Y, SCALE_W, SCALE_H, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // digital readout
    drawLabelPill(ctx, `${reading.toFixed(0)} N`, SCALE_X, SCALE_Y + SCALE_H + 26, {
      color: reading > TRUE_WEIGHT ? c.bad : (reading < TRUE_WEIGHT - 1 ? c.scale : c.good),
      font: '700 18px Inter, system-ui',
      height: 30,
    });
    ctx.save();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText(`true weight: ${TRUE_WEIGHT.toFixed(0)} N`, SCALE_X, SCALE_Y + SCALE_H + 56);
    ctx.restore();

    // weight — fixed length always: mg never changes, only N does
    drawForceArrow(ctx, WEIGHT_ARROW_X, SCALE_Y - 90, {
      angle: Math.PI / 2, magnitude: TRUE_WEIGHT, pxPerUnit: FORCE_PX_PER_N,
      minLen: 20, maxLen: 140, color: c.weight, label: 'mg',
    });

    // normal force — length tracks the live reading; skip the arrow itself
    // right at N≈0 (an arrow with ~zero length reads as a rendering glitch,
    // not "zero force") and label it directly instead.
    if (reading < 1) {
      drawLabelPill(ctx, 'N ≈ 0', NORMAL_ARROW_X, SCALE_Y - 30, { color: c.scale, font: '700 13px Inter, system-ui', height: 22 });
    } else {
      drawForceArrow(ctx, NORMAL_ARROW_X, SCALE_Y, {
        angle: -Math.PI / 2, magnitude: reading, pxPerUnit: FORCE_PX_PER_N,
        minLen: 20, maxLen: 140, color: c.scale, label: 'N',
      });
    }

    // direction arrow beside the cabin
    if (Math.abs(this._accel) > 0.05) {
      const up = this._accel > 0;
      const arrowColor = up ? c.bad : c.scale;
      const len = Math.min(90, 20 + Math.abs(this._accel) * 7);
      ctx.save();
      ctx.strokeStyle = arrowColor;
      ctx.fillStyle = arrowColor;
      ctx.lineWidth = 4;
      const y0 = 300, dir = up ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(ARROW_X, y0);
      ctx.lineTo(ARROW_X, y0 + dir * len);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ARROW_X, y0 + dir * len);
      ctx.lineTo(ARROW_X - 8, y0 + dir * (len - 14));
      ctx.lineTo(ARROW_X + 8, y0 + dir * (len - 14));
      ctx.closePath();
      ctx.fill();
      ctx.font = '700 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`a = ${Math.abs(this._accel).toFixed(1)}`, ARROW_X, y0 - dir * 16);
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
