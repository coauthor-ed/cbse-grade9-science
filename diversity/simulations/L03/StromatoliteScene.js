// StromatoliteScene - blk-l03-s04b, new. Beat 0: a shallow ancient sea with mounds of cyanobacteria, oxygen bubbles rising
// and the oxygen in the air growing. Beat 1: the same mounds as layers in old rock, a stromatolite. Schematic, says so.
import { BioStage, beats, pill, move } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBioColour as lc } from '../shared/BioArt.js';
import { svgSun } from '../shared/SeaArt.js';

const dome = (cx, gy, w, h, n, c0, c1) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const u = 1 - i / n, ww = w * u, hh = h * u;
    s += `<path d="M${cx - ww / 2} ${gy}C${cx - ww / 2} ${gy - hh * 1.3} ${cx + ww / 2} ${gy - hh * 1.3} ${cx + ww / 2} ${gy}Z" ${fill(i % 2 ? c0 : c1)}/>`;
  }
  return s;
};

export class StromatoliteScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'Mounds of cyanobacteria in a shallow sea give off oxygen, and the oxygen in the air grows. Then the same mounds as layers in old rock, called stromatolites, found in Rajasthan and Madhya Pradesh.';
  heights = [[320, 380], [300, 370]];

  draw(st, step) {
    const W = st.W, H = st.H, P = st.portrait;
    if (step === 0) {
      const sea = H * 0.34, gy = H * 0.9;
      let s = `<rect width="${W}" height="${sea}" ${fill(lc('skyDay'))}/><rect y="${sea}" width="${W}" height="${H - sea}" ${fill(lc('water'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
      s += svgSun(W * 0.76, 46, 0.32);
      [[0.2, 0.3, 90], [0.5, 0.36, 120], [0.78, 0.26, 80]].forEach(([u, w, h]) => { s += dome(W * u, gy + 4, W * w, h, 5, lc('leafDark'), lc('leaf')); });
      [[0.14, 0], [0.26, 0.5], [0.44, 0.9], [0.52, 0.2], [0.62, 1.3], [0.74, 0.7], [0.84, 1.6]].forEach(([u, d]) => {
        s += move('rise', d, `<circle cx="${W * u}" cy="${sea + 24 + 46 * ((u * 7) % 1)}" r="7" ${fill(lc('white'), `stroke:${lc('waterDeep')};stroke-width:2`)}/>`);
      });
      const bx = 14, bw = 26, bh = sea - 40, by = 30;
      s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="8" ${fill(lc('white'), `stroke:${lc('ink')};stroke-width:2.5`)}/>`;
      s += `<rect class="sv-grow" x="${bx + 3}" y="${by + bh * 0.2}" width="${bw - 6}" height="${bh * 0.8 - 3}" rx="5" ${fill(lc('water'))}/>`;
      s += pill(bx + bw + 8, by + 18, 'Oxygen in the air', { anchor: 'start', on: true });
      return s + pill(W * 0.5, H - 14, 'About 2.5 billion years ago', { size: P ? 14 : 15 });
    }
    const gy = H * 0.84;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('strata2'))}/>`;
    [0.2, 0.42, 0.62, 0.84].forEach((v, i) => { s += `<rect y="${H * v}" width="${W}" height="${H * 0.24}" ${fill(i % 2 ? lc('strata3') : lc('strata1'))}/>`; });
    [[0.27, 0.42, 220], [0.73, 0.36, 180]].forEach(([u, w, h]) => { s += dome(W * u, gy, W * w, h, 8, lc('strata5'), lc('strata1')); });
    s += pill(W * 0.5, 30, 'Stromatolite: layers in old rock', { on: true, size: P ? 15 : 17 });
    return s + pill(W * 0.5, H - 20, 'Found in Rajasthan and Madhya Pradesh', { size: P ? 14 : 15 });
  }
}
