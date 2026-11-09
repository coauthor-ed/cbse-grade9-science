// OsmosisTankScene - two solutions, one selectively permeable membrane. Numbers are a stated model, made up, on the figure: 140 water dots, S sugar on each side.
// Water crosses both ways at every moment; each side sends water across at a rate that falls as its share of solute rises:
//   rate(side) = BASE x water / (water + K x sugar)
// Sugar never crosses: no code moves a sugar from one side to the other. The level of each side follows its water count. When sugar/water is the same on both sides the two
// rates are equal, so net flow stops by itself, with water still crossing. No target level is set anywhere.
//   beat 0 6 and 6, equal: both ways, no net change  beat 1 12 on the right: net flow to the right  beat 2 12 at balance from the first frame, slider sets the sugar on the right
// CONTINUOUS: the particles keep moving at balance, which is the claim of beat 2.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { COLOR_TOKEN_MAP, mix, alpha, lighten, darken, pill, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const W = 520, H = 660, WATER = 140, BASE = 60, KK = 3, S_L = 6;
const T = { x0: 34, x1: 486, floor: 494, top: 96 };
const MID = 260, HALF = 70, UNIT = 3.0;   // level px per water dot on a side
const one = (idx) => [{ idx, dwellMs: null }];
const rate = (w, s) => BASE * (w / (w + KK * s));
const balance = (sR) => Math.round(WATER * (sR / (S_L + sR)));

export class OsmosisTankScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static CONTINUOUS = true;
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static COLOR_MAP = COLOR_TOKEN_MAP;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ id: 'sugar', type: 'slider', label: 'Sugar on the right', min: 2, max: 16, step: 2, value: 12 }];
  static ARIA_LABEL = 'A glass tank divided by a membrane, with water dots and sugar on both sides. Water dots cross both ways all the time and sugar never crosses. With equal sugar the levels stay equal. With more sugar on the right, the right level rises until the concentrations match, and water then crosses equally both ways.';

  isControlVisible(id) { return id === 'sugar' ? this.stage === 2 : true; }
  getControlValue(id) { return id === 'sugar' ? this._sR : undefined; }
  onControlChange(id, v) { if (id === 'sugar') { this._setSugar(Number(v)); } }

  enter(stage) {
    this._sR = stage === 0 ? 6 : 12;
    this._n = stage === 2 ? balance(12) : WATER / 2;   // water on the right
    this._acc = [0, 0]; this._hold = 0; this._flow = [0, 0]; this._cnt = [0, 0];
    const r = mulberry32(5);
    this._r = r;
    this._w = [];
    for (let i = 0; i < WATER; i++) this._w.push({ side: i < this._n ? 1 : 0, u: r(), v: r(), a: r() * 6.28 });
    this._s = [];
    for (let i = 0; i < S_L; i++) this._s.push({ side: 0, u: r(), v: r(), a: r() * 6.28 });
    for (let i = 0; i < 16; i++) this._s.push({ side: 1, u: r(), v: r(), a: r() * 6.28, n: i });
    if (reducedMotion() && stage === 1) this._settle();
  }
  _setSugar(v) { this._sR = v; if (reducedMotion()) this._settle(); }
  _settle() { this._n = balance(this._sR); let k = this._n; for (const w of this._w) { w.side = k > 0 ? 1 : 0; k -= 1; } }
  _level(side) { const n = side ? this._n : WATER - this._n; return T.floor - n * UNIT; }
  _pos(p, gap = 12) { const x0 = p.side ? MID + gap : T.x0 + 14, x1 = p.side ? T.x1 - 14 : MID - gap, y0 = this._level(p.side) + 12, y1 = T.floor - 10; return [x0 + p.u * (x1 - x0), y0 + p.v * Math.max(4, y1 - y0)]; }
  _cross(from) {
    // move one water dot across; it is drawn at the membrane for a moment
    const c = this._w.filter((w) => w.side === from); if (!c.length) return;
    const w = c[Math.floor(this._r() * c.length)]; w.side = 1 - from; w.flash = 0.5; w.u = from ? 0.98 : 0.02;
    this._n += from ? -1 : 1; this._cnt[from] += 1;
  }
  update(d) {
    const nR = this._n, nL = WATER - nR;
    const rl = rate(nL, S_L), rr = rate(nR, this._sR);
    this._acc[0] += rl * d; this._acc[1] += rr * d;
    while (this._acc[0] >= 1) { this._acc[0] -= 1; this._cross(0); }
    while (this._acc[1] >= 1) { this._acc[1] -= 1; this._cross(1); }
    const mv = (p, sp) => { p.a += (Math.random() - 0.5) * 1.6; p.u = Math.min(1, Math.max(0, p.u + Math.cos(p.a) * sp * d)); p.v = Math.min(1, Math.max(0, p.v + Math.sin(p.a) * sp * d)); if (p.u === 0 || p.u === 1) p.a = 3.14 - p.a; if (p.v === 0 || p.v === 1) p.a = -p.a; if (p.flash) p.flash = Math.max(0, p.flash - d); };
    for (const w of this._w) mv(w, 0.34);
    for (const s of this._s) mv(s, 0.12);
    this._hold += d;
    if (this._hold >= 1) { this._flow = this._cnt; this._cnt = [0, 0]; this._hold = 0; }
  }
  busy() { return false; }
  _eq() { return Math.abs(this._n - balance(this._sR)) <= 1; }
  draw(ctx, c) {
    const wall = ctx.createLinearGradient(0, 0, 0, 560);
    wall.addColorStop(0, mix(c.s5, c.bgSurface, 0.86)); wall.addColorStop(1, mix(c.s5, c.bgSurface, 0.72));
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
    const bench = ctx.createLinearGradient(0, 510, 0, H); bench.addColorStop(0, darken(c.s8, 0.42)); bench.addColorStop(1, darken(c.s8, 0.62));
    ctx.fillStyle = bench; ctx.fillRect(0, 510, W, H - 510);
    ctx.fillStyle = alpha(c.label, 0.2); ctx.beginPath(); ctx.ellipse(W / 2 + 6, 508, 236, 10, 0, 0, 6.3); ctx.fill();
    // water, each side to its own level
    for (const side of [0, 1]) {
      const x0 = side ? MID : T.x0, x1 = side ? T.x1 : MID, y = this._level(side), g = ctx.createLinearGradient(0, y, 0, T.floor);
      g.addColorStop(0, alpha(mix(c.s7, c.bgSurface, 0.4), 0.8)); g.addColorStop(1, alpha(mix(c.s1, c.label, 0.34), 0.86));
      ctx.fillStyle = g; ctx.fillRect(x0, y, x1 - x0, T.floor - y);
      ctx.strokeStyle = lighten(c.s7, 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 3, y); ctx.lineTo(x1 - 3, y); ctx.stroke();
    }
    for (const w of this._w) { const [x, y] = this._pos(w), r = w.flash ? 7 : 4.8; ctx.fillStyle = w.flash ? c.s7 : c.s1; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); ctx.fillStyle = alpha(lighten(c.s1, 0.7), 0.9); ctx.beginPath(); ctx.arc(x - 1.5, y - 1.6, 1.5, 0, 6.3); ctx.fill(); }
    const sCount = [S_L, this._sR];
    for (const s of this._s) {
      if (s.side === 1 && s.n >= this._sR) continue;
      const [x, y] = this._pos(s, 30), r = 13;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath();
      const g = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, r); g.addColorStop(0, lighten(c.s2, 0.6)); g.addColorStop(1, c.s2); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = darken(c.s2, 0.4); ctx.lineWidth = 2; ctx.stroke();
    }
    // membrane: two rows of heads, with gaps
    for (let y = T.top; y <= T.floor; y += 12) { for (const dx of [-5, 5]) { ctx.fillStyle = (y % 48 < 12) ? alpha(c.s7, 0.2) : c.s7; ctx.beginPath(); ctx.arc(MID + dx, y, 4.8, 0, 6.3); ctx.fill(); } }
    // glass
    ctx.strokeStyle = mix(c.s5, c.label, 0.5); ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(T.x0, T.top - 14); ctx.lineTo(T.x0, T.floor + 3); ctx.lineTo(T.x1, T.floor + 3); ctx.lineTo(T.x1, T.top - 14); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.s7, 0.8), 0.5); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(T.x0 + 12, T.top); ctx.lineTo(T.x0 + 12, T.floor - 20); ctx.stroke();
    const [fl, fr] = this._flow, eq = this._eq();
    pill(ctx, c, `sugar: ${sCount[0]}`, 130, 36, { size: 26, bg: c.bgSurface, display: true });
    pill(ctx, c, `sugar: ${sCount[1]}`, 392, 36, { size: 26, bg: c.bgSurface, display: true });
    pill(ctx, c, `crossing: ${fl} right, ${fr} left, each second`, W / 2, 552, { size: 24, bg: c.bgSurface });
    const net = this.stage === 0 || eq ? 'no net movement' : this._n < balance(this._sR) ? 'net movement: to the right' : 'net movement: to the left';
    pill(ctx, c, net, W / 2, 610, { size: 26, bg: c.accent, display: true });
    pill(ctx, c, 'made-up numbers', W / 2, 76, { size: 19, bg: c.bgSurface });
  }
}
