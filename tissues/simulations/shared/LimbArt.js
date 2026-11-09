// LimbArt - bones, cartilage, tendons, ligaments and a side view of the arm for the tissues module (scene batch S4,
// L07 and L08). Not a scene. SVG strings, tokens only, no faces. Built on BodyArt (form, tube, tapered: lit side,
// shade side, rim) and CellWorld (mx, T). Light from the top left.
//   BONE, CART, TEND, LIGA, MUS, SKIN (+ _D dark, _L light)   one colour per tissue, in both themes
//   boneForm(d, o)            a bone: lit fill, rim, a highlight line along it, spongy ends (o.ends [[x, y, r]])
//   muscleForm(pts, ws, o)    a muscle belly round a centre line: shaded, with fibre lines along it
//   bandTube(d, col, w, o)    a tendon or ligament: a shaded band with fine fibres along it
//   armGeom(th, o)            side view of the arm at elbow angle th (radians, 0 = forearm hanging down, forward +)
//   armSvg(g, o)              the drawing for armGeom: skin, humerus, radius, ulna, triceps, biceps and its tendon,
//                             hand, o.bag a school bag hanging from the hand, o.cut a clean gap in the biceps tendon,
//                             o.squeeze 0..1 the belly shortening on its own (cut tendon), o.dim(part) -> opacity
//   schoolBag(x, y, w, h)     a school bag, its top centre at (x, y)
//   tweenTo(scene, from, to, ms, set)   a bounded frame tween (ends by itself); cancelTween(scene); drawOnly(scene)
import { backdropSvg } from 'simulations/base/kit/SimSvg.js';
import { form, tube, tapered } from './BodyArt.js';
import { T, mx, n1 } from './CellWorld.js';

export const INK = T('strata-6'), W_ = T('elev-peak');
export const BONE = mx('series-2', 'elev-peak', 21), BONE_D = mx('series-2', 'strata-6', 46), BONE_L = mx(BONE, W_, 40);
export const CART = mx('series-1', 'elev-peak', 34), CART_D = mx('series-1', 'strata-6', 62);
export const TEND = mx('series-5', 'elev-peak', 16), TEND_D = mx('series-5', 'strata-6', 62);
export const LIGA = mx('series-3', 'elev-peak', 44), LIGA_D = mx('series-3', 'strata-6', 58);
export const MUS = mx('series-6', 'series-4', 66), MUS_D = mx(MUS, INK, 60), MUS_L = mx(MUS, W_, 56);
export const SKIN = mx('series-8', 'elev-peak', 26), SKIN_D = mx('series-8', 'strata-6', 46);
export const TRUNK = mx(SKIN, 'series-4', 88), FAT = mx('series-2', 'elev-peak', 22), FAT_D = mx('series-2', 'series-8', 50);

const op = (o, id) => (o.dim ? o.dim(id) : 1);
const grp = (o, id, body) => { const a = op(o, id); return `<g data-part="${id}"${a < 1 ? ` style="opacity:${a}"` : ''}>${body}</g>`; };

/** A bone: shaded form, a light line along the shaft, spongy dots at its ends. */
export function boneForm(d, o = {}) {
  let inner = o.inner ?? '';
  for (const [x, y, r] of o.ends ?? []) {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, rr = r * (0.25 + ((i * 37) % 10) / 14);
      inner += `<circle cx="${n1(x + Math.cos(a) * rr)}" cy="${n1(y + Math.sin(a) * rr)}" r="${n1(1.4 + (i % 3) * 0.7)}" style="fill:${BONE_D};opacity:.28"/>`;
    }
  }
  if (o.line) inner += `<path d="${o.line}" style="fill:none;stroke:${W_};stroke-width:${o.lineW ?? 3};stroke-linecap:round;opacity:.6"/>`;
  return form(d, BONE, { inner, rim: o.rim ?? 2.4, rimCol: BONE_D, ao: 10, aoOp: 0.42, hi: 60 });
}

/** A muscle belly round centre line pts (half widths ws), fibre lines along it, a rim. */
export function muscleForm(pts, ws, o = {}) {
  const d = tapered(pts, ws);
  let inner = '';
  for (const f of [-0.6, -0.25, 0.1, 0.45, 0.75]) {
    let p = '';
    pts.forEach((q, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      p += `${i ? 'L' : 'M'}${n1(q[0] - (ty / l) * ws[i] * f)} ${n1(q[1] + (tx / l) * ws[i] * f)}`;
    });
    inner += `<path d="${p}" style="fill:none;stroke:${MUS_D};stroke-width:1.3;opacity:.42"/>`;
  }
  return form(d, o.col ?? MUS, { inner, rim: o.rim ?? 2.4, ao: 12, aoOp: 0.5 });
}

/** A tendon or ligament band along d: dark edge, body, fibre lines, a lit edge. */
export function bandTube(d, col, w, o = {}) {
  const dk = o.dark ?? mx(col, INK, 50);
  return tube(d, col, w, { lit: o.lit }) + `<path d="${d}" style="fill:none;stroke:${dk};stroke-width:${n1(Math.max(0.8, w * 0.12))};stroke-dasharray:9 5;opacity:.5"/>`;
}

// ---------------------------------------------------------------- the arm (side view, facing right)
const rot = (p, th) => [p[0] * Math.cos(th) + p[1] * Math.sin(th), -p[0] * Math.sin(th) + p[1] * Math.cos(th)];
export const ARM = { L1: 140, L2: 122, rest: 0.26 };
/** Points of the arm in its own frame: shoulder (0, 0), elbow (0, L1). th: forearm angle from hanging down. */
export function armGeom(th, o = {}) {
  const { L1, L2 } = ARM, E = [0, L1];
  const F = (p) => { const r = rot(p, th); return [E[0] + r[0], E[1] + r[1]]; };   // forearm frame (hanging down) -> arm frame
  const I = F([9, 30]), Oc = F([-13, -6]), H = F([0, L2 + 8]);
  const strap = 30, bagH = 84;
  const floor = E[1] + Math.cos(ARM.rest) * (L2 + 26) + strap + bagH;
  return { th, E, I, Oc, H, F, floor, strap, bagH };
}
export function schoolBag(x, y, w, h) {
  const c = mx('series-1', 'sea-deep', 60), cD = mx(c, INK, 56), cL = mx(c, W_, 60), acc = mx('series-2', 'series-8', 60);
  const body = `M${n1(x - w / 2)} ${n1(y + 18)}Q${n1(x - w / 2)} ${n1(y)} ${n1(x - w / 2 + 18)} ${n1(y)}H${n1(x + w / 2 - 18)}Q${n1(x + w / 2)} ${n1(y)} ${n1(x + w / 2)} ${n1(y + 18)}V${n1(y + h - 8)}Q${n1(x + w / 2)} ${n1(y + h)} ${n1(x + w / 2 - 8)} ${n1(y + h)}H${n1(x - w / 2 + 8)}Q${n1(x - w / 2)} ${n1(y + h)} ${n1(x - w / 2)} ${n1(y + h - 8)}Z`;
  const flap = `M${n1(x - w / 2 + 3)} ${n1(y + 16)}Q${n1(x - w / 2 + 3)} ${n1(y + 3)} ${n1(x - w / 2 + 18)} ${n1(y + 3)}H${n1(x + w / 2 - 18)}Q${n1(x + w / 2 - 3)} ${n1(y + 3)} ${n1(x + w / 2 - 3)} ${n1(y + 16)}V${n1(y + h * 0.44)}Q${n1(x)} ${n1(y + h * 0.56)} ${n1(x - w / 2 + 3)} ${n1(y + h * 0.44)}Z`;
  const pocket = `M${n1(x - w * 0.32)} ${n1(y + h * 0.62)}H${n1(x + w * 0.32)}V${n1(y + h - 12)}Q${n1(x + w * 0.32)} ${n1(y + h - 6)} ${n1(x + w * 0.26)} ${n1(y + h - 6)}H${n1(x - w * 0.26)}Q${n1(x - w * 0.32)} ${n1(y + h - 6)} ${n1(x - w * 0.32)} ${n1(y + h - 12)}Z`;
  return form(body, c, { rim: 2.4, ao: 10 })
    + `<path d="${pocket}" style="fill:${mx(c, INK, 86)};stroke:${cD};stroke-width:2"/><path d="M${n1(x - w * 0.28)} ${n1(y + h * 0.66)}H${n1(x + w * 0.28)}" style="fill:none;stroke:${cL};stroke-width:1.4;stroke-dasharray:3 3"/>`
    + `<path d="${flap}" style="fill:${mx(c, W_, 86)};stroke:${cD};stroke-width:2"/><path d="M${n1(x - w / 2 + 8)} ${n1(y + 10)}H${n1(x + w / 2 - 10)}" style="fill:none;stroke:${cL};stroke-width:2;opacity:.6"/>`
    + `<rect x="${n1(x - 7)}" y="${n1(y + h * 0.42)}" width="14" height="12" rx="3" style="fill:${acc};stroke:${mx(acc, INK, 50)};stroke-width:1.6"/>`;
}
/** Skin in cut-away: an outer skin form, a window of pale tissue inside it (the skin shows as a rim with thickness). */
function skinCut(outer, inner, seed = 1) {
  let grain = '';
  for (let i = 0; i < 26; i++) {
    const a = Math.sin(i * 12.99 + seed * 7.1) * 43758.5, b = Math.sin(i * 78.23 + seed * 3.3) * 12345.6;
    grain += `<circle cx="${n1((a - Math.floor(a)) * 120 - 60)}" cy="${n1((b - Math.floor(b)) * 300 - 40)}" r="${n1(1.2 + (i % 3) * 0.8)}" style="fill:${FAT_D};opacity:.22"/>`;
  }
  const id = `lk-w${seed}-${Math.round(Math.abs(Math.sin(seed * 9.7)) * 1e5)}`;
  return form(outer, SKIN, { rim: 2.2, rimCol: SKIN_D, ao: 12, aoOp: 0.4, hi: 60 })
    + `<defs><clipPath id="${id}"><path d="${inner}"/></clipPath></defs><path d="${inner}" style="fill:${FAT}"/><g clip-path="url(#${id})">${grain}<path d="${inner}" style="fill:none;stroke:${FAT_D};stroke-width:10;opacity:.28;filter:blur(4px)"/></g>`
    + `<path d="${inner}" style="fill:none;stroke:${SKIN_D};stroke-width:1.4;stroke-dasharray:5 3;opacity:.7"/>`;
}
/** A fibrous band from a to b: wider at a (wa) than at b (wb), lengthwise fibres, a lit edge; fanned into bone at b. */
export function fibreBand(a, b, wa, wb, col, colD, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const P = (t, f) => { const w = wa + (wb - wa) * t, bow = (o.bow ?? 0) * Math.sin(Math.PI * t); return [a[0] + dx * t + nx * (w * f + bow), a[1] + dy * t + ny * (w * f + bow)]; };
  const side = (f) => [0, 0.25, 0.5, 0.75, 1].map((t) => P(t, f));
  const l = side(1), r = side(-1).reverse();
  const d = `M${l.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}L${r.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
  let s = `<path d="${d}" style="fill:${col};stroke:${colD};stroke-width:${o.lit ? 2.6 : 1.4};stroke-linejoin:round;stroke-opacity:.8"/>`;
  for (const f of [-0.62, -0.25, 0.12, 0.48, 0.8]) {
    const q = side(f);
    s += `<path d="M${q.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}" style="fill:none;stroke:${colD};stroke-width:.8;opacity:.32"/>`;
  }
  const lq = side(0.78);
  s += `<path d="M${lq.slice(0, 4).map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}" style="fill:none;stroke:${W_};stroke-width:1.6;opacity:.7"/>`;
  if (o.fan) for (const f of [-1, -0.5, 0, 0.5, 1]) { const p = P(1, f * 0.9); s += `<path d="M${n1(p[0])} ${n1(p[1])}l${n1(dx / L * 6 + nx * f * 3)} ${n1(dy / L * 6 + ny * f * 3)}" style="fill:none;stroke:${colD};stroke-width:1.2;opacity:.6;stroke-linecap:round"/>`; }
  return s;
}
/** The arm drawing. o: bag, cut, squeeze (0..1), dim(part) part = skin humerus forearm biceps tendon triceps elbow, lit(part),
 *  o.trunk false leaves out the side view of the chest and shoulder behind the arm. */
export function armSvg(g, o = {}) {
  const { L1, L2 } = ARM, { E, I, Oc, F } = g, deg = (-g.th * 180) / Math.PI;
  const lw = (id) => (o.lit?.(id) ? 4 : 2.4);
  let s = '';
  // the chest and shoulder behind the arm, side view facing right: neck rising out of the frame, chest in front, back behind
  if (o.trunk !== false) {
    const tr = `M-50 -170C-50 -130 -44 -96 -50 -76C-60 -56 -86 -44 -96 -10C-102 30 -98 120 -88 180C-84 220 -88 280 -92 340L58 340C56 300 52 262 54 222C56 180 64 140 64 96C66 50 64 0 50 -28C40 -46 22 -54 18 -66C14 -78 12 -88 12 -92Q30 -96 40 -112C44 -130 40 -160 40 -170Z`;
    const fid = `lk-tf${Math.round(Math.abs(Math.sin(L1 + deg)) * 1e5)}`;
    s += grp(o, 'skin', `<defs><linearGradient id="${fid}" x1="0" y1="0" x2="0" y2="1"><stop offset=".72" style="stop-color:white"/><stop offset="1" style="stop-color:black"/></linearGradient><mask id="${fid}m" maskUnits="userSpaceOnUse" x="-120" y="-160" width="200" height="510"><rect x="-120" y="-160" width="200" height="510" style="fill:url(#${fid})"/></mask></defs>`
      + `<g mask="url(#${fid}m)">${form(tr, TRUNK, { rim: 2.2, rimCol: SKIN_D, ao: 22, aoOp: 0.45 })}`
      + `<path d="M-50 -40Q-10 -50 30 -38" style="fill:none;stroke:${SKIN_D};stroke-width:2;opacity:.35"/>`
      + `<path d="M58 30Q40 64 54 104" style="fill:none;stroke:${SKIN_D};stroke-width:2;opacity:.3"/>`
      + `<path d="M-78 -10C-88 40 -88 90 -80 140" style="fill:none;stroke:${W_};stroke-width:6;opacity:.25;stroke-linecap:round"/>`
      + `<path d="M12 -92Q-6 -70 -30 -62" style="fill:none;stroke:${SKIN_D};stroke-width:1.8;opacity:.3"/><path d="M-6 -90C-8 -74 -4 -62 6 -54" style="fill:none;stroke:${SKIN_D};stroke-width:1.6;opacity:.25"/></g>`);
  }
  // skin of the arm in cut-away: deltoid cap, upper arm, forearm; the window inside shows the tissue under the skin
  const upO = tapered([[2, -30], [3, 20], [3, L1 * 0.6], [1, L1 + 4]], [42, 36, 31, 27]);
  const upI = tapered([[2, -24], [3, 20], [3, L1 * 0.6], [1, L1 + 4]], [34, 29, 24, 20]);
  const foO = tapered([[0, -6], [2, L2 * 0.4], [0, L2 * 0.82], [0, L2 + 8]], [27, 25, 17, 14]);
  const foI = tapered([[0, 2], [2, L2 * 0.4], [0, L2 * 0.82], [0, L2 + 2]], [20, 19, 11, 8]);
  s += grp(o, 'skin', skinCut(upO, upI, 1) + `<g transform="rotate(${n1(deg)} ${E[0]} ${E[1]})"><g transform="translate(0 ${L1})">${skinCut(foO, foI, 2)}</g></g>`);
  // the shoulder joint: the shoulder blade's socket and roof behind the round head of the humerus
  s += grp(o, 'humerus', `<path d="M-30 -36Q-8 -50 18 -38L22 -30Q-4 -40 -26 -28Z" style="fill:${BONE};stroke:${BONE_D};stroke-width:1.8"/>`
    + `<path d="M-24 -24Q-30 -2 -22 16L-30 22Q-40 -2 -32 -26Z" style="fill:${BONE};stroke:${BONE_D};stroke-width:1.8"/>`);
  // triceps behind the humerus, to the olecranon
  const tO = [-14, 4], tB = [(tO[0] + Oc[0]) / 2 - 14, (tO[1] + Oc[1]) / 2], tE = [Oc[0] - 4, Oc[1] - 22];
  s += grp(o, 'triceps', muscleForm([tO, [-22, 40], tB, [tE[0] - 4, tE[1] - 20], tE], [7, 16, 17, 11, 5], { rim: lw('triceps') })
    + fibreBand(tE, Oc, 6, 4, TEND, TEND_D, { fan: true }));
  // humerus: head with its cartilage cap, shaft, the rounded lower end (trochlea) with its cartilage
  const hum = tapered([[-3, 8], [0, 26], [1, L1 * 0.5], [0, L1 - 22], [0, L1 - 8]], [11, 9, 8, 11, 14]);
  s += grp(o, 'humerus', boneForm(hum, { ends: [[0, L1 - 14, 11], [-3, 12, 8]], line: `M-4 24L-3 ${L1 - 26}`, rim: lw('humerus') })
    + form(`M-21 -2A17 17 0 1 1 13 -2A17 17 0 1 1 -21 -2Z`, BONE, { rim: lw('humerus'), rimCol: BONE_D, ao: 8, aoOp: 0.4 })
    + `<path d="M-19 -9A17 17 0 0 1 9 -15" style="fill:none;stroke:${CART};stroke-width:4.4;stroke-linecap:round"/><path d="M-19 -9A17 17 0 0 1 9 -15" style="fill:none;stroke:${CART_D};stroke-width:1;opacity:.6;transform:translate(1px,2.6px)"/>`
    + form(`M-15 ${L1}A15 15 0 1 1 15 ${L1}A15 15 0 1 1 -15 ${L1}Z`, BONE, { rim: lw('humerus'), rimCol: BONE_D, ao: 7, aoOp: 0.4 }));
  // forearm: ulna with its notch hugging the trochlea and the olecranon behind; radius in front with its tuberosity
  const ulna = `M-10.6 -10.6L-17 -14Q-25 -4 -20 10Q-15 18 -11 26L-8 ${n1(L2 * 0.5)}L-8 ${L2 - 2}L-1 ${L2 - 2}L-1 ${n1(L2 * 0.5)}L2 30Q9 22 11.5 9.6A15 15 0 1 1 -10.6 -10.6Z`;
  const ra = `M3 16H14L13 24Q15 30 12 34L11 ${n1(L2 * 0.5)}Q12 ${L2 - 14} 15 ${L2 - 2}H2Q5 ${L2 - 14} 4 ${n1(L2 * 0.5)}L5 26Z`;
  const fore = `<g transform="translate(0 ${L1})">`
    + boneForm(ulna, { ends: [[-15, -4, 7]], line: `M-5 30L-4 ${L2 - 10}`, lineW: 2, rim: lw('forearm') })
    + `<path d="M11.5 9.6A15 15 0 1 1 -10.6 -10.6" style="fill:none;stroke:${CART};stroke-width:3.6"/>`
    + boneForm(ra, { ends: [[8, 20, 4]], line: `M8 30L8 ${L2 - 10}`, lineW: 1.8, rim: lw('forearm') })
    + `<path d="M3 16H14" style="fill:none;stroke:${CART};stroke-width:3;stroke-linecap:round"/>`
    + `<path d="M12 26Q17 30 12 35" style="fill:${BONE};stroke:${BONE_D};stroke-width:1.6"/>`
    + `</g>`;
  s += `<g transform="rotate(${n1(deg)} ${E[0]} ${E[1]})">` + grp(o, 'forearm', fore) + `</g>`;
  // the elbow hinge: the cartilage where the trochlea turns in the notch
  s += grp(o, 'elbow', `<path d="M${n1(E[0] - 12)} ${n1(E[1] + 8)}A14 14 0 0 0 ${n1(E[0] + 12)} ${n1(E[1] + 8)}" style="fill:none;stroke:${CART};stroke-width:3;opacity:.95"/>`
    + `<circle cx="${E[0]}" cy="${E[1]}" r="5" style="fill:none;stroke:${BONE_D};stroke-width:1.4;opacity:.5"/>`);
  // biceps: origin at the shoulder, belly, a flat fibrous tendon crossing the front of the elbow to the radius below it
  const O = [12, -6], dx = I[0] - O[0], dy = I[1] - O[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = uy, ny = -ux;
  const sq = o.squeeze ?? 0, fb = 0.66 - sq * 0.24, B = [O[0] + dx * fb, O[1] + dy * fb], Lb = L * fb;
  const w = 19 * Math.sqrt(124 / Math.max(60, Lb)), bul = 9 + w * 0.5;
  const pts = [0, 0.25, 0.5, 0.75, 1].map((t) => [O[0] + dx * fb * t + nx * bul * Math.sin(Math.PI * t), O[1] + dy * fb * t + ny * bul * Math.sin(Math.PI * t)]);
  s += grp(o, 'biceps', muscleForm(pts, [4, w * 0.74, w, w * 0.74, 5], { rim: lw('biceps') }));
  const tl = o.lit?.('tendon');
  let tend;
  if (o.cut) {
    const a2 = [B[0] + ux * 14, B[1] + uy * 14], b1 = [I[0] - ux * 14, I[1] - uy * 14];
    tend = fibreBand(B, a2, 8, 7, TEND, TEND_D, { lit: tl }) + fibreBand(b1, I, 5.5, 4.5, TEND, TEND_D, { lit: tl, fan: true })
      + `<path d="M${n1(a2[0] + nx * 6)} ${n1(a2[1] + ny * 6)}l${n1(ux * 3)} ${n1(uy * 3)}l${n1(-nx * 4 + ux * -2)} ${n1(-ny * 4 + uy * -2)}l${n1(-nx * 4 + ux * 3)} ${n1(-ny * 4 + uy * 3)}l${n1(-nx * 4 - ux * 2)} ${n1(-ny * 4 - uy * 2)}" style="fill:none;stroke:${TEND_D};stroke-width:1.8;stroke-linejoin:round"/>`;
  } else tend = fibreBand(B, I, 8, 4.5, TEND, TEND_D, { lit: tl, fan: true, bow: 1.5 });
  s += grp(o, 'tendon', tend);
  // the hand, a fist round the bag's handle; the handle loop goes in under the curled fingers
  const G = F([3, L2 + 26]);
  let bagS = '';
  if (o.bag) {
    const bx = G[0], by = Math.min(G[1] + g.strap, g.floor - g.bagH);
    const hc = mx('series-1', INK, 40);
    bagS = schoolBag(bx, by, 76, g.bagH)
      + `<path d="M${n1(bx - 15)} ${n1(by + 4)}C${n1(bx - 16)} ${n1(G[1] - 12)} ${n1(bx + 16)} ${n1(G[1] - 12)} ${n1(bx + 15)} ${n1(by + 4)}" style="fill:none;stroke:${hc};stroke-width:5;stroke-linecap:round"/>`;
  }
  const HK = mx(SKIN, 'series-8', 86);
  const fist = `M-13 ${L2 - 2}C-17 ${L2 + 12} -17 ${L2 + 28} -11 ${L2 + 38}Q-2 ${L2 + 46} 9 ${L2 + 41}Q17 ${L2 + 36} 18 ${L2 + 24}C19 ${L2 + 12} 16 ${L2 + 4} 13 ${L2 - 2}Z`;
  const thumb = `M12 ${L2 + 4}C21 ${L2 + 10} 22 ${L2 + 24} 17 ${L2 + 32}Q12 ${L2 + 36} 8 ${L2 + 31}Q12 ${L2 + 22} 8 ${L2 + 10}Z`;
  let fingers = '';
  for (let i = 0; i < 3; i++) fingers += `<path d="M${n1(-12 + i * 1.5)} ${n1(L2 + 24 + i * 5)}Q${n1(-2)} ${n1(L2 + 30 + i * 5)} ${n1(8 - i)} ${n1(L2 + 26 + i * 5)}" style="fill:none;stroke:${SKIN_D};stroke-width:1.4;opacity:.55"/>`;
  const hand = `<g transform="rotate(${n1(deg)} ${E[0]} ${E[1]})"><g transform="translate(0 ${L1})">${form(fist, HK, { rim: 2.2, rimCol: SKIN_D, ao: 9, aoOp: 0.42 })}${fingers}`
    + `<path d="M-14 ${L2 + 8}Q-16 ${L2 + 22} -12 ${L2 + 34}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.4;stroke-linecap:round"/>`
    + form(thumb, HK, { rim: 2, rimCol: SKIN_D, ao: 6, aoOp: 0.4 }) + `<path d="M14 ${L2 + 28}Q17 ${L2 + 30} 15 ${L2 + 33}" style="fill:none;stroke:${SKIN_D};stroke-width:1.2;opacity:.6"/></g></g>`;
  // order: the bag hangs behind the fist; the forearm skin is already under the bones
  s += bagS + grp(o, 'skin', hand);
  return { svg: s, B, O, I, mid: pts[2], belly: Lb, G };
}

// ---------------------------------------------------------------- motion
/** A frame tween from -> to over ms (it always ends); set(v, k) draws. Reduced motion: the end at once. */
export function tweenTo(scene, from, to, ms, set) {
  cancelTween(scene);
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof requestAnimationFrame !== 'function') { set(to, 1); return; }
  const t0 = performance.now();
  scene._lkGo = true;
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
    set(from + (to - from) * e, k);
    if (k < 1 && scene.sv) scene._lkAf = requestAnimationFrame(tick);
    else { scene._lkAf = 0; scene._lkGo = false; }
  };
  scene._lkAf = requestAnimationFrame(tick);
}
export function cancelTween(scene) {
  if (scene._lkAf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(scene._lkAf);
  scene._lkAf = 0; scene._lkGo = false;
}
/** Redraw only the stage (the title row and its focused button stay). */
export function drawOnly(scene) {
  const sv = scene.sv;
  if (!sv) return;
  const out = scene.paint(sv) ?? {};
  sv.render(out.svg ?? '', out.over ?? '', backdropSvg(sv, { seed: 3 + scene.stepIndex, floorY: out.floor }));
}
