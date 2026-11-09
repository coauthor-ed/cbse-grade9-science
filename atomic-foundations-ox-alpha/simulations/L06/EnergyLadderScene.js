// EnergyLadderScene - companion to blk-l06-s5, "A Staircase, Not a Ramp".
// The drawing is the lesson: the same drop as a ramp and as a staircase, and under it the strip of light
// each one gives out. A ramp gives a smear of every colour and ends in the nucleus. Stairs give a few
// sharp lines and end at K.
//   b0  ramp      the learner lets the electron go: it slides, shedding light, into the nucleus
//   b1  stair     the learner drops it one step at a time: one flash per step, and it stops at K
//   b2  takeaway  a gas flame. The learner sprinkles salt: the flame turns yellow, one colour, one step.
// The colours stand for amounts of energy. Sodium's yellow is real; the units on the stairs are a model.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, darken, drawBackdrop, drawBench, drawFloor, lerp, lighten, luma, mix, mulberry32, rr } from 'simulations/base/kit/SimLook.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawElectron, drawFocus, drawNucleus } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';
import { LEVELS, drawPacket, drawStairs, stairLayout, toneOf } from './StairKit.js';

const S_RAMP = 0, S_STAIR = 1, S_FLAME = 2;
const ST = { x: 218, y: 352, w: 104, unit: 19, kick: 36 };
const STRIP = { x: 60, y: 416, w: 560, h: 44 };
const SLIDE = 2.6, DROP = 0.55;
const NUC = { x: 106, y: 324 };
const BURNER = { x: 340, y: 356 };

export class EnergyLadderScene extends SimScene {
  static BEAT_STEP_MAP = [S_RAMP, S_STAIR, S_FLAME].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'go', label: 'Let it go' },
    { type: 'button', id: 'drop', label: 'Drop one step' },
    { type: 'button', id: 'salt', label: 'Sprinkle salt' },
  ];
  static ARIA_LABEL = 'The same drop in energy as a ramp and as a staircase. On a ramp the electron slides down, giving out light of every colour in a smooth strip, and falls into the nucleus. On a staircase with steps N, M, L and K it can only drop a whole step at a time: each step gives one flash, so the strip shows three sharp lines, and it stops at K. Last, a gas flame turns yellow when you sprinkle salt on it, because the electrons of sodium fall down the same step and give out the same colour.';

  constructor(container, config) {
    super(container, config);
    this._t = 0; this._going = false;
    this._lvl = 3; this._hop = null; this._lines = [];
    this._salt = -1;
    this._found = false;
  }

  enter() {
    this._t = 0; this._going = false;
    this._lvl = 3; this._hop = null; this._lines = [];
    this._salt = -1;
    this._found = false;
  }

  isControlHidden(id) {
    return !((id === 'go' && this.stage === S_RAMP) || (id === 'drop' && this.stage === S_STAIR) || (id === 'salt' && this.stage === S_FLAME));
  }

  isControlDisabled(id) {
    if (id === 'go') return this._going;
    if (id === 'drop') return !!this._hop || this._lvl === 0;
    return false;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    this._act();
  }

  _act() {
    if (this.stage === S_RAMP) {
      if (this._going) return;
      this._t = reducedMotion() ? SLIDE : 0;
      this._going = !reducedMotion();
    }
    if (this.stage === S_STAIR) {
      if (this._hop || this._lvl === 0) {
        if (this._lvl === 0 && !this._hop) { this._lvl = 3; this._lines = []; }
        return;
      }
      const to = this._lvl - 1, e = LEVELS[this._lvl].e - LEVELS[to].e;
      if (reducedMotion()) this._land(to, e);
      else this._hop = { from: this._lvl, to, e, t: 0 };
    }
    if (this.stage === S_FLAME) {
      if (this._salt >= 0) return;
      this._salt = this.age;
      this.after(reducedMotion() ? 0 : 1, () => {
        if (!this._found) { this._found = true; this.celebrate(BURNER.x, BURNER.y - 130, 30, { key: 'yellow', lookAt: true }); }
      });
    }
    this.requestUiUpdate?.();
  }

  _land(to, e) {
    this._lvl = to;
    this._lines.push(e);
    this._hop = null;
    if (to === 0 && !this._found) {
      this._found = true;
      const p = stairLayout(ST)[0];
      this.celebrate(p.x, p.y - 20, 30, { key: 'k', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  pointerDown() { this._act(); }

  update(d) {
    if (this._going) {
      this._t += d;
      if (this._t >= SLIDE) { this._t = SLIDE; this._going = false; this.requestUiUpdate?.(); }
    }
    if (this._hop) {
      this._hop.t += d;
      if (this._hop.t >= DROP) this._land(this._hop.to, this._hop.e);
    }
  }

  busy() {
    if (this.stage === S_FLAME) return this._salt >= 0 ? this.age - this._salt < 2 : this.age < 1.2;
    return this._going || !!this._hop || this.age < 0.8;
  }

  // The strip of light given out. A ramp smears through the amounts it has passed; stairs give lines.
  _strip(ctx, c, u, lines) {
    const { x, y, w, h } = STRIP;
    rr(ctx, x - 10, y - 10 + 4, w + 20, h + 20, 14); ctx.fillStyle = darken(c.stroke, 0.35); ctx.fill();
    rr(ctx, x - 10, y - 10, w + 20, h + 20, 14); ctx.fillStyle = darken(c.bgDeep, 0.15); ctx.fill();
    const stops = [c.s5, c.s1, c.s3, c.s2, c.s8, c.s6];
    const xAt = (e) => x + 8 + ((13 - e) / 13) * (w - 16);
    if (lines) {
      if (!lines.length) tag(ctx, c, 'light given out', x + w / 2, y + h / 2, { size: 22 });
      for (const e of lines) {
        rr(ctx, xAt(e) - 7, y, 14, h, 5); ctx.fillStyle = toneOf(c, e); ctx.fill();
      }
      return;
    }
    const n = Math.floor(u * w / 3);
    for (let i = 0; i < n; i++) {
      const k = i / (w / 3), p = k * (stops.length - 1), a = Math.floor(p);
      ctx.fillStyle = mix(stops[a], stops[Math.min(stops.length - 1, a + 1)], p - a);
      ctx.fillRect(x + i * 3, y, 3.5, h);
    }
  }

  draw(ctx, c) {
    if (this.stage === S_FLAME) { this._flame(ctx, c); return; }
    drawDepthField(ctx, c, { x: 340, y: 210, seed: 41 });
    if (this.stage === S_RAMP) this._ramp(ctx, c);
    else this._stairs(ctx, c);
  }

  _ramp(ctx, c) {
    const pts = stairLayout(ST), top = pts[3];
    const y0 = pts[0].y;
    const body = mix(c.s5, c.bgSurface, 0.35);
    const rampX = (u) => lerp(top.x + ST.w / 2, NUC.x + 34, u);
    const rampY = (u) => lerp(top.y, NUC.y, u);
    ctx.beginPath();
    ctx.moveTo(rampX(1) - 10, ST.y + 5); ctx.lineTo(rampX(1) - 10, rampY(1)); ctx.lineTo(rampX(0), rampY(0)); ctx.lineTo(rampX(0), ST.y + 5); ctx.closePath();
    ctx.fillStyle = darken(body, 0.3); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rampX(1) - 10, ST.y); ctx.lineTo(rampX(1) - 10, rampY(1)); ctx.lineTo(rampX(0), rampY(0)); ctx.lineTo(rampX(0), ST.y); ctx.closePath();
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = lighten(body, 0.34); ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(rampX(1), rampY(1)); ctx.lineTo(rampX(0), rampY(0)); ctx.stroke(); ctx.lineCap = 'butt';
    drawNucleus(ctx, c, NUC.x, NUC.y - 10, { p: 3, n: 4, r: 38, seed: 3 });
    const u = ease.inOutCubic(clamp01(this._t / SLIDE)), done = this._t >= SLIDE;
    const ex = rampX(u), ey = rampY(u) - 20;
    if (this._going) drawPacket(ctx, ex + 8, ey - 34 - (this.clock * 90) % 40, -Math.PI / 2, 56, c.warning, { h: 9 });
    if (!done) { drawFocus(ctx, c, ex, ey, 16, 0.9); drawElectron(ctx, c, ex, ey, 16); }
    tag(ctx, c, 'a ramp: any energy', 480, 34, { size: 26 });
    this._strip(ctx, c, clamp01(this._t / SLIDE));
    if (done) tag(ctx, c, 'falls into the nucleus', 340, 494, { bg: c.bad, size: 26 });
    else if (!this._t) tag(ctx, c, 'tap to let it go', 340, 494, { bg: c.warning, size: 26 });
    else tag(ctx, c, 'light of every colour', 340, 494, { size: 26 });
  }

  _stairs(ctx, c) {
    const h = this._hop;
    const pts = drawStairs(ctx, c, { ...ST, active: h ? h.to : this._lvl });
    const from = h ? pts[h.from] : pts[this._lvl], to = h ? pts[h.to] : from;
    const u = h ? clamp01(h.t / DROP) : 0;
    const ex = lerp(from.x, to.x, u), ey = lerp(from.y, to.y, ease.inOutCubic(u) ** 2) - 20;
    drawFocus(ctx, c, ex, ey, 16, 0.9);
    drawElectron(ctx, c, ex, ey, 16);
    if (h) drawPacket(ctx, ex + 6, ey - 26 - u * 120, -Math.PI / 2, 66, toneOf(c, h.e), { alpha: 1 - u * 0.6 });
    tag(ctx, c, 'a staircase: fixed steps', 212, 34, { size: 26 });
    this._strip(ctx, c, 0, this._lines);
    if (this._lvl === 0 && !h) tag(ctx, c, 'K: no lower shell, so it stops', 340, 494, { bg: c.good, size: 24 });
    else if (!this._lines.length && !h) tag(ctx, c, 'tap to drop one step', 340, 494, { bg: c.warning, size: 26 });
    else tag(ctx, c, 'one flash, one line', 340, 494, { size: 26 });
  }

  // A stove in the kitchen: a burner on a steel top, a pinch of salt falling into a blue flame.
  _flame(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const dark = luma(c.bgDeep) < 0.5;
    const s = this._salt < 0 ? 0 : reducedMotion() ? 1 : ease.outCubic(clamp01((this.age - this._salt - 0.5) / 0.7));
    drawBackdrop(ctx, c, 'plain', { setting: 'none' });
    drawFloor(ctx, c, 470);
    drawBench(ctx, c, 40, 640, 392, { h: 78 });
    const steel = mix(c.label, c.bgSurface, dark ? 0.62 : 0.72);
    rr(ctx, 170, 366, 340, 30, 10); ctx.fillStyle = darken(steel, 0.3); ctx.fill();
    rr(ctx, 170, 362, 340, 28, 10); ctx.fillStyle = steel; ctx.fill();
    rr(ctx, BURNER.x - 150, 342, 300, 22, 9); ctx.fillStyle = darken(steel, 0.5); ctx.fill();
    const blue = mix(c.s1, c.s5, 0.25), yellow = c.gold;
    const fl = mix(blue, yellow, s);
    const t = reducedMotion() ? 0 : this.clock;
    // A ring of fat tongues round the burner, as on a real stove. Salt lifts them a little.
    for (const i of [-5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0]) {
      const x = BURNER.x + i * 25, h = (92 + (5 - Math.abs(i)) * 13) * (1 + s * 0.28) * (1 + 0.05 * Math.sin(t * 6 + i));
      ctx.beginPath();
      ctx.moveTo(x - 24, 344);
      ctx.bezierCurveTo(x - 30, 344 - h * 0.4, x - 8, 344 - h * 0.7, x, 344 - h);
      ctx.bezierCurveTo(x + 8, 344 - h * 0.7, x + 30, 344 - h * 0.4, x + 24, 344);
      ctx.closePath();
      ctx.fillStyle = darken(fl, 0.12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 13, 344);
      ctx.bezierCurveTo(x - 16, 344 - h * 0.3, x - 4, 344 - h * 0.46, x, 344 - h * 0.62);
      ctx.bezierCurveTo(x + 4, 344 - h * 0.46, x + 16, 344 - h * 0.3, x + 13, 344);
      ctx.closePath();
      ctx.fillStyle = lighten(fl, 0.45);
      ctx.fill();
    }
    if (this._salt >= 0 && !reducedMotion()) {
      const rnd = mulberry32(3), T = this.age - this._salt;
      ctx.fillStyle = c.label;
      for (let i = 0; i < 16; i++) {
        const d = rnd() * 0.5, u = clamp01((T - d) / 0.8), x = BURNER.x + (rnd() - 0.5) * 90;
        if (u > 0 && u < 1) { ctx.beginPath(); ctx.arc(x, lerp(30, 320, u), 3.5, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    tag(ctx, c, s > 0.5 ? 'yellow: sodium' : 'a gas flame', 340, 34, { bg: s > 0.5 ? yellow : c.raised, size: 28 });
    if (s > 0.5) tag(ctx, c, 'one step, one colour', 340, 488, { bg: c.raised, size: 26 });
    else if (this._salt < 0) tag(ctx, c, 'tap to sprinkle salt', 340, 488, { bg: c.warning, size: 26 });
  }
}
