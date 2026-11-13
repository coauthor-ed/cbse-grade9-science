import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * ThreeForcesPuzzleScene — Bonus challenge for les-04 (iesc1-ch6). Three
 * ropes pull a ring along one line; only pairwise net forces are given.
 * Solved with the "add all three, divide by two, subtract each original"
 * trick — ordinary simultaneous-equation algebra (CBSE grade 9 covers linear
 * equations), no quadratics, no vectors-at-an-angle.
 */

const P_PLUS_Q = 50;
const Q_PLUS_R = -10;
const P_PLUS_R = 30;
const P_VAL = 45;
const Q_VAL = 5;
const R_VAL = -15;

const EXTRA_TOKENS = {
  rope:  ['--sim-series-1', '#94a3b8'],
  ring:  ['--sim-challenge-ring', '#e2e8f0'],
  fp:    ['--sim-challenge-force-p', '#38bdf8'],
  fq:    ['--sim-series-2', '#fbbf24'],
  fr:    ['--sim-series-3', '#f472b6'],
};

export class ThreeForcesPuzzleScene extends ChallengeSceneBase {
  static simId = 'bonus-three-forces-puzzle';
  static label = { en: 'Bonus Challenge: Three Ropes, One Ring' };
  static category = 'science.force';
  static ARIA_LABEL = 'Bonus challenge. Three friends pull a ring with ropes along one line; only pairwise net forces are given. Submit the individual force of Q, then step through the simultaneous-equation solution.';

  static QUESTION_TITLE = 'Bonus Challenge: Three Ropes, One Ring';
  static QUESTION_TEXT =
    'Three friends, P, Q and R, each pull on their own rope tied to a ring, all along the same straight line. Each pull is either forward (positive) or backward (negative). ' +
    `You're told: P and Q together pull with a net force of ${P_PLUS_Q} N forward. Q and R together pull with a net force of ${Math.abs(Q_PLUS_R)} N backward. ` +
    `P and R together pull with a net force of ${P_PLUS_R} N forward. ` +
    "Find Q's own individual pulling force — as a signed number, using + for forward and - for backward.";

  static ANSWER_LABEL = "Q's force:";
  static ANSWER_UNIT = 'N';
  static ANSWER_MIN = -100;
  static ANSWER_MAX = 100;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === Q_VAL; }
  static answerRecapText(v) { return v === Q_VAL ? 'exactly right!' : ''; }

  static EXPLAIN_STEPS = [
    `Write the three clues as simple equations. Let p, q, r be the individual forces (each can be positive or negative): p + q = ${P_PLUS_Q}, q + r = ${Q_PLUS_R}, p + r = ${P_PLUS_R}.`,
    'Here’s the trick: add all three equations together. On the left, (p+q) + (q+r) + (p+r) = 2p + 2q + 2r, because each letter shows up in exactly two of the three clues.',
    `On the right: ${P_PLUS_Q} + (${Q_PLUS_R}) + ${P_PLUS_R} = ${P_PLUS_Q + Q_PLUS_R + P_PLUS_R}. So 2p + 2q + 2r = ${P_PLUS_Q + Q_PLUS_R + P_PLUS_R}, which means p + q + r = ${(P_PLUS_Q + Q_PLUS_R + P_PLUS_R) / 2} — the total of all three forces, found without knowing any single one yet.`,
    `Now peel off one force at a time. Since p + q + r = ${(P_PLUS_Q + Q_PLUS_R + P_PLUS_R) / 2} and we know q + r = ${Q_PLUS_R}, subtract: p = ${(P_PLUS_Q + Q_PLUS_R + P_PLUS_R) / 2} - (${Q_PLUS_R}) = ${P_VAL}.`,
    `Same trick for q: we know p + r = ${P_PLUS_R}, so q = ${(P_PLUS_Q + Q_PLUS_R + P_PLUS_R) / 2} - ${P_PLUS_R} = ${Q_VAL}.`,
    `And for r: we know p + q = ${P_PLUS_Q}, so r = ${(P_PLUS_Q + Q_PLUS_R + P_PLUS_R) / 2} - ${P_PLUS_Q} = ${R_VAL}.`,
    `Check every clue: p+q = ${P_VAL}+${Q_VAL} = ${P_VAL + Q_VAL} ✓. q+r = ${Q_VAL}+(${R_VAL}) = ${Q_VAL + R_VAL} ✓. p+r = ${P_VAL}+(${R_VAL}) = ${P_VAL + R_VAL} ✓. So Q pulls with ${Q_VAL >= 0 ? '+' : ''}${Q_VAL} N — a much smaller pull than it might have seemed at first.`,
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const cx = (area.left + area.right) / 2;
    const cy = (area.top + area.bottom) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = c.ring;
    ctx.lineWidth = 4;
    ctx.strokeStyle = SimDraw.shade(c.ring, -0.4);
    ctx.stroke();
    ctx.restore();

    const revealed = phase === 'explaining' ? explainIndex : 0;
    const showP = revealed >= 4;
    const showQ = revealed >= 5;
    const showR = revealed >= 6;

    this._rope(ctx, cx, cy, -60, 'P', c.fp, showP ? P_VAL : null);
    this._rope(ctx, cx, cy, 0, 'Q', c.fq, showQ ? Q_VAL : null);
    this._rope(ctx, cx, cy, 60, 'R', c.fr, showR ? R_VAL : null);
  }

  _rope(ctx, cx, cy, yOffset, label, color, value) {
    const y = cy + yOffset;
    const knownLen = 70;
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(color, 0.5);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - knownLen, y);
    ctx.stroke();
    ctx.restore();

    if (value == null) {
      SimDraw.drawLabel(ctx, `${label} = ?`, cx - knownLen - 30, y, { bg: this.colors.panelBg, color });
      return;
    }
    const dir = value >= 0 ? 1 : -1;
    const len = Math.max(30, Math.min(140, Math.abs(value) * 2.2));
    SimDraw.drawArrow(ctx, cx - knownLen, y, cx - knownLen + dir * len, y, { color, lineWidth: 4 });
    SimDraw.drawLabel(ctx, `${label} = ${value >= 0 ? '+' : ''}${value} N`, cx - knownLen + dir * len / 2, y - 16, { bg: this.colors.panelBg, color });
  }
}
