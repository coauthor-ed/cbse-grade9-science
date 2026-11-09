// LeafSeedEvidenceScene - blk-l05-s06. Beat 0: parallel veins beside net veins. Beat 1: seeds cut open, one cotyledon and two. Beat 2: leaves sorted into two trays by venation. Beat 3: an open old book
// with a plant drawing; no likeness of any person.
import { BioStage, beats, pill, panel, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { words } from '../shared/SeaBits.js';
import { cotyledons } from '../L04/PlantBits.js';

export class LeafSeedEvidenceScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'A leaf with parallel veins beside a leaf with net veins. A seed with one cotyledon beside a seed with two. Leaves sorted by veins. An open old book of plants, Hortus Malabaricus.';
  heights = [[290, 350], [270, 340], [260, 320], [260, 320]];
  _two(st, a, b, ta, tb, sub) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = H - 2 * g, xs = [g, 2 * g + pw], c = xs.map((x) => x + pw / 2);
    return `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph) + a(c[0], g + ph * 0.42) + b(c[1], g + ph * 0.42)
      + words(c[0], H - 42, ta, { size: P ? 18 : 22, display: true, ink: INK }) + words(c[1], H - 42, tb, { size: P ? 18 : 22, display: true, ink: INK })
      + words(c[0], H - 20, sub[0], { size: P ? 14 : 15, ink: INK }) + words(c[1], H - 20, sub[1], { size: P ? 14 : 15, ink: INK });
  }
  _trays(st) {
    const W = st.W, H = st.H, P = st.portrait, k = P ? 0.8 : 0.98, g = 8, pw = (W - 3 * g) / 2, ph = H - 2 * g, xs = [g, 2 * g + pw];
    let s = `<rect width="${W}" height="${H}" ${fill(lc('bark'))}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph);
    [false, true].forEach((par, i) => {
      [-0.6, 0, 0.6].forEach((u, j) => { s += svgBio('Leaf', xs[i] + pw / 2 + (u * pw) / 2 + 2, ph - 34 - (j % 2) * 10, k * (1 - (j % 2) * 0.1), { parallel: !par ? false : true, rot: (u * 26) }); });
      s += words(xs[i] + pw / 2, H - 24, par ? 'Parallel veins' : 'Net veins', { size: P ? 15 : 18, display: true, ink: INK });
    });
    return s;
  }
  _book(st) {
    const W = st.W, H = st.H, P = st.portrait, bw = Math.min(W - 24, 460), bh = H - 90, x = (W - bw) / 2, y = 22;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('bark'))}/>`;
    s += `<path d="M${x - 6} ${y + 8}H${W / 2}V${y + bh + 8}H${x - 6}ZM${W / 2} ${y + 8}H${x + bw + 6}V${y + bh + 8}H${W / 2}Z" ${fill(lc('barkDark'))}/>`;
    s += `<path d="M${x} ${y}Q${x + bw * 0.25} ${y + 10} ${W / 2} ${y + 4}V${y + bh}Q${x + bw * 0.25} ${y + bh + 8} ${x} ${y + bh - 2}Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:2.5`)}/>`;
    s += `<path d="M${W / 2} ${y + 4}Q${x + bw * 0.75} ${y + 10} ${x + bw} ${y}V${y + bh - 2}Q${x + bw * 0.75} ${y + bh + 8} ${W / 2} ${y + bh}Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:2.5`)}/>`;
    s += svgBio('Leaf', x + bw * 0.25, y + bh - 16, (bh - 40) / 128);
    for (let i = 0; i < 6; i++) s += `<path d="M${W / 2 + 18} ${y + 30 + i * (bh - 50) / 6}h${bw / 2 - 44}" ${stroke(lc('inkSoft'), 3)}/>`;
    return s + pill(W / 2, H - 30, 'Hortus Malabaricus, 17th century', { on: true, size: P ? 14 : 16 });
  }
  draw(st, step) {
    const P = st.portrait, lk = P ? 1.26 : 1.5;
    if (step === 0) return this._two(st, (x, y) => svgBio('Leaf', x, y + 72 * lk * 0.9, lk * 0.92, { parallel: true }), (x, y) => svgBio('Leaf', x, y + 72 * lk * 0.9, lk * 0.92), 'Monocot', 'Dicot', ['Usually parallel veins', 'Usually net veins']);
    if (step === 1) return this._two(st, (x, y) => cotyledons(x, y, P ? 0.9 : 1.2, 1), (x, y) => cotyledons(x, y, P ? 0.9 : 1.2, 2), 'One cotyledon', 'Two cotyledons', ['Monocot', 'Dicot']);
    return step === 2 ? this._trays(st) : this._book(st);
  }
}
