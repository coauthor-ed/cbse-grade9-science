import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * CounterfeitCoinPuzzleScene — Bonus challenge for les-03 (iesc1-ch6).
 * The classic "9 coins, one fake (heavier), find it with a two-pan balance
 * in the fewest weighings" puzzle. Ties directly to the lesson's own
 * force-comparison theme (a balance compares forces/weights, same as a
 * spring balance measures one). Pure logic — no arithmetic beyond counting.
 */

const FAKE_INDEX = 7; // 0-indexed, coin "8" in the 1-indexed display — arbitrary, fixed for the illustration
const GROUP_OF = (i) => Math.floor(i / 3); // 0 = A, 1 = B, 2 = C

const EXTRA_TOKENS = {
  coin:    ['--sim-series-1', '#e2e8f0'],
  coinFake:['--sim-series-2', '#f87171'],
  groupA:  ['--sim-series-4', '#38bdf8'],
  groupB:  ['--sim-series-5', '#fbbf24'],
  groupC:  ['--sim-challenge-group-c', '#a78bfa'],
  beam:    ['--sim-challenge-beam', '#94a3b8'],
};

export class CounterfeitCoinPuzzleScene extends ChallengeSceneBase {
  static simId = 'bonus-counterfeit-coin-puzzle';
  static label = { en: 'Bonus Challenge: The Odd Coin' };
  static category = 'science.force';
  static ARIA_LABEL = 'Bonus challenge. Nine coins, one fake and heavier, found with a two pan balance. Submit the minimum number of weighings needed, then step through the full strategy.';

  static QUESTION_TITLE = 'Bonus Challenge: The Odd Coin';
  static QUESTION_TEXT =
    'You have 9 identical-looking coins. Exactly one is fake, and the fake one is very slightly heavier than the rest (all 8 real coins weigh exactly the same). ' +
    'You have a simple two-pan balance — it only tells you which side is heavier, or if both sides are equal. ' +
    'What is the minimum number of times you need to use the balance to guarantee finding the fake coin?';

  static ANSWER_LABEL = 'Minimum weighings:';
  static ANSWER_UNIT = '';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 10;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === 2; }
  static answerRecapText(v) { return v === 2 ? 'exactly right!' : 'fewer weighings than most people first guess — see how below.'; }

  static EXPLAIN_STEPS = [
    "First, notice something powerful: one weighing can split coins into THREE useful groups, not two — the heavier side, the lighter side, and 'left aside, not weighed at all.' That's the key idea.",
    'Split the 9 coins into three equal groups of 3: Group A, Group B, Group C.',
    'Weighing 1: put Group A on the left pan and Group B on the right pan. If they balance exactly, the fake isn’t in A or B — it must be in Group C. If they don’t balance, the fake is in whichever group of 3 was heavier.',
    "Either way, after just ONE weighing, you've narrowed 9 coins down to a group of just 3 — and you know the fake among them is heavier than a real coin.",
    'Weighing 2: take those 3 suspect coins. Put one on the left pan, another on the right pan, and leave the third one off the balance entirely.',
    'If one side is heavier, that coin is the fake. If the two balance exactly, the fake is the one coin you left off the balance.',
    'Two weighings isn’t just enough — it’s the fewest possible. Each weighing has 3 possible outcomes (left heavier / right heavier / balanced), and 2 weighings give 3 x 3 = 9 outcomes — exactly enough to tell 9 coins apart, with none to spare.',
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const step = phase === 'explaining' ? explainIndex : 0;
    const groupColor = [c.groupA, c.groupB, c.groupC];

    if (step <= 1) {
      this._drawCoinRow(ctx, Array.from({ length: 9 }, (_, i) => i), area.left, area.top + 20, area, null);
      return;
    }
    if (step === 2) {
      this._drawCoinRow(ctx, Array.from({ length: 9 }, (_, i) => i), area.left, area.top + 20, area, groupColor);
      return;
    }
    if (step === 3) {
      this._drawBalance(ctx, area, [0, 1, 2], [3, 4, 5], 'level', 'Balanced — fake is in Group C');
      return;
    }
    if (step === 4) {
      this._drawCoinRow(ctx, [6, 7, 8], area.left + 40, area.top + 30, area, null, false);
      ctx.save();
      ctx.font = '600 12px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'left';
      ctx.fillText('Group C — the 3 remaining suspects', area.left + 40, area.top + 14);
      ctx.restore();
      return;
    }
    if (step === 5) {
      this._drawBalance(ctx, area, [6], [7], 'unknown', 'Coin 9 sits aside, not weighed', 8);
      return;
    }
    if (step === 6) {
      this._drawBalance(ctx, area, [6], [7], 'right-heavy', 'Right pan dips — coin 8 is the fake!', 8);
      return;
    }
    // step 7 (final): recap
    this._drawCoinRow(ctx, Array.from({ length: 9 }, (_, i) => i), area.left, area.top + 30, area, null, true);
    ctx.save();
    ctx.font = '700 12px Inter, system-ui';
    ctx.fillStyle = c.coinFake;
    ctx.textAlign = 'left';
    ctx.fillText('Coin 8 confirmed fake — found in exactly 2 weighings.', area.left, area.top + 14);
    ctx.restore();
  }

  _drawCoinRow(ctx, indices, startX, y, area, groupColorArr, highlightFake = false) {
    const c = this.colors;
    const spacing = Math.min(60, (area.right - startX - 20) / indices.length);
    indices.forEach((idx, pos) => {
      const x = startX + 30 + pos * spacing;
      const isFake = highlightFake && idx === FAKE_INDEX;
      const color = isFake ? c.coinFake : groupColorArr ? groupColorArr[GROUP_OF(idx)] : c.coin;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y + 30, 16, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = SimDraw.shade(color, -0.3);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0a0f1e';
      ctx.font = '700 11px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${idx + 1}`, x, y + 31);
      ctx.restore();
    });
  }

  _drawBalance(ctx, area, leftIdx, rightIdx, tilt, caption, asideIdx = null) {
    const c = this.colors;
    const cx = (area.left + area.right) / 2;
    const beamY = area.top + 60;
    const tiltAngle = tilt === 'level' ? 0 : tilt === 'right-heavy' ? 0.14 : tilt === 'unknown' ? 0 : 0;
    const beamHalf = 140;

    ctx.save();
    ctx.strokeStyle = c.beam;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, beamY);
    ctx.lineTo(cx, beamY - 40);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, beamY - 40);
    ctx.rotate(tiltAngle);
    ctx.beginPath();
    ctx.moveTo(-beamHalf, 0);
    ctx.lineTo(beamHalf, 0);
    ctx.stroke();
    const leftPanY = 6 + Math.sin(tiltAngle) * beamHalf;
    const rightPanY = 6 - Math.sin(tiltAngle) * beamHalf;
    this._drawPan(ctx, -beamHalf, leftPanY, leftIdx, c);
    this._drawPan(ctx, beamHalf, rightPanY, rightIdx, c);
    ctx.restore();
    ctx.restore();

    if (asideIdx != null) {
      this._drawCoinRow(ctx, [asideIdx], cx - 12, beamY + 50, area, null, false);
      ctx.save();
      ctx.font = '500 10px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText('aside', cx, beamY + 100);
      ctx.restore();
    }

    ctx.save();
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    ctx.fillText(caption, cx, beamY - 60);
    ctx.restore();
  }

  _drawPan(ctx, x, y, idx, c) {
    ctx.save();
    ctx.strokeStyle = c.beam;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 34, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    idx.forEach((coinIdx, pos) => {
      const isFake = coinIdx === FAKE_INDEX;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x - 10 + pos * 20, y - 6, 10, 0, Math.PI * 2);
      ctx.fillStyle = isFake ? c.coinFake : c.coin;
      ctx.fill();
      ctx.strokeStyle = SimDraw.shade(isFake ? c.coinFake : c.coin, -0.3);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#0a0f1e';
      ctx.font = '700 9px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${coinIdx + 1}`, x - 10 + pos * 20, y - 5);
      ctx.restore();
    });
  }
}
