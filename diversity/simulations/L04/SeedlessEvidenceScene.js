// SeedlessEvidenceScene - q-l04-s06 setup: the unknown plant's stem section beside what the stem of the question states. Names no group.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBioColour as lc } from '../shared/BioArt.js';
import { leader } from '../shared/SeaBits.js';
import { stemSection } from './PlantBits.js';

export class SeedlessEvidenceScene extends BioStage {
  static BEAT_STEP_MAP = beats(1);
  static ARIA_LABEL = 'A stem of the unknown plant cut across, with xylem and phloem marked.';
  heights = [[260, 300]];
  draw(st) {
    const W = st.W, H = st.H, P = st.portrait, r = P ? 96 : 118, cx = W * 0.5, cy = H * 0.5;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>` + stemSection(cx, cy, r);
    s += leader(cx - 6, cy, W * 0.16, 34, lc('waterDeep'), 3) + pill(W * 0.16, 30, 'Xylem', { size: 15 });
    s += leader(cx + r * 0.46, cy + 8, W * 0.86, H - 34, lc('capDark'), 3) + pill(W * 0.84, H - 30, 'Phloem', { size: 15 });
    return s;
  }
}
