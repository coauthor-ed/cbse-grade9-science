// GameteWaitScene - blk-l03-s08. Not to scale, and says so. Beat 0: a sperm and a large egg, 23 each. Beat 1: each alone, with
// a cross: neither grows into a person alone (humans). Beat 2: joined: the two nuclei together, 23 + 23 = 46. A single sperm
// is drawn: this is no competition.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, frame } from '../shared/PlantArt.js';
import { sperm, egg } from '../shared/CellArt.js';

import { microField } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];

export class GameteWaitScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A sperm with a tail and a much larger egg, with 23 chromosomes each. Neither grows alone. Joined, they have 46. Not to scale.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 300 : 380; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, y = H * 0.54, r = P ? 76 : 112, ex = W * 0.68, k = P ? 0.92 : 1.3;
    let s = microField(W, H, { tone: 'warm', seed: 4 });
    if (step < 2) {
      s += egg(ex, y, r) + sperm(W * (P ? 0.32 : 0.28), y, k, { wave: step ? 4 : 0 });
      s += label(ex, y + 8, '23', { size: P ? 22 : 28, display: true }) + label(W * (P ? 0.32 : 0.28) + 6, y - 28 * k, '23', { size: P ? 20 : 26, display: true });
      s += label(W * 0.26, y + 48 * k, 'Sperm', { size: 17, display: true }) + (step ? label(W * 0.26, y + 48 * k + 22, 'Alone: no new person', { size: 14 }) : '') + label(ex, y + r + 28 > H - 8 ? H - 12 : y + r + 28, 'Egg', { size: 17, display: true });
      s += (step ? label(ex, 58, 'Alone: no new person', { size: 14 }) : '') + label(W / 2, 32, step ? 'Neither grows alone' : 'Two different cells', { size: P ? 20 : 24, display: true }) + (step ? '' : label(W / 2, 56, 'Not to scale', { size: P ? 14 : 16 }));
    } else {
      const rr = P ? 92 : 124;
      s += `<g class="sv-pop">${egg(W / 2, y, rr, { nr: 0.78 })}</g>`;
      s += label(W / 2, y + 10, '23 + 23 = 46', { size: P ? 20 : 26, display: true });
      s += label(W / 2, 32, 'The full set is back', { size: P ? 20 : 24, display: true });
    }
    return { svg: frame(st, 'gw', s) };
  }
}
