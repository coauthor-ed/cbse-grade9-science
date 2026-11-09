import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, pill, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { drawStairs } from 'simulations/base/kit/SimApparatus.js';

// StairRaceScene - blk-l06-s01 (one beat) and the predict setup of blk-l06-s02.
// The same student with the same school bag on the same 3 m flight, two days
// side by side: on the left the run (10 s), on the right the walk (50 s). Both
// start together; a timer over each flight counts the climb's own seconds, so
// the runner stands at the top while the walker is still a fifth of the way up.
// Setup (hostRole 'setup'): both climbs done (both at the top), the two times
// shown, nothing moving, no work numbers. The bag is worn on the back.

const GROUND = 456;
const N = 8, RISE = 36, RUN = 27;            // 8 x 36 px = 288 px = 3 m
const TOP_Y = GROUND - N * RISE;             // 168
const PX_M = (GROUND - TOP_Y) / 3;
const FIG_H = Math.round(1.55 * PX_M);       // 149
const MID_X = W / 2;
// Left flight goes up to the right, right flight up to the left: the two tops
// meet in the middle, where one 3 m bracket serves both.
const FLIGHTS = [
  { id: 'run', x: 66, dir: 1, secs: 10, start: 32, tone: 's2', lean: 0.16 },
  { id: 'walk', x: W - 66, dir: -1, secs: 50, start: W - 32, tone: 's4', lean: 0.02 },
];
const TOP_STAND = 12;                        // px onto the top block past the last riser
const REAL_PER_S = 0.12;                     // real seconds per climb second: run 1.2 s, walk 6 s
const DELAY = 0.45;

const MAP_S01 = [[{ idx: 0, dwellMs: null }]];

export class StairRaceScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP_S01;
  static CONTINUOUS = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two copies of the same flight of stairs, 3 m high, side by side. The same student with a school bag climbs both. On the left the student runs up and the timer stops at 10 s; on the right the student walks up and the timer stops at 50 s. Tap to play the two climbs again.';

  enter() {
    this.ask = this.hostRole === 'setup';
    this.climbT = 0;          // climb seconds since both started (scene time)
    this.realT = 0;
  }

  get endReal() { return DELAY + FLIGHTS[1].secs * REAL_PER_S + 0.1; }

  pointerDown() {
    if (this.ask) return;
    this.realT = 0;
    this.climbT = 0;
    this.animateFor(this.endReal * 1000 + 300);
  }

  update(d) {
    if (this.ask) return;
    this.realT = Math.min(this.endReal, (this.realT ?? 0) + d);
    this.climbT = Math.max(0, (this.realT - DELAY) / REAL_PER_S);
  }

  busy() { return !this.ask && (this.realT ?? 0) < this.endReal; }

  // 0..1 progress up the flight for one climb (eased start and finish).
  progress(f) {
    if (this.ask) return 1;
    return clamp01((this.climbT ?? 0) / f.secs);   // linear: a steady pace
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.wall(ctx, c);
    drawFloor(ctx, c, GROUND, { seams: true });
    const stairs = FLIGHTS.map((f) => drawStairs(ctx, c, { x: f.x, y: GROUND, n: N, rise: RISE, run: RUN, dir: f.dir, rail: true }));
    this.bracket(ctx, c);
    FLIGHTS.forEach((f, i) => this.climber(ctx, c, f, stairs[i]));
    FLIGHTS.forEach((f) => this.labels(ctx, c, f));
  }

  wall(ctx, c) {
    const wallCol = mix(c.bgSurface, c.label, 0.05);
    ctx.save();
    ctx.fillStyle = wallCol;
    ctx.fillRect(0, 0, W, GROUND);
    // a dado band and skirting: the stairwell wall
    ctx.fillStyle = mix(c.bgSurface, c.s6, 0.12);
    ctx.fillRect(0, GROUND - 120, W, 120);
    ctx.fillStyle = darken(wallCol, 0.12);
    ctx.fillRect(0, GROUND - 122, W, 3);
    ctx.fillStyle = lighten(wallCol, 0.25);
    ctx.fillRect(0, GROUND - 119, W, 2);
    // two tall stairwell windows, one per flight, high on the wall
    for (const wx of [128, W - 128 - 74]) {
      const wy = 64, ww = 74, wh = 96;
      rr(ctx, wx - 6, wy - 6, ww + 12, wh + 12, 8);
      ctx.fillStyle = darken(wallCol, 0.14);
      ctx.fill();
      rr(ctx, wx, wy, ww, wh, 5);
      ctx.fillStyle = mix(c.s1, c.bgSurface, 0.62);
      ctx.fill();
      ctx.fillStyle = alpha(lighten(c.s1, 0.5), 0.55);
      ctx.beginPath();
      ctx.moveTo(wx + 8, wy + wh - 10); ctx.lineTo(wx + 30, wy + 8); ctx.lineTo(wx + 42, wy + 8); ctx.lineTo(wx + 20, wy + wh - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = darken(wallCol, 0.2);
      ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
      ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
      ctx.fillStyle = lighten(wallCol, 0.2);
      ctx.fillRect(wx - 8, wy + wh + 6, ww + 16, 5);
    }
    ctx.restore();
  }

  climber(ctx, c, f, st) {
    const u = this.progress(f);
    const dist = Math.abs(f.x + f.dir * (N * RUN + TOP_STAND) - f.start);
    const x = f.start + f.dir * u * dist;
    const y = st.ground(x);
    const moving = u > 0.001 && u < 0.999;
    const pose = moving
      ? { name: 'climb', phase: walkPhase(u * dist * (f.id === 'run' ? 1 : 1), FIG_H, 'climb'), lean: f.lean }
      : 'stand';
    const spec = figureFor(this, {
      role: 'student', pose, x, y, height: FIG_H, facing: f.dir, i: 2,
      mood: moving && f.id === 'run' ? 'effort' : 'smile',
    });
    drawFigure(ctx, c, spec, spec.look, {
      behind: (cx, sk) => this.backpack(cx, c, sk),
      between: (cx, sk) => this.strap(cx, c, sk),
    });
  }

  // The school bag on the back: painted after the far limbs, before the torso,
  // so the body covers its front edge and the pack shows behind the shoulders.
  backpack(ctx, c, sk) {
    const fr = sk.joints.fr, Hh = sk.height;
    const P = (u, v) => fr.at(u * Hh, v * Hh);
    const col = c.s6, side = darken(col, 0.22), lit = lighten(col, 0.22), rim = darken(col, 0.42);
    // the body of the pack: a rounded slab from the shoulder blades to the waist
    const q = [P(0.215, -0.06), P(0.215, -0.15), P(0.06, -0.155), P(0.055, -0.055)];
    ctx.save();
    ctx.lineJoin = 'round';
    const slab = (pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.closePath();
    };
    slab(q);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, Hh * 0.014);
    ctx.strokeStyle = rim;
    ctx.stroke();
    // the shaded back face (away from the light) and a lit top edge
    slab([P(0.2, -0.135), P(0.2, -0.15), P(0.07, -0.155), P(0.07, -0.135)]);
    ctx.fillStyle = side;
    ctx.fill();
    ctx.strokeStyle = lit;
    ctx.lineWidth = Math.max(1.2, Hh * 0.01);
    ctx.beginPath();
    const a = P(0.205, -0.07), b = P(0.205, -0.135);
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // the flap and a front pocket with its seam
    slab([P(0.215, -0.06), P(0.215, -0.15), P(0.15, -0.155), P(0.15, -0.06)]);
    ctx.fillStyle = darken(col, 0.08);
    ctx.fill();
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1.2, Hh * 0.01);
    ctx.stroke();
    slab([P(0.12, -0.152), P(0.12, -0.175), P(0.07, -0.172), P(0.07, -0.152)]);
    ctx.fillStyle = side;
    ctx.fill();
    ctx.stroke();
    // the top grab loop
    const g0 = P(0.215, -0.08), g1 = P(0.215, -0.13), gm = P(0.245, -0.105);
    ctx.beginPath();
    ctx.moveTo(g0.x, g0.y); ctx.quadraticCurveTo(gm.x, gm.y, g1.x, g1.y);
    ctx.stroke();
    ctx.restore();
  }

  // The near shoulder strap, over the chest and under the near arm.
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

  bracket(ctx, c) {
    const x = MID_X;
    ctx.save();
    // the top tread level, carried across to the bracket from both tops
    ctx.strokeStyle = alpha(c.gold, 0.8);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(FLIGHTS[0].x + N * RUN + 18, TOP_Y); ctx.lineTo(FLIGHTS[1].x - N * RUN - 18, TOP_Y);
    ctx.stroke();
    ctx.setLineDash([]);
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
    ctx.restore();
    pill(ctx, c, '3 m', x, (GROUND + TOP_Y) / 2 + 30, { bg: c.gold, size: 30 });
  }

  labels(ctx, c, f) {
    const cx = f.x + f.dir * (N * RUN) / 2;
    pill(ctx, c, f.id, cx, GROUND + 32, { bg: c[f.tone], size: 30 });
    // the timer: counts this climb's seconds, stops when its climber tops out
    const secs = this.ask ? f.secs : Math.min(f.secs, Math.floor(this.climbT ?? 0));
    const done = this.ask || (this.climbT ?? 0) >= f.secs;
    const tx = f.x + f.dir * 18, ty = 30;
    pill(ctx, c, `${secs} s`, tx, ty, { bg: done ? c[f.tone] : c.bgSurface, ink: done ? undefined : c.label, size: 30 });
  }
}
