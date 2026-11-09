// ErNetwork - Fig 2.13, top. One continuous sac runs from the outer nuclear membrane through the rough ER and out into
// the smooth ER tubes: drawn as one lumen, so continuity is the drawing itself. Free ribosomes lie in the cytoplasm.
//   b0 ribosomes lit, b1 rough ER lit, b2 smooth ER lit, b3 the link to the nuclear membrane lit
// Chips (part: ribosome, rough, smooth) on b0 to b2 relight any part.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, nucleus, ribosome, depthField, n1, rnd, T, mx, stroke } from '../shared/CellWorld.js';
import { ctlBar, label, leader } from '../shared/PlantArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const pol = (cx, cy, r, a) => [cx + Math.cos(a * 0.01745) * r, cy + Math.sin(a * 0.01745) * r];
const V = 'series-5', G = 'series-3';
const BY_STEP = ['ribosome', 'rough', 'smooth', 'link'];

function geo(st) {
  const { W, H, portrait: P } = st;
  return P ? { cx: 34, cy: H * 0.44, r: 84, r0: 112, gap: 34, w: 20, a0: -60, a1: 60, sm: [[182, 300], [230, 340], [288, 300]] }
    : { cx: 110, cy: H * 0.5, r: 118, r0: 150, gap: 46, w: 26, a0: -58, a1: 58, sm: [[370, 372], [470, 330], [590, 372]] };
}
function lumen(g) {
  const { cx, cy, r0, gap, a0, a1 } = g, R = [r0, r0 + gap, r0 + 2 * gap];
  const [nx, ny] = pol(cx, cy, g.r, a0), P = (r, a) => pol(cx, cy, r, a).map(n1).join(' ');
  let d = `M${n1(nx)} ${n1(ny)}L${P(R[0], a0)}`;
  d += `A${R[0]} ${R[0]} 0 0 1 ${P(R[0], a1)}`;
  d += `A${gap / 2} ${gap / 2} 0 0 0 ${P(R[1], a1)}`;
  d += `A${R[1]} ${R[1]} 0 0 0 ${P(R[1], a0)}`;
  d += `A${gap / 2} ${gap / 2} 0 0 1 ${P(R[2], a0)}`;
  d += `A${R[2]} ${R[2]} 0 0 1 ${P(R[2], a1)}`;
  return d;
}
const tube = (d, c, w) => `<path d="${d}" ${stroke(mx(c, 'strata-6', 60), w + 4)}/><path d="${d}" ${stroke(`url(#cw-er) ${mx(c, 'elev-peak', 56)}`, 0)}/><path d="${d}" ${stroke(mx(c, 'elev-peak', 56), w)}/><path d="${d}" ${stroke(T('elev-peak'), w * 0.2)} opacity=".5"/>`;

export class ErNetwork extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 680; static HEIGHT = 500; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'A nucleus on the left. From its outer membrane one continuous folded sac spreads through the cytoplasm: rough endoplasmic reticulum studded with ribosomes, running on into smooth tubes with none. Other ribosomes lie free in the cytoplasm.';
  static CONTROLS = [];
  _lit = 'ribosome';
  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'seg', id: 'part', label: 'Light', value: 'ribosome', options: [{ value: 'ribosome', label: 'Ribosomes' }, { value: 'rough', label: 'Rough ER' }, { value: 'smooth', label: 'Smooth ER' }] }], (id, v) => { this._lit = v; this.repaint(); });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) { this._lit = BY_STEP[step] ?? 'ribosome'; this.bar?.set('part', this._lit); this.bar?.show('part', step < 3); }
  stageHeight(st) { return st.portrait ? 390 : 430; }
  paint(st) {
    const { W, H, portrait: P } = st, g0 = geo(st), lit = this._lit, size = P ? 14 : 16, dim = (on) => (on ? 1 : 0.3), { cx, cy, r, r0, gap, w, a0, a1 } = g0;
    let g = depthField(W, H, { tone: 'blue', seed: 14 });
    const roughOn = lit === 'rough' || lit === 'link', smOn = lit === 'smooth' || lit === 'link', rbOn = lit === 'ribosome';
    // ER lumen, one path
    const d = lumen(g0), end = pol(cx, cy, r0 + 2 * gap, a1);
    const [s1, s2, s3] = g0.sm;
    const sd = `M${n1(end[0])} ${n1(end[1])}C${n1(end[0] + 30)} ${n1(end[1] + 30)} ${s1[0] - 20} ${s1[1] - 30} ${s1[0]} ${s1[1]}C${s1[0] + 26} ${s1[1] + 24} ${s2[0] - 30} ${s2[1] + 30} ${s2[0]} ${s2[1]}S${s3[0] - 30} ${s3[1] - 40} ${s3[0]} ${s3[1]}`;
    const b1 = `M${s1[0]} ${s1[1]}C${s1[0] + 20} ${s1[1] - 60} ${s2[0] - 30} ${s2[1] - 90} ${s2[0] + 8} ${s2[1] - 96}`, b2 = `M${s2[0]} ${s2[1]}C${s2[0] + 30} ${s2[1] - 40} ${s3[0] - 10} ${s3[1] - 90} ${s3[0] + 16} ${s3[1] - 120}`;
    g += `<g opacity="${dim(smOn)}">${tube(b1, G, w * 0.56)}${tube(b2, G, w * 0.56)}${tube(sd, G, w * 0.62)}</g>`;
    g += `<g opacity="${dim(roughOn)}">${tube(d, V, w)}</g>`;
    // ribosomes on the sac, and free ones
    const q = rnd(6); let rb = '', fr = ''; const rr = P ? 3.4 : 4.2;
    for (const R of [r0, r0 + gap, r0 + 2 * gap]) {
      const n = Math.round(((a1 - a0) * 0.01745 * R) / (P ? 10 : 12));
      for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; for (const sgn of [-1, 1]) { const [x, y] = pol(cx, cy, R + sgn * (w / 2 + rr * 0.9), a + (sgn > 0 ? 0.6 : -0.6)); rb += ribosome(x, y, rr); } }
    }
    for (let i = 0; i < (P ? 40 : 60); i++) { const x = W * (0.42 + q() * 0.56), y = 14 + q() * (H - 28); if (Math.hypot(x - cx, y - cy) > r0 + 2 * gap + 24 && (P ? y < H * 0.62 : y < H * 0.64)) fr += ribosome(x, y, rr * 1.2); }
    g += `<g opacity="${lit === 'ribosome' || lit === 'rough' ? 1 : 0.3}">${rb}</g><g opacity="${dim(rbOn)}">${fr}</g>`;
    // nucleus, in front of the root of the sac
    g += `<g opacity="${lit === 'link' ? 1 : 0.46}">${nucleus(cx, cy, r, { seed: 7 })}</g>`;
    if (lit === 'link') {
      const [nx, ny] = pol(cx, cy, r, a0), [ex, ey] = pol(cx, cy, r0, a0);
      g += `<path d="M${n1(pol(cx, cy, r, -90)[0])} ${n1(pol(cx, cy, r, -90)[1])}A${r} ${r} 0 0 1 ${n1(nx)} ${n1(ny)}L${n1(ex)} ${n1(ey)}A${r0} ${r0} 0 0 1 ${n1(pol(cx, cy, r0, a0 + 34)[0])} ${n1(pol(cx, cy, r0, a0 + 34)[1])}" ${stroke(T('series-2'), 6)}/>`;
      g += P ? label(12, 22, 'One continuous', { size, anchor: 'start' }) + label(12, 40, 'membrane', { size, anchor: 'start' }) + leader(50, 46, ex - 4, ey - 6) : label(W - 22, 32, 'One continuous membrane', { size, anchor: 'end' }) + leader(W - 190, 40, ex + 8, ey - 8);
    }
    if (lit === 'ribosome') {
      const fx = W * 0.84; g += label(fx, 26, 'Free ribosomes', { size }) + label(P ? W * 0.64 : W * 0.6, H - 14, 'Attached ribosomes', { size });
      const [ax, ay] = pol(cx, cy, r0 + 2 * gap + w / 2 + 5, 42); g += leader(P ? W * 0.5 : W * 0.54, H - 30, ax, ay);
    }
    if (lit === 'rough') { const [ax, ay] = pol(cx, cy, r0 + gap, -30); g += label(W - (P ? 14 : 30), P ? 28 : 50, 'Rough ER', { size, anchor: 'end' }) + leader(W - (P ? 60 : 110), P ? 34 : 56, ax, ay); }
    if (lit === 'smooth') g += P ? label(14, H - 16, 'Smooth ER: no ribosomes', { size, anchor: 'start' }) + leader(150, H - 32, s2[0] - 6, s2[1] + 4) : label(W - 30, H * 0.42, 'Smooth ER: no ribosomes', { size, anchor: 'end' });
    return { svg: cwFrame(st, 'er', g) };
  }
}
