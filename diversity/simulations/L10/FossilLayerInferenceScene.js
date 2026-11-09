// FossilLayerInferenceScene - q-l10-s04, 1 beat, setup of the question. Two made-up layers: A below B, each with a fossil.
// Nothing here says what the order can or cannot show.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { rockBands, fossilLeaf, fossilFrond, mx } from './EarthArt.js';

export class FossilLayerInferenceScene extends BioStage {
  static BEAT_STEP_MAP = beats(1);
  static ARIA_LABEL = 'A made-up stack of rock. The upper layer B holds a divided frond fossil. The lower layer A holds a broad leaf fossil.';
  heights = [[300, 330]];
  draw(st) {
    const { W, H, portrait: P } = st, R = rockBands(W, 18, H - 18, 2, { roles: ['strata1', 'strata3'], pale: 0.12 });
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('water'), lc('white'), 0.56))}/>` + R.svg;
    const [a0, a1] = R.band(0), [b0, b1] = R.band(1), cx = W * (P ? 0.68 : 0.62);
    g += `<g transform="translate(${cx} ${(a0 + a1) / 2}) rotate(78)">${fossilFrond(0, 0, P ? 0.56 : 0.66)}</g>`;
    g += `<g transform="translate(${cx} ${(b0 + b1) / 2}) rotate(80)">${fossilLeaf(0, 0, P ? 0.62 : 0.72)}</g>`;
    g += pill(P ? 72 : 100, (a0 + a1) / 2, 'Layer B', { size: 17 }) + pill(P ? 72 : 100, (b0 + b1) / 2, 'Layer A', { size: 17 });
    return g;
  }
}
