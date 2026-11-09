/**
 * SpoonsScene - slide "Through Water" (L02 blk-l02-s04), 2 beats. New 2026-11-03.
 *
 * b0 a steel bucket of water (SoundArt). You stand behind it, hold two steel spoons above the
 *    water and tap them together (one fixed stance; grips fixed per beat; only the spoons move).
 *    Sound arcs go through the air to your ear, which glows. Fixed 2026-11-03 (FC2): you tap.
 * b1 the spoons under the water, away from the sides. Rings spread through the water (drawn
 *    inside the water, clipped to it) to the bucket's side, then arcs go through the air from
 *    the side to your ear, which glows. Tags "water" and "air". Both legs show at rest.
 * Not on this slide: speed of sound, density, the word medium.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, darken, alpha, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawBucketAndSpoons } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const FLOOR = 470;
const BK = { x: 300, y: 482, R: 84, H: 170 };
const TAP_T = 1.2;                    // one tap of the spoons (s)
const REST = TAP_T * 4 + 0.3;         // rests just after a tap, arcs on
// you: front view behind the bucket, a little to its right, so your head is just above
// the bucket's side wall; both hands hold the spoon handles (fixed grips, so the pose is fixed)
const YOU = { x: 410, y: 478, height: 440 };

export class SpoonsScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'You stand behind a steel bucket of water and tap two metal spoons together in the air; the sound reaches your ear, which lights up. Next, you hold the spoons under the water, away from the sides, and tap them again: rings of sound spread through the water to the side of the bucket, then through the air to your ear, which lights up.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.ear = null;
  }

  enter(stage) {
    this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0));
  }

  busy() { return this.age < REST; }

  // your ear: the one on screen right (the kit draws that ear; it is nearest the bucket's side wall)
  _ear(spec, under) {
    const hd = solveFigure(spec).anchors.head, sx = 1;
    return { x: hd.x + sx * hd.r * 0.92, y: hd.y + hd.r * 0.16, r: hd.r * 0.62 };
  }

  _tap(t) {
    const u = (t % TAP_T) / TAP_T;
    if (u < 0.22) return inOutSine(u / 0.22);
    if (u < 0.5) return 1 - inOutSine((u - 0.22) / 0.28);
    return 0;
  }

  draw(ctx, c) {
    const t = Math.min(this.age, REST), under = this.cur === 1;
    const k = inOutSine(clamp01(t / 0.6));
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR, {});
    const tap = this._tap(t);
    // grips do not depend on tap, so your hands stay put; only the spoons move
    const ty = BK.y - BK.H, gy = under ? ty - 70 : ty - 130;
    const grips = [{ x: BK.x + BK.R * 0.85, y: gy }, { x: BK.x - BK.R * 0.85, y: gy }];
    const you = figureFor(this, { role: 'student', ...YOU, facing: 0, i: 2, pose: { name: 'stand', crouch: 0.7 }, autoReach: true, hands: grips });
    const ear = this._ear(you, under);
    let bk = null;
    drawFigure(ctx, c, you, you.look, { between: () => {
      bk = drawBucketAndSpoons(ctx, c, { ...BK, under, tap, side: 1 });
      if (under) this._water(ctx, c, bk, t, k);
    } });

    if (!under) {
      // through the air: from the spoons to your ear
      const dir = Math.atan2(ear.y - bk.contact.y, ear.x - bk.contact.x);
      drawSoundArcs(ctx, c, { x: bk.contact.x, y: bk.contact.y, dir, spread: 0.7, n: 3, wavelength: 34, r0: 16, t, strength: k });
      pill(ctx, c, 'air', BK.x - BK.R - 70, ty - 96, { ...LBL, bg: c.raised, ink: c.label });
    } else {
      // then from the side wall, through the air, to your ear
      const s0 = { x: bk.side.x + 6, y: bk.side.y - 10 };
      const dir = Math.atan2(ear.y - s0.y, ear.x - s0.x);
      drawSoundArcs(ctx, c, { x: s0.x, y: s0.y, dir, spread: 0.6, n: 4, wavelength: 36, r0: 14, t: t - 0.4, strength: k });
      pill(ctx, c, 'water', BK.x - BK.R - 64, BK.y - 60, { ...LBL, bg: c.raised, ink: c.label });
      pill(ctx, c, 'air', ear.x + 70, ear.y + 64, { ...LBL, bg: c.raised, ink: c.label });
    }
    pill(ctx, c, 'you', YOU.x + 160, ty - 196, { ...LBL, bg: c.raised, ink: c.label });
    // your ear glows: the sound has arrived
    const g = ctx.createRadialGradient(ear.x, ear.y, 1, ear.x, ear.y, ear.r);
    g.addColorStop(0, alpha(c.warning, 0.85 * k)); g.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ear.x, ear.y, ear.r, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(ear.x, ear.y, ear.r * 0.42, 0, TAU);
    ctx.strokeStyle = alpha(darken(c.warning, 0.2), k); ctx.lineWidth = 3; ctx.stroke();
  }

  // rings in the water: a see-through band of the bucket below the surface, out to the walls
  _water(ctx, c, bk, t, k) {
    const ty = BK.y - BK.H, sy = ty + 12, bR = BK.R * 0.78, bry = bR * 0.36;
    const halfAt = (y) => BK.R + (bR - BK.R) * (y - ty) / BK.H;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(BK.x - halfAt(sy) + 5, sy); ctx.lineTo(BK.x + halfAt(sy) - 5, sy);
    ctx.lineTo(BK.x + bR - 5, BK.y); ctx.ellipse(BK.x, BK.y, bR - 5, bry - 3, 0, 0, Math.PI); ctx.closePath();
    ctx.clip();
    ctx.fillStyle = alpha(c.water, 0.42); ctx.fillRect(BK.x - BK.R, sy, BK.R * 2, BK.H + bry);
    drawSoundArcs(ctx, c, { x: bk.contact.x, y: bk.contact.y + 4, dir: Math.PI / 2, spread: TAU, n: 4, wavelength: 30, r0: 12, t, strength: k });
    ctx.restore();
  }
}
