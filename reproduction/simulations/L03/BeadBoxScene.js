// BeadBoxScene - blk-l03-s01. The book's three pairs of beads. Beat 0: the pairs, what each stands for. Beat 1: Draw: one bead
// from each pair, read as a character line, and a tally of kinds found so far. Beat 2: all eight kinds shown; each Draw
// rings the kind it landed on. The draw is random.
// Control name: Draw.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgPlantColour as pc, label, frame, fill, textureRect, ctlBar } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const PAIRS = [
  { n: 'Green', series: 3, a: 'Blonde hair', b: 'Black hair' },
  { n: 'Blue', series: 1, a: 'Straight hair', b: 'Curly hair' },
  { n: 'Red', series: 4, a: 'Brown eyes', b: 'Black eyes' },
];
const colr = (i, dark) => (dark ? `color-mix(in oklab, var(--sim-series-${PAIRS[i].series}) 78%, black)` : `color-mix(in oklab, var(--sim-series-${PAIRS[i].series}) 50%, var(--sim-elev-peak))`);
const bead = (x, y, r, col, o = '') => `<g ${o}><ellipse cx="${x + r * 0.18}" cy="${y + r * 0.92}" rx="${r * 0.92}" ry="${r * 0.26}" style="fill:var(--sim-strata-6);opacity:.5;filter:url(#pa-soft)"/><circle cx="${x}" cy="${y}" r="${r}" ${fill(col, `stroke:color-mix(in oklab, ${col} 56%, var(--sim-strata-6));stroke-width:2`)}/><path d="M${x + r * 0.84} ${y + r * 0.1}A${r * 0.86} ${r * 0.86} 0 0 1 ${x - r * 0.4} ${y + r * 0.76}A${r * 1.2} ${r * 1.2} 0 0 0 ${x + r * 0.84} ${y + r * 0.1}Z" style="fill:color-mix(in oklab, ${col} 50%, var(--sim-strata-6));opacity:.55"/><path d="M${x - r * 0.5} ${y + r * 0.46}A${r * 0.7} ${r * 0.7} 0 0 0 ${x + r * 0.5} ${y + r * 0.46}" style="fill:none;stroke:var(--sim-elev-peak);stroke-width:${r * 0.1};opacity:.5;stroke-linecap:round"/><ellipse cx="${x - r * 0.34}" cy="${y - r * 0.42}" rx="${r * 0.3}" ry="${r * 0.18}" transform="rotate(-30 ${x - r * 0.34} ${y - r * 0.42})" style="fill:var(--sim-elev-peak);opacity:.92"/><circle cx="${x + r * 0.1}" cy="${y - r * 0.56}" r="${r * 0.06}" style="fill:var(--sim-elev-peak)"/></g>`;
const felt = (W, H) => `<defs><radialGradient id="bb-f" cx=".4" cy=".36" r=".8"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-strata-1) 34%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-strata-1) 82%, var(--sim-strata-2))"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#pa-wood) var(--sim-strata-3)"/>${textureRect(0, 0, W, H, 'fibre', 0.34)}<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="12" style="fill:url(#bb-f);stroke:var(--sim-strata-6);stroke-width:3"/>${textureRect(12, 12, W - 24, H - 24, 'grain', 0.2, 12)}`;

export class BeadBoxScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Three pairs of beads, green, blue and red, each pair one light and one dark. One bead is drawn from each pair. A tally of eight possible sets fills up.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'draw', label: 'Draw', go: true }], (id) => { if (id === 'draw') this._onTakeBeads(); });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 340 : 366; }
  enter(step) {
    this._pick = step === 1 ? [0, 0, 0] : null; this._seen = new Set(step === 2 ? [0, 1, 2, 3, 4, 5, 6, 7] : step === 1 ? [0] : []); this._last = null;
    if (!this.ctl) return;
    this.ctl.show('draw', step > 0);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }
  _onTakeBeads() {
    this._pick = PAIRS.map(() => (Math.random() < 0.5 ? 0 : 1));
    const k = this._pick[0] * 4 + this._pick[1] * 2 + this._pick[2], was = this._seen.size;
    this._seen.add(k); this._last = k;
    if (this._seen.size === 8 && was === 7) this.celebrate();
    this.repaint();
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, r = P ? 20 : 28;
    let s = felt(W, H);
    if (step === 0) {
      const y0 = 66, dy = (H - 84) / 3;
      PAIRS.forEach((p, i) => {
        const y = y0 + i * dy + 20;
        s += bead(W * 0.3, y, r * 1.3, colr(i, 0)) + bead(W * 0.7, y, r * 1.3, colr(i, 1));
        s += label(W * 0.3, y + r * 1.3 + 22, p.a, { size: P ? 15 : 18, display: true }) + label(W * 0.7, y + r * 1.3 + 22, p.b, { size: P ? 15 : 18, display: true });
      });
      s += label(W / 2, 38, 'Three pairs, two versions each', { size: P ? 19 : 24, display: true });
      return { svg: frame(st, 'bb', s) };
    }
    const y0 = 66, dy = P ? 50 : 66, pick = this._pick;
    PAIRS.forEach((p, i) => {
      const y = y0 + i * dy + 8;
      [0, 1].forEach((d) => { const on = !pick || pick[i] === d; s += bead(W * (P ? 0.15 : 0.12) + d * (r * 2.5), y, r * 1.02, colr(i, d), on ? '' : 'opacity="0.26"'); });
    });
    if (pick) {
      s += label(W * 0.68, y0 + 8, 'This gamete:', { size: P ? 14 : 17 });
      PAIRS.forEach((p, i) => { s += label(W * 0.68, y0 + 34 + i * (P ? 22 : 30), pick[i] ? p.b : p.a, { size: P ? 15 : 21, display: true }); });
    }
    const n = this._seen.size, ty = y0 + 3 * dy + 18;
    s += label(W / 2, 38, step === 2 ? 'Eight kinds in all' : `${n} of 8 kinds found`, { size: P ? 19 : 24, display: true });
    const cols = P ? 4 : 8, cw = (W - 44) / cols, ch = (H - ty - 18) / (P ? 2 : 1);
    for (let k = 0; k < 8; k++) {
      const x = 22 + (k % cols) * cw, y = ty + Math.floor(k / cols) * ch, on = this._seen.has(k), b = [(k >> 2) & 1, (k >> 1) & 1, k & 1];
      s += `<rect x="${x + 3}" y="${y + 3}" width="${cw - 6}" height="${ch - 6}" rx="10" style="fill:${on ? 'color-mix(in oklab, var(--sim-strata-1) 30%, var(--sim-elev-peak))' : 'none'};stroke:${pc('ink')};stroke-width:${this._last === k ? 5 : 2.5};${on ? '' : 'stroke-dasharray:6 6;opacity:.5'}"/>`;
      if (on) b.forEach((d, i) => { s += bead(x + cw * (i + 1) / 4, y + ch / 2, Math.min(cw * 0.16, 10), colr(i, d)); });
    }
    return { svg: frame(st, 'bb', s) };
  }
}
