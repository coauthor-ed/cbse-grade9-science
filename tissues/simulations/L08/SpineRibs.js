// SpineRibs - blk-l08-s10 (4 beats: answer, skull, spine, discs) and blk-l08-s11 (3 beats: feel, joins, breathe).
// Steps 0-3 (s10): the whole skeleton with its three jobs tagged; the skull in side view, cut away to show the brain,
// eye and inner ear it protects; the vertebral column from the skull base down, lit vertebra by vertebra from the top;
// the cartilage discs between the vertebrae, with Stand / Bend: bending squeezes the front of each disc and opens its
// back while the spinal cord stays safe inside the arches. Steps 4-6 (s11): the rib cage from the front, 12 pairs, with
// the heart and lungs behind; the ribs joined to the spine at the back and to the sternum at the front by flexible
// cartilage (an inset shows one pair from above); breathing in lifts and widens the cage, the lungs fill and the
// diaphragm drops; breathing out reverses it. Breathe in / Breathe out in the scene. Clinical, calm, no faces.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapMin, TAP_MIN_CSS } from '../shared/TapMin.js';
import { flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwDefs, T, mx } from '../shared/CellWorld.js';
import { BODY_CSS, frame, field, tag, leader, txt, n } from '../shared/BodyArt.js';
import { skeletonFront, ribCageFront, spineChain, spineSide, skullSide, ribTop, AIRWAY_D, domeY, CORD_D, CART_D } from '../shared/SkeletonArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6');
const S10 = [one(0), one(1), one(2), one(3)];
const S11 = [one(4), one(5), one(6)];

// a clinical body panel: cool, soft, lit from the top left
const back = (st, id) => field(st, id, { a: 1, b: 4, k: 9, seed: 5 });

// skull space -> stage (skullSide's transform: translate, rotate(-deg * 0.6), scale)
function skPt(x, y, k, deg, u, v) {
  const r = (-deg * 0.6 * Math.PI) / 180;
  return [x + k * (u * Math.cos(r) - v * Math.sin(r)), y + k * (u * Math.sin(r) + v * Math.cos(r))];
}
// the column placed so its top lands at (tx, ty)
function column(k, bend, tx, ty) {
  const ch0 = spineChain([0, 0], { k, bend });
  const dx = tx - ch0.top[0], dy = ty - ch0.top[1];
  return spineChain([dx, dy], { k, bend });
}
const segPt = (ch, name, v = 0, u = 0) => {
  const sg = ch.segs.find((s) => s.name === name), r = (sg.a * Math.PI) / 180;
  return [sg.c[0] + Math.cos(r) * v - Math.sin(r) * u, sg.c[1] - Math.sin(r) * v - Math.cos(r) * u];
};

export class SpineRibs extends SvgScene {
  static BEAT_STEP_MAP = S10;
  static BEAT_MAPS = { 4: S10, 3: S11 };
  static WIDTH = 640;
  static HEIGHT = 534;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 574;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'The human skeleton. Its three jobs: it supports the body, protects delicate organs and gives muscles bones to pull on. The skull, a case of flat bones joined by fixed joints, protects the brain, eyes and ears. The vertebral column runs from the base of the skull, a series of small vertebrae with a disc of cartilage between each pair; when the back bends the discs squeeze at the front and the spinal cord inside stays safe. The rib cage has 12 pairs of ribs joined to the spine at the back and to the sternum at the front by flexible cartilage, with the heart and lungs behind; it lifts and widens when breathing in and falls back when breathing out.';
  static CONTROLS = [];

  bend = 0; breath = 0; _from = 0; _to = 0; _found = {};

  async setup() {
    await super.setup(); tapMin(this);
    bindFlow(this.root, { action: (a, v) => this._act(a, v) });
  }
  css() {
    return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 50px; }' + BODY_CSS + TAP_MIN_CSS
      + ' svg .sr-seq { animation: sr-seq .5s ease-out var(--d, 0s) both; } @keyframes sr-seq { from { opacity: .25; } }';
  }
  stageHeight(st) { return st.portrait ? 500 : 460; }
  enter(step) {
    this.bend = 0; this.breath = 0; this._from = 0; this._to = 0;
    if (step === 6) this.after(0.6, () => this._breathe(1));
  }
  _act(a, v) {
    if (a === 'pose' && this.stepIndex === 3) {
      this.bend = v === 'bend' ? 1 : 0;
      this.repaint();
      if (this.bend && !this._found.bend) { this._found.bend = true; const p = this._insetC; if (p) this.celebrate(p[0], p[1]); }
    } else if (a === 'breath' && this.stepIndex === 6) {
      this._breathe(v === 'in' ? 1 : 0);
      if (v === 'in' && !this._found.breath) { this._found.breath = true; this.celebrate(this.sv.W * 0.4, this.sv.H * 0.4); }
    }
  }
  _breathe(to) {
    this._from = this.breath; this._to = to; this.breath = to;
    this.repaint();
    this.play(1.6);
  }
  _b(t) {
    const u = Math.max(0, Math.min(1, (t ?? 1.6) / 1.6)), e = u * u * (3 - 2 * u);
    return this._from + (this._to - this._from) * e;
  }

  // ---------------------------------------------------------------- per step
  paint(st) {
    const step = this.stepIndex;
    if (step <= 3) return this._s10(st, step);
    return this._s11(st, step);
  }

  _s10(st, step) {
    const W = st.W, H = st.H, P = st.portrait, fs = P ? 14 : 15;
    let s = '', head = '';
    if (step === 0) {
      const k = (H - 26) / 566, x = W * (P ? 0.3 : 0.36), y = 12;
      s += skeletonFront(x, y, k, { muscle: true, lit: (p) => p === 'muscle' });
      const X = (v) => x + v * k, Y = (v) => y + v * k;
      // the three jobs, each pointing at the bones that do it
      const tx = P ? W - 8 : W * 0.6, an = P ? 'end' : 'start';
      const rows = [
        ['protects', [[X(14), Y(26)], [X(26), Y(170)]], Y(70), 'skull, rib cage'],
        ['pulled on', [[X(70), Y(176)]], Y(196), 'muscles pull bones'],
        ['supports', [[X(4), Y(240)], [X(30), Y(470)]], Y(318), 'backbone, legs'],
      ];
      for (const [t, pts, ty, sub] of rows) {
        const w = t.length * 17 * 0.56 + 22, x0 = an === 'end' ? tx - w : tx;
        for (const [px, py] of pts) s += leader(x0 - 2, ty, px, py, INK, 2, 0.75);
        s += tag(tx, ty, t, { size: 17, anchor: an, display: true });
        s += txt(an === 'end' ? tx : tx + 4, ty + 28, sub, { size: fs, anchor: an });
      }
      if (!P) s += txt(X(-80), Y(20), 'skeleton', { size: 18, display: true, anchor: 'end' });
    } else if (step === 1) {
      const k = P ? 1.15 : 1.5, bx = W * (P ? 0.56 : 0.5), by = H * (P ? 0.58 : 0.68);
      const ch = column(k * 0.9, 0, bx, by);
      s += `<g style="opacity:.5">${spineSide(ch, { dim: () => false })}</g>`;
      s += skullSide(bx, by, k, ch.a, { lit: (p) => p === 'skull' || p === 'joints' });
      const q = (u, v) => skPt(bx, by, k, ch.a, u, v);
      const lab = (t, u, v, lx, ly, an = 'start') => { const [px, py] = q(u, v); return leader(lx + (an === 'end' ? 4 : -4), ly, px, py, INK, 2, 0.8) + tag(lx, ly, t, { size: fs + 1, anchor: an, display: true }); };
      const R = W - (P ? 10 : 28);
      if (P) {
        s += lab('brain', 4, -96, 12, 34, 'start') + lab('skull', -84, -112, R, 34, 'end') + lab('eye', -82, -36, 12, H * 0.64, 'start') + lab('ear', -4, -30, R, H * 0.66, 'end');
        s += lab('fixed joints', -56, -100, R, 82, 'end');
      } else {
        s += lab('brain', 4, -96, 28, 60, 'start') + lab('skull: flat bones', -84, -114, R, 44, 'end') + lab('eye', -82, -36, 28, H * 0.6, 'start') + lab('ear', -4, -30, R, H * 0.6, 'end');
        s += lab('fixed joints', -56, -100, R, 104, 'end');
      }
    } else {
      const k = step === 2 ? (P ? 0.62 : 0.76) : (P ? 0.56 : 0.64), bx = W * (step === 2 ? (P ? 0.44 : 0.4) : (P ? 0.2 : 0.24)), ty = step === 2 ? (P ? 84 : 92) : (P ? 92 : 104);
      const ch = column(k, step === 3 ? this.bend : 0, bx, ty);
      s += spineSide(ch, step === 2 ? { seq: 'sr-seq', lit: (p) => p === 'cervical' || p === 'thoracic' || p === 'lumbar' } : { lit: (p) => p === 'disc' || p === 'cord', dim: (p) => p === 'bone' });
      s += skullSide(ch.top[0], ch.top[1], k * 0.86, ch.a, { dim: () => true });
      if (step === 2) {
        const reg = [['neck', 'C4'], ['chest', 'T6'], ['lower back', 'L3']];
        for (const [t, nm] of reg) { const [px, py] = segPt(ch, nm, -16 * k); s += leader(px - 40, py, px - 6, py, INK, 2, 0.6) + txt(px - 46, py + 5, t, { size: fs, anchor: 'end' }); }
        const [vx, vy] = segPt(ch, 'T9', 30 * k, 0);
        const lx = P ? W - 8 : W * 0.66;
        s += leader(lx - 4, vy, vx, vy, INK, 2, 0.8) + tag(lx, vy, 'a vertebra', { size: fs + 1, anchor: P ? 'end' : 'start', display: true });
        s += tag(P ? W - 8 : W * 0.66, P ? 150 : 170, 'vertebral column', { size: fs + 2, anchor: P ? 'end' : 'start', display: true });
        s += txt(P ? W - 8 : W * 0.66 + 4, (P ? 150 : 170) + 30, 'small bones in a series', { size: fs, anchor: P ? 'end' : 'start' });
        s += txt(P ? W - 8 : W * 0.66 + 4, (P ? 150 : 170) + 50, 'from the base of the skull', { size: fs, anchor: P ? 'end' : 'start' });
      } else {
        // the inset: three lower-back vertebrae and two discs, close up
        const cx = P ? W * 0.66 : W * 0.66, cy = P ? H * 0.42 : H * 0.46, R = P ? 106 : 160, kk = P ? 2.3 : 3.2;
        this._insetC = [cx, cy];
        const ci = spineChain([0, 0], { k: kk, bend: this.bend });
        const m = ci.segs[2].c, sx = cx - m[0] - (P ? 6 : 10), sy = cy - m[1];
        const ins = spineChain([sx, sy], { k: kk, bend: this.bend });
        const [lx, ly] = segPt(ch, 'L3', 0, 0);
        s += `<path d="M${n(lx + 18 * k)} ${n(ly - 30 * k)}L${n(cx - R * 0.94)} ${n(cy - R * 0.3)}M${n(lx + 18 * k)} ${n(ly + 30 * k)}L${n(cx - R * 0.94)} ${n(cy + R * 0.3)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:5 5;opacity:.55"/>`;
        s += `<circle cx="${n(cx + 3)}" cy="${n(cy + 6)}" r="${R}" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${R}" style="fill:${mx('series-1', 'elev-peak', 12)}"/>`;
        s += `<clipPath id="sr-in"><circle cx="${n(cx)}" cy="${n(cy)}" r="${R - 1}"/></clipPath><g clip-path="url(#sr-in)">${spineSide(ins, { cordTop: true, lit: (p) => p === 'disc' || p === 'cord' })}</g>`;
        s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${R}" style="fill:none;stroke:${INK};stroke-width:3"/>`;
        const [dx, dy] = segPt(ins, 'L3', 0, -ins.segs[2].h / 2 - 2.5 * kk);
        const [qx, qy] = segPt(ins, 'L3', ins.segs[2].bw / 2 + 5 * kk, 0);
        const [vx, vy] = segPt(ins, 'L2', -4 * kk, 0);
        const tY = cy + R + (P ? 22 : 26);
        s += leader(cx - R * 0.5, tY - 12, dx, dy, CART_D, 2.4) + tag(cx - R * 0.5, tY, 'disc of cartilage', { size: fs, display: true });
        s += leader(cx + R * 0.62, tY - 12, qx, qy, CORD_D, 2.4) + tag(cx + R * 0.62, tY + (P ? 34 : 0), 'spinal cord', { size: fs, display: true });
        s += tag(cx, cy - R - (P ? 14 : 18), 'vertebra', { size: fs }) + leader(cx, cy - R - 2, vx, vy, INK, 2, 0.7);
        if (this.bend) s += txt(cx, cy - R - (P ? 40 : 48), 'front squeezed, back opens', { size: fs, display: true });
        head = flowChoiceHtml({ action: 'pose', label: 'Back', value: this.bend ? 'bend' : 'stand', options: [{ value: 'stand', label: 'Stand' }, { value: 'bend', label: 'Bend' }] });
      }
    }
    return { svg: frame(st, 'sr', `<defs>${cwDefs()}</defs>${s}`, { back: back(st, 'srb') }), head };
  }

  _cageGeo(st) {
    const P = st.portrait, W = st.W;
    return P ? { x: W * 0.5, y: 84, k: 1.8 } : { x: W * 0.37, y: 112, k: 2.45 };
  }
  _cage(st, step, b) {
    const g = this._cageGeo(st), W = st.W, H = st.H, P = st.portrait, fs = P ? 14 : 15;
    const lit = step === 4 ? (p) => p === 'ribs' || p === 'cart' || p === 'sternum' : step === 5 ? (p) => p === 'cart' || p === 'sternum' || p === 'spine' : (p) => p === 'organs' || p === 'dia';
    const dim = step === 5 ? (p) => p === 'organs' || p === 'dia' : () => false;
    let s = ribCageFront(g.x, g.y, g.k, { organs: true, airway: true, breath: b, lit, dim });
    const X = (v) => g.x + v * g.k, Y = (v) => g.y + v * g.k;
    if (step === 4) {
      const ribs = P ? [0, 3, 6, 9, 11] : [...Array(12).keys()];
      for (const i of ribs) {
        const w = (24 + 46 * Math.sin(Math.PI * Math.min(1, (i + 1.6) / 12.4) * 0.86)), ya = 6 + i * 7.6, d = 13 + i * 2.2;
        s += txt(X(w + 7), Y(ya + d * 0.42) + 5, String(i + 1), { size: 14, anchor: 'start', weight: 800 });
      }
      if (P) {
        s += tag(10, H - 120, '12 pairs of ribs', { size: fs + 2, anchor: 'start', display: true });
        s += leader(W - 92, H - 70, X(9), Y(62), INK, 2, 0.8) + tag(W - 10, H - 70, 'heart', { size: fs, anchor: 'end' });
        s += leader(98, H - 70, X(-34), Y(60), INK, 2, 0.8) + tag(10, H - 70, 'lungs', { size: fs, anchor: 'start' });
        s += tag(W / 2, H - 22, 'rib cage', { size: fs + 1, display: true });
      } else {
        const lx = W * 0.76;
        s += tag(lx, 60, 'rib cage', { size: fs + 3, anchor: 'start', display: true }) + txt(lx + 4, 92, '12 pairs of ribs', { size: fs, anchor: 'start' });
        s += leader(lx - 4, H * 0.5, X(18), Y(60), INK, 2, 0.8) + tag(lx, H * 0.5, 'heart', { size: fs + 1, anchor: 'start' });
        s += leader(lx - 4, H * 0.66, X(52), Y(78), INK, 2, 0.8) + tag(lx, H * 0.66, 'lungs', { size: fs + 1, anchor: 'start' });
      }
    } else if (step === 5) {
      // the inset: one pair of ribs from above
      const cx = P ? W * 0.5 : W * 0.84, cy = P ? H - 108 : H * 0.62, R = P ? 64 : 88;
      s += `<circle cx="${n(cx + 3)}" cy="${n(cy + 5)}" r="${R + 6}" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${R + 6}" style="fill:${mx('series-1', 'elev-peak', 10)};stroke:${INK};stroke-width:2.6"/>`;
      s += ribTop(cx, cy, R, { lit: (p) => p === 'cart' || p === 'sternum' || p === 'spine' });
      s += txt(cx, P ? cy - R - 16 : cy + R + 30, 'one pair, from above', { size: fs, display: true });
      s += txt(cx, cy - R * 0.4, 'front', { size: 14, anchor: 'middle', col: T('label-muted') });
      s += txt(cx, cy + R * 0.38, 'back', { size: 14, anchor: 'middle', col: T('label-muted') });
      const lx = P ? 10 : W * 0.66;
      if (P) {
        s += tag(10, Y(-12) + 4, 'sternum', { size: fs, anchor: 'start', display: true }) + leader(84, Y(-12) + 4, X(-7), Y(20), INK, 2, 0.8);
        s += tag(W - 10, Y(60), 'cartilage', { size: fs, anchor: 'end', display: true }) + leader(W - 94, Y(60), X(16), Y(43), CART_D, 2.4);
        s += leader(70, H - 30, cx - 12, cy + R * 0.66, INK, 2, 0.8) + tag(8, H - 16, 'spine at the back', { size: 14, anchor: 'start' }) + leader(W - 60, H - 30, cx + R * 0.36, cy - R * 0.74, CART_D, 2.4) + tag(W - 8, H - 16, 'flexible joins', { size: 14, anchor: 'end' });
      } else {
        s += tag(lx, 40, 'sternum (front)', { size: fs + 1, anchor: 'start', display: true }) + leader(lx - 4, 40, X(5), Y(14), INK, 2, 0.8);
        s += tag(lx, 96, 'cartilage', { size: fs + 1, anchor: 'start', display: true }) + leader(lx - 4, 96, X(16), Y(43), CART_D, 2.6);
        s += tag(lx, 146, 'spine (back)', { size: fs + 1, anchor: 'start', display: true }) + leader(lx + 40, 160, cx, cy + R * 0.5, INK, 2, 0.8);
      }
    } else {
      const inn = this._to > 0.5, AW = AIRWAY_D(g.x, g.y, g.k, b), AC = T('series-1');
      // air down the windpipe, behind the sternum, and out along both bronchi into the lungs (reversed breathing out)
      const halo = (d) => `<path d="${d}" style="fill:none;stroke:${T('bg-surface')};stroke-width:7;stroke-linecap:round;opacity:.7"/><path d="${d}" style="fill:none;stroke:${AC};stroke-width:3.2;stroke-linecap:round;stroke-dasharray:8 6"/>`;
      const head = (px, py, ux, uy) => { const l = Math.hypot(ux, uy) || 1, a = ux / l, c = uy / l, h = 11; return `<path d="M${n(px - a * h - c * h * 0.7)} ${n(py - c * h + a * h * 0.7)}L${n(px)} ${n(py)}L${n(px - a * h + c * h * 0.7)} ${n(py - c * h - a * h * 0.7)}" style="fill:none;stroke:${AC};stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`; };
      const [tx0, ty0] = AW.top, [fx, fy] = AW.fork;
      s += halo(`M${n(tx0)} ${n(ty0 - 16)}L${n(fx)} ${n(fy)}`);
      for (const [ex, ey] of AW.ends) s += halo(`M${n(fx)} ${n(fy)}Q${n((fx + ex) / 2)} ${n(fy + 4)} ${n(ex)} ${n(ey)}`);
      if (inn) for (const [ex, ey] of AW.ends) s += head(ex, ey, ex - (fx + ex) / 2, ey - fy - 4);
      else s += head(tx0, ty0 - 16, 0, -1);
      // ribs move up and out (in), down and in (out): a clear curved arrow on each side of the cage
      for (const sx of [-1, 1]) {
        const lo = [X(sx * 72), Y(80)], hi = [X(sx * 90), Y(40)], c = [X(sx * 92), Y(70)];
        const [p0, p1] = inn ? [lo, hi] : [hi, lo];
        const d = `M${n(p0[0])} ${n(p0[1])}Q${n(c[0])} ${n(c[1])} ${n(p1[0])} ${n(p1[1])}`;
        s += `<path d="${d}" style="fill:none;stroke:${T('bg-surface')};stroke-width:9;stroke-linecap:round;opacity:.75"/><path d="${d}" style="fill:none;stroke:${INK};stroke-width:4.2;stroke-linecap:round"/>`;
        s += head(p1[0], p1[1], p1[0] - c[0], p1[1] - c[1]);
      }
      const fs2 = fs, dl = domeY(-22, b), dX = X(-22), dY = Y(dl + 2);
      if (P) {
        s += tag(10, ty0 + 2, inn ? 'air in' : 'air out', { size: fs2 + 1, anchor: 'start', display: true });
        s += tag(W - 10, ty0 + 2, 'windpipe', { size: fs2, anchor: 'end' }) + leader(W - 96, ty0 + 2, tx0 + 6, ty0 + 10, INK, 2, 0.8);
        s += tag(10, Y(142), inn ? 'diaphragm flattens, moves down' : 'diaphragm domes up', { size: fs2, anchor: 'start', display: true }) + leader(40, Y(142) - 14, dX, dY, INK, 2, 0.8);
      } else {
        const lx = W * 0.76;
        s += tag(tx0 - 16, ty0 + 4, inn ? 'air in' : 'air out', { size: fs2 + 1, anchor: 'end', display: true });
        s += tag(lx, 70, 'windpipe', { size: fs2 + 1, anchor: 'start' }) + leader(lx - 4, 70, tx0 + 7, ty0 - 4, INK, 2, 0.8);
        s += txt(lx + 4, 98, 'behind the sternum,', { size: 14, anchor: 'start' }) + txt(lx + 4, 116, 'into both lungs', { size: 14, anchor: 'start' });
        const ly = H * 0.7;
        s += tag(lx, ly, 'diaphragm', { size: fs2 + 1, anchor: 'start', display: true }) + leader(lx - 4, ly, X(40), Y(domeY(40, b) + 2), INK, 2, 0.8);
        s += txt(lx + 4, ly + 30, inn ? 'flattens, moves down' : 'domes up again', { size: 14, anchor: 'start' });
      }
      const ty = P ? H - 30 : H - 30, tx = P ? W / 2 : W * 0.36;
      s += tag(tx, ty, inn ? 'cage up and out, chest space bigger' : 'cage down and in, chest space smaller', { size: fs, display: true });
    }
    return s;
  }

  _s11(st, step) {
    let s = '', head = '';
    if (step !== 6) s += this._cage(st, step, 0);
    else head = flowChoiceHtml({ action: 'breath', label: 'Breathing', value: this._to ? 'in' : 'out', options: [{ value: 'in', label: 'Breathe in' }, { value: 'out', label: 'Breathe out' }] });
    return { svg: frame(st, 'sr', `<defs>${cwDefs()}</defs>${s}`, { back: back(st, 'srb') }), head };
  }

  animate(st, t) {
    if (this.stepIndex !== 6 || !this.live) return;
    const b = this._b(this.isPlaying?.() ? t : 1.6);
    this.live.shape('cage', 'g', { html: this._cage(st, 6, b) });
  }
}
