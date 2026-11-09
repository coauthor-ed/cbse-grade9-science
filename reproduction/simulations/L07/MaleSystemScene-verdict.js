import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, noteLineHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import {
  MALE_SYSTEM_KIT_CSS,
  cutawaySvg,
  temperaturePanelHtml,
  bindSvgPress,
  ORGAN_CHIPS,
  READINGS,
  RING_MAIN,
  RING_SECOND,
  POUCH_DOWN,
} from './MaleSystemKit.js';

/**
 * What the pouch is actually for - the verdict mount of s03.
 *
 * The body is drawn once, from `MaleSystemKit`, and never changes shape. What changes is which
 * organ carries a ring and which chips sit under the drawing, and both come from the beat. The two
 * temperature readings are held apart on every beat and are not inputs here: the verdict is
 * already established, and letting the learner raise the pouch would reopen the question the slide
 * has just closed.
 *
 * The one thing the learner can do at any point is tap an organ to move the ring to it and read
 * its plain-name chip - so a learner who wants the vas deferens on beat 0 can go and get it.
 */

// One entry per lesson beat, five beats on blk-l07-s03.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // beat 0: the verdict's picture, before it is said - no ring, no chips
  [{ idx: 1, dwellMs: null }], // beat 1: held, identical to beat 0; the dead end is killed in prose
  [{ idx: 2, dwellMs: null }], // beat 2: one testis ringed, two chips - sperm and the hormone
  [{ idx: 3, dwellMs: null }], // beat 3: the vas deferens ringed, the urethra in the lighter second ring
  [{ idx: 4, dwellMs: null }], // beat 4: both glands ringed, two chips, one lone sperm in the corner
];

/**
 * The tour, one entry per beat. `ring` is which organ carries which ring treatment and `chips` are
 * the beat's own claims in the slide's order; both come from the kit so a tap chip and a beat chip
 * are the same string. Beats 0 and 1 carry neither: nothing is named before the slide names it, and
 * beat 1 must show no solved state, no tick and no word "answer".
 */
const TOUR = [
  { ring: {}, chips: [], sperm: false },
  { ring: {}, chips: [], sperm: false },
  { ring: { testis: RING_MAIN }, chips: [ORGAN_CHIPS.testis, 'makes a hormone too'], sperm: false },
  { ring: { vas: RING_MAIN, urethra: RING_SECOND }, chips: [ORGAN_CHIPS.vas, ORGAN_CHIPS.urethra], sperm: false },
  {
    ring: { glands: RING_MAIN },
    // Both glands pour fluid, so both carry the claim. The slide names them separately, so each
    // chip names its own gland first: two identical chips in a row read as a rendering fault.
    chips: ['seminal vesicle adds fluid', 'prostate adds fluid'],
    sperm: true,
  },
];

/** The chips of a tapped organ, one for its own plain name, so a tap reads the same as a beat. */
function chipFor(organ) {
  return ORGAN_CHIPS[organ] || '';
}

const CSS = SIM_LOOK_DOM_CSS + MALE_SYSTEM_KIT_CSS + `
.mv-root {
  display: flex;
  flex-direction: column;
  gap: var(--sim-space-2);
  width: 100%;
  min-width: 0;
}

.mv-hero-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sim-space-1);
  margin: var(--sim-space-1) 0 0;
}

.mv-chips { display: flex; flex-wrap: wrap; gap: var(--sim-space-1); min-height: 0; }
.mv-chips:empty { display: none; }

.mv-hint {
  font-size: var(--sim-text-sm);
  font-weight: 700;
  color: var(--sim-label-muted);
}

.mv-side { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }

.mv-aside {
  padding: var(--sim-space-2) var(--sim-space-3);
  border: var(--sim-border);
  border-radius: var(--sim-radius-md);
  background: var(--sim-bg-cell);
  font-size: var(--sim-text-sm);
  color: var(--sim-label-muted);
}
`;

export class MaleSystemSceneVerdictScene extends DomSimulation {
  static WIDTH = 620;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 400;
  // Measured: a tap on beat 0 fills the chip row and the portrait frame reaches 846 px.
  static PORTRAIT_HEIGHT = 860;
  static FIT = true;
  static ARIA_LABEL =
    'A guided tour of the male reproductive system in side section: the scrotum hangs below the body with two readings apart, and each beat rings one organ - a testis, the vas deferens and the shared urethra, then the two fluid glands.';
  static CONTROLS = [];
  static BEAT_STEP_MAP = BEAT_STEP_MAP;

  async setup() {
    await super.setup();

    // What the beat says, and what the learner has summoned since. The beat wins on every change.
    this._mvBeat = 0;
    this._mvTap = null;
    this._mvBurstBeat = -1;
    this._mvBurstOrgan = null;

    this.render({
      css: CSS,
      rootClass: 'mv-root sl-backdrop',
      html: `
        <div class="mk-root">
          <div class="mk-head">
            <h2 class="mk-title" role="heading" aria-level="2">What the pouch is for</h2>
            <span class="sim-tag">schematic</span>
          </div>

          <div class="mk-frame">
            <div class="mk-hero" id="mv-hero">
              ${cutawaySvg({ scrotum: POUCH_DOWN })}
              <div class="mv-hero-foot">
                <div class="mv-chips" id="mv-chips"></div>
                <div class="mv-hint" id="mv-hint">tap any organ to read its chip</div>
              </div>
            </div>

            <div class="mk-side">
              ${temperaturePanelHtml({ on: true, body: READINGS.body, testes: READINGS.testes })}
              <div class="mv-aside" id="mv-aside">
                The scrotum hangs below the body, and the reading down at the pouch sits lower than
                the reading up at the abdomen.
              </div>
            </div>
          </div>

          ${noteLineHtml([
            {
              text: 'A diagram of the arrangement, not to scale: the urethra really is shared by two jobs, at different times.',
            },
          ])}
        </div>
      `,
    });

    this._mvHeroEl = this.root.querySelector('#mv-hero');
    this._mvSvgEl = this.root.querySelector('.mk-cutaway');
    this._mvChipsEl = this.root.querySelector('#mv-chips');
    this._mvHintEl = this.root.querySelector('#mv-hint');
    this._mvAsideEl = this.root.querySelector('#mv-aside');

    this._mvSvgEl?.querySelectorAll('.mk-hit[data-organ]').forEach((el) => {
      bindSvgPress(el, () => this.tapOrgan(el.dataset.organ));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.tapOrgan(el.dataset.organ);
        }
      });
    });

    this.paint();
    this.onStep(this.stepIndex, 0);
  }

  /**
   * The beat only sets what the tour has reached. Any tap the learner made before it is dropped,
   * so a beat never arrives wearing the previous beat's answer.
   */
  onStep(step, beat) {
    if (!this._mvSvgEl) return;
    const b = Number.isInteger(beat) ? beat : Number(step) || 0;
    this._mvBeat = TOUR[b] ? b : 0;
    this._mvTap = null;
    this.paint();
  }

  /** Tap any organ, at any beat: the ring moves there and its plain-name chip comes up. */
  tapOrgan(organ) {
    if (!ORGAN_CHIPS[organ]) return;
    this._mvTap = organ;
    this.paint();
    this.celebrateIfThisBeat(organ);
  }

  /**
   * The one celebration on this mount: the learner found the organ the beat is about. Beats 0 and
   * 1 ring nothing, so nothing can fire there and the still frame stays a still frame.
   */
  celebrateIfThisBeat(organ) {
    const beat = TOUR[this._mvBeat];
    if (!beat || !beat.ring[organ]) return;
    if (this._mvBurstBeat === this._mvBeat && this._mvBurstOrgan === organ) return;
    this._mvBurstBeat = this._mvBeat;
    this._mvBurstOrgan = organ;
    burst(this._mvHeroEl);
  }

  paint() {
    if (!this._mvSvgEl) return;
    const beat = TOUR[this._mvBeat] || TOUR[0];

    // The ring map is the beat's, with the learner's own tap laid over it.
    const ring = { ...beat.ring };
    const tapped = this._mvTap;
    if (tapped) {
      for (const key of Object.keys(ring)) delete ring[key];
      ring[tapped] = RING_MAIN;
    }

    this._mvSvgEl.dataset.scrotum = POUCH_DOWN;
    this._mvSvgEl.dataset.sperm = beat.sperm ? '1' : '0';
    this._mvSvgEl.querySelectorAll('.mk-organgrp').forEach((grp) => {
      grp.dataset.ring = ring[grp.dataset.organ] || '';
    });

    const chips = tapped ? [chipFor(tapped)] : beat.chips;
    this._mvChipsEl.innerHTML = chips
      .map((text) => `<span class="sim-tag${text ? ' sim-tag--accent' : ''}">${esc(text)}</span>`)
      .join('');
    this._mvHintEl.hidden = chips.length > 0;
    this.refit();
  }
}