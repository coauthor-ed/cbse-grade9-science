// ChromatographyScene - Fig. 5.15 as one working jar, on a lab bench.
// A gas jar with a watch glass on it, a white paper strip hanging into a thin layer of water, a pencil line
// 2 cm up, a black spot on the line. The learner sets the water level and runs it.
//   setup mount (predict, no beats): the jar has no water in it yet, only a question at the bottom: the answer stays hidden
//   b0  the four parts, named
//   b1  raise the water past the spot: the ink dissolves into the jar and the strip stays bare
//   b2  below the spot, Run: the water climbs, the spot opens into three colours (yellow, pink, blue)
//   b3  the finished strip and a lens on the paper: every colour is moving with the water, nothing is held back
// Above the spot the ink goes straight away: that is what water does to it, so no Run is needed to see it.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, darken, drawBackdrop, drawBench, drawCard, font, leader, lighten, mix, mulberry32, outBack, pill } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { DYES, colourSpot, gasJarBack, gasJarFront, inkTone, paperStrip } from './StripKit.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const PX = 21;                                  // px per cm, one scale for strip, line and level
const BENCH_Y = 442;
const JAR = { x: 112, y: 62, w: 250, h: BENCH_Y - 62 + 2 };
const CX = JAR.x + JAR.w / 2;
const FLOOR = JAR.y + JAR.h - 7;                // the inside floor of the jar
const STRIP = { w: 3 * PX, top: 92, bottom: FLOOR - 4 };
const SB = { x: CX - STRIP.w / 2, y: STRIP.top, w: STRIP.w, h: STRIP.bottom - STRIP.top };
const LINE_Y = STRIP.bottom - 2 * PX;
const TOP_CM = 14.2;                            // the water stops this far above the strip's foot
const RISE = 1.35;                              // cm per second in the scene; a real strip takes many minutes
const LEVEL_DEF = 1, LEVEL_MIN = 0.5, LEVEL_MAX = 3.5, SPOT_CM = 2;
const S_PARTS = 0, S_ABOVE = 1, S_RUN = 2, S_LENS = 3;
const MAP = [[{ idx: S_PARTS, dwellMs: null }], [{ idx: S_ABOVE, dwellMs: null }], [{ idx: S_RUN, dwellMs: null }], [{ idx: S_LENS, dwellMs: null }]];
const LENS = { x: 522, y: 222, r: 128 };
const FOCUS = { x: CX + STRIP.w / 2 - 6, y: 0 };

export class ChromatographyScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A gas jar holding a paper strip with a pencil line and an ink spot. Set the water level below the spot and press Run: the water climbs and the ink opens into yellow, pink and blue. Above the spot, the ink dissolves into the jar.';
  static CONTROLS = [
    { type: 'slider', id: 'level', label: 'Water level', min: LEVEL_MIN, max: LEVEL_MAX, step: 0.1, value: LEVEL_DEF, suffix: ' cm' },
    { type: 'button', id: 'run', label: 'Run' },
    { type: 'button', id: 'look', label: 'Look closely at the paper' },
    { type: 'button', id: 'fresh', label: 'Fresh strip' },
  ];

  constructor(container, config) {
    super(container, config);
    this._state(LEVEL_DEF);
    this._lens = 0;
    const r = mulberry32(21);
    this._bits = Array.from({ length: 60 }, (_, i) => ({ d: i % 3, x: r() * 2 - 1, y: r() * 2 - 1, ph: r() * 6 }));
    this._fibres = Array.from({ length: 12 }, () => ({ x: r() * 2 - 1, b: r() * 2 - 1, w: 3 + r() * 3 }));
  }

  _state(level) {
    this._level = level;
    this._front = 0;          // cm above the water surface that the wet edge has climbed
    this._going = false;
    this._loss = 0;           // 0..1: how much ink has gone into the jar
    this._lost = false;
    this._flow = 0;           // seconds of movement left in the lens
    this._lens = 0;
    this._t = 0;
  }

  enter(stage) {
    this._state(LEVEL_DEF);
    if (stage === S_LENS && !this._empty) this._front = TOP_CM - LEVEL_DEF;
  }

  // The predict mount: never run by a 4-beat lesson slide. A question host sends beat MAX_SAFE_INTEGER, not 0.
  get _empty() { return this.beatCount !== 4; }
  get _above() { return this._level >= SPOT_CM; }
  get _surface() { return STRIP.bottom - this._level * PX; }
  get _frontY() { return this._surface - this._front * PX; }
  get _climb() { return Math.max(0, (STRIP.bottom - this._frontY) - 2 * PX); }   // px the water has passed the line

  _go() {
    if (this._going || this._front > 0 || this._lost || this._above) return;
    if (reducedMotion()) { this._front = TOP_CM - this._level; return; }
    this._going = true;
  }

  update(d) {
    if (this._flow > 0) this._t += d;
    if (this._going) {
      this._front = Math.min(TOP_CM - this._level, this._front + d * RISE);
      if (this._front >= TOP_CM - this._level) this._going = false;
    }
    if (this._above && !this._empty && this._loss < 1) {
      this._loss = reducedMotion() ? 1 : Math.min(1, this._loss + d / 2.6);
      if (this._loss >= 1) this._lost = true;
    }
    if (this._lens > 0) this._lens = Math.min(1, this._lens + d);
    if (this._flow > 0) this._flow = Math.max(0, this._flow - d);
  }

  busy() {
    return this._going || (this._above && !this._empty && this._loss < 1) || this._flow > 0 || (this._lens > 0 && this._lens < 0.5);
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 110 });
    const water = this._empty ? null : this._surface;
    const fill = mix(c.water, mix(c.s5, c.s4, 0.5), 0.5 * this._loss);
    const g = gasJarBack(ctx, c, JAR, { surface: water, fill, opacity: 0.5 + 0.12 * this._loss });
    this._hanger(ctx, c);
    const frontY = this._empty ? null : (this._front > 0 || this._loss > 0 ? Math.min(this._frontY, this._surface) : this._surface);
    paperStrip(ctx, c, SB, { lineY: LINE_Y, frontY });
    this._ink(ctx, c);
    if (water != null && this._above) this._wisps(ctx, c);
    if (water != null) {
      // the water in front of the strip's foot
      ctx.fillStyle = alpha(fill, 0.22);
      ctx.fillRect(SB.x, water, SB.w, STRIP.bottom - water);
    }
    gasJarFront(ctx, c, g);
    if (this._empty) this._question(ctx, c);
    else if (this.stage === S_PARTS) this._parts(ctx, c);
    else if (this.stage === S_LENS) this._lensView(ctx, c);
    else this._reading(ctx, c);
  }

  _hanger(ctx, c) {
    // a glass rod across the jar, just under the watch glass; the strip folds over it
    ctx.strokeStyle = darken(c.glass, 0.25); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(JAR.x + 26, STRIP.top - 2); ctx.lineTo(JAR.x + JAR.w - 26, STRIP.top - 2); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.5), 0.8); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(JAR.x + 26, STRIP.top - 3.5); ctx.lineTo(JAR.x + JAR.w - 26, STRIP.top - 3.5); ctx.stroke();
  }

  _ink(ctx, c) {
    const climb = this._climb, open = clamp01(climb / 40);
    if (open <= 0 || this._lost) {
      const a = 1 - this._loss;
      const wet = this._frontY <= LINE_Y + 3 ? 1.2 : 1;
      colourSpot(ctx, CX, LINE_Y, 11 * wet, 11 * wet, inkTone(c), a);
      return;
    }
    // the black opens as the three dyes part
    colourSpot(ctx, CX, LINE_Y - climb * 0.26, 12, 12, inkTone(c), 1 - clamp01(climb / 26));
    for (const dye of DYES) {
      colourSpot(ctx, CX, LINE_Y - climb * dye.rf, 19, 13, darken(c[dye.key], 0.04), open);
    }
  }

  _wisps(ctx, c) {
    const u = this._loss;
    if (u <= 0 || u >= 1) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineWidth = 3.5;
    DYES.forEach((d, i) => {
      ctx.strokeStyle = alpha(c[d.key], 0.7 * (1 - u));
      const dx = (i - 1) * 26 * u;
      ctx.beginPath();
      ctx.moveTo(CX, LINE_Y);
      ctx.bezierCurveTo(CX + dx * 0.4, LINE_Y + 8, CX + dx * 1.3, LINE_Y - 2 + 8 * u, CX + dx * 1.7, Math.min(FLOOR - 8, LINE_Y + 26 * u));
      ctx.stroke();
    });
    ctx.restore();
  }

  _question(ctx, c) {
    const y = STRIP.bottom - 1.4 * PX;
    pill(ctx, c, 'water level?', JAR.x + JAR.w + 94, y, { bg: c.accent, size: fs(22), display: true });
    leader(ctx, JAR.x + JAR.w + 16, y, CX + STRIP.w / 2 + 8, y, c.accent, 0.9);
    this._tag(ctx, c, 'ink spot', 150, LINE_Y - 80, CX - 7, LINE_Y, false);
  }

  _tag(ctx, c, text, x, y, tx, ty, right = true) {
    const o = { bg: c.raised, size: fs(20), display: true };
    if (right) { pill(ctx, c, text, x, y, { ...o, align: 'left' }); leader(ctx, x - 2, y, tx, ty, darken(c.glass, 0.25), 0.95); }
    else { pill(ctx, c, text, x, y, o); leader(ctx, x, y + 18, tx, ty, darken(c.glass, 0.25), 0.95); }
  }

  _parts(ctx, c) {
    const x = 410;
    this._tag(ctx, c, 'paper strip', x, 170, CX + STRIP.w / 2 - 2, 190);
    this._tag(ctx, c, 'pencil line', x, 262, CX + STRIP.w / 2 - 3, LINE_Y);
    this._tag(ctx, c, 'ink spot', x, 334, CX + 8, LINE_Y);
    this._tag(ctx, c, 'water', x, 404, CX + STRIP.w / 2 + 34, this._surface + 9);
    pill(ctx, c, 'watch glass', x + 8, 66, { bg: c.raised, size: fs(18), display: true, align: 'left' });
    leader(ctx, x + 6, 66, JAR.x + JAR.w + 4, 64, darken(c.glass, 0.25), 0.95);
  }

  _reading(ctx, c) {
    const x = 420, w = 240, y = 84;
    drawCard(ctx, c, x, y, w, 150, 1, { accent: c.accent });
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = font(c, 700, fs(18)); ctx.fillStyle = c.labelMuted;
    ctx.fillText('water', x + 18, y + 40);
    ctx.fillText('spot', x + 18, y + 100);
    ctx.font = font(c, 700, 38, true); ctx.fillStyle = this._above ? c.bad : c.label;
    ctx.textAlign = 'right';
    ctx.fillText(`${this._level.toFixed(1)} cm`, x + w - 18, y + 54);
    ctx.fillStyle = c.label;
    ctx.fillText(`${SPOT_CM.toFixed(1)} cm`, x + w - 18, y + 114);
    ctx.textAlign = 'left';
    const msg = this._verdict();
    if (msg) pill(ctx, c, msg.t, x + w / 2, 276, { bg: msg.bg, size: fs(21), display: true });
    const hint = this._hint();
    if (hint) pill(ctx, c, hint, x + w / 2, 390, { bg: c.accent, size: fs(19), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
  }

  _verdict() {
    const c = this.colors;
    if (this._lost) return { t: 'the ink is in the water', bg: c.bad };
    if (this._above && this._loss > 0) return { t: 'the ink is dissolving', bg: c.warning };
    if (this._front > 0 && !this._going && this._climb > 20) return { t: 'three colours', bg: c.good };
    if (this._going) return { t: 'the water is climbing', bg: c.accent };
    return { t: 'the spot is dry', bg: c.raised };
  }

  _hint() {
    if (this.stage === S_ABOVE && !this._above && !this._lost) return 'raise the water';
    if (this.stage === S_ABOVE && this._lost) return 'try a fresh strip';
    if (this.stage === S_RUN && !this._going && this._front === 0 && !this._above && !this._lost) return 'press Run';
    if (this.stage === S_RUN && this._lost) return 'try a fresh strip';
    return '';
  }

  _lensView(ctx, c) {
    const L = LENS;
    const fy = LINE_Y - this._climb * 0.52;
    const opened = this._lens > 0;
    leader(ctx, L.x - L.r, L.y, CX + STRIP.w / 2 - 6, fy, darken(c.glass, 0.25), 0.9);
    if (!opened) {
      pill(ctx, c, 'look closely', L.x, L.y, { bg: c.accent, size: fs(21), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
      return;
    }
    const s = reducedMotion() ? 1 : outBack(Math.min(1, this._lens / 0.4));
    ctx.save();
    ctx.translate(L.x, L.y); ctx.scale(s, s);
    ctx.beginPath(); ctx.arc(0, 0, L.r, 0, TAU); ctx.save(); ctx.clip();
    ctx.fillStyle = lighten(c.glass, 0.45);
    ctx.fillRect(-L.r, -L.r, L.r * 2, L.r * 2);
    ctx.fillStyle = alpha(c.water, 0.35);
    ctx.fillRect(-L.r, -L.r, L.r * 2, L.r * 2);
    // paper fibres: wide pale ribbons with the water between them
    ctx.lineCap = 'round';
    for (const f of this._fibres) {
      ctx.strokeStyle = alpha(mix(c.glass, c.bgDeep, 0.15), 0.55); ctx.lineWidth = f.w * 2.4;
      ctx.beginPath(); ctx.moveTo(f.x * L.r, -L.r); ctx.bezierCurveTo((f.x + f.b * 0.5) * L.r, -L.r * 0.3, (f.x - f.b * 0.4) * L.r, L.r * 0.3, f.x * 0.8 * L.r, L.r); ctx.stroke();
    }
    // the same three colours as on the strip, each a cloud of dissolved dye, each drifting up with the water at its own pace
    const t = this._t;
    for (const b of this._bits) {
      const yc = [-78, 0, 78][b.d];
      const pace = DYES[b.d].rf * 26;
      const y = yc + (((b.y * 34 - t * pace) % 68 + 68) % 68) - 34;
      ctx.fillStyle = darken(c[DYES[b.d].key], 0.12);
      ctx.beginPath(); ctx.arc(b.x * L.r * 0.62 + Math.sin(t + b.ph) * 3, y, 5, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 9; ctx.strokeStyle = darken(c.gold, 0.2);
    ctx.beginPath(); ctx.arc(0, 0, L.r, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = alpha(lighten(c.gold, 0.5), 0.85);
    ctx.beginPath(); ctx.arc(-1, -2, L.r - 3, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    ctx.restore();
    if (this._lens > 0.3) pill(ctx, c, 'all three keep moving', L.x, L.y + L.r + 32, { bg: c.good, size: fs(21), display: true });
  }

  pointerDown(p) {
    if (this._empty) return;
    if (this.stage === S_RUN && Math.abs(p.x - CX) < 90 && p.y > 80 && p.y < BENCH_Y) this._go();
    if (this.stage === S_LENS && Math.hypot(p.x - LENS.x, p.y - LENS.y) < LENS.r) this._look();
  }

  _look() {
    if (this._lens > 0) { this._flow = 4; return; }
    this._lens = 0.01;
    this._flow = reducedMotion() ? 0 : 5;
    this.celebrate(LENS.x, LENS.y, 20, { key: 'all-move', lookAt: true });
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'level') { this._level = Number(v); }
    else if (id === 'run') this._go();
    else if (id === 'look') this._look();
    else if (id === 'fresh') this._state(LEVEL_DEF);
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    if (this._empty) return true;
    if (id === 'level') return this.stage !== S_ABOVE && this.stage !== S_RUN;
    if (id === 'run') return this.stage !== S_RUN;
    if (id === 'look') return this.stage !== S_LENS;
    if (id === 'fresh') return this.stage !== S_ABOVE && this.stage !== S_RUN;
    return false;
  }

  isControlDisabled(id) {
    if (id === 'level') return this._going || this._front > 0 || this._lost || this._loss > 0;
    if (id === 'run') return this._going || this._front > 0 || this._lost || this._above;
    if (id === 'look') return this._lens > 0;
    return false;
  }

  getControlValue(id) { return id === 'level' ? this._level : super.getControlValue(id); }
}
