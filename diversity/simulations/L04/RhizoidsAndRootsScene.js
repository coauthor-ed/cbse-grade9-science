// RhizoidsAndRootsScene - blk-l04-s05. Beat 0: moss mats on a damp wall. Beat 1: one moss cut away, rhizoids in the surface. Beat 2: male cells swim through a film
// of water to a female cell. Dry the surface removes the film and the swimmers stop. Cells are drawn far larger than life: the picture says so.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { leader } from '../shared/SeaBits.js';
import { swimmers, femaleCell, film } from './PlantBits.js';

// A cushion of moss seen from the side: dense green, many small leafy shoots, a few hair-thin stalks each with a capsule.
function mat(x0, x1, base, h, seed) {
  const n = Math.max(4, Math.round((x1 - x0) / 30)), step = (x1 - x0) / n;
  let top = `M${x0} ${base}`, tufts = '', stalks = '';
  for (let i = 0; i < n; i++) { const a = x0 + i * step, up = h * (0.82 + ((i * seed * 7) % 5) * 0.045); top += `C${a + step * 0.1} ${base - up} ${a + step * 0.9} ${base - up} ${a + step} ${base - h * 0.62}`; }
  top += `V${base}Q${(x0 + x1) / 2} ${base + h * 0.16} ${x0} ${base}Z`;
  const rows = Math.max(2, Math.round(h / 13)), cols = Math.round((x1 - x0) / 15);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const px = x0 + (c + 0.5 + (r % 2) * 0.5) * (x1 - x0) / cols, py = base - 7 - r * 13;
    tufts += `M${px} ${py}l-5 -8M${px} ${py}l0 -10M${px} ${py}l5 -8`;
  }
  for (let i = 0; i < Math.round((x1 - x0) / 46); i++) {
    const x = x0 + 22 + i * 46 + (i * seed) % 13, y = base - h * 0.74, t = 26 + (i * seed * 3) % 20, lean = ((i + seed) % 3 - 1) * 7;
    stalks += `<path d="M${x} ${y}q${lean * 0.2} ${-t * 0.6} ${lean} ${-t}" style="fill:none;stroke:${lc('bark')};stroke-width:1.6;stroke-linecap:round"/><ellipse cx="${x + lean}" cy="${y - t - 4}" rx="2.6" ry="5" transform="rotate(${lean} ${x + lean} ${y - t - 4})" ${fill(lc('bark'))}/>`;
  }
  return `<path d="${top}" transform="translate(0 -5)" ${fill(lc('leafDark'))}/><path d="${top}" ${fill(lc('moss'))}/>`
    + `<clipPath id="mm${seed}"><path d="${top}"/></clipPath><g clip-path="url(#mm${seed})"><path d="${tufts}" style="fill:none;stroke:${lc('leaf')};stroke-width:2.4;stroke-linecap:round"/></g>${stalks}`;
}

export class RhizoidsAndRootsScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'Green moss mats on a damp wall. A moss drawn large, held by root-like rhizoids. Male cells swim through a film of water to a female cell, and stop when the surface dries.';
  heights = [[270, 330], [300, 360], [260, 310]];
  ctls() { return [{ kind: 'btn', id: 'dry', label: 'Dry the surface', go: true }]; }
  enter(step) { this._dry = false; this.ctl?.label('dry', 'Dry the surface'); this.ctl?.show('dry', step === 2); }
  onCtl(id) { if (id !== 'dry') return; this._dry = !this._dry; this.ctl?.label('dry', this._dry ? 'Wet the surface' : 'Dry the surface'); this.repaint(); }

  _wall(st) {
    const W = st.W, H = st.H, P = st.portrait;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('strata5'))}/>`;
    for (let r = 0; r < 5; r++) for (let c = -1; c < 6; c++) s += `<rect x="${c * W / 4.4 + (r % 2 ? W / 8.8 : 0)}" y="${r * H / 5}" width="${W / 4.4 - 5}" height="${H / 5 - 5}" rx="6" ${fill(lc('strata4'), 'opacity:0.5')}/>`;
    s += mat(W * 0.02, W * 0.44, H * 0.5, H * 0.17, 3) + mat(W * 0.58, W * 1.02, H * 0.56, H * 0.19, 7) + mat(-8, W + 8, H + 6, H * 0.38, 11);
    return s + pill(W / 2, 28, 'Green mats on a damp wall', { size: P ? 15 : 17 });
  }
  _moss(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.62, k = P ? 1.9 : 2.3, cx = W * 0.42;
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += svgBio('MossClump', cx, gy, k, { rhizoids: true, capsule: false });
    s += leader(cx + 50, gy + 24, W * 0.72, gy + 40) + pill(W * 0.76, gy + 46, 'Rhizoids', { on: true });
    s += leader(cx + 50, gy - 40, W * 0.72, gy - 64) + pill(W * 0.76, gy - 72, 'Leaf-like parts');
    return s + pill(W * 0.76, H - 20, 'Not true roots', { size: 14 });
  }
  _swim(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.68, x0 = W * 0.1, x1 = W * 0.7, dry = this._dry;
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('strata5'))}/>`;
    if (!dry) s += film(0, gy - 26, W) + `<rect y="${gy - 19}" width="${W}" height="20" ${fill(lc('water'), 'opacity:0.82')}/>`;
    s += femaleCell(W * 0.86, gy - 34, P ? 1.1 : 1.3);
    s += swimmers(x0, x1, gy - 12, P ? 1.1 : 1.3, !dry);
    return s + pill(W / 2, 26, dry ? 'No film of water: no swimming' : 'Male cells swim to the female cell', { on: true, size: P ? 14 : 16 }) + pill(W / 2, H - 22, 'Cells drawn far larger than life', { size: 14 });
  }
  draw(st, step) { return [this._wall, this._moss, this._swim][step].call(this, st); }
}
