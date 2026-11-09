// BohrJumpScene - companion to blk-l06-s4, "Bohr's Model of the Atom".
// The atom and its energy staircase side by side, one electron shown on both: the shell it is in and
// the step it stands on. A jump in the atom is a hop on the stairs. The drawing is the lesson.
//   b0  shells    the atom with shells K, L, M, N; the electron goes round K and its energy stays level
//   b1  ladder    the staircase rises beside the atom, shell by shell: K lowest, each step its own size
//   b2  test      the learner sets a pulse and fires. 9 units: it passes by. The exact amount: the
//                 electron jumps, then falls back one step at a time, one flash for each step.
//   b3  takeaway  the electron in K, with the spiral Rutherford's model predicted shown as not happening
// Steps are plain units: K 0, L 10, M 12, N 13.
// Phone width: the theatre gives a scene with a long beat of text only 226 px of height, whatever the bar does,
// and the bar cannot make a 44 px target. So the frame is wider than it is tall by more (680 x 440), the bar
// stands down, and the slider and Send are drawn in a row along the bottom. The focused canvas keeps the keyboard.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, drawMeter, font, inkOn, leader, lerp, mix, outBack, rr } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawElectron, drawFocus, drawNucleus, drawShell } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';
import { LEVELS, drawPacket, drawStairs, stairLayout, toneOf } from './StairKit.js';

const TAU = Math.PI * 2;
const S_SHELLS = 0, S_LADDER = 1, S_TEST = 2, S_TAKE = 3;
const WIDE = {
  A: { x: 190, y: 240 }, RADII: [62, 104, 140, 172], ST: { x: 372, y: 442, w: 72, unit: 23, kick: 46 }, nucR: 30,
  note: { x: 190, y: 478 }, foot: 470, passY: 470,
};
// Phone: the same picture a little smaller, its chips along the top, the bottom row left for the controls.
const NARROW = {
  A: { x: 152, y: 192 }, RADII: [50, 84, 114, 138], ST: { x: 336, y: 300, w: 78, unit: 18, kick: 30 }, nucR: 24,
  note: { x: 180, y: 24 }, foot: 392, passY: 322,
};
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;   // read once: a turned phone keeps its layout
const G = PHONE ? NARROW : WIDE;
const MIN = 26;                          // over 12 CSS px at this frame's narrowest on a 390 phone
const fs = (px) => (PHONE ? Math.max(px, MIN) : px);
const ROW = { x: 6, y: 346, w: 668, h: 94 };
const SLIDE = { x0: 50, x1: 428, r: 36 };
const SEND = { x: 476, y: 350, w: 190, h: 86 };
const PULSE_MIN = 1, PULSE_MAX = 13;
const LABEL_AT = [Math.PI / 2, 2.3, 0.9, 2.65];   // each shell's letter sits at its own angle, clear of the others
const FLY = 0.9, HOP = 0.6, REST = 1.1;

export class BohrJumpScene extends SimScene {
  static HEIGHT = PHONE ? 440 : 520;
  static BEAT_STEP_MAP = [S_SHELLS, S_LADDER, S_TEST, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static IRIS = false;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'pulse', label: 'Pulse energy (units)', min: 1, max: 13, step: 1, value: 9, suffix: ' units' },
    { type: 'button', id: 'fire', label: 'Send the pulse' },
  ];
  static ARIA_LABEL = 'An atom with shells K, L, M and N beside a staircase with one step for each shell, K lowest. One electron is shown on both. The electron goes round in K and its energy stays the same. You set the energy of a pulse of light and send it: a pulse of 9 units passes by and nothing moves. A pulse of exactly 10 units lifts the electron from K to L, and it hops up the stairs; 12 lifts it to M and 13 to N. A pulse of 11 is larger than 10 but matches no step, so it passes by too. Left alone it falls back and gives out one flash of 10 units. Last, the electron stays in K, and the spiral of the old model does not happen.';

  constructor(container, config) {
    super(container, config);
    this._pulse = 9;
    this._lvl = 0;
    this._act = null;
    this._note = null;
    this._found = false;
    this._sliding = false;
  }

  async setup() {
    await super.setup();
    if (!PHONE) return;
    this._onKey = (e) => this._key(e);
    this._canvas?.setAttribute('tabindex', '0');
    this._canvas?.addEventListener('keydown', this._onKey);
    // The lesson reads a sideways touch as a swipe to the next beat: a drag that belongs to the scene stays here.
    this._onTouchEnd = (e) => { if (this._heldTouch) e.stopPropagation(); this._heldTouch = false; };
    this._canvas?.addEventListener('touchend', this._onTouchEnd);
  }

  destroy() {
    if (this._onKey) this._canvas?.removeEventListener('keydown', this._onKey);
    if (this._onTouchEnd) this._canvas?.removeEventListener('touchend', this._onTouchEnd);
    super.destroy();
  }

  enter() {
    this._pulse = 9;
    this._lvl = 0;
    this._act = null;
    this._note = null;
    this._found = false;
    this._sliding = false;
  }

  isControlHidden() { return PHONE || this.stage !== S_TEST; }
  isControlDisabled(id) { return id === 'fire' && !!this._act; }
  getControlValue(id) { return id === 'pulse' ? String(this._pulse) : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'pulse') { this._pulse = Number(v); this.requestUiUpdate?.(); }
    if (id === 'fire') this._fire();
  }

  pointerDown(p) {
    if (this.stage !== S_TEST) return;
    if (!PHONE) { this._fire(); return; }
    if (p.y < ROW.y - 6) return;
    if (p.x >= SEND.x - 12) { this._fire(); return; }
    this._sliding = true;
    this._heldTouch = true;
    this._slideTo(p);
  }

  pointerMove(p) {
    if (!this._sliding) return false;
    this._slideTo(p);
    return true;
  }

  pointerUp() { this._sliding = false; }

  _slideTo(p) {
    const u = clamp01((p.x - SLIDE.x0) / (SLIDE.x1 - SLIDE.x0));
    this._pulse = Math.round(lerp(PULSE_MIN, PULSE_MAX, u));
  }

  // With the bar stood down, the keyboard works from the focused canvas.
  _key(e) {
    if (this.stage !== S_TEST) return;
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const next = Math.max(PULSE_MIN, Math.min(PULSE_MAX, this._pulse + step));
    if (step && next !== this._pulse) { this._pulse = next; this.animateFor?.(); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { this.animateFor?.(); this._fire(); e.preventDefault(); }
  }

  _target(e) {
    for (let i = this._lvl + 1; i < 4; i++) if (LEVELS[i].e - LEVELS[this._lvl].e === e) return i;
    return -1;
  }

  _fire() {
    if (this._act) return;
    const e = this._pulse, to = this._target(e);
    this._note = null;
    if (reducedMotion()) {
      if (to >= 0) { this._markFind(to); this._note = { hit: true, e }; }
      else this._note = { hit: false, e };
      return;
    }
    this._act = { kind: 'pulse', t: 0, e, to };
    this.requestUiUpdate?.();
  }

  _markFind(to) {
    if (this._found) return;
    this._found = true;
    const p = stairLayout(G.ST)[to];
    this.celebrate(p.x, p.y - 20, 30, { key: 'jump', lookAt: true });
  }

  update(d) {
    const a = this._act;
    if (!a) return;
    a.t += d;
    if (a.kind === 'pulse') {
      if (a.to < 0 && a.t > FLY * 1.7) { this._note = { hit: false, e: a.e }; this._act = null; this.requestUiUpdate?.(); }
      else if (a.to >= 0 && a.t > FLY) this._act = { kind: 'up', t: 0, from: this._lvl, to: a.to, e: a.e };
    } else if (a.kind === 'up' && a.t > HOP) {
      this._lvl = a.to;
      this._note = { hit: true, e: a.e };
      this._markFind(a.to);
      this._act = { kind: 'rest', t: 0 };
    } else if (a.kind === 'rest' && a.t > REST) {
      this._act = { kind: 'down', t: 0, from: this._lvl, to: this._lvl - 1, e: LEVELS[this._lvl].e - LEVELS[this._lvl - 1].e };
    } else if (a.kind === 'down' && a.t > HOP + 0.5) {
      this._lvl = a.to;
      this._act = this._lvl > 0 ? { kind: 'rest', t: 0.5 } : null;
      this.requestUiUpdate?.();
    }
  }

  busy() { return !!this._act || this.age < 3; }

  /** Where the electron is now, as a level that may be between two during a hop. */
  _level() {
    const a = this._act;
    if (a && (a.kind === 'up' || a.kind === 'down')) {
      const u = ease.inOutCubic(clamp01(a.t / HOP));
      return { i: a.from, j: a.to, u };
    }
    return { i: this._lvl, j: this._lvl, u: 0 };
  }

  draw(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const st = this.stage;
    const lv = this._level();
    const { A, RADII, ST } = G;
    const ring = lerp(RADII[lv.i], RADII[lv.j], lv.u);
    const phase = reducedMotion() ? 0.7 : this.age * 2.1;   // the orbit is drawn from the clock: nothing to resume
    const ex = A.x + Math.cos(phase) * ring, ey = A.y + Math.sin(phase) * ring;
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 22 });
    // The atom.
    RADII.forEach((r, i) => {
      const on = i === lv.j || i === lv.i;
      drawShell(ctx, c, A.x, A.y, r, { band: on ? 12 : 0, line: 3.5, active: on, dim: on ? 0 : 0.2 });
    });
    if (st === S_TAKE) this._ghostSpiral(ctx, c);
    drawNucleus(ctx, c, A.x, A.y, { p: 3, n: 4, r: G.nucR, seed: 3 });
    RADII.forEach((r, i) => tag(ctx, c, LEVELS[i].name, A.x + r * Math.cos(LABEL_AT[i]), A.y + r * Math.sin(LABEL_AT[i]), { size: fs(22), bg: i === lv.j ? c.warning : c.raised }));
    drawElectron(ctx, c, ex, ey, 14, { focus: 1 });
    if (st === S_SHELLS) { this._level0(ctx, c, age); return; }
    // The stairs rise beside it.
    const up = st === S_LADDER ? clamp01(age / 1.2) : 1;
    const k = ease.outCubic(up);
    const st2 = { ...ST, unit: ST.unit * k, kick: ST.kick };
    const shown = st !== S_LADDER || up >= 1;
    const pts = drawStairs(ctx, c, { ...st2, active: lv.u > 0.5 ? lv.j : lv.i, sizes: shown && !PHONE });
    if (PHONE) this._stairLabels(ctx, c, pts, st2, lv.u > 0.5 ? lv.j : lv.i, shown);
    // The shell and its step are one thing: the link says so.
    const now = lv.u > 0.5 ? lv.j : lv.i;
    leader(ctx, A.x + RADII[now], A.y, pts[now].x - ST.w / 2, pts[now].y - 8, c.warning, 0.9, 0, { arrow: true });
    this._bead(ctx, c, pts, lv);
    if (st !== S_LADDER || up >= 1) {
      ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const ax = ST.x - 20, top = PHONE ? 56 : 120;
      ctx.beginPath(); ctx.moveTo(ax, ST.y - 4); ctx.lineTo(ax, top); ctx.moveTo(ax - 10, top + 14); ctx.lineTo(ax, top); ctx.lineTo(ax + 10, top + 14); ctx.stroke();
      ctx.lineCap = 'butt';
      tag(ctx, c, 'energy', PHONE ? 412 : 408, PHONE ? 38 : 112, { size: fs(22) });
    }
    if (st === S_LADDER) {
      if (up >= 1) {
        tag(ctx, c, 'least energy', PHONE ? 375 : 442, PHONE ? 392 : 330, { bg: c.warning, size: fs(24), scale: outBack(clamp01((age - 1.2) / 0.4)) });
        tag(ctx, c, 'more energy', PHONE ? 180 : 550, PHONE ? 24 : 56, { bg: c.raised, size: fs(24), scale: outBack(clamp01((age - 1.5) / 0.4)) });
      }
      return;
    }
    if (st === S_TEST) { this._test(ctx, c, pts, ex, ey); if (PHONE) this._row(ctx, c); return; }
    const v = outBack(clamp01((age - 0.3) / 0.5));
    tag(ctx, c, 'keeps its energy', PHONE ? 470 : 500, PHONE ? G.foot : 66, { bg: c.good, scale: v, size: fs(26) });
    tag(ctx, c, 'no spiral', A.x, PHONE ? G.foot : 464, { bg: c.warning, scale: v, size: fs(26) });
  }

  _level0(ctx, c, age) {
    const v = outBack(clamp01((age - 0.2) / 0.5));
    const mid = PHONE ? 494 : 518, my = PHONE ? 176 : 244;
    drawMeter(ctx, c, mid - 110, my, 220, 30, 0.72, { col: c.electron });
    tag(ctx, c, 'energy of the electron', mid, my - 44, { size: fs(22), scale: v });
    tag(ctx, c, 'stays the same', mid, my + 70, { bg: c.good, scale: v, size: fs(26) });
    tag(ctx, c, 'only these shells', 190, G.foot, { bg: c.raised, size: fs(24), scale: v });
  }

  // drawStairs' own labels are 22 and 24 design px, under 12 CSS px here: the same labels, larger, on top.
  _stairLabels(ctx, c, pts, o, on, sizes) {
    pts.forEach((p, i) => {
      if (sizes && i > 0) {
        ctx.font = font(c, 800, MIN, true);
        ctx.fillStyle = inkOn(c, mix(c.s5, c.bgSurface, 0.35));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`+${p.e - pts[i - 1].e}`, p.x, o.y - 40);
      }
      tag(ctx, c, p.name, p.x, o.y + 22, { bg: i === on ? c.warning : c.raised, size: MIN });
    });
  }

  // The phone's controls: a slider with the amount on its thumb, and Send. Each is 44 CSS px tall or more.
  _row(ctx, c) {
    const L = lookOf(), v = (this._pulse - PULSE_MIN) / (PULSE_MAX - PULSE_MIN), cy = ROW.y + ROW.h / 2;
    const x = lerp(SLIDE.x0, SLIDE.x1, v), busy = !!this._act, cap = L.pill;
    rr(ctx, ROW.x, ROW.y, ROW.w, ROW.h, 18); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.25); ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, SLIDE.x0 - 8, cy - 7, SLIDE.x1 - SLIDE.x0 + 16, 14, 7); ctx.fillStyle = alpha(c.label, 0.28); ctx.fill();
    for (let i = 0; i <= PULSE_MAX - PULSE_MIN; i++) {
      ctx.beginPath(); ctx.arc(lerp(SLIDE.x0, SLIDE.x1, i / (PULSE_MAX - PULSE_MIN)), cy, 3.5, 0, TAU);
      ctx.fillStyle = alpha(c.label, 0.5); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, cy + 3.5 * L.lip, SLIDE.r, 0, TAU); ctx.fillStyle = darken(c.warning, 0.38); ctx.fill();
    ctx.beginPath(); ctx.arc(x, cy, SLIDE.r, 0, TAU); ctx.fillStyle = c.warning; ctx.fill();
    ctx.font = font(c, 800, 32, true); ctx.fillStyle = inkOn(c, c.warning);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(this._pulse), x, cy + 1);
    ctx.save();
    ctx.globalAlpha *= busy ? 0.45 : 1;
    rr(ctx, SEND.x, SEND.y + 3.5 * L.lip, SEND.w, SEND.h, cap); ctx.fillStyle = darken(c.accent, 0.38); ctx.fill();
    rr(ctx, SEND.x, SEND.y, SEND.w, SEND.h, cap); ctx.fillStyle = c.accent; ctx.fill();
    ctx.font = font(c, 800, 32, true); ctx.fillStyle = inkOn(c, c.accent);
    ctx.fillText('Send', SEND.x + SEND.w / 2, cy + 1);
    ctx.restore();
  }

  // The same electron, standing on its step.
  _bead(ctx, c, pts, lv) {
    const a = pts[lv.i], b = pts[lv.j];
    const x = lerp(a.x, b.x, lv.u), y = lerp(a.y, b.y, lv.u) - 18 - Math.sin(Math.PI * lv.u) * 34;
    drawFocus(ctx, c, x, y, 15, 0.9);
    drawElectron(ctx, c, x, y, 15);
  }

  _test(ctx, c, pts, ex, ey) {
    const a = this._act, sent = a?.kind === 'pulse' || a?.kind === 'up' ? a.e : this._pulse;
    const { A } = G;
    if (PHONE) this._chip(ctx, c, sent);
    else tag(ctx, c, `pulse: ${sent} units`, 500, 40, { bg: toneOf(c, sent), size: 26 });
    if (a?.kind === 'pulse') {
      const col = toneOf(c, a.e);
      if (a.to >= 0) {
        const u = ease.inOutCubic(clamp01(a.t / FLY));
        const x = lerp(-30, ex, u), y = lerp(A.y + 60, ey, u);
        drawPacket(ctx, x, y, Math.atan2(ey - A.y - 60, ex + 30), 80, col);
      } else {
        const u = clamp01(a.t / (FLY * 1.7));
        const x = lerp(-30, 720, u);
        drawPacket(ctx, x, G.passY, 0, 80, col);
      }
    }
    if (a?.kind === 'down') {
      const u = clamp01((a.t - 0.2) / 0.8);
      const col = toneOf(c, a.e);
      const f = 1 - clamp01((a.t - 0.1) / 0.3);
      if (f > 0) { ctx.beginPath(); ctx.arc(ex, ey, 40 + (1 - f) * 40, 0, TAU); ctx.fillStyle = alpha(col, 0.5 * f); ctx.fill(); }
      const ang = Math.atan2(ey - A.y, ex - A.x);
      drawPacket(ctx, ex + Math.cos(ang) * 320 * u, ey + Math.sin(ang) * 320 * u, ang, 80, col);
      if (!PHONE) tag(ctx, c, `flash: ${a.e} units`, 190, 478, { bg: col, size: 26 });
    } else if (PHONE) {
      /* one chip on a phone: _chip */
    } else if (a?.kind === 'pulse' || a?.kind === 'up' || (a?.kind === 'rest' && this._note?.hit)) {
      /* the reading is the pulse chip */
    } else if (this._note) {
      const n = this._note;
      const miss = this._miss(n.e);
      tag(ctx, c, n.hit ? 'exact: it jumps' : miss, 190, 478, { bg: n.hit ? c.good : c.raised, size: 24 });
    } else tag(ctx, c, 'set a pulse and send it', 190, 478, { bg: c.warning, size: 24 });
  }

  _miss(e) { return e < LEVELS[1].e ? `${e} units: too small for a step` : `${e} units: matches no step`; }

  // The phone's one chip, above the picture: the same words as the wide layout's two.
  _chip(ctx, c, sent) {
    const a = this._act, n = this._note, at = (text, bg) => tag(ctx, c, text, G.note.x, G.note.y, { bg, size: MIN });
    if (a?.kind === 'down') at(`flash: ${a.e} units`, toneOf(c, a.e));
    else if (a?.kind === 'pulse' || a?.kind === 'up' || (a?.kind === 'rest' && n?.hit)) at(`pulse: ${sent} units`, toneOf(c, sent));
    else if (n && n.e === this._pulse) at(n.hit ? 'exact: it jumps' : this._miss(n.e), n.hit ? c.good : c.raised);
    else if (!n && this._pulse === 9) at('set a pulse and send it', c.warning);
    else at(`pulse: ${this._pulse} units`, toneOf(c, this._pulse));
  }

  // The path Rutherford's model predicts, drawn faint and struck through.
  _ghostSpiral(ctx, c) {
    const { A, RADII } = G, sc = RADII[0] / WIDE.RADII[0];
    ctx.strokeStyle = alpha(c.bad, 0.5); ctx.lineWidth = 5; ctx.setLineDash([3, 13]); ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const u = i / 90, r = lerp(60, 30, u) * sc, a = 0.4 + u * 9;
      const x = A.x + Math.cos(a) * r, y = A.y + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]); ctx.lineCap = 'butt';
  }
}
