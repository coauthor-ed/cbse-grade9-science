// ProtonCardScene - companion to blk-l05-s1, "Inside the Nucleus".
//   b0  proton    a proton and an electron, side by side: equal and opposite charge, very unequal in mass
//   b1  balance   a sodium nucleus with no electrons: the learner adds electrons until the charge reads 0
//   b2  hydrogen  hydrogen, one proton and one electron, beside helium with two protons and a question
// The proton is drawn only about 8 times wider than the electron; the mass is what differs, and the
// chip says by how much. Shell positions on b1 are not named yet: L06 and L07 teach them.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, inkOn, outBack } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawCharge, drawDepthField, drawElectron, drawFocus, drawNucleon } from 'simulations/base/kit/SimAtom.js';
import { LBL, tag } from '../L04/AtomLabels.js';

const S_CARD = 0, S_BALANCE = 1, S_HYDROGEN = 2;
const NA = { x: 340, y: 232 };
const FILL = [[0], [1], [2], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 8, 1]];

export class ProtonCardScene extends SimScene {
  static BEAT_STEP_MAP = [S_CARD, S_BALANCE, S_HYDROGEN].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'add', label: 'Add an electron' },
    { type: 'button', id: 'reset', label: 'Start again' },
  ];
  static ARIA_LABEL = 'A big proton with a charge of plus one beside a small electron with a charge of minus one. Then a sodium nucleus with 11 protons and no electrons: you add electrons until the charge reads zero, which takes 11. Then a hydrogen atom, with one proton and one electron, stands beside a helium atom with two protons and a question about its mass.';

  constructor(container, config) {
    super(container, config);
    this._e = 0;
    this._found = false;
  }

  enter() {
    this._e = 0;
    this._found = false;
  }

  isControlHidden(id) { return this.stage !== S_BALANCE || (id === 'reset' && this._e === 0); }
  isControlDisabled(id) { return id === 'add' && this._e >= 11; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'add') this._add();
    if (id === 'reset') { this._e = 0; this.requestUiUpdate?.(); }
  }

  _add() {
    if (this._e >= 11) return;
    this._e += 1;
    this._popAt = this.age;
    if (this._e === 11 && !this._found) {
      this._found = true;
      this.celebrate(NA.x, NA.y, 30, { key: 'neutral', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_BALANCE && Math.hypot(p.x - NA.x, p.y - NA.y) < 200) this._add();
  }

  busy() { return this.age < 1; }

  draw(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const u = outBack(clamp01(age / 0.5));
    if (this.stage === S_CARD) {
      drawDepthField(ctx, c, { x: 250, y: 240, seed: 3 });
      drawFocus(ctx, c, 250, 232, Math.max(1, 150 * u), 0.7);
      drawNucleon(ctx, c, 250, 232, Math.max(4, 150 * u), 'proton');
      const v = outBack(clamp01((age - 0.35) / 0.5));
      drawElectron(ctx, c, 545, 232, Math.max(4, 26 * v));
      if (v > 0.5) drawCharge(ctx, c, 545, 232, 26, -1, inkOn(c, c.electron));
      tag(ctx, c, 'proton: +1', 250, 440, { bg: c.proton, size: 30 });
      tag(ctx, c, 'electron: -1', 545, 310, { bg: c.electron, size: 26 });
      tag(ctx, c, 'about 1836 times heavier', 250, 490, { size: LBL });
      return;
    }
    if (this.stage === S_BALANCE) {
      const net = 11 - this._e;
      drawDepthField(ctx, c, { x: NA.x, y: NA.y, seed: 6 });
      const shells = FILL[this._e];
      drawAtom(ctx, c, NA.x, NA.y, { shells, seats: undefined, p: 11, n: 12, radius: 190, nucleusR: 62, er: 13, seed: 2 });
      tag(ctx, c, net ? `charge: +${net}` : 'charge: 0', NA.x, 468, { bg: net ? c.proton : c.good, size: 34 });
      tag(ctx, c, `${this._e} of 11`, 96, 40, {});
      if (!this._e) tag(ctx, c, 'tap to add electrons', 500, 40, { bg: c.warning });
      return;
    }
    drawDepthField(ctx, c, { x: 340, y: 230, seed: 5 });
    const k = outBack(clamp01(age / 0.5));
    drawAtom(ctx, c, 180, 222, { shells: [1], p: 1, n: 0, radius: Math.max(24, 142 * k), nucleusR: 44, er: 14 });
    drawAtom(ctx, c, 500, 222, { shells: [2], p: 2, n: 0, radius: Math.max(24, 142 * k), nucleusR: 44, er: 14, seed: 3 });
    tag(ctx, c, 'hydrogen', 180, 412, { size: 28 });
    tag(ctx, c, 'helium', 500, 412, { size: 28 });
    const v = clamp01((age - 0.5) / 0.4);
    ctx.save();
    ctx.globalAlpha *= v;
    tag(ctx, c, '1 proton', 180, 466, { bg: c.proton });
    tag(ctx, c, '2 protons: how heavy?', 490, 466, { bg: c.warning });
    ctx.restore();
  }
}
