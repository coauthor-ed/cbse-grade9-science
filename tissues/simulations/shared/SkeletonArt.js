// SkeletonArt - bones for the tissues module L08 (SpineRibs, ArmBuildGame). SVG strings only, tokens only, no faces.
// Drawn in the look of BodyArt: every bone has a lit side, a shade side and a rim; long bones are shaded tubes with
// knobbed ends; cartilage is a cool blue-white with fine rings; the spinal cord is a nerve-gold tube. Clinical and calm.
//   BONE, CART, CORD, LUNG, HEART, BRAIN, MUSC     colours
//   skeletonFront(x, y, k, o)    whole skeleton, front view, 160 by 560 at k = 1, (x, y) = top of the skull
//   ribCageFront(x, y, k, o)     12 pairs of ribs, sternum, costal cartilage, thoracic spine behind; o.breath 0..1,
//                                o.organs (heart and lungs behind), o.lit(part) / o.dim(part) for 'ribs' 'sternum' 'cart' 'spine' 'organs'
//   spineChain(base, o)          the vertebral column from the sacrum up as a chain: returns { segs, top } (o.bend 0..1, o.k)
//   spineSide(chain, o)          draws it: vertebral bodies, discs, spinous processes, the cord in its canal
//   skullSide(x, y, k, deg, o)   skull in side view, cut away to show the brain, eye and inner ear behind it
//   ribTop(cx, cy, r, o)         one pair of ribs seen from above: vertebra at the back, cartilage to the sternum at the front
//   longBone(x0, y0, x1, y1, w, o)   a shaded long bone with knobbed ends
import { form, tube, tapered, n } from './BodyArt.js';
import { mx, T, rnd } from './CellWorld.js';

const INK = T('strata-6'), W_ = T('elev-peak');
export const BONE = mx('strata-1', 'elev-peak', 62);
export const BONE_D = mx(BONE, INK, 58);
export const BONE_IN = mx('strata-2', 'strata-3', 40);
export const CART = mx('series-1', 'elev-peak', 26);
export const CART_D = mx('series-1', INK, 58);
export const CORD = mx('series-2', 'gold', 50);
export const CORD_D = mx(CORD, INK, 56);
export const LUNG = mx('series-4', 'elev-peak', 46);
export const LUNG_D = mx('series-4', INK, 62);
export const HEART = mx('series-6', 'series-4', 70);
export const BRAIN = mx('series-4', 'strata-2', 42);
export const MUSC = mx('series-6', 'series-4', 62);
export const MUSC_D = mx(MUSC, INK, 62);
const DIA = mx('series-6', 'series-4', 40);

const P = (x, y) => `${n(x)} ${n(y)}`;
const op = (o, part) => (o.dim?.(part) ? 0.32 : 1);
const rimW = (o, part, w) => (o.lit?.(part) ? w * 1.9 : w);

/** A long bone from (x0, y0) to (x1, y1), shaft width w, with a knob at each end. o.knob [a, b] radius factors. */
export function longBone(x0, y0, x1, y1, w, o = {}) {
  const [a, b] = o.knob ?? [1.25, 1.15], col = o.col ?? BONE;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  // the shaft waists a little in the middle
  const m = (u, s) => [x0 + dx * u + nx * s, y0 + dy * u + ny * s];
  const pts = [[0, w * a], [0.18, w * 0.62], [0.5, w * 0.5], [0.82, w * 0.6], [1, w * b]];
  const L1 = pts.map(([u, s]) => m(u, s)), R1 = pts.map(([u, s]) => m(u, -s)).reverse();
  let d = `M${P(...m(-0.03, 0))}`;
  for (const p of L1) d += `L${P(...p)}`;
  d += `L${P(...m(1.03, 0))}`;
  for (const p of R1) d += `L${P(...p)}`;
  d += 'Z';
  let s = form(d, col, { ao: Math.max(3, w * 0.5), rim: o.rim ?? 1.8, rimCol: o.rimCol, hi: 60 });
  // ends: rounded heads with their own light
  s += form(circ(x0 - dx / L * w * 0.1, y0 - dy / L * w * 0.1, w * a * 0.95), col, { ao: w * 0.4, rim: o.rim ?? 1.8, rimCol: o.rimCol });
  s += form(circ(x1 + dx / L * w * 0.1, y1 + dy / L * w * 0.1, w * b * 0.9), col, { ao: w * 0.4, rim: o.rim ?? 1.8, rimCol: o.rimCol });
  // a lit line down the shaft
  s += `<path d="M${P(...m(0.16, w * 0.3))}L${P(...m(0.84, w * 0.28))}" style="fill:none;stroke:${W_};stroke-width:${n(Math.max(1, w * 0.18))};stroke-linecap:round;opacity:.55"/>`;
  return s;
}
const circ = (x, y, r) => `M${P(x - r, y)}A${n(r)} ${n(r)} 0 1 0 ${P(x + r, y)}A${n(r)} ${n(r)} 0 1 0 ${P(x - r, y)}Z`;

// ------------------------------------------------------------------ rib cage, front view
function ribGeom(i, b) {
  const ya = 6 + i * 7.6, w = (24 + 46 * Math.sin(Math.PI * Math.min(1, (i + 1.6) / 12.4) * 0.86)) * (1 + 0.07 * b), d = 13 + i * 2.2;
  const lift = b * (2 + i * 0.7);
  const L = [w, ya + d * 0.42 - lift], F = i < 10 ? [13 + i * 3.4 + b * 1.5, ya + d - lift * 1.3] : [w * 0.72, ya + d * 0.9 - lift];
  return { ya, w, d, L, F };
}
const sternumY = (i, b) => 9 + i * 9.4 - b * 4;

/** Rib cage at (x, y) = top of the sternum, k scale. */
export function ribCageFront(x, y, k, o = {}) {
  const b = o.breath ?? 0, X = (v) => x + v * k, Y = (v) => y + v * k;
  let s = '';
  // thoracic spine behind, seen through the cage
  let sp = '';
  for (let i = 0; i < 12; i++) {
    const yy = Y(2 + i * 7.6), h = 6.2 * k, wv = (9 + i * 0.4) * k;
    sp += `<rect x="${n(x - wv / 2)}" y="${n(yy)}" width="${n(wv)}" height="${n(h)}" rx="${n(2 * k)}" style="fill:${BONE_IN};stroke:${BONE_D};stroke-width:${n(rimW(o, 'spine', 1.2))}"/>`;
    sp += `<rect x="${n(x - wv / 2)}" y="${n(yy + h)}" width="${n(wv)}" height="${n(1.4 * k)}" style="fill:${CART}"/>`;
  }
  s += `<g style="opacity:${op(o, 'spine') * 0.9}">${sp}</g>`;
  // back halves of the ribs (behind the organs): from the spine out to the side
  let back = '';
  for (let i = 0; i < 12; i++) for (const sx of [-1, 1]) {
    const g = ribGeom(i, b), d = `M${P(X(sx * 5), Y(g.ya))}Q${P(X(sx * g.w * 0.86), Y(g.ya - 9 - b * 2))} ${P(X(sx * g.L[0]), Y(g.L[1]))}`;
    back += `<path d="${d}" style="fill:none;stroke:${BONE_D};stroke-width:${n(4.4 * k)};stroke-linecap:round;opacity:.72"/><path d="${d}" style="fill:none;stroke:${mx(BONE_IN, BONE_D, 55)};stroke-width:${n(2.8 * k)};stroke-linecap:round;opacity:.85"/>`;
  }
  s += `<g style="opacity:${op(o, 'ribs')}">${back}</g>`;
  if (o.organs) s += organs(x, y, k, b, o);
  // front halves: from the side round to where the cartilage starts
  let front = '';
  for (let i = 0; i < 12; i++) for (const sx of [-1, 1]) {
    // a flat curved blade, narrow at the side, wider towards the front, lit along its upper edge
    const g = ribGeom(i, b), wk = (i > 2 && i < 9 ? 1.15 : 1) * k;
    const A = [X(sx * g.L[0]), Y(g.L[1])], C = [X(sx * (g.w * 1.03)), Y(g.F[1] - (g.F[1] - g.L[1]) * 0.15)], B = [X(sx * g.F[0]), Y(g.F[1])];
    const qb = (u) => [0, 1].map((j) => (1 - u) * (1 - u) * A[j] + 2 * (1 - u) * u * C[j] + u * u * B[j]);
    const us = [0, 0.18, 0.36, 0.54, 0.72, 0.88, 1], pts = us.map(qb), hw = us.map((u) => (1.3 + 1.9 * u) * wk);
    const bl = tapered(pts, hw);
    const edge = (f) => { const q = pts.map((p, j) => { const a = pts[Math.max(0, j - 1)], c = pts[Math.min(pts.length - 1, j + 1)], tx = c[0] - a[0], ty = c[1] - a[1], l = Math.hypot(tx, ty) || 1; return [p[0] - ty / l * hw[j] * f * sx, p[1] + tx / l * hw[j] * f * sx]; }); return 'M' + q.map((p) => P(...p)).join('L'); };
    front += `<path d="${bl}" style="fill:${BONE};stroke:${BONE_D};stroke-width:${n(Math.max(1.1, 0.5 * k))};stroke-linejoin:round"/>`
      + `<path d="${edge(0.45)}" style="fill:none;stroke:${mx(BONE, INK, 78)};stroke-width:${n(1.1 * wk)};stroke-linecap:round;opacity:.5"/>`
      + `<path d="${edge(-0.5)}" style="fill:none;stroke:${W_};stroke-width:${n(0.9 * wk)};stroke-linecap:round;opacity:.75"/>`;
  }
  s += `<g style="opacity:${op(o, 'ribs')}">${front}</g>`;
  // costal cartilage: ribs 1-7 straight to the sternum, 8-10 up to the cartilage above (the arch), 11-12 float free
  let cart = '';
  const cw = rimW(o, 'cart', 1) > 1 ? 1.25 : 1;
  for (let i = 0; i < 10; i++) for (const sx of [-1, 1]) {
    const g = ribGeom(i, b);
    let end, c;
    if (i < 7) { end = [sx * 6.5, sternumY(i, b)]; c = [sx * (g.F[0] * 0.55 + 4), (g.F[1] + end[1]) / 2 + 2]; }
    else { const up = ribGeom(i - 1, b); end = [sx * (up.F[0] * 0.55 + 4), (up.F[1] + sternumY(Math.min(6, i - 1), b)) / 2 + 3]; c = [sx * g.F[0] * 0.8, g.F[1] - 2]; }
    // tapers from the broad rib end to a narrow join at the sternum
    const A = [X(sx * g.F[0]), Y(g.F[1])], C = [X(c[0]), Y(c[1])], B = [X(end[0]), Y(end[1])];
    const qb = (u) => [0, 1].map((j) => (1 - u) * (1 - u) * A[j] + 2 * (1 - u) * u * C[j] + u * u * B[j]);
    const us = [0, 0.25, 0.5, 0.75, 1], pts = us.map(qb), hw = us.map((u) => (2.3 - 1.25 * u) * cw * k);
    const d = `M${P(...A)}Q${P(...C)} ${P(...B)}`;
    cart += `<path d="${tapered(pts, hw)}" style="fill:${CART};stroke:${CART_D};stroke-width:${n(Math.max(1.1, 0.45 * k))};stroke-linejoin:round"/><path d="${d}" style="fill:none;stroke:${W_};stroke-width:${n(0.9 * k)};stroke-linecap:round;opacity:.7;transform:translate(${n(-0.5 * k)}px,${n(-0.7 * k)}px)"/>`;
  }
  s += `<g style="opacity:${op(o, 'cart')}">${cart}</g>`;
  // sternum: handle, body, xiphoid tip
  const t = -b * 4;
  const st = `M${P(X(-8), Y(t - 2))}Q${P(X(0), Y(t - 6))} ${P(X(8), Y(t - 2))}L${P(X(7), Y(t + 14))}L${P(X(5.5), Y(t + 17))}L${P(X(6.5), Y(t + 64))}Q${P(X(5), Y(t + 70))} ${P(X(2), Y(t + 72))}L${P(X(0), Y(t + 80))}L${P(X(-2), Y(t + 72))}Q${P(X(-5), Y(t + 70))} ${P(X(-6.5), Y(t + 64))}L${P(X(-5.5), Y(t + 17))}L${P(X(-7), Y(t + 14))}Z`;
  s += `<g style="opacity:${op(o, 'sternum')}">${form(st, BONE, { ao: 4 * k, rim: rimW(o, 'sternum', 1.8), hi: 60 })}<path d="M${P(X(-5), Y(t + 16))}H${n(X(5))}M${P(X(-5.5), Y(t + 36))}H${n(X(5.5))}M${P(X(-5.5), Y(t + 52))}H${n(X(5.5))}" style="fill:none;stroke:${BONE_D};stroke-width:1.2;opacity:.5"/></g>`;
  // the windpipe behind the sternum, shown faintly through it
  if (o.organs && o.airway) {
    const A = AIRWAY_D(x, y, k, b);
    s += `<path d="M${P(X(0), Y(t - 4))}L${P(...A.fork)}" style="fill:none;stroke:${mx(CART, 'series-4', 50)};stroke-width:${n(6 * k)};stroke-linecap:round;opacity:.38"/><path d="M${P(X(-3), Y(t - 4))}L${P(A.fork[0] - 3 * k, A.fork[1])}M${P(X(3), Y(t - 4))}L${P(A.fork[0] + 3 * k, A.fork[1])}" style="fill:none;stroke:${mx(AIR, INK, 60)};stroke-width:1.4;stroke-dasharray:4 3;opacity:.75"/>`;
  }
  // collarbones
  if (o.clavicles !== false) for (const sx of [-1, 1]) s += tube(`M${P(X(sx * 7), Y(t - 2))}Q${P(X(sx * 28), Y(t - 12))} ${P(X(sx * 58), Y(t - 6))}`, BONE, 4.4 * k);
  return s;
}
/** The diaphragm's top surface at body offset u (body units), breath b: a dome that flattens when breathing in. */
export function domeY(u, b = 0) { const apex = 72 + 19 * b, edge = 100; return apex + (edge - apex) * Math.min(1, (u / 58) ** 2); }
function organs(x, y, k, b, o) {
  const X = (v) => x + v * k, Y = (v) => y + v * k, f = 1 + 0.1 * b;
  let s = '';
  const lung = (sx) => {
    const ox = sx * 4;
    // the base of each lung rests on the dome of the diaphragm and follows it down when it flattens
    const base = (u) => domeY(ox * sx + u * f + 6, b) - 2.5;
    const pts = [[2, -8], [16, -6], [34, 14], [47, 44], [52, 68], [48, base(48)], [30, base(30)], [12, base(12)], [6, 62], [sx > 0 ? 18 : 6, 46], [4, 22]];
    const q = pts.map(([u, v]) => [X(ox + sx * (u * f + 6)), Y(v * (v > 40 ? 1 : f))]);
    // a smooth closed outline through the midpoints
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = `M${P(...mid(q[q.length - 1], q[0]))}`;
    q.forEach((p, i) => { d += `Q${P(...p)} ${P(...mid(p, q[(i + 1) % q.length]))}`; });
    return d + 'Z';
  };
  let lg = '';
  for (const sx of [-1, 1]) {
    lg += form(lung(sx), LUNG, { ao: 10 * k, rim: rimW(o, 'organs', 1.8), hi: 46, inner: lungTexture(x, y, k, sx, f) });
  }
  // diaphragm: a sheet of muscle domed up under the lungs; breathing in it contracts, flattens and moves down
  const top = [], bot = [];
  for (let i = 0; i <= 16; i++) { const u = -54 + i * 6.75; top.push([X(u), Y(domeY(u, b))]); bot.push([X(u), Y(domeY(u, b) + 4.2 + Math.abs(u) / 54 * 3)]); }
  const dd = 'M' + top.map((p) => P(...p)).join('L') + 'L' + bot.reverse().map((p) => P(...p)).join('L') + 'Z';
  let fib = '';
  for (let i = 1; i < 16; i += 1) { const u = -54 + i * 6.75; fib += `M${P(X(u), Y(domeY(u, b) + 0.8))}L${P(X(u * 1.04), Y(domeY(u, b) + 3.6 + Math.abs(u) / 54 * 3))}`; }
  const tend = `M${P(X(-16), Y(domeY(-16, b) + 0.6))}Q${P(X(0), Y(domeY(0, b) + 1))} ${P(X(16), Y(domeY(16, b) + 0.6))}`;
  lg += `<g style="opacity:${o.dim?.('dia') ? 0.32 : 1}">${form(dd, DIA, { ao: 3 * k, rim: o.lit?.('dia') ? 2.6 : 1.5, hi: 44 })}<path d="${fib}" style="fill:none;stroke:${mx(DIA, INK, 70)};stroke-width:${n(0.8 * k)};opacity:.45"/><path d="${tend}" style="fill:none;stroke:${mx(DIA, W_, 30)};stroke-width:${n(2.2 * k)};stroke-linecap:round;opacity:.7"/></g>`;
  // heart behind the sternum, a little to the body's left (the viewer's right), resting on the diaphragm
  const hx = X(6), hy = Y(46 + 13 * b * 0.6);
  lg += tube(`M${P(hx + 2 * k, hy - 8 * k)}C${P(hx + 2 * k, hy - 30 * k)} ${P(hx + 20 * k, hy - 30 * k)} ${P(hx + 18 * k, hy - 12 * k)}`, mx(HEART, 'series-6', 60), 5 * k);
  const hd = `M${P(hx - 16 * k, hy - 6 * k)}C${P(hx - 12 * k, hy - 18 * k)} ${P(hx + 14 * k, hy - 18 * k)} ${P(hx + 24 * k, hy - 2 * k)}C${P(hx + 32 * k, hy + 12 * k)} ${P(hx + 22 * k, hy + 28 * k)} ${P(hx + 8 * k, hy + 34 * k)}C${P(hx - 4 * k, hy + 26 * k)} ${P(hx - 20 * k, hy + 10 * k)} ${P(hx - 16 * k, hy - 6 * k)}Z`;
  lg += form(hd, HEART, { ao: 8 * k, rim: rimW(o, 'organs', 1.8), hi: 40, inner: `<path d="M${P(hx + 2 * k, hy - 12 * k)}Q${P(hx + 12 * k, hy + 8 * k)} ${P(hx + 8 * k, hy + 32 * k)}" style="fill:none;stroke:${mx(HEART, INK, 60)};stroke-width:${n(1.4 * k)};opacity:.5"/>` });
  lg += airway(x, y, k, b, 1);
  return `<g style="opacity:${op(o, 'organs')}">${lg}</g>`;
}
// the windpipe (trachea) runs down behind the sternum and splits into two bronchi, one into each lung
const AIR = mx(CART, 'series-4', 70);
export const AIRWAY_D = (x, y, k, b = 0) => {
  const X = (v) => x + v * k, Y = (v) => y + v * k, f = 1 + 0.1 * b;
  return { trachea: `M${P(X(0), Y(-24))}L${P(X(0), Y(12))}`, bronchi: [-1, 1].map((sx) => `M${P(X(0), Y(12))}Q${P(X(sx * 6), Y(15))} ${P(X(sx * 14 * f), Y(22))}T${P(X(sx * 26 * f), Y(36))}`), fork: [X(0), Y(12)], top: [X(0), Y(-24)], ends: [-1, 1].map((sx) => [X(sx * 26 * f), Y(36)]) };
};
function airway(x, y, k, b, a) {
  const A = AIRWAY_D(x, y, k, b), X = (v) => x + v * k, Y = (v) => y + v * k, f = 1 + 0.1 * b;
  let s = tube(A.trachea, AIR, 6 * k);
  // C-shaped cartilage rings down the windpipe
  let r = '';
  for (let v = -21; v < 10; v += 3.4) r += `M${P(X(-2.8), Y(v))}Q${P(X(0), Y(v + 1.4))} ${P(X(2.8), Y(v))}`;
  s += `<path d="${r}" style="fill:none;stroke:${mx(AIR, INK, 62)};stroke-width:${n(0.8 * k)};opacity:.6"/>`;
  for (const d of A.bronchi) s += tube(d, AIR, 3.6 * k);
  // smaller branches inside each lung
  let br = '';
  for (const sx of [-1, 1]) {
    const ex = sx * 26 * f, ey = 36;
    br += `M${P(X(sx * 14 * f), Y(22))}l${n(sx * 9 * k)} ${n(-6 * k)}M${P(X(ex), Y(ey))}l${n(sx * 9 * k)} ${n(4 * k)}M${P(X(ex), Y(ey))}l${n(sx * 2 * k)} ${n(12 * k)}M${P(X(sx * 20 * f), Y(28))}l${n(sx * 12 * k)} ${n(-2 * k)}`;
  }
  s += `<path d="${br}" style="fill:none;stroke:${mx(AIR, INK, 80)};stroke-width:${n(1.8 * k)};stroke-linecap:round;opacity:.8"/>`;
  return `<g style="opacity:${a}">${s}</g>`;
}
function lungTexture(x, y, k, sx, f) {
  const r = rnd(sx > 0 ? 5 : 9);
  let s = '';
  for (let i = 0; i < 26; i++) { const u = 10 + r() * 40, v = 4 + r() * 78; s += `<circle cx="${n(x + sx * (u * f + 6) * k)}" cy="${n(y + v * k)}" r="${n((1.6 + r() * 2.2) * k)}" style="fill:${LUNG_D};opacity:.16"/>`; }
  // branching airways inside the lung
  let d = '';
  for (let i = 0; i < 5; i++) { const a = 0.2 + i * 0.28; d += `M${P(x + sx * 16 * k, y + 22 * k)}l${n(sx * Math.cos(a) * 26 * k)} ${n(Math.sin(a) * 30 * k)}l${n(sx * 8 * k)} ${n(10 * k)}`; }
  return s + `<path d="${d}" style="fill:none;stroke:${LUNG_D};stroke-width:${n(1.3 * k)};stroke-linecap:round;opacity:.35"/>`;
}

// ------------------------------------------------------------------ vertebral column, side view (front faces left)
const SEGS = [ // from the bottom: name, body height, disc below, curvature per segment (deg), body width
  ...[0, 1, 2, 3, 4].map((i) => ['L' + (5 - i), 17, 6, -6.5, 30]),
  ...Array.from({ length: 12 }, (_, i) => ['T' + (12 - i), 12.5 - i * 0.25, 4, 2.7, 25 - i * 0.6]),
  ...Array.from({ length: 7 }, (_, i) => ['C' + (7 - i), 8.5, 3.2, -3.2, 17 - i * 0.3]),
];
/** The column as a chain from the top of the sacrum (base = [x, y]). o.bend 0..1 bends forward (flexion). */
export function spineChain(base, o = {}) {
  const k = o.k ?? 1, bend = o.bend ?? 0;
  let a = 16 - bend * 4, x = base[0], y = base[1];
  const segs = [];
  SEGS.forEach(([name, h, gap, curv, bw], i) => {
    const flex = bend * (i < 5 ? 5 : i < 17 ? 1 : 1);
    // the disc below this body, then the body
    const ar = (a * Math.PI) / 180, dir = [-Math.sin(ar), -Math.cos(ar)];
    const g0 = gap * k;
    const discBase = [x, y];
    x += dir[0] * g0; y += dir[1] * g0;
    const c = [x + dir[0] * h * k / 2, y + dir[1] * h * k / 2];
    segs.push({ name, h: h * k, bw: bw * k, a, c, discBase, region: i < 5 ? 'lumbar' : i < 17 ? 'thoracic' : 'cervical', i });
    x += dir[0] * h * k; y += dir[1] * h * k;
    a += curv + flex;
  });
  return { segs, top: [x, y], a, k };
}
const rot = (c, a, u, v) => { const r = (a * Math.PI) / 180, back = [Math.cos(r), -Math.sin(r)], up = [-Math.sin(r), -Math.cos(r)]; return [c[0] + back[0] * v + up[0] * u, c[1] + back[1] * v + up[1] * u]; };
/** Draw the chain: discs, vertebrae, cord. o.lit(name or region or 'disc' or 'cord'), o.dim(...), o.upTo index lit one by one. */
export function spineSide(ch, o = {}) {
  const { segs, k } = ch;
  let discs = '', bones = '', cordPts = [];
  segs.forEach((sg, i) => {
    const { c, a, h, bw } = sg;
    const C = (u, v) => P(...rot(c, a, u, v));
    // disc: from the bottom edge of this body to the top edge of the one below (or the sacrum)
    const below = i ? segs[i - 1] : null;
    const bl = below ? rot(below.c, below.a, below.h / 2, -below.bw / 2) : rot(c, a, -h / 2 - (sg.discBase ? 6 * k : 0), -bw / 2);
    const br = below ? rot(below.c, below.a, below.h / 2, below.bw / 2) : rot(c, a, -h / 2 - 6 * k, bw / 2);
    const tl = rot(c, a, -h / 2, -bw / 2), tr = rot(c, a, -h / 2, bw / 2);
    const dd = `M${P(...tl)}Q${P(...rot(c, a, -h / 2 - 0.5 * k, -bw / 2 - 2.4 * k))} ${P(...bl)}L${P(...br)}Q${P(...rot(c, a, -h / 2 - 0.5 * k, bw / 2 + 1.6 * k))} ${P(...tr)}Z`;
    const dop = o.dim?.('disc') ? 0.4 : 1, dlit = o.lit?.('disc');
    discs += `<path d="${dd}" style="fill:${CART};stroke:${CART_D};stroke-width:${dlit ? 2.6 : 1.3};opacity:${dop}"/>`;
    if (h > 9) discs += `<path d="M${P(...rot(c, a, -h / 2 - 1.2 * k, -bw * 0.32))}L${P(...rot(c, a, -h / 2 - 1.2 * k, bw * 0.32))}" style="fill:none;stroke:${W_};stroke-width:${n(1.2 * k)};opacity:${0.7 * dop}"/>`;
    // the vertebra: body (front), arch round the canal, spinous process back and down, a transverse knob
    const lit = o.lit?.(sg.name) || o.lit?.(sg.region) || (o.upTo != null && i >= segs.length - 1 - o.upTo);
    const dim = o.dim?.(sg.name) || o.dim?.(sg.region) || o.dim?.('bone');
    const sp = (sg.region === 'lumbar' ? 18 : sg.region === 'thoracic' ? 22 : 12) * k, droop = (sg.region === 'thoracic' ? 14 : 5) * k;
    const body = `M${C(h / 2, -bw / 2 + 2 * k)}Q${C(h / 2 + 0.6 * k, -bw / 2)} ${C(h / 2 - 2 * k, -bw / 2 - 0.4 * k)}L${C(-h / 2 + 2 * k, -bw / 2 - 0.4 * k)}Q${C(-h / 2 - 0.6 * k, -bw / 2)} ${C(-h / 2, -bw / 2 + 2 * k)}L${C(-h / 2, bw / 2)}L${C(h / 2, bw / 2)}Z`;
    const arch = `M${C(h * 0.42, bw / 2 - 1 * k)}L${C(h * 0.46, bw / 2 + 9 * k)}Q${C(h * 0.5, bw / 2 + 12 * k)} ${C(h * 0.3, bw / 2 + 14 * k)}L${C(h * 0.2 - droop, bw / 2 + 12 * k + sp)}Q${C(-h * 0.1 - droop, bw / 2 + 14 * k + sp)} ${C(-h * 0.2 - droop * 0.8, bw / 2 + 10 * k + sp)}L${C(-h * 0.42, bw / 2 + 11 * k)}L${C(-h * 0.46, bw / 2 - 1 * k)}Z`;
    const g = `<g${o.seq ? ` class="${o.seq}"` : ''} style="opacity:${dim ? 0.34 : 1};--d:${n((segs.length - 1 - i) * 0.035)}s">` + form(arch, BONE, { ao: 3 * k, rim: lit ? 2 : 1.3, rimCol: lit ? mx(BONE_D, INK, 40) : undefined, hi: 58 })
      + form(body, BONE, { ao: 4 * k, rim: lit ? 2.2 : 1.4, rimCol: lit ? mx(BONE_D, INK, 40) : undefined, hi: 62, inner: `<path d="M${C(h * 0.3, -bw * 0.3)}L${C(-h * 0.3, -bw * 0.28)}M${C(h * 0.3, 0)}L${C(-h * 0.3, 0.02 * bw)}" style="fill:none;stroke:${BONE_IN};stroke-width:${n(0.9 * k)};opacity:.7"/>` })
      + `</g>`;
    bones += g;
    cordPts.push(rot(c, a, 0, bw / 2 + 5 * k));
  });
  // sacrum below the chain
  const s0 = segs[0], sa = s0.a - 22;
  const base = rot(s0.c, s0.a, -s0.h / 2 - 6 * k, 0);
  const sacr = `M${P(...rot(base, sa, 0, -s0.bw / 2))}L${P(...rot(base, sa, 0, s0.bw / 2 + 14 * k))}Q${P(...rot(base, sa, -30 * k, s0.bw / 2 + 12 * k))} ${P(...rot(base, sa, -58 * k, 6 * k))}L${P(...rot(base, sa, -62 * k, 0))}Q${P(...rot(base, sa, -34 * k, -s0.bw * 0.36))} ${P(...rot(base, sa, 0, -s0.bw / 2))}Z`;
  bones = `<g style="opacity:${o.dim?.('bone') ? 0.34 : 1}">${form(sacr, BONE, { ao: 6 * k, rim: 1.4, hi: 58, inner: [10, 22, 34, 46].map((u) => `<path d="M${P(...rot(base, sa, -u * k, -s0.bw * 0.3))}L${P(...rot(base, sa, -u * k, s0.bw * 0.3))}" style="fill:none;stroke:${BONE_IN};stroke-width:1.2;opacity:.7"/>`).join('') })}</g>` + bones;
  // the cord: a soft tube through every arch, up into the skull
  const top = segs[segs.length - 1], tip = rot(top.c, top.a, top.h * 2.2, top.bw / 2 + 2 * k);
  cordPts = [rot(s0.c, s0.a, -s0.h * 0.8, s0.bw / 2 + 5 * k), ...cordPts, tip];
  let cd = `M${P(...cordPts[0])}`;
  for (let i = 1; i < cordPts.length; i++) { const p = cordPts[i - 1], q = cordPts[i]; cd += `Q${P(...p)} ${P((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)}`; }
  cd += `L${P(...tip)}`;
  const cop = o.dim?.('cord') ? 0.35 : 1;
  const cord = `<g style="opacity:${cop}">${tube(cd, CORD, 4.6 * k, { lit: o.lit?.('cord') })}</g>`;
  // order: cord sits in the canal, behind the arches but in front of the discs' back edge
  return o.cordTop ? discs + bones + cord : discs + cord + bones;
}

// ------------------------------------------------------------------ skull, side view (face to the left)
/** Skull at (x, y) = the base where the column meets it, k scale, deg = the top vertebra angle. o.lit / o.dim: 'skull' 'brain' 'eye' 'ear' */
export function skullSide(x, y, k, deg, o = {}) {
  const tr = `translate(${n(x)} ${n(y)}) rotate(${n(-deg * 0.6)}) scale(${n(k)})`;
  const sk = (p) => (o.dim?.(p) ? 0.34 : 1), L = (p) => !!o.lit?.(p);
  // one outline: cranium vault, forehead, nasal bones, upper jaw, cheek, the base behind the jaw joint
  const outline = 'M-94 -54C-102 -100 -60 -140 -6 -140C48 -140 78 -102 74 -60C72 -34 60 -16 42 -6C30 0 16 2 2 -2L-14 -8L-26 -4C-32 4 -42 10 -52 11L-86 11C-96 10 -101 4 -102 -4L-108 -12L-111 -19L-104 -30C-103 -40 -100 -48 -94 -54Z';
  const jaw = 'M-86 14L-30 14L-16 -4C-13 -11 -5 -11 -5 -4L-11 22C-13 32 -21 38 -31 38L-72 40C-82 40 -88 34 -89 26Z';
  const win = 'M-44 -126C-10 -133 40 -128 58 -100C68 -80 66 -50 54 -30C44 -16 28 -12 14 -16L-6 -30C-22 -40 -38 -46 -48 -56C-54 -76 -54 -106 -44 -126Z';
  const cereb = 'M-60 -62C-64 -98 -40 -126 -4 -126C38 -126 62 -98 58 -68C56 -54 48 -46 36 -44C20 -42 6 -48 -6 -48C-22 -48 -34 -44 -46 -46C-54 -48 -59 -54 -60 -62Z';
  const cbl = 'M14 -40C30 -46 52 -44 54 -32C52 -20 34 -16 20 -20C12 -24 10 -34 14 -40Z';
  const cav = mx(BONE_D, INK, 46), BR = mx(mx('series-4', 'elev-peak', 50), 'strata-2', 72);
  let s = `<g transform="${tr}">`;
  s += `<g style="opacity:${sk('skull')}">${form(outline, BONE, { ao: 12, rim: L('skull') ? 3.2 : 1.8, rimCol: L('skull') ? INK : undefined, hi: 60, inner:
    // temporal hollow, cheek arch, orbit, nasal opening, ear opening, sutures
    `<ellipse cx="-34" cy="-40" rx="30" ry="18" style="fill:${BONE_D};opacity:.22"/>`
    + `<path d="M-74 -16C-56 -22 -30 -20 -14 -14" style="fill:none;stroke:${BONE_D};stroke-width:8;stroke-linecap:round;opacity:.5"/><path d="M-74 -18C-56 -24 -30 -22 -14 -16" style="fill:none;stroke:${W_};stroke-width:3;stroke-linecap:round;opacity:.5"/>`
    + `<path d="M-104 -24C-98 -22 -96 -12 -98 -4L-105 -7Z" style="fill:${cav}"/>`
    + `<path d="M-52 -137C-56 -128 -50 -120 -55 -110C-60 -100 -53 -92 -57 -82C-60 -72 -55 -66 -58 -58" style="fill:none;stroke:${BONE_D};stroke-width:${L('joints') ? 3 : 1.8};stroke-dasharray:3 2"/>`
    + `<path d="M64 -108C70 -100 64 -92 70 -84C74 -76 68 -68 72 -58" style="fill:none;stroke:${BONE_D};stroke-width:${L('joints') ? 3 : 1.8};stroke-dasharray:3 2"/>` })}`;
  // the eye socket, deep, and the eye inside it with its nerve running back
  s += `<ellipse cx="-80" cy="-36" rx="16" ry="15" style="fill:${cav}"/></g>`;
  s += `<g style="opacity:${sk('eye')}"><path d="M-70 -36C-62 -40 -56 -44 -48 -50" style="fill:none;stroke:${CORD_D};stroke-width:4;stroke-linecap:round"/><path d="M-70 -36C-62 -40 -56 -44 -48 -50" style="fill:none;stroke:${CORD};stroke-width:2.2;stroke-linecap:round"/>${form('M-81 -48A12 12 0 1 0 -80.9 -48Z', mx('elev-peak', 'series-1', 86), { ao: 6, rim: L('eye') ? 3 : 1.4, rimCol: L('eye') ? INK : undefined, hi: 40, lo: 50 })}<path d="M-92 -42Q-96 -36 -92 -30" style="fill:none;stroke:${mx('series-1', INK, 60)};stroke-width:2.4;stroke-linecap:round"/></g>`;
  s += `<g style="opacity:${sk('skull')}"><path d="M-95 -50C-90 -54 -74 -54 -66 -48M-96 -22C-88 -18 -74 -18 -66 -24" style="fill:none;stroke:${BONE};stroke-width:5;stroke-linecap:round"/><path d="M-95 -50C-90 -54 -74 -54 -66 -48M-96 -22C-88 -18 -74 -18 -66 -24" style="fill:none;stroke:${BONE_D};stroke-width:1.2;stroke-linecap:round;opacity:.6"/></g>`;
  // the cut-away window: dark cavity, the brain inside, the cut edge of the bone
  if (o.cut !== false) {
    const id = `sks${Math.round(x)}${Math.round(y)}`;
    s += `<g style="opacity:${sk('brain')}"><path d="${win}" style="fill:${cav}"/><clipPath id="${id}"><path d="${win}"/></clipPath><g clip-path="url(#${id})">`
      + form(cereb, BR, { ao: 12, rim: L('brain') ? 3 : 1.6, rimCol: L('brain') ? INK : undefined, hi: 40, inner: gyri() })
      + form(cbl, mx(BR, 'strata-3', 82), { ao: 6, rim: 1.4, inner: [0, 1, 2, 3].map((i) => `<path d="M${18 + i * 2} ${-38 + i * 5}Q36 ${-42 + i * 6} ${50 - i * 2} ${-34 + i * 5}" style="fill:none;stroke:${mx(BR, INK, 60)};stroke-width:1.2;opacity:.5"/>`).join('') })
      + `<path d="M12 -38C8 -28 4 -16 2 -2" style="fill:none;stroke:${CORD_D};stroke-width:9;stroke-linecap:round"/><path d="M12 -38C8 -28 4 -16 2 -2" style="fill:none;stroke:${CORD};stroke-width:6.5;stroke-linecap:round"/>`
      + `</g><path d="${win}" style="fill:none;stroke:${BONE_IN};stroke-width:5"/><path d="${win}" style="fill:none;stroke:${BONE_D};stroke-width:1.2"/></g>`;
  }
  // the ear: an opening behind the jaw joint and the coiled inner ear just inside the bone
  s += `<g style="opacity:${sk('ear')}"><circle cx="4" cy="-14" r="6" style="fill:${cav}"/><circle cx="-4" cy="-30" r="9" style="fill:${mx(BONE_D, INK, 64)}"/><path d="M-4 -30m-6 0a6 6 0 1 1 6 6a3.6 3.6 0 1 1 -2.4 -5a1.6 1.6 0 1 1 1.6 1.6" style="fill:none;stroke:${mx('series-4', W_, 40)};stroke-width:${L('ear') ? 2.8 : 2};stroke-linecap:round"/><path d="M2 -36q5 -6 10 -3m-8 -3q2 -6 7 -8" style="fill:none;stroke:${mx('series-4', W_, 40)};stroke-width:1.8;stroke-linecap:round"/></g>`;
  // teeth and the lower jaw
  let teeth = '';
  for (let i = 0; i < 6; i++) teeth += `<rect x="${-85 + i * 6}" y="9" width="5.4" height="8" rx="2" style="fill:${W_};stroke:${BONE_D};stroke-width:.9"/><rect x="${-84 + i * 6}" y="15" width="5.4" height="7" rx="2" style="fill:${W_};stroke:${BONE_D};stroke-width:.9"/>`;
  s += `<g style="opacity:${sk('skull')}">${form(jaw, BONE, { ao: 8, rim: L('skull') ? 3.2 : 1.6, rimCol: L('skull') ? INK : undefined, hi: 58 })}${teeth}<circle cx="-70" cy="28" r="2" style="fill:${cav}"/></g>`;
  return s + '</g>';
}
function gyri() {
  const r = rnd(4);
  let d = '';
  for (let i = 0; i < 14; i++) {
    let x = -56 + r() * 96, y = -116 + r() * 60;
    d += `M${n(x)} ${n(y)}`;
    for (let j = 0; j < 4; j++) { x += 6 + r() * 8; y += (r() - 0.5) * 14; d += `Q${n(x - 4)} ${n(y + (j % 2 ? 6 : -6))} ${n(x)} ${n(y)}`; }
  }
  return `<path d="${d}" style="fill:none;stroke:${mx(BRAIN, INK, 62)};stroke-width:1.6;stroke-linecap:round;opacity:.45"/><path d="M-56 -60Q-20 -50 30 -52" style="fill:none;stroke:${mx(BRAIN, INK, 62)};stroke-width:2.4;opacity:.5"/>`;
}

// ------------------------------------------------------------------ one pair of ribs from above
/** cx, cy centre, r radius. Front (sternum) at the top, the vertebra at the bottom. o.lit / o.dim: 'ribs' 'cart' 'sternum' 'spine' */
export function ribTop(cx, cy, r, o = {}) {
  const b = o.breath ?? 0, wr = r * (0.86 + 0.06 * b);
  let s = `<ellipse cx="${n(cx)}" cy="${n(cy + r * 0.06)}" rx="${n(wr * 0.72)}" ry="${n(r * 0.52)}" style="fill:${LUNG};opacity:.28"/>`;
  // vertebra at the back: round body towards the front, spinous process pointing back
  const vy = cy + r * 0.62, vb = r * 0.17;
  const vert = form(circ(cx, vy - vb * 0.3, vb), BONE, { ao: 5, rim: o.lit?.('spine') ? 2.8 : 1.4, rimCol: o.lit?.('spine') ? INK : undefined })
    + form(`M${P(cx - vb * 0.7, vy + vb * 0.4)}Q${P(cx, vy + vb * 1.7)} ${P(cx + vb * 0.7, vy + vb * 0.4)}L${P(cx + vb * 0.2, vy + vb * 2.6)}L${P(cx - vb * 0.2, vy + vb * 2.6)}Z`, BONE, { ao: 3, rim: 1.4 })
    + `<circle cx="${n(cx)}" cy="${n(vy + vb * 1.05)}" r="${n(vb * 0.36)}" style="fill:${CORD};stroke:${CORD_D};stroke-width:1.2"/>`;
  s += `<g style="opacity:${op(o, 'spine')}">${vert}</g>`;
  // the two ribs: from the vertebra round the sides to the front
  const sy = cy - r * 0.78;
  let ribs = '', cart = '';
  for (const sx of [-1, 1]) {
    const d = `M${P(cx + sx * vb * 0.9, vy - vb * 0.2)}C${P(cx + sx * wr * 0.9, vy + r * 0.1)} ${P(cx + sx * wr * 1.12, cy - r * 0.3)} ${P(cx + sx * wr * 0.6, sy + r * 0.2)}`;
    ribs += tube(d, BONE, r * 0.075, { lit: o.lit?.('ribs') });
    const c = `M${P(cx + sx * wr * 0.6, sy + r * 0.2)}Q${P(cx + sx * wr * 0.36, sy + r * 0.04)} ${P(cx + sx * r * 0.12, sy)}`;
    const w = r * 0.07 * (o.lit?.('cart') ? 1.25 : 1);
    cart += `<path d="${c}" style="fill:none;stroke:${CART_D};stroke-width:${n(w + 2)};stroke-linecap:round"/><path d="${c}" style="fill:none;stroke:${CART};stroke-width:${n(w)};stroke-linecap:round"/>`;
  }
  s += `<g style="opacity:${op(o, 'ribs')}">${ribs}</g><g style="opacity:${op(o, 'cart')}">${cart}</g>`;
  s += `<g style="opacity:${op(o, 'sternum')}">${form(`M${P(cx - r * 0.13, sy - r * 0.05)}Q${P(cx, sy - r * 0.11)} ${P(cx + r * 0.13, sy - r * 0.05)}L${P(cx + r * 0.12, sy + r * 0.06)}L${P(cx - r * 0.12, sy + r * 0.06)}Z`, BONE, { ao: 3, rim: o.lit?.('sternum') ? 2.8 : 1.4, rimCol: o.lit?.('sternum') ? INK : undefined })}</g>`;
  return s;
}

// ------------------------------------------------------------------ the whole skeleton, front view
/** (x, y) = top of the skull, k scale. o.lit / o.dim: 'skull' 'spine' 'ribs' 'limbs' 'pelvis'; o.muscle: a biceps on the right arm. */
export function skeletonFront(x, y, k, o = {}) {
  const X = (v) => x + v * k, Y = (v) => y + v * k, dm = (p) => (o.dim?.(p) ? 0.32 : 1), lw = (p) => (o.lit?.(p) ? 2.8 : 1.6), rc = (p) => (o.lit?.(p) ? INK : undefined);
  let s = '';
  // legs
  let legs = '';
  for (const sx of [-1, 1]) {
    legs += longBone(X(sx * 26), Y(318), X(sx * 30), Y(426), 5.4 * k, { knob: [1.5, 1.45], rim: lw('limbs'), rimCol: rc('limbs') });
    legs += longBone(X(sx * 39), Y(444), X(sx * 37), Y(536), 2.2 * k, { knob: [1.4, 1.5], rim: 1.2 });
    legs += longBone(X(sx * 29), Y(440), X(sx * 28), Y(540), 4.6 * k, { knob: [1.7, 1.3], rim: lw('limbs'), rimCol: rc('limbs') });
    legs += form(circ(X(sx * 30), Y(430), 4.2 * k), BONE, { ao: 2 * k, rim: 1.4 });
    legs += form(`M${P(X(sx * 22), Y(544))}L${P(X(sx * 36), Y(542))}Q${P(X(sx * 46), Y(552))} ${P(X(sx * 44), Y(562))}L${P(X(sx * 20), Y(562))}Q${P(X(sx * 18), Y(552))} ${P(X(sx * 22), Y(544))}Z`, BONE, { ao: 3 * k, rim: 1.4, inner: [0, 1, 2, 3].map((j) => `<path d="M${P(X(sx * (24 + j * 5)), Y(552))}V${n(Y(562))}" style="fill:none;stroke:${BONE_D};stroke-width:1;opacity:.5"/>`).join('') });
  }
  s += `<g style="opacity:${dm('limbs')}">${legs}</g>`;
  // pelvis with the sacrum
  // pelvis: flared hip bones (ilium wings with a hollow), the hip socket, the ring of pubis and ischium round a hole
  const pel = (sx) => `M${P(X(sx * 8), Y(276))}C${P(X(sx * 22), Y(262))} ${P(X(sx * 46), Y(260))} ${P(X(sx * 54), Y(272))}C${P(X(sx * 58), Y(282))} ${P(X(sx * 50), Y(294))} ${P(X(sx * 42), Y(300))}C${P(X(sx * 36), Y(304))} ${P(X(sx * 34), Y(310))} ${P(X(sx * 32), Y(318))}C${P(X(sx * 30), Y(330))} ${P(X(sx * 26), Y(340))} ${P(X(sx * 18), Y(342))}C${P(X(sx * 10), Y(342))} ${P(X(sx * 6), Y(336))} ${P(X(sx * 2), Y(330))}L${P(X(sx * 2), Y(320))}C${P(X(sx * 8), Y(318))} ${P(X(sx * 12), Y(312))} ${P(X(sx * 14), Y(306))}C${P(X(sx * 16), Y(294))} ${P(X(sx * 12), Y(284))} ${P(X(sx * 8), Y(276))}Z`;
  let pv = '';
  for (const sx of [-1, 1]) pv += form(pel(sx), BONE, { ao: 5 * k, rim: lw('pelvis'), hi: 56, inner: `<path d="M${P(X(sx * 20), Y(272))}C${P(X(sx * 40), Y(268))} ${P(X(sx * 48), Y(280))} ${P(X(sx * 36), Y(294))}C${P(X(sx * 26), Y(300))} ${P(X(sx * 18), Y(290))} ${P(X(sx * 20), Y(272))}Z" style="fill:${BONE_D};opacity:.22"/><ellipse cx="${n(X(sx * 17))}" cy="${n(Y(327))}" rx="${n(5.4 * k)}" ry="${n(7 * k)}" style="fill:${mx(BONE_D, INK, 60)};opacity:.8"/><circle cx="${n(X(sx * 30))}" cy="${n(Y(312))}" r="${n(5 * k)}" style="fill:${BONE_D};opacity:.4"/>` });
  pv += form(`M${P(X(-9), Y(270))}L${P(X(9), Y(270))}L${P(X(6), Y(300))}L${P(X(0), Y(308))}L${P(X(-6), Y(300))}Z`, BONE, { ao: 3 * k, rim: 1.4, inner: [278, 286, 294].map((yy) => `<path d="M${P(X(-6), Y(yy))}H${n(X(6))}" style="fill:none;stroke:${BONE_D};stroke-width:1;opacity:.5"/>`).join('') });
  s += `<g style="opacity:${dm('pelvis')}">${pv}</g>`;
  // lumbar spine and the neck
  let sp = '';
  for (let i = 0; i < 5; i++) { const yy = Y(214 + i * 11), wv = (16 + i) * k; sp += `<rect x="${n(X(0) - wv / 2)}" y="${n(yy)}" width="${n(wv)}" height="${n(8.4 * k)}" rx="${n(2.4 * k)}" style="fill:${BONE};stroke:${o.lit?.('spine') ? INK : BONE_D};stroke-width:${lw('spine') * 0.8}"/><rect x="${n(X(0) - wv / 2)}" y="${n(yy + 8.4 * k)}" width="${n(wv)}" height="${n(2.6 * k)}" style="fill:${CART}"/><path d="M${P(X(-wv / k / 2), yy + 4 * k)}h${n(-5 * k)}M${P(X(wv / k / 2), yy + 4 * k)}h${n(5 * k)}" style="fill:none;stroke:${BONE_D};stroke-width:${n(2.6 * k)};stroke-linecap:round"/>`; }
  for (let i = 0; i < 4; i++) { const yy = Y(98 + i * 7.4), wv = 11 * k; sp += `<rect x="${n(X(0) - wv / 2)}" y="${n(yy)}" width="${n(wv)}" height="${n(5.4 * k)}" rx="${n(1.6 * k)}" style="fill:${BONE};stroke:${o.lit?.('spine') ? INK : BONE_D};stroke-width:${lw('spine') * 0.8}"/>`; }
  s += `<g style="opacity:${dm('spine')}">${sp}</g>`;
  // rib cage (with its own spine behind and the collarbones)
  s += ribCageFront(X(0), Y(128), k, { lit: (p) => (p === 'ribs' || p === 'sternum' || p === 'cart') && o.lit?.('ribs') || (p === 'spine' && o.lit?.('spine')), dim: (p) => ((p === 'ribs' || p === 'sternum' || p === 'cart') && o.dim?.('ribs')) || (p === 'spine' && o.dim?.('spine')) });
  // arms
  let arms = '';
  for (const sx of [-1, 1]) {
    arms += form(`M${P(X(sx * 46), Y(126))}Q${P(X(sx * 60), Y(118))} ${P(X(sx * 64), Y(132))}L${P(X(sx * 56), Y(160))}Q${P(X(sx * 46), Y(150))} ${P(X(sx * 46), Y(126))}Z`, BONE, { ao: 3 * k, rim: 1.2, hi: 56 });
    arms += longBone(X(sx * 60), Y(136), X(sx * 68), Y(214), 4.2 * k, { knob: [1.6, 1.4], rim: lw('limbs'), rimCol: rc('limbs') });
    arms += longBone(X(sx * 64), Y(222), X(sx * 70), Y(290), 2.4 * k, { knob: [1.4, 1.5], rim: 1.2 });
    arms += longBone(X(sx * 72), Y(222), X(sx * 78), Y(288), 2.6 * k, { knob: [1.6, 1.3], rim: lw('limbs'), rimCol: rc('limbs') });
    let fing = '';
    for (let j = 0; j < 5; j++) { const fx = X(sx * (66 + j * 4.2)), fy = Y(302); fing += `M${P(fx, fy)}L${P(fx + sx * (j - 2) * 1.2 * k, fy + (j === 0 ? 18 : 26 - Math.abs(j - 2.5) * 3) * k)}`; }
    arms += `<path d="${fing}" style="fill:none;stroke:${BONE_D};stroke-width:${n(3.6 * k)};stroke-linecap:round"/><path d="${fing}" style="fill:none;stroke:${BONE};stroke-width:${n(2.2 * k)};stroke-linecap:round"/>`;
    arms += form(`M${P(X(sx * 64), Y(292))}L${P(X(sx * 82), Y(290))}L${P(X(sx * 84), Y(304))}L${P(X(sx * 64), Y(306))}Z`, BONE, { ao: 2 * k, rim: 1.2 });
  }
  if (o.muscle) {
    // a biceps on the body's left arm (viewer's right), with its tendon to the forearm: a muscle pulling on bone
    const sx = 1, md = `M${P(X(sx * 58), Y(140))}Q${P(X(sx * 74), Y(170))} ${P(X(sx * 68), Y(206))}Q${P(X(sx * 60), Y(176))} ${P(X(sx * 58), Y(140))}Z`;
    arms += `<g style="opacity:.92">${form(md, MUSC, { ao: 5 * k, rim: o.lit?.('muscle') ? 2.6 : 1.4, hi: 44, inner: `<path d="M${P(X(62), Y(150))}Q${P(X(68), Y(176))} ${P(X(66), Y(198))}" style="fill:none;stroke:${MUSC_D};stroke-width:1;opacity:.5"/>` })}</g>`;
    arms += `<path d="M${P(X(sx * 68), Y(204))}L${P(X(sx * 70), Y(228))}" style="fill:none;stroke:${W_};stroke-width:${n(2.4 * k)};stroke-linecap:round"/>`;
  }
  s += `<g style="opacity:${dm('limbs')}">${arms}</g>`;
  // skull, front view
  const sk = `M${P(X(-30), Y(36))}C${P(X(-31), Y(8))} ${P(X(-16), Y(0))} ${P(X(0), Y(0))}C${P(X(16), Y(0))} ${P(X(31), Y(8))} ${P(X(30), Y(36))}C${P(X(30), Y(50))} ${P(X(27), Y(58))} ${P(X(24), Y(64))}L${P(X(20), Y(78))}C${P(X(17), Y(88))} ${P(X(10), Y(95))} ${P(X(0), Y(95))}C${P(X(-10), Y(95))} ${P(X(-17), Y(88))} ${P(X(-20), Y(78))}L${P(X(-24), Y(64))}C${P(X(-27), Y(58))} ${P(X(-30), Y(50))} ${P(X(-30), Y(36))}Z`;
  const cav = mx(BONE_D, INK, 56);
  const orbit = (sx) => `M${P(X(sx * 3), Y(38))}Q${P(X(sx * 3), Y(36))} ${P(X(sx * 6), Y(36))}L${P(X(sx * 17), Y(37))}Q${P(X(sx * 20), Y(38))} ${P(X(sx * 20), Y(42))}L${P(X(sx * 19), Y(50))}Q${P(X(sx * 18), Y(54))} ${P(X(sx * 14), Y(54))}L${P(X(sx * 6), Y(53))}Q${P(X(sx * 3), Y(52))} ${P(X(sx * 3), Y(48))}Z`;
  let holes = '';
  for (const sx of [-1, 1]) holes += `<path d="${orbit(sx)}" style="fill:${cav}"/><path d="M${P(X(sx * 5), Y(52))}Q${P(X(sx * 12), Y(56))} ${P(X(sx * 19), Y(50))}" style="fill:none;stroke:${BONE};stroke-width:${n(2 * k)};opacity:.9"/><path d="M${P(X(sx * 20), Y(58))}Q${P(X(sx * 26), Y(60))} ${P(X(sx * 27), Y(52))}" style="fill:none;stroke:${BONE_D};stroke-width:${n(1.2 * k)};opacity:.6"/>`;
  holes += `<path d="M${P(X(-4), Y(66))}Q${P(X(-5), Y(58))} ${P(X(0), Y(56))}Q${P(X(5), Y(58))} ${P(X(4), Y(66))}Q${P(X(0), Y(68))} ${P(X(-4), Y(66))}Z" style="fill:${cav}"/>`;
  holes += `<path d="M${P(X(-22), Y(34))}Q${P(X(0), Y(28))} ${P(X(22), Y(34))}" style="fill:none;stroke:${W_};stroke-width:${n(2.4 * k)};opacity:.45"/>`;
  for (let i = -3; i <= 3; i++) holes += `<rect x="${n(X(i * 3.4 - 1.5))}" y="${n(Y(72))}" width="${n(3 * k)}" height="${n(5 * k)}" rx="${n(1 * k)}" style="fill:${W_};stroke:${BONE_D};stroke-width:.6"/><rect x="${n(X(i * 3.2 - 1.4))}" y="${n(Y(78.5))}" width="${n(2.8 * k)}" height="${n(4.4 * k)}" rx="${n(1 * k)}" style="fill:${W_};stroke:${BONE_D};stroke-width:.6"/>`;
  holes += `<path d="M${P(X(-21), Y(70))}Q${P(X(-20), Y(78))} ${P(X(-14), Y(80))}M${P(X(21), Y(70))}Q${P(X(20), Y(78))} ${P(X(14), Y(80))}" style="fill:none;stroke:${BONE_D};stroke-width:${n(1.2 * k)};opacity:.7"/>`;
  s += `<g style="opacity:${dm('skull')}">${form(sk, BONE, { ao: 8 * k, rim: lw('skull') + 0.4, rimCol: rc('skull'), hi: 60, inner: holes })}</g>`;
  return s;
}
