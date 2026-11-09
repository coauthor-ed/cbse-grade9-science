// PairsCountScene - blk-l03-s05, new. Beat 0: Pairs slider: the count of kinds doubles, 2^n, true at every position. Beat 1:
// 23 pairs: 83,88,608. Beat 2: a plain comparison drawn to scale: 800 crore people is one square in a block of 8,800 squares,
// about 70 lakh crore possible children (70 lakh crore / 800 crore = about 8,800). Control name: Pairs.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgPlantColour as pc, labelWhite as label, frame, stroke, textureRect, ctlBar } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const inr = (v) => { const s = String(v), t = s.slice(-3), r = s.slice(0, -3); return r ? `${r.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${t}` : t; };

export class PairsCountScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A count that doubles with each pair of chromosomes, up to 83,88,608 for 23 pairs. Then a block of 8,800 squares: one square is the 800 crore people alive, the whole block is about 70 lakh crore possible children.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'range', id: 'pairs', label: 'Pairs', min: 1, max: 23, step: 1, value: 3, read: (v) => String(v), say: (v) => `${v} pairs` }], (id, v) => { this._n = v; this.repaint(); });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return this.stepIndex >= 2 ? (st.portrait ? 400 : 400) : (st.portrait ? 300 : 360); }
  enter(step) { this._n = step === 0 ? 3 : 23; if (!this.ctl) return; this.ctl.show('pairs', step < 2); this.ctl.set('pairs', this._n); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = `<rect width="${W}" height="${H}" style="fill:url(#pa-wood) var(--sim-strata-3)"/>${textureRect(0, 0, W, H, 'fibre', 0.34)}<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="8" style="fill:color-mix(in oklab, var(--sim-strata-6) 74%, var(--sim-sea-deep));stroke:var(--sim-strata-6);stroke-width:3"/>${textureRect(12, 12, W - 24, H - 24, 'grain', 0.5, 8)}`;
    if (step < 2) {
      const n = this._n ?? 3, v = 2 ** n;
      s += label(W / 2, 34, `${n} ${n === 1 ? 'pair' : 'pairs'}`, { size: P ? 20 : 24, display: true });
      s += label(W / 2, H * (P ? 0.36 : 0.42), inr(v), { size: P ? (n > 19 ? 44 : 54) : 72, display: true });
      s += label(W / 2, H * (P ? 0.42 : 0.46) + (P ? 26 : 36), 'kinds of gamete', { size: P ? 16 : 20 });
      s += label(W / 2, H * (P ? 0.46 : 0.5) + (P ? 56 : 62), n <= 6 ? `${Array(n).fill(2).join(' \u00d7 ')} = ${inr(v)}` : `2 multiplied together ${n} times`, { size: P ? 15 : 18 });
      const show = Math.min(n, 23), bw = (W - 48) / 23, rh = P ? 30 : 38, y0 = H - rh - 22, rw = Math.max(3, bw * 0.3);
      for (let i = 0; i < 23; i++) {
        const c = `var(--sim-series-${(i % 8) + 1})`, cx = 24 + (i + 0.5) * bw;
        for (const d of [-1, 1]) {
          const x = cx + d * rw * 0.72 - rw / 2, on = i < show;
          s += `<rect x="${x}" y="${y0}" width="${rw}" height="${rh}" rx="${rw / 2}" style="fill:${on ? c : 'none'};stroke:${on ? `color-mix(in oklab, ${c} 60%, black)` : 'var(--sim-ice)'};stroke-width:1.2;opacity:${on ? 1 : 0.3}"/>`;
          if (on) s += `<rect x="${x}" y="${y0 + rh * 0.42}" width="${rw}" height="${rh * 0.1}" style="fill:var(--sim-bg-deep);opacity:0.45"/><rect x="${x + rw * 0.2}" y="${y0 + 3}" width="${rw * 0.22}" height="${rh * 0.32}" rx="1" style="fill:var(--sim-ice);opacity:0.6"/>`;
        }
      }
    } else {
      // A true-scale block: 8,800 squares, 110 by 80. One square is all the people alive; the block is every possible child.
      const cols = 110, rows = 80, u = P ? 2.9 : 3.4, bw = cols * u, bh = rows * u, x0 = P ? (W - bw) / 2 : 32, y0 = P ? 74 : 66;
      s += label(W / 2, 32, 'Two parents, far more than people alive', { size: P ? 16 : 22, display: true });
      s += `<defs><pattern id="pc-cell" width="${u}" height="${u}" patternUnits="userSpaceOnUse" x="${x0}" y="${y0}"><rect width="${u}" height="${u}" style="fill:var(--sim-series-3)"/><path d="M${u} 0V${u}H0" style="fill:none;stroke:var(--sim-bg-deep);stroke-width:0.7;opacity:0.7"/></pattern></defs>`;
      s += `<g class="sv-grow"><rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" style="fill:url(#pc-cell) var(--sim-series-3);stroke:${pc('ink')};stroke-width:2"/></g>`;
      const cx = x0 + u * 8.5, cy = y0 + u * 8.5;
      s += `<rect x="${cx - u / 2}" y="${cy - u / 2}" width="${u}" height="${u}" style="fill:var(--sim-series-6);stroke:var(--sim-ice);stroke-width:0.6"/><circle cx="${cx}" cy="${cy}" r="13" style="fill:none;stroke:var(--sim-ice);stroke-width:3"/>`;
      if (P) {
        s += `<path d="M${cx} ${cy - 13}V60" ${stroke(pc('pale'), 2)}/>`;
        s += label(x0, 56, 'One square: all 800 crore people alive', { size: 14, anchor: 'start' });
        s += label(W / 2, y0 + bh + 24, 'The whole block: 8,800 squares', { size: 16, display: true });
        s += label(W / 2, y0 + bh + 46, 'about 70 lakh crore possible children', { size: 14 });
      } else {
        const tx = x0 + bw + 22, ly = y0 + 40;
        s += `<path d="M${cx + 13} ${cy}L${x0 + bw + 14} ${ly - 8}" ${stroke(pc('pale'), 2)}/>`;
        s += label(tx, ly - 8, 'One square', { size: 22, display: true, anchor: 'start' }) + label(tx, ly + 18, 'about 800 crore', { size: 18, anchor: 'start' }) + label(tx, ly + 42, 'people alive', { size: 18, anchor: 'start' });
        s += label(tx, ly + 112, 'The whole block', { size: 22, display: true, anchor: 'start' }) + label(tx, ly + 138, '8,800 squares', { size: 18, anchor: 'start' }) + label(tx, ly + 162, 'about 70 lakh crore', { size: 18, anchor: 'start' }) + label(tx, ly + 186, 'possible children', { size: 18, anchor: 'start' });
      }
    }
    s += `<rect x="16" y="${H - 16}" width="${W - 32}" height="7" rx="3" style="fill:url(#pa-wood) var(--sim-strata-3);stroke:${pc('ink')};stroke-width:1.2"/><rect x="${W * 0.7}" y="${H - 21}" width="48" height="6" rx="3" style="fill:var(--sim-ice)"/><rect x="${W * 0.2}" y="${H - 20}" width="30" height="5" rx="2.5" style="fill:var(--sim-series-2)"/>`;
    return { svg: frame(st, 'pc', s) };
  }
}
