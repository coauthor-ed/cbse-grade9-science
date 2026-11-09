import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, alpha, lighten, darken, mix, rr, mulberry32, clamp01,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// CarLaunchPowerScene - blk-l06-s06, A Car Starts (book Example 7.11), 2 beats.
//   b0 a 1000 kg car speeds up from rest to 20 m/s in 10 s (shown in 3 s);
//      the clock, its speed and its K bar grow together, K = 1/2 m v^2,
//      ending at 200 000 J.
//   b1 the same car still going at 20 m/s; the K bar splits into 10 equal
//      slices as the stopwatch ticks 1 s at a time: 20 000 J each second,
//      P = 20 000 W. The division is shown, not written out again.
const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const MASS = 1000;
const T_END = 10; // s, real
const V_END = 20; // m/s
const K_END = 0.5 * MASS * V_END * V_END; // 200 000 J
const RUN = 3.0; // s on screen for the 10 s run
const R0 = 0.4; // run starts
const ROAD = 452; // tyre contact line
const X0 = 176; // car centre at rest
const X1 = 418; // car centre at 20 m/s
const BARS = { x: 548, y: 46, h: 200 };
const CLOCK = { x: 300, y: 92 };
const CS = 1.3; // the car's drawing scale

const SKY = (() => {
  const r = mulberry32(17);
  return Array.from({ length: 9 }, (_, i) => ({ x: i * 82 + r() * 30, w: 44 + r() * 40, h: 40 + r() * 70 }));
})();

const smooth = (u) => u * u * (3 - 2 * u);
const SLICE0 = 0.2, SLICE_S = 0.36; // b1: one slice (one second) every 0.36 s
const P_AT = SLICE0 + 10 * SLICE_S + 0.05;
// 200000 -> "200 000"
const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const DIV = String.fromCharCode(247);

export class CarLaunchPowerScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A 1000 kg car on a road speeds up from rest to 20 m/s in 10 s. As the clock runs, its kinetic energy bar K fills to 200 000 J. Then 200 000 J divided by 10 s gives a power of 20 000 W.';
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
    return this.t() < (this.stage === 0 ? R0 + RUN + 0.5 : P_AT + 0.45);
  }

  draw(ctx, c) {
    const t = this.t();
    const s = this.stage;
    // u: 0..1 through the real 10 s
    const u = s === 0 ? clamp01((t - R0) / RUN) : 1;
    const tReal = T_END * u;
    const v = V_END * u; // uniform speeding up: v grows with t
    const vShow = Math.round(v);
    const kShow = 0.5 * MASS * vShow * vShow;
    const x = X0 + (X1 - X0) * u * u; // distance grows with t^2
    const dist = (X1 - X0) * u * u;

    this.scenery(ctx, c);
    this.road(ctx, c, dist);
    // at 20 m/s the car is still going: speed lines stay behind it at rest
    if (u > 0.12) this.streaks(ctx, c, x, u);
    this.car(ctx, c, x, dist / 24, s === 0 && u > 0 && u < 1, u);
    // the speed rides above the roof, clear of it
    if (s === 0) pill(ctx, c, `v = ${vShow} m/s`, x, ROAD - 98 * CS - 40, { size: 26, bg: c.raised, ink: c.label });

    // the clock: b1 ticks it again, one second per slice of the K bar
    const ticks = s === 1 ? this.slices(t) : null;
    this.drawWatch(ctx, c, s === 0 ? tReal : ticks, 1);

    // the K bar
    const kVal = s === 0 ? 0.5 * MASS * v * v : K_END;
    const eb = drawEnergyBars(ctx, c, {
      x: BARS.x, y: BARS.y, h: BARS.h, max: K_END, barW: 58, size: 26, minSize: 26,
      bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: kVal },
    });
    const top = eb?.bars?.[0]?.top ?? { x: BARS.x + 40, y: BARS.y + 20 };
    const bx = (eb?.bars?.[0]?.x ?? BARS.x) + (eb?.bars?.[0]?.w ?? 58) / 2;
    if (s === 0) {
      pill(ctx, c, `${grp(kShow)} J`, BARS.x - 8, Math.max(BARS.y + 22, top.y), { size: 26, bg: c.s1, align: 'right' });
    } else {
      this.power(ctx, c, t, eb);
    }
  }

  // b1: how many one-second slices are counted at time t (0..10)
  slices(t) {
    return Math.max(0, Math.min(10, Math.floor((t - SLICE0) / SLICE_S) + 1));
  }

  // -- b1: the K bar cut into 10 equal slices, one per second ------------------
  power(ctx, c, t, eb) {
    const bar = eb?.bars?.[0];
    if (!bar) return;
    const n = this.slices(t);
    const base = (eb.baseY ?? (bar.top.y + BARS.h)) - 3;
    const sh = (base - bar.top.y) / 10;
    ctx.save();
    // the slices counted so far: a seam above each, the newest one lit
    for (let k = 1; k <= n; k++) {
      const y = base - k * sh;
      if (k === n && n < 10) {
        const f = clamp01((t - SLICE0 - (k - 1) * SLICE_S) / SLICE_S);
        ctx.fillStyle = alpha(c.raised, 0.45 * (1 - f * 0.6));
        ctx.fillRect(bar.x + 2, y + 1, bar.w - 4, sh - 2);
      }
      ctx.strokeStyle = alpha(c.raised, 0.95);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bar.x + 1, y); ctx.lineTo(bar.x + bar.w - 1, y); ctx.stroke();
    }
    ctx.restore();
    if (n > 0) {
      // one slice = the work in one second; the label rides with the newest slice
      const k = Math.min(n, 10);
      const y = base - (k - 0.5) * sh;
      pill(ctx, c, '20 000 J', BARS.x - 8, y, { size: 24, bg: c.s1, align: 'right' });
      ctx.save();
      ctx.strokeStyle = alpha(c.s1, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BARS.x - 6, y); ctx.lineTo(bar.x - 2, y); ctx.stroke();
      ctx.restore();
    }
    const a3 = clamp01((t - P_AT) / 0.3);
    if (a3 > 0) {
      pill(ctx, c, 'P = 20 000 W', 300, 238, { size: 38, bg: c.accent, scale: 0.85 + 0.15 * a3, alpha: a3 });
    }
  }

  // -- the world ---------------------------------------------------------------
  scenery(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    // far town: a row of low blocks with a lit and a shade face
    const base = 392;
    const far = mix(c.stroke, c.bgDeep, 0.35);
    for (const b of SKY) {
      ctx.fillStyle = far;
      ctx.fillRect(b.x, base - b.h, b.w, b.h);
      ctx.fillStyle = darken(far, 0.18);
      ctx.fillRect(b.x + b.w * 0.68, base - b.h, b.w * 0.32, b.h);
      ctx.fillStyle = lighten(far, 0.12);
      ctx.fillRect(b.x, base - b.h, 3, b.h);
      ctx.fillStyle = alpha(c.gold, 0.35);
      for (let wy = base - b.h + 12; wy < base - 12; wy += 18) {
        for (let wx = b.x + 8; wx < b.x + b.w * 0.62; wx += 14) ctx.fillRect(wx, wy, 6, 8);
      }
    }
    // verge
    const verge = mix(c.s3, c.bgDeep, 0.45);
    ctx.fillStyle = verge;
    ctx.fillRect(0, base, W, 18);
    ctx.fillStyle = lighten(verge, 0.15);
    ctx.fillRect(0, base, W, 3);
  }

  road(ctx, c, dist = 0) {
    const top = 410;
    const asph = mix(c.stroke, c.bgDeep, 0.25);
    ctx.fillStyle = darken(asph, 0.1);
    ctx.fillRect(0, top, W, H - top);
    const g = ctx.createLinearGradient(0, top, 0, 500);
    g.addColorStop(0, lighten(asph, 0.12));
    g.addColorStop(1, darken(asph, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, 90);
    // kerb stones, alternating
    for (let x = 0; x < W; x += 34) {
      ctx.fillStyle = (x / 34) % 2 ? lighten(c.stroke, 0.45) : darken(c.gold, 0.05);
      ctx.fillRect(x, top - 2, 34, 8);
    }
    ctx.fillStyle = darken(asph, 0.3);
    ctx.fillRect(0, top + 6, W, 2);
    // lane dashes: they slide back under the car as it runs (the road moves past it)
    const off = ((dist * 0.6) % 76 + 76) % 76;
    ctx.fillStyle = alpha(c.label, 0.55);
    for (let x = 8 - off; x < W; x += 76) rr(ctx, x, 478, 40, 5, 2), ctx.fill();
    // a kerb strip at the front edge
    ctx.fillStyle = darken(asph, 0.35);
    ctx.fillRect(0, 500, W, H - 500);
  }

  streaks(ctx, c, x, u) {
    const k = clamp01((u - 0.12) / 0.5);
    // air lines off the roof, the tail and the sill, longest at the middle
    const rows = [[-108, 70], [-84, 118], [-60, 96], [-34, 62]];
    for (let i = 0; i < rows.length; i++) {
      const [dy, l] = rows[i];
      const len = l * k;
      rr(ctx, x - 158 - len, ROAD + dy, len, 5, 2.5);
      ctx.fillStyle = alpha(c.label, 0.5 - i * 0.06);
      ctx.fill();
    }
    // a puff of dust thrown back by the rear tyre
    ctx.fillStyle = alpha(c.labelMuted, 0.22 * k);
    for (const [dx, dy, r] of [[-128, -8, 9], [-146, -14, 7], [-160, -6, 6]]) {
      ctx.beginPath(); ctx.arc(x + dx, ROAD + dy, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // a hatchback, side on, facing right; (x, ROAD) is the middle of the tyre line
  car(ctx, c, x, spin, moving, speedU = 0) {
    const body = c.s1;
    drawShadow(ctx, c, x, ROAD + 2, 120 * CS, 10, 0.7);
    ctx.save();
    ctx.translate(x, ROAD);
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
    // rim
    ctx.save();
    ctx.translate(0, 0);
    path();
    ctx.lineWidth = 5;
    ctx.strokeStyle = darken(body, 0.45);
    ctx.stroke();
    ctx.restore();
    path();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    // shade: the lower body, light: the roof line
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(-130, -42, 260, 30);
    ctx.fillStyle = lighten(body, 0.28);
    ctx.fillRect(-130, -100, 260, 7);
    // a crease along the side
    ctx.strokeStyle = lighten(body, 0.35);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-112, -50);
    ctx.lineTo(108, -46);
    ctx.stroke();
    ctx.restore();
    // windows
    const glass = mix(c.glass, c.bgDeep, 0.25);
    ctx.beginPath();
    ctx.moveTo(-100, -60);
    ctx.lineTo(-90, -80);
    ctx.lineTo(-60, -90);
    ctx.lineTo(16, -91);
    ctx.quadraticCurveTo(28, -90, 36, -82);
    ctx.lineTo(56, -60);
    ctx.closePath();
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = darken(body, 0.45);
    ctx.lineWidth = 2;
    ctx.stroke();
    // a glint on the glass
    ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.55);
    ctx.beginPath();
    ctx.moveTo(10, -88);
    ctx.lineTo(22, -88);
    ctx.lineTo(4, -62);
    ctx.lineTo(-8, -62);
    ctx.closePath();
    ctx.fill();
    // pillars and door lines
    ctx.fillStyle = darken(body, 0.35);
    ctx.fillRect(-26, -92, 7, 32);
    ctx.strokeStyle = darken(body, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, -60);
    ctx.lineTo(-26, -26);
    ctx.moveTo(52, -60);
    ctx.lineTo(48, -26);
    ctx.stroke();
    ctx.fillStyle = darken(body, 0.5);
    rr(ctx, -12, -54, 16, 4, 2);
    ctx.fill();
    rr(ctx, 30, -54, 14, 4, 2);
    ctx.fill();
    // lamps and bumpers
    ctx.fillStyle = moving ? c.gold : mix(c.gold, c.bgDeep, 0.3);
    ctx.beginPath();
    ctx.ellipse(110, -46, 7, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.s6;
    rr(ctx, -118, -66, 7, 14, 2);
    ctx.fill();
    ctx.fillStyle = darken(c.stroke, 0.35);
    rr(ctx, -120, -30, 22, 9, 3);
    ctx.fill();
    rr(ctx, 98, -30, 22, 9, 3);
    ctx.fill();
    // wheel arches and wheels
    for (const wx of [-72, 70]) {
      ctx.beginPath();
      ctx.arc(wx, -24, 27, Math.PI, 0);
      ctx.fillStyle = darken(c.bgDeep, 0.2);
      ctx.fill();
      this.wheel(ctx, c, wx, -24, 23, spin, speedU > 0.5);
    }
    ctx.restore();
    // the mass, on the door
    pill(ctx, c, `${MASS} kg`, x, ROAD + 34, { size: 26, bg: c.raised, ink: c.label });
  }

  wheel(ctx, c, x, y, r, spin, fast) {
    const tyre = darken(c.stroke, 0.55);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = tyre;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = lighten(c.stroke, 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 1.5, y + 1.5, r * 0.62, -0.2, Math.PI * 0.9);
    ctx.strokeStyle = darken(c.stroke, 0.1);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = darken(c.stroke, 0.3);
    ctx.lineWidth = 3;
    // at speed the spokes blur: faint copies smeared round the hub
    const smear = fast ? [0, 0.22, 0.44] : [0];
    for (const da of smear) for (let i = 0; i < 5; i++) {
      const a = spin + da + (i * Math.PI * 2) / 5;
      ctx.globalAlpha = da ? 0.35 : 1;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
      ctx.lineTo(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (fast) {
      ctx.strokeStyle = alpha(lighten(c.stroke, 0.5), 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r * 0.82, Math.PI * 0.9, Math.PI * 1.6); ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.stroke, 0.45);
    ctx.fill();
  }

  // a stopwatch: the hand goes once round for the 10 s run
  drawWatch(ctx, c, tReal, a) {
    const { x, y } = CLOCK;
    const r = 46;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = darken(c.stroke, 0.2);
    rr(ctx, x - 7, y - r - 12, 14, 10, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.stroke, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = c.raised;
    ctx.fill();
    // the swept part
    const k = clamp01(tReal / T_END);
    if (k > 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = alpha(c.gold, 0.45);
      ctx.fill();
    }
    ctx.strokeStyle = c.labelMuted;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(an) * (r - 7), y + Math.sin(an) * (r - 7));
      ctx.lineTo(x + Math.cos(an) * (r - 2), y + Math.sin(an) * (r - 2));
      ctx.stroke();
    }
    const an = -Math.PI / 2 + k * Math.PI * 2;
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(an) * (r - 8), y + Math.sin(an) * (r - 8));
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, `t = ${Math.round(tReal)} s`, x, y + 76, { size: 26, bg: c.gold, alpha: a });
  }
}
