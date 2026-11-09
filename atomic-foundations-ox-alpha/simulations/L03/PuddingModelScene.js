// PuddingModelScene - companion to blk-l03-s8, "Where Is the Positive Charge?".
//   b0  puzzle    an atom with electrons reads total 0: where is the positive charge?
//   b1  pudding   a cut watermelon turns into Thomson's atom: pulp to positive sphere, seeds to electrons
//   b2  balance   set the electrons and the positive charge: the total must come back to zero
//   b3  takeaway  the model, named
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { mix, darken, lighten, pill, ellipse } from 'simulations/base/kit/SimLook.js';
import { drawBall, drawElectron, drawCharge, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, follow } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';

const S_PUZZLE = 0, S_PUDDING = 1, S_BALANCE = 2, S_TAKE = 3;
const X = 340, Y = 256, R = 164;
const SEEDS = [[-82, -66], [28, -96], [96, -22], [-34, 6], [58, 72], [-92, 66], [2, 112], [-4, -44]];

export class PuddingModelScene extends SimScene {
  static BEAT_STEP_MAP = [S_PUZZLE, S_PUDDING, S_BALANCE, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'swap', label: 'Turn it into the atom' },
    { type: 'slider', id: 'neg', label: 'Electrons', min: 1, max: 8, step: 1, value: 3, suffix: '' },
    { type: 'slider', id: 'pos', label: 'Positive charge', min: 1, max: 8, step: 1, value: 3, suffix: '' },
  ];
  static ARIA_LABEL = 'An atom holds electrons but its total charge is zero, so positive charge must also be inside. A cut watermelon turns into Thomson\'s model: the red pulp becomes a sphere of positive charge '
    + 'and the seeds become electrons. Sliders set the electrons and the positive charge, and the atom is neutral only when they match.';

  constructor(container, config) {
    super(container, config);
    this._m = 0;
    this._on = false;
    this._neg = 3;
    this._pos = 3;
    this._off = false;
    this._found = false;
  }

  enter(stage) {
    this._on = stage > S_PUDDING;
    this._m = this._on ? 1 : 0;
    this._neg = 3; this._pos = 3; this._off = false; this._found = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    if (id === 'swap') return this.stage !== S_PUDDING;
    return this.stage !== S_BALANCE;
  }
  getControlValue(id) { return id === 'neg' ? this._neg : id === 'pos' ? this._pos : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'swap') { this._on = !this._on; if (reducedMotion()) this._m = this._on ? 1 : 0; }
    else {
      if (id === 'neg') this._neg = Number(v); else this._pos = Number(v);
      const matched = this._neg === this._pos;
      if (!matched) this._off = true;
      if (matched && this._off && !this._found) {
        this._found = true;
        this.celebrate(X, 96, 22, { key: 'charges-balance' });
      }
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_PUDDING) this.onControlChange('swap', true);
    else if (this.stage === S_BALANCE) this.onControlChange(p.x < 340 ? 'neg' : 'pos', (p.x < 340 ? this._neg : this._pos) % 8 + 1);
  }

  update(d) {
    const tg = this._on ? 1 : 0;
    this._m = follow(this._m, tg, d, 0.2);
    if (Math.abs(this._m - tg) < 0.004) this._m = tg;
  }

  busy() { return this._m !== (this._on ? 1 : 0); }

  draw(ctx, c, t) {
    drawDepthField(ctx, c, { x: X, y: Y, seed: 31, t });
    if (this.stage === S_PUZZLE) this._puzzle(ctx, c);
    else if (this.stage === S_PUDDING) this._melon(ctx, c);
    else if (this.stage === S_BALANCE) this._balance(ctx, c);
    else this._atom(ctx, c, 8);
    if (this.stage === S_TAKE) { bigText(ctx, c, 'plum pudding model', X, 52, 36, c.label); }
  }

  _puzzle(ctx, c) {
    const pos = mix(c.labelMuted, c.bgSurface, 0.4);
    drawBall(ctx, c, X, Y, R, pos);
    bigText(ctx, c, '?', X, Y + 8, 170, isDay(c) ? c.label : c.warning);
    [0, 1, 2, 4, 5, 6].forEach((i) => this._e(ctx, c, X + SEEDS[i][0] * 1.15, Y + SEEDS[i][1] * 1.1));
    pill(ctx, c, 'total charge: 0', X, 52, { bg: c.gold, ink: chipInk(c), size: 32, display: true });
  }

  _e(ctx, c, x, y) {
    drawElectron(ctx, c, x, y, 18);
    drawCharge(ctx, c, x, y, 18, -1, c.bgDeep);
  }

  /** k 0: a cut watermelon, k 1: the positive sphere. */
  _melon(ctx, c) {
    const k = this._m;
    const rind = mix(c.s3, c.bgDeep, 0.3), pale = mix(c.label, c.s3, 0.25), pulp = c.s6;
    const sphere = c.proton;
    if (k < 1) {
      ctx.beginPath(); ctx.arc(X, Y, R + 26 * (1 - k), 0, Math.PI * 2); ctx.fillStyle = rind; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = darken(rind, 0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(X, Y, R + 12 * (1 - k), 0, Math.PI * 2); ctx.fillStyle = isDay(c) ? lighten(pale, 0.5) : pale; ctx.fill();
    }
    drawBall(ctx, c, X, Y, R, mix(pulp, sphere, k));
    SEEDS.forEach(([x, y], i) => {
      const a = (x + y) * 0.02 + i;
      if (k < 0.5) {
        ellipse(ctx, X + x, Y + y, 12, 18, a);
        ctx.fillStyle = mix(c.bgDeep, c.label, isDay(c) ? 0.9 : 0.04); ctx.fill();
      } else this._e(ctx, c, X + x, Y + y);
    });
    if (k >= 0.5) for (let i = 0; i < 14; i++) {
      const q = i * 2.4, rr0 = Math.sqrt((i + 0.5) / 14) * R * 0.88;
      const px = X + Math.cos(q) * rr0, py = Y + Math.sin(q) * rr0;
      if (SEEDS.some(([sx, sy]) => Math.hypot(X + sx - px, Y + sy - py) < 30)) continue;
      drawCharge(ctx, c, px, py, 22, 1, lighten(sphere, 0.6));
    }
    if (k < 0.5) {
      pill(ctx, c, 'pulp', 96, 150, { bg: c.s6, ink: chipInk(c), size: 28, display: true });
      pill(ctx, c, 'seeds', 584, 150, { bg: c.raised, ink: c.label, size: 28, display: true });
      pill(ctx, c, 'tap', X, 482, { bg: c.warning, ink: chipInk(c), size: 28, display: true });
    } else {
      pill(ctx, c, 'positive sphere', 122, 66, { bg: c.proton, ink: chipInk(c), size: 26, display: true });
      pill(ctx, c, 'electrons', 574, 66, { bg: c.electron, ink: chipInk(c), size: 26, display: true });
    }
  }

  _atom(ctx, c, n) {
    drawBall(ctx, c, X, Y + 10, R, c.proton);
    const ok = SEEDS.slice(0, n);
    for (let i = 0; i < 14; i++) {
      const q = i * 2.4, rr0 = Math.sqrt((i + 0.5) / 14) * R * 0.88;
      const px = X + Math.cos(q) * rr0, py = Y + 10 + Math.sin(q) * rr0;
      if (ok.some(([sx, sy]) => Math.hypot(X + sx - px, Y + 10 + sy - py) < 30)) continue;
      drawCharge(ctx, c, px, py, 22, 1, lighten(c.proton, 0.6));
    }
    ok.forEach(([x, y]) => this._e(ctx, c, X + x, Y + 10 + y));
  }

  _balance(ctx, c) {
    const n = this._neg, p = this._pos, tot = p - n;
    drawBall(ctx, c, X, Y + 8, R, c.proton);
    bigText(ctx, c, `+${p}`, X, Y + 8, 84, chipInk(c));
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
      this._e(ctx, c, X + Math.cos(a) * R * 0.74, Y + 8 + Math.sin(a) * R * 0.74);
    }
    const ok = tot === 0;
    pill(ctx, c, ok ? 'total 0: neutral' : `total ${tot > 0 ? '+' : ''}${tot}: not neutral`, X, 50, { bg: ok ? c.good : c.bad, ink: chipInk(c), size: 30, display: true });
    bigText(ctx, c, `${n} electrons`, 120, 484, 28, c.label);
    bigText(ctx, c, `+${p}`, 590, 484, 30, c.label);
  }
}
