// BilayerBuild - Fig 2.7. Water on both sides of a sheet of lipids.
//   setup  one lipid between two water bands, no arrangement shown
//   b0  loose lipids; Let them settle: heads to the water on both sides, tails between
//   b1  the bilayer; Sideways, Flip, Rotate follow one lit lipid
//   b2  proteins embedded; Pass through sends one substance through a protein while another turns back at the lipids
//   b3  View from above tilts the sheet: heads and proteins lie side by side like tiles
// Motion plays on a press, then rests. Controls: settle, side, flip, rot, pass, tilt.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, depthField, channel, waterDot, soluteDot, n1, rnd, T, mx, stroke } from '../shared/CellWorld.js';
import { ctlBar, label, leader, anim } from '../shared/PlantArt.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const sm = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const lerp = (a, b, u) => a + (b - a) * u;
const TAIL = mx('sea-shallow', 'strata-1', 58), TAIL_D = mx('sea-shallow', 'sea-deep', 60), LIT = T('series-2'), LIT_D = mx('series-2', 'strata-6', 62);

/** One lipid drawn head at the origin, tails down the +y axis. */
function lipidBody(r, len, lit, sx = 1) {
  const c = lit ? LIT : TAIL, w = Math.max(2.2, r * 0.24);
  const t = (dx) => `<path d="M${n1(dx)} ${n1(r * 0.5)}q${n1(dx * 0.9)} ${n1(len * 0.22)} 0 ${n1(len * 0.42)}t0 ${n1(len * 0.42)}" ${stroke(lit ? LIT_D : TAIL_D, w + 1.4)}/><path d="M${n1(dx)} ${n1(r * 0.5)}q${n1(dx * 0.9)} ${n1(len * 0.22)} 0 ${n1(len * 0.42)}t0 ${n1(len * 0.42)}" ${stroke(c, w)}/>`;
  const h = lit
    ? `<circle r="${n1(r)}" style="fill:url(#bb-lit) ${LIT};stroke:${LIT_D};stroke-width:1.6"/>`
    : `<circle r="${n1(r)}" style="fill:url(#cw-head) ${T('sea-shallow')};stroke:${mx('sea-shallow', 'sea-deep', 56)};stroke-width:1.2"/>`;
  return `${sx === 1 ? '' : `<g transform="scale(${n1(Math.max(0.12, sx) * 100) / 100} 1)">`}${t(-r * 0.36)}${t(r * 0.36)}${h}${sx === 1 ? '' : '</g>'}<ellipse cx="${n1(-r * 0.3)}" cy="${n1(-r * 0.36)}" rx="${n1(r * 0.28)}" ry="${n1(r * 0.18)}" style="fill:${T('elev-peak')};opacity:.7"/>`;
}
const place = (x, y, a, b, op = 1) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})"${op < 1 ? ` opacity="${n1(op * 100) / 100}"` : ''}>${b}</g>`;
const DEFS = `<radialGradient id="bb-lit" cx=".32" cy=".28" r=".86"><stop offset="0" style="stop-color:${mx('series-2', 'elev-peak', 40)}"/><stop offset=".6" style="stop-color:${LIT}"/><stop offset="1" style="stop-color:${mx('series-2', 'strata-6', 66)}"/></radialGradient>`;

export class BilayerBuild extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static BEAT_MAPS = { 1: [one(4)] };
  static WIDTH = 680; static HEIGHT = 540; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 500;
  static ARIA_LABEL = 'A cell membrane in section with water above and below. Lipids have round heads and two tails. They settle into two layers with heads outwards and tails inwards, and proteins sit embedded in the layers.';
  static CONTROLS = [];
  _s = 0; _k = 0; _a = null; _found = false; _swap = false;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [
      { kind: 'btn', id: 'settle', label: 'Let them settle', go: true },
      { kind: 'btn', id: 'side', label: 'Sideways' }, { kind: 'btn', id: 'flip', label: 'Flip' }, { kind: 'btn', id: 'rot', label: 'Rotate' },
      { kind: 'btn', id: 'pass', label: 'Pass through', go: true },
      { kind: 'btn', id: 'tilt', label: 'View from above', go: true },
    ], (id) => this._press(id));
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  onBeatChange(beat, count) {
    if (this.hostRole === 'setup') { super.onBeatChange(0, 1); return; }
    super.onBeatChange(beat, count);
  }
  enter(step) {
    this._a = null;
    this._s = step === 0 ? 0 : 1; this._k = 0; this._swap = false;
    for (const [id, on] of [['settle', step === 0], ['side', step === 1], ['flip', step === 1], ['rot', step === 1], ['pass', step === 2], ['tilt', step === 3]]) this.bar?.show(id, on);
    this.bar?.label('settle', 'Let them settle');
    this.bar?.label('tilt', 'View from above');
  }
  _run(kind, d, done, extra = {}) {
    this._a = { kind, d, ...extra };
    this.play(d);
    this.after(reducedMotion() ? 0.01 : d + 0.03, () => { this._a = null; done?.(); this.repaint(); });
  }
  _press(id) {
    if (this._a) return;
    if (id === 'settle') {
      const to = this._s ? 0 : 1; this._run('settle', 2.6, () => { this._s = to; this.bar.label('settle', to ? 'Scatter them' : 'Let them settle'); if (to && !this._found) { this._found = true; this.celebrate(); } }, { from: this._s, to });
    } else if (id === 'side') this._run('side', 3.2);
    else if (id === 'flip') this._run('flip', 2.4, () => { this._swap = !this._swap; });
    else if (id === 'rot') this._run('rot', 2.4);
    else if (id === 'pass') this._run('pass', 3.2);
    else if (id === 'tilt') { const to = this._k ? 0 : 1; this._run('tilt', 1.6, () => { this._k = to; this.bar.label('tilt', to ? 'View from the side' : 'View from above'); }, { from: this._k, to }); }
  }
  stageHeight(st) { return st.portrait ? 400 : 436; }
  _geo(st) {
    const { W, H, portrait: P } = st, sp = P ? 23 : 29, r = sp * 0.46, h = P ? 58 : 74;
    const n = Math.floor((W + 2 * sp) / sp), x0 = (W - (n - 1) * sp) / 2;
    return { W, H, P, sp, r, h, n, x0, cy: H * 0.5, len: (h - 7) / 0.84, ps: (h + 8) / 52, gw: 38 * (h + 8) / 52 + r * 0.6 };
  }
  _prot(g) { return g.P ? [g.W * 0.27, g.W * 0.73] : [g.W * 0.26, g.W * 0.7]; }

  animate(st, t = 0) {
    const step = this.stepIndex;
    if (step === 4) return;
    const G = this._geo(st), a = this._a, u = a ? Math.min(1, t / a.d) : 1, jig = a ? t : 0, gap = this._prot(G);
    if (step === 3) { this._tilted(G, a ? lerp(a.from, a.to, sm(u)) : this._k); return; }
    const settle = a?.kind === 'settle' ? lerp(a.from, a.to, sm(u)) : this._s;
    const dim = step === 1 ? 0.62 : 1, base = lipidBody(G.r, G.len, false);
    let d = '';
    const q = rnd(4), mid = Math.floor(G.n / 2), side = a?.kind === 'side' ? Math.sin(u * Math.PI) * 3.4 : 0;
    for (const sgn of [-1, 1]) for (let i = 0; i < G.n; i++) {
      const hx = G.x0 + i * G.sp, hy = G.cy + sgn * G.h, ang0 = sgn < 0 ? 0 : 180;
      const sx = q() * G.W, band = q() < 0.5, sy = band ? 34 + q() * (G.H * 0.3) : G.H - 34 - q() * (G.H * 0.3), sa = q() * 360, dl = q() * 0.34, wob = q() * 6.28;
      if (step === 2 && gap.some((px) => Math.abs(hx - px) < G.gw)) continue;
      const k = sm(Math.max(0, Math.min(1, (settle * (1 + dl)) - dl)));
      let x = lerp(sx, hx, k) + Math.sin(jig * 3 + wob) * 1.2, y = lerp(sy, hy, k) + Math.cos(jig * 2.6 + wob) * 1;
      const lit = step === 1 && i === mid && sgn === (this._swap ? 1 : -1);
      const partner = step === 1 && i === mid && sgn === (this._swap ? -1 : 1);
      if (lit) {
        if (a?.kind === 'side') x += side * G.sp;
        if (a?.kind === 'flip') { d += '@'; continue; }
        if (a?.kind === 'rot') { d += ''; continue; }
        this._lit = [x, y, ang0]; d += '@'; continue;
      }
      if (partner && a?.kind === 'flip') continue;
      if (step === 1 && sgn === -1 && !this._swap && i > mid && i <= mid + 3) x -= G.sp * sm(side - (i - mid - 1));
      if (step === 1 && sgn === 1 && this._swap && i > mid && i <= mid + 3) x -= G.sp * sm(side - (i - mid - 1));
      d += place(x, y, lerp(sa, ang0, k), base, dim);
    }
    // the lit lipid goes last, over the rest
    d = d.replaceAll('@', '');
    if (step === 1) {
      const lb = lipidBody(G.r, G.len, true), sgn = this._swap ? 1 : -1, hx = G.x0 + mid * G.sp, hy = G.cy + sgn * G.h, ang = sgn < 0 ? 0 : 180;
      if (a?.kind === 'flip') {
        const e = sm(u), y2 = lerp(hy, G.cy - sgn * G.h, e), yp = lerp(G.cy - sgn * G.h, hy, e);
        d += place(hx + Math.sin(e * Math.PI) * G.sp * 0.7, yp, lerp(ang + 180, ang, e), base, dim) + place(hx - Math.sin(e * Math.PI) * G.sp * 0.7, y2, lerp(ang, ang + 180, e), lb);
      } else if (a?.kind === 'rot') {
        d += place(hx, hy, ang, lipidBody(G.r, G.len, true, Math.abs(Math.cos(u * Math.PI * 3))));
      } else d += place(hx + (a?.kind === 'side' ? side * G.sp : 0), hy, ang, lb);
    }
    if (step === 2) {
      const px = gap[0], e = sm(u * 1.05), y = lerp(G.cy - G.h - 66, G.cy + G.h + 60, e), go = !!a;
      for (const p of gap) d += channel(p, G.cy, G.ps);
      if (go) {
        d += soluteDot(px, y, G.P ? 9 : 11);
        const bx = (gap[0] + gap[1]) / 2, b = Math.sin(Math.min(1, u) * Math.PI);
        d += soluteDot(bx, G.cy - G.h - G.r - 12 - (1 - b) * 56, G.P ? 9 : 11, { kind: 'salt' });
      }
    }
    anim(this, 'w', d);
  }
  _tilted(G, k) {
    const dz = G.sp * 0.87, R = Math.ceil(G.H / dz) + 2, top = G.cy - G.h, y1 = -dz * 0.5; let d = '';
    const base = lipidBody(G.r, G.len, false), bb = `<circle r="${n1(G.r)}" style="fill:url(#cw-head) ${T('sea-shallow')};stroke:${mx('sea-shallow', 'sea-deep', 56)};stroke-width:1.2"/><ellipse cx="${n1(-G.r * 0.3)}" cy="${n1(-G.r * 0.36)}" rx="${n1(G.r * 0.28)}" ry="${n1(G.r * 0.18)}" style="fill:${T('elev-peak')};opacity:.7"/>`;
    const gap = this._prot(G), P2 = this._tiles(G);
    const under = Math.max(0, 1 - k * 2.4);
    if (under > 0) for (let i = 0; i < G.n; i++) { const hx = G.x0 + i * G.sp; if (gap.some((px) => Math.abs(hx - px) < G.gw)) continue; d += place(hx, G.cy + G.h, 180, base, under); d += place(hx, top, 0, base, under); }
    if (under > 0) for (const px of gap) d += channel(px, G.cy, G.ps, { a: n1(under * 100) / 100 });
    if (k > 0.02) {
      const op = Math.min(1, k * 2);
      for (let j = 0; j < R; j++) {
        const y = lerp(top, y1 + j * dz, k);
        for (let i = -1; i <= G.n; i++) {
          const x = G.x0 + (i + (j & 1 ? 0.5 : 0)) * G.sp;
          if (P2.some((p) => Math.hypot((x - p.x) / 1, (j * dz + y1) - p.y) < p.r + G.r * 0.6)) continue;
          d += place(x, y, 0, bb, op);
        }
      }
      for (const p of P2) d += `<g opacity="${n1(op * 100) / 100}"><path d="${protTile(p.x, lerp(top, p.y, k), p.r, p.seed)}" style="fill:url(#cw-prot) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 62)};stroke-width:2"/><circle cx="${n1(p.x)}" cy="${n1(lerp(top, p.y, k))}" r="${n1(p.r * 0.26)}" style="fill:${mx('series-5', 'strata-6', 58)}"/></g>`;
    }
    anim(this, 'w', d);
  }
  _tiles(G) {
    const H = G.H;
    return G.P
      ? [{ x: G.W * 0.26, y: H * 0.26, r: 36, seed: 3 }, { x: G.W * 0.7, y: H * 0.52, r: 40, seed: 5 }, { x: G.W * 0.3, y: H * 0.8, r: 34, seed: 8 }]
      : [{ x: G.W * 0.2, y: H * 0.3, r: 50, seed: 3 }, { x: G.W * 0.52, y: H * 0.56, r: 58, seed: 5 }, { x: G.W * 0.83, y: H * 0.3, r: 48, seed: 8 }, { x: G.W * 0.24, y: H * 0.84, r: 44, seed: 11 }, { x: G.W * 0.86, y: H * 0.8, r: 42, seed: 13 }];
  }
  paint(st) {
    const G = this._geo(st), { W, H, P } = G, step = this.stepIndex;
    let g = `<defs>${DEFS}</defs>`;
    const k = step === 3 ? (this._a ? 0.5 : this._k) : 0;
    g += depthField(W, H, { tone: 'blue', seed: 9 });
    if (k < 1) {
      g += `<rect y="${n1(G.cy - G.h)}" width="${W}" height="${n1(2 * G.h)}" style="fill:${mx('sea-shallow', 'elev-peak', 26)};opacity:.6"/>`;
      const q = rnd(8); for (let i = 0; i < (P ? 16 : 26); i++) { const up = i % 2, y = up ? 12 + q() * (G.cy - G.h - 48) : G.cy + G.h + 34 + q() * (H - G.cy - G.h - 46); g += waterDot(q() * W, y, 3.4 + q() * 2.6, { a: 0.6 }); }
    }
    const size = P ? 15 : 18, wtop = 'Water outside the cell', wbot = 'Water inside the cell';
    if (step === 4) {
      const r = P ? 30 : 38, len = P ? 120 : 150, cy = H / 2 - len / 2 + 6;
      g += place(W / 2, cy, 8, lipidBody(r, len, false));
      g += label(W / 2, 28, wtop, { size }) + label(W / 2, H - 14, wbot, { size });
      const hx = W / 2 + r + 8;
      if (P) { g += label(W - 12, cy - 30, 'Head: attracted', { size, anchor: 'end' }) + label(W - 12, cy - 12, 'to water', { size, anchor: 'end' }) + label(12, cy + len * 0.66, 'Tails: repel', { size, anchor: 'start' }) + label(12, cy + len * 0.66 + 18, 'water', { size, anchor: 'start' }) + leader(68, cy + len * 0.56 - 8, W / 2 - 12, cy + len * 0.48); }
      else { g += leader(hx, cy, hx + 44, cy) + label(hx + 50, cy + 6, 'Head: attracted to water', { size, anchor: 'start' }) + leader(W / 2 + 18, cy + len * 0.6, W / 2 + 66, cy + len * 0.6) + label(W / 2 + 72, cy + len * 0.6 + 6, 'Tails: repel water', { size, anchor: 'start' }); }
    } else {
      g += '<g data-anim="w"></g>';
      if (k < 1) g += label(W / 2, 26, wtop, { size }) + label(W / 2, H - 12, wbot, { size });
      if (step === 0 && this._s) {
        const bx = W - (P ? 16 : 22);
        g += `<path d="M${bx - 8} ${n1(G.cy - G.h - 10)}H${bx}V${n1(G.cy + G.h + 10)}H${bx - 8}" ${stroke(T('strata-6'), 3)}/>`;
        g += label(bx - 14, G.cy - G.h - 22, 'Lipid bilayer', { size, anchor: 'end' });
      }
      if (step === 1) { const hx = G.x0 + Math.floor(G.n / 2) * G.sp; g += label(hx, G.cy - G.h - G.r - 12, 'One lipid', { size }); }
      if (step === 2) { const px = this._prot(G); g += label(px[1], G.cy - G.h - 26, 'Protein', { size }) + leader(px[1], G.cy - G.h - 20, px[1], G.cy - G.h - 2); }
      if (step === 3 && k === 1) { const p = this._tiles(G)[1]; g += label(p.x, p.y + 5, 'Protein', { size: P ? 15 : 17 }); g += label(W / 2, 26, 'Lipid heads and proteins, from outside', { size: P ? 15 : 18 }); }
    }
    return { svg: cwFrame(st, 'bb', g) };
  }
}
function protTile(x, y, r, seed) {
  const q = rnd(seed), n = 7, p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, k = 1 + (q() - 0.5) * 0.3; p.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]); }
  let d = `M${n1((p[0][0] + p[n - 1][0]) / 2)} ${n1((p[0][1] + p[n - 1][1]) / 2)}`;
  for (let i = 0; i < n; i++) { const b = p[(i + 1) % n]; d += `Q${n1(p[i][0])} ${n1(p[i][1])} ${n1((p[i][0] + b[0]) / 2)} ${n1((p[i][1] + b[1]) / 2)}`; }
  return d + 'Z';
}
