// ThreeDomainRevisionScene - L10 blk-l10-s05, 3 beats. Beat 0: two microbes with one outline and a DNA strip each; Compare
// DNA brings the strips together and rings the places where they differ. Beat 1: three boughs, the three domains.
// Beat 2: the kingdoms inside the domains: Monera's members in two plates, the four others in Eukarya. Tap a domain to
// light it. The strips are a made-up picture of a comparison, not real sequences. Controls: compare; tap-light domains.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke, mountEl } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { fitBio } from '../shared/BioArt.js';
import { words } from '../shared/SeaBits.js';
import { rod, dnaStrip, mx, INK } from './EarthArt.js';

const A = '0123201301223012', B = '0312201132203102';
const DIFF = [...A].map((c, i) => (c !== B[i] ? i : -1)).filter((i) => i >= 0);
const TONE_B = mx(lc('red'), lc('white'), 0.56), TONE_A = TONE_B;
const PLATE = { Bacteria: mx(lc('red'), lc('white'), 0.66), Archaea: mx(lc('gold'), lc('white'), 0.58), Eukarya: mx(lc('leaf'), lc('white'), 0.62) };
const CHIPS = ['Bacteria', 'Archaea', 'Eukarya'].map((d) => ({ id: d, label: d, targets: [d] }));

export class ThreeDomainRevisionScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'Two microbes with the same outline, whose DNA strips differ in many places. Then three boughs from one trunk: Bacteria, Archaea and Eukarya. Then the kingdoms inside them: Monera shared between Bacteria and Archaea, and Protista, Fungi, Plantae and Animalia inside Eukarya.';
  heights = [[340, 340], [370, 400], [380, 360]];
  tl = tapLight({ label: 'The three domains', chips: CHIPS, onChange: () => this.repaint() });
  _same = false;

  ctls() { return [{ kind: 'btn', id: 'compare', label: 'Compare DNA', go: true }]; }
  onCtl() { this._same = true; this.ctl?.show('compare', false); this.repaint(); this.after(1, () => this.celebrate()); }
  async setup() { await super.setup(); this._tlHost = mountEl(this.root, 'td-tl'); this.tl.mount(this._tlHost, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this._same = false; this.ctl?.show('compare', step === 0); if (this._tlHost) this._tlHost.style.display = step === 2 ? '' : 'none'; this.tl.reset(); }
  destroy() { this.tl.destroy(); super.destroy(); }

  _b0(st) {
    const { W, H, portrait: P } = st, cx = [W * 0.27, W * 0.73], ry = 92, s = P ? 0.58 : 0.92;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('water'), lc('white'), 0.5))}/>`;
    cx.forEach((x, i) => {
      g += `<g class="bs-drift" style="--dx:${i ? -4 : 4}px;--dy:${i ? 3 : -3}px">${rod(x + 12, ry, s, { tone: i ? TONE_A : TONE_B })}</g>`;
      g += pill(x, 30, `Microbe ${i + 1}`, { size: 16 });
    });
    const same = this._same;
    if (!same) {
      const w = P ? 148 : 240, y = P ? 174 : 186;
      cx.forEach((x, i) => { g += dnaStrip(x - w / 2, y, w, 40, i ? B : A) + pill(x, y + 76, 'Its DNA', { size: 15 }); });
    } else {
      const w = W - (P ? 48 : 150), x = (W - w) / 2, y = P ? 172 : 176;
      g += `<g class="bs-pop">${dnaStrip(x, y, w, 38, A, { flag: DIFF })}${dnaStrip(x, y + 56, w, 38, B, { flag: DIFF })}</g>`;
      g += pill(W / 2, H - 28, 'Same outline, different DNA', { size: 17, on: true, pop: true });
    }
    return g;
  }
  _b1(st) {
    const { W, H, portrait: P } = st, bx = W / 2, by = H - 34, bark = lc('bark'), dark = lc('barkDark');
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('white'), 0.4))}/>`;
    g += `<rect y="${by}" width="${W}" height="40" ${fill(mx(lc('soil'), lc('leaf'), 0.3))}/>`;
    const r = P ? 50 : 76, tops = [[W * 0.17, P ? 92 : 104], [W * 0.5, P ? 72 : 92], [W * 0.83, P ? 92 : 104]];
    const limb = (x, y, wd) => `<path d="M${bx} ${by - 6}C${bx} ${by - 110} ${x} ${by - 120} ${x} ${y + r * 0.6}" ${stroke(dark, wd + 6, 'stroke-linecap:round')}/><path d="M${bx} ${by - 6}C${bx} ${by - 110} ${x} ${by - 120} ${x} ${y + r * 0.6}" ${stroke(bark, wd, 'stroke-linecap:round')}/>`;
    tops.forEach(([x, y]) => { g += limb(x, y, 18); });
    ['Bacteria', 'Archaea', 'Eukarya'].forEach((d, i) => {
      const [x, y] = tops[i];
      g += `<g class="bs-pop" style="--d:${i * 0.14}s"><circle cx="${x}" cy="${y}" r="${r}" ${fill(PLATE[d], `stroke:${INK};stroke-width:3.5`)}/>`;
      if (i === 0) g += rod(x + r * 0.12, y, r / 150);
      if (i === 1) g += rod(x, y, r / 150, { tone: mx(lc('gold'), lc('white'), 0.3) });
      if (i === 2) { g += fitBio('Amoeba', x - r * 0.8, y - r * 0.76, r * 0.8, r * 0.7) + fitBio('Mushroom', x + 2, y - r * 0.8, r * 0.7, r * 0.72) + fitBio('FernPlant', x - r * 0.76, y + 2, r * 0.76, r * 0.66) + fitBio('Tiger', x + 2, y + 6, r * 0.78, r * 0.54); }
      g += '</g>' + pill(x, y + r + 8, d, { size: P ? 15 : 17 });
    });
    g += pill(P ? W / 2 : W * 0.5, H - 18, 'Carl Woese, 1977', { size: 15, bg: lc('white') });
    return g;
  }
  _b2(st) {
    const { W, H, portrait: P } = st, on = (d) => !this.tl.any() || this.tl.has(d), dim = (d) => (on(d) ? '' : 'opacity:0.3');
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.66))}/>`;
    const plate = (d, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" ${fill(PLATE[d], `stroke:${INK};stroke-width:${this.tl.has(d) ? 5 : 3}`)}/>` + words(x + w / 2, y + 28, d, { size: 19, display: true, ink: INK, weight: 600 });
    const tile = (name, art, x, y, w, h) => fitBio(art, x + 8, y, w - 16, h - 24) + words(x + w / 2, y + h - 4, name, { size: 15, ink: INK });
    if (P) {
      const w = (W - 34) / 2, y = 46, h = 128;
      g += `<path d="M18 36V24H${W - 18}V36" ${stroke(INK, 3, 'stroke-linejoin:round')}/>` + pill(W / 2, 22, 'Monera split in two', { size: 14 });
      g += `<g style="${dim('Bacteria')}">${plate('Bacteria', 12, y, w, h)}${rod(12 + w / 2 + 16, y + 80, 0.5)}</g>`;
      g += `<g style="${dim('Archaea')}">${plate('Archaea', 22 + w, y, w, h)}${rod(22 + w * 1.5 + 16, y + 80, 0.5, { tone: mx(lc('gold'), lc('white'), 0.3) })}</g>`;
      const ey = y + h + 12, eh = H - ey - 10;
      g += `<g style="${dim('Eukarya')}">${plate('Eukarya', 12, ey, W - 24, eh)}`;
      const cw = (W - 44) / 4, ty = ey + 40, th = eh - 50;
      [['Protista', 'Amoeba'], ['Fungi', 'Mushroom'], ['Plantae', 'FernPlant'], ['Animalia', 'Tiger']].forEach(([n, a], i) => { g += fitBio(a, 22 + i * cw + 4, ty, cw - 8, th - 28) + words(22 + i * cw + cw / 2, ty + th - 6, n, { size: 14, ink: INK }); });
      g += '</g>';
    } else {
      const w = W * 0.4, y = 56, h = (H - y - 26) / 2, y2 = y + h + 10, ex = w + 24, ew = W - ex - 12;
      g += `<path d="M14 48V36H${w + 10}V48" ${stroke(INK, 3, 'stroke-linejoin:round')}/>` + pill(12 + w / 2, 34, 'Monera split in two', { size: 15 });
      g += `<g style="${dim('Bacteria')}">${plate('Bacteria', 12, y, w, h)}${rod(12 + w / 2 + 12, y + h * 0.66, 0.66)}</g>`;
      g += `<g style="${dim('Archaea')}">${plate('Archaea', 12, y2, w, h)}${rod(12 + w / 2 + 12, y2 + h * 0.66, 0.66, { tone: mx(lc('gold'), lc('white'), 0.3) })}</g>`;
      g += `<g style="${dim('Eukarya')}">${plate('Eukarya', ex, 14, ew, H - 30)}`;
      const cw = (ew - 24) / 2, ch = (H - 80) / 2;
      [['Protista', 'Amoeba'], ['Fungi', 'Mushroom'], ['Plantae', 'FernPlant'], ['Animalia', 'Tiger']].forEach(([n, a], i) => { g += tile(n, a, ex + 12 + (i % 2) * cw, 56 + (i >> 1) * ch, cw, ch - 6); });
      g += '</g>';
    }
    return g;
  }
  draw(st, step) { return [this._b0, this._b1, this._b2][step].call(this, st); }
}
