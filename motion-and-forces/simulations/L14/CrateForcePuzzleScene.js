import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * CrateForcePuzzleScene — Bonus challenge for les-10 (iesc1-ch6). Two
 * crates pushed by the same (unstated) force produce two different
 * accelerations; the puzzle is to find the second crate's mass without
 * ever being told the force directly — solved by first backing the force
 * out from crate A, then reusing it for crate B. Pure F = ma algebra.
 */

const MASS_A = 20; // kg
const ACCEL_A = 1.5; // m/s^2
const ACCEL_B = 2.5; // m/s^2
const FORCE = MASS_A * ACCEL_A; // 30 N
const ANSWER = FORCE / ACCEL_B; // 12 kg

const EXTRA_TOKENS = {
  crateA: ['--sim-series-1', '#38bdf8'],
  crateB: ['--sim-series-2', '#f472b6'],
};

export class CrateForcePuzzleScene extends ChallengeSceneBase {
  static simId = 'olympiad-crate-force-puzzle';
  static label = { en: 'Bonus Challenge: The Mystery Crate' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. Two crates are pushed by the same unstated force, producing two different accelerations. Submit the second crate\'s mass, then step through the F equals m a solution.';

  static QUESTION_TITLE = 'Bonus Challenge: The Mystery Crate';
  static QUESTION_TEXT =
    'A warehouse robot pushes crate A (mass 20 kg) across the floor with a constant force, and crate A accelerates at 1.5 m/s². ' +
    'The robot then pushes crate B with that EXACT SAME force — but crate B accelerates at 2.5 m/s² instead. ' +
    "What is crate B's mass, in kg? (You are never told the force directly.)";

  static ANSWER_LABEL = "Crate B's mass:";
  static ANSWER_UNIT = 'kg';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 100;
  static ANSWER_STEP = 0.5;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return Math.abs(v - ANSWER) < 0.01; }
  static answerRecapText(v) {
    if (Math.abs(v - ANSWER) < 0.01) return 'exactly right!';
    if (Math.abs(v - MASS_A) < 0.01) return "that's crate A's mass, not crate B's — they're pushed by the same force but aren't the same crate.";
    return 'not quite — try finding the shared force first.';
  }

  static EXPLAIN_STEPS = [
    'The force is never stated directly — but crate A gives you enough to find it: F = mA × aA = 20 kg × 1.5 m/s² = 30 N.',
    'That exact same 30 N force is what pushes crate B — just with a different result, 2.5 m/s² instead of 1.5 m/s².',
    'Rearranging F = mB × aB for the unknown mass: mB = F ÷ aB = 30 N ÷ 2.5 m/s².',
    'mB = 12 kg. That is lighter than crate A\'s 20 kg — which makes sense, since the same force gave it a bigger acceleration.',
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const midY = (area.top + area.bottom) / 2;
    const crateAx = area.left + (area.right - area.left) * 0.3;
    const crateBx = area.left + (area.right - area.left) * 0.7;

    this._crate(ctx, crateAx, midY - 30, c.crateA, '20 kg', '1.5 m/s²');
    this._crate(ctx, crateBx, midY - 30, c.crateB, '?', '2.5 m/s²');

    if (phase === 'explaining' && explainIndex >= 1) {
      ctx.save();
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.accent;
      ctx.textAlign = 'center';
      ctx.fillText('same force on both: F = 30 N', (crateAx + crateBx) / 2, midY + 60);
      ctx.restore();
    }

    if (phase === 'explaining' && explainIndex >= 3) {
      SimDraw.drawLabel(ctx, '12 kg', crateBx, midY - 60, { bg: c.panelBg, color: c.crateB });
    }
  }

  _crate(ctx, x, y, color, massLabel, accelLabel) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 28, y - 22, 56, 44, 6);
    ctx.fill();
    ctx.restore();
    SimDraw.drawLabel(ctx, `mass: ${massLabel}`, x, y - 34, { bg: this.colors.panelBg, color });
    ctx.save();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = this.colors.muted;
    ctx.textAlign = 'center';
    ctx.fillText(accelLabel, x, y + 44);
    ctx.restore();
  }
}
