// CaneToSugarScene - blk-l09-s07, four beats, the book's opening question.
//   stage 0  the learner taps the five steps in order: crush, filter, evaporate, crystallize, spin. A step that cannot
//            work yet says why and nothing moves. Each right step plays on one big bench picture.
//   stage 1  each step in turn: which difference does it use? Filter size, evaporate boiling point, crystallize
//            solubility, spin size. A mill's centrifuge is a drum with tiny holes: syrup is thrown out through them
//            and crystals are too big to follow. So this spin is a filter made fast, and density is the wrong answer.
//   stage 2  four more questions from the book's first page, each with its own picture.
//   stage 3  the whole line beside a jar of white sugar.
// Real mills add more cleaning steps to take out the colour; the prose says so. Colours only from c.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  COLOR_TOKEN_MAP, alpha, mix, lighten, darken, font, pill, rr, clamp01, lerp, mulberry32, outBack, inkOn,
  drawBackdrop, drawBench, drawCard, drawShadow,
} from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassFront, drawGlassLiquid, drawGlassBand } from 'simulations/base/kit/SimGlass.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const DEG = '\u00b0';

const BENCH_Y = 446;
const S_ORDER = 0, S_NAME = 1, S_ASK = 2, S_LINE = 3;
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const STEPS = [
  { id: 'crush', label: 'Crush', gives: 'Green juice', uses: 'pressing' },
  { id: 'filter', label: 'Filter', gives: 'Clear juice', uses: 'size' },
  { id: 'evap', label: 'Evaporate', gives: 'Thick syrup', uses: 'boiling point' },
  { id: 'cryst', label: 'Crystallize', gives: 'Crystals in syrup', uses: 'solubility' },
  { id: 'spin', label: 'Spin', gives: 'Sugar crystals', uses: 'size' },
];
const TOO_SOON = {
  filter: 'The juice is still in the cane',
  evap: ['The juice is still in the cane', 'Fibre would bake into the syrup'],
  cryst: ['The juice is still in the cane', 'Too much water: not saturated', 'Too much water: not saturated'],
  spin: ['The juice is still in the cane', 'No crystals to hold back yet', 'No crystals to hold back yet', 'No crystals to hold back yet'],
};
const NAMES = [
  { step: 1, ans: 'size', pic: 1, no: { bp: 'Nothing boils on a filter', solub: 'The fibre was never dissolved', density: 'The paper stops what is too big' } },
  { step: 2, ans: 'bp', pic: 2, no: { size: 'Water and sugar both passed the paper', solub: 'Water leaves as vapour. What decides that?', density: 'Nothing sinks here. Water boils off' } },
  { step: 3, ans: 'solub', pic: 3, no: { size: 'Dissolved sugar has no grains yet', bp: 'Nothing is boiling in this step', density: 'Crystals form first. Why do they form?' } },
  { step: 4, ans: 'size', pic: 4, no: { bp: 'Nothing boils in the drum', solub: 'The crystals are already solid', density: 'Holes decide here: crystals are too big to pass' } },
];
const NAME_LABEL = { size: 'size', bp: 'boiling point', solub: 'solubility', density: 'density' };
const ASKS = {
  mud: { label: 'Mud and milk', left: 'mud settles', right: 'milk stays mixed' },
  evap: { label: 'Evaporation and boiling', left: 'surface, any temperature', right: 'all through, at 100 ' + DEG + 'C' },
  rays: { label: 'Rays of sunlight' },
  blood: { label: 'Malaria' },
};

export class CaneToSugarScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static IRIS = false;
  static COLOR_MAP = { ...COLOR_TOKEN_MAP, ice: ['--sim-ice', '#cfeaff'], strata1: ['--sim-strata-1', '#e8c07a'], strata3: ['--sim-strata-3', '#a4603b'] };
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'Sugarcane on a bench becomes white sugar in five steps: crush, filter, evaporate, crystallize, spin. A step that cannot work yet says why. '
    + 'Then the difference behind each step is named. Then four questions are shown: mud and milk, evaporation and boiling, rays of sunlight, and malaria. The last view lists the whole line beside a jar of sugar.';
  static CONTROLS = [
    ...STEPS.map((s) => ({ type: 'button', id: s.id, label: s.label })),
    ...Object.entries(NAME_LABEL).map(([id, label]) => ({ type: 'button', id: `n-${id}`, label: label[0].toUpperCase() + label.slice(1) })),
    { type: 'segmented', id: 'ask', label: 'Question', value: 'mud', options: Object.entries(ASKS).map(([value, a]) => ({ value, label: a.label })) },
  ];

  constructor(container, config) {
    super(container, config);
    const r = mulberry32(31);
    this._cry = Array.from({ length: 90 }, () => ({ x: r(), y: r(), s: 4 + r() * 5, a: r() * 3 }));
    this._seed(0);
  }

  _seed(stage) {
    this._done = stage > S_ORDER ? STEPS.length : 0;
    this._t = 1;           // the current step's picture, 0..1
    this._going = false;
    this._say = '';
    this._pop = 1;
    this._named = 0;
    this._ask = 'mud';
    this._askT = 1;
    this._found = {};
  }

  enter(stage) {
    this._seed(stage);
    if (stage === S_ASK) { this._askT = 0; }
  }

  isControlHidden(id) {
    const s = this.stage;
    if (STEPS.some((x) => x.id === id)) return s !== S_ORDER;
    if (id.startsWith('n-')) return s !== S_NAME;
    if (id === 'ask') return s !== S_ASK;
    return true;
  }

  isControlDisabled(id) {
    if (STEPS.some((x) => x.id === id)) return this._going || STEPS.findIndex((x) => x.id === id) < this._done;
    if (id.startsWith('n-')) return this._named >= NAMES.length;
    return false;
  }

  getControlValue(id) { return id === 'ask' ? this._ask : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this._pop = 0;
    if (id === 'ask') {
      this._ask = String(v);
      this._askT = 0;
    } else if (id.startsWith('n-')) {
      const n = NAMES[this._named];
      const pick = id.slice(2);
      if (pick === n.ans) {
        this._named += 1;
        this._say = '';
        if (this._named === NAMES.length) this._find('cane-differences');
      } else {
        this._say = n.no[pick] || '';
        this.oops(340, 300);
      }
    } else {
      const i = STEPS.findIndex((x) => x.id === id);
      if (i === this._done) {
        this._done += 1;
        this._t = 0;
        this._going = true;
        this._say = '';
        if (this._done === STEPS.length) this._find('cane-order');
      } else {
        const t = TOO_SOON[id];
        this._say = Array.isArray(t) ? t[this._done] : t;
        this.oops(340, 300);
      }
    }
    this.animateFor(900);
    this.requestUiUpdate?.();
  }

  /** Once per find: the fifth step in order, and the last difference named. */
  _find(key) {
    if (this._found[key]) return;
    this._found[key] = true;
    this.celebrate(340, 300, 18, { key });
  }

  update(d) {
    if (this._pop < 1) this._pop += d;
    if (this._askT < 1) this._askT = Math.min(1, this._askT + d / 2.5);
    if (this._going) {
      this._t = Math.min(1, this._t + d / 3);
      if (this._t >= 1) { this._going = false; this.requestUiUpdate?.(); }
    }
  }

  busy() { return this._going || this._pop < 0.5 || (this.stage === S_ASK && this._askT < 1); }

  _spr() { return reducedMotion() ? 1 : outBack(clamp01(this._pop / 0.4)); }

  /* ------------------------------------------------------------------ paint */

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 90 });
    const s = this.stage;
    if (s === S_ASK) { this._askView(ctx, c); return; }
    if (s === S_LINE) { this._line(ctx, c); return; }
    const pic = s === S_NAME ? (NAMES[Math.min(this._named, NAMES.length - 1)].pic) : this._done;
    const t = s === S_ORDER ? this._t : 1;
    this._chain(ctx, c);
    this._picture(ctx, c, pic, t);
    if (s === S_ORDER) {
      if (this._say) this._note(ctx, c, this._say, c.warning);
      else if (this._done && !this._going) this._note(ctx, c, STEPS[this._done - 1].gives, c.good);
      else if (!this._done) this._note(ctx, c, 'Which step comes first?', c.accent);
    } else if (this._say) this._note(ctx, c, this._say, c.warning);
    else if (this._named >= NAMES.length) this._note(ctx, c, 'Every step has its difference', c.good);
    else this._note(ctx, c, `${STEPS[NAMES[this._named].step].label}: which difference?`, c.accent);
  }

  /** Five numbered steps along the top; each fills as it is done (stage 1: as its difference is named). */
  _chain(ctx, c) {
    const n = STEPS.length, w = 128, x0 = 340 - ((n - 1) * w) / 2;
    ctx.strokeStyle = mix(c.stroke, c.label, 0.2); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, 34); ctx.lineTo(x0 + (n - 1) * w, 34); ctx.stroke(); ctx.lineCap = 'butt';
    STEPS.forEach((s, i) => {
      const x = x0 + i * w;
      const on = this.stage === S_ORDER ? i < this._done : i === 0 || i <= this._named;
      ctx.fillStyle = on ? c.good : c.bgSurface; ctx.strokeStyle = on ? darken(c.good, 0.3) : c.stroke; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, 34, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = font(c, 700, 20, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? inkOn(c, c.good) : c.labelMuted;
      ctx.fillText(String(i + 1), x, 35);
      if (on) {
        ctx.font = font(c, 700, fs(PHONE ? 19 : 18));
        ctx.fillStyle = c.label;
        const named = this.stage === S_NAME ? (i === 0 ? '' : i <= this._named ? s.uses : '') : s.label;
        ctx.fillText(named || s.label, x, 74, 124);
      }
    });
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  _note(ctx, c, text, tone) {
    const s = this._spr();
    pill(ctx, c, text, 340, 112, { bg: tone === c.accent ? c.bgSurface : mix(c.bgSurface, tone, 0.3), size: fs(PHONE ? 22 : 24) * Math.max(0.7, Math.min(1, s)), display: true });
  }

  _picture(ctx, c, pic, t) {
    if (pic === 0) this._cane(ctx, c);
    else if (pic === 1) this._crush(ctx, c, t);
    else if (pic === 2) this._filter(ctx, c, t);
    else if (pic === 3) this._pan(ctx, c, t);
    else if (pic === 4) this._cryst(ctx, c, t);
    else this._drum(ctx, c, t);
  }

  _juice(c) { return mix(c.s3, c.gold, 0.45); }
  _clearJuice(c) { return mix(c.gold, c.ice, 0.4); }
  _syrup(c) { return mix(c.s8, c.strata3, 0.45); }

  _stalk(ctx, c, x, y, h, lean) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(lean);
    const g = mix(c.s3, c.gold, 0.25);
    ctx.fillStyle = g;
    rr(ctx, -13, -h, 26, h, 8); ctx.fill();
    ctx.fillStyle = alpha(lighten(g, 0.4), 0.7);
    rr(ctx, -8, -h + 6, 6, h - 12, 3); ctx.fill();
    ctx.fillStyle = darken(g, 0.3);
    for (let i = 1; i < 6; i++) { rr(ctx, -14, -h + (i * h) / 6, 28, 6, 2); ctx.fill(); }
    ctx.fillStyle = mix(c.s3, c.strata1, 0.15);
    for (const [a, l] of [[-0.8, 70], [0.7, 80], [-0.2, 90]]) {
      ctx.save(); ctx.translate(0, -h); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(0, -l * 0.6, 3, -l); ctx.quadraticCurveTo(10, -l * 0.5, 6, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  _cane(ctx, c) {
    this._stalk(ctx, c, 250, BENCH_Y, 230, -0.2);
    this._stalk(ctx, c, 340, BENCH_Y, 262, 0);
    this._stalk(ctx, c, 430, BENCH_Y, 230, 0.2);
    drawShadow(ctx, c, 340, BENCH_Y + 4, 150);
  }

  _roller(ctx, c, x, y, r, t) {
    const steel = mix(c.waste, c.ice, 0.45);
    ctx.fillStyle = darken(steel, 0.2);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = steel;
    ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.3); ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + (i * Math.PI) / 3;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * (r - 12), y - Math.sin(a) * (r - 12)); ctx.lineTo(x + Math.cos(a) * (r - 12), y + Math.sin(a) * (r - 12)); ctx.stroke();
    }
  }

  _crush(ctx, c, t) {
    const y0 = 236;
    // the frame that holds the rollers
    const frame = mix(c.stroke, c.bgDeep, 0.2);
    ctx.fillStyle = frame;
    rr(ctx, 244, 138, 12, BENCH_Y - 138, 4); ctx.fill();
    rr(ctx, 396, 138, 12, BENCH_Y - 138, 4); ctx.fill();
    rr(ctx, 236, 132, 180, 12, 4); ctx.fill();
    // the stalk going in
    if (t < 0.97) this._stalk(ctx, c, 110 + 120 * t, y0, Math.max(30, 200 * (1 - t) + 20), Math.PI / 2 + Math.PI);
    this._roller(ctx, c, 326, y0 - 54, 56, this._going ? t : 0.2);
    this._roller(ctx, c, 326, y0 + 54, 56, this._going ? -t : -0.2);
    // pressed fibre coming out
    ctx.fillStyle = mix(c.strata1, c.s3, 0.2);
    rr(ctx, 380, y0 - 6, 150 * t + 10, 12, 4); ctx.fill();
    ctx.strokeStyle = darken(c.strata1, 0.2); ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(384 + i * 24 * t, y0 - 4); ctx.lineTo(394 + i * 24 * t, y0 + 4); ctx.stroke(); }
    const b = glassBox('beaker', 266, 340, 124, BENCH_Y - 340 + 2, { wall: 5 });
    if (this._going) { ctx.fillStyle = alpha(this._juice(c), 0.9); rr(ctx, 322, 300, 8, 90, 3); ctx.fill(); }
    drawGlass(ctx, c, b);
    drawGlassLiquid(ctx, c, b, { level: 0.74 * Math.max(0.02, t), fill: this._juice(c), opacity: 0.9 });
  }

  _filter(ctx, c, t) {
    const fx = 340, rim = 142;
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.2);
    rr(ctx, 494, 142, 9, BENCH_Y - 142, 4); ctx.fill();
    rr(ctx, 348, 256, 150, 7, 3); ctx.fill();
    rr(ctx, 468, BENCH_Y - 8, 64, 8, 4); ctx.fill();
    const f = glassBox('funnel', fx - 90, rim, 180, 140, { wall: 5, cone: 0.68, stem: 0.1 });
    drawGlass(ctx, c, f, { shadow: false });
    ctx.fillStyle = mix(c.bgSurface, c.ice, 0.75); ctx.strokeStyle = mix(c.stroke, c.label, 0.2); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx - 78, rim + 8); ctx.lineTo(fx, rim + 92); ctx.lineTo(fx + 78, rim + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = mix(c.strata1, c.s3, 0.3);
    const k = clamp01(t * 1.1);
    ctx.beginPath(); ctx.moveTo(fx - 10 - 38 * k, rim + 82 - 52 * k); ctx.lineTo(fx, rim + 92); ctx.lineTo(fx + 10 + 38 * k, rim + 82 - 52 * k); ctx.closePath(); ctx.fill();
    drawGlassFront(ctx, c, f, { shade: 0 });
    const b = glassBox('beaker', fx - 66, 316, 132, BENCH_Y - 316 + 2, { wall: 5 });
    drawGlass(ctx, c, b);
    if (this._going) { ctx.fillStyle = alpha(this._clearJuice(c), 0.9); rr(ctx, fx - 3, 282, 6, 60, 3); ctx.fill(); }
    drawGlassLiquid(ctx, c, b, { level: 0.7 * Math.max(0.02, t), fill: this._clearJuice(c), opacity: 0.75 });
  }

  _burner(ctx, c, x, y, on) {
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.25);
    rr(ctx, x - 30, y - 14, 60, 14, 5); ctx.fill();
    ctx.fillStyle = lighten(mix(c.stroke, c.bgDeep, 0.25), 0.2);
    rr(ctx, x - 8, y - 32, 16, 20, 3); ctx.fill();
    if (on) {
      const h = reducedMotion() ? 34 : 34 + 5 * Math.sin(this.clock * 9);
      ctx.fillStyle = c.flame;
      ctx.beginPath(); ctx.moveTo(x - 13, y - 32); ctx.quadraticCurveTo(x, y - 32 - h * 1.5, x + 13, y - 32); ctx.closePath(); ctx.fill();
    }
  }

  _pan(ctx, c, t) {
    const dx = 340, dy = 278;
    this._burner(ctx, c, dx, BENCH_Y, this._going || t < 1);
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(dx - 110, BENCH_Y); ctx.lineTo(dx - 96, 348); ctx.lineTo(dx + 96, 348); ctx.lineTo(dx + 110, BENCH_Y); ctx.stroke();
    ctx.lineCap = 'butt';
    const rx = 190, ry = 72;
    ctx.fillStyle = mix(c.waste, c.ice, 0.4); ctx.strokeStyle = darken(mix(c.waste, c.ice, 0.4), 0.3); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(dx - rx, dy); ctx.lineTo(dx + rx, dy); ctx.lineTo(dx + rx - 34, dy + ry); ctx.lineTo(dx - rx + 34, dy + ry); ctx.closePath(); ctx.fill(); ctx.stroke();
    const tone = mix(this._clearJuice(c), this._syrup(c), t);
    const top = lerp(dy + 8, dy + 40, t);
    ctx.fillStyle = tone;
    ctx.beginPath(); ctx.moveTo(dx - rx + 14 + (top - dy) * 0.47, top); ctx.lineTo(dx + rx - 14 - (top - dy) * 0.47, top); ctx.lineTo(dx + rx - 40, dy + ry - 5); ctx.lineTo(dx - rx + 40, dy + ry - 5); ctx.closePath(); ctx.fill();
    if (this._going) {
      for (let k = 0; k < 7; k++) {
        const q = reducedMotion() ? (k + 1) / 8 : (this.clock * 0.6 + k / 7) % 1;
        ctx.fillStyle = alpha(mix(c.label, c.bgSurface, 0.3), 0.4 * (1 - q));
        ctx.beginPath(); ctx.arc(dx - 130 + k * 44 + Math.sin(q * 6 + k) * 10, dy - 6 - q * 90, 8 + q * 14, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _crystal(ctx, c, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = lighten(c.ice, 0.6);
    rr(ctx, -s, -s, s * 2, s * 2, 2); ctx.fill();
    ctx.strokeStyle = darken(c.ice, 0.25); ctx.lineWidth = 1.4;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.restore();
  }

  _cryst(ctx, c, t) {
    const b = glassBox('beaker', 214, 170, 252, BENCH_Y - 170 + 2, { wall: 7 });
    drawGlass(ctx, c, b);
    drawGlassLiquid(ctx, c, b, { level: 0.76, fill: this._syrup(c), opacity: 0.82 });
    const inner = b.inner;
    for (const p of this._cry) {
      if (p.y > t * 1.1) continue;
      const x = inner.x + 10 + p.x * (inner.w - 20);
      const y = b.floor - 8 - p.y * 80 * t;
      this._crystal(ctx, c, x, y, p.s * Math.min(1, t * 1.5), p.a);
    }
    drawGlassFront(ctx, c, b, { shade: 0.12 });
  }

  /** The drum from above, cut open: crystals held on the holed wall, syrup thrown out through it. */
  _drum(ctx, c, t) {
    const x = 340, y = 278, R = 118;
    const steel = mix(c.waste, c.ice, 0.45);
    ctx.fillStyle = darken(steel, 0.25);
    ctx.beginPath(); ctx.arc(x, y, R + 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix(c.bgSurface, this._syrup(c), Math.min(1, t * 1.2));
    ctx.beginPath(); ctx.arc(x, y, R + 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix(c.bgDeep, this._syrup(c), 0.65 * (1 - t));
    ctx.beginPath(); ctx.arc(x, y, R - 4, 0, Math.PI * 2); ctx.fill();
    const rot = this._going ? t * 14 : 0;
    ctx.strokeStyle = steel; ctx.lineWidth = 10; ctx.setLineDash([16, 8]); ctx.lineDashOffset = -rot * 40;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 90; i++) {
      const p = this._cry[i];
      const a = p.x * Math.PI * 2 + rot;
      const r0 = 40 + p.y * 60;
      const rad = lerp(r0, R - 14 - p.y * 24, clamp01(t * 1.6));
      this._crystal(ctx, c, x + Math.cos(a) * rad, y + Math.sin(a) * rad, p.s * 0.9, p.a + rot);
    }
    if (this._going) {
      ctx.fillStyle = this._syrup(c);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + rot * 0.3;
        const q = reducedMotion() ? 0.5 : (this.clock * 1.5 + i * 0.17) % 1;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * (R + 2 + q * 16), y + Math.sin(a) * (R + 2 + q * 16), 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (!this._going) pill(ctx, c, 'syrup out through the holes', x, 432, { bg: c.bgSurface, size: fs(PHONE ? 20 : 20) });
  }

  /* ---------------------------------------------- stage 2: four questions */

  _askView(ctx, c) {
    const id = this._ask;
    const t = reducedMotion() ? 1 : this._askT;
    if (id === 'mud') this._askMud(ctx, c, t);
    else if (id === 'evap') this._askEvap(ctx, c, t);
    else if (id === 'rays') this._askRays(ctx, c, t);
    else this._askBlood(ctx, c, t);
  }

  _askMud(ctx, c, t) {
    const a = glassBox('tube', 150, 70, 110, BENCH_Y - 72, { wall: 6 });
    drawGlass(ctx, c, a);
    const mud = mix(c.strata3, c.water, 0.2);
    drawGlassLiquid(ctx, c, a, { level: 0.86, fill: mix(mud, mix(c.water, c.ice, 0.4), t * 0.92), opacity: 0.86 });
    drawGlassBand(ctx, c, a, { from: 0, to: 0.03 + 0.2 * t, fill: darken(c.strata3, 0.1), opacity: 1 });
    drawGlassFront(ctx, c, a, { shade: 0.1 });
    const b = glassBox('tube', 420, 70, 110, BENCH_Y - 72, { wall: 6 });
    drawGlass(ctx, c, b);
    drawGlassLiquid(ctx, c, b, { level: 0.86, fill: lighten(c.ice, 0.72), opacity: 1 });
    drawGlassFront(ctx, c, b, { shade: 0.1 });
    pill(ctx, c, 'over 1000 nm: mud settles', PHONE ? 176 : 205, 486, { bg: c.bgSurface, size: fs(PHONE ? 18 : 19) });
    pill(ctx, c, 'colloid: milk stays', PHONE ? 508 : 475, 486, { bg: c.bgSurface, size: fs(PHONE ? 18 : 19) });
  }

  _askEvap(ctx, c, t) {
    const a = glassBox('beaker', 60, 200, 240, BENCH_Y - 200 + 2, { wall: 7 });
    drawGlass(ctx, c, a);
    drawGlassLiquid(ctx, c, a, { level: 0.7, fill: c.water, opacity: 0.55 });
    const sy = a.floor - a.inner.h * 0.7;
    for (let k = 0; k < 7; k++) {
      const q = reducedMotion() ? (k + 1) / 8 : (this.clock * 0.35 + k / 7) % 1;
      ctx.fillStyle = alpha(c.water, 0.7 * (1 - q));
      ctx.beginPath(); ctx.arc(84 + k * 32, sy - 6 - q * 100, 4, 0, Math.PI * 2); ctx.fill();
    }
    this._burner(ctx, c, 500, BENCH_Y, true);
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(420, BENCH_Y); ctx.lineTo(428, 346); ctx.lineTo(572, 346); ctx.lineTo(580, BENCH_Y); ctx.stroke(); ctx.lineCap = 'butt';
    const b = glassBox('beaker', 398, 170, 204, 174, { wall: 7 });
    drawGlass(ctx, c, b, { shadow: false });
    drawGlassLiquid(ctx, c, b, { level: 0.72, fill: c.water, opacity: 0.55 });
    const r = mulberry32(3);
    for (let k = 0; k < 22; k++) {
      const x = b.inner.x + 12 + r() * (b.inner.w - 24), sp = 0.4 + r() * 0.6, ph = r();
      const q = reducedMotion() ? ph : (this.clock * sp + ph) % 1;
      const y = lerp(b.floor - 8, b.floor - b.inner.h * 0.68, q);
      ctx.strokeStyle = alpha(c.ice, 0.95); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 3 + q * 6, 0, Math.PI * 2); ctx.stroke();
    }
    pill(ctx, c, 'Evaporation', 180, 120, { bg: c.bgSurface, size: fs(24), display: true });
    pill(ctx, c, 'Boiling', 500, 120, { bg: c.bgSurface, size: fs(24), display: true });
    pill(ctx, c, 'only at the surface', 180, 486, { bg: c.bgSurface, size: fs(PHONE ? 19 : 19) });
    pill(ctx, c, 'all through the liquid', 500, 486, { bg: c.bgSurface, size: fs(PHONE ? 19 : 19) });
  }

  _askRays(ctx, c, t) {
    ctx.fillStyle = darken(c.s3, 0.74);
    ctx.fillRect(0, 0, 680, BENCH_Y);
    const trunk = darken(c.strata3, 0.3);
    ctx.fillStyle = trunk; rr(ctx, 70, 90, 46, BENCH_Y - 80, 10); ctx.fill();
    rr(ctx, 560, 90, 54, BENCH_Y - 80, 10); ctx.fill();
    const gaps = [[210, 80], [330, 96], [450, 70]];
    for (const [x, w] of gaps) {
      const g = ctx.createLinearGradient(0, 80, 0, BENCH_Y);
      g.addColorStop(0, alpha(c.gold, 0.8 * t));
      g.addColorStop(1, alpha(c.gold, 0.12 * t));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x + w * 0.22, 80); ctx.lineTo(x + 56 + w * 0.5, BENCH_Y); ctx.lineTo(x + 8, BENCH_Y); ctx.closePath(); ctx.fill();
    }
    const r = mulberry32(8);
    for (let i = 0; i < 80; i++) {
      const gap = gaps[i % 3];
      const u = r(), y = 90 + u * (BENCH_Y - 100), x = gap[0] + 6 + u * 28 + r() * (gap[1] * 0.3 + u * 30);
      ctx.fillStyle = alpha(lighten(c.gold, 0.7), 0.95 * t);
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = darken(c.s3, 0.4);
    const blobs = [[60, 30, 110], [180, 16, 90], [290, 30, 86], [410, 22, 80], [520, 24, 96], [640, 34, 110]];
    for (const [x, y, r0] of blobs) { ctx.beginPath(); ctx.ellipse(x, y, r0, 62, 0, 0, Math.PI * 2); ctx.fill(); }
    pill(ctx, c, 'Tyndall effect: dust scatters the light', 340, 486, { bg: c.bgSurface, size: fs(PHONE ? 20 : 20), display: true });
  }

  _askBlood(ctx, c, t) {
    const a = glassBox('tube', 130, 80, 84, BENCH_Y - 82, { wall: 5 });
    drawGlass(ctx, c, a);
    const red = c.s6;
    drawGlassLiquid(ctx, c, a, { level: 0.84, fill: mix(red, mix(c.gold, c.ice, 0.45), t), opacity: 0.95 });
    drawGlassBand(ctx, c, a, { from: 0, to: 0.03 + 0.38 * t, fill: darken(red, 0.15), opacity: 1 });
    drawGlassFront(ctx, c, a, { shade: 0.1 });
    // the lens over one small place
    const x = 440, y = 240, R = 150;
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 3; ctx.setLineDash([8, 7]);
    ctx.beginPath(); ctx.moveTo(190, 300); ctx.lineTo(x - R + 6, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = mix(c.ice, red, 0.08);
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(mix(c.waste, c.ice, 0.3), 0.2); ctx.lineWidth = 12; ctx.stroke();
    const r = mulberry32(14);
    for (let i = 0; i < 16; i++) {
      const a2 = i * 2.4 + r() * 0.3, d = Math.sqrt((i + 0.5) / 16) * (R - 30);
      const px = x + Math.cos(a2) * d, py = y + Math.sin(a2) * d;
      const hit = i % 4 === 1;
      ctx.fillStyle = mix(red, c.ice, 0.14);
      ctx.beginPath(); ctx.arc(px, py, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = darken(red, 0.14);
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      if (hit) {
        ctx.fillStyle = c.s5;
        ctx.beginPath(); ctx.arc(px + 5, py - 4, 7 * t + 1, 0, Math.PI * 2); ctx.fill();
      }
    }
    pill(ctx, c, 'infected cells gathered in one place', 390, 486, { bg: c.bgSurface, size: fs(PHONE ? 20 : 20) });
  }

  /* ------------------------------------------------------- stage 3: the line */

  _line(ctx, c) {
    const x = 26, w = 372, h = 76;
    STEPS.forEach((s, i) => {
      const y = 22 + i * (h + 8);
      drawCard(ctx, c, x, y, w, h, 1, { accent: i === 0 ? c.stroke : c.good, r: 12 });
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(24), true);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(s.label, x + 16, y + h / 2, 170);
      ctx.textAlign = 'right';
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(21));
      ctx.fillText(s.uses, x + w - 16, y + h / 2, 170);
    });
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const g = glassBox('jar', 424, 170, 232, BENCH_Y - 170 + 2, { wall: 7 });
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.74, fill: lighten(c.ice, 0.5), opacity: 1 });
    const inner = g.inner;
    for (const p of this._cry) {
      const yy = g.floor - 10 - p.y * inner.h * 0.68;
      this._crystal(ctx, c, inner.x + 12 + p.x * (inner.w - 24), yy, p.s * 0.9, p.a);
    }
    drawGlassFront(ctx, c, g, { shade: 0.1 });
    ctx.fillStyle = mix(c.waste, c.ice, 0.3);
    rr(ctx, 436, 150, 208, 22, 6); ctx.fill();
    pill(ctx, c, 'white sugar', 540, 112, { bg: c.bgSurface, size: fs(24), display: true });
  }
}
