/**
 * CoconutClimbScene - slide blk-l14-n03 "Climbing a coconut tree" (1 beat; Fig 6.27).
 *   b0 'climb' a tall coconut palm (ring-scarred trunk, light and shade sides, a slight lean, a crown of
 *              fronds and coconuts). A climber (side view, arms round the trunk, feet pressed on it) climbs
 *              in 2 eased steps: the hands move up, then the legs follow. Rest gripping. At the feet, equal
 *              F arrows: "legs push the trunk down" (tail on the trunk at the contact, down, on the trunk
 *              side) and "friction pushes the climber up" (tail on the leg, up, on the climber side).
 *              Inset (bottom left) "smooth trunk": a glossy trunk, a short friction arrow, the feet sliding.
 * Trunk ink series-1, climber ink series-2 (his vest is series-2). Frames depend on age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, font, rr, ellipse, hsl, hslOf } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawForce, drawField } from '../shared/ForceCast.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const GY = 492, BX = 372, TL = 430;                // ground, trunk base x, trunk length (px up)
const H = 196, PAIR = 84;
// Two climbing steps: hands up, then legs up (heights along the trunk, px above the ground).
const F0 = 70, STEP = 62, REACH0 = 0.4 * H, REACH1 = REACH0 + STEP;
const STEPS = [{ t: 0.3, d: 0.5, part: 'hands' }, { t: 0.85, d: 0.5, part: 'legs' }, { t: 1.45, d: 0.5, part: 'hands' }, { t: 2.0, d: 0.5, part: 'legs' }];
const T_REST = 2.5;

/** Trunk centre at height s (px above the ground): leans right as it rises; width tapers. */
const trunkAt = (s) => ({ x: BX + 0.1 * s + 0.00012 * s * s, y: GY - s, w: 58 - 0.04 * s });
const bark = (c) => hsl(hslOf(c.gold).h - 8, 0.32, 0.46);

export class CoconutClimbScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A person climbs a tall coconut tree, arms around the trunk and feet pressed against it. He moves his hands up, then his legs, twice, and holds on. At his feet, two equal arrows: his legs push the trunk down, and friction from the trunk pushes the climber up. A small picture shows a smooth trunk: the friction arrow is short and the feet slide down.';

  busy() { return this.age < T_REST + 0.7; }

  /** Hand and foot heights along the trunk at age a. */
  grips(a) {
    let hands = F0 + REACH0, feet = F0;
    for (const st of STEPS) { const k = ease(a, st.t, st.d); if (st.part === 'hands') hands += STEP * k; else feet += STEP * k; }
    return { hands, feet };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawField(ctx, c, { x0: 0, x1: 680, y: GY, h: 520 - GY, seed: 5 });
    const a = this.age, g = this.grips(a);
    const tf = trunkAt(g.feet), th = trunkAt(g.hands);
    const foot = { x: tf.x - tf.w / 2 + 2, y: tf.y };
    // Ladder-style climb against the trunk: feet pressed on its near edge, hands round it higher up.
    const look = figureLook(c, { skin: 4, hairStyle: 'short', hair: 0, top: 's2', bottom: 'cream', bottomStyle: 'shorts', shoeStyle: 'sandal', mood: 'effort', moustache: true });
    const fe = trunkAt(g.feet + 0.16 * H);
    drawFigure(ctx, c, { x: foot.x - 0.17 * H, y: foot.y + 0.04 * H, height: H, facing: 1,
      pose: { name: 'climb', phase: 0.25 },
      hands: [{ x: th.x - th.w * 0.2, y: th.y + 6 }, { x: th.x, y: th.y - 6 }],
      feet: [foot, { x: fe.x - fe.w / 2 + 2, y: fe.y }] }, look,
    { noShadow: true, behind: () => this.palm(ctx, c) });
    // The pair at the feet, once he grips at rest.
    const k = ease(a, T_REST - 0.05, 0.35);
    if (k > 0) {
      drawForce(ctx, c, foot.x + 16, foot.y + 4, { length: PAIR * k, angle: Math.PI / 2, label: '', alpha: k, fit: false });
      drawForce(ctx, c, foot.x - 24, foot.y - 2, { length: PAIR * k, angle: -Math.PI / 2, label: '', alpha: k, fit: false });
      this.chip(ctx, c, ['legs push the', 'trunk down'], foot.x + 46, foot.y + 56, c.s1ink, k, 'left');
      this.chip(ctx, c, ['friction pushes', 'the climber up'], foot.x - 34, foot.y - PAIR - 44, c.s2ink, k, 'right');
    }
    this.inset(ctx, c, ease(a, T_REST + 0.2, 0.4), a);
  }

  /** A two-line label chip (each line 26 px), anchored at (x, y) centre-left or centre-right. */
  chip(ctx, c, lines, x, y, ink, k, align) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 26);
    const w = Math.max(...lines.map((s) => ctx.measureText(s).width)) + 22, h = lines.length * 30 + 12;
    const x0 = align === 'right' ? x - w : x, y0 = y - h / 2;
    rr(ctx, x0, y0 + 3, w, h, 10); ctx.fillStyle = alpha(darken(ink, 0.3), 0.35); ctx.fill();
    rr(ctx, x0, y0, w, h, 10); ctx.fillStyle = c.bgSurface; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((s, i) => ctx.fillText(s, x0 + w / 2, y0 + 6 + 15 + i * 30));
    ctx.restore();
  }

  /** The palm: trunk with ring scars (lit left, shaded right), then the crown of fronds and coconuts. */
  palm(ctx, c) {
    const col = bark(c), N = 40, L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = trunkAt(TL * i / N); L.push([p.x - p.w / 2, p.y]); R.push([p.x + p.w / 2, p.y]); }
    ctx.save();
    ellipse(ctx, BX, GY + 3, 46, 7); ctx.fillStyle = alpha(darken(c.good, 0.5), 0.35); ctx.fill();
    // Root flare.
    ctx.beginPath(); ctx.moveTo(BX - 44, GY + 2); ctx.quadraticCurveTo(BX - 30, GY - 6, BX - 28, GY - 26); ctx.lineTo(BX + 30, GY - 24); ctx.quadraticCurveTo(BX + 32, GY - 6, BX + 46, GY + 2); ctx.closePath();
    ctx.fillStyle = darken(col, 0.12); ctx.fill();
    ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); [...R].reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
    const gr = ctx.createLinearGradient(BX - 30, 0, BX + 30, 0);
    gr.addColorStop(0, lighten(col, 0.22)); gr.addColorStop(0.45, col); gr.addColorStop(1, darken(col, 0.3));
    ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.clip();
    // Shade side and ring scars (curved bands round the trunk).
    for (let s = 10; s < TL - 6; s += 13) {
      const p = trunkAt(s);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.w / 2 + 1, 3.2, -0.1, 0, Math.PI); ctx.strokeStyle = alpha(darken(col, 0.42), 0.75); ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, p.w / 2 - 4, 2.4, -0.1, Math.PI * 1.05, Math.PI * 1.5); ctx.strokeStyle = alpha(lighten(col, 0.45), 0.55); ctx.lineWidth = 1.6; ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); [...R].reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
    ctx.strokeStyle = darken(col, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
    this.crown(ctx, c, trunkAt(TL));
    ctx.restore();
  }

  crown(ctx, c, top) {
    const leaf = c.good, x = top.x, y = top.y + 6;
    const fronds = [-2.95, -2.55, -2.15, -1.75, -1.4, -1.05, -0.65, -0.25, 0.15, 2.75, 0.5];
    fronds.forEach((ang, i) => {
      const len = 150 + (i % 3) * 18, droop = 0.55 + (i % 2) * 0.15;
      const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len * 0.62 + len * droop * 0.45;
      const mx = x + Math.cos(ang) * len * 0.5, my = y + Math.sin(ang) * len * 0.5 - 16;
      const tone = i % 2 ? darken(leaf, 0.12) : lighten(leaf, 0.06);
      // Leaflets along the midrib, hanging down from it.
      for (let j = 2; j <= 16; j++) {
        const u = j / 17, px = (1 - u) ** 2 * x + 2 * u * (1 - u) * mx + u * u * ex, py = (1 - u) ** 2 * y + 2 * u * (1 - u) * my + u * u * ey;
        const ll = 30 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 6;
        ctx.strokeStyle = tone; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + sg * ll * 0.35, py + ll); ctx.stroke(); }
      }
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.strokeStyle = darken(leaf, 0.4); ctx.lineWidth = 3.5; ctx.stroke();
    });
    // Coconuts under the crown.
    const nut = mix(c.good, c.gold, 0.55);
    for (const [dx, dy] of [[-22, 18], [0, 24], [20, 16], [-8, 36], [12, 38]]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, 13, 0, Math.PI * 2); ctx.fillStyle = nut; ctx.fill();
      ctx.strokeStyle = darken(nut, 0.45); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = alpha(lighten(nut, 0.5), 0.7); ellipse(ctx, x + dx - 4, y + dy - 5, 4, 2.5, -0.6); ctx.fill();
    }
  }

  /** Inset: a smooth, glossy trunk; the friction arrow is short and the feet slide down. */
  inset(ctx, c, k, a) {
    if (k <= 0) return;
    const R = { x: 12, y: 300, w: 176, h: 210 };
    ctx.save(); ctx.globalAlpha *= k;
    rr(ctx, R.x, R.y + 3, R.w, R.h, 16); ctx.fillStyle = alpha(darken(c.bgDeep, 0.3), 0.14); ctx.fill();
    rr(ctx, R.x, R.y, R.w, R.h, 16); ctx.fillStyle = c.bgSurface; ctx.fill(); ctx.strokeStyle = alpha(c.label, 0.18); ctx.lineWidth = 2; ctx.stroke();
    ctx.font = font(c, 800, 26, true); ctx.fillStyle = alpha(c.label, 0.8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('smooth trunk', R.x + R.w / 2, R.y + 26);
    // Glossy trunk segment: pale, with a long highlight and no ring scars.
    const tx = R.x + 112, tw = 40, ty0 = R.y + 50, ty1 = R.y + R.h - 8, col = lighten(bark(c), 0.12);
    rr(ctx, tx - tw / 2, ty0, tw, ty1 - ty0, 8);
    const g = ctx.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0);
    g.addColorStop(0, lighten(col, 0.25)); g.addColorStop(0.5, col); g.addColorStop(1, darken(col, 0.25));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(lighten(col, 0.8), 0.9); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx - 8, ty0 + 10); ctx.lineTo(tx - 8, ty1 - 14); ctx.stroke();
    // A foot sliding down the trunk (a sandal sole side on), streaks above where it was.
    const slide = 22 * ease(a, T_REST + 0.6, 0.6), fy = R.y + 128 + slide, fx = tx - tw / 2 - 2;
    ctx.strokeStyle = alpha(c.label, 0.6); ctx.lineWidth = 2.5;
    for (const dx of [-10, -18]) { ctx.beginPath(); ctx.moveTo(fx + dx, fy - 30); ctx.lineTo(fx + dx, fy - 30 - slide - 8); ctx.stroke(); }
    const skin = figureLook(c, { skin: 4 }).skin ?? c.gold;
    rr(ctx, fx - 22, fy - 26, 22, 34, 9); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2; ctx.stroke();
    rr(ctx, fx - 4, fy - 30, 6, 42, 3); ctx.fillStyle = darken(skin, 0.5); ctx.fill();
    drawForce(ctx, c, fx - 30, fy + 6, { length: 30, angle: -Math.PI / 2, label: '', alpha: 1, fit: false });
    ctx.restore();
  }
}
