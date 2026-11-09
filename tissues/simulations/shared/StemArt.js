// StemArt - stained plant tissue for the tissues module (scene batch S2). Not a scene. SVG strings, tokens only, no words.
// Cells are packed in polar rows (a stem section) or in a straight block (a microscope field). Every cell has a wall with
// thickness, a light inner rim, a grainy lumen; living cells may carry a nucleus with depth. Stain colours follow a
// stained section: cellulose walls teal-green, pectin corners pink, lignin red, cuticle gold. Light from the top left.
//   pol(cx, cy, r, a)                 point at radius r, angle a (radians, 0 = up, clockwise)
//   sector(cx, cy, r0, r1, a0, a1)    an annular sector path
//   polarCells(cx, cy, r0, r1, a0, a1, o)   cells in rows: o.size (along the arc), o.rows, o.seed, o.jit, o.keep(r, a)
//   gridCells(x, y, w, h, o)          cells in a brick block: o.size, o.rows, o.seed, o.jit, o.round
//   cells(list, kind, o)              draw: kind 'par' 'coll' 'scl' 'epi' 'phl' 'camb' 'pith' 'fibre'; o.dim, o.tone
//   vessel(x, y, r, o)                a xylem vessel in T.S.: thick lignin ring, hollow, a thickening ring inside
//   sieve(x, y, r, o)                 a sieve tube in T.S. with its sieve plate (pores) and a companion cell
//   hair(x, y, deg, len, o)           a multicellular epidermal hair, 4 cells, tapering
//   STAIN                             the stain colours (strings)
//   stDefs()                          gradients (put once in defs, beside cwDefs and artDefs)
import { T, mx, n1, rnd } from './CellWorld.js';

const W_ = T('elev-peak'), INK = T('strata-6');
export const STAIN = {
  cell: mx('elev-low', 'sea-shallow', 46), cellD: mx(mx('elev-low', 'sea-shallow', 46), INK, 58),
  lumen: mx('strata-1', W_, 18), lumenG: mx('elev-low', W_, 20),
  pect: mx('series-4', W_, 62), pectD: mx('series-4', INK, 70),
  lig: mx('series-6', 'strata-3', 62), ligD: mx(mx('series-6', 'strata-3', 62), INK, 58), ligL: mx('series-6', W_, 52),
  cut: mx('series-2', 'strata-1', 60), cutD: mx('series-2', 'strata-3', 50),
  gap: mx(mx('elev-low', 'sea-shallow', 46), INK, 40), air: mx('sea-shallow', W_, 30),
  nuc: mx('series-5', 'sea-deep', 70), camb: mx('series-5', W_, 52),
};
let DEFS = null;
export function stDefs() {
  if (DEFS) return DEFS;
  const r3 = (id, a, b, c) => `<radialGradient id="${id}" cx=".34" cy=".3" r=".86"><stop offset="0" style="stop-color:${a}"/><stop offset=".6" style="stop-color:${b}"/><stop offset="1" style="stop-color:${c}"/></radialGradient>`;
  DEFS = r3('st-lum', W_, STAIN.lumen, mx(STAIN.lumen, 'sea-shallow', 80))
    + r3('st-lumG', W_, STAIN.lumenG, mx('elev-low', W_, 40))
    + r3('st-lumP', W_, mx('series-4', W_, 14), mx('series-4', W_, 30))
    + r3('st-camb', mx('series-5', W_, 18), mx('series-5', W_, 34), mx('series-5', W_, 50))
    + r3('st-nuc', mx('series-5', W_, 60), STAIN.nuc, mx(STAIN.nuc, INK, 60))
    + r3('st-hollow', W_, mx('sea-shallow', W_, 12), mx('sea-shallow', W_, 26))
    + `<linearGradient id="st-lig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${STAIN.ligL}"/><stop offset=".5" style="stop-color:${STAIN.lig}"/><stop offset="1" style="stop-color:${STAIN.ligD}"/></linearGradient>`
    + `<linearGradient id="st-pect" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${mx('series-4', W_, 40)}"/><stop offset="1" style="stop-color:${mx('series-4', W_, 74)}"/></linearGradient>`;
  return DEFS;
}

export const pol = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
export function sector(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => pol(cx, cy, r, a).map(n1).join(' '), big = a1 - a0 > Math.PI ? 1 : 0;
  if (r0 <= 0.5) return `M${n1(cx)} ${n1(cy)}L${p(r1, a0)}A${n1(r1)} ${n1(r1)} 0 ${big} 1 ${p(r1, a1)}Z`;
  return `M${p(r1, a0)}A${n1(r1)} ${n1(r1)} 0 ${big} 1 ${p(r1, a1)}L${p(r0, a1)}A${n1(r0)} ${n1(r0)} 0 ${big} 0 ${p(r0, a0)}Z`;
}
// a closed smooth path: corners are controls, so corners round and edges stay nearly straight
function smoothPath(pts) {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], N = pts.length, s0 = m(pts[N - 1], pts[0]);
  let d = `M${n1(s0[0])} ${n1(s0[1])}`;
  for (let i = 0; i < N; i++) { const p = pts[i], q = m(p, pts[(i + 1) % N]); d += `Q${n1(p[0])} ${n1(p[1])} ${n1(q[0])} ${n1(q[1])}`; }
  return d + 'Z';
}
function shrink(pts, d) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => { const dx = cx - x, dy = cy - y, L = Math.hypot(dx, dy) || 1, k = Math.min(d, L * 0.8) / L; return [x + dx * k, y + dy * k]; });
}

/** Cells in rows across an annular sector. Each cell: { pts (8), x, y, w, h, q (0..1 random) }. */
export function polarCells(cx, cy, r0, r1, a0, a1, o = {}) {
  const q = rnd(o.seed ?? 3), rows = o.rows ?? Math.max(1, Math.round((r1 - r0) / (o.size ?? 14))), out = [], jit = o.jit ?? 1.6;
  for (let i = 0; i < rows; i++) {
    const ri = r0 + ((r1 - r0) * i) / rows, ro = r0 + ((r1 - r0) * (i + 1)) / rows, rm = (ri + ro) / 2;
    const n = Math.max(1, Math.round(((a1 - a0) * rm) / (o.size ?? 14) / (o.aspect ?? 1))), da = (a1 - a0) / n, off = i % 2 ? da * 0.5 : 0;
    for (let j = -1; j <= n; j++) {
      const al = a0 + j * da + off, ar = al + da, am = (al + ar) / 2;
      if (am < a0 - da * 0.2 || am > a1 + da * 0.2) continue;
      if (o.keep && !o.keep(rm, am)) continue;
      const J = () => (q() - 0.5) * 2 * jit;
      const P = (r, a) => { const p = pol(cx, cy, r, a); return [p[0] + J(), p[1] + J()]; };
      const pts = [P(ro, al), P(ro + (ro - ri) * 0.04, am), P(ro, ar), P(rm, ar), P(ri, ar), P(ri - (ro - ri) * 0.04, am), P(ri, al), P(rm, al)];
      const c = pol(cx, cy, rm, am);
      out.push({ pts, x: c[0], y: c[1], w: da * rm, h: ro - ri, q: q(), r: rm, a: am });
    }
  }
  return out;
}
/** Cells in a brick block (a microscope field). */
export function gridCells(x, y, w, h, o = {}) {
  const q = rnd(o.seed ?? 5), size = o.size ?? 30, rows = o.rows ?? Math.max(1, Math.round(h / size)), ch = h / rows, out = [], jit = o.jit ?? 3;
  for (let i = 0; i < rows; i++) {
    const cw = size * (o.aspect ?? 1), n = Math.ceil(w / cw) + 1, off = i % 2 ? cw * 0.5 : 0, y0 = y + i * ch, y1 = y0 + ch;
    for (let j = -1; j < n; j++) {
      const x0 = x + j * cw - off, x1 = x0 + cw;
      if (x1 < x - cw * 0.3 || x0 > x + w + cw * 0.3) continue;
      const J = () => (q() - 0.5) * 2 * jit, P = (px, py) => [px + J(), py + J()];
      const pts = [P(x0, y0), P((x0 + x1) / 2, y0 - ch * 0.03), P(x1, y0), P(x1 + cw * 0.03, (y0 + y1) / 2), P(x1, y1), P((x0 + x1) / 2, y1 + ch * 0.03), P(x0, y1), P(x0 - cw * 0.03, (y0 + y1) / 2)];
      out.push({ pts, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: cw, h: ch, q: q() });
    }
  }
  return out;
}
const nucDot = (x, y, r) => `<circle cx="${n1(x + r * 0.2)}" cy="${n1(y + r * 0.3)}" r="${n1(r)}" style="fill:${INK};opacity:.18"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:url(#st-nuc) ${STAIN.nuc}"/><circle cx="${n1(x - r * 0.32)}" cy="${n1(y - r * 0.34)}" r="${n1(r * 0.3)}" style="fill:${W_};opacity:.6"/>`;
const grainDots = (c, q, n, col, a) => { let s = ''; const k = Math.min(c.w, c.h) * 0.34; for (let i = 0; i < n; i++) s += `<circle cx="${n1(c.x + (q() - 0.5) * 2 * k)}" cy="${n1(c.y + (q() - 0.5) * 2 * k)}" r="${n1(0.7 + q() * 0.9)}" style="fill:${col};opacity:${a}"/>`; return s; };

/** Draw a list of cells as one tissue. kind sets the wall, lumen and contents. o.tone: a token tint over the walls. */
export function cells(list, kind, o = {}) {
  const q = rnd(o.seed ?? 9), tone = o.tone ? (c) => mx(o.tone, c, 55) : (c) => c;
  let s = '';
  for (const c of list) {
    const m = Math.min(c.w, c.h);
    if (kind === 'scl' || kind === 'fibre') {
      // lignin walls fill the space; a tiny lumen in each, rimmed
      const lum = smoothPath(shrink(c.pts, m * (kind === 'scl' ? 0.36 : 0.3)));
      s += `<path d="${smoothPath(shrink(c.pts, 0.6))}" style="fill:url(#st-lig) ${tone(STAIN.lig)};stroke:${tone(STAIN.ligD)};stroke-width:1.1"/>`;
      s += `<path d="${smoothPath(shrink(c.pts, m * 0.16))}" style="fill:none;stroke:${STAIN.ligL};stroke-width:1;opacity:.55"/>`;
      s += `<path d="${lum}" style="fill:${mx('strata-1', W_, 30)};stroke:${tone(STAIN.ligD)};stroke-width:1.2"/>`;
      continue;
    }
    if (kind === 'coll') {
      // pectin fills the corners: the cell inside is round, the wall is thick where cells meet
      const p = shrink(c.pts, m * 0.15), d = smoothPath([p[0], p[2], p[4], p[6]]);
      s += `<path d="${d}" style="fill:url(#st-lumP) ${STAIN.lumen};stroke:${tone(STAIN.pectD)};stroke-width:1.6"/>`;
      s += `<path d="${smoothPath(shrink([p[0], p[2], p[4], p[6]], 2.2))}" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.6"/>`;
      s += grainDots(c, q, 5, STAIN.nuc, 0.25);
      if (c.q < 0.55) s += nucDot(c.x + (q() - 0.5) * m * 0.3, c.y + (q() - 0.5) * m * 0.3, m * 0.13);
      continue;
    }
    const gap = kind === 'par' || kind === 'pith' ? m * 0.08 + 1 : kind === 'camb' ? 0.4 : 0.8;
    const ww = kind === 'epi' ? 2.4 : kind === 'pith' ? 2.4 : kind === 'camb' ? 1.2 : 1.8;
    const pts = o.loose ? (() => { const p = shrink(c.pts, m * 0.07); return [p[0], p[2], p[4], p[6]]; })() : shrink(c.pts, gap), d = smoothPath(pts);
    const fillId = kind === 'camb' ? 'st-camb' : kind === 'par' && o.green ? 'st-lumG' : 'st-lum';
    s += `<path d="${d}" style="fill:url(#${fillId}) ${STAIN.lumen};stroke:${tone(STAIN.cellD)};stroke-width:${ww}"/>`;
    s += `<path d="${smoothPath(shrink(pts, ww + 1))}" style="fill:none;stroke:${W_};stroke-width:1.1;opacity:.6"/>`;
    if (o.vac) { const vp = smoothPath(shrink(pts, m * 0.17)); s += `<path d="${vp}" style="fill:${mx('sea-shallow', W_, 12)};stroke:${mx('sea-shallow', W_, 50)};stroke-width:1.2"/><path d="${smoothPath(shrink(pts, m * 0.24)).replace(/Z$/, '')}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.55;stroke-dasharray:${n1(m * 0.5)} ${n1(m * 3)}"/>`; }
    s += grainDots(c, q, kind === 'camb' ? 6 : 3, STAIN.nuc, kind === 'camb' ? 0.4 : 0.2);
    if (o.green && kind === 'par') for (let i = 0; i < 4; i++) { const a = q() * 6.28; s += `<ellipse cx="${n1(c.x + Math.cos(a) * m * 0.3)}" cy="${n1(c.y + Math.sin(a) * m * 0.3)}" rx="${n1(m * 0.09)}" ry="${n1(m * 0.06)}" style="fill:${T('chloro')};stroke:${mx('chloro', INK, 60)};stroke-width:.8"/>`; }
    const pn = kind === 'camb' ? 0.95 : kind === 'epi' ? 0.5 : kind === 'phl' ? 0.3 : 0.4;
    if (c.q < pn) s += nucDot(c.x + (q() - 0.5) * m * 0.3, c.y + (q() - 0.5) * m * 0.2, Math.max(1.6, m * (kind === 'camb' ? 0.2 : 0.13)));
  }
  return `<g${o.dim != null && o.dim < 1 ? ` opacity="${o.dim}"` : ''}>${s}</g>`;
}

/** A xylem vessel cut across: a thick lignin ring with a light rim, empty inside, a thickening ring seen through. */
export function vessel(x, y, r, o = {}) {
  const ww = Math.max(2.4, r * 0.24);
  return `<circle cx="${n1(x + 1.5)}" cy="${n1(y + 2)}" r="${n1(r + ww / 2)}" style="fill:${INK};opacity:.2"/>`
    + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:url(#st-hollow) ${W_};stroke:url(#st-lig) ${STAIN.lig};stroke-width:${n1(ww)}"/>`
    + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r - ww * 0.9)}" style="fill:none;stroke:${STAIN.lig};stroke-width:1.2;stroke-dasharray:2 3;opacity:.7"/>`
    + `<path d="M${n1(x - r * 0.94)} ${n1(y - r * 0.1)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(x - r * 0.1)} ${n1(y - r * 0.94)}" style="fill:none;stroke:${STAIN.ligL};stroke-width:${n1(Math.max(1, ww * 0.3))};opacity:.8"/>`
    + (o.water ? `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r - ww)}" style="fill:${T('series-1')};opacity:.4"/>` : '');
}
/** A sieve tube cut across, its sieve plate showing pores, with a small dense companion cell beside it. */
export function sieve(x, y, r, o = {}) {
  const q = rnd(o.seed ?? 4); let pores = '';
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28 + q(), k = i ? r * 0.42 : 0; pores += `<circle cx="${n1(x + Math.cos(a) * k)}" cy="${n1(y + Math.sin(a) * k)}" r="${n1(r * 0.12)}" style="fill:${mx('sea-shallow', W_, 30)};stroke:${STAIN.cellD};stroke-width:.8"/>`; }
  const ca = o.comp ?? 0.8, cx2 = x + Math.cos(ca) * r * 1.2, cy2 = y + Math.sin(ca) * r * 1.2;
  return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:${mx(STAIN.lumenG, 'sea-shallow', 86)};stroke:${STAIN.cellD};stroke-width:1.8"/>`
    + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * 0.72)}" style="fill:${mx(STAIN.cell, W_, 50)};opacity:.7"/>${pores}`
    + `<circle cx="${n1(cx2)}" cy="${n1(cy2)}" r="${n1(r * 0.4)}" style="fill:url(#st-camb) ${STAIN.camb};stroke:${STAIN.cellD};stroke-width:1.2"/>`
    + `<circle cx="${n1(cx2)}" cy="${n1(cy2)}" r="${n1(r * 0.16)}" style="fill:${STAIN.nuc}"/>`;
}
/** A multicellular epidermal hair from (x, y) pointing out at deg (0 = up). */
export function hair(x, y, deg, len, o = {}) {
  const a = (deg * Math.PI) / 180, ux = Math.sin(a), uy = -Math.cos(a), px = -uy, py = ux;
  let s = '';
  const n = 4, bend = o.bend ?? 0.12;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, w0 = 6.5 * (1 - t0 * 0.75), w1 = 6.5 * (1 - t1 * 0.75);
    const b0 = Math.sin(t0 * 3) * bend * len, b1 = Math.sin(t1 * 3) * bend * len;
    const P = (t, b, w) => [x + ux * len * t + px * (b + w), y + uy * len * t + py * (b + w)];
    const A = P(t0, b0, -w0), B = P(t0, b0, w0), Cc = P(t1, b1, w1 * (i === n - 1 ? 0.15 : 1)), D = P(t1, b1, -w1 * (i === n - 1 ? 0.15 : 1));
    s += `<path d="M${n1(A[0])} ${n1(A[1])}L${n1(B[0])} ${n1(B[1])}L${n1(Cc[0])} ${n1(Cc[1])}L${n1(D[0])} ${n1(D[1])}Z" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:1.6;stroke-linejoin:round"/>`;
    s += `<path d="M${n1(A[0] * 0.8 + B[0] * 0.2)} ${n1(A[1] * 0.8 + B[1] * 0.2)}L${n1(D[0] * 0.8 + Cc[0] * 0.2)} ${n1(D[1] * 0.8 + Cc[1] * 0.2)}" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.7"/>`;
  }
  return `<g${o.dim != null && o.dim < 1 ? ` opacity="${o.dim}"` : ''}>${s}</g>`;
}
