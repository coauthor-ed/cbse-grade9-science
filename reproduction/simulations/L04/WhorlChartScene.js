// WhorlChartScene - L04 blk-l04-s04, 4 beats. Four flowers above a record table, as a learner keeps it. Beat 0: column A only, as the
// book prints it. Beat 1: B, C, D, marked as made-up examples. Beat 2: D's joined sepals and petals. Beat 3: the job of each part.
import { SvgScene, fill } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK, ART_PALE, svgPlantColour as P, blend as B } from '../shared/PlantArt.js';
import { frame, phoneMin, flowerSection, fusedFlower, backdrop } from '../shared/FlowerArt.js';

const ROWS = ['Sepal', 'Petal', 'Stamen', 'Pistil'];
const JOB = ['protects the bud', 'attracts visitors', 'makes pollen', 'receives pollen, holds ovules'];
const COLS = { A: [1, 1, 0, 1], B: [1, 1, 1, 1], C: [1, 1, 1, 0], D: [1, 1, 0, 1] };
const hide = (no) => (n) => (no.includes(n) ? 'display:none' : '');

export class WhorlChartScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'Four flowers above a table with rows sepal, petal, stamen, pistil. Flower A has no stamens. Made-up flowers B, C and D differ: B has all four parts, C has no pistil, and D has joined sepals and petals. Then the job of each part is shown.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 440 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex;
    const top = port ? 128 : 124, m = 12, pw = W - 2 * m, name = port ? 74 : 110, cw = (pw - name) / 4;
    const fs = port ? 0.21 : 0.3, fy = top - (port ? 28 : 30);
    let a = backdrop('desk', W, H, { floor: H - 12, seed: 3 });
        const cx = (i) => m + name + cw * (i + 0.5);
    const showCol = (i) => i === 0 || b >= 1;
    ['A', 'B', 'C', 'D'].forEach((k, i) => {
      const al = showCol(i) ? (b === 2 && i !== 3 ? 0.35 : 1) : 0.28;
      const fx = b === 3 ? W * (i + 0.5) / 4 : cx(i);
      if (k === 'D') a += fusedFlower(fx, fy, fs, { alpha: al });
      else a += flowerSection(fx, fy, fs, { alpha: al, part: hide(k === 'A' ? ['stamen'] : k === 'C' ? ['pistil', 'ovary', 'ovule'] : []) });
    });
    const ty = top, th = H - ty - 10, rh = th / 5;
    const rim = (x, y, w, h, col, r = 12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" style="fill:${col};stroke:${ART_INK};stroke-width:3"/>`;
    a += rim(m, ty, pw, th, 'var(--sim-bg-surface)');
    const lab = (x, y, t, o = {}) => words(x, y, t, { ink: 'var(--sim-label)', ...o });
    if (b < 3) {
      ['A', 'B', 'C', 'D'].forEach((k, i) => { a += lab(cx(i), ty + rh * 0.68, k, { display: true, size: 22 }); });
      if (b >= 1) a += lab(m + name + cw * 2.5, ty + rh + 0, '', {});
      ROWS.forEach((r, j) => {
        const y = ty + rh * (j + 1);
        a += `<path d="M${m} ${y}H${m + pw}" style="stroke:var(--sim-stroke);stroke-width:2;fill:none"/>`;
        a += lab(m + 12, y + rh * 0.66, r, { anchor: 'start', size: port ? 15 : 17 });
        ['A', 'B', 'C', 'D'].forEach((k, i) => {
          if (!showCol(i)) return;
          const yes = COLS[k][j], dim = b === 2 && !(i === 3 && j < 2);
          a += `<g style="opacity:${dim ? 0.35 : 1}">` + (yes
            ? `<rect x="${cx(i) - 25}" y="${y + rh / 2 - 15}" width="50" height="30" rx="15" ${fill('var(--sim-series-3)')}/>` + words(cx(i), y + rh / 2 + 6, 'Yes', { ink: ART_PALE, size: 16 })
            : `<rect x="${cx(i) - 25}" y="${y + rh / 2 - 15}" width="50" height="30" rx="15" style="fill:none;stroke:var(--sim-series-4);stroke-width:3"/>` + lab(cx(i), y + rh / 2 + 6, 'No', { size: 16 })) + '</g>';
        });
        if (b === 2 && j < 2) a += '';
      });
    } else {
      a += lab(m + 14, ty + rh * 0.68, 'Part', { anchor: 'start', display: true, size: 19 }) + lab(m + name + 24, ty + rh * 0.68, 'Guess its job', { anchor: 'start', display: true, size: 19 });
      ROWS.forEach((r, j) => {
        const y = ty + rh * (j + 1);
        a += `<path d="M${m} ${y}H${m + pw}" style="stroke:var(--sim-stroke);stroke-width:2;fill:none"/>`;
        a += lab(m + 14, y + rh * 0.66, r, { anchor: 'start', size: port ? 15 : 17 }) + lab(m + name + 24, y + rh * 0.66, JOB[j], { anchor: 'start', size: port ? 14 : 17, weight: 700 });
      });
    }
    const over = [];
    if (b === 1) a += label(m + name + cw * 2.5, 24, 'Made-up examples', { size: 15 });
    if (b === 2) a += label(cx(3) - (port ? 44 : 60), 24, 'Sepals and petals joined', { size: 15, anchor: 'end' }) ;
    return { svg: frame(st, 'wc', a) };
  }
}
