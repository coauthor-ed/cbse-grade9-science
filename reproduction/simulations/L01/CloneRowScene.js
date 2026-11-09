// CloneRowScene - blk-l01-s01 and the blk-l01-s02 setup. A tray in cut-away: bare cuttings, then leaves, then roots from
// each stem's own buried end. No flowers here: the colour is the next predict. Setup: the red parent bush and one potted
// cutting, no flower on it.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgStem, svgRoots, svgPot, svgRosePlant, svgPlantColour as pc, label, frame } from '../shared/PlantArt.js';

import { sky, hedge, slats, bench, contact } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const SETUP = 3;

export class CloneRowScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static BEAT_MAPS = { 1: [one(SETUP)] };
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A tray of soil cut away to show rose cuttings: bare stems, then stems with new leaves, then roots growing from the buried end of each stem.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 330 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.hostRole === 'setup' ? SETUP : this.stepIndex;
    const gy = Math.round(H * (step === SETUP ? 0.8 : 0.56));
    let s = '';
    if (step === SETUP) {
      s += sky(W, gy + 8, { sun: [W * 0.84, 30], warm: 0.2 }) + hedge(W, gy * 0.34, gy * 0.7, { seed: 3 }) + svgSoil(0, gy, 1, { w: W, h: H - gy, seed: 4 }) + contact(W * 0.3, gy + 6, 110);
      s += svgRosePlant(W * 0.3, gy + 6, P ? 1.26 : 1.72, { blooms: 3, tint: 'red', seed: 5 });
      const px = W * 0.75, py = gy - 46;
      s += svgStem(px, py + 2, 1.5, { len: 66, nodes: 3, w: 6, leaves: [[0.8, 1, 32], [0.92, -1, 30]] });
      s += svgPot(px, py, P ? 1.1 : 1.3);
      s += label(W * 0.3, 30, 'Parent bush', { size: 17, display: true }) + label(px, 30, 'A cutting in a pot', { size: 17, display: true });
      return { svg: frame(st, 'cr', s) };
    }
    s += slats(W, H) + bench(W, H - 34, H);
    const x0 = W * 0.04, tw = W * 0.92, depth = H - gy - 26;
    s += contact(W / 2, H - 22, W * 0.46, 10, 0.5) + `<rect x="${x0 - 8}" y="${gy - 10}" width="${tw + 16}" height="${depth + 24}" rx="10" style="fill:url(#pa-wood);stroke:${pc('woodDark')};stroke-width:4"/>`;
    s += svgSoil(x0, gy, 1, { w: tw, h: depth, compost: true, seed: 6 });
    const n = P ? 3 : 5, k = P ? 1.1 : 1.3;
    for (let i = 0; i < n; i++) {
      const x = x0 + tw * (i + 0.5) / n, foot = gy + depth * 0.62;
      const top = [[0.86, 1, 30], [0.96, -1, 28]], more = [[0.62, -1, 30], [0.74, 1, 32], [0.97, 1, 26]];
      s += `<g class="${step === 1 ? 'sv-pop' : ''}" style="--d:${i * 0.08}s">${svgStem(x, foot, k, { len: 150, nodes: 4, w: 8, leaves: step >= 1 ? [...top, ...more] : top, buds: step === 0 })}</g>`;
      if (step === 2) s += `<g class="sv-grow" style="--d:${0.1 + i * 0.08}s;transform-origin:top">${svgRoots(x, foot - 6, k, { len: 38, seed: i + 3, grow: 1 })}</g>`;
    }
    const tag = ['No roots, no seed', 'New leaves open', 'Roots from the stem'][step];
    s += label(W / 2, 34, tag, { size: P ? 20 : 24, display: true });
    return { svg: frame(st, 'cr', s) };
  }
}
