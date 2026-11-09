import { CardPacksScene } from '../kit/CardPacksScene.js';

// Card packs and album.
const CONFIG = {
  "ariaLabel": "Open card packs and fill your album of organisms.",
  "title": "Card packs"
};

export class CardAlbumScene extends CardPacksScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
}
