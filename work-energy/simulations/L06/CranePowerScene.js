import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, alpha, lighten, darken, mix, rr, mulberry32, clamp01, lerp, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawCrate } from 'simulations/base/kit/SimApparatus.js';
import { drawPulley } from 'simulations/base/kit/SimProps.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// CranePowerScene - blk-l06-s07, Higher, or Faster (2 beats).
//   b0 a tower crane lifts a load to floor 10 (time t), then the same load to
//      floor 20 (time 2t). The load moves at the same speed v both times, and
//      the U bars fill at the same rate: twice the energy, twice the time,
//      the same power.
//   b1 two flags on two poles with pulleys, raised together: one slowly
//      (time t), one twice as fast (t/2). Both U bars end level (the same
//      work); the fast bar fills twice as fast: power x2.
const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const GROUND = 470;
const FH = 19; // px per floor
const LX = 214; // the load's column, beside the building
const BLD = { x0: 262, x1: 446 };
const JIB_Y = 30;
const MAST_X = 516;
const SPEED = FH * 10 / 1.5; // px/s: 10 floors in 1.5 s, the same speed both lifts
const A0 = 0.4, A1 = A0 + 1.5; // lift 1
const B0 = A1 + 0.7, B1 = B0 + 3.0; // lift 2
// b1
const POLES = [118, 334];
const PTOP = 74;
const FLAG_LOW = 392; // flag top at the start
const FLAG_HIGH = 96; // flag top at the top
const F0 = 0.4;
const SLOW = 3.0; // s for the slow raise; the fast one takes half

const GRASS = (() => {
  const r = mulberry32(5);
  return Array.from({ length: 70 }, () => ({ x: r() * W, h: 5 + r() * 8, l: r() }));
})();

const sm = (u) => u * u * (3 - 2 * u);

export class CranePowerScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A tower crane lifts a load beside a building to floor 10 in time t, then the same load to floor 20 in time 2t, at the same speed: the second U bar is twice as tall and both filled at the same rate, so the power is the same. Then two flags are raised up two poles with pulleys, one twice as fast: both U bars end at the same height, the same work, and the fast one fills in half the time, so its power is doubled.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() {
    this.runT0 = this.age;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.runT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.runT0 || 0);
  }

  busy() {
    return this.t() < (this.stage === 0 ? B1 + 0.9 : F0 + SLOW + 0.9);
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage === 0) this.crane(ctx, c, this.t());
    else this.flags(ctx, c, this.t());
  }

  // -- b0: the crane --------------------------------------------------------
  crane(ctx, c, t) {
    this.site(ctx, c);
    this.building(ctx, c);
    // which lift, and where the load is
    const h10 = FH * 10;
    const h20 = FH * 20;
    let h = 0;
    let moving = false;
    let lift = 0;
    if (t < A0) h = 0;
    else if (t < A1) { h = SPEED * (t - A0); moving = true; lift = 1; }
    else if (t < B0 - 0.3) { h = h10; lift = 1; }
    else if (t < B0) h = 0;
    else if (t < B1) { h = SPEED * (t - B0); moving = true; lift = 2; }
    else { h = h20; lift = 2; }
    h = Math.min(h, h20);
    const ghost10 = t >= B0 - 0.3; // lift 1's place stays marked
    const loadBottom = GROUND - h;
    this.tower(ctx, c, loadBottom);
    if (ghost10) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = alpha(c.label, 0.55);
      ctx.lineWidth = 2;
      rr(ctx, LX - 25, GROUND - h10 - 32, 50, 32, 4);
      ctx.stroke();
      ctx.restore();
    }
    drawCrate(ctx, c, { x: LX, y: loadBottom, w: 50, h: 32, held: h > 1 });
    // the speed: the same arrow both lifts
    if (moving) {
      vectorArrow(ctx, c, LX - 40, loadBottom - 4, { angle: -Math.PI / 2, length: 56, col: c.s2, width: 5 });
      pill(ctx, c, 'v', LX - 40, loadBottom + 24, { size: 26, bg: c.s2 });
    }
    // U bars: lift 1 and lift 2, one scale, the same slope while filling.
    // A narrow panel on the far left, clear of the load's column and its v arrow.
    const u1 = t < A0 ? 0 : clamp01((t - A0) / 1.5);
    const u2 = t < B0 ? 0 : clamp01((t - B0) / 3.0) * 2;
    const eb = drawEnergyBars(ctx, c, {
      x: 8, y: 150, h: 210, max: 2, barW: 32, gap: 42, size: 26, minSize: 26,
      bars: [{ id: 'a', label: 'lift 1', tone: 3 }, { id: 'b', label: 'lift 2', tone: 3 }],
      values: { a: u1, b: u2 },
    });
    const bs = eb?.bars ?? [];
    const ty = (eb?.y0 ?? 150) + (eb?.h ?? 260) + 24;
    // each lift's time, under its own bar's label
    if (bs[0] && t >= A1) pill(ctx, c, 't', bs[0].x + bs[0].w / 2, ty, { size: 26, bg: c.gold });
    if (bs[1] && t >= B1) pill(ctx, c, '2t', bs[1].x + bs[1].w / 2, ty, { size: 26, bg: c.gold });
    const a = clamp01((t - B1 - 0.3) / 0.4);
    const mx = Math.max(100, bs[0] && bs[1] ? (bs[0].x + bs[1].x + bs[1].w) / 2 : 100);
    if (a > 0) pill(ctx, c, 'same power', mx, (eb?.y0 ?? 150) - 28, { size: 26, bg: c.accent, alpha: a, scale: 0.85 + 0.15 * a });
  }

  site(ctx, c) {
    const dirt = mix(c.gold, c.stroke, 0.55);
    ctx.fillStyle = dirt;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(dirt, 0.2);
    ctx.fillRect(0, GROUND, W, 4);
    ctx.fillStyle = darken(dirt, 0.15);
    ctx.fillRect(0, GROUND + 26, W, H - GROUND - 26);
    const r = mulberry32(12);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = alpha(darken(dirt, 0.35), 0.6);
      ctx.fillRect(r() * W, GROUND + 6 + r() * 40, 3 + r() * 5, 2);
    }
  }

  building(ctx, c) {
    const { x0, x1 } = BLD;
    const top = GROUND - FH * 20;
    const wall = mix(c.raised, c.labelMuted, 0.35);
    // rim, body, shade side, light edge
    ctx.fillStyle = darken(wall, 0.35);
    ctx.fillRect(x0 - 2, top - 8, x1 - x0 + 4, GROUND - top + 8);
    ctx.fillStyle = wall;
    ctx.fillRect(x0, top - 6, x1 - x0, GROUND - top + 6);
    ctx.fillStyle = darken(wall, 0.16);
    ctx.fillRect(x1 - 46, top - 6, 46, GROUND - top + 6);
    ctx.fillStyle = lighten(wall, 0.25);
    ctx.fillRect(x0, top - 6, 4, GROUND - top + 6);
    // floors: slab lines and windows
    for (let f = 0; f < 20; f++) {
      const yb = GROUND - f * FH;
      ctx.fillStyle = darken(wall, 0.28);
      ctx.fillRect(x0, yb - 2, x1 - x0, 2);
      for (let wx = x0 + 12; wx < x1 - 14; wx += 24) {
        const shade = wx > x1 - 46;
        ctx.fillStyle = shade ? darken(c.glass, 0.35) : mix(c.glass, c.bgDeep, 0.2);
        ctx.fillRect(wx, yb - FH + 5, 14, FH - 9);
        ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.5);
        ctx.fillRect(wx, yb - FH + 5, 3, FH - 9);
      }
    }
    // the receiving decks at floors 10 and 20
    for (const f of [10, 20]) {
      const y = GROUND - f * FH;
      ctx.fillStyle = darken(c.stroke, 0.15);
      ctx.fillRect(x0 - 16, y - 1, 18, 6);
      ctx.fillStyle = lighten(c.stroke, 0.3);
      ctx.fillRect(x0 - 16, y - 1, 18, 2);
      pill(ctx, c, `floor ${f}`, (x0 + x1) / 2 - 20, y - FH / 2 - 1, { size: 26, bg: c.raised, ink: c.label });
    }
    drawShadow(ctx, c, (x0 + x1) / 2, GROUND + 3, (x1 - x0) * 0.55, 6, 0.6);
  }

  // a tower crane: lattice mast, jib, counter-jib, cab, trolley and hook
  tower(ctx, c, loadBottom) {
    const steel = mix(c.gold, c.flame, 0.2);
    const rim = darken(steel, 0.45);
    const lat = (xa, ya, xb, yb) => {
      ctx.beginPath();
      ctx.moveTo(xa, ya);
      ctx.lineTo(xb, yb);
      ctx.stroke();
    };
    // mast: two rails and zigzag braces
    const mw = 26;
    ctx.lineCap = 'round';
    ctx.strokeStyle = rim;
    ctx.lineWidth = 6;
    lat(MAST_X - mw / 2, GROUND, MAST_X - mw / 2, JIB_Y + 14);
    lat(MAST_X + mw / 2, GROUND, MAST_X + mw / 2, JIB_Y + 14);
    ctx.strokeStyle = steel;
    ctx.lineWidth = 3.5;
    lat(MAST_X - mw / 2, GROUND, MAST_X - mw / 2, JIB_Y + 14);
    ctx.strokeStyle = darken(steel, 0.18);
    lat(MAST_X + mw / 2, GROUND, MAST_X + mw / 2, JIB_Y + 14);
    ctx.strokeStyle = darken(steel, 0.1);
    ctx.lineWidth = 2;
    for (let y = GROUND; y > JIB_Y + 40; y -= 26) {
      lat(MAST_X - mw / 2, y, MAST_X + mw / 2, y - 13);
      lat(MAST_X + mw / 2, y - 13, MAST_X - mw / 2, y - 26);
    }
    // footing
    ctx.fillStyle = darken(c.stroke, 0.2);
    ctx.fillRect(MAST_X - 30, GROUND - 6, 60, 12);
    ctx.fillStyle = lighten(c.stroke, 0.2);
    ctx.fillRect(MAST_X - 30, GROUND - 6, 60, 3);
    // apex and ties
    const apex = { x: MAST_X, y: JIB_Y - 26 };
    ctx.strokeStyle = alpha(c.label, 0.5);
    ctx.lineWidth = 1.6;
    lat(apex.x, apex.y, 150, JIB_Y);
    lat(apex.x, apex.y, 660, JIB_Y);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 5;
    lat(MAST_X - 10, JIB_Y, apex.x, apex.y);
    lat(MAST_X + 10, JIB_Y, apex.x, apex.y);
    // jib: a truss from x 150 to the mast, counter-jib to 664
    const jy0 = JIB_Y;
    const jy1 = JIB_Y + 14;
    ctx.fillStyle = rim;
    ctx.fillRect(146, jy0 - 2, 664 - 146, 4);
    ctx.fillRect(146, jy1 - 2, 664 - 146, 4);
    ctx.fillStyle = steel;
    ctx.fillRect(146, jy0 - 1, 664 - 146, 2);
    ctx.fillStyle = darken(steel, 0.15);
    ctx.fillRect(146, jy1 - 1, 664 - 146, 2);
    ctx.strokeStyle = darken(steel, 0.1);
    ctx.lineWidth = 2;
    for (let x = 150; x < 660; x += 16) lat(x, jy1, x + 8, jy0);
    for (let x = 158; x < 660; x += 16) lat(x, jy0, x + 8, jy1);
    // counterweight blocks
    for (let i = 0; i < 3; i++) {
      const bx = 612 + i * 16;
      ctx.fillStyle = darken(c.stroke, 0.3);
      ctx.fillRect(bx, jy1, 15, 38);
      ctx.fillStyle = lighten(c.stroke, 0.15);
      ctx.fillRect(bx, jy1, 4, 38);
    }
    // cab
    ctx.fillStyle = rim;
    rr(ctx, MAST_X - 34, jy1 + 1, 30, 30, 4);
    ctx.fill();
    ctx.fillStyle = steel;
    rr(ctx, MAST_X - 32, jy1 + 3, 26, 26, 3);
    ctx.fill();
    ctx.fillStyle = mix(c.glass, c.bgDeep, 0.2);
    ctx.fillRect(MAST_X - 30, jy1 + 6, 12, 14);
    // trolley over the load column
    ctx.fillStyle = rim;
    ctx.fillRect(LX - 14, jy1 + 1, 28, 10);
    ctx.fillStyle = lighten(steel, 0.2);
    ctx.fillRect(LX - 12, jy1 + 2, 24, 4);
    // two falls of rope to the hook block
    const hookY = loadBottom - 32 - 18;
    ctx.strokeStyle = darken(c.stroke, 0.35);
    ctx.lineWidth = 2;
    lat(LX - 5, jy1 + 10, LX - 5, hookY);
    lat(LX + 5, jy1 + 10, LX + 5, hookY);
    ctx.fillStyle = c.s2;
    rr(ctx, LX - 9, hookY - 2, 18, 12, 3);
    ctx.fill();
    ctx.fillStyle = darken(c.s2, 0.35);
    ctx.fillRect(LX + 3, hookY - 2, 6, 12);
    // slings to the load corners
    ctx.strokeStyle = alpha(c.label, 0.7);
    ctx.lineWidth = 1.6;
    lat(LX, hookY + 10, LX - 22, loadBottom - 32);
    lat(LX, hookY + 10, LX + 22, loadBottom - 32);
  }

  // -- b1: two flags, one twice as fast -------------------------------------
  flags(ctx, c, t) {
    this.lawn(ctx, c);
    const us = clamp01((t - F0) / SLOW);
    const uf = clamp01((t - F0) / (SLOW / 2));
    this.pole(ctx, c, POLES[0], us, 0, t);
    this.pole(ctx, c, POLES[1], uf, 3, t);
    const eb = drawEnergyBars(ctx, c, {
      x: 500, y: 60, h: 200, max: 1, total: 1, barW: 50, gap: 26,
      bars: [{ id: 'sl', label: 'slow', tone: 3 }, { id: 'fa', label: 'fast', tone: 3 }],
      values: { sl: us, fa: uf }, size: 26, minSize: 24,
    });
    void eb;
    // a stopwatch per pole: both hands sweep at the same rate; the fast one stops at half the time
    this.watch(ctx, c, POLES[0] + 66, 214, t, SLOW, 't');
    this.watch(ctx, c, POLES[1] + 66, 214, t, SLOW / 2, 't/2');
    const a = clamp01((t - F0 - SLOW - 0.3) / 0.4);
    if (a > 0) pill(ctx, c, 'fast: power x2', 572, 360, { size: 26, bg: c.accent, alpha: a, scale: 0.85 + 0.15 * a });
  }

  // A stopwatch: rim, crown button, dial ticks, a hand that runs while its flag rises.
  watch(ctx, c, x, y, t, secs, label) {
    const r = 27;
    const u = clamp01((t - F0) / SLOW);          // one full turn = the slow raise
    const run = clamp01((t - F0) / secs);
    const turn = Math.min(u, secs / SLOW);
    const done = run >= 1;
    const body = mix(c.raised, c.labelMuted, 0.15);
    ctx.save();
    drawShadow(ctx, c, x + 3, y + r + 4, r * 0.8, 4, 0.35);
    ctx.fillStyle = darken(body, 0.35);
    rr(ctx, x - 6, y - r - 12, 12, 9, 3);
    ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.3); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = lighten(body, 0.35); ctx.fill();
    // the elapsed sector, so the two watches compare at a glance
    if (turn > 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + turn * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = alpha(c.gold, done ? 0.55 : 0.35);
      ctx.fill();
    }
    ctx.strokeStyle = darken(body, 0.4);
    for (let k = 0; k < 12; k++) {
      const q = (k / 12) * Math.PI * 2;
      ctx.lineWidth = k % 3 ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(q) * (r - 3), y - Math.cos(q) * (r - 3));
      ctx.lineTo(x + Math.sin(q) * (r - (k % 3 ? 7 : 9)), y - Math.cos(q) * (r - (k % 3 ? 7 : 9)));
      ctx.stroke();
    }
    const q = turn * Math.PI * 2;
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(q) * (r - 6), y - Math.cos(q) * (r - 6));
    ctx.stroke();
    ctx.fillStyle = c.label;
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (done) pill(ctx, c, label, x, y + r + 26, { size: 24, bg: c.gold });
  }

  lawn(ctx, c) {
    // a low school wall behind
    const wall = mix(c.labelMuted, c.raised, 0.5);
    ctx.fillStyle = darken(wall, 0.25);
    ctx.fillRect(0, 384, W, 4);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 388, W, GROUND - 388);
    for (let x = 0; x < W; x += 58) {
      ctx.fillStyle = darken(wall, 0.12);
      ctx.fillRect(x, 388, 2, GROUND - 388);
    }
    const g = mix(c.s3, c.bgDeep, 0.25);
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(g, 0.2);
    ctx.fillRect(0, GROUND, W, 4);
    ctx.fillStyle = darken(g, 0.15);
    ctx.fillRect(0, GROUND + 24, W, H - GROUND - 24);
    ctx.strokeStyle = darken(g, 0.25);
    ctx.lineWidth = 2;
    for (const s of GRASS) {
      ctx.beginPath();
      ctx.moveTo(s.x, GROUND + 2);
      ctx.lineTo(s.x + (s.l - 0.5) * 6, GROUND + 2 - s.h);
      ctx.stroke();
    }
  }

  // one pole: pulley at the top, flag on the left fall, a student on the right
  pole(ctx, c, x, u, look, t) {
    const metal = mix(c.labelMuted, c.raised, 0.25);
    // plinth
    ctx.fillStyle = darken(c.stroke, 0.15);
    ctx.fillRect(x - 22, GROUND - 14, 44, 14);
    ctx.fillStyle = lighten(c.stroke, 0.25);
    ctx.fillRect(x - 22, GROUND - 14, 44, 3);
    // the pole
    ctx.fillStyle = darken(metal, 0.4);
    ctx.fillRect(x - 6, PTOP, 12, GROUND - 14 - PTOP);
    ctx.fillStyle = metal;
    ctx.fillRect(x - 4.5, PTOP, 9, GROUND - 14 - PTOP);
    ctx.fillStyle = lighten(metal, 0.4);
    ctx.fillRect(x - 4.5, PTOP, 2.5, GROUND - 14 - PTOP);
    const pr = 13;
    const py = PTOP + 4;
    // rope: left fall carries the flag, right fall goes to the hands
    const flagTop = lerp(FLAG_LOW, FLAG_HIGH, sm(u) * 0 + u);
    const pulled = (FLAG_LOW - flagTop);
    const rx = x + pr;                     // the hauling fall of the rope
    const hiY = GROUND - 120, loY = GROUND - 80;   // shoulder to waist: the head stays clear of the rope
    const moving = u > 0 && u < 1;
    // Hand over hand: each hand grips high, pulls down to the chest, lets go and reaches up again.
    const ph = pulled / 46;
    const handAt = (k) => {
      if (!moving) return k ? { x: rx, y: hiY } : { x: rx, y: loY };
      const w = ((ph + k * 0.5) % 1 + 1) % 1;
      if (w < 0.6) return { x: rx, y: hiY + (loY - hiY) * (w / 0.6) };
      return { x: rx + 7, y: loY + (hiY - loY) * ((w - 0.6) / 0.4) };
    };
    const hands = [handAt(0), handAt(1)];
    const hx = x + 40;
    ctx.strokeStyle = mix(c.gold, c.stroke, 0.4);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - pr, py);
    ctx.lineTo(x - pr, GROUND - 40);
    ctx.lineTo(x - 6, GROUND - 46);
    ctx.moveTo(x + pr, py);
    ctx.lineTo(x + pr, loY + 52);
    ctx.quadraticCurveTo(x + pr + 4, GROUND - 20, x + pr + 22, GROUND - 4);
    ctx.stroke();
    drawPulley(ctx, c, x, py, pr);
    // the flag: a hoist strip and a cloth with a stripe, gently waving
    const fw = 76;
    const fh = 48;
    const wv = reducedMotion() ? 0 : Math.sin(t * 3 + x) * 3;
    const fx = x - pr;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fx, flagTop);
    ctx.quadraticCurveTo(fx - fw / 2, flagTop - 6 + wv, fx - fw, flagTop + wv);
    ctx.lineTo(fx - fw, flagTop + fh + wv);
    ctx.quadraticCurveTo(fx - fw / 2, flagTop + fh - 6 + wv, fx, flagTop + fh);
    ctx.closePath();
    ctx.fillStyle = c.s4;
    ctx.fill();
    ctx.strokeStyle = darken(c.s4, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = lighten(c.s4, 0.5);
    ctx.fillRect(fx - fw, flagTop + fh * 0.36 + wv * 0.5, fw, fh * 0.28);
    ctx.fillStyle = alpha(darken(c.s4, 0.3), 0.6);
    ctx.fillRect(fx - fw * 0.35, flagTop - 10, fw * 0.35, fh + 20);
    ctx.restore();
    // the student, hands on the rope
    const spec = figureFor(this, {
      role: 'student', i: look, pose: { name: 'stand', lean: -12, crouch: 0.08 }, x: hx, y: GROUND, scale: 100, facing: -1, hands,
    });
    drawFigure(ctx, c, spec, { ...spec.look, mood: moving ? 'effort' : 'smile' });
  }
}
