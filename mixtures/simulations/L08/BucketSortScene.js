import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { MIXTURE_SORT } from './MixturesDeck.js';

// Three bins, seven samples: the chapter's Table 5.2 sort as a timed catch.
// The deck carries the evidence; this file is a CONFIG plus two small hooks
// that keep a two-bin item honest (see _bothBin / _bothWhy below).
export class BucketSortScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Three bins, seven samples: a sample falls past you; tap the bin it belongs in - solution, suspension or colloid. Some property words are right in two of the bins.';
  static CONFIG = { ...MIXTURE_SORT, title: 'Three bins', skin: 'sky', rounds: 12 };

  /** The bins an item is right in, in deck order; more than one means a two-bin item. */
  _binsOf(item) {
    return [].concat(item?.is || []).map((id) => (this.cfg.groups || []).find((g) => g.id === id)).filter(Boolean);
  }

  /**
   * A two-bin item must never name one bin as the expected answer - naming
   * either would teach the learner that the other is wrong. Both hooks below
   * pass through untouched for single-bin items, which is every other item in
   * the deck and the whole of L09's game beside it.
   */
  _bothBin(info) {
    const bins = this._binsOf(info.item);
    if (bins.length < 2) return info;
    return { ...info, answer: `${info.item.name} fits ${bins.map((g) => g.label).join(' and ')}` };
  }

  wrongTry(info) {
    super.wrongTry(this._bothBin(info));
  }

  slip(info) {
    super.slip(this._bothBin(info));
  }

  /** Light every bin the item belongs in, not just the first one the engine finds. */
  whyHint(ctx, c, w) {
    const bins = this._binsOf(w.item);
    bins.forEach((g) => {
      const i = this.play.bins.findIndex((b) => b.g === g);
      if (i >= 0) this._drawBin(ctx, c, this.play.bins[i], i, this.clock, true);
    });
  }
}