// SevenCriteriaScene - blk-l01-s06b, 3 beats. One tiger, seven criteria, in the book's order, broad to detailed. A tap on a
// criterion lights what it looks at and shows the tiger's answer. Beat 0: first three. Beat 1: all seven. Beat 2: a lion beside
// the tiger, the features they share. Controls: TapLight chips.
import { SvgScene, mountEl } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { LIFE_COLOR_MAP, svgGrassTuft } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { PLATE } from '../shared/BioBits.js';
import { tigerBig, fitBig } from '../L08/VertArt.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const ANS = {
  ext: ['External features', 'Striped fur, four legs, long tail'],
  food: ['Mode of nutrition', 'Heterotrophic: eats other animals'],
  inner: ['Internal structures', 'A backbone, a skull, organs'],
  cell: ['Cell structure', 'Multicellular, eukaryote, no wall'],
  role: ['Ecological role', 'Consumer'],
  rep: ['Reproduction', 'Sexual: gives birth to cubs'],
  gene: ['Genetic similarity', 'DNA, compared with other cats'],
};
const SHORT = { ext: 'External', food: 'Nutrition', inner: 'Internal', cell: 'Cell', role: 'Role', rep: 'Reproduction', gene: 'Genes' };
const chips = (ids) => ids.map((id) => ({ id, label: SHORT[id], targets: [id] }));
const FIRST = ['ext', 'food', 'inner'], ALL = [...FIRST, 'cell', 'role', 'rep', 'gene'];

export class SevenCriteriaScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 520; static HEIGHT = 440; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 640;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A large drawn tiger. Tapping a criterion, such as external features or cell structure, lights what it looks at on the tiger and shows the answer for a tiger. At the end a lion stands beside the tiger with the features they share.';

  tl = tapLight({ label: 'Seven criteria', chips: chips(FIRST), onChange: () => this.repaint() });

  async setup() {
    await super.setup();
    this.tlHost = mountEl(this.root, 'sc-tl');
    this.tl.mount(this.tlHost, this);
    this.enter(this.stepIndex); this.repaint();
  }
  destroy() { this.tl.destroy(); super.destroy(); }
  stageHeight(st) { return this.stepIndex === 2 ? (st.portrait ? 470 : 330) : (st.portrait ? 360 : 300); }
  enter(step) {
    if (!this.tlHost) return;
    this.tlHost.style.display = step === 2 ? 'none' : '';
    if (step === 0) this.tl.set({ chips: chips(FIRST), lit: ['ext'] });
    if (step === 1) this.tl.set({ chips: chips(ALL), lit: ['cell'] });
    this.relayout?.();
  }
  _hero(st, id) {
    const W = st.W, H = st.H, P = st.portrait, gy = H - (P ? 74 : 46), s = P ? 1.86 : 1.9, x = W / 2 + 16, dim = ['inner', 'cell', 'gene'].includes(id);
    let o = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'skyDay', b: 'elevPeak', t: 0.5 })}"/><rect y="${gy - 6}" width="${W}" height="${H - gy + 6}" rx="14" style="fill:${bc('leaf')}"/>`;
    for (const u of [0.08, 0.2, 0.82, 0.94]) o += svgGrassTuft(W * u, gy + 6, 1, { seed: Math.round(u * 40) });
    o += `<g style="opacity:${dim ? 0.3 : 1}">${tigerBig(x, gy + 4, s / 2.4)}</g>`;
    const P2 = (px, py) => [x + px * s, gy + 4 + py * s];
    const ring = (px, py, r) => { const [a, b] = P2(px, py); return `<circle cx="${a}" cy="${b}" r="${r}" style="fill:none;stroke:var(--sim-gold);stroke-width:4"/>`; };
    if (id === 'food') o += ring(56, -54, 26 * s / 2.5) + fitBio('Deer', 6, gy - 96, P ? 70 : 120, P ? 90 : 110);
    if (id === 'inner') {
      const pts = [[44, -68], [20, -62], [-4, -60], [-28, -60], [-50, -54], [-66, -52]].map(([a, b]) => P2(a, b));
      o += `<path d="M${pts.map((p) => p.join(' ')).join('L')}" style="fill:none;stroke:${bc('ink')};stroke-width:7;stroke-linecap:round"/>`;
      o += pts.map(([a, b]) => `<rect x="${a - 5}" y="${b - 8}" width="10" height="16" rx="3" style="fill:${bc('white')};stroke:${bc('ink')};stroke-width:2"/>`).join('');
      const [hx, hy] = P2(46, -68); o += `<circle cx="${hx}" cy="${hy}" r="${11 * s}" style="fill:${bc('white')};stroke:${bc('ink')};stroke-width:3"/>`;
    }
    if (id === 'cell') {
      const [cx, cy] = P2(-6, -54), r = P ? 62 : 74, ox = W * 0.24, oy = H * 0.52;
      o += `<path d="M${cx} ${cy}L${ox} ${oy}" style="fill:none;stroke:${bc('ink')};stroke-width:2.5"/><circle cx="${cx}" cy="${cy}" r="9" style="fill:none;stroke:${bc('ink')};stroke-width:3"/>`;
      o += `<circle cx="${ox}" cy="${oy}" r="${r}" style="fill:${bc('white')};stroke:${bc('ink')};stroke-width:3"/><ellipse cx="${ox}" cy="${oy}" rx="${r * 0.72}" ry="${r * 0.6}" style="fill:${bc('cyto')};stroke:${bc('cytoDark')};stroke-width:3"/><circle cx="${ox + 8}" cy="${oy}" r="${r * 0.26}" style="fill:${bc('nucleus')}"/>`;
    }
    if (id === 'role') o += fitBio('Deer', 6, gy - 96, P ? 70 : 120, P ? 90 : 110) + svgGrassTuft(30, gy + 6, 1.4, { seed: 3 });
    if (id === 'rep') o += tigerBig(x - 64 * s - 18, gy + 12, s * 0.175);
    if (id === 'gene') {
      const cx = W * 0.2, cy = H * 0.56; let a = '', b = '', c = '';
      for (let i = 0; i <= 20; i++) { const t = i / 20, y = cy - 70 + t * 140, u = Math.sin(t * 9) * 34; a += `${i ? 'L' : 'M'}${(cx + u).toFixed(1)} ${y.toFixed(1)}`; b += `${i ? 'L' : 'M'}${(cx - u).toFixed(1)} ${y.toFixed(1)}`; if (i % 2 === 0) c += `M${(cx + u).toFixed(1)} ${y.toFixed(1)}L${(cx - u).toFixed(1)} ${y.toFixed(1)}`; }
      o += `<path d="${c}" style="fill:none;stroke:${bc('inkSoft')};stroke-width:3"/><path d="${a}" style="fill:none;stroke:${bc('dna')};stroke-width:6;stroke-linecap:round"/><path d="${b}" style="fill:none;stroke:${bc('waterDeep')};stroke-width:6;stroke-linecap:round"/>`;
    }
    return o;
  }
  paint(st) {
    if (this.stepIndex === 2) {
      const W = st.W, H = st.H, gy = H - 84;
      let s = `<rect width="${W}" height="${H}" rx="14" style="fill:${bc({ a: 'skyDay', b: 'elevPeak', t: 0.5 })}"/><rect y="${gy}" width="${W}" height="${H - gy}" rx="14" style="fill:${bc('leaf')}"/>`;
      // On a phone the two stand one behind the other on a slope, each large, so no tall empty sky.
      if (st.portrait) {
        const t = (gy - 22) / 2 + 2;
        s += `<path d="M0 ${t - 8}Q${W * 0.42} ${t - 18} ${W * 0.8} ${t + 26}Q${W * 0.92} ${t + 40} ${W} ${t + 42}V${gy + 2}H0Z" style="fill:${bc('leaf')}"/>`;
        s += fitBig('Tiger', W * 0.02, 10, W * 0.72, t - 6) + fitBig('Lion', W * 0.25, t + 8, W * 0.72, gy - t - 6);
      } else s += fitBig('Tiger', W * 0.03, 20, W * 0.46, gy - 16) + fitBig('Lion', W * 0.51, 20, W * 0.46, gy - 16);
      s += PLATE(10, H - 72, W - 20, 62, { r: 12, fill: bc('white'), rim: bc('ink') }) + words(W / 2, H - 46, 'Both: backbone, fur, milk for young', { size: st.portrait ? 16 : 18, ink: bc('ink') }) + words(W / 2, H - 22, 'Similar features suggest common ancestors', { size: st.portrait ? 13 : 16, ink: bc('ink') });
      return { svg: s };
    }
    const id = this.tl.lit?.()[0] ?? null;
    let s = this._hero(st, id);
    if (id) { const [n, a] = ANS[id]; s += PLATE(8, 8, st.W - 16, 58, { r: 12, fill: bc('white'), rim: bc('ink') }) + words(st.W / 2, 31, n, { size: 17, display: true, ink: bc('ink') }) + words(st.W / 2, 54, a, { size: 15, ink: bc('ink') }); }
    return { svg: s };
  }
}
