// ClassificationTestsScene - blk-l02-s03, 3 beats, three tests, each as two organisms side by side.
// Beat 0: one cell against many. Beat 1: no membrane round the genetic material against a nucleus. Beat 2: makes food
// against takes food. Stacked plates in portrait. Each plate is labelled once. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { svgSun } from '../shared/SeaArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const TESTS = [
  { title: 'Level of organisation', a: ['Unicellular', 'Euglena: one cell'], b: ['Multicellular', 'A leaf: many cells'] },
  { title: 'Cell type', a: ['Prokaryote', 'Bacterium: no membrane round it'], b: ['Eukaryote', 'Amoeba: true nucleus'] },
  { title: 'Mode of nutrition', a: ['Autotrophic', 'Euglena: makes food'], b: ['Heterotrophic', 'Amoeba: takes in food'] },
];

export class ClassificationTestsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 424; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 544;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Three tests shown as pairs. Unicellular Euglena beside a many-celled leaf. A prokaryote bacterium with loose genetic material beside a eukaryote Amoeba with a true nucleus. Autotrophic Euglena in sunlight beside heterotrophic Amoeba taking in food.';

  stageHeight(st) { return st.portrait ? 520 : 400; }
  _tissue(x, y, w, h) {
    // A patch of leaf cells: a wall round each, a nucleus in each.
    const cols = 5, rows = 4, cw = w / cols, ch = h / rows; let s = `<defs><clipPath id="ct-t"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26"/></clipPath></defs><g clip-path="url(#ct-t)">`;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols + 1; c++) {
      const cx = x + c * cw - (r % 2) * cw / 2, cy = y + r * ch;
      s += `<rect x="${cx + 2}" y="${cy + 2}" width="${cw - 4}" height="${ch - 4}" rx="8" style="fill:${bc({ a: 'elevLow', b: 'elevPeak', t: 0.5 })};stroke:${bc('leafDark')};stroke-width:3"/><circle cx="${cx + cw / 2}" cy="${cy + ch / 2}" r="5" style="fill:${bc('nucleus')}"/>`;
      for (const q of [[-14, -8], [12, 10], [14, -10]]) s += `<circle cx="${cx + cw / 2 + q[0] * cw / 60}" cy="${cy + ch / 2 + q[1] * ch / 44}" r="2.6" style="fill:${bc('chl')}"/>`;
    }
    return s + '</g>';
  }
  _art(side, x, y, w, h) {
    const k = this.stepIndex;
    if (k === 0) {
      if (side === 'a') return fitBio('Euglena', x, y, w, h, { max: 1.4 });
      const iw = Math.min(w, h * 1.4); return this._tissue(x + (w - iw) / 2, y + 2, iw, h - 4);
    }
    if (k === 1) {
      if (side === 'a') {
        const cy = y + h / 2, cx = x + w * 0.42;
        return fitBio('Bacterium', x, y, w, h, { max: 1.3 }) + `<circle cx="${cx}" cy="${cy + 1}" r="26" style="fill:none;stroke:var(--sim-gold);stroke-width:3.5;stroke-dasharray:6 5"/>`;
      }
      const s = Math.min(w / 124, h / 105, 1.5), cx = x + w / 2 + 2, cy = y + h / 2;
      return fitBio('Amoeba', x, y, w, h, { max: 1.5 }) + `<circle cx="${cx - 8 * s}" cy="${cy + 8 * s}" r="${20 * s}" style="fill:none;stroke:var(--sim-gold);stroke-width:4"/>`;
    }
    if (side === 'a') return svgSun(x + 32, y + 30, 0.42, {}) + fitBio('Euglena', x + 18, y + 26, w - 18, h - 26, { max: 1.3 });
    const s = Math.min(w / 124, h / 105, 1.5), cx = x + w / 2, cy = y + h / 2;
    return fitBio('Amoeba', x, y, w, h, { max: 1.5 }) + `<circle cx="${cx + 56 * s}" cy="${cy - 46 * s}" r="9" style="fill:${bc('food')};stroke:${bc('capDark')};stroke-width:2"/><circle cx="${cx + 76 * s}" cy="${cy - 26 * s}" r="6" style="fill:${bc('food')}"/>`;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, T = TESTS[this.stepIndex], g = 10, top = 44;
    let s = words(W / 2, 28, T.title, { size: 21, display: true });
    const pw = P ? W - 8 : (W - 8 - g) / 2, ph = P ? (H - top - g - 6) / 2 : H - top - 8;
    const plate = (side, x, y, col) => {
      const t = T[side];
      return PLATE(x, y, pw, ph, { fill: col }) + words(x + pw / 2, y + 28, t[0], { size: 19, display: true, ink: bc('ink') }) + this._art(side, x + 14, y + 38, pw - 28, ph - 72) + words(x + pw / 2, y + ph - 12, t[1], { size: P ? 14 : 15, ink: bc('ink') });
    };
    s += plate('a', 4, top, bc({ a: 'seaShallow', b: 'elevPeak', t: 0.76 })) + plate('b', P ? 4 : 4 + pw + g, P ? top + ph + g : top, bc({ a: 'gold', b: 'elevPeak', t: 0.76 }));
    return { svg: s };
  }
}
