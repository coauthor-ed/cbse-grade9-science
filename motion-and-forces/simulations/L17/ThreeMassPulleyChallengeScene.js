import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { drawPulley } from '../shared/PhysicsSceneKit.js';

/**
 * ThreeMassPulleyChallengeScene — Bonus challenge for les-17. A 4 kg block
 * hangs from one side of a smooth pulley; on the other side, two 3 kg
 * blocks hang in series, tied to each other by a second string. Find the
 * tension in that lower string. Solved in two stages: treat the two tied
 * blocks as one 6 kg system to get the shared acceleration and the main
 * string's tension, then isolate the bottom block alone to get the lower
 * string's tension — the same "system, then isolate one part" technique
 * from the previous lesson, now applied to vertical strings over a pulley.
 */

const M1 = 4, M2 = 3, M3 = 3; // kg — M1 alone; M2 (top) + M3 (bottom) tied together
const G = 9.8;
const COMBINED = M2 + M3;
const TOTAL = M1 + M2 + M3;
const ACCEL = ((COMBINED - M1) * G) / TOTAL; // 1.96 m/s^2, combined side falls
const T1 = M1 * (G + ACCEL); // 47.04 N, main string
const ANSWER = Math.round(M3 * (G - ACCEL) * 100) / 100; // 23.52 N, lower string

const EXTRA_TOKENS = {
  block1: ['--sim-challenge-block1', '#38bdf8'],
  block2: ['--sim-series-1', '#a78bfa'],
  block3: ['--sim-series-2', '#f472b6'],
};

export class ThreeMassPulleyChallengeScene extends ChallengeSceneBase {
  static simId = 'three-mass-pulley-challenge';
  static label = { en: 'Bonus Challenge: Vertical Strings Over a Smooth Pulley' };
  static category = 'science.force';
  static ARIA_LABEL =
    'Bonus challenge. A 4 kilogram block hangs from one side of a smooth pulley. On the other side, a 3 kilogram ' +
    'block hangs from the main string, and a second 3 kilogram block hangs below it, tied on by a second string. ' +
    'Submit the tension in that lower string, then step through the two-stage system-then-isolate solution.';

  static QUESTION_TITLE = 'Bonus Challenge: Vertical Strings Over a Smooth Pulley';
  static QUESTION_TEXT =
    'A 4 kg block hangs from one end of a string that passes over a smooth, light pulley fixed to the ceiling. ' +
    'On the other end hangs a 3 kg block — and tied below that block, by a second string, hangs another 3 kg block. ' +
    'Everything starts at rest, then is let go. What is the tension, in newtons, in the LOWER string — the one ' +
    'joining the two 3 kg blocks?';

  static ANSWER_LABEL = 'Tension in the lower string:';
  static ANSWER_UNIT = 'N';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 60;
  static ANSWER_STEP = 0.5;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return Math.abs(v - ANSWER) < 0.1; }
  static answerRecapText(v) {
    if (Math.abs(v - ANSWER) < 0.1) return 'exactly right!';
    if (Math.abs(v - T1) < 0.1) return "that's the MAIN string's tension, holding up the whole 6 kg pair — the question asks about the lower string, holding up just the bottom block.";
    if (Math.abs(v - M3 * G) < 0.1) return "that's just the bottom block's weight, as if nothing were accelerating — but the whole system is accelerating.";
    return 'not quite — try treating the two tied blocks as one 6 kg system first, then isolate just the bottom block.';
  }

  static EXPLAIN_STEPS = [
    'Treat the two tied blocks (3 kg + 3 kg = 6 kg) as one system on one side of the pulley, and the single 4 kg block as the other side.',
    'The 6 kg side is heavier, so it falls while the 4 kg side rises. Both sides share one acceleration size: a = [(m₂+m₃) − m₁] × g ÷ (m₁+m₂+m₃) = (6 − 4) × 9.8 ÷ 10 = 1.96 m/s².',
    "The main string's tension — holding up the whole 6 kg pair — comes from the 4 kg block's own free-body diagram: T₁ = m₁(g + a) = 4 × (9.8 + 1.96) = 47.04 N.",
    'Now isolate just the bottom 3 kg block on its own. Only its weight and the lower string act on it, and it shares the same acceleration as everything else: 3 × 9.8 − T₂ = 3 × 1.96.',
    'Solve: T₂ = 3 × (9.8 − 1.96) = 23.52 N. Smaller than T₁, because the lower string only has to support and accelerate the bottom block, not the whole 6 kg pair.',
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const pulleyX = (area.left + area.right) / 2;
    const pulleyY = area.top + 14;
    const leftX = pulleyX - 150, rightX = pulleyX + 150;

    drawPulley(ctx, pulleyX, pulleyY, 20, c);

    const y1 = pulleyY + 50;
    const y2top = pulleyY + 50;
    // y2bottom leaves room for m2's own block (36px) plus m3's label sitting
    // above it (~24px) plus a visible string segment — tight spacing here
    // previously made the two hanging blocks visually overlap.
    const y2bottom = y2top + 90;

    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, pulleyY);
    ctx.lineTo(leftX, y1);
    ctx.moveTo(rightX, pulleyY);
    ctx.lineTo(rightX, y2top);
    ctx.moveTo(rightX, y2top + 36);
    ctx.lineTo(rightX, y2bottom);
    ctx.stroke();
    ctx.restore();

    this._block(ctx, leftX, y1, c.block1, `${M1} kg`);
    this._block(ctx, rightX, y2top, c.block2, `${M2} kg`);
    this._block(ctx, rightX, y2bottom, c.block3, `${M3} kg`);

    if (phase === 'explaining' && explainIndex >= 3) {
      SimDraw.drawLabel(ctx, `T₁ = ${T1.toFixed(2)} N`, rightX + 60, (pulleyY + y2top) / 2, { bg: c.panelBg, color: c.block2 });
    }
    if (phase === 'explaining' && explainIndex >= 5) {
      SimDraw.drawLabel(ctx, `T₂ = ${ANSWER.toFixed(2)} N`, rightX + 60, (y2top + 36 + y2bottom) / 2, { bg: c.panelBg, color: c.block3 });
    }
    if (phase === 'explaining' && explainIndex >= 1) {
      ctx.save();
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText('a = 1.96 m/s² — 6 kg side falls, 4 kg side rises', pulleyX, area.bottom - 6);
      ctx.restore();
    }
  }

  _block(ctx, x, topY, color, label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 24, topY, 48, 36, 6);
    ctx.fill();
    ctx.restore();
    SimDraw.drawLabel(ctx, label, x, topY - 12, { bg: this.colors.panelBg, color });
  }
}
