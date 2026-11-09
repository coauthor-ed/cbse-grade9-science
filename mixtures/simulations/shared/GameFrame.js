import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';
import { useLook } from 'simulations/base/kit/lookProfile.js';

/**
 * GameFrame - the layout every mini-game in this course shares.
 *
 * Why these sizes. On a 390 px phone mini-game@1 gives a scene 320 px, so the
 * phone design is 320 wide and renders at scale 1: a 48 px button is 48 CSS px
 * and 15 px text is 15 CSS px. It still holds up on a 360 px phone (scale 0.9).
 * The landscape design is wide and short because the host caps a scene by
 * height: at 1280x720 a 1100 x 405 frame comes out about 1165 x 430, and the
 * whole board plus the host's Check button then fits between the app bar and
 * the action bar.
 *
 * LAYOUT 'frame' keeps landscape fixed and measures the content in portrait, so
 * a board that grows under the learner's hands (chips in a bin, a why line) just
 * makes the page longer. mountGame watches the content and refits the frame.
 *
 * Check is the scene's own button (SELF_CHECKING plus requestCheck), not the host's:
 * the host's is 37 px tall and sits below the Quill row of the footer, while this
 * one is 50 px tall and directly under the last thing the learner touched. The
 * verdict still appears in the host's footer.
 *
 * Quill sits in the top right corner in both layouts, reacting beside the title
 * rather than on top of the cards. His speech bubble shows in landscape only:
 * on a phone the objective above and the sub line already say what to do.
 */

export const GAME_W = 1100;
export const GAME_H = 405;
export const PHONE_W = 320;
export const PHONE_H = 640;

/** H2O -> H<sub>2</sub>O, for HTML. */
export const formula = (f) => f.replace(/(\d+)/g, '<sub>$1</sub>');

/** Enter and Space act like a tap on an element that is not a real button. */
export function onTap(el, fn) {
  el.addEventListener('click', fn);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
  });
}

export const GAME_CSS = `
.gm { box-sizing: border-box; height: 100%; display: flex; flex-direction: column; gap: 10px;
      padding: 14px 18px; font-family: var(--sim-font); color: var(--sim-label); }
.gm * { box-sizing: border-box; }
.gm-head { max-width: 700px; }
.gm .kicker { font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
              color: var(--sim-label-muted); margin: 0 0 2px; }
.gm h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; line-height: 1.2; margin: 0 0 2px; }
.gm h2 b { color: var(--sim-accent); }
.gm .sub { font-size: 15px; line-height: 1.35; color: var(--sim-label-muted); margin: 0; }
.gm sub, .gm sup { font-size: 0.72em; line-height: 0; }
.gm .tap { min-height: 48px; cursor: pointer; user-select: none; touch-action: manipulation;
           -webkit-tap-highlight-color: transparent; font-family: inherit; color: var(--sim-label);
           box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke);
           transition: border-color 140ms, background 140ms, transform 80ms; }
.gm .tap:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--sim-stroke); }
.gm .tap:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
@media (hover: hover) { .gm .tap:hover { border-color: var(--sim-accent); } }
.gm .btn { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 12px;
           font-size: 15px; font-weight: 700; padding: 6px 12px; }
.gm .num { width: 60px; height: 48px; border-radius: 10px; background: var(--sim-bg-deep); color: var(--sim-label);
           border: var(--sim-border); font: 700 18px/1 var(--sim-font); text-align: center; padding: 0 4px;
           font-variant-numeric: tabular-nums; -moz-appearance: textfield; appearance: textfield; box-shadow: none; }
.gm .num:active { transform: none; box-shadow: none; }
.gm .num::-webkit-outer-spin-button, .gm .num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.gm .num:focus { outline: 3px solid var(--sim-accent); outline-offset: 1px; }
.gm svg text { font-family: var(--sim-font); }

/* Check lives in the scene, right under the board. Landscape: the bottom right corner, which no board uses. */
.gm { position: relative; }
.gm .gm-check { position: absolute; right: 18px; bottom: 12px; width: 190px; min-height: 48px; border: 0; border-radius: 12px;
                background: var(--sim-accent); color: var(--sim-bg-deep); font-size: 16px; font-weight: 800;
                box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.gm .gm-check:active { box-shadow: none; }
.sim-dom-root--portrait .gm .gm-check { position: static; width: 100%; min-height: 50px; }

/* Quill: top right, never over the board. The bubble opens to his left, level with the title. */
.q-mascot .q-bubble { top: 4px; bottom: auto; right: 100%; left: auto; margin-right: 6px;
                      width: max-content; max-width: 300px; font-size: 15px; }

.sim-dom-root--portrait .gm { height: auto; padding: 4px 4px 8px; gap: 10px; }
.sim-dom-root--portrait .gm .kicker { display: none; }
.sim-dom-root--portrait .gm-head { max-width: none; }
.sim-dom-root--portrait .gm h2 { font-size: 21px; padding-right: 46px; }
.sim-dom-root--portrait .q-mascot { left: auto !important; right: 0; top: 0 !important;
                                    width: 40px !important; height: 50px !important; }
.sim-dom-root--portrait .q-bubble { display: none; }
`;

/** Writes the board, adds Quill, and refits the frame whenever the content's height changes. */
export function mountGame(scene, { html, css = '', onResize = null }) {
  // mini-game@1 binds the host's whole style attribute to --mg-sim-aspect. A scene whose
  // aspect is not 1.5 changes that value, Lit rewrites the attribute, and the look's
  // --look-* properties (set on the host by DomSimulation.setup) are lost, which empties
  // --sim-border and --sim-lift. The scale wrap is ours, so the look goes there as well.
  useLook(scene._scaleWrap);
  scene.render({ html, css: SimMascotDom.styles() + GAME_CSS + css, ui: false });
  scene.quill = SimMascotDom.mount(scene.root, { x: GAME_W - 46, y: 78, height: 68, flip: true, bubbleSide: 'left' });
  const content = scene.root.firstElementChild;
  // static SELF_CHECKING hides the host's button; this one runs the same requestCheck() pipeline.
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'tap gm-check';
  check.textContent = 'Check my answer';
  check.addEventListener('click', () => {
    scene.requestCheck?.();
    if (scene.solved) check.textContent = 'Check again';
    // The verdict appears in the host's footer, just below this button: bring it out from
    // behind the app's action bar, or a tap near the bottom of the screen seems to do nothing.
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    check.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
  });
  content?.appendChild(check);
  if (typeof ResizeObserver === 'function' && content) {
    scene._contentWatch = new ResizeObserver(() => { scene.relayout(); onResize?.(); });
    scene._contentWatch.observe(content);
  }
}

export function unmountGame(scene) {
  scene._contentWatch?.disconnect();
  scene._contentWatch = null;
  scene.quill?.destroy();
  scene.quill = null;
}

/** Base for a game that is plain DOM: sets the sizes, the layout and the host's static fields once. */
export class GameBoard extends withChallenge(DomSimulation) {
  static WIDTH = GAME_W;
  static HEIGHT = GAME_H;
  static PORTRAIT_WIDTH = PHONE_W;
  static PORTRAIT_HEIGHT = PHONE_H;
  static LAYOUT = 'frame';
  static SELF_CHECKING = true;
  static SCORING = { mode: 'accuracy' };
  static CONTROLS = [];

  destroy() {
    unmountGame(this);
    super.destroy();
  }
}

const SORT_CSS = `
.sb .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 410px;
             gap: 14px; align-items: start; }
.sb .tray { display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 10px; }
.sb .card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 6px;
            text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.sb .card[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px;
                                 background: color-mix(in oklab, var(--sim-accent) 14%, var(--sim-bg-surface)); }
.sb .card[data-placed="1"] { opacity: 0.55; border-style: dashed; }
.sb .big { font-family: var(--sim-font-display); font-size: 22px; font-weight: 700; color: var(--sim-accent); line-height: 1.15; }
.sb .small { font-size: 14px; color: var(--sim-label-muted); line-height: 1.2; }
.sb .bins { display: flex; flex-direction: column; gap: 8px; max-height: calc(100% - 58px); overflow-y: auto; }
.sb .bin { background: var(--sim-bg-surface); border: var(--sim-border-width) dashed var(--sim-stroke); border-radius: 14px;
           padding: 8px 12px; min-height: 62px; box-shadow: none; }
.sb .bin:active { transform: none; box-shadow: none; }
.sb .bin[data-armed="1"] { border-color: var(--sim-accent); }
.sb .bin[data-good="1"] { border-color: var(--sim-good); border-style: solid; }
.sb .bin[data-bad="1"] { border-color: var(--sim-bad); border-style: solid; }
.sb .bin-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.sb .lbl { font-weight: 800; font-size: 15px; line-height: 1.25; }
.sb .count { color: var(--sim-label-muted); font-size: 14px; white-space: nowrap; }
.sb .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
.sb .chips:empty { display: none; }
.sb .chip { pointer-events: none; background: var(--sim-bg-deep); border: 1.5px solid var(--sim-stroke);
            border-radius: 6px; padding: 0 7px; font-size: 14px; font-weight: 700; }

.sim-dom-root--portrait .sb .board { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .sb .tray { width: 100%; grid-template-columns: repeat(var(--cols-p, 3), minmax(0, 1fr)); gap: 6px; }
.sim-dom-root--portrait .sb .bins { width: 100%; max-height: none; overflow: visible; }
`;

/**
 * SortBoard - tap a card, tap a bin. Four games here are this one board with
 * different data, so the behaviour is written once.
 *
 *   static KEY    the class for the game's own CSS
 *   static HEAD   { kicker, title, sub } (title is HTML)
 *   static CARDS  [{ id, html, chip, aria, answer }] (answer = a bin id)
 *   static BINS   [{ id, label }]
 *   static LINE   Quill's first line
 *   static CSS    the game's own CSS
 *   wrongHint(card) -> the hint for the first misplaced card
 *
 * Chips in a bin are labels, not controls: a card stays in the tray and tapping
 * it there takes it back, so nothing in a bin has to be a tap target.
 */
export class SortBoard extends GameBoard {
  static KEY = '';
  static HEAD = { kicker: '', title: '', sub: '' };
  static CARDS = [];
  static BINS = [];
  static LINE = '';
  static CSS = '';

  constructor(container, config) {
    super(container, config);
    this.placements = {};
    this._active = null;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    const C = this.constructor;
    mountGame(this, {
      css: SORT_CSS + C.CSS,
      html: `
        <div class="gm sb ${C.KEY}">
          <div class="gm-head">
            <p class="kicker">${C.HEAD.kicker}</p>
            <h2>${C.HEAD.title}</h2>
            <p class="sub">${C.HEAD.sub}</p>
          </div>
          <div class="board">
            <div class="tray">
              ${C.CARDS.map((c) => `<div class="card tap" data-id="${c.id}" role="button" tabindex="0" aria-pressed="false" aria-label="${c.aria}">${c.html}</div>`).join('')}
            </div>
            <div class="bins">
              ${C.BINS.map((b) => `
                <div class="bin tap" data-bin="${b.id}" role="button" tabindex="0">
                  <div class="bin-top"><span class="lbl">${b.label}</span><span class="count">0</span></div>
                  <div class="chips"></div>
                </div>`).join('')}
            </div>
          </div>
        </div>`,
    });
    this.root.querySelectorAll('.card').forEach((el) => onTap(el, () => this._tapCard(el.dataset.id)));
    this.root.querySelectorAll('.bin').forEach((el) => onTap(el, () => this._tapBin(el.dataset.bin)));
    this._render();
    this.quill.speak(C.LINE, 5200);
  }

  _tapCard(id) {
    delete this.placements[id];     // a placed card comes back and is picked up again
    this._active = id;
    this._moved = true;
    this._render();
  }

  _tapBin(bin) {
    if (this._active === null) return;
    this.placements[this._active] = bin;
    this._active = null;
    this._render();
  }

  _render() {
    const C = this.constructor;
    this.root.querySelectorAll('.card').forEach((el) => {
      const id = el.dataset.id;
      el.dataset.placed = this.placements[id] ? '1' : '0';
      el.setAttribute('aria-pressed', id === this._active ? 'true' : 'false');
    });
    const allPlaced = Object.keys(this.placements).length === C.CARDS.length;
    for (const b of C.BINS) {
      const el = this.root.querySelector(`.bin[data-bin="${b.id}"]`);
      const held = C.CARDS.filter((c) => this.placements[c.id] === b.id);
      el.querySelector('.count').textContent = String(held.length);
      el.querySelector('.chips').innerHTML = held.map((c) => `<span class="chip">${c.chip}</span>`).join('');
      el.setAttribute('aria-label', `${b.label}: ${held.length} placed`);
      el.dataset.armed = this._active !== null ? '1' : '0';
      const wrong = held.some((c) => c.answer !== b.id);
      el.dataset.good = allPlaced && !wrong ? '1' : '0';
      el.dataset.bad = allPlaced && wrong ? '1' : '0';
    }
  }

  wrongHint(card) { return `Check ${card.chip} again.`; }

  checkObjective() {
    const C = this.constructor;
    if (!this._moved) return null;
    if (Object.keys(this.placements).length < C.CARDS.length) return null;
    const wrong = C.CARDS.filter((c) => this.placements[c.id] !== c.answer);
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    return { ok: false, hint: this.wrongHint(wrong[0], wrong) };
  }
}
