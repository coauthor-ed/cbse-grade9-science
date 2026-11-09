// BodyKit.js - local helpers for the animal lessons L06 and L07: colours, a sea or soil setting, labels with a
// leader, stream dots on a path, and the sponge drawn whole or cut open. Not a scene. Tokens only. Text is drawn at
// real size, so portrait scenes lay out for st.W and never scale down.
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc, LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { svgBioColour, svgBio, BOX } from '../shared/BioArt.js';
import { seaLabel, words, frame, ctlBar, anim } from '../shared/SeaBits.js';

export { svgBio, BOX, svgBioColour };
export { lc, LIFE_COLOR_MAP, fill, stroke, words, seaLabel, frame, ctlBar, anim };
export const one = (idx) => [{ idx, dwellMs: null }];
export const mx = (a, b, t) => `color-mix(in oklab, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
export const ink = lc('ink');
export const n1 = (v) => Math.round(v * 10) / 10;

/** Quiet sea setting from the surface down, with a rock floor at y = fy. */
export function seaSetting(st, fy) {
  const { W, H } = st;
  let s = `<rect width="${W}" height="${H}" ${fill(lc('band1'))}/>`;
  s += `<rect y="${n1(fy * 0.28)}" width="${W}" height="${H}" ${fill(mx(lc('band1'), lc('band2'), 0.5))}/>`;
  s += `<rect y="${n1(fy * 0.62)}" width="${W}" height="${H}" ${fill(lc('band2'))}/>`;
  for (let i = 0; i < 3; i++) s += `<path d="M${n1(W * (0.1 + i * 0.3))} 0l${n1(W * 0.1)} 0l${n1(-W * 0.12)} ${n1(fy)}l${n1(-W * 0.07)} 0Z" ${fill(mx(lc('band1'), lc('white'), 0.3), 'opacity:0.3')}/>`;
  s += `<path d="M0 ${fy + 10}C${n1(W * 0.2)} ${fy - 12} ${n1(W * 0.36)} ${fy + 4} ${n1(W * 0.52)} ${fy - 4}S${n1(W * 0.84)} ${fy + 8} ${W} ${fy - 8}V${H}H0Z" ${fill(lc('rockMid'), `stroke:${lc('rockDark')};stroke-width:4`)}/>`;
  s += `<path d="M0 ${fy + 20}C${n1(W * 0.3)} ${fy + 8} ${n1(W * 0.6)} ${fy + 24} ${W} ${fy + 12}" ${stroke(lc('rockLit'), 5)}/>`;
  return s;
}

/** A label with a short leader to the thing it names. Label sits at (x, y), the line ends at (tx, ty). */
export function tag(x, y, tx, ty, text, o = {}) {
  const off = o.dim ? 'opacity:0.25;' : '';
  return `<g style="${off}"><path d="M${n1(x)} ${n1(y + (ty > y ? 6 : -4))}L${n1(tx)} ${n1(ty)}" ${stroke(o.line ?? ink, 2.5, 'stroke-linecap:round')}/>${o.dot === false ? '' : `<circle cx="${n1(tx)}" cy="${n1(ty)}" r="4" ${fill(o.line ?? ink)}/>`}`
    + seaLabel(n1(x), n1(y), text, { size: o.size ?? 16, anchor: o.anchor ?? 'middle' }) + '</g>';
}

/** Position along a list of [x, y] way points, u from 0 to 1, by length. */
export function along(pts, u) {
  let tot = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let d = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? d / seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

/** A solid arrow head at (x, y) pointing along angle a (radians). */
export const head = (x, y, a, r, col) => {
  const p = (t, q) => `${n1(x + Math.cos(a) * t - Math.sin(a) * q)} ${n1(y + Math.sin(a) * t + Math.cos(a) * q)}`;
  return `<path d="M${p(r, 0)}L${p(-r * 0.7, r * 0.8)}L${p(-r * 0.7, -r * 0.8)}Z" ${fill(col)}/>`;
};
/** A chunky curved flow arrow through three points. */
export function flowArrow(a, b, c, col, w = 7) {
  const ang = Math.atan2(c[1] - b[1], c[0] - b[0]);
  return `<path d="M${n1(a[0])} ${n1(a[1])}Q${n1(b[0])} ${n1(b[1])} ${n1(c[0])} ${n1(c[1])}" ${stroke(col, w, 'stroke-linecap:round')}/>` + head(c[0], c[1], ang, w * 1.5, col);
}

// -- sponge --------------------------------------------------------------------------------------------------------
export const SPONGE = svgBioColour('sponge');
const spongeDark = svgBioColour('spongeDark'), spongeLit = svgBioColour('spongeLit'), spongeMid = SPONGE;
// half width of the vase at height h above the base (design units, 0 to 330)
const halfW = (h) => 74 + 56 * Math.sin(Math.min(1, h / 330) * Math.PI);
const CHANNEL_H = [52, 112, 172, 232, 286];
const INNER = 0.44;  // inner wall as a share of the outer half width

function vasePath(k) {
  let l = '', r = '';
  for (let h = 0; h <= 330; h += 30) { const w = halfW(h) * k; l = `L${n1(-w)} ${-h}` + l; r += `L${n1(w)} ${-h}`; }
  return `M${n1(-halfW(0) * k)} 0${r}L${n1(halfW(330) * k)} -330L${n1(-halfW(330) * k)} -330${l}Z`;
}

/** Sponge whole. Origin: middle of the base. About 290 wide and 340 tall at s = 1. */
export function spongeWhole(x, y, s = 1) {
  let g = `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})">`;
  g += `<path d="${vasePath(1)}" ${fill(SPONGE, `stroke:${spongeDark};stroke-width:6;stroke-linejoin:round`)}/>`;
  g += `<path d="M${n1(-halfW(150) * 0.74)} -80C-120 -190 -96 -270 -62 -312" ${stroke(spongeLit, 16, 'stroke-linecap:round')}/>`;
  g += `<ellipse cx="0" cy="-332" rx="${n1(halfW(330) * 0.62)}" ry="13" ${fill(spongeDark)}/><ellipse cx="0" cy="-329" rx="${n1(halfW(330) * 0.46)}" ry="7" ${fill(lc('ink'), 'opacity:0.45')}/>`;
  for (let r = 0; r < 9; r++) {
    const h = 26 + r * 33, w = halfW(h), n = 4 + (r % 2);
    for (let i = 0; i < n; i++) {
      const u = -0.84 + (1.68 * (i + (r % 2 ? 0.5 : 0.25))) / n, px = u * w, q = Math.sqrt(1 - u * u);
      g += `<ellipse cx="${n1(px)}" cy="${-h}" rx="${n1(4 + 6 * q)}" ry="9" ${fill(spongeDark)}/><ellipse cx="${n1(px + 1)}" cy="${-h + 2}" rx="${n1(2 + 3 * q)}" ry="4.5" ${fill(lc('ink'), 'opacity:0.4')}/>`;
    }
  }
  return g + '</g>';
}

/** Sponge cut open down the middle. o.water: the colour inside. */
export function spongeCut(x, y, s = 1, o = {}) {
  const inner = o.water ?? mx(lc('sea'), lc('seaDeep'), 0.3);
  let g = `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})">`;
  g += `<path d="${vasePath(1)}" ${fill(spongeMid, `stroke:${spongeDark};stroke-width:6;stroke-linejoin:round`)}/>`;
  g += `<path d="${vasePath(INNER)}" ${fill(inner)}/>`;
  g += `<rect x="${n1(-halfW(330) * INNER)}" y="-333" width="${n1(halfW(330) * INNER * 2)}" height="16" ${fill(inner)}/>`;
  for (const h of CHANNEL_H) for (const side of [-1, 1]) {
    const a = halfW(h + 10) * side, b = halfW(h) * INNER * side;
    g += `<path d="M${n1(a)} ${-h - 10}L${n1(b)} ${-h}" ${stroke(spongeDark, 19, 'stroke-linecap:butt')}/><path d="M${n1(a * 1.03)} ${-h - 10}L${n1(b * 0.9)} ${-h}" ${stroke(inner, 12, 'stroke-linecap:butt')}/>`;
  }
  // grain of cells in the wall
  for (let r = 0; r < 11; r++) { const h = 12 + r * 30; for (const side of [-1, 1]) { const w = halfW(h); for (let i = 0; i < 2; i++) { const px = side * w * (0.58 + i * 0.26), skip = CHANNEL_H.some((c) => Math.abs(c - h - 5) < 14); if (!skip) g += `<circle cx="${n1(px)}" cy="${-h}" r="7" ${fill(spongeLit, 'opacity:0.7')}/>`; } } }
  return g + '</g>';
}

/** Way points of water through one channel to the top opening, in design units. side -1 or 1, j channel index. */
export function spongeRoute(side, j) {
  const h = CHANNEL_H[j], a = halfW(h + 10) * side, b = halfW(h) * INNER * side;
  return [[a * 1.45, -h - 34], [a, -h - 10], [b, -h], [b * 0.3, -h - 24], [side * 6, -334], [side * 20, -412]];
}
export const SPONGE_CHANNELS = CHANNEL_H.length;

// -- earthworm -----------------------------------------------------------------------------------------------------
const WORM = svgBioColour('worm'), WORM_D = svgBioColour('wormDark'), WORM_L = svgBioColour('wormLit'), WORM_B = svgBioColour('wormBand');
/** One earthworm from the side. xs: boundaries of the segments, head first (largest x). hs: half height of each. */
export function earthwormSide(xs, y, hs, o = {}) {
  let g = '';
  const n = hs.length, band = o.band ?? [10, 14];
  for (let i = n - 1; i >= 0; i--) {
    const x1 = xs[i], x0 = xs[i + 1], h = hs[i], w = Math.max(3, x1 - x0), inBand = i >= band[0] && i < band[1];
    const r = i === 0 ? h : (i === n - 1 ? h * 0.8 : Math.min(h * 0.5, 6));
    g += `<rect x="${n1(x0)}" y="${n1(y - h)}" width="${n1(w + 1)}" height="${n1(h * 2)}" rx="${n1(r)}" ${fill(o.mark === i ? lc('white') : inBand ? WORM_B : WORM, `stroke:${WORM_D};stroke-width:2.5`)}/>`;
    g += `<rect x="${n1(x0 + 2)}" y="${n1(y - h * 0.68)}" width="${n1(Math.max(1, w - 3))}" height="${n1(h * 0.28)}" rx="2" ${fill(WORM_L, 'opacity:0.6')}/>`;
  }
  return g;
}
export const WORM_INK = { WORM, WORM_D, WORM_L, WORM_B };
/** The tick and the cross used on feature tables: drawn shapes, so no glyph depends on a font. */
export const tick = (x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" ${fill(lc('grassDark'))}/><path d="M${n1(x - r * 0.5)} ${y}l${n1(r * 0.36)} ${n1(r * 0.42)} ${n1(r * 0.62)} ${n1(-r * 0.8)}" ${stroke(lc('white'), 3.5, 'stroke-linecap:round;stroke-linejoin:round')}/>`;
export const cross = (x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" ${fill(lc('metal'))}/><path d="M${n1(x - r * 0.4)} ${n1(y - r * 0.4)}l${n1(r * 0.8)} ${n1(r * 0.8)}m0 ${n1(-r * 0.8)}l${n1(-r * 0.8)} ${n1(r * 0.8)}" ${stroke(lc('white'), 3.5, 'stroke-linecap:round')}/>`;

/** Amphioxus from the side, head to the right. bend 0..1 phase: the whole body and rod flex. o.rod: rod colour, o.dim. */
export function amphioxus(cx, cy, L, o = {}) {
  const Wd = L * 0.16, skin = mx(lc('sea'), lc('white'), 0.6), rim = mx(lc('sea'), lc('seaDeep'), 0.7), N = 30, amp = (o.amp ?? 0) * L * 0.06, ph = o.phase ?? 0;
  const mid = (u) => cy + Math.sin(u * 5 + ph) * amp * (0.2 + 0.8 * (1 - u));
  const half = (u) => Wd * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.98 + 0.01)), 0.72);
  const X = (u) => cx - L / 2 + u * L;
  let t = '', b = '', r = '';
  for (let i = 0; i <= N; i++) { const u = i / N; t += `L${n1(X(u))} ${n1(mid(u) - half(u))}`; b = `L${n1(X(u))} ${n1(mid(u) + half(u))}` + b; r += `${i ? 'L' : 'M'}${n1(X(0.03 + u * 0.92))} ${n1(mid(0.03 + u * 0.92) - Wd * 0.06)}`; }
  let g = `<path d="M${t.slice(1)}${b}Z" ${fill(skin, `stroke:${rim};stroke-width:4;stroke-linejoin:round`)}/>`;
  for (let i = 2; i < N - 1; i++) { const u = i / N; g += `<path d="M${n1(X(u) + 6)} ${n1(mid(u) - half(u) * 0.8)}L${n1(X(u) - 4)} ${n1(mid(u))}L${n1(X(u) + 6)} ${n1(mid(u) + half(u) * 0.8)}" ${stroke(mx(lc('sea'), lc('seaDeep'), 0.45), 2.5)}/>`; }
  g += `<path d="${r}" ${stroke(o.rod ?? lc('red'), o.rodW ?? Math.max(7, L * 0.022), 'stroke-linecap:round;stroke-linejoin:round')}/>`;
  return g;
}
