// ProteinRoute - Fig 2.13 as four stops, one per beat. Each beat plays its leg once and rests at the end of it, so any
// beat is right from a cold start. Landscape runs left to right, portrait top to bottom.
//   b0 ribosome on rough ER builds the chain, it passes into the ER
//   b1 a vesicle carries it to the Golgi apparatus
//   b2 modified and sorted through the sacs, packed in a new vesicle, moved to the edge
//   b3 the vesicle joins the plasma membrane; contents leave. The wall is not involved. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, golgi, ribosome, vesicle, bilayer, mitochondrion, depthField, n1, rnd, T, mx, stroke } from '../shared/CellWorld.js';
import { label, leader, anim } from '../shared/PlantArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const sm = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const lerp = (a, b, u) => a + (b - a) * u, V = 'series-5', R = 'series-6';

function geo(st) {
  const { W, H, portrait: P } = st;
  return P
    ? { rb: [52, 34], bud: [150, 136], gIn: [W / 2 + 44, 176], gOut: [W / 2 + 44, 276], near: [W / 2 + 44, 312], mem: [W / 2 + 44, 336], out: [W / 2 + 44, 372], gs: 1.5, gc: [W / 2 + 44, 226] }
    : { rb: [80, 96], bud: [198, 214], gIn: [262, 214], gOut: [432, 214], near: [498, 214], mem: [538, 214], out: [586, 214], gs: 2.05, gc: [346, 214] };
}
const dot = (x, y, r = 6, c = R) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" style="fill:${T(c)};stroke:${mx(c, 'strata-6', 58)};stroke-width:1.6"/>`;
const chain = (x, y, n, a = 0.7, c = R) => { let s = ''; for (let i = 0; i < n; i++) s += dot(x + Math.cos(a + i * 0.9) * i * 3.4, y + Math.sin(a + i * 0.9) * i * 3.4, 6, c); return s; };
const carried = (x, y, r = 22, c = R) => vesicle(x, y, r) + chain(x, y, 4, 0.7, c);

function roughBlock(G, P) {
  // stacked sacs of rough ER, with ribosomes on the outer faces
  const x = -24, y = P ? 44 : 118, w = P ? 200 : 214, h = P ? 22 : 34, gap = P ? 32 : 54; let s = '';
  for (let i = 0; i < 3; i++) {
    const yy = y + i * gap, d = `M${x} ${yy}H${x + w}a${h / 2} ${h / 2} 0 0 1 0 ${h}H${x}Z`;
    s += `<path d="${d}" transform="translate(3 6)" style="fill:${T('strata-6')};opacity:.14;filter:url(#cw-blur1)"/><path d="${d}" style="fill:url(#cw-er) ${mx(V, 'elev-peak', 56)};stroke:${mx(V, 'strata-6', 60)};stroke-width:2.4"/><path d="M${x} ${yy + 6}H${x + w - 2}" ${stroke(T('elev-peak'), 3)} opacity=".5"/>`;
    for (let k = 0; k < 16; k++) s += ribosome(x + 16 + k * 13.5, yy - 5, 4.4) + ribosome(x + 12 + k * 13.5, yy + h + 5, 4.4);
  }
  return s;
}
function backdrop(st, G) {
  const { W, H, portrait: P } = st, q = rnd(17); let s = '';
  for (let i = 0; i < (P ? 26 : 44); i++) { const x = q() * W, y = q() * H; if (P ? y < G.mem[1] - 16 : x < G.mem[0] - 16) s += ribosome(x, y, 3.2, { a: 0.55 }); }
  s += `<g opacity=".34">${mitochondrion(P ? 58 : 460, P ? 262 : 368, P ? 0.6 : 0.86, { rot: 16, seed: 7 })}${P ? '' : mitochondrion(120, 372, 0.84, { rot: -8, seed: 3 })}</g>`;
  return s;
}
export class ProteinRoute extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 680; static HEIGHT = 450; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'One protein is made by a ribosome on the rough endoplasmic reticulum. A vesicle carries it to the Golgi apparatus, which modifies and packages it into a new vesicle. That vesicle joins the plasma membrane and the protein leaves the cell.';
  static CONTROLS = [];
  enter() { this.play?.(3); }
  stageHeight(st) { return st.portrait ? 410 : 430; }
  animate(st, t = 0) {
    const G = geo(st), step = this.stepIndex, u = sm(t / 2.6); let d = '';
    if (step === 0) { const n = Math.round(1 + u * 5); d += chain(G.rb[0] + 18, G.rb[1] + (st.portrait ? 14 : 34), n); }
    if (step === 1) { d += carried(lerp(G.bud[0], G.gIn[0], u), lerp(G.bud[1], G.gIn[1], u)); }
    if (step === 2) {
      const a = sm(t / 1.2), b = sm((t - 1.1) / 1.6);
      if (b <= 0) d += chain(lerp(G.gIn[0], G.gOut[0], a), lerp(G.gIn[1], G.gOut[1], a), 4);
      else d += carried(lerp(G.gOut[0], G.near[0], b), lerp(G.gOut[1], G.near[1], b));
    }
    if (step === 3) {
      const a = sm(t / 1.3), b = sm((t - 1.1) / 1.5), P = st.portrait, mx0 = G.mem, ox = G.out;
      if (a < 1) d += carried(lerp(G.near[0], mx0[0], a), lerp(G.near[1], mx0[1], a), lerp(22, 15, a));
      for (let i = 0; i < 5; i++) { const sp = (i - 2) * 16; d += dot(lerp(mx0[0], ox[0] + (P ? sp : 16 * Math.abs(i - 2)), b), lerp(mx0[1], ox[1] + (P ? 8 * Math.abs(i - 2) : sp), b), 6); if (b <= 0) break; }
    }
    anim(this, 'w', d);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, G = geo(st), size = P ? 14 : 16;
    let g = depthField(W, H, { tone: 'blue', seed: 21 });
    const dimER = step === 0 || step === 1 ? 1 : 0.42, dimG = step === 1 || step === 2 ? 1 : 0.42, memOn = step >= 2, [mxx, myy] = G.mem;
    // outside of the cell, then the plasma membrane as a real bilayer, open where the vesicle joined
    const OUT = mx('strata-1', 'elev-peak', 30);
    g += P ? `<rect y="${n1(myy)}" width="${W}" height="${H}" style="fill:${OUT}"/>` : `<rect x="${n1(mxx)}" width="${W}" height="${H}" style="fill:${OUT}"/>`;
    g += backdrop(st, G);
    const across = P ? mxx : myy, len = P ? W + 24 : H + 24, skip = step === 3 ? [[across - 22 + 12, across + 22 + 12]] : [];
    const strip = bilayer(-12, 0, len, { h: 16, step: 13, skip });
    g += `<g opacity="${memOn ? 1 : 0.55}" transform="${P ? `translate(0 ${myy})` : `translate(${mxx} 0) rotate(90)`}">${strip}</g>`;
    if (step === 3) { const c = mx('sea-shallow', 'sea-deep', 62), cup = P ? `M${mxx - 26} ${myy - 16}C${mxx - 26} ${myy - 4} ${mxx - 26} ${myy + 12} ${mxx - 22} ${myy + 18}M${mxx + 26} ${myy - 16}C${mxx + 26} ${myy - 4} ${mxx + 26} ${myy + 12} ${mxx + 22} ${myy + 18}` : `M${mxx - 16} ${myy - 26}C${mxx - 4} ${myy - 26} ${mxx + 12} ${myy - 26} ${mxx + 18} ${myy - 22}M${mxx - 16} ${myy + 26}C${mxx - 4} ${myy + 26} ${mxx + 12} ${myy + 26} ${mxx + 18} ${myy + 22}`; g += `<path d="${cup}" ${stroke(c, 7)}/>`; }
    g += `<g opacity="${dimER}">${roughBlock(G, P)}</g>`;
    g += `<g opacity="${dimG}">${golgi(G.gc[0], G.gc[1], G.gs, { vesicles: true, rot: P ? 0 : 90 })}</g>`;
    g += '<g data-anim="w"></g>';
    if (step === 0) g += label(P ? W - 62 : 250, P ? 24 : 62, 'Ribosome', { size }) + leader(P ? W - 112 : 200, P ? 30 : 68, G.rb[0] + 18, G.rb[1] + 4) + label(P ? W - 68 : 110, P ? 150 : 310 + 44, 'Rough ER', { size });
    if (step === 1) g += label(G.bud[0] + (P ? -90 : 40), P ? 170 : 166, 'Vesicle', { size }) + (P ? label(62, G.gc[1] - 26, 'Golgi', { size }) + label(62, G.gc[1] - 8, 'apparatus', { size }) : label(G.gc[0], 66, 'Golgi apparatus', { size }));
    if (step === 2) g += (P ? label(62, G.gc[1] - 44, 'Modified', { size }) + label(62, G.gc[1] - 26, 'and', { size }) + label(62, G.gc[1] - 8, 'sorted', { size }) + label(62, G.near[1] - 6, 'New vesicle', { size }) + leader(112, G.near[1] - 10, G.near[0] - 26, G.near[1] - 6) : label(G.gc[0], 66, 'Modified and sorted', { size }) + label(G.near[0] - 6, 300, 'New vesicle', { size }));
    if (step === 3) g += label(P ? 90 : mxx - 22, P ? myy - 26 : 40, 'Plasma membrane', { size, anchor: P ? 'middle' : 'end' }) + label(P ? 72 : W - 18, P ? H - 14 : H - 26, 'Outside the cell', { size, anchor: P ? 'middle' : 'end' });
    return { svg: cwFrame(st, 'pr', g) };
  }
}
