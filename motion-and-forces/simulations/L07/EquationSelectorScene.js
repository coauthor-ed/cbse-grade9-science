import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawLabelPill, wrapText, FORCE_COLORS, RADIUS } from '../shared/PhysicsSceneKit.js';

/**
 * EquationSelectorScene — companion to q-l07-s10 (the free-fall
 * "time isn't given" equation-choice question).
 *
 * Process Statement: each of the three kinematic equations is missing
 * exactly one of the five quantities (u, v, a, s, t) — an equation is
 * usable the moment at most one of ITS OWN four variables is still unknown
 * (three known, solve for the fourth). Recognising which variable your
 * problem doesn't give you is the entire "which equation do I use" skill;
 * this scene turns that recognition into something the student does with
 * their hands, not something they're told once.
 *
 * Five toggle buttons (u, v, a, s, t) mark a variable "known". Each of the
 * three equation cards continuously re-evaluates against the current known
 * set and glows green the instant it has three or more of its four
 * variables known — genuinely live, not a canned reveal — so a student can
 * toggle any combination, not just the one worked example, and immediately
 * see which equations that combination unlocks.
 */

const W = 900;
const H = 600;

const VARS = ['u', 'v', 'a', 's', 't'];
const VAR_LABELS = { u: 'u (initial v)', v: 'v (final v)', a: 'a (accel.)', s: 's (distance)', t: 't (time)' };

const EQUATIONS = [
  { id: 'vuat', text: 'v = u + at', vars: ['u', 'v', 'a', 't'], missing: 's' },
  { id: 'sut', text: 's = ut + ½at²', vars: ['u', 's', 'a', 't'], missing: 'v' },
  { id: 'v2u2', text: 'v² = u² + 2as', vars: ['u', 'v', 'a', 's'], missing: 't' },
];

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  chip:    ['--sim-series-1', '#38bdf8'],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
};

// each beat pre-sets a known-set to walk through the free-fall example,
// then beat 3 hands full control to the student
const BEAT_KNOWNS = [
  { u: false, v: false, a: false, s: false, t: false },
  { u: true, v: false, a: true, s: true, t: false },   // the free-fall problem's givens
  { u: true, v: false, a: true, s: true, t: false },
  null, // freeplay — student's own toggles take over
];

const STEPS = [
  { caption: 'Five quantities describe any constant-acceleration motion: u, v, a, s, t.' },
  { caption: 'A free-fall problem gives you u, a and s — but not t. Watch which equations that unlocks.' },
  { caption: 'v² = u² + 2as needs only u, a and s — nothing else. That’s the one to reach for.' },
  { caption: 'Now you try: toggle any combination of knowns and see which equations light up.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class EquationSelectorScene extends CanvasSimulation {
  static simId = 'equation-selector';
  static label = { en: 'Which kinematic equation applies?' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Five toggle buttons for the quantities u, v, a, s and t. Three equation cards each list the four ' +
    'quantities they involve and glow green the instant at most one of those four is still unknown, showing ' +
    'live which equation is usable for the current set of known quantities.';

  static CONTROLS = VARS.map((v) => ({ type: 'button', id: `toggle-${v}`, label: VAR_LABELS[v] }));

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;

    this._known = { u: false, v: false, a: false, s: false, t: false };
    this._glow = {}; // eqId -> 0..1 pulse when it newly becomes usable
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._canvas.tabIndex = 0;
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce(STEPS[0].caption);
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() {
    this.colors = readSimColors(this.container, COLOR_TOKEN_MAP);
  }

  onBeatChange(beatIndex) {
    this._lessonLinked = true;
    const clamped = Math.max(0, Math.min(beatIndex, BEAT_STEP_MAP.length - 1));
    const chain = BEAT_STEP_MAP[clamped];
    this._beatChain = chain;
    this._beatChainPos = 0;
    this._beatChainDwell = chain[0].dwellMs != null ? chain[0].dwellMs / 1000 : null;
    this._jumpToStep(chain[0].idx);
  }

  _jumpToStep(i) {
    this.stepIndex = Math.max(0, Math.min(STEPS.length - 1, i));
    this._stepEnterTime = 0;
    const preset = BEAT_KNOWNS[this.stepIndex];
    if (preset) this._known = { ...preset };
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id) {
    const v = id.replace('toggle-', '');
    if (!VARS.includes(v)) return;
    this._known[v] = !this._known[v];
    this._announce(`${VAR_LABELS[v]} is now ${this._known[v] ? 'known' : 'unknown'}.`);
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _tickBeatChain(dt) {
    if (!this._lessonLinked || this._beatChainDwell == null) return;
    this._beatChainDwell -= dt;
    if (this._beatChainDwell > 0) return;
    this._beatChainPos++;
    const next = this._beatChain?.[this._beatChainPos];
    if (!next) { this._beatChainDwell = null; return; }
    this._jumpToStep(next.idx);
    this._beatChainDwell = next.dwellMs != null ? next.dwellMs / 1000 : null;
  }

  _drawInitialFrame(ctx) {
    this._tick(ctx, 0);
  }

  _isUsable(eq) {
    const unknownCount = eq.vars.filter((v) => !this._known[v]).length;
    return unknownCount <= 1;
  }

  _drawScene(ctx, step) {
    const c = this.colors;

    // variable chips
    const chipY = 110;
    const chipGap = 150;
    const chipX0 = W / 2 - (chipGap * (VARS.length - 1)) / 2;
    VARS.forEach((v, i) => {
      const x = chipX0 + i * chipGap;
      const known = this._known[v];
      ctx.save();
      ctx.fillStyle = known ? SimDraw.withAlpha(c.good, 0.22) : SimDraw.withAlpha(c.chip, 0.1);
      ctx.strokeStyle = known ? c.good : c.chip;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - 58, chipY - 28, 116, 56, RADIUS.panel);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = known ? c.good : c.label;
      ctx.font = '700 16px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(VAR_LABELS[v], x, chipY + 5);
      ctx.font = '600 11px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.fillText(known ? 'known' : 'unknown', x, chipY + 40);
      ctx.restore();
    });

    // equation cards
    const cardY0 = 220;
    const cardH = 100;
    const cardGap = 16;
    EQUATIONS.forEach((eq, i) => {
      const y = cardY0 + i * (cardH + cardGap);
      const usable = this._isUsable(eq);
      ctx.save();
      ctx.fillStyle = usable ? SimDraw.withAlpha(c.good, 0.16) : SimDraw.withAlpha(c.panelBg, 0.9);
      ctx.strokeStyle = usable ? c.good : SimDraw.withAlpha(c.muted, 0.4);
      ctx.lineWidth = usable ? 3.5 : 2;
      ctx.beginPath();
      ctx.roundRect(90, y, W - 180, cardH, RADIUS.panel + 2);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '800 24px Inter, system-ui';
      ctx.fillStyle = usable ? c.good : c.label;
      ctx.fillText(eq.text, 116, y + 42);

      ctx.font = '600 13px Inter, system-ui';
      ctx.fillStyle = c.muted;
      const missingText = `needs ${eq.vars.join(', ')} — missing ${eq.missing} entirely`;
      ctx.fillText(missingText, 116, y + 68);

      if (usable) {
        drawLabelPill(ctx, '✓ usable now', W - 200, y + cardH / 2, { color: c.good, font: '700 13px Inter, system-ui' });
      } else {
        const unknowns = eq.vars.filter((v) => !this._known[v]);
        drawLabelPill(ctx, `needs ${unknowns.join(', ')}`, W - 210, y + cardH / 2, { color: c.muted, font: '600 12px Inter, system-ui' });
      }
      ctx.restore();
    });

    this._drawCaption(ctx, step.caption);
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    wrapText(ctx, caption, W / 2 - 340, 565, 680, 24, 'center');
    ctx.restore();
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) {
    if (this._liveRegion) this._liveRegion.textContent = text;
  }

  _announceStep() {
    this._announce(STEPS[this.stepIndex].caption);
  }
}
