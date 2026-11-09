import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, chipSize, font, inOutSine, clamp01,
  mix, alpha, lighten, darken, rr, vectorArrow, outBack,
} from 'simulations/base/kit/SimLook.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';
import { drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// InclinedPlaneMAScene - blk-l07-s07, Mechanical Advantage of a Ramp (book Fig 7.28).
// One 600 N load (m = 60 kg) raised to one height h = 1 m up three smooth ramps,
// one per row at one scale: L = 2 m, 3 m and 4 m. The effort F' is drawn to
// scale on each crate: 300 N, 200 N, 150 N, so it shrinks as L grows.
// Each row: the ramp from its own foot to its own platform, the dashed L
// arrow along that ramp, the h bracket on the platform face.
// b0: the crates are pushed from the foot part way up; L and F' on each row.
// b1: MA = L / h: 2, 3 and 4 pop at each row's foot; the F' arrows stay, dimmed.
// b2: the crates go all the way up onto the platforms; each row's work chip
//     reads F' x L = 600 J, the same on every row (= mgh).

const PX = 90;                          // px per metre: h = 90 px
const MG = 600, FPX = 0.25;             // load in N; arrow px per N
const CW = 54, CH = 50;                 // crate
const TOPX = 592;                       // every ramp meets its platform here
const ROWS = [176, 340, 504];           // ground line of each row
const LOFF = 60;                        // the L arrow, this far above the ramp (clears the crate)
const REST_U = 0.3;
const TS = 26;                          // label size: 11 screen px at the 296 px a 390 phone gives this frame
const MOVE_S = 1.2, CLIMB_S = 2.2;

const CASES = [2, 3, 4].map((L, i) => {
  const G = ROWS[i], Lpx = L * PX, th = Math.asin(1 / L), run = Lpx * Math.cos(th);
  const foot = { x: TOPX - run, y: G }, top = { x: TOPX, y: G - PX };
  const ux = Math.cos(th), uy = -Math.sin(th), nx = uy, ny = -ux;
  return { i, L, F: MG / L, G, Lpx, th, foot, top, ux, uy, nx, ny };
});
const on = (k, s, off = 0) => ({ x: k.foot.x + k.ux * s + k.nx * off, y: k.foot.y + k.uy * s + k.ny * off });

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class InclinedPlaneMAScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Three smooth ramps, one above the other, each rising to a platform 1 m high: 2 m, 3 m and 4 m long. The same 600 N crate is pushed up each. The push F prime is 300 N, 200 N and 150 N: the longer the ramp, the shorter the push arrow. Then the mechanical advantage L over h reads 2, 3 and 4. Then each crate goes all the way up and each row reads the same work, 600 J.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get climbBeat() { return this.stage >= 2; }
  get motionEnd() { return (this.climbBeat ? CLIMB_S + 0.5 : this.stage === 1 ? 1.9 : MOVE_S) + 0.1; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // distance of the crate's centre along the ramp (beyond Lpx: on the platform)
  crateS(k) {
    const t = this.motionT ?? 0;
    const rest = REST_U * k.Lpx;
    if (!this.climbBeat) {
      if (this.stage === 1) return rest;
      return CW / 2 + 4 + (rest - CW / 2 - 4) * inOutSine(clamp01(t / MOVE_S));
    }
    return rest + (k.Lpx + CW / 2 + 8 - rest) * inOutSine(clamp01(t / CLIMB_S));
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    for (const k of CASES) this.row(ctx, c, k);
  }

  row(ctx, c, k) {
    this.ground(ctx, c, k.G);
    this.platform(ctx, c, k);
    this.plank(ctx, c, k);
    this.lArrow(ctx, c, k);
    // the crate and its push
    const s = this.crateS(k);
    let x, y, ang;
    if (s <= k.Lpx) { const q = on(k, s); x = q.x; y = q.y; ang = -k.th; }
    else {
      const e = clamp01((s - k.Lpx) / 20);
      x = TOPX + (s - k.Lpx); y = k.top.y; ang = -k.th * (1 - e);
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    drawCrate(ctx, c, { x: 0, y: 0, w: CW, h: CH, held: true });
    // F' at the crate's front face, mid height, along the ramp
    const pushing = s <= k.Lpx || !this.climbBeat || (this.motionT ?? 0) < CLIMB_S;
    if (pushing && ang !== 0) {
      const len = k.F * FPX, dim = this.stage === 1 ? 0.55 : 1;
      vectorArrow(ctx, c, CW / 2 + 2, -CH / 2, { angle: 0, length: len, col: c.accent, width: 6, head: 15, alpha: dim });
    }
    ctx.restore();
    this.footChip(ctx, c, k);
  }

  ground(ctx, c, G) {
    const soil = mix(c.bgSurface, c.label, 0.14);
    ctx.save();
    ctx.fillStyle = soil;
    ctx.fillRect(0, G, W, 9);
    ctx.fillStyle = lighten(soil, 0.25);
    ctx.fillRect(0, G, W, 2.5);
    ctx.fillStyle = darken(soil, 0.18);
    ctx.fillRect(0, G + 6, W, 3);
    ctx.restore();
  }

  platform(ctx, c, k) {
    const body = mix(c.bgSurface, c.label, 0.2), x0 = TOPX, y0 = k.top.y;
    ctx.save();
    drawShadow(ctx, c, (x0 + W) / 2, k.G + 1, (W - x0) * 0.6, 4, 0.6);
    ctx.fillStyle = body;
    ctx.fillRect(x0, y0, W - x0, k.G - y0);
    ctx.fillStyle = lighten(body, 0.2);
    ctx.fillRect(x0, y0, 5, k.G - y0);
    ctx.strokeStyle = alpha(darken(body, 0.3), 0.55);
    ctx.lineWidth = 1.5;
    for (let y = y0 + 18, r = 0; y < k.G; y += 18, r++) {
      ctx.beginPath(); ctx.moveTo(x0 + 1, y); ctx.lineTo(W, y); ctx.stroke();
      for (let bx = x0 + (r % 2 ? 18 : 40); bx < W; bx += 44) {
        ctx.beginPath(); ctx.moveTo(bx, y - 18); ctx.lineTo(bx, y); ctx.stroke();
      }
    }
    ctx.fillStyle = lighten(body, 0.12);
    ctx.fillRect(x0 - 3, y0 - 6, W - x0 + 3, 7);
    ctx.fillStyle = lighten(body, 0.34);
    ctx.fillRect(x0 - 3, y0 - 6, W - x0 + 3, 2);
    ctx.strokeStyle = darken(body, 0.35);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0 - 3, y0 - 6, W - x0 + 6, k.G - y0 + 6);
    // h: a bracket on the face, label beside it
    const bx = W - 20;
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, y0 + 2); ctx.lineTo(bx, k.G - 2);
    ctx.moveTo(bx - 7, y0 + 2); ctx.lineTo(bx + 7, y0 + 2);
    ctx.moveTo(bx - 7, k.G - 2); ctx.lineTo(bx + 7, k.G - 2);
    ctx.stroke();
    ctx.font = font(c, 800, TS, true);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label;
    ctx.fillText('1 m', bx - 10, (y0 + k.G) / 2 + 12);
    ctx.restore();
  }

  plank(ctx, c, k) {
    const wood = mix(c.gold, c.flame, 0.25);
    const T = 14, len = k.Lpx + 4;
    ctx.save();
    ctx.translate(k.foot.x, k.G);
    ctx.rotate(-k.th);
    rr(ctx, -2, -1, len + 3, T + 2, 2);
    ctx.fillStyle = darken(wood, 0.4);
    ctx.fill();
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, len, T);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(0, 0, len, 3);
    ctx.fillStyle = darken(wood, 0.22);
    ctx.fillRect(0, T - 4, len, 4);
    ctx.strokeStyle = alpha(darken(wood, 0.3), 0.6);
    ctx.lineWidth = 1.2;
    for (let gx = 18; gx < len - 30; gx += 52) {
      ctx.beginPath(); ctx.moveTo(gx, 6); ctx.quadraticCurveTo(gx + 14, 4, gx + 28, 7); ctx.stroke();
    }
    ctx.restore();
  }

  // L: dashed, parallel to this ramp, from its own foot to its own top
  lArrow(ctx, c, k) {
    const a = this.stage === 0 ? 1 : 0.6;
    const p0 = on(k, 0, LOFF), p1 = on(k, k.Lpx, LOFF);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = alpha(c.s2, 0.7);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    for (const [f, p] of [[k.foot, p0], [k.top, p1]]) {
      ctx.beginPath(); ctx.moveTo(f.x + k.nx * 4, f.y + k.ny * 4); ctx.lineTo(p.x + k.nx * 8, p.y + k.ny * 8); ctx.stroke();
    }
    ctx.setLineDash([]);
    displacementArrow(ctx, c, p0.x, p0.y, p1.x, p1.y, { tone: 2, width: 4, head: 13 });
    ctx.restore();
    // its name at the tail, left of the foot
    const text = `L = ${k.L} m`, w = chipSize(ctx, c, text, TS).w ?? 90;
    if (!this.climbBeat) pill(ctx, c, text, p0.x - 12 - w / 2, p0.y - 9, { bg: c.s2, size: TS, alpha: a });
  }

  // under each row's L label: MA on b1, the work on b2
  footChip(ctx, c, k) {
    const t = this.motionT ?? 0;
    const p0 = on(k, 0, LOFF);
    const rx = k.foot.x - 16, y = k.G - 17;
    if (this.stage === 0) {
      const e = clamp01((t - 0.3) / 0.4);
      const text = `F' = ${k.F} N`, w = chipSize(ctx, c, text, TS).w ?? 110;
      pill(ctx, c, text, Math.min(rx, p0.x - 12) - w / 2, y, { bg: c.accent, size: TS, alpha: e });
    } else if (this.stage === 1) {
      const e = clamp01((t - 0.4 - k.i * 0.45) / 0.4);
      if (e <= 0) return;
      const text = `MA = ${k.L}`, w = chipSize(ctx, c, text, 28).w ?? 100;
      pill(ctx, c, text, Math.min(rx, p0.x - 12) - w / 2, y, { bg: c.s4, size: 28, scale: outBack(e), alpha: Math.min(1, e * 2) });
    } else if (this.climbBeat) {
      const e = clamp01((t - CLIMB_S) / 0.4);
      if (e <= 0) return;
      const text = `${k.F} N x ${k.L} m = ${MG} J`;
      const w = chipSize(ctx, c, text, TS).w ?? 220;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, e * 2);
      drawWorkCounter(ctx, c, { x: Math.max(w / 2 + 6, Math.min(rx, p0.x - 12) - w / 2), y: y - 14, text, size: TS, tone: 3 });
      ctx.restore();
    }
  }
}
