/**
 * PairsVsBalancedScene - slide blk-l14-n04 "Pairs never cancel" (1 beat).
 * Two panels, side by side on a wide screen, stacked on a phone, each with a title chip:
 *   left  "a third-law pair": the canoe's paddle blade in the water (the canoeist drawing, cropped to the panel);
 *         two equal opposite F arrows at the blade, one on the paddle ("on the paddle", series-1, right) and one
 *         on the water ("on the water", series-2, left). Tag below: "two objects".
 *   right "balanced forces": a wooden block on a tiled floor; your push from the left and friction from the
 *         floor, equal and opposite, BOTH tails on the block; drawNet with zero sum below it ("net force = 0").
 *         Tag below: "one object".
 * Animation: the left pair appears together (0.5 s), then the right pair, then the net dot. Rest: all shown.
 * Frames depend on age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, lighten, mix } from 'simulations/base/kit/SimLook.js';
import { drawForce, drawNet, drawBoxOn, drawPusher } from '../shared/ForceCast.js';
import { drawCanoeist } from '../shared/MotionCast.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const BW = 320, BH = 250;                          // content box of each panel (objects, arrows, arrow tags)
const PAIR = 86;                                   // every arrow in the scene, one length (all forces equal)

export class PairsVsBalancedScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'Two pictures side by side. Left, a third-law pair: a paddle blade in the water. One arrow acts on the paddle, pointing forwards, and an equal arrow acts on the water, pointing backwards. They act on two different objects, so they do not cancel. Right, balanced forces: a wooden block on the floor. Your push acts on the block to the right, and friction from the floor acts on the same block to the left, equally. Both act on one object, so the net force on the block is zero.';

  constructor(container, config) { super(container, config); }
  busy() { return this.age < 2.5; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age, k1 = ease(a, 0.3, 0.5), k2 = ease(a, 1.0, 0.5), k3 = ease(a, 1.7, 0.4);
    const P = this.portrait;
    // Panel rects and where the content box, the title and the bottom tag go in each.
    const L = P ? { x: 8, y: 6, w: 664, h: 252 } : { x: 8, y: 8, w: 328, h: 504 };
    const R = P ? { x: 8, y: 262, w: 664, h: 252 } : { x: 344, y: 8, w: 328, h: 504 };
    const place = (r) => P
      ? { ox: r.x + 4, oy: r.y + 2, title: { x: r.x + 352, y: r.y + 58, align: 'left' }, tag: { x: r.x + 352, y: r.y + 196, align: 'left' } }
      : { ox: r.x + 4, oy: r.y + 112, title: { x: r.x + r.w / 2, y: r.y + 46, align: 'center' }, tag: { x: r.x + r.w / 2, y: r.y + 446, align: 'center' } };
    for (const r of [L, R]) drawSheet(ctx, c, { x: r.x, y: r.y, w: r.w, h: r.h }, { r: 16 });
    const pl = place(L), pr = place(R);
    this.pairPanel(ctx, c, pl.ox, pl.oy, k1);
    this.balancedPanel(ctx, c, pr.ox, pr.oy, k2, k3, P ? 82 : 104);
    const chip = (s, p, col, k = 1) => drawTag(ctx, c, s, p.x, p.y, { size: 26, col, align: p.align, alpha: k, prefer: [[0, 0]] });
    chip('a third-law pair', pl.title, c.label);
    chip('balanced forces', pr.title, c.label);
    chip('two objects', pl.tag, c.accent, k1);
    chip('one object', pr.tag, c.accent, k3);
  }

  /** Left: the blade in the water (canoeist cropped to the box), the pair at the blade, tags below. */
  pairPanel(ctx, c, ox, oy, k) {
    const WY = oy + 84, CL = 300;
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, BW, BH); ctx.clip();
    const top = mix(c.water, c.bgSurface, 0.6), deep = mix(c.water, c.bgSurface, 0.36);
    const g = ctx.createLinearGradient(0, WY, 0, oy + BH); g.addColorStop(0, top); g.addColorStop(1, deep);
    ctx.fillStyle = g; ctx.fillRect(ox, WY, BW, oy + BH - WY);
    ctx.fillStyle = alpha(lighten(top, 0.5), 0.55); ctx.fillRect(ox, WY, BW, 4);
    const { canoe } = drawCanoeist(ctx, c, { x: ox + 128, y: WY, length: CL, stroke: 0.5 });
    ctx.restore();
    const b = canoe.anchors.paddle.blade;
    // The water the blade pushes: a swirl behind it, rimmed in the water's series tone.
    ctx.save(); ctx.strokeStyle = alpha(c.s2, 0.75); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(b.x - 46 - j * 22, b.y + 6, 20 - j * 6, Math.PI * 0.15, Math.PI * 1.6); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(b.x, b.y, 26, 0, Math.PI * 2); ctx.strokeStyle = alpha(c.s1, 0.9); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    if (k <= 0) return;
    drawForce(ctx, c, b.x + 4, b.y - 20, { length: PAIR * k, angle: 0, label: '', alpha: k, fit: false });
    drawForce(ctx, c, b.x - 4, b.y + 22, { length: PAIR * k, angle: Math.PI, label: '', alpha: k, fit: false });
    drawTag(ctx, c, 'on the paddle', ox + BW - 4, b.y + 62, { size: 26, col: c.s1ink, align: 'right', alpha: k, prefer: [[0, 0]] });
    drawTag(ctx, c, 'on the water', ox + 4, b.y + 104, { size: 26, col: c.s2ink, align: 'left', alpha: k, prefer: [[0, 0]] });
  }

  /** Right: a block on a tiled floor, your push and friction both from the block, the zero net force below. */
  balancedPanel(ctx, c, ox, oy, k, kn, netDy) {
    const FY = oy + 156;
    const box = drawBoxOn(ctx, c, { x: ox + 196, y: FY, w: 112, h: 104, kind: 'block', surface: 'tiles', x0: ox + 2, x1: ox + BW - 2, surfaceH: 30 });
    drawPusher(ctx, c, { at: { x: box.back.x, y: box.back.y }, y: FY, height: 156, effort: 0.45, facing: 1 });
    if (k > 0) {
      drawForce(ctx, c, box.centre.x - 10, box.top.y + 26, { length: PAIR * k, angle: 0, label: '', alpha: k, fit: false });
      drawForce(ctx, c, box.bottom.x + 10, box.bottom.y - 6, { length: PAIR * k, angle: Math.PI, label: '', alpha: k, fit: false });
      drawTag(ctx, c, 'push', box.centre.x + 40, box.top.y - 24, { size: 26, col: c.label, alpha: k, prefer: [[0, 0]] });
      drawTag(ctx, c, 'friction', ox + 60, FY + 52, { size: 26, col: c.label, alpha: k, prefer: [[0, 0]] });
    }
    if (kn > 0) drawNet(ctx, c, box.centre.x + 40, FY + netDy, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn });
  }
}
