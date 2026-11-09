import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawCard, drawMeter, drawShadow, drawBadge, drawFace,
  drawVignette, pill, chipRow, rr,
  font, alpha, mix, lighten, darken, luma,
} from 'simulations/base/kit/SimLook.js';

const G = 10;             // N/kg, the bundle's own convention (OUTLINE.md)

// -- The account -----------------------------------------------------------------
// One number runs the whole scene. The ball is released from rest at the start
// line, so everything it will ever have is m g y0; every metre it climbs costs
// it exactly the same amount back. Both panels read this one account - the
// height panel as the bill, the motion bar as what is left - and the ball is
// where those two are subtracted from each other, which is why the two always
// agree no matter what shape the track is.
//
// The ball's mass (1.0 kg) cancels out of everything the scene shows: the speed
// at a height is sqrt(2 g (y0 - y)) whatever it weighs, which is why neither
// panel needs a mass and the track is the only thing the learner can change.
const Y0 = 1.0;           // m, the start line: the track height at O

// The dashed far mark. R is above the start line by construction and stays
// there: every draggable point clamps to Y_MAX, which is below R, so there is
// no track the learner can draw that the ball could get over that line.
const R_Y = 1.6;          // m
const Y_MAX = 1.4;        // m, the clamp on every draggable control point
const Y_MIN = 0.0;

// The default profile: a dip, a long flat bottom, a hump, then a far end well
// above the start line. Beat 1 stops on the hump because the hump is a plateau
// at exactly the start height. Beat 2 raises that plateau to Y_MAX - 0.4 m
// above the start line - and the ball runs out partway up it.
const X_MIN = -0.22;       // m, the landing shelf's far end: flat at the start height
const PTS_DEFAULT = [
  { x: X_MIN, y: Y0 },      // the landing shelf: a ball that comes back to O at rest sits on it
  { x: 0.0, y: Y0 },        // O - the release point, and the start line itself
  { x: 1.2, y: 0.0 },
  { x: 2.4, y: 0.0 },
  { x: 3.4, y: Y0 },        // Q: the near edge of the flat crest
  { x: 3.9, y: Y0 },        // the far edge of the flat crest
  { x: 4.9, y: 0.15 },
  { x: 6.0, y: Y_MAX },     // the far end, always under the R mark
];
const Q_I = 4;              // the crest's near edge is Q
const CREST_END_I = 5;
const X_MAX = PTS_DEFAULT[PTS_DEFAULT.length - 1].x;
const PTS_RAISED = PTS_DEFAULT.map((p, i) => (
  (i === Q_I || i === CREST_END_I) ? { x: p.x, y: Y_MAX } : { x: p.x, y: p.y }
));

// -- Drawn geometry --------------------------------------------------------------
// The track and the height panel are the same object twice: one y scale, one x
// scale, so a point on the track and its bar in the panel are the same pixel
// column and the start line is the same row in both. That is the whole point of
// the slide's "the same object seen twice", so the two views are cut from one
// set of numbers, never two.
const BOX_X = 92;          // px, where x = 0 m lands - far enough in that the
const BOX_W = 544;         // ball at O, halo and all, never clips the card edge
const Y_TOP = 2.0;         // m, the top of both boxes' height range
const PPM = 82;            // px per metre - the same in both boxes
const BOX_H = Y_TOP * PPM; // 164 px, the shared height of the drawing range

const TRACK_Y = 76;        // px, the top row of the track box
const PANEL_Y = 250;       // px, the top row of the height panel box
const BAR_Y = 428;         // px, the speed bar's rail
const BAR_H = 18;
const SPD_TXT_X = 152;     // px, the live speed reading - or its "nothing" pill
const BAR_X0 = 252;        // px, where the speed rail starts
const BAR_W = 316;         // px, the rail's length, the full 0 .. V0

const MARK_ROW = 56;       // px, the row the O / Q / R letters sit on
const CARD_TITLE_Y = 15;   // px, the in-card title's centre, shared by both boxes
const CARD_PAD = 24;       // px, the card's margin - wide enough that the ball
                           // at O, halo and all, never crosses the card edge
const RAIL_T = 9;          // px, the thickness of the track band
const BALL_R = 15;
const DRAG_R = 17;         // px, how close a finger has to be to a point

// Speed the ball would arrive at if it dropped the whole start height: the
// fixed top of the motion bar's scale, so both beats read off one scale.
const V0 = Math.sqrt(2 * G * Y0);   // 4.47 m/s

const SUB_S = 1 / 240;      // physics sub-step: short enough never to jump a vertex
// How close to the start line counts as standing on it. The ball approaches a
// crest asymptotically - its speed falls like the square root of the distance
// left - so a speed threshold would never fire and the run would creep for
// ever. At 82 px per metre this is a hundredth of a pixel.
const REST_E = 1e-4;        // m
const RUN_MAX_S = 14;      // a hard ceiling on any run, so one always ends
const SETTLE_S = 1.2;      // the tail the celebration gets before the loop parks
const READOUT_EVERY = 0.35; // s between refreshes of the live numbers

// What each beat says, as short chips. Never a sentence from the slide.
const BEAT_CHIPS = [
  [{ text: 'drag the track', bg: 'accent' }],
  [{ text: 'where does it stop?', bg: 'accent' }],
  [{ text: 'far hill above the line', bg: 'warning' }],
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],  // the track as given, ball at O, both bars at their starts
  [{ idx: 1, dwellMs: null }],  // the first run: it stops exactly on the start line
  [{ idx: 2, dwellMs: null }],  // the crest above the line: it runs out short and rolls back
];

const BEAT_PROFILE = [PTS_DEFAULT, PTS_DEFAULT, PTS_RAISED];

// Drawn px for a height in metres, and the other way. One scale for the track
// and the height panel, so the two are the same object seen twice.
function yPx(y) { return TRACK_Y + BOX_H * (1 - y / Y_TOP); }
function yPxPanel(y) { return PANEL_Y + BOX_H * (1 - y / Y_TOP); }
function xPx(x) { return BOX_X + BOX_W * (x / X_MAX); }

// A monotone-in-x sample of the profile, so "the height of the track at x" is
// one lookup everywhere and the ball's position is the only thing that moves.
function sampleAt(pts, x) {
  if (x <= pts[0].x) return pts[0].y;
  const last = pts[pts.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1], b = pts[i];
    if (x <= b.x) {
      const u = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * u;
    }
  }
  return last.y;
}

export class ContouredTrackScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A frictionless track seen from the side with a ball resting at the start mark O. Directly below the track, sharing its width, a height panel plots the same profile: the area under the start line is energy in hand, the hatched area above it is the bill. A speed bar below that reads the ball\'s speed, and reads nothing at all when it is at rest. Every control point of the track except the start can be dragged up and down, and the two panels redraw as you drag. Releasing the ball sends it down the first dip and up the hump after it, where it comes to rest exactly on the level it started on with the speed bar at nothing.';
  static NOTE_STAGE = 0;
  static DRAGGABLE = true;
  static CONTROLS = [
    { type: 'button', id: 'release', label: 'Release' },
  ];

  _pts = PTS_DEFAULT.map((p) => ({ x: p.x, y: p.y }));
  _run = null;
  _ballX = 0;              // the ball's resting place when no run is in flight
  _drag = -1;
  _settle = 0;
  _stoppedAt = -1;         // x of the last settle, so Q can stay lit
  _stallX = -1;            // x where the last run ran out of climb
  _lastTurned = 0;         // whether the last run turned, which picks the celebration
  _hTxt = '';              // the held readings, so a number never crawls
  _vTxt = '';
  _readoutAt = 0;

  noteRows() {
    return [
      { text: 'Frictionless: the height panel and the speed bar are one account, read two ways.' },
    ];
  }

  enter(stage) {
    const base = BEAT_PROFILE[Math.min(stage, BEAT_PROFILE.length - 1)];
    this._pts = base.map((p) => ({ x: p.x, y: p.y }));
    this._run = null;
    this._ballX = 0;
    this._drag = -1;
    this._settle = 0;
    this._stoppedAt = -1;
    this._stallX = -1;
    this._lastTurned = 0;
    this._hTxt = '';
    this._vTxt = '';
    this._readoutAt = 0;
    this._readoutNow();
    this.requestUiUpdate?.();
  }

  busy() {
    return !!this._run || this._settle > 0;
  }

  // -- the account, read three ways --------------------------------------------
  _yAt(x) { return sampleAt(this._pts, x); }

  // Speed is *derived*, never integrated, so the motion bar cannot drift away
  // from the height panel: they are the same number twice.
  _vAt(x) {
    const d = Y0 - this._yAt(x);
    return d <= 0 ? 0 : Math.sqrt(2 * G * d);
  }

  // The segment the ball is travelling *into*. The direction matters: a ball
  // sitting exactly on a vertex heading left is on the segment to its left, and
  // picking the one to its right leaves it with nowhere to go.
  _seg(x, dir) {
    const p = this._pts;
    const last = p.length - 2;
    if (dir >= 0) {
      for (let i = 0; i < last; i += 1) if (x < p[i + 1].x) return i;
      return last;
    }
    for (let i = last; i >= 0; i -= 1) if (x > p[i].x) return i;
    return 0;
  }

  _downhill(x) {
    return this._slope(this._seg(x, 1)) > 0 ? -1 : 1;
  }

  _slope(i) {
    const a = this._pts[i], b = this._pts[i + 1];
    return b.x === a.x ? 0 : (b.y - a.y) / (b.x - a.x);
  }

  update(d) {
    const dt = Math.max(0, Math.min(d, 0.05));
    if (this._settle > 0) this._settle = Math.max(0, this._settle - dt);
    const r = this._run;
    if (r) {
      r.t += dt;
      if (r.t > RUN_MAX_S) { this._endRun(); return; }
      this._stepBall(dt);
    }
  }

  // The live numbers are held, not redrawn every frame: a readout that changes
  // sixty times a second reads as overlapping text. They are refreshed only
  // where the ball can have moved, so a parked scene has nothing left to
  // animate - a timer here would keep the loop awake for ever.
  _readoutNow() {
    const h = `${this._yAt(this._ballX).toFixed(1)} m`;
    const v = `${this._vAt(this._ballX).toFixed(1)} m/s`;
    if (h === this._hTxt && v === this._vTxt) return;
    if (this._run && this.age - this._readoutAt < READOUT_EVERY) return;
    this._hTxt = h;
    this._vTxt = v;
    this._readoutAt = this.age;
  }

  // Advance the ball along the track. Short fixed sub-steps keep the
  // straight-segment solution exact where it matters (at a crest, where the
  // whole claim lives) while never being long enough to jump a vertex. The
  // speed is re-derived from the height every sub-step, so the ball cannot
  // drift away from the two panels, and the only thing left to test is the
  // reversal - which is a test of how high the ball has got, not a root find.
  _stepBall(dt) {
    const r = this._run;
    const x0 = r.x;
    let left = dt;
    let guard = 0;
    let stopped = false;
    while (left > 1e-9 && guard < 64) {
      guard += 1;
      const h = Math.min(SUB_S, left);
      left -= h;
      const i = this._seg(r.x, r.dir);
      const acc = -G * this._slope(i) * r.dir;    // constant on a straight segment
      const v = this._vAt(r.x);
      r.x += r.dir * (v * h + 0.5 * acc * h * h);
      if (r.dir > 0 && this._pts[i + 1].x - r.x < 1e-12) r.x = this._pts[i + 1].x;
      else if (r.dir < 0 && r.x - this._pts[i].x < 1e-12) r.x = this._pts[i].x;
      r.x = Math.max(X_MIN, Math.min(X_MAX, r.x));
      if (Y0 - this._yAt(r.x) > REST_E) continue;

      // The ball is within reach of the start line. Ground that falls away
      // ahead means this is the *top* of a descent - the release point itself -
      // not a crest, so it rolls on and is left alone.
      if (-G * this._slope(this._seg(r.x, r.dir)) * r.dir > 1e-9) continue;

      // Otherwise the speed has run out. Put the ball exactly on the line, then
      // ask what the ground does from there. Flat on either side means there is
      // a shelf to sit on and it stays; only a fall away behind it is a crest it
      // can turn at. A flat shelf wins even when it is on one side only,
      // because a ball at the lip of a level top is supported by it.
      r.x = this._restX(r.x, i);
      if (r.dir > 0 ? r.x >= X_MAX - 1e-9 : r.x <= X_MIN + 1e-9) { stopped = true; break; }
      const back = -r.dir;
      if (this._flatAt(r.x, r.dir) || this._flatAt(r.x, back)) { stopped = true; break; }
      if (-G * this._slope(this._seg(r.x, back)) * back < 1e-9) { stopped = true; break; }
      r.dir = back;
      r.turned += 1;
      r.turnX = r.x;
    }
    r.v = this._vAt(r.x);
    this._ballX = r.x;
    if (stopped) this._settleRun();
    // No progress at all means the ball is somewhere the model cannot leave
    // it, which is a rest state by definition. Better to end than to spin.
    else if (dt > 1e-6 && r.x === x0) this._settleRun();
    else this._readoutNow();
  }

  // Is the ground on this side of a point flat?
  _flatAt(x, dir) {
    return Math.abs(this._slope(this._seg(x, dir))) <= 1e-9;
  }

  // Where the current segment crosses the start line: the one spot where the
  // ball can be at rest, so it is the one spot it must be put on rather than
  // wherever the last sub-step happened to land.
  _restX(x, i) {
    const a = this._pts[i], b = this._pts[i + 1];
    const s = this._slope(i);
    if (s === 0) return Math.max(a.x, Math.min(b.x, x));
    const xr = a.x + (Y0 - a.y) / s;
    return Math.max(a.x, Math.min(b.x, xr));
  }

  // The stage that launched the run, captured at launch - never the stage that
  // happens to be current when the run finishes.
  _launch(x, dir) {
    this._run = { stage: this.stage, x, dir, v: this._vAt(x), t: 0, turned: 0, turnX: x };
    this._ballX = x;
    // The marks of the last run are evidence about that run: a new one clears
    // them, and they are drawn again only when this one settles.
    this._stoppedAt = -1;
    this._stallX = -1;
  }

  _release() {
    if (this._run) return;
    this._ballX = 0;
    this._launch(0, 1);
    this.requestUiUpdate?.();
  }

  _endRun() {
    if (!this._run) return;
    this._ballX = this._run.x;
    this._run = null;
    this._settle = SETTLE_S;
    this.requestUiUpdate?.();
  }

  // The ball's speed has reached nothing. That is the moment the slide is about,
  // so it is the moment worth marking - not the press of Release.
  _settleRun() {
    const r = this._run;
    this._ballX = r.x;
    const turned = r.turned > 0;
    this._run = null;
    this._settle = SETTLE_S;
    this._stoppedAt = r.x;
    this._stallX = turned ? r.turnX : r.x;
    this._lastTurned = r.turned;
    this._readoutNow();
    const c = this.colors;
    const bx = xPx(r.x);
    const by = yPx(this._yAt(r.x));
    if (turned) {
      // It ran out partway up and came back. The burst belongs at the point it
      // ran out at, NOT at the point it ended up: those are different places,
      // and a ring on the ball at O would celebrate the wrong thing. The
      // standing "ran out" chip by the stall is the label for it, so there is
      // no float here - two "ran out" chips saying one thing is noise.
      const sx = xPx(r.turnX);
      const sy = yPx(this._yAt(r.turnX));
      this.celebrate(sx, sy - BALL_R, 22);
    } else {
      this.celebrate(bx, by - BALL_R, 32);
      this.floatText(`${this._yAt(r.x).toFixed(2)} m`, bx, by - 34, { bg: c?.good });
    }
    this.requestUiUpdate?.();
  }

  // -- controls and input -------------------------------------------------------
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'release') this._release();
  }

  isControlDisabled(id) {
    return id === 'release' && !!this._run;
  }

  pointerDown(p) {
    if (this._run) return;
    // The shelf and O are excluded: O is the start line, and the start line is the budget.
    for (let i = 2; i < this._pts.length; i += 1) {
      const dx = p.x - xPx(this._pts[i].x);
      const dy = p.y - yPx(this._pts[i].y);
      if (dx * dx + dy * dy <= DRAG_R * DRAG_R) {
        this._drag = i;
        return;
      }
    }
  }

  pointerMove(p) {
    if (this._drag < 0) return false;
    const y = Y_TOP - (p.y - TRACK_Y) / PPM;
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, y));
    if (Math.abs(clamped - this._pts[this._drag].y) < 1e-4) return true;
    this._pts[this._drag].y = clamped;
    this._readoutNow();
    // A mark about the last run is a mark about the old shape: it goes with it.
    this._stoppedAt = -1;
    this._stallX = -1;
    // A ball on a slope does not stay on it: if the learner has just taken the
    // floor out from under a resting ball, it goes again.
    if (!this._run) {
      const v = this._vAt(this._ballX);
      if (v > 0.05) this._launch(this._ballX, this._downhill(this._ballX));
    }
    return true;
  }

  pointerUp() {
    this._drag = -1;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    // The light falls off at the frame edge, so the two cards read as objects
    // standing in a room rather than as rectangles on a pattern.
    drawVignette(ctx, c);
    this._track(ctx, c);
    this._heightPanel(ctx, c);
    this._speedBar(ctx, c);
    this._marks(ctx, c);
    this._chips(ctx, c);
  }

  // -- the track ----------------------------------------------------------------
  _track(ctx, c) {
    const p = this._pts;
    drawCard(ctx, c, BOX_X - CARD_PAD, TRACK_Y - 8, BOX_W + CARD_PAD * 2, BOX_H + 18, 1, { accent: c.accent, r: 14 });
    this._air(ctx, c, TRACK_Y);
    this._rule(ctx, c, Y0, TRACK_Y, BOX_W, c.label, false);
    this._rule(ctx, c, R_Y, TRACK_Y, BOX_W, c.warning, true);
    this._leader(ctx, xPx(X_MAX), MARK_ROW + 24, yPx(R_Y) - 3, c.warning);

    // The body of the track: one cushion shade, a notch under the card, so the
    // rail and the ball are the only lit things in the box.
    const base = yPx(0);
    ctx.beginPath();
    ctx.moveTo(xPx(p[0].x), yPx(p[0].y));
    for (let i = 1; i < p.length; i += 1) ctx.lineTo(xPx(p[i].x), yPx(p[i].y));
    ctx.lineTo(xPx(p[p.length - 1].x), base);
    ctx.lineTo(xPx(p[0].x), base);
    ctx.closePath();
    ctx.fillStyle = mix(c.bgSurface, c.stroke, 0.3);
    ctx.fill();

    this._rail(ctx, c, yPx, RAIL_T);
    for (let i = 1; i < p.length; i += 1) this._handle(ctx, c, i);

    const bx = xPx(this._ballX);
    const by = yPx(this._yAt(this._ballX));
    drawShadow(ctx, c, bx, yPx(0) > by + BALL_R ? yPx(0) : by + BALL_R + 2, BALL_R * 1.1, 3);
    this._ball(ctx, c, bx, by);
    this._verdict(ctx, c);
    // Both boxes are named, so the lower one is the slide's height panel and
    // not just a second copy of the track.
    pill(ctx, c, 'the track', BOX_X - 6, TRACK_Y + CARD_TITLE_Y,
      { bg: mix(c.stroke, c.label, 0.45), size: 13, align: 'left' });
  }

  // The air above the track, lit rather than flat: a warm sky over the track
  // in the light theme, night over it in the dark one. The air is most of each
  // card, so left plain it is what an empty-centre check rightly complains
  // about - and a lit sky is the scene's setting, not decoration.
  _air(ctx, c, top) {
    const x = BOX_X - CARD_PAD;
    const w = BOX_W + CARD_PAD * 2;
    const h = BOX_H + 18;
    const light = luma(c.bgSurface) > 0.5;
    const tint = light ? c.gold : c.bgDeep;
    const g = ctx.createLinearGradient(0, top - 8, 0, top + h * 0.74);
    g.addColorStop(0, alpha(tint, light ? 0.17 : 0.5));
    g.addColorStop(1, alpha(tint, 0));
    ctx.save();
    rr(ctx, x, top - 8, w, h, 14);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(x, top - 8, w, h);
    ctx.restore();
  }

  // The rail the ball rides: a closed band under the profile with a lit edge on
  // top of it, drawn once and used by BOTH boxes at their own y scale, because
  // "the same object seen twice" has to be the same object and not two drawings
  // that happen to agree.
  _rail(ctx, c, yFn, t) {
    const p = this._pts;
    const line = (dy) => {
      ctx.beginPath();
      ctx.moveTo(xPx(p[0].x), yFn(p[0].y) + dy);
      for (let i = 1; i < p.length; i += 1) ctx.lineTo(xPx(p[i].x), yFn(p[i].y) + dy);
    };
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    line(0);
    for (let i = p.length - 1; i >= 0; i -= 1) ctx.lineTo(xPx(p[i].x), yFn(p[i].y) + t);
    ctx.closePath();
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.2);
    ctx.fill();
    line(0);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Where the last run came to rest, and where it ran out - the two pieces of
  // evidence the beats are about, kept up until the shape changes under them.
  _verdict(ctx, c) {
    if (this._stoppedAt >= 0 && !this._lastTurned) {
      const bx = xPx(this._stoppedAt);
      const by = yPx(this._yAt(this._stoppedAt));
      const side = bx < 210 ? 1 : -1;      // never drawn over the ball
      drawBadge(ctx, c, 'check', bx + side * (BALL_R + 24), by - BALL_R - 4, 12);
    }
    if (this._stallX >= 0 && this._lastTurned) {
      // A stall is always at the start-line height, so the chip goes in the
      // clear air to the left of it at a fixed row, far enough left to stay off
      // the burst that opens there: a chip that followed the stall point would
      // sit on the R rule or on the track at some shapes.
      pill(ctx, c, 'ran out', Math.max(BOX_X + 60, xPx(this._stallX) - 76), TRACK_Y + 54,
        { bg: c.warning, size: 13, align: 'center' });
    }
  }

  _handle(ctx, c, i) {
    const x = xPx(this._pts[i].x);
    const y = yPx(this._pts[i].y);
    const hot = this._drag === i;
    ctx.beginPath();
    ctx.arc(x, y, hot ? 9 : 7, 0, Math.PI * 2);
    ctx.fillStyle = hot ? lighten(c.accent, 0.3) : mix(c.accent, c.bgSurface, 0.35);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = hot ? c.label : c.accent;
    ctx.stroke();
  }

  // The ball is the hero, so it is the one thing in the scene with a face: it
  // squints going up, wide-eyed at speed, and shuts its eyes when it has made
  // the height. The eyes point where it is going, which is also how you read a
  // turn without watching the whole run.
  _ball(ctx, c, x, y) {
    const v = this._vAt(this._ballX);
    const dir = this._run ? this._run.dir : 0;
    const climbing = dir !== 0 && dir * this._slope(this._seg(this._ballX, dir)) > 0;
    const made = this._stoppedAt >= 0 && !this._lastTurned;
    const mood = made ? 'happy'
      : !this._run ? 'smile'
        : climbing ? 'squint' : v > 2.2 ? 'oops' : 'smile';
    const cy = y - BALL_R;
    ctx.beginPath();
    ctx.arc(x, cy, BALL_R + 6, 0, Math.PI * 2);
    ctx.fillStyle = alpha(c.gold, 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, cy, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = c.gold;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = darken(c.gold, 0.45);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, cy, BALL_R, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(x - BALL_R * 0.36, cy - BALL_R * 0.44, BALL_R * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = alpha(lighten(c.gold, 0.6), 0.45);
    ctx.fill();
    ctx.restore();
    drawFace(ctx, x, cy + BALL_R * 0.08, BALL_R * 0.8, {
      c, col: c.gold, mood, t: 0.2, blush: true, look: { x: dir, y: climbing ? -0.6 : 0 },
    });
  }

  // -- the height panel: the same object, seen as what it costs -----------------
  _heightPanel(ctx, c) {
    drawCard(ctx, c, BOX_X - CARD_PAD, PANEL_Y - 8, BOX_W + CARD_PAD * 2, BOX_H + 18, 1, { accent: c.accent, r: 14 });
    this._air(ctx, c, PANEL_Y);
    this._rule(ctx, c, Y0, PANEL_Y, BOX_W, c.label, false);
    this._rule(ctx, c, R_Y, PANEL_Y, BOX_W, c.warning, true);

    // In hand: the drop below the start line. This is the energy waiting to be
    // spent, so it is the accent fill. Opaque, not an alpha wash: an alpha fill
    // on a light card is a pale tint, and the panel's whole job is to be read.
    this._band(ctx, yPxPanel, true, () => {
      ctx.fillStyle = mix(c.bgSurface, c.accent, 0.34);
      ctx.fill();
    });

    // The bill: the climb above the start line, hatched - out of budget, and
    // the hatch is what says so without a word.
    ctx.save();
    this._band(ctx, yPxPanel, false, () => {
      ctx.clip();
      ctx.fillStyle = mix(c.bgSurface, c.warning, 0.16);
      ctx.fillRect(BOX_X - 12, PANEL_Y - 8, BOX_W + 24, BOX_H + 18);
      ctx.strokeStyle = alpha(c.warning, 0.6);
      ctx.lineWidth = 2;
      for (let d = -BOX_H; d < BOX_W + BOX_H; d += 9) {
        ctx.beginPath();
        ctx.moveTo(BOX_X - 12 + d, PANEL_Y + BOX_H + 10);
        ctx.lineTo(BOX_X - 12 + d + BOX_H + 18, PANEL_Y - 8);
        ctx.stroke();
      }
    });
    ctx.restore();

    this._rail(ctx, c, yPxPanel, 6);
    this._nowTick(ctx, c, yPxPanel(this._yAt(this._ballX)));

    // The bill is paid against THIS line, so the line is named - below it, in
    // the clear: above the line is where a dragged point puts the hatched bill,
    // and a chip up there would cover the evidence it is naming.
    pill(ctx, c, 'start line', BOX_X + 26, yPxPanel(Y0) + 19,
      { bg: c.labelMuted, size: 13, align: 'left' });
    const t = pill(ctx, c, 'height panel', BOX_X - 6, PANEL_Y + CARD_TITLE_Y,
      { bg: mix(c.stroke, c.label, 0.45), size: 13, align: 'left' });
    if (this._hTxt) {
      ctx.font = font(c, 800, 17);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = c.accent;
      ctx.fillText(this._hTxt, t.x0 + t.w + 12, PANEL_Y + CARD_TITLE_Y);
    }
  }

  // The area between the start line and the profile, on one side of it. Sampled
  // across x rather than walked control point to control point: the learner can
  // drag any point, so where the track crosses the start line is not known in
  // advance - and joining the points directly would cut the corner of every
  // hill, showing a bill as energy in hand.
  _band(ctx, panel, below, paint) {
    const yLine = panel(Y0);
    let open = false;
    ctx.beginPath();
    for (let px = 0; px <= BOX_W; px += 2) {
      const x = (px / BOX_W) * X_MAX;
      const y = this._yAt(x);
      if (below ? y <= Y0 : y >= Y0) {
        if (!open) { ctx.moveTo(xPx(x), yLine); open = true; }
        ctx.lineTo(xPx(x), panel(y));
      } else if (open) {
        ctx.lineTo(xPx(x), yLine);
        open = false;
      }
    }
    if (open) ctx.lineTo(xPx(X_MAX), yLine);
    ctx.closePath();
    paint();
  }

  // The live height: where the ball is on the shared scale. When it comes to
  // rest at Q this tick sits exactly on the start-line rule, which is the
  // slide's sentence as a pair of pixels rather than two matching numbers.
  _nowTick(ctx, c, y) {
    const x = xPx(this._ballX);
    ctx.beginPath();
    ctx.moveTo(BOX_X - 6, y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = c.label;
    ctx.fill();
  }

  // -- the speed bar -------------------------------------------------------------
  // The slide's word for this is the speed panel, and its sentence is that it
  // "reaches nothing at all", so nothing is a state the bar can be in - a chip
  // in the reading's own slot, not just an empty rail.
  _speedBar(ctx, c) {
    const v = this._vAt(this._ballX);
    const midY = BAR_Y + BAR_H / 2;
    const lbl = pill(ctx, c, 'speed', BOX_X - 12, midY,
      { bg: mix(c.stroke, c.label, 0.45), size: 13, align: 'left' });
    // The reading is placed off the label's MEASURED right edge: two hand-typed
    // x offsets on one row is the recurring overlap bug.
    const tx = Math.max(SPD_TXT_X, lbl.x0 + lbl.w + 14);
    if (v < 0.05) {
      pill(ctx, c, 'nothing', tx, midY, { bg: c.accent, size: 14, align: 'left' });
    } else {
      ctx.font = font(c, 800, 17);
      ctx.fillStyle = c.label;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(this._vTxt || `${v.toFixed(1)} m/s`, tx, midY);
    }
    drawMeter(ctx, c, BAR_X0, BAR_Y, BAR_W, BAR_H, v / V0, {
      col: c.accent, target: 0, targetCol: mix(c.label, c.track, 0.35),
    });
    ctx.font = font(c, 600, 13);
    ctx.fillStyle = c.labelMuted;
    ctx.textAlign = 'right';
    ctx.fillText(`${V0.toFixed(1)} m/s`, BOX_X + BOX_W, midY);
    ctx.textAlign = 'left';
  }

  // -- the named marks -----------------------------------------------------------
  // O, Q and R are positions along the track, so they sit above their own x. A
  // label column on the left would break the alignment the whole scene rests on.
  _marks(ctx, c) {
    const qLit = this._stoppedAt >= this._pts[Q_I].x - 0.02;
    const items = [
      { key: 'O', col: c.accent, label: 'O' },
      { key: 'Q', col: qLit ? c.good : c.labelMuted, label: 'Q' },
      { key: 'R', col: c.warning, label: 'R' },
    ];
    for (const m of items) {
      const x = m.key === 'O' ? xPx(0) : m.key === 'Q' ? xPx(this._pts[Q_I].x) : xPx(X_MAX);
      const lift = m.key === 'Q' && qLit ? -3 : 0;
      pill(ctx, c, m.label, x, MARK_ROW + lift, { bg: m.col, size: 14, align: 'center' });
    }
    // R is a ceiling, so it is labelled as one: the dashed line alone only says
    // there is a mark up there, not that the ball can never get to it.
    pill(ctx, c, 'never reached', xPx(X_MAX) - 20, MARK_ROW,
      { bg: c.warning, size: 13, align: 'right' });
    if (qLit) {
      // A lit Q ties down to the crest the ball actually stopped on, and stops
      // short of the ball so it never draws over the evidence.
      this._leader(ctx, xPx(this._pts[Q_I].x), MARK_ROW + 24,
        yPx(this._pts[Q_I].y) - BALL_R - 12, c.good);
    }
  }

  // -- chips ---------------------------------------------------------------------
  _chips(ctx, c) {
    const stage = Math.min(this.stage, BEAT_CHIPS.length - 1);
    const cols = { accent: c.accent, good: c.good, warning: c.warning };
    const items = BEAT_CHIPS[stage].map((it) => ({ text: it.text, bg: cols[it.bg] }));
    if (!this._run && this.age > 1.2 && !items.some((it) => it.text.startsWith('Release'))) {
      // Nothing has happened yet and the beat is learner-driven: say what to
      // do - unless the beat's own chip already says it.
      items.push({ text: this._drag >= 0 ? 'dragging' : 'Release', bg: this._drag >= 0 ? c.good : c.accent });
    }
    chipRow(ctx, c, items, W / 2, 14, { align: 'center' });
  }

  // A horizontal reference line across a box. No text on it: the named marks
  // are the letters above the track, and a caption on the line itself is a
  // sentence where a mark will do.
  _rule(ctx, c, y, boxY, w, col, dashed) {
    const py = boxY + BOX_H * (1 - y / Y_TOP);
    ctx.save();
    if (dashed) ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(BOX_X - 6, py);
    ctx.lineTo(BOX_X + w + 6, py);
    ctx.strokeStyle = alpha(col, dashed ? 0.85 : 0.55);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // A thin tie from a mark down to the thing the mark names.
  _leader(ctx, x, y0, y1, col) {
    if (y1 <= y0) return;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.strokeStyle = alpha(col, 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
