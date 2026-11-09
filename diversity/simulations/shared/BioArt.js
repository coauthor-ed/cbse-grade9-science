// BioArt.js - drawn organisms for the diversity module: microbes, fungi, plants, invertebrates and the vertebrates
// LifeArt does not have. Built on the SeaArt primitives, same two forms as LifeArt:
//   canvas  drawBio(ctx, c, name, x, y, s, o)    c = this.colors of a scene with COLOR_MAP = LIFE_COLOR_MAP
//   SVG     svgBio(name, x, y, s, o)             a string, one closed <g>, to put in an <svg>
//   icon    bioIcon(name, size, o)               a whole <svg> fitted to the drawing, for DOM cards. name may be any
//                                                BIO_NAMES entry or any LifeArt LIFE_NAMES entry. aria-hidden.
// o always takes rot (degrees), flip (true), alpha (0..1). Colours follow the subject, tokens only. Text is the
// scene's job: nothing here writes a word. The art is daylight in both themes: ink on it comes from bioColour.
// No eyes on anything without a backbone. Vertebrates get one plain dot.
//
// BOX[name] = [x, y, w, h], the drawing's bounds at s = 1 around its origin. Origins below.
// Fungi (origin: foot):       Mushroom (o.threads true: mycelium under it)
// Fungi (origin: middle):     Mycelium (o.seed, o.spread 0..1)   Yeast (o.buds 0..2)
// Plants (origin: foot):      Gulmohar (o.bloom 0..1)  FernPlant (o.roots true)  MossClump (o.rhizoids true, o.capsule false)
//                             PineTree (o.cones false)  Leaf (o.parallel true: monocot veins)  MangroveTree (o.water true)
// Plants (origin: middle):    Cone  PineNeedles  Spirogyra (o.cells, default 4)
// Lichen (origin: middle):    LichenBark
// Animals (origin: middle):   Sponge and Hydra stand on their foot. Sponge (o.flow true: pores open)  Hydra (o.bud true)
//                             Flatworm (o.gut true)  Roundworm  Earthworm (o.t: phase of the contraction wave)
//                             Beetle  Crab  Snail (foot)  Octopus  Starfish  Urchin  Amphioxus (o.notochord 0..1)
// Microbes (origin: middle):  Bacterium (o.form rod, coccus, spiral)  Cyanobacterium  Amoeba (o.seed)  Paramecium  Euglena
// Vertebrates (origin: ground, nose right, Bat middle):  Tiger  Deer  Eagle  Owl  Bat  Sparrow  Ostrich
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';
import {
  drawPrims, svgPrims, pathLine as line, pathCircle as circle, pathEllipse as ell, pathRoundRect as rrect,
  blend as m, darkenRole as dk, seaColour, svgSeaColour,
} from './SeaArt.js';
import { svgLife, svgFish, LIFE_NAMES } from './LifeArt.js';

export const BIO_COLOR_MAP = GEO_COLOR_MAP;
export const bioColour = (c, role) => seaColour(c, B[role] ?? role);
export const svgBioColour = (role) => svgSeaColour(B[role] ?? role);

const n1 = (v) => Math.round(v * 10) / 10;
const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

// -- colours ----------------------------------------------------------------------
export const B = {
  ink: dk('strata6', 0.3), inkSoft: 'strata5', white: 'elevPeak', whiteShade: m('elevPeak', 'strata5', 0.2),
  leaf: m('elevLow', 'strata6', 0.14), leafDark: m('elevLow', 'strata6', 0.42), leafLit: m('elevLow', 'gold', 0.3), leafDeep: m('elevLow', 'seaDeep', 0.5),
  bark: m('strata3', 'strata6', 0.36), barkDark: m('strata3', 'strata6', 0.7), barkLit: m('strata3', 'strata1', 0.4),
  soil: 'strata2', soilDark: m('strata3', 'strata6', 0.34), water: 'seaShallow', waterDeep: 'seaDeep', waterPale: m('seaShallow', 'elevPeak', 0.5),
  cap: m('strata3', 'strata2', 0.3), capDark: m('strata3', 'strata6', 0.34), capLit: m('strata2', 'strata1', 0.42),
  gill: m('strata1', 'elevPeak', 0.42), gillLine: m('strata1', 'strata3', 0.6), stem: m('elevPeak', 'strata1', 0.42), stemShade: m('strata1', 'strata2', 0.34),
  thread: m('elevPeak', 'strata1', 0.3), threadDark: m('strata1', 'strata3', 0.5), threadRim: m('strata3', 'strata6', 0.6),
  bloom: m('magma', 'strata3', 0.1), bloomLit: m('magma', 'gold', 0.42), bloomDark: m('magma', 'strata6', 0.34),
  frond: m('elevLow', 'strata6', 0.24), frondLit: m('elevLow', 'gold', 0.18),
  moss: m('elevLow', 'gold', 0.36), mossDark: m('elevLow', 'strata6', 0.34), capsule: m('strata2', 'strata3', 0.5),
  pine: m('elevLow', 'seaDeep', 0.42), pineDark: m('elevLow', 'strata6', 0.62), pineLit: m('elevLow', 'seaDeep', 0.2),
  cone: m('strata3', 'strata2', 0.2), coneDark: m('strata3', 'strata6', 0.5), coneLit: m('strata2', 'strata1', 0.3),
  sponge: m('gold', 'magma', 0.24), spongeDark: m('gold', 'strata3', 0.42), spongeLit: m('gold', 'elevPeak', 0.34), spongeHole: m('strata3', 'strata6', 0.46),
  hydra: m('strata1', 'magma', 0.2), hydraDark: m('strata2', 'strata3', 0.5), hydraLit: m('strata1', 'elevPeak', 0.42),
  flat: m('strata2', 'magma', 0.14), flatDark: m('strata3', 'strata6', 0.2), flatLit: m('strata1', 'magma', 0.14),
  round: m('elevPeak', 'strata1', 0.56), roundDark: m('strata1', 'strata3', 0.44), roundLit: 'elevPeak',
  worm: m('magma', 'strata2', 0.6), wormDark: m('strata3', 'magma', 0.26), wormLit: m('strata1', 'magma', 0.34), wormBand: m('magma', 'elevPeak', 0.3),
  shellA: m('seaDeep', 'strata6', 0.34), shellB: m('seaDeep', 'elevLow', 0.44), shellLit: m('seaShallow', 'elevPeak', 0.4), shellDark: dk('strata6', 0.34),
  crab: m('magma', 'strata3', 0.14), crabDark: m('magma', 'strata6', 0.4), crabLit: m('magma', 'gold', 0.5),
  snail: m('strata2', 'gold', 0.3), snailDark: m('strata3', 'strata6', 0.2), snailLit: m('strata1', 'elevPeak', 0.2), snailBody: m('strata5', 'strata1', 0.56), snailBodyDark: m('strata5', 'strata3', 0.46),
  octo: m('magma', 'strata6', 0.42), octoDark: m('magma', 'strata6', 0.68), octoLit: m('magma', 'elevPeak', 0.34), sucker: m('magma', 'elevPeak', 0.6),
  star: m('magma', 'gold', 0.5), starDark: m('magma', 'strata3', 0.62), starLit: m('gold', 'elevPeak', 0.4),
  urchin: m('strata6', 'magma', 0.34), urchinLit: m('magma', 'strata6', 0.5), urchinDark: dk('strata6', 0.2),
  amphi: m('elevPeak', 'seaShallow', 0.3), amphiDark: m('seaShallow', 'strata5', 0.5), chord: m('gold', 'magma', 0.4),
  // cells: cytoplasm, wall, nucleus
  cyto: m('elevPeak', 'seaShallow', 0.3), cytoDark: m('seaShallow', 'strata5', 0.44), nucleus: m('strata6', 'seaDeep', 0.5), nucleusLit: m('seaDeep', 'elevPeak', 0.4), vacuole: m('elevPeak', 'seaShallow', 0.1), food: m('strata2', 'gold', 0.3),
  rod: m('magma', 'elevPeak', 0.36), rodDark: m('magma', 'strata3', 0.5), rodLit: m('magma', 'elevPeak', 0.66), dna: m('strata6', 'magma', 0.3),
  chl: m('elevLow', 'strata6', 0.08), chlLit: m('elevLow', 'gold', 0.3),
  yeast: m('strata1', 'elevPeak', 0.3), yeastDark: m('strata2', 'strata3', 0.2),
  lichen: m('gold', 'elevLow', 0.42), lichenDark: m('elevLow', 'strata3', 0.42), lichenLit: m('gold', 'elevPeak', 0.42),
  // vertebrates
  tiger: m('gold', 'magma', 0.46), tigerDark: m('magma', 'strata3', 0.5), tigerLit: m('gold', 'elevPeak', 0.26),
  deer: m('strata2', 'strata3', 0.26), deerDark: m('strata3', 'strata6', 0.2), antler: m('strata2', 'strata3', 0.6),
  eagle: m('strata3', 'strata6', 0.44), eagleDark: m('strata3', 'strata6', 0.76), eagleLit: m('strata2', 'strata1', 0.5), beak: m('gold', 'magma', 0.3),
  owl: m('strata3', 'strata5', 0.26), owlDark: m('strata3', 'strata6', 0.5), owlLit: m('strata1', 'elevPeak', 0.34),
  bat: m('strata6', 'strata3', 0.26), batWing: m('strata6', 'strata3', 0.5), batDark: dk('strata6', 0.2),
  sparrow: m('strata3', 'strata2', 0.4), sparrowDark: m('strata3', 'strata6', 0.5), sparrowLit: m('strata1', 'elevPeak', 0.46),
  ostrich: dk('strata6', 0.14), ostrichLit: m('elevPeak', 'strata1', 0.3), ostrichSkin: m('strata1', 'magma', 0.26), ostrichSkinDark: m('strata2', 'magma', 0.26),
};

// -- tools ------------------------------------------------------------------------
function blob(pts) {
  const k = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[k - 1], pts[0]);
  let d = `M${n1(s[0])} ${n1(s[1])}`;
  for (let i = 0; i < k; i++) { const e = mid(pts[i], pts[(i + 1) % k]); d += `Q${n1(pts[i][0])} ${n1(pts[i][1])} ${n1(e[0])} ${n1(e[1])}`; }
  return d + 'Z';
}
function curve(pts) {
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${n1(pts[i][0])} ${n1(pts[i][1])} ${n1((pts[i][0] + pts[i + 1][0]) / 2)} ${n1((pts[i][1] + pts[i + 1][1]) / 2)}`;
  const e = pts[pts.length - 1];
  return d + `L${n1(e[0])} ${n1(e[1])}`;
}
// A body of varying width w(t) along a spine given as many points.
function ribbon(spine, w) {
  const k = spine.length, a = [], b = [];
  for (let i = 0; i < k; i++) {
    const p = spine[Math.max(0, i - 1)], q = spine[Math.min(k - 1, i + 1)];
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, r = w(i / (k - 1));
    a.push([spine[i][0] + nx * r, spine[i][1] + ny * r]); b.push([spine[i][0] - nx * r, spine[i][1] - ny * r]);
  }
  return line([...a, ...b.reverse()]) + 'Z';
}
function across(spine, i, r) {
  const k = spine.length, p = spine[Math.max(0, i - 1)], q = spine[Math.min(k - 1, i + 1)];
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return [[spine[i][0] + nx * r, spine[i][1] + ny * r], [spine[i][0] - nx * r, spine[i][1] - ny * r]];
}
const leg = (x, top, foot, w0, w1, lean = 0) => {
  const k = (top + foot) / 2;
  return `M${n1(x - w0 / 2)} ${n1(top)}Q${n1(x - w1 + lean * 0.5)} ${n1(k)} ${n1(x + lean - w1 / 2)} ${n1(foot)}h${n1(w1 + 1)}Q${n1(x + w1 + lean * 0.5)} ${n1(k)} ${n1(x + w0 / 2)} ${n1(top)}Z`;
};
const eye = (x, y, r = 1.8, f = B.ink) => ({ d: circle(x, y, r), f });
const leafShape = (x, y, len, wid, deg) => {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = (u, v) => `${n1(x + c * u - s * v)} ${n1(y + s * u + c * v)}`;
  return `M${P(0, 0)}Q${P(len * 0.45, -wid)} ${P(len, 0)}Q${P(len * 0.45, wid)} ${P(0, 0)}Z`;
};

// -- fungi ------------------------------------------------------------------------
function mycelium(o) {
  const r = rnd(o.seed ?? 11), spread = o.spread ?? 1, parts = [], tips = [];
  const walk = (x, y, a, len, depth) => {
    const pts = [[x, y]];
    let px = x, py = y;
    for (let i = 0; i < 4; i++) { a += (r() - 0.5) * 0.7; px += Math.cos(a) * len / 4; py += Math.sin(a) * len / 4; pts.push([px, py]); }
    parts.push(curve(pts));
    if (depth > 0) { walk(px, py, a + 0.55, len * 0.72, depth - 1); walk(px, py, a - 0.6, len * 0.68, depth - 1); } else tips.push([px, py]);
  };
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; walk(0, 0, a, 34 * (0.6 + spread * 0.4), spread >= 0.5 ? 3 : 2); }
  // o.rim: a dark outline, so pale threads hold on a light card as well as on dark soil.
  if (o.rim) return [
    { d: parts.join('') + tips.map(([x, y]) => circle(x, y, 2.6)).join(''), s: B.threadRim, w: 5.4 },
    { d: parts.join(''), s: B.thread, w: 2.4 },
    { d: tips.map(([x, y]) => circle(x, y, 2.4)).join(''), f: B.thread },
  ];
  return [
    { d: parts.join(''), s: B.threadDark, w: 3.6, a: 0.55 },
    { d: parts.join(''), s: B.thread, w: 2 },
    { d: tips.map(([x, y]) => circle(x, y, 1.8)).join(''), f: B.thread },
  ];
}
function mushroom(o) {
  const out = [];
  if (o.threads) {
    const t = ['M-4 2Q-20 10 -46 8', 'M-20 8Q-32 16 -44 20', 'M0 2Q-4 16 -16 26', 'M2 2Q10 14 8 30', 'M4 2Q20 10 48 10', 'M22 8Q34 16 44 22', 'M-30 9Q-38 4 -50 0', 'M30 8Q40 3 52 2'].join('');
    out.push({ d: t, s: B.threadDark, w: 3 , a: 0.5 }, { d: t, s: B.thread, w: 1.6 });
  }
  out.push(
    { d: 'M-9 -4Q-11 -30 -7 -58L7 -58Q11 -30 11 -4Q2 3 -9 -4Z', f: B.stem },
    { d: 'M2 -58L7 -58Q11 -30 11 -4Q6 0 1 0Q6 -30 2 -58Z', f: B.stemShade, a: 0.7 },
    { d: 'M-40 -56Q0 -40 40 -56Q0 -66 -40 -56Z', f: B.gill },
    { d: Array.from({ length: 13 }, (_, i) => { const x = -34 + i * 5.7; return `M${n1(x * 0.34)} -49L${n1(x)} ${n1(-55 + Math.abs(x) * 0.02)}`; }).join(''), s: B.gillLine, w: 1 },
    { d: 'M-42 -56Q-40 -92 0 -94Q40 -92 42 -56Q20 -48 0 -49Q-20 -48 -42 -56Z', f: B.cap },
    { d: 'M2 -94Q40 -92 42 -56Q24 -49 8 -49Q30 -70 2 -94Z', f: B.capDark, a: 0.6 },
    { d: 'M-30 -72Q-24 -86 -8 -89Q-20 -80 -24 -68Z', f: B.capLit, a: 0.75 },
    { d: 'M-10 -44Q0 -40 10 -44L11 -41Q0 -36 -11 -41Z', f: B.gill },
  );
  return out;
}
function yeast(o) {
  const buds = o.buds ?? 1, out = [];
  const cell = (x, y, r) => [
    { d: ell(x, y, r, r * 1.06), f: B.yeast }, { d: ell(x, y, r, r * 1.06), s: B.yeastDark, w: 2.6 },
    { d: `M${n1(x - r * 0.7)} ${n1(y - r * 0.3)}Q${n1(x - r * 0.4)} ${n1(y - r * 0.8)} ${n1(x + r * 0.1)} ${n1(y - r * 0.82)}`, s: B.white, w: 2.4, a: 0.8 },
  ];
  if (buds > 1) out.push(...cell(-30, -24, 10));
  if (buds > 0) out.push(...cell(32, -24, 15));
  out.push(...cell(0, 0, 32));
  out.push({ d: circle(-8, 8, 10), f: B.nucleus }, { d: circle(-11, 5, 3), f: B.nucleusLit }, { d: circle(11, -8, 8), f: B.vacuole }, { d: circle(11, -8, 8), s: B.cytoDark, w: 1.4 });
  if (buds > 0) out.push({ d: circle(33, -24, 4), f: B.nucleus, a: 0.8 });
  return out;
}

// -- plants -----------------------------------------------------------------------
function gulmohar(o) {
  const r = rnd(o.seed ?? 21), bloom = o.bloom ?? 1, out = [];
  out.push(
    { d: 'M-13 0Q-6 -26 -7 -50L-38 -92L-30 -96L-2 -66L-3 -106L6 -106L8 -68L38 -98L44 -92L10 -48Q9 -24 16 0Z', f: B.bark },
    { d: 'M2 0Q2 -30 4 -60L10 -48Q9 -24 16 0Z', f: B.barkDark, a: 0.55 },
  );
  const lobes = [[-58, -100, 30], [-26, -116, 34], [14, -122, 36], [54, -106, 30], [-76, -84, 20], [78, -88, 20], [0, -96, 30]];
  out.push({ d: lobes.map(([x, y, q]) => ell(x, y + 6, q * 1.15, q * 0.8)).join(''), f: B.leafDark });
  out.push({ d: lobes.map(([x, y, q]) => ell(x, y, q * 1.1, q * 0.74)).join(''), f: B.frond });
  let green = '', red = '', lit = '';
  for (let i = 0; i < 60; i++) {
    const [x0, y0, q] = lobes[Math.floor(r() * lobes.length)], a = r() * 6.28, u = Math.sqrt(r()), x = x0 + Math.cos(a) * q * 1.05 * u, y = y0 + Math.sin(a) * q * 0.68 * u;
    if (r() < 0.32 + (1 - bloom) * 0.68) green += ell(x, y, 5, 3); else if (r() < 0.3) lit += circle(x, y, 3.4); else red += circle(x, y, 4.4);
  }
  out.push({ d: green, f: B.frondLit }, { d: red, f: B.bloom }, { d: lit, f: B.bloomLit });
  if (bloom > 0.4) { let fall = ''; for (let i = 0; i < 9; i++) fall += circle(-70 + r() * 140, -3 + r() * 5, 2.4); out.push({ d: fall, f: B.bloom, a: 0.8 }); }
  return out;
}
function fernFrond(x0, y0, cx, cy, tx, ty, wide, cols) {
  // An arching frond: a bare stalk, then paired leaflets, longest low on the blade and shrinking to the tip.
  const P = (t) => { const u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * tx, u * u * y0 + 2 * u * t * cy + t * t * ty]; };
  const n = 15, spine = []; for (let i = 0; i <= 18; i++) spine.push(P(i / 18));
  let left = '', right = '';
  for (let i = 0; i < n; i++) {
    const t = 0.16 + 0.82 * (i / (n - 1)), [px, py] = P(t), [qx, qy] = P(Math.min(1, t + 0.02)), [rx, ry] = P(t - 0.02);
    const base = Math.atan2(qy - ry, qx - rx) * 180 / Math.PI, v = (t - 0.16) / 0.84;
    const l = wide * Math.min(1, 0.72 + v * 2.2) * Math.pow(1 - v, 0.8) + 2.5, sweep = 74 - 22 * v;
    left += leafShape(px, py, l, Math.max(2.1, l * 0.2), base - sweep); right += leafShape(px, py, l, Math.max(2.1, l * 0.2), base + sweep);
  }
  return [{ d: left, f: cols[0] }, { d: right, f: cols[1] }, { d: curve(spine), s: cols[2], w: 2 }];
}
function fernPlant(o) {
  const out = [];
  if (o.roots) {
    const t = 'M-30 8Q-44 18 -48 32M-14 9Q-18 22 -28 34M4 9Q2 22 10 34M20 8Q28 20 26 36M36 7Q48 14 52 28';
    out.push({ d: t, s: B.barkDark, w: 2.2 });
    out.push({ d: blob([[-44, 0], [-20, -5], [20, -5], [46, 1], [24, 9], [-20, 10]]), f: B.bark });
  }
  const back = [B.leafDark, B.leafDark, B.leafDeep], mid = [B.frond, B.leafDark, B.leafDeep], front = [B.leaf, B.frond, B.leafDeep];
  out.push(...fernFrond(-3, -2, -18, -112, -66, -92, 18, back), ...fernFrond(3, -2, 18, -116, 64, -96, 18, back));
  out.push(...fernFrond(-1, -2, -2, -90, -26, -116, 16, mid), ...fernFrond(1, -2, 14, -84, 30, -112, 14, back));
  out.push(...fernFrond(-4, -2, -34, -74, -74, -44, 19, mid), ...fernFrond(4, -2, 34, -76, 74, -46, 19, mid));
  out.push(...fernFrond(-5, -2, -32, -32, -64, -8, 15, front), ...fernFrond(5, -2, 32, -34, 66, -10, 15, front));
  // One young frond, still uncurling.
  out.push({ d: 'M2 -2Q6 -30 8 -46Q10 -62 22 -62Q33 -61 32 -51Q30 -43 23 -46Q19 -49 23 -53', s: B.leafLit, w: 3.6 });
  out.push({ d: 'M-8 0Q0 -8 8 0Z', f: B.leafDeep });
  return out;
}
function mossClump(o) {
  const r = rnd(o.seed ?? 31), out = [];
  if (o.rhizoids) {
    let t = ''; for (const x of [-34, -24, -13, -2, 10, 20, 31]) t += `M${x} 0Q${n1(x + r() * 8 - 4)} 8 ${n1(x + r() * 10 - 5)} ${n1(14 + r() * 8)}`;
    out.push({ d: t, s: B.capsule, w: 1.4 });
  }
  if (o.capsule !== false) {
    const stalks = [[-14, -66, -4], [16, -74, 6], [33, -54, 8]];
    out.push({ d: stalks.map(([x, h, l]) => `M${x} -18Q${x + l * 0.3} ${n1(h * 0.6)} ${x + l} ${h}`).join(''), s: B.capsule, w: 1.8 });
    out.push({ d: stalks.map(([x, h, l]) => ell(x + l + 1, h - 5, 3.6, 7)).join(''), f: B.capsule }, { d: stalks.map(([x, h, l]) => ell(x + l, h - 6, 1.4, 3.8)).join(''), f: B.moss });
  }
  let dark = '', lit = '';
  out.push({ d: blob([[-46, 2], [-36, -14], [-14, -22], [12, -22], [36, -14], [46, 2]]), f: B.mossDark });
  for (let i = 0; i < 15; i++) {
    const x = -38 + i * 5.4, h = 15 + r() * 14;
    for (let k = 0; k < 5; k++) {
      const y = -k * h / 4.6, l = 8 - k * 0.8;
      dark += leafShape(x, y, l, 3, -146); lit += leafShape(x, y, l, 3, -34);
    }
  }
  out.push({ d: dark, f: B.mossDark }, { d: lit, f: B.moss });
  return out;
}
function spirogyra(o) {
  const n = o.cells ?? 4, L = 58, H = 30, W = n * L, x0 = -W / 2, out = [];
  out.push({ d: rrect(x0, -H / 2, W, H, 6), f: B.waterPale, a: 0.55 });
  let wave = '', back = '';
  const pts = [];
  for (let i = 0; i <= n * 28; i++) { const t = i / 28; pts.push([x0 + t * L, Math.sin(t * 7 * Math.PI) * 11.5, Math.cos(t * 7 * Math.PI)]); }
  // Spiral bands: the front half of each turn drawn over the back half.
  for (let i = 1; i < pts.length; i++) { const seg = `M${n1(pts[i - 1][0])} ${n1(pts[i - 1][1])}L${n1(pts[i][0])} ${n1(pts[i][1])}`; if (pts[i][2] > 0) wave += seg; else back += seg; }
  out.push({ d: back, s: B.leafDark, w: 4.4, a: 0.65 }, { d: wave, s: B.chl, w: 5.2 }, { d: wave, s: B.chlLit, w: 1.8 });
  for (let i = 0; i < n; i++) out.push({ d: circle(x0 + (i + 0.5) * L, 0, 4), f: B.nucleus });
  out.push({ d: rrect(x0, -H / 2, W, H, 6), s: B.leafDeep, w: 2.4 });
  let wall = ''; for (let i = 1; i < n; i++) wall += `M${x0 + i * L} ${-H / 2}V${H / 2}`;
  out.push({ d: wall, s: B.leafDeep, w: 2.4 });
  return out;
}
function needles(x, y, l, deg, f) {
  let d = '';
  for (const s of [-1, 1]) { const a = (deg + s * 12) * Math.PI / 180; d += `M${n1(x)} ${n1(y)}L${n1(x + Math.cos(a) * l)} ${n1(y + Math.sin(a) * l)}`; }
  return { d, s: f, w: 1.7 };
}
function coneShape(x, y, s, out) {
  const rows = [[-13, 12], [-5, 15], [3, 15], [11, 12], [18, 8]];
  out.push({ d: ell(x, y + 2 * s, 12.5 * s, 22 * s), f: B.coneDark });
  rows.forEach(([v, hw], i) => {
    for (let k = -1; k <= 1; k += 1) {
      if (k && i % 2 === 0 && hw < 9) continue;
      const cx = x + k * hw * 0.62 * s + (i % 2 ? 0 : 1.5 * s * k), cy = y + v * s;
      out.push({ d: `M${n1(cx - 5.4 * s)} ${n1(cy - 3 * s)}Q${n1(cx)} ${n1(cy - 7 * s)} ${n1(cx + 5.4 * s)} ${n1(cy - 3 * s)}Q${n1(cx + 3 * s)} ${n1(cy + 5 * s)} ${n1(cx)} ${n1(cy + 5.6 * s)}Q${n1(cx - 3 * s)} ${n1(cy + 5 * s)} ${n1(cx - 5.4 * s)} ${n1(cy - 3 * s)}Z`, f: k === 1 ? B.cone : B.coneLit });
      out.push({ d: `M${n1(cx - 3 * s)} ${n1(cy + 1 * s)}Q${n1(cx)} ${n1(cy + 4.6 * s)} ${n1(cx + 3 * s)} ${n1(cy + 1 * s)}`, s: B.coneDark, w: 1.1 });
    }
  });
  out.push({ d: line([[x, y - 20 * s], [x, y - 28 * s]]), s: B.barkDark, w: 3 });
}
function cone() { const out = []; coneShape(0, 0, 1.2, out); return out; }
function pineTree(o) {
  const out = [{ d: leg(0, -160, 0, 8, 15), f: B.bark }, { d: 'M2 0Q3 -80 2 -160L5 -160Q8 -70 8 0Z', f: B.barkDark, a: 0.55 }];
  const tiers = [[-22, 56], [-52, 50], [-82, 42], [-110, 32], [-136, 22]];
  tiers.forEach(([y, hw], i) => {
    const top = y - 46;
    out.push({ d: `M0 ${top}Q${n1(hw * 0.3)} ${y - 18} ${hw} ${y}Q0 ${y + 9} ${-hw} ${y}Q${n1(-hw * 0.3)} ${y - 18} 0 ${top}Z`, f: i % 2 ? B.pine : B.pineLit });
    out.push({ d: `M0 ${top}Q${n1(hw * 0.3)} ${y - 18} ${hw} ${y}Q${n1(hw * 0.4)} ${y + 6} 0 ${y + 4}Z`, f: B.pineDark, a: 0.5 });
    let t = ''; for (let k = -3; k <= 3; k++) { const x = k * hw / 3.6; t += `M${n1(x)} ${n1(y - 2 + Math.abs(k) * -1)}l${n1(k * 0.7)} 7`; }
    out.push({ d: t, s: B.pineDark, w: 1.5 });
  });
  if (o.cones !== false) for (const [x, y] of [[-30, -22], [34, -48], [-20, -80], [16, -108]]) coneShape(x, y, 0.42, out);
  return out;
}
function pineNeedles() {
  const out = [{ d: 'M-46 16Q0 0 46 -14', s: B.bark, w: 4 }];
  for (let i = 0; i < 11; i++) {
    const t = i / 10, x = -40 + 82 * t, y = 14 - 26 * t;
    out.push(needles(x, y, 34, -68 - t * 16, B.pineLit), needles(x, y, 30, 54 - t * 12, B.pine));
  }
  return out;
}
function leaf(o) {
  if (o.parallel) {
    let v = ''; for (const k of [-0.62, -0.32, 0, 0.32, 0.62]) v += `M${n1(k * 7)} -2Q${n1(k * 30)} -60 0 -122`;
    return [
      { d: 'M0 0Q-26 -60 0 -124Q26 -60 0 0Z', f: B.leaf }, { d: 'M0 0Q26 -60 0 -124Q6 -60 0 0Z', f: B.leafDark, a: 0.42 },
      { d: v, s: B.leafLit, w: 1.3 },
    ];
  }
  let v = '';
  for (let i = 1; i <= 6; i++) {
    const y = -20 - i * 13.4, x = 28 * Math.sin(Math.PI * (i + 1.4) / 9.4);
    v += `M0 ${y}Q${n1(x * 0.5)} ${n1(y - 5)} ${n1(x)} ${n1(y - 15)}M0 ${y}Q${n1(-x * 0.5)} ${n1(y - 5)} ${n1(-x)} ${n1(y - 15)}`;
  }
  return [
    { d: 'M0 2L0 -22', s: B.leafDeep, w: 3 },
    { d: 'M0 -20Q-44 -56 -2 -118Q0 -124 2 -118Q44 -56 0 -20Z', f: B.leaf },
    { d: 'M0 -20Q44 -56 2 -118Q0 -124 0 -120Z', f: B.leafDark, a: 0.42 },
    { d: 'M-22 -70Q-20 -94 -6 -108Q-14 -86 -14 -66Z', f: B.leafLit, a: 0.6 },
    { d: 'M0 -20L0 -116', s: B.leafDeep, w: 2.2 }, { d: v, s: B.leafDeep, w: 1.2 },
  ];
}
function mangroveTree(o) {
  const r = rnd(o.seed ?? 41), out = [];
  if (o.water) out.push({ d: rrect(-112, -2, 224, 34, 4), f: B.waterPale, a: 0.75 });
  let roots = '';
  for (const [x, top] of [[-96, -30], [-74, -40], [-52, -44], [-30, -46], [-10, -40], [14, -42], [34, -46], [56, -44], [78, -40], [98, -30]]) {
    roots += `M${n1(x * 0.16)} ${top - 18}Q${n1(x * 0.8)} ${top - 26} ${x} 18`;
  }
  out.push({ d: roots, s: B.barkDark, w: 5 }, { d: roots, s: B.bark, w: 2.4 });
  let pneu = ''; for (const x of [-104, -84, -62, -42, 42, 64, 88, 106]) pneu += `M${x} 22L${x} ${n1(-8 - r() * 6)}`;
  out.push({ d: pneu, s: B.bark, w: 2.6 });
  out.push({ d: leg(0, -110, -40, 13, 22), f: B.bark });
  if (o.water) out.push({ d: rrect(-112, 8, 224, 24, 4), f: B.water, a: 0.42 });
  const lobes = [[-66, -106, 30], [-30, -130, 36], [18, -136, 38], [62, -110, 30], [0, -104, 34]];
  out.push({ d: lobes.map(([x, y, q]) => ell(x, y + 7, q * 1.2, q * 0.76)).join(''), f: B.leafDeep });
  out.push({ d: lobes.map(([x, y, q]) => ell(x, y, q * 1.14, q * 0.72)).join(''), f: B.leaf });
  out.push({ d: lobes.slice(0, 4).map(([x, y, q]) => ell(x - 8, y - 8, q * 0.6, q * 0.34)).join(''), f: B.leafLit });
  return out;
}
function lichenBark(o) {
  const r = rnd(o.seed ?? 51), out = [{ d: rrect(-64, -46, 128, 92, 8), f: B.bark }];
  let g = ''; for (let i = 0; i < 12; i++) { const x = -58 + i * 10.4 + r() * 3; g += `M${n1(x)} -46Q${n1(x + r() * 8 - 4)} 0 ${n1(x + r() * 6 - 3)} 46`; }
  out.push({ d: g, s: B.barkDark, w: 2.4 });
  const lobes = (cx, cy, q, n) => { let d = ''; for (let i = 0; i < n; i++) { const a = i / n * 6.28, u = 0.62 + r() * 0.4; d += ell(cx + Math.cos(a) * q * u, cy + Math.sin(a) * q * u * 0.82, q * 0.4, q * 0.3); } return d + circle(cx, cy, q * 0.62); };
  const a = lobes(-16, -6, 26, 9), b = lobes(26, 16, 17, 7), c = lobes(30, -24, 11, 6);
  out.push({ d: a + b + c, f: B.lichenDark });
  out.push({ d: lobes(-16, -8, 22, 9) + lobes(26, 14, 14, 7) + lobes(30, -25, 9, 6), f: B.lichen });
  out.push({ d: circle(-20, -12, 7) + circle(-4, 4, 4) + circle(24, 12, 4), f: B.lichenLit });
  return out;
}

// -- animals without a backbone ---------------------------------------------------
function sponge(o) {
  const out = [];
  const tube = (x, top, wid, lean, dark) => [
    { d: `M${x - wid * 0.62} 0Q${x - wid * 0.8} ${n1(top * 0.5)} ${x - wid / 2 + lean} ${top}Q${x + lean} ${top - 7} ${x + wid / 2 + lean} ${top}Q${x + wid * 0.8} ${n1(top * 0.5)} ${x + wid * 0.62} 0Z`, f: dark ? B.spongeDark : B.sponge },
    { d: `M${x + wid * 0.1} 0Q${x + wid * 0.24} ${n1(top * 0.5)} ${x + wid * 0.2 + lean} ${top}L${x + wid / 2 + lean} ${top}Q${x + wid * 0.8} ${n1(top * 0.5)} ${x + wid * 0.62} 0Z`, f: B.spongeDark, a: 0.45 },
    { d: ell(x + lean, top, wid / 2, 6.5), f: B.spongeLit }, { d: ell(x + lean, top + 0.6, wid * 0.34, 4), f: B.spongeHole },
  ];
  out.push(...tube(-30, -74, 32, -7, true), ...tube(30, -86, 34, 6, true), ...tube(0, -108, 42, 0, false));
  const r = rnd(o.seed ?? 61);
  let p = ''; for (let i = 0; i < 46; i++) { const y = -8 - r() * 92, hw = 16 + 10 * (y > -74 ? 1.4 : 0), x = -hw + r() * 2 * hw + (y > -74 ? (r() - 0.5) * 34 : 0); p += ell(x, y, 2.2, 1.6); }
  out.push({ d: p, f: B.spongeHole, a: 0.8 });
  return out;
}
function hydra(o) {
  const out = [];
  const arms = [[-4, -92, -34, -118, -30, -136], [-3, -94, -16, -128, -6, -146], [3, -94, 14, -128, 8, -148], [4, -92, 34, -116, 34, -138], [-5, -88, -38, -96, -46, -112], [5, -88, 38, -96, 46, -114]];
  out.push({ d: arms.map((a) => `M${a[0]} ${a[1]}Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`).join(''), s: B.hydraDark, w: 5 }, { d: arms.map((a) => `M${a[0]} ${a[1]}Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`).join(''), s: B.hydra, w: 3.2 });
  let dots = ''; for (const a of arms) for (const t of [0.4, 0.62, 0.82]) { const u = 1 - t; dots += circle(u * u * a[0] + 2 * u * t * a[2] + t * t * a[4], u * u * a[1] + 2 * u * t * a[3] + t * t * a[5], 1.4); }
  out.push({ d: dots, f: B.hydraLit });
  if (o.bud !== false) {
    out.push({ d: 'M9 -40Q26 -46 32 -60', s: B.hydraDark, w: 8.6 }, { d: 'M9 -40Q26 -46 32 -60', s: B.hydra, w: 6.6 }, { d: 'M32 -60Q28 -70 24 -74M32 -60Q38 -68 44 -70M32 -60Q33 -70 34 -76', s: B.hydra, w: 2 });
  }
  out.push({ d: 'M-16 0Q-8 -4 -7 -10L-11 -60Q-13 -82 -7 -92Q0 -97 7 -92Q13 -82 11 -60L7 -10Q8 -4 16 0Q0 4 -16 0Z', f: B.hydra });
  out.push({ d: 'M2 -94Q13 -82 11 -60L7 -10Q8 -4 16 0Q8 2 2 1Q4 -50 2 -94Z', f: B.hydraDark, a: 0.42 });
  out.push({ d: 'M-6 -82Q-9 -60 -5 -30', s: B.hydraLit, w: 2.2 });
  out.push({ d: ell(0, -93, 4.6, 2), f: B.hydraDark });
  return out;
}
function flatworm(o) {
  const spine = [], k = 40;
  for (let i = 0; i <= k; i++) { const t = i / k; spine.push([-62 + 124 * t, Math.sin(t * 5.2) * 5]); }
  const w = (t) => (t < 0.1 ? 8 + t * 75 : 15.5) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.97 + 0.03)), 0.32);
  const out = [{ d: ribbon(spine, (t) => w(t) + 1.6), f: B.flatDark }, { d: ribbon(spine, w), f: B.flat }, { d: ribbon(spine.slice(4, 37), (t) => 4 * Math.sin(Math.PI * t)), f: B.flatLit, a: 0.7 }];
  if (o.gut) {
    let g = curve(spine.slice(6, 36).filter((_, i) => i % 3 === 0));
    for (let i = 8; i < 35; i += 4) { const [p, q] = across(spine, i, 11); g += `M${n1(spine[i][0])} ${n1(spine[i][1])}L${n1(p[0])} ${n1(p[1])}M${n1(spine[i][0])} ${n1(spine[i][1])}L${n1(q[0])} ${n1(q[1])}`; }
    out.push({ d: g, s: B.flatDark, w: 2.2, a: 0.8 });
  }
  return out;
}
function roundworm() {
  const spine = [], k = 50;
  for (let i = 0; i <= k; i++) { const t = i / k; spine.push([-66 + 132 * t, Math.sin(t * 8.4 + 0.4) * 15]); }
  const w = (t) => 7.6 * Math.pow(Math.sin(Math.PI * t), 0.5) + 0.6;
  return [
    { d: ribbon(spine, (t) => w(t) + 1.4), f: B.roundDark }, { d: ribbon(spine, w), f: B.round },
    { d: ribbon(spine.slice(3, 48).map((p) => [p[0], p[1] - 2.2]), (t) => 1.8 * Math.sin(Math.PI * t) + 0.2), f: B.roundLit },
  ];
}
function earthworm(o) {
  // Moves to the right. Each thin bulge marks a contraction; it runs from head to tail while the body creeps forward.
  const t = o.t ?? 0, spine = [], k = 72, wave = (u) => Math.pow(Math.max(0, Math.sin(u * 18 + t)), 4);
  for (let i = 0; i <= k; i++) { const u = i / k; spine.push([-80 + 160 * u, Math.sin(u * 4.4 + 0.6) * 7]); }
  const w = (u) => (7.6 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.96 + 0.02)), 0.44)) * (1 + 0.22 * wave(u));
  const out = [{ d: ribbon(spine, (u) => w(u) + 1.3), f: B.wormDark }, { d: ribbon(spine, w), f: B.worm }];
  out.push({ d: ribbon(spine.slice(46, 56), (u) => w((46 + 10 * u) / 72)), f: B.wormBand });
  let rings = '';
  for (let i = 2; i < k - 1; i += 2) { const r = w(i / k); const [p, q] = across(spine, i, r); rings += `M${n1(p[0])} ${n1(p[1])}Q${n1(spine[i][0] + 1.4)} ${n1(spine[i][1])} ${n1(q[0])} ${n1(q[1])}`; }
  out.push({ d: rings, s: B.wormDark, w: 1, a: 0.8 });
  out.push({ d: curve(spine.slice(3, 70).filter((_, i) => i % 4 === 0).map((p) => [p[0], p[1] - 3.4])), s: B.wormLit, w: 1.8, a: 0.75 });
  return out;
}
function beetle() {
  const legs = [
    'M-13 -22L-28 -30L-40 -46', 'M13 -22L28 -30L40 -46',
    'M-17 -6L-34 -6L-46 -14', 'M17 -6L34 -6L46 -14',
    'M-16 12L-32 26L-42 46', 'M16 12L32 26L42 46',
  ].join('');
  return [
    { d: legs, s: B.ink, w: 3.4 }, { d: 'M-5 -44Q-14 -60 -24 -60M5 -44Q14 -60 24 -60', s: B.ink, w: 2 },
    { d: ell(0, -38, 10, 9), f: B.shellDark },
    { d: 'M-17 -30Q0 -38 17 -30Q19 -20 15 -14L-15 -14Q-19 -20 -17 -30Z', f: B.shellA },
    { d: 'M-17 -13Q0 -19 17 -13Q24 12 0 44Q-24 12 -17 -13Z', f: B.shellB },
    { d: 'M0 -16L0 44', s: B.shellDark, w: 2.2 },
    { d: 'M-12 -8Q-16 10 -6 26', s: B.shellLit, w: 2.8, a: 0.8 }, { d: 'M12 -8Q14 6 10 16', s: B.shellLit, w: 1.8, a: 0.45 },
  ];
}
function crab() {
  const walk = [];
  for (const sx of [-1, 1]) for (const [y0, a, b, c, d] of [[-2, 58, -14, 74, 2], [6, 60, 8, 76, 26], [12, 56, 22, 68, 42], [17, 46, 32, 54, 52]]) walk.push(`M${sx * 30} ${y0}L${sx * a} ${b}L${sx * c} ${d}`);
  const claw = (sx) => [
    { d: `M${sx * 30} -14L${sx * 50} -24L${sx * 54} -38`, s: B.crabDark, w: 7 }, { d: `M${sx * 30} -14L${sx * 50} -24L${sx * 54} -38`, s: B.crab, w: 4.6 },
    { d: `M${sx * 48} -40Q${sx * 42} -60 ${sx * 56} -70Q${sx * 56} -58 ${sx * 60} -56Q${sx * 66} -62 ${sx * 72} -60Q${sx * 74} -42 ${sx * 60} -36Q${sx * 52} -34 ${sx * 48} -40Z`, f: B.crab },
    { d: `M${sx * 52} -40Q${sx * 62} -40 ${sx * 68} -52`, s: B.crabDark, w: 1.6 },
  ];
  return [
    { d: walk.join(''), s: B.crabDark, w: 5.4 }, { d: walk.join(''), s: B.crab, w: 3.2 },
    ...claw(-1), ...claw(1),
    { d: 'M-42 -8Q-40 -30 0 -32Q40 -30 42 -8Q40 16 0 26Q-40 16 -42 -8Z', f: B.crab },
    { d: 'M10 -31Q40 -30 42 -8Q40 16 0 26Q30 4 10 -31Z', f: B.crabDark, a: 0.42 },
    { d: 'M-28 -18Q-14 -26 2 -26Q-14 -20 -22 -10Z', f: B.crabLit, a: 0.7 },
    { d: 'M-14 4Q0 12 14 4', s: B.crabDark, w: 1.6, a: 0.7 },
  ];
}
function snail() {
  const pts = [];
  for (let i = 0; i <= 90; i++) { const a = i / 90 * 5.2 * Math.PI, r = 37 * Math.exp(-0.18 * (i / 90) * 5.2 * Math.PI); pts.push([-6 + Math.cos(a + 1.4) * r, -36 + Math.sin(a + 1.4) * r * 0.96]); }
  return [
    { d: 'M-56 0Q-30 -8 10 -6Q38 -8 48 -30Q50 -36 56 -34Q64 -32 62 -22Q58 -2 34 0Z', f: B.snailBody },
    { d: 'M-56 0Q-20 -4 34 0Q50 -2 58 -12Q52 4 30 2L-40 2Z', f: B.snailBodyDark, a: 0.7 },
    { d: 'M54 -32Q56 -44 50 -52M60 -30Q66 -40 66 -50M62 -22Q70 -22 74 -18', s: B.snailBody, w: 2.8 },
    { d: circle(-6, -36, 37), f: B.snail }, { d: 'M-6 -73A37 37 0 0 1 -6 1Q20 -36 -6 -73Z', f: B.snailDark, a: 0.42 },
    { d: curve(pts), s: B.snailDark, w: 3.8 }, { d: curve(pts.slice(0, 34).map(([x, y]) => [x - 2, y - 2])), s: B.snailLit, w: 2, a: 0.7 },
  ];
}
function octopus() {
  const arms = [], suck = [];
  const spec = [[-14, -56, 28, -90, 52], [-12, -36, 12, -72, 40], [-8, -14, 46, -44, 66], [-3, -6, 44, -14, 76], [3, 6, 44, 14, 76], [8, 14, 46, 44, 66], [12, 36, 12, 72, 40], [14, 56, 28, 90, 52]];
  for (const [x, cx, cy, ex, ey] of spec) {
    const sp = []; for (let i = 0; i <= 16; i++) { const t = i / 16, u = 1 - t; sp.push([u * u * x + 2 * u * t * cx + t * t * ex, u * u * 0 + 2 * u * t * cy + t * t * ey]); }
    arms.push(ribbon(sp, (t) => 8.4 * (1 - t) + 1.2));
    for (let i = 3; i < 15; i += 2) { const t = i / 16; suck.push(circle(sp[i][0], sp[i][1] + 1, 2.3 * (1 - t) + 0.7)); }
  }
  return [
    { d: arms.join(''), f: B.octo }, { d: suck.join(''), f: B.sucker, a: 0.9 },
    { d: 'M-32 8Q-44 -46 0 -60Q44 -46 32 8Q0 22 -32 8Z', f: B.octo },
    { d: 'M6 -59Q44 -46 32 8Q18 14 6 15Q34 -22 6 -59Z', f: B.octoDark, a: 0.5 },
    { d: 'M-24 -22Q-22 -42 -6 -50Q-16 -36 -16 -18Z', f: B.octoLit, a: 0.7 },
  ];
}
function starfish() {
  const pts = [], arms = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 19 : 52; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const body = (k) => blob(pts.flatMap((p, i) => (i % 2 ? [[p[0] * k, p[1] * k]] : [[p[0] * 1.06 * k, p[1] * 1.06 * k], [p[0] * 1.06 * k, p[1] * 1.06 * k]])));
  let dots = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
    arms.push(`M0 0L${n1(Math.cos(a) * 42)} ${n1(Math.sin(a) * 42)}`);
    for (const q of [14, 24, 33, 41]) for (const s of (q > 36 ? [0] : [-1, 1])) dots += circle(Math.cos(a) * q - Math.sin(a) * s * (18 - q * 0.34), Math.sin(a) * q + Math.cos(a) * s * (18 - q * 0.34), 1.8);
  }
  return [
    { d: body(1.05), f: B.starDark }, { d: body(1), f: B.star },
    { d: arms.join(''), s: B.starDark, w: 3, a: 0.5 }, { d: dots, f: B.starLit }, { d: circle(0, 0, 5.4), f: B.starLit },
  ];
}
function urchin(o) {
  const r = rnd(o.seed ?? 71), back = [], front = [];
  for (let i = 0; i < 44; i++) { const a = i / 44 * 6.283 + r() * 0.1, q = 50 + r() * 14; back.push(`M${n1(Math.cos(a) * 28)} ${n1(Math.sin(a) * 28)}L${n1(Math.cos(a) * q)} ${n1(Math.sin(a) * q)}`); }
  for (let i = 0; i < 26; i++) { const a = r() * 6.283, u = 6 + r() * 20, q = u + 12 + r() * 14; front.push(`M${n1(Math.cos(a) * u)} ${n1(Math.sin(a) * u)}L${n1(Math.cos(a) * q)} ${n1(Math.sin(a) * q)}`); }
  return [
    { d: back.join(''), s: B.urchin, w: 2.6 }, { d: circle(0, 0, 32), f: B.urchinDark }, { d: circle(-5, -6, 24), f: B.urchin },
    { d: front.join(''), s: B.urchinLit, w: 2.1 },
  ];
}
function amphioxus(o) {
  const c = o.notochord ?? 1, top = (x) => -13 * Math.pow(Math.sin(Math.PI * (x + 70) / 140), 0.74), out = [];
  const up = [], lo = [];
  for (let x = -70; x <= 70; x += 7) { up.push([x, top(x) - (x < -20 ? 0 : 1)]); lo.push([x, -top(x) * 0.92]); }
  out.push({ d: line([...up, ...lo.reverse()]) + 'Z', f: B.amphi });
  let chev = ''; for (let x = -48; x <= 58; x += 8.5) { const h = -top(x); chev += `M${n1(x + 2)} ${n1(-h * 0.88)}L${n1(x - 3.4)} 0L${n1(x + 2)} ${n1(h * 0.82)}`; }
  out.push({ d: chev, s: B.amphiDark, w: 1.3, a: 0.75 });
  out.push({ d: `M-60 -2L66 -2`, s: B.chord, w: 3.6, a: c });
  out.push({ d: 'M-70 0Q-40 -2 -24 -13Q0 -19 40 -14L70 0', s: B.amphiDark, w: 1.2, a: 0.5 });
  out.push({ d: 'M-70 2Q-76 8 -68 8M-68 -3Q-76 -7 -70 -8', s: B.amphiDark, w: 1.5 });
  return out;
}

// -- microbes ---------------------------------------------------------------------
function bacterium(o) {
  const form = o.form ?? 'rod', out = [];
  const tangle = (x, y, q) => ({ d: `M${x - q} ${y}q${n1(q * 0.4)} ${n1(-q * 0.8)} ${n1(q * 0.8)} 0t${n1(q * 0.8)} 0t${n1(q * 0.5)} ${n1(-q * 0.4)}t${n1(-q * 0.9)} ${n1(q * 0.7)}t${n1(-q * 0.8)} ${n1(-q * 0.1)}`, s: B.dna, w: 1.8 });
  if (form === 'coccus') {
    for (const [x, y] of [[-20, 8], [12, -14], [18, 22]]) {
      out.push({ d: circle(x, y, 17), f: B.rod }, { d: circle(x, y, 17), s: B.rodDark, w: 2.8 }, tangle(x, y, 6), { d: `M${x - 10} ${y - 7}Q${x - 5} ${y - 13} ${x + 2} ${y - 13}`, s: B.rodLit, w: 2.4 });
    }
    return out;
  }
  if (form === 'spiral') {
    const sp = []; for (let i = 0; i <= 50; i++) { const t = i / 50; sp.push([-58 + 116 * t, Math.sin(t * 15) * 12]); }
    const w = (t) => 5.4 * Math.pow(Math.sin(Math.PI * t), 0.3) + 0.6;
    return [{ d: ribbon(sp, (t) => w(t) + 1.5), f: B.rodDark }, { d: ribbon(sp, w), f: B.rod }, { d: curve(sp.filter((_, i) => i % 3 === 0).map(([x, y]) => [x, y - 1.6])), s: B.rodLit, w: 1.5 }];
  }
  out.push(
    { d: 'M42 0Q52 -10 62 0T82 0T100 -4', s: B.rodDark, w: 2.2 }, { d: 'M-42 6Q-54 16 -66 8T-86 10', s: B.rodDark, w: 2.2 },
    { d: rrect(-46, -21, 92, 42, 21), f: B.rod }, { d: rrect(-46, -21, 92, 42, 21), s: B.rodDark, w: 3.2 },
    { d: rrect(-40, -15, 80, 30, 15), s: B.rodLit, w: 1.4, a: 0.6 },
    tangle(-2, 1, 12),
    { d: 'M-30 -12Q-20 -16 -6 -15', s: B.rodLit, w: 2.6 },
  );
  return out;
}
function cyanobacterium() {
  const out = [{ d: 'M-90 2Q-60 -12 -30 0T30 0T90 -4', s: B.leafDeep, w: 22, a: 0.22 }], pts = [];
  for (let i = 0; i < 12; i++) { const t = i / 11, x = -84 + 168 * t; pts.push([x, Math.sin(t * 6.2 + 0.4) * 7]); }
  for (const [x, y] of pts) out.push({ d: circle(x, y, 8.6), f: B.chl }, { d: circle(x, y, 8.6), s: B.leafDeep, w: 1.6 }, { d: circle(x - 2, y - 2.4, 2.8), f: B.chlLit });
  return out;
}
function amoeba(o) {
  const r = rnd(o.seed ?? 81), body = [];
  const lobes = [[0, -62], [34, -30], [66, -24], [40, 6], [58, 40], [14, 34], [-16, 58], [-34, 20], [-70, 14], [-40, -14], [-48, -44], [-18, -24]];
  for (const [x, y] of lobes) body.push([x + r() * 5 - 2.5, y + r() * 5 - 2.5]);
  let grain = ''; for (let i = 0; i < 26; i++) { const a = r() * 6.28, q = 8 + r() * 30; grain += circle(Math.cos(a) * q, Math.sin(a) * q, 1.1); }
  return [
    { d: blob(body), f: B.cyto }, { d: blob(body), s: B.cytoDark, w: 3 },
    { d: grain, f: B.cytoDark, a: 0.7 },
    { d: circle(-6, 8, 15), f: B.nucleus }, { d: circle(-10, 4, 4.6), f: B.nucleusLit },
    { d: circle(22, -12, 11), f: B.vacuole }, { d: circle(22, -12, 11), s: B.cytoDark, w: 1.6 }, { d: circle(22, -12, 5.4), f: B.food },
    { d: circle(-24, -22, 6.4), f: B.vacuole }, { d: circle(-24, -22, 6.4), s: B.cytoDark, w: 1.2 },
  ];
}
function paramecium() {
  const out = [], outline = 'M-74 2Q-70 -24 -30 -29Q30 -34 72 -8Q80 0 72 9Q40 28 -6 27Q-20 12 -40 22Q-68 28 -74 2Z';
  let cil = '';
  const up = (x) => -29 + ((x + 30) * (x + 30)) * 0.0007, lo = (x) => 27 - ((x - 10) * (x - 10)) * 0.0012;
  for (let x = -62; x <= 66; x += 7) { cil += `M${x} ${n1(up(x))}l${n1(-4)} -8M${x} ${n1(Math.max(lo(x), 16))}l${n1(-4)} 8`; }
  out.push({ d: cil, s: B.cytoDark, w: 1.5 }, { d: outline, f: B.cyto }, { d: outline, s: B.cytoDark, w: 2.8 });
  out.push({ d: 'M-6 27Q6 8 -8 2Q-24 2 -40 22', f: B.vacuole, s: B.cytoDark, w: 1.6 });
  out.push({ d: ell(14, -4, 17, 10), f: B.nucleus }, { d: circle(8, -7, 3.2), f: B.nucleusLit }, { d: circle(38, 10, 4.6), f: B.nucleus });
  out.push({ d: circle(-44, -10, 8), f: B.vacuole }, { d: circle(-44, -10, 8), s: B.cytoDark, w: 1.4 }, { d: circle(52, -6, 7), f: B.vacuole }, { d: circle(52, -6, 7), s: B.cytoDark, w: 1.4 }, { d: circle(-20, -14, 3.8), f: B.food });
  return out;
}
function euglena() {
  const outline = 'M-70 2Q-46 -8 -20 -21Q20 -30 56 -10Q68 -3 70 -1Q68 3 56 10Q20 28 -20 19Q-46 12 -70 2Z';
  let chl = '', lit = '';
  for (const [x, y, deg] of [[-30, -8, 20], [-10, -13, -10], [14, -14, 8], [34, -8, 26], [-28, 7, -24], [-6, 12, 10], [22, 12, -14], [44, 4, -26]]) { chl += leafShape(x - 9, y, 20, 5.4, deg); lit += leafShape(x - 5, y, 10, 1.8, deg); }
  return [
    { d: 'M68 -1Q86 -18 104 -6T140 -20', s: B.leafDeep, w: 2.4 },
    { d: outline, f: m('elevPeak', 'elevLow', 0.34) }, { d: chl, f: B.chl }, { d: lit, f: B.chlLit },
    { d: outline, s: B.leafDeep, w: 2.6 },
    { d: circle(4, 0, 10.4), f: B.nucleus }, { d: circle(1, -3, 3), f: B.nucleusLit },
  ];
}

// -- animals with a backbone (a plain dot eye) ------------------------------------
function tiger() {
  const f = B.tiger, d = B.tigerDark;
  const stripes = [
    'M-40 -58L-36 -44', 'M-30 -62L-27 -44', 'M-18 -64L-16 -46', 'M-7 -64L-5 -46', 'M4 -64L3 -46', 'M15 -64L12 -46', 'M25 -62L22 -46',
    'M-44 -44L-38 -36', 'M-30 -40L-24 -30', 'M-14 -40L-10 -30', 'M2 -40L5 -30', 'M18 -40L20 -30',
  ].join('');
  return [
    { d: leg(-34, -36, 0, 12, 7, -3) + leg(26, -36, 0, 12, 7, 3), f: d },
    { d: 'M-52 -50Q-78 -56 -84 -32Q-86 -22 -78 -22', s: f, w: 5 },
    { d: 'M-76 -50L-74 -44M-84 -40L-78 -38M-83 -29L-78 -30M-82 -23L-77 -23', s: B.ink, w: 3 },
    { d: blob([[-54, -46], [-46, -64], [-6, -68], [28, -68], [40, -48], [30, -30], [-16, -27], [-48, -30]]), f },
    { d: blob([[-40, -30], [30, -30], [26, -38], [-34, -36]]), f: B.white, a: 0.9 },
    { d: leg(-26, -38, 0, 14, 8, 2) + leg(16, -38, 0, 14, 8, -2), f },
    { d: stripes, s: B.ink, w: 3.6 },
    { d: 'M-27 -22L-19 -22M-27 -13L-20 -13M12 -24L20 -24M13 -14L20 -14', s: B.ink, w: 2.8 },
    { d: circle(32, -78, 6.4) + circle(50, -80, 6.4), f },
    { d: circle(32, -78, 3) + circle(50, -80, 3), f: B.ink },
    { d: blob([[26, -74], [40, -82], [56, -78], [66, -62], [62, -50], [44, -46], [30, -54]]), f },
    { d: blob([[46, -60], [64, -62], [66, -52], [52, -46], [44, -50]]), f: B.white },
    { d: 'M30 -70L37 -66M33 -60L40 -59M46 -80L46 -73M40 -79L41 -74', s: B.ink, w: 2.6 },
    eye(52, -68, 2), { d: blob([[60, -62], [66, -62], [63, -57]]), f: B.ink },
  ];
}
function deer() {
  const f = B.deer, d = B.deerDark, r = rnd(5);
  let spots = ''; for (let i = 0; i < 22; i++) spots += circle(-38 + r() * 60, -62 + r() * 19, 1.7);
  const antler = 'M46 -90Q42 -108 54 -124M44 -102Q34 -106 30 -118M49 -112Q58 -112 62 -122M50 -90Q56 -104 68 -114M57 -101Q66 -100 72 -106';
  // A leg grows out of the haunch or shoulder, narrows at the knee or hock, and ends in a thin shank and a hoof.
  const hind = (x) => blob([[x - 12, -62], [x + 8, -64], [x + 12, -46], [x + 5, -33], [x + 1, -22], [x + 2, -3], [x - 3, -3], [x - 7, -22], [x - 10, -32], [x - 13, -46]]);
  const fore = (x) => blob([[x - 7, -62], [x + 10, -62], [x + 9, -44], [x + 4, -34], [x + 3, -20], [x + 3, -3], [x - 2, -3], [x - 3, -20], [x - 5, -34], [x - 8, -46]]);
  return [
    { d: hind(-20) + fore(30), f: d },
    { d: blob([[-44, -56], [-34, -68], [20, -68], [32, -82], [42, -92], [50, -90], [46, -72], [34, -48], [-16, -42], [-40, -46]]), f },
    { d: blob([[-20, -43], [10, -44], [9, -49], [-19, -49]]), f: B.white },
    { d: hind(-32) + fore(18), f },
    { d: spots, f: B.white, a: 0.92 },
    { d: 'M-42 -60Q-52 -58 -50 -50', s: f, w: 5 }, { d: 'M-50 -56L-50 -50', s: B.white, w: 3 },
    { d: blob([[42, -92], [54, -94], [70, -80], [66, -74], [52, -76], [42, -82]]), f },
    { d: blob([[40, -90], [28, -98], [34, -88]]), f: d },
    { d: antler, s: B.antler, w: 2.6 },
    eye(54, -86, 1.9), { d: circle(68, -78, 2.2), f: B.ink },
    { d: rrect(-36, -3, 8, 3, 1) + rrect(-24, -3, 8, 3, 1) + rrect(16, -3, 8, 3, 1) + rrect(28, -3, 8, 3, 1), f: B.ink },
  ];
}
function eagle() {
  return [
    { d: 'M-4 -2L-6 -12M8 -2L6 -12', s: B.beak, w: 4 }, { d: 'M-12 0L4 0M0 0L16 0', s: B.beak, w: 3 },
    { d: blob([[-48, 26], [-28, -12], [-16, -46], [6, -64], [24, -60], [28, -34], [14, -6], [-18, 8]]), f: B.eagle },
    { d: blob([[-58, 34], [-40, 8], [-22, -16], [-14, -2], [-34, 22]]), f: B.eagleDark },
    { d: blob([[-30, 4], [-22, -30], [-4, -48], [2, -24], [-12, -2]]), f: B.eagleDark },
    { d: 'M-22 -6Q-16 -24 -4 -38M-16 2Q-8 -14 0 -26', s: B.eagle, w: 2 },
    { d: blob([[2, -58], [10, -74], [30, -78], [40, -66], [32, -54], [14, -46]]), f: B.white },
    { d: 'M36 -72Q50 -72 50 -56Q42 -62 34 -62Z', f: B.beak },
    { d: 'M34 -62Q42 -62 46 -58', s: B.ink, w: 1.4 }, eye(28, -68, 2),
  ];
}
function owl() {
  const eyeRing = (x) => [{ d: circle(x, -62, 15), f: B.owlLit }, { d: circle(x, -62, 15), s: B.owlDark, w: 2 }, { d: circle(x, -62, 7), f: B.beak }, { d: circle(x, -62, 4.6), f: B.ink }, { d: circle(x - 1.4, -63.4, 1.3), f: B.white }];
  let marks = ''; for (const [x, y] of [[-14, -32], [0, -30], [14, -32], [-20, -20], [-7, -18], [7, -18], [20, -20], [-13, -7], [0, -6], [13, -7]]) marks += `M${x - 4} ${y}q4 5 8 0`;
  return [
    { d: 'M-12 -3L-14 3M-6 -3L-6 4M6 -3L6 4M12 -3L14 3', s: B.beak, w: 3 },
    { d: blob([[-36, -44], [-36, -82], [-30, -96], [-14, -84], [14, -84], [30, -96], [36, -82], [36, -44], [28, -8], [0, 0], [-28, -8]]), f: B.owl },
    { d: blob([[-20, -44], [20, -44], [24, -12], [0, -3], [-24, -12]]), f: B.owlLit },
    { d: marks, s: B.owlDark, w: 2 },
    { d: blob([[-38, -50], [-44, -20], [-26, -6], [-28, -38]]) + blob([[38, -50], [44, -20], [26, -6], [28, -38]]), f: B.owlDark },
    ...eyeRing(-15), ...eyeRing(15),
    { d: 'M-5 -58L5 -58L0 -46Z', f: B.beak },
  ];
}
function bat() {
  const wing = (s) => `M${s * 8} -6L${s * 22} -22L${s * 58} -30L${s * 84} -12L${s * 96} 6Q${s * 80} -2 ${s * 72} 16Q${s * 60} 4 ${s * 48} 22Q${s * 36} 8 ${s * 24} 22Q${s * 16} 12 ${s * 8} 16Z`;
  return [
    { d: wing(-1) + wing(1), f: B.batWing },
    { d: `M-22 -22L-48 20M-30 -25L-72 14M-58 -30L-92 4M22 -22L48 20M30 -25L72 14M58 -30L92 4`, s: B.batDark, w: 2 },
    { d: blob([[-12, -12], [-8, -24], [8, -24], [12, -12], [10, 16], [0, 28], [-10, 16]]), f: B.bat },
    { d: 'M-12 -30L-14 -48L-3 -36L3 -36L14 -48L12 -30Q10 -18 0 -18Q-10 -18 -12 -30Z', f: B.bat },
    eye(-5, -30, 1.8, B.white), eye(5, -30, 1.8, B.white),
  ];
}
function sparrow() {
  return [
    { d: 'M-2 0L-4 -8M6 0L4 -8', s: B.ink, w: 2 },
    { d: blob([[-40, -2], [-26, -12], [-14, -20], [8, -30], [24, -32], [26, -18], [12, -6], [-12, -4]]), f: B.sparrowLit },
    { d: blob([[-44, -4], [-28, -18], [-8, -28], [6, -14], [-14, -8]]), f: B.sparrow },
    { d: 'M-34 -9L-10 -16M-26 -14L-2 -22', s: B.sparrowDark, w: 2 },
    { d: blob([[6, -30], [18, -40], [32, -36], [32, -24], [20, -20]]), f: B.sparrow },
    { d: 'M32 -32L40 -28L32 -26Z', f: B.ink }, eye(26, -32, 1.6),
  ];
}
function ostrich() {
  return [
    { d: leg(-8, -74, 0, 11, 4, -5) + leg(14, -74, 0, 11, 4, 3), f: B.ostrichSkin },
    { d: 'M-16 0L-2 0M14 0L28 0', s: B.ostrichSkinDark, w: 4 },
    { d: blob([[-58, -92], [-44, -116], [-6, -122], [26, -110], [36, -88], [14, -70], [-30, -68], [-52, -76]]), f: B.ostrich },
    { d: blob([[-70, -96], [-58, -112], [-44, -96], [-30, -76], [-52, -72], [-68, -80]]), f: B.ostrichLit },
    { d: blob([[-34, -112], [-6, -112], [6, -92], [-14, -78], [-34, -86]]), f: B.ostrich },
    { d: 'M-22 -100Q-30 -92 -36 -82M-12 -96Q-18 -88 -22 -78M-2 -92Q-6 -86 -10 -80', s: B.ostrichLit, w: 3.6 },
    { d: 'M26 -102Q36 -140 36 -190', s: B.ostrichSkin, w: 8.6 },
    { d: blob([[28, -192], [38, -200], [50, -196], [50, -188], [38, -186]]), f: B.ostrichSkin },
    { d: 'M48 -196L62 -191L48 -187Z', f: B.ostrichSkinDark }, eye(42, -194, 2.1),
  ];
}

// -- table ------------------------------------------------------------------------
const THINGS = {
  Mushroom: mushroom, Mycelium: mycelium, Yeast: yeast,
  Gulmohar: gulmohar, FernPlant: fernPlant, MossClump: mossClump, Spirogyra: spirogyra, PineTree: pineTree, Cone: cone, PineNeedles: pineNeedles, Leaf: leaf,
  MangroveTree: mangroveTree, LichenBark: lichenBark,
  Sponge: sponge, Hydra: hydra, Flatworm: flatworm, Roundworm: roundworm, Earthworm: earthworm, Beetle: beetle, Crab: crab, Snail: snail, Octopus: octopus,
  Starfish: starfish, Urchin: urchin, Amphioxus: amphioxus,
  Bacterium: bacterium, Cyanobacterium: cyanobacterium, Amoeba: amoeba, Paramecium: paramecium, Euglena: euglena,
  Tiger: tiger, Deer: deer, Eagle: eagle, Owl: owl, Bat: bat, Sparrow: sparrow, Ostrich: ostrich,
};
export const BIO_NAMES = Object.keys(THINGS);
export const bioPrims = (name, o = {}) => THINGS[name](o);
export const drawBio = (ctx, c, name, x, y, s = 1, o = {}) => drawPrims(ctx, c, THINGS[name](o), x, y, s, o);
export const svgBio = (name, x, y, s = 1, o = {}) => svgPrims(THINGS[name](o), x, y, s, o);

// Bounds at s = 1: [x, y, w, h].
export const BOX = {
  Mushroom: [-43, -95, 86, 96], Mycelium: [-84, -83, 166, 171], Yeast: [-33, -41, 81, 76],
  Gulmohar: [-100, -150, 202, 154], FernPlant: [-74, -116, 150, 118], MossClump: [-47, -87, 94, 90], Spirogyra: [-117, -16, 234, 32], PineTree: [-57, -183, 114, 184],
  Cone: [-20, -35, 41, 64], PineNeedles: [-47, -47, 116, 89], Leaf: [-29, -123, 58, 126], MangroveTree: [-106, -164, 212, 187], LichenBark: [-65, -47, 130, 94],
  Sponge: [-55, -115, 111, 117], Hydra: [-47, -149, 94, 152], Flatworm: [-64, -20, 127, 42], Roundworm: [-68, -26, 137, 49], Earthworm: [-81, -15, 163, 31],
  Beetle: [-47, -61, 94, 108], Crab: [-77, -71, 154, 124], Snail: [-57, -74, 132, 77], Octopus: [-92, -61, 183, 138], Starfish: [-56, -59, 112, 107], Urchin: [-58, -63, 120, 123], Amphioxus: [-74, -17, 145, 30],
  Bacterium: [-87, -22, 188, 44], Cyanobacterium: [-94, -16, 187, 33], Amoeba: [-64, -53, 124, 105], Paramecium: [-75, -38, 152, 74], Euglena: [-71, -25, 212, 48],
  Tiger: [-85, -87, 152, 88], Deer: [-51, -125, 124, 126], Eagle: [-54, -77, 105, 108], Owl: [-43, -94, 86, 99], Bat: [-97, -49, 194, 75], Sparrow: [-40, -40, 81, 41], Ostrich: [-70, -200, 133, 201],
};
// The LifeArt things a scene in this module is likely to want as an icon. Bounds as above.
const LIFE_BOX = {
  Hornbill: [-42, -40, 89, 51], Frog: [-21, -24, 38, 25], Camel: [-51, -116, 130, 117], PolarBear: [-51, -65, 120, 66], Lion: [-67, -87, 130, 88], Lizard: [-45, -13, 76, 19],
  Snake: [-37, -14, 81, 15], Monkey: [-20, -48, 36, 85], Dolphin: [-62, -30, 124, 56], Fish: [-36, -20, 66, 40], Butterfly: [-12, -12, 24, 24],
};
export function bioIcon(name, size = 64, o = {}) {
  const box = BOX[name] ?? LIFE_BOX[name] ?? [-60, -60, 120, 120], [x, y, w, h] = box, pad = Math.max(w, h) * 0.03;
  const body = THINGS[name] ? svgBio(name, 0, 0, 1, o) : name === 'Fish' ? svgFish(0, 0, 1, o) : (LIFE_NAMES.includes(name) ? svgLife(name, 0, 0, 1, o) : '');
  const hSize = typeof size === 'number' ? ` width="${size}" height="${size}"` : '';
  return `<svg class="bio-ic" viewBox="${n1(x - pad)} ${n1(y - pad)} ${n1(w + 2 * pad)} ${n1(h + 2 * pad)}"${hSize} aria-hidden="true" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}
// A thing fitted into a box: fitBio('Crab', x, y, w, h, o) centres it in that box, as large as fits. o.max caps the scale.
export function fitBio(name, x, y, w, h, o = {}) {
  const b = BOX[name] ?? LIFE_BOX[name] ?? [-60, -60, 120, 120], s = Math.min(w / b[2], h / b[3], o.max ?? 9);
  const ox = x + w / 2 - (b[0] + b[2] / 2) * s * (o.flip ? -1 : 1), oy = y + h / 2 - (b[1] + b[3] / 2) * s;
  return THINGS[name] ? svgBio(name, ox, oy, s, o) : name === 'Fish' ? svgFish(ox, oy, s, o) : svgLife(name, ox, oy, s, o);
}
