// StairKit.js - the energy staircase shared by BohrJumpScene and EnergyLadderScene. Levels are the plain
// units of the lesson: K 0, L 10, M 12, N 13. The steps get smaller going up, as real ones do.
import { alpha, darken, font, inkOn, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { tag } from '../L04/AtomLabels.js';

export const LEVELS = [
  { name: 'K', e: 0 },
  { name: 'L', e: 10 },
  { name: 'M', e: 12 },
  { name: 'N', e: 13 },
];

/** The colour that stands for an amount of energy: one amount, one colour, everywhere. */
export function toneOf(c, e) {
  if (e <= 1) return c.s6;
  if (e === 2) return c.s8;
  if (e === 3) return c.s2;
  if (e === 10) return c.s3;
  if (e === 11) return c.s7;
  if (e === 12) return c.s1;
  if (e === 13) return c.s5;
  return c.labelMuted;
}

/** Tread centres, left to right, K first. o: { x, y (bottom of the block under K), w (tread), unit (px per unit), kick (block under K) }. */
export function stairLayout(o) {
  return LEVELS.map((l, i) => ({ ...l, x: o.x + o.w * (i + 0.5), y: o.y - o.kick - l.e * o.unit }));
}

/** The staircase: a solid chunky block, lit treads, the size of each step cut into its face. */
export function drawStairs(ctx, c, o) {
  const pts = stairLayout(o), T = 12;
  const body = o.col ?? mix(c.s5, c.bgSurface, 0.35);
  ctx.save();
  ctx.globalAlpha *= o.a ?? 1;
  pts.forEach((p, i) => {
    const on = o.active === i;
    const x = o.x + o.w * i;
    rr(ctx, x, p.y, o.w + 1, o.y - p.y + 5, 5);
    ctx.fillStyle = darken(body, 0.3);
    ctx.fill();
    rr(ctx, x, p.y, o.w + 1, o.y - p.y, 5);
    ctx.fillStyle = body;
    ctx.fill();
    rr(ctx, x - 1, p.y - 4, o.w + 2, T, 6);
    ctx.fillStyle = on ? c.warning : lighten(body, 0.34);
    ctx.fill();
    if (i > 0 && o.sizes !== false) {
      const d = p.e - pts[i - 1].e;
      ctx.font = font(c, 800, 24, true);
      ctx.fillStyle = inkOn(c, body);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${d}`, p.x, p.y + 28);
    }
    tag(ctx, c, p.name, x + o.w / 2, o.y + 26, { bg: on ? c.warning : c.raised, size: 22 });
  });
  ctx.restore();
  return pts;
}

/** A packet of light: a thick wave over the length len, heading along angle a from (x, y) at its head. */
export function drawPacket(ctx, x, y, a, len, col, o = {}) {
  const w = o.waves ?? 3, h = o.h ?? 13;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(a);
  ctx.strokeStyle = alpha(col, o.alpha ?? 1);
  ctx.lineWidth = o.lw ?? 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, env = Math.sin(Math.PI * u);
    const px = -len * u, py = Math.sin(u * w * Math.PI * 2) * h * env;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}
