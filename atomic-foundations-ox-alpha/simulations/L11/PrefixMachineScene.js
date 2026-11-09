// PrefixMachineScene - companion to blk-l11-s7, "Naming Covalent Compounds".
//   b0  rule      change the number of atoms: the molecule and its name change together
//   b1  examples  three formulae: pick the right name
//   b2  hydrogen  three more, for hydrogen first and the old names
//   b3  cross     write the symbols and valencies, then cross them over: HCl, H2S, CCl4
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, drawCard, font, lerp } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawMolecule } from 'simulations/base/kit/SimAtom.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { button, formula, hit, popIn, say, tag, chipInk } from '../L10/IonBenchKit.js';

const S_RULE = 0, S_EX = 1, S_H = 2, S_CROSS = 3;
const NAMES = [
  { f: 'CO', mid: 'C', out: 'O', order: 3, first: 'carbon ', pre: 'mon', rest: 'oxide' },
  { f: 'CO_2', mid: 'C', out: 'O', order: 2, first: 'carbon ', pre: 'di', rest: 'oxide' },
  { f: 'PCl_3', mid: 'P', out: 'Cl', order: 1, first: 'phosphorus ', pre: 'tri', rest: 'chloride' },
  { f: 'CCl_4', mid: 'C', out: 'Cl', order: 1, first: 'carbon ', pre: 'tetra', rest: 'chloride' },
  { f: 'PCl_5', mid: 'P', out: 'Cl', order: 1, first: 'phosphorus ', pre: 'penta', rest: 'chloride' },
  { f: 'SF_6', mid: 'S', out: 'F', order: 1, first: 'sulfur ', pre: 'hexa', rest: 'fluoride' },
];
const CHIPS = ['mono', 'di', 'tri', 'tetra', 'penta', 'hexa'];
const QUIZ = {
  [S_EX]: [
    { f: 'CO', opts: ['monocarbon monoxide', 'carbon monoxide', 'carbon monooxide'], ok: 1, why: 'no mono- on the first element' },
    { f: 'CS_2', opts: ['carbon disulfide', 'monocarbon disulfide', 'carbon sulfide'], ok: 0, why: 'di- counts the two sulfur atoms' },
    { f: 'N_2O_4', opts: ['nitrogen tetroxide', 'dinitrogen tetraoxide', 'dinitrogen tetroxide'], ok: 2, why: 'two nitrogen, and tetra drops its a' },
  ],
  [S_H]: [
    { f: 'H_2S', opts: ['dihydrogen sulfide', 'hydrogen sulfide', 'hydrogen disulfide'], ok: 1, why: 'hydrogen first takes no prefix' },
    { f: 'H_2O', opts: ['dihydrogen oxide', 'hydrogen oxide', 'water'], ok: 2, why: 'known by its common name' },
    { f: 'NH_3', opts: ['ammonia', 'trihydrogen nitride', 'nitrogen hydride'], ok: 0, why: 'known by its common name' },
  ],
};
const CROSS = [
  { l: 'H', r: 'Cl', ln: 1, rn: 1, f: 'HCl' },
  { l: 'H', r: 'S', ln: 1, rn: 2, f: 'H_2S' },
  { l: 'C', r: 'Cl', ln: 4, rn: 1, f: 'CCl_4' },
];
const XL = 200, XR = 480, Y_S = 110, Y_N = 214, Y_F = 400, FLY = 0.8;
const ROWY = [190, 276, 362], ROWH = 66;

function star(n, e) {
  const atoms = [{ sym: e.mid, x: 0, y: 0, r: 1 }], bonds = [];
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0 : -Math.PI / 2 + Math.PI / n + (i * 2 * Math.PI) / n;
    atoms.push({ sym: e.out, x: Math.cos(a) * 2.5, y: Math.sin(a) * 2.5, r: 0.82 });
    bonds.push([0, i + 1, e.order]);
  }
  return { atoms, bonds };
}

export class PrefixMachineScene extends SimScene {
  static BEAT_STEP_MAP = [S_RULE, S_EX, S_H, S_CROSS].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'n', label: 'Atoms of the second element', min: 1, max: 6, step: 1, value: 2, suffix: '' },
    { type: 'segmented', id: 'pick', label: 'Your answer', value: '', options: [{ value: '0', label: 'A' }, { value: '1', label: 'B' }, { value: '2', label: 'C' }] },
    { type: 'button', id: 'cross', label: 'Cross the numbers' },
  ];
  static ARIA_LABEL = 'A molecule and its name: as you change the number of atoms, the prefix in the name changes with it, from mono to '
    + 'hexa. Next, three formulae with three names each, and you pick the right one. Next, three more, with hydrogen first and with '
    + 'old names. Last, write the symbols and valencies and cross them over to get HCl, H2S and CCl4.';

  constructor(container, config) {
    super(container, config);
    this._reset();
  }

  _reset() {
    this._n = 2; this._nAt = -9; this._seen = new Set([2]); this._found = false; this._foundAt = -9;
    this._q = 0; this._bad = -1; this._hit = -1; this._hitAt = -9;
    this._case = 0; this._crossAt = -9; this._rows = [];
  }

  enter() { this._reset(); this.requestUiUpdate?.(); }

  isControlHidden(id) { return id === 'n' ? this.stage !== S_RULE : id === 'pick' ? (this.stage !== S_EX && this.stage !== S_H) : this.stage !== S_CROSS; }
  isControlDisabled(id) { return id === 'cross' ? this._found : false; }
  getControlValue(id) { return id === 'n' ? this._n : id === 'pick' ? '' : undefined; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'n') {
      this._n = Math.round(Number(v)); this._nAt = this.age; this._seen.add(this._n);
      if (this._seen.size >= 4 && !this._found) {
        this._found = true;
        this.celebrate(340, 410, 26, { key: 'prefix-counts', lookAt: 'scene' });
      }
    }
    if (id === 'pick' && v !== '') this._answer(Number(v));
    if (id === 'cross') this._crossNext();
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _answer(i) {
    const list = QUIZ[this.stage], q = list?.[this._q];
    if (!q || this._hit >= 0) return;
    if (i === q.ok) {
      this._hit = i; this._hitAt = this.age; this._bad = -1;
      if (this._q === list.length - 1 && !this._found) {
        this._found = true;
        this._foundAt = this.age;
        this.celebrate(340, ROWY[i], 26, { key: `names-${this.stage}`, lookAt: 'scene' });
      } else {
        this.after(1.5, () => { this._q += 1; this._hit = -1; this._hitAt = this.age; this.requestUiUpdate?.(); });
      }
    } else {
      this._bad = i;
      this.oops(340, ROWY[i] + ROWH / 2);
    }
  }

  _crossNext() {
    if (this._crossAt < 0) { this._crossAt = this.age; this.after(FLY, () => this._landed()); return; }
    if (this.age - this._crossAt < FLY) return;
    if (this._case < CROSS.length - 1) { this._case += 1; this._crossAt = -9; }
  }

  _landed() {
    if (this._case === CROSS.length - 1 && !this._found) {
      this._found = true;
      this.celebrate(340, Y_F, 28, { key: 'cross-valencies', lookAt: 'scene' });
    }
    this.requestUiUpdate?.();
  }

  busy() {
    if (this.age < 0.9 || this.age - this._nAt < 0.5 || this.age - this._hitAt < 0.5) return true;
    return this._crossAt >= 0 && this.age - this._crossAt < FLY + 0.2;
  }

  pointerDown(p) {
    if (this.stage === S_EX || this.stage === S_H) {
      const b = hit(this._rows, p);
      if (b) this._answer(b.i);
      this.requestUiUpdate?.();
    }
    if (this.stage === S_CROSS) { this._crossNext(); this.requestUiUpdate?.(); }
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 220, seed: 15, n: 10 });
    if (this.stage === S_RULE) this._rule(ctx, c);
    if (this.stage === S_EX || this.stage === S_H) this._quiz(ctx, c);
    if (this.stage === S_CROSS) this._cross(ctx, c);
  }

  _rule(ctx, c) {
    const e = NAMES[this._n - 1], k = popIn(this.age - this._nAt, 0, 0.3);
    drawMolecule(ctx, c, 340, 188, { ...star(this._n, e), r: 150 * Math.max(0.6, k), profile: 'rich' });
    formula(ctx, c, e.f, 70, 56, { size: 48, align: 'left' });
    const size = 40, parts = [[e.first, c.label], [e.pre, c.warning], [e.rest, c.label]];
    ctx.save();
    ctx.font = font(c, 700, size, true);
    const widths = parts.map((q) => ctx.measureText(q[0]).width);
    ctx.restore();
    let x = 340 - widths.reduce((a, b) => a + b, 0) / 2;
    parts.forEach((q, i) => { say(ctx, c, q[0], x, 392, { size, align: 'left', col: q[1] }); x += widths[i]; });
    CHIPS.forEach((t, i) => {
      const on = i === this._n - 1, cx = 62 + i * 111;
      tag(ctx, c, `${t}-`, cx, 468, { bg: on ? c.warning : c.raised, size: 24 });
      say(ctx, c, i + 1, cx, 430, { size: 24, col: on ? c.warning : c.labelMuted });
    });
  }

  _quiz(ctx, c) {
    const list = QUIZ[this.stage], q = list[this._q];
    this._rows = [];
    formula(ctx, c, q.f, 340, 92, { size: 84 });
    say(ctx, c, `${this._q + 1} of ${list.length}`, 650, 36, { size: 24, align: 'right', col: c.labelMuted });
    q.opts.forEach((t, i) => {
      const k = popIn(this.age - this._hitAt, i * 0.06, 0.3);
      const on = this._hit === i, bad = this._bad === i;
      const b = button(ctx, c, `${'ABC'[i]}   ${t}`, 60, ROWY[i], 560, ROWH, { size: 30, bg: on ? c.good : bad ? c.bad : c.raised, ink: on || bad ? undefined : c.label, off: k < 0.6 });
      this._rows.push({ ...b, i });
    });
    if (this._hit >= 0) tag(ctx, c, q.why, 340, 472, { bg: c.good, scale: popIn(this.age - this._hitAt, 0, 0.3) });
    else if (this._bad >= 0) tag(ctx, c, 'look again at the rule', 340, 472, { bg: c.bad });
    else tag(ctx, c, 'pick the right name', 340, 472, { bg: c.warning, scale: popIn(this.age, 0.4) });
  }

  _cross(ctx, c) {
    const e = CROSS[this._case], go = this._crossAt >= 0;
    const u = go ? (reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._crossAt) / FLY))) : 0;
    drawCard(ctx, c, 60, 26, 560, 256, 1, {});
    say(ctx, c, e.l, XL, Y_S, { size: 96 });
    say(ctx, c, e.r, XR, Y_S, { size: 96 });
    say(ctx, c, 'valency', 340, 58, { size: 24, col: c.labelMuted });
    const fx = (from, to, y0) => ({ x: lerp(from, to, u), y: lerp(y0, Y_F + 20, u) - Math.sin(u * Math.PI) * 30 });
    const shown = u >= 1;
    const a = fx(XL, XR + 60, Y_N), b = fx(XR, XL + 60, Y_N);
    tag(ctx, c, e.ln, XL, Y_N, { bg: c.raised, size: 36 });
    tag(ctx, c, e.rn, XR, Y_N, { bg: c.raised, size: 36 });
    if (go && !shown) {
      tag(ctx, c, e.ln, a.x, a.y, { bg: c.warning, ink: chipInk(c, c.warning), size: 36 });
      tag(ctx, c, e.rn, b.x, b.y, { bg: c.warning, ink: chipInk(c, c.warning), size: 36 });
    } else if (shown) {
      formula(ctx, c, e.f, 340, Y_F, { size: 92, col: c.good });
      const more = this._case < CROSS.length - 1;
      if (more) tag(ctx, c, 'tap for the next one', 340, 482, { bg: c.warning, size: 24 });
      else tag(ctx, c, 'a valency of 1 is not written', 340, 482, { bg: c.raised, size: 24 });
    }
    if (!go) tag(ctx, c, 'tap to cross the numbers', 340, 340, { bg: c.warning, scale: popIn(this.age, 0.4) });
    say(ctx, c, `${this._case + 1} of ${CROSS.length}`, 650, 300, { size: 24, align: 'right', col: c.labelMuted });
  }
}
