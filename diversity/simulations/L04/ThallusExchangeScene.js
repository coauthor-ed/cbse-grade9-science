// ThallusExchangeScene - blk-l04-s04. Beat 0: Spirogyra in pond water, supplies crossing its surface on every cell. Beat 1: Lift out of the water: the
// thread lies on a rock, nothing crosses its surface. A second press puts it back.
import { BioStage, beats, pill, waterBack, flow, head } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';

export class ThallusExchangeScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'A Spirogyra thread in water. Water, nutrients and gases cross its surface at every cell. Lifted out of the water, the thread lies on a rock and nothing reaches it.';
  heights = [[260, 320], [260, 320]];
  ctls() { return [{ kind: 'btn', id: 'lift', label: 'Lift out of the water', go: true }]; }
  enter(step) { this._out = false; this.ctl?.label('lift', 'Lift out of the water'); this.ctl?.show('lift', step === 1); }
  onCtl(id) { if (id !== 'lift') return; this._out = !this._out; this.ctl?.label('lift', this._out ? 'Put it back in the water' : 'Lift out of the water'); this.repaint(); }

  draw(st, step) {
    const W = st.W, H = st.H, P = st.portrait, k = (W * 0.92) / 236, out = step === 1 && this._out, cy = H * 0.54;
    if (out) {
      const gy = H * 0.72;
      let s = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><path d="M0 ${H}V${gy}q${W * 0.5} -46 ${W} 0V${H}Z" ${fill(lc('strata5'))}/>`;
      s += `<g style="opacity:0.8">${svgBio('Spirogyra', W * 0.5, gy - 26, k * 0.9, { cells: 4, rot: 2 })}</g>`;
      return s + pill(W / 2, 30, 'No water reaches its surface', { on: true, size: P ? 15 : 17 }) + pill(W / 2, H - 20, 'Thallus on a dry rock');
    }
    let s = waterBack(W, H) + svgBio('Spirogyra', W * 0.5, cy, k, { cells: 4 });
    [0.14, 0.38, 0.62, 0.86].forEach((u, i) => {
      const x = W * u, col = i % 2 ? lc('waterDeep') : lc('leafDark');
      s += flow(`M${x} ${cy - 76}V${cy - 28}`, col, 4.5) + head(x, cy - 24, 90, col, 7);
      s += flow(`M${x + 14} ${cy + 26}V${cy + 74}`, col, 4.5, true) + head(x + 14, cy + 24, -90, col, 7);
    });
    return s + pill(W / 2, 28, step === 0 ? 'Every cell touches the water' : 'In water, it has all it needs', { on: true, size: P ? 15 : 17 }) + pill(W / 2, H - 24, 'Water, nutrients, gases', { size: P ? 14 : 15 });
  }
}
