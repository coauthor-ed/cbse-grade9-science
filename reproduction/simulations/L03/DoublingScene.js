// DoublingScene - blk-l03-s02 setup and blk-l03-s03. Setup: two parents' cells, 46 each, and an empty child, with no hint of
// the sum. Beat 0: 46 + 46 = 92, then 92 + 92 = 184. Beat 1: three pairs stand for 23: one chromosome of a pair from each
// parent. Beat 2: one from each pair goes to a gamete: 23 + 23 = 46. Three pairs are always drawn, and the figure says so.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgPlantColour as pc, label, frame } from '../shared/PlantArt.js';
import { cellBody, rod, pairTone } from '../shared/CellArt.js';

import { microField } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const SETUP = 3;

export class DoublingScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static BEAT_MAPS = { 1: [one(SETUP)] };
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Two parent cells of 46 chromosomes. If each passed on all 46 the child would have 92 and the grandchild 184. Humans have 23 pairs, three drawn. A gamete takes one from each pair, so two gametes give 46.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : 400; }

  num(x, y, r, n, o = {}) {
    return cellBody(x, y, r, r, { nr: r * 0.72 }) + label(x, y + r * 0.18, String(n), { size: o.size ?? r * 0.56, display: true });
  }
  plus(x, y, t = '+') { return label(x, y + 10, t, { size: 30, display: true }); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.hostRole === 'setup' ? SETUP : this.stepIndex;
    let s = microField(W, H, { tone: 'green', seed: 3 });
    if (step === SETUP) {
      const r = P ? 54 : 74, y = H * 0.36;
      s += this.num(W * 0.27, y, r, 46) + this.num(W * 0.73, y, r, 46);
      s += label(W * 0.27, y + r + 26, 'Parent', { size: 18, display: true }) + label(W * 0.73, y + r + 26, 'Parent', { size: 18, display: true });
      s += `<circle cx="${W / 2}" cy="${H * 0.8}" r="${r * 0.56}" style="fill:none;stroke:${pc('ink')};stroke-width:3;stroke-dasharray:8 7"/>` + label(W / 2, H * 0.8 + 10, '?', { size: 30, display: true }) + label(W * 0.74, H * 0.8 + 6, 'Child', { size: 18, display: true });
    } else if (step === 0) {
      const r = P ? 36 : 50, r2 = P ? 44 : 62, r3 = P ? 52 : 76, y1 = H * 0.2, y2 = H * 0.5, y3 = H * 0.8;
      s += this.num(W * 0.2, y1, r, 46) + this.plus(W * 0.36, y1) + this.num(W * 0.52, y1, r, 46) + label(W * 0.8, y1 + 6, 'Parents', { size: 17, display: true });
      s += `<g class="sv-pop">${this.num(W * 0.3, y2, r2, 92)}${this.plus(W * 0.5, y2)}${label(W * 0.8, y2 + 6, 'Child', { size: 17, display: true })}</g>`;
      s += `<g class="sv-pop" style="--d:.3s">${this.num(W * 0.42, y3, r3, 184, { size: r3 * 0.46 })}${label(W * 0.8, y3 + 6, 'Grandchild', { size: 17, display: true })}</g>`;
    } else {
      const r = P ? 92 : 130, cy = H * 0.52, h = P ? 56 : 76, gap = h * (P ? 0.72 : 0.88);
      if (step === 1) {
        s += cellBody(W / 2, cy, r * 1.34, r, { nr: r * 0.82 });
        [0, 1, 2].forEach((i) => { const x = W / 2 + (i - 1) * gap * 1.5; s += `<g class="sv-pop" style="--d:${i * 0.12}s">${rod(x - h * 0.2, cy, h, pairTone(i, 0), { rot: -4 })}${rod(x + h * 0.2, cy, h, pairTone(i, 1), { rot: 4 })}</g>`; });
        s += label(W / 2, 32, '23 pairs, 46 in all', { size: P ? 20 : 24, display: true }) + label(W / 2, 56, P ? 'Three pairs drawn' : 'Three pairs drawn. Dark from one parent, light from the other', { size: P ? 14 : 16 }) + (P ? label(W / 2, H - 12, 'Dark from one parent, light from the other', { size: 14 }) : '');
      } else {
        const rr = P ? 56 : 80, y = H * 0.36, g1 = W * 0.26, g2 = W * 0.74, mix = [[0, 1, 0], [1, 0, 1]];
        [g1, g2].forEach((x, k) => {
          s += cellBody(x, y, rr, rr, { nr: rr * 0.76 });
          [0, 1, 2].forEach((i) => { s += rod(x + (i - 1) * rr * 0.44, y, h * 0.72, pairTone(i, mix[k][i]), { rot: i === 1 ? 0 : (i ? 8 : -8) }); });
          s += label(x, y + rr + 24, 'Gamete: 23', { size: P ? 15 : 18, display: true });
        });
        s += this.plus(W / 2, y);
        const yc = H * 0.82, rc = P ? 34 : 46;
        s += `<g class="sv-pop" style="--d:.2s">${cellBody(W / 2, yc, rc * 2.5, rc, { nucleus: false })}${label(W / 2, yc + 8, '23 + 23 = 46', { size: P ? 17 : 21, display: true })}</g>`;
      }
    }
    return { svg: frame(st, 'db', s) };
  }
}
