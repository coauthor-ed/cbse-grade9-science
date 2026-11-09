import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { simPick } from 'simulations/base/kit/SimPick.js';

/**
 * MediumChainGame - the L02 mini-game. Reworked 2026-11-03: four kinds of block
 * only, one rule. A struck tuning fork on the left, one or two
 * listeners (an ear) on the right, and a rack of blocks - steel, water, air and
 * vacuum - the learner drags into the gaps between them. Strike the fork and the
 * sound walks the path: any material block carries it, a vacuum block (or an
 * empty gap) stops it. A round is won when every listener lights.
 *
 * Tie level L2: the win condition IS the rule the lesson teaches - sound needs
 * a medium and cannot travel through a vacuum. Every round has more material
 * blocks than gaps, so the learner can always win.
 */

const HOP_MS = 150;   // one link of the travelling pulse
const HOLD_MS = 520;  // pause at a listener, or at the link where the pulse died
const GAP_MS = 360;   // beat between one chain's run and the next

/* --------------------------------------------------------------- vocabulary */

// The four kinds the whole game uses. The three materials are peers; the vacuum
// block is an empty frame with nothing inside it.
const SEG = {
  steel: { label: 'steel' },
  water: { label: 'water' },
  air: { label: 'air' },
  vacuum: { label: 'vacuum' },
};

// One small shaded drawing per kind (light top, shaded bottom, an edge line), so a
// block is recognisable at a glance. Tokens only.
const LIT = 'var(--sim-bg-surface)', INK = 'var(--sim-label)';
const STEEL = 'color-mix(in oklab, var(--sim-label-muted) 62%, var(--sim-bg-surface))';
const ART = {
  steel: () => `<svg class="mcg-art" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="42" height="22" rx="4" fill="${STEEL}"/>
    <rect x="3" y="5" width="42" height="8" rx="4" fill="${LIT}" opacity="0.45"/>
    <rect x="3" y="20" width="42" height="7" rx="3.5" fill="${INK}" opacity="0.22"/>
    <path d="M9 10h22M13 15h26" stroke="${LIT}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
    <circle cx="9" cy="21" r="2" fill="${INK}" opacity="0.35"/><circle cx="39" cy="21" r="2" fill="${INK}" opacity="0.35"/>
    <rect x="3" y="5" width="42" height="22" rx="4" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.45"/></svg>`,
  water: () => `<svg class="mcg-art" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="42" height="22" rx="4" fill="var(--sim-glass)" opacity="0.5"/>
    <path d="M3 11q5.25 -3 10.5 0t10.5 0t10.5 0t10.5 0V23a4 4 0 0 1 -4 4H7a4 4 0 0 1 -4 -4z" fill="var(--sim-water)"/>
    <path d="M3 21h42V23a4 4 0 0 1 -4 4H7a4 4 0 0 1 -4 -4z" fill="${INK}" opacity="0.18"/>
    <path d="M6 12q4.5 -2.4 9 0" stroke="${LIT}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>
    <circle cx="16" cy="18" r="1.6" fill="${LIT}" opacity="0.7"/><circle cx="31" cy="15" r="1.2" fill="${LIT}" opacity="0.7"/>
    <rect x="3" y="5" width="42" height="22" rx="4" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.45"/></svg>`,
  air: () => `<svg class="mcg-art" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="42" height="22" rx="4" fill="var(--sim-glass)" opacity="0.55"/>
    <rect x="3" y="5" width="42" height="7" rx="4" fill="${LIT}" opacity="0.5"/>
    <g fill="var(--sim-series-1)"><circle cx="10" cy="11" r="2"/><circle cx="21" cy="16" r="2"/><circle cx="33" cy="10" r="2"/>
    <circle cx="40" cy="20" r="2"/><circle cx="13" cy="22" r="2"/><circle cx="28" cy="23" r="2"/></g>
    <rect x="3" y="5" width="42" height="22" rx="4" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.45"/></svg>`,
  vacuum: () => `<svg class="mcg-art" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="42" height="22" rx="4" fill="var(--sim-bg-deep)" opacity="0.5"/>
    <rect x="3" y="20" width="42" height="7" rx="3.5" fill="${INK}" opacity="0.12"/>
    <rect x="3" y="5" width="42" height="22" rx="4" fill="none" stroke="var(--sim-warning)" stroke-width="2.2" stroke-dasharray="5 4"/></svg>`,
};

// The source: a tuning fork just struck (two shaded prongs on a stem; the prongs
// shiver while the sound sets off).
const FORK_ART = `<svg class="mcg-art mcg-art--big" viewBox="0 0 52 64" aria-hidden="true" focusable="false">
  <ellipse cx="26" cy="60" rx="12" ry="2.5" fill="${INK}" opacity="0.18"/>
  <rect x="23" y="38" width="6" height="21" rx="3" fill="${STEEL}"/>
  <rect x="23" y="38" width="2.4" height="21" rx="1.2" fill="${LIT}" opacity="0.55"/>
  <g class="mcg-prong mcg-prong--l"><path d="M26 40c-9 0-11-5-11-12V5h5.5v23c0 4 2 6 5.5 6z" fill="${STEEL}"/>
    <path d="M15 5h2.2v23c0 3 .8 5 2.6 6.6C16.2 33.2 15 30.8 15 28z" fill="${LIT}" opacity="0.55"/></g>
  <g class="mcg-prong mcg-prong--r"><path d="M26 40c9 0 11-5 11-12V5h-5.5v23c0 4-2 6-5.5 6z" fill="${STEEL}"/>
    <path d="M37 5h-1.8v23c0 3-.8 5-2.6 6.6 3.4-1.4 4.4-3.8 4.4-6.6z" fill="${INK}" opacity="0.25"/></g>
  <path class="mcg-shiver" d="M9 9v12M43 9v12" stroke="var(--sim-label-muted)" stroke-width="2.4" stroke-linecap="round"/></svg>`;

// The listener: an outer ear from the side (helix, inner fold, lobe, canal),
// shaded; it glows when the sound arrives.
const EAR_ART = `<svg class="mcg-art mcg-art--big mcg-ear" viewBox="0 0 46 60" aria-hidden="true" focusable="false">
  <path d="M30 4C16 4 8 14 8 26c0 9 4 13 7 18 2.4 4 3 9 9 11 6 2 10-2 10-7 0-4-3-6-3-10 0-3 3-5 6-9 3-4 5-8 5-13C42 9 37 4 30 4z"
    fill="color-mix(in oklab, var(--sim-set-sand) 70%, var(--sim-series-8))"/>
  <path d="M34 36c0-3 3-5 6-9 3-4 4-8 4-13 0 9-4 13-7 17-2 3-3 5-3 8 0 4-1 7-4 9 2-3 4-7 4-12z" fill="${INK}" opacity="0.16"/>
  <path d="M30 10c-9 0-15 7-15 15 0 5 2 8 4 11" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity="0.38"/>
  <path d="M29 17c-5 0-8 4-8 8 0 3 2 5 4 6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  <ellipse cx="27" cy="29" rx="3.6" ry="4.4" fill="${INK}" opacity="0.5"/>
  <path d="M14 18c2-6 7-10 13-11" fill="none" stroke="${LIT}" stroke-width="2" stroke-linecap="round" opacity="0.6"/></svg>`;

/* ------------------------------------------------------------------- rounds */

// Rounds only add a listener or a longer path. Each round carries at least one
// more material block than it has gaps, so the learner can always win.
const ROUNDS = [
  {
    name: 'one listener',
    brief: 'Fill every gap with a material, then strike the fork.',
    chains: [3],
    rack: ['steel', 'water', 'air', 'air', 'vacuum'],
  },
  {
    name: 'two listeners',
    brief: 'Two listeners now. Each one needs its own path.',
    chains: [2, 3],
    rack: ['steel', 'water', 'air', 'steel', 'water', 'air', 'vacuum', 'vacuum'],
  },
  {
    name: 'a longer path',
    brief: 'The second path is one gap longer.',
    chains: [3, 4],
    rack: ['steel', 'water', 'air', 'steel', 'water', 'air', 'steel', 'air', 'vacuum', 'vacuum'],
  },
];

const key = (chain, slot) => `${chain}-${slot}`;

/* ---------------------------------------------------------------------- CSS */

const CSS = SIM_LOOK_DOM_CSS + `
.mcg-root { display: flex; flex-direction: column; gap: var(--sim-space-2); width: 100%; box-sizing: border-box; min-height: 100%; }
.mcg-head { display: flex; align-items: center; justify-content: space-between; gap: var(--sim-space-2); flex-wrap: wrap; }
.mcg-title { margin: 0; font: 800 var(--sim-text-lg)/1.2 var(--sim-font-display, var(--sim-font)); color: var(--sim-label); }
.mcg-brief { margin: 0; font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); line-height: 1.3; }

/* the board: source column, one track per chain, one listener per chain */
.mcg-board { flex: 1 1 auto; display: grid; grid-template-columns: 98px minmax(0, 1fr) 104px;
  gap: var(--sim-space-3) var(--sim-space-2); align-content: center; justify-items: center; }
.mcg-source { grid-column: 1; grid-row: 1 / span var(--rows, 1); align-self: center; }
.mcg-card { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; text-align: center; box-sizing: border-box; }
.mcg-card__lab { font: 800 var(--sim-text-sm)/1.25 var(--sim-font); color: var(--sim-label); }
.mcg-art { display: block; width: 100%; max-width: 42px; height: auto; }
.mcg-art--big, .mcg-socket .mcg-art--big { max-width: 60px; }

/* one chain: the route the tap travels is a line under the segments, with a
   nub at each end, so the pulse never covers a link's own label */
.mcg-track { position: relative; grid-column: 2; width: 100%; display: grid;
  grid-template-columns: 18px repeat(var(--n), minmax(0, 1fr)) 18px;
  grid-template-rows: auto 16px; align-items: center; row-gap: 4px; column-gap: 10px; }
.mcg-socket { grid-row: 1; }
.mcg-rail { position: relative; grid-column: 1 / -1; grid-row: 2; }
.mcg-rail::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 4px;
  margin-top: -2px; border-radius: 2px; background: var(--sim-track); }
.mcg-nub { position: absolute; top: 50%; width: 15px; height: 15px; margin-top: -7.5px;
  border-radius: 50%; background: var(--sim-stroke); box-shadow: 0 0 0 3px var(--sim-bg-deep); z-index: 1; }
.mcg-nub:first-child { left: 1px; }
.mcg-nub--ear { right: 1px; }
.mcg-listener { grid-column: 3; }
.mcg-listener.is-lit { border-color: var(--sim-good); box-shadow: 0 0 0 3px color-mix(in oklab, var(--sim-good) 26%, transparent); }
.mcg-listener .mcg-card__lab { color: var(--sim-label-muted); }
.mcg-listener.is-lit .mcg-card__lab { color: var(--sim-good); }
.mcg-ear { transition: filter 300ms ease-out; }
.mcg-listener.is-lit .mcg-ear { filter: drop-shadow(0 0 6px var(--sim-good)); animation: mcg-hear 640ms ease-out; }
@keyframes mcg-hear { 0% { transform: scale(1); } 40% { transform: scale(1.08); } 100% { transform: scale(1); } }
.mcg-shiver { opacity: 0; }
.mcg-prong { transform-box: fill-box; }
.mcg-prong--l { transform-origin: 100% 100%; }
.mcg-prong--r { transform-origin: 0% 100%; }
.mcg-source.is-live .mcg-shiver { animation: mcg-fade 900ms ease-out; }
.mcg-source.is-live .mcg-prong--l { animation: mcg-shake-l 110ms linear 6; }
.mcg-source.is-live .mcg-prong--r { animation: mcg-shake-r 110ms linear 6; }
@keyframes mcg-fade { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes mcg-shake-l { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3deg); } }
@keyframes mcg-shake-r { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(3deg); } }

/* a link in the chain. The height is fixed so the route line under the row never
   jumps when a run stamps a link - the stamp is pinned on the border instead. */
.mcg-socket { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px;
  height: 98px; padding: 4px 3px; box-sizing: border-box;
  border: 2px dashed color-mix(in oklab, var(--sim-stroke) 80%, transparent); border-radius: var(--sim-radius-md);
  background: color-mix(in oklab, var(--sim-bg-surface) 72%, transparent); }
.mcg-socket.is-full { border-style: solid; border-color: var(--sim-stroke); }
.mcg-socket.is-full::before, .mcg-socket.is-full::after { content: ''; position: absolute; top: 50%;
  width: 7px; height: 7px; margin-top: -3.5px; background: var(--sim-stroke); }
.mcg-socket.is-full::before { left: -7px; border-radius: 3.5px 0 0 3.5px; }
.mcg-socket.is-full::after { right: -7px; border-radius: 0 3.5px 3.5px 0; }
.mcg-socket__empty { align-self: center; margin: auto 0; font-size: var(--sim-text-sm); font-weight: 700;
  color: var(--sim-label-muted); }
/* the stamp sits on the link's own border, so nothing in the row moves */
.mcg-dead { display: none; position: absolute; left: 50%; bottom: -12px; transform: translateX(-50%);
  z-index: 2; border-color: var(--sim-bad); color: var(--sim-bad);
  background: var(--sim-bg-deep); white-space: nowrap; }
.mcg-socket[data-dead] .mcg-dead { display: inline-flex; }
.mcg-socket[data-dead] { border-color: var(--sim-bad); }
.mcg-socket[data-dead]::before, .mcg-socket[data-dead]::after { display: none; }

/* the pulse: one dot on the route line, carried by a CSS transition on its own
   left percentage (measured from the live layout, so portrait scales itself) */
.mcg-pulse { position: absolute; top: 50%; left: 0; z-index: 3; width: 14px; height: 14px;
  transform: translate(-50%, -50%); border-radius: 50%; background: var(--sim-accent); pointer-events: none;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--sim-accent) 26%, transparent);
  opacity: 0; transition: left ${HOP_MS}ms linear, opacity 130ms linear; }
.mcg-pulse.is-nofx { transition: none; }
.mcg-track.is-live .mcg-pulse { opacity: 1; }

/* the rack of links not yet used */
.mcg-rack { display: flex; flex-direction: column; gap: 4px; padding: var(--sim-space-2); }
.mcg-rack__head { display: flex; align-items: baseline; gap: var(--sim-space-2); flex-wrap: wrap; }
.mcg-rack__title { font: 800 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.mcg-rack__hint { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
.mcg-rack__row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.mcg-rack__group { display: flex; flex-wrap: wrap; gap: 6px; }
/* one flow of chips: the vacuum chips (dashed, each named on its face) follow the materials */
.mcg-rack__row > .mcg-rack__group, .mcg-vac { display: contents; }

/* a draggable link, in the rack or dropped into a chain */
.mcg-chip { display: flex; flex-direction: column; align-items: center; gap: 1px; width: 80px; min-height: 52px;
  padding: 3px 2px; box-sizing: border-box; cursor: grab;
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-sm);
  background: color-mix(in oklab, var(--sim-bg-surface) 92%, transparent);
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 60%, var(--sim-bg-deep)); }
.mcg-rack .mcg-art { max-width: 46px; }
.mcg-socket .mcg-art { max-width: 64px; }
.mcg-socket .mcg-chip { width: 100%; }
.mcg-chip__lab { font: 800 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label); text-align: center; }
.mcg-chip--vacuum { border-style: dashed; border-color: var(--sim-warning);
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-warning) 45%, var(--sim-bg-deep)); }
.mcg-chip:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.mcg-chip[aria-disabled="true"] { opacity: 0.55; cursor: default; }

.mcg-actions { display: flex; align-items: center; gap: var(--sim-space-2); flex-wrap: wrap; }
.mcg-btn { min-height: 44px; padding: 7px 18px; border: 2px solid var(--sim-accent); border-radius: var(--sim-radius-pill);
  background: var(--sim-accent); color: var(--sim-bg-deep); cursor: pointer;
  font: 800 var(--sim-text-md)/1 var(--sim-font); }
.mcg-btn--ghost { background: transparent; color: var(--sim-label); border-color: var(--sim-stroke); }
.mcg-btn:disabled { opacity: 0.45; cursor: default; }
.mcg-status { flex: 1 1 170px; font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); line-height: 1.3; }
.mcg-status.is-good { color: var(--sim-good); }

/* portrait (FC2 2026-11-03): the chain stays one row, fork | gaps | listener, so the route
   line joins the fork to the ear; the cards drop their words (the art says it) to give the
   gaps room; the rack chips shrink so a round's rack takes two rows at most */
.sim-dom-root--portrait .mcg-board { grid-template-columns: 44px minmax(0, 1fr) 44px; gap: 10px 3px; }
.sim-dom-root--portrait .mcg-card { padding: 4px 2px; }
.sim-dom-root--portrait .mcg-card .mcg-card__lab { display: none; }
.sim-dom-root--portrait .mcg-art--big { max-width: 38px; }
.sim-dom-root--portrait .mcg-track { grid-template-columns: 8px repeat(var(--n), minmax(0, 1fr)) 8px; column-gap: 4px; }
.sim-dom-root--portrait .mcg-socket { height: 88px; padding: 3px 1px; }
.sim-dom-root--portrait .mcg-socket .mcg-art { max-width: 40px; }
.sim-dom-root--portrait .mcg-rack__hint { display: none; }
.sim-dom-root--portrait .mcg-status { flex: 1 1 100%; }
/* portrait shows at about 0.84: 16 px text reads 13.4 px, 54 px targets 45 px; a word inside a
   gap is 15.5 px (13 px on screen), set tight so 'vacuum' fits a quarter of the track; an empty
   gap shows no word in portrait (its dashed outline says it) */
.sim-dom-root--portrait .mcg-brief, .sim-dom-root--portrait .mcg-chip__lab,
.sim-dom-root--portrait .mcg-socket__empty, .sim-dom-root--portrait .mcg-status,
.sim-dom-root--portrait .mcg-dead, .sim-dom-root--portrait .sim-tag { font-size: 16px; }
.sim-dom-root--portrait .mcg-socket .mcg-chip__lab, .sim-dom-root--portrait .mcg-dead { font-size: 15.5px; letter-spacing: -0.03em; }
.sim-dom-root--portrait .mcg-socket__empty { visibility: hidden; }
.sim-dom-root--portrait .mcg-btn { min-height: 54px; font-size: 18px; }
.sim-dom-root--portrait .mcg-rack .mcg-chip { width: 64px; min-height: 58px; }
.sim-dom-root--portrait .mcg-rack .mcg-art { max-width: 40px; }
`;

/* ---------------------------------------------------------------------- scene */

export class MediumChainGame extends withChallenge(DomSimulation) {
  // Each round is a different size (one listener, then two), so the frame is
// fitted to the round on show (FIT) and refit() is called whenever a new round
// mounts. HEIGHT is the initial hint only - a worst-case height here would make
// every round render smaller for nothing.
static WIDTH = 680;
static HEIGHT = 560;
static FIT = true;
static PORTRAIT_WIDTH = 380;   // shown about 320 px wide at 390 (scale 0.84): the portrait CSS sizes up text and targets
static PORTRAIT_HEIGHT = 620;
  static ARIA_LABEL =
    'A path-building game: a tuning fork on the left, a listener (an ear) on the right, empty gaps between them, and a rack of blocks - steel, water, air and vacuum - to drag into the gaps. Strike the fork and the sound travels through every material block and stops at a vacuum.';
  static OBJECTIVE = {
    prompt: {
      en: 'Fill every gap between the sound and the listener with a material, so the sound can reach them. A vacuum block stops the sound.',
    },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.02 };
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._roundIx = 0;
    this._chips = [];
    this._place = {};
    this._results = [];
    this._why = '';
    this._hasRun = false;
    this._won = false;
    this._run = null;
    this._pos = [];
    this._timers = [];
    this._pick = null;
    this._el = {};
  }

  async setup() {
    await super.setup();

    this.render({
      css: CSS,
      rootClass: 'mcg-root sl-backdrop',
      html: `
        <div class="mcg-head">
          <h2 class="mcg-title">Carry the sound to every listener</h2>
          <span class="sim-tag" data-round></span>
        </div>
        <p class="mcg-brief" data-brief></p>
        <div class="mcg-board" data-board></div>
        <div class="sim-card mcg-rack" data-rack data-bin="rack" aria-label="the rack of unused blocks">
          <div class="mcg-rack__head">
            <span class="mcg-rack__title">materials</span>
            <span class="mcg-rack__hint">drag one into a gap \u00b7 drag it out to remove it</span>
          </div>
          <div class="mcg-rack__row">
            <div class="mcg-rack__group" data-rack-mat></div>
            <div class="mcg-vac">
              <div class="mcg-rack__group" data-rack-vac></div>
            </div>
          </div>
        </div>
        <div class="mcg-actions">
          <button type="button" class="tap btn mcg-btn" data-act="send">Strike the fork</button>
          <button type="button" class="tap btn mcg-btn mcg-btn--ghost" data-act="next" hidden>Next round</button>
          <span class="mcg-status" data-status role="status"></span>
        </div>
      `,
    });

    this._el = {
      round: this.root?.querySelector?.('[data-round]'),
      brief: this.root?.querySelector?.('[data-brief]'),
      board: this.root?.querySelector?.('[data-board]'),
      rackMat: this.root?.querySelector?.('[data-rack-mat]'),
      rackVac: this.root?.querySelector?.('[data-rack-vac]'),
      status: this.root?.querySelector?.('[data-status]'),
      send: this.root?.querySelector?.('[data-act="send"]'),
      next: this.root?.querySelector?.('[data-act="next"]'),
    };

    // simPick's own aria-live region is a visually hidden node the text report reads
    // as an overlap with the title, and its stock wording names the link's old
    // contents, so the announcements are replaced by this scene's own one-liners
    // in the visible status line (which carries role="status").
    this._pick = simPick(this.root, {
      items: '[data-item]',
      targets: '[data-bin]',
      canDrop: () => !this._run,
      onDrop: (itemId, targetId) => this._drop(itemId, targetId),
      announce: () => {},
    });

    this.root?.addEventListener?.('click', (e) => {
      const act = e.target?.closest?.('[data-act]')?.dataset?.act;
      if (act === 'send') this._send();
      else if (act === 'next') this._nextRound();
    });

    this._mountRound(0);
  }

  /* ------------------------------------------------------------------ board */

  _round() {
    return ROUNDS[this._roundIx];
  }

  _chipById(id) {
    return this._chips.find((c) => c.id === id) || null;
  }

  _chipIn(chain, slot) {
    const id = this._place[key(chain, slot)];
    return id ? this._chipById(id) : null;
  }

  _mountRound(ix) {
    this._roundIx = ix;
    this._clearTimers();
    this._run = null;
    this._place = {};
    this._results = [];
    this._why = '';
    this._hasRun = false;
    this._won = false;
    this._flash = '';
    this._pos = [];
    const round = ROUNDS[ix];
    this._chips = round.rack.map((kind, i) => ({ id: `c${i}`, kind }));

    if (this._el.round) {
      this._el.round.textContent = `Round ${ix + 1} of ${ROUNDS.length} \u00b7 ${round.name}`;
    }
    if (this._el.brief) this._el.brief.textContent = round.brief;
    if (this._el.board) this._el.board.style.setProperty('--rows', String(round.chains.length));
    this._buildBoard();
    this._syncLinks();
    this._paintStatus();
    this.relayout(); // FIT: the round on show sets the frame height
  }

  _buildBoard() {
    const el = this._el.board;
    if (!el) return;
    const round = this._round();
    const rows = [];
    rows.push(
      `<div class="sim-card mcg-card mcg-source" data-source aria-label="the tuning fork">` +
        FORK_ART +
        `<span class="mcg-card__lab">tuning fork</span></div>`
    );
    round.chains.forEach((n, ci) => {
      const sockets = [];
      for (let k = 0; k < n; k += 1) sockets.push(this._socketHtml(ci, k, n));
      rows.push(
        `<div class="mcg-track" data-track="${ci}" style="--n: ${n}" aria-label="path ${ci + 1}">` +
          `<div class="mcg-rail">` +
          `<span class="mcg-nub"></span>` +
          `<span class="mcg-nub mcg-nub--ear"></span>` +
          `<span class="mcg-pulse" data-pulse="${ci}" aria-hidden="true"></span>` +
          '</div>' +
          sockets.join('') +
          '</div>'
      );
      rows.push(
        `<div class="sim-card mcg-card mcg-listener" data-ear="${ci}" aria-label="listener ${ci + 1}">` +
          EAR_ART +
          `<span class="mcg-card__lab" data-ear-lab="${ci}">listener</span></div>`
      );
    });
    el.innerHTML = rows.join('');
  }

  _socketHtml(ci, k, n) {
    const chip = this._chipIn(ci, k);
    const label = chip ? SEG[chip.kind].label : 'empty';
    return (
      // column k + 2: the track's first and last columns are the two nubs' ends
      `<div class="mcg-socket${chip ? ' is-full' : ''}" data-bin="${esc(key(ci, k))}" ` +
      `data-socket="${esc(key(ci, k))}" ` +
      `style="grid-column: ${k + 2}" aria-label="gap ${k + 1} of ${n} on path ${ci + 1}: ${esc(label)}">` +
      (chip ? this._chipHtml(chip, true) : '<span class="mcg-socket__empty">empty</span>') +
      `<span class="sim-tag mcg-dead">stopped here</span>` +
      '</div>'
    );
  }

  _chipHtml(chip, placed) {
    const seg = SEG[chip.kind];
    const art = ART[chip.kind]();
    return (
      `<div class="mcg-chip mcg-chip--${esc(chip.kind)}" data-item="${esc(chip.id)}" role="button" tabindex="0" ` +
      `aria-label="${esc(seg.label)}">${art}<span class="mcg-chip__lab">${esc(seg.label)}</span></div>`
    );
  }

  /** Repaint the links and the rack from the placement map (never mid-run). */
  _syncLinks() {
    const round = this._round();
    if (this._el.board) {
      round.chains.forEach((n, ci) => {
        for (let k = 0; k < n; k += 1) {
          const host = this.root?.querySelector?.(`[data-socket="${key(ci, k)}"]`);
          if (host) host.outerHTML = this._socketHtml(ci, k, n);
        }
      });
    }
    const loose = (kind) => this._chips.filter((c) => c.kind === kind && !this._placedAnywhere(c.id));
    const mat = loose('steel').concat(loose('water'), loose('air'));
    if (this._el.rackMat) this._el.rackMat.innerHTML = mat.map((c) => this._chipHtml(c, false)).join('');
    if (this._el.rackVac) this._el.rackVac.innerHTML = loose('vacuum').map((c) => this._chipHtml(c, false)).join('');
    if (this._run) this._pick?.cancel();
  }

  _placedAnywhere(id) {
    return Object.keys(this._place).some((k) => this._place[k] === id);
  }

  /**
   * One chip is one physical block: dropping it on a full link sends whatever
   * was there back to the rack, and dragging it to the rack removes it. Nothing
   * is ever rejected - a wrong guess is always undoable.
   */
  _drop(itemId, targetId) {
    if (this._run) return;
    const chip = this._chipById(itemId);
    if (!chip) return;
    const where = this.root?.querySelector?.(`[data-socket="${targetId}"]`);
    if (where) {
      this._place[targetId] = itemId;
    } else {
      for (const k of Object.keys(this._place)) if (this._place[k] === itemId) delete this._place[k];
    }
    this._hasRun = false;
    this._won = false;
    this._results = [];
    const seg = SEG[chip.kind].label;
    const at = where ? String(where.getAttribute('aria-label') || '').replace(/:.*$/, '') : 'the rack';
    this._flash = `${seg} is in ${at}.`;
    this._syncLinks();
    this._paintStatus();
  }

  /* -------------------------------------------------------------------- run */

  /** What the pulse will meet, link by link - read from the placement map. */
  _scan(ci, n) {
    const cells = [{ kind: 'start', dead: null }];
    for (let k = 0; k < n; k += 1) {
      const chip = this._chipIn(ci, k);
      let dead = null;
      if (!chip) dead = 'empty';
      else if (chip.kind === 'vacuum') dead = 'vacuum';
      // cells[] is the pulse's own path: index 0 is the source nub, 1..n the
      // links, n+1 the listener - so a cell's socket key is not its own index.
      cells.push({ kind: 'socket', at: key(ci, k), chip, dead });
    }
    cells.push({ kind: 'ear', dead: null });
    return { cells, pos: 0, result: 'waiting' };
  }

  /**
   * Where the dot sits at each step, as a percentage of its own rail: measured
   * from the live layout, so portrait and any host width scale themselves and a
   * resize is picked up on the next send.
   */
  _measure() {
    this._pos = this._round().chains.map((n, ci) => {
      const rail = this.root?.querySelector?.(`[data-track="${ci}"] .mcg-rail`);
      const track = this.root?.querySelector?.(`[data-track="${ci}"]`);
      const cells = track ? track.querySelectorAll('[data-socket], .mcg-nub') : [];
      const width = rail?.clientWidth || rail?.offsetWidth || 1;
      const railLeft = rail?.offsetLeft ?? 0;
      return Array.from(cells).map(
        (cell) => ((cell.offsetLeft + cell.offsetWidth / 2 - railLeft) / width) * 100
      );
    });
  }

  _movePulse(ci, idx, noFx) {
    const dot = this.root?.querySelector?.(`[data-pulse="${ci}"]`);
    const pct = this._pos?.[ci]?.[idx];
    if (!dot || pct === undefined) return;
    if (noFx) dot.classList.add('is-nofx');
    dot.style.left = `${pct}%`;
    if (noFx) {
      void dot.offsetWidth;
      dot.classList.remove('is-nofx');
    }
  }

  _setLiveChain(ci) {
    for (const track of this.root?.querySelectorAll?.('.mcg-track') || []) {
      track.classList.remove('is-live');
    }
    if (ci === null || ci === undefined) return;
    const track = this.root?.querySelector?.(`[data-track="${ci}"]`);
    if (track) track.classList.add('is-live');
  }

  _send() {
    if (this._run) return;
    this._clearTimers();
    this._measure();
    const chains = this._round().chains.map((n, ci) => this._scan(ci, n));
    this._results = chains.map(() => 'waiting');
    this._why = '';
    this._hasRun = true;
    this._won = false;
    this._flash = '';
    this._run = { i: 0, chains };

    for (const ear of this.root?.querySelectorAll?.('.mcg-listener') || []) ear.classList.remove('is-lit');
    for (const sock of this.root?.querySelectorAll?.('[data-dead]') || []) sock.removeAttribute('data-dead');
    const src = this.root?.querySelector?.('[data-source]');
    if (src) {
      src.classList.remove('is-live');
      void src.offsetWidth;
      src.classList.add('is-live');
    }

    this._movePulse(0, 0, true);
    this._setLiveChain(0);
    this._paintStatus();
    this._arm(HOP_MS, () => this._hop());
  }

  _hop() {
    const r = this._run;
    if (!r) return;
    const ch = r.chains[r.i];
    const next = ch.pos + 1;
    if (next >= ch.cells.length) return this._finishRun();
    ch.pos = next;
    this._movePulse(r.i, next);
    const cell = ch.cells[next];
    if (cell.dead) {
      ch.result = 'stopped';
      this._results[r.i] = 'stopped';
      if (!this._why) this._why = cell.dead;
      const sock = this.root?.querySelector?.(`[data-socket="${cell.at}"]`);
      if (sock) sock.dataset.dead = cell.dead;
      return this._arm(HOLD_MS, () => this._nextChain());
    }
    if (cell.kind === 'ear') {
      ch.result = 'arrived';
      this._results[r.i] = 'arrived';
      const ear = this.root?.querySelector?.(`[data-ear="${r.i}"]`);
      if (ear) {
        ear.classList.add('is-lit');
        const lab = ear.querySelector?.('[data-ear-lab]');
        if (lab) lab.textContent = 'heard it';
      }
      const final = this._results.every((x) => x === 'arrived');
      if (ear) burst(ear, final ? 30 : 16);
      return this._arm(HOLD_MS, () => this._nextChain());
    }
    this._arm(HOP_MS, () => this._hop());
  }

  _nextChain() {
    const r = this._run;
    if (!r) return;
    r.i += 1;
    if (r.i >= r.chains.length) return this._finishRun();
    this._setLiveChain(r.i);
    this._movePulse(r.i, 0, true);
    this._paintStatus();
    this._arm(GAP_MS, () => this._hop());
  }

  _finishRun() {
    const r = this._run;
    if (!r) return;
    this._setLiveChain(null);
    this._run = null;
    this._won = this._results.length > 0 && this._results.every((x) => x === 'arrived');
    this._paintStatus();
    if (this._won) {
      const last = r.chains.length - 1;
      const ear = this.root?.querySelector?.(`[data-ear="${last}"]`);
      if (ear) burst(ear, 34);
    }
    this.evaluate();
  }

  _nextRound() {
    if (!this._won || this._run) return;
    this._mountRound((this._roundIx + 1) % ROUNDS.length);
  }

  _arm(ms, fn) {
    const id = setTimeout(() => {
      this._timers = this._timers.filter((t) => t !== id);
      fn();
    }, ms);
    this._timers.push(id);
  }

  _clearTimers() {
    for (const id of this._timers) clearTimeout(id);
    this._timers = [];
  }

  /* -------------------------------------------------------------- objective */

  _deadChain() {
    return this._results.findIndex((x) => x !== 'arrived');
  }

  // solved latches on the first ok, so ok only when the LAST round is won; a won
  // earlier round is "not ready yet" (null), a stopped path is a miss with its reason.
  checkObjective() {
    if (this._run || !this._hasRun) return null;
    const dead = this._deadChain();
    if (dead < 0) return this._roundIx === ROUNDS.length - 1 ? { ok: true } : null;
    const why = this._whyText(dead);
    return { ok: false, reason: why, hint: why };
  }

  /* ------------------------------------------------------------------ paint */

  _statusText() {
    if (this._flash) return this._flash;
    if (this._run) return 'The sound is on its way.';
    if (this._won) {
      return this._roundIx < ROUNDS.length - 1
        ? 'Every listener heard it. The next round is ready.'
        : 'Every listener in all three rounds heard the sound.';
    }
    if (!this._hasRun) return '';   // the brief above says what to do
    const dead = this._deadChain();
    if (dead >= 0) return this._whyText(dead);
    return 'The sound is on its way.';
  }

  // One plain line: why the sound stopped on that path.
  _whyText(dead) {
    const on = this._round().chains.length > 1 ? ` on path ${dead + 1}` : '';
    return this._why === 'empty'
      ? `An empty gap${on} has nothing to carry the sound. Fill it with a material.`
      : `The vacuum${on} has nothing to carry the sound.`;
  }

  _paintStatus() {
    const el = this._el;
    if (!el.status) return;
    const running = !!this._run;
    if (el.send) el.send.disabled = running;
    if (el.next) {
      const show = this._won && !running;
      el.next.hidden = !show;
      if (show) el.next.textContent = this._roundIx < ROUNDS.length - 1 ? 'Next round' : 'Play again';
    }
    el.status.className = this._won ? 'mcg-status is-good' : 'mcg-status';
    el.status.textContent = this._statusText();
    for (const node of this.root?.querySelectorAll?.('[data-item]') || []) {
      node.setAttribute('aria-disabled', running ? 'true' : 'false');
    }
  }

  destroy() {
    this._clearTimers();
    this._pick?.destroy();
    this._pick = null;
    super.destroy();
  }
}