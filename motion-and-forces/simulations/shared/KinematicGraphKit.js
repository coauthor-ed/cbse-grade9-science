import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { drawLabelPill } from './PhysicsSceneKit.js';

/**
 * KinematicGraphKit — shared velocity-time-graph geometry and drawing for
 * the les-07 kinematic-equations derivation scenes (blk-l07-s16..s22).
 *
 * Every one of these scenes draws the same underlying picture — a straight
 * line from (0, u) to (t, v) — because that one picture IS the derivation:
 * its slope is v = u + at, its area is s = ut + ½at². Centralizing the axis
 * math and shape drawing here means each scene file only has to say which
 * *pieces* of that one picture are visible on which beat, not re-derive
 * pixel coordinates seven times.
 */

export const GX0 = 190, GY0 = 430, GX1 = 800, GY1 = 90;

/** u, a, t -> every derived pixel coordinate a scene needs, with the axis
 *  scale sized so the line always stays fully on screen. */
export function computeGraph(u, a, t, bounds = { GX0, GY0, GX1, GY1 }) {
  const { GX0: x0, GY0: y0, GX1: x1, GY1: y1 } = bounds;
  const v = u + a * t;
  const tMax = Math.max(t * 1.15, 4);
  const vMax = Math.max(Math.abs(u) + 2, Math.abs(v) + 2, 6);
  const pxPerS = (x1 - x0) / tMax;
  const pxPerV = (y0 - y1) / (vMax * 2);
  const zeroY = y0 - vMax * pxPerV;
  const tx = (tt) => x0 + tt * pxPerS;
  const vy = (vv) => zeroY - vv * pxPerV;
  return { v, tMax, vMax, tx, vy, zeroY, uY: vy(u), tX: tx(t), vY: vy(v), x0, y0, x1, y1 };
}

export function drawVTAxes(ctx, colors, g) {
  ctx.save();
  ctx.strokeStyle = colors.label;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x0, g.y0 + 20);
  ctx.lineTo(g.x1 + 20, g.y0 + 20);
  ctx.moveTo(g.x0, g.y0 + 20);
  ctx.lineTo(g.x0, g.y1 - 20);
  ctx.stroke();

  ctx.strokeStyle = SimDraw.withAlpha(colors.muted, 0.35);
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(g.x0, g.zeroY);
  ctx.lineTo(g.x1 + 20, g.zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '600 12px Inter, system-ui';
  ctx.fillStyle = colors.muted;
  ctx.textAlign = 'center';
  ctx.fillText('Time (s)', (g.x0 + g.x1) / 2, g.y0 + 46);
  ctx.save();
  ctx.translate(g.x0 - 32, (g.y0 + g.y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Velocity (m/s)', 0, 0);
  ctx.restore();
  ctx.restore();
}

/** The straight line itself, from (0,u) to (t,v), with a dashed drop from
 *  the endpoint to the time axis so t reads as a clear interval. */
export function drawVTLine(ctx, colors, g, opts = {}) {
  ctx.save();
  ctx.strokeStyle = opts.color || colors.shape;
  ctx.lineWidth = opts.lineWidth ?? 3;
  ctx.beginPath();
  ctx.moveTo(g.x0, g.uY);
  ctx.lineTo(g.tX, g.vY);
  ctx.stroke();
  if (opts.drop !== false) {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SimDraw.withAlpha(colors.muted, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(g.tX, g.vY);
    ctx.lineTo(g.tX, g.zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/** The two labeled endpoints (0,u) and (t,v), as small filled dots with
 *  pill labels — used on scenes that introduce the notation before any
 *  algebra happens. */
export function drawVTPoints(ctx, colors, g, opts = {}) {
  ctx.save();
  ctx.fillStyle = colors.shape;
  ctx.beginPath();
  ctx.arc(g.x0, g.uY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(g.tX, g.vY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (opts.labelU !== false) drawLabelPill(ctx, `(0, u)`, g.x0 - 8, g.uY - 20, { color: colors.shape });
  if (opts.labelV !== false) drawLabelPill(ctx, `(t, v)`, g.tX + 8, g.vY - 20, { color: colors.shape });
}

/** The rectangle piece of the area split: width t, height u. */
export function drawRectangle(ctx, colors, g, opts = {}) {
  ctx.save();
  ctx.fillStyle = SimDraw.withAlpha(opts.color || colors.wedge, opts.alpha ?? 0.22);
  ctx.beginPath();
  ctx.moveTo(g.x0, g.zeroY);
  ctx.lineTo(g.x0, g.uY);
  ctx.lineTo(g.tX, g.uY);
  ctx.lineTo(g.tX, g.zeroY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = opts.color || colors.wedge;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(g.x0, g.uY);
  ctx.lineTo(g.tX, g.uY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  if (opts.label !== false) {
    ctx.font = '700 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = opts.color || colors.wedge;
    ctx.fillText(opts.labelText || 'rectangle: u × t', g.x0 + (g.tX - g.x0) / 2, (g.zeroY + g.uY) / 2 + 5);
  }
}

/** The triangle piece of the area split: base t, height (v − u). */
export function drawTriangle(ctx, colors, g, opts = {}) {
  ctx.save();
  ctx.fillStyle = SimDraw.withAlpha(opts.color || colors.good, opts.alpha ?? 0.22);
  ctx.beginPath();
  ctx.moveTo(g.x0, g.uY);
  ctx.lineTo(g.tX, g.uY);
  ctx.lineTo(g.tX, g.vY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (opts.label !== false) {
    ctx.font = '700 13px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = opts.color || colors.good;
    ctx.fillText(opts.labelText || '½ × t × (v − u)', g.tX + 6 + (opts.labelDx || 0), (g.uY + g.vY) / 2, );
  }
}

/** Vertical bracket marking the "rise" (v − u) just to the left of the
 *  line's own endpoint column, plus a horizontal bracket under the base
 *  marking the "run" (t) — the rise/run picture behind a = (v-u)/t. */
export function drawRiseRun(ctx, colors, g, opts = {}) {
  const bx = g.x0 - (opts.riseOffset ?? 34);
  ctx.save();
  ctx.strokeStyle = opts.color || colors.good;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, g.uY);
  ctx.lineTo(bx, g.vY);
  ctx.moveTo(bx - 6, g.uY);
  ctx.lineTo(bx + 6, g.uY);
  ctx.moveTo(bx - 6, g.vY);
  ctx.lineTo(bx + 6, g.vY);
  ctx.stroke();
  ctx.restore();
  drawLabelPill(ctx, opts.riseLabel || 'rise: v − u', bx - 46, (g.uY + g.vY) / 2, { color: opts.color || colors.good });

  if (opts.showRun !== false) {
    const ry = g.zeroY + 40;
    ctx.save();
    ctx.strokeStyle = opts.runColor || colors.wedge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x0, ry);
    ctx.lineTo(g.tX, ry);
    ctx.moveTo(g.x0, ry - 6);
    ctx.lineTo(g.x0, ry + 6);
    ctx.moveTo(g.tX, ry - 6);
    ctx.lineTo(g.tX, ry + 6);
    ctx.stroke();
    ctx.restore();
    drawLabelPill(ctx, opts.runLabel || 'run: t', (g.x0 + g.tX) / 2, ry + 18, { color: opts.runColor || colors.wedge });
  }
}

export function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
