import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * TrainCouplingPuzzleScene — Bonus challenge for les-11 (iesc1-ch6). Three
 * coupled coaches, pulled from the front: find the tension in the coupling
 * between the 2nd and 3rd coach. Solved in two applications of F = ma —
 * once to the whole train for the shared acceleration, once to the isolated
 * rearmost coach for the coupling force actually pulling it.
 */

const M1 = 400, M2 = 300, M3 = 300; // kg, front to back
const F = 2000; // N, engine pull on the front coach
const TOTAL_MASS = M1 + M2 + M3;
const ACCEL = F / TOTAL_MASS; // 2 m/s^2
const ANSWER = M3 * ACCEL; // 600 N, tension pulling the rearmost coach

const EXTRA_TOKENS = {
  coach1: ['--sim-series-1', '#38bdf8'],
  coach2: ['--sim-series-2', '#a78bfa'],
  coach3: ['--sim-series-3', '#f472b6'],
};

export class TrainCouplingPuzzleScene extends ChallengeSceneBase {
  static simId = 'olympiad-train-coupling-puzzle';
  static label = { en: 'Bonus Challenge: The Last Coupling' };
  static category = 'science.motion';
  static ARIA_LABEL = 'Bonus challenge. Three coupled train coaches are pulled by an engine on frictionless track. Submit the tension in the coupling between the second and third coach, then step through the two-stage F equals m a solution.';

  static QUESTION_TITLE = 'Bonus Challenge: The Last Coupling';
  static QUESTION_TEXT =
    'Three coaches are coupled in a line on a frictionless track: a 400 kg coach at the front, then a 300 kg coach, then another 300 kg ' +
    'coach at the very back. An engine attached to the front coach pulls the whole train with a constant force of 2000 N. ' +
    'What is the tension in the coupling between the 2nd coach and the 3rd (rearmost) coach, in newtons — the force actually pulling ' +
    'just that last coach along?';

  static ANSWER_LABEL = 'Tension in the last coupling:';
  static ANSWER_UNIT = 'N';
  static ANSWER_MIN = 0;
  static ANSWER_MAX = 2500;
  static ANSWER_STEP = 10;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) {
    if (v === ANSWER) return 'exactly right!';
    if (v === Math.round(F / 3)) return "that's F split evenly three ways — but the coaches don't share the force equally.";
    if (v === F) return "that's the engine's full pulling force — but the last coach only feels part of it, through the coupling.";
    return 'not quite — try finding the whole train\'s acceleration first, then isolate just the last coach.';
  }

  static EXPLAIN_STEPS = [
    'Treat all three coaches as one system: total mass = 400 kg + 300 kg + 300 kg = 1000 kg.',
    'The whole system accelerates together: a = F / total mass = 2000 N / 1000 kg = 2 m/s².',
    'Now isolate just the LAST coach (300 kg). The only horizontal force on it is the coupling pulling it from the coach ahead — that coupling force is exactly what the question is asking for.',
    'That last coach still has to keep up with the same 2 m/s² as the rest of the train, since they are all coupled together. By Newton\'s second law: tension = mass × acceleration = 300 kg × 2 m/s² = 600 N.',
    'Notice it is not simply 2000 N ÷ 3. The pulling force shrinks coach by coach toward the back, because each coupling only has to accelerate the mass still behind it.',
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const y = (area.top + area.bottom) / 2;
    const spacing = (area.right - area.left - 60) / 3;
    const x1 = area.left + 30 + spacing * 0.5;
    const x2 = x1 + spacing;
    const x3 = x2 + spacing;

    ctx.save();
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x3 - 24, y);
    ctx.lineTo(x1 + 24, y);
    ctx.stroke();
    ctx.restore();

    this._coach(ctx, x1, y, c.coach1, '400 kg');
    this._coach(ctx, x2, y, c.coach2, '300 kg');
    this._coach(ctx, x3, y, c.coach3, '300 kg');

    SimDraw.drawArrow(ctx, x1 - 60, y, x1 - 26, y, { color: c.accent, lineWidth: 3 });
    SimDraw.drawLabel(ctx, '2000 N', x1 - 43, y - 12, { bg: c.panelBg, color: c.accent });

    if (phase === 'explaining' && explainIndex >= 3) {
      SimDraw.drawLabel(ctx, '600 N', (x2 + x3) / 2, y - 26, { bg: c.panelBg, color: c.coach3 });
    }
    if (phase === 'explaining' && explainIndex >= 1) {
      ctx.save();
      ctx.font = '600 13px Inter, system-ui';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'center';
      ctx.fillText('whole train: a = 2000 / 1000 = 2 m/s²', (x1 + x3) / 2, y + 46);
      ctx.restore();
    }
  }

  _coach(ctx, x, y, color, label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 26, y - 16, 52, 32, 6);
    ctx.fill();
    ctx.restore();
    SimDraw.drawLabel(ctx, label, x, y - 26, { bg: this.colors.panelBg, color });
  }
}
