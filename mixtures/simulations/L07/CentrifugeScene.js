// CentrifugeScene - blk-l07-s02. Muddy water in a bench centrifuge.
//   stage 0  side view, front cut away: the learner turns the speed up, the tubes lie down, the mud goes to the far end.
//   stage 1  the same rotor from above: an outward arrow on each tube grows with the speed, mud moves away from the centre.
//   stage 2  the run is over: the learner takes a tube out, and its two layers are named.
//   stage 3  two tubes, full speed and half speed, run together: same layers, four times the wait.
// The push goes as the speed squared. Run times are sped up; the minutes shown for the race are model numbers.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, chipRow, clamp, darken, drawBackdrop, drawCard, drawFloor, drawVignette, font, leader, lighten, mix, mulberry32, outBack, pill, rr,
} from 'simulations/base/kit/SimLook.js';
import { glassPath } from 'simulations/base/kit/SimGlass.js';
import { clamp01, drawBenchTop, drawCentrifuge, drawSampleTube, paintSpun } from './CentrifugeBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;

const T_STOP = 14;                   // seconds, then the machine stops itself
const T_FULL = 3;                    // seconds of the whole separation at full speed (sped up)
const SWING_K = 6, SWING_TAU = 0.45, ROT_TAU = 0.3, LID_TAU = 0.18;
const RPM_MAX = 4000;
const CAKE = 0.3, CLEAR = 0.7;
const CX = 238, BASE = 410;
const MACHINE = { w: 410, h: 268, arm: 50, bucketW: 42, bucketH: 124, lidRise: 66 };
const BIG = { x: 544, y: 96, w: 76, h: 300 };
const TOP = { x: 340, y: 262, r: 212, hub: 40, arm: 56, tw: 62, th: 150 };

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);

const list = (n, seed) => {
  const rnd = mulberry32(seed);
  const a = Array.from({ length: n }, () => ({ home: rnd(), s: rnd(), t: rnd() }));
  [...a].sort((x, y) => x.home - y.home).forEach((sp, i) => { sp.rank = i; });
  return a;
};
const SPECKS = list(44, 11), SPECKS_BIG = list(120, 23);

const mudOf = (c) => mix(darken(c.gold, 0.5), c.flame, 0.12);
const cloudy = (c) => mix(c.water, mudOf(c), 0.62);
const cakeTone = (c) => darken(mudOf(c), 0.14);
const clearTone = (c) => mix(c.water, lighten(c.glass, 0.55), 0.6);
const spun = (c, p, soft) => (ctx, col) => paintSpun(ctx, {
  ...col, u: p, mixed: cloudy(c), soft, top: [{ frac: CLEAR, col: clearTone(c) }], bottom: [{ frac: CAKE, col: cakeTone(c) }],
});

export class CentrifugeScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A bench centrifuge with its front cut away holds two balanced tubes of muddy water. As the speed goes up the tubes swing out until they lie on their sides, and the mud moves along each tube to its far end, which is the bottom of the tube. Seen from above, an outward force on each tube grows with the speed. Taken out, a tube shows packed mud at the bottom and clearer water on top. A tube at half speed ends with the same layers but takes four times as long.';
  static CONTROLS = [
    { type: 'slider', id: 'speed', label: 'Spin speed', min: 0, max: 100, step: 5, value: 0, suffix: ' %' },
    { type: 'button', id: 'lift', label: 'Take out a tube' },
    { type: 'button', id: 'race', label: 'Run both tubes' },
    { type: 'button', id: 'reset', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._speed = 0; this._held = 0; this._rest = 0; this._rot = 0; this._phase = 0; this._p = 0; this._swing = 0; this._lid = 1;
    this._lift = 0; this._lifting = false; this._found = false;
    this._race = null; this._rp = [0, 0]; this._rt = 0; this._spins = 0;
  }

  enter(stage) {
    this._fresh();
    if (stage === 2) this._p = 1;
    this.requestUiUpdate?.();
  }

  get _force() { return (this._rot / 100) ** 2; }

  isControlHidden(id) {
    if (id === 'speed') return this.stage > 1;
    if (id === 'lift') return this.stage !== 2;
    if (id === 'race') return this.stage !== 3;
    return this.stage === 2;
  }
  isControlDisabled(id) {
    if (id === 'lift') return this._lift > 0 || this._lifting;
    if (id === 'race') return !!this._race || this._rp[1] >= 1;
    return false;
  }
  getControlValue(id) { return id === 'speed' ? String(this._speed) : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'speed') {
      // A drag arrives in small steps, so compare with the speed the learner last rested on.
      if (this._held >= 0.4) this._rest = this._speed;
      this._held = 0;
      this._speed = clamp(Number(v), 0, 100);
      // the find: the learner turned the speed up and watched the outward arrow grow
      if (this.stage === 1 && this._rest >= 30 && this._speed >= 2 * this._rest && !this._found) {
        this._found = true;
        this.celebrate(TOP.x, TOP.y - TOP.r + 50, 18, { key: 'outward-force', small: true });
      }
    }
    else if (id === 'reset') { const st = this.stage; this._fresh(); if (st === 2) this._p = 1; } else if (id === 'lift') this._lifting = true;
    else if (id === 'race') { this._race = { t: 0 }; this._rp = [0, 0]; this._rt = 0; }
    this.animateFor(600);
    this.requestUiUpdate?.();
  }

  update(d) {
    const ease = (v, to, tau) => (Math.abs(to - v) < 1e-3 ? to : v + (to - v) * (1 - Math.exp(-d / tau)));
    this._rot = ease(this._rot, this._speed, ROT_TAU);
    if (this._speed === 0 && this._rot < 0.5) this._rot = 0;
    this._phase += (this._rot / 100) * (this.stage === 1 ? 2.4 : 14) * d;
    this._swing = ease(this._swing, this._rot > 0 ? 1 - Math.exp(-this._rot / SWING_K) : 0, SWING_TAU);
    this._lid = ease(this._lid, this._speed > 0 || this._rot > 1 ? 0 : 1, LID_TAU);
    if (this._speed > 0) {                       // every run ends: the machine stops itself
      this._held += d;
      if (this._held >= T_STOP) { this._speed = 0; this._held = 0; this.requestUiUpdate?.(); }
    }
    if (this._p < 1 && this.stage < 2) {
      this._p = Math.min(1, this._p + (this._force * d) / T_FULL);
    }
    if (this._lifting) {
      this._lift = Math.min(1, this._lift + d / 0.7);
      if (this._lift >= 1) { this._lifting = false; this.requestUiUpdate?.(); }
    }
    if (this._race) {
      this._race.t += d;
      this._rt = this._race.t;
      this._rp = [clamp01(this._rt / 2), clamp01(this._rt / 8)];
      if (this._rp[1] >= 1) { this._race = null; this.requestUiUpdate?.(); }
    }
  }

  busy() {
    return this._rot > 0 || this._speed > 0 && this._p < 1 || this._lifting || !!this._race
      || Math.abs(this._swing) > 1e-3 || this._lid < 1 - 1e-3;
  }

  draw(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BASE + 58);
    if (this.stage === 0) this._side(ctx, c, t);
    else if (this.stage === 1) this._above(ctx, c, t);
    else if (this.stage === 2) this._layers(ctx, c, t);
    else this._two(ctx, c);
    drawVignette(ctx, c, 0.4);
  }

  // ---- the side view -----------------------------------------------------------------------------
  _bench(ctx, c) { drawBenchTop(ctx, c, { x0: 20, x1: 660, y: BASE }); }

  _machine(ctx, c, p) {
    const m = drawCentrifuge(ctx, c, {
      cx: CX, base: BASE, ...MACHINE, lid: this._lid, swing: this._swing, spin: this._phase, omega: this._rot / 100,
      rpm: Math.round((this._rot / 100) * RPM_MAX / 50) * 50,
      tube: (cx2, i, box) => {
        const g = drawSampleTube(cx2, c, { ...box, fill: 0.86, surface: clearTone(c), paint: spun(c, p, 0.05) });
        this._specks(cx2, c, g, SPECKS, 2.2, p);
      },
    });
    return m;
  }

  _specks(ctx, c, t, set, rad, p) {
    ctx.save();
    glassPath(ctx, t.g, t.g.inner);
    ctx.clip();
    const box = t.col;
    ctx.fillStyle = darken(mudOf(c), 0.2);
    for (const sp of set) {
      const a = clamp01((p - sp.home * 0.45) / 0.55);
      const e = a * a * (3 - 2 * a);
      const f = sp.home + (CAKE * ((sp.rank + 0.5) / set.length) - sp.home) * e;
      ctx.beginPath();
      ctx.arc(box.x + box.w * (0.16 + 0.68 * sp.t), box.y + 3 + (box.h - 6) * (1 - f), rad, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  _bigTube(ctx, c, p, x = BIG.x, y = BIG.y, w = BIG.w, h = BIG.h) {
    const t = drawSampleTube(ctx, c, { x, y, w, h, fill: 0.86, surface: clearTone(c), paint: spun(c, p, 0.04), shadow: true });
    this._specks(ctx, c, t, SPECKS_BIG, 3, p);
    return t;
  }

  _side(ctx, c) {
    this._bench(ctx, c);
    this._machine(ctx, c, this._p);
    this._bigTube(ctx, c, this._p);
    const tag = { bg: c.raised, ink: c.label, size: fs(17), display: true };
    pill(ctx, c, 'rotor', CX, fs(36), tag);
    pill(ctx, c, 'the tube', BIG.x + BIG.w / 2, fs(36), tag);
    if (this._p >= 1) pill(ctx, c, 'far end = bottom', 340, 484, { bg: c.good, size: fs(19), display: true });
    else if (this._speed === 0) pill(ctx, c, 'move the speed slider', 340, 484, { bg: c.accent, size: fs(17), display: true });
  }

  // ---- from above --------------------------------------------------------------------------------
  _above(ctx, c) {
    const T = TOP, f = this._force;
    // the bowl
    ctx.beginPath(); ctx.arc(T.x, T.y, T.r + 14, 0, TAU);
    ctx.fillStyle = mix(c.raised, c.stroke, 0.35); ctx.fill();
    ctx.strokeStyle = darken(mix(c.raised, c.stroke, 0.35), 0.4); ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(T.x, T.y, T.r, 0, TAU);
    ctx.fillStyle = darken(mix(c.stroke, c.bgDeep, 0.5), 0.3); ctx.fill();
    if (this._rot > 2) {
      ctx.strokeStyle = alpha(c.glass, 0.25); ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const a = -this._phase * 1 + i * TAU / 3;
        ctx.beginPath(); ctx.arc(T.x, T.y, T.r - 12, a, a + 0.8); ctx.stroke();
      }
    }
    const th = this._phase + 0.5;
    for (const k of [0, 1]) {
      ctx.save();
      ctx.translate(T.x, T.y);
      ctx.rotate(th + k * Math.PI);
      ctx.fillStyle = lighten(c.stroke, 0.3);
      rr(ctx, -13, -13, T.arm + 26, 26, 12); ctx.fill();
      // the tube points away from the centre: mouth at the arm, bottom at the far end
      ctx.rotate(-Math.PI / 2);
      const t = drawSampleTube(ctx, c, { x: -T.tw / 2, y: T.arm - 8, w: T.tw, h: T.th, fill: 0.86, surface: clearTone(c), paint: spun(c, this._p, 0.05), cap: false });
      this._specks(ctx, c, t, SPECKS, 3, this._p);
      if (f > 0.01) {
        // the outward force, beside the tube. Its length is the push.
        const L = 26 + 96 * f, x = T.tw / 2 + 22, y0 = T.arm + 6;
        ctx.strokeStyle = c.warning; ctx.fillStyle = c.warning; ctx.lineWidth = 11; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + L); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 17, y0 + L); ctx.lineTo(x + 17, y0 + L); ctx.lineTo(x, y0 + L + 24); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(T.x, T.y, T.hub, 0, TAU);
    ctx.fillStyle = c.raised; ctx.fill();
    ctx.strokeStyle = darken(c.stroke, 0.1); ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = c.label; ctx.font = font(c, 700, PHONE ? 20 : 17, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('centre', T.x, T.y + 1);
    pill(ctx, c, 'seen from above', 120, 34, { bg: c.raised, ink: c.label, size: fs(16), display: true });
    if (f > 0.01) pill(ctx, c, 'outward force', 570, 34, { bg: c.warning, size: fs(17), display: true });
    else pill(ctx, c, 'move the speed slider', 340, 496, { bg: c.accent, size: fs(16), display: true });
  }

  // ---- the two layers ----------------------------------------------------------------------------
  _layers(ctx, c) {
    this._bench(ctx, c);
    const u = outBack(this._lift);
    const L = this._lift;
    this._machine(ctx, c, 1);
    // the tube leaves the machine and stands in front of everything, big
    if (L > 0) {
      const x = 118 + ((PHONE ? 340 : 424) - 118) * L, y = 300 + (76 - 300) * L, w = 40 + 62 * u, h = 124 + 212 * u;
      const a = clamp01(L * 3);
      ctx.save(); ctx.globalAlpha = a;
      this._bigTube(ctx, c, 1, x, y, w, h);
      ctx.restore();
      if (L >= 1) {
        const col = alpha(c.labelMuted, 0.9), lx = x + w + 18;
        leader(ctx, lx + 6, 170, x + w - 6, 170, col, 1, 0);
        leader(ctx, lx + 6, 356, x + w - 6, 356, col, 1, 0);
        pill(ctx, c, 'clearer water', lx + (PHONE ? 2 : 6), 170, { bg: c.raised, ink: c.label, size: fs(17), display: true, align: 'left' });
        pill(ctx, c, 'packed mud', lx + (PHONE ? 2 : 6), 356, { bg: c.raised, ink: c.label, size: fs(17), display: true, align: 'left' });
      }
    }
    chipRow(ctx, c, [
      { text: 'in a jar: days', bg: c.raised, ink: c.label },
      { text: 'in a centrifuge: minutes', bg: c.good },
    ], 340, 484, { align: 'center', size: fs(18), display: true });
  }

  // ---- full speed and half speed -----------------------------------------------------------------
  _two(ctx, c) {
    this._bench(ctx, c);
    const X = [176, 408], names = ['full speed', 'half speed'], mins = [5, 20];
    X.forEach((x, i) => {
      const p = this._rp[i];
      drawCard(ctx, c, x - 46, 12, 188, 76, 1, {});
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(16));
      ctx.fillText(names[i], x + 48, 32);
      const shown = Math.round(Math.min(this._rt * 2.5, mins[i]));
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(30), true);
      ctx.fillText(`${shown} min`, x + 48, 62);
      this._bigTube(ctx, c, p, x + 6, 124, 84, 282);
    });
    if (this._rp[1] >= 1) pill(ctx, c, 'same two layers', 340, 484, { bg: c.good, size: fs(19), display: true });
  }
}
