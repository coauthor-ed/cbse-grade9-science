// TooHeavyBagScene.js
//
// L06 s10 (3 beats) and L07 s01 (2 beats): the chapter's bag, still on the
// floor, with the two numbers that decide whether it ever leaves.
//
// The whole scene is one argument made by drawing nothing: turn the mass dial
// and the force and the power both climb, and the bag does not move by a
// millimetre at any setting. So the bag is drawn from the same path at 5 kg and
// at 200 t - no growth, no rise, no shadow change, and the same flat face - and
// the only thing that changes is the two numbers. The power figure's font size
// steps up with its own value, so the irrelevant reading is the loudest thing
// on the panel.
//
// The two mounts share nothing but the drawing. The scene learns only the beat
// count, so `_mount` is read off the map the count selected: the still mount
// (L06) has no ramp, no run control and no route cards, because the L06 learner
// must not see a machine before L07 teaches one; the routes mount (L07) opens
// on its own heavier default and can send the bag up both routes.

import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml } from 'simulations/base/kit/SimLookDom.js';

// g = 10 N per kg, the value every lesson in this bundle uses, so the numbers
// here are the numbers the prose can be checked against.
const G = 10;
// The job. Fixed for every dial setting, and the only job in the scene: the
// bag goes up one metre, and the panel assumes it takes five seconds. Both
// readings below are computed from these two figures and nothing else, which
// is what makes them true readings rather than decoration.
const H_M = 1;
const T_S = 5;
// The ramp's length along its own slope. L07 s01 offers the ramp as a second
// route; its length is what trades against the force, so the two routes post
// the same work by construction and not by a rounded coincidence.
const RAMP_M = 4;

// The dial: 22 steps from something a child could carry to a locomotive, each
// step about 1.5-1.7x the last, so the value climbs by a growing factor and
// stops nowhere a learner would want it to.
const MASSES = [
  5, 8, 12, 20, 30, 50, 80, 120, 200, 300, 500, 800,
  1200, 2000, 3000, 5000, 8000, 12000, 20000, 50000, 100000, 200000,
];
// One default per still beat: a carryable sack, a mass past any person, and a
// mass whose power figure is enormous. The three beats the prose names.
const STILL_START = [3, 13, 21]; // 20 kg, 2 t, 200 t
// The routes mount opens on a mass no one person can lift, which is what
// blk-l07-s01 claims ("still too heavy") and what makes the ramp's trade
// legible: 2 kN for one metre against 500 N for four.
const ROUTES_START = 8; // 200 kg

// The force that actually governs the lift, and the rate at which the same
// lift would be done. Both are pure functions of the dial, both true at every
// setting, and neither of them touches the bag.
const forceOf = (kg) => kg * G;
const powerOf = (kg) => (forceOf(kg) * H_M) / T_S;
const workOf = (kg) => forceOf(kg) * H_M;

// The run. Each route's work counts up while the bag is on it and holds on
// arrival, so the counter is read exactly when the slide says to read it.
const TICK_MS = 60;
const UP_MS = 1200; // straight up, 1 m
const HOLD_MS = 600; // arrived, still there
const BACK_MS = 300; // back down to the floor
const SLIDE_MS = 300; // across to the foot of the ramp
const RAMP_RUN_MS = 1800; // up the slope, 4 m
const T_UP_END = UP_MS;
const T_HOLD_END = T_UP_END + HOLD_MS;
const T_BACK_END = T_HOLD_END + BACK_MS;
const T_SLIDE_END = T_BACK_END + SLIDE_MS;
const T_RUN_END = T_SLIDE_END + RAMP_RUN_MS;
const RUN_ARM_MS = 400; // the beat lands, then the run starts

// The hero's own drawing space. The one label inside it is the 1 m dimension
// rule, because the fixed height IS the scene's subject: without it the gap
// between the floor and the shelf is just empty wall. It sits at 15 units in a
// box drawn 1:1, so it lands at 15px - above the 14px floor - and it stands in
// the strip left of the bag, where nothing else is drawn on either mount.
const VB_W = 340;
const VB_H = 236;
const PLANK_Y = 78; // the shelf's top surface
const FLOOR_Y = 186; // the walkable surface - the 108 units between them are the 1 m lift
const PLANK_X = 30; // the shelf runs nearly the whole wall
const PLANK_W = 284;
const BAG_HX = 56; // the bag's half width. At the 1 m scale above a 200 kg sack
const BAG_H = 68; // is about 1.0 m by 0.63 m, and it holds a third of the frame's
// width on its own. It fills 63% of the metre, so 37 units of clear air stand
// above it: "one metre" reads as a gap the bag has not crossed, not a detail.
const HOME_X = 108; // the bag's bottom centre, where it starts and stays
const DIM_X = 8; // the 1 m rule, in the strip left of the bag (52) and of the ramp (176)
const RAMP_FX = 176; // the ramp's foot on the floor, clear of the bag's right edge
const RAMP_HX = 272; // far enough in that the bag lands wholly on the shelf
const RAMP_DEG = (Math.atan2(PLANK_Y - FLOOR_Y, RAMP_HX - RAMP_FX) * 180) / Math.PI;

// Two maps, keyed by the count the host hands over. The scene is never told
// which slide mounted it, so the map IS the mount.
const MAP_STILL = [
  [{ idx: 0, dwellMs: null }], // the dial that does not help
  [{ idx: 1, dwellMs: null }], // the dial pushed past anything a person could lift
  [{ idx: 2, dwellMs: null }], // the result held
];
const MAP_ROUTES = [
  [{ idx: 0, dwellMs: null }], // the bag, and a ramp on the panel
  [{ idx: 1, dwellMs: null }], // the two routes, one after the other
];

// The note card says what the drawing leaves out, and the simplifications that
// belong here are the idealised lift and the ramp's shape. Nothing on this card
// explains the scene: the prose does that, one line at a time. Two rows, not
// five - a note taller than the drawing stops being a footnote.
const NOTE_STILL = [
  { text: 'Both readings are true at every setting.', sub: `${H_M} m in ${T_S} s, g = ${G} N per kg, and the force shown is exactly the weight` },
  { text: 'The bag is never drawn off the floor.', sub: 'no setting on this dial can move it' },
];
// The second row is a confession the drawing owes. The route cards print 1 m
// against 4 m, but a true 4:1 slope does not fit a 340-unit box: the ramp is
// drawn about 1.4 units long for every 1 the straight route is. Saying "drawn
// steeper than it is" understated it - the drawn ramp is also far shorter than
// its 4 m. The figures are exact; the picture is a sketch of them.
const NOTE_ROUTES = [
  { text: 'Both readings are true at every setting.', sub: `${H_M} m in ${T_S} s, g = ${G} N per kg, and the force shown is exactly the weight` },
  { text: 'The drawing is a sketch, not to scale.', sub: `the ramp is drawn far shorter than its ${RAMP_M} m, and frictionless - the figures are exact, the picture is not` },
];

const CSS = `
.th-card { gap: var(--sim-space-3); }
.th-top { gap: var(--sim-space-2); }
.th-tag--state { border-color: var(--sim-accent); color: var(--sim-accent); }
.th-hint { border-color: var(--sim-gold); color: var(--sim-gold); }
@media (prefers-reduced-motion: no-preference) {
  .th-hint { animation: th-pulse 1.6s ease-in-out infinite; }
}
@keyframes th-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Left column: the drawing, then the dial. The dial sits under the bag rather
   than inside the drawing - a range input cannot live in an SVG. */
.th-main { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: var(--sim-space-4); align-items: start; }
.th-hero { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.th-svg { width: 100%; height: auto; display: block; }
/* A room, not a void: a back wall, a skirting board and a floor, so the shelf
   is mounted on something and the bag is standing on something. */
.th-wall { fill: var(--sim-bg-deep); }
.th-skirting { fill: var(--sim-stroke); }
.th-floor { fill: var(--sim-track); }
.th-plank { fill: var(--sim-wedge); }
.th-bracket { fill: var(--sim-wedge); opacity: 0.62; }
[data-mount="still"] [data-ramp] { display: none; }
[data-mount="still"] [data-routes] { display: none; }
.th-ramp { stroke: var(--sim-wedge); stroke-width: 14; stroke-linecap: butt; }
.th-ramp-post { stroke: var(--sim-wedge); stroke-width: 8; stroke-linecap: butt; }
/* The 1 m dimension rule. This is the one label inside the drawing and it is
   load-bearing: the fixed height is the scene's whole subject, and without it
   the gap between the floor and the shelf is just wall. 15 units in a box drawn
   1:1 lands at 15px, one step above --sim-text-sm, so it never goes under the
   14px floor the way a figure tucked under the bag would. */
.th-dim { stroke: var(--sim-label-muted); stroke-width: 2.5; stroke-dasharray: 7 6; fill: none; }
.th-dim-cap { stroke: var(--sim-label-muted); stroke-width: 3.5; stroke-linecap: round; }
.th-dim-text { fill: var(--sim-label-muted); font-family: var(--sim-font); font-size: 15px; font-weight: 800; }
/* The sack: a bulging body, a gathered neck tied off with a string, and a
   seam across it. */
.th-bag { fill: var(--sim-series-3); stroke: var(--sim-border); stroke-width: 2.5; }
.th-bag-neck { fill: var(--sim-series-3); stroke: var(--sim-border); stroke-width: 2.5; }
.th-bag-shade { fill: var(--sim-bg-deep); opacity: 0.22; }
.th-bag-seam { stroke: var(--sim-bg-deep); stroke-width: 2.5; fill: none; opacity: 0.28; stroke-linecap: round; }
.th-bag-tie { fill: var(--sim-bg-surface); stroke: var(--sim-border); stroke-width: 2; }
/* The face is the chapter's own, in the chapter's own ink-on-fill pairing: the
   ink is --sim-bg-deep, near-black on the light green of the dark theme and
   near-white on the dark green of the light theme. It is drawn flat, and it
   never changes, which is the joke the scene is making. */
.th-bag-eye { fill: var(--sim-bg-deep); }
.th-bag-mouth { fill: var(--sim-bg-deep); }

.th-dial { display: grid; grid-template-columns: minmax(0, 1fr) 84px; gap: var(--sim-space-2); align-items: center; }
.th-dial label { grid-column: 1 / -1; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.th-dial input[type="range"] { width: 100%; }
.th-dial input[type="range"]:disabled { opacity: 0.5; }
.th-dial-val { font-size: var(--sim-text-lg); font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }

/* Right column: the job that never changes, then the two readings. */
.th-side { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.th-job { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-2); }
.th-plate { gap: var(--sim-space-1); align-items: stretch; }
.th-plate .sim-tag { align-self: flex-start; }
.th-fig { text-align: center; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1; }
.th-fig--force { font-size: 34px; color: var(--sim-gold); }
.th-unit { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); margin-left: 3px; }
/* The power figure is the loudest thing on the panel, and its size is the
   point: it steps up with its own value and never touches the bag. */
.th-fig--power { font-size: 30px; color: var(--sim-accent); }
.th-fig--power[data-size="1"] { font-size: 40px; }
.th-fig--power[data-size="2"] { font-size: 50px; }
.th-fig--power[data-size="3"] { font-size: 62px; }
@media (prefers-reduced-motion: no-preference) {
  .th-fig--power, .th-fig--force { transition: font-size 220ms ease; }
}
.th-flash { animation: th-flash 620ms ease-out; }
@keyframes th-flash {
  0% { box-shadow: 0 var(--sim-lift) 0 var(--sim-gold); border-color: var(--sim-gold); }
  100% { box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke); }
}

/* The routes. Each card is one strip on one row - the route's name, its force
   and its work - so the two postings are read across and the whole section
   costs one row of height. Each figure gets its own grid track, so a long one
   (a five-figure kJ count) widens its own column instead of running into its
   neighbour's label. */
.th-routes { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.th-run { align-self: flex-start; padding: var(--sim-space-2) var(--sim-space-4); border: var(--sim-border); border-radius: var(--sim-radius-pill); background: var(--sim-accent); color: var(--sim-bg-deep); font: inherit; font-size: var(--sim-text-md); font-weight: 800; letter-spacing: 0.03em; cursor: pointer; }
.th-run[disabled] { opacity: 0.55; cursor: progress; }
.th-run:focus-visible, .th-dial input:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.th-route-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); }
.th-route { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); align-items: center; }
.th-route__tag { white-space: nowrap; }
.th-route--posted { border-color: var(--sim-accent); box-shadow: 0 var(--sim-lift) 0 var(--sim-accent); }
.th-mini { display: flex; flex-direction: column; gap: 0; min-width: 0; }
.th-mini b { font-size: var(--sim-text-lg); font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.th-mini i { font-size: var(--sim-text-sm); font-style: normal; color: var(--sim-label-muted); }
.th-mini--wait b { color: var(--sim-accent); }
.th-mini--wait i { color: var(--sim-label-muted); }
@media (prefers-reduced-motion: no-preference) {
  .th-route--posted .th-mini--work b { animation: th-post 480ms ease-out; }
}
@keyframes th-post { 0% { transform: scale(1); } 40% { transform: scale(1.14); } 100% { transform: scale(1); } }

/* The note is permanent background here, not a modal the learner opens: stock
   .sl-note is a full-cover overlay, which would hide the bag and both figures.
   Flow it inline instead. */
.th-note:empty { display: none; }
.th-note .sl-note { position: static; inset: auto; z-index: auto; display: block; padding: 0; background: none; animation: none; }
.th-note .sl-note__card { width: 100%; margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px; gap: var(--sim-space-2); animation: none; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); }
.th-note .sl-note__badge { position: static; inset: auto; transform: none; align-self: flex-start; font-size: var(--sim-text-sm); padding: 1px 9px; }
.th-note .sl-note__row { grid-template-columns: 22px minmax(0, 1fr); column-gap: var(--sim-space-2); animation: none; }
.th-note .sl-note__icon { width: 22px; height: 22px; }
.th-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.th-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; }

.sim-dom-root--portrait .th-main { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .th-route-grid { grid-template-columns: minmax(0, 1fr); }
`;

// A number with at most two decimals and no trailing zeros. Every figure in
// this scene is an exact multiple of the dial's own step, so nothing here ever
// has to be rounded to make a product come out.
function trim(n) {
  return String(Math.round(n * 100) / 100);
}

// Value and unit as two strings, so the plate can set the unit's size on its
// own. 1,200 -> "1.2 kN"; 200,000 -> "200 t".
function parts(n, units) {
  for (let i = units.length - 1; i >= 1; i--) {
    const div = 1000 ** i;
    if (Math.abs(n) >= div) return { v: trim(n / div), u: units[i] };
  }
  return { v: trim(n), u: units[0] };
}

const forceParts = (n) => parts(n, ['N', 'kN', 'MN']);
const powerParts = (n) => parts(n, ['W', 'kW', 'MW']);
const massParts = (kg) => (kg >= 1000 ? parts(kg, ['kg', 't']) : { v: trim(kg), u: 'kg' });

// Which of the four power type sizes a figure gets. The size is a function of
// the value and of nothing else.
function powerBucket(watts) {
  if (watts >= 100000) return '3';
  if (watts >= 1000) return '2';
  if (watts >= 100) return '1';
  return '0';
}

function sceneSvg(routes) {
  const posts = [0.34, 0.66]
    .map((f) => {
      const x = RAMP_FX + (RAMP_HX - RAMP_FX) * f;
      const y = FLOOR_Y + (PLANK_Y - FLOOR_Y) * f;
      return `<line class="th-ramp-post" x1="${x.toFixed(1)}" y1="${(y + 7).toFixed(1)}" x2="${x.toFixed(1)}" y2="${FLOOR_Y}"/>`;
    })
    .join('');
  const ramp = routes
    ? `<g data-ramp><line class="th-ramp" x1="${RAMP_FX}" y1="${FLOOR_Y}" x2="${RAMP_HX}" y2="${PLANK_Y}"/>${posts}</g>`
    : '';
  // The 1 m rule stands in the strip left of the bag, clear of the bag (54)
  // and of the ramp's foot (152), so it is the same on both mounts. It is the
  // height of the job and it is drawn to scale: the bag's own top stops well
  // short of the cap, which is the half of the metre the bag has not done. Its
  // label sits high, above the bag's shoulder, where nothing else is drawn.
  return `<svg class="th-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"
      aria-label="A sack of flour standing on the floor beneath a wall shelf one metre above it${routes ? ', with a plank leaning from the floor up to the far end of the shelf' : ''}. A dashed rule marks the one metre from the floor to the shelf.">
    <rect class="th-wall" x="0" y="0" width="${VB_W}" height="${FLOOR_Y}"/>
    <rect class="th-skirting" x="0" y="${FLOOR_Y - 9}" width="${VB_W}" height="9"/>
    <rect class="th-floor" x="0" y="${FLOOR_Y}" width="${VB_W}" height="${VB_H - FLOOR_Y}"/>
    <path class="th-bracket" d="M ${PLANK_X + 44} ${PLANK_Y + 12} L ${PLANK_X + 56} ${PLANK_Y + 12} L ${PLANK_X + 56} ${PLANK_Y + 27} L ${PLANK_X + 44} ${PLANK_Y + 27} L ${PLANK_X + 44} ${PLANK_Y + 19} L ${PLANK_X + 34} ${PLANK_Y + 19} L ${PLANK_X + 34} ${PLANK_Y + 12} Z"/>
    <path class="th-bracket" d="M ${PLANK_X + PLANK_W - 56} ${PLANK_Y + 12} L ${PLANK_X + PLANK_W - 44} ${PLANK_Y + 12} L ${PLANK_X + PLANK_W - 44} ${PLANK_Y + 19} L ${PLANK_X + PLANK_W - 34} ${PLANK_Y + 19} L ${PLANK_X + PLANK_W - 34} ${PLANK_Y + 12} L ${PLANK_X + PLANK_W - 44} ${PLANK_Y + 12} L ${PLANK_X + PLANK_W - 44} ${PLANK_Y + 27} L ${PLANK_X + PLANK_W - 56} ${PLANK_Y + 27} Z"/>
    ${ramp}
    <rect class="th-plank" x="${PLANK_X}" y="${PLANK_Y}" width="${PLANK_W}" height="12" rx="5"/>
    <line class="th-dim" x1="${DIM_X}" y1="${PLANK_Y + 2}" x2="${DIM_X}" y2="${FLOOR_Y - 2}"/>
    <line class="th-dim-cap" x1="${DIM_X - 8}" y1="${PLANK_Y + 2}" x2="${DIM_X + 8}" y2="${PLANK_Y + 2}"/>
    <line class="th-dim-cap" x1="${DIM_X - 8}" y1="${FLOOR_Y - 2}" x2="${DIM_X + 8}" y2="${FLOOR_Y - 2}"/>
    <text class="th-dim-text" x="${DIM_X + 7}" y="${PLANK_Y + 22}">1 m</text>
    <g data-bag transform="translate(${HOME_X} ${FLOOR_Y})">
      <ellipse class="th-bag-shade" cx="0" cy="-3" rx="${BAG_HX + 5}" ry="6"/>
      <path class="th-bag-neck" d="M ${-BAG_HX * 0.34} ${-BAG_H + 5} L ${-BAG_HX * 0.2} ${-BAG_H - 13} L ${BAG_HX * 0.2} ${-BAG_H - 13} L ${BAG_HX * 0.34} ${-BAG_H + 5} Z"/>
      <path class="th-bag" d="M ${-BAG_HX} 0 Q ${-BAG_HX} ${-BAG_H * 0.6} ${-BAG_HX * 0.62} ${-BAG_H * 0.78} Q ${-BAG_HX * 0.34} ${-BAG_H - 4} 0 ${-BAG_H - 4} Q ${BAG_HX * 0.34} ${-BAG_H - 4} ${BAG_HX * 0.62} ${-BAG_H * 0.78} Q ${BAG_HX} ${-BAG_H * 0.6} ${BAG_HX} 0 Q 0 9 ${-BAG_HX} 0 Z"/>
      <path class="th-bag-seam" d="M ${-BAG_HX * 0.72} ${-BAG_H * 0.42} Q ${-BAG_HX * 0.2} ${-BAG_H * 0.3} ${BAG_HX * 0.72} ${-BAG_H * 0.46}"/>
      <rect class="th-bag-tie" x="${-BAG_HX * 0.3}" y="${-BAG_H - 11}" width="${BAG_HX * 0.6}" height="8" rx="4"/>
      <ellipse class="th-bag-eye" cx="-15" cy="${-BAG_H * 0.56}" rx="5" ry="6.5"/>
      <ellipse class="th-bag-eye" cx="15" cy="${-BAG_H * 0.56}" rx="5" ry="6.5"/>
      <rect class="th-bag-mouth" x="-9" y="${-BAG_H * 0.3}" width="18" height="4" rx="2"/>
    </g>
  </svg>`;
}

// One route, one strip on a single row: its name and the distance it is drawn
// at share the tag, then the force it takes (which only appears once the route
// has run) and its work, which starts as the dashed unknown and is read on
// arrival. The tag carries the distance because the distance is a property of
// the drawing, not a result - and because four items across a half-width card
// squeeze the labels into each other, or cost a second row and the height the
// mount does not have. Force and work are the pair the slide compares.
function routeCard(key, tag, distance) {
  return `<div class="sim-card th-route" data-route="${key}">
      <span class="sim-tag th-route__tag">${tag} &middot; ${distance} m</span>
      <span class="th-mini" data-force-mini hidden><b data-force>0 N</b><i>force</i></span>
      <span class="th-mini th-mini--wait" data-work-mini><b data-work><span class="sim-q" aria-hidden="true">?</span></b><i>work</i></span>
    </div>`;
}

export class TooHeavyBagScene extends DomSimulation {
  static WIDTH = 680;
  // The two mounts show different amounts of content and neither grows under
  // the learner's hand, so the frame follows what is showing (FIT) - but the
  // host still lays the panel out from these, so they must cover the TALLER
  // mount, not the average. The still mount rests at 549 and the routes mount
  // at 667, and sim-layout's dials take both a little past that, so the routes
  // mount sets both numbers with headroom.
  static HEIGHT = 690;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1125;
  static FIT = true;
  static BEAT_STEP_MAP = MAP_STILL;
  static BEAT_MAPS = { 3: MAP_STILL, 2: MAP_ROUTES };
  static ARIA_LABEL = 'A sack of flour on the floor under a wall shelf one metre above it, with a dashed rule marking that one metre, beside a mass dial and two readings: the force needed to lift it, and the power of the same lift done in five seconds. Turning the dial raises both readings and the sack does not move.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._mount = 'still';
    this._beat = 0;
    this._index = STILL_START[0];
    this._run = null;
    this._posted = { up: false, ramp: false };
    this._acted = false;
    this._timers = [];
  }

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, rootClass: 'th-root', html: this._html() });

    this._svg = this.root?.querySelector?.('[data-svg]') ?? null;
    this._bag = this.root?.querySelector?.('[data-bag]') ?? null;
    this._state = this.root?.querySelector?.('[data-state]') ?? null;
    this._hint = this.root?.querySelector?.('[data-hint]') ?? null;
    this._slider = this.root?.querySelector?.('[data-mass]') ?? null;
    this._massOut = this.root?.querySelector?.('[data-mass-out]') ?? null;
    this._forceFig = this.root?.querySelector?.('[data-force-fig]') ?? null;
    this._forceUnit = this.root?.querySelector?.('[data-force-unit]') ?? null;
    this._forcePlate = this.root?.querySelector?.('[data-plate-force]') ?? null;
    this._powerFig = this.root?.querySelector?.('[data-power-fig]') ?? null;
    this._powerUnit = this.root?.querySelector?.('[data-power-unit]') ?? null;
    this._powerPlate = this.root?.querySelector?.('[data-plate-power]') ?? null;
    this._runBtn = this.root?.querySelector?.('[data-run]') ?? null;
    this._note = this.root?.querySelector?.('[data-note]') ?? null;
    this._cards = {
      up: this._cardEls('up'),
      ramp: this._cardEls('ramp'),
    };

    this._slider?.addEventListener?.('input', () => this._turned());
    this._runBtn?.addEventListener?.('click', () => this._startRun());
    this.onStep();
  }

  // Both route cards are wired once and never re-queried: the run repaints them
  // twenty times a second and a querySelector per tick is a lookup per tick.
  _cardEls(key) {
    const card = this.root?.querySelector?.(`[data-route="${key}"]`) ?? null;
    return {
      card,
      workWrap: card?.querySelector?.('[data-work-mini]') ?? null,
      work: card?.querySelector?.('[data-work]') ?? null,
      forceWrap: card?.querySelector?.('[data-force-mini]') ?? null,
      force: card?.querySelector?.('[data-force]') ?? null,
    };
  }

  destroy() {
    this._clearTimers();
    this._run = null;
    this._svg = null;
    this._bag = null;
    this._state = null;
    this._hint = null;
    this._slider = null;
    this._massOut = null;
    this._forceFig = null;
    this._forceUnit = null;
    this._forcePlate = null;
    this._powerFig = null;
    this._powerUnit = null;
    this._powerPlate = null;
    this._runBtn = null;
    this._note = null;
    this._cards = null;
    super.destroy();
  }

  // ------------------------------------------------------------------- beats

  // The host hands over the count and never the slide, and the count is the
  // only thing that tells the two mounts apart, so the map is resolved here
  // and everything downstream reads the mount off it.
  onBeatChange(beatIndex, beatCount) {
    const map = this.constructor.BEAT_MAPS[beatCount] ?? this.constructor.BEAT_STEP_MAP;
    this._mount = map === MAP_ROUTES ? 'routes' : 'still';
    const n = Number.isFinite(beatIndex) ? Math.trunc(beatIndex) : 0;
    this._beat = Math.max(0, Math.min(n, map.length - 1));
    this.stepIndex = map[this._beat][0].idx;
    if (this.root) this.root.dataset.step = String(this.stepIndex);
    if (this.root) this.root.dataset.mount = this._mount;
    this.onStep();
  }

  onStep() {
    this._clearTimers();
    this._run = null;
    this._posted = { up: false, ramp: false };
    this._acted = false;
    this._index = this._mount === 'routes' ? ROUTES_START : (STILL_START[this._beat] ?? STILL_START[0]);
    if (this._slider) {
      this._slider.value = String(this._index);
      this._slider.disabled = false;
    }
    if (this._runBtn) this._runBtn.disabled = false;
    if (this._hint) this._hint.textContent = this._mount === 'routes' ? 'run both routes' : 'turn the dial';
    if (this._note) this._note.innerHTML = noteCardHtml(this._mount === 'routes' ? NOTE_ROUTES : NOTE_STILL, 'What this panel leaves out');
    this._placeBag(0, 0);
    this._paint();
    this._flash();
    // Beat 1 of the routes mount is the run, so a learner arriving there
    // mid-lesson sees both routes post their own entry.
    if (this._mount === 'routes' && this._beat === 1) this._arm(RUN_ARM_MS, () => this._startRun());
  }

  // ------------------------------------------------------------------- dial

  _turned() {
    const v = Number(this._slider?.value);
    if (Number.isFinite(v)) this._index = Math.max(0, Math.min(Math.trunc(v), MASSES.length - 1));
    this._acted = true;
    this._paint();
  }

  _kg() {
    return MASSES[this._index] ?? MASSES[0];
  }

  // ---------------------------------------------------------------- the run

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

  _startRun() {
    if (this._run || this._mount !== 'routes') return;
    this._clearTimers();
    this._run = { t: 0 };
    this._posted = { up: false, ramp: false };
    if (this._runBtn) this._runBtn.disabled = true;
    // The dial locks for the run: the bag's two routes are one set of numbers,
    // and moving the mass under a travelling bag would put two sets on one card.
    if (this._slider) this._slider.disabled = true;
    this._acted = true;
    this.animateFor?.(T_RUN_END + 600);
    this._arm(TICK_MS, () => this._advance());
  }

  // NOT named _tick: DomSimulation opens a real rAF loop for any subclass that
  // defines _tick, and this chain already advances on its own timer.
  _advance() {
    if (!this._run) return;
    this._run.t += TICK_MS;
    const t = this._run.t;
    const ramp = Math.min(1, Math.max(0, t - T_SLIDE_END) / RAMP_RUN_MS);
    this._posted.up = t >= T_UP_END;
    this._posted.ramp = t >= T_RUN_END;
    this._placeBag(t, ramp);
    this._paint();
    if (t >= T_RUN_END) {
      this._finish();
      return;
    }
    this._arm(TICK_MS, () => this._advance());
  }

  _finish() {
    this._run = null;
    if (this._runBtn) this._runBtn.disabled = false;
    if (this._slider) this._slider.disabled = false;
  }

  // Where the bag is at time t. The still mount only ever gets (0, 0), so its
  // drawing is the same path at every dial setting and every beat.
  _placeBag(t, rampF) {
    if (!this._bag || this._mount !== 'routes') return;
    let x = HOME_X;
    let y = FLOOR_Y;
    let deg = 0;
    if (t > 0) {
      if (t < T_UP_END) {
        y = FLOOR_Y + (PLANK_Y - FLOOR_Y) * (t / T_UP_END);
      } else if (t < T_HOLD_END) {
        y = PLANK_Y;
      } else if (t < T_BACK_END) {
        y = PLANK_Y + (FLOOR_Y - PLANK_Y) * ((t - T_HOLD_END) / BACK_MS);
      } else if (t < T_SLIDE_END) {
        x = HOME_X + (RAMP_FX - HOME_X) * ((t - T_BACK_END) / SLIDE_MS);
      } else if (t < T_RUN_END) {
        x = RAMP_FX + (RAMP_HX - RAMP_FX) * rampF;
        y = FLOOR_Y + (PLANK_Y - FLOOR_Y) * rampF;
        // The bag is hauled up the slope tilted with it, then rights itself
        // over the last fifth of the climb: it is set down on the shelf, not
        // left lying on the ramp. Without this it ends the run tipped over.
        const settle = Math.max(0, (rampF - 0.8) / 0.2);
        deg = RAMP_DEG * rampF * (1 - settle);
      } else {
        x = RAMP_HX;
        y = PLANK_Y;
        deg = 0;
      }
    }
    const degText = Math.abs(deg) < 0.05 ? '' : ` rotate(${deg.toFixed(2)})`;
    this._bag.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})${degText}`);
  }

  // ----------------------------------------------------------------- paint

  _paint() {
    const kg = this._kg();
    const f = forceOf(kg);
    const p = powerOf(kg);
    const mass = massParts(kg);
    const fp = forceParts(f);
    const pp = powerParts(p);

    if (this._massOut) this._massOut.textContent = `${mass.v} ${mass.u}`;
    if (this._forceFig) this._forceFig.textContent = fp.v;
    if (this._forceUnit) this._forceUnit.textContent = fp.u;
    if (this._powerFig) {
      this._powerFig.textContent = pp.v;
      this._powerFig.dataset.size = powerBucket(p);
    }
    if (this._powerUnit) this._powerUnit.textContent = pp.u;
    if (this._state) {
      this._state.textContent = this._mount === 'routes'
        ? (this._posted.ramp ? 'on the shelf' : (this._run ? 'on its way' : 'on the floor'))
        : 'still on the floor';
    }
    if (this._hint) {
      this._hint.hidden = this._acted;
    }
    if (this._mount === 'routes') this._paintRoutes(kg);
  }

  _paintRoutes(kg) {
    const work = workOf(kg);
    const t = this._run?.t ?? 0;
    // Each route posts its own entry, from its own force and its own distance,
    // and the two products are the same number by construction: F2 = W / 4 m.
    this._route('up', {
      live: t > 0 && t < T_UP_END,
      posted: this._posted.up,
      frac: Math.min(1, t / T_UP_END),
      force: work / H_M,
      work,
    });
    this._route('ramp', {
      live: t > T_SLIDE_END && t < T_RUN_END,
      posted: this._posted.ramp,
      frac: Math.min(1, Math.max(0, (t - T_SLIDE_END) / RAMP_RUN_MS)),
      force: work / RAMP_M,
      work,
    });
  }

  // One card, one entry. While a route is still waiting its work figure is the
  // dashed unknown, and a beat change puts it back: a posted figure that
  // survived into the next beat would be a figure no route in this beat earned.
  _route(key, state) {
    const els = this._cards?.[key];
    if (!els?.card) return;
    const frac = state.posted ? 1 : state.frac;
    const shown = state.live || state.posted;
    if (els.forceWrap) els.forceWrap.hidden = !shown;
    els.workWrap?.classList?.toggle('th-mini--wait', !shown);
    if (!shown) {
      if (els.work) els.work.innerHTML = '<span class="sim-q" aria-hidden="true">?</span>';
      els.card.classList.remove('th-route--posted');
      return;
    }
    const fp = forceParts(state.force);
    // The live figure is a whole number of joules - it is a counter on its way
    // up, not a reading - and the posted figure is the exact product.
    const wp = parts(state.posted ? state.work : Math.round(frac * state.work), ['J', 'kJ', 'MJ']);
    if (els.force) els.force.textContent = `${fp.v} ${fp.u}`;
    if (els.work) els.work.textContent = `${wp.v} ${wp.u}`;
    els.card.classList.toggle('th-route--posted', state.posted);
  }

  // A one-shot flash so a beat that has just set its own default is noticed.
  // The class is removed and re-added so the animation restarts.
  _flash() {
    for (const el of [this._forcePlate, this._powerPlate]) {
      if (!el) continue;
      el.classList.remove('th-flash');
      void el.offsetWidth;
      el.classList.add('th-flash');
    }
  }

  _html() {
    return `<div class="sim-card th-card">
      <div class="sim-row th-top">
        <span class="sim-tag th-tag--state" data-state>still on the floor</span>
        <span class="sim-tag th-hint" data-hint>turn the dial</span>
      </div>
      <div class="th-main">
        <div class="th-hero">
          <div data-svg>${sceneSvg(true)}</div>
          <div class="th-dial">
            <label for="th-mass">mass on the dial</label>
            <input id="th-mass" type="range" min="0" max="${MASSES.length - 1}" step="1" value="${STILL_START[0]}" data-mass>
            <span class="th-dial-val" data-mass-out>20 kg</span>
          </div>
        </div>
        <div class="th-side">
          <div class="th-job">
            <div class="sim-field"><span class="sim-field__label">lift</span><span class="sim-field__value">${H_M} m</span></div>
            <div class="sim-field"><span class="sim-field__label">time</span><span class="sim-field__value">${T_S} s</span></div>
          </div>
          <div class="sim-card th-plate" data-plate-force>
            <span class="sim-tag">force needed</span>
            <span class="th-fig th-fig--force"><span data-force-fig>200</span><span class="th-unit" data-force-unit>N</span></span>
          </div>
          <div class="sim-card th-plate" data-plate-power>
            <span class="sim-tag">power it would need</span>
            <span class="th-fig th-fig--power"><span data-power-fig>40</span><span class="th-unit" data-power-unit>W</span></span>
          </div>
        </div>
      </div>
      <div class="th-routes" data-routes>
        <button class="th-run" type="button" data-run>Run both routes</button>
        <div class="th-route-grid">
          ${routeCard('up', 'straight up', H_M)}
          ${routeCard('ramp', 'up the ramp', RAMP_M)}
        </div>
      </div>
      <div class="th-note" data-note></div>
    </div>`;
  }
}
