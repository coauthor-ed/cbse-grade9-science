// CellTypes - single plant cells for the tissues module (scene batch S2). Not a scene. SVG strings, tokens only, no words.
// Built on CellWorld (nucleus, organelles, grain) and StemArt (stain colours). Light from the top left.
//   meriCell(x, y, s, o)        a meristem cell, s px across: thin wall, dense grainy cytoplasm full of small organelles,
//                               a large nucleus, no vacuole. o.part(name) -> opacity for wall cyto nuc. o.seed, o.glow
//   permCell(x, y, w, h, o)     a permanent cell from farther back: thick wall, one large vacuole filling most of it, a thin
//                               layer of cytoplasm, the nucleus pushed to the side. o.part(name) for wall cyto nuc vac
//   epiCell, parCell, collCell, sclCell (x, y, s, o)   the cells a meristem cell becomes; xylem and phloem come from TissueArt
import { T, mx, n1, rnd, nucleus, mitochondrion, ribosome, blobPath } from './CellWorld.js';
import { STAIN } from './StemArt.js';

const W_ = T('elev-peak'), INK = T('strata-6');
const rr = (x, y, w, h, r) => `M${n1(x + r)} ${n1(y)}H${n1(x + w - r)}Q${n1(x + w)} ${n1(y)} ${n1(x + w)} ${n1(y + r)}V${n1(y + h - r)}Q${n1(x + w)} ${n1(y + h)} ${n1(x + w - r)} ${n1(y + h)}H${n1(x + r)}Q${n1(x)} ${n1(y + h)} ${n1(x)} ${n1(y + h - r)}V${n1(y + r)}Q${n1(x)} ${n1(y)} ${n1(x + r)} ${n1(y)}Z`;
const pick = (o) => (n) => { const v = o.part?.(n); return v === undefined ? 1 : v; };
const G = (a, s) => (a <= 0 ? '' : `<g${a < 1 ? ` opacity="${a}"` : ''}>${s}</g>`);
let U = 0;
const uid = (p) => `${p}${(U = (U + 1) % 100000)}`;
function grain(d, x, y, w, h, a) { const id = uid('ctg'); return `<clipPath id="${id}"><path d="${d}"/></clipPath><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" clip-path="url(#${id})" style="fill:${mx('series-5', INK, 60)};opacity:${a};filter:url(#cw-grain)"/>`; }

export function meriCell(x, y, s, o = {}) {
  const P = pick(o), q = rnd(o.seed ?? 3), h = s * (o.tall ?? 0.92), x0 = x - s / 2, y0 = y - h / 2, d = rr(x0, y0, s, h, s * 0.08);
  let out = `<path d="${d}" transform="translate(4 7)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  if (o.glow) out += `<path d="${d}" style="fill:none;stroke:${T('gold')};stroke-width:${n1(s * 0.12)};opacity:.45;filter:url(#cw-blur3)"/>`;
  // dense cytoplasm: deeper tint, heavy grain, many small organelles packed in
  let c = `<path d="${d}" style="fill:url(#cw-cyto) ${mx('membrane', W_, 30)}"/><path d="${d}" style="fill:${T('series-5')};opacity:.14"/>${grain(d, x0, y0, s, h, 0.42)}`;
  for (let i = 0; i < Math.round(s * 0.5); i++) c += ribosome(x0 + s * (0.1 + q() * 0.8), y0 + h * (0.1 + q() * 0.8), Math.max(1.4, s * 0.012));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + q(), r = s * (0.34 + q() * 0.06); c += mitochondrion(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9, s * 0.0016 * 70 / 100 * 1.1, { rot: (a * 57) + 90, seed: i }); }
  out += G(P('cyto'), c);
  out += G(P('nuc'), nucleus(x - s * 0.02, y + s * 0.02, s * 0.27, { seed: o.seed ?? 3 }));
  if (o.split) {
    const k = Math.min(1, o.split);
    out += `<path d="M${n1(x)} ${n1(y - h / 2 * k)}V${n1(y + h / 2 * k)}" style="stroke:${STAIN.cellD};stroke-width:2.4"/><path d="M${n1(x + 2)} ${n1(y - h / 2 * k)}V${n1(y + h / 2 * k)}" style="stroke:${W_};stroke-width:1;opacity:.7"/>`;
  }
  out += G(P('wall'), `<path d="${d}" style="fill:none;stroke:${STAIN.cellD};stroke-width:${n1(Math.max(1.8, s * 0.016))}"/><path d="${rr(x0 + 2.5, y0 + 2.5, s - 5, h - 5, s * 0.06)}" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.7"/>`);
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${out}</g>`;
}

export function permCell(x, y, w, h, o = {}) {
  const P = pick(o), q = rnd(o.seed ?? 5), ww = Math.max(7, Math.min(w, h) * 0.05), x0 = x - w / 2, y0 = y - h / 2;
  const outer = rr(x0, y0, w, h, ww * 1.6), inner = rr(x0 + ww, y0 + ww, w - 2 * ww, h - 2 * ww, ww);
  let s = `<path d="${outer}" transform="translate(6 10)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  s += G(P('wall'), `<path d="${outer}" style="fill:url(#cw-wall) ${T('elev-low')};stroke:${mx('elev-low', INK, 56)};stroke-width:2"/><path d="${rr(x0 + 3, y0 + 3, w - 6, h - 6, ww)}" style="fill:none;stroke:${mx('elev-low', W_, 40)};stroke-width:1.6;opacity:.7"/>`);
  let c = `<path d="${inner}" style="fill:url(#cw-cytoG) ${mx('sea-shallow', W_, 20)}"/>${grain(inner, x0, y0, w, h, 0.2)}`;
  for (let i = 0; i < 16; i++) { const a = q() * 6.28; c += ribosome(x + Math.cos(a) * (w / 2 - ww - 6), y + Math.sin(a) * (h / 2 - ww - 6), 1.8); }
  c += mitochondrion(x0 + ww + 12, y + h * 0.3, 0.16, { rot: 80, seed: 2 }) + mitochondrion(x + w * 0.1, y0 + ww + 8, 0.16, { rot: 4, seed: 5 });
  s += G(P('cyto'), c);
  const vx = x - w * 0.06, vy = y + h * 0.02, vrx = w / 2 - ww - 16, vry = h / 2 - ww - 12;
  const vd = blobPath(vx, vy, vrx, vry, 7, 0.03, 12);
  s += G(P('vac'), `<path d="${vd}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 40)};stroke:${mx('sea-shallow', 'sea-deep', 76)};stroke-width:2"/><path d="M${n1(vx - vrx * 0.7)} ${n1(vy - vry * 0.3)}C${n1(vx - vrx * 0.56)} ${n1(vy - vry * 0.74)} ${n1(vx - vrx * 0.1)} ${n1(vy - vry * 0.86)} ${n1(vx + vrx * 0.3)} ${n1(vy - vry * 0.78)}" style="fill:none;stroke:${W_};stroke-width:${n1(Math.max(3, vrx * 0.06))};opacity:.8"/>`);
  s += G(P('nuc'), nucleus(x + w / 2 - ww - Math.min(w, h) * 0.11, y + h * 0.18, Math.min(w, h) * 0.09, { seed: 9 }));
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}

// The cells a meristem cell becomes. Each about s px across, centred on (x, y).
export function epiCell(x, y, s) {
  const w = s * 1.3, h = s * 0.5, d = rr(x - w / 2, y - h / 2, w, h, 5);
  return `<path d="${d}" transform="translate(3 5)" style="fill:${INK};opacity:.18"/><path d="${d}" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:2.4"/>`
    + `<path d="M${n1(x - w / 2 + 2)} ${n1(y - h / 2 - 2)}H${n1(x + w / 2 - 2)}" style="stroke:${STAIN.cut};stroke-width:5;stroke-linecap:round"/><path d="M${n1(x - w / 2 + 4)} ${n1(y - h / 2 - 3.4)}H${n1(x + w / 4)}" style="stroke:${W_};stroke-width:1.4;opacity:.7"/>`
    + nucleus(x + w * 0.22, y + 1, h * 0.22, { nucleolus: false, pores: false });
}
export function parCell(x, y, s) {
  const d = blobPath(x, y, s * 0.5, s * 0.46, 4, 0.05, 10);
  return `<path d="${d}" transform="translate(3 5)" style="fill:${INK};opacity:.18"/><path d="${d}" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:2"/>`
    + `<path d="${blobPath(x - s * 0.04, y, s * 0.34, s * 0.3, 6, 0.04, 10)}" style="fill:${mx('sea-shallow', W_, 16)};stroke:${mx('sea-shallow', W_, 50)};stroke-width:1.2"/>`
    + [[-0.2, 0.26], [0.12, 0.3], [0.28, -0.12]].map(([a, b]) => `<circle cx="${n1(x + a * s)}" cy="${n1(y + b * s)}" r="${n1(s * 0.05)}" style="fill:${W_};stroke:${mx('strata-1', INK, 40)};stroke-width:1"/>`).join('')
    + nucleus(x + s * 0.3, y + s * 0.12, s * 0.1, { nucleolus: false, pores: false });
}
export function collCell(x, y, s) {
  const h = s / 2, sq = `M${n1(x - h)} ${n1(y - h)}H${n1(x + h)}V${n1(y + h)}H${n1(x - h)}Z`, inner = blobPath(x, y, h * 0.84, h * 0.84, 3, 0.04, 8);
  return `<path d="${sq}" transform="translate(3 5)" style="fill:${INK};opacity:.18"/><path d="${sq}" style="fill:url(#st-pect) ${STAIN.pect};stroke:${STAIN.pectD};stroke-width:1.6;stroke-linejoin:round"/>`
    + `<path d="${inner}" style="fill:url(#st-lumP) ${STAIN.lumen};stroke:${STAIN.pectD};stroke-width:1.6"/>` + nucleus(x + s * 0.1, y + s * 0.06, s * 0.13, { nucleolus: false, pores: false });
}
export function sclCell(x, y, s) {
  const d = blobPath(x, y, s * 0.5, s * 0.48, 2, 0.04, 8), l = blobPath(x, y, s * 0.12, s * 0.1, 5, 0.2, 6);
  return `<path d="${d}" transform="translate(3 5)" style="fill:${INK};opacity:.18"/><path d="${d}" style="fill:url(#st-lig) ${STAIN.lig};stroke:${STAIN.ligD};stroke-width:2"/>`
    + `<path d="${blobPath(x, y, s * 0.36, s * 0.34, 2, 0.04, 8)}" style="fill:none;stroke:${STAIN.ligL};stroke-width:1.2;opacity:.6"/><path d="${blobPath(x, y, s * 0.24, s * 0.22, 2, 0.05, 8)}" style="fill:none;stroke:${STAIN.ligD};stroke-width:1;opacity:.5"/>`
    + `<path d="${l}" style="fill:${mx('strata-1', W_, 30)};stroke:${STAIN.ligD};stroke-width:1.2"/>`;
}
