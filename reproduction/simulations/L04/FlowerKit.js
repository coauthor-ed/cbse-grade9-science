/**
 * FlowerKit - the shared drawings and vocabulary for the L04 flower bench.
 *
 * The L04 scenes all draw the same thing: a small schematic pea plant in side view carrying a
 * closed bud high up and one open flower below it, muslin bags that go over either, stamens that
 * can be taken out of an open flower, and a pod where the flower was. The drawings live here so
 * the bench is visibly the same bench in every scene, and so a later scene that adds a bag does
 * not draw a second, different bag.
 *
 * The kit is functions and data, never a base class. It paints nothing on its own: every scene
 * puts `FLOWER_KIT_CSS` into its own `render({ css })` and asks for the markup it needs.
 *
 * Two rules the shapes keep to, from the stub each scene was written against:
 *   - a slot shows the TREATMENT on it and nothing else. The outcome of a treatment is never drawn
 *     over the flower; it is a text row beside it, in the scene's own layout.
 *   - a bud is drawn closed whether or not its stamens were cut out, because the bag went over it
 *     closed. An open flower keeps its petals; cutting takes the stamens away and leaves a ring.
 */

/** The small plant's own coordinate box. Every scene scales this box, never hand-places a head. */
export const PLANT_VIEW = { w: 120, h: 176, stemX: 60, baseY: 172, budY: 40, flowerY: 112 };

/** What a treatment is called, everywhere in L04. */
export const TREATMENT = { BAG: 'bag', CUT: 'cut' };

/** The two kinds of slot on a plant. A bud is closed; a flower is open and can lose its stamens. */
export const SLOT_KIND = { BUD: 'bud', FLOWER: 'flower' };

/**
 * The two varieties, in the lesson's own words. `line` is what the scene prints on a card; `short`
 * is the same thing without the pronoun, for a place with no room. Nothing here is upgraded to a
 * named term: L05 introduces "self-pollination" and "cross-pollination" and this kit is not L05.
 */
export const VARIETY = {
  SELF: {
    id: 'self',
    line: "this plant's flowers use their own pollen",
    short: 'uses their own pollen',
  },
  OTHER: {
    id: 'other',
    line: "this plant's flowers need pollen from the other variety",
    short: 'need pollen from the other variety',
  },
};

/** The three words this bench's treatments are about, spelled once. */
export const FLOWER_PARTS = {
  ANTHER: 'anther',
  STIGMA: 'stigma',
  STYLE: 'style',
  POD: 'pod',
};

/** `plant 3 \u00b7 flower` - the name a slot is called in a ledger line and in a refusal. */
export function slotName(plantNumber, kind) {
  return `plant ${plantNumber} \u00b7 ${kind}`;
}

/**
 * An SVGElement has no `click()`, so a headless driver that presses scene controls cannot press a
 * head drawn inside an SVG. Give each pressable shape the same method a real button has, so
 * anything that presses it here presses the same handler a learner's tap would.
 */
export function bindSvgPress(el, fn) {
  if (!el) return el;
  el.addEventListener?.('click', fn);
  if (typeof el.click !== 'function') {
    el.click = () => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
  return el;
}

/* ------------------------------------------------------------------ the shapes */

const f1 = (n) => (Math.round(n * 10) / 10).toString();

/** A closed bud at (x, y): a folded teardrop with one line down it, and nothing inside. */
function budShape(x, y) {
  return `<g class="fk-budshape">
    <path class="fk-bud" d="M${x} ${y - 20} C${x + 13} ${y - 13}, ${x + 13} ${y + 8}, ${x} ${y + 16}
      C${x - 13} ${y + 8}, ${x - 13} ${y - 13}, ${x} ${y - 20} Z"/>
    <path class="fk-budline" d="M${x} ${y - 20} L${x} ${y + 16}"/>
    <path class="fk-budline" d="M${x - 11} ${y + 13} L${x} ${y + 2} L${x + 11} ${y + 13}"/>
  </g>`;
}

/**
 * An open flower at (x, y): five petals round a pale eye, the pistil standing up out of it, and
 * the ring of stamens round that. The flower is drawn the same whether or not the stamens are
 * still there - `data-cut` on the head hides the ring and shows the empty mark instead.
 */
function flowerShape(x, y) {
  const petals = [0, 72, 144, 216, 288]
    .map((a) => `<ellipse class="fk-petal" cx="${x}" cy="${y - 11}" rx="7.4" ry="12.4"`
      + ` transform="rotate(${a} ${x} ${y})"/>`).join('');
  return `<g class="fk-bloom">
    ${petals}
    <circle class="fk-eye" cx="${x}" cy="${y}" r="5.5"/>
    <line class="fk-style" x1="${x}" y1="${y}" x2="${x}" y2="${y - 13}"/>
    <circle class="fk-stigma" cx="${x}" cy="${y - 14}" r="2.8"/>
  </g>`;
}

/** The stamen ring: four filaments leaning out of the eye, an anther on the end of each. */
function stamenShape(x, y) {
  return `<g class="fk-stamens">
    ${[-11, -4, 4, 11].map((dx) => `<line class="fk-filament" x1="${x}" y1="${y - 1}" x2="${x + dx}" y2="${y - 12}"/>`).join('')}
    ${[-11, -4, 4, 11].map((dx) => `<ellipse class="fk-anther" cx="${x + dx}" cy="${y - 13}" rx="2.6" ry="3.4"/>`).join('')}
  </g>`;
}

/** What is left where the stamens were: an empty dashed ring, because something was taken away. */
function cutShape(x, y) {
  return `<g class="fk-cutmark">
    <ellipse class="fk-goner" cx="${x}" cy="${y - 7}" rx="13" ry="8"/>
    <line class="fk-goner" x1="${x - 13}" y1="${y - 7}" x2="${x + 13}" y2="${y - 7}"/>
  </g>`;
}

/**
 * A muslin bag over a head. Deliberately translucent with two fold lines and a tie: it reads as
 * cloth tied round something, not as a lid or a highlight, so it never looks like a verdict.
 */
function bagShape(x, y) {
  return `<g class="fk-bagwrap" data-bag="1">
    <path class="fk-bag" d="M${x - 21} ${y - 26} L${x + 21} ${y - 26}
      C${x + 26} ${y - 10}, ${x + 22} ${y + 8}, ${x + 15} ${y + 13}
      L${x - 15} ${y + 13}
      C${x - 22} ${y + 8}, ${x - 26} ${y - 10}, ${x - 21} ${y - 26} Z"/>
    <path class="fk-fold" d="M${x - 8} ${y - 20} L${x - 8} ${y + 7}"/>
    <path class="fk-fold" d="M${x + 8} ${y - 20} L${x + 8} ${y + 7}"/>
    <rect class="fk-tie" x="${x - 14}" y="${y + 8}" width="28" height="6" rx="3"/>
    <circle class="fk-knot" cx="${x + 16}" cy="${y + 11}" r="3.4"/>
  </g>`;
}

/** The pod, hanging from where the flower sat. One size: the panel shows a moment, not a wait. */
function podShape(x, y) {
  const px = x + 2;
  return `<g class="fk-podwrap" data-pod="1">
    <line class="fk-pedicel" x1="${x}" y1="${y + 2}" x2="${px}" y2="${y + 14}"/>
    <path class="fk-pod" d="M${px} ${y + 13} C${px + 12} ${y + 20}, ${px + 12} ${y + 33}, ${px} ${y + 39}
      C${px - 9} ${y + 33}, ${px - 9} ${y + 20}, ${px} ${y + 13} Z"/>
    <path class="fk-podfold" d="M${px - 5} ${y + 18} L${px - 5} ${y + 34}"/>
  </g>`;
}

/**
 * One slot - a bud or an open flower - as a `<g>` the caller positions.
 *
 * `o` = { x, y, id, kind, label }. `id` is what a tap and a `data-slot` attribute carry back to
 * the scene; `label` is the slot's aria-label. The group carries the treatment as data attributes
 * and the stylesheet does the rest, so a scene changes a treatment by setting one attribute and
 * never by rebuilding markup.
 */
export function headSvg(o) {
  const { x, y, id, kind, label } = o;
  const isBud = kind === SLOT_KIND.BUD;
  const hx = isBud ? x : x;
  return `<g class="fk-head" data-slot="${escAttr(id)}" data-kind="${kind}" data-bag="0" data-cut="0" data-pod="0" data-sel="0">
    ${isBud ? budShape(hx, y) : flowerShape(hx, y)}
    ${isBud ? '' : stamenShape(hx, y)}
    ${isBud ? '' : cutShape(hx, y)}
    ${bagShape(hx, y)}
    ${podShape(hx, y)}
    <rect class="fk-hit" data-slot="${escAttr(id)}" role="button" tabindex="0"
      aria-label="${escAttr(label)}" x="${f1(hx - 28)}" y="${f1(y - 32)}" width="56" height="64"/>
    <circle class="fk-selring" cx="${f1(hx)}" cy="${f1(y - 2)}" r="25"/>
  </g>`;
}

/** A leaf springing off the stem. `side` -1 puts it left, +1 right. */
function leafShape(x, y0, len, side) {
  const tip = x + side * len;
  return `<g class="fk-leaf">
    <path class="fk-leafshape" d="M${x} ${y0} C${x + side * len * 0.45} ${y0 - 20}, ${tip + side * -6} ${y0 - 15}, ${tip} ${y0 - 2}
      C${tip + side * -5} ${y0 + 9}, ${x + side * len * 0.3} ${y0 + 8}, ${x} ${y0} Z"/>
    <path class="fk-leafrib" d="M${x + side * 2} ${y0} L${tip + side * -3} ${y0 - 2}"/>
  </g>`;
}

/**
 * A whole small plant: stem, two leaves, a tendril, and the two slots a card needs - a bud high
 * up and an open flower below it. The bud sits above the flower because that is the order they
 * open in, so the card reads top to bottom in the order the plant happens.
 *
 * `o` = { number, variety, slots: [{ id, kind, label }] } - one entry per slot, in draw order.
 * Returns the `<svg>` element itself: the viewBox is the kit's own box, so a scene scales the
 * whole plant with CSS and never re-measures a head.
 */
export function plantSvg(o) {
  const { slots = [] } = o;
  const { w, h, stemX, baseY, budY, flowerY } = PLANT_VIEW;
  const placed = slots.map((s) => headSvg({
    x: stemX,
    y: s.kind === SLOT_KIND.BUD ? budY : flowerY,
    id: s.id,
    kind: s.kind,
    label: s.label,
  })).join('');
  return `<svg class="fk-plant" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" role="group"
    aria-label="One pea plant in side view, with a closed bud near the top and an open flower below it.">
    <path class="fk-stem" d="M${stemX} ${baseY} C${stemX - 6} ${baseY - 42}, ${stemX + 6} ${baseY - 92}, ${stemX} ${budY + 12}"/>
    ${leafShape(stemX, 80, 15, -1)}
    ${leafShape(stemX, 140, 22, -1)}
    ${leafShape(stemX, 160, 20, 1)}
    <path class="fk-tendril" d="M${stemX} ${baseY} C${stemX + 26} ${baseY - 2}, ${stemX + 40} ${baseY - 16}, ${stemX + 32} ${baseY - 28}
      C${stemX + 25} ${baseY - 38}, ${stemX + 38} ${baseY - 46}, ${stemX + 46} ${baseY - 36}"/>
    ${placed}
  </svg>`;
}

/** The muslin bag, as a small icon for a button. */
export function bagIconSvg() {
  return `<svg class="fk-icon" viewBox="0 0 32 32" aria-hidden="true">
    <path class="fk-bag" d="M11 9 L21 9 L24 27 L8 27 Z"/>
    <rect class="fk-bag" x="9" y="5" width="14" height="5" rx="2.5"/>
  </svg>`;
}

/** The scissors, as a small icon for a button. */
export function scissorsIconSvg() {
  return `<svg class="fk-icon" viewBox="0 0 32 32" aria-hidden="true">
    <path class="fk-sc" d="M8 26 L23 8 M8 8 L23 26"/>
    <circle class="fk-sc" cx="9" cy="27" r="3.4"/>
    <circle class="fk-sc" cx="9" cy="5" r="3.4"/>
  </svg>`;
}

/* ------------------------------------------------------------------ the styles */

/** Everything below is a colour token or a mix of one; there is no hex and no new `--sim-*` name. */
export const FLOWER_KIT_CSS = `
.fk-stem { fill: none; stroke: var(--sim-nutrient); stroke-width: 5; stroke-linecap: round; }
.fk-leafshape { fill: color-mix(in oklab, var(--sim-nutrient) 58%, var(--sim-bg-surface)); stroke: var(--sim-nutrient); stroke-width: 2; }
.fk-leafrib { fill: none; stroke: var(--sim-nutrient); stroke-width: 1.6; stroke-linecap: round; }
.fk-tendril { fill: none; stroke: var(--sim-nutrient); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.fk-pedicel { fill: none; stroke: var(--sim-nutrient); stroke-width: 3; stroke-linecap: round; }

.fk-bud { fill: color-mix(in oklab, var(--sim-nutrient) 55%, var(--sim-bg-surface)); stroke: var(--sim-nutrient); stroke-width: 2.5; }
.fk-budline { fill: none; stroke: var(--sim-nutrient); stroke-width: 2; stroke-linecap: round; }
.fk-petal { fill: var(--sim-series-5); stroke: color-mix(in oklab, var(--sim-series-5) 60%, var(--sim-bg-deep)); stroke-width: 1.5; }
.fk-eye { fill: color-mix(in oklab, var(--sim-series-5) 30%, var(--sim-bg-surface)); }
.fk-style { fill: none; stroke: var(--sim-series-7); stroke-width: 2.5; stroke-linecap: round; }
.fk-stigma { fill: var(--sim-series-4); }
.fk-filament { fill: none; stroke: var(--sim-warning); stroke-width: 1.8; stroke-linecap: round; }
.fk-anther { fill: var(--sim-series-2); }
.fk-goner { fill: none; stroke: var(--sim-label-muted); stroke-width: 2.5; stroke-dasharray: 5 4; }
.fk-bag { fill: color-mix(in oklab, var(--sim-bg-surface) 46%, transparent); stroke: var(--sim-label-muted); stroke-width: 2.5; }
.fk-fold { fill: none; stroke: var(--sim-label-muted); stroke-width: 1.2; stroke-linecap: round; opacity: 0.55; }
.fk-tie { fill: var(--sim-label-muted); }
.fk-knot { fill: var(--sim-label-muted); }
.fk-pod { fill: color-mix(in oklab, var(--sim-nutrient) 74%, var(--sim-bg-surface)); stroke: var(--sim-nutrient); stroke-width: 2.5; }
.fk-podfold { fill: none; stroke: color-mix(in oklab, var(--sim-nutrient) 70%, var(--sim-bg-deep)); stroke-width: 1.6; stroke-linecap: round; }

/* which treatment is on the slot, and what it did. data-cut is drawn on a bud as well, because a
   bud's stamens are the thing a treatment can be spent on. */
.fk-head[data-bag="0"] .fk-bagwrap,
.fk-head[data-pod="0"] .fk-podwrap { display: none; }
.fk-head[data-cut="1"] .fk-stamens { display: none; }
.fk-head[data-cut="0"] .fk-cutmark { display: none; }

.fk-selring { fill: none; stroke: var(--sim-accent); stroke-width: 2.5; stroke-dasharray: 6 5; opacity: 0; }
.fk-head[data-sel="1"] .fk-selring { opacity: 1; }
.fk-head[data-sel="1"] .fk-bloom,
.fk-head[data-sel="1"] .fk-budshape { opacity: 0.72; }

/* The only pressable thing on a plant is a slot's own box; the drawing of it takes no pointer
   events, so a tap can only ever mean the slot under it. */
.fk-hit { fill: none; pointer-events: all; cursor: pointer; }
.fk-head[data-sel="1"] .fk-hit { cursor: default; }
/* The ring is the only thing on the panel that says a head can be tapped, and it is the same ring
   in every state, so it never reads as a mark on the plant. */
.fk-head:not([data-sel="1"]) .fk-hit:hover ~ .fk-selring,
.fk-hit:focus-visible ~ .fk-selring { opacity: 0.5; }
.fk-hit:focus-visible { fill: color-mix(in oklab, var(--sim-accent) 12%, transparent); stroke: var(--sim-accent); stroke-width: 2; }
.fk-icon { width: 22px; height: 22px; flex: 0 0 auto; }
.fk-icon .fk-sc { fill: none; stroke: var(--sim-label-muted); stroke-width: 2.4; stroke-linecap: round; }
.fk-icon .fk-bag { fill: color-mix(in oklab, var(--sim-label-muted) 30%, transparent); stroke: var(--sim-label-muted); stroke-width: 2.2; stroke-linejoin: round; }

@media (prefers-reduced-motion: reduce) {
  .fk-bagwrap, .fk-podwrap, .fk-cutmark { transition-duration: 1ms !important; }
}
`;

/** Attribute-safe: a slot id and an aria-label both come from scene data and go into markup. */
function escAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/>/g, '&gt;');
}