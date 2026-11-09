// AtomLabels.js - course-local helpers for the L04-L06 scenes. Labels here are drawn big, because the
// stage only scales: at 390 wide a 680 stage shows at 0.56, so 24 design px reads as about 14.
import { darken, font, inkOn, pill, rr } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';

export const LBL = 24;

/** A flat chip: raised ground, label ink. Use for naming things. */
export function tag(ctx, c, text, x, y, o = {}) {
  return pill(ctx, c, text, x, y, { bg: o.bg ?? c.raised, ink: o.ink ?? (o.bg ? undefined : c.label), size: o.size ?? LBL, display: true, align: o.align, alpha: o.alpha, scale: o.scale });
}

/** A chip reading "<text>10<sup>exp</sup> <unit>": the fonts have no superscript glyphs, so the power is set by hand. */
export function powChip(ctx, c, text, exp, unit, x, y, o = {}) {
  const size = o.size ?? LBL, small = Math.round(size * 0.68);
  const bg = o.bg ?? c.raised, ink = o.ink ?? (o.bg ? inkOn(c, bg) : c.label);
  const L = lookOf();
  ctx.save();
  ctx.font = font(c, 800, size, true);
  const a = `${text}10`, b = unit ? ` ${unit}` : '';
  const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
  ctx.font = font(c, 800, small, true);
  const we = ctx.measureText(exp).width;
  const w = wa + wb + we + 2 + L.chipPadX, h = size + L.chipPadY;
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  const r = Math.min(L.pill, h / 2);
  if (L.lip > 0) { rr(ctx, x0, y - h / 2 + 3.5 * L.lip, w, h, r); ctx.fillStyle = darken(bg, 0.38); ctx.fill(); }
  rr(ctx, x0, y - h / 2, w, h, r); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let tx = x0 + L.chipPadX / 2;
  ctx.font = font(c, 800, size, true);
  ctx.fillText(a, tx, y + 1); tx += wa;
  ctx.font = font(c, 800, small, true);
  ctx.fillText(exp, tx + 1, y - size * 0.28); tx += we + 2;
  ctx.font = font(c, 800, size, true);
  ctx.fillText(b, tx, y + 1);
  ctx.restore();
  return { x0, y0: y - h / 2, w, h };
}
