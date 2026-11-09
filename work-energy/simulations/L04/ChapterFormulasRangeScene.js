import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { W, mix, darken, lighten } from 'simulations/base/kit/SimLook.js';
import { CHAPTER_FORMULAS } from '../L01/WorkEnergyDeck.js';

// The engine's range set is a counter band, bunting and a floor; between the
// bunting and the floor it leaves the whole gallery as bare backdrop, so two
// small targets floated in a void. These bound the backcloth drawn there.
const WALL_TOP = 104;
const WALL_BOT = 372;

// Work, kinetic energy and potential energy: the formula, the definition, the
// clue and the unit that go with each. Fair-ground range skin, targets pop up.
export class ChapterFormulasRangeScene extends ArcadeMatchScene {
  static ARIA_LABEL = 'Match the formulas: a quantity waits at the counter; hit the target showing its matching formula, definition or unit - work, kinetic energy, potential energy, all in joules - before it drops.';
  // drift stays at the archetype's 9. A target is up for drift * 0.55 s, but
  // that age is measured against run.speed, so late in a run it survives
  // 4.95 / 1.9 = 2.6 s - what a learner needs to read a prompt and pick between
  // three formulas. Cutting drift does not put more targets on the board: the
  // spawn gap is drift / 3.4, so up / gap is 1.87 whatever drift is, and only
  // two are ever up. See the design note's Look log.
  static CONFIG = { ...CHAPTER_FORMULAS, title: 'Match the formulas', ask: 'Hit the target that matches', skin: 'range', rounds: 8 };

  menuSample() {
    // The menu's three sample chips draw the prompt at 12-18 px in a 186 px
    // token, and menuSample's first three pairs are this deck's three longest
    // prompts - all three wrapped to 12 px on the first screen a learner sees.
    // The three shortest span three of the deck's four groups and stay legible.
    return [{ name: 'Gravitational potential energy', art: false }, { name: 'Work (definition)', art: false }, { name: 'SI unit of work and energy', art: false }];
  }

  drawPlay(ctx, c, t) {
    this._backcloth(ctx, c);
    super.drawPlay(ctx, c, t);
  }

  // A fairground stall has a striped backcloth behind its targets. Drawn under
  // the engine's set, so it fills the band the bunting and the floor leave bare
  // without covering a target or its answer plate.
  _backcloth(ctx, c) {
    const h = WALL_BOT - WALL_TOP;
    const col = mix(c.bgDeep, c.s6, 0.15);
    ctx.fillStyle = col;
    ctx.fillRect(0, WALL_TOP, W, h);
    // plank seams, each with a lit edge so the wall has grain, not stripes
    ctx.fillStyle = darken(col, 0.18);
    for (let x = 0; x < W; x += 44) ctx.fillRect(x, WALL_TOP, 2, h);
    ctx.fillStyle = lighten(col, 0.07);
    for (let x = 0; x < W; x += 44) ctx.fillRect(x + 2, WALL_TOP, 3, h);
    // a painted dado rail along the foot of the wall
    ctx.fillStyle = darken(col, 0.3);
    ctx.fillRect(0, WALL_BOT - 24, W, 24);
    ctx.fillStyle = lighten(col, 0.16);
    ctx.fillRect(0, WALL_BOT - 24, W, 3);
    // scalloped valance under the bunting, and the prizes dangling from it.
    // Both stay above y 130, where the highest target's plate begins.
    const vcol = mix(c.bgSurface, c.warning, 0.3);
    ctx.fillStyle = vcol;
    ctx.fillRect(0, WALL_TOP, W, 6);
    ctx.fillStyle = darken(vcol, 0.28);
    for (let x = -14; x < W + 28; x += 28) {
      ctx.beginPath();
      ctx.arc(x + 14, WALL_TOP + 6, 14, 0, Math.PI);
      ctx.fill();
    }
    const prize = [c.s1, c.s2, c.s3, c.s6, c.s4, c.s7, c.s5];
    prize.forEach((pc, i) => {
      const x = 44 + i * 98;
      ctx.strokeStyle = darken(vcol, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, WALL_TOP + 4);
      ctx.lineTo(x, WALL_TOP + 10);
      ctx.stroke();
      ctx.fillStyle = darken(pc, 0.4);
      ctx.beginPath();
      ctx.arc(x, WALL_TOP + 19, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pc;
      ctx.beginPath();
      ctx.arc(x, WALL_TOP + 17, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lighten(pc, 0.5);
      ctx.beginPath();
      ctx.ellipse(x - 3, WALL_TOP + 14, 3.5, 2.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
