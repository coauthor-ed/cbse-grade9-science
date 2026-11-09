// GoldFoilScene - companion to blk-l04-s2 (POE observe: the gold foil experiment).
// A dark chamber: a lead source box, a thin gold foil, and a ring of screen that flashes where each
// alpha particle lands. The foil stays a plain gold sheet until the learner has seen why it cannot be.
//   b0  most      a short volley: nearly all land straight behind the foil
//   b1  some      a long volley: some land wide, and now and then one lands back near the source
//   b2  why       inside one atom. The learner aims a particle at it, with the charge spread out or
//                 in one tiny place. Spread out, every shot bends a little. Packed, only a shot aimed
//                 almost at the centre is thrown back: that is the find.
//   b3  takeaway  back at the bench: the learner picks the model and the foil, and fires
// The volley rates are exaggerated (about 1 in 100 back, not 1 in 8000) and the chip says so. The
// atom's paths are real: a 1/r^2 push outside the charge, a weak linear push inside a spread sphere.
// Phone width: the theatre gives a scene with a long beat of text only 226 px of height, whatever the bar does,
// and the bar cannot make a 44 px target. So the frame is wider than it is tall by more (680 x 440), the bar
// stands down, and the controls are drawn in a row along the bottom. On the atom, pressing aims and letting go
// fires, as it does on every width. The focused canvas keeps the keyboard.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, chipRow, darken, drawVignette, font, inkOn, lighten, luma, mix, mulberry32, pill, rr } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { withCamera, zlerp } from 'simulations/base/kit/SimCamera.js';
import { ease, reducedMotion, hash2 } from 'simulations/base/kit/SimAnim.js';
import { drawBall, drawDepthField, drawElectron, drawFocus, drawNucleus, drawShell } from 'simulations/base/kit/SimAtom.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp01((t - a) / (b - a));

const CY = 236;                          // the chamber's axis
const SRC = { x: 66, y: CY };            // the source's muzzle
const FOIL_X = 330;
const ROW_DY = 46, ROWS = 9;             // virtual rows of nuclei in the foil
const SCREEN_R = 196;                    // the screen ring, centred on the foil
const SPEED = 380;                       // px/s
const BEAM = 54;                         // half-height of the beam at the foil
const K = 0.28;                          // deflection strength: theta = 2 atan(K / b)
const FIRE_DT = 0.03;
const VOLLEY = { 0: 44, 1: 170, 3: 150 };

// Inside one atom.
const AT = { x: 372, y: 236, R: 172 };
const NUC_R = 15;
const V = 300;                           // the particle's speed, px/s
const CLOSEST = 26;                      // head-on, it stops this far from the centre
const KQ = (V * V * CLOSEST) / 2;        // the push constant that gives that distance
const AIM_MAX = 150;
const START_X = 24;
const TRACES = 6;

const S_MOST = 0, S_SOME = 1, S_WHY = 2, S_FREE = 3;
const CAM_LAB = { x: 340, y: 260, z: 1 };
const LBL = 24;

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;   // read once: a turned phone keeps its layout
const MIN = 26;                          // over 12 CSS px at this frame's narrowest on a 390 phone
const fs = (px) => (PHONE ? Math.max(px, MIN) : px);
// The phone's bench: the chamber to the left, its counts in a column to the right, the controls under both.
const LAB = { x: 254, y: 170, z: 0.757 };
const COL = 432;                         // the column's left edge
const ATOM = { x: 358, y: 170, s: 0.96 };
const ROW = { x: 6, y: 346, w: 668, h: 94 };
const FIRE_WIDE = [{ id: 'fire', text: 'Fire', x: 190, w: 300 }];
const TAPS = {
  [S_MOST]: FIRE_WIDE,
  [S_SOME]: FIRE_WIDE,
  [S_WHY]: [
    { id: 'charge', v: 'spread', text: 'spread out', x: 14, w: 186 },
    { id: 'charge', v: 'tiny', text: 'one tiny place', x: 208, w: 236 },
  ],
  [S_FREE]: [
    { id: 'model', v: 'thomson', text: 'Thomson', x: 12, w: 150 },
    { id: 'model', v: 'nuclear', text: 'Rutherford', x: 166, w: 180 },
    { id: 'foil', v: 'thin', text: 'thin', x: 356, w: 96 },
    { id: 'foil', v: 'thick', text: 'thick', x: 456, w: 96 },
    { id: 'fire', text: 'Fire', x: 562, w: 106 },
  ],
};

const rowY = (i) => SRC.y + (i - (ROWS - 1) / 2) * ROW_DY;

export class GoldFoilScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static HEIGHT = PHONE ? 440 : 520;
  static IRIS = false;
  static BEAT_STEP_MAP = [S_MOST, S_SOME, S_WHY, S_FREE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'charge', label: 'Positive charge', value: 'tiny', options: [
      { value: 'spread', label: 'spread out' }, { value: 'tiny', label: 'in one tiny place' }] },
    { type: 'slider', id: 'aim', label: 'Aim away from centre', min: 0, max: AIM_MAX, step: 2, value: 70, suffix: '' },
    { type: 'segmented', id: 'model', label: 'Model', value: 'nuclear', options: [
      { value: 'thomson', label: 'Thomson' }, { value: 'nuclear', label: 'Rutherford' }] },
    { type: 'segmented', id: 'foil', label: 'Foil', value: 'thin', options: [
      { value: 'thin', label: 'thin' }, { value: 'thick', label: 'thick' }] },
    { type: 'button', id: 'fire', label: 'Fire' },
  ];
  static ARIA_LABEL = 'The gold foil experiment. A lead box fires alpha particles at a thin gold foil, and a ring of screen around the foil flashes where each one lands. Most land straight behind the foil, some land far to the side, and a few land back near the source. Then the view moves inside one atom and you aim a particle at it: with the positive charge spread out every shot bends only a little, and with the charge in one tiny place a shot aimed almost at the centre is thrown back. Last you choose Thomson\'s or Rutherford\'s model, and a thin or a thick foil, and fire.';

  constructor(container, config) {
    super(container, config);
    this._model = 'nuclear';
    this._foilKind = 'thin';
    this._charge = 'tiny';
    this._aim = 70;
    this._found = false;
    this._resetRun();
    this._shots = [];
    this._live = null;
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

  _resetRun() {
    this._rng = mulberry32(42);
    this._ps = [];                       // flying particles
    this._hits = [];                     // { a, kind, t } marks on the screen
    this._n = { pass: 0, wide: 0, back: 0 };
    this._fireT = 0;
    this._left = 0;
  }

  get _thomson() { return this.stage === S_MOST || (this.stage === S_FREE && this._model === 'thomson'); }

  enter(stage) {
    this._resetRun();
    this._model = 'nuclear';
    this._foilKind = 'thin';
    this._shots = [];
    this._live = null;
    this._pressed = false;
    if (stage === S_WHY) {
      this._charge = 'tiny';
      this._aim = 70;
      // The solved shot on a resumed beat is not owed: the find is the learner's to make.
      this._found = false;
      this._fireAtom(true);
    } else {
      this._left = VOLLEY[stage] ?? 0;
      if (reducedMotion()) this._prefill(this._left);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    if (PHONE) return true;
    if (id === 'fire') return false;
    if (id === 'charge' || id === 'aim') return this.stage !== S_WHY;
    return this.stage !== S_FREE;
  }

  isControlDisabled(id) { return id === 'fire' && this.busy(); }

  getControlValue(id) {
    if (id === 'model') return this._model;
    if (id === 'foil') return this._foilKind;
    if (id === 'charge') return this._charge;
    if (id === 'aim') return String(this._aim);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this._apply(id, v);
  }

  _apply(id, v) {
    if (id === 'charge') { this._charge = String(v); this._shots = []; }
    if (id === 'aim') { this._aim = Number(v); return; }
    if (id === 'model') this._model = String(v);
    if (id === 'foil') this._foilKind = String(v);
    if (id === 'fire') {
      if (this.stage === S_WHY) { this._fireAtom(false); return; }
    }
    if (this.stage !== S_WHY && (id === 'fire' || id === 'model' || id === 'foil')) {
      this._resetRun();
      this._left = VOLLEY[this.stage];
      if (reducedMotion()) this._prefill(this._left);
    }
    this.requestUiUpdate?.();
  }

  // On the atom: press to set the aim on the hero itself, release to fire.
  _aimFrom(p) {
    const off = PHONE ? (p.y - ATOM.y) / ATOM.s : p.y - AT.y;
    return Math.round(Math.min(AIM_MAX, Math.abs(off)) / 2) * 2;
  }

  // The phone's row. 'fire' keeps the bar's rule: not while the last run is going.
  _tap(p) {
    const t = TAPS[this.stage]?.find((q) => p.x >= q.x - 3 && p.x <= q.x + q.w + 3);
    if (!t || (t.id === 'fire' && this.busy())) return;
    this._apply(t.id, t.v);
  }

  // With the bar stood down, the keyboard works from the focused canvas. A key that changes nothing is left alone.
  _key(e) {
    const st = this.stage, k = e.key;
    let done = false;
    const pick = (id, cur, v) => { if (cur !== v) { this._apply(id, v); done = true; } };
    if (k === 'Enter' || k === ' ') {
      if (!this.busy()) this._apply('fire');
      done = true;
    } else if (st === S_WHY && (k === 'ArrowUp' || k === 'ArrowDown')) {
      this._aim = Math.max(0, Math.min(AIM_MAX, this._aim + (k === 'ArrowUp' ? 6 : -6)));
      done = true;
    } else if (st === S_WHY && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      pick('charge', this._charge, k === 'ArrowLeft' ? 'spread' : 'tiny');
    } else if (st === S_FREE && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      pick('model', this._model, k === 'ArrowLeft' ? 'thomson' : 'nuclear');
    } else if (st === S_FREE && (k === 'ArrowUp' || k === 'ArrowDown')) {
      pick('foil', this._foilKind, k === 'ArrowUp' ? 'thick' : 'thin');
    }
    if (done) { this.animateFor?.(); e.preventDefault(); }
  }

  pointerDown(p) {
    if (PHONE && p.y >= ROW.y - 6) { this._tap(p); return; }
    if (this.stage !== S_WHY || this._live) return;
    this._pressed = true;
    this._heldTouch = true;
    this._aim = this._aimFrom(p);
    this.requestUiUpdate?.();
  }

  pointerMove(p) {
    if (!this._pressed) return false;
    this._aim = this._aimFrom(p);
    return true;
  }

  pointerUp() {
    if (!this._pressed) return;
    this._pressed = false;
    this._fireAtom(false);
  }

  busy() {
    if (this.stage === S_WHY) return !!this._live || this.age < 1.4 || this._pressed;
    return this._left > 0 || this._ps.length > 0;
  }

  // ---- the volley --------------------------------------------------------------------------
  // Where a particle crossing the foil at height y goes. Spread charge nudges it by a degree or two; a
  // nucleus turns it by theta = 2 atan(K / b), b its miss distance from the nearest row. A thick foil
  // gives a particle three chances: it keeps the biggest turn.
  _scatter(y) {
    if (this._thomson) return (this._rng() - 0.5) * 0.05;
    const tries = this._foilKind === 'thick' ? 3 : 1;
    let best = 0;
    for (let k = 0; k < tries; k++) {
      const yy = k ? SRC.y + (this._rng() * 2 - 1) * BEAM : y;
      let b = 1e9, side = 1;
      for (let i = 0; i < ROWS; i++) { const d = yy - rowY(i); if (Math.abs(d) < Math.abs(b)) { b = d; side = Math.sign(d) || 1; } }
      const th = side * 2 * Math.atan(K / Math.max(0.02, Math.abs(b)));
      if (Math.abs(th) > Math.abs(best)) best = th;
    }
    // On the first volley the wide turns have not been seen yet.
    return this.stage === S_MOST ? best * 0.06 : best;
  }

  _land(th) {
    const dev = Math.abs(Math.atan2(Math.sin(th), Math.cos(th)));
    const kind = dev < 0.35 ? 'pass' : dev < 1.9 ? 'wide' : 'back';
    this._n[kind]++;
    this._hits.push({ a: th, kind, t: this.clock });
  }

  _prefill(n) {
    for (let i = 0; i < n; i++) this._land(this._scatter(SRC.y + (this._rng() * 2 - 1) * BEAM));
    this._left = 0;
  }

  _spawn() {
    const y = SRC.y + (this._rng() * 2 - 1) * BEAM;
    this._ps.push({ x: SRC.x, y0: SRC.y + (y - SRC.y) * 0.25, ty: y, y: SRC.y, vx: SPEED, vy: 0, crossed: false, th: 0 });
  }

  _step(p, d) {
    if (!p.crossed) {
      const u = clamp01((p.x - SRC.x) / (FOIL_X - SRC.x));
      p.x += SPEED * d;
      p.y = lerp(p.y0, p.ty, u);
      if (p.x >= FOIL_X) {
        p.crossed = true;
        p.x = FOIL_X; p.y = p.ty;
        p.th = this._scatter(p.ty);
        p.vx = SPEED * Math.cos(p.th); p.vy = SPEED * Math.sin(p.th);
      }
      return;
    }
    p.x += p.vx * d; p.y += p.vy * d;
    if (Math.hypot(p.x - FOIL_X, p.y - CY) >= SCREEN_R - 8) { p.done = true; this._land(Math.atan2(p.y - CY, p.x - FOIL_X)); }
  }

  // ---- one atom -----------------------------------------------------------------------------
  /** The push per unit mass at offset (dx, dy) from the centre. */
  _push(dx, dy) {
    const r = Math.max(4, Math.hypot(dx, dy));
    const R = AT.R;
    const f = this._charge === 'spread' && r < R ? (KQ * r) / (R * R * R) : KQ / (r * r);
    return [(f * dx) / r, (f * dy) / r];
  }

  _newShot(aim) { return { x: START_X, y: AT.y - aim, vx: V, vy: 0, path: [[START_X, AT.y - aim]], on: true, aim }; }

  _adv(s, d) {
    let left = d;
    while (left > 0) {
      const h = Math.min(left, 0.0015);
      const [ax, ay] = this._push(s.x - AT.x, s.y - AT.y);
      s.vx += ax * h; s.vy += ay * h;
      s.x += s.vx * h; s.y += s.vy * h;
      left -= h;
    }
    s.path.push([s.x, s.y]);
    if (s.x < -30 || s.x > 710 || s.y < -30 || s.y > 550) s.on = false;
  }

  _finish(s) {
    let n = 0;
    while (s.on && n++ < 2000) this._adv(s, 0.01);
    s.on = false;
  }

  _fireAtom(quiet) {
    if (this._live) return;
    const s = this._newShot(this._aim);
    s.quiet = quiet;
    if (quiet || reducedMotion()) { this._finish(s); this._done(s); return; }
    this._live = s;
    this.requestUiUpdate?.();
  }

  _done(s) {
    this._shots.push(s);
    if (this._shots.length > TRACES) this._shots.shift();
    this._live = null;
    const out = Math.atan2(s.vy, s.vx);
    const back = Math.abs(out) > Math.PI / 2;
    if (!s.quiet && back && this._charge === 'tiny' && !this._found) {
      this._found = true;
      this.celebrate(AT.x, AT.y, 30, { key: 'back', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  update(d) {
    if (this.stage === S_WHY) {
      if (this._live) {
        this._adv(this._live, d);
        if (!this._live.on) this._done(this._live);
      }
      return;
    }
    if (reducedMotion()) return;
    if (this.age < 0.25) return;
    this._fireT += d;
    while (this._fireT >= FIRE_DT && this._left > 0) { this._fireT -= FIRE_DT; this._left--; this._spawn(); }
    for (const p of this._ps) this._step(p, d);
    this._ps = this._ps.filter((p) => !p.done);
  }

  // ---- drawing ------------------------------------------------------------------------------
  _dive() { return this.stage === S_WHY ? (reducedMotion() ? 1 : ease.inOutCubic(seg(this.age, 0, 1.2))) : 0; }

  draw(ctx, c) {
    const dark = luma(c.bgDeep) < 0.5;
    const t = reducedMotion() ? 0 : this.clock;
    const k = this._dive();
    const P = this._pal(c, dark);
    if (k < 1) {
      const cam = PHONE ? { x: FOIL_X, y: CY, z: zlerp(LAB.z, 7, k) }
        : { x: lerp(CAM_LAB.x, FOIL_X, k), y: lerp(CAM_LAB.y, CY, k), z: zlerp(1, 7, k) };
      this._chamber(ctx, P, dark);
      withCamera(ctx, cam, (g) => {
        this._screen(g, c, P, t);
        this._source(g, c, P);
        this._beam(g, P);
        this._foil(g, c, P);
        this._particles(g, c, P);
      }, PHONE ? [LAB.x, LAB.y] : undefined);
      drawVignette(ctx, c, dark ? 0.7 : 0.35);
    }
    if (k > 0.5) {
      ctx.save();
      ctx.globalAlpha = seg(k, 0.5, 1);
      this._atomView(ctx, c, P);
      ctx.restore();
    } else this._readout(ctx, c, P);
    if (PHONE) this._row(ctx, c);
  }

  // The phone's controls, each 44 CSS px tall or more. The one picked wears the warning colour, as chips do here.
  _row(ctx, c) {
    const L = lookOf(), busy = this.busy(), y = ROW.y + 4, h = 86;
    rr(ctx, ROW.x, ROW.y, ROW.w, ROW.h, 18); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.25); ctx.lineWidth = 3; ctx.stroke();
    for (const t of TAPS[this.stage] ?? []) {
      const fire = t.id === 'fire';
      const on = !fire && t.v === (t.id === 'charge' ? this._charge : t.id === 'model' ? this._model : this._foilKind);
      const bg = fire ? c.accent : on ? c.warning : c.raised;
      ctx.save();
      ctx.globalAlpha *= fire && busy ? 0.45 : 1;
      rr(ctx, t.x, y + 3.5 * L.lip, t.w, h, L.pill); ctx.fillStyle = darken(bg, 0.38); ctx.fill();
      rr(ctx, t.x, y, t.w, h, L.pill); ctx.fillStyle = bg; ctx.fill();
      ctx.font = font(c, 800, fire ? 32 : 28, true); ctx.fillStyle = inkOn(c, bg);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x + t.w / 2, y + h / 2 + 1);
      ctx.restore();
    }
    if (this.stage === S_WHY) pill(ctx, c, this._found ? 'thrown back' : 'drag to aim', 560, ROW.y + ROW.h / 2, { bg: this._found ? c.good : c.warning, size: MIN, display: true });
  }

  _pal(c, dark) {
    return {
      gold: mix(c.gold, c.s8, 0.2),
      alpha: mix(c.s6, c.s8, 0.25),
      zns: mix(c.s3, c.good, 0.4),
      lead: mix(c.waste, c.bgSurface, dark ? 0.35 : 0.2),
      chamber: dark ? darken(mix(c.bgDeep, c.s5, 0.15), 0.35) : mix(c.bgDeep, c.s5, 0.1),
    };
  }

  _chamber(ctx, P, dark) {
    const cx = PHONE ? LAB.x : FOIL_X, cy = PHONE ? LAB.y : CY, r = PHONE ? (SCREEN_R + 22) * LAB.z : SCREEN_R + 22;
    const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 480);
    g.addColorStop(0, lighten(P.chamber, dark ? 0.08 : 0.04)); g.addColorStop(1, darken(P.chamber, dark ? 0.4 : 0.1));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    // The chamber's round base, a lit disc under the apparatus.
    const base = dark ? lighten(P.chamber, 0.09) : darken(P.chamber, 0.04);
    ctx.beginPath(); ctx.arc(cx, cy + 6, r, 0, TAU); ctx.fillStyle = darken(base, 0.22); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = base; ctx.fill();
  }

  // The screen: a chunky ring round the foil, open where the beam comes in.
  _screen(ctx, c, P, t) {
    const gap = 0.3;
    const body = mix(P.zns, P.chamber, 0.55);
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(body, 0.3); ctx.lineWidth = 22;
    ctx.beginPath(); ctx.arc(FOIL_X, CY, SCREEN_R, -Math.PI + gap, Math.PI - gap); ctx.stroke();
    ctx.strokeStyle = body; ctx.lineWidth = 17;
    ctx.beginPath(); ctx.arc(FOIL_X, CY, SCREEN_R, -Math.PI + gap, Math.PI - gap); ctx.stroke();
    ctx.lineCap = 'butt';
    for (const h of this._hits) {
      const x = FOIL_X + Math.cos(h.a) * SCREEN_R, y = CY + Math.sin(h.a) * SCREEN_R;
      const f = reducedMotion() ? 0 : Math.max(0, 1 - (t - h.t) / 0.8);
      if (f > 0) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 20);
        g.addColorStop(0, alpha(lighten(P.zns, 0.8), 0.95 * f)); g.addColorStop(1, alpha(P.zns, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = h.kind === 'pass' ? lighten(P.zns, 0.45) : h.kind === 'wide' ? c.s2 : c.s6;
      ctx.beginPath(); ctx.arc(x, y, h.kind === 'pass' ? 3.5 : 6, 0, TAU); ctx.fill();
    }
  }

  _source(ctx, c, P) {
    const x = SRC.x - 52, y = SRC.y - 36, w = 58, h = 72;
    rr(ctx, x, y + 5, w, h, 9); ctx.fillStyle = darken(P.lead, 0.42); ctx.fill();
    rr(ctx, x, y, w, h, 9); ctx.fillStyle = P.lead; ctx.fill();
    rr(ctx, x + 6, y + 6, w - 22, 10, 5); ctx.fillStyle = lighten(P.lead, 0.28); ctx.fill();
    ctx.fillStyle = darken(P.lead, 0.6); ctx.fillRect(x + w - 10, SRC.y - 5, 12, 10);
    drawBall(ctx, c, SRC.x - 14, SRC.y, 7, P.alpha, { focus: 0.7 });
  }

  _beam(ctx, P) {
    ctx.fillStyle = alpha(P.alpha, 0.14);
    ctx.beginPath(); ctx.moveTo(SRC.x, SRC.y - 4); ctx.lineTo(FOIL_X, SRC.y - BEAM); ctx.lineTo(FOIL_X, SRC.y + BEAM); ctx.lineTo(SRC.x, SRC.y + 4); ctx.closePath(); ctx.fill();
  }

  // The foil, edge on: a gold strip. Thick when the learner asks for it.
  _foil(ctx, c, P) {
    const w = this._foilKind === 'thick' ? 26 : 12;
    const top = CY - 104, h = 208;
    rr(ctx, FOIL_X - w / 2, top + 4, w, h, 5); ctx.fillStyle = darken(P.gold, 0.4); ctx.fill();
    rr(ctx, FOIL_X - w / 2, top, w, h, 5); ctx.fillStyle = P.gold; ctx.fill();
    rr(ctx, FOIL_X - w / 2 + 2.5, top + 6, Math.max(2.5, w * 0.22), h - 12, 2); ctx.fillStyle = lighten(P.gold, 0.5); ctx.fill();
  }

  _particles(ctx, c, P) {
    for (const p of this._ps) {
      const sp = Math.hypot(p.vx, p.vy) || 1;
      ctx.strokeStyle = alpha(P.alpha, 0.5); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x - (p.vx / sp) * 18, p.y - (p.vy / sp) * 18); ctx.lineTo(p.x, p.y); ctx.stroke();
      drawBall(ctx, c, p.x, p.y, 5, P.alpha);
    }
    ctx.lineCap = 'butt';
  }

  // Inside one gold atom. The nucleus is drawn far too big: at scale it would be under a pixel.
  _atomView(ctx, c, P) {
    drawDepthField(ctx, c, { x: AT.x, y: AT.y, seed: 11 });
    const spread = this._charge === 'spread';
    ctx.save();
    if (PHONE) { ctx.translate(ATOM.x, ATOM.y); ctx.scale(ATOM.s, ATOM.s); ctx.translate(-AT.x, -AT.y); }
    if (spread) {
      ctx.beginPath(); ctx.arc(AT.x, AT.y, AT.R, 0, TAU);
      ctx.fillStyle = alpha(c.proton, luma(c.bgDeep) < 0.5 ? 0.26 : 0.2); ctx.fill();
      ctx.strokeStyle = alpha(c.proton, 0.75); ctx.lineWidth = 4; ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = hash2(i, 3) * TAU, r = AT.R * Math.sqrt(0.08 + 0.8 * hash2(i, 4));
        const x = AT.x + Math.cos(a) * r, y = AT.y + Math.sin(a) * r;
        ctx.strokeStyle = alpha(c.proton, 0.8); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
        ctx.lineCap = 'butt';
      }
    } else {
      drawShell(ctx, c, AT.x, AT.y, AT.R - 4, { band: 0, line: 3, dim: 0.35 });
      drawFocus(ctx, c, AT.x, AT.y, NUC_R, 1);
      drawNucleus(ctx, c, AT.x, AT.y, { p: 79, n: 118, r: NUC_R, solid: true, label: '' });
    }
    for (let e = 0; e < 8; e++) {
      const a = hash2(e, 7) * TAU, r = (spread ? 40 : 96) + hash2(e, 9) * (spread ? 118 : 70);
      drawElectron(ctx, c, AT.x + Math.cos(a) * r, AT.y + Math.sin(a) * r, 6);
    }
    // Earlier shots stay as paths, so a fan of them can be compared.
    for (const s of this._shots) this._trace(ctx, s, alpha(P.alpha, 0.55));
    if (this._live) {
      this._trace(ctx, this._live, alpha(P.alpha, 0.85));
      drawBall(ctx, c, this._live.x, this._live.y, 10, P.alpha, { focus: 0.7 });
    }
    // The launcher, at the height the learner chose.
    const ly = AT.y - this._aim;
    drawBall(ctx, c, 20, ly, 12, P.alpha, { dim: this._live ? 0.5 : 0, focus: this._live ? 0 : 0.6 });
    ctx.fillStyle = alpha(c.label, 0.55);
    ctx.beginPath(); ctx.moveTo(40, ly - 8); ctx.lineTo(54, ly); ctx.lineTo(40, ly + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (PHONE) {   // the row names the charge and carries the hint
      pill(ctx, c, 'nucleus drawn far too big', 10, 316, { bg: c.raised, ink: c.labelMuted, size: MIN, align: 'left' });
      return;
    }
    pill(ctx, c, spread ? 'spread out' : 'one tiny place', AT.x, 34, { bg: c.raised, ink: c.label, size: LBL, display: true });
    pill(ctx, c, 'nucleus drawn far too big', 14, 490, { bg: c.raised, ink: c.labelMuted, size: 18, align: 'left' });
    pill(ctx, c, this._found ? 'thrown back' : 'drag to aim', 560, 484, { bg: this._found ? c.good : c.warning, size: LBL, display: true });
  }

  _trace(ctx, s, col) {
    if (s.path.length < 2) return;
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    s.path.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // What the screen has counted: three big chips, the rare ones in their own colours.
  _readout(ctx, c, P) {
    const { pass, wide, back } = this._n;
    if (PHONE) { this._readoutPhone(ctx, c, P); return; }
    chipRow(ctx, c, [
      { text: `through ${pass}`, bg: lighten(P.zns, 0.1) },
      { text: `aside ${wide}`, bg: c.s2 },
      { text: `back ${back}`, bg: c.s6 },
    ], 340, 480, { size: LBL, display: true, align: 'center', gap: 10 });
    if (this.stage === S_MOST) {
      pill(ctx, c, 'gold foil', FOIL_X, 104, { bg: P.gold, size: LBL, display: true });
      pill(ctx, c, 'screen', FOIL_X + 214, 400, { bg: lighten(P.zns, 0.1), size: LBL, display: true });
      pill(ctx, c, 'alpha particles', 112, 158, { bg: P.alpha, size: LBL, display: true });
    }
    if (this.stage === S_FREE) pill(ctx, c, this._model === 'thomson' ? 'Thomson' : 'Rutherford', 14, 30, { bg: c.raised, ink: c.label, size: LBL, display: true, align: 'left' });
    if (this.stage !== S_MOST) pill(ctx, c, 'rates exaggerated', 666, 30, { bg: c.raised, ink: c.labelMuted, size: 18, align: 'right' });
  }

  // The same words, in the column beside the chamber.
  _readoutPhone(ctx, c, P) {
    const { pass, wide, back } = this._n, chip = (text, x, y, o) => pill(ctx, c, text, x, y, { size: MIN, display: true, align: 'left', ...o });
    chip(`through ${pass}`, COL, 34, { bg: lighten(P.zns, 0.1) });
    chip(`aside ${wide}`, COL, 84, { bg: c.s2 });
    chip(`back ${back}`, COL, 134, { bg: c.s6 });
    if (this.stage === S_MOST) {
      pill(ctx, c, 'gold foil', LAB.x, 58, { bg: P.gold, size: MIN, display: true });
      chip('screen', COL, 214, { bg: lighten(P.zns, 0.1) });
      chip('alpha particles', 8, 104, { bg: P.alpha });
    }
    if (this.stage === S_FREE) chip(this._model === 'thomson' ? 'Thomson' : 'Rutherford', COL, 214, { bg: c.raised, ink: c.label });
    if (this.stage !== S_MOST) pill(ctx, c, 'rates exaggerated', 672, 300, { bg: c.raised, ink: c.labelMuted, size: MIN, align: 'right' });
  }
}
