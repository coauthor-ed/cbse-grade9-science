import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawCart, drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS, STROKE } from '../shared/PhysicsSceneKit.js';

/**
 * FMACartScene — companion to blk-l14-s1 / blk-l14-s3 (Activities 6.3-6.4).
 *
 * Process Statement: acceleration is not "how hard you pull" in isolation —
 * it is force divided by mass, and the cart, pulley and hanging cup of
 * coins are a real apparatus for making that division visible: swap the
 * force (add coins) or the mass (heavier cart) and the SAME apparatus gives
 * a different, measurable acceleration.
 *
 * Mechanics are unchanged from the original scene (force/mass sliders +
 * Release button drive a = F / m in freeplay; beats 0-2 walk through the
 * fixed demo apparatus first) — this is a visual-quality pass: the cart is
 * now the shared kit's `drawCart` (proper spoked wheels that actually turn
 * with displacement), the pulley/cup got two-tone shading, the pull is now
 * a real `drawForceArrow` scaled to the live force value so "a bigger
 * number on the slider" and "a visibly longer arrow" are the same fact,
 * the thread is an actual connected path from cart to pulley to cup rather
 * than three disjoint pieces, and — since the thread is inextensible — the
 * cup now falls by the same distance the cart advances (capped at
 * MAX_CUP_FALL once it reaches the floor) instead of hanging fixed in
 * place while the cart slides around underneath it.
 */

const W = 900;
const H = 600;

const TABLE_Y = 360;
const CART_X0 = 170;
const PULLEY_X = 660;
const PULLEY_R = 17;
const CUP_Y = TABLE_Y + 40;
const CUP_H = 46;
const MAX_CUP_FALL = 70; // px the cup can drop before it reaches the floor
const FLOOR_Y = CUP_Y + CUP_H + MAX_CUP_FALL;
const RUN_SEC = 1.8;
const MAX_TRAVEL = 320; // px — cart stops here regardless of a (about to reach the pulley)
// px per (m/s^2 * s^2) in x = 1/2 * a * ACCEL_PX_SCALE * t^2 — tuned so the
// default demo values (F=10 N, m=2 kg, a=5) cover a clearly-visible but not
// track-maxing distance by RUN_SEC, so faster/slower combinations still have
// room to visibly race ahead of or fall behind that reference run.
const ACCEL_PX_SCALE = 30;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  cart:     ['--sim-motion-cart', FORCE_COLORS.applied],
  wedge:    ['--sim-motion-wedge', FORCE_COLORS.tension],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'A cart on a table is pulled by a thread over a pulley. A cup of coins supplies the force.' },
  { caption: 'Add more coins: the pull grows. A larger force pulls the same cart.' },
  { caption: 'Release it. With a bigger force the cart accelerates faster.' },
  { caption: 'Drag the sliders to set force and mass, then press Release. Acceleration = force ÷ mass.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class FMACartScene extends CanvasSimulation {
  static simId = 'f-ma-cart';
  static label = { en: 'Force, mass, and acceleration on a cart' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A cart on a table is pulled by a visible thread running from the cart to a pulley at the table edge and ' +
    'down to a hanging cup of coins, its wheels turning as it accelerates. As the cart moves, the cup falls by ' +
    'the same distance, until it reaches the floor. Adding coins increases the force, shown both as a growing ' +
    'arrow and as a visibly taller stack of coins in the cup, and the cart accelerates faster. In free play, ' +
    'sliders set the force and the cart mass, and pressing Release shows the acceleration equal to the force ' +
    'divided by the mass.';

  static CONTROLS = [
    { type: 'slider', id: 'force', label: 'Force (N):', min: 4, max: 20, step: 2, value: 10, suffix: '' },
    { type: 'slider', id: 'mass', label: 'Cart mass (kg):', min: 1, max: 10, step: 1, value: 2, suffix: '' },
    { type: 'button', id: 'release', label: 'Release' },
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

    this.force = 10;
    this.mass = 2;
    this._freeplayRunning = false;
    this._freeplayElapsed = 0;
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
    this._freeplayRunning = false;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (this._canvas) this._canvas.focus({ preventScroll: true });
    if (id === 'force') {
      this.force = Math.round(Number(value));
      this._announce(`Force set to ${this.force} newtons.`);
    } else if (id === 'mass') {
      this.mass = Math.round(Number(value));
      this._announce(`Cart mass set to ${this.mass} kilograms.`);
    } else if (id === 'release') {
      this._freeplayRunning = true;
      this._freeplayElapsed = 0;
      this._announce('Releasing the cart.');
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    const isFreeplay = this.stepIndex === 3;
    return !isFreeplay;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    if (this._freeplayRunning) this._freeplayElapsed += dt;
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

  /** Real kinematics — x = ½at² from rest, using the SAME a = F ÷ m the
   *  readout pill prints — capped at MAX_TRAVEL (about to reach the
   *  pulley). This used to always cover a fixed 320px over a fixed 1.8s
   *  regardless of a, via an eased eyeballed curve: a real bug, since it
   *  meant the cart looked identical whether a was 0.4 or 20 — the exact
   *  opposite of what this apparatus exists to show. Now a bigger a
   *  visibly reaches the end sooner, and a smaller a visibly crawls,
   *  because the on-screen distance in a given time is the actual product
   *  of the slider values, not a decoration matching them in a label only. */
  _cartDx() {
    let t = null;
    if (this.stepIndex === 2) t = this._stepEnterTime;
    else if (this.stepIndex === 3 && this._freeplayRunning) t = this._freeplayElapsed;
    if (t == null) return 0;
    const a = this._accel();
    const raw = 0.5 * a * ACCEL_PX_SCALE * t * t;
    return Math.min(raw, MAX_TRAVEL);
  }

  _effectiveForce() {
    if (this.stepIndex === 1) return 6 + 10 * clamp01(this._stepEnterTime / 1.6);
    if (this.stepIndex === 2) return 16;
    return this.force;
  }

  _accel() {
    return this._effectiveForce() / this.mass;
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const F = this._effectiveForce();
    const a = this._accel();
    const dx = this._cartDx();
    const cartX = CART_X0 + dx;
    this._wheelAngle = dx / 11;

    // The thread is inextensible: every bit the cart advances toward the
    // pulley is exactly a bit less thread on the horizontal run, which has
    // to reappear as more thread on the vertical run — so the cup falls by
    // the same distance dx the cart travels, not a fixed y with a cart
    // sliding around underneath it. It can't fall past the floor, so the
    // fall is capped at MAX_CUP_FALL; the cart's own dx is untouched by
    // that cap (the thread would actually go slack and the cart would
    // coast from there — a real detail, but the cart continuing without
    // that extra state is the acceptable simplification here).
    const cupFall = Math.min(dx, MAX_CUP_FALL);
    const cupY = CUP_Y + cupFall;

    // table
    ctx.fillStyle = SimDraw.withAlpha(c.muted, 0.14);
    ctx.fillRect(70, TABLE_Y - 8, PULLEY_X - 80, 16);
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(70, TABLE_Y);
    ctx.lineTo(PULLEY_X, TABLE_Y);
    ctx.stroke();

    // floor — only really meaningful once the cup reaches it, but drawn
    // throughout so the landing has visible context instead of the cup
    // just stopping in mid-air for no on-screen reason.
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PULLEY_X - 50, FLOOR_Y);
    ctx.lineTo(PULLEY_X + 50, FLOOR_Y);
    ctx.stroke();

    // cart (shared kit — proper spoked wheels, actually turning with dx)
    const cartCoupleX = cartX + 130; // right edge of the cart body — where the thread ties on
    drawCart(ctx, cartX + 65, TABLE_Y, {
      color: c.cart,
      width: 130,
      height: 60,
      wheelAngle: this._wheelAngle,
    });
    ctx.fillStyle = c.label;
    ctx.font = '600 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('cart', cartX + 65, TABLE_Y - 88);

    // thread — drawn BEFORE the pulley/cup so their opaque shapes sit on
    // top of the joins and read as "the thread passes behind/through
    // them", not as three disconnected pieces. Two straight segments meet
    // right at the pulley's own position: horizontal at coupling height
    // from the cart to the pulley axle, then straight down from the axle
    // to the cup — the pulley disk (drawn next) covers the corner where
    // they meet, which is what actually sells "the thread bends here."
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cartCoupleX, TABLE_Y);
    ctx.lineTo(PULLEY_X, TABLE_Y);
    ctx.lineTo(PULLEY_X, cupY);
    ctx.stroke();

    // pull force arrow — length tracks the live force value, same grammar
    // as every other scene in this chapter. Sits well clear of the cart's
    // own body (which extends up to roughly TABLE_Y-133) so it reads as a
    // separate callout, not an overlay on top of the cart.
    drawForceArrow(ctx, cartX + 15, TABLE_Y - 155, {
      angle: 0,
      magnitude: F,
      pxPerUnit: 5,
      minLen: 24,
      maxLen: 130,
      color: c.wedge,
      label: `${Math.round(F)} N`,
    });

    // pulley — disk drawn on top of the thread join, then axle spokes
    ctx.fillStyle = SimDraw.withAlpha(c.wedge, 0.15);
    ctx.beginPath();
    ctx.arc(PULLEY_X, TABLE_Y, PULLEY_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.wedge;
    ctx.lineWidth = STROKE.boundary;
    ctx.beginPath();
    ctx.arc(PULLEY_X, TABLE_Y, PULLEY_R, 0, Math.PI * 2);
    ctx.stroke();
    // pulley axle + a couple of spoke ticks so it reads as a wheel, not a ring
    for (let i = 0; i < 2; i++) {
      const ang = this._wheelAngle + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(PULLEY_X - Math.cos(ang) * 12, TABLE_Y - Math.sin(ang) * 12);
      ctx.lineTo(PULLEY_X + Math.cos(ang) * 12, TABLE_Y + Math.sin(ang) * 12);
      ctx.stroke();
    }

    // cup of coins, two-tone shaded — the coins themselves are drawn AFTER
    // the cup (see below) so a taller stack can visibly rise above the rim
    ctx.fillStyle = c.wedge;
    ctx.beginPath();
    ctx.roundRect(PULLEY_X - 22, cupY, 44, CUP_H, 8);
    ctx.fill();
    ctx.fillStyle = SimDraw.withAlpha(SimDraw.shade(c.wedge, -0.25), 0.9);
    ctx.beginPath();
    ctx.roundRect(PULLEY_X - 22, cupY + 30, 44, 16, { tl: 0, tr: 0, br: 8, bl: 8 });
    ctx.fill();

    // coins — count grows with the live force, so "add more coins" (beat 1)
    // and dragging the freeplay force slider both show an actual pile
    // getting taller, not just a bigger number.
    this._drawCoins(ctx, PULLEY_X, cupY + 40, F);

    // acceleration readout when running / freeplay
    if (this.stepIndex === 2 || this.stepIndex === 3) {
      const label = this.stepIndex === 3 && !this._freeplayRunning
        ? `a = F ÷ m = ${Math.round(F)} ÷ ${this.mass} = ${a.toFixed(1)} m s⁻² (press Release)`
        : `a = ${a.toFixed(1)} m s⁻²`;
      drawLabelPill(ctx, label, W / 2, 495, { color: c.good, font: '700 15px Inter, system-ui', height: 30 });
    }

    this._drawCaption(ctx, step.caption);
  }

  /** A short stack of overlapping coin-disks whose height grows with the
   *  live force value, so "add more coins" (beat 1's animated force ramp,
   *  and the freeplay force slider) is something the eye can see change —
   *  a taller pile, not just a bigger number next to the pull arrow. A
   *  large enough force piles coins up past the cup's own rim on purpose,
   *  the same "visibly overflowing" cue a real overloaded cup would give. */
  _drawCoins(ctx, cx, baseY, F) {
    const c = this.colors;
    const count = Math.max(1, Math.min(10, Math.round(F / 2)));
    const shade = SimDraw.shade(c.good, -0.25);
    const highlight = SimDraw.shade(c.good, 0.3);
    for (let i = 0; i < count; i++) {
      const y = baseY - 8 - i * 6;
      ctx.fillStyle = i === count - 1 ? highlight : shade;
      ctx.beginPath();
      ctx.ellipse(cx, y, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = SimDraw.withAlpha('#0a0f1e', 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    // Below the cup (which sits at TABLE_Y+40..+86 = 400..446) and below the
    // acceleration readout pill (~480..510) — a caption at y=430 used to sit
    // directly on top of the coin cup and obscure the sliders' own caption
    // text ("...mass, then press Release. Acceleration = force / mass"), a
    // real bug a live screenshot caught. This clears both with margin.
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

