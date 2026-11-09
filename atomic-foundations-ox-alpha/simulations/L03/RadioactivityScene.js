// RadioactivityScene - companion to blk-l03-s1, "Could an Atom Have Parts?".
//   b0  dalton    Dalton's solid atom: tap to hit it, and it stays whole
//   b1  crack     a uranium atom gives out particles by itself: nothing touches it
//   b2  takeaway  open it: something smaller was inside
// A plain ball on purpose: at this point in history nobody knew what was inside.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, pill, clamp01, lerp, drawBackdrop } from 'simulations/base/kit/SimLook.js';
import { drawBall, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, ease, hash2 } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';

const S_DALTON = 0, S_CRACK = 1, S_TAKE = 2;
const X = 340, Y = 262, R = 138;
const EMIT = [[0.5, -2.5], [1.5, -0.7], [2.6, 1.1], [3.6, 2.5], [4.5, -1.5]];
const FLY_S = 1.2, RUN_S = 6;
const OPEN_S = 1.1;

export class RadioactivityScene extends SimScene {
  static BEAT_STEP_MAP = [S_DALTON, S_CRACK, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'button', id: 'act', label: 'Open the atom' }];
  static ARIA_LABEL = 'A plain solid atom. Tapping it does nothing: it stays whole. Next a uranium atom gives out particles on its own, with nothing touching it. Last the atom opens and small particles are seen inside it.';

  constructor(container, config) {
    super(container, config);
    this._t0 = 0;
    this._openAt = null;
    this._hits = 0;
  }

  enter() { this._t0 = 0; this._openAt = null; this._hits = 0; this.requestUiUpdate?.(); }

  isControlHidden(id) { return id === 'act' && this.stage !== S_TAKE; }
  isControlDisabled(id) { return id === 'act' && this._openAt != null; }
  onControlChange(id) { if (this._guard(id) && id === 'act') this._open(); }

  _open() {
    if (this._openAt != null) return;
    this._openAt = this.age;
    const hit = () => this.celebrate(X, Y, 24, { key: 'parts-inside' });
    if (reducedMotion()) hit(); else this.after(OPEN_S, hit);
    this.requestUiUpdate?.();
  }

  pointerDown() {
    if (this.stage === S_DALTON) {
      this._hits += 1;
      this.shake(9);
      this.floatText('still whole', X, 120, { size: 26, bg: this.colors.raised });
    } else if (this.stage === S_CRACK) { if (this.age - this._t0 > RUN_S) this._t0 = this.age; } else this._open();
  }

  _u() {
    if (this._openAt == null) return 0;
    return reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._openAt) / OPEN_S));
  }

  busy() {
    if (this.stage === S_CRACK) return !reducedMotion() && this.age - this._t0 < RUN_S;
    return this._openAt != null && this._u() < 1;
  }

  draw(ctx, c, t) {
    if (this.stage === S_DALTON) drawBackdrop(ctx, c, 'plain');
    else drawDepthField(ctx, c, { x: X, y: Y, seed: 41, t });
    if (this.stage === S_DALTON) this._dalton(ctx, c);
    else if (this.stage === S_CRACK) this._crack(ctx, c);
    else this._take(ctx, c);
  }

  _dalton(ctx, c) {
    drawBall(ctx, c, X, Y, R, c.s1);
    bigText(ctx, c, "Dalton's atom", X, 54, 36, c.label);
    if (!this._hits) pill(ctx, c, 'tap to hit it', X, 462, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    else pill(ctx, c, 'no parts, nothing inside', X, 462, { bg: c.raised, ink: c.label, size: 26, display: true });
  }

  _crack(ctx, c) {
    const t = reducedMotion() ? 99 : this.age - this._t0;
    // the heavy atom, and the particles it gives out, each leaving a fading trail
    for (const [at, a] of EMIT) {
      const u = clamp01((t - at) / FLY_S);
      if (u <= 0) continue;
      const d0 = R + 4, d1 = 320, e = ease.outCubic(u);
      const x0 = X + Math.cos(a) * d0, y0 = Y + Math.sin(a) * d0;
      const x1 = X + Math.cos(a) * lerp(d0, d1, e), y1 = Y + Math.sin(a) * lerp(d0, d1, e);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = alpha(c.gold, 0.5); ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.restore();
      drawBall(ctx, c, x1, y1, 16, c.gold);
    }
    const jolt = EMIT.some(([at]) => t > at && t < at + 0.16) ? 4 : 0;
    drawBall(ctx, c, X + jolt, Y, R, c.s8);
    bigText(ctx, c, 'uranium', X + jolt, Y, 48, isDay(c) ? c.bgSurface : c.bgDeep);
    pill(ctx, c, 'nothing touches it', X, 56, { bg: c.raised, ink: c.label, size: 28, display: true });
  }

  _half(ctx, c, side, gap) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(side < 0 ? X - R - 8 + side * gap : X + side * gap, Y - R - 8, R + 8, R * 2 + 16);
    ctx.clip();
    drawBall(ctx, c, X + side * gap, Y, R, c.s8);
    ctx.restore();
  }

  _take(ctx, c) {
    const u = this._u(), gap = 74 * u;
    if (u > 0.05) {
      const pts = [[-40, -70], [34, -38], [-22, 6], [44, 34], [-46, 66], [12, 92], [6, -102]];
      pts.forEach(([x, y], i) => drawBall(ctx, c, X + x * u, Y + y * Math.min(1, u * 1.1), 14 + hash2(i, 7) * 6, c.gold, { dim: 0 }));
    }
    this._half(ctx, c, -1, gap);
    this._half(ctx, c, 1, gap);
    if (this._openAt == null) pill(ctx, c, 'tap to open it', X, 462, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    if (u >= 1) pill(ctx, c, 'smaller parts inside', X, 56, { bg: c.gold, ink: chipInk(c), size: 30, display: true });
  }
}
