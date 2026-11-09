// SeparatingFunnelScene - Fig. 5.16 as one working funnel: 5 mL of mustard oil on 20 mL of water, big, on a stand.
// Levels come from a volume table built from the glass itself, so the line falls slowly in the bulb and fast near the stem.
//   setup mount (predict, no beats): the charge, the stopper, the stopcock. No control, nothing runs.
//   b0  the learner opens the stopcock: water leaves first
//   b1  the stopper is in: the flow stops. Take it out and it runs. Finding that is a find.
//   b2  the skill: shut when the water is almost gone (a find), then the small mixed portion, then the oil, each in its own vessel
//   b3  pick a pair: immiscible pairs show two layers, miscible pairs one liquid
//   b4  same density: blobs hang wherever they were poured, no lower layer
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, darken, drawBackdrop, drawBench, drawCard, drawShadow, font, leader, lighten, mix, mulberry32, pill, rr } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { glassBox, glassPath, drawGlass, drawGlassBand, drawGlassFront, drawGlassLiquid, wallsAt } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const TAU = Math.PI * 2;
const BENCH_Y = 442;
const CX = 270;
const PEAR = glassBox('pear', CX - 112, 60, 224, 280, { wall: 6, neck: 0.2, belly: 0.46, stemAt: 0.8, stem: 0.08 });
const TAP_Y = 304;
const BOTTOM = TAP_Y - 8;                   // the liquid column ends at the stopcock
const TOP_Y = 112;                          // where 25 mL stands
const V_W = 20, V_O = 5;
const RATE = 3.2, SLOW = 1.5, STALL = 0.9;  // mL per second; with the stopper in, the flow stops after this much
const WINDOW = [0.25, 2.6];                 // mL of water left when a good shut happens
const MIXED = 0.7;                          // mL of oil taken with the mixed portion
const PAIRS = {
  oil: { label: 'mustard oil, water', kind: 'im' },
  alcohol: { label: 'water, alcohol', kind: 'mi' },
  vinegar: { label: 'water, vinegar', kind: 'mi' },
  acetone: { label: 'acetone, water', kind: 'mi' },
};
const S_FIRST = 0, S_STOPPER = 1, S_STOP = 2, S_WORDS = 3, S_SAME = 4;
const MAP = [S_FIRST, S_STOPPER, S_STOP, S_WORDS, S_SAME].map((i) => [{ idx: i, dwellMs: null }]);
const PANEL = { x: 448, w: 216 };
const RX = { under: CX, left: 96 };
const HOME_B = 532, HOME_C = 626;
const FLASK = { w: 112, h: 96 };

// Cumulative volume against height, from the glass profile. Scaled so 25 mL stands at TOP_Y.
const TABLE = (() => {
  const rows = [];
  let area = 0;
  for (let y = BOTTOM; y >= TOP_Y - 30; y -= 1) {
    const w = wallsAt(PEAR, y);
    const hw = w ? (w[1] - w[0]) / 2 : 0;
    area += hw * hw;
    rows.push({ y, area });
  }
  const at = rows.find((r) => r.y <= TOP_Y).area;
  return rows.map((r) => ({ y: r.y, v: (r.area / at) * (V_W + V_O) }));
})();
const levelY = (v) => {
  if (v <= 0) return BOTTOM;
  for (const r of TABLE) if (r.v >= v) return r.y;
  return TOP_Y - 30;
};

export class SeparatingFunnelScene extends SimScene {
  static BEAT_MAPS = { 5: MAP };
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A separating funnel on a stand holding yellow mustard oil on water, with a stopcock at the bottom. Open the stopcock and water leaves first. Shut it when the water is almost gone, collect the small mixed portion apart, then collect the oil.';
  static CONTROLS = [
    { type: 'segmented', id: 'stopcock', label: 'Stopcock', value: 'shut', options: [{ value: 'shut', label: 'Shut' }, { value: 'open', label: 'Open' }] },
    { type: 'segmented', id: 'stopper', label: 'Stopper', value: 'in', options: [{ value: 'in', label: 'In' }, { value: 'out', label: 'Out' }] },
    { type: 'button', id: 'mixed', label: 'Collect the mixed drops' },
    { type: 'button', id: 'oil', label: 'Collect the oil' },
    { type: 'select', id: 'pair', label: 'Two liquids', value: 'oil', options: Object.entries(PAIRS).map(([value, p]) => ({ value, label: p.label })) },
    { type: 'segmented', id: 'dens', label: 'Density', value: 'same', options: [{ value: 'diff', label: 'Different' }, { value: 'same', label: 'The same' }] },
    { type: 'button', id: 'again', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    const r = mulberry32(17);
    this._blobs = Array.from({ length: 16 }, () => ({ x: r() * 2 - 1, v: 2 + r() * 21, r: 7 + r() * 13 }));
    this._state(S_FIRST);
  }

  _state(stage) {
    this._w = V_W; this._o = V_O;     // what is in the funnel
    this._A = { w: 0, o: 0 };         // the first flask
    this._B = { w: 0, o: 0 };         // the small beaker for the mixed part
    this._C = { w: 0, o: 0 };         // the clean flask
    this._under = 'A';
    this._ax = RX.under; this._bx = HOME_B; this._cx = HOME_C;
    this._open = false;
    this._in = false;                 // stopper in the neck
    this._leak = 0;
    this._stalled = false;
    this._freed = false;
    this._shutOk = false;
    this._bad = false;
    this._phase = '';                 // '' | mixed | oil
    this._goal = 0;
    this._pair = 'oil';
    this._dens = 'same';
    if (stage === S_STOPPER) this._in = true;
    if (stage === S_STOP) { this._w = 7; this._A.w = V_W - 7; }
  }

  enter(stage) { this._state(stage); }

  get _setup() { return this.beatCount !== 5; }
  get _drainOn() { return !this._setup && this.stage <= S_STOP; }

  _slideHome() {
    const c = this._under;
    const t = { A: c === 'A' ? RX.under : RX.left, B: c === 'B' ? RX.under : HOME_B, C: c === 'C' ? RX.under : HOME_C };
    return t;
  }

  update(d) {
    const t = this._slideHome();
    const ease = Math.min(1, d * 7);
    this._ax += (t.A - this._ax) * ease;
    this._bx += (t.B - this._bx) * ease;
    this._cx += (t.C - this._cx) * ease;
    if (!this._open || this._stalled) return;
    const slow = this.stage === S_STOP && this._phase === '';
    let q = (slow ? SLOW : RATE) * d;
    if (this._in) {
      this._leak += q;
      if (this._leak >= STALL) { this._stalled = true; this.requestUiUpdate?.(); return; }
    }
    const rec = this[`_${this._under}`];
    if (this._w > 0) {
      const take = Math.min(q, this._w);
      this._w -= take; rec.w += take; q -= take;
    }
    if (q > 0 && this._o > 0) {
      const take = Math.min(q, this._o);
      this._o -= take; rec.o += take;
    }
    if (this._phase === 'mixed' && this._B.o >= MIXED) { this._w = 0; this._open = false; this._phase = 'mixed-done'; this.requestUiUpdate?.(); }
    else if (this._phase === 'oil' && this._o <= 0) { this._open = false; this._phase = 'done'; this.requestUiUpdate?.(); }
    else if (this._w <= 0 && this._o <= 0) { this._open = false; this.requestUiUpdate?.(); }
    if (this.stage === S_STOP && this._phase === '' && this._A.o > 0.15 && !this._bad) { this._bad = true; this.requestUiUpdate?.(); }
  }

  busy() {
    const t = this._slideHome();
    return (this._open && !this._stalled) || Math.abs(t.A - this._ax) > 0.5 || Math.abs(t.B - this._bx) > 0.5 || Math.abs(t.C - this._cx) > 0.5;
  }

  /* ------------------------------------------------------------------- paint */

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 110 });
    this._stand(ctx, c);
    if (this._drainOn || this._setup) {
      this._flask(ctx, c, this._ax, this._A, 40);
      this._flask(ctx, c, this._bx, this._B, 8, true);
      this._flask(ctx, c, this._cx, this._C, 10);
    }
    this._funnel(ctx, c);
    this._stopcock(ctx, c);
    this._stopperDraw(ctx, c);
    if (this._drainOn) this._stream(ctx, c);
    if (this._setup) this._partLabels(ctx, c);
    else this._side(ctx, c);
  }

  _iron(c) { return mix(c.stroke, c.label, 0.2); }

  _stand(ctx, c) {
    const x = 436, iron = this._iron(c);
    drawShadow(ctx, c, x, BENCH_Y, 44, 5);
    rr(ctx, x - 44, BENCH_Y - 10, 88, 12, 4 * lookOf().radius); ctx.fillStyle = iron; ctx.fill();
    ctx.fillRect(x - 5, 42, 10, BENCH_Y - 42);
    ctx.fillStyle = alpha(lighten(iron, 0.4), 0.6); ctx.fillRect(x - 3, 42, 2.5, BENCH_Y - 52);
    ctx.fillStyle = iron;
    ctx.fillRect(CX + 34, 92, x - CX - 34, 8);
    rr(ctx, x - 13, 82, 26, 28, 5 * lookOf().radius); ctx.fill();
    ctx.strokeStyle = iron; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(CX, 96, 34, 9, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
  }

  _gold(c) { return mix(c.gold, c.s8, 0.25); }

  _funnel(ctx, c) {
    drawGlass(ctx, c, PEAR, { shadow: false });
    ctx.save();
    glassPath(ctx, PEAR, PEAR.inner);
    ctx.clip();
    const X = PEAR.x, W = PEAR.w;
    const water = alpha(c.water, 0.62), gold = this._gold(c);
    if (this.stage === S_WORDS && !this._setup) {
      const y = levelY(V_W + V_O);
      if (PAIRS[this._pair].kind === 'mi') {
        ctx.fillStyle = water; ctx.fillRect(X, y, W, PEAR.floor - y);
      } else {
        const by = levelY(V_W);
        ctx.fillStyle = gold; ctx.fillRect(X, y, W, by - y);
        ctx.fillStyle = water; ctx.fillRect(X, by, W, PEAR.floor - by);
        ctx.fillStyle = darken(gold, 0.35); ctx.fillRect(X, by - 1.5, W, 3);
      }
    } else if (this.stage === S_SAME && !this._setup) {
      const y = levelY(V_W + V_O);
      if (this._dens === 'same') {
        ctx.fillStyle = water; ctx.fillRect(X, y, W, PEAR.floor - y);
        for (const b of this._blobs) {
          const by = levelY(b.v);
          const w = wallsAt(PEAR, by);
          if (!w) continue;
          const bx = PEAR.cx + b.x * (w[1] - w[0]) * 0.34;
          ctx.fillStyle = gold;
          ctx.beginPath(); ctx.ellipse(bx, by, b.r, b.r * 0.86, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = alpha(lighten(gold, 0.6), 0.7);
          ctx.beginPath(); ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, b.r * 0.24, 0, TAU); ctx.fill();
        }
      } else {
        const by = levelY(V_W);
        ctx.fillStyle = gold; ctx.fillRect(X, y, W, by - y);
        ctx.fillStyle = water; ctx.fillRect(X, by, W, PEAR.floor - by);
        ctx.fillStyle = darken(gold, 0.35); ctx.fillRect(X, by - 1.5, W, 3);
      }
    } else {
      const total = this._w + this._o;
      if (total > 0.01) {
        const topY = levelY(total), by = levelY(this._w);
        if (this._o > 0.01) {
          ctx.fillStyle = gold; ctx.fillRect(X, topY, W, by - topY);
          ctx.fillStyle = alpha(lighten(gold, 0.45), 0.85); ctx.fillRect(X, topY, W, 2.5);
        }
        if (this._w > 0.01) {
          ctx.fillStyle = water; ctx.fillRect(X, by, W, BOTTOM - by);
          if (this._o > 0.01) { ctx.fillStyle = darken(gold, 0.35); ctx.fillRect(X, by - 1.5, W, 3); }
          else { ctx.fillStyle = alpha(lighten(c.water, 0.5), 0.8); ctx.fillRect(X, by, W, 2.5); }
        }
        ctx.fillStyle = this._w > 0.01 ? water : gold;
        ctx.fillRect(X, BOTTOM, W, TAP_Y - BOTTOM + 6);
      }
    }
    ctx.restore();
    drawGlassFront(ctx, c, PEAR);
  }

  _stopcock(ctx, c) {
    const col = lighten(this._iron(c), 0.1);
    rr(ctx, CX - 24, TAP_Y - 12, 48, 24, 7 * lookOf().radius); ctx.fillStyle = alpha(c.glass, 0.5); ctx.fill();
    ctx.strokeStyle = darken(c.glass, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save();
    ctx.translate(CX, TAP_Y);
    ctx.rotate(this._open ? Math.PI / 2 : 0);
    rr(ctx, -46, -7, 92, 14, 7 * lookOf().radius); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  _stopperDraw(ctx, c) {
    const inNeck = this._in;
    const x = inNeck ? CX : 184, y = inNeck ? 44 : BENCH_Y - 30;
    ctx.fillStyle = alpha(c.glass, 0.75);
    ctx.beginPath(); ctx.moveTo(x - 25, y); ctx.lineTo(x + 25, y); ctx.lineTo(x + 18, y + 30); ctx.lineTo(x - 18, y + 30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(c.glass, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 7, 12, 0, TAU); ctx.fillStyle = alpha(c.glass, 0.75); ctx.fill(); ctx.stroke();
  }

  _flask(ctx, c, x, rec, cap, small = false) {
    const w = small ? 92 : FLASK.w, h = small ? 62 : FLASK.h;
    const g = small ? glassBox('beaker', x - w / 2, BENCH_Y - h, w, h, { wall: 4, r: 8 })
      : glassBox('flask', x - w / 2, BENCH_Y - h, w, h, { wall: 4, r: 6, neck: 0.34 });
    drawGlass(ctx, c, g);
    const tw = Math.min(0.92, rec.w / cap * 0.62), to = Math.min(0.96 - tw, rec.o / cap * 0.62);
    if (tw > 0.01) drawGlassLiquid(ctx, c, g, { level: tw + to, fill: c.water, opacity: 0.62 });
    if (to > 0.005) drawGlassBand(ctx, c, g, { from: tw, to: tw + to, fill: this._gold(c), opacity: 0.95 });
  }

  _stream(ctx, c) {
    if (!this._open || this._stalled) return;
    const col = this._w > 0 ? c.water : this._gold(c);
    const y1 = BENCH_Y - 20;
    ctx.strokeStyle = alpha(col, 0.92); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(CX, PEAR.y + PEAR.h); ctx.lineTo(CX, y1); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(col, 0.5), 0.7); ctx.lineWidth = 2.2; ctx.stroke();
  }

  _partLabels(ctx, c) {
    const lab = (t, x, y, tx, ty, bg) => {
      pill(ctx, c, t, x, y, { bg: bg ?? c.raised, size: fs(19), display: true });
      leader(ctx, x + (tx > x ? 70 : -70), y, tx, ty, darken(c.glass, 0.25), 0.9);
    };
    lab('mustard oil', 90, 130, CX - 30, levelY(V_W + V_O / 2), this._gold(c));
    lab('water', 70, 210, CX - 80, levelY(V_W * 0.55), c.water);
    lab('stopcock', 86, 306, CX - 40, TAP_Y);
  }

  _side(ctx, c) {
    const { x, w } = PANEL;
    if (this._drainOn) {
      const r = this._reading(c);
      drawCard(ctx, c, x, 124, w, 118, 1, { accent: c.accent });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(18));
      ctx.fillText(r.k, x + w / 2, 152);
      ctx.fillStyle = c.label; ctx.font = font(c, 700, 34, true);
      ctx.fillText(r.v, x + w / 2, 200);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const m = this._message(c);
      if (m) pill(ctx, c, m.t, x + w / 2, 284, { bg: m.bg, size: fs(m.t.length > 18 ? 18 : 20), display: true });
      const hint = this._hint();
      if (hint) pill(ctx, c, hint, x + w / 2, 340, { bg: c.accent, size: fs(hint.length > 17 ? 17 : 19), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
      return;
    }
    if (this.stage === S_WORDS) {
      const mi = PAIRS[this._pair].kind === 'mi';
      pill(ctx, c, mi ? 'miscible' : 'immiscible', x + w / 2, 170, { bg: mi ? c.good : c.warning, size: 26, display: true });
      pill(ctx, c, mi ? 'one liquid' : 'two layers', x + w / 2, 230, { bg: c.raised, size: fs(20), display: true });
      return;
    }
    const same = this._dens === 'same';
    pill(ctx, c, same ? 'no lower layer' : 'a lower layer', x + w / 2, 170, { bg: same ? c.warning : c.good, size: fs(22), display: true });
    pill(ctx, c, same ? 'nothing sinks' : 'denser sinks', x + w / 2, 230, { bg: c.raised, size: fs(20), display: true });
  }

  _reading(c) {
    if (this._phase === 'done') return { k: 'in the clean flask', v: `${Math.round(this._C.o)} mL oil` };
    if (this._under === 'C') return { k: 'in the clean flask', v: `${this._C.o.toFixed(0)} mL oil` };
    if (this._under === 'B') return { k: 'mixed portion', v: 'a few drops' };
    const wv = Math.floor(this._A.w + 0.5);
    return { k: 'in the flask', v: this._A.o > 0.15 ? `${wv} mL + oil` : `${wv} mL water` };
  }

  _message(c) {
    if (this._bad) return { t: 'oil in the water flask', bg: c.bad };
    if (this._stalled && this._in) return { t: 'no air can get in', bg: c.warning };
    if (this._phase === 'done') return { t: 'two separate liquids', bg: c.good };
    if (this.stage === S_STOP && this._shutOk && this._phase === '') return { t: 'good stop', bg: c.good };
    if (this._open && this._w > 0) return { t: 'water leaves first', bg: c.raised };
    return null;
  }

  _hint() {
    if (this.stage === S_FIRST && !this._open && this._w === V_W) return 'open the stopcock';
    if (this.stage === S_STOPPER && !this._open && this._leak === 0) return 'open the stopcock';
    if (this.stage === S_STOPPER && this._stalled) return 'take out the stopper';
    if (this.stage === S_STOP && !this._shutOk && !this._bad && this._phase === '') return this._open ? (PHONE ? 'shut near the line' : 'shut it near the line') : (PHONE ? 'open, then shut' : 'open, then shut near the line');
    if (this.stage === S_STOP && this._shutOk && this._phase === '') return 'collect the mixed drops';
    if (this.stage === S_STOP && this._phase === 'mixed-done') return 'now collect the oil';
    if (this.stage === S_STOP && this._bad && !this._open) return 'start again';
    return '';
  }

  /* ------------------------------------------------------------------- input */

  _tap(open) {
    if (!this._drainOn || this._w + this._o <= 0) return;
    if (this._phase === 'mixed' || this._phase === 'oil') return;
    if (this.stage === S_STOP && (this._shutOk || this._phase)) return;
    if (open) {
      if (reducedMotion() && this.stage === S_FIRST) { this._A.w = this._w; this._w = 0; this._open = false; return; }
      this._open = true;
      return;
    }
    const was = this._open;
    this._open = false;
    if (was && this.stage === S_STOP && !this._bad && this._w >= WINDOW[0] && this._w <= WINDOW[1]) {
      this._shutOk = true;
      this.celebrate(CX, levelY(this._w), 22, { key: 'good-stop', lookAt: true });
    }
  }

  _stopper(v) {
    const out = v === 'out';
    if (out === !this._in) return;
    this._in = !out;
    if (out && this._stalled && !this._freed) {
      this._freed = true;
      this._stalled = false;
      this.celebrate(CX, 70, 18, { key: 'air-gets-in', lookAt: true });
    } else this._stalled = false;
  }

  _mixedDrops() {
    if (!this._shutOk || this._phase) return;
    this._under = 'B';
    this._phase = 'mixed';
    this.after(0.5, () => { this._open = true; });
  }

  _oilRun() {
    if (this._phase !== 'mixed-done') return;
    this._under = 'C';
    this._phase = 'oil';
    this.after(0.5, () => { this._open = true; });
  }

  pointerDown(p) {
    if (this._drainOn && Math.abs(p.x - CX) < 60 && Math.abs(p.y - TAP_Y) < 30) this._tap(!this._open);
    if (this.stage === S_STOPPER && !this._setup && Math.abs(p.x - CX) < 50 && p.y < 90) this._stopper(this._in ? 'out' : 'in');
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'stopcock') this._tap(String(v) === 'open');
    else if (id === 'stopper') this._stopper(String(v));
    else if (id === 'mixed') this._mixedDrops();
    else if (id === 'oil') this._oilRun();
    else if (id === 'pair') this._pair = String(v);
    else if (id === 'dens') this._dens = String(v);
    else if (id === 'again') this._state(this.stage);
    this.requestUiUpdate?.();
  }

  getControlValue(id) {
    if (id === 'stopcock') return this._open ? 'open' : 'shut';
    if (id === 'stopper') return this._in ? 'in' : 'out';
    if (id === 'pair') return this._pair;
    if (id === 'dens') return this._dens;
    return super.getControlValue(id);
  }

  isControlHidden(id) {
    if (this._setup) return true;
    const s = this.stage;
    if (id === 'stopcock') return s > S_STOP;
    if (id === 'stopper') return s !== S_STOPPER;
    if (id === 'mixed' || id === 'oil') return s !== S_STOP;
    if (id === 'pair') return s !== S_WORDS;
    if (id === 'dens') return s !== S_SAME;
    return s > S_STOP;
  }

  isControlDisabled(id) {
    if (id === 'stopcock') return this._w + this._o <= 0 || this._phase !== '' || (this.stage === S_STOP && this._shutOk);
    if (id === 'mixed') return !this._shutOk || this._phase !== '';
    if (id === 'oil') return this._phase !== 'mixed-done';
    return false;
  }
}
