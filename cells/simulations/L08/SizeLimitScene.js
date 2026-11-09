// SizeLimitScene - blk-l07-s02. Wooden cubes on a bench, a chalkboard behind holds the sums. Model only.
// Beat 0: 1 unit wide: surface 6, inside 1. Beat 1: Double the width: surface 24 (4 times), inside 8 (8 times). Beat 2:
// Split into small cells: 8 small cubes, inside 8, surface 48 (2 times the large cube). Beat 3: the three side by side.
// Numbers: side a, surface 6a^2, inside a^3. Control names: Double the width, Split into small cells.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, ctlBar, stroke } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1 } from '../shared/CellWorld.js';
import { bench } from '../shared/Scapes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const A = 'strata-2', top = mx(A, 'elev-peak', 62), left = mx(A, 'strata-3', 74), right = mx(A, 'strata-6', 62), edge = mx('strata-3', 'strata-6', 70);

/** An isometric cube of side u standing with its near corner at (x, y). */
function cube(x, y, u) {
  const c = 0.87 * u, h = 0.5 * u;
  return `<path d="M${n1(x)} ${n1(y - u)}L${n1(x - c)} ${n1(y - u - h)}L${n1(x)} ${n1(y - u - 2 * h)}L${n1(x + c)} ${n1(y - u - h)}Z" style="fill:${top};stroke:${edge};stroke-width:1.8;stroke-linejoin:round"/>`
    + `<path d="M${n1(x)} ${n1(y)}L${n1(x - c)} ${n1(y - h)}V${n1(y - u - h)}L${n1(x)} ${n1(y - u)}Z" style="fill:${left};stroke:${edge};stroke-width:1.8;stroke-linejoin:round"/>`
    + `<path d="M${n1(x)} ${n1(y)}L${n1(x + c)} ${n1(y - h)}V${n1(y - u - h)}L${n1(x)} ${n1(y - u)}Z" style="fill:${right};stroke:${edge};stroke-width:1.8;stroke-linejoin:round"/>`
    + `<path d="M${n1(x - c * 0.7)} ${n1(y - u - h * 0.9)}L${n1(x - c * 0.1)} ${n1(y - u - h * 1.5)}" ${stroke(mx('elev-peak', A, 80), Math.max(1.6, u * 0.04), 'opacity:.7')}/>`;
}
/** n cubes wide, built of unit blocks, painted back to front. */
function block(x, y, n, u) {
  const c = 0.87 * u, h = 0.5 * u; let s = '';
  for (let k = 0; k < n; k++) for (let i = n - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) s += cube(x + (i - j) * c, y - (i + j) * h - k * u, u);
  return s;
}
const SUM = {
  1: { a: 1, surf: 6, ins: 1, s: '1 cube, 1 wide' },
  2: { a: 2, surf: 24, ins: 8, s: '1 cube, 2 wide' },
  8: { a: 1, surf: 48, ins: 8, s: '8 cubes, 1 wide each' },
};

export class SizeLimitScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Wooden cubes on a bench with a chalkboard behind. A cube 1 unit wide has surface 6 and inside 1. Doubled in width it has surface 24, 4 times as much, and inside 8, 8 times as much. Split into 8 small cubes the inside stays 8 and the surface becomes 48, 2 times that of the large cube. This is a model.';
  static CONTROLS = [];

  async setup() {
    this._st = 1;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'act', label: 'Double the width', go: true }], () => this.press());
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }
  enter(step) {
    this._st = step === 2 ? 2 : step === 3 ? 8 : 1;
    if (!this.ctl) return;
    this.ctl.show('act', step === 1 || step === 2);
    this.ctl.label('act', step === 1 ? 'Double the width' : 'Split into small cells');
  }
  press() {
    const step = this.stepIndex;
    if (step === 1) { this._st = this._st === 1 ? 2 : 1; this.ctl.label('act', this._st === 1 ? 'Double the width' : 'Back to 1 wide'); }
    if (step === 2) { this._st = this._st === 2 ? 8 : 2; this.ctl.label('act', this._st === 2 ? 'Split into small cells' : 'Join into one cube'); }
    this.repaint();
    if (step === 1 && this._st === 2 && !this._f1) { this._f1 = true; this.celebrate(); }
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = H - (P ? 76 : 92), b = SUM[this._st];
    let s = `<rect width="${W}" height="${H}" style="fill:${mx('strata-2', 'elev-peak', 34)}"/>`;
    const bx = 18, by = 14, bw = W - 36, bh = gy - 26 - (P ? 4 : 0);
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="8" style="fill:${mx('strata-3', 'strata-6', 60)}"/><rect x="${bx + 8}" y="${by + 8}" width="${bw - 16}" height="${bh - 16}" rx="5" style="fill:${mx('sea-deep', 'strata-6', 52)}"/>`;
    s += bench(W, gy, H, { planks: 1 });
    const chalk = (x, y, t, o = {}) => `<text x="${n1(x)}" y="${n1(y)}" text-anchor="${o.a ?? 'middle'}" style="font-family:var(--sim-font-display);font-weight:600;font-size:${o.size ?? 20}px;fill:${o.col ?? T('elev-peak')}">${t}</text>`;
    const px = P ? W * 0.5 : W * 0.3;
    if (step === 3) {
      const u = P ? 24 : 36, xs = P ? [W * 0.15, W * 0.43, W * 0.74] : [W * 0.14, W * 0.42, W * 0.79], tx = P ? [W * 0.18, W * 0.46, W * 0.77] : xs, y = gy + (P ? 44 : 60);
      s += block(xs[0], y, 1, u) + block(xs[1], y, 2, u);
      for (let i = 0; i < 8; i++) { const c = (i % 4) - 1.5, r = i >> 2; s += cube(xs[2] + c * u * 1.26 + (r ? u * 0.6 : 0), y + (r ? 14 : -16), u * 0.82); }
      const ly = P ? [54, 108, 162] : [66, 124, 182], fs = P ? 15 : 19;
      const rows = [['1 wide', 'surface 6', 'inside 1'], ['2 wide', 'surface 24', 'inside 8'], ['8 small', 'surface 48', 'inside 8']];
      rows.forEach(([a, c, d], i) => { s += chalk(tx[i], ly[0], a, { size: fs + 1, col: mx('gold', 'elev-peak', 34) }) + chalk(tx[i], ly[1], c, { size: fs }) + chalk(tx[i], ly[2], d, { size: fs }); });
      return { svg: cwFrame(st, 'sl', s) };
    }
    const u = P ? 38 : 50, y = gy + (P ? 30 : 40);
    if (this._st === 1) s += block(px, y, 1, u * 1.1);
    else if (this._st === 2) s += block(px, y, 2, u * 0.82);
    else for (let i = 0; i < 8; i++) { const c = (i % 4) - 1.5, r = i >> 2; s += cube(px + c * u * (P ? 1.56 : 1.4) + (r ? u * 0.5 : 0), y + (r ? 18 : -22), u * 0.72); }
    const cx = P ? W / 2 : W * 0.72, a = P ? 'middle' : 'middle', f = P ? 19 : 24, ty = P ? 56 : 80, g = P ? 30 : 46;
    const x1 = this._st === 1 ? '' : this._st === 2 ? '  = 4 times' : '  = 2 times';
    const x2 = this._st === 2 ? '  = 8 times' : this._st === 8 ? '  = the same' : '';
    s += chalk(cx, ty, b.s, { size: f - 2, col: mx('gold', 'elev-peak', 34), a });
    s += chalk(cx, ty + g, `Surface ${b.surf}${P ? '' : x1}`, { size: f, a });
    s += chalk(cx, ty + 2 * g, `Inside ${b.ins}${P ? '' : x2}`, { size: f, a });
    if (P && (x1 || x2)) s += chalk(cx, ty + 2 * g + 26, this._st === 2 ? '4 times the surface, 8 times the inside' : '2 times the surface, same inside', { size: 15, a });
    return { svg: cwFrame(st, 'sl', s) };
  }
}
