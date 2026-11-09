// YeastPredictionScene - blk-l03-s02 setup. Yeast with its two blanks filled: a chitin wall, and nutrients going in.
// Names no kingdom, so the predict stays open.
import { BioStage, beats, pill, waterBack, flow, head } from './BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc, BOX } from '../shared/BioArt.js';
import { leader } from '../shared/SeaBits.js';

export class YeastPredictionScene extends BioStage {
  static BEAT_STEP_MAP = beats(1);
  static ARIA_LABEL = 'A yeast cell drawn large, with a wall of chitin and nutrients passing in from around it.';
  heights = [[290, 350]];

  draw(st) {
    const W = st.W, H = st.H, P = st.portrait, b = BOX.Yeast, k = (P ? 210 : 280) / b[3];
    const cx = W * 0.5, ox = cx - (b[0] + b[2] / 2) * k, oy = H * 0.54 - (b[1] + b[3] / 2) * k;
    let s = waterBack(W, H) + svgBio('Yeast', ox, oy, k, { buds: 1 });
    const wx = ox - 30 * k, wy = oy - 20 * k;
    s += leader(wx, wy, P ? 80 : 150, 44) + pill(P ? 80 : 150, 34, 'Wall of chitin', { on: true });
    [[0.08, 0.66], [0.1, 0.84], [0.93, 0.66]].forEach(([u, v], i) => {
      const x0 = W * u, y0 = H * v, x1 = ox + (i === 2 ? 16 : -30) * k, y1 = oy + 24 * k + i * 8;
      s += flow(`M${x0} ${y0}L${x1} ${y1}`, lc('capDark'), 4) + head(x1, y1, Math.atan2(y1 - y0, x1 - x0) * 57.3, lc('capDark'), 7);
      s += `<circle cx="${x0}" cy="${y0}" r="7" ${fill(lc('leaf'))}/>`;
    });
    return s + pill(W * 0.62, H - 22, 'Absorbs nutrients', { on: true });
  }
}
