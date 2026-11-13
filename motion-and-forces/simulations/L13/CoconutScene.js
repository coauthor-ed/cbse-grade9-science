/**
 * CoconutScene - slide blk-l13-n02 "Cracking a coconut" (1 beat; Fig 6.20).
 *   b0 'coconut' a person (crouched, side view) swings a coconut (green-brown husk, fibres) down fast
 *                onto a hard stone (v arrow along the swing, growing as it speeds up). It stops in a very
 *                short time: the "time to stop" bar fills only a sliver; then a LONG F arrow up on the
 *                coconut from the stone, "very large force"; a crack opens in the shell and a little water
 *                splashes. Rest: cracked coconut on the stone, bar and arrow shown.
 * Time bar first, force arrow second (StopTime). Frames depend on age only (no random).
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, hsl, hslOf } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawStopBar } from '../shared/StopTime.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const GY = 474, FX = 236, FH = 320;                       // ground, person feet x, height
const STONE = { x0: 300, x1: 508, top: 404 };              // the hard stone slab
const RX = 46, RY = 40;                                    // coconut radii
const START = { x: 300, y: 176 }, CTRL = { x: 420, y: 176 };  // swing: a curve from above her head
const IMPACT = { x: 396, y: STONE.top - RY + 2 };
const bez = (u, k) => (1 - u) * (1 - u) * START[k] + 2 * u * (1 - u) * CTRL[k] + u * u * IMPACT[k];
const dbez = (u, k) => 2 * (1 - u) * (CTRL[k] - START[k]) + 2 * u * (IMPACT[k] - CTRL[k]);
const T_HOLD = 0.5, T_SWING = 0.55, T_HIT = T_HOLD + T_SWING;
const BAR = { x: 30, y: 62, w: 220 }, F_LEN = 210;
// Splash drops: fixed launch data (angle, speed px/s, size), no random.
const DROPS = [[-2.2, 260, 7], [-1.9, 330, 5], [-1.55, 300, 6], [-1.25, 340, 5], [-0.95, 270, 7], [-2.5, 200, 5], [-0.7, 210, 5]];

export class CoconutScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A person swings a coconut down fast onto a hard stone. It stops in a very short time, so the time-to-stop bar is only a sliver. The stone pushes up on the coconut with a very large force, shown as a long arrow, and the shell cracks and a little water splashes out.';

  busy() { return this.age < T_HIT + 2.2; }

  /** Coconut centre and speed (px/s) at age a: held up, then an accelerating swing on an arc, then stopped. */
  path(a) {
    const w = clamp01((a - T_HOLD) / T_SWING), u = w * w;           // speeding up along the curve
    const dx = dbez(u, 'x'), dy = dbez(u, 'y'), du = 2 * w / T_SWING;
    const v = a > T_HOLD && a < T_HIT ? Math.hypot(dx, dy) * du : 0;
    return { x: bez(u, 'x'), y: bez(u, 'y'), v, ang: Math.atan2(dy, dx), u };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age, p = this.path(a), hit = a >= T_HIT;
    drawSurface(ctx, c, 'rough', 0, 680, GY, { h: 46, seed: 3 });
    this.stone(ctx, c);
    const crack = ease(a, T_HIT, 0.35);
    const look = figureLook(c, { skin: 3, hairStyle: 'bun', hair: 0, outfit: 'kurti', top: 's3', bottom: 's2', mood: hit ? 'happy' : 'effort' });
    const spec = { x: FX, y: GY, height: FH, facing: 1, pose: { name: 'stand', crouch: 0.3 * p.u, lean: 4 + 16 * p.u },
      hands: [{ x: p.x - RX * 0.9, y: p.y + RY * 0.25 }, { x: p.x - RX * 0.75, y: p.y - RY * 0.45 }] };   // both on the near side: in reach all through the swing
    drawFigure(ctx, c, spec, look, { between: (cx) => this.coconut(cx, c, p.x, p.y, crack) });
    if (hit) this.splash(ctx, c, a - T_HIT);
    // v along the swing, growing with the speed.
    if (p.v > 0) {
      const vmax = Math.hypot(dbez(1, 'x'), dbez(1, 'y')) * 2 / T_SWING;
      drawMotionArrow(ctx, c, 'v', p.x + RX * 0.9, p.y, { length: 30 + 90 * p.v / vmax, angle: p.ang, label: 'v', side: -1 });
    }
    // Time bar first: it fills only a sliver (the stop is very short).
    drawStopBar(ctx, c, { ...BAR, t01: hit ? 0.06 * clamp01((a - T_HIT) / 0.08) : 0, label: 'time to stop' });
    // Then the F arrow up on the coconut from the stone (tail on the coconut's right side).
    const kf = ease(a, T_HIT + 0.05, 0.3);
    if (kf > 0) drawMotionArrow(ctx, c, 'F', IMPACT.x + RX * 0.7, IMPACT.y - 4, { length: F_LEN * kf, angle: -Math.PI / 2, label: 'very large force', side: -1, at: 0.6, alpha: kf });
  }

  /** A flat, hard stone slab with facets, a lit top and a shaded face. */
  stone(ctx, c) {
    const rock = mix(c.stroke, c.labelMuted, 0.35), lit = lighten(rock, 0.3), dk = darken(rock, 0.35);
    const { x0, x1, top } = STONE;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0 - 10, GY); ctx.lineTo(x0, top + 14); ctx.lineTo(x0 + 26, top); ctx.lineTo(x1 - 30, top - 2); ctx.lineTo(x1, top + 12); ctx.lineTo(x1 + 12, GY); ctx.closePath();
    ctx.fillStyle = rock; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = alpha(lit, 0.85); ctx.beginPath(); ctx.moveTo(x0, top + 14); ctx.lineTo(x0 + 26, top); ctx.lineTo(x1 - 30, top - 2); ctx.lineTo(x1, top + 12); ctx.lineTo(x1 - 20, top + 22); ctx.lineTo(x0 + 16, top + 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha(dk, 0.55); ctx.beginPath(); ctx.moveTo(x1 - 60, GY); ctx.lineTo(x1 - 20, top + 22); ctx.lineTo(x1 + 12, GY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha(dk, 0.6); ctx.lineWidth = 2;
    for (const [ax, ay, bx, by] of [[x0 + 60, top + 40, x0 + 90, top + 62], [x0 + 140, top + 34, x0 + 120, top + 58]]) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = darken(rock, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** The coconut: green-brown husk with fibre lines; k > 0 opens a crack with white flesh in the gap. */
  coconut(ctx, c, x, y, k) {
    const husk = mix(c.gold, c.s3, 0.38), base = hsl(hslOf(husk).h, 0.4, 0.38), lit = lighten(base, 0.3), dk = darken(base, 0.38);
    const brown = hsl(hslOf(c.gold).h, 0.38, 0.32);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.25);
    ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = alpha(dk, 0.6); ctx.beginPath(); ctx.ellipse(RX * 0.35, RY * 0.4, RX, RY, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lit, 0.7); ctx.beginPath(); ctx.ellipse(-RX * 0.35, -RY * 0.45, RX * 0.45, RY * 0.28, -0.3, 0, Math.PI * 2); ctx.fill();
    // A dry brown patch over the green husk, then fibres: short strands along the nut (fixed layout).
    ctx.fillStyle = alpha(brown, 0.8); ctx.beginPath(); ctx.ellipse(RX * 0.3, RY * 0.15, RX * 0.62, RY * 0.7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const t = i * 2.39996, r = Math.sqrt((i + 0.5) / 34) * 0.92, fx = Math.cos(t) * RX * r, fy = Math.sin(t) * RY * r;
      const len = 7 + (i % 3) * 3, sl = fy / RY * 0.5;
      ctx.strokeStyle = i % 2 ? alpha(dk, 0.7) : alpha(lit, 0.75); ctx.lineWidth = i % 2 ? 2 : 1.5;
      ctx.beginPath(); ctx.moveTo(fx - len / 2, fy - sl * len / 2); ctx.quadraticCurveTo(fx, fy - sl * len / 2 + 2, fx + len / 2, fy + sl * len / 2); ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, 0, Math.PI * 2); ctx.strokeStyle = darken(base, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = brown; ctx.lineWidth = 2; ctx.lineCap = 'round';           // a tuft of loose fibres at the stem end
    for (const [ty, tx] of [[-8, -9], [-3, -12], [3, -11], [8, -7]]) { ctx.beginPath(); ctx.moveTo(-RX + 2, ty * 0.6); ctx.quadraticCurveTo(-RX - tx * 0.4, ty, -RX + tx, ty * 1.6); ctx.stroke(); }
    // Crack: a zigzag across the shell that widens, the white flesh showing in the gap.
    if (k > 0) {
      const pts = [[-RX * 0.2, RY * 0.98], [-RX * 0.05, RY * 0.5], [-RX * 0.28, RY * 0.15], [-RX * 0.02, -RY * 0.2], [-RX * 0.2, -RY * 0.55], [0.02 * RX, -RY * 0.98]];
      const n = Math.max(2, Math.ceil(pts.length * k)), w = 5 * k;
      const flesh = hsl(hslOf(c.s2).h, 0.3, 0.95);
      ctx.beginPath();
      for (let i = 0; i < n; i++) ctx.lineTo(pts[i][0] - w, pts[i][1]);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + w, pts[i][1]);
      ctx.closePath(); ctx.fillStyle = flesh; ctx.fill();
      ctx.strokeStyle = darken(base, 0.6); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  /** A little water: drops thrown from the crack fall back (gravity), then a small wet patch on the stone. */
  splash(ctx, c, s) {
    const g = 900, wet = c.water, rim = darken(wet, 0.3);
    ctx.save();
    for (const [ang, sp, r] of DROPS) {
      const t = Math.min(s, 0.62);
      const x = IMPACT.x - 4 + Math.cos(ang) * sp * t, y = IMPACT.y - RY * 0.6 + Math.sin(ang) * sp * t + 0.5 * g * t * t;
      if (y > STONE.top - 2 || s > 0.62) continue;
      ctx.globalAlpha = 1 - clamp01((s - 0.35) / 0.3);
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2); ctx.fillStyle = wet; ctx.fill();
      ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = alpha(lighten(wet, 0.7), 0.9); ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = clamp01((s - 0.3) / 0.3) * 0.6;
    ctx.beginPath(); ctx.ellipse(IMPACT.x - 10, STONE.top + 6, 70, 7, 0, 0, Math.PI * 2); ctx.fillStyle = alpha(wet, 0.55); ctx.fill();
    ctx.restore();
  }
}
