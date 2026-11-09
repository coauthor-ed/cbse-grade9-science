// NucleusTour - Fig 2.11 on the painted nucleus (media/L06/L06S06-clean.png, its baked labels painted out; the original
// stays). A veil dims everything except the part the beat names, via a mask in image coordinates.
//   b0  nuclear membrane and pores lit
//   b1  nucleolus lit
//   b2  Send subunits: one large and one small subunit leave through a pore and assemble in the cytoplasm
//   b3  chromatin lit
// Control: send.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, n1, T, mx, depthField } from '../shared/CellWorld.js';
import { ctlBar, label, leader, anim } from '../shared/PlantArt.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const SRC = new URL('../../media/L06/L06S06-clean.png', import.meta.url).href;
const sm = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const BAND = 'M535 140L612 158C690 225 735 300 745 355L660 490L430 498L345 368C385 280 450 190 535 140Z';
const INSIDE = 'M535 165C600 200 690 270 722 358L650 472L440 482L368 368C410 290 470 215 535 165Z';
const PORTS = [[612, 158], [745, 355], [660, 490], [430, 498], [345, 368], [428, 198]];
const PORE = [660, 490], OUT = [806, 650], NL = [508, 345];

export class NucleusTour extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 680; static HEIGHT = 500; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'A painted nucleus cut open, showing a double nuclear membrane with pores, a dense round nucleolus, thin threads of chromatin, and endoplasmic reticulum wrapped around it.';
  static CONTROLS = [];
  _go = false; _sent = false; _found = false;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'btn', id: 'send', label: 'Send subunits', go: true }], () => {
      if (this._go) return;
      this._go = true; this._sent = false; this.play(4.2);
      this.after(reducedMotion() ? 0.01 : 4.25, () => { this._go = false; this._sent = true; this.repaint(); if (!this._found) { this._found = true; this.celebrate(); } });
      this.repaint();
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) { this._go = false; this._sent = false; this.bar?.show('send', step === 2); }
  stageHeight(st) { return st.portrait ? 390 : 440; }
  _map(st) {
    const { W, H, portrait: P } = st, s = P ? W / 720 : Math.min((W - 40) / 760, (H - 20) / 620), ox = (W - 1024 * s) / 2 + (P ? 0 : -6) + 4, oy = (H - 768 * s) / 2 + (P ? 10 : 2);
    return { s, ox, oy, x: (u) => ox + u * s, y: (v) => oy + v * s };
  }
  animate(st, t = 0) {
    if (this.stepIndex !== 2) return;
    const M = this._map(st); let d = '';
    const R = 12 * M.s / 0.5, r = R * 0.62;
    const path = (u) => {
      const a = sm(u / 0.34), b = sm((u - 0.34) / 0.2), c = sm((u - 0.54) / 0.3);
      if (u < 0.34) return [NL[0] + (PORE[0] - 40 - NL[0]) * a, NL[1] + (PORE[1] - 50 - NL[1]) * a];
      if (u < 0.54) return [PORE[0] - 40 + 40 * b, PORE[1] - 50 + 50 * b];
      return [PORE[0] + (OUT[0] - PORE[0]) * c, PORE[1] + (OUT[1] - PORE[1]) * c];
    };
    if (this._go) {
      const u = Math.min(1, t / 3.5), join = sm((t - 3.2) / 0.9), [ax, ay] = path(u), [bx, by] = path(Math.max(0, u - 0.08));
      const dx = 14 * (1 - join), big = `<circle cx="${n1(M.x(ax) - dx * 0.2)}" cy="${n1(M.y(ay))}" r="${n1(R)}" style="fill:url(#cw-ribo) ${T('sea-deep')};stroke:${T('elev-peak')};stroke-width:2"/>`;
      d += `<circle cx="${n1(M.x(bx) + dx * (1 - join))}" cy="${n1(M.y(by) - (R + r * 0.6) * join)}" r="${n1(r)}" style="fill:${mx('sea-shallow', 'sea-deep', 60)};stroke:${T('elev-peak')};stroke-width:2"/>` + big;
    } else if (this._sent) {
      d += `<circle cx="${n1(M.x(OUT[0]))}" cy="${n1(M.y(OUT[1]) - R - r * 0.6)}" r="${n1(r)}" style="fill:${mx('sea-shallow', 'sea-deep', 60)};stroke:${T('elev-peak')};stroke-width:2"/><circle cx="${n1(M.x(OUT[0]))}" cy="${n1(M.y(OUT[1]))}" r="${n1(R)}" style="fill:url(#cw-ribo) ${T('sea-deep')};stroke:${T('elev-peak')};stroke-width:2"/>`;
    } else {
      d += `<circle cx="${n1(M.x(NL[0]) - 8)}" cy="${n1(M.y(NL[1]))}" r="${n1(R)}" style="fill:url(#cw-ribo) ${T('sea-deep')};stroke:${T('elev-peak')};stroke-width:2"/><circle cx="${n1(M.x(NL[0]) + R + 4)}" cy="${n1(M.y(NL[1]))}" r="${n1(r)}" style="fill:${mx('sea-shallow', 'sea-deep', 60)};stroke:${T('elev-peak')};stroke-width:2"/>`;
    }
    anim(this, 'w', d);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, M = this._map(st), size = P ? 14 : 16;
    let g = depthField(W, H, { tone: 'rose', seed: 12 });
    // the transparent PNG sits on the depth field, dim; the same image again through a mask shows the lit part at full strength
    const lit = [
      `<path d="${BAND}" style="fill:none;stroke:white;stroke-width:34;stroke-linejoin:round"/>${PORTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30" style="fill:white"/>`).join('')}`,
      '<ellipse cx="508" cy="345" rx="62" ry="78" style="fill:white"/>',
      `<ellipse cx="508" cy="345" rx="62" ry="78" style="fill:white"/><circle cx="${PORE[0]}" cy="${PORE[1]}" r="36" style="fill:white"/>`,
      `<path d="${INSIDE}" style="fill:white"/><ellipse cx="508" cy="345" rx="58" ry="74" style="fill:black"/>`,
    ][step];
    g += `<g transform="translate(${n1(M.ox)} ${n1(M.oy)}) scale(${n1(M.s * 1000) / 1000})"><image href="${SRC}" width="1024" height="768" opacity=".46"/>`
      + `<mask id="nt-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="768"><rect width="1024" height="768" style="fill:black"/>${lit}</mask>`
      + `<g mask="url(#nt-m)"><image href="${SRC}" width="1024" height="768"/></g></g>`;
    g += '<g data-anim="w"></g>';
    const X = M.x, Y = M.y;
    if (step === 0) {
      g += label(P ? W / 2 : X(240), 24, 'Double-layered nuclear membrane', { size }) + leader(P ? W / 2 : X(260), 32, X(470), Y(170));
      g += label(W - (P ? 40 : 80), P ? H - 56 : Y(180), 'Pore', { size }) + leader(W - (P ? 40 : 80), P ? H - 72 : Y(196), X(752), Y(362));
    }
    if (step === 1) g += label(P ? W / 2 : X(170), P ? 26 : Y(150), 'Nucleolus', { size }) + leader(P ? W / 2 : X(190), P ? 34 : Y(160), X(490), Y(300));
    if (step === 2) {
      g += label(P ? 86 : X(180), P ? 26 : Y(180), 'Subunits made here', { size }) + leader(P ? 86 : X(210), P ? 34 : Y(190), X(480), Y(310));
      if (this._sent) g += label(X(OUT[0]) - (P ? 26 : 34), Y(OUT[1]) - (P ? 40 : 48), 'Ribosome', { size, anchor: 'end' });
      else g += label(W - (P ? 44 : 80), P ? H - 16 : H - 30, 'Cytoplasm', { size });
    }
    if (step === 3) g += label(P ? W / 2 : X(190), P ? 26 : Y(170), 'Chromatin', { size }) + leader(P ? W / 2 : X(214), P ? 34 : Y(182), X(610), Y(250));
    return { svg: cwFrame(st, 'nt', g) };
  }
}
