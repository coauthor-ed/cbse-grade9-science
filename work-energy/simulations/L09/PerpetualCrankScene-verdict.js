// PerpetualCrankScene-verdict.js - the chapter's last word on the crank.
//
// Two mounts of one file, keyed by beat count (2 = the L09 s01 hook, 3 = the
// L09 s07 verdict), because the hook must leave the question open and the
// verdict must close it. The count is the only thing that tells them apart.
//
// Every reading on the panel comes from one pair of pure functions:
//
//     loss(f) = f + 0.5 air + 0.2 sound + 0.3 bearings      (f = pivot friction)
//     out      = 12 - loss                                   (12 J a turn, fixed)
//
// so `loss >= 1.6` and `out <= 10.4 < 12` on every frame of every setting: no
// value the host can send makes the output reach the input. The four
// destinations on the verdict mount are that same `loss` split four ways, and
// their sum is the heat meter's own per-turn figure, so the account cannot
// drift from the meter.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawDepth, drawCard, drawShadow, luma, drawShelf,
  pill, chipRow, font, mix, alpha, lighten, darken, rr, stadium,
} from 'simulations/base/kit/SimLook.js';

const TAU = Math.PI * 2;
const rad = (deg) => (deg * Math.PI) / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// -- The machine -----------------------------------------------------------------
const WX = 262, WY = 186, RIM = 114;       // the wheel: centre and rim radius
const HUB = 24, SPOKES = 6, MAGNETS = 4;
const RIM_BAND = 18;                       // the rim's own width
const GRIP_R = RIM * 0.70;                  // the hand travels the crank's own circle
const CRANK_OFF = rad(-34);                 // where the crank arm starts, at rest
const WALL = { x0: 24, y0: 52, x1: 664, y1: 332 };
const BENCH = { x0: 40, x1: 430, y: 300 };
const SHELF_Y = 150;

// -- The three meters -------------------------------------------------------------
const IN_PER_TURN = 12;                     // J a hand puts in on one turn
const AIR = 0.5, SOUND = 0.2, BEARING = 0.3; // J a turn, fixed, outside the dial
const FIXED = AIR + SOUND + BEARING;        // 1.0 J a turn that no dial can reach
const LOSS_MAX = 4.0;                       // the worst case the friction dial allows
const FRIC_MIN = 0.6, FRIC_MAX = 3.0, FRIC_STEP = 0.3, FRIC_START = 1.2;
const TURNS_MIN = 20, TURNS_MAX = 160, TURNS_STEP = 10, TURNS_START = 100;
const TURN_RATE = 25;                       // rev/s: 25x a hand, named in the note line
                                          // (25, not 10, so the longest run - 160 turns - still
                                          //  ends inside the 8 s a beat grants)
const SHOW_HZ = 5;                          // a number redrawn 10x a second is unreadable
const CELEBRATE_TURNS = 100;                // the slide's hundred, on the verdict mount

// Every reading goes through these, so nothing on the panel can disagree.
function friction(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return FRIC_MIN;
  return clamp(Math.round(n / FRIC_STEP) * FRIC_STEP, FRIC_MIN, FRIC_MAX);
}
function lossOf(f) { return clamp(f, FRIC_MIN, FRIC_MAX) + FIXED; }
function outOf(f) { return IN_PER_TURN - lossOf(f); }

// One part of the shortfall, in J a turn. `f` is the pivot friction in force.
function parts(f) {
  const p = clamp(f, FRIC_MIN, FRIC_MAX);
  return [
    { text: 'friction at the pivot', j: p, col: 's1' },
    { text: 'the air', j: AIR, col: 's2' },
    { text: 'sound', j: SOUND, col: 's3' },
    { text: 'the bearings', j: BEARING, col: 's4' },
  ];
}

// The cards, side by side across the bottom, bars sharing a left origin.
const CARD_Y = 340, CARD_H = 112, CARD_W = 206;
const CARD_X = [16, 238, 460];
const BAR_W = 182, BAR_Y = 400, BAR_H = 20;
const barX = (cardX) => cardX + (CARD_W - BAR_W) / 2;

// The right-hand ledger: the gap's slot on the hook mount, the four
// destinations on the verdict mount, the three machines on the verdict's
// second beat.
const RX = 396, RY = 64, RW = 268, RH = 262;
const STACK_X = RX + 16, STACK_W = RW - 32, STACK_Y = 108, STACK_H = 24;
const LEG_Y = [154, 184, 214, 244];
const SUM_Y = 278, SUM_CAP = 302;          // the value, and the meter it equals
const SUM_RULE = 262;                       // the line that says "these add up"
const ASK_Y = [110, 264, 296];             // the hook mount's slot and its two labels
const MACH_Y = [64, 148, 232], MACH_H = 76; // the three machine cards
const SAY = { x: 16, y: CARD_Y, w: 648, h: CARD_H };

// One entry per beat, one map per mount: both open on the running crank.
const MAP_S01 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP_S07 = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class PerpetualCrankSceneVerdict extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP_S07;
  static BEAT_MAPS = { 2: MAP_S01, 3: MAP_S07 };
  static DRAGGABLE = true;
  static ARIA_LABEL = 'A crank wheel with four bar magnets on its rim stands on a workbench, a hand on the grip at the end of a crank arm. Below it three meters count the work that goes in, the work that comes out, and the heat. A crank button runs the wheel for a set number of turns, and a dial sets how much each turn loses, never to zero. Beside the wheel a card either shows an empty slot with a question mark where the missing part should be, or splits the missing part four ways - friction at the pivot, the air, sound, and the bearings - with a bar whose four pieces add up to the heat meter.';
  static NOTE_STAGE = 0;
  static NOTE_STYLE = 'line';
  static CONTROLS = [
    { type: 'button', id: 'crank', label: 'Crank it' },
    { type: 'slider', id: 'turns', label: 'Turns to crank', min: TURNS_MIN, max: TURNS_MAX, step: TURNS_STEP, value: TURNS_START, suffix: '' },
    { type: 'slider', id: 'friction', label: 'Loss each turn (J)', min: FRIC_MIN, max: FRIC_MAX, step: FRIC_STEP, value: FRIC_START, suffix: ' J' },
  ];

  _fric = FRIC_START;
  _turns = TURNS_START;
  _ang = 0;                 // the wheel's own angle
  _done = 0;                // whole turns finished
  _run = null;              // { stage, target, frac, from, fric }
  _drag = null;             // { last, moved, from }
  _found = false;
  _cheer = 0;
  _show = { in: 0, out: 0, heat: 0, n: 0 };
  _showT = 0;

  // The host hands over the count and never the slide, and the count is the only
  // thing that tells the two mounts apart.
  get _mount() { return this.beatCount >= 3 ? 'verdict' : 'hook'; }
  get _machines() { return this._mount === 'verdict' && this.stage === 1; }

  noteRows() {
    return [{ text: 'No setting makes this crank lossless. Drawn 25 times faster than a hand.' }];
  }

  enter(stage) {
    this._run = null;
    this._drag = null;
    this._ang = 0;
    this._done = 0;
    this._found = false;
    this._cheer = 0;
    this._showT = 0;
    this._show = { in: 0, out: 0, heat: 0, n: 0 };
    this._publish();
    // Both mounts open on the crank already turning (the s01 hook's whole claim),
    // and both later beats re-reach the same picture for a resumed lesson.
    this._crank();
  }

  isControlHidden() { return false; }

  isControlDisabled(id) {
    if (!this._run) return false;
    return id === 'turns' || id === 'friction';
  }

  onControlChange(id, value) {
    if (!this._guard(id)) return;
    if (id === 'turns') {
      const n = Number(value);
      this._turns = Number.isFinite(n)
        ? clamp(Math.round(n / TURNS_STEP) * TURNS_STEP, TURNS_MIN, TURNS_MAX)
        : TURNS_START;
    } else if (id === 'friction') {
      this._fric = friction(value);
    } else if (id === 'crank') this._crank();
    else return;
    this._publish();
    this.requestUiUpdate?.();
  }

  getControlValue(id) {
    if (id === 'turns') return this._turns;
    if (id === 'friction') return this._fric;
    return super.getControlValue(id);
  }

  // -- Pointer: the hand turns the wheel, and a tap is the button ----------------
  pointerDown(p) {
    if (Math.hypot(p.x - WX, p.y - WY) > RIM + 26) return;
    this._drag = { last: Math.atan2(p.y - WY, p.x - WX), moved: 0, from: { x: p.x, y: p.y } };
  }

  pointerMove(p) {
    const g = this._drag;
    if (!g) return false;
    g.moved = Math.max(g.moved, Math.hypot(p.x - g.from.x, p.y - g.from.y));
    if (g.moved < 6) return true;               // a tap is not a crank
    let a = Math.atan2(p.y - WY, p.x - WX);
    let d = a - g.last;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    g.last = a;
    // The hand pays for the sweep in both directions, but the wheel turns the
    // way the hand went: count the absolute, spin the signed. A signed count
    // would silently drop every backwards drag and leave the wheel stuck.
    this._turn(Math.abs(d) / TAU, d / TAU);
    return true;
  }

  pointerUp() {
    const g = this._drag;
    this._drag = null;
    if (g && g.moved < 6) this._crank();        // a tap on the wheel: the phone's crank
  }

  // -- The model ------------------------------------------------------------------
  _crank() {
    if (this._run) return;
    this._run = { stage: this.stage, target: this._turns, frac: 0, from: this._done, fric: this._fric };
    this._done = 0;
    this._publish(true);
  }

  // Whole turns only, so "behind on every turn" is true of every number the
  // panel has printed. A hand-driven turn moves the meters at the same rate a
  // run moves them, and republishes, so the two cannot disagree.
  _turn(frac, spin = frac) {
    if (!(frac > 0)) return;
    this._done += frac;
    this._ang += spin * TAU;
    this._publish();
  }

  // The one place the printed numbers are made.
  _publish(force = false) {
    const n = this._done;
    const f = this._run ? this._run.fric : this._fric;
    const loss = lossOf(f);
    this._show = { n, in: n * IN_PER_TURN, out: n * (IN_PER_TURN - loss), heat: n * loss };
    if (force) this._showT = 0;
  }

  update(d) {
    if (this._cheer > 0) this._cheer = Math.max(0, this._cheer - d);
    const r = this._run;
    if (r) {
      this._ang += TAU * TURN_RATE * d;
      r.frac += TURN_RATE * d;
      while (r.frac >= 1 && this._done < r.target) {
        r.frac -= 1;
        this._done += 1;
      }
      this._showT += d;
      if (this._done >= r.target) {
        this._run = null;
        this._publish(true);
        this._maybeFind();
      } else if (this._showT >= 1 / SHOW_HZ) {
        this._showT = 0;
        this._publish();
      }
    }
    if (!this._run) this._maybeFind();
  }

  busy() { return !!this._run || this._cheer > 0; }

  // The account closing, on the verdict mount only: the hook mount's claim is
  // that the question is still open, and a burst would answer it. Never on the
  // machines beat, whose panel is three cards of prose the confetti would cover.
  //
  // A rising chip and a warm flash, not a confetti burst: a burst at the sum row
  // rains 26 pieces of confetti over the four legend rows, the sum and its
  // caption - the accounting the burst is meant to be celebrating. The chip
  // carries the same words and sits on the wheel, which carries no reading, so
  // nothing it covers is evidence. The state chip below still flips to
  // `short on every turn` for the same second and a half.
  _maybeFind() {
    if (this._found) return;
    if (this._mount !== 'verdict') return;
    if (this._machines) return;
    if (this._done < CELEBRATE_TURNS) return;
    this._found = true;
    this.floatText('short on every turn', WX, WY, { bg: this.colors.flame, size: 18 });
    this.flash(0.45);
    this._cheer = 1.4;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawDepth(ctx, c, { t: this.clock, n: 5, k: 0.7 });
    this._wall(ctx, c);
    this._bench(ctx, c);
    this._tools(ctx, c);
    this._wheel(ctx, c);
    if (this._machines) {
      this._machinesPanel(ctx, c);
      this._statement(ctx, c);
    } else {
      this._ledger(ctx, c);
      this._cards(ctx, c);
    }
    this._chips(ctx, c);
  }

  // -- The set ---------------------------------------------------------------------
  _wall(ctx, c) {
    const { x0, y0, x1, y1 } = WALL;
    ctx.save();
    rr(ctx, x0, y0, x1 - x0, y1 - y0, 12);
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.05);
    ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = alpha(c.labelMuted, 0.14);
    for (let y = y0 + 16; y < y1; y += 18) {
      for (let x = x0 + 16; x < x1; x += 18) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // The bench the wheel is bolted to, and the post behind it. The wheel is
  // spoked and open, so the post is seen through it.
  _bench(ctx, c) {
    const { x0, x1, y } = BENCH;
    // the light theme's gold is already a dark ochre, so the slab is mixed
    // much further into it there: at 0.34 on a near-white wall it was a
    // near-white plank, and the wheel stood on nothing
    const wood = mix(c.bgSurface, c.gold, luma(c.bgDeep) > 0.5 ? 0.52 : 0.34);
    drawShadow(ctx, c, (x0 + x1) / 2, y + 50, (x1 - x0) / 2, 9);
    ctx.save();
    ctx.fillStyle = darken(c.stroke, 0.55);
    rr(ctx, WX - 11, WY + 4, 22, y - WY + 4, 6);
    ctx.fill();
    ctx.fillStyle = c.stroke;
    rr(ctx, WX - 6, WY + 4, 12, y - WY + 4, 5);
    ctx.fill();
    ctx.restore();
    rr(ctx, x0 + 8, y + 8, x1 - x0 - 16, 34, 7);
    ctx.fillStyle = darken(wood, 0.3);
    ctx.fill();
    rr(ctx, x0, y, x1 - x0, 28, 7);
    ctx.fillStyle = darken(wood, 0.18);
    ctx.fill();
    rr(ctx, x0, y, x1 - x0, 20, 7);
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(x0 + 14, y + 3, x1 - x0 - 28, 3);
    rr(ctx, x0 + 30, y + 22, x1 - x0 - 60, 14, 4);
    ctx.fillStyle = darken(wood, 0.26);
    ctx.fill();
    rr(ctx, (x0 + x1) / 2 - 24, y + 26, 48, 6, 3);
    ctx.fillStyle = darken(c.gold, 0.15);
    ctx.fill();
  }

  // A pegboard rail of the machine's own spares, so the left third of the wall
  // is a surface with something on it rather than a hole.
  _tools(ctx, c) {
    drawShelf(ctx, c, 40, 140, SHELF_Y, { col: c.gold });
    ctx.save();
    for (const bx of [58, 122]) {
      ctx.beginPath();
      ctx.moveTo(bx, SHELF_Y + 4);
      ctx.lineTo(bx, SHELF_Y + 22);
      ctx.lineTo(bx + (bx < 90 ? 16 : -16), SHELF_Y + 4);
      ctx.closePath();
      ctx.fillStyle = darken(c.gold, 0.5);
      ctx.fill();
    }
    ctx.restore();
    // a spare bar magnet and a bearing ring, resting on the shelf
    this._bar(ctx, c, 68, SHELF_Y - 13, c.s6, c.glass, 0);
    ctx.save();
    ctx.strokeStyle = darken(c.stroke, 0.2);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(114, SHELF_Y - 13, 14, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(114, SHELF_Y - 13, 14, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // The crank's own pull handle, hung on its peg: a bar with a ring at each
    // end, the shape the hand on the grip is echoing. Mixed as far into the ink
    // as the wheel's own metal, or it is a pale ghost on the light theme's wall.
    ctx.save();
    ctx.translate(84, 216);
    ctx.rotate(-0.2);
    ctx.fillStyle = darken(c.stroke, 0.35);
    rr(ctx, -6, -30, 12, 60, 5);
    ctx.fill();
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.58);
    rr(ctx, -4, -28, 8, 56, 4);
    ctx.fill();
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.58);
    ctx.lineWidth = 5;
    for (const ex of [-26, 26]) {
      ctx.beginPath();
      ctx.arc(0, ex, 9, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(80, 178, 3, 0, TAU);
    ctx.fillStyle = darken(c.gold, 0.3);
    ctx.fill();
  }

  // -- The right-hand ledger -------------------------------------------------------
  // The hook mount: an empty slot with a question mark, and nothing else. The
  // four destinations are s07's to name.
  _ledger(ctx, c) {
    drawCard(ctx, c, RX, RY, RW, RH, 1, {});
    if (this._mount === 'hook') {
      this._askPanel(ctx, c);
      return;
    }
    const f = this._run ? this._run.fric : this._fric;
    const rows = parts(f);
    pill(ctx, c, 'the missing part, J a turn', RX + RW / 2, RY + 24, { bg: c.flame, ink: chipInk(c, c.flame), size: 14 });
    // one scale, never rescaled: the worst case the dial allows
    const scale = LOSS_MAX;
    ctx.save();
    stadium(ctx, STACK_X, STACK_Y, STACK_W, STACK_H);
    ctx.fillStyle = darken(c.track, 0.3);
    ctx.fill();
    stadium(ctx, STACK_X, STACK_Y, STACK_W, STACK_H);
    ctx.fillStyle = c.track;
    ctx.fill();
    let at = 0;
    for (const p of rows) {
      const w = STACK_W * (p.j / scale);
      if (w < 1) continue;
      stadium(ctx, STACK_X + at, STACK_Y, Math.max(STACK_H, w), STACK_H);
      ctx.fillStyle = c[p.col];
      ctx.fill();
      at += w;
    }
    ctx.restore();
    rows.forEach((p, i) => this._legend(ctx, c, p, LEG_Y[i]));
    // a rule, so the four above it read as an addition and not as a fifth row
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(STACK_X, SUM_RULE);
    ctx.lineTo(RX + RW - 16, SUM_RULE);
    ctx.strokeStyle = alpha(c.stroke, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // the sum, which is the heat meter's own per-turn figure
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.font = font(c, 800, 18);
    ctx.fillStyle = c.flame;
    ctx.fillText(`${fmt(lossOf(f))} J`, RX + RW - 16, SUM_Y);
    ctx.textAlign = 'left';
    ctx.font = font(c, 700, 14);
    ctx.fillStyle = c.label;
    ctx.fillText('all four = the heat meter', STACK_X, SUM_CAP);
    ctx.restore();
  }

  _legend(ctx, c, p, y) {
    ctx.save();
    ctx.beginPath();
    rr(ctx, STACK_X, y - 7, 14, 14, 3);
    ctx.fillStyle = c[p.col];
    ctx.fill();
    ctx.strokeStyle = darken(c[p.col], 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 14);
    ctx.fillStyle = c.label;
    ctx.fillText(p.text, STACK_X + 22, y);
    ctx.textAlign = 'right';
    ctx.font = font(c, 800, 15);
    ctx.fillStyle = c.label;
    ctx.fillText(fmt(p.j), RX + RW - 16, y);
    ctx.restore();
  }

  _askPanel(ctx, c) {
    const [slotY, gapY, noteY] = ASK_Y;
    ctx.save();
    ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -this.clock * 12;
    rr(ctx, STACK_X, slotY, STACK_W, 130, 12);
    ctx.strokeStyle = alpha(c.accent, 0.8);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, 68, true);
    ctx.fillStyle = c.accent;
    ctx.fillText('?', RX + RW / 2, slotY + 64);
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, 20);
    ctx.fillStyle = c.label;
    const f = this._run ? this._run.fric : this._fric;
    ctx.fillText(`${fmt(lossOf(f))} J a turn`, RX + RW / 2, gapY);
    ctx.restore();
    chipRow(ctx, c, [{ text: 'not named here', bg: c.raised, ink: chipInk(c, c.raised) }], RX + RW / 2, noteY, { align: 'center' });
  }

  // -- The three machines, and the sentence ----------------------------------------
  _machinesPanel(ctx, c) {
    const MACH = [
      { name: 'pulley', line: 'shares a load between ropes', col: 's1' },
      { name: 'ramp', line: 'trades a push for a longer push', col: 's2' },
      { name: 'lever', line: 'trades a push for a shorter push', col: 's3' },
    ];
    MACH.forEach((m, i) => {
      const y = MACH_Y[i];
      drawCard(ctx, c, RX, y, RW, MACH_H, 1, {});
      // the schematic gets the left 60 px and the words start clear of it: the
      // name pill used to be centred at RX+78 and sat on the machine's own
      // drawing, which is the one thing the card is a picture of.
      this._machine(ctx, c, m, RX + 8, y + 8, 60, MACH_H - 16);
      pill(ctx, c, m.name, RX + 70, y + 24, { bg: c[m.col], ink: chipInk(c, c[m.col]), size: 14, align: 'left' });
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.font = font(c, 700, 14);
      ctx.fillStyle = c.label;
      wrap(ctx, m.line, RX + 70, y + 48, RW - 84, 17);
      ctx.restore();
    });
  }

  // Three small schematics, drawn at one size each, because this beat compares
  // the trades and not the geometry.
  _machine(ctx, c, m, x, y, w, h) {
    const col = c[m.col];
    const cx = x + w / 2, cy = y + h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (m.name === 'pulley') {
      ctx.strokeStyle = darken(col, 0.3);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -8, 14, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = alpha(c.label, 0.7);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, -30);
      ctx.lineTo(18, -30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -22);
      ctx.lineTo(-14, 20);
      ctx.moveTo(14, -22);
      ctx.lineTo(14, 4);
      ctx.stroke();
      rr(ctx, -22, 20, 16, 14, 3);
      ctx.fillStyle = mix(c.bgSurface, c.gold, 0.62);
      ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.lineTo(14, -10);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(10, -4);
      ctx.lineTo(18, -4);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    } else if (m.name === 'ramp') {
      ctx.beginPath();
      ctx.moveTo(-26, 22);
      ctx.lineTo(26, 22);
      ctx.lineTo(26, 6);
      ctx.closePath();
      ctx.fillStyle = mix(c.bgSurface, c.gold, 0.62);
      ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      rr(ctx, -4, -6, 18, 12, 3);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-22, 20);
      ctx.lineTo(20, 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(12, 2);
      ctx.lineTo(17, 11);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-10, 18);
      ctx.lineTo(0, 2);
      ctx.lineTo(10, 18);
      ctx.closePath();
      ctx.fillStyle = darken(c.gold, 0.25);
      ctx.fill();
      // the bar is the lever: at 0.3 into the ink it was a pale ghost on the
      // light theme's white card, so it is mixed much further and outlined
      ctx.save();
      ctx.rotate(-0.22);
      rr(ctx, -26, -4, 52, 7, 3);
      ctx.fillStyle = mix(c.bgSurface, c.label, 0.62);
      ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      rr(ctx, 8, -14, 14, 12, 3);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-14, 8);
      ctx.lineTo(-14, 24);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, 30);
      ctx.lineTo(-19, 19);
      ctx.lineTo(-9, 19);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.restore();
  }

  _statement(ctx, c) {
    drawCard(ctx, c, SAY.x, SAY.y, SAY.w, SAY.h, 1, { accent: c.accent });
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, 27, true);
    ctx.fillStyle = c.label;
    ctx.fillText('Machines do not create energy.', SAY.x + SAY.w / 2, SAY.y + 36);
    ctx.fillStyle = c.accent;
    ctx.fillText('They help us use it more effectively.', SAY.x + SAY.w / 2, SAY.y + 76);
    ctx.restore();
  }

  // -- The meters ------------------------------------------------------------------
  _cards(ctx, c) {
    const full = (this._run ? this._run.target : this._turns) * IN_PER_TURN;
    const s = this._show;
    const f = this._run ? this._run.fric : this._fric;
    const loss = lossOf(f);
    this._card(ctx, c, CARD_X[0], 'IN', `${fmt(s.in)} J`, c.accent, [
      [s.out / full, c.good],
      [s.heat / full, c.flame],
    ]);
    this._card(ctx, c, CARD_X[1], 'OUT', `${fmt(s.out)} J`, c.good, [[s.out / full, c.good]]);
    this._card(ctx, c, CARD_X[2], 'HEAT', `${fmt(s.heat)} J`, c.flame, [[s.heat / full, c.flame]]);
    this._perTurn(ctx, c, CARD_X[0], `${fmt(IN_PER_TURN)} J a turn`);
    this._perTurn(ctx, c, CARD_X[1], `${fmt(outOf(f))} J a turn`);
    this._perTurn(ctx, c, CARD_X[2], `${fmt(loss)} J a turn`);
  }

  _card(ctx, c, x, name, value, accent, seg) {
    drawCard(ctx, c, x, CARD_Y, CARD_W, CARD_H, 1, { accent });
    pill(ctx, c, name, x + CARD_W / 2, CARD_Y + 18, { bg: accent, ink: chipInk(c, accent), size: 14 });
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = font(c, 800, 25, true);
    ctx.fillStyle = c.label;
    ctx.fillText(value, x + CARD_W / 2, CARD_Y + 44);
    ctx.restore();
    const bx = barX(x);
    ctx.save();
    stadium(ctx, bx, BAR_Y + 2, BAR_W, BAR_H);
    ctx.fillStyle = darken(c.track, 0.3);
    ctx.fill();
    stadium(ctx, bx, BAR_Y, BAR_W, BAR_H);
    ctx.fillStyle = c.track;
    ctx.fill();
    let at = 0;
    for (const [frac, col] of seg) {
      const w = BAR_W * clamp(frac, 0, 1);
      if (w < 1) continue;
      stadium(ctx, bx + at, BAR_Y, Math.max(BAR_H, w), BAR_H);
      ctx.fillStyle = col;
      ctx.fill();
      at += w;
    }
    ctx.restore();
  }

  _perTurn(ctx, c, x, text) {
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = font(c, 700, 14);
    ctx.fillStyle = mix(c.labelMuted, c.label, 0.3);
    ctx.fillText(text, x + CARD_W / 2, CARD_Y + CARD_H - 18);
    ctx.restore();
  }

  _chips(ctx, c) {
    const plain = mix(c.raised, c.label, 0.12);
    let state;
    if (this._cheer > 0) state = { text: 'short on every turn', bg: c.flame };
    else if (this._machines) state = { text: 'three trades, one product', bg: plain };
    else if (this._mount === 'hook' && this.stage >= 1) state = { text: 'where does the difference go?', bg: c.accent };
    else if (this._mount === 'verdict' && this.stage === 2) state = { text: 'at rest', bg: plain };
    else state = { text: this._run ? 'turning' : 'at rest', bg: plain };
    chipRow(ctx, c, [
      { text: state.text, bg: state.bg, ink: chipInk(c, state.bg) },
      { text: `${Math.floor(this._show.n)} of ${this._run ? this._run.target : this._turns} turns`, bg: plain, ink: chipInk(c, plain) },
    ], W / 2, 470, { align: 'center' });
  }

  // -- The wheel, in its own rotated frame ------------------------------------------
  _wheel(ctx, c) {
    const pale = luma(c.bgDeep) > 0.5;
    // The light theme's wall is nearly white, so its metal is mixed much further
    // towards the ink: at 0.44 the wheel was a pale grey ring on a white field.
    const metal = mix(c.bgSurface, c.label, pale ? 0.56 : 0.30);
    const lit = lighten(metal, 0.26);
    const shade = darken(metal, pale ? 0.42 : 0.34);
    ctx.save();
    ctx.translate(WX, WY);
    ctx.rotate(this._ang);
    ctx.beginPath();
    ctx.arc(0, 0, RIM, 0, TAU);
    ctx.arc(0, 0, RIM - RIM_BAND, 0, TAU, true);
    ctx.fillStyle = shade;
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.arc(0, 0, RIM - 1, 0, TAU);
    ctx.arc(0, 0, RIM - RIM_BAND + 1, 0, TAU, true);
    ctx.fillStyle = metal;
    ctx.fill('evenodd');
    for (let i = 0; i < SPOKES; i += 1) {
      const a = (i / SPOKES) * TAU;
      this._spoke(ctx, a, HUB - 4, RIM - RIM_BAND + 2, 15, shade);
      this._spoke(ctx, a, HUB - 4, RIM - RIM_BAND + 2, 9, lit);
    }
    // the pull each magnet exerts on the next: the mechanism, drawn as a mechanism
    ctx.strokeStyle = alpha(c.s6, 0.55);
    ctx.lineWidth = 3;
    for (let i = 0; i < MAGNETS; i += 1) {
      const a0 = (i / MAGNETS) * TAU + rad(24);
      const a1 = a0 + rad(26);
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, RIM - 30, a0, a1);
      ctx.stroke();
      ctx.setLineDash([]);
      const tip = a1;
      const r0 = RIM - 36, r1 = RIM - 23;
      ctx.beginPath();
      ctx.moveTo(Math.cos(tip) * r0, Math.sin(tip) * r0);
      ctx.lineTo(Math.cos(tip) * r1, Math.sin(tip) * r1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(Math.cos(tip - 0.12) * (r1 - 8), Math.sin(tip - 0.12) * (r1 - 8));
      ctx.lineTo(Math.cos(tip) * r1, Math.sin(tip) * r1);
      ctx.lineTo(Math.cos(tip + 0.12) * (r1 - 8), Math.sin(tip + 0.12) * (r1 - 8));
      ctx.closePath();
      ctx.fillStyle = alpha(c.s6, 0.75);
      ctx.fill();
    }
    ctx.setLineDash([]);
    for (let i = 0; i < MAGNETS; i += 1) {
      const a = (i / MAGNETS) * TAU;
      this._bar(ctx, c, Math.cos(a) * (RIM - RIM_BAND / 2), Math.sin(a) * (RIM - RIM_BAND / 2), c.s6, c.glass, a + Math.PI / 2);
    }
    ctx.beginPath();
    ctx.arc(0, 0, HUB, 0, TAU);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, HUB - 5, 0, TAU);
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, TAU);
    ctx.fillStyle = lit;
    ctx.fill();
    // The crank arm is iron like the wheel, the grip is stained wood, and the
    // hand on the grip is the amber one: same warm family, three clear values,
    // so the cluster reads as three things turning rather than one lump. The
    // wood is a step darker than the hand on purpose - at one value the fist
    // swallowed the handle and the pair read as a single blob.
    const wood = darken(c.gold, 0.30);
    const gx = Math.cos(CRANK_OFF) * GRIP_R, gy = Math.sin(CRANK_OFF) * GRIP_R;
    this._arm(ctx, gx, gy, 24, darken(metal, 0.5));
    this._arm(ctx, gx, gy, 16, metal);
    this._arm(ctx, gx, gy, 7, lit);
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(CRANK_OFF + Math.PI / 2);
    rr(ctx, -12, -29, 24, 58, 11);
    ctx.fillStyle = darken(wood, 0.45);
    ctx.fill();
    rr(ctx, -9, -26, 18, 52, 9);
    ctx.fillStyle = wood;
    ctx.fill();
    rr(ctx, -3, -21, 4, 42, 2);
    ctx.fillStyle = lighten(wood, 0.32);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    this._hand(ctx, c, gx, gy);
  }

  // One spoke, as a filled bar along the ray.
  _spoke(ctx, a, r0, r1, w, col) {
    const c0 = Math.cos(a), s0 = Math.sin(a);
    const px = -s0 * (w / 2), py = c0 * (w / 2);
    ctx.beginPath();
    ctx.moveTo(c0 * r0 + px, s0 * r0 + py);
    ctx.lineTo(c0 * r1 + px, s0 * r1 + py);
    ctx.lineTo(c0 * r1 - px, s0 * r1 - py);
    ctx.lineTo(c0 * r0 - px, s0 * r0 - py);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }

  // The crank arm, the same bar at three widths: casing, body, highlight.
  _arm(ctx, gx, gy, w, col) {
    this._spoke(ctx, CRANK_OFF, HUB - 8, Math.hypot(gx, gy) + 4, w, col);
  }

  // A bar magnet, two poles, drawn at (x, y) in whatever frame it is called in.
  _bar(ctx, c, x, y, north, south, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    rr(ctx, -25, -12, 50, 24, 5);
    ctx.fillStyle = darken(north, 0.5);
    ctx.fill();
    rr(ctx, -24, -11, 23, 22, 4);
    ctx.fillStyle = north;
    ctx.fill();
    rr(ctx, -1, -11, 24, 22, 4);
    ctx.fillStyle = south;
    ctx.fill();
    ctx.fillStyle = alpha(c.bgDeep, 0.35);
    ctx.fillRect(-2, -11, 3, 22);
    ctx.restore();
  }

  // The hand on the grip: a fist, because at twenty-five turns a second anything
  // more detailed is a smudge. Drawn in the wheel's own frame, so it travels
  // the crank's circle exactly as the crank does. The fingers are four separate
  // bars crossing the grip with a gap of wood between each - one flat lozenge
  // with two scratches on it read as a lump, not a hand.
  _hand(ctx, c, gx, gy) {
    ctx.save();
    ctx.translate(WX, WY);
    ctx.rotate(this._ang);
    ctx.translate(gx, gy);
    ctx.rotate(CRANK_OFF + Math.PI / 2);
    // the sleeved forearm, running out past the rim: tapered, with a cuff
    ctx.beginPath();
    ctx.moveTo(14, -15);
    ctx.lineTo(60, -11);
    ctx.lineTo(60, 11);
    ctx.lineTo(14, 15);
    ctx.closePath();
    ctx.fillStyle = darken(c.s5, 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -13);
    ctx.lineTo(58, -9.5);
    ctx.lineTo(58, 9.5);
    ctx.lineTo(16, 13);
    ctx.closePath();
    ctx.fillStyle = c.s5;
    ctx.fill();
    ctx.strokeStyle = darken(c.s5, 0.42);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, -10.5);
    ctx.lineTo(30, 10.5);
    ctx.moveTo(48, -9.5);
    ctx.lineTo(48, 9.5);
    ctx.stroke();
    // the palm, behind the fingers and darker than they are
    rr(ctx, -21, -25, 42, 50, 13);
    ctx.fillStyle = darken(c.s2, 0.46);
    ctx.fill();
    // four fingers, each crossing the grip, wood showing between them
    for (let i = 0; i < 4; i += 1) {
      const y = -21 + i * 12;
      rr(ctx, -20, y, 40, 10, 5);
      ctx.fillStyle = darken(c.s2, 0.3);
      ctx.fill();
      rr(ctx, -18.5, y + 1, 37, 8, 4);
      ctx.fillStyle = i === 1 ? lighten(c.s2, 0.18) : c.s2;
      ctx.fill();
    }
    // the thumb, laid along the top of the fist
    ctx.save();
    ctx.rotate(-0.34);
    rr(ctx, -22, -34, 34, 15, 7.5);
    ctx.fillStyle = darken(c.s2, 0.36);
    ctx.fill();
    rr(ctx, -20.5, -32.5, 31, 12, 6);
    ctx.fillStyle = lighten(c.s2, 0.2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

// J with no trailing .0, so 1200 J and 12 J read as the same kind of number.
function fmt(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : `${r.toFixed(1)}`;
}

// Two or three words on as many lines as they need, never wider than `max`.
function wrap(ctx, text, x, y, max, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, yy);
}

// A chip's ink by measured contrast, not by theme. Relative luminance, not the
// kit's `luma`: that one is a gamma-naive weighted mean and it picks the wrong
// ink on a mid-tone accent, which the browser report then fails on contrast.
function lum(col) {
  const s = String(col).trim();
  const h = /^#([0-9a-f]{3,8})$/i.exec(s);
  let r, g, b;
  if (h) {
    const d = h[1].length <= 4 ? h[1].split('').map((ch) => ch + ch).join('') : h[1];
    r = parseInt(d.slice(0, 2), 16); g = parseInt(d.slice(2, 4), 16); b = parseInt(d.slice(4, 6), 16);
  } else {
    const m = /rgba?\(([^)]+)\)/i.exec(s);
    if (!m) return 0;
    [r, g, b] = m[1].split(/[\s,/]+/).slice(0, 3).map(Number);
  }
  const v = (u) => { const x = u / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * v(r) + 0.7152 * v(g) + 0.0722 * v(b);
}
function contrast(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function chipInk(c, col) { return contrast(c.label, col) >= contrast(c.bgDeep, col) ? c.label : c.bgDeep; }
