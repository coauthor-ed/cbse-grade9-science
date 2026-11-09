// SeedEnclosurePredictScene - blk-l05-s02 setup. A pine seed on its scale beside a mango cut open. The seeds are drawn closed: nothing inside a seed is shown, so the predict stays open.
import { BioStage, beats, pill, panel } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBioColour as lc } from '../shared/BioArt.js';
import { coneScale, mango } from '../L04/PlantBits.js';

export class SeedEnclosurePredictScene extends BioStage {
  static BEAT_STEP_MAP = beats(1);
  static ARIA_LABEL = 'A pine seed lying on a cone scale, with no fruit around it, beside a mango cut open with its seed inside.';
  heights = [[230, 300]];
  draw(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = H - 2 * g, xs = [g, 2 * g + pw], c = xs.map((x) => x + pw / 2), m = g + ph * 0.42, k = P ? 0.72 : 1.0;
    return `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph)
      + coneScale(c[0], m, k) + mango(c[1], m, k, true) + pill(c[0], H - 30, 'Pine seed', { size: P ? 15 : 17 }) + pill(c[1], H - 30, 'Mango seed', { size: P ? 15 : 17 });
  }
}
