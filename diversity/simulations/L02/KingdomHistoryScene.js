// KingdomHistoryScene - blk-l02-s07, 3 beats. Beat 0: Aristotle's three habitats, one drawn animal each. Beat 1: a rail of four
// book dates, each row showing the kingdoms that system had, the new one lit. Beat 2: Rigveda and Brihat Samhita, as named groups.
// Labels only: no portrait of any person. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const K = { P: ['Plantae', 'FernPlant'], A: ['Animalia', 'Tiger'], T: ['Protista', 'Amoeba'], M: ['Monera', 'Bacterium'], F: ['Fungi', 'Mushroom'] };
const ROWS = [['1758', 'Linnaeus', 'PA', ''], ['1866', 'Haeckel', 'PAT', 'T'], ['1938', 'Copeland', 'PATM', 'M'], ['1969', 'Whittaker', 'PATMF', 'F']];
const LANDS = [['Land', 'Deer', { a: 'elevLow', b: 'elevPeak', t: 0.56 }], ['Water', 'Fish', { a: 'seaShallow', b: 'elevPeak', t: 0.5 }], ['Air', 'Eagle', { a: 'skyDay', b: 'elevPeak', t: 0.3 }]];

export class KingdomHistoryScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 444; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 524;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Aristotle grouped animals by land, water and air. Then a timeline: Linnaeus 1758 with two kingdoms, Haeckel 1866 adds Protista, Copeland 1938 adds Monera, Whittaker 1969 adds Fungi. Last, the Rigveda and the Brihat Samhita group animals by habitat, behaviour and ecological role.';

  stageHeight(st) { return st.portrait ? 500 : 420; }
  _trio(st, title, sub, list) {
    const P = st.portrait, W = st.W, H = st.H, top = 62, g = 8, n = list.length;
    let s = words(W / 2, 28, title, { size: 21, display: true }) + words(W / 2, 50, sub, { size: 15 });
    const w = P ? W - 8 : (W - 8 - g * (n - 1)) / n, h = P ? (H - top - g * (n - 1)) / n : H - top - 8;
    list.forEach(([t, a, col], i) => {
      const x = P ? 4 : 4 + i * (w + g), y = P ? top + i * (h + g) : top;
      s += PLATE(x, y, w, h, { fill: bc(col) });
      const tl = P && t.length > 11 ? t.split(' ') : [t];
      s += P ? tl.map((u, j) => words(x + 20, y + h / 2 + 7 + (j - (tl.length - 1) / 2) * 25, u, { size: 21, display: true, anchor: 'start', ink: bc('ink') })).join('') + fitBio(a, x + w * 0.42, y + 8, w * 0.54, h - 18) : words(x + w / 2, y + 32, t, { size: 21, display: true, ink: bc('ink') }) + fitBio(a, x + 14, y + 44, w - 28, h - 58);
    });
    return s;
  }
  _rail(st) {
    const W = st.W, H = st.H, rh = (H - 8) / 4, rx = 16;
    let s = `<path d="M${rx} 20L${rx} ${H - 22}" style="fill:none;stroke:${bc('barkDark')};stroke-width:6;stroke-linecap:round"/>`;
    ROWS.forEach(([yr, who, set, fresh], i) => {
      const y = 4 + i * rh, x = rx + 18, w = W - x - 4, h = rh - 8;
      s += `<circle cx="${rx}" cy="${y + h / 2}" r="10" style="fill:var(--sim-gold);stroke:${bc('ink')};stroke-width:3"/>`;
      s += PLATE(x, y, w, h, {}) + words(x + 12, y + 25, yr, { size: 20, display: true, anchor: 'start' }) + words(x + 66, y + 25, who, { size: 15, anchor: 'start' });
      if (fresh) s += words(x + w - 10, y + 25, `adds ${K[fresh][0]}`, { size: 15, anchor: 'end' });
      const iw = (w - 16) / 5, iy = y + 33, ih = h - 40;
      [...set].forEach((c, j) => {
        const on = c === fresh, cx = x + 8 + j * iw;
        s += `<rect x="${cx + 2}" y="${iy}" width="${iw - 4}" height="${ih}" rx="9" style="fill:${on ? 'var(--sim-gold)' : bc('white')};stroke:${bc('whiteShade')};stroke-width:1.5"/>` + fitBio(K[c][1], cx + 6, iy + 3, iw - 12, ih - 6);
      });
    });
    return s;
  }
  paint(st) {
    const k = this.stepIndex;
    if (k === 0) return { svg: this._trio(st, 'Aristotle', '4th century BCE: three habitats', LANDS) };
    if (k === 1) return { svg: this._rail(st) };
    return { svg: this._trio(st, 'Rigveda and Brihat Samhita', 'Three more ways to group', [['Habitat', 'Fish', { a: 'seaShallow', b: 'elevPeak', t: 0.5 }], ['Behaviour', 'Owl', { a: 'strata5', b: 'elevPeak', t: 0.66 }], ['Ecological role', 'Tiger', { a: 'gold', b: 'elevPeak', t: 0.6 }]]) };
  }
}
