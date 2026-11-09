import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, clamp01,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';

// CoasterDecayScene - blk-l05-s10, Lower Each Time (book Pause and Ponder 8, Fig 7.22).
// The book's science-park coaster: a lattice tower on the right, the ball let go
// at its top, the track running left over hills A, C, D and E, each lower.
// b0: the ball runs the track; a dashed line joins the tops it reaches, and it
//     steps down at every hill.
// b1: the same run with the K, U and heat and sound bars: heat and sound grows at
//     every stretch, and the dashed total line stays where it started.
// The model: mechanical energy e(s) (in height units) falls linearly with path
// length between the hill tops, and each hill top is set just under e there, so
// the ball creeps over every top: the hills are as high as it can still climb.
// Speed comes from K = e - h. At the end of the run-out e meets the track: it stops.

const GROUND = 452;
const BASE_Y = 432;                     // the rail at ground level, in the troughs
// Fig 7.22: round humps, each lower and narrower than the one before, with the
// low trough B on the ground between A and C. [centre x, half-width, crest y]
const HUMPS = { A: [452, 80, 184], C: [290, 54, 254], D: [186, 46, 308], E: [102, 36, 350] };
const MARGIN = 9;                       // px of height the ball still has over each top
const SPEED = 74;                       // px/s per sqrt(px) of K: sets the pace of the run
const BALL_R = 13;
const STOP_X = 52;
const B_X = 358;                        // the trough B, on the ground between A and C

// rail height at x on the hill stretch: a flattened raised cosine per hump, so
// each top is broad and round and each foot meets the ground smoothly
function railY(x) {
  for (const [cx, hw, cy] of Object.values(HUMPS)) {
    const u = (x - cx) / hw;
    if (Math.abs(u) < 1) return BASE_Y - (BASE_Y - cy) * Math.pow((1 + Math.cos(Math.PI * u)) / 2, 0.45);
  }
  return BASE_Y;
}

// the path: the drop off the tower (a cubic that leaves the top steeply and runs
// out level on the ground), then the hills sampled right to left, with arc length
const PATH = (() => {
  const pts = [];
  const P = [[604, 72], [602, 300], [588, BASE_Y], [540, BASE_Y]];
  for (let k = 0; k < 60; k++) {
    const t = k / 60, m = 1 - t;
    const f = (i) => m * m * m * P[0][i] + 3 * m * m * t * P[1][i] + 3 * m * t * t * P[2][i] + t * t * t * P[3][i];
    pts.push({ x: f(0), y: f(1) });
  }
  for (let x = 540; x >= 40; x -= 2) pts.push({ x, y: railY(x) });
  let s = 0;
  pts[0].s = 0;
  for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); pts[i].s = s; }
  return pts;
})();
const CREST_X = Object.fromEntries(Object.entries(HUMPS).map(([k, v]) => [k, v[0]]));
const LEN = PATH[PATH.length - 1].s;
const hOf = (p) => GROUND - p.y;

function at(s) {
  s = Math.max(0, Math.min(LEN, s));
  let lo = 0, hi = PATH.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PATH[m].s <= s) lo = m; else hi = m; }
  const a = PATH[lo], b = PATH[hi], u = (s - a.s) / Math.max(1e-6, b.s - a.s);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, ang: Math.atan2(b.y - a.y, b.x - a.x) };
}

// each named top: the highest sample near its x
const CRESTS = Object.entries(CREST_X).map(([name, cx]) => {
  let best = null;
  for (const p of PATH) if (Math.abs(p.x - cx) < 3 && (!best || p.y < best.y)) best = p;
  return { name, x: best.x, y: best.y, s: best.s, h: hOf(best) };
});
const STOP_S = (() => { for (const p of PATH) if (p.x <= STOP_X) return p.s; return LEN; })();
// e(s): anchors at the start, at each top, and at the stop
const E0 = hOf(PATH[0]) + 3;
const ANCH = [{ s: 0, e: E0 }, ...CRESTS.map((k) => ({ s: k.s, e: k.h + MARGIN })), { s: STOP_S, e: GROUND - BASE_Y }];
function eAt(s) {
  if (s >= STOP_S) return ANCH[ANCH.length - 1].e;
  for (let i = 1; i < ANCH.length; i++) {
    if (s <= ANCH[i].s) {
      const a = ANCH[i - 1], b = ANCH[i];
      return a.e + (b.e - a.e) * (s - a.s) / (b.s - a.s);
    }
  }
  return ANCH[ANCH.length - 1].e;
}
// the whole run, precomputed once on a fixed step: time -> path length
const RUN = (() => {
  const ts = [0], ss = [0];
  let s = 0, t = 0;
  const dt = 1 / 240;
  while (s < STOP_S && t < 30) {
    const k = Math.max(0, eAt(s) - hOf(at(s)));
    s += SPEED * Math.sqrt(Math.max(k, 0.6)) * dt;
    t += dt;
    ts.push(t); ss.push(Math.min(s, STOP_S));
  }
  return { ts, ss, T: t };
})();
function sAtTime(t) {
  if (t >= RUN.T) return STOP_S;
  const i = Math.min(RUN.ts.length - 1, Math.floor(t * 240));
  return RUN.ss[i];
}

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class CoasterDecayScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A ball roller coaster in a science park. The ball is let go at the top of a tall lattice tower and runs left over hills A, C, D and E, with the low point B on the ground between A and C; each hill is lower than the one before, and a dashed line joining the tops steps down. Then energy bars K, U and heat and sound: heat and sound grows at every stretch, and the dashed total line stays level.';

  enter() { this.mt = 0; }

  pointerDown() { this.mt = 0; this.animateFor(800); }

  update(d) { this.mt = Math.min(RUN.T + 0.2, (this.mt ?? 0) + d); }

  busy() { return (this.mt ?? 0) < RUN.T + 0.2; }

  get sNow() { return sAtTime(this.mt ?? 0); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky', { setting: 'field' });
    this.park(ctx, c);
    this.base(ctx, c);
    this.supports(ctx, c);
    this.tower(ctx, c);
    this.track(ctx, c);
    this.tops(ctx, c);
    this.ball(ctx, c);
    if (this.stage >= 1) this.bars(ctx, c);
  }

  park(ctx, c) {
    // a clipped hedge along the back of the park: scalloped top, sunlit upper
    // edge, shaded foot, and a few darker clumps for depth
    const leaf = mix(c.s3, c.setGroundFar, 0.5);
    const top = GROUND - 44;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 20) ctx.quadraticCurveTo(x + 10, top - 10 - 6 * Math.sin(x * 0.07), x + 20, top);
    ctx.lineTo(W, GROUND); ctx.closePath();
    ctx.fillStyle = leaf; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(leaf, 0.16);
    ctx.fillRect(0, GROUND - 16, W, 16);
    ctx.fillStyle = lighten(leaf, 0.16);
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.ellipse(x + 8, top - 2, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }

  base(ctx, c) {
    const slab = mix(c.stroke, c.label, 0.45);
    ctx.save();
    ctx.fillStyle = mix(c.setGround, c.s3, 0.25);
    ctx.fillRect(0, GROUND + 18, W, H - GROUND - 18);
    // the long concrete base under the whole ride, seen a little from above
    ctx.fillStyle = lighten(slab, 0.2);
    ctx.beginPath(); ctx.moveTo(20, GROUND - 6); ctx.lineTo(668, GROUND - 6); ctx.lineTo(676, GROUND + 4); ctx.lineTo(14, GROUND + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = slab;
    ctx.fillRect(14, GROUND + 4, 662, 16);
    ctx.fillStyle = darken(slab, 0.22);
    ctx.fillRect(14, GROUND + 16, 662, 4);
    ctx.strokeStyle = alpha(darken(slab, 0.3), 0.6); ctx.lineWidth = 1.5;
    for (let x = 60; x < 676; x += 64) { ctx.beginPath(); ctx.moveTo(x, GROUND + 4); ctx.lineTo(x, GROUND + 20); ctx.stroke(); }
    // the buffer at the end of the run-out
    ctx.fillStyle = c.s6;
    rr(ctx, 24, 410, 12, 34, 3); ctx.fill();
    ctx.fillStyle = lighten(c.s6, 0.3); ctx.fillRect(26, 413, 3, 28);
    ctx.restore();
  }

  supports(ctx, c) {
    const red = c.s6;
    ctx.save();
    ctx.lineCap = 'round';
    for (const k of CRESTS) {
      const spread = 18 + k.h * 0.1;
      // two legs, a cross tie, and the cables of the book's A-frames
      ctx.strokeStyle = darken(red, 0.15); ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(k.x - spread, GROUND - 4); ctx.lineTo(k.x - 7, k.y + 12);
      ctx.lineTo(k.x + 7, k.y + 12); ctx.lineTo(k.x + spread, GROUND - 4); ctx.stroke();
      ctx.strokeStyle = lighten(red, 0.25); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(k.x - spread + 2, GROUND - 6); ctx.lineTo(k.x - 5, k.y + 14); ctx.stroke();
      ctx.strokeStyle = darken(red, 0.3); ctx.lineWidth = 3;
      const ty = (GROUND + k.y) / 2 + 20, tw = spread * (GROUND - ty) / (GROUND - k.y);
      ctx.beginPath(); ctx.moveTo(k.x - tw, ty); ctx.lineTo(k.x + tw, ty); ctx.stroke();
      ctx.strokeStyle = alpha(c.labelMuted, 0.7); ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(k.x, k.y + 8); ctx.lineTo(k.x - spread * 2.4, GROUND - 4);
      ctx.moveTo(k.x, k.y + 8); ctx.lineTo(k.x + spread * 2.4, GROUND - 4); ctx.stroke();
    }
    // short posts under the valleys
    ctx.fillStyle = darken(red, 0.25);
    for (const p of PATH) if (p.y > 428 && p.x > 70 && p.x < 540 && Math.round(p.x) % 12 === 0) ctx.fillRect(p.x - 2, p.y + 6, 4, GROUND - p.y - 8);
    ctx.restore();
  }

  tower(ctx, c) {
    // the lattice tower, red and yellow in stages as in the book
    const xl0 = 586, xr0 = 660, xl1 = 600, xr1 = 646, top = 82;
    const lx = (y) => xl0 + (xl1 - xl0) * (GROUND - y) / (GROUND - top);
    const rx = (y) => xr0 + (xr1 - xr0) * (GROUND - y) / (GROUND - top);
    ctx.save();
    drawShadow(ctx, c, 623, GROUND - 2, 50, 7, 0.9);
    ctx.lineCap = 'round';
    const levels = 7, step = (GROUND - top) / levels;
    for (let i = 0; i < levels; i++) {
      const y0 = GROUND - i * step, y1 = y0 - step;
      const col = i % 2 ? c.gold : c.s6;
      ctx.strokeStyle = darken(col, 0.12); ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx(y0), y0); ctx.lineTo(rx(y1), y1);
      ctx.moveTo(rx(y0), y0); ctx.lineTo(lx(y1), y1);
      ctx.stroke();
      ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx(y1), y1); ctx.lineTo(rx(y1), y1); ctx.stroke();
      // legs: shade on the right leg, light strip on the left one
      ctx.strokeStyle = col; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(lx(y0), y0); ctx.lineTo(lx(y1), y1); ctx.stroke();
      ctx.strokeStyle = darken(col, 0.25);
      ctx.beginPath(); ctx.moveTo(rx(y0), y0); ctx.lineTo(rx(y1), y1); ctx.stroke();
      ctx.strokeStyle = lighten(col, 0.4); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx(y0) - 2, y0); ctx.lineTo(lx(y1) - 2, y1); ctx.stroke();
    }
    // the top platform with its rail
    ctx.fillStyle = mix(c.stroke, c.label, 0.3);
    rr(ctx, 592, top - 10, 62, 10, 3); ctx.fill();
    ctx.fillStyle = darken(mix(c.stroke, c.label, 0.3), 0.25);
    ctx.fillRect(592, top - 3, 62, 3);
    ctx.strokeStyle = mix(c.stroke, c.label, 0.2); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(612, top - 10); ctx.lineTo(612, top - 34); ctx.lineTo(652, top - 34); ctx.lineTo(652, top - 10);
    ctx.moveTo(632, top - 10); ctx.lineTo(632, top - 34); ctx.stroke();
    ctx.restore();
  }

  track(ctx, c) {
    const rail = mix(c.s6, c.stroke, 0.25);
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const line = (off) => {
      ctx.beginPath();
      PATH.forEach((p, i) => {
        const q = at(p.s);
        const x = p.x - Math.sin(q.ang) * off, y = p.y + Math.cos(q.ang) * off;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.stroke();
    };
    // ties between the two rails
    ctx.strokeStyle = darken(rail, 0.35); ctx.lineWidth = 2;
    for (let s = 0; s < LEN; s += 12) {
      const q = at(s), nx = -Math.sin(q.ang), ny = Math.cos(q.ang);
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + nx * 7, q.y + ny * 7); ctx.stroke();
    }
    ctx.strokeStyle = darken(rail, 0.3); ctx.lineWidth = 3.5; line(7);
    ctx.strokeStyle = rail; ctx.lineWidth = 4; line(0);
    ctx.strokeStyle = lighten(rail, 0.45); ctx.lineWidth = 1.2; line(-1);
    ctx.restore();
  }

  // the tops the ball reaches, joined by a dashed line that steps down
  tops(ctx, c) {
    const s = this.sNow;
    const pts = [{ x: PATH[0].x, y: PATH[0].y }];
    for (const k of CRESTS) if (s >= k.s - 2) pts.push(k);
    ctx.save();
    ctx.strokeStyle = alpha(c.accent, 0.85); ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]);
    for (const p of pts.slice(1)) {
      // a level line out to the left of each top, the height it reached
      ctx.beginPath(); ctx.moveTo(p.x - 34, p.y - BALL_R * 2 - 2); ctx.lineTo(p.x + 34, p.y - BALL_R * 2 - 2); ctx.stroke();
    }
    ctx.beginPath();
    pts.forEach((p, i) => { const y = p.y - BALL_R * 2 - 2; if (i) ctx.lineTo(p.x, y); else ctx.moveTo(p.x - 14, y + 12); });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const bP = PATH.find((p) => p.x <= B_X);
    const bReached = s >= bP.s - 2;
    pill(ctx, c, 'B', B_X, BASE_Y - 34, { bg: bReached ? c.s5 : c.raised, ink: bReached ? undefined : c.label, size: 22 });
    for (const k of CRESTS) {
      const reached = s >= k.s - 2;
      pill(ctx, c, k.name, k.x, k.y - BALL_R * 2 - 34, { bg: reached ? c.s5 : c.raised, ink: reached ? undefined : c.label, size: 22 });
    }
  }

  ball(ctx, c) {
    const q = at(this.sNow);
    const nx = -Math.sin(q.ang), ny = Math.cos(q.ang);      // up off the rails for a leftward run
    drawBall(ctx, c, { x: q.x + nx * (BALL_R + 9), y: q.y + ny * (BALL_R + 9), r: BALL_R, tone: 1 });
  }

  bars(ctx, c) {
    const s = this.sNow;
    const e = eAt(s);
    const fade = clamp01((this.mt ?? 0) / 0.3);
    const h = GROUND - at(s).y;
    // the one-world bars: K, U, heat and sound, and the dashed total line
    drawEnergyBars(ctx, c, {
      x: 14, y: 14, h: 112, max: E0, total: E0, size: 21, alpha: fade,
      values: { K: Math.max(0, e - h), U: Math.min(e, h), heat: E0 - e },
    });
  }
}
