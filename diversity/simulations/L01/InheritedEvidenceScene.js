// InheritedEvidenceScene - blk-l01-s06, 3 beats. Beat 0: one pond, four unrelated animals. Beat 1: a made-up bird; the
// learner presses Next generation; each generation thicker bills leave more young, so the average bill grows. Nothing is
// chosen by any bird. Beat 2: one line becomes two, with the features they keep. Control: .ie-next. A learner reaches the
// sixth generation; state comes from the beat and the press count only.
import { SvgScene, mountEl } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP, svgFish, svgReeds } from '../shared/LifeArt.js';
import { fitBio, svgBio, svgBioColour as bc } from '../shared/BioArt.js';
import { BIO_BTN_CSS, PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const LAST = 6;
const mean = (g) => 5 + (g - 1) * 1.8;
// Young left, by place in the row from thin bill to thick (made up). Thin bills crack few seeds.
const YOUNG = [0, 1, 2, 3, 4];
const bird = (x, y, s, bill, o = {}) => {
  const bx = x + 26 * s, by = y - 32 * s, L = 8 + bill * 0.9;
  const beak = `<path d="M${bx.toFixed(1)} ${(by - bill / 2 * s).toFixed(1)}Q${(bx + L * s).toFixed(1)} ${(by).toFixed(1)} ${(bx + L * 1.1 * s).toFixed(1)} ${(by + 2 * s).toFixed(1)}Q${(bx + L * 0.5 * s).toFixed(1)} ${(by + bill * 0.5 * s).toFixed(1)} ${bx.toFixed(1)} ${(by + bill / 2 * s).toFixed(1)}Z" style="fill:${bc('ink')}"/>`;
  return `<g style="opacity:${o.alpha ?? 1}">${svgBio('Sparrow', x, y, s)}${beak}</g>`;
};

export class InheritedEvidenceScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 500; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 570;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A pond shared by a frog, a fish, a snail and a deer. Then a made-up seed-eating bird over six generations: birds with thicker bills leave more young, so the average bill grows. Last, one line of birds branches into two, which keep the same body and feathers.';

  _gen = 1;

  css() { return BIO_BTN_CSS + '.ie-bar { display: flex; justify-content: center; padding-top: 10px; } .ie-bar[hidden] { display: none; }'; }
  async setup() {
    await super.setup();
    this.bar = mountEl(this.root, 'ie-bar');
    this.bar.innerHTML = '<button type="button" class="bb-btn ie-next">Next generation</button>';
    this.bar.addEventListener('click', (e) => { if (e.target.closest?.('.ie-next')) this._next(); });
    this.enter(this.stepIndex); this.repaint();
  }
  stageHeight(st) { return this.stepIndex === 1 ? (st.portrait ? 470 : 400) : (st.portrait ? 500 : 460); }
  enter(step) {
    this._gen = 1;
    if (this.bar) this.bar.hidden = step !== 1;
    this._btn(); this.relayout?.();
  }
  _btn() { const b = this.bar?.querySelector?.('.ie-next'); if (b) { b.disabled = this._gen >= LAST; b.textContent = this._gen >= LAST ? 'Generation 6 reached' : 'Next generation'; } }
  _next() {
    if (this._gen >= LAST) return;
    this._gen += 1; this._btn(); this.repaint();
    if (this._gen === LAST) this.celebrate();
  }
  _pond(st) {
    const W = st.W, H = st.H, g = H * 0.34;
    let s = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'skyDay', b: 'elevPeak', t: 0.42 })}"/><rect y="${g}" width="${W}" height="${H - g}" rx="14" style="fill:${bc('leaf')}"/>`;
    const cx = W / 2, cy = H * 0.68, rx = W * 0.44, ry = H * 0.27;
    s += `<ellipse cx="${cx}" cy="${cy + 5}" rx="${rx}" ry="${ry}" style="fill:${bc('soil')}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" style="fill:${bc('water')}"/><ellipse cx="${cx}" cy="${cy + 8}" rx="${rx * 0.62}" ry="${ry * 0.54}" style="fill:${bc('waterDeep')};opacity:.36"/>`;
    s += svgReeds(W * 0.1, g + 44, 0.9, {}) + svgReeds(W * 0.9, g + 54, 0.9, {});
    s += fitBio('Deer', W * 0.06, 8, W * 0.42, H * 0.46, { flip: false });
    s += fitBio('Frog', W * 0.66, H * 0.44, W * 0.2, H * 0.14);
    s += svgFish(W * 0.42, H * 0.74, 1.7, { kind: 0 }) + svgFish(W * 0.64, H * 0.8, 1.2, { kind: 1, flip: true });
    s += fitBio('Snail', W * 0.14, H * 0.82, W * 0.22, H * 0.15);
    s += PLATE(W - 196, 10, 186, 34, { r: 12, fill: bc('white'), rim: bc('ink') }) + words(W - 103, 33, 'Same place', { size: 16, ink: bc('ink') });
    return s;
  }
  _gens(st) {
    const W = st.W, H = st.H, P = st.portrait, g = this._gen, m = mean(g);
    let s = PLATE(4, 4, W - 8, H - 12, { fill: bc({ a: 'strata1', b: 'elevPeak', t: 0.6 }) });
    s += words(W / 2, 38, `Generation ${g} of ${LAST}`, { size: 24, display: true, ink: bc('ink') });
    const rowY = 158, n = 5, cw = (W - 24) / n, sc = Math.min(1.5, cw / 94);
    for (let i = 0; i < n; i++) {
      const x = 12 + cw * i + cw / 2 - 4, bill = m + (i - 2) * 1.2;
      s += bird(x, rowY, sc, bill);
      const k = YOUNG[i];
      let dots = ''; for (let j = 0; j < k; j++) dots += `<circle cx="${(x + 3 + (j - (k - 1) / 2) * 13).toFixed(1)}" cy="${rowY + 22}" r="5" style="fill:${bc('sparrow')}"/>`;
      s += dots;
    }
    s += P ? words(W / 2, rowY + 46, 'Dots show young left.', { size: 14, ink: bc('ink') }) + words(W / 2, rowY + 66, 'Thicker bills crack more seeds.', { size: 14, ink: bc('ink') })
      : words(W / 2, rowY + 52, 'Dots show young left. Thicker bills crack more seeds.', { size: 15, ink: bc('ink') });
    // The average bill, generation by generation: same scale, true to the bird drawn above.
    const y = P ? 268 : 262, gw = (W - 24) / LAST;
    s += words(W / 2, y - 8, 'Average bill in each generation', { size: 15, ink: bc('ink') });
    for (let i = 1; i <= LAST; i++) {
      const x = 12 + (i - 1) * gw + gw / 2, on = i <= g, h = mean(i) * 4.2, base = y + 92;
      s += `<rect x="${x - gw * 0.3}" y="${base - h}" width="${gw * 0.6}" height="${h}" rx="5" style="fill:${on ? bc('sparrow') : 'none'};stroke:${bc('sparrowDark')};stroke-width:2;${on ? '' : 'stroke-dasharray:4 4'}"/>`;
      s += words(x, base + 18, String(i), { size: 14, ink: bc('ink') });
    }
    s += words(W / 2, 60, 'A made-up bird', { size: 14, ink: bc('ink') });
    return s;
  }
  _fork(st) {
    const W = st.W, H = st.H, P = st.portrait;
    let s = PLATE(4, 4, W - 8, H - 12, { fill: bc({ a: 'strata1', b: 'elevPeak', t: 0.6 }) });
    const bx = W / 2, by = H - 96, lx = W * 0.25, rx = W * 0.75, ty = P ? 190 : 170;
    s += `<path d="M${bx} ${by - 56}Q${bx} ${by - 150} ${lx} ${ty + 34}M${bx} ${by - 56}Q${bx} ${by - 150} ${rx} ${ty + 34}" style="fill:none;stroke:${bc('bark')};stroke-width:12;stroke-linecap:round"/>`;
    const q = P ? 1.15 : 1.5;
    s += bird(bx - 10, by, q * 1.05, 7);
    s += bird(lx - 10, ty, q, 15) + bird(rx - 10, ty, q, 3.6);
    s += words(lx, ty - 66, 'Thick bill', { size: 16, ink: bc('ink') });
    s += words(rx, ty - 66, 'Thin bill', { size: 16, ink: bc('ink') });
    s += words(bx, by + 28, 'One earlier line', { size: 16, ink: bc('ink') });
    s += words(bx, by + 52, 'Both keep its feathers, wings and feet', { size: P ? 14 : 15, ink: bc('ink') });
    s += words(bx, H - 18, 'A made-up example', { size: 14, ink: bc('ink') });
    return s;
  }
  paint(st) { const k = this.stepIndex; return { svg: k === 0 ? this._pond(st) : k === 1 ? this._gens(st) : this._fork(st) }; }
}
