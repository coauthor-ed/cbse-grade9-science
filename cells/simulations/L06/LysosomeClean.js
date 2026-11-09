// LysosomeClean - lysosome box. b0 a worn-out mitochondrion and waste among healthy parts. b1 Join: a lysosome
// reaches it, the membranes join, the enzymes act. b2 the broken pieces leave as small products that reach other parts.
// The worn part stays at one place on every beat. Control: join.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, mitochondrion, lysosome, ribosome, golgi, depthField, n1, rnd, T, mx } from '../shared/CellWorld.js';
import { ctlBar, label, leader, anim } from '../shared/PlantArt.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const sm = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const lerp = (a, b, u) => a + (b - a) * u, RED = 'series-6';
const worn = (x, y, s, a = 1) => `<g opacity="${a}" style="filter:grayscale(.8) brightness(.92)">${mitochondrion(x, y, s, { rot: -14, seed: 4 })}</g>`;
const scrap = (x, y, r) => `<path d="M${n1(x - r)} ${n1(y)}L${n1(x - r * 0.3)} ${n1(y - r)}L${n1(x + r)} ${n1(y - r * 0.2)}L${n1(x + r * 0.2)} ${n1(y + r)}Z" style="fill:${mx('strata-3', 'strata-5', 50)};stroke:${mx('strata-3', 'strata-6', 56)};stroke-width:1.4"/>`;
const prod = (x, y, r = 5) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" style="fill:${T('series-2')};stroke:${mx('series-2', 'strata-6', 56)};stroke-width:1.4"/>`;

export class LysosomeClean extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 680; static HEIGHT = 450; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'A worn-out mitochondrion and bits of waste in the cytoplasm. A lysosome, a sac of enzymes, joins around it. The enzymes break it into small products, which leave the sac and are used again.';
  static CONTROLS = [];
  _j = 0; _go = false; _found = false;
  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'btn', id: 'join', label: 'Join', go: true }], () => {
      if (this._go || this._j) return;
      this._go = true; this.play(3);
      this.after(reducedMotion() ? 0.01 : 3.05, () => { this._go = false; this._j = 1; this.bar.show('join', false); this.repaint(); if (!this._found) { this._found = true; this.celebrate(); } });
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) { this._go = false; this._j = 0; this.bar?.show('join', step === 1); if (step === 2) this.play?.(3.2); }
  stageHeight(st) { return st.portrait ? 390 : 376; }
  _c(st) { const { W, H, portrait: P } = st; return { x: W * (P ? 0.5 : 0.44), y: H * (P ? 0.5 : 0.5), s: P ? 1.2 : 1.7, r: P ? 86 : 118, lx: P ? W - 62 : W - 110, ly: P ? 84 : 110 }; }
  animate(st, t = 0) {
    const step = this.stepIndex, C = this._c(st), P = st.portrait; let d = '';
    if (step === 1) {
      const u = this._go ? sm(t / 1.6) : this._j, x = lerp(C.lx, C.x, u), y = lerp(C.ly, C.y, u), r = lerp(C.r * 0.42, C.r, u);
      d += worn(C.x, C.y, C.s, 1);
      d += `<g opacity="${n1(lerp(1, 0.55, u))}">${lysosome(x, y, r)}</g>`;
      const q = rnd(3), e = this._go ? sm((t - 1.5) / 1.3) : this._j;
      if (u > 0.5) for (let i = 0; i < 26; i++) { const a = q() * 6.28, R = (0.5 + q() * 0.42) * C.r, k = lerp(1, 0.46, e), tw = Math.sin(t * 4 + i); d += `<circle cx="${n1(C.x + Math.cos(a + tw * 0.06) * R * k)}" cy="${n1(C.y + Math.sin(a + tw * 0.06) * R * k * 0.86)}" r="4" style="fill:${mx(RED, 'strata-6', 66)}"/>`; }
    }
    if (step === 2) {
      const u = sm(t / 2.8), q = rnd(9);
      d += `<g opacity="${n1(lerp(0.75, 0.45, u))}">${lysosome(C.x, C.y, lerp(C.r, C.r * 0.56, u))}</g>`;
      for (let i = 0; i < 16; i++) {
        const a = q() * 6.28, r0 = q() * C.r * 0.5, sx = C.x + Math.cos(a) * r0, sy = C.y + Math.sin(a) * r0 * 0.8, tx = q() * st.W, ty = 20 + q() * (st.H - 40), far = Math.hypot(tx - C.x, ty - C.y) > C.r * 0.8;
        d += prod(lerp(sx, far ? tx : C.x + Math.cos(a) * C.r * 1.3, u), lerp(sy, far ? ty : C.y + Math.sin(a) * C.r * 1.2, u));
      }
    }
    anim(this, 'w', d);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, C = this._c(st), size = P ? 14 : 16;
    let g = depthField(W, H, { tone: 'rose', seed: 8 });
    const q = rnd(5); for (let i = 0; i < 24; i++) g += ribosome(q() * W, q() * H, 4);
    g += `<g opacity=".7">${mitochondrion(P ? 70 : 90, P ? 52 : 84, P ? 0.9 : 1.2, { rot: 24, seed: 2 })}${mitochondrion(P ? W - 62 : 120, P ? H - 56 : H - 76, P ? 0.9 : 1.2, { rot: -28, seed: 6 })}${golgi(P ? 66 : W - 90, P ? H - 58 : H - 76, P ? 0.72 : 1, {})}</g>`;
    if (step === 0) {
      g += worn(C.x, C.y, C.s) + scrap(C.x + C.r * 1.02, C.y - C.r * 0.6, 12) + scrap(C.x - C.r * 0.9, C.y + C.r * 0.64, 14) + scrap(C.x + C.r * 0.84, C.y + C.r * 0.7, 10);
      g += label(C.x, P ? C.y - 62 : C.y - 84, 'Worn-out mitochondrion', { size }) + label(C.x + (P ? 34 : 196), P ? C.y + 116 : C.y + 110, 'Waste', { size }) + leader(C.x + (P ? 40 : 170), P ? C.y + 100 : C.y + 94, C.x + C.r * 0.88, C.y + C.r * 0.78);
    }
    g += '<g data-anim="w"></g>';
    if (step === 1) { if (this._j) g += label(C.x, C.y - C.r - 12, 'Enzymes act inside the sac', { size }); else g += label(C.lx, C.ly + C.r * 0.42 + 22, 'Lysosome', { size }); }
    if (step === 2) g += label(W / 2, P ? C.y + C.r * 0.98 : H - 14, 'Dots: products, used again', { size });
    return { svg: cwFrame(st, 'ly', g) };
  }
}
