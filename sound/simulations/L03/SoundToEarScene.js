// SoundToEarScene.js - predict setup for "What Reaches Your Ear?" (blk-l03-s02), 1 beat.
// A room: a tuning fork vibrating on a table at the left, a listener at the right, and the room
// air between them as an even, STILL field of particles. Nothing travels across, nothing reaches
// the ear, no C or R and no word for what crosses: the learner predicts that. The same picture
// on a normal mount and on the predict mount (hostRole 'setup').
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, mix, lighten, darken, alpha, rr, pill, drawFloor, drawBench, drawShadow } from 'simulations/base/kit/SimLook.js';
import { drawRings } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const FLOOR = 446;
const TABLE = { x0: 34, x1: 236, y: 330 };
const FORK = { x: 126, h: 214 };
const LISTENER = { x: 580, h: 318 };
const AIR = { x: 6, y: 24, w: 668, h: FLOOR - 40 };   // the whole room is full of air
const RUN = 5;                                  // the fork rings for a few seconds, then the room rests

export class SoundToEarScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A room. On the left a tuning fork vibrates on a table. On the right a student listens. The air in the room between them is drawn as evenly spread, still particles, with a question mark in the middle.';

  busy() { return this.age < RUN; }

  _room(ctx, c) {
    const wall = mix(c.bgSurface, c.s8, 0.1);
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR);
    g.addColorStop(0, lighten(wall, 0.08));
    g.addColorStop(1, darken(wall, 0.05));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 680, FLOOR);
    // a dado rail and panels on the lower wall, lit from the top left
    ctx.fillStyle = darken(wall, 0.06);
    ctx.fillRect(0, 300, 680, FLOOR - 300);
    ctx.fillStyle = alpha(lighten(wall, 0.5), 0.7);
    ctx.fillRect(0, 296, 680, 4);
    ctx.fillStyle = alpha(darken(wall, 0.3), 0.5);
    ctx.fillRect(0, 300, 680, 2);
    ctx.strokeStyle = alpha(darken(wall, 0.25), 0.35);
    ctx.lineWidth = 2;
    for (let x = 14; x < 680; x += 132) { rr(ctx, x, 318, 112, FLOOR - 338, 6); ctx.stroke(); }
    drawFloor(ctx, c, FLOOR, {});
  }

  draw(ctx, c) {
    const t = Math.min(this.age, RUN);
    this._room(ctx, c);
    // the room air: scattered, even and still particles in front of the wall (no wave is drawn - that is the question)
    ctx.save(); ctx.globalAlpha *= 0.75;
    drawRings(ctx, c, { cx: 340, cy: 220, field: null, t: 0, spacing: 18, r: 2.6, seed: 23, source: false, mask: AIR, maskFade: 18 });
    ctx.restore();
    drawBench(ctx, c, TABLE.x0, TABLE.x1, TABLE.y, { h: FLOOR - TABLE.y });
    const vib = 0.9 * (1 - 0.55 * clamp01(t / RUN));
    drawTuningFork(ctx, c, { x: FORK.x, y: TABLE.y - 2, h: FORK.h, vib, t, freq: 6, shadowY: TABLE.y });
    // the fork shows it vibrates only by its prongs (motion ghosts); nothing leaves it on screen
    drawShadow(ctx, c, LISTENER.x, FLOOR, 54, 10, 0.8);
    const spec = figureFor(this, { role: 'student', pose: 'relax', x: LISTENER.x, y: FLOOR, facing: -1, height: LISTENER.h, i: 2, mood: 'think', look: { t } });
    drawFigure(ctx, c, spec, null, { noShadow: true });
    pill(ctx, c, '?', 372, 196, { size: 40, bg: c.raised, fg: c.label });
  }
}
