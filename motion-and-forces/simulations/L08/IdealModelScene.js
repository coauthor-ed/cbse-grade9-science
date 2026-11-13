/**
 * IdealModelScene - slide blk-l08-n03 "A useful model" (2 beats; Fig 4.26).
 *   b0 'ideal'  two panels side by side: a planet going once round the Sun on its real, nearly
 *               circular orbit (thin line), and a car taking a round bend on a real road (top
 *               view), both at steady speed. While they move, a dashed true circle is laid over
 *               each path: the model. Tag "idealised model" once, above both. Rest: both at a point.
 *   b1 'space'  the panels shrink and fade; a mountain road winds up a hill (three-quarter view,
 *               Fig 4.26) with a car climbing it, a bird and an aircraft in the sky, and three
 *               axes x, y, z; tag "three dimensions". Rest: the car part way up.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const P1 = { x: 16, y: 82, w: 318, h: 420 }, P2 = { x: 346, y: 82, w: 318, h: 420 };
const SUN = { x: 168, y: 294, r: 30 }, ORB = { x: 176, y: 292, a: 122, b: 113 }, MODEL1 = 117;
const BEND = { x: 505, y: 292, r: 100, w: 54 };
const LEAD = 0.3, RUN = 3.0, MODEL_AT = 1.3, TAG_AT = 2.1;
const SHRINK = 0.7, HILL_AT = 0.5, CLIMB_AT = 1.0, CLIMB = 3.0, CAR_REST = 0.56;
const hash = (i) => { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); };

/** The real bend: a little off a circle (radius wobbles by 7 per cent). th from 0 (right) to -PI (left). */
const bendR = (th) => BEND.r * (1 + 0.07 * Math.sin(2 * th + 0.9));
const bendAt = (th) => ({ x: BEND.x + bendR(th) * Math.cos(th), y: BEND.y + bendR(th) * Math.sin(th) });

/** The mountain road through these points (Catmull-Rom), sampled once; each sample has its depth k (0 near, 1 far). */
const ROAD_PTS = [[96, 512], [250, 486], [352, 466], [372, 452], [338, 436], [196, 404], [178, 390], [204, 376], [318, 344], [336, 330], [312, 316], [238, 290], [232, 278], [258, 266], [322, 240], [330, 228], [312, 218], [296, 206], [324, 186], [352, 172]];
const ROAD = (() => {
  const out = [], P = ROAD_PTS;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) {
      const t = k / 12, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  out.push({ x: P[P.length - 1][0], y: P[P.length - 1][1] });
  let s = 0;
  out.forEach((p, i) => { if (i) s += Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y); p.s = s; });
  out.forEach((p) => { p.k = clamp01((512 - p.y) / 340); });
  return { pts: out, len: s };
})();
const roadAt = (u) => {
  const s = u * ROAD.len, P = ROAD.pts;
  let i = 1; while (i < P.length - 1 && P[i].s < s) i++;
  const a = P[i - 1], b = P[i], t = (s - a.s) / Math.max(1e-6, b.s - a.s);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, k: a.k + (b.k - a.k) * t, dx: b.x - a.x, dy: b.y - a.y };
};

/** A car seen from above, nose along heading (same drawing as the W3A top-view car). */
function topCar(ctx, c, x, y, heading, L, col) {
  const W = L * 0.46;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(heading);
  ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.3); rr(ctx, -L / 2 + 3, -W / 2 + 4, L, W, W * 0.35); ctx.fill();
  ctx.fillStyle = darken(c.label, 0.1);
  for (const [wx, wy] of [[L * 0.28, -1], [L * 0.28, 1], [-L * 0.3, -1], [-L * 0.3, 1]]) { rr(ctx, wx - L * 0.09, wy * W / 2 - W * 0.09 - (wy > 0 ? 0 : W * 0.02), L * 0.18, W * 0.2, 2); ctx.fill(); }
  rr(ctx, -L / 2, -W / 2, L, W, W * 0.35); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.45); ctx.stroke();
  rr(ctx, -L / 2 + 4, -W / 2 + 3, L - 8, W * 0.22, W * 0.1); ctx.fillStyle = alpha(lighten(col, 0.55), 0.6); ctx.fill();
  rr(ctx, L * 0.08, -W * 0.36, L * 0.2, W * 0.72, 4); ctx.fillStyle = c.glass; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = darken(col, 0.4); ctx.stroke();
  rr(ctx, -L * 0.36, -W * 0.32, L * 0.13, W * 0.64, 3); ctx.fillStyle = c.glass; ctx.fill(); ctx.stroke();
  rr(ctx, -L * 0.22, -W * 0.34, L * 0.29, W * 0.68, 5); ctx.fillStyle = lighten(col, 0.18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lighten(c.gold, 0.4);
  ctx.beginPath(); ctx.arc(L / 2 - 4, -W * 0.3, 3, 0, TAU); ctx.arc(L / 2 - 4, W * 0.3, 3, 0, TAU); ctx.fill();
  ctx.restore();
}

export class IdealModelScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two panels. On the left a planet goes round the Sun on its real orbit, which is nearly but not exactly a circle. On the right a car takes a round bend on a real road, seen from above. Both move at a steady speed. A dashed perfect circle is laid over each path: uniform circular motion is an idealised model of both. Then the panels fade and a mountain road winds up a hill, with a car climbing it, a bird and an aircraft in the sky, and three axes x, y and z: motion in three dimensions.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.cur === 0 ? this.age < LEAD + RUN + 0.8 : this.age < CLIMB_AT + CLIMB + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) { this.ideal(ctx, c, this.age, 1); return; }
    const a = this.age, sk = inOutSine(clamp01(a / SHRINK));
    if (sk < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - sk;
      ctx.translate(340, 290); ctx.scale(1 - 0.45 * sk, 1 - 0.45 * sk); ctx.translate(-340, -290);
      this.ideal(ctx, c, 99, 1 - sk);
      ctx.restore();
    }
    const hk = clamp01((a - HILL_AT) / 0.5);
    if (hk > 0) this.space(ctx, c, a, hk);
  }

  // -- b0 -------------------------------------------------------------------------------------

  ideal(ctx, c, a, k) {
    const u = clamp01((a - LEAD) / RUN);
    this.sunPanel(ctx, c, u, a);
    this.bendPanel(ctx, c, u, a);
    const t = clamp01((a - TAG_AT) / 0.4) * k;
    if (t > 0) drawTag(ctx, c, 'idealised model', 340, 42, { alpha: t, col: c.s5, size: 30 });
  }

  space0(c) { return darken(mix(c.s5, c.s1, 0.45), 0.74); }

  /** A dashed true circle drawn on by sweep 0..1 (the model). */
  model(ctx, c, x, y, r, sweep) {
    if (sweep <= 0) return;
    ctx.save();
    ctx.strokeStyle = lighten(c.s5, 0.15); ctx.lineWidth = 4.5; ctx.setLineDash([12, 9]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * sweep); ctx.stroke();
    ctx.restore();
  }

  sunPanel(ctx, c, u, a) {
    const P = P1, sp = this.space0(c);
    drawSheet(ctx, c, P);
    ctx.save();
    rr(ctx, P.x + 8, P.y + 8, P.w - 16, P.h - 16, 12); ctx.clip();
    const g = ctx.createRadialGradient(SUN.x, SUN.y, 20, SUN.x, SUN.y, 260);
    g.addColorStop(0, lighten(sp, 0.12)); g.addColorStop(1, darken(sp, 0.2));
    ctx.fillStyle = g; ctx.fillRect(P.x, P.y, P.w, P.h);
    for (let i = 0; i < 46; i++) {
      const x = P.x + 12 + hash(i) * (P.w - 24), y = P.y + 12 + hash(i + 99) * (P.h - 24), r = 0.8 + 1.6 * hash(i + 7);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = alpha(lighten(c.gold, 0.85), 0.5 + 0.4 * hash(i + 3)); ctx.fill();
    }
    // the real orbit: thin, a little off a circle
    ctx.beginPath(); ctx.ellipse(ORB.x, ORB.y, ORB.a, ORB.b, 0, 0, TAU);
    ctx.strokeStyle = alpha(lighten(sp, 0.7), 0.75); ctx.lineWidth = 2.5; ctx.stroke();
    this.model(ctx, c, SUN.x, SUN.y, MODEL1, clamp01((a - MODEL_AT) / 0.9));
    this.sun(ctx, c);
    const th = -0.25 * Math.PI - TAU * 0.85 * inOutLinear(u);
    this.planet(ctx, c, ORB.x + ORB.a * Math.cos(th), ORB.y + ORB.b * Math.sin(th));
    ctx.restore();
  }

  sun(ctx, c) {
    const { x, y, r } = SUN, hot = c.s2, core = lighten(c.gold, 0.35);
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.4);
    glow.addColorStop(0, alpha(lighten(hot, 0.3), 0.55)); glow.addColorStop(1, alpha(hot, 0));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha(lighten(hot, 0.4), 0.8); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const q = (i * TAU) / 12 + 0.13, r1 = r + 7, r2 = r + (i % 2 ? 14 : 20);
      ctx.beginPath(); ctx.moveTo(x + r1 * Math.cos(q), y + r1 * Math.sin(q)); ctx.lineTo(x + r2 * Math.cos(q), y + r2 * Math.sin(q)); ctx.stroke();
    }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r);
    g.addColorStop(0, lighten(core, 0.6)); g.addColorStop(0.6, core); g.addColorStop(1, darken(hot, 0.1));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = darken(hot, 0.35); ctx.stroke();
    ctx.restore();
  }

  /** A small planet: sea and land, lit on the side facing the Sun, shaded on the far side. */
  planet(ctx, c, x, y) {
    const r = 15, toSun = Math.atan2(SUN.y - y, SUN.x - x);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = c.water; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = mix(c.good, c.water, 0.15);
    ctx.beginPath(); ctx.ellipse(x - 4, y - 3, 7, 5, -0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 6, y + 6, 5, 7, 0.4, 0, TAU); ctx.fill();
    const lx = x + r * Math.cos(toSun), ly = y + r * Math.sin(toSun);
    const g = ctx.createLinearGradient(lx, ly, x - r * Math.cos(toSun), y - r * Math.sin(toSun));
    g.addColorStop(0, alpha(lighten(c.water, 0.8), 0.45)); g.addColorStop(0.5, alpha(c.water, 0)); g.addColorStop(1, alpha(darken(c.water, 0.75), 0.75));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = darken(c.water, 0.5); ctx.stroke();
    ctx.restore();
  }

  bendPanel(ctx, c, u, a) {
    const P = P2, grass = mix(c.s3, c.bgSurface, 0.45);
    drawSheet(ctx, c, P);
    ctx.save();
    rr(ctx, P.x + 8, P.y + 8, P.w - 16, P.h - 16, 12); ctx.clip();
    const g = ctx.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
    g.addColorStop(0, lighten(grass, 0.15)); g.addColorStop(1, darken(grass, 0.08));
    ctx.fillStyle = g; ctx.fillRect(P.x, P.y, P.w, P.h);
    for (let i = 0; i < 70; i++) {
      const x = P.x + 10 + hash(i + 300) * (P.w - 20), y = P.y + 10 + hash(i + 500) * (P.h - 20);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 6); ctx.strokeStyle = alpha(darken(grass, 0.3), 0.35); ctx.lineWidth = 1.5; ctx.stroke();
    }
    // the road: up the right leg, round the bend over the top, down the left leg
    const path = () => {
      ctx.beginPath();
      const s = bendAt(0); ctx.moveTo(s.x, P.y + P.h + 20); ctx.lineTo(s.x, s.y);
      for (let i = 1; i <= 60; i++) { const q = bendAt(-Math.PI * i / 60); ctx.lineTo(q.x, q.y); }
      const e = bendAt(-Math.PI); ctx.lineTo(e.x, P.y + P.h + 20);
    };
    const asphalt = mix(c.labelMuted, c.bgSurface, 0.3);
    ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = alpha(darken(c.stroke, 0.4), 0.3); ctx.lineWidth = BEND.w + 12; ctx.translate(3, 5); ctx.stroke(); ctx.translate(-3, -5);
    path(); ctx.strokeStyle = darken(asphalt, 0.4); ctx.lineWidth = BEND.w + 6; ctx.stroke();
    path(); ctx.strokeStyle = asphalt; ctx.lineWidth = BEND.w; ctx.stroke();
    path(); ctx.strokeStyle = alpha(lighten(asphalt, 0.7), 0.95); ctx.lineWidth = 2.5; ctx.setLineDash([14, 12]); ctx.stroke(); ctx.setLineDash([]);
    // bushes inside the bend
    for (const [bx, by, br] of [[505, 300, 26], [470, 340, 18], [540, 344, 16]]) {
      ctx.beginPath(); ctx.arc(bx + 3, by + 5, br, 0, TAU); ctx.fillStyle = alpha(darken(c.s3, 0.6), 0.3); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = darken(c.s3, 0.1); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = darken(c.s3, 0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.45, 0, TAU); ctx.fillStyle = alpha(lighten(c.s3, 0.45), 0.6); ctx.fill();
    }
    this.model(ctx, c, BEND.x, BEND.y, BEND.r, clamp01((a - MODEL_AT - 0.2) / 0.9));
    // the car: in the left-hand lane (Indian roads), steady speed, round the bend (counter-clockwise on screen)
    const lane = -13, th = -0.1 - (Math.PI * 0.82) * inOutLinear(u);
    const rr0 = bendR(th) + lane;
    const x = BEND.x + rr0 * Math.cos(th), y = BEND.y + rr0 * Math.sin(th);
    topCar(ctx, c, x, y, th - Math.PI / 2, 54, c.s6);
    ctx.restore();
  }

  // -- b1 -------------------------------------------------------------------------------------

  space(ctx, c, a, k) {
    const S = { x: 16, y: 16, w: 648, h: 488 };
    ctx.save();
    ctx.globalAlpha = k;
    drawSheet(ctx, c, S);
    ctx.save(); rr(ctx, S.x + 6, S.y + 6, S.w - 12, S.h - 12, 12); ctx.clip();
    const sky = ctx.createLinearGradient(0, S.y, 0, S.y + S.h);
    sky.addColorStop(0, mix(c.s1, c.bgSurface, 0.55)); sky.addColorStop(0.6, mix(c.s1, c.bgSurface, 0.85));
    ctx.fillStyle = sky; ctx.fillRect(S.x, S.y, S.w, S.h);
    this.hill(ctx, c);
    const u = clamp01((a - CLIMB_AT) / CLIMB);
    this.carOnRoad(ctx, c, CAR_REST * inOutSine(u));
    const fly = clamp01((a - CLIMB_AT) / CLIMB);
    this.aircraft(ctx, c, 70 + 210 * fly, 132 - 40 * fly, fly);
    this.bird(ctx, c, 560 - 120 * fly, 210 - 34 * fly, a < CLIMB_AT + CLIMB ? a : 0);
    ctx.restore();
    this.axes(ctx, c, 560, 180, clamp01((a - 1.4) / 0.5));
    ctx.restore();
    const t = clamp01((a - 1.6) / 0.4);
    if (t > 0) drawTag(ctx, c, 'three dimensions', 476, 46, { alpha: t * k, col: c.s5, size: 30 });
  }

  /** The hill: a far blue ridge, then the near hill lit from the left, a forest of round crowns, the road. */
  hill(ctx, c) {
    const green = mix(c.s3, c.bgSurface, 0.2), far = mix(mix(c.s1, c.s3, 0.5), c.bgSurface, 0.55);
    ctx.beginPath(); ctx.moveTo(16, 330); ctx.quadraticCurveTo(130, 230, 220, 270); ctx.quadraticCurveTo(300, 300, 400, 250); ctx.quadraticCurveTo(540, 190, 664, 280); ctx.lineTo(664, 504); ctx.lineTo(16, 504); ctx.closePath();
    ctx.fillStyle = far; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = darken(far, 0.25); ctx.stroke();
    const outline = () => { ctx.beginPath(); ctx.moveTo(16, 470); ctx.quadraticCurveTo(160, 420, 250, 260); ctx.quadraticCurveTo(320, 150, 372, 158); ctx.quadraticCurveTo(440, 166, 520, 300); ctx.quadraticCurveTo(580, 400, 664, 430); ctx.lineTo(664, 504); ctx.lineTo(16, 504); ctx.closePath(); };
    outline(); ctx.fillStyle = green; ctx.fill();
    ctx.save(); outline(); ctx.clip();
    // shade side: right of the ridge from the peak
    ctx.beginPath(); ctx.moveTo(372, 158); ctx.quadraticCurveTo(420, 300, 470, 504); ctx.lineTo(664, 504); ctx.lineTo(664, 160); ctx.closePath();
    ctx.fillStyle = alpha(darken(green, 0.35), 0.55); ctx.fill();
    ctx.beginPath(); ctx.moveTo(250, 262); ctx.quadraticCurveTo(320, 150, 372, 158); ctx.strokeStyle = alpha(lighten(green, 0.6), 0.7); ctx.lineWidth = 6; ctx.stroke();
    // trees, smaller with distance, kept off the road
    for (let i = 0; i < 150; i++) {
      const x = 20 + hash(i + 900) * 640, y = 170 + hash(i + 1300) * 330;
      if (this.nearRoad(x, y, 26)) continue;
      const d = clamp01((512 - y) / 340), r = 13 - 7 * d;
      const col = mix(darken(c.s3, 0.15), green, 0.25 * hash(i + 77));
      ctx.beginPath(); ctx.arc(x + 2, y + 3, r, 0, TAU); ctx.fillStyle = alpha(darken(c.s3, 0.6), 0.35); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = darken(c.s3, 0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.4, 0, TAU); ctx.fillStyle = alpha(lighten(c.s3, 0.5), 0.55); ctx.fill();
    }
    ctx.restore();
    outline(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(green, 0.45); ctx.stroke();
    this.road(ctx, c);
  }

  nearRoad(x, y, d) {
    const P = ROAD.pts;
    for (let i = 0; i < P.length; i += 2) if (Math.abs(P[i].x - x) < d + 14 && Math.abs(P[i].y - y) < d) return true;
    return false;
  }

  /** The winding road: a retaining wall under it, asphalt narrowing with distance, a dashed centre line. */
  road(ctx, c) {
    const P = ROAD.pts, asphalt = mix(c.labelMuted, c.bgSurface, 0.3), wall = mix(c.stroke, c.bgSurface, 0.2);
    const w = (p) => 30 - 20 * p.k;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pass = (dy, col, extra) => {
      for (let i = 1; i < P.length; i++) {
        ctx.beginPath(); ctx.moveTo(P[i - 1].x, P[i - 1].y + dy); ctx.lineTo(P[i].x, P[i].y + dy);
        ctx.strokeStyle = col; ctx.lineWidth = w(P[i]) + extra; ctx.stroke();
      }
    };
    pass(6 - 0, darken(wall, 0.25), 4);
    pass(3, wall, 2);
    pass(0, darken(asphalt, 0.4), 4);
    pass(0, asphalt, 0);
    ctx.setLineDash([7, 8]); ctx.strokeStyle = alpha(lighten(asphalt, 0.7), 0.9); ctx.lineWidth = 1.6;
    ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.restore();
  }

  carOnRoad(ctx, c, u) {
    const p = roadAt(u), L = 74 - 34 * p.k, flip = p.dx < 0;
    const ang = flip ? Math.atan2(-p.dy, -p.dx) : Math.atan2(p.dy, p.dx);
    ctx.save();
    ctx.translate(p.x, p.y + 4); ctx.rotate(-ang * -1);
    drawCar(ctx, c, { x: 0, y: 0, length: L, tone: 6, flip, roll: u * 400 });
    ctx.restore();
  }

  /** A small airliner, side view, nose to the right and a little up; a faint trail behind. */
  aircraft(ctx, c, x, y, fly) {
    const body = mix(c.bgSurface, c.stroke, 0.12), trim = c.s1, L = 104;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.17);
    ctx.strokeStyle = alpha(lighten(c.bgSurface, 0.6), 0.55 * clamp01(fly * 4)); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-L / 2 - 6, 0); ctx.lineTo(-L / 2 - 6 - 150 * clamp01(fly * 3), 0); ctx.stroke();
    // far wing
    ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(-24, -22); ctx.lineTo(-12, -22); ctx.lineTo(14, -3); ctx.closePath(); ctx.fillStyle = darken(body, 0.2); ctx.fill();
    // tail fin
    ctx.beginPath(); ctx.moveTo(-L / 2 + 6, -4); ctx.lineTo(-L / 2 - 2, -28); ctx.lineTo(-L / 2 + 10, -28); ctx.lineTo(-L / 2 + 26, -6); ctx.closePath();
    ctx.fillStyle = trim; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = darken(trim, 0.45); ctx.stroke();
    // fuselage
    ctx.beginPath(); ctx.moveTo(-L / 2, -7); ctx.lineTo(L / 2 - 14, -9); ctx.quadraticCurveTo(L / 2 + 6, -6, L / 2 + 4, 2); ctx.quadraticCurveTo(L / 2, 8, L / 2 - 16, 8); ctx.lineTo(-L / 2 + 6, 6); ctx.quadraticCurveTo(-L / 2 - 4, 2, -L / 2, -7); ctx.closePath();
    ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = darken(body, 0.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-L / 2 + 8, 3); ctx.lineTo(L / 2 - 8, 3); ctx.strokeStyle = trim; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = darken(c.glass, 0.25);
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-L / 2 + 22 + i * 9, -3, 1.8, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(L / 2 - 10, -6); ctx.lineTo(L / 2 - 2, -5); ctx.lineTo(L / 2 - 2, -1); ctx.lineTo(L / 2 - 12, -1); ctx.closePath(); ctx.fill();
    // near wing and engine
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-26, 26); ctx.lineTo(-12, 26); ctx.lineTo(18, 3); ctx.closePath();
    ctx.fillStyle = lighten(body, 0.1); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = darken(body, 0.45); ctx.stroke();
    rr(ctx, -10, 9, 16, 7, 3.5); ctx.fillStyle = darken(body, 0.15); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /** A bird gliding left: body, tail, two wings that beat while it flies and hold still at rest. */
  bird(ctx, c, x, y, t) {
    const col = mix(c.label, c.s8, 0.25), flap = t > 0 ? Math.sin(t * 9) : 0.35;
    ctx.save();
    ctx.translate(x, y); ctx.scale(1.45, 1.45);
    ctx.lineJoin = 'round';
    const wing = (dir) => {
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(8, -20 * flap * dir - 4, 26, -26 * flap * dir + 2);
      ctx.quadraticCurveTo(12, -6 * flap * dir, 8, 2); ctx.closePath();
    };
    wing(1); ctx.fillStyle = darken(col, 0.15); ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = darken(col, 0.5); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(6, 1, 15, 6, 0.05, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(28, -3); ctx.lineTo(28, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-8, -2, 5, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-19, 0); ctx.lineTo(-12, 1); ctx.closePath(); ctx.fillStyle = c.gold; ctx.fill();
    ctx.translate(4, 0); ctx.scale(1, -0.7); wing(-1); ctx.setTransform(ctx.getTransform());
    ctx.fillStyle = lighten(col, 0.1); ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = darken(col, 0.5); ctx.stroke();
    ctx.restore();
  }

  /** Three axes: x to the right, y up, z coming out toward the viewer (drawn down-left). */
  axes(ctx, c, x, y, k) {
    if (k <= 0) return;
    const col = c.label;
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const arm = (dx, dy, s, lx, ly) => {
      const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx - ux * 10, y + dy - uy * 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx - ux * 16 - uy * 8, y + dy - uy * 16 + ux * 8); ctx.lineTo(x + dx - ux * 16 + uy * 8, y + dy - uy * 16 - ux * 8); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.strokeText(s, x + dx + lx, y + dy + ly); ctx.fillText(s, x + dx + lx, y + dy + ly); ctx.restore();
    };
    arm(76, 0, 'x', 18, 0);
    arm(0, -66, 'y', 0, -18);
    arm(-50, 42, 'z', -14, 14);
    ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/** Steady speed: plain linear progress (named so the intent reads at the call). */
function inOutLinear(u) { return clamp01(u); }
