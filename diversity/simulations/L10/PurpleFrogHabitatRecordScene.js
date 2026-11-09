// PurpleFrogHabitatRecordScene - L10 blk-l10-s08, 2 beats. Beat 0: the frog out of the soil in monsoon rain, in the hills
// of the Western Ghats. Beat 1: the whole tree, with viruses outside it.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc, svgFern } from '../shared/LifeArt.js';
import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';
import { purpleFrog, mx, INK } from './EarthArt.js';

export class PurpleFrogHabitatRecordScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static WIDTH = 560; static HEIGHT = 480; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 560;
  static ARIA_LABEL = 'A purple frog on wet soil in monsoon rain, with forested hills behind. Then the tree of life with its five kingdoms, and viruses shown outside it.';
  moreCss() { return LIFE_TREE_CSS; }
  // At 1280 the tree shows the five kingdoms only, so its foot stays in view; the phone keeps every group.
  _tree(st) { return lifeTree(10, { W: st.W, portrait: st.portrait, ...(st.portrait ? {} : { bare: true, fillH: 400 }) }); }
  stageHeight(st) { return this.stepIndex === 1 ? this._tree(st).h : (st.portrait ? 330 : 400); }
  draw(st, step) {
    if (step === 1) return this._tree(st).svg;
    const { W, H, portrait: P } = st, gy = H - (P ? 96 : 110);
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('water'), lc('white'), 0.42))}/>`;
    g += `<path d="M-4 ${gy - 90}C${W * 0.18} ${gy - 180} ${W * 0.3} ${gy - 170} ${W * 0.46} ${gy - 110}S${W * 0.8} ${gy - 200} ${W + 4} ${gy - 120}V${gy}H-4Z" ${fill(mx(lc('leafDeep'), lc('water'), 0.4))}/>`;
    g += `<path d="M-4 ${gy - 40}C${W * 0.2} ${gy - 100} ${W * 0.5} ${gy - 60} ${W * 0.66} ${gy - 86}S${W * 0.9} ${gy - 70} ${W + 4} ${gy - 60}V${gy}H-4Z" ${fill(lc('leafDeep'))}/>`;
    g += `<path d="M-4 ${gy}C${W * 0.3} ${gy - 16} ${W * 0.7} ${gy + 12} ${W + 4} ${gy - 6}V${H + 4}H-4Z" ${fill(lc('soil'), `stroke:${mx(lc('soil'), INK, 0.5)};stroke-width:4`)}/>`;
    g += svgFern(W * 0.08, gy + 4, P ? 1.1 : 1.5) + svgFern(W * 0.92, gy + 6, P ? 1.2 : 1.6);
    for (let i = 0; i < 26; i++) { const x = 8 + (i * 67) % W, y = 8 + (i * 43) % (gy - 16); g += `<path d="M${x} ${y}l-6 16" ${stroke(lc('waterDeep'), 3, 'stroke-linecap:round;opacity:0.5')}/>`; }
    for (const [u, v, r] of [[0.2, 0.5, 34], [0.8, 0.66, 44], [0.56, 0.84, 26]]) g += `<ellipse cx="${W * u}" cy="${gy + (H - gy) * v}" rx="${r}" ry="${r * 0.2}" ${fill(lc('water'))}/>`;
    g += `<g class="bs-pop">${purpleFrog(W / 2 - (P ? 6 : 8), gy + (P ? 44 : 52), P ? 0.92 : 1.3)}</g>`;
    g += pill(P ? 90 : 110, 32, 'Western Ghats', { size: 16 });
    return g;
  }
}
