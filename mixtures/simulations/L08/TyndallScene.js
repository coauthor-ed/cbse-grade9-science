// TyndallScene - blk-l08-s03. Five beats, one big scene each.
//   0  a dark bench: the laser passes through beakers A, B and C. No path in A; a bright line in B and C
//   1  close up in the beam: particles scatter light, some of it towards your eye. The learner picks the mixture
//   2  a dark room: a thin beam through a hole. The learner sets the dust; with none, the beam cannot be seen
//   3  a stadium at night: the same idea with floodlights and haze
//   4  a city: more smoke and dust, paler distant buildings
// Beats 0-3 are night or dark in both themes, because the subject needs it (Quill card, rule 5). The laser is not to scale.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, darken, drawBench, drawVignette, lighten, mix, mulberry32, pill, rr, inkOn,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawIcon } from 'simulations/base/kit/SimIcons.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;
const MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);

const MOTES = (() => {
  const rnd = mulberry32(5);
  return Array.from({ length: 120 }, () => ({ u: rnd(), v: rnd(), k: rnd(), a: rnd() * TAU }));
})();
const night = (c) => mix(darken(c.stroke, 0.72), c.s5, 0.06);
const laser = (c) => c.proton;
const CLOSE = { salt: { n: 0, r: 0, name: 'salt solution' }, chalk: { n: 9, r: 34, name: 'chalk in water' }, milk: { n: 90, r: 7, name: 'milk' } };

export class TyndallScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A laser beam passes through salt solution, where its path cannot be seen, and through chalk in water and milk, where a bright line shows. Close up, particles spread the light and some reaches the eye. A beam in a dark room shows only when dust is in the air, floodlights in a stadium show cones in hazy air, and a city looks pale in smoky air.';
  static CONTROLS = [
    { type: 'button', id: 'laser', label: 'Switch on the laser' },
    { type: 'segmented', id: 'close', label: 'Look inside', value: 'milk', options: Object.entries(CLOSE).map(([value, s]) => ({ value, label: s.name })) },
    { type: 'slider', id: 'dust', label: 'Dust in the air', min: 0, max: 100, step: 5, value: 0, suffix: ' %' },
    { type: 'slider', id: 'haze', label: 'Haze in the air', min: 0, max: 100, step: 5, value: 0, suffix: ' %' },
    { type: 'slider', id: 'smoke', label: 'Smoke and dust', min: 0, max: 100, step: 5, value: 0, suffix: ' %' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() { this._on = false; this._close = 'milk'; this._dust = 0; this._haze = 0; this._smoke = 0; this._seen = new Set(); this._saw = new Set(); }

  enter() { this._fresh(); this.requestUiUpdate?.(); }

  isControlHidden(id) {
    const st = this.stage;
    return { laser: st !== 0, close: st !== 1, dust: st !== 2, haze: st !== 3, smoke: st !== 4 }[id] ?? false;
  }
  isControlDisabled(id) { return id === 'laser' ? this._on : false; }
  getControlValue(id) {
    if (id === 'close') return this._close;
    if (id === 'dust') return String(this._dust);
    if (id === 'haze') return String(this._haze);
    if (id === 'smoke') return String(this._smoke);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'laser') { this._on = true; this._find(510, 250, 'milk-beam'); } else if (id === 'close') { this._close = v; this._saw.add(v); if (this._saw.size >= 2) this._find(340, 210, 'scatter'); } else if (id === 'dust') {
      this._dust = Number(v);
      if (this._dust >= 60) this._saw.add('dust');
      if (this._dust === 0 && this._saw.has('dust')) this._find(340, 240, 'no-dust-no-beam');
    } else if (id === 'haze') { this._haze = Number(v); if (this._haze >= 70) this._find(240, 200, 'cones'); } else if (id === 'smoke') { this._smoke = Number(v); if (this._smoke >= 70) this._find(340, 260, 'hazy-city'); }
    this.animateFor(500);
    this.requestUiUpdate?.();
  }

  _find(x, y, key) {
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this.celebrate(x, y, 18, { key, small: true });
  }

  draw(ctx, c, t) {
    const st = this.stage;
    if (st === 4) this._city(ctx, c);
    else {
      ctx.fillStyle = night(c); ctx.fillRect(0, 0, 680, 520);
      if (st === 0) this._bench(ctx, c);
      else if (st === 1) this._closeUp(ctx, c);
      else if (st === 2) this._room(ctx, c, t);
      else this._stadium(ctx, c);
    }
    drawVignette(ctx, c, 0.4);
  }

  // ---- beat 0 --------------------------------------------------------------------------------------
  _bench(ctx, c) {
    const y = 396, X = [130, 322, 514], W = 158, H = 240;
    const ground = mix(night(c), c.stroke, 0.2);
    ctx.fillStyle = ground; ctx.fillRect(0, y + 58, 680, 70);
    drawBench(ctx, c, 12, 668, y, { h: 58 });
    const by = y - 110;
    // the pointer
    ctx.fillStyle = mix(c.stroke, c.label, 0.2);
    rr(ctx, 18, by - 13, 88, 26, 8); ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.label, 0.45); rr(ctx, 96, by - 8, 14, 16, 3); ctx.fill();
    const col = laser(c);
    const fills = [{ f: mix(c.water, c.glass, 0.5), a: 0.42 }, { f: mix(c.water, lighten(c.glass, 0.6), 0.5), a: 0.6 }, { f: lighten(c.glass, 0.86), a: 0.97 }];
    X.forEach((x, i) => {
      const g = glassBox('beaker', x, y - H, W, H);
      drawGlass(ctx, c, g);
      drawGlassLiquid(ctx, c, g, { level: 0.76, fill: fills[i].f, opacity: fills[i].a });
      if (i === 1) {
        ctx.fillStyle = lighten(c.glass, 0.7);
        MOTES.slice(0, 40).forEach((m) => { ctx.beginPath(); ctx.arc(x + 14 + m.u * (W - 28), y - 14 - m.v * (H * 0.66), 3.2, 0, TAU); ctx.fill(); });
      }
      if (this._on && i > 0) {
        const x0 = x + 6, x1 = x + W - 6;
        ctx.strokeStyle = alpha(col, 0.28); ctx.lineWidth = 18; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(x0, by); ctx.lineTo(x1, by); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(x0, by); ctx.lineTo(x1, by); ctx.stroke();
      }
      drawGlassFront(ctx, c, g);
      const names = ['A', 'B', 'C'], full = ['A salt', 'B chalk', 'C milk'];
      pill(ctx, c, PHONE ? names[i] : full[i], x + W / 2, y + 34, { bg: c.raised, ink: c.label, size: PHONE ? 24 : 17, display: true });
      if (this._on) pill(ctx, c, i ? 'path seen' : 'no path', x + W / 2, fs(52), { bg: i ? c.warning : c.raised, ink: i ? undefined : c.label, size: PHONE ? 23 : 18, display: true });
    });
    if (this._on) {
      // the beam leaves the far side: a small spot on the wall
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(676, by, 6, 0, TAU); ctx.fill();
    }
  }

  // ---- beat 1 --------------------------------------------------------------------------------------
  _closeUp(ctx, c) {
    const s = CLOSE[this._close], col = laser(c), by = 150;
    ctx.strokeStyle = alpha(col, 0.22); ctx.lineWidth = 64; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(680, by); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(680, by); ctx.stroke();
    const eye = { x: 340, y: 430 };
    const tone = lighten(c.glass, 0.82);
    for (let i = 0; i < s.n; i += 1) {
      const m = MOTES[i];
      const x = 30 + m.u * 620, y = by - 26 + m.v * 52;
      ctx.strokeStyle = alpha(col, s.r > 20 ? 0.75 : 0.32); ctx.lineWidth = s.r > 20 ? 5 : 3; ctx.lineCap = 'round';
      const rays = s.r > 20 ? 7 : 3;
      for (let k = 0; k < rays; k += 1) {
        const a = m.a + k * TAU / rays, L = s.r + 34 + (i % 3) * 16;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s.r, y + Math.sin(a) * s.r); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
      }
      // one ray to the eye from some of them
      if (i % (s.r > 20 ? 2 : 6) === 0) {
        ctx.strokeStyle = alpha(col, 0.7); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y + s.r); ctx.lineTo(eye.x + (x - 340) * 0.08, eye.y - 40); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, TAU); ctx.fillStyle = tone; ctx.fill();
      ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 2; ctx.stroke();
    }
    drawIcon(ctx, c, 'eye', eye.x, eye.y, 44, { color: lighten(c.glass, 0.7) });
    pill(ctx, c, s.n ? 'scattered' : 'nothing to scatter it', 340, 40, { bg: s.n ? c.warning : c.raised, ink: s.n ? undefined : c.label, size: fs(20), display: true });
    pill(ctx, c, s.name, 120, 476, { bg: c.raised, ink: c.label, size: fs(17), display: true });
    if (s.n) pill(ctx, c, 'Tyndall effect', 556, 476, { bg: c.good, size: fs(19), display: true });
  }

  // ---- beat 2 --------------------------------------------------------------------------------------
  _room(ctx, c, t) {
    const k = this._dust / 100;
    const wall = mix(night(c), c.waste, 0.12);
    ctx.fillStyle = wall; ctx.fillRect(0, 0, 680, 520);
    ctx.fillStyle = mix(night(c), c.gold, 0.1); ctx.fillRect(0, 430, 680, 90);
    // the shutter and its hole
    const hx = 38, hy = 86, ex = 540, ey = 442;
    ctx.fillStyle = darken(c.gold, 0.6); rr(ctx, 0, 30, 46, 300, 6); ctx.fill();
    ctx.fillStyle = lighten(c.gold, 0.6); ctx.beginPath(); ctx.arc(hx, hy, 11, 0, TAU); ctx.fill();
    // the lit patch on the floor always shows: the light does arrive
    ctx.fillStyle = lighten(c.gold, 0.45); ctx.beginPath(); ctx.ellipse(ex, ey, 54, 13, 0, 0, TAU); ctx.fill();
    if (k > 0) {
      const a = 0.12 + 0.62 * k;
      ctx.beginPath(); ctx.moveTo(hx, hy - 10); ctx.lineTo(ex + 50, ey - 2); ctx.lineTo(ex - 50, ey + 2); ctx.lineTo(hx, hy + 10); ctx.closePath();
      ctx.fillStyle = alpha(lighten(c.gold, 0.5), a); ctx.fill();
      const n = Math.round(90 * k);
      ctx.fillStyle = lighten(c.gold, 0.75);
      for (let i = 0; i < n; i += 1) {
        const m = MOTES[i], u = m.u, x = hx + (ex - hx) * u, y = hy + (ey - hy) * u + (m.v - 0.5) * (20 + 80 * u) + Math.sin(t * 0.6 + m.a) * 2;
        ctx.beginPath(); ctx.arc(x, y, 2 + m.k * 2.4, 0, TAU); ctx.fill();
      }
    }
    pill(ctx, c, this._dust ? 'dust scatters the light' : 'no dust: no path seen', 340, 40, { bg: this._dust ? c.warning : c.raised, ink: this._dust ? undefined : c.label, size: fs(19), display: true });
    pill(ctx, c, 'small hole', 118, 150, { bg: c.raised, ink: c.label, size: fs(16), display: true });
  }

  // ---- beat 3 --------------------------------------------------------------------------------------
  _stadium(ctx, c) {
    const k = this._haze / 100;
    const turf = mix(c.good, night(c), 0.34);
    ctx.fillStyle = mix(night(c), c.stroke, 0.14); ctx.fillRect(0, 300, 680, 70);
    // stands: rows of the crowd
    const rnd = mulberry32(9);
    for (let r = 0; r < 4; r += 1) {
      for (let x = 6; x < 680; x += 14) {
        ctx.fillStyle = mix(night(c), [c.s1, c.s4, c.s2, c.s3][Math.floor(rnd() * 4)], 0.28);
        ctx.beginPath(); ctx.arc(x + (r % 2) * 6, 312 + r * 15, 5, 0, TAU); ctx.fill();
      }
    }
    ctx.fillStyle = turf; ctx.fillRect(0, 370, 680, 150);
    ctx.strokeStyle = alpha(lighten(c.glass, 0.8), 0.8); ctx.lineWidth = 4;
    ctx.strokeRect(70, 400, 540, 200);
    ctx.beginPath(); ctx.moveTo(340, 400); ctx.lineTo(340, 520); ctx.stroke();
    // lit pitch: it is lit at any haze
    ctx.fillStyle = alpha(lighten(c.gold, 0.6), 0.22); ctx.fillRect(0, 370, 680, 150);
    for (const x of [112, 568]) {
      ctx.fillStyle = mix(c.stroke, night(c), 0.3); rr(ctx, x - 7, 92, 14, 240, 4); ctx.fill();
      ctx.fillStyle = mix(c.stroke, c.label, 0.2); rr(ctx, x - 52, 62, 104, 34, 6); ctx.fill();
      ctx.fillStyle = lighten(c.gold, 0.65);
      for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(x - 39 + i * 26, 79, 9, 0, TAU); ctx.fill(); }
      if (k > 0) {
        const to = x < 340 ? 300 : 380;
        ctx.beginPath(); ctx.moveTo(x - 46, 92); ctx.lineTo(x + 46, 92); ctx.lineTo(to + 120, 470); ctx.lineTo(to - 120, 470); ctx.closePath();
        const g = ctx.createLinearGradient(0, 92, 0, 470);
        g.addColorStop(0, alpha(lighten(c.gold, 0.6), 0.1 + 0.55 * k)); g.addColorStop(1, alpha(lighten(c.gold, 0.6), 0.03 + 0.1 * k));
        ctx.fillStyle = g; ctx.fill();
      }
    }
    pill(ctx, c, k ? 'haze scatters the light' : 'clear air: no cones', 340, 34, { bg: k ? c.warning : c.raised, ink: k ? undefined : c.label, size: fs(19), display: true });
  }

  // ---- beat 4 --------------------------------------------------------------------------------------
  _city(ctx, c) {
    const k = this._smoke / 100;
    const sky = mix(c.water, lighten(c.glass, 0.7), 0.55), haze = mix(lighten(c.gold, 0.55), c.waste, 0.35);
    ctx.fillStyle = mix(sky, haze, k * 0.9); ctx.fillRect(0, 0, 680, 520);
    // the sun, weaker through haze
    ctx.fillStyle = alpha(lighten(c.gold, 0.5), 1 - 0.65 * k); ctx.beginPath(); ctx.arc(560, 84, 40, 0, TAU); ctx.fill();
    // a cloud: drops in air, a colloid
    ctx.fillStyle = alpha(lighten(c.glass, 0.9), 1 - 0.5 * k);
    for (const [x, y, r] of [[120, 92, 34], [162, 76, 44], [212, 88, 36], [160, 104, 40]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    // three rows of buildings; far rows fade most
    const rows = [
      { y: 330, tone: mix(c.s5, c.waste, 0.5), fade: 0.92, w: 52, seed: 2, h: 120 },
      { y: 390, tone: mix(c.s1, c.waste, 0.65), fade: 0.68, w: 66, seed: 4, h: 150 },
      { y: 470, tone: darken(c.waste, 0.3), fade: 0.3, w: 84, seed: 6, h: 170 },
    ];
    for (const R of rows) {
      const rnd = mulberry32(R.seed), col = mix(R.tone, mix(sky, haze, k * 0.9), R.fade * k);
      for (let x = -10; x < 690; x += R.w + 4) {
        const h = R.h * (0.55 + rnd() * 0.45);
        rr(ctx, x, R.y - h, R.w, h + 60, 5);
        ctx.fillStyle = col; ctx.fill();
      }
    }
    ctx.fillStyle = darken(c.waste, 0.45); ctx.fillRect(0, 470, 680, 50);
    pill(ctx, c, this._smoke >= 40 ? 'scattered light: a pale, hazy city' : 'clear air', 300, 34, { bg: this._smoke >= 40 ? c.warning : c.raised, ink: this._smoke >= 40 ? inkOn(c, c.warning) : c.label, size: fs(18), display: true });
    pill(ctx, c, 'cloud: a colloid', 164, 156, { bg: c.raised, ink: c.label, size: fs(16), display: true });
  }
}
