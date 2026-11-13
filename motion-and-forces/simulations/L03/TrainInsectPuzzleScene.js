import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * TrainInsectPuzzleScene — Bonus challenge for les-07 (iesc1-ch4). The
 * classic "fly between two approaching trains" puzzle: summing every
 * back-and-forth leg looks like it needs an infinite series, but asking
 * "how long was the insect in the air" instead of "how far did each leg go"
 * turns it into one division and one multiplication. Pure average-speed
 * reasoning, no series, no calculus.
 */

const DIST = 400;
const SPEED_A = 60;
const SPEED_B = 40;
const SPEED_INSECT = 100;
const MEET_TIME = DIST / (SPEED_A + SPEED_B); // 4 h
const ANSWER = SPEED_INSECT * MEET_TIME; // 400 km

const EXTRA_TOKENS = {
  trackA: ['--sim-series-1', '#38bdf8'],
  trackB: ['--sim-series-2', '#f472b6'],
  insect: ['--sim-series-3', '#fbbf24'],
};

export class TrainInsectPuzzleScene extends ChallengeSceneBase {
  static simId = 'olympiad-train-insect-puzzle';
  static label = { en: 'Bonus Challenge: The Insect Between Two Trains' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. An insect flies back and forth between two approaching trains until they meet. Submit the total distance flown, then step through the average-speed shortcut.';

  static QUESTION_TITLE = 'Bonus Challenge: The Insect Between Two Trains';
  static QUESTION_TEXT =
    'Two train stations, X and Y, are 400 km apart on the same straight track. A train leaves X at 60 km/h, heading toward Y. ' +
    'At the exact same moment, a train leaves Y at 40 km/h, heading toward X. An insect starts on the front of the train from X, ' +
    'flying at a constant 100 km/h straight toward the other train. The instant it reaches the other train, it instantly turns around and ' +
    'flies back toward the first train — and keeps doing this, back and forth, faster than either train, until the two trains finally meet ' +
    'and squash it between them. What is the TOTAL distance the insect flies, in km?';

  static ANSWER_LABEL = 'Total distance flown:';
  static ANSWER_UNIT = 'km';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 2000;
  static ANSWER_STEP = 5;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) {
    if (v === ANSWER) return 'exactly right!';
    if (v > ANSWER) return 'too far — did you try to add up infinitely many legs?';
    return 'too short — the insect is in the air for longer than it looks.';
  }

  static EXPLAIN_STEPS = [
    'Forget the insect for a moment. The two trains are closing the 400 km gap between them at a combined speed of 60 + 40 = 100 km/h.',
    'Time until the trains meet = 400 km ÷ 100 km/h = 4 hours. That is true no matter how many times the insect turns around in between.',
    'The insect flies at a constant 100 km/h the entire time it is in the air — and it never lands, so that is the full 4 hours.',
    'Total distance flown = speed × time = 100 km/h × 4 h = 400 km.',
    'Adding up every individual leg one at a time would need an infinite sum. Asking "how long was it flying" instead of "how far was each leg" skips that completely.',
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const trackY = area.top + (area.bottom - area.top) * 0.45;
    const left = area.left + 20;
    const right = area.right - 20;

    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, trackY);
    ctx.lineTo(right, trackY);
    ctx.stroke();
    ctx.restore();

    // Fraction of the way to the meeting point, 0..1, driven by explain step
    // once we're revealing the solution; frozen at 0 while still answering.
    const frac = phase === 'explaining' ? Math.min(1, explainIndex / 4) : 0;
    const meetX = left + (right - left) * (SPEED_A / (SPEED_A + SPEED_B));
    const trainAx = left + (meetX - left) * frac;
    const trainBx = right - (right - meetX) * frac;

    this._train(ctx, trainAx, trackY, c.trackA, 1);
    this._train(ctx, trainBx, trackY, c.trackB, -1);
    SimDraw.drawLabel(ctx, '60 km/h', trainAx, trackY - 26, { bg: c.panelBg, color: c.trackA });
    SimDraw.drawLabel(ctx, '40 km/h', trainBx, trackY - 26, { bg: c.panelBg, color: c.trackB });

    if (phase === 'explaining' && explainIndex >= 2) {
      const midX = (trainAx + trainBx) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(midX, trackY - 46, 6, 0, Math.PI * 2);
      ctx.fillStyle = c.insect;
      ctx.fill();
      ctx.restore();
      SimDraw.drawLabel(ctx, 'insect, 100 km/h', midX, trackY - 60, { bg: c.panelBg, color: c.insect });
    }

    if (phase === 'explaining' && explainIndex >= 3) {
      ctx.save();
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText('meeting time = 400 / 100 = 4 h', (left + right) / 2, trackY + 40);
      ctx.restore();
    }
  }

  _train(ctx, x, y, color, dir) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 18, y - 12, 36, 20, 4);
    ctx.fill();
    ctx.restore();
    SimDraw.drawArrow(ctx, x + dir * 22, y - 2, x + dir * 34, y - 2, { color, lineWidth: 2 });
  }
}
