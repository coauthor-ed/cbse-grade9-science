// CuttingBenchScene - blk-l01-s04. Beats in order: one shoot on the bench, morning sun; nodes and internodes labelled;
// Remove lower leaves; slider sets the angle from the soil surface; half the length is buried, and the band
// shows 45-60; watered, roots from the buried part, new leaves. Control names: Remove lower leaves, Angle.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgSoil, svgStem, svgRoots, svgCan, svgLeaf, svgPlantColour as pc, label, leader, frame, fill, ctlBar } from '../shared/PlantArt.js';

import { sky, hedge, bench, contact } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const LOW = [[0.217, 1, 40], [0.435, -1, 42]], UP = [[0.652, 1, 42], [0.87, -1, 40], [0.96, 1, 34]];
const LEN = 230;
const x0m = (node) => node(2.3);

export class CuttingBenchScene extends SvgScene {
  static BEAT_STEP_MAP = [one(4), one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A rose shoot with nodes and internodes. The lower leaves come off. The cutting goes into soil at a slant, half its length buried, and roots grow from the buried part.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [
      { kind: 'btn', id: 'strip', label: 'Remove lower leaves', go: true },
      { kind: 'range', id: 'angle', label: 'Angle', min: 20, max: 90, step: 1, value: 52, read: (v) => `${v}\u00b0`, say: (v) => `${v} degrees from the soil surface` },
    ], (id, v) => {
      if (id === 'strip') { this._stripped = true; this.ctl.disable('strip', true); this.repaint(); }
      if (id === 'angle') { this._a = v; this.repaint(); }
    });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 310 : 372; }
  enter(step) {
    this._stripped = false; this._a = 52;
    if (!this.ctl) return;
    this.ctl.show('strip', step === 1); this.ctl.show('angle', step === 2);
    this.ctl.disable('strip', false); this.ctl.set('angle', 52);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  bench(st, leaves, bare) {
    const W = st.W, H = st.H, P = st.portrait, k = (W * 0.84) / LEN, y = H * 0.56, x0 = W * 0.08;
    let s = sky(W, H * 0.34, { warm: 0.9, sun: [W * 0.84, H * 0.3] }) + hedge(W, H * 0.2, H * 0.2, { seed: 4 }) + bench(W, H * 0.3, H, { planks: 3 }) + contact(W * 0.5, y + 34, W * 0.42, 9, 0.4);
    s += svgStem(x0, y, k, { len: LEN, nodes: 4, w: 10, rot: 90, leaves });
    for (const [u, side] of bare ?? []) s += svgLeaf(x0 + k * LEN * u + 6, H * 0.84, 0.8, { rot: 90 * side + 10, len: 40, wide: 22, teeth: 6 });
    const node = (i) => x0 + k * LEN * i / 4.6;
    return { s, node, y, P, W, H, k, x0 };
  }

  paint(st) {
    const step = this.stepIndex;
    if (step === 4) {
      const { s: b, P, W } = this.bench(st, [...LOW, ...UP]);
      return { svg: frame(st, 'cb', b + label(W * 0.42, 34, 'Morning: collect the shoots', { size: P ? 18 : 22, display: true })) };
    }
    if (step < 2) {
      if (step === 0) {
        const { s: b, node, y, P, W, H } = this.bench(st, [...LOW, ...UP]);
        let s = b + label(W * 0.42, 34, 'Count the nodes', { size: P ? 18 : 22, display: true });
        s += leader(node(2), y + 8, node(2), H * 0.68) + label(node(2), H * 0.72, 'Node', { size: 16 });
        const mid = (node(3) + node(4)) / 2;
        s += leader(mid, y + 6, mid, H * 0.68) + label(mid, H * 0.72, 'Internode', { size: 16 });
        s += label(W * 0.4, H * 0.88, '4 nodes, 3 internodes', { size: P ? 15 : 17, display: true });
        return { svg: frame(st, 'cb', s) };
      }
      const on = this._stripped;
      const { s: b, node, P, W, H, y } = this.bench(st, on ? UP : [...LOW, ...UP], on ? [[0.1, 1], [0.28, -1]] : null);
      let s = b + label(W / 2, 34, on ? 'Lower half is bare' : 'Lower half still has leaves', { size: P ? 18 : 22, display: true });
      const xm = x0m(node);
      s += label(node(1), H * 0.9, 'Lower half', { size: 16 }) + label(node(3.4), H * 0.9, 'Upper half', { size: 16 });
      s += `<path d="M${xm} ${y - 62}V${y + 62}" style="fill:none;stroke:${pc('ink')};stroke-width:3;stroke-dasharray:8 7"/>`;
      return { svg: frame(st, 'cb', s) };
    }
    const W = st.W, H = st.H, P = st.portrait, gy = Math.round(H * 0.56), k = P ? 1.06 : 1.36, px = W * 0.46;
    const a = step === 3 ? 52 : (this._a ?? 52), r = (90 - a) * Math.PI / 180, half = LEN * k / 2;
    const fx = px - Math.sin(r) * half, fy = gy + Math.cos(r) * half;
    let s = sky(W, gy + 10, { warm: 0.5, sun: [W * 0.1, 20] }) + hedge(W, gy * 0.46, gy * 0.6, { seed: 7 }) + svgSoil(0, gy, 1, { w: W, h: H - gy, compost: true, seed: 9 });
    // the bed in section: dark damp soil packed round the buried half, a low brick edge along the surface behind it
    for (let i = 0; i < 16; i++) s += `<rect x="${i * W / 15 - 12}" y="${gy - 15 - (i % 2) * 1}" width="${W / 15 - 3}" height="15" rx="2.5" style="fill:color-mix(in oklab, ${pc('soil')} ${54 + (i * 7) % 22}%, var(--sim-series-6));stroke:${pc('ink')};stroke-width:1;opacity:0.86"/>`;
    s += `<path d="M${fx} ${fy}L${px} ${gy}" style="fill:none;stroke:${pc('ink')};stroke-width:40;stroke-linecap:round;opacity:0.13"/><path d="M${fx} ${fy}L${px} ${gy}" style="fill:none;stroke:${pc('ink')};stroke-width:28;stroke-linecap:round;opacity:0.13"/>`;
    const HIGH = [[0.8, 1, 40], [0.9, -1, 38], [0.975, 1, 32]];
    const leaves = step === 3 ? [...HIGH, [0.66, -1, 26]] : HIGH;
    s += svgStem(fx, fy, k, { len: LEN, nodes: 4, w: 16, rot: 90 - a, leaves });
    if (step === 2) {
      // a protractor over the stem: a thin arc from the soil to upright, the 45 to 60 band thick, so the stem is read against it
      const R = P ? 78 : 104, p = (d, q = R) => [px + q * Math.cos(d * Math.PI / 180), gy - q * Math.sin(d * Math.PI / 180)];
      const arc = (d0, d1) => { const [ax, ay] = p(d0), [bx, by] = p(d1); return `M${ax} ${ay}A${R} ${R} 0 0 0 ${bx} ${by}`; };
      s += `<path d="${arc(0, 90)}" style="fill:none;stroke:${pc('ink')};stroke-width:6;opacity:0.5"/><path d="${arc(0, 90)}" style="fill:none;stroke:${pc('cloud')};stroke-width:3"/>`;
      s += `<path d="${arc(45, 60)}" style="fill:none;stroke:${pc('ink')};stroke-width:17"/><path d="${arc(45, 60)}" style="fill:none;stroke:${pc('yellow')};stroke-width:13"/>`;
      for (const d of [45, 60]) { const [a0, b0] = p(d, R - 11), [a1, b1] = p(d, R + 11); s += `<path d="M${a0} ${b0}L${a1} ${b1}" style="fill:none;stroke:${pc('ink')};stroke-width:3"/>`; }
      const [lx1, ly1] = p(36, R + 26), [lx2, ly2] = p(71, R + 26);
      s += label(lx1, ly1 + 5, '45\u00b0', { size: 16 }) + label(lx2, ly2 + 5, '60\u00b0', { size: 16 });
    }
    if (step === 3) {
      s += `<g class="sv-grow" style="transform-origin:top">${svgRoots(fx, fy - 6, k * 0.9, { len: 44, grow: 1, seed: 4, rot: 90 - a })}</g>`;
      s += `<g class="sv-grow" style="--d:.2s;transform-origin:top">${svgRoots(px - Math.sin(r) * half * 0.5, gy + Math.cos(r) * half * 0.5, k * 0.7, { len: 34, grow: 1, seed: 9, n: 4 })}</g>`;
      s += svgCan(W * 0.82, gy, P ? 0.9 : 1.1, { flip: true });
      for (let i = 0; i < 5; i++) s += `<ellipse cx="${W * 0.66 - i * 7}" cy="${gy - 62 + i * 13}" rx="3.2" ry="5" ${fill(pc('water'))}/>`;
      s += label(W * 0.5, 34, 'Roots from the buried part', { size: P ? 17 : 21, display: true });
    } else {
      const ok = a >= 45 && a <= 60;
      s += label(W * 0.2, 44, `${a}\u00b0`, { size: P ? 34 : 42, display: true });
      s += label(W * 0.3, 72, ok ? 'In the 45-60\u00b0 range' : (a > 60 ? 'Too upright' : 'Too flat'), { size: P ? 15 : 17 });
      s += label(W * 0.82, gy + 36, 'About half', { size: 16 }) + label(W * 0.82, gy + 60, 'buried', { size: 16 });
    }
    return { svg: frame(st, 'cb', s) };
  }
}
