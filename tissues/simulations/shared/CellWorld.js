// CellWorld.js - painted cell parts for the cells module. Not a scene. SVG strings, tokens only, no faces, no words.
// Match the bundle's painted PNGs: soft membrane with a light rim, grainy cytoplasm with depth, organelles with a lit
// side, a shade side and inner detail. All art is daylight in both themes: it sits on a quiet depth field or an eyepiece.
// Heavy (gradients, grain): paint a part once per step, never per frame. Move things on the live layer or anim().
//
//   Frame    cwFrame(st, id, body)  like PlantArt frame(), with CellWorld defs. Use it, or put cwDefs() in your own <defs>.
//   Set      depthField(w, h, o)    quiet microscopic depth: o.seed, o.tone ('blue' 'green' 'rose')
//            eyepiece(w, h, cx, cy, R, body, o)  dark barrel, round lit field, body clipped to it. o.id, o.tint ('pale' 'blue' 'pink')
//   Parts    every part: (x, y, s, o), o.rot degrees, o.a opacity, o.flip. s = 1 is the size given.
//            mitochondrion  100 x 48    o.long (1), o.seed
//            chloroplast    110 x 58    o.seed
//            nucleus        (x, y, r, o)  o.chromosomes (rods instead of threads) o.nucleolus (true) o.pores (true)
//            roughEr        (x, y, r, o)  sacs on arcs round (x, y), inner radius r. o.a0, o.a1 degrees, o.n sacs, o.seed
//            smoothEr       80 x 60     o.seed
//            golgi          90 x 70     o.n sacs (5), o.vesicles (true)
//            lysosome, vesicle, inclusion  (x, y, r, o)
//            ribosome       (x, y, r, o)
//            vacuole        (x, y, rx, ry, o)  o.seed, o.wob
//   Cells    animalCell(x, y, r, o)      o.shrink 0..1, o.parts, o.seed, o.part(name) -> opacity
//            plantCell(x, y, w, h, o)    o.pull 0..1 the membrane pulls from the wall, wall unchanged. o.parts, o.part(name)
//            bacterium(x, y, s, o)       a rod, 200 x 84. Wall, membrane, nucleoid, ribosomes, flagellum. No nucleus
//            part names: wall membrane cytoplasm nucleus er golgi mito chloro vacuole lysosome ribosome
//   Fields   onionField(x, y, w, h, o)   stained brick-like onion peel: o.cols, o.rows, o.tint, o.seed
//            cheekCell(x, y, r, o)       flat, irregular, blue stain
//   Mols     waterDot(x, y, r), soluteDot(x, y, r, o) (o.kind 'sugar' 'salt'), bilayer(x, y, w, o), channel(x, y, s, o)
// Helpers: blobPath(x, y, rx, ry, seed, wob), n1, rnd, T, mx, LIT (ink for labels on art comes from PlantArt label()).
import { artDefs, ART_INK, frame as paFrame, fill, stroke } from './PlantArt.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';

export const n1 = (v) => Math.round(v * 10) / 10;
export const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
export const T = (n) => `var(--sim-${n})`;
export const mx = (a, b, p) => `color-mix(in oklab, ${a.startsWith('var') || a.startsWith('color') ? a : T(a)} ${p}%, ${b.startsWith('var') || b.startsWith('color') ? b : T(b)})`;
const W_ = T('elev-peak'), INK = T('strata-6');
const tint = (n, p) => mx(n, W_, p), deep = (n, p) => mx(n, INK, p);
const g3 = (id, lit, mid, dark, cx = 0.36, cy = 0.3, r = 0.82) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" style="stop-color:${lit}"/><stop offset=".55" style="stop-color:${mid}"/><stop offset="1" style="stop-color:${dark}"/></radialGradient>`;

let DEFS = null;
export function cwDefs() {
  if (DEFS) return DEFS;
  DEFS = g3('cw-cyto', W_, tint('membrane', 16), tint('membrane', 38), 0.36, 0.3, 0.84)
    + g3('cw-cytoG', W_, tint('elev-low', 16), tint('sea-shallow', 34), 0.36, 0.3, 0.84)
    + g3('cw-nuc', tint('series-5', 40), tint('series-5', 76), deep('series-5', 72), 0.36, 0.3, 0.8)
    + g3('cw-nucIn', tint('series-5', 22), tint('series-5', 44), tint('series-5', 70), 0.42, 0.38, 0.72)
    + g3('cw-nucleolus', tint('series-5', 56), deep('series-5', 76), deep('series-5', 46), 0.36, 0.3, 0.8)
    + g3('cw-mito', tint('series-8', 48), T('series-8'), deep('series-8', 68), 0.34, 0.26, 0.86)
    + g3('cw-mitoIn', tint('series-8', 14), tint('series-8', 30), tint('series-8', 52), 0.4, 0.34, 0.8)
    + g3('cw-chl', tint('chloro', 52), T('chloro'), deep('chloro', 62), 0.34, 0.26, 0.86)
    + g3('cw-chlIn', tint('chloro', 22), tint('chloro', 40), tint('chloro', 62), 0.4, 0.34, 0.8)
    + g3('cw-vac', W_, tint('sea-shallow', 28), tint('sea-shallow', 58), 0.32, 0.26, 0.9)
    + g3('cw-golgi', tint('series-4', 36), T('series-4'), deep('series-4', 74), 0.34, 0.24, 0.9)
    + g3('cw-er', tint('series-5', 30), tint('series-5', 56), mx('series-5', 'series-1', 74), 0.34, 0.24, 0.9)
    + g3('cw-lyso', tint('series-6', 44), T('series-6'), deep('series-6', 66))
    + g3('cw-ves', W_, tint('series-4', 44), T('series-4'))
    + g3('cw-incl', tint('series-2', 26), T('series-2'), deep('series-2', 76))
    + g3('cw-ribo', tint('series-1', 40), mx('sea-deep', 'series-1', 62), T('sea-deep'))
    + g3('cw-wat', W_, T('series-1'), mx('sea-deep', 'series-1', 58), 0.32, 0.28, 0.86)
    + g3('cw-sug', W_, T('series-2'), deep('series-2', 68), 0.32, 0.28, 0.86)
    + g3('cw-salt', W_, T('series-6'), deep('series-6', 66), 0.32, 0.28, 0.86)
    + g3('cw-head', tint('sea-shallow', 46), T('sea-shallow'), mx('sea-shallow', 'sea-deep', 62), 0.32, 0.28, 0.86)
    + g3('cw-prot', tint('series-5', 32), tint('series-5', 62), deep('series-5', 76), 0.3, 0.22, 0.92)
    + `<linearGradient id="cw-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${tint('elev-low', 66)}"/><stop offset=".5" style="stop-color:${T('elev-low')}"/><stop offset="1" style="stop-color:${deep('elev-low', 64)}"/></linearGradient>`
    + `<radialGradient id="cw-field" cx=".42" cy=".38" r=".66"><stop offset="0" style="stop-color:${W_}"/><stop offset=".72" style="stop-color:${mx('strata-1', W_, 24)}"/><stop offset="1" style="stop-color:${mx('strata-1', W_, 62)}"/></radialGradient>`
    + `<radialGradient id="cw-fieldB" cx=".42" cy=".38" r=".66"><stop offset="0" style="stop-color:${W_}"/><stop offset=".72" style="stop-color:${tint('series-1', 12)}"/><stop offset="1" style="stop-color:${tint('series-1', 32)}"/></radialGradient>`
    + `<radialGradient id="cw-fieldP" cx=".42" cy=".38" r=".66"><stop offset="0" style="stop-color:${W_}"/><stop offset=".72" style="stop-color:${tint('series-4', 12)}"/><stop offset="1" style="stop-color:${tint('series-4', 28)}"/></radialGradient>`
    + `<radialGradient id="cw-vign" cx=".5" cy=".5" r=".5"><stop offset=".62" style="stop-color:${INK};stop-opacity:0"/><stop offset=".9" style="stop-color:${INK};stop-opacity:.34"/><stop offset="1" style="stop-color:${INK};stop-opacity:.86"/></radialGradient>`
    + '<filter id="cw-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.34" result="d"/><feComposite in="d" in2="SourceGraphic" operator="in"/></filter>'
    + '<filter id="cw-mott" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.1" result="d"/><feComposite in="d" in2="SourceGraphic" operator="in"/></filter>'
    + '<filter id="cw-blur1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>'
    + '<filter id="cw-blur3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>';
  return DEFS;
}
export function cwFrame(st, id, body) { return paFrame(st, id, `<defs>${cwDefs()}</defs>${body}`); }

const clipId = (() => { let u = 0; return () => `cwc${(u = (u + 1) % 100000)}`; })();
const pos = (x, y, s, o, inner) => `<g transform="translate(${n1(x)} ${n1(y)})${o.rot ? ` rotate(${n1(o.rot)})` : ''} scale(${o.flip ? -s : s} ${s})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${inner}</g>`;
const grainIn = (d, x, y, w, h, a, kind = 'grain') => { const c = clipId(); return `<clipPath id="${c}"><path d="${d}"/></clipPath><g clip-path="url(#${c})"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" style="fill:${deep('series-1', 40)};opacity:${a};filter:url(#cw-${kind})"/></g>`; };

/** A closed smooth blob through n polar points. */
export function blobPath(x, y, rx, ry, seed = 3, wob = 0.08, n = 10) {
  const r = rnd(seed), p = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, k = 1 + (r() - 0.5) * 2 * wob; p.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); }
  let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
  for (let i = 0; i < n; i++) { const a = p[(i + n - 1) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n]; d += `C${n1(b[0] + (c[0] - a[0]) / 6)} ${n1(b[1] + (c[1] - a[1]) / 6)} ${n1(c[0] - (e[0] - b[0]) / 6)} ${n1(c[1] - (e[1] - b[1]) / 6)} ${n1(c[0])} ${n1(c[1])}`; }
  return d + 'Z';
}

// -- sets ---------------------------------------------------------------------
export function depthField(w, h, o = {}) {
  const r = rnd(o.seed ?? 7), col = { blue: ['membrane', 'sea-shallow'], green: ['elev-low', 'sea-shallow'], rose: ['series-4', 'series-5'] }[o.tone ?? 'blue'];
  let s = `<rect width="${w}" height="${h}" style="fill:${mx(col[0], 'bg-deep', 12)}"/>`;
  for (let i = 0; i < 12; i++) s += `<circle cx="${n1(r() * w)}" cy="${n1(r() * h)}" r="${n1(26 + r() * Math.min(w, h) * 0.2)}" style="fill:${T(i % 2 ? col[0] : col[1])};opacity:${n1(0.05 + r() * 0.06)};filter:url(#pa-softer)"/>`;
  return s;
}
export function eyepiece(w, h, cx, cy, R, body, o = {}) {
  const id = o.id ?? clipId(), f = { pale: 'cw-field', blue: 'cw-fieldB', pink: 'cw-fieldP' }[o.tint ?? 'pale'];
  const dk = mx('strata-6', T('sea-deep'), 76), dk2 = mx('strata-6', T('sea-deep'), 40);
  return `<rect width="${w}" height="${h}" style="fill:${deep('strata-6', 66)}"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R + 26)}" style="fill:${dk}"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R + 12)}" style="fill:${dk2}"/>`
    + `<path d="M${n1(cx - R - 18)} ${n1(cy)}A${n1(R + 18)} ${n1(R + 18)} 0 0 1 ${n1(cx)} ${n1(cy - R - 18)}" ${stroke(mx('strata-5', W_, 60), 4)} opacity=".6"/>`
    + `<clipPath id="${id}"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}"/></clipPath><g clip-path="url(#${id})"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:url(#${f}) ${W_}"/>${body}</g>`
    + `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:url(#cw-vign) transparent;pointer-events:none"/>`;
}

// -- organelles ---------------------------------------------------------------
const kidney = 'M-50 4C-52 -16 -32 -25 -8 -23C14 -21 34 -27 46 -12C54 -2 50 16 34 21C12 27 -8 21 -24 23C-40 25 -49 18 -50 4Z';
const kidneyIn = 'M-44 3C-46 -13 -30 -19 -9 -18C13 -16 32 -21 41 -9C47 -1 44 12 31 16C12 21 -8 16 -23 18C-37 20 -43 14 -44 3Z';
export function mitochondrion(x, y, s = 1, o = {}) {
  const r = rnd(o.seed ?? 4); let d = '';
  // cristae: round-ended folds of the inner membrane, from the top and bottom in turn, never quite meeting
  const N = 8; for (let i = 0; i < N; i++) { const u = -35 + (i / (N - 1)) * 68, top = i % 2 === 0, e = top ? -16 : 15, h = 15 + r() * 7, sg = top ? 1 : -1; d += `M${n1(u - 3.2)} ${e}C${n1(u - 3.6)} ${n1(e + sg * h * 0.6)} ${n1(u - 3)} ${n1(e + sg * h)} ${n1(u)} ${n1(e + sg * h)}S${n1(u + 3.6)} ${n1(e + sg * h * 0.6)} ${n1(u + 3.2)} ${e}`; }
  const cr = `<path d="${d}" ${stroke(deep('series-8', 74), 3.4)}/><path d="${d}" ${stroke(tint('series-8', 70), 1.5)}/>`;
  return pos(x, y, s, o, `<ellipse cx="3" cy="6" rx="48" ry="23" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><path d="${kidney}" style="fill:url(#cw-mito) ${T('series-8')};stroke:${deep('series-8', 62)};stroke-width:1.8"/><path d="${kidneyIn}" style="fill:url(#cw-mitoIn) ${tint('series-8', 40)};stroke:${deep('series-8', 74)};stroke-width:1.2"/>${cr}<path d="M-38 -11C-24 -18 -8 -15 8 -16" ${stroke(W_, 2.6)} opacity=".62"/>`);
}
const lens = 'M-54 2C-52 -18 -30 -28 -4 -28C24 -28 50 -20 55 -2C58 14 34 28 2 28C-28 28 -56 20 -54 2Z';
const lensIn = 'M-48 2C-46 -14 -28 -23 -4 -23C22 -23 45 -16 49 -2C52 11 31 23 2 23C-26 23 -50 16 -48 2Z';
export function chloroplast(x, y, s = 1, o = {}) {
  const stacks = [[-30, 2, 4], [-10, -6, 5], [10, 6, 5], [30, -3, 4]]; let g = '<g>';
  g += `<path d="M-38 3L-18 -5L2 7L24 -2L42 1" ${stroke(deep('chloro', 74), 2.2)}/>`;
  for (const [cx, cy, n] of stacks) for (let i = 0; i < n; i++) {
    const yy = cy + (i - (n - 1) / 2) * 5;
    g += `<rect x="${cx - 9}" y="${n1(yy - 2.4)}" width="18" height="4.8" rx="2.4" style="fill:${i % 2 ? T('chloro') : tint('chloro', 74)};stroke:${deep('chloro', 62)};stroke-width:1"/>`;
  }
  g += '</g>';
  return pos(x, y, s, o, `<ellipse cx="3" cy="6" rx="52" ry="26" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><path d="${lens}" style="fill:url(#cw-chl) ${T('chloro')};stroke:${deep('chloro', 58)};stroke-width:1.8"/><path d="${lensIn}" style="fill:url(#cw-chlIn) ${tint('chloro', 40)};stroke:${deep('chloro', 74)};stroke-width:1"/>${g}<path d="M-40 -9C-26 -19 -8 -20 10 -20" ${stroke(W_, 2.6)} opacity=".6"/>`);
}
export function nucleus(x, y, r, o = {}) {
  const q = rnd(o.seed ?? 6); let th = '';
  if (!o.chromosomes) for (let k = 0; k < 7; k++) {
    let a = q() * 6.28, R = q() * r * 0.62, px = Math.cos(a) * R, py = Math.sin(a) * R, d = `M${n1(px)} ${n1(py)}`;
    for (let i = 0; i < 5; i++) { const b = a + (q() - 0.5) * 2.6, l = r * (0.16 + q() * 0.14), nx = px + Math.cos(b) * l, ny = py + Math.sin(b) * l; const lim = Math.hypot(nx, ny) > r * 0.76; const fx = lim ? nx * 0.6 : nx, fy = lim ? ny * 0.6 : ny; d += `Q${n1(px + Math.cos(b + 1) * l * 0.6)} ${n1(py + Math.sin(b + 1) * l * 0.6)} ${n1(fx)} ${n1(fy)}`; px = fx; py = fy; a = b; }
    th += `<path d="${d}" ${stroke(deep('series-5', 80), Math.max(1.2, r * 0.028))} opacity=".62"/>`;
  }
  let pores = '';
  if (o.pores !== false) { const n = Math.round(r * 0.34); for (let i = 0; i < n; i++) { const a = (i + q() * 0.5) / n * 6.283; pores += `<circle cx="${n1(Math.cos(a) * r * 0.965)}" cy="${n1(Math.sin(a) * r * 0.965)}" r="${n1(Math.max(1.3, r * 0.03))}" style="fill:${tint('series-5', 28)};stroke:${deep('series-5', 62)};stroke-width:.8"/>`; } }
  const nl = o.nucleolus === false ? '' : `<circle cx="${n1(r * 0.14)}" cy="${n1(r * 0.1)}" r="${n1(r * 0.27)}" style="fill:url(#cw-nucleolus) ${T('series-5')}"/><ellipse cx="${n1(r * 0.05)}" cy="${n1(r * 0.01)}" rx="${n1(r * 0.09)}" ry="${n1(r * 0.05)}" style="fill:${W_};opacity:.6"/>`;
  return `<g transform="translate(${n1(x)} ${n1(y)})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}><circle cx="${n1(r * 0.06)}" cy="${n1(r * 0.12)}" r="${n1(r * 1.02)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><circle r="${n1(r)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${deep('series-5', 62)};stroke-width:${n1(Math.max(1.4, r * 0.03))}"/><circle r="${n1(r * 0.89)}" style="fill:url(#cw-nucIn) ${tint('series-5', 44)};stroke:${deep('series-5', 70)};stroke-width:${n1(Math.max(1, r * 0.016))}"/>${th}${nl}${pores}<path d="M${n1(-r * 0.74)} ${n1(-r * 0.3)}A${n1(r * 0.82)} ${n1(r * 0.82)} 0 0 1 ${n1(-r * 0.2)} ${n1(-r * 0.78)}" ${stroke(W_, Math.max(2, r * 0.06))} opacity=".55"/></g>`;
}
export function ribosome(x, y, r = 2.4, o = {}) { return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:url(#cw-ribo) ${T('sea-deep')}"${o.a !== undefined ? ` opacity="${o.a}"` : ''}/>`; }
const arc = (r, a0, a1) => { const p = (a) => [Math.cos(a * 0.01745) * r, Math.sin(a * 0.01745) * r], [ax, ay] = p(a0), [bx, by] = p(a1); return `M${n1(ax)} ${n1(ay)}A${n1(r)} ${n1(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${n1(bx)} ${n1(by)}`; };
export function roughEr(x, y, r, o = {}) {
  const a0 = o.a0 ?? 20, a1 = o.a1 ?? 200, n = o.n ?? 3, q = rnd(o.seed ?? 8), w = o.w ?? Math.max(7, r * 0.14), gap = w * 1.5; let s = '';
  for (let i = n - 1; i >= 0; i--) {
    const R = r + i * gap, span = a1 - a0, parts = 2 + (span > 200 ? 1 : 0);
    for (let k = 0; k < parts; k++) {
      const pa = a0 + (k / parts) * span + 3 + q() * 4, pb = a0 + ((k + 1) / parts) * span - 3 - q() * 4, d = arc(R, pa, pb);
      s += `<path d="${d}" ${stroke(deep('series-5', 56), w + 2.4)}/><path d="${d}" ${stroke(tint('series-5', 56), w)}/><path d="${arc(R - w * 0.2, pa + 1, pb - 1)}" ${stroke(W_, w * 0.3)} opacity=".5"/>`;
      const cnt = Math.round(((pb - pa) * 0.01745 * R) / (o.step ?? 8));
      for (let j = 0; j < cnt; j++) { const a = (pa + (j + 0.5) / cnt * (pb - pa)) * 0.01745, side = j % 2 ? 1 : -1, RR = R + side * (w / 2 + 1.6); s += ribosome(Math.cos(a) * RR, Math.sin(a) * RR, Math.max(1.8, w * 0.22)); }
    }
  }
  return `<g transform="translate(${n1(x)} ${n1(y)})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}
export function smoothEr(x, y, s = 1, o = {}) {
  const ds = ['M-40 -20C-24 -30 -14 -8 2 -16S30 -28 40 -12', 'M-36 2C-20 -8 -8 12 8 4S28 -8 42 8', 'M-30 22C-14 12 -2 30 14 22S30 12 38 24', 'M-16 -14C-20 -4 -14 2 -14 8', 'M14 -16C10 -6 18 -2 16 6', 'M4 6C0 14 6 16 4 24'];
  return pos(x, y, s, o, ds.map((d) => `<path d="${d}" ${stroke(deep('series-3', 58), 8.4)}/>`).join('') + ds.map((d) => `<path d="${d}" ${stroke(tint('series-3', 54), 6)}/>`).join('') + ds.slice(0, 3).map((d) => `<path d="${d}" ${stroke(W_, 1.8)} opacity=".55" transform="translate(-.8 -1.4)"/>`).join(''));
}
export function golgi(x, y, s = 1, o = {}) {
  const n = o.n ?? 5; let c = '';
  for (let i = n - 1; i >= 0; i--) {
    const u = i / (n - 1), w = 44 - Math.abs(u - 0.5) * 22, yy = -22 + i * 11;
    const d = `M${n1(-w)} ${n1(yy + 10)}C${n1(-w * 0.6)} ${n1(yy - 7)} ${n1(w * 0.6)} ${n1(yy - 7)} ${n1(w)} ${n1(yy + 10)}C${n1(w + 4)} ${n1(yy + 15)} ${n1(w - 5)} ${n1(yy + 17)} ${n1(w - 7)} ${n1(yy + 14)}C${n1(w * 0.5)} ${n1(yy + 3)} ${n1(-w * 0.5)} ${n1(yy + 3)} ${n1(-w + 7)} ${n1(yy + 14)}C${n1(-w + 5)} ${n1(yy + 17)} ${n1(-w - 4)} ${n1(yy + 15)} ${n1(-w)} ${n1(yy + 10)}Z`;
    c += `<path d="${d}" style="fill:url(#cw-golgi) ${T('series-4')};stroke:${deep('series-4', 62)};stroke-width:1.5"/><path d="M${n1(-w * 0.6)} ${n1(yy + 4.6)}C${n1(-w * 0.3)} ${n1(yy)} ${n1(w * 0.2)} ${n1(yy)} ${n1(w * 0.5)} ${n1(yy + 3.8)}" ${stroke(W_, 1.6)} opacity=".6"/>`;
  }
  if (o.vesicles !== false) for (const [vx, vy, vr] of [[-52, 24, 5.4], [52, 22, 6], [44, 36, 4.2], [-40, 38, 4]]) c += vesicle(vx, vy, vr);
  return pos(x, y, s, o, `<ellipse cx="3" cy="10" rx="50" ry="30" style="fill:${INK};opacity:.14;filter:url(#cw-blur3)"/>${c}`);
}
const sphere = (x, y, r, g, rim, o = {}) => `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:url(#${g}) ${rim};stroke:${rim};stroke-width:${n1(Math.max(1, r * 0.1))}"/><ellipse cx="${n1(x - r * 0.34)}" cy="${n1(y - r * 0.38)}" rx="${n1(r * 0.3)}" ry="${n1(r * 0.17)}" transform="rotate(-30 ${n1(x - r * 0.34)} ${n1(y - r * 0.38)})" style="fill:${W_};opacity:.72"/>${o.in ?? ''}</g>`;
export const vesicle = (x, y, r, o = {}) => sphere(x, y, r, 'cw-ves', deep('series-4', 76), o);
export const inclusion = (x, y, r, o = {}) => sphere(x, y, r, 'cw-incl', deep('series-2', 62), o);
export function lysosome(x, y, r, o = {}) {
  const q = rnd(3); let i = ''; for (let k = 0; k < 7; k++) { const a = q() * 6.28, R = q() * r * 0.62; i += `<circle cx="${n1(x + Math.cos(a) * R)}" cy="${n1(y + Math.sin(a) * R + r * 0.1)}" r="${n1(r * 0.08)}" style="fill:${deep('series-6', 44)};opacity:.7"/>`; }
  return sphere(x, y, r, 'cw-lyso', deep('series-6', 58), { ...o, in: i });
}
export function vacuole(x, y, rx, ry, o = {}) {
  const d = blobPath(x, y, rx, ry, o.seed ?? 5, o.wob ?? 0.05, 9);
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}><path d="${d}" style="fill:url(#cw-vac) ${tint('sea-shallow', 40)};stroke:${mx('sea-shallow', 'sea-deep', 80)};stroke-width:1.8"/><path d="M${n1(x - rx * 0.66)} ${n1(y - ry * 0.26)}C${n1(x - rx * 0.56)} ${n1(y - ry * 0.68)} ${n1(x - rx * 0.1)} ${n1(y - ry * 0.84)} ${n1(x + rx * 0.3)} ${n1(y - ry * 0.74)}" ${stroke(W_, Math.max(3, rx * 0.07))} opacity=".85"/><ellipse cx="${n1(x - rx * 0.62)}" cy="${n1(y + ry * 0.1)}" rx="${n1(rx * 0.05)}" ry="${n1(ry * 0.09)}" style="fill:${W_};opacity:.8"/></g>`;
}

// -- cells --------------------------------------------------------------------
const ribos = (q, n, inside, r = 2) => { let s = ''; for (let i = 0; i < n; i++) { const [x, y] = inside(q()); s += ribosome(x, y, r * (0.8 + q() * 0.4)); } return s; };
const pick = (o) => (n) => { const v = o.part?.(n); return v === undefined ? 1 : v; };
const has = (o, n) => !o.parts || o.parts.includes(n);
const G = (a, s) => (a === 0 ? '' : `<g${a < 1 ? ` opacity="${a}"` : ''}>${s}</g>`);
export function animalCell(x, y, r, o = {}) {
  const P = pick(o), sc = 1 - 0.42 * (o.shrink ?? 0), R = r * sc, seed = o.seed ?? 9, d = blobPath(x, y, R, R * 0.92, seed, (o.shrink ?? 0) > 0.3 ? 0.14 : 0.06, 11);
  const q = rnd(seed + 1), inside = () => { const a = q() * 6.28, k = 0.4 + q() * 0.46; return [x + Math.cos(a) * R * k, y + Math.sin(a) * R * 0.92 * k]; };
  const u = R / 180;
  let s = `<path d="${d}" transform="translate(5 10)" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
  s += G(P('cytoplasm'), `<path d="${d}" style="fill:url(#cw-cyto) ${tint('membrane', 30)}"/>${grainIn(d, x - R, y - R, 2 * R, 2 * R, 0.26)}`);
  const nx = x + R * 0.1, ny = y + R * 0.04, nr = R * 0.32;
  if (has(o, 'er')) s += G(P('er'), roughEr(nx, ny, nr * 1.18, { a0: -30, a1: 210, n: 2, w: Math.max(5, 11 * u), step: Math.max(6, 11 * u), seed: 5 }));
  if (has(o, 'nucleus')) s += G(P('nucleus'), nucleus(nx, ny, nr));
  if (has(o, 'golgi')) s += G(P('golgi'), golgi(x - R * 0.42, y + R * 0.46, 0.8 * u, { rot: -24 }));
  if (has(o, 'mito')) s += G(P('mito'), mitochondrion(x - R * 0.56, y - R * 0.22, u * 0.7, { rot: 60, seed: 2 }) + mitochondrion(x + R * 0.26, y + R * 0.68, u * 0.7, { rot: -12, seed: 6 }) + mitochondrion(x + R * 0.6, y - R * 0.36, u * 0.6, { rot: 110, seed: 3 }));
  if (has(o, 'lysosome')) s += G(P('lysosome'), lysosome(x - R * 0.1, y - R * 0.66, R * 0.08) + lysosome(x + R * 0.72, y + R * 0.28, R * 0.065));
  if (has(o, 'ribosome')) s += G(P('ribosome'), ribos(q, Math.round(26 * Math.min(1.2, u * 1.2)), inside, Math.max(1.6, 2.6 * u)));
  s += G(P('membrane'), `<path d="${d}" style="fill:none;stroke:${tint('sea-shallow', 70)};stroke-width:${n1(Math.max(5, R * 0.04))};opacity:.5;filter:url(#cw-blur1)"/><path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:${n1(Math.max(2.4, R * 0.018))}"/><path d="${d}" transform="translate(${n1(x * 0.02)} ${n1(y * 0.02)}) scale(.98)" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.75"/>`);
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}
const rrect = (x, y, w, h, r) => `M${n1(x + r)} ${n1(y)}H${n1(x + w - r)}Q${n1(x + w)} ${n1(y)} ${n1(x + w)} ${n1(y + r)}V${n1(y + h - r)}Q${n1(x + w)} ${n1(y + h)} ${n1(x + w - r)} ${n1(y + h)}H${n1(x + r)}Q${n1(x)} ${n1(y + h)} ${n1(x)} ${n1(y + h - r)}V${n1(y + r)}Q${n1(x)} ${n1(y)} ${n1(x + r)} ${n1(y)}Z`;
export function plantCell(x, y, w, h, o = {}) {
  const P = pick(o), wall = Math.max(8, Math.min(w, h) * 0.06), pull = o.pull ?? 0, gapX = wall + 3 + pull * w * 0.17, gapY = wall + 3 + pull * h * 0.17, seed = o.seed ?? 4;
  const ix = x - w / 2 + gapX, iy = y - h / 2 + gapY, iw = w - 2 * gapX, ih = h - 2 * gapY;
  const outer = rrect(x - w / 2, y - h / 2, w, h, wall * 1.4), innerW = rrect(x - w / 2 + wall, y - h / 2 + wall, w - 2 * wall, h - 2 * wall, wall * 0.8);
  const mem = pull > 0.02 ? blobPath(x, y, iw / 2, ih / 2, seed, 0.04 + pull * 0.08, 12) : rrect(ix, iy, iw, ih, wall);
  const u = Math.min(iw, ih) / 200;
  let s = `<path d="${outer}" transform="translate(5 9)" style="fill:${INK};opacity:.24;filter:url(#cw-blur3)"/>`;
  if (has(o, 'wall')) s += G(P('wall'), `<path d="${outer}" style="fill:url(#cw-wall) ${T('elev-low')};stroke:${deep('elev-low', 56)};stroke-width:2"/><path d="${rrect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, wall)}" ${stroke(tint('elev-low', 40), 1.6)} opacity=".7"/>`);
  s += `<path d="${innerW}" style="fill:${pull > 0.02 ? tint('sea-shallow', 18) : tint('membrane', 20)}"/>`;
  s += G(P('cytoplasm'), `<path d="${mem}" style="fill:url(#cw-cytoG) ${tint('sea-shallow', 20)}"/>${grainIn(mem, ix, iy, iw, ih, 0.22)}`);
  const vk = 1 - 0.5 * pull;
  if (has(o, 'vacuole')) s += G(P('vacuole'), vacuole(x - iw * 0.08, y - ih * 0.02, iw * 0.3 * vk, ih * 0.32 * vk, { seed: seed + 2 }));
  const q = rnd(seed), k = 1 - 0.1 * pull;
  if (has(o, 'nucleus')) s += G(P('nucleus'), nucleus(x + iw * 0.32 * k, y + ih * 0.2 * k, Math.min(iw, ih) * 0.14));
  if (has(o, 'chloro')) s += G(P('chloro'), chloroplast(x - iw * 0.3 * k, y - ih * 0.39 * k, u * 0.5, { rot: -10 }) + chloroplast(x + iw * 0.2 * k, y - ih * 0.39 * k, u * 0.5, { rot: 8 }) + chloroplast(x - iw * 0.37 * k, y + ih * 0.33 * k, u * 0.48, { rot: 40 }) + chloroplast(x - iw * 0.02, y + ih * 0.39 * k, u * 0.48, { rot: -6 }));
  if (has(o, 'mito')) s += G(P('mito'), mitochondrion(x + iw * 0.41 * k, y - ih * 0.14 * k, u * 0.4, { rot: 76 }) + mitochondrion(x + iw * 0.34 * k, y + ih * 0.41 * k, u * 0.4, { rot: -10, seed: 6 }));
  if (has(o, 'golgi')) s += G(P('golgi'), golgi(x + iw * 0.14 * k, y + ih * 0.22 * k, u * 0.42, { vesicles: false, rot: 16 }));
  if (has(o, 'ribosome')) s += G(P('ribosome'), ribos(q, 16, () => { const a = q() * 6.28; return [x + Math.cos(a) * iw * 0.38 * k, y + Math.sin(a) * ih * 0.36 * k]; }, Math.max(1.5, 2.4 * u)));
  s += G(P('membrane'), `<path d="${mem}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:${n1(Math.max(2.2, 3 * u))}"/><path d="${mem}" style="fill:none;stroke:${tint('sea-shallow', 60)};stroke-width:${n1(Math.max(4, 6 * u))};opacity:.34"/>`);
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}
export function bacterium(x, y, s = 1, o = {}) {
  const P = pick(o), q = rnd(o.seed ?? 12), b = 'M-92 0C-92 -30 -72 -38 -50 -38H50C72 -38 92 -30 92 0S72 38 50 38H-50C-72 38 -92 30 -92 0Z', i = 'M-84 0C-84 -24 -68 -31 -50 -31H50C68 -31 84 -24 84 0S68 31 50 31H-50C-68 31 -84 24 -84 0Z';
  // nucleoid: one long folded loop of DNA, no membrane round it
  let nd = 'M-34 0'; for (let k = 0; k < 9; k++) { const u = -28 + k * 8, w = 12 + q() * 8; nd += `C${n1(u)} ${n1(-w)} ${n1(u + 8)} ${n1(-w)} ${n1(u + 6)} 0S${n1(u + 2)} ${n1(w)} ${n1(u + 10)} ${n1(w * 0.3)}`; }
  nd += 'C44 18 -30 22 -34 0';
  const c = `<path d="M92 0C118 -8 128 12 150 2S178 -8 196 4" ${stroke(deep('strata-2', 60), 3.4)}/><path d="${b}" transform="translate(3 6)" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`
    + G(P('wall'), `<path d="${b}" style="fill:url(#cw-wall) ${T('elev-low')};stroke:${deep('elev-low', 56)};stroke-width:2"/>`)
    + G(P('cytoplasm'), `<path d="${i}" style="fill:url(#cw-cytoG) ${tint('sea-shallow', 20)}"/>${grainIn(i, -84, -31, 168, 62, 0.22)}`)
    + G(P('nucleus'), `<path d="${nd}" ${stroke(deep('series-5', 78), 3)} opacity=".8"/><path d="${nd}" ${stroke(tint('series-5', 60), 1)}/>`)
    + G(P('ribosome'), ribos(q, 20, () => [-76 + q() * 152, -24 + q() * 48], 2.4))
    + G(P('membrane'), `<path d="${i}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:2.4"/>`)
    + `<path d="M-70 -24C-40 -32 20 -32 60 -26" ${stroke(W_, 3)} opacity=".6"/>`;
  return pos(x, y, s, o, c);
}

// -- microscope fields -----------------------------------------------------------
/** A peel: long brick cells with thick walls and a side nucleus. o.tint series name or token, o.cols, o.rows, o.seed, o.nucleus (true). */
export function onionField(x, y, w, h, o = {}) {
  const q = rnd(o.seed ?? 3), cols = o.cols ?? 7, rows = o.rows ?? 9, tn = o.tint ?? 'strata-2', cw = w / cols, ch = h / rows; let s = '';
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? cw / 2 : 0;
    for (let c = -1; c <= cols; c++) {
      const cx = x + c * cw + off, cy = y + r * ch, jx = (q() - 0.5) * 3, jy = (q() - 0.5) * 3, d = rrect(cx + 1.6 + jx, cy + 1.6 + jy, cw - 3.2, ch - 3.2, 6);
      s += `<path d="${d}" style="fill:${mx(tn, W_, 18 + Math.round(q() * 14))};stroke:${mx(tn, INK, 78)};stroke-width:2.2"/>`;
      if (o.nucleus !== false) { const nx = cx + cw * (0.24 + q() * 0.52), ny = cy + ch * (0.3 + q() * 0.4), nr = Math.min(cw, ch) * 0.13; s += `<circle cx="${n1(nx)}" cy="${n1(ny)}" r="${n1(nr)}" style="fill:${mx(tn, INK, 70)};opacity:.82"/><circle cx="${n1(nx - nr * 0.3)}" cy="${n1(ny - nr * 0.3)}" r="${n1(nr * 0.3)}" style="fill:${W_};opacity:.5"/>`; }
    }
  }
  return s;
}
export function cheekCell(x, y, r, o = {}) {
  const seed = o.seed ?? 2, d = blobPath(x, y, r, r * 0.84, seed, 0.17, 9), q = rnd(seed + 9); let g = '';
  for (let i = 0; i < 24; i++) { const a = q() * 6.28, R = q() * r * 0.8; g += `<circle cx="${n1(x + Math.cos(a) * R)}" cy="${n1(y + Math.sin(a) * R * 0.8)}" r="${n1(0.8 + q() * 1.5)}" style="fill:${mx('sea-deep', 'series-1', 70)};opacity:.42"/>`; }
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}><path d="${d}" style="fill:${tint('series-1', 42)};stroke:${mx('sea-deep', 'series-1', 70)};stroke-width:2"/>${g}<path d="M${n1(x - r * 0.6)} ${n1(y - r * 0.3)}Q${n1(x - r * 0.2)} ${n1(y - r * 0.1)} ${n1(x - r * 0.1)} ${n1(y + r * 0.5)}" ${stroke(mx('sea-deep', 'series-1', 50), 1.2)} opacity=".3"/><circle cx="${n1(x + r * 0.08)}" cy="${n1(y + r * 0.04)}" r="${n1(r * 0.2)}" style="fill:${mx('sea-deep', 'series-5', 64)}"/><circle cx="${n1(x + r * 0.02)}" cy="${n1(y - r * 0.02)}" r="${n1(r * 0.06)}" style="fill:${W_};opacity:.5"/></g>`;
}

// -- molecules --------------------------------------------------------------------
export const waterDot = (x, y, r = 5, o = {}) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:url(#cw-wat) ${T('series-1')}"${o.a !== undefined ? ` opacity="${o.a}"` : ''}/>`;
export const soluteDot = (x, y, r = 8, o = {}) => (o.kind === 'salt'
  ? `<rect x="${n1(x - r)}" y="${n1(y - r)}" width="${n1(2 * r)}" height="${n1(2 * r)}" rx="${n1(r * 0.3)}" transform="rotate(14 ${n1(x)} ${n1(y)})" style="fill:url(#cw-salt) ${T('series-6')};stroke:${deep('series-6', 62)};stroke-width:1.4"/>`
  : `<path d="M${n1(x - r)} ${n1(y)}L${n1(x - r * 0.5)} ${n1(y - r * 0.87)}H${n1(x + r * 0.5)}L${n1(x + r)} ${n1(y)}L${n1(x + r * 0.5)} ${n1(y + r * 0.87)}H${n1(x - r * 0.5)}Z" style="fill:url(#cw-sug) ${T('series-2')};stroke:${deep('series-2', 62)};stroke-width:1.4"/>`);
/** A lipid bilayer strip, centre line y, as in the painted membrane: round heads, wavy tails. o.h half thickness (34), o.step (20), o.skip [x ranges] */
export function bilayer(x, y, w, o = {}) {
  const h = o.h ?? 34, st = o.step ?? 20, r = st * 0.46; let t = '', c = '';
  for (let i = 0; i * st <= w; i++) {
    const px = x + i * st; if ((o.skip ?? []).some(([a, b]) => px > a && px < b)) continue;
    for (const sgn of [-1, 1]) {
      const hy = y + sgn * h, ti = y + sgn * 5;
      for (const dx of [-3.4, 3.4]) t += `<path d="M${n1(px + dx)} ${n1(hy)}q${n1(dx * 0.9)} ${n1(-sgn * h * 0.34)} 0 ${n1(-sgn * h * 0.56)}T${n1(px + dx)} ${n1(ti)}" ${stroke(mx('sea-shallow', 'strata-1', 58), 1.8)} opacity=".85"/>`;
      c += `<circle cx="${n1(px)}" cy="${n1(hy)}" r="${n1(r)}" style="fill:url(#cw-head) ${T('sea-shallow')};stroke:${mx('sea-shallow', 'sea-deep', 56)};stroke-width:1.2"/>`;
    }
  }
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}><rect x="${n1(x - 6)}" y="${n1(y - h)}" width="${n1(w + 12)}" height="${n1(2 * h)}" style="fill:${tint('sea-shallow', 20)};opacity:.7"/>${t}${c}</g>`;
}
export function channel(x, y, s = 1, o = {}) {
  const L = 'M-6 -52C-30 -58 -40 -44 -38 -20C-36 -4 -40 18 -38 34C-36 54 -22 58 -6 52C-14 26 -10 -24 -6 -52Z';
  return pos(x, y, s, o, `<path d="M-14 -46H14V46H-14Z" style="fill:${deep('series-5', 62)}"/><path d="${L}" style="fill:url(#cw-prot) ${T('series-5')};stroke:${deep('series-5', 62)};stroke-width:1.6"/><path d="${L}" transform="scale(-1 1)" style="fill:url(#cw-prot) ${T('series-5')};stroke:${deep('series-5', 62)};stroke-width:1.6"/><path d="M-30 -42C-34 -18 -30 16 -30 36" ${stroke(W_, 2.4)} opacity=".6"/>`);
}
export { ART_INK, fill, stroke, lookOf };
