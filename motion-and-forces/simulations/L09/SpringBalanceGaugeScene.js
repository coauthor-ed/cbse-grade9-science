import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * SpringBalanceGaugeScene — companion to blk-l03-s2, iesc1-ch6
 * (force-measurement-units / spring-balance-use). A vertical spring balance:
 * pulling the hook stretches the coil and moves a pointer up a newton-marked
 * scale. Walks through a gentle pull (2 N) then a firm pull (7 N) to show the
 * reading tracks the force, then hands off to a slider for free pulling.
 */

const W = 900;
const H = 380;

const MOUNT_X = W / 2 - 140;
const MOUNT_Y = 40;
const MAX_FORCE = 10;
const MAX_STRETCH_PX = 170;
const HOOK_BASE_Y = MOUNT_Y + 60;

const SCALE_X = W / 2 + 90;
const SCALE_TOP_Y = MOUNT_Y + 10;
const SCALE_BOTTOM_Y = MOUNT_Y + 60 + MAX_STRETCH_PX + 20;

const ANIM_DURATION = 1.1;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-spring-muted', '#94a3b8'],
  coil:    ['--sim-series-1', '#38bdf8'],
  hook:    ['--sim-series-2', '#e2e8f0'],
  pointer: ['--sim-series-3', '#f472b6'],
  scale:   ['--sim-series-4', '#94a3b8'],
};

const STEP_IDLE = 0;
const STEP_GENTLE = 1;
const STEP_FIRM = 2;
const STEP_UNIT = 3;
const STEP_RECAP = 4;
const STEP_FREEPLAY = 5;

const FORCE_AT_STEP = {
  [STEP_IDLE]: 0,
  [STEP_GENTLE]: 2,
  [STEP_FIRM]: 7,
  [STEP_UNIT]: 7,
  [STEP_RECAP]: 7,
};

const STEPS = [
  { caption: 'At rest, the spring is unstretched. Reading: 0 N.' },
  { caption: 'A gentle pull — a small stretch, a small reading: 2 N.' },
  { caption: 'A firm pull — a bigger stretch, a bigger reading: 7 N.' },
  { caption: 'That number is measured in newton (N).' },
  { caption: 'The scale turns "how hard you pulled" into a number you can compare.' },
  { caption: 'Drag the slider to pull with different forces and watch the pointer.' },
];

const BEAT_STEP_MAP = [
  [{ idx: STEP_IDLE, dwellMs: null }],
  [{ idx: STEP_GENTLE, dwellMs: 1300 }, { idx: STEP_FIRM, dwellMs: null }],
  [{ idx: STEP_UNIT, dwellMs: null }],
  [{ idx: STEP_RECAP, dwellMs: null }],
];

function stretchFor(force) { return (Math.min(force, MAX_FORCE) / MAX_FORCE) * MAX_STRETCH_PX; }

export class SpringBalanceGaugeScene extends CanvasSimulation {
  static simId = 'spring-balance-gauge';
  static label = { en: 'Spring Balance Gauge' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Spring balance gauge. A vertical spring balance is mounted from a fixed bracket; pulling its hook ' +
    'stretches the coil and moves a pointer up a scale marked in newtons, showing a gentle pull reading ' +
    'two newtons and a firm pull reading seven newtons, then hands off to a slider for free pulling.';

  static CONTROLS = [
    { type: 'button', id: 'explore', label: 'Try it yourself →' },
    { type: 'slider', id: 'pull', label: 'Pull force (N):', min: 0, max: 10, step: 1, value: 5 },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_IDLE;
    this._stepEnterTime = 0;
    this._fromForce = 0;
    this._toForce = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this.freeForce = 5;
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
      this.freeForce = Math.max(0, Math.min(MAX_FORCE, this.freeForce + dir));
      this._announce(`Pull force ${this.freeForce} newtons.`);
      this.requestUiUpdate?.();
      return true;
    });
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce('Spring balance gauge. At rest, the spring is unstretched. Reading: zero newtons.');
  }

  destroy() {
    if (this._unbindArrows) this._unbindArrows();
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  isControlHidden(id) {
    if (id === 'explore') return this.stepIndex !== STEP_RECAP;
    if (id === 'pull') return this.stepIndex !== STEP_FREEPLAY;
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
    this._fromForce = this._currentForce();
    this._toForce = FORCE_AT_STEP[i] ?? this._fromForce;
    this.stepIndex = i;
    this._stepEnterTime = 0;
    this._announce(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (this._canvas) this._canvas.focus({ preventScroll: true });
    if (id === 'explore') {
      this._jumpToStep(STEP_FREEPLAY);
    } else if (id === 'pull') {
      this.freeForce = Math.round(Math.min(MAX_FORCE, Math.max(0, Number(value))));
      this._announce(`Pull force ${this.freeForce} newtons.`);
    }
  }

  _currentForce() {
    if (this.stepIndex === STEP_FREEPLAY) return this.freeForce;
    const target = FORCE_AT_STEP[this.stepIndex];
    if (target == null) return this._fromForce;
    const p = cruise(clamp01(this._stepEnterTime / ANIM_DURATION));
    return lerp(this._fromForce, target, p);
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
    const force = this._currentForce();
    const stretch = stretchFor(force);
    const hookY = HOOK_BASE_Y + stretch;

    // Mount bracket
    ctx.save();
    SimDraw.drawPanel(ctx, MOUNT_X - 30, MOUNT_Y - 16, 60, 20, { bg: c.panelBg, radius: 4, stroke: c.muted, lineWidth: 1 });
    ctx.restore();

    // Coil (zigzag)
    ctx.save();
    ctx.strokeStyle = c.coil;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(MOUNT_X, MOUNT_Y + 4);
    const coils = 8;
    const segH = (hookY - (MOUNT_Y + 4)) / coils;
    for (let i = 0; i < coils; i++) {
      const y0 = MOUNT_Y + 4 + i * segH;
      const y1 = y0 + segH;
      const midX = MOUNT_X + (i % 2 === 0 ? 22 : -22);
      ctx.lineTo(midX, (y0 + y1) / 2);
      ctx.lineTo(MOUNT_X, y1);
    }
    ctx.stroke();
    ctx.restore();

    // Hook + label
    ctx.save();
    ctx.beginPath();
    ctx.arc(MOUNT_X, hookY + 10, 10, 0, Math.PI * 2);
    ctx.strokeStyle = c.hook;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Pull-force arrow
    if (force > 0.3) {
      ctx.save();
      SimDraw.drawArrow(ctx, MOUNT_X, hookY + 55, MOUNT_X, hookY + 25, { color: c.pointer, lineWidth: 3 });
      ctx.restore();
      SimDraw.drawLabel(ctx, 'pull', MOUNT_X, hookY + 80, { bg: c.panelBg, color: c.pointer });
    }

    // Scale
    ctx.save();
    ctx.strokeStyle = c.scale;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(SCALE_X, SCALE_TOP_Y);
    ctx.lineTo(SCALE_X, SCALE_BOTTOM_Y);
    ctx.stroke();
    ctx.font = '500 11px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'left';
    for (let n = 0; n <= MAX_FORCE; n += 2) {
      const y = SCALE_TOP_Y + (n / MAX_FORCE) * (SCALE_BOTTOM_Y - SCALE_TOP_Y - 20);
      ctx.beginPath();
      ctx.moveTo(SCALE_X - 6, y);
      ctx.lineTo(SCALE_X + 6, y);
      ctx.stroke();
      ctx.fillText(`${n} N`, SCALE_X + 12, y + 4);
    }
    ctx.restore();

    // Pointer
    const pointerY = SCALE_TOP_Y + (force / MAX_FORCE) * (SCALE_BOTTOM_Y - SCALE_TOP_Y - 20);
    ctx.save();
    ctx.strokeStyle = c.pointer;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(SCALE_X - 26, pointerY);
    ctx.lineTo(SCALE_X - 2, pointerY);
    ctx.stroke();
    ctx.restore();
    SimDraw.drawLabel(ctx, `${force.toFixed(1)} N`, SCALE_X - 60, pointerY, { bg: c.panelBg, color: c.pointer });

    if (this.stepIndex >= STEP_UNIT) {
      ctx.save();
      ctx.font = '700 13px Inter, system-ui';
      ctx.fillStyle = c.coil;
      ctx.textAlign = 'center';
      ctx.globalAlpha = this.stepIndex === STEP_UNIT ? clamp01(this._stepEnterTime / 0.5) : 1;
      ctx.fillText('unit: newton (N)', SCALE_X + 40, SCALE_TOP_Y - 12);
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
    ctx.fillText(caption, W / 2, H - 18);
    ctx.restore();
  }
}
