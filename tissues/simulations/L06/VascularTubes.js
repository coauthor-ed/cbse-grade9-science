// VascularTubes - blk-l06-s9 (3 beats: complex, tubes, others) and blk-l06-s11 (5 beats: question, living, sieve,
// companion, others). Fig 3.9 as a lengthwise block of cells. Xylem: fibres, tracheids (long, narrow, tapering),
// vessels (wide, joined end to end, ring and spiral thickening), xylem parenchyma (the only living cells). Water and
// minerals go up. Phloem: sieve tubes (cells end to end, sieve plates with pores, no nucleus), a companion cell beside
// each sieve tube cell, phloem parenchyma (stores), phloem fibres. Food (sugar) goes from the leaf to the root.
// Name chips under the picture light each kind of cell.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, label, svgPlantColour as pc } from '../shared/PlantArt.js';
import { cwFrame, depthField, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, travel } from '../shared/BodyArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
const LIG = mx('series-2', 'strata-3', 50), LIG_D = mx(LIG, INK, 55), LIG_L = mx(LIG, W_, 45);
const HOL = mx('sea-shallow', 'elev-peak', 40);
const CYT = mx('elev-low', 'elev-peak', 46), CYT_D = mx('elev-low', INK, 50);
const PHL = mx('elev-low', 'series-3', 52), PHL_D = mx(PHL, INK, 56), PHL_L = mx(PHL, W_, 50);
const WAT = T('series-1'), WAT_D = mx('series-1', INK, 56), SUG = T('series-2'), SUG_D = mx('series-2', INK, 58);

const XCHIPS = [
  { id: 'trach', label: 'Tracheid', targets: ['trach'] },
  { id: 'vessel', label: 'Vessel', targets: ['vessel'] },
  { id: 'xfib', label: 'Xylem fibre', targets: ['xfib'] },
  { id: 'xpar', label: 'Xylem parenchyma', targets: ['xpar'] },
];
const PCHIPS = [
  { id: 'sieve', label: 'Sieve tube', targets: ['sieve'] },
  { id: 'comp', label: 'Companion cell', targets: ['comp'] },
  { id: 'ppar', label: 'Phloem parenchyma', targets: ['ppar'] },
  { id: 'pfib', label: 'Phloem fibre', targets: ['pfib'] },
];
// what each step lights when no chip is held
const LIT = { 0: ['trach', 'vessel', 'xfib', 'xpar'], 1: ['trach', 'vessel'], 2: ['xpar'], 4: ['sieve', 'comp', 'ppar', 'pfib'], 5: ['sieve'], 6: ['comp', 'sieve'], 7: ['ppar', 'pfib'] };

// -- cells, drawn upright from y0 to y1 ---------------------------------------
const grainRect = (x, y, w, h, a = 0.16) => `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" style="fill:${INK};opacity:${a};filter:url(#cw-grain)"/>`;
// A fibre: long, pointed both ends, thick lignified wall (shaded), a tiny slit of empty lumen down the middle.
function fibre(x, y0, y1, w, col, colD) {
  const d = `M${n1(x)} ${n1(y0)}C${n1(x + w * 0.7)} ${n1(y0 + 30)} ${n1(x + w / 2)} ${n1(y0 + 40)} ${n1(x + w / 2)} ${n1(y0 + 60)}V${n1(y1 - 60)}C${n1(x + w / 2)} ${n1(y1 - 40)} ${n1(x + w * 0.7)} ${n1(y1 - 30)} ${n1(x)} ${n1(y1)}C${n1(x - w * 0.7)} ${n1(y1 - 30)} ${n1(x - w / 2)} ${n1(y1 - 40)} ${n1(x - w / 2)} ${n1(y1 - 60)}V${n1(y0 + 60)}C${n1(x - w / 2)} ${n1(y0 + 40)} ${n1(x - w * 0.7)} ${n1(y0 + 30)} ${n1(x)} ${n1(y0)}Z`;
  const lw = Math.max(1.6, w * 0.12);
  return `<path d="${d}" style="fill:${col};stroke:${colD};stroke-width:1.8"/><path d="${d}" style="fill:url(#vt-side) ${col};opacity:.55"/><path d="${d}" style="fill:${INK};opacity:.14;filter:url(#cw-grain)"/>`
    + `<path d="M${n1(x - w / 2 + 2.2)} ${n1(y0 + 58)}V${n1(y1 - 58)}" style="fill:none;stroke:${W_};stroke-width:1.6;opacity:.5"/>`
    + `<path d="M${n1(x)} ${n1(y0 + 30)}V${n1(y1 - 30)}" style="fill:none;stroke:${mx(colD, INK, 60)};stroke-width:${n1(lw + 1.6)};stroke-linecap:round"/><path d="M${n1(x)} ${n1(y0 + 34)}V${n1(y1 - 34)}" style="fill:none;stroke:${mx(HOL, 'elev-peak', 50)};stroke-width:${n1(lw)};stroke-linecap:round"/>`
    + [0.3, 0.5, 0.7].map((u) => `<path d="M${n1(x - w * 0.4)} ${n1(y0 + (y1 - y0) * u)}L${n1(x - lw)} ${n1(y0 + (y1 - y0) * u + 2)}M${n1(x + lw)} ${n1(y0 + (y1 - y0) * u + 4)}L${n1(x + w * 0.4)} ${n1(y0 + (y1 - y0) * u + 6)}" style="fill:none;stroke:${mx(HOL, 'elev-peak', 40)};stroke-width:1;opacity:.6"/>`).join('');
}
// A column of fibres, packed: spindles overlapping end to end, staggered.
function fibreCol(x, y0, y1, w, col, colD, seed = 2) {
  const r = rnd(seed), L = 170 + r() * 40; let s = '';
  for (let y = y0 - L * (0.3 + r() * 0.4); y < y1 + 10; y += L * 0.78) s += fibre(x + (r() - 0.5) * w * 0.12, y, y + L, w * 0.96, col, colD);
  return s;
}
// A tracheid: long, narrow, tapering at both ends, thick wall with pits and ring thickening.
function tracheid(x, y0, y1, w) {
  const d = `M${n1(x + w * 0.1)} ${n1(y0)}L${n1(x + w / 2)} ${n1(y0 + w * 1.6)}V${n1(y1 - w * 1.6)}L${n1(x - w * 0.1)} ${n1(y1)}L${n1(x - w / 2)} ${n1(y1 - w * 1.6)}V${n1(y0 + w * 1.6)}Z`;
  const wall = Math.max(3, w * 0.2);
  let s = `<path d="${d}" style="fill:${HOL};stroke:${LIG};stroke-width:${n1(wall * 2)};stroke-linejoin:round"/><path d="${d}" style="fill:none;stroke:${LIG_D};stroke-width:1.6"/>`;
  // bordered pits: a ring with a dark pore, in rows on the wall (seen face on)
  s += `<path d="${d}" style="fill:${INK};opacity:.1;filter:url(#cw-grain)"/>`;
  for (let y = y0 + w * 1.6 + 8, i = 0; y < y1 - w * 1.6 - 4; y += 15, i++) {
    const px = x + ((i % 2) - 0.5) * w * 0.34;
    s += `<ellipse cx="${n1(px)}" cy="${n1(y)}" rx="${n1(w * 0.2)}" ry="${n1(w * 0.15)}" style="fill:${mx(HOL, 'elev-peak', 40)};stroke:${LIG_D};stroke-width:1.2"/><ellipse cx="${n1(px)}" cy="${n1(y)}" rx="${n1(w * 0.07)}" ry="${n1(w * 0.05)}" style="fill:${LIG_D}"/>`;
  }
  return s + `<path d="M${n1(x - w / 2 + 1)} ${n1(y0 + w * 1.6)}V${n1(y1 - w * 1.6)}" style="fill:none;stroke:${LIG_L};stroke-width:1.6;opacity:.8"/>`;
}
// A vessel: wide segments joined end to end, open ends with a rim, ring or spiral thickening inside.
function vessel(x, y0, y1, w, o = {}) {
  const seg = o.seg ?? w * 2.2, wall = Math.max(3.5, w * 0.1);
  let s = `<rect x="${n1(x - w / 2)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(y1 - y0)}" rx="5" style="fill:${HOL}"/>`;
  if (o.water) s += `<rect x="${n1(x - w / 2 + wall)}" y="${n1(y0)}" width="${n1(w - 2 * wall)}" height="${n1(y1 - y0)}" style="fill:${mx('series-1', 'elev-peak', 40)};opacity:.7"/>`;
  let d = '';
  for (let y = y0 + 6; y < y1 - 4; y += o.spiral ? 9 : 12) d += o.spiral ? `M${n1(x - w / 2 + wall)} ${n1(y)}L${n1(x + w / 2 - wall)} ${n1(y + 6)}` : `M${n1(x - w / 2 + wall)} ${n1(y)}Q${n1(x)} ${n1(y + 3)} ${n1(x + w / 2 - wall)} ${n1(y)}`;
  s += `<path d="${d}" style="fill:none;stroke:${LIG};stroke-width:3.2;stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${LIG_L};stroke-width:1;stroke-linecap:round;transform:translate(-1px,-1px)"/>`;
  s += `<path d="M${n1(x - w / 2 + wall / 2)} ${n1(y0)}V${n1(y1)}M${n1(x + w / 2 - wall / 2)} ${n1(y0)}V${n1(y1)}" style="fill:none;stroke:${LIG};stroke-width:${n1(wall)}"/>`;
  for (let y = y0 + seg; y < y1 - 10; y += seg) s += `<path d="M${n1(x - w / 2)} ${n1(y)}h${n1(w * 0.22)}M${n1(x + w / 2)} ${n1(y)}h${n1(-w * 0.22)}" style="fill:none;stroke:${LIG_D};stroke-width:4;stroke-linecap:round"/><path d="M${n1(x - w / 2 - 2)} ${n1(y - 3)}q3 3 0 6M${n1(x + w / 2 + 2)} ${n1(y - 3)}q-3 3 0 6" style="fill:none;stroke:${LIG_D};stroke-width:2"/>`;
  s += `<path d="M${n1(x - w / 2)} ${n1(y0)}V${n1(y1)}M${n1(x + w / 2)} ${n1(y0)}V${n1(y1)}" style="fill:none;stroke:${LIG_D};stroke-width:1.8"/><path d="M${n1(x - w / 2 + 2)} ${n1(y0 + 2)}V${n1(y1 - 2)}" style="fill:none;stroke:${LIG_L};stroke-width:1.4"/>`;
  return s;
}
// Living box cells: thin walls, grainy cytoplasm, a nucleus each. o.store adds stored grains.
function boxCells(x, y0, y1, w, o = {}) {
  const h = o.h ?? w * 0.9, r = rnd(o.seed ?? 3), col = o.col ?? CYT, colD = o.colD ?? CYT_D;
  let s = '';
  for (let y = y0; y < y1 - 8; y += h) {
    const hh = Math.min(h, y1 - y) - 2;
    s += `<rect x="${n1(x - w / 2)}" y="${n1(y)}" width="${n1(w)}" height="${n1(hh)}" rx="7" style="fill:url(#vt-cyt) ${col};stroke:${colD};stroke-width:2"/>${grainRect(x - w / 2 + 3, y + 3, w - 6, hh - 6, 0.14)}`;
    s += `<rect x="${n1(x - w / 2 + 4)}" y="${n1(y + 4)}" width="${n1(w * 0.4)}" height="3" rx="1.5" style="fill:${W_};opacity:.55"/>`;
    const nx = x + (r() - 0.5) * w * 0.3, ny = y + hh * (0.4 + r() * 0.2);
    s += `<ellipse cx="${n1(nx)}" cy="${n1(ny)}" rx="${n1(w * 0.16)}" ry="${n1(w * 0.13)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 50)};stroke-width:1.2"/><circle cx="${n1(nx - w * 0.04)}" cy="${n1(ny - w * 0.03)}" r="${n1(w * 0.04)}" style="fill:${mx('series-5', INK, 70)}"/>`;
    if (!o.store && hh > 30) s += `<ellipse cx="${n1(x - w * 0.08)}" cy="${n1(y + hh * 0.3)}" rx="${n1(w * 0.26)}" ry="${n1(hh * 0.18)}" style="fill:url(#cw-vac) ${W_};opacity:.7"/>`;
    if (o.store) for (let k = 0; k < 5; k++) { const gx = x + (r() - 0.5) * w * 0.66, gy = y + 8 + r() * (hh - 16), gr = 2.6 + r() * 2.2; s += `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="${n1(gr * 1.25)}" ry="${n1(gr)}" style="fill:${mx('series-2', 'elev-peak', 50)};stroke:${mx('series-2', INK, 50)};stroke-width:1"/><ellipse cx="${n1(gx + gr * 0.2)}" cy="${n1(gy + gr * 0.15)}" rx="${n1(gr * 0.6)}" ry="${n1(gr * 0.45)}" style="fill:none;stroke:${mx('series-2', INK, 66)};stroke-width:.8"/>`; }
  }
  return s;
}
// A sieve tube: cells end to end, a thin layer of cytoplasm lining the walls, strands through the middle, slime
// (P-protein) gathered at each sieve plate, no nucleus. Sieve plates: a band crossed by open pores.
function sieveTube(x, y0, y1, w, seg) {
  let s = '';
  const r = rnd(Math.round(x));
  for (let y = y0, i = 0; y < y1 - 6; y += seg, i++) {
    const h = Math.min(seg, y1 - y);
    s += `<rect x="${n1(x - w / 2)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="3" style="fill:url(#vt-sieve) ${PHL_L};stroke:${PHL_D};stroke-width:2.2"/>`;
    s += `<rect x="${n1(x - w / 2 + 5)}" y="${n1(y + 5)}" width="${n1(w - 10)}" height="${n1(h - 10)}" rx="3" style="fill:${mx(PHL_L, 'elev-peak', 56)};stroke:${PHL};stroke-width:1.2;opacity:.9"/>${grainRect(x - w / 2 + 2, y + 2, w - 4, h - 4, 0.12)}`;
    // wavy strands through the lumen, joining the pores of one plate to the next
    let d = '';
    for (const u of [-0.24, 0, 0.22]) { const xx = x + u * w; d += `M${n1(xx)} ${n1(y + 6)}C${n1(xx + 4)} ${n1(y + h * 0.3)} ${n1(xx - 4)} ${n1(y + h * 0.65)} ${n1(xx + (r() - 0.5) * 3)} ${n1(y + h - 6)}`; }
    s += `<path d="${d}" style="fill:none;stroke:${PHL_D};stroke-width:1.1;opacity:.45"/>`;
    // slime (P-protein) piled against the plate below, grainy
    s += `<path d="M${n1(x - w / 2 + 6)} ${n1(y + h - 4)}Q${n1(x - w * 0.2)} ${n1(y + h - 16)} ${n1(x)} ${n1(y + h - 12)}Q${n1(x + w * 0.24)} ${n1(y + h - 18)} ${n1(x + w / 2 - 6)} ${n1(y + h - 4)}Z" style="fill:${mx(PHL, 'series-5', 76)};opacity:.55"/>`;
    for (let k = 0; k < 6; k++) s += `<circle cx="${n1(x + (r() - 0.5) * w * 0.7)}" cy="${n1(y + h - 6 - r() * 8)}" r="${n1(1 + r() * 1.2)}" style="fill:${PHL_D};opacity:.5"/>`;
    if (i > 0) {
      s += `<rect x="${n1(x - w / 2 + 1)}" y="${n1(y - 3.5)}" width="${n1(w - 2)}" height="7" rx="2" style="fill:${PHL_D}"/>`;
      for (let px = x - w / 2 + 6; px < x + w / 2 - 3; px += 6.5) s += `<ellipse cx="${n1(px)}" cy="${n1(y)}" rx="1.9" ry="3.6" style="fill:${mx(PHL_L, 'elev-peak', 70)}"/>`;
      s += `<path d="M${n1(x - w / 2 + 2)} ${n1(y - 3)}H${n1(x + w / 2 - 2)}" style="fill:none;stroke:${W_};stroke-width:1;opacity:.5"/>`;
    }
  }
  return s;
}
// Companion cells: narrow, dense grainy cytoplasm, a big nucleus, plasmodesmata (fine paired marks) across the
// wall they share with the sieve tube on their left.
function companions(x, y0, y1, w, seg) {
  let s = '';
  for (let y = y0; y < y1 - 6; y += seg) {
    const h = Math.min(seg, y1 - y) - 4;
    s += `<rect x="${n1(x - w / 2)}" y="${n1(y + 2)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(w * 0.3)}" style="fill:url(#vt-comp) ${mx(PHL, 'series-5', 70)};stroke:${PHL_D};stroke-width:1.8"/>${grainRect(x - w / 2 + 2, y + 6, w - 4, h - 8, 0.34)}`;
    s += `<ellipse cx="${n1(x)}" cy="${n1(y + 2 + h * 0.5)}" rx="${n1(w * 0.32)}" ry="${n1(Math.min(15, h * 0.18))}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 50)};stroke-width:1.2"/><circle cx="${n1(x + w * 0.05)}" cy="${n1(y + 2 + h * 0.5)}" r="${n1(w * 0.1)}" style="fill:${mx('series-5', INK, 60)}"/>`;
    for (let k = 1; k < 6; k++) { const yy = y + 2 + h * k / 6; s += `<path d="M${n1(x - w / 2 - 3)} ${n1(yy - 1.6)}h6M${n1(x - w / 2 - 3)} ${n1(yy + 1.6)}h6" style="fill:none;stroke:${PHL_D};stroke-width:1.2"/>`; }
  }
  return s;
}
// A block of columns packed side by side between x0 and x1 (shared walls, no gaps), clipped to a cut block with a
// lighter cut face top and bottom. cols: { id, w, draw(x, y0, y1, w) }. Returns the drawing and each id's centres.
function block(x0, x1, y0, y1, cols, back, id) {
  const tot = cols.reduce((a, c) => a + c.w, 0), k = (x1 - x0) / tot, at = {};
  const d = `M${n1(x0)} ${n1(y0 + 8)}Q${n1(x0 + (x1 - x0) * 0.3)} ${n1(y0 - 4)} ${n1(x0 + (x1 - x0) * 0.6)} ${n1(y0 + 4)}T${n1(x1)} ${n1(y0)}V${n1(y1 - 4)}Q${n1(x0 + (x1 - x0) * 0.7)} ${n1(y1 + 6)} ${n1(x0 + (x1 - x0) * 0.4)} ${n1(y1 - 2)}T${n1(x0)} ${n1(y1)}Z`;
  let s = `<path d="${d}" transform="translate(6 10)" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/><clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><rect x="${n1(x0)}" y="${n1(y0 - 20)}" width="${n1(x1 - x0)}" height="${n1(y1 - y0 + 40)}" style="fill:${back}"/>`;
  let x = x0;
  for (const c of cols) { const w = c.w * k, cx = x + w / 2; (at[c.id] ||= []).push(cx); s += c.g(c.draw(cx, y0 - 30, y1 + 30, w)); x += w; }
  s += `<rect x="${n1(x0)}" y="${n1(y0 - 20)}" width="${n1(x1 - x0)}" height="${n1(y1 - y0 + 40)}" style="fill:url(#vt-vign) transparent"/></g>`;
  s += `<path d="${d}" style="fill:none;stroke:${mx(back, INK, 50)};stroke-width:2.4"/><path d="M${n1(x0 + 4)} ${n1(y0 + 9)}Q${n1(x0 + (x1 - x0) * 0.3)} ${n1(y0 - 2)} ${n1(x0 + (x1 - x0) * 0.6)} ${n1(y0 + 6)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.6"/>`;
  return { s, at };
}

// A carrot: feathery leaves above the ground, an orange root in dark soil.
function carrot(W, H, P) {
  const gy = H * 0.42, cx = W * (P ? 0.5 : 0.36), r = rnd(12), soil = pc('soil');
  let s = `<rect width="${W}" height="${n1(gy)}" style="fill:${mx('sea-shallow', 'elev-peak', 40)}"/><rect y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:${mx(soil, INK, 70)}"/><rect y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:${INK};opacity:.2;filter:url(#pa-grain)"/>`;
  s += `<path d="M0 ${n1(gy)}H${W}" style="fill:none;stroke:${mx(soil, 'elev-peak', 50)};stroke-width:4"/>`;
  for (let i = 0; i < 20; i++) s += `<ellipse cx="${n1(r() * W)}" cy="${n1(gy + 12 + r() * (H - gy - 16))}" rx="${n1(2 + r() * 4)}" ry="${n1(1.5 + r() * 2)}" style="fill:${mx(soil, 'elev-peak', 76)};opacity:.4"/>`;
  // feathery leaves: stalks with pinnate leaflets
  const lf = mx('elev-low', 'chloro', 46), lfD = mx(lf, INK, 56);
  for (let k = -3; k <= 3; k++) {
    const a = k * 0.32 - 1.5708, len = (P ? 110 : 130) * (1 - Math.abs(k) * 0.08), ex = cx + Math.cos(a) * len, ey = gy - 6 + Math.sin(a) * len;
    s += `<path d="M${n1(cx)} ${n1(gy - 4)}Q${n1(cx + Math.cos(a) * len * 0.4)} ${n1(gy - len * 0.5)} ${n1(ex)} ${n1(ey)}" style="fill:none;stroke:${lfD};stroke-width:3;stroke-linecap:round"/>`;
    for (let j = 2; j < 9; j++) {
      const u = j / 9, px = cx + (ex - cx) * u + Math.cos(a) * len * 0.05 * (1 - u), py = gy - 4 + (ey - gy + 4) * u - Math.sin(u * 3) * 6;
      for (const sg of [-1, 1]) { const qa = a + sg * 0.9, l = 16 * (1 - u * 0.5); s += `<path d="M${n1(px)} ${n1(py)}q${n1(Math.cos(qa) * l * 0.6)} ${n1(Math.sin(qa) * l * 0.6 - 4)} ${n1(Math.cos(qa) * l)} ${n1(Math.sin(qa) * l)}q${n1(-Math.cos(qa) * l * 0.2)} 5 ${n1(-Math.cos(qa) * l)} ${n1(-Math.sin(qa) * l)}Z" style="fill:${lf};stroke:${lfD};stroke-width:1"/>`; }
    }
  }
  // the root: orange, tapering, with rings and fine side roots
  const rl = H - gy - 18, rw = P ? 34 : 40, or = mx('series-2', 'flame', 55), orD = mx(or, INK, 56), orL = mx(or, W_, 50);
  const rd = `M${n1(cx - rw)} ${n1(gy - 2)}C${n1(cx - rw)} ${n1(gy + rl * 0.4)} ${n1(cx - 6)} ${n1(gy + rl * 0.9)} ${n1(cx)} ${n1(gy + rl)}C${n1(cx + 6)} ${n1(gy + rl * 0.9)} ${n1(cx + rw)} ${n1(gy + rl * 0.4)} ${n1(cx + rw)} ${n1(gy - 2)}Z`;
  s += `<defs><linearGradient id="vt-car" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${orL}"/><stop offset=".45" style="stop-color:${or}"/><stop offset="1" style="stop-color:${orD}"/></linearGradient></defs>`;
  s += `<path d="${rd}" style="fill:url(#vt-car) ${or};stroke:${orD};stroke-width:2.4"/>`;
  for (let i = 1; i < 9; i++) { const y = gy + rl * i / 10, hw = rw * (1 - Math.pow(i / 10, 1.6)) * 0.9; s += `<path d="M${n1(cx - hw)} ${n1(y)}q${n1(hw * 0.4)} 3 ${n1(hw * 0.8)} 1" style="fill:none;stroke:${orD};stroke-width:1.6;opacity:.6"/>`; if (i % 2) s += `<path d="M${n1(cx + (i % 4 === 1 ? hw : -hw))} ${n1(y)}l${n1(i % 4 === 1 ? 16 : -16)} 6" style="fill:none;stroke:${mx(or, 'elev-peak', 40)};stroke-width:1.4"/>`; }
  s += `<path d="M${n1(cx - rw + 8)} ${n1(gy + 10)}C${n1(cx - rw + 8)} ${n1(gy + rl * 0.4)} ${n1(cx - 10)} ${n1(gy + rl * 0.7)} ${n1(cx - 5)} ${n1(gy + rl * 0.8)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.4"/>`;
  return { s, gy, cx, rl };
}

export class VascularTubes extends SvgScene {
  static BEAT_MAPS = { 3: [one(0), one(1), one(2)], 5: [one(3), one(4), one(5), one(6), one(7)] };
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 560;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Xylem and phloem drawn as long cells side by side. Xylem: narrow pointed fibres, long narrow tapering tracheids, wide vessels joined end to end with rings and spirals of thickening, and living xylem parenchyma cells with nuclei. Water rises in xylem. Phloem: sieve tube cells end to end with sieve plates full of pores and no nucleus, a companion cell with a nucleus beside each one, phloem parenchyma cells that store food, and phloem fibres. Sugar moves from the leaf to the root. A carrot shows the root that needs food. Name chips light each kind of cell.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Kinds of cell', chips: [], onChange: () => this.repaint() });

  async setup() {
    await super.setup();
    this.tl.mount(this.root, this);
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }' + BODY_CSS; }
  stageHeight(st) { return st.portrait ? 360 : 350; }
  enter(step) { this.tl.set({ chips: step === 0 || step === 3 ? [] : step < 3 ? XCHIPS : PCHIPS, lit: null }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 15 : 16;
    let s = `<defs><radialGradient id="vt-cyt" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:${W_}"/><stop offset=".6" style="stop-color:${CYT}"/><stop offset="1" style="stop-color:${mx(CYT, INK, 84)}"/></radialGradient>`
      + `<linearGradient id="vt-side" x1="0" x2="1"><stop offset="0" style="stop-color:${W_};stop-opacity:.5"/><stop offset=".45" style="stop-color:${W_};stop-opacity:0"/><stop offset="1" style="stop-color:${INK};stop-opacity:.35"/></linearGradient>`
      + `<linearGradient id="vt-sieve" x1="0" x2="1"><stop offset="0" style="stop-color:${mx(PHL_L, W_, 60)}"/><stop offset=".5" style="stop-color:${PHL_L}"/><stop offset="1" style="stop-color:${mx(PHL_L, INK, 84)}"/></linearGradient>`
      + `<linearGradient id="vt-comp" x1="0" x2="1"><stop offset="0" style="stop-color:${mx(PHL, 'series-5', 80)}"/><stop offset="1" style="stop-color:${mx(mx(PHL, 'series-5', 60), INK, 76)}"/></linearGradient>`
      + `<radialGradient id="vt-vign" cx=".5" cy=".5" r=".7"><stop offset=".6" style="stop-color:${INK};stop-opacity:0"/><stop offset="1" style="stop-color:${INK};stop-opacity:.22"/></radialGradient></defs>`;
    if (step === 3) {
      const c = carrot(W, H, P);
      s += c.s;
      const ax = c.cx + (P ? 70 : 110);
      s += `<path d="M${n1(ax)} ${n1(c.gy - 120)}V${n1(c.gy + c.rl * 0.6)}" style="fill:none;stroke:${SUG_D};stroke-width:12;stroke-linecap:round"/><path d="M${n1(ax)} ${n1(c.gy - 120)}V${n1(c.gy + c.rl * 0.6)}" style="fill:none;stroke:${SUG};stroke-width:7;stroke-linecap:round"/><path d="M${n1(ax - 16)} ${n1(c.gy + c.rl * 0.6 - 14)}l16 18l16 -18" style="fill:none;stroke:${SUG_D};stroke-width:6;stroke-linecap:round;stroke-linejoin:round"/>`;
      s += label(ax + 14, c.gy - 100, 'food made', { size: fs + 1, anchor: 'start', display: true }) + label(ax + 14, c.gy - 80, 'in the leaves', { size: fs, anchor: 'start' });
      s += label(ax + 14, c.gy + c.rl * 0.4, 'to the root', { size: fs + 1, anchor: 'start', display: true, ink: W_, halo: INK });
      s += label(P ? 64 : 70, c.gy + 30, 'dark soil', { size: fs, ink: W_, halo: INK });
      return { svg: cwFrame(st, 'vt', s) };
    }
    s += `<rect width="${W}" height="${H}" style="fill:${mx('sea-shallow', W_, 16)}"/>` + depthField(W, H, { tone: 'green', seed: step < 3 ? 14 : 15 });
    const held = this.tl.any(), on = held ? this.tl.lit() : LIT[step] ?? [];
    const g = (id) => (body) => `<g style="opacity:${on.includes(id) ? 1 : 0.32}">${body}</g>`;
    const C = (id, w, draw) => ({ id, w, draw, g: g(id) });
    const y0 = P ? 34 : 36, y1 = H - (P ? 40 : 46), mid = (a, b) => (a + b) / 2;
    const tag = (x, t, y = y1 + (P ? 22 : 26), o = {}) => label(x, y, t, { size: fs - 1, ...o });
    if (step < 3) {
      // xylem block; on step 0 a stem beside it shows where it comes from
      const sx0 = step === 0 ? (P ? 70 : 150) : (P ? 12 : 30), x1 = W - (P ? 12 : 30);
      if (step === 0) {
        const cx = P ? 34 : 70, sw = P ? 40 : 70, st0 = pc('stem');
        s += `<rect x="${n1(cx - sw / 2)}" y="${y0 - 10}" width="${sw}" height="${n1(y1 - y0 + 20)}" rx="10" style="fill:url(#pa-stem) ${st0};stroke:${mx(st0, INK, 56)};stroke-width:2.4"/><rect x="${n1(cx - sw * 0.14)}" y="${y0}" width="${n1(sw * 0.28)}" height="${n1(y1 - y0)}" style="fill:${LIG_L};stroke:${LIG_D};stroke-width:1.6"/>`;
        s += `<path d="M${n1(cx + sw * 0.14)} ${y0}L${n1(sx0 - 4)} ${y0}M${n1(cx + sw * 0.14)} ${n1(y1)}L${n1(sx0 - 4)} ${n1(y1)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:5 5;opacity:.6"/>`;
        s += label(cx, y1 + (P ? 22 : 26), 'stem', { size: fs });
      }
      const water = step === 0 ? 1 : 0;
      const fib = (sd) => (x, a, b, w) => fibreCol(x, a, b, w, LIG, LIG_D, sd);
      const tr = (u) => (x, a, b, w) => tracheid(x, a, a + (b - a) * u, w * 0.92) + tracheid(x + w * 0.04, a + (b - a) * (u - 0.1), b, w * 0.92);
      const ves = (o) => (x, a, b, w) => vessel(x, a, b, w * 0.96, { water, ...o });
      const par = (sd, off) => (x, a, b, w) => boxCells(x, a + off, b, w * 0.97, { seed: sd });
      const B = block(sx0, x1, y0, y1, [C('xfib', 16, fib(2)), C('xfib', 14, fib(5)), C('trach', 22, tr(0.6)), C('trach', 20, tr(0.42)), C('xpar', 30, par(3, 10)), C('vessel', 56, ves({})),
        C('xpar', 36, par(4, 30)), C('xfib', 14, fib(7)), C('trach', 20, tr(0.7)), C('vessel', 46, ves({ spiral: true })), C('xpar', 32, par(6, 0)), C('xfib', 14, fib(9))], mx(LIG, 'elev-peak', 56), 'vt-bx');
      s += B.s;
      const A = (id, i = 0) => B.at[id][i], M = mid(sx0, x1);
      if (step === 0) {
        for (const vx of [A('vessel'), A('vessel', 1)]) for (let i = 0; i < 3; i++) s += travel(`<path d="M-9 6L0 -6L9 6" style="fill:none;stroke:${WAT_D};stroke-width:5;stroke-linecap:round;stroke-linejoin:round"/>`, `M${n1(vx)} ${n1(y1 - 30 - i * 90)}V${n1(y1 - 110 - i * 90)}`, { t: 1.6, d: i * 0.25 });
        s += label(M, y0 - 12 + (P ? 10 : 0), 'water and minerals up', { size: fs + 1, display: true, ink: mx(WAT_D, INK, 60) });
        s += tag(M, 'xylem: many kinds of cell together', undefined, { display: true, size: fs });
      } else {
        if (step === 1 && !held) { s += tag(mid(A('trach'), A('trach', 1)), 'tracheids') + tag(A('vessel'), 'vessel'); s += label(mid(A('trach'), A('trach', 1)), y0 - 10 + (P ? 10 : 0), 'long, narrow', { size: fs - 1 }) + label(A('vessel') + (P ? 16 : 10), y0 - 10 + (P ? 10 : 0), 'wide, end to end', { size: fs - 1 }); }
        else if (step === 2 && !held) {
          s += tag(A('xpar', 1), 'living', undefined, { display: true, size: fs + 1, ink: mx('elev-low', INK, 40) });
          // one 'dead' over the left group (fibres + tracheids), one over each vessel: never side by side
          for (const x of [mid(A('xfib'), A('trach', 1)), A('vessel'), A('vessel', 1)]) s += label(x, y0 - 10 + (P ? 10 : 0), 'dead', { size: fs - 1, ink: mx(INK, LIG, 80) });
        } else if (held) {
          const c = XCHIPS.find((q) => on.includes(q.targets[0]));
          const x = c && { trach: A('trach'), vessel: A('vessel'), xfib: Math.max(P ? 50 : 60, A('xfib')), xpar: A('xpar', 1) }[c.id];
          if (c) s += tag(x, c.label.toLowerCase(), undefined, { display: true, size: fs });
        }
      }
      return { svg: cwFrame(st, 'vt', s) };
    }
    // phloem block; on the last step a xylem vessel beside it for comparison
    const last = step === 7, sx0 = P ? 12 : 30, x1 = W - (P ? 12 : 30) - (last ? (P ? 50 : 80) : 0), seg = P ? 92 : 100;
    const PF = mx(LIG, PHL, 60), PFD = mx(LIG_D, PHL_D, 60);
    const pfib = (sd) => (x, a, b, w) => fibreCol(x, a, b, w, PF, PFD, sd);
    const sv = (off) => (x, a, b, w) => sieveTube(x, y0 + off, b, w * 0.98, seg) + sieveTube(x, y0 + off - seg, y0 + off, w * 0.98, seg);
    const cp = (off) => (x, a, b, w) => companions(x, y0 + off, b, w * 0.94, seg) + companions(x, y0 + off - seg, y0 + off, w * 0.94, seg);
    const pp = (sd, off) => (x, a, b, w) => boxCells(x, a + off, b, w * 0.97, { seed: sd, store: true, col: mx(CYT, 'series-2', 86), colD: CYT_D });
    const B = block(sx0, x1, y0, y1, [C('pfib', 14, pfib(3)), C('ppar', 32, pp(8, 12)), C('sieve', 50, sv(-40)), C('comp', 17, cp(-40)), C('ppar', 38, pp(9, 34)), C('pfib', 14, pfib(6)),
      C('sieve', 46, sv(0)), C('comp', 17, cp(0)), C('ppar', 30, pp(10, 0)), C('pfib', 14, pfib(8))], mx(PHL, 'elev-peak', 60), 'vt-bp');
    s += B.s;
    const A = (id, i = 0) => B.at[id][i], M = mid(sx0, x1);
    if (step === 5 || step === 6 || step === 7) {
      for (const sx of [A('sieve'), A('sieve', 1)]) for (let i = 0; i < 4; i++) s += travel(`<circle r="5.5" style="fill:url(#cw-sug) ${SUG};stroke:${SUG_D};stroke-width:1.4"/>`, `M${n1(sx + (i % 2 ? 6 : -6))} ${n1(y0 - 6 + i * 26)}V${n1(y0 + 120 + i * 50)}`, { t: 2.4, d: i * 0.3 });
    }
    if (last) {
      const vx = W - (P ? 34 : 56);
      s += vessel(vx, y0 - 10, y1 + 10, P ? 30 : 40, { water: 1 });
      s += `<path d="M${n1(vx)} ${n1(y1 - 30)}V${n1(y0 + 40)}" style="fill:none;stroke:${WAT_D};stroke-width:5;stroke-linecap:round"/><path d="M${n1(vx - 11)} ${n1(y0 + 52)}L${n1(vx)} ${n1(y0 + 38)}L${n1(vx + 11)} ${n1(y0 + 52)}" style="fill:none;stroke:${WAT_D};stroke-width:5;stroke-linecap:round;stroke-linejoin:round"/>`;
      { const fx = A('sieve') - (P ? 10 : 12); s += `<path d="M${n1(fx)} ${n1(y0 + 40)}V${n1(y1 - 30)}" style="fill:none;stroke:${SUG_D};stroke-width:5;stroke-linecap:round"/><path d="M${n1(fx - 11)} ${n1(y1 - 42)}L${n1(fx)} ${n1(y1 - 28)}L${n1(fx + 11)} ${n1(y1 - 42)}" style="fill:none;stroke:${SUG_D};stroke-width:5;stroke-linecap:round;stroke-linejoin:round"/>`; }
      s += label(P ? vx - 18 : vx, y1 + (P ? 22 : 26), 'xylem', { size: fs, display: true, ...(P ? { anchor: 'start' } : {}) }) + label(vx, y0 - 14 + (P ? 10 : 0), 'water up', { size: fs - 1, ink: mx(WAT_D, INK, 60) });
      s += label(M, y0 - 14 + (P ? 10 : 0), 'phloem: food from the leaves', { size: fs - 1, ink: mx(SUG_D, INK, 50) });
    }
    if (!held) {
      if (step === 4) s += tag(M, 'phloem: mostly living cells', undefined, { display: true, size: fs });
      if (step === 5) { const py = y0 - 40 + seg, lx = A('comp') + (P ? 14 : 22); s += tag(A('sieve'), 'sieve tube') + `<path d="M${n1(lx - 4)} ${n1(py + 2)}L${n1(A('sieve') + 10)} ${n1(py)}" style="fill:none;stroke:${INK};stroke-width:2"/><circle cx="${n1(A('sieve') + 10)}" cy="${n1(py)}" r="3.5" style="fill:${INK}"/>` + label(lx, py + 6, 'sieve plate', { size: fs - 1, anchor: 'start' }); }
      if (step === 6) {
        s += tag(A('sieve'), 'companion cell') + label(A('sieve'), y0 + seg * 1.1, 'no nucleus', { size: fs - 1 });
        // sugar loaded into the top cell from its companion cell, unloaded from the bottom cell
        const cx2 = A('comp', 1), sx2 = A('sieve', 1), ar = (x0, y, xx) => `<path d="M${n1(x0)} ${n1(y)}H${n1(xx)}" style="fill:none;stroke:${SUG_D};stroke-width:4;stroke-linecap:round"/><path d="M${n1(xx + (xx > x0 ? -8 : 8))} ${n1(y - 7)}L${n1(xx)} ${n1(y)}L${n1(xx + (xx > x0 ? -8 : 8))} ${n1(y + 7)}" style="fill:none;stroke:${SUG_D};stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`;
        s += ar(cx2 - 2, y0 + 10, sx2 + 4) + `<circle cx="${n1(cx2 + 2)}" cy="${n1(y0 + 10)}" r="6" style="fill:url(#cw-sug) ${SUG};stroke:${SUG_D};stroke-width:1.4"/>`;
        s += ar(sx2 + 4, y1 - 20, cx2 + 14) + `<circle cx="${n1(cx2 + 22)}" cy="${n1(y1 - 20)}" r="6" style="fill:url(#cw-sug) ${SUG};stroke:${SUG_D};stroke-width:1.4"/>`;
        s += label(sx2, y0 - 14 + (P ? 10 : 0), 'loaded at the leaf', { size: fs - 1, ink: mx(SUG_D, INK, 50) }) + label(sx2, y1 + (P ? 22 : 26), 'unloaded at the root', { size: fs - 1, ink: mx(SUG_D, INK, 50) });
      }
      if (step === 7) s += tag(A('ppar', 1), 'stores food') + tag(Math.max(P ? 30 : 40, A('pfib')), 'fibre') + tag(P ? x1 - 2 : A('pfib', 2), 'fibre', undefined, P ? { anchor: 'end' } : {});
    } else {
      const c = PCHIPS.find((q) => on.includes(q.targets[0]));
      const x = c && { sieve: A('sieve'), comp: A('comp'), ppar: A('ppar', 1), pfib: A('pfib') }[c.id];
      if (c) s += tag(Math.max(60, x), c.label.toLowerCase(), undefined, { display: true, size: fs });
    }
    return { svg: cwFrame(st, 'vt', s) };
  }
}
