import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * FrictionSequencePuzzleScene — Bonus challenge for les-05 (iesc1-ch6).
 * Friction steadily removes 2 m/s worth of distance-per-second; the student
 * must notice the car stops moving once a term would hit 0, then sum the
 * sequence with the classic Gauss pairing trick — no formula for arithmetic
 * progressions required, just noticing that paired terms are equal.
 */

const SEQUENCE = [14, 12, 10, 8, 6, 4, 2];
const ANSWER = SEQUENCE.length; // 7 seconds
const TOTAL_DISTANCE = SEQUENCE.reduce((a, b) => a + b, 0); // 56

const PAIR_AT_STEP = { 3: [[0, 6]], 4: [[0, 6], [1, 5], [2, 4]] };

const EXTRA_TOKENS = {
  bar:   ['--sim-challenge-bar', '#38bdf8'],
  pairA: ['--sim-series-3', '#34d399'],
  pairB: ['--sim-challenge-pair-b', '#fbbf24'],
  mid:   ['--sim-series-1', '#f472b6'],
  axis:  ['--sim-challenge-axis2', '#94a3b8'],
};

export class FrictionSequencePuzzleScene extends ChallengeSceneBase {
  static simId = 'bonus-friction-sequence-puzzle';
  static label = { en: "Bonus Challenge: The Sliding Car's Last Second" };
  static category = 'science.force';
  static ARIA_LABEL = 'Bonus challenge. A sliding car covers two metres less each second than the second before, due to friction. Submit how many seconds until it stops, then step through the pairing-sum solution.';

  static QUESTION_TITLE = "Bonus Challenge: The Sliding Car's Last Second";
  static QUESTION_TEXT =
    'A toy car is given a push and slides in a straight line, slowing down because of friction. Friction removes speed at such a steady rate that the car covers exactly 2 m less ' +
    `in each second than it did in the second before: ${SEQUENCE[0]} m in the 1st second after release, ${SEQUENCE[1]} m in the 2nd second, ${SEQUENCE[2]} m in the 3rd, and so on. ` +
    'How many seconds does it take for the car to come to a complete stop?';

  static ANSWER_LABEL = 'Time to stop:';
  static ANSWER_UNIT = 's';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 20;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) { return v === ANSWER ? 'exactly right!' : ''; }

  static EXPLAIN_STEPS = [
    `List the distance covered each second: ${SEQUENCE.join(', ')} — the next term would be 0, meaning the car has already stopped by then.`,
    `So the car is actually moving for ${ANSWER} seconds (covering ${SEQUENCE.join(', ')} m), and has come to a complete stop right after that.`,
    `Here's a fast way to add ${SEQUENCE.join(' + ')} without adding term by term: pair the first and last, the second and second-last, and so on. ${SEQUENCE[0]} + ${SEQUENCE[6]} = ${SEQUENCE[0] + SEQUENCE[6]}. ${SEQUENCE[1]} + ${SEQUENCE[5]} = ${SEQUENCE[1] + SEQUENCE[5]}. Every pair adds up to the same total!`,
    `There are ${SEQUENCE.length} numbers, which makes 3 full pairs (6 numbers) plus one number left in the middle: ${SEQUENCE[3]}, exactly half of ${SEQUENCE[0] + SEQUENCE[6]}.`,
    `So the total distance is 3 pairs x ${SEQUENCE[0] + SEQUENCE[6]}, plus the middle ${SEQUENCE[3]}: ${3 * (SEQUENCE[0] + SEQUENCE[6])} + ${SEQUENCE[3]} = ${TOTAL_DISTANCE} m. (This pairing trick is the same one behind the famous "1+2+...+100" shortcut.)`,
    `So the car takes ${ANSWER} seconds to stop — and as a bonus, you now also know it travelled a total of ${TOTAL_DISTANCE} m before stopping.`,
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const n = SEQUENCE.length;
    const barW = Math.min(70, (area.right - area.left - 40) / n - 12);
    const gap = (area.right - area.left - 40 - barW * n) / (n - 1);
    const baseline = area.bottom - 10;
    const maxH = area.bottom - area.top - 40;
    const maxVal = SEQUENCE[0];

    const pairs = phase === 'explaining' ? (PAIR_AT_STEP[explainIndex] || []) : [];

    SEQUENCE.forEach((val, i) => {
      const x = area.left + 20 + i * (barW + gap);
      const h = (val / maxVal) * maxH;
      let color = c.bar;
      const pairIdx = pairs.findIndex((p) => p.includes(i));
      if (pairIdx >= 0) color = pairIdx === 0 ? c.pairA : c.pairB;
      if (i === 3 && (explainIndex === 4 || explainIndex === 5)) color = c.mid;

      ctx.save();
      SimDraw.drawPanel(ctx, x, baseline - h, barW, h, { bg: color, radius: 4 });
      ctx.restore();
      ctx.save();
      ctx.font = '600 11px Inter, system-ui';
      ctx.fillStyle = c.label;
      ctx.textAlign = 'center';
      ctx.fillText(`${val} m`, x + barW / 2, baseline - h - 8);
      ctx.fillStyle = c.muted;
      ctx.font = '500 10px Inter, system-ui';
      ctx.fillText(`s${i + 1}`, x + barW / 2, baseline + 14);
      ctx.restore();
    });

    ctx.save();
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(area.left + 10, baseline);
    ctx.lineTo(area.right - 10, baseline);
    ctx.stroke();
    ctx.restore();

    if (phase === 'explaining' && explainIndex >= 5) {
      ctx.save();
      ctx.font = '700 13px Inter, system-ui';
      ctx.fillStyle = c.pairA;
      ctx.textAlign = 'center';
      ctx.fillText(`total distance = ${TOTAL_DISTANCE} m`, (area.left + area.right) / 2, area.top + 10);
      ctx.restore();
    }
  }
}
