// PlantFromCellScene - blk-l09-n01. Beat 0: one living cell from a mature leaf on a nutrient gel. Beat 1: the same cell
// divides, and its daughters form different types of cell: shoot and root. Beat 2: bottles of plantlets on a bench.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, leader, svgLeaf, svgBottle, stroke } from '../shared/PlantArt.js';
import { cwFrame, plantCell, T, mx, n1 } from '../shared/CellWorld.js';
// Inside a clean culture hood: a pale back panel lit from above, a steel work top with a soft reflection, the lower
// edge of the glass sash across the top. Its own setting: no shared bench or tiles.
function hood(W, H, gy) {
  let s = `<defs><linearGradient id="pc-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('elev-low', 'elev-peak', 18)}"/><stop offset="1" style="stop-color:${mx('strata-1', 'elev-peak', 40)}"/></linearGradient>`
    + `<linearGradient id="pc-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-deep', 'elev-peak', 50)}"/><stop offset=".4" style="stop-color:${mx('sea-deep', 'elev-peak', 22)}"/><stop offset="1" style="stop-color:${mx('sea-deep', 'elev-peak', 44)}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" style="fill:url(#pc-wall) ${T('elev-peak')}"/>`;
  for (let i = 1; i < 6; i++) s += `<path d="M${n1((W * i) / 6)} 0V${n1(gy)}" ${stroke(mx('strata-3', 'elev-peak', 40), 1, 'opacity:.35')}/>`;
  s += `<ellipse cx="${n1(W / 2)}" cy="0" rx="${n1(W * 0.5)}" ry="${n1(gy * 0.5)}" style="fill:${T('elev-peak')};opacity:.55;filter:url(#pa-softer)"/>`;
  s += `<rect x="0" y="0" width="${W}" height="14" style="fill:${mx('sea-shallow', 'elev-peak', 50)};opacity:.7"/><rect x="0" y="14" width="${W}" height="3" style="fill:${mx('strata-4', 'elev-peak', 40)}"/>`;
  s += `<rect x="0" y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:url(#pc-top) ${T('strata-3')}"/><rect x="0" y="${n1(gy)}" width="${W}" height="3" style="fill:${T('elev-peak')};opacity:.8"/>`;
  return s;
}
// One soft plant cell: wall rim, lit cytoplasm, nucleus. tone: a token name for its tint.
function pcell(x, y, w, h, tone, seed = 1) {
  const r = Math.min(w, h) * 0.3, nx = x + ((seed % 3) - 1) * w * 0.12, ny = y + ((seed % 2) ? -1 : 1) * h * 0.08;
  return `<rect x="${n1(x - w / 2 + 2)}" y="${n1(y - h / 2 + 3)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(r)}" style="fill:${T('strata-6')};opacity:.14"/>`
    + `<rect x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(r)}" style="fill:${mx(tone, 'elev-peak', 50)};stroke:${mx(tone, 'strata-6', 58)};stroke-width:2.2"/>`
    + `<rect x="${n1(x - w / 2 + 3)}" y="${n1(y - h / 2 + 3)}" width="${n1(w - 6)}" height="${n1(h - 6)}" rx="${n1(r * 0.8)}" style="fill:url(#cw-cytoG) ${mx(tone, 'elev-peak', 30)};opacity:.85"/>`
    + `<circle cx="${n1(nx)}" cy="${n1(ny)}" r="${n1(Math.min(w, h) * 0.17)}" style="fill:url(#cw-nucIn) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 66)};stroke-width:1"/>`
    + `<path d="M${n1(x - w * 0.3)} ${n1(y - h * 0.32)}H${n1(x + w * 0.1)}" ${stroke(T('elev-peak'), 2, 'opacity:.7')}/>`;
}
import { arrow } from '../L08/DivideArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const box = (x, y, s, c, r = 5) => `<rect x="${n1(x - s / 2 + 2)}" y="${n1(y - s * 0.42 + 3)}" width="${s}" height="${n1(s * 0.84)}" rx="${r}" style="fill:${T('strata-6')};opacity:.16"/><rect x="${n1(x - s / 2)}" y="${n1(y - s * 0.42)}" width="${s}" height="${n1(s * 0.84)}" rx="${r}" style="fill:url(#cw-cytoG) ${mx(c, 'elev-peak', 44)};stroke:${mx(c, 'strata-6', 58)};stroke-width:2.6"/><rect x="${n1(x - s / 2 + 3)}" y="${n1(y - s * 0.42 + 3)}" width="${n1(s - 6)}" height="${n1(s * 0.84 - 6)}" rx="${r - 2}" style="fill:${c === 'elev-low' ? mx(c, 'elev-peak', 40) : mx(c, 'elev-peak', 50)};opacity:.72"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(s * 0.16)}" style="fill:${mx('series-5', 'elev-low', 66)}"/>`;
function dish(x, y, w) {
  return `<ellipse cx="${n1(x + 6)}" cy="${n1(y + 8)}" rx="${n1(w * 0.54)}" ry="${n1(w * 0.12)}" style="fill:${T('strata-6')};opacity:.26"/><path d="M${n1(x - w / 2)} ${n1(y - w * 0.11)}V${n1(y)}A${n1(w / 2)} ${n1(w * 0.12)} 0 0 0 ${n1(x + w / 2)} ${n1(y)}V${n1(y - w * 0.11)}Z" style="fill:${mx('sea-shallow', 'elev-peak', 24)};opacity:.75;stroke:${mx('sea-shallow', 'strata-6', 50)};stroke-width:3"/><ellipse cx="${n1(x)}" cy="${n1(y - w * 0.11)}" rx="${n1(w / 2)}" ry="${n1(w * 0.12)}" style="fill:${mx('gold', 'elev-peak', 34)};stroke:${mx('sea-shallow', 'strata-6', 50)};stroke-width:2.4"/>`;
}

export class PlantFromCellScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'One living cell from a mature leaf lies on a nutrient gel in a dish. It divides into a small group of cells, then the cells form different types, green shoot cells and pale root cells, and a tiny plant appears. Then bottles of small plants stand on a bench.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = H - (P ? 58 : 62), fs = P ? 15 : 18;
    let s = hood(W, H, gy);
    const title = (t) => label(W / 2, P ? 26 : 32, t, { size: P ? 18 : 22, display: true });
    if (step === 0) {
      s += title('One cell, drawn large, on nutrients');
      const dx = W * (P ? 0.5 : 0.62), dw = P ? 250 : 320, cx = dx, cy = gy - (P ? 138 : 158), c = P ? 150 : 180;
      s += dish(dx, gy + 2, dw);
      s += svgLeaf(P ? 58 : W * 0.15, P ? 190 : gy - 30, P ? 0.9 : 1.5, { len: 120, wide: 60, rot: 10 });
      s += plantCell(cx, cy, c, c * 0.86, { seed: 5 });
      s += leader(cx, cy + c * 0.46, cx, gy - dw * 0.11 - 4);
      s += label(dx, gy + (P ? 42 : 46), 'Nutrient gel', { size: fs, display: true });
      return { svg: cwFrame(st, 'pc', s) };
    }
    if (step === 1) {
      s += title('Daughter cells form new types');
      const y = gy - (P ? 46 : 60), xs = P ? [W * 0.2, W * 0.62, W * 0.34, W * 0.8] : [W * 0.09, W * 0.27, W * 0.55, W * 0.86], u = P ? 32 : 44, y1 = P ? 112 : y;
      const G = 'elev-low', S = 'chloro', R = 'strata-2';
      // the gel the cells sit on
      if (P) s += `<rect x="${n1(W * 0.06)}" y="${n1(y1 + u * 0.5)}" width="${n1(W * 0.88)}" height="${n1(u * 0.7)}" rx="10" style="fill:${mx('gold', 'elev-peak', 24)};opacity:.85;stroke:${mx('gold', 'strata-5', 40)};stroke-width:2"/>`;
      s += `<rect x="${n1(W * 0.03)}" y="${n1(y + u * 0.5)}" width="${n1(W * 0.94)}" height="${n1(gy - y - u * 0.5 + 4)}" rx="10" style="fill:${mx('gold', 'elev-peak', 24)};opacity:.85;stroke:${mx('gold', 'strata-5', 40)};stroke-width:2"/><path d="M${n1(W * 0.05)} ${n1(y + u * 0.5 + 5)}H${n1(W * 0.95)}" ${stroke(T('elev-peak'), 3, 'opacity:.7')}/>`;
      s += pcell(xs[0], y1, u * 1.3, u * 1.1, G, 1);
      s += pcell(xs[1] - u * 0.56, y1, u * 1.1, u, G, 2) + pcell(xs[1] + u * 0.56, y1, u * 1.1, u, G, 3);
      // a small mass: upper cells turning into shoot cells (green), lower into root cells (pale)
      const mass = [];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4 - (j === 0 ? 1 : 0); i++) mass.push([xs[2] + (i - (j === 0 ? 1 : 1.5)) * u * 0.86, y - (j * u * 0.78), j]);
      mass.forEach(([x, yy, j], k) => { s += pcell(x, yy, u * 0.84, u * 0.74, j >= 1 ? S : R, k); if (j >= 2) for (let c = 0; c < 3; c++) s += `<ellipse cx="${n1(x - u * 0.26 + c * u * 0.24)}" cy="${n1(yy + u * 0.2 - (c % 2) * u * 0.08)}" rx="${n1(u * 0.07)}" ry="${n1(u * 0.045)}" style="fill:url(#cw-chl) ${T('chloro')}"/>`; });
      s += `<path d="M${n1(xs[2] - u * 0.2)} ${n1(y - u * 2.7)}q-6 -${n1(u * 0.6)} ${n1(u * 0.1)} -${n1(u * 0.9)}" ${stroke(T('chloro'), 4)}/>`;
      s += label(xs[2] + u * 1.7, y - u * 3.3, 'Shoot cells', { size: fs - 1, display: true }) + label(xs[2], y + u * 1.15, 'Root cells', { size: fs - 1, display: true });
      const px = xs[3], k = P ? 0.62 : 1;
      s += `<path d="M${n1(px)} ${n1(y + 8)}V${n1(y - 130 * k)}" ${stroke(mx('elev-low', 'strata-3', 40), 8 * k)}/>` + svgLeaf(px, y - 120 * k, k, { len: 90, wide: 42, rot: -46 }) + svgLeaf(px, y - 120 * k, k, { len: 90, wide: 42, rot: 46 }) + svgLeaf(px, y - 80 * k, k * 0.8, { len: 80, wide: 38, rot: -60 });
      s += `<path d="M${n1(px)} ${n1(y + 8)}q-12 16 -22 28M${n1(px)} ${n1(y + 8)}q2 18 -2 34M${n1(px)} ${n1(y + 8)}q12 14 20 26" ${stroke(mx('strata-1', 'elev-peak', 60), 3)}/>`;
      s += arrow(xs[0] + u * 0.85, y1, xs[1] - u * 1.25, y1, { w: 3, h: 7 }) + (P ? arrow(xs[1] - u * 0.3, y1 + u * 0.75, xs[2] + u * 0.6, y - u * 3.6, { w: 3, h: 7 }) : arrow(xs[1] + u * 1.25, y1 - u * 0.4, xs[2] - u * 1.8, y - u * 1.2, { w: 3, h: 7 })) + arrow(xs[2] + u * 1.85, y - u * 1.4, xs[3] - (P ? 24 : 44), y - u * 1.4, { w: 3, h: 7 });
      s += label(xs[0], y1 - u * 0.9, '1 cell', { size: fs }) + label(xs[3], y + u * 1.15, 'A plant', { size: fs, display: true });
      return { svg: cwFrame(st, 'pc', s) };
    }
    s += title('Plant tissue culture');
    const q = P ? 1.1 : 1.6;
    [[0.17, 6], [0.5, 9], [0.83, 12]].forEach(([u, n], i) => { s += `<g class="sv-pop" style="--d:${i * 0.14}s">${svgBottle(W * u, gy + 2, q, { lets: n })}</g>`; });
    return { svg: cwFrame(st, 'pc', s) };
  }
}
