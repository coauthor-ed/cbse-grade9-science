// AdaptationReadScene - L05 blk-l05-a02, 3 beats. Beat 0: tomato flower, stamens around the stigma. Beat 1: wheat ear and one floret shut
// with pollen already on its stigma. Beat 2: two papaya trees, male and female flowers on different trees, an arc between.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK } from '../shared/PlantArt.js';
import { frame, leader, phoneMin, tomatoFlower, tomatoLeaf, wheatEar, papayaTree, backdrop, pollenGrain, wheatFloret } from '../shared/FlowerArt.js';

const say = (W, H, t) => words(W / 2, 36, t, { size: 24, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 7 });

export class AdaptationReadScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'A tomato flower with stamens covering the stigma, likely self-pollinated. A wheat ear with a closed flower, pollinated before it opens. Two papaya trees, one with male and one with female flowers, likely cross-pollinated.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 450 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, fl = H - 40;
    let a = backdrop(b === 1 ? 'gold' : b === 2 ? 'orchard' : 'bokeh', W, H, { floor: fl, seed: 9 });
    if (b === 0) {
      const s = port ? 1.5 : 1.86, x = W / 2, y = H - (port ? 170 : 160);
      a += tomatoLeaf(port ? 6 : 30, H - (port ? 96 : 70), port ? 1.1 : 1.5, { rot: -14 }) + tomatoFlower(x, y, s, {}) + say(W, H, 'Tomato');
      a += leader(port ? W - 88 : x + 150, port ? 96 : 96, x + 6, y - 110) + label(W - 14, 88, port ? 'Stamens cover' : 'Stamens cover the stigma', { size: 15, anchor: 'end' });
      a += label(W / 2, H - 12, 'Probably self-pollinated', { size: 17 });
    }
    if (b === 1) {
      const lx = port ? W * 0.2 : W * 0.24, s = port ? 1.5 : 1.86;
      a += wheatEar(lx, fl + 8, s, {}) + say(W, H, 'Wheat');
      const cx = port ? W * 0.66 : W * 0.68, by = fl - 50, cs = port ? 1.08 : 1.34;
      a += wheatFloret(cx, by, cs, { grains: 8 });
      a += label(cx, H - 12, 'Mostly self-pollinated', { size: 17 });
      a += label(cx, 74, 'A flower, still shut', { size: 15 });
    }
    if (b === 2) {
      const s = port ? 0.68 : 0.92, l = W * 0.245, r = W * 0.755, y = fl + 8, up = port ? 170 : 0;
      a += papayaTree(l, y, s, { flowers: 'male', extra: up }) + papayaTree(r, y, s, { fruit: true, flowers: 'female', extra: up }) + say(W, H, 'Papaya');
      a += label(l, H - 12, 'Male flowers', { size: 16 }) + label(r, H - 12, 'Female flowers', { size: 16 });
      const yy = y - (150 + up) * s;
      a += `<path class="sv-draw" style="--len:800;fill:none;stroke:${ART_INK};stroke-width:4;stroke-dasharray:4 11;stroke-linecap:round" d="M${l + 34 * s} ${yy + 14}C${W * 0.42} ${yy + 60} ${W * 0.58} ${yy + 60} ${r - 14 * s} ${yy + 14}"/>` + pollenGrain(W / 2, yy + 46, 0.8, {});
      a += label(W / 2, y - 30, 'Needs cross-pollination', { size: 16 });
    }
    return { svg: frame(st, 'ar', a) };
  }
}
