// OctetValencyScene - companion to blk-l07-s6, "Valency: The Combining Capacity of an Atom".
//   b0  capacity  tap O, N or Mg: one atom and the H or Cl atoms it combines with; the count is its valency
//   b1  octet     helium, neon and argon with full outer shells: valency 0
//   b2  lose-gain tap Na, O or Cl: the electrons leave or arrive, and the outer shell ends with 8
//   b3  share     carbon with four shared pairs, one to each of four hydrogens
//   b4  rule      six atoms, one at a time: the learner says what each tends to do
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, clamp01, inkOn } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawDepthField, drawBall, drawSharedPair, atomLayout, atomTone, drawElectron } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, at, formula } from './AtomBoard.js';

const S_CAP = 0, S_OCT = 1, S_LG = 2, S_SHARE = 3, S_RULE = 4;
const CX = 232, CY = 262, R = 180;
const PANEL = { x: 452, y: 22, w: 214, h: 476 };

const COMBO = [
  { sym: 'O', with: 'H', n: 2, f: 'H_2O' },
  { sym: 'N', with: 'H', n: 3, f: 'NH_3' },
  { sym: 'Mg', with: 'Cl', n: 2, f: 'MgCl_2' },
];
const NOBLE = [
  { name: 'helium', p: 2, n: 2, cfg: [2], x: 90, r: 76 },
  { name: 'neon', p: 10, n: 10, cfg: [2, 8], x: 270, r: 100 },
  { name: 'argon', p: 18, n: 22, cfg: [2, 8, 8], x: 518, r: 142 },
];
const MOVE = [
  { sym: 'Na', p: 11, n: 12, cfg: [2, 8, 1], d: -1 },
  { sym: 'O', p: 8, n: 8, cfg: [2, 6], d: 2 },
  { sym: 'Cl', p: 17, n: 18, cfg: [2, 8, 7], d: 1 },
];
const ROUND = [
  { sym: 'Mg', name: 'magnesium', p: 12, n: 12, cfg: [2, 8, 2], a: 'lose' },
  { sym: 'N', name: 'nitrogen', p: 7, n: 7, cfg: [2, 5], a: 'gain' },
  { sym: 'Si', name: 'silicon', p: 14, n: 14, cfg: [2, 8, 4], a: 'share' },
  { sym: 'Ar', name: 'argon', p: 18, n: 22, cfg: [2, 8, 8], a: 'full' },
  { sym: 'S', name: 'sulfur', p: 16, n: 16, cfg: [2, 8, 6], a: 'gain' },
  { sym: 'Al', name: 'aluminium', p: 13, n: 14, cfg: [2, 8, 3], a: 'lose' },
];
const ACTS = ['lose', 'gain', 'share', 'full'];
const valencyOf = (A) => {
  const v = A.cfg[A.cfg.length - 1];
  return A.a === 'lose' ? v : A.a === 'gain' ? 8 - v : A.a === 'share' ? 4 : 0;
};
const MOVE_S = 1.1;

export class OctetValencyScene extends SimScene {
  static BEAT_STEP_MAP = [S_CAP, S_OCT, S_LG, S_SHARE, S_RULE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'combo', label: 'Atom', value: 'O', options: COMBO.map((A) => A.sym) },
    { type: 'segmented', id: 'move', label: 'Atom', value: 'Na', options: MOVE.map((A) => A.sym) },
    ...ACTS.map((a) => ({ type: 'button', id: a, label: a })),
  ];
  static ARIA_LABEL =
    'Valency. Tap oxygen, nitrogen or magnesium to see one atom with the hydrogen or chlorine atoms it combines '
    + 'with: oxygen 2, nitrogen 3, magnesium 2. Helium, neon and argon have full outer shells and valency 0. '
    + 'Tap sodium, oxygen or chlorine: sodium loses 1 electron, oxygen gains 2 and chlorine gains 1, and each '
    + 'ends with 8 in its outer shell. Carbon shares 4 electrons, one pair with each of four hydrogen atoms. '
    + 'Last, you say whether each of six atoms tends to lose, gain or share electrons, or is already full.';

  constructor(container, config) {
    super(container, config);
    this._i = 0;           // the chosen atom, or the place in the round
    this._at = 0;
    this._said = -9;       // a wrong answer's time
    this._right = -9;      // the right answer's time
    this._done = false;
  }

  enter(stage) {
    this._i = stage === S_LG ? 0 : 0;
    this._at = this.age;
    this._said = -9;
    this._right = -9;
    this._done = false;
  }

  busy() {
    const a = this.age - this._at;
    return a < (this.stage === S_LG ? MOVE_S + 1 : 1.6) || (this._right >= 0 && this.age - this._right < 1.3);
  }

  update() {
    if (this.stage === S_RULE && this._right >= 0 && this.age - this._right >= 1.15 && this._i < ROUND.length - 1) {
      this._i += 1;
      this._right = -9;
      this._at = this.age;
      this.requestUiUpdate?.();
    }
  }

  isControlHidden(id) {
    if (id === 'combo') return this.stage !== S_CAP;
    if (id === 'move') return this.stage !== S_LG;
    return this.stage !== S_RULE;
  }

  isControlDisabled(id) { return ACTS.includes(id) && (this._right >= 0 || this._done); }

  getControlValue(id) {
    if (id === 'combo' && this.stage === S_CAP) return COMBO[this._i].sym;
    if (id === 'move' && this.stage === S_LG) return MOVE[this._i].sym;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this.animateFor?.();
    if (ACTS.includes(id)) { this._answer(id); this.requestUiUpdate?.(); return; }
    const list = id === 'combo' ? COMBO : MOVE;
    const i = list.findIndex((A) => A.sym === v);
    if (i >= 0 && i !== this._i) { this._i = i; this._at = this.age; }
    this.requestUiUpdate?.();
  }

  _answer(act) {
    if (this._right >= 0 || this._done) return;
    const A = ROUND[this._i];
    if (act !== A.a) {
      this._said = this.age;
      this.oops(CX, CY);
      return;
    }
    this._said = -9;
    this._right = this.age;
    if (this._i === ROUND.length - 1) {
      this._done = true;
      this.celebrate(CX, CY, 30, { key: 'valency-rule', lookAt: 'scene' });
    }
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: this.stage === S_OCT || this.stage === S_SHARE ? 340 : CX, y: CY, seed: 8, n: 9 });
    const a = reducedMotion() ? 9 : this.age - this._at;
    [this._combo, this._noble, this._move, this._share, this._rule][this.stage].call(this, ctx, c, a);
  }

  _panel(ctx, c, accent) {
    drawCard(ctx, c, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 1, { accent: accent ?? c.accent });
    return PANEL.x + PANEL.w / 2;
  }

  _ball(ctx, c, sym, x, y, r, big) {
    const tone = atomTone(c, sym);
    drawBall(ctx, c, x, y, r, tone);
    say(ctx, c, sym, x, y + 1, { size: big ? 54 : 34, col: inkOn(c, tone) });
  }

  _combo(ctx, c, a) {
    const A = COMBO[this._i], cx = this._panel(ctx, c);
    const r = 78, pr = A.with === 'Cl' ? 62 : 48, d = r + pr - 8;
    for (let i = 0; i < A.n; i++) {
      const ang = -Math.PI / 2 + Math.PI + ((i - (A.n - 1) / 2) * (Math.PI * 2)) / (A.n === 3 ? 3 : 2.4) + Math.PI;
      const u = popIn(a, 0.15 + i * 0.16);
      if (u > 0) this._ball(ctx, c, A.with, CX + Math.cos(ang) * d * Math.max(0.8, u), CY + Math.sin(ang) * d * Math.max(0.8, u), pr, false);
    }
    this._ball(ctx, c, A.sym, CX, CY, r, true);
    formula(ctx, c, A.f, cx, 110, { size: 56 });
    say(ctx, c, 'valency', cx, 232, { size: 30, col: c.labelMuted });
    const u = popIn(a, 0.15 + A.n * 0.16 + 0.1);
    if (u > 0) say(ctx, c, A.n, cx, 330, { size: Math.round(116 * Math.min(1.05, u)), col: c.s2ink });
  }

  _noble(ctx, c, a) {
    NOBLE.forEach((A, i) => {
      at(ctx, A.x, 216, popIn(a, i * 0.14), () => {
        drawAtom(ctx, c, 0, 0, { p: A.p, n: A.n, shells: A.cfg, radius: A.r, nucleusR: A.r * 0.26, er: Math.max(8, A.r * 0.07), focusShell: 'outer', phase: 0.3, solid: i === 0 ? false : undefined });
      });
      say(ctx, c, A.name, A.x, 396, { size: 28 });
      say(ctx, c, A.cfg[A.cfg.length - 1], A.x, 438, { size: 40, col: c.s2ink });
    });
    const p = popIn(a, 0.8);
    if (p > 0) tag(ctx, c, 'valency 0', 340, 488, { bg: c.good, scale: Math.min(1.05, p), size: 26 });
  }

  _move(ctx, c, a) {
    const A = MOVE[this._i], cx = this._panel(ctx, c);
    const u = ease.inOutCubic(clamp01((a - 0.5) / MOVE_S));
    const k = A.cfg.length, last = k - 1;
    const base = { p: A.p, n: A.n, radius: R, nucleusR: 44, er: 12, phase: 0.25, seats: A.d > 0 ? A.cfg.map((_, i) => (i === 0 ? 2 : 8)) : undefined, seed: 2 };
    const before = atomLayout({ ...base, shells: A.cfg });
    const done = u >= 1;
    if (A.d < 0) {
      const inner = before.shells[last - 1].r;
      if (done) drawAtom(ctx, c, CX, CY, { ...base, shells: A.cfg.slice(0, last), radius: inner + 12, focusShell: 'outer', seats: undefined, phase: 0.25 / 2 + 0 });
      else {
        drawAtom(ctx, c, CX, CY, { ...base, shells: [...A.cfg.slice(0, last), 0], focusShell: 'outer' });
        const q = before.shells[last].pts[0];
        drawElectron(ctx, c, CX + q.x + u * 300, CY + q.y - u * 120, 12, { focus: 1 });
      }
    } else {
      const shells = A.cfg.map((v, i) => (i === last ? v + (done ? A.d : 0) : v));
      drawAtom(ctx, c, CX, CY, { ...base, shells, focusShell: 'outer' });
      if (!done) {
        const gaps = before.shells[last].pts.filter((q) => q.empty);
        gaps.slice(0, A.d).forEach((q, i) => {
          const v = ease.inOutCubic(clamp01((a - 0.5 - i * 0.14) / (MOVE_S - 0.14)));
          drawElectron(ctx, c, CX + q.x + (1 - v) * 320, CY + q.y - (1 - v) * 150, 12, { focus: 1 });
        });
      }
    }
    say(ctx, c, A.cfg.join(','), cx, 88, { size: 48 });
    if (done) {
      const end = A.d < 0 ? A.cfg.slice(0, last) : A.cfg.map((v, i) => (i === last ? v + A.d : v));
      say(ctx, c, end.join(','), cx, 158, { size: 48, col: c.s2ink });
      say(ctx, c, `${A.d < 0 ? 'lose' : 'gain'} ${Math.abs(A.d)}`, cx, 238, { size: 36 });
      say(ctx, c, 'valency', cx, 312, { size: 30, col: c.labelMuted });
      say(ctx, c, Math.abs(A.d), cx, 396, { size: 96, col: c.s2ink });
    }
  }

  _share(ctx, c, a) {
    const cx = 340, cy = 246, r = 118, hr = 74, dist = r + hr - 6;
    const dirs = [-0.785, 0.785, 2.356, 3.927];
    drawAtom(ctx, c, cx, cy, { p: 6, n: 6, shells: [2, 0], radius: r, nucleusR: 36, er: 9, phase: 0.2, sym: undefined });
    dirs.forEach((ang, i) => {
      const u = popIn(a, 0.2 + i * 0.22);
      if (u <= 0) return;
      const d = dist * (1 + 0.4 * (1 - Math.min(1, u)));
      const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d;
      drawAtom(ctx, c, x, y, { p: 1, n: 0, shells: [0], radius: hr, nucleusR: 26, er: 8, sym: 'H' });
      tag(ctx, c, 'H', x, y + 48, { size: 22, bg: c.bgSurface });
      if (u >= 1) drawSharedPair(ctx, c, cx, cy, x, y, { at: (r - 4) / d, r: 9, focus: 0.7 });
    });
    const p = popIn(a, 1.3);
    if (p > 0) tag(ctx, c, 'carbon shares 4: valency 4', 340, 488, { scale: Math.min(1.05, p), size: 26 });
  }

  _rule(ctx, c, a) {
    const A = ROUND[this._i], cx = this._panel(ctx, c, this._done ? c.good : undefined);
    at(ctx, CX, CY, Math.min(1.04, Math.max(0.86, popIn(a, 0, 0.4))), () => {
      drawAtom(ctx, c, 0, 0, { p: A.p, n: A.n, shells: A.cfg, radius: R, nucleusR: 44, er: 12, phase: 0.2, focusShell: 'outer', dimInner: true });
    });
    const right = this._right >= 0;
    say(ctx, c, A.name, cx, 72, { size: A.name.length > 8 ? 30 : 34 });
    say(ctx, c, A.cfg.join(','), cx, 136, { size: 54, col: c.s2ink });
    if (right) say(ctx, c, A.a, cx, 214, { size: 40 });
    const y = 330;
    if (right) tag(ctx, c, `valency ${valencyOf(A)}`, cx, y, { bg: c.good, size: 26 });
    else if (this.age - this._said < 1.6) tag(ctx, c, `${A.cfg[A.cfg.length - 1]} valence`, cx, y, { bg: c.bad, size: 24 });
    else tag(ctx, c, `${this._i + 1} of ${ROUND.length}`, cx, y, { size: 24, bg: c.bgSurface });
  }
}
