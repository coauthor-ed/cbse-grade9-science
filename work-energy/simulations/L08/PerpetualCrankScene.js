import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawDepth, drawShelf, drawCard, drawShadow, luma,
  pill, chipRow, leader, font, mix, alpha, lighten, darken, rr, stadium,
} from 'simulations/base/kit/SimLook.js';

const TAU = Math.PI * 2;
const rad = (deg) => (deg * Math.PI) / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// -- The machine -------------------------------------------------------------------
const WX = 268, WY = 182, RIM = 118;      // the wheel: centre and rim radius
const HUB = 24, SPOKES = 6, MAGNETS = 4;
const RIM_BAND = 18;                       // the rim's own width
const GRIP_R = RIM * 0.60;                  // the hand travels the crank's own circle
const CRANK_OFF = rad(-34);                 // where the crank arm starts, at rest
const WALL = { x0: 24, y0: 60, x1: 664, y1: 338 };
const CABINET = { x0: 118, x1: 424, y: 300 };
const SHELF_Y = 176;

// -- The three meters --------------------------------------------------------------
const IN_PER_TURN = 12;                     // J a hand puts in on one turn
const AIR = 0.6, BEARING = 0.4;             // J a turn, fixed, outside the dial
const FRIC_MIN = 0.6, FRIC_MAX = 3.0, FRIC_STEP = 0.3, FRIC_START = 1.2;
const TURNS_MIN = 20, TURNS_MAX = 160, TURNS_STEP = 10, TURNS_START = 100;
const TURN_RATE = 10;                       // rev/s: 10x a hand, named in the note line
const SHOW_HZ = 5;                          // a number redrawn 10x a second is unreadable
const CELEBRATE_TURNS = 20;

// Every reading on the panel goes through these two, so nothing can disagree.
// The clamp is the whole point: a host that sends 0, -5 or something that is not
// a number at all still cannot make the output reach the input.
function friction(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return FRIC_MIN;
  return clamp(Math.round(n / FRIC_STEP) * FRIC_STEP, FRIC_MIN, FRIC_MAX);
}
function lossPerTurn(f) { return clamp(f, FRIC_MIN, FRIC_MAX) + AIR + BEARING; }
function outPerTurn(f) { return IN_PER_TURN - lossPerTurn(f); }

// The cards, side by side across the bottom, bars sharing a left origin.
const CARD_Y = 342, CARD_H = 110, CARD_W = 206;
const CARD_X = [16, 238, 460];
const BAR_W = 182, BAR_Y = 402, BAR_H = 20;
const FULL = (turns) => turns * IN_PER_TURN;
const barX = (cardX) => cardX + (CARD_W - BAR_W) / 2;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],   // at rest: the learner cranks it themselves
  [{ idx: 1, dwellMs: null }],   // the long run, climbing
  [{ idx: 2, dwellMs: null }],   // the run held, the question on the panel
];

export class PerpetualCrankScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = true;
  static ARIA_LABEL = 'A crank wheel with four bar magnets on its rim stands on a workbench, an amber hand on the grip at the end of a crank arm. Below it three meters side by side count the work that goes in, the work that comes out, and the heat. A crank button runs the wheel for a set number of turns and a friction dial sets how much each turn loses at the pivot, never to zero. The input bar is drawn in two parts: the green part is the output and the flame part is the shortfall, and the heat meter is exactly as long as that flame part, so the output is always behind the input and the gap grows on every turn.';
  static NOTE_STAGE = 0;
  static NOTE_STYLE = 'line';
  static CONTROLS = [
    { type: 'button', id: 'crank', label: 'Crank it' },
    { type: 'slider', id: 'turns', label: 'Turns to crank', min: TURNS_MIN, max: TURNS_MAX, step: TURNS_STEP, value: TURNS_START, suffix: '' },
    { type: 'slider', id: 'friction', label: 'Friction at the pivot (J a turn)', min: FRIC_MIN, max: FRIC_MAX, step: FRIC_STEP, value: FRIC_START, suffix: ' J' },
  ];

  _fric = FRIC_START;
  _turns = TURNS_START;
  _ang = 0;                 // the wheel's own angle
  _done = 0;                // whole turns finished
  _run = null;              // { stage, target, frac, from, fric }
  _drag = null;             // { last, moved }
  _touched = { turns: false, friction: false };
  _found = false;
  _cheer = 0;
  _show = { in: 0, out: 0, heat: 0, n: 0 };   // the values actually printed
  _showT = 0;

  noteRows() {
    return [{ text: 'Same loss every turn. Drawn ten times faster than a hand.' }];
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
    // The slide asks for a hundred turns, and a resumed lesson has to reach the
    // same picture as one that walked here.
    if (stage >= 1) this._crank();
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
      this._touched.turns = true;
    } else if (id === 'friction') {
      this._fric = friction(value);
      this._touched.friction = true;
    } else if (id === 'crank') this._crank();
    else return;
    this.requestUiUpdate?.();
  }

  // -- Pointer: the hand turns the wheel, and a tap is the button ------------------
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
    this._turn(d / TAU);
    return true;
  }

  pointerUp(p) {
    const g = this._drag;
    this._drag = null;
    if (!g) return;
    if (g.moved < 6) this._crank();              // a tap on the wheel: the phone's Crank
  }

  // -- The model --------------------------------------------------------------------
  _crank() {
    if (this._run) return;
    this._run = { stage: this.stage, target: this._turns, frac: 0, from: this._done, fric: this._fric };
    this._done = 0;
    this._publish(true);
  }

  // Whole turns only: nothing is ever shown for a fraction of a turn, so "behind
  // on every turn" is true of every number the panel has ever printed.
  // A hand-driven turn: the meter moves with the wheel, at the same rate a run
  // moves it, and the printed value is republished so the two cannot differ.
  _turn(frac) {
    if (frac <= 0) return;
    this._done += frac;
    this._ang += frac * TAU;
    this._publish();
  }

  // The one place the printed numbers are made.
  _publish(force = false) {
    const n = this._done;
    const loss = lossPerTurn(this._run ? this._run.fric : this._fric);
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

  // The concept, found and not pressed: the best bearings this panel allows, and
  // enough turns for the shortfall to be a fact rather than a rounding error.
  _maybeFind() {
    if (this._found) return;
    if (this._fric > FRIC_MIN + 1e-9) return;
    if (this._done < CELEBRATE_TURNS) return;
    this._found = true;
    const bx = barX(CARD_X[0]) + BAR_W * (1 - this._gapFrac() / 2);
    this.celebrate(bx, BAR_Y + BAR_H / 2, 26);
    this.floatText('still short', bx, BAR_Y - 16, { bg: this.colors.flame, size: 16 });
    this._cheer = 1.4;
  }

  _gapFrac() {
    return lossPerTurn(this._run ? this._run.fric : this._fric) / IN_PER_TURN;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawDepth(ctx, c, { t: this.clock, n: 5, k: 0.7 });
    this._wall(ctx, c);
    this._shelf(ctx, c);
    this._bench(ctx, c);
    this._wheel(ctx, c);
    this._cards(ctx, c);
    this._chips(ctx, c);
  }

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
    // the pegboard: a grid of holes, faint, so the wall is a surface and not a stripe
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

  // The cabinet the wheel is bolted to, and the axle post behind it. The wheel
  // is spoked and open, so the post is seen through it, which is what makes the
  // wheel look held up rather than floating.
  _bench(ctx, c) {
    const { x0, x1, y } = CABINET;
    const wood = mix(c.bgSurface, c.gold, 0.34);
    drawShadow(ctx, c, (x0 + x1) / 2, y + 46, (x1 - x0) / 2, 9);
    // the post, behind the wheel: a dark casing and a lit core
    ctx.save();
    ctx.fillStyle = darken(c.stroke, 0.55);
    rr(ctx, WX - 11, WY + 4, 22, y - WY + 4, 6);
    ctx.fill();
    ctx.fillStyle = c.stroke;
    rr(ctx, WX - 6, WY + 4, 12, y - WY + 4, 5);
    ctx.fill();
    ctx.restore();
    // the cabinet: its body runs down to the foot of the wall, so it stands
    // against it rather than hanging on it
    rr(ctx, x0 + 6, y + 6, x1 - x0 - 12, 40, 7);
    ctx.fillStyle = darken(wood, 0.3);
    ctx.fill();
    rr(ctx, x0, y, x1 - x0, 30, 7);
    ctx.fillStyle = darken(wood, 0.18);
    ctx.fill();
    rr(ctx, x0, y, x1 - x0, 22, 7);
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(x0 + 12, y + 3, x1 - x0 - 24, 3);
    // one drawer front and its pull, so the box has a face
    rr(ctx, x0 + 26, y + 26, x1 - x0 - 52, 16, 4);
    ctx.fillStyle = darken(wood, 0.26);
    ctx.fill();
    rr(ctx, (x0 + x1) / 2 - 26, y + 31, 52, 6, 3);
    ctx.fillStyle = darken(c.gold, 0.15);
    ctx.fill();
  }

  _shelf(ctx, c) {
    // brackets first, so the shelf is held up rather than floating
    ctx.save();
    for (const bx of [440, 640]) {
      ctx.beginPath();
      ctx.moveTo(bx, SHELF_Y + 4);
      ctx.lineTo(bx, SHELF_Y + 26);
      ctx.lineTo(bx + (bx < 540 ? 22 : -22), SHELF_Y + 4);
      ctx.closePath();
      ctx.fillStyle = darken(c.gold, 0.5);
      ctx.fill();
    }
    ctx.restore();
    drawShelf(ctx, c, 424, 656, SHELF_Y, { col: c.gold });
    // a spare bar magnet, a disc magnet and a bearing ring: the same three things
    // the machine is made of, off the machine, and all three resting on the shelf.
    this._bar(ctx, c, 464, SHELF_Y - 13, c.s6, c.glass, 0);
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, SHELF_Y - 12, 15, Math.PI, TAU);
    ctx.fillStyle = c.glass;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(540, SHELF_Y - 12, 15, 0, Math.PI);
    ctx.fillStyle = c.s6;
    ctx.fill();
    ctx.strokeStyle = darken(c.s6, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(540, SHELF_Y - 12, 15, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = darken(c.stroke, 0.2);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(606, 134, 15, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(606, 134, 15, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  _cards(ctx, c) {
    const full = FULL(this._run ? this._run.target : this._turns);
    const s = this._show;
    const loss = s.heat > 0 ? s.heat / s.n : lossPerTurn(this._fric);
    this._card(ctx, c, CARD_X[0], 'IN', `${fmt(s.in)} J`, c.accent, [
      [s.out / full, c.good],
      [s.heat / full, c.flame],
    ]);
    this._card(ctx, c, CARD_X[1], 'OUT', `${fmt(s.out)} J`, c.good, [[s.out / full, c.good]]);
    this._card(ctx, c, CARD_X[2], 'HEAT', `${fmt(s.heat)} J`, c.flame, [[s.heat / full, c.flame]]);
    // the per-turn figures: the claim "on every turn" is three small numbers
    this._perTurn(ctx, c, CARD_X[0], `${fmt(IN_PER_TURN)} J a turn`);
    this._perTurn(ctx, c, CARD_X[1], `${fmt(IN_PER_TURN - loss)} J a turn`);
    this._perTurn(ctx, c, CARD_X[2], `${fmt(loss)} J a turn`);
  }

  _card(ctx, c, x, name, value, accent, parts) {
    drawCard(ctx, c, x, CARD_Y, CARD_W, CARD_H, 1, { accent });
    pill(ctx, c, name, x + CARD_W / 2, CARD_Y + 18, { bg: accent, ink: chipInk(c, accent), size: 14 });
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = font(c, 800, 25, true);
    ctx.fillStyle = c.label;
    ctx.fillText(value, x + CARD_W / 2, CARD_Y + 46);
    ctx.restore();
    // the bar: one track, its parts in order, so lengths compare across cards
    const bx = barX(x);
    ctx.save();
    stadium(ctx, bx, BAR_Y + 2, BAR_W, BAR_H);
    ctx.fillStyle = darken(c.track, 0.3);
    ctx.fill();
    stadium(ctx, bx, BAR_Y, BAR_W, BAR_H);
    ctx.fillStyle = c.track;
    ctx.fill();
    let at = 0;
    for (const [frac, col] of parts) {
      const fw = BAR_W * clamp(frac, 0, 1);
      if (fw < 0.5) continue;
      stadium(ctx, bx + at, BAR_Y, Math.max(BAR_H, fw), BAR_H);
      ctx.fillStyle = col;
      ctx.fill();
      if (fw > 26) {
        stadium(ctx, bx + at + BAR_H * 0.35, BAR_Y + BAR_H * 0.2, fw - BAR_H * 0.7, BAR_H * 0.24);
        ctx.fillStyle = alpha(lighten(col, 0.6), 0.55);
        ctx.fill();
      }
      at += fw;
    }
    ctx.restore();
  }

  _perTurn(ctx, c, x, text) {
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = font(c, 700, 14);
    ctx.fillStyle = mix(c.labelMuted, c.label, 0.3);
    ctx.fillText(text, x + CARD_W / 2, CARD_Y + CARD_H - 16);
    ctx.restore();
  }

  _chips(ctx, c) {
    const b = chipRow(ctx, c, [
      { text: 'the crank wheel', bg: c.accent, ink: chipInk(c, c.accent) },
      { text: 'magnet on the rim', bg: c.s6, ink: chipInk(c, c.s6) },
    ], W / 2, 34, { align: 'center' });
    // The leader stops on the wall just clear of the rim, never on the rim
    // itself: the wheel turns, so a fixed point on it is a magnet on some frames
    // and bare metal on others, and the ringed dot read as a blemish.
    leader(ctx, b.x1 - 26, b.y1 + 6, WX + RIM + 30, WY - RIM + 16, alpha(c.s6, 0.9), 0.8, this.clock);
    const state = this.stage === 0
      ? (this._done ? `${this._done} turns by hand` : 'turn the handle')
      : this.stage === 2
        ? 'where does the difference go?'
        : (this._run ? 'turning' : 'the run is held');
    const plain = mix(c.raised, c.label, 0.12);
    chipRow(ctx, c, [
      { text: state, bg: this.stage === 2 ? c.accent : plain, ink: chipInk(c, this.stage === 2 ? c.accent : plain) },
      { text: `${this._show.n} of ${this._run ? this._run.target : this._turns} turns`, bg: plain, ink: chipInk(c, plain) },
    ], W / 2, 470, { align: 'center' });
  }

  // The wheel, in its own rotated frame. A spoked iron rim: a solid body colour
  // with a dark cushion and one lit edge, so it reads as metal in both themes
  // instead of dissolving into the wall behind it. The light theme's wall is
  // nearly white, so its metal is mixed further towards the ink.
  _wheel(ctx, c) {
    const pale = luma(c.bgDeep) > 0.5;
    const metal = mix(c.bgSurface, c.label, pale ? 0.44 : 0.30);
    const lit = lighten(metal, 0.26);
    const shade = darken(metal, 0.34);
    ctx.save();
    ctx.translate(WX, WY);
    // the post's shadow on the wheel, so the wheel is in front of the post
    ctx.rotate(this._ang);
    // rim: outer ring, then the cushion, then the lit inner edge
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
    // spokes, as filled bars: a wide dark one and a narrower lit one on top
    for (let i = 0; i < SPOKES; i += 1) {
      const a = (i / SPOKES) * TAU;
      this._spoke(ctx, a, HUB - 4, RIM - RIM_BAND + 2, 15, shade);
      this._spoke(ctx, a, HUB - 4, RIM - RIM_BAND + 2, 9, lit);
    }
    // the pull each magnet exerts on the next: the mechanism the slide names,
    // drawn as a mechanism and not as a sentence
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
    // the magnets: blocks clamped across the rim, each the same way round
    for (let i = 0; i < MAGNETS; i += 1) {
      const a = (i / MAGNETS) * TAU;
      this._bar(ctx, c, Math.cos(a) * (RIM - RIM_BAND / 2), Math.sin(a) * (RIM - RIM_BAND / 2), c.s6, c.glass, a + Math.PI / 2);
    }
    // the hub and its bearing cap
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
    // the crank arm out to the grip: a tapered bar, dark casing then bright body
    const gx = Math.cos(CRANK_OFF) * GRIP_R, gy = Math.sin(CRANK_OFF) * GRIP_R;
    this._arm(ctx, gx, gy, 26, shade);
    this._arm(ctx, gx, gy, 17, c.s4);
    this._arm(ctx, gx, gy, 8, lighten(c.s4, 0.3));
    // the grip the hand closes on
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(CRANK_OFF + Math.PI / 2);
    rr(ctx, -11, -22, 22, 44, 10);
    ctx.fillStyle = darken(c.s5, 0.5);
    ctx.fill();
    rr(ctx, -8, -20, 16, 40, 8);
    ctx.fillStyle = c.s5;
    ctx.fill();
    rr(ctx, -4, -16, 4, 32, 2);
    ctx.fillStyle = lighten(c.s5, 0.4);
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
    const a = CRANK_OFF;
    this._spoke(ctx, a, HUB - 8, Math.hypot(gx, gy) + 4, w, col);
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

  // The hand on the grip: a mitt, because at ten turns a second anything more
  // detailed than this is a smudge. It is drawn in the wheel's own frame, so it
  // travels the crank's circle exactly as the crank does.
  _hand(ctx, c, gx, gy) {
    ctx.save();
    ctx.translate(WX, WY);
    ctx.rotate(this._ang);
    ctx.translate(gx, gy);
    ctx.rotate(CRANK_OFF + Math.PI / 2);
    // the forearm, running out past the rim
    ctx.beginPath();
    ctx.moveTo(16, -13);
    ctx.lineTo(64, -10);
    ctx.lineTo(64, 10);
    ctx.lineTo(16, 13);
    ctx.closePath();
    ctx.fillStyle = darken(c.s5, 0.45);
    ctx.fill();
    // the rolled cuff
    rr(ctx, 34, -15, 16, 30, 7);
    ctx.fillStyle = c.s5;
    ctx.fill();
    // the back of the hand
    rr(ctx, -22, -12, 46, 24, 11);
    ctx.fillStyle = darken(c.s2, 0.45);
    ctx.fill();
    rr(ctx, -20, -11, 42, 22, 10);
    ctx.fillStyle = c.s2;
    ctx.fill();
    // the thumb, closed over the grip
    rr(ctx, -14, -26, 17, 18, 8);
    ctx.fillStyle = darken(c.s2, 0.3);
    ctx.fill();
    rr(ctx, -13, -25, 15, 15, 7);
    ctx.fillStyle = lighten(c.s2, 0.22);
    ctx.fill();
    // two knuckle creases, so the mitt has fingers in it
    ctx.strokeStyle = darken(c.s2, 0.42);
    ctx.lineWidth = 2;
    for (const kx of [2, 12]) {
      ctx.beginPath();
      ctx.moveTo(kx, -10);
      ctx.lineTo(kx, 10);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// J with no trailing .0, so 1200 J and 12 J read as the same kind of number.
function fmt(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : `${r.toFixed(1)}`;
}

// A chip's ink by measured contrast, not by theme: near-black on near-white,
// whichever reads better on that fill. Both extremes are theme tokens.
function lum(col) {
  const s = String(col).trim();
  let h = /^#([0-9a-f]{3,8})$/i.exec(s);
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
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function chipInk(c, col) { return ratio(c.label, col) >= ratio(c.bgDeep, col) ? c.label : c.bgDeep; }
