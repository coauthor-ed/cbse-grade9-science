// MediumPathScene.js - L02. Three mounts (5 / 4 / 3 beats) of one idea: a shove is handed along
// a line of dots and the medium is left exactly where it was.
//   5 beats (s03) air / wooden desk / water / every direction at once   (dial: medium)
//   4 beats (s04) cups and string, taut and slack, then rail and water   (dial: string)
//   3 beats (s07) a tuning fork at one end of a room and an ear at the other
//
// The rule this scene exists to keep: every dot returns to its own starting place. A dot's offset
// is a pure function of the run clock (sin^2 of its phase under the front), so nothing can be
// left out of place and no state can drift. No arrow, dashed line, blob, arc, ripple, draught or
// mote ever crosses a span: the dot chain is the whole of the crossing, and the marker lighting is
// the arrival.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, alpha, chipRow, drawBackdrop, drawBench, drawCard, drawFloor, drawShadow,
  drawVignette, lighten, mix, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';

// ---- panel geometry (design px) --------------------------------------------------------------
const CARD = { x: 26, y: 96, w: 628, h: 340 };
const FLOOR = 412;
const FIG_H = 148;                        // >= 90, so the face reads
const SPAN_Y = 280;                       // the line the shove runs along, at ear height
const SPAN_X0 = 176, SPAN_X1 = 516;       // the tapper's object -> just short of the ear
const EAR_X = 540;

const SPEED = 175;                        // px/s, ONE rate for every medium (no comparison)
const PULSE_W = 96;                       // spatial width of the disturbance, px
const LEG = 2.6;                          // length of one leg, s
const LIGHT = 0.45;                       // how long the marker stays lit once the shove arrives, s
const GAP = 0.7;                          // gap between the two legs on s04 beat 3
const STRIKE = 0.34;                      // how long the tapper's own strike animation runs, s
const WOBBLE_T = 1.6;                     // how long a slack string keeps wobbling, s
const AMP = { air: 10, desk: 3.4, water: 3.9, string: 6, rail: 6 };  // px, each to its own pitch

// Dot grids: the pitch is fixed for the whole run. Spacing is never changed by the model, only
// each dot's own x - so a medium can never look depleted, thinned or displaced.
// pitch per medium, and a column count derived from the width actually drawn, so a short
// stretch of air keeps the same pitch as a long one instead of collapsing into bars
const GRID = {
  air: { pitch: 22.7, rows: 12, dy: 19, r: 3.6 },
  airS: { pitch: 22.7, rows: 6, dy: 19, r: 3.6 },
  desk: { pitch: 12, rows: 13, dy: 11.4, r: 4.4 },
  water: { pitch: 13, rows: 13, dy: 13, r: 5 },
};
// Every s03 beat names the medium its own prose describes, including beat 4 (the radial-tick
// beat), so the panel is identical however the learner arrived at it; the select stays live, so
// all three are still choosable on that beat.
const MEDIA_BY_STAGE = ['air', 'air', 'desk', 'water', 'air'];

// Both vessels start at the left of the span (where the tapper's hand can actually reach) and
// their tops sit at hand height, so the struck object touches the medium it is striking.
const TUB = { x: SPAN_X0, y: SPAN_Y - 30, w: 300, h: 162 };
const DESK = { x: SPAN_X0, y: SPAN_Y - 22, w: 372, h: 146 };

// The string runs almost the full width of the card and the two people stand at its ends: the
// apparatus is the hero here, so it is drawn at the size the panel can carry.
const STR_X0 = 212, STR_X1 = 556, STR_SLACK_AT = 0.4, STR_SAG = 46;
const RAIL_X0 = 176, RAIL_X1 = 556;
const RAIL_Y = SPAN_Y + 30;
// The s03 closing beat's second ear marker: a far corner, well off the straight path.
const FAR_EAR = { x: 74, y: 158 };
const WIDE = { x: SPAN_X0 - 8, y: SPAN_Y - 74, w: 356, h: 168 };

const MEDIA = [{ value: 'air', label: 'air' }, { value: 'desk', label: 'wooden desk' }, { value: 'water', label: 'water' }];
const TENSION = [{ value: 'taut', label: 'taut' }, { value: 'slack', label: 'slack' }];

const MOUNT = { S03: 's03', S04: 's04', S07: 's07' };
const S_SLACK = 2, S_TWO = 3;

const MAP5 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];
const MAP4 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }]];
const MAP3 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Out and back: zero before the front arrives, peak in the middle, exactly zero again once it
// has passed. The return is structural, not animated back by hand.
const bump = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) ** 2);
const span = (a, b) => Math.max(0, b - a);

// A path is a polyline plus a cumulative arc-length table, so "how far along the string is this
// dot" is answered in arc length and not in x - a sagging string has less arc per x than a
// straight one, and the shove has to stop at the same place on both.
function arcTable(pts) {
  const arc = [0];
  for (let i = 1; i < pts.length; i++) {
    arc.push(arc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return arc;
}

function atArc(pts, arc, s) {
  const last = arc[arc.length - 1];
  if (s <= 0) return pts[0];
  if (s >= last) return pts[pts.length - 1];
  for (let i = 1; i < arc.length; i++) {
    if (arc[i] >= s) {
      const t = (s - arc[i - 1]) / (arc[i] - arc[i - 1] || 1);
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      };
    }
  }
  return pts[pts.length - 1];
}

function tangentAt(pts, arc, s) {
  const a = atArc(pts, arc, Math.max(0, s - 5));
  const b = atArc(pts, arc, s + 5);
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
}

export class MediumPathScene extends SimScene {
  static BEAT_STEP_MAP = MAP5;
  static BEAT_MAPS = { 5: MAP5, 4: MAP4, 3: MAP3 };
  static NOTE_STAGE = 0;
  static ARIA_LABEL = 'A tapper on one side of a panel and a listener on the other, with a span of dots between them. Pressing tap sends one shove along the span; each dot moves a little way and returns to its own place.';
  static CONTROLS = [
    { type: 'button', id: 'send', label: 'tap' },
    { type: 'select', id: 'medium', label: 'medium', value: 'air', options: MEDIA },
    { type: 'segmented', id: 'string', label: 'string', value: 'taut', options: TENSION },
  ];

  constructor(container, config) {
    super(container, config);
    this._medium = 'air';
    this._taut = true;
    this._run = null;                 // { stage, legs, t, arrived: Set }
    this._lit = null;                 // { x, y, u } while the marker is lit
    this._strike = 0;                 // s of the tapper's own strike animation left
    this._wobble = 0;                 // s of slack-string wobble left
    this._mediumBoxes = [];
    this._tensionBoxes = [];
    this._tapBox = null;
    this._heardBox = null;
  }

  noteRows() {
    return [{ text: 'the dots stand in for matter, not for molecules; the span is not to scale' }];
  }

  // ---- host -------------------------------------------------------------------------------------
  // The host hands over a beat COUNT and never the slide, so the count IS the mount. SimScene sets
  // `beatCount` before it enters the stage, so enter() reads it and no override is needed.
  get _mount() { return this.beatCount === 4 ? MOUNT.S04 : this.beatCount === 3 ? MOUNT.S07 : MOUNT.S03; }

  enter(stage) {
    this._run = null;
    this._lit = null;
    this._strike = 0;
    this._wobble = 0;
    if (this._mount === MOUNT.S03) {
      this._medium = MEDIA_BY_STAGE[stage] ?? 'air';
    } else if (this._mount === MOUNT.S04) {
      this._taut = stage !== S_SLACK;
    }
    this.requestUiUpdate?.();
  }

  busy() { return !!this._run || this._strike > 0 || this._wobble > 0; }

  isControlHidden(id) {
    if (id === 'medium') return this._mount !== MOUNT.S03;
    if (id === 'string') return this._mount !== MOUNT.S04;
    return false;
  }

  getControlValue(id) {
    if (id === 'medium') return this._medium;
    if (id === 'string') return this._taut ? 'taut' : 'slack';
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'send') this._launch();
    else if (id === 'medium') { this._medium = String(v); this._reset(); }
    else if (id === 'string') { this._taut = String(v) !== 'slack'; this._reset(); }
    this.requestUiUpdate?.();
  }

  _reset() { this._run = null; this._lit = null; this._wobble = 0; }

  // ---- the run ----------------------------------------------------------------------------------
  // One leg is one crossing. s04 beat 3 is a run of TWO legs, so one press does both and busy()
  // covers the gap between them. `stop` is the arc length the shove dies at (the slack string),
  // and `lit` the arc length at which the marker lights (the arrival).
  _plan() {
    const m = this._mount, s = this.stage;
    if (m === MOUNT.S07) {
      return [{ kind: 'air', x0: SPAN_X0 + 60, amp: AMP.air, stop: EAR_X - (SPAN_X0 + 60), lit: EAR_X - (SPAN_X0 + 60) }];
    }
    if (m === MOUNT.S04) {
      if (s === S_TWO) {
        return [
          { kind: 'rail', x0: RAIL_X0, amp: AMP.rail, stop: RAIL_X1 - RAIL_X0, lit: RAIL_X1 - RAIL_X0 },
          { kind: 'wide', x0: WIDE.x + 12, amp: AMP.water, stop: EAR_X - (WIDE.x + 12), lit: EAR_X - (WIDE.x + 12), after: LEG + GAP },
        ];
      }
      const stop = this._taut ? this._stringLength() : this._stringLength() * STR_SLACK_AT;
      // A slack string has no arrival: the shove dies where the slack begins and the far marker
      // stays dark, which is the whole point of this beat, so the leg never fires its arrival.
      return [{ kind: 'string', x0: STR_X0, amp: AMP.string, stop, lit: this._stringLength(),
        arrives: this._taut }];
    }
    const med = this._mediumOf();
    return [{ kind: med, x0: SPAN_X0, amp: AMP[med], stop: EAR_X - SPAN_X0, lit: EAR_X - SPAN_X0 }];
  }

  // `enter` seeds `_medium` from the beat, so a beat always draws the medium its own prose names
// however the learner arrived; the select overwrites it and stays live, so all three are
// choosable on every s03 beat.
_mediumOf() { return this._medium; }

  _launch() {
    if (this._run) return;
    const legs = this._plan();
    this._run = { stage: this.stage, legs, t: 0, arrived: [] };
    this._lit = null;
    this._strike = STRIKE;
    this._wobble = this._mount === MOUNT.S04 && this.stage === S_SLACK && !this._taut ? WOBBLE_T : 0;
    const total = legs.reduce((m, l) => Math.max(m, (l.after ?? 0) + LEG), 0);
    this.animateFor(Math.ceil(total * 1000) + 400);
  }

  update(d) {
    if (this._strike > 0) this._strike = Math.max(0, this._strike - d);
    if (this._wobble > 0) this._wobble = Math.max(0, this._wobble - d);
    if (this._lit) {
      this._lit.u += d / LIGHT;
      if (this._lit.u >= 1) this._lit = null;
    }
    const r = this._run;
    if (!r) return;
    r.t += d;
    // arrival: the front reaching the marker is the fact, so the marker lights and celebrates
    // once, credited to the stage that launched the leg (never to whatever stage is current).
    r.legs.forEach((leg, i) => {
      const t0 = leg.after ?? 0;
      if (leg.arrives === false || r.arrived[i] || r.t < t0) return;
      if (SPEED * (r.t - t0) < leg.lit) return;
      r.arrived[i] = true;
      const same = r.stage === this.stage;
      if (same) {
        this._lit = { x: this._earPoint().x, y: this._earPoint().y, u: 0 };
        this.celebrate(this._lit.x, this._lit.y, 14);
      }
    });
    const total = r.legs.reduce((m, l) => Math.max(m, (l.after ?? 0) + LEG), 0);
    if (r.t >= total) this._run = null;
  }

  // ---- the shove ----------------------------------------------------------------------------------
  // The offset of the dot at arc distance `s` along a leg, at run time `t`. Beyond `stop` there is
  // no shove at all, which is how the slack string swallows it.
  _shiftAt(s) {
    const r = this._run;
    if (!r) return 0;
    for (let i = 0; i < r.legs.length; i++) {
      const leg = r.legs[i];
      const t0 = leg.after ?? 0;
      if (r.t < t0 || r.t >= t0 + LEG) continue;
      const u = (SPEED * (r.t - t0) - s) / PULSE_W;
      if (s > leg.stop) return 0;
      return leg.amp * bump(u);
    }
    return 0;
  }

  

  // ---- draw ---------------------------------------------------------------------------------------
  draw(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots', { t });
    drawCard(ctx, c, CARD.x, CARD.y, CARD.w, CARD.h);
    drawFloor(ctx, c, FLOOR);
    const m = this._mount, s = this.stage;
    if (m === MOUNT.S07) this._drawRoom(ctx, c, t);
    else if (m === MOUNT.S04) { if (s === S_TWO) this._drawTwo(ctx, c, t); else this._drawString(ctx, c, t); }
    else this._drawMedia(ctx, c, t);
    drawVignette(ctx, c, 0.7);
    this._chips(ctx, c);
  }

  _chips(ctx, c) {
    const y = ZONES.top.y + 6, cx = CARD.x + CARD.w / 2;
    if (this._mount === MOUNT.S03) {
      this._mediumBoxes = chipRow(ctx, c, MEDIA.map((o) => ({
        text: o.label, bg: o.value === this._medium ? c.accent : mix(c.raised, c.label, 0.16),
      })), cx, y, { align: 'center' });
    } else if (this._mount === MOUNT.S04) {
      this._tensionBoxes = chipRow(ctx, c, TENSION.map((o) => ({
        text: o.label, bg: o.value === (this._taut ? 'taut' : 'slack') ? c.accent : mix(c.raised, c.label, 0.16),
      })), cx, y, { align: 'center' });
    } else {
      this._mediumBoxes = [];
      this._tensionBoxes = [];
    }
    // Both ends of the panel carry the same chip treatment on every mount. They sit above the
    // span, never on it: a chip on the evidence would hide the dots it names.
    this._tapBox = chipRow(ctx, c, [{ text: 'tap', bg: c.accent }], SPAN_X0 - 10, CARD.y + 42, { align: 'center' })[0];
    this._heardBox = chipRow(ctx, c, [{ text: 'heard', bg: this._lit ? c.good : mix(c.raised, c.label, 0.22) }],
      EAR_X + 46, CARD.y + 42, { align: 'center' })[0];
  }

  // ---- mount 1: air / desk / water / every direction -------------------------------------------------
  _drawMedia(ctx, c, t) {
    const s = this.stage;
    const med = this._mediumOf();
    const handY = med === 'desk' ? DESK.y + 4 : med === 'water' ? TUB.y + 10 : SPAN_Y;
    if (med === 'desk') {
      drawBench(ctx, c, DESK.x, DESK.x + DESK.w, DESK.y, { col: mix(c.s5, c.raised, 0.3), h: DESK.h });
      this._grid(ctx, c, 'desk', DESK.x + 14, DESK.x + DESK.w - 14, DESK.y + DESK.h / 2);
    } else if (med === 'water') {
      drawBench(ctx, c, TUB.x - 6, TUB.x + TUB.w + 6, TUB.y + TUB.h + 8, { col: mix(c.s5, c.raised, 0.3), h: 34 });
      ctx.fillStyle = alpha(c.water, 0.24);
      rr(ctx, TUB.x, TUB.y, TUB.w, TUB.h, 10); ctx.fill();
      ctx.strokeStyle = mix(c.stroke, c.label, 0.28); ctx.lineWidth = 3; ctx.stroke();
      this._grid(ctx, c, 'water', TUB.x + 14, TUB.x + TUB.w - 14, TUB.y + TUB.h / 2);
      // the short stretch of the room's air between the far wall of the tub and the ear:
      // the same loose pitch as everywhere else, just a shorter piece of the same room
      this._grid(ctx, c, 'airS', TUB.x + TUB.w + 14, SPAN_X1, SPAN_Y);
    } else {
      this._grid(ctx, c, 'air', SPAN_X0, SPAN_X1, SPAN_Y);
    }
    if (s === 4) this._drawTicks(ctx, c);
    if (med === 'desk') {
      // the slide's experiment: the ear flat on the top of the wood, in place of the free ear.
      // It lies fully on the bench top (whose far end is 548, so it stops 26 px short of it) and is
      // drawn 1.3x, because this is the one marker with no figure to give it a silhouette.
      this._ear(ctx, c, DESK.x + DESK.w - 26, DESK.y - 10, true, 1.3);
    } else {
      this._listener(ctx, c, EAR_X + 46, SPAN_Y);
    }
    this._tapper(ctx, c, med, handY, t);
    if (s === 4) {
      // The stub's second ear marker, in the far corner and off the straight path. It lights on the
      // same tap because `_lit` is the arrival itself, drawn wherever the arrival is drawn.
      ctx.save();
      ctx.translate(FAR_EAR.x, FAR_EAR.y);
      ctx.scale(1.3, 1.3);
      this._ear(ctx, c, 0, 0);
      ctx.restore();
    }
  }

  // The dot chain is the whole of the crossing. Nothing else is drawn between the two ends.
  _grid(ctx, c, kind, x0, x1, yMid) {
    const g = GRID[kind];
    const cols = Math.max(2, Math.round((x1 - x0) / g.pitch) + 1);
    const colW = (x1 - x0) / (cols - 1);
    const yTop = yMid - ((g.rows - 1) * g.dy) / 2;
    const base = mix(c.label, c.raised, 0.2);
    for (let j = 0; j < g.rows; j++) {
      for (let i = 0; i < cols; i++) {
        const hx = x0 + i * colW;
        const hy = yTop + j * g.dy;
        const amp = kind === 'airS' ? AMP.air : AMP[kind] || AMP.air;
        const k = this._shiftAt(hx - SPAN_X0) / amp;
        ctx.fillStyle = k > 0.03 ? lighten(c.label, Math.min(0.55, k * 0.5)) : base;
        ctx.beginPath();
        ctx.arc(hx + this._shiftAt(hx - SPAN_X0), hy, g.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _tapper(ctx, c, med, handY, t) {
    const shiver = this._strike > 0 ? Math.sin((STRIKE - this._strike) * 44) * 3 : 0;
    drawFigure(ctx, c,
      { x: SPAN_X0 - 46, y: FLOOR, height: FIG_H, facing: 1, pose: 'stand',
        hands: [{ x: SPAN_X0 - 24, y: handY }, { x: SPAN_X0 - 32, y: handY + 16 }] },
      { top: c.s1, skin: 1, hairStyle: 'short', mood: this._strike > 0 ? 'effort' : 'smile', t },
      { between: () => this._tapperObject(ctx, c, SPAN_X0 - 24 + shiver, handY, med) });
  }

  // a small struck object held in the drawn hand: a pipe end on air, a spoon in water
  _tapperObject(ctx, c, x, y, med) {
    const col = med === 'water' ? c.water : c.s6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.22 + (this._strike > 0 ? Math.sin((STRIKE - this._strike) * 44) * 0.05 : 0));
    ctx.fillStyle = col;
    rr(ctx, -5, -3.5, 24, 8, 4); ctx.fill();
    ctx.fillStyle = mix(col, c.label, 0.45);
    rr(ctx, 17, -6, 8, 13, 3.5); ctx.fill();
    ctx.restore();
  }

  // The ear marker hangs off the figure's own head anchor, never a hand-placed offset that can
  // drift onto the face. `facing: -1` looks back along the span, so the ear is on the span side.
  _listener(ctx, c, x, earY) {
    const sk = drawFigure(ctx, c,
      { x, y: FLOOR, height: FIG_H, facing: -1, pose: 'stand',
        hands: [{ x: x + 26, y: earY + 26 }, { x: x + 30, y: earY + 36 }] },
      { top: c.s3, skin: 2, hairStyle: 'long', mood: this._lit ? 'happy' : 'smile', t: this.clock });
    const h = sk.anchors.head;
    this._ear(ctx, c, h.x - h.r * 0.62, h.y + h.r * 0.18);
  }

  // Where the marker that lights on arrival actually is drawn, so the burst lands on it.
_earPoint() {
    if (this._mount === MOUNT.S04) {
      if (this.stage === S_TWO) return { x: this._onWideLeg() ? EAR_X + 22 : RAIL_X1 - 18, y: this._onWideLeg() ? SPAN_Y : RAIL_Y + 9 };
      return { x: STR_X1, y: SPAN_Y };
    }
    if (this._mount === MOUNT.S03 && this._mediumOf() === 'desk') return { x: DESK.x + DESK.w - 26, y: DESK.y - 10 };
    return { x: EAR_X + 20, y: SPAN_Y - 6 };
  }

  _ear(ctx, c, x, y, flat = false, k = 1) {
    const lit = !!this._lit;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    if (flat) ctx.rotate(Math.PI / 2.2);
    else ctx.rotate(-0.22);
    // The free ear sits on a face and reads against skin. One lying flat on the bench or on the
    // rail has the dark panel behind it, so it is filled lighter and given a dark rim - otherwise
    // it is the faintest thing on a panel whose whole subject is that the shove reached it.
    ctx.fillStyle = lit ? c.good : flat ? mix(c.raised, c.label, 0.66) : mix(c.raised, c.label, 0.32);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5, 12.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (flat && !lit) {
      ctx.strokeStyle = c.bgDeep;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.strokeStyle = lit ? lighten(c.good, 0.4) : flat ? mix(c.bgDeep, c.label, 0.3) : alpha(c.label, 0.55);
    ctx.lineWidth = flat ? 2.2 : 2;
    ctx.beginPath();
    ctx.ellipse(1, 1, 3.6, 5.8, 0, 0.4, Math.PI * 1.7);
    ctx.stroke();
    if (lit) {
      ctx.strokeStyle = alpha(c.good, 0.75 * (1 - this._lit.u));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 15 + this._lit.u * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // s03 beat 4: faint ticks leaving the tapper in every direction at once, fading with distance.
  // Ticks, never rings: an alternating dense/sparse picture belongs to L04.
  _drawTicks(ctx, c) {
    const k = this._run ? clamp01(this._run.t / LEG) : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(CARD.x + 8, CARD.y + 8, CARD.w - 16, CARD.h - 16);
    ctx.clip();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      // They are marks on the panel, so they are there at rest too (a resting tick is 11 px, a
      // flaring one reaches 48): this beat's own subject must not vanish between presses.
      const r0 = 18 + 8 * k;
      const r1 = r0 + 11 + 19 * clamp01(k * 1.4);
      ctx.strokeStyle = alpha(c.accent, 0.55 * (1 - (r1 / 62) ** 2));
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(SPAN_X0 + Math.cos(a) * r0, SPAN_Y + Math.sin(a) * r0);
      ctx.lineTo(SPAN_X0 + Math.cos(a) * r1, SPAN_Y + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- mount 2: cups and string ----------------------------------------------------------------------
  _stringPts() {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      let y = SPAN_Y;
      if (!this._taut) {
        const k = Math.max(0, (u - STR_SLACK_AT) / (1 - STR_SLACK_AT));
        y = SPAN_Y + STR_SAG * Math.sin(Math.PI * k);
      }
      pts.push({ x: STR_X0 + (STR_X1 - STR_X0) * u, y });
    }
    return pts;
  }

  _stringLength() { return STR_X1 - STR_X0; }   // taut: the arc IS the x span

  // The room the experiment is done in - the slide's own word - as scenery behind the two figures.
  // Deliberately NOT a second field of dots: one dot field is one medium, so this is a wall with a
  // skirting board and nothing on it that could be read as carrying anything.
  _wall(ctx, c) {
    const x0 = CARD.x + 10, x1 = CARD.x + CARD.w - 10, yTop = CARD.y + 12, yBot = FLOOR - 4;
    ctx.fillStyle = mix(c.raised, c.label, 0.12);
    ctx.fillRect(x0, yTop, x1 - x0, yBot - yTop);
    ctx.fillStyle = mix(c.raised, c.label, 0.24);
    ctx.fillRect(x0, yBot - 9, x1 - x0, 9);
    // two panel seams, so the wall has a scale of its own and does not read as a flat slab
    ctx.fillStyle = alpha(c.label, 0.18);
    ctx.fillRect(x0 + (x1 - x0) * 0.34, yTop, 3, yBot - 9 - yTop);
    ctx.fillRect(x0 + (x1 - x0) * 0.67, yTop, 3, yBot - 9 - yTop);
  }

  _drawString(ctx, c, t) {
    this._wall(ctx, c);
    const pts = this._stringPts();
    const arc = arcTable(pts);
    const total = arc[arc.length - 1];
    const n = 34;
    const slackFrom = STR_X0 + (STR_X1 - STR_X0) * STR_SLACK_AT;
    // the string hangs between two people at the ends of the panel, so the span is narrower
    // than the room's: the two figures and their cups are the mass at either end of it
    for (let i = 0; i <= n; i++) {
      const s = (total * i) / n;
      const p = atArc(pts, arc, s);
      const tg = tangentAt(pts, arc, s);
      const k = this._shiftAt(s);
      const wob = this._wobble > 0 && p.x > slackFrom
        ? Math.sin(this._wobble * 9 + i * 0.55) * (this._wobble / WOBBLE_T) * 5 : 0;
      ctx.fillStyle = k / AMP.string > 0.03 ? lighten(c.label, Math.min(0.55, (k / AMP.string) * 0.5))
        : mix(c.label, c.raised, 0.24);
      ctx.beginPath();
      ctx.arc(p.x + tg.x * k, p.y + tg.y * k + wob, 6.4, 0, Math.PI * 2);
      ctx.fill();
    }
    this._cup(ctx, c, STR_X0, SPAN_Y, c.s1, true, t);
    this._cup(ctx, c, STR_X1, SPAN_Y, c.s3, false, t);
    if (!this._taut) {
      // the point where the slack begins: the shove dies here and never reaches the far cup
      ctx.strokeStyle = c.warning;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(slackFrom, SPAN_Y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    // the far cup's own marker is what lights on arrival: the string's only listener
    if (this._lit) {
      ctx.strokeStyle = alpha(c.good, 0.75 * (1 - this._lit.u));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(STR_X1, SPAN_Y, 30 + this._lit.u * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    void t;
  }

  _cup(ctx, c, x, y, col, near, t) {
    const shake = near && this._strike > 0 ? Math.sin((STRIKE - this._strike) * 46) * 3 : 0;
    ctx.save();
    ctx.translate(x + shake, y);
    ctx.fillStyle = mix(col, c.raised, 0.2);
    ctx.beginPath();
    ctx.moveTo(-25, -38); ctx.lineTo(25, -38); ctx.lineTo(16, 38); ctx.lineTo(-16, 38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(c.raised, c.label, 0.42);
    ctx.beginPath();
    ctx.ellipse(0, -38, 25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // each cup is held in a drawn hand, as the slide has it: two people, one cup each
    drawFigure(ctx, c,
      { x: x + (near ? -42 : 42), y: FLOOR, height: FIG_H, facing: near ? 1 : -1, pose: 'stand',
        hands: [{ x, y: y + 10 }, { x, y: y + 22 }] },
      { top: near ? c.s1 : c.s3, skin: near ? 1 : 2, hairStyle: near ? 'short' : 'long', mood: near && this._strike > 0 ? 'effort' : 'smile', t });
  }

  // ---- mount 3: the room -------------------------------------------------------------------------------
  _drawRoom(ctx, c, t) {
    // a long span of still, evenly spaced air. Nothing crosses it but the dots' own shove.
    this._grid(ctx, c, 'air', SPAN_X0 + 60, SPAN_X1, SPAN_Y);
    this._fork(ctx, c, t);
    this._listener(ctx, c, EAR_X + 46, SPAN_Y);
  }

  // The fork's whole journey is about a millimetre, so its shiver is two dot widths and no more.
  // No ruler, no scale, no measurement of any kind on this mount.
  _fork(ctx, c, t) {
    const shiver = this._strike > 0 ? Math.sin((STRIKE - this._strike) * 46) * 2 : 0;
    const x = SPAN_X0 - 40, y = SPAN_Y;
    drawShadow(ctx, c, x, FLOOR + 4, 28, 7);
    ctx.fillStyle = mix(c.s6, c.raised, 0.35);
    rr(ctx, x - 28, FLOOR - 10, 56, 10, 4); ctx.fill();
    ctx.strokeStyle = mix(c.s6, c.label, 0.2);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, FLOOR - 10); ctx.lineTo(x, y + 24);
    ctx.stroke();
    ctx.strokeStyle = c.s6;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 24); ctx.lineTo(x - 12 - shiver, y - 34);
    ctx.moveTo(x + 12, y + 24); ctx.lineTo(x + 12 + shiver, y - 34);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y + 28, 12, Math.PI, 0);
    ctx.stroke();
    void t;
  }

  // ---- s04 beat 3: two crossings in the world --------------------------------------------------------------
  _onWideLeg() {
    const r = this._run;
    if (!r) return false;
    const t0 = r.legs[1]?.after ?? 0;
    return r.t >= t0;
  }

  _drawTwo(ctx, c, t) {
    if (this._onWideLeg()) this._wide(ctx, c); else this._rail(ctx, c);
    void t;
  }

  _rail(ctx, c) {
    const y = RAIL_Y;
    // The ballast the track stands in. Scenery, not a second medium: flat bands, no dots in it.
    ctx.fillStyle = mix(c.stroke, c.raised, 0.3);
    ctx.beginPath();
    ctx.moveTo(RAIL_X0 - 40, FLOOR - 6);
    ctx.lineTo(RAIL_X0 + 4, y + 36);
    ctx.lineTo(RAIL_X1 - 4, y + 36);
    ctx.lineTo(RAIL_X1 + 40, FLOOR - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.raised, 0.46);
    ctx.fillRect(RAIL_X0 + 2, y + 29, RAIL_X1 - RAIL_X0 - 4, 8);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = mix(c.stroke, c.label, 0.28);
      rr(ctx, RAIL_X0 + 14 + i * 56, y + 14, 13, 30, 3); ctx.fill();
    }
    ctx.fillStyle = mix(c.s6, c.label, 0.3);
    rr(ctx, RAIL_X0, y, RAIL_X1 - RAIL_X0, 15, 6); ctx.fill();
    const n = 34;
    for (let i = 0; i <= n; i++) {
      const hx = RAIL_X0 + ((RAIL_X1 - RAIL_X0) * i) / n;
      const k = this._shiftAt(hx - RAIL_X0);
      ctx.fillStyle = k / AMP.rail > 0.03 ? lighten(c.label, Math.min(0.55, (k / AMP.rail) * 0.5))
        : mix(c.label, c.raised, 0.3);
      ctx.beginPath();
      ctx.arc(hx + k, y + 7.5, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // the wheel stands ON the rail at its left end, which is where a train's wheel is
    const wx = RAIL_X0 + 34, wy = y + 6, wr = 26;
    ctx.strokeStyle = mix(c.s5, c.label, 0.2);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(wx - wr * Math.cos(a), wy - wr * Math.sin(a));
      ctx.lineTo(wx + wr * Math.cos(a), wy + wr * Math.sin(a));
      ctx.stroke();
    }
    ctx.fillStyle = mix(c.s5, c.label, 0.2);
    ctx.beginPath();
    ctx.arc(wx, wy, 6, 0, Math.PI * 2);
    ctx.fill();
    // the ear waits ON the rail at its own height, at its far end, not floating above it
    this._ear(ctx, c, RAIL_X1 - 18, RAIL_Y + 9, true, 1.2);
  }

  _wide(ctx, c) {
    drawBench(ctx, c, WIDE.x - 6, WIDE.x + WIDE.w + 6, WIDE.y + WIDE.h + 8, { col: mix(c.stroke, c.raised, 0.4), h: 30 });
    ctx.fillStyle = alpha(c.water, 0.22);
    rr(ctx, WIDE.x, WIDE.y, WIDE.w, WIDE.h, 10); ctx.fill();
    ctx.strokeStyle = mix(c.stroke, c.label, 0.3); ctx.lineWidth = 3; ctx.stroke();
    this._grid(ctx, c, 'water', WIDE.x + 14, WIDE.x + WIDE.w - 14, WIDE.y + WIDE.h / 2);
    ctx.strokeStyle = c.accent; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(WIDE.x - 16, WIDE.y - 4); ctx.lineTo(WIDE.x - 16, WIDE.y + 26);
    ctx.stroke();
    this._ear(ctx, c, EAR_X + 22, SPAN_Y);
  }

  // ---- pointer -----------------------------------------------------------------------------------------
  // Every dial on the panel is also its tap target, so a phone learner never has to find the bar.
  pointerDown(p) {
    if (this._hitChip(p, this._tapBox)) { this._launch(); return true; }
    const mi = this._chipIndexAt(p, this._mediumBoxes);
    if (mi >= 0) { this._medium = MEDIA[mi].value; this._reset(); this.requestUiUpdate?.(); return true; }
    const ti = this._chipIndexAt(p, this._tensionBoxes);
    if (ti >= 0) { this._taut = TENSION[ti].value === 'taut'; this._reset(); this.requestUiUpdate?.(); return true; }
    if (this._mount === MOUNT.S07 && Math.hypot(p.x - (SPAN_X0 - 40), p.y - (SPAN_Y - 6)) < 44) { this._launch(); return true; }
    if (this._mount === MOUNT.S04 && (Math.hypot(p.x - STR_X0, p.y - SPAN_Y) < 46 || Math.hypot(p.x - STR_X1, p.y - SPAN_Y) < 46)) {
      this._launch();
      return true;
    }
    return false;
  }

  _inBox(p, b) { return !!b && p.x >= b.x0 - 4 && p.x <= b.x0 + b.w + 4 && p.y >= b.y0 - 4 && p.y <= b.y0 + b.h + 4; }

  _hitChip(p, b) { return this._inBox(p, b); }

  _chipIndexAt(p, boxes) {
    for (let i = 0; i < boxes.length; i++) if (this._inBox(p, boxes[i])) return i;
    return -1;
  }
}