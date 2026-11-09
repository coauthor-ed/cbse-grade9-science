// EchoCliffScene.js - the hillside that answers. L05, blk-l05-s08 (hook).
//
// One wide panel split into two stretches of ground: the shouter on the hillside
// at the left, a bare rock face far across on the SAME line, and - from beat 1 -
// a shorter near-foreground strip with a plain hard wall a short walk away.
// `shout` (or the figure, or the panel pill) fires one chip out of the mouth; it
// crosses at one constant on-screen speed, is swallowed at the surface for a
// drawn beat's pause, and a chip of the SAME shape and colour crosses back and
// lights the ear marker.
//
// The panel's contract, which every line below obeys:
//   - no numbers of any kind (no metres, no seconds, no ruler, no count)
//   - no word echo / reflected / reflection / reverberation anywhere: L06 owns
//     those, and this slide has to end on the question
//   - nothing names what happened: the span stays empty (no dots, dashes,
//     ripples or arrow), because the slide's question is what the sound did
//     while it was over there. The ONLY difference between the two settings is
//     WHEN the arrival happens, and the only mark of it is how late the return
//     is and whether it lands on the mark the leaving shout left behind.
//   - the returning chip is identical to the outgoing one: same colour, same
//     shape, same size. It is the same shout.
//
// The flat-vector pieces (ground, rock face, hard wall, shouter, chip, ear
// marker) come from the lesson's shared rig, ../L06/CliffEchoRig.js.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, alpha, mix, pill, drawBackdrop, drawCard,
} from 'simulations/base/kit/SimLook.js';
import { solveFigure } from 'simulations/base/kit/SimFigure.js';
import {
  drawGroundLine, drawRockFace, drawHardWall, drawShouter,
  drawSoundChip, drawEarMarker,
} from '../L06/CliffEchoRig.js';

// -- the panel's own measurements (design px; none of them is ever printed) ------
const PANEL = ZONES.heroWide;                          // one wide panel: 648 x 360
const HILL_Y = 268;                                    // the hillside line: figure + rock face
const NEAR_Y = 412;                                    // the short near-foreground strip: the wall
const FIG_X = 118, FIG_H = 104;
const ROCK_X = 548, ROCK_W = 200, ROCK_H = 168;        // a wide block, wider than tall: rock, not a tower
const WALL_X = 232, WALL_W = 104, WALL_H = 152;
const STRIKE_FAR = { x: ROCK_X - ROCK_W / 2, y: 206 };  // on the rock's near face
const STRIKE_NEAR = { x: WALL_X - WALL_W / 2, y: 330 }; // on the wall's near face
const NEAR_X0 = 132, NEAR_X1 = 344;                     // the near strip is much the shorter of the two

// -- the model -------------------------------------------------------------------
const SPEED = 330;          // one on-screen speed for every crossing, both settings
const PAUSE = 0.06;         // the drawn pause while the chip is swallowed at a surface
const LEAVE = 1.4;          // how long the leaving shout keeps its mark at the mouth
const LIT = 0.6;            // how long the ear marker stays lit after a return lands
const MARK_LIFE = 1.7;      // how long a mark stays on the panel
const BETWEEN = 0.45;       // the gap between the two trips when both run

// One entry per beat: [{ idx: <stage>, dwellMs: null }]; dwellMs null = wait for the learner.
const MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class EchoCliffScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = 0;                     // the note is one muted line, on every beat
  static ARIA_LABEL = 'A figure on a hillside shouts across a wide empty span at a bare rock face, and the shout comes back. On the next beat a plain wall close by returns it straight away.';
  static CONTROLS = [{ type: 'button', id: 'shout', label: 'shout' }];

  constructor(container, config) {
    super(container, config);
    this._run = null;                        // { stage, t, idx, trips } while chips are in flight
    this._marks = [];                        // [{ t, kind }] kind: 'left' | 'back' | 'one'
    this._everRun = false;
  }

  noteRows() {
    return [{ text: 'the panel shows a journey, not a measurement' }];
  }

  // Called on every stage change: reset what this stage owns (the base resets age and fade).
  enter(stage) {
    this._run = null;
    this._marks = [];
  }

  // -- geometry -------------------------------------------------------------------
  // Anchors solved from the same spec drawShouter paints from, so the chip always
  // leaves the mouth and lands on the ear of the figure that is actually drawn.
  _anchors() {
    const sk = solveFigure({
      x: FIG_X, y: HILL_Y, height: FIG_H, facing: 1, build: 'adult', pose: 'stand',
    });
    const hd = sk.anchors.head;
    return {
      mouth: { x: hd.x + hd.r * 0.92, y: hd.y + hd.r * 0.2 },
      ear: { x: hd.x - hd.r * 0.56, y: hd.y + hd.r * 0.1 },
    };
  }

  // One trip: a straight crossing out to a surface and the same crossing back.
  _makeTrip(strike) {
    const { mouth } = this._anchors();
    const len = Math.hypot(strike.x - mouth.x, strike.y - mouth.y);
    return { mouth, strike, len, leg: len / SPEED };
  }

  _tripsForStage(stage) {
    if (stage === 0) return [this._makeTrip(STRIKE_FAR)];
    if (stage === 1) return [this._makeTrip(STRIKE_NEAR)];
    return [this._makeTrip(STRIKE_FAR), this._makeTrip(STRIKE_NEAR)];
  }

  // -- running --------------------------------------------------------------------
  _shout() {
    this._run = {
      stage: this.stage, t: 0, idx: 0,
      trips: this._tripsForStage(this.stage),
    };
    this._marks = [{ at: this.clock, kind: 'left' }];   // the shout's own mark, at the mouth
    this._everRun = true;
  }

  // Where the chip is at time `t` of a trip, or null while it is swallowed.
  _chipAt(trip, t) {
    const { mouth, strike, leg } = trip;
    if (t < leg) {
      const u = t / leg;
      return { x: mouth.x + (strike.x - mouth.x) * u, y: mouth.y + (strike.y - mouth.y) * u };
    }
    if (t < leg + PAUSE) return null;         // swallowed at the surface
    const u = (t - leg - PAUSE) / leg;
    const { ear } = this._anchors();
    return { x: strike.x + (ear.x - strike.x) * u, y: strike.y + (ear.y - strike.y) * u };
  }

  update(d) {                               // d = seconds, already clamped
    const r = this._run;
    if (!r) return;
    r.t += d;
    const trip = r.trips[r.idx];
    if (r.t < trip.leg * 2 + PAUSE) return;

    // The return landed, this trip's own round trip having taken `trip.leg * 2 +
    // PAUSE`. If that is still inside the leaving shout's mark window the two have
    // run together and are drawn as ONE mark; a later return gets a mark of its own
    // at the ear, well away from the first. Measured per trip, not per shout, so on
    // beat 2 the near return still merges after the far one has run.
    this._marks.push({ at: this.clock, kind: trip.leg * 2 + PAUSE < LEAVE ? 'one' : 'back' });

    if (r.idx + 1 < r.trips.length) {        // beat 2 runs both, one after the other
      r.idx += 1;
      r.t = -BETWEEN;
    } else {
      this._run = null;                      // every run ends on its arrival
    }
  }

  busy() { return !!this._run; }

  // -- drawing --------------------------------------------------------------------
  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawCard(ctx, c, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 0.9, { r: 16 });

    const showFar = this.stage !== 1;         // beat 1 is the near setting alone
    const showNear = this.stage !== 0;

    // the hillside body, then the shorter near-foreground strip in front of it
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.52);
    ctx.fillRect(PANEL.x + 2, HILL_Y, PANEL.w - 4, PANEL.y + PANEL.h - HILL_Y - 2);
    drawGroundLine(ctx, c, PANEL.x + 4, PANEL.x + PANEL.w - 4, HILL_Y, { h: 13 });

    if (showFar) drawRockFace(ctx, c, ROCK_X, HILL_Y, { w: ROCK_W, h: ROCK_H });
    if (showNear) {
      drawGroundLine(ctx, c, NEAR_X0, NEAR_X1, NEAR_Y, { h: 15, col: mix(c.stroke, c.bgSurface, 0.26) });
      drawHardWall(ctx, c, WALL_X, NEAR_Y, { w: WALL_W, h: WALL_H });
    }

    const { mouth, ear } = this._anchors();
    drawShouter(ctx, c, FIG_X, HILL_Y, { height: FIG_H, facing: 1, mood: 'smile' });
    drawEarMarker(ctx, c, ear.x, ear.y, { lit: this._earLit() });

    // the chip in flight - the same chip both ways, one colour, one size
    if (this._run && this._run.t >= 0) {
      const trip = this._run.trips[this._run.idx];
      const at = this._chipAt(trip, this._run.t);
      if (at) drawSoundChip(ctx, c, at.x, at.y);
    }

    this._drawMarks(ctx, c, mouth, ear);
    pill(ctx, c, 'your shout', mouth.x + 78, mouth.y - 44, { size: 13 });
    this._drawShoutPill(ctx, c);
  }

  // A mark is one quiet ring, drawn where the sound is: the leaving shout's at the
  // mouth, a return's at the ear, and a merged pair's once around both. No
  // confetti, no burst, nothing that would read as a second thing arriving.
  _drawMarks(ctx, c, mouth, ear) {
    for (const m of this._marks) {
      const age = this.clock - m.at;
      if (age > MARK_LIFE || age < 0) continue;
      const x = m.kind === 'left' ? mouth.x : m.kind === 'one' ? (mouth.x + ear.x) / 2 : ear.x;
      const y = m.kind === 'left' ? mouth.y : m.kind === 'one' ? (mouth.y + ear.y) / 2 : ear.y;
      const k = Math.min(1, age / 0.5);
      ctx.strokeStyle = alpha(c.accent, 0.8 * (1 - k * 0.75));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, (m.kind === 'one' ? 15 : 10) + k * 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _earLit() {
    let last = null;
    for (const m of this._marks) if (m.kind !== 'left') last = m;
    if (!last) return false;
    const age = this.clock - last.at;
    return age < LIT ? age / LIT : false;
  }

  // The `shout` button under the figure: the same run as the control-bar button,
  // and it pulses until the learner has shouted once.
  _drawShoutPill(ctx, c) {
    const pulse = this._everRun ? 1 : 1 + 0.05 * Math.sin(this.clock * 4);
    pill(ctx, c, 'shout', FIG_X + 62, HILL_Y + 30, { size: 14, scale: pulse, bg: c.s1 });
  }

  // -- input ----------------------------------------------------------------------
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'shout') this._shout();        // pressing it again restarts the run
    this.requestUiUpdate?.();
  }

  _shoutHit(p) {
    if (Math.abs(p.x - (FIG_X + 62)) < 50 && Math.abs(p.y - (HILL_Y + 30)) < 17) return true;
    return Math.hypot(p.x - FIG_X, p.y - (HILL_Y - FIG_H * 0.5)) < FIG_H * 0.62;
  }

  pointerDown(p) {
    if (!this._shoutHit(p)) return;
    this._shout();
    this.animateFor(600);
  }

  // Tapping the pill or the figure while a run is going restarts it, so the
  // learner can never be locked out of the thing the slide is about.
  pointerMove(p) { return this._shoutHit(p); }
}