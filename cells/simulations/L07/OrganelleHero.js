// OrganelleHero.js - the two big cut-away organelles of the energy lesson. Not a scene. SVG strings, tokens only, no
// faces, no words. A mitochondrion and a chloroplast drawn large: folds, stacked discs, own DNA, own ribosomes.
//   mitoHero(cx, cy, rx, ry, o)     o.fold 0..1 depth of the cristae, o.dim(name) -> opacity, o.rot degrees, o.seed
//                                   parts: outer, space, inner, matrix, dna, ribo
//   mitoLength(rx, ry, fold)        length of the drawn inner membrane, in stage px: the slider reading is measured
//   chloroHero(cx, cy, rx, ry, o)   o.dim(name), o.rot, o.seed. parts: outer, inner, stroma, discs, starch, dna, ribo
import { n1, rnd, mx, T, stroke } from '../shared/CellWorld.js';

const W_ = T('elev-peak'), INK = T('strata-6');
const tint = (n, p) => mx(n, W_, p), deep = (n, p) => mx(n, INK, p);
const G = (a, body) => `<g opacity="${a}">${body}</g>`;
const poly = (p, close = true) => `M${p.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L')}${close ? 'Z' : ''}`;

/** The outline of a capsule: a superellipse. */
function capsule(cx, cy, rx, ry, n = 96, pw = 3.2) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    p.push([cx + Math.sign(c) * Math.abs(c) ** (2 / pw) * rx, cy + Math.sign(s) * Math.abs(s) ** (2 / pw) * ry]);
  }
  return p;
}
const yEdge = (u, ry, pw = 3.2) => ry * (1 - Math.abs(u) ** pw) ** (1 / pw);

/** Corner cutting: rounds every corner of a closed list of points. */
function smooth(p, passes = 2) {
  let q = p;
  for (let k = 0; k < passes; k++) {
    const r = [];
    for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; r.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    q = r;
  }
  return q;
}
// x (-1..1), root half-width, reach share, lean of the tip; hand-set so the folds look grown, not ruled
const FINGERS = [
  [-0.74, 1.05, 0.82, 0.05, true], [-0.56, 0.95, 0.9, -0.03, false], [-0.36, 1.15, 0.98, 0.04, true], [-0.15, 1, 0.8, 0.03, false],
  [0.05, 1.2, 0.92, -0.04, true], [0.25, 1, 1, 0.02, false], [0.46, 1.1, 0.86, -0.03, true], [0.66, 0.95, 0.84, 0.05, false],
];
/** The inner membrane as a list of points, walked clockwise from the left end: fingers in from the top, then from the bottom. */
function innerPts(cx, cy, rx, ry, fold) {
  const pts = [], reach = ry * 1.42 * fold, w0 = rx * 0.058;
  const edge = (sign) => {
    const list = FINGERS.filter((f) => f[4] === (sign < 0)).sort((a, b) => (sign < 0 ? a[0] - b[0] : b[0] - a[0]));
    const steps = 40; let next = 0;
    for (let i = 0; i <= steps; i++) {
      const u = sign < 0 ? -0.985 + (1.97 * i) / steps : 0.985 - (1.97 * i) / steps, here = u * rx, f = list[next];
      if (f && ((sign < 0 && u >= f[0]) || (sign > 0 && u <= f[0]))) {
        next += 1;
        const fx = f[0] * rx, w = w0 * f[1], y0 = sign * yEdge(f[0], ry), lim = Math.abs(y0) * 2 - ry * 0.3, d = Math.min(reach * f[2], lim), lean = f[3] * rx * fold;
        if (d > w * 0.6) {
          const s = sign < 0 ? -1 : 1, a = fx + s * w * 1.15, b = fx - s * w * 1.15, tip = y0 - sign * d, n = 6;
          pts.push([cx + a, cy + yEdge(a / rx, ry) * sign]);
          pts.push([cx + fx + s * w * 0.86 + lean * 0.4, cy + y0 - sign * d * 0.4]);
          pts.push([cx + fx + s * w * 0.8 + lean * 0.8, cy + y0 - sign * d * 0.76]);
          for (let k = 1; k < n; k++) { const t = (k / n) * Math.PI; pts.push([cx + fx + lean + s * Math.cos(t) * w * 0.8, cy + tip + sign * (1 - Math.sin(t)) * w * 0.8]); }
          pts.push([cx + fx - s * w * 0.8 + lean * 0.8, cy + y0 - sign * d * 0.76]);
          pts.push([cx + fx - s * w * 0.86 + lean * 0.4, cy + y0 - sign * d * 0.4]);
          pts.push([cx + b, cy + yEdge(b / rx, ry) * sign]);
          continue;
        }
      }
      pts.push([cx + here, cy + sign * yEdge(u, ry)]);
    }
  };
  edge(-1); edge(1);
  return smooth(pts, 3);
}
const pathLen = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; };
export const mitoLength = (rx, ry, fold) => pathLen(innerPts(0, 0, rx * 0.9, ry * 0.8, fold));

export function mitoHero(cx, cy, rx, ry, o = {}) {
  const dim = o.dim ?? (() => 1), q = rnd(o.seed ?? 5), fold = o.fold ?? 1, b = 'series-8', mem = 'series-4';
  const out = poly(capsule(0, 0, rx, ry)), rimIn = poly(capsule(0, 0, rx * 0.955, ry * 0.91)), inP = innerPts(0, 0, rx * 0.9, ry * 0.8, fold), inner = poly(inP);
  const id = `mh${Math.round(rx)}${Math.round(fold * 100)}`;
  const defs = `<defs><radialGradient id="${id}o" cx=".34" cy=".2" r=".95"><stop offset="0" style="stop-color:${tint(b, 58)}"/><stop offset=".5" style="stop-color:${T(b)}"/><stop offset="1" style="stop-color:${deep(b, 58)}"/></radialGradient>
<radialGradient id="${id}m" cx=".4" cy=".3" r=".9"><stop offset="0" style="stop-color:${tint('series-2', 18)}"/><stop offset=".6" style="stop-color:${tint('series-2', 40)}"/><stop offset="1" style="stop-color:${tint('series-8', 56)}"/></radialGradient>
<clipPath id="${id}c"><path d="${inner}"/></clipPath></defs>`;
  let s = `<ellipse cx="10" cy="${n1(ry * 0.2)}" rx="${n1(rx * 0.98)}" ry="${n1(ry * 0.94)}" style="fill:${INK};opacity:.26;filter:url(#cw-blur3)"/>`;
  // outer membrane, smooth, thick, lit from top left
  s += G(dim('outer'), `<path d="${out}" style="fill:url(#${id}o) ${T(b)};stroke:${deep(b, 56)};stroke-width:3"/><path d="M${n1(-rx * 0.8)} ${n1(-ry * 0.72)}Q${n1(-rx * 0.3)} ${n1(-ry * 1.0)} ${n1(rx * 0.42)} ${n1(-ry * 0.9)}" ${stroke(tint(b, 26), Math.max(3, ry * 0.05))} opacity=".75"/>`);
  // intermembrane space
  s += G(dim('space'), `<path d="${rimIn}" style="fill:${tint(b, 62)};stroke:${deep(b, 66)};stroke-width:1.6"/>`);
  let pore = '';
  for (let i = 0; i < 46; i++) { const a = (i / 46) * 6.283, c = Math.cos(a), sn = Math.sin(a), k = 0.975; pore += `<circle cx="${n1(Math.sign(c) * Math.abs(c) ** 0.625 * rx * k)}" cy="${n1(Math.sign(sn) * Math.abs(sn) ** 0.625 * ry * (k - 0.015))}" r="${n1(Math.max(1.3, rx * 0.0075))}" style="fill:${deep(b, 50)};opacity:.5"/>`; }
  s += G(dim('outer'), pore);
  // matrix, grainy
  let grain = '';
  for (let i = 0; i < 90; i++) grain += `<circle cx="${n1((q() - 0.5) * rx * 1.8)}" cy="${n1((q() - 0.5) * ry * 1.6)}" r="${n1(0.8 + q() * 1.5)}" style="fill:${deep(b, 66)};opacity:${n1(0.12 + q() * 0.2)}"/>`;
  s += G(dim('matrix'), `<path d="${inner}" style="fill:url(#${id}m) ${tint('series-2', 30)}"/><g clip-path="url(#${id}c)">${grain}<path d="${inner}" ${stroke(deep(b, 40), 16, 'filter:url(#cw-blur1)')} opacity=".22"/></g>`);
  // ribosomes and DNA loops in the matrix
  const u = Math.max(2.2, rx * 0.012);
  let rib = '';
  const slots = [[-0.62, 0.42], [-0.5, -0.3], [-0.2, 0.46], [0.08, -0.42], [0.36, 0.44], [0.62, -0.34], [0.72, 0.28], [-0.74, 0.08], [0.2, 0.1], [-0.08, 0.05], [0.52, 0.06], [-0.34, 0.12]];
  for (const [a, c] of slots) rib += `<circle cx="${n1(a * rx)}" cy="${n1(c * ry)}" r="${n1(u * 1.5)}" style="fill:url(#cw-ribo) ${T('sea-deep')}"/><circle cx="${n1(a * rx + u * 2.6)}" cy="${n1(c * ry + u)}" r="${n1(u)}" style="fill:url(#cw-ribo) ${T('sea-deep')}"/>`;
  s += G(dim('ribo'), rib);
  const dx = -rx * 0.28, dy = ry * 0.32, loop = `M${n1(dx - 22)} ${n1(dy)}c-8 -20 18 -30 26 -14s26 -8 28 8s-20 24 -30 12s-20 12 -24 -6Z`;
  s += G(dim('dna'), `<path d="${loop}" ${stroke(deep('series-6', 70), Math.max(3, u * 1.2))}/><path d="${loop}" ${stroke(tint('series-6', 54), Math.max(1.4, u * 0.6))}/>`);
  // the inner membrane: a thick double-lined ribbon
  const iw = Math.max(5.4, rx * 0.03);
  s += G(dim('inner'), `<path d="${inner}" ${stroke(deep(mem, 62), iw + 3)} stroke-linejoin="round"/><path d="${inner}" ${stroke(T(mem), iw)} stroke-linejoin="round"/><path d="${inner}" ${stroke(tint(mem, 42), iw * 0.36)} stroke-linejoin="round"/>`);
  return `${defs}<g transform="translate(${n1(cx)} ${n1(cy)}) rotate(${o.rot ?? -6})">${s}</g>`;
}

export function chloroHero(cx, cy, rx, ry, o = {}) {
  const dim = o.dim ?? (() => 1), q = rnd(o.seed ?? 8), c = 'chloro';
  const lens = (a, b) => { const p = []; for (let i = 0; i < 90; i++) { const t = (i / 90) * 6.283; p.push([Math.cos(t) * a * (1 + 0.04 * Math.cos(2 * t)), Math.sin(t) * b * (1 - 0.06 * Math.cos(t) * Math.sin(t))]); } return poly(p); };
  const out = lens(rx, ry), inn = lens(rx * 0.945, ry * 0.9), core = lens(rx * 0.9, ry * 0.82), id = `ch${Math.round(rx)}`;
  const defs = `<defs><radialGradient id="${id}o" cx=".32" cy=".22" r=".95"><stop offset="0" style="stop-color:${tint(c, 54)}"/><stop offset=".5" style="stop-color:${T(c)}"/><stop offset="1" style="stop-color:${deep(c, 56)}"/></radialGradient>
<radialGradient id="${id}s" cx=".4" cy=".32" r=".85"><stop offset="0" style="stop-color:${mx('elev-peak', 'chloro', 74)}"/><stop offset=".6" style="stop-color:${tint(c, 44)}"/><stop offset="1" style="stop-color:${tint(c, 64)}"/></radialGradient>
<linearGradient id="${id}d" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${tint(c, 56)}"/><stop offset=".45" style="stop-color:${tint(c, 80)}"/><stop offset="1" style="stop-color:${deep(c, 70)}"/></linearGradient>
<clipPath id="${id}c"><path d="${core}"/></clipPath></defs>`;
  let s = `<ellipse cx="10" cy="${n1(ry * 0.2)}" rx="${n1(rx * 0.98)}" ry="${n1(ry * 0.92)}" style="fill:${INK};opacity:.26;filter:url(#cw-blur3)"/>`;
  s += G(dim('outer'), `<path d="${out}" style="fill:url(#${id}o) ${T(c)};stroke:${deep(c, 54)};stroke-width:3"/><path d="M${n1(-rx * 0.72)} ${n1(-ry * 0.62)}Q${n1(-rx * 0.2)} ${n1(-ry * 1.02)} ${n1(rx * 0.4)} ${n1(-ry * 0.84)}" ${stroke(tint(c, 30), Math.max(3, ry * 0.05))} opacity=".7"/>`);
  s += G(dim('inner'), `<path d="${inn}" style="fill:${deep(c, 76)};stroke:${tint(c, 60)};stroke-width:2.4"/>`);
  let grain = '';
  for (let i = 0; i < 110; i++) grain += `<circle cx="${n1((q() - 0.5) * rx * 1.8)}" cy="${n1((q() - 0.5) * ry * 1.7)}" r="${n1(0.8 + q() * 1.5)}" style="fill:${deep(c, 58)};opacity:${n1(0.12 + q() * 0.22)}"/>`;
  s += G(dim('stroma'), `<path d="${core}" style="fill:url(#${id}s) ${tint(c, 50)}"/><g clip-path="url(#${id}c)">${grain}</g>`);
  // sheets joining the stacks, then the stacks of discs: each disc a coin with a lit top
  const stacks = [[-0.6, 0.06, 5], [-0.34, -0.38, 6], [-0.26, 0.36, 7], [0.02, -0.08, 8], [0.28, -0.46, 5], [0.3, 0.4, 6], [0.58, -0.02, 6]];
  const dw = rx * 0.105, dh = Math.max(4.8, ry * 0.058);
  let sheet = '', st = '';
  for (let i = 0; i < stacks.length - 1; i++) { const [a, b] = stacks[i], [e, f] = stacks[i + 1]; sheet += `M${n1(a * rx)} ${n1(b * ry)}Q${n1(((a + e) / 2) * rx)} ${n1(((b + f) / 2 + 0.16) * ry)} ${n1(e * rx)} ${n1(f * ry)}`; }
  sheet += `M${n1(stacks[0][0] * rx)} ${n1(stacks[0][1] * ry)}L${n1(stacks[2][0] * rx)} ${n1(stacks[2][1] * ry)}M${n1(stacks[3][0] * rx)} ${n1(stacks[3][1] * ry)}L${n1(stacks[5][0] * rx)} ${n1(stacks[5][1] * ry)}`;
  for (const [a, b, n] of stacks) {
    const x = a * rx, y0 = b * ry, shade = `<ellipse cx="${n1(x + 4)}" cy="${n1(y0 + (n * dh) / 2 + 4)}" rx="${n1(dw * 1.08)}" ry="${n1(dh * 0.9)}" style="fill:${deep(c, 40)};opacity:.32;filter:url(#cw-blur1)"/>`;
    st += shade;
    for (let i = n - 1; i >= 0; i--) {
      const y = y0 + (i - (n - 1) / 2) * dh;
      st += `<path d="M${n1(x - dw)} ${n1(y - dh * 0.35)}a${n1(dw)} ${n1(dh * 0.62)} 0 0 1 ${n1(2 * dw)} 0v${n1(dh * 0.7)}a${n1(dw)} ${n1(dh * 0.62)} 0 0 1 ${n1(-2 * dw)} 0Z" style="fill:url(#${id}d) ${T(c)};stroke:${deep(c, 50)};stroke-width:1.1"/>`;
    }
    st += `<ellipse cx="${n1(x)}" cy="${n1(y0 - ((n - 1) / 2) * dh - dh * 0.35)}" rx="${n1(dw * 0.96)}" ry="${n1(dh * 0.56)}" style="fill:${tint(c, 34)};stroke:${deep(c, 56)};stroke-width:1"/><ellipse cx="${n1(x - dw * 0.3)}" cy="${n1(y0 - ((n - 1) / 2) * dh - dh * 0.42)}" rx="${n1(dw * 0.3)}" ry="${n1(dh * 0.18)}" style="fill:${W_};opacity:.6"/>`;
  }
  s += G(dim('discs'), `<path d="${sheet}" ${stroke(deep(c, 70), Math.max(3.4, ry * 0.05))}/><path d="${sheet}" ${stroke(tint(c, 70), Math.max(1.4, ry * 0.02))}/>${st}`);
  // starch granules, DNA, ribosomes in the stroma
  let star = '';
  for (const [a, b, r, t] of [[-0.74, -0.2, 0.09, 20], [0.05, 0.54, 0.1, -14], [0.72, 0.28, 0.085, 40], [0.05, -0.6, 0.07, 10]]) {
    star += `<g transform="translate(${n1(a * rx)} ${n1(b * ry)}) rotate(${t})"><ellipse rx="${n1(r * ry * 2.1)}" ry="${n1(r * ry * 1.35)}" style="fill:url(#cw-incl) ${T('series-2')};stroke:${deep('series-2', 62)};stroke-width:1.6"/><ellipse cx="${n1(-r * ry * 0.6)}" cy="${n1(-r * ry * 0.5)}" rx="${n1(r * ry * 0.7)}" ry="${n1(r * ry * 0.3)}" style="fill:${W_};opacity:.7"/></g>`;
  }
  s += G(dim('starch'), star);
  const u = Math.max(2.1, rx * 0.011); let rib = '';
  for (const [a, b] of [[-0.48, -0.1], [-0.12, -0.42], [0.18, 0.18], [0.46, -0.3], [0.46, 0.2], [-0.48, 0.42], [0.72, -0.2], [-0.05, 0.28]]) rib += `<circle cx="${n1(a * rx)}" cy="${n1(b * ry)}" r="${n1(u * 1.45)}" style="fill:url(#cw-ribo) ${T('sea-deep')}"/><circle cx="${n1(a * rx + u * 2.4)}" cy="${n1(b * ry + u)}" r="${n1(u)}" style="fill:url(#cw-ribo) ${T('sea-deep')}"/>`;
  s += G(dim('ribo'), rib);
  const dx = rx * 0.46, dy = -ry * 0.56, loop = `M${n1(dx - 22)} ${n1(dy)}c-8 -18 18 -28 26 -13s26 -8 28 8s-20 22 -30 11s-20 12 -24 -6Z`;
  s += G(dim('dna'), `<path d="${loop}" ${stroke(deep('series-6', 70), Math.max(3, u * 1.2))}/><path d="${loop}" ${stroke(tint('series-6', 54), Math.max(1.4, u * 0.6))}/>`);
  return `${defs}<g transform="translate(${n1(cx)} ${n1(cy)}) rotate(${o.rot ?? -9})">${s}</g>`;
}
