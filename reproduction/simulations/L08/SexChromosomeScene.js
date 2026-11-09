// SexChromosomeScene - XX, XY, in the round light of a microscope. 3 beats. 0: a cell from each parent, the egg with X, sperm
// with X or Y; no zygote yet. 1: controls .sc-pick (data-s X, Y) set the sperm; the zygote shows XX or XY; nothing is set on
// landing. 2: both results side by side, by chance. No people. Letters are on tags; chromosomes are drawn.
import { SvgScene, mountEl } from 'simulations/base/kit/SimSvg.js';
import { BODY_CSS, pop, frame, tag, txt, n, cellSvg, eggSvg, spermSvg, form, tapered } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const CX = 'var(--sim-series-5)', CY = 'var(--sim-series-7)', CELL = 'color-mix(in oklab, var(--sim-series-4) 34%, var(--sim-bg-surface))';
function arm(L, w, col) {
  const pts = [[0, -L], [0, -L * 0.5], [0, 0], [0, L * 0.5], [0, L]], ws = [w * 0.7, w, w * 0.72, w, w * 0.7];
  let bands = '';
  for (let i = 0; i < 7; i++) bands += `<rect x="${n(-w)}" y="${n(-L + (i + 0.5) * (L * 2) / 7)}" width="${n(w * 2)}" height="${n(L * 0.09)}" style="fill:color-mix(in oklab, ${col} 58%, black);opacity:0.42"/>`;
  return form(tapered(pts, ws), col, { ao: 3, aoOp: 0.45, rim: 1.4, inner: bands, hi: 46 });
}
function chromo(x, y, L, k = 1) {
  const col = L === 'X' ? CX : CY, h = (L === 'X' ? 34 : 19) * k, w = 6.5 * k;
  return `<g transform="translate(${n(x)} ${n(y)})"><g transform="rotate(${L === 'X' ? 17 : 13})">${arm(h, w, col)}</g><g transform="rotate(${L === 'X' ? -17 : -13})">${arm(h, w, col)}</g></g>`;
}
const pair = (x, y, a, b, k = 1) => chromo(x - 24 * k, y, a, k) + chromo(x + 24 * k, y, b, k);
function scope(st) {
  const W = st.W, H = st.H;
  return `<defs><radialGradient id="sc-l" cx="0.42" cy="0.4" r="0.72"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-series-2) 10%, var(--sim-bg-surface))"/><stop offset="0.72" style="stop-color:color-mix(in oklab, var(--sim-series-5) 12%, var(--sim-bg-surface))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-series-5) 34%, var(--sim-bg-deep))"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#sc-l)"/>`;
}

export class SexChromosomeScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 492;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'Sex chromosomes: the mother has XX and every egg has an X; the father has XY and a sperm has an X or a Y. Egg with sperm gives XX, a girl, or XY, a boy.';
  css() {
    return `${BODY_CSS}.svs { padding: 0; }
.sc-row { display: flex; gap: 10px; justify-content: center; padding: 8px 4px 2px; }
.sc-pick { min-height: 46px; padding: 4px 14px; cursor: pointer; touch-action: manipulation; font: 800 16px/1 var(--sim-font); color: var(--sim-label); background: var(--sim-bg-surface); border: calc(2px * var(--look-rim)) solid var(--sim-stroke); border-radius: var(--sim-radius-md); box-shadow: 0 calc(3px * var(--look-lip)) 0 color-mix(in oklab, var(--sim-stroke) 62%, var(--sim-bg-deep)); }
.sc-pick[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 26%, var(--sim-bg-surface)); border-color: var(--sim-accent); }`;
  }
  stageHeight(st) { return st.portrait ? 420 : 390; }
  async setup() {
    this._s = null;
    await super.setup();
    this._row = mountEl(this.root, 'sc-row');
    this._row.innerHTML = ['X', 'Y'].map((c) => `<button type="button" class="sc-pick" data-s="${c}" aria-pressed="false">Sperm with ${c}</button>`).join('');
    this._row.querySelectorAll('.sc-pick').forEach((b) => b.addEventListener('click', () => { this._s = b.dataset.s; this._sync(); this.repaint(); }));
    this._sync(); this.repaint();
  }
  enter() { this._s = null; this._sync?.(); }
  _sync() {
    if (!this._row) return;
    this._row.style.display = this.stepIndex === 1 ? '' : 'none';
    this._row.querySelectorAll('.sc-pick').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === this._s)));
    this.relayout?.();
  }
  paint(st) {
    this._sync?.();
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, big = step === 0, a = W * 0.26, b = W * 0.74, top = big ? (P ? 84 : 92) : (P ? 66 : 64), r = big ? (P ? 70 : 82) : (P ? 54 : 56), ck = big ? (P ? 0.92 : 1.08) : 0.74;
    let s = cellSvg(a, top, r, { col: CELL, nuc: false }) + cellSvg(b, top, r, { col: CELL, nuc: false });
    s += pair(a, top, 'X', 'X', ck) + pair(b, top, 'X', 'Y', ck);
    s += tag(a, top + r + 4, 'Mother: XX', { size: 15, display: true }) + tag(b, top + r + 4, 'Father: XY', { size: 15, display: true });
    const gy = top + r + (big ? 92 : P ? 62 : 66), gr = big ? (P ? 44 : 50) : (P ? 32 : 34);
    s += eggSvg(a, gy + 6, gr, { id: 'sc' }) + chromo(a, gy + 6, 'X', big ? 0.7 : 0.5);
    const sp = (x, y, L, on) => `<g style="opacity:${on ? 1 : 0.3}">${spermSvg(x + 22, y, 15, 46, 0, { phase: 1 })}${chromo(x + 22, y, L, 0.3)}</g>` + tag(x + 8, y + 28, L, { size: 14, display: true, op: on ? 1 : 0.3 });
    const sx = P ? 46 : 68;
    s += sp(b - sx, gy, 'X', this._s !== 'Y') + sp(b + sx, gy, 'Y', this._s !== 'X');
    const oy = H - (P ? 76 : 70), zr = P ? 56 : 58;
    const out = (x, L2, lab) => cellSvg(x, oy - 8, zr, { col: CELL, nuc: false }) + pair(x, oy - 8, 'X', L2, 0.66) + tag(x, oy + zr - 2, lab, { size: 15, display: true });
    if (step === 0) s += tag(W / 2, H - 44, 'Who determines the sex of a baby?', { size: P ? 15 : 18, display: true });
    if (step === 1) s += this._s ? pop(out(W / 2, this._s, this._s === 'X' ? 'XX: a girl' : 'XY: a boy')) : tag(W / 2, oy + 6, 'Press a sperm below', { size: 15 });
    if (step === 2) s += out(a, 'X', 'XX: a girl') + out(b, 'Y', 'XY: a boy') + txt(W / 2, oy, 'or', { size: 20, display: true });
    return { svg: frame(st, 'sc', s, { back: scope(st) }) };
  }
}
