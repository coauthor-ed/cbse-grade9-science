// MushroomConflictScene - blk-l02-s01, 2 beats. Beat 0: the two-kingdom rule, a tree under Plantae, a deer under Animalia.
// Beat 1: the mushroom in the middle, one line to each sign, showing the rule gives two answers. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP, svgBroadLeaf, svgGrassTuft } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];

export class MushroomConflictScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static WIDTH = 560; static HEIGHT = 454; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 504;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A forest floor with a tree under the sign Plantae, stays and makes food, and a deer under the sign Animalia, moves and depends on others. Then a large mushroom in the middle: it stays like a plant and makes no food like an animal.';

  stageHeight(st) { return st.portrait ? 480 : 430; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, f = H - 70, k = this.stepIndex, sw = (W - 28) / 2, sy = 10, sh = 74;
    let s = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'skyDay', b: 'elevPeak', t: 0.46 })}"/><rect y="${f}" width="${W}" height="${H - f}" rx="14" style="fill:${bc('leaf')}"/>`;
    for (let i = 0; i < 7; i++) s += svgGrassTuft(20 + i * (W - 40) / 6, f + 26 + (i % 2) * 14, 0.9, { seed: i + 2 });
    const a = k === 1 ? 0.45 : 1;
    s += `<g style="opacity:${a}">${svgBroadLeaf(W * 0.24, f + 8, P ? 1.7 : 2.1, { seed: 3 })}</g><g style="opacity:${a}">${fitBio('Deer', W * 0.6, f - (P ? 190 : 200), W * 0.36, P ? 200 : 210)}</g>`;
    const sign = (x, name, l1, col) => PLATE(x, sy, sw, sh, { r: 12, fill: col, rim: bc('ink') }) + words(x + sw / 2, sy + 28, name, { size: 21, display: true, ink: bc('ink') }) + words(x + sw / 2, sy + 54, l1, { size: P ? 14 : 15, ink: bc('ink') });
    s += sign(10, 'Plantae', P ? 'Stays, makes food' : 'Stays put, makes food', bc({ a: 'elevLow', b: 'elevPeak', t: 0.56 }));
    s += sign(18 + sw, 'Animalia', P ? 'Moves, needs others' : 'Moves, needs others for food', bc({ a: 'gold', b: 'elevPeak', t: 0.56 }));
    if (k === 1) {
      const m = W / 2, top = P ? 200 : 170, c = (x, y, t) => `<path d="M${m} ${top}L${x} ${sy + sh + 4}" style="fill:none;stroke:${bc('ink')};stroke-width:3.5;stroke-dasharray:7 6"/>` + PLATE(x - 66, y - 15, 132, 30, { r: 12, fill: bc('white'), rim: bc('ink') }) + words(x, y + 6, t, { size: 15, ink: bc('ink') });
      s += c(W * 0.24, sy + sh + 46, 'Stays put') + c(W * 0.76, sy + sh + 46, 'Makes no food');
      s += fitBio('Mushroom', m - (P ? 90 : 110), top - 20, P ? 180 : 220, f - top + 34) + words(m, H - 14, 'Mushroom drawn large', { size: 14, ink: bc('ink') });
    }
    return { svg: s };
  }
}
