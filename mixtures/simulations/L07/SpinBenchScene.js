/**
 * SpinBenchScene - the frame blk-l07-s01's prediction is asked from.
 *
 * Two people spin on a lawn with crossed arms and leaning back, and beside them a bench centrifuge with its
 * front cut away holds two balanced tubes of muddy water. One outside slider turns both. Both lean further
 * as the speed goes up.
 *
 * The answer is hidden: no word for a direction, no arrow, and the mud is left spread through the tube with
 * only a faint start of its drift, so a learner can feel the outward pull before committing.
 * A beat-less setup mount, so one stage from first frame to last.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, mulberry32, pill, leader,
  drawBackdrop, drawBench, drawFloor, drawVignette,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { glassPath } from 'simulations/base/kit/SimGlass.js';
import { drawCentrifuge, drawSampleTube } from './CentrifugeBenchKit.js';

const TAU = Math.PI * 2;
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- the ground: a lawn ring, and the pair's own homothetic orbit on it ----------------------
const FLOOR_Y = 424;
const LAWN = { cx: 134, cy: 386, rx: 116, ry: 62 };      // the ring of green seen at an angle
const ORBIT = { rx: 48, ry: 26 };                         // homothetic with the lawn, and near its centre
const FIG_H = 150;                                        // px, feet to top of head
const FIG_GAP = 26;                                       // the two figures' heels touch at the pivot
const ORBIT_0 = 1.2;                                      // rad: the pair stand mid-turn, as the stub says

// ---- the bench: one cutaway centrifuge, two balanced tubes -------------------------------------
const BENCH = { x0: 268, x1: 668, y: 396 };
const MCX = 464;
const MACHINE = { w: 368, h: 250, arm: 46, bucketW: 40, bucketH: 116, lidRise: 72 };
const SWING_TAU = 0.35;                                   // s, how fast the buckets follow the speed
const LID_TAU = 0.15;                                     // s, the lid swinging shut or open
const RPM_MAX = 4000;

// ---- the machine's behaviour --------------------------------------------------------------------
const THRESH = 0.01;         // the dial is off below this; any speed above it turns the rotor
const OMEGA = 7;             // rad/s at full dial, for the rotor and the pair together
const DRIFT_CAP = 0.45;      // how far the specks get: a partial column, never a finished cake
const DRIFT_RATE = 0.082;    // per second at full dial; the push goes as the speed squared, so half the dial drifts a quarter as fast
const RUN_MAX = 9;           // s, then the machine parks itself. No run loops.

// The mud: one deterministic sample, uniform through the tube at rest, so every mount draws the
// same suspension and two runs are comparable. `u` runs pivot (0) to far end (1); `w` is this
// grain's own share of the outward move, so the near grains lag and the column never gets an edge.
const SPECKS = (() => {
  const rnd = mulberry32(7);
  return Array.from({ length: 64 }, () => ({
    u: 0.08 + 0.86 * rnd(), w: 0.2 + 0.8 * rnd(), v: rnd() * 2 - 1, r: 1.9 + rnd() * 1.1,
  }));
})();

export class SpinBenchScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL =
    'Two people cross their arms, hold hands, lean back and spin on a lawn. Beside them on a bench, a bench centrifuge with its front cut away holds two tubes of muddy water. One speed control turns the people and the machine together.';
  static CONTROLS = [
    { type: 'slider', id: 'speed', label: 'Spin speed', min: 0, max: 100, step: 1, value: 0, suffix: ' %' },
    { type: 'button', id: 'reset', label: 'Reset' },
  ];

  constructor(container, config) {
    super(container, config);
    this._speed = 0;                // 0..1, the dial
    this._reach = 0;                // how far the buckets stand out at this speed, 0..1
    this._on = false;               // the machine is turning
    this._run = null;               // { t } while a run is alive
    this._spin = 0;                 // rad, the rotor arm
    this._orbit = ORBIT_0;          // rad, the pair's place in the turn
    this._swing = 0;                // the buckets, 0 hanging .. 1 straight out
    this._lid = 1;                  // 1 standing open, 0 shut
    this._m = null;                 // the machine's anchors, from the last frame drawn
    this._p = 0;                    // 0..DRIFT_CAP, how far the specks have moved
      }

  enter(stage) {
    this._reset();
  }

  _reset() {
    this._speed = 0;
    this._reach = 0;
    this._on = false;
    this._run = null;
    this._spin = 0;
    this._orbit = ORBIT_0;
    this._swing = 0;
    this._lid = 1;
    this._p = 0;
    this.requestUiUpdate?.();
  }

  // ---- the machine ---------------------------------------------------------------------------
  update(d) {
    // The buckets always ease toward wherever they should be for the present speed, running or not.
    // Just above the threshold they have barely moved; by the top of the dial they stand straight out.
    const ease = (v, to, tau) => (Math.abs(to - v) < 1e-3 ? to : v + (to - v) * (1 - Math.exp(-d / tau)));
    this._swing = ease(this._swing, this._on ? this._reach : 0, SWING_TAU);
    this._lid = ease(this._lid, this._on || this._swing > 0.02 ? 0 : 1, LID_TAU);

    if (!this._on) return;
    const r = this._run;
    r.t += d;
    const w = OMEGA * this._speed;
    this._spin += w * d;
    this._orbit += w * d;
    this._p = Math.min(DRIFT_CAP, this._p + DRIFT_RATE * this._speed * this._speed * d);
    // The machine parks itself: the dial is written back to off so the bar never shows a speed
    // the rotor is not turning at.
    if (r.t >= RUN_MAX) {
      this._speed = 0;
      this._on = false;
      this._run = null;
      this.requestUiUpdate?.();
    }
  }

  busy() { return !!this._run || this._swing > 1e-3 || this._lid < 1 - 1e-3; }

  // ---- controls -----------------------------------------------------------------------------
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'speed') this._setSpeed(Number(v) / 100);
    else if (id === 'reset') this._reset();
    this.requestUiUpdate?.();
  }

  getControlValue(id) { return id === 'speed' ? String(Math.round(this._speed * 100)) : super.getControlValue(id); }

  _setSpeed(v) {
    this._speed = clamp(v, 0, 1);
    this._reach = this._speed > 0 ? 1 - Math.exp(-this._speed * 100 / 6) : 0;   // swing-out buckets stand out early
    if (this._speed >= THRESH) {
      if (!this._on) { this._on = true; this._run = { t: 0 }; this.animateFor(600); }
    } else if (this._on) {                 // back to off: the run ends, the rotor stops
      this._on = false;
      this._run = null;
    }
  }

  // ---- the picture ----------------------------------------------------------------------------
  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR_Y);
    this._lawn(ctx, c);
    this._machine(ctx, c);
    this._pair(ctx, c);
    this._labels(ctx, c);
    if (this._speed < THRESH) this._hint(ctx, c);
    drawVignette(ctx, c, 0.5);
  }

  /** The lawn: a plain green ring with two mown circles on it. It is a diagram, not a place. */
  _lawn(ctx, c) {
    const grass = mix(c.bgSurface, c.good, 0.34);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(LAWN.cx, LAWN.cy, LAWN.rx, LAWN.ry, 0, 0, TAU);
    ctx.fillStyle = grass; ctx.fill();
    ctx.clip();
    for (const k of [0.66, 0.36]) {
      ctx.beginPath();
      ctx.ellipse(LAWN.cx, LAWN.cy, LAWN.rx * k, LAWN.ry * k, 0, 0, TAU);
      ctx.strokeStyle = alpha(lighten(grass, 0.22), 0.55); ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(LAWN.cx, LAWN.cy, LAWN.rx, LAWN.ry, 0, 0, TAU);
    ctx.strokeStyle = alpha(darken(grass, 0.3), 0.7); ctx.lineWidth = 2; ctx.stroke();
  }

  /**
   * The bench centrifuge, its front wall cut away (CentrifugeBenchKit): two buckets on the rotor, each
   * with the same tube of cloudy water and sand in it, so the load is balanced. The lid shuts while it
   * runs and stands open when it is off.
   */
  _machine(ctx, c) {
    drawBench(ctx, c, BENCH.x0, BENCH.x1, BENCH.y);
    const on = this._on ? this._speed : 0;
    this._m = drawCentrifuge(ctx, c, {
      cx: MCX, base: BENCH.y, ...MACHINE,
      lid: this._lid, swing: this._swing, spin: this._spin, omega: on,
      rpm: Math.round(on * RPM_MAX / 50) * 50,
      tube: (cx2, i, box) => this._tube(cx2, c, box),
    });
  }

  /**
   * One tube of cloudy water with sand specks through it. At rest the specks are uniform; as they
   * drift each one moves w * p of its remaining distance toward the far end, so the far end thickens
   * and nothing ever clears.
   */
  _tube(ctx, c, box) {
    const water = mix(c.water, mix(darken(c.gold, 0.5), c.flame, 0.12), 0.62);
    const t = drawSampleTube(ctx, c, {
      ...box, fill: 0.86, surface: water,
      paint: (k, col) => { k.fillStyle = water; k.fillRect(col.x, col.y, col.w, col.h); },
    });
    ctx.save();
    glassPath(ctx, t.g, t.g.inner);
    ctx.clip();
    const grain = mix(darken(c.gold, 0.62), c.flame, 0.1);
    const col = t.col;
    for (const s of SPECKS) {
      const u = s.u + this._p * (1 - s.u) * s.w;
      ctx.beginPath();
      ctx.arc(col.x + col.w / 2 + s.v * col.w * 0.33, col.y + 3 + u * (col.h - 6), s.r * 1.25, 0, TAU);
      ctx.fillStyle = grain; ctx.fill();
    }
    ctx.restore();
  }

  /**
   * The two figures. Side view (the kit zeroes lean in front view, and the leaning apart IS the
   * evidence). They keep their facing and step round the circle together, the way the dance does;
   * the lean grows with the dial and the heels stay together on the orbit.
   */
  _pair(ctx, c) {
    const oa = this._orbit;
    const px = LAWN.cx + ORBIT.rx * Math.cos(oa);
    const py = LAWN.cy + ORBIT.ry * Math.sin(oa);
    const lean = -(14 + 22 * this._speed);                  // both lean back, away from each other
    const gx = px + 1, gy = py - FIG_H * 0.7;               // the linked wrists, between them

    const look = (i) => figureLook(c, { skin: i, hairStyle: i ? 'long' : 'short', mood: 'smile' });
    const skA = drawFigure(ctx, c,
      { x: px - FIG_GAP, y: py, height: FIG_H, facing: 1, pose: { name: 'stand', lean },
        hands: [{ x: gx, y: gy }, { x: gx - 1, y: gy - 6 }] },
      look(0));
    const skB = drawFigure(ctx, c,
      { x: px + FIG_GAP, y: py, height: FIG_H, facing: -1, pose: { name: 'stand', lean },
        hands: [{ x: gx - 1, y: gy - 6 }, { x: gx, y: gy }] },
      look(1));

    // the clasp: a short band between the two grips, so "linked at the wrists" is visible
    const a = skA.anchors.hand[0], b = skB.anchors.hand[1];
    if (a && b) {
      ctx.strokeStyle = mix(c.accent, c.bgDeep, 0.35); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }

  /** Apparatus names only, each beside its own part, never on it. */
  _labels(ctx, c) {
    const m = this._m;
    if (!m) return;
    const tag = { bg: c.raised, ink: c.label, size: fs(17), display: true };
    pill(ctx, c, 'centrifuge', MCX, BENCH.y + 30, tag);
    pill(ctx, c, 'muddy water', MCX + 120, fs(36), tag);
    const f = m.frame(0), tip = m.tip(0);
    leader(ctx, MCX + 120, fs(36) + 18, (f.x + tip.x) / 2, (f.y + tip.y) / 2, alpha(c.labelMuted, 0.8), 1, 0);
  }

  /** Nothing turns while the speed is zero, so say the one thing to do. */
  _hint(ctx, c) {
    pill(ctx, c, 'move the speed slider', 340, 484, { bg: c.accent, size: fs(17), display: true });
  }
}
