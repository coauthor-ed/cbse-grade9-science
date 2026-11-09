// PlantToSpongeHandoffScene - blk-l05-s08, close. Beat 0: the tree with all five plant classes lit. Beat 1: Spirogyra in its pond beside a tree on land, each suited to its own place. Beat 2: Animalia lit, next.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';

export class PlantToSpongeHandoffScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static PORTRAIT_HEIGHT = 640;
  static ARIA_LABEL = 'The tree with the five plant classes lit. Spirogyra in a pond beside a gulmohar on land, each suited to its own place. Then Animalia lit on the tree.';
  moreCss() { return LIFE_TREE_CSS; }
  _t(st, step) { return lifeTree(5, { W: st.W, portrait: st.portrait, ...(step === 2 ? { lit: ['Animalia'] } : {}) }); }
  stageHeight(st) { return this.stepIndex === 1 ? (st.portrait ? 260 : 330) : this._t(st, this.stepIndex).h; }
  draw(st, step) {
    if (step !== 1) return `<rect width="${st.W}" height="${st.H}" ${fill(lc('skyDay'))}/>` + this._t(st, step).svg;
    const W = st.W, H = st.H, P = st.portrait, cw = W * 0.46, gy = H * 0.78;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect width="${cw}" height="${H}" ${fill(lc('water'))}/><rect x="${cw}" y="${gy}" width="${W - cw}" height="${H - gy}" ${fill(lc('leaf'))}/>`;
    s += svgBio('Spirogyra', cw / 2, H * 0.5, (cw * 0.84) / 236, { cells: 3 }) + svgBio('Gulmohar', cw + (W - cw) / 2, gy + 6, ((W - cw) * 0.86) / 208);
    return s + pill(cw / 2, 28, 'Suits a pond', { size: P ? 15 : 17 }) + pill(cw + (W - cw) / 2, 28, 'Suits land', { size: P ? 15 : 17 });
  }
}
