import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * FirstLawGraphsScene — companion to blk-l13-s3.
 *
 * Process Statement: a flat velocity-time graph is the first law's
 * signature, whatever height it's flat AT — rest (height 0) and cruising
 * at any other constant speed are literally the same physics, not two
 * separate cases that happen to look similar. Beats 0-2 show that as a
 * side-by-side comparison (the original two staged examples); beat 3 (and
 * freeplay) collapses them into ONE pair of graphs driven by a single
 * velocity value, so "rest" stops being a special case and becomes just
 * "the slider happens to be at zero."
 */

const W = 900;
const H = 600;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', FORCE_COLORS.applied],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
  bad:      ['--sim-motion-bad', FORCE_COLORS.netBad],
};

const STEPS = [
  { caption: 'No net force → two possibilities: the object is at rest, or it moves with constant velocity.' },
  { caption: 'At rest: position-time graph flat, velocity always zero.' },
  { caption: 'Constant velocity: position rises steadily, velocity-time graph flat at a non-zero value.' },
  { caption: 'Net force zero means acceleration zero. Drag the slider — the graphs never change SHAPE, only where the flat line sits.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

const T_MAX = 6;
const V_RANGE = 20; // slider -20..20

export class FirstLawGraphsScene extends CanvasSimulation {
  static simId = 'first-law-graphs';
  static label = { en: 'Graphs when the net force is zero' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'When no net force acts, an object is either at rest or moving with constant velocity. For an object at ' +
    'rest, the position-time graph is a flat line and the velocity is always zero. For constant velocity, the ' +
    'position rises steadily and the velocity-time graph is a flat line at a non-zero value. A freeplay velocity ' +
    'slider, which can go negative for reversed direction, redraws both graphs live, showing that their shape ' +
    'never changes — only the height or slope does.';

  static CONTROLS = [
    { type: 'slider', id: 'velocity', label: 'Velocity (m/s):', min: -20, max: 20, step: 1, value: 8, suffix: '' },
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
    this._freeV = 8;
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
    if (id === 'velocity') {
      this._freeV = Math.round(Number(value));
      this._announce(`Velocity set to ${this._freeV} metres per second.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
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
    if (this.stepIndex < 3) {
      const restActive = this.stepIndex === 1;
      const moveActive = this.stepIndex === 2;
      this._drawGroup(ctx, 60, 'At rest', this.colors.good, restActive, 'rest');
      this._drawGroup(ctx, 500, 'Constant velocity', this.colors.wedge, moveActive, 'move');
    } else {
      this._drawFreeplay(ctx);
    }
    this._drawCaption(ctx, step.caption);
  }

  /** Beat 3 + freeplay: one big pair of graphs driven by `_freeV`, so
   *  "at rest" visibly becomes just the v=0 point on the same continuum. */
  _drawFreeplay(ctx) {
    const c = this.colors;
    const v = this._freeV;
    const color = v === 0 ? c.good : (v > 0 ? c.shape : c.bad);

    SimDraw.drawPanel(ctx, 130, 120, W - 260, 360, {
      bg: c.panelBg,
      radius: 12,
      stroke: color,
      lineWidth: 2.5,
    });

    ctx.fillStyle = c.label;
    ctx.font = '700 16px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(v === 0 ? 'v = 0 — this is "at rest"' : `v = ${v} m/s — constant velocity`, W / 2, 150);

    const ox = 220, oy = 300, pw = 460, ph = 110;
    this._miniAxes(ctx, ox, oy, pw, ph, 'Position', 'Time');
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const slope = (v / V_RANGE) * ph * 0.9;
    ctx.moveTo(ox, oy - ph * 0.05);
    ctx.lineTo(ox + pw, oy - ph * 0.05 - slope);
    ctx.stroke();

    const oy2 = oy + 170;
    this._miniAxes(ctx, ox, oy2, pw, ph, 'Velocity', 'Time');
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const vy = oy2 - ph / 2 - (v / V_RANGE) * ph * 0.42;
    ctx.beginPath();
    ctx.moveTo(ox, vy);
    ctx.lineTo(ox + pw, vy);
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.beginPath();
    ctx.moveTo(ox, oy2 - ph / 2);
    ctx.lineTo(ox + pw, oy2 - ph / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.muted;
    ctx.font = '600 10px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('v = 0', ox + pw + 6, oy2 - ph / 2 + 3);
  }

  _drawGroup(ctx, gx, title, color, active, kind) {
    const c = this.colors;
    const gw = 340;
    ctx.save();
    SimDraw.drawPanel(ctx, gx, 100, gw, 380, {
      bg: c.panelBg,
      radius: 10,
      stroke: active ? color : SimDraw.withAlpha(c.muted, 0.3),
      lineWidth: active ? 3 : 1.5,
    });
    ctx.fillStyle = c.label;
    ctx.font = '700 15px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(title, gx + gw / 2, 128);

    const innerX = gx + 30, innerY = 400, innerW = 280, innerH = 150;
    const ox = innerX, oy = innerY, pw = innerW, ph = innerH;

    this._miniAxes(ctx, ox, oy - 40, pw, ph * 0.5, 'Position', 'Time');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (kind === 'rest') {
      ctx.moveTo(ox, oy - 40 - ph * 0.25);
      ctx.lineTo(ox + pw, oy - 40 - ph * 0.25);
    } else {
      ctx.moveTo(ox, oy - 40);
      ctx.lineTo(ox + pw, oy - 40 - ph * 0.4);
    }
    ctx.stroke();

    this._miniAxes(ctx, ox, oy + 110, pw, ph * 0.5, 'Velocity', 'Time');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (kind === 'rest') {
      ctx.moveTo(ox, oy + 110);
      ctx.lineTo(ox + pw, oy + 110);
    } else {
      ctx.moveTo(ox, oy + 110 - ph * 0.25);
      ctx.lineTo(ox + pw, oy + 110 - ph * 0.25);
    }
    ctx.stroke();

    ctx.restore();
  }

  _miniAxes(ctx, ox, oy, pw, ph, yLabel, xLabel) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + pw, oy);
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy - ph);
    ctx.stroke();
    ctx.font = '600 10px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'left';
    ctx.fillText(yLabel, ox - 12, oy - ph - 2);
    ctx.fillText(xLabel, ox + pw - 26, oy + 12);
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 530, 660, 24, 'center');
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
