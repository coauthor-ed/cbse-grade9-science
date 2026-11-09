// FungiUsesScene - blk-l02-s02b, new. Four panels drawn plainly: organic waste, pollutants, heavy metals, antibiotics.
// Chips light one; beat 0 starts on waste, beat 1 on antibiotics. Nothing here says how much or how fast. Control names: chips.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, svgSoil, svgPlantColour as pc, label, frame, fill, stroke, pathRoundRect } from '../shared/PlantArt.js';

import { sky, tiles, bench } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const USES = [['waste', 'Organic waste'], ['pollute', 'Pollutants'], ['metal', 'Heavy metals'], ['drug', 'Antibiotics']];
const CHIPS = USES.map(([id, lab]) => ({ id, label: lab, targets: [id] }));
const MOULD = 'color-mix(in oklab, var(--sim-strata-5) 60%, var(--sim-elev-peak))', MK = 'var(--sim-strata-6)';
// A colony: a pale mat of branching threads, and upright threads ending in round sacs with a lit side.
const fuzz = (x, y, n, w) => {
  let s = `<ellipse cx="${x}" cy="${y}" rx="${w * 0.6}" ry="7" style="fill:${MOULD};opacity:0.8;filter:url(#pa-soft)"/>`;
  for (let i = 0; i < 16; i++) { const u = x + ((i * 7) % 16 / 15 - 0.5) * w * 1.08, k = i % 2 ? 1 : -1; s += `<path d="M${u} ${y + 2}q${k * 7} ${-5 - (i % 3)} ${k * 15} ${-1 + (i % 4)}" ${stroke(MOULD, 1.5)}/>`; }
  for (let i = 0; i < n; i++) {
    const u = x + (i / (n - 1) - 0.5) * w, h = 16 + ((i * 5) % 7) * 3.2, tx = u + (i % 3) * 3 - 3, ty = y - h - 2;
    s += `<path d="M${u} ${y}q${(i % 2) * 7 - 3.5} ${-h * 0.6} ${tx - u} ${-h}" ${stroke(MOULD, 2.4)}/><circle cx="${tx}" cy="${ty}" r="5.2" ${fill(MK)}/><circle cx="${tx - 1.6}" cy="${ty - 1.6}" r="1.6" ${fill(MOULD)}/>`;
  }
  return s;
};
const scrap = (x, y, r, col, line) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-17 0C-9 -11 9 -11 17 0C9 8 -9 8 -17 0Z" style="fill:${col};stroke:${line};stroke-width:1.6"/><path d="M-13 0L13 0" ${stroke(line, 1)}/></g>`;
const drum = (x, y) => `<rect x="${x - 21}" y="${y - 50}" width="42" height="52" rx="4" style="fill:url(#pa-metal) ${pc('metal')};stroke:${pc('metalDark')};stroke-width:2"/><ellipse cx="${x}" cy="${y - 50}" rx="21" ry="5" ${fill(pc('metalDark'))}/><path d="M${x - 21} ${y - 34}H${x + 21}M${x - 21} ${y - 16}H${x + 21}" ${stroke(pc('metalDark'), 2)}/>`;

export class FungiUsesScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Four uses of fungi: breaking down organic waste, breaking down pollutants, removing heavy metals from industrial waste, and antibiotics.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Uses of fungi', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this.tl.set({ lit: step === 1 ? 'drug' : 'waste' }); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 300 : 340; }
  destroy() { this.tl.destroy(); super.destroy(); }

  panel(id, x, y, w, h) {
    const cx = x + w / 2, gy = y + h * 0.74;
    let s = `<defs><clipPath id="fu-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/></clipPath></defs><g clip-path="url(#fu-${id})"><g transform="translate(${x} ${y})">${id === 'drug' ? tiles(w, h, { cool: true, size: 34 }) + bench(w, h * 0.74, h, { planks: 2 }) : id === 'metal' ? tiles(w, h, { size: 34 }) : sky(w, h, { warm: 0.3 })}</g></g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" style="fill:none;stroke:${pc('ink')};stroke-width:3"/>`;
    if (id === 'waste') {
      s += svgSoil(x + 3, gy, 1, { w: w - 6, h: h * 0.26 - 3, seed: 2 });
      s += `<path d="M${cx - w * 0.3} ${gy}Q${cx} ${gy - h * 0.62} ${cx + w * 0.3} ${gy}Z" style="fill:url(#pa-soil) ${pc('soil')};stroke:${pc('soilDeep')};stroke-width:2"/>`;
      s += scrap(cx - 58, gy - 12, -18, pc('leaf'), pc('leafDark')) + scrap(cx + 48, gy - 16, 24, pc('leafLit'), pc('leafDark')) + scrap(cx - 18, gy - 8, 8, pc('tuberLit'), pc('tuberDark')) + scrap(cx + 14, gy - 34, -30, pc('leaf'), pc('leafDark'));
      s += fuzz(cx - 2, gy - h * 0.3, 7, w * 0.26);
    } else if (id === 'pollute') {
      s += svgSoil(x + 3, gy, 1, { w: w - 6, h: h * 0.26 - 3, seed: 5 });
      s += `<path d="M${cx - w * 0.3} ${gy + 4}Q${cx} ${gy - 14} ${cx + w * 0.3} ${gy + 4}Q${cx} ${gy + 16} ${cx - w * 0.3} ${gy + 4}Z" ${fill(pc('ink'))}/>` + drum(cx - w * 0.36, gy + 2) + fuzz(cx + 12, gy - 3, 7, w * 0.36);
    } else if (id === 'metal') {
      const py = y + h * 0.28;
      s += `<path d="${pathRoundRect(x + 10, py, w * 0.46, 30, 6)}" style="fill:url(#pa-metal) ${pc('metal')};stroke:${pc('metalDark')};stroke-width:2"/><path d="M${x + 10 + w * 0.46} ${py + 26}q14 0 14 20" ${stroke(pc('metalDark'), 12)}/>`;
      s += `<rect x="${x + 8}" y="${gy}" width="${w - 16}" height="${h * 0.22}" rx="8" ${fill(pc('water'))}/>`;
      for (let i = 0; i < 6; i++) s += `<path d="${pathRoundRect(x + 24 + i * (w - 60) / 5, gy + 8 + (i % 2) * 8, 12, 8, 2)}" ${fill(pc('metalDark'))}/>`;
      s += fuzz(cx + w * 0.16, gy, 6, w * 0.32);
    } else {
      const dx = cx - w * 0.16, dy = gy - 8, rx = w * 0.27, ry = h * 0.23;
      s += `<ellipse cx="${dx + 3}" cy="${dy + 7}" rx="${rx + 2}" ry="${ry + 2}" style="fill:var(--sim-strata-6);opacity:0.3;filter:url(#pa-soft)"/><ellipse cx="${dx}" cy="${dy}" rx="${rx}" ry="${ry}" style="fill:color-mix(in oklab, var(--sim-ice) 56%, var(--sim-elev-peak));stroke:var(--sim-strata-5);stroke-width:3"/><ellipse cx="${dx}" cy="${dy + 2}" rx="${rx - 8}" ry="${ry - 6}" style="fill:color-mix(in oklab, var(--sim-strata-1) 46%, var(--sim-elev-peak));stroke:var(--sim-strata-5);stroke-width:1"/><path d="M${dx - rx * 0.8} ${dy - ry * 0.4}A${rx} ${ry} 0 0 1 ${dx - rx * 0.1} ${dy - ry * 0.94}" ${stroke('var(--sim-elev-peak)', 3)}/>` + fuzz(dx, dy + 8, 6, rx * 0.8);
      const cap = (a, b, r) => `<g transform="translate(${a} ${b}) rotate(${r})"><rect x="-22" y="-10" width="44" height="20" rx="10" ${fill(pc('cloud'), `stroke:${pc('metalDark')};stroke-width:2`)}/><path d="M0 -10H12a10 10 0 0 1 0 20H0Z" style="fill:url(#pa-red) ${pc('red')}"/><path d="M-16 -5H10" style="stroke:var(--sim-elev-peak);stroke-width:3;opacity:.7;fill:none;stroke-linecap:round"/></g>`;
      s += cap(cx + w * 0.26, gy - 26, -20) + cap(cx + w * 0.3, gy + 2, 14);
    }
    return s;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, m = 10, pw = (W - 2 * m - g) / 2, ph = (H - 2 * m - g) / 2;
    let s = `<rect width="${W}" height="${H}" ${fill(pc('skyPale'))}/>`;
    USES.forEach(([id, name], i) => {
      const x = m + (i % 2) * (pw + g), y = m + (i >> 1) * (ph + g);
      s += `<g opacity="${this.tl.off(id) ? 0.5 : 1}">${this.panel(id, x, y, pw, ph)}${label(x + pw / 2, y + 22, name, { size: P ? 14 : 17, display: true })}</g>`;
    });
    return { svg: frame(st, 'fu', s) };
  }
}
