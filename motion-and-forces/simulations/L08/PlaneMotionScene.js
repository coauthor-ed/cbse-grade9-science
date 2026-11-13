/**
 * PlaneMotionScene - slide blk-l08-s1 "Motion in a plane" (1 beat; Fig 4.21).
 *   First a straight road with one car moving along it, a + axis under it: "one dimension".
 *   The road then shrinks to a thin strip at the top and a flat sheet (light grid, faint x and y
 *   axes) takes the stage: "two dimensions". The book's three paths are drawn on in turn, each
 *   object moving along its path once: a car overtaking another (top view: out to the other
 *   lane and back), a kicked ball (side view: a curved flight from the foot to the ground) and
 *   a satellite going once round the Earth. Rest: all three paths, the objects at their ends.
 *   Landscape: the three paths side by side; portrait (config.isPortrait): stacked.
 * Every frame is a function of the age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr, lerp } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const RUN1 = 1.5, SHRINK = 1.7, SHRINK_T = 0.7, SHEET = 2.3, P0 = 2.7, PDUR = 0.9, PGAP = 1.0;
const ROAD_Y = 270;
const smooth = (u) => { const t = clamp01(u); return t * t * (3 - 2 * t); };

/** A car seen from above, nose along heading: rimmed body, lit side, glass front and back, wheels. */
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

/** The Earth from space: sea, two land masses, a lit rim and a shaded night side. */
function earth(ctx, c, x, y, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = c.water; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = mix(c.good, c.water, 0.15);
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.2, r * 0.42, r * 0.3, -0.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.35, y + r * 0.35, r * 0.3, r * 0.42, 0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.1, y - r * 0.62, r * 0.25, r * 0.12, 0, 0, TAU); ctx.fillStyle = lighten(c.water, 0.75); ctx.fill();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, alpha(lighten(c.water, 0.8), 0.35)); g.addColorStop(0.55, alpha(c.water, 0)); g.addColorStop(1, alpha(darken(c.water, 0.6), 0.55));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(c.water, 0.45); ctx.stroke();
  ctx.restore();
}

/** A satellite: gold body across the orbit, two blue solar panels. */
function satellite(ctx, c, x, y, ang, s) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  for (const k of [-1, 1]) {
    ctx.fillStyle = darken(c.s1, 0.2); ctx.fillRect(-s * 0.22, k * s * 0.2, s * 0.44, k * s * 0.62);
    ctx.lineWidth = 1.5; ctx.strokeStyle = darken(c.s1, 0.55); ctx.strokeRect(-s * 0.22, k * s * 0.2, s * 0.44, k * s * 0.62);
    ctx.strokeStyle = alpha(lighten(c.s1, 0.6), 0.7); ctx.beginPath(); ctx.moveTo(0, k * s * 0.24); ctx.lineTo(0, k * s * 0.8); ctx.stroke();
  }
  rr(ctx, -s * 0.28, -s * 0.22, s * 0.56, s * 0.44, 4); ctx.fillStyle = c.gold; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = darken(c.gold, 0.45); ctx.stroke();
  rr(ctx, -s * 0.22, -s * 0.17, s * 0.44, s * 0.12, 3); ctx.fillStyle = alpha(lighten(c.gold, 0.6), 0.7); ctx.fill();
  ctx.restore();
}

export class PlaneMotionScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A car moves along a straight road: motion along one line, in one dimension. Then the road shrinks to a strip at the top and a flat sheet with x and y axes appears: two dimensions. Three paths are drawn on it in turn: a car overtaking another, moving out to the other lane and back, seen from above; a kicked ball flying in a curve from the foot to the ground; and a satellite going once round the Earth.';

  get tall() { return this.config?.isPortrait === true; }
  busy() { return this.age < P0 + 2 * PGAP + PDUR + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age;
    this.oneD(ctx, c, a);
    const sk = clamp01((a - SHEET) / 0.35);
    if (sk <= 0) return;
    const S = { x: 12, y: 92, w: 656, h: 418 };
    this.sheet(ctx, c, S, sk);
    drawTag(ctx, c, 'two dimensions', 548, 92, { col: c.s1, alpha: sk });
    const rects = this.tall
      ? [{ x: 30, y: 126, w: 622, h: 110 }, { x: 30, y: 248, w: 400, h: 250 }, { x: 440, y: 248, w: 212, h: 250 }]
      : [[28, 150], [188, 290], [488, 164]].map(([x, w]) => ({ x, y: 130, w, h: 364 }));
    const us = [0, 1, 2].map((i) => clamp01((a - P0 - i * PGAP) / PDUR));
    const ins = [0, 1, 2].map((i) => clamp01((a - P0 - i * PGAP + 0.3) / 0.3));
    if (ins[0] > 0) this.overtake(ctx, c, rects[0], us[0], ins[0]);
    if (ins[1] > 0) this.kick(ctx, c, rects[1], us[1], ins[1]);
    if (ins[2] > 0) this.orbit(ctx, c, rects[2], us[2], ins[2]);
  }

  /** One dimension: road, car and + axis; then the whole group shrinks to a thin strip at the top. */
  oneD(ctx, c, a) {
    const k = inOutSine(clamp01((a - SHRINK) / SHRINK_T)), s = 1 - 0.62 * k;
    const yT = lerp(ROAD_Y, 40, k), tx = 16 - 16 * s, ty = yT - ROAD_Y * s;
    ctx.save();
    ctx.translate(tx, ty); ctx.scale(s, s);
    ctx.globalAlpha = 1 - 0.45 * k;
    const spec = trackSpec({ from: 0, to: 100, x0: 16, x1: 664, y: ROAD_Y });
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 56 });
    const m = 8 + 76 * inOutSine(clamp01((a - 0.2) / RUN1));
    drawCar(ctx, c, { x: spec.toPx(m) - 80, y: spec.y, length: 160, roll: m, tone: 3 });
    ctx.restore();
    if (k < 1) {
      ctx.save(); ctx.translate(tx, ty); ctx.scale(s, s); ctx.globalAlpha = 1 - k;
      drawScale(ctx, c, { vertical: false, at: tr.bottom + 16, p0: 40, p1: 620, from: 0, to: 100, every: 100, side: -1, arrow: '+' });
      ctx.restore();
    }
    const tagX = lerp(340, 284, k), tagY = lerp(150, 40, k);
    drawTag(ctx, c, 'one dimension', tagX, tagY, { col: c.label, align: k > 0.5 ? 'left' : 'center', alpha: 1 - 0.25 * k });
  }

  /** The flat sheet: raised paper, a light grid, faint x and y axes from the lower-left corner. */
  sheet(ctx, c, S, k) {
    drawSheet(ctx, c, S, { alpha: k });
    ctx.save();
    ctx.globalAlpha = k;
    ctx.beginPath(); ctx.rect(S.x + 6, S.y + 6, S.w - 12, S.h - 12); ctx.clip();
    ctx.strokeStyle = alpha(c.stroke, 0.18); ctx.lineWidth = 1;
    for (let x = S.x + 40; x < S.x + S.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, S.y); ctx.lineTo(x, S.y + S.h); ctx.stroke(); }
    for (let y = S.y + S.h - 40; y > S.y; y -= 40) { ctx.beginPath(); ctx.moveTo(S.x, y); ctx.lineTo(S.x + S.w, y); ctx.stroke(); }
    const ox = S.x + 22, oy = S.y + S.h - 20;
    ctx.strokeStyle = alpha(c.labelMuted, 0.6); ctx.fillStyle = alpha(c.labelMuted, 0.6); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(S.x + S.w - 26, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, S.y + 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(S.x + S.w - 14, oy); ctx.lineTo(S.x + S.w - 28, oy - 7); ctx.lineTo(S.x + S.w - 28, oy + 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox, S.y + 28); ctx.lineTo(ox - 7, S.y + 42); ctx.lineTo(ox + 7, S.y + 42); ctx.fill();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('x', S.x + S.w - 30, oy - 22); ctx.fillText('y', ox + 22, S.y + 34);
    ctx.restore();
  }

  /** Path trace: dashed ink along pts, drawn up to the object. */
  trace(ctx, c, pts, k) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = k; ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5; ctx.setLineDash([8, 7]); ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.restore();
  }

  /** Overtaking, top view. The road runs along the panel's long side; the faster car pulls out and back. */
  overtake(ctx, c, P, u, k) {
    const vert = P.h > P.w, Lr = (vert ? P.h : P.w) - 16, Wr = vert ? Math.min(P.w - 40, 128) : Math.min(P.h - 14, 104);
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
    // road coordinates: s along travel from the start end, l to the right of travel
    const pt = (s, l) => (vert ? [cx + l, P.y + P.h - 8 - s] : [P.x + 8 + s, cy + l]);
    const head = vert ? -Math.PI / 2 : 0;
    ctx.save();
    ctx.globalAlpha = k;
    const [rx, ry] = vert ? [cx - Wr / 2, P.y + 8] : [P.x + 8, cy - Wr / 2], rw = vert ? Wr : Lr, rh = vert ? Lr : Wr;
    ctx.fillStyle = mix(c.good, c.bgSurface, 0.45);
    if (vert) ctx.fillRect(rx - 12, ry, rw + 24, rh); else ctx.fillRect(rx, ry - 10, rw, rh + 20);
    rr(ctx, rx, ry, rw, rh, 4); ctx.fillStyle = mix(c.label, c.bgSurface, 0.55); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = darken(mix(c.label, c.bgSurface, 0.55), 0.3); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.bgSurface, 0.5), 0.9); ctx.lineWidth = 3; ctx.setLineDash([16, 12]);
    ctx.beginPath(); const [m0x, m0y] = pt(0, 0), [m1x, m1y] = pt(Lr, 0); ctx.moveTo(m0x, m0y); ctx.lineTo(m1x, m1y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const lane = Wr / 4, car = Math.min(68, Wr * 0.62);
    const slowS = (q) => Lr * (0.38 + 0.1 * q), fastS = (q) => Lr * (0.04 + 0.86 * q);
    const lat = (q) => lane * (1 - 2 * (smooth((q - 0.05) / 0.17) - smooth((q - 0.72) / 0.18)));
    const pts = [];
    for (let i = 0; i <= 40; i++) { const q = (u * i) / 40; pts.push(pt(fastS(q), lat(q))); }
    this.trace(ctx, c, pts, k);
    const [sx, sy] = pt(slowS(u), lane);
    topCar(ctx, c, sx, sy, head, car, c.s1);
    const d = 0.004, q2 = Math.min(1, u + d), q1 = q2 - d;
    const [ax, ay] = pt(fastS(q1), lat(q1)), [bx, by] = pt(fastS(q2), lat(q2));
    topCar(ctx, c, bx, by, Math.atan2(by - ay, bx - ax), car, c.s3);
  }

  /** The kicked ball, side view: a girl's kick, the ball's curved flight to the ground. */
  kick(ctx, c, P, u, k) {
    const ground = P.y + P.h - 14, H = Math.min(124, P.h * 0.78), fx = P.x + H * 0.3;
    ctx.save();
    ctx.globalAlpha = k;
    rr(ctx, P.x, ground, P.w, 12, 4); ctx.fillStyle = mix(c.good, c.bgSurface, 0.2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(c.good, 0.35); ctx.stroke();
    ctx.restore();
    const sk = drawFigure(ctx, c, { x: fx, y: ground, height: H, build: 'teen', facing: 1, pose: { name: 'run', phase: 0.25 } }, figureLook(c, { skin: 2, hairStyle: 'braid', hair: 0, top: 6, bottom: 1 }));
    const foot = sk?.anchors?.foot?.[0] ?? { x: fx + H * 0.25, y: ground };
    const r = Math.max(10, H * 0.085);
    const x0 = Math.max(foot.x + r, fx + H * 0.2), y0 = ground - r, x1 = P.x + P.w - r - 6, peak = Math.min(P.h - 30, P.h * 0.6);
    const at = (q) => [x0 + (x1 - x0) * q, y0 - 4 * peak * q * (1 - q)];
    const pts = [];
    for (let i = 0; i <= 40; i++) pts.push(at((u * i) / 40));
    this.trace(ctx, c, pts, k);
    const [bx, by] = at(u);
    drawBall(ctx, c, { x: bx, y: by, r, tone: 6, shadowY: ground + 2 });
  }

  /** A satellite going once round the Earth (clockwise, from the top). */
  orbit(ctx, c, P, u, k) {
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2, R = Math.min(P.w, P.h) / 2 - 16, re = R * 0.52;
    ctx.save(); ctx.globalAlpha = k;
    earth(ctx, c, cx, cy, re);
    ctx.restore();
    const th0 = -Math.PI / 2, th = th0 + TAU * u;
    ctx.save();
    ctx.globalAlpha = k; ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5; ctx.setLineDash([8, 7]);
    if (u > 0.002) { ctx.beginPath(); ctx.arc(cx, cy, R, th0, th); ctx.stroke(); }
    ctx.restore();
    satellite(ctx, c, cx + R * Math.cos(th), cy + R * Math.sin(th), th, Math.max(26, R * 0.36));
  }
}
