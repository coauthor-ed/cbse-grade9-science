// HabitatRulePredictionScene - L08 blk-l08-s02, 1 beat, setup of the predict. A shore: a tiger on land, a dolphin and a
// fish in the sea, and the one rule on a board. It shows nothing inside the animals and gives no answer.
import { BioStage, beats, panel, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { dolphinBig, fishBig, tigerBig, mx } from './VertArt.js';

export class HabitatRulePredictionScene extends BioStage {
  static BEAT_STEP_MAP = beats(1);
  static ARIA_LABEL = 'A shore with a tiger on the land and a dolphin and a fish in the sea. A board gives the rule: it lives in water, so it is a fish.';
  heights = [[400, 390]];
  draw(st) {
    const { W, H, portrait: P } = st, sea = P ? 216 : 172, sh = P ? 190 : W * 0.34, land = sea - 62;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>`;
    g += `<rect y="${sea}" width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.3))}/><rect y="${sea + (H - sea) * 0.48}" width="${W}" height="${H}" ${fill(lc('sea'))}/>`;
    g += `<rect y="${sea - 2}" width="${W}" height="6" ${fill(lc('white'), 'opacity:0.7')}/>`;
    g += `<path d="M0 ${land}H${sh * 0.74}Q${sh} ${land + 8} ${sh + 16} ${sea + 8}Q${sh + 10} ${sea + 40} ${sh * 0.62} ${sea + 54}Q${sh * 0.3} ${sea + 62} 0 ${sea + 84}Z" ${fill(lc('sand'), `stroke:${lc('sandDark')};stroke-width:4`)}/>`;
    g += `<path d="M0 ${land}H${sh * 0.74}Q${sh * 0.86} ${land + 4} ${sh * 0.96} ${land + 18}" style="fill:none;stroke:${lc('grass')};stroke-width:9;stroke-linecap:round"/>`;
    g += tigerBig(P ? 88 : W * 0.15 + 6, land + 2, P ? 0.44 : 0.48);
    g += dolphinBig(P ? W * 0.56 : W * 0.68, P ? 322 : 268, P ? 0.72 : 0.92);
    g += fishBig(P ? 62 : W * 0.2, P ? 362 : 340, P ? 0.28 : 0.3);
    const bw = P ? 310 : 330, bh = 54, bx = P ? (W - bw) / 2 : W - bw - 16;
    g += panel(bx, 12, bw, bh, lc('white'));
    g += words(bx + bw / 2, 46, 'It lives in water, so it is a fish', { size: 18, display: true, ink: INK });
    return g;
  }
}
