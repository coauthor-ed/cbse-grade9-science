// PondDropToolsScene - L10 blk-l10-s05b, 3 beats. One drop of pond water under three tools: by eye it is almost clear;
// microscope and stain show cells; comparing DNA separates two microbes of one outline. The drop never changes, only
// the tool. Drawn, not to scale. The tool row marks the tool in use.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { fitBio } from '../shared/BioArt.js';
import { rod, dnaStrip, helix, microscope, mx, INK } from './EarthArt.js';

const NAMES = ['Naked eye', 'Microscope and stains', 'DNA'];
export class PondDropToolsScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A round view of one drop of pond water. By eye it is almost clear. Under a microscope with stains it holds Amoeba, Paramecium, Euglena, Spirogyra and bacteria. With DNA, two microbes of one outline show different strips.';
  heights = [[440, 400]];
  _eye(x, y, on) {
    return `<path d="M${x - 28} ${y}Q${x} ${y - 26} ${x + 28} ${y}Q${x} ${y + 26} ${x - 28} ${y}Z" ${fill(lc('white'), `stroke:${INK};stroke-width:3.5`)}/><circle cx="${x}" cy="${y}" r="10" ${fill(mx(lc('waterDeep'), INK, 0.3))}/>`;
  }
  _tools(st, step) {
    const { W, H, portrait: P } = st, pts = P ? [[W * 0.18, H - 56], [W * 0.5, H - 56], [W * 0.82, H - 56]] : [[84, 76], [84, 200], [84, 324]];
    let g = '';
    pts.forEach(([x, y], i) => {
      const on = i === step, past = i < step;
      if (i) { const [a, b] = pts[i - 1]; g += `<path d="M${P ? a + 40 : a} ${P ? b : b + 46}L${P ? x - 40 : x} ${P ? y : y - 46}" ${stroke(INK, 3.5, 'stroke-dasharray:3 9;stroke-linecap:round')}/>`; }
      g += `<g style="${on || past ? '' : 'opacity:0.4'}"><circle cx="${x}" cy="${y}" r="${on ? 40 : 36}" ${fill(on ? mx(lc('gold'), lc('white'), 0.5) : lc('white'), `stroke:${INK};stroke-width:${on ? 4.5 : 3}`)}/>`;
      if (i === 0) g += this._eye(x, y);
      if (i === 1) g += microscope(x, y + 28, 0.46);
      if (i === 2) g += helix(x, y - 26, 52, { w: 13 });
      g += '</g>';
    });
    return g;
  }
  draw(st, step) {
    const { W, H, portrait: P } = st, r = P ? 140 : 176, cx = P ? W / 2 : W * 0.62, cy = P ? 152 : H / 2;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('leaf'), lc('sand'), 0.5))}/>`;
    g += `<rect width="${W}" height="${H}" ${fill(lc('white'), 'opacity:0.5')}/>`;
    g += `<defs><clipPath id="pd-c"><circle cx="${cx}" cy="${cy}" r="${r - 6}"/></clipPath></defs>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(mx(lc('water'), lc('white'), 0.6), `stroke:${INK};stroke-width:10`)}/>`;
    g += `<path d="M${cx - r * 0.7} ${cy - r * 0.42}A${r * 0.82} ${r * 0.82} 0 0 1 ${cx - r * 0.18} ${cy - r * 0.78}" ${stroke(lc('white'), 9, 'stroke-linecap:round;opacity:0.8')}/>`;
    g += `<g clip-path="url(#pd-c)">`;
    if (step === 0) {
      for (const [u, v, q] of [[-0.3, 0.1, 3], [0.2, -0.3, 2.4], [0.4, 0.34, 2.6], [-0.1, 0.5, 2], [0.5, -0.1, 2]]) g += `<circle cx="${cx + r * u}" cy="${cy + r * v}" r="${q}" ${fill(mx(lc('leaf'), lc('white'), 0.4))}/>`;
    } else if (step === 1) {
      g += fitBio('Spirogyra', cx - r * 0.98, cy + r * 0.42, r * 1.96, r * 0.3);
      g += `<g class="bs-pop">${fitBio('Amoeba', cx - r * 0.76, cy - r * 0.68, r * 0.74, r * 0.62)}</g>`;
      g += `<g class="bs-pop" style="--d:0.16s">${fitBio('Paramecium', cx + r * 0.06, cy - r * 0.74, r * 0.76, r * 0.46)}</g>`;
      g += `<g class="bs-pop" style="--d:0.3s">${fitBio('Euglena', cx + r * 0.0, cy - r * 0.12, r * 0.84, r * 0.34)}</g>`;
      g += `<g class="bs-pop" style="--d:0.44s">${fitBio('Bacterium', cx - r * 0.8, cy - r * 0.1, r * 0.72, r * 0.3)}</g>`;
    } else {
      const s = r / 300, x0 = cx - r * 0.74, w = r * 1.48;
      g += rod(cx - r * 0.42, cy - r * 0.46, s) + rod(cx + r * 0.42, cy - r * 0.46, s);
      g += dnaStrip(x0, cy - r * 0.08, w, 24, '0123201301223012', { flag: [] }) + dnaStrip(x0, cy + r * 0.22, w, 24, '0312201132203102', { flag: [] });
    }
    g += '</g>';
    g += this._tools(st, step);
    g += pill(cx, P ? cy + r + 24 : H - 26, NAMES[step], { size: 16, on: true });
    return g;
  }
}
