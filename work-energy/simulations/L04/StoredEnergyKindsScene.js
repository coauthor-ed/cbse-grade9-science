import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import { esc } from 'simulations/base/SimUi.js';

const W = 680;

// Ten cards, the slide's own names and nothing longer. Short enough that every
// one fits a card in two lines, which is what lets the classification be
// answerable from the labels alone with no card needing a sentence.
const CARDS = [
  { id: 'bow', label: 'bent bow', zone: 's1', fam: 'deform', ans: 'yes' },
  { id: 'spring', label: 'compressed spring', zone: 's1', fam: 'deform', ans: 'yes' },
  { id: 'band', label: 'slingshot band', zone: 'floor', fam: 'deform', ans: 'yes' },
  { id: 'winder', label: 'wound watch spring', zone: 'floor', fam: 'deform', ans: 'yes' },
  { id: 'tube', label: 'loaded rubber tube', zone: 'floor', fam: 'deform', ans: 'yes' },
  { id: 'magnets', label: 'pair of magnets', zone: 's2', fam: 'separate', ans: 'yes' },
  { id: 'charges', label: 'pair of charges', zone: 'floor', fam: 'separate', ans: 'yes' },
  { id: 'ball', label: 'ball in the air', zone: 'floor', fam: 'separate', ans: 'yes' },
  { id: 'book', label: 'book on a shelf', zone: 'floor', fam: 'separate', ans: 'yes' },
  { id: 'box', label: 'box being dragged', zone: 'floor', fam: 'none', ans: 'no' },
];

const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// A shelf accepts a card only if the card's family is that shelf's family, and
// the third shelf accepts nothing. A pure function of the pair, so every
// refusal is reproducible from any arrangement, on any beat.
function takes(zone, card) {
  if (zone === 's1') return card.fam === 'deform';
  if (zone === 's2') return card.fam === 'separate';
  return false;
}

const ICONS = {
  bow: '<path d="M6 4 C 17 8 17 16 6 20"/><path d="M6 4 L6 20"/>',
  spring: '<path d="M3 7 h4 v10 h4 V7 h4 v10 h4"/>',
  band: '<path d="M7 4 L12 11 L17 4"/><path d="M12 11 v8"/><path d="M9.5 19 h5"/>',
  winder: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.2"/>',
  tube: '<path d="M3 9 h18 v6 h-18 z"/><path d="M7.5 9 q2 3 0 6"/><path d="M12 9 q2 3 0 6"/><path d="M16.5 9 q2 3 0 6"/>',
  magnets: '<rect x="3" y="7" width="7" height="11" rx="2"/><rect x="14" y="7" width="7" height="11" rx="2"/>',
  charges: '<circle cx="8" cy="12" r="4.4"/><path d="M14.5 12 h6 M17.5 8.5 v7"/>',
  ball: '<circle cx="12" cy="7" r="4.4"/><line x1="3" y1="18.5" x2="21" y2="18.5"/>',
  book: '<rect x="6.5" y="4" width="11" height="7" rx="1.5"/><line x1="2.5" y1="16" x2="21.5" y2="16"/><line x1="6" y1="16" x2="6" y2="21"/>',
  box: '<rect x="3.5" y="6.5" width="11" height="10" rx="1.5"/><path d="M17 11.5 l3.5 0 m-1.6 -1.6 l1.6 1.6 l-1.6 1.6"/><line x1="2.5" y1="20" x2="21.5" y2="20"/>',
};

function iconSvg(id) {
  return `<svg class="sek-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id]}</svg>`;
}

const NOTE_ROWS = [
  { text: 'The third shelf is empty on purpose', sub: 'nothing on this list belongs on it' },
  { text: 'One card fits none of the three', sub: 'that is the one worth watching' },
];

const CSS = `
/* The two family shelves side by side, one card to a row in each: a card needs
   about 230px to carry "wound watch spring" on ONE line beside its glyph, so a
   shelf has to be half the board rather than a third. Each slot is reserved for
   its worst case - all five cards of one family on one shelf - so no drop ever
   resizes the frame under the learner's hand. */
.sek-zones { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sim-space-2); align-items: start; }
.sek-z1 .sek-slot, .sek-z2 .sek-slot { grid-template-columns: minmax(0, 1fr); min-height: 194px; }
.sek-zone { position: relative; display: flex; flex-direction: column; gap: 5px; padding: var(--sim-space-2); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; text-align: left; cursor: pointer; transition: border-color 200ms ease, background-color 200ms ease; }
.sek-zone:hover { border-color: var(--sim-accent); }
.sek-zhead { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
.sek-ztag { font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.06em; border-radius: var(--sim-radius-sm); }
.sek-zsub { font-size: var(--sim-text-sm); color: var(--sim-label-muted); min-width: 0; overflow-wrap: anywhere; }
.sek-slot { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; align-content: start; padding: 5px; border: 2px solid color-mix(in oklab, var(--sim-stroke) 70%, transparent); border-radius: var(--sim-radius-sm); background-color: var(--sim-bg-deep); background-image: repeating-linear-gradient(180deg, transparent 0 43px, color-mix(in oklab, var(--sim-stroke) 34%, transparent) 43px 45px); background-position: 0 5px; }
/* the shelf board under the cards: a lit lip and a cushion shade, so a card
   lands on something rather than on a box outline */
.sek-lip { height: 7px; margin: -3px 0 0; border-radius: 3px; background: linear-gradient(color-mix(in oklab, var(--sim-label) 42%, var(--sim-bg-surface)), color-mix(in oklab, var(--sim-label) 20%, var(--sim-bg-surface))); }
/* the third shelf is a shelf that never got filled: dashed, and its empty slot
   says so in words the learner cannot mistake for a caption */
/* the third shelf and the unsorted pile share the second row: the third is
   narrow because it is a stub of a shelf, and the floor takes what is left */
.sek-row2 { display: grid; grid-template-columns: 226px minmax(0, 1fr); gap: var(--sim-space-2); margin-top: var(--sim-space-2); align-items: start; }
.sek-z3 { border-style: dashed; }
.sek-z3 .sek-slot { min-height: 48px; }
.sek-z3 .sek-lip { opacity: 0.4; }
/* the floor is as wide as the rest of the board: two cards to a row, so a name
   still gets its ~230px and the eight unsorted cards take four rows. Its depth
   is reserved for that same worst case too, so sorting cards onto the shelves
   cannot shrink the board and leave a bare band under the note. */
.sek-floor .sek-slot { min-height: 240px; grid-template-columns: repeat(2, minmax(0, 1fr)); }

/* the card: a name and a plain glyph, nothing else */
.sek-card { position: relative; display: flex; align-items: center; gap: 6px; min-width: 0; padding: 4px 7px; border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.12; text-align: left; cursor: grab; touch-action: none; transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease, border-color 200ms ease; }
.sek-card:hover { border-color: var(--sim-accent); }
.sek-icon { flex: none; width: 19px; height: 19px; color: var(--sim-accent); }
.sek-name { min-width: 0; overflow-wrap: break-word; }
/* A held card is under the pointer by definition, and the drop is found by
   asking what is under the pointer, so it must not be what is found. */
.sek-card.is-held { z-index: 6; pointer-events: none; cursor: grabbing; transform: scale(1.05); border-color: var(--sim-accent); box-shadow: 0 8px 18px -6px color-mix(in oklab, var(--sim-bg-deep) 80%, transparent); }
.sek-card.is-offered { border-color: var(--sim-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--sim-accent) 30%, transparent); }
.sek-card.is-refused { animation: sek-shake 420ms ease; }
@keyframes sek-shake { 0%, 100% { transform: translateX(0); } 22% { transform: translateX(-6px); } 58% { transform: translateX(5px); } 82% { transform: translateX(-2px); } }
.sek-card.is-placed { border-color: color-mix(in oklab, var(--sim-good) 62%, var(--sim-stroke)); }
/* the panel's own answer, printed on the card once it has been asked about */
.sek-stamp { margin-left: auto; min-width: 40px; padding: 1px 6px; border-radius: var(--sim-radius-pill); font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.05em; text-align: center; background: color-mix(in oklab, var(--sim-good) 24%, var(--sim-bg-deep)); color: var(--sim-label); }
/* The answer's column is reserved whether or not the answer has been given. A
   stamp that appeared and then vanished would steal 40px back from the card's
   name, reflow it onto another line and resize the whole board under the
   learner's hand - so an unanswered card keeps the space as an invisible gap.
   (visibility, not [hidden]: the kit hides [hidden] with !important.) */
.sek-stamp { visibility: hidden; }
.sek-stamp.is-answered { visibility: visible; }
.sek-stamp[data-ans="no"] { background: color-mix(in oklab, var(--sim-stroke) 40%, var(--sim-bg-deep)); }

/* the three moods a zone can be in: offered a card, took it, refused it */
.sek-zone.is-trying { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 12%, var(--sim-bg-surface)); }
.sek-zone.is-yes { animation: sek-take 620ms cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes sek-take { 0% { transform: scale(1); } 40% { transform: scale(1.035); } 100% { transform: scale(1); } }
.sek-zone.is-no { animation: sek-shake 420ms ease; border-color: color-mix(in oklab, var(--sim-stroke) 90%, var(--sim-accent)); }
.sek-empty { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 3px; border: 2px dashed color-mix(in oklab, var(--sim-stroke) 62%, transparent); border-radius: var(--sim-radius-sm); font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }

/* the foot: the test slot and the note share one row, so the board above can be
   as tall as its worst-case shelf without pushing the frame past its budget */
.sek-foot { display: flex; flex-direction: column; gap: var(--sim-space-2); margin-top: var(--sim-space-2); align-items: stretch; }
.sek-test { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px var(--sim-space-2); padding: var(--sim-space-2); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); }
.sek-q { grid-column: 1 / -1; font-size: var(--sim-text-sm); font-weight: 700; min-width: 0; overflow-wrap: anywhere; }
.sek-hold { font-size: var(--sim-text-sm); }
.sek-yesno { display: flex; gap: 6px; }
.sek-btn { padding: 5px 14px; border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-deep); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.05em; cursor: pointer; transition: border-color 180ms ease, background-color 180ms ease; }
.sek-btn:hover { border-color: var(--sim-accent); }
.sek-btn[aria-pressed="true"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 24%, var(--sim-bg-deep)); }
.sek-btn:disabled { opacity: 0.45; cursor: default; }

.sek-note { display: block; }
.sek-note .sl-note { position: static; display: block; padding: 0; background: none; animation: none; }
.sek-note .sl-note__card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--sim-space-3); width: 100%; margin-top: 0; padding: 22px var(--sim-space-3) 7px; border-width: 2px; gap: 5px; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 40%, var(--sim-bg-deep)); animation: none; }
.sek-note .sl-note__badge { font-size: var(--sim-text-sm); padding: 1px 8px; }
.sek-note .sl-note__row { grid-template-columns: 18px minmax(0, 1fr); column-gap: 6px; animation: none; }
.sek-note .sl-note__icon { width: 18px; height: 18px; }
.sek-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.25; }
.sek-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; line-height: 1.2; }

[data-step="0"] .sek-floor { animation: sek-hint 1.8s ease-in-out infinite; }
[data-step="1"] .sek-zones { animation: sek-hint 1.8s ease-in-out infinite; }
@keyframes sek-hint { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--sim-accent) 34%, transparent); } 50% { box-shadow: 0 0 0 4px transparent; } }

/* portrait: one column everywhere and no reserved depth, so the board is a
   single narrow column the phone can read top to bottom */
.sim-dom-root--portrait .sek-slot { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .sek-zones,
.sim-dom-root--portrait .sek-row2,
.sim-dom-root--portrait .sek-foot { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .sek-z1 .sek-slot,
.sim-dom-root--portrait .sek-z2 .sek-slot,
.sim-dom-root--portrait .sek-z3 .sek-slot,
.sim-dom-root--portrait .sek-floor .sek-slot { min-height: 0; }
.sim-dom-root--portrait .sek-foot { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .sek-note .sl-note__card { grid-template-columns: minmax(0, 1fr); }
`;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the board, every card where the slide leaves it
  [{ idx: 1, dwellMs: null }], // sorting, and the refusals that matter
  [{ idx: 2, dwellMs: null }], // the box card offered to each shelf in turn
  [{ idx: 3, dwellMs: null }], // the same board, still live, no quiz
];

const HOLD_MS = 900;      // how long a zone keeps its yes or no face
const YES_MS = 1400;      // how long a card keeps its yes stamp fresh
// Beat 2's offer chain, per shelf: the card is held up to it, the shelf refuses,
// the card is shown refusing, and the board moves on. Three shelves, 2.5s.
const OFFER_MS = [560, 460, 200];

function cardHtml(c) {
  return `<button class="sek-card" type="button" data-card="${c.id}" aria-label="${esc(c.label)}">${iconSvg(c.id)}<span class="sek-name">${esc(c.label)}</span><span class="sek-stamp" data-stamp="${c.id}" data-ans="${c.ans}">${c.ans}</span></button>`;
}

function zoneHtml(id, cls, tag, sub, cols) {
  return `<div class="sek-zone ${cls}" data-zone="${id}">
    <span class="sek-zhead"><span class="sim-tag sek-ztag">${esc(tag)}</span><span class="sek-zsub">${esc(sub)}</span></span>
    <div class="sek-slot" data-slot="${id}" data-cols="${cols}"></div>
    <span class="sek-lip"></span>
  </div>`;
}

export class StoredEnergyKindsScene extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = 838; // sim-layout: natural 826 on every beat, +padding
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1038; // sim-layout: natural 1025, tallest portrait beat, +padding
  static MIN_SCALE = 1.25; // three card columns and 14px text: full width below the text
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A board with two shelves labelled by deformation and by separation, a third shelf that is empty, and cards the learner moves between them; one card is refused by all three.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this._cards = new Map();
    this._timers = [];
    this._held = null;
    this._drag = null;
    this._swallowClick = false;
    // bound once, so add/removeEventListener pair up exactly
    this._onMove = (e) => this._move(e);
    this._onUp = (e) => this._up(e);
    this._onCancel = () => this._unbindDrag();

    const slot = (id) => this.root?.querySelector?.(`[data-slot="${id}"]`);
    this.render({
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="sim-card sl-backdrop" data-board>
        <div class="sek-zones">
          ${zoneHtml('s1', 'sek-z1', 'SHELF ONE', 'stored by deformation', 1)}
          ${zoneHtml('s2', 'sek-z2', 'SHELF TWO', 'stored by separation', 1)}
        </div>
        <div class="sek-row2">
          ${zoneHtml('s3', 'sek-z3', 'SHELF THREE', 'empty on purpose', 1)}
          ${zoneHtml('floor', 'sek-floor', 'ON THE FLOOR', 'not sorted yet', 2)}
        </div>
        <div class="sek-foot">
          <div class="sek-test" data-test>
            <span class="sek-q">Is there a position this thing would rather be in?</span>
            <span data-heldwrap hidden><span class="sek-hold"></span></span>
            <span class="sek-yesno">
              <button class="sek-btn" type="button" data-ans-btn="yes" disabled aria-pressed="false">yes</button>
              <button class="sek-btn" type="button" data-ans-btn="no" disabled aria-pressed="false">no</button>
            </span>
          </div>
          <div class="sek-note">${noteCardHtml(NOTE_ROWS, 'NOTE')}</div>
        </div>
      </div>`,
    });

    for (const c of CARDS) {
      const el = document.createElement('button');
      el.className = 'sek-card';
      el.type = 'button';
      el.dataset.card = c.id;
      el.setAttribute('aria-label', c.label);
      el.innerHTML = `${iconSvg(c.id)}<span class="sek-name">${esc(c.label)}</span><span class="sek-stamp" data-stamp="${c.id}" data-ans="${c.ans}">${c.ans}</span>`;
      this._cards.set(c.id, el);
      el.addEventListener('pointerdown', (e) => this._down(e, c.id));
      el.addEventListener('click', (e) => this._cardClick(e, c.id));
      this.root?.querySelector?.(`[data-slot="${c.zone}"]`)?.appendChild?.(el);
    }

    for (const z of ['s1', 's2', 's3', 'floor']) {
      this.root?.querySelector?.(`[data-zone="${z}"]`)?.addEventListener?.('click', (e) => {
        if (e.target?.closest?.('.sek-card')) return;
        if (this._held) this._drop(z);
      });
    }
    for (const b of this.root?.querySelectorAll?.('.sek-btn') || []) {
      b?.addEventListener?.('click', () => this._answer(b.dataset.ansBtn));
    }

    this._empty('s3');
    this._syncTest();
    this.onStep();
    this.root?.querySelector?.('[data-board]')?.setAttribute?.('data-built', '1');
  }

  // ---- beats -------------------------------------------------------------

  onStep() {
    this._stopTimers();
    this._clearMoods();
    const step = this.stepIndex ?? 0;
    if (step === 0) {
      // Beat 0 is the board exactly as the slide leaves it: two banked, the rest
      // on the floor, nothing locked, no stamps answered.
      for (const c of CARDS) this._put(c.id, c.zone);
      for (const c of CARDS) this._stamp(c.id, false);
    } else if (step === 2) {
      // Beat 2 is the dead end made visible: the box card is offered to each
      // shelf in turn and each of them refuses it, including the empty one.
      this._offer();
    }
    this._syncTest();
  }

  // The offer chain, credited to the stage that started it. Every step is
  // dropped by onStep's _stopTimers if the learner leaves the beat first.
  // The chain is a plain sequence of setTimeout steps owned by this beat: every
  // one of them is in this._timers, so leaving the beat cancels the rest of it
  // and the card can never be left in mid-air. The card is picked up once and
  // released at the end; only the shelf being offered to changes.
  _offer() {
    const seq = ['s1', 's2', 's3'];
    const card = this._cards.get('box');
    let at = 0;
    card?.classList?.add('is-offered');
    this._hold('box');
    for (const zone of seq) {
      this._timers.push(setTimeout(() => this._mood(zone, 'trying'), at));
      at += OFFER_MS[0];
      this._timers.push(setTimeout(() => {
        this._clearMoods();
        this._mood(zone, 'no');
        card?.classList?.add('is-refused');
      }, at));
      at += OFFER_MS[1];
      this._timers.push(setTimeout(() => card?.classList?.remove('is-refused'), at));
      at += OFFER_MS[2];
    }
    this._timers.push(setTimeout(() => {
      this._clearMoods();
      this._release();
      card?.classList?.remove('is-offered');
    }, at));
  }

  // ---- picking up and putting down ---------------------------------------

  _down(e, id) {
    if (e.button != null && e.button !== 0) return;
    const el = this._cards.get(id);
    if (!el) return;
    e.preventDefault?.();
    try { el.setPointerCapture?.(e.pointerId); } catch { /* no live pointer (a synthetic tap) */ }
    this._drag = { id, x: e.clientX, y: e.clientY, moved: false, pid: e.pointerId };
    // The move and the release are bound to the root, not the card: a pointer
    // drag leaves the card's own box almost at once, and a capture that never
    // took (a synthetic event, or a browser that refused it) would otherwise
    // drop the drag on the floor.
    this.root?.addEventListener?.('pointermove', this._onMove);
    this.root?.addEventListener?.('pointerup', this._onUp);
    this.root?.addEventListener?.('pointercancel', this._onCancel);
  }

  _unbindDrag() {
    this._drag = null;
    this.root?.removeEventListener?.('pointermove', this._onMove);
    this.root?.removeEventListener?.('pointerup', this._onUp);
    this.root?.removeEventListener?.('pointercancel', this._onCancel);
  }

  _move(e) {
    const d = this._drag;
    if (!d || (e.pointerId != null && d.pid !== e.pointerId)) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      this._hold(d.id);
    }
    d.ox = dx;
    d.oy = dy;
    const el = this._cards.get(d.id);
    if (el) el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
    this._highlight(this._zoneAt(e.clientX, e.clientY));
  }

  _up(e) {
    const d = this._drag;
    this._unbindDrag();
    if (!d || (e.pointerId != null && d.pid !== e.pointerId)) return;
    const el = this._cards.get(d.id);
    if (el) el.style.transform = '';
    if (!d.moved) return; // a tap: the card's own click handler picks it up
    this._swallowClick = true;
    const zone = this._zoneAt(e.clientX, e.clientY);
    this._highlight(null);
    if (zone) this._drop(zone);
    else this._release();
  }

  _cardClick(e, id) {
    if (this._swallowClick) {
      this._swallowClick = false;
      return;
    }
    e.stopPropagation();
    if (this._held === id) this._release();
    else this._hold(id);
  }

  _hold(id) {
    if (this._held === id) return;
    this._release();
    this._held = id;
    this._cards.get(id)?.classList?.add('is-held');
    this._syncTest();
  }

  _release() {
    if (!this._held) return;
    const el = this._cards.get(this._held);
    if (el) {
      el.classList.remove('is-held', 'is-offered');
      el.style.transform = '';
    }
    this._held = null;
    this._highlight(null);
    this._syncTest();
  }

  // The one classification rule. Accept: the card joins the shelf and the shelf
  // smiles. Refuse: the card goes back exactly where it came from and the shelf
  // says no. Nothing here is a guess, so the same drop always reads the same.
  _drop(zone) {
    const id = this._held;
    const card = BY_ID[id];
    const el = this._cards.get(id);
    this._release();
    if (!card || !el) return;
    if (takes(zone, card)) {
      this._put(id, zone);
      el.classList.add('is-placed');
      this._mood(zone, 'yes');
      burst?.(this.root?.querySelector?.(`[data-slot="${zone}"]`));
    } else {
      el.classList.add('is-refused');
      this._timers.push(setTimeout(() => el.classList.remove('is-refused'), HOLD_MS));
      this._mood(zone, 'no');
    }
    this._syncTest();
  }

  _put(id, zone) {
    const el = this._cards.get(id);
    const dest = this.root?.querySelector?.(`[data-slot="${zone}"]`);
    if (!el || !dest) return;
    dest.appendChild(el);
    el.classList.add('is-placed');
    this._empty(zone);
  }

  _empty(zone) {
    const dest = this.root?.querySelector?.(`[data-slot="${zone}"]`);
    if (!dest) return;
    const blank = dest.parentElement?.querySelector?.('[data-empty]');
    if (!dest.children.length) {
      if (blank) blank.hidden = false;
      else {
        const s = document.createElement('span');
        s.className = 'sek-empty';
        s.dataset.empty = '1';
        s.textContent = zone === 's3' ? 'nothing here' : 'empty';
        dest.appendChild(s);
      }
    } else if (blank) {
      blank.hidden = true;
    }
  }

  _zoneAt(x, y) {
    const hit = document.elementFromPoint(x, y)?.closest?.('[data-zone]');
    return hit?.dataset?.zone ?? null;
  }

  _highlight(zone) {
    for (const z of ['s1', 's2', 's3', 'floor']) {
      const el = this.root?.querySelector?.(`[data-zone="${z}"]`);
      el?.classList?.toggle('is-trying', z === zone);
    }
  }

  // The panel answers about the card the learner is holding, and marks the
  // card with its own answer. It is a lookup, not a quiz: no score, no total,
  // nothing to get wrong, and a wrong guess is simply overwritten.
  _answer(v) {
    const id = this._held;
    const card = BY_ID[id];
    if (!card) return;
    for (const b of this.root?.querySelectorAll?.('.sek-btn') || []) {
      b?.setAttribute?.('aria-pressed', String(b.dataset.ansBtn === v));
    }
    this._stamp(id, true);
    this._timers.push(setTimeout(() => {
      for (const b of this.root?.querySelectorAll?.('.sek-btn') || []) {
        b?.setAttribute?.('aria-pressed', 'false');
      }
    }, YES_MS));
  }

  _stamp(id, on) {
    const s = this.root?.querySelector?.(`[data-stamp="${id}"]`);
    s?.classList?.toggle('is-answered', !!on);
  }

  _clearMoods() {
    for (const z of ['s1', 's2', 's3', 'floor']) {
      this.root?.querySelector?.(`[data-zone="${z}"]`)?.classList?.remove('is-trying');
    }
  }

  // A zone's face: 'trying' while a card is being offered to it, then 'yes' or
  // 'no' for a moment. The two timed faces clear themselves, so the same drop
  // always looks the same whatever state the board was in.
  _mood(zone, kind) {
    for (const z of ['s1', 's2', 's3', 'floor']) {
      const el = this.root?.querySelector?.(`[data-zone="${z}"]`);
      if (!el) continue;
      if (z !== zone) continue;
      if (kind === 'trying') {
        el.classList.add('is-trying');
        return;
      }
      el.classList.add(kind === 'yes' ? 'is-yes' : 'is-no');
      this._timers.push(setTimeout(() => el.classList.remove(kind === 'yes' ? 'is-yes' : 'is-no'), HOLD_MS));
    }
  }

  _syncTest() {
    const wrap = this.root?.querySelector?.('[data-heldwrap]');
    const name = wrap?.querySelector?.('.sek-hold');
    const card = BY_ID[this._held];
    if (wrap) wrap.hidden = !card;
    if (name) name.textContent = card ? card.label : '';
    for (const b of this.root?.querySelectorAll?.('.sek-btn') || []) {
      b?.toggleAttribute?.('disabled', !card);
      if (!card) b?.setAttribute?.('aria-pressed', 'false');
    }
  }

  _stopTimers() {
    for (const id of this._timers) clearTimeout(id);
    this._timers = [];
  }

  destroy() {
    this._unbindDrag();
    this._stopTimers();
    this._cards = null;
    this._held = null;
    this._onMove = null;
    this._onUp = null;
    this._onCancel = null;
    super.destroy();
  }
}
