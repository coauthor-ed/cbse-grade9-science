// MeiosisStageScene - blk-l03-s04. Three pairs stand for 23, drawn dark from one parent and light from the other. Beat 0:
// copied, pairs side by side. Beat 1: first division, each cell one member of each pair, still doubled. Beat 2: second
// division, four cells, one chromosome of each pair; each cell differs. Beat 3: chips light diploid or haploid.
// Which member goes where is drawn from the book's rule, one fixed case. Control names: chips.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, label, frame } from '../shared/PlantArt.js';
import { cellBody, rod, doubled, pairTone } from '../shared/CellArt.js';

import { microField } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const CHIPS = [['di', 'Diploid'], ['ha', 'Haploid']].map(([id, lab]) => ({ id, label: lab, targets: [id] }));
const A = [0, 1, 0], B = [1, 0, 1];     // which member of pairs 1, 2, 3 each side of the first division gets

export class MeiosisStageScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Meiosis with three pairs of chromosomes. Copied chromosomes line up in pairs. In the first division the pairs separate. In the second, each chromosome splits from its copy, giving four cells, each with one chromosome from every pair.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Names for the two numbers', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 300 : (this.stepIndex === 3 ? 340 : 400); }
  enter(step) { this.tl.set({ chips: step === 3 ? CHIPS : [], lit: step === 3 ? 'ha' : null }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, cy = H * 0.56;
    let s = microField(W, H, { tone: 'blue', seed: 8 });
    const t = (a, b) => label(W / 2, 32, a, { size: P ? 19 : 24, display: true }) + (b ? label(W / 2, 56, b, { size: P ? 14 : 17 }) : '');
    const h = P ? 54 : 78;
    if (step === 0) {
      const r = H * 0.38;
      s += cellBody(W / 2, cy, Math.min(W * 0.46, r * 1.5), r, { nr: r * 0.8 });
      [0, 1, 2].forEach((i) => { const x = W / 2 + (i - 1) * h * 1.2; s += `<g class="sv-pop" style="--d:${i * 0.1}s">${doubled(x - h * 0.3, cy, h, pairTone(i, 0), { w: h * 0.17 })}${doubled(x + h * 0.3, cy, h, pairTone(i, 1), { w: h * 0.17 })}</g>`; });
      s += t('Copied, then side by side in pairs', 'Three pairs stand for 23');
    } else if (step === 1) {
      const xs = [W * 0.26, W * 0.74], r = Math.min(W * 0.23, H * 0.32);
      xs.forEach((x, k) => {
        s += `<g class="sv-pop">${cellBody(x, cy, r, r, { nr: r * 0.78 })}</g>`;
        [0, 1, 2].forEach((i) => { s += doubled(x + (i - 1) * r * 0.5, cy, h * 0.8, pairTone(i, (k ? B : A)[i]), { w: h * 0.14 }); });
      });
      s += t('First division: pairs separate', 'One of each pair in each cell, still copied');
    } else {
      s += this.four(st, cy, h);
      s += t('Second division: copies split', 'Four cells, one chromosome from each pair');
    }
    if (step === 3) {
      s = microField(W, H, { tone: 'blue', seed: 8 });
      const dim = (id) => `opacity="${this.tl.off(id) ? 0.26 : 1}"`, r = Math.min(W * 0.2, H * 0.3), y = H * 0.46, x1 = W * 0.26, x2 = W * 0.74;
      s += `<g ${dim('di')}>${cellBody(x1, y, r * 1.1, r * 1.1, { nr: r * 0.9 })}`;
      [0, 1, 2].forEach((i) => { const x = x1 + (i - 1) * r * 0.6; s += rod(x - r * 0.12, y, h * 0.8, pairTone(i, 0), { w: h * 0.15 }) + rod(x + r * 0.12, y, h * 0.8, pairTone(i, 1), { w: h * 0.15 }); });
      s += label(x1, y + r * 1.1 + 26, 'Diploid: full set', { size: P ? 15 : 19, display: true }) + `</g>`;
      s += `<g ${dim('ha')}>${cellBody(x2, y, r * 0.86, r * 0.86, { nr: r * 0.7 })}`;
      [0, 1, 2].forEach((i) => { s += rod(x2 + (i - 1) * r * 0.44, y, h * 0.7, pairTone(i, A[i]), { w: h * 0.15 }); });
      s += label(x2, y + r * 1.1 + 26, 'Haploid: half', { size: P ? 15 : 19, display: true }) + `</g>`;
      s += label(W / 2, 32, 'Gametes are haploid', { size: P ? 19 : 24, display: true });
    }
    return { svg: frame(st, 'ms', s) };
  }

  four(st, cy, h) {
    const W = st.W, H = st.H, P = st.portrait, q = P ? Math.min(W * 0.2, H * 0.165) : Math.min(W * 0.115, H * 0.22), big = h * (P ? 0.5 : 0.56);
    let s = '';
    const sets = [A, A, B, B];
    for (let c = 0; c < 4; c++) {
      const x = P ? W * (c % 2 ? 0.7 : 0.3) : W / 2 + (c - 1.5) * W * 0.235, y = P ? H * 0.61 + (c > 1 ? q * 1.08 : -q * 1.08) : cy;
      s += `<g class="sv-pop" style="--d:${c * 0.08}s">${cellBody(x, y, q, q, { nr: q * 0.8 })}`;
      [0, 1, 2].forEach((i) => { s += rod(x + (i - 1) * q * 0.46, y, big, pairTone(i, sets[c][i]), { w: h * 0.13 }); });
      s += '</g>';
    }
    return s;
  }
}
