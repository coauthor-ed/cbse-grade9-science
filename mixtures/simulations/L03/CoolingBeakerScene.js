// CoolingBeakerScene - one beaker of pale solution, one temperature control, two big readings.
//
// Three mounts, told apart by the beat count, each with its own stages so enter() always runs:
//   0 beats  blk-l03-s02, the predict: 70 C, 320 g dissolved, the curve's two readings. Nothing moves.
//   3 beats  blk-l03-s01, the hook: 287 g saturated at 60 C (the book's own numbers). Cool it and a
//            solid forms on the floor of the beaker.
//   4 beats  blk-l03-s03, the answer: 320 g at 20 C, 205 g dissolved, 115 g solid. Stage 6 opens a
//            lens on the solid to show the regular pattern; stage 7 asks if the solid is pure.
//
// The model is one line. The beaker holds TOTAL g for ever; dissolved = min(TOTAL, solubility(T)),
// solid = TOTAL - dissolved. The two readings always add up to TOTAL.
// Compound B is pale and its crystals are white. Blue is for copper sulfate only.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, font, pill, chipRow, rr, drawCard, drawBackdrop, drawFloor, drawBench, drawShadow, clamp,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';
import { drawSolidHeap, drawCrystalLattice } from './CrystalBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const DEG = '\u00b0';

// The book's curve for compound B, g per 100 g of water.
const B_PTS = [[10, 190], [20, 205], [30, 220], [40, 241], [50, 260], [60, 287], [70, 320], [80, 360]];
const T_MIN = 10, T_MAX = 80;
const G_MAX = 400;

function solB(t) {
  if (t <= B_PTS[0][0]) return B_PTS[0][1];
  for (let i = 1; i < B_PTS.length; i += 1) {
    if (t <= B_PTS[i][0]) {
      const [t1, g1] = B_PTS[i], [t0, g0] = B_PTS[i - 1];
      return g0 + ((g1 - g0) * (t - t0)) / (t1 - t0);
    }
  }
  return B_PTS[B_PTS.length - 1][1];
}

const BENCH_Y = 436;
const BK = { x: 208, y: 146, w: 256, h: 290 };
const FILL = 0.84;
const LEFT = { x: 12, y: 112, w: 184, h: 300 };
const RIGHT = { x: 478, y: 112, w: 190, h: 196 };
const LENS = { x: 573, y: 372, r: 54 };
const PLOT = { x: LEFT.x + 22, y: LEFT.y + 50, w: LEFT.w - 40, h: 170 };

const S_SETUP = 0, S_HOOK = 1, S_ANSWER = 4;
const stageMap = (from, n) => Array.from({ length: n }, (_, i) => [{ idx: from + i, dwellMs: null }]);

export class CoolingBeakerScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = stageMap(S_HOOK, 3);
  // The predict slide is a beat-less mount: the host sends the largest safe integer as the count.
  static BEAT_MAPS = { 0: stageMap(S_SETUP, 1), [Number.MAX_SAFE_INTEGER]: stageMap(S_SETUP, 1), 3: stageMap(S_HOOK, 3), 4: stageMap(S_ANSWER, 4) };
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A beaker of clear, pale solution on a lab bench with a thermometer in it. Cooling it makes a white solid form on the floor of the beaker. Two readings show how much is still dissolved and how much is solid, and together they always make the same total.';
  static CONTROLS = [
    { type: 'slider', id: 'temp', label: 'Temperature', min: T_MIN, max: T_MAX, step: 1, value: 60, suffix: ` ${DEG}C` },
  ];

  constructor(container, config) {
    super(container, config);
    this._T = 60;
    this._total = 287;
    this._shown = 0;            // the solid as drawn, easing to the true value
    this._found = false;
  }

  get _setupMount() { return this.stage === S_SETUP; }
  get _answer() { return this.stage >= S_ANSWER; }
  get _solid() { return this._total - Math.min(this._total, solB(this._T)); }

  enter(stage) {
    if (stage === S_SETUP) { this._T = 70; this._total = 320; }
    else if (stage === S_HOOK) { this._T = 60; this._total = 287; }
    else if (stage === S_HOOK + 1) { this._T = 40; this._total = 287; }
    else if (stage === S_HOOK + 2) { this._T = 20; this._total = 287; }
    else { this._T = 20; this._total = 320; }
    this._shown = this._solid;
    this._found = false;
  }

  isControlHidden(id) { return id === 'temp' && this._setupMount; }
  getControlValue(id) { return id === 'temp' ? String(this._T) : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id !== 'temp') return;
    this._T = clamp(Math.round(Number(v)), T_MIN, T_MAX);
    if (this.stage === S_HOOK && !this._found && this._T <= 40) {
      this._found = true;
      this.celebrate(BK.x + BK.w / 2, BK.y + BK.h - 50, 18);
    }
    this.animateFor(900);
    this.requestUiUpdate?.();
  }

  update(d) {
    this._shown += (this._solid - this._shown) * Math.min(1, d * 7);
    if (Math.abs(this._solid - this._shown) < 0.2) this._shown = this._solid;
  }

  busy() { return Math.abs(this._solid - this._shown) > 0.2; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 492);
    drawBench(ctx, c, 0, 680, BENCH_Y, { h: 56 });
    this._beaker(ctx, c);
    this._curve(ctx, c);
    this._readings(ctx, c);
    if (this.stage >= S_ANSWER + 2) this._lens(ctx, c);
    this._top(ctx, c);
  }

  _beaker(ctx, c) {
    const g = glassBox('beaker', BK.x, BK.y, BK.w, BK.h, { wall: 6, r: 14 });
    const tone = mix(mix(c.glass, c.bgSurface, 0.25), c.gold, 0.32);   // a pale straw colour: blue is copper sulfate's
    drawShadow(ctx, c, BK.x + BK.w / 2, BENCH_Y + 2, BK.w * 0.52, 8);
    drawGlass(ctx, c, g, { shadow: false, ticks: 6 });
    drawGlassLiquid(ctx, c, g, { level: FILL, fill: tone, opacity: 0.42 });
    const inner = g.inner;
    ctx.save();
    ctx.beginPath(); ctx.rect(inner.x, inner.y, inner.w, inner.h); ctx.clip();
    drawSolidHeap(ctx, c, { x: inner.x + inner.w * 0.08, w: inner.w * 0.84, floorY: g.floor - 2,
      amount: clamp(this._shown / 130, 0, 1), maxH: 118, seed: 17, tone: lighten(c.glass, 0.93) });
    ctx.restore();
    this._thermometer(ctx, c, g);
  }

  /** A real thermometer, standing in the liquid and leaning on the rim. */
  _thermometer(ctx, c, g) {
    const x0 = g.x + g.w - 62, y0 = 86, x1 = g.x + g.w - 104, y1 = g.floor - 56;
    const len = Math.hypot(x1 - x0, y1 - y0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2);
    const u = (this._T - 0) / 100;
    rr(ctx, -7, -4, 14, len + 4, 7);
    ctx.fillStyle = mix(c.bgSurface, c.glass, 0.5); ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = c.bad;
    ctx.fillRect(-2.5, len - (len - 10) * u, 5, (len - 10) * u + 2);
    ctx.beginPath(); ctx.arc(0, len + 4, 11, 0, Math.PI * 2); ctx.fillStyle = c.bad; ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.stroke();
    ctx.beginPath(); ctx.arc(-3.5, len + 0, 3, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(c.bad, 0.7), 0.85); ctx.fill();
    ctx.restore();
  }

  _top(ctx, c) {
    pill(ctx, c, `${this._T} ${DEG}C`, BK.x + BK.w / 2 - 34, 62, { bg: c.raised, ink: c.label, size: fs(30), display: true });
    if (this.stage === S_HOOK && !this._found) {
      chipRow(ctx, c, [{ text: `cool to 40 ${DEG}C`, bg: c.warning }], BK.x + BK.w / 2 - 34, 108, { size: fs(16), align: 'center' });
    }
    if (this.stage === S_ANSWER + 3) {
      chipRow(ctx, c, [{ text: 'pure solid?', bg: c.warning }], BK.x + BK.w / 2, BK.y + BK.h - 150, { size: fs(18), align: 'center' });
    }
  }

  /** The book's curve for compound B: a live dot follows the temperature. */
  _curve(ctx, c) {
    drawCard(ctx, c, LEFT.x, LEFT.y, LEFT.w, LEFT.h, 1, {});
    const X = (t) => PLOT.x + ((t - T_MIN) / (T_MAX - T_MIN)) * PLOT.w;
    const Y = (g) => PLOT.y + PLOT.h - (g / G_MAX) * PLOT.h;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = font(c, 700, fs(17), true); ctx.fillStyle = c.label;
    ctx.fillText('Solubility', LEFT.x + 16, LEFT.y + 13);
    if (!PHONE) {
      ctx.font = font(c, 600, 14); ctx.fillStyle = c.labelMuted;
      ctx.fillText('g in 100 g water', LEFT.x + 16, LEFT.y + 34);
    }
    ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PLOT.x, PLOT.y); ctx.lineTo(PLOT.x, PLOT.y + PLOT.h); ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h); ctx.stroke();
    ctx.beginPath();
    B_PTS.forEach(([t, g], i) => (i ? ctx.lineTo(X(t), Y(g)) : ctx.moveTo(X(t), Y(g))));
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

    const marks = this._total === 320 ? [[70, 320], [20, 205]] : [[60, 287], [40, 241]];
    for (const [t, g] of marks) {
      ctx.beginPath(); ctx.arc(X(t), Y(g), 6, 0, Math.PI * 2);
      ctx.fillStyle = c.bgSurface; ctx.fill();
      ctx.strokeStyle = c.gold; ctx.lineWidth = 3; ctx.stroke();
    }
    const lim = Math.min(solB(this._T), 400);
    ctx.setLineDash([4, 5]); ctx.strokeStyle = alpha(c.accent, 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(this._T), PLOT.y + PLOT.h); ctx.lineTo(X(this._T), Y(lim)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(X(this._T), Y(lim), 7, 0, Math.PI * 2); ctx.fillStyle = c.accent; ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 2; ctx.stroke();

    ctx.font = font(c, 700, fs(14)); ctx.fillStyle = c.labelMuted; ctx.textBaseline = 'top';
    ctx.textAlign = 'left'; ctx.fillText(`${T_MIN}`, PLOT.x - 6, PLOT.y + PLOT.h + 5);
    ctx.textAlign = 'right'; ctx.fillText(`${T_MAX} ${DEG}C`, PLOT.x + PLOT.w + 10, PLOT.y + PLOT.h + 5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = font(c, 700, fs(15));
    ctx.fillStyle = c.label;
    const y0 = LEFT.y + LEFT.h - 14;
    if (!PHONE) ctx.fillText(marks.map(([t, g]) => `${g} g at ${t}`).join('  '), LEFT.x + LEFT.w / 2, y0, LEFT.w - 18);
  }

  _readings(ctx, c) {
    const R = RIGHT;
    drawCard(ctx, c, R.x, R.y, R.w, R.h, 1, {});
    const row = (y, label, value, ink) => {
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = font(c, 700, fs(16)); ctx.fillStyle = c.labelMuted;
      ctx.fillText(label, R.x + 18, y);
      ctx.font = font(c, 700, fs(38), true); ctx.fillStyle = ink;
      ctx.fillText(value, R.x + 18, y + fs(16) + 6);
    };
    const dis = Math.min(this._total, solB(this._T));
    row(R.y + 14, 'still dissolved', `${Math.round(dis)} g`, c.label);
    const solid = this._setupMount ? '?' : `${Math.round(this._solid)} g`;
    row(R.y + 106, 'solid', solid, this._setupMount ? c.labelMuted : c.s1ink);
  }

  /** A lens on the solid: the regular pattern inside a crystal. */
  _lens(ctx, c) {
    const L = LENS;
    ctx.strokeStyle = alpha(c.stroke, 0.8); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(BK.x + BK.w - 40, BK.y + BK.h - 34); ctx.lineTo(L.x - L.r + 4, L.y + 8); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2);
    ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.clip();
    drawCrystalLattice(ctx, c, { x: L.x - L.r - 4, y: L.y - L.r - 4, w: L.r * 2 + 8, h: L.r * 2 + 8, cols: 6, rows: 6, tone: mix(c.glass, c.accent, 0.3) });
    ctx.restore();
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2);
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 5; ctx.stroke();
    pill(ctx, c, 'crystal', L.x, L.y + L.r + 8, { bg: c.raised, ink: c.label, size: fs(15) });
  }
}
