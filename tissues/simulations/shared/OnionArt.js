// OnionArt - the red onion on a narrow glass jar, on a window sill (copied from cells L08/OnionRootScene and made
// reusable: unique ids per jar, roots drawn to a measured length, cut tips). Not a scene. SVG strings, tokens only.
//   sill(W, H, gy, id)                 window with daylight, frame bars, a painted sill at gy
//   onionJar(x, y, o)                  y is the sill. o.w, o.h jar size; o.r onion radius; o.len root length in px
//                                      (the longest roots; the rest a little shorter); o.cut: tips cut (blunt, no cap);
//                                      o.seed; o.id unique. Returns { svg, base: [x, y] (bulb base), bottom }
//   rootBits(x, y, n, len, seed)       cut tips lying on the sill
//   ruler(x, y0, cm, k, o)             a vertical ruler from y0 down, cm marks every k px; o.reading cm marks the end
import { stroke } from './PlantArt.js';
import { T, mx, n1, rnd } from './CellWorld.js';

const INK = 'strata-6';
export function sill(W, H, gy, id = 'oa') {
  const fr = mx('strata-1', 'elev-peak', 40), frd = mx('strata-1', 'strata-4', 64);
  let s = `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-shallow', 'elev-peak', 40)}"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'elev-peak', 14)}"/></linearGradient>`
    + `<linearGradient id="${id}-sill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(fr, 'elev-peak', 60)}"/><stop offset="1" style="stop-color:${frd}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" style="fill:${mx('strata-1', 'elev-peak', 30)}"/>`;
  const x0 = W * 0.04, x1 = W * 0.96, y0 = 10, y1 = gy - 8;
  s += `<rect x="${n1(x0)}" y="${y0}" width="${n1(x1 - x0)}" height="${n1(y1 - y0)}" style="fill:url(#${id}-sky) ${T('sea-shallow')}"/>`;
  s += `<ellipse cx="${n1(W * 0.26)}" cy="${n1(gy * 0.8)}" rx="${n1(W * 0.3)}" ry="${n1(gy * 0.16)}" style="fill:${mx('elev-low', 'elev-peak', 60)};opacity:.5;filter:url(#pa-softer)"/><ellipse cx="${n1(W * 0.78)}" cy="${n1(gy * 0.86)}" rx="${n1(W * 0.26)}" ry="${n1(gy * 0.12)}" style="fill:${mx('elev-low', 'elev-peak', 50)};opacity:.45;filter:url(#pa-softer)"/>`;
  s += `<path d="M${n1(x0)} ${y0}L${n1(x0 + W * 0.3)} ${y0}L${n1(x0 + W * 0.12)} ${n1(y1)}L${n1(x0)} ${n1(y1)}Z" style="fill:${T('elev-peak')};opacity:.22"/>`;
  s += `<path d="M${n1(W / 2)} ${y0}V${n1(y1)}M${n1(x0)} ${n1((y0 + y1) * 0.46)}H${n1(x1)}" ${stroke(fr, 10)}/><path d="M${n1(W / 2 + 4)} ${y0}V${n1(y1)}" ${stroke(frd, 2, 'opacity:.6')}/>`;
  s += `<rect x="${n1(x0)}" y="${y0}" width="${n1(x1 - x0)}" height="${n1(y1 - y0)}" style="fill:none;stroke:${fr};stroke-width:12"/>`;
  s += `<rect x="0" y="${n1(gy - 8)}" width="${W}" height="${n1(H - gy + 8)}" style="fill:url(#${id}-sill) ${fr}"/><rect x="0" y="${n1(gy - 8)}" width="${W}" height="5" style="fill:${T('elev-peak')};opacity:.7"/><rect x="0" y="${n1(gy + 10)}" width="${W}" height="${n1(H - gy)}" style="fill:${T(INK)};opacity:.06"/>`;
  return s;
}
// A red onion: papery copper-red skin over purple-red flesh, veins from neck to base, a dry neck, a pale basal plate.
export function onionDefs() {
  const skin = mx(mx('series-6', 'series-4', 55), 'strata-3', 78), flesh = mx('series-4', 'series-5', 70);
  return `<radialGradient id="on-b" cx=".32" cy=".34" r=".9"><stop offset="0" style="stop-color:${mx(skin, 'elev-peak', 50)}"/><stop offset=".5" style="stop-color:${skin}"/><stop offset="1" style="stop-color:${mx(skin, INK, 50)}"/></radialGradient>`
    + `<radialGradient id="on-f" cx=".4" cy=".4" r=".8"><stop offset="0" style="stop-color:${mx(flesh, 'elev-peak', 40)}"/><stop offset="1" style="stop-color:${flesh}"/></radialGradient>`;
}
function onion(x, y, r, seed = 1) {
  const skin = mx(mx('series-6', 'series-4', 55), 'strata-3', 78), q = rnd(seed);
  const b = `M${n1(x - r * 0.1)} ${n1(y - r * 1.0)}C${n1(x - r * 0.3)} ${n1(y - r * 0.86)} ${n1(x - r * 1.12)} ${n1(y - r * 0.62)} ${n1(x - r * 1.1)} ${n1(y + r * 0.04)}C${n1(x - r * 1.08)} ${n1(y + r * 0.64)} ${n1(x - r * 0.56)} ${n1(y + r * 0.9)} ${n1(x - r * 0.18)} ${n1(y + r * 0.94)}H${n1(x + r * 0.18)}C${n1(x + r * 0.56)} ${n1(y + r * 0.9)} ${n1(x + r * 1.08)} ${n1(y + r * 0.64)} ${n1(x + r * 1.1)} ${n1(y + r * 0.04)}C${n1(x + r * 1.12)} ${n1(y - r * 0.62)} ${n1(x + r * 0.3)} ${n1(y - r * 0.86)} ${n1(x + r * 0.1)} ${n1(y - r * 1.0)}Z`;
  let s = `<ellipse cx="${n1(x + 6)}" cy="${n1(y + r * 0.2)}" rx="${n1(r * 1.1)}" ry="${n1(r * 0.86)}" style="fill:${T(INK)};opacity:.18;filter:url(#pa-soft)"/>`;
  s += `<path d="${b}" style="fill:url(#on-b) ${skin};stroke:${mx(skin, INK, 46)};stroke-width:2.2"/>`;
  for (const k of [-0.86, -0.62, -0.38, -0.14, 0.1, 0.34, 0.6, 0.94]) s += `<path d="M${n1(x + k * 0.12 * r)} ${n1(y - r * 0.96)}C${n1(x + k * r * 1.02)} ${n1(y - r * 0.5)} ${n1(x + k * r * 1.12)} ${n1(y + r * 0.4)} ${n1(x + k * 0.18 * r)} ${n1(y + r * 0.92)}" ${stroke(mx(skin, INK, 62), 1.4, 'opacity:.5')}/>`;
  // a papery flake lifting off the skin, and the lit streak on the upper left
  const fx = x + r * (0.3 + q() * 0.3), fy = y - r * 0.2;
  s += `<path d="M${n1(fx)} ${n1(fy)}c${n1(r * 0.2)} ${n1(-r * 0.1)} ${n1(r * 0.4)} ${n1(r * 0.04)} ${n1(r * 0.42)} ${n1(r * 0.3)}c${n1(-r * 0.16)} ${n1(-r * 0.02)} ${n1(-r * 0.3)} ${n1(-r * 0.08)} ${n1(-r * 0.42)} ${n1(-r * 0.3)}z" style="fill:${mx('strata-2', 'elev-peak', 60)};stroke:${mx(skin, INK, 46)};stroke-width:1.2;opacity:.85"/>`;
  s += `<path d="M${n1(x - r * 0.76)} ${n1(y - r * 0.36)}C${n1(x - r * 0.66)} ${n1(y - r * 0.66)} ${n1(x - r * 0.42)} ${n1(y - r * 0.8)} ${n1(x - r * 0.26)} ${n1(y - r * 0.84)}" ${stroke(mx('elev-peak', skin, 60), Math.max(3, r * 0.09), 'opacity:.7')}/>`;
  const nk = mx('strata-2', 'strata-3', 50);
  s += `<path d="M${n1(x - r * 0.12)} ${n1(y - r * 0.98)}C${n1(x - r * 0.14)} ${n1(y - r * 1.24)} ${n1(x - r * 0.06)} ${n1(y - r * 1.4)} ${n1(x - r * 0.18)} ${n1(y - r * 1.62)}L${n1(x + r * 0.02)} ${n1(y - r * 1.44)}L${n1(x + r * 0.16)} ${n1(y - r * 1.58)}C${n1(x + r * 0.1)} ${n1(y - r * 1.36)} ${n1(x + r * 0.14)} ${n1(y - r * 1.2)} ${n1(x + r * 0.12)} ${n1(y - r * 0.98)}Z" style="fill:${nk};stroke:${mx(nk, INK, 50)};stroke-width:1.6"/>`;
  s += `<ellipse cx="${n1(x)}" cy="${n1(y + r * 0.94)}" rx="${n1(r * 0.3)}" ry="${n1(r * 0.08)}" style="fill:${mx('strata-1', 'elev-peak', 50)};stroke:${mx('strata-2', INK, 60)};stroke-width:1.4"/>`;
  return s;
}
function roots(x, y, len, r, o = {}) {
  if (len <= 0.5) return '';
  const q = rnd(o.seed ?? 5); let s = '';
  for (let i = 0; i < 22; i++) {
    const ox = (q() - 0.5) * r * 0.5, l = len * (i < 4 ? 1 : 0.78 + q() * 0.2), sw = (q() - 0.5) * Math.min(r * 1.1, len * 0.7), ex = x + ox + sw * 0.8, ey = y + l;
    const d = `M${n1(x + ox)} ${n1(y)}C${n1(x + ox + sw * 0.3)} ${n1(y + l * 0.35)} ${n1(x + ox + sw)} ${n1(y + l * 0.6)} ${n1(ex)} ${n1(ey)}`;
    s += `<path d="${d}" ${stroke(mx('strata-1', 'strata-3', 70), 3.2)}/><path d="${d}" ${stroke(mx('elev-peak', 'strata-1', 80), 1.8)}/>`;
    s += o.cut ? `<path d="M${n1(ex - 2.4)} ${n1(ey)}h4.8" ${stroke(mx('strata-2', 'strata-3', 60), 2.2)}/>` : `<circle cx="${n1(ex)}" cy="${n1(ey)}" r="1.9" style="fill:${mx('gold', 'elev-peak', 50)}"/>`;
  }
  return s;
}
export function onionJar(x, y, o = {}) {
  const w = o.w ?? 120, h = o.h ?? 210, onionR = o.r ?? 50, id = o.id ?? 'oj';
  const nx = w * 0.3, top = y - h;
  let s = `<ellipse cx="${n1(x + 6)}" cy="${n1(y + 4)}" rx="${n1(w * 0.56)}" ry="9" style="fill:${T(INK)};opacity:.28"/>`;
  const body = `M${n1(x - nx)} ${n1(top)}V${n1(top + h * 0.1)}C${n1(x - nx)} ${n1(top + h * 0.18)} ${n1(x - w / 2)} ${n1(top + h * 0.18)} ${n1(x - w / 2)} ${n1(top + h * 0.3)}V${n1(y - 16)}Q${n1(x - w / 2)} ${n1(y)} ${n1(x - w / 2 + 16)} ${n1(y)}H${n1(x + w / 2 - 16)}Q${n1(x + w / 2)} ${n1(y)} ${n1(x + w / 2)} ${n1(y - 16)}V${n1(top + h * 0.3)}C${n1(x + w / 2)} ${n1(top + h * 0.18)} ${n1(x + nx)} ${n1(top + h * 0.18)} ${n1(x + nx)} ${n1(top + h * 0.1)}V${n1(top)}Z`;
  const base = [x, top + onionR * 0.2];
  s += `<clipPath id="${id}-j"><path d="${body}"/></clipPath><path d="${body}" style="fill:${mx('sea-shallow', 'elev-peak', 16)};opacity:.55"/>`;
  s += `<g clip-path="url(#${id}-j)"><rect x="${n1(x - w)}" y="${n1(top + onionR * 0.12)}" width="${n1(w * 2)}" height="${n1(h)}" style="fill:${mx('sea-shallow', 'elev-peak', 56)};opacity:.62"/><ellipse cx="${n1(x)}" cy="${n1(top + onionR * 0.12)}" rx="${n1(w * 0.3)}" ry="4" style="fill:${mx('sea-shallow', 'elev-peak', 34)};opacity:.9"/>${roots(base[0], base[1], o.len ?? 60, onionR, { cut: o.cut, seed: o.seed })}</g>`;
  s += onion(x, top - onionR * 0.72, onionR, o.seed ?? 1);
  s += `<path d="${body}" ${stroke(mx('sea-shallow', 'strata-6', 56), 3.4)}/><path d="M${n1(x - w / 2 + 11)} ${n1(top + h * 0.34)}V${n1(y - 26)}" ${stroke(T('elev-peak'), 6, 'opacity:.7')}/><path d="M${n1(x + w / 2 - 12)} ${n1(top + h * 0.4)}V${n1(y - 34)}" ${stroke(T('elev-peak'), 2.6, 'opacity:.5')}/>`;
  return { svg: s, base, bottom: y - 10, top };
}
export function rootBits(x, y, n, len, seed = 3) {
  const q = rnd(seed); let s = '';
  for (let i = 0; i < n; i++) {
    const bx = x + (q() - 0.5) * 50, by = y + (q() - 0.5) * 10, a = (q() - 0.5) * 1.2, ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len * 0.3;
    const d = `M${n1(bx)} ${n1(by)}Q${n1((bx + ex) / 2)} ${n1((by + ey) / 2 - 4)} ${n1(ex)} ${n1(ey)}`;
    s += `<path d="${d}" ${stroke(mx('strata-2', 'strata-6', 60), 5.4)}/><path d="${d}" ${stroke(mx('elev-peak', 'strata-1', 80), 3.4)}/><circle cx="${n1(ex)}" cy="${n1(ey)}" r="2.6" style="fill:${mx('gold', 'elev-peak', 50)}"/>`;
  }
  return s;
}
export function ruler(x, y0, cm, k, o = {}) {
  const h = cm * k + 10, wood = mx('strata-1', 'elev-peak', 50);
  let s = `<rect x="${n1(x + 3)}" y="${n1(y0 - 4)}" width="22" height="${n1(h)}" rx="3" style="fill:${T(INK)};opacity:.2"/><rect x="${n1(x)}" y="${n1(y0 - 6)}" width="22" height="${n1(h)}" rx="3" style="fill:${wood};stroke:${mx('strata-2', INK, 50)};stroke-width:1.6"/>`;
  for (let i = 0; i <= cm * 2; i++) { const yy = y0 + (i * k) / 2; s += `<path d="M${n1(x)} ${n1(yy)}h${i % 2 ? 6 : 11}" ${stroke(mx('strata-2', INK, 70), 1.6)}/>`; }
  if (o.reading != null) { const yy = y0 + o.reading * k; s += `<path d="M${n1(x - 30)} ${n1(yy)}H${n1(x + 22)}" ${stroke(T('series-6'), 2.4, 'stroke-dasharray:4 3')}/>`; }
  s += `<path d="M${n1(x - 30)} ${n1(y0)}H${n1(x)}" ${stroke(mx('strata-2', INK, 70), 2, 'stroke-dasharray:3 3')}/>`;
  return s;
}
