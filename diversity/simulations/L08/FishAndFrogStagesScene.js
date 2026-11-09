// FishAndFrogStagesScene - L08 blk-l08-s04, 3 beats. Beat 0: a fish with the gill cover lifted, water going in at the
// mouth and over the gills, the fins named by what they do. Beat 1: a pond with a bank, the frog's four stages in place;
// a chip lights one stage. Beat 2: the same pond, with the stages parted into a water half and a land-and-water half.
import { BioStage, beats, pill, flow, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { seaSetting, tag, flowArrow } from '../L06/BodyKit.js';
import { fishBig, frogBig, tadpole, spawn, mx } from './VertArt.js';

const CHIPS = [
  { id: 'eggs', label: 'Eggs', targets: ['eggs'] }, { id: 'tadpole', label: 'Tadpole', targets: ['tadpole'] },
  { id: 'young', label: 'Young frog', targets: ['young'] }, { id: 'adult', label: 'Adult', targets: ['adult'] },
];

export class FishAndFrogStagesScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A fish with its fins and gills named. Then the life of a frog in a pond: eggs in water, a tadpole with gills, a young frog with legs and a short tail, and an adult with lungs and moist skin on the bank.';
  heights = [[340, 370], [490, 350], [490, 350]];
  tl = tapLight({ label: 'Stages of a frog', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this._row(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  enter() { this.tl?.reset?.(); this._row(); }
  _row() { const r = this.root?.querySelector?.('.tl-row'); if (r) { r.style.display = this.stepIndex === 1 ? '' : 'none'; this.relayout?.(); } }

  _fish(st) {
    const { W, H, portrait: P } = st, fy = H - 30, s = P ? 0.84 : 1.12, x = W / 2 - (P ? 6 : 10), y = H * 0.48;
    let g = seaSetting(st, fy) + fishBig(x, y, s, { gills: true });
    const mouth = x + 158 * s, gx = x + 80 * s;
    g += flow(`M${W - 6} ${y - 4}L${mouth + 4} ${y + 2}`, lc('white'), 6, true);
    g += flow(`M${mouth} ${y + 4}Q${x + 130 * s} ${y + 8} ${gx + 18} ${y + 10}`, lc('white'), 5, true);
    g += tag(gx + (P ? 34 : 50), 32, gx, y - 22 * s, P ? 'Gills: oxygen' : 'Gills take in oxygen', { size: 16 });
    g += tag(P ? 84 : 130, 34, x - 16 * s, y - 92 * s, P ? 'Fins: move, steer' : 'Fins move and steer', { size: 16 });
    g += tag(P ? 86 : 110, H - (P ? 26 : 34), x - 160 * s, y + 34 * s, 'Tail fin', { size: 16 });
    return g;
  }
  _pond(st, step) {
    const { W, H, portrait: P } = st, sea = P ? 176 : 146;
    const on = (t) => (step === 1 && this.tl.off(t) ? 'opacity:0.26' : '');
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>`;
    g += `<rect y="${sea}" width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.3))}/><rect y="${sea + (H - sea) * 0.6}" width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.1))}/>`;
    g += `<rect y="${sea - 3}" width="${W}" height="6" ${fill(lc('white'), 'opacity:0.7')}/>`;
    const bx = P ? 150 : W * 0.56;
    g += `<path d="M${W} ${sea - 66}H${bx + 70}Q${bx + 10} ${sea - 58} ${bx - 10} ${sea + 6}Q${bx - 2} ${sea + 34} ${bx + 80} ${sea + 56}Q${W - 60} ${sea + 70} ${W} ${sea + 62}Z" ${fill(lc('soil'), `stroke:${mx(lc('soil'), INK, 0.4)};stroke-width:4`)}/>`;
    g += `<path d="M${W} ${sea - 66}H${bx + 70}Q${bx + 34} ${sea - 62} ${bx + 18} ${sea - 40}" style="fill:none;stroke:${lc('grass')};stroke-width:10;stroke-linecap:round"/>`;
    g += `<path d="M0 ${H}V${H - 20}Q${W * 0.3} ${H - 34} ${W * 0.6} ${H - 18}T${W} ${H - 26}V${H}Z" ${fill(lc('soilDark'))}/>`;
    const PT = P ? { eggs: [72, H - 80], tad: [W - 94, H - 92], young: [104, sea + 74], adult: [W - 86, sea - 64] }
      : { eggs: [W * 0.14, H - 76], tad: [W * 0.62, H - 66], young: [W * 0.4, sea + 56], adult: [W * 0.84, sea - 64] };
    g += `<g style="${on('eggs')}">${spawn(PT.eggs[0], PT.eggs[1], 0.72)}</g>`;
    g += `<g style="${on('tadpole')}">${tadpole(PT.tad[0], PT.tad[1], 0.92, { tufts: true })}</g>`;
    g += `<g style="${on('young')}">${tadpole(PT.young[0], PT.young[1], 0.92, { legs: 2 })}</g>`;
    g += `<g style="${on('adult')}">${frogBig(PT.adult[0], PT.adult[1], P ? 0.5 : 0.56, { wet: true })}</g>`;
    if (step === 1) {
      const a = (x, y) => [x, y];
      const arrow = P
        ? flowArrow(a(126, H - 88), a(170, H - 56), a(214, H - 86), INK, 4) + flowArrow(a(W - 96, H - 136), a(W * 0.56, H - 190), a(136, sea + 92), INK, 4) + flowArrow(a(116, sea + 36), a(140, sea - 20), a(W - 152, sea - 84), INK, 4)
        : flowArrow(a(W * 0.14 + 58, H - 66), a(W * 0.36, H - 28), a(W * 0.62 - 66, H - 62), INK, 4) + flowArrow(a(W * 0.62 + 10, H - 100), a(W * 0.62, sea + 48), a(W * 0.4 + 62, sea + 52), INK, 4) + flowArrow(a(W * 0.4, sea + 24), a(W * 0.42, sea - 50), a(W * 0.84 - 66, sea - 92), INK, 4);
      g += `<g style="${this.tl.any() ? 'opacity:0.3' : ''}">${arrow}</g>`;
      g += `<g style="${on('eggs')}">${pill(PT.eggs[0], PT.eggs[1] + (P ? 58 : 50), 'Eggs in water', { size: 15 })}</g>`;
      g += `<g style="${on('tadpole')}">${pill(PT.tad[0] - (P ? 8 : 0), PT.tad[1] + (P ? 56 : 44), 'Tadpole: gills', { size: 15 })}</g>`;
      g += `<g style="${on('young')}">${pill(PT.young[0] + (P ? 8 : 0), PT.young[1] + (P ? 54 : 46), 'Legs grow, tail goes', { size: 15 })}</g>`;
      g += `<g style="${on('adult')}">${pill(P ? 96 : W * 0.4, P ? 44 : 40, 'Lungs, moist skin', { size: 15 })}</g>`;
    } else {
      g += pill(P ? W * 0.68 : W * 0.8, P ? sea + 100 : sea + 96, 'Young: water, gills', { size: 15, on: true });
      g += pill(P ? 110 : W * 0.34, P ? 30 : 34, 'Adult: land and water', { size: 15, on: true });
      g += pill(P ? 100 : W * 0.34, P ? 72 : 74, 'Lungs, moist skin', { size: 15, on: true });
    }
    return g;
  }
  draw(st, step) { return step === 0 ? this._fish(st) : this._pond(st, step); }
}
