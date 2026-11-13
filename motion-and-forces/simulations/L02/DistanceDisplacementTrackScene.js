import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * DistanceDisplacementTrackScene — companion to blk-l02-s2, iesc1-ch4
 * (distance-and-displacement / displacement-definition / time-interval-in-
 * motion). Reuses the chapter's own O -> B (t=4s) -> A (t=10s) -> B (t=16s)
 * worked numbers (the specific figures are the source's own canonical
 * example, not its prose or diagram — see docs/copyright-and-sourcing.md).
 * Animates the athlete along the track while a distance bar accumulates
 * (odometer-style, counts every metre including the return leg) and a
 * displacement arrow tracks only the straight-line change from O to the
 * athlete's current spot — the two visibly split apart the moment she turns
 * back. Beats drive the walk-through; a time slider hands off free scrubbing.
 */

const W = 900;
const H = 360;

const AXIS_Y = 210;
const AXIS_LEFT_X = 70;
const AXIS_RIGHT_X = W - 70;
const MIN_VAL = 0;
const MAX_VAL = 120;
const PX_PER_M = (AXIS_RIGHT_X - AXIS_LEFT_X) / (MAX_VAL - MIN_VAL);

const BAR_Y = 70;
const BAR_MAX_DIST = 160;

const ANIM_DURATION = 1.6; // seconds

const COLOR_TOKEN_MAP = {
  bgDeep:      ['--sim-bg-deep', '#0a0f1e'],
  panelBg:     ['--sim-bg-surface', '#111827'],
  label:       ['--sim-label', '#e2e8f0'],
  muted:       ['--sim-track-muted', '#94a3b8'],
  axis:        ['--sim-track-axis', '#94a3b8'],
  distance:    ['--sim-track-distance', '#fbbf24'],
  displacement:['--sim-series-1', '#38bdf8'],
  athlete:     ['--sim-series-2', '#f472b6'],
};

function xOf(val) { return AXIS_LEFT_X + (val - MIN_VAL) * PX_PER_M; }

function posAt(t) {
  const tc = Math.min(t, 16);
  if (tc <= 4) return 10 * tc;
  if (tc <= 10) return 40 + 10 * (tc - 4);
  return 100 - 10 * (tc - 10);
}

function distAt(t) {
  const tc = Math.min(t, 16);
  if (tc <= 4) return 10 * tc;
  if (tc <= 10) return 40 + 10 * (tc - 4);
  return 100 + 10 * (tc - 10);
}

const STEP_START = 0;
const STEP_TO_B = 1;
const STEP_TO_A = 2;
const STEP_BACK_B = 3;
const STEP_RECAP = 4;
const STEP_FREEPLAY = 5;

// [fromT, toT] each animated step interpolates across, in simulation time (s).
const SEGMENT = {
  [STEP_TO_B]: [0, 4],
  [STEP_TO_A]: [4, 10],
  [STEP_BACK_B]: [10, 16],
};

const STEPS = [
  { caption: 'The athlete starts at O, at t = 0 s.' },
  { caption: 'By t = 4 s she reaches B — distance and displacement still agree.' },
  { caption: 'By t = 10 s she reaches A — still moving only forward.' },
  { caption: 'She turns back — by t = 16 s she is at B again. Watch the two numbers split.' },
  { caption: 'Total distance travelled: 160 m. Displacement: 40 m. They are not the same thing.' },
  { caption: 'Drag the slider to scrub through time and watch both readouts update.' },
];

const BEAT_STEP_MAP = [
  [{ idx: STEP_START, dwellMs: null }],
  [{ idx: STEP_TO_B, dwellMs: null }],
  [{ idx: STEP_TO_A, dwellMs: null }],
  [{ idx: STEP_BACK_B, dwellMs: null }],
  [{ idx: STEP_RECAP, dwellMs: null }],
];

export class DistanceDisplacementTrackScene extends CanvasSimulation {
  static simId = 'distance-displacement-track';
  static label = { en: 'Distance vs. Displacement on a Track' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Distance versus displacement on a track. An athlete runs from origin O out to point B, onward to ' +
    'point A, then turns back to point B, while a distance bar accumulates every metre covered and a ' +
    'displacement arrow tracks only the straight-line change in position, ending at total distance one ' +
    'hundred sixty metres versus displacement forty metres, then hands off to a time slider for free scrubbing.';

  static CONTROLS = [
    { type: 'button', id: 'explore', label: 'Try it yourself →' },
    { type: 'slider', id: 'time', label: 'Time (s):', min: 0, max: 16, step: 1, value: 8 },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_START;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this.freeT = 8;
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
      this.freeT = Math.max(0, Math.min(16, this.freeT + dir));
      this._announceState();
      this.requestUiUpdate?.();
      return true;
    });
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce('Distance versus displacement on a track. The athlete starts at O, at time t equals zero seconds.');
  }

  destroy() {
    if (this._unbindArrows) this._unbindArrows();
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  isControlHidden(id) {
    if (id === 'explore') return this.stepIndex !== STEP_RECAP;
    if (id === 'time') return this.stepIndex !== STEP_FREEPLAY;
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
    this._announceState(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (this._canvas) this._canvas.focus({ preventScroll: true });
    if (id === 'explore') {
      this._jumpToStep(STEP_FREEPLAY);
    } else if (id === 'time') {
      this.freeT = Math.round(Math.min(16, Math.max(0, Number(value))));
      this._announceState();
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

  _announceState(text) {
    const t = this._currentT();
    this._announce(text || `t = ${t.toFixed(0)} s. Distance ${distAt(t).toFixed(0)} m, displacement ${posAt(Math.min(t, 16)).toFixed(0)} m.`);
  }

  _currentT() {
    const seg = SEGMENT[this.stepIndex];
    if (seg) {
      const [from, to] = seg;
      const p = cruise(clamp01(this._stepEnterTime / ANIM_DURATION));
      return lerp(from, to, p);
    }
    if (this.stepIndex === STEP_START) return 0;
    if (this.stepIndex === STEP_RECAP) return 16;
    return this.freeT;
  }

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
    const t = Math.min(this._currentT(), 16);
    const dist = distAt(t);
    const pos = posAt(t);

    // Distance bar (odometer-style, top)
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(AXIS_LEFT_X, BAR_Y);
    ctx.lineTo(AXIS_RIGHT_X, BAR_Y);
    ctx.stroke();
    ctx.strokeStyle = c.distance;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(AXIS_LEFT_X, BAR_Y);
    ctx.lineTo(AXIS_LEFT_X + (dist / BAR_MAX_DIST) * (AXIS_RIGHT_X - AXIS_LEFT_X), BAR_Y);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = c.distance;
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Total distance travelled: ${dist.toFixed(0)} m`, AXIS_LEFT_X, BAR_Y - 14);
    ctx.restore();

    // Axis + ticks
    ctx.save();
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(AXIS_LEFT_X, AXIS_Y);
    ctx.lineTo(AXIS_RIGHT_X, AXIS_Y);
    ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '500 11px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1.5;
    for (let v = 0; v <= 120; v += 20) {
      const x = xOf(v);
      ctx.beginPath();
      ctx.moveTo(x, AXIS_Y - 6);
      ctx.lineTo(x, AXIS_Y + 6);
      ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.7);
      ctx.stroke();
      ctx.fillText(`${v}`, x, AXIS_Y + 24);
    }
    ctx.restore();

    // O, B, A landmark labels
    ctx.save();
    ctx.font = '700 12px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.fillText('O', xOf(0), AXIS_Y + 42);
    ctx.fillText('B', xOf(40), AXIS_Y + 42);
    ctx.fillText('A', xOf(100), AXIS_Y + 42);
    ctx.restore();

    // Displacement arrow (O -> current position)
    if (pos > 0.5) {
      ctx.save();
      SimDraw.drawArrow(ctx, xOf(0), AXIS_Y - 30, xOf(pos), AXIS_Y - 30, { color: c.displacement, lineWidth: 3 });
      ctx.restore();
    }
    SimDraw.drawLabel(ctx, `Displacement: ${pos.toFixed(0)} m`, xOf(pos / 2 || 0.01), AXIS_Y - 34, { bg: c.panelBg, color: c.displacement });

    // Athlete marker
    const ax = xOf(pos);
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, AXIS_Y, 9, 0, Math.PI * 2);
    ctx.fillStyle = c.athlete;
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(c.athlete, -0.3);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Time readout
    ctx.save();
    ctx.font = '700 14px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'right';
    ctx.fillText(`t = ${t.toFixed(0)} s`, AXIS_RIGHT_X, AXIS_Y + 70);
    ctx.restore();

    // Recap summary panel
    if (this.stepIndex === STEP_RECAP || this.stepIndex === STEP_FREEPLAY) {
      const alpha = this.stepIndex === STEP_RECAP ? clamp01(this._stepEnterTime / 0.5) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      SimDraw.drawPanel(ctx, W / 2 - 220, AXIS_Y + 90, 440, 46, { bg: c.panelBg, radius: 10, stroke: c.axis, lineWidth: 1 });
      ctx.font = '600 13px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = c.distance;
      ctx.fillText(`distance ${dist.toFixed(0)} m`, W / 2 - 90, AXIS_Y + 118);
      ctx.fillStyle = c.muted;
      ctx.fillText('≠', W / 2, AXIS_Y + 118);
      ctx.fillStyle = c.displacement;
      ctx.fillText(`displacement ${pos.toFixed(0)} m`, W / 2 + 100, AXIS_Y + 118);
      ctx.restore();
    }

    this._drawCaption(ctx, STEPS[this.stepIndex].caption);
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
