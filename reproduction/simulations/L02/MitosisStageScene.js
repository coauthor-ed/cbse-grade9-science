// MitosisStageScene - blk-l02-s04. One cell with four chromosomes, a number drawn so that it can be counted. Beat 0: in the
// nucleus. Beat 1: each copied. Beat 2: copies pulled to opposite ends, cell pinching. Beat 3: two cells, four each.
// Beat 4: the two daughter cells, above the four cases the same division stands behind, each drawn.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, frame, svgStem, svgRoots, svgPlantColour as pc, stroke } from '../shared/PlantArt.js';
import { cellBody, rod, doubled, pairTone, yeastCell, hydraThumb, HYDRA_FIELD } from '../shared/CellArt.js';

import { microField } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const COLS = [pairTone(0), pairTone(1), pairTone(2), pairTone(3)];

export class MitosisStageScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A cell with four chromosomes. Each is copied, the copies move apart, and the cell divides into two cells with four chromosomes each.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return this.stepIndex === 4 ? (st.portrait ? 360 : 400) : (st.portrait ? 300 : 380); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, cx = W / 2, cy = H * 0.56, h = P ? 54 : 74;
    let s = microField(W, H, { tone: 'blue', seed: 6 });
    const t = (a, b) => label(W / 2, 32, a, { size: P ? 19 : 24, display: true }) + (b ? label(W / 2, 56, b, { size: P ? 14 : 17 }) : '');
    if (step < 2) {
      const rx = W * 0.3, ry = H * 0.36;
      s += `<g class="${step === 0 ? 'sv-pop' : ''}">${cellBody(cx, cy, Math.max(rx, ry), ry, { nr: ry * 0.8 })}</g>`;
      const gap = h * (step === 0 ? 0.62 : 0.9);
      COLS.forEach((c, i) => {
        const x = cx + (i - 1.5) * gap, r = (i % 2 ? 1 : -1) * 8;
        s += step === 0 ? rod(x, cy, h, c, { rot: r }) : `<g class="sv-pop" style="--d:${i * 0.08}s">${doubled(x, cy, h, c, { rot: r })}</g>`;
      });
      s += step === 0 ? t('Four chromosomes', 'Drawn few, so that you can count') : t('Each one is copied');
    } else if (step === 2) {
      s += cellBody(cx, cy, W * 0.44, H * 0.3, { pinch: 0.55, nucleus: false });
      const q = W * 0.28, gap = h * 0.4;
      COLS.forEach((c, i) => { s += `<g class="sv-pop" style="--d:${i * 0.05}s">${rod(cx - q, cy + (i - 1.5) * gap, h * 0.9, c, { rot: 90 })}${rod(cx + q, cy + (i - 1.5) * gap, h * 0.9, c, { rot: 90 })}</g>`; });
      s += t('The copies move apart');
    } else {
      const last = step === 4, r = last ? (P ? 52 : 72) : Math.min(W * 0.22, H * 0.3), xs = [W * 0.27, W * 0.73], yc = last ? (P ? 118 : 140) : cy, gap = r * 0.42, rh = last ? r * 0.72 : h * 0.72;
      xs.forEach((x) => {
        s += `<g class="sv-pop">${cellBody(x, yc, r, r, { nr: r * 0.76 })}</g>`;
        COLS.forEach((c, i) => { s += rod(x + (i - 1.5) * gap, yc, rh, c, { rot: i % 2 ? 8 : -8 }); });
      });
      if (step === 3) s += t('Two daughter cells', 'Four chromosomes in each, as in the parent');
      else {
        s += t('Offspring are clones');
        if (!P) s += `<path d="M${xs[0] + r + 12} ${yc}H${xs[1] - r - 12}" ${stroke(pc('ink'), 2.5, 'stroke-dasharray:6 7')}/>` + label(W / 2, yc - 10, 'the same four', { size: 15 });
        // The four cases the division stands behind, each drawn, on a strip of pale glass.
        const top = yc + r + (P ? 12 : 16), ch = H - top - 14, cw = (W - 44) / 4;
        ['Yeast', 'Hydra', 'Mould', 'New plants'].forEach((name, i) => {
          const x = 14 + i * (cw + 5.3), mx = x + cw / 2, foot = top + ch - 26, u = (ch - 30) / 100;
          s += `<rect x="${x}" y="${top}" width="${cw}" height="${ch}" rx="10" style="fill:${i === 1 ? HYDRA_FIELD : 'var(--sim-elev-peak)'};fill-opacity:${i === 1 ? 1 : 0.62};stroke:var(--sim-stroke);stroke-width:1.6"/>` + label(mx, top + ch - 8, name, { size: P ? 14 : 16 });
          if (i === 0) s += yeastCell(mx - 6, foot - 44 * u, Math.min(34 * u, cw * 0.3), { bud: 0.5 });
          if (i === 1) s += hydraThumb(mx - 3, foot - 2, Math.min(ch - 34, cw * 0.9));
          if (i === 2) { const D = pc('barkDark'), B = pc('compost'); s += `<path d="M${mx - 30} ${foot}Q${mx} ${foot - 12 * u} ${mx + 30} ${foot}" ${stroke(B, 3)}/>`; for (const [dx, tall] of [[-18, 52], [2, 72], [20, 44]]) { s += `<path d="M${mx + dx} ${foot - 4}V${foot - tall * u}" ${stroke(B, 2.6)}/><circle cx="${mx + dx}" cy="${foot - tall * u - 6}" r="${7.5}" style="fill:${D};stroke:${pc('ink')};stroke-width:1"/><circle cx="${mx + dx - 2.4}" cy="${foot - tall * u - 8.4}" r="1.8" style="fill:var(--sim-elev-peak);opacity:0.6"/>`; } }
          if (i === 3) s += svgStem(mx, foot - 10, 0.74 * u, { len: 90, nodes: 2, w: 8, leaves: [[0.7, 1, 36], [0.92, -1, 36]] }) + svgRoots(mx, foot - 12, 0.4 * u, { len: 20, n: 5, seed: 3 });
        });
      }
    }
    return { svg: frame(st, 'mt', s) };
  }
}
