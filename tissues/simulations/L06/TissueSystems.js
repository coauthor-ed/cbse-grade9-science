// TissueSystems - blk-l06-s14. Fig 3.10 as three sections, each drawn as real rows of cells. Tabs in the scene: Leaf
// (a section across the midrib: upper and lower epidermis, palisade and spongy cells, the midrib bundle with xylem
// above phloem), Stem (epidermis, collenchyma, cortex parenchyma, a ring of bundles with sclerenchyma caps, phloem
// outside and xylem inside, pith), Root (epidermis with root hairs, a wide cortex, xylem in a cross with phloem between
// its arms). Beat 0 (together): every tissue grey. Beats 1-3 light the dermal, ground and vascular systems.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { flowTabsHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, depthField, T, mx, n1, rnd, blobPath } from '../shared/CellWorld.js';
import { stDefs, polarCells, cells, vessel, sieve, pol, STAIN } from '../shared/StemArt.js';
import { collCell } from '../shared/CellTypes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
// one colour per system, matching the slide's three names
const DER = mx('series-1', 'elev-peak', 50), DER_D = mx('series-1', INK, 50);
const GRO = mx('elev-low', 'chloro', 28), GRO_L = mx(GRO, W_, 55), GRO_D = mx(GRO, INK, 55);
const COL = mx('elev-low', 'chloro', 50), SCL = mx('series-2', 'strata-3', 46), SCL_D = mx(SCL, INK, 56);
const XYL = mx('series-6', 'strata-3', 48), XYL_D = mx(XYL, INK, 56), PHL = mx('series-5', 'elev-peak', 50), PHL_D = mx('series-5', INK, 50);
const CUT = mx('gold', 'strata-2', 50);
const SYS = ['dermal', 'ground', 'vascular'];
const NAME = { dermal: 'Dermal tissue', ground: 'Ground tissue', vascular: 'Vascular tissue' };
const TABS = [{ key: 'leaf', label: 'Leaf' }, { key: 'stem', label: 'Stem' }, { key: 'root', label: 'Root' }];

// a cell: an ellipse with a wall that has thickness, a light rim, and a hint of cytoplasm
function cell(x, y, rx, ry, rot, col, colD, o = {}) {
  const wall = o.wall ?? 1.8;
  let s = `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(ry)}" transform="rotate(${n1(rot)} ${n1(x)} ${n1(y)})" style="fill:${o.fill ?? col};stroke:${colD};stroke-width:${n1(wall)}"/>`;
  if (o.lumen) s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx * o.lumen)}" ry="${n1(ry * o.lumen)}" transform="rotate(${n1(rot)} ${n1(x)} ${n1(y)})" style="fill:${o.lumenCol ?? W_};stroke:${mx(colD, INK, 70)};stroke-width:1"/>`;
  if (o.nuc && rx > 5) s += `<circle cx="${n1(x + rx * 0.2)}" cy="${n1(y + ry * 0.1)}" r="${n1(Math.min(rx, ry) * 0.24)}" style="fill:${mx('series-5', colD, 50)};opacity:.7"/>`;
  if (rx > 6 && !o.lumen) s += `<ellipse cx="${n1(x - rx * 0.25)}" cy="${n1(y - ry * 0.3)}" rx="${n1(rx * 0.4)}" ry="${n1(Math.max(1, ry * 0.18))}" transform="rotate(${n1(rot)} ${n1(x)} ${n1(y)})" style="fill:${W_};opacity:.45"/>`;
  return s;
}
// a ring of cells between radii r0 and r1 around (cx, cy)
function ring(cx, cy, r0, r1, col, colD, o = {}) {
  const r = rnd(o.seed ?? 1), rm = (r0 + r1) / 2, t = r1 - r0, n = Math.max(6, Math.round((2 * Math.PI * rm) / (t * (o.aspect ?? 1))));
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i + (o.off ?? 0)) / n * 2 * Math.PI, j = o.jit ?? 0.08, x = cx + Math.cos(a) * rm * (1 + (r() - 0.5) * j * 0.3), y = cy + Math.sin(a) * rm * (1 + (r() - 0.5) * j * 0.3);
    if (o.skip?.(a)) continue;
    s += cell(x, y, t * 0.5 * (o.ry ?? 0.92), (Math.PI * rm / n) * (o.rx ?? 0.92), (a * 180) / Math.PI, col, colD, o);
  }
  return s;
}
// a disc of round cells filling radius R
function disc(cx, cy, R, col, colD, cs, o = {}) {
  let s = '';
  for (let rm = cs * 0.6; rm < R; rm += cs) s += ring(cx, cy, rm - cs / 2, rm + cs / 2, col, colD, { ...o, off: rm / cs * 0.37, seed: Math.round(rm) });
  return s;
}

// The stem in T.S., drawn as a stained section: a single epidermis of brick cells under a cuticle, collenchyma with
// thick corners, cortex parenchyma with air spaces, a ring of bundles (sclerenchyma cap, phloem of small angular sieve
// tubes and companion cells, a cambium strip, xylem of wide thick-walled empty vessels with small parenchyma between),
// parenchyma rays between the bundles and a pith of large cells.
function stemSection(cx, cy, R, part) {
  let s = `<circle cx="${n1(cx + 4)}" cy="${n1(cy + 8)}" r="${n1(R + 4)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:${mx(STAIN.cell, 'elev-peak', 46)}"/>`;
  const nb = 8, br = R * 0.6, bw = R * 0.22, q = R / 178, hw = 0.2, TAU = Math.PI * 2;
  const inB = (a, k = 1) => { const t = ((a % (TAU / nb)) + TAU / nb) % (TAU / nb); return Math.min(t, TAU / nb - t) < hw * k; };
  // ground: pith, rays, cortex, collenchyma, sclerenchyma caps
  let g = `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(br - bw * 1.05)}" style="fill:${mx(STAIN.cell, 'elev-peak', 40)}"/>`;
  g += cells(polarCells(cx, cy, 0, R * 0.08, 0, TAU, { rows: 1, size: R * 0.12, seed: 2 }), 'pith', { vac: true, seed: 2 });
  g += cells(polarCells(cx, cy, R * 0.08, br - bw * 1.05, 0, TAU, { size: R * 0.105, seed: 3, jit: 2 }), 'pith', { vac: true, seed: 3 });
  g += cells(polarCells(cx, cy, br - bw * 1.05, br + bw * 0.86, 0, TAU, { size: 13 * q, seed: 4, aspect: 0.8, keep: (r, a) => !inB(a, 1.05) }), 'par', { seed: 4 });
  g += cells(polarCells(cx, cy, br + bw * 0.86, R * 0.84, 0, TAU, { size: 17 * q, seed: 5, jit: 2.4 }), 'par', { loose: true, green: true, seed: 5 });
  g += cells(polarCells(cx, cy, R * 0.84, R * 0.925, 0, TAU, { rows: 2, size: 11 * q, seed: 6 }), 'coll', { seed: 6 });
  for (let i = 0; i < nb; i++) { const a = i / nb * TAU; g += cells(polarCells(cx, cy, br + bw * 0.5, br + bw * 0.86, a - hw * 0.95, a + hw * 0.95, { rows: 2, size: 6.4 * q, seed: 20 + i, jit: 0.6 }), 'scl', { seed: 20 + i }); }
  // vascular: phloem outside, a cambium strip, xylem inside
  let v = '';
  for (let i = 0; i < nb; i++) {
    const a = i / nb * TAU;
    v += cells(polarCells(cx, cy, br + bw * 0.1, br + bw * 0.5, a - hw * 0.85, a + hw * 0.85, { rows: 3, size: 6.6 * q, seed: 30 + i, jit: 0.8 }), 'phl', { seed: 30 + i, tone: 'series-5' });
    for (const [rr, da] of [[0.3, -0.45], [0.3, 0.45], [0.36, 0]]) { const [x, y] = pol(cx, cy, br + bw * rr, a + da * hw); v += sieve(x, y, 5.2 * q, { seed: i * 3 + da * 10, comp: a + Math.PI / 2 }); }
    v += cells(polarCells(cx, cy, br - bw * 0.04, br + bw * 0.1, a - hw * 0.9, a + hw * 0.9, { rows: 2, size: 7 * q, aspect: 0.5, seed: 40 + i, jit: 0.4 }), 'camb', { seed: 40 + i });
    v += cells(polarCells(cx, cy, br - bw * 1.02, br - bw * 0.04, a - hw * 0.75, a + hw * (0.75), { rows: 4, size: 6 * q, seed: 50 + i, jit: 0.8 }), 'par', { seed: 50 + i });
    for (const [rr, da, vr] of [[-0.26, -0.52, 7.6], [-0.26, 0.52, 7.6], [-0.3, 0, 9], [-0.6, -0.34, 6.2], [-0.6, 0.34, 6.2], [-0.86, 0, 4.2]]) { const [x, y] = pol(cx, cy, br + bw * rr, a + da * hw); v += vessel(x, y, vr * q); }
  }
  // dermal: one row of brick epidermis cells, a gold cuticle over them
  let d = cells(polarCells(cx, cy, R * 0.925, R * 0.985, 0, TAU, { rows: 1, size: 12 * q, aspect: 1.3, seed: 7, jit: 0.5 }), 'epi', { seed: 7, tone: 'series-1' });
  d += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R * 0.99)}" style="fill:none;stroke:${STAIN.cut};stroke-width:${n1(3.4 * q)}"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:none;stroke:${STAIN.cutD};stroke-width:1.2"/>`;
  d += `<path d="M${n1(cx - R * 0.86)} ${n1(cy - R * 0.42)}A${n1(R * 0.97)} ${n1(R * 0.97)} 0 0 1 ${n1(cx - R * 0.3)} ${n1(cy - R * 0.92)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.6"/>`;
  return s + part('ground', g) + part('vascular', v) + part('dermal', d);
}

// The root in T.S., stained: one row of epidermis with root hairs (each a long outgrowth of one epidermal cell), a wide
// cortex of loose round parenchyma, the endodermis ring, the pericycle, then xylem in a cross (big vessels in the
// middle, small ones at the arm tips) with phloem patches between the arms.
function rootSection(cx, cy, R, part) {
  const q = R / 178, sr = R * 0.32, TAU = Math.PI * 2;
  let s = `<circle cx="${n1(cx + 4)}" cy="${n1(cy + 8)}" r="${n1(R + 4)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:${mx(STAIN.cell, 'elev-peak', 46)}"/>`;
  let g = cells(polarCells(cx, cy, sr + R * 0.06, R * 0.885, 0, TAU, { size: 17 * q, seed: 31, jit: 2.4 }), 'par', { loose: true, vac: true, seed: 31 });
  g += cells(polarCells(cx, cy, sr, sr + R * 0.06, 0, TAU, { rows: 1, size: 9 * q, aspect: 1.5, seed: 32, jit: 0.5 }), 'epi', { seed: 32, tone: 'series-2' });
  let v = `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(sr)}" style="fill:${mx(STAIN.cell, 'elev-peak', 30)}"/>`;
  v += cells(polarCells(cx, cy, sr - R * 0.04, sr, 0, TAU, { rows: 1, size: 7 * q, aspect: 1.2, seed: 33, jit: 0.4 }), 'camb', { seed: 33 });
  v += cells(polarCells(cx, cy, R * 0.03, sr - R * 0.04, 0, TAU, { size: 7 * q, seed: 34, jit: 0.6 }), 'par', { seed: 34 });
  for (let i = 0; i < 4; i++) {
    const b = i * Math.PI / 2 + Math.PI / 4 + Math.PI / 4;
    v += cells(polarCells(cx, cy, sr * 0.48, sr * 0.88, b - 0.32, b + 0.32, { rows: 3, size: 5.6 * q, seed: 40 + i, jit: 0.5 }), 'phl', { seed: 40 + i, tone: 'series-5' });
    { const [x, y] = pol(cx, cy, sr * 0.68, b); v += sieve(x, y, 4.6 * q, { seed: i + 2, comp: b }); }
  }
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    for (const [u, vr] of [[0.24, 8.4], [0.44, 6.6], [0.62, 5], [0.78, 3.6]]) { const [x, y] = pol(cx, cy, sr * u, a); v += vessel(x, y, vr * q); }
  }
  v += vessel(cx, cy, 9.6 * q);
  // dermal: epidermis, and root hairs grown out of single epidermal cells
  const epi = polarCells(cx, cy, R * 0.885, R * 0.965, 0, TAU, { rows: 1, size: 11 * q, aspect: 1.2, seed: 35, jit: 0.5 });
  let d = cells(epi, 'epi', { seed: 35, tone: 'series-1' });
  epi.forEach((c, i) => {
    if (i % 5) return;
    const a = c.a, l = R * (0.16 + (i % 3) * 0.05), w = 5.6 * q, b0 = pol(cx, cy, R * 0.955, a), e = pol(cx, cy, R * 0.955 + l, a + 0.05), m = pol(cx, cy, R * 0.955 + l * 0.5, a - 0.03);
    const hd = `M${n1(b0[0])} ${n1(b0[1])}Q${n1(m[0])} ${n1(m[1])} ${n1(e[0])} ${n1(e[1])}`;
    d += `<path d="${hd}" style="fill:none;stroke:${STAIN.cellD};stroke-width:${n1(w + 2.4)};stroke-linecap:round"/><path d="${hd}" style="fill:none;stroke:${mx(STAIN.lumen, 'series-1', 86)};stroke-width:${n1(w)};stroke-linecap:round"/><path d="${hd}" style="fill:none;stroke:${W_};stroke-width:1.2;stroke-linecap:round;opacity:.6;transform:translate(-1px,-1px)"/>`;
  });
  return s + part('ground', g) + part('vascular', v) + part('dermal', d);
}

// The leaf in T.S. across the midrib, stained: epidermis of brick cells under a cuticle (stomata in the lower one),
// palisade columns lined with chloroplasts, loose spongy cells with air spaces, the midrib with collenchyma under both
// faces, parenchyma round the bundle, and the bundle itself: xylem (wide thick-walled vessels) above phloem (sieve
// tubes with companion cells), a bundle sheath round it; small veins in the blade.
function leafSection(cx, cy, w, h, part) {
  const x0 = cx - w / 2, x1 = cx + w / 2, top = cy - h * 0.32, bot = cy + h * 0.1, mb = cy + h * 0.4, mw = w * 0.15, r = rnd(60);
  const outline = `M${n1(x0)} ${n1(top + 10)}Q${n1(x0 - 6)} ${n1((top + bot) / 2)} ${n1(x0)} ${n1(bot - 4)}H${n1(cx - mw * 1.6)}C${n1(cx - mw * 1.1)} ${n1(bot)} ${n1(cx - mw)} ${n1(mb)} ${n1(cx)} ${n1(mb)}C${n1(cx + mw)} ${n1(mb)} ${n1(cx + mw * 1.1)} ${n1(bot)} ${n1(cx + mw * 1.6)} ${n1(bot - 4)}H${n1(x1)}Q${n1(x1 + 6)} ${n1((top + bot) / 2)} ${n1(x1)} ${n1(top + 10)}Q${n1(cx)} ${n1(top - 18)} ${n1(x0)} ${n1(top + 10)}Z`;
  let s = `<path d="${outline}" transform="translate(4 8)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><path d="${outline}" style="fill:${mx('sea-shallow', 'elev-peak', 34)}"/><clipPath id="ts-lf"><path d="${outline}"/></clipPath>`;
  const yTop = (x) => top + 10 - 28 * (1 - Math.pow((x - cx) / (w / 2), 2)) * 0.5 + 3;
  const GR = mx('elev-low', 'chloro', 40), GR_D = mx(GR, INK, 56), GR_L = mx(GR, 'elev-peak', 56);
  const chl = (x, y, a, k = 1) => `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(2.6 * k)}" ry="${n1(1.6 * k)}" transform="rotate(${n1(a)} ${n1(x)} ${n1(y)})" style="fill:url(#cw-chl) ${T('chloro')};stroke:${mx('chloro', INK, 50)};stroke-width:.5"/>`;
  let g = '', d = '', v = '';
  // palisade: packed columns with chloroplasts along their walls
  for (let x = x0 + 6; x < x1 - 6; x += 10.5) {
    if (Math.abs(x - cx) < mw * 1.1) continue;
    const yt = yTop(x) + 11, ph = h * 0.16 + r() * 4;
    g += `<rect x="${n1(x - 4.6)}" y="${n1(yt)}" width="9.4" height="${n1(ph)}" rx="4.4" style="fill:url(#ts-gc) ${GR_L};stroke:${GR_D};stroke-width:1.2"/>`;
    for (let yy = yt + 5; yy < yt + ph - 4; yy += 5.4) g += chl(x + (yy % 10.8 < 5.4 ? -2.4 : 2.4), yy, 90, 0.8);
  }
  // spongy: loose rounded cells, each with a few chloroplasts, air spaces between
  for (let j = 0; j < 3; j++) for (let x = x0 + 12 + j * 7; x < x1 - 8; x += 21) {
    if (Math.abs(x - cx) < mw * 1.2) continue;
    const y = cy - h * 0.06 + j * h * 0.07 + (r() - 0.5) * 6, rx = 7.6 + r() * 2, ry = 5.6 + r() * 1.5, cd = blobPath(x, y, rx, ry, j * 17 + Math.round(x), 0.16, 7);
    g += `<path d="${cd}" style="fill:url(#ts-gc) ${GR_L};stroke:${GR_D};stroke-width:1.2"/>` + chl(x - rx * 0.5, y, 70) + chl(x + rx * 0.4, y - ry * 0.4, 20) + chl(x + rx * 0.1, y + ry * 0.5, -10);
  }
  // midrib: parenchyma round the bundle, collenchyma under both faces
  const mp = [];
  for (let k = 0; k < 46; k++) { const a = r() * 2 * Math.PI, rr = mw * (0.52 + r() * 0.42), x = cx + Math.cos(a) * rr, y = cy + h * 0.14 + Math.sin(a) * rr * 0.9; if (mp.some(([px, py]) => Math.hypot(px - x, py - y) < 10)) continue; mp.push([x, y]); g += `<path d="${blobPath(x, y, 6.4, 5.6, k + 3, 0.1, 7)}" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${STAIN.cellD};stroke-width:1.2"/>`; }
  for (let k = -3; k <= 3; k++) g += collCell(cx + k * 9, mb - 12, 8.4);
  for (let k = -3; k <= 3; k++) g += collCell(cx + k * 9, yTop(cx) + 17, 8.4);
  // vascular: bundle sheath, xylem vessels above, phloem below; small veins in the blade
  const vy = cy + h * 0.06;
  for (let k = 0; k < 18; k++) { const a = (k / 18) * 2 * Math.PI, x = cx + Math.cos(a) * 34, y = vy + 8 + Math.sin(a) * 26; v += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="5" ry="4" style="fill:${mx(STAIN.lumen, 'elev-low', 70)};stroke:${STAIN.cellD};stroke-width:1"/>`; }
  for (const [dx, dy, rad] of [[-20, -4, 6], [-7, -12, 7.5], [8, -12, 7.5], [21, -4, 6], [-12, 6, 5], [0, 2, 5.5], [12, 6, 5]]) v += vessel(cx + dx, vy + dy, rad);
  for (const [dx, dy] of [[-18, 22], [-6, 26], [6, 26], [18, 22], [0, 34]]) v += sieve(cx + dx, vy + dy, 4.4, { seed: dx + 30, comp: 1.4 });
  for (const ux of [-0.32, 0.32]) { const vx = cx + ux * w; v += `<ellipse cx="${n1(vx)}" cy="${n1(cy + 3)}" rx="11" ry="10" style="fill:${mx(STAIN.lumen, 'elev-low', 70)};stroke:${STAIN.cellD};stroke-width:1"/>` + vessel(vx - 3.5, cy - 0.5, 3.4) + vessel(vx + 3.5, cy - 0.5, 3.4) + sieve(vx, cy + 7, 3, { seed: 3 }); }
  // dermal: upper and lower epidermis of brick cells, a gold cuticle, stomata in the lower one
  const brick = (x, y) => `<rect x="${n1(x - 6)}" y="${n1(y)}" width="12" height="10" rx="3" style="fill:url(#st-lum) ${STAIN.lumen};stroke:${mx(STAIN.cellD, 'series-1', 70)};stroke-width:1.4"/>`;
  for (let x = x0 + 4; x < x1; x += 12.6) d += brick(x, yTop(x) - 1);
  { let cu = ''; for (let x = x0; x <= x1; x += 6) cu += `${x === x0 ? 'M' : 'L'}${n1(x)} ${n1(yTop(x) - 2.4)}`; d += `<path d="${cu}" style="fill:none;stroke:${STAIN.cut};stroke-width:3"/>`; }
  const st = [-0.4, -0.2, 0.22, 0.38].map((u) => cx + u * w);
  for (let x = x0 + 4; x < x1; x += 12.6) { if (Math.abs(x - cx) < mw * 1.6 || st.some((q) => Math.abs(x - q) < 10)) continue; d += brick(x, bot - 13); }
  for (let k = 0; k < 15; k++) { const a = Math.PI * (0.08 + k * 0.84 / 14), x = cx - Math.cos(a) * mw * 1.02, y = cy + h * 0.14 + Math.sin(a) * (mb - cy - h * 0.14) * 0.97; d += cell(x, y, 5.4, 4.4, (a * 180) / Math.PI, DER, DER_D, { wall: 1.4 }); }
  for (const q of st) for (const sg of [-1, 1]) d += `<ellipse cx="${n1(q + sg * 5)}" cy="${n1(bot - 8)}" rx="4.8" ry="4.2" style="fill:url(#ts-gc) ${GR};stroke:${GR_D};stroke-width:1.2"/><path d="M${n1(q + sg * 1.2)} ${n1(bot - 11)}V${n1(bot - 5)}" style="fill:none;stroke:${mx(STAIN.cellD, 'elev-peak', 20)};stroke-width:2;stroke-linecap:round"/>` + chl(q + sg * 6, bot - 8, 40, 0.8);
  d += `<path d="${outline}" style="fill:none;stroke:${CUT};stroke-width:2.4"/>`;
  return s + `<g clip-path="url(#ts-lf)">${part('ground', g)}${part('vascular', v)}${part('dermal', d)}</g>`;
}

export class TissueSystems extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Sections of a leaf, a stem and a root, drawn as rows of cells. The dermal tissue is the outer layer of cells. The ground tissue is the parenchyma, collenchyma and sclerenchyma between the outer layer and the conducting tissues. The vascular tissue is the xylem and phloem: in the stem a ring of bundles with phloem outside and xylem inside, in the leaf midrib xylem above phloem, in the root xylem in a cross with phloem between its arms. Tabs switch between leaf, stem and root.';
  static CONTROLS = [];

  tab = 'stem';

  async setup() {
    await super.setup();
    bindFlow(this.root, { tab: (k) => { if (TABS.some((t) => t.key === k)) { this.tab = k; this.repaint(); } } });
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 50px; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }
  enter() { this.tab = 'stem'; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 15 : 17;
    const lit = step === 0 ? null : SYS[step - 1];
    const part = (id, body) => `<g style="${lit === null ? 'filter:saturate(0.08);opacity:.85' : lit === id ? '' : 'filter:saturate(0.12);opacity:.5'}">${body}</g>`;
    let s = `<defs>${stDefs()}<radialGradient id="ts-gc" cx=".34" cy=".28" r=".85"><stop offset="0" style="stop-color:${mx(mx('elev-low', 'chloro', 40), 'elev-peak', 56)}"/><stop offset="1" style="stop-color:${mx(mx('elev-low', 'chloro', 40), INK, 84)}"/></radialGradient></defs>` + depthField(W, H, { tone: 'green', seed: 33 });
    const cx = P ? W / 2 : W * 0.4, cy = P ? H * 0.46 : H / 2, R = P ? 150 : 178;
    if (this.tab === 'stem') s += stemSection(cx, cy, R, part);
    else if (this.tab === 'root') s += rootSection(cx, cy, R * 0.9, part);
    else s += leafSection(P ? W / 2 : W * 0.38, cy, P ? W - 24 : W * 0.68, P ? 300 : 340, part);
    // the names of the three systems, at the side (landscape) or under the figure (portrait); the lit one is bold
    const col = { dermal: DER_D, ground: GRO_D, vascular: XYL_D };
    SYS.forEach((id, i) => {
      const on = lit === id, x = P ? W * (0.18 + i * 0.32) : W * 0.86, y = P ? H - 18 : H * 0.3 + i * 56;
      const t = P ? id[0].toUpperCase() + id.slice(1) : NAME[id];
      s += label(x, y, t, { size: on ? fs + 3 : fs, display: on, ink: on ? mx(col[id], INK, 70) : mx(INK, 'elev-peak', 55), anchor: 'middle' });
    });
    if (step === 0) s += label(P ? W / 2 : W * 0.86, P ? 26 : H * 0.3 - 46, 'three tissue systems', { size: fs - 1 });
    const head = flowTabsHtml(TABS, this.tab, 'Plant part');
    return { svg: cwFrame(st, 'ts', s), head };
  }
}
