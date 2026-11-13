import { ChallengeSceneBase } from '../shared/ChallengeSceneBase.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * BoatAnchorPuzzleScene — Bonus challenge for les-06 (iesc1-ch6). The
 * classic "boat + anchor overboard" puzzle: floating displaces water equal
 * to WEIGHT, sinking displaces water equal to VOLUME only — for anything
 * denser than water that's always less, so the level always falls. Pure
 * arithmetic (division, subtraction) plus the density fact given outright
 * in the question — no formula the student isn't handed directly.
 */

const ANCHOR_MASS = 60; // kg
const WATER_DENSITY = 1000; // kg/m^3
const SUNK_VOLUME = 0.02; // m^3
const TANK_AREA = 2; // m^2
const FLOAT_VOLUME = ANCHOR_MASS / WATER_DENSITY; // 0.06 m^3
// Rounded to a few decimal places throughout to sidestep binary floating-point
// noise (0.06 - 0.02 is not exactly 0.04 in JS) — these are just display/
// comparison values, not accumulated simulation state, so rounding is safe.
const VOLUME_DROP = Math.round((FLOAT_VOLUME - SUNK_VOLUME) * 1000) / 1000; // 0.04 m^3
const LEVEL_DROP_M = Math.round((VOLUME_DROP / TANK_AREA) * 1000) / 1000; // 0.02 m
const ANSWER = -Math.round(LEVEL_DROP_M * 1000); // -20 mm

const EXTRA_TOKENS = {
  water:  ['--sim-challenge-water', '#38bdf8'],
  tank:   ['--sim-series-1', '#94a3b8'],
  boat:   ['--sim-shape-alt', '#e2e8f0'],
  anchor: ['--sim-series-2', '#f87171'],
};

export class BoatAnchorPuzzleScene extends ChallengeSceneBase {
  static simId = 'bonus-boat-anchor-puzzle';
  static label = { en: 'Bonus Challenge: Overboard!' };
  static category = 'science.force';
  static ARIA_LABEL = 'Bonus challenge. An iron anchor is thrown from a floating boat into a water tank. Submit whether and by how much the water level changes, then step through the displaced-volume solution.';

  static QUESTION_TITLE = 'Bonus Challenge: Overboard!';
  static QUESTION_TEXT =
    `A small boat floats in a rectangular tank of water with a base area of ${TANK_AREA} m². Inside the boat is an iron anchor with a mass of ${ANCHOR_MASS} kg. ` +
    `(Reminder: water's density is ${WATER_DENSITY} kg per cubic metre — ${WATER_DENSITY} kg of water fills exactly 1 cubic metre.) ` +
    `The anchor is thrown overboard. It sinks to the bottom of the tank, where, fully submerged, it takes up a volume of exactly ${SUNK_VOLUME} cubic metres. ` +
    'Does the water level in the tank rise or fall — and by how many millimetres? (Use a positive number for a rise, a negative number for a fall.)';

  static ANSWER_LABEL = 'Change in level:';
  static ANSWER_UNIT = 'mm';
  static ANSWER_MIN = -200;
  static ANSWER_MAX = 200;
  static ANSWER_STEP = 1;
  static ANSWER_DEFAULT = 0;
  static EXTRA_COLOR_TOKENS = EXTRA_TOKENS;

  static isCorrect(v) { return v === ANSWER; }
  static answerRecapText(v) { return v === ANSWER ? 'exactly right!' : ''; }

  static EXPLAIN_STEPS = [
    "While the anchor sits inside the floating boat, the whole boat+anchor system floats — which means it displaces a volume of water whose WEIGHT exactly equals the boat+anchor's own weight. Let's isolate just the anchor's share of that.",
    `The anchor's weight needs to be supported by displaced water weighing the same as the anchor: ${ANCHOR_MASS} kg of water. Using ${WATER_DENSITY} kg per cubic metre, that's ${ANCHOR_MASS} / ${WATER_DENSITY} = ${FLOAT_VOLUME} cubic metres of water displaced, just to hold up the anchor's weight.`,
    `Once the anchor is thrown overboard and sinks, it's no longer floating — it just sits on the bottom, displacing water equal to its own VOLUME only: ${SUNK_VOLUME} cubic metres (given).`,
    `So the water displaced by the anchor drops from ${FLOAT_VOLUME} m³ (while afloat) to ${SUNK_VOLUME} m³ (once sunk) — a decrease of ${FLOAT_VOLUME} - ${SUNK_VOLUME} = ${VOLUME_DROP.toFixed(2)} cubic metres.`,
    `Less water displaced means the water level in the tank must fall. Spread that lost ${VOLUME_DROP.toFixed(2)} m³ over the tank's base area of ${TANK_AREA} m²: drop in height = ${VOLUME_DROP.toFixed(2)} / ${TANK_AREA} = ${LEVEL_DROP_M} m = ${Math.abs(ANSWER)} mm.`,
    `So the level falls by ${Math.abs(ANSWER)} mm. The key idea: floating displaces water equal to WEIGHT; sinking displaces water equal to VOLUME only — and for anything denser than water (like iron), weight-worth of water is always more than volume-worth, so the level always drops when a sinking object goes overboard.`,
  ];

  _drawPuzzle(ctx, { phase, explainIndex, area }) {
    const c = this.colors;
    const tankLeft = area.left + 40;
    const tankRight = area.right - 40;
    const tankTop = area.top + 10;
    const tankBottom = area.bottom - 10;
    const baseLevel = tankTop + (tankBottom - tankTop) * 0.35;

    const sunk = phase === 'explaining' && explainIndex >= 3;
    const showDrop = phase === 'explaining' && explainIndex >= 5;
    const levelY = showDrop ? baseLevel + 14 : baseLevel;

    ctx.save();
    ctx.strokeStyle = c.tank;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(tankLeft, tankTop, tankRight - tankLeft, tankBottom - tankTop);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(c.water, 0.3);
    ctx.fillRect(tankLeft, levelY, tankRight - tankLeft, tankBottom - levelY);
    ctx.strokeStyle = c.water;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankLeft, levelY);
    ctx.lineTo(tankRight, levelY);
    ctx.stroke();
    ctx.restore();

    if (showDrop) {
      ctx.save();
      ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(tankLeft, baseLevel);
      ctx.lineTo(tankRight, baseLevel);
      ctx.stroke();
      ctx.restore();
      SimDraw.drawLabel(ctx, 'original level', tankRight - 60, baseLevel, { bg: c.panelBg, color: c.muted });
    }

    if (!sunk) {
      const boatX = (tankLeft + tankRight) / 2;
      ctx.save();
      SimDraw.drawPanel(ctx, boatX - 40, levelY - 16, 80, 20, { bg: c.boat, radius: 4 });
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(boatX, levelY - 12, 8, 0, Math.PI * 2);
      ctx.fillStyle = c.anchor;
      ctx.fill();
      ctx.restore();
      SimDraw.drawLabel(ctx, 'boat + anchor', boatX, levelY - 34, { bg: c.panelBg, color: c.boat });
    } else {
      const anchorX = (tankLeft + tankRight) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(anchorX, tankBottom - 16, 10, 0, Math.PI * 2);
      ctx.fillStyle = c.anchor;
      ctx.fill();
      ctx.restore();
      SimDraw.drawLabel(ctx, 'anchor (sunk)', anchorX, tankBottom - 30, { bg: c.panelBg, color: c.anchor });
      const boatX = tankLeft + 60;
      ctx.save();
      SimDraw.drawPanel(ctx, boatX - 30, levelY - 14, 60, 16, { bg: c.boat, radius: 4 });
      ctx.restore();
      SimDraw.drawLabel(ctx, 'boat (lighter now)', boatX, levelY - 30, { bg: c.panelBg, color: c.boat });
    }
  }
}
