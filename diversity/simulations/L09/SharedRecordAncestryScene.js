// SharedRecordAncestryScene - L09 blk-l09-s08, 2 beats. Beat 0: two made-up reports with different local names joined by
// one scientific name. Beat 1: the tree with the tiger's path lit.
import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words, frame } from '../shared/SeaBits.js';
import { fitBig, mx } from '../L08/VertArt.js';
import { it } from './NameBits.js';

const INK = lc('ink');
const REPORTS = [['Report 1', 'bagh', 'Forest path, morning'], ['Report 2', 'puli', 'River bank, evening']];
export class SharedRecordAncestryScene extends LifeTreeCloseScene {
  static STAGE = 9;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two made-up reports, one saying bagh and one saying puli, joined by the scientific name Panthera tigris. Then the tree of life with the path to the mammals lit.';
  stageHeight(st) { return (this.stepIndex ?? 0) === 1 ? super.stageHeight(st) : (st.portrait ? 420 : 380); }
  paint(st) {
    if ((this.stepIndex ?? 0) === 1) return super.paint(st);
    const { W, H, portrait: P } = st, cw = (W - 34) / 2, ch = P ? 136 : 138;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    const nameY = 14 + ch + (P ? 54 : 44);
    REPORTS.forEach(([t, n, d], i) => {
      const x = 12 + i * (cw + 10), y = 14, cx = x + cw / 2;
      g += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14" ${fill(lc('white'), `stroke:${INK};stroke-width:3`)}/>`;
      g += words(cx, y + 26, t, { size: 14, ink: INK }) + words(cx, y + 66, n, { size: 28, display: true, ink: INK });
      const a = d.split(', ');
      g += words(cx, y + 96, `${a[0]},`, { size: 14, ink: INK }) + words(cx, y + 116, a[1], { size: 14, ink: INK });
      g += `<path d="M${cx} ${y + ch}L${W / 2 + (i ? 20 : -20)} ${nameY - 28}" ${stroke(INK, 4, 'stroke-linecap:round')}/>`;
    });
    g += `<rect x="${W / 2 - 134}" y="${nameY - 30}" width="268" height="52" rx="14" ${fill(mx(lc('yellow'), lc('white'), 0.5), `stroke:${INK};stroke-width:3.5`)}/>` + it(W / 2, nameY + 4, 'Panthera tigris', { size: 25 });
    g += fitBig('Tiger', W / 2 - 110, nameY + 30, 220, H - nameY - 62);
    g += words(W - 16, H - 12, 'Made-up reports', { size: 14, ink: INK, anchor: 'end' });
    return { svg: frame(st, 'sr', g) };
  }
}
