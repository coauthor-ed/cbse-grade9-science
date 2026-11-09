// DissolutionScene - companion to blk-l10-s1, "Salt Meets Water". All inside one beaker of water.
//   b0  sides     one ion ringed by water molecules. Swap Na+ for Cl- and every water turns round
//   b1  pull      the crystal on the floor of the beaker. Tap an ion: one on the surface is pulled
//                 away, wrapped in water. One deep inside stays held on every side
//   b2  free      stir: the crystal comes apart from the outside in
//   b3  takeaway  swap between the dry crystal and the water: 12 ions before, 12 ions after
// The crystal is 12 ions; what is true of them is true of the grain.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, drawBackdrop, drawBench, drawFloor, lerp, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { drawIon, drawMolecule, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { popIn, tag } from './IonBenchKit.js';

const TAU = Math.PI * 2;
const S_SIDES = 0, S_PULL = 1, S_FREE = 2, S_TAKE = 3;
const BENCH = 478;
const GLASS = glassBox('beaker', 26, 30, 628, 448, { wall: 8 });
const FLY_S = 0.9, GAP_S = 0.36, TURN_S = 0.5;
const SP = 66, R_NA = 24, R_CL = 31, COLS = 4, ROWS = 3;
const CX = 340, CY = 250;

const IONS = [];
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  IONS.push({ id: IONS.length, i, j, na: (i + j) % 2 === 0, lx: CX + (i - 1.5) * SP, ly: 460 - (ROWS - j - 0.5) * SP + 4 });
}
const at = (i, j) => IONS.find((o) => o.i === i && o.j === j);
const SITES = [];
{
  const r = mulberry32(14);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    SITES.push({ x: 104 + i * 157 + (j % 2 ? 26 : -8) + (r() - 0.5) * 12, y: 136 + j * 118 + (r() - 0.5) * 12 });
  }
}
const LOOSE = [];
{
  const r = mulberry32(31);
  for (let i = 0; i < 10; i++) LOOSE.push({ x: 70 + r() * 540, y: 100 + r() * 340, rot: r() * TAU });
}

export class DissolutionScene extends SimScene {
  static BEAT_STEP_MAP = [S_SIDES, S_PULL, S_FREE, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static NOTE_STAGE = 0;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'ion', label: 'Ion', value: 'na', options: [{ value: 'na', label: 'Na\u207a' }, { value: 'cl', label: 'Cl\u207b' }] },
    { type: 'button', id: 'stir', label: 'Stir' },
    { type: 'segmented', id: 'view', label: 'Salt', value: 'water', options: [{ value: 'dry', label: 'Dry crystal' }, { value: 'water', label: 'In water' }] },
  ];
  static ARIA_LABEL = 'Inside a beaker of water. One ion is ringed by water molecules: the slightly negative oxygen ends point at a '
    + 'sodium ion, and when you swap it for a chloride ion every water turns round so the slightly positive hydrogen ends point '
    + 'at it. Next a crystal of 12 ions lies on the floor: tap an ion on the surface and it is pulled away wrapped in water, '
    + 'while one deep inside stays held. Next you stir and the crystal comes apart from the outside in. Last you swap between '
    + 'the dry crystal and the water: there are 12 ions before and 12 ions after.';

  constructor(container, config) {
    super(container, config);
    this._ion = 'na'; this._flip = 0; this._turnAt = -9;
    this._out = new Map(); this._stuck = null; this._stuckAt = -9;
    this._stirred = false; this._view = 'water'; this._v = 1; this._until = 0;
    this._foundA = false; this._foundB = false; this._foundD = false; this._foundAt = -9;
  }

  noteRows() { return [{ text: 'ions and water drawn far bigger than life' }]; }

  enter(stage) {
    this._ion = 'na'; this._flip = 0; this._turnAt = -9;
    this._out = new Map(); this._stuck = null; this._stuckAt = -9;
    this._stirred = false; this._view = 'water'; this._v = 1; this._until = 0;
    this._foundA = this._foundB = this._foundD = false; this._foundAt = -9;
    if (stage === S_FREE) for (const o of [at(0, 0), at(3, 0), at(0, 1)]) this._out.set(o.id, { t: -9, site: this._out.size });
    if (stage === S_TAKE) IONS.forEach((o, i) => this._out.set(o.id, { t: -9, site: i }));
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return ({ ion: S_SIDES, stir: S_FREE, view: S_TAKE })[id] !== this.stage; }
  isControlDisabled(id) { return id === 'stir' && this._stirred; }
  getControlValue(id) { return id === 'ion' ? this._ion : id === 'view' ? this._view : undefined; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'ion') this._swap(v);
    if (id === 'stir') this._stir();
    if (id === 'view') {
      this._view = v;
      this._until = this.age + 1.2;
      if (v === 'dry' && !this._foundD) {
        this._foundD = true;
        this.after(1, () => this.celebrate(340, 96, 28, { key: 'same-ions', lookAt: 'scene' }));
      }
    }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _swap(v) {
    if (v === this._ion) return;
    this._ion = v;
    this._turnAt = this.age;
    if (!this._foundA) {
      this._foundA = true;
      this.after(TURN_S, () => this.celebrate(CX, CY, 26, { key: 'water-turns', lookAt: 'scene' }));
    }
  }

  _stir() {
    this._stirred = true;
    const left = IONS.filter((o) => !this._out.has(o.id)).sort((a, b) => Math.abs(b.i - 1.5) + (2 - b.j) * 0.6 - Math.abs(a.i - 1.5) - (2 - a.j) * 0.6);
    let n = this._out.size;
    left.forEach((o, k) => this._out.set(o.id, { t: this.age + k * GAP_S, site: n++ }));
    this._until = this.age + left.length * GAP_S + FLY_S + 0.2;
  }

  /** An ion can leave when one of its sides is open water: the edges and the top, and any place an ion has left. */
  _exposed(o) {
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1]]) {
      const q = at(o.i + a, o.j + b);
      if (!q || this._out.has(q.id)) return true;
    }
    return false;
  }

  update(d) {
    const t = this._view === 'water' ? 1 : 0;
    this._v += Math.sign(t - this._v) * Math.min(Math.abs(t - this._v), d / 1);
    const f = this._ion === 'cl' ? 1 : 0;
    this._flip += Math.sign(f - this._flip) * Math.min(Math.abs(f - this._flip), d / TURN_S);
  }

  busy() {
    return this.age < this._until || this.age < 0.8 || this.age - this._stuckAt < 0.6 || Math.abs(this._flip - (this._ion === 'cl' ? 1 : 0)) > 1e-3
      || Math.abs(this._v - (this._view === 'water' ? 1 : 0)) > 1e-3;
  }

  pointerDown(p) {
    if (this.stage === S_SIDES) {
      if (Math.hypot(p.x - CX, p.y - CY) < 110) { this._swap(this._ion === 'na' ? 'cl' : 'na'); this.requestUiUpdate?.(); }
      return;
    }
    if (this.stage !== S_PULL) return;
    let best = null, bd = 44;
    for (const o of IONS) {
      if (this._out.has(o.id)) continue;
      const d = Math.hypot(o.lx - p.x, o.ly - p.y);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return;
    if (!this._exposed(best)) { this._stuck = best; this._stuckAt = this.age; return; }
    this._out.set(best.id, { t: this.age, site: this._out.size });
    this._until = this.age + FLY_S + 0.2;
    if (this._out.size >= 3 && !this._foundB) {
      this._foundB = true;
      this._foundAt = this.age;
      this.after(FLY_S, () => this.celebrate(CX, 240, 28, { key: 'surface-first', lookAt: 'scene' }));
    }
  }

  _kOf(o) {
    const q = this._out.get(o.id);
    let k = 0;
    if (q) k = reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - q.t) / FLY_S));
    return this.stage === S_TAKE ? k * ease.inOutCubic(this._v) : k;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, BENCH + 12);
    drawBench(ctx, c, 6, 674, BENCH);
    drawGlass(ctx, c, GLASS);
    const dry = this.stage === S_TAKE ? 1 - this._v : 0;
    drawGlassLiquid(ctx, c, GLASS, { level: 0.93, fill: c.water, opacity: 0.42 * (1 - dry) });
    if (this.stage === S_SIDES) this._ring(ctx, c);
    else this._crystal(ctx, c, dry);
    drawGlassFront(ctx, c, GLASS, { shade: 0.08 });
    this._labels(ctx, c);
  }

  _water(ctx, c, x, y, r, rot, dim, labels = false) {
    drawMolecule(ctx, c, x, y, { ...MOLECULES.H2O, r, rot, labels, dim });
  }

  // rot for a water at angle a round an ion: its oxygen end points in; Cl- takes the hydrogen end.
  _inward(a, cl) { return a - Math.PI / 2 + (cl ? Math.PI : 0); }

  _ring(ctx, c) {
    const u = ease.inOutCubic(this._flip), cl = u > 0.5, r = cl ? 70 : 56;
    const R = 136 + (cl ? 8 : 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.26;
      const x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * R * 0.98;
      this._water(ctx, c, x, y, 54, this._inward(a, false) + u * Math.PI, 0, true);
    }
    drawIon(ctx, c, CX, CY, { sym: cl ? 'Cl' : 'Na', charge: cl ? -1 : 1, r, profile: 'rich' });
  }

  _crystal(ctx, c, dry) {
    for (const q of LOOSE) if (dry < 0.5) this._water(ctx, c, q.x, q.y, 22, q.rot, 0.35);
    const list = IONS.map((o) => ({ o, k: this._kOf(o) }));
    if (this.stage === S_PULL) {                            // the water crowding the surface
      for (const { o, k } of list) {
        if (k > 0 || !this._exposed(o)) continue;
        for (const [a, ang] of [[[-1, 0], Math.PI], [[1, 0], 0], [[0, -1], -Math.PI / 2]]) {
          const q = at(o.i + a[0], o.j + a[1]);
          if (q && !this._out.has(q.id)) continue;
          const d = (o.na ? R_NA : R_CL) + 22;
          this._water(ctx, c, o.lx + Math.cos(ang) * d, o.ly + Math.sin(ang) * d, 20, this._inward(ang, !o.na), 0);
        }
      }
    }
    for (const { o, k } of list) {
      const s = this._out.get(o.id), q = s ? SITES[s.site % SITES.length] : { x: o.lx, y: o.ly };
      let x = lerp(o.lx, q.x, k), y = lerp(o.ly, q.y, k);
      if (this._stuck === o && this.age - this._stuckAt < 0.5) x += Math.sin((this.age - this._stuckAt) * 40) * 4;
      if (k > 0.25 && dry < 0.5) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + o.id, d = (o.na ? R_NA : R_CL) + 21;
          this._water(ctx, c, x + Math.cos(a) * d, y + Math.sin(a) * d, 21, this._inward(a, !o.na), 1 - clamp01((k - 0.25) / 0.4));
        }
      }
      drawIon(ctx, c, x, y, { sym: o.na ? 'Na' : 'Cl', charge: o.na ? 1 : -1, r: o.na ? R_NA : R_CL, profile: 'rich' });
    }
  }

  _labels(ctx, c) {
    const st = this.stage;
    if (st === S_SIDES) {
      const a = popIn(this.age, 0.5);
      tag(ctx, c, 'oxygen: slightly \u2212', 150, 72, { bg: c.raised, size: 22, scale: a });
      tag(ctx, c, 'hydrogen: slightly +', 530, 72, { bg: c.raised, size: 22, scale: a });
      if (!this._foundA) tag(ctx, c, 'tap to swap the ion', CX, 454, { bg: c.warning, size: 22, scale: popIn(this.age, 1) });
    }
    if (st === S_PULL) {
      const stuck = this._stuck && this.age - this._stuckAt < 2;
      if (this._foundB) tag(ctx, c, 'the surface goes first', CX, 52, { bg: c.good, scale: popIn(this.age - this._foundAt, FLY_S, 0.3) });
      else if (stuck) tag(ctx, c, 'held on every side', CX, 52, { bg: c.bad });
      else tag(ctx, c, 'tap an ion to pull it away', CX, 52, { bg: c.warning, scale: popIn(this.age, 0.5) });
    }
    if (st === S_FREE && !this._stirred) tag(ctx, c, 'stir the water', CX, 240, { bg: c.warning, scale: popIn(this.age, 0.5) });
    if (st === S_TAKE) {
      const n = this._view === 'dry' ? '12 ions before' : '12 ions after';
      tag(ctx, c, n, CX, 52, { bg: c.good, size: 30 });
    }
  }
}
