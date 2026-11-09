// SaltLatticeScene - companion to blk-l09-s2, "One Crystal, Not Molecules". The hero of the module.
// A grain of salt, then the camera falls into it and it becomes a crystal of Na+ and Cl- that the
// learner can turn with a finger. Nothing turns by itself: it arrives and rests.
//   b0  pairs   tap any ion to look for its partner: six neighbours light up, all the same distance
//   b1  six     one ion with its six neighbours, large; tap each to count; swap the centre ion;
//               Points shows the same crystal as a crystal lattice
//   b2  ratio   change the size of the piece: the two counts stay equal, 1 : 1
//   b3  strong  every ion attracts all its neighbours at once, right through the crystal
// Canvas: 216 ions at most, sorted by depth, drawn once per move and parked at rest.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, drawCard, lerp, mix } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawIon, drawFocus } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, formula, formulaChip, popIn, say, tag } from '../L10/IonBenchKit.js';

const S_PAIRS = 0, S_SIX = 1, S_RATIO = 2, S_STRONG = 3;
const CX = 340, CY = 272;
const F = 900;
const INTRO_S = 2.3, EASE_S = 0.5;
const SIZES = { 2: 118, 4: 80, 6: 54 };           // ions along an edge: spacing
const YAW0 = 0.62, PITCH0 = 0.42;
const TURN_S = 8, TURN_WAIT_S = 1;              // one slow turn on each beat, so the crystal reads as 3-D
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

function buildCrystal(n) {
  const S = SIZES[n], ions = [], by = new Map();
  const mid = (n - 1) / 2;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    const o = { i, j, k, x: (i - mid) * S, y: (j - mid) * S, z: (k - mid) * S, na: (i + j + k) % 2 === 0 };
    o.at = ((i * 7 + j * 13 + k * 5) % 41) / 41;
    ions.push(o); by.set(`${i},${j},${k}`, o);
  }
  const bonds = [];
  for (const o of ions) for (const [a, b, c] of DIRS.filter((d) => d[0] + d[1] + d[2] > 0)) {
    const q = by.get(`${o.i + a},${o.j + b},${o.k + c}`);
    if (q) bonds.push([o, q]);
  }
  const near = (o) => DIRS.map(([a, b, c]) => by.get(`${o.i + a},${o.j + b},${o.k + c}`)).filter(Boolean);
  const inner = ions.filter((o) => near(o).length === 6);
  return { n, S, ions, bonds, near, inner, rNa: S * 0.31, rCl: S * 0.43 };
}
const CRYSTALS = { 2: buildCrystal(2), 4: buildCrystal(4), 6: buildCrystal(6) };

export class SaltLatticeScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = [S_PAIRS, S_SIX, S_RATIO, S_STRONG].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'centre', label: 'Centre ion', value: 'na', options: [{ value: 'na', label: 'Na\u207a' }, { value: 'cl', label: 'Cl\u207b' }] },
    { type: 'segmented', id: 'view', label: 'Draw as', value: 'ions', options: [{ value: 'ions', label: 'Ions' }, { value: 'points', label: 'Points' }] },
    { type: 'segmented', id: 'size', label: 'Size of the piece', value: '4', options: [{ value: '2', label: '8 ions' }, { value: '4', label: '64 ions' }, { value: '6', label: '216 ions' }] },
  ];
  static ARIA_LABEL = 'A grain of salt, then the view falls into it and it becomes a crystal of sodium and chloride ions that you '
    + 'can turn with a finger. Tap an ion and its six neighbours light up, all at the same distance, so no ion has a partner. '
    + 'Next one ion stands with its six neighbours and you tap each to count them, and you can see the crystal as a lattice of '
    + 'points. Next you change the size of the piece: the numbers of sodium and chloride ions stay equal, a ratio of 1 to 1. '
    + 'Last, every ion attracts all its neighbours at once, and salt melts at 801 degrees Celsius.';

  constructor(container, config) {
    super(container, config);
    this._yaw = YAW0;
    this._pitch = PITCH0;
    this._size = 4;
    this._press = null;
    this._sel = null;
    this._seen = new Set();
    this._counted = new Set();
    this._centre = 'na';
    this._view = 'ions';
    this._pts = 0;
    this._sizes = new Set();
    this._foundA = false;
    this._foundB = false;
    this._foundC = false;
    this._selAt = -9;
    this._ctlAt = -9;
    this._arrive = 0;
  }

  enter(stage) {
    this._yaw = YAW0;
    this._pitch = PITCH0;
    this._size = 4;
    this._press = null;
    this._sel = null;
    this._seen = new Set();
    this._counted = new Set();
    this._centre = 'na';
    this._view = 'ions';
    this._pts = 0;
    this._sizes = new Set([4]);
    this._foundA = this._foundB = this._foundC = false;
    this._selAt = -9;
    this._ctlAt = -9;
    this._arrive = reducedMotion() ? 9 : 0;
    this._turn = reducedMotion() ? -1 : 0;
    this._turnWait = stage === S_PAIRS ? INTRO_S + 0.6 : TURN_WAIT_S;
    if (stage === S_SIX) this._sel = this._centreIon();
    this.requestUiUpdate?.();
  }

  _crystal() { return CRYSTALS[this.stage === S_RATIO ? this._size : 4]; }
  _centreIon() { const X = CRYSTALS[4]; return this._centre === 'na' ? X.inner.find((o) => o.na) : X.inner.find((o) => !o.na); }

  isControlHidden(id) {
    if (id === 'size') return this.stage !== S_RATIO;
    return this.stage !== S_SIX || (id === 'centre' && this._view === 'points');
  }
  getControlValue(id) { return id === 'centre' ? this._centre : id === 'view' ? this._view : id === 'size' ? String(this._size) : undefined; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this._ctlAt = this.age;
    if (id === 'centre') { this._centre = v; this._sel = this._centreIon(); this._counted = new Set(); }
    if (id === 'view') this._view = v;
    if (id === 'size') {
      this._size = Number(v);
      this._sizes.add(this._size);
      if (this._sizes.size >= 2 && !this._foundC) {
        this._foundC = true;
        this.celebrate(558, 306, 28, { key: 'ratio-one-to-one', lookAt: 'scene' });
      }
    }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  update(d) {
    this._arrive = Math.min(4, this._arrive + d);
    const t = this._view === 'points' ? 1 : 0;
    this._pts += Math.sign(t - this._pts) * Math.min(Math.abs(t - this._pts), d / EASE_S);
    if (this._turn >= 0) {
      this._turn += d;
      const u = Math.min(1, Math.max(0, (this._turn - this._turnWait) / TURN_S));
      this._yaw = YAW0 + Math.PI * 2 * u * u * (3 - 2 * u);
      if (u >= 1) { this._turn = -1; this._yaw = YAW0; }
    }
  }

  busy() {
    if (this._turn >= 0) return true;
    if (this._press?.moved) return true;
    if (Math.abs(this._pts - (this._view === 'points' ? 1 : 0)) > 1e-3) return true;
    if (this.age - this._selAt < 0.6 || this.age - this._ctlAt < 0.6) return true;
    return this._arrive < (this.stage === S_PAIRS ? INTRO_S + 0.6 : 1.3);
  }

  pointerDown(p) { this._turn = -1; this._press = { x: p.x, y: p.y, x0: p.x, y0: p.y, moved: false }; return true; }
  pointerMove(p) {
    const q = this._press;
    if (!q) return false;
    if (Math.hypot(p.x - q.x0, p.y - q.y0) > 7) q.moved = true;
    if (q.moved) {
      this._yaw += (p.x - q.x) * 0.009;
      this._pitch = Math.max(-1.25, Math.min(1.25, this._pitch + (p.y - q.y) * 0.009));
      this.animateFor?.();
    }
    q.x = p.x; q.y = p.y;
    return false;
  }
  pointerUp(p) {
    const q = this._press;
    this._press = null;
    if (!q || q.moved) return;
    if (this.stage === S_PAIRS) this._tapPair(p);
    if (this.stage === S_SIX && this._view === 'ions') this._tapNeighbour(p);
  }

  _tapPair(p) {
    if (this._arrive < INTRO_S) return;
    const X = CRYSTALS[4];
    let best = null, bd = 1e9;
    for (const o of X.inner) {
      const q = this._proj(o, 1);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) { bd = d; best = o; }
    }
    this._sel = best;
    this._selAt = this.age;
    this._seen.add(best);
    if (this._seen.size >= 2 && !this._foundA) {
      this._foundA = true;
      const q = this._proj(best, 1);
      this.celebrate(q.x, q.y, 28, { key: 'no-partner', lookAt: 'scene' });
    }
    this.requestUiUpdate?.();
  }

  _tapNeighbour(p) {
    const X = CRYSTALS[4];
    let best = null, bd = 1e9;
    for (const o of X.near(this._sel)) {
      const q = this._crossProj(o);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd && d < q.r + 16) { bd = d; best = o; }
    }
    if (!best) return;
    this._counted.add(best);
    this._selAt = this.age;
    if (this._counted.size === 6 && !this._foundB) {
      this._foundB = true;
      this.celebrate(CX, CY, 28, { key: 'six-neighbours', lookAt: 'scene' });
    }
  }

  _rot(x, y, z) {
    const cy = Math.cos(this._yaw), sy = Math.sin(this._yaw), cp = Math.cos(this._pitch), sp = Math.sin(this._pitch);
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    return { x: x1, y: y * cp - z1 * sp, z: y * sp + z1 * cp };
  }

  _hub() { return this.stage === S_RATIO ? { x: 226, y: 262, s: 0.74 } : { x: CX, y: CY, s: 1 }; }

  _proj(o, scale) {
    const q = this._rot(o.x, o.y, o.z), h = this._hub();
    const k = (F / (F + q.z)) * scale * h.s;
    return { x: h.x + q.x * k, y: h.y + q.y * k, d: q.z, k };
  }

  /** One neighbour in the large view of b1: its place round the centre ion. */
  _crossProj(o) {
    const f = this._sel, X = CRYSTALS[4], D = X.S * 1.82;
    const q = this._rot((o.i - f.i) * D, (o.j - f.j) * D, (o.k - f.k) * D);
    const k = F / (F + q.z);
    return { x: CX + q.x * k, y: CY - 6 + q.y * k, d: q.z, k, r: (o.na ? X.rNa : X.rCl) * 1.5 * k };
  }

  draw(ctx, c, t) {
    drawDepthField(ctx, c, { x: CX, y: CY, seed: 9, n: 12, t });
    const intro = this.stage === S_PAIRS ? this._arrive : 9;
    if (intro < INTRO_S) this._dive(ctx, c, intro);
    if (intro > 0.9) {
      if (this.stage === S_SIX && this._pts < 1) this._cross(ctx, c);
      else this._crystalDraw(ctx, c, intro);
    }
    this._labels(ctx, c, intro);
  }

  // The grain of lesson 1, and the fall into it.
  _dive(ctx, c, u) {
    const z = ease.inOutCubic(clamp01((u - 0.5) / 1.4));
    const r = 74 * Math.pow(9, z), a = 1 - clamp01((z - 0.55) / 0.4);
    if (a > 0) drawGrain(ctx, c, CX, CY, r, { seed: 3, alpha: a });
    if (u < 1) say(ctx, c, 'one grain of salt', CX, 96, { size: 30 });
  }

  _rod(ctx, c, ax, ay, bx, by, w, k = 1, col = c.gold) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(darken(col, 0.34), k);
    ctx.lineWidth = w + 3;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = alpha(col, k);
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.restore();
  }

  _crystalDraw(ctx, c, intro) {
    const X = this._crystal(), st = this.stage, pts = ease.inOutCubic(this._pts);
    const grow = st === S_PAIRS ? lerp(1.5, 1, ease.outCubic(clamp01((intro - 0.9) / 1.1))) : 1;
    const proj = new Map(X.ions.map((o) => [o, this._proj(o, grow)]));
    const group = st === S_PAIRS && this._sel ? new Set([this._sel, ...X.near(this._sel)]) : null;
    const items = X.ions.map((o) => ({ o, d: proj.get(o).d }));
    const showRods = st === S_STRONG ? clamp01((this.age - 0.25) / 0.8) : 0;
    if (showRods > 0 || pts > 0) for (const b of X.bonds) items.push({ b, d: (proj.get(b[0]).d + proj.get(b[1]).d) / 2 + 1 });
    items.sort((a, b) => b.d - a.d);
    const zSpan = X.S * X.n;
    for (const it of items) {
      if (it.b) {
        const A = proj.get(it.b[0]), B = proj.get(it.b[1]);
        const col = pts > 0 ? mix(c.labelMuted, c.label, 0.3) : c.gold;
        this._rod(ctx, c, A.x, A.y, lerp(A.x, B.x, Math.max(pts, showRods)), lerp(A.y, B.y, Math.max(pts, showRods)), (pts > 0 ? 2.5 : 5.5) * A.k, 1, col);
        continue;
      }
      const o = it.o, p = proj.get(o);
      let pop = 1;
      if (st === S_PAIRS && this._arrive < INTRO_S + 0.4) pop = reducedMotion() ? 1 : clamp01((intro - 0.9 - o.at * 0.9) / 0.35);
      if (pop <= 0) continue;
      const fog = clamp01((p.d + zSpan * 0.5) / zSpan) * 0.42;
      const inG = !group || group.has(o);
      const r = lerp((o.na ? X.rNa : X.rCl), 12, pts) * p.k * Math.min(1, pop);
      drawIon(ctx, c, p.x, p.y, { charge: o.na ? 1 : -1, r, dim: inG ? fog * (group ? 0.3 : 1) : 0.8, profile: 'rich' });
    }
    if (group) {
      const f = proj.get(this._sel);
      for (const nb of X.near(this._sel)) {
        const q = proj.get(nb);
        this._rod(ctx, c, f.x, f.y, q.x, q.y, 7);
      }
      for (const nb of [...X.near(this._sel)].sort((a, b) => proj.get(b).d - proj.get(a).d)) {
        const q = proj.get(nb);
        drawIon(ctx, c, q.x, q.y, { charge: nb.na ? 1 : -1, r: (nb.na ? X.rNa : X.rCl) * q.k, profile: 'rich' });
      }
      drawFocus(ctx, c, f.x, f.y, X.rCl * f.k, 1);
      drawIon(ctx, c, f.x, f.y, { charge: this._sel.na ? 1 : -1, r: (this._sel.na ? X.rNa : X.rCl) * f.k * 1.08, profile: 'rich' });
    }
  }

  // b1: one ion and its six neighbours, large; the rest of the crystal has stepped back.
  _cross(ctx, c) {
    const X = CRYSTALS[4], f = this._sel, near = X.near(f), arrive = popIn(this._arrive, 0.1);
    const list = near.map((o) => ({ o, q: this._crossProj(o) })).sort((a, b) => b.q.d - a.q.d);
    const cz = { x: CX, y: CY - 6 };
    const rF = (f.na ? X.rNa : X.rCl) * 1.5;
    const far = list.filter((e) => e.q.d > 0), close = list.filter((e) => e.q.d <= 0);
    const one = ({ o, q }) => {
      const on = this._counted.has(o);
      const x = lerp(cz.x, q.x, arrive), y = lerp(cz.y, q.y, arrive);
      const len = Math.hypot(x - cz.x, y - cz.y) || 1, u = (rF + 3) / len;     // a near rod starts at the ion's skin
      const sx = q.d <= 0 ? lerp(cz.x, x, Math.min(1, u)) : cz.x, sy = q.d <= 0 ? lerp(cz.y, y, Math.min(1, u)) : cz.y;
      this._rod(ctx, c, sx, sy, x, y, 9, 1, on ? c.gold : mix(c.gold, c.bgSurface, 0.45));
      drawIon(ctx, c, x, y, { sym: o.na ? 'Na' : 'Cl', charge: o.na ? 1 : -1, r: q.r, focus: on ? 0.9 : 0, profile: 'rich' });
    };
    far.forEach(one);
    drawFocus(ctx, c, cz.x, cz.y, rF, 0.8);
    drawIon(ctx, c, cz.x, cz.y, { sym: f.na ? 'Na' : 'Cl', charge: f.na ? 1 : -1, r: rF, profile: 'rich' });
    close.forEach(one);
  }

  _labels(ctx, c, intro) {
    const st = this.stage;
    if (st === S_PAIRS) {
      if (intro < INTRO_S) return;
      if (!this._sel) tag(ctx, c, 'tap any ion', CX, 34, { bg: c.warning, scale: popIn(intro, INTRO_S) });
      else {
        const other = this._sel.na ? 'Cl^-' : 'Na^+';
        formulaChip(ctx, c, this._foundA ? 'no partner anywhere' : `six ${other}, same distance`, CX, 34, { bg: this._foundA ? c.good : c.warning, scale: popIn(this.age - this._selAt, 0, 0.3) });
      }
      this._key(ctx, c);
    }
    if (st === S_SIX) {
      if (this._view === 'points') {
        tag(ctx, c, 'crystal lattice', CX, 34, { bg: c.raised });
        this._key(ctx, c);
        return;
      }
      const f = this._sel, n = this._counted.size;
      const other = f.na ? 'Cl^-' : 'Na^+', me = f.na ? 'Na^+' : 'Cl^-';
      if (n === 0) tag(ctx, c, 'tap each neighbour to count', CX, 34, { bg: c.warning });
      else if (n < 6) formulaChip(ctx, c, `${n} of six`, CX, 34, { bg: c.raised, ink: c.label, size: 28 });
      else formulaChip(ctx, c, `one ${me}, six ${other}`, CX, 34, { bg: c.good, size: 28, scale: popIn(this.age - this._selAt, 0, 0.3) });
      say(ctx, c, 'drag to turn', 664, 498, { size: 24, align: 'right', col: c.labelMuted });
    }
    if (st === S_RATIO) this._ratio(ctx, c);
    if (st === S_STRONG) {
      const k = popIn(this.age, 0.9);
      this._key(ctx, c);
      tag(ctx, c, 'melts at 801 \u00b0C', 662, 36, { bg: c.flame, align: 'right', size: 28, scale: k });
    }
  }

  _key(ctx, c) {
    const y = 492;
    drawIon(ctx, c, 34, y, { charge: 1, r: 20, profile: 'rich' });
    formula(ctx, c, 'Na^+', 62, y, { size: 26, align: 'left' });
    drawIon(ctx, c, 146, y, { charge: -1, r: 24, profile: 'rich' });
    formula(ctx, c, 'Cl^-', 178, y, { size: 26, align: 'left' });
  }

  _ratio(ctx, c) {
    const x = 452, y = 40, w = 214, h = 440, mx = x + w / 2, n = (this._size ** 3) / 2;
    drawCard(ctx, c, x, y, w, h, 1, {});
    drawIon(ctx, c, x + 46, y + 72, { charge: 1, r: 26, profile: 'rich' });
    formula(ctx, c, 'Na^+', x + 46, y + 124, { size: 26 });
    say(ctx, c, n, x + 148, y + 90, { size: n > 99 ? 50 : 56 });
    drawIon(ctx, c, x + 46, y + 190, { charge: -1, r: 32, profile: 'rich' });
    formula(ctx, c, 'Cl^-', x + 46, y + 246, { size: 26 });
    say(ctx, c, n, x + 148, y + 208, { size: n > 99 ? 50 : 56 });
    ctx.fillStyle = c.stroke;
    ctx.fillRect(x + 20, y + 282, w - 40, 3);
    say(ctx, c, '1 : 1', mx, y + 330, { size: 52, col: c.good });
    formula(ctx, c, 'NaCl', mx, y + 394, { size: 40 });
  }
}
