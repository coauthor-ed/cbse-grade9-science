// LifeArt.js - drawn plants, animals and whole biome strips for ecology and geography scenes. General:
// later modules can reuse it. Built on SeaArt primitives. No faces beyond one plain dot eye, no smile, no
// colour literals: every colour is a recipe over sim tokens, so canvas and SVG read the same art.
// Text is the scene's job: nothing here writes a word.
//
// Two ways to draw every thing, same arguments after the first two:
//   canvas  drawCamel(ctx, c, x, y, s, o)     c = this.colors of a scene with COLOR_MAP = LIFE_COLOR_MAP
//   SVG     svgCamel(x, y, s, o)              returns a string, one closed <g>
// x, y place the origin given below; s is a scale; every o also takes:
//   rot (degrees), flip (true mirrors left and right), alpha (0..1).
// Or by name: drawLife(ctx, c, name, x, y, s, o), svgLife(name, x, y, s, o), LIFE_NAMES.
//
// Plants (origin: foot of the trunk or clump; size at s = 1):
//   Conifer     50 by 130; snow (true), slim (true)        pine, spruce, larch shape
//   BroadLeaf   110 by 120; seed, bare (true), tint 0..1 (autumn tint), t (sway)
//   RainTree    130 by 200; seed. Tall straight trunk, buttress, flat crown: an emergent
//   UnderTree   80 by 90; seed. Shade-loving small tree
//   Palm        from SeaArt (120 tall; lean, t)
//   Acacia      130 by 110; seed. Flat top, forked trunk: scattered savanna tree
//   ThornBush   70 by 44; seed
//   Cactus      40 by 90; arms (0..2)
//   GrassTuft   40 by 34; seed, t, dry (true)
//   TallGrass   100 by 70; seed, t, dry (true)
//   Moss        60 by 18; seed. Low cushion
//   Lichen      40 by 26; seed. Crust on a stone: draws the stone too
//   TundraShrub 44 by 24; seed. Low, spreading, knee-high at most
//   Reeds       50 by 80; t
//   Mangrove    110 by 90; seed. Arched stilt roots, foot at the water line
//   Bamboo      80 by 130; seed, t
//   Fern        50 by 34; seed
//   Liana       hangs from origin, 30 by 120; seed
//   WaterLily   40 by 12; pad and one bud, origin on the water
// Animals (origin: ground, middle of the feet; about 100 long at s = 1, nose right, plain dot eye):
//   Camel       o.humps 1 or 2. 1: short pale coat, long legs. 2: thick dark coat, shorter legs
//   Reindeer  PolarBear  ArcticFox  Lion  Giraffe  Zebra  Yak  Antelope
//   Frog (30 long)  Hornbill (60 long, perched, origin at the feet)  Turtle (70 long, in water, origin middle)
//   Lizard (50 long)  Snake (60 long, on the ground)  Butterfly (16, origin middle)  Monkey (40, sits on a branch)
//   Elephant (130 long)  Snowcock (60 long)  Whale (150 long, swims, origin middle)  Dolphin (110 long, origin middle)
//   Scrub (70 by 44): low evergreen shrub of scrubland
//   Fish  from SeaArt (60 long, nose right; kind 0..2)
// From SeaArt as they are: Cloud, Sun, Hills, Rain, Seagrass, Coral, Hut, drawPrims, svgPrims.
//
// A whole strip of a biome:
//   drawBiomeStrip(ctx, c, id, x, y, w, h, o)   svgBiomeStrip(id, x, y, w, h, o)
//   id: rainforest temperate taiga grassland savanna desert coldDesert tundra freshwater marine wetland ice mountain
//   Ground, plants and animals in a w by h box; it paints no sky. o: seed, sky (true adds a band of daylight
//   sky), animals (false leaves them out), t. The cast is true to the biome: no tree on tundra, no polar bear
//   in the south, no lion in a hot sand desert.
//   BIOME_IDS. biomeColour(c, id) / svgBiomeColour(id): one flat map colour for a biome, tokens only.
//
// Rule for callers: the art is daylight in both themes, so ink on it comes from lifeColour(c, 'ink') or
// lifeColour(c, 'snow'), never c.label.
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';
import {
  drawPrims, svgPrims, pathLine as line, pathCircle as circle, pathEllipse as ell, pathRoundRect as rrect,
  blend as m, darkenRole as dk, seaColour, svgSeaColour, drawPalm, svgPalm, drawFish, svgFish,
} from './SeaArt.js';

export const LIFE_COLOR_MAP = GEO_COLOR_MAP;
export const lifeColour = (c, role) => seaColour(c, L[role] ?? role);
export const svgLifeColour = (role) => svgSeaColour(L[role] ?? role);
export { drawPrims, svgPrims };

const n1 = (v) => Math.round(v * 10) / 10;
const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

// -- life colours ----------------------------------------------------------------
const L = {
  leaf: m('elevLow', 'strata6', 0.14), leafDark: m('elevLow', 'strata6', 0.42), leafLit: m('elevLow', 'gold', 0.3),
  leafDeep: m('elevLow', 'seaDeep', 0.5), leafDeeper: dk(m('elevLow', 'seaDeep', 0.5), 0.3),
  autumn: m('gold', 'magma', 0.45), autumnDark: m('magma', 'strata3', 0.4),
  pine: m('elevLow', 'seaDeep', 0.42), pineDark: m('elevLow', 'strata6', 0.62), pineLit: m('elevLow', 'seaDeep', 0.2),
  bark: m('strata3', 'strata6', 0.36), barkDark: m('strata3', 'strata6', 0.7), barkLit: m('strata3', 'strata1', 0.4),
  dryGrass: m('gold', 'strata1', 0.45), dryDark: m('gold', 'strata3', 0.5), green: 'elevLow', greenDark: m('elevLow', 'strata6', 0.3),
  moss: m('elevLow', 'gold', 0.36), mossDark: m('elevLow', 'strata6', 0.34), lichen: m('gold', 'elevPeak', 0.3), lichenDark: m('gold', 'strata3', 0.5),
  stone: 'elevHigh', stoneDark: m('elevHigh', 'strata6', 0.44), stoneLit: m('elevHigh', 'elevPeak', 0.36),
  sand: 'strata1', sandDark: m('strata1', 'strata3', 0.42), sandLit: m('strata1', 'elevPeak', 0.4), soil: 'strata2', soilDark: m('strata3', 'strata6', 0.34),
  snow: 'elevPeak', snowShade: m('elevPeak', 'seaShallow', 0.26), snowDeep: m('elevPeak', 'seaDeep', 0.26),
  camel: m('strata1', 'strata2', 0.6), camelDark: m('strata2', 'strata3', 0.6), camelLit: m('strata1', 'elevPeak', 0.2),
  brown: m('strata3', 'strata2', 0.3), brownDark: m('strata3', 'strata6', 0.5), brownLit: m('strata2', 'strata1', 0.3),
  tawny: m('gold', 'strata2', 0.5), tawnyDark: m('strata2', 'strata3', 0.46), tawnyLit: m('gold', 'elevPeak', 0.34), mane: m('strata3', 'magma', 0.2),
  white: 'elevPeak', whiteShade: m('elevPeak', 'strata5', 0.2), whiteDeep: m('elevPeak', 'strata5', 0.42),
  ink: dk('strata6', 0.3), inkSoft: 'strata5', water: 'seaShallow', waterDeep: 'seaDeep', waterMid: m('seaShallow', 'seaDeep', 0.5),
  red: m('magma', 'strata3', 0.2), yellow: 'gold', beak: m('gold', 'magma', 0.34),
};

// -- tools ------------------------------------------------------------------------
// A smooth closed shape through the middles of the edges of a point list.
function blob(pts) {
  const k = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[k - 1], pts[0]);
  let d = `M${n1(s[0])} ${n1(s[1])}`;
  for (let i = 0; i < k; i++) { const e = mid(pts[i], pts[(i + 1) % k]); d += `Q${n1(pts[i][0])} ${n1(pts[i][1])} ${n1(e[0])} ${n1(e[1])}`; }
  return d + 'Z';
}
// A leg: from the body (x, top) down to the ground (x + lean, foot), tapered, a slight knee.
function leg(x, top, foot, w0, w1, lean = 0) {
  const k = (top + foot) / 2;
  return `M${n1(x - w0 / 2)} ${n1(top)}Q${n1(x - w1 + lean * 0.5)} ${n1(k)} ${n1(x + lean - w1 / 2)} ${n1(foot)}h${n1(w1 + 1)}Q${n1(x + w1 + lean * 0.5)} ${n1(k)} ${n1(x + w0 / 2)} ${n1(top)}Z`;
}
const hooves = (pairs, foot, w, h, f) => ({ d: pairs.map((x) => rrect(x - w / 2, foot - h, w + 1, h, 1.2)).join(''), f });
const eye = (x, y, r = 1.8, f = L.ink) => ({ d: circle(x, y, r), f });

// A leafy crown from lobes, with a dark under-layer and lit tops.
function crown(cx, cy, rx, ry, n, r, roles) {
  const lobes = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + r() * 0.5, q = 0.72 + r() * 0.3;
    lobes.push([cx + Math.cos(a) * rx * 0.68 * q, cy + Math.sin(a) * ry * 0.62 * q, (rx + ry) * 0.27 * (0.84 + r() * 0.34)]);
  }
  const d = (dy, k = 1) => lobes.map(([x, y, q]) => circle(x, y + dy, q * k)).join('') + ell(cx, cy + dy, rx * 0.74, ry * 0.7);
  return [
    { d: d(5), f: roles[0] },
    { d: d(0), f: roles[1] },
    { d: lobes.filter(([, y]) => y < cy + ry * 0.1).map(([x, y, q]) => circle(x - q * 0.24, y - q * 0.28, q * 0.56)).join(''), f: roles[2] },
  ];
}

// -- plants -----------------------------------------------------------------------
function conifer(o) {
  const w = o.slim ? 36 : 50, H = 130, out = [{ d: leg(0, -30, 0, 7, 9), f: L.barkDark }];
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const y0 = -20 - i * 25, top = y0 - 44, hw = (w / 2) * (1 - i * 0.2);
    out.push({ d: `M0 ${n1(top)}Q${n1(hw * 0.3)} ${n1(y0 - 18)} ${n1(hw)} ${n1(y0)}Q0 ${n1(y0 + 7)} ${n1(-hw)} ${n1(y0)}Q${n1(-hw * 0.3)} ${n1(y0 - 18)} 0 ${n1(top)}Z`, f: i % 2 ? L.pine : L.pineLit });
    out.push({ d: `M0 ${n1(top)}Q${n1(hw * 0.3)} ${n1(y0 - 18)} ${n1(hw)} ${n1(y0)}Q${n1(hw * 0.4)} ${n1(y0 + 5)} 0 ${n1(y0 + 3)}Z`, f: L.pineDark, a: 0.5 });
    if (o.snow) out.push({ d: `M0 ${n1(top)}Q${n1(hw * 0.24)} ${n1(y0 - 24)} ${n1(hw * 0.68)} ${n1(y0 - 7)}Q${n1(hw * 0.2)} ${n1(y0 - 12)} ${n1(-hw * 0.1)} ${n1(y0 - 9)}Q${n1(-hw * 0.5)} ${n1(y0 - 12)} ${n1(-hw * 0.68)} ${n1(y0 - 7)}Q${n1(-hw * 0.24)} ${n1(y0 - 24)} 0 ${n1(top)}Z`, f: L.snow });
  }
  return out;
}
function broadLeaf(o) {
  const r = rnd(o.seed ?? 3), sway = Math.sin((o.t ?? 0) * 0.8) * 2;
  const out = [{ d: `M-8 0Q-4 -30 -6 -54L-22 -80L-4 -66L0 -92L6 -66L22 -82L7 -52Q5 -28 9 0Z`, f: L.bark }];
  if (o.bare) { out.push({ d: line([[-22, -80], [-34, -96]]) + line([[22, -82], [34, -100]]) + line([[0, -92], [-6, -112]]) + line([[0, -92], [10, -110]]), s: L.bark, w: 3 }); return out; }
  const t = o.tint ?? 0;
  const roles = t > 0.5 ? [L.autumnDark, L.autumn, m('gold', 'elevPeak', 0.2)] : [L.leafDark, L.leaf, L.leafLit];
  return out.concat(crown(sway, -82, 50, 38, 7, r, roles));
}
function rainTree(o) {
  const r = rnd(o.seed ?? 5);
  const out = [
    { d: `M-24 0Q-8 -6 -7 -30L-5 -160L5 -160L7 -30Q8 -6 24 0L10 -2L0 -8L-10 -2Z`, f: L.bark },
    { d: `M1 -8L4 -160L5 -160L7 -30Q8 -6 24 0L10 -2Z`, f: L.barkDark, a: 0.6 },
    { d: line([[-3, -150], [-34, -172]]) + line([[3, -152], [34, -176]]), s: L.bark, w: 4 },
  ];
  return out.concat(crown(-34, -178, 36, 18, 5, r, [L.leafDeep, L.leaf, L.leafLit]), crown(36, -182, 34, 17, 5, r, [L.leafDeep, L.leaf, L.leafLit]), crown(0, -188, 34, 16, 5, r, [L.leafDeep, L.leaf, L.leafLit]));
}
function underTree(o) {
  const r = rnd(o.seed ?? 7);
  return [{ d: leg(0, -56, 0, 6, 8), f: L.bark }, ...crown(0, -60, 38, 30, 6, r, [L.leafDeeper, L.leafDeep, L.leaf])];
}
function acacia(o) {
  const r = rnd(o.seed ?? 11);
  const out = [{ d: `M-5 0Q-2 -24 -4 -40L-30 -68L-26 -70L-1 -48L0 -72L5 -72L5 -48L28 -72L32 -68L5 -38Q4 -22 7 0Z`, f: L.bark }];
  const lobes = [];
  for (let i = 0; i < 9; i++) lobes.push([-54 + i * 13.5, -80 - Math.sin(i / 8 * Math.PI) * 8 + r() * 3, 12 + r() * 4]);
  const d = (dy) => lobes.map(([x, y, q]) => circle(x, y + dy, q)).join('') + rrect(-58, -84 + dy, 116, 12, 6);
  out.push({ d: d(5), f: L.leafDark }, { d: d(0), f: L.leaf });
  out.push({ d: lobes.filter((_, i) => i % 2).map(([x, y, q]) => circle(x - 2, y - 4, q * 0.6)).join(''), f: L.leafLit });
  return out;
}
function thornBush(o) {
  const r = rnd(o.seed ?? 13), spikes = [];
  for (let i = 0; i < 16; i++) { const a = Math.PI * (1 + i / 15), q = 30 + r() * 10; spikes.push(line([[Math.cos(a) * 16, Math.sin(a) * 10 - 8], [Math.cos(a) * q, Math.sin(a) * q * 0.82 - 4]])); }
  return [
    { d: spikes.join(''), s: L.barkDark, w: 2 },
    { d: blob([[-30, -2], [-28, -18], [-12, -30], [10, -32], [28, -20], [32, -2]]), f: m('elevLow', 'strata2', 0.44) },
    { d: blob([[-20, -8], [-14, -22], [4, -28], [18, -18], [8, -8]]), f: m('elevLow', 'gold', 0.4), a: 0.7 },
  ];
}
function cactus(o) {
  const arms = o.arms ?? 2, f = m('elevLow', 'seaDeep', 0.24), dark = m('elevLow', 'seaDeep', 0.56);
  let d = rrect(-9, -88, 18, 88, 9);
  if (arms > 0) d += `M-9 -38H-20Q-27 -38 -27 -45V-60` + `h9V-47H-9Z`;
  if (arms > 1) d += `M9 -50H20Q27 -50 27 -57V-72` + `h-9V-59H9Z`;
  return [
    { d, f },
    { d: line([[-3, -84], [-3, -2]]) + line([[3, -84], [3, -2]]), s: dark, w: 1.4 },
    { d: rrect(2, -86, 7, 86, 3.5), f: dark, a: 0.38 },
  ];
}
function blades(n, spread, tall, r, t, bend = 7) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / (n - 1) * 2 - 1, x = u * spread, h = tall * (0.64 + r() * 0.4), b = u * bend + Math.sin(t * 1.3 + i) * 2 + (r() - 0.5) * 5;
    d += `M${n1(x - 2.4)} 0Q${n1(x + b * 0.4)} ${n1(-h * 0.6)} ${n1(x + b)} ${n1(-h)}Q${n1(x + b * 0.5 + 2)} ${n1(-h * 0.5)} ${n1(x + 2.4)} 0Z`;
  }
  return d;
}
function grassTuft(o) {
  const r = rnd(o.seed ?? 17), t = o.t ?? 0, dry = o.dry;
  return [{ d: blades(7, 15, 30, r, t), f: dry ? L.dryDark : L.greenDark }, { d: blades(6, 11, 26, r, t + 1), f: dry ? L.dryGrass : L.green }];
}
function tallGrass(o) {
  const r = rnd(o.seed ?? 19), t = o.t ?? 0, dry = o.dry;
  const seeds = [];
  for (let i = 0; i < 5; i++) { const x = -38 + i * 19 + r() * 8, h = 58 + r() * 14; seeds.push(`M${n1(x)} ${n1(-h + 20)}Q${n1(x + 3)} ${n1(-h)} ${n1(x + 6)} ${n1(-h - 8)}`); }
  return [
    { d: blades(15, 44, 60, r, t, 12), f: dry ? L.dryDark : L.greenDark },
    { d: blades(13, 38, 52, r, t + 1, 10), f: dry ? L.dryGrass : L.green },
    { d: seeds.join(''), s: dry ? L.dryDark : L.dryGrass, w: 2.4 },
  ];
}
function moss(o) {
  const r = rnd(o.seed ?? 23), bumps = [];
  for (let i = 0; i < 7; i++) bumps.push([-24 + i * 8, -6 - r() * 6, 7 + r() * 3]);
  return [
    { d: bumps.map(([x, y, q]) => circle(x, y, q)).join('') + rrect(-30, -7, 60, 7, 3), f: L.mossDark },
    { d: bumps.map(([x, y, q]) => circle(x - 1, y - 2, q * 0.72)).join(''), f: L.moss },
  ];
}
function lichen(o) {
  const r = rnd(o.seed ?? 29), spots = [];
  for (let i = 0; i < 9; i++) spots.push(circle(-13 + r() * 26, -19 + r() * 13, 2 + r() * 2.6));
  return [
    { d: blob([[-20, 0], [-19, -14], [-8, -24], [9, -25], [19, -14], [21, 0]]), f: L.stone },
    { d: blob([[-20, 0], [-12, -6], [8, -7], [21, 0]]), f: L.stoneDark, a: 0.6 },
    { d: spots.join(''), f: L.lichen }, { d: spots.slice(0, 4).join(''), f: L.lichenDark },
  ];
}
function tundraShrub(o) {
  const r = rnd(o.seed ?? 31), n = 6, sticks = [];
  for (let i = 0; i < n; i++) { const x = -18 + i * 7; sticks.push(line([[0, 0], [x, -8 - r() * 8]])); }
  const lobes = []; for (let i = 0; i < 7; i++) lobes.push(circle(-18 + i * 6, -12 - Math.sin(i / 6 * Math.PI) * 6 + r() * 2, 5 + r() * 2));
  return [{ d: sticks.join(''), s: L.barkDark, w: 2 }, { d: lobes.join(''), f: L.autumnDark }, { d: lobes.slice(1, 5).join(''), f: L.autumn, a: 0.7 }];
}
function reeds(o) {
  const t = o.t ?? 0, out = [];
  for (const [x, h, p] of [[-16, 62, 0], [-6, 78, 1], [6, 70, 2], [17, 56, 3]]) {
    const b = Math.sin(t + p) * 3;
    out.push({ d: `M${x} 0Q${n1(x + b * 0.3)} ${n1(-h * 0.5)} ${n1(x + b)} ${-h}`, s: p % 2 ? L.greenDark : L.green, w: 3 });
    out.push({ d: rrect(x + b - 3, -h - 12, 6, 16, 3), f: L.brownDark });
  }
  return out;
}
function mangrove(o) {
  const r = rnd(o.seed ?? 37), roots = [];
  for (const x of [-34, -20, -7, 8, 22, 36]) roots.push(`M${n1(x * 0.3)} -30Q${n1(x * 0.9)} -28 ${x} 8`);
  return [
    { d: roots.join(''), s: L.barkDark, w: 3.4 },
    { d: leg(0, -46, -26, 7, 11), f: L.bark },
    ...crown(0, -58, 52, 26, 7, r, [L.leafDeep, L.leaf, L.leafLit]),
  ];
}
function bamboo(o) {
  const r = rnd(o.seed ?? 41), t = o.t ?? 0, out = [];
  for (let i = 0; i < 6; i++) {
    const x = -24 + i * 9.5 + r() * 3, h = 96 + r() * 34, b = (i - 2.5) * 3 + Math.sin(t + i) * 1.6;
    out.push({ d: `M${n1(x)} 0Q${n1(x + b * 0.2)} ${n1(-h * 0.6)} ${n1(x + b)} ${n1(-h)}`, s: i % 2 ? L.pineLit : L.green, w: 4.4 });
    let joints = '', leaves = '';
    for (let y = 16; y < h - 6; y += 18) { const u = y / h, jx = x + b * u * u; joints += line([[jx - 3, -y], [jx + 3, -y]]); if (y > h * 0.46) leaves += `M${n1(jx)} ${-y}q${(i % 2 ? 1 : -1) * 13} -9 ${(i % 2 ? 1 : -1) * 22} 3q${(i % 2 ? -1 : 1) * 12} 2 ${(i % 2 ? -1 : 1) * 22} -3Z`; }
    out.push({ d: joints, s: L.greenDark, w: 1.6 }, { d: leaves, f: L.leaf });
  }
  return out;
}
function fern(o) {
  const r = rnd(o.seed ?? 43), out = [];
  for (let i = 0; i < 5; i++) {
    const a = -2.5 + i * 0.42, q = 26 + r() * 10, x = Math.cos(a) * q, y = Math.sin(a) * q;
    let d = `M0 0Q${n1(x * 0.4)} ${n1(y * 1.1)} ${n1(x)} ${n1(y)}`;
    for (let j = 1; j < 6; j++) { const u = j / 6, px = x * u, py = y * (2 * u - u * u) * 0.9, w = 8 * (1 - u) + 2; d += `M${n1(px)} ${n1(py)}l${n1(-w * 0.5)} ${n1(-w)}M${n1(px)} ${n1(py)}l${n1(w * 0.5)} ${n1(w * 0.6)}`; }
    out.push({ d, s: i % 2 ? L.leaf : L.green, w: 2.2 });
  }
  return out;
}
function liana(o) {
  const r = rnd(o.seed ?? 47); let d = 'M0 0', leaves = '';
  for (let y = 20; y <= 120; y += 20) { const x = (r() - 0.5) * 16; d += `Q${n1(x * 1.6)} ${y - 10} ${n1(x)} ${y}`; leaves += ell(x + 5, y - 4, 6, 3) + ell(x - 5, y - 8, 5, 3); }
  return [{ d, s: L.barkDark, w: 2.4 }, { d: leaves, f: L.leaf }];
}
function waterLily() {
  return [
    { d: 'M-22 2A22 8 0 1 1 22 2L2 2L0 6Z', f: L.green },
    { d: 'M-16 2A16 5 0 0 1 16 2Z', f: L.leafDark, a: 0.3 },
    { d: blob([[8, -2], [4, -12], [10, -18], [16, -12], [12, -2]]), f: m('elevPeak', 'magma', 0.26) },
  ];
}

// -- animals ----------------------------------------------------------------------
function camel(o) {
  const two = (o.humps ?? 1) === 2;
  const f = two ? L.brown : L.camel, d = two ? L.brownDark : L.camelDark, lit = two ? L.brownLit : L.camelLit;
  const foot = 0, top = two ? -44 : -52, lw = two ? 12 : 9;
  const body = two
    ? [[-44, -56], [-40, -74], [-28, -76], [-22, -100], [-10, -102], [-3, -78], [4, -100], [16, -102], [22, -76], [36, -66], [44, -62], [47, -86], [52, -98], [68, -100], [74, -92], [62, -86], [60, -72], [56, -52], [36, -40], [4, -36], [-30, -38], [-42, -46]]
    : [[-44, -66], [-40, -84], [-22, -88], [-14, -114], [4, -116], [14, -90], [28, -82], [40, -70], [46, -78], [50, -98], [58, -112], [74, -110], [80, -100], [66, -94], [60, -84], [56, -62], [38, -50], [4, -46], [-30, -48], [-42, -56]];
  const out = [
    { d: leg(-30, top, foot, lw + 2, lw - 3, -3) + leg(30, top, foot, lw + 2, lw - 3, 3), f: d },
    { d: blob(body), f },
    { d: leg(-22, top, foot, lw + 3, lw - 3, 2) + leg(22, top, foot, lw + 3, lw - 3, -2), f },
    { d: hooves([-24, 19, -34, 32], foot, lw + 2, 4, d) .d, f: d },
    { d: line([[-44, -68], [-50, -48]]), s: d, w: 3 },
    eye(two ? 62 : 67, two ? -94 : -103, 1.9),
    { d: `M${two ? 66 : 73} ${two ? -89 : -98}l5 1`, s: L.ink, w: 1.4 },
  ];
  if (two && o.thin) out.push({ d: blob([[-20, -98], [-12, -100], [-8, -84], [-20, -82]]), f: lit, a: 0.4 });
  else if (two) {
    // Thick winter coat: a shaggy fringe under the neck, on the humps and down the upper legs.
    let fringe = '';
    for (let i = 0; i < 7; i++) fringe += `M${52 + i * 1.4} ${-82 + i * 7}l-5 9l10 -5`;
    for (let i = 0; i < 6; i++) fringe += `M${-24 + i * 4} ${-101 + (i % 3) * 2}l-3 -7l6 4` + `M${4 + i * 3.4} ${-101 + (i % 3) * 2}l-3 -7l6 4`;
    for (const x of [-24, 20]) for (let i = 0; i < 4; i++) fringe += `M${x - 7} ${-38 + i * 5}l-3 7l7 -3M${x + 7} ${-38 + i * 5}l3 7l-7 -3`;
    for (let i = 0; i < 9; i++) fringe += `M${-30 + i * 9} -38l-2 8l6 -5`;
    out.push({ d: fringe, s: d, w: 3, f: d, a: 0.9 });
    out.push({ d: blob([[-20, -98], [-12, -100], [-8, -84], [-20, -82]]) + blob([[6, -98], [14, -100], [18, -84], [6, -82]]), f: lit, a: 0.5 });
  } else {
    out.push({ d: blob([[-14, -110], [2, -112], [8, -92], [-10, -90]]), f: lit, a: 0.7 });
  }
  return out;
}
function reindeer() {
  const f = L.brown, d = L.brownDark;
  return [
    { d: leg(-30, -46, 0, 9, 5, -2) + leg(30, -46, 0, 9, 5, 2), f: d },
    { d: blob([[-46, -62], [-36, -74], [-8, -74], [24, -74], [34, -84], [44, -92], [58, -92], [68, -84], [58, -78], [46, -68], [40, -50], [20, -44], [-20, -44], [-42, -48]]), f },
    { d: leg(-22, -46, 0, 11, 5, 2) + leg(22, -46, 0, 11, 5, -2), f },
    { d: blob([[24, -70], [36, -66], [36, -44], [28, -36], [22, -44]]), f: L.whiteShade },
    { d: `M48 -92Q40 -112 26 -118M40 -106l-10 -2M36 -112l-4 -10M52 -92Q50 -112 62 -124M54 -108l10 -4M58 -118l-2 -10`, s: L.barkLit, w: 3 },
    hooves([-32, -22, 21, 32], 0, 7, 4, L.ink),
    eye(55, -86),
  ];
}
function polarBear() {
  const f = L.white, d = L.whiteDeep;
  return [
    { d: leg(-32, -30, 0, 16, 13, -2) + leg(30, -30, 0, 16, 13, 2), f: d },
    { d: blob([[-52, -30], [-46, -56], [-14, -66], [18, -60], [36, -52], [52, -46], [66, -38], [64, -30], [48, -28], [30, -22], [-30, -18]]), f },
    { d: leg(-24, -34, 0, 18, 14, 2) + leg(22, -34, 0, 18, 14, -2), f },
    { d: blob([[-44, -22], [-20, -18], [14, -20], [8, -28], [-30, -28]]), f: L.whiteShade },
    { d: circle(47, -48, 3.4), f: d }, eye(56, -41, 1.8), { d: circle(66, -35, 2.4), f: L.ink },
  ];
}
function arcticFox(o) {
  const f = o.summer ? L.brown : L.white, d = o.summer ? L.brownDark : L.whiteDeep;
  return [
    { d: leg(-22, -20, 0, 6, 4, -1) + leg(20, -20, 0, 6, 4, 1), f: d },
    { d: blob([[-34, -24], [-44, -28], [-64, -22], [-74, -30], [-62, -40], [-40, -38], [-30, -36]]), f: o.summer ? L.brownLit : L.whiteShade },
    { d: blob([[-34, -26], [-22, -38], [14, -38], [28, -44], [40, -46], [54, -36], [40, -32], [26, -22], [-10, -18], [-30, -18]]), f },
    { d: 'M28 -44l-2 -11l8 7ZM36 -46l2 -11l6 9Z', f },
    { d: leg(-14, -20, 0, 7, 4, 1) + leg(12, -20, 0, 7, 4, -1), f },
    eye(40, -39), { d: circle(53, -36, 1.9), f: L.ink },
  ];
}
function lion(o) {
  const f = L.tawny, d = L.tawnyDark, male = o.male !== false;
  const out = [
    { d: leg(-30, -36, 0, 11, 7, -2) + leg(28, -36, 0, 11, 7, 2), f: d },
    { d: 'M-46 -50Q-64 -44 -62 -28', s: d, w: 3.4 }, { d: circle(-62, -26, 4.4), f: L.mane },
    { d: blob([[-48, -46], [-40, -60], [-6, -62], [24, -62], [34, -46], [26, -30], [-16, -28], [-42, -32]]), f },
    { d: leg(-22, -36, 0, 13, 8, 2) + leg(20, -36, 0, 13, 8, -2), f },
  ];
  if (male) {
    const r = rnd(9), lobes = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; lobes.push(circle(38 + Math.cos(a) * 15, -60 + Math.sin(a) * 16, 7.5 + r() * 2)); }
    out.push({ d: lobes.join('') + circle(38, -60, 17), f: L.mane });
  }
  out.push({ d: blob([[28, -68], [44, -72], [56, -60], [58, -50], [44, -46], [32, -52]]), f: L.tawnyLit }, eye(46, -62), { d: circle(57, -55, 2), f: L.ink });
  return out;
}
function giraffe() {
  const f = L.tawnyLit, d = L.tawnyDark, marks = [];
  for (const [x, y, q] of [[-22, -92, 7], [-6, -96, 8], [10, -94, 7], [-14, -78, 6], [4, -80, 7], [20, -82, 5], [-30, -80, 5], [26, -106, 5], [32, -124, 5], [34, -142, 4], [40, -160, 4]]) marks.push(blob([[x - q, y], [x - q * 0.2, y - q], [x + q, y - q * 0.3], [x + q * 0.4, y + q * 0.8]]));
  return [
    { d: leg(-30, -76, 0, 8, 4, -1) + leg(22, -76, 0, 8, 4, 1), f: d },
    { d: blob([[-40, -74], [-34, -96], [-10, -106], [18, -114], [28, -146], [36, -176], [46, -176], [44, -146], [38, -110], [32, -84], [14, -70], [-20, -68]]), f },
    { d: leg(-22, -76, 0, 9, 4, 1) + leg(14, -76, 0, 9, 4, -1), f },
    { d: marks.join(''), f: d },
    { d: blob([[36, -180], [52, -184], [68, -174], [66, -168], [50, -168], [38, -170]]), f },
    { d: line([[40, -182], [38, -194]]) + line([[46, -183], [46, -195]]), s: d, w: 2.6 },
    { d: line([[-38, -86], [-46, -60]]), s: d, w: 2 },
    eye(52, -177),
  ];
}
function zebra() {
  const f = L.white, d = L.ink, st = [];
  for (const [x, y, h, b] of [[-34, -70, 26, 3], [-24, -74, 32, 2], [-14, -75, 34, 0], [-4, -75, 34, 0], [6, -75, 34, -1], [16, -76, 32, -2], [26, -80, 32, -4]]) st.push(`M${x} ${y}q${b} ${n1(h / 2)} ${b * 2} ${h}`);
  for (const [x, y] of [[32, -78], [38, -84], [43, -90]]) st.push(`M${x} ${y}l10 12`);
  for (const x of [-30, -20, 16, 26]) for (const y of [-34, -22, -12]) st.push(`M${x - 4} ${y}h8`);
  return [
    { d: leg(-30, -44, 0, 9, 4, -2) + leg(26, -44, 0, 9, 4, 2), f: L.whiteDeep },
    { d: line([[-44, -62], [-52, -40]]), s: d, w: 3 },
    { d: blob([[-46, -60], [-38, -74], [-6, -76], [26, -78], [40, -98], [52, -100], [68, -90], [72, -78], [60, -76], [50, -72], [42, -54], [20, -42], [-22, -42], [-42, -48]]), f },
    { d: leg(-20, -44, 0, 11, 5, 2) + leg(16, -44, 0, 11, 5, -2), f },
    { d: st.join(''), s: d, w: 3.2 },
    { d: 'M26 -80L38 -100L50 -102', s: d, w: 4 },
    { d: blob([[62, -86], [72, -80], [70, -74], [60, -76]]), f: d },
    eye(55, -90, 2), hooves([-32, -20, 15, 28], 0, 7, 4, d),
  ];
}
function yak() {
  const f = L.brownDark, d = L.ink, lit = L.brown; let fringe = '';
  for (let i = 0; i < 16; i++) fringe += `M${-44 + i * 6} -30l-3 16l7 -9`;
  return [
    { d: leg(-30, -32, 0, 13, 9, -2) + leg(28, -32, 0, 13, 9, 2), f: d },
    { d: blob([[-50, -44], [-42, -70], [-8, -80], [18, -92], [38, -78], [52, -64], [60, -50], [46, -40], [30, -26], [-30, -24]]), f },
    { d: fringe, s: f, w: 3, f },
    { d: leg(-20, -30, 0, 14, 9, 2) + leg(20, -30, 0, 14, 9, -2), f },
    { d: blob([[34, -70], [52, -70], [66, -54], [60, -44], [44, -46], [34, -58]]), f: lit },
    { d: 'M42 -70Q34 -84 44 -90M50 -70Q58 -82 54 -92', s: L.whiteShade, w: 3.6 },
    { d: 'M-48 -46Q-60 -38 -56 -18', s: f, w: 5 },
    eye(49, -60, 2),
  ];
}
function antelope(o) {
  const f = o.dark ? L.brownDark : L.tawny, d = o.dark ? L.ink : L.tawnyDark;
  return [
    { d: leg(-26, -40, 0, 7, 3, -1) + leg(24, -40, 0, 7, 3, 1), f: d },
    { d: blob([[-40, -54], [-30, -64], [20, -64], [32, -80], [46, -88], [60, -82], [64, -74], [50, -72], [42, -60], [30, -44], [-16, -40], [-36, -44]]), f },
    { d: blob([[-30, -42], [20, -42], [12, -48], [-28, -48]]), f: L.white },
    { d: leg(-18, -40, 0, 8, 3, 1) + leg(16, -40, 0, 8, 3, -1), f },
    { d: 'M44 -88Q38 -100 46 -104Q38 -110 46 -118M50 -88Q46 -100 54 -104Q46 -110 54 -118', s: L.ink, w: 2.2 },
    { d: line([[-40, -56], [-46, -44]]), s: d, w: 2.4 },
    eye(52, -80, 1.9), hooves([-27, -18, 15, 24], 0, 5, 3, L.ink),
  ];
}
function frog() {
  return [
    { d: blob([[-14, 0], [-20, -8], [-8, -18], [8, -18], [16, -8], [12, 0]]), f: L.green },
    { d: 'M-14 0Q-24 -4 -18 -12Q-8 -8 -6 0Z', f: L.greenDark },
    { d: circle(8, -19, 4), f: L.green }, eye(9, -20, 2),
    { d: 'M6 0l10 0M6 0l6 -5', s: L.greenDark, w: 2.6 },
  ];
}
function hornbill() {
  return [
    { d: line([[-5, 0], [-6, -6]]) + line([[3, 0], [2, -6]]), s: L.ink, w: 2 },
    { d: blob([[-34, 4], [-20, -8], [-8, -24], [6, -34], [18, -30], [16, -14], [2, -2], [-14, 2]]), f: L.ink },
    { d: blob([[-44, 12], [-34, 2], [-22, -4], [-22, 4]]), f: L.whiteShade },
    { d: blob([[2, -6], [10, -14], [10, -24], [2, -16]]), f: L.white },
    { d: 'M16 -34Q36 -36 46 -18Q30 -26 16 -24Z', f: L.beak },
    { d: 'M15 -36Q28 -44 36 -32Q26 -34 16 -32Z', f: L.yellow },
    eye(13, -31, 1.9, L.white),
  ];
}
function turtle() {
  return [
    { d: 'M18 4Q34 14 28 24L22 12ZM-20 6Q-36 14 -34 22L-22 12Z', f: L.leafDark },
    { d: 'M18 -6Q36 -16 34 -24L22 -12ZM-20 -2l-14 -6l10 12Z', f: L.leafDark },
    { d: blob([[-34, 0], [-22, -14], [10, -16], [30, -2], [14, 12], [-22, 12]]), f: L.brown },
    { d: `M-20 -8L0 -14M-22 8L2 10M0 -14L12 -2L2 10M-8 -2L12 -2M-8 -2L-20 -8M-8 -2L-22 8`, s: L.brownDark, w: 2 },
    { d: blob([[28, -8], [40, -10], [50, -2], [42, 6], [30, 4]]), f: L.leaf }, eye(43, -3, 1.8),
  ];
}
function lizard() {
  return [
    { d: 'M-16 0Q-34 -2 -44 -12Q-30 -6 -16 -6Z', f: L.tawnyDark },
    { d: blob([[-20, -2], [-8, -8], [14, -8], [28, -5], [32, -2], [14, 0], [-8, 0]]), f: L.tawny },
    { d: 'M-10 -2l-7 7M-8 -3l8 6M14 -2l-6 7M16 -2l8 6', s: L.tawnyDark, w: 2.2 },
    eye(25, -5, 1.4),
  ];
}
function snake() {
  return [
    { d: 'M-36 -4Q-24 -18 -12 -6T12 -6T32 -8', s: L.dryDark, w: 8 },
    { d: 'M-36 -4Q-24 -18 -12 -6T12 -6T32 -8', s: L.dryGrass, w: 4.4 },
    { d: blob([[28, -13], [40, -12], [44, -8], [38, -4], [28, -5]]), f: L.dryDark }, eye(38, -9, 1.4),
  ];
}
function butterfly() {
  return [
    { d: blob([[0, 0], [-6, -10], [-14, -9], [-12, 0], [-8, 8], [-2, 5]]) + blob([[0, 0], [6, -10], [14, -9], [12, 0], [8, 8], [2, 5]]), f: L.autumn },
    { d: circle(-9, -5, 2) + circle(9, -5, 2), f: L.white },
    { d: line([[0, -6], [0, 7]]), s: L.ink, w: 2 },
  ];
}
function monkey() {
  return [
    { d: 'M-8 -4Q-22 6 -18 30Q-14 40 -8 34', s: L.brownDark, w: 3 },
    { d: blob([[-12, 0], [-14, -20], [-4, -30], [8, -26], [10, -8], [8, 0]]), f: L.brown },
    { d: circle(4, -36, 11), f: L.brown }, { d: ell(7, -33, 6.4, 5.4), f: L.brownLit }, eye(8, -36, 1.5),
    { d: 'M6 -16Q18 -6 14 2', s: L.brown, w: 4 }, { d: 'M-4 -2Q6 6 8 14', s: L.brownDark, w: 4.4 },
  ];
}

function elephant() {
  const f = L.stone, d = L.stoneDark;
  return [
    { d: leg(-30, -50, 0, 18, 15, -1) + leg(26, -50, 0, 18, 15, 1), f: d },
    { d: blob([[-52, -60], [-46, -92], [-14, -104], [22, -102], [44, -94], [56, -84], [62, -62], [54, -48], [30, -40], [-30, -38], [-50, -44]]), f },
    { d: leg(-20, -50, 0, 20, 16, 1) + leg(18, -50, 0, 20, 16, -1), f },
    { d: 'M56 -74Q78 -60 76 -30Q75 -12 86 -8Q72 -4 66 -24Q64 -44 48 -56Z', f },
    { d: blob([[24, -96], [46, -94], [50, -68], [36, -52], [22, -66]]), f: d },
    { d: 'M60 -56Q72 -52 78 -60', s: L.white, w: 4 },
    { d: line([[-52, -74], [-60, -44]]), s: d, w: 3 },
    eye(56, -76, 2),
  ];
}
function snowcock() {
  return [
    { d: line([[-4, 0], [-5, -10]]) + line([[6, 0], [5, -10]]), s: L.red, w: 2.6 },
    { d: blob([[-30, -18], [-22, -30], [0, -34], [14, -44], [26, -42], [28, -32], [18, -22], [6, -8], [-16, -8]]), f: L.stone },
    { d: blob([[-24, -18], [-8, -28], [6, -20], [-6, -12]]), f: L.stoneDark },
    { d: blob([[0, -18], [12, -24], [14, -16], [4, -10]]), f: L.white },
    { d: 'M27 -38l8 3l-8 2Z', f: L.yellow }, eye(21, -38, 1.7),
  ];
}
function whale() {
  return [
    { d: blob([[-60, -6], [-30, -22], [20, -26], [58, -14], [66, 0], [40, 14], [-10, 14], [-48, 6]]), f: L.waterMid },
    { d: blob([[-30, 8], [10, 4], [52, 0], [40, 14], [-10, 14]]), f: L.white, a: 0.7 },
    { d: 'M-56 -2Q-74 -6 -84 -20Q-76 -14 -70 -12Q-74 -22 -68 -30Q-62 -18 -50 -8Z', f: L.waterMid },
    { d: 'M16 10Q10 22 -4 26Q2 14 4 10Z', f: L.waterDeep }, eye(44, -2, 2),
  ];
}
function dolphin() {
  return [
    { d: blob([[-44, 0], [-18, -14], [14, -16], [34, -8], [54, -4], [34, 2], [8, 10], [-22, 8]]), f: L.stone },
    { d: 'M-2 -14L-10 -28L8 -15Z M-40 0L-58 -10L-52 2L-58 12Z', f: L.stoneDark },
    { d: blob([[-20, 6], [8, 6], [34, 1], [8, 10]]), f: L.white }, eye(30, -6, 1.7),
  ];
}
function shrubScrub(o) {
  const r = rnd(o.seed ?? 53);
  return [{ d: leg(0, -16, 0, 5, 6), f: L.bark }, ...crown(0, -26, 34, 18, 6, r, [m('elevLow', 'strata3', 0.5), m('elevLow', 'gold', 0.3), m('elevLow', 'gold', 0.6)])];
}

// -- pairs ------------------------------------------------------------------------
const THINGS = {
  Conifer: conifer, BroadLeaf: broadLeaf, RainTree: rainTree, UnderTree: underTree, Acacia: acacia, ThornBush: thornBush, Cactus: cactus,
  GrassTuft: grassTuft, TallGrass: tallGrass, Moss: moss, Lichen: lichen, TundraShrub: tundraShrub, Reeds: reeds, Mangrove: mangrove,
  Bamboo: bamboo, Fern: fern, Liana: liana, WaterLily: waterLily,
  Camel: camel, Reindeer: reindeer, PolarBear: polarBear, ArcticFox: arcticFox, Lion: lion, Giraffe: giraffe, Zebra: zebra, Yak: yak, Antelope: antelope,
  Elephant: elephant, Snowcock: snowcock, Whale: whale, Dolphin: dolphin, Scrub: shrubScrub, Frog: frog, Hornbill: hornbill, Turtle: turtle, Lizard: lizard, Snake: snake, Butterfly: butterfly, Monkey: monkey,
};
export const LIFE_NAMES = Object.keys(THINGS);
export const drawLife = (ctx, c, name, x, y, s = 1, o = {}) => drawPrims(ctx, c, THINGS[name](o), x, y, s, o);
export const svgLife = (name, x, y, s = 1, o = {}) => svgPrims(THINGS[name](o), x, y, s, o);
const dr = (name) => (ctx, c, x, y, s, o) => drawLife(ctx, c, name, x, y, s, o);
const sv = (name) => (x, y, s, o) => svgLife(name, x, y, s, o);
export const drawConifer = dr('Conifer'), svgConifer = sv('Conifer'), drawBroadLeaf = dr('BroadLeaf'), svgBroadLeaf = sv('BroadLeaf');
export const drawRainTree = dr('RainTree'), svgRainTree = sv('RainTree'), drawUnderTree = dr('UnderTree'), svgUnderTree = sv('UnderTree');
export const drawAcacia = dr('Acacia'), svgAcacia = sv('Acacia'), drawThornBush = dr('ThornBush'), svgThornBush = sv('ThornBush');
export const drawCactus = dr('Cactus'), svgCactus = sv('Cactus'), drawGrassTuft = dr('GrassTuft'), svgGrassTuft = sv('GrassTuft');
export const drawTallGrass = dr('TallGrass'), svgTallGrass = sv('TallGrass'), drawMoss = dr('Moss'), svgMoss = sv('Moss');
export const drawLichen = dr('Lichen'), svgLichen = sv('Lichen'), drawTundraShrub = dr('TundraShrub'), svgTundraShrub = sv('TundraShrub');
export const drawReeds = dr('Reeds'), svgReeds = sv('Reeds'), drawMangrove = dr('Mangrove'), svgMangrove = sv('Mangrove');
export const drawBamboo = dr('Bamboo'), svgBamboo = sv('Bamboo'), drawFern = dr('Fern'), svgFern = sv('Fern');
export const drawLiana = dr('Liana'), svgLiana = sv('Liana'), drawWaterLily = dr('WaterLily'), svgWaterLily = sv('WaterLily');
export const drawCamel = dr('Camel'), svgCamel = sv('Camel'), drawReindeer = dr('Reindeer'), svgReindeer = sv('Reindeer');
export const drawPolarBear = dr('PolarBear'), svgPolarBear = sv('PolarBear'), drawArcticFox = dr('ArcticFox'), svgArcticFox = sv('ArcticFox');
export const drawLion = dr('Lion'), svgLion = sv('Lion'), drawGiraffe = dr('Giraffe'), svgGiraffe = sv('Giraffe');
export const drawZebra = dr('Zebra'), svgZebra = sv('Zebra'), drawYak = dr('Yak'), svgYak = sv('Yak');
export const drawAntelope = dr('Antelope'), svgAntelope = sv('Antelope'), drawFrog = dr('Frog'), svgFrog = sv('Frog');
export const drawHornbill = dr('Hornbill'), svgHornbill = sv('Hornbill'), drawTurtle = dr('Turtle'), svgTurtle = sv('Turtle');
export const drawLizard = dr('Lizard'), svgLizard = sv('Lizard'), drawSnake = dr('Snake'), svgSnake = sv('Snake');
export const drawElephant = dr('Elephant'), svgElephant = sv('Elephant'), drawSnowcock = dr('Snowcock'), svgSnowcock = sv('Snowcock'), drawWhale = dr('Whale'), svgWhale = sv('Whale'), drawDolphin = dr('Dolphin'), svgDolphin = sv('Dolphin'), drawScrub = dr('Scrub'), svgScrub = sv('Scrub');
export const drawButterfly = dr('Butterfly'), svgButterfly = sv('Butterfly'), drawMonkey = dr('Monkey'), svgMonkey = sv('Monkey');
export { drawPalm, svgPalm, drawFish, svgFish };

// -- biome strips -----------------------------------------------------------------
export const BIOME_IDS = ['rainforest', 'seasonal', 'scrubland', 'temperate', 'taiga', 'grassland', 'savanna', 'desert', 'coldDesert', 'tundra', 'freshwater', 'marine', 'wetland', 'ice', 'mountain', 'bareLake'];
const MAP_ROLE = {
  rainforest: dk('elevLow', 0.42), seasonal: m('elevLow', 'strata6', 0.2), scrubland: m('elevLow', 'strata1', 0.5), temperate: m('elevLow', 'gold', 0.1), taiga: m('elevLow', 'seaShallow', 0.5), grassland: m('elevLow', 'gold', 0.52), savanna: m('gold', 'strata2', 0.3),
  desert: m('strata1', 'gold', 0.4), coldDesert: m('strata1', 'strata5', 0.34), tundra: m('gold', 'magma', 0.46), freshwater: 'seaShallow', marine: 'seaDeep',
  wetland: m('seaShallow', 'elevLow', 0.4), ice: 'elevPeak', mountain: 'elevHigh', bareLake: 'elevHigh',
};
export const biomeColour = (c, id) => seaColour(c, MAP_ROLE[id]);
export const svgBiomeColour = (id) => svgSeaColour(MAP_ROLE[id]);

const GROUND = {
  rainforest: [L.soilDark, L.leafDark], seasonal: [L.soil, L.green], scrubland: [L.soil, m('strata1', 'elevLow', 0.4)], temperate: [L.soil, L.green], taiga: [L.soilDark, L.pine], grassland: [L.soil, L.green], savanna: [L.sandDark, L.dryGrass],
  desert: [L.sandDark, L.sand], coldDesert: [L.stoneDark, m('strata1', 'strata5', 0.3)], tundra: [L.stoneDark, L.moss], wetland: [L.soilDark, L.green], bareLake: [L.stoneDark, L.stone], ice: [L.snowDeep, L.snow], mountain: [L.stoneDark, L.stone],
};
// [name, u across, v above the ground as a share of height, scale as a share of height, options]
const CAST = {
  rainforest: [['RainTree', 0.22, 0, 0.0039], ['RainTree', 0.78, 0, 0.0036, { seed: 8 }], ['UnderTree', 0.5, 0, 0.0064, { seed: 3 }], ['UnderTree', 0.08, 0, 0.006], ['UnderTree', 0.92, 0, 0.0066, { seed: 5 }], ['Palm', 0.36, 0, 0.005], ['Fern', 0.32, 0, 0.007], ['Fern', 0.66, 0, 0.008, { seed: 4 }], ['Hornbill', 0.5, 0.56, 0.0052, { a: 1 }]],
  seasonal: [['BroadLeaf', 0.14, 0, 0.0074, { seed: 2 }], ['BroadLeaf', 0.38, 0, 0.0084, { seed: 4 }], ['BroadLeaf', 0.64, 0, 0.0072, { seed: 7, tint: 1 }], ['BroadLeaf', 0.88, 0, 0.0078, { seed: 9 }], ['Scrub', 0.52, 0, 0.0064]],
  scrubland: [['Scrub', 0.14, 0, 0.0078], ['Scrub', 0.38, 0, 0.0092, { seed: 4 }], ['Scrub', 0.62, 0, 0.0074, { seed: 7 }], ['Scrub', 0.86, 0, 0.0086, { seed: 9 }], ['GrassTuft', 0.26, 0, 0.0064, { dry: true }], ['GrassTuft', 0.74, 0, 0.0064, { dry: true, seed: 3 }]],
  temperate: [['BroadLeaf', 0.16, 0, 0.0072], ['BroadLeaf', 0.42, 0, 0.0086, { seed: 6, tint: 1 }], ['BroadLeaf', 0.7, 0, 0.0076, { seed: 9 }], ['BroadLeaf', 0.92, 0, 0.0066, { seed: 12, tint: 1 }], ['Antelope', 0.56, 0, 0.0034, { a: 1 }]],
  taiga: [['Conifer', 0.1, 0, 0.0064], ['Conifer', 0.26, 0, 0.0076, { snow: true }], ['Conifer', 0.42, 0, 0.0062], ['Conifer', 0.6, 0, 0.0078, { snow: true }], ['Conifer', 0.78, 0, 0.0066, { slim: true }], ['Conifer', 0.92, 0, 0.0074, { snow: true }]],
  grassland: [['TallGrass', 0.14, 0, 0.0074], ['TallGrass', 0.44, 0, 0.0086, { seed: 3 }], ['TallGrass', 0.74, 0, 0.0076, { seed: 6 }], ['GrassTuft', 0.3, 0, 0.0074], ['GrassTuft', 0.6, 0, 0.0072, { seed: 4 }], ['GrassTuft', 0.9, 0, 0.0074, { seed: 5 }], ['Antelope', 0.56, 0, 0.0044, { a: 1 }]],
  savanna: [['Acacia', 0.2, 0, 0.0068], ['Acacia', 0.82, 0, 0.0052, { seed: 3 }], ['TallGrass', 0.44, 0, 0.0074, { dry: true }], ['TallGrass', 0.66, 0, 0.0062, { dry: true, seed: 8 }], ['Giraffe', 0.6, 0, 0.0046, { a: 1 }], ['Zebra', 0.38, 0, 0.0034, { a: 1 }]],
  desert: [['Cactus', 0.2, 0, 0.007], ['Cactus', 0.8, 0, 0.0056, { arms: 1 }], ['ThornBush', 0.56, 0, 0.0056], ['Camel', 0.46, 0, 0.0044, { a: 1, humps: 1 }], ['Lizard', 0.72, 0, 0.0044, { a: 1 }]],
  coldDesert: [['ThornBush', 0.2, 0, 0.0044, { seed: 4 }], ['ThornBush', 0.82, 0, 0.0038, { seed: 7 }], ['Camel', 0.5, 0, 0.0046, { a: 1, humps: 2 }]],
  tundra: [['Moss', 0.14, 0, 0.0074], ['Lichen', 0.3, 0, 0.0074], ['TundraShrub', 0.7, 0, 0.0074], ['Moss', 0.54, 0, 0.0066, { seed: 2 }], ['Lichen', 0.9, 0, 0.0066, { seed: 5 }], ['Reindeer', 0.46, 0, 0.0044, { a: 1 }], ['ArcticFox', 0.82, 0, 0.0028, { a: 1, summer: true }]],
  wetland: [['Reeds', 0.14, 0, 0.0086], ['Reeds', 0.84, 0, 0.0096], ['Reeds', 0.32, 0, 0.0066], ['Mangrove', 0.62, 0, 0.0066], ['Frog', 0.44, 0, 0.0086, { a: 1 }]],
  ice: [['PolarBear', 0.5, 0, 0.0044, { a: 1 }]],
  bareLake: [['Lichen', 0.2, 0, 0.0066], ['Lichen', 0.8, 0, 0.0056, { seed: 3 }]],
  mountain: [['Conifer', 0.14, 0, 0.0056, { snow: true }], ['Conifer', 0.3, 0, 0.0046, { snow: true }], ['Yak', 0.66, 0, 0.0036, { a: 1 }]],
  freshwater: [], marine: [],
};
function stripPrims(id, x, y, w, h, o) {
  const r = rnd(o.seed ?? 5), gy = y + h * 0.8, out = [];
  if (o.sky) out.push({ d: rrect(x, y, w, h, 0), f: 'skyDay' });
  if (id === 'marine' || id === 'freshwater') {
    const top = y + h * (o.sky ? 0.3 : 0.12), deep = id === 'marine';
    out.push({ d: rrect(x, top, w, y + h - top, 0), f: deep ? L.waterDeep : L.water });
    out.push({ d: rrect(x, top, w, (y + h - top) * 0.4, 0), f: deep ? L.waterMid : m('seaShallow', 'elevPeak', 0.2) });
    let bed = `M${n1(x)} ${n1(y + h)}`;
    for (let i = 0; i <= 8; i++) bed += `L${n1(x + w * i / 8)} ${n1(y + h - h * 0.1 - r() * h * 0.06)}`;
    out.push({ d: bed + `L${n1(x + w)} ${n1(y + h)}Z`, f: deep ? L.sandDark : L.soil });
    return out;
  }
  const g = GROUND[id];
  let top = `M${n1(x)} ${n1(y + h)}L${n1(x)} ${n1(gy)}`;
  const bumps = id === 'coldDesert' || id === 'mountain' ? 0.1 : id === 'desert' ? 0.07 : 0.03;
  for (let i = 1; i <= 8; i++) top += `Q${n1(x + w * (i - 0.5) / 8)} ${n1(gy - r() * h * bumps)} ${n1(x + w * i / 8)} ${n1(gy + (r() - 0.5) * h * 0.02)}`;
  out.push({ d: top + `L${n1(x + w)} ${n1(y + h)}Z`, f: g[1] });
  out.push({ d: rrect(x, y + h * 0.9, w, h * 0.1, 0), f: g[0], a: 0.55 });
  if (id === 'tundra') { let cr = ''; for (let i = 0; i < 9; i++) cr += line([[x + w * (0.05 + i * 0.11), y + h * 0.84], [x + w * (0.08 + i * 0.11), y + h * 0.96]]); out.push({ d: cr, s: L.stoneDark, w: 1.6, a: 0.6 }); }
  if (id === 'bareLake') {
    // A high lake among snowy peaks: grey rock with white caps behind, the lake on the bare ground in front.
    const py = gy + h * 0.02, peak = (u, half, top) => {
      const px = x + w * u, tx = y + h * top, b = half * w, cap = 0.46;
      out.push({ d: `M${n1(px - b)} ${n1(py)}L${n1(px)} ${n1(tx)}L${n1(px + b)} ${n1(py)}Z`, f: L.stone });
      out.push({ d: `M${n1(px - b)} ${n1(py)}L${n1(px)} ${n1(py - (py - tx) * 0.62)}L${n1(px + b)} ${n1(py)}Z`, f: L.stoneDark, a: 0.4 });
      const ly = tx + (py - tx) * cap, lx = b * cap;
      out.push({ d: `M${n1(px)} ${n1(tx)}L${n1(px + lx)} ${n1(ly)}L${n1(px + lx * 0.45)} ${n1(ly - h * 0.03)}L${n1(px + lx * 0.1)} ${n1(ly + h * 0.04)}L${n1(px - lx * 0.3)} ${n1(ly - h * 0.03)}L${n1(px - lx)} ${n1(ly)}Z`, f: L.snow, s: L.snowDeep, w: 1 });
    };
    peak(0.14, 0.24, 0.26); peak(0.86, 0.24, 0.22); peak(0.34, 0.2, 0.16); peak(0.68, 0.22, 0.1); peak(0.5, 0.17, 0.3);
    out.push({ d: rrect(x + w * 0.08, gy - h * 0.03, w * 0.84, h * 0.19, h * 0.08), f: L.water });
    out.push({ d: rrect(x + w * 0.18, gy + h * 0.02, w * 0.42, h * 0.024, h * 0.012), f: L.snow, a: 0.7 });
    out.push({ d: rrect(x + w * 0.46, gy + h * 0.08, w * 0.34, h * 0.02, h * 0.01), f: L.snow, a: 0.5 });
  }
  if (id === 'wetland') out.push({ d: rrect(x, gy + h * 0.03, w, h * 0.17, 0), f: L.water, a: 0.86 });
  return out;
}
function placeCast(id, x, y, w, h, o, paint) {
  const gy = y + h * 0.82, base = Math.min(h, w * 0.6);
  for (const [name, u, v, q, opt] of CAST[id] ?? []) {
    if (opt?.a && o.animals === false) continue;
    const scale = q * base, px = x + w * u, py = gy - v * base;
    paint(name, px, py, scale, { t: o.t ?? 0, ...(opt ?? {}) });
  }
}
export function drawBiomeStrip(ctx, c, id, x, y, w, h, o = {}) {
  drawPrims(ctx, c, stripPrims(id, x, y, w, h, o));
  placeCast(id, x, y, w, h, o, (name, px, py, s, op) => (name === 'Palm' ? drawPalm(ctx, c, px, py, s, op) : drawLife(ctx, c, name, px, py, s, op)));
}
export function svgBiomeStrip(id, x, y, w, h, o = {}) {
  let out = svgPrims(stripPrims(id, x, y, w, h, o));
  placeCast(id, x, y, w, h, o, (name, px, py, s, op) => { out += name === 'Palm' ? svgPalm(px, py, s, op) : svgLife(name, px, py, s, op); });
  return out;
}
