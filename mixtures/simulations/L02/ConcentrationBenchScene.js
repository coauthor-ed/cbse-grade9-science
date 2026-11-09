/**
 * ConcentrationBenchScene - blk-l02-s03 (4 beats) and the beat-less predict blk-l02-s02.
 *
 * The bar is the idea: one gram is the same length all the time, so the salt slice cannot change and
 * the whole bar visibly grows. The percentage is the slice against the WHOLE bar, never against the water.
 *   predict  10 g in 90 g, a beaker of 10 g of water waiting. Nothing to press, no answer on screen.
 *   b0  Add 10 g of water: the bar grows from 100 g to 110 g and the reading falls to 9.1 %.
 *   b1  m/m, the book's Example 5.1: a slider sets the salt; solution = salt + 90 g.
 *   b2  m/v, Example 5.2: 5 g of glucose in a volumetric flask, filled UP TO the mark.
 *   b3  v/v, Example 5.3: 1 mL of pesticide in a cylinder, made up to 100 mL.
 * Each reading is the fraction with the book's own numbers.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, clamp01, darken, drawBackdrop, drawBench, drawCard, drawFloor, drawShadow, font, inkOn, lighten, mix, mulberry32, pill, rr,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, wallsAt } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const BENCH = 428;
const PX_G = 4.0;                         // one gram of bar, always
const BAR = { x: 34, y: 66, h: 34 };
const PANEL = { x: 14, y: 12, w: 652, h: 122 };
const READ = { x: 424, y: 150, w: 240, h: 136 };
const JAR = glassBox('jar', 146, 176, 196, 198, { wall: 6, r: 14 });
const SCALE = { x: 112, y: 374, w: 264, h: 54 };
const BEAKER = { x: 452, w: 104, y: 306, h: 122 };
const FLASK = glassBox('round', 150, 56, 250, 372, { neck: 0.2, wall: 5 });
const MARK_Y = 136;
const CYL = glassBox('cylinder', 186, 70, 136, 358, { wall: 6, r: 6 });
const SALT = 10, WATER = 90, ADD = 10;
const POUR_S = 2.4, FILL_S = 2;

const S_ADD = 0, S_MM = 1, S_MV = 2, S_VV = 3;
const MAP = [S_ADD, S_MM, S_MV, S_VV].map((i) => [{ idx: i, dwellMs: null }]);

export class ConcentrationBenchScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  // The predict slide is a beat-less mount: the host sends the largest safe integer as the count.
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [MAP[S_ADD]] };
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A jar of salt solution stands on a balance. A long bar shows the salt as a slice of the whole solution. '
    + 'Adding 10 g of water leaves the salt slice the same length and makes the whole bar grow from 100 g to 110 g, so the '
    + 'percentage falls from 10 to 9.1. Then 5 g of glucose is made up to 100 mL in a flask, which is 5 % m/v, and 1 mL of '
    + 'pesticide is made up to 100 mL in a cylinder, which is 1 % v/v.';
  static CONTROLS = [
    { type: 'button', id: 'add', label: 'Add 10 g of water' },
    { type: 'slider', id: 'salt', label: 'Salt', min: 5, max: 30, step: 5, value: SALT, suffix: ' g' },
    { type: 'button', id: 'fill', label: 'Fill up to the mark' },
    { type: 'button', id: 'water', label: 'Add water up to 100 mL' },
    { type: 'button', id: 'reset', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._u = 0;                         // how far this stage's action has run, 0..1
    this._go = 0;                        // seconds it takes while it is running; 0 at rest
    this._salt = SALT;
    this._found = false;
  }

  get _setup() { return !(this.beatCount > 0) || this.beatCount === Number.MAX_SAFE_INTEGER; }

  isControlHidden(id) {
    if (this._setup) return true;
    if (id === 'add') return this.stage !== S_ADD;
    if (id === 'salt') return this.stage !== S_MM;
    if (id === 'fill') return this.stage !== S_MV;
    if (id === 'water') return this.stage !== S_VV;
    return this.stage === S_MM;           // reset
  }

  isControlDisabled(id) {
    if (id === 'reset') return this._go > 0 || this._u === 0;
    if (id === 'salt') return false;
    return this._go > 0 || this._u >= 1;
  }

  getControlValue(id) { return id === 'salt' ? String(this._salt) : super.getControlValue(id); }

  enter() { this._u = 0; this._go = 0; this._salt = SALT; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'salt') this._salt = Number(v);
    else if (id === 'reset') { this._u = 0; this._go = 0; }
    else {
      this._go = this.stage === S_ADD ? POUR_S : FILL_S;
      if (id === 'add') this.after(POUR_S + 0.05, () => this._findNine());
    }
    this.requestUiUpdate?.();
  }

  /** The find: the reading lands on 9.1 % with the salt slice unchanged. */
  _findNine() {
    if (this._found) return;
    this._found = true;
    this.celebrate(READ.x + READ.w / 2, READ.y + 70, 22, { key: 'nine-point-one', lookAt: true });
  }

  update(d) {
    if (this._go > 0) {
      this._u = Math.min(1, this._u + d / this._go);
      if (this._u >= 1) this._go = 0;
    }
  }

  busy() { return this._go > 0; }

  /** The water poured so far, with the stream landing after the beaker has tipped. */
  get _added() { return this.stage === S_ADD && !this._setup ? ADD * clamp01((this._u - 0.25) / 0.55) : 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 66);
    drawBench(ctx, c, 12, 668, BENCH, { h: 40 });
    if (this._setup || this.stage <= S_MM) this._massBench(ctx, c);
    else if (this.stage === S_MV) this._flask(ctx, c);
    else this._cylinder(ctx, c);
  }

  // -- by mass -----------------------------------------------------------------------------------

  _massBench(ctx, c) {
    const salt = this.stage === S_MM && !this._setup ? this._salt : SALT;
    const water = WATER + this._added;
    this._bar(ctx, c, salt, water, 'g', 'salt', 'water');
    this._scale(ctx, c, salt + water);
    this._jar(ctx, c, salt, water);
    if (this._setup) {
      this._read(ctx, c, { top: '10 g', bot: '100 g', ans: '10 %', tag: 'm/m' });
      this._beaker(ctx, c, 0);
      pill(ctx, c, '10 g of water', BEAKER.x + BEAKER.w / 2, BEAKER.y - 12, { bg: c.raised, size: fs(16) });
      return;
    }
    const total = salt + water;
    const pct = (salt / total) * 100;
    const done = this.stage === S_MM || this._u >= 1 || this._u === 0;
    this._read(ctx, c, {
      top: `${salt} g`, bot: `${Math.round(total)} g`,
      ans: done ? `${Number.isInteger(pct) ? pct : pct.toFixed(1)} %` : '...', tag: 'm/m', good: this._u >= 1,
    });
    if (this.stage === S_ADD) this._beaker(ctx, c, this._u);
  }

  /** The bar. Grams are drawn at one fixed length, so a growing whole is what the eye sees. */
  _bar(ctx, c, part, rest, unit, partName, restName) {
    const p = PANEL;
    drawCard(ctx, c, p.x, p.y, p.w, p.h, 1, { accent: c.accent });
    const wPart = Math.max(4, part * PX_G), wRest = rest * PX_G;
    const { x, y, h } = BAR;
    ctx.fillStyle = darken(c.water, 0.25);
    rr(ctx, x, y + 3, wPart + wRest, h, 8); ctx.fill();
    ctx.save();
    rr(ctx, x, y, wPart + wRest, h, 8); ctx.clip();
    ctx.fillStyle = mix(c.water, c.bgSurface, 0.3);
    ctx.fillRect(x, y, wPart + wRest, h);
    ctx.fillStyle = c.s5;
    ctx.fillRect(x, y, wPart, h);
    ctx.restore();
    ctx.fillStyle = inkOn(c, mix(c.water, c.bgSurface, 0.3));
    ctx.font = font(c, 800, fs(16));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(rest)} ${unit} ${restName}`, x + wPart + 12, y + h / 2);
    ctx.fillStyle = c.label;
    ctx.fillText(`${part} ${unit} ${partName}`, x, y - 18);
    const end = x + wPart + wRest;                      // the bracket under the whole bar
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + h + 10); ctx.lineTo(x, y + h + 17); ctx.lineTo(end, y + h + 17); ctx.lineTo(end, y + h + 10);
    ctx.stroke();
    ctx.font = font(c, 800, fs(20), true);
    ctx.textAlign = 'left';
    const whole = Math.round(part + rest);
    ctx.fillText(`${whole} ${unit} solution`, end + 12, y + h / 2);
  }

  _scale(ctx, c, grams) {
    const s = SCALE;
    drawShadow(ctx, c, s.x + s.w / 2, BENCH + 3, s.w * 0.5, 7);
    ctx.fillStyle = darken(c.raised, 0.18);
    rr(ctx, s.x, s.y + 8, s.w, s.h - 8, 10); ctx.fill();
    ctx.fillStyle = c.raised;
    rr(ctx, s.x, s.y + 8, s.w, s.h - 14, 10); ctx.fill();
    ctx.fillStyle = darken(c.gold, 0.2);
    rr(ctx, s.x + 18, s.y, s.w - 36, 10, 5); ctx.fill();
    ctx.fillStyle = c.bgDeep;
    rr(ctx, s.x + s.w / 2 - 64, s.y + 16, 128, 28, 6); ctx.fill();
    ctx.fillStyle = c.label;
    ctx.font = font(c, 800, fs(20), true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${grams.toFixed(0)} g`, s.x + s.w / 2, s.y + 31);
  }

  _jar(ctx, c, salt, water) {
    drawGlass(ctx, c, JAR, { shadow: false });
    const level = 0.42 + ((salt + water) - 100) * 0.0075;
    const sy = drawGlassLiquid(ctx, c, JAR, { level, fill: lighten(c.water, 0.3), opacity: 0.55 });
    if (sy == null) return;
    const n = salt * 3;                                  // the specks stay as many as the salt is
    const rnd = mulberry32(5);
    for (let i = 0; i < n; i++) {
      const u = ((i * 7) % 10 + rnd() * 0.8) / 10, v = ((i * 11) % 9 + rnd() * 0.8) / 9;
      const x = JAR.inner.x + 14 + u * (JAR.inner.w - 28), y = sy + 10 + v * (JAR.floor - sy - 18);
      ctx.fillStyle = darken(c.glass, 0.32);
      ctx.beginPath(); ctx.arc(x + 0.8, y + 1, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lighten(c.glass, 0.94);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** The small beaker of water: it lifts, tips over the jar, empties, and comes back. */
  _beaker(ctx, c, u) {
    const lift = clamp01(u / 0.22) * (1 - clamp01((u - 0.84) / 0.16));
    const b = BEAKER;
    const dx = (JAR.x + JAR.w + 30 - b.x) * lift, dy = -(b.y - 96) * lift * 0.82;
    const tip = -1.1 * lift;
    const left = 0.58 * (1 - clamp01((u - 0.25) / 0.55));
    ctx.save();
    ctx.translate(b.x + dx + b.w / 2, b.y + dy + b.h / 2);
    ctx.rotate(tip);
    ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    const g = glassBox('beaker', b.x, b.y, b.w, b.h, { wall: 4, r: 8 });
    drawGlass(ctx, c, g, { shadow: lift < 0.05 });
    drawGlassLiquid(ctx, c, g, { level: left, fill: lighten(c.water, 0.3), opacity: 0.55 });
    ctx.restore();
    if (u > 0.25 && u < 0.8) {                           // the stream, from the lip down into the jar
      const lx = b.x + dx + b.w / 2 - Math.cos(1.1) * b.w * 0.52 - Math.sin(1.1) * b.h * 0.5;
      const ly = b.y + dy + b.h / 2 - Math.cos(1.1) * b.h * 0.5 + Math.sin(1.1) * b.w * 0.52;
      ctx.strokeStyle = alpha(lighten(c.water, 0.2), 0.85);
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lx - 12, ly + 40, lx - 14, JAR.floor - 86);
      ctx.stroke();
    }
  }

  /** The reading: the fraction with its own numbers, then the percentage. */
  _read(ctx, c, { top, bot, ans, tag, good = false }) {
    const r = READ;
    drawCard(ctx, c, r.x, r.y, r.w, r.h, 1, { accent: good ? c.good : c.accent });
    const fx = r.x + 62, cy = r.y + r.h / 2 + 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label;
    ctx.font = font(c, 800, fs(24), true);
    ctx.fillText(top, fx, cy - 22);
    ctx.fillText(bot, fx, cy + 24);
    ctx.fillRect(fx - 46, cy - 2, 92, 4);
    ctx.font = font(c, 800, 38, true);
    ctx.fillStyle = good ? c.good : c.label;
    ctx.fillText(ans, r.x + 170, cy);
    pill(ctx, c, tag, r.x + r.w - 40, r.y + 2, { bg: c.raised, size: fs(16) });
  }

  // -- by volume ---------------------------------------------------------------------------------

  _flask(ctx, c) {
    const u = this._u;
    const g = FLASK;
    drawGlass(ctx, c, g, {});
    const body = g.floor - 100;                          // a little water to dissolve the glucose in
    const sy = body + (MARK_Y - body) * clamp01(u);
    drawGlassLiquid(ctx, c, g, { surface: sy, fill: lighten(c.water, 0.35), opacity: 0.5 });
    const w = wallsAt(g, MARK_Y);
    ctx.strokeStyle = c.warning;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo((w?.[0] ?? g.cx - 24) - 10, MARK_Y); ctx.lineTo((w?.[1] ?? g.cx + 24) + 10, MARK_Y); ctx.stroke();
    pill(ctx, c, 'the mark: 100 mL', g.x + g.w + 44, MARK_Y, { bg: c.warning, size: fs(16) });
    pill(ctx, c, '5 g glucose', g.cx, g.floor - 56, { bg: c.s5, size: fs(18) });
    this._read(ctx, c, { top: '5 g', bot: '100 mL', ans: u >= 1 ? '5 %' : '...', tag: 'm/v', good: u >= 1 });
  }

  _cylinder(ctx, c) {
    const u = this._u;
    const g = CYL;
    drawGlass(ctx, c, g, { ticks: 19 });
    const fullY = g.top + 26;
    const dropH = 6;
    if (u > 0) {
      const sy = g.floor - dropH + (fullY - (g.floor - dropH)) * clamp01(u);
      drawGlassLiquid(ctx, c, g, { surface: sy, fill: lighten(c.water, 0.35), opacity: 0.5 });
    }
    ctx.fillStyle = alpha(c.s3, u > 0 ? 0.85 * (1 - clamp01(u * 1.4)) : 0.95);
    rr(ctx, g.inner.x + 2, g.floor - dropH - 2, g.inner.w - 4, dropH + 2, 3); ctx.fill();
    ctx.strokeStyle = c.warning;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(g.x - 10, fullY); ctx.lineTo(g.x + g.w + 10, fullY); ctx.stroke();
    pill(ctx, c, '100 mL', g.x + g.w + 56, fullY, { bg: c.warning, size: fs(18) });
    pill(ctx, c, '1 mL pesticide', g.x + g.w + 82, g.floor - 8, { bg: c.s3, size: fs(18) });
    this._read(ctx, c, { top: '1 mL', bot: '100 mL', ans: u >= 1 ? '1 %' : '...', tag: 'v/v', good: u >= 1 });
  }

}
