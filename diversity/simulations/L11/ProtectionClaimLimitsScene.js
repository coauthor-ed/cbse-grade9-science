// ProtectionClaimLimitsScene - L11 blk-l11-s05, 3 beats, the book's three barriers. Beat 0: two shores, one with a deep belt
// of mangroves and one with few; Send the surge runs a surge in: it loses height in the belt, so less water reaches
// the huts. Drawn example, no measured heights. Beat 1: a tick and forest animals: in one kind the virus replicates, in
// the others it cannot. Beat 2: pollutant dots sink through a mangrove soil, microbes and roots hold or change them, and
// clearer water runs on. Controls: surge.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc, svgMangrove } from '../shared/LifeArt.js';
import { svgHut } from '../shared/SeaArt.js';
import { fitBio } from '../shared/BioArt.js';
import { anim, words } from '../shared/SeaBits.js';
import { tick, mx, INK, n1 } from './ForestArt.js';

const T_RUN = 5;
const ss = (u) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };
const SEA = lc('water'), DEEP = lc('waterDeep');

export class ProtectionClaimLimitsScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'Two shores under one surge. Where the mangrove belt is deep the water is much lower by the time it reaches the huts. Then a tick and five animals: the virus replicates in one kind and cannot in the others. Then a soil section where roots and microbes trap and change pollutants.';
  heights = [[400, 360], [470, 400], [420, 400]];
  _ran = false;
  _done = false;
  ctls() { return [{ kind: 'btn', id: 'surge', label: 'Send the surge', go: true }]; }
  onCtl() { if (this.isPlaying?.()) return; this._ran = true; this._done = false; this.play(T_RUN); this.repaint(); this.after(T_RUN + 0.1, () => { this._done = true; this.repaint(); }); }
  enter(step) { this._ran = false; this._done = false; this.ctl?.show('surge', step === 0); }

  _strip(H0, y, h, W, u, deep) {
    // Water top along the shore at progress u. deep: the belt takes most of the height.
    const gy = y + h - 22, x0 = W * 0.2, x1 = W * 0.62, front = W * 0.1 + u * W * 0.96, h0 = 8 + 56 * Math.min(1, u * 3), end = deep ? 0.22 : 0.86;
    let d = `M0 ${gy + 22}`;
    for (let i = 0; i <= 30; i++) {
      const x = W * i / 30; if (x > front) break;
      const k = x < x0 ? 1 : x > x1 ? end : 1 + (end - 1) * (x - x0) / (x1 - x0), ripple = Math.sin(x * 0.05 + u * 12) * 2.5;
      d += `L${n1(x)} ${n1(gy - h0 * k + ripple)}`;
    }
    d += `L${n1(Math.min(W, front))} ${gy + 22}Z`;
    return `<path d="${d}" ${fill(mx(SEA, DEEP, 0.3), 'opacity:0.8')}/>`;
  }
  animate(st, t = 0) {
    if (this.stepIndex !== 0) return;
    const { W, H, portrait: P } = st, u = !this._ran ? 0 : ss((this.clock ?? T_RUN) / (T_RUN - 0.4)), h = (H - 12) / 2;
    if (u <= 0) { anim(this, 'w', ''); return; }
    anim(this, 'w', this._strip(H, 4, h, W, u, true) + this._strip(H, 8 + h, h, W, u, false));
  }
  _b0(st) {
    const { W, H, portrait: P } = st, h = (H - 12) / 2;
    let g = '', hud = '';
    [[4, true], [8 + h, false]].forEach(([y, deep]) => {
      const gy = y + h - 22;
      g += `<rect y="${y}" width="${W}" height="${h}" ${fill(mx(lc('skyDay'), lc('white'), 0.4))}/>`;
      g += `<path d="M0 ${gy + 22}V${gy + 6}C${W * 0.12} ${gy + 6} ${W * 0.2} ${gy - 2} ${W * 0.3} ${gy - 4}L${W} ${gy - 8}V${gy + 22}Z" ${fill(lc('sand'), `stroke:${lc('sandDark')};stroke-width:3`)}/>`;
      g += `<rect y="${gy + 6}" width="${W * 0.12}" height="16" ${fill(SEA)}/>`;
      const n = deep ? (P ? 4 : 6) : 1, s = P ? 0.56 : 0.74;
      for (let i = 0; i < n; i++) g += svgMangrove(W * (0.26 + (deep ? i * (P ? 0.115 : 0.074) : 0.06)), gy + 2, s, { seed: i + 1 });
      for (let i = 0; i < 2; i++) g += svgHut(W * (0.8 + i * 0.13), gy - 4, P ? 0.5 : 0.7);
      hud += pill(P ? 84 : 110, y + 26, deep ? 'More mangroves' : 'Few mangroves', { size: 15 });
      if (this._done) hud += pill(W - (P ? 84 : 110), y + 26, deep ? 'Less destruction' : 'More destruction', { size: 15, on: true, pop: true });
    });
    return g + `<g data-anim="w"></g>` + hud;
  }
  _b1(st) {
    const { W, H, portrait: P } = st, floor = H - 30, tx = W / 2, ty = 72;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('leaf'), lc('white'), 0.64))}/>`;
    g += `<rect y="${floor}" width="${W}" height="30" ${fill(mx(lc('leaf'), lc('soil'), 0.4))}/>`;
    const list = [['Monkey', 1], ['Deer', 0], ['Hornbill', 0], ['Tiger', 0], ['Frog', 0]], cw = (W - 24) / 5, bw = P ? 100 : cw - 10, bh = P ? 134 : 166;
    const at = (i) => (P ? (i < 2 ? [i ? W * 0.76 : W * 0.24, 158] : [W * (0.18 + (i - 2) * 0.32), 302]) : [12 + cw * (i + 0.5), 212]);
    list.forEach((_, i) => { const [x, y] = at(i); g += `<path d="M${tx} ${ty + 36}L${n1(x)} ${y - 18}" ${stroke(INK, 3, 'stroke-dasharray:3 9;stroke-linecap:round;opacity:0.7')}/>`; });
    g += tick(tx, ty, 0.72) + pill(P ? W - 62 : W / 2 + 112, ty - 30, 'A tick', { size: 15 });
    list.forEach(([n, hot], i) => {
      const [x, y] = at(i);
      g += `<rect x="${n1(x - bw / 2)}" y="${y - 18}" width="${n1(bw)}" height="${bh}" rx="16" ${fill(hot ? mx(lc('red'), lc('white'), 0.62) : lc('white'), `stroke:${INK};stroke-width:3`)}/>`;
      g += fitBio(n, x - bw / 2 + 12, y - 8, bw - 24, P ? 58 : 92);
      const dy = y + (P ? 64 : 98);
      if (hot) for (let k = 0; k < 9; k++) g += `<g class="bs-pop" style="--d:${(k * 0.08).toFixed(2)}s"><circle cx="${n1(x - 22 + (k % 3) * 22)}" cy="${n1(dy + Math.floor(k / 3) * 10 - 6)}" r="4" ${fill(mx(lc('red'), INK, 0.2))}/></g>`;
      else g += `<circle cx="${n1(x)}" cy="${dy + 4}" r="6" ${fill('none', `stroke:${mx(INK, lc('white'), 0.4)};stroke-width:2.5;stroke-dasharray:3 3`)}/>`;
      g += words(x, y + bh - 28, hot ? 'Multiplies' : 'Cannot', { size: 14, ink: INK });
    });
    g += pill(W / 2, H - 16, 'Drawn example', { size: 14 });
    return g;
  }
  _b2(st) {
    const { W, H, portrait: P } = st, wy = 120, sy = H - (P ? 68 : 58), soil = mx(lc('soil'), lc('sand'), 0.2), band = sy - wy;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('white'), 0.4))}/>`;
    g += `<rect y="${wy}" width="${W}" height="${band}" ${fill(soil)}/>`;
    g += `<rect y="${sy}" width="${W}" height="${H - sy}" ${fill(mx(SEA, lc('white'), 0.2))}/>`;
    g += `<path d="M0 ${sy}C${W * 0.3} ${sy - 8} ${W * 0.6} ${sy + 8} ${W} ${sy - 2}" ${stroke(mx(SEA, DEEP, 0.5), 5)}/>`;
    const n = P ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const x = W * ((i + 0.5) / n);
      g += svgMangrove(x, wy + 4, P ? 1.02 : 1.04, { seed: i + 2 });
      g += `<path d="M${n1(x)} ${wy}C${n1(x - 6)} ${wy + 50} ${n1(x + 20)} ${wy + 80} ${n1(x - 12)} ${sy - 26}" ${stroke(lc('barkDark'), 9, 'stroke-linecap:round')}/><path d="M${n1(x)} ${wy + 44}Q${n1(x + 34)} ${wy + 58} ${n1(x + 46)} ${wy + 96}" ${stroke(lc('barkDark'), 5, 'stroke-linecap:round')}/>`;
    }
    (P ? [0.1, 0.3, 0.5, 0.7, 0.9] : [0.08, 0.24, 0.4, 0.56, 0.72, 0.88]).forEach((u, i) => {
      g += `<g class="bs-fall" style="--d:${(i * 0.3).toFixed(1)}s"><circle cx="${n1(W * u)}" cy="${wy + 18 + (i % 2) * 10}" r="9" ${fill(mx(INK, lc('red'), 0.3), `stroke:${INK};stroke-width:2`)}/></g>`;
      g += `<circle cx="${n1(W * u + 8)}" cy="${n1(sy - 18 - (i % 2) * 10)}" r="6" ${fill(mx(lc('sand'), lc('white'), 0.5), `stroke:${lc('sandDark')};stroke-width:2`)}/>`;
    });
    for (const [u, v] of [[0.18, 0.5], [0.5, 0.56], [0.8, 0.46]]) g += fitBio('Bacterium', n1(W * u - 40), n1(wy + band * v), 80, 24);
    g += pill(P ? W - 62 : W - 76, 24, 'Pollutants', { size: 15 });
    g += `<path d="M${P ? W - 44 : W - 56} 40L${n1(W * 0.9)} ${wy + 12}" ${stroke(INK, 2.5, 'stroke-linecap:round')}/>`;
    g += pill(W / 2, wy + band * 0.34, 'Roots and soil microbes', { size: 15, on: true });
    g += pill(W / 2, H - (P ? 32 : 26), 'Cleaner water', { size: 15 });
    return g;
  }
  draw(st, step) { return [this._b0, this._b1, this._b2][step].call(this, st); }
}
