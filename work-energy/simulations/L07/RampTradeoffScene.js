import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, mix, alpha, darken, lighten, luma, font, inOutSine, rr,
  drawBackdrop, drawDepth, drawFloor, drawVignette, drawCard, drawMeter,
  drawShadow, drawSpotlight, pill,
} from 'simulations/base/kit/SimLook.js';

// -- The one rule ---------------------------------------------------------------------
// Effort, distance and work are three views of a single number L. There is no other
// arithmetic in this file, so no setting of the dial can move the work counter.
const MASS_KG = 30;                 // the bundle's own load, as on s07
const G = 10;                       // N/kg (OUTLINE.md)
const LOAD_N = MASS_KG * G;         // 300 N
const HEIGHT_M = 1.0;               // m - the one lift, fixed by the ledge
const WORK_J = LOAD_N * HEIGHT_M;   // 300 J, at every length the dial can reach

// The three beats' opening lengths. Beat 2 is the ten-kilometre ramp the slide names.
const L_START = 2;                  // m - a 1-in-2 ramp: effort and distance close together
const L_BEAT = [L_START, 20, 10000];
const L_MIN = 1, L_MAX = 100000;    // m - no stop anywhere near a "reasonable" value

// Where each reading's bar tops out.
const F_MAX = LOAD_N;               // effort rail: full = the whole load, a straight lift
const S_MAX = 3;                    // distance rail: full = 3 m, where the foot leaves frame
const FOUND_M = S_MAX;              // reaching it is the one moment worth a celebration

// -- The set, in the 680x520 design space ------------------------------------------------
const FLOOR_Y = 340;
const PXM = 195;                    // px per metre. One scale, never rescaled.
const LEDGE_H = PXM * HEIGHT_M;     // 195: the 1 m rise, drawn on that same scale
const FOOT_X = 20;                  // where a 3 m ramp's foot lands - the left margin
const LEDGE_X = FOOT_X + S_MAX * PXM;   // 605: the plank always starts here
const LEDGE_W = 56;
const PLANK_W = 22;
const CRATE_W = 50, CRATE_H = 44, TRAY_H = 14, TRAY_W = 62;
const ARROW_BACK = 150;             // px down-slope from the ledge where the effort sits

const RUL_Y = 52, RUL_X0 = 145, RUL_X1 = 650;
const RUL_TICKS = [1, 10, 100, 1000, 10000, 100000];

const CARD_Y = 372, CARD_H = 116, CARD_W = 214;
const CARD_X = [18, 233, 448];

const EASE_S = 0.8;                 // the handle settles to a beat's length over this
const HOLD_S = 2.0;                 // and the loop stays awake this long afterwards

const STAGE_NAME = ['a sensible ramp', 'a very long ramp', 'the extreme'];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

// -- helpers ---------------------------------------------------------------------------

// The ruler is a true log10 ruler in metres: its left end is 1 m and its right end
// 100 km, five decades wide, and every tick sits at logT of the length it names.
const RUL_DECADES = 5;
const logT = (m) => Math.log10(m) / RUL_DECADES;
const invT = (t) => Math.pow(10, Math.max(0, Math.min(1, t)) * RUL_DECADES);
const RUL_SPAN = RUL_X1 - RUL_X0;
const tickX = (m) => RUL_X0 + logT(m) * RUL_SPAN;

function fmtLen(m) {
  if (m >= 1000) return `${trim(m / 1000)} km`;
  return `${trim(m)} m`;
}
function fmtN(n) {
  if (n >= 10) return `${trim(n)} N`;
  if (n >= 1) return `${trim(n)} N`;
  if (n >= 0.01) return `${n.toFixed(2)} N`;
  return `${n.toFixed(3)} N`;
}
function trim(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

// The three readings. Nothing else computes a number the scene draws.
const effortOf = (L) => WORK_J / L;
const ratio = (v, base) => {
  if (v < base * 0.98) return `\u00f7${trim(base / v)}`;
  if (v > base * 1.02) return `\u00d7${trim(v / base)}`;
  return 'unchanged';
};


function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

// A series colour used as TEXT - on a panel card or on a neutral chip. c.bgDeep is
// near-white in the light theme, so the token has to be pushed away from the surface it
// is read on, not used as drawn. A coloured chip FILL is not used for text anywhere in
// this scene: pill() lays a lighten() gloss strip over the top of it, which drops a
// light ink on a mid fill to about 2.3:1.
function onCard(c, col) {
  return luma(c.bgDeep) < 0.5 ? lighten(col, 0.12) : darken(col, 0.45);
}

// The plank and the ledge: a mid tone that reads against the wall in BOTH themes -
// lifted above the surface in the dark theme, sunk below it in the light one.
function boardTone(c) {
  return luma(c.bgDeep) < 0.5 ? lighten(c.raised, 0.34) : darken(c.raised, 0.2);
}

// A thick board drawn across its own direction, so its drawn length is its real length.
function board(ctx, col, ax, ay, bx, by, w) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  ctx.save();
  ctx.translate((ax + bx) / 2, (ay + by) / 2);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = col;
  rr(ctx, -len / 2, -w / 2, len, w, 4);
  ctx.fill();
  ctx.restore();
  // u points up-slope towards the ledge, n points down from the plank
  return { u: { x: dx / len, y: dy / len }, n: { x: dy / len, y: -dx / len }, len };
}

// An arrow along a direction, at least minLen long whatever the reading says.
function arrow(ctx, col, x, y, u, len, minLen = 12, wide = 5) {
  const L = Math.max(minLen, len);
  const hx = x + u.x * L, hy = y + u.y * L;
  const head = Math.min(10, L * 0.44);
  const sx = hx - u.x * head, sy = hy - u.y * head;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = wide;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(sx - u.y * head * 0.6, sy + u.x * head * 0.6);
  ctx.lineTo(sx + u.y * head * 0.6, sy - u.x * head * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A dashed dimension line between two points, offset along (nx, ny), reading on it.
function dimension(ctx, c, ax, ay, bx, by, nx, ny, off, text, col) {
  const x0 = ax + nx * off, y0 = ay + ny * off;
  const x1 = bx + nx * off, y1 = by + ny * off;
  ctx.save();
  ctx.strokeStyle = alpha(col, 0.9);
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  for (const [tx, ty] of [[x0, y0], [x1, y1]]) {
    ctx.beginPath();
    ctx.moveTo(tx - px * 6, ty - py * 6);
    ctx.lineTo(tx + px * 6, ty + py * 6);
    ctx.stroke();
  }
  if (!text) { ctx.restore(); return; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(c, 800, 15);
  ctx.fillStyle = col;
  ctx.fillText(text, (x0 + x1) / 2 + nx * 15, (y0 + y1) / 2 + ny * 15);
  ctx.restore();
}

export class RampTradeoffScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = 520;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A crate one metre up on a ledge, on a plank that gets longer as you drag the ramp-length ruler at the top of the picture. Three reading cards sit along the bottom: the effort needed to push the crate up the plank, which falls as the plank gets longer; the distance you have to push it, and runs off the edge of the frame past three metres. A dashed ghost holds the ramp it started from, so the extra length is visible. Three reading cards sit along the bottom: the effort needed to push the crate up the plank, which falls as the plank gets longer; the distance you have to push it, which rises by the same factor and eventually runs past the end of its own scale; and the work counter in the middle, which reads three hundred joules at every setting.';
  static NOTE_STAGE = 0;
  static NOTE_STYLE = 'line';
  static NOTE_TITLE = 'NOTE';
  static CONTROLS = [
    { type: 'button', id: 'x10', label: 'Ten times longer' },
    { type: 'button', id: 'sensible', label: 'Back to a sensible ramp' },
  ];

  _len = L_START;
  _row = null;
  _drag = false;
  _found = false;

async setup() {
    await super.setup();
    this._len = L_BEAT[this.stage] ?? L_START;
    this._row = null;
    this._drag = false;
    this._found = false;
  }

  // Each beat opens on its own length, set rather than animated: the stub's beats are
  // three states, and a scripted ease would leave `_row` depending on the route the
  // learner took to this beat, which is exactly what the resume gate measures.
  enter(stage) {
    this._len = L_BEAT[Math.min(stage, L_BEAT.length - 1)] ?? L_START;
    this._row = null;
    this._drag = false;
    this._found = false;
  }

  busy() {
    if (this._drag) return true;
    return !!this._row && !this._row.done;
  }

  // -- the interaction ------------------------------------------------------------------

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'x10') this.setLength(this._len * 10);
    else if (id === 'sensible') this.setLength(L_START);
    this.requestUiUpdate?.();
  }

  setLength(m) {
    const to = Math.max(L_MIN, Math.min(L_MAX, m));
    this._row = { from: this._len, to, t: 0, done: false };
    this.animateFor((EASE_S + HOLD_S) * 1000);
    if (!this._found && this._len < FOUND_M && to >= FOUND_M) {
      this._found = true;
      this.celebrate(CARD_X[1] + CARD_W / 2, CARD_Y + 50);
    }
  }

  pointerDown(p) {
    for (let d = 0; d < RUL_TICKS.length; d++) {
      if (inRect(p, { x: tickX(RUL_TICKS[d]) - 28, y: 6, w: 56, h: 32 })) {
        this.setLength(RUL_TICKS[d]);
        return;
      }
    }
    if (inRect(p, { x: RUL_X0 - 22, y: 34, w: RUL_X1 - RUL_X0 + 44, h: 30 })) {
      this._drag = true;
      this.setLength(invT((p.x - RUL_X0) / RUL_SPAN));
    }
  }

  pointerMove(p) {
    if (this._drag) this.setLength(invT((p.x - RUL_X0) / RUL_SPAN));
  }

  pointerUp() { this._drag = false; }

  update(d) {
    const r = this._row;
    if (!r || r.done || this._drag) return;
    const dt = Math.max(0, Math.min(d, 0.05));
    r.t += dt;
    const p = Math.min(1, r.t / EASE_S);
    this._len = r.from + (r.to - r.from) * inOutSine(p);
    if (p >= 1) {
      this._len = r.to;
      r.done = true;
      this.requestUiUpdate?.();
    }
  }

  // -- the drawing ----------------------------------------------------------------------

  _topY() { return FLOOR_Y - LEDGE_H; }
  _footX() { return LEDGE_X - this._len * PXM; }
  // The plank's height above the floor at a given x, on the one scale.
  _yAt(x) {
    const foot = this._footX();
    return FLOOR_Y - (x - foot) * (LEDGE_H / (this._len * PXM));
  }

  draw(ctx, c) {
    const t = this.clock;
    const L = this._len;
    const F = effortOf(L);
    drawBackdrop(ctx, c, 'dots');
    drawDepth(ctx, c, { t });
    this._wall(ctx, c);
    this._stageChip(ctx, c);
    this._lamp(ctx, c, t);
    drawFloor(ctx, c, FLOOR_Y, { seams: true });
    this._tape(ctx, c);
    this._plank(ctx, c, L, F);
    this._ruler(ctx, c, L);
    this._cards(ctx, c, L, F);
    drawVignette(ctx, c, 0.7);
  }

  _wall(ctx, c) {
    const col = mix(c.bgDeep, c.raised, 0.5);
    ctx.save();
    ctx.fillStyle = alpha(col, 0.75);
    ctx.fillRect(0, 74, W, FLOOR_Y - 74);
    ctx.restore();
  }

  // Which of the three states the panel is in, in the corner the ramp never reaches.
  _stageChip(ctx, c) {
    pill(ctx, c, STAGE_NAME[Math.min(this.stage, STAGE_NAME.length - 1)], 20, 158,
      { bg: c.raised, ink: c.label, size: 14, align: 'left' });
  }

  // A lamp in the empty top-left corner, so the pool of light on the ramp has a source.
  _lamp(ctx, c, t) {
    const x = 70, y = 92, sway = Math.sin(t * 0.7) * 0.03;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24); ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = c.gold;
    ctx.beginPath();
    ctx.moveTo(-20, 20); ctx.lineTo(20, 20); ctx.lineTo(13, 0); ctx.lineTo(-13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lighten(c.gold, 0.4);
    ctx.beginPath(); ctx.ellipse(0, 20, 20, 5, 0, 0, 7); ctx.fill();
    ctx.restore();
    drawSpotlight(ctx, c, 330, 250, 300, 0.45);
  }

  // A ground ruler in metres, at the same 117 px per metre as the plank.
  _tape(ctx, c) {
    ctx.save();
    ctx.fillStyle = c.raised;
    ctx.fillRect(FOOT_X, FLOOR_Y, LEDGE_X - FOOT_X + 10, 26);
    ctx.strokeStyle = alpha(c.stroke, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(FOOT_X, FLOOR_Y); ctx.lineTo(LEDGE_X + 10, FLOOR_Y);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    ctx.fillStyle = c.label;
    for (let k = 1; k <= S_MAX * 2; k++) {
      const x = LEDGE_X - k * (PXM / 2);
      const whole = k % 2 === 0;
      ctx.strokeStyle = alpha(c.stroke, whole ? 1 : 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x, FLOOR_Y + (whole ? 10 : 6));
      ctx.stroke();
      ctx.textAlign = x < FOOT_X + 34 ? 'left' : 'center';
      ctx.fillText(fmtLen(k / 2), x + (x < FOOT_X + 34 ? 3 : 0), FLOOR_Y + 19);
    }
    ctx.restore();
  }

  _plank(ctx, c, L, F) {
    const topY = this._topY();
    const footX = this._footX();
    const off = footX < FOOT_X;
    const x0 = Math.max(FOOT_X, footX);
    const y0 = this._yAt(x0);
    // the ramp this one started from, held as a ghost on the wall: the gap between the
    // two boards IS the trade, drawn on the same scale as both
    const gx = LEDGE_X - L_START * PXM;
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.55);
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(gx, FLOOR_Y); ctx.lineTo(LEDGE_X, topY);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, `${L_START} m ramp`, gx - 4, FLOOR_Y - 32,
      { bg: c.raised, ink: c.label, size: 13, align: 'center' });

    const tone = boardTone(c);
    const g = board(ctx, tone, x0, y0, LEDGE_X, topY, PLANK_W);
    board(ctx, darken(tone, 0.3), x0, y0, LEDGE_X, topY, 5);

    // rungs across the board, one per metre or so
    const rungs = Math.max(2, Math.min(9, Math.round(L)));
    for (let i = 1; i <= rungs; i++) {
      const s = i / (rungs + 1);
      const bx = x0 + (LEDGE_X - x0) * s, by = y0 + (topY - y0) * s;
      ctx.save();
      ctx.strokeStyle = alpha(c.stroke, 0.6);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx - g.n.x * 4.5, by - g.n.y * 4.5);
      ctx.lineTo(bx + g.n.x * 4.5, by + g.n.y * 4.5);
      ctx.stroke();
      ctx.restore();
    }

    // trestles holding a plank that has left the frame
    const plankCol = darken(tone, 0.22);
    for (const px of [80, 170, 260, 350, 440]) {
      if (px < x0 + 30) continue;
      const py = this._yAt(px) + PLANK_W / 2;
      const hgt = FLOOR_Y - py;
      if (hgt < 14) continue;
      ctx.fillStyle = plankCol;
      ctx.fillRect(px - 4, py, 8, hgt);
      ctx.fillRect(px - 11, FLOOR_Y - 5, 22, 5);
    }

    // the ledge the crate is standing on
    ctx.save();
    ctx.fillStyle = tone;
    ctx.fillRect(LEDGE_X, topY - 8, LEDGE_W, LEDGE_H + 8);
    ctx.fillStyle = darken(tone, 0.32);
    ctx.fillRect(LEDGE_X, FLOOR_Y - 14, LEDGE_W, 14);
    // the board wedge that holds the 1 m step - sized once, never moved
    ctx.beginPath();
    ctx.moveTo(LEDGE_X - 3, FLOOR_Y);
    ctx.lineTo(LEDGE_X - 3, FLOOR_Y - 10);
    ctx.lineTo(LEDGE_X - 30, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // the break, where the ramp has run off the card
    if (off) {
      ctx.save();
      ctx.strokeStyle = c.stroke;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(FOOT_X, y0 - 11);
      ctx.lineTo(FOOT_X + 6, y0 - 3);
      ctx.lineTo(FOOT_X, y0 + 5);
      ctx.lineTo(FOOT_X + 6, y0 + 13);
      ctx.lineTo(FOOT_X, y0 + 21);
      ctx.stroke();
      ctx.restore();
      pill(ctx, c, `to L = ${fmtLen(L)}`, FOOT_X + 30, y0 - 34,
        { bg: c.raised, ink: onCard(c, c.good), size: 13, align: 'left' });
    }

    // the length, measured along the plank, in the scale of the plank
    dimension(ctx, c, x0, y0, LEDGE_X, topY, -g.n.x, -g.n.y, 26, `L = ${fmtLen(L)}`, c.accent);

    // the load, in a rail tray at the top of the plank
    const cx = LEDGE_X + LEDGE_W / 2;
    drawShadow(ctx, c, cx, topY + 2, CRATE_W * 0.8, 6);
    ctx.save();
    ctx.fillStyle = darken(c.raised, 0.12);
    rr(ctx, cx - TRAY_W / 2, topY - TRAY_H, TRAY_W, TRAY_H, 4);
    ctx.fill();
    const cy = topY - TRAY_H;
    ctx.fillStyle = c.s5;
    rr(ctx, cx - CRATE_W / 2, cy - CRATE_H, CRATE_W, CRATE_H, 7);
    ctx.fill();
    ctx.fillStyle = darken(c.s5, 0.25);
    ctx.fillRect(cx - CRATE_W / 2, cy - CRATE_H + 18, CRATE_W, 5);
    ctx.fillStyle = darken(c.s5, 0.6);
    ctx.beginPath(); ctx.ellipse(cx - 8, cy - CRATE_H + 25, 3, 4, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 8, cy - CRATE_H + 25, 3, 4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = darken(c.s5, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - CRATE_H + 27, 6.5, 0.35, Math.PI - 0.35);
    ctx.stroke();
    ctx.restore();

    // the effort, drawn to the effort scale: its drawn length is F / 300 metres
    const len = (F / F_MAX) * LEDGE_H;
    const back = Math.min(ARROW_BACK, g.len * 0.62);
    const ax = LEDGE_X - g.u.x * back;
    const ay = topY - g.u.y * back;
    const sx = ax + g.n.x * 24, sy = ay + g.n.y * 24;
    arrow(ctx, c.good, sx, sy, g.u, len, 12, 5);
    const lx = sx + g.u.x * len / 2 + g.n.x * 40;
    const ly = sy + g.u.y * len / 2 + g.n.y * 40;
    pill(ctx, c, fmtN(F), lx, ly, { bg: c.raised, ink: onCard(c, c.good), size: 14 });
    if (F < 1) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font(c, 700, 13);
      ctx.fillStyle = c.label;
      ctx.fillText('near zero', lx, ly + 22);
      ctx.restore();
    }

    // the height, fixed, beside the ledge - the line names it, the chip reads it
    const hx = LEDGE_X + LEDGE_W + 10;
    dimension(ctx, c, hx, FLOOR_Y, hx, topY, 1, 0, 0, '', c.labelMuted);
    pill(ctx, c, 'h = 1.0 m', hx - 48, 242, { bg: c.raised, ink: c.label, size: 13 });
  }

  _ruler(ctx, c, L) {
    ctx.save();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(RUL_X0, RUL_Y); ctx.lineTo(RUL_X1, RUL_Y);
    ctx.stroke();
    ctx.restore();
    RUL_TICKS.forEach((m) => {
      const x = tickX(m);
      const on = L >= m * 0.999;
      pill(ctx, c, fmtLen(m), x, 22,
        { bg: c.raised, ink: on ? onCard(c, c.accent) : c.labelMuted, size: 13 });
      if (on) {
        ctx.save();
        ctx.fillStyle = c.accent;
        ctx.beginPath();
        ctx.arc(x, RUL_Y, 5, 0, 7);
        ctx.fill();
        ctx.restore();
      }
    });
    const x = RUL_X0 + logT(L) * RUL_SPAN;
    ctx.save();
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(x, RUL_Y + 12);
    ctx.lineTo(x - 10, RUL_Y - 6);
    ctx.lineTo(x + 10, RUL_Y - 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _cards(ctx, c, L, F) {
    const from = effortOf(L_START);
    const over = L / S_MAX;
    this._card(ctx, c, CARD_X[0], 'EFFORT', fmtN(F),
      Math.max(0.008, F / F_MAX), c.good,
      ratio(F, from),
      F < 1 ? 'near zero' : 'towards 300 N');
    this._card(ctx, c, CARD_X[1], 'WORK', `${WORK_J} J`, null, c.gold,
      'unchanged', 'always m g h');
    this._card(ctx, c, CARD_X[2], 'DISTANCE', fmtLen(L),
      Math.min(1, L / S_MAX), c.accent,
      ratio(L, L_START),
      over > 1.02
        ? `past the ${S_MAX} m scale \u00d7${Math.round(over)}`
        : `within the ${S_MAX} m scale`);
  }

  _card(ctx, c, x, title, value, meter, col, ratioText, foot) {
    drawCard(ctx, c, x, CARD_Y, CARD_W, CARD_H, 1, { accent: col });
    pill(ctx, c, title, x + 13, CARD_Y + 22,
      { bg: c.raised, ink: onCard(c, col), size: 13, align: 'left' });
    pill(ctx, c, ratioText, x + CARD_W - 13, CARD_Y + 22,
      { bg: c.raised, ink: c.labelMuted, size: 13, align: 'right' });
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, 28, true);
    ctx.fillStyle = onCard(c, col);
    ctx.fillText(value, x + 14, CARD_Y + 60);
    ctx.restore();
    if (meter != null) drawMeter(ctx, c, x + 14, CARD_Y + 84, CARD_W - 28, 13, meter, { col });
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 700, 13);
    ctx.fillStyle = c.label;
    ctx.fillText(foot, x + 14, CARD_Y + 106);
    ctx.restore();
  }
}