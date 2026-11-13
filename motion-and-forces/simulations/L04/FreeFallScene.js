/**
 * FreeFallScene - slide blk-l04-s4 "A falling object" (Example 4.4, Fig 4.10), 3 beats.
 * b0: a ball dropped from a ledge falls past a 0-80 m scale; x = 4.9 t2 (m) in real time
 *     for 4 s; a ghost and a tag (t, v = 9.8 t) appear at each whole second.
 * b1: all ghosts; "+9.8" chips between neighbouring velocities, one by one; one acceleration
 *     arrow downward on the ball, "g = 9.8 m/s2".
 * b2: the origin O at the drop point and a "+" arrow pointing down beside the scale; ghosts dim.
 * The picture comes from the beat and the stage age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, darken, font, rr, clamp01, outBack, inkOn, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { propRig, drawGround } from 'simulations/base/kit/SimProps.js';

const G = 9.8, RUN = 4;
const Y0 = 70, PX_PER_M = 330 / 80;          // 0 m at y 70, 80 m at y 400
const SCALE_X = 140, BALL_X = 232, BALL_R = 17;
const T_X = 266, V_X = 322, CHIP_X = 486;
const SUP2 = '\u00b2';
const yOf = (m) => Y0 + m * PX_PER_M;
const posAt = (t) => 0.5 * G * t * t;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** Tag rows: at the ghost's height, pushed down so no two are closer than 34 px. */
const ROWS = (() => { const r = []; for (let i = 0; i <= 4; i++) r.push(Math.max(yOf(posAt(i)), i ? r[i - 1] + 34 : 0)); return r; })();

export class FreeFallScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A ball is dropped from a ledge and falls past a scale from 0 to 80 metres. At 0, 1, 2, 3 and 4 seconds its velocity is 0, 9.8, 19.6, 29.4 and 39.2 metres per second. Each second it gains 9.8 metres per second: an acceleration g of 9.8 metres per second squared, downward. The origin O is at the drop point and down is positive.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < (this.cur === 0 ? RUN + 0.5 : this.cur === 1 ? 2.6 : 1); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const b = this.cur, age = this.age;
    const t = b === 0 ? clamp01(age / RUN) * RUN : RUN;
    drawGround(ctx, c, propRig({ x0: 150, x1: BALL_X - BALL_R - 3, groundY: Y0 + BALL_R, scale: 1 }), { kind: 'solid' });
    this.scale(ctx, c, b === 2 ? clamp01(age / 0.5) : 0);

    // The path, the ghosts at every whole second passed, the ball.
    ctx.save(); ctx.setLineDash([6, 8]); ctx.lineWidth = 3; ctx.strokeStyle = alpha(c.labelMuted ?? c.label, 0.5);
    ctx.beginPath(); ctx.moveTo(BALL_X, Y0); ctx.lineTo(BALL_X, yOf(posAt(t))); ctx.stroke(); ctx.restore();
    const dim = b === 2 ? 1 - 0.35 * clamp01(age / 0.5) : 1;
    for (let i = 0; i <= 4; i++) {
      if (i > t + 1e-6) break;
      const ghost = i < t - 0.06;
      if (ghost) { ctx.save(); ctx.globalAlpha = 0.4 * dim; drawBall(ctx, c, { x: BALL_X, y: yOf(posAt(i)), r: BALL_R, tone: 6 }); ctx.restore(); }
      this.tag(ctx, c, i, b === 0 ? clamp01((age - i) / 0.35) : 1);
    }
    const yb = yOf(posAt(t));
    drawBall(ctx, c, { x: BALL_X, y: yb, r: BALL_R, tone: 6 });

    if (b >= 1) {
      for (let i = 0; i < 4; i++) this.chip(ctx, c, i, b === 1 ? clamp01((age - 0.3 - i * 0.45) / 0.4) : 1);
      const k = b === 1 ? clamp01((age - 2.1) / 0.4) : 1;
      if (k > 0) drawMotionArrow(ctx, c, 'a', BALL_X, yb + BALL_R + 4, { length: 84 * k, angle: Math.PI / 2, label: k > 0.9 ? 'g = 9.8 m/s' + SUP2 : '', side: 1, alpha: k });
    }
  }

  /** The metre scale, every 10 m, labelled every 20 m; on b2 the origin O and a + arrow downward. */
  scale(ctx, c, kO) {
    ctx.save();
    ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(SCALE_X, Y0); ctx.lineTo(SCALE_X, yOf(80)); ctx.stroke();
    ctx.font = font(c, 800, 26, true); ctx.textBaseline = 'middle'; ctx.textAlign = 'right'; ctx.fillStyle = c.label;
    for (let m = 0; m <= 80; m += 10) {
      const y = yOf(m), major = m % 20 === 0;
      ctx.beginPath(); ctx.moveTo(SCALE_X - (major ? 14 : 8), y); ctx.lineTo(SCALE_X, y); ctx.stroke();
      if (major) ctx.fillText(m === 0 && kO > 0.5 ? 'O' : m + ' m', SCALE_X - 20, y);
    }
    ctx.restore();
    if (kO > 0) {
      ctx.save(); ctx.globalAlpha = kO;
      ctx.beginPath(); ctx.arc(BALL_X, Y0, 7, 0, Math.PI * 2); ctx.fillStyle = c.annot; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = darken(c.annot, 0.3); ctx.stroke();
      ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.strokeStyle = c.annot;
      ctx.beginPath(); ctx.moveTo(SCALE_X, Y0); ctx.lineTo(BALL_X - 9, Y0); ctx.stroke();
      ctx.restore();
      // The positive direction: on the far side of the tags and chips, clear of every tick label.
      vectorArrow(ctx, c, 626, yOf(34), { angle: Math.PI / 2, length: 130 * outBack(kO), col: c.annot, width: 5, head: 16, alpha: kO });
      ctx.save(); ctx.globalAlpha = kO; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.annot;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+ down', 618, yOf(34) - 24); ctx.restore();
    }
  }

  /** Time and velocity tag of second i, with a short leader from the ghost. */
  tag(ctx, c, i, k) {
    if (k <= 0) return;
    const y = ROWS[i], yg = yOf(posAt(i)), v = G * i;
    ctx.save(); ctx.globalAlpha = k;
    if (Math.abs(y - yg) > 2) {
      ctx.strokeStyle = alpha(c.labelMuted ?? c.label, 0.7); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BALL_X + BALL_R + 2, yg); ctx.lineTo(T_X - 6, y); ctx.stroke();
    }
    ctx.font = font(c, 800, 26, true); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = c.labelMuted ?? c.label; ctx.fillText(i + ' s', T_X, y);
    ctx.fillStyle = c.label; ctx.fillText(fmt(+v.toFixed(1)) + ' m/s', V_X, y);
    ctx.restore();
  }

  /** "+9.8" between the velocity tags of seconds i and i + 1, with a bracket. */
  chip(ctx, c, i, k) {
    if (k <= 0) return;
    const y0 = ROWS[i], y1 = ROWS[i + 1], ym = (y0 + y1) / 2, s = outBack(k);
    ctx.save(); ctx.globalAlpha = clamp01(k * 2);
    ctx.strokeStyle = c.s2; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(CHIP_X - 30, y0 + 5); ctx.lineTo(CHIP_X - 18, y0 + 5); ctx.lineTo(CHIP_X - 18, y1 - 5); ctx.lineTo(CHIP_X - 30, y1 - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CHIP_X - 18, ym); ctx.lineTo(CHIP_X - 4, ym); ctx.stroke();
    ctx.translate(CHIP_X + 40, ym); ctx.scale(s, s);
    ctx.font = font(c, 800, 26, true);
    const w = ctx.measureText('+9.8').width + 20, h = 32;
    rr(ctx, -w / 2, -h / 2, w, h, 8); ctx.fillStyle = c.s2; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = darken(c.s2, 0.35); ctx.stroke();
    ctx.fillStyle = inkOn(c, c.s2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+9.8', 0, 1);
    ctx.restore();
  }
}
