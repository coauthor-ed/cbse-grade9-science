// ColloidBenchScene - the third kind of mixture. Two blocks, told apart by beat count.
//   no beats  blk-l08-s01, the predict: blood beside the three beakers from L01. No answer shown.
//   5 beats   blk-l08-s02
//     1  neither: the word colloid and its everyday examples
//     2  a size dial: the jar and the ruler show which kind of mixture a size gives
//     3  a week on the bench: only the suspension settles; plasma stays spread out like milk
//     4  a magnifier on salt water and on milk: looks uniform is not the same as homogeneous
//     5  fresh milk and packet milk on a clock: cream rises only in the fresh one
// Blood is NOT plotted on the ruler (PLAN section 4): its cells are past 1000 nm, and the text carries that note once.
// Particles are not to scale; the jar shows what a mixture of that size looks like. Times are model numbers.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, chipRow, clamp01, darken, drawBackdrop, drawBench, drawFloor, drawVignette, font, inkOn, lerp, lighten, mix, mulberry32, pill, rr,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, glassPath, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { BLOOD_TONES, drawLens, drawRack, drawSampleTube, lensPath } from '../L07/CentrifugeBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;

const BENCH_Y = 330;
const SIZES = [0.5, 5, 50, 500, 5000];
const KIND = (nm) => (nm < 1 ? 'solution' : nm <= 1000 ? 'colloid' : 'suspension');
const RULER = { x0: 40, x1: 640, y: 392, h: 34 };
const posOf = (nm) => { const a = Math.log10(0.1), b = Math.log10(30000); return RULER.x0 + (RULER.x1 - RULER.x0) * (Math.log10(nm) - a) / (b - a); };

const MAP_SETUP = [[{ idx: 0, dwellMs: null }]];
const MAP_S02 = [1, 2, 3, 4, 5].map((i) => [{ idx: i, dwellMs: null }]);

const GRAINS = (() => {
  const rnd = mulberry32(13);
  return Array.from({ length: 90 }, () => ({ u: rnd(), v: rnd(), k: rnd() }));
})();
const milkOf = (c) => lighten(c.glass, 0.86);
const chalkOf = (c) => lighten(c.glass, 0.7);

export class ColloidBenchScene extends SimScene {
  static BEAT_MAPS = { 5: MAP_S02 };
  static BEAT_STEP_MAP = MAP_SETUP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A tube of blood beside three beakers: salt solution, chalk in water and milk. Particle size decides the kind of mixture: less than 1 nanometre a solution, 1 to 1000 a colloid, more than 1000 a suspension. Left for a week only the chalk settles. A magnifier finds nothing in salt water and finds tiny drops in milk. Fresh milk grows a layer of cream and packet milk does not.';
  static CONTROLS = [
    { type: 'segmented', id: 'size', label: 'Particle size', value: '5000', options: SIZES.map((n) => ({ value: String(n), label: `${n.toLocaleString('en-IN')} nm` })) },
    { type: 'button', id: 'week', label: 'Leave for a week' },
    { type: 'slider', id: 'mag', label: 'Magnification', min: 1, max: 1000, step: 1, value: 1, suffix: ' x' },
    { type: 'slider', id: 'hours', label: 'Hours left to stand', min: 0, max: 12, step: 1, value: 0 },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._size = 5000; this._shown = 5000; this._kinds = new Set(); this._seen = new Set();
    this._day = 0; this._going7 = false; this._mag = 1; this._hours = 0;
  }

  enter() { this._fresh(); this.requestUiUpdate?.(); }

  isControlHidden(id) {
    const st = this.stage;
    if (id === 'size') return st !== 2;
    if (id === 'week') return st !== 3;
    if (id === 'mag') return st !== 4;
    if (id === 'hours') return st !== 5;
    return false;
  }
  isControlDisabled(id) { return id === 'week' ? this._going7 || this._day >= 7 : false; }
  getControlValue(id) {
    if (id === 'size') return String(this._size);
    if (id === 'mag') return String(this._mag);
    if (id === 'hours') return String(this._hours);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'size') {
      this._size = Number(v);
      this._kinds.add(KIND(this._size));
      if (this._kinds.size === 3) this._find(posOf(50), RULER.y, 'three-kinds');
    } else if (id === 'week') this._going7 = true;
    else if (id === 'mag') { this._mag = Number(v); if (this._mag >= 500) this._find(470, 150, 'drops-in-milk'); } else if (id === 'hours') { this._hours = Number(v); if (this._hours >= 8) this._find(214, 110, 'cream'); }
    this.animateFor(800);
    this.requestUiUpdate?.();
  }

  _find(x, y, key) {
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this.celebrate(x, y, 18, { key, small: true });
  }

  update(d) {
    if (this._shown !== this._size) {
      const a = Math.log10(this._shown), b = Math.log10(this._size), n = a + (b - a) * (1 - Math.exp(-d / 0.12));
      this._shown = Math.abs(n - b) < 0.01 ? this._size : 10 ** n;
    }
    if (this._going7) {
      this._day = Math.min(7, this._day + d * 1.6);
      if (this._day >= 7) { this._going7 = false; this._find(250, 280, 'only-chalk-settles'); this.requestUiUpdate?.(); }
    }
  }

  busy() { return !!this._going7 || this._shown !== this._size; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH_Y + 56);
    const st = this.stage;
    drawBench(ctx, c, 12, 668, BENCH_Y, { h: 54 });
    if (st === 0) this._setup(ctx, c);
    else if (st === 1) this._named(ctx, c);
    else if (st === 2) this._dial(ctx, c);
    else if (st === 3) this._week(ctx, c);
    else if (st === 4) this._uniform(ctx, c);
    else this._milk(ctx, c);
    drawVignette(ctx, c, 0.35);
  }

  /** A beaker on the bench. o: { fill, a, grains: 'chalk', settle, label } */
  _beaker(ctx, c, x, w, h, o) {
    const g = glassBox('beaker', x, BENCH_Y - h, w, h);
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.74, fill: o.fill, opacity: o.a ?? 0.9 });
    if (o.grains) {
      const I = g.inner, top = g.floor - I.h * 0.74, s = o.settle ?? 0;
      ctx.save(); glassPath(ctx, g, I); ctx.clip();
      ctx.fillStyle = chalkOf(c); ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 1.5;
      GRAINS.slice(0, o.n ?? 60).forEach((p) => {
        const y = lerp(top + 6 + p.v * (g.floor - top - 12), g.floor - 5 - p.k * 18, s);
        ctx.beginPath(); ctx.arc(I.x + 6 + p.u * (I.w - 12), y, o.r ?? 3.6, 0, TAU); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
    }
    drawGlassFront(ctx, c, g);
    if (o.label) pill(ctx, c, o.label, x + w / 2, BENCH_Y + 34, { bg: c.raised, ink: c.label, size: PHONE ? 22 : 16, display: true });
    return g;
  }

  _salt(c) { return { fill: mix(c.water, c.glass, 0.5), a: 0.42 }; }

  _bloodTube(ctx, c, x, y, w, h) {
    drawSampleTube(ctx, c, { x, y, w, h, fill: 0.86, capH: 24, surface: BLOOD_TONES.mixed, paint: (k, col) => { k.fillStyle = BLOOD_TONES.mixed; k.fillRect(col.x, col.y, col.w, col.h); } });
    drawRack(ctx, c, { x: x - 34, y: BENCH_Y - 26, w: w + 68, h: 26, holes: [] });
  }

  _setup(ctx, c) {
    this._bloodTube(ctx, c, 60, 70, 74, 250);
    pill(ctx, c, 'blood', 97, fs(36), { bg: c.raised, ink: c.label, size: fs(18), display: true });
    this._beaker(ctx, c, 214, 136, 196, { ...this._salt(c), label: PHONE ? 'A' : 'A salt' });
    this._beaker(ctx, c, 368, 136, 196, { fill: mix(c.water, c.glass, 0.5), a: 0.5, grains: true, label: PHONE ? 'B' : 'B chalk' });
    this._beaker(ctx, c, 522, 136, 196, { fill: milkOf(c), a: 0.97, label: PHONE ? 'C' : 'C milk' });
    pill(ctx, c, 'which kind?', 340, 460, { bg: c.warning, size: fs(20), display: true });
  }

  _named(ctx, c) {
    this._bloodTube(ctx, c, 300, 56, 80, 262);
    pill(ctx, c, 'colloid', 340, 440, { bg: c.good, size: fs(30), display: true });
    this._beaker(ctx, c, 54, 150, 186, { fill: milkOf(c), a: 0.97, label: 'milk' });
    const sauce = mix(c.s6, c.flame, 0.3);
    this._beaker(ctx, c, 472, 150, 186, { fill: sauce, a: 0.98, label: 'tomato sauce' });
    chipRow(ctx, c, [{ text: 'not a solution', bg: c.raised, ink: c.label }, { text: 'not a suspension', bg: c.raised, ink: c.label }], 340, 492, { align: 'center', size: PHONE ? 19 : 16 });
  }

  _dial(ctx, c) {
    const nm = this._shown, k = KIND(this._size);
    const t = nm < 1 ? 0 : 0.7 + 0.3 * clamp01(Math.log10(nm) / 3);
    const fill = mix(mix(c.water, c.glass, 0.5), milkOf(c), t);
    const big = nm > 1000;
    this._beaker(ctx, c, 214, 252, 280, big ? { fill: mix(c.water, c.glass, 0.5), a: 0.5, grains: true, n: 80, r: 6 } : { fill, a: 0.42 + 0.55 * t });
    pill(ctx, c, k, 340, fs(34), { bg: k === 'colloid' ? c.good : k === 'solution' ? c.accent : c.warning, size: fs(24), display: true });
    this._ruler(ctx, c);
  }

  _ruler(ctx, c) {
    const R = RULER, a = posOf(1), b = posOf(1000);
    const bands = [[R.x0, a, c.accent, 'solution'], [a, b, c.good, 'colloid'], [b, R.x1, c.warning, 'suspension']];
    for (const [x0, x1, col, name] of bands) {
      rr(ctx, x0 + 2, R.y, x1 - x0 - 4, R.h, 10);
      ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = inkOn(c, col); ctx.font = font(c, 700, PHONE ? 19 : 16, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name, (x0 + x1) / 2, R.y + R.h / 2 + 1);
    }
    ctx.fillStyle = c.label; ctx.font = font(c, 700, PHONE ? 20 : 16); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('1 nm', a, R.y + R.h + 8);
    ctx.fillText('1000 nm', b, R.y + R.h + 8);
    const x = posOf(this._shown);
    ctx.fillStyle = c.label;
    ctx.beginPath(); ctx.moveTo(x, R.y + 4); ctx.lineTo(x - 13, R.y - 18); ctx.lineTo(x + 13, R.y - 18); ctx.closePath(); ctx.fill();
  }

  _week(ctx, c) {
    const s = clamp01((this._day - 0.3) / 3);
    const w = 142, h = 188;
    this._beaker(ctx, c, 24, w, h, { ...this._salt(c), label: PHONE ? 'A' : 'A salt' });
    this._beaker(ctx, c, 188, w, h, { fill: mix(c.water, c.glass, 0.5), a: 0.5, grains: true, settle: s, label: PHONE ? 'B' : 'B chalk' });
    this._beaker(ctx, c, 352, w, h, { fill: milkOf(c), a: 0.97, label: PHONE ? 'C' : 'C milk' });
    this._beaker(ctx, c, 516, w, h, { fill: BLOOD_TONES.plasma, a: 0.92, label: 'plasma' });
    pill(ctx, c, `day ${Math.floor(this._day)}`, 340, fs(40), { bg: c.raised, ink: c.label, size: fs(26), display: true });
    if (this._day >= 7) pill(ctx, c, 'only the chalk settled', 340, 450, { bg: c.warning, size: fs(20), display: true });
  }

  _uniform(ctx, c) {
    const k = clamp01((this._mag - 200) / 400);
    this._beaker(ctx, c, 62, 180, 170, { ...this._salt(c), label: 'salt solution' });
    this._beaker(ctx, c, 438, 180, 170, { fill: milkOf(c), a: 0.97, label: 'milk' });
    const lens = (cx, fill, drops) => {
      const cy = 128 - 34, r = 72;
      ctx.save(); lensPath(ctx, cx, cy + 44, r); ctx.clip();
      ctx.fillStyle = fill; ctx.fillRect(cx - r, cy - 40, r * 2, r * 2 + 10);
      if (drops && k > 0) {
        ctx.globalAlpha = k;
        GRAINS.slice(0, 36).forEach((p) => {
          ctx.beginPath(); ctx.arc(cx - r + p.u * r * 2, cy - 28 + p.v * r * 2, 8 + p.k * 6, 0, TAU);
          ctx.fillStyle = mix(lighten(c.gold, 0.5), c.glass, 0.2); ctx.fill();
          ctx.strokeStyle = alpha(darken(c.gold, 0.2), 0.7); ctx.lineWidth = 2; ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      drawLens(ctx, c, { cx, cy: cy + 44, r, handle: 'none' });
    };
    lens(152, lighten(mix(c.water, c.glass, 0.5), 0.55), false);
    lens(528, milkOf(c), true);
    pill(ctx, c, `${this._mag} x`, 340, fs(40), { bg: c.raised, ink: c.label, size: fs(22), display: true });
    if (k >= 1) chipRow(ctx, c, [{ text: 'homogeneous', bg: c.accent }, { text: 'heterogeneous', bg: c.good }], 340, 450, { align: 'center', size: fs(20), display: true, gap: 70 });
    else pill(ctx, c, 'both look uniform', 340, 450, { bg: c.raised, ink: c.label, size: fs(19), display: true });
  }

  _milk(ctx, c) {
    const u = clamp01(this._hours / 8);
    const bottle = (x, label, cream) => {
      const g = glassBox('bottle', x, 44, 164, 284);
      drawGlass(ctx, c, g);
      drawGlassLiquid(ctx, c, g, { level: 0.82, fill: milkOf(c), opacity: 0.98 });
      if (cream > 0) {
        const top = g.floor - g.inner.h * 0.82, H = 64 * cream;
        ctx.save(); glassPath(ctx, g, g.inner); ctx.clip();
        ctx.fillStyle = lighten(c.gold, 0.55); ctx.fillRect(g.x, top, g.w, H);
        ctx.fillStyle = alpha(darken(c.gold, 0.1), 0.5); ctx.fillRect(g.x, top + H - 2, g.w, 3);
        ctx.restore();
      }
      drawGlassFront(ctx, c, g);
      pill(ctx, c, label, x + 82, BENCH_Y + 34, { bg: c.raised, ink: c.label, size: PHONE ? 22 : 17, display: true });
    };
    bottle(132, 'fresh milk', u);
    bottle(384, 'packet milk', 0);
    pill(ctx, c, `${this._hours} h`, 340, fs(36), { bg: c.raised, ink: c.label, size: fs(24), display: true });
    if (u >= 1) chipRow(ctx, c, [{ text: 'cream rose', bg: c.warning }, { text: 'no layer', bg: c.good }], 340, 446, { align: 'center', size: fs(20), display: true, gap: 100 });
  }
}
