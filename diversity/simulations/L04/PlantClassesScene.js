// PlantClassesScene - blk-l04-s01b, new. Beat 0: a plant cell with its rigid wall, and a plant at the base of a food chain. Beat 1: the five classes, one plant each,
// pond to dry hill. Chips light one plant. The bank is a picture of where they grow, not a ladder.
import { BioStage, beats, pill, panel, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { svgSun } from '../shared/SeaArt.js';
import { words } from '../shared/SeaBits.js';

const G = [['Thallophyta', 'Spirogyra'], ['Bryophyta', 'Moss'], ['Pteridophyta', 'Fern'], ['Gymnosperm', 'Pine'], ['Angiosperm', 'Gulmohar']];
const CHIPS = G.map(([id]) => ({ id, label: id, targets: [id] }));

export class PlantClassesScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'A plant cell with a rigid wall of cellulose, and plants at the base of food chains releasing oxygen. Then the five classes: Spirogyra, moss, fern, pine and gulmohar.';
  heights = [[280, 278], [280, 278]];
  tl = tapLight({ label: 'The five plant classes', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this.tl?.set({ chips: step === 1 ? CHIPS : [], lit: null }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  _cell(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = H - 2 * g, xs = [g, 2 * g + pw], c = xs.map((x) => x + pw / 2);
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph);
    const cw = pw * 0.7, chh = ph * 0.58, cx = c[0] - cw / 2, cy = g + 18;
    s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${chh}" rx="14" ${fill(lc('leafLit'), `stroke:${lc('leafDark')};stroke-width:9`)}/>`;
    [[0.2, 0.26], [0.72, 0.2], [0.82, 0.62], [0.22, 0.74], [0.54, 0.84]].forEach(([u, v]) => { s += `<ellipse cx="${cx + cw * u}" cy="${cy + chh * v}" rx="13" ry="8" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:2`)}/>`; });
    s += `<circle cx="${cx + cw * 0.48}" cy="${cy + chh * 0.46}" r="${chh * 0.17}" ${fill(lc('waterDeep'))}/>`;
    s += words(c[0], g + ph - 42, 'Rigid wall', { size: P ? 16 : 19, display: true, ink: INK }) + words(c[0], g + ph - 18, 'mainly cellulose', { size: P ? 14 : 16, ink: INK });
    const k = P ? 0.72 : 0.96, gy = g + ph * 0.66;
    s += `<rect x="${xs[1] + 3}" y="${gy}" width="${pw - 6}" height="10" ${fill(lc('leaf'))}/>` + svgBio('Gulmohar', c[1], gy + 4, k);
    return s + words(c[1], g + ph - 42, 'Base of food chains', { size: P ? 14 : 18, display: true, ink: INK }) + words(c[1], g + ph - 18, 'Releases oxygen', { size: P ? 14 : 16, ink: INK });
  }
  _bank(st) {
    const W = st.W, H = st.H, P = st.portrait, u = W / 5, y = (x) => H * 0.86 - (x / W) * H * 0.26;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>` + svgSun(W * 0.9, 40, 0.28);
    s += `<path d="M0 ${H * 0.78}H${u * 0.9}L${u * 1.1} ${H * 0.86}V${H}H0Z" ${fill(lc('water'))}/>`;
    s += `<path d="M${u * 0.8} ${H}L${u * 1.0} ${y(u)}C${u * 2} ${y(u * 2)} ${u * 3} ${y(u * 3)} ${W} ${y(W)}V${H}Z" ${fill(lc('soil'))}/>`;
    const on = (id) => !this.tl.off(id), a = (id) => `style="opacity:${on(id) ? 1 : 0.22}"`, k = P ? 0.62 : 0.86;
    const c = (i) => u * (i + 0.5);
    s += `<g ${a('Thallophyta')}>${svgBio('Spirogyra', c(0), H * 0.86, P ? 0.28 : 0.36)}</g>`;
    s += `<g ${a('Bryophyta')}>${svgBio('MossClump', c(1) + 6, y(c(1)) + 6, k * 0.9)}</g>`;
    s += `<g ${a('Pteridophyta')}>${svgBio('FernPlant', c(2), y(c(2)) + 4, k * 0.72)}</g>`;
    s += `<g ${a('Gymnosperm')}>${svgBio('PineTree', c(3), y(c(3)) + 4, k * 1.08)}</g>`;
    s += `<g ${a('Angiosperm')}>${svgBio('Gulmohar', c(4) - 2, y(c(4)) + 4, k * 0.7)}</g>`;
    const lit = this.tl.chip();
    if (lit) { const i = G.findIndex(([id]) => id === lit.id); s += pill(W / 2, 26, `${G[i][0]}: ${G[i][1]}`, { on: true, size: P ? 15 : 17 }); }
    return s;
  }
  draw(st, step) { return step === 0 ? this._cell(st) : this._bank(st); }
}
