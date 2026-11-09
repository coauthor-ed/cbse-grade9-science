// CropDiversityStressScene - L11 blk-l11-s06, 3 beats. Made-up varieties. Beat 0: two fields, one of A only and one of A and
// B mixed; Dry spell dries the soil and A wilts before B. Beat 1: after the spell, at rest: the mixed field keeps its B
// plants standing, and those are hurt too. Beat 2: two insects on crop leaves, one that helps and one that harms.
// Controls: dry.
import { BioStage, beats, pill } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { anim } from '../shared/SeaBits.js';
import { crop, ladybird, caterpillar, aphid, mx, INK, n1 } from './ForestArt.js';

const T_RUN = 5;
const ss = (u) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };
const FIELD = [['A', 'A', 'A', 'A', 'A', 'A'], ['A', 'B', 'A', 'B', 'A', 'B']];

export class CropDiversityStressScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'Two fields in a dry spell. In the field of variety A alone every plant wilts. In the field of A and B, the A plants wilt and the B plants stay up, less hurt. Then a ladybird eating aphids on one leaf and a caterpillar chewing another.';
  heights = [[430, 330], [430, 330], [340, 290]];
  _ran = false;
  _done = false;
  ctls() { return [{ kind: 'btn', id: 'dry', label: 'Dry spell', go: true }]; }
  onCtl() { if (this.isPlaying?.()) return; this._ran = true; this._done = false; this.play(T_RUN); this.repaint(); this.after(T_RUN + 0.1, () => { this._done = true; this.repaint(); }); }
  enter(step) { this._ran = false; this._done = false; this.ctl?.show('dry', step === 0); }

  _plants(st, u) {
    const { W, H, portrait: P } = st, wa = ss((u - 0.1) / 0.5), wb = ss((u - 0.45) / 0.55) * 0.36, fw = P ? W : W / 2, fh = P ? H / 2 : H, s = P ? 0.72 : 0.84;
    let g = '';
    FIELD.forEach((row, f) => {
      const x0 = P ? 0 : f * fw, y0 = P ? f * fh : 0, gy = y0 + fh - 34;
      row.forEach((k, i) => { g += crop(x0 + fw * (0.1 + i * 0.16), gy, s, k, k === 'A' ? wa : wb); });
    });
    return g;
  }
  animate(st, t = 0) {
    const step = this.stepIndex; if (step === 2) return;
    const u = step === 1 ? 1 : !this._ran ? 0 : Math.min(1, (this.clock ?? T_RUN) / T_RUN);
    anim(this, 'p', this._plants(st, u));
    const { W, H, portrait: P } = st;
    anim(this, 's', `<circle cx="${P ? W - 44 : W / 2}" cy="${P ? 44 : 40}" r="${n1(16 + 14 * u)}" ${fill(mx(lc('yellow'), lc('white'), 0.4), `stroke:${lc('yellow')};stroke-width:4`)}/>`);
  }
  _fields(st, dry) {
    const { W, H, portrait: P } = st, fw = P ? W : W / 2, fh = P ? H / 2 : H;
    let g = '';
    [0, 1].forEach((f) => {
      const x0 = P ? 0 : f * fw, y0 = P ? f * fh : 0, gy = y0 + fh - 34;
      g += `<rect x="${x0}" y="${y0}" width="${fw}" height="${fh}" ${fill(mx(lc('skyDay'), lc('white'), 0.4))}/>`;
      g += `<rect x="${x0}" y="${gy - 6}" width="${fw}" height="${fh - (gy - 6 - y0)}" ${fill(dry ? mx(lc('sand'), lc('soil'), 0.4) : lc('soil'))}/>`;
      for (let i = 0; i < 5; i++) g += `<path d="M${x0 + fw * (0.06 + i * 0.2)} ${gy + 12}h${fw * 0.12}" ${stroke(mx(lc('soil'), INK, 0.3), 3, 'stroke-linecap:round;opacity:0.5')}/>`;
      if (f) g += `<rect x="${P ? 0 : x0 - 2}" y="${P ? y0 - 2 : 0}" width="${P ? W : 4}" height="${P ? 4 : H}" ${fill(INK)}/>`;
    });
    return g;
  }
  _b0(st, dry) {
    const { W, H, portrait: P } = st, fw = P ? W : W / 2, fh = P ? H / 2 : H;
    let g = this._fields(st, dry) + `<g data-anim="s"></g><g data-anim="p"></g>`;
    g += pill(P ? 66 : fw / 2, 26, 'Only A', { size: 16 }) + pill(P ? 80 : fw * 1.5, P ? fh + 26 : 26, 'A and B mixed', { size: 16 });
    if (dry) g += pill(P ? 178 : fw / 2, P ? 26 : 64, 'All wilted', { size: 15, on: true }) + pill(P ? W - 110 : fw * 1.5, P ? fh + 26 : 64, 'Some still standing', { size: 15, on: true });
    return g;
  }
  _b2(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('leaf'), lc('white'), 0.6))}/>`;
    const leaf = (x, y, w, h, bite) => {
      const d = `M${x - w} ${y}C${x - w * 0.5} ${y - h} ${x + w * 0.5} ${y - h} ${x + w} ${y}C${x + w * 0.5} ${y + h} ${x - w * 0.5} ${y + h} ${x - w} ${y}Z`;
      let s = `<path d="${d}" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:4`)}/><path d="M${x - w} ${y}H${x + w}" ${stroke(lc('leafDark'), 3.5)}/>`;
      for (let i = 1; i < 6; i++) s += `<path d="M${x - w + i * w / 3} ${y}l${w * 0.14} ${-h * 0.56}M${x - w + i * w / 3} ${y}l${w * 0.14} ${h * 0.56}" ${stroke(lc('leafDark'), 2.4, 'opacity:0.6')}/>`;
      if (bite) for (const [u, v, r] of [[0.46, -0.5, 26], [0.74, -0.34, 18], [0.2, -0.72, 16]]) s += `<circle cx="${n1(x + w * u)}" cy="${n1(y + h * v)}" r="${r}" ${fill(mx(lc('leaf'), lc('white'), 0.6))}/>`;
      return s;
    };
    const col = (x, y, w) => {
      const a = leaf(x, y, w, 62, false) + ladybird(x - w * 0.34, y - 6, 0.82);
      let s = a;
      for (const [u, v] of [[0.14, -18], [0.34, 8], [0.5, -24], [0.62, 14]]) s += aphid(x + w * u, y + v, 1);
      return s;
    };
    if (P) {
      g += col(W / 2, 86, 150) + pill(W / 2, 166, 'Protects the crop', { size: 16, on: true });
      g += leaf(W / 2, 244, 150, 56, true) + caterpillar(W / 2 - 30, 256, 0.78) + pill(W / 2, H - 22, 'Damages the crop', { size: 16 });
    } else {
      const w = W / 4 - 12;
      g += col(W * 0.25, H / 2 - 20, w) + pill(W * 0.25, H - 40, 'Protects the crop', { size: 16, on: true });
      g += leaf(W * 0.75, H / 2 - 20, w, 76, true) + caterpillar(W * 0.72, H / 2 - 8, 0.86) + pill(W * 0.75, H - 40, 'Damages the crop', { size: 16 });
    }
    return g;
  }
  draw(st, step) { return step === 2 ? this._b2(st) : this._b0(st, step === 1 || this._done); }
}
