/**
 * MerryGoRoundScene - slide blk-l08-n01 "The merry-go-round" (2 beats; Fig 4.22).
 *   b0 'arc'   top view of a merry-go-round turning clockwise. The child (top-view token on a
 *              seat) goes A -> B -> C (book: A at the top, B a little round, C at the right).
 *              A solid ribbon (distance) grows along the curve behind the child, then the dashed
 *              displacement arrow AC is drawn. Rest: child at C, both marks with their tags.
 *   b1 'round' from A the child goes one full round (constant angular speed; a stopwatch runs
 *              once and reads T). The ribbon closes into the circle ("distance = 2 pi R"); the
 *              dashed arrow from A to the child grows and shrinks back to the dot form
 *              ("displacement = 0"). Then average speed = 2 pi R / T (hero) and average velocity = 0.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const OX = 210, OY = 300, R = 150, PR = 178, TAU = Math.PI * 2;
const TH_A = -Math.PI / 2, TH_B = -Math.PI / 4, TH_C = 0;
const B0_LEAD = 0.4, B0_RUN = 2.2, B1_LEAD = 0.4, B1_RUN = 3.0;
const PI = '\u03c0';

const at = (th, r = R) => ({ x: OX + r * Math.cos(th), y: OY + r * Math.sin(th) });

/** A child seen from above: shoulders across the heading, head with hair, a face crescent in front. */
function topPerson(ctx, c, x, y, heading, s, look) {
  const ca = Math.cos(heading), sa = Math.sin(heading);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(heading);
  ctx.beginPath(); ctx.ellipse(3, 4, s * 0.34, s * 0.6, 0, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.3); ctx.fill();
  // shoulders and arms (to the knees in front: sitting)
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.56, 0, 0, TAU);
  ctx.fillStyle = look.top; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = darken(look.top, 0.4); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-s * 0.06, -s * 0.2, s * 0.14, s * 0.22, 0, 0, TAU); ctx.fillStyle = alpha(lighten(look.top, 0.5), 0.55); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.32, 0, s * 0.16, s * 0.34, 0, 0, TAU); ctx.fillStyle = look.bottom; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = darken(look.bottom, 0.35); ctx.stroke();
  // head: face crescent forward, hair over the crown
  const hr = s * 0.25;
  ctx.beginPath(); ctx.arc(s * 0.05, 0, hr, 0, TAU); ctx.fillStyle = look.skin; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = darken(look.skin, 0.35); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.02, 0, hr * 0.92, 0, TAU); ctx.fillStyle = look.hair; ctx.fill();
  ctx.beginPath(); ctx.arc(-s * 0.08, -hr * 0.3, hr * 0.32, 0, TAU); ctx.fillStyle = alpha(lighten(look.hair, 0.5), 0.45); ctx.fill();
  ctx.beginPath(); ctx.arc(-s * 0.26, 0, hr * 0.42, 0, TAU); ctx.fillStyle = look.hair; ctx.fill();
  ctx.restore();
  return { x: x + ca * s * 0.3, y: y + sa * s * 0.3 };
}

export class MerryGoRoundScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Top view of a merry-go-round turning. A child on a seat goes from A to B to C, a quarter of the way round. The distance travelled is the curved path ABC, drawn as a solid band; the displacement is the straight dashed arrow from A to C. Then the child goes one full round back to A in a time T: the distance is the whole circle, 2 pi R, the displacement shrinks to zero, the average speed is 2 pi R over T and the average velocity is zero.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.cur === 0 ? this.age < B0_LEAD + B0_RUN + 1.4 : this.age < B1_LEAD + B1_RUN + 2.0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.arc(ctx, c); else this.round(ctx, c);
  }

  look(c) { return figureLook(c, { skin: 1, hairStyle: 'short', hair: 1, top: 2, bottom: 5 }); }

  /** The platform, turned by rot (radians): deck, coloured rim band, spokes, six seats, centre post. */
  platform(ctx, c, rot) {
    const deck = mix(c.bgSurface, c.s7, 0.35), band = [c.s3, c.s6];
    ctx.save();
    ctx.beginPath(); ctx.ellipse(OX + 6, OY + 10, PR + 4, PR + 4, 0, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.35); ctx.fill();
    const g = ctx.createRadialGradient(OX - 60, OY - 70, 20, OX, OY, PR);
    g.addColorStop(0, lighten(deck, 0.35)); g.addColorStop(1, darken(deck, 0.12));
    ctx.beginPath(); ctx.arc(OX, OY, PR, 0, TAU); ctx.fillStyle = g; ctx.fill();
    // rim band in alternating colours
    for (let i = 0; i < 12; i++) {
      const a0 = rot + (i * TAU) / 12, a1 = a0 + TAU / 12;
      ctx.beginPath(); ctx.arc(OX, OY, PR, a0, a1); ctx.arc(OX, OY, PR - 16, a1, a0, true); ctx.closePath();
      ctx.fillStyle = band[i % 2]; ctx.fill();
    }
    ctx.lineWidth = 2; ctx.strokeStyle = alpha(lighten(deck, 0.6), 0.8);
    ctx.beginPath(); ctx.arc(OX, OY, PR - 18, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    // spokes (planks)
    ctx.strokeStyle = alpha(darken(deck, 0.3), 0.6); ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = rot + (i * TAU) / 6 + TAU / 12;
      ctx.beginPath(); ctx.moveTo(OX + 30 * Math.cos(a), OY + 30 * Math.sin(a)); ctx.lineTo(OX + (PR - 16) * Math.cos(a), OY + (PR - 16) * Math.sin(a)); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(OX, OY, PR, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = darken(c.s3, 0.45); ctx.stroke();
    ctx.beginPath(); ctx.arc(OX, OY, PR - 16, 0, TAU); ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(darken(c.s3, 0.4), 0.6); ctx.stroke();
    // seats
    for (let i = 0; i < 6; i++) {
      const a = rot + TH_A + (i * TAU) / 6, p = at(a);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
      rr(ctx, -20, -26, 40, 52, 9); ctx.fillStyle = c.gold; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = darken(c.gold, 0.45); ctx.stroke();
      rr(ctx, -14, -20, 14, 40, 5); ctx.fillStyle = alpha(lighten(c.gold, 0.5), 0.6); ctx.fill();
      ctx.restore();
    }
    // centre post
    ctx.beginPath(); ctx.arc(OX, OY, 26, 0, TAU); ctx.fillStyle = darken(c.s8, 0.05); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = darken(c.s8, 0.45); ctx.stroke();
    ctx.beginPath(); ctx.arc(OX - 6, OY - 7, 10, 0, TAU); ctx.fillStyle = alpha(lighten(c.s8, 0.6), 0.7); ctx.fill();
    ctx.restore();
  }

  /** The radius, marked once along the left. */
  radius(ctx, c, k = 1) {
    ctx.save();
    ctx.globalAlpha = k; ctx.strokeStyle = c.annot; ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.moveTo(OX - 26, OY); ctx.lineTo(OX - R, OY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(OX - R, OY, 4, 0, TAU); ctx.fillStyle = c.annot; ctx.fill();
    this.letter(ctx, c, 'R', OX - R / 2 - 10, OY - 22);
    ctx.restore();
  }

  letter(ctx, c, s, x, y, k = 1) {
    ctx.save();
    ctx.globalAlpha *= k; ctx.font = font(c, 800, 28, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = c.bgSurface; ctx.strokeText(s, x, y);
    ctx.fillStyle = c.label; ctx.fillText(s, x, y);
    ctx.restore();
  }

  /** The distance ribbon from A clockwise through angle sweep (radians). */
  ribbon(ctx, c, sweep) {
    if (sweep <= 0.001) return;
    const col = c.s5;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(OX, OY, R, TH_A, TH_A + sweep); ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = 16; ctx.stroke();
    ctx.beginPath(); ctx.arc(OX, OY, R, TH_A, TH_A + sweep); ctx.strokeStyle = col; ctx.lineWidth = 11; ctx.stroke();
    ctx.beginPath(); ctx.arc(OX, OY, R - 2, TH_A, TH_A + sweep); ctx.strokeStyle = alpha(lighten(col, 0.55), 0.7); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  child(ctx, c, th) {
    const p = at(th);
    topPerson(ctx, c, p.x, p.y, th + Math.PI / 2, 66, this.look(c));
    return p;
  }

  arc(ctx, c) {
    const a = this.age, u = inOutSine(clamp01((a - B0_LEAD) / B0_RUN)), th = TH_A + (TH_C - TH_A) * u;
    this.platform(ctx, c, th - TH_A);
    this.radius(ctx, c);
    this.ribbon(ctx, c, th - TH_A);
    const k = clamp01((a - B0_LEAD - B0_RUN - 0.1) / 0.5);
    const A = at(TH_A), C = at(TH_C);
    if (k > 0) {
      const len = Math.hypot(C.x - A.x, C.y - A.y) * k;
      drawMotionArrow(ctx, c, 's', A.x, A.y, { length: len, angle: Math.atan2(C.y - A.y, C.x - A.x), label: '' });
    }
    this.child(ctx, c, th);
    this.letter(ctx, c, 'A', at(TH_A, 204).x, at(TH_A, 204).y);
    this.letter(ctx, c, 'B', at(TH_B, 204).x, at(TH_B, 204).y);
    this.letter(ctx, c, 'C', at(TH_C, 204).x + 4, at(TH_C, 204).y);
    const t1 = clamp01((a - B0_LEAD - B0_RUN + 0.3) / 0.4), t2 = clamp01((a - B0_LEAD - B0_RUN - 0.6) / 0.4);
    if (t1 > 0) drawTag(ctx, c, 'distance = curve ABC', 470, 108, { col: darken(c.s5, 0.15), alpha: t1 });
    if (t2 > 0) drawTag(ctx, c, 'displacement = AC', 392, 226, { col: c.s4, align: 'left', alpha: t2 });
  }

  round(ctx, c) {
    const a = this.age, u = clamp01((a - B1_LEAD) / B1_RUN), th = TH_A + TAU * u;
    this.platform(ctx, c, th - TH_A);
    this.radius(ctx, c, 0.6);
    this.ribbon(ctx, c, TAU * u);
    const A = at(TH_A);
    const p = at(th), d = Math.hypot(p.x - A.x, p.y - A.y);
    const end = clamp01((a - B1_LEAD - B1_RUN - 0.1) / 0.4);
    if (u > 0 && u < 1 && d > 30) {
      drawMotionArrow(ctx, c, 's', A.x, A.y, { length: d, angle: Math.atan2(p.y - A.y, p.x - A.x), label: '' });
    }
    this.child(ctx, c, th);
    if (u >= 1) {
      drawMotionArrow(ctx, c, 's', A.x, A.y - 34, { length: 0, label: '', alpha: end });
    }
    this.letter(ctx, c, 'A', A.x - 26, at(TH_A, 204).y);
    // stopwatch: one turn of the hand for one round, reads T at the end
    drawStopwatch(ctx, c, { x: 580, y: 112, r: 52, seconds: 60 * u, dialSeconds: 60, text: u >= 1 ? 'T' : 'time', readout: 'below' });
    if (end > 0) {
      drawTag(ctx, c, 'displacement = 0', A.x + 24, A.y - 34, { col: c.s4, align: 'left', alpha: end });
      drawTag(ctx, c, 'distance = 2' + PI + 'R', 372, 478, { col: darken(c.s5, 0.15), align: 'left', alpha: end });
    }
    const s1 = clamp01((a - B1_LEAD - B1_RUN - 0.7) / 0.4), s2 = clamp01((a - B1_LEAD - B1_RUN - 1.3) / 0.4);
    if (s1 <= 0) return;
    const P = { x: 420, y: 232, w: 248, h: 206 }, cx = P.x + P.w / 2;
    drawSheet(ctx, c, P, { alpha: s1 });
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = s1; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.label;
    ctx.fillText('average speed', cx, P.y + 36);
    ctx.font = font(c, 900, 40, true); ctx.fillStyle = darken(c.s5, 0.2);
    ctx.fillText('= 2' + PI + 'R / T', cx, P.y + 84);
    if (s2 > 0) {
      ctx.globalAlpha = s2; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.label;
      ctx.fillText('average velocity', cx, P.y + 136);
      ctx.font = font(c, 900, 32, true); ctx.fillStyle = c.s4;
      ctx.fillText('= 0', cx, P.y + 174);
    }
    ctx.restore();
  }
}
