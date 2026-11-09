// OnionRootScene - blk-l08-n01. Activity steps at a lab bench. Beat 0: a red onion on a glass jar, roots in the water.
// Beat 1: root tips cut, in two bottles (aceto-alcohol 24 hours, then 70 per cent ethanol). Beat 2: a root on a slide, a
// dropper of stain, a spirit lamp. Beat 3: coverslip pressed by a thumb, then the microscope slide.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, stroke } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd } from '../shared/CellWorld.js';
// A window at home or in the lab: daylight sky, frame bars, a painted sill to stand things on. Quiet; light from the left.
function sill(W, H, gy) {
  const fr = mx('strata-1', 'elev-peak', 40), frd = mx('strata-1', 'strata-4', 64);
  let s = `<defs><linearGradient id="or-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-shallow', 'elev-peak', 40)}"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'elev-peak', 14)}"/></linearGradient>`
    + `<linearGradient id="or-sill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(fr, 'elev-peak', 60)}"/><stop offset="1" style="stop-color:${frd}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" style="fill:${mx('strata-1', 'elev-peak', 30)}"/>`;
  const x0 = W * 0.06, x1 = W * 0.94, y0 = 10, y1 = gy - 8;
  s += `<rect x="${n1(x0)}" y="${y0}" width="${n1(x1 - x0)}" height="${n1(y1 - y0)}" style="fill:url(#or-sky) ${T('sea-shallow')}"/>`;
  s += `<ellipse cx="${n1(W * 0.26)}" cy="${n1(gy * 0.8)}" rx="${n1(W * 0.3)}" ry="${n1(gy * 0.16)}" style="fill:${mx('elev-low', 'elev-peak', 60)};opacity:.5;filter:url(#pa-softer)"/><ellipse cx="${n1(W * 0.78)}" cy="${n1(gy * 0.86)}" rx="${n1(W * 0.26)}" ry="${n1(gy * 0.12)}" style="fill:${mx('elev-low', 'elev-peak', 50)};opacity:.45;filter:url(#pa-softer)"/>`;
  s += `<path d="M${n1(x0)} ${y0}L${n1(x0 + W * 0.3)} ${y0}L${n1(x0 + W * 0.12)} ${n1(y1)}L${n1(x0)} ${n1(y1)}Z" style="fill:${T('elev-peak')};opacity:.22"/>`;
  s += `<path d="M${n1(W / 2)} ${y0}V${n1(y1)}M${n1(x0)} ${n1((y0 + y1) * 0.46)}H${n1(x1)}" ${stroke(fr, 10)}/><path d="M${n1(W / 2 + 4)} ${y0}V${n1(y1)}" ${stroke(frd, 2, 'opacity:.6')}/>`;
  s += `<rect x="${n1(x0)}" y="${y0}" width="${n1(x1 - x0)}" height="${n1(y1 - y0)}" style="fill:none;stroke:${fr};stroke-width:12"/>`;
  s += `<rect x="0" y="${n1(gy - 8)}" width="${W}" height="${n1(H - gy + 8)}" style="fill:url(#or-sill) ${fr}"/><rect x="0" y="${n1(gy - 8)}" width="${W}" height="5" style="fill:${T('elev-peak')};opacity:.7"/><rect x="0" y="${n1(gy + 10)}" width="${W}" height="${n1(H - gy)}" style="fill:${T(INK)};opacity:.06"/>`;
  return s;
}

const one = (idx) => [{ idx, dwellMs: null }];
const INK = 'strata-6';
// A red onion: papery copper-red skin over purple-red flesh, veins running from neck to base, a dry neck, a pale
// basal plate underneath where the roots come out.
function onion(x, y, r) {
  const skin = mx(mx('series-6', 'series-4', 55), 'strata-3', 78), flesh = mx('series-4', 'series-5', 70);
  let s = `<defs><radialGradient id="on-b" cx=".32" cy=".34" r=".9"><stop offset="0" style="stop-color:${mx(skin, 'elev-peak', 50)}"/><stop offset=".5" style="stop-color:${skin}"/><stop offset="1" style="stop-color:${mx(skin, INK, 50)}"/></radialGradient>`
    + `<radialGradient id="on-f" cx=".4" cy=".4" r=".8"><stop offset="0" style="stop-color:${mx(flesh, 'elev-peak', 40)}"/><stop offset="1" style="stop-color:${flesh}"/></radialGradient></defs>`;
  const b = `M${n1(x - r * 0.1)} ${n1(y - r * 1.0)}C${n1(x - r * 0.3)} ${n1(y - r * 0.86)} ${n1(x - r * 1.12)} ${n1(y - r * 0.62)} ${n1(x - r * 1.1)} ${n1(y + r * 0.04)}C${n1(x - r * 1.08)} ${n1(y + r * 0.64)} ${n1(x - r * 0.56)} ${n1(y + r * 0.9)} ${n1(x - r * 0.18)} ${n1(y + r * 0.94)}H${n1(x + r * 0.18)}C${n1(x + r * 0.56)} ${n1(y + r * 0.9)} ${n1(x + r * 1.08)} ${n1(y + r * 0.64)} ${n1(x + r * 1.1)} ${n1(y + r * 0.04)}C${n1(x + r * 1.12)} ${n1(y - r * 0.62)} ${n1(x + r * 0.3)} ${n1(y - r * 0.86)} ${n1(x + r * 0.1)} ${n1(y - r * 1.0)}Z`;
  s += `<ellipse cx="${n1(x + 6)}" cy="${n1(y + r * 0.2)}" rx="${n1(r * 1.1)}" ry="${n1(r * 0.86)}" style="fill:${T(INK)};opacity:.18;filter:url(#pa-soft)"/>`;
  s += `<path d="${b}" style="fill:url(#on-b) ${skin};stroke:${mx(skin, INK, 46)};stroke-width:2.2"/>`;
  for (const k of [-0.86, -0.62, -0.38, -0.14, 0.1, 0.94]) s += `<path d="M${n1(x + k * 0.12 * r)} ${n1(y - r * 0.96)}C${n1(x + k * r * 1.02)} ${n1(y - r * 0.5)} ${n1(x + k * r * 1.12)} ${n1(y + r * 0.4)} ${n1(x + k * 0.18 * r)} ${n1(y + r * 0.92)}" ${stroke(mx(skin, INK, 62), 1.4, 'opacity:.5')}/>`;
  s += `<path d="M${n1(x - r * 0.76)} ${n1(y - r * 0.36)}C${n1(x - r * 0.66)} ${n1(y - r * 0.66)} ${n1(x - r * 0.42)} ${n1(y - r * 0.8)} ${n1(x - r * 0.26)} ${n1(y - r * 0.84)}" ${stroke(mx('elev-peak', skin, 60), Math.max(3, r * 0.09), 'opacity:.7')}/>`;
  // dry neck with papery tips
  const nk = mx('strata-2', 'strata-3', 50);
  s += `<path d="M${n1(x - r * 0.12)} ${n1(y - r * 0.98)}C${n1(x - r * 0.14)} ${n1(y - r * 1.24)} ${n1(x - r * 0.06)} ${n1(y - r * 1.4)} ${n1(x - r * 0.18)} ${n1(y - r * 1.62)}L${n1(x + r * 0.02)} ${n1(y - r * 1.44)}L${n1(x + r * 0.16)} ${n1(y - r * 1.58)}C${n1(x + r * 0.1)} ${n1(y - r * 1.36)} ${n1(x + r * 0.14)} ${n1(y - r * 1.2)} ${n1(x + r * 0.12)} ${n1(y - r * 0.98)}Z" style="fill:${nk};stroke:${mx(nk, INK, 50)};stroke-width:1.6"/>`;
  // basal plate
  s += `<ellipse cx="${n1(x)}" cy="${n1(y + r * 0.94)}" rx="${n1(r * 0.3)}" ry="${n1(r * 0.08)}" style="fill:${mx('strata-1', 'elev-peak', 50)};stroke:${mx('strata-2', INK, 60)};stroke-width:1.4"/>`;
  return s;
}
function roots(x, y, len, r) {
  const q = rnd(5); let s = '';
  for (let i = 0; i < 26; i++) {
    const ox = (q() - 0.5) * r * 0.5, l = len * (0.55 + q() * 0.48), sw = (q() - 0.5) * r * 1.3, ex = x + ox + sw * 0.8, ey = y + l;
    const d = `M${n1(x + ox)} ${n1(y)}C${n1(x + ox + sw * 0.3)} ${n1(y + l * 0.35)} ${n1(x + ox + sw)} ${n1(y + l * 0.6)} ${n1(ex)} ${n1(ey)}`;
    s += `<path d="${d}" ${stroke(mx('strata-1', 'strata-3', 70), 3.2)}/><path d="${d}" ${stroke(mx('elev-peak', 'strata-1', 80), 1.8)}/><circle cx="${n1(ex)}" cy="${n1(ey)}" r="1.9" style="fill:${mx('gold', 'elev-peak', 50)}"/>`;
  }
  return s;
}
function jar(x, y, w, h, onionR, rootLen) {
  // y is the bench. A pressed glass jar: thick base, shoulders, a neck that holds the onion.
  const wl = y - h * 0.84, nx = w * 0.3, top = y - h;
  let s = `<ellipse cx="${n1(x + 6)}" cy="${n1(y + 4)}" rx="${n1(w * 0.56)}" ry="9" style="fill:${T(INK)};opacity:.28"/>`;
  const body = `M${n1(x - nx)} ${n1(top)}V${n1(top + h * 0.1)}C${n1(x - nx)} ${n1(top + h * 0.18)} ${n1(x - w / 2)} ${n1(top + h * 0.18)} ${n1(x - w / 2)} ${n1(top + h * 0.3)}V${n1(y - 16)}Q${n1(x - w / 2)} ${n1(y)} ${n1(x - w / 2 + 16)} ${n1(y)}H${n1(x + w / 2 - 16)}Q${n1(x + w / 2)} ${n1(y)} ${n1(x + w / 2)} ${n1(y - 16)}V${n1(top + h * 0.3)}C${n1(x + w / 2)} ${n1(top + h * 0.18)} ${n1(x + nx)} ${n1(top + h * 0.18)} ${n1(x + nx)} ${n1(top + h * 0.1)}V${n1(top)}Z`;
  s += `<clipPath id="on-j"><path d="${body}"/></clipPath><path d="${body}" style="fill:${mx('sea-shallow', 'elev-peak', 16)};opacity:.55"/>`;
  s += `<g clip-path="url(#on-j)"><rect x="${n1(x - w)}" y="${n1(top + onionR * 0.12)}" width="${n1(w * 2)}" height="${n1(h)}" style="fill:${mx('sea-shallow', 'elev-peak', 56)};opacity:.62"/><ellipse cx="${n1(x)}" cy="${n1(top + onionR * 0.12)}" rx="${n1(w * 0.3)}" ry="4" style="fill:${mx('sea-shallow', 'elev-peak', 34)};opacity:.9"/>${roots(x, top + onionR * 0.2, rootLen, onionR)}</g>`;
  s += onion(x, top - onionR * 0.72, onionR);
  s += `<path d="${body}" ${stroke(mx('sea-shallow', 'strata-6', 56), 3.4)}/><path d="M${n1(x - w / 2 + 11)} ${n1(top + h * 0.34)}V${n1(y - 26)}" ${stroke(T('elev-peak'), 6, 'opacity:.7')}/><path d="M${n1(x + w / 2 - 12)} ${n1(top + h * 0.4)}V${n1(y - 34)}" ${stroke(T('elev-peak'), 2.6, 'opacity:.5')}/>`;
  return s + (wl ? '' : '');
}
function bottle(x, y, w, h, tint, stems) {
  let s = `<ellipse cx="${n1(x + 5)}" cy="${n1(y + 3)}" rx="${n1(w * 0.54)}" ry="7" style="fill:${T(INK)};opacity:.26"/>`;
  s += `<rect x="${n1(x - w * 0.3)}" y="${n1(y - h - 12)}" width="${n1(w * 0.6)}" height="20" rx="4" style="fill:${mx('strata-5', 'strata-6', 66)}"/><path d="M${n1(x - w * 0.24)} ${n1(y - h + 8)}L${n1(x - w / 2)} ${n1(y - h + 30)}V${n1(y - 10)}Q${n1(x - w / 2)} ${n1(y)} ${n1(x - w / 2 + 10)} ${n1(y)}H${n1(x + w / 2 - 10)}Q${n1(x + w / 2)} ${n1(y)} ${n1(x + w / 2)} ${n1(y - 10)}V${n1(y - h + 30)}L${n1(x + w * 0.24)} ${n1(y - h + 8)}Z" style="fill:${mx('sea-shallow', 'elev-peak', 14)};opacity:.6;stroke:${mx('sea-shallow', 'strata-6', 56)};stroke-width:3"/>`;
  s += `<rect x="${n1(x - w / 2 + 3)}" y="${n1(y - h * 0.56)}" width="${n1(w - 6)}" height="${n1(h * 0.56 - 3)}" rx="7" style="fill:${tint};opacity:.56"/>`;
  for (let i = 0; i < stems; i++) { const sx = x - w * 0.2 + i * w * 0.14, ey = y - 8; s += `<path d="M${n1(sx)} ${n1(ey)}Q${n1(sx + 6)} ${n1(ey - h * 0.2)} ${n1(sx + (i % 2 ? 10 : -6))} ${n1(ey - h * 0.42)}" ${stroke(mx('elev-peak', 'strata-1', 62), 4)}/>`; }
  s += `<path d="M${n1(x - w / 2 + 10)} ${n1(y - h + 38)}V${n1(y - 16)}" ${stroke(T('elev-peak'), 5, 'opacity:.65')}/>`;
  return s;
}
function slide(x, y, w) {
  return `<path d="M${n1(x - w / 2 + 24)} ${n1(y - 26)}H${n1(x + w / 2 + 12)}L${n1(x + w / 2 - 12)} ${n1(y + 14)}H${n1(x - w / 2)}Z" style="fill:${mx('sea-shallow', 'elev-peak', 26)};opacity:.82;stroke:${mx('sea-shallow', 'strata-6', 50)};stroke-width:2.6"/><path d="M${n1(x - w * 0.4)} ${n1(y + 8)}L${n1(x - w * 0.3)} ${n1(y - 20)}" ${stroke(T('elev-peak'), 3, 'opacity:.8')}/>`;
}
function dropper(x, y, s, tint) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"><path d="M-3 0L-7 -44H7L3 0Z" style="fill:${mx('elev-peak', 'sea-shallow', 70)};opacity:.86;stroke:${mx('sea-shallow', 'strata-6', 50)};stroke-width:2"/><path d="M-5 -20L-3 -2H3L5 -20Z" style="fill:${tint}"/><path d="M-11 -44H11V-52H-11Z" style="fill:${mx('strata-5', 'strata-6', 66)}"/><path d="M-9 -52C-14 -86 14 -86 9 -52Z" style="fill:${T('series-6')};stroke:${mx('series-6', 'strata-6', 58)};stroke-width:2"/></g><circle cx="${n1(x)}" cy="${n1(y + 12 * s)}" r="${n1(4.6 * s)}" style="fill:${tint}"/>`;
}
function lamp(x, y, k) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${k})"><ellipse cx="4" cy="4" rx="46" ry="8" style="fill:${T(INK)};opacity:.26"/><path d="M-40 0C-48 -24 -28 -40 -10 -42V-52H10V-42C28 -40 48 -24 40 0Z" style="fill:${mx('sea-shallow', 'elev-peak', 26)};opacity:.72;stroke:${mx('sea-shallow', 'strata-6', 50)};stroke-width:3"/><path d="M-41 -2C-45 -14 -40 -20 -36 -22H36C40 -20 45 -14 41 -2Z" style="fill:${T('series-1')};opacity:.4"/><rect x="-13" y="-62" width="26" height="12" rx="3" style="fill:${mx('strata-5', 'strata-6', 56)}"/><path d="M-4 -62V-76H4V-62Z" style="fill:${T('elev-peak')}"/><path d="M0 -122C-20 -98 -14 -78 0 -74C14 -78 20 -98 0 -122Z" style="fill:${T('flame')};opacity:.92"/><path d="M0 -102C-9 -90 -6 -80 0 -78C6 -80 9 -90 0 -102Z" style="fill:${T('gold')}"/></g>`;
}

export class OnionRootScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A window sill. A red onion sits on a glass jar with white roots growing into the water. Cut root tips go into two bottles. A root on a slide gets a drop of stain and is warmed gently over a spirit lamp. A thumb presses a coverslip on the slide, ready for the microscope.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, gy = H - (P ? 54 : 58), fs = P ? 15 : 18;
    let s = sill(W, H, gy + 6);
    const k = P ? 0.78 : 1;
    const title = (t) => label(W / 2, P ? 26 : 32, t, { size: P ? 18 : 22, display: true });
    if (step === 0) {
      s += jar(W * 0.5, gy + 6, P ? 150 : 180, P ? 178 : 180, P ? 54 : 62, P ? 134 : 140);
      s += label(W * (P ? 0.5 : 0.18), P ? H - 18 : H * 0.6, '5 to 6 days', { size: fs + 3, display: true });
    } else if (step === 1) {
      s += title('Preserve the root tips');
      const y = gy + 6, x1 = W * 0.28, x2 = W * 0.72, w = P ? 92 : 120, h = P ? 170 : 190;
      s += bottle(x1, y, w, h, T('series-2'), 4) + bottle(x2, y, w, h, T('series-1'), 4);
      s += label(x1, y - h - 26, 'Aceto-alcohol', { size: fs + 1, display: true }) + label(x1, y + (P ? 22 : 30), '24 hours', { size: fs });
      s += label(x2, y - h - 26, '70% ethanol', { size: fs + 1, display: true }) + label(x2, y + (P ? 22 : 30), 'to preserve', { size: fs });
    } else if (step === 2) {
      s += title('Stain, then warm gently');
      const y = gy - 8, x = W * (P ? 0.32 : 0.34), w = P ? 150 : 210;
      s += slide(x, y, w);
      { const kr = k * 1.8, rt = `M${n1(x - 40 * kr)} ${n1(y - 12)}C${n1(x - 10 * kr)} ${n1(y - 17)} ${n1(x + 20 * kr)} ${n1(y - 14)} ${n1(x + 34 * kr)} ${n1(y - 9)}Q${n1(x + 42 * kr)} ${n1(y - 6)} ${n1(x + 34 * kr)} ${n1(y - 3)}C${n1(x + 20 * kr)} ${n1(y + 1)} ${n1(x - 10 * kr)} ${n1(y - 2)} ${n1(x - 40 * kr)} ${n1(y - 4)}Z`;
        s += `<ellipse cx="${n1(x + 8 * kr)}" cy="${n1(y - 7)}" rx="${n1(30 * kr)}" ry="${n1(8 * kr)}" style="fill:${T('series-6')};opacity:.28"/><path d="${rt}" style="fill:${mx('strata-1', 'elev-peak', 50)};stroke:${mx('strata-2', INK, 50)};stroke-width:1.4"/>`;
        s += `<path d="M${n1(x + 10 * kr)} ${n1(y - 14)}C${n1(x + 24 * kr)} ${n1(y - 13)} ${n1(x + 40 * kr)} ${n1(y - 8)} ${n1(x + 34 * kr)} ${n1(y - 3)}C${n1(x + 22 * kr)} ${n1(y)} ${n1(x + 12 * kr)} ${n1(y - 1)} ${n1(x + 10 * kr)} ${n1(y - 2)}Z" style="fill:${mx('series-6', 'strata-6', 20)};opacity:.85"/>`;
        s += `<path d="M${n1(x - 30 * kr)} ${n1(y - 12)}C${n1(x)} ${n1(y - 15)} ${n1(x + 20 * kr)} ${n1(y - 13)} ${n1(x + 30 * kr)} ${n1(y - 10)}" ${stroke(T('elev-peak'), 1.6, 'opacity:.7')}/>`; }
      s += dropper(x, y - (P ? 84 : 112), P ? 0.9 : 1.2, T('series-6'));
      s += label(x, y - (P ? 186 : 236), 'Aceto-carmine', { size: fs, display: true });
      s += lamp(W * (P ? 0.76 : 0.74), gy + 8, P ? 0.82 : 1.14);
      s += label(W * (P ? 0.76 : 0.74), gy + (P ? 34 : 38), 'With an adult', { size: fs, display: true });
    } else {
      s += label(W * (P ? 0.17 : 0.17), P ? 60 : 70, 'Press gently,', { size: P ? 15 : 20, display: true }) + label(W * (P ? 0.17 : 0.17), P ? 80 : 96, 'then look', { size: P ? 15 : 20, display: true });
      const y = gy - 14, x = W * 0.5, w = P ? 240 : 340;
      s += slide(x, y, w) + `<path d="M${n1(x - 50)} ${n1(y - 16)}H${n1(x + 62)}L${n1(x + 44)} ${n1(y + 8)}H${n1(x - 66)}Z" style="fill:${T('elev-peak')};opacity:.6;stroke:${mx('sea-shallow', 'strata-6', 50)};stroke-width:2"/><ellipse cx="${n1(x)}" cy="${n1(y - 3)}" rx="30" ry="9" style="fill:${T('series-6')};opacity:.75"/>`;
      // a thumb from behind, nail towards us, pressing gently; the hand runs out of the top of the frame
      const tk = P ? 0.84 : 1, sk = mx('strata-2', 'strata-3', 46), hl = mx(sk, 'elev-peak', 66), dk = mx(sk, 'strata-6', 66);
      s += `<defs><linearGradient id="or-t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${dk}"/><stop offset=".3" style="stop-color:${sk}"/><stop offset=".62" style="stop-color:${hl}"/><stop offset="1" style="stop-color:${dk}"/></linearGradient></defs>`;
      s += `<g transform="translate(${n1(x)} ${n1(y - 14)}) scale(${tk})"><path d="M-30 -8C-46 -30 -48 -70 -46 -110C-44 -170 -60 -240 -64 -380H70C66 -240 46 -170 46 -110C48 -70 46 -30 30 -8C14 4 -14 4 -30 -8Z" style="fill:url(#or-t) ${sk};stroke:${dk};stroke-width:2.4"/>`
        + `<path d="M-30 -22C-34 -62 -30 -92 -22 -104Q0 -116 22 -104C30 -92 34 -62 30 -22C16 -8 -16 -8 -30 -22Z" style="fill:${mx(hl, 'series-4', 84)};stroke:${dk};stroke-width:1.8"/><path d="M-14 -100Q0 -108 14 -100" ${stroke(T('elev-peak'), 4, 'opacity:.7')}/><path d="M-22 -40Q-24 -70 -16 -92" ${stroke(T('elev-peak'), 3, 'opacity:.5')}/>`
        + `<path d="M-40 -142Q0 -132 40 -142M-42 -154Q0 -146 42 -154M-44 -220Q2 -210 46 -220" ${stroke(dk, 2.2, 'opacity:.6')}/></g>`;
    }
    return { svg: cwFrame(st, 'or', s) };
  }
}
