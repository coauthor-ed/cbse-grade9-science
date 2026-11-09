// YeastKeyRepairScene - blk-l03-s03. A small key drawn as a branching path. Beat 0 lights yeast with a mushroom in Fungi.
// Beat 1 lights the wall check that parts Amoeba from yeast. Beat 2 lights the nucleus check that sends a bacterium to Monera.
import { BioStage, beats, pill, panel, waterBack, INK } from './BioStage.js';
import { stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';
import { words } from '../shared/SeaBits.js';

export class YeastKeyRepairScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A key. True nucleus? No: a bacterium goes to Monera. Yes: chitin wall? Yes: yeast and a mushroom go to Fungi. No: Amoeba goes to Protista.';
  heights = [[330, 380]];

  draw(st, step) {
    const W = st.W, H = st.H, P = st.portrait, pw = (W - 28) / 3, py = H - (P ? 142 : 176), ph = P ? 132 : 166, xs = [8, 14 + pw, 20 + 2 * pw], cx = xs.map((x) => x + pw / 2);
    const on = { mon: step === 2, pro: step >= 1 && step < 2, fun: step <= 1 };
    const a = (o) => `style="opacity:${o ? 1 : 0.28}"`, n1y = 30, n2y = P ? 100 : 104, n2x = (cx[1] + cx[2]) / 2;
    let s = waterBack(W, H);
    const ln = (d, o) => `<path d="${d}" ${stroke(INK, o ? 4 : 2.5, o ? '' : 'opacity:0.35')}/>`;
    s += ln(`M${W * 0.5} ${n1y}L${cx[0]} ${py}`, step === 2) + ln(`M${W * 0.5} ${n1y}L${n2x} ${n2y}`, step < 2);
    s += ln(`M${n2x} ${n2y}L${cx[1]} ${py}`, step === 1) + ln(`M${n2x} ${n2y}L${cx[2]} ${py}`, step < 2);
    const lab = (x, y, t) => words(x, y, t, { size: 14, ink: INK, halo: lc('white'), haloW: 4 });
    s += lab((W * 0.5 + cx[0]) / 2 - 12, (n1y + py) / 2, 'No') + lab((W * 0.5 + n2x) / 2 + 22, (n1y + n2y) / 2 + 4, 'Yes');
    s += lab((n2x + cx[1]) / 2 - 16, (n2y + py) / 2 + 2, 'No') + lab((n2x + cx[2]) / 2 + 20, (n2y + py) / 2 + 2, 'Yes');
    s += pill(W * 0.5, n1y, 'True nucleus?', { on: step === 2 }) + pill(n2x, n2y, 'Chitin wall?', { on: step === 1 });
    const k = P ? 0.56 : 0.76, m = py + ph * 0.46, name = (i, t, o) => words(cx[i], py + ph - 10, t, { size: P ? 16 : 19, display: true, ink: INK });
    s += `<g ${a(on.mon)}>${panel(xs[0], py, pw, ph)}${svgBio('Bacterium', cx[0], m, P ? 0.46 : 0.7, { form: 'rod' })}${name(0, 'Monera')}</g>`;
    s += `<g ${a(on.pro)}>${panel(xs[1], py, pw, ph)}${svgBio('Amoeba', cx[1], m, k)}${name(1, 'Protista')}</g>`;
    s += `<g ${a(on.fun)}>${panel(xs[2], py, pw, ph)}${svgBio('Yeast', cx[2] - pw * 0.2, m, k * 0.72, { buds: 1 })}${svgBio('Mushroom', cx[2] + pw * 0.24, m + 34 * k, k * 0.82)}${name(2, 'Fungi')}</g>`;
    return s;
  }
}
