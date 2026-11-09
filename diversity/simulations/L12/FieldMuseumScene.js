import { MuseumScene } from '../kit/MuseumScene.js';

// Your museum: reads the saved collection.
const CONFIG = {
  "ariaLabel": "Your museum of life: a plaque for everything you have identified.",
  "title": "Museum of Life"
};

export class FieldMuseumScene extends MuseumScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
}
