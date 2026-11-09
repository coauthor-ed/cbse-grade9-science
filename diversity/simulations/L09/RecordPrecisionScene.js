// RecordPrecisionScene - L09 blk-l09-s01, 2 beats. Beat 0: one tiger with its four names around it. Beat 1: a report that
// says only "Mammal", and three animals it could mean; the two things we need.
import { BioStage, beats, pill, panel, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { fitBio } from '../shared/BioArt.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { dolphinBig, fitBig, mx } from '../L08/VertArt.js';

const NAMES = [['bagh', 'Hindi'], ['puli', 'Tamil'], ['tiger', 'English'], ['tigre', 'French']];

export class RecordPrecisionScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'One tiger with four names around it: bagh in Hindi, puli in Tamil, tiger in English and tigre in French. Then a report that says only mammal, with a tiger, a bat and a dolphin it could mean.';
  heights = [[370, 390], [400, 390]];
  _names(st) {
    const { W, H, portrait: P } = st, gy = H - 34;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('leaf'), lc('white'), 0.56))}/>`;
    for (let i = 0; i < 7; i++) { const x = 18 + i * W / 7; g += `<rect x="${x}" y="-6" width="${16 + (i % 3) * 8}" height="${gy + 8}" rx="6" ${fill(mx(lc('bark'), lc('leaf'), 0.5), 'opacity:0.42')}/>`; }
    g += `<rect y="${gy}" width="${W}" height="${H}" ${fill(lc('leafDark'))}/>`;
    g += fitBig('Tiger', W / 2 - (P ? 160 : 210), gy - (P ? 178 : 212) + 4, P ? 320 : 420, P ? 178 : 214);
    const cw = P ? 150 : 170, ch = 60, pos = P ? [[12, 12], [W - cw - 12, 12], [12, 84], [W - cw - 12, 84]] : [[16, 16], [W - cw - 16, 16], [16, 92], [W - cw - 16, 92]];
    NAMES.forEach(([n, l], i) => {
      const [x, y] = pos[i];
      g += `<g class="bs-pop" style="--d:${(i * 0.1).toFixed(1)}s">` + panel(x, y, cw, ch, lc('white')) + words(x + cw / 2, y + 28, n, { size: 21, display: true, ink: INK }) + words(x + cw / 2, y + 48, l, { size: 14, ink: INK }) + '</g>';
    });
    return g;
  }
  _broad(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    const nw = P ? 230 : 280, nx = (W - nw) / 2;
    g += panel(nx, 14, nw, 78, lc('white'));
    g += words(W / 2, 42, 'Wildlife report', { size: 14, ink: INK }) + words(W / 2, 74, 'Mammal', { size: 27, display: true, ink: INK });
    const cw = (W - 44) / 3, y = 112, ch = H - y - 74;
    [['Tiger', 'Tiger'], ['Bat', 'Bat'], ['Dolphin', 'Dolphin']].forEach(([a, l], i) => {
      const x = 12 + i * (cw + 10);
      g += panel(x, y, cw, ch, mx(lc('skyDay'), lc('white'), 0.3));
      g += a === 'Dolphin' ? dolphinBig(x + cw / 2, y + ch / 2 - 10, (cw - 22) / 340) : a === 'Tiger' ? fitBig('Tiger', x + 8, y + 16, cw - 16, ch - 56) : fitBio(a, x + 8, y + 16, cw - 16, ch - 56);
      g += words(x + cw / 2, y + ch - 14, `${l}?`, { size: 17, display: true, ink: INK });
    });
    g += pill(W * 0.27, H - 34, 'An exact place', { size: P ? 14.5 : 16, on: true }) + pill(W * 0.73, H - 34, 'One shared name', { size: P ? 14.5 : 16, on: true });
    return g;
  }
  draw(st, step) { return step === 0 ? this._names(st) : this._broad(st); }
}
