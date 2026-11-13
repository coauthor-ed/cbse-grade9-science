/**
 * PolygonTrackScene - slide blk-l08-s4 "From a rectangle to a circle" (2 beats; Fig 4.23).
 *   b0 'polygon' top view: the athlete (she, a top-view token) runs once round a rectangular
 *                track ABCD at a steady speed (distance along the track grows at a fixed rate).
 *                Her v arrow keeps one length and one direction along each side and swings at
 *                each corner; "turns" counts the corners, 4 for the round. Then she runs once
 *                round a hexagonal track at the same speed: 6 turns. Rest: both tracks, one dim
 *                v arrow per side, counters 4 and 6, she is on the hexagon at its start corner.
 *   b1 'circle'  one track whose number of sides grows 6 -> 8 -> 12 -> 24 -> circle while she
 *                keeps running; her arrow turns more and more often until it turns smoothly
 *                ("turns: all the time"). On the circle she runs one more round and leaves 8
 *                equal v arrows along the tangents. Rest: the circle, 8 arrows, the athlete at the top.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, alpha, darken, lighten, mix } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const RECT = { x: 172, y: 236, hw: 110, hh: 82 };
const HEX = { x: 512, y: 236, r: 106 };
const SPEED = 340;                         // px per second along the track, both tracks
const B0_LEAD = 0.4, HEX_IN = 0.35;
const BIG = { x: 340, y: 270, r: 178 };
const STEPS = [6, 8, 12, 24, 0];           // 0 = the circle
const B1_LEAD = 0.4, B1_ROUND = 2.8, B1_STEP = B1_ROUND / 4;

const rectPts = () => [[RECT.x - RECT.hw, RECT.y - RECT.hh], [RECT.x + RECT.hw, RECT.y - RECT.hh], [RECT.x + RECT.hw, RECT.y + RECT.hh], [RECT.x - RECT.hw, RECT.y + RECT.hh]];
function polyPts(cx, cy, r, n) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = -Math.PI / 2 - Math.PI / n + (k * TAU) / n; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}
const perim = (P) => P.reduce((s, p, i) => s + Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]), 0);

/** Point and heading at distance d along the closed polyline P (clockwise from P[0]). */
function along(P, d) {
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= L + 1e-6 || i === n - 1) { const t = Math.min(1, d / L); return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, h: Math.atan2(b[1] - a[1], b[0] - a[0]), side: i }; }
    d -= L;
  }
  return null;
}

/** The runner seen from above: shoulders across the heading, arms swinging, head with a bun. */
function topRunner(ctx, c, x, y, heading, s, look, phase) {
  const sw = Math.sin(phase * TAU) * s * 0.22;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(heading);
  ctx.beginPath(); ctx.ellipse(3, 4, s * 0.3, s * 0.55, 0, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.3); ctx.fill();
  for (const [side, k] of [[-1, 1], [1, -1]]) {
    ctx.beginPath(); ctx.ellipse(sw * k, side * s * 0.46, s * 0.2, s * 0.09, 0, 0, TAU);
    ctx.fillStyle = look.skin; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = darken(look.skin, 0.35); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.22, s * 0.44, 0, 0, TAU);
  ctx.fillStyle = look.top; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(look.top, 0.4); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-s * 0.04, -s * 0.16, s * 0.1, s * 0.18, 0, 0, TAU); ctx.fillStyle = alpha(lighten(look.top, 0.5), 0.55); ctx.fill();
  const hr = s * 0.21;
  ctx.beginPath(); ctx.arc(s * 0.05, 0, hr, 0, TAU); ctx.fillStyle = look.skin; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = darken(look.skin, 0.35); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.01, 0, hr * 0.9, 0, TAU); ctx.fillStyle = look.hair; ctx.fill();
  ctx.beginPath(); ctx.arc(-s * 0.22, 0, hr * 0.5, 0, TAU); ctx.fillStyle = look.hair; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(lighten(look.hair, 0.4), 0.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.05, -hr * 0.3, hr * 0.3, 0, TAU); ctx.fillStyle = alpha(lighten(look.hair, 0.5), 0.45); ctx.fill();
  ctx.restore();
}

export class PolygonTrackScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Top view of running tracks. An athlete runs once round a rectangular track ABCD at a steady speed: her velocity arrow keeps its direction along each straight side and turns at each corner, 4 turns in a round. On a six-sided track she turns 6 times. Then the track gets more and more sides, 8, 12, 24, until it is a circle, and the direction of her velocity changes all the time; on the circle eight equal arrows lie along the tangents.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() {
    if (this.cur === 0) return this.age < this.b0Times().end + 0.6;
    return this.age < B1_LEAD + 2 * B1_ROUND + 0.6;
  }

  b0Times() {
    const r = B0_LEAD + perim(rectPts()) / SPEED, h0 = r + HEX_IN, h1 = h0 + perim(polyPts(HEX.x, HEX.y, HEX.r, 6)) / SPEED;
    return { r, h0, h1, end: h1 };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this.look = figureLook(c, { ...LOOKS.athlete, top: 3, bottom: 1 });
    if (this.cur === 0) this.polygon(ctx, c); else this.circle(ctx, c);
  }

  /** A top-view running track along P (or a circle when circle is set): grass infield, red band, lane line. */
  track(ctx, c, P, circle, k = 1) {
    const path = () => {
      ctx.beginPath();
      if (circle) ctx.arc(circle.x, circle.y, circle.r, 0, TAU);
      else { P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
    };
    const band = mix(c.bad, c.s8, 0.35), grass = mix(c.bgSurface, c.good, 0.5);
    ctx.save();
    ctx.globalAlpha = k; ctx.lineJoin = 'miter'; ctx.miterLimit = 10;
    path(); ctx.fillStyle = grass; ctx.fill();
    ctx.translate(3, 5); path(); ctx.strokeStyle = alpha(darken(c.stroke, 0.3), 0.3); ctx.lineWidth = 40; ctx.stroke(); ctx.translate(-3, -5);
    path(); ctx.strokeStyle = darken(band, 0.35); ctx.lineWidth = 40; ctx.stroke();
    path(); ctx.strokeStyle = band; ctx.lineWidth = 34; ctx.stroke();
    path(); ctx.strokeStyle = alpha(lighten(band, 0.7), 0.9); ctx.lineWidth = 2.5; ctx.setLineDash([12, 9]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  letter(ctx, c, s, x, y, k = 1) {
    ctx.save();
    ctx.globalAlpha = k; ctx.font = font(c, 800, 28, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = c.bgSurface; ctx.strokeText(s, x, y);
    ctx.fillStyle = c.label; ctx.fillText(s, x, y);
    ctx.restore();
  }

  /** One v arrow centred on a side's midpoint, outside the track. */
  sideArrow(ctx, c, P, i, len, k) {
    const a = P[i], b = P[(i + 1) % P.length], h = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ox = Math.sin(h) * 44, oy = -Math.cos(h) * 44;
    drawMotionArrow(ctx, c, 'v', mx + ox - Math.cos(h) * len / 2, my + oy - Math.sin(h) * len / 2, { length: len, angle: h, label: 'v', alpha: k });
  }

  /** The runner at distance d on P (time tSince the run began, for the arm swing), her live arrow ahead. */
  runner(ctx, c, P, d, len) {
    const p = along(P, d >= perim(P) - 0.5 ? 0 : d);
    topRunner(ctx, c, p.x, p.y, p.h, 48, this.look, d / 46);
    drawMotionArrow(ctx, c, 'v', p.x + Math.cos(p.h) * 18, p.y + Math.sin(p.h) * 18, { length: len, angle: p.h, label: 'v', width: 6.5, head: 19 });
    return p;
  }

  polygon(ctx, c) {
    const a = this.age, T = this.b0Times(), R4 = rectPts(), H6 = polyPts(HEX.x, HEX.y, HEX.r, 6);
    const pr = perim(R4), ph = perim(H6);
    const dR = clamp01((a - B0_LEAD) / (T.r - B0_LEAD)) * pr;
    const hexK = clamp01((a - T.r) / HEX_IN), dH = clamp01((a - T.h0) / (T.h1 - T.h0)) * ph;
    const onHex = a >= T.r;
    this.track(ctx, c, R4, null, onHex ? 0.75 : 1);
    if (hexK > 0) this.track(ctx, c, H6, null, hexK);
    [['A', -1, -1], ['B', 1, -1], ['C', 1, 1], ['D', -1, 1]].forEach(([s, sx, sy]) => this.letter(ctx, c, s, RECT.x + sx * (RECT.hw - 34), RECT.y + sy * (RECT.hh - 32)));
    // Dim arrows: one per side, left as she passes the side's middle.
    const sideMid = (P, i) => { let s = 0; for (let j = 0; j < i; j++) s += Math.hypot(P[j + 1][0] - P[j][0], P[j + 1][1] - P[j][1]); const b = P[(i + 1) % P.length]; return s + Math.hypot(b[0] - P[i][0], b[1] - P[i][1]) / 2; };
    for (let i = 0; i < 4; i++) if (dR >= sideMid(R4, i)) this.sideArrow(ctx, c, R4, i, 70, onHex ? 0.4 : 0.5);
    for (let i = 0; i < 6; i++) if (onHex && dH >= sideMid(H6, i)) this.sideArrow(ctx, c, H6, i, 62, a >= T.h1 ? 0.45 : 0.5);
    // Counters: corners passed.
    const turnsR = dR >= pr - 0.5 ? 4 : along(R4, dR).side;
    const turnsH = dH >= ph - 0.5 ? 6 : along(H6, dH).side;
    drawTag(ctx, c, 'turns: ' + turnsR, RECT.x, 448, { col: c.s1, alpha: onHex ? 0.8 : 1 });
    if (hexK > 0) drawTag(ctx, c, 'turns: ' + turnsH, HEX.x, 448, { col: c.s1, alpha: hexK });
    if (!onHex) this.runner(ctx, c, R4, dR, 76);
    else if (a >= T.h0 || hexK >= 1) this.runner(ctx, c, H6, dH, 66);
    else this.runner(ctx, c, H6, 0, 66);
  }

  circle(ctx, c) {
    const a = this.age, t = a - B1_LEAD;
    const step = Math.min(4, Math.max(0, Math.floor(t / B1_STEP))), n = STEPS[step];
    const u = clamp01(t / B1_ROUND) + clamp01((t - B1_ROUND) / B1_ROUND);   // rounds run, 0..2
    const th = -Math.PI / 2 + TAU * u;
    const len = 76;
    const fade = step > 0 ? clamp01((t - step * B1_STEP) / 0.3) : 1;
    if (fade < 1) this.track(ctx, c, polyPts(BIG.x, BIG.y, BIG.r, STEPS[step - 1]), null, 1 - fade);
    if (n) {
      const P = polyPts(BIG.x, BIG.y, BIG.r, n);
      this.track(ctx, c, P, null, fade);
      // Her point: on the side the ray at th crosses.
      const s = Math.floor(((th + Math.PI / 2 + Math.PI / n) / TAU) * n + 1e-9) % n, A = P[(s + n) % n], B = P[(s + 1) % n];
      const ap = BIG.r * Math.cos(Math.PI / n), mid = -Math.PI / 2 + (s * TAU) / n, rr0 = ap / Math.cos(th - mid);
      const x = BIG.x + rr0 * Math.cos(th), y = BIG.y + rr0 * Math.sin(th), h = Math.atan2(B[1] - A[1], B[0] - A[0]);
      topRunner(ctx, c, x, y, h, 48, this.look, (u * TAU * BIG.r) / 46);
      drawMotionArrow(ctx, c, 'v', x + Math.cos(h) * 18, y + Math.sin(h) * 18, { length: len, angle: h, label: 'v', width: 6.5, head: 19 });
      drawTag(ctx, c, 'turns: ' + n, 22, 40, { col: c.s1, align: 'left' });
      return;
    }
    this.track(ctx, c, null, BIG, fade);
    // Second round on the circle: 8 equal arrows along the tangents, left at equal steps.
    const u2 = clamp01((t - B1_ROUND) / B1_ROUND);
    for (let k = 0; k < 8; k++) {
      if (u2 + 1e-6 < k / 8 || (k === 0 && u2 >= 1)) continue;
      const g = -Math.PI / 2 + (k * TAU) / 8, h = g + Math.PI / 2, ox = Math.cos(g) * 46, oy = Math.sin(g) * 46;
      const px = BIG.x + BIG.r * Math.cos(g) + ox, py = BIG.y + BIG.r * Math.sin(g) + oy;
      const gk = 1 - 0.55 * clamp01(((u2 - k / 8) * B1_ROUND) / 0.5);
      drawMotionArrow(ctx, c, 'v', px - Math.cos(h) * len / 2, py - Math.sin(h) * len / 2, { length: len, angle: h, label: 'v', alpha: gk });
    }
    const x = BIG.x + BIG.r * Math.cos(th), y = BIG.y + BIG.r * Math.sin(th), h = th + Math.PI / 2;
    topRunner(ctx, c, x, y, h, 48, this.look, (u * TAU * BIG.r) / 46);
    drawMotionArrow(ctx, c, 'v', x + Math.cos(h) * 18, y + Math.sin(h) * 18, { length: len, angle: h, label: 'v', width: 6.5, head: 19 });
    drawTag(ctx, c, 'turns: all the time', 22, 40, { col: c.s1, align: 'left' });
  }
}
