// ChlorineTwinsScene - companion to blk-l13-s1, "Not All Chlorine Atoms Are the Same".
//   b0  unit      one balance, four things: a sack in kg, a grain in mg, atoms in u
//   b1  isotopes  chlorine-35: add 2 neutrons and it is still chlorine; add a proton and it is not
//   b2  others    hydrogen's and carbon's three isotopes
//   b3  same      chlorine-35 and -37 side by side: compare electrons, then nuclei
// The atom on a balance in b0 is a picture only: no balance can weigh one, and the scene says so.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard, drawShadow, mix, darken, ellipse } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { say, tag, popIn } from '../L07/AtomBoard.js';
import { drawDigitalBalance } from '../L02/BalanceKit.js';

const S_UNIT = 0, S_ISO = 1, S_OTHERS = 2, S_SAME = 3;
const BENCH = 470;
const THINGS = [
  { id: 'sack', label: 'sack of wheat', read: '50 kg' },
  { id: 'grain', label: 'one grain', read: '40 mg' },
  { id: 'H', label: 'hydrogen atom', read: '1 u' },
  { id: 'O', label: 'oxygen atom', read: '16 u' },
];
const SETS = {
  hydrogen: { p: 1, shells: [1], list: [['protium', 0], ['deuterium', 1], ['tritium', 2]], e: '1 electron each' },
  carbon: { p: 6, shells: [2, 4], list: [['carbon-12', 6], ['carbon-13', 7], ['carbon-14', 8]], e: '6 electrons each' },
};

export class ChlorineTwinsScene extends SimScene {
  static BEAT_STEP_MAP = [S_UNIT, S_ISO, S_OTHERS, S_SAME].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'thing', label: 'On the balance', options: [{ value: 'sack', label: 'Sack' }, { value: 'grain', label: 'Grain' }, { value: 'H', label: 'H atom' }, { value: 'O', label: 'O atom' }], value: 'sack' },
    { type: 'button', id: 'neutron', label: 'Add a neutron' },
    { type: 'button', id: 'proton', label: 'Add a proton' },
    { type: 'button', id: 'again', label: 'Start again' },
    { type: 'segmented', id: 'set', label: 'Element', options: [{ value: 'hydrogen', label: 'Hydrogen' }, { value: 'carbon', label: 'Carbon' }], value: 'hydrogen' },
    { type: 'segmented', id: 'part', label: 'Compare', options: [{ value: 'e', label: 'Electrons' }, { value: 'n', label: 'Nuclei' }], value: 'e' },
  ];
  static ARIA_LABEL = 'A sack of wheat is weighed in kilograms and a grain in milligrams. An atom needs a smaller unit, u: hydrogen is 1 u '
    + 'and oxygen 16 u. A chlorine atom with 17 protons and 18 neutrons gains two neutrons and is still chlorine, now chlorine-37. Adding a '
    + 'proton makes it a different element, argon. Hydrogen has three isotopes and carbon has three. Chlorine-35 and chlorine-37 have the '
    + 'same electrons and different nuclei.';

  constructor(container, config) {
    super(container, config);
    this._reset();
  }

  _reset() {
    this._thing = 'sack';
    this._p = 17; this._n = 18;
    this._bumpAt = -9;
    this._set = 'hydrogen';
    this._part = 'e';
    this._seen = { e: true };
  }

  enter() { this._reset(); }
  busy() { return !reducedMotion() && (this.age < 1 || this.age - this._bumpAt < 0.6); }

  isControlHidden(id) {
    const on = { thing: S_UNIT, neutron: S_ISO, proton: S_ISO, again: S_ISO, set: S_OTHERS, part: S_SAME };
    return on[id] !== this.stage;
  }
  isControlDisabled(id) {
    if (id === 'neutron') return this._n >= 20 || this._p > 17;
    if (id === 'proton') return this._n < 20 || this._p > 17;
    return false;
  }
  getControlValue(id) {
    if (id === 'thing') return this._thing;
    if (id === 'set') return this._set;
    if (id === 'part') return this._part;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'thing') { this._thing = v; this._bumpAt = this.age; }
    if (id === 'set') { this._set = v; this._bumpAt = this.age; }
    if (id === 'part') this._compare(v);
    if (id === 'neutron') this._addN();
    if (id === 'proton') this._addP();
    if (id === 'again') { this._p = 17; this._n = 18; this._bumpAt = this.age; }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_ISO) {
      if (Math.hypot(p.x - 214, p.y - 258) > 96) return;
      if (this._n < 20) this._addN(); else if (this._p === 17) this._addP();
    }
    if (this.stage === S_SAME) this._compare(this._part === 'e' ? 'n' : 'e');
    if (this.stage === S_UNIT) {
      const i = THINGS.findIndex((q) => q.id === this._thing);
      this._thing = THINGS[(i + 1) % 4].id;
      this._bumpAt = this.age;
    }
    this.requestUiUpdate?.();
  }

  _addN() {
    this._n += 1;
    this._bumpAt = this.age;
    if (this._n === 20) this.celebrate(214, 258, 30, { key: 'still-chlorine', lookAt: 'scene' });
  }

  _addP() {
    this._p += 1;
    this._bumpAt = this.age;
    this.celebrate(552, 96, 20, { key: 'a-new-element', lookAt: 'scene', small: true });
  }

  _compare(v) {
    this._part = v;
    this._seen[v] = true;
    if (this._seen.e && this._seen.n && !this._seen.done) {
      this._seen.done = true;
      this.celebrate(340, 480, 24, { key: 'same-electrons', lookAt: 'scene' });
    }
  }

  draw(ctx, c) {
    if (this.stage === S_UNIT) {
      drawBackdrop(ctx, c, 'dots');
      drawFloor(ctx, c, BENCH + 34);
      drawBench(ctx, c, 14, 666, BENCH);
      this._unit(ctx, c);
      return;
    }
    drawDepthField(ctx, c, { x: 300, y: 250, seed: 18, n: 8 });
    if (this.stage === S_ISO) this._iso(ctx, c);
    else if (this.stage === S_OTHERS) this._others(ctx, c);
    else this._same(ctx, c);
  }

  _unit(ctx, c) {
    const q = THINGS.find((t) => t.id === this._thing);
    const y = drawDigitalBalance(ctx, c, 340, BENCH, q.read, 'live', { w: 400 });
    const p = Math.min(1.04, popIn(this.age, this._bumpAt, 0.35));
    ctx.save();
    ctx.translate(340, y); ctx.scale(p, p);
    if (q.id === 'sack') this._sack(ctx, c);
    else if (q.id === 'grain') this._grainOfWheat(ctx, c);
    else if (q.id === 'H') drawAtom(ctx, c, 0, -148, { p: 1, n: 0, shells: [1], radius: 132, nucleusR: 38, er: 15 });
    else drawAtom(ctx, c, 0, -146, { p: 8, n: 8, shells: [2, 6], radius: 136, nucleusR: 44, er: 12 });
    ctx.restore();
    tag(ctx, c, q.label, 340, 34, { size: 30 });
    if (q.id === 'H' || q.id === 'O') tag(ctx, c, 'a picture: no balance can weigh one', 340, 84, { size: 24 });
  }

  _sack(ctx, c) {
    const base = mix(c.s2, c.waste, 0.55), dk = darken(base, 0.26);
    ctx.beginPath();
    ctx.moveTo(-104, 0); ctx.quadraticCurveTo(-140, -130, -78, -230);
    ctx.quadraticCurveTo(0, -254, 78, -230); ctx.quadraticCurveTo(140, -130, 104, 0); ctx.closePath();
    ctx.fillStyle = base; ctx.fill();
    ctx.strokeStyle = dk; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-50, -232); ctx.quadraticCurveTo(0, -210, 50, -232); ctx.lineTo(62, -272); ctx.quadraticCurveTo(0, -290, -62, -272); ctx.closePath();
    ctx.fillStyle = mix(base, c.label, 0.12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = dk;
    ctx.fillRect(-58, -236, 116, 10);
  }

  _grainOfWheat(ctx, c) {
    const base = mix(c.s2, c.s8, 0.4);
    drawShadow(ctx, c, 0, -2, 60, 6);
    ellipse(ctx, 0, -46, 92, 44, -0.08); ctx.fillStyle = base; ctx.fill();
    ctx.strokeStyle = darken(base, 0.34); ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-78, -40); ctx.quadraticCurveTo(0, -30, 84, -56);
    ctx.strokeStyle = darken(base, 0.26); ctx.lineWidth = 5; ctx.stroke();
  }

  _iso(ctx, c) {
    const argon = this._p > 17, X = 214, Y = 258;
    drawAtom(ctx, c, X, Y, { p: this._p, n: this._n, shells: argon ? [2, 8, 8] : [2, 8, 7], radius: 196, nucleusR: 84, er: 10, seed: 5, phase: 0.2 });
    const x = 430, w = 236, cx = x + w / 2;
    drawCard(ctx, c, x, 18, w, 484, 1, { accent: argon ? c.bad : c.good });
    say(ctx, c, argon ? 'argon' : 'chlorine', cx, 72, { size: 40, col: argon ? c.bad : c.good });
    if (!argon) say(ctx, c, `chlorine-${17 + this._n}`, cx, 122, { size: 26, col: c.labelMuted });
    else say(ctx, c, 'a new element', cx, 122, { size: 26, col: c.labelMuted });
    const row = (k, label, v, col) => {
      say(ctx, c, label, x + 18, 192 + k * 70, { align: 'left', size: 26 });
      say(ctx, c, v, x + w - 18, 192 + k * 70, { align: 'right', size: 42, col });
    };
    row(0, 'protons', this._p, c.proton);
    row(1, 'neutrons', this._n, c.neutron);
    row(2, 'mass no.', this._p + this._n);
    if (this._n < 20) tag(ctx, c, 'tap: add a neutron', cx, 440, { bg: c.warning, size: 24 });
    else if (!argon) tag(ctx, c, 'tap: add a proton', cx, 440, { bg: c.warning, size: 24 });
  }

  _others(ctx, c) {
    const S = SETS[this._set], R = 96;
    S.list.forEach(([name, n], i) => {
      const x = 118 + i * 222, p = Math.min(1.05, popIn(this.age, this._bumpAt + i * 0.08, 0.35));
      ctx.save();
      ctx.translate(x, 196); ctx.scale(p, p);
      drawAtom(ctx, c, 0, 0, { p: S.p, n, shells: S.shells, radius: R, nucleusR: S.p === 1 ? 36 : 40, er: 9, seed: 2 + n });
      ctx.restore();
      say(ctx, c, name, x, 336, { size: 30 });
      say(ctx, c, `${n} neutron${n === 1 ? '' : 's'}`, x, 382, { size: 26, col: c.labelMuted });
    });
    tag(ctx, c, S.e, 340, 450, { size: 28 });
  }

  _same(ctx, c) {
    const e = this._part === 'e';
    [[176, 18, 'chlorine-35'], [504, 20, 'chlorine-37']].forEach(([x, n, name]) => {
      drawAtom(ctx, c, x, 220, { p: 17, n, shells: [2, 8, 7], radius: 148, nucleusR: 62, er: 8, seed: 5, phase: 0.2, focusShell: e ? 'outer' : undefined, dimInner: false });
      say(ctx, c, name, x, 402, { size: 30 });
      say(ctx, c, e ? '2, 8, 7' : `${n} neutrons`, x, 444, { size: 28, col: e ? c.electron : c.neutron });
    });
    say(ctx, c, e ? '=' : '\u2260', 340, 220, { size: 64, col: e ? c.good : c.bad });
    tag(ctx, c, e ? 'same chemical properties' : 'different mass', 340, 490, { size: 26, bg: e ? c.good : c.raised });
  }
}
