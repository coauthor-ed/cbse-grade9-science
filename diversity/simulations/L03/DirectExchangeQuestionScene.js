// DirectExchangeQuestionScene - blk-l03-s09, close. Beat 0: the tree with Monera, Protista and Fungi lit. Beat 1: a cyanobacterium in water beside a tall tree
// whose leaves are far from the water at its roots.
import { BioStage, beats, pill, flow, head } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';

import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';

export class DirectExchangeQuestionScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static PORTRAIT_HEIGHT = 640;
  static ARIA_LABEL = 'The tree of life with Monera, Protista and Fungi lit. Then a cyanobacterium touching water beside a tall tree whose leaves are far from the water at its roots.';
  moreCss() { return LIFE_TREE_CSS; }
  stageHeight(st) { return this.stepIndex === 0 ? lifeTree(3, { W: st.W, portrait: st.portrait }).h : (st.portrait ? 300 : 360); }
  draw(st, step) {
    if (step === 0) return `<rect width="${st.W}" height="${st.H}" ${fill(lc('skyDay'))}/>` + lifeTree(3, { W: st.W, portrait: st.portrait }).svg;
    const W = st.W, H = st.H, P = st.portrait, cw = W * 0.42, gy = H * 0.74;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect width="${cw}" height="${H}" ${fill(lc('water'))}/><rect x="${cw}" y="${gy}" width="${W - cw}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += svgBio('Cyanobacterium', cw / 2, H * 0.5, (cw * 0.84) / 196) + pill(cw / 2, 28, 'Water all around', { size: P ? 14 : 15 });
    const tx = cw + (W - cw) * 0.52, k = (H * 0.66) / 166;
    s += svgBio('Gulmohar', tx, gy + 6, k);
    [-0.34, 0.34].forEach((u) => { s += `<path d="M${tx} ${gy + 4}q${u * 120} 26 ${u * 160} 34" ${stroke(lc('barkDark'), 6)}/>`; });
    const ax = W - 20;
    s += flow(`M${ax} ${gy + 20}V60`, lc('waterDeep'), 5) + head(ax, 56, -90, lc('waterDeep'), 8);
    return s + pill(W - 30, 28, 'How far?', { anchor: 'end', on: true, size: P ? 14 : 15 }) + pill(cw + 8, H - 22, 'Water at the roots', { anchor: 'start', size: P ? 14 : 15 });
  }
}
