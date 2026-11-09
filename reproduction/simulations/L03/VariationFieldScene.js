// VariationFieldScene - blk-l03-s05b, new. Beat 0: a row of plants from seed, all different. Beat 1: the book's two examples,
// a high mountain and a glass of milk. Beat 2: Disease arrives: a field of copies against a field from seed; some of the second stand. Which plants
// stand is made up, for the picture, and the text says may. Human variation stays in words: no groups or faces are drawn.
// Control name: Disease arrives.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgRosePlant, svgPlantColour as pc, label, frame, fill, stroke, textureRect, ctlBar } from '../shared/PlantArt.js';

import { sky, hills, hedge, orchard, field, grass, tiles, bench, contact } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const SEED = [['red', 1], ['yellow', 0], ['pink', 1], ['wild', 0], ['yellow', 1]];

export class VariationFieldScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A row of different plants grown from seed. A disease reaches two fields: all the copies of one plant wilt, while in the field from seed some plants stand.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'hit', label: 'Disease arrives', go: true }], (id) => {
      if (id !== 'hit') return;
      this._hit = true; this.ctl.disable('hit', true); this.repaint();
    });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : (this.stepIndex === 2 ? 372 : 400); }
  enter(step) { this._hit = false; if (!this.ctl) return; this.ctl.show('hit', step === 2); this.ctl.disable('hit', false); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  examples(st) {
    const W = st.W, H = st.H, P = st.portrait, sz = P ? 15 : 19, m = W * 0.5, gy = H * 0.78;
    const rock = 'color-mix(in oklab, var(--sim-strata-5) 72%, var(--sim-strata-6))', lit = 'color-mix(in oklab, var(--sim-strata-5) 50%, var(--sim-elev-peak))';
    let l = sky(m, H, { sun: [m * 0.2, 30], warm: 0.1 }) + hills(m, H * 0.56, { seed: 5 });
    const peak = (x, base, w, h) => `<path d="M${x - w} ${base}L${x} ${base - h}L${x + w} ${base}Z" ${fill(rock)}/><path d="M${x} ${base - h}L${x - w} ${base}L${x - w * 0.1} ${base}L${x + w * 0.06} ${base - h * 0.5}Z" ${fill(lit)}/><path d="M${x} ${base - h}L${x - w * 0.34} ${base - h * 0.62}L${x - w * 0.1} ${base - h * 0.7}L${x + w * 0.04} ${base - h * 0.56}L${x + w * 0.16} ${base - h * 0.7}L${x + w * 0.34} ${base - h * 0.64}Z" ${fill(pc('cloud'))}/>`;
    l += peak(m * 0.72, gy + 6, m * 0.36, H * 0.54) + peak(m * 0.34, gy + 6, m * 0.42, H * 0.68);
    l += `<rect y="${gy}" width="${m}" height="${H - gy}" ${fill(pc('hedge'))}/>` + grass(m, gy + 8, 14, { gap: 4 }) + textureRect(0, gy, m, H - gy, 'grain', 0.24);
    let r = tiles(W, H, { size: 46 }) + `<g>${bench(W, H * 0.72, H)}</g>`;
    const gx = W * 0.75, gw = P ? 78 : 118, gt = H * 0.22, gb = H * 0.8;
    r += contact(gx, gb + 2, gw * 0.5, 7, 0.45);
    r += `<path d="M${gx - gw * 0.46} ${gt + 26}L${gx - gw * 0.4} ${gb - 5}H${gx + gw * 0.4}L${gx + gw * 0.46} ${gt + 26}Q${gx} ${gt + 36} ${gx - gw * 0.46} ${gt + 26}Z" style="fill:url(#pa-egg)"/>`;
    r += `<ellipse cx="${gx}" cy="${gt + 27}" rx="${gw * 0.46}" ry="8" ${fill(pc('cloud'), `stroke:${pc('cloudShade')};stroke-width:1.5`)}/>`;
    r += `<path d="M${gx - gw / 2} ${gt}L${gx - gw * 0.41} ${gb}H${gx + gw * 0.41}L${gx + gw / 2} ${gt}" style="fill:url(#pa-glass);stroke:${pc('glassEdge')};stroke-width:3"/><path d="M${gx - gw * 0.36} ${gt + 12}L${gx - gw * 0.3} ${gb - 10}" ${stroke(pc('glassLit'), 5)}/><ellipse cx="${gx}" cy="${gt}" rx="${gw / 2}" ry="7" style="fill:none;stroke:${pc('glassEdge')};stroke-width:3"/>`;
    let s = `<defs><clipPath id="vf-r"><rect x="${m + 2}" width="${W}" height="${H}"/></clipPath><clipPath id="vf-l"><rect width="${m - 2}" height="${H}"/></clipPath></defs><rect width="${W}" height="${H}" ${fill(pc('ink'))}/><g clip-path="url(#vf-l)">${l}</g><g clip-path="url(#vf-r)">${r}</g>`;
    s += label(W * 0.25, 34, 'Low oxygen', { size: sz, display: true }) + label(W * 0.25, H - 16, 'high altitudes', { size: sz - 1 }) + label(W * 0.75, 34, 'Milk', { size: sz, display: true }) + label(W * 0.75, H - 16, 'digested by some adults', { size: P ? 14 : sz - 1 });
    return s;
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, n = P ? 4 : 5;
    if (step < 2) {
      if (step === 1) return { svg: frame(st, 'vf', this.examples(st)) };
      const gy = Math.round(H * 0.8), q = P ? 0.72 : 1.04;
      let s = sky(W, gy + 8, { warm: 0.2, sun: [W * 0.14, 24] }) + hedge(W, gy * 0.5, gy * 0.56, { seed: 13 }) + svgSoil(0, gy, 1, { w: W, h: H - gy, seed: 6 }) + grass(W, gy + 3, 14, { gap: 5 });
      for (let i = 0; i < n; i++) s += `<g class="sv-pop" style="--d:${i * 0.08}s">${svgRosePlant(W * (i + 0.5) / n, gy + 4, q * (0.84 + (i % 3) * 0.12), { blooms: 1 + (i % 3), tint: SEED[i][0], seed: 3 + i * 2 })}</g>`;
      s += label(W / 2, 34, 'From seed: each a new mix', { size: P ? 19 : 24, display: true });
      return { svg: frame(st, 'vf', s) };
    }
    const my = Math.round(H * 0.5), q = P ? 0.5 : 0.76, hit = this._hit;
    let s = sky(W, my, { warm: 0.3, sun: [W * 0.86, 20] }) + orchard(W, my * 0.5, { n: 7 }) + field(W, H, my * 0.46, { vanish: W * 0.3 });
    for (let i = 0; i < n; i++) {
      const x = W * (i + 0.5) / n;
      s += svgRosePlant(x, my - 10, q, hit ? { sick: 0.92, blooms: 0, tint: 'red' } : { blooms: 2, tint: 'red' });
      const sick = hit && SEED[i][1];
      s += svgRosePlant(x, H - 18, q, sick ? { sick: 0.92, blooms: 0, seed: 3 + i * 2 } : { blooms: 2, tint: SEED[i][0], seed: 3 + i * 2 });
    }
    s += label(W * 0.26, 26, 'Copies of one plant', { size: P ? 15 : 18, display: true }) + label(W * 0.26, my + 26, 'Grown from seed', { size: P ? 15 : 18, display: true });
    return { svg: frame(st, 'vf', s) };
  }
}
