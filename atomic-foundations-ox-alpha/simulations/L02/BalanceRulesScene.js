// BalanceRulesScene - companion to blk-l02-s1, "An Old Idea and a New Tool".
//   b0  idea      divide a grain again and again, as Kanada imagined, until it cannot be divided
//   b1  measure   wood burns on a balance: the reading drops, and it looks as if matter was destroyed
//   b2  takeaway  the same burn in a closed jar: the reading holds, ash and gases together
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, darken, lighten, rr, pill, popAt, clamp01, lerp, drawBackdrop, drawFloor, drawBench } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawDepthField, drawBall } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, ease, hash2 } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, bigText, isDay, chipInk } from '../L01/GrainKit.js';
import { drawDigitalBalance } from './BalanceKit.js';

const S_IDEA = 0, S_MEASURE = 1, S_TAKE = 2;
const BENCH = 440;
const SIZES = [92, 66, 46, 32, 22];
const STEPS = SIZES.length;
const BURN_S = 3.2;

export class BalanceRulesScene extends SimScene {
  static BEAT_STEP_MAP = [S_IDEA, S_MEASURE, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'cut', label: 'Divide it' },
    { type: 'button', id: 'burn', label: 'Burn the wood' },
  ];
  static ARIA_LABEL = 'A grain is divided again and again into smaller pieces until the last piece, a parmanu, cannot be divided. Next a piece of wood '
    + 'burns on a digital balance and the reading falls from 100 grams to a few grams of ash. Last the same wood burns inside a closed jar and the reading does not change.';

  constructor(container, config) {
    super(container, config);
    this._cuts = 0;
    this._cutAt = 0;
    this._burnAt = null;
  }

  enter() { this._cuts = 0; this._cutAt = 0; this._burnAt = null; this.requestUiUpdate?.(); }

  isControlHidden(id) { return id === 'cut' ? this.stage !== S_IDEA : this.stage === S_IDEA; }
  isControlDisabled(id) { return id === 'cut' ? this._cuts >= STEPS - 1 : this._burnAt != null; }
  onControlChange(id) { if (!this._guard(id)) return; if (id === 'cut') this._cut(); else this._burn(); }
  pointerDown() { if (this.stage === S_IDEA) { if (this._cuts < STEPS - 1) this._cut(); } else if (this._burnAt == null) this._burn(); }

  _cut() {
    this._cuts += 1;
    this._cutAt = this.age;
    if (this._cuts === STEPS - 1) this.after(0.6, () => this.celebrate(this._x(STEPS - 1), 270, 22, { key: 'parmanu' }));
    this.requestUiUpdate?.();
  }

  _burn() {
    this._burnAt = this.age;
    if (this.stage === S_TAKE) {
      const hit = () => this.celebrate(340, 400, 24, { key: 'mass-kept', lookAt: 'balance' });
      if (reducedMotion()) hit(); else this.after(BURN_S, hit);
    }
    this.requestUiUpdate?.();
  }

  _b() {
    if (this._burnAt == null) return 0;
    return reducedMotion() ? 1 : clamp01((this.age - this._burnAt) / BURN_S);
  }

  busy() { return this.age - this._cutAt < 0.7 || (this._burnAt != null && this._b() < 1); }

  /** Piece i's centre: the row of pieces so far stays centred on the stage. */
  _x(i) {
    const at = [0, 176, 312, 416, 490], n = this._cuts;
    const span = at[n] + SIZES[0] + SIZES[n];
    return 340 - span / 2 + SIZES[0] + at[i];
  }

  draw(ctx, c, t) {
    if (this.stage === S_IDEA) { this._idea(ctx, c, t); return; }
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 50);
    drawBench(ctx, c, 26, 654, BENCH);
    if (this.stage === S_MEASURE) this._open(ctx, c, t);
    else this._jar(ctx, c, t);
  }

  _idea(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 270, seed: 2, t });
    const n = this._cuts;
    for (let i = 0; i <= n; i++) {
      const pop = i === n && i && !reducedMotion() ? clamp01((this.age - this._cutAt) / 0.35) : 1;
      const x = this._x(i), r = SIZES[i] * (0.5 + 0.5 * pop);
      const last = i === STEPS - 1;
      if (last) drawBall(ctx, c, x, 270, r, c.gold);
      else drawGrain(ctx, c, x, 270, r, { seed: 3 + i, alpha: i < n ? 0.5 : 1 });
    }
    if (n < STEPS - 1) pill(ctx, c, 'tap to divide it', 340, 450, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    else {
      const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, this._cutAt + 0.3);
      if (p) {
        pill(ctx, c, 'parmanu', this._x(STEPS - 1) - 30, 196, { bg: c.gold, ink: chipInk(c), size: 30, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
        pill(ctx, c, 'imagined, not tested', 340, 450, { bg: c.raised, ink: c.label, size: 26, display: true });
      }
    }
    bigText(ctx, c, 'keep dividing matter', 340, 62, 34, c.label);
  }

  _wood(ctx, c, x, y, k) {
    // a log of wood that shrinks to a small grey heap of ash as k goes 0 to 1
    const col = mix(c.s8, c.s2, 0.25), ash = mix(c.labelMuted, c.waste, 0.5);
    const a = 1 - clamp01(k * 1.3);
    if (a > 0) {
      const w = 250 * (0.55 + 0.45 * a), h = 84 * (0.5 + 0.5 * a);
      rr(ctx, x - w / 2, y - h, w, h, 18); ctx.fillStyle = mix(darken(col, 0.3), c.bgDeep, k * 0.6); ctx.fill();
      ctx.strokeStyle = darken(col, 0.5); ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w / 2 - h / 2, y - h / 2, h * 0.4, 0, Math.PI * 2); ctx.fillStyle = lighten(col, 0.25); ctx.fill();
      ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    }
    const e = clamp01(k * 1.6 - 0.2);
    if (e > 0) {
      ctx.beginPath();
      ctx.moveTo(x - 70 * e, y);
      ctx.quadraticCurveTo(x, y - 64 * e, x + 70 * e, y);
      ctx.closePath();
      ctx.fillStyle = ash; ctx.fill();
      ctx.strokeStyle = darken(ash, 0.3); ctx.lineWidth = 3; ctx.stroke();
    }
  }

  _flame(ctx, c, x, y, k, t) {
    if (k <= 0 || k >= 1) return;
    const h = 120 * Math.sin(Math.PI * k) ** 0.6;
    for (const [dx, m, col] of [[-30, 0.7, c.flame], [30, 0.8, c.flame], [0, 1, c.flame], [0, 0.6, c.warning]]) {
      const w = reducedMotion() ? 0 : Math.sin(t * 9 + dx) * 4;
      ctx.beginPath();
      ctx.moveTo(x + dx - 30, y);
      ctx.quadraticCurveTo(x + dx - 30, y - h * m * 0.5, x + dx + w, y - h * m);
      ctx.quadraticCurveTo(x + dx + 30, y - h * m * 0.5, x + dx + 30, y);
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
  }

  _smoke(ctx, c, x, y, k, t, ceil) {
    if (k <= 0) return;
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const u = (hash2(i, 2) + (reducedMotion() ? 0 : t * 0.05 * (0.5 + hash2(i, 3)))) % 1;
      const yy = ceil != null ? lerp(y, ceil, hash2(i, 5)) : y - u * 220;
      const xx = x + (hash2(i, 4) - 0.5) * (ceil != null ? 190 : 120);
      ctx.beginPath(); ctx.arc(xx, yy, 14 + hash2(i, 6) * 16, 0, Math.PI * 2);
      ctx.fillStyle = alpha(mix(c.labelMuted, c.waste, 0.3), (ceil != null ? 0.34 : 0.3 * (1 - u)) * Math.min(1, k * 2));
      ctx.fill();
    }
    ctx.restore();
  }

  _open(ctx, c, t) {
    const k = this._b();
    const v = lerp(100, 3, ease.smooth(clamp01((k - 0.15) / 0.8)));
    const y = drawDigitalBalance(ctx, c, 340, BENCH, `${Math.round(v)} g`, k >= 1 ? 'bad' : 'live', { w: 340 });
    this._wood(ctx, c, 340, y, k);
    this._flame(ctx, c, 340, y - 10, k, t);
    this._smoke(ctx, c, 340, y - 90, k < 1 ? k : 0, t);
    if (this._burnAt == null) pill(ctx, c, 'tap to burn it', 340, 92, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    if (k >= 1) pill(ctx, c, 'destroyed?', 340, 200, { bg: c.bad, ink: chipInk(c), size: 34, display: true });
  }

  _jar(ctx, c, t) {
    const k = this._b();
    const y = drawDigitalBalance(ctx, c, 340, BENCH, '250 g', k >= 1 ? 'good' : 'live', { w: 340 });
    const g = glassBox('jar', 340 - 130, y - 280, 260, 280, { wall: 6 });
    drawGlass(ctx, c, g);
    this._smoke(ctx, c, 340, y - 30, k, t, y - 230);
    this._wood(ctx, c, 340, y - 8, k);
    this._flame(ctx, c, 340, y - 16, k, t);
    drawGlassFront(ctx, c, g, { shade: 0.1 });
    // the lid
    rr(ctx, 340 - 136, y - 296, 272, 22, 7); ctx.fillStyle = mix(c.waste, c.label, isDay(c) ? 0.1 : 0.2); ctx.fill();
    ctx.strokeStyle = darken(c.waste, 0.3); ctx.lineWidth = 3; ctx.stroke();
    if (this._burnAt == null) pill(ctx, c, 'tap to burn it, jar closed', 340, 62, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    if (k >= 1) pill(ctx, c, 'ash + gases: no change', 340, 62, { bg: c.good, ink: chipInk(c), size: 28, display: true });
  }
}
