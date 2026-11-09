// PollinationRouteScene - L05 blk-l05-s01, 3 beats. Beat 0: pollen moves within one flower. Beat 1: from one flower to another on one
// plant. Beat 2: from a flower of one plant to a flower of another plant. The big word on the figure names the kind.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK, svgPlantColour as P, stroke } from '../shared/PlantArt.js';
import { frame, phoneMin, flowerSection, backdrop, peaLeaf, travel } from '../shared/FlowerArt.js';

const arc = (x0, y0, x1, y1, top) => { const d = `M${x0} ${y0}C${x0} ${top} ${x1} ${top} ${x1} ${y1}`; return `<path style="fill:none;stroke:${ART_INK};stroke-width:4;stroke-dasharray:4 11;stroke-linecap:round" d="${d}"/>${travel(d)}`; };
const big = (x, y, t) => words(x, y, t, { size: 26, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 7 });

export class PollinationRouteScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'Pollen moves from an anther to the stigma of the same flower, then to another flower on the same plant, both self-pollination. Then it moves to a flower on another plant, cross-pollination.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 450 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, fl = H - 40;
    const a = [backdrop('meadow', W, H, { floor: fl - 10 })];
    const plant = (x, s, pair) => {
      const top = fl - 250 * s;
      let g = `<path d="M${x} ${fl + 10}C${x + 4} ${fl - 80 * s} ${x - 4} ${top + 90 * s} ${x} ${top}" ${stroke(P('stem'), 9)}/>` + peaLeaf(x, fl - 60 * s, s * 0.9, { rot: -10 }) + peaLeaf(x, fl - 90 * s, s * 0.9, { rot: 190 });
      if (pair) g += `<path d="M${x} ${top + 96 * s}C${x + 50 * s} ${top + 86 * s} ${x + 160 * s} ${top + 100 * s} ${x + 170 * s} ${top + 40 * s}" ${stroke(P('stem'), 8)}/>` + `<path d="M${x} ${top + 96 * s}C${x - 50 * s} ${top + 86 * s} ${x - 160 * s} ${top + 100 * s} ${x - 170 * s} ${top + 40 * s}" ${stroke(P('stem'), 8)}/>`;
      return g;
    };
    if (b === 0) {
      const s = port ? 0.9 : 1.28, x = W / 2, y = H - (port ? 124 : 108);
      a.push(flowerSection(x, y, s, {}));
      const ax = x + 36 * s, ay = y - 142 * s;
      a.push(arc(ax + 10, ay - 12, x + 12, y - 208 * s, y - 214 * s));
      a.push(big(W / 2, H - 16, 'Self-pollination'), label(port ? W - 12 : x + 64 * s, port ? 34 : y - 204 * s, 'Same flower', { size: 17, anchor: port ? 'end' : 'start' }));
    } else if (b === 1) {
      const s = port ? 0.46 : 0.72, x = W / 2, d = port ? 88 : 172;
      const lx = x - d, rx = x + d, fy = fl - (port ? 170 : 170);
      const st2 = `<path d="M${x} ${fl + 8}C${x + 4} ${fl - 40} ${x} ${fl - 76} ${x} ${fl - 96}" ${stroke(P('stem'), 10)}/><path d="M${x} ${fl - 90}C${x - 40} ${fl - 104} ${lx + 8} ${fl - 90} ${lx} ${fy + 86 * s}" ${stroke(P('stem'), 8)}/><path d="M${x} ${fl - 90}C${x + 40} ${fl - 104} ${rx - 8} ${fl - 90} ${rx} ${fy + 86 * s}" ${stroke(P('stem'), 8)}/>` + peaLeaf(x, fl - 44, 0.9, { rot: -10 }) + peaLeaf(x, fl - 60, 0.9, { rot: 190 });
      a.push(st2, flowerSection(lx, fy, s, {}), flowerSection(rx, fy, s, {}));
      const ax = lx + 36 * s, ay = fy - 142 * s, tx = rx, ty = fy - 214 * s;
      a.push(arc(ax, ay - 8, tx, ty, ty - (port ? 70 : 80)));
      a.push(big(W / 2, 36, 'Self-pollination'), label(x, H - 14, 'One plant, two flowers', { size: 17 }));
    } else {
      const s = port ? 0.46 : 0.8, l = port ? W * 0.25 : W * 0.24, r = W - l, fy = fl - (port ? 120 : 120);
      for (const x of [l, r]) a.push(`<path d="M${x} ${fl + 8}L${x} ${fy + 60}" ${stroke(P('stem'), 9)}/>`, peaLeaf(x, fl - 36, 0.8, { rot: -8 }), peaLeaf(x, fl - 50, 0.8, { rot: 188 }), flowerSection(x, fy, s, {}));
      const ax = l + 36 * s, ay = fy - 142 * s, tx = r, ty = fy - 214 * s;
      a.push(arc(ax, ay - 8, tx, ty, ty - 72));
      a.push(big(W / 2, 36, 'Cross-pollination'), label(l, H - 14, 'Plant 1', { size: 17 }), label(r, H - 14, 'Plant 2', { size: 17 }));
    }
    return { svg: frame(st, 'pr', a.join('')) };
  }
}
