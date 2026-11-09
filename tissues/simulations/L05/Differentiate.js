// Differentiate - blk-l05-s9. A root tip cut lengthwise: small dense dividing cells just behind the cap; the cells left
// behind grow longer and change. Beats: some-stay (the dividing zone stays meristematic, the cells left behind stop
// dividing and change), jobs (cells left behind become epidermis, parenchyma, xylem, phloem, sclerenchyma: one arrow to
// each), keys (a blank key becomes a cut key, as a blank cell becomes a specialised cell), definition (a meristem cell at
// the centre, arrows to the specialised cells).
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, depthField, blobPath, nucleus, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { stDefs, STAIN } from '../shared/StemArt.js';
import { taDefs, xylemTube } from '../shared/TissueArt.js';
import { meriCell, sclCell } from '../shared/CellTypes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const TYPES = [
  { id: 'epi', name: 'epidermis' },
  { id: 'par', name: 'parenchyma' },
  { id: 'xyl', name: 'xylem' },
  { id: 'phl', name: 'phloem' },
  { id: 'scl', name: 'sclerenchyma' },
];
// The mature cells, each drawn as itself, about s px tall, centred on (x, y).
function epiArt(x, y, s) {
  // epidermis: a flat brick of a cell, waxy cuticle over its outer wall, big vacuole, nucleus to one side
  const w = s * 1.1, h = s * 0.46, x0 = x - w / 2, y0 = y - h / 2;
  let o = `<rect x="${n1(x0 + 4)}" y="${n1(y0 + 7)}" width="${n1(w)}" height="${n1(h)}" rx="6" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/>`;
  o += `<rect x="${n1(x0 - w * 0.1)}" y="${n1(y0)}" width="${n1(w * 0.1)}" height="${n1(h)}" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:2;opacity:.45"/><rect x="${n1(x0 + w)}" y="${n1(y0)}" width="${n1(w * 0.1)}" height="${n1(h)}" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:2;opacity:.45"/>`;
  o += `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" rx="4" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:2.4"/>`;
  o += `<rect x="${n1(x0 + 6)}" y="${n1(y0 + h * 0.2)}" width="${n1(w * 0.64)}" height="${n1(h * 0.6)}" rx="${n1(h * 0.26)}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 30)};stroke:${mx('sea-shallow', INK, 74)};stroke-width:1"/>`;
  o += nucleus(x0 + w * 0.82, y + 2, h * 0.17, { nucleolus: false, pores: false });
  // the outer wall, thicker, and the cuticle on it
  o += `<path d="M${n1(x0 - w * 0.1)} ${n1(y0 - 1)}H${n1(x0 + w * 1.1)}" style="stroke:${STAIN.cellD};stroke-width:4"/><path d="M${n1(x0 - w * 0.1)} ${n1(y0 - 5)}H${n1(x0 + w * 1.1)}" style="stroke:${STAIN.cut};stroke-width:6;stroke-linecap:round"/><path d="M${n1(x0 - w * 0.06)} ${n1(y0 - 7)}H${n1(x0 + w * 0.7)}" style="stroke:${W_};stroke-width:1.4;opacity:.7"/>`;
  return o;
}
function parArt(x, y, s) {
  // parenchyma: a rounded cell with a thin wall, one big vacuole, thin cytoplasm, air spaces at the corners
  const r = s * 0.42, d = blobPath(x, y, r, r * 0.94, 4, 0.06, 9);
  let o = `<path d="${d}" transform="translate(4 7)" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/>`;
  // air spaces where this cell and its neighbours meet: a small three-cornered gap at each corner, the neighbours'
  // walls running off from it
  for (const a of [-2.36, -0.78, 0.78, 2.36]) {
    const px = x + Math.cos(a) * r * 1.04, py = y + Math.sin(a) * r * 0.98, t = r * 0.13, ca = Math.cos(a), sa = Math.sin(a);
    o += `<path d="M${n1(px - ca * t)} ${n1(py - sa * t)}L${n1(px + ca * t * 0.6 - sa * t * 1.2)} ${n1(py + sa * t * 0.6 + ca * t * 1.2)}L${n1(px + ca * t * 0.6 + sa * t * 1.2)} ${n1(py + sa * t * 0.6 - ca * t * 1.2)}Z" style="fill:${STAIN.air};stroke:${STAIN.gap};stroke-width:1.2;stroke-linejoin:round"/>`
      + `<path d="M${n1(px + ca * t * 0.6 - sa * t * 1.2)} ${n1(py + sa * t * 0.6 + ca * t * 1.2)}l${n1(ca * r * 0.16 - sa * r * 0.2)} ${n1(sa * r * 0.16 + ca * r * 0.2)}M${n1(px + ca * t * 0.6 + sa * t * 1.2)} ${n1(py + sa * t * 0.6 - ca * t * 1.2)}l${n1(ca * r * 0.16 + sa * r * 0.2)} ${n1(sa * r * 0.16 - ca * r * 0.2)}" style="stroke:${STAIN.cellD};stroke-width:1.6;opacity:.55"/>`;
  }
  o += `<path d="${d}" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:2"/>`;
  o += `<path d="${blobPath(x - r * 0.06, y, r * 0.72, r * 0.64, 6, 0.05, 10)}" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 30)};stroke:${mx('sea-shallow', INK, 74)};stroke-width:1.1"/>`;
  o += nucleus(x + r * 0.72, y + r * 0.2, r * 0.17, { nucleolus: false, pores: false });
  o += `<path d="${blobPath(x - r * 0.06, y - r * 0.06, r * 0.84, r * 0.78, 4, 0.06, 9)}" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.5"/>`;
  return o;
}
function xylArt(x, y, s) {
  // a xylem vessel: a hollow tube, no contents, its wall thickened in a spiral; open ends join the next vessel
  const w = s * 0.36, h = s * 1.0, x0 = x - w / 2, y0 = y - h / 2;
  let o = `<rect x="${n1(x0 + 4)}" y="${n1(y0 + 7)}" width="${n1(w)}" height="${n1(h)}" rx="6" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/>`;
  o += `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" rx="5" style="fill:url(#st-hollow) ${W_};stroke:${STAIN.lig};stroke-width:2"/>`;
  let back = '', front = '';
  for (let i = 0; i < 11; i++) { const yy = y0 + 4 + i * (h - 8) / 10.4; back += `M${n1(x0 + 2)} ${n1(yy)}L${n1(x0 + w - 2)} ${n1(yy - 6)}`; front += `M${n1(x0 + 2)} ${n1(yy)}L${n1(x0 + w - 2)} ${n1(yy + 7)}`; }
  o += `<path d="${back}" style="stroke:${STAIN.lig};stroke-width:2;opacity:.35"/><path d="${front}" style="stroke:${STAIN.lig};stroke-width:3.2;stroke-linecap:round"/><path d="${front}" transform="translate(-.8 -1)" style="stroke:${STAIN.ligL};stroke-width:1;opacity:.8"/>`;
  o += `<ellipse cx="${n1(x)}" cy="${n1(y0)}" rx="${n1(w / 2)}" ry="${n1(w * 0.16)}" style="fill:${W_};stroke:${STAIN.lig};stroke-width:2"/><ellipse cx="${n1(x)}" cy="${n1(y0 + h)}" rx="${n1(w / 2)}" ry="${n1(w * 0.16)}" style="fill:none;stroke:${STAIN.lig};stroke-width:2"/>`;
  return o;
}
function phlArt(x, y, s) {
  // a sieve tube: a long living cell with a sieve plate (a cross wall full of pores) at each end, no nucleus;
  // a slim companion cell beside it with dense cytoplasm and a nucleus
  const w = s * 0.32, h = s * 1.0, x0 = x - w * 0.7, y0 = y - h / 2, cw = w * 0.42, cx0 = x0 + w + 2;
  let o = `<rect x="${n1(x0 + 4)}" y="${n1(y0 + 7)}" width="${n1(w + cw + 2)}" height="${n1(h)}" rx="6" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/>`;
  o += `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" rx="4" style="fill:${mx(STAIN.lumenG, 'sea-shallow', 86)};stroke:${STAIN.cellD};stroke-width:2"/>`;
  o += `<path d="M${n1(x0 + 3)} ${n1(y0 + 6)}V${n1(y0 + h - 6)}M${n1(x0 + w - 3)} ${n1(y0 + 6)}V${n1(y0 + h - 6)}" style="stroke:${mx(STAIN.cell, W_, 30)};stroke-width:2;opacity:.8"/>`;
  for (const py of [y0 + 3, y0 + h - 3, y]) {
    o += `<rect x="${n1(x0 + 1)}" y="${n1(py - 2.6)}" width="${n1(w - 2)}" height="5.2" style="fill:${STAIN.cellD}"/>`;
    for (let i = 0; i < 4; i++) o += `<circle cx="${n1(x0 + w * (0.17 + i * 0.22))}" cy="${n1(py)}" r="1.5" style="fill:${W_}"/>`;
  }
  o += `<rect x="${n1(cx0)}" y="${n1(y0 + 8)}" width="${n1(cw)}" height="${n1(h - 16)}" rx="${n1(cw * 0.4)}" style="fill:url(#st-camb) ${STAIN.camb};stroke:${STAIN.cellD};stroke-width:1.4"/>`;
  o += `<ellipse cx="${n1(cx0 + cw / 2)}" cy="${n1(y - h * 0.14)}" rx="${n1(cw * 0.3)}" ry="${n1(cw * 0.5)}" style="fill:url(#st-nuc) ${STAIN.nuc}"/>`;
  return o;
}
function sclArt(x, y, s) {
  // a sclerenchyma fibre: long and pointed, its wall so thick with lignin that only a thin lumen is left; beside it the
  // same fibre cut across
  const h = s * 1.0, w = s * 0.2, x1 = x - s * 0.14;
  const d = `M${n1(x1)} ${n1(y - h / 2)}C${n1(x1 + w * 0.7)} ${n1(y - h * 0.3)} ${n1(x1 + w * 0.56)} ${n1(y + h * 0.3)} ${n1(x1)} ${n1(y + h / 2)}C${n1(x1 - w * 0.56)} ${n1(y + h * 0.3)} ${n1(x1 - w * 0.7)} ${n1(y - h * 0.3)} ${n1(x1)} ${n1(y - h / 2)}Z`;
  let o = `<path d="${d}" transform="translate(4 7)" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><path d="${d}" style="fill:url(#st-lig) ${STAIN.lig};stroke:${STAIN.ligD};stroke-width:2"/>`;
  o += `<path d="M${n1(x1)} ${n1(y - h * 0.36)}V${n1(y + h * 0.36)}" style="stroke:${mx('strata-1', W_, 40)};stroke-width:2;stroke-linecap:round"/>`;
  for (let i = 0; i < 6; i++) { const yy = y - h * 0.3 + i * h * 0.12; o += `<path d="M${n1(x1 - w * 0.3)} ${n1(yy)}L${n1(x1)} ${n1(yy + 3)}L${n1(x1 + w * 0.3)} ${n1(yy)}" style="fill:none;stroke:${STAIN.ligD};stroke-width:1;opacity:.7"/>`; }
  o += `<path d="M${n1(x1 - w * 0.2)} ${n1(y - h * 0.3)}C${n1(x1 - w * 0.34)} ${n1(y - h * 0.1)} ${n1(x1 - w * 0.34)} ${n1(y + h * 0.1)} ${n1(x1 - w * 0.2)} ${n1(y + h * 0.3)}" style="fill:none;stroke:${STAIN.ligL};stroke-width:1.4;opacity:.8"/>`;
  const cx = x + s * 0.2, cr = s * 0.16;
  o += sclCell(cx, y + s * 0.18, cr * 2) + `<path d="M${n1(x1 + w * 0.5)} ${n1(y + s * 0.06)}L${n1(cx - cr)} ${n1(y + s * 0.14)}" style="stroke:${INK};stroke-width:1.2;stroke-dasharray:3 3;opacity:.6"/>`;
  return o;
}
function typeArt(id, x, y, s) { return ({ epi: epiArt, par: parArt, xyl: xylArt, phl: phlArt, scl: sclArt })[id](x, y, s); }
// A root tip cut lengthwise, tip down, tapering to the tip. Cells sit in files. Behind a cap of loose cells, small dense
// cells with big nuclei divide; rows above grow longer and take vacuoles; farther back each file has become its own
// kind: epidermis outside (root hairs grow out of single epidermal cells), parenchyma, phloem, a xylem file in the
// middle, a sclerenchyma file. FILES says which file is which; fileX(j) is the file's centre (local x).
const FILES = ['epi', 'par', 'phl', 'xyl', 'phl', 'scl', 'epi'];
function rootTip(cx, top, bot, w, o = {}) {
  const files = FILES.length, cap = w * 0.42, base = bot - cap, L = bot - top, q = rnd(5);
  const hw = (yy) => (w / 2) * (0.62 + 0.38 * Math.min(1, (base - yy) / (L * 0.35)));
  const rows = []; let y = base;
  for (let i = 0; y > top; i++) { const h = i < 7 ? 10 : Math.min(30, 10 + (i - 6) * 3.4); rows.push([y - h, h, i]); y -= h; }
  const sideL = [], sideR = [];
  for (let yy = top; yy <= base; yy += 8) { sideL.push(`${n1(cx - hw(yy))} ${n1(yy)}`); sideR.unshift(`${n1(cx + hw(yy))} ${n1(yy)}`); }
  const hb = hw(base), out = `M${sideL.join('L')}Q${n1(cx - hb)} ${n1(bot)} ${n1(cx)} ${n1(bot)}Q${n1(cx + hb)} ${n1(bot)} ${sideR.join('L')}`;
  let s = `<path d="${out}Z" transform="translate(5 8)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  // root hairs: each is the outer wall of ONE epidermal cell grown out into a long thin tube, its nucleus near the base
  const MAT = 11;
  let hairs = '';
  rows.forEach(([ry, h, i]) => {
    if (i < MAT + 1 || i % 2) return;
    for (const sd of [-1, 1]) {
      if ((i + (sd > 0 ? 1 : 0)) % 4 === 0) continue;
      const yy = ry + h * 0.5, x0 = cx + sd * (hw(yy) - 2), l = 26 + q() * 18, hp = `M${n1(x0)} ${n1(yy - 4)}C${n1(x0 + sd * l * 0.5)} ${n1(yy - 6)} ${n1(x0 + sd * l * 0.8)} ${n1(yy - l * 0.3)} ${n1(x0 + sd * l)} ${n1(yy - l * 0.5)}`;
      hairs += `<path d="${hp}" style="fill:none;stroke:${STAIN.cellD};stroke-width:6.4;stroke-linecap:round"/><path d="${hp}" style="fill:none;stroke:${STAIN.lumen};stroke-width:3.6;stroke-linecap:round"/><circle cx="${n1(x0 + sd * 7)}" cy="${n1(yy - 4.4)}" r="2" style="fill:${STAIN.nuc}"/>`;
    }
  });
  s += hairs + `<path d="${out}Z" style="fill:${mx('strata-1', W_, 40)}"/><clipPath id="df-root${o.id ?? ''}"><path d="${out}Z"/></clipPath><g clip-path="url(#df-root${o.id ?? ''})">`;
  for (const [ry, h, i] of rows) {
    const hwr = hw(ry + h / 2), fw = (2 * hwr) / files, meri = i < 7, older = i >= MAT, grow = !meri && !older;
    for (let j = 0; j < files; j++) {
      const x0 = cx - hwr + j * fw, kind = FILES[j], xc = x0 + fw / 2, yc = ry + h / 2;
      let fill = 'url(#st-lum)', st = STAIN.cellD, sw = 1.6, extra = '';
      if (meri) { fill = mx('series-5', W_, 52); st = mx('series-5', INK, 50); extra = `<circle cx="${n1(xc)}" cy="${n1(yc)}" r="${n1(Math.min(fw, h) * 0.34)}" style="fill:url(#st-nuc) ${STAIN.nuc}"/>`; }
      else if (grow) extra = `<rect x="${n1(x0 + fw * 0.24)}" y="${n1(ry + 3)}" width="${n1(fw * 0.52)}" height="${n1(Math.max(2, h - 6) * (0.4 + (i - 7) * 0.12))}" rx="3" style="fill:${mx('sea-shallow', W_, 30)};opacity:.8"/><circle cx="${n1(xc)}" cy="${n1(ry + h - 4.5)}" r="${n1(Math.min(fw, h) * 0.22)}" style="fill:url(#st-nuc) ${STAIN.nuc}"/>`;
      else if (kind === 'xyl') { fill = 'url(#st-hollow)'; st = STAIN.lig; sw = 2.6; extra = `<path d="M${n1(x0 + 2)} ${n1(ry + h * 0.3)}L${n1(x0 + fw - 2)} ${n1(ry + h * 0.42)}M${n1(x0 + 2)} ${n1(ry + h * 0.66)}L${n1(x0 + fw - 2)} ${n1(ry + h * 0.78)}" style="stroke:${STAIN.lig};stroke-width:1.8"/>`; }
      else if (kind === 'phl') { fill = mx(STAIN.lumenG, 'sea-shallow', 84); extra = `<path d="M${n1(x0 + 2)} ${n1(ry + 1.5)}H${n1(x0 + fw - 2)}" style="stroke:${STAIN.cellD};stroke-width:2.6;stroke-dasharray:2 1.6"/>`; }
      else if (kind === 'scl') { fill = 'url(#st-lig)'; st = STAIN.ligD; sw = 1.6; extra = `<path d="M${n1(xc)} ${n1(ry + 4)}V${n1(ry + h - 4)}" style="stroke:${mx('strata-1', W_, 40)};stroke-width:1.6"/>`; }
      else if (kind === 'epi') { extra = `<rect x="${n1(x0 + fw * 0.2)}" y="${n1(ry + 3)}" width="${n1(fw * 0.5)}" height="${n1(h - 6)}" rx="3" style="fill:${mx('sea-shallow', W_, 30)};opacity:.8"/>`; }
      else extra = `<rect x="${n1(x0 + fw * 0.18)}" y="${n1(ry + 3)}" width="${n1(fw * 0.64)}" height="${n1(h - 6)}" rx="4" style="fill:url(#cw-vac) ${mx('sea-shallow', W_, 30)};opacity:.85"/><circle cx="${n1(x0 + fw * 0.76)}" cy="${n1(ry + h * 0.3)}" r="${n1(fw * 0.12)}" style="fill:${STAIN.nuc}"/>`;
      s += `<rect x="${n1(x0 + 0.9)}" y="${n1(ry + 0.7)}" width="${n1(fw - 1.8)}" height="${n1(h - 1.4)}" rx="${n1(Math.min(3, h * 0.3))}" style="fill:${fill};stroke:${st};stroke-width:${sw}"/>${extra}`;
    }
  }
  // grain over the dense dividing zone
  s += `<rect x="${n1(cx - w / 2)}" y="${n1(base - 70)}" width="${n1(w)}" height="70" style="fill:${mx('series-5', INK, 60)};opacity:.16;filter:url(#cw-grain)"/>`;
  // root cap: loose rounded cells in layers over the tip
  let capS = ''; const qc = rnd(9);
  for (let k = 0; k < 3; k++) { const n = 5 + k * 2; for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, sx = (u - 0.5) * 2, px = cx + sx * hb * 0.92, py = base + (1 - sx * sx) * (cap - 6 - k * 9) + 2; capS += `<path d="${blobPath(px, py, Math.max(5, hb / n * 1.15), 6 + qc() * 2, 40 + j + k * 9, 0.12, 7)}" style="fill:${mx('strata-1', 'strata-2', 70)};stroke:${mx('strata-2', INK, 56)};stroke-width:1.3"/>`; } }
  s += capS + '</g>';
  s += `<path d="${out}" style="fill:none;stroke:${mx('strata-2', INK, 50)};stroke-width:2.4"/><path d="M${n1(cx - hw(top) + 3)} ${n1(top)}V${n1(base - 40)}" style="stroke:${W_};stroke-width:2;opacity:.5"/>`;
  // cap cells sloughing off
  for (let j = 0; j < 4; j++) { const sd = j % 2 ? 1 : -1; s += `<path d="${blobPath(cx + sd * (hb * 0.7 + 8 + j * 3), bot - 6 - j * 10, 6, 4.4, 70 + j, 0.16, 7)}" style="fill:${mx('strata-1', 'strata-2', 70)};stroke:${mx('strata-2', INK, 56)};stroke-width:1.2;opacity:.85"/>`; }
  const zone = [base - 7 * 10, base], older = rows.find((r) => r[2] === MAT)?.[0] ?? top + 40;
  const fileX = (j, yy = (top + older) / 2) => cx - hw(yy) + (j + 0.5) * (2 * hw(yy)) / files;
  return { svg: s, zone, older, fileX };
}
const arrow = (x0, y0, x1, y1, col, w = 3) => {
  const a = Math.atan2(y1 - y0, x1 - x0), hx = x1 - Math.cos(a) * 12, hy = y1 - Math.sin(a) * 12, px = -Math.sin(a) * 7, py = Math.cos(a) * 7;
  const mx2 = (x0 + x1) / 2 - (y1 - y0) * 0.12, my2 = (y0 + y1) / 2 + (x1 - x0) * 0.12;
  return `<path d="M${n1(x0)} ${n1(y0)}Q${n1(mx2)} ${n1(my2)} ${n1(hx)} ${n1(hy)}" style="fill:none;stroke:${col};stroke-width:${w};stroke-linecap:round"/><path d="M${n1(x1)} ${n1(y1)}L${n1(hx + px)} ${n1(hy + py)}L${n1(hx - px)} ${n1(hy - py)}Z" style="fill:${col}"/>`;
};
// a blank key, and the same key cut to fit one lock
function key(x, y, k, cut) {
  const c = mx('series-2', 'strata-1', 50), d = mx('series-2', INK, 50);
  let blade = `M${n1(x + 20 * k)} ${n1(y - 8 * k)}H${n1(x + 96 * k)}L${n1(x + 104 * k)} ${n1(y)}`;
  if (cut) blade += `L${n1(x + 96 * k)} ${n1(y + 8 * k)}L${n1(x + 90 * k)} ${n1(y + 14 * k)}L${n1(x + 82 * k)} ${n1(y + 8 * k)}L${n1(x + 74 * k)} ${n1(y + 16 * k)}L${n1(x + 64 * k)} ${n1(y + 8 * k)}L${n1(x + 56 * k)} ${n1(y + 13 * k)}L${n1(x + 46 * k)} ${n1(y + 8 * k)}H${n1(x + 20 * k)}Z`;
  else blade += `L${n1(x + 96 * k)} ${n1(y + 14 * k)}H${n1(x + 20 * k)}Z`;
  return `<path d="${blade}" style="fill:${c};stroke:${d};stroke-width:2;stroke-linejoin:round"/><path d="M${n1(x + 22 * k)} ${n1(y - 4 * k)}H${n1(x + 92 * k)}" style="stroke:${W_};stroke-width:2;opacity:.7"/>`
    + `<circle cx="${n1(x)}" cy="${n1(y + 3 * k)}" r="${n1(24 * k)}" style="fill:${c};stroke:${d};stroke-width:2"/><circle cx="${n1(x - 6 * k)}" cy="${n1(y + 3 * k)}" r="${n1(8 * k)}" style="fill:${mx('sea-shallow', W_, 30)};stroke:${d};stroke-width:2"/><path d="M${n1(x - 16 * k)} ${n1(y - 12 * k)}A${n1(20 * k)} ${n1(20 * k)} 0 0 1 ${n1(x + 8 * k)} ${n1(y - 16 * k)}" style="fill:none;stroke:${W_};stroke-width:2.4;opacity:.7"/>`;
}

export class Differentiate extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 680;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 560;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'A root tip cut lengthwise. Just behind the root cap, small dense cells keep dividing. The cells left behind grow longer and change: some become epidermis, parenchyma, xylem, phloem or sclerenchyma. A blank key becomes a cut key that fits one lock. Differentiation: a meristem cell with arrows to the specialised cells.';
  static CONTROLS = [];
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 540 : 408; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 15 : 16;
    let s = `<defs>${stDefs()}${taDefs()}</defs>` + depthField(W, H, { tone: 'blue', seed: 9 });
    const lab = (x, y, t, o = {}) => label(x, y, t, { size: fs, ...o });
    if (step === 3) {
      const cx = W / 2, cy = P ? H * 0.5 : H * 0.52, ms = P ? 96 : 112;
      s += lab(cx, P ? 34 : 36, 'Differentiation', { display: true, size: P ? 22 : 26 });
      s += meriCell(cx, cy, ms, { seed: 3, glow: true }) + lab(cx, cy + ms * 0.46 + 24, 'meristem cell', { size: fs - 1 });
      const POS = P ? [[0.22, 0.2], [0.78, 0.2], [0.2, 0.8], [0.8, 0.8], [0.5, 0.92]] : [[0.16, 0.3], [0.84, 0.3], [0.86, 0.74], [0.14, 0.74], [0.5, 0.9]];
      const ORD = ['scl', 'epi', 'par', 'phl', 'xyl'];
      ORD.forEach((id, i) => {
        const t = TYPES.find((q) => q.id === id), x = POS[i][0] * W, y = POS[i][1] * H, a = Math.atan2(y - cy, x - cx), last = id === 'xyl';
        s += arrow(cx + Math.cos(a) * ms * 0.6, cy + Math.sin(a) * ms * 0.54, x - Math.cos(a) * (last ? 30 : 52), y - Math.sin(a) * (last ? 26 : 40), mx('series-5', INK, 30));
        s += typeArt(id, x, y - 6, P ? 66 : 92);
        s += last ? lab(x + (P ? 66 : 82), y, t.name, { anchor: 'start' }) : lab(x, y + (P ? 40 : 50), t.name);
      });
      return { svg: cwFrame(st, 'df', s) };
    }
    if (!P && step <= 1) {
      // landscape: the root lies along the stage, tip to the right
      const L = W - 64, w = step === 0 ? 124 : 96, cx = W / 2 - 2, cy = step === 0 ? H * 0.5 : 84;
      const rt = rootTip(0, -L / 2, L / 2, w);
      s += `<g transform="translate(${n1(cx)} ${n1(cy)}) rotate(-90)">${rt.svg}</g>`;
      const x0 = cx + rt.zone[0], x1 = cx + rt.zone[1], left = cx - L / 2 + 16;
      if (step === 0) {
        const yb = cy + w / 2 + 40, ya = cy - w / 2 - 40;
        s += `<path d="M${n1(x0)} ${n1(yb)}H${n1(x1)}" style="stroke:${T('series-5')};stroke-width:5;stroke-linecap:round"/>`;
        s += `<path d="M${n1(left)} ${n1(ya)}H${n1(x0 - 30)}" style="stroke:${T('series-3')};stroke-width:5;stroke-linecap:round"/>`;
        s += lab(x1, yb + 28, 'stay meristematic, keep dividing', { anchor: 'end', size: 18, display: true });
        s += lab((left + x0) / 2, ya - 14, 'left behind: stop dividing, change into permanent tissue', { size: 18, display: true });
        s += `<g transform="translate(${n1(W - 160)} ${H - 40})"><rect x="0" y="-22" width="140" height="34" rx="17" style="fill:${mx('series-3', W_, 70)};stroke:${mx('series-3', INK, 50)};stroke-width:2"/>${label(70, 1, 'Both happen', { size: 17, display: true })}</g>`;
        return { svg: cwFrame(st, 'df', s) };
      }
      // each arrow starts on the file of cells that becomes that kind, in the part left behind
      TYPES.forEach((t, i) => {
        const x = W * (0.12 + i * 0.19), y = H * 0.66, j = FILES.indexOf(t.id), ly = -L / 2 + (rt.older + L / 2) * (0.12 + i * 0.17), sx = cx + ly, sy = cy - rt.fileX(j, ly);
        s += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="6" style="fill:none;stroke:${W_};stroke-width:4"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="6" style="fill:none;stroke:${mx('series-5', INK, 30)};stroke-width:2.4"/>`;
        s += arrow(sx, sy + 7, x, y - 70, mx('series-5', INK, 30));
        s += typeArt(t.id, x, y, 112) + lab(x, y + 76, t.name);
      });
      return { svg: cwFrame(st, 'df', s) };
    }
    const rx = P ? 84 : 118, top = 14, bot = H - (P ? 18 : 22), rw = P ? 70 : 104;
    const rt = rootTip(rx, top, bot, rw);
    s += rt.svg;
    const zMid = (rt.zone[0] + rt.zone[1]) / 2;
    if (step === 0) {
      s += `<path d="M${n1(rx + rw / 2 + 8)} ${n1(rt.zone[0])}V${n1(rt.zone[1])}" style="stroke:${T('series-5')};stroke-width:5;stroke-linecap:round"/>`;
      s += `<path d="M${n1(rx + rw / 2 + 8)} ${n1(top + 30)}V${n1(rt.zone[0] - 40)}" style="stroke:${T('series-3')};stroke-width:5;stroke-linecap:round"/>`;
      const lx = rx + rw / 2 + 22;
      s += lab(lx, zMid - 4, 'stay meristematic,', { anchor: 'start', size: P ? 15 : 18, display: true }) + lab(lx, zMid + (P ? 16 : 20), 'keep dividing', { anchor: 'start', size: P ? 15 : 18, display: true });
      const ly = (top + rt.zone[0]) / 2;
      s += lab(lx, ly - 4, 'left behind: stop dividing,', { anchor: 'start', size: P ? 15 : 18, display: true }) + lab(lx, ly + (P ? 16 : 20), 'change into permanent tissue', { anchor: 'start', size: P ? 15 : 18, display: true });
      s += `<g transform="translate(${n1(P ? W - 96 : W - 150)} ${P ? 28 : 34})"><rect x="0" y="-22" width="${P ? 86 : 132}" height="34" rx="17" style="fill:${mx('series-3', W_, 70)};stroke:${mx('series-3', INK, 50)};stroke-width:2"/>${label(P ? 43 : 66, 1, P ? 'Both!' : 'Both happen', { size: P ? 15 : 17, display: true })}</g>`;
      return { svg: cwFrame(st, 'df', s) };
    }
    if (step === 1) {
      TYPES.forEach((t, i) => {
        const x = P ? W * 0.7 : W * (0.43 + (i % 3) * 0.22) + (i > 2 ? W * 0.11 : 0), y = P ? 50 + i * ((H - 70) / 5) : (i < 3 ? H * 0.24 : H * 0.68);
        const j = FILES.indexOf(t.id), sy = top + 10 + (rt.older - top - 20) * (i / 4), sx = rt.fileX(j, sy);
        s += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="5" style="fill:none;stroke:${W_};stroke-width:4"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="5" style="fill:none;stroke:${mx('series-5', INK, 30)};stroke-width:2.2"/>`;
        s += arrow(sx + 6, sy, x - (P ? 40 : 52), y, mx('series-5', INK, 30));
        s += typeArt(t.id, x, y - 6, P ? 70 : 90) + lab(x, y + (P ? 38 : 60), t.name);
      });
      return { svg: cwFrame(st, 'df', s) };
    }
    // keys: blank cell -> one job, blank key -> one lock
    const kx = P ? W * 0.32 : W * 0.4, k = P ? 0.62 : 0.86, ky1 = P ? H * 0.22 : H * 0.3, ky2 = P ? H * 0.62 : H * 0.7;
    s += `<rect x="${n1(P ? rx + rw / 2 + 12 : W * 0.3)}" y="${n1(P ? 20 : 30)}" width="${n1(P ? W - rx - rw / 2 - 20 : W * 0.66)}" height="${n1(P ? H - 40 : H - 60)}" rx="22" style="fill:${mx('strata-1', W_, 18)};stroke:${mx('strata-2', INK, 40)};stroke-width:2.4"/>`;
    s += key(kx, ky1, k, false) + arrow(kx + 106 * k, ky1 + 3, kx + 160 * k, ky1 + 3, INK, 3) + key(kx + 194 * k, ky1, k, true);
    s += lab(kx + 40 * k, ky1 + 52 * k, 'blank key') + lab(kx + 236 * k, ky1 + 52 * k, 'fits one lock');
    s += meriCell(kx + 20 * k, ky2, 70 * k / 0.86, { seed: 3 }) + arrow(kx + 106 * k, ky2, kx + 160 * k, ky2, INK, 3) + `<g transform="rotate(90 ${n1(kx + 236 * k)} ${n1(ky2)})">${xylemTube(kx + 236 * k, ky2 - 56 * k, ky2 + 56 * k, 30 * k)}</g>`;
    s += lab(kx + 20 * k, ky2 + 62 * k, 'meristem cell') + lab(kx + 236 * k, ky2 + 62 * k, 'one job: xylem');
    return { svg: cwFrame(st, 'df', s) };
  }
}
