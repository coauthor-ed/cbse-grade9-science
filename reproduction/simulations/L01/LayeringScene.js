// LayeringScene - blk-l01-s05b, new. Soil in cut-away. A lemon's low twig bends down, its middle under the soil, tip up.
// Beat 1: Days slider: roots from the buried part, 10-15 days. Beat 2: Cut the twig: it stands alone on its own roots.
// Control names: Days, Cut the twig.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgLemonTree, svgRoots, svgStem, svgKnife, svgPlantColour as pc, label, frame, stroke, ctlBar } from '../shared/PlantArt.js';

import { gardenWall, hedge, grass } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];

export class LayeringScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Layering. A low twig of a lemon plant bends down with its middle buried in the soil. Roots grow from the buried part after 10 to 15 days. The twig is cut from the parent and grows as a new plant.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [
      { kind: 'range', id: 'days', label: 'Days', min: 0, max: 15, step: 1, value: 12, read: (v) => `Day ${v}`, say: (v) => `day ${v}` },
      { kind: 'btn', id: 'cut', label: 'Cut the twig', go: true },
    ], (id, v) => {
      if (id === 'days') { this._d = v; this.repaint(); }
      if (id === 'cut') { this._cut = true; this.ctl.disable('cut', true); this.repaint(); }
    });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 310 : 372; }
  enter(step) {
    this._d = 12; this._cut = false;
    if (!this.ctl) return;
    this.ctl.show('days', step === 1); this.ctl.show('cut', step === 2);
    this.ctl.disable('cut', false); this.ctl.set('days', 12);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = Math.round(H * 0.6), k = P ? 0.82 : 1;
    const day = step === 0 ? 0 : step === 2 ? 15 : this._d, grow = Math.max(0, Math.min(1, (day - 5) / 9));
    const tx = W * 0.2, sx = W * 0.42, bx = W * 0.6, ex = W * 0.82;
    let s = gardenWall(W, 0, gy + 10) + hedge(W, gy * 0.82, gy * 0.26, { seed: 9 }) + svgSoil(0, gy, 1, { w: W, h: H - gy, compost: true, seed: 12 }) + grass(W, gy + 3, 12, { gap: 6 });
    s += svgLemonTree(tx, gy + 2, k * 1.2, {});
    const near = `M${tx + 8} ${gy - 40}Q${sx - 20} ${gy - 62} ${sx} ${gy + 4}`, far = `M${sx} ${gy + 4}Q${bx - 34} ${gy + 56} ${bx} ${gy + 54}Q${ex - 52} ${gy + 54} ${ex} ${gy - 66}`;
    const cut = step === 2 && this._cut;
    if (!cut) s += `<path d="${near}" ${stroke(pc('barkDark'), 11)}/><path d="${near}" ${stroke(pc('stem'), 7)}/>`;
    else s += `<path d="M${tx + 8} ${gy - 40}Q${tx + 40} ${gy - 54} ${sx - 30} ${gy - 44}" ${stroke(pc('barkDark'), 11)}/><path d="M${tx + 8} ${gy - 40}Q${tx + 40} ${gy - 54} ${sx - 30} ${gy - 44}" ${stroke(pc('stem'), 7)}/>`;
    s += `<path d="${far}" ${stroke(pc('barkDark'), 11)}/><path d="${far}" ${stroke(pc('stem'), 7)}/>`;
    s += svgStem(ex, gy - 62, k, { len: 62, nodes: 2, w: 6, rot: 14, leaves: [[0.36, 1, 34], [0.62, -1, 36], [0.84, 1, 34], [0.97, -1, 30]] });
    if (grow > 0) for (const [u, q, sd] of [[-52, 0.8, 3], [-20, 1, 7], [14, 0.9, 11]]) s += svgRoots(bx + u, gy + 56, k * q, { len: 66, grow, seed: sd, n: 5 });
    const t = step === 0 ? 'Middle of the twig buried' : step === 1 ? (grow > 0 && day >= 10 ? 'Roots from the buried part' : 'Waiting for roots') : (cut ? 'A new plant on its own roots' : 'Roots have developed');
    s += label(W * 0.55, 32, t, { size: P ? 18 : 22, display: true });
    if (step === 0) s += label(W * 0.32, gy + 34, 'Still joined', { size: 16 });
    if (step === 2 && !cut) s += svgKnife(sx + 50, gy - 74, 0.9, { flip: true, rot: 8 }) + label(sx - 16, gy - 84, 'Cut here', { size: 16 });
    return { svg: frame(st, 'lay', s) };
  }
}
