// ProtistCombinationsScene - blk-l03-s05. Beat 0: three protists, each moving its own way. Beat 1: Euglena in Light or Dark (learner-driven).
// Beat 2: three jobs in water. Beat 3: Amoeba's one cell doing every job.
import { BioStage, beats, pill, panel, waterBack, flow, head, move, INK } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc, BOX } from '../shared/BioArt.js';
import { svgFish } from '../shared/LifeArt.js';
import { svgSun } from '../shared/SeaArt.js';
import { words, leader } from '../shared/SeaBits.js';

export class ProtistCombinationsScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'Amoeba, Paramecium and Euglena. Euglena makes food in light and absorbs food in the dark. Protists produce oxygen, feed small animals and recycle nutrients. One Amoeba cell moves, feeds and grows.';
  heights = [[410, 330], [290, 360], [250, 320], [290, 370]];

  ctls() { return [{ kind: 'seg', id: 'light', label: 'Light on Euglena', options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], value: 'light' }]; }
  enter(step) { this._dark = false; this.ctl?.set('light', 'light'); this.ctl?.show('light', step === 1); }
  onCtl(id, v) { if (id === 'light') { const was = this._dark; this._dark = v === 'dark'; if (was !== this._dark) this.repaint(); } }

  _three(st) {
    const W = st.W, H = st.H, P = st.portrait;
    let s = waterBack(W, H);
    const place = P
      ? [['Amoeba', W * 0.5, 92, 1.02, 'Pushes out its body', 22], ['Paramecium', W * 0.5, 220, 0.98, 'Beats tiny cilia', 158], ['Euglena', W * 0.42, 340, 0.92, 'Beats a flagellum', 282]]
      : [['Amoeba', W * 0.16, 150, 1.14, 'Pushes out its body', 276], ['Paramecium', W * 0.47, 150, 1.02, 'Beats tiny cilia', 276], ['Euglena', W * 0.77, 150, 0.82, 'Beats a flagellum', 276]];
    place.forEach(([n, x, y, k, t, ty], i) => {
      s += `<g class="bs-wig" style="--r:${i % 2 ? -2 : 3}deg">${svgBio(n, x, y, k)}</g>`;
      s += words(P ? 12 : x, P ? ty + 6 : 40, n, { size: P ? 19 : 22, display: true, ink: INK, anchor: P ? 'start' : 'middle', halo: lc('white') });
      s += P ? pill(W - 10, ty, t, { anchor: 'end', size: 14 }) : pill(x, ty, t, { size: 14 });
    });
    return s;
  }

  _euglena(st) {
    const W = st.W, H = st.H, P = st.portrait, k = (W * 0.72) / BOX.Euglena[2], d = this._dark, cx = W * 0.44, cy = H * 0.56;
    let s = waterBack(W, H);
    if (d) s += `<rect width="${W}" height="${H}" ${fill(lc('waterDeep'), 'opacity:0.74')}/>`;
    else s += svgSun(W * 0.82, 50, 0.32);
    s += svgBio('Euglena', cx, cy, k);
    if (d) {
      [[0.12, 0.2], [0.3, 0.9], [0.62, 0.88]].forEach(([u, v]) => { const x = W * u, y = H * v, x1 = cx - 10, y1 = cy; s += `<circle cx="${x}" cy="${y}" r="7" ${fill(lc('bloomLit'))}/>` + flow(`M${x} ${y}L${x + (x1 - x) * 0.7} ${y + (y1 - y) * 0.7}`, lc('white'), 4); });
      s += pill(12, 28, 'In the dark: absorbs food', { anchor: 'start', on: true });
    } else {
      [0.5, 0.36, 0.22].forEach((u) => { s += `<path class="bs-flow" d="M${W * 0.8 - 24} 70L${W * u} ${cy - 20}" ${stroke(lc('gold'), 4)}/>`; });
      s += pill(12, 28, 'In light: makes food', { anchor: 'start', on: true });
    }
    return s;
  }

  _jobs(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 4 * g) / 3, ph = H - 2 * g, xs = [g, 2 * g + pw, 3 * g + 2 * pw], m = H * 0.42;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('water'))}/>`;
    ['Oxygen', 'Food', 'Recycling'].forEach((t, i) => { s += panel(xs[i], g, pw, ph, `color-mix(in oklab, ${lc('water')} 28%, ${lc('white')})`) + words(xs[i] + pw / 2, H - 22, t, { size: P ? 16 : 20, display: true, ink: INK }); });
    const k = P ? 0.58 : 0.8, c = xs.map((x) => x + pw / 2);
    s += svgBio('Euglena', c[0] - 22, m + 26, k * 0.62);
    [[-10, -36], [12, -56], [-22, -74]].forEach(([a, b], i) => { s += move('rise', i * 0.4, `<circle cx="${c[0] + a}" cy="${m + b}" r="8" ${fill(lc('white'), `stroke:${lc('waterDeep')};stroke-width:2`)}/>`); });
    s += svgBio('Paramecium', c[1], m - 34, k * 0.9) + svgFish(c[1], m + 48, P ? 0.9 : 1.2);
    s += `<path d="M${c[1]} ${m - 8}v18" ${stroke(INK, 3)}/>` + head(c[1], m + 16, 90, INK, 6);
    s += svgBio('Leaf', c[2] - pw * 0.34, m + 44, k * 0.72, { rot: 80 }) + svgBio('Amoeba', c[2] - 4, m - 34, k * 0.6);
    return s;
  }

  _one(st) {
    const W = st.W, H = st.H, P = st.portrait, b = BOX.Amoeba, k = (P ? 200 : 260) / b[3], cx = W * 0.5, cy = H * 0.5;
    let s = waterBack(W, H) + `<g class="bs-wig">${svgBio('Amoeba', cx, cy, k)}</g>`;
    const t = (x, y, x1, y1, tt) => leader(x1, y1, x, y) + pill(x, y, tt, { on: true });
    s += t(W * 0.2, 36, cx - 40 * k, cy - 34 * k, 'Moves');
    s += t(W * 0.8, 36, cx + 26 * k, cy - 22 * k, 'Feeds');
    s += t(W * 0.8, H - 30, cx + 30 * k, cy + 30 * k, 'Grows');
    return s + pill(W * 0.2, H - 30, 'One cell');
  }

  draw(st, step) { return [this._three, this._euglena, this._jobs, this._one][step].call(this, st); }
}
