/**
 * ChapterFourCardScene - slide blk-l08-n04 "The chapter at a glance" (2 beats; Fig 4.33).
 *   b0 'glance' a chapter card: seven tiles in two columns, each a small drawn icon and 1-3 words,
 *               lighting in order (0.4 s apart): reference point, distance and displacement, speed
 *               and velocity, acceleration, graphs, equations, circular motion. The card IS the point
 *               (seven short labels). Rest: all lit.
 *   b1 'home'   the card fades; a card disc (Fig 4.33) with 1-12 near the edge and A-F near the centre
 *               spins up, slowly then faster. Each mark smears into an arc whose length is
 *               radius x angular speed x exposure, so the numbers blur first and the letters stay
 *               readable longer. Two v arrows at the top: long at the edge, short near the centre,
 *               both growing with the spin. A small phone beside it draws a jittery accelerometer
 *               line. Rest: a fixed fast-spin frame (blur drawn, nothing loops).
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawSpeedometer, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawSheet } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const CARD = { x: 16, y: 16, w: 648, h: 488 };
const TILE_W = 304, TILE_H = 104, GX = 14, GY = 14;
const LIGHT0 = 0.3, LIGHT_DT = 0.4;
const TILES = [
  { icon: 'origin', text: ['reference', 'point'] },
  { icon: 'path', text: ['distance and', 'displacement'] },
  { icon: 'speed', text: ['speed and', 'velocity'] },
  { icon: 'accel', text: ['acceleration'] },
  { icon: 'graph', text: ['graphs'] },
  { icon: 'eq', text: ['equations'] },
  { icon: 'circle', text: ['circular', 'motion'] },
];
// b1: the disc
const DISC = { x: 236, y: 290, r: 178, rNum: 146, rLet: 80 };
const FADE = 0.6, DISC_IN = 0.5, SPIN_AT = 1.0, SPIN = 3.2, W_MAX = 14, EXPO = 0.009;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const PHONE = { x: 532, y: 150, w: 124, h: 236 };
const hash = (i) => { const s = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return s - Math.floor(s); };

function tileRect(i) {
  const col = i % 2, row = Math.floor(i / 2);
  const x0 = CARD.x + GX + (i === 6 ? (TILE_W + GX) / 2 : col * (TILE_W + GX));
  return { x: x0, y: CARD.y + GY + row * (TILE_H + GY), w: TILE_W, h: TILE_H };
}

export class ChapterFourCardScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A chapter card with seven tiles that light up in turn: reference point, distance and displacement, speed and velocity, acceleration, graphs, equations, and circular motion, each with a small picture. Then a card disc with the numbers 1 to 12 near its edge and the letters A to F near its centre spins, slowly and then faster. The numbers smear into blurred arcs first, because they move faster; the letters stay readable longer. A long velocity arrow at the edge and a short one near the centre show the difference. Beside it a phone shows a jittery accelerometer line.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.cur === 0 ? this.age < LIGHT0 + 7 * LIGHT_DT + 0.5 : this.age < SPIN_AT + SPIN + 0.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) { this.card(ctx, c, this.age); return; }
    const a = this.age, fk = inOutSine(clamp01(a / FADE));
    if (fk < 1) {
      ctx.save(); ctx.globalAlpha = 1 - fk;
      ctx.translate(340, 260); ctx.scale(1 - 0.3 * fk, 1 - 0.3 * fk); ctx.translate(-340, -260);
      this.card(ctx, c, 99);
      ctx.restore();
    }
    const dk = clamp01((a - DISC_IN) / 0.5);
    if (dk > 0) this.home(ctx, c, a, dk);
  }

  // -- b0: the card ----------------------------------------------------------------------------

  card(ctx, c, a) {
    drawSheet(ctx, c, CARD);
    TILES.forEach((t, i) => {
      const on = clamp01((a - LIGHT0 - i * LIGHT_DT) / 0.3);
      this.tile(ctx, c, tileRect(i), t, i, on);
    });
  }

  tile(ctx, c, R, t, i, on) {
    const tone = c['s' + (1 + (i % 8))] ?? c.s1, bg = mix(tone, c.bgSurface, 0.88), pop = on > 0 && on < 1 ? 1 + 0.05 * Math.sin(Math.PI * on) : 1;
    ctx.save();
    ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.scale(pop, pop); ctx.translate(-R.x - R.w / 2, -R.y - R.h / 2);
    ctx.globalAlpha = 0.28 + 0.72 * on;
    rr(ctx, R.x, R.y + 4, R.w, R.h, 14); ctx.fillStyle = alpha(darken(tone, 0.4), 0.35 * on); ctx.fill();
    rr(ctx, R.x, R.y, R.w, R.h, 14); ctx.fillStyle = on > 0 ? mix(c.bgSurface, bg, on) : c.bgSurface; ctx.fill();
    rr(ctx, R.x + 8, R.y + 4, R.w - 16, 4, 2); ctx.fillStyle = alpha(lighten(bg, 0.7), 0.7 * on); ctx.fill();
    rr(ctx, R.x, R.y, R.w, R.h, 14); ctx.lineWidth = 2.5; ctx.strokeStyle = mix(c.stroke, darken(tone, 0.2), on); ctx.stroke();
    // icon well
    const I = { x: R.x + 10, y: R.y + 10, w: 118, h: R.h - 20 };
    rr(ctx, I.x, I.y, I.w, I.h, 10); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(darken(tone, 0.2), 0.4); ctx.stroke();
    ctx.save(); rr(ctx, I.x, I.y, I.w, I.h, 10); ctx.clip();
    this.icon(ctx, c, t.icon, I);
    ctx.restore();
    // words
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.label;
    const lines = t.text, x = I.x + I.w + 14, y0 = R.y + R.h / 2 - (lines.length - 1) * 16;
    lines.forEach((s, k) => ctx.fillText(s, x, y0 + k * 32));
    ctx.restore();
  }

  icon(ctx, c, kind, I) {
    const cx = I.x + I.w / 2, cy = I.y + I.h / 2;
    if (kind === 'origin') {
      const spec = trackSpec({ from: -3, to: 5, x0: I.x - 6, x1: I.x + I.w + 6, y: cy + 16 });
      drawTrack(ctx, c, spec, { kind: 'track', ticks: false, depth: 26, lanes: 1 });
      const ox = spec.toPx(0);
      ctx.beginPath(); ctx.moveTo(ox, cy + 3); ctx.lineTo(ox, cy + 29); ctx.strokeStyle = c.annot; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(ox, cy + 16, 6, 0, TAU); ctx.fillStyle = c.annot; ctx.fill();
      ctx.font = font(c, 900, 28, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.strokeText('O', ox, cy - 18); ctx.fillStyle = c.annot; ctx.fillText('O', ox, cy - 18);
    } else if (kind === 'path') {
      const A = { x: I.x + 18, y: cy + 22 }, B = { x: I.x + I.w - 18, y: cy + 14 };
      ctx.save(); ctx.lineCap = 'round';
      const curve = () => { ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.bezierCurveTo(A.x + 10, I.y - 20, B.x - 30, I.y + 2, B.x, B.y); };
      curve(); ctx.strokeStyle = darken(c.s5, 0.35); ctx.lineWidth = 11; ctx.stroke();
      curve(); ctx.strokeStyle = c.s5; ctx.lineWidth = 7; ctx.stroke();
      ctx.restore();
      drawMotionArrow(ctx, c, 's', A.x, A.y, { length: Math.hypot(B.x - A.x, B.y - A.y), angle: Math.atan2(B.y - A.y, B.x - A.x), label: '' });
      for (const p of [A, B]) { ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, TAU); ctx.fillStyle = c.label; ctx.fill(); }
    } else if (kind === 'speed') {
      drawSpeedometer(ctx, c, { x: cx, y: cy + 4, r: 40, max: 120, value: 70, unit: '' });
    } else if (kind === 'accel') {
      drawCar(ctx, c, { x: cx - 4, y: I.y + I.h - 6, length: 84, tone: 6 });
      drawMotionArrow(ctx, c, 'a', cx - 50, I.y + 14, { length: 60, angle: 0, label: 'a', side: -1, at: 1.35 });
    } else if (kind === 'graph') {
      const x0 = I.x + 16, y0 = I.y + I.h - 12, x1 = I.x + I.w - 10, y1 = I.y + 10;
      ctx.save();
      ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      const P = (u) => ({ x: x0 + 8 + u * (x1 - x0 - 16), y: y0 - 8 - u * (y0 - y1 - 14) });
      const A = P(0.25), B = P(0.75);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, A.y); ctx.lineTo(B.x, B.y); ctx.closePath(); ctx.fillStyle = alpha(c.annot, 0.18); ctx.fill();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = c.annot; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
      const p0 = P(0), p1 = P(1);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.strokeStyle = c.s1; ctx.lineWidth = 4.5; ctx.stroke();
      ctx.restore();
    } else if (kind === 'eq') {
      ctx.font = font(c, 900, 27, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = darken(c.s6, 0.15);
      ctx.fillText('v = u + at', cx, cy + 2);
    } else if (kind === 'circle') {
      const r = 26, ox = cx - 28, oy = cy + 10, th = -Math.PI / 2;
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, TAU); ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      const px = ox + r * Math.cos(th), py = oy + r * Math.sin(th);
      drawMotionArrow(ctx, c, 'v', px, py, { length: 58, angle: 0, label: 'v', side: -1, at: 0.8 });
      drawBall(ctx, c, { x: px, y: py, r: 9, tone: 6 });
    }
  }

  // -- b1: the disc and the phone ---------------------------------------------------------------

  /** Spin: angular speed rises as u squared (slow, then faster); the angle is its integral. Frozen at the end. */
  spin(a) {
    const u = clamp01((a - SPIN_AT) / SPIN);
    return { w: W_MAX * u * u, th: (W_MAX * SPIN * u * u * u) / 3, u };
  }

  home(ctx, c, a, k) {
    const { w, th, u } = this.spin(a);
    ctx.save();
    ctx.globalAlpha = k;
    this.disc(ctx, c, th, w);
    // the two v arrows at the top: v = r x angular speed (same scale for both)
    if (u > 0.05) {
      const s = 0.62 / W_MAX * w, al = clamp01((u - 0.05) / 0.15);
      drawMotionArrow(ctx, c, 'v', DISC.x, DISC.y - DISC.rNum, { length: Math.max(1, DISC.rNum * s), angle: 0, label: 'v', alpha: al });
      drawMotionArrow(ctx, c, 'v', DISC.x, DISC.y - DISC.rLet, { length: Math.max(1, DISC.rLet * s), angle: 0, label: 'v', alpha: al });
    }
    this.phone(ctx, c, a);
    ctx.restore();
  }

  disc(ctx, c, th, w) {
    const { x, y, r } = DISC, board = mix(c.s8, c.bgSurface, 0.72), ink = c.label;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x + 8, y + 12, r + 2, r, 0, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.35), 0.35); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, 10, x, y, r);
    g.addColorStop(0, lighten(board, 0.3)); g.addColorStop(1, darken(board, 0.1));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    // cardboard edge: a cut layer and the rim
    ctx.beginPath(); ctx.arc(x, y, r - 5, 0, TAU); ctx.strokeStyle = alpha(darken(board, 0.3), 0.45); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r - 4, Math.PI * 1.05, Math.PI * 1.6); ctx.strokeStyle = alpha(lighten(board, 0.7), 0.8); ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = darken(board, 0.5); ctx.lineWidth = 3; ctx.stroke();
    // the inner pencil circle (letters' ring) turns with the disc; it stays a circle, so no blur
    ctx.beginPath(); ctx.arc(x, y, DISC.rLet + 24, 0, TAU); ctx.strokeStyle = alpha(ink, 0.45); ctx.lineWidth = 2; ctx.stroke();
    // marks: numbers 1-12 (12 at the top), letters A-F (A at the top), smeared by r x w x exposure
    for (let i = 0; i < 12; i++) this.mark(ctx, c, String(i + 1), DISC.rNum, th + ((i + 1) * TAU) / 12, w, 30, ink);
    for (let i = 0; i < 6; i++) this.mark(ctx, c, LETTERS[i], DISC.rLet, th + (i * TAU) / 6, w, 32, mix(c.s5, c.label, 0.45));
    // centre pin
    ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fillStyle = c.s6; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = darken(c.s6, 0.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, TAU); ctx.fillStyle = alpha(lighten(c.s6, 0.7), 0.9); ctx.fill();
    ctx.restore();
  }

  /** One mark at radius rr and angle q (0 = top, clockwise). Its smear spans angle w x EXPO behind it. */
  mark(ctx, c, s, rr0, q, w, size, col) {
    const { x, y } = DISC, smear = w * EXPO, arcLen = rr0 * smear;
    const n = Math.max(1, Math.min(24, Math.ceil(arcLen / 1.5)));
    ctx.save();
    ctx.font = font(c, 800, size, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    if (n > 1) {
      // the streak under the copies: a soft band along the arc
      ctx.beginPath(); ctx.arc(x, y, rr0, q - Math.PI / 2 - smear, q - Math.PI / 2);
      ctx.strokeStyle = alpha(col, Math.min(0.16, 3 / Math.max(arcLen, 1))); ctx.lineWidth = size * 0.75; ctx.lineCap = 'round'; ctx.stroke();
    }
    const each = n > 1 ? Math.min(1, 1.5 / n) : 1;
    for (let j = 0; j < n; j++) {
      const qq = q - (smear * j) / Math.max(1, n - 1);
      ctx.save();
      ctx.globalAlpha *= each;
      ctx.translate(x + rr0 * Math.sin(qq), y - rr0 * Math.cos(qq)); ctx.rotate(qq);
      ctx.fillText(s, 0, 1);
      ctx.restore();
    }
    ctx.restore();
  }

  /** A phone (no brand text): rimmed body, dark screen with a light grid and a jittery accelerometer line. */
  phone(ctx, c, a) {
    const P = PHONE, body = mix(c.label, c.s5, 0.2), screen = darken(mix(c.s5, c.s1, 0.5), 0.75);
    ctx.save();
    rr(ctx, P.x + 5, P.y + 8, P.w, P.h, 20); ctx.fillStyle = alpha(darken(c.stroke, 0.35), 0.35); ctx.fill();
    rr(ctx, P.x, P.y, P.w, P.h, 20); ctx.fillStyle = body; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = darken(body, 0.5); ctx.stroke();
    rr(ctx, P.x + 4, P.y + 3, P.w - 8, 5, 2.5); ctx.fillStyle = alpha(lighten(body, 0.6), 0.5); ctx.fill();
    const S = { x: P.x + 9, y: P.y + 24, w: P.w - 18, h: P.h - 48 };
    rr(ctx, S.x, S.y, S.w, S.h, 8); ctx.fillStyle = screen; ctx.fill();
    ctx.beginPath(); ctx.arc(P.x + P.w / 2, P.y + 13, 3.5, 0, TAU); ctx.fillStyle = darken(body, 0.5); ctx.fill();
    rr(ctx, P.x + P.w / 2 - 18, P.y + P.h - 15, 36, 5, 2.5); ctx.fillStyle = alpha(lighten(body, 0.5), 0.6); ctx.fill();
    ctx.save(); rr(ctx, S.x, S.y, S.w, S.h, 8); ctx.clip();
    ctx.strokeStyle = alpha(lighten(screen, 0.6), 0.25); ctx.lineWidth = 1;
    for (let gy = S.y + 18; gy < S.y + S.h; gy += 24) { ctx.beginPath(); ctx.moveTo(S.x, gy); ctx.lineTo(S.x + S.w, gy); ctx.stroke(); }
    const mid = S.y + S.h / 2;
    ctx.strokeStyle = alpha(lighten(screen, 0.7), 0.6); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(S.x, mid); ctx.lineTo(S.x + S.w, mid); ctx.stroke();
    // the trace: small irregular wiggles about zero, drawn on left to right
    const u = clamp01((a - SPIN_AT) / SPIN), n = 60, m = Math.max(2, Math.round(n * u));
    ctx.beginPath();
    for (let i = 0; i < m; i++) {
      const xx = S.x + 4 + (i / (n - 1)) * (S.w - 8);
      const yy = mid + 13 * (hash(i) - 0.5) + 7 * Math.sin(i * 0.9) * (hash(i + 40) - 0.3);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.strokeStyle = lighten(c.s3, 0.25); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
}

