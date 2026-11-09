// StripKit - L05's paper strip and gas jar, so every lesson 5 scene shows the same paper, the same pencil
// line and the same three dyes of black sketch-pen ink. Paper stays pale in both themes; only the light on it changes.
import { alpha, darken, lighten, luma, mix, rr } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

const TAU = Math.PI * 2;

/** The three dyes of the black ink, furthest first. rf: distance moved as a share of the water's climb above the line. */
export const DYES = [
  { key: 's2', name: 'yellow', rf: 0.82 },
  { key: 's4', name: 'pink', rf: 0.52 },
  { key: 's1', name: 'blue', rf: 0.26 },
];

export const isLight = (c) => luma(c.bgDeep) > 0.5;
export const paperTone = (c) => (isLight(c) ? lighten(c.bgSurface, 0.4) : mix(c.label, c.bgSurface, 0.1));
export const inkTone = (c) => (isLight(c) ? darken(c.label, 0.2) : c.bgDeep);
export const pencilTone = (c) => mix(inkTone(c), paperTone(c), 0.32);

/** One colour on wet paper: a soft skirt, a dense core, never a flat disc. */
export function colourSpot(ctx, x, y, rx, ry, col, a = 1) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx * 1.25);
  g.addColorStop(0, alpha(darken(col, 0.1), 0.98 * a));
  g.addColorStop(0.55, alpha(col, 0.92 * a));
  g.addColorStop(0.8, alpha(col, 0.42 * a));
  g.addColorStop(1, alpha(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 1.25, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * A strip of paper, box { x, y, w, h }, with a shadow side and fibres. o: { lineY, frontY (the wet edge, or null) }.
 * The wet part reads faintly blue under a soft climbing edge. The pencil line is drawn after the wet part: it never moves.
 */
export function paperStrip(ctx, c, b, o = {}) {
  const paper = paperTone(c);
  ctx.save();
  ctx.shadowColor = alpha(darken(c.bgDeep, 0.5), 0.3);
  ctx.shadowBlur = 9; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
  ctx.fillStyle = paper;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
  ctx.strokeStyle = alpha(darken(paper, 0.3), 0.2); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 26; i++) {
    const y = b.y + ((i * 41) % Math.max(1, Math.round(b.h)));
    ctx.moveTo(b.x + (i % 4) * 7, y); ctx.lineTo(b.x + b.w - ((i * 3) % 11), y + ((i % 3) - 1) * 2);
  }
  ctx.stroke();
  if (o.frontY != null && o.frontY < b.y + b.h) {
    const fy = Math.max(b.y, o.frontY);
    ctx.fillStyle = alpha(mix(paper, c.water, 0.22), 0.95);
    ctx.fillRect(b.x, fy, b.w, b.y + b.h - fy);
    ctx.fillStyle = alpha(darken(mix(paper, c.water, 0.4), 0.06), 0.9);
    ctx.beginPath();
    ctx.moveTo(b.x, fy);
    for (let i = 0; i <= 8; i++) ctx.lineTo(b.x + (b.w * i) / 8, fy + Math.sin(i * 1.9) * 1.6);
    ctx.lineTo(b.x + b.w, fy + 3); ctx.lineTo(b.x, fy + 3);
    ctx.closePath(); ctx.fill();
  }
  if (o.lineY != null) {
    ctx.strokeStyle = pencilTone(c); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(b.x + 3, o.lineY); ctx.lineTo(b.x + b.w - 3, o.lineY); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = alpha(darken(paper, 0.35), 0.75); ctx.lineWidth = 1.5;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
}

/** The gas jar and what stands in it. Returns the glass box. o: { surface (y of the water, or null), fill, opacity }. */
export function gasJarBack(ctx, c, box, o = {}) {
  const g = glassBox('cylinder', box.x, box.y, box.w, box.h, { wall: 7, r: 14 });
  drawGlass(ctx, c, g);
  if (o.surface != null) drawGlassLiquid(ctx, c, g, { surface: o.surface, fill: o.fill ?? c.water, opacity: o.opacity ?? 0.55, front: false });
  return g;
}

/** The front of the jar, then the watch glass sitting on its mouth (a shallow dish seen a little from above). */
export function gasJarFront(ctx, c, g) {
  drawGlassFront(ctx, c, g);
  const y = g.y + 1, rx = g.w / 2 + 12;
  ctx.fillStyle = alpha(c.glass, 0.22);
  ctx.beginPath(); ctx.ellipse(g.cx, y, rx, 11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = alpha(darken(c.glass, 0.12), 0.75); ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = alpha(lighten(c.glass, 0.5), 0.8); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(g.cx - 10, y - 3, rx * 0.55, 5, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
}

export { rr };
