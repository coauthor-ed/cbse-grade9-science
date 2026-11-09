import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { FLOWER_PARTS } from '../L01/ReproductionDeck.js';

// Ten flower parts. No art and no glyph: a drawing would answer itself.
export class FlowerPartMatchScene extends ArcadeMatchScene {
  menuSample() { return this.cfg.pairs.slice(0, 3).map((x) => ({ name: x.prompt, art: false })); }
  static ARIA_LABEL = 'Name the part: a flower part waits at the counter; hit the target showing what it is before it drops: sepal, petal, stamen, pistil, anther, filament, stigma, style, ovary and ovule.';
  static CONFIG = {
    ...FLOWER_PARTS,
    title: 'Name the Part',
    how: 'Hit the target that says what each flower part is.',
    ask: 'This part is',
    skin: 'range',
    rounds: 10,
    // The range skin spawns one target every drift/3.4 s and keeps at most 3
    // live across 6 stall spots, and a target lives drift * 0.55 s on its post.
    // 6 s fills the three spots sooner than the default 9, which leaves the
    // hero zone half plain backdrop for the opening seconds, while still
    // giving a live target 3.3 s - enough for a two-line label at 12-16 px.
    drift: 6,
  };
}