// JointsFootAndShellScene - L07 blk-l07-s05, 4 beats. Beat 0: a jointed leg cut open: a muscle inside the hard tube
// pulls on the next part; Bend the leg (button id bend) closes the joint, press again to open it. Beat 1: crab and
// beetle with the joints and the job of each body region. Beat 2: a snail: head, foot, hump, shell. Beat 3: the octopus,
// where the same foot has become arms and a funnel. Controls: bend.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, anim, ctlBar, fill, stroke, seaLabel, words, tag, svgBio, BOX, svgBioColour as bc } from '../L06/BodyKit.js';

const SHELL = bc('crab'), SHELL_D = bc('crabDark'), SHELL_L = bc('crabLit'), MUSCLE = lc('red'), INSIDE = mx(lc('white'), lc('sand'), 0.25);
const ease = (u) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };
const fitBio = (name, cx, cy, w, h, o) => { const [x, y, bw, bh] = BOX[name], k = Math.min(w / bw, h / bh); return { svg: svgBio(name, cx - (x + bw / 2) * k, cy - (y + bh / 2) * k, k, o), k, ox: cx - (x + bw / 2) * k, oy: cy - (y + bh / 2) * k }; };

export class JointsFootAndShellScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 416; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A jointed leg cut open with a muscle inside its hard tube; then a crab and a beetle; then a snail with head, foot, hump and shell; then an octopus whose foot has become arms and a funnel.';
  static CONTROLS = [];
  _bent = false; _from = 0;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'btn', id: 'bend', label: 'Bend the leg' }], () => {
      if (this.isPlaying?.()) return;
      this._from = this._bent ? 1 : 0;
      this._bent = !this._bent;
      this.bar.label('bend', this._bent ? 'Straighten the leg' : 'Bend the leg');
      this.play(1);
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) {
    this._bent = false; this._from = 0;
    this.bar?.label('bend', 'Bend the leg');
    this.bar?.show('bend', step === 0);
  }
  stageHeight(st) { return st.portrait ? [310, 390, 300, 400][this.stepIndex] ?? 300 : this.stepIndex === 0 ? 336 : 400; }
  _legAt(st) { const { W, H, portrait: P } = st; return P ? { s: 0.5, jx: W * 0.62, jy: 150 } : { s: 0.74, jx: W * 0.64, jy: H * 0.4 }; }
  _leg(st, b) {
    // b 0 straight, 1 bent. Thigh fixed, a joint, the shin turns about the joint.
    const { s, jx, jy } = this._legAt(st), a = (22 + b * 78) * Math.PI / 180;
    const tl = 200 * s, sl = 210 * s, hw = 40 * s, hs = 28 * s;
    const ca = Math.cos(a), sa = Math.sin(a), P2 = (u, v) => [jx + u * ca - v * sa, jy + u * sa + v * ca];
    const shin = [P2(4, -hs), P2(sl, -hs * 0.5), P2(sl + 20 * s, 0), P2(sl, hs * 0.5), P2(4, hs)].map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L');
    const inner = [P2(14, -hs + 9), P2(sl - 8, -hs * 0.5 + 6), P2(sl - 8, hs * 0.5 - 6), P2(14, hs - 9)].map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L');
    let g = `<path d="M${shin}Z" ${fill(SHELL, `stroke:${SHELL_D};stroke-width:6;stroke-linejoin:round`)}/><path d="M${inner}Z" ${fill(INSIDE)}/>`;
    // the muscle runs from the wall of the thigh, over the joint, to a tag on the shin
    const anchor = [jx - tl * 0.8, jy + hw - 14 * s], tip = P2(30 * s, hs * 0.54), cx = jx - tl * 0.4, thick = (24 + 20 * b) * s;
    g += `<rect x="${n1(jx - tl)}" y="${n1(jy - hw)}" width="${n1(tl + 6)}" height="${n1(hw * 2)}" rx="${n1(12 * s)}" ${fill(SHELL, `stroke:${SHELL_D};stroke-width:6`)}/><rect x="${n1(jx - tl + 10 * s)}" y="${n1(jy - hw + 10 * s)}" width="${n1(tl - 12 * s)}" height="${n1(hw * 2 - 20 * s)}" rx="${n1(8 * s)}" ${fill(INSIDE)}/>`;
    g += `<path d="M${n1(anchor[0])} ${n1(anchor[1])}Q${n1(cx)} ${n1(jy + hw * 0.1)} ${n1(jx - 24 * s)} ${n1(jy + hw - 18 * s)}" ${stroke(MUSCLE, n1(thick), 'stroke-linecap:round')}/>`;
    g += `<path d="M${n1(jx - 28 * s)} ${n1(jy + hw - 18 * s)}L${n1(tip[0])} ${n1(tip[1])}" ${stroke(lc('white'), n1(7 * s), 'stroke-linecap:round')}/><path d="M${n1(jx - 28 * s)} ${n1(jy + hw - 18 * s)}L${n1(tip[0])} ${n1(tip[1])}" ${stroke(ink, n1(3 * s), 'stroke-linecap:round')}/>`;
    g += `<circle cx="${n1(jx)}" cy="${n1(jy)}" r="${n1(12 * s)}" ${fill(SHELL_D, `stroke:${ink};stroke-width:3`)}/>`;
    return g;
  }
  animate(st, t = 0) {
    if (this.stepIndex !== 0) return;
    const to = this._bent ? 1 : 0, k = ease(t / 0.9), b = this.isPlaying?.() || t ? this._from + (to - this._from) * k : to;
    anim(this, 'leg', this._leg(st, b));
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.5))}/>`;
    if (step === 0) {
      // The whole beetle first, so the leg below it is plainly a beetle's leg.
      const { s, jx, jy } = this._legAt(st), b = fitBio('Beetle', P ? 58 : 118, P ? 62 : H * 0.44, P ? 96 : 190, P ? 110 : 224);
      const knee = [b.ox + 34 * b.k, b.oy - 6 * b.k], R = P ? 13 : 20, top = jx - 200 * s;
      g += b.svg + `<path d="M${n1(knee[0] + R * 0.7)} ${n1(knee[1] - R * 0.7)}L${n1(top)} ${n1(jy - 40 * s)}M${n1(knee[0] + R * 0.7)} ${n1(knee[1] + R * 0.7)}L${n1(top)} ${n1(jy + 40 * s)}" ${stroke(ink, 2.5, 'stroke-dasharray:7 6')}/>`;
      g += `<circle cx="${n1(knee[0])}" cy="${n1(knee[1])}" r="${R}" ${stroke(ink, 3.5)}/>`;
      g += `<g data-anim="leg"></g>`;
      g += seaLabel(P ? 36 : 118, P ? 136 : H * 0.44 + 136, 'Beetle', { size: P ? 16 : 19, display: true });
      g += seaLabel(P ? W * 0.62 : jx + 10, P ? 24 : 36, 'One leg, cut open', { size: P ? 15 : 18, display: true });
      g += tag(P ? W - 96 : jx - 120, P ? 64 : 88, jx - 120 * s, jy - 34 * s, 'Hard outer skeleton');
      g += tag(P ? 54 : jx - 170, P ? H - 24 : H - 70, jx - 110 * s, jy + 14 * s, 'Muscle');
      g += tag(P ? W - 44 : jx + 128, P ? 100 : 92, jx, jy, 'Joint');
    }
    if (step === 1) {
      const c = fitBio('Crab', W * (P ? 0.5 : 0.28), P ? 96 : H * 0.48, P ? 220 : 300, P ? 150 : 250), b = fitBio('Beetle', W * (P ? 0.5 : 0.76), P ? 268 : H * 0.46, P ? 150 : 210, P ? 150 : 250);
      g += c.svg + b.svg;
      g += seaLabel(W * (P ? 0.5 : 0.28), P ? 102 : H * 0.54, 'Crab', { size: 19, display: true }) + seaLabel(P ? 56 : W * 0.56, P ? 206 : 50, 'Beetle', { size: 19, display: true });
      g += tag(P ? 66 : W * 0.1, P ? 26 : 30, c.ox - 54 * c.k, c.oy - 46 * c.k, 'Claws', { dot: false });
      g += tag(P ? W - 70 : W * 0.46, P ? 176 : H - 34, c.ox + 60 * c.k, c.oy + 30 * c.k, 'Walking legs', { dot: false });
      g += tag(P ? W - 54 : W * 0.93, P ? 214 : 40, b.ox + 12 * b.k, b.oy - 54 * b.k, 'Feelers', { dot: false });
      g += seaLabel(W * (P ? 0.5 : 0.76), H - 14, P ? 'Each leg bends at its joints' : 'Each leg bends at its joints', { size: 16 });
    }
    if (step === 2) {
      const cx = W * 0.5, cy = H * (P ? 0.54 : 0.56), a = fitBio('Snail', cx, cy, P ? 300 : 460, P ? 200 : 290), k = a.k, X = (u) => a.ox + u * k, Y = (v) => a.oy + v * k;
      g += `<path d="M0 ${n1(Y(2))}H${W}V${H}H0Z" ${fill(lc('grassDark'))}/>` + a.svg;
      g += tag(P ? 66 : cx - 240, 34, X(-20), Y(-44), 'Shell');
      g += tag(P ? W - 62 : cx + 240, 34, X(62), Y(-26), 'Head');
      g += tag(P ? W * 0.5 : cx + 40, H - 14, X(14), Y(-3), 'Muscular foot', { line: lc('white') });
      g += tag(P ? 104 : cx - 216, H - (P ? 62 : 80), X(-26), Y(-16), 'Hump, under the shell', { line: ink });
    }
    if (step === 3) {
      const o = fitBio('Octopus', P ? W * 0.5 : W * 0.34, P ? 112 : H * 0.5, P ? 280 : 400, P ? 180 : 320);
      const sn = fitBio('Snail', P ? W * 0.5 : W * 0.8, P ? H - 84 : H * 0.42, P ? 150 : 210, P ? 90 : 150);
      g += `<rect width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.5))}/>` + o.svg + sn.svg;
      g += seaLabel(P ? 66 : W * 0.34, P ? 26 : 34, 'Octopus', { size: 19, display: true });
      if (!P) g += seaLabel(W * 0.8, 92, 'Snail', { size: 19, display: true });
      g += words(W * (P ? 0.5 : 0.8), P ? H - 16 : H - 110, 'The foot of a snail', { size: 16, ink, halo: lc('white'), haloW: 5 });
      g += words(W * (P ? 0.5 : 0.34), P ? 222 : H - 14, 'Arms and funnel from the foot', { size: 16, ink, halo: lc('white'), haloW: 5 });
    }
    return { svg: frame(st, 'jf', g) };
  }
}
