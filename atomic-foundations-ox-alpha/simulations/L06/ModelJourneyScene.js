// ModelJourneyScene - companion to blk-l06-s6, "Five Models of the Atom" (book Fig 8.16).
// One big model at a time, on a line of dates. On the first three the learner says what broke it, from
// three results they have met; a right answer marks the model as replaced. Bohr's stays, for the module.
//   b0 dalton  b1 thomson  b2 rutherford  b3 bohr  b4 clouds
// Phone width: the theatre gives a scene with a long beat of text only 226 px of height, whatever the bar does,
// and the bar cannot make a 44 px target. So the frame is wider than it is tall by more (680 x 440), the bar
// stands down, and the three answers already in the canvas become a row of large buttons. Keys 1, 2, 3 on the
// focused canvas pick them.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, font, inkOn, mix, mulberry32, outBack, rr } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawBall, drawCharge, drawDepthField, drawElectron, drawFocus, drawNucleus, drawShell } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';

const TAU = Math.PI * 2;
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;   // read once: a turned phone keeps its layout
const MIN = 26;                          // over 12 CSS px at this frame's narrowest on a 390 phone
const fs = (px) => (PHONE ? Math.max(px, MIN) : px);
const A = PHONE ? { x: 150, y: 150, R: 124 } : { x: 340, y: 176, R: 142 };
const LINE_Y = PHONE ? 306 : 362;        // the line of dates
const TEXT_X = 476;                      // phone: the model's name and note sit beside it
const ROW = { x: 6, y: 346, w: 668, h: 94 };
const MODELS = [
  { name: 'Dalton', year: '1808', note: 'a solid ball', broke: 0 },
  { name: 'Thomson', year: '1904', note: 'electrons in a sphere', broke: 1 },
  { name: 'Rutherford', year: '1911', note: 'a tiny nucleus', broke: 2 },
  { name: 'Bohr', year: '1913', note: 'fixed shells' },
  { name: '', year: 'today', note: 'electron clouds' },
];
const ANSWERS = ['electrons', 'bounced back', 'stable atoms'];
const QY = PHONE ? 392 : 482;

export class ModelJourneyScene extends SimScene {
  static HEIGHT = PHONE ? 440 : 520;
  static BEAT_STEP_MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'broke', label: 'What broke it?', value: '', options: ANSWERS.map((a, i) => ({ value: String(i), label: a })) },
  ];
  static ARIA_LABEL = 'Five models of the atom on a line of dates. Dalton, 1808, a solid ball. Thomson, 1904, a sphere of positive charge with electrons set in it like seeds in a watermelon. Rutherford, 1911, a tiny nucleus with electrons going round it. Bohr, 1913, fixed shells. Today, electron clouds around the nucleus. On the first three you choose the result that the model could not explain.';

  constructor(container, config) {
    super(container, config);
    this._picked = null;
    this._boxes = [];
    this._ok = {};
  }

  async setup() {
    await super.setup();
    if (!PHONE) return;
    this._onKey = (e) => this._key(e);
    this._canvas?.setAttribute('tabindex', '0');
    this._canvas?.addEventListener('keydown', this._onKey);
  }

  destroy() {
    if (this._onKey) this._canvas?.removeEventListener('keydown', this._onKey);
    super.destroy();
  }

  _key(e) {
    const i = ['1', '2', '3'].indexOf(e.key);
    if (this.stage > 2 || i < 0) return;
    this.animateFor?.();
    this._pick(i);
    e.preventDefault();
  }

  enter() { this._picked = null; this._ok = {}; this._boxes = []; }

  isControlHidden() { return PHONE || this.stage > 2; }
  getControlValue(id) { return id === 'broke' ? String(this._picked ?? '') : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    this._pick(Number(v));
  }

  _pick(i) {
    this._picked = i;
    const m = MODELS[this.stage];
    this.requestUiUpdate?.();
    if (i === m.broke) this._right();
    else this.oops(A.x, A.y);
  }

  _right() {
    if (this._ok[this.stage]) return;
    this._ok[this.stage] = true;
    this.celebrate(A.x, A.y, 12, { key: `m${this.stage}`, small: true, lookAt: true });
  }

  pointerDown(p) {
    if (this.stage > 2) return;
    const b = this._boxes.find((q) => p.x >= q.x0 && p.x <= q.x0 + q.w && p.y >= q.y0 - 6 && p.y <= q.y0 + q.h + 6);
    if (b) this._pick(b.i);
  }

  busy() { return this.age < 1; }

  draw(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const u = outBack(clamp01(age / 0.5)), st = this.stage;
    drawDepthField(ctx, c, { x: A.x, y: A.y, seed: 51 });
    const R = A.R * u, { x, y } = A;
    if (st === 0) drawBall(ctx, c, x, y, Math.max(4, R), mix(c.s5, c.neutron, 0.4));
    if (st === 1) this._thomson(ctx, c, x, y, R);
    if (st === 2) {
      drawShell(ctx, c, x, y, R * 0.98, { band: 0, line: 3.5 });
      drawFocus(ctx, c, x, y, 13, 1);
      drawNucleus(ctx, c, x, y, { p: 8, n: 8, r: Math.max(4, 13 * u), solid: true, label: '' });
      for (const a of [0.5, 2.6, 4.4]) drawElectron(ctx, c, x + Math.cos(a) * R * 0.98, y + Math.sin(a) * R * 0.98, 13);
    }
    if (st === 3) drawAtom(ctx, c, x, y, { shells: [2, 6], p: 8, n: 8, radius: Math.max(40, R), nucleusR: 32, er: 12, seed: 2 });
    if (st === 4) this._cloud(ctx, c, x, y, R);
    this._line(ctx, c);
    const m = MODELS[st];
    tag(ctx, c, m.note, PHONE ? TEXT_X : 340, PHONE ? 110 : 28, { size: fs(24) });
    if (st <= 2) (PHONE ? this._quizRow : this._quiz).call(this, ctx, c, m);
    else tag(ctx, c, st === 3 ? 'we will use this one' : 'where it is likely to be', 340, QY, { bg: st === 3 ? c.good : c.warning, size: 26 });
  }

  _thomson(ctx, c, x, y, R) {
    drawBall(ctx, c, x, y, Math.max(4, R), c.proton);
    const seeds = [[0, 0], [0.5, -0.5], [-0.52, -0.42], [0.62, 0.18], [-0.66, 0.2], [0.22, 0.62], [-0.3, 0.6], [0.02, -0.72]];
    for (const [sx, sy] of seeds) {
      const ex = x + sx * R, ey = y + sy * R;
      drawElectron(ctx, c, ex, ey, 14);
      drawCharge(ctx, c, ex, ey, 14, -1, inkOn(c, c.electron));
    }
  }

  // A cloud: seeded dots, thick near the nucleus and thinning out. No path, no ring.
  _cloud(ctx, c, x, y, R) {
    const rnd = mulberry32(12);
    for (let i = 0; i < 900; i++) {
      const a = rnd() * TAU, r = R * Math.min(1, -Math.log(1 - rnd() * 0.98) * 0.3);
      ctx.fillStyle = alpha(c.electron, 0.55);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 3.2, 0, TAU); ctx.fill();
    }
    drawNucleus(ctx, c, x, y, { p: 8, n: 8, r: 22, seed: 2 });
  }

  // The line of dates, the current one lit.
  _line(ctx, c) {
    const y = LINE_Y;
    rr(ctx, 40, y - 4, 600, 8, 4); ctx.fillStyle = alpha(c.label, 0.3); ctx.fill();
    MODELS.forEach((m, i) => {
      const x = 76 + i * 132, on = i === this.stage;
      tag(ctx, c, m.year, x, y, { size: on ? 28 : fs(22), bg: on ? c.warning : c.raised });
      if (on && m.name) {
        if (PHONE) tag(ctx, c, m.name, TEXT_X, 164, { size: 28 });
        else tag(ctx, c, m.name, x > 500 ? 560 : x < 180 ? 118 : x, y + 44, { size: 26 });
      }
    });
  }

  // The phone's answers, each 44 CSS px tall or more.
  _quizRow(ctx, c, m) {
    const L = lookOf(), ok = this._ok[this.stage], w = 212, h = 86, y = ROW.y + 4;
    rr(ctx, ROW.x, ROW.y, ROW.w, ROW.h, 18); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.25); ctx.lineWidth = 3; ctx.stroke();
    this._boxes = ANSWERS.map((a, i) => {
      const x = 12 + i * (w + 10);
      const right = ok && i === m.broke, wrong = this._picked === i && i !== m.broke, bg = right ? c.good : wrong ? c.bad : c.raised;
      ctx.save();
      ctx.globalAlpha *= ok && !right ? 0.45 : 1;
      rr(ctx, x, y + 3.5 * L.lip, w, h, L.pill); ctx.fillStyle = darken(bg, 0.38); ctx.fill();
      rr(ctx, x, y, w, h, L.pill); ctx.fillStyle = bg; ctx.fill();
      ctx.font = font(c, 800, 28, true); ctx.fillStyle = inkOn(c, bg);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a, x + w / 2, y + h / 2 + 1);
      ctx.restore();
      return { x0: x, y0: y, w, h, i };
    });
  }

  _quiz(ctx, c, m) {
    const ok = this._ok[this.stage];
    const w = [168, 190, 186], gap = 12;
    let x = 340 - (w[0] + w[1] + w[2] + 2 * gap) / 2;
    this._boxes = ANSWERS.map((a, i) => {
      const right = ok && i === m.broke, wrong = this._picked === i && i !== m.broke;
      const box = tag(ctx, c, a, x + w[i] / 2, QY, { size: 24, bg: right ? c.good : wrong ? c.bad : c.raised, alpha: ok && !right ? 0.45 : 1 });
      const out = { ...box, i };
      x += w[i] + gap;
      return out;
    });
  }
}
