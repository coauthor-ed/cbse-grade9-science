// ChapterLoopScene - the close of the module, 6 beats. 0: reproduction, two ways. 1: asexual: one parent, copies. 2: sexual: the
// loop of parents, gametes, zygote, young. 3: the farmer's two choices (identical row, mixed row). 4: copying and variation
// against conditions. 5: an open question: an amoeba divides into two; does it grow old? No faces. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { frame, tag, txt, n, BODY, INK, panel, eggSvg, spermSvg, cellSvg, embryoSvg, form, field } from '../shared/BodyArt.js';
import { PLANT_COLOR_MAP, svgRosePlant, svgSoil, artDefs } from '../shared/PlantArt.js';
import { hedge } from '../shared/Scapes.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const arrow = (x0, y0, x1, y1) => `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}" style="fill:none;stroke:${INK};stroke-width:4;stroke-linecap:round"/>` + (() => {
  const a = Math.atan2(y1 - y0, x1 - x0), L = 11;
  return `<path d="M${n(x1 - L * Math.cos(a - 0.5))} ${n(y1 - L * Math.sin(a - 0.5))}L${n(x1)} ${n(y1)}L${n(x1 - L * Math.cos(a + 0.5))} ${n(y1 - L * Math.sin(a + 0.5))}" style="fill:none;stroke:${INK};stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`;
})();
// An adult as a plain head and shoulders: no face, no sex shown.
const bust = (x, y, c) => { const col = `color-mix(in oklab, ${c} 56%, var(--sim-bg-surface))`; return form(`M${n(x - 18)} ${n(y + 14)}C${n(x - 18)} ${n(y - 6)} ${n(x + 18)} ${n(y - 6)} ${n(x + 18)} ${n(y + 14)}Z`, col, { ao: 5, rim: 1.6, hi: 56, lo: 72 }) + form(`M${n(x - 11)} ${n(y - 15)}A11 11 0 1 1 ${n(x + 11)} ${n(y - 15)}A11 11 0 1 1 ${n(x - 11)} ${n(y - 15)}Z`, col, { ao: 5, rim: 1.6, hi: 56, lo: 72 }); };
function amoeba(x, y, r, seed = 0) {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2, d = r * (0.84 + 0.28 * Math.sin(i * 2.6 + seed)); return [x + Math.cos(a) * d, y + Math.sin(a) * d * 0.86]; });
  let d = `M${n((pts[0][0] + pts[9][0]) / 2)} ${n((pts[0][1] + pts[9][1]) / 2)}`;
  pts.forEach((p, i) => { const q = pts[(i + 1) % 10]; d += `Q${n(p[0])} ${n(p[1])} ${n((p[0] + q[0]) / 2)} ${n((p[1] + q[1]) / 2)}`; });
  const col = 'color-mix(in oklab, var(--sim-series-3) 42%, var(--sim-bg-surface))';
  let g = '';
  for (let i = 0; i < 40; i++) { const a = i * 2.4, q = Math.sqrt((i + 0.5) / 40) * r * 0.8; g += `<circle cx="${n(x + Math.cos(a) * q)}" cy="${n(y + Math.sin(a) * q * 0.86)}" r="${n(Math.max(0.8, r * 0.03))}" style="fill:color-mix(in oklab, ${col} ${i % 3 ? 60 : 80}%, ${i % 3 ? 'black' : 'white'});opacity:0.5"/>`; }
  g += `<circle cx="${n(x - r * 0.1)}" cy="${n(y)}" r="${n(r * 0.3)}" style="fill:var(--sim-nucleus);stroke:var(--sim-nucleus-stroke);stroke-width:1;opacity:0.85"/><circle cx="${n(x + r * 0.42)}" cy="${n(y - r * 0.3)}" r="${n(r * 0.12)}" style="fill:color-mix(in oklab, var(--sim-series-1) 30%, var(--sim-bg-surface));opacity:0.8"/>`;
  return form(`${d}Z`, col, { ao: Math.max(5, r * 0.26), rim: 1.8, hi: 60, lo: 76, aoOp: 0.4, inner: g });
}
const cm = (a, b, k) => `color-mix(in oklab, ${a} ${k}%, ${b})`;
// A raised bed in a garden: a far hedge out of focus, a thin line of soil, timber sleepers in front.
function garden(st, gy) {
  const W = st.W, H = st.H, wood = cm(cm(cm('var(--sim-series-2)', 'var(--sim-series-8)', 40), 'var(--sim-bg-surface)', 66), 'var(--sim-stroke)', 72);
  let g = '';
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { const y = gy + 16 + r * 16 + (i * 7 % 5), x = (i + 0.3 + (r * 0.5)) * W / 12; g += `<path d="M${n(x - 30)} ${n(y)}Q${n(x)} ${n(y - 4)} ${n(x + 34)} ${n(y + 2)}" style="fill:none;stroke:${cm(wood, 'black', 60)};stroke-width:1.2;opacity:0.4"/>`; }
  const y0 = gy + 8;
  return artDefs() + field(st, 'clb', { a: 3, b: 2, seed: 29, k: 15, x: 1 }) + hedge(W, gy * 0.74, gy * 0.3, { seed: 11 })
    + svgSoil(-4, gy - 8, 1, { w: W + 8, h: 22, seed: 5 })
    + form(`M-4 ${n(y0)}L${W + 4} ${n(y0)}L${W + 4} ${H + 4}L-4 ${H + 4}Z`, wood, { ao: 8, aoOp: 0.34, rim: 2, hi: 58, lo: 74, inner: g })
    + [0.32, 0.72].map((u) => `<path d="M${n(W * u)} ${n(y0)}L${n(W * u)} ${H}" style="fill:none;stroke:${cm(wood, 'black', 54)};stroke-width:2.4;opacity:0.5"/>`).join('');
}

export class ChapterLoopScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5)];
  static COLOR_MAP = PLANT_COLOR_MAP;
  static WIDTH = 640;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'A summary: asexual reproduction from one parent gives copies; sexual reproduction from two parents passes through gametes and a zygote to young ones. A farmer chooses copies or variation. An amoeba divides into two, and the question of whether it grows old stays open.';
  css() { return '.svs { padding: 0; }'; }
  stageHeight(st) { return st.portrait ? 440 : 390; }
  _asex(cx, cy, w) {
    const gy = cy + 76;
    const big = w < 400 ? 0.96 : 1, sm = big * (w < 400 ? 0.62 : 0.84);
    let s = svgRosePlant(cx - w * (w < 400 ? 0.3 : 0.34), gy, big, { blooms: 3, tint: 'red' });
    s += arrow(cx - w * (w < 400 ? 0.1 : 0.17), cy - 22, cx + w * (w < 400 ? 0.04 : -0.03), cy - 22);
    s += svgRosePlant(cx + w * (w < 400 ? 0.16 : 0.12), gy, sm, { blooms: 3, tint: 'red' }) + svgRosePlant(cx + w * (w < 400 ? 0.39 : 0.37), gy, sm, { blooms: 3, tint: 'red' });
    return s;
  }
  _ring(cx, cy, r) {
    const N = [[-90, 'Two parents'], [0, 'Gametes'], [90, 'Zygote'], [180, 'New young one']];
    let s = '';
    N.forEach(([d], i) => {
      const a1 = ((d + 28) * Math.PI) / 180, a2 = ((d + 62) * Math.PI) / 180;
      s += arrow(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r * 0.82, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r * 0.82);
    });
    N.forEach(([d, l]) => {
      const a = (d * Math.PI) / 180, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.82;
      if (d === 0) s += eggSvg(x - 14, y - 12, 19, {}) + spermSvg(x + 32, y - 14, 7, 24, 0, { phase: 1 });
      if (d === 90) s += cellSvg(x, y - 12, 22, { col: BODY.egg, nucR: 0.5 });
      if (d === -90) s += bust(x - 20, y - 8, 'var(--sim-series-1)') + bust(x + 20, y - 8, 'var(--sim-series-3)');
      if (d === 180) s += embryoSvg(9, x, y - 14, 52);
      s += tag(x, y + 24, l, { size: 14 });
    });
    return s;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = '';
    if (step === 0) {
      if (P) {
        const ph = (H - 52) / 2, r1 = 50 + ph - 12, r2 = 50 + 2 * ph - 12;
        s += tag(W / 2, 28, 'New individuals of their own kind', { size: 15, display: true });
        [r1, r2].forEach((gy, i) => { s += svgSoil(8, gy, 1, { w: W - 16, h: 12, seed: 4 + i }); });
        s += tag(W * 0.8, 72, 'Asexual', { size: 15, display: true }) + tag(W * 0.8, 72 + ph, 'Sexual', { size: 15, display: true });
        s += svgRosePlant(W * 0.2, r1 + 3, 0.72, { blooms: 3, tint: 'red' }) + svgRosePlant(W * 0.56, r1 + 3, 0.44, { blooms: 2, tint: 'red' });
        s += svgRosePlant(W * 0.17, r2 + 3, 0.72, { blooms: 3, tint: 'red', seed: 2 }) + svgRosePlant(W * 0.76, r2 + 3, 0.72, { blooms: 3, tint: 'yellow', seed: 5 }) + svgRosePlant(W * 0.47, r2 + 3, 0.44, { blooms: 2, tint: 'pink', seed: 4 });
      } else {
      const gy = H - (P ? 40 : 36), L = W * 0.26, R = W * 0.74, u = P ? 0.56 : 0.94;
      s += tag(W / 2, 30, 'New individuals of their own kind', { size: P ? 15 : 18, display: true });
      s += tag(L, 68, P ? 'Asexual' : 'Asexual: one parent', { size: P ? 15 : 16, display: true }) + tag(R, 68, P ? 'Sexual' : 'Sexual: two parents', { size: P ? 15 : 16, display: true });
      s += `<path d="M${n(W / 2)} 54L${n(W / 2)} ${n(gy - 14)}" style="fill:none;stroke:${INK};stroke-width:1.8;opacity:0.35;stroke-dasharray:3 8"/>`;
      s += svgRosePlant(L - W * 0.1, gy, u, { blooms: 3, tint: 'red' }) + svgRosePlant(L + W * 0.12, gy, u * 0.58, { blooms: 2, tint: 'red' });
      s += svgRosePlant(R - W * 0.14, gy, u, { blooms: 3, tint: 'red', seed: 2 }) + svgRosePlant(R + W * 0.14, gy, u, { blooms: 3, tint: 'yellow', seed: 5 }) + svgRosePlant(R, gy, u * 0.58, { blooms: 2, tint: 'pink', seed: 4 });
      }
    } else if (step === 1) {
      s += tag(W / 2, 32, 'Asexual: one parent, copies', { size: 18, display: true });
      s += this._asex(W / 2, H - 142, Math.min(W, 580));
      const y = H - 30;
      if (P) { s += tag(52, y, 'Budding', { size: 14 }) + tag(132, y, 'Spores', { size: 14 }) + tag(254, y, 'Vegetative parts', { size: 14 }); } else s += tag(W * 0.2, y, 'Budding', { size: 15 }) + tag(W * 0.5, y, 'Spore formation', { size: 15 }) + tag(W * 0.8, y, 'Vegetative parts', { size: 15 });
    } else if (step === 2) {
      s += tag(W / 2, 30, 'Sexual: two parents', { size: 18, display: true });
      s += this._ring(W / 2, H * 0.54, P ? 112 : 150);
    } else if (step === 3) {
      const rows = [['Copies of one variety', ['red', 'red', 'red', 'red', 'red'], 'Quick, but one shared weakness'], ['Seeds: new mixes', ['red', 'yellow', 'pink', 'wild', 'yellow'], 'Variety, for new problems']];
      rows.forEach(([a, tones, c], i) => {
        const ph = (H - 8) / 2, y = 2 + i * ph, gy = y + ph - 42;
        s += svgSoil(8, gy, 1, { w: W - 16, h: 14, seed: 3 + i });
        tones.forEach((t, j) => { s += svgRosePlant(12 + (W - 24) * (j + 0.5) / 5, gy + 4, P ? 0.56 : 0.66, { blooms: i ? 2 + (j % 2) : 2, tint: t, seed: i ? j + 1 : 3 }); });
        s += tag(W / 2, y + 20, a, { size: 16, display: true }) + tag(W / 2, y + ph - 16, c, { size: 14 });
      });
    } else if (step === 4) {
      const ph = H * 0.42, y1 = 12, cy = y1 + ph * 0.64, r = P ? 16 : 21, x0 = W * (P ? 0.13 : 0.16), x1 = W * 0.5, x2 = W * (P ? 0.86 : 0.84), gy = H - 34;
      s += panel(12, y1, W - 24, ph);
      s += txt(W / 2, y1 + 28, P ? 'Good conditions: fast copying' : 'Good conditions: copying is fast', { size: P ? 16 : 19, display: true });
      s += amoeba(x0, cy, r * 1.3, 1) + arrow(x0 + r * 1.9, cy, x1 - r * 2, cy) + amoeba(x1, cy - r * 1.2, r * 1.05, 1) + amoeba(x1, cy + r * 1.2, r * 1.05, 2) + arrow(x1 + r * 1.9, cy, x2 - r * 2.3, cy);
      [[-1, -1, 1], [1, -1, 2], [-1, 1, 3], [1, 1, 1]].forEach(([a, b, q]) => { s += amoeba(x2 + a * r * 1.15, cy + b * r * 1.2, r * 0.92, q); });
      s += tag(W / 2, y1 + ph + 20, P ? 'Changing surroundings: variation' : 'Changing surroundings: variation helps', { size: P ? 14 : 16, display: true });
      ['red', 'yellow', 'pink', 'wild'].forEach((t, j) => { s += svgRosePlant(W * (0.14 + j * 0.24), gy, P ? 0.5 : 0.62, { blooms: 2 + (j % 2), tint: t, seed: j + 1 }); });
    } else {
      const y = H * 0.48, dx = P ? 68 : 130;
      s += amoeba(W / 2 - dx * 1.1, y, P ? 70 : 92, 1) + arrow(W / 2 - dx * 0.2, y, W / 2 + dx * 0.14, y - 42) + arrow(W / 2 - dx * 0.2, y, W / 2 + dx * 0.14, y + 42);
      s += amoeba(W / 2 + dx * 1.1, y - 76, P ? 56 : 68, 1) + amoeba(W / 2 + dx * 1.1, y + 76, P ? 56 : 68, 2);
      s += tag(W / 2, 30, 'Almost two identical copies', { size: 17, display: true }) + tag(W / 2, H - 38, 'Does it ever grow old?', { size: 19, display: true, rim: BODY.egg });
    }
    return { svg: frame(st, 'cl', s, step === 2 || step === 5 || (step === 0 && P) ? { field: { a: 3, b: 1, seed: 25, k: 12 } } : step === 3 ? { field: { a: 2, b: 3, seed: 33, k: 13 } } : { back: garden(st, step === 1 ? H - 66 : H - (step === 0 ? (P ? 40 : 36) : 34)) }) };
  }
}
