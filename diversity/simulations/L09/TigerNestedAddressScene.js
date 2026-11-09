// TigerNestedAddressScene - L09 blk-l09-s03, 4 beats. The tiger's address as eight frames, each inside the one above,
// after the book's pyramids. A frame shows its rank, its name and the animals that join at that level, so each lower
// frame truly has fewer members. Beat 0 lights Felidae and Panthera, 1 the four broad levels, 2 the four narrow ones.
// Beat 3 has a chip per rank: it lights that frame and everything inside it, with the count and what they share.
import { BioStage, beats, panel, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { fitBio } from '../shared/BioArt.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { fishBig, dolphinBig, fitBig, mx } from '../L08/VertArt.js';
import { houseCat, it } from './NameBits.js';

const LEVELS = [
  { rank: 'Kingdom', name: 'Animalia', join: ['Starfish', 'Crab', 'Butterfly'], share: 'many cells, no cell wall' },
  { rank: 'Phylum', name: 'Chordata', join: ['Amphioxus'], share: 'a notochord' },
  { rank: 'Sub-phylum', name: 'Vertebrata', join: ['fish', 'Frog', 'Hornbill'], share: 'a backbone' },
  { rank: 'Class', name: 'Mammalia', join: ['Camel', 'dolphin'], share: 'mammary glands' },
  { rank: 'Order', name: 'Carnivora', join: ['PolarBear'], share: 'teeth for eating meat' },
  { rank: 'Family', name: 'Felidae', join: ['cat'], share: 'a cat body plan' },
  { rank: 'Genus', name: 'Panthera', ital: true, join: ['Lion'], share: 'a roar, a similar skull' },
  { rank: 'Species', name: 'P. tigris', ital: true, join: ['Tiger'], share: 'can interbreed' },
];
const COUNT = LEVELS.map((_, i) => LEVELS.slice(i).reduce((a, l) => a + l.join.length, 0));
const CHIPS = LEVELS.map((l, i) => ({ id: l.rank, label: l.rank, targets: [String(i)] }));
const LIT = [[5, 6, 7], [0, 1, 2, 3], [4, 5, 6, 7]];
const SAY = ['Tiger and lion: one genus, one family', 'Sub-phylum: an extra level', 'A tiger stays in every larger group'];
const PAD = 5;

const BIGS = ['Tiger', 'Lion', 'PolarBear', 'Camel'];
function icon(n, x, y, h) {
  if (n === 'fish') return fishBig(x + h * 0.7, y + h / 2, h / 190);
  if (n === 'dolphin') return dolphinBig(x + h * 0.8, y + h / 2, h / 200);
  if (n === 'cat') return houseCat(x + h * 0.5, y + h - 1, h / 82);
  if (BIGS.includes(n)) return fitBig(n === 'PolarBear' ? 'Bear' : n, x, y, iconW(n, h), h);
  return fitBio(n, x, y, iconW(n, h), h);
}
const iconW = (n, h) => (n === 'Starfish' || n === 'Butterfly' || n === 'Frog' ? h * 1.1 : n === 'Amphioxus' ? h * 2.2 : h * 1.56);

export class TigerNestedAddressScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'Eight frames, one inside the next: kingdom Animalia, phylum Chordata, sub-phylum Vertebrata, class Mammalia, order Carnivora, family Felidae, genus Panthera and species Panthera tigris. Each frame shows the animals that join at that level, so lower frames hold fewer animals.';
  static HEIGHT = 520;
  heights = [[470, 500], [470, 500], [470, 500], [470, 335]];
  tl = tapLight({ label: 'Levels of the address', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this._row(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  // At 1280 the eight chips take two lines, in sight under the figure.
  moreCss() { return '.svs:not(.sim-dom-root--portrait) .tl-row { gap: 6px; flex-wrap: wrap; justify-content: center; } .svs:not(.sim-dom-root--portrait) .tl-chip { white-space: nowrap; }'; }
  enter() { this.tl?.reset?.(); this._row(); }
  _row() { const r = this.root?.querySelector?.('.tl-row'); if (r) { r.style.display = this.stepIndex === 3 ? '' : 'none'; this.relayout?.(); } }
  draw(st, step) {
    const { W, H, portrait: P } = st, bottom = H - (P ? 62 : 54), STRIP = P ? 44 : Math.floor((bottom - 14 - 7 * PAD) / 8);
    const pick = step === 3 && this.tl.any() ? Number(this.tl.lit()[0]) : -1;
    const lit = (i) => (step < 3 ? LIT[step].includes(i) : pick < 0 || i >= pick);
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    const tone = (i) => mx(mx(lc('sea'), lc('yellow'), i / 7), lc('white'), 0.42);
    LEVELS.forEach((l, i) => {
      const x = 6 + i * PAD, y = 6 + i * STRIP, w = W - 12 - 2 * i * PAD, h = bottom - y - i * PAD + (i ? 0 : 0), on = lit(i), o = on ? 1 : 0.34;
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${16}" ${fill(on ? tone(i) : mx(tone(i), lc('white'), 0.6), `stroke:${INK};stroke-width:${on ? 3 : 2}`)}/>`;
      const nameX = P ? x + 12 : x + 150, nameY = P ? y + 36 : y + STRIP / 2 + 8;
      g += `<g style="opacity:${o}">` + words(x + 12, P ? y + 16 : y + STRIP / 2 + 6, l.rank, { size: P ? 14 : 22, ink: INK, anchor: 'start' });
      g += (l.ital ? it(nameX, nameY, l.name, { size: P ? 17 : 24, anchor: 'start' }) : words(nameX, nameY, l.name, { size: P ? 17 : 24, display: true, ink: INK, anchor: 'start' }));
      let ax = x + w - 10;
      const ih = STRIP - 8;
      l.join.slice().reverse().forEach((n) => { const iw = iconW(n, ih); ax -= iw + 4; g += icon(n, ax, y + 4, ih); });
      g += '</g>';
    });
    let say = SAY[step] ?? 'Press a level below';
    if (pick >= 0) say = `${COUNT[pick]} of these animals: ${LEVELS[pick].share}`;
    g += panel(8, bottom + 6, W - 16, P ? 46 : 42, lc('white')) + words(W / 2, bottom + (P ? 36 : 34), say, { size: P ? (say.length > 36 ? 14.5 : 16) : 22, display: true, ink: INK });
    return g;
  }
}
