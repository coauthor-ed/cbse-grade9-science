// SampleTableScene - companion to blk-l10-s5, "Two Families of Compounds".
//   b0  bench    five jars: tap one to run its tests; the four results show below
//   b1  pattern  sort the jars into two trays by one question at a time; sugar changes sides
//   b2  takeaway raise the temperature: three covalent solids melt early, salt holds on to 801 C
// Copper sulfate is left off the heat scale: the book gives no number for it.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, darken, drawBackdrop, drawBench, drawCard, drawFloor, lerp, mix, mulberry32, rr } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, popIn, say, tag, snow } from './IonBenchKit.js';

const S_BENCH = 0, S_SORT = 1, S_HEAT = 2;
const MOVE_S = 0.55;
const SAMPLES = [
  { id: 'salt', name: ['sodium', 'chloride'], water: 1, ker: 0, solid: 0, wet: 1, ionic: 1 },
  { id: 'cu', name: ['copper', 'sulfate'], water: 1, ker: 0, solid: 0, wet: 1, ionic: 1 },
  { id: 'sugar', name: ['sugar'], water: 1, ker: 0, solid: 0, wet: 0, ionic: 0 },
  { id: 'camphor', name: ['camphor'], water: 0, ker: 1, solid: 0, wet: 0, ionic: 0 },
  { id: 'naph', name: ['naphthalene'], water: 0, ker: 1, solid: 0, wet: 0, ionic: 0 },
];
const XS = [76, 208, 340, 472, 604];
const SORTS = { water: 'water', ker: 'ker', wet: 'wet' };
const HEAT = [
  { id: 'naph', name: 'naphthalene', mp: 80 },
  { id: 'camphor', name: 'camphor', mp: 175 },
  { id: 'sugar', name: 'sugar', mp: 186 },
  { id: 'salt', name: 'salt', mp: 801 },
];
const T_MAX = 900;
const HEAT_X = [92, 248, 404, 560];

function tone(c, id) {
  if (id === 'cu') return c.s1;
  return snow(c);
}

export class SampleTableScene extends SimScene {
  static BEAT_STEP_MAP = [S_BENCH, S_SORT, S_HEAT].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'select', id: 'sample', label: 'Sample', value: 'salt', options: SAMPLES.map((s) => ({ value: s.id, label: s.name.join(' ') })) },
    { type: 'segmented', id: 'sort', label: 'Sort by', value: 'water', options: [{ value: 'water', label: 'In water' }, { value: 'ker', label: 'In kerosene' }, { value: 'wet', label: 'Conducts' }] },
    { type: 'slider', id: 'temp', label: 'Temperature', min: 25, max: T_MAX, step: 5, value: 25, suffix: ' \u00b0C' },
  ];
  static ARIA_LABEL = 'Five jars: sodium chloride, copper sulfate, sugar, camphor and naphthalene. Tap one to see whether it dissolves '
    + 'in water and in kerosene and petrol, and whether it conducts as a solid and in water. Next you sort the jars by each question: '
    + 'sugar dissolves with the salts but does not conduct with them. Last, raise the temperature: naphthalene, camphor and sugar '
    + 'melt below 200 degrees Celsius, and salt only at 801.';

  constructor(container, config) {
    super(container, config);
    this._pick = null; this._pickAt = -9; this._seen = new Set();
    this._sort = 'water'; this._sortAt = -9; this._from = null; this._found = false; this._temp = 25; this._foundAt = -9; this._meltAt = {}; this._heatFound = false;
  }

  enter() {
    this._pick = null; this._pickAt = -9; this._seen = new Set();
    this._sort = 'water'; this._sortAt = -9; this._from = null; this._found = false; this._temp = 25; this._foundAt = -9; this._meltAt = {}; this._heatFound = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return ({ sample: S_BENCH, sort: S_SORT, temp: S_HEAT })[id] !== this.stage; }
  getControlValue(id) { return id === 'sample' ? (this._pick ?? 'salt') : id === 'sort' ? this._sort : id === 'temp' ? this._temp : undefined; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'sample') this._choose(v);
    if (id === 'sort' && v !== this._sort) {
      this._from = this._places();
      this._sort = SORTS[v] ?? 'water';
      this._sortAt = this.age;
      this._sorted(v);
    }
    if (id === 'temp') {
      this._temp = Math.round(Number(v));
      for (const h of HEAT) if (this._temp >= h.mp && this._meltAt[h.id] == null) this._meltAt[h.id] = this.age;
      this._heated();
    }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _sorted(v) {
    if (v !== 'wet' || this._found) return;
    this._found = true;
    this._foundAt = this.age;
    this.after(MOVE_S, () => this.celebrate(this._places().get('sugar').x, 240, 28, { key: 'sugar-apart', lookAt: 'scene' }));
  }

  _heated() {
    if (this._temp <= 200 || this._temp >= 801 || this._heatFound) return;
    this._heatFound = true;
    this.celebrate(248, 240, 28, { key: 'low-melting', lookAt: 'scene' });
  }

  _choose(id) { this._pick = id; this._pickAt = this.age; this._seen.add(id); }

  busy() { return this.age < 1 || this.age - this._pickAt < 0.5 || this.age - this._sortAt < MOVE_S + 0.1; }

  pointerDown(p) {
    if (this.stage !== S_BENCH || p.y > 262) return;
    const i = XS.reduce((b, x, k) => (Math.abs(x - p.x) < Math.abs(XS[b] - p.x) ? k : b), 0);
    this._choose(SAMPLES[i].id);
    this.requestUiUpdate?.();
  }

  _places() {
    const m = new Map(), yes = SAMPLES.filter((s) => s[this._sort]), no = SAMPLES.filter((s) => !s[this._sort]);
    const lay = (list, x0, w) => list.forEach((s, i) => m.set(s.id, { x: x0 + (w * (i + 0.5)) / list.length, y: 318 }));
    lay(yes, 26, 304); lay(no, 350, 304);
    return m;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.stage === S_BENCH) this._bench(ctx, c);
    if (this.stage === S_SORT) this._trays(ctx, c);
    if (this.stage === S_HEAT) this._heat(ctx, c);
  }

  _jar(ctx, c, x, base, w, h, id, o = {}) {
    const g = glassBox('jar', x - w / 2, base - h, w, h, { wall: 4 });
    drawGlass(ctx, c, g);
    const col = tone(c, id), rnd = mulberry32(id.length * 7 + 3), fy = g.floor;
    if (o.melted) {
      rr(ctx, g.inner.x + 2, fy - h * 0.2, g.inner.w - 4, h * 0.2, 6);
      ctx.fillStyle = id === 'sugar' ? mix(c.flame, c.s2, 0.4) : mix(col, c.warning, 0.3);
      ctx.fill();
    } else if (id === 'camphor') {
      for (let i = 0; i < 3; i++) { rr(ctx, x - w * 0.34 + i * w * 0.02, fy - h * 0.2 * (i + 1) - 1, w * 0.64, h * 0.19, 6); ctx.fillStyle = mix(col, c.s2, 0.08 * i); ctx.fill(); ctx.strokeStyle = darken(c.glass, 0.3); ctx.lineWidth = 2; ctx.stroke(); }
    } else if (id === 'naph') {
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3 - j; i++) {
        ctx.beginPath(); ctx.arc(x - w * 0.26 + i * w * 0.26 + j * w * 0.13, fy - h * 0.13 - j * h * 0.22, h * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = darken(c.glass, 0.3); ctx.lineWidth = 2; ctx.stroke();
      }
    } else {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 5 - (j % 2); i++) {
        drawGrain(ctx, c, x - w * 0.34 + i * w * 0.165 + (j % 2) * w * 0.08 + (rnd() - 0.5) * 3, fy - 8 - j * h * 0.095, h * (id === 'sugar' ? 0.055 : 0.065), { seed: 3 + i + j, col });
      }
    }
    drawGlassFront(ctx, c, g, { shade: 0.08 });
  }

  _bench(ctx, c) {
    drawFloor(ctx, c, 330);
    drawBench(ctx, c, 8, 672, 208, { h: 30 });
    SAMPLES.forEach((s, i) => {
      const on = this._pick === s.id;
      this._jar(ctx, c, XS[i], on ? 200 : 208, 100, 140, s.id);
      s.name.forEach((t, k) => say(ctx, c, t, XS[i], 40 - (s.name.length - 1) * 11 + k * 24 - 6, { size: 22, col: on ? c.accent : c.label }));
    });
    const s = SAMPLES.find((e) => e.id === this._pick);
    const x = 20, y = 268, w = 640, h = 230;
    drawCard(ctx, c, x, y, w, h, 1, {});
    if (!s) { tag(ctx, c, 'tap a jar to test it', 340, y + h / 2, { bg: c.warning, size: 28, scale: popIn(this.age, 0.4) }); return; }
    const rows = [
      ['dissolves in water', s.water], ['dissolves in kerosene, petrol', s.ker],
      ['solid conducts', s.solid], ['conducts in water', s.wet],
    ];
    rows.forEach(([t, v], i) => {
      const k = popIn(this.age - this._pickAt, i * 0.08, 0.3), ry = y + 34 + i * 54;
      say(ctx, c, t, x + 26, ry, { size: 26, align: 'left', display: false, weight: 700 });
      tag(ctx, c, v ? 'yes' : 'no', x + w - 72, ry, { bg: v ? c.good : c.raised, size: 26, scale: k });
    });
  }

  _trays(ctx, c) {
    drawFloor(ctx, c, 500);
    const names = { water: 'dissolves in water', ker: 'dissolves in kerosene', wet: 'conducts in water' };
    say(ctx, c, names[this._sort], 340, 40, { size: 32 });
    for (const [x, t, ok] of [[20, 'yes', 1], [344, 'no', 0]]) {
      drawCard(ctx, c, x, 80, 316, 340, 1, { accent: ok ? c.good : c.stroke });
      say(ctx, c, t, x + 158, 122, { size: 30, col: ok ? c.good : c.label });
    }
    const to = this._places(), u = reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._sortAt) / MOVE_S));
    for (const s of SAMPLES) {
      const b = to.get(s.id), a = this._from?.get(s.id) ?? b;
      const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - Math.sin(u * Math.PI) * 40;
      this._jar(ctx, c, x, y + 64, 86, 122, s.id);
      const lab = s.id === 'naph' ? 'naphth.' : s.id === 'cu' ? 'copper' : s.id === 'salt' ? 'salt' : s.name[0];
      say(ctx, c, lab, x, y + 92, { size: 22 });
    }
    if (this._found) tag(ctx, c, 'sugar leaves the salts', 340, 468, { bg: c.good, scale: popIn(this.age - this._foundAt, MOVE_S, 0.3) });
    else tag(ctx, c, 'sort by each question', 340, 468, { bg: c.warning, scale: popIn(this.age, 0.5) });
  }

  // A long hot plate with four jars on it. Three melt early; salt holds on far along the scale.
  _heat(ctx, c) {
    const T = this._temp, plate = 286, f = clamp01(T / 900);
    drawBench(ctx, c, 14, 666, plate + 22, { h: 26 });
    const metal = mix(mix(c.waste, c.label, 0.2), c.flame, f * 0.8);
    rr(ctx, 30, plate, 620, 22, 8); ctx.fillStyle = metal; ctx.fill();
    ctx.strokeStyle = darken(metal, 0.32); ctx.lineWidth = 2.5; ctx.stroke();
    say(ctx, c, `${T} °C`, 340, 34, { size: 44, col: T >= 801 ? c.flame : c.label });
    HEAT_X.forEach((x, i) => {
      const h = HEAT[i], melted = T >= h.mp;
      this._jar(ctx, c, x, plate, 112, 150, h.id, { melted });
      say(ctx, c, h.name, x, 104, { size: 24 });
      if (melted) tag(ctx, c, `${h.mp} °C`, x, 348, { size: 24, bg: h.id === 'salt' ? c.cation : c.anion, scale: popIn(this.age - (this._meltAt[h.id] ?? -9), 0, 0.3) });
    });
    const x0 = 40, x1 = 640, y = 398;
    rr(ctx, x0, y, x1 - x0, 18, 9); ctx.fillStyle = c.track; ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 2; ctx.stroke();
    rr(ctx, x0, y, Math.max(18, (x1 - x0) * f), 18, 9); ctx.fillStyle = c.flame; ctx.fill();
    for (const q of HEAT) {
      const tx = lerp(x0, x1, q.mp / T_MAX);
      rr(ctx, tx - 3, y - 6, 6, 30, 3); ctx.fillStyle = q.id === 'salt' ? c.cation : c.anion; ctx.fill();
    }
    if (T < 60) tag(ctx, c, 'raise the temperature', 340, 466, { bg: c.warning, scale: popIn(this.age, 0.5) });
    else {
      tag(ctx, c, 'covalent: low', 196, 466, { bg: c.anion });
      tag(ctx, c, 'ionic: high', 560, 466, { bg: c.cation });
    }
  }
}
