// VenterSwapScene - blk-l07-n05. Beat 0: a computer reads the DNA of one bacterium. Beat 1: a flask of synthetic DNA, a
// related bacterium with its own DNA taken out. Beat 2: the new DNA goes in and the cell grows and divides. Beat 3: one
// label on each part: only the DNA came from the laboratory.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, labelWhite as label, leader, stroke } from '../shared/PlantArt.js';
import { cwFrame, blobPath, ribosome, rnd, T, mx, n1 } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];
const NEW = 'series-2';
function dnaLoop(x, y, s, col, o = {}) {
  let d = 'M-34 0'; const W = [15, 19, 13, 17, 20, 14, 18, 12, 16];
  W.forEach((w, k) => { const u = -28 + k * 8; d += `C${u} ${-w} ${u + 8} ${-w} ${u + 6} 0S${u + 2} ${w} ${u + 10} ${n1(w * 0.3)}`; });
  d += 'C44 18 -30 22 -34 0';
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}><path d="${d}" ${stroke(mx(col, 'strata-6', 66), 5.4)}/><path d="${d}" ${stroke(T(col), 3)}/></g>`;
}
// Mycoplasma has no cell wall and no tail: a soft, slightly uneven cell, 180 x 120 at s = 1. Membrane with a light
// rim, grainy cytoplasm, ribosomes. o.dna: true draws its own DNA (series-5); the scene draws the synthetic loop itself.
function myco(x, y, s, o = {}) {
  const q = rnd(o.seed ?? 12), d = blobPath(0, 0, 88, 56, o.seed ?? 12, 0.06, 12), id = `vsm${o.seed ?? 12}${Math.round(x)}${Math.round(y)}`;
  let dots = '', rib = '';
  for (let i = 0; i < 46; i++) { const a = q() * 6.28, k = Math.sqrt(q()) * 0.86; dots += `<circle cx="${n1(Math.cos(a) * 84 * k)}" cy="${n1(Math.sin(a) * 52 * k)}" r="${n1(0.8 + q() * 1.6)}" style="fill:${T('sea-deep')};opacity:${n1(0.14 + q() * 0.18)}"/>`; }
  for (let i = 0; i < 24; i++) { const a = q() * 6.28, k = 0.3 + q() * 0.6; rib += ribosome(Math.cos(a) * 80 * k, Math.sin(a) * 48 * k, 2.6); }
  let dna = '';
  if (o.dna) dna = dnaLoop(0, 0, 0.92, 'series-5');
  const body = `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" transform="translate(4 9)" style="fill:${T('strata-6')};opacity:.26;filter:url(#cw-blur3)"/>`
    + `<path d="${d}" style="fill:url(#cw-cytoG) ${mx('sea-shallow', 'elev-peak', 30)}"/><g clip-path="url(#${id})"><rect x="-92" y="-60" width="184" height="120" style="fill:${mx('series-1', 'strata-6', 40)};opacity:.18;filter:url(#cw-grain)"/><ellipse cx="22" cy="30" rx="96" ry="40" style="fill:${T('sea-deep')};opacity:.1"/>${dots}</g>${rib}${dna}`
    + `<path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'elev-peak', 64)};stroke-width:7;opacity:.55;filter:url(#cw-blur1)"/><path d="${d}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 70)};stroke-width:2.6"/>`
    + `<path d="M-62 -38C-30 -50 20 -50 54 -40" ${stroke(T('elev-peak'), 3.4, 'opacity:.6')}/>`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"${o.a !== undefined ? ` opacity="${o.a}"` : ''}>${body}</g>`;
}
function screen(x, y, w, h, t) {
  const seq = 'ATGCCGTATAGCTTAGGCATCGAATTCGGCTA', rows = Math.floor((h - 26) / 20);
  let s = `<rect x="${n1(x - w * 0.56)}" y="${n1(y + h / 2 - 2)}" width="${n1(w * 1.12)}" height="13" rx="6" style="fill:${mx('strata-5', 'strata-6', 60)}"/><rect x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="12" style="fill:${mx('strata-6', 'sea-deep', 60)};stroke:${mx('strata-5', 'strata-6', 50)};stroke-width:5"/>`;
  for (let r = 0; r < rows; r++) {
    const line = seq.slice((r * 5) % 11, ((r * 5) % 11) + 15).split('').join(' ');
    s += `<text x="${n1(x)}" y="${n1(y - h / 2 + 28 + r * 20)}" text-anchor="middle" style="font-family:var(--sim-font);font-size:15px;font-weight:800;fill:${r % 2 ? T('sea-shallow') : T('gold')}">${line}</text>`;
  }
  return s;
}
function flask(x, y, s) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"><path d="M-18 -92V-46L-62 34Q-70 52 -48 52H48Q70 52 62 34L18 -46V-92Z" style="fill:${T('elev-peak')};opacity:.24;stroke:${T('strata-5')};stroke-width:4"/><path d="M-40 -2L-62 34Q-70 52 -48 52H48Q70 52 62 34L40 -2Z" style="fill:${mx(NEW, 'elev-peak', 40)};opacity:.72"/><rect x="-24" y="-98" width="48" height="10" rx="5" style="fill:${T('strata-5')}"/><path d="M-24 -40Q-34 -12 -46 8" ${stroke(T('elev-peak'), 4, 'opacity:.7')}/></g>`;
}

export class VenterSwapScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A computer screen shows the DNA sequence of one bacterium. A flask holds an exact copy made in the laboratory. A second bacterium has its own DNA removed. The new DNA goes in, and the cell grows and divides. At the end labels show that only the DNA was synthetic: the rest came from a living cell.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 15 : 18;
    let s = `<defs><radialGradient id="vs-b" cx=".5" cy=".46" r=".8"><stop offset="0" style="stop-color:${mx('sea-deep', 'series-5', 62)}"/><stop offset="1" style="stop-color:${mx('sea-deep', 'strata-6', 46)}"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#vs-b) ${T('sea-deep')}"/>`;
    const q = rnd(4);
    for (let i = 0; i < 26; i++) s += `<circle cx="${n1(q() * W)}" cy="${n1(q() * H)}" r="${n1(2 + q() * 5)}" style="fill:${T('sea-shallow')};opacity:${n1(0.06 + q() * 0.1)}"/>`;
    const title = (t) => label(W / 2, P ? 24 : 32, t, { size: P ? 18 : 22, display: true });
    if (step === 0) {
      s += title('Read the DNA with a computer');
      if (P) { s += myco(W / 2, 112, 1.2, { seed: 12, dna: true }) + screen(W / 2, 270, 300, 170); } else { s += myco(W * 0.22, H * 0.52, 1.1, { seed: 12, dna: true }) + leader(W * 0.42, H * 0.52, W * 0.5, H * 0.52, T('elev-peak')) + screen(W * 0.72, H * 0.5, 300, 210); }
      s += label(P ? W / 2 : W * 0.22, P ? 182 : H * 0.72, 'Mycoplasma mycoides', { size: fs });
    } else if (step === 1) {
      s += title('An exact copy, and an empty cell');
      const fx = P ? W * 0.5 : W * 0.24, fy = P ? 134 : H * 0.54, cx = P ? W / 2 - 24 : W * 0.66, cy = P ? 320 : H * 0.52, k = P ? 1.26 : 1.5;
      s += flask(fx, fy, P ? 0.92 : 1.3) + dnaLoop(fx, fy + (P ? 28 : 44), P ? 0.72 : 1, NEW);
      s += label(fx, fy + (P ? 72 : 112), 'Made in the laboratory', { size: fs });
      s += myco(cx, cy, k * 0.92, { seed: 15 }) + `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(40 * k)}" ry="${n1(18 * k)}" ${stroke(T('strata-5'), 2.4, 'stroke-dasharray:6 6;opacity:.8')}/>`;
      s += label(cx + 24, cy + (P ? 66 : 82), 'Its own DNA removed', { size: fs });
    } else if (step === 2) {
      s += title('The cell grows and divides');
      const k = P ? 0.96 : 1.08, rows = P ? [[W / 2 - 24, 104]] : [[W * 0.2, H * 0.5]], kids = P ? [[W / 2 - 24, 234], [W / 2 - 24, 332]] : [[W * 0.66, H * 0.3], [W * 0.66, H * 0.7]];
      for (const [x, y] of rows) s += myco(x, y, k, { seed: 15 }) + dnaLoop(x, y, k * 0.8, NEW);
      for (const [x, y] of kids) s += `<g class="sv-pop">${myco(x, y, k * 0.86, { seed: 16 })}${dnaLoop(x, y, k * 0.8, NEW)}</g>`;
      s += P ? leader(W / 2 - 24, 146, W / 2 - 24, 186, T('elev-peak')) : leader(W * 0.2 + 118, H * 0.46, W * 0.66 - 110, H * 0.32, T('elev-peak')) + leader(W * 0.2 + 118, H * 0.54, W * 0.66 - 110, H * 0.68, T('elev-peak'));
    } else {
      s += title('Only the DNA was synthetic');
      const x = P ? W / 2 - 34 : W * 0.42, y = H * 0.52, k = P ? 1.42 : 2.3;
      s += myco(x, y, k * 0.92, { seed: 15 }) + dnaLoop(x, y, k * 0.8, NEW);
      s += leader(x, y, P ? W * 0.5 : x + 40, P ? H - 64 : H - 62, T('elev-peak')) + label(P ? W * 0.5 : x + 40, H - (P ? 44 : 40), 'Synthetic DNA: made in the laboratory', { size: fs, display: true });
      s += leader(x - 60 * k, y - 24 * k, P ? W * 0.3 : x - 90, P ? 74 : 72, T('elev-peak')) + label(P ? W * 0.5 : x - 40, P ? 64 : 62, 'Membrane and cytoplasm: from a living cell', { size: P ? 14 : fs });
    }
    return { svg: cwFrame(st, 'vs', s) };
  }
}
