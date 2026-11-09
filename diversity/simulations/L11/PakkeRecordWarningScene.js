// PakkeRecordWarningScene - L11 blk-l11-s01, 2 beats. Beat 0: a Great Hornbill at a cavity in a large old tree, and the
// four species ticked on a list. Beat 1, a made-up case: old trees are stumps now, and the four ticks have not changed.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { oldTree, stump, hornbill, mx, INK } from './ForestArt.js';

const NAMES = ['Rufous-necked', 'Oriental Pied', 'Great', 'Wreathed'];
export class PakkeRecordWarningScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'A Great Hornbill perched by a nest cavity in a large old tree, and a list with four hornbill species ticked. Then, in a made-up case, the other old trees are stumps while the list still shows four ticks.';
  heights = [[500, 430]];
  _list(x, y, w, P) {
    const rh = P ? 34 : 44, cols = P ? 2 : 1, cw = (w - 20) / cols, h = (P ? 2 : 4) * rh + 48;
    let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" ${fill(lc('white'), `stroke:${INK};stroke-width:3.5`)}/>`;
    g += words(x + w / 2, y + 28, 'Seen this year', { size: 18, display: true, ink: INK, weight: 600 });
    NAMES.forEach((n, i) => {
      const c = P ? i % 2 : 0, r = P ? i >> 1 : i, rx = x + 10 + c * cw, ry = y + 42 + r * rh;
      g += `<circle cx="${rx + 13}" cy="${ry + rh / 2}" r="11" ${fill(mx(lc('leaf'), lc('white'), 0.3), `stroke:${lc('leafDark')};stroke-width:2.5`)}/><path d="M${rx + 7} ${ry + rh / 2}l4 5l8 -9" ${stroke(lc('leafDark'), 3.4, 'stroke-linecap:round;stroke-linejoin:round')}/>`;
      g += words(rx + 30, ry + rh / 2 + 5, n, { size: P ? 14 : 16, ink: INK, anchor: 'start' });
    });
    return g;
  }
  draw(st, step) {
    const { W, H, portrait: P } = st, gy = P ? H - 130 : H - 44, lost = step === 1;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('white'), 0.3))}/>`;
    g += `<path d="M-4 ${gy - 120}C${W * 0.2} ${gy - 190} ${W * 0.5} ${gy - 170} ${W + 4} ${gy - 210}V${gy}H-4Z" ${fill(mx(lc('leafDeep'), lc('skyDay'), 0.5))}/>`;
    g += `<rect y="${gy}" width="${W}" height="${H - gy}" ${fill(mx(lc('leaf'), lc('soil'), 0.5))}/>`;
    const tx = P ? W * 0.4 : W * 0.34, s = P ? 0.82 : 0.9;
    const side = P ? [[W * 0.04, 0.5], [W * 0.92, 0.56]] : [[W * 0.02, 0.56], [W * 0.62, 0.5]];
    for (const [x, q] of side) g += lost ? stump(x + 16, gy + 8, q * 1.5) : oldTree(x, gy + 6, q);
    g += oldTree(tx, gy + 6, s, { cavity: true, fruit: true });
    // bird on a stub beside the cavity
    const bx = tx + 100 * s, by = gy - 96 * s;
    g += `<path d="M${tx + 30 * s} ${by + 16}L${tx + 150 * s} ${by + 6}" ${stroke(lc('barkDark'), 11, 'stroke-linecap:round')}/>`;
    g += hornbill(bx + 12, by + 2, s * 0.56);
    if (lost) g += pill(P ? W - 92 : W * 0.3, 30, 'A made-up case', { size: 15, on: true });
    if (P) g += this._list(10, gy + 14, W - 20, true);
    else g += this._list(W - 214, lost ? 62 : 62, 200, false);
    return g;
  }
}
