// PotatoWeighScene - the answer to the potato predict. Weights are made up and the scene says so; the direction follows the book.
//   Three-beat block: 0 both pieces on balances at 50 g  1 in the beakers, a time slider runs the hour  2 back on the balances
//   Three-beat block with BLOCK_B (blk-l03-n02): 3 cells at A's surface  4 cells at B's surface  5 root hair in soil
// The slider sets the state; the state is never kept from an earlier beat. Water arrows: more arrows the way the net movement goes, and both ways always.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwDefs, depthField, plantCell, inclusion, soluteDot, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, fill, stroke, ctlBar } from '../shared/PlantArt.js';
import { potatoDefs, bench, beaker, piece, balance, PIECE } from './PotatoArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const PARTS = ['wall', 'cytoplasm', 'vacuole', 'nucleus', 'membrane'];
const arrow = (x0, y0, x1, y1, tone, w = 7) => { const a = Math.atan2(y1 - y0, x1 - x0), h = w * 2.1; return `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1 - Math.cos(a) * h)} ${n1(y1 - Math.sin(a) * h)}" ${stroke(tone, w)}/><path d="M${n1(x1)} ${n1(y1)}L${n1(x1 - Math.cos(a - 0.5) * h * 1.3)} ${n1(y1 - Math.sin(a - 0.5) * h * 1.3)}L${n1(x1 - Math.cos(a + 0.5) * h * 1.3)} ${n1(y1 - Math.sin(a + 0.5) * h * 1.3)}Z" ${fill(tone)}/>`; };

export class PotatoWeighScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 540;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Two potato pieces, each 50 grams at the start. After an hour the piece from plain water has swollen and weighs more, and the piece from salt solution has shrunk and weighs less. These weights are made up. Closer views show water moving into cells from plain water, water moving out into salt solution, and water entering a root hair from soil.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 410; }
  
  async setup() {
    this._u = 0;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'range', id: 't', label: 'Time', min: 0, max: 60, step: 5, value: 60, read: (v) => `${v} min`, say: (v) => `${v} minutes` }], (id, v) => { this._u = v / 60; this.repaint(); });
    this.enter(this.stepIndex);
  }
  enter(step) { const s = step + 0; this._u = s === 1 ? 1 : s === 2 ? 1 : 0; this.ctl?.show('t', s === 1); this.ctl?.set('t', 60); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const step = this.stepIndex;
    return { svg: frame(st, 'pw', step <= 2 ? this._bench(st, step) : this._cells(st, step)) };
  }
  _bench(st, step) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.84, ax = W * 0.26, bx = W * 0.74, bw = P ? 128 : 170, bh = P ? 158 : 196, pw = P ? 60 : 78, ph = P ? 42 : 52;
    let s = potatoDefs() + bench(W, H, gy);
    const size = P ? 15 : 19;
    if (step === 1) {
      const A = PIECE(this._u, 'A'), B = PIECE(this._u, 'B');
      s += beaker(ax, gy, bw, bh, { tint: 'water', inner: (x, f) => piece(x, f - (ph * A.k) / 2, pw * A.k * 1.04, ph * A.k, { seed: 4 }) });
      s += beaker(bx, gy, bw, bh, { tint: 'salt', inner: (x, f) => piece(x, f - (ph * B.k) / 2, pw * B.k * 1.04, ph * B.k, { seed: 8, shrink: B.sh }) });
      s += label(ax, gy - bh - 14, 'A: plain water', { size, display: true }) + label(bx, gy - bh - 14, 'B: salt solution', { size, display: true });
    } else {
      const u = step === 2 ? 1 : 0, A = PIECE(u, 'A'), B = PIECE(u, 'B'), bal = P ? 136 : 180;
      s += balance(ax, gy + 10, bal, `${A.g} g`) + balance(bx, gy + 10, bal, `${B.g} g`);
      const top = gy + 10 - 33;
      s += piece(ax, top - (ph * 1.4 * A.k) / 2, pw * 1.4 * A.k, ph * 1.4 * A.k, { seed: 4 }) + piece(bx, top - (ph * 1.4 * B.k) / 2, pw * 1.4 * B.k, ph * 1.4 * B.k, { seed: 8, shrink: B.sh });
      s += label(ax, gy - bh * 0.72 - 22, step === 2 ? 'A: plain water' : 'A', { size, display: true }) + label(bx, gy - bh * 0.72 - 22, step === 2 ? 'B: salt solution' : 'B', { size, display: true });
      if (step === 2) s += label(ax, gy - bh * 0.72 + 4, `gained ${A.g - 50} g`, { size: size + 1, display: true }) + label(bx, gy - bh * 0.72 + 4, `lost ${50 - B.g} g`, { size: size + 1, display: true });
    }
    s += label(W / 2, 22, 'weights made up for this drawing', { size: P ? 14 : 17 });
    return s;
  }
  _cells(st, step) {
    const W = st.W, H = st.H, P = st.portrait, inTone = T('series-1');
    let s = `<defs>${cwDefs()}</defs>` + depthField(W, H, { tone: step === 5 ? 'green' : 'blue', seed: 3 + step });
    if (step === 5) return s + this._root(st);
    const pull = step === 4 ? 0.62 : 0, cw = P ? 150 : 188, ch = P ? 138 : 160, q = rnd(4);
    const cell = (x, y, seed) => { let c = plantCell(x, y, cw, ch, { pull, parts: PARTS, seed }); for (let i = 0; i < 6; i++) c += inclusion(x + (q() - 0.5) * cw * (0.56 - pull * 0.2), y + (q() - 0.5) * ch * (0.56 - pull * 0.2), 5); return c; };
    const y0 = H * 0.62; s += cell(W * 0.26, y0, 4) + cell(W * 0.74, y0, 8);
    // the liquid above the surface cells; salt stays there
    s += `<rect width="${W}" height="${n1(y0 - ch / 2 - 10)}" style="fill:${step === 4 ? mx('strata-1', 'sea-shallow', 40) : mx('sea-shallow', 'elev-peak', 30)};opacity:.5"/>`;
    if (step === 4) for (let i = 0; i < 16; i++) { const sx = 16 + q() * (W - 32), sy = 16 + q() * (y0 - ch / 2 - 46); if (Math.abs(sx - W * 0.5) < 46 && Math.abs(sy - (y0 - ch / 2 - 62)) < 22) continue; s += soluteDot(sx, sy, 7, { kind: 'salt' }); }
    const inward = step === 3, top = y0 - ch / 2 - 40, low = y0 - ch / 2 + 24;
    for (const x of [W * 0.14, W * 0.3, W * 0.5, W * 0.7, W * 0.86]) s += inward ? arrow(x, top, x, low, inTone) : arrow(x, low, x, top, inTone);
    s += inward ? arrow(W * 0.4, low, W * 0.4, top, inTone, 4) : arrow(W * 0.4, top, W * 0.4, low, inTone, 4);
    s += label(W * 0.5, y0 - ch / 2 - 56, 'water', { size: P ? 15 : 17, display: true });
    s += label(W / 2, H - 16, inward ? 'more water goes in than comes out' : 'more water leaves; the salt stays outside', { size: P ? 14 : 17, display: true });
    return s;
  }
  _root(st) {
    const W = st.W, H = st.H, P = st.portrait, q = rnd(9), lim = H * 0.3;
    let s = `<rect width="${W}" height="${H}" ${fill(mx('strata-3', 'strata-2', 56))}/>`;
    for (let i = 0; i < 34; i++) { const x = q() * W, y = lim + q() * (H - lim), r = 14 + q() * 20; s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r + 5)}" style="fill:${mx('sea-shallow', 'elev-peak', 60)};opacity:.74"/><path d="M${n1(x - r)} ${n1(y)}C${n1(x - r)} ${n1(y - r * 1.1)} ${n1(x + r)} ${n1(y - r)} ${n1(x + r)} ${n1(y)}S${n1(x - r * 0.8)} ${n1(y + r)} ${n1(x - r)} ${n1(y)}Z" style="fill:${mx('strata-2', 'strata-3', 60 + Math.round(q() * 30))};stroke:${mx('strata-3', 'strata-6', 70)};stroke-width:2"/>`; }
    const k = P ? 0.8 : 1;
    s += `<rect width="${W}" height="${n1(lim)}" ${fill(mx('elev-mid', 'strata-1', 40))}/>`;
    for (let i = 0; i < 6; i++) s += plantCell((i + 0.5) * W / 6, lim * 0.56, W / 6, lim * 0.92, { parts: ['wall', 'cytoplasm', 'vacuole', 'membrane'], seed: i + 2 });
    const hx = W * 0.58, d = `M${n1(hx - 26)} ${n1(lim - 8)}C${n1(hx - 22)} ${n1(lim + 90 * k)} ${n1(hx + 26)} ${n1(lim + 150 * k)} ${n1(hx - 40)} ${n1(H - 80)}Q${n1(hx - 58)} ${n1(H - 52)} ${n1(hx - 22)} ${n1(H - 62)}C${n1(hx + 66)} ${n1(lim + 160 * k)} ${n1(hx + 28)} ${n1(lim + 80 * k)} ${n1(hx + 26)} ${n1(lim - 8)}Z`;
    s += `<path d="${d}" style="fill:url(#cw-cytoG) ${mx('sea-shallow', 'elev-peak', 30)};stroke:${T('elev-low')};stroke-width:6"/>`;
    s += arrow(W * 0.16, H * 0.74, hx - 24, H * 0.72, T('series-1')) + arrow(W * 0.9, H * 0.6, hx + 46, H * 0.56, T('series-1'));
    s += label(hx + 62, H * 0.42, 'root hair', { size: P ? 15 : 17, display: true, anchor: 'start' }) + label(W * 0.2, H * 0.66, 'water in soil', { size: P ? 15 : 17, display: true });
    s += `<rect y="${n1(H - 42)}" width="${W}" height="42" style="fill:${mx('strata-1', 'elev-peak', 70)};opacity:.9"/>`;
    s += label(W / 2, H - 16, 'water enters root cells by osmosis', { size: P ? 15 : 17, display: true });
    return s;
  }
}
