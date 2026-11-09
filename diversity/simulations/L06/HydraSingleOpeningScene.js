// HydraSingleOpeningScene - L06 blk-l06-s04, 3 beats. Longitudinal section of Hydra after Fig 12.14, with the single
// opening between the tentacles. Beat 0: Feed (button id feed) runs one catch: a tentacle takes the prey to the
// opening, it passes into the cavity, it is digested, and the waste leaves through the same opening. Beat 1: the two
// tissue layers lit. Beat 2: the one opening with both arrows, and Feed again. Controls: feed.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, anim, ctlBar, seaLabel, tag, fill, stroke, seaSetting, along, flowArrow, svgBioColour as bc } from './BodyKit.js';

const BODY = bc('hydra'), DARK = bc('hydraDark'), LIT = bc('hydraLit'), PREY = lc('red'), WASTE = mx(lc('wood'), lc('ink'), 0.4);
const T_RUN = 8.5;
const smooth = (u) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };

export class HydraSingleOpeningScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 450; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'Hydra cut lengthwise: a hollow tube fixed at its foot, tentacles round the top, one opening between them. Food goes in through that opening and waste comes back out through it.';
  static CONTROLS = [];
  _go = false;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'btn', id: 'feed', label: 'Feed' }], () => { if (this.isPlaying?.()) return; this._go = true; this.play(T_RUN); this.repaint(); });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) { this._go = false; this.bar?.show('feed', step !== 1); }
  stageHeight(st) { return st.portrait ? 350 : 430; }
  _g(st) { const { W, H, portrait: P } = st; return { cx: P ? W * 0.5 : W * 0.5, by: H - 30, s: P ? 0.76 : 1.04 }; }

  _tent(G, side, a, grab) {
    // a tentacle from the rim. grab 0..1 bends the catching tentacle in over the opening.
    const x0 = G.cx + side * (26 + a * 18) * G.s, y0 = G.by - 262 * G.s;
    let tx = G.cx + side * (110 + a * 42) * G.s, ty = G.by - (332 - a * 66) * G.s;
    if (grab) { tx += (G.cx + side * 18 * G.s - tx) * grab; ty += (G.by - 300 * G.s - ty) * grab; }
    const mxx = x0 + side * 58 * G.s * (1 - grab * 0.4), my = y0 - 74 * G.s;
    const d = `M${n1(x0)} ${n1(y0)}Q${n1(mxx)} ${n1(my)} ${n1(tx)} ${n1(ty)}`;
    return { d, tx, ty };
  }
  animate(st, t = 0) {
    const G = this._g(st), T = this._go ? t : 0;
    const grab = smooth((T - 1.2) / 1) * (1 - smooth((T - 3.4) / 0.8));
    let g = '';
    for (const [side, a, can] of [[-1, 0, 0], [-1, 1, 0], [1, 1, 0], [1, 0, 1]]) {
      const q = this._tent(G, side, a, can ? grab : 0);
      g += `<path d="${q.d}" ${stroke(DARK, 15, 'stroke-linecap:round')}/><path d="${q.d}" ${stroke(BODY, 10, 'stroke-linecap:round')}/>`;
      for (let k = 1; k < 5; k++) g += `<circle cx="${n1(q.tx)}" cy="${n1(q.ty)}" r="${k === 1 ? 5 : 0}" ${fill(LIT)}/>`;
    }
    const q = this._tent(G, 1, 0, grab);
    const start = [G.cx + (st.portrait ? 170 : 186) * G.s, G.by - 342 * G.s], tip0 = this._tent(G, 1, 0, 0);
    let p, r = 11, col = PREY;
    if (T < 1.2) p = along([start, [tip0.tx, tip0.ty]], smooth(T / 1.2));
    else if (T < 3.3) p = [q.tx, q.ty];
    else if (T < 4.5) p = along([[q.tx, q.ty], [G.cx, G.by - 262 * G.s], [G.cx, G.by - 150 * G.s]], smooth((T - 3.3) / 1.2));
    else if (T < 6) { p = [G.cx, G.by - 150 * G.s]; const k = (T - 4.5) / 1.5; r = 11 - 5 * k; col = mx(PREY, WASTE, k); }
    else { p = along([[G.cx, G.by - 150 * G.s], [G.cx, G.by - 262 * G.s], [G.cx - 14 * G.s, G.by - 340 * G.s], [G.cx - 110 * G.s, G.by - 400 * G.s]], smooth((T - 6) / 2.4)); r = 6; col = WASTE; }
    g += `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(r)}" ${fill(col, `stroke:${ink};stroke-width:2.5`)}/>`;
    anim(this, 't', g);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, fy = H - 30, G = this._g(st), s = G.s, X = (x) => G.cx + x * s, Y = (y) => G.by - y * s;
    const lit = step === 1;
    let g = seaSetting(st, fy);
    // body wall, foot on the rock
    const out = `M${X(-40)} ${Y(0)}C${X(-60)} ${Y(10)} ${X(-44)} ${Y(40)} ${X(-40)} ${Y(70)}C${X(-36)} ${Y(140)} ${X(-52)} ${Y(190)} ${X(-44)} ${Y(250)}Q${X(-30)} ${Y(274)} ${X(-11)} ${Y(278)}Q${X(-3)} ${Y(274)} ${X(-11)} ${Y(258)}C${X(-22)} ${Y(240)} ${X(-22)} ${Y(190)} ${X(-16)} ${Y(140)}C${X(-14)} ${Y(100)} ${X(-16)} ${Y(60)} ${X(-12)} ${Y(30)}Q${X(0)} ${Y(20)} ${X(12)} ${Y(30)}C${X(16)} ${Y(60)} ${X(14)} ${Y(100)} ${X(16)} ${Y(140)}C${X(22)} ${Y(190)} ${X(22)} ${Y(240)} ${X(11)} ${Y(258)}Q${X(3)} ${Y(274)} ${X(11)} ${Y(278)}Q${X(30)} ${Y(274)} ${X(44)} ${Y(250)}C${X(52)} ${Y(190)} ${X(36)} ${Y(140)} ${X(40)} ${Y(70)}C${X(44)} ${Y(40)} ${X(60)} ${Y(10)} ${X(40)} ${Y(0)}Z`;
    g += `<path d="M${X(-44)} ${Y(250)}C${X(-52)} ${Y(190)} ${X(-36)} ${Y(140)} ${X(-40)} ${Y(20)}L${X(40)} ${Y(20)}C${X(36)} ${Y(140)} ${X(52)} ${Y(190)} ${X(44)} ${Y(250)}Q${X(30)} ${Y(274)} ${X(0)} ${Y(274)}Q${X(-30)} ${Y(274)} ${X(-44)} ${Y(250)}Z" ${fill(mx(lc('sea'), lc('white'), 0.3))}/>`;
    g += `<g data-anim="t"></g>`;
    g += `<path d="${out}" ${fill(BODY, `stroke:${DARK};stroke-width:5;stroke-linejoin:round`)}/>`;
    g += `<path d="M${X(-34)} ${Y(66)}C${X(-30)} ${Y(140)} ${X(-44)} ${Y(190)} ${X(-36)} ${Y(244)}" ${stroke(LIT, 6, 'stroke-linecap:round')}/>`;
    // inner tissue layer, a lined band inside the wall
    for (const side of [-1, 1]) g += `<path d="M${X(side * 14)} ${Y(36)}C${X(side * 18)} ${Y(100)} ${X(side * 16)} ${Y(140)} ${X(side * 18)} ${Y(140)}C${X(side * 26)} ${Y(190)} ${X(side * 26)} ${Y(236)} ${X(side * 15)} ${Y(258)}" ${stroke(lit ? lc('seaDeep') : LIT, lit ? 8 : 6, 'stroke-linecap:round')}/>`;
    if (lit) for (let i = 0; i < 6; i++) for (const side of [-1, 1]) { const y = 62 + i * 34, w = 40; g += `<circle cx="${X(side * (w - 8))}" cy="${Y(y)}" r="${n1(5 * s)}" ${fill(LIT, `stroke:${DARK};stroke-width:2`)}/>`; }
    if (step === 2) {
      g += flowArrow([X(-74), Y(346)], [X(-20), Y(338)], [X(-5), Y(286)], lc('red'), 7);
      g += flowArrow([X(5), Y(286)], [X(20), Y(338)], [X(74), Y(346)], WASTE, 7);
      g += seaLabel(X(-98), Y(364), 'Food in', { size: 17 }) + seaLabel(X(98), Y(364), 'Waste out', { size: 17 });
      g += tag(P ? W - 62 : X(150), P ? Y(216) : Y(240), X(0), Y(272), 'One opening');
    } else if (step === 0) {
      g += tag(P ? 60 : X(-190), P ? 28 : Y(350), X(-130), Y(320), 'Tentacles');
      g += tag(P ? W - 60 : X(190), Y(236), X(0), Y(272), 'Opening', { dot: true });
      g += tag(P ? 70 : X(-190), Y(120), X(0), Y(120), 'Cavity');
    } else {
      g += tag(P ? 62 : X(-190), P ? Y(205) : Y(150), X(-32), Y(150), 'Outer tissue');
      g += tag(P ? W - 62 : X(190), P ? Y(205) : Y(150), X(20), Y(150), 'Inner tissue');
      g += seaLabel(P ? W / 2 : X(0), P ? 24 : 34, P ? 'Tissues in the wall' : 'Tissues in the wall, tentacles at work', { size: 16 });
    }
    return { svg: frame(st, 'hy', g) };
  }
}
