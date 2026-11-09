// CellTimelineScene - blk-l09-s03a. A true-scale rail, 1650 to 1910, on a study wall. Cards fan out from the true dates, so
// the long gap after Hooke is plain. Beat 0: 1665. Beat 1: 1838, 1839. Beat 2: 1855 and the answer to the predict. Beat 3:
// 1898, 1902. Each beat lights its cards and keeps the earlier ones dim.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, svgLeaf, stroke } from '../shared/PlantArt.js';
import { cwFrame, golgi, T, mx, n1 } from '../shared/CellWorld.js';
import { divCell } from '../L08/DivideArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const DATES = [
  { y: 1665, who: 'Robert Hooke', what: 'boxes in cork', beat: 0, art: 'cork' },
  { y: 1838, who: 'Schleiden', what: 'all plants: cells', beat: 1, art: 'leaf' },
  { y: 1839, who: 'Schwann', what: 'all animals: cells', beat: 1, art: 'animal' },
  { y: 1855, who: 'Virchow', what: 'new cells from cells', beat: 2, art: 'divide' },
  { y: 1898, who: 'Golgi', what: 'the Golgi apparatus', beat: 3, art: 'golgi' },
  { y: 1902, who: 'Haberlandt', what: 'one cell, a whole plant', beat: 3, art: 'plant' },
];
const thumb = (a, x, y, k) => {
  if (a === 'cork') { let s = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += `<rect x="${n1(x - 22 * k + i * 15 * k)}" y="${n1(y - 19 * k + j * 13 * k)}" width="${n1(14 * k)}" height="${n1(12 * k)}" rx="2" style="fill:${mx('strata-2', 'elev-peak', 40)};stroke:${mx('strata-3', 'strata-6', 66)};stroke-width:2"/>`; return s; }
  if (a === 'leaf') return svgLeaf(x - 2 * k, y + 22 * k, k * 0.42, { len: 100, wide: 54, rot: 12 });
  if (a === 'animal') return divCell(x, y, 21 * k, { seed: 6 });
  if (a === 'divide') return divCell(x, y, 20 * k, { pinch: 0.72, seed: 3, ring: false });
  if (a === 'golgi') return golgi(x, y, 0.5 * k, { vesicles: false, rot: -8 });
  return svgLeaf(x - 9 * k, y + 21 * k, k * 0.3, { len: 100, wide: 50, rot: -24 }) + svgLeaf(x + 7 * k, y + 21 * k, k * 0.3, { len: 100, wide: 50, rot: 24 }) + `<circle cx="${n1(x)}" cy="${n1(y + 21 * k)}" r="${n1(5 * k)}" style="fill:${mx('elev-low', 'elev-peak', 50)};stroke:${mx('elev-low', 'strata-6', 60)};stroke-width:2"/>`;
};
const LAND = [[108, 96], [316, 96], [526, 96], [316, 340], [526, 340], [108, 340]]; // card centres: 1665, 1838, 1855, 1839, 1898, 1902
const LAND_OF = [0, 1, 3, 2, 4, 5];

export class CellTimelineScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 456;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A rail of years from 1650 to 1910. Cards appear for 1665 Robert Hooke, 1838 Schleiden, 1839 Schwann, 1855 Virchow, 1898 Golgi and 1902 Haberlandt. A long gap of 173 years separates Hooke from Schleiden.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 430 : 440; }
  /** Highest date beat shown. The setup variant overrides this. */
  shown() { return this.stepIndex; }
  mystery() { return false; }

  card(x, y, w, h, d, on, P) {
    const fill = on ? mx('strata-1', 'elev-peak', 34) : mx('strata-1', 'elev-peak', 18), rim = on ? mx('gold', 'strata-6', 76) : mx('strata-3', 'elev-peak', 56);
    let s = `<g opacity="${on ? 1 : 0.62}"><rect x="${n1(x - w / 2)}" y="${n1(y - h / 2 + 4)}" width="${w}" height="${h}" rx="14" style="fill:${rim}"/><rect x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${w}" height="${h}" rx="14" style="fill:${fill};stroke:${rim};stroke-width:2.4"/>`;
    const tx = x - w / 2 + (P ? 58 : 50), k = P ? 0.82 : 1;
    if (!P) s += thumb(d.art, x - w / 2 + 34, y - 8, k * 0.8);
    else s += thumb(d.art, x - w / 2 + 28, y, k * 0.86);
    const ink = T('strata-6');
    s += `<text x="${n1(P ? tx : tx + 12)}" y="${n1(y - h * 0.24 + (P ? 4 : 2))}" style="font-family:var(--sim-font-display);font-weight:700;font-size:${P ? 19 : 22}px;fill:${ink}">${d.y}<tspan dx="8" style="font-size:${P ? 16 : 14}px;font-weight:600">${P ? d.who : ''}</tspan></text>`;
    if (P) s += `<text x="${n1(tx)}" y="${n1(y + h * 0.32)}" style="font-family:var(--sim-font);font-weight:800;font-size:16px;fill:${ink}">${d.what}</text>`;
    else s += `<text x="${n1(tx + 12)}" y="${n1(y + 8)}" style="font-family:var(--sim-font);font-weight:800;font-size:15px;fill:${ink}">${d.who}</text>`;
    return s + '</g>';
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, shown = this.shown();
    let s = `<rect width="${W}" height="${H}" style="fill:${mx('strata-1', 'elev-peak', 30)}"/><rect width="${W}" height="${H}" style="fill:${T('strata-3')};opacity:.05;filter:url(#pa-fibre)"/>`;
    const list = DATES.filter((d) => d.beat <= shown);
    if (P) {
      const rx = 22, y0 = 22, y1 = H - 24, yr = (t) => y0 + ((t - 1650) / 260) * (y1 - y0), cw = 286, ch = 58, cx = W - cw / 2 - 8, gap = (H - 24) / 6;
      s += `<path d="M${rx} ${y0}V${y1}" ${stroke(mx('strata-3', 'strata-6', 60), 10)}/><path d="M${rx - 1} ${y0}V${y1}" ${stroke(mx('strata-2', 'elev-peak', 60), 3)}/>`;
      for (const t of [1700, 1750, 1800, 1850, 1900]) s += `<path d="M${rx - 8} ${n1(yr(t))}H${rx + 8}" ${stroke(mx('strata-3', 'strata-6', 60), 2.4)}/>`;
      DATES.forEach((d, i) => {
        const cy = 14 + (i + 0.5) * gap;
        if (d.beat > shown) { if (this.mystery() && d.y === 1855) s += this.ask(cx, cy, cw, ch, P); return; }
        s += `<path d="M${rx} ${n1(yr(d.y))}L${n1(cx - cw / 2)} ${n1(cy)}" ${stroke(mx('strata-3', 'strata-6', 70), 2.2)}/><circle cx="${rx}" cy="${n1(yr(d.y))}" r="7" style="fill:${T('gold')};stroke:${mx('gold', 'strata-6', 60)};stroke-width:2"/>`;
        s += this.card(cx, cy, cw, ch, d, d.beat === shown, P);
      });
      return { svg: cwFrame(st, 'ct', s) };
    }
    const ry = H * 0.5, x0 = 30, x1 = W - 30, xr = (t) => x0 + ((t - 1650) / 260) * (x1 - x0), cw = 184, ch = 100;
    s += `<rect x="${x0 - 8}" y="${ry - 9}" width="${x1 - x0 + 16}" height="18" rx="9" style="fill:${mx('strata-3', 'strata-6', 60)}"/><rect x="${x0 - 4}" y="${ry - 7}" width="${x1 - x0 + 8}" height="5" rx="2.5" style="fill:${mx('strata-2', 'elev-peak', 60)}"/>`;
    for (const t of [1700, 1750, 1800, 1850, 1900]) s += `<path d="M${n1(xr(t))} ${ry + 9}v9" ${stroke(mx('strata-3', 'strata-6', 60), 2.4)}/><text x="${n1(xr(t))}" y="${ry + 34}" text-anchor="middle" style="font-family:var(--sim-font);font-weight:800;font-size:14px;fill:${mx('strata-6', 'strata-3', 70)}">${t}</text>`;
    if (shown >= 1) s += label((xr(1665) + xr(1838)) / 2, ry - 20, '173 years', { size: 17, display: true });
    DATES.forEach((d, i) => {
      const [cx, cy0] = LAND[LAND_OF[i]], cy = cy0 * (H / 440), up = cy < ry;
      if (d.beat > shown) { if (this.mystery() && d.y === 1855) s += this.ask(cx, cy, cw, ch, P); return; }
      s += `<path d="M${n1(xr(d.y))} ${ry}L${n1(cx)} ${n1(cy + (up ? ch / 2 : -ch / 2))}" ${stroke(mx('strata-3', 'strata-6', 70), 2.2)}/><circle cx="${n1(xr(d.y))}" cy="${ry}" r="9" style="fill:${T('gold')};stroke:${mx('gold', 'strata-6', 60)};stroke-width:2"/>`;
      s += this.card(cx, cy, cw, ch, d, d.beat === shown, P);
      s += P ? '' : `<text x="${n1(cx)}" y="${n1(cy + ch / 2 - 12)}" text-anchor="middle" style="font-family:var(--sim-font);font-weight:800;font-size:14px;fill:${T('strata-6')}">${d.what}</text>`;
    });
    return { svg: cwFrame(st, 'ct', s) };
  }
  ask(cx, cy, cw, ch, P) {
    return `<rect x="${n1(cx - cw / 2)}" y="${n1(cy - ch / 2)}" width="${cw}" height="${ch}" rx="14" style="fill:${mx('strata-1', 'elev-peak', 12)};stroke:${mx('strata-3', 'strata-6', 70)};stroke-width:2.6;stroke-dasharray:8 7"/>` + label(cx, cy + 16, '?', { size: P ? 34 : 50, display: true });
  }
}
