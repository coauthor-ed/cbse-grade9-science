// PlantFeatureComparisonScene - blk-l05-s05. A board after the book's Table 12.3, one question lit per beat: each of the five groups answers it. Beat 4: tap a group for its advantage and challenge,
// in the book's words. It is a table of features, not a ranking.
import { BioStage, beats, pill, panel, INK, LIT } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { svgBio, svgBioColour as lc, BOX } from '../shared/BioArt.js';
import { words } from '../shared/SeaBits.js';

const G = [
  { id: 'Thallophyta', art: 'Spirogyra', o: { cells: 3 }, a: ['Simple body helps it survive', 'and spread in water'], c: ['Cannot live on land'] },
  { id: 'Bryophyta', art: 'MossClump', o: {}, a: ['Body is adapted to live', 'on moist land'], c: ['Always needs moisture'] },
  { id: 'Pteridophyta', art: 'FernPlant', o: {}, a: ['Lives on land and moves food', 'and water to all parts'], c: ['Cannot reproduce without water'] },
  { id: 'Gymnosperm', art: 'PineTree', o: {}, a: ['Leaves suit dry conditions;', 'seeds carry life forward'], c: ['Seeds are not covered by fruits'] },
  { id: 'Angiosperm', art: 'Gulmohar', o: {}, a: ['Flowers, fruits and seeds;', 'seeds carry life forward'], c: ['Reproduction depends on', 'pollination by different agents'] },
];
const Q = [
  ['True roots, stems, leaves?', ['No', 'No', 'Yes', 'Yes', 'Yes']],
  ['Xylem and phloem?', ['No', 'No', 'Yes', 'Yes', 'Yes']],
  ['Fertilisation without water?', ['No', 'No', 'No', 'Yes', 'Yes']],
  ['Seeds and fruits?', ['Neither', 'Neither', 'Neither', 'Seeds', 'Both']],
];
const CHIPS = G.map((g) => ({ id: g.id, label: g.id, targets: [g.id] }));

export class PlantFeatureComparisonScene extends BioStage {
  static BEAT_STEP_MAP = beats(5);
  static ARIA_LABEL = 'A board of the five plant groups: Thallophyta, Bryophyta, Pteridophyta, Gymnosperm and Angiosperm. Each beat asks one question of all five. Then each group shows its advantage and its challenge.';
  heights = [[400, 340], [400, 340], [400, 340], [400, 340], [310, 262]];
  tl = tapLight({ label: 'Plant groups', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this.tl?.set({ chips: step === 4 ? CHIPS : [], lit: step === 4 ? 'Thallophyta' : null }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  _art(g, x, y, w, h) {
    const b = BOX[g.art], k = Math.min(w / b[2], h / b[3]);
    return svgBio(g.art, x - (b[0] + b[2] / 2) * k, y - (b[1] + b[3] / 2) * k, k, g.o);
  }
  _board(st, step) {
    const W = st.W, H = st.H, P = st.portrait, [ask, ans] = Q[step], top = 52;
    let s = `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>` + pill(W / 2, 28, ask, { on: true, size: P ? 16 : 18 });
    const plate = (x, y, t) => { const on = t !== 'No' && t !== 'Neither'; return pill(x, y, t, { size: P ? 15 : 15, bg: on ? LIT : lc('white') }); };
    if (P) {
      const rh = (H - top - 6) / 5;
      G.forEach((g, i) => { const y = top + rh * i; s += panel(6, y, W - 12, rh - 5, lc('white'), 10) + this._art(g, 42, y + rh / 2 - 2, 62, rh - 13) + words(80, y + rh / 2 + 4, g.id, { size: 16, display: true, ink: INK, anchor: 'start' }) + plate(W - 50, y + rh / 2 - 2, ans[i]); });
    } else {
      const cw = (W - 12) / 5;
      G.forEach((g, i) => { const x = 6 + cw * i, c = x + cw / 2; s += panel(x + 2, top, cw - 4, H - top - 8, lc('white'), 10) + this._art(g, c, top + 94, cw - 18, 150) + words(c, H - 74, g.id, { size: 14, display: true, ink: INK }) + plate(c, H - 38, ans[i]); });
    }
    return s;
  }
  _pair(st) {
    const W = st.W, H = st.H, P = st.portrait, id = this.tl.chip()?.id ?? 'Thallophyta', g = G.find((x) => x.id === id);
    let s = `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>`;
    const aw = P ? W - 12 : W * 0.28, ah = P ? 106 : H - 16;
    s += panel(6, 6, aw, ah, lc('white')) + this._art(g, 6 + aw / 2, 6 + ah / 2, aw - 28, ah - 20);
    const x = P ? 6 : aw + 14, w = W - x - 6, y0 = P ? ah + 12 : 6, h = (H - y0 - 14) / 2;
    const big = !P, box = (y, tt, ls, bg) => panel(x, y, w, h, bg) + words(x + 12, y + (big ? 28 : 24), tt, { size: big ? 21 : 17, display: true, ink: INK, anchor: 'start' }) + ls.map((l, i) => words(x + 12, y + (big ? 54 + i * 25 : 46 + i * 20), l, { size: big ? 20 : 15, ink: INK, anchor: 'start', weight: 600 })).join('');
    return s + box(y0, 'Advantage', g.a, lc('white')) + box(y0 + h + 6, 'Challenge', g.c, LIT);
  }
  draw(st, step) { return step === 4 ? this._pair(st) : this._board(st, step); }
}
