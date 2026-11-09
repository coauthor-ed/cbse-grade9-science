// CellularKeyBoundaryScene - L10 blk-l10-s06, 3 beats. Beat 0: a bacterial cell beside a virus, each with its parts named.
// Beat 1: viruses lie inactive outside a host cell; Enter a cell runs one cycle: a virus reaches the cell, its genetic
// material goes in, the cell makes copies, and new viruses leave. Beat 2: the first test of the kingdoms. Yes goes on
// to five kingdoms, no stops the virus outside. Controls: enter.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { fitBio } from '../shared/BioArt.js';
import { tag, along, flowArrow } from '../L06/BodyKit.js';
import { anim, words } from '../shared/SeaBits.js';
import { rod, virus, virusThread, hostCell, mx, INK, n1 } from './EarthArt.js';

const T_RUN = 8;
const ss = (u) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };

export class CellularKeyBoundaryScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A bacterial cell with a wall, cytoplasm and DNA, beside a virus with only a coat and genetic material. Then a virus enters a host cell and the cell makes new viruses. Then the first test, made of cells: yes leads to the five kingdoms and no leaves the virus outside.';
  heights = [[452, 396], [370, 360], [430, 400]];
  _ran = false;
  ctls() { return [{ kind: 'btn', id: 'enter', label: 'Enter a cell', go: true }]; }
  onCtl() { if (this.isPlaying?.()) return; this._ran = true; this.play(T_RUN); this.repaint(); }
  enter(step) { this._ran = false; this.ctl?.show('enter', step === 1); }

  _b0(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('water'), lc('white'), 0.5))}/>`;
    if (P) {
      g += rod(W / 2 + 14, 96, 1.12);
      g += tag(70, 30, W / 2 - 60, 60, 'Cell wall', { size: 15 }) + tag(W - 76, 30, W / 2 + 60, 84, 'Cytoplasm', { size: 15 }) + tag(W - 60, 178, W / 2 + 40, 110, 'DNA', { size: 15 });
      g += pill(84, 180, 'A bacterium', { size: 16 });
      g += virus(W / 2 - 40, 298, 1.16, { open: true });
      g += tag(W - 64, 244, W / 2 - 4, 274, 'Coat', { size: 15 }) + tag(W - 84, 352, W / 2 - 32, 306, 'Genetic material', { size: 15 });
      g += pill(W / 2 - 40, 386, 'A virus: no cell', { size: 16, on: true });
    } else {
      const x0 = W * 0.31, x1 = W * 0.77;
      g += rod(x0 + 20, 158, 1.12);
      g += tag(x0 - 110, 44, x0 - 40, 116, 'Cell wall', { size: 16 }) + tag(x0 + 90, 44, x0 + 60, 136, 'Cytoplasm', { size: 16 }) + tag(x0 + 86, 262, x0 + 40, 176, 'DNA', { size: 16 });
      g += pill(x0, 306, 'A bacterium', { size: 17 });
      g += virus(x1, 160, 1.5, { open: true });
      g += tag(x1 + 64, 44, x1 + 40, 130, 'Coat', { size: 16 }) + tag(x1 - 6, 274, x1 + 4, 176, 'Genetic material', { size: 16 });
      g += pill(x1, 306, 'A virus: no cell', { size: 17, on: true });
    }
    g += pill(W / 2, H - 22, 'Drawn large: a virus is far smaller', { size: 14, bg: lc('white') });
    return g;
  }
  _geo(st) { const { W, H, portrait: P } = st; return { cx: P ? W * 0.56 : W * 0.6, cy: H / 2 + 4, r: P ? 128 : 146, sx: P ? 58 : 92, sy: P ? 86 : 110 }; }
  animate(st, t = 0) {
    if (this.stepIndex !== 1) return;
    const G = this._geo(st), T = !this._ran ? 0 : Math.min(T_RUN, this.clock ?? T_RUN), wall = [G.cx - G.r * 0.84, G.cy - G.r * 0.5];
    let s = '';
    const p = along([[G.sx, G.sy], wall], ss(T / 1.6));
    const th = T > 1.6 && T < 3.1;
    if (T < 2.2) s += virus(p[0], p[1], 0.6, { open: T > 1.6 });
    else s += `<g opacity="0.45">${virus(wall[0], wall[1], 0.6, { open: true })}</g>`;
    if (th) { const q = along([wall, [G.cx - G.r * 0.12, G.cy + G.r * 0.04]], ss((T - 1.6) / 1.5)); s += virusThread(q[0], q[1], 0.8); }
    const slots = [[0.5, -0.5], [0.58, 0.04], [0.2, 0.56], [-0.4, 0.5], [-0.5, -0.1], [0.05, -0.56]];
    slots.forEach(([u, v], i) => {
      const k = ss((T - 3.2 - i * 0.26) / 0.5); if (k <= 0) return;
      const home = [G.cx + G.r * u, G.cy + G.r * v], out = [G.cx + G.r * u * 1.66, G.cy + G.r * v * 1.66], q = along([home, out], ss((T - 6.1 - i * 0.1) / 1.4));
      s += virus(q[0], q[1], 0.36 * k);
    });
    if (T >= 6.8) s += pill(st.portrait ? 74 : 92, 26, 'New viruses', { size: 15, on: true });
    anim(this, 'v', s);
  }
  _b1(st) {
    const { W, H, portrait: P } = st, G = this._geo(st);
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('water'), lc('white'), 0.5))}/>`;
    g += hostCell(G.cx, G.cy, G.r);
    g += `<g data-anim="v"></g>`;
    if (!this._ran) { g += pill(P ? 64 : 92, 26, 'Inactive', { size: 15 }); }
    g += pill(G.cx, H - 18, 'Host cell', { size: 15 });
    return g;
  }
  _b2(st) {
    const { W, H, portrait: P } = st, sx = P ? W / 2 : W * 0.2, sy = P ? 62 : H / 2;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.62))}/>`;
    const ICONS = [['Monera', 'Bacterium'], ['Protista', 'Amoeba'], ['Fungi', 'Mushroom'], ['Plantae', 'FernPlant'], ['Animalia', 'Tiger']];
    const px = P ? 12 : W * 0.42, py = P ? 244 : 18, pw = P ? W - 24 : W - px - 12, ph = P ? H - py - 12 : H - 36;
    g += `<rect x="${n1(sx - (P ? 120 : 104))}" y="${sy - 34}" width="${P ? 240 : 208}" height="68" rx="16" ${fill(lc('white'), `stroke:${INK};stroke-width:3.5`)}/>`;
    g += words(sx, sy - 6, 'First test', { size: 15, ink: INK }) + words(sx, sy + 20, 'Is it made of cells?', { size: 19, display: true, ink: INK, weight: 600 });
    g += `<rect x="${n1(px)}" y="${py}" width="${n1(pw)}" height="${n1(ph)}" rx="18" ${fill(mx(lc('leaf'), lc('white'), 0.66), `stroke:${INK};stroke-width:3`)}/>`;
    g += words(px + pw / 2, py + 28, 'Five kingdoms', { size: 18, display: true, ink: INK, weight: 600 });
    const cols = P ? 5 : 2, rows = P ? 1 : 3, cw = pw / (P ? 5 : 2), ch = (ph - 40) / rows;
    ICONS.forEach(([n, a], i) => {
      const c = P ? i : i % 2, r = P ? 0 : i >> 1, x = px + c * cw + (!P && i === 4 ? cw / 2 : 0), y = py + 38 + r * ch;
      g += fitBio(a, x + 6, y + 2, cw - 12, ch - 30) + words(x + cw / 2, y + ch - 8, n, { size: 14, ink: INK });
    });
    if (P) {
      g += flowArrow([sx + 70, sy + 34], [sx + 76, 150], [sx + 76, py - 8], lc('leafDark'), 7) + pill(sx + 112, 148, 'Yes', { size: 15 });
      g += flowArrow([sx - 70, sy + 34], [sx - 78, 90], [sx - 84, 112], lc('red'), 7) + pill(sx - 132 + 12, 104, 'No', { size: 15 });
      g += virus(sx - 90, 170, 0.56) + pill(sx - 56, 222, 'Outside the system', { size: 14, on: true });
    } else {
      g += flowArrow([sx + 104, sy - 8], [sx + 128, sy - 8], [px - 8, sy - 8], lc('leafDark'), 7) + pill(sx + 124, sy - 34, 'Yes', { size: 15 });
      g += flowArrow([sx, sy + 34], [sx, sy + 56], [sx, sy + 80], lc('red'), 7) + pill(sx + 34, sy + 54, 'No', { size: 15 });
      g += virus(sx, sy + 126, 0.62) + pill(sx, H - 24, 'Outside the system', { size: 14, on: true });
    }
    return g;
  }
  draw(st, step) { return [this._b0, this._b1, this._b2][step].call(this, st); }
}
