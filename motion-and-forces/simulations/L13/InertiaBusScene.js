import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPerson, drawVehicle, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * InertiaBusScene — companion to blk-l13-s4.
 *
 * Process Statement: a rider's body keeps its OLD velocity for a moment
 * after the bus underneath them changes velocity — the lurch isn't a
 * mysterious force grabbing the rider, it's what happens when NO force acts
 * on their body at that instant, while a real force (brakes/engine) DOES
 * act on the bus. Grip/friction between their feet and the floor is the
 * (small) force that eventually drags their body back to the bus's new
 * velocity — which is also why the lurch is temporary, not permanent.
 *
 * Driven by an actual two-velocity model, not a canned offset: `busV` (the
 * bus's own velocity, set by the current phase/freeplay action) and
 * `personV` (the rider's body velocity, which only ever changes by "catching
 * up" toward `busV` at a finite rate — modelling the small grip/friction
 * force at their feet). The lean angle and forward/back drift are both
 * driven by `personV - busV`, the one relative-velocity quantity that is
 * the entire mechanism — not two separately-tuned animations that could
 * drift out of sync with each other.
 */

const W = 900;
const H = 600;

// Two-tier composition: a small context strip up top (skyline + road + bus,
// establishes "this whole scene is moving") and a large interior cutaway
// below (the passenger, drawn big enough that her lean/arm pose actually
// reads) — cramming a full-height figure inside a small bus icon reads as
// broken (head above the roofline) rather than as "inside the bus."
const CONTEXT_ROAD_Y = 210;
const BUS_X = 450;
const INTERIOR_Y0 = 260;
const INTERIOR_Y1 = 520;
const FLOOR_Y = 498;
const PASS_X0 = 470; // passenger's resting position on the interior floor
const RAIL_X = 620;

const CATCH_UP_RATE = 2.2; // how fast personV chases busV (grip/friction)
const STEADY_V = 16;
const BRAKE_V = 3;
const ACCEL_V = 26;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  sky:      ['--sim-accent', '#0d1b33'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  road:     ['--sim-track', '#1e293b'],
  building: ['--sim-series-1', '#1e293b'],
  bus:      ['--sim-series-2', FORCE_COLORS.applied],
  person:   ['--sim-motion-person', '#fbbf24'],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
  bad:      ['--sim-motion-bad', FORCE_COLORS.netBad],
  friction: ['--sim-series-3', FORCE_COLORS.friction],
};

const STEPS = [
  { caption: 'A passenger stands inside a moving bus, moving at the same steady velocity as the bus.', phase: 'steady' },
  { caption: 'The bus brakes. The passenger’s body keeps its old velocity for a moment — she lurches forward.', phase: 'brake' },
  { caption: 'Now the bus speeds up. The passenger’s body lags behind — she lurches backward.', phase: 'accel' },
  { caption: 'Try it yourself: brake, accelerate, or hold steady, and watch the lurch each time.', phase: 'freeplay' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

// building silhouette skyline, repeating every SKY_PERIOD px
const SKY_PERIOD = 260;
const BUILDINGS = [
  { dx: 10, w: 60, h: 90 }, { dx: 90, w: 40, h: 60 }, { dx: 150, w: 70, h: 130 }, { dx: 230, w: 20, h: 40 },
];

export class InertiaBusScene extends CanvasSimulation {
  static simId = 'inertia-bus';
  static label = { en: 'Inertia: the lurch in a bus' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A passenger stands in a moving bus, shown alongside a scrolling street to make its speed visible. When the ' +
    'bus brakes, the passenger leans and drifts forward because her body keeps its old velocity. When the bus ' +
    'speeds up, she leans backward. Grip between her feet and the floor is a small force that gradually pulls ' +
    'her back to the bus’s new velocity — that is why the lean is temporary. A freeplay mode lets the student ' +
    'trigger braking, accelerating, or steady motion at will.';

  static CONTROLS = [
    { type: 'button', id: 'brake', label: 'Brake' },
    { type: 'button', id: 'accel', label: 'Speed Up' },
    { type: 'button', id: 'steady', label: 'Hold Steady' },
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

    this._busV = STEADY_V;
    this._personV = STEADY_V;
    this._busAccel = 0;
    this._activePhase = 'steady';
    this._phaseTimer = 0;
    this._bgScroll = 0;
    this._wheelAngle = 0;
    this._personDrift = 0; // px, integrated relative displacement
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
    this._phaseTimer = 0;
    if (this.stepIndex < 3) this._triggerPhase(STEPS[this.stepIndex].phase);
    this._announceStep();
    this.requestUiUpdate?.();
  }

  _triggerPhase(phase) {
    this._phaseTimer = 0;
    if (phase === 'brake') this._busAccel = -10;
    else if (phase === 'accel') this._busAccel = 10;
    else this._busAccel = 0;
    this._activePhase = phase;
  }

  onControlChange(id) {
    if (id === 'brake') this._triggerPhase('brake');
    else if (id === 'accel') this._triggerPhase('accel');
    else if (id === 'steady') this._triggerPhase('steady');
    this._announce(id === 'brake' ? 'Braking.' : id === 'accel' ? 'Speeding up.' : 'Holding steady.');
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._phaseTimer += dt;
    this._tickBeatChain(dt);
    this._simulate(dt);
    ctx.clearRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _simulate(dt) {
    // bus velocity ramps toward its phase target under _busAccel, clamped
    const target = this._activePhase === 'brake' ? BRAKE_V : this._activePhase === 'accel' ? ACCEL_V : STEADY_V;
    if (this._busAccel !== 0) {
      this._busV += this._busAccel * dt;
      const overshoot = this._busAccel > 0 ? this._busV >= target : this._busV <= target;
      if (overshoot) { this._busV = target; this._busAccel = 0; }
    }
    // passenger's body only changes velocity via grip/friction "catching up"
    // toward the bus's CURRENT velocity — a first-order lag, deliberately
    // overshoot-free (Kurzgesagt doc §3.3's exponential catch-up device).
    this._personV += (this._busV - this._personV) * CATCH_UP_RATE * dt;

    const relV = this._personV - this._busV;
    this._personDrift = clampAbs(this._personDrift + relV * dt * 40, 70);
    // drift relaxes back toward 0 as relV settles, so the passenger visibly
    // resettles into her resting spot once velocities match again
    this._personDrift += (0 - this._personDrift) * 0.6 * dt;

    this._bgScroll = (this._bgScroll + this._busV * dt * 6) % SKY_PERIOD;
    this._wheelAngle += (this._busV * dt) / 16;
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
    ctx.fillStyle = c.bgDeep;
    ctx.fillRect(0, 0, W, H);

    this._drawContextStrip(ctx);
    this._drawInterior(ctx);

    this._drawReadout(ctx);
    this._drawPhaseLabel(ctx);
    this._drawCaption(ctx, step.caption);
  }

  /** The small top strip: skyline + road + bus, establishing that the whole
   *  scene is in motion (speed is legible from how fast the buildings and
   *  road markings scroll, not just from a number). */
  _drawContextStrip(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.building, 0.75);
    const baseY = CONTEXT_ROAD_Y - 4;
    for (let pass = -1; pass <= Math.ceil(W / SKY_PERIOD) + 1; pass++) {
      const originX = pass * SKY_PERIOD - this._bgScroll;
      for (const b of BUILDINGS) {
        ctx.fillRect(originX + b.dx, baseY - b.h * 0.55, b.w, b.h * 0.55);
      }
    }
    ctx.fillStyle = c.road;
    ctx.fillRect(0, CONTEXT_ROAD_Y, W, 26);
    ctx.strokeStyle = SimDraw.withAlpha('#facc15', 0.75);
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = -this._bgScroll;
    ctx.beginPath();
    ctx.moveTo(0, CONTEXT_ROAD_Y + 13);
    ctx.lineTo(W, CONTEXT_ROAD_Y + 13);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawVehicle(ctx, BUS_X, CONTEXT_ROAD_Y, {
      type: 'bus',
      scale: 0.62,
      color: c.bus,
      wheelAngle: this._wheelAngle,
      speedLines: this._busV > 20,
      brakeLight: this._activePhase === 'brake',
    });
  }

  /** The large "looking inside the bus" cutaway — a floor line and a grab
   *  rail for scale/context, with the passenger drawn big enough that her
   *  lean and arm pose are the dominant, legible thing on screen. */
  _drawInterior(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.panelBg, 0.5);
    ctx.beginPath();
    ctx.roundRect(70, INTERIOR_Y0, W - 140, INTERIOR_Y1 - INTERIOR_Y0, 16);
    ctx.fill();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.3);
    ctx.lineWidth = 2;
    ctx.stroke();

    // floor
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(90, FLOOR_Y);
    ctx.lineTo(W - 90, FLOOR_Y);
    ctx.stroke();

    // grab rail (fixed to the bus, doesn't lean — a visible "this is bolted
    // to the vehicle" reference the passenger's own lean is measured against)
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.7);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(RAIL_X, INTERIOR_Y0 + 20);
    ctx.lineTo(RAIL_X, FLOOR_Y);
    ctx.stroke();
    drawLabelPill(ctx, 'rail — fixed to the bus', RAIL_X, INTERIOR_Y0 + 8, { color: c.muted, font: '600 11px Inter, system-ui' });

    const relV = this._personV - this._busV;
    const lean = clampAbs(relV * 0.075, 0.55); // radians

    const px = PASS_X0 + this._personDrift;
    drawPerson(ctx, px, FLOOR_Y, {
      scale: 2.15,
      color: c.person,
      lean,
      armPose: Math.abs(lean) > 0.1 ? 'out-balance' : 'hang',
    });

    // grip/friction force at the feet — small, real, and the thing that
    // eventually restores common velocity; explicitly NOT what causes the
    // lurch itself.
    if (Math.abs(relV) > 0.6) {
      const dir = relV > 0 ? -1 : 1;
      drawForceArrow(ctx, px, FLOOR_Y - 6, {
        angle: dir > 0 ? 0 : Math.PI,
        magnitude: Math.min(8, Math.abs(relV)),
        pxPerUnit: 7,
        color: c.friction,
        label: 'grip (friction)',
      });
    }
    ctx.restore();
  }

  _drawReadout(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.font = '700 13px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = c.muted;
    ctx.fillText(`bus velocity: ${this._busV.toFixed(1)}`, 24, 40);
    ctx.fillStyle = c.person;
    ctx.fillText(`passenger velocity: ${this._personV.toFixed(1)}`, 24, 60);
    const relV = this._personV - this._busV;
    ctx.fillStyle = Math.abs(relV) > 0.6 ? c.bad : c.good;
    ctx.fillText(`relative to bus: ${relV >= 0 ? '+' : ''}${relV.toFixed(1)} ${Math.abs(relV) > 0.6 ? '(lurching)' : '(settled)'}`, 24, 80);
    ctx.restore();
  }

  _drawPhaseLabel(ctx) {
    const c = this.colors;
    const label = this._activePhase === 'brake' ? 'braking — net force on the BUS, none on the passenger'
      : this._activePhase === 'accel' ? 'speeding up — net force on the BUS, none on the passenger'
      : 'steady speed — no net force on anyone';
    drawLabelPill(ctx, label, W / 2, 40, { color: c.muted, bg: SimDraw.withAlpha(c.panelBg, 0.85) });
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

function clampAbs(v, max) {
  return Math.max(-max, Math.min(max, v));
}
