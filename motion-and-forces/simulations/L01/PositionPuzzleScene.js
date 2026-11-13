import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * PositionPuzzleScene — Bonus challenge for les-01 (iesc1-ch4). "Two
 * Houses, One Bus Stop": place X on a number line so its distance from P
 * is exactly twice its distance from Q. Two valid answers exist (40 and
 * 200) — most students find only the first; the explanation walks through
 * why a second region has to be checked too. Pure linear-equation algebra
 * with absolute values, no quadratics.
 */

const MIN_VAL = -80;
const MAX_VAL = 260;
const P_VAL = -40;
const Q_VAL = 80;
const ANS_1 = 40;
const ANS_2 = 200;

const EXTRA_TOKENS = {
  axis: ['--sim-challenge-axis', '#94a3b8'],
  p:    ['--sim-series-1', '#f472b6'],
  q:    ['--sim-series-2', '#fbbf24'],
  x:    ['--sim-series-3', '#38bdf8'],
};

export class PositionPuzzleScene extends ChallengeSceneBase {
  static simId = 'bonus-position-puzzle';
  static label = { en: 'Bonus Challenge: Two Houses, One Bus Stop' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. Place a bus stop on a number line so its distance from house P equals twice its distance from house Q. Submit an answer, then step through the full two-case solution.';

  static QUESTION_TITLE = 'Bonus Challenge: Two Houses, One Bus Stop';
  static QUESTION_TEXT =
    "On a straight road, house P is at position -40 m and house Q is at position +80 m, measured from the school gate O (positive = toward the market). " +
    "You want to place a bus stop X somewhere on this same road so that X's distance from P is exactly twice its distance from Q. " +
    'Find one position where X could be placed. (There may be more than one right answer — see if you can find one.)';

  static ANSWER_LABEL = 'Position of X:';
  static ANSWER_UNIT = 'm';
  static ANSWER_MIN = -200;
  static ANSWER_MAX = 300;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANS_1 || v === ANS_2; }
  static answerRecapText(v) {
    if (v === ANS_1) return 'exactly right — the first solution!';
    if (v === ANS_2) return 'exactly right — the second, easy-to-miss solution!';
    return '';
  }

  static EXPLAIN_STEPS = [
    "Let X be at position x. Its distance from P (at -40 m) is |x - (-40)| = |x + 40|. Its distance from Q (at +80 m) is |x - 80|.",
    'We need |x + 40| = 2 x |x - 80|. Distances can’t be negative, so first try X somewhere BETWEEN P and Q, where (x + 40) and (80 - x) are both positive.',
    'Between P and Q: x + 40 = 2(80 - x) → x + 40 = 160 - 2x → 3x = 120 → x = 40. Check: is 40 between -40 and 80? Yes — this works!',
    "But X doesn't have to sit between P and Q. What if X is somewhere to the right of Q instead?",
    'Right of Q: now (x - 80) is positive too, so x + 40 = 2(x - 80) → x + 40 = 2x - 160 → x = 200. Check: is 200 to the right of 80? Yes — this works too!',
    'So there are two valid bus stops: X = 40 m and X = 200 m. Most people only spot the first one — checking every possible region for X is what makes this a genuine brain-teaser.',
  ];

  _xOf(v, area) {
    return area.left + ((v - MIN_VAL) / (MAX_VAL - MIN_VAL)) * (area.right - area.left);
  }

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const axisY = area.top + (area.bottom - area.top) * 0.45;

    ctx.save();
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(area.left, axisY);
    ctx.lineTo(area.right, axisY);
    ctx.stroke();
    ctx.restore();

    for (let v = MIN_VAL; v <= MAX_VAL; v += 40) {
      const x = this._xOf(v, area);
      ctx.save();
      ctx.strokeStyle = SimDraw.withAlpha(c.axis, 0.6);
      ctx.beginPath();
      ctx.moveTo(x, axisY - 6);
      ctx.lineTo(x, axisY + 6);
      ctx.stroke();
      ctx.fillStyle = c.muted;
      ctx.font = '500 10px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${v}`, x, axisY + 22);
      ctx.restore();
    }

    this._marker(ctx, this._xOf(0, area), axisY, 'O', c.label);
    this._marker(ctx, this._xOf(P_VAL, area), axisY, 'P', c.p);
    this._marker(ctx, this._xOf(Q_VAL, area), axisY, 'Q', c.q);

    const showX1 = phase === 'explaining' && explainIndex >= 3;
    const showX2 = phase === 'explaining' && explainIndex >= 5;
    if (showX1) this._marker(ctx, this._xOf(ANS_1, area), axisY, 'X = 40', c.x, true);
    if (showX2) this._marker(ctx, this._xOf(ANS_2, area), axisY, 'X = 200', c.x, true);
  }

  _marker(ctx, x, y, label, color, above = false) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    SimDraw.drawLabel(ctx, label, x, above ? y - 34 : y - 16, { bg: this.colors.panelBg, color });
  }
}
