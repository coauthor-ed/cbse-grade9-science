import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, drawBackdrop, drawShadow, pill, font, alpha, lighten, darken, mix, luma,
  mulberry32, rr, clamp01, inOutSine, lerp,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';

// CricketBallKScene - blk-l03-s06, A Fast Delivery.
// b0: the bowler delivers a 0.2 kg ball down the pitch; beside it the unit
//     change writes on, one line at a time: 154.8 km/h, x 1000 / 3600, 43 m/s.
// b1: the same delivery; as the ball leaves the hand a K bar beside it fills
//     to 1/2 x 0.2 x 43^2 = 184.9 J. The ball carries its mass and speed tags.
// The ball is caught mid-flight at rest (a photo of a moving ball), so the
// rest frame always shows the thing that has the kinetic energy.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const MASS = 0.2, V_MS = 43;
const K_J = 0.5 * MASS * V_MS * V_MS;       // 184.9 J
const K_MAX = 200;

// One perspective ground: the pitch half-width grows with distance below the horizon.
const HORIZON_Y = 111;
const LANE_CX = 244;
const NEAR_Y = 440;     // the bowling crease
const FAR_Y = 200;      // the batter's stumps
const HW_K = 1.115;
const BALL_R0 = 40, BALL_R1 = 9;
const ROPE_Y = 140;
const GROUND_BOT = 520;
const BOWL = { x: 118, y: 500, h: 250 };
const FREEZE_U = 0.3;  // where along the pitch the rest frame holds the ball

const SWING_S = 0.45;   // arm swing up to release
const FLY_S = 0.6;      // release to the freeze point
const LINE_AT = [0.15, 0.75, 1.35];   // b0: the three conversion lines write on
const LINE_S = 0.5;
const BAR_S = 0.7;

// The right column
const COL_CX = 560;

function laneHalf(y) { return Math.max(6, HW_K * Math.pow(y - HORIZON_Y, 0.82)); }

export class CricketBallKScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = 520;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A bowler, seen from behind, delivers a 0.2 kg cricket ball down the pitch towards the batter and the stumps. Beside the pitch the speed is changed from 154.8 km/h to metres per second: times 1000, divided by 3600, gives 43 m/s. Then a kinetic energy bar beside the flying ball fills to 184.9 J.';

  enter() {
    this.motionT = 0;
    this.relPt = null;
  }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  get kBeat() { return this.stage >= 1; }

  get motionEnd() {
    return this.kBeat ? SWING_S + Math.max(FLY_S, BAR_S) + 0.1 : LINE_AT[2] + LINE_S + 0.1;
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // 0..1 arm swing, then the ball's travel 0..FREEZE_U
  get swingU() { return clamp01((this.motionT ?? 0) / SWING_S); }
  get flyU() { return FREEZE_U * inOutSine(clamp01(((this.motionT ?? 0) - SWING_S) / FLY_S)); }
  get released() { return (this.motionT ?? 0) >= SWING_S; }

  ground(c) {
    const light = luma(c.bgSurface) > 0.5;
    return {
      light,
      grass: light ? mix(c.bgSurface, c.s3, 0.62) : mix(c.bgDeep, c.s3, 0.24),
      grassAlt: light ? mix(c.bgSurface, c.s3, 0.5) : mix(c.bgDeep, c.s3, 0.32),
      strip: light ? mix(c.bgSurface, c.s2, 0.46) : mix(mix(c.bgDeep, c.s3, 0.34), c.s2, 0.2),
      rope: light ? mix(c.bgSurface, c.label, 0.72) : mix(c.bgSurface, c.label, 0.55),
      stand: light ? mix(c.bgSurface, c.s5, 0.4) : mix(c.bgDeep, c.stroke, 0.5),
      standLip: light ? mix(c.bgSurface, c.s5, 0.62) : lighten(mix(c.bgDeep, c.stroke, 0.5), 0.25),
      wood: light ? mix(c.bgSurface, c.s2, 0.42) : mix(c.bgSurface, c.s2, 0.72),
      pad: light ? mix(c.bgSurface, c.s1, 0.3) : mix(c.bgSurface, c.label, 0.4),
    };
  }

  draw(ctx, c) {
    const g = this.ground(c);
    drawBackdrop(ctx, c, 'dots');
    this.stands(ctx, c, g);
    this.outfield(ctx, c, g);
    this.strip(ctx, c, g);
    this.stumps(ctx, c, g);
    this.batter(ctx, c, g);
    this.bowler(ctx, c);
    const ball = this.ball(ctx, c, g);
    if (this.kBeat) this.kSide(ctx, c, ball);
    else this.conversion(ctx, c);
  }

  stands(ctx, c, g) {
    const top = 88, bot = 134;
    ctx.save();
    ctx.fillStyle = g.stand;
    ctx.fillRect(0, top, W, bot - top);
    ctx.fillStyle = g.standLip;
    ctx.fillRect(0, top, W, 5);
    ctx.fillStyle = alpha(darken(g.stand, 0.4), 0.8);
    ctx.fillRect(0, bot - 5, W, 5);
    // the roof of the stand
    ctx.fillStyle = darken(g.stand, 0.22);
    ctx.fillRect(0, top - 14, W, 14);
    ctx.fillStyle = lighten(g.stand, 0.18);
    ctx.fillRect(0, top - 14, W, 3);
    const rnd = mulberry32(11);
    const cols = [c.s1, c.s2, c.s3, c.s4, c.s5, c.s6, c.s8];
    for (let row = 0; row < 3; row++) {
      const y = top + 14 + row * 10;
      for (let i = 0; i < 78; i++) {
        const x = 4 + i * 8.7 + rnd() * 4;
        const col = cols[Math.floor(rnd() * cols.length)];
        ctx.fillStyle = alpha(col, (g.light ? 0.55 : 0.4) + rnd() * 0.3);
        rr(ctx, x - 2.6, y - 3 + (rnd() - 0.5) * 3, 5.2, 7, 2.4);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  outfield(ctx, c, g) {
    const bands = [520, 431, 367, 324, 289, 263, 239, 218, ROPE_Y];
    ctx.save();
    ctx.fillStyle = g.grass;
    ctx.fillRect(0, ROPE_Y, W, GROUND_BOT - ROPE_Y);
    for (let i = 1; i < bands.length - 1; i += 2) {
      ctx.fillStyle = alpha(g.grassAlt, 0.75);
      ctx.fillRect(0, bands[i + 1], W, bands[i] - bands[i + 1]);
    }
    ctx.fillStyle = g.rope;
    ctx.fillRect(0, ROPE_Y, W, 5);
    ctx.fillStyle = alpha(darken(c.bgDeep, 0.3), 0.45);
    ctx.fillRect(0, ROPE_Y + 5, W, 9);
    ctx.restore();
  }

  strip(ctx, c, g) {
    const nHW = laneHalf(NEAR_Y + 60);
    const TOP_Y = FAR_Y - 30;
    const fHW = laneHalf(TOP_Y);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(LANE_CX - nHW, NEAR_Y + 60);
    ctx.lineTo(LANE_CX + nHW, NEAR_Y + 60);
    ctx.lineTo(LANE_CX + fHW, TOP_Y);
    ctx.lineTo(LANE_CX - fHW, TOP_Y);
    ctx.closePath();
    ctx.fillStyle = g.strip;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = alpha(lighten(g.strip, 0.3), 0.7);
    ctx.fillRect(LANE_CX - fHW, TOP_Y, fHW * 2, 6);
    // shade side of the strip (the right edge), light side on the left
    ctx.fillStyle = alpha(darken(g.strip, 0.12), 0.6);
    ctx.beginPath();
    ctx.moveTo(LANE_CX + nHW * 0.62, NEAR_Y + 60);
    ctx.lineTo(LANE_CX + nHW, NEAR_Y + 60);
    ctx.lineTo(LANE_CX + fHW, TOP_Y);
    ctx.lineTo(LANE_CX + fHW * 0.62, TOP_Y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha(darken(g.strip, 0.16), 0.55);
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 6; i++) {
      const y = TOP_Y + (NEAR_Y + 60 - TOP_Y) * (i / 6) ** 1.7;
      ctx.beginPath();
      ctx.moveTo(LANE_CX - laneHalf(y), y);
      ctx.lineTo(LANE_CX + laneHalf(y), y);
      ctx.stroke();
    }
    ctx.fillStyle = alpha(lighten(c.label, 0.2), 0.82);
    for (const y of [FAR_Y, NEAR_Y]) ctx.fillRect(LANE_CX - laneHalf(y), y - 2, laneHalf(y) * 2, 4);
    ctx.restore();
    ctx.restore();
  }

  stumps(ctx, c, g) {
    const fHW = laneHalf(FAR_Y);
    const h = 39;
    const spread = Math.max(9, fHW * 0.62);
    const w = Math.max(3, spread * 0.17);
    drawShadow(ctx, c, LANE_CX, FAR_Y + 2, spread + w, 4, 0.8);
    ctx.save();
    for (let i = -1; i <= 1; i++) {
      const x = LANE_CX + i * spread;
      ctx.fillStyle = darken(g.wood, 0.3);
      ctx.fillRect(x - w / 2 - 1, FAR_Y - h + 2, w + 2, h);
      ctx.fillStyle = g.wood;
      ctx.fillRect(x - w / 2, FAR_Y - h, w, h);
      ctx.fillStyle = alpha(lighten(g.wood, 0.5), 0.6);
      ctx.fillRect(x - w / 2, FAR_Y - h, w * 0.4, h);
    }
    ctx.fillStyle = g.wood;
    rr(ctx, LANE_CX - spread - w / 2, FAR_Y - h - w * 0.8, spread * 2 + w, w * 0.85, w * 0.4);
    ctx.fill();
    ctx.restore();
  }

  batter(ctx, c, g) {
    const x = LANE_CX + laneHalf(FAR_Y) * 0.92;
    const base = FAR_Y + 2;
    const Hh = 112;
    const paintBat = (gc) => {
      gc.save();
      gc.translate(x + 26, base - 6);
      gc.rotate(-0.16);
      gc.fillStyle = darken(c.s2, 0.3);
      rr(gc, -3.5, -Hh * 0.62, 8, Hh * 0.62, 3);
      gc.fill();
      gc.fillStyle = c.s2;
      rr(gc, -3, -Hh * 0.46, 5, Hh * 0.46, 2.5);
      gc.fill();
      gc.fillStyle = lighten(c.s2, 0.35);
      gc.fillRect(-2.5, -Hh * 0.44, 1.6, Hh * 0.4);
      gc.restore();
    };
    const sk = drawFigure(ctx, c,
      { x, y: base, height: Hh, build: 'adult', facing: 0, pose: 'stand' },
      { skin: 1, hairStyle: 'short', top: c.s1, bottom: g.pad, mood: 'squint' },
      { between: paintBat });
    const hd = sk.anchors.head;
    if (hd) {
      ctx.save();
      ctx.fillStyle = c.s5;
      ctx.beginPath();
      ctx.arc(hd.x, hd.y - hd.r * 0.12, hd.r * 1.06, Math.PI * 1.02, Math.PI * 1.98);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = darken(c.s5, 0.3);
      ctx.fillRect(hd.x - hd.r * 1.06, hd.y - hd.r * 0.16, hd.r * 2.12, hd.r * 0.16);
      ctx.fillStyle = lighten(c.s5, 0.3);
      ctx.fillRect(hd.x - hd.r * 0.7, hd.y - hd.r * 0.95, hd.r * 0.6, hd.r * 0.14);
      ctx.restore();
    }
  }

  // The bowler, in whites: the kit's overarm delivery up to release (throw u
  // 0..0.62), then a follow-through set by the scene (the kit's own ending
  // leaves the arms hanging): a long braced stride, the body leaning down the
  // pitch, the bowling (far) arm swept forward and low past the front knee, the
  // near arm thrown back for balance.
  bowler(ctx, c) {
    const t = this.motionT ?? 0;
    const H = BOWL.h;
    const look = { outfit: 'shirt', top: 'white', bottom: 'white', sleeves: 'long', pattern: 'plain', shoe: 'white', shoeStyle: 'sneaker', skin: 2, hairStyle: 'short' };
    const base = { role: 'adult', x: BOWL.x, y: BOWL.y, height: H, facing: 1, look };
    const relSpec = figureFor(this, { ...base, pose: { name: 'throw', u: 0.62 } });
    if (!this.relPt) {
      const rel = solveFigure(relSpec).anchors.hand[1];
      this.relPt = rel ? { x: rel.x, y: rel.y } : { x: 216, y: 380 };
      const rk = solveFigure(relSpec).anchors.hand;
      this.relHands = rk.map((h) => ({ x: h.x, y: h.y }));
    }
    let spec;
    if (t < SWING_S) {
      spec = figureFor(this, { ...base, pose: { name: 'throw', u: 0.62 * (t / SWING_S) } });
    } else {
      const k = inOutSine(clamp01((t - SWING_S) / 0.4));
      const ft = [
        { x: BOWL.x - 0.17 * H, y: BOWL.y - 0.6 * H },   // near arm: back and up, for balance
        { x: BOWL.x + 0.25 * H, y: BOWL.y - 0.33 * H },  // bowling arm: forward and low, past the front knee
      ];
      const hands = ft.map((q, i) => ({ x: lerp(this.relHands[i].x, q.x, k), y: lerp(this.relHands[i].y, q.y, k) }));
      spec = figureFor(this, {
        ...base,
        pose: { name: 'stand', lean: 22 * k + 8, crouch: 0.16 * k + 0.06 },
        feet: [{ x: BOWL.x - 0.16 * H, y: BOWL.y }, { x: BOWL.x + 0.2 * H, y: BOWL.y }],
        hands, autoReach: false,
      });
    }
    const sk = drawFigure(ctx, c, spec, { mood: t < SWING_S + 0.4 && t > 0.05 ? 'effort' : 'smile' });
    this.handPt = sk.anchors.hand[1] ? { x: sk.anchors.hand[1].x, y: sk.anchors.hand[1].y } : { x: 216, y: 400 };
  }

  ball(ctx, c, g) {
    const u = this.flyU;
    const inHand = !this.released;
    const r = inHand ? BALL_R0 * 0.62 : BALL_R0 * 0.62 + (BALL_R1 - BALL_R0 * 0.62) * (u / 1);
    const p0 = this.relPt;
    const gy = NEAR_Y + (FAR_Y - NEAR_Y) * u;
    const bx = inHand ? this.handPt.x : p0.x + (LANE_CX - p0.x) * u;
    const by = inHand ? this.handPt.y : p0.y + ((FAR_Y - BALL_R1) - p0.y) * u;
    if (!inHand) {
      // speed streaks along the line of travel
      const dx = LANE_CX - p0.x, dy = (FAR_Y - BALL_R1) - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      ctx.save();
      ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        const off = k * r * 0.62;
        const tail = r * (k === 0 ? 3.2 : 2.1) * clamp01(u / 0.12);
        const sx = bx - ux * r * 0.9 - uy * off, sy = by - uy * r * 0.9 + ux * off;
        ctx.strokeStyle = alpha(lighten(g.light ? c.s6 : c.s2, 0.45), k === 0 ? 0.7 : 0.36);
        ctx.lineWidth = Math.max(2, r * (k === 0 ? 0.42 : 0.26));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - ux * tail, sy - uy * tail);
        ctx.stroke();
      }
      ctx.restore();
      drawShadow(ctx, c, bx, gy + 1, r * 0.95, Math.max(2, r * 0.2), 0.9);
    }
    const body = g.light ? darken(c.s6, 0.22) : c.s6;
    ctx.save();
    ctx.translate(bx, by);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-r * 0.06, -r * 0.06, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.fillStyle = alpha(lighten(body, 0.55), 0.7);
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.46, r * 0.3, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    // the seam and its stitches
    ctx.strokeStyle = alpha(lighten(c.label, 0.2), 0.85);
    ctx.lineWidth = Math.max(1.4, r * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.74, r * 0.32, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = alpha(darken(body, 0.5), 0.6);
    ctx.lineWidth = Math.max(0.8, r * 0.04);
    ctx.setLineDash([Math.max(1.5, r * 0.14), Math.max(1.5, r * 0.1)]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.74, r * 0.32, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // the mass tag, to the right of the ball (the bowler is on its left)
    const tx = bx + r + 62;
    ctx.save();
    ctx.strokeStyle = alpha(c.s2, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + r + 2, by);
    ctx.lineTo(tx - 40, by - 26);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, `${MASS} kg`, tx, by - 30, { bg: c.s2, size: 26 });
    return { x: bx, y: by, r, tagX: tx };
  }

  // b0: the unit change, written on line by line in the right column.
  conversion(ctx, c) {
    const t = this.motionT ?? 0;
    const rows = [
      { text: '154.8 km/h', y: 170, size: 34, bg: c.s4 },
      { text: '\u00d7 1000 \u00f7 3600', y: 262, size: 26, bg: null },
      { text: '43 m/s', y: 354, size: 40, bg: c.s1 },
    ];
    // the column card
    ctx.save();
    rr(ctx, COL_CX - 112, 110, 224, 304, 18);
    ctx.fillStyle = alpha(c.bgSurface, 0.9);
    ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    rows.forEach((row, i) => {
      const u = clamp01((t - LINE_AT[i]) / LINE_S);
      if (u <= 0) return;
      ctx.save();
      // write-on: a clip that opens left to right
      ctx.beginPath();
      ctx.rect(COL_CX - 110, row.y - 40, 220 * inOutSine(u), 80);
      ctx.clip();
      if (row.bg) pill(ctx, c, row.text, COL_CX, row.y, { bg: row.bg, size: row.size, display: true });
      else {
        ctx.font = font(c, 800, row.size, true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = c.label;
        ctx.fillText(row.text, COL_CX, row.y);
      }
      ctx.restore();
    });
    // down arrows between the rows, drawn as each next row starts
    for (const [i, y0, y1] of [[1, 198, 236], [2, 288, 318]]) {
      const u = clamp01((t - LINE_AT[i]) / 0.3);
      if (u <= 0) continue;
      ctx.save();
      ctx.globalAlpha = u;
      ctx.strokeStyle = c.labelMuted;
      ctx.fillStyle = c.labelMuted;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(COL_CX - 84, y0);
      ctx.lineTo(COL_CX - 84, y1 - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(COL_CX - 84, y1);
      ctx.lineTo(COL_CX - 91, y1 - 11);
      ctx.lineTo(COL_CX - 77, y1 - 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // b1: the speed tag on the ball and the K bar that fills as it leaves the hand.
  kSide(ctx, c, ball) {
    const t = this.motionT ?? 0;
    const bu = clamp01((t - SWING_S) / BAR_S);
    pill(ctx, c, `${V_MS} m/s`, ball.tagX, ball.y + 44, { bg: c.s1, size: 26, alpha: this.released ? 1 : 0.35 });
    const k = barsAt({ K: 0 }, { K: K_J }, bu).K;
    drawEnergyBars(ctx, c, {
      x: 520, y: 118, h: 270, max: K_MAX, size: 26,
      bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: k },
      anchor: { x: ball.x + ball.r, y: ball.y - 4 }, // clear of both tags
    });
    pill(ctx, c, '184.9 J', 559, 80, { bg: c.s1, size: 28, display: true, alpha: clamp01(bu * 1.6) });
  }
}
