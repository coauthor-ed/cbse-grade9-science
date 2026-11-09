// CultureArt - plant tissue culture for the tissues module L09 and L10 (StewardCulture, CultureConditions,
// CultureStepsGame, CrownGall). SVG strings only, tokens only, no faces, no words. Every form has a lit side, a shade
// side and a rim; glass has a highlight and a rim; cells have a wall with thickness, grainy cytoplasm and a nucleus.
// Put cwDefs() (CellWorld) in the stage defs: cells use its gradients and blur.
//   carrot(x, y, len, deg, o)     a carrot root, crown at (x, y), pointing along deg (90 = down). o.tops (leaf stalks),
//                                 o.cut u 0..1 (cut across there: the far part slides away and shows its cut face)
//   carrotSection(x, y, r, o)     the cut face: skin, phloem (orange), cambium ring, xylem core. o.taken: a notch out of the phloem
//   piece(x, y, s, o)             a tiny phloem piece (a few cells), about 14 wide at s = 1
//   flask(x, y, h, o)             conical flask, foot centre at (x, y). o.level 0..1, o.medium (colour), o.solid (true: a jelly
//                                 slope), o.stir (swirl and a stir bar), o.inner (markup clipped to the liquid), o.plug
//   flaskBox(x, y, h, o)          { x0, x1, top, bot } of the liquid inside, for placing things in it
//   testTube(x, y, h, o)          upright tube with agar, foot at (x, y); o.inner (in the agar), o.above (above the agar)
//   cell(x, y, r, o)              one living plant cell; o.seed, o.rx/o.ry stretch, o.lit (thicker rim), o.mark (a gene mark)
//   cellMass(x, y, r, o)          packed alike cells in a round mass (o.shape 'embryo': a heart-shaped young plant); o.n
//   plantlet(x, y, h, o)          a small shoot with leaves and roots, foot (root-shoot join) at (x, y)
//   carrotPlant(x, y, h, o)       an adult flowering carrot: feathery leaves, flower umbels; foot at (x, y). o.root (orange root below)
//   deadVessel(x, y, h, o)        a dead xylem vessel piece: an empty tube with ring thickening
//   leafPiece(x, y, s, o)         a square of green leaf with veins
import { form, tube, n } from './BodyArt.js';
import { mx, T, rnd } from './CellWorld.js';

const INK = T('strata-6'), W_ = T('elev-peak');
export const CARROT = mx(mx('flame', 'gold', 50), 'elev-peak', 84);
export const CARROT_D = mx(CARROT, INK, 60);
export const XYLC = mx('gold', 'elev-peak', 52);
export const LEAFC = mx('elev-low', 'chloro', 50);
export const LEAFC_D = mx(LEAFC, INK, 60);
export const MEDIUM = mx('gold', 'elev-peak', 26);
export const AGAR = mx('gold', 'elev-peak', 34);
export const GLASS = mx('sea-shallow', 'elev-peak', 50);
export const CELL = mx('elev-peak', 'gold', 86);
export const WALL = mx('elev-low', 'strata-2', 46);
export const SOIL = mx('strata-4', 'strata-3', 60);
const P = (x, y) => `${n(x)} ${n(y)}`;
let U = 0;
const uid = (p) => `${p}${(U = (U + 1) % 100000)}`;

// ---------------------------------------------------------------- carrot
function carrotPath(len, w, seed) {
  const r = rnd(seed), L = [], R = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, half = w * (u < 0.08 ? 0.86 + u * 1.6 : Math.pow(1 - u, 0.8)) * (1 + (r() - 0.5) * 0.06);
    L.push([u * len, -half]); R.push([u * len, half]);
  }
  let d = `M${P(0, -w * 0.8)}`;
  for (const p of L) d += `L${P(...p)}`;
  d += `L${P(len + 6, 0)}`;
  for (const p of R.reverse()) d += `L${P(...p)}`;
  return d + 'Z';
}
/** Rings, rootlets and a lit edge on a carrot drawn along +x from 0 to len. */
function carrotSkin(len, w, seed) {
  const r = rnd(seed + 3);
  let s = '';
  for (let i = 1; i < 11; i++) {
    const u = 0.06 + i * 0.085, x = u * len, h = w * Math.pow(1 - u, 0.8) * 0.92;
    s += `<path d="M${P(x, -h)}Q${P(x + 3 + r() * 3, 0)} ${P(x + (r() - 0.5) * 3, h)}" style="fill:none;stroke:${CARROT_D};stroke-width:1.4;opacity:.45"/>`;
    if (i % 3 === 1) s += `<path d="M${P(x, h)}l${n(3 + r() * 5)} ${n(5 + r() * 6)}" style="fill:none;stroke:${mx(CARROT, 'elev-peak', 60)};stroke-width:1;stroke-linecap:round;opacity:.8"/>`;
  }
  return s + `<path d="M${P(len * 0.04, -w * 0.5)}Q${P(len * 0.4, -w * 0.6)} ${P(len * 0.86, -w * 0.12)}" style="fill:none;stroke:${W_};stroke-width:${n(w * 0.16)};stroke-linecap:round;opacity:.35"/>`;
}
export function carrot(x, y, len, deg = 90, o = {}) {
  const w = len * 0.13, seed = o.seed ?? 4;
  let tops = '';
  if (o.tops !== false) {
    // short green leaf stalks from the crown, cut neat
    for (let i = 0; i < 4; i++) {
      const a = (i - 1.5) * 0.28, l = len * (0.16 + (i % 2) * 0.05);
      tops += tube(`M${P(-2, (i - 1.5) * w * 0.4)}L${P(-l * Math.cos(a), (i - 1.5) * w * 0.4 - l * Math.sin(a))}`, LEAFC, w * 0.18);
    }
  }
  const body = carrotPath(len, w, seed);
  if (o.cut == null) {
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(deg)})">${tops}${form(body, CARROT, { ao: w * 0.5, rim: 1.8, hi: 46, inner: carrotSkin(len, w, seed) })}${form(`M${P(-2, -w * 0.82)}Q${P(-8, 0)} ${P(-2, w * 0.82)}Q${P(4, 0)} ${P(-2, -w * 0.82)}Z`, mx(CARROT, LEAFC, 60), { ao: 2, rim: 1.2 })}</g>`;
  }
  // cut across at u: the near part stays, the far part slides a little away; both show the cut face
  const cu = o.cut, cx = cu * len, gap = o.gap ?? 22, hw = w * Math.pow(1 - cu, 0.8);
  const id = uid('cc');
  let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(deg)})">${tops}`;
  s += `<clipPath id="${id}a"><rect x="-20" y="${n(-w * 2)}" width="${n(cx + 20)}" height="${n(w * 4)}"/></clipPath><clipPath id="${id}b"><rect x="${n(cx)}" y="${n(-w * 2)}" width="${n(len)}" height="${n(w * 4)}"/></clipPath>`;
  s += `<g clip-path="url(#${id}a)">${form(body, CARROT, { ao: w * 0.5, rim: 1.8, hi: 46, inner: carrotSkin(len, w, seed) })}</g>`;
  s += `<g transform="translate(${gap} 0)"><g clip-path="url(#${id}b)">${form(body, CARROT, { ao: w * 0.5, rim: 1.8, hi: 46, inner: carrotSkin(len, w, seed) })}</g>`;
  s += `<ellipse cx="${n(cx)}" cy="0" rx="${n(hw * 0.32)}" ry="${n(hw)}" style="fill:${mx(CARROT, 'elev-peak', 78)};stroke:${CARROT_D};stroke-width:1.4"/><ellipse cx="${n(cx)}" cy="0" rx="${n(hw * 0.16)}" ry="${n(hw * 0.5)}" style="fill:${XYLC}"/></g>`;
  s += `<ellipse cx="${n(cx)}" cy="0" rx="${n(hw * 0.32)}" ry="${n(hw)}" style="fill:${CARROT};stroke:${CARROT_D};stroke-width:1.4"/>`;
  return s + '</g>';
}
/** The cut face of the root, front on. */
export function carrotSection(x, y, r, o = {}) {
  const q = rnd(o.seed ?? 8);
  let s = `<ellipse cx="${n(x + 3)}" cy="${n(y + r * 0.14)}" rx="${n(r * 1.02)}" ry="${n(r * 1.02)}" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
  s += form(`M${P(x - r, y)}A${n(r)} ${n(r)} 0 1 0 ${P(x + r, y)}A${n(r)} ${n(r)} 0 1 0 ${P(x - r, y)}Z`, CARROT, { ao: r * 0.14, rim: 2, hi: 40 });
  // phloem band: fine radial cell rows
  let rays = '';
  for (let i = 0; i < 44; i++) { const a = (i / 44) * 6.283, r0 = r * 0.5, r1 = r * 0.9; rays += `M${P(x + Math.cos(a) * r0, y + Math.sin(a) * r0)}L${P(x + Math.cos(a) * r1, y + Math.sin(a) * r1)}`; }
  s += `<path d="${rays}" style="fill:none;stroke:${CARROT_D};stroke-width:1;opacity:.28"/>`;
  for (let i = 0; i < 70; i++) { const a = q() * 6.283, rr = r * (0.52 + q() * 0.38); s += `<circle cx="${n(x + Math.cos(a) * rr)}" cy="${n(y + Math.sin(a) * rr)}" r="${n(0.8 + q() * 1.3)}" style="fill:${mx(CARROT, 'elev-peak', 50)};opacity:.5"/>`; }
  // cambium ring and the paler xylem core with its rays
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.48)}" style="fill:${XYLC};stroke:${mx(CARROT, 'elev-peak', 40)};stroke-width:${n(Math.max(2, r * 0.04))}"/>`;
  let core = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283 + 0.2; core += `M${P(x, y)}L${P(x + Math.cos(a) * r * 0.44, y + Math.sin(a) * r * 0.44)}`; }
  s += `<path d="${core}" style="fill:none;stroke:${mx(XYLC, INK, 70)};stroke-width:1.2;opacity:.4"/>`;
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.96)}" style="fill:none;stroke:${CARROT_D};stroke-width:${n(Math.max(1.6, r * 0.04))};opacity:.7"/>`;
  if (o.taken) {
    // a notch out of the phloem, where the pieces came from
    const a = o.takenAt ?? -0.5, r0 = r * 0.58, r1 = r * 0.86, da = 0.22;
    const pt = (rr, aa) => P(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
    s += `<path d="M${pt(r0, a - da)}L${pt(r1, a - da)}A${n(r1)} ${n(r1)} 0 0 1 ${pt(r1, a + da)}L${pt(r0, a + da)}A${n(r0)} ${n(r0)} 0 0 0 ${pt(r0, a - da)}Z" style="fill:${mx(CARROT_D, INK, 50)};stroke:${CARROT_D};stroke-width:1.6"/>`;
  }
  if (o.lit) s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.7)}" style="fill:none;stroke:${INK};stroke-width:${n(r * 0.36)};opacity:.0"/>`;
  return s;
}
/** A tiny piece of phloem: a few orange cells stuck together. */
export function piece(x, y, s = 1, o = {}) {
  const q = rnd(o.seed ?? 2);
  let g = '';
  const pts = [[-4, -2], [3, -3], [-1, 3], [6, 3], [-6, 4], [1, -6]];
  for (const [px, py] of pts) {
    const rr = 3.4 + q() * 1.2;
    g += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(rr * 1.1)}" ry="${n(rr)}" style="fill:${mx(CARROT, 'elev-peak', 70)};stroke:${CARROT_D};stroke-width:1"/><circle cx="${n(px + 0.6)}" cy="${n(py + 0.4)}" r="1.1" style="fill:${mx('series-5', INK, 70)};opacity:.7"/>`;
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(o.rot ?? 0)}) scale(${n(s)})">${g}</g>`;
}

// ---------------------------------------------------------------- glass
function flaskPath(x, y, h) {
  const w = h * 0.42, nw = h * 0.11, nh = h * 0.3;
  return { d: `M${P(x - nw, y - h)}L${P(x - nw, y - h + nh)}L${P(x - w, y - h * 0.08)}Q${P(x - w - 2, y)} ${P(x - w + h * 0.08, y)}L${P(x + w - h * 0.08, y)}Q${P(x + w + 2, y)} ${P(x + w, y - h * 0.08)}L${P(x + nw, y - h + nh)}L${P(x + nw, y - h)}`, w, nw, nh };
}
export function flaskBox(x, y, h, o = {}) {
  const lv = o.level ?? 0.42, top = y - h * 0.08 - (h * 0.62) * lv, w = h * 0.42;
  const half = (yy) => { const u = (y - h * 0.08 - yy) / (h * 0.62); return w - (w - h * 0.11) * Math.max(0, Math.min(1, u)); };
  return { x0: x - half(top), x1: x + half(top), top, bot: y - 4, w, half };
}
export function flask(x, y, h, o = {}) {
  const { d, w, nw } = flaskPath(x, y, h), b = flaskBox(x, y, h, o), id = uid('fk');
  let s = `<ellipse cx="${n(x + 4)}" cy="${n(y + 2)}" rx="${n(w * 1.08)}" ry="${n(h * 0.05)}" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
  s += `<path d="${d}Z" style="fill:${GLASS};opacity:.32"/>`;
  // the liquid (or the jelly slope) clipped to the glass
  s += `<clipPath id="${id}"><path d="${d}Z"/></clipPath><g clip-path="url(#${id})">`;
  const med = o.medium ?? MEDIUM;
  if (o.solid) {
    // a firm jelly slab: flat glossy top with a lit front lip, set and translucent, faint refraction inside
    const tY = b.top, hw = b.half(tY), gid = uid('ag');
    s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(med, INK, 88)}"/><stop offset="0.25" style="stop-color:${med}"/><stop offset="1" style="stop-color:${mx(med, INK, 80)}"/></linearGradient></defs>`;
    s += `<rect x="${n(x - w - 4)}" y="${n(tY)}" width="${n(w * 2 + 8)}" height="${n(y - tY + 4)}" style="fill:url(#${gid});opacity:.95"/>`;
    s += `<ellipse cx="${n(x)}" cy="${n(tY)}" rx="${n(hw)}" ry="${n(Math.max(3, h * 0.025))}" style="fill:${mx(med, 'elev-peak', 50)};stroke:${mx(med, INK, 55)};stroke-width:1.2"/>`;
    s += `<ellipse cx="${n(x - hw * 0.3)}" cy="${n(tY - 0.5)}" rx="${n(hw * 0.42)}" ry="${n(Math.max(1.2, h * 0.008))}" style="fill:${W_};opacity:.85"/>`;
    s += `<path d="M${P(x - hw, tY + 2)}Q${P(x, tY + h * 0.05)} ${P(x + hw, tY + 2)}" style="fill:none;stroke:${W_};stroke-width:1.6;opacity:.5"/>`;
    for (let i = 0; i < 4; i++) { const yy = tY + (y - tY) * (0.3 + i * 0.17); s += `<path d="M${P(x - b.half(yy) * 0.8, yy)}q${n(b.half(yy) * 0.4)} ${n(-2)} ${n(b.half(yy) * 0.8)} 0" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.22"/>`; }
  }
  else {
    // a clear liquid: lighter near the top, a meniscus that climbs the glass, a bright surface line and suspended specks
    const hw = b.half(b.top), gid = uid('lq'), q = rnd(o.seed ?? 7);
    s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" style="stop-color:${mx(med, 'elev-peak', 55)};stop-opacity:.62"/><stop offset="1" style="stop-color:${med};stop-opacity:.9"/></linearGradient></defs>`;
    const top = `M${P(x - hw - 2, b.top - 5)}Q${P(x - hw + 6, b.top + 1.5)} ${P(x - hw * 0.6, b.top + 2)}L${P(x + hw * 0.6, b.top + 2)}Q${P(x + hw - 6, b.top + 1.5)} ${P(x + hw + 2, b.top - 5)}`;
    s += `<path d="${top}L${P(x + w + 4, y + 4)}L${P(x - w - 4, y + 4)}Z" style="fill:url(#${gid})"/>`;
    s += `<ellipse cx="${n(x)}" cy="${n(b.top + 3)}" rx="${n(hw * 0.92)}" ry="${n(Math.max(2.5, h * 0.018))}" style="fill:${W_};opacity:.28"/>`;
    s += `<path d="${top}" style="fill:none;stroke:${W_};stroke-width:2.2;opacity:.8"/><path d="M${P(x - hw * 0.6, b.top + 4)}H${n(x + hw * 0.6)}" style="fill:none;stroke:${mx(med, INK, 60)};stroke-width:1;opacity:.35"/>`;
    for (let i = 0; i < Math.round(10 + h * 0.06); i++) { const yy = b.top + 8 + q() * (y - b.top - 14), xx = x + (q() - 0.5) * 1.7 * b.half(yy); s += `<circle cx="${n(xx)}" cy="${n(yy)}" r="${n(0.8 + q() * 1.4)}" style="fill:${mx(med, INK, 45)};opacity:${n(0.25 + q() * 0.3)}"/>`; }
    if (o.stir) {
      s += `<rect x="${n(x - h * 0.09)}" y="${n(y - h * 0.05)}" width="${n(h * 0.18)}" height="${n(h * 0.035)}" rx="${n(h * 0.017)}" style="fill:${mx('elev-peak', 'strata-5', 70)};stroke:${INK};stroke-width:1"/>`;
      for (const k of [0, 1]) { const ry = b.top + (y - b.top) * (0.36 + k * 0.28), rx = b.half(ry) * 0.62; s += `<path d="M${P(x - rx, ry)}A${n(rx)} ${n(rx * 0.22)} 0 0 0 ${P(x + rx, ry)}" style="fill:none;stroke:${mx(med, INK, 60)};stroke-width:1.8;stroke-dasharray:3 7;stroke-linecap:round;opacity:.45"/><path d="M${P(x + rx - 7, ry - 3.5)}L${P(x + rx, ry)}L${P(x + rx - 8, ry + 3.5)}" style="fill:none;stroke:${mx(med, INK, 60)};stroke-width:1.8;stroke-linecap:round;opacity:.45"/>`; }
    }
  }
  s += (o.inner ?? '') + '</g>';
  // glass rim, highlight, plug
  s += `<path d="${d}" style="fill:none;stroke:${mx(GLASS, INK, 56)};stroke-width:2.6;stroke-linejoin:round"/>`;
  s += `<path d="M${P(x - nw + 3, y - h + 8)}L${P(x - nw + 3, y - h * 0.68)}L${P(x - w + 10, y - h * 0.12)}" style="fill:none;stroke:${W_};stroke-width:3;stroke-linecap:round;opacity:.7"/>`;
  s += `<ellipse cx="${n(x)}" cy="${n(y - h)}" rx="${n(nw + 3)}" ry="3" style="fill:none;stroke:${mx(GLASS, INK, 56)};stroke-width:2.4"/>`;
  if (o.plug !== false) s += form(`M${P(x - nw + 1, y - h + 10)}Q${P(x - nw - 4, y - h - 10)} ${P(x, y - h - 14)}Q${P(x + nw + 4, y - h - 10)} ${P(x + nw - 1, y - h + 10)}Z`, mx('elev-peak', 'strata-1', 80), { ao: 4, rim: 1.4, hi: 30 });
  return s;
}
export function testTube(x, y, h, o = {}) {
  const w = h * 0.13, id = uid('tt'), d = `M${P(x - w, y - h)}L${P(x - w, y - w)}A${n(w)} ${n(w)} 0 0 0 ${P(x + w, y - w)}L${P(x + w, y - h)}`;
  const at = y - h * (o.agar ?? 0.42);
  let s = `<ellipse cx="${n(x + 3)}" cy="${n(y + 2)}" rx="${n(w * 1.4)}" ry="4" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  s += `<path d="${d}Z" style="fill:${GLASS};opacity:.3"/><clipPath id="${id}"><path d="${d}Z"/></clipPath><g clip-path="url(#${id})"><rect x="${n(x - w)}" y="${n(at)}" width="${n(w * 2)}" height="${n(y - at)}" style="fill:${AGAR}"/><path d="M${P(x - w, at)}Q${P(x, at - 4)} ${P(x + w, at)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.7"/>${o.inner ?? ''}</g>`;
  s += o.above ?? '';
  s += `<path d="${d}" style="fill:none;stroke:${mx(GLASS, INK, 56)};stroke-width:2.4"/><path d="M${P(x - w + 4, y - h + 10)}V${n(y - w)}" style="fill:none;stroke:${W_};stroke-width:2.6;stroke-linecap:round;opacity:.65"/>`;
  s += form(`M${P(x - w + 1, y - h + 12)}Q${P(x - w - 3, y - h - 8)} ${P(x, y - h - 12)}Q${P(x + w + 3, y - h - 8)} ${P(x + w - 1, y - h + 12)}Z`, mx('elev-peak', 'strata-1', 80), { ao: 3, rim: 1.2, hi: 30 });
  return s;
}

// ---------------------------------------------------------------- cells
// Plant cells are drawn from a power diagram: each cell is the region nearer its own site (weighted by its size), so
// neighbours share walls, sizes vary and the outlines are irregular, as in a real callus. Unseen "ghost" sites round the
// outside close the edge cells. Each cell: a wall with thickness and a light rim, cream cytoplasm with grain, a large
// clear vacuole that pushes the nucleus to one side; a dividing cell shows two nuclei and a new wall (o.div).
const VAC = mx('elev-peak', 'gold', 92);
function clipHalf(poly, ax, ay, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = ax * p[0] + ay * p[1] - c, fq = ax * q[0] + ay * q[1] - c;
    if (fp <= 0) out.push(p);
    if ((fp <= 0) !== (fq <= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
function powerCells(sites) {
  const out = [];
  sites.forEach((si, i) => {
    if (si.ghost) return;
    const R = si.r * 4;
    let poly = [[si.x - R, si.y - R], [si.x + R, si.y - R], [si.x + R, si.y + R], [si.x - R, si.y + R]];
    sites.forEach((sj, j) => {
      if (i === j || Math.hypot(sj.x - si.x, sj.y - si.y) > (si.r + sj.r) * 3.2 || poly.length < 3) return;
      const ax = sj.x - si.x, ay = sj.y - si.y, c = (sj.x * sj.x + sj.y * sj.y - si.x * si.x - si.y * si.y - sj.r * sj.r + si.r * si.r) / 2;
      poly = clipHalf(poly, ax, ay, c);
    });
    if (poly.length >= 3) out.push({ poly, site: si });
  });
  return out;
}
const smooth = (pts) => {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${P(...mid(pts[pts.length - 1], pts[0]))}`;
  pts.forEach((p, i) => { d += `Q${P(...p)} ${P(...mid(p, pts[(i + 1) % pts.length]))}`; });
  return d + 'Z';
};
function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], f = p[0] * q[1] - q[0] * p[1]; a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; });
  a /= 2;
  return Math.abs(a) < 1e-6 ? [poly[0][0], poly[0][1], 1] : [cx / (6 * a), cy / (6 * a), Math.abs(a)];
}
/** One plant cell from its outline polygon. o.col, o.div ('plate' | 'meta'), o.lit, o.mark, o.gap, q (rng). */
function drawCell(poly, q, o = {}) {
  const [cx, cy, area] = centroid(poly), r = Math.sqrt(area / Math.PI), gap = o.gap ?? Math.max(0.5, r * 0.045);
  const sh = poly.map(([x, y]) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, k = Math.max(0.2, (l - gap) / l); return [cx + dx * k, cy + dy * k]; });
  const d = smooth(sh), wallW = Math.max(1.4, r * 0.16), a = q() * 6.283, ux = Math.cos(a), uy = Math.sin(a);
  let inner = '';
  // cytoplasm grain
  for (let i = 0; i < Math.round(5 + r * 0.5); i++) inner += `<circle cx="${n(cx + (q() - 0.5) * r * 1.7)}" cy="${n(cy + (q() - 0.5) * r * 1.7)}" r="${n(0.5 + q() * r * 0.045)}" style="fill:${mx('gold', INK, 56)};opacity:.32"/>`;
  const nuc = (x, y, nr) => `<circle cx="${n(x + nr * 0.12)}" cy="${n(y + nr * 0.2)}" r="${n(nr * 1.05)}" style="fill:${INK};opacity:.16"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(nr)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 60)};stroke-width:${n(Math.max(0.7, nr * 0.12))}"/><circle cx="${n(x + nr * 0.22)}" cy="${n(y + nr * 0.12)}" r="${n(nr * 0.32)}" style="fill:url(#cw-nucleolus) ${T('series-5')}"/><circle cx="${n(x - nr * 0.35)}" cy="${n(y - nr * 0.38)}" r="${n(nr * 0.22)}" style="fill:${W_};opacity:.55"/>`;
  const vac = (fx, fy, k) => { const v = sh.map(([x, y]) => [fx + (x - fx) * k, fy + (y - fy) * k]); return `<path d="${smooth(v)}" style="fill:${VAC};opacity:.7;stroke:${mx(CELL, INK, 62)};stroke-width:${n(Math.max(0.5, r * 0.025))};stroke-opacity:.45"/><path d="${smooth(v.map(([x, y]) => [x + (fx - x) * 0.18 - r * 0.04, y + (fy - y) * 0.18 - r * 0.06]))}" style="fill:none;stroke:${W_};stroke-width:${n(Math.max(0.6, r * 0.05))};opacity:.35"/>`; };
  const nr = r * (0.2 + q() * 0.06);
  if (o.div === 'plate') {
    // just divided: a new thin wall across the middle, a nucleus each side
    const px = -uy, py = ux;
    inner += vac(cx - ux * r * 0.05 + px * r * 0.3, cy - uy * r * 0.05 + py * r * 0.3, 0.32) + vac(cx - ux * r * 0.05 - px * r * 0.3, cy - uy * r * 0.05 - py * r * 0.3, 0.3);
    inner += `<path d="M${P(cx + ux * r * 1.4, cy + uy * r * 1.4)}L${P(cx - ux * r * 1.4, cy - uy * r * 1.4)}" style="fill:none;stroke:${WALL};stroke-width:${n(wallW * 0.7)}"/><path d="M${P(cx + ux * r * 1.4 - r * 0.05, cy + uy * r * 1.4 - r * 0.07)}L${P(cx - ux * r * 1.4 - r * 0.05, cy - uy * r * 1.4 - r * 0.07)}" style="fill:none;stroke:${W_};stroke-width:${n(wallW * 0.25)};opacity:.6"/>`;
    inner += nuc(cx + px * r * 0.42 + ux * r * 0.12, cy + py * r * 0.42 + uy * r * 0.12, nr * 0.82) + nuc(cx - px * r * 0.42 - ux * r * 0.1, cy - py * r * 0.42 - uy * r * 0.1, nr * 0.82);
  } else if (o.div === 'meta') {
    // dividing now: chromosomes lined up across the middle, pulled apart along the spindle
    inner += vac(cx + ux * r * 0.55, cy + uy * r * 0.55, 0.22) + vac(cx - ux * r * 0.55, cy - uy * r * 0.55, 0.22);
    let ch = '', sp = '';
    for (let i = -2; i <= 2; i++) {
      const bx = cx - uy * i * r * 0.13, by = cy + ux * i * r * 0.13;
      ch += `M${P(bx - ux * r * 0.12 + (q() - 0.5) * r * 0.06, by - uy * r * 0.12)}L${P(bx + ux * r * 0.12, by + uy * r * 0.12 + (q() - 0.5) * r * 0.06)}`;
      sp += `M${P(cx + ux * r * 0.62, cy + uy * r * 0.62)}L${P(bx, by)}L${P(cx - ux * r * 0.62, cy - uy * r * 0.62)}`;
    }
    inner += `<path d="${sp}" style="fill:none;stroke:${mx('series-5', 'elev-peak', 40)};stroke-width:${n(Math.max(0.5, r * 0.025))};opacity:.6"/><path d="${ch}" style="fill:none;stroke:${mx('series-5', INK, 72)};stroke-width:${n(Math.max(1.4, r * 0.09))};stroke-linecap:round"/>`;
  } else {
    // a resting cell: the big vacuole fills most of it and holds the nucleus against the wall
    inner += vac(cx - ux * r * 0.18, cy - uy * r * 0.18, o.vac ?? 0.58);
    const nx = cx + ux * r * 0.56, ny = cy + uy * r * 0.56;
    inner += nuc(nx, ny, nr);
    if (o.mark) inner += `<path d="M${P(nx - nr * 0.7, ny - nr * 0.1)}q${n(nr * 0.35)} ${n(-nr * 0.5)} ${n(nr * 0.7)} 0t${n(nr * 0.7)} 0" style="fill:none;stroke:${o.mark};stroke-width:${n(Math.max(2, nr * 0.34))};stroke-linecap:round"/>`;
  }
  // a light rim inside the wall on the lit (upper left) side
  inner += `<path d="${d}" style="fill:none;stroke:${W_};stroke-width:${n(Math.max(0.8, r * 0.07))};opacity:.55;transform:translate(${n(r * 0.06)}px,${n(r * 0.09)}px)"/>`;
  return form(d, o.col ?? CELL, { ao: Math.max(2, r * 0.32), aoOp: 0.4, rim: o.lit ? Math.max(2.8, wallW) : wallW, rimCol: o.lit ? INK : WALL, hi: 26, lo: 30, inner });
}
/** Draw a group of cells from their sites [{ x, y, r, ghost, div }]; o passes col, mark, lit, gap. */
export function cellGroup(sites, o = {}) {
  const q = rnd(o.seed ?? 3), cells = powerCells(sites).sort((a, b) => a.site.y - b.site.y);
  return cells.map(({ poly, site }) => drawCell(poly, q, { ...o, div: site.div ?? o.div, mark: site.mark ?? o.mark })).join('');
}
const ring = (x, y, rx, ry, cnt, r, q, jit = 0.1) => Array.from({ length: cnt }, (_, i) => { const a = (i / cnt) * 6.283 + q() * 0.2; return { x: x + Math.cos(a) * rx * (1 + (q() - 0.5) * jit), y: y + Math.sin(a) * ry * (1 + (q() - 0.5) * jit), r, ghost: true }; });
/** One living plant cell, irregular, with a wall, vacuole and nucleus; o.seed, o.rx/o.ry stretch, o.lit, o.mark, o.div, o.col. */
export function cell(x, y, r, o = {}) {
  const q = rnd(o.seed ?? 1), rx = o.rx ?? 1, ry = o.ry ?? 1;
  return cellGroup([{ x, y, r }, ...ring(x, y, r * 2 * rx, r * 2 * ry, 9, r * (0.9 + q() * 0.2), q, 0.18)], { ...o, seed: (o.seed ?? 1) + 50 });
}
/** Two or four cells just made by division, sharing their new walls, in an outline the size of the first cell. */
export function cellSplit(x, y, r, k, o = {}) {
  const q = rnd(o.seed ?? 2), cr = k === 2 ? r * 0.7 : r * 0.52, pts = k === 2 ? [[-0.55, 0.05], [0.55, -0.05]] : [[-0.5, -0.48], [0.52, -0.45], [-0.48, 0.5], [0.5, 0.47]];
  const sites = pts.map(([u, v]) => ({ x: x + u * cr * 1.15, y: y + v * cr * 1.15, r: cr * (0.92 + q() * 0.16) }));
  return cellGroup([...sites, ...ring(x, y, r * 1.95, r * 1.75, 12, r * 0.95, q, 0.08)], { ...o, seed: (o.seed ?? 2) + 9 });
}
/** Mixed-size plant cells loosely packed in a lumpy callus mass or (o.shape 'embryo') a heart-shaped young plant.
 *  o.cr mean cell radius, o.div fraction of cells dividing, o.n max cells, o.col, o.mark, o.tight (no air gaps) */
export function cellMass(x, y, R, o = {}) {
  const q = rnd(o.seed ?? 3), cr = o.cr ?? R * 0.16;
  const lump = Array.from({ length: 7 }, () => q() * 6.283);
  const inside = o.shape === 'embryo'
    ? (px, py) => { const u = (px - x) / R, v = (py - y) / R; const body = (u * u) / 0.3 + ((v - 0.25) * (v - 0.25)) / 0.62 < 1; const lobeL = ((u + 0.42) ** 2) / 0.14 + ((v + 0.52) ** 2) / 0.22 < 1; const lobeR = ((u - 0.42) ** 2) / 0.14 + ((v + 0.52) ** 2) / 0.22 < 1; return body || lobeL || lobeR; }
    : (px, py) => { const a = Math.atan2(py - y, px - x), rr = R * (1 + 0.09 * Math.sin(a * 3 + lump[0]) + 0.06 * Math.sin(a * 5 + lump[1]) + 0.04 * Math.sin(a * 8 + lump[2])); return ((px - x) ** 2 + ((py - y) / 0.88) ** 2) < rr * rr; };
  const real = [], cand = [];
  for (let row = -40; row <= 40; row++) for (let col = -40; col <= 40; col++) {
    const px = x + (col + (row % 2 ? 0.5 : 0)) * cr * 1.8 + (q() - 0.5) * cr * 0.9, py = y + row * cr * 1.56 + (q() - 0.5) * cr * 0.9;
    if (Math.abs(px - x) > R * 1.4 || Math.abs(py - y) > R * 1.4) continue;
    const size = cr * (0.7 + q() * 0.65);
    if (inside(px, py) && real.length < (o.n ?? 500)) real.push({ x: px, y: py, r: size });
    else cand.push({ x: px, y: py, r: cr, ghost: true });
  }
  const ghosts = cand.filter((g) => real.some((s) => Math.hypot(s.x - g.x, s.y - g.y) < cr * 3.2));
  const dv = o.div ?? 0;
  real.forEach((s) => { const v = q(); if (v < dv * 0.6) s.div = 'plate'; else if (v < dv) s.div = 'meta'; });
  let sh = `<ellipse cx="${n(x + 4)}" cy="${n(y + R * 0.92)}" rx="${n(R * 0.9)}" ry="${n(R * 0.14)}" style="fill:${INK};opacity:.16;filter:url(#cw-blur3)"/>`;
  return sh + cellGroup([...real, ...ghosts], { col: o.col, mark: o.mark, seed: (o.seed ?? 3) + 1, gap: o.tight ? 0.4 : undefined });
}

/** A callus seen with the eye: a cream-white lump with a rough, knobbly surface. rx, ry half sizes; o.seed, o.col. */
export function callus(x, y, rx, ry, o = {}) {
  const q = rnd(o.seed ?? 6), col = o.col ?? mx(CELL, 'gold', 92);
  // outline: many small bumps on a rounded body, flatter underneath
  const N = 30, pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.283, under = Math.sin(a) > 0.55, k = under ? 0.97 : 1 + (q() - 0.4) * 0.16;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k * (under ? 0.9 : 1)]);
  }
  let d = `M${P(...pts[0])}`;
  for (let i = 0; i < N; i++) { const p = pts[i], c = pts[(i + 1) % N], m = [(p[0] + c[0]) / 2, (p[1] + c[1]) / 2], dx = m[0] - x, dy = m[1] - y, l = Math.hypot(dx, dy) || 1, bump = Math.sin(Math.atan2(dy, dx)) > 0.55 ? 0.3 : 1.6 + q() * 1.6; d += `Q${P(m[0] + dx / l * bump, m[1] + dy / l * bump)} ${P(...c)}`; }
  d += 'Z';
  let inner = '';
  // knobs on the surface, each lit from the top left, smaller towards the edge
  for (let i = 0; i < Math.round(14 + rx * 0.5); i++) {
    const a = q() * 6.283, rr = Math.sqrt(q()) * 0.86, kx = x + Math.cos(a) * rx * rr, ky = y + Math.sin(a) * ry * rr, kr = Math.max(2, rx * (0.09 + q() * 0.08) * (1.1 - rr * 0.5));
    inner += `<circle cx="${n(kx + kr * 0.25)}" cy="${n(ky + kr * 0.3)}" r="${n(kr)}" style="fill:${mx(col, INK, 80)};opacity:.3"/><circle cx="${n(kx)}" cy="${n(ky)}" r="${n(kr * 0.9)}" style="fill:${mx(col, 'gold', 94)}"/><circle cx="${n(kx - kr * 0.3)}" cy="${n(ky - kr * 0.32)}" r="${n(kr * 0.36)}" style="fill:${W_};opacity:.32"/>`;
  }
  for (let i = 0; i < Math.round(20 + rx); i++) inner += `<circle cx="${n(x + (q() - 0.5) * rx * 1.9)}" cy="${n(y + (q() - 0.5) * ry * 1.9)}" r="${n(0.6 + q() * 0.9)}" style="fill:${mx(col, INK, 60)};opacity:.35"/>`;
  return `<ellipse cx="${n(x + 3)}" cy="${n(y + ry * 0.92)}" rx="${n(rx * 0.95)}" ry="${n(ry * 0.22)}" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>` + form(d, col, { ao: Math.max(4, rx * 0.22), rim: 1.8, rimCol: mx(col, INK, 58), hi: 40, lo: 40, inner });
}

// ---------------------------------------------------------------- plants
export function plantlet(x, y, h, o = {}) {
  const q = rnd(o.seed ?? 5);
  let s = '';
  // roots down from the foot
  let rd = '';
  for (let i = 0; i < 5; i++) { const a = 1.2 + (i - 2) * 0.32, l = h * (0.3 + q() * 0.2); rd += `M${P(x, y)}Q${P(x + Math.cos(a) * l * 0.3, y + l * 0.5)} ${P(x + Math.cos(a) * l * 0.7, y + Math.sin(a) * l)}`; }
  s += `<path d="${rd}" style="fill:none;stroke:${mx('strata-1', 'elev-peak', 50)};stroke-width:${n(Math.max(1.4, h * 0.03))};stroke-linecap:round"/><path d="${rd}" style="fill:none;stroke:${mx('strata-2', INK, 80)};stroke-width:.8;opacity:.4"/>`;
  // shoot with paired leaves
  s += tube(`M${P(x, y)}Q${P(x + h * 0.04, y - h * 0.4)} ${P(x, y - h * 0.62)}`, LEAFC, Math.max(2, h * 0.045));
  for (let i = 0; i < (o.leaves ?? 3); i++) {
    const yy = y - h * (0.22 + i * 0.16), l = h * (0.3 - i * 0.04), sx = i % 2 ? 1 : -1;
    const tip = [x + sx * l, yy - l * 0.5];
    s += form(`M${P(x, yy)}Q${P(x + sx * l * 0.4, yy - l * 0.6)} ${P(...tip)}Q${P(x + sx * l * 0.7, yy + l * 0.05)} ${P(x, yy)}Z`, LEAFC, { ao: 3, rim: 1.3, hi: 50, inner: `<path d="M${P(x, yy)}L${P(...tip)}" style="fill:none;stroke:${LEAFC_D};stroke-width:1;opacity:.5"/>` });
  }
  return s;
}
/** A feathery carrot leaf, base at (x, y), along angle a (radians), length l. */
function carrotLeaf(x, y, a, l, q) {
  const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l;
  let s = `<path d="M${P(x, y)}Q${P(x + Math.cos(a) * l * 0.5 - Math.sin(a) * l * 0.08, y + Math.sin(a) * l * 0.5)} ${P(ex, ey)}" style="fill:none;stroke:${LEAFC_D};stroke-width:2.2;stroke-linecap:round"/>`;
  for (let i = 1; i <= 7; i++) {
    const u = i / 8, px = x + (ex - x) * u, py = y + (ey - y) * u, ll = l * 0.22 * (1 - u * 0.6);
    for (const sx of [-1, 1]) {
      const b = a + sx * 1.0, bx = px + Math.cos(b) * ll, by = py + Math.sin(b) * ll;
      s += `<path d="M${P(px, py)}L${P(bx, by)}" style="fill:none;stroke:${LEAFC_D};stroke-width:1.2"/>`;
      for (let j = 0; j < 3; j++) { const v = (j + 1) / 4, fx = px + (bx - px) * v, fy = py + (by - py) * v; s += `<ellipse cx="${n(fx)}" cy="${n(fy)}" rx="${n(ll * 0.2)}" ry="${n(ll * 0.08)}" transform="rotate(${n(((b + sx * 0.6) * 180) / Math.PI)} ${n(fx)} ${n(fy)})" style="fill:${j % 2 ? LEAFC : mx(LEAFC, 'elev-peak', 76)}"/>`; }
    }
  }
  return s;
}
function umbel(x, y, r, q) {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.1 + 0.8 * i / 8), ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r * 0.5 - r * 0.2;
    s += `<path d="M${P(x, y)}L${P(ex, ey)}" style="fill:none;stroke:${LEAFC_D};stroke-width:1.1"/>`;
    for (let j = 0; j < 5; j++) s += `<circle cx="${n(ex + (q() - 0.5) * r * 0.36)}" cy="${n(ey - q() * r * 0.2)}" r="${n(1.6 + q() * 1.4)}" style="fill:${W_};stroke:${mx('strata-2', INK, 60)};stroke-width:.6"/>`;
  }
  return s;
}
export function carrotPlant(x, y, h, o = {}) {
  const q = rnd(o.seed ?? 11);
  let s = '';
  if (o.root) s += carrot(x, y + 2, h * 0.34, 90, { tops: false, seed: 6 });
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.26 + (q() - 0.5) * 0.1; s += carrotLeaf(x, y - 2, a, h * (0.34 + q() * 0.12), q); }
  if (o.flowers !== false) {
    const tops = [[0, 1], [-0.18, 0.82], [0.2, 0.86]];
    for (const [dx, k] of tops) {
      const tx = x + dx * h, ty = y - h * k;
      s += tube(`M${P(x, y - 4)}Q${P(x + dx * h * 0.3, y - h * k * 0.6)} ${P(tx, ty)}`, mx(LEAFC, 'elev-peak', 80), 2.6);
      s += umbel(tx, ty, h * 0.15 * (0.7 + k * 0.3), q);
    }
  }
  return s;
}
export function deadVessel(x, y, h, o = {}) {
  const w = h * 0.3;
  let s = `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="3" style="fill:${mx('strata-1', 'elev-peak', 50)};stroke:${mx('strata-3', INK, 60)};stroke-width:2"/>`;
  s += `<rect x="${n(x - w / 2 + 4)}" y="${n(y - h / 2)}" width="${n(w - 8)}" height="${n(h)}" style="fill:${mx('strata-1', 'strata-3', 70)};opacity:.5"/>`;
  for (let yy = y - h / 2 + 5; yy < y + h / 2; yy += 7) s += `<path d="M${P(x - w / 2 + 1, yy)}Q${P(x, yy + 3)} ${P(x + w / 2 - 1, yy)}" style="fill:none;stroke:${mx('strata-3', INK, 60)};stroke-width:2.2"/>`;
  return s;
}
export function leafPiece(x, y, s = 1, o = {}) {
  const w = 30 * s, d = `M${P(x - w / 2, y - w / 2 + 3)}L${P(x + w / 2 - 2, y - w / 2)}L${P(x + w / 2, y + w / 2 - 2)}L${P(x - w / 2 + 2, y + w / 2)}Z`;
  return form(d, LEAFC, { ao: 4, rim: 1.6, hi: 50, inner: `<path d="M${P(x - w / 2, y + w * 0.1)}L${P(x + w / 2, y - w * 0.1)}M${P(x - w * 0.1, y)}l${n(w * 0.2)} ${n(-w * 0.4)}M${P(x + w * 0.12, y - w * 0.04)}l${n(w * 0.1)} ${n(w * 0.4)}" style="fill:none;stroke:${LEAFC_D};stroke-width:1.4;opacity:.6"/>` });
}
