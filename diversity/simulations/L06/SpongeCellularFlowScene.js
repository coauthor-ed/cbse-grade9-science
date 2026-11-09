// SpongeCellularFlowScene - L06 blk-l06-s03, 4 beats. Cut-open sponge. Beat 0: water enters by the pores, passes
// through the channels and leaves by the larger opening. Beat 1: a lens on one channel: food and oxygen reach the
// cells, waste leaves. Beat 2: many cells and no tissues, and the book's 24,000 litres, counted up. Beat 3:
// Stop the water (button .ss-btn id stop) stops all of it; press again to start it. Controls: stop.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, anim, ctlBar, seaLabel, tag, fill, stroke, words, seaSetting, spongeCut, spongeRoute, along, flowArrow, SPONGE_CHANNELS, SPONGE, svgBio, BOX } from './BodyKit.js';

const FOOD = lc('red'), OXY = lc('white'), WASTE = mx(lc('wood'), lc('ink'), 0.4);
const dot = (x, y, r, col, o = 1) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" ${fill(col, `opacity:${o};stroke:${ink};stroke-width:1.5`)}/>`;

export class SpongeCellularFlowScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 450; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A sponge cut open. Water enters through pores, runs through channels past the cells and leaves through a larger opening at the top.';
  static CONTROLS = [];
  _still = false; _found = false;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'btn', id: 'stop', label: 'Stop the water' }], () => {
      this._still = !this._still;
      this.bar.label('stop', this._still ? 'Start the water' : 'Stop the water');
      this.repaint();
      if (!this._still) this.play(10);
      else if (!this._found) { this._found = true; this.celebrate?.(); }
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) {
    this._still = false;
    this.bar?.label('stop', 'Stop the water');
    this.bar?.show('stop', step === 3);
    this.play?.(step === 2 ? 3 : 10);
  }
  stageHeight(st) {
    if (!st.portrait) return 430;
    return [350, 300, 420, 370][this.stepIndex] ?? 350;
  }
  _geo(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    if (step === 1) return P ? { cx: 62, by: H - 44, s: 0.46 } : { cx: W * 0.22, by: H - 34, s: 0.78 };
    if (step === 3) return P ? { cx: W * 0.5, by: H - 92, s: 0.72 } : { cx: W * 0.34, by: H - 26, s: 0.86 };
    return { cx: W * 0.5, by: H - 26, s: P ? 0.78 : 0.92 };
  }
  _lens(st) { const { W, H, portrait: P } = st; return P ? { x: W - 94, y: H * 0.46, r: 90 } : { x: W * 0.68, y: H * 0.46, r: 170 }; }

  animate(st, t = 0) {
    const step = this.stepIndex, c = this._still ? 0 : t;
    if (step === 2) {
      const k = Math.min(1, t / 2.6), v = Math.round(k * 24000 / 100) * 100;
      anim(this, 'n', words(this._nx, this._ny, `${Math.floor(v / 1000)},${String(v % 1000).padStart(3, '0')}`, { size: st.portrait ? 44 : 52, display: true, ink }));
      return;
    }
    if (step === 0 || step === 3) {
      const g = this._geo(st); let d = '';
      for (let j = 0; j < SPONGE_CHANNELS; j++) for (const side of [-1, 1]) {
        const route = spongeRoute(side, j);
        for (let i = 0; i < 3; i++) {
          const u = ((c * 0.1 + i / 3 + j * 0.13 + (side > 0 ? 0.07 : 0)) % 1);
          const [x, y] = along(route, u), late = u > 0.62;
          const kind = (i + j) % 3, col = late ? (i === 0 ? WASTE : mx(lc('sea'), lc('white'), 0.5)) : (kind === 0 ? FOOD : kind === 1 ? OXY : mx(lc('sea'), lc('white'), 0.5));
          d += dot(g.cx + x * g.s, g.by + y * g.s, kind === 0 && !late ? 5 : 4, col, this._still ? 0.45 : 1);
        }
      }
      anim(this, 'w', d);
    }
    if (step === 1) {
      const L = this._lens(st), R = L.r, y0 = 0; let d = '';
      for (let i = 0; i < 9; i++) {
        const u = (t * 0.11 + i / 9) % 1, up = i % 2 ? -1 : 1, kx = -R * 0.5 + ((i * 3) % 5) * R * 0.25;
        if (i % 3 === 2) { // waste leaves a cell and goes out with the water
          const [x, y] = along([[kx, up * R * 0.34], [kx + R * 0.14, y0 + up * 6], [R * 1.1, y0 + up * 8]], u);
          d += dot(L.x + x, L.y + y, 5, WASTE);
        } else {
          const [x, y] = along([[-R * 1.1, y0 + up * 10], [kx, y0 + up * 10], [kx, up * R * 0.36]], u);
          d += dot(L.x + x, L.y + y, i % 3 ? 5 : 7, i % 3 ? OXY : FOOD);
        }
      }
      anim(this, 'w', d);
    }
  }

  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    const fy = H - 26; let g = seaSetting(st, fy);
    const G = this._geo(st);
    if (step === 0) {
      g += spongeCut(G.cx, G.by, G.s) + `<g data-anim="w"></g>`;
      const top = G.by - 330 * G.s;
      g += flowArrow([G.cx, top + 26], [G.cx, top - 14], [G.cx + (P ? 0 : 0), top - 46], lc('seaDeep'), 7);
      g += P ? seaLabel(58, 20, 'Larger', {}) + tag(58, 40, G.cx - 8, top - 2, 'opening') : tag(G.cx + 196, 66, G.cx + 44, top - 4, 'Larger opening');
      g += tag(P ? 40 : G.cx - 216, P ? 112 : 130, G.cx - 108 * G.s, G.by - 232 * G.s - 8, 'Pores');
      g += P ? tag(W - 56, 104, G.cx + 26 * G.s, G.by - 150 * G.s, 'Water') : tag(G.cx + 214, 200, G.cx + 26 * G.s, G.by - 170 * G.s, 'Water moving through');
    }
    if (step === 1) {
      const L = this._lens(st), R = L.r;
      g += spongeCut(G.cx, G.by, G.s);
      const mark = [G.cx + 88 * G.s, G.by - 172 * G.s];
      g += `<circle cx="${n1(mark[0])}" cy="${n1(mark[1])}" r="20" ${stroke(ink, 3)}/>`;
      g += `<path d="M${n1(mark[0] + (P ? 14 : 0))} ${n1(mark[1])}L${n1(L.x - R + 4)} ${n1(L.y)}" ${stroke(ink, 3)}/>`;
      g += `<defs><clipPath id="sl-c"><circle cx="${n1(L.x)}" cy="${n1(L.y)}" r="${R}"/></clipPath></defs><g clip-path="url(#sl-c)"><circle cx="${n1(L.x)}" cy="${n1(L.y)}" r="${R}" ${fill(mx(lc('sea'), lc('white'), 0.35))}/>`;
      for (const up of [-1, 1]) for (let i = -3; i <= 3; i++) for (let r = 0; r < 2; r++) {
        const cx = L.x + (i + (r ? 0.5 : 0)) * R * 0.5, cy = L.y + up * (R * 0.48 + r * R * 0.42), rr = R * 0.25;
        g += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(rr)}" ${fill(SPONGE, `stroke:${mx(SPONGE, lc('wood'), 0.7)};stroke-width:3`)}/><circle cx="${n1(cx - rr * 0.3)}" cy="${n1(cy - rr * 0.3)}" r="${n1(rr * 0.3)}" ${fill(mx(SPONGE, lc('white'), 0.45))}/><circle cx="${n1(cx + rr * 0.15)}" cy="${n1(cy + rr * 0.15)}" r="${n1(rr * 0.26)}" ${fill(mx(SPONGE, lc('wood'), 0.8))}/>`;
      }
      g += `<g data-anim="w"></g></g><circle cx="${n1(L.x)}" cy="${n1(L.y)}" r="${R}" ${stroke(ink, 5)}/>`;
      const ly = P ? H - 10 : H - 10, xs = P ? [6, 86, 206] : [W * 0.42, W * 0.6, W * 0.8];
      [['Food', FOOD], ['Oxygen', OXY], ['Waste', WASTE]].forEach(([t, col], i) => { g += dot(xs[i] + 8, ly - 6, 8, col) + seaLabel(xs[i] + 22, ly, t, { size: 17, anchor: 'start' }); });
      g += P ? tag(W - 54, 16, L.x + R * 0.3, L.y - R * 0.6, 'Cells') : tag(L.x + 120, 22, L.x + R * 0.2, L.y - R * 0.6, 'Cells');
      if (!P) g += tag(G.cx - 40, 34, mark[0] - 8, mark[1] - 18, 'One channel');
    }
    if (step === 2) {
      const k = (P ? 112 : 230) / BOX.Sponge[3], sx = P ? W * 0.5 : W * 0.24, sy = P ? 118 : H - 66;
      g += svgBio('Sponge', sx, sy, k);
      g += words(sx, sy + 26, '1 kilogram of sponge', { size: 17, ink, halo: lc('white'), haloW: 5 });
      this._nx = P ? W / 2 : W * 0.7; this._ny = P ? 262 : 178;
      g += words(this._nx, this._ny - (P ? 44 : 50), 'can filter up to', { size: 17, ink, halo: lc('white'), haloW: 5 });
      g += `<g data-anim="n"></g>`;
      g += words(this._nx, this._ny + 24, 'litres of sea water a day', { size: 17, ink, halo: lc('white'), haloW: 5 });
      const cy = P ? H - 50 : H - 46, x0 = P ? W / 2 : this._nx;
      g += words(x0, cy - 22, 'Many cells', { size: 18, display: true, ink, halo: lc('white'), haloW: 5 }) + words(x0, cy + 2, 'no tissues, no organs', { size: 17, ink, halo: lc('white'), haloW: 5 });
    }
    if (step === 3) {
      const still = this._still;
      g += spongeCut(G.cx, G.by, G.s, still ? { water: mx(lc('sea'), lc('wood'), 0.35) } : {}) + `<g data-anim="w"></g>`;
      const x0 = P ? W * 0.5 : W * 0.78, y0 = P ? H - 66 : 120;
      const rows = still ? [['No food arrives', FOOD], ['No oxygen arrives', OXY], ['Waste stays', WASTE]] : [['Food arrives', FOOD], ['Oxygen arrives', OXY], ['Waste leaves', WASTE]];
      if (P) rows.forEach(([t, col], i) => { g += dot(x0 - 86, y0 + i * 24 - 6, 7, col) + seaLabel(x0 - 70, y0 + i * 24, t, { size: 16, anchor: 'start' }); });
      else rows.forEach(([t, col], i) => { const y = y0 + i * 70; g += `<rect x="${x0 - 112}" y="${y - 28}" width="224" height="54" rx="14" ${fill(lc('white'), `stroke:${ink};stroke-width:3`)}/>` + dot(x0 - 88, y - 2, 9, col) + words(x0 - 70, y + 4, t, { size: 18, anchor: 'start', ink }); });
    }
    return { svg: frame(st, 'sf', g) };
  }
}
