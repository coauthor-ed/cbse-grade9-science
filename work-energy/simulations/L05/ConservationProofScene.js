import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, alpha, lighten, darken, mix, rr,
  clamp01, lerp, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// blk-l05-s04 (2 beats), the book's working at a time t (Eq. 7.9, 7.10).
//   stage 0: a ball falls for a time t; beside it the K and U bars: K grows, U shrinks,
//            and two equal gold brackets, each tagged 1/2 mg^2t^2, mark the two amounts.
//   stage 1: the same bars: the brackets now read gained and lost; the condition: no air
//            (a free fall has no surface, so there is no friction sign).
const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const GROUND = 470;
const COL_X = 92; // the falling ball's column
const TOP = 74; // ball centre at t = 0
const KPX = 36; // px fallen in one time step (fall = KPX * n^2)
const BALL_R = 16;
const FALL_S = 1.3; // the fall, seconds
const SUP = '\u00b2';
const TIMES = '\u00d7';

export class ConservationProofScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A ball falls for a time t, with ghosts at equal times: after time t it has speed gt and has fallen one half g t squared. Beside it the K and U bars: K grows and U shrinks, and two equal brackets, each one half m g squared t squared, mark the amount K gained and the amount U lost. Next, the brackets read gained and lost, and a sign says this holds with no air.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() {
    this.playT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.playT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.playT0 || 0);
  }

  busy() {
    return this.t() < 2.6;
  }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, GROUND, {});
    // the ball falls the same way on both beats (it is the thing the lines are about)
    const u = clamp01((t - 0.2) / FALL_S);
    this.fall(ctx, c, u);
    this.amounts(ctx, c, t);
  }

  // -- the falling ball with equal-time ghosts ----------------------------------

  fall(ctx, c, u) {
    const n = 3 * u; // time in steps; 3 steps = the time t
    const yAt = (k) => TOP + KPX * k * k;
    // a tall post, so the drop has a place
    const post = mix(c.stroke, c.bgDeep, 0.1);
    ctx.fillStyle = darken(post, 0.3);
    ctx.fillRect(18, TOP - 26, 14, GROUND - TOP + 26);
    ctx.fillStyle = post;
    ctx.fillRect(20, TOP - 26, 10, GROUND - TOP + 26);
    ctx.fillStyle = lighten(post, 0.3);
    ctx.fillRect(20, TOP - 26, 3, GROUND - TOP + 26);
    ctx.fillStyle = darken(post, 0.2);
    rr(ctx, 14, TOP - 30, 74, 12, 4);
    ctx.fill();
    ctx.fillStyle = lighten(post, 0.25);
    ctx.fillRect(16, TOP - 30, 70, 3);
    // equal-time ghosts behind the ball: the gaps grow
    for (let k = 0; k < 3; k++) {
      if (n < k + 0.999 && n < 3) continue;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = alpha(c.label, 0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(COL_X, yAt(k), BALL_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const y = yAt(n);
    // s = 1/2 g t^2, dashed, from the start to the ball
    if (u >= 1) {
      displacementArrow(ctx, c, COL_X + 44, yAt(0), COL_X + 44, y, { label: '\u00bd gt' + SUP, side: -1, size: 26, at: 0.42 });
      pill(ctx, c, 'v = gt', COL_X, y + BALL_R + 64, { size: 26, bg: c.s1 });
      vectorArrow(ctx, c, COL_X, y + BALL_R + 3, { angle: Math.PI / 2, length: 32, col: c.s1, width: 5 });
    }
    pill(ctx, c, 't = 0', COL_X + 70, TOP - 2, { size: 26, bg: c.stroke, alpha: 0.9 });
    drawShadow(ctx, c, COL_X, GROUND + 2, BALL_R * 0.7, 4, 0.5);
    const b = drawBall(ctx, c, { x: COL_X, y, r: BALL_R, tone: 6 });
    ctx.strokeStyle = alpha(lighten(c.s6, 0.6), 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(b.x - 6, b.y, BALL_R - 3, -0.95, 0.95);
    ctx.stroke();
  }

  // -- the K and U bars with the two equal amounts bracketed; stage 1 adds the condition --

  amounts(ctx, c, t) {
    const a = clamp01((t - 0.3) / 0.9);
    const lost = 0.45 * a; // the drawn time t: 45 percent of U has gone
    const bx = 316;
    const by = 70;
    const bh = 220;
    const box = drawEnergyBars(ctx, c, {
      x: bx, y: by, h: bh, barW: 70, gap: 44, max: 1, total: 1, size: 26,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }],
      values: { K: lost, U: 1 - lost },
    });
    if (box?.bars && a > 0.05) {
      const [kb, ub] = box.bars;
      const span = box.baseY - 3 - (box.baseY - 3 - bh + 6); // slot px for value 1
      const pxv = (bh - 6) / 1;
      void span;
      const uTop = box.baseY - 3 - pxv * 1;
      const uNow = box.baseY - 3 - pxv * (1 - lost);
      const kTop = box.baseY - 3 - pxv * lost;
      // the part U lost: a hatched band in the U slot, the same height as K's fill
      ctx.save();
      ctx.beginPath();
      ctx.rect(ub.x, uTop, ub.w, uNow - uTop);
      ctx.clip();
      ctx.strokeStyle = alpha(c.s3, 0.75);
      ctx.lineWidth = 3;
      for (let d = -ub.w; d < ub.w + (uNow - uTop); d += 11) {
        ctx.beginPath();
        ctx.moveTo(ub.x + d, uTop);
        ctx.lineTo(ub.x + d + (uNow - uTop), uNow);
        ctx.stroke();
      }
      ctx.restore();
      // brackets: the same height on both bars
      const brk = (x, y0, y1, side) => {
        ctx.strokeStyle = c.gold;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x + side * 10, y0);
        ctx.lineTo(x + side * 10, y1);
        ctx.lineTo(x, y1);
        ctx.stroke();
      };
      const ba = clamp01((t - 1.3) / 0.4);
      if (ba > 0) {
        ctx.save();
        ctx.globalAlpha = ba;
        brk(kb.x - 6, kTop, box.baseY - 3, -1);
        brk(ub.x + ub.w + 6, uTop, uNow, 1);
        ctx.restore();
        // beat 0 names the amount (the slide's algebra), beat 1 what it is
        const amt = '\u00bd mg' + SUP + 't' + SUP;
        const kTag = this.stage === 0 ? amt : 'gained', uTag = this.stage === 0 ? amt : 'lost';
        pill(ctx, c, kTag, kb.x - 24 - (this.stage === 0 ? 66 : 52), (kTop + box.baseY) / 2, { size: 26, bg: c.s1, alpha: ba });
        pill(ctx, c, uTag, ub.x + ub.w + 24 + (this.stage === 0 ? 60 : 36), (uTop + uNow) / 2, { size: 26, bg: c.s3, alpha: ba });
      }
    }
    // the condition (stage 1): no air. A free fall has no surface to rub on.
    const ca = clamp01((t - 1.8) / 0.4);
    if (this.stage === 1 && ca > 0) this.noSign(ctx, c, 400, 430, 'air', ca);
    void lerp;
    void W;
    void H;
  }

  // a round sign with the thing drawn inside and a bar across it; the word beside
  noSign(ctx, c, x, y, kind, a) {
    ctx.save();
    ctx.globalAlpha = a;
    const r = 26;
    ctx.beginPath();
    ctx.arc(x, y + 2, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.bad, 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = c.bad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r - 3, 0, Math.PI * 2);
    ctx.fillStyle = c.bgSurface;
    ctx.fill();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (kind === 'air') {
      // wind lines with curled ends
      for (const [dy, l] of [[-9, 26], [0, 32], [9, 22]]) {
        ctx.beginPath();
        ctx.moveTo(x - 16, y + dy);
        ctx.lineTo(x - 16 + l - 6, y + dy);
        ctx.arc(x - 16 + l - 6, y + dy - 4, 4, Math.PI / 2, -Math.PI / 2, true);
        ctx.stroke();
      }
    } else {
      // a block rubbing on a rough floor
      ctx.fillStyle = mix(c.gold, c.flame, 0.3);
      rr(ctx, x - 12, y - 12, 24, 16, 3);
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) ctx.lineTo(x - 18 + i * 6, y + 8 + (i % 2) * 5);
      ctx.stroke();
    }
    ctx.strokeStyle = c.bad;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.7);
    ctx.lineTo(x + r * 0.7, y - r * 0.7);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, kind === 'air' ? 'no air' : 'no friction', x + r + 14, y, { size: 26, bg: c.stroke, align: 'left', alpha: a });
  }
}
