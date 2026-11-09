import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, clamp01,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars, drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';

// BrakingCarScene - blk-l09-s03, A Car Brakes (book Revise Q13, Fig 7.38).
// b0: the car runs along the road while its speed-time graph draws below it:
//     A to B, 35 m/s held for 1 s (the driver reacting); B to C, a straight
//     fall to 0 in 2 s (the brakes). Road posts A, B, C mark where the car's
//     nose is at those instants: 35 m and then another 35 m.
// b1: the same run with the energy: K is 612 500 J from A to B; between B and C
//     the K bar drains into the heat and sound bar (K goes as speed squared),
//     the brakes glow, and W = -612 500 J appears for the brakes.

const MASS = 1000, V0 = 35, T_REACT = 1, T_BRAKE = 2, T_END = T_REACT + T_BRAKE;
const K0 = 0.5 * MASS * V0 * V0;                 // 612 500 J
const DEC = V0 / T_BRAKE;                        // 17.5 m/s^2
const S_END = V0 * T_REACT + V0 * T_BRAKE / 2;   // 70 m
const SLOW = 1.4;                                // shown 1.4x slower than real
const RUN_S = T_END * SLOW;

// road and car
const ROAD_TOP = 178, ROAD_Y = 224, ROAD_BOT = 240;
const POST_Y = 88;                               // post tops; their names sit 12 above
const CS = 0.8;                                  // car scale (design car is 236 long)
const NOSE = 120 * CS;                           // centre to front bumper
const FRONT_A = 196, PX_M = 6.1;                 // nose at A; px per metre (C at 623)
// graph
const CARD = { x: 22, y: 256, w: 470, h: 258 };
const OX = 112, OY = 450, PX_S = 104, PX_V = 3.6; // origin, px per s, px per m/s
// bars (card ends well above the bottom edge)
const BAR_X = 498, BAR_Y = 262, BAR_H = 124;

function speedAt(t) { return t <= T_REACT ? V0 : Math.max(0, V0 - DEC * (t - T_REACT)); }
function distAt(t) {
  if (t <= T_REACT) return V0 * t;
  const u = Math.min(t, T_END) - T_REACT;
  return V0 * T_REACT + V0 * u - 0.5 * DEC * u * u;
}
function fmtJ(v) {
  const n = Math.round(v / 500) * 500;
  const s = String(Math.abs(n));
  return (n < 0 ? '-' : '') + (s.length > 3 ? s.slice(0, -3) + ' ' + s.slice(-3) : s) + ' J';
}

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class BrakingCarScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A 1000 kg car drives along a road past posts A, B and C while its speed-time graph draws below: a flat line at 35 m/s from A at 0 s to B at 1 s, then a straight line down to 0 at C at 3 s. Then the same run with two energy bars: the kinetic energy bar holds at 612 500 J from A to B, and between B and C it drains into the heat and sound bar while the brakes glow; the work done by the brakes is shown as W = -612 500 J.';

  enter() {
    this.runT = 0;
  }

  get energyBeat() { return this.stage >= 1; }

  pointerDown() {
    this.runT = 0;      // tap: drive it again
    this.animateFor(800);
  }

  get runEnd() { return RUN_S + 0.1; }
  update(d) { this.runT = Math.min(this.runEnd, (this.runT ?? 0) + d); }
  busy() { return (this.runT ?? 0) < this.runEnd; }

  get t() { return Math.min(T_END, (this.runT ?? 0) / SLOW); }   // seconds of the real run

  draw(ctx, c) {
    const t = this.t;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, ROAD_TOP - 6);
    this.road(ctx, c);
    this.posts(ctx, c, t);
    const front = FRONT_A + distAt(t) * PX_M;
    this.car(ctx, c, front - NOSE, distAt(t) * PX_M / (23 * CS), t);
    pill(ctx, c, `${MASS} kg`, front - NOSE - 8, ROAD_Y - 98 * CS - 24, { size: 26, bg: c.raised, ink: c.label });
    this.graph(ctx, c, t);
    if (this.energyBeat) this.energy(ctx, c, t, front - NOSE);
  }

  road(ctx, c) {
    const tar = mix(c.stroke, c.bgDeep, 0.35);
    ctx.save();
    ctx.fillStyle = tar;
    ctx.fillRect(0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP);
    // kerb on the far edge, a light strip and a shade strip
    ctx.fillStyle = lighten(c.stroke, 0.35);
    ctx.fillRect(0, ROAD_TOP - 6, W, 6);
    ctx.fillStyle = darken(tar, 0.25);
    ctx.fillRect(0, ROAD_TOP, W, 3);
    ctx.fillStyle = darken(tar, 0.3);
    ctx.fillRect(0, ROAD_BOT - 4, W, 4);
    // lane dashes and a little grain
    ctx.fillStyle = alpha(c.gold, 0.85);
    for (let x = 8; x < W; x += 54) ctx.fillRect(x, ROAD_TOP + 14, 28, 4);
    ctx.fillStyle = alpha(lighten(tar, 0.3), 0.35);
    for (let i = 0; i < 70; i++) {
      const x = (i * 97) % W, y = ROAD_TOP + 22 + ((i * 37) % 16);
      ctx.fillRect(x, y, 3, 1.5);
    }
    ctx.restore();
  }

  // Posts at the nose positions of A (0 s), B (1 s) and C (3 s): 35 m apart.
  posts(ctx, c, t) {
    const marks = [['A', 0], ['B', T_REACT], ['C', T_END]];
    for (const [name, at] of marks) {
      const x = FRONT_A + distAt(at) * PX_M;
      const reached = t >= at - 1e-6;
      ctx.save();
      ctx.globalAlpha = reached ? 1 : 0.4;
      ctx.fillStyle = darken(c.stroke, 0.2);
      ctx.fillRect(x - 2.5, POST_Y, 5, ROAD_TOP - POST_Y);
      ctx.fillStyle = lighten(c.stroke, 0.3);
      ctx.fillRect(x - 2.5, POST_Y, 2, ROAD_TOP - POST_Y);
      ctx.restore();
      pill(ctx, c, name, x, POST_Y - 12, { size: 26, bg: reached ? c.s2 : c.raised, ink: reached ? undefined : c.labelMuted });
    }
    // the two stretches: steady for 1 s, braking for 2 s
    const xA = FRONT_A, xB = FRONT_A + distAt(T_REACT) * PX_M, xC = FRONT_A + distAt(T_END) * PX_M;
    for (const [x0, x1, txt, from] of [[xA, xB, '1 s', 0], [xB, xC, '2 s', T_REACT]]) {
      const on = t > from + 1e-6;
      ctx.save();
      ctx.globalAlpha = on ? 0.9 : 0.35;
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(x0 + 28, POST_Y - 12); ctx.lineTo(x1 - 28, POST_Y - 12); ctx.stroke();
      ctx.restore();
      pill(ctx, c, txt, (x0 + x1) / 2, POST_Y - 12, { size: 26, bg: c.raised, ink: on ? c.label : c.labelMuted, alpha: on ? 1 : 0.6 });
    }
  }

  car(ctx, c, x, spin, t) {
    const body = c.s1;
    const braking = t > T_REACT && t < T_END;
    drawShadow(ctx, c, x, ROAD_Y + 2, 120 * CS, 8, 0.8);
    ctx.save();
    ctx.translate(x, ROAD_Y);
    ctx.scale(CS, CS);
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-114, -24);
      ctx.lineTo(-116, -58);
      ctx.quadraticCurveTo(-114, -78, -96, -86);
      ctx.lineTo(-62, -96);
      ctx.lineTo(18, -98);
      ctx.quadraticCurveTo(34, -97, 44, -86);
      ctx.lineTo(66, -62);
      ctx.lineTo(104, -54);
      ctx.quadraticCurveTo(118, -50, 118, -36);
      ctx.lineTo(116, -24);
      ctx.closePath();
    };
    path();
    ctx.lineWidth = 5;
    ctx.strokeStyle = darken(body, 0.45);
    ctx.stroke();
    path();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(-130, -42, 260, 30);
    ctx.fillStyle = lighten(body, 0.28);
    ctx.fillRect(-130, -100, 260, 7);
    ctx.strokeStyle = lighten(body, 0.35);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-112, -50); ctx.lineTo(108, -46); ctx.stroke();
    ctx.restore();
    // windows, a glint, pillars and door lines
    ctx.beginPath();
    ctx.moveTo(-100, -60); ctx.lineTo(-90, -80); ctx.lineTo(-60, -90); ctx.lineTo(16, -91);
    ctx.quadraticCurveTo(28, -90, 36, -82); ctx.lineTo(56, -60); ctx.closePath();
    ctx.fillStyle = mix(c.glass, c.bgDeep, 0.25);
    ctx.fill();
    ctx.strokeStyle = darken(body, 0.45);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.55);
    ctx.beginPath(); ctx.moveTo(10, -88); ctx.lineTo(22, -88); ctx.lineTo(4, -62); ctx.lineTo(-8, -62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(body, 0.35);
    ctx.fillRect(-26, -92, 7, 32);
    ctx.strokeStyle = darken(body, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-24, -60); ctx.lineTo(-26, -26); ctx.moveTo(52, -60); ctx.lineTo(48, -26); ctx.stroke();
    ctx.fillStyle = darken(body, 0.5);
    rr(ctx, -12, -54, 16, 4, 2); ctx.fill();
    rr(ctx, 30, -54, 14, 4, 2); ctx.fill();
    // head lamp; tail lamp lit while braking
    ctx.fillStyle = c.gold;
    ctx.beginPath(); ctx.ellipse(110, -46, 7, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    if (braking) {
      const g = ctx.createRadialGradient(-116, -59, 2, -116, -59, 34);
      g.addColorStop(0, alpha(c.s6, 0.8));
      g.addColorStop(1, alpha(c.s6, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(-116, -59, 34, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = braking ? lighten(c.s6, 0.15) : darken(c.s6, 0.25);
    rr(ctx, -118, -66, 7, 14, 2); ctx.fill();
    ctx.fillStyle = darken(c.stroke, 0.35);
    rr(ctx, -120, -30, 22, 9, 3); ctx.fill();
    rr(ctx, 98, -30, 22, 9, 3); ctx.fill();
    // wheel arches and wheels (spoked rims, no hub "eyes"); the brake disc
    // glows with heat in b1 once the brakes are on
    const heat = this.energyBeat && t > T_REACT ? clamp01((t - T_REACT) / T_BRAKE) : 0;
    for (const wx of [-72, 70]) {
      ctx.beginPath();
      ctx.arc(wx, -24, 27, Math.PI, 0);
      ctx.fillStyle = darken(c.bgDeep, 0.2);
      ctx.fill();
      this.wheel(ctx, c, wx, -24, 23, spin, heat);
    }
    ctx.restore();
  }

  wheel(ctx, c, x, y, r, spin, heat) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.stroke, 0.55); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = heat > 0 ? mix(lighten(c.stroke, 0.35), c.s8, 0.75 * heat) : lighten(c.stroke, 0.35);
    ctx.fill();
    ctx.beginPath(); ctx.arc(x + 1.5, y + 1.5, r * 0.62, -0.2, Math.PI * 0.9);
    ctx.strokeStyle = darken(c.stroke, 0.1); ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = darken(c.stroke, 0.3);
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const a = spin + (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3);
      ctx.lineTo(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58);
      ctx.stroke();
    }
  }

  graph(ctx, c, t) {
    const X = (s) => OX + s * PX_S, Y = (v) => OY - v * PX_V;
    ctx.save();
    // the card
    rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 14);
    ctx.fillStyle = c.bgSurface;
    ctx.fill();
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.25);
    ctx.lineWidth = 2;
    ctx.stroke();
    // grid: 0.5 s and 5 m/s
    ctx.strokeStyle = alpha(c.s5, 0.16);
    ctx.lineWidth = 1;
    for (let s = 0.5; s <= T_END + 0.5; s += 0.5) { ctx.beginPath(); ctx.moveTo(X(s), Y(0)); ctx.lineTo(X(s), Y(40)); ctx.stroke(); }
    for (let v = 5; v <= 40; v += 5) { ctx.beginPath(); ctx.moveTo(X(0), Y(v)); ctx.lineTo(X(T_END + 0.5), Y(v)); ctx.stroke(); }
    // axes
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(X(0), Y(42)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(T_END + 0.6), Y(0)); ctx.stroke();
    ctx.font = font(c, 700, 26, true);
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let s = 0; s <= T_END; s++) ctx.fillText(String(s), X(s), Y(0) + 6);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('35', X(0) - 10, Y(V0));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('time (s)', X(1.5), Y(0) + 34);
    ctx.save();
    ctx.translate(CARD.x + 26, Y(V0 / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('speed (m/s)', 0, 0);
    ctx.restore();
    // the dashed drop at B, as in the book
    if (t >= T_REACT) {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = alpha(c.label, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(T_REACT), Y(V0)); ctx.lineTo(X(T_REACT), Y(0)); ctx.stroke();
      ctx.setLineDash([]);
    }
    // the trace, drawn as far as the run has gone
    ctx.strokeStyle = c.s1;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(X(0), Y(V0));
    ctx.lineTo(X(Math.min(t, T_REACT)), Y(V0));
    if (t > T_REACT) ctx.lineTo(X(t), Y(speedAt(t)));
    ctx.stroke();
    ctx.restore();
    // the pen
    ctx.save();
    ctx.beginPath(); ctx.arc(X(t), Y(speedAt(t)), 8, 0, Math.PI * 2);
    ctx.fillStyle = c.s1; ctx.fill();
    ctx.strokeStyle = darken(c.s1, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // the three points, each named once the pen reaches it
    const pts = [['A', 0, V0, 22, -30], ['B', T_REACT, V0, 0, -30], ['C', T_END, 0, 22, -30]];
    for (const [name, s, v, dx, dy] of pts) {
      if (t < s - 1e-6) continue;
      ctx.save();
      ctx.beginPath(); ctx.arc(X(s), Y(v), 6, 0, Math.PI * 2);
      ctx.fillStyle = c.label; ctx.fill();
      ctx.restore();
      pill(ctx, c, name, X(s) + dx, Y(v) + dy, { size: 26, bg: c.s2 });
    }
  }

  // b1: K holds from A to B, then drains into heat and sound as K = 1/2 m v^2.
  energy(ctx, c, t, carX) {
    const v = speedAt(t);
    const k = 0.5 * MASS * v * v;
    const fade = clamp01((this.runT ?? 0) / 0.4);
    drawEnergyBars(ctx, c, {
      x: BAR_X, y: BAR_Y, h: BAR_H, max: K0, total: K0, size: 24, minSize: 24, alpha: fade,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'heat', label: 'heat and sound', tone: 8 }],
      values: { K: k, heat: K0 - k },
    });
    // the one number for both bars: the total line
    pill(ctx, c, fmtJ(K0), BAR_X + 82, BAR_Y - 14, { size: 24, bg: c.raised, ink: c.label, alpha: fade });
    // the brakes' work, once they are on
    if (t > T_REACT) {
      const a = clamp01((t - T_REACT) / 0.5);
      ctx.save();
      ctx.globalAlpha = a;
      drawWorkCounter(ctx, c, { x: 560, y: 30, text: `W = ${fmtJ(-K0)}`, size: 24 });
      ctx.restore();
      // heat shimmer over both wheels and a squeal ring, while braking
      const on = t < T_END ? 1 : 0.35;
      ctx.save();
      ctx.strokeStyle = alpha(c.s8, 0.75 * on);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const rt = this.runT ?? 0;
      for (const wx of [-72 * CS, 70 * CS]) {
        for (let j = 0; j < 2; j++) {
          const ph = (rt * 1.5 + j * 0.5) % 1;
          const y0 = ROAD_Y - 24 * CS - 30 - ph * 18;
          ctx.globalAlpha = (1 - ph) * a;
          ctx.beginPath();
          ctx.moveTo(carX + wx - 6, y0 + 10);
          ctx.bezierCurveTo(carX + wx - 12, y0 + 4, carX + wx + 2, y0 - 2, carX + wx - 4, y0 - 10);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
