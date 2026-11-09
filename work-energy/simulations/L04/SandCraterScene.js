import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, font, alpha, lighten, darken, mix, mulberry32, clamp01, lerp,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// Book Activity 7.1 (Fig 7.17): a heavy ball dropped into a tray of loose sand,
// first from about 1 m, then from 2 m at a different spot. The tray is drawn as
// a cut section so the two dents show their depth; the book says only that the
// 2 m dent is deeper, so the depths are not in proportion to the heights.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // drop from 1 m, then from 2 m: two dents
  [{ idx: 1, dwellMs: null }], // the ball lifted to each height again: U bars
];

const GROUND = 470;
const TX0 = 34;
const TX1 = 646;
const WALL = 20;
const SURF = 356; // the sand's level, and 0 on the height staff
const RIM = SURF - 30; // top of the tray walls
const FLOOR_IN = 446; // inside floor of the tray
const BOT = 462; // tray underside (sits on two runners)
const BACK = SURF - 16; // the far edge of the sand top, seen from a little above
const M_PX = 100; // px per metre on the staff
const R = 25; // ball radius
const STAFF_X = 96;
const X1 = 262; // the 1 m drop
const X2 = 452; // the 2 m drop
const D1 = 15; // dent depth from 1 m (px)
const D2 = 27; // dent depth from 2 m: deeper, not in proportion
const SEC = (h) => 0.42 * Math.sqrt(h); // fall time on screen, t ~ sqrt(h)

// b0 timeline (s)
const T_FALL1 = 0.55;
const T_HIT1 = T_FALL1 + SEC(1);
const T_LIFT0 = T_HIT1 + 0.55;
const T_LIFT1 = T_LIFT0 + 1.0;
const T_FALL2 = T_LIFT1 + 0.35;
const T_HIT2 = T_FALL2 + SEC(2);
const T_MARK = T_HIT2 + 0.45;
const END0 = T_MARK + 0.5;
const DIG = 0.22; // dent opening time

// b1 timeline: each ball lifted again at one speed, so 2 m takes twice as long
const LIFT_V = 1.6; // m/s on screen
const B1_0 = 0.4;
const B1_1 = B1_0 + 1 / LIFT_V;
const B1_2 = B1_1 + 0.3;
const B1_3 = B1_2 + 2 / LIFT_V;
const END1 = B1_3 + 0.4;

const GRAINS = (() => {
  const r = mulberry32(17);
  return Array.from({ length: 420 }, () => ({
    x: TX0 + WALL + r() * (TX1 - TX0 - 2 * WALL), y: SURF - 4 + r() * (FLOOR_IN - SURF + 4),
    r: 0.9 + r() * 1.6, k: r(),
  }));
})();
const TOP_GRAINS = (() => {
  const r = mulberry32(5);
  return Array.from({ length: 160 }, () => ({ x: TX0 + WALL + r() * (TX1 - TX0 - 2 * WALL), v: r(), r: 0.8 + r() * 1.2, k: r() }));
})();
const SPRAY = (() => {
  const r = mulberry32(23);
  return Array.from({ length: 14 }, () => ({ dx: (r() * 2 - 1), up: 0.5 + r(), s: 1 + r() * 2 }));
})();

const easeIn = (u) => u * u;
const smooth = (u) => u * u * (3 - 2 * u);

export class SandCraterScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A tray of loose sand seen in section beside a height staff. A heavy ball dropped from 1 m makes a dent; dropped again from 2 m at another spot it makes a deeper dent. Then the ball is shown lifted to each height with a potential energy bar beside it, the 2 m bar twice as tall.';
  static NOTE_STAGE = -1;
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() {
    this.sandT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.sandT0 = this.age;
      this.animateFor?.(200);
    }
  }

  busy() {
    return this.t() < (this.stage === 0 ? END0 : END1);
  }

  // scene time inside the beat (snaps to rest under reduced motion)
  t() {
    if (reducedMotion()) return 99;
    return this.age - (this.sandT0 || 0);
  }

  // b0 state: where the ball is and how far each dent has opened
  b0(t) {
    const d1 = clamp01((t - T_HIT1) / DIG);
    const d2 = clamp01((t - T_HIT2) / DIG);
    const top1 = SURF - 1 * M_PX - R;
    const top2 = SURF - 2 * M_PX - R;
    const rest1 = SURF + D1 - R;
    const rest2 = SURF + D2 - R;
    let x = X1;
    let y = top1;
    let held = 1;
    let land = 0;
    if (t < T_FALL1) { held = 1; } else if (t < T_HIT1) {
      held = 0; y = lerp(top1, rest1 - D1 * 0.6, easeIn((t - T_FALL1) / SEC(1)));
    } else if (t < T_LIFT0) {
      held = 0; land = 1; y = lerp(rest1 - D1 * 0.6, rest1, d1);
    } else if (t < T_LIFT1) {
      const u = smooth((t - T_LIFT0) / (T_LIFT1 - T_LIFT0));
      held = u;
      const up = smooth(clamp01(u / 0.6));
      const across = smooth(clamp01((u - 0.3) / 0.7));
      x = lerp(X1, X2, across);
      y = lerp(rest1, top2, up);
    } else if (t < T_FALL2) { x = X2; y = top2; held = 1; } else if (t < T_HIT2) {
      x = X2; held = 0; y = lerp(top2, rest2 - D2 * 0.6, easeIn((t - T_FALL2) / SEC(2)));
    } else {
      x = X2; held = 0; land = 2; y = lerp(rest2 - D2 * 0.6, rest2, d2);
    }
    const falling = (t >= T_FALL1 && t < T_HIT1) || (t >= T_FALL2 && t < T_HIT2);
    const hRef = x === X1 && t < T_LIFT0 ? 1 : (t >= T_LIFT0 && t < T_LIFT1 ? 0 : 2);
    return {
      ball: { x, y }, held, falling, hRef,
      dents: [{ x: X1, d: D1 * d1, age: t - T_HIT1 }, { x: X2, d: D2 * d2, age: t - T_HIT2 }],
      mark: clamp01((t - T_MARK) / 0.45),
    };
  }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    const sandCol = mix(c.gold, c.bgSurface, 0.32);
    const st = this.stage === 0 ? this.b0(t) : null;
    const dents = st ? st.dents : [{ x: X1, d: D1 }, { x: X2, d: D2 }];
    this.staff(ctx, c, st);
    this.trayBack(ctx, c);
    this.sand(ctx, c, sandCol, dents);
    this.trayFront(ctx, c);
    if (st) {
      if (st.ball.y + R < SURF - 6) drawShadow(ctx, c, st.ball.x, BACK + 6, R * 0.9, 4, 0.5 * clamp01(1 - (SURF - st.ball.y) / 300) + 0.15);
      if (st.held > 0.5 && !st.falling && st.hRef) this.guide(ctx, c, st.ball.x, st.ball.y + R, st.hRef);
      this.ball(ctx, c, st.ball.x, st.ball.y, 1, st.falling);
      for (const d of dents) this.spray(ctx, c, d, sandCol);
      if (st.mark > 0) dents.forEach((d) => this.marker(ctx, c, d, st.mark));
    } else {
      dents.forEach((d) => this.marker(ctx, c, d, 1));
      this.lifts(ctx, c, t);
    }
  }

  // -- the height staff ---------------------------------------------------

  staff(ctx, c, st) {
    const top = SURF - 2.25 * M_PX;
    const x = STAFF_X;
    const wood = mix(c.gold, c.bgDeep, 0.2);
    ctx.fillStyle = darken(wood, 0.35);
    ctx.fillRect(x - 8, top - 2, 16, SURF - top + 14);
    ctx.fillStyle = wood;
    ctx.fillRect(x - 6, top, 12, SURF - top + 12);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(x - 6, top, 3, SURF - top + 12);
    ctx.fillStyle = darken(wood, 0.18);
    ctx.fillRect(x + 2, top, 4, SURF - top + 12);
    // bands every half metre, ticks every 10 cm
    for (let i = 0; i <= 22; i++) {
      const y = SURF - i * M_PX / 10;
      const big = i % 5 === 0;
      ctx.fillStyle = alpha(c.bgDeep, big ? 0.9 : 0.55);
      ctx.fillRect(x - 6, y - 1, big ? 12 : 6, 2);
    }
    ctx.font = font(c, 700, 26, true);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const m of [1, 2]) {
      const y = SURF - m * M_PX;
      const lit = !st || st.hRef === m;
      ctx.fillStyle = lit ? c.label : alpha(c.labelMuted, 0.8);
      ctx.fillText(`${m} m`, x - 14, y);
    }
  }

  guide(ctx, c, x, yBottom, m) {
    const y = SURF - m * M_PX;
    ctx.save();
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = alpha(c.label, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(STAFF_X + 10, y);
    ctx.lineTo(x - R - 4, Math.min(y, yBottom));
    ctx.stroke();
    ctx.restore();
  }

  // -- the tray -------------------------------------------------------------

  wood() {
    const c = this.colors;
    return darken(mix(c.flame, c.gold, 0.35), 0.38);
  }

  trayBack(ctx, c) {
    const wd = this.wood();
    // the inside of the far wall, in shade
    ctx.fillStyle = darken(wd, 0.3);
    ctx.fillRect(TX0 + WALL, RIM, TX1 - TX0 - 2 * WALL, BACK - RIM + 2);
    ctx.fillStyle = alpha(c.bgDeep, 0.25);
    ctx.fillRect(TX0 + WALL, BACK - 6, TX1 - TX0 - 2 * WALL, 8);
    ctx.fillStyle = lighten(wd, 0.25);
    ctx.fillRect(TX0 + WALL, RIM, TX1 - TX0 - 2 * WALL, 3);
  }

  surfaceY(x, dents) {
    let y = SURF;
    for (const d of dents) {
      if (d.d <= 0.2) continue;
      const cy = SURF + d.d - R;
      const dx = x - d.x;
      const half = Math.sqrt(Math.max(0, R * R - (R - d.d) * (R - d.d)));
      if (Math.abs(dx) < half) y = Math.max(y, cy + Math.sqrt(R * R - dx * dx));
      const lipW = 9 + d.d * 0.5;
      const o = Math.abs(dx) - half;
      if (o >= 0 && o < lipW) y -= (2 + d.d * 0.16) * Math.sin(Math.PI * o / lipW);
    }
    return y;
  }

  sand(ctx, c, col, dents) {
    const x0 = TX0 + WALL;
    const x1 = TX1 - WALL;
    // the sand top, seen from a little above: lit, with the dents as hollows
    ctx.beginPath();
    ctx.moveTo(x0, BACK);
    ctx.lineTo(x1, BACK);
    ctx.lineTo(x1, SURF);
    for (let x = x1; x >= x0; x -= 2) ctx.lineTo(x, this.surfaceY(x, dents));
    ctx.closePath();
    ctx.fillStyle = lighten(col, 0.22);
    ctx.fill();
    for (const g of TOP_GRAINS) {
      ctx.fillStyle = alpha(g.k < 0.5 ? darken(col, 0.25) : lighten(col, 0.45), 0.55);
      ctx.fillRect(g.x, BACK + 2 + g.v * (SURF - BACK - 4), g.r, g.r);
    }
    for (const d of dents) {
      if (d.d <= 0.2) continue;
      const half = Math.sqrt(Math.max(0, R * R - (R - d.d) * (R - d.d)));
      const ry = (SURF - BACK) * 0.42;
      ctx.beginPath();
      ctx.ellipse(d.x, SURF - ry - 1, half + 2, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = darken(col, 0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(d.x + half * 0.25, SURF - ry, half * 0.7, ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = darken(col, 0.12);
      ctx.fill();
    }
    // the cut face of the sand bed
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, FLOOR_IN);
    for (let x = x0; x <= x1; x += 2) ctx.lineTo(x, this.surfaceY(x, dents));
    ctx.lineTo(x1, FLOOR_IN);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, SURF, 0, FLOOR_IN);
    g.addColorStop(0, col);
    g.addColorStop(1, darken(col, 0.3));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    for (const gr of GRAINS) {
      ctx.fillStyle = alpha(gr.k < 0.45 ? darken(col, 0.35) : gr.k < 0.8 ? lighten(col, 0.3) : mix(col, c.flame, 0.4), 0.6);
      ctx.beginPath();
      ctx.arc(gr.x, gr.y, gr.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // packed sand under each dent: a darker squeezed layer
    for (const d of dents) {
      if (d.d <= 0.2) continue;
      ctx.beginPath();
      ctx.ellipse(d.x, SURF + d.d - 2, R * 1.15, 6 + d.d * 0.35, 0, 0, Math.PI);
      ctx.fillStyle = alpha(darken(col, 0.4), 0.35);
      ctx.fill();
    }
    ctx.restore();
    // a lit edge along the cut surface line
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 2) {
      const y = this.surfaceY(x, dents);
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = darken(col, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  trayFront(ctx, c) {
    const wd = this.wood();
    const side = (x, w, lit) => {
      ctx.fillStyle = darken(wd, 0.3);
      ctx.fillRect(x - 1, RIM - 1, w + 2, BOT - RIM + 2);
      ctx.fillStyle = wd;
      ctx.fillRect(x, RIM, w, BOT - RIM);
      ctx.fillStyle = lit ? lighten(wd, 0.28) : darken(wd, 0.15);
      ctx.fillRect(lit ? x : x + w * 0.55, RIM, w * 0.45, BOT - RIM);
      ctx.strokeStyle = alpha(darken(wd, 0.4), 0.6);
      ctx.lineWidth = 1.2;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (w * i) / 3, RIM + 8);
        ctx.bezierCurveTo(x + (w * i) / 3 + 3, RIM + 50, x + (w * i) / 3 - 3, BOT - 50, x + (w * i) / 3, BOT - 6);
        ctx.stroke();
      }
    };
    side(TX0, WALL, true);
    side(TX1 - WALL, WALL, false);
    // the floor board, cut too
    ctx.fillStyle = darken(wd, 0.3);
    ctx.fillRect(TX0 - 1, FLOOR_IN - 1, TX1 - TX0 + 2, BOT - FLOOR_IN + 2);
    ctx.fillStyle = wd;
    ctx.fillRect(TX0, FLOOR_IN, TX1 - TX0, BOT - FLOOR_IN);
    ctx.fillStyle = lighten(wd, 0.25);
    ctx.fillRect(TX0, FLOOR_IN, TX1 - TX0, 3);
    ctx.fillStyle = darken(wd, 0.4);
    ctx.fillRect(TX0 + 30, BOT, 40, GROUND - BOT);
    ctx.fillRect(TX1 - 70, BOT, 40, GROUND - BOT);
    ctx.fillStyle = lighten(wd, 0.3);
    ctx.fillRect(TX0, RIM, TX1 - TX0, 0);
  }

  // -- the ball -------------------------------------------------------------

  ball(ctx, c, x, y, a, falling) {
    const body = mix(c.s6, c.bgDeep, 0.12);
    ctx.save();
    ctx.globalAlpha *= a;
    if (falling) {
      ctx.strokeStyle = alpha(c.label, 0.28);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const k of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(x + k * R, y - R * 1.1);
        ctx.lineTo(x + k * R, y - R * (k === 0 ? 2.6 : 1.9));
        ctx.stroke();
      }
    }
    // clip to above the sand line where it is sunk
    ctx.beginPath();
    ctx.arc(x, y, R + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.4);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(x + R * 0.45, y + R * 0.4, R * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - R * 0.38, y - R * 0.42, R * 0.38, R * 0.24, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = alpha(lighten(body, 0.6), 0.85);
    ctx.fill();
    ctx.restore();
    // a rubber seam line, so it reads as a heavy ball and not a dot
    ctx.beginPath();
    ctx.arc(x, y, R * 0.72, -2.4, -0.7);
    ctx.strokeStyle = alpha(darken(body, 0.45), 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  spray(ctx, c, d, col) {
    if (d.age == null || d.age < 0 || d.age > 0.55 || reducedMotion()) return;
    const u = d.age / 0.55;
    for (const s of SPRAY) {
      const px = d.x + s.dx * (R + 30 * u);
      const py = SURF - s.up * 60 * u * (1 - u) * 2.2;
      ctx.fillStyle = alpha(lighten(col, 0.2), 1 - u);
      ctx.fillRect(px, py, s.s + 1, s.s + 1);
    }
  }

  // a depth marker: a bracket from the sand level down to the dent's bottom
  marker(ctx, c, d, a) {
    if (d.d <= 0.5) return;
    const half = Math.sqrt(Math.max(0, R * R - (R - d.d) * (R - d.d)));
    const bx = d.x + half + 34;
    const yb = SURF + d.d;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(d.x, yb);
    ctx.lineTo(bx + 8, yb);
    ctx.moveTo(d.x + half + 10, SURF);
    ctx.lineTo(bx + 8, SURF);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(bx, SURF);
    ctx.lineTo(bx, yb);
    ctx.moveTo(bx - 7, SURF);
    ctx.lineTo(bx + 7, SURF);
    ctx.moveTo(bx - 7, yb);
    ctx.lineTo(bx + 7, yb);
    ctx.stroke();
    ctx.restore();
  }

  // -- b1: the same ball lifted to each height, a U bar beside each ----------

  lifts(ctx, c, t) {
    const u1 = smooth(clamp01((t - B1_0) / (B1_1 - B1_0)));
    const u2 = smooth(clamp01((t - B1_2) / (B1_3 - B1_2)));
    const cases = [
      { x: X1, m: 1, u: u1, d: D1 },
      { x: X2, m: 2, u: u2, d: D2 },
    ];
    for (const k of cases) {
      const y0 = SURF + k.d - R;
      const yTop = SURF - k.m * M_PX - R;
      const y = lerp(y0, yTop, k.u);
      // the lift path, dashed (a displacement)
      if (k.u > 0) {
        displacementArrow(ctx, c, k.x, SURF - 4, k.x, y + R + 4, { alpha: 0.85 });
        this.guide(ctx, c, k.x, y + R, k.m);
        this.ball(ctx, c, k.x, y, 0.5 + 0.5 * k.u, false);
      }
      const b = drawEnergyBars(ctx, c, {
        x: k.x + 42, y: 172, h: 76, panel: true, max: 2,
        bars: [{ id: 'U', label: 'U', tone: 3 }],
        values: barsAt({ U: 0 }, { U: k.m }, k.u),
      });
      void b;
    }
  }
}
