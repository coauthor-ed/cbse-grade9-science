import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';
import { drawVehicle, drawLabelPill, wrapText } from '../shared/PhysicsSceneKit.js';

/**
 * StoppingDistanceScene — companion to blk-l07-s3 (Example 4.8).
 *
 * Process Statement: stopping distance grows with the SQUARE of speed, not
 * linearly with it — doubling speed quadruples the distance, not doubles
 * it. The lesson beats derive the fixed textbook pair (15 m/s -> 28.1 m,
 * 30 m/s -> 112.5 m); freeplay (unlocked on the final beat) adds a speed
 * slider plus a persistent bar chart of stopping distance across a spread
 * of speeds, so the "curve, not a line" shape of v -> distance is something
 * the student sees directly, not just a stated 4x fact about one pair.
 */

const W = 900;
const H = 600;

const ROAD_Y = 250;
const PX_PER_M = 3.2;
const DECEL = 4; // m/s^2, same fixed brakes for every car

const S1 = 28.1; // 15 m/s
const S2 = 112.5; // 30 m/s
const BRAKE_SEC = 2.2;

const CHART_SPEEDS = [10, 20, 30, 40];

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
  { caption: 'Two identical cars, same brakes (acceleration −4 m s⁻²). One moves at 54 km/h (15 m s⁻¹); the other at 108 km/h (30 m s⁻¹).' },
  { caption: 'The slower car comes to rest after 28.1 m.' },
  { caption: 'The faster car — exactly double the speed — stops after 112.5 m.' },
  { caption: 'Double the speed, four times the stopping distance. Try your own speed on the slider below.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

function stoppingDistance(speed) {
  return (speed * speed) / (2 * DECEL);
}

export class StoppingDistanceScene extends CanvasSimulation {
  static simId = 'stopping-distance';
  static label = { en: 'Stopping distance grows with the square of speed' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Two identical cars brake with an acceleration of minus four metres per second squared. The car moving at ' +
    'fifty-four kilometres per hour stops after twenty-eight point one metres. The car at one hundred and eight ' +
    'kilometres per hour, exactly double the speed, stops after one hundred and twelve point five metres — four ' +
    'times the distance. On the final beat, a speed slider and a bar chart across several speeds let the student ' +
    'see the curve, not just the one 4x comparison.';

  static CONTROLS = [
    { type: 'slider', id: 'speed', label: 'Speed (m/s):', min: 2, max: 40, step: 1, value: 20, suffix: '' },
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
    this._freeplaySpeed = 20;
    this._wheelAngle = 0;
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

  onControlChange(id, value) {
    if (id === 'speed') {
      this._freeplaySpeed = Number(value);
      this._announce(`Speed set to ${this._freeplaySpeed} metres per second.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < STEPS.length - 1;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    this._wheelAngle += 4 * dt;
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

  /** x-position of a car that has travelled `traveledM` metres from a fixed
   *  start at pixel x=120 — the one formula every lane (animating or
   *  freeplay-static) positions its car with, so "how far it's travelled"
   *  and "where it's drawn" can never drift apart the way two separately-
   *  offset formulas could. */
  _carX(traveledM) {
    return 120 + traveledM * PX_PER_M;
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const freeplay = this.stepIndex === STEPS.length - 1;

    const car1Traveled = this.stepIndex === 1 ? S1 * cruise(clamp01(this._stepEnterTime / BRAKE_SEC)) : 0;
    const car2Traveled = this.stepIndex === 2 ? S2 * cruise(clamp01(this._stepEnterTime / BRAKE_SEC)) : 0;

    if (!freeplay) {
      this._drawCarLane(ctx, ROAD_Y, '54 km/h (15 m/s)', c.shape, car1Traveled, S1);
      this._drawCarLane(ctx, ROAD_Y + 110, '108 km/h (30 m/s)', c.wedge, car2Traveled, S2);
    } else {
      const d = stoppingDistance(this._freeplaySpeed);
      this._drawCarLane(ctx, ROAD_Y, `${this._freeplaySpeed} m/s (your speed)`, c.good, d, d);
      this._drawChart(ctx, this._freeplaySpeed);
    }

    this._drawCaption(ctx, step.caption);
  }

  /** @param traveledM - metres travelled so far (0..total); for a static
   *    freeplay display this is simply the full total, drawn at rest.
   *  @param total - the full stopping distance, for the "still braking"
   *    brake-light check and the caption's "so far" text. */
  _drawCarLane(ctx, laneY, label, color, traveledM, total) {
    const c = this.colors;
    const carX = this._carX(traveledM);
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.label, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, laneY);
    ctx.lineTo(W - 40, laneY);
    ctx.stroke();
    if (traveledM > 0) {
      ctx.fillStyle = SimDraw.withAlpha(color, 0.22);
      ctx.fillRect(120, laneY - 4, traveledM * PX_PER_M, 8);
    }

    const stillBraking = traveledM > 0 && traveledM < total;
    drawVehicle(ctx, carX, laneY, { type: 'car', scale: 0.55, color, wheelAngle: this._wheelAngle, brakeLight: stillBraking });

    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.fillText(label, 60, laneY - 60);
    ctx.font = '600 13px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'left';
    if (traveledM > 0) {
      // Placed well below the lane line, in space nothing else in this scene
      // draws into — a horizontal carX-relative offset used to sit the text
      // on top of the car's own wheels at some slider values (a real bug a
      // live screenshot check caught), and that risk scales with car scale
      // in a way a fixed offset can't safely predict; below-the-lane is
      // clear regardless of where the car itself ends up.
      ctx.fillText(`${traveledM.toFixed(1)} m so far`, 120, laneY + 34);
    }
    ctx.restore();
  }

  /** Bar chart across a fixed spread of speeds, with the current freeplay
   *  speed's bar highlighted — the point isn't any one bar's height, it's
   *  that the bars grow like a parabola, not a straight staircase. */
  _drawChart(ctx, currentSpeed) {
    const c = this.colors;
    const chartX0 = 120, chartX1 = W - 80, chartY0 = 360, chartY1 = 500;
    const maxD = stoppingDistance(Math.max(...CHART_SPEEDS, currentSpeed));
    const barW = (chartX1 - chartX0) / (CHART_SPEEDS.length + 1) - 16;

    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX0, chartY1);
    ctx.lineTo(chartX1, chartY1);
    ctx.stroke();

    const speeds = [...CHART_SPEEDS];
    // insert the current freeplay speed into the comparison, in its sorted position
    const allSpeeds = [...speeds];
    const slotW = (chartX1 - chartX0) / (allSpeeds.length + 1);

    allSpeeds.forEach((sp, i) => {
      const d = stoppingDistance(sp);
      const h = (d / maxD) * (chartY1 - chartY0);
      const x = chartX0 + slotW * (i + 0.7);
      const isNear = Math.abs(sp - currentSpeed) < 3;
      ctx.fillStyle = SimDraw.withAlpha(c.shape, isNear ? 0.55 : 0.28);
      ctx.beginPath();
      ctx.roundRect(x, chartY1 - h, barW, h, 6);
      ctx.fill();
      ctx.font = '600 11px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText(`${sp} m/s`, x + barW / 2, chartY1 + 18);
      ctx.fillText(`${d.toFixed(0)} m`, x + barW / 2, chartY1 - h - 8);
    });

    // current speed's own bar, overlaid distinctly
    {
      const d = stoppingDistance(currentSpeed);
      const h = (d / maxD) * (chartY1 - chartY0);
      const x = chartX0 + slotW * (allSpeeds.length + 0.7);
      ctx.fillStyle = c.good;
      ctx.beginPath();
      ctx.roundRect(x, chartY1 - h, barW, h, 6);
      ctx.fill();
      ctx.font = '700 11px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.textAlign = 'center';
      ctx.fillText('you', x + barW / 2, chartY1 + 18);
      ctx.fillText(`${d.toFixed(0)} m`, x + barW / 2, chartY1 - h - 8);
    }

    drawLabelPill(ctx, 'stopping distance ∝ speed²  —  not a straight staircase', W / 2, chartY0 - 20, { color: c.muted });
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
