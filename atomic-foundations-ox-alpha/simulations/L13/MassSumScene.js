// MassSumScene - companion to blk-l13-s8, "The Mass of a Molecule and of a Formula Unit".
// One balance reading in u. The learner puts each atom or ion on the pan and the reading adds up.
//   b0  molecular  H2O = 18 u, then CO2 = 44 u
//   b1  unit       NaCl = 58.5 u, then Na2O = 62 u
//   b2  bracket    Ca(NO3)2: calcium, then the whole NO3 group, twice
//   b3  takeaway   salt: 23 + 35.5 = 58.5 u, the 23:35.5 of Lesson 2
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard, lerp } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawIon } from 'simulations/base/kit/SimAtom.js';
import { say, tag, formula, popIn, hit } from '../L07/AtomBoard.js';
import { atomBall } from '../L12/MolKit.js';
import { drawDigitalBalance } from '../L02/BalanceKit.js';

const S_MOL = 0, S_UNIT = 1, S_BRACKET = 2, S_TAKE = 3;
const BENCH = 480, FLY_S = 0.55;
const a = (sym, m) => ({ sym, m });
const ion = (sym, m, q) => ({ sym, m, q });
const NO3 = { sym: 'NO3', m: 62, group: true };
const SETS = {
  [S_MOL]: [{ f: 'H_2O', parts: [a('H', 1), a('H', 1), a('O', 16)] }, { f: 'CO_2', parts: [a('C', 12), a('O', 16), a('O', 16)] }],
  [S_UNIT]: [{ f: 'NaCl', parts: [ion('Na', 23, 1), ion('Cl', 35.5, -1)] }, { f: 'Na_2O', parts: [ion('Na', 23, 1), ion('Na', 23, 1), ion('O', 16, -2)] }],
  [S_BRACKET]: [{ f: 'Ca(NO_3)_2', parts: [ion('Ca', 40, 2), NO3, NO3] }],
};

export class MassSumScene extends SimScene {
  static BEAT_STEP_MAP = [S_MOL, S_UNIT, S_BRACKET, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'add', label: 'Put the next one on' },
    { type: 'button', id: 'other', label: 'Next compound' },
  ];
  static ARIA_LABEL = 'A balance that reads in u. Atoms are put on one by one: water adds up to 18 u and carbon dioxide to 44 u. Ions are put on '
    + 'for formula units: sodium chloride adds up to 58.5 u and sodium oxide to 62 u. Calcium nitrate takes calcium and two whole NO3 groups, '
    + 'which is 164 u. Last, salt: 23 plus 35.5 is 58.5 u.';

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._on = 0;
    this._addAt = -9;
    this._boxes = [];
  }

  enter() { this._i = 0; this._on = 0; this._addAt = -9; this._boxes = []; }

  get _set() { return SETS[this.stage]?.[this._i]; }
  get _full() { return !!this._set && this._on >= this._set.parts.length; }

  busy() { return !reducedMotion() && (this.age < 1.2 || this.age - this._addAt < FLY_S + 0.2); }
  isControlHidden(id) {
    if (this.stage === S_TAKE) return true;
    if (id === 'other') return (SETS[this.stage]?.length ?? 1) < 2;
    return false;
  }
  isControlDisabled(id) { return id === 'add' ? this._full : !this._full || this._i >= 1; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'add') this._add();
    if (id === 'other') this._next();
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_TAKE) return;
    if (this._full) { if (!this.isControlDisabled('other') && !this.isControlHidden('other')) this._next(); }
    else if (hit(this._boxes, p, 14) || p.y < 330) this._add();
    this.requestUiUpdate?.();
  }

  _next() { this._i += 1; this._on = 0; this._addAt = -9; }

  _add() {
    this._on += 1;
    this._addAt = this.age;
    if (this._full) {
      const key = `sum-${this.stage}-${this._i}`;
      const land = () => this.celebrate(340, 440, 30, { key, lookAt: 'balance' });
      if (reducedMotion()) land(); else this.after(FLY_S, land);
    }
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 26);
    drawBench(ctx, c, 14, 666, BENCH);
    if (this.stage === S_TAKE) this._take(ctx, c);
    else this._sum(ctx, c);
  }

  _piece(ctx, c, q, x, y, r) {
    if (q.group) {
      const s = r / 50;
      atomBall(ctx, c, 'N', x, y, 22 * s);
      [[-0.9, 0.5], [0.9, 0.5], [0, -1]].forEach(([ox, oy]) => atomBall(ctx, c, 'O', x + ox * 28 * s, y + oy * 28 * s, 19 * s));
    } else if (q.q) drawIon(ctx, c, x, y, { sym: q.sym, charge: q.q, r });
    else atomBall(ctx, c, q.sym, x, y, r * (q.sym === 'H' ? 0.8 : 1));
  }

  _sum(ctx, c) {
    const S = this._set, n = S.parts.length;
    drawCard(ctx, c, 150, 14, 380, 76, 1, { accent: this._full ? c.good : c.stroke });
    formula(ctx, c, S.f, 340, 52, { size: 46 });
    let total = 0;
    this._boxes = [];
    const gapT = 200, gapP = 150;
    const fly = reducedMotion() ? 1 : ease.inOutCubic(Math.min(1, (this.age - this._addAt) / FLY_S));
    S.parts.forEach((q, i) => {
      const tx = 340 + (i - (n - 1) / 2) * gapT, ty = 182;
      const px = 340 + (i - (n - 1) / 2) * gapP, py = 342;
      const placed = i < this._on, last = i === this._on - 1;
      if (!placed) {
        this._piece(ctx, c, q, tx, ty, 68);
        say(ctx, c, `${q.m} u`, tx, 278, { size: 32 });
        this._boxes.push({ x: tx - 72, y: ty - 72, w: 144, h: 144 });
        return;
      }
      const u = last ? fly : 1;
      this._piece(ctx, c, q, lerp(tx, px, u), lerp(ty, py, u), lerp(68, 60, u));
      if (u >= 1 || !last) total += q.m;
    });
    drawDigitalBalance(ctx, c, 340, BENCH, `${total} u`, this._full ? 'good' : 'live', { w: 500 });
    if (this._on === 0 && !S.parts.some((q) => q.group)) tag(ctx, c, 'tap each one', 340, 330, { bg: c.warning, size: 26 });
    if (S.parts.some((q) => q.group)) {
      if (!this._full) tag(ctx, c, 'the 2 counts all of NO3', 430, 112, { size: 24 });
    }
    if (this._full && this._i === 0 && SETS[this.stage].length > 1) tag(ctx, c, 'tap: next compound', 340, 178, { bg: c.warning, size: 26 });
  }

  _take(ctx, c) {
    const a1 = popIn(this.age, 0.1), a2 = popIn(this.age, 0.35), a3 = popIn(this.age, 0.7);
    drawDigitalBalance(ctx, c, 340, BENCH, '58.5 u', 'good', { w: 440 });
    if (a1 > 0) drawIon(ctx, c, 222, 288, { sym: 'Na', charge: 1, r: 86 * Math.min(1.05, a1) });
    if (a2 > 0) drawIon(ctx, c, 428, 262, { sym: 'Cl', charge: -1, r: 116 * Math.min(1.05, a2) });
    if (a3 > 0) tag(ctx, c, '23 : 35.5', 340, 58, { size: 44, scale: Math.min(1.05, a3), bg: c.good });
  }
}
