import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, inOutSine, clamp01, mix, alpha, lighten, darken, rr, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { bicycleRig, drawBicycle } from 'simulations/base/kit/SimProps.js';

// BallChargeScene - rebuilt 2026-11-03 (book Fig 7.8).
// Setup (blk-l02-s01, hostRole 'setup'): a fielder wound up to throw, the ball
//   in hand, three stumps standing. No bars, no arrows: nothing that answers.
// blk-l02-s02:
// K and U are named only at blk-l02-s12, so every bar here is one plain
// "energy" bar for one object (the ball, then the pot).
// b0 the throw: the hand pushes the ball forward (F solid, the hand's path s
//    dashed, same way) and the ball's energy bar fills only while the hand
//    pushes; after release it holds, and the ball flies on.
// b1 the hit: the stumps are the hero, big in the foreground (the fielder is
//    further back, so smaller). The ball pushes them (F on the stumps) and they
//    move (dashed s, same way): work on the stumps. The ball's bar drops.
// b2 a flowerpot raised to a balcony: the pot's energy bar rises with it
//    (h dashed), then a dashed fall line runs down to a bicycle parked below.

const GROUND = 444;
// perspective: the fielder stands further back (feet on FIG_Y, smaller); the
// stumps are near, big, the hero of the hit. Both keep believable proportions
// (stumps 0.71 m, adult 1.7 m) at their own depth.
const FIG_X = 118, FIG_Y = 366, FIG_H = 196;
const STUMP_X = [474, 506, 538], STUMP_H = 138, STUMP_W = 15;
const HIT = { x: 452, y: GROUND - 74 };
const BALL_R0 = 8, BALL_R1 = 12;      // the ball grows as it comes nearer
const U_COCK = 0.4, U_REL = 0.8;
const U_SETUP = 0.1;                 // setup: arm back, ball in view behind the body      // throw pose: hand back, then release
const THROW_S = 0.95;                 // whole pose 0..1
const FLY_S = 1.0;                    // release to stumps
const REST_F = 0.5;                   // b0 rests with the ball half way
const FALL_S = 1.1;                   // stumps topple
const LIFT_S = 1.5;                   // b2 pot raised
const BAR = { x: 410, y: 22, h: 104 };
const E_AFTER_BALL = 0.25;
// b2 building
const WALL_X = 286, BAL_Y = 196, BAL_X0 = 214, POT_X = 262, POT_H = 44;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

// The setup mount (blk-l02-s01) arrives with no beats: give it a stage of its own.
const SETUP_MAP = [[{ idx: 3, dwellMs: null }]];

const smooth = (u) => u * u * (3 - 2 * u);
const quad = (a, m, b, s) => {
  const q = 1 - s;
  return { x: q * q * a.x + 2 * q * s * m.x + s * s * b.x, y: q * q * a.y + 2 * q * s * m.y + s * s * b.y };
};

export class BallChargeScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static BEAT_MAPS = { 3: BEAT_STEP_MAP, 0: SETUP_MAP, [Number.MAX_SAFE_INTEGER]: SETUP_MAP };
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A fielder on a cricket field throws a ball toward three big stumps in front. While the hand pushes the ball forward, the force arrow F and the hand\'s path s point the same way and the ball\'s energy bar fills; after release it holds. The ball hits the stumps: the ball pushes them (F) and they move the same way (s), so the ball does work on them; the ball\'s energy bar drops as the stumps fly. Then a flowerpot is raised onto a balcony and its energy bar rises with it; a dashed line shows where it would fall, onto a bicycle parked below.';

  enter() { this.mt = 0; }

  get asSetup() { return this.hostRole === 'setup' || this.stage >= 3; }
  get beat() { return this.asSetup ? -1 : Math.min(2, this.stage); }

  pointerDown() { if (!this.asSetup) { this.mt = 0; this.animateFor(600); } }

  get endT() {
    const b = this.beat;
    if (b === 0) return THROW_S * U_REL + FLY_S * REST_F + 0.1;
    if (b === 1) return FLY_S * (1 - REST_F) + FALL_S + 0.2;
    if (b === 2) return LIFT_S + 0.7;
    return 0;
  }

  update(d) { this.mt = Math.min(this.endT, (this.mt ?? 0) + d); }

  busy() { return (this.mt ?? 0) < this.endT; }

  draw(ctx, c) {
    if (this.beat === 2) { this.drawBalcony(ctx, c); return; }
    this.field(ctx, c);
    const t = this.mt ?? 0;
    const b = this.beat;
    // the throw pose and where the ball is
    let u, f = null;                                   // f: flight 0..1 once released
    if (b === -1) u = U_SETUP;
    else if (b === 0) {
      u = clamp01(t / THROW_S);
      const tr = THROW_S * U_REL;
      if (t > tr) f = Math.min(REST_F, (t - tr) / FLY_S);
    } else {
      u = 1;
      f = Math.min(1, REST_F + t / FLY_S);
    }
    const hitT = b === 1 ? FLY_S * (1 - REST_F) : Infinity;
    const sinceHit = b === 1 ? Math.max(0, t - hitT) : 0;

    this.stumps(ctx, c, b === 1 ? clamp01(sinceHit / FALL_S) : 0, b === 1 && t >= hitT);
    const spec = this.fielder(u);
    const rel = this.releasePoint();
    const mid = { x: (rel.x + HIT.x) / 2, y: Math.min(rel.y, HIT.y) - 70 };
    // in the far hand: behind the figure while the arm swings past the head; on top in
    // the setup, where the arm is held back clear of the body
    const inHand = f == null ? solveFigure(spec).anchors.hand[1] : null;
    const handBall = () => {
      drawBall(ctx, c, { x: inHand.x + 3, y: inHand.y - 3, r: BALL_R0, tone: 'bad' });
      this.seam(ctx, c, inHand.x + 3, inHand.y - 3, BALL_R0);
    };
    if (inHand && b !== -1) handBall();
    drawFigure(ctx, c, spec, spec.look);
    if (inHand && b === -1) handBall();

    let ball = null;
    if (f == null) {
      ball = null;
    } else if (f < 1) {
      ball = quad(rel, mid, HIT, f);
    } else {
      // after the hit: it drops short of the stumps and rolls back a little
      const k = clamp01(sinceHit / 0.7);
      ball = { x: HIT.x - 46 * smooth(k), y: HIT.y + (GROUND - BALL_R1 - HIT.y) * (k * k) - 26 * Math.sin(Math.PI * k) };
    }
    const br = BALL_R0 + (BALL_R1 - BALL_R0) * Math.min(1, f ?? 0);
    if (f != null && f < 1) this.trail(ctx, c, rel, mid, f);
    if (b === 0) this.pushArrows(ctx, c, u, rel, mid);
    if (ball) {
      drawBall(ctx, c, { x: ball.x, y: ball.y, r: br, tone: 'bad', shadowY: GROUND + 2 });
      this.seam(ctx, c, ball.x, ball.y, br);
    }
    if (b === 1 && t >= hitT) this.workOnStumps(ctx, c, clamp01(sinceHit / 0.35));
    if (b >= 0) this.energyBar(ctx, c, u, sinceHit, t >= hitT, ball ?? inHand);
  }

  // The kit throw ends with the arms low at the hips. From u 0.8 the hands blend
  // to a real follow-through: the throwing (far) arm swung through, forward and
  // down past the front knee; the near arm pulled back for balance.
  fielder(u) {
    const base = { role: 'adult', pose: { name: 'throw', u }, x: FIG_X, y: FIG_Y, height: FIG_H, facing: 1,
      look: { outfit: 'cream', top: 'cream', bottom: 'cream' } };
    const k = smooth(clamp01((u - 0.8) / 0.2));
    if (k <= 0) return figureFor(this, base);
    const a = solveFigure(figureFor(this, base)).anchors.hand;
    const near = { x: FIG_X - 46, y: FIG_Y - 128 }, far = { x: FIG_X + 78, y: FIG_Y - 84 };
    const lerp = (p, q) => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
    return figureFor(this, { ...base, hands: [lerp(a[0], near), lerp(a[1], far)] });
  }

  releasePoint() {
    const spec = figureFor(this, { role: 'adult', pose: { name: 'throw', u: U_REL }, x: FIG_X, y: FIG_Y, height: FIG_H, facing: 1 });
    return solveFigure(spec).anchors.hand[1];
  }

  field(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const hz = 214;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, mix(c.water ?? c.s1, c.bgSurface, 0.5));
    sky.addColorStop(1, mix(c.water ?? c.s1, c.bgSurface, 0.85));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hz);
    // the far boundary: a low stand and a line of trees
    const tree = mix(c.good, c.bgDeep, 0.25);
    ctx.fillStyle = tree;
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(i * 46 + 10, hz - 18 - (i % 3) * 6, 26, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = lighten(tree, 0.15);
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(i * 46 + 2, hz - 30 - (i % 3) * 6, 10, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.2);
    ctx.fillRect(0, hz - 14, W, 14);
    ctx.fillStyle = lighten(mix(c.bgSurface, c.label, 0.2), 0.2);
    ctx.fillRect(0, hz - 14, W, 3);
    // grass with mowing stripes
    const grass = mix(c.good, c.bgSurface, 0.35);
    ctx.fillStyle = grass;
    ctx.fillRect(0, hz, W, H - hz);
    ctx.fillStyle = darken(grass, 0.07);
    for (let i = 0; i < 6; i++) {
      const y0 = hz + i * 50 + 10;
      ctx.fillRect(0, y0, W, 24 + i * 2);
    }
    // the pitch strip under the stumps, in perspective
    const pitch = mix(c.gold, c.bgSurface, 0.45);
    ctx.fillStyle = pitch;
    ctx.beginPath();
    ctx.moveTo(352, H); ctx.lineTo(W, H); ctx.lineTo(W, GROUND - 46); ctx.lineTo(420, GROUND - 46);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = lighten(pitch, 0.12);
    ctx.beginPath();
    ctx.moveTo(420, GROUND - 46); ctx.lineTo(W, GROUND - 46); ctx.lineTo(W, GROUND - 38); ctx.lineTo(417, GROUND - 38);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(pitch, 0.1);
    ctx.beginPath();
    ctx.moveTo(352, H); ctx.lineTo(W, H); ctx.lineTo(W, H - 22); ctx.lineTo(358, H - 22);
    ctx.closePath(); ctx.fill();
    // creases: the bowling crease through the stumps, and the popping crease
    ctx.strokeStyle = alpha(c.bgSurface, 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(404, GROUND + 4); ctx.lineTo(W - 14, GROUND + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(388, GROUND + 50); ctx.lineTo(W - 14, GROUND + 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(436, GROUND - 32); ctx.lineTo(404, GROUND + 60); ctx.stroke();
  }

  // Three stumps and two bails. k: 0 standing .. 1 knocked down.
  stumps(ctx, c, k, hit) {
    const wood = mix(c.gold, c.bgSurface, 0.2);
    const e = 1 - (1 - k) * (1 - k);
    const ang = [0.62, 0.42, 0.78];
    const slide = [30, 20, 10];
    STUMP_X.forEach((x, i) => {
      const d = hit ? Math.max(0, e - i * 0.06) : 0;
      ctx.save();
      drawShadow(ctx, c, x + slide[i] * d, GROUND + 2, 13, 4, 0.7);
      ctx.translate(x + slide[i] * d, GROUND);
      ctx.rotate(ang[i] * d);
      rr(ctx, -STUMP_W / 2, -STUMP_H, STUMP_W, STUMP_H + 4, 4);
      ctx.fillStyle = wood; ctx.fill();
      ctx.fillStyle = darken(wood, 0.2);
      ctx.fillRect(1, -STUMP_H + 3, STUMP_W / 2 - 2, STUMP_H);
      ctx.fillStyle = lighten(wood, 0.35);
      ctx.fillRect(-STUMP_W / 2 + 2, -STUMP_H + 4, 3, STUMP_H - 6);
      ctx.strokeStyle = darken(wood, 0.4);
      ctx.lineWidth = 2;
      rr(ctx, -STUMP_W / 2, -STUMP_H, STUMP_W, STUMP_H + 4, 4); ctx.stroke();
      ctx.restore();
    });
    // bails: on top, or flying up and away
    for (let j = 0; j < 2; j++) {
      const x0 = (STUMP_X[j] + STUMP_X[j + 1]) / 2, y0 = GROUND - STUMP_H - 5;
      let x = x0, y = y0, r = 0;
      if (hit) {
        const s = k * FALL_S;
        x = x0 + (50 + j * 30) * s;
        y = y0 - (220 - j * 40) * s + 300 * s * s;
        r = (6 + j * 3) * s;
        if (y > GROUND - 4) y = GROUND - 4;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      rr(ctx, -18, -5, 36, 10, 5);
      ctx.fillStyle = lighten(wood, 0.1); ctx.fill();
      ctx.strokeStyle = darken(wood, 0.4);
      ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    if (hit && k < 0.5) {
      // the hit: a short burst of strokes at the impact
      ctx.save();
      ctx.strokeStyle = alpha(c.label, 0.7 * (1 - k * 2));
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.45;
        ctx.beginPath();
        ctx.moveTo(HIT.x + 6 + Math.cos(a) * 18, HIT.y + Math.sin(a) * 18);
        ctx.lineTo(HIT.x + 6 + Math.cos(a) * 32, HIT.y + Math.sin(a) * 32);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  seam(ctx, c, x, y, r) {
    ctx.save();
    ctx.strokeStyle = alpha(c.bgSurface, 0.85);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x - r * 1.5, y, r * 1.35, -0.55, 0.55); ctx.stroke();
    ctx.restore();
  }

  trail(ctx, c, a, m, f) {
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.55);
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 9]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const p = quad(a, m, HIT, (f * i) / 24);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // b0: while the hand pushes, F (solid) and s (dashed) point the same way: along the
  // ball's path as it leaves the hand.
  pushArrows(ctx, c, u, rel, mid) {
    if (u < U_COCK + 0.05) return;
    // full while the hand is on the ball; dimmed once it has let go (no force in flight)
    const a = clamp01((u - U_COCK - 0.05) / 0.15) * (u > U_REL + 0.04 ? 0.4 : 1);
    const ang = Math.atan2(mid.y - rel.y, mid.x - rel.x);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const nx = sa, ny = -ca;                          // the side above the path
    const f0 = { x: rel.x + ca * 40, y: rel.y + sa * 40 };
    vectorArrow(ctx, c, f0.x, f0.y, { angle: ang, length: 84, col: c.accent, width: 5, head: 14, alpha: a });
    pill(ctx, c, 'F', f0.x + ca * 42 + nx * 30, f0.y + sa * 42 + ny * 30, { bg: c.accent, size: 26, alpha: a });
    const s0 = { x: f0.x - nx * 38, y: f0.y - ny * 38 };
    displacementArrow(ctx, c, s0.x, s0.y, s0.x + ca * 84, s0.y + sa * 84, { alpha: a });
    pill(ctx, c, 's', s0.x + ca * 42 - nx * 28, s0.y + sa * 42 - ny * 28, { bg: c.s2, size: 26, alpha: a });
  }

  // b1: the ball pushes the stumps (F, solid, at the contact) and the stumps
  // move the same way (s, dashed, along the ground): the ball does work on them.
  workOnStumps(ctx, c, a) {
    // where the ball met the stumps: a faint ghost of the ball at the contact
    ctx.save(); ctx.globalAlpha *= 0.35 * a;
    drawBall(ctx, c, { x: HIT.x, y: HIT.y, r: BALL_R1, tone: 'bad' });
    ctx.restore();
    const y = HIT.y, x0 = HIT.x + BALL_R1 + 2;
    vectorArrow(ctx, c, x0, y, { angle: 0, length: 70, col: c.accent, width: 6, head: 16, alpha: a });
    pill(ctx, c, 'F', x0 + 30, y - 38, { bg: c.accent, size: 26, alpha: a });
    const sy = GROUND + 26;
    displacementArrow(ctx, c, STUMP_X[0] - 6, sy, STUMP_X[0] + 92, sy, { alpha: a, width: 5, head: 14 });
    pill(ctx, c, 's', STUMP_X[0] + 122, sy, { bg: c.s2, size: 26, alpha: a });
  }

  // One bar, "energy", for the ball: it fills while the hand pushes, holds in
  // flight, and drops at the hit, when the ball does work on the stumps.
  energyBar(ctx, c, u, sinceHit, hit, at) {
    let e;
    if (this.beat === 0) e = smooth(clamp01((u - U_COCK) / (U_REL - U_COCK)));
    else if (!hit) e = 1;
    else e = 1 - (1 - E_AFTER_BALL) * smooth(clamp01(sinceHit / 0.6));
    drawEnergyBars(ctx, c, {
      x: BAR.x, y: BAR.y, h: BAR.h, max: 1, barW: 54, size: 26, minSize: 26, title: 'ball',
      bars: [{ id: 'e', label: 'energy', tone: 1 }], values: { e },
      anchor: at ? { x: at.x, y: at.y - 14 } : undefined,
    });
  }

  // ---------------- b2: the flowerpot on a balcony ----------------
  drawBalcony(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const t = this.mt ?? 0;
    const lift = inOutSine(clamp01(t / LIFT_S));
    const fallA = clamp01((t - LIFT_S) / 0.5);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, mix(c.water ?? c.s1, c.bgSurface, 0.5));
    sky.addColorStop(1, mix(c.water ?? c.s1, c.bgSurface, 0.85));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND);
    // ground: a paved lane
    const pave = mix(c.bgSurface, c.label, 0.2);
    ctx.fillStyle = pave;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(pave, 0.2);
    ctx.fillRect(0, GROUND, W, 4);
    ctx.strokeStyle = darken(pave, 0.15);
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(i * 64, GROUND + 4); ctx.lineTo(i * 64 - 20, H); ctx.stroke(); }

    // the house wall, brick courses, a window below the balcony
    const wall = mix(c.s8, c.bgSurface, 0.45);
    ctx.fillStyle = wall;
    ctx.fillRect(WALL_X, 40, W - WALL_X, GROUND - 40);
    ctx.fillStyle = darken(wall, 0.08);
    for (let y = 52; y < GROUND; y += 22) {
      const o = ((y - 52) / 22) % 2 ? 22 : 0;
      for (let x = WALL_X + o; x < W; x += 44) ctx.fillRect(x, y, 2, 20);
      ctx.fillRect(WALL_X, y + 20, W - WALL_X, 2);
    }
    ctx.fillStyle = lighten(wall, 0.18);
    ctx.fillRect(WALL_X, 40, 6, GROUND - 40);
    ctx.fillStyle = darken(wall, 0.3);
    ctx.fillRect(WALL_X - 6, 30, W - WALL_X + 6, 12);
    // windows: one at balcony level behind the rail, one on the ground floor
    for (const [wx, wy, ww, wh] of [[420, 96, 96, 92], [420, 290, 96, 110]]) {
      const fr = mix(c.bgSurface, c.label, 0.1);
      rr(ctx, wx - 6, wy - 6, ww + 12, wh + 12, 4); ctx.fillStyle = fr; ctx.fill();
      ctx.fillStyle = mix(c.glass ?? c.s6, c.bgDeep, 0.3);
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = alpha(c.bgSurface, 0.35);
      ctx.beginPath(); ctx.moveTo(wx + 10, wy + wh - 10); ctx.lineTo(wx + 34, wy + 10); ctx.lineTo(wx + 48, wy + 10); ctx.lineTo(wx + 24, wy + wh - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = fr;
      ctx.fillRect(wx + ww / 2 - 3, wy, 6, wh);
    }
    // the balcony slab, sticking out of the wall, with a rail
    const slab = mix(c.bgSurface, c.label, 0.28);
    rr(ctx, BAL_X0, BAL_Y, W - BAL_X0, 18, 3);
    ctx.fillStyle = slab; ctx.fill();
    ctx.fillStyle = darken(slab, 0.25);
    ctx.fillRect(BAL_X0, BAL_Y + 12, W - BAL_X0, 6);
    ctx.fillStyle = lighten(slab, 0.25);
    ctx.fillRect(BAL_X0, BAL_Y, W - BAL_X0, 3);
    ctx.strokeStyle = darken(slab, 0.35);
    ctx.lineWidth = 2;
    rr(ctx, BAL_X0, BAL_Y, W - BAL_X0, 18, 3); ctx.stroke();
    // bicycle parked below, under the edge
    const bike = bicycleRig({ x: POT_X + 6, y: GROUND, forHeight: 150, facing: 1 });
    drawBicycle(ctx, c, bike);

    // the pot rises from the ground to the balcony edge
    const yTop = BAL_Y, yLow = GROUND;
    const potY = yLow + (yTop - yLow) * lift;
    if (lift > 0.02) displacementArrow(ctx, c, POT_X - 86, yLow - 4, POT_X - 86, potY - 4, { alpha: 0.95 });
    // rail posts in front of the pot once it is up
    this.pot(ctx, c, POT_X, potY);
    ctx.fillStyle = darken(slab, 0.1);
    for (let x = BAL_X0 + 70; x < W; x += 30) ctx.fillRect(x, BAL_Y - 56, 5, 56);
    ctx.fillRect(BAL_X0 + 64, BAL_Y - 62, W - BAL_X0 - 64, 8);
    ctx.fillStyle = lighten(slab, 0.2);
    ctx.fillRect(BAL_X0 + 64, BAL_Y - 62, W - BAL_X0 - 64, 2);
    pill(ctx, c, 'h', POT_X - 112, (yLow + yTop) / 2, { bg: c.s2, size: 26 });

    // the fall line, once it is up
    if (fallA > 0) {
      ctx.save();
      ctx.globalAlpha = fallA;
      ctx.strokeStyle = c.bad;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(POT_X, BAL_Y + 24); ctx.lineTo(POT_X, GROUND - 120); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c.bad;
      ctx.beginPath(); ctx.moveTo(POT_X, GROUND - 104); ctx.lineTo(POT_X - 9, GROUND - 120); ctx.lineTo(POT_X + 9, GROUND - 120); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    drawEnergyBars(ctx, c, {
      x: 36, y: 54, h: 260, max: 1, barW: 60, size: 26, minSize: 26, title: 'pot',
      bars: [{ id: 'e', label: 'energy', tone: 3 }], values: { e: lift },
    });
  }

  // A terracotta pot with a rim, soil and a small plant. (x, y) = base centre.
  pot(ctx, c, x, y) {
    const clay = mix(c.flame ?? c.s8, c.gold, 0.25);
    drawShadow(ctx, c, x, y + 1, 26, 4, 0.7);
    // plant first, behind the rim
    const leaf = mix(c.good, c.bgDeep, 0.1);
    ctx.fillStyle = leaf;
    for (const [dx, dy, r] of [[-12, -62, 12], [8, -70, 13], [0, -80, 11], [16, -56, 10], [-20, -54, 9]]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = lighten(leaf, 0.25);
    for (const [dx, dy] of [[-14, -66], [6, -76]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = c.bad;
    for (const [dx, dy] of [[4, -84], [-10, -70], [16, -64]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 4.5, 0, Math.PI * 2); ctx.fill(); }
    // body: tapered
    ctx.beginPath();
    ctx.moveTo(x - 24, y - POT_H + 10); ctx.lineTo(x + 24, y - POT_H + 10); ctx.lineTo(x + 17, y); ctx.lineTo(x - 17, y); ctx.closePath();
    ctx.fillStyle = clay; ctx.fill();
    ctx.fillStyle = darken(clay, 0.2);
    ctx.beginPath();
    ctx.moveTo(x + 8, y - POT_H + 10); ctx.lineTo(x + 24, y - POT_H + 10); ctx.lineTo(x + 17, y); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lighten(clay, 0.3);
    ctx.fillRect(x - 17, y - POT_H + 14, 4, POT_H - 20);
    // rim
    rr(ctx, x - 28, y - POT_H, 56, 12, 4);
    ctx.fillStyle = lighten(clay, 0.08); ctx.fill();
    ctx.strokeStyle = darken(clay, 0.4);
    ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 24, y - POT_H + 12); ctx.lineTo(x - 17, y); ctx.lineTo(x + 17, y); ctx.lineTo(x + 24, y - POT_H + 12);
    ctx.stroke();
  }
}
