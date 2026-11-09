// WhorlChartScene-name - L04 blk-l04-s07, 2 beats. Beat 0: inside a closed pea flower the anthers touch the stigma, a tiny trip. Beat 1:
// a flower with only a pistil and a flower with only stamens stand apart; a dotted path with a question chip: what carries the pollen?
import { SvgScene, fill } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK } from '../shared/PlantArt.js';
import { frame, phoneMin, backdrop, peaCloseUp, flowerSection, pollenGrain } from '../shared/FlowerArt.js';

const hide = (no) => (n) => (no.includes(n) ? 'display:none' : '');
export class WhorlChartSceneName extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'Inside a closed pea flower the anthers sit next to the stigma. Then two flowers stand apart: one with only a pistil, one with only stamens, and a dotted path between them with a question mark.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 450 : 400; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex;
    let a = backdrop('meadow', W, H, { floor: H - 50, seed: 7 });
    if (b === 0) {
      const by = H - 92, s = port ? 1.34 : 1.42;
      a += peaCloseUp(W / 2, by, s, { stamens: true, grains: 8, outline: 'bud' });
      a += label(W / 2, 30, 'Inside a closed pea flower', { size: 17 });
      a += label(W / 2 + 92, by - 150 * s + 12, 'A tiny trip', { size: 16, anchor: 'start' }).replace('x="', 'x="').replace(/x="[\d.]+"/, `x="${port ? W - 92 : W / 2 + 104}"`);
    } else {
      const s = port ? 0.54 : 0.8, by = H - (port ? 96 : 96), l = port ? 88 : 150, r = W - l;
      a += flowerSection(l, by, s, { part: hide(['stamen']) });
      a += flowerSection(r, by, s, { part: hide(['pistil', 'ovary', 'ovule']) });
      const ax = r - 84 * s, ay = by - 104 * s, tx = l, ty = by - 214 * s, my = Math.min(ay, ty) - (port ? 40 : 34);
      a += `<path d="M${ax} ${ay}C${ax - 30} ${my} ${tx + 80} ${my} ${tx + 8} ${ty - 12}" style="fill:none;stroke:${ART_INK};stroke-width:4;stroke-dasharray:3 11;stroke-linecap:round"/>`;
      a += pollenGrain(ax, ay - 8, 0.8, {});
      a += `<circle cx="${W / 2}" cy="${my + 10}" r="26" ${fill('var(--sim-bg-surface)', `stroke:${ART_INK};stroke-width:3`)}/>` + words(W / 2, my + 22, '?', { size: 34, display: true, ink: 'var(--sim-label)' });
      a += label(l, H - 24, 'Pistil, no stamens', { size: 15 }) + label(r, H - 24, 'Stamens, no pistil', { size: 15 });
    }
    return { svg: frame(st, 'wn', a) };
  }
}
