// NutritionWallPathsScene - blk-l02-s05, 3 beats. Beat 0: three ways to get food, each drawn: leaf and sun, a fungus on a dead
// log absorbing what it breaks down outside its body, a deer taking food in. Beat 1: three cell edges: cellulose, chitin, none.
// Beat 2: the five kingdoms, Fungi lit. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { svgSun } from '../shared/SeaArt.js';
import { fitBio, svgBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const FIVE = [['Monera', 'Bacterium'], ['Protista', 'Amoeba'], ['Fungi', 'Mushroom'], ['Plantae', 'FernPlant'], ['Animalia', 'Tiger']];

export class NutritionWallPathsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 424; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 544;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Three ways to get food: a leaf making food in sunlight, a mushroom on a dead log absorbing nutrients, a deer eating leaves. Then three cell edges: a cellulose wall, a chitin wall, and no wall. Last, the five kingdoms with Fungi lit.';

  stageHeight(st) { return st.portrait ? 520 : 400; }
  _cols(st, n) {
    // n plates in a row, or stacked in portrait.
    const P = st.portrait, g = 8, W = st.W, H = st.H;
    return Array.from({ length: n }, (_, i) => (P ? { x: 4, y: i * ((H - g * (n - 1)) / n + g), w: W - 8, h: (H - g * (n - 1)) / n } : { x: 4 + i * ((W - 8 - g * (n - 1)) / n + g), y: 4, w: (W - 8 - g * (n - 1)) / n, h: H - 12 }));
  }
  _food(st) {
    const P = st.portrait, C = this._cols(st, 3), T = [['Plant', 'Makes its own food'], ['Fungus', 'Absorbs from outside'], ['Animal', 'Takes food inside']];
    let s = '';
    C.forEach((b, i) => {
      s += PLATE(b.x, b.y, b.w, b.h, { fill: bc([{ a: 'elevLow', b: 'elevPeak', t: 0.72 }, { a: 'strata1', b: 'elevPeak', t: 0.6 }, { a: 'gold', b: 'elevPeak', t: 0.72 }][i]) });
      const ax = P ? b.x + 8 : b.x + 8, ay = P ? b.y + 8 : b.y + 66, aw = P ? b.w * 0.5 : b.w - 16, ah = P ? b.h - 16 : b.h - 76;
      const tx = P ? b.x + b.w * 0.74 : b.x + b.w / 2, ty = P ? b.y + b.h / 2 - 6 : b.y + 30;
      s += words(tx, ty, T[i][0], { size: 20, display: true, ink: bc('ink') }) + words(tx, ty + 22, T[i][1], { size: 14, ink: bc('ink') });
      if (i === 0) s += svgSun(ax + 30, ay + 26, 0.34, {}) + fitBio('Leaf', ax + aw * 0.3, ay + 6, aw * 0.6, ah - 8);
      if (i === 1) {
        const lh = Math.min(30, ah * 0.2), ly = ay + ah - lh;
        s += `<rect x="${ax + 4}" y="${ly}" width="${aw - 8}" height="${lh}" rx="${lh / 2}" style="fill:${bc('bark')};stroke:${bc('barkDark')};stroke-width:2"/>`;
        const q = Math.min((ah - lh + 2) / 96, aw * 0.6 / 86); s += svgBio('Mushroom', ax + aw / 2, ly + 5, q);
        for (const u of [0.16, 0.84]) s += `<path d="M${ax + aw * u} ${ly - 2}L${ax + aw * u} ${ly - 22}m-5 7l5 -7l5 7" style="fill:none;stroke:${bc('ink')};stroke-width:2.5;stroke-linecap:round"/>`;
      }
      if (i === 2) s += fitBio('Deer', ax, ay, aw, ah);
    });
    return s;
  }
  _walls(st) {
    const P = st.portrait, C = this._cols(st, 3), T = [['Cellulose wall', 'Plantae'], ['Chitin wall', 'Fungi'], ['No cell wall', 'Animalia']];
    const wall = [bc('leafDark'), bc('cap'), null];
    let s = '';
    C.forEach((b, i) => {
      const cw = P ? b.w * 0.42 : b.w - 40, ch = P ? b.h - 28 : b.h - 110, x = b.x + (P ? 14 : 20), y = b.y + (P ? 14 : 86);
      s += PLATE(b.x, b.y, b.w, b.h, {});
      if (wall[i]) s += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="16" style="fill:${wall[i]}"/>`;
      s += `<rect x="${x + 11}" y="${y + 11}" width="${cw - 22}" height="${ch - 22}" rx="10" style="fill:${bc('cyto')};stroke:${bc('cytoDark')};stroke-width:2.5"/><circle cx="${x + cw / 2}" cy="${y + ch / 2}" r="${Math.min(cw, ch) * 0.16}" style="fill:${bc('nucleus')}"/>`;
      const tx = P ? b.x + b.w * 0.74 : b.x + b.w / 2, ty = P ? b.y + b.h / 2 - 4 : b.y + 32;
      s += words(tx, ty, T[i][0], { size: 18, display: true }) + words(tx, ty + 24, T[i][1], { size: 15 });
    });
    return s;
  }
  _five(st) {
    const P = st.portrait, W = st.W, H = st.H; let s = '';
    if (P) {
      const hh = 200; s += PLATE(30, 4, W - 60, hh, { fill: bc({ a: 'strata1', b: 'elevPeak', t: 0.5 }), rim: 'var(--sim-gold)' }) + fitBio('Mushroom', 60, 14, W - 120, hh - 56) + words(W / 2, hh - 12, 'Fungi', { size: 24, display: true, ink: bc('ink') });
      const rest = FIVE.filter(([n]) => n !== 'Fungi'), cw = (W - 16) / 2, ch = (H - hh - 24) / 2;
      rest.forEach(([n, a], i) => { const x = 4 + (i % 2) * (cw + 8), y = hh + 16 + Math.floor(i / 2) * (ch + 6); s += PLATE(x, y, cw, ch - 2, {}) + fitBio(a, x + 12, y + 8, cw - 24, ch - 44) + words(x + cw / 2, y + ch - 14, n, { size: 16, display: true }); });
    } else {
      const g = 6, w = (W - 8 - 4 * g) / 5;
      FIVE.forEach(([n, a], i) => { const x = 4 + i * (w + g), on = n === 'Fungi'; s += PLATE(x, 40, w, H - 90, { fill: on ? bc({ a: 'strata1', b: 'elevPeak', t: 0.5 }) : undefined, rim: on ? 'var(--sim-gold)' : undefined }) + fitBio(a, x + 8, 70, w - 16, H - 170) + words(x + w / 2, H - 66, n, { size: 16, display: true, ink: on ? bc('ink') : undefined }); });
    }
    return s;
  }
  paint(st) { const k = this.stepIndex; return { svg: k === 0 ? this._food(st) : k === 1 ? this._walls(st) : this._five(st) }; }
}
