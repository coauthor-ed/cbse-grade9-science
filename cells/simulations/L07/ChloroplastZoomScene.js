// ChloroplastZoomScene - blk-l05-s06b. Beat 0: a leaf and a leaf cell with its chloroplasts lit. Beats 1-3: one chloroplast
// cut open. Beat 1 lights the two membranes, beat 2 stroma and discs with sunlight falling on the discs, beat 3 starch and
// sugars. Name chips under the picture light a part on beats 1-3.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, label, leader, svgLeaf, stroke } from '../shared/PlantArt.js';
import { cwFrame, depthField, plantCell, T, mx, n1 } from '../shared/CellWorld.js';
import { chloroHero } from './OrganelleHero.js';

const one = (idx) => [{ idx, dwellMs: null }];
const CHIPS = [
  { id: 'outer', label: 'Outer', say: 'Outer membrane', name: 'Outer membrane', targets: ['outer'] },
  { id: 'inner', label: 'Inner', say: 'Inner membrane', name: 'Inner membrane', targets: ['inner'] },
  { id: 'stroma', label: 'Stroma', targets: ['stroma'] },
  { id: 'discs', label: 'Discs', targets: ['discs'] },
  { id: 'starch', label: 'Starch', targets: ['starch'] },
];
const BEAT_LIT = { 1: ['outer', 'inner'], 2: ['stroma', 'discs'], 3: ['starch', 'stroma'] };

export class ChloroplastZoomScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 458;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A leaf and a leaf cell with green chloroplasts. Then one chloroplast cut open: two membranes, a pale stroma, stacks of green discs that catch sunlight, and starch granules. Name chips under the picture light each part.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Parts of a chloroplast', chips: CHIPS, onChange: () => this.repaint() });

  async setup() {
    await super.setup();
    this.tl.mount(this.root, this);
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : 372; }
  enter(step) { this.tl.set({ chips: step === 0 ? [] : CHIPS, lit: null }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = depthField(W, H, { tone: 'green', seed: 21 });
    if (step === 0) {
      const lx = P ? 58 : W * 0.15, ly = P ? 250 : H * 0.8, cw = P ? 214 : 330, ch = P ? 226 : 300, cx = P ? W * 0.62 : W * 0.63, cy = H * 0.54;
      s += svgLeaf(lx, ly, P ? 1.5 : 2.3, { len: 120, wide: 56, rot: 8 });
      const px = lx + (P ? 6 : 12), py = ly - (P ? 96 : 150);
      s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${P ? 13 : 18}" ${stroke(T('strata-6'), 3.4)}/>`;
      s += leader(px + (P ? 11 : 16), py - (P ? 8 : 12), cx - cw * 0.5, cy - ch * 0.44) + leader(px + (P ? 10 : 15), py + (P ? 9 : 12), cx - cw * 0.5, cy + ch * 0.44);
      s += plantCell(cx, cy, cw, ch, { part: (n) => (n === 'chloro' || n === 'wall' || n === 'membrane' || n === 'cytoplasm' ? 1 : 0.4), seed: 5 });
      s += label(cx, P ? 22 : 30, 'A leaf cell and its chloroplasts', { size: P ? 15 : 21, display: true });
      return { svg: cwFrame(st, 'cz', s) };
    }
    const cx = W * 0.5, cy = H * (P ? 0.53 : 0.54), rx = P ? 146 : 268, ry = P ? 104 : 150;
    const on = this.tl.any() ? this.tl.lit() : BEAT_LIT[step];
    const dim = (n) => (on.includes(n) ? 1 : (n === 'dna' || n === 'ribo' ? 0.3 : (n === 'stroma' ? 0.62 : 0.34)));
    s += chloroHero(cx, cy, rx, ry, { dim, rot: -6 });
    if (step === 2 && !this.tl.any()) {
      for (let i = 0; i < 4; i++) {
        const x0 = W * (0.14 + i * 0.2), x1 = cx + rx * (-0.5 + i * 0.32), y1 = cy - ry * (0.22 + (i % 2) * 0.14);
        s += `<path d="M${n1(x0)} 0L${n1(x1)} ${n1(y1)}" ${stroke(T('gold'), P ? 5 : 7, 'opacity:.75')}/><path d="M${n1(x0)} 0L${n1(x1)} ${n1(y1)}" ${stroke(T('elev-peak'), 2, 'opacity:.8')}/>`;
      }
    }
    if (step === 3 && !this.tl.any()) {
      const hex = (x, y) => `<path d="M${n1(x + 8)} ${n1(y)}l-4 7h-8l-4 -7l4 -7h8Z" style="fill:${T('series-2')};stroke:${mx('series-2', 'strata-6', 60)};stroke-width:1.6"/>`;
      for (const [a, b] of [[-0.46, -0.14], [-0.12, 0.2], [0.2, -0.22], [0.44, 0.2], [-0.04, -0.3], [0.5, -0.32]]) s += hex(cx + a * rx, cy + b * ry);
    }
    const name = (this.tl.any() ? (() => { const c = CHIPS.find((q) => q.targets[0] === on[0]); return c?.name ?? c?.label; })() : ['', 'Two membranes', 'Discs catch the light', 'Sugars and starch stored'][step]) ?? '';
    s += label(W / 2, H - (P ? 12 : 16), name, { size: P ? 17 : 21, display: true });
    return { svg: cwFrame(st, 'cz', s) };
  }
}
