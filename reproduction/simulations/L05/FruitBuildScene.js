// FruitBuildScene - L05 blk-l05-s05, 4 beats. Beat 0: tomato flower, its ovary grows into a tomato. Beat 1: a tomato cut across, seeds set
// in the flesh. Beat 2: madar and dandelion seeds in a breeze. Beat 3: a seed germinates with water, air and warmth.
import { SvgScene, fill } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK, svgPlantColour as P, stroke } from '../shared/PlantArt.js';
import { frame, leader, phoneMin, tomatoFlower, tomatoFruit, tuft, dandelion, dandelionSeed, seedling, backdrop } from '../shared/FlowerArt.js';

const big = (x, y, t) => words(x, y, t, { size: 22, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 });

export class FruitBuildScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'A tomato flower beside a tomato: the ovary becomes the fruit. A cut tomato shows seeds, which were ovules. Madar and dandelion seeds drift in a breeze. A seed germinates with water, air and warmth.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 450 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, fl = H - 44;
    let a = backdrop(b === 3 ? 'soil' : b === 2 ? 'meadow' : b === 0 ? 'bokeh' : 'kitchen', W, H, { floor: b === 3 ? fl - 40 : fl - 20, seed: 4 });
    if (b === 0) {
      if (port) {
        // Phone: flower above, fruit below, each far larger than a side-by-side pair could be.
        const x = W / 2, y1 = H * 0.27, y2 = H * 0.75;
        a += tomatoFlower(x, y1, 1.2, { ovaryCol: P('leafLit'), coneCol: 'none' });
        a += `<g class="sv-pop">${tomatoFruit(x, y2, 1.04, { r: 70 })}</g>`;
        a += `<path d="M${W - 44} ${y1 + 50}L${W - 44} ${y2 - 66}" ${stroke(ART_INK, 5)}/><path d="M${W - 56} ${y2 - 78}L${W - 44} ${y2 - 66}L${W - 32} ${y2 - 78}" ${stroke(ART_INK, 5)}/>`;
        a += big(50, y1 + 104, 'Ovary') + leader(62, y1 + 86, x - 8, y1 + 8) + big(50, y2 + 104 > H - 10 ? H - 14 : y2 + 104, 'Fruit');
      } else {
        const lx = W * 0.26, rx = W * 0.7, y = H * 0.5;
        a += tomatoFlower(lx, y, 1.42, { ovaryCol: P('leafLit'), coneCol: 'none' });
        a += `<g class="sv-pop">${tomatoFruit(rx, y, 1.44, { r: 70 })}</g>`;
        a += `<path d="M${lx + 108} ${y}L${rx - 124} ${y}" ${stroke(ART_INK, 5)}/><path d="M${rx - 136} ${y - 12}L${rx - 124} ${y}L${rx - 136} ${y + 12}" ${stroke(ART_INK, 5)}/>`;
        a += big(lx, y + 164, 'Ovary') + big(rx, y + 164, 'Fruit') + leader(lx, y + 142, lx, y + 18);
      }
    }
    if (b === 1) {
      const s = port ? 2.1 : 2.3;
      a += tomatoFruit(W / 2, H * 0.46, s, { cut: true, r: 70 });
      a += big(W / 2, H - 14, 'Ovules become seeds');
    }
    if (b === 2) {
      const lx = W * 0.22, rx = port ? W * 0.74 : W * 0.68;
      a += dandelion(rx, fl + 8, port ? 1.5 : 1.9, {});
      a += tuft(lx - 10, fl - 180, port ? 1.1 : 1.3, { rot: 30 }) + tuft(lx + 70, fl - 80, port ? 0.9 : 1.1, { rot: 50 });
      a += dandelionSeed(rx - (port ? 96 : 120), fl - 250, 1.1, { rot: -40 }) + dandelionSeed(rx - (port ? 40 : 34), 66, 1, { rot: -30 });
      a += label(lx + 10, fl + 24, 'Madar seeds', { size: 16 }) + label(rx, fl + 30, 'Dandelion', { size: 16 });
      for (const y of [60, 130, 216]) a += `<path d="M${W * 0.02} ${y}c30 -12 60 12 92 0" ${stroke(P('skyDay'), 4)}/>`;
    }
    if (b === 3) {
      a += `<rect x="-4" y="${fl - 40}" width="${W + 8}" height="${H}" ${fill(P('soil'))}/>`;
      const x = W / 2, s = port ? 2 : 2.2;
      a += seedling(x, fl - 40, s, { grow: 1 });
      const chip = (cx, y, t) => `<g class="sv-pop"><rect x="${cx - 62}" y="${y - 24}" width="124" height="44" rx="22" style="fill:var(--sim-bg-surface);stroke:${ART_INK};stroke-width:3"/>${words(cx, y + 5, t, { size: 18, ink: 'var(--sim-label)' })}</g>`;
      a += chip(port ? 74 : W * 0.16, port ? 92 : 62, 'Water') + chip(port ? W - 74 : W * 0.84, port ? 92 : 62, 'Air') + chip(W / 2, 38, 'Temperature');
    }
    return { svg: frame(st, 'fb', a) };
  }
}
