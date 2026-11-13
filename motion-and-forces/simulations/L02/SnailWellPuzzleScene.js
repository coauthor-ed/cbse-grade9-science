import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * SnailWellPuzzleScene — Bonus challenge for les-02 (iesc1-ch4). The
 * classic "snail climbing a well" puzzle: net-progress-per-day tempts a
 * wrong shortcut answer, because the snail doesn't slide back on the day it
 * actually escapes. Directly reinforces distance-vs-net-displacement
 * thinking. Pure arithmetic plus one simple linear inequality — no algebra
 * beyond what solving 2(n-1) >= 12 needs.
 */

const WELL_DEPTH = 17;
const CLIMB = 5;
const SLIDE = 3;
const ANSWER = 7;

// Precomputed day-by-day (start-of-day, climb-top, slide-bottom) for the
// illustration — matches the explanation's own arithmetic exactly.
const DAYS = [];
{
  let start = 0;
  for (let day = 1; day <= ANSWER; day++) {
    const climbTop = start + CLIMB;
    const slideBottom = day === ANSWER ? climbTop : climbTop - SLIDE;
    DAYS.push({ day, start, climbTop, slideBottom });
    start = slideBottom;
  }
}

// How many of DAYS[] to reveal at each explanation step.
const REVEAL_AT_STEP = { 3: 1, 4: 2, 5: 2, 6: 2, 7: ANSWER };

const EXTRA_TOKENS = {
  shaft:  ['--sim-series-1', '#94a3b8'],
  climb:  ['--sim-series-2', '#34d399'],
  slide:  ['--sim-series-3', '#fb923c'],
  snail:  ['--sim-series-4', '#38bdf8'],
};

export class SnailWellPuzzleScene extends ChallengeSceneBase {
  static simId = 'bonus-snail-well-puzzle';
  static label = { en: 'Bonus Challenge: The Snail in the Well' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. A snail climbs five metres by day and slides back three metres by night in a seventeen metre well. Submit the day it escapes, then step through the day-by-day solution.';

  static QUESTION_TITLE = 'Bonus Challenge: The Snail in the Well';
  static QUESTION_TEXT =
    `A snail sits at the bottom of a ${WELL_DEPTH} m deep well. Every day, it climbs up ${CLIMB} m. But every night, while it rests, ` +
    `it slides back down ${SLIDE} m. On which day does the snail finally climb all the way out of the well? ` +
    '(Hint: think carefully about what happens on the very last day.)';

  static ANSWER_LABEL = 'Day number:';
  static ANSWER_UNIT = '';
  static ANSWER_MIN = 1;
  static ANSWER_MAX = 30;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 1;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) { return v === ANSWER ? 'exactly right!' : `the naive shortcut (${WELL_DEPTH} ÷ 2 = 8.5, rounded to 9) is a common wrong guess — see why below.`; }

  static EXPLAIN_STEPS = [
    `Tempting shortcut: net progress = ${CLIMB} - ${SLIDE} = 2 m per day, so ${WELL_DEPTH} m ÷ 2 m = 8.5, rounded up to day 9. That shortcut is actually wrong — here's the subtle mistake it makes.`,
    "The shortcut assumes the snail slides back every single day, including the day it finally escapes. But the moment it reaches the top, it's out of the well — there's no night left for it to slide back!",
    `So let's track its height at the START of each day, right after that night's slide: Start of day 1 = 0 m. It climbs to ${CLIMB} m, then slides back to ${CLIMB - SLIDE} m by night.`,
    `Start of day 2 = ${CLIMB - SLIDE} m. It climbs to ${CLIMB - SLIDE + CLIMB} m, slides back to ${2 * (CLIMB - SLIDE)} m. Notice: the start-of-day height climbs by exactly 2 m every day — 0, 2, 4, 6, 8, ...`,
    `So the start of day n is 2 x (n - 1) metres. We want the FIRST day where climbing ${CLIMB} m from that height reaches ${WELL_DEPTH} m or more: 2(n-1) + ${CLIMB} >= ${WELL_DEPTH}.`,
    `Solve it like an ordinary equation: 2(n-1) >= ${WELL_DEPTH - CLIMB}, so n - 1 >= ${(WELL_DEPTH - CLIMB) / 2}, so n >= ${(WELL_DEPTH - CLIMB) / 2 + 1}. Day ${ANSWER} is the very first whole day this becomes true.`,
    `Check it directly: start of day ${ANSWER} = 2 x ${ANSWER - 1} = ${2 * (ANSWER - 1)} m. That day it climbs to ${2 * (ANSWER - 1)} + ${CLIMB} = ${WELL_DEPTH} m — exactly the top! The snail escapes on Day ${ANSWER}, two days earlier than the naive shortcut guessed, because it never slides back on its final day.`,
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const shaftLeft = (area.left + area.right) / 2 - 60;
    const shaftRight = shaftLeft + 120;
    const shaftTop = area.top + 6;
    const shaftBottom = area.bottom - 6;
    const yOf = (m) => shaftBottom - (m / WELL_DEPTH) * (shaftBottom - shaftTop);

    ctx.save();
    ctx.strokeStyle = c.shaft;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(shaftLeft, shaftTop, shaftRight - shaftLeft, shaftBottom - shaftTop);
    ctx.restore();

    ctx.save();
    ctx.font = '600 11px Inter, system-ui';
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'right';
    for (let m = 0; m <= WELL_DEPTH; m += 5) {
      const y = yOf(m);
      ctx.beginPath();
      ctx.moveTo(shaftLeft - 6, y);
      ctx.lineTo(shaftLeft, y);
      ctx.strokeStyle = c.muted;
      ctx.stroke();
      ctx.fillText(`${m} m`, shaftLeft - 10, y + 4);
    }
    ctx.restore();

    const revealCount = phase === 'explaining' ? (REVEAL_AT_STEP[explainIndex] || 0) : 0;
    let lastY = shaftBottom;
    for (let i = 0; i < revealCount; i++) {
      const d = DAYS[i];
      const startY = yOf(d.start);
      const climbY = yOf(d.climbTop);
      const slideY = yOf(d.slideBottom);
      SimDraw.drawArrow(ctx, shaftLeft + 30, startY, shaftLeft + 30, climbY, { color: c.climb, lineWidth: 3 });
      if (d.slideBottom !== d.climbTop) {
        SimDraw.drawArrow(ctx, shaftLeft + 90, climbY, shaftLeft + 90, slideY, { color: c.slide, lineWidth: 3 });
      }
      ctx.save();
      ctx.font = '600 10px Inter, system-ui';
      ctx.fillStyle = c.label;
      ctx.textAlign = 'center';
      ctx.fillText(`d${d.day}`, shaftLeft + 60, climbY - 6);
      ctx.restore();
      lastY = slideY;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc((shaftLeft + shaftRight) / 2, revealCount > 0 ? lastY : shaftBottom, 8, 0, Math.PI * 2);
    ctx.fillStyle = c.snail;
    ctx.fill();
    ctx.restore();
  }
}
