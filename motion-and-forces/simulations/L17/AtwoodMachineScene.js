import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawPulley, drawMassBlock, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * AtwoodMachineScene — companion to blk-l17-s7 (and reused by q-l17-s8,
 * q-l17-s9 as a question companion).
 *
 * Process Statement: two masses hanging from opposite ends of a string
 * over a smooth pulley move in opposite directions but share one
 * acceleration magnitude. Two separate free-body diagrams, combined by
 * adding the equations to eliminate tension, is the only way to solve it —
 * unlike the previous lesson's same-direction system. The final beat is a
 * freeplay pair of mass sliders showing a and T recompute live for any
 * combination.
 */

const W = 900;
const H = 600;

const PULLEY_X = 450, PULLEY_Y = 110, PULLEY_R = 34;
const LEFT_X = PULLEY_X - 140, RIGHT_X = PULLEY_X + 140;
const G = 9.8;
const TRAVEL_PX = 40;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  mass1:   ['--sim-motion-shape', FORCE_COLORS.applied],
  mass2:   ['--sim-motion-wedge', FORCE_COLORS.reaction],
  weight:  ['--sim-force-gravity', FORCE_COLORS.gravity],
  tension: ['--sim-force-tension', FORCE_COLORS.tension],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'Two separate free-body diagrams — the blocks move opposite ways, not the same way.', m1: 5, m2: 3 },
  { caption: 'Block 1 (5 kg, moving down): m₁g − T = m₁a.', m1: 5, m2: 3 },
  { caption: 'Block 2 (3 kg, moving up): T − m₂g = m₂a. Both share the same a.', m1: 5, m2: 3 },
  { caption: 'Add the two equations — T cancels: a = (m₁ − m₂)g ÷ (m₁ + m₂).', m1: 5, m2: 3 },
  { caption: 'Substitute back for T. Drag the sliders to try other masses.', m1: 5, m2: 3 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

export class AtwoodMachineScene extends CanvasSimulation {
  static simId = 'atwood-machine';
  static label = { en: 'Two masses over a pulley — the Atwood machine' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Two blocks hang from opposite ends of a string over a smooth pulley. The heavier block descends while the ' +
    'lighter one rises at the same rate. Separate free-body diagrams for each block build two equations that are ' +
    'added together to eliminate tension and find the shared acceleration, then substituted back for the tension ' +
    'itself. A freeplay pair of mass sliders on the final beat recomputes the acceleration and tension live.';

  static CONTROLS = [
    { type: 'slider', id: 'm1', label: 'Block 1 mass (kg):', min: 1, max: 9, step: 1, value: 5, suffix: 'kg' },
    { type: 'slider', id: 'm2', label: 'Block 2 mass (kg):', min: 1, max: 9, step: 1, value: 3, suffix: 'kg' },
    { type: 'button', id: 'replay', label: 'Replay' },
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
    this._elapsed = 0;
    this._m1 = 5;
    this._m2 = 3;
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
    this._m1 = STEPS[this.stepIndex].m1;
    this._m2 = STEPS[this.stepIndex].m2;
    this._elapsed = 0;
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'm1') { this._m1 = Number(value); this._elapsed = 0; }
    else if (id === 'm2') { this._m2 = Number(value); this._elapsed = 0; }
    else if (id === 'replay') { this._elapsed = 0; }
    const a = this._accel();
    this._announce(`Block 1: ${this._m1} kilograms. Block 2: ${this._m2} kilograms. Acceleration: ${a.toFixed(2)} metres per second squared.`);
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 4;
  }

  _accel() {
    return (Math.abs(this._m1 - this._m2) * G) / (this._m1 + this._m2);
  }

  _tension() {
    // T = heavier·(g − a), which is algebraically identical to lighter·(g + a) —
    // either free-body diagram gives the same tension, by construction.
    const a = this._accel();
    const heavier = Math.max(this._m1, this._m2);
    return heavier * (G - a);
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._elapsed += dt;
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
    const m1Heavier = this._m1 >= this._m2;
    const a = this._accel();

    // Stylized travel offset for visual motion (not to real-world timescale) —
    // eases in, then freezes once fully traveled rather than looping or jumping.
    const tCap = Math.min(this._elapsed, 1.6);
    const frac = clamp01((tCap * tCap) / 2.5);
    const drop = frac * TRAVEL_PX;

    const y1 = PULLEY_Y + 90 + (m1Heavier ? drop : -drop);
    const y2 = PULLEY_Y + 90 + (m1Heavier ? -drop : drop);

    // string: left down to mass1, arc over pulley, right down to mass2
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LEFT_X, y1);
    ctx.lineTo(LEFT_X, PULLEY_Y);
    ctx.arc(PULLEY_X, PULLEY_Y, PULLEY_R + 6, Math.PI, 0, false);
    ctx.lineTo(RIGHT_X, y2);
    ctx.stroke();
    ctx.restore();

    drawPulley(ctx, PULLEY_X, PULLEY_Y, PULLEY_R, c);

    const b1 = drawMassBlock(ctx, LEFT_X, y1, { width: 70, height: 70, color: c.mass1, label: `${this._m1} kg` });
    const b2 = drawMassBlock(ctx, RIGHT_X, y2, { width: 70, height: 70, color: c.mass2, label: `${this._m2} kg` });

    if (this.stepIndex >= 1) {
      const alpha = clamp01(this._stepEnterTime / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (this.stepIndex !== 2) {
        drawForceArrow(ctx, LEFT_X, b1.bottom, { angle: Math.PI / 2, length: 66, color: c.weight, label: 'm₁g' });
        drawForceArrow(ctx, LEFT_X, b1.top, { angle: -Math.PI / 2, length: 66, color: c.tension, label: 'T' });
      }
      if (this.stepIndex !== 1) {
        drawForceArrow(ctx, RIGHT_X, b2.bottom, { angle: Math.PI / 2, length: 66, color: c.weight, label: 'm₂g' });
        drawForceArrow(ctx, RIGHT_X, b2.top, { angle: -Math.PI / 2, length: 66, color: c.tension, label: 'T' });
      }
      ctx.restore();
    }

    if (this.stepIndex >= 3) {
      SimDraw.drawPanel(ctx, W / 2 - 210, 420, 420, this.stepIndex === 4 ? 90 : 46, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText(`a = |m₁ − m₂| × g ÷ (m₁ + m₂) = ${a.toFixed(2)} m/s²`, W / 2, 448);
      if (this.stepIndex === 4) {
        ctx.fillStyle = c.label;
        ctx.font = '600 13px Inter, system-ui';
        ctx.fillText(`T = ${this._tension().toFixed(2)} N`, W / 2, 472);
        ctx.fillText(m1Heavier ? 'block 1 descends, block 2 rises' : 'block 2 descends, block 1 rises', W / 2, 494);
      }
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
