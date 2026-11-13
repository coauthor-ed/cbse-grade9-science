/**
 * StopTime - course-local "time to stop" picture for the stopping-time scenes (L13 catch, airbag,
 * coconut, and the SoftCatchGame). Manual: M/briefs/stop-time-api.md. Pure draw helpers: no scene
 * state, no clock, tokens only. 680 x 520 design frame, text 26 px.
 *
 * The idea, drawn the same way everywhere: a "time to stop" bar first (longer = slower stop), then
 * the F arrow on the object that stops (longer = larger force). For one change in velocity the two
 * are inverse: force length = k / stop time (stopForceLen).
 *
 *   stopTone(c) -> { fill, ink }                       the bar colour (series-5) and its text ink
 *   drawStopBar(ctx, c, { x, y, w, t01, label, tone, alpha, size, h, icon }) -> { box, end, trough, label }
 *   drawStopRow(ctx, c, { x, y, w, t01, label, force, angle, alpha, size, gap, forceLabel }) -> { bar, arrow }
 *   stopForceLen(t, { tRef, lenRef, max }) -> px      inverse law on one scale
 */
import { alpha as mAlpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';

/** The time-bar colour: series-5 fill, its text-safe ink for the label. */
export function stopTone(c, tone) {
  const key = tone && /^s[1-8]$/.test(tone) ? tone : 's5';
  return { fill: c[key], ink: c[key + 'ink'] ?? darken(c[key], 0.3) };
}

/** Arrow length for a stop of time t, on one scale: lenRef at tRef, inverse in t, clamped to max. */
export function stopForceLen(t, o = {}) {
  const tRef = o.tRef ?? 1, lenRef = o.lenRef ?? 44, max = o.max ?? 220;
  return Math.min(max, lenRef * tRef / Math.max(1e-6, t));
}

/** A small stopwatch glyph (steel case, crown, one hand) centred at (x, y), radius r. */
function watch(ctx, c, x, y, r, col) {
  const steel = lighten(c.stroke, 0.3), rim = darken(steel, 0.45);
  ctx.save();
  rr(ctx, x - r * 0.28, y - r - r * 0.42, r * 0.56, r * 0.42, 2); ctx.fillStyle = steel; ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = steel; ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.74, 0, Math.PI * 2); ctx.fillStyle = c.bgSurface; ctx.fill();
  ctx.strokeStyle = mAlpha(rim, 0.6); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.9, Math.PI * 1.05, Math.PI * 1.45);
  ctx.strokeStyle = mAlpha(lighten(steel, 0.6), 0.9); ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.42, y - r * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fillStyle = rim; ctx.fill();
  ctx.restore();
}

/**
 * The "time to stop" bar. (x, y) = top left of the trough; w = whole width (watch glyph + trough);
 * t01 = fill 0..1 of the trough (longer = slower stop). label sits above the trough, left aligned.
 */
export function drawStopBar(ctx, c, o = {}) {
  const x = o.x ?? 30, y = o.y ?? 60, w = o.w ?? 240, h = o.h ?? 26, size = o.size ?? 26;
  const k = o.alpha ?? 1, t01 = Math.max(0, Math.min(1, o.t01 ?? 0));
  const { fill, ink } = stopTone(c, o.tone);
  const icon = o.icon !== false, ix = icon ? h + 10 : 0;
  const tx = x + ix, tw = Math.max(20, w - ix);
  ctx.save(); ctx.globalAlpha *= k;
  if (icon) watch(ctx, c, x + h / 2, y + h / 2 + 2, h * 0.5, fill);
  // Trough: a recessed groove.
  rr(ctx, tx, y, tw, h, h / 2); ctx.fillStyle = mAlpha(c.labelMuted, 0.16); ctx.fill();
  ctx.strokeStyle = mAlpha(c.labelMuted, 0.55); ctx.lineWidth = 1.5; ctx.stroke();
  // Fill: light side, shade side, inner line, rim.
  const fw = t01 > 0 ? Math.max(h, tw * t01) : 0;
  if (fw > 0) {
    rr(ctx, tx, y, fw, h, h / 2); ctx.fillStyle = fill; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = mAlpha(lighten(fill, 0.4), 0.75); ctx.fillRect(tx, y + 3, fw, h * 0.26);
    ctx.fillStyle = mAlpha(darken(fill, 0.22), 0.7); ctx.fillRect(tx, y + h * 0.68, fw, h * 0.32);
    ctx.restore();
    rr(ctx, tx + 3, y + 3, fw - 6, h - 6, (h - 6) / 2); ctx.strokeStyle = mAlpha(lighten(fill, 0.55), 0.6); ctx.lineWidth = 1; ctx.stroke();
    rr(ctx, tx, y, fw, h, h / 2); ctx.strokeStyle = darken(fill, 0.4); ctx.lineWidth = 2; ctx.stroke();
  }
  let lb = null;
  if (o.label) {
    ctx.font = font(c, 800, size, true); ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const ly = y - size * 0.5 - 6;
    ctx.fillText(o.label, x, ly);
    const lw = ctx.measureText(o.label).width;
    lb = { x: x, y: ly - size / 2, w: lw, h: size };
  }
  ctx.restore();
  return { box: { x, y: lb ? lb.y : y, w, h: lb ? y + h - lb.y : h }, end: { x: tx + fw, y: y + h / 2 }, trough: { x: tx, y, w: tw, h }, label: lb };
}

/**
 * One comparison row: the bar first, then the F arrow (kit kind 'F') to its right, on the bar's
 * centre line. force = arrow length in px (one scale per scene); angle PI points it left (its tail
 * then sits at the far right of the row, so the arrow ends near the bar). gap = space after the bar.
 */
export function drawStopRow(ctx, c, o = {}) {
  const bar = drawStopBar(ctx, c, o);
  const gap = o.gap ?? 22, len = o.force ?? 0, ang = o.angle ?? 0, cy = o.y + (o.h ?? 26) / 2;
  const left = Math.abs(ang - Math.PI) < 0.01;
  const x0 = (o.x ?? 30) + (o.w ?? 240) + gap;
  const arrow = len > 0 ? drawMotionArrow(ctx, c, 'F', left ? x0 + len : x0, cy,
    { length: len, angle: ang, label: o.forceLabel ?? '', side: 1, alpha: o.alpha, size: o.size }) : null;
  return { bar, arrow };
}
