// ChromatinZoom - Fig 2.12. One line of material throughout: the chromatin thread and the chromosome rod are the same
// points at two arrangements, so the morph itself makes the claim that they are one material.
//   b0  Cell, Nucleus, Chromatin: three zoom levels of a cell that is not dividing. No rods.
//   b1  Thread, Rod: the same line, loose or organised. Lands on the rod after a morph.
//   b2  DNA with proteins, coming out of the rod
//   b3  genes lit as segments of the DNA (drawn much larger than real genes)
// Controls: lvl (cell, nucleus, chromatin), form (thread, rod).
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, animalCell, nucleus, depthField, n1, T, mx, stroke } from '../shared/CellWorld.js';
import { ctlBar, label, leader, anim } from '../shared/PlantArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const sm = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const N = 360, V = 'series-5', LINE = mx(V, 'strata-6', 66), RUNG = ['series-1', 'series-2', 'series-3', 'series-6'];
const threadPt = (i, half, R, cx, cy) => { const s = (i / N) * 6.283 + half * 3.1; return [cx + R * (0.52 * Math.sin(3.1 * s + 0.3) + 0.34 * Math.sin(11 * s) + 0.12 * Math.sin(37 * s)), cy + R * (0.52 * Math.cos(2.3 * s) + 0.33 * Math.sin(9.7 * s + 1) + 0.12 * Math.cos(41 * s))]; };
/** One arm of the chromosome: a tight coil running down a rod that narrows at its waist. */
const rodPt = (i, half, L, W, cx, cy) => { const u = i / N, y = (u * 2 - 1) * L, waist = 0.42 + 0.58 * Math.min(1, Math.abs(u * 2 - 1) * 2.6), x0 = (half ? 1 : -1) * W * (0.98 + 0.5 * Math.abs(u * 2 - 1) ** 2), a = u * 6.283 * 34; return [cx + x0 + Math.sin(a) * W * 0.86 * waist, cy + y + Math.cos(a) * 3]; };
const pathOf = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`).join('');

export class ChromatinZoom extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 680; static HEIGHT = 500; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'Zooming from a cell into its nucleus and its chromatin threads. The same thread organises into a rod-shaped chromosome. The chromosome is made of DNA and proteins, and genes are segments of the DNA.';
  static CONTROLS = [];
  _l = 'cell'; _f = 1; _a = null;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [
      { kind: 'seg', id: 'lvl', label: 'Zoom', value: 'cell', options: [{ value: 'cell', label: 'Cell' }, { value: 'nucleus', label: 'Nucleus' }, { value: 'chromatin', label: 'Chromatin' }] },
      { kind: 'seg', id: 'form', label: 'Form', value: 'rod', options: [{ value: 'thread', label: 'Thread' }, { value: 'rod', label: 'Rod' }] },
    ], (id, v) => {
      if (id === 'lvl') { this._l = v; this.repaint(); } else this._morph(v === 'rod' ? 1 : 0);
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  _morph(to) { this._a = { from: this._f, to }; this._f = to; this.play(1.8); this.repaint(); }
  enter(step) {
    this._l = 'cell'; this._a = null; this.bar?.set('lvl', 'cell'); this.bar?.set('form', 'rod');
    this.bar?.show('lvl', step === 0); this.bar?.show('form', step === 1);
    if (step === 1) { this._f = 0; this._a = { from: 0, to: 1 }; this._f = 1; this.play?.(2.2); } else this._f = 1;
  }
  stageHeight(st) { return st.portrait ? 390 : 430; }
  animate(st, t = 0) {
    if (this.stepIndex !== 1) return;
    const { W, H, portrait: P } = st, a = this._a, k = a ? a.from + (a.to - a.from) * sm(t / 1.7) : this._f;
    const cx = W / 2, cy = H / 2, R = P ? 138 : 176, L = P ? 138 : 164, Wd = P ? 26 : 30; let d = '';
    if (k > 0.4) for (const half of [0, 1]) {
      const sx = half ? 1 : -1, x = (u) => cx + sx * Wd * (0.98 + 0.5 * u * u), w = (u) => Wd * 0.92 * (0.42 + 0.58 * Math.min(1, u * 2.6));
      let l = '', r = ''; for (let i = 0; i <= 40; i++) { const u = Math.abs(i / 20 - 1), y = cy + (i / 20 - 1) * L; l += `${i ? 'L' : 'M'}${n1(x(u) - w(u))} ${n1(y)}`; r = `L${n1(x(u) + w(u))} ${n1(y)}` + r; }
      d += `<path d="${l}${r}Z" style="fill:${mx(V, 'strata-6', 78)};stroke:${mx(V, 'strata-6', 62)};stroke-width:7;stroke-linejoin:round;opacity:${n1((k - 0.4) / 0.6)}"/>`;
    }
    for (const half of [0, 1]) {
      const pts = []; for (let i = 0; i <= N; i++) { const [ax, ay] = threadPt(i, half, R, cx, cy), [bx, by] = rodPt(i, half, L, Wd, cx, cy); pts.push([ax + (bx - ax) * k, ay + (by - ay) * k]); }
      const p = pathOf(pts);
      d += `<path d="${p}" ${stroke(mx(V, 'strata-6', 72), 4.2)} opacity="${n1(0.4 + 0.5 * (1 - k))}"/><path d="${p}" ${stroke(mx(V, 'elev-peak', 56), 2.2)}/>`;
    }
    anim(this, 'w', d);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, size = P ? 14 : 16;
    let g = '';
    const violet = () => `<rect width="${W}" height="${H}" style="fill:url(#cz-v) ${mx(V, 'elev-peak', 30)}"/><defs><radialGradient id="cz-v" cx=".4" cy=".35" r=".8"><stop offset="0" style="stop-color:${mx(V, 'elev-peak', 16)}"/><stop offset=".7" style="stop-color:${mx(V, 'elev-peak', 34)}"/><stop offset="1" style="stop-color:${mx(V, 'elev-peak', 50)}"/></radialGradient></defs>`;
    if (step === 0) {
      const l = this._l, cx = W / 2, cy = H / 2;
      if (l === 'cell') { g += depthField(W, H, { tone: 'blue', seed: 5 }) + animalCell(cx, cy, P ? 136 : 176, { seed: 9 }); g += label(W / 2, 26, 'A cell that is not dividing', { size }); }
      if (l === 'nucleus') { g += violet() + nucleus(cx, cy, P ? 136 : 168, { seed: 4 }); g += label(W / 2, 26, 'Its nucleus', { size }); }
      if (l === 'chromatin') {
        g += violet();
        for (const half of [0, 1, 2, 3]) { const pts = []; for (let i = 0; i <= N; i++) pts.push(threadPt(i, half * 0.7, (P ? 150 : 200) * 1.1, cx, cy)); const p = pathOf(pts); g += `<path d="${p}" ${stroke(mx(V, 'strata-6', 72), 4.6)} opacity=".42"/><path d="${p}" ${stroke(mx(V, 'elev-peak', 56), 2.4)}/>`; }
        g += label(W / 2, 26, 'Entangled threads, no rods', { size });
      }
    }
    if (step === 1) {
      g += violet() + '<g data-anim="w"></g>';
      g += label(W / 2, 26, this._f ? 'Chromosome: about to divide' : 'Chromatin: not dividing', { size });
    }
    if (step >= 2) {
      g += violet();
      const y0 = H * (P ? 0.62 : 0.58) - (step === 3 ? 30 : 0), A = P ? 34 : 44, per = P ? 62 : 74, x0 = -10, on = step === 3, q = (x) => y0 + Math.sin((x / per) * 6.283) * A, r = (x) => y0 - Math.sin((x / per) * 6.283) * A;
      const genes = P ? [[40, 110], [190, 268]] : [[70, 200], [330, 430], [520, 610]], inGene = (x) => genes.some(([a, b]) => x >= a && x <= b);
      // the rod the DNA comes from
      if (step === 2) {
        const rx = P ? 56 : 92, ry = P ? 74 : 96;
        for (const half of [0, 1]) { const pts = []; for (let i = 0; i <= 240; i++) pts.push(rodPt(i * 1.5, half, P ? 56 : 74, 12, rx, ry)); g += `<path d="${pathOf(pts)}" ${stroke(mx(V, 'elev-peak', 50), 2.2)}/>`; }
        g += `<path d="M${rx + 6} ${ry + (P ? 46 : 60)}C${rx + 30} ${ry + 100} ${rx + 50} ${y0 - 40} ${rx + 90} ${y0 - 34}" style="fill:none;stroke:${LINE};stroke-width:3;stroke-dasharray:7 7;opacity:.7"/>`;
        g += label(rx + (P ? 76 : 96), ry - (P ? 40 : 54), 'Chromosome', { size });
      }
      let back = '', front = '';
      for (let x = x0; x < W + 12; x += per / 9) {
        const i = Math.round((x - x0) / (per / 9)), c = RUNG[i % 4], lit = !on || inGene(x), s = Math.sin((x / per) * 6.283);
        const bar = `<path d="M${n1(x)} ${n1(q(x))}L${n1(x)} ${n1(r(x))}" ${stroke(lit ? T(c) : mx(c, 'elev-peak', 28), 5)} ${lit ? '' : 'opacity=".55"'}/>`;
        if (Math.abs(s) > 0.14) back += bar;
      }
      let s1 = '', s2 = ''; for (let x = x0; x <= W + 12; x += 4) { s1 += `${s1 ? 'L' : 'M'}${n1(x)} ${n1(q(x))}`; s2 += `${s2 ? 'L' : 'M'}${n1(x)} ${n1(r(x))}`; }
      front = `<path d="${s1}" ${stroke(mx(V, 'strata-6', 60), 10)}/><path d="${s1}" ${stroke(mx(V, 'elev-peak', 60), 6)}/><path d="${s2}" ${stroke(mx('series-7', 'strata-6', 60), 10)}/><path d="${s2}" ${stroke(mx('series-7', 'elev-peak', 50), 6)}/>`;
      g += back + front;
      if (step === 2) {
        const bead = (x, y, rr) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${rr}" style="fill:url(#cw-prot) ${T(V)};stroke:${mx(V, 'strata-6', 62)};stroke-width:2"/><ellipse cx="${n1(x - rr * 0.3)}" cy="${n1(y - rr * 0.4)}" rx="${n1(rr * 0.3)}" ry="${n1(rr * 0.16)}" style="fill:${T('elev-peak')};opacity:.7"/>`;
        const bx = P ? [62, 220] : [190, 440, 620]; for (const x of bx) g += bead(x, y0, P ? 22 : 26);
        g += label(bx[bx.length - 1] - (P ? 0 : 20), y0 + A + (P ? 40 : 46), 'Protein', { size }) + leader(bx[bx.length - 1] - (P ? 0 : 10), y0 + A + (P ? 26 : 30), bx[bx.length - 1], y0 + 26);
        g += label(W / 2 + (P ? 0 : 20), H - 14, 'DNA', { size: P ? 15 : 17 });
      }
      if (on) {
        for (const [a, b] of genes) {
          const yb = y0 - A - 22;
          g += `<path d="M${a} ${yb + 10}V${yb}H${b}V${yb + 10}" ${stroke(T('strata-6'), 3)}/>` + label((a + b) / 2, yb - 8, 'Gene', { size: P ? 15 : 17 });
        }
        g += label(W / 2, 26, 'Functional segments of DNA', { size });
      }
    }
    return { svg: cwFrame(st, 'cz', g) };
  }
}
