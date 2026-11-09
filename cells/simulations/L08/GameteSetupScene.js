// GameteSetupScene - predict setup, blk-l08-n03. Two gametes that have kept all 4 chromosomes, an arrow, and a new cell
// with a question mark. The chromosomes of the new cell are not drawn: that is the question.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, depthField } from '../shared/CellWorld.js';
import { divCell, setOf, arrow, badge } from './DivideArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const SET = [{ h: 0, c: 'a' }, { h: 0, c: 'b' }, { h: 1, c: 'a' }, { h: 1, c: 'b' }];

export class GameteSetupScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0)];
  static WIDTH = 640;
  static HEIGHT = 334;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Two gametes, each with 4 chromosomes, join to form a new cell. The number of chromosomes in the new cell is shown as a question mark.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 320; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait;
    let s = depthField(W, H, { tone: 'rose', seed: 71 });
    const r = P ? 70 : 72, a = P ? [W * 0.27, 96] : [W * 0.14, H * 0.46], b = P ? [W * 0.73, 96] : [W * 0.39, H * 0.46], c = P ? [W / 2, 290] : [W * 0.78, H * 0.5], R = P ? 88 : 110;
    for (const [x, y] of [a, b]) s += divCell(x, y, r, { seed: 5 }) + setOf(SET, x, y, r / 92, { gap: 30 }) + badge(x + r * 0.76, y - r * 0.72, 4, 16) + label(x, y + r + (P ? 18 : 20), 'Gamete', { size: P ? 19 : 18, display: true });
    if (P) s += arrow(a[0] + 18, a[1] + 112, c[0] - 44, c[1] - R + 6) + arrow(b[0] - 18, b[1] + 112, c[0] + 44, c[1] - R + 6);
    else s += arrow(b[0] + r + 12, b[1], c[0] - R - 10, c[1]) + label((a[0] + b[0]) / 2, a[1] + 12, '+', { size: 40, display: true });
    s += divCell(c[0], c[1], R, { seed: 8 }) + label(c[0], c[1] + (P ? 24 : 32), '?', { size: P ? 68 : 90, display: true });
    return { svg: cwFrame(st, 'gs', s) };
  }
}
