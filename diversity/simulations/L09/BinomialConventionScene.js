// BinomialConventionScene - L09 blk-l09-s05, 4 beats. 0: tiger and lion under one genus, two species names. 1: two tigers
// and their cub, one species; the lion apart. 2: the two parts of a name, on the tiger and the mango. 3: how to write it,
// with a Print or Handwriting control. State: the mode resets on entering the beat.
import { BioStage, beats, pill, panel, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { tigerBig, lionBig, fitBig, mx } from '../L08/VertArt.js';
import { mangoSprig, it } from './NameBits.js';

export class BinomialConventionScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'A tiger and a lion in one genus, Panthera, with species names Panthera tigris and Panthera leo. Two tigers and a cub, one species. Two names split into genus and species: Panthera tigris and Mangifera indica. The rules: capital first letter for the genus, small letters for the species, italics in print, each word underlined by hand.';
  heights = [[320, 370], [280, 320], [440, 380], [340, 330]];
  _mode = 'print';
  ctls() { return [{ kind: 'seg', id: 'mode', label: 'Print or handwriting', value: 'print', options: [{ value: 'print', label: 'Print' }, { value: 'hand', label: 'Handwriting' }] }]; }
  onCtl(id, v) { if (id === 'mode' && v) { this._mode = v; this.repaint(); } }
  enter(step) { this._mode = 'print'; this.ctl?.set('mode', 'print'); this.ctl?.show('mode', step === 3); }

  _genus(st) {
    const { W, H, portrait: P } = st, gy = H - 58;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('dryGrass'), lc('white'), 0.42))}/><path d="M0 ${gy - 10}Q${W / 2} ${gy - 30} ${W} ${gy - 6}V${H}H0Z" ${fill(lc('dryGrass'))}/>`;
    const y = 14, bh = 50;
    g += panel(W / 2 - (P ? 160 : 190), y, P ? 320 : 380, bh, lc('white')) + it(P ? 22 + W / 2 - 160 : W / 2 - 170, y + 33, 'Panthera', { size: 23, anchor: 'start' });
    g += words(W / 2 + (P ? 150 : 176), y + 32, 'the roaring cats', { size: 15, ink: INK, anchor: 'end' });
    const k = P ? 0.43 : 0.66, ax = W * 0.26, bx = W * 0.75;
    g += tigerBig(ax - (P ? 2 : 0), gy, k) + lionBig(bx - (P ? 6 : 0), gy, k * 0.9);
    g += `<path d="M${W / 2} ${y + bh}V${y + bh + 16}M${ax} ${gy - 196 * k - 4}V${y + bh + 16}H${bx}V${gy - 200 * k - 2}" ${stroke(INK, 3)}/>`;
    g += it(ax, H - 18, 'Panthera tigris', { size: P ? 17 : 20, halo: lc('white') }) + it(bx, H - 18, 'Panthera leo', { size: P ? 17 : 20, halo: lc('white') });
    return g;
  }
  _species(st) {
    const { W, H, portrait: P } = st, gy = H - 30;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H}" ${fill(lc('grass'))}/>`;
    const k = P ? 0.35 : 0.56;
    g += tigerBig(P ? 68 : 120, gy + 3, k) + tigerBig(P ? 284 : 520, gy + 3, k, { flip: true }) + tigerBig(W / 2 - 2, gy + 3, k * 0.5);
    g += pill(W / 2, 32, 'One species: Panthera tigris', { size: P ? 15 : 17 });
    g += pill(W / 2, 74, 'Young can have young too', { size: P ? 14.5 : 16, on: true });
    return g;
  }
  _parts(st) {
    const { W, H, portrait: P } = st, name = (x, y, w, h, a, b, art) => {
      let s = panel(x, y, w, h, lc('white')) + art;
      const ty = y + h - 44, cx = x + w / 2, aw = a.length * (P ? 12.4 : 13.6), bw = b.length * (P ? 12.4 : 13.6), total = aw + bw + 14, l = cx - total / 2, m = l + aw + 7;
      s += `<rect x="${l - 6}" y="${ty - 24}" width="${aw + 10}" height="36" rx="10" ${fill(mx(lc('sea'), lc('white'), 0.5))}/><rect x="${m + 2}" y="${ty - 24}" width="${bw + 8}" height="36" rx="10" ${fill(mx(lc('yellow'), lc('white'), 0.5))}/>`;
      s += it(l + aw / 2, ty + 2, a, { size: P ? 21 : 23 }) + it(m + 6 + bw / 2, ty + 2, b, { size: P ? 21 : 23 });
      s += words(l + aw / 2, ty + 32, 'Genus', { size: 15, ink: INK }) + words(m + 6 + bw / 2, ty + 32, 'Species', { size: 15, ink: INK });
      return s;
    };
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    if (P) {
      const h = (H - 30) / 2;
      g += name(10, 10, W - 20, h, 'Panthera', 'tigris', fitBig('Tiger', W / 2 - 70, 18, 140, h - 104));
      g += name(10, 20 + h, W - 20, h, 'Mangifera', 'indica', mangoSprig(W / 2 + 10, 52 + h, 0.5));
    } else {
      const w = (W - 30) / 2, h = H - 20;
      g += name(10, 10, w, h, 'Panthera', 'tigris', fitBig('Tiger', 10 + w / 2 - 110, 30, 220, h - 124));
      g += name(20 + w, 10, w, h, 'Mangifera', 'indica', mangoSprig(20 + w * 1.5 + 10, 58, 0.86));
    }
    return g;
  }
  _write(st) {
    const { W, H, portrait: P } = st, hand = this._mode === 'hand', size = P ? 37 : 46, cy = H / 2 + 10;
    let g = `<rect width="${W}" height="${H}" ${fill(hand ? mx(lc('skyDay'), lc('white'), 0.6) : lc('white'))}/>`;
    if (hand) for (let y = 40; y < H; y += 40) g += `<path d="M0 ${y}H${W}" ${stroke(mx(lc('sea'), lc('white'), 0.4), 2)}/>`;
    const gw = size * 3.84, sw = size * 2.3, gap = size * 0.5, x0 = W / 2 - (gw + sw + gap) / 2, ink = hand ? mx(lc('seaDeep'), INK, 0.3) : INK;
    g += it(x0, cy, 'Panthera', { size, anchor: 'start', ink, display: false, weight: 700 }) + it(x0 + gw + gap, cy, 'tigris', { size, anchor: 'start', ink, display: false, weight: 700 });
    if (hand) {
      g += `<path d="M${x0} ${cy + 12}q${gw / 2} 5 ${gw} -1" ${stroke(lc('red'), 4.5, 'stroke-linecap:round')}/><path d="M${x0 + gw + gap} ${cy + 12}q${sw / 2} 4 ${sw} 0" ${stroke(lc('red'), 4.5, 'stroke-linecap:round')}/>`;
      g += pill(W / 2, H - 34, 'Each word underlined', { size: 15, on: true });
    } else g += pill(W / 2, H - 34, 'Italics in print', { size: 15, on: true });
    g += pill(x0 + (P ? 52 : 58), 44, 'Capital letter', { size: 15 }) + `<path d="M${x0 + size * 0.24} 62L${x0 + size * 0.24} ${cy - size * 0.76}" ${stroke(INK, 2.5)}/>`;
    g += pill(x0 + gw + gap + sw / 2 - (P ? 8 : 0), 44 + (P ? 0 : 0), 'Small letters', { size: 15 }) + `<path d="M${x0 + gw + gap + sw / 2} 62L${x0 + gw + gap + sw / 2} ${cy - size * 0.76}" ${stroke(INK, 2.5)}/>`;
    return g;
  }
  draw(st, step) { return [this._genus, this._species, this._parts, this._write][step].call(this, st); }
}
