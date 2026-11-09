// IonBenchKit.js - shared parts of the L09 to L11 scenes, on top of the kit.
// Not a scene. The bulb, wire, cell and rig are the ones lesson 1 uses (simulations/L01), so the
// student sees the same apparatus. Atoms and ions come from SimAtom.
// The stage only scales on a phone (680 design px into about 380), so text that must be read there
// is 24 design px or more. Colours: palette keys only.
import { alpha, darken, font, inkOn, lighten, luma, contrast, mix, rr, ellipse, mulberry32, drawShadow, clamp01, outBack, pill, lerp } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

const TAU = Math.PI * 2;
export const TXT = 24;      // the smallest label size in these scenes
export const isDay = (c) => luma(c.bgDeep) > 0.5;
export const snow = (c) => (isDay(c) ? c.bgSurface : c.label);

/** Ink for a coloured chip: the light ink wherever it is legible. */
export function chipInk(c, bg) {
  const light = luma(c.label) > luma(c.bgDeep) ? c.label : c.bgDeep;
  return contrast(bg, light) >= 3.2 ? light : inkOn(c, bg);
}

/** Arrival with a spring: 0 before `delay`, then 1 with an overshoot. 1 under reduced motion. */
export function popIn(age, delay = 0, dur = 0.45) {
  if (reducedMotion()) return 1;
  const u = clamp01((age - delay) / dur);
  return u <= 0 ? 0 : outBack(u);
}

/** Run fn around (x, y) at scale s. */
export function at(ctx, x, y, s, fn) {
  if (s <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  fn();
  ctx.restore();
}

/** Plain text. o: { size, col, align, display = true, weight } */
export function say(ctx, c, text, x, y, o = {}) {
  ctx.save();
  ctx.font = font(c, o.weight ?? 700, o.size ?? TXT, o.display ?? true);
  ctx.fillStyle = o.col ?? c.label;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

/** A chip at the label size. */
export function tag(ctx, c, text, x, y, o = {}) {
  return pill(ctx, c, text, x, y, { size: TXT, bg: c.raised, ink: o.bg ? chipInk(c, o.bg) : c.label, display: true, ...o });
}

/** A formula with real subscripts and charges: 'H_2O', 'Na^+', 'Cl^-'. o: { size, col, align, ghost }. Returns { w, x0 }. */
export function formula(ctx, c, text, x, y, o = {}) {
  const size = o.size ?? 40, small = Math.max(TXT - 6, Math.round(size * 0.66));
  const parts = [...String(text).matchAll(/_(\d+)|\^(\d?[+-])|([^_^]+)/g)].map((m) => (
    m[1] ? { t: m[1], f: small, dy: size * 0.28 } : m[2] ? { t: m[2].replace('-', '\u2212'), f: small, dy: -size * 0.3 } : { t: m[3], f: size, dy: 0 }));
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  for (const q of parts) { ctx.font = font(c, 700, q.f, true); q.w = ctx.measureText(q.t).width; }
  const w = parts.reduce((a, q) => a + q.w, 0);
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  if (!o.ghost) {
    let cx = x0;
    ctx.fillStyle = o.col ?? c.label;
    for (const q of parts) {
      ctx.font = font(c, 700, q.f, true);
      ctx.fillText(q.t, cx, y + q.dy);
      cx += q.w;
    }
  }
  ctx.restore();
  return { w, x0 };
}

/** A flat chip that holds a formula: pill() has no subscripts. o: { bg, size, ink, scale } */
export function formulaChip(ctx, c, text, x, y, o = {}) {
  const size = o.size ?? TXT, L = lookOf(), bg = o.bg ?? c.raised;
  const { w } = formula(ctx, c, text, 0, 0, { size, ghost: true });
  const pw = w + size * 1.3, ph = size * 1.7;
  at(ctx, x, y, o.scale ?? 1, () => {
    const r = Math.min(L.pill, ph / 2);
    if (L.lip > 0) { rr(ctx, -pw / 2, -ph / 2 + 3.5 * L.lip, pw, ph, r); ctx.fillStyle = darken(bg, 0.38); ctx.fill(); }
    rr(ctx, -pw / 2, -ph / 2, pw, ph, r); ctx.fillStyle = bg; ctx.fill();
    formula(ctx, c, text, 0, 1, { size, col: o.ink ?? chipInk(c, bg) });
  });
  return { w: pw, h: ph };
}

/** A chunky white crystal block, lit from the top left (the grain of lesson 1). */
export function drawGrain(ctx, c, x, y, r, o = {}) {
  const rnd = mulberry32(o.seed ?? 3);
  const tilt = (rnd() - 0.5) * 0.34;
  const vec = (a, k) => ({ x: Math.cos(a + tilt) * r * k, y: Math.sin(a + tilt) * r * k });
  const up = vec(-Math.PI / 2, 0.98 + rnd() * 0.1);
  const ri = vec(Math.PI / 6, 0.96 + rnd() * 0.14);
  const le = vec((5 * Math.PI) / 6, 0.96 + rnd() * 0.14);
  const P = (a, b) => ({ x: x + a.x + (b ? b.x : 0), y: y + a.y + (b ? b.y : 0) + r * 0.08 });
  const v = { x, y: y + r * 0.08 };
  const U = P(up), R = P(ri), L0 = P(le), UR = P(up, ri), UL = P(up, le), LR = P(ri, le);
  const base = o.col ?? snow(c);
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
  ctx.lineWidth = Math.max(2.5, Math.min(5, r * 0.11)); ctx.strokeStyle = rim; ctx.stroke();
  face([v, U, UR, R], mid);
  face([v, R, LR, L0], dark);
  face([v, L0, UL, U], base);
  ctx.strokeStyle = alpha(rim, 0.55); ctx.lineWidth = Math.max(1.5, Math.min(3, r * 0.03)); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(v.x, v.y); ctx.lineTo(U.x, U.y); ctx.moveTo(v.x, v.y); ctx.lineTo(R.x, R.y); ctx.moveTo(v.x, v.y); ctx.lineTo(L0.x, L0.y); ctx.stroke();
  if (lookOf().gloss > 0 && r > 12) {
    ellipse(ctx, x - r * 0.46, y - r * 0.5, r * 0.15, r * 0.06, -0.6);
    ctx.fillStyle = alpha(lighten(base, 0.8), 0.95);
    ctx.fill();
  }
  ctx.restore();
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
  const by = y + r * 0.88, bw = r * 0.82, bh = r * 0.62;
  rr(ctx, x - bw / 2, by, bw, bh, 5); ctx.fillStyle = mix(c.waste, c.label, 0.2); ctx.fill();
  ctx.strokeStyle = darken(c.waste, 0.2); ctx.lineWidth = 2.5; ctx.stroke();
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x - bw / 2 + 3, by + (bh * i) / 3); ctx.lineTo(x + bw / 2 - 3, by + (bh * i) / 3);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = k > 0 ? mix(cold, lighten(warm, 0.45), k) : cold;
  ctx.fill();
  ctx.lineWidth = Math.max(3, 3.5 * L.rim);
  ctx.strokeStyle = k > 0.3 ? darken(warm, 0.12) : (isDay(c) ? darken(c.glass, 0.15) : c.glass);
  ctx.stroke();
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

function roundBar(ctx, x, y, w, h, col) {
  rr(ctx, x, y, w, h, 9); ctx.fillStyle = col; ctx.fill();
  rr(ctx, x, y + h * 0.62, w, h * 0.38, 9); ctx.fillStyle = darken(col, 0.18); ctx.fill();
  rr(ctx, x, y, w, h, 9); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.34); ctx.stroke();
}

/** A dry cell lying along a wire, (x, y) its centre, with its + end to the right. */
export function drawCell(ctx, c, x, y, w = 96, h = 44) {
  ctx.save();
  roundBar(ctx, x - w / 2, y - h / 2, w * 0.68, h, c.s3);
  roundBar(ctx, x - w / 2 + w * 0.6, y - h / 2, w * 0.36, h, c.s2);
  rr(ctx, x + w / 2 - 3, y - h * 0.2, 11, h * 0.4, 3);
  ctx.fillStyle = mix(c.waste, c.label, 0.3); ctx.fill();
  ctx.restore();
}

// The rig of lesson 1, in its own units: (0, 0) is the bench under the glass.
export const RIG = { w: 244, h: 186, rodL: -68, rodR: 68, rodTop: -226, rodBot: -32, rail: -318, low: -256, sw0: 146, sw1: 214, bulbY: -334, bulbR: 50 };

function rod(ctx, c, x) {
  const col = mix(c.waste, c.label, 0.12);
  rr(ctx, x - 9, RIG.rodTop, 18, RIG.rodBot - RIG.rodTop, 6); ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
  rr(ctx, x - 6, RIG.rodTop + 6, 4, RIG.rodBot - RIG.rodTop - 14, 2); ctx.fillStyle = alpha(lighten(col, 0.5), 0.6); ctx.fill();
}

function swtch(ctx, c, k) {
  const a = lerp(-0.7, 0, k), R = RIG.rail, metal = mix(c.waste, c.label, 0.3);
  rr(ctx, RIG.sw0 - 16, R + 8, RIG.sw1 - RIG.sw0 + 32, 16, 6); ctx.fillStyle = darken(c.s5, 0.2); ctx.fill();
  for (const px of [RIG.sw0, RIG.sw1]) { ctx.beginPath(); ctx.arc(px, R, 10, 0, TAU); ctx.fillStyle = metal; ctx.fill(); ctx.strokeStyle = darken(metal, 0.3); ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.save();
  ctx.translate(RIG.sw0, R); ctx.rotate(a);
  rr(ctx, 0, -6, RIG.sw1 - RIG.sw0 + 6, 12, 6); ctx.fillStyle = c.s2; ctx.fill();
  ctx.strokeStyle = darken(c.s2, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}

/**
 * The bulb test of lesson 1 at (x, y, the bench), scale s.
 * o: { lever (0 open..1 shut), glow (0..1), level (0: empty), fill, opacity, shape = 'beaker',
 *      contents(ctx, sy) draws inside the glass in rig units, sy the surface, signs (mark the rods - and +) }
 */
export function drawRig(ctx, c, x, y, s, o = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const live = o.glow ?? 0;
  const g = glassBox(o.shape ?? 'beaker', -RIG.w / 2, -RIG.h, RIG.w, RIG.h, { wall: 6 });
  drawGlass(ctx, c, g);
  let sy = g.floor;
  if (o.level !== 0) sy = drawGlassLiquid(ctx, c, g, { level: o.level ?? 0.74, fill: o.fill ?? c.water, opacity: o.opacity ?? 0.45 }) ?? -130;
  rod(ctx, c, RIG.rodL); rod(ctx, c, RIG.rodR);
  o.contents?.(ctx, sy, g);
  drawGlassFront(ctx, c, g, { shade: 0.1 });
  drawWire(ctx, c, [[RIG.rodL, RIG.rodTop], [RIG.rodL, RIG.low], [-214, RIG.low], [-214, RIG.rail], [-40, RIG.rail]], live);
  drawWire(ctx, c, [[40, RIG.rail], [RIG.sw0, RIG.rail]], live);
  drawWire(ctx, c, [[RIG.sw1, RIG.rail], [262, RIG.rail], [262, RIG.low], [RIG.rodR, RIG.low], [RIG.rodR, RIG.rodTop]], live);
  drawCell(ctx, c, -128, RIG.rail, 104, 46);
  swtch(ctx, c, o.lever ?? 0);
  drawBulb(ctx, c, 0, RIG.bulbY, RIG.bulbR, live);
  if (o.signs) {
    say(ctx, c, '\u2212', RIG.rodL - 34, RIG.rodTop + 2, { size: 40 });
    say(ctx, c, '+', RIG.rodR + 34, RIG.rodTop + 2, { size: 40 });
  }
  ctx.restore();
}

/** A gas burner standing on the bench at (x, y), flame k 0..1. Top of the burner: y - 50. */
export function drawBurner(ctx, c, x, y, k = 1) {
  const metal = mix(c.waste, c.label, 0.25);
  ctx.save();
  drawShadow(ctx, c, x, y + 2, 36, 7);
  rr(ctx, x - 30, y - 10, 60, 10, 4); ctx.fillStyle = darken(metal, 0.3); ctx.fill();
  rr(ctx, x - 8, y - 50, 16, 42, 4); ctx.fillStyle = metal; ctx.fill();
  ctx.strokeStyle = darken(metal, 0.32); ctx.lineWidth = 2.5; ctx.stroke();
  if (k > 0.01) {
    const fh = 42 * k, fw = 14 * Math.min(1, 0.4 + k), top = y - 50;
    const tongue = (w, h, col) => {
      ctx.beginPath(); ctx.moveTo(x - w, top); ctx.quadraticCurveTo(x - w * 1.1, top - h * 0.55, x, top - h);
      ctx.quadraticCurveTo(x + w * 1.1, top - h * 0.55, x + w, top); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
    };
    tongue(fw, fh, c.flame);
    tongue(fw * 0.5, fh * 0.55, mix(c.warning, c.bgSurface, 0.1));
  }
  ctx.restore();
}

/** A distance along a polyline: { x, y }. */
export function along(pts, d) {
  let left = d;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (left <= len) return { x: ax + ((bx - ax) * left) / len, y: ay + ((by - ay) * left) / len };
    left -= len;
  }
  const e = pts[pts.length - 1];
  return { x: e[0], y: e[1] };
}

/** A flat button with a solid lip, drawn on the stage. Returns its box for hit(). o: { on, off, size, bg } */
export function button(ctx, c, text, x, y, w, h, o = {}) {
  const L = lookOf();
  const bg = o.bg ?? (o.on ? c.accent : c.raised);
  const r = Math.min(14 * L.radius, h / 2), lip = 5 * L.lip;
  ctx.save();
  ctx.globalAlpha *= o.off ? 0.5 : 1;
  if (lip > 0) { rr(ctx, x, y + lip, w, h, r); ctx.fillStyle = darken(bg, 0.38); ctx.fill(); }
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = bg;
  ctx.fill();
  if (L.rim > 0 && !o.on) { ctx.strokeStyle = c.stroke; ctx.lineWidth = 2 * L.rim; ctx.stroke(); }
  ctx.restore();
  say(ctx, c, text, x + w / 2, y + h / 2 + 1, { size: o.size ?? TXT, col: o.ink ?? (o.on || o.bg ? chipInk(c, bg) : c.label) });
  return { x, y, w, h: h + lip };
}

/** The box under p, with a few px of grace, or null. */
export function hit(boxes, p, grace = 6) {
  return boxes.find((b) => b && p.x >= b.x - grace && p.x <= b.x + b.w + grace && p.y >= b.y - grace && p.y <= b.y + b.h + grace) ?? null;
}
