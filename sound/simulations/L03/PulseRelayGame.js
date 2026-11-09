// PulseRelayGame - L03 mini-game (role: game, mini-game@1, mounted once, no beats).
//
// The panel is one row of five hanging balls, a boundary band on the floor under each one and a
// bell at the far end. The learner drags the first ball sideways and lets go. The run wins only if
// the push is handed ball to ball all the way to the bell AND no ball ever leaves its own band.
// Dragging hard enough tears the ball off its cord: it can then be carried to the bell by hand, and
// the bell stays silent - which is the whole lesson, staged by the mechanics and not by a caption.
//
// Rules this file follows (briefs/reference/scene-rules.md has the rest):
//   - colours only from `c` and mix/alpha/lighten/darken of them, never a hex, never a new token
//   - busy() is true while the row is damping or a carried ball is falling; every run ends
//   - delayed work uses this.after(); a run is credited to the state captured when it launched
//   - reserved base-class names are avoided (no stage/age/clock/_k/_tick/_loop/_running)
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import {
  W, drawBackdrop, drawFloor, drawShadow, drawSpotlight, drawVignette,
  rr, pill, alpha, mix, lighten, darken, font,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';

// -- the toy, in design px (680x520) -------------------------------------------------------
const N = 5;                     // five balls: enough hands to hand off, few enough to read
const R = 42;                    // ball radius
const S = 96;                    // spacing between rest positions -> 12 px of clear gap
const X0 = 130;                  // rest x of ball 0
const HW = 45;                   // band half-width: 90 wide, 6 px between bands
const RAIL_Y = 150;              // the rail the row hangs from
const L = 112;                   // cord length
const FLOOR_Y = 372;             // the floor line the bands are cut into
const BELL_R = 36;
const BELL_T = 12;               // ball 4 must travel this far to touch the bell
const BELL_PIVOT_Y = 200;
const BELL_X = X0 + (N - 1) * S + R + BELL_T + BELL_R;   // 586
const RAIL_X0 = 58, RAIL_X1 = 572;

// -- the dynamics, checked against a 1/480 s step model before this file was written ---------
// (win window by pull distance: 29.25 .. 42.5 px. Below that the push dies inside the row; above
// 42.5 a ball leaves its band; past CORD_LIM the cord lets go.)
const G = 3000;                  // px/s^2, a stylised scale (period 1.21 s at L = 112)
const C_RELAY = 0.18;            // air and pivot loss while the push travels the row
const RAMP_AT = 1.2;             // once the push is over, the toy winds down faster than a real
const RAMP_MAX = 1.6;            // cradle would - named in the design note as a simplification
const RAMP_IN = 0.9;
const SNAP_PX = 5;               // under this much swing a ball is at rest as far as anyone can see
const K_HAND = 1.0;              // a hand-off hands over the striker's angular speed
const REBOUND = 0.04;            // the striker keeps 4% and stops: it handed the push on
const CORD_LIM = 66;             // pull past this and the ball comes off the cord
const PULL_MAX = 76;             // the panel edge stops the drag
const ROLL_FRIC = 900;           // a dropped ball rolls a little way and stills
const HOLD_S = 1.8;              // how long a ring-with-escape is held before the board re-arms
const RUN_CAP_S = 12;            // hard cap: every run ends

const rest = (i) => X0 + i * S;

function text(ctx, c, str, x, y, px, col, o = {}) {
  ctx.save();
  ctx.font = font(c, o.weight ?? 700, px, o.display ?? false);
  ctx.fillStyle = col;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.restore();
}

export class PulseRelayGame extends withChallenge(SimScene) {
  static NOTE_STAGE = 0;             // one muted line along the bottom, on the only stage there is
  static DRAGGABLE = true;           // the drag is the whole game: never scroll the page instead
  static ARIA_LABEL =
    'A row of five balls hangs from a rail, each over a narrow band cut into the floor, with a bell '
    + 'on a stand at the far end. Drag the first ball sideways and let go: the row knocks itself '
    + 'along and rings the bell, but only wins if every ball stayed over its own band. Drag too '
    + 'hard and the ball comes off its cord - carrying it to the bell by hand rings nothing.';
  static OBJECTIVE = {
    prompt: {
      en: 'Hand the push from ball to ball all the way to the bell, with every ball staying over '
        + 'its own band. A ball you carry there yourself never rings it.',
    },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.02 };   // ok:true / ok:false path, not a tolerance
  static CONTROLS = [];               // the drag is the only input: no dials, no guide, no timer

  constructor(container, config) {
    super(container, config);
    this._resetRow();
    this._run = null;                 // { t, rung } while a run is live
    this._held = false;               // the learner has the first ball in hand
    this._offRail = false;            // it has come off its cord: it is in the hand, not on the rail
    this._free = null;                // { x, y, vx, vy, rolling } the dropped ball
    this._bell = { t: -1, ang: 0 };   // t < 0 = never rung
    this._hold = 0;                   // seconds left of the held verdict
    this._verdict = null;             // the last settled run: { rung, escaped }
    this._won = false;
    this._touched = false;            // has the learner released anything yet (drives the hint chip)
    this._figA = 0;                   // the hand-figure fades in only while dragging
  }

  async setup() {
    await super.setup();
    this._resetRow();
  }

  _resetRow() {
    this._th = new Array(N).fill(0);
    this._w = new Array(N).fill(0);
    this._handed = new Array(N - 1).fill(false);
    this._esc = new Array(N).fill(false);
  }

  // Called on every stage change; the host mounts this scene once, but a resume is a fresh mount.
  enter() {
    this._resetRow();
    this._run = null;
    this._free = null;
    this._held = false;
    this._offRail = false;
    this._bell = { t: -1, ang: 0 };
    this._hold = 0;
    this._figA = 0;
  }

  noteRows() {
    return [{
      text: 'spaced so each ball passes its push on \u00b7 a real pendulum swings on',
    }];
  }

  // -- the run -------------------------------------------------------------------------------

  /** Pressed at the end of a drag that stayed on the cord. */
  _launch() {
    if (this._run) return;
    this._run = { t: 0, rung: false };
    this._esc.fill(false);
    this._handed.fill(false);
  }

  /** Pressed at the end of a drag that carried the ball off the rail. */
  _drop() {
    if (this._run) return;
    this._run = { t: 0, rung: false };
    this._esc.fill(false);
    this._handed.fill(false);
    const gx = this._free ? this._free.x : this._ballX();
    const gy = this._free ? this._free.y : this._ballY();
    const x = Math.min(W - R - 6, Math.max(R + 6, gx));
    this._free = { x, y: Math.max(60, gy), vx: 0, vy: 0, rolling: false };
    this._esc[0] = Math.abs(x - rest(0)) > HW - 0.5;
  }

  _ring() {
    const r = this._run;
    if (!r || r.rung) return;
    r.rung = true;
    this._bell = { t: 0, ang: 0 };
    this.floatText('ring', BELL_X, 112, { bg: this.colors && this.colors.gold });
    if (!this._esc.some(Boolean)) {
      this._won = true;                  // the row is still over every strip: this is the win
      this.celebrate(BELL_X, BELL_PIVOT_Y + 40, 26);
    }
  }

  _endRun() {
    const r = this._run;
    if (!r) return;
    this._run = null;
    const escaped = this._esc.some(Boolean);
    this._verdict = { rung: r.rung, escaped };
    this._hold = HOLD_S;
    if (escaped) this._won = false;       // a late escape takes the win back: the ring was not enough
    else if (r.rung && !this._won) {
      this._won = true;
      this.celebrate(BELL_X, BELL_PIVOT_Y + 40, 26);
    }
  }

  _damping(t) {
    return C_RELAY + (t > RAMP_AT ? RAMP_MAX * Math.min(1, (t - RAMP_AT) / RAMP_IN) : 0);
  }

  update(d) {
    // the bell keeps ringing after the row has stopped - it is part of the verdict
    if (this._bell.t >= 0) {
      const t = this._bell.t + d;
      this._bell.t = t < 4.5 ? t : -1;
      this._bell.ang = t < 4.5 ? 0.46 * Math.exp(-1.7 * t) * Math.sin(2 * Math.PI * 3.1 * t) : 0;
    }

    const figTarget = this._held ? 1 : 0;
    this._figA += Math.sign(figTarget - this._figA) * Math.min(Math.abs(figTarget - this._figA), d * 4.5);

    if (this._free && !this._held) this._stepFree(d);   // it only falls once the hand lets go
    if (this._run) this._stepRow(d);

    if (this._hold > 0) {
      this._hold -= d;
      if (this._hold <= 0) {
        this._hold = 0;
        this._resetRow();
        this._free = null;
        this._offRail = false;
        this._bell = { t: -1, ang: 0 };   // a stale ring must not bleed into the next throw
      }
    }
  }

  _stepRow(d) {
    const r = this._run;
    if (!r) return;
    r.t += d;
    const steps = Math.max(1, Math.ceil(d * 240));
    const h = d / steps;
    const damp = this._damping(r.t);
    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < N; i++) {
        if (this._th[i] === 0 && this._w[i] === 0) continue;
        const a = -(G / L) * Math.sin(this._th[i]) - damp * this._w[i];
        this._w[i] += a * h;
        this._th[i] += this._w[i] * h;
      }
      const px = [];
      for (let i = 0; i < N; i++) {
        const off = L * Math.sin(this._th[i]);
        px.push(rest(i) + off);
        if (Math.abs(off) > HW - 0.5) this._esc[i] = true;    // latched for the whole run
      }
      for (let i = 0; i < N - 1; i++) {
        if (this._handed[i] || !(this._w[i] > 0)) continue;
        const gap = px[i + 1] - px[i];
        if (gap <= 2 * R && gap > 0) {
          this._handed[i] = true;
          this._w[i + 1] = this._w[i] * K_HAND;
          this._w[i] = -this._w[i] * REBOUND;
        }
      }
      if (!r.rung && this._w[N - 1] > 0 && px[N - 1] - rest(N - 1) >= BELL_T) this._ring();
      for (let i = 0; i < N; i++) {
        if (Math.abs(this._th[i]) * L < SNAP_PX && Math.abs(this._w[i]) * L < SNAP_PX * 2.5) {
          this._th[i] = 0;
          this._w[i] = 0;
        }
      }
    }
    const still = this._th.every((v) => v === 0) && this._w.every((v) => v === 0);
    if (still || r.t > RUN_CAP_S) this._endRun();
  }

  _stepFree(d) {
    const f = this._free;
    const steps = Math.max(1, Math.ceil(d * 240));
    const h = d / steps;
    for (let s = 0; s < steps; s++) {
      if (!f.rolling) {
        f.vy += G * h;
        f.x += f.vx * h;
        f.y += f.vy * h;
        if (f.y + R >= FLOOR_Y) {
          f.y = FLOOR_Y - R;
          f.rolling = true;
        }
      } else {
        f.x += f.vx * h;
        if (Math.abs(f.vx) <= 6) f.vx = 0;
        else f.vx -= Math.sign(f.vx) * ROLL_FRIC * h;
      }
      if (f.x <= R + 4 || f.x >= W - R - 4) {         // the panel edge stops a rolling ball
        f.x = Math.min(W - R - 4, Math.max(R + 4, f.x));
        f.vx = 0;
      }
      if (Math.abs(f.x - rest(0)) > HW - 0.5) this._esc[0] = true;
    }
    // it stays lying on the floor, where the learner can see it arrived by hand, until the reset
    if (f.rolling && f.vx === 0) this._endRun();
    else if (this._run && this._run.t > RUN_CAP_S) this._endRun();
  }

  busy() {
    return !!this._run || this._held || this._hold > 0 || this._bell.t >= 0;
  }

  // -- the mini-game contract ----------------------------------------------------------------

  checkObjective() {
    if (this._held || this._run || !this._verdict) return null;   // nothing to judge yet
    return { ok: this._verdict.rung && !this._verdict.escaped };
  }

  // -- input ---------------------------------------------------------------------------------

  _ballX() { return rest(0) + L * Math.sin(this._th[0]); }
  _ballY() { return RAIL_Y + L * Math.cos(this._th[0]); }

  pointerDown(p) {
    if (this._held) return;
    const off = this._offRail && this._free;
    const bx = off ? this._free.x : this._ballX();
    const by = off ? this._free.y : this._ballY();
    if (Math.hypot(p.x - bx, p.y - by) > R + 18) return;
    this._held = true;
    this._verdict = null;                 // a new throw clears the last verdict
    this._won = false;
    this._hold = 0;
    this._resetRow();                     // you cannot hold one ball while the row is still swinging
    this._free = null;
    this._offRail = false;             // whatever was lying on the floor is re-hung before the throw
    this.animateFor(600);
  }

  pointerMove(p) {
    if (!this._held) return false;
    if (!this._offRail) {
      const dx = Math.max(-PULL_MAX, Math.min(PULL_MAX, p.x - rest(0)));
      if (Math.abs(dx) > CORD_LIM) {
        this._offRail = true;             // the cord lets go: the ball is in the hand now
        this._free = { x: this._ballX(), y: this._ballY(), vx: 0, vy: 0, rolling: false };
      }
      this._th[0] = Math.asin(Math.max(-0.985, Math.min(0.985, dx / L)));
    }
    if (this._offRail) {
      if (!this._free) this._free = { x: this._ballX(), y: this._ballY(), vx: 0, vy: 0, rolling: false };
      this._free.x = Math.min(W - R - 6, Math.max(R + 6, p.x));
      this._free.y = Math.max(56, Math.min(FLOOR_Y - R, p.y));
    }
    this.animateFor(600);
    return true;
  }

  pointerUp() {
    if (!this._held) return;
    this._held = false;
    this._touched = true;
    if (this._offRail) this._drop();
    else this._launch();
    this.animateFor(7000);                // a run is about 3-5 s of swing
  }

  // -- drawing --------------------------------------------------------------------------------

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawSpotlight(ctx, c, 340, 250, 320, 0.45);
    this._board(ctx, c);
    drawFloor(ctx, c, FLOOR_Y);
    this._rail(ctx, c);
    this._bands(ctx, c);
    this._bellArt(ctx, c);
    for (let i = N - 1; i >= 1; i--) this._ballArt(ctx, c, i);   // ball 0 on top, it is the one in hand
    if (this._figA > 0.02) this._handFigure(ctx, c);
    this._ballArt(ctx, c, 0);                       // ball 0 last: it is the one in the learner's hand
    this._chips(ctx, c);
    drawVignette(ctx, c, 0.5);
  }

  _board(ctx, c) {
    // the toy is screwed to a board: it gives the row a surface to hang against, and it is the
    // only reason the middle of the panel is not bare backdrop
    const x = 72, y = 96, w = 596, h = FLOOR_Y - y;
    rr(ctx, x, y, w, h, 14);
    ctx.fillStyle = alpha(c.bgSurface, 0.9);
    ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.55);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.bgSurface, 0.3), 0.55);
    ctx.fillRect(x + 12, y + 2, w - 24, 3);
    ctx.fillStyle = alpha(c.stroke, 0.75);            // four fixings, one per corner
    for (const [fx, fy] of [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _rail(ctx, c) {
    const col = mix(c.stroke, c.label, 0.28);
    ctx.strokeStyle = alpha(c.stroke, 0.85);          // two hangers up to the board
    ctx.lineWidth = 3;
    for (const x of [RAIL_X0 + 12, RAIL_X1 - 12]) {
      ctx.beginPath();
      ctx.moveTo(x, RAIL_Y);
      ctx.lineTo(x, 100);
      ctx.stroke();
      rr(ctx, x - 13, 92, 26, 9, 4);
      ctx.fillStyle = alpha(c.stroke, 0.7);
      ctx.fill();
    }
    rr(ctx, RAIL_X0, RAIL_Y - 7, RAIL_X1 - RAIL_X0, 14, 7);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.9);
    rr(ctx, RAIL_X0 + 6, RAIL_Y - 5, RAIL_X1 - RAIL_X0 - 12, 4, 2);
    ctx.fill();
    for (const x of [RAIL_X0 + 7, RAIL_X1 - 7]) {     // rounded end caps
      ctx.beginPath();
      ctx.arc(x, RAIL_Y, 9, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    }
  }

  _bands(ctx, c) {
    const y = FLOOR_Y + 5, h = 18;
    for (let i = 0; i < N; i++) {
      const w = 2 * HW, x = rest(i) - w / 2;
      let fill = alpha(c.label, 0.15), edge = alpha(c.label, 0.5);
      if (this._esc[i]) { fill = alpha(c.warning, 0.42); edge = c.warning; }
      else if (this._won) { fill = alpha(c.good, 0.36); edge = c.good; }
      rr(ctx, x, y, w, h, 5);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = lighten(edge, 0.35);           // a lit lip along the front of the strip
      ctx.fillRect(x + 6, y + 1, w - 12, 3);
      ctx.fillStyle = edge;                          // a stop at each end of the strip
      for (const ex of [x + 3, x + w - 8]) ctx.fillRect(ex, y + 5, 5, h - 10);
    }
    // one part name, beside its own strip, never on the run
    text(ctx, c, 'boundary band', rest(0), y + h + 15, 13, alpha(c.label, 0.7));
  }

  _ballPos(i) {
    if (i === 0 && this._offRail && this._free) return { x: this._free.x, y: this._free.y };
    if (i === 0 && this._free) return { x: this._free.x, y: this._free.y };
    return { x: rest(i) + L * Math.sin(this._th[i]), y: RAIL_Y + L * Math.cos(this._th[i]) };
  }

  _ballArt(ctx, c, i) {
    const p = this._ballPos(i);
    if (i === 0 && this._offRail) {                    // its cord is empty: draw it dangling
      ctx.strokeStyle = alpha(c.stroke, 0.75);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rest(0), RAIL_Y);
      ctx.lineTo(rest(0) + 3, RAIL_Y + 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rest(0) + 3, RAIL_Y + 31, 5, 0, Math.PI * 2);
      ctx.strokeStyle = alpha(c.stroke, 0.9);
      ctx.stroke();
    } else {
      ctx.strokeStyle = alpha(c.stroke, 0.8);         // the cord swings with its ball
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rest(i), RAIL_Y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    drawShadow(ctx, c, p.x, FLOOR_Y + 3, R * 0.72, 8);
    const base = i === 0 ? c.accent : mix(c.shape, c.bgDeep, 0.28);
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fillStyle = darken(base, 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y - 2, R - 3, 0, Math.PI * 2);
    ctx.fillStyle = base;
    ctx.fill();
    ctx.beginPath();                                  // a flat cushion highlight, house style
    ctx.ellipse(p.x - R * 0.3, p.y - R * 0.36, R * 0.36, R * 0.24, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = alpha(lighten(base, 0.55), 0.75);
    ctx.fill();
    if (i === 0 && !this._held && !this._touched) {   // the one ball in hand gets a ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, R + 8, 0, Math.PI * 2);
      ctx.strokeStyle = alpha(c.accent, 0.35 + 0.25 * Math.sin(this.clock * 3));
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  _bellArt(ctx, c) {
    const body = mix(c.gold, c.label, 0.12);
    ctx.save();                                        // the stand
    rr(ctx, BELL_X - 5, BELL_PIVOT_Y, 10, FLOOR_Y - BELL_PIVOT_Y - 2, 4);
    ctx.fillStyle = darken(mix(c.stroke, c.label, 0.2), 0.25);
    ctx.fill();
    drawShadow(ctx, c, BELL_X, FLOOR_Y + 2, 34, 8);
    rr(ctx, BELL_X - 32, FLOOR_Y - 8, 64, 12, 5);
    ctx.fillStyle = mix(c.stroke, c.label, 0.22);
    ctx.fill();
    ctx.translate(BELL_X, BELL_PIVOT_Y);
    ctx.rotate(this._bell.ang);                        // the bell swings about its hanger
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.quadraticCurveTo(-22, 14, -25, 40);
    ctx.lineTo(-BELL_R, 48);
    ctx.lineTo(-BELL_R, 58);
    ctx.lineTo(BELL_R, 58);
    ctx.lineTo(BELL_R, 48);
    ctx.lineTo(25, 40);
    ctx.quadraticCurveTo(22, 14, 7, 2);
    ctx.closePath();
    ctx.fillStyle = darken(body, 0.28);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, 5);
    ctx.quadraticCurveTo(-19, 16, -21, 40);
    ctx.lineTo(-BELL_R + 4, 47);
    ctx.lineTo(BELL_R - 4, 47);
    ctx.lineTo(21, 40);
    ctx.quadraticCurveTo(19, 16, 6, 5);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-10, 20, 5, 13, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = alpha(lighten(body, 0.55), 0.8);
    ctx.fill();
    ctx.beginPath();                                  // the clapper peeks below the rim
    ctx.arc(0, 60, 6, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.4);
    ctx.fill();
    ctx.restore();

    const t = this._bell.t;                            // sound leaving the bell, then nothing
    if (t >= 0 && t < 0.75) {
      ctx.strokeStyle = alpha(body, 0.55 * (1 - t / 0.75));
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const rad = 26 + k * 13 + t * 26;
        ctx.beginPath();
        ctx.arc(BELL_X, BELL_PIVOT_Y + 34, rad, -0.85, 0.85);
        ctx.stroke();
      }
    }
  }

  _handFigure(ctx, c) {
    const b = this._ballPos(0);
    const hx = b.x - R * 0.55, hy = b.y + R * 0.83;      // the grip sits on the rim, not behind it
    const fx = Math.max(32, Math.min(W - 46, hx - 22));
    ctx.save();
    ctx.globalAlpha = this._figA;
    drawFigure(ctx, c, {
      x: fx,
      y: FLOOR_Y,
      height: 112,
      facing: 1,
      pose: 'carry',
      hands: [{ x: hx, y: hy }, { x: hx, y: hy }],
      autoReach: true,
    }, { mood: 'effort' });
    ctx.restore();
  }

  _chips(ctx, c) {
    if (!this._touched && !this._held && !this._run) {
      const pulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(this.clock * 2.6));
      ctx.save();
      ctx.globalAlpha = pulse;
      pill(ctx, c, 'drag the first ball aside, then let go', 336, 108);
      ctx.restore();
      return;
    }
    if (this._offRail && !this._held) {
      pill(ctx, c, 'the cord let go', 232, 108, { fill: c.warning });
    }
  }
}