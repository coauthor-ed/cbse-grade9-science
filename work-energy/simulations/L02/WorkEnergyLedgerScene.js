import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS } from 'simulations/base/kit/SimLookDom.js';

const W = 620;

// The stub's dial ranges, exactly.
const F_MIN = 10;
const F_MAX = 200;
const F_STEP = 10;
const F_START = 50; // N

const D_MIN = 0.2;
const D_MAX = 5;
const D_STEP = 0.1;
const D_START = 1; // m

// The four rows, in the slide's order. `sign` is what the row's own arrow does
// to the object's motion, so it belongs to the row and not to a dial: 0 means
// the row never reads the dials at all, at any setting.
const ROWS = [
  { id: 'lift', name: 'Lift', sign: 1, dir: 'in', art: liftArt, alt: 'A bag on the floor with a solid arrow pushing it straight up.' },
  { id: 'throw', name: 'Throw', sign: 1, dir: 'in', art: throwArt, alt: 'A ball on the floor with a solid arrow pushing it along its path.' },
  { id: 'brake', name: 'Brake', sign: -1, dir: 'out', art: brakeArt, alt: 'A wheel turning to the right with a pad pushing back against it.' },
  { id: 'coast', name: 'Coast', sign: 0, dir: 'none', art: coastArt, alt: 'A ball resting on the floor with nothing touching it and no arrow at all.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // four rows, both headings one word short
  [{ idx: 1, dwellMs: null }], // all four rows written, headings complete
  [{ idx: 2, dwellMs: null }], // identical to beat 1, on purpose
];

// ---- the four sketches -------------------------------------------------
// One viewBox, one floor line, one ball radius, and the same amount of drawn
// matter in every row - a row drawn emptier than its neighbours reads as the
// lesser one, which is the one thing four equal ledger rows must not do. The
// sign is carried by the direction of the solid arrow and by nothing else; no
// sketch carries a caption.
const FIG_W = 64;
const FIG_H = 48;
const FLOOR_Y = 40;
const BALL_R = 7;

const ART_CSS = `
.wel-floor { fill: var(--sim-track); }
.wel-floorlip { stroke: var(--sim-track); stroke-width: 3; }
.wel-obj { fill: var(--sim-series-2); stroke: var(--sim-border); stroke-width: 2; }
.wel-obj-hi { fill: var(--sim-bg-surface); opacity: 0.45; }
.wel-pad { fill: var(--sim-series-5); stroke: var(--sim-border); stroke-width: 2; }
.wel-push { stroke: var(--sim-accent); stroke-width: 4; stroke-linecap: round; }
.wel-pushhead { fill: var(--sim-accent); }
.wel-turn { fill: none; stroke: var(--sim-label-muted); stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 5 6; }
/* the coast row's clear space: a dashed ring with a gap all round, so this row
   carries as much drawn matter as the other three while saying, in the picture
   itself, that nothing is reaching the ball. */
.wel-clear { fill: none; stroke: var(--sim-label-muted); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 4 6; opacity: 0.7; }
.wel-ahead { fill: var(--sim-series-2); opacity: 0.4; }
`;

function floor() {
  return `<rect class="wel-floor" x="0" y="${FLOOR_Y}" width="${FIG_W}" height="${FIG_H - FLOOR_Y}"/>`
    + `<line class="wel-floorlip" x1="0" y1="${FLOOR_Y}" x2="${FIG_W}" y2="${FLOOR_Y}"/>`;
}

function ball(cx, cy, cls = 'wel-obj') {
  return `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${BALL_R}"/>`;
}

// A solid arrow from (x1,y1) towards (x2,y2) with its head at the far end: the
// push. Its direction is the whole of the row's physics.
function push(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(a) * 9;
  const by = y2 - Math.sin(a) * 9;
  const wing = (t) => `${(x2 - Math.cos(a - t) * 9).toFixed(1)},${(y2 - Math.sin(a - t) * 9).toFixed(1)}`;
  return `<line class="wel-push" x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/>`
    + `<polygon class="wel-pushhead" points="${x2},${y2} ${wing(0.44)} ${wing(-0.44)}"/>`;
}

function fig(alt, body) {
  return `<svg class="wel-fig" viewBox="0 0 ${FIG_W} ${FIG_H}" role="img" aria-label="${alt}">${body}</svg>`;
}

// Lift: a bag on the floor, pushed straight up - the same way it is going.
function liftArt(alt) {
  return fig(alt, floor()
    + `<rect class="wel-obj" x="19" y="26" width="21" height="14" rx="3"/>`
    + `<rect class="wel-obj-hi" x="22" y="29" width="7" height="5" rx="2"/>`
    + push(48, 30, 48, 7));
}

// Throw: the same ball, pushed along the path it will take, with a faint mark
// at the far end of that path so the arrow points at something.
function throwArt(alt) {
  return fig(alt, floor()
    + ball(18, 33)
    + push(27, 30, 47, 15)
    + ball(55, 10, 'wel-ahead'));
}

// Brake: a wheel turning to the right, a pad pressing on it and pushing back the
// other way. The turn is drawn, so this row is a moving wheel with a push
// against its motion, not a still wheel with a minus sign beside it.
function brakeArt(alt) {
  return fig(alt, floor()
    + `<circle class="wel-obj" cx="40" cy="28" r="11"/>`
    + `<line class="wel-obj-hi" x1="40" y1="18" x2="40" y2="38"/>`
    + `<line class="wel-obj-hi" x1="30" y1="28" x2="50" y2="28"/>`
    + `<path class="wel-turn" d="M20 12 A15 15 0 0 1 24 3"/>`
    + `<rect class="wel-pad" x="55" y="21" width="7" height="14" rx="2"/>`
    + push(53, 28, 37, 28));
}

// Coast: the same ball, resting, with nothing touching it. There is no arrow in
// this row and the two cells read 0 J at every dial setting - that absence is
// the evidence, so nothing is captioned over it.
function coastArt(alt) {
  return fig(alt, floor()
    + `<ellipse class="wel-clear" cx="32" cy="26" rx="17" ry="15"/>`
    + ball(32, 33));
}

function fmtJ(j) {
  if (j === 0) return '0 J';
  return `${j > 0 ? '+' : '\u2212'}${Math.abs(j)} J`;
}

// The one and only place a figure is written. Both cells of a row come out of
// this one expression, so no code path exists on which the two columns could
// disagree - the equality is structural, never verified after the fact.
function entry(row, f, d) {
  return row.sign === 0 ? 0 : row.sign * Math.round(f * d);
}

const CSS = ART_CSS + `
.wel-ledger { display: grid; grid-template-columns: 60px 74px minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--sim-space-2); }
/* the headings are pinned to the two value columns, or auto-placement drops
   them into the sketch and name tracks and they wrap into a narrow strip */
.wel-h--in { grid-column: 3; }
.wel-h--out { grid-column: 4; }
.wel-h { display: flex; flex-direction: column; justify-content: center; min-height: 58px; padding: 0 var(--sim-space-1) var(--sim-space-1); border-bottom: 2px solid var(--sim-stroke); text-align: center; font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.06em; color: var(--sim-label-muted); text-transform: uppercase; }
/* block, not an inline span: a flex item at its max-content width would run
   out of its grid track instead of wrapping inside it. */
.wel-htext { display: block; width: 100%; min-width: 0; }
.wel-hline { display: block; }
/* the partial reveal: the heading is there, its last word is not, and the gap
   it leaves is a dashed unknown rather than a hole. */
.wel-blank { display: inline-block; min-width: 4.6em; border: 2px dashed var(--sim-stroke); border-radius: var(--sim-radius-sm); color: var(--sim-label-muted); text-align: center; }
.sim-dom-root[data-step="0"] .wel-blank { display: inline-block; }
.sim-dom-root:not([data-step="0"]) .wel-blank { display: none; }
.sim-dom-root[data-step="0"] .wel-full { display: none; }
.sim-dom-root:not([data-step="0"]) .wel-full { display: inline; }

.wel-lead { grid-column: 1 / 3; display: flex; align-items: center; gap: var(--sim-space-2); min-width: 0; padding: var(--sim-space-1) 6px var(--sim-space-1) 0; border: 0; border-bottom: 2px solid var(--sim-stroke); background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.wel-fig { flex: 0 0 auto; width: 60px; height: auto; display: block; }
.wel-name { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; }
.wel-nlabel { font-size: var(--sim-text-md); font-weight: 800; }
.wel-dir { padding: 1px 8px; border: 1px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); font-size: var(--sim-text-sm); color: var(--sim-label-muted); white-space: nowrap; opacity: 0; transition: opacity 240ms ease; }
.sim-dom-root:not([data-step="0"]) .wel-dir { opacity: 1; }

/* Both value columns are the same plate. An earlier pass shaded the right-hand
   column differently to mark it as the output; that made the selected row's
   right cell a different colour from the other three in the same column, which
   is the wrong thing for a card whose whole point is that the two columns are
   equal. The output is told by its position and its heading instead, which is
   what the stub asks for. The input column keeps one asymmetry of its own - the
   4px accent bar - because that is the column the dials write. */
.wel-cell { display: flex; align-items: center; justify-content: flex-end; padding: var(--sim-space-1) var(--sim-space-2); border-bottom: 2px solid var(--sim-stroke); border-left: 2px solid var(--sim-stroke); font-size: var(--sim-text-xl); font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
/* an unwritten cell shows the kit's dashed unknown, sized like a figure rather
   than like a headline - at cell height a large "?" reads as a result. */
.wel-cell[data-empty="1"] { justify-content: center; }
.wel-cell[data-empty="1"]::after { content: "?"; padding: 0 10px; border: 2px dashed var(--sim-stroke); border-radius: var(--sim-radius-sm); color: var(--sim-label-muted); font-size: var(--sim-text-md); font-weight: 700; line-height: 1.5; }
/* last row closes the account: no rule under it */
.wel-last { border-bottom-color: transparent !important; }
.wel-card > .wel-ledger > .wel-last:last-child { border-bottom: 0; }

/* the selected row: a surface tint across the row and a 4px accent bar on the
   input-side cell - the marker sits in the column the dials write, not in the
   output column, so the right-hand column never looks like a second set of
   controls. */
.wel-lead[data-sel="1"], .wel-cell[data-sel="1"] { background: var(--sim-bg-surface); }
.wel-cell--in[data-sel="1"] { border-left-color: var(--sim-accent); box-shadow: inset 4px 0 0 var(--sim-accent); }
.wel-lead:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: -3px; }

.wel-strip { display: flex; flex-direction: column; gap: var(--sim-space-2); margin-top: var(--sim-space-3); padding-top: var(--sim-space-3); border-top: 2px solid var(--sim-stroke); }
.wel-pick { display: flex; flex-wrap: wrap; gap: var(--sim-space-1); align-items: center; }
.wel-picklabel { font-size: var(--sim-text-sm); color: var(--sim-label-muted); margin-right: 2px; }
.wel-pickbtn { padding: 4px 12px; border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 700; cursor: pointer; transition: border-color 200ms ease, background-color 200ms ease, color 200ms ease; }
.wel-pickbtn[aria-pressed="true"] { border-color: var(--sim-accent); background: var(--sim-accent); color: var(--sim-bg-deep); }
.wel-dial { display: grid; grid-template-columns: 88px minmax(0, 1fr) 70px; gap: var(--sim-space-2); align-items: center; }
.wel-dial label { font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.wel-dial input[type="range"] { width: 100%; margin: 0; }
.wel-dialval { font-size: var(--sim-text-md); font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
.wel-status { display: flex; justify-content: flex-end; }
.wel-status span { padding: 2px 10px; border: 1px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.wel-backdrop { position: absolute; inset: 0; z-index: 0; border-radius: var(--sim-radius-lg); }
.wel-card { position: relative; z-index: 1; transition: box-shadow 260ms ease; }
.wel-cell.wel-pop { animation: wel-pop 620ms cubic-bezier(0.2, 0.9, 0.3, 1.3) both; }
@keyframes wel-pop { 0% { transform: scale(1); } 38% { transform: scale(1.16); } 100% { transform: scale(1); } }
.wel-card[data-matched="1"] { box-shadow: 0 var(--sim-lift) 0 var(--sim-good), 0 0 0 3px var(--sim-good); }

.sim-dom-root--portrait .wel-ledger { grid-template-columns: 50px 66px minmax(0, 1fr) minmax(0, 1fr); }
.sim-dom-root--portrait .wel-fig { width: 50px; }
.sim-dom-root--portrait .wel-h { letter-spacing: 0.02em; }
.sim-dom-root--portrait .wel-cell { font-size: var(--sim-text-lg); padding: var(--sim-space-1) 6px; }
.sim-dom-root--portrait .wel-dial { grid-template-columns: minmax(0, 1fr) 66px; }
.sim-dom-root--portrait .wel-dial label { grid-column: 1 / -1; margin-bottom: -4px; }
`;

export class WorkEnergyLedgerScene extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = 540; // sim-layout tallest landscape beat 518 + padding + 3px lift
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 576; // sim-layout tallest portrait beat 555 + padding
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A two-column ledger with four rows - lift, throw, brake and coast. Each row carries the same signed figure of work in the left column and the same figure again in the right column, and the coast row reads zero and zero whatever the dials are set to.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, html: this._html() });

    // Dial settings are shared by every row (the two dials act on whichever
    // row is selected); the figures each row carries are stored per row, so a
    // dial move writes one row and leaves the other three as they were.
    this._sel = ROWS[0].id;
    this._f = F_START;
    this._d = D_START;
    this._j = {}; // row id -> joules, or null while the row is still unwritten
    this._matched = false;
    // Beat 0 opens with the selected row already carrying a live pair, which is
    // what the stub asks for: one row to look at while the learner works out
    // what the two columns are.
    this._j[this._sel] = entry(this._selRow(), this._f, this._d);

    this._wire();
    this._paint();
  }

  // One grid: the two heading cells, then each ledger row's lead and its two
  // value cells, in DOM order. A row cannot drift out of alignment with its own
  // figures, because the grid places them, not hand-set coordinates.
  _html() {
    // Two fixed lines per heading - the reveal lands on line 2 for both columns,
    // so the partial state is one shape, not two.
    const head = (cls, line1, full) => `<div class="wel-h ${cls}"><span class="wel-htext">`
      + `<span class="wel-hline">${line1}</span>`
      + `<span class="wel-hline"><span class="wel-blank">?</span><span class="wel-full">${full}</span></span>`
      + '</span></div>';
    const rowHtml = (r, i) => {
      const sel = i === 0 ? '1' : '0';
      const cls = i === ROWS.length - 1 ? ' wel-last' : '';
      return `<button class="wel-lead${cls}" type="button" data-lead="${r.id}" data-sel="${sel}" aria-pressed="${i === 0}" aria-label="${r.name} row">`
        + r.art(r.alt)
        + `<span class="wel-name"><span class="wel-nlabel">${r.name}</span><span class="wel-dir">${r.dir}</span></span>`
        + '</button>'
        + `<div class="wel-cell wel-cell--in${cls}" data-cell="in" data-row="${r.id}" data-sel="${sel}"></div>`
        + `<div class="wel-cell${cls}" data-cell="out" data-row="${r.id}" data-sel="${sel}"></div>`;
    };
    // The backdrop sits behind the card rather than replacing the root paint, so
    // the ledger card reads as one object on a stage instead of filling the frame
    // edge to edge. Every panel inside still paints its own fill, so the card
    // chrome is kept.
    return `<div class="sl-backdrop wel-backdrop" aria-hidden="true"></div>
      <div class="wel-card sim-card" data-card>
      <h2 class="sim-title">One object, four rows</h2>
      <div class="wel-ledger" data-ledger>
        ${head('wel-h--in', 'Work done on', 'the object')}
        ${head('wel-h--out', 'Change in', 'its energy')}
        ${ROWS.map(rowHtml).join('')}
      </div>
      <div class="wel-strip">
        <div class="wel-pick">
          <span class="wel-picklabel">Row</span>
          ${ROWS.map((r, i) => `<button class="wel-pickbtn" type="button" data-pick="${r.id}" aria-pressed="${i === 0}">${r.name}</button>`).join('')}
        </div>
        <div class="wel-dial">
          <label for="wel-f">Force</label>
          <input id="wel-f" type="range" min="${F_MIN}" max="${F_MAX}" step="${F_STEP}" value="${F_START}">
          <span class="wel-dialval" data-val-f>${F_START} N</span>
        </div>
        <div class="wel-dial">
          <label for="wel-d">Distance</label>
          <input id="wel-d" type="range" min="${D_MIN}" max="${D_MAX}" step="${D_STEP}" value="${D_START}">
          <span class="wel-dialval" data-val-d>${D_START.toFixed(1)} m</span>
        </div>
        <div class="wel-status"><span data-count>1 of ${ROWS.length} rows written</span></div>
      </div>
    </div>`;
  }

  _wire() {
    // The sim-test harness DOM has no HTML parser, so a markup string never
    // becomes a node tree there and every lookup below is null. Each one is
    // optional-chained and the scene simply rests in that environment.
    this._card = this.root?.querySelector?.('[data-card]') ?? null;
    this._fInput = this.root?.querySelector?.('#wel-f') ?? null;
    this._dInput = this.root?.querySelector?.('#wel-d') ?? null;
    this._fVal = this.root?.querySelector?.('[data-val-f]') ?? null;
    this._dVal = this.root?.querySelector?.('[data-val-d]') ?? null;
    this._count = this.root?.querySelector?.('[data-count]') ?? null;

    this._fInput?.addEventListener('input', () => this._apply());
    this._dInput?.addEventListener('input', () => this._apply());
    for (const r of ROWS) {
      this.root?.querySelector?.(`[data-pick="${r.id}"]`)?.addEventListener('click', () => this._select(r.id));
      // The row is a target in its own right, so a phone can select it by
      // tapping the ledger instead of hunting for the strip.
      this.root?.querySelector?.(`[data-lead="${r.id}"]`)?.addEventListener('click', () => this._select(r.id));
      this.root?.querySelector?.(`[data-cell="in"][data-row="${r.id}"]`)?.addEventListener('click', () => this._select(r.id));
    }
  }

  onStep(step) {
    // Beat 1 is the beat on which the equality becomes checkable, so it fills
    // the rows the learner has not written - and only those. A row already
    // carrying figures keeps them, which is what makes the learner's own
    // entries the thing they are comparing against. Beat 2 changes nothing.
    if (step >= 1) {
      for (const r of ROWS) {
        if (this._j[r.id] == null) this._j[r.id] = entry(r, this._f, this._d);
      }
    }
    this._paint();
  }

  _selRow() {
    return ROWS.find((r) => r.id === this._sel) ?? ROWS[0];
  }

  _select(id) {
    if (this._sel === id) return;
    this._sel = id;
    this._selected();
    this._paint();
  }

  _apply() {
    const f = Number(this._fInput?.value);
    const d = Number(this._dInput?.value);
    if (Number.isFinite(f)) this._f = f;
    if (Number.isFinite(d)) this._d = d;
    const r = this._selected();
    // Only the selected row is written by a dial move. Coast is written too -
    // its entry is 0 J at every dial setting, and that row is the one that
    // makes the identity visible.
    this._j[r.id] = entry(r, this._f, this._d);
    this._paint();
  }

  // The row the dials write. Selecting a row that has never been written seeds
  // it, so the learner never faces a selected row whose cells are empty while
  // the dials are visibly live - that would read as a broken card.
  _selected() {
    const r = this._selRow();
    if (this._j[r.id] == null) this._j[r.id] = entry(r, this._f, this._d);
    return r;
  }

  _paint() {
    if (this._fVal) this._fVal.textContent = `${this._f} N`;
    if (this._dVal) this._dVal.textContent = `${this._d.toFixed(1)} m`;

    for (const r of ROWS) {
      const on = r.id === this._sel;
      const j = this._j[r.id];
      for (const side of ['in', 'out']) {
        // Both cells of a row are filled from the same stored figure, never
        // from two computations: the right column has no source of its own.
        const cell = this.root?.querySelector?.(`[data-cell="${side}"][data-row="${r.id}"]`) ?? null;
        if (!cell) continue;
        cell.textContent = j == null ? '' : fmtJ(j);
        cell.dataset.empty = j == null ? '1' : '0';
        cell.dataset.sel = on ? '1' : '0';
      }
      const lead = this.root?.querySelector?.(`[data-lead="${r.id}"]`) ?? null;
      if (lead) {
        lead.dataset.sel = on ? '1' : '0';
        lead.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      this.root?.querySelector?.(`[data-pick="${r.id}"]`)?.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    const written = ROWS.filter((r) => this._j[r.id] != null).length;
    if (this._count) this._count.textContent = `${written} of ${ROWS.length} rows written`;

    // Celebrate the finding, not a keypress: the moment every row carries a
    // pair, the two columns can be read against each other across four
    // different stories - that is the moment the identity is in front of the
    // learner, and it is not a dial move. Once per mount.
    if (!this._matched && written === ROWS.length) {
      this._matched = true;
      if (this._card) this._card.dataset.matched = '1';
      this._popAll();
    }
  }

  // A contained one-shot pop on the eight value cells, staggered down the
  // ledger. Deliberately not the look kit's `burst()`: confetti throws bits
  // 120-300px from the host, which runs off a 380px portrait frame, and the
  // stub also asks that nothing else on the card animate. This is a scale
  // pulse on the cells themselves, so it cannot leave the card.
  _popAll() {
    const cells = [...(this.root?.querySelectorAll?.('.wel-cell') ?? [])];
    cells.forEach((cell, i) => {
      cell.style.animationDelay = `${i * 45}ms`;
      cell.classList.add('wel-pop');
      cell.addEventListener('animationend', () => cell.classList.remove('wel-pop'), { once: true });
    });
  }

  destroy() {
    this._card = null;
    this._fInput = null;
    this._dInput = null;
    this._fVal = null;
    this._dVal = null;
    super.destroy();
  }
}
