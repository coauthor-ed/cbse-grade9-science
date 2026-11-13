import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise } from 'simulations/base/SimMotion.js';
import { drawPerson, drawForceArrow, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * ShipVsCanoeScene — companion to blk-l15-s10.
 * A swimmer (fixed mass 70 kg) pushes off a target object with a fixed
 * force (300 N) for a fixed short push time (0.3 s). The target's mass
 * varies (canoe: 60 kg -> battleship: 40,000 kg). Both accelerations come
 * from the SAME force via a = F / m, so the swimmer's recoil is always the
 * same, while the target's visible recoil shrinks as its mass grows. Beats:
 * canoe case (both visibly recoil) -> battleship case (target barely moves)
 * -> side-by-side comparison -> the rule. Freeplay: a mass slider lets the
 * student sweep from canoe to battleship and watch the target's recoil
 * shrink continuously.
 */

const W = 900;
const H = 600;

const F = 300;       // N
const T_PUSH = 0.3;  // s
const M_SWIMMER = 70; // kg
const M_CANOE = 60;   // kg
const M_SHIP = 40000; // kg

const CENTER_X = 420;
const TRACK_Y = 340;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', '#38bdf8'],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', '#34d399'],
};

const STEPS = [
  { caption: 'Push off a light canoe (60 kg) with 300 N: both swimmer and canoe visibly shoot apart.', mTarget: M_CANOE },
  { caption: 'Push off a battleship (40,000 kg) with the exact same 300 N: the swimmer still recoils — the ship barely creeps.', mTarget: M_SHIP },
  { caption: 'Same force both times. Same swimmer recoil both times. Only the target’s reaction changes.', mTarget: M_SHIP },
  { caption: 'Drag the slider to change the target’s mass and watch its recoil shrink as mass grows — the force never does.', mTarget: M_SHIP },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

function recoilDisplacement(mass) {
  // constant force F applied for T_PUSH: a = F/m, v = a*T_PUSH, then coasts.
  // Use a fixed animation window to compute a visually meaningful travel distance.
  const a = F / mass;
  const v = a * T_PUSH;
  return v; // use final speed (m/s) as a proxy for "how much it visibly moves"
}

export class ShipVsCanoeScene extends CanvasSimulation {
  static simId = 'ship-vs-canoe';
  static label = { en: 'Equal force, unequal effect: canoe vs. battleship' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A swimmer pushes off a target object with the same 300 newton force each time. Against a light canoe, both ' +
    'the swimmer and the canoe visibly recoil apart. Against a massive battleship, the swimmer still recoils by ' +
    'the same amount, but the battleship barely moves at all, because its much larger mass gives it a much ' +
    'smaller acceleration for the identical force.';

  static CONTROLS = [
    { type: 'slider', id: 'mass', label: 'Target mass (kg):', min: 60, max: 40000, step: 100, value: 40000, suffix: '' },
    { type: 'button', id: 'push', label: 'Push Off' },
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

    this._targetMass = M_SHIP;
    this._recoilActive = false;
    this._elapsed = 0;
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
    this._elapsed = 0;
    this._recoilActive = this.stepIndex < 2;
    if (this.stepIndex < 3) this._targetMass = STEPS[this.stepIndex].mTarget;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'mass') {
      this._targetMass = Math.round(Number(value));
      this._announce(`Target mass set to ${this._targetMass} kilograms.`);
    } else if (id === 'push') {
      this._recoilActive = true;
      this._elapsed = 0;
      this._announce('Pushing off.');
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    if (this._recoilActive) this._elapsed += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[Math.min(this.stepIndex, 3)]);
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
    const progress = cruise(clamp01(this._elapsed / 1.4));

    const vSwimmer = recoilDisplacement(M_SWIMMER);
    const vTarget = recoilDisplacement(this._targetMass);
    // visual scale: swimmer's displacement is capped at 160px; target scales
    // relative to swimmer so the contrast is visible without a target that
    // literally never moves a pixel.
    const swimmerDx = 160 * progress;
    const targetDxRaw = (vTarget / vSwimmer) * 160;
    const targetDx = Math.max(2, Math.min(160, targetDxRaw)) * progress;

    // divider + labels
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.4);
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CENTER_X, 140);
    ctx.lineTo(CENTER_X, TRACK_Y + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // swimmer (moves left)
    const swX = CENTER_X - 40 - swimmerDx;
    drawPerson(ctx, swX, TRACK_Y + 8, {
      scale: 1.05,
      color: c.shape,
      facing: -1,
      armPose: progress < 0.5 ? 'push' : 'hang',
      legPose: 'brace',
    });
    ctx.fillStyle = c.label;
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('swimmer', swX, TRACK_Y - 95);

    // target (moves right) — size scales (loosely) with mass for visual cue
    const isCanoe = this._targetMass < 1000;
    const targetW = isCanoe ? 100 : 220;
    const targetH = isCanoe ? 34 : 70;
    const tgX = CENTER_X + 40 + targetDx;
    ctx.fillStyle = SimDraw.withAlpha(c.wedge, 0.25);
    ctx.strokeStyle = c.wedge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(tgX, TRACK_Y - targetH / 2, targetW, targetH, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.label;
    ctx.fillText(isCanoe ? 'canoe (60 kg)' : `target (${this._targetMass.toLocaleString()} kg)`, tgX + targetW / 2, TRACK_Y - targetH / 2 - 14);

    // force arrows at push instant — same length both directions, since it's
    // the same 300 N either way (the visual argument for "equal", not just a caption)
    if (progress < 0.5) {
      drawForceArrow(ctx, CENTER_X - 10, TRACK_Y + 40, { angle: Math.PI, length: 60, color: FORCE_COLORS.applied, label: '300 N' });
      drawForceArrow(ctx, CENTER_X + 10, TRACK_Y + 40, { angle: 0, length: 60, color: FORCE_COLORS.reaction, label: '300 N' });
    }

    // readout panel
    SimDraw.drawPanel(ctx, W / 2 - 280, 400, 560, 90, { bg: c.panelBg, radius: 12, stroke: c.good, lineWidth: 1.5 });
    ctx.font = '700 15px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.fillText(`swimmer: a = 300 ÷ 70 ≈ ${(300 / M_SWIMMER).toFixed(2)} m/s²`, W / 2, 428);
    ctx.fillStyle = c.wedge;
    ctx.fillText(`target: a = 300 ÷ ${this._targetMass.toLocaleString()} ≈ ${(300 / this._targetMass).toFixed(this._targetMass > 5000 ? 5 : 3)} m/s²`, W / 2, 456);
    ctx.fillStyle = c.good;
    ctx.font = '700 13px Inter, system-ui';
    ctx.fillText('same force, both sides — the ratio of accelerations equals the (inverse) ratio of masses', W / 2, 478);

    this._drawCaption(ctx, step.caption);
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 550, 660, 24, 'center');
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
    const prev = ctx.textAlign;
    ctx.textAlign = align;
    const words = text.split(' ');
    let line = '';
    let cy = y;
    const drawX = align === 'center' ? x + maxWidth / 2 : x;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, drawX, cy);
        line = word;
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, drawX, cy);
    ctx.textAlign = prev;
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
    this._announce(STEPS[Math.min(this.stepIndex, 3)].caption);
  }
}
