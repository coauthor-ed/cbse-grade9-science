// YolkStrategyScene - L06 blk-l06-s04, 5 beats. Beat 0: one store of yolk shared between many small eggs. Beat 1: a larva hatches and feeds:
// a caterpillar on a leaf. Beat 2: the butterfly cycle. Beat 3: one egg with much yolk and a chick. Beat 4: a mother's body holds the young one.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { uterusHeld } from '../shared/BodyArt.js';
import { label, words, ART_INK, stroke, svgPlantColour as P } from '../shared/PlantArt.js';
import { frame, phoneMin, backdrop, eggYolk, chick, lizard, caterpillar, pupa, butterfly, leafFlat, FLOWER_COLOURS as C } from '../shared/FlowerArt.js';

const big = (x, y, t, o = {}) => words(x, y, t, { size: 22, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6, ...o });

export class YolkStrategyScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'One store of yolk shared between many small eggs. A caterpillar feeds on a leaf. The butterfly cycle: egg, larva, pupa, emergence, adult. An egg rich in yolk hatches a chick. In mammals the zygote grows inside the female body.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 450 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, fl = H - 44;
    let a = backdrop(['pond', 'bokeh', 'meadow', 'soil', 'desk'][b], W, H, { floor: fl, seed: 6 });
    if (b === 0) {
      a += `<rect x="${W / 2 - (port ? 120 : 150)}" y="46" width="${port ? 240 : 300}" height="56" rx="16" style="fill:${C.yel};stroke:${ART_INK};stroke-width:3"/>` + big(W / 2, 32, 'Yolk from the mother', { size: 20 });
      const cols = port ? 8 : 12, rows = 5, g = port ? 39 : 46, x0 = W / 2 - (cols - 1) * g / 2;
      for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) a += eggYolk(x0 + i * g, 150 + r * (port ? 40 : 40), 1, { r: 13, yolk: 0.22 });
      a += label(W / 2, H - 14, 'Many eggs, little yolk in each', { size: 17 });
    }
    if (b === 1) {
      const s = port ? 2 : 2.8, x = W / 2, y = H * 0.56;
      a += leafFlat(x, y, s, {}) + caterpillar(x - 10, y - 10, port ? 1.2 : 1.6, {});
      const ex = port ? 50 : 84; a += eggYolk(ex, 90, 1, { r: 24, yolk: 0.22 }) + `<path d="M${ex + 32} 92c28 -6 44 10 56 34" ${stroke(ART_INK, 5)}/><path d="M${ex + 76} 120l12 6l2 -14" ${stroke(ART_INK, 5)}/>`;
      a += label(port ? 50 : 84, 46, 'Egg', { size: 16 }) + label(W / 2, H - 14, 'A larva is a feeding stage', { size: 17 });
    }
    if (b === 2) {
      const cx = W / 2, cy = H / 2 + 6, R = port ? 118 : 136, s = port ? 0.62 : 0.84, ex2 = port ? 1 : 1.5;
      a += `<ellipse cx="${cx}" cy="${cy}" rx="${R * ex2}" ry="${R}" ${stroke(P('skyDay'), 14)}/>`;
      const at = (i) => { const t = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(t) * ex2, cy + R * Math.sin(t)]; };
      const [p0, p1, p2, p3, p4] = [0, 1, 2, 3, 4].map(at);
      a += leafFlat(p0[0], p0[1] + 8, 0.72, {}) + eggYolk(p0[0], p0[1] - 8, 1, { r: 11, yolk: 0.3 });
      a += leafFlat(p1[0] - 4, p1[1] + 12, 0.8, {}) + caterpillar(p1[0] - 4, p1[1] - 2, s, {});
      a += pupa(p2[0], p2[1], s * 1.2, {}) + butterfly(p3[0], p3[1] + 8, s * 0.5, { alpha: 1 }) + pupa(p3[0] + 26, p3[1] - 12, s * 0.7, { alpha: 0.55 }) + butterfly(p4[0], p4[1], s * 1.2, {});
      const T = [['Egg', p0, 0, -28], ['Larva', p1, 0, 50], ['Pupa', p2, 0, 62], ['Emergence', p3, 0, 54], ['Adult', p4, 0, 58]];
      for (const [t, p, dx, dy] of T) a += label(p[0] + dx, p[1] + dy, t, { size: 16 });
    }
    if (b === 3) {
      const s = port ? 0.72 : 1.2, lx = W * 0.27, rx = W * 0.74, y = H * 0.46;
      a += eggYolk(lx, y, s, { r: 74, yolk: 0.62 }) + big(lx, y + 112 * s, 'Much yolk');
      a += chick(rx, fl - 50, port ? 1.6 : 2, {}) + big(W / 2, 40, 'Hatches as a young one', { size: 18 });
      a += `<path d="M${lx + 86 * s} ${y}L${rx - 66} ${y}" ${stroke(ART_INK, 5)}/><path d="M${rx - 78} ${y - 12}L${rx - 66} ${y}L${rx - 78} ${y + 12}" ${stroke(ART_INK, 5)}/>`;
      a += lizard(lx + (port ? 0 : 0), fl + 14, port ? 0.46 : 0.56, {});
    }
    if (b === 4) {
      const n = 3, gap = 8, cw = port ? W - 24 : (W - 24 - 2 * gap) / 3, ch = port ? (H - 24 - 2 * gap) / 3 : H - 90, cy0 = port ? 12 : 44;
      const cards = [['Little yolk', 'larva hatches'], ['Much yolk', 'young hatches'], ['Inside mother', 'young grows']];
      cards.forEach(([t1, t2], i) => {
        const x = port ? 12 : 12 + i * (cw + gap), y = port ? cy0 + i * (ch + gap) : cy0, iw = port ? 150 : cw, ih = port ? ch : ch * 0.66, mx = x + iw / 2, my = y + ih / 2;
        const tint = [P('leafLit'), C.yelL, C.pinkL][i];
        a += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14" style="fill:var(--sim-bg-surface);stroke:var(--sim-stroke);stroke-width:2.5"/>`;
        a += `<clipPath id="yc${i}"><rect x="${x + 2}" y="${y + 2}" width="${iw - 4}" height="${ih - 4}" rx="12"/></clipPath><g clip-path="url(#yc${i})"><rect x="${x}" y="${y}" width="${iw}" height="${ih}" style="fill:url(#yw${i})"/>`;
        a += `<defs><radialGradient id="yw${i}" cx="0.42" cy="0.36" r="0.86"><stop offset="0" style="stop-color:color-mix(in oklab, ${tint} 34%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:${tint}"/></radialGradient></defs>`;
        if (i === 0) a += leafFlat(mx, my + 14, port ? 0.86 : 1.06, {}) + caterpillar(mx, my + 2, port ? 0.56 : 0.72, {});
        if (i === 1) { for (let k = 0; k < 16; k++) a += `<path d="M${mx - 70 + k * 9} ${my + 40 - (k % 3) * 4}q${10 + k % 4} ${-12 + k % 5} ${24} ${-2 + k % 3}" ${stroke(k % 2 ? C.wood : C.woodD, 3)}/>`; a += chick(mx, my + (port ? 2 : 4), port ? 0.82 : 1.1, {}); }
        if (i === 2) a += uterusHeld(mx, my + (port ? 2 : 6), { g: port ? 0.3 : 0.44, stage: 7, placenta: true, h: port ? 50 : 76 }).svg;
        a += '</g>';
        const tx = port ? x + iw + 12 : x + cw / 2, ty = port ? y + ch / 2 - 4 : y + ih + (ch - ih) * 0.42, anchor = port ? 'start' : 'middle';
        a += words(tx, ty, t1, { size: 17, display: true, ink: 'var(--sim-label)', anchor }) + words(tx, ty + 22, t2, { size: 15, ink: 'var(--sim-label)', anchor });
      });
    }
    return { svg: frame(st, 'ys', a) };
  }
}
