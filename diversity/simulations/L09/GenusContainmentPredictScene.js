// GenusContainmentPredictScene - L09 blk-l09-s02, 1 beat, setup of the predict. The genus ring holds the tiger and the
// lion; the report's two families are drawn with dashes, one under each animal. Nothing says which reading holds.
import { BioStage, beats, pill, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { fitBig, mx } from '../L08/VertArt.js';

export class GenusContainmentPredictScene extends BioStage {
  static BEAT_STEP_MAP = beats(1);
  static ARIA_LABEL = 'A ring called genus Panthera holds a tiger and a lion. A report draws a dashed family around each animal, marked family one and family two, each with a question mark.';
  heights = [[330, 340]];
  draw(st) {
    const { W, H, portrait: P } = st, cw = (W - 34) / 2, y = 54, h = H - y - 14, dash = 'stroke-dasharray:12 9';
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    g += words(W / 2, 34, 'What the report says', { size: 18, display: true, ink: INK });
    [0, 1].forEach((i) => {
      const x = 12 + i * (cw + 10);
      g += `<rect x="${x}" y="${y}" width="${cw}" height="${h}" rx="22" ${fill(i ? mx(lc('skyDay'), lc('white'), 0.3) : mx(lc('sand'), lc('white'), 0.1), `stroke:${INK};stroke-width:3;${dash}`)}/>`;
      g += words(x + cw / 2, y + h - 16, `Family ${i + 1}?`, { size: 17, display: true, ink: INK });
    });
    const ry = y + 26, rh = h - 76;
    g += `<rect x="${P ? 24 : 44}" y="${ry}" width="${W - (P ? 48 : 88)}" height="${rh}" rx="${rh / 2.4}" ${fill(lc('yellow'), `stroke:${INK};stroke-width:4;fill-opacity:0.3`)}/>`;
    const aw = cw - (P ? 28 : 56), ah = Math.min(aw * 0.54, rh - 44), ay = ry + 22 + (rh - 30 - ah) / 2;
    g += fitBig('Tiger', 34 + (P ? 0 : 20), ay, aw, ah) + fitBig('Lion', W / 2 + (P ? 6 : 18), ay, aw, ah);
    g += pill(W / 2, ry + 2, 'Genus Panthera', { size: 15 });
    return g;
  }
}
