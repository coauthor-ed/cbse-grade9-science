// PotatoCupsScene - blk-l10-n02. Four beakers of water, each with a peeled potato cup. Beat 0: the set-up: A empty, B sugar,
// C salt, D boiled with sugar. Beat 1: Wait 2 hours: water gathers in B and C. Beat 2: A lit: no water, the comparison.
// Beat 3: D lit: the cells are dead, no water gathers. Book result, drawn. Control name: Wait 2 hours.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, ctlBar, stroke, anim } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd, soluteDot } from '../shared/CellWorld.js';
import { bench, tiles } from '../shared/Scapes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const CUPS = [
  { id: 'A', add: 'Empty', gain: 0, boil: false, kind: null },
  { id: 'B', add: 'Sugar', gain: 1, boil: false, kind: 'sugar' },
  { id: 'C', add: 'Salt', gain: 1, boil: false, kind: 'salt' },
  { id: 'D', add: 'Boiled + sugar', gain: 0, boil: true, kind: 'sugar' },
];
function beaker(x, y, w, h, c, u) {
  // y is the bench. u 0..1 is time passed.
  const lvl = y - h * (0.5 - 0.04 * c.gain * u), wet = c.gain * u;
  let s = `<ellipse cx="${n1(x + 5)}" cy="${n1(y + 3)}" rx="${n1(w * 0.54)}" ry="6" style="fill:${T('strata-6')};opacity:.26"/>`;
  s += `<path d="M${n1(x - w / 2)} ${n1(lvl)}V${n1(y - 8)}Q${n1(x - w / 2)} ${n1(y)} ${n1(x - w / 2 + 8)} ${n1(y)}H${n1(x + w / 2 - 8)}Q${n1(x + w / 2)} ${n1(y)} ${n1(x + w / 2)} ${n1(y - 8)}V${n1(lvl)}Z" style="fill:${mx('sea-shallow', 'elev-peak', 50)};opacity:.72"/>`;
  // the potato cup: a peeled half, flat side up, sitting in the water
  const px = x, pw = w * 0.74, top = y - h * 0.62, base = y - 7, pot = c.boil ? mx('strata-1', 'strata-3', 74) : mx('gold', 'elev-peak', 34), rim = c.boil ? mx('strata-2', 'strata-3', 50) : mx('gold', 'strata-3', 66);
  s += `<path d="M${n1(px - pw / 2)} ${n1(top)}C${n1(px - pw / 2)} ${n1(base + 2)} ${n1(px + pw / 2)} ${n1(base + 2)} ${n1(px + pw / 2)} ${n1(top)}Z" style="fill:${pot};stroke:${rim};stroke-width:2.6"/>`;
  s += `<ellipse cx="${n1(px)}" cy="${n1(top)}" rx="${n1(pw / 2)}" ry="${n1(pw * 0.17)}" style="fill:${mx(pot, 'elev-peak', 56)};stroke:${rim};stroke-width:2.4"/>`;
  const hw = pw * 0.34, hh = pw * 0.1;
  s += `<ellipse cx="${n1(px)}" cy="${n1(top + 1)}" rx="${n1(hw)}" ry="${n1(hh)}" style="fill:${mx(rim, 'strata-6', 66)}"/>`;
  if (wet > 0.01) s += `<ellipse cx="${n1(px)}" cy="${n1(top + 1)}" rx="${n1(hw * (0.5 + 0.5 * wet))}" ry="${n1(hh * (0.5 + 0.5 * wet))}" style="fill:${mx('sea-shallow', 'series-1', 66)};stroke:${T('series-1')};stroke-width:1.8"/>`;
  if (c.kind && wet < 0.7) { const q = rnd(c.id.charCodeAt(0)); for (let i = 0; i < 9; i++) s += soluteDot(px + (q() - 0.5) * hw * 1.1, top + (q() - 0.5) * hh, 3, { kind: c.kind }); }
  s += `<path d="M${n1(x - w / 2 - 3)} ${n1(y - h)}H${n1(x + w / 2 + 3)}M${n1(x - w / 2)} ${n1(y - h)}V${n1(y - 8)}Q${n1(x - w / 2)} ${n1(y)} ${n1(x - w / 2 + 8)} ${n1(y)}H${n1(x + w / 2 - 8)}Q${n1(x + w / 2)} ${n1(y)} ${n1(x + w / 2)} ${n1(y - 8)}V${n1(y - h)}" ${stroke(mx('sea-shallow', 'strata-6', 56), 3.2)}/><path d="M${n1(x - w / 2 + 7)} ${n1(y - h + 12)}V${n1(y - 16)}" ${stroke(T('elev-peak'), 3.6, 'opacity:.7')}/>`;
  return s;
}

export class PotatoCupsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 490;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Four beakers of water, each with a peeled potato cup. Cup A is empty, cup B holds sugar, cup C holds salt, and cup D is boiled potato with sugar. After two hours water has gathered in the hollows of cups B and C, and not in A or D.';
  static CONTROLS = [];

  async setup() {
    this._u = 0;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'wait', label: 'Wait 2 hours', go: true }], () => this.wait());
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 410; }
  enter(step) {
    this._u = step >= 2 ? 1 : 0; this._go = false;
    if (!this.ctl) return;
    this.ctl.show('wait', step === 1);
    this.ctl.label('wait', 'Wait 2 hours');
    this.ctl.disable('wait', false);
  }
  wait() {
    if (this._go) { this._go = false; this._u = 0; this.ctl.label('wait', 'Wait 2 hours'); this.clockReset?.(); this.repaint(); return; }
    this._go = true; this.ctl.label('wait', 'Start again'); this.play(2.2);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }
  _pos(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H - (P ? 30 : 64);
    return P ? [[W * 0.26, 166], [W * 0.74, 166], [W * 0.26, H - 38], [W * 0.74, H - 38]] : [0.13, 0.375, 0.625, 0.87].map((u) => [W * u, gy]);
  }
  _lit(i) { const s = this.stepIndex; return s < 2 || (s === 2 && i === 0) || (s === 3 && i === 3) ? 1 : 0.42; }
  _draw(st) {
    const P = st.portrait, w = P ? 128 : 124, h = P ? 118 : 160; let s = '';
    this._pos(st).forEach(([x, y], i) => {
      const c = CUPS[i];
      s += `<g opacity="${this._lit(i)}">${beaker(x, y, w, h, c, this._u)}`;
      s += label(x, y - h - (P ? 12 : 44), c.id, { size: P ? 20 : 24, display: true });
      s += `</g>`;
      s += P ? label(x, y + 20, c.add, { size: 14, display: true }) : label(x, y + 26, c.add, { size: 15, display: true });
    });
    return s;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const bed = P ? H : H - 64;
    let s = tiles(W, bed + 6, { cool: true }) + (P ? '' : bench(W, bed, H, { planks: 1 }));
    if (P) s += `<rect y="172" width="${W}" height="10" style="fill:${mx('strata-3', 'strata-6', 56)}"/><rect y="${H - 34}" width="${W}" height="34" style="fill:${mx('strata-3', 'strata-6', 56)}"/>`;
    s += `<g data-anim="cups">${this._draw(st)}</g>`;
    if (!P) s += `<g data-anim="title">${this._title()}</g>`;
    return { svg: cwFrame(st, 'pc', s) };
  }
  _title() { return label(this.sv.W / 2, 30, ['Four potato cups', this._u > 0.5 ? 'Water gathers in B and C' : 'Start of the test', 'Cup A: the comparison', 'Cup D: boiled cells, no osmosis'][this.stepIndex], { size: 22, display: true }); }
  animate(st, t) {
    if (this.stepIndex !== 1 || !this._go) return;
    this._u = Math.min(1, t / 2.2);
    anim(this, 'cups', this._draw(st));
    anim(this, 'title', this._title());
  }
}
