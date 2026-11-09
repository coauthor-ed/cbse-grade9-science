// LockedIonsScene - companion to blk-l09-s4, "Charges That Cannot Move".
//   b0  dark   the bulb test of lesson 1 with dry salt crystals: close the switch, the bulb stays dark
//   b1  fixed  a slice of the crystal: pull an ion and let go. It stretches a little and springs back,
//              because its neighbours hold it
//   b2  melt   raise the temperature: the ions shake harder, a kadhai at 180 C is far too cool, and
//              only at 801 C does the crystal come apart
// The melted salt is not wired to a bulb here: that is the next lesson.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, drawBackdrop, drawBench, drawCard, drawFloor, lerp, mix, mulberry32, rr } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawIon } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, drawRig, popIn, say, tag, snow } from '../L10/IonBenchKit.js';

const S_DARK = 0, S_FIXED = 1, S_MELT = 2;
const BENCH = 442;
const COLS = 6, ROWS = 4, SP = 80, R_NA = 25, R_CL = 34;
const MELT = 801, ROOM = 25;
const LEVER_S = 0.25, MELT_S = 1.3, SHAKE_S = 1;
const PULL_MAX = 26;

const IONS = [];
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const r = mulberry32(i * 31 + j * 97 + 5);
  const na = (i + j) % 2 === 0;
  IONS.push({ i, j, na, sx: (i - (COLS - 1) / 2) * SP, sy: (j - (ROWS - 1) / 2) * SP, ang: r() * 6.28, ph: r() * 6.28, fx: (r() - 0.5) * 2, fy: (r() - 0.5) * 2, rr: na ? R_NA : R_CL });
}
// Melted: every ion has a new place in a loose, shuffled crowd, so no ion keeps its neighbours.
const LOOSE = [];
{
  const r = mulberry32(12), used = IONS.map((_, i) => i);
  for (let i = used.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [used[i], used[k]] = [used[k], used[i]]; }
  IONS.forEach((o, i) => {
    o.n = i;
    const u = used[i], col = u % COLS, row = Math.floor(u / COLS);
    LOOSE.push({ x: (col - (COLS - 1) / 2) * 68 + (r() - 0.5) * 18, y: (row - (ROWS - 1) / 2) * 76 + (r() - 0.5) * 18 + (col % 2 ? 14 : -14) });
  });
}
const GRAINS = [];
{
  const r = mulberry32(21);
  for (let row = 0; row < 5; row++) {
    const n = 9 - row, w = 208 - row * 22;
    for (let i = 0; i < n; i++) GRAINS.push({ x: -w / 2 + (w * (i + 0.5)) / n + (r() - 0.5) * 6, y: -22 - row * 21 + (r() - 0.5) * 6, r: 15 + r() * 6, seed: 3 + i * 3 + row });
  }
}

export class LockedIonsScene extends SimScene {
  static BEAT_STEP_MAP = [S_DARK, S_FIXED, S_MELT].map((i) => [{ idx: i, dwellMs: null }]);
  static NOTE_STAGE = 1;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'switch', label: 'Switch' },
    { type: 'slider', id: 'temp', label: 'Temperature', min: ROOM, max: MELT, step: 1, value: ROOM, suffix: ' \u00b0C' },
  ];
  static ARIA_LABEL = 'The bulb test with dry salt crystals in the glass: close the switch and the bulb stays dark. Next a slice of '
    + 'the crystal: pull an ion and let go, and it springs back because its neighbours hold it. Last, raise the temperature: '
    + 'the ions shake harder, 180 degrees Celsius is not nearly enough, and at 801 degrees Celsius the crystal comes apart.';

  constructor(container, config) {
    super(container, config);
    this._closed = false; this._lever = 0;
    this._grab = null; this._sp = null;
    this._temp = ROOM; this._heatAt = -9; this._melt = 0; this._clockT = 0;
    this._foundA = false; this._foundB = false; this._foundC = false;
    this._doneAt = -9;
  }

  noteRows() { return [{ text: 'ions drawn far bigger than life' }]; }

  enter() {
    this._closed = false; this._lever = 0;
    this._grab = null; this._sp = null;
    this._temp = ROOM; this._heatAt = -9; this._melt = 0; this._clockT = 0;
    this._foundA = this._foundB = this._foundC = false;
    this._doneAt = -9;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return id === 'switch' ? this.stage !== S_DARK : this.stage !== S_MELT; }
  getControlValue(id) { return id === 'temp' ? this._temp : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'switch') this._toggle();
    if (id === 'temp') { this._temp = Math.round(Number(v)); this._heatAt = this.age; }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _toggle() { this._closed = !this._closed; }

  update(d) {
    const lt = this._closed ? 1 : 0;
    this._lever += Math.sign(lt - this._lever) * Math.min(Math.abs(lt - this._lever), d / LEVER_S);
    if (this.stage === S_DARK && this._closed && this._lever >= 1 && !this._foundA) {
      this._foundA = true;
      this._doneAt = this.age;
      this.celebrate(340, 106, 26, { key: 'dry-salt-dark', lookAt: 'bulb' });
    }
    if (this._sp && !this._grab) {
      const s = this._sp, k = 60, damp = 7;
      s.vx += (-k * s.dx - damp * s.vx) * d; s.vy += (-k * s.dy - damp * s.vy) * d;
      s.dx += s.vx * d; s.dy += s.vy * d;
      if (Math.hypot(s.dx, s.dy) < 0.3 && Math.hypot(s.vx, s.vy) < 3) {
        this._sp = null;
        if (!this._foundB) {
          this._foundB = true;
          this._doneAt = this.age;
          this.celebrate(340, 250, 26, { key: 'ion-springs-back', lookAt: 'scene' });
        }
      }
    }
    if (this.stage === S_MELT) {
      if (this.age - this._heatAt < SHAKE_S) this._clockT += d;
      const t = this._temp >= MELT ? 1 : 0;
      this._melt += Math.sign(t - this._melt) * Math.min(Math.abs(t - this._melt), d / MELT_S);
      if (this._melt >= 1 && !this._foundC) {
        this._foundC = true;
        this._doneAt = this.age;
        this.celebrate(226, 260, 28, { key: 'salt-melts', lookAt: 'scene' });
      }
    }
  }

  busy() {
    const lt = this._closed ? 1 : 0;
    if (Math.abs(this._lever - lt) > 1e-3 || this._sp) return true;
    if (this.stage === S_MELT && (this.age - this._heatAt < SHAKE_S || Math.abs(this._melt - (this._temp >= MELT ? 1 : 0)) > 1e-3)) return true;
    return this.age < 0.8;
  }

  pointerDown(p) {
    if (this.stage === S_DARK) { if (p.y < 210) this._toggle(); return; }
    if (this.stage !== S_FIXED) return;
    let best = null, bd = 1e9;
    for (const o of IONS) {
      const d = Math.hypot(340 + o.sx - p.x, 250 + o.sy - p.y);
      if (d < bd) { bd = d; best = o; }
    }
    if (bd > 60) return;
    this._grab = { o: best, x0: p.x, y0: p.y };
    this._sp = { o: best, dx: 0, dy: 0, vx: 0, vy: 0 };
  }
  pointerMove(p) {
    const g = this._grab;
    if (!g) return false;
    let dx = p.x - g.x0, dy = p.y - g.y0;
    const len = Math.hypot(dx, dy), max = PULL_MAX + (Math.max(0, len - PULL_MAX) * 0.12);
    if (len > max) { dx *= max / len; dy *= max / len; }
    this._sp.dx = dx; this._sp.dy = dy;
    this.animateFor?.();
    return false;
  }
  pointerUp() {
    if (!this._grab) return;
    this._grab = null;
    if (Math.hypot(this._sp.dx, this._sp.dy) < 2) this._sp = null;
    this.animateFor?.();
  }

  draw(ctx, c) {
    if (this.stage === S_DARK) { this._bench(ctx, c); return; }
    const cx = this.stage === S_MELT ? 226 : 340, s = this.stage === S_MELT ? 0.8 : 1;
    drawDepthField(ctx, c, { x: cx, y: 250, seed: 4, n: 10 });
    this._slice(ctx, c, cx, this.stage === S_MELT ? 262 : 250, s);
    if (this.stage === S_FIXED) {
      const moved = this._foundB;
      tag(ctx, c, moved ? 'its neighbours hold it' : 'pull any ion, then let go', 340, 36, { bg: moved ? c.good : c.warning, scale: moved ? popIn(this.age - this._doneAt, 0, 0.3) : popIn(this.age, 0.4) });
    } else this._thermo(ctx, c);
  }

  _bench(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 58);
    drawBench(ctx, c, 40, 640, BENCH);
    drawRig(ctx, c, 340, BENCH, 0.98, {
      lever: this._lever, glow: 0, level: 0,
      contents: (cx, sy, g) => { for (const q of GRAINS) drawGrain(cx, c, q.x, g.floor + 6 + q.y, q.r, { seed: q.seed, col: snow(c) }); },
    });
    tag(ctx, c, 'dry salt', 118, 356, { bg: c.raised });
    if (!this._closed && !this._foundA) tag(ctx, c, 'tap the switch', 560, 96, { bg: c.warning, scale: popIn(this.age, 0.5) });
    if (this._foundA) tag(ctx, c, 'bulb stays dark', 560, 96, { bg: c.bad, scale: popIn(this.age - this._doneAt, 0, 0.3) });
  }

  _pos(o, cx, cy, s) {
    let x = cx + o.sx * s, y = cy + o.sy * s;
    if (this.stage === S_MELT) {
      const T = (this._temp - ROOM) / (MELT - ROOM), amp = (2 + T * 11) * s;
      const still = reducedMotion();
      const w = still ? 0 : Math.sin(this._clockT * 26 + o.ph);
      x += (o.fx * 0.7 + w * Math.cos(o.ang)) * amp * (this._temp > ROOM ? 1 : 0.3);
      y += (o.fy * 0.7 + w * Math.sin(o.ang)) * amp * (this._temp > ROOM ? 1 : 0.3);
      const m = ease.inOutCubic(this._melt), q = LOOSE[o.n];
      x = lerp(x, cx + q.x, m);
      y = lerp(y, cy + 30 + q.y, m);
    }
    const sp = this._sp;
    if (sp) {
      if (sp.o === o) { x += sp.dx * 1; y += sp.dy * 1; } else if (Math.abs(sp.o.i - o.i) + Math.abs(sp.o.j - o.j) === 1) { x += sp.dx * 0.22; y += sp.dy * 0.22; }
    }
    return { x, y };
  }

  _slice(ctx, c, cx, cy, s) {
    const sp = this._sp, stretch = sp ? clamp01(Math.hypot(sp.dx, sp.dy) / PULL_MAX) : 0;
    const a = 1 - clamp01(this._melt * 2);
    if (a > 0) {                                            // the attraction between neighbours
      ctx.save();
      ctx.lineCap = 'round';
      for (const o of IONS) for (const [di, dj] of [[1, 0], [0, 1]]) {
        const q = IONS.find((e) => e.i === o.i + di && e.j === o.j + dj);
        if (!q) continue;
        const A = this._pos(o, cx, cy, s), B = this._pos(q, cx, cy, s);
        const hot = sp && (sp.o === o || sp.o === q);
        ctx.strokeStyle = alpha(hot ? c.gold : mix(c.gold, c.bgSurface, 0.5), a);
        ctx.lineWidth = (hot ? 7 + 4 * stretch : 6) * s;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      ctx.restore();
    }
    for (const o of IONS) {
      const p = this._pos(o, cx, cy, s);
      const grabbed = sp && sp.o === o;
      drawIon(ctx, c, p.x, p.y, { sym: o.na ? 'Na' : 'Cl', charge: o.na ? 1 : -1, r: o.rr * s * (grabbed ? 1.06 : 1), focus: grabbed ? 0.9 : 0 });
    }
  }

  _thermo(ctx, c) {
    const x = 452, y = 22, w = 214, h = 476, tx = x + 58, top = y + 104, bot = y + 416;
    drawCard(ctx, c, x, y, w, h, 1, {});
    say(ctx, c, `${this._temp} \u00b0C`, x + w / 2, y + 52, { size: 46, col: this._temp >= MELT ? c.flame : c.label });
    const f = clamp01((this._temp - 0) / 900), yAt = (v) => lerp(bot, top, v / 900);
    rr(ctx, tx - 17, top - 10, 34, bot - top + 26, 17); ctx.fillStyle = c.track; ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 3; ctx.stroke();
    const fy = lerp(bot, top, f);
    rr(ctx, tx - 9, fy, 18, bot - fy + 14, 9); ctx.fillStyle = c.flame; ctx.fill();
    ctx.beginPath(); ctx.arc(tx, bot + 22, 28, 0, Math.PI * 2); ctx.fillStyle = c.flame; ctx.fill();
    ctx.strokeStyle = darken(c.flame, 0.3); ctx.lineWidth = 3; ctx.stroke();
    for (const [v, a, b] of [[MELT, '801 \u00b0C', 'salt melts'], [180, '180 \u00b0C', 'hot oil']]) {
      const ty = yAt(v);
      ctx.strokeStyle = c.label; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx + 19, ty); ctx.lineTo(tx + 34, ty); ctx.stroke();
      say(ctx, c, a, tx + 42, ty - 13, { size: 24, align: 'left' });
      say(ctx, c, b, tx + 42, ty + 15, { size: 22, align: 'left', col: c.labelMuted, display: false, weight: 700 });
    }
    if (this._temp < 60 && !this._foundC) tag(ctx, c, 'raise the temperature', 226, 40, { bg: c.warning, scale: popIn(this.age, 0.5) });
    if (this._foundC) tag(ctx, c, 'the crystal has come apart', 226, 40, { bg: c.good, size: 24, scale: popIn(this.age - this._doneAt, 0, 0.3) });
  }
}
