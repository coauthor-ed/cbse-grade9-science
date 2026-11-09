// MicrobeRepairsScene - blk-l02-s04, 3 beats. Beat 0: two kingdoms and a new third, Protista, with Amoeba and Paramecium.
// Beat 1: Amoeba and a bacterium under one lens: nucleus against none; Monera named. Beat 2: bacteria are not all germs: curd
// made with Lactobacillus beside a plain note that some cause diseases. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { fitBig } from '../L08/VertArt.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];

export class MicrobeRepairsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 444; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 524;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'First, Plantae and Animalia with a new third kingdom, Protista, holding Amoeba and Paramecium. Then a round lens with an Amoeba that has a nucleus and a bacterium that has none, which goes to Monera. Last, a bowl of curd made with the help of useful bacteria.';

  stageHeight(st) { const k = this.stepIndex; return st.portrait ? (k === 0 ? 500 : k === 1 ? st.W + 50 : 440) : 420; }
  _three(st) {
    const W = st.W, H = st.H, P = st.portrait;
    let s = '';
    const box = (x, y, w, h, name, on, art) => PLATE(x, y, w, h, { fill: on ? bc({ a: 'seaShallow', b: 'elevPeak', t: 0.66 }) : 'var(--sim-bg-surface)', rim: on ? 'var(--sim-gold)' : undefined }) + words(x + w / 2, y + 30, name, { size: 20, display: true, ink: on ? bc('ink') : undefined }) + art;
    if (P) {
      const hw = (W - 18) / 2, th = 150;
      s += box(4, 6, hw, th, 'Plantae', false, fitBio('FernPlant', 18, 44, hw - 28, th - 50));
      s += box(14 + hw, 6, hw, th, 'Animalia', false, fitBig('Tiger', 24 + hw, 48, hw - 20, th - 54));
      const y = th + 20, h = H - y - 8;
      s += box(4, y, W - 8, h, 'Protista', true, fitBio('Amoeba', 20, y + 42, W / 2 - 30, h - 80) + fitBio('Paramecium', W / 2 + 6, y + 42, W / 2 - 26, h - 80) + words(W * 0.26, y + h - 14, 'Amoeba', { size: 15, ink: bc('ink') }) + words(W * 0.74, y + h - 14, 'Paramecium', { size: 15, ink: bc('ink') }));
    } else {
      const w = 180, g = 10;
      s += box(4, 6, w, 200, 'Plantae', false, fitBio('FernPlant', 24, 48, w - 40, 146));
      s += box(4, 216, w, H - 224, 'Animalia', false, fitBig('Tiger', 22, 256, w - 36, H - 274));
      const x = 4 + w + g, ww = W - x - 4;
      s += box(x, 6, ww, H - 14, 'Protista', true, fitBio('Amoeba', x + 16, 52, ww - 32, 180) + fitBio('Paramecium', x + 56, 262, ww - 112, 96) + words(x + ww / 2, 248, 'Amoeba', { size: 15, ink: bc('ink') }) + words(x + ww / 2, H - 22, 'Paramecium', { size: 15, ink: bc('ink') }));
    }
    return s;
  }
  _lens(st) {
    const W = st.W, H = st.H, P = st.portrait, R = Math.min(W / 2 - 8, (H - 68) / 2), cx = W / 2, cy = 8 + R;
    let s = `<circle cx="${cx}" cy="${cy + 3}" r="${R}" style="fill:${bc('ink')}"/><circle cx="${cx}" cy="${cy}" r="${R}" style="fill:${bc({ a: 'elevPeak', b: 'seaShallow', t: 0.16 })};stroke:${bc('ink')};stroke-width:6"/>`;
    if (P) {
      s += fitBio('Amoeba', cx - R * 0.62, cy - R * 0.84, R * 1.24, R * 0.92) + fitBio('Bacterium', cx - R * 0.62, cy + R * 0.2, R * 1.24, R * 0.5, { max: 0.9 });
    } else {
      s += fitBio('Amoeba', cx - R * 0.82, cy - R * 0.56, R * 0.92, R * 1.1) + fitBio('Bacterium', cx + R * 0.08, cy - R * 0.3, R * 0.8, R * 0.6, { max: 0.9 });
    }
    const y = H - 52, tw = (W - 24) / 2, tag = (x, a, b) => PLATE(x, y, tw, 46, { r: 11, fill: bc('white'), rim: bc('ink') }) + words(x + tw / 2, y + 19, a, { size: 15, ink: bc('ink') }) + words(x + tw / 2, y + 38, b, { size: 14, ink: bc('ink') });
    return s + tag(8, 'Protista', 'True nucleus') + tag(16 + tw, 'Monera', 'No true nucleus');
  }
  _curd(st) {
    const W = st.W, H = st.H, P = st.portrait, cx = P ? W / 2 : W * 0.32, by = P ? 230 : 300, R = P ? 130 : 150;
    let s = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'strata1', b: 'elevPeak', t: 0.66 })}"/>`;
    s += `<path d="M${cx - R} ${by - 70}Q${cx} ${by + 90} ${cx + R} ${by - 70}Z" style="fill:${bc({ a: 'strata2', b: 'strata3', t: 0.5 })};stroke:${bc('barkDark')};stroke-width:3"/>`;
    s += `<ellipse cx="${cx}" cy="${by - 70}" rx="${R}" ry="30" style="fill:${bc('barkDark')}"/><ellipse cx="${cx}" cy="${by - 68}" rx="${R - 12}" ry="24" style="fill:${bc('white')}"/><ellipse cx="${cx - 40}" cy="${by - 74}" rx="46" ry="9" style="fill:${bc('whiteShade')};opacity:.6"/>`;
    const x = P ? W / 2 - 80 : W * 0.6, y = P ? by + 40 : 70, ww = P ? 160 : W * 0.36;
    s += fitBio('Bacterium', x, y, ww, P ? 56 : 90, { max: 0.86 });
    s += words(x + ww / 2, y + (P ? 76 : 116), 'Lactobacillus', { size: 18, display: true, ink: bc('ink') }) + words(x + ww / 2, y + (P ? 98 : 140), 'Helps turn milk into curd', { size: 15, ink: bc('ink') });
    if (!P) s += words(x + ww / 2, y + 210, 'Some bacteria cause diseases.', { size: 15, ink: bc('ink') }) + words(x + ww / 2, y + 232, 'Many are useful.', { size: 15, ink: bc('ink') });
    else s += words(W / 2, H - 20, 'Some cause diseases. Many are useful.', { size: 14, ink: bc('ink') });
    return s;
  }
  paint(st) { const k = this.stepIndex; return { svg: k === 0 ? this._three(st) : k === 1 ? this._lens(st) : this._curd(st) }; }
}
