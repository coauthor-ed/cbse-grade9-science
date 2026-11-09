import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, pill, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawStairs } from 'simulations/base/kit/SimApparatus.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';

// PowerDefinitionScene - blk-l06-s03, Power (three beats), on the stair climbs
// of blk-l06-s01: a 50 kg student and bag, a 3 m flight, run 10 s, walk 50 s.
// b0: two work bars rise together to the same top: 1500 J for the run and for
//     the walk.
// b1: the work bars step back; two power bars count up, run 150 W, walk 30 W,
//     then four dashed copies of the walk bar stack on it to reach the run bar:
//     five times.
// b2: the watt. Each power value turns from W into J/s, under 1 W = 1 J/s.

const MASS = 50, G = 10, HM = 3;
const WORK = MASS * G * HM;                     // 1500 J
const T_RUN = 10, T_WALK = 50;
const P_RUN = WORK / T_RUN, P_WALK = WORK / T_WALK;   // 150 W, 30 W

const GROUND = 456;
const N = 8, RISE = 32, RUN = 24;
const ST_X = 64;
const TOP_Y = GROUND - N * RISE;
const FIG_H = Math.round(1.55 * (GROUND - TOP_Y) / HM);

const BAR_Y = 118, BAR_H = 236, BAR_W = 40;
const WORK_X = 298, POWER_X = 442;
const RISE_S = 0.7, COUNT_S = 0.8, STACK_S = 0.5, SWAP_S = 0.6;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class PowerDefinitionScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static CONTINUOUS = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student of 50 kg with a school bag at the top of a 3 m flight of stairs. Beside it two work bars, run and walk, rise to the same 1500 J. Then two power bars count up: the run to 150 W, the walk to 30 W, and five walk bars stacked reach the run bar. Last, each power value changes from watts to joules each second: 1 W = 1 J/s.';

  enter() { this.beatT = 0; }

  get beatEnd() {
    return [RISE_S, COUNT_S + 0.25 + 4 * STACK_S * 0.6, SWAP_S][Math.min(2, this.stage)] + 0.2;
  }

  pointerDown() { this.beatT = 0; this.animateFor(this.beatEnd * 1000 + 300); }

  update(d) { this.beatT = Math.min(this.beatEnd, (this.beatT ?? 0) + d); }

  busy() { return (this.beatT ?? 0) < this.beatEnd; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.wall(ctx, c);
    drawFloor(ctx, c, GROUND, { seams: true });
    this.climb(ctx, c);
    this.workBars(ctx, c);
    if (this.stage >= 1) this.powerBars(ctx, c);
  }

  wall(ctx, c) {
    const wallCol = mix(c.bgSurface, c.label, 0.05);
    ctx.save();
    ctx.fillStyle = wallCol;
    ctx.fillRect(0, 0, 300, GROUND);
    ctx.fillStyle = mix(c.bgSurface, c.s6, 0.12);
    ctx.fillRect(0, GROUND - 120, 300, 120);
    ctx.fillStyle = darken(wallCol, 0.12);
    ctx.fillRect(0, GROUND - 122, 300, 3);
    ctx.fillStyle = darken(wallCol, 0.16);
    ctx.fillRect(298, 0, 4, GROUND);
    ctx.fillStyle = lighten(wallCol, 0.2);
    ctx.fillRect(294, 0, 4, GROUND);
    ctx.restore();
  }

  climb(ctx, c) {
    const st = drawStairs(ctx, c, { x: ST_X, y: GROUND, n: N, rise: RISE, run: RUN, dir: 1, rail: true, size: 24 });
    this.bracket(ctx, c, ST_X - 30);
    const x = ST_X + N * RUN + 6;
    const y = st.ground(x);
    const spec = figureFor(this, { role: 'student', pose: 'stand', x, y, height: FIG_H, facing: -1, i: 2 });
    // the bag on the back (as in the stair race), never in front of the body
    drawFigure(ctx, c, spec, spec.look, {
      behind: (cx, sk) => this.backpack(cx, c, sk),
      between: (cx, sk) => this.strap(cx, c, sk),
    });
    pill(ctx, c, `${MASS} kg`, x - 4, y - FIG_H - 34, { bg: c.s3, size: 24 });
    // the two climbs' times, in the run and walk tones of the bars
    pill(ctx, c, `run ${T_RUN} s`, 92, 40, { bg: c.s2, size: 24 });
    pill(ctx, c, `walk ${T_WALK} s`, 100, 86, { bg: c.s4, size: 24 });
  }

  // The school bag on the back: painted after the far limbs, before the torso,
  // so the body covers its front edge and the pack shows behind the shoulders.
  backpack(ctx, c, sk) {
    const fr = sk.joints.fr, Hh = sk.height;
    const P = (u, v) => fr.at(u * Hh, v * Hh);
    const col = c.s6, side = darken(col, 0.22), lit = lighten(col, 0.22), rim = darken(col, 0.42);
    const slab = (pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.closePath();
    };
    ctx.save();
    ctx.lineJoin = 'round';
    slab([P(0.215, -0.06), P(0.215, -0.15), P(0.06, -0.155), P(0.055, -0.055)]);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, Hh * 0.014);
    ctx.strokeStyle = rim;
    ctx.stroke();
    slab([P(0.2, -0.135), P(0.2, -0.15), P(0.07, -0.155), P(0.07, -0.135)]);
    ctx.fillStyle = side;
    ctx.fill();
    ctx.strokeStyle = lit;
    ctx.lineWidth = Math.max(1.2, Hh * 0.01);
    const a = P(0.205, -0.07), b = P(0.205, -0.135);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    slab([P(0.215, -0.06), P(0.215, -0.15), P(0.15, -0.155), P(0.15, -0.06)]);
    ctx.fillStyle = darken(col, 0.08);
    ctx.fill();
    ctx.strokeStyle = rim;
    ctx.stroke();
    slab([P(0.12, -0.152), P(0.12, -0.175), P(0.07, -0.172), P(0.07, -0.152)]);
    ctx.fillStyle = side;
    ctx.fill();
    ctx.stroke();
    const g0 = P(0.215, -0.08), g1 = P(0.215, -0.13), gm = P(0.245, -0.105);
    ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.quadraticCurveTo(gm.x, gm.y, g1.x, g1.y); ctx.stroke();
    ctx.restore();
  }

  // the shoulder strap over the front of the shoulder
  strap(ctx, c, sk) {
    const fr = sk.joints.fr, Hh = sk.height;
    const P = (u, v) => fr.at(u * Hh, v * Hh);
    const s0 = P(0.225, -0.04), s1 = P(0.2, 0.05), s2 = P(0.09, 0.03), s3 = P(0.07, -0.05);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(c.s6, 0.42);
    ctx.lineWidth = Math.max(3, Hh * 0.04);
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y); ctx.bezierCurveTo(s1.x, s1.y, s2.x, s2.y, s3.x, s3.y);
    ctx.stroke();
    ctx.strokeStyle = darken(c.s6, 0.2);
    ctx.lineWidth = Math.max(1.5, Hh * 0.022);
    ctx.stroke();
    ctx.restore();
  }

  bars2(ctx, c, x, title, max, values, o = {}) {
    const g = drawEnergyBars(ctx, c, {
      x, y: BAR_Y, h: BAR_H, barW: BAR_W, gap: o.gap ?? 14, max, size: 24, alpha: o.alpha ?? 1,
      bars: [{ id: 'run', label: 'run', tone: 2 }, { id: 'walk', label: 'walk', tone: 4 }],
      values,
    });
    pill(ctx, c, title, g.x0 + g.w / 2, GROUND + 34, { bg: c.bgSurface, ink: c.label, size: 24, alpha: o.alpha ?? 1 });
    return g;
  }

  bracket(ctx, c, x) {
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, GROUND); ctx.lineTo(x, TOP_Y);
    ctx.moveTo(x - 9, GROUND); ctx.lineTo(x + 9, GROUND);
    ctx.moveTo(x - 9, TOP_Y); ctx.lineTo(x + 9, TOP_Y);
    ctx.stroke();
    for (const [yy, dir] of [[TOP_Y, 1], [GROUND, -1]]) {
      ctx.fillStyle = c.label;
      ctx.beginPath();
      ctx.moveTo(x, yy); ctx.lineTo(x - 7, yy + dir * 13); ctx.lineTo(x + 7, yy + dir * 13);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = alpha(c.gold, 0.8);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x + 9, TOP_Y); ctx.lineTo(ST_X + N * RUN, TOP_Y);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, '3 m', x + 4, (GROUND + TOP_Y) / 2 + 20, { bg: c.gold, size: 24 });
  }

  workBars(ctx, c) {
    const u = this.stage === 0 ? clamp01((this.beatT ?? 0) / RISE_S) : 1;
    const v = this.stage === 0 ? barsAt({ run: 0, walk: 0 }, { run: WORK, walk: WORK }, u) : { run: WORK, walk: WORK };
    const dim = this.stage >= 1 ? 0.42 : 1;
    const g = this.bars2(ctx, c, WORK_X, 'work', WORK, v, { alpha: dim });
    // one value for both bars: the same work
    const shown = Math.round(Math.min(WORK, g.bars[0].value) / 10) * 10;
    const cx = (g.bars[0].x + g.bars[1].x + g.bars[1].w) / 2;
    pill(ctx, c, `${shown} J`, cx, Math.min(g.bars[0].top.y, g.bars[1].top.y) - 22, { bg: c.s3, size: 24, alpha: dim * clamp01(u * 3) });
    if (this.stage === 0) {
      // the same top: a dashed level across both bars
      const y = g.bars[0].top.y;
      ctx.save();
      ctx.globalAlpha = clamp01((u - 0.7) / 0.3);
      ctx.strokeStyle = alpha(c.label, 0.7);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(g.bars[0].x - 6, y); ctx.lineTo(g.bars[1].x + g.bars[1].w + 6, y);
      ctx.stroke();
      ctx.restore();
    }
  }

  powerBars(ctx, c) {
    const t = this.stage === 1 ? (this.beatT ?? 0) : 99;
    const u = clamp01(t / COUNT_S);
    const v = { run: P_RUN * u, walk: P_WALK * u };
    const g = this.bars2(ctx, c, POWER_X, 'power', P_RUN, v, { gap: 24 });
    const outX = g.x0 + g.w + 50;   // labels for the walk stack sit outside the card
    const [run, walk] = g.bars;
    // b1: the walk bar copied four more times, stacking up to the run bar's top
    const slotH = (g.baseY - run.top.y) * (P_WALK / P_RUN) * (u > 0 ? 1 : 0);
    const walkTop = g.baseY - slotH;
    const stackT = t - COUNT_S - 0.25;
    const stacked = stackT > 4 * STACK_S * 0.6;
    if (stackT > 0) {
      for (let k = 1; k <= 4; k++) {
        const kU = clamp01((stackT - (k - 1) * STACK_S * 0.6) / STACK_S);
        if (kU <= 0) break;
        const y1 = walkTop - k * slotH;
        ctx.save();
        ctx.globalAlpha = kU * (this.stage === 2 ? 0.5 : 1);
        rr(ctx, walk.x + 2, y1 - (1 - kU) * 18 + 2, walk.w - 4, slotH - 4, 5);
        ctx.fillStyle = alpha(c.s4, 0.16);
        ctx.fill();
        ctx.strokeStyle = c.s4;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.restore();
      }
      if (stacked && this.stage === 1) {
        // beside the stack, never on its tiles
        pill(ctx, c, 'x 5', outX, walkTop - 2.5 * slotH, { bg: c.s4, size: 24 });
      }
    }
    // the values: W, turning into J/s on the watt beat
    const swap = this.stage === 2 ? clamp01((this.beatT ?? 0) / SWAP_S) : 0;
    const k = swap > 0 ? Math.abs(swap - 0.5) * 2 : 1;
    for (const b of g.bars) {
      const text = swap < 0.5 ? `${Math.round(b.value)} W` : `${Math.round(b.value)} J/s`;
      const inside = b === walk && stackT > 0;
      const y = inside ? walkTop + slotH / 2 : b.top.y - 22;
      const px = inside ? outX : b.x + b.w / 2;
      if (inside) {
        ctx.save();
        ctx.strokeStyle = alpha(c.s4, 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(walk.x + walk.w + 4, y); ctx.lineTo(outX - 30, y); ctx.stroke();
        ctx.restore();
      }
      pill(ctx, c, text, px, y, { bg: c.s3, size: 22, alpha: (0.25 + 0.75 * k) * clamp01(u * 3) });
    }
    if (this.stage === 2) {
      pill(ctx, c, '1 W = 1 J/s', (WORK_X + POWER_X + 150) / 2, 44, { bg: c.accent, size: 34, alpha: clamp01((this.beatT ?? 0) / 0.4) });
    }
  }
}
