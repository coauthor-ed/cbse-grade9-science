// RulerAndPencilScene.js
//
// blk-l07-s13 (3 beats, the desk experiment and the question it opens) and
// blk-l08-s01 (2 beats, the stapler) are one file and two cold mounts. The
// scene is told only the beat COUNT, never the slide, so BEAT_MAPS keys on the
// count; both mounts open on stage 0 (the same picture - block on the short
// end, nothing at all on the long end) and part at their second beat, so no
// stage number has to mean two things.
//
// The whole finding is the moment the lean reverses, and it is one line of
// algebra about the block's own centre of mass:
//
//     moment = 4 * (p - 4)  -  (light ? 1 * (26 - p) : 0)
//
// The block's centre of mass sits at 4 cm and does not move all scene. The
// pencil slides across it: left of 4 cm the block is on the long side and the
// empty end drops; right of 4 cm the block is on the short side and the empty
// end rises. Same block, same ruler, same pencil - the lean is the only thing
// that changed. The balance point is drawn as a dashed mark under the bar, and
// it is a place on the ruler: never a force, a ratio or an advantage.
//
// Nothing here is named. No lever, no fulcrum, no bar, no machine class, no
// arms, no F1 x d1 = F2 x d2 - blk-l08-s02 opens with three of them, and this
// scene has to leave the question standing. The state chip says which END is
// down; the readout says what did not change.

import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, rr, mix, alpha, font, chipRow, chipColumn,
  drawBackdrop, drawDepth, drawShadow, drawSpotlight, drawReadout, drawFloor,
} from 'simulations/base/kit/SimLook.js';

const RAD = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// -- The ruler: one scale, never rescaled --------------------------------------------
const RULER_CM = 30;
const PX_CM = 14;                        // 420 px of bar: 62% of the frame
const RULER_X0 = 196;                    // the bar's 0 cm mark, clear of the left card
const RULER_W = RULER_CM * PX_CM;
const BAR_T = 30;                        // the bar's drawn thickness
const PIVOT_Y = 360;                     // the pencil's top facet: the bar's underside here
const PENCIL_T = 13;
const DESK_Y = 442;
const WALL_Y = 88;
const BOOK_W = 150;

const OBJ_CM = 4;                        // the block's centre of mass: 4 cm, all scene
const OBJ_M = 4;                         // in the scene's own weight units. Never printed.
const LIT_CM = 26;                       // the light thing's centre of mass
const LIT_M = 1;
const OBJ_W = 46, OBJ_H = 44;
const LIT_W = 32, LIT_H = 28;

const P_MIN = 1, P_MAX = 20;            // the pencil's travel along the bar
const LEAN_MAX = 9;                     // deg, so both ends stay clear of the desk
const LEAN_K = 14;                      // block-cm per tanh unit
const LEVEL_TOL = 1;                    // block-cm drawn as level, so the crossing is findable
const LEAN_FOLLOW = 14;                 // 1/s: the lean catches the pointer in ~0.12 s
const TRADE_STEP = 2.2;                 // s per named trade on stage 2

// -- The stages ----------------------------------------------------------------------
// Stage 0 is both mounts' opening. Stage 1 is L07's "drag past the middle"; stage 3 is
// L08's "the light thing is on and the bar has turned over".
const S_OPEN = 0, S_PAST = 1, S_TRADES = 2, S_LIGHT = 3;
const MAP_L07 = [
  [{ idx: S_OPEN, dwellMs: null }],
  [{ idx: S_PAST, dwellMs: null }],
  [{ idx: S_TRADES, dwellMs: null }],
];
const MAP_L08 = [
  [{ idx: S_OPEN, dwellMs: null }],
  [{ idx: S_LIGHT, dwellMs: null }],
];

const TRADES = ['direction', 'load shared', 'distance longer'];

// -- The model -----------------------------------------------------------------------
const balanceAt = (light) => (OBJ_CM * OBJ_M + (light ? LIT_CM * LIT_M : 0)) / (OBJ_M + (light ? LIT_M : 0));
const momentAt = (p, light) => OBJ_M * (p - OBJ_CM) - (light ? LIT_M * (LIT_CM - p) : 0);
const leanAt = (p, light) => LEAN_MAX * Math.tanh(momentAt(p, light) / LEAN_K);   // deg, + = block's end down
const pivotX = (p) => RULER_X0 + p * PX_CM;
const fmtCm = (v) => (Math.round(v * 10) / 10).toFixed(1);

// A chip's ink and the bar's numerals, by measured contrast: the light theme's bg-deep is
// near-white and the dark theme's is near-black, so one fixed ink fails in one of the two.
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
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const bestInk = (c, bg) => (ratio(c.label, bg) >= ratio(c.bgDeep, bg) ? c.label : c.bgDeep);

export class RulerAndPencilScene extends SimScene {
  static BEAT_STEP_MAP = MAP_L07;
  static BEAT_MAPS = { 3: MAP_L07, 2: MAP_L08 };
  static CONTINUOUS = false;
  static NOTE_STAGE = S_OPEN;           // one muted line along the bottom on every beat
  static ARIA_LABEL =
    'A 30 centimetre ruler resting across a pencil that lies on a book on a desk. One heavy block ' +
    'rides the ruler four centimetres from its left end, and nothing at all is on the long end. ' +
    'Sliding the pencil along the ruler tips the ruler: the end carrying the block is the low ' +
    'end at every position, and the lean reverses as the pencil passes the block. The place ' +
    'where the ruler would sit level is marked under it. On one mount a light thing can be put ' +
    'on the long end, and it moves that mark towards the middle.';
  static CONTROLS = [
    { type: 'slider', id: 'pencil', label: 'Pencil', min: P_MIN, max: P_MAX, step: 0.1, value: 3, suffix: ' cm' },
    { type: 'toggle', id: 'light', label: 'Light thing on the long end' },
  ];

  constructor(container, config) {
    super(container, config);
    this._p = 3;
    this._light = false;
    this._lean = leanAt(this._p, this._light);
    this._sign = Math.sign(this._lean) || 1;
    this._found = false;                 // has the lean reversed yet, this mount
    this._shown = 0;                     // trades named so far, on stage 2
    this._seqT = 0;
    this._drag = false;
  }

  // One line, and it is about the drawing: the book is a prop, and the lean is a direction,
  // not a measurement.
  noteRows() {
    return [{ text: 'a book under the pencil; the lean is drawn, not measured' }];
  }

  // -- stages -----------------------------------------------------------------------

  enter(stage) {
    if (stage === S_PAST) { this._p = 9; this._light = false; }
    else if (stage === S_TRADES) { this._p = OBJ_CM; this._light = false; }
    else if (stage === S_LIGHT) { this._p = 7; this._light = true; }
    else { this._p = 3; this._light = false; }
    this._lean = leanAt(this._p, this._light);     // a stage opens at rest, never mid-swing
    this._sign = Math.sign(this._lean) || 1;
    this._drag = false;
    this._shown = 0;
    this._seqT = 0;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    // The light thing belongs to the blk-l08-s01 mount only. L07's later beats are about
    // the bare bar, and the slide's claim there is that nothing was added at all.
    return id === 'light' && (this.stage === S_PAST || this.stage === S_TRADES);
  }

  isControlDisabled(id) {
    // Stage 2 holds the bar level so the three trades have something to sit beside.
    return id === 'pencil' && this.stage === S_TRADES;
  }

  getControlValue(id) {
    if (id === 'pencil') return String(Math.round(this._p * 100) / 100);
    if (id === 'light') return this._light;
    return super.getControlValue(id);
  }

  // -- motion ------------------------------------------------------------------------

  // Host controls. `v` is a STRING for the slider and true/false for the toggle.
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'pencil') this.setPencil(Number(v));
    else if (id === 'light') {
      this._light = !!v;
      this._checkFlip();
      this.requestUiUpdate?.();
    }
  }

  setPencil(p) {
    const next = clamp(p, P_MIN, P_MAX);
    if (next === this._p) return;
    this._p = next;
    this._checkFlip();
    this.requestUiUpdate?.();
  }

  // The concept, and the only thing celebrated: the lean reversing, with the block and the
  // ruler untouched. Once per mount, and never from a beat.
  _checkFlip() {
    const sign = Math.sign(leanAt(this._p, this._light)) || this._sign;
    if (sign !== this._sign) {
      this._sign = sign;
      if (!this._found) { this._found = true; this.celebrate(pivotX(this._p), PIVOT_Y - 40, 20); }
    }
  }

  update(d) {
    const to = leanAt(this._p, this._light);
    // Land exactly on the target rather than easing towards it for ever: a level bar must
    // read as exactly level, not 0.01 deg off it.
    if (Math.abs(this._lean - to) > 0.002) this._lean += (to - this._lean) * Math.min(1, LEAN_FOLLOW * d);
    else this._lean = to;
    if (this.stage === S_TRADES && this._shown < TRADES.length) {
      this._seqT += d;
      while (this._shown < TRADES.length && this._seqT > (this._shown + 1) * TRADE_STEP) this._shown++;
    }
  }

  busy() {
    if (this.stage === S_TRADES && this._shown < TRADES.length) return true;
    return Math.abs(this._lean - leanAt(this._p, this._light)) > 0.002 || this._drag;
  }

  // -- the picture -------------------------------------------------------------------

  draw(ctx, c) {
    const theta = -this._lean * RAD;                 // +theta drops the right end
    const px = pivotX(this._p);
    const barTone = mix(c.raised, c.gold, 0.28);

    drawBackdrop(ctx, c, 'dots');
    drawDepth(ctx, c, { rect: { x: 0, y: 0, w: 680, h: DESK_Y } });
    // The wall the desk stands against, and the lamp over it: the middle band needs a
    // reason to be there, and the pool of light is what keeps the eye on the bar.
    this._wall(ctx, c);
    drawFloor(ctx, c, DESK_Y, { col: mix(c.raised, c.label, 0.06) });
    drawSpotlight(ctx, c, RULER_X0 + RULER_W / 2, PIVOT_Y - 40, 260, 0.45);
    this._desk(ctx, c, px);
    this._bar(ctx, c, theta, barTone);
    // Glyphs come after the restore, upright, at world coordinates: the harness records raw
    // path arguments, so text drawn under the rotation lands near the canvas origin.
    this._scale(ctx, c, theta, barTone);
    this._chrome(ctx, c);
  }

  // The wall and its lamp. Set dressing, not content: it gives the upper half a reason to
  // exist and puts a light on the bar, and nothing on it is ever named.
  _wall(ctx, c) {
    const lx = RULER_X0 + RULER_W / 2;
    ctx.fillStyle = mix(c.bgDeep, c.stroke, 0.16);
    rr(ctx, 16, WALL_Y, 648, DESK_Y - WALL_Y - 10, 10); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.45); ctx.lineWidth = 2;
    rr(ctx, 16, WALL_Y, 648, DESK_Y - WALL_Y - 10, 10); ctx.stroke();
    // The lamp: a cord, a shade, and the cone it throws down onto the bar.
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, WALL_Y); ctx.lineTo(lx, 168); ctx.stroke();
    ctx.fillStyle = mix(c.gold, c.raised, 0.35);
    ctx.beginPath();
    ctx.moveTo(lx - 26, 196); ctx.lineTo(lx + 26, 196); ctx.lineTo(lx + 13, 166); ctx.lineTo(lx - 13, 166);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha(c.gold, 0.10);
    ctx.beginPath();
    ctx.moveTo(lx - 26, 196); ctx.lineTo(lx + 26, 196); ctx.lineTo(lx + 120, PIVOT_Y - 10); ctx.lineTo(lx - 120, PIVOT_Y - 10);
    ctx.closePath(); ctx.fill();
  }

  // The book travels with the pencil: a fixed support would leave the pencil unsupported
  // at the ends of its travel, and the support is a prop, not part of the finding.
  _desk(ctx, c, px) {
    const x0 = px - BOOK_W / 2, y0 = PIVOT_Y + PENCIL_T;
    drawShadow(ctx, c, px, DESK_Y + 4, BOOK_W * 0.62, 9);
    for (let i = 0; i < 2; i++) {
      const top = y0 + i * 35, h = 31;
      ctx.fillStyle = i ? mix(c.raised, c.s4, 0.22) : mix(c.raised, c.s2, 0.28);
      rr(ctx, x0 + i * 4, top, BOOK_W - i * 8, h, 3);
      ctx.fill();
      ctx.fillStyle = alpha(c.label, 0.22);            // the page block's own edge
      ctx.fillRect(x0 + i * 4 + 6, top + h - 7, BOOK_W - i * 8 - 12, 4);
    }
    // The pencil: a rod lying across the book, sharpened at one end.
    const y = PIVOT_Y, w = 132;
    ctx.fillStyle = mix(c.gold, c.raised, 0.3);
    rr(ctx, px - w / 2, y, w - 16, PENCIL_T, 2); ctx.fill();
    ctx.fillStyle = mix(c.label, c.raised, 0.35);      // the sharpened cone
    ctx.beginPath();
    ctx.moveTo(px - w / 2 + w - 16, y);
    ctx.lineTo(px - w / 2 + w, y + PENCIL_T / 2);
    ctx.lineTo(px - w / 2 + w - 16, y + PENCIL_T);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix(c.s1, c.raised, 0.1);          // the eraser
    rr(ctx, px - w / 2, y, 14, PENCIL_T, 2); ctx.fill();
  }

  // Everything that tilts, drawn under one rotation. No text here.
  _bar(ctx, c, theta, tone) {
    const px = pivotX(this._p);
    ctx.save();
    ctx.translate(px, PIVOT_Y);
    ctx.rotate(theta);
    const lx0 = -this._p * PX_CM, lx1 = (RULER_CM - this._p) * PX_CM;

    // The balance mark first, so the bar's own edge caps it.
    const bal = balanceAt(this._light);
    ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo((bal - this._p) * PX_CM, 2);
    ctx.lineTo((bal - this._p) * PX_CM, 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tone;                                   // the bar
    rr(ctx, lx0, -BAR_T, lx1 - lx0, BAR_T, 5); ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.35); ctx.lineWidth = 2;
    rr(ctx, lx0, -BAR_T, lx1 - lx0, BAR_T, 5); ctx.stroke();
    ctx.fillStyle = alpha(c.bgDeep, 0.16);                  // the bar's own top shade
    ctx.fillRect(lx0, -BAR_T, lx1 - lx0, 6);

    // The two things that ride it. Neither is ever resized, moved along the bar or
    // re-coloured: the same block, at the same 4 cm, for the whole scene.
    this._block(ctx, c, OBJ_CM, OBJ_W, OBJ_H, c.s2);
    if (this._light) this._block(ctx, c, LIT_CM, LIT_W, LIT_H, c.s3);
    ctx.restore();
  }

  _block(ctx, c, cm, w, h, tone) {
    const x = (cm - this._p) * PX_CM - w / 2;
    ctx.fillStyle = tone;
    rr(ctx, x, -BAR_T - h, w, h, 4); ctx.fill();
    ctx.fillStyle = alpha(c.bgDeep, 0.2);
    ctx.fillRect(x + 3, -BAR_T - h + 4, w - 6, 5);
    ctx.strokeStyle = alpha(c.bgDeep, 0.35); ctx.lineWidth = 2;
    rr(ctx, x, -BAR_T - h, w, h, 4); ctx.stroke();
  }

  // The bar's own centimetre scale, upright at world coordinates. The numerals sit on the
  // bar's face, inside its ends, so a numeral is never read as spilling out of its own bar.
  _scale(ctx, c, theta, tone) {
    const px = pivotX(this._p), sn = Math.sin(theta), cs = Math.cos(theta);
    const ink = bestInk(c, tone);
    const x0 = px + (-this._p * PX_CM) * cs, x1 = px + ((RULER_CM - this._p) * PX_CM) * cs;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let cm = 0; cm <= RULER_CM; cm += 1) {
      const lx = (cm - this._p) * PX_CM;
      const x = px + lx * cs, y = PIVOT_Y + lx * sn;
      if (x < 4 || x > 676) continue;
      const long = cm % 10 === 0;
      ctx.strokeStyle = alpha(ink, long ? 0.85 : 0.4);
      ctx.lineWidth = long ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - (BAR_T - 4));
      ctx.lineTo(x, y - BAR_T + (long ? 10 : 6));
      ctx.stroke();
      if (long) {
        ctx.fillStyle = ink;
        ctx.font = font(c, 700, 13);
        ctx.fillText(String(cm), clamp(x, x0 + 10, x1 - 10), y - 13);
      }
    }
  }

  // The words: the state chip, the hint, the readout, and the three named trades.
  _chrome(ctx, c) {
    const m = momentAt(this._p, this._light);
    const state = Math.abs(m) <= LEVEL_TOL ? 'bar level' : (m > 0 ? 'heavy end down' : 'empty end down');
    const chips = [{ text: state, bg: c.accent }];
    if (this.stage !== S_TRADES) chips.push({ text: 'drag the pencil along the ruler', bg: c.accent });
    chipRow(ctx, c, chips, 340, 40, { align: 'center' });

    const rows = [
      { label: 'pencil', value: `${fmtCm(this._p)} cm` },
      { label: 'balance', value: `${fmtCm(balanceAt(this._light))} cm` },
      { label: 'heavy thing', value: 'same' },
      { label: 'ruler', value: `${RULER_CM} cm` },
      { label: 'lifted', value: 'none' },
    ];
    if (this.stage === S_OPEN || this.stage === S_LIGHT) {
      rows.push({ label: 'light thing', value: this._light ? 'on it' : 'none' });
    }
    drawReadout(ctx, c, ZONES.left.x, 104, ZONES.left.w, rows, { title: 'the desk' });

    if (this.stage === S_TRADES && this._shown > 0) {
      chipColumn(ctx, c, TRADES.slice(0, this._shown).map((t) => ({ text: t, bg: c.accent })),
        ZONES.right.x + ZONES.right.w / 2, 118, { align: 'center' });
    }
  }

  // -- the drag ----------------------------------------------------------------------
  // The pencil slides along the ruler, so the whole bar is the handle: a grab anywhere on
  // it (or on the pencil under it) is the gesture the slide describes.

  _barUndersideY(x) {
    const theta = -this._lean * RAD;
    return PIVOT_Y + (x - pivotX(this._p)) * Math.sin(theta);
  }

  pointerDown(p) {
    if (this.stage === S_TRADES) return;                 // held level for the three trades
    if (Math.abs(p.y - this._barUndersideY(p)) > 34) return;
    this._drag = true;
    this.setPencil((p.x - RULER_X0) / PX_CM);
    this.animateFor(300);
  }

  pointerMove(p) {
    if (!this._drag) return false;
    this.setPencil((p.x - RULER_X0) / PX_CM);
    this.animateFor(300);
    return true;                                          // the slider in the bar follows the drag
  }

  pointerUp() { this._drag = false; }
}
