import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * CyclistRunnerPuzzleScene — Bonus challenge for les-08 (iesc1-ch4). Tests
 * whether a student actually internalised "area under the graph, not peak
 * height, decides total distance" by pitting a cyclist who reaches a much
 * higher top speed against a runner at a steady, lower speed — and asking
 * who's ahead after 20 s. Pure triangle/rectangle area arithmetic.
 */

const CYCLIST_PEAK = 20; // m/s, reached at t=10s
const CYCLIST_CRUISE = 5; // m/s, held from t=10s to t=20s
const RUNNER_SPEED = 15; // m/s, constant
const CYCLIST_DIST = 0.5 * 10 * CYCLIST_PEAK + CYCLIST_CRUISE * 10; // 150 m
const RUNNER_DIST = RUNNER_SPEED * 20; // 300 m
const ANSWER = RUNNER_DIST - CYCLIST_DIST; // 150 m, runner ahead

const EXTRA_TOKENS = {
  cyclist: ['--sim-series-1', '#38bdf8'],
  runner:  ['--sim-series-2', '#fbbf24'],
};

export class CyclistRunnerPuzzleScene extends ChallengeSceneBase {
  static simId = 'olympiad-cyclist-runner-puzzle';
  static label = { en: 'Bonus Challenge: Cyclist vs. Runner' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. A cyclist reaches a high top speed on a velocity-time graph while a runner holds a steady, lower speed. Submit which one is ahead after twenty seconds and by how much, then step through the area-under-the-graph solution.';

  static QUESTION_TITLE = 'Bonus Challenge: Cyclist vs. Runner';
  static QUESTION_TEXT =
    "A cyclist's velocity-time graph is a straight line rising from 0 m/s at t = 0 s to 20 m/s at t = 10 s, then it instantly drops and " +
    'stays flat at a constant 5 m/s from t = 10 s to t = 20 s. Meanwhile, Runner X starts at the same place and moment, running at a ' +
    'constant 15 m/s for the entire 20 s. By t = 20 s, how many metres AHEAD of the cyclist is Runner X? ' +
    '(Enter a negative number if the runner is actually behind.)';

  static ANSWER_LABEL = 'Runner X is ahead by:';
  static ANSWER_UNIT = 'm';
  static ANSWER_MIN = -200;
  static ANSWER_MAX = 400;
  static ANSWER_STEP = 5;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) {
    if (v === ANSWER) return 'exactly right!';
    if (v === -ANSWER) return "close in size, but check who's actually ahead.";
    return "not quite — remember, it's the area under the graph that counts, not the peak speed.";
  }

  static EXPLAIN_STEPS = [
    "The cyclist's distance is the area under her velocity-time graph. Split the shaded region into a triangle (0-10 s) and a rectangle (10-20 s).",
    'Triangle: ½ × 10 s × 20 m/s = 100 m. Rectangle: 5 m/s × 10 s = 50 m. Cyclist\'s total distance = 100 + 50 = 150 m.',
    'Runner X moves at a steady 15 m/s for the full 20 s: distance = 15 m/s × 20 s = 300 m.',
    'Difference: 300 m - 150 m = 150 m. Runner X finishes 150 m ahead — even though the cyclist briefly moved faster than the runner ever did.',
    "A graph's tallest point isn't what wins a race over time. The AREA underneath — average speed × time — is what actually counts.",
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const plotLeft = area.left + 50;
    const plotRight = area.right - 20;
    const plotBottom = area.top + (area.bottom - area.top) * 0.62;
    const plotTop = area.top + 6;
    const tMax = 20, vMax = 22;
    const xOf = (t) => plotLeft + (t / tMax) * (plotRight - plotLeft);
    const yOf = (v) => plotBottom - (v / vMax) * (plotBottom - plotTop);

    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotTop);
    ctx.lineTo(plotLeft, plotBottom);
    ctx.lineTo(plotRight, plotBottom);
    ctx.stroke();
    ctx.restore();

    // Cyclist's velocity-time trapezoid.
    ctx.save();
    ctx.strokeStyle = c.cyclist;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(0));
    ctx.lineTo(xOf(10), yOf(CYCLIST_PEAK));
    ctx.lineTo(xOf(10), yOf(CYCLIST_CRUISE));
    ctx.lineTo(xOf(20), yOf(CYCLIST_CRUISE));
    ctx.stroke();
    ctx.restore();
    SimDraw.drawLabel(ctx, 'cyclist', xOf(10), yOf(CYCLIST_PEAK) - 10, { bg: c.panelBg, color: c.cyclist });

    // Runner's constant-speed line.
    ctx.save();
    ctx.strokeStyle = c.runner;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(RUNNER_SPEED));
    ctx.lineTo(xOf(20), yOf(RUNNER_SPEED));
    ctx.stroke();
    ctx.restore();
    SimDraw.drawLabel(ctx, 'runner X, steady 15 m/s', xOf(15), yOf(RUNNER_SPEED) - 10, { bg: c.panelBg, color: c.runner });

    if (phase === 'explaining' && explainIndex >= 2) {
      ctx.save();
      ctx.fillStyle = SimDraw.withAlpha(c.cyclist, 0.25);
      ctx.beginPath();
      ctx.moveTo(xOf(0), plotBottom);
      ctx.lineTo(xOf(0), yOf(0));
      ctx.lineTo(xOf(10), yOf(CYCLIST_PEAK));
      ctx.lineTo(xOf(10), yOf(CYCLIST_CRUISE));
      ctx.lineTo(xOf(20), yOf(CYCLIST_CRUISE));
      ctx.lineTo(xOf(20), plotBottom);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (phase === 'explaining' && explainIndex >= 4) {
      const barY = plotBottom + 24;
      const barH = 14;
      const maxDist = RUNNER_DIST;
      const scale = (plotRight - plotLeft) / maxDist;
      ctx.save();
      ctx.fillStyle = c.cyclist;
      ctx.fillRect(plotLeft, barY, CYCLIST_DIST * scale, barH);
      ctx.fillStyle = c.runner;
      ctx.fillRect(plotLeft, barY + barH + 6, RUNNER_DIST * scale, barH);
      ctx.font = '600 11px Inter, system-ui';
      ctx.fillStyle = c.label;
      ctx.textAlign = 'left';
      ctx.fillText(`cyclist: ${CYCLIST_DIST} m`, plotLeft, barY - 4);
      ctx.fillText(`runner: ${RUNNER_DIST} m`, plotLeft, barY + barH + 6 + barH + 14);
      ctx.restore();
    }
  }
}
