import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * ChallengeSceneBase — shared engine for this bundle's six "Bonus
 * challenge" scenes (one per lesson). Not part of simulations-kit itself —
 * a course-local helper imported by relative path, same native-ESM approach
 * every other course-exclusive scene here already uses.
 *
 * Contract every subclass gets for free: a puzzle statement, a locked-in
 * numeric answer submitted through a `number` control, then a "did you get
 * it" reveal followed by an explanation the student steps through with
 * Prev/Next — never gated by whether they got it right. A subclass supplies
 * only the puzzle-specific text (statement, answer check, step captions) and
 * a `_drawPuzzle(ctx, info)` hook to illustrate the current step; everything
 * about input handling, control visibility, and the reveal/step flow lives
 * here once instead of six times.
 *
 * `info` passed to `_drawPuzzle`: `{ phase, explainIndex, userAnswer }`.
 *   phase: 'answering' | 'explaining'
 *   explainIndex: -1 while answering; 0 for the result banner; 1..N for
 *     EXPLAIN_STEPS[0..N-1] once explaining.
 */

const W_DEFAULT = 900;
const H_DEFAULT = 460;

const BASE_COLOR_TOKENS = {
  bgDeep:   ['--sim-challenge-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-challenge-panel', '#111827'],
  label:    ['--sim-challenge-label', '#e2e8f0'],
  muted:    ['--sim-challenge-muted', '#94a3b8'],
  accent:   ['--sim-challenge-accent', '#818cf8'],
  correct:  ['--sim-good', '#34d399'],
  incorrect:['--sim-bad', '#f87171'],
};

export class ChallengeSceneBase extends CanvasSimulation {
  static WIDTH = W_DEFAULT;
  static HEIGHT = H_DEFAULT;

  // ── Subclass configuration surface (override as needed) ──────────────────
  static QUESTION_TITLE = 'Bonus Challenge';
  static QUESTION_TEXT = '';
  static ANSWER_LABEL = 'Your answer:';
  static ANSWER_UNIT = '';
  static ANSWER_MIN = -1000;
  static ANSWER_MAX = 1000;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 0;
  static EXPLAIN_STEPS = [];
  static EXTRA_COLOR_TOKENS = {};
  static isCorrect(_value) { return false; }
  static resultText(correct) {
    return correct
      ? "Correct! Let's walk through why, step by step."
      : "Not quite — that's exactly why this one is tough. Let's work through it together.";
  }
  static answerRecapText(_value) { return ''; }

  /**
   * `content-block.js`'s `_renderSimulation()` looks for a static `CONTROLS`
   * *property* on the mounted scene class (`this._sceneClass.CONTROLS`) to
   * know what DOM controls to render next to the canvas — see every other
   * scene in this course (e.g. `SpringBalanceGaugeScene.static CONTROLS`).
   * This must stay a getter, not a plain method, and must be named exactly
   * `CONTROLS` — anything else is invisible to the plugin, silently: no
   * error, just no controls ever rendered, which also means `onControlChange`
   * never fires and the scene can never leave `phase: 'answering'`.
   */
  static get CONTROLS() {
    return [
      { type: 'number', id: 'answer', label: this.ANSWER_LABEL, min: this.ANSWER_MIN, max: this.ANSWER_MAX, step: this.ANSWER_STEP, value: this.ANSWER_DEFAULT, suffix: this.ANSWER_UNIT },
      { type: 'button', id: 'submit', label: 'Submit answer' },
      { type: 'button', id: 'prev', label: '← Back' },
      { type: 'button', id: 'next', label: 'Next →' },
    ];
  }

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.phase = 'answering';
    this.draftAnswer = this.constructor.ANSWER_DEFAULT;
    this.userAnswer = null;
    this.explainIndex = -1;
    this._liveRegion = null;
    this._flashTime = 0;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL || this.constructor.QUESTION_TITLE);
    this._reloadColors();
    this._buildLiveRegion();
    this._onSetup?.();
    this._drawInitialFrame(this._ctx);
    this._announce(`${this.constructor.QUESTION_TITLE}. ${this.constructor.QUESTION_TEXT}`);
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() {
    this.colors = readSimColors(this.container, { ...BASE_COLOR_TOKENS, ...this.constructor.EXTRA_COLOR_TOKENS });
  }

  // ── Controls ───────────────────────────────────────────────────────────
  isControlHidden(id) {
    if (id === 'answer' || id === 'submit') return this.phase !== 'answering';
    if (id === 'prev') return this.phase !== 'explaining' || this.explainIndex <= 0;
    if (id === 'next') return this.phase !== 'explaining' || this.explainIndex >= this.constructor.EXPLAIN_STEPS.length;
    return this._isExtraControlHidden?.(id) ?? false;
  }

  onControlChange(id, value) {
    if (id === 'answer') {
      this.draftAnswer = Number(value);
      return;
    }
    if (id === 'submit') {
      this.userAnswer = this.draftAnswer;
      this.phase = 'explaining';
      this.explainIndex = 0;
      this._flashTime = 0;
      this._announce(this.constructor.resultText(this.constructor.isCorrect(this.userAnswer)));
      this.requestUiUpdate?.();
      return;
    }
    if (id === 'next') {
      this.explainIndex = Math.min(this.constructor.EXPLAIN_STEPS.length, this.explainIndex + 1);
      this._flashTime = 0;
      this._announceStep();
      this.requestUiUpdate?.();
      return;
    }
    if (id === 'prev') {
      this.explainIndex = Math.max(0, this.explainIndex - 1);
      this._flashTime = 0;
      this._announceStep();
      this.requestUiUpdate?.();
      return;
    }
    this._onExtraControlChange?.(id, value);
  }

  _announceStep() {
    if (this.explainIndex === 0) {
      this._announce(this.constructor.resultText(this.constructor.isCorrect(this.userAnswer)));
    } else {
      this._announce(this.constructor.EXPLAIN_STEPS[this.explainIndex - 1] || '');
    }
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }

  // ── Frame loop ─────────────────────────────────────────────────────────
  _tick(ctx, dt) {
    this._flashTime += dt;
    const W = this.constructor.WIDTH, H = this.constructor.HEIGHT;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawChrome(ctx, W, H);
  }

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawChrome(ctx, W, H) {
    const c = this.colors;
    const Ctor = this.constructor;

    // Question panel
    ctx.save();
    ctx.font = '700 16px Inter, system-ui';
    ctx.fillStyle = c.accent;
    ctx.textAlign = 'left';
    ctx.fillText(Ctor.QUESTION_TITLE, 30, 34);
    ctx.restore();

    const textBottom = this._wrapText(ctx, Ctor.QUESTION_TEXT, 30, 58, W - 60, 20);

    // The explain bar's height depends on how many lines its (variable-length)
    // text wraps to, so it has to be measured before the puzzle area's bottom
    // edge can be placed — the puzzle must never be laid out first and then
    // have a tall bar overlap it.
    const explainBarHeight = this.phase === 'explaining' ? this._measureExplainBarHeight(ctx, W) : 0;
    const puzzleTop = textBottom + 14;
    const puzzleBottom = this.phase === 'answering' ? H - 70 : H - explainBarHeight - 22;
    this._drawPuzzle?.(ctx, {
      phase: this.phase,
      explainIndex: this.explainIndex,
      userAnswer: this.userAnswer,
      area: { top: puzzleTop, bottom: puzzleBottom, left: 30, right: W - 30 },
    });

    if (this.phase === 'answering') {
      ctx.save();
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText('Type your answer below, then press "Submit answer."', W / 2, H - 44);
      ctx.restore();
    } else {
      this._drawExplainBar(ctx, W, H, explainBarHeight);
    }
  }

  /**
   * Builds the explain bar's content as pre-wrapped, per-line style records
   * `{ text, font, lineHeight, color }` — used both to measure the bar's
   * required height (before the puzzle area is laid out, see `_drawChrome`)
   * and to actually draw it. `ctx.fillText`'s `maxWidth` argument does NOT
   * wrap text onto multiple lines — it squeezes/scales a single line to fit,
   * which is what made these explanations unreadable. Real wrapping means
   * measuring word-by-word (`_wrapLines`) and drawing one `fillText` call per
   * resulting line instead.
   */
  _explainBarLines(ctx, W) {
    const c = this.colors;
    const Ctor = this.constructor;
    const innerWidth = W - 88; // panel spans x:30..W-30 with 14px padding each side inside it (text starts at x=44)
    const STEP_FONT = '600 16px Inter, system-ui';
    const STEP_LH = 24;
    const HEADLINE_FONT = '700 17px Inter, system-ui';
    const HEADLINE_LH = 25;
    const HINT_FONT = '600 14px Inter, system-ui';
    const HINT_LH = 20;

    if (this.explainIndex === 0) {
      const correct = Ctor.isCorrect(this.userAnswer);
      const recap = Ctor.answerRecapText(this.userAnswer);
      const answeredText = `You answered: ${this.userAnswer}${Ctor.ANSWER_UNIT ? ' ' + Ctor.ANSWER_UNIT : ''}${recap ? '  —  ' + recap : ''}`;
      const hintText = 'Press "Next →" to see the full solution, one step at a time.';
      const headlineColor = correct ? c.correct : c.incorrect;
      const headlineLines = this._wrapLines(ctx, answeredText, innerWidth, HEADLINE_FONT)
        .map((text) => ({ text, font: HEADLINE_FONT, lineHeight: HEADLINE_LH, color: headlineColor }));
      const hintLines = this._wrapLines(ctx, hintText, innerWidth, HINT_FONT)
        .map((text) => ({ text, font: HINT_FONT, lineHeight: HINT_LH, color: c.muted }));
      return [...headlineLines, ...hintLines];
    }

    const total = Ctor.EXPLAIN_STEPS.length;
    const stepText = `Step ${this.explainIndex} of ${total}: ${Ctor.EXPLAIN_STEPS[this.explainIndex - 1]}`;
    return this._wrapLines(ctx, stepText, innerWidth, STEP_FONT)
      .map((text) => ({ text, font: STEP_FONT, lineHeight: STEP_LH, color: c.label }));
  }

  _measureExplainBarHeight(ctx, W) {
    const padTop = 18, padBottom = 18, minHeight = 56;
    const lines = this._explainBarLines(ctx, W);
    const textHeight = lines.reduce((sum, l) => sum + l.lineHeight, 0);
    return Math.max(minHeight, padTop + textHeight + padBottom);
  }

  _drawExplainBar(ctx, W, H, barHeight) {
    const c = this.colors;
    const Ctor = this.constructor;
    const correct = Ctor.isCorrect(this.userAnswer);
    const top = H - barHeight - 22;

    ctx.save();
    SimDraw.drawPanel(ctx, 30, top, W - 60, barHeight, { bg: c.panelBg, radius: 10, stroke: correct ? c.correct : c.incorrect, lineWidth: 1.5 });
    ctx.restore();

    const lines = this._explainBarLines(ctx, W);
    ctx.save();
    ctx.textAlign = 'left';
    let cy = top + 18 + (lines[0]?.lineHeight ?? 20) * 0.72;
    for (const line of lines) {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, 44, cy);
      cy += line.lineHeight;
    }
    ctx.restore();
  }

  // Pure measurement helper — wraps `text` word-by-word to fit `maxWidth` at
  // `font`, returning the resulting lines without drawing anything.
  _wrapLines(ctx, text, maxWidth, font) {
    ctx.save();
    ctx.font = font;
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  // Wraps and draws `text` at (x, y); returns the y-coordinate just below the last line drawn.
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    ctx.save();
    ctx.font = '500 14px Inter, system-ui';
    ctx.fillStyle = this.colors.label;
    ctx.textAlign = 'left';
    const lines = this._wrapLines(ctx, text, maxWidth, ctx.font);
    let cy = y;
    lines.forEach((line, i) => {
      ctx.fillText(line, x, cy);
      if (i < lines.length - 1) cy += lineHeight;
    });
    ctx.restore();
    return cy + lineHeight;
  }

  _flashAlpha(duration = 0.4) { return clamp01(this._flashTime / duration); }
}
