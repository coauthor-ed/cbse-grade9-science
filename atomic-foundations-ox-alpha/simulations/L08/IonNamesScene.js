// IonNamesScene - companion to blk-l08-s8, "Naming Ionic Compounds".
//   b0  names       choose a metal and a non-metal: the two ions and the compound's name
//   b1  two-ions    choose Fe2+, Fe3+, Cu+ or Cu2+: the name says which charge
//   b2  polyatomic  choose a polyatomic ion: a group of atoms with one charge between them
//   b3  table       four rounds: two ions and two names. The learner taps the right name.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { drawDepthField, drawIon, drawMolecule } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, formula, button, hit, at } from '../L07/AtomBoard.js';

const S_NAMES = 0, S_TWO = 1, S_POLY = 2, S_TABLE = 3;
const METALS = { Na: { name: 'sodium', q: 1 }, Ca: { name: 'calcium', q: 2 }, Mg: { name: 'magnesium', q: 2 } };
const NONS = { Cl: { name: 'chlorine', ion: 'chloride', q: -1 }, O: { name: 'oxygen', ion: 'oxide', q: -2 }, S: { name: 'sulfur', ion: 'sulfide', q: -2 } };
const FORMULA = { NaCl: 'NaCl', NaO: 'Na_2O', NaS: 'Na_2S', CaCl: 'CaCl_2', CaO: 'CaO', CaS: 'CaS', MgCl: 'MgCl_2', MgO: 'MgO', MgS: 'MgS' };
const TWO = [
  { id: 'Fe2+', sym: 'Fe', q: 2, name: 'ferrous', root: 'ferr', end: 'ous', col: 'small' },
  { id: 'Fe3+', sym: 'Fe', q: 3, name: 'ferric', root: 'ferr', end: 'ic', col: 'large' },
  { id: 'Cu+', sym: 'Cu', q: 1, name: 'cuprous', root: 'cupr', end: 'ous', col: 'small' },
  { id: 'Cu2+', sym: 'Cu', q: 2, name: 'cupric', root: 'cupr', end: 'ic', col: 'large' },
];
const ring = (centre, out, n, d, a0 = -Math.PI / 2) => [
  { sym: centre, x: 0, y: 0 },
  ...Array.from({ length: n }, (_, i) => ({ sym: out, x: Math.cos(a0 + (i * Math.PI * 2) / n) * d, y: Math.sin(a0 + (i * Math.PI * 2) / n) * d })),
];
const spokes = (n) => Array.from({ length: n }, (_, i) => [0, i + 1, 1]);
const POLY = [
  { id: 'OH', f: 'OH^-', q: -1, name: 'hydroxide', atoms: [{ sym: 'O', x: -0.7, y: 0 }, { sym: 'H', x: 0.95, y: 0 }], bonds: [[0, 1, 1]] },
  { id: 'NO3', f: 'NO_3^-', q: -1, name: 'nitrate', atoms: ring('N', 'O', 3, 1.75), bonds: spokes(3) },
  { id: 'HCO3', f: 'HCO_3^-', q: -1, name: 'hydrogencarbonate', atoms: [...ring('C', 'O', 3, 1.75), { sym: 'H', x: 2.75, y: 1.5 }], bonds: [...spokes(3), [2, 4, 1]] },
  { id: 'CO3', f: 'CO_3^2-', q: -2, name: 'carbonate', atoms: ring('C', 'O', 3, 1.75), bonds: spokes(3) },
  { id: 'SO4', f: 'SO_4^2-', q: -2, name: 'sulfate', atoms: ring('S', 'O', 4, 1.85, -Math.PI / 4), bonds: spokes(4) },
  { id: 'NH4', f: 'NH_4^+', q: 1, name: 'ammonium', atoms: ring('N', 'H', 4, 1.45, -Math.PI / 4), bonds: spokes(4) },
];
const ROUND = [
  { a: 'Mg^2+', b: 'S^2-', A: 'magnesium sulfide', B: 'magnesium sulfate', ok: 'A' },
  { a: 'Fe^3+', b: 'Cl^-', A: 'ferrous chloride', B: 'ferric chloride', ok: 'B' },
  { a: 'Na^+', b: 'OH^-', A: 'sodium hydroxide', B: 'sodium oxide', ok: 'A' },
  { a: 'Cu^2+', b: 'SO_4^2-', A: 'cuprous sulfate', B: 'cupric sulfate', ok: 'B' },
];

export class IonNamesScene extends SimScene {
  static BEAT_STEP_MAP = [S_NAMES, S_TWO, S_POLY, S_TABLE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'metal', label: 'Metal', value: 'Ca', options: Object.keys(METALS) },
    { type: 'segmented', id: 'non', label: 'Non-metal', value: 'O', options: Object.keys(NONS) },
    { type: 'segmented', id: 'two', label: 'Ion', value: 'Fe2+', options: TWO.map((T) => ({ value: T.id, label: T.id })) },
    { type: 'select', id: 'poly', label: 'Ion', value: 'SO4', options: POLY.map((P) => ({ value: P.id, label: P.name })) },
    { type: 'button', id: 'A', label: 'Top name' },
    { type: 'button', id: 'B', label: 'Bottom name' },
  ];
  static ARIA_LABEL =
    'Naming ionic compounds. Choose a metal and a non-metal: the cation is named first and the anion ends in '
    + 'ide, as in calcium oxide. Choose an ion of iron or copper: Fe 2 plus is ferrous, Fe 3 plus is ferric, Cu '
    + 'plus is cuprous and Cu 2 plus is cupric. Choose a polyatomic ion to see a group of atoms with one charge '
    + 'between them. Last, four pairs of ions, and you tap the right name for each.';

  constructor(container, config) {
    super(container, config);
    this._metal = 'Ca'; this._non = 'O'; this._two = 'Fe2+'; this._poly = 'SO4';
    this._i = 0;
    this._at = 0;
    this._right = -9;
    this._miss = -9;
    this._done = false;
    this._boxes = [];
  }

  enter() {
    this._i = 0;
    this._at = this.age;
    this._right = -9;
    this._miss = -9;
    this._done = false;
  }

  busy() { return this.age - this._at < 1 || (this._right >= 0 && this.age - this._right < 1.3); }

  isControlHidden(id) {
    if (id === 'metal' || id === 'non') return this.stage !== S_NAMES;
    if (id === 'two') return this.stage !== S_TWO;
    if (id === 'poly') return this.stage !== S_POLY;
    return this.stage !== S_TABLE;
  }

  isControlDisabled(id) { return (id === 'A' || id === 'B') && (this._right >= 0 || this._done); }

  getControlValue(id) { return { metal: this._metal, non: this._non, two: this._two, poly: this._poly }[id] ?? super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this.animateFor?.();
    if (id === 'A' || id === 'B') { this._answer(id); }
    else if (this._valid(id, v)) { this[`_${id}`] = v; this._at = this.age; }
    this.requestUiUpdate?.();
  }

  _valid(id, v) {
    if (id === 'metal') return v in METALS;
    if (id === 'non') return v in NONS;
    return (id === 'two' ? TWO : POLY).some((T) => T.id === v);
  }

  pointerDown(p) {
    if (this.stage !== S_TABLE) return;
    const box = hit(this._boxes, p);
    if (box) { this.animateFor?.(); this._answer(box.id); this.requestUiUpdate?.(); }
  }

  _answer(id) {
    if (this._right >= 0 || this._done) return;
    if (id !== ROUND[this._i].ok) { this._miss = this.age; this.oops(340, 150); return; }
    this._miss = -9;
    this._right = this.age;
    if (this._i === ROUND.length - 1) {
      this._done = true;
      this.celebrate(340, 150, 28, { key: 'ion-names', lookAt: 'scene' });
    }
  }

  update() {
    if (this.stage === S_TABLE && this._right >= 0 && !this._done && this.age - this._right >= 1.1) {
      this._i += 1;
      this._right = -9;
      this._at = this.age;
      this.requestUiUpdate?.();
    }
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 210, seed: 14, n: 8 });
    this._boxes = [];
    [this._names, this._twoIons, this._polyatomic, this._table][this.stage].call(this, ctx, c, this.age - this._at);
  }

  _names(ctx, c, a) {
    const M = METALS[this._metal], N = NONS[this._non];
    const s = Math.min(1.04, Math.max(0.8, popIn(a, 0, 0.4)));
    at(ctx, 190, 168, s, () => drawIon(ctx, c, 0, 0, { sym: this._metal, charge: M.q, r: 96 }));
    at(ctx, 490, 168, s, () => drawIon(ctx, c, 0, 0, { sym: this._non, charge: N.q, r: 122 }));
    say(ctx, c, M.name, 190, 326, { size: 34 });
    say(ctx, c, N.ion, 490, 326, { size: 34, col: c.s2ink });
    say(ctx, c, `${M.name} ${N.ion}`, 340, 398, { size: 50 });
    formula(ctx, c, FORMULA[this._metal + this._non], 170, 472, { size: 42 });
    tag(ctx, c, `${N.name} to ${N.ion}`, 470, 472, { size: 26 });
  }

  _twoIons(ctx, c, a) {
    const T = TWO.find((t) => t.id === this._two);
    const big = T.col === 'large';
    at(ctx, 214, 240, Math.min(1.04, Math.max(0.8, popIn(a, 0, 0.4))), () => drawIon(ctx, c, 0, 0, { sym: T.sym, charge: T.q, r: 138 }));
    const { x, w } = { x: 400, w: 266 }, cx = x + w / 2;
    drawCard(ctx, c, x, 62, w, 360, 1, { accent: big ? c.s8 : c.s1 });
    say(ctx, c, T.root, cx - 14, 150, { size: 54, align: 'right' });
    say(ctx, c, T.end, cx - 14, 150, { size: 54, align: 'left', col: c.s2ink });
    say(ctx, c, `-${T.end}`, cx, 248, { size: 38, col: c.s2ink });
    say(ctx, c, big ? 'larger charge' : 'smaller charge', cx, 298, { size: 28 });
    say(ctx, c, `${T.q}+`, cx, 368, { size: 46 });
    tag(ctx, c, T.sym === 'Fe' ? 'iron: ferrum' : 'copper: cuprum', 214, 470, { size: 26 });
  }

  _polyatomic(ctx, c, a) {
    const P = POLY.find((p) => p.id === this._poly);
    const cx = 300, cy = 214, r = 164;
    at(ctx, cx, cy, Math.min(1.04, Math.max(0.8, popIn(a, 0, 0.4))), () => {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, r + 12, 0, Math.PI * 2);
      ctx.strokeStyle = P.q > 0 ? c.cation : c.anion;
      ctx.lineWidth = 6 * lookOf().rim;
      ctx.setLineDash([16, 12]);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
      drawMolecule(ctx, c, 0, 0, { atoms: P.atoms, bonds: P.bonds, r: r - 8 });
    });
    formula(ctx, c, P.f, 568, 150, { size: 54 });
    say(ctx, c, `${Math.abs(P.q)}`, 568, 262, { size: 80, col: c.s2ink });
    say(ctx, c, 'valency', 568, 322, { size: 28, col: c.labelMuted });
    say(ctx, c, P.name, 340, 446, { size: P.name.length > 12 ? 42 : 48 });
  }

  _table(ctx, c, a) {
    const R = ROUND[this._i], right = this._right >= 0;
    const u = Math.min(1.04, Math.max(0.8, popIn(a, 0, 0.4)));
    at(ctx, 340, 118, u, () => {
      formula(ctx, c, R.a, -150, 0, { size: 78 });
      say(ctx, c, '+', 0, 0, { size: 60, col: c.labelMuted });
      formula(ctx, c, R.b, 150, 0, { size: 78 });
    });
    ['A', 'B'].forEach((id, i) => {
      const on = right && id === R.ok;
      const box = button(ctx, c, R[id], 60, 214 + i * 100, 560, 80, { on, size: 40, off: right && !on, bg: on ? c.good : undefined });
      box.id = id;
      this._boxes.push(box);
    });
    const y = 464;
    if (this.age - this._miss < 1.6) tag(ctx, c, 'look at each ion again', 340, y, { bg: c.bad, size: 26 });
    else tag(ctx, c, `${this._i + 1} of ${ROUND.length}`, 340, y, { size: 26, bg: c.bgSurface });
  }
}
