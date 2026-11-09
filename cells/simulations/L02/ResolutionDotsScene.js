// ResolutionDotsScene - two dots on paper. Left: the real gap, enlarged. Right: what an eye sees from 25 cm, each dot spread by a fixed blur,
// so the two blurs truly merge near 0.1 mm: the picture is the claim, not a switch. The slider uses the steps in GAPS (mm).
//   beat 0 free, gap 0.5  beat 1 gap 0.1  beat 2 gap 0.08, the limit marked
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwDefs, T, mx, n1 } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, stroke, fill, ctlBar } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const GAPS = [1, 0.7, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08, 0.06, 0.04, 0.02];
const START = [2, 7, 8];
const fmt = (g) => (g < 0.1 ? g.toFixed(2) : String(g));

export class ResolutionDotsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 560;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Two dots on paper with a slider for the gap between them. A round view shows what the eye sees from 25 cm. The dots are seen as two down to about 0.1 mm, and below that they merge into one.';
  static CONTROLS = [];
  static HIDE_VALUE = false;

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 380 : 380; }
  async setup() {
    this._i = START[0];
    await super.setup();
    if (this.constructor.HIDE_VALUE) return;
    this.ctl = ctlBar(this, [{ kind: 'range', id: 'gap', label: 'Gap', min: 0, max: GAPS.length - 1, step: 1, value: this._i, read: (v) => `${fmt(GAPS[v])} mm`, say: (v) => `${fmt(GAPS[v])} millimetres` }], (id, v) => { this._i = v; this.repaint(); });
  }
  enter(step) { this._i = START[step] ?? START[0]; this.ctl?.set('gap', this._i); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, hide = this.constructor.HIDE_VALUE, g = GAPS[this._i], step = this.stepIndex;
    const px = P ? W * 0.5 : W * 0.3, py = P ? H * 0.27 : H * 0.42, pw = P ? W * 0.86 : W * 0.5, ph = P ? H * 0.42 : H * 0.62;
    const ex = P ? W * 0.5 : W * 0.76, ey = P ? H * 0.73 : H * 0.46, R = P ? 64 : 100;
    // desk, paper
    let s = `<defs>${cwDefs()}<filter id="rd-eye" filterUnits="userSpaceOnUse" x="${n1(ex - R)}" y="${n1(ey - R)}" width="${2 * R}" height="${2 * R}"><feGaussianBlur stdDeviation="${n1(R * 0.052)}"/><feComponentTransfer><feFuncA type="linear" slope="1.5"/></feComponentTransfer></filter></defs><radialGradient id="rd-lamp" gradientUnits="userSpaceOnUse" cx="${n1(px)}" cy="${n1(py - ph * 0.2)}" r="${n1(Math.max(W, H) * 0.78)}"><stop offset="0" style="stop-color:${mx('elev-peak', 'series-2', 72)}"/><stop offset=".42" style="stop-color:${mx('strata-1', 'strata-5', 55)}"/><stop offset="1" style="stop-color:${mx('strata-3', 'strata-6', 46)}"/></radialGradient><rect width="${W}" height="${H}" style="fill:url(#rd-lamp) ${T('strata-5')}"/>`;
    // a reading lamp at the top edge throws a warm pool of light on a plain desk; the paper sits in it
    { const lx = P ? W * 0.86 : W * 0.07, lw = P ? 76 : 120, sh = mx('series-7', 'strata-6', 62);
      s += `<path d="M${n1(lx)} -2L${n1(lx - lw * 0.7)} ${n1(H * 0.7)}L${n1(lx + lw * 1.6)} ${n1(H * 0.5)}Z" style="fill:${mx('elev-peak', 'series-2', 80)};opacity:.16"/>`
        + `<path d="M${n1(lx - lw * 0.18)} -4L${n1(lx - lw / 2)} ${n1(lw * 0.36)}Q${n1(lx)} ${n1(lw * 0.5)} ${n1(lx + lw / 2)} ${n1(lw * 0.36)}L${n1(lx + lw * 0.18)} -4Z" style="fill:${sh}"/>`
        + `<path d="M${n1(lx - lw * 0.12)} -2L${n1(lx - lw * 0.4)} ${n1(lw * 0.3)}" ${stroke(T('elev-peak'), 2)} opacity=".35"/>`
        + `<ellipse cx="${n1(lx)}" cy="${n1(lw * 0.4)}" rx="${n1(lw * 0.47)}" ry="${n1(lw * 0.09)}" style="fill:${mx('elev-peak', 'series-2', 60)}"/>`; }
    const sc = pw * 0.42; // px per mm, enlarged view
    s += `<rect x="${n1(px - pw / 2 + 6)}" y="${n1(py - ph / 2 + 8)}" width="${n1(pw)}" height="${n1(ph)}" rx="3" ${fill(T('strata-6'))} opacity=".22" filter="url(#cw-blur3)"/><rect x="${n1(px - pw / 2)}" y="${n1(py - ph / 2)}" width="${n1(pw)}" height="${n1(ph)}" rx="3" ${fill(mx('elev-peak', 'series-2', 94))}/><path d="M${n1(px + pw / 2 - 26)} ${n1(py + ph / 2)}L${n1(px + pw / 2)} ${n1(py + ph / 2 - 26)}V${n1(py + ph / 2)}Z" ${fill(mx('strata-5', 'elev-peak', 30))}/>`;
    for (let y = py - ph / 2 + 22; y < py + ph / 2; y += 24) s += `<path d="M${n1(px - pw / 2 + 8)} ${n1(y)}H${n1(px + pw / 2 - 8)}" ${stroke(mx('sky-day', 'elev-peak', 34), 1.2)}/>`;
    const gapPx = g * sc, dr = Math.max(1.4, Math.min(7, gapPx * 0.34)), d = (x) => `<circle cx="${n1(x)}" cy="${n1(py)}" r="${dr}" style="fill:${T('strata-6')}"/>`;
    s += d(px - gapPx / 2) + d(px + gapPx / 2);
    if (!hide) {
      s += `<path d="M${n1(px - gapPx / 2)} ${n1(py + 22)}H${n1(px + gapPx / 2)}" ${stroke(T('magma'), 2.6)}/><path d="M${n1(px - gapPx / 2)} ${n1(py + 16)}v12M${n1(px + gapPx / 2)} ${n1(py + 16)}v12" ${stroke(T('magma'), 2.6)}/>`;
      s += label(px, py + 50, `gap ${fmt(g)} mm`, { size: P ? 16 : 18, display: true });
    }
    s += label(px, py - ph / 2 + 22, 'on the paper, drawn larger', { size: P ? 15 : 17 });
    // eye view
    const u = R * 1.34;  // px per mm in the eye view: 0.1 mm = about 2.6 blur widths, so two peaks just survive there
    const view = `<g filter="url(#rd-eye)"><circle cx="${n1(ex - (g * u * 1.0) / 2)}" cy="${n1(ey)}" r="${n1(R * 0.046)}" style="fill:${T('strata-6')}"/><circle cx="${n1(ex + (g * u * 1.0) / 2)}" cy="${n1(ey)}" r="${n1(R * 0.046)}" style="fill:${T('strata-6')}"/></g>`;
    s += `<circle cx="${n1(ex + 3)}" cy="${n1(ey + 5)}" r="${R + 8}" ${fill(T('strata-6'))} opacity=".3"/><circle cx="${n1(ex)}" cy="${n1(ey)}" r="${R + 7}" ${fill(mx('strata-6', 'sea-deep', 70))}/><circle cx="${n1(ex)}" cy="${n1(ey)}" r="${R}" ${fill(T('elev-peak'))}/>${view}`;
    const two = g >= 0.1, say = hide ? '' : g === 0.1 ? 'just two dots' : two ? 'you see two dots' : 'you see one dot';
    s += label(ex, ey + R + 26, say, { size: P ? 16 : 18, display: true });
    s += label(ex, ey - R - 14, 'seen from 25 cm', { size: P ? 17 : 18, display: true });
    if (!hide && step === 2) s += label(px, P ? py - ph / 2 + 46 : py + ph / 2 - 16, 'limit of resolution: 0.1 mm', { size: P ? 15 : 17, display: true });
    return { svg: frame(st, 'rd', s) };
  }
}
