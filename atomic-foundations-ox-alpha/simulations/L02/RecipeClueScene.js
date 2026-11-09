// RecipeClueScene - companion to blk-l02-s5, "A Fixed Ratio in Every Compound".
//   b0  mixtures   the learner sets any ratio of sand to salt: a jar shows it, and it is still a mixture
//   b1  compounds  Ganga, borewell, sea: 9 g of each purified sample always splits to 1 g + 8 g
//   b2  takeaway   offer extra hydrogen to 8 g of oxygen: the extra is left over, the water stays 1:8
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { mix, darken, lighten, rr, pill, clamp01, outBack, drawBackdrop, drawFloor, drawBench, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, follow } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';

const S_MIX = 0, S_FIXED = 1, S_EXTRA = 2;
const SOURCES = [
  { key: 'ganga', label: 'Ganga', x: 122, tint: 0.5 },
  { key: 'well', label: 'borewell', x: 340, tint: 0.12 },
  { key: 'sea', label: 'sea', x: 558, tint: 0.3 },
];
const CUBE = 78;

export class RecipeClueScene extends SimScene {
  static BEAT_STEP_MAP = [S_MIX, S_FIXED, S_EXTRA].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'sand', label: 'Sand', min: 1, max: 9, step: 1, value: 5, suffix: '' },
    { type: 'segmented', id: 'source', label: 'Water from', value: 'ganga', options: SOURCES.map((s) => ({ value: s.key, label: s.label })) },
    { type: 'slider', id: 'hydrogen', label: 'Hydrogen', min: 1, max: 4, step: 1, value: 1, suffix: '' },
  ];
  static ARIA_LABEL = 'A jar of sand and salt can hold any ratio you set. Water from the Ganga, a borewell or the sea, once purified, always splits into one '
    + 'gram of hydrogen and eight grams of oxygen for every nine grams. When extra hydrogen is offered to eight grams of oxygen, nine grams of water form and the extra hydrogen is left over.';

  constructor(container, config) {
    super(container, config);
    this._sand = 5;
    this._src = 'ganga';
    this._seen = {};
    this._h = 1;
    this._at = -9;
    this._hs = 1;
    this._ss = 5;
    this._found = false;
  }

  enter() {
    this._sand = 5; this._ss = 5; this._src = 'ganga'; this._seen = { ganga: true }; this._h = 1; this._hs = 1; this._at = 0; this._found = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return (id === 'sand' && this.stage !== S_MIX) || (id === 'source' && this.stage !== S_FIXED) || (id === 'hydrogen' && this.stage !== S_EXTRA); }
  getControlValue(id) { return id === 'sand' ? this._sand : id === 'source' ? this._src : this._h; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'sand') this._sand = Number(v);
    if (id === 'hydrogen') { this._h = Number(v); if (this._h > 1 && !this._found) { this._found = true; this.after(0.6, () => this.celebrate(560, 300, 16, { key: 'left-over' })); } }
    if (id === 'source') this._pick(v);
    if (reducedMotion()) { this._ss = this._sand; this._hs = this._h; }
    this.requestUiUpdate?.();
  }

  _pick(v) {
    if (v === this._src) return;
    this._src = v;
    this._at = this.age;
    this._seen[v] = true;
    if (Object.keys(this._seen).length === 3 && !this._found) {
      this._found = true;
      this.after(0.9, () => this.celebrate(340, 250, 26, { key: 'always-1-8' }));
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_FIXED) {
      if (p.y > 440) this._pick(SOURCES.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a)).key);
      else { const i = SOURCES.findIndex((s) => s.key === this._src); this._pick(SOURCES[(i + 1) % 3].key); }
    } else if (this.stage === S_MIX) this.onControlChange('sand', this._sand % 9 + 1);
    else this.onControlChange('hydrogen', this._h % 4 + 1);
  }

  update(d) {
    this._ss = follow(this._ss, this._sand, d, 0.1); if (Math.abs(this._ss - this._sand) < 0.01) this._ss = this._sand;
    this._hs = follow(this._hs, this._h, d, 0.1); if (Math.abs(this._hs - this._h) < 0.01) this._hs = this._h;
  }

  busy() { return this.age - this._at < 0.9 || this._ss !== this._sand || this._hs !== this._h; }

  draw(ctx, c, t) {
    if (this.stage === S_MIX) this._mix(ctx, c);
    else if (this.stage === S_FIXED) this._fixed(ctx, c, t);
    else this._extra(ctx, c, t);
  }

  _mix(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 482);
    drawBench(ctx, c, 26, 654, 440);
    const g = glassBox('jar', 340 - 170, 96, 340, 344, { wall: 7 });
    drawGlass(ctx, c, g);
    const salt = isDay(c) ? mix(c.bgSurface, c.s1, 0.2) : c.label;
    const sand = mix(c.s2, c.s8, 0.3);
    const rnd = mulberry32(7);
    const N = 340, share = this._ss / 10;
    const iw = g.inner.w - 8, cols = 26, step = iw / cols;
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / cols), col = i % cols;
      const x = g.inner.x + 4 + (col + 0.5) * step + (rnd() - 0.5) * 4;
      const y = g.floor - 8 - row * 11 + (rnd() - 0.5) * 3;
      const isSand = rnd() < share;
      ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = isSand ? sand : salt; ctx.fill();
      ctx.strokeStyle = darken(isSand ? sand : salt, 0.25); ctx.lineWidth = 1.5; ctx.stroke();
    }
    drawGlassFront(ctx, c, g, { shade: 0.08 });
    const a = Math.round(this._sand), b = 10 - a;
    pill(ctx, c, `sand ${a} : salt ${b}`, 340, 56, { bg: c.raised, ink: c.label, size: 34, display: true });
    pill(ctx, c, 'still a mixture', 340, 200, { bg: c.good, ink: chipInk(c), size: 26, display: true });
  }

  /** Nine one-gram cubes: h of them hydrogen, the rest oxygen. */
  _cubes(ctx, c, x, y, u) {
    const H = isDay(c) ? mix(c.s1, c.bgSurface, 0.3) : mix(c.s1, c.label, 0.4);
    const O = c.s6;
    for (let i = 0; i < 9; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const k = reducedMotion() ? 1 : outBack(clamp01(u * 2.2 - i * 0.08));
      const s = CUBE * k, cx = x + (col - 1) * (CUBE + 8), cy = y + (row - 1) * (CUBE + 8);
      const tone = i === 0 ? H : O;
      rr(ctx, cx - s / 2, cy - s / 2 + 5, s, s, 12); ctx.fillStyle = darken(tone, 0.3); ctx.fill();
      rr(ctx, cx - s / 2, cy - s / 2, s, s, 12); ctx.fillStyle = tone; ctx.fill();
      rr(ctx, cx - s / 2 + 9, cy - s / 2 + 7, s - 18, 6, 3); ctx.fillStyle = lighten(tone, 0.4); ctx.fill();
      if (k > 0.8) bigText(ctx, c, i === 0 ? 'H' : 'O', cx, cy + 2, 34, i === 0 && isDay(c) ? c.label : chipInk(c));
    }
  }

  _fixed(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 9, t });
    const src = SOURCES.find((s) => s.key === this._src);
    this._cubes(ctx, c, 340, 276, reducedMotion() ? 1 : clamp01((this.age - this._at) / 0.8));
    bigText(ctx, c, '1 g hydrogen : 8 g oxygen', 340, 52, 34, c.label);
    bigText(ctx, c, `in every 9 g of ${src.label} water`, 340, 98, 26, c.labelMuted);
    for (const s of SOURCES) {
      const on = s === src, seen = this._seen[s.key];
      pill(ctx, c, s.label, s.x, 476, { bg: on ? c.accent : seen ? c.good : c.raised, ink: on || seen ? chipInk(c) : c.label, size: 26, display: true });
    }
  }

  _extra(ctx, c, t) {
    drawDepthField(ctx, c, { x: 300, y: 240, seed: 3, t });
    this._cubes(ctx, c, 262, 256, 1);
    bigText(ctx, c, '9 g of water', 262, 76, 34, c.label);
    const left = Math.round(this._h) - 1;
    const H = isDay(c) ? mix(c.s1, c.bgSurface, 0.3) : mix(c.s1, c.label, 0.4);
    for (let i = 0; i < left; i++) {
      const y = 368 - i * 92, x = 562 + (i % 2 ? 12 : -12);
      ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fillStyle = H; ctx.fill();
      ctx.strokeStyle = darken(H, 0.3); ctx.lineWidth = 3.5; ctx.stroke();
      bigText(ctx, c, 'H', x, y + 2, 32, isDay(c) ? c.label : c.bgDeep);
    }
    pill(ctx, c, left ? `${left} g hydrogen left over` : 'hydrogen: 1 g', 500, 472, { bg: left ? c.warning : c.raised, ink: left ? undefined : c.label, size: 26, display: true });
  }
}
