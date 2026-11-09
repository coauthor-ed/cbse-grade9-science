// ChargeBalanceScene - companion to blk-l08-s5, "Why MgCl2 and Not MgCl?".
// The learner adds ions round a central ion until the charges add up to zero.
//   b0  mgcl      Mg2+ with one Cl-: +1 left over. Add Cl- until the sum reads 0: MgCl2
//   b1  sulfide   S2- with one Na+: -1 left over. Add Na+ until the sum reads 0: Na2S
//   b2  takeaway  both compounds, with their charges added up
// A third ion overshoots to the other side of zero, so zero is found, not stopped at.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawIon } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, formula, at } from '../L07/AtomBoard.js';

const S_MG = 0, S_S = 1, S_TAKE = 2;
const CX = 226, CY = 268;
const PANEL = { x: 452, y: 22, w: 214, h: 476 };
const CASES = [
  { sym: 'Mg', q: 2, r: 76, adds: 'Cl', aq: -1, ar: 64, f: 'MgCl_2', add: 'Add a Cl- ion', wrong: 'MgCl' },
  { sym: 'S', q: -2, r: 92, adds: 'Na', aq: 1, ar: 56, f: 'Na_2S', add: 'Add a Na+ ion', wrong: 'NaS' },
];
const ANGLES = [Math.PI, 0, -Math.PI / 2];
const sign = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');

export class ChargeBalanceScene extends SimScene {
  static BEAT_STEP_MAP = [S_MG, S_S, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'addCl', label: 'Add a Cl⁻ ion' },
    { type: 'button', id: 'addNa', label: 'Add a Na⁺ ion' },
    { type: 'button', id: 'less', label: 'Take one away' },
  ];
  static ARIA_LABEL =
    'A magnesium ion with charge 2 plus stands with one chloride ion, and the charges add up to plus 1. You add '
    + 'chloride ions until the sum reads zero: two are needed, which gives MgCl2. Next a sulfide ion with charge '
    + '2 minus stands with one sodium ion, and you add sodium ions until the sum reads zero: Na2S. Last, both '
    + 'compounds stand side by side with their charges added up.';

  constructor(container, config) {
    super(container, config);
    this._n = 1;
    this._born = -9;
    this._found = false;
    this._at = 0;
  }

  enter() {
    this._n = 1;
    this._born = -9;
    this._found = false;
    this._at = this.age;
  }

  busy() { return this.age - this._at < 1 || this.age - this._born < 0.6; }

  isControlHidden(id) {
    if (id === 'addCl') return this.stage !== S_MG;
    if (id === 'addNa') return this.stage !== S_S;
    return this.stage === S_TAKE;
  }

  isControlDisabled(id) { return id === 'less' ? this._n <= 1 : this._n >= 3; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    this._n += id === 'less' ? -1 : 1;
    this._born = this.age;
    const A = CASES[this.stage];
    if (A.q + this._n * A.aq === 0 && !this._found) {
      this._found = true;
      this.celebrate(CX, CY, 28, { key: `balanced-${A.sym}`, lookAt: 'scene' });
    }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: this.stage === S_TAKE ? 340 : CX, y: CY, seed: 12, n: 9 });
    if (this.stage === S_TAKE) { this._both(ctx, c); return; }
    const A = CASES[this.stage];
    const sum = A.q + this._n * A.aq;
    this._cluster(ctx, c, A, CX, CY, 1, this._n, sum === 0);
    const { x, y, w, h } = PANEL, cx = x + w / 2;
    drawCard(ctx, c, x, y, w, h, 1, { accent: sum === 0 ? c.good : c.accent });
    say(ctx, c, 'charges add up to', cx, y + 44, { size: 23, col: c.labelMuted });
    say(ctx, c, sign(sum), cx, y + 148, { size: 118, col: sum === 0 ? c.good : c.s2ink });
    const terms = [sign(A.q), ...Array.from({ length: this._n }, () => sign(A.aq))].join('  ');
    say(ctx, c, terms, cx, y + 256, { size: 30 });
    if (sum === 0) formula(ctx, c, A.f, cx, y + 360, { size: 62, col: c.label });
    else if (sum * A.q < 0) tag(ctx, c, 'too many', cx, y + 360, { bg: c.bad, size: 26 });
    else tag(ctx, c, 'not zero yet', cx, y + 360, { size: 24, bg: c.bgSurface });
  }

  /** The central ion with n partners round it. */
  _cluster(ctx, c, A, x, y, s, n, done) {
    for (let i = 0; i < n; i++) {
      const a = ANGLES[i], d = (A.r + A.ar - 8) * s;
      const u = i === n - 1 ? popIn(this.age, this._born, 0.4) : 1;
      if (this._born < 0) { /* first frame of the beat: no pop */ }
      at(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, this._born < 0 ? 1 : Math.max(0.1, u), () => {
        drawIon(ctx, c, 0, 0, { sym: A.adds, charge: A.aq, r: A.ar * s });
      });
    }
    drawIon(ctx, c, x, y, { sym: A.sym, charge: A.q, r: A.r * s, focus: done ? 0.7 : 0 });
  }

  _both(ctx, c) {
    const a = this.age - this._at;
    CASES.forEach((A, i) => {
      const x = i === 0 ? 176 : 506, u = popIn(a, 0.1 + i * 0.3);
      at(ctx, x, 200, u, () => this._cluster(ctx, c, A, 0, 0, 0.74, 2, false));
      if (u <= 0) return;
      formula(ctx, c, A.f, x, 356, { size: 54 });
      say(ctx, c, [sign(A.q), sign(A.aq), sign(A.aq)].join('  '), x, 416, { size: 30 });
    });
    const p = popIn(a, 0.9);
    if (p > 0) tag(ctx, c, 'always zero', 340, 476, { bg: c.good, scale: Math.min(1.05, p), size: 30 });
  }
}
