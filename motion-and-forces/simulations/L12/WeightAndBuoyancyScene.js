import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * WeightAndBuoyancyScene — companion to blk-l06-s2, iesc1-ch6 (gravitational-
 * force / buoyant-force). An object of adjustable mass and "spread" (how
 * much water its shape displaces) sits above or in a water tank. Weight
 * (down) and buoyant force (up) are drawn as arrows; the object settles at
 * the surface if buoyant force can match its weight, or sinks to the bottom
 * if not — same mass, reshaped from a compact ball to a wide hull, is what
 * flips the outcome (matches the lesson's "same steel, reshaped" recap).
 */

const W = 900;
const H = 380;

const CX = W / 2;
const WATER_Y = 190;
const TANK_LEFT = 220;
const TANK_RIGHT = W - 220;
const TANK_BOTTOM = H - 40;
const HOVER_GAP = 60;

const G = 9.8;
const BUOYANT_K = 22; // N of max buoyant force per unit of "spread"
const ANIM_DURATION = 1.2;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-buoyancy-muted', '#94a3b8'],
  water:    ['--sim-buoyancy-water', '#38bdf8'],
  object:   ['--sim-series-1', '#e2e8f0'],
  weight:   ['--sim-buoyancy-weight', '#f472b6'],
  buoyant:  ['--sim-series-2', '#34d399'],
};

const STEP_WEIGHT = 0;
const STEP_FORMULA = 1;
const STEP_WATER = 2;
const STEP_COMPARE = 3;
const STEP_RECAP = 4;
const STEP_FREEPLAY = 5;

const CONFIG_AT_STEP = {
  [STEP_WEIGHT]: { mass: 2, spread: 3, inWater: false },
  [STEP_FORMULA]: { mass: 2, spread: 3, inWater: false },
  [STEP_WATER]: { mass: 8, spread: 2, inWater: true },
  [STEP_COMPARE]: { mass: 8, spread: 2, inWater: true },
  [STEP_RECAP]: { mass: 8, spread: 6, inWater: true },
};

const STEPS = [
  { caption: "Weight is the Earth's downward pull on an object — a real force." },
  { caption: 'Weight = mass x g. A 2 kg object weighs about 19.6 N.' },
  { caption: 'In water, an upward buoyant force appears. A compact, dense ball: weight wins, it sinks.' },
  { caption: 'Weight (78.4 N) is bigger than the buoyant force (44 N) — so it sinks.' },
  { caption: 'Same steel, spread into a wide hull: now buoyant force can match the weight — it floats.' },
  { caption: 'Drag mass and spread and watch it settle — or sink.' },
];

const BEAT_STEP_MAP = [
  [{ idx: STEP_WEIGHT, dwellMs: null }],
  [{ idx: STEP_FORMULA, dwellMs: null }],
  [{ idx: STEP_WATER, dwellMs: null }],
  [{ idx: STEP_COMPARE, dwellMs: null }],
  [{ idx: STEP_RECAP, dwellMs: null }],
];

export class WeightAndBuoyancyScene extends CanvasSimulation {
  static simId = 'weight-and-buoyancy';
  static label = { en: 'Weight vs. Buoyant Force' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Weight versus buoyant force. An object hangs above a water tank showing its downward weight arrow, ' +
    'then is lowered into the water where an upward buoyant force arrow appears. A compact dense object ' +
    'sinks because its weight of seventy eight point four newtons exceeds its buoyant force of forty four ' +
    'newtons; the same mass reshaped into a wide hull floats because the buoyant force now matches the ' +
    'weight, then hands off to mass and spread sliders for free exploration.';

  static CONTROLS = [
    { type: 'button', id: 'explore', label: 'Try it yourself →' },
    { type: 'slider', id: 'mass', label: 'Mass (kg):', min: 1, max: 10, step: 1, value: 4 },
    { type: 'slider', id: 'spread', label: 'Spread (shape):', min: 1, max: 10, step: 1, value: 4 },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_WEIGHT;
    this._stepEnterTime = 0;
    this._from = { mass: 2, spread: 3, inWater: false };
    this._to = { mass: 2, spread: 3, inWater: false };
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this.freeMass = 4;
    this.freeSpread = 4;
    this._objY = WATER_Y - HOVER_GAP;
    this._liveRegion = null;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce("Weight versus buoyant force. Weight is the Earth's downward pull on an object.");
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  isControlHidden(id) {
    if (id === 'explore') return this.stepIndex !== STEP_RECAP;
    if (id === 'mass' || id === 'spread') return this.stepIndex !== STEP_FREEPLAY;
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
    this._from = this._currentTarget();
    this._to = CONFIG_AT_STEP[i] ?? this._from;
    this.stepIndex = i;
    this._stepEnterTime = 0;
    this._announce(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'explore') {
      this._jumpToStep(STEP_FREEPLAY);
    } else if (id === 'mass') {
      this.freeMass = Math.round(Math.min(10, Math.max(1, Number(value))));
    } else if (id === 'spread') {
      this.freeSpread = Math.round(Math.min(10, Math.max(1, Number(value))));
    }
  }

  _currentTarget() {
    if (this.stepIndex === STEP_FREEPLAY) return { mass: this.freeMass, spread: this.freeSpread, inWater: true };
    const target = CONFIG_AT_STEP[this.stepIndex];
    if (!target) return this._from;
    const p = cruise(clamp01(this._stepEnterTime / ANIM_DURATION));
    return {
      mass: lerp(this._from.mass, target.mass, p),
      spread: lerp(this._from.spread, target.spread, p),
      inWater: p < 0.5 ? this._from.inWater : target.inWater,
    };
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
    this._drawScene(ctx, dt);
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

  _drawInitialFrame(ctx) { this._drawScene(ctx, 0); }

  _drawScene(ctx, dt) {
    const c = this.colors;
    const { mass, spread, inWater } = this._currentTarget();
    const objH = 44;
    const objW = 50 + spread * 8;
    const weight = mass * G;
    const buoyantMax = spread * BUOYANT_K;
    const floats = buoyantMax >= weight;
    const submergedFraction = clamp01(weight / Math.max(buoyantMax, 0.001));

    let targetObjY;
    if (!inWater) {
      targetObjY = WATER_Y - HOVER_GAP;
    } else if (floats) {
      targetObjY = WATER_Y - objH / 2 + submergedFraction * (objH / 2);
    } else {
      targetObjY = TANK_BOTTOM - objH / 2;
    }
    this._objY += (targetObjY - this._objY) * Math.min(1, (dt || 0.016) * 4);

    // Tank walls
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
    ctx.lineWidth = 2;
    ctx.strokeRect(TANK_LEFT, WATER_Y, TANK_RIGHT - TANK_LEFT, TANK_BOTTOM - WATER_Y);
    ctx.restore();

    // Water
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.water, 0.28);
    ctx.fillRect(TANK_LEFT, WATER_Y, TANK_RIGHT - TANK_LEFT, TANK_BOTTOM - WATER_Y);
    ctx.strokeStyle = SimDraw.withAlpha(c.water, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TANK_LEFT, WATER_Y);
    ctx.lineTo(TANK_RIGHT, WATER_Y);
    ctx.stroke();
    ctx.restore();

    // Object (ellipse — width reflects "spread")
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(CX, this._objY, objW / 2, objH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.object;
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(c.object, -0.3);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Weight arrow (always shown)
    SimDraw.drawArrow(ctx, CX - 40, this._objY, CX - 40, this._objY + 60, { color: c.weight, lineWidth: 4 });
    SimDraw.drawLabel(ctx, `weight ${weight.toFixed(1)} N`, CX - 40, this._objY + 78, { bg: c.panelBg, color: c.weight });

    // Buoyant arrow (only in water)
    if (inWater) {
      // Floating: buoyant force settles exactly at equilibrium with weight.
      // Sinking: it caps at the shape's maximum, which weight has exceeded.
      const displayBuoyant = floats ? weight : buoyantMax;
      SimDraw.drawArrow(ctx, CX + 40, this._objY, CX + 40, this._objY - 60, { color: c.buoyant, lineWidth: 4 });
      SimDraw.drawLabel(ctx, `buoyant ${displayBuoyant.toFixed(1)} N`, CX + 40, this._objY - 78, { bg: c.panelBg, color: c.buoyant });
    }

    // Outcome label
    if (inWater) {
      ctx.save();
      ctx.font = '700 14px Inter, system-ui';
      ctx.fillStyle = floats ? c.buoyant : c.weight;
      ctx.textAlign = 'center';
      ctx.fillText(floats ? 'floats' : 'sinks', CX, WATER_Y - 18);
      ctx.restore();
    }

    this._drawCaption(ctx, STEPS[this.stepIndex]?.caption ?? '');
  }

  _drawCaption(ctx, caption) {
    ctx.save();
    ctx.font = '600 15px Inter, system-ui';
    ctx.fillStyle = this.colors.label;
    ctx.textAlign = 'center';
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.fillText(caption, W / 2, H - 16);
    ctx.restore();
  }
}
