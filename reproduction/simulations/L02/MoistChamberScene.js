// MoistChamberScene - blk-l02-s02 and the blk-l02-s01 setup. Cut-away steel dabba. Setup: fresh roti, lid on, no spots.
// Beat 0: lid off, spores in the air settle on the roti. Beat 1: the layers named, lid on. Beat 2: Days slider, lid stays
// on: mould from the spores that had already settled. Beat 3: mould under the microscope (book's Rhizopus): chips light
// hyphae, a sporangium, spores. How fast the patches grow by day is drawn, not measured. Control names: Day; chips.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP, svgPlantColour as pc, label, leader, frame, fill, stroke, ctlBar, pathRoundRect } from '../shared/PlantArt.js';

import { tiles, bench, microField, contact } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const SETUP = 4;
const CHIPS = [['hyphae', 'Hyphae'], ['sac', 'Sporangium'], ['spores', 'Spores']].map(([id, lab]) => ({ id, label: lab, targets: [id] }));
const SPORES = [[0.08, 0.2], [0.16, 0.5], [0.24, 0.28], [0.32, 0.12], [0.4, 0.42], [0.5, 0.2], [0.58, 0.46], [0.66, 0.14], [0.74, 0.34], [0.84, 0.18], [0.9, 0.44]];
const LANDED = [0.24, 0.38, 0.5, 0.62, 0.76];
const STEEL = pc('metal'), SD = pc('metalDark'), SL = pc('metalLit');
const ROTI = 'color-mix(in oklab, var(--sim-strata-1) 70%, var(--sim-strata-2))', ROTIK = 'var(--sim-strata-3)', MOULD = 'color-mix(in oklab, var(--sim-strata-5) 62%, var(--sim-elev-peak))', MOULDK = 'var(--sim-strata-6)';

export class MoistChamberScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static BEAT_MAPS = { 1: [one(SETUP)] };
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A steel dabba cut away to show moist cotton and a roti. Spores in the air settle on the roti before the lid closes. Over three days mould spreads. Under a microscope the mould shows threads, round sacs and tiny spores.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Parts of the mould', chips: CHIPS, onChange: () => this.repaint() });
  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'range', id: 'day', label: 'Day', min: 1, max: 3, step: 1, value: 3, read: (v) => `Day ${v}`, say: (v) => `day ${v}` }], (id, v) => { this._day = v; this.repaint(); });
    this.tl.mount(this.root, this);
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { const b = this.hostRole === 'setup' ? SETUP : this.stepIndex; return st.portrait ? 320 : (b === 2 || b === 3 ? 340 : 400); }
  enter(raw) {
    const step = this.hostRole === 'setup' ? SETUP : raw;
    this._day = 3;
    this.tl.set({ chips: step === 3 ? CHIPS : [], lit: null });
    if (!this.ctl) return;
    this.ctl.show('day', step === 2); this.ctl.set('day', 3);
  }
  destroy() { this.tl.destroy(); this.ctl?.destroy(); super.destroy(); }

  dabba(st, { lid, day = 0, landed = false, layers = false }) {
    const W = st.W, H = st.H, P = st.portrait, bw = W * (P ? 0.84 : 0.58), bx = (W - bw) / 2, top = H * (lid === 'off' ? 0.5 : 0.36), bot = H * 0.9, bh = bot - top;
    let s = tiles(W, H * 0.84) + bench(W, H * 0.82, H, { planks: 2 }) + contact(W / 2, bot + 2, bw * 0.54, 7, 0.45);
    s += `<path d="M${bx} ${top}V${bot - 14}Q${bx} ${bot} ${bx + 14} ${bot}H${bx + bw - 14}Q${bx + bw} ${bot} ${bx + bw} ${bot - 14}V${top}Z" style="fill:color-mix(in oklab, var(--sim-strata-5) 56%, var(--sim-sea-deep));stroke:${SD};stroke-width:8"/><path d="M${bx + 5} ${top + 6}H${bx + bw - 5}V${top + 40}Q${W / 2} ${top + 26} ${bx + 5} ${top + 40}Z" style="fill:var(--sim-elev-peak);opacity:.12"/><path d="M${bx - 4} ${top}V${bot - 12}" ${stroke(SL, 3)}/>`;
    const cot = bot - bh * 0.32, tis = cot - 8, rx = bw * 0.38, cx = W / 2, ry = tis - 14;
    s += `<path d="M${bx + 5} ${cot}Q${cx} ${cot - 8} ${bx + bw - 5} ${cot}V${bot - 5}H${bx + 5}Z" ${fill(pc('cloudShade'))}/>`;
    for (let i = 0; i < 26; i++) s += `<circle cx="${bx + 14 + (i * 41 % 100) / 100 * (bw - 28)}" cy="${cot + 8 + (i * 67 % 100) / 100 * (bot - cot - 18)}" r="${9 + i % 6}" ${fill(i % 3 ? pc('cloud') : pc('cloudShade'))}/>`;
    s += `<rect x="${bx + 5}" y="${tis}" width="${bw - 10}" height="9" rx="3" style="fill:color-mix(in oklab, var(--sim-ice) 60%, var(--sim-elev-peak));stroke:var(--sim-strata-5);stroke-width:1.5"/>`;
    s += `<path d="${pathRoundRect(cx - rx, ry, 2 * rx, 16, 8)}" style="fill:url(#pa-tuber) ${ROTI};stroke:${ROTIK};stroke-width:2.4"/>`;
    for (let i = 0; i < 12; i++) s += `<ellipse cx="${cx - rx * 0.86 + i * rx * 0.155}" cy="${ry + 5 + (i * 3 % 4) * 2}" rx="${5 + i % 4}" ry="2.4" ${fill(ROTIK)} opacity=".62"/>`;
    if (landed) LANDED.forEach((u) => { s += `<circle cx="${bx + bw * u}" cy="${ry - 2}" r="4.5" ${fill(MOULDK)}/>`; });
    if (day >= 2) {
      const n = day === 2 ? 2 : 9, h = day === 2 ? 14 : 34;
      for (let i = 0; i < n; i++) {
        const u = day === 2 ? [0.36, 0.62][i] : (i + 0.5) / 9, x = cx - rx + 2 * rx * u, q = h * (0.8 + (i % 3) * 0.16);
        s += `<ellipse cx="${x}" cy="${ry - q * 0.42}" rx="${day === 2 ? 30 : 36}" ry="${q * 0.7}" style="fill:${MOULD};opacity:.62;filter:url(#pa-soft)"/>`;
        for (let k = -5; k <= 5; k++) { const e = (k * 7 + i * 13) % 5; s += `<path d="M${x + k * 2} ${ry + 2}Q${x + k * 4 + e} ${ry - q * 0.6} ${x + k * 6.4} ${ry - q + Math.abs(k) * 1.6}" ${stroke(MOULD, 1.6)}/><circle cx="${x + k * 6.4}" cy="${ry - q + Math.abs(k) * 1.6 - 2}" r="${2.2 + (i + k + 5) % 2}" ${fill(MOULDK)}/>`; }
      }
    }
    if (lid === 'on') s += `<g class="sv-pop"><path d="${pathRoundRect(bx - 14, top - 22, bw + 28, 26, 10)}" style="fill:url(#pa-metal) ${STEEL};stroke:${SD};stroke-width:2.4"/><rect x="${bx}" y="${top - 18}" width="${bw}" height="4" rx="2" ${fill(SL)}/><path d="${pathRoundRect(W / 2 - 26, top - 36, 52, 16, 6)}" style="fill:url(#pa-metal) ${SD};stroke:${SD};stroke-width:2"/></g>`;
    else {
      s += `<g transform="rotate(-8 ${W * 0.16} ${H * 0.86})"><path d="${pathRoundRect(W * 0.01, H * 0.8, W * 0.28, 16, 6)}" style="fill:url(#pa-metal) ${STEEL};stroke:${SD};stroke-width:2"/></g>`;
    }
    return { s, cot, tis, ry, bx, bw, bot, top, cx, rx, P, W, H };
  }

  paint(st) {
    const step = this.hostRole === 'setup' ? SETUP : this.stepIndex;
    if (step === SETUP) {
      const d = this.dabba(st, { lid: 'on' });
      return { svg: frame(st, 'mc', d.s + label(d.W / 2, 32, 'Fresh roti, lid on', { size: d.P ? 20 : 24, display: true }) + label(d.W / 2, 58, 'Warm, dark place, three days', { size: d.P ? 14 : 17 })) };
    }
    if (step === 0) {
      const d = this.dabba(st, { lid: 'off', landed: true }), H = d.H, W = d.W;
      let s = d.s;
      SPORES.forEach(([u, v], i) => { s += `<g class="sv-pop" style="--d:${i * 0.05}s"><circle cx="${W * u}" cy="${H * (0.1 + v * 0.74)}" r="5.5" ${fill(MOULDK)}/></g>`; });
      s += label(W / 2, 32, 'Spores in the air', { size: d.P ? 20 : 24, display: true }) + label(W / 2, 58, 'Some settle before the lid closes', { size: d.P ? 14 : 17 });
      return { svg: frame(st, 'mc', s) };
    }
    if (step === 1) {
      const d = this.dabba(st, { lid: 'on', landed: true }), W = d.W, x = d.bx + d.bw + (d.P ? -10 : 12), P = d.P;
      let s = d.s + label(W / 2, 32, 'A moist chamber', { size: P ? 20 : 24, display: true }) + label(W / 2, 58, 'Warm, 25-35 \u00b0C, and dark', { size: P ? 14 : 17 });
      const tag = (y, t, ty) => (P ? label(W / 2, y, t, { size: 15 }) : label(W * 0.9, ty ?? y, t, { size: 15 }) + leader(W * 0.9 - 44, (ty ?? y) - 5, x - 18, y));
      s += P ? label(W * 0.3, d.ry + 12, 'Roti', { size: 15 }) + label(W * 0.3, d.tis + 7, '', {}) + label(W * 0.7, d.cot + 28, 'Moist cotton', { size: 15 }) : tag(d.ry + 6, 'Roti') + tag(d.tis + 4, 'Tissue', d.tis + 26) + tag(d.cot + 30, 'Moist cotton', d.cot + 52);
      return { svg: frame(st, 'mc', s) };
    }
    if (step === 2) {
      const day = this._day ?? 3, d = this.dabba(st, { lid: 'on', landed: day === 1, day });
      return { svg: frame(st, 'mc', d.s + label(d.W / 2, 44, ['', 'Day 1: no mould to see', 'Day 2: faint patches', 'Day 3: mould spreads'][day], { size: d.P ? 20 : 24, display: true })) };
    }
    return { svg: frame(st, 'mc', this.mould(st)) };
  }

  mould(st) {
    const W = st.W, H = st.H, P = st.portrait, o = (t) => (this.tl.off(t) ? ' opacity="0.24"' : '');
    const HY = 'color-mix(in oklab, var(--sim-strata-3) 74%, var(--sim-strata-2))', HD = 'color-mix(in oklab, var(--sim-strata-3) 62%, black)';
    const base = H * 0.84, thick = P ? 8 : 10;
    let s = microField(W, H, { tone: 'green', seed: 9 });
    const mat = [`M-10 ${base}Q${W * 0.3} ${base - 30} ${W * 0.62} ${base + 8}T${W + 10} ${base - 14}`, `M-10 ${base + 30}Q${W * 0.26} ${base + 6} ${W * 0.56} ${base + 34}T${W + 10} ${base + 14}`, `M${W * 0.06} ${H + 6}Q${W * 0.3} ${base - 8} ${W * 0.46} ${base + 8}`, `M${W * 0.96} ${H + 6}Q${W * 0.78} ${base + 4} ${W * 0.66} ${base - 2}`];
    const stalks = [[0.2, 0.46, 0.24, 1], [0.48, 0.36, 0.5, 2], [0.8, 0.44, 0.76, 3]];
    const tube = (d) => `<path d="${d}" ${stroke(HD, thick + 2.4)}/><path d="${d}" ${stroke(HY, thick)}/><path d="${d}" style="fill:none;stroke:var(--sim-strata-1);stroke-width:${thick * 0.36};stroke-linecap:round;opacity:.8"/>`;
    let hy = mat.map(tube).join('');
    let sacs = '';
    stalks.forEach(([u, v, ub, kind]) => {
      const tx = W * u, ty = H * v, b = W * ub, d = `M${b} ${base}Q${tx - 12} ${(ty + base) / 2} ${tx} ${ty}`;
      hy += tube(d);
      const r = (P ? 28 : 36);
      if (kind !== 2) { sacs += `<circle cx="${tx}" cy="${ty - r * 0.7}" r="${r}" style="fill:url(#pa-tuber) var(--sim-strata-3);stroke:${HD};stroke-width:3"/>`; sacs += `<ellipse cx="${tx - r * 0.34}" cy="${ty - r * 1.1}" rx="${r * 0.24}" ry="${r * 0.13}" style="fill:var(--sim-elev-peak);opacity:.6"/>`; } else {
        sacs += `<path d="M${tx - r} ${ty - r * 0.3}A${r} ${r} 0 0 0 ${tx + r} ${ty - r * 0.3}Z" style="fill:color-mix(in oklab, var(--sim-strata-3) 64%, var(--sim-strata-5));stroke:${HD};stroke-width:4"/>`;
      }
    });
    let sp = '';
    const c = stalks[1], tx = W * c[0], ty = H * c[1], rs = P ? 28 : 36, dot = P ? 4.2 : 5.2, rnd = (i) => ((i * 7919) % 101) / 101;
    for (let i = 0; i < 24; i++) { const ring = Math.floor(i / 8), a = -Math.PI * (0.1 + 0.8 * ((i % 8) + (ring % 2) * 0.5) / 7.5), q = rs * (0.95 + ring * 0.42 + rnd(i + 3) * 0.16); sp += `<circle cx="${tx + Math.cos(a) * q * 1.5}" cy="${ty - rs * 0.3 + Math.sin(a) * q}" r="${dot}" style="fill:var(--sim-strata-6)"/>`; }
    for (const [u, v] of [[0.2, 0.46], [0.8, 0.44]]) for (let i = 0; i < 9; i++) sp += `<circle cx="${W * u + ((i % 3) - 1) * rs * 0.44}" cy="${H * v - rs * 0.7 + (Math.floor(i / 3) - 1) * rs * 0.44}" r="${dot * 0.72}" style="fill:var(--sim-strata-6)"/>`;
    s += `<g${o('hyphae')}>${hy}</g><g${o('sac')}>${sacs}</g><g${o('spores')}>${sp}</g>`;
    const c1 = this.tl.chip();
    const T = { hyphae: 'Hyphae: the threads', sac: 'Sporangium: the sac', spores: 'Spores: millions from one colony' };
    if (c1) s += label(W / 2, 28, T[c1.id], { size: P ? 15 : 21, display: true });
    else {
      const z = P ? 15 : 18;
      s += label(W / 2, 28, 'Mould under a microscope', { size: P ? 17 : 21, display: true });
      s += label(W * 0.13, H * 0.2, 'Sac', { size: z, display: true }) + `<path d="M${W * 0.15} ${H * 0.23}L${W * 0.19} ${H * 0.3}" ${stroke(pc('ink'), 2.5)}/>`;
      s += label(W * 0.74, H * 0.2, 'Spores', { size: z, display: true }) + `<path d="M${W * 0.68} ${H * 0.2}L${W * 0.6} ${H * 0.22}" ${stroke(pc('ink'), 2.5)}/>`;
      s += label(W * 0.88, base - 44, 'Hyphae', { size: z, display: true }) + `<path d="M${W * 0.88} ${base - 36}L${W * 0.86} ${base - 8}" ${stroke(pc('ink'), 2.5)}/>`;
    }
    return s;
  }
}
