// MoleculeZooScene - companion to blk-l11-s3, "Molecules From Shared Pairs".
//   b0  single    two chlorine atoms: share one electron each, both count 8. Only the valence shell is drawn
//   b1  double    two oxygen atoms: one pair leaves 7, a second pair gives 8
//   b2  compound  hydrogen chloride; water: one hydrogen is not enough, add a second
//   b3  takeaway  the molecules side by side; bring two helium atoms together and nothing happens
// Every shared pair sits between the two nuclei.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, inkOn, lerp } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawElectron, drawMolecule, drawNucleus, drawSeat, drawSharedPair, drawShell, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { formula, formulaChip, popIn, say, tag } from '../L10/IonBenchKit.js';

const DEG = Math.PI / 180;
const S_SINGLE = 0, S_DOUBLE = 1, S_COMPOUND = 2, S_TAKE = 3;
const CY = 240, ER = 11, MOVE_S = 0.6, BOUNCE_S = 1.3;
const RAD = { Cl: 112, O: 104, H: 74, He: 74 };
const GALLERY = [
  { key: 'H2', f: 'H_2', x: 84 }, { key: 'Cl2', f: 'Cl_2', x: 210 }, { key: 'O2', f: 'O_2', x: 340 }, { key: 'HCl', f: 'HCl', x: 470 }, { key: 'H2O', f: 'H_2O', x: 596 },
];

export class MoleculeZooScene extends SimScene {
  static BEAT_STEP_MAP = [S_SINGLE, S_DOUBLE, S_COMPOUND, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'share', label: 'Share one electron each' },
    { type: 'segmented', id: 'mol', label: 'Molecule', value: 'hcl', options: [{ value: 'hcl', label: 'HCl' }, { value: 'water', label: 'Water' }] },
    { type: 'button', id: 'helium', label: 'Bring the helium atoms together' },
  ];
  static ARIA_LABEL = 'Only the valence shells are drawn. Two chlorine atoms share one electron each, and each then counts 8. Two oxygen '
    + 'atoms: one shared pair leaves each with 7, and a second pair gives 8, a double bond. Hydrogen chloride shares one pair. In '
    + 'water, one hydrogen atom leaves oxygen with 7, and a second hydrogen gives it 8. Last, hydrogen, chlorine, oxygen, hydrogen '
    + 'chloride and water stand side by side, and two helium atoms come together and move apart with no bond.';

  constructor(container, config) {
    super(container, config);
    this._n = 0; this._nAt = -9; this._mol = 'hcl'; this._heAt = -9; this._found = new Set(); this._foundAt = -9;
  }

  enter() {
    this._n = 0; this._nAt = -9; this._mol = 'hcl'; this._heAt = -9; this._found = new Set(); this._foundAt = -9;
    this.requestUiUpdate?.();
  }

  _max() { return this.stage === S_SINGLE ? 1 : this.stage === S_DOUBLE ? 2 : this._mol === 'water' ? 2 : 1; }
  isControlHidden(id) {
    if (id === 'share') return this.stage === S_TAKE;
    if (id === 'mol') return this.stage !== S_COMPOUND;
    return this.stage !== S_TAKE;
  }
  isControlDisabled(id) { return id === 'share' ? this._n >= this._max() : id === 'helium' ? this.age - this._heAt < BOUNCE_S : false; }
  getControlValue(id) { return id === 'mol' ? this._mol : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'share') this._share();
    if (id === 'mol') { this._mol = v; this._n = 0; this._nAt = this.age; }
    if (id === 'helium') {
      this._heAt = this.age;
      if (!this._found.has('he')) {
        this._found.add('he');
        this.after(BOUNCE_S, () => this.celebrate(340, 410, 26, { key: 'helium-alone', lookAt: 'scene' }));
      }
    }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _share() {
    if (this._n >= this._max()) return;
    this._n += 1;
    this._nAt = this.age;
    if (this._n === this._max()) {
      const key = `full-${this.stage}-${this._mol}`;
      if (!this._found.has(key)) {
        this._found.add(key);
        this._foundAt = this.age;
        this.after(MOVE_S, () => this.celebrate(340, CY, 28, { key, lookAt: 'scene' }));
      }
    }
  }

  pointerDown(p) {
    if (this.stage !== S_TAKE && p.y < 400) this._share();
    if (this.stage === S_TAKE && p.y > 320 && this.age - this._heAt > BOUNCE_S) this.onControlChange('helium');
    this.requestUiUpdate?.();
  }

  busy() { return this.age < 0.9 || this.age - this._nAt < MOVE_S + 0.2 || this.age - this._heAt < BOUNCE_S + 0.1; }

  _u() { return reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._nAt) / MOVE_S)); }

  /** One atom: valence shell, nucleus with symbol, lone pairs, loose electrons, empty places. Angles in degrees. */
  _atom(ctx, c, x, y, sym, o) {
    const R = RAD[sym], p = { Cl: 17, O: 8, H: 1, He: 2 }[sym];
    drawShell(ctx, c, x, y, R, { fill: 0.08, active: o.full });
    drawNucleus(ctx, c, x, y, { p, n: p, r: sym === 'H' || sym === 'He' ? 30 : 38, solid: true, label: '', profile: 'rich' });
    say(ctx, c, sym, x, y + 1, { size: 30, col: inkOn(c, c.proton) });
    const pt = (a) => ({ x: x + Math.cos(a * DEG) * R, y: y + Math.sin(a * DEG) * R });
    for (const a of o.pairs ?? []) for (const s of [-8, 8]) { const q = pt(a + s); drawElectron(ctx, c, q.x, q.y, ER, { profile: 'rich' }); }
    for (const a of o.loose ?? []) { const q = pt(a); drawElectron(ctx, c, q.x, q.y, ER, { profile: 'rich' }); }
    for (const a of o.seats ?? []) { const q = pt(a); drawSeat(ctx, c, q.x, q.y, ER); }
  }

  _count(ctx, c, x, y, sym, n, target) {
    formulaChip(ctx, c, `${sym}: ${n}`, x, y, { bg: n >= target ? c.good : c.raised, ink: n >= target ? undefined : c.label, size: 26 });
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: CY, seed: 5, n: 12 });
    if (this.stage === S_SINGLE) this._pair(ctx, c, 'Cl', 1);
    if (this.stage === S_DOUBLE) this._pair(ctx, c, 'O', 2);
    if (this.stage === S_COMPOUND) { if (this._mol === 'hcl') this._hcl(ctx, c); else this._water(ctx, c); }
    if (this.stage === S_TAKE) this._gallery(ctx, c);
  }

  // Two like atoms. The shared electrons face each other, on the line between the nuclei.
  _pair(ctx, c, sym, need) {
    const u = this._u(), n = this._n, R = RAD[sym];
    const d0 = n === 0 ? 170 : n === 1 ? R * 0.92 : R * 0.8, dPrev = n <= 1 ? 170 : R * 0.92;
    const d = lerp(dPrev, d0, n === 0 ? 1 : u), xL = 340 - d, xR = 340 + d;
    const pairs = sym === 'Cl' ? [90, 180, 270] : [125, 235];
    if (sym === 'Cl') {
      const full = n === 1 && u >= 1;
      this._atom(ctx, c, xL, CY, sym, { pairs, loose: n ? [] : [0], seats: n ? [] : [18], full });
      this._atom(ctx, c, xR, CY, sym, { pairs: pairs.map((a) => 180 - a), loose: n ? [] : [180], seats: n ? [] : [162], full });
    } else {
      const full = n === 2 && u >= 1;
      const looseL = n === 0 ? [-30, 30] : n === 1 ? [40] : [], seatsL = n === 0 ? [-58, 58] : n === 1 ? [68] : [];
      this._atom(ctx, c, xL, CY, sym, { pairs, loose: looseL, seats: seatsL, full });
      this._atom(ctx, c, xR, CY, sym, { pairs: pairs.map((a) => 180 - a), loose: looseL.map((a) => 180 - a), seats: seatsL.map((a) => 180 - a), full });
    }
    if (n > 0) drawSharedPair(ctx, c, xL, CY, xR, CY, { order: n, r: 11, profile: 'rich' });
    const have = n === 0 ? (sym === 'Cl' ? 7 : 6) : (sym === 'Cl' ? 8 : 6 + n);
    this._count(ctx, c, 340 - 180, 408, sym, have, 8);
    this._count(ctx, c, 340 + 180, 408, sym, have, 8);
    if (n === 0) tag(ctx, c, 'tap to share one electron each', 340, 36, { bg: c.warning, scale: popIn(this.age, 0.4) });
    else if (n < need) tag(ctx, c, 'still one short: share again', 340, 36, { bg: c.warning });
    else if (u >= 1) {
      say(ctx, c, sym === 'Cl' ? 'Cl\u2014Cl' : 'O=O', 340, 36, { size: 44 });
    }
    if (n === need && u >= 1) tag(ctx, c, need === 1 ? 'single bond' : 'double bond', 340, 462, { bg: c.good, size: 28, scale: popIn(this.age - this._nAt, MOVE_S, 0.3) });
  }

  _hcl(ctx, c) {
    const n = this._n, u = n ? this._u() : 1;
    const dT = 150, dF = 210, gap = lerp(dF, dT, n ? u : 0);
    const xH = 340 - gap * 0.72, xCl = 340 + gap * 0.5;
    this._atom(ctx, c, xH, CY, 'H', { loose: n ? [] : [0], seats: n ? [] : [180], full: n && u >= 1 });
    this._atom(ctx, c, xCl, CY, 'Cl', { pairs: [90, 0, 270], loose: n ? [] : [180], seats: n ? [] : [162], full: n && u >= 1 });
    if (n) drawSharedPair(ctx, c, xH, CY, xCl, CY, { r: 11, at: 0.42, profile: 'rich' });
    this._count(ctx, c, 150, 408, 'H', n ? 2 : 1, 2);
    this._count(ctx, c, 530, 408, 'Cl', n ? 8 : 7, 8);
    if (!n) tag(ctx, c, 'tap to share one electron each', 340, 36, { bg: c.warning, scale: popIn(this.age, 0.4) });
    else if (u >= 1) say(ctx, c, 'H\u2014Cl', 340, 36, { size: 44 });
  }

  _water(ctx, c) {
    const n = this._n, u = n ? this._u() : 1;
    const x = 340, y = 196, Ro = RAD.O;
    const place = (a, far) => ({ x: x + Math.cos(a * DEG) * (far ? 300 : Ro * 1.34), y: y + Math.sin(a * DEG) * (far ? 300 : Ro * 1.34) });
    const A = 140, B = 40;
    const hs = [];
    if (n >= 1) { const q = place(A, false), f = place(A, true), k = n === 1 ? u : 1; hs.push({ a: A, x: lerp(f.x, q.x, k), y: lerp(f.y, q.y, k) }); }
    if (n >= 2) { const q = place(B, false), f = place(B, true); hs.push({ a: B, x: lerp(f.x, q.x, u), y: lerp(f.y, q.y, u) }); }
    const pairs = [-50, -130], loose = [], seats = [];
    if (n < 1) { loose.push(A); seats.push(A + 22); }
    if (n < 2) { loose.push(B); seats.push(B - 22); }
    this._atom(ctx, c, x, y, 'O', { pairs, loose, seats, full: n === 2 && u >= 1 });
    for (const h of hs) {
      this._atom(ctx, c, h.x, h.y, 'H', { full: true });
      drawSharedPair(ctx, c, x, y, h.x, h.y, { r: 10, at: 0.56, profile: 'rich' });
    }
    this._count(ctx, c, 110, 90, 'O', 6 + n, 8);
    if (n === 0) tag(ctx, c, 'tap to bring a hydrogen atom', 340, 36, { bg: c.warning, scale: popIn(this.age, 0.4) });
    if (n === 1) tag(ctx, c, 'oxygen is still one short', 340, 36, { bg: c.warning });
    if (n === 2 && u >= 1) formula(ctx, c, 'H_2O', 340, 42, { size: 44 });
  }

  _gallery(ctx, c) {
    GALLERY.forEach((g, i) => {
      const k = popIn(this.age, 0.1 + i * 0.1);
      if (k <= 0) return;
      const r = g.key === 'H2' ? 46 : 56;
      drawMolecule(ctx, c, g.x, 112, { ...MOLECULES[g.key], r: r * k, shared: true, profile: 'rich' });
      formula(ctx, c, g.f, g.x, 196, { size: 30 });
    });
    const t = this.age - this._heAt, B = BOUNCE_S;
    let gap = 150;
    if (t >= 0 && t < B && !reducedMotion()) gap = 150 - Math.sin((t / B) * Math.PI) * 62;
    this._atom(ctx, c, 340 - gap, 350, 'He', { loose: [90, 270] });
    this._atom(ctx, c, 340 + gap, 350, 'He', { loose: [90, 270] });
    if (this._found.has('he') && t >= B) tag(ctx, c, 'already full: no bond', 340, 484, { bg: c.good, size: 24, scale: popIn(t, B, 0.3) });
    else if (t > B || t < 0) tag(ctx, c, 'tap to try helium', 340, 484, { bg: c.warning, size: 24, scale: popIn(this.age, 0.6) });
  }
}
