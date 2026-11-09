// FernToConeQuestionScene - blk-l04-s08, close. Beat 0: the tree with three plant classes lit. Beat 1: Spirogyra, moss and fern side by side on wet ground: all three need water to reproduce.
import { BioStage, beats, pill, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';
import { words } from '../shared/SeaBits.js';
import { film } from './PlantBits.js';

export class FernToConeQuestionScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static PORTRAIT_HEIGHT = 640;
  static ARIA_LABEL = 'The tree with Thallophyta, Bryophyta and Pteridophyta lit. Then Spirogyra, moss and fern, each still needing water to reproduce.';
  moreCss() { return LIFE_TREE_CSS; }
  stageHeight(st) { return this.stepIndex === 0 ? lifeTree(4, { W: st.W, portrait: st.portrait }).h : (st.portrait ? 250 : 320); }
  draw(st, step) {
    if (step === 0) return `<rect width="${st.W}" height="${st.H}" ${fill(lc('skyDay'))}/>` + lifeTree(4, { W: st.W, portrait: st.portrait }).svg;
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.74, u = W / 3;
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>` + film(0, gy - 12, W) + `<rect y="${gy - 5}" width="${W}" height="8" ${fill(lc('water'), 'opacity:0.82')}/>`;
    s += svgBio('Spirogyra', u * 0.5, gy - 30, P ? 0.42 : 0.62) + svgBio('MossClump', u * 1.5, gy, P ? 1.15 : 1.5) + svgBio('FernPlant', u * 2.5, gy + 2, P ? 0.72 : 1.05);
    ['Spirogyra', 'Moss', 'Fern'].forEach((t, i) => { s += words(u * (i + 0.5), H - 16, t, { size: P ? 16 : 19, display: true, ink: INK, halo: lc('white') }); });
    return s + pill(W / 2, 28, 'All need water to reproduce', { on: true, size: P ? 15 : 17 });
  }
}
