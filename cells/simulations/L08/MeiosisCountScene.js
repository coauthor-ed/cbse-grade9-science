// MeiosisCountScene - blk-l07-s10a. Beat 0: parent cell with its copied chromosomes, where meiosis happens as labels.
// Beat 1: first division, 4 -> 2 and 2: one of each pair goes to each cell. Beat 2: second division, like mitosis: four
// cells, 2 each, single rods. Beat 3: fertilisation: 2 + 2 = 4.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, depthField } from '../shared/CellWorld.js';
import { divCell, setOf, arrow, badge } from './DivideArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const P4 = [{ h: 0, c: 'a', d: 1 }, { h: 0, c: 'b', d: 1 }, { h: 1, c: 'a', d: 1 }, { h: 1, c: 'b', d: 1 }];
const A = [{ h: 0, c: 'a', d: 1 }, { h: 1, c: 'b', d: 1 }], B = [{ h: 0, c: 'b', d: 1 }, { h: 1, c: 'a', d: 1 }];
const sing = (l) => l.map((c) => ({ ...c, d: 0 }));

export class MeiosisCountScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A parent cell with 4 chromosomes, each copied. In the first division it forms two cells with 2 chromosomes each. In the second division each of those divides again, giving four cells with 2 chromosomes each. Then two such cells join at fertilisation and the new cell has 4 chromosomes.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 410 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = depthField(W, H, { tone: 'blue', seed: 61 });
    const title = (t) => label(W / 2, P ? 26 : 32, t, { size: P ? 18 : 22, display: true });
    const cell = (x, y, r, list, seed, n, pop) => {
      const b = `${divCell(x, y, r, { seed })}${setOf(list, x, y, r / 96, { gap: 36 })}`;
      return (pop ? `<g class="sv-pop">${b}</g>` : b) + badge(x + r * 0.76, y - r * 0.74, n, Math.max(14, r * 0.22));
    };
    if (step === 0) {
      const r = P ? 112 : 136, cx = P ? W / 2 : W * 0.34, cy = P ? 158 : H * 0.54;
      s += title('Only in reproductive organs') + cell(cx, cy, r, P4, 4, 4);
      const x = P ? W / 2 : W * 0.76, y0 = P ? 306 : H * 0.34, g = P ? 30 : 56, fs = P ? 16 : 19;
      if (P) s += label(x, y0, 'Animals: testes, ovaries', { size: fs, display: true }) + label(x, y0 + g, 'Plants: anthers, ovaries', { size: fs, display: true }) + label(x, y0 + 2 * g, 'The cell divides twice', { size: fs - 1 });
      else s += label(x, y0, 'Animals:', { size: fs, display: true }) + label(x, y0 + 28, 'testes, ovaries', { size: fs }) + label(x, y0 + g + 40, 'Plants:', { size: fs, display: true }) + label(x, y0 + g + 68, 'anthers, ovaries', { size: fs });
      return { svg: cwFrame(st, 'me', s) };
    }
    if (step === 1) {
      s += title('First division: half the number');
      if (P) {
        s += cell(W / 2, 112, 70, P4, 4, 4);
        [[W * 0.27, 306, A], [W * 0.73, 306, B]].forEach(([x, y, l], i) => { s += arrow(W / 2 + (i ? 34 : -34), 180, x + (i ? -16 : 16), y - 88) + cell(x, y, 78, l, 6 + i, 2, true); });
      } else {
        s += cell(W * 0.22, H * 0.55, 102, P4, 4, 4);
        [[W * 0.72, H * 0.32, A], [W * 0.72, H * 0.76, B]].forEach(([x, y, l], i) => { s += arrow(W * 0.39, H * 0.55 + (i ? 14 : -14), x - 88, y + (i ? -18 : 18)) + cell(x, y, 74, l, 6 + i, 2, true); });
      }
      return { svg: cwFrame(st, 'me', s) };
    }
    if (step === 2) {
      s += title('Second division: four cells');
      if (P) {
        const tops = [[W * 0.27, 96, A], [W * 0.73, 96, B]];
        tops.forEach(([x, y, l], i) => {
          s += cell(x, y, 56, l, 6 + i, 2);
          [[-1, 0], [1, 1]].forEach(([d, k]) => { const kx = x + d * 44, ky = 276 + 0; s += arrow(x + d * 12, y + 60, kx, ky - 62, { w: 3 }); s += cell(kx, ky + (k ? 54 : -2), 42, sing([l[k]]).concat(sing([l[1 - k]])), 9 + i + k, 2, true); });
        });
      } else {
        const tops = [[W * 0.16, H * 0.36, A], [W * 0.16, H * 0.76, B]];
        tops.forEach(([x, y, l], i) => {
          s += cell(x, y, 64, l, 6 + i, 2);
          [[-1], [1]].forEach(([d], k) => { const ky = y + d * 44 + 4, kx = W * 0.72 + (k ? 60 : -30); s += arrow(x + 72, y + d * 12, kx - 52, ky, { w: 3 }); s += cell(kx, ky, 42, sing(l), 9 + i + k, 2, true); });
        });
      }
      return { svg: cwFrame(st, 'me', s) };
    }
    s += title('Fertilisation restores the number');
    const g = sing(A), e = sing(B);
    if (P) {
      s += cell(W * 0.27, 110, 68, g, 7, 2) + label(W * 0.27, 200, 'Gamete', { size: 16, display: true }) + cell(W * 0.73, 110, 68, e, 8, 2) + label(W * 0.73, 200, 'Gamete', { size: 16, display: true });
      s += arrow(W * 0.3, 210, W * 0.45, 256) + arrow(W * 0.7, 210, W * 0.55, 256) + cell(W / 2, 326, 76, g.concat(e), 9, 4, true);
    } else {
      s += cell(W * 0.15, H * 0.34, 68, g, 7, 2) + cell(W * 0.15, H * 0.76, 68, e, 8, 2);
      s += arrow(W * 0.3, H * 0.38, W * 0.5, H * 0.5) + arrow(W * 0.3, H * 0.72, W * 0.5, H * 0.6);
      s += cell(W * 0.72, H * 0.54, 118, g.concat(e), 9, 4, true) + label(W * 0.72, H - 18, 'New cell: the original number', { size: 18, display: true });
    }
    return { svg: cwFrame(st, 'me', s) };
  }
}
