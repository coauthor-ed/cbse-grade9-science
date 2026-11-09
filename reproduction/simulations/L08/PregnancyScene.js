// PregnancyScene - the book's row of 11 stages in three trimesters (6, 2, 3 stages, as printed), and a large uterus in
// section holding the stage named. 4 beats: first, second, third trimester, childbirth. Stages are silhouettes with
// no face. Sizes grow but are not to scale. Placenta and cord show from the second trimester. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { BODY_CSS, uterusHeld, frame, tag, txt, leader, n, embryoSvg } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const TRI = [[0, 5, '1st trimester'], [6, 7, '2nd trimester'], [8, 10, '3rd trimester']];
const HERO = [4, 7, 10, 10];                // stage in the uterus on each beat
const TONE = ['color-mix(in oklab, var(--sim-series-2) 26%, var(--sim-bg-surface))', 'color-mix(in oklab, var(--sim-series-8) 30%, var(--sim-bg-surface))', 'color-mix(in oklab, var(--sim-series-4) 32%, var(--sim-bg-surface))'];

export class PregnancyScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 480;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'Stages of pregnancy: eleven stages in a row in three trimesters, from a few cells to a full-grown baby, drawn plainly, and a section of the uterus holding the stage named. Not to scale.';
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 450 : 410; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, T = Math.min(step, 2);
    let s = '';
    // the row: one line in landscape; three lines in portrait
    const stripH = P ? 170 : 104, y0 = H - stripH - 8;
    if (!P) {
      const u = (W - 28) / 11, bandY = H - 38;
      TRI.forEach(([a, b, lab], i) => {
        const on = i === T, x = 14 + a * u, w = (b - a + 1) * u - 3;
        s += `<rect x="${n(x)}" y="${bandY}" width="${n(w)}" height="30" rx="9" style="fill:${TONE[i]};stroke:var(--sim-stroke);stroke-width:2;opacity:${on ? 1 : 0.4}"/>`;
        s += txt(x + w / 2, bandY + 21, lab, { size: 14, op: on ? 1 : 0.6 });
        for (let j = a; j <= b; j++) s += `<g style="opacity:${on ? 1 : 0.32}">${embryoSvg(j, 14 + (j + 0.5) * u, bandY - 32, 20 + j * 3.6)}</g>`;
      });
    } else {
      TRI.forEach(([a, b, lab], i) => {
        const on = i === T, y = y0 + i * 58, cnt = b - a + 1, u = (W - 112) / 6;
        s += `<g style="opacity:${on ? 1 : 0.36}"><rect x="6" y="${y}" width="${W - 12}" height="52" rx="10" style="fill:${TONE[i]};stroke:var(--sim-stroke);stroke-width:2"/>`;
        s += txt(50, y + 22, lab.split(' ')[0], { size: 14 }) + txt(50, y + 40, 'trimester', { size: 14 });
        for (let j = 0; j < cnt; j++) s += embryoSvg(a + j, 104 + (j + 0.5) * u, y + 26, 20 + (a + j) * 2.1);
        s += '</g>';
      });
    }
    const cy = P ? 46 + (y0 - 56) * 0.47 : 50 + (H - 158) * 0.47;
    const U = uterusHeld(W / 2, cy, { P, g: [0.68, 0.86, 1, 1][step], stage: HERO[step], placenta: step >= 1, down: step === 3, h: [P ? 56 : 66, P ? 96 : 112, P ? 130 : 150, P ? 130 : 150][step] });
    this._pl = U.placenta; this._cd = U.cord;
    s += U.svg;
    const lab = [['Embryo: major organs forming'], ['Foetus: bigger and stronger'], ['Baby grows rapidly'], ['Contractions push the baby out']][step][0];
    s += tag(P ? W / 2 : 16, 26, lab, { size: P ? 15 : 16, display: true, anchor: P ? undefined : 'start' });
    if (step === 1 || step === 2) s += leader(W - 84, cy - 64, this._pl[0] + 8, this._pl[1] + 6) + tag(W - 10, cy - 66, 'Placenta', { size: 14, anchor: 'end' });
    if (step === 2) s += tag(W - 10, cy + 40, 'Cord', { size: 14, anchor: 'end' }) + leader(W - 64, cy + 40, this._cd[0] + 2, this._cd[1] - 4);
    s += P ? txt(W - 12, y0 - 6, 'not to scale', { size: 14, anchor: 'end', col: 'var(--sim-label-muted)' }) : txt(W - 16, 28, 'not to scale', { size: 14, anchor: 'end', col: 'var(--sim-label-muted)' });
    return { svg: frame(st, 'pg', s, { field: { a: 8, b: 2, seed: 17, k: 12, x: 0.6 } }) };
  }
}
