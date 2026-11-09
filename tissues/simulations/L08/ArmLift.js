// ArmLift - blk-l08-s3 (4 beats: pull, lift, cut, chain) and the setup of the predict blk-l08-s2 (role setup: the
// tendon marked as cut, the bag on the floor, before any contraction; it never shows whether the bag lifts).
// Side view of the arm: humerus, radius and ulna, the elbow hinge, the biceps with its tendon to the radius just below
// the elbow, the triceps behind. Contract: the biceps shortens and thickens, the tendon pulls, the forearm rises at the
// elbow and lifts the bag. With the tendon cut (a clean gap, no gore) the biceps bunches up and the forearm stays down.
// Muscles only pull: every arrow points from the bone towards the muscle.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { flowChipHtml, flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, mx, n1 } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, field } from '../shared/BodyArt.js';
import { ARM, armGeom, armSvg, tweenTo, cancelTween, drawOnly, INK, TEND_D, MUS_D, BONE_D, CART_D } from '../shared/LimbArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const UP = 1.68;
const MAP = [one(0), one(1), one(2), one(3)];

export class ArmLift extends SvgScene {
  static BEAT_MAPS = { 4: MAP, [Number.MAX_SAFE_INTEGER]: [one(4)] };
  static BEAT_STEP_MAP = MAP;
  static WIDTH = 640;
  static HEIGHT = 570;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 550;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Side view of an arm holding a school bag: the upper arm bone, the two forearm bones, the elbow joint, the biceps muscle at the front with its tendon joined to a forearm bone just below the elbow, and the triceps behind. When the biceps contracts it becomes shorter and thicker, pulls on its tendon, and the forearm rises at the elbow and lifts the bag. With the tendon cut, the biceps bunches up but the forearm and the bag stay down.';
  static CONTROLS = [];

  u = 0; sq = 0; cut = false; _found = false;

  async setup() {
    await super.setup();
    bindFlow(this.root, { action: (a, v) => this._act(a, v) });
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 52px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }' + BODY_CSS
    + ' svg .al-a { animation: al-a .5s ease-out both; animation-delay: var(--d, 0s); } @keyframes al-a { from { opacity: 0; transform: translateY(6px); } }'; }
  stageHeight(st) { return st.portrait ? 430 : 480; }
  busy() { return !!this._lkGo; }
  _setup() { return this.hostRole === 'setup' || this.stepIndex === 4; }
  enter(step) {
    cancelTween(this);
    this.cut = step === 2 || step === 4 || this.hostRole === 'setup';
    this.u = step === 3 ? 1 : 0;
    this.sq = 0;
  }
  destroy() { cancelTween(this); super.destroy(); }
  _act(a, v) {
    if (this._setup() || this._lkGo) return;
    const step = this.stepIndex;
    if (a === 'tendon' && step === 2) { this.cut = v === 'cut'; this.u = 0; this.sq = 0; this.repaint(); return; }
    if (a !== 'go' || (step !== 1 && step !== 2)) return;
    const on = this.cut ? this.sq < 0.5 : this.u < 0.5;
    if (this.cut) tweenTo(this, this.sq, on ? 1 : 0, 900, (v2, k) => { this.sq = v2; if (k >= 1) this.repaint(); else drawOnly(this); });
    else {
      tweenTo(this, this.u, on ? 1 : 0, 1300, (v2, k) => {
        this.u = v2;
        if (k >= 1) { this.repaint(); if (on && !this._found) { this._found = true; const p = this._bagAt; if (p) this.celebrate(p[0], p[1]); } } else drawOnly(this);
      });
    }
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, setup = this._setup(), fs = P ? 14 : 15;
    const th = ARM.rest + this.u * (UP - ARM.rest), g = armGeom(th);
    const lift = step === 1 || (step === 2 && !this.cut) || step === 3;
    const lit = (id) => ({ 0: ['biceps', 'tendon', 'humerus', 'forearm', 'elbow'], 1: ['biceps', 'tendon', 'forearm'], 2: ['biceps', 'tendon'], 3: ['biceps', 'tendon', 'forearm', 'elbow'], 4: ['tendon'] }[setup ? 4 : step] ?? []).includes(id);
    const dim = (id) => (id === 'skin' ? 1 : lit(id) || step === 0 ? 1 : id === 'triceps' ? 0.5 : 0.75);
    const arm = armSvg(g, { bag: true, cut: this.cut, squeeze: this.sq, dim, lit });
    // place: the arm frame (x -95..175, y -60..floor) into the stage
    const k = P ? 0.78 : 0.9, tx = P ? W * 0.44 : W * 0.42, ty = P ? 92 : 96;
    const M = (p) => [tx + p[0] * k, ty + p[1] * k];
    const fy = M([0, g.floor])[1];
    this._bagAt = M([g.H[0], g.H[1] + 60]);
    // a classroom wall and wooden floor, quiet
    let back = field(st, 'al', { a: 1, b: 7, k: 10 });
    back += `<rect x="0" y="${n1(fy)}" width="${W}" height="${n1(H - fy)}" style="fill:${mx('strata-3', 'elev-peak', 34)}"/><path d="M0 ${n1(fy)}H${W}" style="fill:none;stroke:${mx('strata-3', INK, 60)};stroke-width:3"/>`;
    for (let x = -40, i = 0; x < W; x += 92, i++) back += `<path d="M${n1(x + (i % 2) * 30)} ${n1(fy + 4)}L${n1(x + (i % 2) * 30 - 30)} ${n1(H)}" style="fill:none;stroke:${mx('strata-3', INK, 70)};stroke-width:1.6;opacity:.35"/>`;
    back += `<path d="M0 ${n1(fy + 14)}H${W}M0 ${n1(fy + 34)}H${W}" style="fill:none;stroke:${mx('strata-3', INK, 70)};stroke-width:1.2;opacity:.3"/>`;
    let s = `<g transform="translate(${n1(tx)} ${n1(ty)}) scale(${k})">${arm.svg}</g>`;
    // labels: beside the drawing, leaders to the part
    const L = (t, at, x, y, o = {}) => leader(x, y, at[0], at[1], o.col ?? INK, 2.4) + tag(x, y, t, { size: fs, rim: o.rim, anchor: o.anchor });
    const left = P ? 8 : 24, right = W - (P ? 8 : 24);
    const mid = M(arm.mid), tm = M([(arm.B[0] + arm.I[0]) / 2, (arm.B[1] + arm.I[1]) / 2]), hb = M([-2, 70]), el = M(g.E);
    const pullArrow = (a, b, col) => `<path d="M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}" style="fill:none;stroke:${col};stroke-width:5;stroke-linecap:round"/>` + (() => { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); return `<path d="M${n1(b[0] - Math.cos(ang - 0.5) * 13)} ${n1(b[1] - Math.sin(ang - 0.5) * 13)}L${n1(b[0])} ${n1(b[1])}L${n1(b[0] - Math.cos(ang + 0.5) * 13)} ${n1(b[1] - Math.sin(ang + 0.5) * 13)}" style="fill:none;stroke:${col};stroke-width:5;stroke-linecap:round;stroke-linejoin:round"/>`; })();
    const ins = M(g.I), bj = M(arm.B), ux = bj[0] - ins[0], uy = bj[1] - ins[1], ul = Math.hypot(ux, uy) || 1;
    const pa = [ins[0] + (ux / ul) * 14 + 16, ins[1] + (uy / ul) * 14], pb = [ins[0] + (ux / ul) * 50 + 16, ins[1] + (uy / ul) * 50];
    if (setup) {
      s += L('tendon cut', [(bj[0] + ins[0]) / 2, (bj[1] + ins[1]) / 2], right, P ? 150 : 170, { anchor: 'end', rim: TEND_D });
      s += L('biceps', mid, right, P ? 72 : 80, { anchor: 'end', rim: MUS_D });
      s += L('elbow', el, left, P ? 250 : 260, { anchor: 'start' });
      s += tag(M([0, g.floor])[0] + (P ? 0 : 90), fy + 26, 'bag on the floor', { size: fs });
    } else if (step === 0) {
      s += L('muscle (biceps)', mid, right, P ? 70 : 74, { anchor: 'end', rim: MUS_D });
      s += L('tendon', tm, right, P ? 170 : 200, { anchor: 'end', rim: TEND_D });
      s += L('bone', hb, left, P ? 96 : 110, { anchor: 'start', rim: BONE_D });
      s += L('joint (elbow)', el, left, P ? 230 : 250, { anchor: 'start', rim: CART_D });
      s += pullArrow(pa, pb, TEND_D) + (P ? tag(pb[0] + 14, pb[1] + 62, 'pull', { size: fs, rim: TEND_D, anchor: 'start' }) : tag(pb[0] + 30, pb[1] - 22, 'pull', { size: fs, rim: TEND_D }));
    } else if (step === 1 || step === 2) {
      const short = this.cut ? this.sq > 0.5 : this.u > 0.5;
      s += L(short ? 'shorter, thicker' : 'biceps', mid, P ? left : right, P ? 40 : 70, { anchor: P ? 'start' : 'end', rim: MUS_D });
      if (this.cut) {
        s += L('tendon cut', [(bj[0] + ins[0]) / 2, (bj[1] + ins[1]) / 2], right, P ? 200 : 230, { anchor: 'end', rim: TEND_D });
        if (this.sq > 0.5) s += tag(M([g.H[0], 0])[0] + (P ? 40 : 110), fy - (P ? 120 : 150), 'forearm stays down', { size: fs + 1, display: true }) + tag(M([g.H[0], 0])[0] + (P ? 40 : 110), fy - (P ? 86 : 112), 'bag not lifted', { size: fs });
      } else {
        if (this.u > 0.5) s += pullArrow(pa, pb, TEND_D);
        s += L('tendon', tm, right, P ? 228 : 250, { anchor: 'end', rim: TEND_D });
        if (this.u > 0.5) s += tag(M(g.H)[0] + (P ? -30 : 0), fy - 22, 'bag lifted', { size: fs + 1, display: true });
      }
    } else if (step === 3) {
      const rows = [['1', 'muscle contracts', mid, MUS_D], ['2', 'tendon passes the pull', tm, TEND_D], ['3', 'bone moves at the joint', el, CART_D]];
      rows.forEach(([nn, t, at, col], i) => {
        const x = P ? left : (i === 2 ? left : right), y = P ? 330 + i * 0 : [72, 168, 250][i];
        const yy = P ? [34, 74, 300][i] : y, xx = P ? (i === 2 ? left : right) : x, an = xx === left ? 'start' : 'end';
        s += `<g class="al-a" style="--d:${n1(0.2 + i * 0.7)}s">${leader(xx, yy, at[0], at[1], col, 3)}${tag(xx, yy, `${nn}  ${t}`, { size: fs, rim: col, anchor: an })}</g>`;
      });
      s += pullArrow(pa, pb, TEND_D);
    }
    let head = '';
    if (!setup && step === 1) head = flowChipHtml({ action: 'go', label: this.u > 0.5 ? 'Relax the biceps' : 'Contract the biceps' });
    if (!setup && step === 2) {
      head = flowChoiceHtml({ action: 'tendon', label: 'Tendon', value: this.cut ? 'cut' : 'whole', options: [{ value: 'whole', label: 'Tendon whole' }, { value: 'cut', label: 'Tendon cut' }] })
        + flowChipHtml({ action: 'go', label: (this.cut ? this.sq > 0.5 : this.u > 0.5) ? 'Relax' : 'Contract the biceps' });
    }
    return { svg: cwFrame(st, 'al', `<g>${back}</g>${s}`), head };
  }
}
