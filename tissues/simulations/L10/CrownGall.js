// CrownGall - blk-l10-s10 (beats disease, study, tool, whole-plant). Calm and clinical. Step 0: a woody stem in a garden
// bed with a rounded gall swelling at its base; a lens into the gall shows many small cells dividing fast; Agrobacterium
// tumefaciens drawn as plain rods in the soil by the stem. Step 1: one plant cell with its wall and membrane; at a wound
// in the wall a bacterium passes a strand of genetic material into the cell, while a strand outside the unbroken wall
// stays out (genes cannot simply be poured in). Step 2: the bacterium's ring of genetic material: the swelling genes come
// out and one useful gene goes in their place; three uses below (phytochemicals, improved crops, disease-resistant
// varieties). Step 3: one changed cell, a mass of cells, a plantlet, a whole plant; every cell carries the new gene.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, artDefs, svgPlantColour as pc } from '../shared/PlantArt.js';
import { cwDefs, T, mx, blobPath, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, frame, tag, leader, txt, n, form, tube } from '../shared/BodyArt.js';
import { sky, hedge } from '../shared/Scapes.js';
import { leafArt, taDefs } from '../shared/TissueArt.js';
import { cell, cellMass, testTube, plantlet, CELL, WALL, SOIL } from '../shared/CultureArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const BARK = pc('bark'), BARK_D = mx(BARK, INK, 56);
const GALL = mx(BARK, 'strata-1', 70), BAC = mx('series-7', 'elev-peak', 52), BAC_D = mx('series-7', INK, 62);
const DNA = mx('series-2', 'gold', 60), SWELL = mx('series-6', 'series-4', 70), GENE = mx('good', 'elev-low', 70);

// a plain rod bacterium: a capsule with a lit side, a rim and a coiled strand inside. No face.
function rod(x, y, len, deg, o = {}) {
  const r = len * 0.22, d = `M${n(-len / 2 + r)} ${n(-r)}H${n(len / 2 - r)}A${n(r)} ${n(r)} 0 0 1 ${n(len / 2 - r)} ${n(r)}H${n(-len / 2 + r)}A${n(r)} ${n(r)} 0 0 1 ${n(-len / 2 + r)} ${n(-r)}Z`;
  const inner = o.plain ? '' : `<path d="M${n(-len * 0.3)} 0q${n(len * 0.08)} ${n(-r * 0.6)} ${n(len * 0.15)} 0t${n(len * 0.15)} 0t${n(len * 0.15)} 0t${n(len * 0.15)} 0" style="fill:none;stroke:${BAC_D};stroke-width:${n(Math.max(1, r * 0.18))};opacity:.5"/>`;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(deg)})">${form(d, BAC, { ao: r * 0.6, rim: o.lit ? 2.6 : 1.6, rimCol: o.lit ? INK : undefined, hi: 50, inner })}</g>`;
}
// a strand of genetic material along a path of points, in segments of colours
function strand(pts, cols, w = 5) {
  let s = '';
  const seg = Math.floor((pts.length - 1) / cols.length) || 1;
  cols.forEach((c, i) => {
    const part = pts.slice(i * seg, Math.min(pts.length, (i + 1) * seg + 1));
    if (part.length < 2) return;
    const d = `M${part.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}`;
    s += `<path d="${d}" style="fill:none;stroke:${mx(c, INK, 55)};stroke-width:${w + 2.4};stroke-linecap:round;stroke-linejoin:round"/><path d="${d}" style="fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round"/>`;
  });
  return s;
}
const wave = (x0, y0, x1, y1, amp = 6, k = 24) => { const pts = [], L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L; for (let i = 0; i <= k; i++) { const u = i / k, a = Math.sin(u * Math.PI * 6) * amp; pts.push([x0 + (x1 - x0) * u + nx * a, y0 + (y1 - y0) * u + ny * a]); } return pts; };

// a soil cut: a grass edge on top, darker layers going down, crumbs and small stones
function ground(W, H, gy) {
  let s = sky(W, gy, { warm: 0.2 }) + hedge(W, gy - 70, 70, { seed: 4, a: 0.7 });
  s += `<defs><linearGradient id="cg-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(SOIL, 'elev-peak', 86)}"/><stop offset="0.4" style="stop-color:${SOIL}"/><stop offset="1" style="stop-color:${mx(SOIL, INK, 70)}"/></linearGradient></defs>`;
  s += `<rect y="${n(gy)}" width="${W}" height="${n(H - gy)}" style="fill:url(#cg-soil)"/><rect y="${n(gy)}" width="${W}" height="${n(H - gy)}" style="fill:${INK};opacity:.16;filter:url(#pa-grain)"/>`;
  const r = rnd(5);
  for (let i = 0; i < 70; i++) { const cx = r() * W, cy = gy + 8 + r() * (H - gy - 10), rx = 1.5 + r() * 4.5; s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(rx * (0.5 + r() * 0.3))}" style="fill:${r() < 0.5 ? mx(SOIL, 'elev-peak', 64) : mx(SOIL, INK, 62)};opacity:${n(0.35 + r() * 0.35)}"/>`; }
  for (let i = 0; i < 9; i++) { const cx = r() * W, cy = gy + 20 + r() * (H - gy - 26), rr = 3 + r() * 5; s += form(blobPath(cx, cy, rr * 1.3, rr, i + 2, 0.18, 7), mx('strata-5', 'elev-peak', 60), { ao: 2, rim: 1, hi: 50 }); }
  // grass edge: a lit top band with tufts
  s += `<path d="M0 ${n(gy)}H${W}" style="fill:none;stroke:${mx('elev-low', 'chloro', 50)};stroke-width:6"/>`;
  let tu = '';
  for (let i = 0; i < 90; i++) { const x = r() * W, h = 5 + r() * 9; tu += `M${n(x)} ${n(gy + 2)}q${n((r() - 0.5) * 4)} ${n(-h * 0.6)} ${n((r() - 0.5) * 8)} ${n(-h)}`; }
  s += `<path d="${tu}" style="fill:none;stroke:${mx('elev-low', 'chloro', 40)};stroke-width:1.6;stroke-linecap:round"/>`;
  return s;
}
const LEAF = mx('elev-low', 'chloro', 55), LEAF_D = mx(LEAF, INK, 58), LEAF_L = mx(LEAF, 'gold', 72);
// a leaf mass: a lumpy clump of foliage, lit top left, with leaf texture on it
function leafMass(x, y, rx, ry, seed, tone) {
  const q = rnd(seed), col = tone < 0 ? mx(LEAF, INK, 78) : tone > 0 ? mx(LEAF, 'gold', 84) : LEAF;
  let inner = '';
  for (let i = 0; i < Math.round(rx * 1.7); i++) {
    const a = q() * 6.283, d = Math.sqrt(q()), lx = x + Math.cos(a) * rx * d, ly = y + Math.sin(a) * ry * d, l = 5 + q() * 6, rot = q() * 180;
    const lit = ly < y - ry * 0.2 && lx < x + rx * 0.3;
    inner += `<ellipse cx="${n(lx)}" cy="${n(ly)}" rx="${n(l)}" ry="${n(l * 0.42)}" transform="rotate(${n(rot)} ${n(lx)} ${n(ly)})" style="fill:${lit ? LEAF_L : q() < 0.5 ? LEAF_D : col};opacity:${lit ? 0.75 : 0.5}"/>`;
  }
  return form(blobPath(x, y, rx, ry, seed, 0.2, 17), col, { ao: rx * 0.3, rim: 1.6, rimCol: LEAF_D, hi: 40, lo: 46, inner });
}
// a tree: bark-ridged trunk flaring into roots in the soil, branches, a full crown of overlapping leaf masses.
// Returns { svg, wound }: wound is a nick on one root (where the bacteria get in).
function tree(x, gy, h, P, o = {}) {
  const k = h / 280, w0 = 30 * k + 8, w1 = 13 * k + 4, top = gy - h * 0.58;
  let s = '', wound = null;
  // roots spread out under the soil
  const roots = [[-1, 0.9, 0.5], [1, 1.0, 0.42], [-1, 0.5, 0.75], [1, 0.45, 0.8], [0, 0.6, 1.0]];
  roots.forEach(([sx, len, dip], i) => {
    const ex = x + sx * h * 0.42 * len + (sx === 0 ? 8 : 0), ey = gy + h * 0.2 * dip + 10, mx0 = x + sx * h * 0.16 * len, my0 = gy + 10;
    s += tube(`M${n(x + sx * w0 * 0.3)} ${n(gy + 2)}Q${n(mx0)} ${n(my0)} ${n(ex)} ${n(ey)}`, mx(BARK, 'strata-1', 70), Math.max(2.4, 7 * k * (1 - i * 0.12)));
    s += `<path d="M${n(ex)} ${n(ey)}l${n(sx * 10 * k + 4)} ${n(8 * k + 3)}M${n((x + ex) / 2)} ${n((gy + ey) / 2 + 4)}l${n(sx * 6 - 3)} ${n(10 * k + 4)}" style="fill:none;stroke:${mx(BARK, 'strata-1', 60)};stroke-width:1.6;stroke-linecap:round"/>`;
    if (i === 0) wound = [0.25 * x + 0.5 * mx0 + 0.25 * ex, 0.25 * (gy + 2) + 0.5 * my0 + 0.25 * ey];
  });
  if (o.gall && wound) s += `<path d="M${n(wound[0] - 5)} ${n(wound[1] - 3)}l4 4l3 -3l3 4" style="fill:none;stroke:${mx(BARK_D, INK, 60)};stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/><circle cx="${n(wound[0])}" cy="${n(wound[1])}" r="5" style="fill:${mx(GALL, 'strata-1', 50)};opacity:.7"/>`;
  // back leaf masses, branches, trunk, front leaf masses
  const cx = x + 6 * k, cy = top - h * 0.12, CR = h * 0.36;
  const masses = [[-0.62, 0.22, 0.42, -1], [0.66, 0.2, 0.42, -1], [-0.1, -0.42, 0.5, -1], [0.0, 0.05, 0.62, 0], [-0.5, -0.18, 0.44, 0], [0.48, -0.2, 0.46, 0], [-0.24, 0.36, 0.38, 1], [0.3, 0.3, 0.4, 0], [-0.3, -0.5, 0.36, 1], [0.24, -0.52, 0.36, 1]];
  masses.filter((m) => m[3] < 0).forEach(([u, v, r], i) => { s += leafMass(cx + u * CR, cy + v * CR, CR * r, CR * r * 0.8, 20 + i, -1); });
  const brs = [[-1, 0.62, 0.62], [1, 0.7, 0.58], [-1, 0.82, 0.4], [1, 0.9, 0.36]];
  for (const [sx, u, l] of brs) { const bx = x + 2, by = gy - h * 0.58 * u - h * 0.1; s += tube(`M${n(bx)} ${n(by + 10 * k)}Q${n(bx + sx * CR * l * 0.4)} ${n(by - CR * 0.1)} ${n(bx + sx * CR * l)} ${n(by - CR * l * 0.5)}`, BARK, Math.max(3, 9 * k * l)); }
  // trunk with a flared foot and bark ridges
  const wAt = (u) => w1 + (w0 - w1) * (1 - u) + (u < 0.14 ? (0.14 - u) * 150 * k : 0);
  const L = [], R = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12, w = wAt(u), yy = gy + 4 - u * (gy + 4 - top), wob = Math.sin(u * 4) * 3 * k; L.push([x - w / 2 + wob, yy]); R.push([x + w / 2 + wob, yy]); }
  const d = `M${L.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}L${R.reverse().map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}Z`;
  const q = rnd(31);
  let ridges = '';
  for (let j = 0; j < 7; j++) { const u0 = (j + 0.5) / 7 - 0.5; for (let i = 0; i <= 10; i++) { const u = i / 10, yy = gy - u * (gy - top); ridges += `${i ? 'L' : 'M'}${n(x + u0 * wAt(u) * 0.9 + Math.sin(u * 4) * 3 * k + (q() - 0.5) * 2.4)} ${n(yy)}`; } }
  s += form(d, BARK, { ao: 10 * k + 4, rim: 2, hi: 44, lo: 50, inner: `<path d="${ridges}" style="fill:none;stroke:${BARK_D};stroke-width:${n(1.4 + k)};stroke-linecap:round;opacity:.55"/><path d="${ridges}" style="fill:none;stroke:${mx(BARK, 'elev-peak', 60)};stroke-width:1;opacity:.3;transform:translate(-1.6px,0)"/>` });
  masses.filter((m) => m[3] >= 0).forEach(([u, v, r, t], i) => { s += leafMass(cx + u * CR, cy + v * CR, CR * r, CR * r * 0.78, 40 + i, t); });
  if (o.gall) s += gall(x + 2, gy, w0 * 1.9, P);
  return { svg: s, wound };
}
// a crown gall: a knobbly, cracked, cauliflower-like swelling round the stem collar at soil level; fresh lobes paler
function gall(x, gy, w, P) {
  const q = rnd(12), H2 = w * 0.62, lobes = [];
  for (let i = 0; i < 22; i++) { const u = (q() - 0.5) * 2, v = q(), r = w * (0.12 + q() * 0.14) * (1 - Math.abs(u) * 0.3); lobes.push([x + u * w * 0.62, gy - 4 - v * H2 * (1 - Math.abs(u) * 0.4), r, q() < 0.3]); }
  lobes.sort((a, b) => a[1] - b[1]);
  let s = `<ellipse cx="${n(x + 6)}" cy="${n(gy + 2)}" rx="${n(w * 0.82)}" ry="${n(w * 0.12)}" style="fill:${INK};opacity:.3;filter:url(#cw-blur3)"/>`;
  s += form(blobPath(x, gy - H2 * 0.45, w * 0.74, H2 * 0.6, 14, 0.12, 12), mx(GALL, INK, 82), { ao: 12, rim: 2, rimCol: BARK_D, hi: 30, lo: 50 });
  for (const [lx, ly, r, fresh] of lobes) {
    const col = fresh ? mx(GALL, 'strata-1', 55) : GALL;
    let tex = '';
    for (let j = 0; j < 4; j++) { const a = q() * 6.283, d = r * (0.3 + q() * 0.5); tex += `<circle cx="${n(lx + Math.cos(a) * d)}" cy="${n(ly + Math.sin(a) * d)}" r="${n(r * (0.12 + q() * 0.12))}" style="fill:${mx(col, INK, 70)};opacity:.35"/>`; }
    s += form(blobPath(lx, ly, r, r * 0.86, Math.round(lx + ly), 0.16, 8), col, { ao: r * 0.5, rim: 1.4, rimCol: BARK_D, hi: 48, lo: 50, inner: tex });
  }
  // cracks across the surface
  let cr = '';
  for (let i = 0; i < 7; i++) { let cx = x + (q() - 0.5) * w * 1.1, cy = gy - 6 - q() * H2 * 0.8; cr += `M${n(cx)} ${n(cy)}`; for (let j = 0; j < 3; j++) { cx += (q() - 0.5) * 14; cy += 3 + q() * 6; cr += `L${n(cx)} ${n(cy)}`; } }
  return s + `<path d="${cr}" style="fill:none;stroke:${mx(BARK_D, INK, 70)};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.75"/>`;
}
// a lens window
function lens(cx, cy, r, body, from) {
  const id = `cg-l${Math.round(cx)}${Math.round(cy)}`;
  let s = from ? `<path d="M${n(from[0])} ${n(from[1])}L${n(cx - r * 0.75)} ${n(cy - r * 0.6)}M${n(from[0])} ${n(from[1])}L${n(cx - r * 0.75)} ${n(cy + r * 0.6)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:5 5;opacity:.5"/>` : '';
  s += `<circle cx="${n(cx + 3)}" cy="${n(cy + 6)}" r="${n(r + 6)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + 6)}" style="fill:${mx('strata-5', 'strata-6', 50)}"/>`;
  return s + `<clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath><g clip-path="url(#${id})"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" style="fill:${mx('strata-1', 'elev-peak', 30)}"/>${body}</g>`;
}
// small, crowded, uneven gall cells, many caught dividing (new walls, paired nuclei, chromosomes lined up)
const gallCells = (cx, cy, r, P) => cellMass(cx, cy, r * 1.12, { cr: r * (P ? 0.085 : 0.072), seed: 9, div: 0.42, tight: true });
// three use icons
function useIcon(kind, x, y, s) {
  if (kind === 'chem') return `<path d="M${n(x - 8 * s)} ${n(y - 18 * s)}h${n(16 * s)}M${n(x - 5 * s)} ${n(y - 18 * s)}v${n(10 * s)}l${n(-11 * s)} ${n(18 * s)}q${n(-2 * s)} ${n(6 * s)} ${n(4 * s)} ${n(6 * s)}h${n(24 * s)}q${n(6 * s)} 0 ${n(4 * s)} ${n(-6 * s)}l${n(-11 * s)} ${n(-18 * s)}v${n(-10 * s)}" style="fill:${mx('series-4', 'elev-peak', 50)};stroke:${INK};stroke-width:2"/>` + leafArt(x - 4 * s, y + 4 * s, 18 * s, -40, { seed: 2, wide: 0.34 });
  if (kind === 'crop') { let g = `<path d="M${n(x)} ${n(y + 18 * s)}V${n(y - 18 * s)}" style="fill:none;stroke:${mx('gold', 'strata-3', 60)};stroke-width:2.4"/>`; for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) g += `<ellipse cx="${n(x + sx * 5 * s)}" cy="${n(y - 14 * s + i * 6 * s)}" rx="${n(4 * s)}" ry="${n(6.4 * s)}" transform="rotate(${sx * 24} ${n(x + sx * 5 * s)} ${n(y - 14 * s + i * 6 * s)})" style="fill:${T('gold')};stroke:${mx('gold', INK, 60)};stroke-width:1.2"/>`; return g; }
  return `<path d="M${n(x)} ${n(y - 18 * s)}l${n(16 * s)} ${n(6 * s)}v${n(10 * s)}q0 ${n(14 * s)} ${n(-16 * s)} ${n(22 * s)}q${n(-16 * s)} ${n(-8 * s)} ${n(-16 * s)} ${n(-22 * s)}v${n(-10 * s)}z" style="fill:${mx('good', 'elev-peak', 60)};stroke:${INK};stroke-width:2"/>` + leafArt(x - 7 * s, y + 6 * s, 16 * s, -50, { seed: 5, wide: 0.34 });
}

export class CrownGall extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 452;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Crown gall disease. A woody stem has a rounded, tumour-like swelling at its base; inside, many small cells divide rapidly and without control. It is caused by the bacterium Agrobacterium tumefaciens, drawn as plain rods. A plant cell has a wall and a membrane, so genes cannot simply be poured in; the bacterium passes a strand of its genetic material into the cell where the stem is wounded. Scientists take out the genes that cause the swelling and put a useful gene in their place, for valuable phytochemicals, improved crops and disease-resistant varieties. One cell with the useful gene is grown by tissue culture into a mass of cells, a plantlet and a whole plant in which every cell carries the new gene.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }' + BODY_CSS + ' svg .cg-pop { transform-box: fill-box; transform-origin: center; animation: cg-pop .5s var(--look-spring-soft, ease-out) var(--d, 0s) both; } @keyframes cg-pop { from { transform: scale(.5); opacity: 0; } }'; }
  stageHeight(st) { return st.portrait ? 470 : 440; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    let s = '';
    if (step === 0) {
      const gy = H * (P ? 0.62 : 0.7), x = W * (P ? 0.26 : 0.28);
      const tr = tree(x, gy, gy - (P ? 30 : 40), P, { gall: true });
      s += ground(W, H, gy) + tr.svg;
      // rods in the soil at a wound in a root: the way in
      const [wx, wy] = tr.wound, br = P ? 32 : 40, bxl = Math.max(br + 8, wx - (P ? 34 : 70)), byl = Math.min(H - br - 8, wy + (P ? 40 : 34));
      let rods = `<rect x="${n(bxl - br)}" y="${n(byl - br)}" width="${n(br * 2)}" height="${n(br * 2)}" style="fill:${mx(SOIL, 'elev-peak', 70)}"/>`;
      const rq = rnd(4);
      for (let i = 0; i < 12; i++) rods += `<ellipse cx="${n(bxl + (rq() - 0.5) * br * 2)}" cy="${n(byl + (rq() - 0.5) * br * 2)}" rx="${n(3 + rq() * 5)}" ry="${n(2 + rq() * 3)}" style="fill:${mx(SOIL, INK, 70)};opacity:.4"/>`;
      [[-0.4, -0.3, 20], [0.3, -0.4, -30], [-0.2, 0.36, 70], [0.42, 0.2, 10], [0, 0, -60]].forEach(([u, v, a]) => { rods += rod(bxl + u * br, byl + v * br, br * 0.5, a); });
      s += `<path d="M${n(wx + 3)} ${n(wy + 3)}L${n(bxl - br * 0.7)} ${n(byl - br * 0.7)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:4 4;opacity:.6"/>` + lens(bxl, byl, br, rods);
      const cx = P ? W * 0.62 : W * 0.68, cy = P ? H * 0.3 : H * 0.4, r = P ? 96 : 140;
      s += lens(cx, cy, r, gallCells(cx, cy, r, P), [x + 30, gy - 26]);
      s += tag(cx, cy - r - (P ? 10 : 14), 'inside the swelling', { size: fs, display: true });
      s += tag(cx, cy + r + (P ? 22 : 24), 'small cells dividing fast', { size: fs }) + txt(cx, cy + r + (P ? 46 : 50), 'without control', { size: fs, display: true });
      s += P ? leader(W - 118, gy + 44, x + 30, gy - 12, INK, 2, 0.8) + tag(W - 8, gy + 44, 'crown gall', { size: fs + 1, display: true, anchor: 'end' }) : tag(x + 70, gy - 78, 'crown gall', { size: fs + 1, display: true, anchor: 'start' });
      const ly = P ? H - 16 : H - 22;
      s += `<text x="${n(P ? 8 : 12)}" y="${n(Math.min(H - 10, byl + br + 22))}" style="font-family:var(--sim-font);font-size:${fs + 1}px;font-weight:800;font-style:italic;fill:${INK}">Agrobacterium tumefaciens</text>`;
    } else if (step === 1) {
      s += `<rect width="${W}" height="${H}" style="fill:${mx('elev-low', 'elev-peak', 18)}"/>`;
      // one plant cell, big: wall (thick, with fibres), membrane, cytoplasm, nucleus
      const cx = W * (P ? 0.5 : 0.5), cy = H * (P ? 0.5 : 0.52), w = P ? 270 : 330, h = P ? 220 : 250, rr = 34;
      const box = (k) => `M${n(cx - w / 2 + k + rr)} ${n(cy - h / 2 + k)}H${n(cx + w / 2 - k - rr)}Q${n(cx + w / 2 - k)} ${n(cy - h / 2 + k)} ${n(cx + w / 2 - k)} ${n(cy - h / 2 + k + rr)}V${n(cy + h / 2 - k - rr)}Q${n(cx + w / 2 - k)} ${n(cy + h / 2 - k)} ${n(cx + w / 2 - k - rr)} ${n(cy + h / 2 - k)}H${n(cx - w / 2 + k + rr)}Q${n(cx - w / 2 + k)} ${n(cy + h / 2 - k)} ${n(cx - w / 2 + k)} ${n(cy + h / 2 - k - rr)}V${n(cy - h / 2 + k + rr)}Q${n(cx - w / 2 + k)} ${n(cy - h / 2 + k)} ${n(cx - w / 2 + k + rr)} ${n(cy - h / 2 + k)}Z`;
      s += form(box(0), WALL, { ao: 8, rim: 2.4, hi: 50, inner: Array.from({ length: 30 }, (_, i) => `<path d="M${n(cx - w / 2 + i * w / 30)} ${n(cy - h / 2)}l${n(w / 30)} ${n(h)}" style="fill:none;stroke:${mx(WALL, INK, 60)};stroke-width:1;opacity:.25"/>`).join('') });
      s += form(box(12), CELL, { ao: 10, rim: 2, rimCol: mx('series-4', INK, 60), hi: 30, inner: Array.from({ length: 40 }, (_, i) => { const q = rnd(i + 3); return `<circle cx="${n(cx - w / 2 + 20 + q() * (w - 40))}" cy="${n(cy - h / 2 + 20 + q() * (h - 40))}" r="${n(1 + q() * 2)}" style="fill:${mx('gold', INK, 60)};opacity:.3"/>`; }).join('') });
      const nx = cx + w * 0.12, ny = cy + 6;
      s += `<circle cx="${n(nx)}" cy="${n(ny)}" r="${P ? 34 : 40}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 60)};stroke-width:2"/>`;
      // the wound: a break in the wall on the left; the bacterium sits there and passes in its strand
      const wx = cx - w / 2, wy = cy - 10;
      s += `<path d="M${n(wx - 4)} ${n(wy - 22)}l10 6l-6 8l10 6l-8 8l10 6l-12 10" style="fill:${mx('elev-low', 'elev-peak', 18)};stroke:${mx(WALL, INK, 60)};stroke-width:2"/>`;
      s += `<rect x="${n(wx - 6)}" y="${n(wy - 18)}" width="20" height="40" style="fill:${mx('elev-low', 'elev-peak', 18)}"/>`;
      const bx = wx - (P ? 34 : 50), by = wy + 4;
      s += rod(bx, by, P ? 52 : 70, 4, { lit: true });
      s += `<g class="cg-pop">${strand(wave(bx + 20, by, nx - 34, ny - 4, 5, 30), [DNA, DNA], 4)}</g>`;
      s += `<path d="M${n(nx - 50)} ${n(ny - 22)}l12 16l-16 4" style="fill:none;stroke:${INK};stroke-width:2.6;stroke-linejoin:round;opacity:.7"/>`;
      // outside the unbroken wall on the right: a strand that stays out
      const ox = cx + w / 2 + (P ? 8 : 22), oy = cy - h * 0.3;
      if (!P) s += strand(wave(ox + 10, oy - 30, ox + 60, oy + 30, 5, 20), [DNA], 4) + `<path d="M${n(ox - 6)} ${n(oy - 10)}l16 16m0 -16l-16 16" style="fill:none;stroke:${T('error')};stroke-width:3.4;stroke-linecap:round"/>`;
      s += tag(cx, P ? 24 : 26, 'genes cannot simply be poured in', { size: fs, display: true });
      s += tag(cx - w * 0.22, cy + h / 2 + (P ? 22 : 26), 'wall and membrane', { size: fs }) + leader(cx - w * 0.22, cy + h / 2 + 10, cx - w * 0.26, cy + h / 2 - 6, INK, 2, 0.8);
      s += tag(P ? 10 : bx - 30, P ? cy - h / 2 - 30 : by - 54, 'wound', { size: fs, anchor: 'start', display: true }) + leader(P ? 40 : bx, P ? cy - h / 2 - 16 : by - 40, wx + 2, wy - 16, INK, 2, 0.8);
      s += tag(cx + w * 0.2, cy - h / 2 - (P ? 18 : 22), 'genetic material in', { size: fs, display: true }) + leader(cx + w * 0.2, cy - h / 2 - 8, nx - 20, ny - 26, INK, 2, 0.7);
      s += txt(P ? 4 : bx, by + (P ? 36 : 46), 'bacterium', { size: fs, display: true, anchor: P ? 'start' : 'middle' });
      if (!P) s += txt(ox + 34, oy + 58, 'stays out', { size: fs, display: true });
    } else if (step === 2) {
      s += `<rect width="${W}" height="${H}" style="fill:${mx('series-7', 'elev-peak', 10)}"/>`;
      // the bacterium, large, with its ring of genetic material; the swelling segment lifts out, a useful gene goes in
      const cx = W * (P ? 0.46 : 0.4), cy = H * (P ? 0.34 : 0.42), L = P ? 280 : 400, R = P ? 76 : 104;
      s += `<g style="opacity:.5">${rod(cx, cy, L, 0, { plain: true })}</g>`;
      s += txt(cx, cy + L * 0.22 + (P ? 22 : 26), 'the bacterium and its ring of genetic material', { size: P ? 14 : fs, display: true });
      const ring = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * 6.283 - 1.2; ring.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.7]); }
      s += strand(ring.slice(0, 37), [DNA, DNA, DNA, DNA], 6);
      s += `<g class="cg-pop" style="--d:.2s">${strand(ring.slice(36), [GENE], 10)}</g>`;
      // the swelling genes, lifted out to the right and faded
      const out = ring.slice(36).map(([x, y]) => [x + R * (P ? 0.7 : 1.5), y - R * (P ? 0.9 : 0.5)]);
      s += `<g style="opacity:.55">${strand(out, [SWELL], 7)}</g><path d="M${n(out[0][0] + 12)} ${n(out[0][1] + 18)}l${n(R * 0.5)} ${n(-R * 0.1)}" style="fill:none;stroke:${INK};stroke-width:2.4;stroke-dasharray:5 4"/>`;
      s += tag(P ? W - 8 : out[6][0] + 20, P ? out[0][1] - 28 : out[6][1] - 10, 'swelling genes out', { size: fs, rim: SWELL, anchor: P ? 'end' : 'start' });
      s += tag(ring[42][0] - (P ? 30 : 60), ring[42][1] - (P ? 26 : 30), 'useful gene in', { size: fs, display: true, rim: T('good') });
      // three uses
      const uy = P ? H * 0.74 : H * 0.8, ux = P ? [W * 0.18, W * 0.5, W * 0.82] : [W * 0.2, W * 0.5, W * 0.8];
      [['chem', 'phytochemicals'], ['crop', 'improved crops'], ['shield', P ? 'disease-resistant' : 'disease-resistant varieties']].forEach(([k, t], i) => {
        s += `<g class="cg-pop" style="--d:${n(0.1 + i * 0.1)}s"><circle cx="${n(ux[i])}" cy="${n(uy - 6)}" r="${P ? 28 : 32}" style="fill:${T('bg-surface')};stroke:${T('stroke')};stroke-width:2.4"/>${useIcon(k, ux[i], uy - 6, P ? 1 : 1.15)}</g>`;
        s += txt(ux[i], uy + (P ? 44 : 50), t, { size: fs, display: true });
        if (P && i === 2) s += txt(ux[i], uy + 62, 'varieties', { size: fs, display: true });
      });
    } else {
      s += ground(W, H, H * (P ? 0.86 : 0.84));
      const gy = H * (P ? 0.86 : 0.84), mark = GENE;
      const xs = P ? [W * 0.14, W * 0.38, W * 0.62, W * 0.86] : [W * 0.11, W * 0.31, W * 0.52, W * 0.8];
      const yc = P ? H * 0.5 : H * 0.52;
      s += `<g class="cg-pop">${cell(xs[0], yc, P ? 22 : 30, { seed: 3, mark, lit: true })}</g>`;
      s += `<g class="cg-pop" style="--d:.1s">${cellMass(xs[1], yc, P ? 30 : 42, { cr: P ? 5.4 : 7, seed: 6, mark })}</g>`;
      s += `<g class="cg-pop" style="--d:.2s">${testTube(xs[2], gy, P ? 150 : 190, { agar: 0.4, above: plantlet(xs[2], gy - (P ? 150 : 190) * 0.4 + 6, P ? 54 : 70, { seed: 3 }) })}</g>`;
      s += `<g class="cg-pop" style="--d:.3s">${tree(xs[3], gy, P ? 150 : 230, P).svg}</g>`;
      for (let i = 0; i < 3; i++) s += `<path d="M${n(xs[i] + (P ? 26 : 40))} ${n(yc)}l${n(xs[i + 1] - xs[i] - (P ? 52 : 80))} 0" style="fill:none;stroke:${INK};stroke-width:3;stroke-linecap:round"/><path d="M${n(xs[i + 1] - (P ? 34 : 46))} ${n(yc - 7)}l8 7l-8 7" style="fill:none;stroke:${INK};stroke-width:3;stroke-linecap:round;stroke-linejoin:round"/>`;
      // a lens on the grown plant: its cells all carry the mark
      const lx = P ? W * 0.76 : W * 0.86, ly = P ? H * 0.2 : H * 0.2, lr = P ? 40 : 52;
      let body = '';
      for (let i = 0; i < 7; i++) { const a = i * 0.9, rr = i ? lr * 0.55 : 0; body += cell(lx + Math.cos(a) * rr, ly + Math.sin(a) * rr, lr * 0.3, { seed: i + 30, mark, col: mx('elev-low', 'elev-peak', 70) }); }
      s += lens(lx, ly, lr, body, [xs[3], gy - (P ? 110 : 170)]);
      const ty = P ? H * 0.5 + 60 : yc + 64;
      (P ? ['one cell', 'mass', 'plantlet', 'whole plant'] : ['one changed cell', 'mass of cells', 'plantlet', 'whole plant']).forEach((t, i) => { if (i < 3) s += txt(xs[i], i === 2 ? (P ? H - 4 : H - 8) : ty, t, { size: fs, display: true }); });
      s += tag(P ? W / 2 : W * 0.5, P ? 20 : 26, 'every cell carries the new gene', { size: fs, display: true, rim: T('good') });
      s += txt(lx, ly + lr + (P ? 22 : 24), 'every cell', { size: 14, display: true });
    }
    return { svg: frame(st, 'cg', `<defs>${artDefs()}${cwDefs()}${taDefs()}</defs>${s}`, { back: '' }) };
  }
}
