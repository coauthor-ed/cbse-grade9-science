// EcologicalDependencyScene - L11 blk-l11-s03, 5 beats. One forest, the hero of the lesson. Each beat lights one set of
// links and dims the rest. 0: cavity and hornbill. 1: the tree, food and oxygen. 2: bee at the flowers, hornbill and
// the seed it carries, a seedling. 3: fallen leaves, fungi, bacteria, nutrients back to the roots. 4: tap one of the four
// pressures to see what it touches. Sizes are not to scale. Controls: tap-light Deforestation, Pollution, Overuse, Climate change.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke, mountEl } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { fitBio } from '../shared/BioArt.js';
import { tag, flowArrow } from '../L06/BodyKit.js';
import { oldTree, stump, hornbill, bee, seedling, leafFall, fruitAt, mx, INK } from './ForestArt.js';

const CHIPS = [['Deforestation', 'cut'], ['Pollution', 'dirt'], ['Overuse', 'use'], ['Climate change', 'heat']].map(([label, t]) => ({ id: t, label, targets: [t] }));
const gy0 = (H) => H - 76;
const LIT = [['nest'], ['tree'], ['bee', 'seed'], ['soil'], ['nest', 'tree', 'bee', 'seed', 'soil']];

export class EcologicalDependencyScene extends BioStage {
  static BEAT_STEP_MAP = beats(5);
  static ARIA_LABEL = 'A forest: a big old tree with a nest cavity and a hornbill, a bee at its flowers, a seedling grown from a dropped seed, and fallen leaves, fungi and bacteria over the roots. Each beat lights one link. Then four pressures can be tapped: deforestation, pollution, overuse and climate change.';
  heights = [[440, 430], [440, 430], [440, 430], [440, 430], [440, 360]];
  tl = tapLight({ label: 'Four pressures', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this._h = mountEl(this.root, 'ed-tl'); this.tl.mount(this._h, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { if (this._h) this._h.style.display = step === 4 ? '' : 'none'; this.tl.reset(); }
  destroy() { this.tl.destroy(); super.destroy(); }

  draw(st, step) {
    const { W, H, portrait: P } = st, gy = H - (P ? 84 : 76), s = P ? 0.82 : (gy0(H) - 6) / 370, tx = W * (P ? 0.5 : 0.46);
    const on = (k) => LIT[step].includes(k), op = (k) => (on(k) ? '' : 'opacity:0.3');
    const T = (t) => step === 4 && this.tl.has(t);
    const heat = T('heat'), dirt = T('dirt'), cut = T('cut'), use = T('use');
    const sky = heat ? mx(lc('yellow'), lc('white'), 0.5) : mx(lc('skyDay'), lc('white'), 0.3);
    let g = `<rect width="${W}" height="${H}" ${fill(sky)}/>`;
    const soil = heat ? mx(lc('sand'), lc('soil'), 0.5) : lc('soil');
    g += `<g style="${step === 3 || step === 4 ? '' : 'opacity:0.8'}"><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(soil)}/><path d="M-4 ${gy}C${W * 0.3} ${gy - 8} ${W * 0.6} ${gy + 8} ${W + 4} ${gy - 2}" ${stroke(mx(lc('leaf'), lc('soil'), 0.2), 9)}/></g>`;
    // roots in the soil
    const roots = `<path d="M${tx - 20} ${gy + 4}Q${tx - 66} ${gy + 26} ${tx - 136} ${gy + 34}M${tx - 6} ${gy + 6}Q${tx - 22} ${gy + 44} ${tx - 54} ${gy + 66}M${tx + 12} ${gy + 6}Q${tx + 26} ${gy + 42} ${tx + 66} ${gy + 62}M${tx + 26} ${gy + 4}Q${tx + 70} ${gy + 24} ${tx + 130} ${gy + 30}" ${stroke(lc('barkDark'), 8, 'stroke-linecap:round')}/>`;
    g += `<g style="${op('soil')}">${roots}</g>`;
    if (heat) for (let i = 0; i < 6; i++) g += `<path d="M${W * (0.08 + i * 0.17)} ${gy + 20}l10 14l-8 12l12 16" ${stroke(mx(lc('soilDark'), INK, 0.3), 3, 'stroke-linecap:round')}/>`;
    // the tree
    g += `<g style="${op('tree')}">${oldTree(tx, gy + 6, s, { cavity: true, fruit: !use, flowers: !heat })}</g>`;
    // sun and arrows on the tree beat
    if (step === 1) {
      const a = P ? W - 44 : W - 64, b = 46;
      g += `<circle cx="${a}" cy="${b}" r="26" ${fill(mx(lc('yellow'), lc('white'), 0.4), `stroke:${lc('yellow')};stroke-width:4`)}/>`;
      g += flowArrow([a - 24, b + 22], [a - 54, b + 40], [tx + 150 * s * (P ? 0.72 : 1), b + 64], mx(lc('yellow'), lc('red'), 0.4), 6);
      g += pill(P ? 66 : 96, 40, 'Food', { size: 16, on: true }) + pill(P ? 72 : 100, 80, 'Oxygen', { size: 16, on: true });
    }
    // cavity and bird
    const bx = tx + 96 * s, by = gy - 96 * s;
    g += `<g style="${on('nest') || on('seed') ? '' : 'opacity:0.3'}"><path d="M${tx + 30 * s} ${by + 14}L${tx + 152 * s} ${by + 4}" ${stroke(lc('barkDark'), 11, 'stroke-linecap:round')}/>${hornbill(bx + 12, by, s * 0.54, { fruit: step === 2 })}</g>`;
    if (step === 0) g += tag(P ? 56 : W * 0.16, gy - 126 * s, tx - 8 * s, gy - 132 * s, 'Nest cavity', { size: 16 }) + tag(P ? W - 62 : W - 90, gy - 34, bx + 8, by - 26 * s, 'Hornbill', { size: 16 });
    // bee
    const fx = tx + 124 * s, fy = gy - 262 * s;
    if (step === 2) g += `<g class="bs-drift" style="--dx:-8px;--dy:5px">${bee(fx + 22, fy - 28, 0.74)}</g>` + tag(P ? W * 0.56 : W * 0.56, 30, fx - 2, fy, 'Pollen', { size: 16 });
    // the seed and seedling at the side
    const sx = P ? W * 0.13 : W * 0.1;
    g += `<g style="${op('seed')}">${seedling(sx, gy + 4, P ? 0.72 : 0.9)}</g>`;
    if (step === 2) {
      g += `<path d="M${bx + 60 * s} ${by - 34}C${tx - 30} ${gy - 74} ${sx + 70} ${gy - 80} ${sx + 6} ${gy - 54}" ${stroke(INK, 3.5, 'stroke-dasharray:3 10;stroke-linecap:round')}/>` + pill(sx + (P ? 34 : 36), gy - 82, 'Seed', { size: 15, on: true });
    }
    // floor: leaves, fungi
    const mx1 = P ? W * 0.84 : W * 0.82;
    g += `<g style="${op('soil')}">` + leafFall(mx1 - 74, gy + 2, 10) + leafFall(mx1 + 40, gy + 4, -14) + leafFall(tx - 110, gy + 2, -8) + leafFall(mx1 - 30, gy + 8, 6, lc('autumnDark'));
    g += fitBio('Mushroom', mx1 - 44, gy - 54, 42, 60) + fitBio('Mushroom', mx1 - 2, gy - 38, 30, 44) + '</g>';
    if (step === 3) {
      g += flowArrow([mx1 - 40, gy + 26], [tx + 120, gy + 62], [tx + 60, gy + 52], lc('yellow'), 6);
      g += fitBio('Bacterium', mx1 - 34, gy + 30, 110, 30);
      g += tag(mx1 + (P ? -6 : 0), gy - 96, mx1 - 22, gy - 50, 'Fungi', { size: 16 }) + pill(P ? 104 : W * 0.2, H - 24, 'Nutrients to the roots', { size: 15, on: true });
    }
    // pressures
    if (cut) { g += stump(W * 0.1, gy + 10, 0.86) + stump(W * 0.84, gy + 10, 0.8) + pill(W / 2, 28, 'Habitat and old trees go', { size: 16, on: true }); }
    if (dirt) {
      g += `<path d="M-4 ${gy + 4}C${W * 0.2} ${gy + 44} ${W * 0.4} ${gy + 10} ${W * 0.6} ${gy + 50}S${W * 0.9} ${gy + 24} ${W + 4} ${gy + 40}V${H}H-4Z" ${fill(mx(INK, lc('soil'), 0.3), 'opacity:0.72')}/>`;
      for (let i = 0; i < 7; i++) g += `<circle cx="${W * (0.08 + i * 0.14)}" cy="${gy + 30 + (i % 3) * 14}" r="6" ${fill(mx(INK, lc('leaf'), 0.3))}/>`;
      g += pill(W / 2, 28, 'Harmful substances in soil and water', { size: 15, on: true });
    }
    if (use) {
      const bx2 = W * 0.13, by2 = gy + 2;
      g += `<path d="M${bx2 - 46} ${by2 - 44}H${bx2 + 46}L${bx2 + 34} ${by2}H${bx2 - 34}Z" ${fill(lc('barkLit'), `stroke:${lc('barkDark')};stroke-width:3.5`)}/>`;
      for (const [a, b] of [[-26, -52], [0, -56], [26, -52], [-13, -66], [13, -66]]) g += fruitAt(bx2 + a, by2 + b, 11);
      g += pill(W / 2, 28, 'More taken than can grow back', { size: 15, on: true });
    }
    if (heat) {
      g += `<circle cx="${W - 60}" cy="52" r="34" ${fill(mx(lc('yellow'), lc('white'), 0.4), `stroke:${lc('yellow')};stroke-width:4`)}/>`;
      g += pill(W / 2 - (P ? 34 : 0), 28, 'Heat and rain shift', { size: 15, on: true });
    }
    return g;
  }
}
