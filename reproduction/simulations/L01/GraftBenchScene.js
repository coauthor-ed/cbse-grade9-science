// GraftBenchScene - blk-l01-s05. One close view of the book's steps. Beat 0: Plant A rooted, a wild rose; Plant B's stem
// piece. Beat 1: slit in Plant A, scion fitted. Beat 2: join wrapped, other branches cut. Beat 3: yellow flowers above the
// join, Plant A's roots below: a join, not a blend.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgStem, svgRoots, svgRose, svgKnife, svgLeaf, svgPlantColour as pc, label, leader, frame, fill, stroke, pathRoundRect } from '../shared/PlantArt.js';

import { sky, hedge, lightFall } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];

export class GraftBenchScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Grafting. A rooted wild rose, Plant A, and a stem piece of a yellow rose, Plant B. A slit is cut in Plant A and Plant B is fitted in. The join is wrapped and the other branches are cut. Yellow flowers grow above the join.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 340 : 410; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = Math.round(H * 0.84), k = P ? 0.86 : 1.2, thick = 30;
    const ax = W * (step === 0 ? 0.3 : 0.42), jy = gy - 136 * k;      // the join
    let s = sky(W, gy + 10, { warm: 0.2, sun: [W * 0.9, 16] }) + hedge(W, gy * 0.2, gy * 0.9, { seed: 11 }) + lightFall(W, gy, W * 0.1, { a: 0.3 }) + svgSoil(0, gy, 1, { w: W, h: H - gy, seed: 2 });
    s += svgRoots(ax, gy - 4, k * 0.8, { len: 62, grow: 1, seed: 3, n: 11, base: 18 });
    // Plant A: the stem, its side branch and top, cut off from beat 2.
    if (step < 2) {
      s += svgStem(ax, gy, k, { len: 230, nodes: 5, w: thick, leaves: [[0.48, -1, 44], [0.82, 1, 44], [0.96, -1, 40]] });
      s += svgStem(ax, gy - 92 * k, k, { len: 92, nodes: 2, w: 7, rot: 48, leaves: [[0.7, 1, 34], [0.95, -1, 32]] });
      s += svgRose(ax, gy - 238 * k, k * 0.95, { tint: 'wild' });
    } else {
      s += svgStem(ax, gy, k, { len: 164, nodes: 3, w: thick, buds: false });
      s += `<path d="${pathRoundRect(-14, -4, 28, 8, 2)}" transform="translate(${ax} ${gy - 165 * k})" ${fill(pc('tuberLit'), `stroke:${pc('stemDark')};stroke-width:2`)}/>`;
      s += svgStem(ax + 8, gy - 92 * k, k, { len: 30, nodes: 0, w: 9, rot: 48, buds: false });
      if (step === 2) s += svgLeaf(W * 0.74, gy + 2, 0.8, { rot: 80, len: 38, wide: 20, teeth: 6 }) + svgLeaf(W * 0.84, gy + 4, 0.8, { rot: 96, len: 36, wide: 20, teeth: 6 });
    }
    if (step === 0) {
      const bx = W * 0.74, by = H * 0.56;
      s += svgStem(bx, by, k * 1.1, { len: 104, nodes: 2, w: 11, rot: 18, leaves: [[0.9, 1, 34], [0.96, -1, 32]] });
      s += `<path d="M${bx - 5} ${by}L${bx + 2} ${by + 24}L${bx + 7} ${by}Z" ${fill(pc('stem'), `stroke:${pc('stemDark')};stroke-width:2`)}/>`;
      s += svgRose(bx + 66 * k, H * 0.2, k * 0.95, { tint: 'yellow' });
      s += label(ax, 28, 'Plant A: stock', { size: P ? 17 : 21, display: true }) + label(bx, 28, 'Plant B: scion', { size: P ? 17 : 21, display: true });
      s += label(ax + 96, gy + 34, 'Rooted', { size: 15 });
    } else if (step === 1) {
      s += `<path d="M${ax + 1} ${jy - 12}L${ax + 16} ${jy + 8}" ${stroke(pc('stemDark'), 5)}/>`;
      s += svgKnife(W * 0.76, jy + 34, 1, { flip: true, rot: 14 });
      s += `<g class="sv-pop">${svgStem(ax + 8, jy, k * 0.95, { len: 110, nodes: 2, w: 15, rot: 34, leaves: [[0.86, 1, 34], [0.96, -1, 32]] })}</g>`;
      s += label(W * 0.74, jy - 2, 'Slit', { size: 17, display: true }) + leader(W * 0.67, jy - 4, ax + 20, jy);
      s += label(W * 0.5, 28, 'Fit Plant B into the slit', { size: P ? 18 : 22, display: true });
    } else if (step === 2) {
      s += svgStem(ax + 8, jy, k * 0.95, { len: 110, nodes: 2, w: 15, rot: 34, leaves: [[0.86, 1, 34], [0.96, -1, 32]] });
      s += `<g class="sv-pop"><rect x="${ax - 24 * k}" y="${jy - 26 * k}" width="${50 * k}" height="${50 * k}" rx="9" ${fill(pc('cloudShade'), `stroke:${pc('metalDark')};stroke-width:3`)}/><path d="M${ax - 22 * k} ${jy - 8 * k}l${46 * k} -12M${ax - 22 * k} ${jy + 8 * k}l${46 * k} -12M${ax - 22 * k} ${jy + 22 * k}l${46 * k} -12" ${stroke(pc('metalDark'), 2)}/></g>`;
      s += label(W * 0.76, jy - 6, 'Wrapped', { size: 17, display: true }) + leader(W * 0.67, jy - 2, ax + 27 * k, jy);
      s += label(W * 0.76, gy - 104 * k, 'Other branches cut', { size: 16 }) + leader(W * 0.58, gy - 106 * k, ax + 20 * k, gy - 106 * k);
      s += label(W * 0.5, 28, 'Pests kept out', { size: P ? 18 : 22, display: true });
    } else {
      s += `<g class="sv-pop">${svgStem(ax + 6, jy, k, { len: 94, nodes: 2, w: 12, rot: 6, leaves: [[0.4, 1, 40], [0.62, -1, 42], [0.84, 1, 38]] })}`;
      s += svgStem(ax + 4, jy - 34 * k, k, { len: 92, nodes: 2, w: 7, rot: 44, leaves: [[0.6, 1, 34], [0.86, -1, 32]] });
      s += svgRose(ax + 16 * k, jy - 104 * k, k * 1.12, { tint: 'yellow' }) + svgRose(ax + 66 * k, jy - 92 * k, k, { tint: 'yellow' }) + '</g>';
      s += `<ellipse cx="${ax + 2}" cy="${jy + 2}" rx="${15 * k}" ry="${8 * k}" ${fill(pc('tuberDark'))}/>`;
      s += label(W * 0.8, jy - 40, 'Plant B', { size: 19, display: true }) + label(W * 0.8, jy - 18, 'yellow flowers', { size: 15 });
      s += label(W * 0.8, jy + 26, 'Join', { size: 17, display: true }) + leader(W * 0.72, jy + 20, ax + 14, jy + 4);
      s += label(W * 0.78, gy + 32, 'Plant A: roots', { size: P ? 16 : 19, display: true });
    }
    return { svg: frame(st, 'gb', s) };
  }
}
