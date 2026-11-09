// CloneRowScene-verdict - blk-l01-s03. Beat 0: the same red on parent and new plant. Beat 1: chips show the book's five
// examples, one big at a time, each with the part that grows. Beat 2: one parent, a row of identical young.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, svgSoil, svgRosePlant, svgPot, svgPotato, svgGinger, svgMoneyLeaf, svgSugarcane, svgBryophyllum, svgRoots, label, frame } from '../shared/PlantArt.js';

import { sky, hills, hedge, grass, gardenWall } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const CHIPS = [['potato', 'Potato'], ['ginger', 'Ginger'], ['money', 'Money plant'], ['cane', 'Sugarcane'], ['bryo', 'Bryophyllum']].map(([id, lab]) => ({ id, label: lab, targets: [id] }));
const PART = { potato: 'Fleshy underground stem', ginger: 'Fleshy underground stem', money: 'Stem cutting', cane: 'Stem cutting', bryo: 'Plantlets on a leaf' };

export class CloneRowVerdictScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A parent rose and the new plant from its cutting, both deep red. Then potato, ginger, money plant, sugarcane and Bryophyllum, each with the part that grows. Then one parent and a row of identical young plants.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Plants that grow from their own parts', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 300 : (this.stepIndex === 1 ? 340 : 400); }
  enter(step) { this.tl.set({ chips: step === 1 ? CHIPS : [], lit: step === 1 ? 'potato' : null }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = Math.round(H * (step === 1 ? 0.44 : 0.8));
    let s = (step === 1 ? sky(W, gy + 10, { warm: 0.1 }) + hedge(W, gy * 0.5, gy * 0.6, { seed: 6 }) : step === 0 ? gardenWall(W, 0, gy + 10) + hedge(W, gy * 0.72, gy * 0.32, { seed: 8 }) : sky(W, gy + 10, { sun: [W * 0.8, 24] }) + hills(W, gy * 0.72)) + svgSoil(0, gy, 1, { w: W, h: H - gy, seed: 8, compost: step === 1 }) + (step === 1 ? grass(W, gy + 3, 16) : '');
    if (step === 0) {
      s += svgRosePlant(W * 0.3, gy + 4, P ? 1 : 1.42, { blooms: 3, tint: 'red' });
      const px = W * 0.74, py = gy - 46;
      s += `<g class="sv-pop">${svgRosePlant(px, py, P ? 0.72 : 0.92, { blooms: 2, tint: 'red' })}</g>` + svgPot(px, py, P ? 1 : 1.2);
      s += label(W * 0.3, 30, 'Parent', { size: P ? 18 : 22, display: true }) + label(px, 30, 'From a cutting', { size: P ? 18 : 22, display: true });
    } else if (step === 1) {
      const id = this.tl.lit()[0] ?? 'potato', k = P ? 1.4 : 2, cx = W * 0.5;
      if (id === 'potato') s += `<g class="sv-pop">${svgPotato(cx, gy + (H - gy) * 0.56, k, { sprout: 1 })}</g>`;
      if (id === 'ginger') s += `<g class="sv-pop">${svgGinger(cx, gy + (H - gy) * 0.6, k, { sprout: 1 })}</g>`;
      if (id === 'money') s += `<g class="sv-pop">${svgMoneyLeaf(cx - 90 * k, gy + 50, k, { len: 180, n: 4, rootlet: true })}</g>`;
      if (id === 'cane') s += `<g class="sv-pop">${svgSugarcane(cx - 60 * k, gy + 18, k * 0.9, { len: 130, rot: 90, sprout: 1, seg: 3 })}${svgRoots(cx - 20 * k, gy + 34, k * 0.6, { len: 30, grow: 1, seed: 5 })}</g>`;
      if (id === 'bryo') s += `<g class="sv-pop">${svgBryophyllum(cx - 80 * k, gy + 36, k * 0.86, { grow: 1, rot: 74 })}</g>`;
      s += label(W / 2, 32, PART[id], { size: P ? 19 : 23, display: true });
    } else {
      const n = P ? 3 : 4, ys = gy + 4;
      s += svgRosePlant(W * 0.17, ys, P ? 0.96 : 1.3, { blooms: 3, tint: 'red' });
      for (let i = 0; i < n; i++) { const x = W * (0.42 + i * 0.52 / (n - 0.6)); s += `<g class="sv-pop" style="--d:${i * 0.1}s">${svgRosePlant(x, ys, P ? 0.66 : 0.86, { blooms: 2, tint: 'red' })}</g>`; }
      s += label(W * 0.17, 30, 'One parent', { size: P ? 17 : 21, display: true }) + label(W * 0.66, 30, 'Genetically identical', { size: P ? 17 : 21, display: true });
    }
    return { svg: frame(st, 'cv', s) };
  }
}
