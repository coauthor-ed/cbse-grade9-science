// BreedingBoardScene - L05 blk-l05-s07, 5 beats. Beat 0: a row of plants, the best one chosen. Beat 1: stamens out, bag, pollen by hand.
// Beat 2: a stretch of DNA gets a new piece. Beat 3: egg and male gamete in a test tube. Beat 4: a row of jars of saved seed.
import { SvgScene, fill } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK, svgPlantColour as P, stroke } from '../shared/PlantArt.js';
import { frame, phoneMin, backdrop, flowerSection, peaFlower, maizePlant, pollenGrain, FLOWER_COLOURS as C } from '../shared/FlowerArt.js';

const PALE_ = 'var(--sim-elev-peak)';
const big = (x, y, t, o = {}) => words(x, y, t, { size: 22, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6, ...o });
const hide = (no) => (n) => (no.includes(n) ? 'display:none' : '');

export class BreedingBoardScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'Selective breeding picks the best plant in a row. Artificial hybridisation removes stamens, bags the flower and adds pollen by hand. Genetic engineering adds a piece to DNA. An egg and a male gamete fuse in a test tube. Jars of saved seed.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 450 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, fl = H - 44;
    let a = backdrop(['gold', 'trellis', 'bench', 'bench', 'kitchen'][b], W, H, { floor: fl, seed: 2, shelf: b !== 2 && b !== 3 });
    if (b === 0) {
      const n = port ? 3 : 4, s0 = port ? 0.72 : 0.8;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * W / n, best = i === 1;
        a += maizePlant(x, fl + 6, s0 * (best ? 1.18 : 0.86), {});
        if (best) a += `<ellipse class="sv-pop" cx="${x}" cy="${fl - 110 * s0}" rx="${port ? 72 : 86}" ry="${150 * s0 + 40}" style="fill:none;stroke:${ART_INK};stroke-width:2.5;stroke-dasharray:3 7;stroke-linecap:round"/>`;
      }
      a += big(W / 2 , 34, 'Choose the plants you want');
    }
    if (b === 1) {
      const xs = port ? [] : [W * 0.19, W * 0.5, W * 0.81];
      if (port) {
        const r = [[W * 0.26, 170], [W * 0.74, 170], [W * 0.5, 368]], s = 0.5;
        a += flowerSection(r[0][0], r[0][1], s, { part: hide(['stamen']) }) + peaFlower(r[1][0], r[1][1] - 26, 1.14, { stage: 'open', stamens: false, bag: true })
          + flowerSection(r[2][0], r[2][1] - 16, s, { part: hide(['stamen']) }) + pollenGrain(r[2][0] + 2, r[2][1] - 16 - 112, 0.7, {}) + pollenGrain(r[2][0] - 10, r[2][1] - 16 - 114, 0.7, {});
        a += label(r[0][0], r[0][1] + 44, '1 Remove stamens', { size: 15 }) + label(r[1][0], r[1][1] + 44, '2 Cover with bag', { size: 15 }) + label(r[2][0], r[2][1] + 32, '3 Add chosen pollen', { size: 15 });
      } else {
        const y = 276, s = 0.6;
        a += flowerSection(xs[0], y, s, { part: hide(['stamen']) }) + peaFlower(xs[1], y - 40, 1.7, { stage: 'open', stamens: false, bag: true })
          + flowerSection(xs[2], y, s, { part: hide(['stamen']) }) + pollenGrain(xs[2] - 8, y - 160, 0.9, {}) + pollenGrain(xs[2] + 8, y - 158, 0.9, {}) + pollenGrain(xs[2] + 34, y - 186, 0.9, {});
        a += label(xs[0], H - 14, '1 Remove stamens', { size: 16 }) + label(xs[1], H - 14, '2 Cover with a bag', { size: 16 }) + label(xs[2], H - 14, '3 Add chosen pollen', { size: 16 });
      }
    }
    if (b === 2) {
      const y = H * 0.44, x0 = 22, x1 = W - 22, turns = port ? 2.2 : 3.4, N = 160, amp = port ? 70 : 88;
      const pt = (i, ph) => { const u = i / N, t = u * Math.PI * 2 * turns + ph; return [x0 + u * (x1 - x0), y + Math.sin(t) * amp, Math.cos(t)]; };
      const seg = (ph, front) => { let g = ''; for (let i = 0; i < N; i++) { const p = pt(i, ph), q = pt(i + 1, ph); if ((p[2] > 0) === front) g += `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}" ${stroke(front ? 'var(--sim-series-1)' : 'color-mix(in oklab, var(--sim-series-1) 55%, var(--sim-strata-6))', front ? 11 : 9)}/>`; } return g; };
      const inA = 0.38, inB = 0.62;
      let rungs = '';
      for (let i = 2; i < N; i += 5) {
        const p = pt(i, 0), q = pt(i, Math.PI), u = i / N, ins = u > inA && u < inB, mx = (p[1] + q[1]) / 2;
        rungs += `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${p[0].toFixed(1)} ${mx.toFixed(1)}" ${stroke(ins ? 'var(--sim-series-4)' : 'var(--sim-series-2)', 6)}/><path d="M${p[0].toFixed(1)} ${mx.toFixed(1)}L${p[0].toFixed(1)} ${q[1].toFixed(1)}" ${stroke(ins ? 'var(--sim-series-5)' : 'var(--sim-series-3)', 6)}/>`;
      }
      a += seg(0, false) + seg(Math.PI, false) + rungs + seg(0, true) + seg(Math.PI, true);
      const bx = x0 + inA * (x1 - x0), bw = (inB - inA) * (x1 - x0);
      a += `<rect class="sv-pop" x="${bx}" y="${y - amp - 16}" width="${bw}" height="${2 * amp + 32}" rx="14" ${stroke(ART_INK, 2.5, 'stroke-dasharray:3 7')}/>`;
      a += big(W / 2, y + amp + 56, 'New piece of genetic material', { size: port ? 19 : 22 }) + label(W / 2, 34, 'DNA of the chosen variety', { size: 17 });
    }
    if (b === 3) {
      const x = W / 2, top = 56, bot = H - 74, w = port ? 72 : 88;
      a += `<path d="M${x - w} ${top}L${x - w} ${bot - w}A${w} ${w} 0 0 0 ${x + w} ${bot - w}L${x + w} ${top}" style="fill:${P('glass')};fill-opacity:0.6;stroke:${ART_INK};stroke-width:4"/>`;
      a += `<path d="M${x - w + 5} ${top + 90}L${x - w + 5} ${bot - w}A${w - 5} ${w - 5} 0 0 0 ${x + w - 5} ${bot - w}L${x + w - 5} ${top + 90}Z" ${fill(P('gel'), 'opacity:0.75')}/>`;
      a += `<rect x="${x - w - 12}" y="${top - 14}" width="${2 * w + 24}" height="16" rx="8" style="fill:${C.wood};stroke:${ART_INK};stroke-width:3"/>`;
      a += `<circle cx="${x + 8}" cy="${bot - 70}" r="${port ? 28 : 32}" style="fill:${C.pink};stroke:${ART_INK};stroke-width:3"/><circle cx="${x + 8}" cy="${bot - 70}" r="10" ${fill(C.redD)}/>`;
      a += `<circle cx="${x - 42}" cy="${bot - 118}" r="11" style="fill:${C.yel};stroke:${ART_INK};stroke-width:3"/>`;
      a += `<path class="sv-draw" style="--len:80;fill:none;stroke:${ART_INK};stroke-width:3;stroke-dasharray:3 8;stroke-linecap:round" d="M${x - 32} ${bot - 110}C${x - 22} ${bot - 104} ${x - 22} ${bot - 98} ${x - 16} ${bot - 90}"/>`;
      a += label(x + 8, bot - 22, 'Egg', { size: 17 }) + label(x - 12, bot - 142, 'Male gamete', { size: 17 });
      a += big(W / 2, H - 14, 'Fusion in a test tube');
    }
    if (b === 4) {
      a += `<rect x="10" y="${fl - 24}" width="${W - 20}" height="16" rx="6" style="fill:${C.wood};stroke:${C.woodD};stroke-width:2"/>`;
      const n = port ? 3 : 4, tones = [[C.seed, C.yel], [C.yelD, C.yel], [C.bark, C.woodD], [C.leafL, C.seed]];
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * W / n, y = fl - 26, w = port ? 44 : 58, h = port ? 200 : 214, lvl = y - h * (0.72 - i * 0.03), j = 'jr' + i;
        a += `<defs><clipPath id="${j}"><path d="M${x - w + 3} ${y - h + 34}C${x - w + 3} ${y - h + 22} ${x - w * 0.7} ${y - h + 16} ${x - w * 0.6} ${y - h + 8}L${x + w * 0.6} ${y - h + 8}C${x + w * 0.7} ${y - h + 16} ${x + w - 3} ${y - h + 22} ${x + w - 3} ${y - h + 34}L${x + w - 3} ${y - 12}Q${x + w - 3} ${y - 3} ${x + w - 12} ${y - 3}L${x - w + 12} ${y - 3}Q${x - w + 3} ${y - 3} ${x - w + 3} ${y - 12}Z"/></clipPath></defs>`;
        a += `<g clip-path="url(#${j})"><rect x="${x - w}" y="${y - h}" width="${2 * w}" height="${h}" ${fill(P('glass'), 'opacity:0.42')}/>`;
        a += `<rect x="${x - w}" y="${lvl}" width="${2 * w}" height="${y - lvl}" ${fill(tones[i][0])}/>`;
        for (let k = 0; k < 190; k++) { const q1 = Math.abs(Math.sin(k * 12.9898 + i) * 43758.5453) % 1, q2 = Math.abs(Math.sin(k * 78.233 + i) * 12345.678) % 1, px = x - w + q1 * 2 * w, py = lvl + 4 + q2 * (y - lvl - 6); a += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="5" ry="3.2" transform="rotate(${(k * 47) % 180} ${px.toFixed(1)} ${py.toFixed(1)})" style="fill:${k % 3 ? tones[i][1] : tones[i][0]};stroke:${C.woodD};stroke-width:0.7"/>`; }
        a += `<rect x="${x - w * 0.72}" y="${y - h + 30}" width="9" height="${h - 50}" rx="4" ${fill(PALE_, 'opacity:0.5')}/></g>`;
        a += `<path d="M${x - w + 3} ${y - h + 34}C${x - w + 3} ${y - h + 22} ${x - w * 0.7} ${y - h + 16} ${x - w * 0.6} ${y - h + 8}L${x + w * 0.6} ${y - h + 8}C${x + w * 0.7} ${y - h + 16} ${x + w - 3} ${y - h + 22} ${x + w - 3} ${y - h + 34}L${x + w - 3} ${y - 12}Q${x + w - 3} ${y - 3} ${x + w - 12} ${y - 3}L${x - w + 12} ${y - 3}Q${x - w + 3} ${y - 3} ${x - w + 3} ${y - 12}Z" ${stroke(ART_INK, 2.2)}/>`;
        a += `<path d="M${x - w * 0.7} ${y - h + 10}C${x - w * 0.8} ${y - h - 12} ${x + w * 0.8} ${y - h - 12} ${x + w * 0.7} ${y - h + 10}L${x + w * 0.74} ${y - h + 22}L${x + w * 0.4} ${y - h + 14}L${x} ${y - h + 22}L${x - w * 0.4} ${y - h + 14}L${x - w * 0.74} ${y - h + 22}Z" style="fill:${C.cloth};stroke:${C.clothD};stroke-width:2"/><path d="M${x - w * 0.66} ${y - h + 9}L${x + w * 0.66} ${y - h + 9}" ${stroke(C.woodD, 3.5)}/>`;
      }
      a += big(W / 2, 40, 'Saved local seeds');
    }
    return { svg: frame(st, 'bb', a) };
  }
}
