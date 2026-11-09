// VacuoleWiltScene - blk-l07-n04. A balsam plant and one of its cells, the same water state in both. Beat 0: the central
// vacuole named. Beat 1: firm, pressure arrows on the wall. Beat 2: Stop watering runs firm to wilted: water leaves the
// vacuole, the vacuole shrinks, pressure arrows fade, stem and leaves droop; the wall never changes. Water the plant runs
// it back. Beat 3: an animal cell with small vacuoles. Control names: Stop watering, Water the plant.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, leader, svgLeaf, svgPot, stroke, ctlBar, anim } from '../shared/PlantArt.js';
import { cwFrame, plantCell, animalCell, vacuole, chloroplast, nucleus, T, mx, n1 } from '../shared/CellWorld.js';
import { bench, tiles } from '../shared/Scapes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const smooth = (u) => u * u * (3 - 2 * u);

function plant(x, y, k, t) {
  // t 1 firm, 0 wilted. The stem bends over, the leaves hang.
  const w = 1 - t, tipx = x + 74 * k * w, tipy = y - (150 - 66 * w) * k, cx = x + 2 * k, cy = y - 96 * k;
  const at = (u) => { const v = 1 - u; return [v * v * x + 2 * v * u * cx + u * u * tipx, v * v * y + 2 * v * u * cy + u * u * tipy]; };
  let s = `<path d="M${n1(x)} ${n1(y)}Q${n1(cx)} ${n1(cy)} ${n1(tipx)} ${n1(tipy)}" ${stroke(mx('elev-low', 'strata-3', 44), 8 * k)}/>`;
  const L = [[0.26, -1, 66], [0.34, 1, 62], [0.5, -1, 60], [0.6, 1, 56], [0.74, -1, 50], [0.84, 1, 44], [0.97, -1, 34], [1, 1, 30]];
  for (const [u, sd, len] of L) {
    const [px, py] = at(u), lean = sd * (64 - u * 28) + w * (sd > 0 ? 88 : -68) * (0.7 + 0.3 * u);
    s += svgLeaf(px, py, k, { len: len * (1 - 0.1 * w), wide: len * (0.46 - 0.12 * w), rot: lean, teeth: 4 });
  }
  return s;
}

export class VacuoleWiltScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 492;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A potted balsam plant beside one of its cells. The cell has a thick wall and a large central vacuole full of cell sap. Stopping the water shrinks the vacuole, the arrows of pressure fade, and the plant wilts while the cell wall stays the same. Watering brings it back. The last step shows an animal cell with small vacuoles.';
  static CONTROLS = [];

  async setup() {
    this._t = 1; this._from = 1; this._to = 1;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'water', label: 'Stop watering', go: true }], () => this.toggle());
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 410; }
  enter(step) {
    this._t = 1; this._from = 1; this._to = 1;
    if (!this.ctl) return;
    this.ctl.show('water', step === 2);
    this.ctl.label('water', 'Stop watering');
  }
  toggle() {
    this.skip?.();
    this._from = this._to; this._to = this._to > 0.5 ? 0 : 1;
    this.ctl.label('water', this._to ? 'Stop watering' : 'Water the plant');
    this.play(2.4);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  _cell(cx, cy, w, h, t, P) {
    const ix = w * 0.5 - Math.max(8, Math.min(w, h) * 0.06) - 3, iy = h * 0.5 - Math.max(8, Math.min(w, h) * 0.06) - 3;
    const vx = ix * (0.5 + 0.34 * t), vy = iy * (0.46 + 0.38 * t);
    let s = vacuole(cx, cy, vx, vy, { seed: 7, wob: 0.03 + 0.05 * (1 - t) });
    const ring = [[-0.86, -0.72], [-0.2, -0.86], [0.56, -0.84], [0.88, -0.2], [0.82, 0.66], [-0.1, 0.87], [-0.84, 0.6], [-0.88, -0.05]];
    ring.forEach(([a, b], i) => { s += chloroplast(cx + a * ix * 0.94, cy + b * iy * 0.94, (P ? 0.4 : 0.56), { rot: Math.round(Math.atan2(b, a) * 57) + 90 }); if (i === 3) s += nucleus(cx + ix * 0.74, cy + iy * 0.32, Math.min(ix, iy) * 0.2, { pores: false }); });
    if (t > 0.05) {
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]]) {
        const x0 = cx + a * vx * 0.72, y0 = cy + b * vy * 0.72, x1 = cx + a * vx * (0.72 + 0.26 * t), y1 = cy + b * vy * (0.72 + 0.26 * t), ang = Math.atan2(y1 - y0, x1 - x0), hs = P ? 8 : 10;
        s += `<g opacity="${n1(t)}"><path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" ${stroke(T('sea-deep'), P ? 3.4 : 4.4)}/><path d="M${n1(x1 + Math.cos(ang) * hs)} ${n1(y1 + Math.sin(ang) * hs)}L${n1(x1 + Math.cos(ang + 2.5) * hs)} ${n1(y1 + Math.sin(ang + 2.5) * hs)}L${n1(x1 + Math.cos(ang - 2.5) * hs)} ${n1(y1 + Math.sin(ang - 2.5) * hs)}Z" style="fill:${T('sea-deep')}"/></g>`;
      }
    }
    return s;
  }
  _geom(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H - (P ? 54 : 52);
    return P ? { W, H, P, gy, px: 74, k: 0.86, cx: W * 0.64, cy: H * 0.4, cw: 206, ch: 210 } : { W, H, P, gy, px: W * 0.2, k: 1.22, cx: W * 0.66, cy: H * 0.46, cw: 326, ch: 296 };
  }
  paint(st) {
    const step = this.stepIndex, g = this._geom(st), { W, H, P, gy } = g;
    let s = tiles(W, gy + 6, { cool: false }) + bench(W, gy, H, { planks: 1 });
    if (step === 3) {
      const r = P ? 124 : 162, cx = W / 2, cy = H * 0.48;
      s += `<rect width="${W}" height="${H}" style="fill:${T('sea-deep')};opacity:.08"/>` + animalCell(cx, cy, r, { seed: 9, part: (n) => (n === 'membrane' || n === 'cytoplasm' ? 1 : 0.5) });
      for (const [a, b, q] of [[-0.54, -0.42, 0.13], [0.5, -0.5, 0.1], [0.54, 0.34, 0.12], [-0.46, 0.5, 0.09]]) s += vacuole(cx + a * r, cy + b * r, q * r * 1.1, q * r, { seed: 3 });
      s += leader(cx + 0.54 * r + 16, cy + 0.34 * r - 12, W - (P ? 72 : 110), P ? 50 : 62) + label(W - (P ? 74 : 110), P ? 40 : 50, 'Small vacuoles', { size: P ? 15 : 18, display: true });
      return { svg: cwFrame(st, 'vw', s) };
    }
    s += `<ellipse cx="${n1(g.px + 4)}" cy="${gy + 4}" rx="${54 * g.k}" ry="10" style="fill:${T('strata-6')};opacity:.3"/>`;
    s += `<g data-anim="plant">${plant(g.px, gy - 60 * g.k, g.k, this._t)}</g>${svgPot(g.px, gy - 62 * g.k, g.k * 0.86, {})}`;
    s += plantCell(g.cx, g.cy, g.cw, g.ch, { parts: ['wall', 'cytoplasm', 'membrane'], seed: 4 });
    s += `<g data-anim="cell">${this._cell(g.cx, g.cy, g.cw, g.ch, this._t, P)}</g>`;
    const fs = P ? 14 : 17;
    if (step === 0) {
      s += leader(g.cx + (P ? 14 : 0), g.cy - g.ch * 0.16, g.cx + (P ? 14 : 0), g.cy - g.ch * 0.5 - (P ? 16 : 10)) + label(g.cx, g.cy - g.ch * 0.5 - (P ? 22 : 18), 'Central vacuole: cell sap', { size: fs + 1, display: true });
    } else {
      s += `<g data-anim="note">${this._note(g)}</g>`;
    }
    return { svg: cwFrame(st, 'vw', s) };
  }
  _note(g) {
    const t = this._t, { P } = g;
    return label(g.cx, g.cy + g.ch * 0.5 + (P ? 24 : 30), t > 0.5 ? 'Full vacuole: firm cell' : 'Water lost: less firm', { size: P ? 15 : 19, display: true })
      + (this.stepIndex === 2 ? label(g.cx, g.cy - g.ch * 0.5 - (P ? 10 : 14), 'The wall stays the same', { size: P ? 14 : 16 }) : '');
  }
  animate(st, t) {
    if (this.stepIndex !== 2 || this._from === this._to) return;
    const u = smooth(Math.min(1, t / 2.4));
    this._t = this._from + (this._to - this._from) * u;
    const g = this._geom(st);
    anim(this, 'plant', plant(g.px, g.gy - 60 * g.k, g.k, this._t));
    anim(this, 'cell', this._cell(g.cx, g.cy, g.cw, g.ch, this._t, g.P));
    anim(this, 'note', this._note(g));
  }
}
