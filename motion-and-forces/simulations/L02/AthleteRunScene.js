/**
 * AthleteRunScene - slide "One run on a straight track" (blk-l02-s1, 2 beats; Fig 4.4).
 * The athlete on a straight 0..100 m track: O at 0 m, B at 40 m, A at 100 m.
 * Book run: O (t = 0 s) -> B (t = 4 s) -> A (t = 10 s) -> back to B (t = 16 s).
 * Every leg is 10 m/s, so x(t) = 10 t out and x(t) = 100 - 10 (t - 10) back.
 * Playback is compressed (PACE screen s per book s); the stopwatch shows the book's t.
 * b0: she runs O to A; time tags drop at O, B and A as she passes. Rests at A.
 * b1: she turns at A (faces left) and runs back to B; tag "t = 16 s" at B. Rests at B.
 *
 * Reuse (L01 InstantIntervalScene, L01 RestAndMotionScene, L03 AverageSpeedScene and
 * the L02 thin files import this class). All drawing lives in these methods:
 *   spec()                               the track spec (0..100 m, x 60..620, y TRACK_Y)
 *   drawTrack(ctx, c, { every, signs, letters, ticks })  track + ruler + painted start lines
 *                                        with letters on the near lane (letters: ['B', 'A'])
 *   drawAthlete(ctx, c, m, { facing, dist, moving, alpha })  she stands or runs at metre m
 *   timeTag(ctx, c, m, text, row, pop)   a time tag under the ruler (row 0 or 1), pop from popAt
 *   drawClock(ctx, c, t)                 the stopwatch at the top centre showing book time t
 *   drawRibbon(ctx, c, { end, d, alpha }) the path ribbon (distance): out lane O->A at
 *                                        RIB_OUT, a turn at A, back lane A->end at RIB_BACK;
 *                                        d = metres traced so far. No arrows (no direction).
 *   ribbonLabel(ctx, c, text, x, y, pop) a label in the ribbon's ink
 *   sArrow(ctx, c, m, label, o)          the dashed displacement arrow from O to metre m
 *   runAt(tBook)                         { m, facing, dist } of the book run at book time t
 *   say(ctx, c, text, x, y, o)           haloed text with the kit font
 * Subclasses set static MODE ('run' | 'distance' | 'displacement' | 'roundtrip'); layout constants in static L.
 * ASCII only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, darken, lighten, font, pill, chipSize, popAt } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawAthlete, LOOKS } from '../shared/MotionCast.js';

const TRACK_Y = 330;          // track centre line
const LANE = 12;              // she runs in the far lane, this far above the centre
const FIG_H = 130;
const RIB_OUT = 104, RIB_BACK = 66, RIB_W = 18;
const ARROW_Y = 164;          // displacement arrow row (above her head)
const TAG_Y = [446, 490];     // time tag rows under the ruler
const PACE = 0.3;             // screen s per book s
const GO = 0.6;               // s of stillness before anything moves
const V = 10;                 // m/s on every leg

export class AthleteRunScene extends SimScene {
  static MODE = 'run';
  /** Layout and pace shared with the thin files and later reusers. */
  static L = { TRACK_Y, LANE, FIG_H, RIB_OUT, RIB_BACK, RIB_W, ARROW_Y, TAG_Y, PACE, GO, V };
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'An athlete runs on a straight track marked from O at 0 m to 100 m. She starts at O at t = 0 s, passes B at 40 m at t = 4 s and reaches A at 100 m at t = 10 s. Then she turns and runs back along the same track to stop at B at t = 16 s.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < this.playS() + 0.6; }
  playS() { return GO + (this.cur === 1 ? 6 : 10) * PACE; }

  spec() { return trackSpec({ from: 0, to: 100, x0: 60, x1: 620, y: TRACK_Y }); }

  /** Book time since the beat's run began, clamped to the leg (b0: 0..10, b1: 10..16). */
  bookT() {
    const u = Math.max(0, this.age - GO) / PACE;
    return this.cur === 1 ? Math.min(16, 10 + u) : Math.min(10, u);
  }

  /** Position, facing and metres run of the book run at book time t. */
  runAt(t) {
    if (t <= 10) return { m: V * t, facing: 1, dist: V * t };
    const back = Math.min(t, 16) - 10;
    return { m: 100 - V * back, facing: -1, dist: 100 + V * back };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this.drawRun(ctx, c);
  }

  drawRun(ctx, c) {
    const t = this.bookT(), p = this.runAt(t), moving = this.age > GO && this.age < this.playS();
    this.drawTrack(ctx, c, { letters: ['B', 'A'] });
    const tags = [[0, 0, 't = 0 s'], [40, 4, 't = 4 s'], [100, 10, 't = 10 s']];
    for (const [m, at, text] of tags) {
      const pop = this.cur === 1 ? undefined : popAt(this.age, GO + at * PACE);
      if (pop !== null) this.timeTag(ctx, c, m, text, 0, pop);
    }
    if (this.cur === 1) { const pop = popAt(this.age, GO + 6 * PACE); if (pop) this.timeTag(ctx, c, 40, 't = 16 s', 1, pop); }
    this.drawClock(ctx, c, t);
    // b1 starts at A already turned to face back.
    this.drawAthlete(ctx, c, p.m, { facing: this.cur === 1 ? -1 : p.facing, dist: p.dist, moving });
  }

  // -- parts -----------------------------------------------------------------

  drawTrack(ctx, c, o = {}) {
    const spec = this.spec();
    const tr = drawTrack(ctx, c, spec, { kind: 'track', lanes: 2, every: o.every ?? 10, signs: !!o.signs, ticks: o.ticks });
    // Painted start lines across the track at O and each lettered point; the letter on the near lane.
    const marks = [{ m: 0 }, ...(o.letters ?? []).map((L) => ({ m: L === 'B' ? 40 : 100, L }))];
    const top = TRACK_Y - 25, paint = lighten(c.bgSurface, 0.6);
    ctx.save();
    for (const k of marks) {
      const x = spec.toPx(k.m);
      ctx.fillStyle = alpha(paint, 0.92); ctx.fillRect(x - 2, top + 2, 4, 46);
      if (k.L) {
        // A marker plate on the near lane, beside the line: pale plate, dark rim, the letter in label ink.
        const px = k.m >= 100 ? x - 24 : x + 24, py = TRACK_Y + 12, s = 15;
        ctx.fillStyle = alpha(c.label, 0.35); ctx.beginPath(); ctx.roundRect(px - s, py - s + 3, 2 * s, 2 * s, 6); ctx.fill();
        ctx.fillStyle = c.bgSurface; ctx.beginPath(); ctx.roundRect(px - s, py - s, 2 * s, 2 * s, 6); ctx.fill();
        ctx.strokeStyle = darken(c.s8, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = c.label; ctx.fillText(k.L, px, py + 1);
      }
    }
    ctx.restore();
    return tr;
  }

  drawAthlete(ctx, c, m, o = {}) {
    const spec = this.spec(), lane = { ...spec, y: TRACK_Y - LANE };
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    let sk;
    if (o.moving) sk = drawAthlete(ctx, c, lane, { m, dist: o.dist ?? m, height: FIG_H, facing: o.facing ?? 1 });
    else sk = drawFigure(ctx, c, { x: spec.toPx(m), y: TRACK_Y - LANE, height: FIG_H, build: 'teen', facing: o.facing ?? 1, pose: 'stand' }, figureLook(c, LOOKS.athlete));
    ctx.restore();
    return sk;
  }

  timeTag(ctx, c, m, text, row = 0, pop) {
    const x = this.spec().toPx(m), w = chipSize(ctx, c, text, 26, true).w;
    const cx = Math.max(8 + w / 2, Math.min(672 - w / 2, x));
    pill(ctx, c, text, cx, TAG_Y[row], { size: 26, bg: c.s5, display: true, scale: pop?.scale ?? 1, alpha: pop?.alpha ?? 1 });
  }

  drawClock(ctx, c, t) {
    drawStopwatch(ctx, c, { x: 340, y: 116, r: 66, seconds: t, dialSeconds: 20, text: Math.round(t) + ' s', readout: 'inside' });
  }

  /** Path ribbon: out lane O->A, a half turn at A, back lane A->end; d metres traced. */
  drawRibbon(ctx, c, o = {}) {
    const spec = this.spec(), end = o.end ?? 40, d = o.d ?? 200, xA = spec.toPx(100), r = (RIB_OUT - RIB_BACK) / 2;
    const col = c.s7;
    const path = (g) => {
      g.beginPath();
      g.moveTo(spec.toPx(0), RIB_OUT);
      g.lineTo(spec.toPx(Math.min(d, 100)), RIB_OUT);
      if (d > 100) {
        g.arc(xA, RIB_BACK + r, r, Math.PI / 2, -Math.PI / 2, true);
        g.lineTo(spec.toPx(Math.max(end, 100 - (d - 100))), RIB_BACK);
      }
    };
    if (d <= 0) return;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(0, 3); path(ctx); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = RIB_W + 4; ctx.stroke(); ctx.restore();   // lip
    path(ctx); ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = RIB_W + 4; ctx.stroke();      // rim
    path(ctx); ctx.strokeStyle = col; ctx.lineWidth = RIB_W; ctx.stroke();                         // body
    ctx.save(); ctx.translate(0, 4); path(ctx); ctx.strokeStyle = alpha(darken(col, 0.2), 0.8); ctx.lineWidth = 6; ctx.stroke(); ctx.restore();   // shade side
    ctx.save(); ctx.translate(0, -4); path(ctx); ctx.strokeStyle = alpha(lighten(col, 0.5), 0.75); ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); // light side
    ctx.restore();
  }

  ribbonLabel(ctx, c, text, x, y, pop, o = {}) {
    if (pop === null) return;
    const s = pop?.scale ?? 1;
    this.say(ctx, c, text, x, y, { col: c.s7ink, size: Math.round((o.size ?? 26) * Math.max(0.3, s)), alpha: pop?.alpha ?? 1, align: o.align });
  }

  sArrow(ctx, c, m, label, o = {}) {
    const spec = this.spec(), len = spec.toPx(m) - spec.toPx(0);
    return drawMotionArrow(ctx, c, 's', spec.toPx(0), o.y ?? ARROW_Y, { length: Math.abs(len) < 1 ? 0 : Math.abs(len), angle: len < 0 ? Math.PI : 0,
      label, side: 1, at: o.at ?? 0.5, width: 7, head: 20, size: o.size ?? 28 });
  }

  say(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, o.weight ?? 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(c.bgSurface, 0.9); ctx.lineWidth = 7; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
