// DiscoveryFossilEvidenceScene - L10 blk-l10-s03, 4 beats. Beat 0: the frog in its soil over old rock that holds a frog
// fossil. Beat 1: a slab with three kinds of fossil. Beat 2: a made-up stack of four layers; tap a layer or a button
// to dig: the layer lights and its fossil shows. Older layers hold simpler forms. Beat 3: fossils of the three kinds
// the book names for India, the plant one largest. Controls: dig (Newest, Older, Older still, Oldest).
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { tag } from '../L06/BodyKit.js';
import { purpleFrog, rockBands, fossilLeaf, fossilFrond, fossilShell, fossilFish, fossilFrog, fossilMat, fossilSkull, fossilHuman, dinoBone, mx, INK } from './EarthArt.js';

const LAYERS = [
  { label: 'Newest', name: 'Mammal skull', art: fossilSkull, k: 1.1 },
  { label: 'Older', name: 'Fish', art: fossilFish, k: 1.04 },
  { label: 'Older still', name: 'Shell', art: fossilShell, k: 1.16 },
  { label: 'Oldest', name: 'Mats of tiny cells', art: fossilMat, k: 1.14 },
];

export class DiscoveryFossilEvidenceScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'A purple frog in wet soil above old rock that holds a frog fossil. A slab with leaf, fish and shell fossils. A made-up stack of four rock layers, newest at the top, with simpler fossils lower down. Fossils of a dinosaur bone, an early human skull and an ancient plant.';
  heights = [[420, 430], [370, 420], [370, 360], [420, 430]];
  _dig = 0;

  ctls() { return [{ kind: 'seg', id: 'dig', label: 'Layer', value: 0, options: LAYERS.map((l, i) => ({ value: i, label: l.label })) }]; }
  onCtl(id, v) { if (v == null) return; this._dig = v; this.repaint(); }
  enter(step) { this._dig = 0; this.ctl?.set('dig', 0); this.ctl?.show('dig', step === 2); }

  _b0(st) {
    const { W, H, portrait: P } = st, gy = P ? 80 : 74, soilH = P ? 150 : 158;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('water'), lc('white'), 0.56))}/>`;
    for (let i = 0; i < 16; i++) { const x = 14 + (i * 83) % W, y = 8 + (i * 37) % (gy - 22); g += `<path d="M${x} ${y}l-5 13" ${stroke(lc('waterDeep'), 3, 'stroke-linecap:round;opacity:0.5')}/>`; }
    const R = rockBands(W, gy + soilH, H - gy - soilH, 2, { roles: ['strata3', 'strata5'], pale: 0.14 });
    g += `<path d="M-4 ${gy}C${W * 0.3} ${gy - 16} ${W * 0.6} ${gy + 10} ${W + 4} ${gy - 6}V${gy + soilH + 10}H-4Z" ${fill(lc('soil'))}/>`;
    g += `<path d="M-4 ${gy}C${W * 0.3} ${gy - 16} ${W * 0.6} ${gy + 10} ${W + 4} ${gy - 6}" ${stroke(mx(lc('soil'), INK, 0.5), 4)}/>`;
    g += R.svg;
    const fx = P ? W * 0.3 : W * 0.3, fy = gy + soilH - (P ? 24 : 26), s = P ? 0.72 : 0.92;
    g += `<ellipse cx="${fx + 12}" cy="${fy - 52 * s}" rx="${176 * s}" ry="${82 * s}" ${fill(mx(lc('soil'), INK, 0.42))}/>`;
    g += purpleFrog(fx + (P ? 0 : 0), fy, s);
    const [t2] = R.band(1), fsx = P ? W * 0.76 : W * 0.74, fsy = (H + gy + soilH) / 2 + 8;
    g += fossilFrog(fsx, fsy - 8, P ? 0.5 : 0.56);
    g += tag(P ? W - 80 : W - 128, gy + 36, fx - 10 * s, fy - 116 * s, '2003: described', { size: 16 });
    g += tag(P ? 108 : 150, H - 28, fsx - (P ? 60 : 66), fsy + 26, 'Fossils of an old family', { size: 16 });
    g += pill(P ? W - 82 : 90, P ? 28 : 28, 'Monsoon rain', { size: 15 });
    return g;
  }
  _b1(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('soil'), 0.5))}/>`;
    for (let i = 0; i < 9; i++) g += `<path d="M${(i * 137) % W} ${16 + (i * 71) % (H - 30)}h${30 + (i % 3) * 22}" ${stroke(mx(lc('soil'), INK, 0.3), 3, 'stroke-linecap:round;opacity:0.4')}/>`;
    const items = P ? [[fossilLeaf, W * 0.28, 112, 0.9, 'Leaf', W * 0.28, 216], [fossilShell, W * 0.73, 96, 0.92, 'Shell', W * 0.73, 170], [fossilFish, W * 0.5, 262, 1.06, 'Fish', W * 0.5, 326]]
      : [[fossilLeaf, W * 0.17, 180, 1.26, 'Leaf', W * 0.17, 330], [fossilFish, W * 0.56, 118, 1.34, 'Fish', W * 0.56, 188], [fossilShell, W * 0.72, 290, 1, 'Shell', W * 0.72, 374]];
    for (const [f, x, y, s, name, lx, ly] of items) g += f(x, y, s) + pill(lx, ly, name, { size: 16 });
    return g;
  }
  _b2(st) {
    const { W, H, portrait: P } = st, top = 14, lw = P ? W : W * 0.58, n = LAYERS.length, dug = this._dig;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.66))}/>`;
    const R = rockBands(lw, top, H - top, n, { roles: ['strata1', 'strata2', 'strata3', 'strata5'], dim: (i) => i !== dug, pale: 0.1 });
    g += `<g>${R.svg}</g>`;
    LAYERS.forEach((l, i) => {
      const [a, b] = R.band(i), cy = (a + b) / 2, on = i === dug, s = (P ? 0.5 : 0.56) * l.k;
      g += `<g style="${on ? '' : 'opacity:0.42'}">${l.art(P ? W * 0.74 : lw * 0.68, cy, s)}</g>`;
      g += pill(P ? 74 : 74, P && on ? cy - 18 : cy, l.label, { size: 15, on });
      if (P && on) g += pill(92, cy + 20, l.name, { size: 14, on: true });
      g += `<rect x="0" y="${a}" width="${lw}" height="${b - a}" data-layer="${i}" style="fill:transparent;cursor:pointer"/>`;
    });
    if (!P) {
      const l = LAYERS[dug], px = lw + 16, pw = W - px - 16, [a, b] = R.band(dug), cy = (a + b) / 2;
      g += `<path d="M${lw - 2} ${cy}L${px + 2} ${H / 2}" ${stroke(INK, 3, 'stroke-dasharray:3 8;stroke-linecap:round')}/>`;
      g += `<rect x="${px}" y="${H / 2 - 120}" width="${pw}" height="240" rx="18" ${fill(lc('soil'), `stroke:${INK};stroke-width:3`)}/>`;
      g += `<g class="bs-pop">${l.art(px + pw / 2, H / 2 - 18, Math.min(pw / 300, 0.8) * l.k)}</g>`;
      g += pill(px + pw / 2, H / 2 + 92, l.name, { size: 16, on: true });
    }
    return g;
  }
  _b3(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.5))}/>`;
    const slab = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" ${fill(lc('soil'), `stroke:${INK};stroke-width:3.5`)}/>`;
    if (P) {
      g += slab(12, 12, W - 24, 208) + fossilFrond(W / 2, 112, 0.86) + pill(W / 2, 200, 'Ancient plant', { size: 16, on: true });
      const w = (W - 34) / 2;
      g += slab(12, 232, w, 174) + dinoBone(12 + w / 2, 300, 0.48) + pill(12 + w / 2, 382, 'Dinosaur bone', { size: 14 });
      g += slab(22 + w, 232, w, 174) + fossilHuman(22 + w * 1.5, 298, 0.74) + pill(22 + w * 1.5, 382, 'Early human', { size: 14 });
    } else {
      g += slab(14, 14, W * 0.52, H - 28) + fossilFrond(14 + W * 0.26, H / 2 - 22, 1.56) + pill(14 + W * 0.26, H - 44, 'Ancient plant', { size: 18, on: true });
      const x = W * 0.52 + 26, w = W - x - 14, h = (H - 40) / 2;
      g += slab(x, 14, w, h) + dinoBone(x + w / 2, 14 + h * 0.42, w / 340) + pill(x + w / 2, 14 + h - 26, 'Dinosaur bone', { size: 16 });
      g += slab(x, 26 + h, w, h) + fossilHuman(x + w / 2, 26 + h * 1.4, 0.84) + pill(x + w / 2, 26 + h * 2 - 26, 'Early human', { size: 16 });
    }
    return g;
  }
  draw(st, step) { return [this._b0, this._b1, this._b2, this._b3][step].call(this, st); }
  async setup() {
    await super.setup();
    this.root.addEventListener('click', (e) => { const n = e.target?.dataset?.layer; if (n != null && this.stepIndex === 2) { this._dig = +n; this.ctl?.set('dig', +n); this.repaint(); } });
  }
}
