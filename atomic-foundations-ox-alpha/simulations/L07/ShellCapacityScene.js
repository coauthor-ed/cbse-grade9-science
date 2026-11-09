// ShellCapacityScene - companion to blk-l07-s1, "How Many Electrons Fit in a Shell?".
// One big atom with empty places on K, L and M, beside the 2n^2 card.
//   b0  capacity   the places fill in order: 2 on K, 8 on L, 18 on M; each row of the card lights
//   b1  octet-cap  K and L are full and M is outermost: 8 of its 18 places stay open, 10 close
//   b2  order      the learner places sodium's 11 electrons by tapping a shell. A shell that is not
//                  next refuses, and says why. The last electron gives 2,8,1.
// Every run is timed on the scene's clock and covered by busy(); "Fill again" replays b0.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, clamp01 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawNucleus, drawShell, drawSeat, drawElectron, shellPoints, drawFocus } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, SHELL, at } from './AtomBoard.js';

const CX = 232, CY = 262;
const RADII = [78, 134, 190];
const NUC = 44;
const ER = 11;
const SEATS = [2, 8, 18];
const S_CAP = 0, S_OCTET = 1, S_ORDER = 2;
const TAG_A = [3.44, 2.26, 2.35];     // angles on each ring that fall between two places
const NEED = [2, 8, 1];                // sodium
const PANEL = { x: 444, y: 26, w: 222, h: 468 };
const ROW_Y = [150, 240, 330];
const ROW_H = 76;

// M's places left open while it is outermost: 8 of 18, spread round the ring.
const M_OPEN = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => Math.round(i * 2.25));
// When each place fills on b0: K, then L, then M.
const STEP = [0.42, 0.14, 0.07];
const START = [0.7, 1.75, 3.05];
const fillAt = (s, i) => START[s] + i * STEP[s];
const CAP_END = fillAt(2, 17) + 0.6;
const OCT_END = 1.6;

const places = (s) => shellPoints(RADII[s], 0, s * 0.3, { capacity: SEATS[s], even: true, er: ER });

export class ShellCapacityScene extends SimScene {
  static BEAT_STEP_MAP = [S_CAP, S_OCTET, S_ORDER].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'replay', label: 'Fill again' },
    { type: 'button', id: 's0', label: 'Add to K' },
    { type: 'button', id: 's1', label: 'Add to L' },
    { type: 'button', id: 's2', label: 'Add to M' },
  ];
  static ARIA_LABEL =
    'A big atom with empty places on three shells, K, L and M, beside a card with the rule 2 n squared. '
    + 'K fills with 2 electrons, L with 8 and M with 18. Next, while M is the outermost shell only 8 of its '
    + 'places stay open and the other 10 close. Last, you place the 11 electrons of sodium by tapping a shell. '
    + 'K must fill before L and L before M, and the atom ends with 2, 8, 1.';

  constructor(container, config) {
    super(container, config);
    this._t = 0;
    this._n = [0, 0, 0];      // electrons placed on b2
    this._said = 0;           // the time of the last refusal, for its chip
    this._why = '';
    this._born = -9;          // when the newest electron landed
    this._found = false;
  }

  enter() {
    this._t = reducedMotion() ? 99 : 0;
    this._n = [0, 0, 0];
    this._why = '';
    this._born = -9;
    this._found = false;
  }

  isControlHidden(id) { return id === 'replay' ? this.stage !== S_CAP : this.stage !== S_ORDER; }
  isControlDisabled(id) { return id === 'replay' ? this.busy() : this._found; }
  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'replay') { this._t = 0; this.requestUiUpdate?.(); return; }
    this._place(Number(id.slice(1)));
  }

  get _end() { return this.stage === S_CAP ? CAP_END : this.stage === S_OCTET ? OCT_END : 0.8; }
  busy() { return this._t < this._end || this.age - this._born < 0.6; }
  update(d) { if (this._t < this._end) this._t = Math.min(this._end, this._t + d); }

  /** The shell the next electron must go to, or -1 when sodium is complete. */
  _next() { return NEED.findIndex((v, i) => this._n[i] < v); }

  pointerDown(p) {
    if (this.stage !== S_ORDER || this._found) return;
    const d = Math.hypot(p.x - CX, p.y - CY);
    const s = RADII.findIndex((r) => Math.abs(d - r) < 28);
    if (s >= 0) this._place(s);
  }

  _place(s) {
    const next = this._next();
    if (s !== next) {
      this._why = s > next ? `${SHELL[next]} is not full yet` : `${SHELL[s]} is full`;
      this._said = this.age;
      this.oops(CX, CY - RADII[s]);
      this.animateFor?.(1800);
      return;
    }
    this._n[s] += 1;
    this._why = '';
    this._born = this.age;
    this.animateFor?.();
    if (this._next() < 0) {
      this._found = true;
      this.celebrate(CX, CY, 28, { key: 'sodium-241', lookAt: 'scene' });
    }
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: CX, y: CY, seed: 11, n: 9 });
    const t = this._t;
    for (let s = 2; s >= 0; s--) {
      const k = this.stage === S_CAP ? popIn(t, s * 0.12) : 1;
      const active = this.stage === S_OCTET ? s === 2 : this.stage === S_ORDER && !this._found && s === this._next();
      drawShell(ctx, c, CX, CY, RADII[s] * (0.8 + 0.2 * Math.min(1, k)), { active });
    }
    at(ctx, CX, CY, popIn(this.stage === S_CAP ? t : 1, 0), () => {
      drawNucleus(ctx, c, 0, 0, { p: 11, n: 12, r: NUC });
    });
    for (let s = 0; s < 3; s++) this._places(ctx, c, s);
    for (let s = 0; s < 3; s++) tag(ctx, c, SHELL[s], CX + RADII[s] * Math.cos(TAG_A[s]), CY + RADII[s] * Math.sin(TAG_A[s]), { size: 22, bg: c.bgSurface });
    this._card(ctx, c);
  }

  _places(ctx, c, s) {
    const pts = places(s), t = this._t;
    pts.forEach((q, i) => {
      const x = CX + q.x, y = CY + q.y;
      if (this.stage === S_CAP) {
        const f = clamp01((t - fillAt(s, i)) / 0.3);
        if (f > 0) drawElectron(ctx, c, x, y, Math.max(3, ER * popIn(t, fillAt(s, i), 0.3)));
        else drawSeat(ctx, c, x, y, s === 2 ? ER - 2 : ER);
        return;
      }
      if (this.stage === S_OCTET) {
        if (s < 2) { drawElectron(ctx, c, x, y, ER); return; }
        if (M_OPEN.includes(i)) { drawSeat(ctx, c, x, y, ER, { focus: 0.8 }); return; }
        const k = ease.smooth(clamp01((t - 0.3 - (i % 5) * 0.08) / 0.4));
        drawSeat(ctx, c, x, y, ER - 2, { dim: 0.85 * k });
        if (k > 0.4) this._shut(ctx, c, x, y, k);
        return;
      }
      if (s === 2 && !M_OPEN.includes(i)) return;
      const list = s === 2 ? M_OPEN : pts.map((_, j) => j);
      const pos = list.indexOf(i);
      if (pos < this._n[s]) {
        const newest = pos === this._n[s] - 1 && s === this._lastShell();
        if (newest) drawFocus(ctx, c, x, y, ER, 1 - clamp01((this.age - this._born) / 0.6));
        drawElectron(ctx, c, x, y, Math.max(3, ER * (newest ? popIn(this.age, this._born, 0.35) : 1)));
      } else drawSeat(ctx, c, x, y, s === 2 ? ER - 2 : ER, { dim: s === this._next() ? 0 : 0.55 });
    });
  }

  _lastShell() {
    for (let s = 2; s >= 0; s--) if (this._n[s] > 0) return s;
    return 0;
  }

  /** A closed place: a small bar across it. */
  _shut(ctx, c, x, y, k) {
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.strokeStyle = c.bad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.stroke();
    ctx.restore();
  }

  _card(ctx, c) {
    const { x, y, w, h } = PANEL;
    drawCard(ctx, c, x, y, w, h, 1, { accent: c.accent });
    const cx = x + w / 2, t = this._t;
    if (this.stage === S_ORDER) { this._sodium(ctx, c, cx); return; }
    say(ctx, c, '2n²', cx, y + 56, { size: 58, col: c.s2ink });
    const rows = ['2 × 1²', '2 × 2²', '2 × 3²'];
    rows.forEach((text, s) => {
      const on = this.stage === S_OCTET || t >= fillAt(s, 0);
      const ry = ROW_Y[s];
      ctx.save();
      ctx.globalAlpha *= on ? 1 : 0.4;
      say(ctx, c, SHELL[s], x + 18, ry + ROW_H / 2, { align: 'left', size: 32, col: c.electron });
      say(ctx, c, text, x + 56, ry + ROW_H / 2, { align: 'left', size: 26 });
      const closed = this.stage === S_OCTET && s === 2;
      say(ctx, c, `${SEATS[s]}`, x + w - 16, ry + ROW_H / 2, { align: 'right', size: 38, col: closed ? c.labelMuted : c.label });
      if (closed) {
        ctx.strokeStyle = c.bad; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + w - 62, ry + ROW_H / 2 + 12); ctx.lineTo(x + w - 12, ry + ROW_H / 2 - 12); ctx.stroke();
      }
      ctx.restore();
    });
    if (this.stage === S_OCTET) {
      const p = popIn(t, 0.9);
      if (p > 0) tag(ctx, c, 'outermost: 8', cx, 446, { bg: c.warning, scale: Math.min(1.05, p) });
    }
  }

  _sodium(ctx, c, cx) {
    say(ctx, c, 'sodium', cx, 66, { size: 34 });
    const left = 11 - this._n[0] - this._n[1] - this._n[2];
    say(ctx, c, this._found ? '11 placed' : `${left} left`, cx, 108, { size: 26, col: c.labelMuted });
    for (let s = 0; s < 3; s++) {
      const on = s === this._next();
      const y = 180 + s * 76;
      say(ctx, c, SHELL[s], PANEL.x + 46, y, { size: 38, col: c.electron });
      say(ctx, c, this._n[s], PANEL.x + PANEL.w - 54, y, { size: 44, col: on ? c.s2ink : c.label });
    }
    if (this._found) say(ctx, c, '2,8,1', cx, 432, { size: 58, col: c.s2ink });
    else if (this._why && this.age - this._said < 1.8) tag(ctx, c, this._why, cx, 432, { bg: c.bad, size: 22 });
    else tag(ctx, c, 'tap a shell', cx, 432, { size: 22, bg: c.bgSurface });
  }
}
