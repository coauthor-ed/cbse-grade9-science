// YeastExceptionScene - blk-l02-s09, 3 beats. Beat 0: yeast beside a two-question path that ends at Protista. Beat 1: the same path
// dashed, with two gaps, cell wall and food, still blank: it does not say where yeast belongs, because the next lesson asks that.
// Beat 2: the tree with five named branches. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';
import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';

const one = (idx) => [{ idx, dwellMs: null }];

export class YeastExceptionScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 480; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 544;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A yeast cell with a bud. A short key asks one cell, yes, and nucleus, yes, and ends at Protista. Then the key is shown as unsafe, with the cell wall and food of yeast still blank. Last, a drawn tree with five named kingdoms.';

  css() { return LIFE_TREE_CSS; }
  stageHeight(st) { return this.stepIndex === 2 ? lifeTree(2, { W: st.W, portrait: st.portrait, forks: false, lit: [] }).h : (st.portrait ? 500 : 400); }
  paint(st) {
    if (this.stepIndex === 2) return { svg: lifeTree(2, { W: st.W, portrait: st.portrait, forks: false, lit: [] }).svg };
    const W = st.W, H = st.H, P = st.portrait, k = this.stepIndex;
    let s = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'strata1', b: 'elevPeak', t: 0.72 })}"/>`;
    const hx = P ? 40 : 14, hy = 10, hw = P ? W - 80 : W * 0.46, hh = P ? 180 : H - 80;
    s += fitBio('Yeast', hx, hy, hw, hh) + words(hx + hw / 2, hy + hh + 26, 'Yeast', { size: 22, display: true, ink: bc('ink') });
    const bx = P ? 16 : W * 0.54, bw = P ? W - 32 : W * 0.42, y0 = P ? hy + hh + 44 : (k === 1 ? 30 : 60), gap = 8, bh = 56;
    const dash = k === 1 ? ';stroke-dasharray:7 6' : '';
    const q = (y, t, a) => PLATE(bx, y, bw, bh, { r: 12, fill: bc('white'), rim: bc('ink') }) + words(bx + 14, y + 35, t, { size: 16, anchor: 'start', ink: bc('ink') }) + words(bx + bw - 14, y + 35, a, { size: 16, anchor: 'end', ink: bc('ink') });
    s += q(y0, 'One cell?', 'Yes') + q(y0 + bh + gap, 'A nucleus?', 'Yes');
    const y3 = y0 + 2 * (bh + gap);
    s += `<rect x="${bx}" y="${y3}" width="${bw}" height="${bh}" rx="12" style="fill:${k === 1 ? bc('white') : bc({ a: 'seaShallow', b: 'elevPeak', t: 0.5 })};stroke:${bc('ink')};stroke-width:3${dash}"/>` + words(bx + bw / 2, y3 + 36, k === 1 ? 'Protista?' : 'Protista', { size: 22, display: true, ink: bc('ink') });
    if (k === 1) {
      const y4 = y3 + bh + gap, w2 = (bw - gap) / 2, gapBox = (x, t) => `<rect x="${x}" y="${y4}" width="${w2}" height="${bh}" rx="12" style="fill:none;stroke:var(--sim-gold);stroke-width:3.5;stroke-dasharray:7 6"/>` + words(x + w2 / 2, y4 + 25, t, { size: 15, ink: bc('ink') }) + words(x + w2 / 2, y4 + 46, 'not known', { size: 14, ink: bc('ink') });
      s += gapBox(bx, 'Cell wall') + gapBox(bx + w2 + gap, 'Food');
    }
    return { svg: s };
  }
}
