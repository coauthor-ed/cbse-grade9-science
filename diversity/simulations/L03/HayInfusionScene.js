// HayInfusionScene - blk-l03-s05b, new. Book Activity 12.5. Beat 0: a bottle built one step at a time with Next step. Beat 1: a drop under the microscope,
// with the three protists drawn. Beat 2: lab coat, mask, gloves, and the school autoclaving before it discards.
import { BioStage, beats, pill, panel, INK } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { words } from '../shared/SeaBits.js';

const STEP = ['Collect grass, straw or fodder', 'Fill one fourth of the bottle', 'Add stagnant or pond water', 'Tie on muslin cloth', 'Leave it for a week'];

export class HayInfusionScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A hay infusion in five steps: collect grass, fill a bottle one fourth, add pond water, tie on muslin cloth, leave for a week. Then a drop under a microscope, and a lab coat, mask and gloves.';
  heights = [[320, 340], [320, 380], [270, 330]];

  ctls() { return [{ kind: 'btn', id: 'next', label: 'Next step', go: true }]; }
  enter(step) { this._n = 0; this.ctl?.label('next', 'Next step'); this.ctl?.show('next', step === 0); }
  onCtl(id) { if (id !== 'next') return; this._n = (this._n + 1) % 5; this.ctl?.label('next', this._n === 4 ? 'Start again' : 'Next step'); this.repaint(); }

  _bottle(st) {
    const W = st.W, H = st.H, P = st.portrait, n = this._n ?? 0, bw = P ? 130 : 160, bh = P ? 190 : 230, x = W / 2 - bw / 2, y = H - bh - 22, gy = H - 22;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="22" ${fill(lc('strata2'))}/>`;
    const blade = (px, py, c, r) => `<path d="M${px} ${py}q${r * 0.5} ${-r} ${r * 1.2} ${-r * 0.9}" ${stroke(c, 4)}/>`;
    if (n === 0) { for (let i = 0; i < 16; i++) s += blade(W * 0.72 + i * 6 - 40, gy, i % 2 ? lc('leaf') : lc('moss'), 18 + (i * 7) % 16); }
    const inner = `M${x + 8} ${y + 44}v${bh - 62}q0 10 10 10h${bw - 36}q10 0 10 -10v${-(bh - 62)}Z`;
    if (n >= 2) s += `<path d="${inner}" ${fill(n === 4 ? `color-mix(in oklab, ${lc('water')} 55%, ${lc('strata2')})` : lc('water'))}/>`;
    if (n >= 1) { for (let i = 0; i < 22; i++) { const px = x + 16 + ((i * 37) % (bw - 40)), py = y + bh - 26 - ((i * 13) % (bh * 0.2)); s += `<path d="M${px} ${py}l${14} ${(i % 3) * 5 - 5}" ${stroke(i % 2 ? lc('moss') : lc('strata2'), 3.5)}/>`; } }
    s += `<path d="M${x + bw * 0.3} ${y}h${bw * 0.4}v26q${bw * 0.3} 6 ${bw * 0.3} 24v${bh - 60}q0 10 -10 10h${-bw + 20}q-10 0 -10 -10v${-(bh - 60)}q0 -18 ${bw * 0.3} -24Z" ${stroke(INK, 3.5)}/>`;
    if (n >= 3) s += `<path d="M${x + bw * 0.24} ${y + 6}q${bw * 0.26} -18 ${bw * 0.52} 0l-4 20h${-bw * 0.44}Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:2.5`)}/><path d="M${x + bw * 0.28} ${y + 24}h${bw * 0.44}" ${stroke(lc('bark'), 3.5)}/>`;
    s += pill(W / 2, 24, `Step ${n + 1} of 5`, { on: true });
    s += words(W / 2, 54, STEP[n], { size: P ? 15 : 17, ink: INK, halo: lc('white') });
    return s;
  }

  _scope(st) {
    const W = st.W, H = st.H, P = st.portrait, r = Math.min(H * 0.44, P ? 136 : 170), cx = W / 2, cy = H / 2 + 6;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('ink'))}/><circle cx="${cx}" cy="${cy}" r="${r}" ${fill(`color-mix(in oklab, ${lc('water')} 34%, ${lc('white')})`, `stroke:${lc('strata5')};stroke-width:8`)}/>`;
    const k = r / 170;
    s += `<g class="bs-drift" style="--dx:10px;--dy:6px">${svgBio('Amoeba', cx - 62 * k, cy - 50 * k, 0.8 * k)}</g>`;
    s += `<g class="bs-drift" style="--dx:-12px;--dy:4px;--d:0.4s">${svgBio('Paramecium', cx + 54 * k, cy + 4 * k, 0.78 * k)}</g>`;
    s += `<g class="bs-drift" style="--dx:8px;--dy:-8px;--d:0.8s">${svgBio('Euglena', cx - 50 * k, cy + 92 * k, 0.72 * k)}</g>`;
    return s + pill(W / 2, 22, 'One drop, enlarged', { size: 14 });
  }

  _safe(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 4 * g) / 3, ph = H - 60, xs = [g, 2 * g + pw, 3 * g + 2 * pw], m = g + ph * 0.42;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('waterPale'))}/>`;
    ['Lab coat', 'Mask', 'Gloves'].forEach((t, i) => { s += panel(xs[i], g, pw, ph) + words(xs[i] + pw / 2, g + ph - 14, t, { size: P ? 16 : 19, display: true, ink: INK }); });
    const c = xs.map((x) => x + pw / 2), k = P ? 0.8 : 1.1;
    s += `<path transform="translate(${c[0]} ${m}) scale(${k})" d="M-12 -46l12 14l12 -14l26 12l-6 44l-12 -4v50h-40v-50l-12 4l-6 -44ZM0 -32v92M-6 -12h1M-6 8h1M-6 28h1" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:3`)}/>`;
    s += `<g transform="translate(${c[1]} ${m}) scale(${k})"><path d="M-36 -18q36 -14 72 0v24q-36 26 -72 0Z" ${fill(lc('waterPale'), `stroke:${INK};stroke-width:3`)}/><path d="M-36 -8l-16 -10M-36 2l-16 8M36 -8l16 -10M36 2l16 8M-30 -6h60M-30 6h60" ${stroke(INK, 2.5)}/></g>`;
    s += `<path transform="translate(${c[2]} ${m}) scale(${k})" d="M-20 38v-34l-10 -30q0 -8 7 -6l9 22v-34q0 -7 7 -7t7 7v-4q0 -7 7 -6t6 7v8q7 -5 12 2l-2 40q0 12 -8 20v15Z" ${fill(lc('water'), `stroke:${INK};stroke-width:3`)}/>`;
    return s + pill(W / 2, H - 26, 'School autoclaves it, then discards it', { size: P ? 14 : 15 });
  }

  draw(st, step) { return [this._bottle, this._scope, this._safe][step].call(this, st); }
}
