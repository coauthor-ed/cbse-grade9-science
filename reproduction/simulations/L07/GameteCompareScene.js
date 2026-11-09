// GameteCompareScene - how gametes form and how they differ, under a microscope-like light. 4 beats:
// 0 a body cell with 46 chromosomes, meiosis, sperm and egg with 23 each. 1 the book's four-row comparison beside the two cells.
// 2 egg and sperm at roughly one true scale (egg about 120 micrometres, sperm about 55 long). 3 a section of an ovary:
// millions of immature eggs from birth, usually one mature egg a month from puberty. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { frame, tag, txt, eggSvg, spermSvg, cellSvg, form, panel, lightGrad, n, BODY, MUTED, INK } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const ROWS = [['Size', 'Very small', 'Large'], ['Number made', 'Millions', 'Few'], ['Stored nutrients', 'Absent', 'Present'], ['Movement', 'Actively motile', 'Non-motile']];
const threads = (x, y, count, w, h, gap, cols, tones) => {
  let s = '';
  for (let i = 0; i < count; i++) {
    const c = i % cols, r = Math.floor(i / cols), col = tones[i % tones.length];
    s += `<rect x="${n(x + c * (w + gap) - ((cols - 1) * (w + gap)) / 2 - w / 2)}" y="${n(y + r * (h + gap))}" width="${w}" height="${h}" rx="${w / 2}" transform="rotate(${(i * 37) % 24 - 12} ${n(x + c * (w + gap) - ((cols - 1) * (w + gap)) / 2)} ${n(y + r * (h + gap) + h / 2)})" style="fill:${col};stroke:color-mix(in oklab, ${col} 60%, black);stroke-width:0.6"/>`;
  }
  return s;
};
const G = 'var(--sim-series-2)', C = 'var(--sim-series-7)';

export class GameteCompareScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 460;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'Sperm and egg compared: a body cell with 46 chromosomes gives gametes with 23; a table of size, number, stored nutrients and movement; the two cells at roughly one scale; and an ovary holding many immature eggs.';
  css() { return '.svs { padding: 0; }'; }
  stageHeight(st) { return st.portrait ? 440 : 400; }

  _half(st) {
    const W = st.W, P = st.portrait, mid = W / 2;
    const y0 = P ? 92 : 96, y1 = P ? 318 : 292, dx = P ? 96 : 176, r0 = P ? 78 : 84;
    let s = cellSvg(mid, y0, r0, { col: 'color-mix(in oklab, var(--sim-series-4) 40%, var(--sim-bg-surface))', nucR: 0.66 });
    s += threads(mid - 2, y0 - 38, 46, 3.4, 9, 2.6, 9, [G, C]);
    s += P ? tag(mid, y0 + r0 + 8, 'Body cell: 46', { size: 16, display: true }) : tag(mid + 170, y0 - 10, 'Body cell: 46', { size: 16, display: true });
    s += txt(mid, y0 + r0 + (P ? 46 : 28), 'meiosis halves the number', { size: 16, col: MUTED });
    for (const [sg, lab] of [[-1, 'Sperm: 23'], [1, 'Egg: 23']]) {
      const x = mid + sg * dx;
      s += `<path d="M${mid + sg * 42} ${y0 + r0 + (P ? 56 : 40)}L${n(x)} ${y1 - 60}" style="fill:none;stroke:${INK};stroke-width:3.5;stroke-linecap:round;stroke-dasharray:2 10"/>`;
      s += sg < 0 ? spermSvg(x + 30, y1, 20, 82, 0, { phase: 1 }) : eggSvg(x, y1, 42, { id: 'gc0' }) + threads(x - 2, y1 - 14, 23, 2.6, 6, 1.8, 6, [G]);
      s += tag(x, y1 + (P ? 78 : 74), lab, { size: 16, display: true });
    }
    return s;
  }
  _table(st) {
    const W = st.W, H = st.H, P = st.portrait, x0 = P ? 8 : 18, w = W - 2 * x0;
    const c1 = x0 + w * (P ? 0.17 : 0.18), c2 = x0 + w * (P ? 0.51 : 0.54), c3 = x0 + w * (P ? 0.83 : 0.84);
    const top = P ? 110 : 112, rh = (H - top - 18) / 4;
    let s = spermSvg(c2 + 32, 44, 15, 66, 0, { phase: 1 }) + eggSvg(c3, 40, 22, { id: 'gc1' });
    s += txt(c2, 92, 'Sperm', { size: 19, display: true }) + txt(c3, 92, 'Egg', { size: 19, display: true });
    s += panel(x0, top - 4, w, H - top - 8);
    ROWS.forEach((r, i) => {
      const y = top + i * rh;
      if (i) s += `<path d="M${x0 + 14} ${n(y)}L${x0 + w - 14} ${n(y)}" style="fill:none;stroke:var(--sim-stroke);stroke-width:1.5;opacity:0.6"/>`;
      const lab = r[0].split(' ');
      if (P && lab.length > 1) { s += txt(c1, y + rh * 0.42, lab[0], { size: 15, col: MUTED }) + txt(c1, y + rh * 0.42 + 18, lab[1], { size: 15, col: MUTED }); } else s += txt(c1, y + rh * 0.6, r[0], { size: 15, col: MUTED });
      const v = r[1].split(' ');
      if (P && v.length > 1) { s += txt(c2, y + rh * 0.42, v[0], { size: 17, display: true }) + txt(c2, y + rh * 0.42 + 19, v[1], { size: 17, display: true }); } else s += txt(c2, y + rh * 0.6, r[1], { size: 18, display: true });
      s += txt(c3, y + rh * 0.6, r[2], { size: P ? 17 : 18, display: true });
    });
    return s;
  }
  _scale(st) {
    const W = st.W, H = st.H, P = st.portrait, r = P ? 112 : 134, ex = P ? W / 2 : W * 0.34, ey = P ? 158 : H / 2 + 6;
    const um = (2 * r) / 120, hh = 2.5 * um, L = 50 * um;
    let s = eggSvg(ex, ey, r, { id: 'gc2' });
    const sx = P ? W * 0.74 : W * 0.78, sy = P ? H - 118 : H * 0.38;
    s += spermSvg(sx + L * 0.4, sy, hh, L, 0, { phase: 2 });
    s += P ? tag(W * 0.74, H - 80, 'Sperm', { size: 16, display: true }) : tag(sx, sy + 42, 'Sperm', { size: 16, display: true });
    s += P ? tag(W * 0.24, H - 80, 'Egg', { size: 16, display: true }) : tag(sx, H - 74, 'Egg: about 0.1 mm', { size: 15, display: true });
    s += P ? tag(W / 2, H - 30, 'Roughly one scale', { size: 14, col: MUTED }) : tag(sx, H - 34, 'Roughly one scale', { size: 14, col: MUTED });
    return s;
  }
  _ovary(st) {
    const W = st.W, H = st.H, P = st.portrait, cx = W / 2, cy = P ? 200 : 204, rx = P ? 166 : 268, ry = P ? 142 : 150;
    let d = '';
    for (let i = 0; i <= 50; i++) { const a = (i / 50) * 6.283, q = 1 + Math.sin(a * 6) * 0.018 + Math.sin(a * 11) * 0.012; d += `${i ? 'L' : 'M'}${n(cx + Math.cos(a) * rx * q)} ${n(cy + Math.sin(a) * ry * q)}`; }
    const [g, url] = lightGrad(`color-mix(in oklab, ${BODY.egg} 42%, white)`, { hi: 50, lo: 72 });
    let inner = `<defs>${g}</defs>`;
    const hx = cx + rx * 0.4, hy = cy - ry * 0.14, hr = P ? 54 : 66;
    for (let i = 0; i < 150; i++) {
      const a = i * 2.39996, q = Math.sqrt((i + 0.5) / 150) * 0.94, x = cx + Math.cos(a) * q * rx, y = cy + Math.sin(a) * q * ry;
      if (Math.hypot(x - hx, y - hy) < hr + 8) continue;
      const r = 2.5 + (i % 7 === 0 ? 3.5 : i % 3 === 0 ? 1.6 : 0);
      inner += `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" style="fill:${url};stroke:color-mix(in oklab, ${BODY.ovary} 58%, black);stroke-width:0.9"/>`;
    }
    let s = form(`${d}Z`, `color-mix(in oklab, ${BODY.ovary} 58%, var(--sim-bg-surface))`, { ao: 26, rim: 2.6, hi: 44, lo: 70, inner });
    s += `<circle cx="${n(hx)}" cy="${n(hy)}" r="${hr + 7}" style="fill:color-mix(in oklab, var(--sim-series-1) 18%, var(--sim-bg-surface));stroke:color-mix(in oklab, ${BODY.ovary} 58%, black);stroke-width:2"/>`;
    s += eggSvg(hx, hy, hr * 0.62, { id: 'gc3' });
    s += tag(W / 2, 26, 'Millions of immature eggs at birth', { size: P ? 14 : 15 });
    s += tag(W / 2, H - 28, P ? 'Usually one mature egg a month' : 'From puberty: usually one mature egg a month', { size: P ? 14 : 15, display: !P });
    return s;
  }
  paint(st) {
    const step = this.stepIndex;
    return { svg: frame(st, 'gc', [this._half, this._table, this._scale, this._ovary][step].call(this, st), { field: { a: 2, b: 1, seed: 8, k: 12 } }) };
  }
}
