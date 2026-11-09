// NotationScene - companion to blk-l05-s8, "Two Numbers for Every Atom".
//   b0  z         the learner sets the number of protons: the element changes with it, up to sodium
//   b1  a         sodium's 11 protons stay; the learner adds neutrons until the mass number is 23
//   b2  notation  the symbol with both numbers; the learner picks an element and reads its neutrons
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, font, outBack } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawFocus, drawNucleus } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';

const S_Z = 0, S_A = 1, S_NOTE = 2;
const ELEMENTS = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg'];
const NAMES = ['', 'hydrogen', 'helium', 'lithium', 'beryllium', 'boron', 'carbon', 'nitrogen', 'oxygen', 'fluorine', 'neon', 'sodium', 'magnesium'];
const PICKS = { na: { s: 'Na', z: 11, a: 23 }, c: { s: 'C', z: 6, a: 12 }, he: { s: 'He', z: 2, a: 4 } };

export class NotationScene extends SimScene {
  static BEAT_STEP_MAP = [S_Z, S_A, S_NOTE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'protons', label: 'Protons', min: 1, max: 12, step: 1, value: 1, suffix: '' },
    { type: 'slider', id: 'neutrons', label: 'Neutrons', min: 0, max: 16, step: 1, value: 0, suffix: '' },
    { type: 'segmented', id: 'pick', label: 'Element', value: 'na', options: [
      { value: 'na', label: 'sodium' }, { value: 'c', label: 'carbon' }, { value: 'he', label: 'helium' }] },
  ];
  static ARIA_LABEL = 'You set the number of protons in a nucleus and the name of the element changes with it: 11 protons is sodium. Then you add neutrons to the 11 protons until the mass number reads 23. Last, the symbol of an element with its mass number at the top and its atomic number at the bottom, and the number of neutrons found by subtracting.';

  constructor(container, config) {
    super(container, config);
    this._z = 1; this._n = 0; this._pick = 'na';
    this._foundZ = false;
  }

  enter() {
    this._z = 1; this._n = 0; this._pick = 'na';
    this._foundZ = false;
  }

  isControlHidden(id) {
    return !((id === 'protons' && this.stage === S_Z) || (id === 'neutrons' && this.stage === S_A) || (id === 'pick' && this.stage === S_NOTE));
  }

  getControlValue(id) {
    if (id === 'protons') return String(this._z);
    if (id === 'neutrons') return String(this._n);
    if (id === 'pick') return this._pick;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'protons') this._z = Number(v);
    if (id === 'neutrons') this._n = Number(v);
    if (this.stage === S_Z ? this._z === 11 : this.stage === S_A && this._n === 12) this._find();
    if (id === 'pick') { this._pick = String(v); this._t0 = this.age; }
    this.requestUiUpdate?.();
  }

  // One find per beat: 11 protons is sodium, 23 nucleons is its mass number.
  _find() {
    if (this._foundZ) return;
    this._foundZ = true;
    this.celebrate(196, 230, 30, { key: this.stage === S_Z ? 'z' : 'a', lookAt: true });
  }

  busy() { return this.stage === S_NOTE && this.age < 1; }

  _sym(ctx, c, s, x, y, size, col) {
    ctx.font = font(c, 700, size, true);
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  draw(ctx, c) {
    if (this.stage === S_NOTE) { this._note(ctx, c); return; }
    const z = this.stage === S_Z ? this._z : 11, n = this.stage === S_Z ? z : this._n;
    const R = 62 + 9.5 * Math.sqrt(z + n) * 2.1;
    drawDepthField(ctx, c, { x: 196, y: 230, seed: 13 });
    drawFocus(ctx, c, 196, 230, R, 0.45);
    drawNucleus(ctx, c, 196, 230, { p: z, n, r: Math.min(164, R), seed: 3 });
    if (this.stage === S_Z) {
      this._sym(ctx, c, ELEMENTS[z], 505, 192, 150, z === 11 ? c.good : c.label);
      tag(ctx, c, NAMES[z], 505, 306, { size: 30, bg: z === 11 ? c.good : undefined });
      tag(ctx, c, `Z = ${z}`, 505, 386, { bg: c.proton, size: 40 });
      tag(ctx, c, 'protons', 196, 470, { bg: c.proton });
      return;
    }
    const a = 11 + n, ok = a === 23;
    this._sym(ctx, c, `${a}`, 505, 180, 130, ok ? c.good : c.label);
    tag(ctx, c, 'mass number A', 505, 286, { size: 28 });
    tag(ctx, c, '11 protons', 505, 352, { bg: c.proton });
    tag(ctx, c, `${n} neutrons`, 505, 408, { bg: c.neutron });
    if (!n) tag(ctx, c, 'add neutrons', 196, 470, { bg: c.warning });
    else tag(ctx, c, 'nucleons', 196, 470, {});
  }

  _note(ctx, c) {
    const age = reducedMotion() ? 9 : this.age - (this._t0 ?? 0);
    const P = PICKS[this._pick], u = outBack(clamp01(age / 0.5));
    drawDepthField(ctx, c, { x: 340, y: 210, seed: 2 });
    const x = 400, y = 214;
    this._sym(ctx, c, P.s, x, y, 210, c.label);
    const left = x - (P.s.length > 1 ? 168 : 100);
    tag(ctx, c, String(P.a), left, y - 86, { bg: c.warning, size: 46, scale: u, align: 'right' });
    tag(ctx, c, String(P.z), left, y + 86, { bg: c.proton, size: 46, scale: u, align: 'right' });
    tag(ctx, c, 'mass number', 110, y - 150, { size: 26 });
    tag(ctx, c, 'atomic number', 118, y + 150, { size: 26 });
    tag(ctx, c, `neutrons = ${P.a} - ${P.z} = ${P.a - P.z}`, 340, 472, { bg: c.good, size: 30 });
  }
}
