// BloodSpinScene - blood in a centrifuge, on two blocks told apart by beat count.
//   blk-l07-s03, 4 beats (stages 0-3)
//     0  the tube in its rack: the learner guesses the number of layers
//     1  the spin: into the machine opposite a water tube, back out with three layers, named
//     2  a lens the learner moves down the tube: what is in each layer, as cells, not colours
//     3  a blood bank: one donation goes into four labelled bags
//   blk-l07-s08, 3 beats (stages 4-6): the puzzle L08 answers. Blood is never named a suspension here.
//     4  blood and muddy water spun side by side: both come apart
//     5  magnification: no cells to the eye, cells under a microscope
//     6  two lists of evidence that do not agree, and the tube between them
// The run moves colours, not volume: the three layers were always in the tube. The pale layer is drawn at 2 % so it can be
// seen; the real one is under 1 %. Cells in the lens are not to scale with one another beyond white being larger than red.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, chipRow, darken, drawBackdrop, drawBadge, drawCard, drawFloor, drawVignette, font, leader, lighten, mix, mulberry32, pill, rr,
} from 'simulations/base/kit/SimLook.js';
import { BLOOD_TONES, clamp01, drawBenchTop, drawCentrifuge, drawLens, drawRack, drawSampleTube, lensPath, paintSpun } from './CentrifugeBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;

const BANDS = { plasma: 0.53, coat: 0.03, cells: 0.44 };
const FILL = 0.86;
const BENCH_Y = 416;
const TUBE = { x: 300, y: 92, w: 84, h: 296 };
const LEFT = { x: 152, y: 92, w: 84, h: 296 };
const LENS = { x: 510, y: 214, r: 118 };
const MCX = 340;
const MACHINE = { w: 410, h: 268, arm: 50, bucketW: 42, bucketH: 124, lidRise: 66 };

const paintBlood = (u, soft) => (ctx, col) => paintSpun(ctx, {
  ...col, u, soft, mixed: BLOOD_TONES.mixed,
  top: [{ frac: BANDS.plasma, col: BLOOD_TONES.plasma }],
  bottom: [{ frac: BANDS.coat, col: BLOOD_TONES.coat }, { frac: BANDS.cells, col: BLOOD_TONES.cells }],
});
const mudOf = (c) => mix(darken(c.gold, 0.5), c.flame, 0.12);
const paintMud = (c, u, soft) => (ctx, col) => paintSpun(ctx, {
  ...col, u, soft, mixed: mix(c.water, mudOf(c), 0.62),
  top: [{ frac: 0.7, col: mix(c.water, lighten(c.glass, 0.55), 0.6) }], bottom: [{ frac: 0.3, col: darken(mudOf(c), 0.14) }],
});

const MAP_S03 = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const MAP_S08 = [4, 5, 6].map((i) => [{ idx: i, dwellMs: null }]);

const CELLS = (() => {
  const rnd = mulberry32(31);
  return Array.from({ length: 70 }, () => ({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, a: rnd() * TAU, k: rnd() }));
})();
const BAGS = [
  { name: 'plasma', tone: () => BLOOD_TONES.plasma, lv: 0.82 },
  { name: 'platelets', tone: () => BLOOD_TONES.coat, lv: 0.34 },
  { name: 'white cells', tone: () => BLOOD_TONES.coat, lv: 0.2 },
  { name: 'red cells', tone: () => BLOOD_TONES.cells, lv: 0.72 },
];

export class BloodSpinScene extends SimScene {
  static BEAT_MAPS = { 4: MAP_S03, 3: MAP_S08 };
  static BEAT_STEP_MAP = MAP_S03;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A capped tube of blood in a rack. Spun in a centrifuge opposite a tube of water, it comes back with pale yellow plasma on top, a thin pale layer of platelets and white blood cells, and dark red red blood cells at the bottom. A lens moved down the tube shows the cells in each layer. Donated blood goes into four bags. On a second block, blood and muddy water both come apart in the machine, but no cell can be seen in blood without a microscope, so the clues do not agree.';
  static CONTROLS = [
    { type: 'segmented', id: 'guess', label: 'Layers after the spin', value: '', options: [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }, { value: '3', label: 'Three' }] },
    { type: 'button', id: 'spin', label: 'Spin for one minute' },
    { type: 'slider', id: 'lens', label: 'Lens, top to bottom', min: 0, max: 100, step: 1, value: 0 },
    { type: 'button', id: 'bag', label: 'Separate the donation' },
    { type: 'slider', id: 'mag', label: 'Magnification', min: 1, max: 400, step: 1, value: 1, suffix: ' x' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._guess = '';
    this._u = 0; this._run = false; this._t = 0;
    this._rot = 0; this._swing = 0; this._lid = 1; this._phase = 0;
    this._lens = 0; this._seen = new Set();
    this._bag = 0; this._bagging = false;
    this._mag = 1;
    this._drag = false;
  }

  enter(stage) {
    this._fresh();
    if (stage === 2 || stage === 3) this._u = 1;
    if (stage === 6) this._u = 1;
    this.requestUiUpdate?.();
  }

  get _inMachine() { return this._run || this._rot > 0.5 || this._swing > 0.02 || this._lid < 0.97; }

  isControlHidden(id) {
    const st = this.stage;
    if (id === 'guess') return st !== 0;
    if (id === 'spin') return st !== 1 && st !== 4;
    if (id === 'lens') return st !== 2;
    if (id === 'bag') return st !== 3;
    if (id === 'mag') return st !== 5;
    return false;
  }
  isControlDisabled(id) {
    if (id === 'spin') return this._run || this._u >= 1;
    if (id === 'bag') return this._bagging || this._bag >= 1;
    return false;
  }
  getControlValue(id) {
    if (id === 'lens') return String(this._lens);
    if (id === 'mag') return String(this._mag);
    if (id === 'guess') return this._guess;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'guess') this._guess = String(v);
    else if (id === 'spin') { this._run = true; this._t = 0; } else if (id === 'lens') this._moveLens(Number(v));
    else if (id === 'bag') this._bagging = true;
    else if (id === 'mag') {
      this._mag = Number(v);
      if (this._mag >= 100) this._find(LENS.x, LENS.y, 'cells-seen');
    }
    this.animateFor(600);
    this.requestUiUpdate?.();
  }

  _find(x, y, key) {
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this.celebrate(x, y, 18, { key, small: true });
  }

  _moveLens(v) {
    this._lens = Math.max(0, Math.min(100, v));
    if (this._band() === 'coat') this._find(LENS.x, LENS.y, 'pale-layer');
  }

  /** The layer under the lens. */
  _band() {
    const f = this._lens / 100;
    if (f < BANDS.plasma - 0.02) return 'plasma';
    if (f <= BANDS.plasma + BANDS.coat + 0.03) return 'coat';
    return 'cells';
  }

  update(d) {
    const ease = (v, to, tau) => (Math.abs(to - v) < 1e-3 ? to : v + (to - v) * (1 - Math.exp(-d / tau)));
    if (this._run || this._inMachine) {
      this._lid = ease(this._lid, this._run || this._swing > 0.02 ? 0 : 1, 0.25);
      this._rot = ease(this._rot, this._run && this._lid < 0.05 ? 80 : 0, 0.4);
      if (!this._run && this._rot < 0.5) this._rot = 0;
      this._swing = ease(this._swing, this._rot > 0 ? 1 - Math.exp(-this._rot / 6) : 0, 0.3);
      this._phase += (this._rot / 100) * 14 * d;
    }
    if (this._run) {
      this._t += d * (this._rot / 100) ** 2;
      this._u = clamp01(this._t / 1);
      if (this._u >= 1) { this._run = false; this.requestUiUpdate?.(); }
    }
    if (this._bagging) {
      this._bag = Math.min(1, this._bag + d / 3);
      if (this._bag >= 1) { this._bagging = false; this.requestUiUpdate?.(); }
    }
  }

  busy() { return this._run || this._inMachine || this._bagging; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH_Y + 58);
    drawBenchTop(ctx, c, { x0: 20, x1: 660, y: BENCH_Y });
    const st = this.stage;
    if (st === 0) this._before(ctx, c);
    else if (st === 1) { if (this._inMachine) this._machine(ctx, c); else this._after(ctx, c); } else if (st === 2) this._lensView(ctx, c);
    else if (st === 3) this._bank(ctx, c);
    else if (st === 4) { if (this._inMachine) this._machine(ctx, c, true); else this._both(ctx, c); } else if (st === 5) this._magView(ctx, c);
    else this._clues(ctx, c);
    drawVignette(ctx, c, 0.4);
  }

  _tube(ctx, c, b, u, paint) {
    const t = drawSampleTube(ctx, c, {
      x: b.x, y: b.y, w: b.w, h: b.h, fill: FILL, capH: 28, surface: u > 0.5 ? BLOOD_TONES.plasma : BLOOD_TONES.mixed,
      paint: paint ?? paintBlood(u, 0.08 * (1 - u)), shadow: false,
    });
    return t;
  }

  _rack(ctx, c, x, w) { drawRack(ctx, c, { x, y: BENCH_Y - 40, w, h: 40, holes: [] }); }

  _before(ctx, c) {
    this._tube(ctx, c, TUBE, 0);
    const w = { x: 462, y: 170, w: 58, h: 218 };
    drawSampleTube(ctx, c, { ...w, fill: FILL, capH: 22, surface: c.water, paint: (k, col) => { k.fillStyle = mix(c.water, c.glass, 0.4); k.fillRect(col.x, col.y, col.w, col.h); } });
    this._rack(ctx, c, 240, 340);
    const tag = { bg: c.raised, ink: c.label, size: fs(17), display: true };
    pill(ctx, c, 'blood', TUBE.x + TUBE.w / 2, fs(36), tag);
    pill(ctx, c, 'water, to balance', 520, 134, tag);
    pill(ctx, c, this._guess ? `your guess: ${this._guess}` : 'how many layers?', 340, 484, { bg: this._guess ? c.good : c.accent, size: fs(18), display: true });
  }

  _machine(ctx, c, mud = false) {
    drawCentrifuge(ctx, c, {
      cx: MCX, base: BENCH_Y, ...MACHINE, lid: this._lid, swing: this._swing, spin: this._phase, omega: this._rot / 100, rpm: null,
      tube: (k, i, box) => {
        if (i === 0) drawSampleTube(k, c, { ...box, fill: FILL, surface: BLOOD_TONES.plasma, paint: paintBlood(this._u, 0.08 * (1 - this._u)) });
        else if (mud) drawSampleTube(k, c, { ...box, fill: FILL, surface: c.water, paint: paintMud(c, this._u, 0.06) });
        else drawSampleTube(k, c, { ...box, fill: FILL, surface: c.water, paint: (q, col) => { q.fillStyle = mix(c.water, c.glass, 0.4); q.fillRect(col.x, col.y, col.w, col.h); } });
      },
    });
    if (this._run && this._u === 0) pill(ctx, c, 'spinning', 340, 484, { bg: c.raised, ink: c.label, size: fs(17), display: true });
  }

  /** y of a share down the column of the tube box. */
  _y(t, f) { return t.col.y + t.col.h * f; }

  _after(ctx, c) {
    const t = this._tube(ctx, c, TUBE, this._u);
    this._rack(ctx, c, 240, 204);
    if (this._u < 1) { pill(ctx, c, 'press spin', 340, 484, { bg: c.accent, size: fs(17), display: true }); return; }
    const ink = alpha(c.labelMuted, 0.9), x = TUBE.x + TUBE.w + 6;
    const rows = [['plasma', 0.27, 180], ['platelets, white cells', BANDS.plasma + 0.015, 284], ['red blood cells', 0.78, 366]];
    for (const [name, f, y] of rows) {
      leader(ctx, x + 34, y, x - 8, this._y(t, f), ink, 1, 0);
      pill(ctx, c, name, x + 38, y, { bg: c.raised, ink: c.label, size: fs(PHONE ? 19 : 17), display: true, align: 'left' });
    }
    pill(ctx, c, 'three layers', 150, 228, { bg: c.good, size: fs(20), display: true });
  }

  _lensView(ctx, c) {
    const b = { ...TUBE, x: 118, w: 92 };
    const t = this._tube(ctx, c, b, 1);
    this._rack(ctx, c, 60, 208);
    const f = this._lens / 100, y = this._y(t, f);
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4;
    rr(ctx, b.x - 7, y - 12, b.w + 14, 24, 8); ctx.stroke();
    leader(ctx, b.x + b.w + 8, y, LENS.x - LENS.r, LENS.y, alpha(c.accent, 0.8), 1, 0);
    const band = this._band();
    this._cellsIn(ctx, c, band, 1);
    pill(ctx, c, band === 'plasma' ? 'plasma' : band === 'coat' ? 'platelets, white cells' : 'red blood cells', LENS.x, LENS.y + LENS.r + 24, { bg: c.raised, ink: c.label, size: fs(18), display: true });
    if (this._lens === 0) pill(ctx, c, 'move the lens down', 340, 484, { bg: c.accent, size: fs(17), display: true });
  }

  /** The lens window: cells drawn as cells. k 0..1 is how clearly the cells show. */
  _cellsIn(ctx, c, band, k) {
    const { x, y, r } = LENS;
    ctx.save();
    lensPath(ctx, x, y, r);
    ctx.clip();
    ctx.fillStyle = band === 'cells' || band === 'mixed' ? mix(BLOOD_TONES.plasma, BLOOD_TONES.mixed, band === 'mixed' ? 1 - k : 0.2) : BLOOD_TONES.plasma;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const red = (px, py, rad, a) => {
      ctx.fillStyle = BLOOD_TONES.cells;
      ctx.beginPath(); ctx.ellipse(px, py, rad, rad * 0.86, a, 0, TAU); ctx.fill();
      ctx.fillStyle = alpha(lighten(BLOOD_TONES.cells, 0.25), 0.8);
      ctx.beginPath(); ctx.ellipse(px, py, rad * 0.5, rad * 0.42, a, 0, TAU); ctx.fill();
    };
    if (band === 'cells') CELLS.forEach((s) => red(x + s.x * r, y + s.y * r, 19, s.a));
    if (band === 'mixed') {
      ctx.globalAlpha = k;
      CELLS.slice(0, 30).forEach((s) => red(x + s.x * r, y + s.y * r, 17, s.a));
      ctx.globalAlpha = 1;
    }
    if (band === 'coat') {
      CELLS.slice(0, 7).forEach((s) => {
        const px = x + s.x * r * 0.8, py = y + s.y * r * 0.8;
        ctx.fillStyle = lighten(c.glass, 0.8);
        ctx.beginPath(); ctx.arc(px, py, 30, 0, TAU); ctx.fill();
        ctx.strokeStyle = c.s5; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = c.s5;
        ctx.beginPath(); ctx.ellipse(px - 4, py + 2, 15, 10, s.a, 0, TAU); ctx.fill();
      });
      CELLS.slice(20, 44).forEach((s) => {
        ctx.fillStyle = c.s4;
        ctx.beginPath(); ctx.ellipse(x + s.x * r, y + s.y * r, 6, 4, s.a, 0, TAU); ctx.fill();
      });
    }
    ctx.restore();
    drawLens(ctx, c, { cx: x, cy: y, r, handle: 'none' });
  }

  _bank(ctx, c) {
    const t = this._tube(ctx, c, { x: 40, y: 92, w: 84, h: 296 }, 1);
    void t;
    this._rack(ctx, c, 12, 142);
    const p = this._bag;
    BAGS.forEach((b, i) => {
      const w = 96, h = 196, x = 174 + i * 118, y = 84;
      ctx.strokeStyle = darken(c.stroke, 0.1); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y - 26); ctx.lineTo(x + w / 2, y + 6); ctx.stroke();
      rr(ctx, x, y, w, h, 20);
      ctx.fillStyle = alpha(c.glass, 0.26); ctx.fill();
      ctx.save(); rr(ctx, x, y, w, h, 20); ctx.clip();
      const lv = b.lv * clamp01(p * 1.2 - i * 0.05);
      ctx.fillStyle = b.tone(c);
      ctx.fillRect(x, y + h * (1 - lv), w, h * lv + 2);
      ctx.fillStyle = alpha(lighten(c.glass, 0.7), 0.4);
      ctx.fillRect(x + 12, y + 12, 8, h - 40);
      ctx.restore();
      rr(ctx, x, y, w, h, 20);
      ctx.strokeStyle = darken(c.glass, 0.25); ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = c.label; ctx.font = font(c, 700, PHONE ? 19 : 16, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      pill(ctx, c, b.name, x + w / 2, y + h + 28, { bg: c.raised, ink: c.label, size: PHONE ? 19 : 15, display: true });
    });
    if (p >= 1) pill(ctx, c, 'replaced in a few weeks', 340, 484, { bg: c.good, size: fs(18), display: true });
  }

  _both(ctx, c) {
    const u = this._u;
    this._tube(ctx, c, LEFT, u);
    const R = { ...TUBE, x: 444 };
    drawSampleTube(ctx, c, { x: R.x, y: R.y, w: R.w, h: R.h, fill: FILL, capH: 28, surface: c.water, paint: paintMud(c, u, 0.06) });
    this._rack(ctx, c, 100, 480);
    const tag = { bg: c.raised, ink: c.label, size: fs(18), display: true };
    pill(ctx, c, 'blood', LEFT.x + LEFT.w / 2, fs(36), tag);
    pill(ctx, c, 'muddy water', R.x + R.w / 2, fs(36), tag);
    if (u >= 1) pill(ctx, c, 'both come apart', 340, 484, { bg: c.warning, size: fs(19), display: true });
  }

  _magView(ctx, c) {
    const b = { ...TUBE, x: 118, w: 92 };
    this._tube(ctx, c, b, 0);
    this._rack(ctx, c, 60, 208);
    const k = clamp01((this._mag - 20) / 80);
    this._cellsIn(ctx, c, 'mixed', k);
    const on = this._mag >= 100;
    pill(ctx, c, on ? 'cells seen' : 'no cells seen', LENS.x, LENS.y + LENS.r + 24, { bg: on ? c.good : c.raised, ink: on ? undefined : c.label, size: fs(19), display: true });
    pill(ctx, c, `${this._mag} x`, LENS.x, fs(36), { bg: c.raised, ink: c.label, size: fs(22), display: true });
    if (this._mag === 1) pill(ctx, c, 'your eye', 164, 484, { bg: c.raised, ink: c.label, size: fs(17), display: true });
  }

  _clues(ctx, c) {
    const card = (x, title, a, b) => {
      const w = 226, h = 256, y = 72;
      drawCard(ctx, c, x, y, w, h, 1, {});
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(21), true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(title, x + w / 2, y + 34);
      const row = (yy, kind, text) => {
        drawBadge(ctx, c, kind === 'yes' ? 'check' : 'cross', x + 28, yy, 15);
        ctx.fillStyle = c.label; ctx.font = font(c, 700, PHONE ? 20 : 16); ctx.textAlign = 'left';
        const lines = text.split('|');
        lines.forEach((l, i) => ctx.fillText(l, x + 52, yy + (i - (lines.length - 1) / 2) * (PHONE ? 24 : 20)));
      };
      row(y + 104, a[0], a[1]);
      row(y + 186, b[0], b[1]);
    };
    card(14, 'Suspension?', ['yes', 'comes apart|when spun'], ['no', 'cells not seen|by eye']);
    card(440, 'Solution?', ['yes', 'evenly mixed|as it flows'], ['no', 'a solution will|not spin apart']);
    this._tube(ctx, c, { x: 296, y: 92, w: 88, h: 296 }, 0);
    this._rack(ctx, c, 262, 156);
    chipRow(ctx, c, [{ text: 'so what is it?', bg: c.warning }], 340, 484, { align: 'center', size: fs(20), display: true });
  }
}
