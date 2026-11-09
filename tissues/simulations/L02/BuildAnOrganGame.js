import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * BuildAnOrganGame - mini-game for les-02, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson defines an organ as several DIFFERENT
 * tissues held together carrying out one activity none of them could manage
 * alone, and it spends two slides insisting that adding more of a tissue is
 * not the same as organising tissues. This game makes that definition the win
 * condition: an organ counts as working only when it holds at least one piece
 * of each of the three tissues.
 *
 * Twelve pieces, four organs, and nothing can be added - the only move is
 * where a piece goes. Piling all four muscle pieces into one slot builds a
 * bigger tissue and zero working organs, which is precisely the move slide
 * blk-l02-s4 says will not work.
 */

const W = 900;
const H = 600;

const KINDS = [
  { key: 'muscle', label: 'Muscle',     cls: 'k0' },
  { key: 'lining', label: 'Lining',     cls: 'k1' },
  { key: 'connect', label: 'Connective', cls: 'k2' },
];
const PER_KIND = 4;
const ORGANS = 4;
const TRAY = -1;

/** 12 pieces: 4 of each kind, in kind order. */
const PIECES = KINDS.flatMap((k, ki) => Array.from({ length: PER_KIND }, () => ki));

const CSS = `
.bog { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.bog .tray {
  position: absolute; left: 40px; top: 34px; right: 40px; min-height: 74px;
  border: 3px dashed var(--sim-border); border-radius: 16px;
  padding: 12px 14px; box-sizing: border-box;
  display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start;
}
.bog .traylabel {
  position: absolute; left: 46px; top: 12px; font-size: 12px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}

.bog .organs {
  position: absolute; left: 40px; right: 40px; top: 176px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
}
.bog .organ {
  border: 3px solid var(--sim-border); border-radius: 18px;
  background: var(--sim-bg-surface); padding: 12px; box-sizing: border-box;
  min-height: 168px; display: flex; flex-direction: column; gap: 8px;
}
.bog .organ.works { border-color: var(--sim-good); }
.bog .organ h4 {
  margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.bog .organ.works h4 { color: var(--sim-good); }
.bog .slot { display: flex; flex-wrap: wrap; gap: 7px; flex: 1; align-content: flex-start; }
.bog .verdict { font-size: 13px; font-weight: 700; }
.bog .organ.works .verdict { color: var(--sim-good); }
.bog .organ:not(.works) .verdict { color: var(--sim-label-muted); }

.bog .piece {
  width: 34px; height: 34px; border-radius: 9px; border: 2px solid var(--sim-bg-deep);
  cursor: pointer; padding: 0; font: inherit; font-size: 10px; font-weight: 800;
  color: var(--sim-bg-deep); display: flex; align-items: center; justify-content: center;
}
.bog .piece:focus-visible { outline: 3px solid var(--sim-gold); outline-offset: 2px; }
.bog .k0 { background: var(--sim-series-1); }
.bog .k1 { background: var(--sim-series-2); }
.bog .k2 { background: var(--sim-series-3); }

.bog .hintline {
  position: absolute; left: 40px; right: 300px; bottom: 26px;
  font-size: 14px; line-height: 1.5; color: var(--sim-label-muted); margin: 0;
}
.bog .hintline b { color: var(--sim-accent); }
`;

export class BuildAnOrganGame extends withChallenge(DomSimulation) {
  static simId = 'build-an-organ-game';
  static label = { en: 'Build an Organ' };
  static category = 'biology.tissues';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Twelve tissue pieces - four muscle, four lining, four connective - and four empty organs. '
    + 'Click a piece to move it to the next organ. An organ works when it holds at least one of each tissue.';

  static OBJECTIVE = {
    prompt: { en: 'Make all four organs work. You cannot add pieces - only decide where each one goes.' },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.02 };

  static CONTROLS = [
    { type: 'button', id: 'reset', label: 'Put everything back' },
  ];

  constructor(container, config) {
    super(container, config);
    this.assign = PIECES.map(() => TRAY);   // index -> organ index, or TRAY
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="bog">
        <p class="traylabel">Loose tissue pieces</p>
        <div class="tray"></div>
        <div class="organs">
          ${Array.from({ length: ORGANS }, (_, i) => `
            <div class="organ" data-organ="${i}">
              <h4>Organ ${i + 1}</h4>
              <div class="slot"></div>
              <span class="verdict">not working</span>
            </div>`).join('')}
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._tray = this.root.querySelector('.tray');
    this._organEls = Array.from(this.root.querySelectorAll('.organ'));
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 776, y: 552, height: 126, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Twelve pieces, and not one more. Where they sit is the whole game.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id) {
    if (id === 'reset') {
      this.assign = PIECES.map(() => TRAY);
      this._moved = true;
      this._render();
    }
  }

  /** Click cycles a piece tray -> organ 1 -> ... -> organ 4 -> tray. */
  _cycle(i) {
    this.assign[i] = this.assign[i] + 1 >= ORGANS ? TRAY : this.assign[i] + 1;
    this._moved = true;
    this._render();
  }

  /** @returns {{counts:number[][], works:boolean[], working:number}} */
  _state() {
    const counts = Array.from({ length: ORGANS }, () => KINDS.map(() => 0));
    this.assign.forEach((organ, i) => {
      if (organ !== TRAY) counts[organ][PIECES[i]] += 1;
    });
    const works = counts.map((c) => c.every((n) => n >= 1));
    return { counts, works, working: works.filter(Boolean).length };
  }

  _pieceHtml(i) {
    const kind = KINDS[PIECES[i]];
    return `<button type="button" class="piece ${kind.cls}" data-piece="${i}"
              title="${kind.label} - click to move">${kind.label[0]}</button>`;
  }

  _render() {
    const { counts, works } = this._state();

    this._tray.innerHTML = this.assign
      .map((organ, i) => (organ === TRAY ? this._pieceHtml(i) : ''))
      .join('');

    this._organEls.forEach((el, o) => {
      el.querySelector('.slot').innerHTML = this.assign
        .map((organ, i) => (organ === o ? this._pieceHtml(i) : ''))
        .join('');
      el.classList.toggle('works', works[o]);
      const missing = KINDS.filter((_, k) => counts[o][k] === 0).map((k) => k.label.toLowerCase());
      el.querySelector('.verdict').textContent = works[o]
        ? 'working organ'
        : missing.length === KINDS.length ? 'empty' : `no ${missing.join(', ')}`;
    });

    this.root.querySelectorAll('[data-piece]').forEach((b) => {
      b.addEventListener('click', () => this._cycle(Number(b.dataset.piece)));
    });

    const working = works.filter(Boolean).length;
    this._hint.innerHTML = `<b>${working} of ${ORGANS}</b> organs working. `
      + 'An organ works when it holds at least one muscle, one lining and one connective piece.';
  }

  checkObjective() {
    if (!this._moved) return null;
    const { counts, works, working } = this._state();

    if (working === ORGANS) {
      this.quill?.perform('hop');
      return { value: working, target: ORGANS };
    }
    this.quill?.setExpression('surprised');

    const hoarder = counts.findIndex((c) => c.some((n) => n >= 3) && !c.every((n) => n >= 1));
    const hint = hoarder >= 0
      ? `Organ ${hoarder + 1} is stacked with one tissue and missing the others. A bigger tissue is still one tissue.`
      : working === 0
        ? 'No organ has all three yet. An organ is not a pile of tissue; it is one of each, together.'
        : `${working} organs work. There are exactly four of each tissue and four organs - so how many of each does one organ get?`;
    return { ok: false, hint };
  }
}
