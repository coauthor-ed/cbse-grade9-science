// FungalNetworkScene - blk-l03-s06. A cut through forest floor. Beat 0: mushroom with mycelium under it. Beat 1: fallen leaves
// breaking down, minerals left in the soil. Beat 2: spores fall, warm and moist. Beat 3: two uses. Beat 4: two mushrooms that look the same.
import { BioStage, beats, pill, panel, move, INK } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { words, leader } from '../shared/SeaBits.js';

export class FungalNetworkScene extends BioStage {
  static BEAT_STEP_MAP = beats(5);
  static ARIA_LABEL = 'A mushroom with a network of threads in the soil. Fallen leaves break down and leave minerals. Spores fall from the cap. Moulds are used for enzymes and antibiotics, and mushrooms are farmed. Two wild mushrooms look the same.';
  heights = [[320, 380], [300, 360], [320, 380], [270, 330], [290, 350]];

  _floor(W, H, gy) {
    return `<rect width="${W}" height="${gy}" ${fill(lc('leafDark'), 'opacity:0.34')}/><rect width="${W}" height="${gy}" ${fill(lc('skyDay'), 'opacity:0.5')}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soilDark'))}/><rect y="${gy}" width="${W}" height="10" ${fill(lc('barkDark'))}/>`;
  }
  _net(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.5, k = P ? 1.4 : 1.7;
    let s = this._floor(W, H, gy);
    s += `<g style="opacity:0.98">${svgBio('Mycelium', W * 0.5, gy + (H - gy) * 0.52, P ? 1.05 : 1.4, { seed: 4, spread: 1 })}</g>`;
    s += svgBio('Mushroom', W * 0.5, gy + 12, k);
    s += leader(W * 0.72, gy + 60, W * 0.62, gy + 42, lc('white')) + pill(W * 0.8, gy + 70, 'Mycelium', { on: true });
    return s + pill(W * 0.14, 28, 'Fungi') ;
  }
  _rot(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.52;
    let s = this._floor(W, H, gy);
    [[0.2, 1, 0], [0.5, 0.74, 1], [0.8, 0.46, 2]].forEach(([u, k, i]) => {
      s += `<g style="opacity:${1 - i * 0.2}">${svgBio('Leaf', W * u + 50 * k, gy - 8, (P ? 0.9 : 1.2) * k, { rot: 80 })}</g>`;
      s += `<g>${svgBio('Mycelium', W * u, gy + 62, P ? 0.5 : 0.62, { seed: 2 + i, spread: 0.4 + i * 0.3 })}</g>`;
    });
    for (let i = 0; i < 14; i++) { const x = W * (0.06 + (i * 0.067)), y = gy + 34 + ((i * 53) % (H - gy - 56)); s += i > 5 ? move('pop', i * 0.03, `<circle cx="${x}" cy="${y}" r="6" ${fill(lc('gold'), `stroke:${INK};stroke-width:1.5`)}/>`) : ''; }
    return s + pill(W * 0.5, 26, 'Dead leaves break down', {}) + pill(W - 10, H - 20, 'Minerals in the soil', { anchor: 'end', on: true });
  }
  _spore(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.84, k = P ? 2.3 : 2.8, cx = W * 0.5;
    let s = this._floor(W, H, gy) + svgBio('Mushroom', cx, gy + 6, k);
    for (let i = 0; i < 12; i++) { const x = cx + (i - 5.5) * (P ? 12 : 15), y = gy - 80 * k * 0.42 + ((i * 37) % 70); s += move('fall', (i % 4) * 0.3, `<circle cx="${x}" cy="${y}" r="4.5" ${fill(lc('capDark'))}/>`); }
    return s + pill(14, 30, 'Spores', { anchor: 'start', on: true }) + pill(W - 14, 30, 'Warm and moist', { anchor: 'end' });
  }
  _uses(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = H - 2 * g, xs = [g, 2 * g + pw], c = xs.map((x) => x + pw / 2), m = H * 0.44;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('waterPale'))}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph);
    const r = P ? 58 : 92;
    s += `<ellipse cx="${c[0]}" cy="${m}" rx="${r}" ry="${r * 0.72}" ${fill(`color-mix(in oklab, ${lc('strata1')} 40%, ${lc('white')})`, `stroke:${INK};stroke-width:3`)}/>`;
    [[-20, -6, 22, 'leaf'], [18, 8, 26, 'leaf'], [20, -18, 13, 'pine'], [-18, 16, 14, 'pine']].forEach(([a, b, q, col]) => { s += `<circle cx="${c[0] + a}" cy="${m + b}" r="${q}" ${fill(lc(col), `stroke:${lc('whiteShade')};stroke-width:4`)}/>`; });
    s += words(c[0], H - 44, 'Aspergillus, Penicillium', { size: P ? 13 : 16, ink: INK }) + words(c[0], H - 22, 'Enzymes, antibiotics', { size: P ? 15 : 18, ink: INK, display: true });
    const by = m + 44;
    s += `<path d="M${c[1] - r} ${by}h${2 * r}" ${stroke(lc('bark'), 8)}/>`;
    [-0.7, 0, 0.7].forEach((u) => { s += `<rect x="${c[1] + u * r - 22}" y="${by - 34}" width="44" height="30" rx="6" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:2`)}/>` + svgBio('Mushroom', c[1] + u * r, by - 26, P ? 0.56 : 0.8); });
    s += words(c[1], H - 44, 'Mushroom farming', { size: P ? 14 : 16, ink: INK }) + words(c[1], H - 22, '30 to 45 days', { size: P ? 15 : 18, ink: INK, display: true });
    return s;
  }
  _wild(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.76, k = P ? 1.5 : 1.9;
    let s = this._floor(W, H, gy);
    [0.28, 0.72].forEach((u) => { s += svgBio('Mushroom', W * u, gy + 8, k) + (P ? '' : pill(W * u, gy + 40, 'Edible or poisonous?', { size: 15 })); });
    if (P) s += pill(W / 2, gy + 40, 'Edible or poisonous?', { size: 15 });
    return s + pill(W * 0.5, 26, 'Shape does not tell you', { on: true, size: P ? 15 : 17 });
  }
  draw(st, step) { return [this._net, this._rot, this._spore, this._uses, this._wild][step].call(this, st); }
}
