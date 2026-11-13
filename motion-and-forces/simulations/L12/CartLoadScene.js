/**
 * CartLoadScene - predict blk-l14-s2 "Same pull, heavier cart" (setup) and explain blk-l14-s3 "Newton's second
 * law" (3 beats). Thin: CartLabScene MODE 'load'.
 *   setup       the cart with extra load at the start line, the same cup; nothing runs; no answer.
 *   b0 'heavier' two runs stacked, same cup: "cart" and "cart, double mass" (a about 0.55 x); bars a.
 *   b1 'law'     law card a = F / m, F = ma; a cart with "net force" and "acceleration" the same way.
 *   b2 'newton'  1 kg block, 1 N, 1 m/s sq; an open palm holding a 100 g mass, about 1 N up into it.
 */
import { CartLabScene } from './CartLabScene.js';

const SETUP = 9;

export class CartLoadScene extends CartLabScene {
  static MODE = 'load';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'Same pull, heavier cart. The cardboard cart now carries extra blocks, doubling its mass, and is pulled by the same cup with the same coins. Released together with an empty cart, the heavier cart has a smaller acceleration, a little more than half, and reaches the pipe later. Newton\'s second law: when a net force acts on an object, it accelerates in the direction of the net force; the acceleration is proportional to the net force and inversely proportional to the mass, a = F / m, or F = ma. One newton gives a mass of 1 kilogram an acceleration of 1 metre per second squared, and it is about the force of a 100 gram mass resting on your open palm.';

  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
}
