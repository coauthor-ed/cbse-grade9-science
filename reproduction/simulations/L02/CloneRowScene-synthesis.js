// CloneRowScene-synthesis - blk-l02-s07. Beat 0: four kinds of copy, one division. Beat 1: One round of copying doubles the
// cells: 1, 2, 4, 8, 16, 32: arithmetic, with no time attached. Beat 2: a crowd of identical cells, and a question.
// Control name: One round of copying.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgStem, svgRoots, svgPlantColour as pc, label, frame, fill, stroke, ctlBar } from '../shared/PlantArt.js';

import { microField, water, sky } from '../shared/Scapes.js';
import { yeastCell, hydraThumb } from '../shared/CellArt.js';
const one = (idx) => [{ idx, dwellMs: null }];
const G = pc('leaf'), GD = pc('leafDark'), MK = 'var(--sim-strata-6)';
const yeast = (x, y, r, cls = '', d = 0) => `<g class="${cls}" style="--d:${d}s">${yeastCell(x, y, r, { rot: 20 })}</g>`;
const MAX = 32;

export class CloneRowSynthesisScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A yeast cell with a bud, a hydra with a bud, a spore and a rose cutting. Then cells double round by round. Then a crowd of identical cells.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'round', label: 'One round of copying', go: true }], (id) => {
      if (id !== 'round') return;
      this._n = Math.min(MAX, this._n * 2);
      if (this._n >= MAX) this.ctl.disable('round', true);
      this.repaint();
    });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : (this.stepIndex === 1 ? 372 : 400); }
  enter(step) { this._n = 1; if (!this.ctl) return; this.ctl.show('round', step === 1); this.ctl.disable('round', false); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  grid(W, H, n, top) {
    const cols = n <= 4 ? n : Math.ceil(Math.sqrt(n * (W / (H - top)))), rows = Math.ceil(n / cols), c = Math.min((W - 40) / cols, (H - top - 20) / rows), r = Math.min(c * 0.42, 44);
    let s = '';
    for (let i = 0; i < n; i++) { const x = W / 2 + ((i % cols) - (cols - 1) / 2) * c, y = top + 10 + c / 2 + Math.floor(i / cols) * c; s += yeast(x, y, r, i >= n / 2 ? 'sv-pop' : '', (i % 8) * 0.03); }
    return s;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = microField(W, H, { tone: 'warm', seed: 11 });
    if (step === 0) {
      const g = 8, cw = (W - 3 * g) / 2, ch = (H - 66 - 2 * g) / 2, cell = (i, name, art) => { const x = g + (i % 2) * (cw + g), y = 56 + (i >> 1) * (ch + g); const bg = [microField(cw, ch, { tone: 'warm', seed: 2 }), water(cw, ch), microField(cw, ch, { tone: 'green', seed: 3 }), sky(cw, ch * 0.7, { warm: 0.3 }) + `<rect y="${ch * 0.68}" width="${cw}" height="${ch * 0.32}" style="fill:url(#pa-soil) ${pc('soil')}"/>`][i]; return `<defs><clipPath id="sy-${i}"><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14"/></clipPath></defs><g clip-path="url(#sy-${i})"><g transform="translate(${x} ${y})">${bg}</g></g><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14" ${stroke(pc('ink'), 3)}/>` + art(x + cw * 0.34, y + ch / 2) + label(x + cw * 0.74, y + ch / 2 + 6, name, { size: P ? 14 : 18, display: true }); };
      s += label(W / 2, 34, 'One division: mitosis', { size: P ? 20 : 24, display: true });
      s += cell(0, 'Yeast', (x, y) => yeastCell(x, y, ch * 0.3, { bud: 0.5 }));
      s += cell(1, 'Hydra', (x, y) => hydraThumb(x - 6, y + ch * 0.34, Math.min(ch * 0.82, cw * 0.95)));
      s += cell(2, 'Mould', (x, y) => `<path d="M${x - ch * 0.36} ${y + ch * 0.34}Q${x} ${y + ch * 0.2} ${x + ch * 0.36} ${y + ch * 0.36}" ${stroke(pc('barkDark'), 8)}/><path d="M${x - ch * 0.36} ${y + ch * 0.34}Q${x} ${y + ch * 0.2} ${x + ch * 0.36} ${y + ch * 0.36}" ${stroke(pc('compost'), 4)}/><path d="M${x} ${y + ch * 0.28}V${y - ch * 0.1}" ${stroke(pc('barkDark'), 8)}/><path d="M${x} ${y + ch * 0.28}V${y - ch * 0.1}" ${stroke(pc('compost'), 4)}/><circle cx="${x}" cy="${y - ch * 0.2}" r="${ch * 0.2}" style="fill:url(#pa-tuber) ${MK};stroke:${pc('barkDark')};stroke-width:2"/><circle cx="${x - 7}" cy="${y - ch * 0.24}" r="2.6" ${fill(MK)}/><circle cx="${x + 6}" cy="${y - ch * 0.26}" r="2.6" ${fill(MK)}/><circle cx="${x + 1}" cy="${y - ch * 0.14}" r="2.6" ${fill(MK)}/><circle cx="${x + 8}" cy="${y - ch * 0.12}" r="2.2" ${fill(MK)}/>`);
      s += cell(3, 'Cutting', (x, y) => svgStem(x, y + ch * 0.24, 0.62, { len: 110, nodes: 2, w: 9, leaves: [[0.74, 1, 44], [0.94, -1, 44]] }) + svgRoots(x, y + ch * 0.22, 0.46, { len: 26, n: 6, seed: 3 }));
    } else if (step === 1) {
      const n = this._n;
      s += label(W / 2, 40, `${n} ${n === 1 ? 'cell' : 'cells'}`, { size: P ? 28 : 36, display: true });
      s += label(W / 2, 66, n >= MAX ? 'One parent, all copies' : `Press again: ${n} becomes ${n * 2}`, { size: P ? 14 : 17 });
      s += this.grid(W, H, n, 76);
    } else {
      s += label(W / 2, 36, 'All alike', { size: P ? 22 : 26, display: true }) + label(W / 2, 60, 'Where do differences come from?', { size: P ? 15 : 18 }) + this.grid(W, H, 24, 72);
    }
    return { svg: frame(st, 'sy', s) };
  }
}
