// TranspirationPull - blk-l06-s5. One plant cut open along its length: a leaf in section at the top (upper skin,
// palisade, spongy cells, air spaces, lower skin with stomata), the stem with a window onto one xylem vessel, the root
// in damp soil. Beat 0 (evaporate): water vapour leaves through the open stomata. Beat 1 (column): one unbroken chain
// of water particles from root to leaf, each linked to the next. Beat 2 (pull): each particle that leaves pulls the
// whole column up one step. Control in the scene (beat 2): Stomata open / Stomata closed; closed stops the pull.
// The column only ever moves up. Motion ends by itself; the resting picture is the end state.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP, label, svgPlantColour as pc } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd, blobPath } from '../shared/CellWorld.js';
import { taDefs, XYL, XYL_D, LEAF, LEAF_D, LEAF_L } from '../shared/TissueArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
const WAT = T('series-1'), WAT_D = mx('series-1', 'strata-6', 56);
const STEPS = 6, STEP_S = 0.9;

const CSS = `
svg .tp-step { animation: tp-step ${STEP_S}s cubic-bezier(.5,0,.4,1) ${STEPS} both; }
@keyframes tp-step { from { offset-distance: var(--a); } to { offset-distance: var(--b); } }
svg .tp-out { offset-rotate: 0deg; offset-distance: 100%; opacity: 0; animation: tp-out ${STEP_S}s ease-in var(--d, 0s) var(--n, ${STEPS}) backwards; }
@keyframes tp-out { 0% { offset-distance: 0%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
@media (prefers-reduced-motion: reduce) { svg .tp-step, svg .tp-out { animation: none; } }
`;

// Points of the water path: up the root and stem, out along the petiole at the node, then along the leaf's midrib.
function pathPts(L) { return [[L.sx, L.ry], [L.sx, L.ny + 10], [L.sx + 8, L.ny - 6], [L.lx0 - 2, L.vy + 10], [L.lx0 + 18, L.vy], [L.vx, L.vy]]; }
function polyLen(p) { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
const polyD = (p) => p.map((q, i) => `${i ? 'L' : 'M'}${n1(q[0])} ${n1(q[1])}`).join('');

function layout(W, H, P) {
  return P
    ? { lx0: 112, lx1: W - 8, ly0: 16, ly1: 150, sx: 62, ny: 200, top: 70, vy: 84, vx: W - 64, ry: H - 52, gy: H - 112, sw: 50 }
    : { lx0: 262, lx1: W - 12, ly0: 18, ly1: 164, sx: 196, ny: 218, top: 58, vy: 92, vx: W - 110, ry: H - 44, gy: H - 104, sw: 62 };
}
const STEM = mx('elev-low', 'chloro', 42), STEM_D = mx(STEM, INK, 56), STEM_L = mx(STEM, W_, 56), CUT = mx('elev-low', 'elev-peak', 34), CUT_D = mx('elev-low', INK, 46);
const EP = mx('sea-shallow', 'elev-peak', 40), EP_D = mx(LEAF_D, 'elev-peak', 30);
let CID = 0;
const grainIn = (d, x, y, w, h, a = 0.16) => { const id = `tp-g${++CID}`; return `<clipPath id="${id}"><path d="${d}"/></clipPath><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" clip-path="url(#${id})" style="fill:${INK};opacity:${a};filter:url(#cw-grain)"/>`; };
const lensC = (x, y, a, k = 1) => `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(3.4 * k)}" ry="${n1(2 * k)}" transform="rotate(${n1(a)} ${n1(x)} ${n1(y)})" style="fill:url(#cw-chl) ${T('chloro')};stroke:${mx('chloro', INK, 46)};stroke-width:.6"/>`;

// The xylem vessel along a polyline: lignified side walls, a pale hollow, rings of thickening across it.
function vesselAlong(pts, vw, op = 1) {
  const d = polyD(pts), len = polyLen(pts);
  let s = `<g style="opacity:${op}"><path d="${d}" style="fill:none;stroke:${XYL_D};stroke-width:${vw + 6};stroke-linejoin:round"/><path d="${d}" style="fill:none;stroke:${XYL};stroke-width:${vw + 2.4};stroke-linejoin:round"/><path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'elev-peak', 44)};stroke-width:${vw - 1.6};stroke-linejoin:round"/>`;
  for (let u = 8; u < len - 4; u += 11) { const [x, y, ang] = at(pts, u), c = Math.cos(ang), sn = Math.sin(ang), h = vw * 0.5; s += `<path d="M${n1(x - sn * h)} ${n1(y + c * h)}Q${n1(x + c * 3)} ${n1(y + sn * 3)} ${n1(x + sn * h)} ${n1(y - c * h)}" style="fill:none;stroke:${XYL_D};stroke-width:2.6;opacity:.55"/><path d="M${n1(x - sn * h)} ${n1(y + c * h)}Q${n1(x + c * 3)} ${n1(y + sn * 3)} ${n1(x + sn * h)} ${n1(y - c * h)}" style="fill:none;stroke:${mx(XYL, W_, 50)};stroke-width:1;opacity:.7;transform:translate(-.6px,-.6px)"/>`; }
  return s + '</g>';
}

// The leaf blade in section, joined to the petiole at its base: cuticle, upper skin, palisade, spongy cells with air
// spaces, a midrib bundle, lower skin with stomata (guard cells either side of each pore).
function leafSection(L, open, lit) {
  const r = rnd(4), { lx0, lx1, ly0, ly1, vy } = L, w = lx1 - lx0;
  const bl = `M${n1(lx0)} ${n1(vy - 26)}C${n1(lx0 + 40)} ${n1(ly0 + 2)} ${n1(lx0 + w * 0.3)} ${n1(ly0)} ${n1(lx0 + w * 0.56)} ${n1(ly0)}S${n1(lx1 - 18)} ${n1(ly0 + 22)} ${n1(lx1)} ${n1(vy + 4)}C${n1(lx1 - 16)} ${n1(ly1 - 10)} ${n1(lx1 - 70)} ${n1(ly1)} ${n1(lx0 + w * 0.56)} ${n1(ly1)}S${n1(lx0 + 40)} ${n1(ly1 - 2)} ${n1(lx0)} ${n1(vy + 26)}Z`;
  let s = `<path d="${bl}" transform="translate(4 9)" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><path d="${bl}" style="fill:${mx('sea-shallow', 'elev-peak', 24)}"/>`;
  s += `<clipPath id="tp-lc"><path d="${bl}"/></clipPath><g clip-path="url(#tp-lc)">`;
  // upper skin
  for (let x = lx0 - 6; x < lx1; x += 26) s += `<rect x="${n1(x)}" y="${n1(ly0 + 3)}" width="24" height="13" rx="4" style="fill:${EP};stroke:${EP_D};stroke-width:1.4"/><rect x="${n1(x + 3)}" y="${n1(ly0 + 5)}" width="18" height="3" rx="1.5" style="fill:${W_};opacity:.55"/>`;
  // palisade: tall packed columns, chloroplasts along their walls
  const pt = ly0 + 17, pb = vy - 18;
  for (let x = lx0 + 1; x < lx1 - 2; x += 14) {
    const b = pb - r() * 8, d = `M${n1(x + 1)} ${n1(pt + 5)}Q${n1(x + 1)} ${n1(pt)} ${n1(x + 6.5)} ${n1(pt)}Q${n1(x + 12)} ${n1(pt)} ${n1(x + 12)} ${n1(pt + 5)}V${n1(b - 6)}Q${n1(x + 12)} ${n1(b)} ${n1(x + 6.5)} ${n1(b)}Q${n1(x + 1)} ${n1(b)} ${n1(x + 1)} ${n1(b - 6)}Z`;
    s += `<path d="${d}" style="fill:url(#tp-gc) ${LEAF_L};stroke:${LEAF_D};stroke-width:1.3"/>`;
    for (let y = pt + 6; y < b - 4; y += 6) s += lensC(x + (y % 12 < 6 ? 3.6 : 9.4), y, 90, 0.8);
  }
  // spongy cells, loosely packed: the gaps are air spaces
  const st = stomaXs(L);
  for (let j = 0; j < 3; j++) for (let x = lx0 + 8 + j * 11; x < lx1 - 4; x += 24) {
    const y = vy + 8 + j * 16 + (r() - 0.5) * 8, rx = 9 + r() * 2.6, ry = 7 + r() * 2;
    if (j === 2 && st.some((q) => Math.abs(x - q) < 18)) continue;
    if (Math.abs(y - vy) < 14 && x < L.vx + 20) continue;
    const d = blobPath(x, y, rx, ry, 3 + j + Math.round(x), 0.14, 7);
    s += `<path d="${d}" style="fill:url(#tp-gc) ${LEAF_L};stroke:${LEAF_D};stroke-width:1.3"/>`;
    for (let k = 0; k < 4; k++) { const t = (k + r() * 0.5) / 4 * 6.283; s += lensC(x + Math.cos(t) * rx * 0.62, y + Math.sin(t) * ry * 0.56, t * 57.3 + 90, 0.7); }
  }
  // the midrib bundle round the vessel: a sheath of small pale cells
  for (let x = lx0 + 4; x < L.vx + 14; x += 13) for (const sy of [-1, 1]) s += `<ellipse cx="${n1(x)}" cy="${n1(vy + sy * 13.5)}" rx="6.4" ry="4.4" style="fill:${mx('elev-low', 'elev-peak', 56)};stroke:${mx('elev-low', INK, 50)};stroke-width:1"/>`;
  // lower skin, broken at each stoma
  for (let x = lx0 - 6; x < lx1; x += 26) { if (st.some((q) => Math.abs(x + 12 - q) < 22)) continue; s += `<rect x="${n1(x)}" y="${n1(ly1 - 15)}" width="24" height="12" rx="4" style="fill:${EP};stroke:${EP_D};stroke-width:1.4"/>`; }
  s += '</g>';
  // the blade's skin edge all round, the cuticle on top
  s += `<path d="${bl}" style="fill:none;stroke:${LEAF_D};stroke-width:2.6"/><path d="M${n1(lx0 + 16)} ${n1(vy - 34)}C${n1(lx0 + 50)} ${n1(ly0 + 2)} ${n1(lx0 + w * 0.3)} ${n1(ly0 - 1)} ${n1(lx0 + w * 0.56)} ${n1(ly0 - 1)}" style="fill:none;stroke:${mx('gold', 'strata-2', 50)};stroke-width:3;opacity:.8"/>`;
  // guard cells either side of each pore, thick lips facing it; a dark substomatal space above
  for (const q of st) {
    const pw = open ? 4.5 : 0.6, gy = ly1 - 8;
    s += `<ellipse cx="${n1(q)}" cy="${n1(gy - 16)}" rx="16" ry="9" style="fill:${mx('sea-shallow', 'elev-peak', 14)}"/>`;
    for (const sx of [-1, 1]) {
      const gx = q + sx * (pw + 8.5), rx = open ? 9 : 8, ry = open ? 8 : 7;
      s += `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="${rx}" ry="${ry}" style="fill:url(#tp-gc) ${LEAF};stroke:${LEAF_D};stroke-width:${lit ? 2.2 : 1.6}"/><path d="M${n1(gx - sx * rx * 0.8)} ${n1(gy - ry * 0.6)}Q${n1(gx - sx * rx * 1.08)} ${n1(gy)} ${n1(gx - sx * rx * 0.8)} ${n1(gy + ry * 0.6)}" style="fill:none;stroke:${EP_D};stroke-width:3.2;stroke-linecap:round"/>${lensC(gx + sx * 2, gy - 2.6, 20)}${lensC(gx + sx * 3, gy + 3, -20)}`;
    }
  }
  return s;
}
const stomaXs = (L) => { const w = L.lx1 - L.lx0; return [L.lx0 + w * 0.46, L.lx0 + w * 0.76]; };

// The stem: a tapering green cylinder (light left, shade right) with a node where the petiole leaves, a bud on top.
// A long window is cut out of it from the node down to the soil, showing pale cortex cells round the vessel.
function stem(L) {
  const { sx, sw, gy, ny, top } = L, hb = sw / 2 + 10, ht = sw / 2 - 10, hw = (y) => ht + (hb - ht) * (y - top) / (gy - top);
  const sd = `M${n1(sx - ht + 3)} ${n1(top)}C${n1(sx - ht)} ${n1(top + 40)} ${n1(sx - hw(ny) + 2)} ${n1(ny - 20)} ${n1(sx - hw(ny) - 2)} ${n1(ny)}C${n1(sx - hw(ny) + 1)} ${n1(ny + 20)} ${n1(sx - hb + 2)} ${n1(gy - 40)} ${n1(sx - hb)} ${n1(gy + 6)}H${n1(sx + hb)}C${n1(sx + hb - 2)} ${n1(gy - 40)} ${n1(sx + hw(ny) - 1)} ${n1(ny + 20)} ${n1(sx + hw(ny) + 2)} ${n1(ny)}C${n1(sx + hw(ny) - 2)} ${n1(ny - 20)} ${n1(sx + ht)} ${n1(top + 40)} ${n1(sx + ht - 3)} ${n1(top)}Z`;
  let s = `<linearGradient id="tp-stem" x1="0" x2="1"><stop offset="0" style="stop-color:${STEM_L}"/><stop offset=".35" style="stop-color:${STEM}"/><stop offset="1" style="stop-color:${STEM_D}"/></linearGradient>`;
  s += `<path d="${sd}" transform="translate(5 4)" style="fill:${INK};opacity:.16;filter:url(#cw-blur3)"/><path d="${sd}" style="fill:url(#tp-stem) ${STEM};stroke:${STEM_D};stroke-width:2.4"/>${grainIn(sd, sx - hb, top, 2 * hb, gy - top, 0.14)}`;
  // fine lengthwise ridges, the node ring, a terminal bud with two scale leaves
  for (const k of [-0.6, -0.2, 0.3, 0.7]) s += `<path d="M${n1(sx + k * ht)} ${n1(top + 8)}L${n1(sx + k * hb * 0.96)} ${n1(gy)}" style="fill:none;stroke:${STEM_D};stroke-width:1;opacity:.35"/>`;
  s += `<path d="M${n1(sx - hw(ny) - 2)} ${n1(ny)}Q${n1(sx)} ${n1(ny + 8)} ${n1(sx + hw(ny) + 2)} ${n1(ny)}" style="fill:none;stroke:${STEM_D};stroke-width:3"/><path d="M${n1(sx - hw(ny))} ${n1(ny - 3)}Q${n1(sx)} ${n1(ny + 5)} ${n1(sx + hw(ny))} ${n1(ny - 3)}" style="fill:none;stroke:${STEM_L};stroke-width:1.6;opacity:.8"/>`;
  const bud = `M${n1(sx - ht + 2)} ${n1(top + 2)}C${n1(sx - ht + 2)} ${n1(top - 22)} ${n1(sx - 6)} ${n1(top - 40)} ${n1(sx)} ${n1(top - 46)}C${n1(sx + 6)} ${n1(top - 40)} ${n1(sx + ht - 2)} ${n1(top - 22)} ${n1(sx + ht - 2)} ${n1(top + 2)}Z`;
  const scale = (sg) => `M${n1(sx + sg * (ht - 3))} ${n1(top + 4)}Q${n1(sx + sg * (ht + 14))} ${n1(top - 18)} ${n1(sx + sg * 10)} ${n1(top - 36)}Q${n1(sx + sg * (ht - 2))} ${n1(top - 14)} ${n1(sx + sg * 4)} ${n1(top + 2)}Z`;
  s += `<path d="${bud}" style="fill:url(#tp-stem) ${STEM};stroke:${STEM_D};stroke-width:2"/><path d="M${n1(sx - 4)} ${n1(top - 4)}Q${n1(sx - 3)} ${n1(top - 28)} ${n1(sx)} ${n1(top - 40)}" style="fill:none;stroke:${STEM_L};stroke-width:2;opacity:.7"/>`;
  for (const sg of [-1, 1]) s += `<path d="${scale(sg)}" style="fill:url(#tp-gc) ${LEAF};stroke:${LEAF_D};stroke-width:1.6"/>`;
  // the cut window, its cut face lighter, cortex cells either side of the vessel
  const wy0 = ny + 14, wy1 = gy - 6, wx = (y) => hw(y) - 9;
  const wd = `M${n1(sx - wx(wy0))} ${n1(wy0 + 8)}Q${n1(sx - wx(wy0))} ${n1(wy0)} ${n1(sx)} ${n1(wy0)}Q${n1(sx + wx(wy0))} ${n1(wy0)} ${n1(sx + wx(wy0))} ${n1(wy0 + 8)}L${n1(sx + wx(wy1))} ${n1(wy1)}H${n1(sx - wx(wy1))}Z`;
  s += `<path d="${wd}" style="fill:${CUT};stroke:${CUT_D};stroke-width:2.2"/><path d="${wd}" style="fill:none;stroke:${W_};stroke-width:1.4;opacity:.6;transform:translate(1.2px,1.2px)"/>`;
  const r = rnd(12);
  for (let y = wy0 + 6; y < wy1 - 12; y += 14) for (const sg of [-1, 1]) for (let c = 0; c < 2; c++) {
    const half = wx(y) - 3, x0 = sg < 0 ? sx - half + c * ((half - 15) / 2) : sx + 15 + c * ((half - 15) / 2), cw = (half - 15) / 2 - 1.5, ch = 12 + r() * 2;
    if (cw < 4) continue;
    const d = `M${n1(x0 + 3)} ${n1(y)}H${n1(x0 + cw - 3)}Q${n1(x0 + cw)} ${n1(y)} ${n1(x0 + cw)} ${n1(y + 3)}V${n1(y + ch - 3)}Q${n1(x0 + cw)} ${n1(y + ch)} ${n1(x0 + cw - 3)} ${n1(y + ch)}H${n1(x0 + 3)}Q${n1(x0)} ${n1(y + ch)} ${n1(x0)} ${n1(y + ch - 3)}V${n1(y + 3)}Q${n1(x0)} ${n1(y)} ${n1(x0 + 3)} ${n1(y)}Z`;
    s += `<path d="${d}" style="fill:${mx('elev-low', 'elev-peak', 60)};stroke:${mx('elev-low', INK, 52)};stroke-width:1.2"/><circle cx="${n1(x0 + cw * 0.6)}" cy="${n1(y + ch * 0.55)}" r="1.8" style="fill:${mx('series-5', 'elev-peak', 50)}"/>`;
  }
  return s;
}

// The petiole: a tapering stalk from the node up to the blade's base, cut open along its middle for the vessel.
function petiole(L) {
  const a = [L.sx + 6, L.ny - 4], b = [L.lx0 + 4, L.vy], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy), nx = -dy / ln, ny2 = dx / ln, w0 = 21, w1 = 15;
  const P = (p, w, sg) => `${n1(p[0] + nx * w * sg)} ${n1(p[1] + ny2 * w * sg)}`;
  const d = `M${P(a, w0, 1)}Q${n1((a[0] + b[0]) / 2 + nx * 18)} ${n1((a[1] + b[1]) / 2 + ny2 * 18)} ${P(b, w1, 1)}L${P(b, w1, -1)}Q${n1((a[0] + b[0]) / 2 - nx * 4)} ${n1((a[1] + b[1]) / 2 - ny2 * 4)} ${P(a, w0, -1)}Z`;
  return `<path d="${d}" style="fill:url(#tp-stem) ${STEM};stroke:${STEM_D};stroke-width:2.2"/><path d="M${P(a, w0 - 5, 1)}Q${n1((a[0] + b[0]) / 2 + nx * 13)} ${n1((a[1] + b[1]) / 2 + ny2 * 13)} ${P(b, w1 - 4, 1)}" style="fill:none;stroke:${STEM_L};stroke-width:2;opacity:.7"/>`;
}

function soil(W, H, L) {
  const { gy, sx, ry } = L, r = rnd(8), SO = pc('soil');
  let s = `<rect x="0" y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:url(#pa-soil) ${SO}"/><rect x="0" y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:${INK};opacity:.2;filter:url(#pa-grain)"/>`;
  s += `<path d="M0 ${n1(gy)}Q${n1(W * 0.25)} ${n1(gy - 5)} ${n1(W * 0.5)} ${n1(gy - 1)}T${W} ${n1(gy - 3)}V${n1(gy + 5)}H0Z" style="fill:${mx(SO, INK, 70)}"/>`;
  // crumbs and small stones, lit from the top left
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = gy + 8 + r() * (H - gy - 10), rr = 2.4 + r() * 5, d = blobPath(x, y, rr * 1.3, rr, i + 3, 0.22, 6), stone = i % 7 === 0;
    s += `<path d="${d}" style="fill:${stone ? mx('strata-3', 'elev-peak', 60) : mx(SO, i % 2 ? 'elev-peak' : INK, 74)};stroke:${mx(SO, INK, 50)};stroke-width:.8"/><ellipse cx="${n1(x - rr * 0.3)}" cy="${n1(y - rr * 0.4)}" rx="${n1(rr * 0.5)}" ry="${n1(rr * 0.24)}" style="fill:${W_};opacity:.35"/>`;
  }
  // films of water between the crumbs
  for (let k = 0; k < 16; k++) s += `<ellipse cx="${n1(sx + (r() - 0.5) * W * 0.6)}" cy="${n1(gy + 14 + r() * (H - gy - 20))}" rx="${n1(3 + r() * 3)}" ry="${n1(1.8 + r() * 1.4)}" style="fill:url(#cw-wat) ${T('series-1')};opacity:.75"/>`;
  // the root: tapering laterals with fine root hairs behind their tips
  const rt = mx('strata-1', 'elev-peak', 80), rtD = mx('strata-2', INK, 40), rtL = mx('strata-1', 'elev-peak', 30);
  const hairs = (pts, sg, n, len) => { let h = ''; for (let i = 0; i < n; i++) { const t = 0.35 + 0.5 * i / n, [x, y, ang] = at(pts, polyLen(pts) * t), c = Math.cos(ang), sn = Math.sin(ang), side = i % 2 ? 1 : -1, l = len * (0.6 + 0.4 * Math.sin(i * 2.1) ** 2); h += `<path d="M${n1(x)} ${n1(y)}q${n1(-sn * side * l * 0.5 + c * 2)} ${n1(c * side * l * 0.5 + sn * 2)} ${n1(-sn * side * l)} ${n1(c * side * l)}" style="fill:none;stroke:${rtL};stroke-width:1.3;stroke-linecap:round;opacity:.95"/>`; } return h; };
  const lat = [[-1, 0.12, 1], [1, 0.22, 0.92], [-1, 0.42, 0.78], [1, 0.52, 0.7], [-1, 0.7, 0.5], [1, 0.78, 0.44]];
  for (const [sg, u, k] of lat) {
    const y = gy + (ry - gy) * u, ex = sx + sg * W * 0.2 * k, ey = y + 46 * k, w0 = 11 * k + 3;
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([sx + sg * 8 + (ex - sx - sg * 8) * t, y + (ey - y) * t * t + Math.sin(t * 3) * 4]); }
    let d = `M${n1(pts[0][0])} ${n1(pts[0][1] - w0 / 2)}`; for (let i = 1; i <= 8; i++) d += `L${n1(pts[i][0])} ${n1(pts[i][1] - w0 / 2 * (1 - i / 9))}`; d += `Q${n1(ex + sg * 4)} ${n1(ey + 1)} ${n1(pts[8][0])} ${n1(pts[8][1] + 1)}`; for (let i = 7; i >= 0; i--) d += `L${n1(pts[i][0])} ${n1(pts[i][1] + w0 / 2 * (1 - i / 9))}`;
    s += hairs(pts, sg, 12, 9 * k + 3) + `<path d="${d}Z" style="fill:${rt};stroke:${rtD};stroke-width:1.4;stroke-linejoin:round"/><path d="M${n1(pts[1][0])} ${n1(pts[1][1] - w0 * 0.2)}L${n1(pts[6][0])} ${n1(pts[6][1] - w0 * 0.1)}" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.5"/>`;
  }
  // the main root, tapering to a capped tip; hairs behind the tip
  const rw = L.sw / 2 - 6, tip = H - 8, rd = `M${n1(sx - rw)} ${n1(gy)}C${n1(sx - rw)} ${n1(gy + 50)} ${n1(sx - rw * 0.4)} ${n1(tip - 40)} ${n1(sx - 4)} ${n1(tip - 6)}Q${n1(sx)} ${n1(tip + 2)} ${n1(sx + 4)} ${n1(tip - 6)}C${n1(sx + rw * 0.4)} ${n1(tip - 40)} ${n1(sx + rw)} ${n1(gy + 50)} ${n1(sx + rw)} ${n1(gy)}Z`;
  s += hairs([[sx, ry - 30], [sx, tip - 10]], 1, 14, 12);
  s += `<path d="${rd}" style="fill:${rt};stroke:${rtD};stroke-width:2"/><path d="M${n1(sx - 10)} ${n1(gy + 6)}C${n1(sx - 10)} ${n1(gy + 50)} ${n1(sx - 6)} ${n1(tip - 40)} ${n1(sx - 3)} ${n1(tip - 14)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.5"/>`;
  // the root cut open down its middle: the darker central cylinder holds the vessel
  s += `<path d="M${n1(sx - 8.5)} ${n1(gy - 2)}V${n1(ry)}Q${n1(sx)} ${n1(ry + 12)} ${n1(sx + 8.5)} ${n1(ry)}V${n1(gy - 2)}Z" style="fill:${mx('gold', 'strata-2', 60)};stroke:${rtD};stroke-width:1.4;opacity:.85"/>`;
  s += `<path d="M${n1(sx - 4)} ${n1(tip - 12)}Q${n1(sx)} ${n1(tip - 2)} ${n1(sx + 4)} ${n1(tip - 12)}" style="fill:none;stroke:${mx(rt, INK, 60)};stroke-width:2.4;opacity:.6"/>`;
  return s;
}

export class TranspirationPull extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 490;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 506;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A plant cut open along its length: a leaf in section at the top with stomata in its lower skin, the stem with a window onto one xylem vessel, and the root in damp soil. Water vapour leaves through the open stomata. In the xylem one unbroken chain of water particles runs from the root to the leaf. Each particle that leaves the leaf pulls the whole chain up one step. Closing the stomata stops the pull.';
  static CONTROLS = [];

  open = true;

  async setup() {
    await super.setup();
    bindFlow(this.root, { action: (a, v) => { if (a === 'stoma' && this.stepIndex === 2) { this.open = v === 'open'; this.repaint(); } } });
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 50px; }' + CSS; }
  stageHeight(st) { return st.portrait ? 436 : 410; }
  enter() { this.open = true; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, L = layout(W, H, P), fs = P ? 15 : 16;
    const flows = step === 2 ? this.open : step === 0;
    CID = 0;
    let s = `<defs>${taDefs()}<radialGradient id="tp-gc" cx=".34" cy=".28" r=".85"><stop offset="0" style="stop-color:${LEAF_L}"/><stop offset=".6" style="stop-color:${LEAF}"/><stop offset="1" style="stop-color:${LEAF_D}"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:${mx('sea-shallow', 'elev-peak', 30)}"/><circle cx="${n1(W * 0.75)}" cy="${n1(H * 0.45)}" r="${n1(W * 0.4)}" style="fill:${W_};opacity:.35;filter:url(#pa-softer)"/>`;
    s += soil(W, H, L) + stem(L) + petiole(L);
    s += leafSection(L, step !== 2 || this.open, step !== 1);
    // the xylem vessel: up the root and stem, through the petiole, along the midrib
    const pts = pathPts(L), len = polyLen(pts), d = polyD(pts), vw = P ? 16 : 18, colOp = step === 0 ? 0.5 : 1;
    s += vesselAlong(pts, vw, colOp) + `<g style="opacity:${colOp}">`;
    // the water chain: beads linked to their neighbours
    const sp = 18, nB = Math.floor(len / sp), br = P ? 6.2 : 6.8, move = step === 2 && this.open;
    const link = `<path d="M0 0H${-sp}" style="fill:none;stroke:${WAT_D};stroke-width:2.6;opacity:${step >= 1 ? 0.9 : 0.4}"/>`;
    for (let k = 0; k < nB; k++) {
      const a = k * sp, bead = `${k ? link : ''}<circle r="${br}" style="fill:url(#cw-wat) ${WAT};stroke:${WAT_D};stroke-width:1.6"/><circle cx="-1.8" cy="-2" r="1.8" style="fill:${W_};opacity:.8"/>`;
      s += `<g class="${move ? 'tp-step' : ''}" style="offset-path:path('${d}');offset-rotate:auto;offset-distance:${a}px;--a:${a}px;--b:${a + sp}px">${bead}</g>`;
    }
    s += `</g>`;
    // vapour leaving the stomata (beat 0: from the wet cells; beat 2: one particle per step)
    if (flows) {
      for (const [i, q] of stomaXs(L).entries()) {
        const dd = `M${n1(q - 14)} ${n1(L.ly0 + 84)}Q${n1(q)} ${n1(L.ly1 - 30)} ${n1(q)} ${n1(L.ly1 - 8)}T${n1(q + 10)} ${n1(L.ly1 + 46)}`;
        for (let k = 0; k < 3; k++) s += `<ellipse cx="${n1(q + 4 + k * 7)}" cy="${n1(L.ly1 + 12 + k * 13)}" rx="${10 + k * 5}" ry="${6 + k * 2}" style="fill:${mx('series-1', 'elev-peak', 30)};opacity:${n1(0.55 - k * 0.12)};filter:url(#cw-blur3)"/>`;
        s += `<g class="tp-out" style="offset-path:path('${dd}');--d:${i * STEP_S / 2}s;--n:${step === 0 ? 4 : STEPS}"><circle r="6" style="fill:url(#cw-wat) ${WAT};stroke:${WAT_D};stroke-width:1.4;opacity:.8"/></g>`;
      }
    }
    // labels
    const lab = (x, y, t, o = {}) => label(x, y, t, { size: fs, ...o });
    const out = [];
    if (step === 0) {
      const q = stomaXs(L)[0];
      out.push(lab(q, L.ly1 + 64, 'water vapour out', { display: true, size: fs + 1 }), lab(q + 20, L.ly1 + 24, 'open stomata', {}));
      out.push(lab(P ? W * 0.62 : W * 0.66, L.gy - 40, 'Transpiration', { display: true, size: fs + 6 }));
    } else if (step === 1) {
      out.push(lab(L.sx + (P ? 30 : 40), (L.ly1 + L.gy) / 2 - 20, 'xylem', { display: true, size: fs + 4, anchor: 'start' }), lab(L.sx + (P ? 30 : 40), (L.ly1 + L.gy) / 2 + 6, 'one unbroken column', { anchor: 'start' }));
      out.push(lab(L.sx + (P ? 30 : 40), (L.ly1 + L.gy) / 2 + 30, 'particles hold on', { anchor: 'start' }));
      out.push(lab(L.sx + 26, L.gy + 30, 'root', { anchor: 'start' }), lab(L.vx - 30, L.ly0 - 0 + 12, '', {}));
    } else {
      const cx = L.sx + (P ? 30 : 46), cy = (L.ly1 + L.gy) / 2;
      if (this.open) {
        for (let i = 0; i < 3; i++) s += `<path d="M${n1(L.sx - L.sw / 2 - 26)} ${n1(cy + 40 - i * 34)}l9 -12l9 12" style="fill:none;stroke:${WAT_D};stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`;
        out.push(lab(cx, cy - 10, 'pulled up', { display: true, size: fs + 4, anchor: 'start' }), lab(cx, cy + 16, 'one step for each', { anchor: 'start' }), lab(cx, cy + 36, 'particle that leaves', { anchor: 'start' }));
      } else {
        out.push(lab(cx, cy - 10, 'stomata closed', { display: true, size: fs + 4, anchor: 'start' }), lab(cx, cy + 16, 'nothing leaves,', { anchor: 'start' }), lab(cx, cy + 36, 'so no pull', { anchor: 'start' }));
      }
    }
    s += out.join('');
    const head = step === 2 ? flowChoiceHtml({ action: 'stoma', label: 'Stomata', value: this.open ? 'open' : 'shut', options: [{ value: 'open', label: 'Stomata open' }, { value: 'shut', label: 'Stomata closed' }] }) : '';
    return { svg: cwFrame(st, 'tp', s), head };
  }
}

function at(p, u) {
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (u <= l) { const k = u / l; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k, Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0])]; }
    u -= l;
  }
  const q = p[p.length - 1]; return [q[0], q[1], 0];
}
