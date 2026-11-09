// AtomBoard - small parts shared by the L07 and L08 scenes, on top of the kit.
// The stage only scales on a phone (680 design px into about 380), so text that must be read there
// is 24 design px or more: that is about 14 px on the screen. Buttons drawn on the canvas are taps
// on the hero's stage, so they stay large as well.
import { font, rr, darken, inkOn, luma, contrast, outBack, clamp01, pill } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

export const TXT = 24;      // the smallest label size in these scenes
export const SHELL = ['K', 'L', 'M'];

/** Ink for a coloured chip: the light ink wherever it is legible, since dark ink on a mid-dark chip reads poorly. */
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

/** Plain text in the display face (Fredoka by default). o: { size, col, align, display, weight } */
export function say(ctx, c, text, x, y, o = {}) {
  ctx.save();
  ctx.font = font(c, o.weight ?? 700, o.size ?? TXT, o.display ?? true);
  ctx.fillStyle = o.col ?? c.label;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

/** A chip at the label size. Keeps the kit's chip, only larger. */
export function tag(ctx, c, text, x, y, o = {}) {
  return pill(ctx, c, text, x, y, { size: TXT, bg: c.raised, ink: o.bg ? chipInk(c, o.bg) : c.label, display: true, ...o });
}

/**
 * A chemical formula with real subscripts and charges. Text: _2 is a subscript, ^2+ a superscript,
 * so 'Mg^2+', 'H_2O', 'Al(OH)_3', 'SO_4^2-'. Plain digits, since the font has no such glyphs.
 * o: { size, col, align, ghost (measure only) }. Returns { w, x0 }: width and left edge.
 */
export function formula(ctx, c, text, x, y, o = {}) {
  const size = o.size ?? 40, small = Math.max(TXT - 4, Math.round(size * 0.62));
  const parts = [...String(text).matchAll(/_(\d+)|\^(\d?[+-])|([^_^]+)/g)].map((m) => (
    m[1] ? { t: m[1], f: small, dy: size * 0.28 } : m[2] ? { t: m[2].replace('-', '\u2212'), f: small, dy: -size * 0.32 } : { t: m[3], f: size, dy: 0 }));
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

/**
 * A flat button with a solid lip, at (x, y) top left. Returns its box for hit().
 * o: { on, off (dim, not tappable), size, bg }
 */
export function button(ctx, c, text, x, y, w, h, o = {}) {
  const L = lookOf();
  const bg = o.bg ?? (o.on ? c.accent : c.raised);
  const r = Math.min(14 * L.radius, h / 2);
  const lip = 5 * L.lip;
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
