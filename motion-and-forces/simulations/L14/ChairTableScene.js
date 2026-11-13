/**
 * ChairTableScene - slide blk-l15-s1 "Push the table, and you roll back" (2 beats; Figs 6.22, 6.23).
 *   b0 'kick'  grass. A student (side view, facing right) swings the leg (0.6 s) and the foot meets the
 *              football; the ball squashes a little. Rest at the contact instant: two equal F arrows,
 *              "on the ball" (tail on the ball, right, above the contact) and "on your foot" (tail on the
 *              foot, left, below it). Ball tone series-1, the shoe series-2: each tag in its object's tone.
 *   b1 'chair' two stacked panels on a tiled classroom floor: "you" (the girl) on a wheeled office chair,
 *              feet lifted, hands on a heavy wooden table to her right.
 *              (a) push: "push on the table" (on the table, right) and "push on you" (on her, left),
 *                  equal; her arms straighten and she leans in, so the chair rolls LEFT about 64 px while
 *                  her hands stay on the table; the table stays put.
 *              (b) pull: arrows reversed; the chair rolls RIGHT towards the table.
 *              (a) plays, then (b), 1.5 s each. Rest: both end states, a faint copy of each chair's start.
 * Contact lasts the whole roll (lean + arm reach), so the pair is drawn only while the hands touch the table.
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook, figureMetrics } from 'simulations/base/kit/SimFigure.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawDesk } from 'simulations/base/kit/SimProps.js';
import { drawForce, drawField } from '../shared/ForceCast.js';
import { drawSurface, drawOfficeChair, LOOKS } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
// Kick (b0)
const GY = 432, KH = 300, HIPX = 318, BALL = { x: 424, r: 30 }, T_SW = 0.3, D_SW = 0.6, T_HIT = T_SW + D_SW;
const PAIR = 104;                                   // both arrows of a pair, one length
// Chair (b1)
const CH = 236, CM = figureMetrics(CH, 'teen'), EDGE = 446, PANEL_H = 260;
const DX_BENT = 28, DX_REACH = 102;                  // hip to grip: upright arms bent / leaning in arms straight
const LEAN_BENT = -2, LEAN_REACH = 42;
const T_A = 0.4, T_B = 2.2, D_ROLL = 1.5, CPAIR = 92;

export class ChairTableScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Beat 1: a student kicks a football. At the instant the foot meets the ball, two equal arrows: the push on the ball, to the right, and the push on your foot, to the left. Beat 2: a girl sits on a wheeled chair with her feet off the floor and her hands on a heavy table. When she pushes the table, the table pushes her back and her chair rolls away from it. When she pulls the table, the table pulls her and her chair rolls towards it. Each time the two arrows are equal and opposite.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.cur === 0 ? this.age < T_HIT + 0.8 : this.age < T_B + D_ROLL + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.drawKick(ctx, c); else this.drawChairs(ctx, c);
  }

  tag(ctx, c, s, x, y, ink, k = 1, align = 'center') {
    if (k <= 0) return null;
    return drawTag(ctx, c, s, x, y, { col: ink, size: 26, alpha: k, align, prefer: [[0, 0]] });
  }

  // -- b0: the kick ------------------------------------------------------------------
  drawKick(ctx, c) {
    const a = this.age;
    drawField(ctx, c, { x0: 0, x1: 680, y: GY, h: 520 - GY, seed: 11 });
    const by = GY - BALL.r, contact = { x: BALL.x - BALL.r + 2, y: GY - 22 };
    // The near foot swings from behind and low past the planted foot to the ball (eased arc).
    const u = ease(a, T_SW, D_SW), S = { x: HIPX - 96, y: GY - 74 }, Q = { x: HIPX + 18, y: GY + 18 };
    const foot = { x: (1 - u) ** 2 * S.x + 2 * u * (1 - u) * Q.x + u * u * contact.x, y: (1 - u) ** 2 * S.y + 2 * u * (1 - u) * Q.y + u * u * contact.y };
    const look = figureLook(c, { skin: 3, hairStyle: 'short', hair: 0, top: 's5', bottom: 'navy', shoe: 's2', shoeStyle: 'sneaker', mood: 'effort' });
    const shY = GY - 0.8 * KH;
    drawFigure(ctx, c, { x: HIPX, y: GY, height: KH, facing: 1, pose: { name: 'stand', lean: -4, crouch: 0.05 },
      feet: [foot, { x: HIPX - 46, y: GY }], hands: [{ x: HIPX - 78, y: shY + 92 }, { x: HIPX + 70, y: shY + 70 }] }, look);
    // The ball (series-1) squashes a little against the foot at contact.
    const sq = 0.12 * ease(a, T_HIT - 0.04, 0.12);
    ctx.save(); ctx.translate(BALL.x + BALL.r, GY); ctx.scale(1 - sq, 1 + sq * 0.6); ctx.translate(-(BALL.x + BALL.r), -GY);
    drawBall(ctx, c, { x: BALL.x, y: by, r: BALL.r, tone: 1, shadowY: GY + 2 });
    this.patches(ctx, c, BALL.x, by, BALL.r);
    ctx.restore();
    // The pair, at the contact: on the ball above the contact line, on the foot below it.
    const k = ease(a, T_HIT, 0.25);
    if (k > 0) {
      const yb = by - 8, yf = GY - 12;
      drawForce(ctx, c, contact.x + 4, yb, { length: PAIR * k, label: '', alpha: k, fit: false });
      const ff = drawForce(ctx, c, contact.x - 2, yf, { length: PAIR * k, angle: Math.PI, label: '', alpha: k, fit: false });
      this.tag(ctx, c, 'on the ball', contact.x + 22, yb - 54, c.s1ink, k, 'left');
      this.tag(ctx, c, 'on your foot', ff.x2 + 4, yf + 48, c.s2ink, k, 'left');
    }
  }

  /** Football panels: a few darker pentagon patches on the series-1 ball. */
  patches(ctx, c, x, y, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = alpha(darken(c.s1, 0.45), 0.85);
    for (const [px, py, s] of [[0.05, 0.05, 0.34], [-0.62, -0.38, 0.26], [0.62, -0.42, 0.26], [-0.5, 0.66, 0.26], [0.6, 0.62, 0.26]]) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const t = -Math.PI / 2 + i * 2 * Math.PI / 5; ctx.lineTo(x + px * r + Math.cos(t) * s * r, y + py * r + Math.sin(t) * s * r); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // -- b1: chair and table -----------------------------------------------------------
  drawChairs(ctx, c) {
    const a = this.age;
    this.panel(ctx, c, 0, false, ease(a, T_A, D_ROLL), clamp01((a - T_A) / 0.25), '(a) push');
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.18); ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(24, PANEL_H); ctx.lineTo(656, PANEL_H); ctx.stroke(); ctx.restore();
    this.panel(ctx, c, PANEL_H, true, ease(a, T_B, D_ROLL), clamp01((a - T_B) / 0.25), '(b) pull');
  }

  /** One panel: floor, table, a faint start chair, the girl on her chair, the pair while she acts. */
  panel(ctx, c, oy, pull, u, k, name) {
    const FY = oy + PANEL_H - 40;
    drawSurface(ctx, c, 'tiles', 0, 680, FY, { h: 30, seed: pull ? 5 : 3 });
    const desk = drawDesk(ctx, c, { x0: EDGE, x1: EDGE + 196, y: FY, forHeight: CH, build: 'teen', view: 'front' });
    const hy = desk.top - 0.012 * CH;
    const d0 = pull ? DX_REACH : DX_BENT, d1 = pull ? DX_BENT : DX_REACH;
    const l0 = pull ? LEAN_REACH : LEAN_BENT, l1 = pull ? LEAN_BENT : LEAN_REACH;
    const dx = d0 + (d1 - d0) * u, lean = l0 + (l1 - l0) * u;
    const hip = EDGE + 10 - dx, hip0 = EDGE + 10 - d0;
    // Where the chair started: a faint copy, so the roll reads at rest.
    if (u > 0.02) { ctx.save(); ctx.globalAlpha = 0.22; drawOfficeChair(ctx, c, { x: hip0, y: FY, forHeight: CH, facing: 1, tone: 's2' }); ctx.restore(); }
    const chair = drawOfficeChair(ctx, c, { x: hip, y: FY, forHeight: CH, facing: 1, tone: 's2' });
    this.spokes(ctx, c, chair.wheels, (hip - hip0));
    const look = figureLook(c, { ...LOOKS.chairGirl, top: 's2', bottom: 'navy', shoeStyle: 'sneaker', mood: 'effort' });
    drawFigure(ctx, c, { x: hip, y: FY, height: CH, build: 'teen', facing: 1, pose: { name: 'sit', lean }, seat: chair.seat,
      hands: [{ x: EDGE + 10, y: hy }, { x: EDGE + 4, y: hy + 1 }], feet: [{ x: hip + 36, y: FY - 20 }, { x: hip + 28, y: FY - 18 }] }, look);
    this.panelTag(ctx, c, name, 18, oy + 30);
    if (k <= 0) return;
    // The pair at the hands, each arrow lying on its own object: on the table just above its top, on
    // her just below the grip. Push: both tails at the grip, pointing apart. Pull: both heads at the
    // grip, tails back on each object (the table pulled left, she pulled right).
    const L = CPAIR * k, yt = desk.top - 14, yg = hy + 18;
    if (pull) {
      drawForce(ctx, c, EDGE + 8 + L, yt, { length: L, angle: Math.PI, label: '', alpha: k, fit: false });
      drawForce(ctx, c, EDGE + 2 - L, yg, { length: L, angle: 0, label: '', alpha: k, fit: false });
    } else {
      drawForce(ctx, c, EDGE + 8, yt, { length: L, angle: 0, label: '', alpha: k, fit: false });
      drawForce(ctx, c, EDGE + 2, yg, { length: L, angle: Math.PI, label: '', alpha: k, fit: false });
    }
    this.tag(ctx, c, pull ? 'pull on the table' : 'push on the table', EDGE + 98, desk.top + 46, c.s1ink, k);
    this.tag(ctx, c, pull ? 'pull on you' : 'push on you', EDGE - 2 - CPAIR - 12, yg + 34, c.s2ink, k, 'right');
  }

  /** Castor spokes turn with the roll (the kit castor has no angle). */
  spokes(ctx, c, wheels, dist) {
    ctx.save(); ctx.strokeStyle = alpha(lighten(c.label, 0.2), 0.7); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const w of wheels) {
      const t = dist / Math.max(4, w.r), r = w.r * 0.62;
      ctx.beginPath(); ctx.moveTo(w.x - Math.cos(t) * r, w.y - Math.sin(t) * r); ctx.lineTo(w.x + Math.cos(t) * r, w.y + Math.sin(t) * r); ctx.stroke();
    }
    ctx.restore();
  }

  panelTag(ctx, c, s, x, y) {
    ctx.save(); ctx.font = font(c, 800, 26, true); ctx.fillStyle = alpha(c.label, 0.72); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }
}
