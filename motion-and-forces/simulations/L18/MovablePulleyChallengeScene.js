import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { drawPulley } from '../shared/PhysicsSceneKit.js';

/**
 * MovablePulleyChallengeScene — Bonus challenge for les-18. A 4 kg box
 * hangs from a movable pulley; the string looped under it ties to a fixed
 * ceiling point on one end, and on the other runs over a fixed pulley down
 * to a freely hanging 6 kg mass (no hand this time). Released from rest,
 * find the box's acceleration.
 *
 * Two systems, two equations, one constraint: the box (isolated with its
 * movable pulley) feels 2T up against its own weight; the hanging mass
 * feels T up against its weight; and since two string segments feed the
 * movable pulley, the hanging mass's acceleration is always exactly twice
 * the box's. Combine algebraically, same elimination method as every other
 * pulley problem in this course.
 */

const M = 4, m = 6; // kg — M: box on the movable pulley; m: freely hanging mass
const G = 9.8;
const ANSWER = Math.round(((2 * m - M) * G / (M + 4 * m)) * 100) / 100; // 2.8 m/s^2, box rises
const T = Math.round((m * G - 2 * m * ANSWER) * 100) / 100; // 25.2 N

const EXTRA_TOKENS = {
  box: ['--sim-challenge-box', '#38bdf8'],
  mass: ['--sim-series-1', '#f472b6'],
};

export class MovablePulleyChallengeScene extends ChallengeSceneBase {
  static simId = 'movable-pulley-challenge';
  static label = { en: 'Bonus Challenge: Two Masses, One Movable Pulley' };
  static category = 'science.force';
  static ARIA_LABEL =
    'Bonus challenge. A 4 kilogram box hangs from a movable pulley. The string looped under it ties to a fixed ' +
    'ceiling point on one end, and on the other runs over a fixed pulley down to a freely hanging 6 kilogram ' +
    'mass. Submit the box’s acceleration, then step through the two-system, one-constraint solution.';

  static QUESTION_TITLE = 'Bonus Challenge: Two Masses, One Movable Pulley';
  static QUESTION_TEXT =
    'A 4 kg box hangs from a movable pulley. The string looped under that pulley has one end tied to a fixed ' +
    'point on the ceiling; the other end runs up, over a separate FIXED pulley, then down to a 6 kg mass hanging ' +
    'freely — nobody is holding it, just gravity on both sides. Released from rest, what is the acceleration of ' +
    'the 4 kg box, in m/s²?';

  static ANSWER_LABEL = "Box's acceleration:";
  static ANSWER_UNIT = 'm/s²';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 10;
  static ANSWER_STEP = 0.1;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return Math.abs(v - ANSWER) < 0.1; }
  static answerRecapText(v) {
    if (Math.abs(v - ANSWER) < 0.1) return 'exactly right!';
    if (Math.abs(v - 2 * ANSWER) < 0.1) return "that's the HANGING mass's acceleration — the box moves at half that rate, not the same rate.";
    if (Math.abs(v - (m - M) * G / (M + m)) < 0.1) return "that's the answer for a simple two-mass pulley without the movable-pulley constraint — here the hanging mass feeds TWO string segments, not one.";
    return 'not quite — try isolating the box and the hanging mass as two separate systems, then use the fact that the hanging mass always moves twice as fast as the box.';
  }

  static EXPLAIN_STEPS = [
    'Isolate the box and its movable pulley as one 4 kg system. Two string segments, both tension T, pull it up: 2T − (4)(9.8) = 4·a(box).',
    'Isolate the 6 kg hanging mass separately. Only one segment pulls up on it: (6)(9.8) − T = 6·a(mass).',
    'The constraint: two segments feed the movable pulley, so for every metre the box rises, the hanging mass falls two metres. Their accelerations are linked: a(mass) = 2 × a(box).',
    `Substitute that into the second equation to write T in terms of a(box), then substitute into the first — two equations, one unknown left, solved the same way as every pulley problem: a(box) = (2×${m} − ${M}) × 9.8 ÷ (${M} + 4×${m}) = ${((2*m-M)*G).toFixed(1)} ÷ ${M + 4*m} = ${ANSWER} m/s².`,
    `The 6 kg mass falls at twice that rate — ${(2 * ANSWER).toFixed(1)} m/s² — precisely because it feeds two segments' worth of string to the movable pulley for every metre the box climbs. (Tension works out to T = ${T} N.)`,
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const cx = (area.left + area.right) / 2;
    const movableX = cx - 90, fixedX = cx + 90;
    const ceilY = area.top + 6;
    const movableY = ceilY + 60;
    const fixedY = ceilY + 24;
    const massY = area.top + 130;

    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(movableX - 26, ceilY);
    ctx.lineTo(movableX - 26, movableY);
    ctx.arc(movableX, movableY, 26, Math.PI, 0, true);
    ctx.moveTo(movableX + 26, movableY);
    ctx.lineTo(fixedX - 22, fixedY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fixedX, fixedY, 22, Math.PI, 0, false);
    ctx.moveTo(fixedX + 22, fixedY);
    ctx.lineTo(fixedX + 22, massY);
    ctx.stroke();
    ctx.restore();

    drawPulley(ctx, movableX, movableY, 26, c);
    drawPulley(ctx, fixedX, fixedY, 22, c);

    // short hook linking the movable pulley to the box it carries
    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(movableX, movableY + 26);
    ctx.lineTo(movableX, movableY + 40);
    ctx.stroke();
    ctx.restore();

    this._block(ctx, movableX, movableY + 40, 58, 46, c.box, `${M} kg`);
    this._block(ctx, fixedX + 22, massY, 50, 44, c.mass, `${m} kg`);

    if (phase === 'explaining' && explainIndex >= 4) {
      SimDraw.drawLabel(ctx, `a = ${ANSWER} m/s² ↑`, movableX, movableY + 100, { bg: c.panelBg, color: c.box });
      SimDraw.drawLabel(ctx, `a = ${(2 * ANSWER).toFixed(1)} m/s² ↓`, fixedX + 22, massY + 60, { bg: c.panelBg, color: c.mass });
    }
  }

  _block(ctx, cx, topY, w, h, color, label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, topY, w, h, 6);
    ctx.fill();
    ctx.restore();
    SimDraw.drawLabel(ctx, label, cx, topY - 12, { bg: this.colors.panelBg, color });
  }
}
