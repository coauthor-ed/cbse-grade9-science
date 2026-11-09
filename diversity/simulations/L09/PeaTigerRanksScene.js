// PeaTigerRanksScene - L09 blk-l09-s04, 2 beats. A real-size table: rank, tiger, pea, with both organisms drawn on top.
// The pea's sub-phylum row is empty, as in the book's list. Beat 1 lights the family row, parts level from name.
import { BioStage, beats, pill, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { fitBig, mx } from '../L08/VertArt.js';
import { peaPlant, it } from './NameBits.js';

const ROWS = [
  ['Kingdom', 'Animalia', 'Plantae'], ['Phylum', 'Chordata', 'Magnoliophyta'], ['Sub-phylum', 'Vertebrata', ''], ['Class', 'Mammalia', 'Magnoliopsida'],
  ['Order', 'Carnivora', 'Fabales'], ['Family', 'Felidae', 'Fabaceae'], ['Genus', 'Panthera', 'Pisum'], ['Species', 'P. tigris', 'P. sativum'],
];

export class PeaTigerRanksScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'Two addresses by level. Tiger: Animalia, Chordata, Vertebrata, Mammalia, Carnivora, Felidae, Panthera, P. tigris. Pea: Plantae, Magnoliophyta, no sub-phylum listed, Magnoliopsida, Fabales, Fabaceae, Pisum, P. sativum. Then the family row is lit: family is the level, Felidae and Fabaceae are the names.';
  heights = [[500, 430], [500, 430]];
  draw(st, step) {
    const { W, H, portrait: P } = st, c0 = P ? 100 : 170, cw = (W - 16 - c0) / 2, top = 112, rh = (H - top - 12) / 8;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    g += `<rect x="${8 + c0}" y="8" width="${cw}" height="${top - 8}" rx="14" ${fill(mx(lc('yellow'), lc('white'), 0.66))}/><rect x="${8 + c0 + cw}" y="8" width="${cw}" height="${top - 8}" rx="14" ${fill(mx(lc('leaf'), lc('white'), 0.66))}/>`;
    g += fitBig('Tiger', 14 + c0, 16, cw - 12, top - 46) + words(8 + c0 + cw / 2, top - 8, 'Tiger', { size: 17, display: true, ink: INK });
    g += peaPlant(8 + c0 + cw * 1.5 - 10, top - 26, 0.46) + words(8 + c0 + cw * 1.5, top - 8, 'Pea', { size: 17, display: true, ink: INK });
    g += words(8 + c0 / 2, top - 8, 'Level', { size: 17, display: true, ink: INK });
    ROWS.forEach(([r, a, b], i) => {
      const y = top + i * rh, on = step === 0 || i === 5, o = on ? 1 : 0.34, ital = i >= 6, bg = step === 1 && i === 5 ? mx(lc('yellow'), lc('white'), 0.5) : lc('white');
      g += `<rect x="8" y="${y + 2}" width="${W - 16}" height="${rh - 4}" rx="10" ${fill(bg, `stroke:${INK};stroke-width:${step === 1 && i === 5 ? 3 : 1.5}`)}/>`;
      const base = y + rh / 2 + 7, sz = P ? 15 : 21, cell = (t, cx) => (ital ? it(cx, base, t, { size: sz }) : words(cx, base, t, { size: t.length > 11 ? sz - 0.5 : sz, display: true, ink: INK }));
      if (step === 1 && i === 4) return;
      g += `<g style="opacity:${o}">` + words(8 + c0 / 2, base, r, { size: P ? 15 : 19, ink: INK }) + cell(a, 8 + c0 + cw / 2) + (b ? cell(b, 8 + c0 + cw * 1.5) : words(8 + c0 + cw * 1.5, base, 'not listed', { size: 14, ink: mx(INK, lc('white'), 0.3) })) + '</g>';
    });
    if (step === 1) {
      const y = top + 5 * rh;
      g += pill(8 + c0 / 2 + (P ? 0 : 0), y - 21, 'A level', { size: 15, on: true }) + pill(8 + c0 + cw, y - 21, 'Names of two groups', { size: 15, on: true });
    }
    return g;
  }
}
