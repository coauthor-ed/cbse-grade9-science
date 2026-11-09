import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, alpha, lighten, darken, mix, rr,
  clamp01, lerp, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';
import { drawBall, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// Book Fig 7.19: a ball held at A, height h; B halfway; C the ground.
//   blk-l05-s01 (1 beat): stage 0, the ball held at A. U = mgh, K = 0.
//   blk-l05-s02 predict setup: the same stage 0 (nothing moves, no halfway mark).
//   blk-l05-s03 (2 beats): stage 1 the ball falls to B (half and half),
//   stage 2 it falls on to C (K = mgh). The bars are computed from the drawn height.
const MAP1 = [[{ idx: 0, dwellMs: null }]];
const MAP2 = [[{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];

const GROUND = 468;
const ROOF = 176;
const BLD_X0 = 22;
const BLD_X1 = 184;
const BALL_X = 206;
const BALL_R = 19;
const TOP_B = 116; // ball bottom at A
const SPAN = GROUND - TOP_B; // h in px
const SCALE_X = 262;
const FALL_AB = 0.75; // s, A to B
const FALL_BC = 0.32; // s, B to C (it is faster lower down)

const bottomAt = (frac) => GROUND - SPAN * frac; // frac = height / h

export class FreeFallScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP2;
  static BEAT_MAPS = { 1: MAP1, 2: MAP2, 0: MAP1, [Number.MAX_SAFE_INTEGER]: MAP1 };   // predict setup shows stage 0 (ball at A), not the answer
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A student on a roof holds a ball at point A, a height h above the ground. Energy bars show U full and K zero, with a dashed line for the total mgh. When the ball has fallen to B, halfway down, the U and K bars are equal halves. At C, the ground, K is full and U is zero; the total line never moves.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Drop again' }];

  enter() {
    this.dropT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.dropT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.dropT0 || 0);
  }

  busy() {
    return this.stage > 0 && this.t() < 0.4 + FALL_AB + FALL_BC + 0.6;
  }

  // the fraction of h the ball is above the ground, from the stage and the clock
  frac(t) {
    const s = this.stage;
    if (s === 0) return 1;
    const t0 = t - 0.4;
    const fallAt = (tt, tTot) => 1 - clamp01(tt / tTot) * clamp01(tt / tTot); // free fall: drop grows as t^2
    if (s === 1) return 1 - 0.5 * (1 - fallAt(t0, FALL_AB));
    // stage 2: B then C, the same fall carried on (a replay starts from A)
    if (this.dropT0) {
      const tt = Math.max(0, t0);
      const tTot = FALL_AB * Math.SQRT2; // t to fall the whole h
      const d = clamp01(tt / tTot);
      return 1 - d * d;
    }
    // cold start on the beat: from B on down
    const tB = FALL_AB; // time at B in a fall from A
    const tTot = FALL_AB * Math.SQRT2;
    const tt = clamp01((tB + Math.max(0, t0) * ((tTot - tB) / FALL_BC)) / tTot);
    return 1 - tt * tt;
  }

  draw(ctx, c) {
    const t = this.t();
    const s = this.stage;
    const f = this.frac(t);
    const bottom = bottomAt(f);
    const by = bottom - BALL_R;
    drawBackdrop(ctx, c, 'sky', { t: 0 });
    drawFloor(ctx, c, GROUND, {});
    this.building(ctx, c);
    // the student on the roof: holding the ball out at A, then hands back once it is let go
    const held = s === 0;
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'stand', lean: 0 }, x: 150, y: ROOF, height: 150, facing: 1, autoReach: false,
      hands: held ? [{ x: BALL_X - BALL_R + 4, y: TOP_B - BALL_R - 6 }, { x: BALL_X - 8, y: TOP_B - 2 * BALL_R + 4 }] : null,
    });
    drawFigure(ctx, c, spec, { mood: 'smile' });
    // the scale: A, B (stage 1 on), C
    this.scale(ctx, c, s);
    // ghosts of where the ball was
    if (s >= 1) this.ghost(ctx, c, bottomAt(1) - BALL_R);
    if (s === 2) this.ghost(ctx, c, bottomAt(0.5) - BALL_R);
    // the fall path, dotted
    if (s >= 1) {
      ctx.save();
      ctx.setLineDash([2, 9]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = alpha(c.label, 0.45);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BALL_X, TOP_B - BALL_R);
      ctx.lineTo(BALL_X, by);
      ctx.stroke();
      ctx.restore();
    }
    // h: dashed, from the ground up to the ball at A (all stages); h/2 at B
    displacementArrow(ctx, c, 380, GROUND, 380, TOP_B, { label: 'h', side: -1, size: 28, at: 0.62 });
    if (s >= 1) displacementArrow(ctx, c, 330, GROUND, 330, bottomAt(0.5), { label: 'h/2', side: 1, size: 28, at: 0.5, alpha: 0.95 });
    if (f < 0.995 && f > 0.02) drawShadow(ctx, c, BALL_X, GROUND + 2, BALL_R * (0.5 + 0.5 * (1 - f)), 4, 0.7);
    else if (f <= 0.02) drawShadow(ctx, c, BALL_X, GROUND + 2, BALL_R, 5, 1);
    this.ball(ctx, c, BALL_X, by);
    // the weight while it falls
    if (s >= 1 && f > 0.06) {
      vectorArrow(ctx, c, BALL_X, by + BALL_R + 4, { angle: Math.PI / 2, length: 52, col: c.bad, width: 5 });
      pill(ctx, c, 'mg', BALL_X + 34, by + BALL_R + 36, { size: 28, bg: c.bad });
    }
    this.bars(ctx, c, f, s);
  }

  building(ctx, c) {
    const wall = mix(c.gold, c.flame, 0.35);
    const x0 = BLD_X0;
    const x1 = BLD_X1;
    const w = x1 - x0;
    // body
    ctx.fillStyle = darken(wall, 0.45);
    ctx.fillRect(x0 - 2, ROOF - 2, w + 4, GROUND - ROOF + 2);
    ctx.fillStyle = wall;
    ctx.fillRect(x0, ROOF, w, GROUND - ROOF);
    ctx.fillStyle = darken(wall, 0.16);
    ctx.fillRect(x0 + w * 0.7, ROOF, w * 0.3, GROUND - ROOF);
    ctx.fillStyle = lighten(wall, 0.28);
    ctx.fillRect(x0, ROOF, 8, GROUND - ROOF);
    // brick courses
    ctx.strokeStyle = alpha(darken(wall, 0.4), 0.35);
    ctx.lineWidth = 1.5;
    for (let y = ROOF + 18; y < GROUND; y += 14) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }
    // windows: two columns, three floors
    for (let fl = 0; fl < 3; fl++) {
      for (let col = 0; col < 2; col++) {
        const wx = x0 + 24 + col * 76;
        const wy = ROOF + 34 + fl * 92;
        ctx.fillStyle = darken(wall, 0.5);
        rr(ctx, wx - 3, wy - 3, 50, 52, 4);
        ctx.fill();
        ctx.fillStyle = mix(c.glass, c.bgDeep, 0.25);
        rr(ctx, wx, wy, 44, 46, 3);
        ctx.fill();
        ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.55);
        ctx.beginPath();
        ctx.moveTo(wx + 4, wy + 40);
        ctx.lineTo(wx + 4, wy + 4);
        ctx.lineTo(wx + 22, wy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = darken(wall, 0.5);
        ctx.fillRect(wx + 20, wy, 4, 46);
        ctx.fillStyle = lighten(wall, 0.2);
        ctx.fillRect(wx - 6, wy + 48, 56, 6);
      }
    }
    // the door
    ctx.fillStyle = darken(wall, 0.3);
    rr(ctx, x0 + 58, GROUND - 64, 48, 64, 4);
    ctx.fill();
    // parapet (a low wall round the roof edge)
    ctx.fillStyle = darken(wall, 0.3);
    ctx.fillRect(x0 - 8, ROOF - 14, w + 8, 16);
    ctx.fillStyle = lighten(wall, 0.35);
    ctx.fillRect(x0 - 8, ROOF - 14, w + 8, 4);
  }

  scale(ctx, c, s) {
    // a surveyor's staff from the ground to A, marked in tenths of h
    const x = SCALE_X;
    const top = TOP_B;
    const wood = mix(c.gold, c.bgDeep, 0.12);
    ctx.fillStyle = darken(wood, 0.4);
    ctx.fillRect(x - 9, top - 2, 18, GROUND - top + 2);
    ctx.fillStyle = wood;
    ctx.fillRect(x - 7, top, 14, GROUND - top);
    ctx.fillStyle = darken(wood, 0.15);
    ctx.fillRect(x + 2, top, 5, GROUND - top);
    ctx.fillStyle = lighten(wood, 0.35);
    ctx.fillRect(x - 7, top, 3, GROUND - top);
    for (let i = 0; i <= 10; i++) {
      const y = GROUND - (SPAN * i) / 10;
      ctx.fillStyle = alpha(c.bgDeep, i % 5 === 0 ? 0.9 : 0.55);
      ctx.fillRect(x - 7, y - 1, i % 5 === 0 ? 14 : 8, 2.5);
    }
    // levels from the ball across to the staff
    const lev = (y, a) => {
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = alpha(c.labelMuted, 0.7 * a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BALL_X + BALL_R + 6, y);
      ctx.lineTo(x - 10, y);
      ctx.stroke();
      ctx.restore();
    };
    lev(TOP_B, 1);
    if (s >= 1) lev(bottomAt(0.5), 1);
    const tag = (txt, y, on) => pill(ctx, c, txt, x + 32, y - 20, { size: 28, bg: on ? c.accent : c.stroke });
    tag('A', TOP_B, s === 0);
    if (s >= 1) tag('B', bottomAt(0.5), s === 1);
    tag('C', GROUND, s === 2);
  }

  ghost(ctx, c, y) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = alpha(c.label, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(BALL_X, y, BALL_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ball(ctx, c, x, y) {
    const b = drawBall(ctx, c, { x, y, r: BALL_R, tone: 6 });
    // a seam, so it reads as a real ball
    ctx.save();
    ctx.strokeStyle = alpha(lighten(c.s6, 0.6), 0.9);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(b.x - 7, b.y, BALL_R - 3, -0.95, 0.95);
    ctx.stroke();
    ctx.restore();
  }

  bars(ctx, c, f, s) {
    // U = mgh' with h' the drawn height; K = what U lost. Total mgh.
    const values = { K: 1 - f, U: f };
    const box = drawEnergyBars(ctx, c, {
      x: 440, y: 74, h: 280, barW: 62, gap: 56, max: 1, total: 1,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }],
      values: barsAt(values, values, 1),
      title: 'energy', size: 26,
    });
    if (!box?.bars) return;
    // value pills above the bars, in mgh, at the rest values of the stage
    const rest = [{ K: '0', U: 'mgh' }, { K: '\u00bd mgh', U: '\u00bd mgh' }, { K: 'mgh', U: '0' }][s];
    const settled = Math.abs(f - [1, 0.5, 0][s]) < 0.01;
    for (const b of box.bars) {
      const txt = rest[b.id];
      const yTop = Math.min(b.top.y, box.baseY) - 24;
      pill(ctx, c, txt, b.x + b.w / 2, Math.max(yTop, box.y0 + 60), {
        size: 26, bg: b.id === 'K' ? c.s1 : c.s3, alpha: settled ? 1 : 0,
      });
    }
    // the total line's name, under the panel
    pill(ctx, c, 'total = mgh', box.x0 + box.w / 2, box.y0 + box.h + 28, { size: 26, bg: c.stroke });
    void lerp;
    void font;
    void H;
  }
}
