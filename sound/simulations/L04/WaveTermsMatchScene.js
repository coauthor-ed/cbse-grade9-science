// WaveTermsMatchScene - the L04 arcade slide: a wave word waits on the card at
// the bottom and its meaning drifts past in a bubble. Words only, no pictures and
// no tint: the match is on the definition, never on a resemblance.
// Design note: courses/sound/simulations/L04/WaveTermsMatchScene.design.md
import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { WAVE_TERMS_TO_MEANING } from './SoundDeck.js';

export class WaveTermsMatchScene extends ArcadeMatchScene {
  static ARIA_LABEL = 'Wave words match: a wave word waits on the card at the bottom; tap the bubble that gives its meaning before it floats away.';
  static CONFIG = {
    ...WAVE_TERMS_TO_MEANING,
    title: 'Wave words',
    ask: 'Tap what it means',
    skin: 'bubbles',
    rounds: 12,
  };
  // The menu shows three wave words only, never a word with its meaning.
  menuSample() { return ['Wavelength', 'Frequency', 'Hertz'].map((name) => ({ name, art: false })); }
}
