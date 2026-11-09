import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, alpha, lighten, darken, mix, clamp01, lerp, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// blk-l04-s08: a fielder (front view, so the face stays clear) tosses a cricket
// ball straight up: knees bend with the ball at the hip, then the arm drives up
// beside the head and the ball leaves the hand. b0 it rises, slows and stops for
// an instant at the top (K 0, U largest). b1 rests with the ball at the top: the
// weight mg still pulls it down, a = g; Throw again lets it fall back and throws
// it up again. The book's ball: 200 g thrown up about 10 m, so K + U = 20 J. The
// flight is drawn shorter than 10 m to fit; the person is to his own scale.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const GROUND = 468;
const FIG_X = 196;
const FIG_H = 236;
const TOP_Y = 74; // the top of the flight
const BALL_R = 15;
const TOTAL = 20; // J
const DIP = 0.3; // knees bend, the ball drops to the hip, s
const WIND = 0.65; // legs straighten, the hand drives up; release here, s
const UP = 1.4; // flight up (and down), s
const CATCH = 0.5; // b1 replay: the ball rests in the hand before the next throw, s
const STROBE = 7; // ghost images per half-flight, equal time apart

const smooth = (u) => u * u * (3 - 2 * u);

export class FielderThrowScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static WIDTH = W;
  static HEIGHT = H;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A fielder, facing us, bends his knees and drives his throwing arm straight up beside his head, and the ball leaves his hand and climbs a vertical line. Equal-time ghost images crowd together near the top as it slows; at the top it stops for an instant, its K bar at zero and its U bar at its largest. Then a weight arrow mg points down from the ball still at the top, a = g; Throw again lets it fall back into his hand and throws it up again.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Throw again' }];

  enter() {
    this.throwT0 = 0;
    this.replay = false;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.throwT0 = this.age;
      this.replay = this.stage === 1;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.throwT0 || 0);
  }

  busy() {
    const t = this.t();
    if (this.stage === 0) return t < WIND + UP + 0.4;
    return this.replay ? t < UP + CATCH + WIND + UP + 0.6 : t < 1.0;
  }

  // An upward toss, not a bowl: a front view (the face stays clear), pose 'stand'
  // upright, crouch and heels (toe) set here, the near hand (screen right) on a grip.
  spec(crouch, toe, hands) {
    return figureFor(this, {
      role: 'adult', pose: { name: 'stand', lean: 0, crouch, toe }, x: FIG_X, y: GROUND, height: FIG_H, facing: 0,
      autoReach: false,
      ...(hands ? { hands } : {}),
      look: { outfit: 'shirt', top: 'white', bottom: 'white', sleeves: 'long', pattern: 'plain', shoe: 'white', shoeStyle: 'sneaker' },
    });
  }

  // the one vertical line the hand drives up and the ball then climbs: beside the head, never over it
  laneX() {
    if (this.lane == null) {
      const sk = solveFigure(this.spec(0, 1));
      this.lane = sk.anchors.shoulder.x + 0.2 * sk.reach;
    }
    return this.lane;
  }

  // the near hand: k 0 low by the hip (ball held), k 1 straight up over the shoulder
  grip(crouch, toe, k) {
    const sk = solveFigure(this.spec(crouch, toe));
    const s = sk.anchors.shoulder;
    const r = sk.reach;
    const x0 = this.laneX();
    const dx = x0 - s.x;
    const yUp = s.y - Math.sqrt(Math.max(0, (0.96 * r) ** 2 - dx * dx));
    const low = { x: s.x + 0.07 * FIG_H, y: sk.anchors.hip.y + 0.02 * FIG_H };
    // the arm swings out to the side on its way up, away from the face
    return { x: lerp(low.x, x0, k) + 0.07 * FIG_H * Math.sin(Math.PI * k), y: lerp(low.y, yUp, k) };
  }

  // body and hand at time t of one throw; after release the arm stays up, ready to catch
  motion(t) {
    if (t >= WIND + 0.4) return { crouch: 0, toe: 0, k: 1 };
    if (t < DIP) { const u = smooth(clamp01(t / DIP)); return { crouch: 0.3 * u, toe: 0, k: 0 }; }
    if (t < WIND) { const u = smooth((t - DIP) / (WIND - DIP)); return { crouch: 0.3 * (1 - u), toe: u, k: u }; }
    const u = smooth((t - WIND) / 0.4);
    return { crouch: 0, toe: 1 - u, k: 1 };
  }

  // the release point: the hand straight overhead, heels up, legs straight
  rel() {
    if (!this.relPt) {
      const g = this.grip(0, 1, 1);
      const sk = solveFigure(this.spec(0, 1, [g, null]));
      const h = sk.anchors.hand[0];
      this.relPt = { x: h.x, y: h.y - BALL_R + 2 };
    }
    return this.relPt;
  }

  // height fraction (0 release, 1 top) after s of the way up, s in 0..1
  hf(s) {
    const k = 1 - clamp01(s);
    return 1 - k * k;
  }

  // one throw from the hand, tt seconds in: where the ball and the body are
  throwAt(tt) {
    const m = this.motion(tt);
    if (tt < WIND) return { m, inHand: true, f: 0, ghosts: [], K: null, top: false };
    const s = clamp01((tt - WIND) / UP);
    const ghosts = [];
    for (let i = 0; i < STROBE; i++) if (i / STROBE < s - 0.02) ghosts.push(this.hf(i / STROBE));
    const f = this.hf(s);
    return { m, inHand: false, f, ghosts, K: TOTAL * (1 - f), top: s >= 1 };
  }

  // the state for this beat at time t; every beat comes to rest with the ball at the top
  state(t) {
    if (this.stage === 0) return this.throwAt(t);
    if (!this.replay) return { m: this.motion(99), inHand: false, f: 1, ghosts: [], K: 0, top: true };
    if (t < UP) { // it falls back: speeding up, ghosts spreading out
      const s = clamp01(t / UP);
      const ghosts = [];
      for (let i = 1; i < STROBE; i++) if (i / STROBE < s - 0.02) ghosts.push(1 - (i / STROBE) ** 2);
      const f = 1 - s * s;
      return { m: this.motion(99), inHand: false, f, ghosts, K: TOTAL * (1 - f), top: false, falling: true };
    }
    if (t < UP + CATCH) return { m: this.motion(99), inHand: false, f: 0, ghosts: [], K: TOTAL, top: false, falling: true };
    return this.throwAt(t - UP - CATCH);
  }

  draw(ctx, c) {
    const t = this.t();
    const R = this.rel();
    const yAt = (f) => lerp(R.y, TOP_Y, f);
    drawBackdrop(ctx, c, 'dots');
    const grass = mix(c.s3, c.bgSurface, 0.45);
    drawFloor(ctx, c, GROUND, { col: grass });
    ctx.fillStyle = alpha(c.s3, 0.12);
    for (let i = 0; i < 4; i++) ctx.fillRect(0, GROUND + 8 + i * 14, W, 7);
    this.stumps(ctx, c, 610, GROUND - 2);
    // the lane the ball climbs: a faint dashed upright
    ctx.save();
    ctx.setLineDash([4, 9]);
    ctx.strokeStyle = alpha(c.label, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(R.x, TOP_Y - 20);
    ctx.lineTo(R.x, R.y - BALL_R);
    ctx.stroke();
    ctx.restore();

    const st = this.state(t);
    const by = yAt(st.f);
    for (const g of st.ghosts) this.ball(ctx, c, R.x, yAt(g), 0.28);
    drawShadow(ctx, c, R.x, GROUND + 2, 8 + 6 * (1 - st.f), 3, 0.5);
    const hand = this.grip(st.m.crouch, st.m.toe, st.m.k);
    const sk = drawFigure(ctx, c, this.spec(st.m.crouch, st.m.toe, [hand, null]), {
      mood: st.top ? 'happy' : 'smile',
      look: st.inHand ? { x: 0.3, y: -0.2 } : { x: 0.35, y: -1 },
    });
    if (st.inHand) {
      const h = sk.anchors.hand[0];
      this.ball(ctx, c, h.x, h.y - BALL_R + 2, 1);
    } else {
      this.ball(ctx, c, R.x, by, 1);
    }

    if (st.K != null) {
      drawEnergyBars(ctx, c, {
        x: 452, y: 104, h: 190, max: TOTAL, total: TOTAL, units: 'J', showValues: true, size: 26,
        alpha: this.stage === 0 ? clamp01((t - WIND) / 0.4) : 1,
        bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }],
        values: { K: Math.max(0, st.K), U: TOTAL - Math.max(0, st.K) },
      });
    }
    if (this.stage === 0 && st.top) pill(ctx, c, 'v = 0', R.x + 70, TOP_Y, { size: 26 });
    if (this.stage === 1 && !st.inHand) {
      // the weight acts all the way: at the top, and on the way down
      const ga = this.replay ? 1 : clamp01(t / 0.5);
      vectorArrow(ctx, c, R.x, by + BALL_R + 2, { angle: Math.PI / 2, length: 24 + 50 * smooth(ga), col: c.bad, width: 5 });
      if (by < R.y - 110) pill(ctx, c, 'mg', R.x + 44, by + BALL_R + 62, { size: 26, bg: c.bad, alpha: ga });
      if (st.top) pill(ctx, c, 'a = g', R.x + 82, by, { size: 26, alpha: this.replay ? 1 : clamp01((t - 0.3) / 0.4) });
    }
  }

  // a cricket ball: red leather, a lit side, a shade side, a raised seam
  ball(ctx, c, x, y, a) {
    const body = darken(c.s6, 0.12);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.beginPath();
    ctx.arc(x, y, BALL_R + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.45);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(x + BALL_R * 0.5, y + BALL_R * 0.45, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - BALL_R * 0.38, y - BALL_R * 0.42, BALL_R * 0.36, BALL_R * 0.22, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = alpha(lighten(body, 0.6), 0.85);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.s6, 0.7), 0.95);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(x + 2, y, BALL_R * 0.45, BALL_R * 0.98, 0.35, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.setLineDash([1.5, 2.5]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x + 5, y, BALL_R * 0.45, BALL_R * 0.92, 0.35, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.restore();
  }

  // a set of stumps at the far end, for the ground
  stumps(ctx, c, x, y) {
    const wood = mix(c.gold, c.label, 0.35);
    for (const dx of [-14, 0, 14]) {
      ctx.fillStyle = darken(wood, 0.4);
      ctx.fillRect(x + dx - 3.5, y - 72, 7, 72);
      ctx.fillStyle = wood;
      ctx.fillRect(x + dx - 2.5, y - 71, 5, 70);
      ctx.fillStyle = lighten(wood, 0.4);
      ctx.fillRect(x + dx - 2.5, y - 71, 1.6, 70);
    }
    ctx.fillStyle = darken(wood, 0.3);
    ctx.fillRect(x - 18, y - 76, 17, 4);
    ctx.fillRect(x + 1, y - 76, 17, 4);
    drawShadow(ctx, c, x, y + 2, 26, 4, 0.5);
  }
}
