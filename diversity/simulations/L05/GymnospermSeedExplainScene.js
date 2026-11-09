// GymnospermSeedExplainScene - blk-l05-s03. Beat 0: a seed cut open: coat, stored food, embryo. Beat 1: a needle beside a broad leaf: less surface, less water lost. Beat 2: a fern on a film
// of water beside a pine on dry ground: fertilisation with and without water.
import { BioStage, beats, pill, panel, move, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { leader, words } from '../shared/SeaBits.js';
import { seedCut, film } from '../L04/PlantBits.js';

export class GymnospermSeedExplainScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A pine seed cut open, showing its coat, stored food and embryo. A needle loses less water than a broad leaf. A fern needs a film of water for fertilisation and a pine does not.';
  heights = [[290, 350], [280, 340], [270, 330]];
  _seed(st) {
    const W = st.W, H = st.H, P = st.portrait, k = P ? 1.5 : 1.85, cx = W * 0.4, cy = H * 0.5;
    let s = `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>` + seedCut(cx, cy, k);
    const t = (x, y, x1, y1, tt, on) => leader(x1, y1, x - 6, y) + pill(x, y, tt, { anchor: 'start', on, size: P ? 14 : 16 });
    s += t(W * 0.68, H * 0.2, cx + 40 * k, cy - 40 * k, 'Coat');
    s += t(W * 0.68, H * 0.5, cx + 34 * k, cy + 6 * k, 'Stored food');
    s += t(W * 0.68, H * 0.8, cx + 8 * k, cy + 24 * k, 'Embryo', true);
    return s;
  }
  _leaf(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = H - 2 * g, xs = [g, 2 * g + pw], c = xs.map((x) => x + pw / 2), m = g + ph * 0.42;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('whiteShade'))}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph);
    s += svgBio('PineNeedles', c[0], m, P ? 1.2 : 1.7) + svgBio('Leaf', c[1], m + 62 * (P ? 1 : 1.2), P ? 1.05 : 1.3);
    const drop = (x, y) => `<path d="M${x} ${y - 9}q8 9 5 13q-5 5 -10 0q-3 -4 5 -13Z" ${fill(lc('water'), `stroke:${INK};stroke-width:1.5`)}/>`;
    [[-46, -40], [46, -30], [-40, 30], [40, 36], [-56, -6], [58, 6], [0, -60]].forEach(([a, b], i) => { s += move('rise', i * 0.2, drop(c[1] + a, m + b)); });
    s += move('rise', 0, drop(c[0] + 12, m - 56));
    return s + words(c[0], H - 22, 'Needle: less water lost', { size: P ? 14 : 16, ink: INK }) + words(c[1], H - 22, 'Broad leaf: more lost', { size: P ? 14 : 16, ink: INK });
  }
  _water(st) {
    const W = st.W, H = st.H, P = st.portrait, cw = W / 2, gy = H * 0.74;
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += svgBio('FernPlant', cw * 0.5, gy + 4, P ? 0.72 : 0.96) + film(0, gy - 8, cw) + `<rect y="${gy - 1}" width="${cw}" height="7" ${fill(lc('water'), 'opacity:0.82')}/>`;
    s += svgBio('PineTree', cw * 1.5, gy + 4, (H * 0.62) / 190) + `<rect x="${cw - 1.5}" width="3" height="${H}" ${fill(lc('ink'))}/>`;
    return s + pill(cw * 0.5, H - 24, 'Fern: needs water', { size: P ? 14 : 15 }) + pill(cw * 1.5, H - 24, 'Pine: does not', { on: true, size: P ? 14 : 15 }) + words(W / 2, 28, 'For fertilisation', { size: P ? 18 : 22, display: true, ink: INK, halo: lc('white') });
  }
  draw(st, step) { return [this._seed, this._leaf, this._water][step].call(this, st); }
}
