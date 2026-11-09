// RootTipGrowth - blk-l04-s6. A young root hanging from a germinating seed, cells drawn large, as a time-lapse:
// Play and a time slider (0 to 48 hours) in the scene.
//   new-cells  root cap at the very end; just behind it small dense cells that divide (some show chromosomes);
//              rest at 0 h, Play shows new cells being made and flowing back
//   lengthen   the cells left behind grow longer, the tip is pushed down (a dashed line marks where the tip was);
//              further back the cells stop growing longer. Rest at 24 h
//   ink-marks  a classic experiment: ink marks at equal gaps from the tip. Two roots: at the start and now (48 h);
//              lines join each mark to itself. Only the marks near the tip have moved apart
// The model (made-up numbers, true in kind): cell length h(s) grows with distance s from the tip, 12 px in the
// meristem to 40 px where cells stop growing. Material moves away from the tip at u(s) = v h(s) / 40, so cells
// keep their place in the soil once mature, and every mark is integrated from that one rule.
import { SvgScene, chip, mountEl } from 'simulations/base/kit/SimSvg.js';
import { tapMin } from '../shared/TapMin.js';
import { PLANT_COLOR_MAP, stroke } from '../shared/PlantArt.js';
import { cwFrame, blobPath, T, mx, n1, rnd } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
const CAP = 24, MER = 74, ELO = 176, H0 = 12, H1 = 40, V = 2.7, T_END = 48, L0 = 210;
const REST = [0, 24, 48];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const sstep = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const hOf = (s) => (s < MER ? H0 : H0 + (H1 - H0) * sstep(MER, ELO, s));
const uOf = (s) => (s < CAP ? 0 : (V * hOf(s)) / H1);
const hash = (i, j) => { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };
/** Where a mark that started at s0 (distance from the tip) is after t hours. */
function markAt(s0, t) { let s = s0; const n = Math.ceil(t * 2); const dt = n ? t / n : 0; for (let i = 0; i < n; i++) s += uOf(s) * dt; return s; }
/** Cell boundaries (distance from the tip) behind the cap at time t; m is each cell's own number. */
function walls(t, L) {
  const out = [], step = 0.5, rt = (V / H1) * t, ph = rt - Math.floor(rt);
  let s = CAP, N = 0, j = 0, guard = 0;
  out.push({ s: CAP, m: null });
  while (s < L + 40 && guard++ < 4000) {
    const target = j + ph;
    while (N < target && s < L + 40) { N += step / hOf(s); s += step; }
    if (s >= L + 40) break;
    out.push({ s, m: j - Math.floor(rt) });
    j++;
  }
  return out;
}
const CSS = `.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }
.rt-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px 2px; }
.rt-row button { min-height: var(--tap-min, 44px); min-width: 84px; padding: 6px 14px; border-radius: var(--sim-radius-pill); border: var(--sim-border); border-color: var(--sim-accent);
  background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); color: var(--sim-label); font: 800 var(--sim-text-md)/1.1 var(--sim-font); cursor: pointer;
  box-shadow: 0 calc(3px * var(--look-lip, 1)) 0 var(--sim-accent); }
.rt-row output { font: 800 var(--sim-text-lg)/1 var(--sim-font-display, var(--sim-font)); color: var(--sim-label); min-width: 58px; text-align: right; }
.rt-row input { flex: 1 1 auto; min-height: var(--tap-min, 44px); accent-color: var(--sim-accent); cursor: pointer; }`;

/** The root at time t: (cx, top) where it leaves the seed, wd its width. o.marks: [s0...] ink marks; o.dim zones.
 * Cells in radial files with walls that have thickness, shaded cytoplasm; meristem cells small and dense with big
 * nuclei; a vacuole that grows as a cell lengthens; root hairs as outgrowths of single outer cells in the older part;
 * a root cap of loose cells, the outermost sloughing off. */
function rootSvg(cx, top, wd, t, o = {}) {
  const L = L0 + V * t, tipY = top + L, Y = (s) => tipY - s, ncol = o.cols ?? 7, cw = wd / ncol, id = o.id ?? 'rt';
  const half = (s) => (wd / 2) * Math.min(1, 0.32 + 0.68 * Math.sqrt(clamp01(s / 46)));
  const left = [], right = [];
  for (let s = 0; s <= L + 2; s += 4) { left.push([cx - half(s), Y(s)]); right.push([cx + half(s), Y(s)]); }
  const outline = `M${n1(cx)} ${n1(tipY + 3)}` + left.map((p) => `L${n1(p[0])} ${n1(p[1])}`).join('') + right.reverse().map((p) => `L${n1(p[0])} ${n1(p[1])}`).join('') + 'Z';
  const zone = (s) => (s < CAP ? 'cap' : s < MER ? 'mer' : s < ELO ? 'elo' : 'mat');
  const op = (z) => (o.dim && o.dim(z) ? 0.35 : 1);
  const WALL = mx('elev-low', INK, 40), WALL_L = mx('elev-low', W_, 30);
  let s = `<path d="${outline}" transform="translate(6 8)" style="fill:${INK};opacity:.24;filter:url(#cw-blur3)"/>`;
  // root hairs: each one grows out of a single outer cell, only in the part that has stopped growing longer
  const q = rnd(4);
  let hairs = '', bulbs = '';
  for (let ss = ELO + 14; ss < L - 6; ss += 9) for (const sd of [-1, 1]) {
    if (q() < 0.25) continue;
    const y0 = Y(ss) + (q() - 0.5) * 4, l = Math.min(1, (ss - ELO) / 60) * (18 + q() * 26), x0 = cx + sd * (half(ss) - 3);
    if (l < 4) continue;
    hairs += `M${n1(x0)} ${n1(y0)}c${n1(sd * l * 0.4)} ${n1(l * 0.05)} ${n1(sd * l * 0.8)} ${n1(-l * 0.12)} ${n1(sd * l)} ${n1(-l * 0.42)}`;
    bulbs += `<ellipse cx="${n1(x0 + sd * 2)}" cy="${n1(y0)}" rx="4" ry="3" style="fill:${mx('strata-1', W_, 56)}"/>`;
  }
  const hz = `<path d="${hairs}" ${stroke(mx('strata-2', INK, 30), 4.2, 'stroke-linecap:round')}/><path d="${hairs}" ${stroke(mx('strata-1', W_, 56), 2.4, 'stroke-linecap:round')}/>${bulbs}`;
  s += `<g opacity="${op('mat')}">${hz}</g>`;
  s += `<path d="${outline}" style="fill:${WALL_L}"/><clipPath id="${id}-c"><path d="${outline}"/></clipPath><g clip-path="url(#${id}-c)">`;
  // cells, row by row from the cap back; column walls wander a little from row to row, as real files do
  const ws = walls(t, L);
  for (let i = 0; i + 1 < ws.length; i++) {
    const a = ws[i].s, b = ws[i + 1].s, m = ws[i + 1].m ?? i, z = zone((a + b) / 2), h = b - a;
    if (a > L + 4) break;
    const yTop = Y(b), dense = z === 'mer' ? 1 : z === 'elo' ? 1 - sstep(MER, ELO, (a + b) / 2) : 0;
    const cyto = mx(mx('membrane', W_, 30), mx('strata-1', W_, 46), n1(24 + dense * 70));
    let row = '';
    const xs = [];
    for (let c = 0; c <= ncol; c++) xs.push(cx - wd / 2 + c * cw + (c > 0 && c < ncol ? (hash(m, c + 9) - 0.5) * cw * 0.22 : 0));
    for (let c = 0; c < ncol; c++) {
      const x0 = xs[c], w = xs[c + 1] - x0, inset = 1.6, cxm = x0 + w / 2, cym = yTop + h / 2, r = Math.min(5, h * 0.3, w * 0.3);
      row += `<rect x="${n1(x0 + inset)}" y="${n1(yTop + inset)}" width="${n1(w - 2 * inset)}" height="${n1(Math.max(1, h - 2 * inset))}" rx="${n1(r)}" style="fill:url(#rt-cy) ${cyto};stroke:${WALL};stroke-width:2.6"/>`;
      row += `<path d="M${n1(x0 + inset + 2)} ${n1(yTop + h - inset - 2)}V${n1(yTop + inset + 2)}H${n1(x0 + w - inset - 2)}" style="fill:none;stroke:${W_};stroke-width:1.1;opacity:.6"/>`;
      // vacuole: none in the meristem, growing to fill the cell as it lengthens
      const vf = 1 - dense;
      if (vf > 0.08 && h > 10) { const vw = w * (0.3 + 0.38 * vf), vh = (h - 8) * (0.3 + 0.6 * vf); row += `<rect x="${n1(cxm - vw / 2 - (z === 'mat' ? w * 0.06 : 0))}" y="${n1(cym - vh / 2)}" width="${n1(vw)}" height="${n1(vh)}" rx="${n1(Math.min(vw, vh) * 0.45)}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 30)};stroke:${mx('sea-shallow', INK, 76)};stroke-width:.8;opacity:${n1(0.4 + 0.6 * vf)}"/>`; }
      const nr = Math.min(w, 16) * (0.36 - 0.16 * vf), dividing = z === 'mer' && hash(m, c) < 0.22;
      const nx = vf > 0.5 ? x0 + w - nr - 4 : cxm, ny = vf > 0.5 ? yTop + Math.max(nr + 4, h * 0.3) : cym;
      if (dividing) row += `<path d="M${n1(cxm - nr * 1.1)} ${n1(cym)}h${n1(nr * 2.2)}" ${stroke(mx('series-5', INK, 60), 3.2)}/><path d="M${n1(cxm - nr)} ${n1(cym - 3)}l${n1(nr * 0.4)} 6M${n1(cxm)} ${n1(cym - 3)}v6M${n1(cxm + nr)} ${n1(cym - 3)}l${n1(-nr * 0.4)} 6" ${stroke(mx('series-5', INK, 50), 1.6)}/>`;
      else row += `<circle cx="${n1(nx)}" cy="${n1(ny)}" r="${n1(nr)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 55)};stroke-width:1"/><circle cx="${n1(nx - nr * 0.3)}" cy="${n1(ny - nr * 0.3)}" r="${n1(nr * 0.26)}" style="fill:${W_};opacity:.5"/>`;
    }
    s += `<g opacity="${op(z)}">${row}</g>`;
  }
  // grain over the dense meristem
  s += `<rect x="${n1(cx - wd / 2)}" y="${n1(Y(MER))}" width="${n1(wd)}" height="${n1(MER - CAP)}" style="fill:${mx('series-5', INK, 60)};opacity:${n1(0.22 * op('mer'))};filter:url(#cw-grain)"/>`;
  // the root cap: loose rounded cells in curved layers over the tip
  let cap = '';
  const qc = rnd(8);
  for (let k = 0; k < 3; k++) {
    const r0 = CAP - k * 6, n = 5 + k * 2;
    for (let j = 0; j < n; j++) {
      const u = (j + 0.5) / n, sx = (u - 0.5) * 2, hw = half(r0) * 0.92, px = cx + sx * hw, py = Y(r0) + (1 - sx * sx) * (r0 - 3) + k * 2;
      cap += `<path d="${blobPath(px, py, Math.max(4, hw / n * 1.1), 5 + qc() * 1.6, 3 + j + k * 7, 0.12, 7)}" style="fill:url(#rt-cap) ${mx('strata-1', W_, 60)};stroke:${mx('strata-2', INK, 46)};stroke-width:1.4"/>`;
    }
  }
  s += `<g opacity="${op('cap')}">${cap}</g></g>`;
  s += `<path d="${outline}" style="fill:none;stroke:${mx('strata-2', INK, 54)};stroke-width:3"/><path d="M${n1(cx - wd / 2 + 6)} ${n1(top + 4)}V${n1(tipY - 40)}" ${stroke(W_, 4, 'opacity:.4')}/>`;
  // outer cap cells coming loose and left behind in the soil
  let slough = '';
  for (let j = 0; j < 6; j++) { const sd = j % 2 ? 1 : -1, px = cx + sd * (half(8 + j * 6) + 5 + qc() * 8), py = tipY - 4 - j * 7 + qc() * 4; slough += `<path d="${blobPath(px, py, 5 + qc() * 2, 4, 20 + j, 0.16, 7)}" style="fill:${mx('strata-1', W_, 66)};stroke:${mx('strata-2', INK, 46)};stroke-width:1.2;opacity:.9"/>`; }
  s += `<g opacity="${op('cap')}">${slough}</g>`;
  // ink marks
  const marks = [];
  for (const s0 of o.marks ?? []) {
    const sm = markAt(s0, t), y = Y(sm);
    marks.push(y);
    s += `<path d="M${n1(cx - half(sm) - 2)} ${n1(y)}H${n1(cx + half(sm) + 2)}" ${stroke(mx('series-1', INK, 30), 4.5)}/>`;
  }
  return { svg: s, tipY, marks };
}
/** The whole seedling, small, on its own card: a bean whose seed coat has split; the radicle curves down, root
 * hairs above its tip; a tiny shoot hook arches up out of the split. */
function seedling(x, y, t, k) {
  const coat = mx('strata-2', 'series-6', 70), cot = mx('strata-1', W_, 40), len = (70 + t * 1.1) * k;
  const rx0 = x + 30 * k, ry0 = y + 10 * k, tipX = rx0 - 10 * k, tipY = ry0 + len;
  const rad = `M${n1(rx0)} ${n1(ry0)}C${n1(rx0 + 16 * k)} ${n1(ry0 + len * 0.3)} ${n1(tipX + 4 * k)} ${n1(tipY - len * 0.4)} ${n1(tipX)} ${n1(tipY)}`;
  let s = `<rect x="${n1(x - 66 * k)}" y="${n1(y - 58 * k)}" width="${n1(132 * k)}" height="${n1(tipY - y + 76 * k)}" rx="14" style="fill:${mx('strata-1', W_, 70)};stroke:${mx('strata-2', INK, 40)};stroke-width:2"/>`;
  s += `<ellipse cx="${n1(x + 4)}" cy="${n1(y + 14 * k)}" rx="${n1(46 * k)}" ry="${n1(16 * k)}" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/>`;
  // radicle, tapering, root hairs above the tip
  s += `<path d="${rad}" ${stroke(mx('strata-2', INK, 50), 10 * k, 'stroke-linecap:round')}/><path d="${rad}" ${stroke(mx('strata-1', W_, 60), 7 * k, 'stroke-linecap:round')}/><path d="${rad}" transform="translate(-1.5 0)" ${stroke(W_, 2 * k, 'opacity:.6')}/>`;
  const q = rnd(6);
  for (let i = 0; i < 14; i++) { const u = 0.38 + i * 0.03, yy = ry0 + len * u, xx = rx0 + 12 * k * Math.sin(u * 3) - 10 * k * u, sd = i % 2 ? 1 : -1, l = (6 + q() * 6) * k; s += `<path d="M${n1(xx + sd * 3 * k)} ${n1(yy)}q${n1(sd * l * 0.6)} ${n1(-1 * k)} ${n1(sd * l)} ${n1(-l * 0.6)}" ${stroke(mx('strata-1', INK, 30), 1.2)}/>`; }
  // the bean: two cotyledons showing where the coat has split, coat halves curling back
  const bean = (dx, sd) => `M${n1(x + dx - 42 * k)} ${n1(y - 2 * k)}C${n1(x + dx - 44 * k)} ${n1(y - 32 * k)} ${n1(x + dx + 34 * k)} ${n1(y - 36 * k)} ${n1(x + dx + 40 * k)} ${n1(y - 6 * k)}C${n1(x + dx + 42 * k)} ${n1(y + 16 * k)} ${n1(x + dx + 12 * k)} ${n1(y + 24 * k)} ${n1(x + dx)} ${n1(y + 12 * k)}C${n1(x + dx - 14 * k)} ${n1(y + 22 * k)} ${n1(x + dx - 40 * k)} ${n1(y + 18 * k)} ${n1(x + dx - 42 * k)} ${n1(y - 2 * k)}Z`;
  s += `<path d="${bean(0)}" style="fill:${cot};stroke:${mx(cot, INK, 56)};stroke-width:2"/><path d="M${n1(x - 6 * k)} ${n1(y - 26 * k)}C${n1(x + 2 * k)} ${n1(y - 10 * k)} ${n1(x + 4 * k)} ${n1(y + 4 * k)} ${n1(x)} ${n1(y + 12 * k)}" ${stroke(mx(cot, INK, 50), 1.8)}/>`;
  s += `<path d="M${n1(x - 44 * k)} ${n1(y)}C${n1(x - 46 * k)} ${n1(y - 32 * k)} ${n1(x - 18 * k)} ${n1(y - 38 * k)} ${n1(x - 6 * k)} ${n1(y - 30 * k)}C${n1(x - 20 * k)} ${n1(y - 20 * k)} ${n1(x - 20 * k)} ${n1(y + 10 * k)} ${n1(x - 8 * k)} ${n1(y + 20 * k)}C${n1(x - 26 * k)} ${n1(y + 24 * k)} ${n1(x - 42 * k)} ${n1(y + 18 * k)} ${n1(x - 44 * k)} ${n1(y)}Z" style="fill:url(#rt-seed) ${coat};stroke:${mx(coat, INK, 50)};stroke-width:2"/>`;
  s += `<path d="M${n1(x + 44 * k)} ${n1(y - 6 * k)}C${n1(x + 44 * k)} ${n1(y - 30 * k)} ${n1(x + 22 * k)} ${n1(y - 38 * k)} ${n1(x + 12 * k)} ${n1(y - 34 * k)}C${n1(x + 24 * k)} ${n1(y - 24 * k)} ${n1(x + 28 * k)} ${n1(y)} ${n1(x + 22 * k)} ${n1(y + 16 * k)}C${n1(x + 36 * k)} ${n1(y + 14 * k)} ${n1(x + 44 * k)} ${n1(y + 6 * k)} ${n1(x + 44 * k)} ${n1(y - 6 * k)}Z" style="fill:url(#rt-seed) ${coat};stroke:${mx(coat, INK, 50)};stroke-width:2"/>`;
  s += `<path d="M${n1(x - 36 * k)} ${n1(y - 20 * k)}C${n1(x - 30 * k)} ${n1(y - 30 * k)} ${n1(x - 20 * k)} ${n1(y - 32 * k)} ${n1(x - 12 * k)} ${n1(y - 30 * k)}" ${stroke(W_, 3 * k, 'opacity:.5')}/>`;
  // the shoot hook: a short pale stem arching up out of the split, its tip bent back down
  const hook = `M${n1(x + 6 * k)} ${n1(y - 26 * k)}C${n1(x + 4 * k)} ${n1(y - 44 * k)} ${n1(x + 22 * k)} ${n1(y - 52 * k)} ${n1(x + 26 * k)} ${n1(y - 40 * k)}`;
  s += `<path d="${hook}" ${stroke(mx('elev-low', INK, 50), 7 * k, 'stroke-linecap:round')}/><path d="${hook}" ${stroke(mx('elev-low', W_, 50), 4.4 * k, 'stroke-linecap:round')}/>`;
  return { svg: s, tip: [tipX, tipY] };
}
/** Soil around the zoomed root: loam with sand grains, clay crumbs and a few pores; quiet. */
function soil(W, H, seed = 3) {
  const q = rnd(seed);
  let s = `<rect width="${W}" height="${H}" style="fill:url(#rt-soil)"/>`;
  for (let i = 0; i < 70; i++) {
    const x = q() * W, y = q() * H, r = 3 + q() * 7, d = blobPath(x, y, r, r * (0.6 + q() * 0.3), 30 + i, 0.24, 6);
    const kind = i % 3;
    s += `<path d="${d}" style="fill:${kind === 0 ? mx('strata-1', W_, 40) : kind === 1 ? mx('strata-3', 'strata-2', 50) : mx('strata-4', 'strata-3', 40)};opacity:${n1(0.35 + q() * 0.3)}"/>`;
    if (kind === 0) s += `<path d="M${n1(x - r * 0.5)} ${n1(y - r * 0.3)}q${n1(r * 0.4)} ${n1(-r * 0.4)} ${n1(r * 0.8)} 0" ${stroke(W_, 1, 'opacity:.4')}/>`;
  }
  for (let i = 0; i < 12; i++) s += `<ellipse cx="${n1(q() * W)}" cy="${n1(q() * H)}" rx="${n1(4 + q() * 6)}" ry="${n1(2 + q() * 3)}" style="fill:${mx('sea-shallow', W_, 40)};opacity:.3"/>`;
  return s;
}
export class RootTipGrowth extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 556;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 616;
  static MIN_SCALE = 0.85;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'A young root growing down from a seed, its cells drawn large. A root cap covers the tip; just behind it small cells divide; behind them cells grow longer and push the tip down; further back cells stop growing longer. In a classic experiment, ink marks drawn at equal gaps from the tip: after two days only the marks near the tip have moved apart.';
  static CONTROLS = [];

  async setup() {
    this._t = 0; this._from = null; this._busyDraw = false;
    await super.setup(); tapMin(this);
    const row = mountEl(this.root, 'rt-row');
    row.innerHTML = '<button type="button">Play</button><input type="range" min="0" max="48" step="1" value="0" aria-label="Time in hours"><output>0 h</output>';
    this._btn = row.querySelector('button'); this._in = row.querySelector('input'); this._out = row.querySelector('output');
    this._btn?.addEventListener('click', () => this._play());
    this._in?.addEventListener('input', () => { this.skip?.(); this._from = null; this._t = Number(this._in.value) || 0; this.repaint(); });
    this.enter(this.stepIndex ?? 0);
    this.repaint();
  }
  enter(step) { this._from = null; this._t = REST[step] ?? 0; }
  stageHeight(st) { return st.portrait ? 440 : 400; }
  css() { return CSS; }
  _play() {
    this._from = this._t >= T_END - 0.5 ? 0 : this._t;
    this._len = 4 * (T_END - this._from) / T_END + 0.2;
    this.play(this._len);
  }
  animate(st, clock) {
    if (this._from == null || this._busyDraw) return;
    const len = this._len ?? 4;
    this._t = Math.min(T_END, this._from + (T_END - this._from) * clamp01(clock / Math.max(0.1, len - 0.2)));
    if (clock >= len - 0.01) this._from = null;
    this._busyDraw = true;
    try { this.repaint(); } finally { this._busyDraw = false; }
  }

  paint(st) {
    const step = this.stepIndex, W = st.W, H = st.H, P = st.portrait, t = this._t ?? 0;
    if (this._in && Number(this._in.value) !== Math.round(t)) this._in.value = String(Math.round(t));
    if (this._out) this._out.textContent = `${Math.round(t)} h`;
    let s = `<defs><radialGradient id="rt-seed" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:${mx(mx('strata-2', 'series-6', 70), W_, 50)}"/><stop offset="1" style="stop-color:${mx(mx('strata-2', 'series-6', 70), INK, 60)}"/></radialGradient>`
      + `<linearGradient id="rt-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-shallow', W_, 14)}"/><stop offset="1" style="stop-color:${mx('sea-shallow', W_, 30)}"/></linearGradient>`
      + `<radialGradient id="rt-cy" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:${W_};stop-opacity:.5"/><stop offset=".6" style="stop-color:${W_};stop-opacity:0"/><stop offset="1" style="stop-color:${INK};stop-opacity:.12"/></radialGradient>`
      + `<radialGradient id="rt-cap" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:${mx('strata-1', W_, 80)}"/><stop offset="1" style="stop-color:${mx('strata-1', W_, 46)}"/></radialGradient>`
      + `<linearGradient id="rt-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('strata-3', 'strata-2', 40)}"/><stop offset="1" style="stop-color:${mx('strata-4', 'strata-3', 50)}"/></linearGradient></defs>`;
    if (step < 2) s += soil(W, H, 3);
    else {
      // damp blotting paper behind the two roots: soft fibres
      s += `<rect width="${W}" height="${H}" style="fill:url(#rt-bg)"/>`;
      const q = rnd(2);
      let fib = '';
      for (let i = 0; i < 40; i++) { const x = q() * W, y = q() * H; fib += `M${n1(x)} ${n1(y)}q${n1((q() - 0.5) * 30)} ${n1((q() - 0.5) * 10)} ${n1((q() - 0.5) * 50)} ${n1((q() - 0.5) * 20)}`; }
      s += `<path d="${fib}" ${stroke(W_, 1.4, 'opacity:.5')}/>`;
    }
    const top = -12;
    let over = '';
    const ruled = (x, y, w) => `<path d="M${n1(x - w / 2 - 14)} ${n1(y)}H${n1(x + w / 2 + 14)}" ${stroke(INK, 2, 'stroke-dasharray:6 5;opacity:.6')}/>`;
    const bracket = (x, y0, y1, col) => `<path d="M${n1(x)} ${n1(y0)}h8V${n1(y1)}h-8" ${stroke(col, 3)}/>`;
    if (step < 2) {
      // the tip drawn large: the root's own model, scaled up about its top so it fills the stage
      const K = step === 0 ? 1.9 : 1.36, cx = W * (P ? 0.4 : 0.47), wd0 = P ? 112 : 146, wd = wd0 * K, L = L0 + V * t;
      const dim = step === 0 ? (z) => z === 'elo' || z === 'mat' : (z) => z === 'cap';
      const rTop = step === 0 ? H - 30 - L * K : top;
      const r0 = rootSvg(cx, rTop, wd0, t, { id: 'r1', dim, cols: P ? 6 : 7 });
      const r = { tipY: rTop + (r0.tipY - rTop) * K };
      if (!P) { const sd = seedling(80, 80, t, 0.9); s += sd.svg + `<rect x="${n1(sd.tip[0] - 14)}" y="${n1(sd.tip[1] - 34)}" width="28" height="42" rx="6" ${stroke(INK, 2.6, 'stroke-dasharray:5 4')}/><path d="M${n1(sd.tip[0] + 14)} ${n1(sd.tip[1] - 34)}L${n1(cx - wd / 2 - 8)} ${n1(Math.max(14, rTop + 20))}M${n1(sd.tip[0] + 14)} ${n1(sd.tip[1] + 8)}L${n1(cx - wd / 2 - 8)} ${n1(r.tipY)}" ${stroke(W_, 2, 'stroke-dasharray:6 5;opacity:.7')}/>`; over += chip('the seedling', 80, 18, { tone: 'plain', cls: 'sv-chip--sm' }); }
      s += `<g transform="translate(${n1(cx * (1 - K))} ${n1(rTop * (1 - K))}) scale(${K})">${r0.svg}</g>`;
      const bx = cx + wd / 2 + 14, Y = (sv) => r.tipY - sv * K;
      if (step === 0) {
        s += bracket(bx, Y(MER), Y(CAP), mx('series-5', INK, 30)) + bracket(bx, Y(CAP), r.tipY + 3, mx('strata-2', INK, 30));
        over += chip('dividing cells', Math.min(W - 66, bx + 70), Y((CAP + MER) / 2), { tone: 5 }) + chip('root cap', Math.min(W - 50, bx + 54), Y(CAP / 2) + 8, { tone: 'plain' }) + chip('apical meristem', Math.min(W - 70, bx + 78), Y(MER) - 24, { tone: 'plain', cls: 'sv-chip--sm' });
      } else {
        const tip0 = top + L0 * K, bm = bx + (P ? 30 : 44);
        s += ruled(cx, tip0, wd) + bracket(bx, Y(ELO), Y(MER), mx('series-3', INK, 30)) + bracket(bm, Math.max(top + 20, Y(ELO + 120)), Y(ELO), mx('strata-5', INK, 30));
        over += chip('cells grow longer', Math.min(W - 80, bx + 82), Y((MER + ELO) / 2), { tone: 3 }) + chip(P ? 'stop growing' : 'stopped growing', Math.min(W - (P ? 66 : 76), bm + (P ? 62 : 82)), Math.max(top + 70, Y(ELO + 34)), { tone: 'plain' }) + chip('root hairs', Math.min(W - 50, bm + 56), Math.max(top + 30, Y(ELO + 104)), { tone: 'plain', cls: 'sv-chip--sm' });
        over += chip('tip at the start', Math.max(80, cx - wd / 2 - 70), tip0 - 16, { tone: 'plain', cls: 'sv-chip--sm' });
        if (t > 8) s += `<path d="M${n1(cx)} ${n1(tip0 + 8)}V${n1(r.tipY - 10)}" ${stroke(mx('series-6', INK, 30), 3)}/><path d="M${n1(cx)} ${n1(r.tipY - 2)}l-7 -11h14z" style="fill:${mx('series-6', INK, 30)}"/>`;
      }
    } else {
      const wd = P ? 76 : 96, xa = W * (P ? 0.27 : 0.3), xb = W * (P ? 0.72 : 0.66), marks = [];
      for (let i = 0; i < 8; i++) marks.push(6 + i * 26);
      const a = rootSvg(xa, top, wd, 0, { id: 'ra', marks, cols: 5 }), b = rootSvg(xb, top, wd, t, { id: 'rb', marks, cols: 5 });
      s += `<g opacity=".9">${a.svg}</g>${b.svg}`;
      a.marks.forEach((ya, i) => { const yb = b.marks[i], moved = Math.abs(yb - ya) > 3; s += `<path d="M${n1(xa + wd / 2 + 4)} ${n1(ya)}L${n1(xb - wd / 2 - 4)} ${n1(yb)}" ${stroke(moved ? mx('series-6', INK, 30) : INK, moved ? 2.4 : 1.6, `stroke-dasharray:4 4;opacity:${moved ? 0.9 : 0.45}`)}/>`; });
      over += chip('start: equal gaps', xa, top + L0 + 26, { tone: 'plain' }) + chip(`after ${Math.round(t)} hours`, xb, Math.min(H - 20, b.tipY + 26), { tone: 'plain' });
      if (t >= 24) over += chip('only these spread', Math.min(W - 76, xb + wd / 2 + (P ? -10 : 66)), (b.marks[1] + b.marks[3]) / 2 + (P ? 40 : 0), { tone: 6, cls: 'sv-chip--sm' });
    }
    return { svg: cwFrame(st, 'rt', s), over, head: chip(['New cells at the tip', 'Cells behind grow longer', 'A classic experiment: ink marks'][step], 0, 0, { tone: 'plain', static: true }) };
  }
}
