// OneCellMissingEvidenceScene - blk-l03-s01. Yeast and Amoeba side by side. Beat 0: both one cell, both a true nucleus.
// Beat 1: wall and feeding are blank for both. No kingdom is decided here.
import { BioStage, beats, pill, waterBack, INK } from './BioStage.js';
import { stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, BOX } from '../shared/BioArt.js';
import { seaLabel } from '../shared/SeaBits.js';

export class OneCellMissingEvidenceScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'Yeast and Amoeba, each one cell with a true nucleus. The cell wall and the way of feeding are still blank for both.';
  heights = [[320, 370], [370, 410]];

  draw(st, step) {
    const W = st.W, H = st.H, P = st.portrait, cols = [W * 0.26, W * 0.74], artH = P ? 150 : 200, top = 44;
    let s = waterBack(W, H);
    [['Yeast', 'Yeast', -6, 8], ['Amoeba', 'Amoeba', -6, 16]].forEach(([n, name, nx, ny], i) => {
      const b = BOX[n], k = Math.min((W * 0.42) / b[2], artH / b[3]), cx = cols[i], ox = cx - (b[0] + b[2] / 2) * k, oy = top + 6 - b[1] * k;
      s += seaLabel(cx, 30, name, { size: P ? 21 : 25, display: true });
      s += svgBio(n, ox, oy, k, n === 'Yeast' ? { buds: 1 } : { seed: 4 });
      if (step === 0) s += `<circle cx="${ox + nx * k}" cy="${oy + ny * k}" r="${20 * k}" ${stroke(INK, 3)}/>`;
      const y0 = top + artH + 30, g = P ? 38 : 40;
      s += pill(cx, y0, 'One cell') + pill(cx, y0 + g, 'True nucleus', { on: step === 0 });
      if (step === 1) s += pill(cx, y0 + g * 2, 'Cell wall: ?', { on: true, pop: true }) + pill(cx, y0 + g * 3 - 6, 'Feeding: ?', { on: true, pop: true });
    });
    return s;
  }
}
