import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawVehicle, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * MomentumIntroScene — companion to blk-l14-s13.
 * A heavy, slow truck (m=2000 kg, v=5 m/s) and a light, fast car
 * (m=1000 kg, v=10 m/s) are deliberately tuned to the same momentum,
 * 10,000 kg·m/s — the visual argument for "equally hard to stop" being a
 * genuine equality, not just a turn of phrase. The final beat shows one of
 * them (the car) speeding up, its momentum bar growing to make Δp = m(v−u)
 * a picture rather than only an equation.
 */

const W = 900;
const H = 600;
const TRUCK_M = 2000, TRUCK_V = 5;
const CAR_M = 1000, CAR_V0 = 10, CAR_V1 = 16;

const BAR_MAX = 18000;
const BAR_X0 = 260, BAR_W = 380, BAR_H = 26;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  truck:   ['--sim-motion-shape', FORCE_COLORS.applied],
  car:     ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'A heavy truck crawling along and a light car speeding down the highway can be equally hard to stop.', showBars: false },
  { caption: 'Momentum p = mass × velocity — combine both into one number.', showBars: true, carV: CAR_V0 },
  { caption: 'When the car speeds up from 10 to 16 m/s, its momentum grows: Δp = m(v − u).', showBars: true, carV: CAR_V1, showDelta: true },
];

const BEAT_STEP_MAP = STEPS.map((_, i) => [{ idx: i, dwellMs: null }]);

export class MomentumIntroScene extends CanvasSimulation {
  static simId = 'momentum-intro';
  static label = { en: 'Naming Momentum' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A heavy, slow truck and a light, fast car, tuned so both have the same momentum, ten thousand ' +
    'kilogram metres per second, shown as two equal-length bars. On the final beat the car speeds up and ' +
    'its momentum bar grows, illustrating the change in momentum.';

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;
    this.colors = null;
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

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

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

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawBar(ctx, y, frac, color, label) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(BAR_X0, y, BAR_W, BAR_H);
    ctx.fillStyle = color;
    ctx.fillRect(BAR_X0, y, BAR_W * Math.min(1, frac), BAR_H);
    ctx.restore();
    ctx.font = '600 14px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'left';
    ctx.fillText(label, BAR_X0 + BAR_W + 14, y + BAR_H - 7);
  }

  _drawScene(ctx, step) {
    const c = this.colors;

    drawVehicle(ctx, 180, 240, { type: 'bus', scale: 0.85, color: c.truck, facing: 1 });
    drawVehicle(ctx, 180, 420, { type: 'car', scale: 0.85, color: c.car, facing: 1, speedLines: step.carV >= CAR_V1 });

    drawLabelPill(ctx, `truck: m = ${TRUCK_M} kg, v = ${TRUCK_V} m/s`, 300, 140, { color: c.truck });
    drawLabelPill(ctx, `car: m = ${CAR_M} kg, v = ${step.carV ?? CAR_V0} m/s`, 300, 345, { color: c.car });

    if (step.showBars) {
      const pTruck = TRUCK_M * TRUCK_V;
      const pCar = CAR_M * (step.carV ?? CAR_V0);
      this._drawBar(ctx, 230, pTruck / BAR_MAX, c.truck, `p = ${pTruck.toLocaleString()} kg·m/s`);
      this._drawBar(ctx, 410, pCar / BAR_MAX, c.car, `p = ${pCar.toLocaleString()} kg·m/s`);

      if (step.showDelta) {
        const dp = CAR_M * (CAR_V1 - CAR_V0);
        drawLabelPill(ctx, `Δp = m(v − u) = ${CAR_M} × (${CAR_V1} − ${CAR_V0}) = ${dp.toLocaleString()} kg·m/s`,
          W / 2, 500, { color: c.good, font: '700 16px Inter, system-ui', height: 34 });
      } else {
        drawLabelPill(ctx, 'p = m × v — same momentum, two very different objects', W / 2, 500, { color: c.good, font: '700 16px Inter, system-ui', height: 34 });
      }
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
    wrapText(ctx, caption, W / 2 - 330, 555, 660, 24, 'center');
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

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }
  _announceStep() { this._announce(STEPS[this.stepIndex].caption); }
}
