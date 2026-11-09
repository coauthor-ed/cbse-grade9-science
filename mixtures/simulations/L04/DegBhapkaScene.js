// DegBhapkaScene.js - the Kannauj Deg-Bhapka method: a fire, sealed copper degs holding water and
// fragrant material, bamboo chongas, and one copper bhapka standing in a trough of cold water.
// The learner sets the fire and runs it. With a big fire, vapour reaches the bhapka faster than the
// cold water can cool it, so some escapes into the air.
//   stage 0  the rig at rest, Kannauj  |  1 the parts named, a gentle run  |  2 gentle against big
//   stage 3  the parts beside the laboratory set-up, with the gentle result
// The find is the learner choosing the gentle fire again after a big one. The model: scent units off
// the degs each second against a fixed amount the bhapka can condense.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, font, chipRow, leader, rr,
  pill, drawBackdrop, drawFloor, drawCard, drawShadow,
} from 'simulations/base/kit/SimLook.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const S_COLD = 0, S_GENTLE = 1, S_FIERCE = 2, S_DONE = 3;

// ---- geometry: the work floor, left to right, on one wide band -------------------
const FLOOR_Y = 430;
const HEARTH = { x: 24, y: 300, w: 228, h: 52 };
const DEG_CX = [62, 137, 212];
const DEG_W = 66, DEG_TOP = 198, DEG_BOT = 300;
const MOUTH_DX = 24, MOUTH_Y = 208;
const CHONGA_END = [{ x: 470, y: 300 }, { x: 500, y: 292 }, { x: 530, y: 300 }];
const TROUGH = { x: 380, y: 352, w: 272, h: 76 };
const WATER_Y = 362;
const BHAPKA = { cx: 500, top: 296, bot: 402, rx: 52 };
const CARD = { x: 448, y: 66, w: 216, h: 120 };

// ---- the model: scent units off the degs against what the receiver can cool -------
const EMIT_PER_FIRE = 1.2;      // units/s leaving the degs at fire 100
const CAPACITY = 38;            // units/s the bhapka in cold water can condense - fixed
const EMIT_S = 8;               // seconds of emission in one run
const POOL_FULL = CAPACITY * EMIT_S;   // 304 units: the bhapka's bowl, drawn full


// One entry per beat: [{ idx: <stage>, dwellMs: null }]; dwellMs null = wait for the learner.
const MAP = [
  [{ idx: S_COLD, dwellMs: null }],
  [{ idx: S_GENTLE, dwellMs: null }],
  [{ idx: S_FIERCE, dwellMs: null }],
  [{ idx: S_DONE, dwellMs: null }],
];
const GENTLE_FIRE = 35, FIERCE_FIRE = 100;
// what one run reaches, straight from the model above: no randomness anywhere.
const runAt = (fire) => {
  const rate = fire * EMIT_PER_FIRE;
  return { c: Math.min(rate, CAPACITY) * EMIT_S, l: Math.max(0, rate - CAPACITY) * EMIT_S };
};
const GENTLE_FIGURE = runAt(GENTLE_FIRE);

export class DegBhapkaScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A Kannauj Deg-Bhapka set-up: sealed copper degs holding water and fragrant material over wood fires, bamboo chongas running down to a copper bhapka standing in a trough of cold water. With a gentle fire the vapour condenses in the bhapka. With a big fire some of it escapes into the air.';
  static CONTROLS = [
    { type: 'segmented', id: 'fire', label: 'Fire', value: '35', options: [{ value: '35', label: 'Gentle' }, { value: '100', label: 'Big' }] },
    { type: 'button', id: 'run', label: 'Light the fire' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fire = GENTLE_FIRE;
    this._run = null;              // { stage, t } while a run is going
    this._wisps = [];              // { d, t } vapour on a chonga, t = 0..1
    this._drops = [];              // { x, y, v } condensed droplets falling into the bhapka
    this._escape = [];             // { x, y, vx, vy, life } vapour torn past the receiver
    this._caught = 0;
    this._lost = 0;
    this._frac = 0;                // fractional accumulator: decides each arriving wisp
    this._spawnAcc = 0;
    this._pool = 0;
    this._shown = { c: 0, l: 0 };  // held for a second at a time, so numbers never crawl
    this._shownT = 0;
  }

  isControlHidden(id) { return this.stage === S_COLD || this.stage === S_DONE || (id === 'fire' && this.stage === S_GENTLE); }
  isControlDisabled(id) { return !!this._run; }

  // Called on every stage change: reset what this stage shows (the base resets age and fade).
  enter(stage) {
    this._run = null;
    this._wisps = [];
    this._drops = [];
    this._escape = [];
    this._caught = 0;
    this._lost = 0;
    this._frac = 0;
    this._spawnAcc = 0;
    this._pool = 0;
    this._shown = { c: 0, l: 0 };
    this._shownT = 0;
    this._fire = stage === S_FIERCE ? FIERCE_FIRE : GENTLE_FIRE;
    this._lit = false;
    this._sawBig = false;
    this._found = false;
    if (stage === S_DONE) {
      // The run is finished and its oil is in the bhapka. The model is deterministic,
      // so the figure a gentle run reaches is a constant - no run history to carry
      // across the stage change, and the chip and the pool agree by construction.
      const g = GENTLE_FIGURE;
      this._caught = g.c;
      this._lost = g.l;
      this._pool = g.c;
      this._shown = { c: g.c, l: g.l };
    }
    this.requestUiUpdate?.();
  }

  _launch() {
    if (this._run || this._fire <= 0) return;
    // each Run is one run: the chip and the pool measure this run, not the sum of them
    this._caught = 0;
    this._lost = 0;
    this._frac = 0;
    this._pool = 0;
    this._shown = { c: 0, l: 0 };
    this._lit = true;
    this._run = { stage: this.stage, t: 0 };
  }

  // Fraction of the arriving scent the cold bhapka can actually condense right now.
  _catchShare() {
    const rate = this._fire * EMIT_PER_FIRE;
    return rate <= 0 ? 0 : Math.min(1, CAPACITY / rate);
  }

  _emitDt(d) {
    const rate = this._fire * EMIT_PER_FIRE;
    this._caught += Math.min(rate, CAPACITY) * d;
    this._lost += Math.max(0, rate - CAPACITY) * d;
    const share = this._catchShare();
    const pps = 0.011 * Math.pow(this._fire, 1.5);         // thicker and faster vapour at a fierce fire
    const travel = Math.max(0.5, 1.9 - this._fire * 0.013);
    this._spawnAcc += pps * d;
    while (this._spawnAcc >= 1) {
      this._spawnAcc -= 1;
      this._wisps.push({ d: (this._spawnAcc * 3 | 0) % 3, t: 0, travel });
    }
  }

  _arrive(w) {
    const share = this._catchShare();
    this._frac += share;
    if (this._frac >= 1) {
      this._frac -= 1;
      this._drops.push({ x: CHONGA_END[w.d].x, y: CHONGA_END[w.d].y + 6, v: 0 });
    } else {
      // too much vapour for the receiver to cool: it tears past and goes out over the trough
      this._escape.push({ x: CHONGA_END[w.d].x, y: CHONGA_END[w.d].y - 6, vx: 34 + this._fire * 0.3, vy: -58, life: 1.6 });
    }
  }

  update(d) {
    const r = this._run;
    if (r) {
      r.t += d;
      if (r.t >= EMIT_S) { this._run = null; this._lit = false; this.requestUiUpdate?.(); }
      else this._emitDt(d);
    }
    for (const w of this._wisps) { w.t += d / w.travel; }
    for (let i = this._wisps.length - 1; i >= 0; i--) {
      if (this._wisps[i].t >= 1) { this._arrive(this._wisps[i]); this._wisps.splice(i, 1); }
    }
    // what has condensed is what is in the bowl: one number, so the pool and the chip agree
    this._pool = Math.min(POOL_FULL, this._caught);
    const poolSurface = this._poolY();
    for (const dr of this._drops) { dr.v += 620 * d; dr.y += dr.v * d; }
    this._drops = this._drops.filter((dr) => dr.y < poolSurface);
    for (const e of this._escape) { e.x += e.vx * d; e.y += e.vy * d; e.vy += 30 * d; e.life -= d * 0.62; }
    this._escape = this._escape.filter((e) => e.life > 0 && e.x < 646);
    this._shownT += d;
    if (this._shownT >= 0.5) {
      this._shownT = 0;
      this._shown = { c: this._caught, l: this._lost };
    }
  }

  busy() { return !!this._run || this._wisps.length > 0 || this._drops.length > 0 || this._escape.length > 0; }

  // ---- drawing -------------------------------------------------------------------

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR_Y);
    this._drawTitle(ctx, c);
    this._drawTrough(ctx, c);
    this._drawHearth(ctx, c);
    this._drawDegs(ctx, c);
    this._drawFlames(ctx, c);
    this._drawChongas(ctx, c);
    this._drawBhapka(ctx, c);
    this._drawWaterFront(ctx, c);
    this._drawWisps(ctx, c);
    this._drawDrops(ctx, c);
    this._drawEscape(ctx, c);
    this._drawScentCard(ctx, c);
    this._drawLabels(ctx, c);
  }

  _drawTitle(ctx, c) {
    chipRow(ctx, c, PHONE ? [{ text: 'Deg-Bhapka method', bg: c.accent }] : [
      { text: 'Kannauj, Uttar Pradesh', bg: c.raised },
      { text: 'Deg-Bhapka method', bg: c.accent },
      { text: 'Mitti ka Ittar', bg: c.raised },
    ], 340, 26, { align: 'center', size: fs(16) });
  }

  _drawHearth(ctx, c) {
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.35);
    ctx.fillRect(HEARTH.x, HEARTH.y, HEARTH.w, HEARTH.h);
    ctx.fillStyle = alpha(c.label, 0.16);
    for (let x = HEARTH.x + 4; x < HEARTH.x + HEARTH.w - 20; x += 40) {
      ctx.fillRect(x, HEARTH.y + 8, 30, 2);
      ctx.fillRect(x + 18, HEARTH.y + 26, 30, 2);
    }
    ctx.strokeStyle = alpha(c.label, 0.3);
    ctx.lineWidth = 2;
    ctx.strokeRect(HEARTH.x, HEARTH.y, HEARTH.w, HEARTH.h);
    drawShadow(ctx, c, HEARTH.x + HEARTH.w / 2, HEARTH.y + HEARTH.h + 6, HEARTH.w / 2, 10);
  }

  _degPath(ctx, cx) {
    const hw = DEG_W / 2, nw = DEG_W * 0.24, h = DEG_BOT - DEG_TOP, shY = DEG_TOP + h * 0.44;
    ctx.beginPath();
    ctx.moveTo(cx - hw, DEG_BOT);
    ctx.bezierCurveTo(cx - hw, DEG_BOT - h * 0.34, cx - hw * 1.03, shY, cx - nw * 1.7, shY - h * 0.08);
    ctx.bezierCurveTo(cx - nw * 1.2, DEG_TOP + h * 0.2, cx - nw, DEG_TOP + h * 0.1, cx - nw, DEG_TOP);
    ctx.lineTo(cx + nw, DEG_TOP);
    ctx.bezierCurveTo(cx + nw, DEG_TOP + h * 0.1, cx + nw * 1.2, DEG_TOP + h * 0.2, cx + nw * 1.7, shY - h * 0.08);
    ctx.bezierCurveTo(cx + hw * 1.03, shY, cx + hw, DEG_BOT - h * 0.34, cx + hw, DEG_BOT);
    ctx.closePath();
  }

  _drawDegs(ctx, c) {
    for (const cx of DEG_CX) {
      drawShadow(ctx, c, cx, HEARTH.y + 2, DEG_W * 0.55, 7);
      this._degPath(ctx, cx);
      ctx.fillStyle = mix(c.gold, c.flame, 0.45);
      ctx.fill();
      ctx.strokeStyle = alpha(darken(c.gold, 0.45), 0.6);
      ctx.lineWidth = 2;
      ctx.stroke();
      // a cut-away window: water with fragrant material in it
      ctx.save();
      rr(ctx, cx - DEG_W * 0.34, DEG_BOT - 44, DEG_W * 0.68, 36, 8);
      ctx.fillStyle = mix(c.water, c.bgSurface, 0.2); ctx.fill();
      ctx.strokeStyle = alpha(darken(c.gold, 0.45), 0.8); ctx.lineWidth = 2; ctx.stroke();
      ctx.clip();
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath(); ctx.ellipse(cx - 16 + i * 8, DEG_BOT - 22 + (i % 2) * 7, 4.2, 2.8, i, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 ? c.s4 : lighten(c.s4, 0.3); ctx.fill();
      }
      ctx.restore();
      // sealed clay lid: the deg must not leak vapour anywhere but the mouth
      ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.15);
      ctx.beginPath();
      ctx.ellipse(cx, DEG_TOP, DEG_W * 0.28, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.35);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = alpha(c.label, 0.28);
      ctx.fillRect(cx - DEG_W * 0.3, DEG_TOP + 16, DEG_W * 0.6, 3);
    }
  }

  // The wood fires, drawn in front of the hearth: they must lap up into the deg's
  // underside, or the fire looks like a switch nobody can see.
  _drawFlames(ctx, c) {
    const k = this._fire / 100;
    if (!this._lit) return;
    const base = HEARTH.y + HEARTH.h - 8;
    const flick = 1 + 0.12 * Math.sin(this.clock * 9 + k * 4);
    for (const cx of DEG_CX) {
      const fw = 18 + k * 12, fh = (24 + k * 26) * flick;
      // logs first, so the flames sit on them
      ctx.fillStyle = mix(c.waste, c.bgDeep, 0.3);
      ctx.beginPath();
      ctx.ellipse(cx, base + 3, fw * 0.95, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = alpha(darken(c.waste, 0.4), 0.8);
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * fw * 0.55, base + 4);
        ctx.lineTo(cx - s * fw * 0.15, base - 1);
        ctx.stroke();
      }
      // three overlapping tongues: a wide low one, then two narrower taller ones
      const tongue = (dx, sc, col, a) => {
        ctx.fillStyle = alpha(col, a);
        ctx.beginPath();
        ctx.moveTo(cx + dx - fw * 0.62 * sc, base);
        ctx.bezierCurveTo(cx + dx - fw * 0.72 * sc, base - fh * 0.42 * sc,
          cx + dx - fw * 0.2 * sc, base - fh * 0.7 * sc, cx + dx, base - fh * sc);
        ctx.bezierCurveTo(cx + dx + fw * 0.2 * sc, base - fh * 0.7 * sc,
          cx + dx + fw * 0.72 * sc, base - fh * 0.42 * sc, cx + dx + fw * 0.62 * sc, base);
        ctx.closePath();
        ctx.fill();
      };
      tongue(0, 1, c.flame, 0.92);
      tongue(-fw * 0.3, 0.66, c.flame, 0.85);
      tongue(fw * 0.32, 0.58, c.flame, 0.8);
      tongue(0, 0.5, lighten(c.flame, 0.55), 0.85);
      tongue(fw * 0.08, 0.26, lighten(c.flame, 0.75), 0.9);
    }
  }

  _chongaPts(d) {
    const x0 = DEG_CX[d] + MOUTH_DX, y0 = MOUTH_Y, x1 = CHONGA_END[d].x, y1 = CHONGA_END[d].y;
    return [{ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 16 }, { x: x1, y: y1 }];
  }

  _chongaAt(d, t) {
    const [p0, p1, p2] = this._chongaPts(d), u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
  }

  _drawChongas(ctx, c) {
    const tube = mix(c.gold, c.stroke, 0.5);
    for (let d = 0; d < 3; d++) {
      const [p0, p1, p2] = this._chongaPts(d);
      ctx.strokeStyle = tube;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
      ctx.stroke();
      ctx.strokeStyle = alpha(lighten(tube, 0.35), 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y - 3);
      ctx.quadraticCurveTo(p1.x, p1.y - 3, p2.x, p2.y - 3);
      ctx.stroke();
      // twine bindings round the bamboo
      ctx.strokeStyle = alpha(c.label, 0.55);
      ctx.lineWidth = 2;
      for (let i = 1; i < 7; i++) {
        const p = this._chongaAt(d, i / 7);
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y - 4);
        ctx.lineTo(p.x + 7, p.y + 4);
        ctx.stroke();
      }
    }
  }

  _drawTrough(ctx, c) {
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.45);
    ctx.fillRect(TROUGH.x, TROUGH.y, TROUGH.w, TROUGH.h);
    ctx.fillStyle = alpha(c.water, 0.55);
    ctx.fillRect(TROUGH.x + 6, WATER_Y, TROUGH.w - 12, TROUGH.y + TROUGH.h - WATER_Y - 4);
    ctx.strokeStyle = alpha(lighten(c.water, 0.4), 0.8);
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      const y = WATER_Y + i * 12;
      ctx.beginPath();
      ctx.moveTo(TROUGH.x + 12, y);
      ctx.quadraticCurveTo(TROUGH.x + TROUGH.w * 0.35, y - 4, TROUGH.x + TROUGH.w * 0.5, y);
      ctx.quadraticCurveTo(TROUGH.x + TROUGH.w * 0.7, y + 4, TROUGH.x + TROUGH.w - 12, y);
      ctx.stroke();
    }
    ctx.strokeStyle = alpha(c.label, 0.35);
    ctx.lineWidth = 2;
    ctx.strokeRect(TROUGH.x, TROUGH.y, TROUGH.w, TROUGH.h);
    drawShadow(ctx, c, TROUGH.x + TROUGH.w / 2, TROUGH.y + TROUGH.h + 6, TROUGH.w / 2, 10);
  }

  // The near face of the water, over whatever stands in it: the bhapka is standing
  // in cold water, and this is what makes that read rather than merely be true.
  _drawWaterFront(ctx, c) {
    const y = WATER_Y + 3;
    ctx.fillStyle = alpha(c.water, 0.38);
    ctx.fillRect(TROUGH.x + 6, y, TROUGH.w - 12, TROUGH.y + TROUGH.h - y - 4);
    ctx.strokeStyle = alpha(lighten(c.water, 0.5), 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TROUGH.x + 10, WATER_Y + 2);
    ctx.quadraticCurveTo(TROUGH.x + TROUGH.w * 0.35, WATER_Y - 4, TROUGH.x + TROUGH.w * 0.5, WATER_Y + 1);
    ctx.quadraticCurveTo(TROUGH.x + TROUGH.w * 0.72, WATER_Y + 5, TROUGH.x + TROUGH.w - 10, WATER_Y);
    ctx.stroke();
    // a couple of ripple arcs so the surface reads as a surface
    ctx.strokeStyle = alpha(lighten(c.water, 0.45), 0.55);
    ctx.lineWidth = 2;
    for (const rx of [BHAPKA.cx - BHAPKA.rx - 16, BHAPKA.cx + BHAPKA.rx + 16]) {
      ctx.beginPath();
      ctx.arc(rx, WATER_Y + 8, 14, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }

  _poolY() {
    const fill = Math.min(1, this._pool / POOL_FULL);
    return BHAPKA.bot - 8 - (BHAPKA.bot - BHAPKA.top - 30) * fill;
  }

  _drawBhapka(ctx, c) {
    const { cx, top, bot, rx } = BHAPKA;
    drawShadow(ctx, c, cx, bot - 4, rx * 0.7, 8);
    ctx.beginPath();
    ctx.moveTo(cx - rx, top + 8);
    ctx.bezierCurveTo(cx - rx - 6, top + (bot - top) * 0.45, cx - rx * 0.6, bot - 10, cx - rx * 0.35, bot);
    ctx.lineTo(cx + rx * 0.35, bot);
    ctx.bezierCurveTo(cx + rx * 0.6, bot - 10, cx + rx + 6, top + (bot - top) * 0.45, cx + rx, top + 8);
    ctx.closePath();
    ctx.fillStyle = mix(c.gold, c.flame, 0.5);
    ctx.fill();
    ctx.strokeStyle = alpha(darken(c.gold, 0.35), 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    // the pool of condensed oil, deepening through a run
    const fill = Math.min(1, this._pool / POOL_FULL);
    if (fill > 0.005) {
      const sy = this._poolY();
      ctx.fillStyle = mix(c.gold, c.waste, 0.55);
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.92, sy);
      ctx.lineTo(cx - rx * 0.92, bot - 2);
      ctx.lineTo(cx + rx * 0.92, bot - 2);
      ctx.lineTo(cx + rx * 0.92, sy);
      ctx.bezierCurveTo(cx + rx * 0.5, sy + 5, cx - rx * 0.5, sy + 5, cx - rx * 0.92, sy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = alpha(lighten(c.gold, 0.3), 0.75);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.92, sy);
      ctx.bezierCurveTo(cx - rx * 0.5, sy + 5, cx + rx * 0.5, sy + 5, cx + rx * 0.92, sy);
      ctx.stroke();
    }
    ctx.fillStyle = mix(c.gold, c.flame, 0.25);
    ctx.beginPath();
    ctx.ellipse(cx, top + 8, rx, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alpha(darken(c.gold, 0.35), 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = alpha(darken(c.gold, 0.35), 0.5);
    ctx.beginPath();
    ctx.ellipse(cx, top + 8, rx * 0.8, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawWisps(ctx, c) {
    const col = lighten(c.glass, 0.3);
    for (const w of this._wisps) {
      const p = this._chongaAt(w.d, Math.min(1, w.t));
      const r = 3 + this._fire * 0.045;
      ctx.fillStyle = alpha(col, 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = alpha(col, 0.45);
      ctx.beginPath();
      ctx.arc(p.x - r * 1.4, p.y - r * 0.8, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawDrops(ctx, c) {
    ctx.fillStyle = mix(c.gold, c.waste, 0.35);
    for (const d of this._drops) {
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawEscape(ctx, c) {
    const col = lighten(c.glass, 0.45);
    for (const e of this._escape) {
      const a = 0.8 * e.life;
      ctx.fillStyle = alpha(col, a);
      ctx.beginPath();
      ctx.arc(e.x, e.y, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = alpha(col, a * 0.55);
      ctx.beginPath();
      ctx.arc(e.x + 12, e.y - 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = alpha(col, a * 0.4);
      ctx.beginPath();
      ctx.arc(e.x + 23, e.y - 15, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawScentCard(ctx, c) {
    if (this.stage === S_COLD) return;
    const { x, y, w, h } = CARD;
    drawCard(ctx, c, x, y, w, h, 1, {});
    const done = this.stage === S_DONE;
    const fig = done ? GENTLE_FIGURE : { c: this._shown.c, l: this._shown.l };
    const tot = fig.c + fig.l;
    const share = tot > 0 ? fig.c / tot : 0;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = font(c, 700, fs(16)); ctx.fillStyle = c.labelMuted;
    ctx.fillText('perfume caught', x + 14, y + 12);
    ctx.font = font(c, 700, fs(38), true); ctx.fillStyle = c.label;
    ctx.fillText(tot > 0 ? `${Math.round(share * 100)} %` : '-', x + 14, y + 34);
    const bx = x + 14, bw = w - 28, by = y + 88;
    rr(ctx, bx, by, bw, 16, 8); ctx.fillStyle = c.track; ctx.fill();
    if (tot > 0) {
      const cw = bw * share, lw = bw - cw;
      if (cw > 2) { rr(ctx, bx, by, cw, 16, 8); ctx.fillStyle = c.good; ctx.fill(); }
      if (lw > 2) { rr(ctx, bx + cw, by, lw, 16, 8); ctx.fillStyle = c.warning; ctx.fill(); }
    }
  }

  _drawLabels(ctx, c) {
    if (this.stage === S_COLD) return;
    if (this.stage === S_DONE) {
      chipRow(ctx, c, [
        { text: 'deg = flask', bg: c.raised, ink: c.label },
        { text: 'chonga = side arm', bg: c.raised, ink: c.label },
        { text: 'bhapka = condenser and collecting flask', bg: c.raised, ink: c.label },
      ], 340, PHONE ? 424 : 462, { align: 'center', size: fs(15), wrapAt: 640 });
      return;
    }
    const names = [
      { text: 'deg', at: { x: DEG_CX[1], y: DEG_TOP - 26 }, from: { x: DEG_CX[1], y: DEG_TOP + 2 } },
      { text: 'chonga', at: { x: 262, y: 190 }, from: { x: 300, y: 240 } },
      { text: 'bhapka', at: { x: 410, y: 318 }, from: { x: 454, y: 322 } },
      { text: 'trough', at: { x: 620, y: 322 }, from: { x: 620, y: 356 } },
    ];
    for (const n of names) {
      leader(ctx, n.at.x, n.at.y, n.from.x, n.from.y, c.labelMuted, 0.8);
      pill(ctx, c, n.text, n.at.x, n.at.y, { bg: c.raised, ink: c.label, size: fs(16) });
    }
    pill(ctx, c, this._fire === FIERCE_FIRE ? 'big fire' : 'gentle fire', 138, 376, { bg: this._fire === FIERCE_FIRE ? c.flame : c.raised, ink: this._fire === FIERCE_FIRE ? undefined : c.label, size: fs(17), display: true });
    if (this.stage === S_FIERCE && this._escape.length > 0) pill(ctx, c, 'scent lost to the air', 530, 232, { bg: c.warning, size: fs(16), display: true });
  }

  // Host controls. `v` is a STRING for slider/select/number/segmented, true for a button.
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'fire') {
      this._fire = Number(v) >= 100 ? FIERCE_FIRE : GENTLE_FIRE;
    } else if (id === 'run') {
      const back = this._fire === GENTLE_FIRE && this._sawBig && !this._found;
      if (this._fire === FIERCE_FIRE) this._sawBig = true;
      if (back) {
        this._found = true;
        this.celebrate(BHAPKA.cx, BHAPKA.top - 10, 18, { key: 'gentle-fire' });
      }
      this._launch();
    }
    this.animateFor(900);
    this.requestUiUpdate?.();
  }

  getControlValue(id) { return id === 'fire' ? String(this._fire) : super.getControlValue(id); }
}

