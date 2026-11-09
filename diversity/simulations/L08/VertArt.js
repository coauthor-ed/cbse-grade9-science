// VertArt.js - large drawn vertebrates for L08 and L09, for scenes where the animal is the hero. Not a scene. SVG
// strings, tokens only, nose right, origin at the middle of the animal unless a function says otherwise. Sizes are at
// s = 1. flip mirrors the drawing. Every function takes (x, y, s, o) and returns one closed <g>.
//   dolphinBig 330 long (o.lungs, o.glands: cutaways)      calf: the same at s about 0.42
//   fishBig    320 long (o.gills: gill cover lifted)
//   frogBig    230 long, origin at the feet (o.tail: a young frog, o.wet: shine on the skin)
//   tadpole    120 long (o.tufts: feathery gills, o.legs 0, 1, 2)
//   spawn      a clump of eggs in jelly, 130 wide
//   lizardBig  340 long
//   sparrowBig 230 long, origin at the feet
//   eggAt      an egg, 60 tall (kind 'hard' or 'leathery')
//   tigerBig, lionBig  365 long, 190 tall, origin at the feet (o.glands: a cut circle under the belly)
//   bearBig    340 long, 170 tall, origin at the feet     camelBig 330 long, 300 tall, origin at the feet (o.cut: hump cut open)
//   ostrichBig 230 long, 345 tall, origin at the feet
//   fitBig(name, x, y, w, h, o)  any of these five, as large as fits in a box, on the floor of it
//   feather    a contour feather, 150 long, lying along x
//   scales     a rimmed patch of dry scales w by h, origin top left
// One small-scale helper: spine(pts, s) lays round-cornered vertebrae along a list of points, with the cord through them.
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { svgBioColour as bc } from '../shared/BioArt.js';

export const mx = (a, b, t) => `color-mix(in oklab, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
const n1 = (v) => Math.round(v * 10) / 10;
const INK = lc('ink');
const wrap = (x, y, s, o, body) => `<g transform="translate(${n1(x)} ${n1(y)}) scale(${o?.flip ? -s : s} ${s})${o?.rot ? ` rotate(${o.rot})` : ''}"${o?.alpha != null ? ` opacity="${o.alpha}"` : ''}>${body}</g>`;

/** A smooth closed curve through the middles of a point list. */
export function blob(pts) {
  const k = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s = mid(pts[k - 1], pts[0]);
  let d = `M${n1(s[0])} ${n1(s[1])}`;
  for (let i = 0; i < k; i++) { const p = pts[i], q = mid(p, pts[(i + 1) % k]); d += `Q${n1(p[0])} ${n1(p[1])} ${n1(q[0])} ${n1(q[1])}`; }
  return d + 'Z';
}
const P = (d, f, rim, w = 3) => `<path d="${d}" ${fill(f, rim ? `stroke:${rim};stroke-width:${w};stroke-linejoin:round` : '')}/>`;
const L = (d, c, w, extra = '') => `<path d="${d}" ${stroke(c, w, `stroke-linecap:round;stroke-linejoin:round;${extra}`)}/>`;

// -- dolphin ----------------------------------------------------------------------------------------------------------
const DOLB = mx(lc('inkSoft'), lc('sea'), 0.42);
const DOL = { body: DOLB, dark: mx(DOLB, lc('ink'), 0.46), lit: mx(DOLB, lc('white'), 0.5), belly: mx(lc('white'), DOLB, 0.16) };
export function dolphinBig(x, y, s = 1, o = {}) {
  const { body, dark, lit, belly } = DOL;
  const hull = blob([[-146, -4], [-104, -32], [-44, -62], [30, -72], [92, -60], [120, -36], [130, -22], [158, -16], [160, -8], [124, -2], [88, 12], [30, 34], [-44, 28], [-104, 12], [-146, 2]]);
  let g = '';
  g += P('M-140 -4L-182 -38Q-178 -8 -166 -1Q-180 10 -186 34L-140 2Z', dark, dark);
  g += P('M-8 -62Q-32 -104 -50 -110Q-20 -104 36 -64Z', dark, dark);
  g += P(hull, body, dark, 3.5);
  g += P(blob([[-100, 10], [-44, 26], [30, 32], [86, 11], [122, -1], [156, -9], [120, -7], [62, 3], [0, 11], [-60, 8]]), belly);
  g += L('M-96 -28Q-14 -58 70 -50', lit, 8, 'opacity:0.8');
  g += P('M52 14Q36 52 8 66Q24 34 16 22Z', dark, dark);
  g += L('M158 -11Q128 -5 112 -14', dark, 2.5);
  g += `<ellipse cx="66" cy="-66" rx="7" ry="3" ${fill(INK)}/>`;
  g += `<circle cx="102" cy="-22" r="5.4" ${fill(INK)}/><circle cx="104" cy="-24" r="1.7" ${fill(lc('white'))}/>`;
  if (o.lungs) {
    const pale = mx(lc('white'), lc('red'), 0.14), lung = mx(lc('red'), lc('white'), 0.46), lr = mx(lc('red'), lc('ink'), 0.3);
    g += P(blob([[-14, -40], [22, -52], [62, -44], [70, -10], [34, 8], [-4, 2], [-20, -18]]), pale, dark, 2.5);
    g += L('M66 -63Q60 -46 44 -34', lr, 7) + L('M44 -34Q30 -28 22 -22M44 -34Q42 -22 34 -12', lr, 5);
    g += P(blob([[-8, -30], [20, -42], [44, -30], [38, -8], [8, -2], [-10, -12]]), lung, lr, 3);
  }
  if (o.glands) {
    const pale = mx(lc('white'), lc('red'), 0.1), gl = mx(lc('red'), lc('white'), 0.56);
    g += P(blob([[-104, 2], [-74, -6], [-46, 2], [-44, 20], [-78, 24], [-102, 14]]), pale, dark, 2.5);
    for (const [cx, cy, r] of [[-88, 8, 8], [-72, 4, 9], [-58, 10, 8], [-76, 15, 7]]) g += `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(gl, `stroke:${mx(lc('red'), lc('ink'), 0.2)};stroke-width:2`)}/>`;
  }
  return wrap(x, y, s, o, g);
}

// -- fish -------------------------------------------------------------------------------------------------------------
export function fishBig(x, y, s = 1, o = {}) {
  const body = bc('fish1'), dark = mx(body, lc('ink'), 0.46), lit = mx(body, lc('white'), 0.5), fin = mx(lc('red'), body, 0.4), belly = mx(lc('white'), body, 0.2);
  const half = (u) => 76 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.72);
  let g = '';
  const rays = (d, n, c) => L(d, c, 2.2).repeat ? d.split('|').map((q) => L(q, c, 2.2)).join('') : '';
  g += P('M-112 0L-172 -58Q-160 -20 -150 0Q-160 20 -172 58Z', fin, dark, 3);
  g += rays('M-124 -2L-160 -40|M-126 0L-156 -16|M-126 0L-156 16|M-124 2L-160 40', 4, dark);
  g += P('M-58 -58Q-52 -96 -30 -102Q10 -104 48 -74Z', fin, dark, 3);
  g += rays('M-40 -62L-32 -94|M-16 -70L-8 -98|M8 -74L14 -94|M28 -74L32 -86', 4, dark);
  g += P('M-62 56Q-70 86 -92 96Q-44 92 -28 66Z', fin, dark, 3);
  g += P('M40 62Q30 92 12 98Q58 92 72 54Z', fin, dark, 3);
  g += P(blob([[-122, 0], [-74, -56], [-10, -82], [70, -72], [136, -38], [162, -4], [146, 26], [80, 66], [-10, 78], [-74, 54]]), body, dark, 3.5);
  g += P(blob([[-80, 40], [-10, 66], [76, 56], [140, 22], [150, 6], [80, 34], [0, 44]]), belly);
  // scales, a row of scallops
  let sc = '';
  for (let col = 0; col < 9; col++) {
    const px = -86 + col * 19, u = (px + 122) / 244, h = half(u) * 0.86;
    for (let yy = -h + 8 + (col % 2) * 9; yy < h * 0.5; yy += 18) sc += `M${px} ${n1(yy - 9)}a10 9.5 0 0 1 0 19`;
  }
  g += L(sc, dark, 1.8, 'opacity:0.62');
  g += L('M-74 -44Q0 -74 72 -60', lit, 7, 'opacity:0.8');
  if (o.gills) {
    const red = lc('red'), rd = mx(lc('red'), lc('ink'), 0.4);
    g += P(blob([[68, -46], [104, -44], [114, 0], [104, 40], [66, 42], [52, 0]]), mx(rd, lc('ink'), 0.3), dark, 2.5);
    [0, 1, 2, 3].forEach((i) => {
      const cx = 68 + i * 13; let d = '';
      for (let k = -8; k <= 8; k++) d += `M${cx} ${k * 4.5}q9 1 ${n1(13 - Math.abs(k) * 0.6)} ${k * 0.8}`;
      g += L(`M${cx} -38Q${cx - 6} 0 ${cx} 38`, rd, 3) + L(d, red, 2.6);
    });
  } else g += L('M84 -48Q104 -8 82 42', dark, 3.5);
  g += `<circle cx="124" cy="-20" r="11" ${fill(lc('white'), `stroke:${dark};stroke-width:2.5`)}/><circle cx="127" cy="-20" r="6" ${fill(INK)}/><circle cx="129" cy="-22" r="1.9" ${fill(lc('white'))}/>`;
  g += L('M160 2Q150 10 138 8', dark, 3);
  g += P('M30 12Q2 38 -14 40Q-2 14 12 4Z', fin, dark, 2.5);
  return wrap(x, y, s, o, g);
}

// -- frog and its stages ----------------------------------------------------------------------------------------------
const FROG = { body: lc('green'), dark: mx(lc('green'), lc('ink'), 0.5), lit: mx(lc('green'), lc('yellow'), 0.42), belly: mx(lc('yellow'), lc('white'), 0.6) };
export function frogBig(x, y, s = 1, o = {}) {
  const { body, dark, lit, belly } = FROG;
  let g = '';
  if (o.tail) g += P('M-74 -20Q-122 -24 -142 -6Q-110 -6 -70 -6Z', body, dark, 3);
  g += P('M-44 -2H-104q-8 0 -6 -5q40 -8 64 -6Z', body, dark, 3);
  g += P(blob([[-82, -14], [-90, -56], [-44, -112], [28, -128], [84, -120], [112, -84], [92, -44], [30, -14], [-40, -6]]), body, dark, 3.5);
  g += P(blob([[-6, -14], [40, -30], [84, -56], [104, -76], [96, -46], [36, -10]]), belly);
  g += L('M-70 -70Q-30 -112 40 -118', lit, 7, 'opacity:0.85');
  for (const [cx, cy, r] of [[-30, -76, 9], [6, -94, 7], [-52, -50, 6], [26, -72, 5]]) g += `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(dark, 'opacity:0.7')}/>`;
  g += P(blob([[-92, -10], [-104, -44], [-70, -74], [-24, -56], [-8, -22], [-34, -6], [-78, -4]]), body, dark, 3.5);
  g += L('M-90 -40Q-66 -64 -34 -52', lit, 5, 'opacity:0.8');
  g += P(blob([[40, -40], [52, -22], [46, 0], [34, -2], [30, -22]]), body, dark, 3);
  g += L('M46 -1l-16 2M46 -1l-3 5M46 -1l12 3', dark, 3.5);
  g += `<circle cx="72" cy="-122" r="19" ${fill(body, `stroke:${dark};stroke-width:3`)}/><circle cx="74" cy="-124" r="12" ${fill(lc('yellow'), `stroke:${dark};stroke-width:2`)}/><ellipse cx="75" cy="-124" rx="7" ry="4.2" ${fill(INK)}/><circle cx="72" cy="-127" r="2" ${fill(lc('white'))}/>`;
  g += L('M112 -80Q86 -68 58 -80', dark, 3);
  if (o.wet) for (const [cx, cy] of [[-14, -106], [44, -102], [-62, -42], [14, -56]]) g += `<ellipse cx="${cx}" cy="${cy}" rx="7" ry="3.4" transform="rotate(-24 ${cx} ${cy})" ${fill(lc('white'), 'opacity:0.8')}/>`;
  return wrap(x, y, s, o, g);
}
export function tadpole(x, y, s = 1, o = {}) {
  const d = mx(lc('ink'), lc('green'), 0.3), dd = lc('ink'), lit = mx(d, lc('white'), 0.34), fin = mx(d, lc('white'), 0.5), legs = o.legs ?? 0;
  let g = P('M-10 -10Q-52 -22 -76 -6Q-92 2 -76 8Q-48 20 -10 12Z', fin, d, 2.5);
  g += L('M-6 0Q-44 -4 -82 2', d, 8);
  if (legs >= 1) g += L('M-14 12Q-30 26 -24 36', d, 7) + L('M-24 36l-8 2M-24 36l5 4', d, 3);
  if (legs >= 2) g += L('M22 16Q30 26 24 34', d, 6) + L('M24 34l-6 3M24 34l6 3', d, 3);
  g += P(blob([[-16, 0], [-6, -22], [28, -24], [48, -6], [36, 16], [-2, 20]]), d, dd, 2.5);
  g += L('M-2 -14Q18 -20 34 -12', lit, 4);
  if (o.tufts) { const c = mx(lc('red'), lc('white'), 0.3); g += L('M12 18q-4 8 -12 10M12 18q0 10 -4 16M18 18q2 10 2 14M22 16q6 8 8 13', c, 3); }
  g += `<circle cx="34" cy="-8" r="4.2" ${fill(lc('yellow'), `stroke:${dd};stroke-width:1.5`)}/><circle cx="35" cy="-8" r="2" ${fill(dd)}/>`;
  return wrap(x, y, s, o, g);
}
export function spawn(x, y, s = 1, o = {}) {
  const jelly = mx(lc('white'), lc('sea'), 0.18), rim = mx(lc('sea'), lc('ink'), 0.3);
  const spots = [[-48, -8], [-26, -22], [-22, 6], [0, -32], [2, -6], [0, 20], [26, -22], [26, 6], [48, -10], [-46, 18], [46, 18], [-68, 6], [68, 6], [22, 30], [-24, 30]];
  let g = '';
  for (const [cx, cy] of spots) g += `<circle cx="${cx}" cy="${cy}" r="17" ${fill(jelly, `stroke:${rim};stroke-width:2`)}/>`;
  for (const [cx, cy] of spots) g += `<circle cx="${cx}" cy="${cy}" r="6.5" ${fill(lc('ink'))}/><circle cx="${cx - 2}" cy="${cy - 2}" r="1.6" ${fill(lc('white'))}/>`;
  return wrap(x, y, s, o, g);
}

// -- lizard -----------------------------------------------------------------------------------------------------------
export function lizardBig(x, y, s = 1, o = {}) {
  const body = lc('tawny'), dark = mx(lc('tawnyDark'), lc('ink'), 0.3), lit = mx(body, lc('white'), 0.46), belly = mx(lc('white'), body, 0.44);
  const foot = (a, b) => L(`M${a} ${b}l-9 4M${a} ${b}l-1 7M${a} ${b}l8 4`, dark, 3);
  let g = L('M-48 -2Q-120 4 -182 -18Q-198 -24 -204 -38', dark, 21) + L('M-48 -2Q-120 4 -182 -18Q-198 -24 -204 -38', body, 15);
  g += L('M34 8Q24 34 8 40', dark, 12) + L('M34 8Q24 34 8 40', mx(body, lc('ink'), 0.2), 7) + foot(8, 40);
  g += L('M-34 10Q-56 30 -66 42', dark, 13) + L('M-34 10Q-56 30 -66 42', mx(body, lc('ink'), 0.2), 8) + foot(-66, 42);
  g += P(blob([[-64, 0], [-36, -30], [24, -34], [76, -30], [112, -22], [138, -10], [122, 4], [80, 10], [20, 22], [-34, 18]]), body, dark, 3.5);
  g += P(blob([[-44, 12], [20, 18], [78, 8], [120, 2], [80, 2], [20, 6]]), belly);
  // dry scales
  let d = '';
  for (let c = 0; c < 15; c++) for (let r = 0; r < 3; r++) {
    const px = -44 + c * 12 + (r % 2) * 6, py = -22 + r * 10 + Math.abs(c - 5) * 0.4;
    if (px > 100) continue;
    d += `M${px} ${py}l5 3l-5 3l-5 -3Z`;
  }
  g += P(d, mx(body, lc('tawnyDark'), 0.6));
  let crest = '';
  for (let i = 0; i < 9; i++) { const px = -34 + i * 15, py = -30 - Math.sin(i / 8 * Math.PI) * 5; crest += `M${px} ${n1(py + 2)}l5 -13l7 13Z`; }
  g += P(crest, dark);
  g += L('M-34 -22Q24 -30 74 -24', lit, 3.5, 'opacity:0.7');
  g += L('M12 14Q4 34 -14 42', dark, 13) + L('M12 14Q4 34 -14 42', body, 8) + foot(-14, 42);
  g += L('M-50 12Q-74 30 -96 36', dark, 14) + L('M-50 12Q-74 30 -96 36', body, 9) + foot(-96, 36);
  g += `<circle cx="104" cy="-15" r="6" ${fill(lc('yellow'), `stroke:${dark};stroke-width:2`)}/><circle cx="105" cy="-15" r="3" ${fill(INK)}/>`;
  g += L('M136 -7Q116 -1 98 -3', dark, 2.5);
  return wrap(x, y, s, o, g);
}

// -- sparrow ----------------------------------------------------------------------------------------------------------
export function sparrowBig(x, y, s = 1, o = {}) {
  const ch = bc('sparrow'), dk = bc('sparrowDark'), pale = bc('sparrowLit'), grey = mx(lc('whiteShade'), lc('ink'), 0.16), rim = mx(dk, lc('ink'), 0.4);
  let g = L('M-6 0L-10 -26M20 0L16 -26', mx(lc('red'), lc('wood'), 0.5), 5);
  g += L('M-20 1h20M6 1h24', mx(lc('red'), lc('wood'), 0.5), 4);
  g += P('M-82 -46L-152 -36L-148 -22L-74 -22Z', dk, rim, 3);
  g += P(blob([[-90, -36], [-52, -82], [10, -106], [64, -96], [78, -56], [54, -20], [0, -12], [-56, -18]]), pale, rim, 3.5);
  g += P(blob([[-108, -36], [-66, -76], [-16, -92], [30, -70], [12, -40], [-44, -24], [-92, -24]]), ch, rim, 3);
  g += L('M-92 -34L-22 -48M-82 -46L-14 -62M-66 -60L-6 -74', dk, 4.5);
  g += L('M-44 -68l20 12', lc('white'), 7);
  g += P(blob([[26, -100], [52, -124], [94, -124], [106, -96], [92, -78], [50, -74]]), ch, rim, 3.5);
  g += P(blob([[42, -116], [70, -130], [100, -118], [86, -106], [54, -104]]), grey);
  g += P(blob([[52, -94], [72, -100], [90, -96], [84, -82], [58, -78]]), lc('white'));
  g += P(blob([[66, -82], [92, -86], [88, -58], [68, -46], [56, -64]]), INK);
  g += P('M104 -110L126 -100L104 -92Z', INK, INK, 2);
  g += `<circle cx="92" cy="-108" r="4.4" ${fill(INK)}/><circle cx="93" cy="-110" r="1.4" ${fill(lc('white'))}/>`;
  return wrap(x, y, s, o, g);
}

// -- eggs, feather, scales --------------------------------------------------------------------------------------------
export function eggAt(x, y, s = 1, o = {}) {
  const hard = o.kind !== 'leathery';
  const col = hard ? mx(lc('white'), lc('sand'), 0.4) : mx(lc('white'), lc('sand'), 0.16), rim = hard ? mx(lc('sandDark'), lc('ink'), 0.3) : mx(lc('sandDark'), lc('white'), 0.1);
  let g = P(hard ? 'M0 -32C20 -32 28 -8 28 8C28 24 14 32 0 32C-14 32 -28 24 -28 8C-28 -8 -20 -32 0 -32Z' : 'M0 -34C14 -34 22 -14 23 2C24 12 25 18 22 25C16 34 -14 35 -21 25C-25 17 -22 12 -23 2C-22 -14 -14 -34 0 -34Z', col, rim, 3);
  if (hard) {
    g += `<ellipse cx="-10" cy="-8" rx="6" ry="11" transform="rotate(16 -10 -8)" ${fill(lc('white'), 'opacity:0.9')}/>`;
    for (const [cx, cy, r] of [[8, -14, 2.6], [14, 4, 3.2], [-4, 14, 2.8], [10, 20, 2.2], [-14, 20, 2]]) g += `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(lc('brown'), 'opacity:0.7')}/>`;
  } else g += L('M-14 -14q8 6 4 16M10 -18q-6 10 2 18M-16 14q10 -6 18 4M6 16q6 -4 12 -2', rim, 2.4);
  return wrap(x, y, s, o, g);
}
export function feather(x, y, s = 1, o = {}) {
  const col = o.col ?? lc('sea'), dark = mx(col, lc('ink'), 0.42), lit = mx(col, lc('white'), 0.4);
  let g = P('M-66 0Q-40 -30 20 -32Q62 -26 80 0Q60 22 20 26Q-36 24 -66 0Z', col, dark, 2.5);
  let d = ''; for (let i = 0; i < 9; i++) { const px = -48 + i * 13; d += `M${px} 0L${px + 16} ${-22 + Math.abs(i - 4) * 1.4}M${px} 0L${px + 15} ${19 - Math.abs(i - 4) * 1.2}`; }
  g += L(d, dark, 1.6, 'opacity:0.7') + L('M-60 -6Q-20 -24 30 -24', lit, 3.5, 'opacity:0.9');
  g += L('M-92 2Q-20 -2 78 0', mx(lc('white'), lc('sand'), 0.3), 3.6);
  return wrap(x, y, s, o, g);
}
export function scales(x, y, w, h, o = {}) {
  const base = o.col ?? lc('tawny'), dark = mx(lc('tawnyDark'), lc('ink'), 0.3), lit = mx(base, lc('white'), 0.34);
  let g = `<rect width="${w}" height="${h}" rx="14" ${fill(mx(base, lc('ink'), 0.3), `stroke:${INK};stroke-width:3`)}/>`;
  const R = o.r ?? 15, rows = Math.ceil(h / (R * 0.86)) + 1, cols = Math.ceil(w / (R * 1.7)) + 1;
  let body = '';
  for (let r = rows; r >= 0; r--) for (let c = 0; c < cols; c++) {
    const cx = c * R * 1.7 + (r % 2) * R * 0.85, cy = r * R * 0.86;
    if (cx < R * 0.7 || cx > w - R * 0.7 || cy < R * 0.8 || cy > h - R * 0.8) continue;
    body += `<path d="M${n1(cx)} ${n1(cy - R * 0.72)}L${n1(cx + R * 0.8)} ${n1(cy)}L${n1(cx)} ${n1(cy + R * 0.72)}L${n1(cx - R * 0.8)} ${n1(cy)}Z" ${fill(r % 3 ? base : lit, `stroke:${dark};stroke-width:1.8;stroke-linejoin:round`)}/>`;
  }
  return `<g transform="translate(${n1(x)} ${n1(y)})">${g}${body}</g>`;
}

// -- backbone ---------------------------------------------------------------------------------------------------------
/** Vertebrae laid along points, the cord running through. o: size (block length), cord (false to hide it). */
export function spine(pts, o = {}) {
  const sz = o.size ?? 15, bone = mx(lc('white'), lc('sand'), 0.34), rim = mx(lc('sandDark'), lc('ink'), 0.3), cord = mx(lc('yellow'), lc('white'), 0.3), cordR = mx(lc('yellow'), lc('red'), 0.5);
  let g = '', tot = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  const at = (d) => { let k = 0; while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; } const u = d / seg[k]; const a = pts[k], b = pts[k + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI]; };
  const n = Math.floor(tot / (sz * 1.06));
  for (let i = 0; i <= n; i++) {
    const [x, y, a] = at(i / n * tot), h = (o.h ?? sz * 1.5) * (o.taper ? 1 - (1 - o.taper) * (i / n) : 1);
    g += `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})"><path d="M${n1(-sz * 0.3)} ${n1(-h * 0.46)}L${n1(-sz * 0.12)} ${n1(-h * 0.86)}L${n1(sz * 0.3)} ${n1(-h * 0.46)}Z" ${fill(bone, `stroke:${rim};stroke-width:2`)}/><rect x="${n1(-sz * 0.48)}" y="${n1(-h / 2)}" width="${n1(sz * 0.96)}" height="${n1(h)}" rx="${n1(sz * 0.26)}" ${fill(bone, `stroke:${rim};stroke-width:2.2`)}/></g>`;
  }
  if (o.cord !== false) g += `<path d="M${pts.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}" ${stroke(cordR, (o.cordW ?? sz * 0.42) + 3, 'stroke-linecap:round;stroke-linejoin:round')}/><path d="M${pts.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}" ${stroke(cord, o.cordW ?? sz * 0.42, 'stroke-linecap:round;stroke-linejoin:round')}/>`;
  return g;
}

// -- big mammals and the ostrich: real proportions, drawn one part at a time -------------------------------------------
const CAT = {
  tiger: { f: bc('tiger'), d: mx(bc('tigerDark'), lc('ink'), 0.34), far: bc('tigerDark'), lit: bc('tigerLit'), belly: lc('white') },
  lion: { f: lc('tawny'), d: mx(lc('tawnyDark'), lc('ink'), 0.34), far: lc('tawnyDark'), lit: lc('tawnyLit'), belly: mx(lc('white'), lc('tawny'), 0.34) },
};
const HIND = 'M-114 -104C-138 -74 -116 -54 -128 -30C-132 -16 -138 -8 -132 0H-92C-86 -6 -102 -12 -102 -28C-98 -48 -66 -58 -58 -92Z';
const FORE = 'M36 -94C32 -62 46 -34 38 -10Q34 0 44 0H82C88 -4 76 -10 68 -12C74 -38 80 -66 82 -96Z';
const toes = (x) => L(`M${x} -9v8M${x + 10} -9v8M${x + 20} -9v8`, INK, 2);
function catBody(c) {
  let g = `<g transform="translate(26 -2)">${P(HIND, c.far, c.d, 2.5)}</g><g transform="translate(-24 -2)">${P(FORE, c.far, c.d, 2.5)}</g>`;
  g += P(blob([[-132, -98], [-116, -134], [-60, -146], [-4, -136], [52, -150], [92, -138], [104, -106], [84, -76], [30, -60], [-40, -64], [-104, -70], [-130, -82]]), c.f, c.d, 3);
  g += P(blob([[-96, -70], [-40, -66], [30, -62], [78, -80], [66, -92], [10, -82], [-50, -80]]), c.belly);
  g += L('M-112 -128Q-60 -142 -6 -130Q30 -128 60 -142', c.lit, 7, 'opacity:0.75');
  g += P(HIND, c.f, c.d, 3) + P(FORE, c.f, c.d, 3) + toes(-126) + toes(46);
  return g;
}
const TAIL = 'M-124 -122C-170 -122 -186 -92 -176 -62C-172 -48 -158 -44 -150 -54';
function tigerStripes() {
  const st = (x, y, l, b, w = 7) => `M${x - w / 2} ${y}Q${x + b - w / 2} ${y + l * 0.5} ${x + b * 0.4} ${y + l}Q${x + b + w / 2} ${y + l * 0.5} ${x + w / 2} ${y}Z`;
  let d = '';
  for (const [x, y, l, b] of [[-110, -130, 34, 8], [-90, -138, 44, 8], [-68, -142, 52, 7], [-46, -142, 40, 6], [-26, -140, 52, 5], [-6, -135, 40, 4], [14, -137, 50, 3], [34, -141, 44, 2], [54, -146, 50, 1], [72, -143, 44, 0]]) d += st(x, y, l, b);
  for (const [x, y, l, b] of [[-122, -96, 26, 9], [-108, -80, 24, 10], [-96, -66, 18, 8], [-76, -92, 20, 10], [-40, -92, 16, 4], [10, -92, 16, 3]]) d += st(x, y, l, b, 6);
  for (const [x, y, l, b] of [[44, -70, 0, 0]]) d += '';
  d += 'M42 -74q16 4 32 0q-16 9 -30 7ZM44 -54q14 4 28 0q-14 8 -27 6ZM46 -34q12 3 24 0q-12 7 -23 5ZM-124 -52q11 4 22 0q-11 7 -21 5ZM-126 -36q10 3 22 0q-10 6 -20 4Z';
  return P(d, INK);
}
export function tigerBig(x, y, s = 1, o = {}) {
  const c = CAT.tiger;
  let g = L(TAIL, c.d, 18) + L(TAIL, c.f, 13) + L('M-150 -120l-1 12M-170 -108l11 6M-178 -84l12 2M-176 -64l12 -4M-162 -50l6 -9', INK, 5);
  g += catBody(c) + tigerStripes();
  g += `<circle cx="104" cy="-178" r="13" ${fill(c.f, `stroke:${c.d};stroke-width:3`)}/><circle cx="104" cy="-178" r="6.5" ${fill(c.belly)}/><circle cx="142" cy="-182" r="13" ${fill(c.f, `stroke:${c.d};stroke-width:3`)}/><circle cx="142" cy="-182" r="6.5" ${fill(c.belly)}/>`;
  g += P(blob([[72, -150], [92, -180], [138, -188], [168, -166], [182, -136], [168, -110], [128, -96], [88, -104], [68, -126]]), c.f, c.d, 3);
  g += P(blob([[70, -128], [86, -112], [118, -100], [104, -128], [86, -138]]), c.belly);
  g += P(blob([[136, -136], [160, -148], [184, -138], [182, -116], [160, -104], [136, -110]]), c.belly, c.d, 2);
  g += P('M170 -146L186 -146Q186 -134 178 -132Q170 -136 170 -146Z', mx(lc('red'), lc('white'), 0.3), INK, 2);
  g += L('M178 -132V-120M178 -120Q166 -114 154 -120M178 -120Q182 -116 184 -118', INK, 2.5);
  g += P(blob([[132, -164], [156, -166], [156, -152], [136, -150]]), c.belly);
  g += `<circle cx="146" cy="-156" r="6" ${fill(lc('yellow'), `stroke:${INK};stroke-width:2.5`)}/><circle cx="147" cy="-156" r="2.8" ${fill(INK)}/>`;
  g += P('M112 -186q2 12 8 20q-12 -6 -14 -20ZM126 -188q0 12 2 20q-10 -8 -10 -20ZM138 -184q-2 8 -2 14q-7 -6 -6 -15ZM92 -150q12 2 20 8q-14 0 -24 -3ZM88 -132q12 0 22 5q-14 2 -24 0ZM96 -116q10 -2 18 2q-10 4 -18 3Z', INK);
  g += L('M152 -120h-14M154 -128l-16 -3', INK, 1.6);
  if (o.glands) g += `<circle cx="-38" cy="-68" r="16" ${fill(mx(lc('red'), lc('white'), 0.5), `stroke:${INK};stroke-width:3`)}/><circle cx="-44" cy="-72" r="5" ${fill(lc('white'))}/><circle cx="-32" cy="-64" r="5" ${fill(lc('white'))}/>`;
  return wrap(x, y, s, o, g);
}
export function lionBig(x, y, s = 1, o = {}) {
  const c = CAT.lion, ma = lc('mane'), mad = mx(lc('mane'), lc('ink'), 0.42), mal = mx(lc('mane'), lc('tawny'), 0.5);
  let g = L(TAIL, c.d, 13) + L(TAIL, c.f, 8) + `<ellipse cx="-150" cy="-52" rx="15" ry="11" transform="rotate(-30 -150 -52)" ${fill(ma, `stroke:${mad};stroke-width:2.5`)}/>`;
  g += catBody(c);
  const lobes = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? 80 : 94; lobes.push([116 + Math.cos(a) * r * 0.92, -128 + Math.sin(a) * r]); }
  g += P(blob(lobes), ma, mad, 3);
  let tuft = ''; for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2, r0 = 44, r1 = 74; tuft += `M${n1(120 + Math.cos(a) * r0)} ${n1(-132 + Math.sin(a) * r0)}Q${n1(120 + Math.cos(a + 0.2) * 60)} ${n1(-132 + Math.sin(a + 0.2) * 60)} ${n1(116 + Math.cos(a + 0.34) * r1 * 0.92)} ${n1(-128 + Math.sin(a + 0.34) * r1)}`; }
  g += L(tuft, mad, 3.5, 'opacity:0.75');
  g += `<circle cx="96" cy="-176" r="11" ${fill(c.f, `stroke:${c.d};stroke-width:2.5`)}/><circle cx="138" cy="-182" r="11" ${fill(c.f, `stroke:${c.d};stroke-width:2.5`)}/>`;
  g += P(blob([[84, -166], [108, -182], [142, -180], [164, -160], [180, -134], [168, -106], [130, -92], [98, -108], [84, -136]]), c.f, c.d, 3);
  g += P(blob([[134, -134], [160, -146], [182, -136], [180, -112], [158, -98], [132, -108]]), c.belly, c.d, 2);
  g += P('M170 -144L184 -144Q184 -132 177 -130Q170 -134 170 -144Z', mx(lc('red'), lc('wood'), 0.4), INK, 2);
  g += L('M177 -130V-118M177 -118Q164 -112 152 -118', INK, 2.5);
  g += `<circle cx="142" cy="-154" r="5.6" ${fill(mal, `stroke:${INK};stroke-width:2.5`)}/><circle cx="143" cy="-154" r="2.8" ${fill(INK)}/>`;
  g += L('M130 -166q12 -6 24 0', mad, 3.5);
  return wrap(x, y, s, o, g);
}
export function bearBig(x, y, s = 1, o = {}) {
  // A polar bear in profile: hips higher than shoulders, long neck carried forward, small wedge head, big furred paws.
  const f = mx(lc('white'), lc('sand'), 0.16), sh = mx(f, lc('sandDark'), 0.28), rim = mx(lc('sandDark'), INK, 0.56), claw = INK;
  const paw = (x0, x1) => { let d = ''; for (let i = 0; i < 4; i++) { const px = x1 - 3 - i * 12; d += `M${px} -9q2 5 5 7`; } return L(d, claw, 2.6); };
  // Each leg: a fill with no top edge, so it grows out of the body and no seam crosses the coat.
  const hind = (dx, c) => {
    const side = 'M-158 -92C-160 -56 -146 -34 -140 -16Q-146 -2 -128 0H-58Q-40 -2 -50 -14Q-62 -22 -66 -36C-62 -58 -46 -74 -30 -92', edge = 'M-158 -92C-160 -56 -146 -34 -140 -16Q-146 -2 -128 0H-58Q-40 -2 -50 -14Q-62 -22 -66 -36Q-65 -46 -60 -54';
    return `<g transform="translate(${dx} 0)">${P(side + 'Z', c)}${L(edge, rim, 3)}${paw(-128, -50)}</g>`;
  };
  const fore = (dx, c) => {
    const side = 'M26 -104C30 -70 36 -44 36 -22Q24 -6 34 0H104Q120 -2 110 -14Q96 -22 92 -36C94 -56 100 -74 106 -100', edge = 'M33 -56Q36 -38 36 -22Q24 -6 34 0H104Q120 -2 110 -14Q96 -22 92 -36C94 -48 97 -60 100 -70';
    return `<g transform="translate(${dx} 0)">${P(side + 'Z', c)}${L(edge, rim, 3)}${paw(34, 110)}</g>`;
  };
  let g = hind(42, sh) + fore(-32, sh);
  g += `<circle cx="148" cy="-126" r="8.5" ${fill(sh, `stroke:${rim};stroke-width:3`)}/>`;
  const hull = 'M-160 -96C-166 -136 -140 -168 -92 -172C-50 -176 -6 -166 30 -154C62 -146 92 -138 116 -130C126 -135 140 -132 148 -122C160 -114 176 -108 186 -102C196 -97 195 -86 186 -84C176 -80 164 -78 150 -80C138 -81 126 -84 114 -78C98 -72 84 -66 70 -60C40 -50 -10 -46 -60 -48C-100 -48 -150 -54 -160 -96Z';
  g += P(hull, f, rim, 3);
  // One soft shade: under the belly and neck, behind the shoulder, round the haunch.
  g += P('M-146 -66C-120 -50 -60 -52 -10 -52C30 -54 60 -60 80 -70C100 -80 118 -90 134 -86C120 -74 92 -68 70 -60C40 -50 -10 -46 -60 -48C-100 -48 -132 -52 -146 -66Z', sh);
  g += P('M24 -136C12 -112 16 -82 33 -56C8 -80 4 -116 24 -136Z', sh);
  g += P('M-46 -148C-26 -120 -32 -82 -60 -54C-46 -86 -38 -118 -46 -148Z', sh);
  g += P('M150 -82C160 -86 176 -86 186 -85C176 -80 164 -78 150 -80Z', sh);
  g += L('M-124 -146l9 7M-86 -156l9 6M-116 -112l9 6M-82 -124l9 6M-6 -146l8 7M-8 -112l8 6M58 -132l8 6M86 -122l8 6M-92 -86l9 5', sh, 3.5);
  g += hind(0, f) + fore(0, f);
  g += `<circle cx="132" cy="-132" r="9" ${fill(f, `stroke:${rim};stroke-width:3`)}/><circle cx="132" cy="-131" r="4" ${fill(sh)}/>`;
  g += P(blob([[176, -102], [186, -104], [196, -96], [192, -86], [182, -88]]), INK);
  g += `<circle cx="158" cy="-110" r="4" ${fill(INK)}/><circle cx="159.4" cy="-111.4" r="1.2" ${fill(f)}/>`;
  g += L('M185 -85Q172 -86 160 -90', rim, 2.6);
  return wrap(x, y, s, o, g);
}
export function camelBig(x, y, s = 1, o = {}) {
  const f = lc('camel'), d = mx(lc('camelDark'), lc('ink'), 0.3), far = lc('camelDark'), lit = lc('camelLit'), ink = lc('ink');
  const leg = (dx, c) => `<g transform="translate(${dx} 0)">${P('M-18 -130C-18 -106 -9 -98 -10 -86C-13 -78 -11 -72 -9 -64L-7 -16Q-22 -6 -20 0H16Q16 -6 3 -16L5 -64C7 -72 9 -78 6 -86C5 -100 16 -110 16 -130Z', c, d, 2.5)}</g>`;
  let g = leg(-66, far) + leg(100, far);
  g += L('M-124 -196Q-140 -172 -132 -146', d, 7) + L('M-132 -146l-4 12M-132 -146l3 12', d, 3);
  g += P(blob([[-128, -170], [-122, -208], [-82, -216], [-46, -226], [-26, -294], [18, -294], [40, -224], [78, -208], [114, -196], [132, -170], [118, -128], [50, -110], [-40, -110], [-108, -126]]), f, d, 3);
  g += L('M-114 -200Q-70 -214 -52 -226Q-34 -278 -4 -282', lit, 7, 'opacity:0.8');
  g += P(blob([[96, -196], [124, -190], [136, -160], [146, -128], [152, -124], [156, -150], [152, -192], [158, -226], [166, -252], [146, -268], [130, -242], [122, -212], [110, -206]]), f, d, 3);
  g += P(blob([[146, -258], [160, -276], [194, -276], [220, -262], [224, -244], [206, -236], [168, -238], [150, -244]]), f, d, 3);
  g += P('M160 -274l-6 -16l14 12Z', f, d, 2.5);
  g += `<circle cx="184" cy="-262" r="4.6" ${fill(ink)}/><circle cx="185" cy="-264" r="1.4" ${fill(lc('white'))}/>`;
  g += L('M180 -272q8 -6 16 -2M222 -246Q208 -244 198 -248M214 -258l5 3', d, 2.6);
  g += leg(-104, f) + leg(66, f);
  if (o.cut) {
    const pale = mx(lc('white'), lc('yellow'), 0.28), blobby = mx(lc('yellow'), lc('white'), 0.6), r2 = mx(lc('yellow'), lc('sandDark'), 0.6);
    g += P(blob([[-40, -214], [-26, -278], [20, -278], [34, -214], [0, -200]]), pale, ink, 3);
    for (const [cx, cy, r] of [[-14, -258, 13], [12, -262, 11], [-18, -228, 12], [8, -232, 15], [-2, -278 + 40, 0.1], [-2, -206 - 2, 0.1], [24, -216, 7], [-30, -212, 6]]) if (r > 1) g += `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(blobby, `stroke:${r2};stroke-width:2.2`)}/>`;
  }
  return wrap(x, y, s, o, g);
}
export function ostrichBig(x, y, s = 1, o = {}) {
  const skin = bc('ostrichSkin'), sd = mx(bc('ostrichSkinDark'), lc('ink'), 0.3), blk = bc('ostrich'), mid = mx(bc('ostrich'), lc('white'), 0.22), pl = lc('white'), ps = lc('whiteShade');
  const legp = (dx, c) => `<g transform="translate(${dx} 0)">${P('M-16 -176C-22 -146 -12 -128 -8 -116C-10 -100 -12 -70 -10 -28Q-10 -18 -16 -12H-22Q-34 -8 -30 0H14Q26 -2 16 -8Q2 -14 0 -28C2 -70 6 -100 8 -116C14 -130 16 -150 14 -178Z', c, sd, 2.5)}</g>`;
  let g = legp(30, sd) + legp(-14, skin);
  g += L('M-30 -122l6 6M-26 -112l6 2', sd, 2);
  const fluff = []; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = i % 2 ? 1 : 1.1; fluff.push([-6 + Math.cos(a) * 92 * r, -214 + Math.sin(a) * 58 * r]); }
  g += P('M-82 -226C-118 -240 -128 -214 -112 -200C-130 -196 -128 -176 -108 -178C-112 -160 -90 -158 -80 -174Z', pl, ps, 3);
  g += P(blob(fluff), blk, INK, 3);
  let d = ''; for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const px = -70 + i * 24 + r * 8, py = -250 + r * 26 + Math.abs(i - 3) * 3; d += `M${px} ${py}q11 12 22 0`; }
  g += L(d, mid, 3);
  g += P('M-30 -212C-58 -206 -72 -184 -66 -176C-54 -178 -50 -168 -40 -176C-30 -166 -22 -172 -14 -180C-6 -170 4 -176 12 -188C22 -200 12 -214 -30 -212Z', pl, ps, 3);
  g += L('M-48 -182Q-30 -196 -8 -198M-30 -176Q-14 -188 2 -192', ps, 2.6);
  g += P('M56 -240C72 -278 74 -304 66 -330Q72 -344 86 -340Q90 -304 86 -276C84 -254 78 -232 60 -210Z', skin, sd, 3);
  g += P(blob([[58, -342], [78, -354], [100, -350], [106, -340], [86, -332], [62, -330]]), skin, sd, 3);
  g += P('M100 -350L132 -340Q118 -330 100 -334Z', mx(skin, lc('yellow'), 0.3), sd, 2.5);
  g += L('M128 -340L96 -340', sd, 2);
  g += `<circle cx="84" cy="-344" r="6.4" ${fill(lc('white'), `stroke:${sd};stroke-width:2`)}/><circle cx="85" cy="-344" r="3.6" ${fill(INK)}/>`;
  return wrap(x, y, s, o, g);
}
const BIG = { Tiger: [tigerBig, -190, -192, 380, 194], Lion: [lionBig, -190, -224, 390, 226], Bear: [bearBig, -160, -172, 352, 174], Camel: [camelBig, -142, -292, 370, 294], Ostrich: [ostrichBig, -130, -356, 266, 358] };
export function fitBig(name, x, y, w, h, o = {}) {
  const [fn, bx, , bw, bh] = BIG[name], s = Math.min(w / bw, h / bh, o.max ?? 9);
  return fn(x + w / 2 - (bx + bw / 2) * s, y + h, s, o);
}
