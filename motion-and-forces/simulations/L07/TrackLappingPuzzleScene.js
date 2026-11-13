import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * TrackLappingPuzzleScene — Bonus challenge for les-09 (iesc1-ch4). Two
 * runners on the same circular track, same direction, different constant
 * speeds: when does the faster one first lap the slower one? Solved with
 * relative speed (gains 2 m/s of separation every second, needs a full
 * 400 m lap of separation) rather than tracking either runner's position
 * individually.
 */

const CIRCUMFERENCE = 400; // m
const SPEED_SLOW = 5; // m/s
const SPEED_FAST = 7; // m/s
const ANSWER = CIRCUMFERENCE / (SPEED_FAST - SPEED_SLOW); // 200 s

const EXTRA_TOKENS = {
  track:  ['--sim-challenge-track', '#94a3b8'],
  slow:   ['--sim-series-1', '#38bdf8'],
  fast:   ['--sim-series-2', '#fbbf24'],
};

export class TrackLappingPuzzleScene extends ChallengeSceneBase {
  static simId = 'olympiad-track-lapping-puzzle';
  static label = { en: 'Bonus Challenge: The First Lap' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. Two runners start together on a circular track at different constant speeds, same direction. Submit when the faster runner first laps the slower one, then step through the relative-speed solution.';

  static QUESTION_TITLE = 'Bonus Challenge: The First Lap';
  static QUESTION_TEXT =
    'A circular running track is 400 m around. Two friends start at the same point, at the same moment, running in the same direction: ' +
    'one at a constant 5 m/s, the other at a constant 7 m/s. After how many seconds does the faster friend first "lap" the slower one — ' +
    'catch up from behind after gaining a full 400 m on them?';

  static ANSWER_LABEL = 'Time until first lap:';
  static ANSWER_UNIT = 's';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 1000;
  static ANSWER_STEP = 5;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) {
    if (v === ANSWER) return 'exactly right!';
    if (v === CIRCUMFERENCE / SPEED_FAST) return 'that\'s how long the fast runner takes for ONE lap on their own — but the slow runner is also moving forward the whole time.';
    return 'not quite — think about how fast the GAP between them is growing, not how fast either one is running.';
  }

  static EXPLAIN_STEPS = [
    'Both runners are moving the same way, so what matters is how fast the gap between them grows — the relative speed.',
    `Relative speed = 7 m/s - 5 m/s = 2 m/s. Every second, the faster friend pulls 2 m further ahead than they were the second before.`,
    'To "lap" the slower friend, the faster one needs to gain a full circumference on them: 400 m of extra separation, not just reach the finish line first.',
    'Time = separation needed ÷ relative speed = 400 m ÷ 2 m/s = 200 s.',
    'Notice this works exactly like the two-trains puzzle from the last lesson — turn a chase into one division, by tracking the GAP instead of either runner.',
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const cx = (area.left + area.right) / 2;
    const cy = area.top + (area.bottom - area.top) * 0.52;
    const radius = Math.min((area.right - area.left) * 0.28, (area.bottom - area.top) * 0.42);

    ctx.save();
    ctx.strokeStyle = c.track;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const gapFrac = phase === 'explaining' ? Math.min(1, explainIndex / 4) : 0;
    const slowAngle = -Math.PI / 2 + gapFrac * 1.1;
    const fastAngle = -Math.PI / 2 + gapFrac * 1.1 * (SPEED_FAST / SPEED_SLOW);

    this._runner(ctx, cx, cy, radius, slowAngle, c.slow, '5 m/s');
    this._runner(ctx, cx, cy, radius, fastAngle, c.fast, '7 m/s');

    if (phase === 'explaining' && explainIndex >= 2) {
      ctx.save();
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText('gap needed to lap: one full 400 m circle', cx, cy + radius + 34);
      ctx.restore();
    }
  }

  _runner(ctx, cx, cy, radius, angle, color, label) {
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    SimDraw.drawLabel(ctx, label, x, y - 18, { bg: this.colors.panelBg, color });
  }
}
