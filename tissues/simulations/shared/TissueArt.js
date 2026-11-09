// TissueArt - painted tissue parts for the tissues module (scene batch S1). Not a scene. SVG strings, tokens only,
// no faces, no words. Built on CellWorld (cell look: soft walls, grain, nuclei with depth) and BodyArt (clinical forms).
// Every form: lit side, shade side, an inner line or texture, a rim. Light from the top left.
//   taDefs()                           shared gradients and patterns (put once in the scene's defs; cwDefs() too)
//   smooth(pts)                        closed smooth path through points
//   amoeba(x, y, r, o)                 one amoeba: pseudopods, grainy cytoplasm, nucleus, food and contractile vacuoles.
//                                      o.seed, o.rot, o.lit (heavier rim), o.food (a food bit being engulfed)
//   spindle(x, y, len, w, deg, o)      one smooth muscle cell: spindle, long nucleus, fibrils. o.lit, o.a
//   muscleSheet(x, y, w, h, o)         many spindles side by side in a sheet. o.seed, o.len, o.lit
//   neuron(x, y, s, o)                 cell body + nucleus, branching dendrites, long axon to o.to [x, y], terminals
//   columnar(x, y, w, h, n, o)         a row of lining (epithelial) cells, nuclei near the base
//   xylemTube(x, y0, y1, w, o)         a hollow vessel with ring and spiral thickening. o.water (blue column), o.lit
//   phloemTube(x, y0, y1, w, o)        sieve tube elements with sieve plates (pores), a companion cell beside each
//   stomach(x, y, k, o)                the stomach, a window cut in the front wall shows muscle and the folded lining;
//                                      blood vessels and a nerve net on the surface. o.part(name) -> opacity, o.lit(name)
//                                      names: muscle lining nerve blood
//   leafArt(x, y, len, deg, o)         a mango-like leaf: midrib, side veins, wavy margin, lit and shade halves
import { T, mx, n1, rnd, nucleus } from './CellWorld.js';

const W_ = T('elev-peak'), INK = T('strata-6');
export const MUSC = mx('series-6', 'series-4', 62), MUSC_D = mx(MUSC, INK, 62), MUSC_L = mx(MUSC, W_, 52);
export const LINE = mx('series-8', 'series-2', 40), LINE_D = mx(LINE, INK, 60), LINE_L = mx(LINE, W_, 50);
export const NERVE = mx('series-2', 'gold', 50), NERVE_D = mx(NERVE, INK, 58);
export const BLOOD = T('series-6'), BLOOD_D = mx('series-6', 'strata-6', 60);
export const XYL = mx('series-2', 'strata-3', 52), XYL_D = mx(XYL, INK, 58);
export const PHL = mx('elev-low', 'series-3', 40), PHL_D = mx(PHL, INK, 55);
export const LEAF = mx('elev-low', 'chloro', 50), LEAF_D = mx(LEAF, INK, 62), LEAF_L = mx(LEAF, W_, 62);

const g3 = (id, lit, mid, dark, cx = 0.36, cy = 0.3, r = 0.82) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" style="stop-color:${lit}"/><stop offset=".55" style="stop-color:${mid}"/><stop offset="1" style="stop-color:${dark}"/></radialGradient>`;
const lin = (id, a, b, c, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" style="stop-color:${a}"/><stop offset=".5" style="stop-color:${b}"/><stop offset="1" style="stop-color:${c}"/></linearGradient>`;
let DEFS = null;
export function taDefs() {
  if (DEFS) return DEFS;
  DEFS = g3('ta-musc', MUSC_L, MUSC, MUSC_D, 0.4, 0.2, 0.9)
    + g3('ta-amo', W_, mx('membrane', W_, 22), mx('membrane', W_, 44), 0.36, 0.3, 0.84)
    + g3('ta-endo', mx('membrane', W_, 30), mx('membrane', W_, 42), mx('membrane', W_, 56), 0.4, 0.34, 0.8)
    + g3('ta-soma', mx(NERVE, W_, 40), NERVE, NERVE_D, 0.34, 0.28, 0.86)
    + g3('ta-col', LINE_L, LINE, LINE_D, 0.36, 0.2, 0.95)
    + g3('ta-stom', MUSC_L, MUSC, MUSC_D, 0.3, 0.26, 0.9)
    + g3('ta-lin', LINE_L, LINE, mx(LINE, INK, 74), 0.4, 0.3, 0.86)
    + lin('ta-xyl', mx(XYL, W_, 40), XYL, XYL_D, 1, 0)
    + lin('ta-phl', mx(PHL, W_, 44), PHL, PHL_D, 1, 0)
    + lin('ta-leaf', LEAF_L, LEAF, LEAF_D, 1, 1)
    + lin('ta-hollow', mx('sea-shallow', W_, 10), mx('sea-shallow', W_, 22), mx('sea-shallow', W_, 36), 1, 0)
    + lin('ta-water', mx('series-1', W_, 30), mx('series-1', W_, 50), mx('series-1', INK, 80), 1, 0);
  return DEFS;
}

/** A closed smooth path through points (quadratic through midpoints). */
export function smooth(pts) {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const N = pts.length, s0 = m(pts[N - 1], pts[0]);
  let d = `M${n1(s0[0])} ${n1(s0[1])}`;
  for (let i = 0; i < N; i++) { const p = pts[i], q = m(p, pts[(i + 1) % N]); d += `Q${n1(p[0])} ${n1(p[1])} ${n1(q[0])} ${n1(q[1])}`; }
  return `${d}Z`;
}
const grain = (d, id, x, y, w, h, a = 0.24) => `<clipPath id="${id}"><path d="${d}"/></clipPath><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" clip-path="url(#${id})" style="fill:${INK};opacity:${a};filter:url(#cw-grain)"/>`;
let UID = 0;
const uid = (p) => `${p}${(UID = (UID + 1) % 100000)}`;

// -- amoeba -------------------------------------------------------------------
export function amoeba(x, y, r, o = {}) {
  const q = rnd(o.seed ?? 7), rot = ((o.rot ?? 0) * Math.PI) / 180, pods = o.pods ?? [[-0.36, 0.72, 0.15], [0.34, 0.62, 0.14], [1.9, 0.5, 0.2], [2.7, 0.3, 0.16], [3.7, 0.62, 0.2], [4.9, 0.38, 0.18]];
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    let k = 1 + (q() - 0.5) * 0.06;
    for (const [pa, amp, wd] of pods) { let da = Math.abs(a - pa) % (Math.PI * 2); if (da > Math.PI) da = Math.PI * 2 - da; k += amp * Math.exp(-(da * da) / (2 * wd * wd)); }
    pts.push([x + Math.cos(a + rot) * r * k, y + Math.sin(a + rot) * r * k * 0.86]);
  }
  const d = smooth(pts), inner = smooth(pts.map(([px, py]) => { const dx = px - x, dy = py - y, l = Math.hypot(dx, dy) || 1, kk = Math.max(0.3, (l - r * 0.22) / l); return [x + dx * kk, y + dy * kk]; }));
  const id = uid('am'), lit = o.lit ? 1 : 0;
  let s = `<path d="${d}" transform="translate(6 11)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  s += `<path d="${d}" style="fill:url(#ta-amo) ${mx('membrane', W_, 26)}"/>`;
  s += `<path d="${inner}" style="fill:url(#ta-endo) ${mx('membrane', W_, 40)};opacity:.85;filter:url(#cw-blur1)"/>`;
  s += grain(d, id, x - r * 2, y - r * 2, r * 4, r * 4, 0.3);
  // food vacuoles with green bits, a contractile vacuole, the nucleus
  const fv = (fx, fy, fr) => `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="${n1(fr)}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 30)};stroke:${mx('sea-shallow', 'sea-deep', 60)};stroke-width:1.4"/><ellipse cx="${n1(fx + fr * 0.1)}" cy="${n1(fy + fr * 0.15)}" rx="${n1(fr * 0.52)}" ry="${n1(fr * 0.36)}" style="fill:url(#cw-chl) ${T('chloro')}"/>`;
  s += fv(x - r * 0.42, y + r * 0.3, r * 0.15) + fv(x + r * 0.08, y - r * 0.4, r * 0.12) + fv(x + r * 0.5, y + r * 0.34, r * 0.1);
  s += `<circle cx="${n1(x - r * 0.52)}" cy="${n1(y - r * 0.3)}" r="${n1(r * 0.17)}" style="fill:url(#cw-vac) ${W_};stroke:${mx('sea-shallow', 'sea-deep', 66)};stroke-width:1.8"/><circle cx="${n1(x - r * 0.56)}" cy="${n1(y - r * 0.35)}" r="${n1(r * 0.05)}" style="fill:${W_};opacity:.9"/>`;
  s += nucleus(x + r * 0.12, y + r * 0.04, r * 0.24);
  if (o.food) { const [fx, fy] = o.food; s += `<path d="M${n1(fx - 9)} ${n1(fy)}q4 -10 12 -6q8 4 4 12q-6 8 -14 2z" style="fill:url(#cw-chl) ${T('chloro')};stroke:${mx('chloro', INK, 60)};stroke-width:1.4"/>`; }
  s += `<path d="${d}" style="fill:none;stroke:${mx('sea-shallow', W_, 60)};stroke-width:${n1(Math.max(5, r * 0.05))};opacity:.45;filter:url(#cw-blur1)"/><path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:${2.4 + lit * 2.2}"/>`;
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}

// -- muscle -------------------------------------------------------------------
export function spindle(x, y, len, w, deg = 0, o = {}) {
  const L = len / 2, H = w / 2;
  const d = `M${-L} 0C${n1(-L * 0.5)} ${n1(-H * 1.05)} ${n1(L * 0.5)} ${n1(-H * 1.05)} ${L} 0C${n1(L * 0.5)} ${n1(H * 1.05)} ${n1(-L * 0.5)} ${n1(H * 1.05)} ${-L} 0Z`;
  let s = `<path d="${d}" style="fill:url(#ta-musc) ${MUSC};stroke:${MUSC_D};stroke-width:${o.lit ? 2.6 : 1.4}"/>`;
  if (len > 40) s += `<path d="M${n1(-L * 0.7)} ${n1(-H * 0.3)}Q0 ${n1(-H * 0.62)} ${n1(L * 0.7)} ${n1(-H * 0.3)}M${n1(-L * 0.74)} ${n1(H * 0.28)}Q0 ${n1(H * 0.6)} ${n1(L * 0.74)} ${n1(H * 0.28)}" style="fill:none;stroke:${MUSC_D};stroke-width:.9;opacity:.45"/>`;
  s += `<ellipse cx="${n1(L * 0.02)}" cy="0" rx="${n1(Math.max(4, len * 0.14))}" ry="${n1(Math.max(1.6, H * 0.36))}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 50)};stroke-width:.9"/>`;
  s += `<path d="M${n1(-L * 0.55)} ${n1(-H * 0.5)}Q0 ${n1(-H * 0.86)} ${n1(L * 0.5)} ${n1(-H * 0.55)}" style="fill:none;stroke:${W_};stroke-width:${n1(Math.max(1, H * 0.2))};opacity:.55;stroke-linecap:round"/>`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(deg)})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}
export function muscleSheet(x, y, w, h, o = {}) {
  const q = rnd(o.seed ?? 3), len = o.len ?? 90, cw = o.cw ?? 15, rows = Math.max(2, Math.round(h / (cw * 0.78)));
  let s = '';
  for (let r = 0; r < rows; r++) {
    const yy = y + (r + 0.5) * (h / rows), off = (r % 2) * len * 0.5 - len * 0.4;
    for (let xx = x + off; xx < x + w + len * 0.4; xx += len * 0.9) {
      const lx = xx + (q() - 0.5) * 10, ly = yy + (q() - 0.5) * 3;
      if (lx < x - len * 0.3 || lx > x + w + len * 0.3) continue;
      s += spindle(lx, ly, len * (0.9 + q() * 0.2), cw * (0.9 + q() * 0.25), (q() - 0.5) * 5 + (o.deg ?? 0), { lit: o.lit });
    }
  }
  const id = uid('ms');
  return `<clipPath id="${id}"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${o.rx ?? 10}"/></clipPath><g clip-path="url(#${id})"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" style="fill:${MUSC_D};opacity:.55"/>${s}</g>`;
}

// -- nerve --------------------------------------------------------------------
const tubeD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${n1(p[0])} ${n1(p[1])}`).join('');
function branch(x, y, a, len, w, depth, q, out) {
  const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, mxp = x + Math.cos(a + (q() - 0.5) * 0.5) * len * 0.5, myp = y + Math.sin(a + (q() - 0.5) * 0.5) * len * 0.5;
  out.push({ d: `M${n1(x)} ${n1(y)}Q${n1(mxp)} ${n1(myp)} ${n1(x1)} ${n1(y1)}`, w });
  if (depth > 0) for (const da of [-0.5, 0.45]) branch(x1, y1, a + da + (q() - 0.5) * 0.3, len * 0.66, w * 0.62, depth - 1, q, out);
}
export function neuron(x, y, s = 1, o = {}) {
  const q = rnd(o.seed ?? 5), to = o.to ?? [x + 260 * s, y + 20 * s], parts = [], lit = o.lit ? 1.6 : 0;
  const ang0 = Math.atan2(to[1] - y, to[0] - x);
  for (let i = 0; i < 6; i++) branch(x, y, ang0 + Math.PI + (i - 2.5) * 0.62 + (q() - 0.5) * 0.3, 34 * s, 7 * s, 2, q, parts);
  // axon: gentle S curve to the terminals; myelin beads along it
  const mx1 = x + (to[0] - x) * 0.33, my1 = y + (to[1] - y) * 0.33 - 18 * s, mx2 = x + (to[0] - x) * 0.66, my2 = y + (to[1] - y) * 0.66 + 18 * s;
  const ax = `M${n1(x)} ${n1(y)}C${n1(mx1)} ${n1(my1)} ${n1(mx2)} ${n1(my2)} ${n1(to[0])} ${n1(to[1])}`;
  const term = [];
  for (let i = 0; i < 4; i++) branch(to[0], to[1], ang0 + (i - 1.5) * 0.55, 18 * s, 3.6 * s, 1, q, term);
  let str = '';
  const tube = (d, w) => `<path d="${d}" style="fill:none;stroke:${NERVE_D};stroke-width:${n1(w + 2.4 + lit)};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${NERVE};stroke-width:${n1(w)};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${mx(NERVE, W_, 40)};stroke-width:${n1(Math.max(0.8, w * 0.3))};stroke-linecap:round;transform:translate(-${n1(w * 0.15)}px,-${n1(w * 0.2)}px);opacity:.8"/>`;
  for (const p of parts) str += tube(p.d, p.w);
  str += tube(ax, 5 * s);
  if (o.myelin !== false) {
    for (let i = 1; i < 8; i++) {
      const u = 0.12 + i * 0.1, v = 1 - u;
      const bx = v * v * v * x + 3 * v * v * u * mx1 + 3 * v * u * u * mx2 + u * u * u * to[0], by = v * v * v * y + 3 * v * v * u * my1 + 3 * v * u * u * my2 + u * u * u * to[1];
      str += `<ellipse cx="${n1(bx)}" cy="${n1(by)}" rx="${n1(10 * s)}" ry="${n1(5.4 * s)}" transform="rotate(${n1((ang0 * 180) / Math.PI + (i % 2 ? 12 : -12))} ${n1(bx)} ${n1(by)})" style="fill:${mx(NERVE, W_, 62)};stroke:${NERVE_D};stroke-width:1.2"/>`;
    }
  }
  for (const p of term) str += tube(p.d, p.w);
  for (const p of term) { const m = p.d.match(/(-?[\d.]+) (-?[\d.]+)$/); if (m) str += `<circle cx="${m[1]}" cy="${m[2]}" r="${n1(3.4 * s)}" style="fill:${NERVE};stroke:${NERVE_D};stroke-width:1.2"/>`; }
  const R = 17 * s, body = smooth([0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 7) * Math.PI * 2 + 0.3; const k = i % 2 ? 0.82 : 1.08; return [x + Math.cos(a) * R * k, y + Math.sin(a) * R * k]; }));
  str += `<path d="${body}" style="fill:url(#ta-soma) ${NERVE};stroke:${NERVE_D};stroke-width:${n1(1.8 + lit)}"/>`;
  str += nucleus(x, y, R * 0.46, { pores: false });
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${str}</g>`;
}

// -- lining --------------------------------------------------------------------
export function columnar(x, y, w, h, n, o = {}) {
  const cw = w / n, q = rnd(o.seed ?? 2);
  let s = `<rect x="${n1(x)}" y="${n1(y + h - 6)}" width="${n1(w)}" height="8" rx="3" style="fill:${LINE_D};opacity:.7"/>`;
  for (let i = 0; i < n; i++) {
    const cx = x + i * cw, jh = h * (0.92 + q() * 0.08);
    const d = `M${n1(cx + 1)} ${n1(y + h)}V${n1(y + h - jh + 6)}Q${n1(cx + 1)} ${n1(y + h - jh)} ${n1(cx + cw / 2)} ${n1(y + h - jh)}Q${n1(cx + cw - 1)} ${n1(y + h - jh)} ${n1(cx + cw - 1)} ${n1(y + h - jh + 6)}V${n1(y + h)}Z`;
    s += `<path d="${d}" style="fill:url(#ta-col) ${LINE};stroke:${LINE_D};stroke-width:${o.lit ? 2.2 : 1.3}"/><ellipse cx="${n1(cx + cw / 2)}" cy="${n1(y + h - jh * 0.3)}" rx="${n1(cw * 0.28)}" ry="${n1(jh * 0.13)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 50)};stroke-width:.9"/><path d="M${n1(cx + cw * 0.26)} ${n1(y + h - jh + 8)}V${n1(y + h - jh * 0.6)}" style="fill:none;stroke:${W_};stroke-width:1.6;opacity:.6;stroke-linecap:round"/>`;
  }
  return s;
}

// -- conducting tissue -----------------------------------------------------------
export function xylemTube(x, y0, y1, w, o = {}) {
  const wall = Math.max(3, w * 0.16), id = uid('xy');
  let s = `<rect x="${n1(x - w / 2)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(y1 - y0)}" rx="${n1(wall)}" style="fill:url(#ta-hollow) ${mx('sea-shallow', W_, 20)}"/>`;
  if (o.water) s += `<rect x="${n1(x - w / 2 + wall)}" y="${n1(y0)}" width="${n1(w - 2 * wall)}" height="${n1(y1 - y0)}" style="fill:url(#ta-water) ${T('series-1')};opacity:${o.water}"/>`;
  // ring and spiral lignin thickening on the inner wall
  let d = '';
  const step = Math.max(7, w * 0.42);
  for (let yy = y0 + step * 0.6; yy < y1 - 2; yy += step) {
    if (o.rings) d += `M${n1(x - w / 2 + wall * 0.6)} ${n1(yy)}H${n1(x + w / 2 - wall * 0.6)}`;
    else d += `M${n1(x - w / 2 + wall * 0.6)} ${n1(yy)}L${n1(x + w / 2 - wall * 0.6)} ${n1(yy + step * 0.5)}`;
  }
  s += `<clipPath id="${id}"><rect x="${n1(x - w / 2)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(y1 - y0)}"/></clipPath><path d="${d}" clip-path="url(#${id})" style="fill:none;stroke:${XYL};stroke-width:${n1(Math.max(2, wall * 0.62))};stroke-linecap:round"/><path d="${d}" clip-path="url(#${id})" style="fill:none;stroke:${mx(XYL, W_, 50)};stroke-width:${n1(Math.max(0.8, wall * 0.22))};transform:translate(-1px,-1px)"/>`;
  s += `<path d="M${n1(x - w / 2 + wall / 2)} ${n1(y0)}V${n1(y1)}M${n1(x + w / 2 - wall / 2)} ${n1(y0)}V${n1(y1)}" style="fill:none;stroke:url(#ta-xyl) ${XYL};stroke-width:${n1(wall)}"/>`;
  s += `<path d="M${n1(x - w / 2)} ${n1(y0)}V${n1(y1)}M${n1(x + w / 2)} ${n1(y0)}V${n1(y1)}" style="fill:none;stroke:${XYL_D};stroke-width:${o.lit ? 2.6 : 1.4}"/>`;
  return s;
}
export function phloemTube(x, y0, y1, w, o = {}) {
  const seg = o.seg ?? Math.max(36, w * 3), cw = w * 0.42;
  let s = '';
  for (let yy = y0, i = 0; yy < y1 - 4; yy += seg, i++) {
    const h = Math.min(seg, y1 - yy);
    s += `<rect x="${n1(x - w / 2)}" y="${n1(yy)}" width="${n1(w)}" height="${n1(h)}" rx="4" style="fill:url(#ta-phl) ${PHL};stroke:${PHL_D};stroke-width:${o.lit ? 2.4 : 1.3}"/>`;
    s += `<path d="M${n1(x - w / 2 + 4)} ${n1(yy + 6)}V${n1(yy + h - 6)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.45;stroke-linecap:round"/>`;
    // companion cell with its nucleus
    s += `<rect x="${n1(x + w / 2 + 1)}" y="${n1(yy + 3)}" width="${n1(cw)}" height="${n1(h - 6)}" rx="${n1(cw / 2)}" style="fill:${mx(PHL, 'series-5', 70)};stroke:${PHL_D};stroke-width:1.1"/><ellipse cx="${n1(x + w / 2 + 1 + cw / 2)}" cy="${n1(yy + h * 0.5)}" rx="${n1(cw * 0.3)}" ry="${n1(Math.min(8, h * 0.14))}" style="fill:url(#cw-nuc) ${T('series-5')}"/>`;
    // sieve plate: a bar with pores
    if (i > 0) { s += `<rect x="${n1(x - w / 2 + 1)}" y="${n1(yy - 2.2)}" width="${n1(w - 2)}" height="4.4" style="fill:${PHL_D}"/>`; for (let px = x - w / 2 + 5; px < x + w / 2 - 3; px += 6) s += `<circle cx="${n1(px)}" cy="${n1(yy)}" r="1.3" style="fill:${mx(PHL, W_, 40)}"/>`; }
  }
  return s;
}

// -- stomach --------------------------------------------------------------------
// Local coords: about 300 by 260 at k = 1, food pipe entering at the top left, duodenum leaving at the right.
// Outline paths in local units; a path string with numbers is mapped through (x, y, k).
const ST_OUT = 'M100 -24L100 22C90 6 60 -2 40 14C12 36 8 100 22 160C36 214 100 246 170 236C226 228 262 196 282 160L314 156L314 126L280 124C256 150 214 168 176 160C146 152 136 110 138 60L138 -24Z';
const ST_MID = 'M106 -24L106 30C94 16 64 10 46 24C22 44 18 102 32 158C46 208 104 236 170 228C222 220 254 190 274 156L314 150L314 132L278 132C254 158 212 176 174 168C142 160 128 116 132 62L132 -24Z';
const ST_IN = 'M112 -24L112 40C98 28 70 24 56 36C34 56 32 104 44 154C58 200 108 222 170 216C216 210 244 184 264 152L314 144L314 138L272 140C248 166 210 186 172 178C136 170 122 122 126 66L126 -24Z';
const mapPath = (d, x, y, k) => { let i = 0; return d.replace(/-?[\d.]+/g, (v) => n1((i++ % 2 ? y : x) + Number(v) * k)); };
export const STOMACH_PT = { top: [118, -20], fundus: [50, 40], body: [60, 160], pylorus: [290, 140], curve: [170, 236], lesser: [160, 140] };
export function stomach(x, y, k = 1, o = {}) {
  const P = (n) => o.part?.(n) ?? 1, L = (n) => (o.lit?.(n) ? 1 : 0);
  const outer = mapPath(ST_OUT, x, y, k), mid = mapPath(ST_MID, x, y, k), inner = mapPath(ST_IN, x, y, k);
  const id = uid('st'), win = mapPath('M-10 70C40 60 110 150 150 170C200 192 250 170 290 136L330 300H-10Z', x, y, k);
  let s = `<path d="${outer}" transform="translate(${n1(6 * k)} ${n1(12 * k)})" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
  // outer wall: smooth muscle, its fibres running round the stomach
  let fib = '';
  for (let i = -6; i < 30; i++) fib += `M${n1(x + (i * 12) * k)} ${n1(y - 40 * k)}q${n1(40 * k)} ${n1(120 * k)} ${n1(10 * k)} ${n1(280 * k)}`;
  s += `<g opacity="${P('muscle')}"><path d="${outer}" style="fill:url(#ta-stom) ${MUSC}"/><clipPath id="${id}o"><path d="${outer}"/></clipPath><g clip-path="url(#${id}o)"><path d="${fib}" style="fill:none;stroke:${MUSC_D};stroke-width:${n1(1.6 * k + 0.4)};opacity:.32"/><path d="${outer}" style="fill:none;stroke:${MUSC_D};stroke-width:${n1(16 * k)};opacity:.4;filter:url(#cw-blur3)"/></g>`;
  s += `<path d="${outer}" style="fill:none;stroke:${MUSC_D};stroke-width:${n1(2.4 + L('muscle') * 3)};stroke-linejoin:round"/></g>`;
  // the window: the front wall cut away, its cut edge shows the muscle layer; inside, the folded lining
  s += `<clipPath id="${id}w"><path d="${win}"/></clipPath><g clip-path="url(#${id}w)">`;
  s += `<g opacity="${P('muscle')}"><path d="${mid}" style="fill:${mx(MUSC, INK, 82)}"/></g>`;
  let folds = '';
  for (let i = 0; i < 9; i++) folds += `M${n1(x + (40 + i * 26) * k)} ${n1(y + (90 + i * 12) * k)}c${n1(8 * k)} ${n1(12 * k)} ${n1(-6 * k)} ${n1(24 * k)} ${n1(2 * k)} ${n1(38 * k)}s${n1(-8 * k)} ${n1(26 * k)} ${n1(2 * k)} ${n1(40 * k)}`;
  s += `<g opacity="${P('lining')}"><path d="${inner}" style="fill:url(#ta-lin) ${LINE}"/><clipPath id="${id}i"><path d="${inner}"/></clipPath><g clip-path="url(#${id}i)"><path d="${folds}" style="fill:none;stroke:${LINE_D};stroke-width:${n1(3.2 * k)};stroke-linecap:round;opacity:.75"/><path d="${folds}" style="fill:none;stroke:${LINE_L};stroke-width:${n1(1.4 * k)};stroke-linecap:round;transform:translate(-${n1(3 * k)}px,-${n1(1 * k)}px);opacity:.8"/></g>`;
  s += `<path d="${inner}" style="fill:none;stroke:${LINE_D};stroke-width:${n1(1.8 + L('lining') * 3)}"/></g></g>`;
  s += `<path d="${win}" clip-path="url(#${id}o)" style="fill:none;stroke:${mx(MUSC_L, W_, 50)};stroke-width:${n1(3 * k)};opacity:${P('muscle') * 0.9}"/>`;
  // blood vessels along both curves, branching over the wall
  const bv = [mapPath('M146 40C140 120 196 166 280 132', x, y, k), mapPath('M30 30C4 110 40 230 170 232C228 228 260 196 280 164', x, y, k)];
  let tw = '';
  const q = rnd(4);
  for (let i = 0; i < 9; i++) { const a = 2.3 - i * 0.2, bx = x + (160 + Math.cos(a) * 128) * k, by = y + (110 + Math.sin(a) * 118) * k; tw += `M${n1(bx)} ${n1(by)}q${n1((q() - 0.5) * 20 * k)} ${n1(-20 * k)} ${n1((q() - 0.5) * 16 * k - Math.cos(a) * 30 * k)} ${n1(-40 * k)}`; }
  s += `<g opacity="${P('blood')}"><path d="${bv.join('')}${tw}" style="fill:none;stroke:${BLOOD_D};stroke-width:${n1(5.2 * k + 1 + L('blood') * 2)};stroke-linecap:round"/><path d="${bv.join('')}${tw}" style="fill:none;stroke:${BLOOD};stroke-width:${n1(3.4 * k)};stroke-linecap:round"/><path d="${bv.join('')}" style="fill:none;stroke:${mx(BLOOD, W_, 50)};stroke-width:${n1(1.2 * k)};transform:translate(-1px,-1px)"/></g>`;
  // nerve net: fine branching threads with small knots
  let nv = '', kn = '';
  const qn = rnd(9);
  for (let i = 0; i < 7; i++) { const nx0 = x + (40 + i * 30) * k, ny0 = y + (40 + i * 16 + (i > 3 ? 20 : 0)) * k; nv += `M${n1(nx0)} ${n1(ny0)}l${n1(22 * k)} ${n1(24 * k)}l${n1((qn() - 0.5) * 30 * k)} ${n1(26 * k)}M${n1(nx0 + 22 * k)} ${n1(ny0 + 24 * k)}l${n1(24 * k)} ${n1(-6 * k)}`; kn += `<circle cx="${n1(nx0 + 22 * k)}" cy="${n1(ny0 + 24 * k)}" r="${n1(3.2 * k + 0.8)}" style="fill:${NERVE};stroke:${NERVE_D};stroke-width:1.2"/>`; }
  s += `<g opacity="${P('nerve')}"><path d="${nv}" style="fill:none;stroke:${NERVE_D};stroke-width:${n1(3.4 * k + L('nerve') * 1.6)};stroke-linecap:round;stroke-linejoin:round"/><path d="${nv}" style="fill:none;stroke:${NERVE};stroke-width:${n1(1.8 * k)};stroke-linecap:round;stroke-linejoin:round"/>${kn}</g>`;
  // a soft highlight on the lit upper left of the fundus
  s += `<path d="${mapPath('M26 60C30 36 46 18 70 14', x, y, k)}" style="fill:none;stroke:${W_};stroke-width:${n1(6 * k)};stroke-linecap:round;opacity:${0.5 * P('muscle')}"/>`;
  return s;
}

// -- leaf --------------------------------------------------------------------
export function leafArt(x, y, len, deg = 0, o = {}) {
  const L = len, Wd = len * (o.wide ?? 0.24), q = rnd(o.seed ?? 6), top = [], bot = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14, w = Wd * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.9) * (1 + (q() - 0.5) * 0.05); top.push([u * L, -w]); bot.push([u * L, w]); }
  const outline = smooth([...top, ...bot.reverse().slice(1, -1)]);
  let veins = '';
  for (let i = 1; i < 10; i++) { const u = i / 10.5, w = Wd * Math.sin(Math.PI * Math.pow(u, 0.85)) * 0.86; veins += `M${n1(u * L)} 0Q${n1(u * L + L * 0.06)} ${n1(-w * 0.5)} ${n1(u * L + L * 0.1)} ${n1(-w)}M${n1(u * L)} 0Q${n1(u * L + L * 0.06)} ${n1(w * 0.5)} ${n1(u * L + L * 0.1)} ${n1(w)}`; }
  const halfTop = smooth([...top, [L * 0.98, 0], [0, 0]]);
  let s = `<path d="${outline}" transform="translate(5 9)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  s += `<path d="${outline}" style="fill:url(#ta-leaf) ${LEAF};stroke:${LEAF_D};stroke-width:${o.lit ? 3.2 : 2}"/><path d="${halfTop}" style="fill:${W_};opacity:.12"/>`;
  s += `<path d="${veins}" style="fill:none;stroke:${mx(LEAF, W_, 46)};stroke-width:${n1(Math.max(1, L * 0.008))};opacity:.85"/>`;
  s += `<path d="M${-L * 0.12} 0L${n1(L * 0.98)} 0" style="fill:none;stroke:${mx(LEAF_L, 'series-2', 80)};stroke-width:${n1(Math.max(2.4, L * 0.022))};stroke-linecap:round"/>`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(deg)})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}
/** The stomach's outer outline alone (for an empty, dashed place-holder). */
export const stomachOutline = (x, y, k = 1) => mapPath(ST_OUT, x, y, k);
