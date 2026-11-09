// PeaBaggingScene - L04 blk-l04-s02 (setup) and s03 (4 beats). One pea plant with the five treatments of the activity, no result on the
// setup. Step 1: pods. Step 2: inside a bagged flower, its own pollen reaches its stigma while outside pollen stays out. Step 3: the
// two flowers with stamens removed, bare stigma against stigma with pollen. Step 4: pollen moves from anther to stigma: pollination.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK, stroke, fill, svgPlantColour as P } from '../shared/PlantArt.js';
import { frame, phoneMin, backdrop, peaFlower, peaLeaf, tendril, peaCloseUp, flowerSection, pollenGrain, shape, FLOWER_COLOURS as C } from '../shared/FlowerArt.js';

const F = [
  { stage: 'bud', stamens: true, bag: true, top: 'Young bud', mid: 'Stamens in', low: 'Bag', pod: true },
  { stage: 'bud', stamens: false, bag: true, top: 'Young bud', mid: 'Stamens out', low: 'Bag', pod: false },
  { stage: 'open', stamens: false, bag: true, top: 'Open flower', mid: 'Stamens out', low: 'Bag', pod: true },
  { stage: 'open', stamens: true, bag: true, top: 'Open flower', mid: 'Stamens in', low: 'Bag', pod: true },
  { stage: 'open', stamens: true, bag: false, top: 'Open flower', mid: 'Stamens in', low: 'No bag', pod: true },
];

export class PeaBaggingScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }]];
  static CONTROLS_IN_SIGHT = true;
  static BEAT_MAPS = { 1: [[{ idx: 0 }]], 4: [[{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }]] };
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 500;
  static ARIA_LABEL = 'A pea plant with five treatments: two young buds and three open flowers, some with stamens removed, four in muslin bags. Later four give pods; only the young bud with stamens removed does not. Close views show pollen on the stigma.';
  static CONTROLS = [];
  // The setup is capped at the card's height on a phone: no root padding, so it takes the same 350x400 design as the other setups (274 wide).
  css() { return this.hostRole === 'setup' ? '.sim-dom-root--portrait.svs { padding: 0; }' : ''; }
  onBeatChange(b, n) { if (this.hostRole === 'setup') super.onBeatChange(0, 1); else super.onBeatChange(b, n); }
  stageHeight(st) { return st.portrait ? (this.hostRole === 'setup' ? 400 : 470) : (this.stepIndex >= 1 ? 400 : 320); }

  _row(st, a, result) {
    const W = st.W, H = st.H, port = st.portrait, R = result && !port;   // R: the results, wide: larger pods and readings
    const short = port && this.hostRole === 'setup', y2 = short ? 312 : 340, y1 = short ? 116 : 128, lab = short ? 16 : 14;
    const place = port ? [[0.17, y1], [0.5, y1], [0.83, y1], [0.33, y2], [0.67, y2]] : [[0.1, 186], [0.3, 186], [0.5, 186], [0.7, 186], [0.9, 186]];
    const s = port ? 0.92 : 1.08;
    const ys = port ? [y1, y2] : [186];
    for (const y0 of ys) a.push(shape(`M-6 ${y0 - 112}C${W * 0.3} ${y0 - 126} ${W * 0.7} ${y0 - 98} ${W + 6} ${y0 - 116}L${W + 6} ${y0 - 108}C${W * 0.7} ${y0 - 90} ${W * 0.3} ${y0 - 118} -6 ${y0 - 104}Z`, P('stem'), 2.5));
    for (const y0 of ys) { const py = y0 + (port ? 26 : 40) - 20 + (R ? 46 : 0) + (short ? 6 : 0), ph = R ? 120 : result ? 84 : short ? 70 : 76; a.push(`<rect x="8" y="${py}" width="${W - 16}" height="${ph}" rx="12" style="fill:var(--sim-bg-surface);fill-opacity:0.8;stroke:var(--sim-stroke);stroke-width:1.5"/>`); }
    F.forEach((f, i) => {
      const [u, y] = place[i], x = u * W;
      a.push(`<path d="M${x} ${y - 108}L${x} ${y - 70}" ${stroke(P('stem'), 5)}/>`);
      if (i % 2 === 0) a.push(peaLeaf(x + 10, y - 110, 0.62, { rot: 8 })); else a.push(tendril(x + 8, y - 108, 0.8, {}));
      const grown = result;
      if (grown && !f.pod) a.push(`<path d="M${x} ${y - 70}C${x + 4} ${y - 44} ${x + 10} ${y - 30} ${x + 12} ${y - 14}" ${stroke(P('sick'), 6)}/>`);
      else if (grown) a.push(`<g class="sv-pop">${peaFlower(x, y - 70, s * (R ? 1.34 : 0.92), { pod: true, rot: 84 })}</g>`);
      else a.push(peaFlower(x, y, s, { stage: f.stage, stamens: f.stamens, bag: f.bag }));
      const cy = y + (port ? 26 : 40) + (R ? 46 : 0), lh = 18, rs = R ? 17 : 14;
      const col = (t) => label(x, 0, t, { size: 14 });
      if (grown) {
        a.push(`<g transform="translate(${x} ${cy + 8})">` + (f.pod ? words(0, 6, 'Pod', { size: R ? 26 : 20, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 }) : words(0, 6, 'No pod', { size: R ? 26 : 20, display: true, ink: P('redDark'), halo: 'var(--sim-elev-peak)', haloW: 6 })) + '</g>');
        a.push(label(x, cy + (R ? 44 : 36), f.top, { size: rs }) + label(x, cy + (R ? 68 : 54), f.mid, { size: rs }));
      } else {
        a.push(label(x, cy + 6, f.top, { size: lab }) + label(x, cy + 6 + lh, f.mid, { size: lab }) + label(x, cy + 6 + 2 * lh, f.low, { size: lab }));
      }
      a.push(`<circle cx="${x - (port ? 38 : 50)}" cy="${y - 76}" r="13" ${fill('var(--sim-bg-surface)', `stroke:${ART_INK};stroke-width:2.5`)}/>` + words(x - (port ? 38 : 50), y - 70, String(i + 1), { size: 16, ink: 'var(--sim-label)' }));
    });
  }

  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex;
    const a = [backdrop(b >= 2 ? 'bokeh' : 'trellis', W, H, {})];
    if (b <= 1) this._row(st, a, b === 1);
    if (b === 2) {
      const cx = W / 2, by = port ? 330 : 310, s = port ? 1.28 : 1.3;
      a.push(`<ellipse cx="${cx}" cy="${by - 80 * s}" rx="${142 * s}" ry="${152 * s}" style="fill:${C.cloth};fill-opacity:0.6;stroke:${C.clothD};stroke-width:4"/>` + Array.from({ length: 13 }, (_, i) => `<path d="M${cx - 150 * s} ${by - 170 * s + i * 28}L${cx + 150 * s} ${by - 150 * s + i * 28}M${cx - 138 * s + i * 26 * s} ${by - 240 * s}L${cx - 150 * s + i * 26 * s} ${by + 70 * s}" clip-path="url(#pb-bag)" style="fill:none;stroke:${C.clothD};stroke-width:1;opacity:0.3"/>`).join('') + `<defs><clipPath id="pb-bag"><ellipse cx="${cx}" cy="${by - 80 * s}" rx="${142 * s}" ry="${152 * s}"/></clipPath></defs>`);
      a.push(peaCloseUp(cx, by, s, { stamens: true, grains: 8, outline: 'bud' }));
      const dots = [[0.08, 0.2], [0.14, 0.55], [0.9, 0.3], [0.86, 0.62], [0.1, 0.8]];
      for (const [u, v] of dots) a.push(pollenGrain(W * u, H * v, 0.9, { spiny: true, col: P('wild') }));
      a.push(label(cx, port ? 30 : 30, 'Muslin bag', { size: 16 }));
      a.push(label(cx, H - 12, 'Pollen from outside stays out', { size: 15 }));
      a.push(label(port ? W - 12 : cx + 62 * s, port ? by - 190 * s : by - 150 * s, 'Own pollen', { size: 16, anchor: port ? 'end' : 'start' }));
    }
    if (b === 3) {
      const s = port ? 0.92 : 1.08;
      const pts = port ? [[W / 2, 200], [W / 2, 432]] : [[W * 0.27, 320], [W * 0.73, 320]];
      const panel = (x, y, opts, t1, t2, bad) => {
        const out = [peaCloseUp(x, y, s, opts)];
        out.push(label(x, y + (port ? 16 : 48), t1, { size: port ? 15 : 17 }) + words(x, y + (port ? 34 : 80), t2, { size: 19, display: true, ink: bad ? P('redDark') : ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 }));
        return out.join('');
      };
      if (port) {
        a.push(peaCloseUp(W * 0.27, 250, 0.82, { stamens: false, grains: 0, outline: 'bud', young: true }), peaCloseUp(W * 0.73, 250, 0.72, { stamens: false, grains: 8, outline: 'open' }));
        a.push(label(W * 0.27, 318, 'Young bud', { size: 15 }), label(W * 0.73, 318, 'Open flower', { size: 15 }));
        a.push(words(W * 0.27, 350, 'No pollen', { size: 19, display: true, ink: P('redDark'), halo: 'var(--sim-elev-peak)', haloW: 6 }), words(W * 0.73, 350, 'Pollen here', { size: 19, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 }));
        a.push(label(W / 2, 390, 'Stamens removed from both', { size: 15 }));
      } else {
        a.push(panel(pts[0][0], 280, { stamens: false, grains: 0, outline: 'bud', young: true }, 'Young bud', 'No pollen on stigma', true));
        a.push(panel(pts[1][0], 280, { stamens: false, grains: 8, outline: 'open' }, 'Open flower', 'Pollen already here', false));
      }
      if (!port) a.push(label(W / 2, 34, 'Stamens removed from both', { size: 16 }));
    }
    if (b === 4) {
      const cx = W / 2, by = port ? 330 : 300, s = port ? 0.92 : 1.12;
      a.push(flowerSection(cx, by, s, {}));
      const ax = cx + 84 * s, ay = by - 92 * s, tx = cx, ty = by - 204 * s;
      a.push(`<path d="M${ax} ${ay - 12}C${ax + 10} ${ty - 40} ${tx + 70} ${ty - 44} ${tx + 16} ${ty - 12}" style="fill:none;stroke:${ART_INK};stroke-width:4;stroke-dasharray:3 10;stroke-linecap:round"/>`);
      a.push(pollenGrain(ax + 2, ay - 24, 0.8, {}) + pollenGrain(tx + 40, ty - 28, 0.8, {}) + pollenGrain(tx + 16, ty - 14, 0.8, {}));
      a.push(words(port ? W / 2 : W * 0.16, port ? 410 : 60, 'Pollination', { size: 28, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 7 }));
      a.push(label(ax + (port ? 2 : 90), ay + 2 + (port ? 44 : 0), 'Anther', { size: 16 }), label(tx - 58, ty + 10, 'Stigma', { size: 16 }));
    }
    return { svg: frame(st, 'pb', a.join('')) };
  }
}
