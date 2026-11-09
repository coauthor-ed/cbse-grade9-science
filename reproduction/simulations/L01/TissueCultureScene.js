// TissueCultureScene - blk-l01-s06. Beat 0: a banana plant, one shoot tip into a bottle of gel. Beat 1: bottles with the
// tip multiplied into plantlets. Beat 2: rows of healthy banana plants in a field.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgBanana, svgBottle, svgPlantColour as pc, label, leader, frame, stroke } from '../shared/PlantArt.js';

import { sky, hills, orchard, field, tiles, bench, contact } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];

export class TissueCultureScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A banana plant and a shoot tip placed on gel in a bottle. The tip multiplies into many tiny plantlets. Rows of healthy banana plants grow in a field.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 330 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = Math.round(H * 0.82), k = P ? 0.82 : 1.08;
    let s = step === 1 ? tiles(W, gy + 8, { cool: true }) + bench(W, gy, H, { planks: 2 }) : step === 0 ? sky(W, gy + 8, { sun: [W * 0.84, 26] }) + orchard(W, gy) + svgSoil(0, gy, 1, { w: W, h: H - gy, seed: 5 }) : sky(W, H * 0.42, { warm: 0.4, sun: [W * 0.2, 20] }) + hills(W, H * 0.4) + field(W, H, H * 0.4);
    if (step === 0) {
      const bx = W * 0.3, tipY = gy - 140 * k;
      s += svgBanana(bx, gy + 4, k * 1.36, { bunch: false });
      s += `<circle cx="${bx}" cy="${tipY - 34}" r="26" ${stroke(pc('ink'), 4)}/>`;
      s += leader(bx + 26, tipY - 30, W * 0.62, gy - 110) + `<g class="sv-pop">${svgBottle(W * 0.76, gy + 2, P ? 1.2 : 1.7, { tip: true })}</g>`;
      s += label(W * 0.74, 32, 'One shoot tip', { size: P ? 18 : 22, display: true });
    } else if (step === 1) {
      const q = P ? 1 : 1.6;
      [[0.18, 0, true], [0.5, 5, false], [0.82, 12, false]].forEach(([u, n, tip], i) => { s += `<g class="sv-pop" style="--d:${i * 0.18}s">${contact(W * u, gy + 4, 54 * q * 0.8)}${svgBottle(W * u, gy + 2, q, { lets: n, tip })}</g>`; });
      s += label(W / 2, 34, 'Many plantlets from one tip', { size: P ? 18 : 23, display: true });
    } else {
      const row = (y, n, q, off) => { let r = ''; for (let i = 0; i < n; i++) { const x = W * (i + 0.5 + off) / n; r += contact(x, y + 2, 34 * q) + svgBanana(x, y, q, { bunch: q > 0.5 }); } return r; };
      s += row(H * 0.5, P ? 7 : 11, 0.24, 0) + row(H * 0.6, P ? 5 : 7, 0.4, 0.3) + row(H * 0.74, P ? 4 : 5, 0.62, 0.1) + row(H * 0.98, P ? 2 : 3, 1.02, 0.22);
      s += label(W / 2, 32, 'Healthy plantlets, high yields', { size: P ? 18 : 23, display: true });
    }
    return { svg: frame(st, 'tc', s) };
  }
}
