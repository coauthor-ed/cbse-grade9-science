// FrequencySortScene - the L05 arcade slide: one sound falls at a time and the
// learner drops it into the range it belongs to - under 20 Hz, inside the human
// band, or above 20 kHz. Words only, no pictures and no tint: the sort is run
// on the frequency behind each sound, never on how it looks or how loud it
// sounds, which is the one mistake the slide warns about.
// Design note: courses/sound/simulations/L05/FrequencySortScene.design.md
import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { HEARING_RANGES } from '../L04/SoundDeck.js';

export class FrequencySortScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Sound ranges: one sound falls at a time; tap the range it belongs to - below 20 hertz, inside 20 hertz to 20 kilohertz, or above 20 kilohertz.';
  static CONFIG = {
    ...HEARING_RANGES,
    title: 'Which range?',
    skin: 'sky',
    rounds: 12,
  };
  // The menu shows the three ranges, never a sound already in its bin.
  menuSample() { return ['Infrasonic', 'Audible', 'Ultrasonic'].map((name) => ({ name, art: false })); }
}