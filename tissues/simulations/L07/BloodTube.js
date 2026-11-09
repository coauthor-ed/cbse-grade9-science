// BloodTube - blk-l07-n02 (5 beats: parts, cut, infection, run, sum). Fig 3.12a: a test tube of blood that has
// settled: plasma (the liquid part) 55 per cent above, formed elements 45 per cent below (band heights 55:45), with a
// close-up of red blood cells (discs), white blood cells (lobed nucleus) and platelets. Cut: a section of skin with a
// small cut; blood oozes, platelets gather and a clot forms. Infection: the patch turns red and swells, white blood
// cells leave the vessel and gather at the germs, a little pus. Run: lungs, heart and a leg muscle; At rest / Running
// changes how fast you breathe and how much blood flows to the muscle. Sum: the three cases with the part of blood at work.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapMin, TAP_MIN_CSS } from '../shared/TapMin.js';
import { flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, field, tube, form, travel, pop } from '../shared/BodyArt.js';
import { INK, W_, SKIN_D, MUS, MUS_D } from '../shared/LimbArt.js';
import { lungsSvg, heartSvg } from '../shared/OrganArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const RED = mx('series-6', 'strata-6', 80), RED_D = mx('series-6', 'strata-6', 48), RED_L = mx('series-6', 'elev-peak', 60);
const PLA = mx('gold', 'elev-peak', 44), PLA_D = mx('series-2', 'strata-6', 56);
const WBC = mx('series-5', 'elev-peak', 26), WBC_N = mx('series-5', 'strata-6', 66), PLT = mx('series-5', 'series-6', 50);
const PUS = mx('series-2', 'elev-peak', 58), GERM = mx('series-3', 'strata-6', 70);
const DERM = mx('series-4', 'elev-peak', 34), DERM_D = mx('series-4', 'strata-6', 50), EPI = mx('series-8', 'elev-peak', 34), FAT = mx('series-2', 'elev-peak', 30);

// -- cells ----------------------------------------------------------------------------------------------
const h3 = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
/** A red blood cell face on (or tilted: t < 1 squashes it): a disc, darker thick rim, pale thin centre. */
const rbc = (x, y, r, a = 0, t = 0.92) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})"><ellipse rx="${n1(r)}" ry="${n1(r * t)}" style="fill:${RED};stroke:${RED_D};stroke-width:${n1(Math.max(0.9, r * 0.1))}"/><ellipse cx="${n1(r * 0.06)}" cy="${n1(r * 0.06 * t)}" rx="${n1(r * 0.5)}" ry="${n1(r * 0.5 * t)}" style="fill:${RED_L};opacity:.75"/><path d="M${n1(-r * 0.7)} ${n1(-r * 0.3 * t)}A${n1(r * 0.8)} ${n1(r * 0.8 * t)} 0 0 1 ${n1(r * 0.2)} ${n1(-r * 0.78 * t)}" style="fill:none;stroke:${RED_L};stroke-width:${n1(r * 0.12)};opacity:.5;stroke-linecap:round"/></g>`;
/** A red blood cell seen edge on: a flat disc, thick at the rim, a shallow waist in the middle. */
const rbcSide = (x, y, r, a = 0) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})"><path d="M${n1(-r)} 0C${n1(-r)} ${n1(-r * 0.42)} ${n1(-r * 0.5)} ${n1(-r * 0.4)} 0 ${n1(-r * 0.3)}C${n1(r * 0.5)} ${n1(-r * 0.4)} ${n1(r)} ${n1(-r * 0.42)} ${n1(r)} 0C${n1(r)} ${n1(r * 0.42)} ${n1(r * 0.5)} ${n1(r * 0.4)} 0 ${n1(r * 0.3)}C${n1(-r * 0.5)} ${n1(r * 0.4)} ${n1(-r)} ${n1(r * 0.42)} ${n1(-r)} 0Z" style="fill:${RED};stroke:${RED_D};stroke-width:1.1"/><path d="M${n1(-r * 0.7)} ${n1(-r * 0.16)}Q0 ${n1(-r * 0.22)} ${n1(r * 0.7)} ${n1(-r * 0.16)}" style="fill:none;stroke:${RED_L};stroke-width:${n1(r * 0.12)};opacity:.6"/></g>`;
const wbc = (x, y, r) => `<g><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:${WBC};stroke:${mx('series-5', INK, 50)};stroke-width:${n1(Math.max(1.2, r * 0.08))}"/>`
  + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:${INK};opacity:.08;filter:url(#cw-grain)"/>`
  + [[-0.36, -0.12], [0.06, -0.32], [0.34, 0.12], [-0.04, 0.3]].map(([a, b], i) => `<circle cx="${n1(x + a * r)}" cy="${n1(y + b * r)}" r="${n1(r * (i === 3 ? 0.22 : 0.27))}" style="fill:${WBC_N}"/>`).join('')
  + `<path d="M${n1(x - r * 0.36)} ${n1(y - r * 0.12)}L${n1(x + r * 0.06)} ${n1(y - r * 0.32)}L${n1(x + r * 0.34)} ${n1(y + r * 0.12)}" style="fill:none;stroke:${WBC_N};stroke-width:${n1(r * 0.14)}"/>`
  + `<circle cx="${n1(x - r * 0.4)}" cy="${n1(y - r * 0.45)}" r="${n1(r * 0.16)}" style="fill:${W_};opacity:.6"/></g>`;
const plt = (x, y, r, a = 0) => `<path transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})" d="M${n1(-r)} 0Q${n1(-r * 0.6)} ${n1(-r * 0.9)} ${n1(r * 0.2)} ${n1(-r * 0.7)}Q${n1(r * 1.1)} ${n1(-r * 0.3)} ${n1(r * 0.8)} ${n1(r * 0.5)}Q${n1(0)} ${n1(r * 0.9)} ${n1(-r)} 0Z" style="fill:${PLT};stroke:${mx(PLT, INK, 50)};stroke-width:1.2"/>`;
const germ = (x, y, a = 0) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})"><rect x="-8" y="-3.6" width="16" height="7.2" rx="3.6" style="fill:${GERM};stroke:${mx(GERM, INK, 50)};stroke-width:1.2"/><rect x="-5" y="-2" width="7" height="1.6" rx=".8" style="fill:${W_};opacity:.5"/></g>`;

// -- the test tube on a lab bench --------------------------------------------------------------------------
function testTube(cx, top, h, w) {
  const r = w / 2, bot = top + h, col = top + h * 0.16, colH = bot - col;   // blood column from col to bot (round bottom included)
  const pY = col + colH * 0.55, bY = pY + colH * 0.015;
  const inner = `M${n1(cx - r + 4)} ${n1(col)}V${n1(bot - r)}A${n1(r - 4)} ${n1(r - 4)} 0 0 0 ${n1(cx + r - 4)} ${n1(bot - r)}V${n1(col)}Z`;
  const id = 'bt-tube';
  let s = `<clipPath id="${id}"><path d="${inner}"/></clipPath><g clip-path="url(#${id})">`;
  s += `<rect x="${n1(cx - r)}" y="${n1(col)}" width="${n1(w)}" height="${n1(pY - col)}" style="fill:${PLA}"/><rect x="${n1(cx - r)}" y="${n1(col)}" width="${n1(w * 0.4)}" height="${n1(pY - col)}" style="fill:${W_};opacity:.25"/>`;
  s += `<rect x="${n1(cx - r)}" y="${n1(pY)}" width="${n1(w)}" height="${n1(bY - pY + 1)}" style="fill:${mx(WBC, 'elev-peak', 50)}"/>`;
  s += `<rect x="${n1(cx - r)}" y="${n1(bY)}" width="${n1(w)}" height="${n1(bot - bY + 2)}" style="fill:${RED}"/><rect x="${n1(cx - r)}" y="${n1(bY)}" width="${n1(w)}" height="${n1(bot - bY + 2)}" style="fill:${INK};opacity:.12;filter:url(#cw-grain)"/>`;
  s += `<rect x="${n1(cx + r * 0.2)}" y="${n1(bY)}" width="${n1(r * 0.8)}" height="${n1(bot - bY)}" style="fill:${INK};opacity:.18"/></g>`;
  s += `<path d="${inner}" style="fill:none;stroke:${PLA_D};stroke-width:1.4;opacity:.5"/>`;
  // glass: rim, wall, highlights
  const glass = `M${n1(cx - r)} ${n1(top)}V${n1(bot - r)}A${n1(r)} ${n1(r)} 0 0 0 ${n1(cx + r)} ${n1(bot - r)}V${n1(top)}`;
  s += `<path d="${glass}" style="fill:none;stroke:${mx('series-1', INK, 40)};stroke-width:3.2"/><path d="M${n1(cx - r * 0.62)} ${n1(top + 14)}V${n1(bot - r - 6)}" style="fill:none;stroke:${W_};stroke-width:4;opacity:.75;stroke-linecap:round"/>`;
  s += `<ellipse cx="${n1(cx)}" cy="${n1(top)}" rx="${n1(r + 5)}" ry="5" style="fill:${mx('series-1', 'elev-peak', 30)};stroke:${mx('series-1', INK, 40)};stroke-width:2.4"/>`;
  return { s, col, pY, bot };
}
// The close-up of formed elements in plasma.
function lens(cx, cy, R) {
  const q = rnd(5);
  let b = `<rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" style="fill:${mx(PLA, 'elev-peak', 70)}"/>`;
  const spots = [];
  for (let i = 0; i < 26; i++) spots.push([cx + (q() - 0.5) * 2 * R, cy + (q() - 0.5) * 2 * R, q() * 360]);
  spots.forEach(([x, y, a], i) => { b += i % 5 === 4 ? rbcSide(x, y, R * 0.13, a) : rbc(x, y, R * 0.13, a); });
  b += wbc(cx - R * 0.18, cy + R * 0.12, R * 0.24);
  for (const [x, y] of [[0.42, -0.4], [0.5, 0.3], [-0.5, -0.42], [0.1, 0.62]]) b += plt(cx + x * R, cy + y * R, R * 0.09, x * 200);
  return `<clipPath id="bt-lens"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${R + 9}" style="fill:${mx('strata-6', 'sea-deep', 70)}"/><g clip-path="url(#bt-lens)">${b}<circle cx="${cx}" cy="${cy}" r="${R}" style="fill:url(#cw-vign);opacity:.5"/></g><circle cx="${cx}" cy="${cy}" r="${R + 3}" style="fill:none;stroke:${mx('strata-5', W_, 60)};stroke-width:3;opacity:.7"/>`;
}
// -- a block of skin in section: epidermis (flat cells on top, rete ridges below), dermis with collagen bundles, a
// curved blood vessel cut lengthwise (outer coat, muscle, lining, cells), a hair follicle and a sweat gland; fat below
function skinBlock(x, y, w, h, o = {}) {
  const ey = y + h * 0.17, dy = y + h * 0.76, vr = h * 0.075, q = rnd(o.seed ?? 3);
  const cx = x + w * (o.at ?? 0.5), sw = o.swell ?? 0, uid = `bt${o.seed ?? 3}`;
  const vyAt = (xx) => y + h * 0.52 + Math.sin(((xx - x) / w) * Math.PI * 1.4 + 0.5) * h * 0.06;
  const surfY = (xx) => (sw ? y - sw * Math.exp(-(((xx - cx) / (w * 0.13)) ** 2)) : y);
  let surf = `M${x} ${n1(surfY(x))}`;
  for (let xx = x + 6; xx <= x + w; xx += 6) surf += `L${n1(xx)} ${n1(surfY(xx))}`;
  const junc = (xx) => ey + Math.sin((xx - x) / 11) * 5 + (sw ? -sw * 0.6 * Math.exp(-(((xx - cx) / (w * 0.13)) ** 2)) : 0);
  let jd = `M${x} ${n1(junc(x))}`;
  for (let xx = x + 4; xx <= x + w; xx += 4) jd += `L${n1(xx)} ${n1(junc(xx))}`;
  let s = `<path d="${surf}V${n1(y + h)}H${x}Z" style="fill:${DERM}"/>`;
  // fat: pale yellow cells packed as irregular polygons, thin rims, a few flat nuclei
  const fid = `${uid}-fat`, R = 15;
  let fat = `<rect x="${x}" y="${n1(dy)}" width="${w}" height="${n1(y + h - dy)}" style="fill:${mx(FAT, INK, 80)}"/>`;
  const jit = (vx, vy) => [vx + (h3(vx, vy) - 0.5) * 7, vy + (h3(vy, vx) - 0.5) * 7];
  for (let r = 0, cyy = dy + 6; cyy < y + h + R; r++, cyy += R * 1.5) {
    for (let cxx = x - R + (r % 2) * R * 0.866; cxx < x + w + R; cxx += R * 1.732) {
      const pts = [0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 6 + (i * Math.PI) / 3; return jit(Math.round((cxx + Math.cos(a) * R) * 10) / 10, Math.round((cyy + Math.sin(a) * R) * 10) / 10); });
      fat += `<path d="M${pts.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z" style="fill:${FAT};stroke:${mx(FAT, INK, 62)};stroke-width:1.3;stroke-linejoin:round"/>`;
      fat += `<ellipse cx="${n1(cxx - R * 0.3)}" cy="${n1(cyy - R * 0.25)}" rx="${n1(R * 0.42)}" ry="${n1(R * 0.3)}" style="fill:${W_};opacity:.35"/>`;
      if (q() < 0.25) fat += `<ellipse cx="${n1(cxx + R * 0.55)}" cy="${n1(cyy + R * 0.35)}" rx="3.4" ry="1.4" style="fill:${mx('series-5', INK, 60)}"/>`;
    }
  }
  s += `<defs><clipPath id="${fid}"><rect x="${x}" y="${n1(dy)}" width="${w}" height="${n1(y + h - dy)}"/></clipPath></defs><g clip-path="url(#${fid})">${fat}</g>`;
  s += `<path d="M${x} ${n1(dy)}H${x + w}" style="fill:none;stroke:${DERM_D};stroke-width:1.4;opacity:.4"/>`;
  // dermis: wavy collagen bundles in two directions, fibroblast nuclei
  for (let i = 0; i < 34; i++) {
    const fx = x - 20 + q() * (w + 20), fy = ey + 12 + q() * (dy - ey - 18), L2 = 30 + q() * 50, a = (q() - 0.5) * 0.7;
    const ex = fx + Math.cos(a) * L2, eyy = fy + Math.sin(a) * L2;
    s += `<path d="M${n1(fx)} ${n1(fy)}Q${n1((fx + ex) / 2)} ${n1((fy + eyy) / 2 - 6 + q() * 12)} ${n1(ex)} ${n1(eyy)}" style="fill:none;stroke:${DERM_D};stroke-width:${n1(2.4 + q() * 2.6)};opacity:.2;stroke-linecap:round"/>`;
  }
  for (let i = 0; i < 18; i++) s += `<ellipse cx="0" cy="0" rx="3.6" ry="1.4" transform="translate(${n1(x + q() * w)} ${n1(ey + 16 + q() * (dy - ey - 26))}) rotate(${n1((q() - 0.5) * 40)})" style="fill:${mx('series-5', INK, 60)};opacity:.7"/>`;
  if (o.red) s += `<ellipse cx="${n1(cx)}" cy="${n1(ey + 26)}" rx="${n1(w * 0.24)}" ry="${n1(h * 0.3)}" style="fill:${mx('series-6', 'elev-peak', 40)};opacity:.55;filter:url(#cw-blur3)"/>`;
  // epidermis: basal row of upright cells on the wavy junction, rounder cells above, flat cells at the top
  const eid = `${uid}-epi`;
  s += `<defs><clipPath id="${eid}"><path d="${surf}L${x + w} ${n1(junc(x + w))}${jd.replace(/^M[^L]+/, '').split('L').reverse().filter(Boolean).map((p) => `L${p}`).join('')}Z"/></clipPath></defs>`;
  let epi = `<rect x="${x}" y="${n1(y - sw - 4)}" width="${w}" height="${n1(ey - y + sw + 14)}" style="fill:${EPI}"/>`;
  for (let xx = x + 2; xx < x + w; xx += 7) { const jy = junc(xx); epi += `<rect x="${n1(xx - 3)}" y="${n1(jy - 13)}" width="6" height="13" rx="2.6" style="fill:${mx(EPI, 'series-4', 80)};stroke:${mx(EPI, INK, 62)};stroke-width:.8"/><ellipse cx="${n1(xx)}" cy="${n1(jy - 6)}" rx="2" ry="3" style="fill:${mx('series-5', INK, 64)}"/>`; }
  for (let xx = x + 4, i = 0; xx < x + w; xx += 12, i++) { const top = surfY(xx), jy = junc(xx), mid = top + (jy - 13 - top) * 0.6; epi += `<path d="M${n1(xx - 6)} ${n1(mid - 5)}l6 -3l6 3v6l-6 3l-6 -3Z" style="fill:${mx(EPI, 'elev-peak', 80)};stroke:${mx(EPI, INK, 66)};stroke-width:.8"/><circle cx="${n1(xx)}" cy="${n1(mid - 2)}" r="1.4" style="fill:${mx('series-5', INK, 64)};opacity:.8"/>`; }
  for (let xx = x, i = 0; xx < x + w; xx += 16, i++) { const top = surfY(xx + 8); epi += `<path d="M${n1(xx)} ${n1(top + 3 + (i % 2))}Q${n1(xx + 8)} ${n1(top + 1)} ${n1(xx + 16)} ${n1(top + 3 + ((i + 1) % 2))}" style="fill:none;stroke:${mx(EPI, INK, 60)};stroke-width:1.1;opacity:.7"/>`; }
  s += `<g clip-path="url(#${eid})">${epi}</g><path d="${jd}" style="fill:none;stroke:${mx(EPI, INK, 56)};stroke-width:1.4;opacity:.7"/><path d="${surf}" style="fill:none;stroke:${SKIN_D};stroke-width:2.6"/>`;
  // a hair: follicle sheath down into the dermis ending in a bulb round its papilla; the shaft out through the surface
  const hx = x + w * 0.13, fb = ey + (dy - ey) * 0.36, HC = mx('strata-6', 'series-8', 80);
  s += `<path d="M${n1(hx - 8)} ${n1(y + 2)}C${n1(hx - 10)} ${n1(fb - 40)} ${n1(hx - 16)} ${n1(fb - 8)} ${n1(hx - 12)} ${n1(fb + 4)}Q${n1(hx)} ${n1(fb + 18)} ${n1(hx + 12)} ${n1(fb + 4)}C${n1(hx + 16)} ${n1(fb - 8)} ${n1(hx + 10)} ${n1(fb - 40)} ${n1(hx + 8)} ${n1(y + 2)}Z" style="fill:${mx(EPI, DERM, 60)};stroke:${mx(EPI, INK, 60)};stroke-width:1.6"/>`
    + `<path d="M${n1(hx - 6)} ${n1(fb + 8)}Q${n1(hx)} ${n1(fb - 4)} ${n1(hx + 6)} ${n1(fb + 8)}" style="fill:${DERM};stroke:${mx(EPI, INK, 60)};stroke-width:1.2"/>`
    + `<path d="M${n1(hx)} ${n1(fb - 2)}C${n1(hx + 1)} ${n1(fb - 50)} ${n1(hx - 1)} ${n1(y + 10)} ${n1(hx + 4)} ${n1(y - 34)}" style="fill:none;stroke:${HC};stroke-width:3.6;stroke-linecap:round"/>`
    + `<path d="M${n1(hx + 8)} ${n1(ey + 10)}c10 -2 14 8 8 14c-6 4 -12 0 -10 -6" style="fill:${mx('series-2', 'elev-peak', 50)};stroke:${mx('series-2', INK, 50)};stroke-width:1.2"/>`;
  // a coiled sweat gland with its duct
  const gx = x + w * 0.88, gb = ey + (dy - ey) * 0.78, GC = mx('series-3', INK, 50);
  s += `<path d="M${n1(gx)} ${n1(y + 2)}C${n1(gx + 6)} ${n1(y + 30)} ${n1(gx - 6)} ${n1(gb - 30)} ${n1(gx)} ${n1(gb - 14)}" style="fill:none;stroke:${GC};stroke-width:4"/><path d="M${n1(gx - 12)} ${n1(gb - 8)}c6 -10 18 -10 22 0s-6 12 -14 8s-6 -12 4 -14s16 6 10 14" style="fill:none;stroke:${GC};stroke-width:5;stroke-linecap:round"/><path d="M${n1(gx - 12)} ${n1(gb - 8)}c6 -10 18 -10 22 0s-6 12 -14 8s-6 -12 4 -14s16 6 10 14" style="fill:none;stroke:${mx('series-3', 'elev-peak', 40)};stroke-width:2;stroke-linecap:round"/>`;
  // the vessel, a curved tube cut lengthwise: outer coat, muscle layer (ring marks), lining with flat nuclei, lumen
  let vd = `M${x - 10} ${n1(vyAt(x - 10))}`;
  for (let xx = x; xx <= x + w + 10; xx += 10) vd += `L${n1(xx)} ${n1(vyAt(xx))}`;
  const vw = vr * 0.42, VW = mx('series-6', 'series-4', 60), gap = o.gap;
  const vseg = (st) => `<path d="${vd}" style="${st}"/>`;
  let ves = vseg(`fill:none;stroke:${mx(VW, INK, 60)};stroke-width:${n1(2 * (vr + vw) + 3)}`) + vseg(`fill:none;stroke:${mx(VW, DERM, 60)};stroke-width:${n1(2 * (vr + vw))}`)
    + vseg(`fill:none;stroke:${VW};stroke-width:${n1(2 * (vr + vw * 0.7))}`) + vseg(`fill:none;stroke:${mx(VW, INK, 66)};stroke-width:${n1(2 * (vr + vw * 0.7))};stroke-dasharray:1.6 4;opacity:.45`)
    + vseg(`fill:none;stroke:${mx('series-6', 'elev-peak', 26)};stroke-width:${n1(2 * vr + 3)}`) + vseg(`fill:none;stroke:${mx(PLA, 'series-6', 70)};stroke-width:${n1(2 * vr)}`);
  for (let xx = x + 12; xx < x + w; xx += 34) ves += `<ellipse cx="${n1(xx)}" cy="${n1(vyAt(xx) - vr - 0.5)}" rx="6" ry="1.6" style="fill:${mx('series-5', INK, 60)}"/><ellipse cx="${n1(xx + 17)}" cy="${n1(vyAt(xx + 17) + vr + 0.5)}" rx="6" ry="1.6" style="fill:${mx('series-5', INK, 60)}"/>`;
  for (let xx = x + 8, i = 0; xx < x + w - 4; xx += 15 + q() * 8, i++) {
    if (gap && Math.abs(xx - gap) < 22) continue;
    const yy = vyAt(xx) + (q() - 0.5) * vr * 0.9;
    ves += i % 4 === 3 ? rbcSide(xx, yy, vr * 0.5, (q() - 0.5) * 60) : rbc(xx, yy, vr * 0.5, q() * 180, 0.55 + q() * 0.4);
  }
  s += ves;
  return { s, vy: vyAt(cx), vr, vw, ey, cx, top: surfY(cx), vyAt, junc, dy };
}

export class BloodTube extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 640;
  static HEIGHT = 510;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 560;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A test tube of blood that has settled: pale yellow plasma, the liquid part, fills the top 55 per cent; the formed elements, red, fill the bottom 45 per cent. A close-up shows red blood cells as discs, a white blood cell with a lobed nucleus, and small platelets. A small cut in the skin: blood oozes, platelets gather and a clot forms. A skin infection: the patch turns red and swells, white blood cells gather at the germs and a little pus forms. A run: breathing gets faster and more blood flows to the leg muscles.';
  static CONTROLS = [];

  pace = 'run';
  async setup() { await super.setup(); tapMin(this); bindFlow(this.root, { action: (a, v) => this._act(a, v) }); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 52px; display: flex; justify-content: center; align-items: center; }' + BODY_CSS + TAP_MIN_CSS
    + ' svg .bt-in { animation: bt-in .7s ease-out both; animation-delay: var(--d, 0s); } @keyframes bt-in { from { opacity: 0; } }'
    + ' svg .bt-lung { transform-box: fill-box; transform-origin: 50% 20%; animation: bt-lung var(--p, 4s) ease-in-out infinite; } @keyframes bt-lung { 50% { transform: scale(1.08, 1.1); } }'
    + ' svg .bt-hrt { transform-box: fill-box; transform-origin: center; animation: bt-hrt var(--p, 1s) ease-in-out infinite; } @keyframes bt-hrt { 14% { transform: scale(.93); } 30% { transform: none; } }'
    + ' svg .bt-flow { offset-rotate: 0deg; animation: bt-flow var(--p, 3s) linear infinite; animation-delay: var(--d, 0s); } @keyframes bt-flow { from { offset-distance: 0%; } to { offset-distance: 100%; } }'; }
  stageHeight(st) { return st.portrait ? 470 : 430; }
  enter() { this.pace = 'run'; }
  _act(a, v) { if (a === 'pace' && this.stepIndex === 3) { this.pace = v === 'rest' ? 'rest' : 'run'; this.repaint(); } }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    let s = '', head = '';
    const L = (t, at, x, y, o = {}) => `<g class="bt-in" style="--d:${o.d ?? 0}s">${leader(x, y, at[0], at[1], o.col ?? INK, 2.4)}${tag(x, y, t, { size: fs, rim: o.rim, anchor: o.anchor, display: o.display })}</g>`;
    if (step === 0) {
      s += field(st, 'bt', { a: 1, b: 7, k: 8 });
      const by = H - (P ? 40 : 46);
      s += `<rect x="0" y="${n1(by)}" width="${W}" height="${n1(H - by)}" style="fill:${mx('strata-6', 'series-1', 40)}"/><path d="M0 ${n1(by)}H${W}" style="fill:none;stroke:${mx('series-1', 'elev-peak', 40)};stroke-width:3"/>`;
      const cx = P ? 96 : 150, top = P ? 34 : 40, h = by - top - 34, w = P ? 54 : 70;
      // a stand: base, rod and a clamp holding the tube near its rim
      const rx = cx - w / 2 - (P ? 34 : 48), SC = mx('strata-6', 'series-1', 70);
      s += form(`M${n1(rx - 30)} ${n1(by - 12)}h${P ? 90 : 120}v12h-${P ? 90 : 120}Z`, SC, { rim: 2 }) + `<rect x="${n1(rx - 4)}" y="${n1(top - 10)}" width="8" height="${n1(by - top)}" rx="3" style="fill:${mx(SC, 'elev-peak', 70)};stroke:${SC};stroke-width:1.6"/>`;
      const t = testTube(cx, top, h - 10, w);
      s += t.s + `<rect x="${n1(rx)}" y="${n1(top + 30)}" width="${n1(cx - rx - w / 2 + 2)}" height="10" rx="3" style="fill:${mx(SC, 'elev-peak', 60)};stroke:${SC};stroke-width:1.6"/><rect x="${n1(cx - w / 2 - 6)}" y="${n1(top + 22)}" width="${n1(w + 12)}" height="26" rx="6" style="fill:${mx(SC, 'elev-peak', 50)};opacity:.9;stroke:${SC};stroke-width:2"/>`;
      // brackets 55 / 45
      const bx = cx + w / 2 + 12, br = (y0, y1) => `<path d="M${bx} ${n1(y0 + 2)}h8V${n1(y1 - 2)}h-8" style="fill:none;stroke:${INK};stroke-width:2.6"/>`;
      s += br(t.col, t.pY) + br(t.pY, t.bot);
      s += tag(bx + 14, (t.col + t.pY) / 2 - 14, 'plasma', { size: fs + 1, display: true, anchor: 'start', rim: PLA_D }) + tag(bx + 14, (t.col + t.pY) / 2 + 18, '55 per cent', { size: fs, anchor: 'start' });
      s += tag(bx + 14, (t.pY + t.bot) / 2 - 14, 'formed elements', { size: fs + 1, display: true, anchor: 'start', rim: RED_D }) + tag(bx + 14, (t.pY + t.bot) / 2 + 18, '45 per cent', { size: fs, anchor: 'start' });
      // the close-up
      const R = P ? 62 : 96, lx = P ? W - R - 12 : W - R - 30, ly = P ? R + 14 : 30 + R;
      s += lens(lx, ly, R);
      s += L('RBCs', [lx + R * 0.32, ly - R * 0.62], lx - R - (P ? 8 : 10), ly - R + (P ? 18 : 6), { anchor: 'end', rim: RED_D });
      s += L('WBC', [lx - R * 0.18, ly + R * 0.12], lx - R - (P ? 8 : 10), ly + (P ? 16 : 10), { anchor: 'end', rim: WBC_N });
      s += L('platelets', [lx + R * 0.1, ly + R * 0.62], lx + (P ? 0 : 20), ly + R + (P ? 26 : 28), { rim: PLT });
    } else if (step === 1 || step === 2) {
      s += field(st, 'bt', { a: 4, b: 2, k: 8 });
      const x = P ? 8 : 30, y = P ? 140 : 120, w = W - (P ? 16 : 60), h = H - y - (P ? 30 : 30);
      const inf = step === 2, sk = skinBlock(x, y, w, h, { at: 0.5, swell: inf ? (P ? 20 : 28) : 0, red: inf, seed: inf ? 5 : 3, gap: inf ? null : x + w * 0.5 });
      s += sk.s;
      const cx = sk.cx;
      if (!inf) {
        // the cut: a ragged gap through the epidermis and dermis down to the vessel; the vessel wall broken at its floor;
        // blood fills the gap and beads on the surface; platelets clump at the break; fibrin threads catch red cells
        const vt = sk.vyAt(cx) - sk.vr - sk.vw, q2 = rnd(21), le = [], ri = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8, yy = y + (vt - y) * t; le.push([cx - 30 + 22 * t + (i && i < 8 ? (q2() - 0.5) * 7 : 0), yy]); ri.push([cx + 32 - 24 * t + (i && i < 8 ? (q2() - 0.5) * 7 : 0), yy]); }
        const pp = (a2) => a2.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L');
        const wound = `M${pp(le)}L${pp(ri.slice().reverse())}Z`;
        s += `<defs><linearGradient id="bt-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${RED}"/><stop offset="1" style="stop-color:${RED_D}"/></linearGradient></defs>`;
        s += `<path d="M${n1(cx - 9)} ${n1(vt - 2)}h18v${n1(sk.vw * 2 + 4)}h-18Z" style="fill:${RED}"/>`;
        s += `<path d="${wound}" style="fill:url(#bt-wg)"/><path d="M${pp(le)}M${pp(ri)}" style="fill:none;stroke:${mx(DERM_D, INK, 70)};stroke-width:2.2;stroke-linejoin:round"/>`;
        for (let i = 0; i < 9; i++) s += rbc(cx - 14 + q2() * 28, y + 10 + q2() * (vt - y - 20), 5.5, q2() * 180, 0.6 + q2() * 0.35);
        const bead = `M${n1(cx - 44)} ${n1(y + 1)}C${n1(cx - 40)} ${n1(y - 18)} ${n1(cx - 22)} ${n1(y - 30)} ${n1(cx - 2)} ${n1(y - 30)}C${n1(cx + 18)} ${n1(y - 31)} ${n1(cx + 40)} ${n1(y - 20)} ${n1(cx + 46)} ${n1(y + 1)}Q${n1(cx)} ${n1(y + 6)} ${n1(cx - 44)} ${n1(y + 1)}Z`;
        s += pop(form(bead, RED, { rim: 2, rimCol: RED_D, ao: 8, aoOp: 0.4 }) + `<path d="M${n1(cx - 26)} ${n1(y - 16)}Q${n1(cx - 14)} ${n1(y - 26)} ${n1(cx + 4)} ${n1(y - 25)}" style="fill:none;stroke:${RED_L};stroke-width:3.4;opacity:.7;stroke-linecap:round"/>`);
        for (let i = 0; i < 7; i++) s += travel(plt(0, 0, 5, i * 50), `M${n1(x + 10 + i * 24)} ${n1(sk.vyAt(x + 10 + i * 24))}L${n1(cx - 16 + (i % 4) * 10)} ${n1(vt + 4 - (i % 3) * 6)}`, { t: 1.8, d: 0.3 + i * 0.12 });
        let mesh = '';
        for (let i = 0; i < 16; i++) { const y0 = y - 20 + q2() * (vt - y + 14), y1 = y0 + (q2() - 0.5) * 40; mesh += `<path d="M${n1(cx - 34 + q2() * 10)} ${n1(y0)}Q${n1(cx)} ${n1((y0 + y1) / 2 + (q2() - 0.5) * 12)} ${n1(cx + 26 + q2() * 10)} ${n1(y1)}" style="fill:none;stroke:${mx('series-2', 'elev-peak', 40)};stroke-width:1.4;opacity:.9"/>`; }
        for (let i = 0; i < 10; i++) mesh += plt(cx - 22 + q2() * 44, i < 6 ? vt - 4 + q2() * 8 : y + q2() * (vt - y), 4.2, q2() * 180);
        mesh += rbc(cx - 14, y - 12, 7, 20, 0.7) + rbc(cx + 12, y - 8, 7, -30, 0.8) + rbc(cx - 2, y + 18, 6, 60, 0.6);
        s += `<g class="bt-in" style="--d:2.6s">${mesh}</g>`;
        s += L('platelets gather', [cx - 12, sk.vyAt(cx) - sk.vr - sk.vw - 2], P ? 8 : 30, P ? 40 : 40, { anchor: 'start', rim: PLT, d: 1.2 });
        s += L('a clot forms', [cx + 8, y - 18], P ? W - 8 : W - 30, P ? 84 : 40, { anchor: 'end', rim: RED_D, d: 2.8 });
        s += L('RBCs: red haemoglobin, iron-rich', [x + w * 0.8, sk.vyAt(x + w * 0.8)], P ? W - 8 : W - 30, H - (P ? 46 : 54), { anchor: 'end', rim: RED_D, size: 14 });
        s += tag(P ? 8 : 30, H - (P ? 90 : 54), 'RBCs live about 4 months', { size: 14, anchor: 'start' });
      } else {
        // germs in the dermis under the swelling; white blood cells squeeze out through the vessel wall and gather round
        // them; a small yellow pocket of pus under the surface
        const gy = sk.ey + 22, q = rnd(11), vt = (xx) => sk.vyAt(xx) - sk.vr - sk.vw;
        s += `<path d="M${n1(cx - 34)} ${n1(sk.ey + 4)}C${n1(cx - 30)} ${n1(sk.ey - 12)} ${n1(cx + 26)} ${n1(sk.ey - 14)} ${n1(cx + 34)} ${n1(sk.ey + 2)}C${n1(cx + 30)} ${n1(sk.ey + 16)} ${n1(cx - 28)} ${n1(sk.ey + 18)} ${n1(cx - 34)} ${n1(sk.ey + 4)}Z" class="bt-in" style="--d:1.6s;fill:${PUS};stroke:${mx(PUS, INK, 60)};stroke-width:1.8"/>`;
        for (let i = 0; i < 9; i++) s += germ(cx - 40 + q() * 80, gy + q() * 34, q() * 180);
        // two rolling along the wall inside, two half way through the wall
        const wr = P ? 10 : 12;
        s += wbc(cx - w * 0.3, sk.vyAt(cx - w * 0.3) - sk.vr * 0.4, wr * 0.8) + wbc(cx + w * 0.26, sk.vyAt(cx + w * 0.26) - sk.vr * 0.35, wr * 0.8);
        for (const xx of [cx - w * 0.14, cx + w * 0.1]) {
          const ty = vt(xx);
          s += `<g><circle cx="${n1(xx)}" cy="${n1(ty + wr * 0.5)}" r="${n1(wr * 0.62)}" style="fill:${WBC};stroke:${mx('series-5', INK, 50)};stroke-width:1.4"/><rect x="${n1(xx - wr * 0.3)}" y="${n1(ty - wr * 0.6)}" width="${n1(wr * 0.6)}" height="${n1(wr * 1.4)}" style="fill:${WBC}"/>`
            + `<circle cx="${n1(xx)}" cy="${n1(ty - wr * 0.9)}" r="${n1(wr * 0.85)}" style="fill:${WBC};stroke:${mx('series-5', INK, 50)};stroke-width:1.4"/><circle cx="${n1(xx - wr * 0.25)}" cy="${n1(ty - wr)}" r="${n1(wr * 0.26)}" style="fill:${WBC_N}"/><circle cx="${n1(xx + wr * 0.25)}" cy="${n1(ty - wr * 1.05)}" r="${n1(wr * 0.24)}" style="fill:${WBC_N}"/><circle cx="${n1(xx)}" cy="${n1(ty + wr * 0.45)}" r="${n1(wr * 0.2)}" style="fill:${WBC_N}"/></g>`;
          s += `<path d="M${n1(xx)} ${n1(ty - wr * 2)}Q${n1(xx + (cx - xx) * 0.3)} ${n1(gy + 50)} ${n1(cx + (xx - cx) * 0.4)} ${n1(gy + 40)}" style="fill:none;stroke:${WBC_N};stroke-width:2.2;stroke-dasharray:5 5;opacity:.6"/>`;
        }
        const gather = [[-46, 14], [-24, 40], [4, 46], [30, 36], [48, 10], [-8, 4]];
        gather.forEach(([dx, dy2], i) => { s += `<g class="bt-in" style="--d:${n1(0.4 + i * 0.25)}s">${wbc(cx + dx, gy + dy2, wr)}</g>`; });
        s += L('white blood cells gather', [cx + 30, gy + 36], P ? W - 8 : W - 30, P ? 90 : 96, { anchor: 'end', rim: WBC_N });
        s += L('red, swollen', [cx - 70, sk.top + 14], P ? 8 : 30, P ? 40 : 46, { anchor: 'start', rim: RED_D });
        s += L('a little pus', [cx - 14, sk.ey + 2], P ? 8 : 30, P ? 90 : 96, { anchor: 'start', rim: mx(PUS, INK, 60), d: 1.6 });
        s += L('germs', [cx + 20, gy + 18], P ? W - 8 : W - 30, P ? 40 : 46, { anchor: 'end', rim: GERM });
      }
    } else if (step === 3) {
      s += field(st, 'bt', { a: 1, b: 6, k: 9 });
      const fast = this.pace === 'run', bp = fast ? 1.6 : 4.2, hp = fast ? 0.5 : 1.1, fp = fast ? 1.4 : 4;
      // the chest: both lungs (they swell with each breath) and the heart between them (it beats); the thigh muscle
      // with its artery branching into a net of capillaries: they widen and carry more cells when running
      const lx = P ? W * 0.5 : W * 0.27, ly = P ? 44 : 66, k = P ? 0.78 : 1.12;
      s += `<g class="bt-lung" style="--p:${bp}s">${lungsSvg(lx, ly, k)}</g>`;
      s += `<g class="bt-hrt" style="--p:${hp}s">${heartSvg(lx + 16 * k, ly + 184 * k, k * 0.74)}</g>`;
      s += tag(lx, ly - 30 * k + (P ? 0 : 0) < 18 ? 22 : ly - 30 * k, fast ? 'faster breathing' : 'slow breathing', { size: fs, rim: mx('series-1', INK, 50) });
      const mx0 = P ? 24 : W * 0.56, my0 = P ? 286 : 64, mw = P ? W - 48 : W * 0.38, mh = P ? 118 : 300;
      const bx0 = mx0 + mw / 2, belly = P ? `M${n1(mx0)} ${n1(my0 + mh * 0.5)}C${n1(mx0 + mw * 0.2)} ${n1(my0 - mh * 0.04)} ${n1(mx0 + mw * 0.8)} ${n1(my0 - mh * 0.02)} ${n1(mx0 + mw)} ${n1(my0 + mh * 0.5)}C${n1(mx0 + mw * 0.8)} ${n1(my0 + mh * 1.02)} ${n1(mx0 + mw * 0.2)} ${n1(my0 + mh * 1.04)} ${n1(mx0)} ${n1(my0 + mh * 0.5)}Z`
        : `M${n1(bx0 - 6)} ${n1(my0)}C${n1(bx0 + mw * 0.5)} ${n1(my0 + mh * 0.2)} ${n1(bx0 + mw * 0.44)} ${n1(my0 + mh * 0.7)} ${n1(bx0 + 8)} ${n1(my0 + mh)}C${n1(bx0 - mw * 0.42)} ${n1(my0 + mh * 0.72)} ${n1(bx0 - mw * 0.5)} ${n1(my0 + mh * 0.22)} ${n1(bx0 - 6)} ${n1(my0)}Z`;
      const tnd = mx('series-5', 'elev-peak', 16);
      s += P ? '' : `<path d="M${n1(bx0 - 6)} ${n1(my0 - 30)}L${n1(bx0 - 6)} ${n1(my0 + 30)}M${n1(bx0 + 8)} ${n1(my0 + mh - 30)}L${n1(bx0 + 8)} ${n1(my0 + mh + 26)}" style="fill:none;stroke:${tnd};stroke-width:12;stroke-linecap:round"/>`;
      // fibre grain along the length, then the vessel tree on top
      let grain = '';
      for (let i = 0; i < 14; i++) { const t = (i + 0.5) / 14, gx0 = mx0 + mw * (0.1 + t * 0.6), gx1 = mx0 + mw * (0.18 + t * 0.6); grain += `<path d="M${n1(gx0 + mw * 0.1)} ${n1(my0 - 4)}C${n1(gx0 - mw * 0.1)} ${n1(my0 + mh * 0.4)} ${n1(gx1)} ${n1(my0 + mh * 0.6)} ${n1(gx1 - mw * 0.06)} ${n1(my0 + mh + 4)}" style="fill:none;stroke:${MUS_D};stroke-width:${i % 3 ? 1.2 : 2.2};opacity:${i % 3 ? 0.3 : 0.45}"/>`; }
      const aw = fast ? 7 : 4.4, cwid = fast ? 2.8 : 1.2, AC = mx('series-6', 'strata-6', 70);
      const trunk = P ? [[mx0 - 10, my0 + mh * 0.5], [mx0 + mw * 0.3, my0 + mh * 0.45], [mx0 + mw * 0.6, my0 + mh * 0.55], [mx0 + mw + 10, my0 + mh * 0.5]]
        : [[mx0 + mw * 0.2, my0 + 10], [mx0 + mw * 0.4, my0 + mh * 0.3], [mx0 + mw * 0.56, my0 + mh * 0.62], [mx0 + mw * 0.62, my0 + mh * 0.96]];
      const art = `M${n1(trunk[0][0])} ${n1(trunk[0][1])}C${n1(trunk[1][0])} ${n1(trunk[1][1])} ${n1(trunk[2][0])} ${n1(trunk[2][1])} ${n1(trunk[3][0])} ${n1(trunk[3][1])}`;
      let net = '';
      const qn = rnd(31);
      for (let i = 0; i < 40; i++) {
        const a0 = trunk[1 + (i % 2)], ang = qn() * Math.PI * 2, L1 = 18 + qn() * (P ? 34 : 48);
        const bx = a0[0] + (trunk[2][0] - trunk[1][0]) * qn(), by = a0[1] + (trunk[2][1] - trunk[1][1]) * qn();
        const ex = bx + Math.cos(ang) * L1, ey2 = by + Math.sin(ang) * L1;
        net += `<path d="M${n1(bx)} ${n1(by)}Q${n1((bx + ex) / 2 + (qn() - 0.5) * 16)} ${n1((by + ey2) / 2 + (qn() - 0.5) * 16)} ${n1(ex)} ${n1(ey2)}" style="fill:none;stroke:${AC};stroke-width:${n1(cwid)};opacity:.8;stroke-linecap:round"/>`;
      }
      const cid = 'bt-mclip';
      s += `<defs><clipPath id="${cid}"><path d="${belly}"/></clipPath></defs>` + form(belly, mx(MUS, W_, 72), { rim: 2.4, rimCol: MUS_D, ao: 16, aoOp: 0.5, inner: grain + net });
      s += tube(art, mx('series-6', 'strata-6', 84), aw * 2);
      for (let i = 0; i < (fast ? 8 : 4); i++) s += `<g class="bt-flow" style="offset-path:path('${art}');--p:${fp}s;--d:${n1(-(i * fp) / (fast ? 8 : 4))}s">${rbcSide(0, 0, aw * 0.8)}</g>`;
      s += tag(mx0 + mw / 2, my0 + mh + (P ? 22 : 30), fast ? 'capillaries widen: more blood' : 'capillaries narrow: less blood', { size: 14, rim: RED_D });
      s += tag(mx0 + mw / 2, my0 - (P ? 16 : 26), 'leg muscle', { size: fs, display: true });
      head = flowChoiceHtml({ action: 'pace', label: 'Body', value: this.pace, options: [{ value: 'rest', label: 'At rest' }, { value: 'run', label: 'Running' }] });
    } else {
      s += field(st, 'bt', { a: 1, b: 4, k: 8 });
      const rows = [['A small cut', 'platelets; RBCs red'], ['A skin infection', 'white blood cells'], ['Running', 'more oxygen to muscles']];
      const cw = P ? W - 16 : (W - 40) / 3, ch = P ? (H - 16) / 3 : H - 40;
      rows.forEach(([t, part], i) => {
        const x = P ? 8 : 20 + i * cw, y = P ? 8 + i * ch : 20;
        s += `<rect x="${n1(x + 4)}" y="${n1(y + 2)}" width="${n1(cw - 8)}" height="${n1(ch - 4)}" rx="14" style="fill:${mx('elev-peak', 'series-6', 82)};opacity:.7;stroke:${mx('series-6', INK, 40)};stroke-width:2"/>`;
        const ix = x + 14, iy = y + (P ? 34 : 60), iw = P ? cw * 0.3 : cw - 28, ih = P ? ch - 46 : 200, c = [ix + iw / 2, iy + ih / 2];
        if (i === 0) { s += rbc(c[0] - 26, c[1], 18, 20) + rbc(c[0] + 22, c[1] - 10, 16, -30); for (let j = 0; j < 5; j++) s += plt(c[0] - 30 + j * 15, c[1] + 26 + (j % 2) * 6, 7, j * 40); }
        else if (i === 1) { s += wbc(c[0], c[1], P ? 26 : 34); for (let j = 0; j < 4; j++) s += germ(c[0] + (j - 1.5) * 22, c[1] + (P ? 34 : 46), j * 40); }
        else { s += rbc(c[0] - 20, c[1] - 6, 18, 0) + rbc(c[0] + 22, c[1] + 6, 18, 40); s += `<path d="M${n1(c[0] - 40)} ${n1(c[1] + 36)}H${n1(c[0] + 40)}" style="fill:none;stroke:${RED_D};stroke-width:4;stroke-linecap:round"/><path d="M${n1(c[0] + 30)} ${n1(c[1] + 28)}L${n1(c[0] + 42)} ${n1(c[1] + 36)}L${n1(c[0] + 30)} ${n1(c[1] + 44)}" style="fill:none;stroke:${RED_D};stroke-width:4;stroke-linecap:round"/>`; }
        if (P) s += tag(x + cw * 0.38, y + ch * 0.36, t, { size: fs, display: true, anchor: 'start' }) + tag(x + cw * 0.38, y + ch * 0.66, part, { size: 14, anchor: 'start' });
        else s += tag(x + cw / 2, y + 34, t, { size: fs, display: true }) + tag(x + cw / 2, iy + ih + 34, part, { size: 14 });
      });
    }
    return { svg: cwFrame(st, 'bt', s), head };
  }
}
