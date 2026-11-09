// DistillationScene - heat, vapour, cooling, liquid: the idea of distillation before the real set-up.
//
// A flask of two mixed liquids, one dot per small amount: A (pink, boils at 60 C), B (blue-green, 90 C).
// The vapour leaves through a tube with a cold sleeve and drips into a vessel. Beside it the thermometer
// reading is plotted against time, so the two flat stretches are what the learner sees.
//
// Two mounts, separate stages (the scene sees only the beat count):
//   0 beats  blk-l04-s01, the predict: cold flask, the two boiling points, nothing moves.
//   4 beats  blk-l04-s02: 1 from cold; 2 mid A; 3 at the climb; 4 finished.
// The run stops when the reading starts to climb: the learner changes the vessel, which is the find,
// and the run goes on with B. tm is the one clock of the run, 0..1; every beat is a value of tm.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, darken, font, pill, rr, drawBackdrop, drawFloor, drawBench, drawCard, drawShadow, clamp, mulberry32,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassPipe, drawGlassPipeFront } from 'simulations/base/kit/SimGlass.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const DEG = '\u00b0';

const T_ROOM = 25, T_A = 60, T_B = 90;
// the run's clock: [heat up][A boils off][climb, stops at CHANGE][B boils off]
const T_AHEAD = 0.12, T_AEND = 0.5, CHANGE = 0.55, T_BSTART = 0.62, T_END = 0.95;
const RUN_S = 13;

function tempAt(tm) {
  if (tm < T_AHEAD) return T_ROOM + (T_A - T_ROOM) * (tm / T_AHEAD);
  if (tm < T_AEND) return T_A;
  if (tm < T_BSTART) return T_A + (T_B - T_A) * ((tm - T_AEND) / (T_BSTART - T_AEND));
  return T_B;
}
const aGone = (tm) => clamp((tm - T_AHEAD) / (T_AEND - T_AHEAD), 0, 1);
const bGone = (tm) => clamp((tm - T_BSTART) / (T_END - T_BSTART), 0, 1);

const BENCH_Y = 448;
const FL = { x: 132, y: 296, r: 88 };
const NECK_Y = 132;
const ARM = { x0: 146, y0: 176, x1: 348, y1: 262 };
const JK = { x0: 216, y0: 206, x1: 318, y1: 249 };
const V1 = { x: 348, top: 318, w: 116 };
const VSHIFT = 150;           // how far the first vessel slides aside when it is changed
const CARD = { x: 416, y: 18, w: 252, h: 262 };
const PLOT = { x: CARD.x + 40, y: CARD.y + 74, w: CARD.w - 56, h: CARD.h - 104 };

const S_SETUP = 0, S_START = 1;
const SNAP = { 1: 0, 2: 0.32, 3: CHANGE, 4: 1 };

const stageMap = (from, n) => Array.from({ length: n }, (_, i) => [{ idx: from + i, dwellMs: null }]);

export class DistillationScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  // The predict slide is a beat-less mount: the host sends the largest safe integer as the count.
  static BEAT_MAPS = { 0: stageMap(S_SETUP, 1), [Number.MAX_SAFE_INTEGER]: stageMap(S_SETUP, 1), 4: stageMap(S_START, 4) };
  static BEAT_STEP_MAP = stageMap(S_START, 4);
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A flask holding two mixed liquids over a burner, with a tube and a cold sleeve leading to a collecting vessel. A graph plots the thermometer reading against time. The reading stays near 60 degrees while liquid A boils away and drips into the vessel, climbs when A has gone, and then stays near 90 degrees while liquid B comes over.';
  static CONTROLS = [
    { type: 'button', id: 'run', label: 'Heat the flask' },
    { type: 'button', id: 'change', label: 'Change the vessel' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._tm = 0;
    this._going = false;
    this._changed = false;
    this._slide = 0;
    this._found = false;
    this._dots = null;
  }

  enter(stage) {
    this._tm = SNAP[stage] ?? 0;
    this._going = false;
    this._changed = stage === 4;
    this._slide = this._changed ? 1 : 0;
  }

  get _waiting() { return this._tm >= CHANGE && !this._changed && this._tm < 1; }

  isControlHidden(id) {
    if (this.stage === S_SETUP) return true;
    if (id === 'change') return !this._waiting;
    if (id === 'run') return this._waiting;
    return false;
  }
  isControlDisabled(id) {
    if (id === 'run') return this._going || this._tm >= 1;
    return false;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'run') this._going = true;
    else if (id === 'again') {
      this._tm = 0; this._going = false; this._changed = false; this._slide = 0;
    } else if (id === 'change') {
      this._changed = true;
      this._going = true;
      if (!this._found) {
        this._found = true;
        this.celebrate(V1.x, V1.top + 60, 16, { key: 'change-vessel', lookAt: true });
      }
    }
    this.animateFor(1000);
    this.requestUiUpdate?.();
  }

  update(d) {
    if (this._changed && this._slide < 1) this._slide = Math.min(1, this._slide + d * 2.2);
    if (!this._going) return;
    const limit = this._changed ? 1 : CHANGE;
    this._tm = Math.min(limit, this._tm + d / RUN_S);
    if (this._tm >= limit) { this._going = false; this.requestUiUpdate?.(); }
  }

  busy() { return this._going || (this._changed && this._slide < 1); }

  draw(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500);
    drawBench(ctx, c, 0, 680, BENCH_Y, { h: 50 });
    this._vessels(ctx, c, t);
    this._rig(ctx, c, t);
    this._graph(ctx, c);
  }

  _toneA(c) { return c.s4; }
  _toneB(c) { return c.s7; }

  _rig(ctx, c, t) {
    const tm = this._tm;
    const on = this._going;
    const R = FL.r;
    // burner, tripod, gauze
    const bx = FL.x;
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 58, BENCH_Y - 2); ctx.lineTo(bx - 42, 392); ctx.moveTo(bx + 58, BENCH_Y - 2); ctx.lineTo(bx + 42, 392); ctx.stroke();
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.1); rr(ctx, bx - 62, 386, 124, 7, 3); ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.15); rr(ctx, bx - 14, BENCH_Y - 36, 28, 30, 4); ctx.fill();
    rr(ctx, bx - 23, BENCH_Y - 9, 46, 9, 3); ctx.fill();
    if (on) {
      const f = 28 + 3 * Math.sin(t * 11);
      ctx.fillStyle = alpha(c.flame, 0.92);
      ctx.beginPath(); ctx.moveTo(bx - 11, BENCH_Y - 36); ctx.quadraticCurveTo(bx - 16, BENCH_Y - 36 - f * 0.6, bx, BENCH_Y - 36 - f); ctx.quadraticCurveTo(bx + 16, BENCH_Y - 36 - f * 0.6, bx + 11, BENCH_Y - 36); ctx.closePath(); ctx.fill();
    }
    // the side arm and its cold sleeve
    drawGlassPipe(ctx, c, ARM.x0, ARM.y0, ARM.x1, ARM.y1, 14);
    drawGlassPipe(ctx, c, JK.x0, JK.y0, JK.x1, JK.y1, 40);
    ctx.strokeStyle = alpha(c.water, 0.6); ctx.lineWidth = 32; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(JK.x0, JK.y0); ctx.lineTo(JK.x1, JK.y1); ctx.stroke();
    ctx.strokeStyle = alpha(c.bgDeep, 0.5); ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(JK.x0, JK.y0); ctx.lineTo(JK.x1, JK.y1); ctx.stroke();
    // vapour dots along the tube
    const boilingA = tm > T_AHEAD && tm < T_AEND, boilingB = tm > T_BSTART && tm < T_END;
    if (boilingA || boilingB) {
      const col = boilingA ? this._toneA(c) : this._toneB(c);
      for (let i = 0; i < 7; i += 1) {
        const p = ((on ? t * 0.7 : 0) + i / 7) % 1;
        const hx = FL.x, hy = FL.y - R * 0.5;
        // up the neck first, then along the arm as far as the sleeve's end
        const q = p < 0.3 ? p / 0.3 : (p - 0.3) / 0.7;
        const x = p < 0.3 ? hx + (ARM.x0 - hx) * q : ARM.x0 + (JK.x1 - ARM.x0) * q;
        const y = p < 0.3 ? hy + (ARM.y0 - hy) * q : ARM.y0 + (JK.y1 - ARM.y0) * q;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = alpha(col, p > 0.82 ? 0.55 : 0.95); ctx.fill();
      }
    }
    drawGlassPipeFront(ctx, c, ARM.x0, ARM.y0, ARM.x1, ARM.y1, 14);
    drawGlassPipeFront(ctx, c, JK.x0, JK.y0, JK.x1, JK.y1, 40, { ends: true });
    // the flask
    const g = glassBox('round', FL.x - R, NECK_Y, R * 2, FL.y + R - NECK_Y, { wall: 4, neck: 0.3 });
    drawGlass(ctx, c, g, { shadow: false });
    const left = 1 - 0.5 * aGone(tm) - 0.5 * bGone(tm);
    const surface = g.floor - R * 1.7 * (0.1 + 0.9 * left) * 0.62;
    drawGlassLiquid(ctx, c, g, { surface, fill: mix(c.glass, c.bgSurface, 0.3), opacity: 0.42 });
    this._flaskDots(ctx, c, g, surface);
    // stopper
    ctx.fillStyle = darken(c.stroke, 0.3); rr(ctx, FL.x - 32, NECK_Y - 12, 64, 18, 5); ctx.fill();
    // labels
    const lab = (s, x, y, bg, ink) => pill(ctx, c, s, x, y, { bg, ink, size: fs(16), display: true });
    if (this.stage !== S_SETUP) {
      lab('cooling', (JK.x0 + JK.x1) / 2 - 8, 168, c.accent);
      if (on) lab('heating', 256, 416, c.flame);
    }
    pill(ctx, c, `A ${T_A} ${DEG}C`, 56, 44, { bg: this._toneA(c), size: fs(17), display: true });
    pill(ctx, c, `B ${T_B} ${DEG}C`, 188, 44, { bg: this._toneB(c), size: fs(17), display: true });
  }

  _flaskDots(ctx, c, g, surface) {
    if (!this._dots) {
      const r = mulberry32(19);
      this._dots = Array.from({ length: 44 }, (_, i) => ({ u: r(), v: r(), a: i % 2 === 0 }));
    }
    const leftA = Math.round(22 * (1 - aGone(this._tm)));
    const leftB = Math.round(22 * (1 - bGone(this._tm)));
    let na = 0, nb = 0;
    ctx.save();
    const R = FL.r - 8;
    for (const p of this._dots) {
      if (p.a ? na >= leftA : nb >= leftB) continue;
      const y = surface + 8 + p.v * (g.floor - surface - 16);
      const hw = Math.sqrt(Math.max(0, R * R - (y - FL.y) ** 2));
      const x = FL.x - hw + 8 + p.u * (2 * hw - 16);
      if (p.a) na += 1; else nb += 1;
      ctx.beginPath(); ctx.arc(x, y, PHONE ? 6.5 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = p.a ? this._toneA(c) : this._toneB(c); ctx.fill();
      ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
  }

  _vessels(ctx, c, t) {
    const tm = this._tm;
    const flask = (cx, level, tone, name) => {
      const w = V1.w, h = BENCH_Y - V1.top;
      const g = glassBox('flask', cx - w / 2, V1.top, w, h, { wall: 3, r: 8, neck: 0.34 });
      drawShadow(ctx, c, cx, BENCH_Y + 2, w * 0.5, 6);
      drawGlass(ctx, c, g, { shadow: false });
      if (level > 0.01) drawGlassLiquid(ctx, c, g, { level: 0.08 + level * 0.46, fill: mix(tone, c.glass, 0.18), opacity: 0.85 });
      if (name) pill(ctx, c, name, cx, BENCH_Y - 28, { bg: c.raised, ink: c.label, size: fs(16), display: true });
      return g;
    };
    const s = this._slide;
    flask(V1.x + VSHIFT * s, aGone(tm), this._toneA(c), aGone(tm) > 0.02 ? 'A' : '');
    if (s > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s * 1.4);
      flask(V1.x, bGone(tm), this._toneB(c), bGone(tm) > 0.02 ? 'B' : '');
      ctx.restore();
    }
    const dripA = tm > T_AHEAD && tm < T_AEND, dripB = tm > T_BSTART && tm < T_END;
    if (this._going && (dripA || dripB)) {
      for (let i = 0; i < 2; i += 1) {
        const p = (t * 1.7 + i / 2) % 1;
        ctx.fillStyle = dripA ? this._toneA(c) : this._toneB(c);
        ctx.beginPath(); ctx.ellipse(ARM.x1, ARM.y1 + 6 + p * 92, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _graph(ctx, c) {
    const C = CARD, P = PLOT;
    const setup = this.stage === S_SETUP;
    drawCard(ctx, c, C.x, C.y, C.w, C.h, 1, {});
    const T = tempAt(this._tm);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = font(c, 700, fs(38), true); ctx.fillStyle = c.label;
    ctx.fillText(`${Math.round(setup ? T_ROOM : T)} ${DEG}C`, C.x + 18, C.y + 16);
    const X = (u) => P.x + (u / T_END) * P.w;
    const Y = (v) => P.y + P.h - ((v - 20) / 80) * P.h;
    ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x, P.y + P.h); ctx.lineTo(P.x + P.w, P.y + P.h); ctx.stroke();
    ctx.setLineDash([6, 6]);
    for (const [v, col] of [[T_A, this._toneA(c)], [T_B, this._toneB(c)]]) {
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(P.x, Y(v)); ctx.lineTo(P.x + P.w, Y(v)); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.font = font(c, 700, fs(15)); ctx.fillStyle = c.labelMuted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('60', P.x - 6, Y(T_A)); ctx.fillText('90', P.x - 6, Y(T_B));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('time', P.x + P.w / 2, P.y + P.h + 6);
    if (setup) return;
    const end = Math.min(this._tm, T_END);
    if (end > 0) {
      ctx.beginPath();
      const n = 40;
      for (let i = 0; i <= n; i += 1) {
        const u = (end * i) / n;
        if (i) ctx.lineTo(X(u), Y(tempAt(u))); else ctx.moveTo(X(u), Y(tempAt(u)));
      }
      ctx.strokeStyle = c.bad; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(X(end), Y(tempAt(end)), 7, 0, Math.PI * 2);
      ctx.fillStyle = c.bad; ctx.fill(); ctx.strokeStyle = c.stroke; ctx.lineWidth = 2; ctx.stroke();
    }
    if (this._waiting) pill(ctx, c, 'reading climbing', C.x + C.w / 2, C.y + C.h + 22, { bg: c.warning, size: fs(17), display: true });
  }
}
