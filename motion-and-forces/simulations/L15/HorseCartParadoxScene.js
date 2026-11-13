import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawForceArrow, drawLabelPill, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * HorseCartParadoxScene — companion simulation for q-l15-s11 (the classic
 * "if the cart pulls the horse back just as hard as the horse pulls the
 * cart forward, how does anything move?" paradox).
 *
 * The resolution needs THREE forces, not two: horse-on-cart / cart-on-horse
 * (a third-law pair, always equal, acts on two different objects, never
 * cancels) PLUS horse-hooves-on-ground / ground-on-horse (a second,
 * independent third-law pair). Whether the system accelerates is decided by
 * the NET force on the horse alone: the ground's forward push minus the
 * cart's backward pull. Beats: show the horse/cart pair (doesn't cancel,
 * nothing moves yet) -> add the ground/hoof pair -> sum forces on the horse
 * only -> the rule. Freeplay: a "ground grip" slider (icy -> firm) changes
 * how much forward force the ground can supply, directly showing that low
 * grip stalls the system even though the horse-cart force pair is
 * unchanged — motion depends on the second law applied to the horse, not
 * on the third-law pair by itself.
 */

const W = 900;
const H = 600;

const TRACK_Y = 380;
const CART_PULL_BACK = 220; // N, fixed resistance from the cart (rolling + inertia)
const MAX_TRACTION = 320;   // N, ground's forward push at 100% grip

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', '#38bdf8'],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', '#34d399'],
  bad:     ['--sim-motion-bad', '#f87171'],
};

const STEPS = [
  { caption: 'Horse pulls cart forward; cart pulls horse back, equally hard. A third-law pair — on two different objects, so it never cancels.' },
  { caption: 'A second, independent pair: the horse’s hooves push the ground backward, and the ground pushes the horse forward.' },
  { caption: 'What moves the system is the NET force on the horse alone: the ground’s forward push minus the cart’s backward pull.' },
  { caption: 'Drag the ground-grip slider: less grip means less forward push — the horse-cart pair never changes, but the system can still stall.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class HorseCartParadoxScene extends CanvasSimulation {
  static simId = 'horse-cart-paradox';
  static label = { en: 'The horse-and-cart paradox, resolved' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A horse pulls a cart. The horse-cart force pair is always equal and opposite and never cancels, since it ' +
    'acts on two different objects. A second pair, between the horse’s hooves and the ground, supplies the ' +
    'forward push. The net force on the horse alone — ground push minus cart pull — decides whether the system ' +
    'accelerates. A ground-grip slider shows the system stalling when grip is too low, even though the horse-cart ' +
    'pair itself never changes.';

  static CONTROLS = [
    { type: 'slider', id: 'grip', label: 'Ground grip:', min: 0, max: 100, step: 5, value: 80, suffix: '%' },
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
    this._grip = 80; // %
    this._systemX = 0; // px offset, freeplay motion
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
    this._systemX = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'grip') {
      this._grip = Math.round(Number(value));
      this._systemX = 0;
      this._stepEnterTime = 0;
      this._announce(`Ground grip set to ${this._grip} percent.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _netForce() {
    const forward = (this._grip / 100) * MAX_TRACTION;
    return forward - CART_PULL_BACK;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    const net = this._netForce();
    if (this.stepIndex === 3 && net > 0) {
      const speedPxPerSec = Math.min(140, net * 0.6);
      this._systemX = Math.min(220, this._systemX + speedPxPerSec * dt);
    }
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
    const offset = this.stepIndex === 3 ? this._systemX : 0;

    // ground — texture tracks the grip slider in freeplay, so "icy" and
    // "firm" are something the student can SEE, not just a percentage
    const groundKind = this.stepIndex === 3 ? (this._grip < 35 ? 'ice' : this._grip < 70 ? 'solid' : 'rough') : 'solid';
    drawGround(ctx, 60, W - 60, TRACK_Y, c, { kind: groundKind });

    // The system walks in the +x direction (offset grows to the right), so
    // the horse — which is doing the pulling — belongs AHEAD, at the larger
    // x. The cart trails behind it, joined by the rope. (Previously the
    // cart sat at the larger x, ahead of the horse, which visually read as
    // the cart pulling the horse — the opposite of the physics.)
    const cartX = 220 + offset;
    const horseX = cartX + 170;

    // cart — a wheeled box, trailing behind
    ctx.fillStyle = SimDraw.withAlpha(c.wedge, 0.22);
    ctx.strokeStyle = c.wedge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cartX, TRACK_Y - 50, 120, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.wedge;
    ctx.beginPath();
    ctx.arc(cartX + 24, TRACK_Y + 8, 12, 0, Math.PI * 2);
    ctx.arc(cartX + 96, TRACK_Y + 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.label;
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('cart', cartX + 60, TRACK_Y - 60);

    // horse — a four-legged animal silhouette (body + neck + head + tail),
    // deliberately NOT a wheeled box, so it can't be mistaken for a second
    // cart. Facing +x, the direction of travel, out in front of the cart.
    this._drawHorse(ctx, horseX, TRACK_Y, c.shape, c.label);

    // rope — cart's front edge to the horse's rear leg
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cartX + 120, TRACK_Y - 30);
    ctx.lineTo(horseX - 6, TRACK_Y - 30);
    ctx.stroke();

    // step 0+: horse-cart third-law pair — one arrow at each object it
    // actually acts on, both along the rope's own line
    drawForceArrow(ctx, cartX + 60, TRACK_Y - 90, { angle: 0, length: 70, color: c.good, label: 'horse pulls cart forward' });
    drawForceArrow(ctx, horseX + 40, TRACK_Y - 158, { angle: Math.PI, length: 70, color: c.bad, label: 'cart pulls horse back' });

    // step 1+: horse-ground third-law pair
    if (this.stepIndex >= 1) {
      drawForceArrow(ctx, horseX + 20, TRACK_Y + 40, { angle: Math.PI, length: 40, color: c.muted, label: 'hoof pushes ground back' });
      drawForceArrow(ctx, horseX - 5, TRACK_Y + 90, { angle: 0, length: 60, color: c.wedge, label: 'ground pushes horse forward' });
    }

    // step 2+: net force readout
    if (this.stepIndex >= 2) {
      const net = this._netForce();
      const netLabel = this.stepIndex === 3
        ? `net force on horse ≈ ${net.toFixed(0)} N (grip ${this._grip}%) — ${net > 0 ? 'system accelerates' : 'stuck, no motion'}`
        : `net force on horse = ground push − cart pull`;
      drawLabelPill(ctx, netLabel, W / 2, 108, {
        color: net > 0 ? c.good : c.bad,
        font: '700 14px Inter, system-ui',
        bg: SimDraw.withAlpha(c.panelBg, 0.9),
        height: 34,
      });
    }

    this._drawCaption(ctx, step.caption);
  }

  /** A four-legged animal silhouette — body, neck, head, ears, tail, legs —
   *  deliberately distinct from the cart's wheeled box so the two can never
   *  be confused at a glance. `groundY` is the horse's own foot line;
   *  `x` anchors the body's rear (the rope attaches just behind it). */
  _drawHorse(ctx, x, groundY, color, labelColor) {
    const shade = SimDraw.shade(color, -0.28);
    const bodyRX = 46, bodyRY = 20;
    const legLen = 34;
    const bodyCX = x + bodyRX + 4;
    const bodyCY = groundY - legLen - bodyRY;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9;
    // four legs, evenly spaced under the body
    const legXs = [bodyCX - bodyRX * 0.7, bodyCX - bodyRX * 0.2, bodyCX + bodyRX * 0.25, bodyCX + bodyRX * 0.75];
    for (const lx of legXs) {
      ctx.beginPath();
      ctx.moveTo(lx, bodyCY + bodyRY * 0.6);
      ctx.lineTo(lx, groundY);
      ctx.stroke();
    }
    ctx.restore();

    // tail — a short curved stroke off the rear
    ctx.save();
    ctx.strokeStyle = shade;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyCX - bodyRX, bodyCY - 4);
    ctx.quadraticCurveTo(bodyCX - bodyRX - 20, bodyCY + 10, bodyCX - bodyRX - 14, bodyCY + 32);
    ctx.stroke();
    ctx.restore();

    // body — flat ellipse, two-tone shade on the lower half
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(bodyCX, bodyCY, bodyRX, bodyRY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SimDraw.withAlpha(shade, 0.9);
    ctx.beginPath();
    ctx.ellipse(bodyCX, bodyCY + bodyRY * 0.4, bodyRX, bodyRY * 0.6, 0, 0, Math.PI);
    ctx.fill();
    ctx.restore();

    // neck — a thick rounded stroke rising forward from the front of the
    // body, ending at the head, so the silhouette reads "animal" rather
    // than "box on legs"
    const neckBaseX = bodyCX + bodyRX * 0.75, neckBaseY = bodyCY - bodyRY * 0.3;
    const headX = neckBaseX + 34, headY = bodyCY - bodyRY - 30;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(neckBaseX, neckBaseY);
    ctx.lineTo(headX, headY);
    ctx.stroke();
    ctx.restore();

    // head — small circle with an ear and a forward-pointing snout, the
    // detail that most separates "horse" from "any other blob"
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(headX, headY, 12, 0, Math.PI * 2);
    ctx.fill();
    // snout
    ctx.beginPath();
    ctx.roundRect(headX + 6, headY - 4, 20, 10, 5);
    ctx.fill();
    // ear
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY - 10);
    ctx.lineTo(headX + 2, headY - 24);
    ctx.lineTo(headX + 8, headY - 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // mane — a few short strokes along the top of the neck
    ctx.save();
    ctx.strokeStyle = shade;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const maneSteps = 4;
    for (let i = 1; i <= maneSteps; i++) {
      const t = i / (maneSteps + 1);
      const mx = neckBaseX + (headX - neckBaseX) * t;
      const my = neckBaseY + (headY - neckBaseY) * t;
      ctx.beginPath();
      ctx.moveTo(mx, my - 9);
      ctx.lineTo(mx, my - 1);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = labelColor;
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('horse', headX + 28, headY + 4);
    ctx.textAlign = 'center';
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 540, 660, 24, 'center');
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
    this._announce(STEPS[this.stepIndex].caption);
  }
}
