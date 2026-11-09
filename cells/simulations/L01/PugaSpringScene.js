// PugaSpringScene - a drawn hot spring in the Puga Valley. The valley stays; only what the beat names is added.
//   Three-beat block: 0 valley, 1 lens on thermophiles, 2 early Earth inset. Two-beat block: 3 crust, 4 what it may have done.
//   Setup (PugaSetupScene) shows beat 0: steam and rock, no organisms.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwDefs, bacterium, eyepiece, n1, T, mx, rnd } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, stroke, fill } from '../shared/PlantArt.js';
import { valley, POOL, PUGA_CSS } from './PugaArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const IMG = new URL('../../media/L01/L01S02.png', import.meta.url).href;

export class PugaSpringScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static BEAT_MAPS = { 1: [one(0)], 2: [one(3), one(4)], 3: [one(0), one(1), one(2)] };
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A drawing of a hot spring in a cold, bare mountain valley. Steam rises from a blue pool with a mineral rim. Later views show rod-shaped bacteria under a lens, a small picture of the early Earth, and a white crust growing round the pool.';
  static CONTROLS = [];

  css() { return `.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }${PUGA_CSS}`; }
  stageHeight(st) { return st.portrait ? 420 : 410; }

  _step() { return this.hostRole === 'setup' ? 0 : this.stepIndex; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this._step(), p = POOL(W, H);
    let s = `<defs>${cwDefs()}</defs>` + valley(W, H, { crust: step >= 3 ? 1 : 0 });
    const size = P ? 16 : 18;
    if (step === 0) {
      s += label(W * 0.2, H * 0.1, 'cold air', { size, display: true }) + label(p.x, p.y + p.ry + 34, 'water nearly boiling', { size, display: true });
    }
    if (step === 1) {
      const R = P ? 118 : 138, cx = P ? W * 0.5 : W * 0.68, cy = P ? H * 0.38 : H * 0.42;
      const q = rnd(4); let body = '';
      for (let i = 0; i < 9; i++) body += bacterium(cx - R * 0.8 + q() * R * 1.5, cy - R * 0.8 + q() * R * 1.5, (P ? 0.32 : 0.36) * (0.86 + q() * 0.3), { rot: q() * 170, seed: i + 3 });
      s += `<path d="M${n1(cx - R * 0.5)} ${n1(cy + R * 0.8)}L${n1(p.x)} ${n1(p.y)}" ${stroke(T('elev-peak'), 4)} opacity=".8"/>`;
      s += `<g class="sv-pop">${lens(cx, cy, R, body)}</g>`;
      s += label(cx, cy + R + 24, 'thermophiles: one cell each', { size, display: true });
    }
    if (step === 2) {
      const R = P ? 92 : 112, cx = P ? W * 0.5 : W * 0.72, cy = P ? H * 0.26 : H * 0.3;
      s += `<g class="sv-pop"><clipPath id="pg-in"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}"/></clipPath><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 5}" ${fill(T('elev-peak'))}/><rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${2 * R}" height="${2 * R}" ${fill(mx('sea-deep', 'elev-peak', 60))} clip-path="url(#pg-in)"/><image href="${IMG}" x="${n1(cx - R * 2.3)}" y="${n1(cy - R * 1.16)}" width="${n1(R * 4.2)}" height="${n1(R * 2.3)}" clip-path="url(#pg-in)" preserveAspectRatio="xMinYMid slice"/></g>`;
      s += label(cx, cy + R + 24, 'early Earth, about 3.5 billion years ago', { size: P ? 15 : 16, display: true });
      s += label(p.x, p.y + p.ry + 34, 'Puga today', { size, display: true });
    }
    if (step === 3) s += P ? label(W / 2, 30, 'calcium carbonate forms', { size: 17, display: true }) + label(W / 2, 52, 'around the spring', { size: 17, display: true }) : label(W / 2, 34, 'calcium carbonate forms around the spring', { size: 19, display: true });
    if (step === 4) {
      let rays = '', dots = '';
      for (const u of [-1.3, -1.12, -0.94, 0.94, 1.12, 1.3]) { const ex = p.x + u * p.rx, ey = p.y + (Math.abs(u) > 1.2 ? 0 : -p.ry * 0.5), x0 = ex + 56; rays += `<path d="M${n1(x0)} ${n1(H * 0.04)}L${n1(ex + 4)} ${n1(ey - 12)}" ${stroke(T('magma'), 3.4)} stroke-dasharray="10 8"/><path d="M${n1(ex)} ${n1(ey)}l-6 -15 13 3Z" ${fill(T('magma'))}/>`; }
      const px = p.x - p.rx * 1.12, py = p.y + p.ry * 0.5, q = rnd(5);
      for (let i = 0; i < 7; i++) dots += `<circle cx="${n1(px - 15 + q() * 30)}" cy="${n1(py - 8 + q() * 16)}" r="3.4" ${fill(T('series-2'))}/>`;
      s += `<g class="sv-pop">${rays}</g><ellipse cx="${n1(px)}" cy="${n1(py)}" rx="28" ry="17" style="fill:${mx('strata-3', 'strata-1', 40)};stroke:${mx('strata-3', 'strata-6', 60)};stroke-width:2.4"/>${dots}`;
      s += label(W * 0.5, H * 0.1, 'harmful radiation', { size, display: true });
      s += label(W * 0.5, H - 26, P ? 'molecules sheltered?' : 'early molecules sheltered under the crust?', { size, display: true });
    }
    return { svg: frame(st, 'pg', s) };
  }
}
function lens(cx, cy, R, body) {
  const id = `pl${Math.round(cx)}`;
  return `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 8}" ${fill(mx('strata-6', 'sea-deep', 70))}/><clipPath id="${id}"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}"/></clipPath><g clip-path="url(#${id})"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}" style="fill:${mx('sea-shallow', 'elev-peak', 34)}"/>${body}</g><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}" style="fill:url(#cw-vign) transparent"/>`;
}
