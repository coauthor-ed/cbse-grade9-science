// TinaiScene - blk-l01-s08, 3 beats. Beat 0: five Sangam Tinai landscapes, each drawn with its living things. Beat 1: a
// sacred grove standing in cleared land; no deity, no shrine detail. Beat 2: the module's tree, root only. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP, svgBamboo, svgBroadLeaf, svgRainTree, svgPalm, svgGrassTuft, svgThornBush, svgUnderTree } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const LANDS = [
  { name: 'Kurinji', what: 'hills', sky: { a: 'skyDay', b: 'elevPeak', t: 0.4 }, gr: { a: 'elevHigh', b: 'elevLow', t: 0.5 } },
  { name: 'Mullai', what: 'forest', sky: { a: 'skyDay', b: 'elevPeak', t: 0.3 }, gr: 'leaf' },
  { name: 'Marutham', what: 'farmland', sky: { a: 'skyDay', b: 'elevPeak', t: 0.5 }, gr: { a: 'elevLow', b: 'gold', t: 0.3 } },
  { name: 'Neythal', what: 'coast', sky: { a: 'skyDay', b: 'seaShallow', t: 0.3 }, gr: 'seaShallow' },
  { name: 'Palai', what: 'dry land', sky: { a: 'gold', b: 'elevPeak', t: 0.6 }, gr: { a: 'strata1', b: 'strata2', t: 0.3 } },
];

export class TinaiScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 460; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 530;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Five landscapes of Sangam Tinai: Kurinji hills, Mullai forest, Marutham farmland, Neythal coast and Palai dry land, each with its plants and animals. Then a sacred grove of tall trees standing among cleared land. Last, a young tree with the root named Living things.';

  css() { return LIFE_TREE_CSS; }
  stageHeight(st) {
    if (this.stepIndex === 2) return lifeTree(1, { W: st.W, portrait: st.portrait }).h;
    return st.portrait ? 500 : 420;
  }
  _strip(i, x, y, w, h, P) {
    const L = LANDS[i], f = y + h * (P ? 0.72 : 0.78), id = `tn-${i}`;
    let s = `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/></clipPath></defs><g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:${bc(L.sky)}"/>`;
    if (i === 0) s += `<path d="M${x - 10} ${f}L${x + w * 0.3} ${y + h * 0.22}L${x + w * 0.56} ${f}L${x + w * 0.72} ${y + h * 0.36}L${x + w + 12} ${f}Z" style="fill:${bc({ a: 'strata5', b: 'skyDay', t: 0.5 })}"/>`;
    s += `<rect x="${x}" y="${f}" width="${w}" height="${y + h - f}" style="fill:${bc(L.gr)}"/>`;
    const k = P ? Math.min(0.6, h / 170) : 1;
    if (i === 0) s += svgBamboo(x + w * 0.76, f + 4, 0.56 * k, { seed: 2 }) + fitBio('Monkey', x + w * 0.1, f - 44 * k * 1.2, 40 * k, 56 * k);
    if (i === 1) s += svgRainTree(x + w * 0.3, f + 4, 0.56 * k, { seed: 3 }) + svgUnderTree(x + w * 0.7, f + 4, 0.7 * k, { seed: 5 }) + fitBio('Deer', x + w * 0.4, f - 62 * k, 60 * k, 66 * k);
    if (i === 2) { for (let j = 0; j < 6; j++) s += svgGrassTuft(x + 12 + j * (w - 24) / 5, f + 10 + (j % 2) * 8, 0.6 * k + 0.2, { seed: j }); s += svgBroadLeaf(x + w * 0.76, f + 2, 0.5 * k, { seed: 2 }); }
    if (i === 3) { s += svgPalm(x + w * 0.74, f + 2, 0.72 * k, {}); s += `<rect x="${x}" y="${f - 3}" width="${w * 0.5}" height="6" rx="3" style="fill:${bc({ a: 'elevPeak', b: 'seaShallow', t: 0.2 })}"/>`; s += fitBio('Fish', x + w * 0.1, f + (y + h - f) * 0.2, w * 0.3, (y + h - f) * 0.56); }
    if (i === 4) s += svgThornBush(x + w * 0.3, f + 4, 0.8 * k, { seed: 2 }) + svgThornBush(x + w * 0.76, f + 8, 0.6 * k, { seed: 5 }) + fitBio('Lizard', x + w * 0.46, f + 4, w * 0.3, 22);
    s += '</g>' + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" style="fill:none;stroke:${bc('ink')};stroke-width:2"/>`;
    return s;
  }
  _lands(st) {
    let s = '';
    if (st.portrait) {
      const g = 8, h = (st.H - 4 * g) / 5, w = st.W - 8;
      LANDS.forEach((L, i) => {
        const y = i * (h + g);
        s += this._strip(i, 4, y, w, h, true);
        s += `<rect x="12" y="${y + 8}" width="${Math.max(L.name.length, L.what.length) * 9 + 20}" height="46" rx="10" style="fill:${bc('white')};opacity:.92"/>`;
        s += words(22, y + 27, L.name, { size: 16, display: true, anchor: 'start', ink: bc('ink') }) + words(22, y + 46, L.what, { size: 14, anchor: 'start', ink: bc('ink') });
      });
    } else {
      const g = 8, w = (st.W - 4 * g - 8) / 5, h = st.H - 80;
      LANDS.forEach((L, i) => {
        const x = 4 + i * (w + g);
        s += this._strip(i, x, 8, w, h, false);
        s += words(x + w / 2, h + 36, L.name, { size: 18, display: true }) + words(x + w / 2, h + 58, L.what, { size: 15 });
      });
    }
    return s;
  }
  _grove(st) {
    const W = st.W, H = st.H, f = H * 0.72, P = st.portrait;
    let s = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'skyDay', b: 'elevPeak', t: 0.4 })}"/><rect y="${f}" width="${W}" height="${H - f}" rx="14" style="fill:${bc({ a: 'strata1', b: 'elevLow', t: 0.3 })}"/>`;
    for (const u of [0.05, 0.13, 0.86, 0.95]) { const x = W * u; s += `<path d="M${x - 7} ${f + 22}L${x - 5} ${f + 6}L${x + 5} ${f + 6}L${x + 7} ${f + 22}Z" style="fill:${bc('bark')}"/>`; }
    const q = P ? 1.42 : 1.08;
    s += svgRainTree(W * 0.34, f + 14, q, { seed: 3 }) + svgRainTree(W * 0.62, f + 16, q * 1.1, { seed: 7 }) + svgBroadLeaf(W * 0.5, f + 26, q * 1.1, { seed: 4 }) + svgUnderTree(W * 0.24, f + 26, q, { seed: 6 }) + svgUnderTree(W * 0.72, f + 28, q, { seed: 9 });
    s += fitBio('FernPlant', W * 0.36, f + 2, W * 0.14, 44) + fitBio('Mushroom', W * 0.56, f + 22, 34, 36) + fitBio('Hornbill', W * 0.42, f - 128 * q, 84, 52);
    s += `<rect x="${W / 2 - 86}" y="${H - 44}" width="172" height="32" rx="12" style="fill:${bc('white')};stroke:${bc('ink')};stroke-width:2"/>` + words(W / 2, H - 22, 'A sacred grove', { size: 16, ink: bc('ink') });
    return s;
  }
  paint(st) {
    const k = this.stepIndex;
    return { svg: k === 0 ? this._lands(st) : k === 1 ? this._grove(st) : lifeTree(1, { W: st.W, portrait: st.portrait }).svg };
  }
}
