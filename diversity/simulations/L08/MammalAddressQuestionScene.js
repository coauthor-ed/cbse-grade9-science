// MammalAddressQuestionScene - L08 blk-l08-s08, 2 beats. Beat 0: the tree with the five vertebrate groups lit. Beat 1: a
// tiger and a dolphin in one Mammalia panel, with smaller groups inside it still unnamed.
import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words, frame } from '../shared/SeaBits.js';
import { dolphinBig, tigerBig, camelBig, bearBig, mx } from './VertArt.js';

const INK = lc('ink');
export class MammalAddressQuestionScene extends LifeTreeCloseScene {
  static STAGE = 8;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'The tree of life with fishes, amphibians, reptiles, birds and mammals lit under Animalia. Then a tiger, a dolphin, a camel and a polar bear inside one group called Mammalia, with smaller unnamed groups around them.';
  treeOptions() { return { stage: 8, lit: ['Fishes', 'Amphibians', 'Reptiles', 'Birds', 'Mammals'] }; }
  stageHeight(st) { return (this.stepIndex ?? 0) === 0 ? super.stageHeight(st) : (st.portrait ? 390 : 400); }
  paint(st) {
    if ((this.stepIndex ?? 0) === 0) return super.paint(st);
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    g += `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="26" ${fill(mx(lc('yellow'), lc('white'), 0.72), `stroke:${INK};stroke-width:4`)}/>`;
    g += words(W / 2, 46, 'Mammalia', { size: 22, display: true, ink: INK });
    const dash = 'stroke-dasharray:12 9';
    const box = (x, y, w, h, t) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" ${fill(t, `stroke:${INK};stroke-width:3;${dash}`)}/>`
      + words(x + 22, y + 28, '?', { size: 22, display: true, ink: INK });
    const gap = P ? 8 : 12, cw = (W - 50 - gap) / 2, ch = (H - (P ? 84 : 90) - gap) / 2, x0 = 25, y0 = 60, x1 = x0 + cw + gap, y1 = y0 + ch + gap;
    const sand = mx(lc('sand'), lc('white'), 0.3), sea = mx(lc('sea'), lc('white'), 0.2), sky = lc('skyDay');
    g += box(x0, y0, cw, ch, sand) + box(x1, y0, cw, ch, sea) + box(x0, y1, cw, ch, sand) + box(x1, y1, cw, ch, sky);
    const k = P ? 0.84 : 1.3;
    g += tigerBig(x0 + cw / 2 + 2, y0 + ch - 14, k * 0.42) + dolphinBig(x1 + cw / 2, y0 + ch / 2 + 6, P ? 0.38 : 0.7);
    g += camelBig(x0 + cw / 2 - 16, y1 + ch - 10, P ? 0.3 : 0.36) + bearBig(x1 + cw / 2 - 6, y1 + ch - 14, P ? 0.36 : 0.5);
    return { svg: frame(st, 'ma', g) };
  }
}
