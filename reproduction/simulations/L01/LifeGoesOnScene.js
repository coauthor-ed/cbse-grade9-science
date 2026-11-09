// LifeGoesOnScene - blk-l01-s00, new. Beat 0: a mango's life: seed, young plant, grown tree with fruit, old tree, its
// seeds growing on. Beat 1: one parent and copies, two parents and a mix. Beat 2: a cutting and a seed side by side.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgLemonTree, svgStem, svgPot, svgRosePlant, svgPlantColour as pc, label, frame, fill, stroke, pathEllipse } from '../shared/PlantArt.js';

import { sky, hills, orchard, hedge, grass, slats, bench, contact } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const seed = (x, y, r = 8) => `<path d="${pathEllipse(x, y, r * 1.3, r)}" ${fill(pc('bark'), `stroke:${pc('barkDark')};stroke-width:2`)}/>`;

export class LifeGoesOnScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A mango seed grows into a tree with fruit, the tree grows old, and its seeds grow on. Then one parent with copies beside two parents with mixed young. Then a cutting and a seed in two pots.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = Math.round(H * 0.78);
    let s = step === 2 ? slats(W, gy + 10) + bench(W, gy, H) : sky(W, gy + 10, { warm: 0.7, sun: [W * 0.86, gy * 0.3] }) + hills(W, gy * 0.8) + (step === 0 ? orchard(W, gy - 6) : hedge(W, gy * 0.56, gy * 0.5, { seed: 2 })) + svgSoil(0, gy, 1, { w: W, h: H - gy, seed: 3 }) + grass(W, gy + 4, 18);
    if (step === 0) {
      const k = P ? 0.8 : 1.16, ys = gy + 2;
      s += seed(W * 0.09, ys + 12, 9);
      s += svgStem(W * 0.2, ys, 1, { len: 64, nodes: 2, w: 5, thorns: false, leaves: [[0.8, 1, 30], [0.95, -1, 28]] });
      s += `<g class="sv-pop">${svgLemonTree(W * 0.5, ys, k * 1.3, { mango: true })}</g>`;
      s += svgLemonTree(W * 0.84, ys, k * 1.02, { fruit: false, seed: 9, n: 22, sparse: true });
      s += seed(W * 0.95, ys + 12, 9);
      const lab = P ? 14 : 16;
      [['Seed', 0.09], ['Grows', 0.25], [P ? 'Reproduces' : 'Matures, reproduces', 0.52], ['Grows old', 0.82]].forEach(([t, u]) => { s += label(W * u, H - 14, t, { size: lab }); });
      s += label(W / 2, 30, 'Its seeds go on', { size: P ? 20 : 24, display: true });
    } else if (step === 1) {
      const k = P ? 0.72 : 1, ys = gy + 2, mid = W * 0.5;
      s += `<path d="M${mid} 0V${H}" ${stroke(pc('pale'), 5)}/>`;
      s += svgRosePlant(W * 0.13, ys, k * 1.2, { blooms: 2, tint: 'red' });
      [0.3, 0.39, 0.47].forEach((u, i) => { s += `<g class="sv-pop" style="--d:${i * 0.1}s">${svgRosePlant(W * u, ys, k * 0.6, { blooms: 1, tint: 'red' })}</g>`; });
      s += svgRosePlant(W * 0.58, ys, k, { blooms: 2, tint: 'red' }) + svgRosePlant(W * 0.71, ys, k, { blooms: 2, tint: 'yellow' });
      [['red', 0.8], ['yellow', 0.87], ['pink', 0.94]].forEach(([t, u], i) => { s += `<g class="sv-pop" style="--d:${0.3 + i * 0.1}s">${svgRosePlant(W * u, ys, k * 0.58, { blooms: 1, tint: t })}</g>`; });
      s += label(W * 0.25, 30, 'One parent', { size: P ? 18 : 22, display: true }) + label(W * 0.75, 30, 'Two parents', { size: P ? 18 : 22, display: true });
      s += label(W * 0.25, 54, 'Almost exact copies', { size: P ? 14 : 16 }) + label(W * 0.75, 54, 'A mix, small differences', { size: P ? 14 : 16 });
    } else {
      const k = P ? 1 : 1.3, py = gy - 50;
      s += contact(W * 0.28, gy + 2, 90) + svgStem(W * 0.28, py, 1.3, { len: 80, nodes: 3, w: 7, leaves: [[0.8, 1, 34], [0.94, -1, 34]] }) + svgPot(W * 0.28, py, k);
      s += contact(W * 0.72, gy + 2, 90) + svgStem(W * 0.72, py, 1, { len: 44, nodes: 1, w: 5, thorns: false, leaves: [[0.9, 1, 30], [0.96, -1, 30]], buds: false }) + svgPot(W * 0.72, py, k);
      s += label(W * 0.28, 34, 'From a cutting', { size: P ? 17 : 22, display: true }) + label(W * 0.72, 34, 'From a seed', { size: P ? 17 : 22, display: true });
      s += label(W / 2, 66, 'When would a farmer choose each?', { size: P ? 15 : 17 });
    }
    return { svg: frame(st, 'lg', s) };
  }
}
