// EmulsionScene - blk-l08-s05. Oil, water and a little soap.
//   0  shake oil and water, with and without soap solution: the drops join up, or they stay spread out
//   1  a lens on the shaken jar: name the dispersed phase and the dispersion medium
//   2  four everyday emulsions: which liquid forms the drops
//   3  an emulsion under three tests: it shows a beam, it passes filter paper, a strong spin takes the cream off
// Drops are drawn far larger than real. Times are sped up.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, clamp01, darken, drawBackdrop, drawBench, drawFloor, drawVignette, lighten, mix, mulberry32, pill,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, glassPath, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawLens, lensPath } from '../L07/CentrifugeBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;
const BENCH_Y = 420;
const JAR = { x: 186, y: 92, w: 308, h: 322 };
const LENS = { x: 340, y: 228, r: 176 };
const SHAKE_S = 2, JOIN_S = 3.4;
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const DROPS = (() => {
  const rnd = mulberry32(21);
  return Array.from({ length: 90 }, () => ({ u: rnd(), v: rnd(), k: rnd() }));
})();
const SAMPLES = {
  milk: { name: 'Milk', kind: 'oil-in-water', drop: 'oil' },
  vanish: { name: 'Vanishing cream', kind: 'oil-in-water', drop: 'oil' },
  butter: { name: 'Butter', kind: 'water-in-oil', drop: 'water' },
  cold: { name: 'Cold cream', kind: 'water-in-oil', drop: 'water' },
};
const oilOf = (c) => mix(c.gold, lighten(c.gold, 0.4), 0.45);
const waterOf = (c) => mix(c.water, c.glass, 0.45);

export class EmulsionScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A jar of oil and water. Shaken alone, the oil drops join up and float. Shaken with a few drops of soap solution, the drops stay spread through the water and the jar stays cloudy. A lens names the drops the dispersed phase and the liquid around them the dispersion medium. Milk and vanishing cream are oil in water; butter and cold cream are water in oil. An emulsion shows a beam, passes through filter paper, and a strong spin can take cream off milk.';
  static CONTROLS = [
    { type: 'segmented', id: 'soap', label: 'Soap solution', value: 'none', options: [{ value: 'none', label: 'None' }, { value: 'drops', label: 'A few drops' }] },
    { type: 'button', id: 'shake', label: 'Shake the jar' },
    { type: 'segmented', id: 'part', label: 'Look at', value: 'drops', options: [{ value: 'drops', label: 'The drops' }, { value: 'around', label: 'The liquid around them' }] },
    { type: 'segmented', id: 'sample', label: 'Sample', value: 'milk', options: Object.entries(SAMPLES).map(([value, s]) => ({ value, label: s.name })) },
    { type: 'segmented', id: 'test', label: 'Test', value: 'beam', options: [{ value: 'beam', label: 'Beam' }, { value: 'filter', label: 'Filter paper' }, { value: 'spin', label: 'Strong spin' }] },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._soap = 'none'; this._used = 'none'; this._jolt = 0; this._since = 1e3; this._mixed = false;
    this._both = false; this._part = 'drops'; this._sample = 'milk'; this._test = 'beam'; this._prog = 0; this._seen = new Set(); this._tried = new Set();
  }

  enter() { this._fresh(); this.requestUiUpdate?.(); }

  isControlHidden(id) {
    const st = this.stage;
    if (id === 'soap' || id === 'shake') return st !== 0;
    if (id === 'part') return st !== 1;
    if (id === 'sample') return st !== 2;
    return st !== 3;
  }
  isControlDisabled(id) { return id === 'shake' ? this._jolt > 0 : false; }
  getControlValue(id) {
    if (id === 'soap') return this._soap;
    if (id === 'part') return this._part;
    if (id === 'sample') return this._sample;
    if (id === 'test') return this._test;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'soap') { this._soap = v; this._mixed = false; this._since = 1e3; } else if (id === 'shake') { this._jolt = SHAKE_S; this._mixed = true; this._used = this._soap; this._since = 0; } else if (id === 'part') {
      this._part = v; this._tried.add(v); if (this._tried.size === 2) this._find(340, 228, 'two-parts');
    } else if (id === 'sample') {
      this._sample = v;
      if (SAMPLES[v].drop === 'water') this._find(340, 230, 'water-in-oil');
    } else if (id === 'test') { this._test = v; this._prog = 0; }
    this.animateFor(800);
    this.requestUiUpdate?.();
  }

  _find(x, y, key) {
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this.celebrate(x, y, 18, { key, small: true });
  }

  update(d) {
    if (this._jolt > 0) { this._jolt = Math.max(0, this._jolt - d); this._since = 0; if (this._jolt === 0) this.requestUiUpdate?.(); } else if (this._mixed && this._since < JOIN_S + 1) {
      this._since += d;
      // the find is the comparison: the jar without soap has already gone back to two layers
      if (this._used === 'drops' && this._since > 2 && this._both) this._find(340, 250, 'stays-cloudy');
      if (this._used === 'none' && this._since > JOIN_S) this._both = true;
    }
    if (this.stage === 3 && this._prog < 1) this._prog = Math.min(1, this._prog + d / 1.4);
  }

  busy() { return this._jolt > 0 || (this._mixed && this._since < JOIN_S + 1) || (this.stage === 3 && this._prog < 1); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH_Y + 56);
    drawBench(ctx, c, 40, 640, BENCH_Y, { h: 56 });
    const st = this.stage;
    if (st === 0) this._jar(ctx, c);
    else if (st === 1) this._parts(ctx, c);
    else if (st === 2) this._kinds(ctx, c);
    else this._tests(ctx, c);
    drawVignette(ctx, c, 0.35);
  }

  _jar(ctx, c) {
    const wob = this._jolt > 0 ? Math.sin(this._jolt * 34) * 12 : 0;
    const g = glassBox('jar', JAR.x + wob, JAR.y, JAR.w, JAR.h);
    drawGlass(ctx, c, g);
    const I = g.inner, top = g.floor - I.h * 0.8, mid = g.floor - I.h * 0.46;
    const stays = this._used === 'drops';
    const j = !this._mixed ? 1 : this._jolt > 0 ? 0 : stays ? 0 : clamp01(this._since / JOIN_S);
    drawGlassLiquid(ctx, c, g, { level: 0.8, fill: mix(waterOf(c), lighten(oilOf(c), 0.3), stays && this._mixed ? 0.72 : (1 - j) * 0.3), opacity: 0.9 });
    ctx.save(); glassPath(ctx, g, I); ctx.clip();
    if (j > 0) { ctx.fillStyle = oilOf(c); ctx.fillRect(I.x, top, I.w, (mid - top) * j); }
    if (j < 1) {
      ctx.fillStyle = oilOf(c);
      DROPS.forEach((p) => {
        const r = (stays ? 4.6 : 7 + 16 * j) * (0.6 + p.k * 0.7);
        const y = stays ? top + 8 + p.v * (g.floor - top - 16) : (top + 8 + p.v * (g.floor - top - 16)) * (1 - j) + (top + (mid - top) * j * p.v) * j;
        ctx.beginPath(); ctx.arc(I.x + 8 + p.u * (I.w - 16), y, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = alpha(darken(c.gold, 0.25), 0.7); ctx.lineWidth = 1.5; ctx.stroke();
      });
    }
    ctx.restore();
    drawGlassFront(ctx, c, g);
    const done = this._mixed && this._jolt === 0;
    const label = !this._mixed ? 'oil and water' : !done ? 'shaking' : stays ? (this._since > 2 ? 'stays cloudy: an emulsion' : 'shaken') : j >= 1 ? 'two layers again' : 'drops are joining';
    pill(ctx, c, label, 340, fs(38), { bg: done && stays && this._since > 2 ? c.good : done && j >= 1 ? c.warning : c.raised, ink: done && (stays && this._since > 2 || j >= 1) ? undefined : c.label, size: fs(20), display: true });
    pill(ctx, c, this._soap === 'none' ? 'no soap' : 'soap solution added', 340, 484, { bg: c.raised, ink: c.label, size: fs(16), display: true });
  }

  /** A close view of an emulsion. dropTone in mediumTone. */
  _lens(ctx, c, dropTone, mediumTone, hiDrops, hiMedium) {
    const { x, y, r } = LENS;
    ctx.save(); lensPath(ctx, x, y, r); ctx.clip();
    ctx.fillStyle = hiMedium ? lighten(mediumTone, 0.12) : mediumTone; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    DROPS.slice(0, 26).forEach((p) => {
      const R = 24 + p.k * 16, px = x - r + 20 + ((p.u * 5) % 1) * (r * 2 - 40), py = y - r + 20 + ((p.v * 3) % 1) * (r * 2 - 40);
      ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.fillStyle = dropTone; ctx.fill();
      ctx.strokeStyle = hiDrops ? c.accent : alpha(darken(dropTone, 0.3), 0.8); ctx.lineWidth = hiDrops ? 5 : 2.5; ctx.stroke();
      ctx.fillStyle = alpha(lighten(dropTone, 0.5), 0.8); ctx.beginPath(); ctx.arc(px - R * 0.3, py - R * 0.3, R * 0.2, 0, TAU); ctx.fill();
    });
    ctx.restore();
    drawLens(ctx, c, { cx: x, cy: y, r, handle: 'none' });
  }

  _parts(ctx, c) {
    const d = this._part === 'drops';
    this._lens(ctx, c, oilOf(c), waterOf(c), d, !d);
    pill(ctx, c, d ? 'dispersed phase' : 'dispersion medium', 340, fs(30), { bg: c.good, size: fs(22), display: true });
    pill(ctx, c, d ? 'tiny drops of oil' : 'the water around them', 340, 472, { bg: c.raised, ink: c.label, size: fs(18), display: true });
  }

  _kinds(ctx, c) {
    const s = SAMPLES[this._sample], oil = s.drop === 'oil';
    this._lens(ctx, c, oil ? oilOf(c) : waterOf(c), oil ? waterOf(c) : oilOf(c), false, false);
    pill(ctx, c, s.name, 340, fs(30), { bg: c.raised, ink: c.label, size: fs(22), display: true });
    pill(ctx, c, s.kind, 340, 472, { bg: oil ? c.accent : c.warning, size: fs(22), display: true });
  }

  _tests(ctx, c) {
    const T = this._test, k = this._prog, milk = lighten(c.glass, 0.86);
    if (T === 'beam') {
      const g = glassBox('beaker', 190, 120, 300, 294);
      drawGlass(ctx, c, g);
      drawGlassLiquid(ctx, c, g, { level: 0.76, fill: milk, opacity: 0.97 });
      ctx.strokeStyle = c.proton; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(200, 300); ctx.lineTo(200 + 280 * k, 300); ctx.stroke();
      ctx.strokeStyle = alpha(c.proton, 0.25); ctx.lineWidth = 20;
      ctx.beginPath(); ctx.moveTo(200, 300); ctx.lineTo(200 + 280 * k, 300); ctx.stroke();
      drawGlassFront(ctx, c, g);
      if (k >= 1) pill(ctx, c, 'it scatters light', 340, fs(40), { bg: c.warning, size: fs(20), display: true });
    } else if (T === 'filter') {
      const fl = glassBox('flask', 250, 236, 180, 178);
      drawGlass(ctx, c, fl);
      drawGlassLiquid(ctx, c, fl, { level: 0.06 + 0.5 * k, fill: milk, opacity: 0.97 });
      const fu = glassBox('funnel', 236, 92, 208, 196);
      drawGlass(ctx, c, fu, { shadow: false });
      drawGlassLiquid(ctx, c, fu, { level: 0.7 * (1 - k * 0.8), fill: milk, opacity: 0.97 });
      drawGlassFront(ctx, c, fu);
      drawGlassFront(ctx, c, fl);
      if (k >= 1) pill(ctx, c, 'still white: it passes through', 340, fs(40), { bg: c.warning, size: fs(19), display: true });
    } else {
      const g = glassBox('tube', 296, 90, 92, 320);
      drawGlass(ctx, c, g);
      drawGlassLiquid(ctx, c, g, { level: 0.86, fill: milk, opacity: 0.97 });
      const top = g.floor - g.inner.h * 0.86, H = 76 * k;
      ctx.save(); glassPath(ctx, g, g.inner); ctx.clip();
      ctx.fillStyle = lighten(c.gold, 0.55); ctx.fillRect(g.x, top, g.w, H);
      ctx.restore();
      drawGlassFront(ctx, c, g);
      if (k >= 1) { pill(ctx, c, 'cream', 460, top + H / 2, { bg: c.raised, ink: c.label, size: fs(18), display: true }); pill(ctx, c, 'skimmed milk', 480, 340, { bg: c.raised, ink: c.label, size: fs(18), display: true }); pill(ctx, c, 'a strong spin works', 340, fs(40), { bg: c.warning, size: fs(20), display: true }); }
    }
  }
}
