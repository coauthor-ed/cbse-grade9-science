// GrainKit.js - the white grain, the kitchen jar and the bulb circuit of lessons 1 to 3.
// Pure drawing: nothing here reads a beat or a clock. Colours come from the palette passed in.
import { alpha, darken, lighten, luma, mix, rr, ellipse, font, mulberry32, drawShadow } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';

const TAU = Math.PI * 2;
export const isDay = (c) => luma(c.bgDeep) > 0.5;
/** The white of a crystal: it must read on the dark plate in both themes. */
export const snow = (c) => (isDay(c) ? c.bgSurface : c.label);

/** Ink for a good, bad or accent chip: dark chips in the light theme take white. */
export const chipInk = (c) => (isDay(c) ? c.bgSurface : c.bgDeep);

/** A dark slab that white grains read on, in both themes. */
export function plateTone(c) { return isDay(c) ? mix(c.label, c.s5, 0.2) : mix(c.raised, c.s5, 0.2); }

/** A chunky white crystal block, lit from the top left. The same family for salt and sugar: the eye cannot tell them apart. */
export function drawGrain(ctx, c, x, y, r, o = {}) {
  const rnd = mulberry32(o.seed ?? 3);
  const tilt = (rnd() - 0.5) * 0.34;
  const vec = (a, k) => ({ x: Math.cos(a + tilt) * r * k, y: Math.sin(a + tilt) * r * k });
  const up = vec(-Math.PI / 2, 0.98 + rnd() * 0.1);
  const ri = vec(Math.PI / 6, 0.96 + rnd() * 0.14);
  const le = vec((5 * Math.PI) / 6, 0.96 + rnd() * 0.14);
  const P = (a, b, k = 1) => ({ x: x + (a.x + (b ? b.x : 0)) * k, y: y + (a.y + (b ? b.y : 0)) * k + r * 0.08 });
  const v = { x, y: y + r * 0.08 };
  const U = P(up), R = P(ri), L0 = P(le), UR = P(up, ri), UL = P(up, le), LR = P(ri, le);
  const base = snow(c);
  const mid = mix(base, c.glass, isDay(c) ? 0.3 : 0.24);
  const dark = mix(base, c.s5, isDay(c) ? 0.42 : 0.46);
  const face = (pts, col) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  };
  const rim = isDay(c) ? darken(dark, 0.34) : lighten(dark, 0.12);
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.lineJoin = 'round';
  face([U, UR, R, LR, L0, UL], base);
  ctx.lineWidth = Math.max(5, r * 0.11); ctx.strokeStyle = rim; ctx.stroke();
  face([v, U, UR, R], mid);
  face([v, R, LR, L0], dark);
  face([v, L0, UL, U], base);
  // a stepped chip on the top face, as real crystals have
  const q = (p, k) => ({ x: v.x + (p.x - v.x) * k, y: v.y + (p.y - v.y) * k });
  ctx.strokeStyle = alpha(rim, 0.55); ctx.lineWidth = Math.max(2, r * 0.03); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(v.x, v.y); ctx.lineTo(U.x, U.y); ctx.moveTo(v.x, v.y); ctx.lineTo(R.x, R.y); ctx.moveTo(v.x, v.y); ctx.lineTo(L0.x, L0.y); ctx.stroke();
  const a0 = q(UL, 0.34), a1 = q(UL, 0.66);
  ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
  if (lookOf().gloss > 0 && r > 12) {
    ellipse(ctx, x - r * 0.46, y - r * 0.5, r * 0.15, r * 0.06, -0.6);
    ctx.fillStyle = alpha(lighten(base, 0.8), 0.95);
    ctx.fill();
  }
  ctx.restore();
}

/** A dark slab plate seen a little from above, (x, y) its centre. */
export function drawPlate(ctx, c, x, y, rx, ry = rx * 0.2) {
  drawShadow(ctx, c, x, y + ry + 4, rx * 1.02, ry * 0.5);
  const t = plateTone(c);
  ellipse(ctx, x, y + 7, rx, ry); ctx.fillStyle = darken(t, 0.3); ctx.fill();
  ellipse(ctx, x, y, rx, ry); ctx.fillStyle = t; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = lighten(t, 0.18); ctx.stroke();
  ellipse(ctx, x, y, rx * 0.8, ry * 0.76); ctx.fillStyle = darken(t, 0.14); ctx.fill();
}

/** A real bulb: glass globe, filament, screw base. (x, y): the globe centre, k: how hot 0..1. */
export function drawBulb(ctx, c, x, y, r, k = 0) {
  const L = lookOf();
  const warm = c.warning, cold = mix(c.glass, c.bgSurface, 0.55);
  ctx.save();
  if (k > 0.01 && L.gloss > 0) {
    const R = r * (2 + k * 1.1);
    const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, R);
    g.addColorStop(0, alpha(warm, 0.6 * k));
    g.addColorStop(1, alpha(warm, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  }
  // screw base
  const by = y + r * 0.88, bw = r * 0.82, bh = r * 0.62;
  rr(ctx, x - bw / 2, by, bw, bh, 5); ctx.fillStyle = mix(c.waste, c.label, 0.2); ctx.fill();
  ctx.strokeStyle = darken(c.waste, 0.2); ctx.lineWidth = 2.5; ctx.stroke();
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x - bw / 2 + 3, by + (bh * i) / 3); ctx.lineTo(x + bw / 2 - 3, by + (bh * i) / 3);
    ctx.stroke();
  }
  // globe
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = k > 0 ? mix(cold, lighten(warm, 0.45), k) : cold;
  ctx.fill();
  ctx.lineWidth = Math.max(3, 3.5 * L.rim);
  ctx.strokeStyle = k > 0.3 ? darken(warm, 0.12) : (isDay(c) ? darken(c.glass, 0.15) : c.glass);
  ctx.stroke();
  // filament
  ctx.strokeStyle = k > 0 ? mix(c.stroke, warm, Math.min(1, k * 2)) : c.stroke;
  ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.26, by); ctx.lineTo(x - r * 0.3, y);
  for (let i = 0; i < 4; i++) ctx.lineTo(x - r * 0.3 + (r * 0.6 * (i + 0.5)) / 4, y + (i % 2 ? r * 0.12 : -r * 0.2));
  ctx.lineTo(x + r * 0.3, y); ctx.lineTo(x + r * 0.26, by);
  ctx.stroke();
  if (L.gloss > 0) {
    ellipse(ctx, x - r * 0.42, y - r * 0.46, r * 0.2, r * 0.11, -0.8);
    ctx.fillStyle = alpha(lighten(c.glass, 0.8), 0.85); ctx.fill();
  }
  ctx.restore();
}

/** A chunky wire along points. live 0..1 tints it warm. */
export function drawWire(ctx, c, pts, live = 0) {
  const col = mix(isDay(c) ? mix(c.label, c.bgSurface, 0.45) : c.labelMuted, c.warning, live);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); };
  path(); ctx.lineWidth = 8; ctx.strokeStyle = darken(col, 0.32); ctx.stroke();
  path(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  ctx.restore();
}

/** A dry cell lying along a wire, (x, y) its centre, with its + end to the right. */
export function drawCell(ctx, c, x, y, w = 96, h = 44) {
  const body = c.s3, cap = c.s2;
  ctx.save();
  drawRoundBar(ctx, x - w / 2, y - h / 2, w * 0.68, h, body);
  drawRoundBar(ctx, x - w / 2 + w * 0.6, y - h / 2, w * 0.36, h, cap);
  rr(ctx, x + w / 2 - 3, y - h * 0.2, 11, h * 0.4, 3);
  ctx.fillStyle = mix(c.waste, c.label, 0.3); ctx.fill();
  ctx.restore();
}

function drawRoundBar(ctx, x, y, w, h, col) {
  rr(ctx, x, y, w, h, 9); ctx.fillStyle = col; ctx.fill();
  rr(ctx, x, y + h * 0.62, w, h * 0.38, 9); ctx.fillStyle = darken(col, 0.18); ctx.fill();
  rr(ctx, x, y, w, h, 9); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.34); ctx.stroke();
}

/** Centred Fredoka text on the backdrop, with a soft backing plate so it reads over anything. */
export function bigText(ctx, c, text, x, y, size, col) {
  ctx.save();
  ctx.font = font(c, 700, size, true);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = col ?? c.label;
  ctx.fillText(text, x, y);
  ctx.restore();
}
