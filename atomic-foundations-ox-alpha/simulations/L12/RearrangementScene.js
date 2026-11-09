// RearrangementScene - companion to blk-l12-s3, "Atoms Are Not Used Up".
//   b0  molecules  2 H2 and O2. Tap: the bonds break, the atoms stand free. Tap: the same six atoms form 2 H2O
//   b1  count      build the equation: tap a side to add a molecule until both sides have the same atoms
//   b2  takeaway   one oxygen atom: only the outer electrons take part, the nucleus does not change
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { lerp, drawCard, clamp01 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawMolecule, drawBond, drawAtom, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { say, tag, formula, popIn, button, hit } from '../L07/AtomBoard.js';
import { atomBall, span } from './MolKit.js';

const S_ATOMS = 0, S_COUNT = 1, S_TAKE = 2;
const HR = 42, OR = 58;
// The six atoms: where each one starts, stands free, and ends.
const ATOMS = [
  { sym: 'H', a: [92, 150],  f: [120, 110], b: [150, 318] },
  { sym: 'H', a: [188, 150], f: [270, 92],  b: [278, 318] },
  { sym: 'H', a: [92, 368],  f: [104, 386], b: [402, 318] },
  { sym: 'H', a: [188, 368], f: [258, 372], b: [530, 318] },
  { sym: 'O', a: [430, 262], f: [410, 150], b: [214, 216] },
  { sym: 'O', a: [566, 262], f: [560, 340], b: [466, 216] },
];
const BEFORE = [[0, 1, 1], [2, 3, 1], [4, 5, 2]];
const AFTER = [[4, 0, 1], [4, 1, 1], [5, 2, 1], [5, 3, 1]];
const MOVE_S = 1.3;

export class RearrangementScene extends SimScene {
  static BEAT_STEP_MAP = [S_ATOMS, S_COUNT, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'next', label: 'Break the bonds' },
    { type: 'button', id: 'H2', label: 'Add H2' },
    { type: 'button', id: 'O2', label: 'Add O2' },
    { type: 'button', id: 'H2O', label: 'Add H2O' },
    { type: 'button', id: 'reset', label: 'Start again' },
  ];
  static ARIA_LABEL = 'Two hydrogen molecules and one oxygen molecule. The bonds break and the six atoms stand free, then the same six '
    + 'atoms join as two water molecules. Next the equation is built: hydrogen plus oxygen gives water leaves an oxygen atom missing, and '
    + 'adding molecules gives 2 H2 plus O2 gives 2 H2O, with 4 hydrogen and 2 oxygen atoms on both sides. Last, one oxygen atom shows '
    + 'that only the outer electrons take part and the nucleus does not change.';

  constructor(container, config) {
    super(container, config);
    this._step = 0;
    this._moveAt = -9;
    this._n = { H2: 1, O2: 1, H2O: 1 };
    this._found = false;
    this._boxes = [];
    this._bumpAt = -9;
  }

  enter() {
    this._step = 0;
    this._moveAt = -9;
    this._n = { H2: 1, O2: 1, H2O: 1 };
    this._found = false;
    this._boxes = [];
  }

  get _moving() { return this.age - this._moveAt < MOVE_S && !reducedMotion(); }
  busy() { return this._moving || this.age < 1 || this.age - this._bumpAt < 0.5; }

  isControlHidden(id) {
    if (id === 'next') return this.stage !== S_ATOMS;
    return this.stage !== S_COUNT;
  }
  isControlDisabled(id) {
    if (id === 'next') return this._step >= 2 || this._moving;
    return id !== 'reset' && (this._found || this._n[id] >= 2);
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'next') this._advance();
    else if (id === 'reset') { this._n = { H2: 1, O2: 1, H2O: 1 }; this._found = false; }
    else this._add(id);
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_ATOMS && !this._moving && this._step < 2) this._advance();
    if (this.stage === S_COUNT) {
      const b = hit(this._boxes, p);
      if (b && !this._found) this._add(b.id);
    }
  }

  _advance() {
    this._step += 1;
    this._moveAt = this.age;
    if (this._step === 2) {
      const land = () => this.celebrate(340, 262, 40, { key: 'same-atoms', lookAt: 'scene' });
      if (reducedMotion()) land(); else this.after(MOVE_S, land);
    }
    this.requestUiUpdate?.();
  }

  _add(id) {
    if (this._n[id] >= 2) return;
    this._n[id] += 1;
    this._bumpAt = this.age;
    const t = this._tally();
    if (t.H[0] === t.H[1] && t.O[0] === t.O[1]) {
      this._found = true;
      this.celebrate(340, 76, 30, { key: 'balanced', lookAt: 'scene' });
    }
    this.requestUiUpdate?.();
  }

  _tally() {
    const n = this._n;
    return { H: [n.H2 * 2, n.H2O * 2], O: [n.O2 * 2, n.H2O] };
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 250, seed: 12, n: 9 });
    if (this.stage === S_ATOMS) this._react(ctx, c);
    else if (this.stage === S_COUNT) this._equation(ctx, c);
    else this._atom(ctx, c);
  }

  _react(ctx, c) {
    const s = this._step, u = reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._moveAt) / MOVE_S));
    const from = s === 0 ? 'a' : s === 1 ? 'a' : 'f', to = s === 0 ? 'a' : s === 1 ? 'f' : 'b';
    const P = ATOMS.map((q) => ({ x: lerp(q[from][0], q[to][0], u), y: lerp(q[from][1], q[to][1], u), sym: q.sym }));
    const bonds = s === 2 ? AFTER : BEFORE;
    const show = s === 0 ? 1 : s === 1 ? 1 - span(u, 0, 0.3) : span(u, 0.7, 1);
    if (show > 0) {
      ctx.save();
      ctx.globalAlpha *= show;
      for (const [i, j, order] of bonds) drawBond(ctx, c, P[i].x, P[i].y, P[j].x, P[j].y, { order, w: 16 });
      ctx.restore();
    }
    P.forEach((q) => atomBall(ctx, c, q.sym, q.x, q.y, q.sym === 'H' ? HR : OR));
    const done = s === 2 && u >= 1;
    if (s === 0) {
      formula(ctx, c, 'H_2', 140, 262, { size: 40 });
      formula(ctx, c, 'O_2', 498, 136, { size: 40 });
      tag(ctx, c, 'tap', 340, 480, { bg: c.warning, size: 28 });
    } else if (s === 1 && u >= 1) tag(ctx, c, 'tap again: the same atoms join', 340, 480, { bg: c.warning, size: 26 });
    if (done) {
      formula(ctx, c, 'H_2O', 214, 118, { size: 40 });
      formula(ctx, c, 'H_2O', 466, 118, { size: 40 });
      tag(ctx, c, '4 H and 2 O, the same as before', 340, 452, { size: 26 });
    }
  }

  _side(ctx, c, id, x) {
    const n = this._n[id], r = n === 1 ? 70 : 54;
    for (let i = 0; i < n; i++) {
      const my = n === 1 ? 200 : 146 + i * 112;
      const p = i === n - 1 ? Math.min(1.05, popIn(this.age, this._bumpAt, 0.35)) : 1;
      drawMolecule(ctx, c, x, my, { ...MOLECULES[id], r: r * p, labels: n === 1 });
    }
    const box = button(ctx, c, '+', x + 52, 296, 50, 44, { size: 30, off: this._found || n >= 2 });
    this._boxes.push({ ...box, id });
  }

  _equation(ctx, c) {
    this._boxes = [];
    const n = this._n, co = (k) => (k > 1 ? `${k} ` : '');
    drawCard(ctx, c, 40, 18, 600, 76, 1, { accent: this._found ? c.good : undefined });
    formula(ctx, c, `${co(n.H2)}H_2 + ${co(n.O2)}O_2  \u2192  ${co(n.H2O)}H_2O`, 340, 54, { size: 44 });
    this._side(ctx, c, 'H2', 96);
    say(ctx, c, '+', 196, 200, { size: 44, col: c.labelMuted });
    this._side(ctx, c, 'O2', 300);
    say(ctx, c, '\u2192', 412, 200, { size: 48, col: c.labelMuted });
    this._side(ctx, c, 'H2O', 536);
    const t = this._tally();
    [['H', 0], ['O', 1]].forEach(([el, i]) => {
      const x = 44 + i * 306, [a, b] = t[el], ok = a === b, y = 368;
      drawCard(ctx, c, x, y, 286, 96, 1, { accent: ok ? c.good : c.bad });
      say(ctx, c, el, x + 42, y + 48, { size: 46 });
      say(ctx, c, a, x + 126, y + 48, { size: 46 });
      say(ctx, c, ok ? '=' : '\u2260', x + 176, y + 48, { size: 40, col: ok ? c.good : c.bad });
      say(ctx, c, b, x + 230, y + 48, { size: 46 });
    });
    say(ctx, c, 'before', 340 - 170, 486, { size: 24, col: c.labelMuted });
    say(ctx, c, 'after', 340 + 170, 486, { size: 24, col: c.labelMuted });
    if (n.O2 >= 2) tag(ctx, c, 'too much: start again', 340, 486, { bg: c.warning, size: 24 });   // no more molecules can balance this
  }

  _atom(ctx, c) {
    const CX = 340, CY = 250;
    drawAtom(ctx, c, CX, CY, { p: 8, n: 8, shells: [2, 6], radius: 196, nucleusR: 66, er: 16, focusShell: 'outer', dimInner: false, seed: 4, phase: 0.3 });
    const a = popIn(this.age, 0.3), b = popIn(this.age, 0.8);
    if (a > 0) tag(ctx, c, 'outer electrons: these take part', 340, 30, { scale: Math.min(1.05, a), size: 26 });
    if (b > 0) tag(ctx, c, 'nucleus: no change', 340, 486, { scale: Math.min(1.05, b), size: 26, bg: c.good });
  }
}
