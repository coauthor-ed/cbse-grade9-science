// EarthArt.js - local drawings for L10: the purple frog, rock layers, fossils, a virus and a host cell, DNA strips and
// small tools. Not a scene. SVG strings, tokens only. Every function returns closed markup.
//   purpleFrog(x, y, s, o)   about 250 long, 130 tall, origin at the feet, nose right. o.flip. Squat, small head, short snout
//   rockBands(W, y0, h, n)   n rock layers from y0 down, with wavy joins. Returns { svg, band(i) -> [top, bottom] }
//   fossilLeaf, fossilFrond, fossilShell, fossilFish, fossilFrog, fossilMat, fossilSkull, dinoBone: pressed into rock, origin at the middle
//   virus(x, y, s, o)        about 90 wide, no face. o.open: shows the genetic material inside
//   hostCell(x, y, r)        a round cell with a nucleus
//   dnaStrip(x, y, w, h, pattern, o)  a strip of coloured bars. pattern: a string of the digits 0 to 3
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { svgBioColour as bc } from '../shared/BioArt.js';

export const mx = (a, b, t) => `color-mix(in oklab, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
export const n1 = (v) => Math.round(v * 10) / 10;
export const INK = lc('ink');
const wrap = (x, y, s, o, body) => `<g transform="translate(${n1(x)} ${n1(y)}) scale(${o?.flip ? -s : s} ${s})${o?.rot ? ` rotate(${o.rot})` : ''}"${o?.alpha != null ? ` opacity="${o.alpha}"` : ''}>${body}</g>`;
const P = (d, f, r, w = 3, more = '') => `<path d="${d}" ${fill(f, r ? `stroke:${r};stroke-width:${w};stroke-linejoin:round;${more}` : more)}/>`;
const L = (d, c, w = 3, more = '') => `<path d="${d}" ${stroke(c, w, `stroke-linecap:round;stroke-linejoin:round;${more}`)}/>`;

export const FROG_BODY = mx(mx(lc('red'), lc('waterDeep'), 0.5), INK, 0.34);
const FROG_DARK = mx(FROG_BODY, INK, 0.5), FROG_LIT = mx(FROG_BODY, lc('white'), 0.3), FROG_PALE = mx(FROG_BODY, lc('water'), 0.46);

/** The purple frog: a swollen rounded body, a very small head, a short pale pointed snout, short thick legs with digging feet. */
export function purpleFrog(x, y, s = 1, o = {}) {
  let g = '';
  // far legs
  g += P('M58 -22Q70 -6 62 0H42Q44 -14 40 -24Z', FROG_DARK, FROG_DARK, 2);
  g += P('M-88 -14Q-104 -4 -92 0H-62Q-66 -10 -60 -18Z', FROG_DARK, FROG_DARK, 2);
  // the body, wide and low like a deflated ball
  g += P('M-118 -46C-124 -96 -66 -132 0 -132C50 -132 88 -112 104 -82C116 -74 134 -66 150 -50C156 -44 152 -38 144 -37C124 -32 106 -24 84 -16C40 -2 -30 0 -74 -6C-100 -10 -116 -24 -118 -46Z', FROG_BODY, FROG_DARK, 4);
  g += P('M-96 -30C-60 -12 40 -8 92 -28C70 -6 -40 -2 -78 -10C-88 -14 -94 -22 -96 -30Z', FROG_PALE);
  // shine on the back
  g += L('M-92 -70C-74 -104 -30 -120 14 -120', FROG_LIT, 8, 'opacity:0.75');
  // pale snout tip
  g += P('M126 -66C136 -60 146 -54 150 -50C156 -44 152 -38 144 -37C136 -36 128 -34 120 -31C124 -42 124 -54 126 -66Z', FROG_PALE, FROG_DARK, 2);
  // small eye with a pale ring, set far forward
  g += `<circle cx="102" cy="-78" r="9" ${fill(FROG_PALE, `stroke:${FROG_DARK};stroke-width:2`)}/><circle cx="103" cy="-78" r="5.4" ${fill(INK)}/><circle cx="101" cy="-80" r="1.8" ${fill(lc('white'))}/>`;
  g += L('M146 -41Q116 -36 88 -26', FROG_DARK, 3);
  // short near legs, spade-like feet
  g += P('M-92 -44C-112 -40 -118 -18 -104 -8C-96 -2 -76 -2 -58 -4C-48 -6 -48 -14 -58 -14C-70 -16 -64 -36 -92 -44Z', FROG_BODY, FROG_DARK, 3.5);
  g += P('M50 -40C66 -34 74 -18 70 -6C72 -2 62 2 46 1C32 1 30 -6 38 -8C44 -12 40 -34 50 -40Z', FROG_BODY, FROG_DARK, 3.5);
  return wrap(x, y, s, o, g);
}

const BANDS = ['strata2', 'strata1', 'strata3', 'strata5', 'strata6'];
/** Rock layers from y0 down to y0 + h. */
export function rockBands(W, y0, h, n = 4, o = {}) {
  const tops = Array.from({ length: n + 1 }, (_, i) => y0 + h * i / n);
  const wave = (y, k) => `M-4 ${n1(y)}C${n1(W * 0.2)} ${n1(y + (k % 2 ? 9 : -8))} ${n1(W * 0.4)} ${n1(y + (k % 2 ? -7 : 9))} ${n1(W * 0.6)} ${n1(y + (k % 2 ? 3 : -4))}S${n1(W * 0.9)} ${n1(y + (k % 2 ? 8 : -7))} ${W + 4} ${n1(y)}`;
  let g = '';
  for (let i = 0; i < n; i++) {
    const base = lc(o.roles?.[i] ?? BANDS[(i + (o.shift ?? 0)) % BANDS.length]) , col = mx(base, lc('white'), o.pale ?? 0.2 - i * 0.02);
    const dim = o.dim?.(i);
    g += `<path d="${wave(tops[i], i)}L${W + 4} ${n1(y0 + h + 40)}L-4 ${n1(y0 + h + 40)}Z" ${fill(dim ? mx(col, lc('white'), 0.5) : col)}/>`;
    g += `<path d="${wave(tops[i], i)}" ${stroke(mx(base, INK, 0.5), 3)}/>`;
    for (let k = 0; k < 7; k++) { const px = W * (0.06 + k * 0.145 + (i * 0.037) % 0.05), py = tops[i] + (h / n) * (0.25 + ((k * 3 + i) % 4) * 0.2); g += `<path d="M${n1(px)} ${n1(py)}h${16 + (k % 3) * 8}" ${stroke(mx(base, INK, 0.28), 2.4, 'stroke-linecap:round;opacity:0.5')}/>`; }
  }
  return { svg: g, band: (i) => [tops[i], tops[i + 1]] };
}

const BONE = mx(lc('white'), lc('sand'), 0.3), BONE_D = mx(lc('sand'), INK, 0.46);
const IMP = mx(lc('soilDark'), INK, 0.2);      // the dark stain of an impression

export const fossilLeaf = (x, y, s = 1, o = {}) => {
  let g = P('M0 -92C42 -62 50 -6 0 72C-50 -6 -42 -62 0 -92Z', IMP, mx(IMP, INK, 0.4), 3);
  g += L('M0 -84V92', mx(lc('sand'), lc('white'), 0.3), 3.5);
  for (let i = 0; i < 6; i++) { const y0 = -58 + i * 20, w = 30 - Math.abs(i - 2) * 5; g += L(`M0 ${y0 + 12}L${-w} ${y0 - 8}M0 ${y0 + 12}L${w} ${y0 - 8}`, mx(lc('sand'), lc('white'), 0.3), 2.4); }
  return wrap(x, y, s, o, g);
};
export const fossilFrond = (x, y, s = 1, o = {}) => {
  let g = L('M0 96Q-4 0 8 -100', IMP, 5);
  for (let i = 0; i < 11; i++) {
    const t = i / 10, yy = 74 - t * 160, xx = -2 + t * 9, w = 56 - t * 40;
    for (const k of [-1, 1]) g += `<path d="M${n1(xx)} ${n1(yy)}Q${n1(xx + k * w * 0.6)} ${n1(yy - 16)} ${n1(xx + k * w)} ${n1(yy - 10)}Q${n1(xx + k * w * 0.6)} ${n1(yy + 2)} ${n1(xx)} ${n1(yy)}Z" ${fill(IMP)}/>`;
  }
  return wrap(x, y, s, o, g);
};
export const fossilShell = (x, y, s = 1, o = {}) => {
  let g = `<circle r="56" ${fill(mx(lc('sand'), lc('white'), 0.2), `stroke:${BONE_D};stroke-width:4`)}/>`;
  let d = 'M0 0'; for (let a = 0; a < 16; a += 0.25) { const r = 3.4 * a; d += `L${n1(Math.cos(a) * r)} ${n1(Math.sin(a) * r)}`; }
  g += L(d, BONE_D, 5);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; g += L(`M${n1(Math.cos(a) * 42)} ${n1(Math.sin(a) * 42)}L${n1(Math.cos(a) * 54)} ${n1(Math.sin(a) * 54)}`, BONE_D, 2.6); }
  return wrap(x, y, s, o, g);
};
export const fossilFish = (x, y, s = 1, o = {}) => {
  let g = L('M-92 0Q0 -8 74 0', BONE, 7);
  for (let i = 0; i < 11; i++) { const xx = -74 + i * 13, h = 30 - Math.abs(i - 4) * 3; g += L(`M${xx} -2Q${xx - 8} ${-h * 0.6} ${xx - 12} ${-h}M${xx} 0Q${xx - 8} ${h * 0.6} ${xx - 12} ${h}`, BONE, 4); }
  g += P('M70 -26C98 -26 118 -8 118 2C116 14 96 24 70 22C60 10 60 -14 70 -26Z', BONE, BONE_D, 3);
  g += `<circle cx="92" cy="-4" r="7" ${fill(IMP)}/>`;
  g += P('M-90 0L-124 -28L-114 0L-124 28Z', BONE, BONE_D, 3);
  return wrap(x, y, s, o, g);
};
export const fossilFrog = (x, y, s = 1, o = {}) => {
  // Seen from above, as a pressed frog lies in rock: a wide flat skull, a short spine, a long rod behind it, and folded back legs.
  let g = P('M-48 -62C-44 -92 -18 -108 0 -110C18 -108 44 -92 48 -62C30 -54 -30 -54 -48 -62Z', BONE, BONE_D, 3);
  g += `<ellipse cx="-22" cy="-78" rx="13" ry="10" ${fill(IMP)}/><ellipse cx="22" cy="-78" rx="13" ry="10" ${fill(IMP)}/>`;
  for (let i = 0; i < 7; i++) { const yy = -48 + i * 11; g += L(`M${-20 + i} ${yy}H${20 - i}`, BONE, 6); }
  g += L('M0 -48V50', BONE, 6);
  g += L('M-16 26L-30 -2M16 26L30 -2', BONE, 6);
  g += L('M-18 -38L-62 -30L-74 2L-92 -2M18 -38L62 -30L74 2L92 -2', BONE, 6);
  g += L('M-74 2l-10 12M-74 2l4 14M74 2l10 12M74 2l-4 14', BONE, 3.4);
  g += L('M-10 50L-84 22L-96 84L-138 74M10 50L84 22L96 84L138 74', BONE, 7.5);
  g += L('M-138 74l-22 -8M-138 74l-22 8M-138 74l-14 18M138 74l22 -8M138 74l22 8M138 74l14 18', BONE, 3.6);
  return wrap(x, y, s, o, g);
};
/** Layered mats of the oldest fossils, domes of fine lines. */
export const fossilMat = (x, y, s = 1, o = {}) => {
  let g = '';
  for (const [cx, w] of [[-64, 46], [0, 56], [62, 42]]) for (let i = 0; i < 6; i++) g += L(`M${cx - w + i * 6} 40Q${cx} ${-46 + i * 13} ${cx + w - i * 6} 40`, i % 2 ? BONE : BONE_D, 3.4);
  return wrap(x, y, s, o, g);
};
export const fossilSkull = (x, y, s = 1, o = {}) => {
  let g = P('M-70 -6C-74 -42 -34 -58 0 -54C34 -50 58 -34 84 -14C92 -6 88 10 74 10H30L24 26H-4L-10 14C-44 18 -66 14 -70 -6Z', BONE, BONE_D, 3.5);
  g += `<circle cx="-4" cy="-18" r="16" ${fill(IMP)}/>`;
  g += P('M-6 34H64C78 34 84 44 76 52C50 60 8 62 -14 54C-24 48 -18 36 -6 34Z', BONE, BONE_D, 3);
  for (let i = 0; i < 6; i++) g += L(`M${30 + i * 9} 10v13M${28 + i * 9} 34v-11`, BONE_D, 3);
  return wrap(x, y, s, o, g);
};
export const fossilHuman = (x, y, s = 1, o = {}) => {
  // An early human skull in side view: a low rounded dome, a heavy brow, a short face and a separate jaw.
  let g = P('M-74 2C-84 -44 -40 -74 6 -70C36 -68 56 -50 62 -30C74 -28 80 -22 76 -16C66 -14 62 -10 62 -2C64 12 62 24 52 30H22L18 18C-14 26 -66 34 -74 2Z', BONE, BONE_D, 3.5);
  g += `<ellipse cx="44" cy="-14" rx="13" ry="10" ${fill(IMP)}/><path d="M64 4L52 8L60 16Z" ${fill(IMP)}/>`;
  g += P('M-10 34C8 30 30 36 54 34C64 34 66 44 60 52C40 60 8 58 -8 50C-16 44 -16 38 -10 34Z', BONE, BONE_D, 3);
  for (let i = 0; i < 4; i++) g += L(`M${28 + i * 8} 30v6`, BONE_D, 3);
  return wrap(x, y, s, o, g);
};
export const dinoBone = (x, y, s = 1, o = {}) => {
  const g = P('M-104 -8C-128 -34 -152 -16 -138 8C-154 26 -126 46 -106 24C-40 14 40 16 104 26C124 48 154 28 140 6C154 -16 126 -36 106 -10C40 -18 -40 -18 -104 -8Z', BONE, BONE_D, 4)
    + L('M-90 2C-30 -6 30 -6 90 4', mx(BONE, BONE_D, 0.5), 4, 'opacity:0.6');
  return wrap(x, y, s, o, g);
};

const COAT = mx(lc('red'), lc('gold'), 0.4), COAT_D = mx(COAT, INK, 0.5), COAT_L = mx(COAT, lc('white'), 0.4), GENE = mx(lc('waterDeep'), lc('white'), 0.1);
/** A virus: a many-sided coat with short spikes. No face. */
export function virus(x, y, s = 1, o = {}) {
  let g = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = Math.cos(a), q = Math.sin(a); g += L(`M${n1(c * 38)} ${n1(q * 38)}L${n1(c * 56)} ${n1(q * 56)}`, COAT_D, 4) + `<circle cx="${n1(c * 58)}" cy="${n1(q * 58)}" r="5.5" ${fill(COAT, `stroke:${COAT_D};stroke-width:2.4`)}/>`; }
  const hex = [0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${n1(Math.cos(a) * 46)} ${n1(Math.sin(a) * 46)}`; });
  g += `<path d="M${hex.join('L')}Z" ${fill(o.open ? mx(COAT, lc('white'), 0.7) : COAT, `stroke:${COAT_D};stroke-width:4;stroke-linejoin:round`)}/>`;
  if (o.open) g += L('M-24 -6C-14 -26 -2 12 8 -8S22 -18 26 2S2 26 -12 14', GENE, 6);
  else { g += L(`M0 0L${hex[0].replace(' ', ' ')}M0 0L${hex[2]}M0 0L${hex[4]}`, COAT_D, 2.4, 'opacity:0.6') + P(`M0 0L${hex[3]}L${hex[4]}Z`, COAT_L, null, 0, 'opacity:0.5'); }
  return wrap(x, y, s, o, g);
}
/** The genetic material of a virus by itself, a short wavy thread. */
export const virusThread = (x, y, s = 1) => wrap(x, y, s, {}, L('M-24 -6C-14 -26 -2 12 8 -8S22 -18 26 2', GENE, 6));

export function hostCell(x, y, r, o = {}) {
  const c = o.tone ?? mx(lc('sand'), lc('white'), 0.5);
  let g = `<circle cx="${x}" cy="${y}" r="${r}" ${fill(c, `stroke:${mx(lc('sand'), INK, 0.5)};stroke-width:6`)}/>`;
  g += `<path d="M${x - r * 0.72} ${y - r * 0.3}A${r * 0.8} ${r * 0.8} 0 0 1 ${x - r * 0.1} ${y - r * 0.76}" ${stroke(lc('white'), 7, 'stroke-linecap:round;opacity:0.8')}/>`;
  g += `<circle cx="${x + r * 0.1}" cy="${y + r * 0.08}" r="${r * 0.3}" ${fill(mx(lc('waterDeep'), lc('white'), 0.42), `stroke:${mx(lc('waterDeep'), INK, 0.4)};stroke-width:4`)}/>`;
  for (const [u, v] of [[-0.5, 0.2], [-0.2, 0.56], [0.5, 0.42], [0.56, -0.26], [-0.34, -0.3], [0.16, -0.54]]) g += `<ellipse cx="${n1(x + r * u)}" cy="${n1(y + r * v)}" rx="${n1(r * 0.08)}" ry="${n1(r * 0.05)}" ${fill(mx(lc('sand'), INK, 0.3))}/>`;
  return g;
}

const DNA = ['var(--sim-series-1)', 'var(--sim-series-2)', 'var(--sim-series-3)', 'var(--sim-series-4)'];
/** A strip of bars, one per letter of pattern. flag: indexes of bars to ring. */
/** A rod-shaped microbe with a wall, a loop of DNA and a tail, about 170 long. Both microbes in a comparison use this one outline. */
export function rod(x, y, s = 1, o = {}) {
  const c = o.tone ?? mx(lc('red'), lc('white'), 0.56), d = mx(c, INK, 0.6);
  let g = L('M-84 4C-110 -8 -116 18 -140 6S-164 -8 -176 2', d, 4);
  g += `<rect x="-90" y="-46" width="180" height="92" rx="46" ${fill(mx(c, INK, 0.2), `stroke:${d};stroke-width:4`)}/>`;
  g += `<rect x="-80" y="-36" width="160" height="72" rx="36" ${fill(mx(c, lc('white'), 0.4))}/>`;
  g += L('M-50 -6C-30 -28 -10 18 10 -6S44 -18 52 4S10 22 -14 14S-46 14 -50 -6Z', o.dna ?? mx(lc('waterDeep'), lc('white'), 0.1), 4);
  g += L('M-64 -22Q-30 -32 10 -30', lc('white'), 5, 'opacity:0.8');
  return wrap(x, y, s, o, g);
}
export function dnaStrip(x, y, w, h, pattern, o = {}) {
  const n = pattern.length, bw = w / n; let g = `<rect x="${n1(x - 4)}" y="${n1(y - 4)}" width="${n1(w + 8)}" height="${h + 8}" rx="8" ${fill(lc('white'), `stroke:${INK};stroke-width:2.5`)}/>`;
  for (let i = 0; i < n; i++) g += `<rect x="${n1(x + i * bw + 1)}" y="${y}" width="${n1(bw - 2)}" height="${h}" rx="2" ${fill(DNA[+pattern[i]])}/>`;
  for (const i of o.flag ?? []) g += `<g class="bs-pop" style="--d:${n1(0.1 + (o.flag.indexOf(i)) * 0.14)}s"><rect x="${n1(x + i * bw - 1)}" y="${y - 8}" width="${n1(bw + 2)}" height="${h + 16}" rx="4" ${fill('none', `stroke:${INK};stroke-width:3`)}/></g>`;
  return g;
}
/** A DNA ladder, drawn as a twist, for a small mark. */
export function helix(x, y, h, o = {}) {
  let a = '', b = '', r = '';
  const w = o.w ?? 20;
  for (let i = 0; i <= 24; i++) { const t = i / 24, yy = y + t * h, q = Math.sin(t * Math.PI * 3) * w; a += `${i ? 'L' : 'M'}${n1(x + q)} ${n1(yy)}`; b += `${i ? 'L' : 'M'}${n1(x - q)} ${n1(yy)}`; if (i % 2) r += `M${n1(x + q)} ${n1(yy)}L${n1(x - q)} ${n1(yy)}`; }
  return L(r, DNA[2], 3) + L(a, DNA[0], 5) + L(b, DNA[3], 5);
}
/** A plain drawn microscope, origin at the foot, about 100 tall. */
export function microscope(x, y, s = 1) {
  const c = mx(lc('waterDeep'), INK, 0.4), d = mx(c, INK, 0.5), l = mx(c, lc('white'), 0.3);
  let g = P('M-44 0H44Q52 0 50 -8Q48 -14 40 -14H-40Q-48 -14 -50 -8Q-52 0 -44 0Z', c, d, 3);
  g += L('M16 -14C40 -34 40 -66 12 -84', c, 11) + L('M-30 -40H26', d, 7);
  g += `<g transform="rotate(16 0 -80)">` + P('M-11 -112H11V-60H-11Z', l, d, 3) + P('M-7 -60H7V-46H-7Z', c, d, 3) + P('M-14 -122H14V-112H-14Z', c, d, 3) + '</g>';
  return wrap(x, y, s, {}, g);
}
