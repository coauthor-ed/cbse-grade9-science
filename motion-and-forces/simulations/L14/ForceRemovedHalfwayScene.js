import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawCart, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * ForceRemovedHalfwayScene — companion to blk-l14-s10.
 *
 * Process Statement: F = ma governs a cart's acceleration only for as long
 * as a net force actually acts on it — the instant that force is removed,
 * a drops to exactly zero (not gradually), and the cart's velocity freezes
 * at whatever value it had reached. The second law hands off cleanly to the
 * first the moment F hits zero.
 *
 * A cart accelerates under a constant push for `pushDuration` seconds (now
 * a freeplay slider, not a fixed 2 s), then the push is removed and it
 * coasts at whatever velocity it had reached. A synced velocity-time graph
 * shows the kink at exactly that instant — dragging the slider moves the
 * kink and changes the coasting velocity together, letting the student
 * confirm "wherever the force stops is wherever the velocity locks in" for
 * themselves rather than being told it once.
 */

const W = 900;
const H = 600;

const TRACK_Y = 300;
const START_X = 140;

const A = 3; // m/s^2 while force acts
const T_COAST_EXTRA = 2; // s shown coasting after force removed
const MAX_PUSH = 4;
const T_TOTAL_MAX = MAX_PUSH + T_COAST_EXTRA;

const GX0 = 500, GY0 = 420, GX1 = 820, GY1 = 140;
const V_MAX = 15;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  cart:    ['--sim-motion-cart', FORCE_COLORS.applied],
  wedge:   ['--sim-motion-wedge', FORCE_COLORS.tension],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'A steady force pushes the cart. Net force present → the second law: F = ma governs it.', pushDuration: 2 },
  { caption: 'At t = 2 s the push stops completely. Net force drops to exactly zero.', pushDuration: 2 },
  { caption: 'a = F ÷ m = 0 ÷ m = 0 — instantly, not gradually. The cart keeps its velocity.', pushDuration: 2 },
  { caption: 'Drag the slider to change how long the push lasts — the coasting speed always matches wherever it stopped.', pushDuration: 2 },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class ForceRemovedHalfwayScene extends CanvasSimulation {
  static simId = 'force-removed-halfway';
  static label = { en: 'What happens when the push stops?' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A cart with visibly turning wheels accelerates under a steady push shown as a force arrow, then the push ' +
    'stops and the cart coasts at whatever velocity it had reached. A synced velocity-time graph shows a rising ' +
    'line while the force acts and a flat line once it is removed, with a kink exactly at the removal instant. ' +
    'A freeplay slider lets the student change how long the push lasts and see the coasting speed change to match.';

  static CONTROLS = [
    { type: 'slider', id: 'pushDuration', label: 'Push lasts (s):', min: 1, max: 4, step: 0.5, value: 2, suffix: 's' },
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
    this._freePushDuration = 2;
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
    this._elapsed = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'pushDuration') {
      this._freePushDuration = Number(value);
      this._elapsed = 0;
      this._announce(`Push duration set to ${this._freePushDuration.toFixed(1)} seconds.`);
    } else if (id === 'replay') {
      this._elapsed = 0;
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tPush() {
    return this.stepIndex === 3 ? this._freePushDuration : STEPS[this.stepIndex].pushDuration;
  }

  _vEnd() {
    return A * this._tPush();
  }

  _tTotal() {
    return this._tPush() + T_COAST_EXTRA;
  }

  _velocityAt(t) {
    const tPush = this._tPush();
    if (t <= tPush) return A * t;
    return this._vEnd();
  }

  _positionAt(t) {
    const tPush = this._tPush();
    if (t <= tPush) return 0.5 * A * t * t;
    return 0.5 * A * tPush * tPush + this._vEnd() * (t - tPush);
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

  _tx(t) { return GX0 + (t * (GX1 - GX0)) / T_TOTAL_MAX; }
  _vy(v) { return GY0 - (v * (GY0 - GY1)) / V_MAX; }

  _drawScene(ctx, step) {
    const c = this.colors;
    const tPush = this._tPush();
    const tTotal = this._tTotal();

    // cart track (left half of canvas)
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(START_X - 20, TRACK_Y);
    ctx.lineTo(430, TRACK_Y);
    ctx.stroke();

    const tCap = Math.min(tTotal, this._elapsed);
    const totalTravel = this._positionAt(tTotal);
    const pxPerM = totalTravel > 0 ? (430 - START_X) / totalTravel : 0;
    const dxNow = this._positionAt(tCap) * pxPerM;
    const cartX = START_X + dxNow;
    const pushing = tCap < tPush - 0.001;
    this._wheelAngle = dxNow / 11;

    drawCart(ctx, cartX + 35, TRACK_Y, {
      scale: 1,
      color: c.cart,
      width: 70,
      height: 44,
      wheelAngle: this._wheelAngle,
    });

    if (pushing) {
      drawForceArrow(ctx, cartX - 46, TRACK_Y - 22, {
        angle: 0,
        magnitude: A,
        pxPerUnit: 16,
        minLen: 40,
        maxLen: 70,
        color: c.wedge,
        label: 'F',
      });
    } else {
      drawLabelPill(ctx, 'no force — coasting', cartX + 35, TRACK_Y - 66, { color: c.good });
    }

    // v-t graph (right half), visible from beat 1 onward
    if (this.stepIndex >= 1) {
      this._drawAxes(ctx);
      ctx.save();
      ctx.strokeStyle = c.good;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const gCap = Math.min(tTotal, this.stepIndex === 1 ? Math.min(tPush + 0.3, this._elapsed) : this._elapsed);
      for (let i = 0; i <= 60; i++) {
        const t = (tTotal * i) / 60;
        if (t > gCap) break;
        const v = this._velocityAt(t);
        const x = this._tx(t), y = this._vy(v);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      if (this.stepIndex >= 2) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
        ctx.beginPath();
        ctx.moveTo(this._tx(tPush), this._vy(this._vEnd()));
        ctx.lineTo(this._tx(tPush), GY0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = c.muted;
        ctx.font = '600 12px Inter, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('force removed', this._tx(tPush), GY0 + 20);
      }
    }

    drawLabelPill(ctx, pushing ? 'F = ma applies' : 'F = 0 → a = 0 (first law now)', W / 2, 80, { color: c.wedge, font: '700 15px Inter, system-ui', height: 30 });

    this._drawCaption(ctx, step.caption);
  }

  _drawAxes(ctx) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX1 + 15, GY0);
    ctx.moveTo(GX0, GY0);
    ctx.lineTo(GX0, GY1 - 15);
    ctx.stroke();
    ctx.font = '600 11px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.fillText('t (s)', (GX0 + GX1) / 2, GY0 + 26);
    ctx.save();
    ctx.translate(GX0 - 30, (GY0 + GY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('v (m/s)', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 330, 500, 660, 24, 'center');
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
