// MitosisCountScene - blk-l07-s06. Beat 0: a fertilised egg, one cell. Beat 1: 4 chromosomes, each now with a joined copy,
// count still 4. Beat 2: the copies separate: two daughter cells, each 4, same colours. Beat 3: 1 -> 2 -> 4 -> 8, every badge 4.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, depthField } from '../shared/CellWorld.js';
import { divCell, setOf, arrow, badge } from './DivideArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const SET = [{ h: 0, c: 'a' }, { h: 0, c: 'b' }, { h: 1, c: 'a' }, { h: 1, c: 'b' }];
const DBL = SET.map((c) => ({ ...c, d: true }));

export class MitosisCountScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'One cell with 4 chromosomes. Each chromosome gets a joined copy, and the count stays 4. The copies separate into two daughter cells, each with the same 4 chromosomes. Each daughter divides again: 1, 2, 4, 8 cells, every one with 4.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = depthField(W, H, { tone: 'green', seed: 51 });
    const title = (t) => label(W / 2, P ? 26 : 32, t, { size: P ? 18 : 22, display: true });
    if (step < 2) {
      const r = P ? 138 : 158, cx = W / 2, cy = H * 0.54;
      s += divCell(cx, cy, r, { seed: 4 }) + setOf(step ? DBL : SET, cx, cy, P ? 1.3 : 1.5, { gap: step ? 36 : 30 });
      s += title(step ? '4 chromosomes, each copied' : 'A parent cell: 4 chromosomes');
      s += badge(cx + r * 0.78, cy - r * 0.76, 4, 24);
      return { svg: cwFrame(st, 'mc', s) };
    }
    if (step === 2) {
      s += title('Two identical daughter cells');
      if (P) {
        s += divCell(W / 2, 112, 64, { seed: 4 }) + setOf(DBL, W / 2, 112, 0.6, { gap: 34 }) + badge(W / 2 + 56, 66, 4, 16);
        const kids = [[W * 0.27, 300], [W * 0.73, 300]];
        kids.forEach(([x, y], i) => { s += arrow(W / 2 + (i ? 30 : -30), 176, x + (i ? -18 : 18), y - 92); s += `<g class="sv-pop">${divCell(x, y, 80, { seed: 6 + i })}${setOf(SET, x, y, 0.72, { gap: 30 })}</g>${badge(x + 64, y - 64, 4, 18)}`; });
      } else {
        s += divCell(W * 0.2, H * 0.54, 94, { seed: 4 }) + setOf(DBL, W * 0.2, H * 0.54, 0.8, { gap: 36 }) + badge(W * 0.2 + 74, H * 0.54 - 74, 4, 18);
        [[W * 0.72, H * 0.31], [W * 0.72, H * 0.76]].forEach(([x, y], i) => { s += arrow(W * 0.36, H * 0.54 + (i ? 16 : -16), x - 90, y + (i ? -20 : 20)); s += `<g class="sv-pop">${divCell(x, y, 76, { seed: 6 + i })}${setOf(SET, x, y, 0.66, { gap: 30 })}</g>${badge(x + 62, y - 58, 4, 18)}`; });
      }
      return { svg: cwFrame(st, 'mc', s) };
    }
    s += title('Every cell still has 4');
    const levels = [1, 2, 4, 8];
    if (P) {
      const ys = [70, 140, 214, 300], rs = [30, 28, 26, 24];
      levels.forEach((n, l) => {
        for (let i = 0; i < n; i++) {
          const perRow = n === 8 ? 4 : n, row = n === 8 ? (i >> 2) : 0, c = n === 8 ? i % 4 : i, x = 46 + (W - 54) * ((c + 0.5) / perRow), y = ys[l] + row * 54 - (n === 8 ? 8 : 0), r = rs[l];
          s += divCell(x, y, r, { seed: 3 + i, ring: false }) + setOf(SET, x, y, r / 56, { gap: 28 });
        }
        s += label(20, ys[l] + (n === 8 ? 26 : 7), String(n), { size: 22, display: true });
      });
    } else {
      const xs = [W * 0.09, W * 0.3, W * 0.56, W * 0.86], rs = [46, 42, 36, 26];
      levels.forEach((n, l) => {
        for (let i = 0; i < n; i++) {
          const y = 60 + (H - 90) * ((i + 0.5) / n), x = xs[l], r = rs[l];
          if (l < 3) for (const d of [0, 1]) { const y2 = 60 + (H - 90) * ((i * 2 + d + 0.5) / (n * 2)); s += arrow(x + r + 6, y, xs[l + 1] - rs[l + 1] - 8, y2, { w: 3, h: 7 }); }
          s += divCell(x, y, r, { seed: 3 + i, ring: false }) + setOf(SET, x, y, r / 58, { gap: 28 });
        }
        s += label(xs[l], H - 12, `${n} ${n === 1 ? 'cell' : 'cells'}`, { size: 17, display: true });
      });
    }
    return { svg: cwFrame(st, 'mc', s) };
  }
}
