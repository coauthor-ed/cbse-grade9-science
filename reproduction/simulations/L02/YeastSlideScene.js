// YeastSlideScene - blk-l02-s03. Beat 0: test tube, sugar solution, yeast, cotton plug. Beat 1: microscope view, round
// cells. Beat 2: buds on some cells, one large with a neck. Beat 3: a hydra as in the book's figure: tube, tentacles, foot, a large bud and a new one.
// Cell positions are drawn, not counted: no count is shown.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgPlantColour as pc, label, labelWhite, leader, frame, fill, stroke } from '../shared/PlantArt.js';

import { tiles, bench, microField, lightFall, contact } from '../shared/Scapes.js';
import { yeastCell, hydra } from '../shared/CellArt.js';
const one = (idx) => [{ idx, dwellMs: null }];
const CELLS = [[0.2, 0.3], [0.36, 0.2], [0.55, 0.26], [0.74, 0.3], [0.27, 0.52], [0.46, 0.5], [0.66, 0.54], [0.82, 0.5], [0.2, 0.74], [0.4, 0.76], [0.58, 0.78], [0.76, 0.74]];
const BUD = { 1: 0, 3: 0.9, 6: 2.4, 8: 4 };
const DARKW = 'color-mix(in oklab, var(--sim-sea-deep) 34%, var(--sim-strata-6))';
const YEAST = 'color-mix(in oklab, var(--sim-strata-1) 60%, var(--sim-elev-peak))', YINK = 'var(--sim-strata-3)';

function view(W, H, cx, cy, R, body, id) {
  return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${R + 10}" ${fill(pc('ink'))}/><g clip-path="url(#${id})">${microField(W, H, { tone: 'warm', seed: 5 })}${body}</g><circle cx="${cx}" cy="${cy}" r="${R + 1}" style="fill:none;stroke:var(--sim-strata-6);stroke-width:10;opacity:.34;filter:url(#pa-soft)"/>`;
}
export class YeastSlideScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A test tube of sugar solution with yeast and a cotton plug. Round yeast cells under a microscope. Some cells carry round buds. A hydra, a soft tube with a ring of slender tentacles at the top and a foot at the base, with a large bud and a new bud on its side.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 330 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = '';
    if (step === 0) {
      const gy = H * 0.86, tx = W * 0.38, tw = P ? 96 : 128, top = 56, bot = gy - 16;
      s += tiles(W, gy + 6, { size: 52 }) + bench(W, gy, H, { planks: 2 }) + contact(tx, gy + 3, tw * 0.8, 7, 0.45);
      const tube = `M${tx - tw / 2} ${top}V${bot - tw / 2}a${tw / 2} ${tw / 2} 0 0 0 ${tw} 0V${top}Z`, lq = top + (bot - top) * 0.34;
      s += `<path d="${tube}" ${fill(pc('glass'))} opacity="0.5"/>`;
      s += `<path d="M${tx - tw / 2 + 4} ${lq}V${bot - tw / 2}a${tw / 2 - 4} ${tw / 2 - 4} 0 0 0 ${tw - 8} 0V${lq}Z" style="fill:url(#pa-gel) ${pc('gel')}"/>`;
      s += `<ellipse cx="${tx}" cy="${lq}" rx="${tw / 2 - 4}" ry="7" ${fill(pc('yellowLit'), `stroke:${pc('gelDark')};stroke-width:1.5`)}/>`;
      for (let i = 0; i < 9; i++) s += `<circle cx="${tx - tw * 0.3 + (i * 37 % 60) / 60 * tw * 0.6}" cy="${lq + 30 + (i * 53 % 80) / 80 * (bot - lq - 70)}" r="${2 + i % 3}" style="fill:var(--sim-elev-peak);opacity:.6"/>`;
      const dots = [[-16, 0], [8, -6], [-2, 8], [18, 6], [-22, -12], [14, -18], [0, -22]];
      dots.forEach(([a, b], i) => { s += `<g class="sv-pop" style="--d:${i * 0.05}s"><circle cx="${tx + a * (tw / 92)}" cy="${bot - 26 + b}" r="7" ${fill(YEAST, `stroke:${YINK};stroke-width:2.5`)}/></g>`; });
      s += `<path d="${tube}" style="fill:url(#pa-glass);stroke:${pc('glassEdge')};stroke-width:3"/><path d="M${tx - tw / 2 + 13} ${top + 22}V${bot - tw / 2}" ${stroke(pc('glassLit'), 7)}/>`;
      for (let i = 0; i < 6; i++) s += `<circle cx="${tx - tw * 0.42 + i * tw * 0.17}" cy="${top - 18 + (i % 2) * 16}" r="${tw * 0.17}" ${fill(i % 2 ? pc('cloudShade') : pc('cloud'))}/>`;
      for (let i = 0; i < 5; i++) s += `<circle cx="${tx - tw * 0.32 + i * tw * 0.16}" cy="${top - 6 - (i % 2) * 8}" r="${tw * 0.13}" ${fill(pc('cloud'))}/>`;
      const lx = W * 0.78, sz = P ? 15 : 18;
      s += label(lx, 62, 'Cotton plug', { size: sz, display: true }) + leader(lx - (P ? 42 : 54), 58, tx + tw / 2 + 12, 44);
      s += label(lx, H * 0.46, '20 mL sugar', { size: sz, display: true }) + label(lx, H * 0.46 + 22, 'solution', { size: sz, display: true }) + leader(lx - (P ? 44 : 56), H * 0.46 - 4, tx + tw / 2 - 4, H * 0.46);
      s += label(lx, bot - 34, 'Yeast', { size: sz, display: true }) + leader(lx - 30, bot - 38, tx + tw / 2 - 6, bot - 30);
      s += label(W * 0.14, 34, 'Warm', { size: sz, display: true }) + label(W * 0.14, 56, 'place', { size: sz, display: true });
    } else if (step < 3) {
      const R = Math.min(W, H) * 0.47, cx = W / 2, cy = H / 2, x0 = cx - R, y0 = cy - R, D = 2 * R, r = D * 0.076;
      let b = '';
      CELLS.forEach(([u, v], i) => {
        const x = x0 + u * D, y = y0 + v * D, q = step === 2 ? BUD[i] ?? 0 : 0;
        b += q ? `<g class="sv-pop" style="--d:${q * 0.05}s">${yeastCell(x, y, r, { rot: i * 40, bud: q / 4, budAt: -0.7 + i })}</g>` : yeastCell(x, y, r, { rot: i * 40 });
      });
      s += `<rect width="${W}" height="${H}" ${fill(pc('ink'))}/>` + view(W, H, cx, cy, R, b, 'ys-view');
      const lz = P ? 16 : 20;
      if (step === 1) s += labelWhite(P ? W * 0.5 : W * 0.13, P ? 26 : H * 0.5, 'Yeast', { size: lz, display: true }) + (P ? '' : labelWhite(W * 0.13, H * 0.5 + 24, 'cells', { size: lz, display: true }));
      else s += labelWhite(P ? W * 0.5 : W * 0.13, P ? 26 : H * 0.5, 'Buds', { size: lz, display: true }) + (P ? '' : labelWhite(W * 0.13, H * 0.5 + 24, 'on cells', { size: lz, display: true }));
    } else {
      // As in the book's figure: a pale animal on a dark field, seen through a lens, its foot on a sunken leaf.
      const fy = H * (P ? 0.91 : 0.92), x = W * (P ? 0.4 : 0.44), k = (fy - 26) / (P ? 338 : 330);
      s += `<rect width="${W}" height="${H}" ${fill(DARKW)}/>` + lightFall(W, H, W * 0.14, { a: 0.1 });
      for (let i = 0; i < 24; i++) s += `<circle cx="${(i * 197) % W}" cy="${(i * 113) % Math.round(fy)}" r="${1 + i % 3}" style="fill:var(--sim-elev-peak);opacity:${0.05 + (i % 4) * 0.04}"/>`;
      s += `<path d="M-6 ${fy + 2}Q${W * 0.3} ${fy - 12} ${W * 0.62} ${fy}T${W + 6} ${fy - 6}V${H + 6}H-6Z" ${fill('color-mix(in oklab, var(--sim-elev-low) 34%, var(--sim-sea-deep))')}/><path d="M-6 ${fy + 12}Q${W * 0.36} ${fy + 2} ${W + 6} ${fy + 8}" ${stroke('var(--sim-elev-peak)', 1.6, 'opacity:.2')}/>`;
      s += contact(x, fy + 2, 22 * k + 8, 5, 0.5);
      s += `<g class="sv-pop">${hydra(x, fy - 1, k, { lean: 14, buds: [{ t: 0.24, side: -1, len: 0.14, n: 0 }, { t: 0.3, side: 1, len: 0.46, n: 4 }] })}</g>`;
      const sz = P ? 15 : 18, pale = (a, b, c, d) => `<path d="M${a} ${b}L${c} ${d}" ${stroke('var(--sim-elev-peak)', 2)}/>`;
      const bx = x + 64 * k, by = fy - 112 * k, nx = x - 26 * k, ny = fy - 58 * k, lx = P ? W - 52 : W * 0.8, tx = P ? W * 0.17 : W * 0.2;
      s += labelWhite(lx, fy - 50, 'A bud', { size: sz, display: true }) + pale(lx - 8, fy - 68, bx + 8, by + 8);
      s += labelWhite(tx, fy - 30, 'A new bud', { size: sz, display: true }) + pale(tx + 20, fy - 46, nx - 8, ny + 4);
      s += labelWhite(W * (P ? 0.84 : 0.8), 34, 'Hydra', { size: P ? 20 : 24, display: true });
    }
    return { svg: frame(st, 'ys', s) };
  }
}
