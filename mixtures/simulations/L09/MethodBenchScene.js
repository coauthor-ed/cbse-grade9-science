// MethodBenchScene - blk-l09-s01 (predict, a silent bench) and blk-l09-s02 (4 beats).
// A big glass of lemonade with five parts: water, sugar, citric acid, colour, pulp. Five empty jars on the
// shelf above it, one per part. A jar fills only when a method really gives that part on its own.
//   predict  the glass and five empty jars. Nothing can run.
//   stage 0  each button runs one method on a full glass. Filter: pulp only. Distil: water only, syrup stays.
//            Evaporate: nothing, the water is lost, syrup stays. One run gives one part at most.
//   stage 1  filter, then distil the clear liquid: two jars and a syrup that holds the other three.
//   stage 2  tap each of the seven differences. Two reach this glass, the rest do nothing. All seven is the find.
//   stage 3  clear sugar water. Four tools: filter (still sweet), funnel (no layers), magnet (nothing), still (works).
// Science: sugar, acid and colour stay behind together when the water leaves. The scene never says they cannot
// be separated at all, only that one method uses one difference. Colours only from c. Each run ends by itself.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  COLOR_TOKEN_MAP, alpha, mix, lighten, darken, font, pill, rr, clamp01, lerp, mulberry32, outBack, wrapLines,
  drawBackdrop, drawBench, drawCard,
} from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, glassPath, drawGlass, drawGlassFront, drawGlassLiquid, drawGlassPipe, drawGlassPipeFront } from 'simulations/base/kit/SimGlass.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const BENCH_Y = 446;
const JARS = [
  { id: 'pulp', label: 'pulp', x: 72 },
  { id: 'water', label: 'water', x: 206 },
  { id: 'sugar', label: 'sugar', x: 340 },
  { id: 'acid', label: 'acid', x: 474 },
  { id: 'colour', label: 'colour', x: 608 },
];
const S_RUNS = 0, S_TWO = 1, S_DIFF = 2, S_TOOLS = 3;
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);

const RUNS = {
  filter: { secs: 3, lines: ['Pulp stays on the paper', 'The other four come through'] },
  distil: { secs: 4, lines: ['Water in the flask', 'Syrup left, with the pulp in it'] },
  evap: { secs: 3.5, lines: ['Syrup left, with the pulp in it', 'The water is lost to the air'] },
};
const DIFFS = [
  { value: 'size', label: 'Size', method: 'filtration', say: 'Takes out the pulp', jar: 'pulp' },
  { value: 'density', label: 'Density', method: 'separating funnel', say: 'No layers to draw off' },
  { value: 'solub', label: 'Solubility', method: 'dissolving one part', say: 'Sugar, acid and colour all dissolve' },
  { value: 'bp', label: 'Boiling point', method: 'distillation', say: 'Takes out the water', jar: 'water' },
  { value: 'paper', label: 'Paper', method: 'chromatography', say: 'Shows the colours, in tiny amounts' },
  { value: 'mag', label: 'Magnetism', method: 'a magnet', say: 'Nothing here is magnetic' },
  { value: 'sub', label: 'Sublimes', method: 'sublimation', say: 'Nothing here sublimes' },
];
const TOOLS = {
  filter: { label: 'Filter', big: 'Still sweet', small: 'Dissolved sugar goes through' },
  funnel: { label: 'Separating funnel', big: 'One layer', small: 'Nothing to draw off' },
  magnet: { label: 'Magnet', big: 'Nothing lifted', small: 'Sugar is not magnetic' },
  still: { label: 'Distil', big: 'Water back', small: 'Sugar stays in the flask' },
};

export class MethodBenchScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static IRIS = false;
  static COLOR_MAP = { ...COLOR_TOKEN_MAP, ice: ['--sim-ice', '#cfeaff'] };
  static BEAT_MAPS = { 4: MAP };
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A big glass of lemonade with five empty jars above it: pulp, water, sugar, acid and colour. Filtering fills only the pulp jar. '
    + 'Distilling fills only the water jar and leaves a syrup. Evaporating fills no jar. Filtering and then distilling fills two jars, and sugar, acid and colour stay together in a syrup. '
    + 'Then each of seven differences is tried on the glass, and four tools are tried on clear sugar water.';
  static CONTROLS = [
    { type: 'button', id: 'filter', label: 'Filter it' },
    { type: 'button', id: 'distil', label: 'Distil it' },
    { type: 'button', id: 'evap', label: 'Evaporate it' },
    { type: 'button', id: 'both', label: 'Filter, then distil' },
    { type: 'segmented', id: 'diff', label: 'Difference', value: '', options: DIFFS.map((d) => ({ value: d.value, label: d.label })) },
    { type: 'segmented', id: 'tool', label: 'Try on sugar water', value: '', options: Object.entries(TOOLS).map(([value, t]) => ({ value, label: t.label })) },
  ];

  constructor(container, config) {
    super(container, config);
    const r = mulberry32(11);
    this._bits = Array.from({ length: 16 }, () => ({ x: r() * 2 - 1, y: r(), w: 9 + r() * 7, h: 4 + r() * 3, a: (r() - 0.5) * 1.6 }));
    this._cold();
  }

  _cold() {
    this._run = null;
    this._last = null;       // the finished run or tool, for the reading
    this._got = {};          // jars in hand
    this._level = 1;         // the share of the liquid left in the glass
    this._pulpIn = true;
    this._filtered = false;
    this._syrup = 0;
    this._rx = 0;            // the receiver's level
    this._back = 0;          // 0..1: what is left goes back into the glass
    this._target = 1;        // the level the glass ends at
    this._lost = false;
    this._pop = 1;
    this._diff = '';
    this._seen = new Set();
    this._found = false;
    this._tool = '';
  }

  /** The predict mount has no beat count. */
  get _setup() { return this.beatCount !== 4; }

  enter() { this._cold(); }

  isControlHidden(id) {
    if (this._setup) return true;
    const s = this.stage;
    if (id === 'filter' || id === 'distil' || id === 'evap') return s !== S_RUNS;
    if (id === 'both') return s !== S_TWO;
    if (id === 'diff') return s !== S_DIFF;
    return s !== S_TOOLS;
  }

  isControlDisabled(id) { return !!this._run && id !== 'diff'; }

  getControlValue(id) {
    if (id === 'diff') return this._diff;
    if (id === 'tool') return this._tool;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'diff') {
      this._diff = String(v);
      this._seen.add(this._diff);
      this._pop = 0;
      if (!this._found && this._seen.size === DIFFS.length) {
        this._found = true;
        this.celebrate(170, 290, 18, { key: 'seven-differences', small: true });
      }
    } else if (id === 'tool') {
      this._cold();
      this._tool = String(v);
      this._launch(this._tool, 2.2);
    } else {
      this._cold();
      this._launch(id, RUNS[id === 'both' ? 'filter' : id].secs);
    }
    this.animateFor(900);
    this.requestUiUpdate?.();
  }

  _launch(kind, secs) {
    this._run = { kind, t: 0, secs, part: kind === 'both' ? 'filter' : kind };
  }

  update(d) {
    if (this._pop < 1) this._pop += d;
    if (this._back > 0 && this._back < 1) {
      this._back = Math.min(1, this._back + d / 0.7);
      this._level = this._target * this._back;
    }
    const r = this._run;
    if (!r) return;
    r.t += d;
    const p = clamp01(r.t / r.secs);
    r.p = p;
    const kind = r.part;
    if (kind === 'filter') {
      this._level = 1 - p;
      this._rx = p;
      if (p >= 1) { this._pulpIn = false; this._got.pulp = 1; this._filtered = true; }
    } else if (kind === 'distil') {
      this._level = r.kind === 'both' ? 0 : clamp01(1 - p * 3);
      this._rx = p;
      this._syrup = p;
      if (p >= 1) this._got.water = 1;
    } else if (kind === 'evap') {
      this._level = clamp01(1 - p * 3);
      this._syrup = p;
      if (p >= 1) this._lost = true;
    }
    if (p >= 1) {
      if (r.kind === 'both' && r.part === 'filter') {
        this._run = { kind: 'both', t: 0, secs: RUNS.distil.secs, part: 'distil', p: 0 };
        this._rx = 0; this._syrup = 0;
        return;
      }
      this._last = r.kind;
      this._run = null;
      this._pop = 0;
      this._back = 0.001;
      this._target = r.part === 'filter' ? 1 : 0.22;
      this.requestUiUpdate?.();
    }
  }

  busy() { return !!this._run || this._pop < 0.6 || (this._back > 0 && this._back < 1); }

  _spr() { return reducedMotion() ? 1 : outBack(clamp01(this._pop / 0.4)); }

  /* ------------------------------------------------------------------ paint */

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 90 });
    this._shelf(ctx, c);
    if (this._setup) { this._glass(ctx, c, 340, 262, 0.86); return; }
    const kind = this._run?.part ?? this._lastKind();
    if (this.stage === S_DIFF) {
      // On a phone the seven chips leave a small scene, so the card takes the room and the glass stays as a reminder.
      if (PHONE) this._glass(ctx, c, 88, 136, 0.86);
      else this._glass(ctx, c, 170, 236, 0.86);
      this._diffCard(ctx, c);
      return;
    }
    if (this.stage === S_TOOLS) {
      this._glass(ctx, c, 170, 236, 0.86, true);
      this._tools(ctx, c);
      return;
    }
    this._glass(ctx, c, 170, 236, 0.86);
    this._reading(ctx, c);
    if (kind === 'filter') this._funnel(ctx, c, this._progress('filter'));
    else if (kind === 'distil') this._still(ctx, c, this._progress('distil'), this._pulpIn);
    else if (kind === 'evap') this._dish(ctx, c, this._progress('evap'));
    else this._hint(ctx, c);
  }

  _lastKind() {
    if (!this._last) return null;
    return this._last === 'both' ? 'distil' : this._last;
  }

  _progress(kind) {
    return this._run?.part === kind ? (this._run.p ?? 0) : 1;
  }

  _partTone(c, id) {
    if (id === 'water') return c.water;
    if (id === 'sugar') return c.ice;
    if (id === 'acid') return mix(c.s3, c.water, 0.45);
    if (id === 'colour') return c.gold;
    return mix(c.gold, c.s8, 0.55);
  }

  _shelf(ctx, c) {
    ctx.fillStyle = darken(c.gold, 0.38);
    rr(ctx, 14, 78, 652, 10, 5); ctx.fill();
    ctx.fillStyle = darken(c.gold, 0.2);
    rr(ctx, 14, 76, 652, 6, 3); ctx.fill();
    const lit = DIFFS.find((d) => d.value === this._diff)?.jar;
    for (const j of JARS) {
      const g = glassBox('jar', j.x - 25, 16, 50, 60, { wall: 4 });
      const got = this._got[j.id] || lit === j.id;
      drawGlass(ctx, c, g, { shadow: false });
      if (got) drawGlassLiquid(ctx, c, g, { level: 0.74, fill: this._partTone(c, j.id), opacity: 0.95 });
      ctx.font = font(c, 800, PHONE && (this._setup || this.stage === S_DIFF) ? 32 : fs(20));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = got ? c.label : c.labelMuted;
      ctx.fillText(j.label, j.x, 106);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  _drink(c) {
    if (this.stage === S_TOOLS && !this._setup) return mix(c.water, c.bgSurface, 0.35);
    const thin = this._pulpIn ? mix(c.gold, c.ice, 0.35) : mix(c.gold, c.ice, 0.55);
    return this._syrup >= 1 ? mix(thin, c.s8, 0.6) : thin;
  }

  _glass(ctx, c, cx, w, fill, plain = false) {
    const top = 136;
    const g = glassBox('tumbler', cx - w / 2, top, w, BENCH_Y - top - 2, { wall: 7, taper: 0.14 });
    drawGlass(ctx, c, g);
    const lvl = fill * this._level;
    const sy = g.floor - g.inner.h * lvl;
    if (lvl > 0.01) {
      drawGlassLiquid(ctx, c, g, { level: lvl, fill: this._drink(c), opacity: this._syrup >= 1 ? 0.96 : this._pulpIn && !plain ? 0.82 : 0.6 });
      if (this._pulpIn && !plain) {
        ctx.save();
        glassPath(ctx, g, g.inner);
        ctx.clip();
        const tone = mix(c.gold, c.s8, 0.55);
        for (const b of this._bits) {
          const y = sy + 10 + b.y * (g.floor - sy - 18);
          ctx.save();
          ctx.translate(cx + b.x * (w * 0.32), y);
          ctx.rotate(b.a);
          ctx.fillStyle = tone;
          rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 2); ctx.fill();
          ctx.fillStyle = alpha(lighten(tone, 0.4), 0.8);
          rr(ctx, -b.w / 2 + 1, -b.h / 2, b.w - 3, 1.6, 1); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
    }
    drawGlassFront(ctx, c, g, { shade: 0.12 });
    if (plain) pill(ctx, c, 'sugar water', cx, BENCH_Y + 34, { bg: c.raised, size: fs(20), display: true });
    else if (!this._setup) pill(ctx, c, this._glassTag(), cx, BENCH_Y + 34, { bg: c.raised, size: fs(20), display: true });
  }

  _glassTag() {
    if (this._run && this._level <= 0) return 'poured out';
    if (!this._last || this._back < 1) return 'lemonade';
    return `still mixed: ${this._last === 'both' ? 3 : 4} parts`;
  }

  _reading(ctx, c) {
    const lines = this._last ? (this._last === 'both' ? ['Two jars filled', 'Sugar, acid, colour stuck in syrup'] : RUNS[this._last].lines) : null;
    if (!lines) return;
    const s = this._spr();
    ctx.save();
    ctx.globalAlpha *= clamp01(s);
    drawCard(ctx, c, 310, 132, 356, 84, 1, { accent: this._got.pulp && this._got.water ? c.good : c.accent });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label;
    ctx.font = font(c, 700, fs(PHONE ? 22 : 24), true);
    ctx.fillText(lines[0], 488, 158, 340);
    ctx.fillStyle = c.labelMuted;
    ctx.font = font(c, 700, fs(19));
    ctx.fillText(lines[1], 488, 192, 340);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  _hint(ctx, c) {
    const t = this.stage === S_TWO ? 'Run them one after the other' : 'Pick a method';
    pill(ctx, c, t, 488, 300, { bg: c.accent, size: fs(22), display: true });
  }

  _burner(ctx, c, x, y, on) {
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.25);
    rr(ctx, x - 26, y - 14, 52, 14, 5); ctx.fill();
    ctx.fillStyle = lighten(mix(c.stroke, c.bgDeep, 0.25), 0.2);
    rr(ctx, x - 7, y - 30, 14, 18, 3); ctx.fill();
    if (on) {
      const h = reducedMotion() ? 30 : 30 + 5 * Math.sin(this.clock * 9);
      ctx.fillStyle = c.flame;
      ctx.beginPath(); ctx.moveTo(x - 11, y - 30); ctx.quadraticCurveTo(x, y - 30 - h * 1.5, x + 11, y - 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = lighten(c.flame, 0.5);
      ctx.beginPath(); ctx.moveTo(x - 5, y - 30); ctx.quadraticCurveTo(x, y - 30 - h * 0.8, x + 5, y - 30); ctx.closePath(); ctx.fill();
    }
  }

  _funnel(ctx, c, p, opts = {}) {
    const fx = 488;
    const rim = 224;
    const f = glassBox('funnel', fx - 72, rim, 144, 110, { wall: 4, cone: 0.68, stem: 0.1 });
    // the stand
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.2);
    rr(ctx, 612, 224, 8, BENCH_Y - 224, 4); ctx.fill();
    rr(ctx, 496, 312, 120, 7, 3); ctx.fill();
    rr(ctx, 586, BENCH_Y - 8, 62, 8, 4); ctx.fill();
    drawGlass(ctx, c, f, { shadow: false });
    // the paper cone
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.06);
    ctx.strokeStyle = mix(c.stroke, c.label, 0.2); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx - 62, rim + 6); ctx.lineTo(fx, rim + 72); ctx.lineTo(fx + 62, rim + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!opts.clear) {
      ctx.fillStyle = mix(c.gold, c.s8, 0.55);
      const k = clamp01(p * 1.1);
      ctx.beginPath(); ctx.moveTo(fx - 8 - 30 * k, rim + 66 - 42 * k); ctx.lineTo(fx, rim + 72); ctx.lineTo(fx + 8 + 30 * k, rim + 66 - 42 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = alpha(lighten(c.gold, 0.3), 0.7);
      for (let i = 0; i < 6; i++) { rr(ctx, fx - 22 + i * 8, rim + 44 - (i % 2) * 8, 7, 3, 1.5); if (k > 0.5) ctx.fill(); }
    }
    drawGlassFront(ctx, c, f, { shade: 0 });
    const b = glassBox('beaker', fx - 62, 346, 124, BENCH_Y - 346 + 2, { wall: 5 });
    drawGlass(ctx, c, b);
    const fl = opts.clear ? mix(c.water, c.bgSurface, 0.35) : mix(c.gold, c.ice, 0.55);
    if (this._run && p < 1) { ctx.fillStyle = alpha(fl, 0.9); rr(ctx, fx - 2.5, 334, 5, 40, 2); ctx.fill(); }
    drawGlassLiquid(ctx, c, b, { level: 0.74 * Math.max(p, 0.01) * (opts.clear ? 1 : 1 - this._back), fill: fl, opacity: 0.62 });
  }

  /** A flask, a side arm, a cooled tube and a receiver. p runs the charge down and the receiver up. */
  _still(ctx, c, p, pulp, opts = {}) {
    const bx = 396;
    this._burner(ctx, c, bx, BENCH_Y, !!this._run);
    // tripod
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 46, BENCH_Y); ctx.lineTo(bx - 40, 378); ctx.lineTo(bx + 40, 378); ctx.lineTo(bx + 46, BENCH_Y); ctx.stroke();
    ctx.lineCap = 'butt';
    const f = glassBox('round', bx - 60, 246, 120, 134, { wall: 5, neck: 0.3 });
    drawGlass(ctx, c, f, { shadow: false });
    const tone = opts.clear ? mix(c.water, c.bgSurface, 0.35) : pulp ? mix(c.gold, c.ice, 0.35) : mix(c.gold, c.ice, 0.55);
    const sy = mix(tone, c.s8, 0.55);
    const lvl = lerp(0.62, 0.2, p) * (opts.clear ? 1 : 1 - this._back);
    drawGlassLiquid(ctx, c, f, { level: lvl, fill: p > 0.9 ? sy : mix(tone, sy, p), opacity: lerp(0.65, 0.96, p) });
    drawGlassFront(ctx, c, f, { shade: 0 });
    // the side arm and the cooled tube
    const a = [bx + 8, 260], d = [bx + 96, 278], e = [582, 320];
    drawGlassPipe(ctx, c, a[0], a[1], d[0], d[1], 12);
    drawGlassPipe(ctx, c, d[0], d[1], e[0], e[1], 38);
    ctx.save();
    ctx.strokeStyle = alpha(c.water, 0.42); ctx.lineWidth = 32;
    ctx.beginPath(); ctx.moveTo(d[0] + 4, d[1] + 1); ctx.lineTo(e[0] - 4, e[1] - 1); ctx.stroke();
    ctx.strokeStyle = alpha(mix(c.bgSurface, c.glass, 0.4), 0.9); ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    ctx.restore();
    if (this._run && p < 1) {
      for (let k = 0; k < 7; k++) {
        const q = reducedMotion() ? k / 7 : (this.clock * 0.7 + k / 7) % 1;
        const x = lerp(a[0], e[0], q);
        const y = q < 0.33 ? lerp(a[1], d[1], q / 0.33) : lerp(d[1], e[1], (q - 0.33) / 0.67);
        ctx.fillStyle = alpha(q < 0.5 ? c.label : c.water, 0.5);
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    drawGlassPipeFront(ctx, c, a[0], a[1], d[0], d[1], 12);
    drawGlassPipeFront(ctx, c, d[0], d[1], e[0], e[1], 38);
    const r = glassBox('flask', 562, 336, 96, BENCH_Y - 336 + 2, { wall: 4, neck: 0.36 });
    drawGlass(ctx, c, r);
    drawGlassLiquid(ctx, c, r, { level: 0.6 * Math.max(p, 0.01), fill: c.water, opacity: 0.55 });
    ctx.fillStyle = alpha(c.water, 0.8);
    if (this._run && p < 1) { rr(ctx, 594, 322, 4, 26, 2); ctx.fill(); }
  }

  _dish(ctx, c, p) {
    const dx = 488, dy = 330;
    this._burner(ctx, c, dx, BENCH_Y, !!this._run);
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(dx - 84, BENCH_Y); ctx.lineTo(dx - 76, 366); ctx.lineTo(dx + 76, 366); ctx.lineTo(dx + 84, BENCH_Y); ctx.stroke();
    ctx.lineCap = 'butt';
    const rx = 128, ry = 48;
    const china = c.ice;
    ctx.fillStyle = china; ctx.strokeStyle = c.stroke; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(dx, dy, rx, ry, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
    const tone = mix(mix(c.gold, c.ice, 0.35), c.s8, 0.55 * p);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(dx, dy, rx - 6, ry - 5, 0, 0, Math.PI); ctx.closePath(); ctx.clip();
    ctx.fillStyle = tone;
    ctx.globalAlpha *= 1 - this._back;
    ctx.fillRect(dx - rx, dy + lerp(4, 26, p), rx * 2, ry);
    ctx.restore();
    if (this._run && p < 1) {
      for (let k = 0; k < 6; k++) {
        const q = reducedMotion() ? (k + 1) / 7 : (this.clock * 0.6 + k / 6) % 1;
        ctx.fillStyle = alpha(mix(c.label, c.bgSurface, 0.3), 0.45 * (1 - q));
        ctx.beginPath(); ctx.arc(dx - 80 + k * 32 + Math.sin(q * 6 + k) * 8, dy - 10 - q * 80, 6 + q * 12, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _diffCard(ctx, c) {
    const d = DIFFS.find((x) => x.value === this._diff);
    const L = PHONE
      ? { x: 168, w: 498, cx: 417, tw: 470, wrap: 462, ask: 44, askY: [236, 290], title: 56, titleY: 182, sub: 36, subY: 238, say: 42, sayY: 296, line: 48, tried: 36, askTried: 354, triedY: 404 }
      : { x: 306, w: 360, cx: 486, tw: 340, wrap: 320, ask: 28, askY: [256, 296], title: 40, titleY: 186, sub: 21, subY: 232, say: 28, sayY: 290, line: 36, tried: 20, askTried: 346, triedY: 402 };
    drawCard(ctx, c, L.x, 136, L.w, 298, 1, { accent: d?.jar ? c.good : c.accent });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (!d) {
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(L.ask), true);
      ctx.fillText('Which difference', L.cx, L.askY[0]);
      ctx.fillText('reaches this glass?', L.cx, L.askY[1]);
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(L.tried));
      ctx.fillText(`${this._seen.size} of 7 tried`, L.cx, L.askTried);
    } else {
      const s = this._spr();
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(L.title) * s, true);
      ctx.fillText(d.label === 'Paper' ? 'How far it travels' : d.label, L.cx, L.titleY, L.tw);
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(L.sub));
      ctx.fillText(d.method, L.cx, L.subY, L.tw);
      ctx.font = font(c, 700, fs(L.say), true);
      const lines = wrapLines(ctx, d.say, L.wrap);
      ctx.fillStyle = d.jar ? mix(c.good, c.label, 0.45) : c.label;
      lines.forEach((l, i) => ctx.fillText(l, L.cx, L.sayY + i * L.line));
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(L.tried));
      ctx.fillText(`${this._seen.size} of 7 tried`, L.cx, L.triedY);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  _tools(ctx, c) {
    const id = this._tool;
    if (!id) { pill(ctx, c, 'Pick a tool', 488, 300, { bg: c.accent, size: fs(22), display: true }); return; }
    const p = this._run ? (this._run.p ?? 0) : 1;
    if (id === 'filter') this._funnel(ctx, c, p, { clear: true });
    else if (id === 'still') this._still(ctx, c, p, false, { clear: true });
    else if (id === 'funnel') this._pear(ctx, c);
    else this._magnet(ctx, c, p);
    if (!this._run) {
      const t = TOOLS[id];
      ctx.save();
      ctx.globalAlpha *= clamp01(this._spr());
      drawCard(ctx, c, 310, 132, 356, 84, 1, { accent: id === 'still' ? c.good : c.accent });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(26), true);
      ctx.fillText(t.big, 488, 158, 340);
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(19));
      ctx.fillText(t.small, 488, 192, 340);
      ctx.restore();
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
  }

  _pear(ctx, c) {
    const fx = 488;
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.2);
    rr(ctx, 612, 224, 8, BENCH_Y - 224, 4); ctx.fill();
    rr(ctx, 512, 344, 104, 7, 3); ctx.fill();
    rr(ctx, 586, BENCH_Y - 8, 62, 8, 4); ctx.fill();
    const g = glassBox('pear', fx - 82, 226, 164, 190, { wall: 5 });
    drawGlass(ctx, c, g, { shadow: false });
    drawGlassLiquid(ctx, c, g, { level: 0.74, fill: mix(c.water, c.bgSurface, 0.35), opacity: 0.6 });
    drawGlassFront(ctx, c, g, { shade: 0 });
    ctx.fillStyle = mix(c.stroke, c.label, 0.2);
    rr(ctx, fx - 22, 382, 44, 11, 4); ctx.fill();
  }

  _magnet(ctx, c, p) {
    const x = 488;
    const b = glassBox('beaker', x - 62, 356, 124, BENCH_Y - 356 + 2, { wall: 5 });
    drawGlass(ctx, c, b);
    drawGlassLiquid(ctx, c, b, { level: 0.7, fill: mix(c.water, c.bgSurface, 0.35), opacity: 0.6 });
    const k = this._run ? Math.sin(Math.PI * p) : 0;
    const top = 232 + 46 * k;
    const legs = top + 50;
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = c.s6; ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(x - 52, legs + 22); ctx.lineTo(x - 52, legs); ctx.arc(x, legs, 52, Math.PI, 0); ctx.lineTo(x + 52, legs + 22); ctx.stroke();
    ctx.strokeStyle = mix(c.label, c.bgSurface, 0.2);
    ctx.beginPath(); ctx.moveTo(x - 52, legs + 22); ctx.lineTo(x - 52, legs + 40); ctx.moveTo(x + 52, legs + 22); ctx.lineTo(x + 52, legs + 40); ctx.stroke();
    ctx.restore();
  }
}
