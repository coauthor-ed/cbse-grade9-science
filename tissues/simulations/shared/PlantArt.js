// PlantArt.js - drawn plants and garden things for the reproduction module, plus the small word, frame and control
// helpers its SVG scenes share. Not a scene. No faces, no colour literals: every colour is a recipe over sim tokens,
// so canvas and SVG read the same art. The art is daylight in both themes: ink on it comes from ART_INK or label().
// Text is the scene's job: nothing in the art writes a word.
//
// Two ways to draw every thing, same arguments after the first two:
//   canvas  drawRose(ctx, c, x, y, s, o)   c = this.colors of a scene with COLOR_MAP = PLANT_COLOR_MAP
//   SVG     svgRose(x, y, s, o)            returns a string, one closed <g>
// Every o also takes rot (degrees), flip (true mirrors), alpha (0..1).
//
//   Soil        origin top-left of the ground; o.w, o.h, o.seed, o.compost (true: pale flecks)
//   SkyWall     origin top-left; o.w, o.h. Day sky, a far hedge and a low brick garden wall; o.wallY (from top)
//   Pot         origin middle of the soil line; 120 wide, 86 tall. o.w (width)
//   Stem        origin foot, grows up; o.len, o.nodes (number), o.w, o.leaves ([u, side, len]: u 0..1 up the stem)
//   Leaf        origin base, points up; o.len, o.wide, o.teeth (0: smooth), o.sick 0..1
//   Rose        origin middle of the bloom; about 44 wide. o.tint 'red' 'pink' 'yellow' 'wild'; o.open 0..1 (0 a bud)
//   RosePlant   origin foot; about 170 tall. o.blooms (0..3), o.tint, o.sick 0..1, o.seed, o.grow 0..1
//   Roots       origin top; hangs down. o.grow 0..1, o.spread, o.seed
//   Potato      origin middle; 90 long. o.sprout 0..1
//   Ginger      origin middle; 100 long. o.sprout 0..1
//   Sugarcane   origin foot; o.len, o.w. A jointed green-yellow stem with a bud at each node. o.sprout 0..1
//   MoneyLeaf   a run of heart leaves on a trailing stem, origin left end; o.len, o.n, o.rootlet (true)
//   Bryophyllum origin base of a thick scalloped leaf, points up; 130 long. o.grow 0..1 plantlets in the notches
//   Banana      origin foot; about 230 tall. o.bunch (true), o.size 0..1. A soft trunk, broad torn leaves, a hanging bunch
//   BananaLet   origin foot; a small banana plantlet, 40 tall
//   LemonTree   origin foot; about 170 tall. o.fruit (true), o.mango (true: longer leaves, red-gold fruit), o.seed
//   Foliage     a mass of real leaves, origin middle. o.rx, o.ry, o.n, o.seed, o.long (true)
//   Bottle      origin foot; a culture bottle with gel, 90 by 130. o.lets (0..12 plantlets), o.tip (true: one shoot tip)
//   Can         origin foot; a watering can 90 long. Spout right
//   Knife       origin handle end; a gardener's knife 70 long
//
// Helpers:
//   PLANT_COLOR_MAP, plantColour(c, role), svgPlantColour(role)
//   ART_INK, ART_PALE         ink on the art, its halo
//   words, label, labelWhite, leader, frame(st, id, body), anim(scene, key, html), ctlBar(scene, items, onChange)
//     ctlBar items: { kind: 'range', id, label, min, max, step, value, read, say }
//                   { kind: 'seg', id, label, options: [{ value, label }], value } { kind: 'btn', id, label, go }
//     returns { set, get, label, show, disable, destroy }. A row under the stage in the root; survives repaint.
// A predict setup: paint reads step = this.hostRole === 'setup' ? SETUP : this.stepIndex, so any beat the host sends lands right.
import { mix, darken } from 'simulations/base/kit/SimLook.js';
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';

export const PLANT_COLOR_MAP = GEO_COLOR_MAP;

const TOKEN = {
  skyDay: '--sim-sky-day', seaDeep: '--sim-sea-deep', seaShallow: '--sim-sea-shallow',
  elevLow: '--sim-elev-low', elevMid: '--sim-elev-mid', elevHigh: '--sim-elev-high', elevPeak: '--sim-elev-peak',
  ice: '--sim-ice', strata1: '--sim-strata-1', strata2: '--sim-strata-2', strata3: '--sim-strata-3',
  strata4: '--sim-strata-4', strata5: '--sim-strata-5', strata6: '--sim-strata-6', magma: '--sim-magma', gold: '--sim-gold',
};
const m = (a, b, t) => ({ a, b, t });
const dk = (a, t) => ({ a, dark: t });
const R = {
  leaf: m('elevLow', 'strata6', 0.14), leafDark: m('elevLow', 'strata6', 0.42), leafLit: m('elevLow', 'gold', 0.3),
  leafDeep: dk(m('elevLow', 'seaDeep', 0.5), 0.2), vein: m('elevLow', 'gold', 0.5), stem: m('elevLow', 'strata3', 0.42), stemDark: m('strata3', 'strata6', 0.45),
  stemLit: m('elevLow', 'gold', 0.42), sick: m('gold', 'strata3', 0.52), sickDark: m('strata3', 'strata6', 0.5),
  soil: m('strata3', 'strata6', 0.2), soilLit: m('strata3', 'strata2', 0.42), soilDeep: m('strata3', 'strata6', 0.46), crumb: m('strata3', 'strata1', 0.3), compost: m('strata2', 'strata1', 0.5),
  root: m('strata1', 'elevPeak', 0.34), rootDark: m('strata1', 'strata3', 0.5),
  pot: m('strata2', 'magma', 0.3), potDark: m('strata3', 'magma', 0.26), potLit: m('strata2', 'strata1', 0.5),
  brick: m('strata2', 'strata1', 0.62), brickLit: m('strata2', 'strata3', 0.3), mortar: m('strata1', 'elevPeak', 0.46),
  hedge: m('elevLow', 'seaDeep', 0.4), hedgeLit: m('elevLow', 'skyDay', 0.34), sky: 'skyDay', skyPale: m('skyDay', 'elevPeak', 0.5),
  red: m('magma', 'strata3', 0.1), redDark: m('magma', 'strata6', 0.42), redLit: m('magma', 'elevPeak', 0.3),
  pink: m('magma', 'elevPeak', 0.56), pinkDark: m('magma', 'elevPeak', 0.2), pinkLit: m('magma', 'elevPeak', 0.76),
  yellow: m('strata1', 'gold', 0.3), yellowDark: m('gold', 'strata2', 0.3), yellowLit: m('strata1', 'elevPeak', 0.56),
  wild: m('elevPeak', 'magma', 0.2), wildDark: m('magma', 'elevPeak', 0.44), wildLit: 'elevPeak',
  tuber: m('strata2', 'strata1', 0.5), tuberDark: m('strata3', 'strata2', 0.4), tuberLit: m('strata1', 'elevPeak', 0.3),
  cane: m('elevLow', 'gold', 0.5), caneDark: m('strata3', 'elevLow', 0.4), caneLit: m('gold', 'elevPeak', 0.34),
  banana: m('strata1', 'elevMid', 0.36), bananaDark: m('elevMid', 'strata3', 0.5), budPurple: m('magma', 'seaDeep', 0.56),
  trunkSoft: m('elevLow', 'strata1', 0.5), trunkSoftDark: m('elevLow', 'strata3', 0.5),
  lemon: m('strata1', 'gold', 0.14), mango: m('strata1', 'magma', 0.42), bark: m('strata3', 'strata6', 0.36), barkDark: m('strata3', 'strata6', 0.7), barkLit: m('strata3', 'strata1', 0.4),
  glass: m('elevPeak', 'ice', 0.4), glassEdge: m('ice', 'strata5', 0.42), glassLit: 'elevPeak', gel: m('gold', 'elevPeak', 0.42), gelDark: m('gold', 'strata2', 0.42),
  metal: m('strata5', 'elevPeak', 0.5), metalDark: 'strata5', metalLit: m('strata5', 'elevPeak', 0.78), wood: 'strata3', woodDark: m('strata3', 'strata6', 0.5),
  ink: dk('strata6', 0.3), pale: 'elevPeak', cloud: 'elevPeak', cloudShade: m('elevPeak', 'strata5', 0.2), water: m('seaShallow', 'seaDeep', 0.3), waterLit: m('seaShallow', 'elevPeak', 0.46),
};
const FALLBACK = { skyDay: 's1', seaDeep: 's5', seaShallow: 's7', elevLow: 's3', elevMid: 's3', elevHigh: 's8', elevPeak: 'bgSurface', strata1: 's2', strata2: 's8', strata3: 's8', strata4: 's3', strata5: 'stroke', strata6: 'stroke', ice: 'glass', magma: 'bad' };
function cc(c, r) {
  if (typeof r === 'string') {
    if (R[r] !== undefined && TOKEN[r] === undefined) return cc(c, R[r]);
    return c[r] ?? c[FALLBACK[r]] ?? c.label;
  }
  if (r.dark !== undefined) return darken(cc(c, r.a), r.dark);
  return mix(cc(c, r.a), cc(c, r.b), r.t);
}
function css(r) {
  if (typeof r === 'string') {
    if (R[r] !== undefined && TOKEN[r] === undefined) return css(R[r]);
    return `var(${TOKEN[r]})`;
  }
  if (r.dark !== undefined) return `color-mix(in oklab, ${css(r.a)} ${Math.round((1 - r.dark) * 100)}%, black)`;
  return `color-mix(in oklab, ${css(r.a)} ${Math.round((1 - r.t) * 100)}%, ${css(r.b)})`;
}
export const plantColour = cc;
export const svgPlantColour = css;
export const blend = m;
export const darkenRole = dk;

const n1 = (v) => Math.round(v * 10) / 10;
const circle = (x, y, r) => `M${n1(x - r)} ${n1(y)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0Z`;
const ell = (x, y, rx, ry) => `M${n1(x - rx)} ${n1(y)}a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(2 * rx)} 0a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(-2 * rx)} 0Z`;
const rrect = (x, y, w, h, r) => { const q = Math.min(r, w / 2, h / 2); return `M${n1(x + q)} ${n1(y)}h${n1(w - 2 * q)}a${n1(q)} ${n1(q)} 0 0 1 ${n1(q)} ${n1(q)}v${n1(h - 2 * q)}a${n1(q)} ${n1(q)} 0 0 1 ${n1(-q)} ${n1(q)}h${n1(-(w - 2 * q))}a${n1(q)} ${n1(q)} 0 0 1 ${n1(-q)} ${n1(-q)}v${n1(-(h - 2 * q))}a${n1(q)} ${n1(q)} 0 0 1 ${n1(q)} ${n1(-q)}Z`; };
const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const pathCircle = circle;
export const pathEllipse = ell;
export const pathRoundRect = rrect;

// A fill may be a role, or '#name' for a gradient in artDefs(): canvas falls back on the flat role, and SVG on the role
// too when a page has no artDefs, so an art call outside frame() still draws.
const GRAD = {
  leaf: 'leaf', leafBack: 'leafDark', leafYoung: 'leafLit', leafSick: 'sick', stem: 'stem', bark: 'bark', soil: 'soil', pot: 'pot', tuber: 'tuber', trunk: 'trunkSoft', bananaLeaf: 'leaf',
  red: 'red', pink: 'pink', yellow: 'yellow', wild: 'wild', cane: 'cane', metal: 'metal', glass: 'glass', gel: 'gel', lemon: 'lemon', mango: 'mango', wood: 'wood', fleshy: 'leaf',
};
const flat = (f) => (typeof f === 'string' && f[0] === '#' ? GRAD[f.slice(1)] : f);
const paintOf = (f) => (typeof f === 'string' && f[0] === '#' ? `url(#pa-${f.slice(1)}) ${css(GRAD[f.slice(1)])}` : css(f));
function paintCanvas(ctx, c, prims, x, y, s, o) {
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot * Math.PI / 180);
  ctx.scale(o.flip ? -s : s, s);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const p of prims) {
    const path = new Path2D(p.d);
    const base = ctx.globalAlpha;
    if (p.a !== undefined) ctx.globalAlpha = base * p.a;
    if (p.f) { ctx.fillStyle = cc(c, flat(p.f)); ctx.fill(path); }
    if (p.s) { ctx.strokeStyle = cc(c, p.s); ctx.lineWidth = p.w ?? 2; ctx.stroke(path); }
    ctx.globalAlpha = base;
  }
  ctx.restore();
}
function paintSvg(prims, x, y, s, o) {
  const t = `translate(${n1(x)} ${n1(y)})${o.rot ? ` rotate(${n1(o.rot)})` : ''} scale(${o.flip ? -s : s} ${s})`;
  const body = prims.map((p) => {
    const st = [`fill:${p.f ? paintOf(p.f) : 'none'}`];
    if (p.fx) st.push(`filter:url(#pa-${p.fx})`);
    if (p.s) st.push(`stroke:${css(p.s)}`, `stroke-width:${p.w ?? 2}`, 'stroke-linecap:round', 'stroke-linejoin:round');
    if (p.a !== undefined) st.push(`opacity:${p.a}`);
    return `<path d="${p.d}" style="${st.join(';')}"/>`;
  }).join('');
  return `<g transform="${t}"${o.alpha !== undefined ? ` opacity="${o.alpha}"` : ''}>${body}</g>`;
}
const pair = (build) => [
  (ctx, c, x, y, s = 1, o = {}) => paintCanvas(ctx, c, build(o), x, y, s, o),
  (x, y, s = 1, o = {}) => paintSvg(build(o), x, y, s, o),
];

// -- leaves ---------------------------------------------------------------------
// One blade from (x, y) along ang (radians, 0 = up), its rib bent by o.bend. Width is measured off the rib, so a leaf
// curves like a leaf. Teeth give a saw edge. Side veins run from the rib to the edge.
function bladeGeom(x, y, ang, len, wide, o) {
  const n = o.teeth ? o.teeth * 2 : 12, bend = (o.bend ?? 0) * len, ca = Math.cos(ang), sa = Math.sin(ang);
  const P0 = (t) => { const lx = bend * t * t, ly = -t * len; return [x + lx * ca - ly * sa, y + lx * sa + ly * ca]; };
  const nrm = (t) => { const [a0, b0] = P0(Math.max(0, t - 0.02)), [a1, b1] = P0(Math.min(1, t + 0.02)), q = Math.hypot(a1 - a0, b1 - b0) || 1; return [(b1 - b0) / q, -(a1 - a0) / q]; };
  const W = (t) => Math.sin(Math.PI * Math.pow(t, 0.72)) * wide * 0.5;
  const edge = (sd) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, [px, py] = P0(t), [nx, ny] = nrm(t), w = W(t) * (o.teeth && i % 2 ? 1.14 : o.teeth ? 0.88 : 1) * sd; out.push([px + nx * w, py + ny * w]); } return out; };
  return { P0, nrm, W, a: edge(1), b: edge(-1) };
}
const lineOf = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${n1(p[0])} ${n1(p[1])}`).join('');
function blade(x, y, ang, len, wide, o = {}) {
  const sick = clamp01(o.sick ?? 0), g = bladeGeom(x, y, ang, len, wide, o);
  const rev = [...g.b].reverse();
  const dd = lineOf(g.a) + rev.map((p) => `L${n1(p[0])} ${n1(p[1])}`).join('') + 'Z';
  const shade = lineOf(g.b) + 'Z';
  const main = o.fill ?? (sick > 0.5 ? '#leafSick' : o.back ? '#leafBack' : '#leaf'), rim = o.dark ?? (sick > 0.5 ? 'sickDark' : 'leafDark'), rib = o.lit ?? (sick > 0.5 ? 'sick' : 'vein');
  const out = [{ d: dd, f: main, s: rim, w: 1.3 }, { d: shade, f: rim, a: 0.26 }];
  if (len > 14) {
    let v = ''; const k = len > 34 ? 5 : 3;
    for (let i = 1; i <= k; i++) { const t = i / (k + 1), [px, py] = g.P0(t), [nx, ny] = g.nrm(t), [qx, qy] = g.P0(Math.min(1, t + 0.16)), w = g.W(t) * 0.86; for (const sd of [1, -1]) v += `M${n1(px)} ${n1(py)}L${n1((qx + px) / 2 + nx * w * sd)} ${n1((qy + py) / 2 + ny * w * sd)}`; }
    out.push({ d: v, s: rib, w: 0.8, a: 0.7 });
  }
  const [tx, ty] = g.P0(1), [mx, my] = g.P0(0.5);
  out.push({ d: `M${n1(x)} ${n1(y)}Q${n1(mx)} ${n1(my)} ${n1(tx)} ${n1(ty)}`, s: rib, w: Math.max(1.1, len * 0.03) });
  if (sick > 0) { const [a1, b1] = g.P0(0.42), [a2, b2] = g.P0(0.66); out.push({ d: circle(a1 + 3, b1 + 1, 2 + sick * 2.4) + circle(a2 - 3, b2, 1.6 + sick * 2) + circle(a2 + 2, b2 + 5, 1.2 + sick * 1.4), f: 'sickDark', a: 0.92 }); }
  return out;
}
function leafThing(o) { return blade(0, 0, 0, o.len ?? 44, o.wide ?? 24, o); }
// A mass of small real leaves in three tones, lit from the top left. One path per tone, so hundreds stay cheap.
function foliage(o) {
  const rx = o.rx ?? 70, ry = o.ry ?? 60, n = o.n ?? 170, r = rnd(o.seed ?? 3), L = o.long ? 19 : 14, W2 = o.long ? 4.2 : 5, dd = ['', '', ''];
  const leaf = (x, y, a, q) => { const ca = Math.cos(a), sa = Math.sin(a), T = (u, v) => `${n1(x + u * ca - v * sa)} ${n1(y + u * sa + v * ca)}`, l = L * q, w = W2 * q; return `M${T(0, 0)}Q${T(l * 0.5, -w)} ${T(l, 0)}Q${T(l * 0.5, w)} ${T(0, 0)}Z`; };
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, q = Math.sqrt(r()), x = Math.cos(a) * rx * q, y = Math.sin(a) * ry * q, lit = (-x / rx - y / ry) * 0.5 + (r() - 0.5) * 0.7;
    dd[lit > 0.22 ? 2 : lit > -0.3 ? 1 : 0] += leaf(x, y, r() * 6.28, 0.8 + r() * 0.5);
  }
  return [...(o.sparse ? [] : [{ d: ell(0, 0, rx * 0.96, ry * 0.94), f: 'leafDeep' }]), { d: dd[0], f: 'leafDark' }, { d: dd[1], f: 'leaf' }, { d: dd[2], f: 'leafLit' }];
}

// -- ground and setting ---------------------------------------------------------
function soil(o) {
  const w = o.w ?? 300, h = o.h ?? 80, r = rnd(o.seed ?? 5), sd = o.seed ?? 5, top = [];
  for (let i = 0; i <= 18; i++) top.push([w * i / 18, Math.sin(i * 1.3 + sd) * 2.6 + Math.sin(i * 0.5 + sd) * 2]);
  const edge = lineOf(top), out = [{ d: `${edge}L${n1(w)} ${n1(h)}L0 ${n1(h)}Z`, f: '#soil' }];
  let crumb = '', dark = '', stone = '', flk = '';
  for (let i = 0; i < w / 5; i++) { const x = r() * w, y = 5 + Math.pow(r(), 1.3) * (h - 8), q = 1 + r() * 2.8; if (i % 2) crumb += circle(x, y, q); else dark += ell(x, y, q * 1.5, q); }
  for (let i = 0; i < w / 60; i++) { const x = r() * w, y = 14 + r() * (h - 20), a = 4 + r() * 7; stone += ell(x, y, a, a * 0.62); }
  out.push({ d: dark, f: 'soilDeep', a: 0.7 }, { d: crumb, f: 'crumb', a: 0.75 }, { d: stone, f: 'crumb', s: 'soilDeep', w: 1 });
  if (o.compost) { for (let i = 0; i < w / 9; i++) { const x = r() * w, y = 5 + r() * (h - 9), a = r() * 3; flk += `M${n1(x)} ${n1(y)}q${n1(a + 3)} -2 ${n1(a + 7)} ${n1(a - 1)}`; } out.push({ d: flk, s: 'compost', w: 2 }); }
  let turf = '';
  for (let i = 0; i < w / 3; i++) { const x = r() * w, b = Math.sin(x / w * 18 * 1.3 + sd) * 2.6, h2 = 2 + r() * 4; turf += circle(x, b + r() * 2, h2 * 0.7); }
  out.push({ d: turf, f: 'soilLit' });
  return out;
}
function skyWall(o) {
  // Kept for callers outside this batch: a soft day garden wall.
  const w = o.w ?? 640, h = o.h ?? 300, wy = o.wallY ?? h * 0.62, r = rnd(3), out = [{ d: `M0 0H${n1(w)}V${n1(h)}H0Z`, f: 'skyPale' }];
  let hedge = ''; for (let x = -10; x < w + 20; x += 34) hedge += circle(x, wy - 8 - r() * 8, 26 + r() * 10);
  out.push({ d: hedge, f: 'hedgeLit', a: 0.9 }, { d: `M0 ${n1(wy)}H${n1(w)}V${n1(h)}H0Z`, f: 'mortar' });
  return out;
}
function pot(o) {
  const w = o.w ?? 120, h = w * 0.72, rim = 16;
  return [
    { d: `M${n1(-w * 0.44)} ${n1(rim - 4)}L${n1(-w * 0.34)} ${n1(h)}Q0 ${n1(h + 8)} ${n1(w * 0.34)} ${n1(h)}L${n1(w * 0.44)} ${n1(rim - 4)}Z`, f: '#pot', s: 'potDark', w: 2 },
    { d: `M${n1(-w * 0.44)} ${n1(rim - 2)}Q0 ${n1(rim + 12)} ${n1(w * 0.44)} ${n1(rim - 2)}L${n1(w * 0.43)} ${n1(rim + 6)}Q0 ${n1(rim + 19)} ${n1(-w * 0.43)} ${n1(rim + 6)}Z`, f: 'potDark', a: 0.5 },
    { d: rrect(-w * 0.5, -4, w, rim + 4, 6), f: '#pot', s: 'potDark', w: 2 },
    { d: rrect(-w * 0.45, -2, w * 0.5, 3, 1.5), f: 'potLit', a: 0.8 },
    { d: ell(0, -3, w * 0.45, 6.5), f: 'soilDeep' }, { d: ell(-w * 0.06, -2, w * 0.33, 4.2), f: 'soil' },
  ];
}
function stem(o) {
  const len = o.len ?? 120, w = o.w ?? 7, nodes = o.nodes ?? 4, out = [];
  const body = rrect(-w / 2, -len, w, len, w * 0.3);
  out.push({ d: body, f: '#stem', s: o.dark ?? 'stemDark', w: 1.6 });
  let nd = '', bud = '', hatch = '', thorn = '';
  for (let i = 1; i <= nodes; i++) {
    const y = -len * i / (nodes + 0.6), sd = i % 2 ? 1 : -1;
    nd += `M${n1(-w * 0.62)} ${n1(y + 3)}Q0 ${n1(y - 4)} ${n1(w * 0.62)} ${n1(y + 3)}`;
    hatch += `M${n1(-w * 0.3)} ${n1(y + 8)}l${n1(w * 0.26)} 5`;
    if (o.buds !== false) bud += `M${n1(sd * w * 0.48)} ${n1(y + 1)}q${n1(sd * 7)} -4 ${n1(sd * 4)} -11q${n1(-sd * 5)} 3 ${n1(-sd * 4)} 11Z`;
    if (o.thorns !== false && i < nodes + 1) thorn += `M${n1(-sd * w * 0.5)} ${n1(y - 16)}l${n1(-sd * 6)} 4l${n1(sd * 6)} 3Z`;
  }
  out.push({ d: thorn, f: 'stemDark' }, { d: nd, s: 'stemDark', w: 2.2 }, { d: hatch, s: 'stemDark', w: 1, a: 0.5 });
  if (bud) out.push({ d: bud, f: '#leafYoung', s: 'leafDark', w: 1 });
  for (const [u, side, l] of (o.leaves ?? [])) out.push(...compound(0, -len * u, side, l, o));
  return out;
}
// A rose leaf: a stalk with an end leaflet and side leaflets, serrated.
function compound(x, y, side, l, o) {
  const ang = side * (1.02 + (o.droop ?? 0)), stalk = l * 0.5, ex = x + Math.sin(ang) * stalk, ey = y - Math.cos(ang) * stalk;
  const out = [{ d: `M${n1(x)} ${n1(y)}L${n1(ex)} ${n1(ey)}`, s: 'stem', w: 2 }];
  const q = { teeth: o.teeth ?? 6, sick: o.sick, bend: side * 0.1, back: o.back };
  if (l > 24) { for (const [u, a] of [[0.5, 0.95], [0.82, 0.86]]) { const px = x + Math.sin(ang) * stalk * u, py = y - Math.cos(ang) * stalk * u; for (const sd of [1, -1]) out.push(...blade(px, py, ang + sd * a, l * 0.52, l * 0.3, { ...q, bend: sd * 0.08 })); } }
  out.push(...blade(ex, ey, ang, l * 0.72, l * 0.4, q));
  return out;
}
const petalPath = (a, r0, len, wid) => { const ca = Math.cos(a), sa = Math.sin(a), T = (u, v) => `${n1((r0 + u) * ca - v * sa)} ${n1((r0 + u) * sa + v * ca)}`; return `M${T(0, -wid * 0.4)}Q${T(len * 0.7, -wid * 0.74)} ${T(len, -wid * 0.26)}Q${T(len * 1.1, 0)} ${T(len, wid * 0.26)}Q${T(len * 0.7, wid * 0.74)} ${T(0, wid * 0.4)}Q${T(-3, 0)} ${T(0, -wid * 0.4)}Z`; };
function rose(o) {
  const t = o.tint ?? 'red', open = clamp01(o.open ?? 1), dark = `${t}Dark`, lit = `${t}Lit`, out = [];
  if (open < 0.3) {
    return [{ d: 'M-10 8Q-14 -4 0 -20Q14 -4 10 8Q0 14 -10 8Z', f: `#${t}`, s: dark, w: 1.6 }, { d: 'M-2 -18Q8 -8 4 8', s: dark, w: 1.4 },
      { d: 'M-11 8Q-7 -5 -3 -10Q-2 4 0 12Q-6 13 -11 8ZM11 8Q7 -5 3 -10Q2 4 0 12Q6 13 11 8Z', f: '#leaf', s: 'leafDark', w: 1.2 }];
  }
  const ring = (n, r0, len, wid, off) => { for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2, d = petalPath(a, r0, len, wid); out.push({ d, f: `#${t}`, s: dark, w: 1.1 }); const cx = Math.cos(a) * (r0 + len * 0.86), cy = Math.sin(a) * (r0 + len * 0.86), px = -Math.sin(a) * wid * 0.3, py = Math.cos(a) * wid * 0.3; out.push({ d: `M${n1(cx - px)} ${n1(cy - py)}Q${n1(cx + Math.cos(a) * 2.6)} ${n1(cy + Math.sin(a) * 2.6)} ${n1(cx + px)} ${n1(cy + py)}`, s: lit, w: 1.8, a: 0.85 }); } };
  ring(7, 7, 16, 19, 0.2); ring(6, 4, 13, 15, 0.7); ring(5, 2, 10, 11, 0.1);
  out.push({ d: circle(0, 0, 7.5), f: dark }, { d: 'M-5 1Q-4 -6 2 -5Q7 -3 5 2Q3 6 -1 4Q-3 2 0 0Q2 -1 2 1', s: lit, w: 1.5 });
  return out;
}
function rosePlant(o) {
  const g = clamp01(o.grow ?? 1), r = rnd(o.seed ?? 2), sick = clamp01(o.sick ?? 0), H = 170 * (0.5 + 0.5 * g), droop = sick * 0.7, out = [], tips = [];
  const lean0 = (r() - 0.5) * 16, stems = [[lean0, -3, 1], [-38 - r() * 14, -2, 0.76 + r() * 0.1], [40 + r() * 14, 2, 0.68 + r() * 0.12]];
  const leaves = (back) => {
    for (let i = 0; i < stems.length; i++) {
      const [dx, lean, q] = stems[i], h = H * q, bx = dx * (1 + droop * 0.36), mx = dx * 0.3 + lean;
      for (let k = 1; k <= 4; k++) {
        const u = k / 4.7, px = (1 - u) * (1 - u) * lean + 2 * u * (1 - u) * mx + u * u * bx, py = 2 * u * (1 - u) * (-h * 0.56) + u * u * (-h);
        const sd = (k + i) % 2 ? 1 : -1, l = (30 + r() * 12) * (0.8 + 0.2 * g);
        if ((k % 2 === 0) === back) out.push(...compound(px, py, sd, l, { teeth: 5, sick: sick * (1 + r() * 0.2), droop: droop + (r() - 0.5) * 0.3, back }));
      }
    }
  };
  leaves(true);
  for (let i = 0; i < stems.length; i++) {
    const [dx, lean, q] = stems[i], h = H * q, bx = dx * (1 + droop * 0.36), mx = dx * 0.3 + lean, d = `M${n1(lean)} 0Q${n1(mx)} ${n1(-h * 0.56)} ${n1(bx)} ${n1(-h)}`;
    out.push({ d, s: 'stemDark', w: 6.4 }, { d, s: 'stem', w: 4 }, { d, s: 'stemLit', w: 1.2 });
    tips.push([bx, -h]);
  }
  leaves(false);
  const n = o.blooms ?? 0;
  for (let i = 0; i < Math.min(n, tips.length); i++) {
    const [x, y] = tips[i], q = (i ? 0.8 : 1) * (o.bloom ?? 1), pr = rose({ tint: o.tint ?? 'red', open: o.open ?? 1 });
    for (const p of pr) out.push({ ...p, d: movePath(p.d, x, y, q) });
  }
  if (n < 3 && o.bud !== false && sick < 0.3) for (const p of rose({ tint: o.tint ?? 'red', open: 0 })) out.push({ ...p, d: movePath(p.d, tips[2][0], tips[2][1], 0.8) });
  return out;
}
// Shift and scale a path written with absolute M L Q T Z H V plus relative a h v q l m (our own paths only).
function movePath(d, x, y, s) {
  return d.replace(/([MLQTHVhvaqlZ])([^MLQTHVhvaqlZ]*)/g, (all, cmd, rest) => {
    const v = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'Z') return 'Z';
    if (cmd === 'a') { const out = []; for (let i = 0; i + 6 < v.length; i += 7) out.push(n1(v[i] * s), n1(v[i + 1] * s), v[i + 2], v[i + 3], v[i + 4], n1(v[i + 5] * s), n1(v[i + 6] * s)); return `a${out.join(' ')}`; }
    if (cmd === 'h' || cmd === 'v' || cmd === 'q' || cmd === 'l') return `${cmd}${v.map((q) => n1(q * s)).join(' ')}`;
    if (cmd === 'H') return `H${n1(v[0] * s + x)}`;
    if (cmd === 'V') return `V${n1(v[0] * s + y)}`;
    return cmd + v.map((q, i) => n1(q * s + (i % 2 ? y : x))).join(' ');
  });
}
function roots(o) {
  const g = clamp01(o.grow ?? 1), sp = o.spread ?? 44, r = rnd(o.seed ?? 7), out = [];
  let thick = '', mid = '', fine = '', hair = '';
  const n = o.n ?? 7;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x0 = (u - 0.5) * (o.base ?? 10), a = (u - 0.5) * 1.5 + (r() - 0.5) * 0.3;
    const L = (o.len ?? 60) * (0.6 + r() * 0.5) * g, mx = x0 + Math.sin(a) * L * 0.5 + (r() - 0.5) * 10, my = Math.cos(a) * L * 0.55;
    const ex = x0 + Math.sin(a) * L * (sp / 44), ey = Math.cos(a) * L;
    if (L < 2) continue;
    const seg = `M${n1(x0)} 0Q${n1(mx)} ${n1(my)} ${n1(ex)} ${n1(ey)}`;
    if (i % 2) thick += seg; else mid += seg;
    for (let k = 0; k < 4; k++) {
      const t = 0.3 + k * 0.18, px = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * ex, py = 2 * t * (1 - t) * my + t * t * ey, sd = k % 2 ? 1 : -1, ax = sd * (10 + r() * 9) * g, ay = (8 + r() * 7) * g;
      fine += `M${n1(px)} ${n1(py)}q${n1(ax * 0.6)} ${n1(ay * 0.3)} ${n1(ax)} ${n1(ay)}`;
      hair += `M${n1(px + ax)} ${n1(py + ay)}l${n1(sd * 4)} 4M${n1(px + ax * 0.6)} ${n1(py + ay * 0.5)}l${n1(-sd * 3)} 5`;
    }
  }
  out.push({ d: thick + mid, s: 'rootDark', w: 3.6 }, { d: thick, s: 'root', w: 2.6 }, { d: mid, s: 'root', w: 2 }, { d: fine, s: 'root', w: 1.3 }, { d: hair, s: 'root', w: 0.7, a: 0.8 });
  return out;
}
function sprout(x, y, ang, g) {
  if (g <= 0) return [];
  const L = 36 * g, tx = x + Math.sin(ang) * L, ty = y - Math.cos(ang) * L;
  return [{ d: `M${n1(x)} ${n1(y)}L${n1(tx)} ${n1(ty)}`, s: 'budPurple', w: 7 }, { d: `M${n1(x)} ${n1(y)}L${n1(tx)} ${n1(ty)}`, s: 'leafLit', w: 4 },
    ...blade(tx, ty, ang - 0.6, 20 * g, 12 * g, { fill: '#leafYoung', bend: -0.1 }), ...blade(tx, ty, ang + 0.6, 20 * g, 12 * g, { fill: '#leafYoung', bend: 0.1 })];
}
function potato(o) {
  const g = clamp01(o.sprout ?? 0), r = rnd(4);
  const body = 'M-46 3Q-48 -24 -14 -29Q24 -35 42 -14Q54 5 35 21Q8 35 -25 27Q-44 23 -46 3Z';
  let lent = ''; for (let i = 0; i < 46; i++) { const a = r() * 6.28, q = Math.sqrt(r()); lent += circle(Math.cos(a) * 40 * q, Math.sin(a) * 25 * q - 1, 0.7 + r() * 0.8); }
  // Eyes: small dents scattered unevenly, each its own size and tilt, none level with another, so no two pair up.
  const eyes = [[-23, -10, 1, -24], [10, -18, 1, 10], [29, 2, 0.92, 40], [-37, 7, 0.56, 72], [-11, 19, 0.74, -14], [14, 13, 0.5, 28], [35, -14, 0.5, 58]];
  const eyeAt = ([x, y, z, deg], pts) => { const a = (deg * Math.PI) / 180, c = Math.cos(a) * z, s = Math.sin(a) * z; return pts.map(([u, v]) => `${n1(x + u * c - v * s)} ${n1(y + u * s + v * c)}`); };
  return [{ d: body, f: '#tuber', s: 'tuberDark', w: 2 }, { d: lent, f: 'tuberDark', a: 0.55 },
    { d: eyes.map((e) => { const [a, b, c, d] = eyeAt(e, [[-6, 0], [0, 5], [6, 0], [0, -3]]); return `M${a}Q${b} ${c}Q${d} ${a}Z`; }).join(''), f: 'tuberDark' },
    { d: eyes.map((e) => { const [a, b, c] = eyeAt(e, [[-6, -1], [0, -6], [6, -1]]); return `M${a}Q${b} ${c}`; }).join(''), s: 'tuberLit', w: 1.4 },
    ...sprout(10, -19, 0.2, g), ...sprout(-22, -10, -0.5, g * 0.8), ...sprout(28, 2, 0.9, g * 0.7)];
}
function ginger(o) {
  const g = clamp01(o.sprout ?? 0);
  const lobes = [[-34, 4, 16, 13], [-12, -4, 18, 16], [12, 6, 17, 13], [33, -6, 15, 12], [-16, -22, 10, 14], [20, -19, 9, 13], [46, 6, 10, 8], [-50, -6, 8, 9]];
  const d = lobes.map(([x, y, a, b]) => ell(x, y, a, b)).join('');
  let rings = ''; for (const [x, y, a, b] of lobes) for (const k of [-0.5, 0, 0.5]) rings += `M${n1(x - a * 0.8)} ${n1(y + b * k)}q${n1(a * 0.8)} ${n1(b * 0.3)} ${n1(a * 1.6)} 0`;
  return [{ d, f: '#tuber', s: 'tuberDark', w: 2 }, { d: rings, s: 'tuberDark', w: 1, a: 0.6 }, { d: lobes.map(([x, y, a, b]) => ell(x - a * 0.26, y - b * 0.36, a * 0.34, b * 0.2)).join(''), f: 'tuberLit', a: 0.8 },
    ...sprout(-16, -34, -0.12, g), ...sprout(20, -30, 0.2, g * 0.8)];
}
function sugarcane(o) {
  const len = o.len ?? 120, w = o.w ?? 18, seg = o.seg ?? Math.max(2, Math.round(len / 36)), g = clamp01(o.sprout ?? 0), out = [], sh = len / seg;
  for (let i = 0; i < seg; i++) {
    const y0 = -sh * i, y1 = -sh * (i + 1);
    out.push({ d: rrect(-w / 2, y1 + 1, w, sh - 2, 3), f: '#cane', s: 'caneDark', w: 1.4 });
    out.push({ d: `M${n1(w * 0.2)} ${n1(y1 + 6)}V${n1(y0 - 8)}M${n1(-w * 0.2)} ${n1(y1 + 8)}V${n1(y0 - 12)}`, s: 'caneDark', w: 0.9, a: 0.5 });
    out.push({ d: rrect(-w / 2 - 2.4, y0 - 4, w + 4.8, 7, 3.4), f: 'caneDark' }, { d: rrect(-w / 2 - 1, y0 - 10, w + 2, 4, 2), f: 'cloudShade', a: 0.6 });
    if (i % 2 === 0) out.push({ d: `M${n1(w / 2)} ${n1(y0 - 1)}q7 -3 5 -12q-6 2 -5 12Z`, f: '#leafYoung', s: 'caneDark', w: 1 });
  }
  if (g > 0) out.push(...sprout(w / 2 + 3, -11, 0.5, g * 1.5));
  return out;
}
function heartPts(x, y, ang, L) {
  const ca = Math.cos(ang), sa = Math.sin(ang), T = (px, py) => [n1(x + px * ca - py * sa), n1(y + px * sa + py * ca)].join(' ');
  return `M${T(0, 0)}Q${T(-L * 0.66, L * 0.12)} ${T(-L * 0.44, -L * 0.42)}Q${T(-L * 0.2, -L * 0.84)} ${T(0, -L)}Q${T(L * 0.2, -L * 0.84)} ${T(L * 0.44, -L * 0.42)}Q${T(L * 0.66, L * 0.12)} ${T(0, 0)}Z`;
}
function moneyLeaf(o) {
  const len = o.len ?? 150, n = o.n ?? 4, q = `M0 0Q${n1(len * 0.5)} -10 ${n1(len)} 2`, out = [{ d: q, s: 'stemDark', w: 6 }, { d: q, s: 'stem', w: 4 }, { d: q, s: 'stemLit', w: 1.2 }];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.6) / n, x = u * len, y = -10 * 2 * u * (1 - u) * 2, sd = i % 2 ? 1 : -1, a = sd > 0 ? 2.5 : 0.5, r = rnd(i + 2), Lf = 40;
    let fleck = ''; for (let k = 0; k < 9; k++) { const t = 0.2 + r() * 0.65, w = (r() - 0.5) * Lf * 0.5, px = x + Math.sin(a) * t * Lf + Math.cos(a) * w, py = y - Math.cos(a) * t * Lf + Math.sin(a) * w; fleck += ell(px, py, 2 + r() * 3, 1.2 + r() * 1.6); }
    out.push({ d: heartPts(x, y, a, Lf), f: '#leaf', s: 'leafDark', w: 1.4 }, { d: fleck, f: 'yellowLit', a: 0.7 }, { d: `M${n1(x)} ${n1(y)}L${n1(x + Math.sin(a) * Lf * 0.92)} ${n1(y - Math.cos(a) * Lf * 0.92)}`, s: 'vein', w: 1.2 });
    if (o.rootlet) out.push({ d: `M${n1(x)} ${n1(y)}q-3 8 2 17`, s: 'rootDark', w: 2.4 }, { d: `M${n1(x)} ${n1(y)}q-3 8 2 17`, s: 'root', w: 1.2 });
  }
  return out;
}
function bryophyllum(o) {
  const g = clamp01(o.grow ?? 1), L = 130, wide = 66, notches = 8, out = [];
  const edge = (side) => { const p = []; for (let i = 0; i <= notches; i++) { const t = i / notches, w = Math.sin(Math.PI * Math.pow(t, 0.8)) * wide * 0.5; p.push([side * w, -t * L]); } return p; };
  const a = edge(1), b = edge(-1);
  const right = a.slice(1).map((p, i) => { const q = a[i], cx = (p[0] + q[0]) / 2 + 9, cy = (p[1] + q[1]) / 2; return `Q${n1(cx)} ${n1(cy)} ${n1(p[0])} ${n1(p[1])}`; }).join('');
  const left = b.slice(0, -1).reverse().map((p, i, arr) => { const q = i ? arr[i - 1] : b[notches], cx = (p[0] + q[0]) / 2 - 9, cy = (p[1] + q[1]) / 2; return `Q${n1(cx)} ${n1(cy)} ${n1(p[0])} ${n1(p[1])}`; }).join('');
  out.push({ d: 'M0 0L0 18', s: 'stem', w: 6 }, { d: `M0 0${right}${left}Z`, f: '#fleshy', s: 'redDark', w: 2.2 }, { d: `M0 0${right}Z`, f: 'leafDark', a: 0.24 });
  let v = ''; for (let i = 1; i < notches; i++) for (const p of [a[i], b[i]]) v += `M0 ${n1(p[1] + 16)}Q${n1(p[0] * 0.5)} ${n1(p[1] + 8)} ${n1(p[0] * 0.92)} ${n1(p[1])}`;
  out.push({ d: v, s: 'vein', w: 1, a: 0.6 }, { d: `M0 0L0 ${-L + 8}`, s: 'vein', w: 2.6 });
  if (g > 0) for (const pts of [a, b]) for (let i = 1; i < notches; i++) {
    const [x, y] = pts[i], sd = x > 0 ? 1 : -1, q = g * (0.82 + (i % 2) * 0.18);
    out.push({ d: `M${n1(x)} ${n1(y)}q${n1(sd * 4)} 6 ${n1(sd * 3)} ${n1(12 * q)}M${n1(x + sd * 2)} ${n1(y)}q${n1(sd * 9)} 3 ${n1(sd * 12)} ${n1(9 * q)}`, s: 'root', w: 1.4 });
    out.push(...blade(x, y, sd * 0.9 - 0.34, 17 * q, 11 * q, { fill: '#leafYoung', dark: 'leafDark' }), ...blade(x, y, sd * 0.9 + 0.5, 17 * q, 11 * q, { fill: '#leafYoung', dark: 'leafDark' }));
  }
  return out;
}
function bananaLeaf(ang, len, wide) {
  const ca = Math.cos(ang), sa = Math.sin(ang), side = ca >= 0 ? 1 : -1, n = 18;
  const rib = (t) => [ca * len * t, sa * len * t + t * t * t * len * 0.62];
  const up = [], dn = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = rib(t), [x1, y1] = rib(Math.min(1, t + 0.02)), [x0, y0] = rib(Math.max(0, t - 0.02));
    const dx = x1 - x0, dy = y1 - y0, q = Math.hypot(dx, dy) || 1, nx = -dy / q, ny = dx / q;
    const w = wide * Math.sqrt(Math.max(0, 1 - Math.pow(t, 7))) * Math.min(1, t * 5 + 0.12);
    up.push([n1(x + nx * w * side), n1(y + ny * w * side)]); dn.push([n1(x - nx * w * side * 0.9), n1(y - ny * w * side * 0.9)]);
  }
  const Pth = (a2) => a2.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');
  let veins = '', tears = '';
  for (let i = 1; i < n; i++) { const [x, y] = rib(i / n); veins += `M${n1(x)} ${n1(y)}L${up[i][0]} ${up[i][1]}M${n1(x)} ${n1(y)}L${dn[i][0]} ${dn[i][1]}`; }
  for (let i = 4; i < n; i += 3) { const [x, y] = rib(i / n); tears += `M${up[i][0]} ${up[i][1]}L${n1((up[i][0] + x) / 2)} ${n1((up[i][1] + y) / 2)}`; }
  const mid = []; for (let i = 0; i <= n; i++) { const [x, y] = rib(i / n); mid.push([n1(x), n1(y)]); }
  return { blade: `${Pth(up)}${[...dn].reverse().map((p) => `L${p[0]} ${p[1]}`).join('')}Z`, under: `${Pth(mid)}${[...dn].reverse().map((p) => `L${p[0]} ${p[1]}`).join('')}Z`, rib: Pth(mid), tears, veins };
}
function banana(o) {
  const q = clamp01(o.size ?? 1), H = 118 * q + 20, out = [], sh = (d) => movePath(d, 0, -H, 0.5 + q * 0.5);
  const fan = [[-2.98, 118, 29], [-0.16, 118, 29], [-2.42, 112, 28], [-0.72, 112, 28], [-1.86, 100, 25], [-1.28, 100, 25]];
  for (const [a, l, w] of fan) {
    const lf = bananaLeaf(a, l, w);
    out.push({ d: sh(lf.blade), f: '#bananaLeaf', s: 'leafDark', w: 1.6 }, { d: sh(lf.under), f: 'leafDark', a: 0.34 }, { d: sh(lf.veins), s: 'vein', w: 0.7, a: 0.5 }, { d: sh(lf.rib), s: 'cane', w: 3 }, { d: sh(lf.tears), s: 'leafDeep', w: 1.6 });
  }
  const b = 15 + q * 9;
  out.push({ d: `M${n1(-b)} 0Q${n1(-b * 0.7)} ${n1(-H * 0.5)} ${n1(-b * 0.4)} ${n1(-H - 6)}L${n1(b * 0.4)} ${n1(-H - 6)}Q${n1(b * 0.7)} ${n1(-H * 0.5)} ${n1(b)} 0Z`, f: '#trunk', s: 'trunkSoftDark', w: 2 });
  out.push({ d: `M${n1(-b * 0.5)} 0Q${n1(-b * 0.1)} ${n1(-H * 0.4)} ${n1(b * 0.1)} ${n1(-H - 4)}M${n1(b * 0.5)} 0Q${n1(b * 0.42)} ${n1(-H * 0.5)} ${n1(b * 0.3)} ${n1(-H * 0.8)}M${n1(-b * 0.84)} ${n1(-H * 0.12)}Q${n1(-b * 0.5)} ${n1(-H * 0.5)} ${n1(-b * 0.3)} ${n1(-H * 0.9)}`, s: 'trunkSoftDark', w: 1.6 });
  out.push({ d: `M${n1(-b * 0.7)} ${n1(-H * 0.3)}l6 -12M${n1(b * 0.2)} ${n1(-H * 0.2)}l7 -14M${n1(-b * 0.1)} ${n1(-H * 0.62)}l5 -11`, s: 'barkDark', w: 2.2, a: 0.5 });
  if (o.bunch) {
    const bx = 24, by = -H + 4;
    out.push({ d: `M4 ${n1(-H - 2)}Q${bx + 16} ${n1(by - 6)} ${bx + 18} ${n1(by + 88)}`, s: 'stemDark', w: 5 });
    for (let row = 0; row < 5; row++) for (let i = 0; i < 5; i++) {
      const y = by + 8 + row * 13, x = bx + 2 + i * 8 - row * 0.4;
      out.push({ d: `M${x} ${y}q12 2 15 16q-12 0 -18 -12Z`, f: 'banana', s: 'bananaDark', w: 1.4 });
    }
    out.push({ d: `M${bx + 18} ${n1(by + 76)}q10 10 0 32q-11 -18 0 -32Z`, f: 'budPurple', s: 'ink', w: 1.2 });
  }
  return out;
}
function bananaLet() {
  return [{ d: 'M-4 0L-2 -18L2 -18L4 0Z', f: '#trunk', s: 'trunkSoftDark', w: 1.2 }, ...blade(0, -14, -0.55, 30, 15, { bend: -0.2 }), ...blade(0, -14, 0.55, 30, 15, { bend: 0.2 }), ...blade(0, -16, 0, 28, 14)];
}
function lemonTree(o) {
  const sd = o.seed ?? 4, r = rnd(sd), out = [{ d: 'M-9 0Q-6 -30 -4 -66L6 -66Q7 -30 12 0Z', f: '#bark', s: 'barkDark', w: 2 }, { d: 'M-2 -10Q-1 -34 1 -60M4 -6Q3 -28 3 -54', s: 'barkDark', w: 1.4, a: 0.6 }, { d: 'M0 -50Q-18 -70 -36 -80M2 -58Q20 -76 38 -84M0 -62Q-4 -86 -12 -104', s: 'barkDark', w: 6 }, { d: 'M0 -50Q-18 -70 -36 -80M2 -58Q20 -76 38 -84', s: 'bark', w: 3.4 }];
  const lobes = [[-46, -92, 40, 32], [46, -96, 40, 32], [0, -118, 52, 42], [-26, -146, 38, 26], [26, -148, 38, 26]];
  lobes.forEach(([x, y, a, b], i) => { for (const p of foliage({ rx: a, ry: b, n: o.n ?? 90, seed: sd + i, long: o.mango, sparse: o.sparse })) out.push({ ...p, d: moveAbs(p.d, x, y) }); });
  if (o.fruit !== false) { for (let i = 0; i < 10; i++) { const x = -60 + r() * 120, y = -76 - r() * 88, w = o.mango ? 8.5 : 7.6, h = o.mango ? 12.5 : 9.6; out.push({ d: `M${n1(x)} ${n1(y - h)}L${n1(x)} ${n1(y - h - 6)}`, s: 'stemDark', w: 1.6 }, { d: ell(x, y, w, h), f: o.mango ? '#mango' : '#lemon', s: 'yellowDark', w: 1.2 }); } }
  return out;
}
// Shift our circle and leaf paths: absolute M Q, relative a; only the first pair of an a run is the start.
const moveAbs = (d, x, y) => d.replace(/([MQ])([-\d. ]+)/g, (all, c, rest) => c + rest.trim().split(/\s+/).map(Number).map((q, i) => n1(q + (i % 2 ? y : x))).join(' '));
function bottle(o) {
  const w = 90, h = 130, lets = o.lets ?? 0, out = [];
  const body = `M${-w / 2 + 8} 0Q${-w / 2} 0 ${-w / 2} -10V${-h + 48}Q${-w / 2} ${-h + 32} -22 ${-h + 24}V${-h + 8}H22V${-h + 24}Q${w / 2} ${-h + 32} ${w / 2} ${-h + 48}V-10Q${w / 2} 0 ${w / 2 - 8} 0Z`;
  out.push({ d: body, f: 'glass', a: 0.4 });
  out.push({ d: `M${-w / 2 + 4} -4V-36Q0 -44 ${w / 2 - 4} -36V-4Z`, f: '#gel' }, { d: `M${-w / 2 + 4} -36Q0 -44 ${w / 2 - 4} -36Q0 -30 ${-w / 2 + 4} -36Z`, f: 'yellowLit', a: 0.7 });
  if (o.tip) out.push(...blade(-3, -38, -0.3, 24, 13, { fill: '#leafYoung' }), ...blade(3, -38, 0.3, 24, 13), { d: ell(0, -36, 9, 4), f: 'leafDark' });
  const pos = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) pos.push([-27 + i * 18 + (r % 2) * 5, -14 - r * 8 - 12]);
  for (let i = 0; i < Math.min(lets, 12); i++) { const [x, y] = pos[(i * 5) % 12]; out.push({ d: `M${x} ${y}q-3 5 -5 8M${x} ${y}q3 5 5 8`, s: 'root', w: 1 }, ...blade(x, y, -0.34, 21, 10, { fill: '#leafYoung', bend: -0.2 }), ...blade(x, y, 0.34, 21, 10, { bend: 0.2 }), ...blade(x, y, 0, 24, 10, { fill: '#leafYoung' })); }
  out.push({ d: body, f: '#glass' }, { d: body, s: 'glassEdge', w: 2.4 }, { d: `M${-w / 2 + 9} -46V${-h + 50}`, s: 'glassLit', w: 5, a: 0.9 }, { d: `M${w / 2 - 8} -30V${-h + 60}`, s: 'glassLit', w: 2, a: 0.6 }, { d: rrect(-26, -h, 52, 16, 5), f: '#metal', s: 'metalDark', w: 1.6 }, { d: 'M-24 -116H24M-24 -120H24', s: 'metalDark', w: 1, a: 0.5 });
  return out;
}
function can() {
  return [
    { d: 'M34 -38L72 -66', s: 'metalDark', w: 9 }, { d: 'M34 -38L72 -66', s: 'metal', w: 5.6 }, { d: ell(74, -68, 6, 10), f: 'metalDark' },
    { d: 'M-26 -64Q-52 -62 -46 -30Q-44 -18 -30 -16', s: 'metalDark', w: 6 },
    { d: rrect(-34, -56, 68, 56, 8), f: '#metal', s: 'metalDark', w: 2 }, { d: 'M-34 -46H34M-34 -8H34', s: 'metalDark', w: 1.4, a: 0.6 },
    { d: 'M-22 -58Q0 -84 22 -58', s: 'metalDark', w: 5 },
  ];
}
function knife() {
  return [{ d: rrect(0, -6, 34, 12, 5), f: '#wood', s: 'woodDark', w: 1.6 }, { d: 'M6 0H28', s: 'woodDark', w: 1 }, { d: 'M34 -5H62Q72 -3 72 4L34 5Z', f: '#metal', s: 'metalDark', w: 1.6 }];
}

const P = (fn) => pair(fn);
const [drawSoil, svgSoil] = P(soil); const [drawSkyWall, svgSkyWall] = P(skyWall); const [drawPot, svgPot] = P(pot); const [drawStem, svgStem] = P(stem);
const [drawLeaf, svgLeaf] = P(leafThing); const [drawRose, svgRose] = P(rose); const [drawRosePlant, svgRosePlant] = P(rosePlant); const [drawRoots, svgRoots] = P(roots);
const [drawPotato, svgPotato] = P(potato); const [drawGinger, svgGinger] = P(ginger); const [drawSugarcane, svgSugarcane] = P(sugarcane); const [drawMoneyLeaf, svgMoneyLeaf] = P(moneyLeaf);
const [drawBryophyllum, svgBryophyllum] = P(bryophyllum); const [drawBanana, svgBanana] = P(banana); const [drawBananaLet, svgBananaLet] = P(bananaLet); const [drawLemonTree, svgLemonTree] = P(lemonTree);
const [drawFoliage, svgFoliage] = P(foliage);
const [drawBottle, svgBottle] = P(bottle); const [drawCan, svgCan] = P(can); const [drawKnife, svgKnife] = P(knife);
export { drawSoil, svgSoil, drawSkyWall, svgSkyWall, drawPot, svgPot, drawStem, svgStem, drawLeaf, svgLeaf, drawRose, svgRose, drawRosePlant, svgRosePlant, drawRoots, svgRoots,
  drawPotato, svgPotato, drawGinger, svgGinger, drawSugarcane, svgSugarcane, drawMoneyLeaf, svgMoneyLeaf, drawBryophyllum, svgBryophyllum, drawBanana, svgBanana, drawBananaLet, svgBananaLet,
  drawLemonTree, svgLemonTree, drawFoliage, svgFoliage, drawBottle, svgBottle, drawCan, svgCan, drawKnife, svgKnife };

// -- words, frame, controls -----------------------------------------------------
export const ART_INK = css('ink'), ART_PALE = css('cloud');
export function words(x, y, s, o = {}) {
  const fam = o.display ? 'var(--sim-font-display)' : 'var(--sim-font)';
  const st = [`font-family:${fam}`, `font-size:${o.size ?? 15}px`, `font-weight:${o.weight ?? (o.display ? 600 : 800)}`, `fill:${o.ink ?? 'var(--sim-label)'}`];
  if (o.halo) st.push('paint-order:stroke', `stroke:${o.halo}`, `stroke-width:${o.haloW ?? 4}px`, 'stroke-linejoin:round');
  return `<text x="${n1(x)}" y="${n1(y)}" text-anchor="${o.anchor ?? 'middle'}" style="${st.join(';')}">${s}</text>`;
}
export const label = (x, y, s, o = {}) => words(x, y, s, { ink: ART_INK, halo: ART_PALE, haloW: 5, ...o });
export const labelWhite = (x, y, s, o = {}) => words(x, y, s, { ink: ART_PALE, halo: ART_INK, haloW: 5, ...o });
export const leader = (x0, y0, x1, y1, col = ART_INK, w = 2.5) => `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" ${stroke(col, w)}/>`;
export function frame(st, id, body) {
  const r = 18 * (lookOf().radius ?? 1), q = 2;
  return `<defs>${artDefs()}<clipPath id="${id}-clip"><rect x="${q}" y="${q}" width="${st.W - 2 * q}" height="${st.H - 2 * q}" rx="${r}"/></clipPath></defs>`
    + `<g clip-path="url(#${id}-clip)">${body}</g>`
    + `<rect x="${q}" y="${q}" width="${st.W - 2 * q}" height="${st.H - 2 * q}" rx="${r}" ${stroke(ART_INK, 3)}/>`;
}
export function anim(scene, key, html) {
  const g = scene.sv?.wrap?.querySelector?.(`[data-anim="${key}"]`);
  if (g) g.innerHTML = html;
}
export { fill, stroke };

// -- gradients and texture, all from tokens; light from the top left ---------------
const stops = (l) => l.map(([o, r, a]) => `<stop offset="${o}" style="stop-color:${css(r)}${a !== undefined ? `;stop-opacity:${a}` : ''}"/>`).join('');
const lin = (id, x1, y1, x2, y2, l) => `<linearGradient id="pa-${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(l)}</linearGradient>`;
const rad = (id, cx, cy, r, l) => `<radialGradient id="pa-${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(l)}</radialGradient>`;
const petal = (id, d, m, h) => rad(id, 0.42, 0.42, 0.72, [[0, d], [0.5, m], [1, h]]);
let DEFS = null;
export function artDefs() {
  if (DEFS) return DEFS;
  DEFS = lin('leaf', 0, 0, 1, 1, [[0, 'leafLit'], [0.5, 'leaf'], [1, 'leafDark']])
    + lin('leafBack', 0, 0, 1, 1, [[0, 'leaf'], [1, 'leafDeep']])
    + lin('leafYoung', 0, 0, 1, 1, [[0, m('leafLit', 'cloud', 0.2)], [1, 'leaf']])
    + lin('leafSick', 0, 0, 1, 1, [[0, m('sick', 'yellowLit', 0.5)], [0.6, 'sick'], [1, 'sickDark']])
    + lin('bananaLeaf', 0, 0, 0, 1, [[0, 'leafLit'], [0.46, 'leaf'], [1, 'leafDeep']])
    + lin('fleshy', 0, 0, 1, 1, [[0, m('leafLit', 'cloud', 0.14)], [0.55, 'leaf'], [1, m('leafDark', 'redDark', 0.3)]])
    + lin('stem', 0, 0, 1, 0, [[0, 'stemLit'], [0.45, 'stem'], [1, 'stemDark']])
    + lin('bark', 0, 0, 1, 0, [[0, 'barkLit'], [0.4, 'bark'], [1, 'barkDark']])
    + lin('trunk', 0, 0, 1, 0, [[0, m('trunkSoft', 'cloud', 0.3)], [0.42, 'trunkSoft'], [1, 'trunkSoftDark']])
    + lin('cane', 0, 0, 1, 0, [[0, 'caneLit'], [0.4, 'cane'], [1, 'caneDark']])
    + lin('soil', 0, 0, 0, 1, [[0, 'soilLit'], [0.16, 'soil'], [1, 'soilDeep']])
    + lin('pot', 0, 0, 1, 0, [[0, 'potLit'], [0.34, 'pot'], [1, dk('potDark', 0.22)]])
    + lin('metal', 0, 0, 1, 0.2, [[0, 'metal'], [0.16, 'metalLit'], [0.4, 'metal'], [0.8, 'metalDark'], [1, 'metal']])
    + lin('glass', 0, 0, 1, 1, [[0, 'glassLit', 0.8], [0.5, 'glass', 0.34], [1, 'glassEdge', 0.5]])
    + lin('gel', 0, 0, 0, 1, [[0, 'gel'], [1, 'gelDark']])
    + lin('wood', 0, 0, 0, 1, [[0, m('wood', 'strata1', 0.3)], [1, 'woodDark']])
    + rad('tuber', 0.36, 0.3, 0.8, [[0, 'tuberLit'], [0.55, 'tuber'], [1, 'tuberDark']])
    + rad('lemon', 0.34, 0.3, 0.8, [[0, 'yellowLit'], [0.6, 'lemon'], [1, 'yellowDark']])
    + rad('mango', 0.34, 0.3, 0.8, [[0, 'yellow'], [0.6, 'mango'], [1, 'redDark']])
    + petal('red', 'redDark', 'red', 'redLit') + petal('pink', 'pinkDark', 'pink', 'pinkLit') + petal('yellow', 'yellowDark', 'yellow', 'yellowLit') + petal('wild', 'wildDark', 'wild', 'wildLit')
    + '<radialGradient id="pa-cyto" cx=".38" cy=".34" r=".76"><stop offset="0" style="stop-color:var(--sim-elev-peak)"/><stop offset=".55" style="stop-color:color-mix(in oklab, var(--sim-membrane) 22%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-membrane) 52%, var(--sim-elev-peak))"/></radialGradient>'
    + '<radialGradient id="pa-nuc" cx=".4" cy=".36" r=".72"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-nucleus) 14%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-nucleus) 52%, var(--sim-elev-peak))"/></radialGradient>'
    + '<radialGradient id="pa-yeast" cx=".36" cy=".32" r=".76"><stop offset="0" style="stop-color:var(--sim-elev-peak)"/><stop offset=".6" style="stop-color:color-mix(in oklab, var(--sim-strata-1) 66%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:var(--sim-strata-2)"/></radialGradient>'
    + '<radialGradient id="pa-egg" cx=".38" cy=".34" r=".76"><stop offset="0" style="stop-color:var(--sim-elev-peak)"/><stop offset=".5" style="stop-color:color-mix(in oklab, var(--sim-strata-1) 60%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-strata-2) 80%, var(--sim-strata-1))"/></radialGradient>'
    + '<filter id="pa-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>'
    + '<filter id="pa-softer" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>'
    + '<filter id="pa-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.02" result="d"/><feComposite in="d" in2="SourceGraphic" operator="in"/></filter>'
    + '<filter id="pa-fibre" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.34" numOctaves="3" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.2" result="d"/><feComposite in="d" in2="SourceGraphic" operator="in"/></filter>';
  return DEFS;
}
/** A rect of grain or wood fibre over whatever is under it. kind: grain, fibre. */
export const textureRect = (x, y, w, h, kind = 'grain', a = 0.3, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" style="fill:${css('ink')};opacity:${a};filter:url(#pa-${kind})"/>`;
export const softShadow = (x, y, rx, ry, a = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" style="fill:${css('ink')};opacity:${a};filter:url(#pa-soft)"/>`;
export const CTL_CSS = `
.ss-ctl { display: flex; flex-wrap: wrap; gap: 6px 8px; justify-content: center; align-items: center; padding: 8px 0 2px; box-sizing: border-box; width: 100%; }
.ss-range { display: flex; align-items: center; gap: 10px; flex: 1 1 100%; min-width: 0; font: 800 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.ss-range > span:first-child { white-space: nowrap; }
.ss-range input { flex: 1 1 auto; min-width: 0; height: 44px; margin: 0; accent-color: var(--primary-color, var(--sim-accent)); touch-action: pan-y; cursor: pointer; }
.ss-range output { flex: none; min-width: 3.4em; text-align: right; font: 600 var(--sim-text-lg)/1.1 var(--sim-font-display, var(--sim-font)); }
.ss-seg { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; align-items: center; flex: 1 1 100%; }
.ss-seg > span { font: 800 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.ss-btn { appearance: none; box-sizing: border-box; min-height: 44px; min-width: 44px; padding: 4px 14px; margin: 0; cursor: pointer; touch-action: pan-y;
  border: calc(2px * var(--look-rim)) solid var(--sim-stroke); border-radius: var(--look-pill); background: var(--sim-bg-surface); color: var(--sim-label);
  font: 800 var(--sim-text-md)/1.2 var(--sim-font); box-shadow: 0 calc(3px * var(--look-lip)) 0 color-mix(in oklab, var(--sim-stroke) 62%, var(--sim-bg-deep));
  transition: background-color 0.12s ease, transform 0.12s var(--look-spring), box-shadow 0.12s ease; -webkit-tap-highlight-color: transparent; }
.ss-btn[aria-pressed="true"] { background: color-mix(in oklab, var(--primary-color, var(--sim-accent)) 34%, var(--sim-bg-surface)); transform: translateY(calc(2px * var(--look-lip)));
  box-shadow: inset 0 0 0 2px var(--primary-color, var(--sim-accent)), 0 calc(1px * var(--look-lip)) 0 var(--sim-stroke); }
.ss-btn--go { background: var(--primary-color, var(--sim-accent)); color: var(--on-primary, var(--sim-ink-on-accent, var(--sim-bg-deep))); border-color: var(--primary-hover, var(--sim-stroke)); }
.ss-btn:active { transform: translateY(calc(2px * var(--look-lip))); }
.ss-btn:focus-visible, .ss-range input:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.ss-btn[disabled] { opacity: 0.5; cursor: default; }
@media (prefers-reduced-motion: reduce) { .ss-btn { transition: none; } }
`;

export function ctlBar(scene, items, onChange) {
  scene.injectStyle?.(CTL_CSS);
  const bar = document.createElement('div');
  bar.className = 'ss-ctl';
  const nodes = new Map(), vals = new Map();
  for (const it of items) {
    if (it.kind === 'range') {
      const row = document.createElement('label');
      row.className = 'ss-range';
      const name = document.createElement('span'), inp = document.createElement('input'), out = document.createElement('output');
      name.textContent = it.label;
      inp.type = 'range'; inp.min = String(it.min); inp.max = String(it.max); inp.step = String(it.step ?? 1); inp.value = String(it.value);
      inp.setAttribute('aria-label', it.label);
      row.append?.(name, inp, out);
      const show = (v) => { out.textContent = it.read ? it.read(v) : String(v); inp.setAttribute('aria-valuetext', it.say ? it.say(v) : out.textContent); };
      inp.addEventListener('input', () => { const v = Number(inp.value); vals.set(it.id, v); show(v); onChange?.(it.id, v); });
      vals.set(it.id, it.value); show(it.value);
      nodes.set(it.id, { row, set: (v) => { inp.value = String(v); vals.set(it.id, v); show(v); }, disable: (on) => { inp.disabled = !!on; } });
      bar.appendChild(row);
    } else if (it.kind === 'seg') {
      const row = document.createElement('div');
      row.className = 'ss-seg';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', it.label ?? it.id);
      const btns = it.options.map((o) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ss-btn'; b.textContent = o.label;
        b.addEventListener('click', () => { if (vals.get(it.id) === o.value && !it.toggle) return; const v = (vals.get(it.id) === o.value) ? null : o.value; press(v); vals.set(it.id, v); onChange?.(it.id, v); });
        row.appendChild(b);
        return { b, o };
      });
      const press = (v) => { for (const { b, o } of btns) b.setAttribute('aria-pressed', String(o.value === v)); };
      vals.set(it.id, it.value ?? null); press(it.value ?? null);
      nodes.set(it.id, { row, set: (v) => { vals.set(it.id, v); press(v); }, disable: (on) => { for (const { b } of btns) b.disabled = !!on; } });
      bar.appendChild(row);
    } else {
      const b = document.createElement('button');
      b.type = 'button'; b.className = `ss-btn${it.go ? ' ss-btn--go' : ''}`; b.textContent = it.label;
      b.addEventListener('click', () => onChange?.(it.id, true));
      nodes.set(it.id, { row: b, set: () => {}, disable: (on) => { b.disabled = !!on; }, label: (t) => { b.textContent = t; } });
      bar.appendChild(b);
    }
  }
  scene.root.appendChild(bar);
  const api = {
    el: bar,
    get: (id) => vals.get(id),
    set(id, v) { nodes.get(id)?.set(v); },
    label(id, t) { nodes.get(id)?.label?.(t); },
    show(id, on) { const n = nodes.get(id); if (n) n.row.style.display = on ? '' : 'none'; const any = [...nodes.values()].some((x) => x.row.style.display !== 'none'); bar.style.display = any ? '' : 'none'; scene.relayout?.(); },
    disable(id, on) { nodes.get(id)?.disable(on); },
    destroy() { bar.remove(); },
  };
  return api;
}
