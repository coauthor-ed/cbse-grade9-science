// MeristemCell - blk-l05-n01. One meristem cell from just behind a root tip beside a permanent cell from farther back,
// on a quiet microscope depth field. Beats: small-thin (the two walls), nucleus (large nucleus, dense cytoplasm), vacuole
// (none in the meristem cell, one large one in the permanent cell), packed (meristem cells with no gaps beside permanent
// cells with intercellular spaces), allow (the meristem cell divides into two). The scene never says why the vacuole is
// missing: a predict follows. Tap-to-light chips under the figure. Watch it divide: replays the division.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, label, ctlBar, anim } from '../shared/PlantArt.js';
import { cwFrame, depthField, T, mx, n1, rnd, nucleus, mitochondrion, ribosome } from '../shared/CellWorld.js';
import { stDefs, gridCells, cells, STAIN } from '../shared/StemArt.js';
import { meriCell } from '../shared/CellTypes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const CHIPS = [
  { id: 'wall', label: 'cell wall', targets: ['wall'] },
  { id: 'nuc', label: 'nucleus', targets: ['nuc'] },
  { id: 'cyto', label: 'cytoplasm', targets: ['cyto'] },
  { id: 'vac', label: 'vacuole', targets: ['vac'] },
  { id: 'gap', label: 'intercellular space', targets: ['gap'] },
];
const BEAT_LIT = [['wall'], ['nuc', 'cyto'], ['vac'], ['gap'], []];

const rr = (x, y, w, h, r) => `M${n1(x + r)} ${n1(y)}H${n1(x + w - r)}Q${n1(x + w)} ${n1(y)} ${n1(x + w)} ${n1(y + r)}V${n1(y + h - r)}Q${n1(x + w)} ${n1(y + h)} ${n1(x + w - r)} ${n1(y + h)}H${n1(x + r)}Q${n1(x)} ${n1(y + h)} ${n1(x)} ${n1(y + h - r)}V${n1(y + r)}Q${n1(x)} ${n1(y)} ${n1(x + r)} ${n1(y)}Z`;
let UID = 0;
const grainIn = (d, x, y, w, h, a) => { const id = `mcg${(UID = (UID + 1) % 100000)}`; return `<clipPath id="${id}"><path d="${d}"/></clipPath><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" clip-path="url(#${id})" style="fill:${mx('series-5', INK, 60)};opacity:${a};filter:url(#cw-grain)"/>`; };
// A permanent cell in its tissue: neighbour cells round it share its wall (a dark middle lamella down the middle of each
// shared wall, small air spaces where three cells meet), a firm wall, a thin layer of cytoplasm lining the whole wall,
// one large vacuole filling the rest, the nucleus pressed against the wall inside that thin layer.
function permCell(x, y, w, h, o = {}) {
  const P = (n) => { const v = o.part?.(n); return v === undefined ? 1 : v; }, G = (a, b) => (a <= 0 ? '' : `<g${a < 1 ? ` opacity="${a}"` : ''}>${b}</g>`);
  const q = rnd(o.seed ?? 5), ww = Math.max(4.5, Math.min(w, h) * 0.026), x0 = x - w / 2, y0 = y - h / 2, x1 = x0 + w, y1 = y0 + h, pad = Math.min(30, Math.min(w, h) * 0.14);
  const lam = rr(x0, y0, w, h, ww * 1.4), inner = rr(x0 + ww, y0 + ww, w - 2 * ww, h - 2 * ww, ww), strip = Math.max(6, Math.min(w, h) * 0.035);
  const field = rr(x0 - pad, y0 - pad, w + 2 * pad, h + 2 * pad, pad * 0.8);
  let s = `<path d="${field}" transform="translate(6 10)" style="fill:${INK};opacity:.16;filter:url(#cw-blur3)"/><clipPath id="mc-nb"><path d="${field}"/></clipPath>`;
  // neighbours: their lumens inset from the shared middle lamellae, offset like bricks
  let nb = `<path d="${field}${lam}" style="fill:url(#cw-wall) ${T('elev-low')};fill-rule:evenodd"/>`;
  const cellsN = [[x0 - pad - 60, y0 - pad - 40, x0, y0 + h * 0.46], [x0 - pad - 60, y0 + h * 0.46, x0, y1 + pad + 40], [x1, y0 - pad - 40, x1 + pad + 60, y0 + h * 0.6], [x1, y0 + h * 0.6, x1 + pad + 60, y1 + pad + 40],
    [x0, y0 - pad - 60, x0 + w * 0.42, y0], [x0 + w * 0.42, y0 - pad - 60, x1, y0], [x0, y1, x0 + w * 0.62, y1 + pad + 60], [x0 + w * 0.62, y1, x1, y1 + pad + 60]];
  let lm = '', gaps = '';
  for (const [ax, ay, bx, by] of cellsN) {
    const d = rr(ax + ww, ay + ww, bx - ax - 2 * ww, by - ay - 2 * ww, ww * 1.6);
    nb += `<path d="${d}" style="fill:url(#cw-cytoG) ${mx('sea-shallow', W_, 30)}"/><path d="${rr(ax + ww + strip, ay + ww + strip, bx - ax - 2 * ww - 2 * strip, by - ay - 2 * ww - 2 * strip, ww * 2)}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 50)};opacity:.85"/>`;
    lm += rr(ax, ay, bx - ax, by - ay, ww * 1.4);
  }
  for (const [gx, gy] of [[x0, y0 + h * 0.46], [x1, y0 + h * 0.6], [x0 + w * 0.42, y0], [x0 + w * 0.62, y1], [x0, y0], [x1, y0], [x0, y1], [x1, y1]]) gaps += `<path d="M${n1(gx - ww * 1.1)} ${n1(gy - ww * 0.7)}L${n1(gx + ww * 1.1)} ${n1(gy - ww * 0.7)}L${n1(gx)} ${n1(gy + ww * 1.2)}Z" style="fill:${mx('sea-shallow', W_, 60)};stroke:${STAIN.cellD};stroke-width:1"/>`;
  nb += `<path d="${lm}" style="fill:none;stroke:${STAIN.cellD};stroke-width:1.3;opacity:.8"/>${gaps}`;
  s += G(P('wall') * 0.62, `<g clip-path="url(#mc-nb)">${nb}</g><path d="${field}" style="fill:none;stroke:${mx('strata-5', INK, 30)};stroke-width:1.6;opacity:.5"/>`);
  // this cell's own wall, lit at top left; the middle lamella at its outer edge
  s += G(P('wall'), `<path d="${lam}${inner}" style="fill:url(#cw-wall) ${T('elev-low')};fill-rule:evenodd"/><path d="${lam}" style="fill:none;stroke:${STAIN.cellD};stroke-width:1.6"/><path d="${rr(x0 + ww * 0.45, y0 + ww * 0.45, w - ww * 0.9, h - ww * 0.9, ww * 1.1)}" style="fill:none;stroke:${mx('elev-low', W_, 40)};stroke-width:1.4;opacity:.7"/>`);
  // the thin layer of cytoplasm all round the inside of the wall
  const vx0 = x0 + ww + strip, vy0 = y0 + ww + strip, vw = w - 2 * (ww + strip), vh = h - 2 * (ww + strip), vd = rr(vx0, vy0, vw, vh, ww * 2.2);
  let c = `<path d="${inner}${vd}" style="fill:url(#cw-cytoG) ${mx('sea-shallow', W_, 20)};fill-rule:evenodd"/>${grainIn(inner + vd, x0, y0, w, h, 0.3).replace('<path d=', '<path style="clip-rule:evenodd" d=')}`;
  for (let i = 0; i < 26; i++) { const t = q(), side = Math.floor(q() * 4), u = ww + strip * (0.3 + q() * 0.4); const px = side < 2 ? x0 + 12 + t * (w - 24) : side === 2 ? x0 + u : x1 - u, py = side >= 2 ? y0 + 12 + t * (h - 24) : side === 0 ? y0 + u : y1 - u; c += ribosome(px, py, 1.6); }
  c += mitochondrion(x0 + ww + strip * 0.55, y + h * 0.22, 0.09, { rot: 90, seed: 2 }) + mitochondrion(x - w * 0.12, y0 + ww + strip * 0.55, 0.09, { rot: 2, seed: 5 }) + mitochondrion(x + w * 0.2, y1 - ww - strip * 0.55, 0.09, { rot: -4, seed: 6 });
  s += G(P('cyto'), c);
  // one large vacuole filling the rest; its membrane line; a soft highlight
  s += G(P('vac'), `<path d="${vd}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 40)};stroke:${mx('sea-shallow', 'sea-deep', 76)};stroke-width:1.8"/><path d="M${n1(vx0 + vw * 0.08)} ${n1(vy0 + vh * 0.3)}C${n1(vx0 + vw * 0.1)} ${n1(vy0 + vh * 0.1)} ${n1(vx0 + vw * 0.24)} ${n1(vy0 + vh * 0.07)} ${n1(vx0 + vw * 0.44)} ${n1(vy0 + vh * 0.07)}" style="fill:none;stroke:${W_};stroke-width:${n1(Math.max(3, vw * 0.012))};opacity:.8;stroke-linecap:round"/>`);
  // the nucleus, flattened against the right-hand wall inside a small pocket of cytoplasm
  const nr = Math.min(w, h) * 0.085, nx = x1 - ww - nr * 0.78, ny = y + h * 0.16;
  s += G(P('cyto'), `<ellipse cx="${n1(nx - 1)}" cy="${n1(ny)}" rx="${n1(nr * 1.0)}" ry="${n1(nr * 1.34)}" style="fill:${mx('sea-shallow', W_, 26)};stroke:${mx('sea-shallow', 'sea-deep', 76)};stroke-width:1.6"/>`);
  s += G(P('nuc'), `<g transform="translate(${n1(nx)} ${n1(ny)}) scale(.74 1) translate(${n1(-nx)} ${n1(-ny)})">${nucleus(nx, ny, nr, { seed: 9 })}</g>`);
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}

export class MeristemCell extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 680;
  static HEIGHT = 500;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 590;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'A small meristem cell from near a root tip beside a much bigger permanent cell from farther back. The meristem cell has a thin wall, a large nucleus and dense cytoplasm full of small organelles, and no vacuole. The permanent cell has a thicker wall and one large vacuole that fills most of it. Meristem cells sit tightly packed; permanent cells have gaps between them.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Parts of the cells', chips: CHIPS, onChange: () => this.repaint() });
  async setup() {
    await super.setup();
    this.tl.mount(this.root, this);
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'div', label: 'Watch it divide' }], () => { if (this.stepIndex === 4 && !this.isPlaying()) this.play(2.4); });
    this._show();
  }
  enter() { this.tl.set({ lit: null }); this._show(); }
  _show() {
    this.ctl?.show('div', this.stepIndex === 4);
    const row = this.root?.querySelector?.('.tl-row');
    if (row) row.style.display = this.stepIndex === 4 ? 'none' : '';
    this.relayout?.();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs:not(.sim-dom-root--portrait) .tl-row { gap: var(--sim-space-1); } .svs:not(.sim-dom-root--portrait) .tl-row .tl-chip { padding-inline: var(--sim-space-2); } .svs:not(.sim-dom-root--portrait) .tl-chip[data-tl-id="gap"] { max-width: 7.6em; }'; }
  stageHeight(st) { return st.portrait ? 450 : 390; }

  _lit() { return this.tl.any() ? this.tl.lit() : BEAT_LIT[this.stepIndex]; }
  _part() { const lit = this._lit(); return (n) => (lit.length && !lit.includes(n) ? 0.28 : 1); }

  // the division at clock t (0..2.4): the cell glows, a new wall grows across the middle, two cells part slightly
  _divide(x, y, s, t) {
    const u = Math.max(0, Math.min(1, (t - 0.4) / 1.4)), w = Math.min(1, Math.max(0, (t - 1.8) / 0.6));
    if (u < 1) return meriCell(x, y, s, { glow: true, seed: 3, split: u });
    const h = s * 0.5, gap = 2 * w;
    return meriCell(x - h / 2 - gap, y, h, { glow: w < 1, seed: 3, tall: 1.84 }) + meriCell(x + h / 2 + gap, y, h, { glow: w < 1, seed: 4, tall: 1.84 });
  }
  animate(st, t) {
    if (this.stepIndex !== 4) return;
    const L = this._lay(st);
    anim(this, 'div', this._divide(L.mx, L.my, L.ms * 1.3, this.isPlaying() ? t : 2.4));
  }
  _lay(st) {
    const P = st.portrait, W = st.W, H = st.H;
    return P ? { mx: W * 0.5, my: 108, ms: 112, px: W * 0.5, py: 326, pw: 300, ph: 176 } : { mx: W * 0.2, my: H * 0.5, ms: 150, px: W * 0.65, py: H * 0.5, pw: 380, ph: 280 };
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, L = this._lay(st), part = this._part(), fs = P ? 15 : 16;
    let s = `<defs>${stDefs()}</defs>` + depthField(W, H, { tone: 'green', seed: 4 });
    const lab = (x, y, t, ax, ay, o = {}) => (ax != null ? `<path d="M${n1(x)} ${n1(y + (ay > y ? 5 : -14))}L${n1(ax)} ${n1(ay)}" style="stroke:${INK};stroke-width:2.2;fill:none"/><circle cx="${n1(ax)}" cy="${n1(ay)}" r="3.6" style="fill:${INK};stroke:${W_};stroke-width:1.4"/>` : '') + label(x, y, t, { size: fs, ...o });
    if (step === 3) {
      // tightly packed meristem cells beside loosely packed permanent cells
      const n = 3, cs = P ? 60 : 74, gx = P ? W * 0.5 : W * 0.24, gy = P ? 112 : H * 0.48;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += meriCell(gx + (j - 1) * cs, gy + (i - 1) * cs * 0.92, cs, { seed: i * 3 + j, part: (k) => (k === 'wall' ? 1 : part(k) * 0.9) });
      const bx = P ? 20 : W * 0.47, by = P ? 232 : 40, bw = P ? W - 40 : W * 0.5, bh = P ? 176 : H - 80;
      const pc = gridCells(bx, by, bw, bh, { size: P ? 72 : 92, seed: 6, jit: 6 });
      s += `<clipPath id="mc-pc"><rect x="${n1(bx)}" y="${n1(by)}" width="${n1(bw)}" height="${n1(bh)}" rx="26"/></clipPath><g clip-path="url(#mc-pc)"><rect x="${n1(bx)}" y="${n1(by)}" width="${n1(bw)}" height="${n1(bh)}" style="fill:${mx('sea-shallow', W_, 10)}"/>${cells(pc, 'pith', { seed: 7, loose: true, vac: true })}</g>`;
      s += `<rect x="${n1(bx)}" y="${n1(by)}" width="${n1(bw)}" height="${n1(bh)}" rx="26" style="fill:none;stroke:${mx('strata-5', INK, 40)};stroke-width:2.4"/>`;
      const c = pc.reduce((b, k) => (Math.hypot(k.x - (bx + bw / 2), k.y - (by + bh / 2)) < Math.hypot(b.x - (bx + bw / 2), b.y - (by + bh / 2)) ? k : b));
      const gp = c.pts[4];
      s += `<circle cx="${n1(gp[0])}" cy="${n1(gp[1])}" r="${n1(P ? 9 : 11)}" style="fill:none;stroke:${T('gold')};stroke-width:3;opacity:${part('gap')}"/>`;
      s += lab(P ? W * 0.5 : gx, P ? 26 : 50, 'meristem cells', null, null, { display: true, size: P ? 17 : 19 });
      s += P ? lab(gx + cs * 1.5 + 6, gy + 5, 'no gaps', null, null, { anchor: 'start' }) : lab(gx, gy + cs * 1.62, 'no gaps', null, null);
      s += lab(P ? W * 0.5 : bx + bw / 2, P ? by - 12 : by + bh + 28, 'permanent cells', null, null, { display: true, size: P ? 17 : 19 });
      s += lab(P ? W * 0.62 : bx + bw * 0.74, P ? by + bh + 30 : by + bh * 0.92, 'intercellular space', gp[0], gp[1] + (P ? 8 : 10));
      return { svg: cwFrame(st, 'mc', s) };
    }
    // two cells side by side (or stacked on a phone)
    if (step === 4) s += `<g data-anim="div">${this._divide(L.mx, L.my, L.ms * 1.3, 2.4)}</g>`;
    else s += meriCell(L.mx, L.my, L.ms, { seed: 3, part });
    s += permCell(L.px, L.py, L.pw, L.ph, { part: step === 4 ? () => 0.4 : part });
    const mTop = L.my - L.ms * 0.46, pTop = L.py - L.ph / 2;
    s += lab(L.mx, P ? 22 : mTop - 52, step === 4 ? 'meristem cell divides' : 'meristem cell', null, null, { display: true, size: P ? 17 : 19 });
    s += lab(L.px, P ? pTop - 14 : pTop - 18, 'permanent cell', null, null, { display: true, size: P ? 17 : 19 });
    if (!P && step < 4) s += lab(L.mx, mTop - 26, 'near the tip', null, null, { size: 14, ink: T('strata-5') }) + lab(L.px - (step === 0 ? L.pw * 0.24 : 0), L.py + L.ph / 2 + 30, 'from farther back', null, null, { size: 14, ink: T('strata-5') });
    const ms = L.ms, mB = L.my + ms * 0.46;
    if (step === 0) {
      s += lab(L.mx, mB + (P ? 30 : 34), 'thin wall', L.mx - ms * 0.3, mB - 1);
      s += lab(L.px + L.pw * (P ? -0.18 : 0.28), L.py + L.ph / 2 + (P ? 26 : 30), 'thicker wall', L.px + L.pw * (P ? -0.3 : 0.36), L.py + L.ph / 2 - 3);
    }
    if (step === 1) {
      s += lab(L.mx - (P ? ms * 0.95 : 0), P ? L.my - 16 : mB + 34, 'large nucleus', L.mx - ms * 0.12, L.my + ms * 0.12, P ? { anchor: 'middle' } : {});
      s += lab(L.mx + (P ? ms * 0.95 : 0), P ? L.my + 30 : mB + 58, 'dense cytoplasm', L.mx + ms * 0.34, L.my + ms * 0.3);
    }
    if (step === 2) {
      s += lab(L.mx, mB + (P ? 30 : 34), 'no vacuole', null, null);
      s += lab(L.px - L.pw * 0.05, L.py + 6, 'large vacuole', null, null, { size: P ? 16 : 18, display: true });
    }
    return { svg: cwFrame(st, 'mc', s) };
  }
  destroy() { this.tl.destroy(); this.ctl?.destroy(); super.destroy(); }
}
