// FreeFallLedgerScene - one file, two mounts: the beat-less predict-setup state
// (stage 4) and the four beats of the explain slide (stages 0-3). Nothing crosses
// the mounts; every enter() rebuilds from the stage table.
//
// The one true reading: u = fraction of the height fallen. HEIGHT = 1 - u, MOTION = u,
// TOTAL = 1 always - one total split in two, drawn as one column of three bars.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, drawBackdrop, drawFloor, drawVignette, drawCard, drawMeter, drawShadow,
  pill, chipRow, font, alpha, mix, lighten, darken, luma, rr, stadium,
} from 'simulations/base/kit/SimLook.js';

// The drop, drawn to one scale. g and the mass change nothing here, so neither
// is ever a dial; the model's own numbers are in the design note.
const H0 = 2.0;             // m, the height dropped from (OUTLINE.md s02)
const GROUND_Y = 388;       // the floor line, h = 0
const Y_TOP = 132;          // ball centre at h = H0, resting on the ledge
const LANE_X = 238;
const BALL_R = 19;
// The ball rests ON the ground at the end, not in it: its centre stops a radius
// short of the floor line, and the height scale is read off the centre.
const REST_Y = GROUND_Y - BALL_R;
const PXM = (REST_Y - Y_TOP) / H0;
const MASS = 2.0;           // kg, the fixed tag on the ball
const RUN_S = 2.0;          // drawn fall time (a real 2 m drop is 0.63 s)

// The measured column the ball falls inside - the drop needs a scale, and a hero
// needs something to be in front of. Its right edge (308) stops short of the
// (h - h') span at 318, so that span stands free of the column as well as of
// the ledger card at 388.
const COL = { x: 186, y: 92, w: 122, h: 296 };
const LEVEL = { x0: 198, x1: 294 };
// The three marks of Fig. 7.19, and the spans that go with them (stage 2 only).
// fell's label ends around x 378, ten clear of the ledger card.
const SPAN = { h: 76, hp: 124, fell: 318 };
const TAG_X = 170;
const TAG_Y = 112;           // the mass tag's fixed home, above the slab
const A_TOP = Y_TOP, C_GND = GROUND_Y;

// The ledger card on the right.
const CARD = { x: 388, y: 100, w: 276, h: 224 };
const BAR = { x: 480, w: 168, h: 24, total: 166, height: 232, motion: 298 };
const GHOST_Y = 126;        // the TOTAL bar's own width, empty, above it
const DIV_Y = [193, 259];

// Beat 1's two step tracks, along the floor and clear of the note line.
const TCARD = { x: 96, y: 392, w: 488, h: 106 };
const TRACKS = [
  { id: 'dist', label: 'distance fallen', x0: 136, x1: 336 },
  { id: 'time', label: 'time so far', x0: 376, x1: 576 },
];
const T_BAND = { y: 444, h: 18 };

// Beat counts: 4 on the explain slide, 0 on the predict mount.
const MAP_S03 = [
  [{ idx: 0, dwellMs: null }],   // the verdict: parked on the mark, bars equal
  [{ idx: 1, dwellMs: null }],   // distance and time out of step
  [{ idx: 2, dwellMs: null }],   // A, B, C and the two spans
  [{ idx: 3, dwellMs: null }],   // the posted fall, TOTAL unmoved
];
const MAP_ASK = [
  [{ idx: 4, dwellMs: null }],   // the question state: nothing runs, nothing resolves
];
const S_HALF = 0, S_STEPS = 1, S_MARKS = 2, S_TOTAL = 3, S_ASK = 4;

const STOP_MIN = 0.2, STOP_MAX = H0, STOP_STEP = 0.1, STOP_DEF = H0 / 2;
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const snap = (v, step) => Math.round(v / step) * step;

// The pointer hooks normally get {x, y}; the headless driver passes a bare
// [x, y] pair. One read, so both work.
const xy = (p) => (p.x === undefined ? { x: p[0], y: p[1] } : p);

export class FreeFallLedgerScene extends SimScene {
  static BEAT_MAPS = { 4: MAP_S03, 0: MAP_ASK };
  static BEAT_STEP_MAP = MAP_S03;
  static NOTE_STAGE = 0;
  static NOTE_TITLE = 'NOTE';
  static ARIA_LABEL = 'A ball held at a ledge falls straight down past three marked heights. Beside it a panel carries three bars: HEIGHT empties as MOTION fills, and a third bar above them, TOTAL, is always the same full width. Two tracks along the floor compare distance fallen with time so far, each with its own half mark.';
  static CONTROLS = [
    { type: 'button', id: 'release', label: 'Release' },
    { type: 'slider', id: 'stop', label: 'Stop at height', min: STOP_MIN, max: STOP_MAX, step: STOP_STEP, value: STOP_DEF, suffix: ' m' },
  ];

  constructor(container, config) {
    super(container, config);
    this._stop = STOP_DEF;         // metres, the ask mount's question instant
    this._u = 0.5;                 // fraction of the height fallen
    this._run = null;
    this._drag = false;
    this._mountName = '';
  }

  // One line, and it names only what the panel leaves out.
  noteRows() {
    return [{ text: 'no air: mass changes nothing - the fall is drawn slower than a real one' }];
  }

  // The host only tells the scene its beat count, so the mount is read from
  // there - in update() and draw() as well, because a cold mount opens on stage 0
  // and SimScene calls enter() only when the stage changes.
  _mount() {
    const name = this.beatCount === 0 ? 'ask' : 's03';
    if (name !== this._mountName) {
      this._mountName = name;
      // The stage is already current here, so the resting height is this stage's,
      // not stage 0's - the beat-3 mount has to open posted at the ground.
      this._u = this._restU();
      this._run = null;
      this.requestUiUpdate?.();
    }
    return name;
  }

  _isAsk() { return this._mountName === 'ask'; }

  // Where the ball waits on this stage: on the mark, except on the beat that
  // ends on the ground and posts the finished fall cold.
  _restU() {
    if (this._isAsk()) return this._stop / H0;
    return this.stage === S_TOTAL ? 1 : 0.5;
  }

  enter() {
    // The mount has to be known here, not on the next frame: a cold explain mount
    // is still sitting on the setup mount's stage when enter() first runs.
    this._mount();
    this._run = null;
    this._drag = false;
    this._u = this._restU();
    // Beat 1's argument is already in the still frame - the two cursors parked at
    // different places on two equal tracks - so it is learner-driven and nothing
    // runs until Release is pressed.
    this.requestUiUpdate?.();
  }

  // -- controls ---------------------------------------------------------------

  isControlHidden(id) {
    // The question mount never runs, so Release is not on its bar; the explain
    // beats hold their own heights, so the stop dial is not on theirs.
    if (id === 'release') return this._isAsk();
    if (id === 'stop') return !this._isAsk();
    return false;
  }

  isControlDisabled() { return !!this._run; }

  getControlValue(id) { return id === 'stop' ? this._stop : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'release') this._press();
    else if (id === 'stop') this._setStop(Number(v));
    this.requestUiUpdate?.();
  }

  // -- input ------------------------------------------------------------------

  // u is the fraction of the height already fallen, so u = 0 is the ledge and
  // u = 1 is the ground. Getting this backwards puts the ball on the ledge at the
  // bottom of the fall, which the bars would still read correctly. The run ends
  // on REST_Y, a radius above the floor, so the ball rests on the ground rather
  // than sinking into it.
  _ballY() { return Y_TOP + this._u * (REST_Y - Y_TOP); }

  _onBall(p) { return Math.hypot(p.x - LANE_X, p.y - this._ballY()) < BALL_R + 16; }

  _press() {
    if (this._isAsk() || this._run) return;
    this._u = 0;
    this._run = { stage: this.stage, t: 0 };
    this.animateFor(RUN_S * 1000 + 400);
    this.requestUiUpdate?.();
  }

  _setStop(m) {
    const v = Number(m);
    if (!Number.isFinite(v)) return;
    const next = clamp(snap(v, STOP_STEP), STOP_MIN, STOP_MAX);
    if (Math.abs(next - this._stop) < 1e-6) return;
    this._stop = next;
    this._u = this._stop / H0;
    this.animateFor(300);
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    p = xy(p);
    if (this._run) return;
    this.animateFor(400);
    if (this._isAsk()) {
      if (this._onBall(p)) this._drag = true;
      return;
    }
    // Release is the button on a wide screen; the ball and the ledge are the
    // same action under a thumb.
    if (this._onBall(p) || (p.x > 150 && p.x < 290 && p.y > Y_TOP && p.y < Y_TOP + 34)) this._press();
  }

  pointerMove(p) {
    if (!this._drag) return false;
    p = xy(p);
    this._setStop((GROUND_Y - p.y) / PXM);
    this.animateFor(300);
    return true;
  }

  pointerUp() { this._drag = false; }

  // -- model ------------------------------------------------------------------

  update(d) {
    this._mount();
    const run = this._run;
    if (!run) return;
    run.t += d;
    // u = (t/RUN_S)^2: the ball really accelerates, and the bars are read straight
    // off its position, so "MOTION is exactly half of TOTAL" is never a rounding.
    const f = Math.min(1, run.t / RUN_S);
    this._u = f * f;
    if (f >= 1) this._land(run);
  }

  // Runs are credited to the stage that launched them, never to whatever stage
  // is current when they finish.
  _land(run) {
    this._run = null;
    this._u = 1;
    if (run.stage === S_TOTAL) {
      // The beat whose content is that the bar did not move: the burst goes on
      // the bar, never on the ball or the marks.
      this.celebrate(BAR.x + BAR.w / 2, BAR.total, 26);
    }
    this.animateFor(300);
    this.requestUiUpdate?.();
  }

  busy() { return !!this._run || this._drag; }

  // -- drawing ----------------------------------------------------------------

  draw(ctx, c) {
    this._mount();
    drawBackdrop(ctx, c, 'dots');
    drawCard(ctx, c, COL.x, COL.y, COL.w, COL.h, 1);
    this._ledge(ctx, c);
    this._levels(ctx, c);
    this._ground(ctx, c);
    if (!this._isAsk() && this.stage === S_MARKS) this._spans(ctx, c);
    this._ball(ctx, c);
    if (!this._isAsk() && this.stage === S_STEPS) this._stepTracks(ctx, c);
    this._ledger(ctx, c);
    drawVignette(ctx, c);
    this._chips(ctx, c);
  }

  // A slab at the top of the drop on a wall bracket, so the ball is released
  // from something real rather than from mid-air. The bracket is a filled
  // gusset, not a pair of strokes: a stroked pair read as a floating staple
  // with nothing behind it.
  _ledge(ctx, c) {
    const y = Y_TOP + BALL_R;
    const wall = mix(c.bgSurface, c.label, 0.34);
    const wallLo = darken(wall, 0.22);
    ctx.save();
    // the gusset under the slab, and the short post it hangs from
    ctx.fillStyle = wallLo;
    ctx.beginPath();
    ctx.moveTo(152, y + 15);
    ctx.lineTo(206, y + 15);
    ctx.lineTo(152, y + 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = wall;
    rr(ctx, 143, y + 60, 16, 44, 4);
    ctx.fill();
    // the slab: a darker cushion with a lit top edge. It stops short of the
    // (h - h') span at 318, so the red span never looks like it grows out of
    // the ledge.
    ctx.fillStyle = darken(wall, 0.10);
    rr(ctx, 140, y, 158, 17, 5);
    ctx.fill();
    ctx.fillStyle = lighten(wall, 0.34);
    ctx.fillRect(145, y + 1, 148, 5);
    // its shadow on the wall face behind it
    ctx.fillStyle = alpha(c.bgDeep, 0.30);
    ctx.fillRect(150, y + 17, 148, 9);
    ctx.restore();
  }

  // Four faint level lines: the drop has a scale, and the 1.0 m one is brighter
  // because it is the mark the whole scene is about. They run from the card's
  // left edge to a scale bar on the right, so the column reads as measured
  // rather than as a panel the ball happens to be inside.
  _levels(ctx, c) {
    ctx.save();
    ctx.lineCap = 'round';
    // the ruler the four lines are cut into
    ctx.strokeStyle = alpha(c.labelMuted, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LEVEL.x1, Y_TOP - 8);
    ctx.lineTo(LEVEL.x1, REST_Y + 8);
    ctx.stroke();
    for (const m of [0.5, 1.0, 1.5, 2.0]) {
      const y = REST_Y - m * PXM;
      const half = m === 1.0;
      // a tick on the ruler at every 0.25 m, longer on the metre marks
      const whole = Number.isInteger(m);
      ctx.strokeStyle = whole ? alpha(c.labelMuted, 0.7) : alpha(c.labelMuted, 0.35);
      ctx.lineWidth = whole ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(LEVEL.x1, y);
      ctx.lineTo(LEVEL.x1 + (whole ? 9 : 5), y);
      ctx.stroke();
      ctx.strokeStyle = half ? alpha(c.accent, 0.85) : alpha(c.labelMuted, 0.3);
      ctx.lineWidth = half ? 3 : 1.5;
      if (half) ctx.setLineDash([10, 6]); else ctx.setLineDash([3, 8]);
      ctx.beginPath();
      ctx.moveTo(LEVEL.x0, y);
      ctx.lineTo(LEVEL.x1 - 2, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (half) {
        // the mark the whole scene is about, so it gets its own end cap on the
        // ruler. No number: the slide's answer is read off the bar widths, and a
        // "1 m" here would hand it over.
        ctx.fillStyle = c.accent;
        ctx.beginPath();
        ctx.arc(LEVEL.x1 + 4, y, 3.6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _ground(ctx, c) {
    // The dashed fall path, drawn under the ball so the ball reads on top of it.
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.5);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 9]);
    ctx.beginPath();
    ctx.moveTo(LANE_X, Y_TOP + BALL_R + 2);
    ctx.lineTo(LANE_X, REST_Y);
    ctx.stroke();
    ctx.restore();
    drawFloor(ctx, c, GROUND_Y, { seams: true });
    // the closing shadow: it grows as the ball nears, so the last stretch reads
    const y = this._ballY();
    const near = 1 - clamp((y - Y_TOP) / (REST_Y - Y_TOP), 0, 1);
    drawShadow(ctx, c, LANE_X, GROUND_Y + 6, 9 + 12 * near, (9 + 12 * near) * 0.2, 0.35 + 0.4 * near);
  }

  // The three dimension marks of Fig. 7.19: h (whole), h' (what is left of it)
  // and (h - h') (fallen), each its own span in the source's own three colours.
  _spans(ctx, c) {
    const yTop = A_TOP, yNow = this._ballY(), yGnd = C_GND;
    this._span(ctx, c, SPAN.h, yGnd, yTop, c.label, 'h');
    this._span(ctx, c, SPAN.hp, yGnd, yNow, c.s3, "h'");
    this._span(ctx, c, SPAN.fell, yNow, yTop, c.s6, '(h - h\')', 'right');
    this._tag(ctx, c, TAG_X, yTop, 'A', c.s1);
    this._tag(ctx, c, TAG_X, yNow, 'B', c.s2);
    this._tag(ctx, c, TAG_X, yGnd, 'C', c.s6);
  }

  // A span is a bar with end caps and its label beside it, never across it.
  _span(ctx, c, x, y0, y1, col, label, side = 'left') {
    if (Math.abs(y1 - y0) < 6) return;
    ctx.save();
    ctx.fillStyle = col;
    ctx.fillRect(x - 2.5, y0, 5, y1 - y0);
    ctx.fillRect(x - 7, y0 - 2.5, 14, 5);
    ctx.fillRect(x - 7, y1 - 2.5, 14, 5);
    ctx.font = font(c, 800, 13);
    ctx.fillStyle = col;
    ctx.textBaseline = 'middle';
    const my = (y0 + y1) / 2;
    if (side === 'left') { ctx.textAlign = 'right'; ctx.fillText(label, x - 12, my); }
    else { ctx.textAlign = 'left'; ctx.fillText(label, x + 12, my); }
    ctx.restore();
  }

  _tag(ctx, c, x, y, letter, col) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, TAU);
    ctx.fillStyle = c.bgSurface;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = col;
    ctx.stroke();
    ctx.font = font(c, 800, 13);
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x, y + 0.5);
    ctx.restore();
  }

  _ball(ctx, c) {
    const x = LANE_X, y = this._ballY();
    const moving = !!this._run;
    ctx.save();
    if (moving) {
      // a short tail, so the acceleration is visible in the ball as well
      const tail = 10 + 26 * Math.sqrt(this._u);
      const grd = ctx.createLinearGradient(x, y - tail, x, y);
      grd.addColorStop(0, alpha(c.s2, 0));
      grd.addColorStop(1, alpha(c.s2, 0.5));
      ctx.fillStyle = grd;
      rr(ctx, x - 5, y - tail, 10, tail, 5);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, TAU);
    ctx.fillStyle = c.s2;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = darken(c.s2, 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 6, y - 7, 5, 0, TAU);
    ctx.fillStyle = alpha(lighten(c.s2, 0.55), 0.75);
    ctx.fill();
    // A face, because the ball is the hero and it is the thing the slide is
    // about. It watches its own drop: the eyes go wide and the mouth opens as
    // it falls, which is the acceleration read on the ball itself.
    const eyeY = y - 2;
    const wide = moving ? 1 : 0;
    for (const sx of [-1, 1]) {
      const ex = x + sx * 6.5;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 3.2 + 1.6 * wide, 3.6 + 2.2 * wide, 0, 0, TAU);
      ctx.fillStyle = c.bgSurface;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + sx * 0.6, eyeY + 0.8, 1.5 + 0.7 * wide, 0, TAU);
      ctx.fillStyle = darken(c.s2, 0.62);
      ctx.fill();
    }
    ctx.beginPath();
    if (moving) {
      ctx.ellipse(x, y + 9, 3.4, 4.2, 0, 0, TAU);
    } else {
      ctx.arc(x, y + 5.5, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    }
    ctx.strokeStyle = darken(c.s2, 0.62);
    ctx.lineWidth = 2;
    ctx.stroke();
    // the pull of the Earth, the only thing acting on this ball
    const ax = x + BALL_R + 10;
    ctx.strokeStyle = alpha(c.labelMuted, 0.9);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, y - 30);
    ctx.lineTo(ax, y + 2);
    ctx.moveTo(ax - 6, y - 4);
    ctx.lineTo(ax, y + 3);
    ctx.lineTo(ax + 6, y - 4);
    ctx.stroke();
    ctx.font = font(c, 700, 12);
    ctx.fillStyle = c.labelMuted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('mg', ax + 12, y - 22);
    ctx.restore();
    // The mass tag has a fixed home in the empty band at the head of the column,
    // above the slab. It used to ride up-left of the ball, which put it on the
    // bracket at the top of a fall and beside the B tag on beat 2.
    pill(ctx, c, `m = ${MASS.toFixed(1)} kg`, LANE_X, TAG_Y, {
      align: 'center', bg: c.bgSurface, ink: inkOn(c, c.bgSurface), size: 13,
    });
  }

  // Beat 1: two equal tracks, each with its own dashed half guide, so the two
  // processes can be seen out of step. No number is printed on either.
  _stepTracks(ctx, c) {
    drawCard(ctx, c, TCARD.x, TCARD.y, TCARD.w, TCARD.h, 1, { accent: c.accent });
    pill(ctx, c, 'the half mark', TCARD.x + 16, TCARD.y + 18, {
      align: 'left', bg: c.accent, ink: inkOn(c, c.accent), size: 13,
    });
    const u = this._u;
    const parked = { dist: 0.5, time: Math.SQRT1_2 };
    const now = { dist: u, time: Math.sqrt(u) };
    // One bracket under both tracks: this is where each stood when the ball was
    // on the mark, and the two are not in the same column. It goes below the
    // band, not above it - above, it struck straight through both track labels.
    const g0 = TRACKS[0], g1 = TRACKS[1];
    const bx0 = g0.x0 + (g1.x1 - g0.x0) * parked.dist;
    const bx1 = g1.x0 + (g1.x1 - g1.x0) * parked.time;
    const by = T_BAND.y + T_BAND.h + 10;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.6);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(bx0, by);
    ctx.lineTo(bx1, by);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(bx0, by - 6);
    ctx.lineTo(bx0, by + 6);
    ctx.moveTo(bx1, by - 6);
    ctx.lineTo(bx1, by + 6);
    ctx.stroke();
    ctx.font = font(c, 700, 12);
    ctx.fillStyle = alpha(c.label, 0.75);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('one moment, two places', (bx0 + bx1) / 2, by + 15);
    ctx.restore();
    for (const t of TRACKS) {
      const at = now[t.id];
      const w = t.x1 - t.x0;
      ctx.save();
      ctx.font = font(c, 800, 13);
      ctx.fillStyle = c.labelMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.label, t.x0, TCARD.y + 44);
      ctx.restore();
      // the track
      stadium(ctx, t.x0, T_BAND.y, w, T_BAND.h);
      ctx.fillStyle = c.track;
      ctx.fill();
      // how far along it is
      if (at > 0.001) {
        stadium(ctx, t.x0, T_BAND.y, Math.max(T_BAND.h, w * at), T_BAND.h);
        ctx.fillStyle = mix(c.accent, c.bgDeep, 0.25);
        ctx.fill();
      }
      // its own half guide, and on the distance track the quarter it passes at
      // half the time - the quarter the slide says most people reach for
      const marks = t.id === 'dist' ? [0.25, 0.5] : [0.5];
      for (const m of marks) {
        const mx = t.x0 + w * m;
        ctx.save();
        ctx.strokeStyle = m === 0.5 ? alpha(c.label, 0.75) : alpha(c.labelMuted, 0.7);
        ctx.lineWidth = m === 0.5 ? 2 : 1.5;
        if (m === 0.5) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mx, T_BAND.y - 5);
        ctx.lineTo(mx, T_BAND.y + T_BAND.h + 5);
        ctx.stroke();
        ctx.restore();
      }
      // where this track stood when the ball was on the mark: the comparison the
      // beat is about stays on screen after a fall has ended
      const gx = t.x0 + w * parked[t.id];
      ctx.save();
      ctx.beginPath();
      ctx.arc(gx, T_BAND.y + T_BAND.h / 2, 8.5, 0, TAU);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = alpha(c.label, 0.75);
      ctx.stroke();
      ctx.restore();
      // the live cursor
      const cx = t.x0 + w * at;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, T_BAND.y + T_BAND.h / 2, 5.5, 0, TAU);
      ctx.fillStyle = c.accent;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = c.bgSurface;
      ctx.stroke();
      ctx.restore();
    }
  }

  // The ledger: one total split into two named parts. TOTAL is always full, and
  // above it an empty outline of exactly its own width.
  _ledger(ctx, c) {
    drawCard(ctx, c, CARD.x, CARD.y, CARD.w, CARD.h, 1);
    if (!this._isAsk()) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = alpha(c.labelMuted, 0.8);
      rr(ctx, BAR.x, GHOST_Y - BAR.h / 2, BAR.w, BAR.h, BAR.h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = font(c, 700, 12);
      ctx.fillStyle = c.labelMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('at the top', BAR.x + BAR.w / 2, GHOST_Y);
      ctx.restore();
    }
    for (const y of DIV_Y) {
      ctx.fillStyle = alpha(c.labelMuted, 0.22);
      ctx.fillRect(CARD.x + 18, y, CARD.w - 36, 1);
    }
    const u = this._u;
    this._row(ctx, c, 'TOTAL', BAR.total, 1, c.s5);
    this._row(ctx, c, 'HEIGHT', BAR.height, 1 - u, c.s3);
    this._row(ctx, c, 'MOTION', BAR.motion, u, c.s6);
  }

  _row(ctx, c, label, cy, frac, col) {
    ctx.save();
    ctx.font = font(c, 800, 14);
    ctx.fillStyle = c.label;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, CARD.x + 16, cy);
    ctx.restore();
    drawMeter(ctx, c, BAR.x, cy - BAR.h / 2, BAR.w, BAR.h, frac, { col });
  }

  _chips(ctx, c) {
    const ask = this._isAsk();
    const items = [];
    // A state that means nothing yet wears the surface colour: a filled chip would
    // put a colour on the panel that the state does not have.
    let text = 'held on the mark', bg = c.bgSurface;
    if (ask) text = 'nothing has fallen yet';
    else if (this._run) { text = 'falling'; bg = c.warning; }
    else if (this.stage === S_TOTAL) { text = 'total unchanged'; bg = c.good; }
    items.push({ text, bg, ink: bg === c.bgSurface ? inkOn(c, bg) : c.bgDeep });
    // A learner-driven beat says so: nothing has happened until they act.
    // pill()'s own ink (bgDeep) is the one that measures on an accent fill in both
    // themes; picking by contrast here chose the dark-theme winner in both.
    if (ask) items.push({ text: 'drag the ball', bg: c.accent, ink: c.bgDeep, pulse: true });
    else if (!this._run) items.push({ text: 'press Release', bg: c.accent, ink: c.bgDeep, pulse: true });
    chipRow(ctx, c, items, W / 2, 30, { align: 'center', gap: 10 });
  }
}

// A chip's ink, chosen by measured contrast against its own fill.
function inkOn(c, col) {
  return contrast(c.label, col) >= contrast(c.bgDeep, col) ? c.label : c.bgDeep;
}
function contrast(a, b) {
  const [hi, lo] = luma(a) > luma(b) ? [luma(a), luma(b)] : [luma(b), luma(a)];
  return (hi + 0.05) / (lo + 0.05);
}
