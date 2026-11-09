// ScopeArt.js - a school light microscope in side view, enamel and chrome. Not a scene. No words: scenes add labels.
//   microscope(x, y, s, o)  origin the middle of the foot, about 300 wide, 430 tall. o.a(part) -> opacity,
//   o.ray (true: the light path), o.obj (0 or 1: which objective is in place)
//   ANCHOR  part -> [x, y] on the drawing, for leader lines, in the same units
// Parts: eyepiece tube objective stage mirror coarse fine handle base
import { T, mx, n1 } from '../shared/CellWorld.js';
import { stroke } from '../shared/PlantArt.js';

const W_ = T('elev-peak');
export const ANCHOR = { eyepiece: [-58, -398], tube: [-52, -318], objective: [-52, -222], stage: [-96, -176], mirror: [-48, -96], coarse: [62, -262], fine: [58, -196], handle: [116, -220], base: [-40, -16] };
const defs = `<linearGradient id="sc-en" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${mx('strata-5', 'strata-6', 40)}"/><stop offset=".3" style="stop-color:${mx('strata-5', W_, 70)}"/><stop offset=".55" style="stop-color:${mx('strata-6', 'sea-deep', 70)}"/><stop offset="1" style="stop-color:${mx('strata-6', 'sea-deep', 90)}"/></linearGradient>`
  + `<linearGradient id="sc-cr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${mx('strata-5', W_, 60)}"/><stop offset=".3" style="stop-color:${W_}"/><stop offset=".6" style="stop-color:${mx('strata-5', W_, 66)}"/><stop offset="1" style="stop-color:${T('strata-5')}"/></linearGradient>`
  + `<linearGradient id="sc-mir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${W_}"/><stop offset=".6" style="stop-color:${mx('sky-day', W_, 40)}"/><stop offset="1" style="stop-color:${mx('sky-day', 'strata-5', 60)}"/></linearGradient>`;
const EN = `fill:url(#sc-en) ${T('strata-6')};stroke:${mx('strata-6', 'sea-deep', 86)};stroke-width:2`;
const CR = `fill:url(#sc-cr) ${T('strata-5')};stroke:${T('strata-5')};stroke-width:1.6`;
export function microscope(x, y, s = 1, o = {}) {
  const A = (p) => { const v = o.a?.(p); return v === undefined ? 1 : v; }, G = (p, c) => `<g opacity="${A(p)}">${c}</g>`;
  const ob = o.obj ?? 0;
  const base = `<path d="M-128 -2C-132 -22 -96 -34 -40 -38C20 -42 96 -44 134 -30C150 -24 150 -6 130 -2C60 6 -60 6 -116 6C-126 6 -128 2 -128 -2Z" style="${EN}"/><path d="M-110 -18C-60 -30 40 -34 120 -24" ${stroke(mx('strata-5', W_, 60), 3)} opacity=".6"/>`;
  const handle = `<path d="M70 -40C118 -90 146 -170 124 -240C112 -284 66 -310 16 -318L6 -278C50 -270 82 -244 90 -214C104 -160 72 -100 34 -60Z" style="${EN}"/><path d="M116 -120C130 -160 128 -206 116 -238" ${stroke(mx('strata-5', W_, 66), 4)} opacity=".6"/>`;
  const stage = `<path d="M-120 -178L60 -178L66 -160L-112 -160Z" style="${EN}"/><rect x="-96" y="-187" width="118" height="8" rx="2" style="fill:${mx('sky-day', W_, 30)};stroke:${T('strata-5')};stroke-width:1.2"/><path d="M-90 -190h34v5h-34zM-14 -190h34v5h-34z" style="${CR}"/><rect x="-56" y="-186" width="36" height="5" rx="1" style="fill:${mx('series-4', W_, 60)}"/>`;
  const mirror = `<path d="M-38 -130V-104" ${stroke(mx('strata-6', 'sea-deep', 70), 7)}/><path d="M-82 -84L4 -112" ${stroke(mx('strata-6', 'sea-deep', 76), 13)}/><path d="M-80 -88L2 -115" ${stroke('url(#sc-mir)', 8)}/><path d="M-80 -88L2 -115" ${stroke(W_, 3)}/>`;
  const objs = ob === 0
    ? `<path d="M-52 -252H-14L-20 -214H-46Z" style="${CR}"/><rect x="-47" y="-236" width="28" height="6" style="fill:${T('series-2')}"/><path d="M-44 -214H-22L-26 -198H-40Z" style="${CR}"/>`
    : `<path d="M-52 -252H-14L-20 -208H-46Z" style="${CR}"/><rect x="-47" y="-236" width="28" height="6" style="fill:${T('series-6')}"/><path d="M-44 -208H-22L-27 -192H-39Z" style="${CR}"/>`;
  const objective = `<path d="M6 -254L-6 -214L-34 -220L-22 -256Z" transform="rotate(-10 -10 -240)" style="${CR}" opacity=".66"/>${objs}<path d="M-64 -268H6L12 -252H-68Z" style="${EN}"/>`;
  const tube = `<rect x="-60" y="-356" width="62" height="92" rx="5" style="${EN}"/><path d="M-50 -350V-272" ${stroke(mx('strata-5', W_, 70), 5)} opacity=".6"/><path d="M-62 -316H4" ${stroke(mx('strata-5', W_, 60), 2)}/>`;
  const eye = `<rect x="-48" y="-416" width="38" height="64" rx="3" style="${CR}"/><rect x="-54" y="-424" width="50" height="14" rx="4" style="${EN}"/>`;
  const coarse = `<ellipse cx="40" cy="-262" rx="28" ry="34" style="fill:url(#sc-cr) ${T('strata-5')};stroke:${T('strata-5')};stroke-width:2"/><ellipse cx="38" cy="-262" rx="14" ry="19" style="fill:${mx('strata-6', 'sea-deep', 80)}"/><path d="M12 -262H64M16 -278H62M16 -246H62" ${stroke(T('strata-5'), 1.4)} opacity=".6"/>`;
  const fine = `<ellipse cx="42" cy="-198" rx="15" ry="19" style="fill:url(#sc-cr) ${T('strata-5')};stroke:${T('strata-5')};stroke-width:2"/><ellipse cx="41" cy="-198" rx="7" ry="9" style="fill:${mx('strata-6', 'sea-deep', 80)}"/>`;
  const ray = o.ray ? `<path d="M-200 -40L-38 -100L-33 -398" ${stroke(T('gold'), 9)} opacity=".36"/><path d="M-200 -40L-38 -100L-33 -398" ${stroke(T('gold'), 3.4)} stroke-dasharray="11 8"/><path d="M-41 -414l8 -16 8 16Z" style="fill:${T('gold')}"/>` : '';
  return `<defs>${defs}</defs><g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"><ellipse cx="6" cy="8" rx="150" ry="11" style="fill:${T('strata-6')};opacity:.3;filter:url(#pa-soft)"/>${G('base', base)}${G('handle', handle)}${G('mirror', mirror)}${G('stage', stage)}${G('objective', objective)}${G('tube', tube)}${G('eyepiece', eye)}${G('coarse', coarse)}${G('fine', fine)}${ray}</g>`;
}
