// CrissCrossScene - companion to blk-l08-s10, "A Quick Way to Write Formulae" (moved from L13).
// Two ions with the size of each charge under them. The learner taps a number: it crosses over
// and lands as the other ion's subscript. Then the two halves come together as one formula.
//   b0  cross     Al3+ and O2-: Al2O3, and the charges add up to zero
//   b1  simplify  Mg2+ and O2-: Mg2O2, then the learner divides by 2: MgO
//   b2  brackets  Al3+ and OH-: the learner picks Al(OH)3 over AlOH3
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, rr, darken } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawIon } from 'simulations/base/kit/SimAtom.js';
import { say, tag, formula, button, hit } from '../L07/AtomBoard.js';

const S_CROSS = 0, S_SIMPLE = 1, S_BRACKET = 2;
const XL = 170, XR = 510, Y_ION = 104, Y_NUM = 232, Y_F = 372;
const FLY = 0.75;
const CASES = [
  { l: 'Al', lq: 3, r: 'O', rq: -2, ln: 3, rn: 2, joined: 'Al_2O_3', check: '+6  −6' },
  { l: 'Mg', lq: 2, r: 'O', rq: -2, ln: 2, rn: 2, joined: 'Mg_2O_2', check: '+4  −4', final: 'MgO' },
  { l: 'Al', lq: 3, r: 'OH', rq: -1, ln: 3, rn: 1, joined: 'AlOH_3', check: '+3  −3', final: 'Al(OH)_3' },
];

export class CrissCrossScene extends SimScene {
  static BEAT_STEP_MAP = [S_CROSS, S_SIMPLE, S_BRACKET].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'cross', label: 'Cross the numbers' },
    { type: 'button', id: 'divide', label: 'Divide by 2' },
    { type: 'button', id: 'A', label: 'Left formula' },
    { type: 'button', id: 'B', label: 'Right formula' },
  ];
  static ARIA_LABEL =
    'Writing a formula by crossing the numbers. Aluminium with charge 3 plus and oxide with charge 2 minus stand '
    + 'side by side with their charge numbers under them. Each number crosses over to become the subscript of '
    + 'the other ion, which gives Al2O3. Magnesium and oxide cross to Mg2O2, and dividing by 2 gives MgO. '
    + 'Aluminium and hydroxide cross to give three hydroxide ions, and you choose Al(OH)3 with brackets, not AlOH3.';

  constructor(container, config) {
    super(container, config);
    this._tl = -1;         // when the left number left
    this._tr = -1;
    this._joined = -1;     // when the two halves came together
    this._last = -1;       // when the final step was done
    this._miss = -9;
    this._at = 0;
    this._boxes = [];
    this._found = false;
  }

  enter() {
    this._tl = -1; this._tr = -1; this._joined = -1; this._last = -1;
    this._miss = -9;
    this._at = this.age;
    this._found = false;
  }

  get _both() { return this._tl >= 0 && this._tr >= 0; }

  busy() {
    return this.age - this._at < 0.8 || (this._tl >= 0 && this.age - this._tl < FLY + 0.1) || (this._tr >= 0 && this.age - this._tr < FLY + 0.1)
      || (this._both && this._joined < 0) || (this._joined >= 0 && this.age - this._joined < 0.9) || (this._last >= 0 && this.age - this._last < 0.8);
  }

  isControlHidden(id) {
    if (id === 'cross') return this._both;
    if (id === 'divide') return this.stage !== S_SIMPLE || this._joined < 0 || this._last >= 0;
    return this.stage !== S_BRACKET || this._joined < 0 || this._last >= 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    this.animateFor?.();
    if (id === 'cross') { this._send('l'); this.after(0.3, () => this._send('r')); }
    else if (id === 'divide') this._finish();
    else if (id === 'B') this._finish();
    else { this._miss = this.age; this.oops(180, 410); }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    this.animateFor?.();
    if (!this._both) {
      if (this._tl < 0 && Math.hypot(p.x - XL, p.y - Y_NUM) < 60) this._send('l');
      else if (this._tr < 0 && Math.hypot(p.x - XR, p.y - Y_NUM) < 60) this._send('r');
      return;
    }
    if (this.stage === S_SIMPLE && this._joined >= 0 && this._last < 0) { this._finish(); return; }
    if (this.stage === S_BRACKET && this._joined >= 0 && this._last < 0) {
      const box = hit(this._boxes, p);
      if (box) this.onControlChange(box.id);
    }
  }

  _send(side) {
    const t = reducedMotion() ? this.age - 9 : this.age;
    if (side === 'l') { if (this._tl < 0) this._tl = t; } else if (this._tr < 0) this._tr = t;
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _finish() {
    if (this._last >= 0) return;
    this._last = this.age;
    this._win();
  }

  _win() {
    if (this._found) return;
    this._found = true;
    this.celebrate(340, Y_F, 28, { key: `formula-${this.stage}`, lookAt: 'scene' });
  }

  update() {
    if (this._both && this._joined < 0 && this.age - Math.max(this._tl, this._tr) >= FLY + 0.15) {
      this._joined = this.age;
      if (this.stage === S_CROSS) this._win();
      this.requestUiUpdate?.();
    }
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 200, seed: 2, n: 8 });
    const A = CASES[this.stage], age = this.age;
    this._boxes = [];
    drawIon(ctx, c, XL, Y_ION, { sym: A.l, charge: A.lq, r: 84 });
    drawIon(ctx, c, XR, Y_ION, { sym: A.r, charge: A.rq, r: A.r === 'OH' ? 88 : 92 });
    const join = this._joined < 0 ? 0 : reducedMotion() ? 1 : ease.inOutCubic(clamp01((age - this._joined) / 0.6));
    if (!this._both || join < 1) this._arrows(ctx, c, 1 - join);
    this._number(ctx, c, A.ln, XL, Y_NUM, this._tl, XR + 74, Y_F + 22, join);
    this._number(ctx, c, A.rn, XR, Y_NUM, this._tr, XL + 74, Y_F + 22, join);
    if (join < 1) {
      formula(ctx, c, A.l, XL, Y_F, { size: 76 });
      formula(ctx, c, A.r, XR, Y_F, { size: 76 });
    } else this._result(ctx, c, A);
    if (!this._both && this._tl < 0 && this._tr < 0) tag(ctx, c, 'tap a number', 340, 484, { size: 26 });
  }

  _arrows(ctx, c, a) {
    ctx.save();
    ctx.globalAlpha *= 0.85 * a;
    ctx.strokeStyle = c.warning;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 18]);
    for (const [x0, x1] of [[XL + 44, XR + 60], [XR - 44, XL + 66]]) {
      ctx.beginPath(); ctx.moveTo(x0, Y_NUM + 26); ctx.lineTo(x1, Y_F - 4); ctx.stroke();
    }
    ctx.restore();
  }

  /** A charge number: a chip at rest, a flyer once tapped, a subscript once landed. */
  _number(ctx, c, n, x, y, t0, tx, ty, join) {
    const L = lookOf();
    if (join >= 1) return;
    if (t0 < 0) {
      const s = 62;
      rr(ctx, x - s / 2, y - s / 2 + 5 * L.lip, s, s, 14 * L.radius); ctx.fillStyle = darken(c.warning, 0.38); ctx.fill();
      rr(ctx, x - s / 2, y - s / 2, s, s, 14 * L.radius); ctx.fillStyle = c.warning; ctx.fill();
      say(ctx, c, n, x, y + 2, { size: 44, col: c.bgDeep });
      return;
    }
    const u = ease.inOutCubic(clamp01((this.age - t0) / FLY));
    const size = 44 + (34 - 44) * u;
    const hide = n === 1 && u >= 1;
    if (!hide) say(ctx, c, n, x + (tx - x) * u, y + (ty - y) * u, { size: Math.round(size), col: c.s2ink });
  }

  _result(ctx, c, A) {
    const done = this._last >= 0;
    const y = 336;
    if (this.stage === S_CROSS) {
      formula(ctx, c, A.joined, 340, y, { size: 118 });
      tag(ctx, c, `charges: ${A.check}`, 340, 452, { bg: c.good, size: 28 });
      return;
    }
    if (this.stage === S_SIMPLE) {
      formula(ctx, c, done ? A.final : A.joined, 340, y, { size: 118, col: done ? c.good : c.label });
      if (done) tag(ctx, c, 'simplest ratio', 340, 452, { bg: c.good, size: 28 });
      else tag(ctx, c, 'tap to divide by 2', 340, 452, { size: 28 });
      return;
    }
    if (done) {
      formula(ctx, c, A.final, 340, y, { size: 118, col: c.good });
      tag(ctx, c, '3 whole OH ions', 340, 452, { bg: c.good, size: 28 });
      return;
    }
    const yb = Y_F;
    const left = button(ctx, c, ' ', 60, yb - 62, 270, 118, {});
    const right = button(ctx, c, ' ', 350, yb - 62, 270, 118, {});
    left.id = 'A'; right.id = 'B';
    this._boxes.push(left, right);
    formula(ctx, c, A.joined, 195, yb - 2, { size: 72 });
    formula(ctx, c, A.final, 485, yb - 2, { size: 72 });
    if (this.age - this._miss < 1.8) tag(ctx, c, 'that is 1 O and 3 H', 340, 484, { bg: c.bad, size: 26 });
    else tag(ctx, c, 'which keeps OH whole?', 340, 484, { size: 26 });
  }
}
