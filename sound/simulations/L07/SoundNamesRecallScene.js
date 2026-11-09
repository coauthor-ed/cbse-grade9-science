import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';

// Giving the chapter's twenty-two sound names back (blk-l07-a01), on the kit's
// own recall board: one name per round, twenty-two rounds, one beat. Every
// root, plain name, meaning and face comes from the course glossary through
// config.glossaryTerm(id) - this file names ids and nothing else, so a later
// edit to a gloss in glossary.json changes this scene with no code change.
//
// No number of any kind (no frequency, no wavelength, no period), no use and no
// job - no bat, no sonar ship, no scanner, no earthquake: the stub keeps those
// for the slides around this one. This is the last slide of the chapter and the
// names are the whole content.

// The kit keeps its own escaping helper module-private, so a subclass that
// builds the kit's markup needs its own. Same table as the kit's.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CONFIG = {
  ariaLabel: 'Sound names: read the plain description and give the name back',
  mode: 'recall',
  // The slide asks the learner to read each description, so the plain
  // description is shown from the start.
  plainCue: true,
  // 'idea' fills the kit's name-way prompt ("Which name goes with this idea?").
  // 'name' (the stub's suggestion) makes that prompt read "Which name goes
  // with this name?"; 'sound' misfits the ten items that name a stuff, a wave,
  // an effect or a method rather than a sound.
  noun: 'idea',
  // The chapter's own twenty-two names, in the order L01-L07 taught them. The
  // kit walks this list in order, so it is also what sets the decoys: it builds
  // its option pool as [...new Set([...terms, ...pool])], terms first, so every
  // wrong option it can draw is already one of these twenty-two and none of them
  // is ever from outside.
  terms: [
    'medium', 'compression', 'rarefaction', 'longitudinal', 'transverse',
    'mechanical-wave', 'wavelength', 'frequency', 'hertz', 'time-period',
    'amplitude', 'intensity', 'pitch', 'loudness', 'infrasonic', 'ultrasonic',
    'reflection', 'echo', 'reverberation', 'timbre', 'echolocation', 'sonar',
  ],
  // The chapter's own confusable set, written because the stub asks for a pool
  // drawn from the same twenty-two. Read it as documentation rather than as
  // steering: it adds no id to the option pool (see above) and cannot move a
  // single decoy. The pairs the board actually shows are fixed by the order of
  // `terms` - the kit draws the right option plus others[at] and others[at+1]
  // of that same twenty-two, where at = 2 x position.
  pool: [
    'compression', 'rarefaction', 'longitudinal', 'transverse',
    'mechanical-wave', 'wavelength', 'frequency', 'hertz', 'time-period',
    'amplitude', 'intensity', 'pitch', 'loudness', 'infrasonic', 'ultrasonic',
    'reflection', 'echo', 'reverberation', 'echolocation', 'sonar',
  ],
  // The closing line, shown on the kit's end card below. The stub's own note
  // for this panel: these are the words this chapter built, not a new set.
  done: 'Every one of these twenty-two was built earlier in this chapter. Nothing here is a new word.',
};

export class SoundNamesRecallScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Content-sized frame. The round's own height swings by ~170px between an
  // unsolved round (a prompt, a face, three chips) and a solved one (a face, a
  // face's everyday name, three chips, the glossary's sentence, Next name), and
  // the kit's HEIGHT is sized for the tallest: on a fixed frame the short
  // states hang in a 200px empty band under the board. The base class's
  // default, so this is the one layout line this file changes.
  static FIT = true;

  // The kit's head draws one 14px pip per item, and this round has
  // twenty-two of them: they overflow the 380px portrait frame by 24px
  // (sim-layout: .ek-pips clipped, .ek-head 36px wider than its box). This
  // keeps the kit's own head markup, classes and colours and shows the round's
  // position as the count the same pip row already carries in its aria-label,
  // in the kit's own `.ek-pips b`. Progress mark, not a score - the number of
  // names answered so far, never a tally of right answers.
  _head() {
    const done = this.pos >= this.queue.length;
    const n = Math.min(this.pos + (this.solved ? 1 : 0), this.total);
    const where = done ? this.total : Math.min(this.pos + 1, this.total);
    return `<div class="ek-head"><div class="ek-title">${esc(this.cfg.title || 'Name check')}</div>`
      + `<div class="ek-pips" aria-label="${where} of ${this.total}"><b>${n}/${this.total}</b></div></div>`;
  }

  // The kit's closing card opens with a count ("14 of 22 first time"), a line
  // naming every term the learner missed, and a two-column grid of all
  // twenty-two faces and names. A score and a wall of cards, and the stub asks
  // for a panel that does not grade and does not teach: this keeps the kit's
  // own paragraph carrying the scene's `done` line and the kit's own Go again
  // button, and drops the count, the missed list and the grid. Markup and
  // classes are the kit's, unchanged.
  _end() {
    return {
      stage: `<p class="nd-prompt">${esc(this.cfg.done || '')}</p>`,
      foot: '<button type="button" class="ek-btn" data-act="again">Go again</button>',
    };
  }
}