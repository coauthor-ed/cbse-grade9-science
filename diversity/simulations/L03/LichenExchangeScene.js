// LichenExchangeScene - blk-l03-s07. Beat 0: lichen patches on bark. Beat 1: a cut through a lichen: fungal threads around green algal cells, food one way,
// protection the other. Beat 2: colour read as a sign of air pollutants, with no invented colour scale. Beat 3: spice and dye, and a warning.
import { BioStage, beats, pill, panel, flow, head, INK } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';

import { words } from '../shared/SeaBits.js';

const bark = (W, H) => { let s = `<rect width="${W}" height="${H}" ${fill(lc('bark'))}/>`; for (let i = 0; i < 12; i++) { const x = (i + 0.5) * W / 12; s += `<path d="M${x} 0q${i % 2 ? 12 : -12} ${H * 0.3} 0 ${H * 0.55}t0 ${H * 0.45}" ${stroke(lc('barkDark'), 6)}/>`; } return s; };

export class LichenExchangeScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'White-green lichen patches on bark. Inside a lichen, fungal threads wrap green algal cells: the alga gives food and the fungus gives protection. The colour of a lichen tells researchers about air pollutants. Lichens give spice and dyes, and some are poisonous.';
  heights = [[280, 350], [310, 370], [280, 340], [280, 340]];

  _patch(st) {
    const W = st.W, H = st.H, P = st.portrait, k = P ? 2.4 : 3.2;
    return bark(W, H) + svgBio('LichenBark', W * 0.5, H * 0.52, k) + pill(W * 0.5, H - 24, 'Lichen on a tree trunk', { size: 15 });
  }
  _inside(st) {
    const W = st.W, H = st.H, P = st.portrait, top = H * 0.2, bot = H * 0.74;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('waterPale'))}/><rect y="${top}" width="${W}" height="${bot - top}" ${fill(lc('whiteShade'))}/>`;
    s += `<rect y="${top}" width="${W}" height="20" ${fill(lc('thread'))}/>`;
    for (let i = 0; i < 18; i++) { const x = (i + 0.5) * W / 18; s += `<path d="M${x} ${top + 8}C${x + 30} ${top + 60} ${x - 34} ${bot - 70} ${x + 16} ${bot}" ${stroke(lc('threadDark'), 3.5)}/>`; }
    const cells = [[0.14, 0.46], [0.3, 0.38], [0.46, 0.5], [0.62, 0.4], [0.78, 0.48], [0.9, 0.38], [0.22, 0.56], [0.7, 0.56]];
    cells.forEach(([u, v]) => { s += `<circle cx="${W * u}" cy="${H * v}" r="${P ? 19 : 22}" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:3`)}/><circle cx="${W * u - 6}" cy="${H * v - 6}" r="5" ${fill(lc('leafLit'))}/>`; });
    const cx = W * 0.46, cy = H * 0.5;
    s += flow(`M${cx + 12} ${cy + 22}Q${cx + 40} ${bot - 16} ${cx + 84} ${bot - 4}`, lc('capDark'), 5) + head(cx + 84, bot - 4, 20, lc('capDark'), 7);
    s += pill(W * 0.3, H - 30, 'Alga makes food', { on: true, size: P ? 14 : 15 }) + pill(W * 0.5, 26, 'Fungus gives protection', { size: P ? 14 : 15 });
    return s + pill(W * 0.76, H - 30, 'Fungus takes food', { size: P ? 14 : 15 });
  }
  _air(st) {
    const W = st.W, H = st.H, P = st.portrait, r = P ? 88 : 110, cx = P ? W * 0.3 : W * 0.28, cy = H * 0.5;
    let s = bark(W, H) + `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(lc('barkDark'), `stroke:${INK};stroke-width:7`)}/>` + svgBio('LichenBark', cx, cy, (r * 1.32) / 132);
    s += `<path d="M${cx + r * 0.74} ${cy + r * 0.74}l${r * 0.4} ${r * 0.4}" ${stroke(INK, 12)}/>`;
    const bx = P ? W * 0.62 : W * 0.6, bw = W - bx - 12;
    s += panel(bx, H * 0.2, bw, H * 0.6);
    s += words(bx + bw / 2, H * 0.2 + 34, 'Colour', { size: P ? 18 : 22, display: true, ink: INK });
    s += `<path d="M${bx + bw / 2} ${H * 0.2 + 48}v${H * 0.14}" ${stroke(INK, 4)}/>` + head(bx + bw / 2, H * 0.2 + 54 + H * 0.14, 90, INK, 7);
    s += words(bx + bw / 2, H * 0.62, 'Pollutants', { size: P ? 16 : 20, display: true, ink: INK }) + words(bx + bw / 2, H * 0.62 + 24, 'in the air', { size: P ? 16 : 20, display: true, ink: INK });
    return s;
  }
  _uses(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = H - 60, xs = [g, 2 * g + pw], c = xs.map((x) => x + pw / 2), m = g + ph * 0.42;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('waterPale'))}/>` + panel(xs[0], g, pw, ph) + panel(xs[1], g, pw, ph);
    s += `<rect x="${c[0] - 34}" y="${m - 34}" width="68" height="76" rx="10" ${fill(`color-mix(in oklab, ${lc('water')} 26%, ${lc('white')})`, `stroke:${INK};stroke-width:3`)}/><rect x="${c[0] - 38}" y="${m - 46}" width="76" height="16" rx="5" ${fill(lc('bark'), `stroke:${INK};stroke-width:2.5`)}/>` + svgBio('LichenBark', c[0], m + 6, 0.42);
    s += words(c[0], g + ph - 12, 'Patthar ke phool', { size: P ? 15 : 18, display: true, ink: INK });
    [['magma', 'strata6', 0.5, 'Maroon'], ['seaDeep', 'magma', 0.34, 'Violet'], ['magma', 'strata6', 0.68, 'Burgundy']].forEach(([a, b, u, n], i) => {
      const x = c[1] + (i - 1) * (P ? 50 : 66), col = `color-mix(in oklab, ${lc(a)} ${100 - u * 100}%, ${lc(b)})`;
      s += `<path d="M${x - 18} ${m - 40}q18 -10 36 0v70q-18 10 -36 0Z" ${fill(col, `stroke:${INK};stroke-width:2.5`)}/><path d="M${x - 18} ${m - 18}q18 10 36 0M${x - 18} ${m + 6}q18 10 36 0" ${stroke(INK, 1.5)}/>`;
      s += words(x, m + 56, n, { size: P ? 12.5 : 14, ink: INK });
    });
    s += words(c[1], g + ph - 12, 'Dyes', { size: P ? 15 : 18, display: true, ink: INK });
    return s + pill(W / 2, H - 26, 'Some lichens are poisonous', { on: true });
  }
  draw(st, step) { return [this._patch, this._inside, this._air, this._uses][step].call(this, st); }
}
