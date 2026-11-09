// PotatoArt.js - kitchen bench, glass beakers, cut potato pieces and a kitchen balance. Not a scene.
//   bench(W, H, gy)                 a kitchen wall and a stone bench top; gy the bench line
//   beaker(x, gy, w, h, o)          foot at gy. o.tint 'water' | 'salt', o.name, o.inner(cx, floorY) markup under the water line
//   piece(x, y, w, h, o)            a cut potato block, cream flesh, a strip of skin. o.shrink 0..1 wrinkles its edge
//   balance(x, gy, w, grams)        a kitchen balance with a lit display. grams: text
import { T, mx, n1, rnd, blobPath, cwDefs } from '../shared/CellWorld.js';
import { fill, stroke, words } from '../shared/PlantArt.js';

const W_ = T('elev-peak');
const D = `<linearGradient id="pt-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('strata-1', W_, 40)}"/><stop offset="1" style="stop-color:${mx('strata-1', W_, 62)}"/></linearGradient>`
  + `<linearGradient id="pt-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('strata-5', W_, 46)}"/><stop offset="1" style="stop-color:${T('strata-5')}"/></linearGradient>`
  + `<linearGradient id="pt-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${W_};stop-opacity:.72"/><stop offset=".16" style="stop-color:${W_};stop-opacity:.12"/><stop offset=".84" style="stop-color:${W_};stop-opacity:.1"/><stop offset="1" style="stop-color:${W_};stop-opacity:.6"/></linearGradient>`
  + `<linearGradient id="pt-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-shallow', W_, 46)};stop-opacity:.72"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'sea-deep', 72)};stop-opacity:.72"/></linearGradient>`
  + `<linearGradient id="pt-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('strata-1', W_, 54)};stop-opacity:.76"/><stop offset="1" style="stop-color:${mx('strata-1', 'sea-shallow', 56)};stop-opacity:.76"/></linearGradient>`
  + `<radialGradient id="pt-fl" cx=".36" cy=".3" r=".86"><stop offset="0" style="stop-color:${mx('gold', W_, 34)}"/><stop offset=".6" style="stop-color:${mx('gold', 'strata-1', 40)}"/><stop offset="1" style="stop-color:${mx('strata-1', 'strata-2', 70)}"/></radialGradient>`;
export const potatoDefs = () => `<defs>${cwDefs()}${D}</defs>`;

export function bench(W, H, gy) {
  let s = `<rect width="${W}" height="${n1(gy)}" style="fill:url(#pt-wall) ${T('strata-1')}"/>`;
  // a steel shelf with jars: quiet
  const sy = gy * 0.3;
  s += `<rect x="${n1(W * 0.06)}" y="${n1(sy)}" width="${n1(W * 0.88)}" height="7" rx="3" ${fill(mx('strata-5', W_, 66))}/>`;
  for (const [u, h, c] of [[0.14, 44, 'strata-2'], [0.24, 34, 'elev-mid'], [0.74, 40, 'strata-3'], [0.85, 48, 'strata-1']]) s += `<rect x="${n1(W * u - 15)}" y="${n1(sy - h)}" width="30" height="${h}" rx="6" style="fill:${mx(c, W_, 60)};stroke:${mx(c, 'strata-6', 70)};stroke-width:1.6;opacity:.6"/>`;
  s += `<rect y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:url(#pt-top) ${T('strata-5')}"/><rect y="${n1(gy)}" width="${W}" height="3" ${fill(mx('strata-5', W_, 30))}/>`;
  return s;
}
export function piece(x, y, w, h, o = {}) {
  // a cut block with soft corners. Its long sides bow in a little as it shrinks, in smooth curves, never a torn edge.
  const sh = o.shrink ?? 0, bow = h * 0.03 + sh * h * 0.07, side = w * 0.02 + sh * w * 0.05, r = Math.min(w, h) * 0.14, l = x - w / 2, R = x + w / 2, t = y - h / 2, B = y + h / 2;
  const d = `M${n1(l + r)} ${n1(t)}C${n1(x - w * 0.2)} ${n1(t + bow)} ${n1(x + w * 0.2)} ${n1(t + bow)} ${n1(R - r)} ${n1(t)}Q${n1(R)} ${n1(t)} ${n1(R)} ${n1(t + r)}C${n1(R - side)} ${n1(y - h * 0.2)} ${n1(R - side)} ${n1(y + h * 0.2)} ${n1(R)} ${n1(B - r)}Q${n1(R)} ${n1(B)} ${n1(R - r)} ${n1(B)}C${n1(x + w * 0.2)} ${n1(B - bow)} ${n1(x - w * 0.2)} ${n1(B - bow)} ${n1(l + r)} ${n1(B)}Q${n1(l)} ${n1(B)} ${n1(l)} ${n1(B - r)}C${n1(l + side)} ${n1(y + h * 0.2)} ${n1(l + side)} ${n1(y - h * 0.2)} ${n1(l)} ${n1(t + r)}Q${n1(l)} ${n1(t)} ${n1(l + r)} ${n1(t)}Z`;
  let c = ''; const k = rnd(o.seed ?? 2);
  for (let i = 0; i < 18; i++) c += `<circle cx="${n1(x - w * 0.4 + k() * w * 0.8)}" cy="${n1(y - h * 0.36 + k() * h * 0.74)}" r="${n1(0.7 + k() * 1.1)}" style="fill:${T('strata-2')};opacity:.34"/>`;
  return `<path d="${d}" style="fill:url(#pt-fl) ${T('strata-1')};stroke:${mx('strata-2', 'strata-1', 60)};stroke-width:2"/>${c}<path d="M${n1(l + r)} ${n1(t + 1)}C${n1(x - w * 0.2)} ${n1(t + bow + 1)} ${n1(x + w * 0.2)} ${n1(t + bow + 1)} ${n1(R - r)} ${n1(t + 1)}" ${stroke(mx('strata-3', 'strata-6', 80), 4)}/><path d="M${n1(x - w * 0.32)} ${n1(y - h * 0.16)}Q${n1(x - w * 0.1)} ${n1(y - h * 0.24)} ${n1(x + w * 0.16)} ${n1(y - h * 0.16)}" ${stroke(W_, 3)} opacity=".66"/>`;
}
export function beaker(x, gy, w, h, o = {}) {
  const l = x - w / 2, r = x + w / 2, top = gy - h, wy = gy - h * 0.72, fl = gy - 7, fillId = o.tint === 'salt' ? 'pt-s' : 'pt-w';
  let tick = ''; for (let i = 1; i <= 5; i++) { const y = gy - (i * h) / 6.4; tick += `<path d="M${n1(l + 8)} ${n1(y)}h${i % 2 ? 16 : 10}" ${stroke(T('strata-6'), 1.8)} opacity=".6"/>`; }
  const clipId = `pt-b${Math.round(x)}`;
  const inner = o.inner ? o.inner(x, fl) : '';
  return `<ellipse cx="${n1(x + 6)}" cy="${n1(gy + 3)}" rx="${n1(w * 0.56)}" ry="7" ${fill(T('strata-6'))} opacity=".3"/>`
    + `<clipPath id="${clipId}"><path d="M${n1(l + 3)} ${n1(top)}V${n1(fl)}Q${n1(l + 3)} ${n1(gy - 3)} ${n1(l + 12)} ${n1(gy - 3)}H${n1(r - 12)}Q${n1(r - 3)} ${n1(gy - 3)} ${n1(r - 3)} ${n1(fl)}V${n1(top)}Z"/></clipPath>`
    + `<g clip-path="url(#${clipId})">`
    + (o.inner ? `<g transform="translate(0 ${n1(2 * wy)}) scale(1 -1)" opacity=".28" style="pointer-events:none"><g transform="translate(0 0)">${inner}</g></g>` : '')
    + `<rect x="${n1(l)}" y="${n1(wy)}" width="${w}" height="${n1(gy - wy)}" style="fill:url(#${fillId}) ${T('sea-shallow')}"/>${inner}</g>`
    + `<ellipse cx="${n1(x)}" cy="${n1(wy)}" rx="${n1(w / 2 - 4)}" ry="6" style="fill:${mx('sea-shallow', W_, 34)};stroke:${mx('sea-shallow', 'sea-deep', 60)};stroke-width:1.6;opacity:.86"/>`
    + `<path d="M${n1(l)} ${n1(top)}L${n1(l - 11)} ${n1(top - 8)}M${n1(l)} ${n1(top)}V${n1(gy - 12)}Q${n1(l)} ${n1(gy)} ${n1(l + 12)} ${n1(gy)}H${n1(r - 12)}Q${n1(r)} ${n1(gy)} ${n1(r)} ${n1(gy - 12)}V${n1(top)}" ${stroke(mx('strata-5', 'sea-deep', 70), 3.6)}/>`
    + `<rect x="${n1(l + 1)}" y="${n1(top)}" width="${n1(w - 2)}" height="${n1(h)}" style="fill:url(#pt-glass) ${W_};pointer-events:none"/>${tick}`
    + (o.name ? words(x, gy + 26, o.name, { size: 15, ink: T('strata-6'), halo: W_, haloW: 4 }) : '');
}
export function balance(x, gy, w, grams) {
  const h = 26, pw = w * 0.84;
  return `<ellipse cx="${n1(x + 4)}" cy="${n1(gy + 3)}" rx="${n1(w * 0.54)}" ry="6" ${fill(T('strata-6'))} opacity=".3"/><path d="M${n1(x - w / 2)} ${n1(gy)}L${n1(x - w / 2 + 8)} ${n1(gy - h)}H${n1(x + w / 2 - 8)}L${n1(x + w / 2)} ${n1(gy)}Z" style="fill:${mx('strata-5', W_, 66)};stroke:${T('strata-5')};stroke-width:2"/><rect x="${n1(x - pw / 2)}" y="${n1(gy - h - 7)}" width="${n1(pw)}" height="7" rx="3" style="fill:${mx('strata-5', W_, 30)};stroke:${T('strata-5')};stroke-width:1.6"/><rect x="${n1(x - 44)}" y="${n1(gy - h + 3)}" width="88" height="20" rx="4" style="fill:${mx('strata-6', 'sea-deep', 80)}"/>`
    + words(x, gy - h + 18.5, grams, { size: 15, ink: W_, weight: 800 });
}
export const PIECE = (u, side) => (side === 'A' ? { k: 1 + 0.12 * u, g: 50 + 4 * u, sh: 0 } : { k: 1 - 0.17 * u, g: 50 - 6 * u, sh: u });
