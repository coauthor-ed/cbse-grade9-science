// SunflowerStem - blk-l06-s1. Book Fig 3.7: a wedge of a young sunflower stem T.S., stained. From the outside in:
// epidermal hairs, cuticle, epidermis, collenchyma, parenchyma, then a ring of bundles (sclerenchyma cap, phloem,
// lateral meristem, xylem) with parenchyma rays between, and pith parenchyma at the centre. An inset shows the whole
// round T.S. with its ring of bundles and where the wedge comes from. Beats: cut, look, outside, middle, bundles, why,
// simple-complex. Tap-to-light chips under the figure on the nine labels.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, label, textureRect, svgLeaf } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { bench } from '../shared/Scapes.js';
import { stDefs, STAIN, pol, sector, polarCells, cells, vessel, sieve, hair } from '../shared/StemArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const NAMES = { hair: 'epidermal hair', cut: 'cuticle', epi: 'epidermis', coll: 'collenchyma', par: 'parenchyma', scl: 'sclerenchyma', phl: 'phloem', camb: 'lateral meristem', xyl: 'xylem' };
const ORDER = ['hair', 'cut', 'epi', 'coll', 'par', 'scl', 'phl', 'camb', 'xyl'];
const TONE = { hair: 'series-1', cut: 'series-2', epi: 'series-3', coll: 'series-4', par: 'series-7', scl: 'series-6', phl: 'series-8', camb: 'series-5', xyl: 'sea-deep' };
const CHIPS = ORDER.map((id) => ({ id, label: NAMES[id], targets: [id] }));
const BEAT_LIT = [[], [], ['hair', 'cut', 'epi'], ['coll', 'par', 'scl'], ['phl', 'camb', 'xyl'], ORDER, ['coll', 'par', 'scl', 'phl', 'xyl']];
const KIND = { coll: 'simple', par: 'simple', scl: 'simple', phl: 'complex', xyl: 'complex' };

function layout(W, H, P) {
  const k = P ? 1 : 1.16, cy = P ? H + 30 : H + 50, R = cy - (P ? 40 : 46), cx = W * (P ? 0.37 : 0.5), half = (P ? 15 : 36) * Math.PI / 180;
  const t = { cut: 4, epi: 15, coll: 34, par: 46, scl: 20, phl: 30, camb: 10, xyl: 62 };
  const r = {}; let q = R;
  for (const id of ['cut', 'epi', 'coll', 'par', 'scl', 'phl', 'camb', 'xyl']) { const d = t[id] * (id === 'cut' ? 1 : k); r[id] = [q - d, q]; q -= d; }
  const bw = P ? 24 : 34, bundles = P ? [0] : [-24, 0, 24].map((d) => d * Math.PI / 180);
  return { R, cx, cy, half, r, bw, bundles, P, W, H, k };
}
// half-width in px of a bundle tissue at radius rr
function bwAt(L, id, rr) {
  if (id === 'scl') { const t = (rr - L.r.scl[0]) / (L.r.scl[1] - L.r.scl[0]); return L.bw * (0.8 + 0.25 * t); }
  if (id === 'xyl') { const t = (rr - L.r.xyl[0]) / (L.r.xyl[1] - L.r.xyl[0]); return L.bw * (0.42 + 0.58 * t); }
  return L.bw;
}
const inBundle = (L, rr, a) => rr <= L.r.scl[1] + 1 && rr >= L.r.xyl[0] - 2 && L.bundles.some((b) => Math.abs(a - b) * rr < bwAt(L, rr > L.r.xyl[1] ? 'phl' : 'xyl', Math.min(rr, L.r.scl[1])) + 3);
function bundlePath(L, id, b) {
  const [r0, r1] = L.r[id], N = 8, pts = [];
  for (let i = 0; i <= N; i++) { const rr = r1 - ((r1 - r0) * i) / N; pts.push(pol(L.cx, L.cy, rr, b + bwAt(L, id, rr) / rr)); }
  for (let i = 0; i <= N; i++) { const rr = r0 + ((r1 - r0) * i) / N; pts.push(pol(L.cx, L.cy, rr, b - bwAt(L, id, rr) / rr)); }
  return `M${pts.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
}

// Every tissue of the wedge: { svg, region (path for tone overlays) }. Built once per layout.
function buildWedge(L) {
  const { cx, cy, R, half, r, k } = L, a0 = -half, a1 = half, out = {};
  const keepOut = (rr, a) => !inBundle(L, rr, a);
  // cuticle: a waxy gold skin with a light edge
  out.cut = { region: sector(cx, cy, r.cut[0], r.cut[1] + 0.5, a0, a1) };
  out.cut.svg = `<path d="${out.cut.region}" style="fill:${STAIN.cut};stroke:${STAIN.cutD};stroke-width:1"/><path d="${sector(cx, cy, r.cut[1] - 1.4, r.cut[1], a0, a1)}" style="fill:${W_};opacity:.6"/>`;
  out.epi = { region: sector(cx, cy, r.epi[0], r.epi[1], a0, a1), svg: cells(polarCells(cx, cy, r.epi[0], r.epi[1], a0, a1, { rows: 1, size: 13 * k, seed: 2, jit: 0.8 }), 'epi', { seed: 3 }) };
  const hairs = [];
  const mids = [];
  for (const f of L.P ? [-0.55, 0.45] : [-0.7, -0.2, 0.36, 0.82]) {
    const a = f * half, p = pol(cx, cy, R, a), dg = (a * 180) / Math.PI + (f < 0 ? -14 : 12), len = L.P ? 30 : 40, ar = (dg * Math.PI) / 180;
    // drawn 1.5x so the 4 stacked cells of each hair read; the base stays on the epidermis
    hairs.push(`<g transform="translate(${n1(p[0])} ${n1(p[1])}) scale(1.5) translate(${n1(-p[0])} ${n1(-p[1])})">${hair(p[0], p[1], dg, len, { bend: f < 0 ? -0.1 : 0.1 })}</g>`);
    mids.push([p[0] + Math.sin(ar) * len * 0.7, p[1] - Math.cos(ar) * len * 0.7]);
  }
  out.hair = { region: '', svg: hairs.join(''), pts: hairs, mid: mids[1] };
  out.coll = { region: sector(cx, cy, r.coll[0], r.coll[1], a0, a1) };
  out.coll.svg = `<path d="${out.coll.region}" style="fill:url(#st-pect) ${STAIN.pect}"/>` + cells(polarCells(cx, cy, r.coll[0], r.coll[1], a0, a1, { rows: 3, size: 11.5 * k, seed: 4, jit: 1 }), 'coll', { seed: 5 });
  // ground parenchyma: cortex, rays between bundles, pith
  const cortex = polarCells(cx, cy, r.par[0], r.par[1], a0, a1, { rows: 3, size: 16 * k, seed: 6, jit: 1.6 });
  const rays = polarCells(cx, cy, r.xyl[0] - 6, r.par[0], a0, a1, { size: 16 * k, seed: 7, jit: 1.6, keep: keepOut });
  const pith = polarCells(cx, cy, 0, r.xyl[0] - 6, a0, a1, { size: 26 * k, seed: 8, jit: 2.4 });
  let bun = '';
  for (const b of L.bundles) bun += bundlePath(L, 'scl', b) + bundlePath(L, 'phl', b) + bundlePath(L, 'camb', b) + bundlePath(L, 'xyl', b);
  out.par = { region: `${sector(cx, cy, 0, r.par[1], a0, a1)}${bun}`, svg: cells(cortex, 'par', { seed: 9, green: true }) + cells(rays, 'par', { seed: 10 }) + cells(pith, 'pith', { seed: 11 }) };
  // bundles
  const per = { scl: '', phl: '', camb: '', xyl: '' }, reg = { scl: '', phl: '', camb: '', xyl: '' };
  L.bundles.forEach((b, bi) => {
    const span = (id) => { const rm = (L.r[id][0] + L.r[id][1]) / 2, w = bwAt(L, id, L.r[id][1]) / rm; return [b - w - 0.04, b + w + 0.04]; };
    const keep = (id) => (rr, a) => Math.abs(a - b) * rr < bwAt(L, id, rr) - 1;
    for (const id of ['scl', 'phl', 'camb', 'xyl']) reg[id] += bundlePath(L, id, b);
    const [s0, s1] = span('scl');
    per.scl += `<path d="${bundlePath(L, 'scl', b)}" style="fill:${STAIN.ligD}"/>` + cells(polarCells(cx, cy, r.scl[0], r.scl[1], s0, s1, { size: 6.5 * k, seed: 12 + bi, jit: 0.6, keep: keep('scl') }), 'scl');
    const [p0, p1] = span('phl'), q = rnd(20 + bi);
    let ph = `<path d="${bundlePath(L, 'phl', b)}" style="fill:${STAIN.gap}"/>` + cells(polarCells(cx, cy, r.phl[0], r.phl[1], p0, p1, { size: 6.5 * k, seed: 14 + bi, jit: 0.6, keep: keep('phl') }), 'phl', { seed: 15 });
    for (let i = 0; i < (L.P ? 4 : 5); i++) { const rr = r.phl[0] + 7 + q() * (r.phl[1] - r.phl[0] - 14), a = b + ((q() - 0.5) * 1.5 * L.bw) / rr, p = pol(cx, cy, rr, a); ph += sieve(p[0], p[1], 4.6 * k, { seed: i + bi * 7, comp: q() * 6 }); }
    per.phl += ph;
    const [c0, c1] = span('camb');
    per.camb += `<path d="${bundlePath(L, 'camb', b)}" style="fill:${STAIN.cellD}"/>` + cells(polarCells(cx, cy, r.camb[0], r.camb[1], c0, c1, { rows: 3, size: 8 * k, seed: 16 + bi, jit: 0.3, keep: keep('camb') }), 'camb', { seed: 17 });
    const [x0, x1] = span('xyl');
    let xy = `<path d="${bundlePath(L, 'xyl', b)}" style="fill:${STAIN.ligD}"/>` + cells(polarCells(cx, cy, r.xyl[0], r.xyl[1], x0 - 0.05, x1 + 0.05, { size: 6 * k, seed: 18 + bi, jit: 0.5, keep: keep('xyl') }), 'fibre');
    // vessels in radial files: large next to the lateral meristem, small towards the pith
    const files = [-0.5, 0.02, 0.52], sizes = [9.5, 7.6, 5.8, 4.2].map((v) => v * k);
    files.forEach((f, fi) => {
      let rr = r.xyl[1] - 10 - (fi === 1 ? 3 : 0);
      sizes.forEach((s, si) => { const w = bwAt(L, 'xyl', rr), a = b + (f * w * 1.1) / rr; if (Math.abs(f * w * 1.1) + s < w + 1) { const p = pol(cx, cy, rr, a); xy += vessel(p[0], p[1], s * (L.P ? 0.9 : 1)); } rr -= s * 2 + 3 + si; });
    });
    per.xyl += xy;
  });
  for (const id of ['scl', 'phl', 'camb', 'xyl']) out[id] = { region: reg[id], svg: per[id] };
  out.base = `<path d="${sector(cx, cy, 0, r.cut[1], a0, a1)}" style="fill:${mx(STAIN.cell, W_, 34)}"/>`;
  out.edge = `<path d="${sector(cx, cy, 0, r.cut[1], a0, a1)}" style="fill:none;stroke:${mx('strata-5', INK, 50)};stroke-width:2.4;stroke-linejoin:round"/>`;
  return out;
}

// x of the wedge outline at height y, on the left or right side
function edgeX(L, y, left) {
  const dy = L.cy - y, side = left ? -1 : 1;
  if (dy <= 0) return L.cx;
  const aEdge = L.half, yArc = L.cy - L.R * Math.cos(aEdge);
  if (y >= yArc) return L.cx + side * dy * Math.tan(aEdge);
  if (dy >= L.R) return L.cx;
  return L.cx + side * Math.sqrt(L.R * L.R - dy * dy);
}

// The whole round T.S.: epidermis, cortex, a ring of bundles, pith; the wedge drawn on it.
function wholeTS(x, y, rad, half, nB = 14) {
  let s = `<circle cx="${n1(x + 3)}" cy="${n1(y + 4)}" r="${n1(rad + 3)}" style="fill:${INK};opacity:.22"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rad)}" style="fill:${mx('strata-1', W_, 30)};stroke:${STAIN.cutD};stroke-width:2.4"/>`;
  s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rad - 3)}" style="fill:none;stroke:${STAIN.cellD};stroke-width:2"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rad - 7)}" style="fill:none;stroke:${STAIN.pect};stroke-width:4"/>`;
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * 6.283, k = i % 2 ? 0.8 : 1, p = (rr) => pol(x, y, rr, a), o = p(rad * 0.66), m = p(rad * 0.55), n = p(rad * 0.4);
    s += `<circle cx="${n1(o[0])}" cy="${n1(o[1])}" r="${n1(rad * 0.07 * k)}" style="fill:${STAIN.lig}"/><circle cx="${n1(m[0])}" cy="${n1(m[1])}" r="${n1(rad * 0.08 * k)}" style="fill:${mx(STAIN.cell, W_, 40)};stroke:${STAIN.cellD};stroke-width:1"/><path d="M${n1(m[0])} ${n1(m[1])}L${n1(n[0])} ${n1(n[1])}" style="stroke:${STAIN.lig};stroke-width:${n1(rad * 0.13 * k)};stroke-linecap:round"/>`;
  }
  if (half) s += `<path d="${sector(x, y, 0, rad, -half, half)}" style="fill:${W_};opacity:.28;stroke:${INK};stroke-width:2"/><path d="M${n1(x - rad * 0.34)} ${n1(y - rad * 0.72)}A${n1(rad)} ${n1(rad)} 0 0 1 ${n1(x - rad * 0.72)} ${n1(y - rad * 0.34)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.7"/>`;
  return s;
}

// A young sunflower stem piece, hairy, with a leaf stalk at a node; a razor cutting across it.
function stemPiece(x, y, h, w) {
  const g = mx('elev-low', 'strata-4', 30), gl = mx('elev-low', W_, 50), gd = mx('elev-low', INK, 56);
  let s = `<defs><linearGradient id="sf-st" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${gd}"/><stop offset=".3" style="stop-color:${gl}"/><stop offset=".62" style="stop-color:${g}"/><stop offset="1" style="stop-color:${gd}"/></linearGradient></defs>`;
  s += `<ellipse cx="${n1(x + 10)}" cy="${n1(y + 4)}" rx="${n1(w * 1.2)}" ry="7" style="fill:${INK};opacity:.28"/>`;
  s += `<path d="M${n1(x - w / 2)} ${n1(y - h)}V${n1(y)}A${n1(w / 2)} ${n1(w / 7)} 0 0 0 ${n1(x + w / 2)} ${n1(y)}V${n1(y - h)}Z" style="fill:url(#sf-st) ${g};stroke:${gd};stroke-width:2"/>`;
  s += `<path d="M${n1(x - w * 0.18)} ${n1(y - h + 8)}V${n1(y - 6)}" style="stroke:${gl};stroke-width:3;opacity:.6"/><path d="M${n1(x + w * 0.22)} ${n1(y - h + 8)}V${n1(y - 6)}" style="stroke:${gd};stroke-width:1.6;opacity:.5"/>`;
  const q = rnd(4); for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, yy = y - h + 6 + q() * (h - 10); s += `<path d="M${n1(x + side * w / 2)} ${n1(yy)}q${n1(side * 5)} -1 ${n1(side * (8 + q() * 5))} ${n1(-5 - q() * 4)}" style="fill:none;stroke:${mx('elev-low', W_, 30)};stroke-width:1.8;stroke-linecap:round"/>`; }
  // fresh cut top: the round face with a ring of bundles
  s += `<ellipse cx="${n1(x)}" cy="${n1(y - h)}" rx="${n1(w / 2)}" ry="${n1(w / 7)}" style="fill:${mx('elev-low', W_, 66)};stroke:${gd};stroke-width:1.6"/>`;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; s += `<circle cx="${n1(x + Math.cos(a) * w * 0.33)}" cy="${n1(y - h + Math.sin(a) * w * 0.33 / 3.5)}" r="1.7" style="fill:${mx('elev-low', INK, 40)}"/>`; }
  return s;
}
function razor(x, y, k) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(-8) scale(${k})"><path d="M-70 -9H52L62 0L52 9H-70Z" style="fill:${mx('strata-5', W_, 46)};stroke:${mx('strata-5', INK, 50)};stroke-width:2"/><path d="M-70 -3H58" style="stroke:${W_};stroke-width:2;opacity:.8"/><rect x="-24" y="-5" width="40" height="10" rx="5" style="fill:${mx('strata-5', W_, 20)};stroke:${mx('strata-5', INK, 40)};stroke-width:1.4"/></g>`;
}
function slideUnder(x, y, w, ts) {
  let s = `<ellipse cx="${n1(x + 6)}" cy="${n1(y + 16)}" rx="${n1(w * 0.56)}" ry="8" style="fill:${INK};opacity:.22"/>`;
  s += `<path d="M${n1(x - w / 2 + 18)} ${n1(y - 14)}H${n1(x + w / 2 + 8)}L${n1(x + w / 2 - 8)} ${n1(y + 12)}H${n1(x - w / 2)}Z" style="fill:${mx('sea-shallow', W_, 24)};opacity:.85;stroke:${mx('sea-shallow', INK, 50)};stroke-width:2.4"/>`;
  s += ts;
  // objective lens of the microscope, coming down from above
  const ox = x, oy = y - 40;
  s += `<path d="M${n1(ox - 30)} ${n1(oy - 150)}H${n1(ox + 30)}V${n1(oy - 60)}L${n1(ox + 18)} ${n1(oy - 14)}H${n1(ox - 18)}L${n1(ox - 30)} ${n1(oy - 60)}Z" style="fill:${mx('strata-5', W_, 40)};stroke:${mx('strata-5', INK, 60)};stroke-width:2.4"/>`;
  s += `<rect x="${n1(ox - 34)}" y="${n1(oy - 96)}" width="68" height="10" rx="3" style="fill:${T('series-6')};opacity:.85"/><path d="M${n1(ox - 22)} ${n1(oy - 146)}V${n1(oy - 66)}" style="stroke:${W_};stroke-width:5;opacity:.55"/>`;
  s += `<ellipse cx="${n1(ox)}" cy="${n1(oy - 14)}" rx="18" ry="4" style="fill:${mx('sea-shallow', W_, 40)};stroke:${INK};stroke-width:1.4"/>`;
  return s;
}

export class SunflowerStem extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5), one(6)];
  static WIDTH = 680;
  static HEIGHT = 576;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 610;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'A stained wedge of a young sunflower stem cut across. From the outside in: epidermal hairs, a thin cuticle, the epidermis, collenchyma with thick pink corners, parenchyma, then a ring of bundles, each with a red sclerenchyma cap, phloem, a thin band of lateral meristem and red xylem vessels, and large pith cells in the middle.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Tissues in the stem', chips: CHIPS, onChange: () => this.repaint() });
  async setup() {
    this._cache = null;
    await super.setup();
    this.tl.mount(this.root, this);
    this._rowShow();
  }
  enter() { this.tl.set({ lit: null }); this._rowShow(); }
  _rowShow() { const row = this.root?.querySelector?.('.tl-row'); if (row) row.style.display = this.stepIndex >= 2 ? '' : 'none'; this.relayout?.(); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs:not(.sim-dom-root--portrait) .tl-row { gap: var(--sim-space-1); } .svs:not(.sim-dom-root--portrait) .tl-row .tl-chip { padding-inline: var(--sim-space-2); } .svs:not(.sim-dom-root--portrait) .tl-chip[data-tl-id="hair"], .svs:not(.sim-dom-root--portrait) .tl-chip[data-tl-id="camb"] { max-width: 5.4em; } .svs:not(.sim-dom-root--portrait) .tl-row .tl-chip { padding-inline: calc(var(--sim-space-1) + 1px); } .sf-key { font: 700 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label); text-align: center; padding: 2px 6px; } .sf-key b { font-weight: 900; } .sf-slice { animation: sf-in 1.1s var(--look-spring-soft, ease) both; } @keyframes sf-in { from { transform: translate(-150px, -40px) rotate(-30deg); opacity: 0.4; } to { transform: none; opacity: 1; } } @media (prefers-reduced-motion: reduce) { .sf-slice { animation: none; } }'; }
  stageHeight(st) { return st.portrait ? 340 : 384; }

  _wedge(L) {
    const key = `${L.W}x${L.H}`;
    if (!this._cache || this._cache.key !== key) this._cache = { key, w: buildWedge(L) };
    return this._cache.w;
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const back = `<rect width="${W}" height="${H}" style="fill:${mx('sea-shallow', W_, 10)}"/><circle cx="${n1(W * 0.3)}" cy="${n1(H * 0.3)}" r="${n1(W * 0.5)}" style="fill:${W_};opacity:.5;filter:url(#pa-softer)"/>${textureRect(0, 0, W, H, 'grain', 0.08)}`;
    const defs = `<defs>${stDefs()}</defs>`;
    if (step === 0) return { svg: cwFrame(st, 'sf', this._cutView(W, H, P, defs)) };
    const L = layout(W, H, P), wg = this._wedge(L);
    const lit = this.tl.any() ? this.tl.lit() : BEAT_LIT[step], dim = (id) => (lit.length && !lit.includes(id) ? 0.26 : 1);
    let s = back + `<clipPath id="sf-wedge"><path d="${sector(L.cx, L.cy, 0, L.R + 1, -L.half, L.half)}"/></clipPath><g clip-path="url(#sf-wedge)">${wg.base}`;
    for (const id of ['par', 'coll', 'epi', 'cut', 'scl', 'phl', 'camb', 'xyl']) {
      s += wg[id].svg;
      if (step === 5 && !this.tl.any() && wg[id].region) s += `<path d="${wg[id].region}" style="fill:${T(TONE[id])};opacity:.3;fill-rule:evenodd"/>`;
      if (dim(id) < 1) s += `<path d="${wg[id].region}" style="fill:${mx('sea-shallow', W_, 8)};opacity:.66;fill-rule:evenodd"/>`;
    }
    s += `</g><g opacity="${dim('hair')}">${wg.hair.svg}${step === 5 && !this.tl.any() ? `<g style="opacity:.5">${wg.hair.pts.map((h) => h.replace(/fill:url\(#st-lum\)[^;]*/g, `fill:${T(TONE.hair)}`)).join('')}</g>` : ''}</g>`;
    s += wg.edge;
    s += wholeTS(P ? 46 : W * 0.13, H - (P ? 72 : 96), P ? 38 : 62, L.half);
    s += label(P ? 52 : W * 0.13, H - 8, 'whole stem', { size: P ? 14 : 15 });
    s += this._labels(L, lit, step, wg);
    return { svg: cwFrame(st, 'sf', defs + s), head: step === 6 && !P ? '<div class="sf-key"><b>simple</b>: one cell type &nbsp; <b>complex</b>: more than one cell type</div>' : '' };
  }

  _labels(L, lit, step, wg) {
    const show = step === 1 ? [] : (this.tl.any() ? this.tl.lit() : lit);
    if (!show.length) return '';
    const { cx, cy, r, half, P, W } = L, fs = P ? 14 : 15.5, out = [];
    const mid = (id) => (id === 'hair' ? L.R + 22 : (r[id][0] + r[id][1]) / 2);
    for (const id of show) {
      const outer = ['hair', 'cut', 'epi', 'coll', 'par'].includes(id), left = !P && outer;
      const rr = mid(id);
      // outer tissues point at different angles so the leaders fan out instead of meeting at one spot
      const fr = { cut: 0.4, epi: 0.56, coll: 0.72, par: 0.88 }[id] ?? 0.8;
      const a = outer ? (left ? -half * fr : half * fr) : L.bundles[L.bundles.length > 1 ? 1 : 0] + (L.bw * 0.3) / rr;
      const p = id === 'hair' ? wg.hair.mid : pol(cx, cy, id === 'par' ? r.par[0] + 12 : rr, a);
      out.push({ id, left, ax: p[0], ay: p[1], y: id === 'hair' ? p[1] - 8 : p[1] });
    }
    const gap = step === 6 ? (P ? 40 : 38) : (P ? 36 : 24);
    for (const side of [true, false]) {
      const g = out.filter((o) => o.left === side).sort((a, b) => a.y - b.y);
      for (let i = 1; i < g.length; i++) if (g[i].y < g[i - 1].y + gap) g[i].y = g[i - 1].y + gap;
      for (const o of g) if (o.y < (P ? 30 : 18)) o.y = P ? 30 : 18;
      for (let i = 1; i < g.length; i++) if (g[i].y < g[i - 1].y + gap) g[i].y = g[i - 1].y + gap;
    }
    let s = '';
    for (const o of out) {
      const name = NAMES[o.id], two = P && name.includes(' ') && name.length > 10, tw = (two ? 9 : name.length) * fs * 0.56;
      const ex = edgeX(L, o.y, o.left);
      let lx = o.left ? Math.max(tw + 6, ex - 10) : Math.min(W - tw - 6, ex + 10);
      if (o.id === 'hair') lx = o.left ? Math.max(tw + 6, o.ax - 22) : Math.min(W - tw - 6, Math.max(lx, o.ax + 22));
      s += `<path d="M${n1(lx + (o.left ? 4 : -4))} ${n1(o.y - 5)}L${n1(o.ax)} ${n1(o.ay)}" style="stroke:${INK};stroke-width:2;fill:none"/><circle cx="${n1(o.ax)}" cy="${n1(o.ay)}" r="3.4" style="fill:${INK};stroke:${W_};stroke-width:1.4"/>`;
      const anchor = o.left ? 'end' : 'start';
      if (step === 5 && !this.tl.any()) s += `<circle cx="${n1(lx + (o.left ? 8 : -8))}" cy="${n1(o.y - 5)}" r="5" style="fill:${T(TONE[o.id])};stroke:${INK};stroke-width:1.2"/>`;
      if (two) { const [w1, ...rest] = name.split(' '); s += label(lx, o.y - 10, w1, { size: fs, anchor }) + label(lx, o.y + 8, rest.join(' '), { size: fs, anchor }); }
      else s += label(lx, o.y, name, { size: fs, anchor });
      if (step === 6 && KIND[o.id] && !this.tl.any()) s += label(lx, o.y + (two ? 25 : 19), KIND[o.id], { size: 14, anchor, ink: T(KIND[o.id] === 'simple' ? 'series-3' : 'series-5'), weight: 900 });
    }
    return s;
  }

  _cutView(W, H, P, defs) {
    const gy = H - (P ? 70 : 64);
    let s = `<rect width="${W}" height="${H}" style="fill:${mx('strata-1', W_, 26)}"/><rect width="${W}" height="${n1(gy)}" style="fill:${mx('sea-shallow', W_, 14)}"/><circle cx="${n1(W * 0.2)}" cy="${n1(H * 0.2)}" r="${n1(W * 0.4)}" style="fill:${W_};opacity:.5;filter:url(#pa-softer)"/>` + bench(W, gy, H, { planks: 3 });
    const sx = W * (P ? 0.26 : 0.24), sh = P ? 230 : 250, sw = P ? 52 : 62;
    s += svgLeaf(sx + sw * 0.42, gy + 4 - sh * 0.5, P ? 1.0 : 1.25, { rot: 58, len: 120, wide: 70, teeth: 10 });
    s += stemPiece(sx, gy + 4, sh, sw);
    s += `<path d="M${n1(sx + sw * 0.5)} ${n1(gy + 4 - sh * 0.5)}q${n1(sw * 0.3)} -4 ${n1(sw * 0.6)} -14" style="fill:none;stroke:${mx('elev-low', INK, 50)};stroke-width:7;stroke-linecap:round"/><ellipse cx="${n1(sx)}" cy="${n1(gy + 4 - sh * 0.5)}" rx="${n1(sw * 0.54)}" ry="5" style="fill:${mx('elev-low', INK, 30)};opacity:.7"/>`;
    s += razor(sx + (P ? 26 : 34), gy + 4 - sh - 14, P ? 0.8 : 1);
    const tx = W * (P ? 0.68 : 0.66), ty = gy - 4;
    const tr = P ? 30 : 40, flat = (inner) => `<g transform="translate(${n1(tx)} ${n1(ty)}) scale(1 .36) translate(${n1(-tx)} ${n1(-ty)})">${inner}</g>`;
    const ts = `<g class="sf-slice"><ellipse cx="${n1(tx)}" cy="${n1(ty + 3)}" rx="${n1(tr + 12)}" ry="${n1(tr * 0.36 + 6)}" style="fill:${T('series-6')};opacity:.3"/><ellipse cx="${n1(tx)}" cy="${n1(ty + 2.5)}" rx="${n1(tr)}" ry="${n1(tr * 0.36)}" style="fill:${mx('elev-low', INK, 50)}"/>${flat(wholeTS(tx, ty, tr, 0, 12))}</g>`;
    s += slideUnder(tx, ty, P ? 150 : 210, ts);
    const lx = tx + (P ? 0 : 92), ly = P ? ty + 48 : ty - 64;
    s += label(lx, ly, 'T.S.', { size: P ? 20 : 24, display: true });
    if (!P) s += `<path d="M${n1(lx - 24)} ${n1(ly + 6)}L${n1(tx + 30)} ${n1(ty - 14)}" style="stroke:${INK};stroke-width:2.4;fill:none"/>`;
    s += label(sx, P ? 34 : 40, 'cut straight across', { size: P ? 15 : 17 });
    return defs + s;
  }

  destroy() { this.tl.destroy(); super.destroy(); }
}
