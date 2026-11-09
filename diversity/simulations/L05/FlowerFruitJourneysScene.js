// FlowerFruitJourneysScene - blk-l05-s04. Beat 0: the gulmohar in flower, seeds enclosed in fruit. Beat 1: a butterfly carries pollen between flowers, before any seed exists. Beat 2: a split pod,
// and its seeds later carried by wind, water and animals. Beat 3: flowering plants in four settings. Order on screen follows the process.
import { BioStage, beats, pill, panel, flow, head, move, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { svgButterfly, svgCactus, svgWaterLily, svgBamboo, svgHornbill } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { flower, pod } from '../L04/PlantBits.js';

export class FlowerFruitJourneysScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'A gulmohar tree in flower. A butterfly carries pollen from one flower to another. Later a pod holds seeds, and wind, water and animals carry them away. Flowering plants live in many settings.';
  heights = [[310, 370], [270, 330], [290, 350], [270, 330]];
  _tree(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.88, k = (H * 0.84) / 166;
    return `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('leaf'))}/>` + svgBio('Gulmohar', W * 0.5, gy + 6, k, { bloom: 1 }) + pill(W * 0.5, 26, 'Gulmohar, an angiosperm', { size: P ? 15 : 17 });
  }
  _pollen(st) {
    const W = st.W, H = st.H, P = st.portrait, r = P ? 62 : 78, a = W * 0.22, b = W * 0.78, cy = H * 0.56;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>` + flower(a, cy, r) + flower(b, cy, r);
    s += flow(`M${a + 16} ${cy - 30}Q${W / 2} ${cy - 130} ${b - 22} ${cy - 30}`, lc('capDark'), 4) + head(b - 20, cy - 28, 40, lc('capDark'), 7);
    s += move('drift', 0, svgButterfly(W / 2, cy - 84, P ? 1.9 : 2.3), '--dx:18px;--dy:6px');
    [0, 1, 2].forEach((i) => { s += `<circle cx="${W / 2 - 34 + i * 10}" cy="${cy - 62 + i * 4}" r="4" ${fill(lc('gold'), `stroke:${INK};stroke-width:1.2`)}/>`; });
    return s + pill(W / 2, H - 22, 'Pollination: no seed yet', { on: true, size: P ? 15 : 17 });
  }
  _pod(st) {
    const W = st.W, H = st.H, P = st.portrait, k = P ? 1.15 : 1.75, cy = H * 0.3;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>` + pod(W / 2, cy, k, -5);
    const y = H * 0.72, u = W / 3;
    const seed = (x, yy) => `<ellipse cx="${x}" cy="${yy}" rx="12" ry="7" ${fill(lc('cone'), `stroke:${INK};stroke-width:2`)}/>`;
    s += `<path d="M${u * 0.16} ${y - 14}q${u * 0.3} -20 ${u * 0.66} 0M${u * 0.16} ${y + 8}q${u * 0.3} -20 ${u * 0.66} 0" ${stroke(lc('white'), 5)}/>` + move('drift', 0, seed(u * 0.5, y - 26), '--dx:14px;--dy:-4px');
    s += `<rect x="${u + 8}" y="${y - 8}" width="${u - 16}" height="26" rx="10" ${fill(lc('water'))}/>` + seed(u * 1.5, y - 4);
    s += svgHornbill(u * 2.5, y + 14, P ? 0.8 : 1) + seed(u * 2.5 + 40, y - 20);
    ['Wind', 'Water', 'Animals'].forEach((t, i) => { s += words(u * (i + 0.5), H - 18, t, { size: P ? 16 : 19, display: true, ink: INK, halo: lc('white') }); });
    return s + pill(W / 2, H * 0.51, 'Dispersal: seeds move later', { on: true, size: P ? 15 : 16 });
  }
  _wide(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = (H - 3 * g) / 2, x = [g, 2 * g + pw], y = [g, 2 * g + ph];
    const bg = [lc('water'), lc('sand'), lc('leafLit'), lc('skyDay')];
    let s = `<rect width="${W}" height="${H}" ${fill(lc('whiteShade'))}/>`;
    [['Pond', 0, 0], ['Dry land', 1, 0], ['Hill forest', 0, 1], ['Roadside', 1, 1]].forEach(([t, i, j], n) => {
      s += panel(x[i], y[j], pw, ph, `color-mix(in oklab, ${bg[n]} 50%, ${lc('white')})`);
      const cx = x[i] + pw / 2 + 34, gy = y[j] + ph - 12, ky = ph / 160;
      s += [svgWaterLily(cx, gy - 16, 1.1 * ky * 2), svgCactus(cx, gy, ky * 1.5), svgBamboo(cx, gy, ky * 1.2), svgBio('Gulmohar', cx, gy + 4, ky * 0.84)][n];
      s += words(x[i] + 12, y[j] + 28, t, { size: P ? 15 : 18, display: true, ink: INK, anchor: 'start' });
    });
    return s;
  }
  draw(st, step) { return [this._tree, this._pollen, this._pod, this._wide][step].call(this, st); }
}
