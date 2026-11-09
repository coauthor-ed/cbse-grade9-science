// HandFormScene - blk-l07-s10d. Plain, no gore. Beat 0: an early hand with webbing between the digits; the cells between
// the digits are marked. Beat 1: those cells go, row by row, and five fingers stand apart. The outline of the digits never
// changes; only the web goes.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, anim } from '../shared/PlantArt.js';
import { cwFrame, mx, n1, rnd } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];
const SK = mx('strata-1', 'series-6', 80), SK2 = mx(SK, 'elev-peak', 58), DK = mx(SK, 'strata-6', 62);
// digit: base x, base y, tip x, tip y, half width
const D = [[-92, -6, -176, -86, 21], [-52, -60, -86, -190, 22], [0, -66, 0, -216, 23], [50, -60, 84, -196, 22], [88, -30, 150, -142, 20]];
const capsule = (a, b, c, e, w) => { const l = Math.hypot(c - a, e - b), ux = (c - a) / l, uy = (e - b) / l, nx = -uy * w, ny = ux * w; return `M${n1(a + nx)} ${n1(b + ny)}L${n1(c + nx)} ${n1(e + ny)}A${w} ${w} 0 0 0 ${n1(c - nx)} ${n1(e - ny)}L${n1(a - nx)} ${n1(b - ny)}Z`; };

export class HandFormScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static WIDTH = 640;
  static HEIGHT = 424;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A drawing of a developing hand with webbing between its digits. The cells between the digits are marked, and then they are removed, leaving five separate fingers.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 410; }
  enter(step) { if (step === 1) this.play(3.2); }

  _web(u) {
    // the web: a thin skin between neighbouring digits, and the small cells in it. Each cell goes when u passes its moment, far end first.
    let s = '';
    for (let i = 0; i < D.length - 1; i++) {
      const a = D[i], b = D[i + 1], q = rnd(i + 2);
      const f = (d, v) => [d[0] + (d[2] - d[0]) * v, d[1] + (d[3] - d[1]) * v];
      const p1 = f(a, 0), p2 = f(a, 0.78), p3 = f(b, 0.78), p4 = f(b, 0);
      s += `<path d="M${n1(p1[0])} ${n1(p1[1])}L${n1(p2[0])} ${n1(p2[1])}Q${n1((p2[0] + p3[0]) / 2)} ${n1((p2[1] + p3[1]) / 2 + 18)} ${n1(p3[0])} ${n1(p3[1])}L${n1(p4[0])} ${n1(p4[1])}Z" style="fill:${mx(SK, 'elev-peak', 60)};opacity:${n1(Math.max(0, 1 - u * 1.25))}"/>`;
      for (let j = 0; j < 9; j++) for (let m = 0; m < 3; m++) {
        const v = 0.12 + j * 0.078, w = 0.32 + m * 0.18, pa = f(a, v), pb = f(b, v);
        const x = pa[0] + (pb[0] - pa[0]) * w + (q() - 0.5) * 3, y = pa[1] + (pb[1] - pa[1]) * w + (q() - 0.5) * 3, at = 0.8 - v * 0.9 + q() * 0.08;
        if (u > at + 0.14) continue;
        const o = u < at ? 1 : 1 - (u - at) / 0.14;
        s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="6.4" style="fill:${mx('series-2', 'elev-peak', 44)};stroke:${mx('series-2', 'strata-6', 66)};stroke-width:1.4;opacity:${n1(o)}"/>`;
      }
    }
    return s;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, k = P ? 0.8 : 0.84, cx = W / 2, cy = H * 0.64;
    let s = `<defs><radialGradient id="hf-b" cx=".5" cy=".4" r=".8"><stop offset="0" style="stop-color:${mx('strata-1', 'elev-peak', 18)}"/><stop offset="1" style="stop-color:${mx('strata-1', 'elev-peak', 62)}"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#hf-b) ${mx('strata-1', 'elev-peak', 30)}"/>`;
    s += `<defs><radialGradient id="hf-g" cx=".36" cy=".26" r=".9"><stop offset="0" style="stop-color:${SK2}"/><stop offset="1" style="stop-color:${SK}"/></radialGradient></defs>`;
    let fingers = '';
    for (const [a, b, c, e, w] of D) fingers += `<path d="${capsule(a, b, c, e, w)}" style="fill:url(#hf-g) ${SK};stroke:${DK};stroke-width:3;stroke-linejoin:round"/>`;
    const palm = `<path d="M-108 -14C-112 -60 -60 -78 0 -78C60 -78 112 -50 106 -6C102 40 74 66 60 130H-60C-74 66 -104 40 -108 -14Z" style="fill:url(#hf-g) ${SK};stroke:${DK};stroke-width:3;stroke-linejoin:round"/>`;
    const u = step === 0 ? 0 : (this.clock ?? 0) / 3.2;
    s += `<g transform="translate(${n1(cx)} ${n1(cy)}) scale(${k})"><g data-anim="web">${this._web(u)}</g>${fingers}${palm}</g>`;
    const line = step === 0 ? 'Cells between the digits are marked' : 'Those cells go: five fingers stand apart';
    s += label(W / 2, P ? 26 : 30, line, { size: P ? 16 : 21, display: true });
    return { svg: cwFrame(st, 'hf', s) };
  }
  animate(st, t) { if (this.stepIndex === 1) anim(this, 'web', this._web(t / 3.2)); }
}
