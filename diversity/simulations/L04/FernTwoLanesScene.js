// FernTwoLanesScene - blk-l04-s03. Beat 0: a fern with its stem cut across, shown enlarged. Beat 1: xylem carries water up from the roots, phloem carries food from the leaves
// to other parts, up and down. Beat 2: male cells swim in a film of water outside the plant, where xylem cannot help.
import { BioStage, beats, pill, flow, head, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { leader } from '../shared/SeaBits.js';
import { stemSection, swimmers, femaleCell, film } from './PlantBits.js';

export class FernTwoLanesScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A fern with its stem cut across, showing xylem and phloem. Xylem carries water up from the roots and phloem carries food from the leaves. To reproduce, male cells swim in a film of water outside the plant.';
  heights = [[290, 350], [310, 370], [290, 340]];

  _section(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.82, k = P ? 0.92 : 1.3, fx = W * 0.27, r = P ? 88 : 112, cx = W * 0.71, cy = H * 0.48;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += svgBio('FernPlant', fx, gy + 4, k, { roots: true });
    s += `<circle cx="${fx}" cy="${gy - 28}" r="14" ${stroke(INK, 3)}/>` + `<path d="M${fx + 14} ${gy - 30}L${cx - r} ${cy + 26}" ${stroke(INK, 2.5)}/>`;
    s += stemSection(cx, cy, r);
    return s + pill(cx, cy - r - 2, 'Stem, cut across', { size: 14 }) + pill(cx, cy + r + 2, 'Enlarged drawing', { size: 14 });
  }
  _lanes(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.84, k = P ? 1.02 : 1.36, fx = W * 0.26, r = P ? 62 : 80, cx = W * 0.76, cy = H * 0.44;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += svgBio('FernPlant', fx, gy + 4, k, { roots: true });
    const top = gy - 104 * k, a = fx - 7, b = fx + 7;
    s += flow(`M${a} ${gy + 24}V${top}`, lc('waterDeep'), 6) + head(a, top - 2, -90, lc('waterDeep'), 8);
    s += flow(`M${b} ${top + 20}V${gy + 24}`, lc('capDark'), 6) + head(b, gy + 26, 90, lc('capDark'), 8);
    s += stemSection(cx, cy, r);
    s += leader(cx, cy, cx, cy + r + 30, lc('waterDeep'), 3) + pill(cx, cy + r + 38, 'Xylem: water up', { size: P ? 14 : 15, bg: `color-mix(in oklab, ${lc('water')} 34%, ${lc('white')})` });
    s += leader(cx + r * 0.42, cy - r * 0.28, cx + r * 0.3, cy - r - 12, lc('capDark'), 3) + pill(cx - 8, cy - r - 20, 'Phloem: food around', { size: P ? 14 : 15, bg: `color-mix(in oklab, ${lc('capLit')} 44%, ${lc('white')})` });
    return s;
  }
  _still(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.74, k = P ? 0.98 : 1.2, fx = W * 0.22;
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += svgBio('FernPlant', fx, gy + 4, k, { roots: true });
    s += film(W * 0.42, gy - 22, W * 0.58) + `<rect x="${W * 0.42}" y="${gy - 15}" width="${W * 0.58}" height="16" ${fill(lc('water'), 'opacity:0.82')}/>`;
    s += femaleCell(W * 0.9, gy - 28, P ? 0.9 : 1.1) + swimmers(W * 0.46, W * 0.74, gy - 9, P ? 0.9 : 1.1);
    return s + pill(W * 0.64, 28, 'Still needs water outside', { on: true, size: P ? 14 : 16 }) + pill(W / 2, H - 22, 'Cells drawn far larger than life', { size: 14 });
  }
  draw(st, step) { return [this._section, this._lanes, this._still][step].call(this, st); }
}
