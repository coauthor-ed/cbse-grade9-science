// ArcadeBits.js - the kit's sort bin with no face: a bin holds evidence, and in this module nothing in a bin may have
// a face. Not a scene. Copy of ArcadeSortScene._drawBin minus the face; the label fills the bin. Use in a subclass:
//   _drawBin(ctx, c, b, i, t, lit = false) { plainBin(this, ctx, c, b, i, t, lit); }
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { rr, font, mix, alpha, darken } from 'simulations/base/kit/SimLook.js';

const BIN_Y = 410, BIN_H = 96;   // the kit's own bin row

export function plainBin(sc, ctx, c, b, i, t, lit = false) {
  const col = sc.tone(b.g.tone ?? b.g.id), crate = sc.cfg.skin === 'belt', rad = crate ? 10 : 18;
  const x = b.x, y = BIN_Y + (b.flash > 0 ? -10 * Math.sin(Math.min(1, b.flash) * Math.PI) : 0), w = b.w, h = BIN_H;
  if (lit) {
    ctx.fillStyle = alpha(c.good, 0.35 + 0.2 * Math.sin(t * 8));
    rr(ctx, x - 8, y - 8, w + 16, h + 16, 22); ctx.fill();
  }
  ctx.fillStyle = col;
  if (lookOf().lip > 0) { rr(ctx, x, y + 5, w, h, rad); ctx.fill(); }
  ctx.fillStyle = mix(mix(c.bgDeep, col, 0.1), c.good, Math.min(1, b.flash) * 0.45);
  rr(ctx, x, y, w, h, rad); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2.5;
  rr(ctx, x + 1.25, y + 1.25, w - 2.5, h - 2.5, rad - 1); ctx.stroke();
  if (!crate && lookOf().lip > 0) { ctx.fillStyle = darken(col, 0.55); rr(ctx, x + 8, y - 4, w - 16, 12, 6); ctx.fill(); }
  const f = sc.fitText(ctx, c, b.g.label, w - 14, 22, 14, 800, true);
  ctx.font = font(c, 800, f.size, true); ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  f.lines.forEach((l, k) => ctx.fillText(l, x + w / 2, y + h / 2 + (k - (f.lines.length - 1) / 2) * (f.size + 2)));
  ctx.textAlign = 'left';
  if (!lit) sc.hit('bin', { x, y: y - 6, w, h: h + 12 }, i);
}
