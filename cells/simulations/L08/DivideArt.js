// DivideArt.js - cells and chromosomes for the division scenes. Not a scene. SVG strings, tokens only, no faces, no words.
// A chromosome is a banded rod with a waist; a doubled one is two rods joined at the waist. Each parent gives one colour:
// series-6 and series-1. Long pair and short pair, so the count is plain to see.
//   rod(x, y, h, col, o)        one chromosome. o.rot degrees, o.a
//   dbl(x, y, h, col, o)        a chromosome with its copy joined to it
//   setOf(list, x, y, k, o)     lays out rods in a nucleus: list of { h, c, d } h 0 long 1 short, c 'a' or 'b', d doubled
//   divCell(x, y, r, o)         a soft living cell. o.seed, o.pinch 0..1, o.ring (true: nuclear envelope), o.a
//   arrow(x0, y0, x1, y1)       a soft tree arrow
//   COL { a, b }
import { n1, rnd, T, mx, blobPath, stroke } from '../shared/CellWorld.js';

export const COL = { a: T('series-6'), b: T('series-1') };
const ink = (c) => mx(c, 'strata-6', 58), lit = (c) => mx(c, 'elev-peak', 56);
export function rod(x, y, h, col, o = {}) {
  const w = o.w ?? h * 0.26;
  const d = `M${n1(-w / 2)} ${n1(-h / 2 + w / 2)}a${n1(w / 2)} ${n1(w / 2)} 0 0 1 ${n1(w)} 0V${n1(-w * 0.24)}q${n1(-w * 0.2)} ${n1(w * 0.24)} 0 ${n1(w * 0.48)}V${n1(h / 2 - w / 2)}a${n1(w / 2)} ${n1(w / 2)} 0 0 1 ${n1(-w)} 0V${n1(w * 0.24)}q${n1(w * 0.2)} ${n1(-w * 0.24)} 0 ${n1(-w * 0.48)}Z`;
  let b = '';
  for (const u of [-0.36, -0.25, 0.2, 0.33]) b += `M${n1(-w / 2)} ${n1(h * u)}H${n1(w / 2)}`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(o.rot ?? 0)})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}><path d="${d}" style="fill:${col};stroke:${ink(col)};stroke-width:${n1(Math.max(1, w * 0.12))}"/><path d="${b}" ${stroke(ink(col), Math.max(0.8, h * 0.024), 'opacity:.55')}/><path d="M${n1(-w * 0.2)} ${n1(-h / 2 + w * 0.6)}V${n1(-w * 0.4)}" ${stroke(lit(col), w * 0.2, 'opacity:.7')}/></g>`;
}
export function dbl(x, y, h, col, o = {}) {
  const w = o.w ?? h * 0.24, r = ((o.rot ?? 0) * Math.PI) / 180, g = w * 0.52, c = Math.cos(r), s = Math.sin(r);
  return rod(x - c * g, y - s * g, h, col, { ...o, w }) + rod(x + c * g, y + s * g, h, col, { ...o, w }) + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(w * 0.3)}" style="fill:${ink(col)}"/>`;
}
export function setOf(list, x, y, k, o = {}) {
  const gap = (o.gap ?? 34) * k, n = list.length; let s = '';
  list.forEach((c, i) => {
    const px = x + (i - (n - 1) / 2) * gap, h = (c.h ? 34 : 54) * k, col = COL[c.c];
    s += c.d ? dbl(px, y, h, col, { rot: o.rot ?? 0 }) : rod(px, y, h, col, { rot: o.rot ?? 0 });
  });
  return s;
}
export function divCell(x, y, r, o = {}) {
  const q = rnd((o.seed ?? 3) + 7), p = o.pinch ?? 0, id = `dc${Math.round(x)}${Math.round(y)}${Math.round(r)}`;
  const rx = r * (1 + 0.14 * p), ry = r * 0.94;
  const d = p > 0.01
    ? `M${n1(x - rx)} ${n1(y)}C${n1(x - rx)} ${n1(y - ry * 1.3)} ${n1(x - rx * 0.3)} ${n1(y - ry)} ${n1(x)} ${n1(y - ry * (1 - 0.72 * p))}C${n1(x + rx * 0.3)} ${n1(y - ry)} ${n1(x + rx)} ${n1(y - ry * 1.3)} ${n1(x + rx)} ${n1(y)}C${n1(x + rx)} ${n1(y + ry * 1.3)} ${n1(x + rx * 0.3)} ${n1(y + ry)} ${n1(x)} ${n1(y + ry * (1 - 0.72 * p))}C${n1(x - rx * 0.3)} ${n1(y + ry)} ${n1(x - rx)} ${n1(y + ry * 1.3)} ${n1(x - rx)} ${n1(y)}Z`
    : blobPath(x, y, rx, ry, o.seed ?? 3, 0.04, 10);
  let dots = '';
  const n = Math.round(14 + r * 0.5);
  for (let i = 0; i < n; i++) { const a = q() * 6.28, k = 0.5 + q() * 0.4; dots += `<circle cx="${n1(x + Math.cos(a) * rx * k)}" cy="${n1(y + Math.sin(a) * ry * k * (p ? 0.7 : 1))}" r="${n1(1 + q() * Math.max(1, r * 0.02))}" style="fill:${T('sea-deep')};opacity:.32"/>`; }
  let s = `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" transform="translate(4 8)" style="fill:${T('strata-6')};opacity:.22;filter:url(#cw-blur3)"/><path d="${d}" style="fill:url(#cw-cyto) ${mx('membrane', 'elev-peak', 30)}"/><g clip-path="url(#${id})"><rect x="${n1(x - rx)}" y="${n1(y - ry * 1.2)}" width="${n1(rx * 2)}" height="${n1(ry * 2.4)}" style="fill:${mx('series-1', 'strata-6', 40)};opacity:.2;filter:url(#cw-grain)"/>${dots}</g>`;
  if (o.ring !== false && !p) s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * 0.66)}" style="fill:url(#cw-nucIn) ${mx('series-5', 'elev-peak', 30)};stroke:${mx('series-5', 'strata-6', 76)};stroke-width:${n1(Math.max(1.4, r * 0.016))};stroke-opacity:.8"/><ellipse cx="${n1(x - r * 0.24)}" cy="${n1(y - r * 0.32)}" rx="${n1(r * 0.18)}" ry="${n1(r * 0.08)}" style="fill:${T('elev-peak')};opacity:.6"/>`;
  s += `<path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'elev-peak', 70)};stroke-width:${n1(Math.max(4, r * 0.05))};opacity:.5;filter:url(#cw-blur1)"/><path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:${n1(Math.max(2, r * 0.018))}"/>`;
  return `<g${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${s}</g>`;
}
export function arrow(x0, y0, x1, y1, o = {}) {
  const a = Math.atan2(y1 - y0, x1 - x0), h = o.h ?? 11, c = o.col ?? mx('strata-5', 'strata-6', 70);
  return `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1 - Math.cos(a) * h)} ${n1(y1 - Math.sin(a) * h)}" ${stroke(c, o.w ?? 4)}/><path d="M${n1(x1)} ${n1(y1)}L${n1(x1 - Math.cos(a + 0.5) * h * 1.5)} ${n1(y1 - Math.sin(a + 0.5) * h * 1.5)}L${n1(x1 - Math.cos(a - 0.5) * h * 1.5)} ${n1(y1 - Math.sin(a - 0.5) * h * 1.5)}Z" style="fill:${c}"/>`;
}
/** A round count badge: a reading sits on a lipped disc so it reads on any cell. */
export function badge(x, y, v, r = 18) {
  return `<circle cx="${n1(x)}" cy="${n1(y + 2)}" r="${r}" style="fill:${mx('strata-5', 'strata-6', 70)}"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" style="fill:${mx('gold', 'elev-peak', 52)};stroke:${mx('gold', 'strata-6', 66)};stroke-width:2.4"/><text x="${n1(x)}" y="${n1(y + r * 0.42)}" text-anchor="middle" style="font-family:var(--sim-font-display);font-size:${n1(r * 1.3)}px;font-weight:700;fill:${T('strata-6')}">${v}</text>`;
}
