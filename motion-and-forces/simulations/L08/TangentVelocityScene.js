/**
 * TangentVelocityScene - slide blk-l08-s3 "Steady speed, changing direction" (2 beats; Fig 4.25).
 *   b0 'tangent'     top view: a ball goes once round a circle at constant angular speed (clockwise),
 *                    leaving an equal-length v arrow along the tangent at 8 equal steps (fading to
 *                    35 per cent). A thin tangent line touches the circle at the ball's point only.
 *                    "speed: same". Rest: ball back at the top, its tangent and arrow the hero.
 *   b1 'accelerated' the arrows at the top and at the right lift off and slide to a side panel,
 *                    tail to tail: same length, different direction; an angle arc between them and
 *                    "direction changed: velocity changed". The ball goes round once more, then
 *                    "accelerated" pops beside it. No acceleration arrow.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, pill, popAt } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2, TOP = -Math.PI / 2;
const GEO = [{ x: 330, y: 282, r: 178, v: 112 }, { x: 206, y: 296, r: 152, v: 96 }];
const LEAD = 0.3, RUN = 3.2;
const B1_SLIDE = 0.4, B1_GO = 2.4, B1_RUN = 2.6;
const PANEL = { x: 400, y: 120, w: 268, h: 330 };
const TAIL = { x: 446, y: 168 };

const stepTh = (k) => TOP + (k * TAU) / 8;

export class TangentVelocityScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Top view of a ball going round a circle at constant speed. At eight equal steps it leaves a velocity arrow; all the arrows have the same length and each lies along the tangent, the straight line that touches the circle at just that point. Then two of the arrows, from the top and from the right, are placed tail to tail: same length, different direction, so the velocity has changed. The ball goes round again and the word accelerated appears beside it.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  get G() { return GEO[this.cur === 0 ? 0 : 1]; }
  at(th) { const G = this.G; return { x: G.x + G.r * Math.cos(th), y: G.y + G.r * Math.sin(th) }; }
  busy() { return this.cur === 0 ? this.age < LEAD + RUN + 1.0 : this.age < B1_GO + B1_RUN + 1.0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.tangent(ctx, c); else this.accelerated(ctx, c);
  }

  /** The circular path on a table top: a raised ring groove (lit inner edge, shaded outer edge). */
  path(ctx, c) {
    const { x: OX, y: OY, r: R } = this.G;
    ctx.save();
    ctx.beginPath(); ctx.arc(OX, OY, R, 0, TAU);
    ctx.strokeStyle = alpha(darken(c.stroke, 0.2), 0.45); ctx.lineWidth = 30; ctx.stroke();
    ctx.beginPath(); ctx.arc(OX, OY, R, 0, TAU);
    ctx.strokeStyle = lighten(c.raised, 0.2); ctx.lineWidth = 24; ctx.stroke();
    ctx.beginPath(); ctx.arc(OX, OY, R - 10, Math.PI * 0.9, Math.PI * 1.7);
    ctx.strokeStyle = alpha(lighten(c.raised, 0.7), 0.9); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(OX, OY, R, 0, TAU);
    ctx.strokeStyle = c.annot; ctx.lineWidth = 2; ctx.setLineDash([3, 7]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(OX, OY, 5, 0, TAU); ctx.fillStyle = c.labelMuted; ctx.fill();
    ctx.restore();
  }

  /** The thin tangent line through the point at th, with its tag at the trailing end. */
  tangentLine(ctx, c, th, k = 1, tag = true) {
    const p = this.at(th), dx = -Math.sin(th), dy = Math.cos(th), L = this.G.r + 40, nx = Math.cos(th), ny = Math.sin(th);
    ctx.save();
    ctx.globalAlpha = k; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x - dx * L, p.y - dy * L); ctx.lineTo(p.x + dx * L, p.y + dy * L); ctx.stroke();
    ctx.restore();
    if (tag && k > 0.05) drawTag(ctx, c, 'tangent', p.x + dx * (L - 44) + nx * 34, p.y + dy * (L - 44) + ny * 34, { alpha: k, col: c.labelMuted });
  }

  arrowAt(ctx, c, th, o = {}) {
    const p = this.at(th);
    return drawMotionArrow(ctx, c, 'v', p.x, p.y, { length: this.G.v, angle: th + Math.PI / 2, label: 'v', ...o });
  }

  ball(ctx, c, th) {
    const p = this.at(th);
    drawBall(ctx, c, { x: p.x, y: p.y, r: 17, tone: 6, shadowY: p.y + 14 });
  }

  /** Ghost arrows at the 8 steps the ball has passed (u: 0..1 of a round), each fading to 35 per cent. */
  ghosts(ctx, c, u, runSec, skip = []) {
    for (let k = 0; k < 8; k++) {
      if (skip.includes(k)) continue;
      const due = k / 8;
      if (u + 1e-6 < due) continue;
      const since = (u - due) * runSec, al = 1 - 0.65 * clamp01(since / 0.5);
      if (u >= 1 && k === 0) continue;   // back at the top: the live arrow is there
      this.arrowAt(ctx, c, stepTh(k), { alpha: al });
    }
  }

  tangent(ctx, c) {
    const a = this.age, u = clamp01((a - LEAD) / RUN), th = TOP + TAU * u;
    this.path(ctx, c);
    this.ghosts(ctx, c, u, RUN);
    this.tangentLine(ctx, c, th, 1);
    this.ball(ctx, c, th);
    this.arrowAt(ctx, c, th, { width: 7, head: 20 });
    const s = clamp01((a - 0.8) / 0.4);
    if (s > 0) drawTag(ctx, c, 'speed: same', 540, 470, { alpha: s, col: c.s1 });
  }

  accelerated(ctx, c) {
    const a = this.age;
    const slide = inOutSine(clamp01((a - B1_SLIDE) / 0.8));
    const go = clamp01((a - B1_GO) / B1_RUN), th = TOP + TAU * go;
    this.path(ctx, c);
    this.ghosts(ctx, c, 1, 100, [0, 2]);
    this.tangentLine(ctx, c, th, 0.45, false);
    this.ball(ctx, c, th);
    if (go > 0) this.arrowAt(ctx, c, th);
    // The panel and the two lifted arrows, tail to tail.
    const pk = clamp01((a - 0.1) / 0.3);
    drawSheet(ctx, c, PANEL, { alpha: pk });
    const p0 = this.at(stepTh(0)), p2 = this.at(stepTh(2));
    const t0 = { x: p0.x + (TAIL.x - p0.x) * slide, y: p0.y + (TAIL.y - p0.y) * slide };
    const t2 = { x: p2.x + (TAIL.x - p2.x) * slide, y: p2.y + (TAIL.y - p2.y) * slide };
    const lift = Math.sin(Math.PI * slide) * 6;
    // same speed, same length: the lifted arrows keep exactly the length they had on the circle
    drawMotionArrow(ctx, c, 'v', t0.x, t0.y - lift, { length: this.G.v, angle: 0, label: 'v' });
    drawMotionArrow(ctx, c, 'v', t2.x, t2.y - lift, { length: this.G.v, angle: Math.PI / 2, label: 'v', side: -1 });
    const arcK = clamp01((a - B1_SLIDE - 0.9) / 0.4);
    if (arcK > 0) {
      ctx.save();
      ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(TAIL.x, TAIL.y, 52, 0, (Math.PI / 2) * arcK); ctx.stroke();
      ctx.restore();
    }
    const tk = clamp01((a - B1_SLIDE - 1.3) / 0.4);
    if (tk > 0) {
      const cx = PANEL.x + PANEL.w / 2;
      ctx.save();
      ctx.globalAlpha = tk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.label;
      ctx.fillText('direction changed:', cx, PANEL.y + 200);
      ctx.font = font(c, 900, 28, true); ctx.fillStyle = c.s1ink ?? c.s1;
      ctx.fillText('velocity changed', cx, PANEL.y + 246);
      ctx.restore();
    }
    const p = popAt(a, B1_GO + B1_RUN + 0.1);
    if (p) {
      const b = this.at(TOP);
      pill(ctx, c, 'accelerated', b.x, b.y - 74, { size: 34, bg: c.s2, scale: p.scale, alpha: p.alpha, display: true });
    }
  }
}
