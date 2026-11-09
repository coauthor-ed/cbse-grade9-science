/**
 * MaleSystemKit - the shared drawings and vocabulary for the L07 male-system mounts.
 *
 * Two mounts use this and must look like the same body: `MaleSystemScene.js` (the hook, where the
 * learner raises the pouch and watches two readings move together) and `MaleSystemScene-verdict.js`
 * (the guided tour, where the readings are already apart and one organ is ringed per beat). Both
 * draw the same pelvic cutaway, the same organ shapes and the same two-reading panel, so the
 * drawing lives here once and neither mount draws a second, different body.
 *
 * The kit is functions and data, never a base class. It paints nothing on its own: each scene puts
 * `MALE_SYSTEM_KIT_CSS` into its own `render({ css })` and asks for the markup it needs.
 *
 * Rules the shapes keep to, from the two stubs they were written against:
 *   - the scrotum hangs below the body outline and outside it. That single fact is the hook slide's
 *     whole argument, so nothing in this file draws it tucked in; the hook scene raises it with the
 *     `scrotum` argument, the tour mount always passes 'down'.
 *   - an organ is ringed, never filled in or enlarged, when the tour reaches it. The evidence stays
 *     the same size in every beat so two beats can be compared by looking at them.
 *   - a ring is a band of accent drawn BEHIND the organ and wider than it, so it reads as an outline
 *     round the thing rather than a line drawn down the middle of it.
 *   - no sperm is ever drawn inside a tube. The slide says sperm travel along the tube, and the
 *     drawing says the same by showing the tube.
 */

/** The cutaway's own coordinate box. Scenes scale the box with CSS and never re-measure an organ. */
export const PELVIS_VIEW = { w: 360, h: 430 };

/** How far the pouch travels when it is raised, in viewBox units: from the floor up to bladder level. */
export const RAISE = 132;

/**
 * The two readings the panel shows. `body` is the abdomen-line reading, `testes` the pouch one.
 * On the tour mount these are held apart on every beat and are not inputs anywhere; the hook mount
 * moves `testes` up towards `body` as the pouch is raised.
 */
export const READINGS = { body: 37.0, testes: 34.0 };

/**
 * What each organ is called in a plain-name-first chip. One list for the tour chips and the tap
 * chips, so a chip the learner summons by tapping can never disagree with the beat's own chip.
 * The bladder is drawn but has no chip: no slide in this lesson calls it out, and naming an organ
 * the lesson has not pointed at is the one thing these stubs do not allow.
 */
export const ORGAN_CHIPS = {
  scrotum: 'a pouch of skin',
  testis: 'where sperm are made',
  vas: 'a long tube',
  urethra: 'one shared passage',
  glands: 'a fluid-making gland',
};

/** Every organ a learner can tap, in the order the tour meets them. */
export const TAPPABLE = ['scrotum', 'testis', 'vas', 'urethra', 'glands'];

/** The ring treatments: one accent band for the organ the beat is about, one lighter for its pair. */
export const RING_MAIN = 'main';
export const RING_SECOND = 'second';

/** `down` / `up`: the pouch's position, the only state the cutaway drawing takes. */
export const POUCH_DOWN = 'down';
export const POUCH_UP = 'up';

const f1 = (n) => (Math.round(n * 10) / 10).toString();

function escAttr(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ the shapes */

/**
 * The body in sagittal section: the back of the trunk on the left, the front on the right, the
 * abdomen cut flat across the top and the floor of the pelvis below. A few spine marks stand in
 * for the bone round the middle that the hook slide says every organ gets.
 */
function bodyShape() {
  return `<g class="mk-body">
    <path class="mk-trunk"
      d="M46 20 C40 90, 42 150, 54 196 C60 222, 68 240, 78 252 C140 274, 236 276, 296 250
      C306 236, 310 214, 312 190 C316 130, 314 70, 310 20 Z"/>
    <path class="mk-skin" d="M46 20 C40 90, 42 150, 54 196 C60 222, 68 240, 78 252"/>
    <path class="mk-skin" d="M310 20 C314 70, 316 130, 312 190 C310 214, 306 236, 296 250"/>
    <path class="mk-floor" d="M78 252 C140 274, 236 276, 296 250"/>
    <path class="mk-spine" d="M56 66 L68 74 M53 100 L66 108 M52 134 L65 141 M54 168 L66 174"/>
  </g>`;
}

/**
 * The pubic arch at the front of the pelvis, drawn under the organs in the muted colour only: it
 * gives the internal organs something to be internal to, and it names nothing.
 */
function boneShape() {
  return `<path class="mk-boneshape" d="M212 250 C216 210, 238 184, 268 180 C290 177, 302 194, 304 218"/>`;
}

/** The bladder: one rounded bag high in the pelvis, above everything else the tour visits. */
const BLADDER_D = 'M182 36 C210 36, 224 54, 224 82 C224 106, 218 126, 208 135 C192 144, 172 144, 156 135 C146 126, 140 106, 140 82 C140 54, 154 36, 182 36 Z';

function bladderShape() {
  return `<path class="mk-shape mk-shape--bladder" d="${BLADDER_D}"/>`;
}

/**
 * The seminal vesicle: a small lobed sac behind the bladder's base. One sac is drawn, because the
 * side view shows one, and the slide says "the seminal vesicles" in the plural without needing the
 * second one to be visible.
 */
const VESICLE_D = 'M128 156 C116 148, 116 134, 126 127 C136 120, 148 125, 153 136 C158 125, 170 120, 180 127 C190 134, 190 148, 178 156 C170 162, 162 161, 157 156 C152 161, 144 162, 136 157 Z';

function vesicleShape() {
  return `<path class="mk-shape mk-shape--gland" d="${VESICLE_D}"/>`;
}

/** The prostate: a rounded gland sitting under the bladder, round the urethra where it passes. */
const PROSTATE_D = 'M150 178 C150 168, 162 162, 178 162 C194 162, 206 168, 206 178 C206 188, 194 196, 178 196 C162 196, 150 188, 150 178 Z';

function prostateShape() {
  return `<path class="mk-shape mk-shape--gland" d="${PROSTATE_D}"/>`;
}

/** The penis: the tube the urethra runs inside, forward from the pubic arch and slightly down. */
function penisShape() {
  return `<path class="mk-shape mk-penisshape"
    d="M250 206 C282 214, 312 240, 330 266 C342 284, 336 302, 320 298 C298 293, 268 274, 244 252
    C240 236, 240 216, 250 206 Z"/>`;
}

/** The urethra: one tube from the bladder's base, down through the prostate, then forward out. */
const URETHRA_D = 'M186 128 C186 156, 182 190, 188 212 C196 238, 226 262, 268 282 C296 296, 318 302, 330 300';

function urethraPath(raise) {
  return `M186 ${128 - raise} C186 156, 182 190, 188 212 C196 238, 226 262, 268 282 C296 296, 318 302, 330 300`;
}

/**
 * The vas deferens: it leaves the top of the near testis, rises up out of the pouch, runs up into
 * the body and forwards, and opens into the urethra behind the prostate. One continuous path, so
 * what the slide calls "a long tube" is long in the drawing too. `raise` moves its foot with the
 * testis and leaves its top in the body, which is what raising the pouch does to a real one.
 */
function vasPath(raise) {
  return `M158 ${300 - raise} C158 ${280 - raise}, 152 ${262 - raise}, 156 ${238 - raise} C160 214, 166 198, 172 190`;
}

/**
 * The scrotum: the pouch of skin hanging below and outside the body floor, joined to it by a short
 * neck. Its wall thickness is the CSS variable `--mk-wall`, so the hook mount can thin the wall on
 * its own beat and show what is inside without moving anything.
 */
const POUCH_D = 'M112 292 C104 268, 116 254, 136 254 C158 254, 172 266, 174 290 C178 322, 174 358, 160 374 C150 386, 126 386, 116 374 C102 358, 106 320, 112 292 Z';
const POUCH_NECK_D = 'M126 254 C130 244, 152 244, 156 254';

function scrotumShape() {
  // The wall is drawn twice - a wide rim, then the cavity inside it - so the pouch reads as skin of
  // one colour with an opening, not as a grey-rimmed stone with a hole. `--mk-wall` is the rim's
  // width, which the hook mount thins on its own beat to show what is inside.
  return `<path class="mk-neck" d="${POUCH_NECK_D}"/>
    <path class="mk-pouchrim" d="${POUCH_D}"/>
    <path class="mk-pouch" d="${POUCH_D}" stroke-width="1"/>`;
}

/** The two testes: plain ovals inside the pouch, side by side and plainly visible. */
const FAR_TESTIS = 'M122 320 C110 320, 106 334, 112 346 C118 358, 132 358, 137 346 C142 334, 134 320, 122 320 Z';
const NEAR_TESTIS = 'M160 316 C148 316, 144 330, 150 342 C156 354, 170 354, 175 342 C180 330, 172 316, 160 316 Z';

function testesShape() {
  return `<path class="mk-shape mk-testis" d="${FAR_TESTIS}"/>
    <path class="mk-shape mk-testis" d="${NEAR_TESTIS}"/>`;
}

/**
 * A sperm as the slide describes it and no further: a head and a tail. No nucleus, no chromosome,
 * no count, no label - how many chromosomes it carries is s05's business and this mount must not
 * get ahead of it. It is drawn alone, in the corner, with nothing near it.
 */
function spermShape() {
  return `<g class="mk-sperm">
    <ellipse class="mk-spermhead" cx="304" cy="386" rx="16" ry="11" transform="rotate(-16 304 386)"/>
    <path class="mk-spermflag" d="M318 390 C334 396, 340 384, 352 392"/>
  </g>`;
}

/**
 * An SVGElement has no `click()`, so a headless driver that presses scene inputs cannot press an
 * organ drawn inside an SVG. Give each pressable shape the same method a real button has, so
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

/**
 * A pressable hit box over an organ, so a tap or a keyboard press reaches the same handler a
 * learner's tap does. Drawn last within its own group, over that group's drawing, with a
 * transparent fill. `o` is `[x, y, w, h]`, or a path object when the organ needs its own outline.
 */
function hitBox(o, organ, label) {
  const attrs = `class="mk-hit" data-organ="${escAttr(organ)}" role="button" tabindex="0"
    aria-label="${escAttr(label)}"`;
  if (o.d) {
    const wide = o.stroke || 22;
    const xf = o.transform ? ` transform="${escAttr(o.transform)}"` : '';
    // A solid organ is hit by its filled outline; a tube has no area, so its stroke is the target.
    const fill = o.stroke ? 'none' : 'transparent';
    return `<path ${attrs} d="${o.d}"${xf} fill="${fill}" stroke="transparent" stroke-width="${f1(wide)}"
      stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const [x, y, w, h] = o;
  return `<rect ${attrs} x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/>`;
}

/**
 * One organ, wrapped so a ring treatment can be switched on it without the scene touching markup:
 * `data-ring` goes on the wrapper and the stylesheet does the rest.
 *
 * `o` = {
 *   id, label,                 - the tap id and its aria-label
 *   ring,                      - RING_MAIN | RING_SECOND | '' ; the tour sets it per beat
 *   halo,                      - a wider band drawn BEHIND the organ: this is what a ring looks like
 *   shape,                     - the organ itself, drawn over its own halo
 *   hit,                       - the pressable box over it; a path where a box would overlap a neighbour
 *   second,                    - true for the organ that carries the lighter, dashed ring
 *   lower,                     - true for the organs that travel with the pouch when it is raised
 * }
 *
 * Groups are emitted in draw order, and a later group's hit box wins where two overlap. That is
 * deliberate: the testes are drawn after the scrotum, so a tap in the middle of the pouch reads as
 * a testis and a tap on the pouch's wall reads as the pouch.
 */
function organ(o) {
  const { id, label, ring = '', halo = '', shape, hit, second = false, lower = false } = o;
  const haloCls = second ? 'mk-ringgrp mk-ringgrp--second' : 'mk-ringgrp';
  return `<g class="mk-organgrp" data-organ="${escAttr(id)}" data-ring="${escAttr(ring)}"${lower ? ' data-lower="1"' : ''}>
    <g class="${haloCls}">${halo}</g>
    ${shape}
    ${hitBox(hit, id, label)}
  </g>`;
}

/* ------------------------------------------------------------------ the cutaway */

/**
 * The whole cutaway as one `<svg>` string.
 *
 * `o` = {
 *   scrotum: 'down' | 'up' - where the pouch hangs. The tour mount always passes 'down'.
 *   ring: { organ: 'main' | 'second' | '' } - which organ carries which ring treatment.
 * }
 *
 * The markup is the same on every beat: the tour changes `data-ring`, never the structure, so a
 * beat change can never quietly redraw the body the learner is comparing against. The sperm outline
 * is always in the markup and switched by `data-sperm`, for the same reason. `data-organ` is the
 * same word on the wrapper and on the hit box, so a tap resolves to one organ whether it landed on
 * the shape or on the box around it.
 */
export function cutawaySvg(o = {}) {
  const { scrotum = POUCH_DOWN, ring = {} } = o;
  const { w, h } = PELVIS_VIEW;
  const raise = scrotum === POUCH_UP ? RAISE : 0;
  const r = (id) => escAttr(ring[id] || '');

  const inside = [
    organ({ id: 'bladder', label: 'the bladder', ring: '', shape: bladderShape(), hit: { d: BLADDER_D } }),
    organ({
      id: 'glands',
      label: 'the seminal vesicle and the prostate gland',
      ring: r('glands'),
      halo: `<g transform="translate(0 26)">
        <ellipse class="mk-halo mk-halo--thin" cx="157" cy="143" rx="38" ry="23"/>
        <ellipse class="mk-halo mk-halo--thin" cx="178" cy="179" rx="31" ry="21"/>
      </g>`,
      shape: `<g transform="translate(0 26)">${vesicleShape()}${prostateShape()}</g>`,
      // A box over the vesicle, clear of the urethra's own tube where it passes: the two glands
      // are one tap target, and the box is placed where no later group's hit box sits on top of it.
      hit: [112, 160, 82, 44],
    }),
    organ({
      id: 'urethra',
      label: 'the urethra, one shared passage',
      ring: r('urethra'),
      second: true,
      halo: `<path class="mk-halo" d="${urethraPath(raise)}"/>`,
      shape: penisShape() + `<path class="mk-shape mk-tube" d="${URETHRA_D}"/>`,
      hit: { d: URETHRA_D, stroke: 26 },
    }),
  ].join('\n    ');

  const lower = [
    organ({
      id: 'scrotum',
      label: 'the scrotum, a pouch of skin',
      ring: r('scrotum'),
      halo: `<path class="mk-halo" d="${POUCH_D}"/>`,
      shape: scrotumShape(),
      // The pouch's lower wall, below the testes' own hit paths, so a tap on bare skin reads as
      // the scrotum and a tap between the two ovals reads as a testis.
      hit: [110, 352, 68, 38],
      lower: true,
    }),
    organ({
      id: 'testis',
      label: 'a testis, where sperm are made',
      ring: r('testis'),
      halo: `<ellipse class="mk-halo" cx="129" cy="338" rx="26" ry="24"/>
        <ellipse class="mk-halo" cx="167" cy="334" rx="26" ry="24"/>`,
      shape: testesShape(),
      hit: { d: `${FAR_TESTIS} ${NEAR_TESTIS}` },
      lower: true,
    }),
    organ({
      id: 'vas',
      label: 'the vas deferens, a long tube',
      ring: r('vas'),
      halo: `<path class="mk-halo" d="${vasPath(raise)}"/>`,
      shape: `<path class="mk-shape mk-tube" d="${vasPath(raise)}"/>`,
      hit: { d: vasPath(raise), stroke: 26 },
      lower: true,
    }),
  ].join('\n    ');

  return `<svg class="mk-cutaway" viewBox="0 0 ${w} ${h}" role="img"
  aria-label="A body in side section with the pelvic organs inside it and the scrotum hanging below and outside the body."
  data-scrotum="${escAttr(scrotum)}" data-sperm="0">
    ${bodyShape()}
    ${boneShape()}
    ${inside}
    <g class="mk-lowergp"${raise ? ` style="transform: translateY(${-raise}px)"` : ''}>
    ${lower}
    </g>
    ${spermShape()}
  </svg>`;
}

/* ------------------------------------------------------------------ the temperature panel */

/**
 * The two-reading temperature panel as HTML. Two numbers, never one merged figure, and two bars at
 * the two levels so the gap between them reads before the digits do.
 *
 * `o` = { on: boolean, body: number, testes: number } - `on: false` is the predict mount, where the
 * panel is switched off entirely and shows no reading, no bar and no track.
 */
export function temperaturePanelHtml(o = {}) {
  const { on = true, body = READINGS.body, testes = READINGS.testes } = o;
  if (!on) {
    return `<div class="mk-panel mk-panel--off" data-panel="off">
      <div class="mk-panel-title">temperature</div>
      <div class="mk-panel-off">switched off</div>
    </div>`;
  }
  const lo = Math.min(body, testes);
  const hi = Math.max(body, testes);
  const span = Math.max(hi - lo, 0.001);
  const pct = (v) => f1(((v - lo + span * 0.3) / (span * 1.6)) * 100);
  const row = (label, value, cls) => `
      <div class="mk-reading ${cls}">
        <div class="mk-reading-head">
          <span class="mk-reading-label">${escAttr(label)}</span>
          <span class="mk-reading-value">${value.toFixed(1)}<span class="mk-deg">\u00b0C</span></span>
        </div>
        <div class="mk-bar"><span class="mk-bar-fill ${cls}" style="width: ${pct(value)}%"></span></div>
      </div>`;
  return `<div class="mk-panel" data-panel="on">
    <div class="mk-panel-title">temperature</div>
    ${row('body', body, 'mk-row--body')}
    ${row('testes', testes, 'mk-row--testes')}
    <div class="mk-gap" data-gap="apart">${(hi - lo).toFixed(1)}<span class="mk-deg">\u00b0C</span> apart</div>
  </div>`;
}

export const MALE_SYSTEM_KIT_CSS = `
.mk-root {
  display: flex;
  flex-direction: column;
  gap: var(--sim-space-2);
  width: 100%;
  min-width: 0;
}

.mk-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sim-space-2);
  flex-wrap: wrap;
}

.mk-title {
  margin: 0;
  font-size: var(--sim-text-lg);
  font-weight: 800;
  color: var(--sim-label);
}

.mk-frame {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: var(--sim-space-3);
  align-items: start;
  min-width: 0;
}

.mk-hero {
  position: relative;
  min-width: 0;
  padding: var(--sim-space-2);
  border: var(--sim-border);
  border-radius: var(--sim-radius-lg);
  background: var(--sim-bg-surface);
  box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke);
}

.mk-cutaway {
  display: block;
  width: 100%;
  height: auto;
}

/* the body: one trunk fill with the skin drawn over it, so organs sit inside something */
.mk-trunk { fill: var(--sim-bg-cell); }
.mk-skin, .mk-floor {
  fill: none;
  stroke: var(--sim-label-muted);
  stroke-width: 3;
  stroke-linecap: round;
}
.mk-floor { stroke-width: 2.5; }
.mk-spine {
  fill: none;
  stroke: var(--sim-muted);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.6;
}
.mk-boneshape {
  fill: none;
  stroke: var(--sim-muted);
  stroke-width: 7;
  stroke-linecap: round;
  opacity: 0.5;
}

.mk-shape { stroke: var(--sim-stroke); stroke-width: 2.5; stroke-linejoin: round; }
.mk-shape--bladder { fill: var(--sim-series-2); }
.mk-shape--gland { fill: var(--sim-series-3); }
.mk-tube { fill: none; stroke: var(--sim-series-1); stroke-width: 8; stroke-linecap: round; }
.mk-penisshape { fill: var(--sim-series-4); }
/* The testes get their own dark rim: the same blue family on a violet pouch reads as a hole. */
.mk-testis { fill: var(--sim-series-7); stroke: var(--sim-bg-deep); stroke-width: 3; }
.mk-pouch {
  fill: var(--sim-series-5);
  stroke: none;
  stroke-width: var(--mk-wall, 9);
}
.mk-pouchrim {
  fill: none;
  stroke: var(--sim-series-5);
  stroke-width: var(--mk-wall, 9);
}
.mk-neck {
  fill: none;
  stroke: var(--sim-series-5);
  stroke-width: 16;
  stroke-linecap: round;
}

.mk-hit { fill: transparent; cursor: pointer; }
/* Keyboard focus, not a mouse click: a thin dashed outline along the organ's own line. The hit
   path's own wide stroke-width is overridden here, so focusing a tube traces the tube. */
.mk-hit:focus-visible {
  stroke: var(--sim-accent);
  stroke-width: 2.5;
  stroke-dasharray: 7 6;
  outline: none;
}

/* The ring: a band of accent behind the organ, wider than the organ, so it reads as an outline
   round the thing. Opacity only, so a beat change is a 400 ms cross-fade that ends. */
.mk-halo {
  fill: none;
  stroke: var(--sim-gold);
  stroke-width: 15;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transition: opacity 400ms ease;
}
.mk-ringgrp--second .mk-halo {
  stroke: var(--sim-accent);
  stroke-width: 12;
  stroke-dasharray: 13 9;
}
.mk-halo--thin { stroke-width: 11; }
.mk-organgrp[data-ring='main'] .mk-halo { opacity: 1; }
.mk-organgrp[data-ring='second'] .mk-halo { opacity: 1; }

.mk-sperm { opacity: 0; transition: opacity 400ms ease; }
.mk-cutaway[data-sperm='1'] .mk-sperm { opacity: 1; }
.mk-spermhead { fill: var(--sim-series-1); stroke: var(--sim-stroke); stroke-width: 2.5; }
.mk-spermflag {
  fill: none;
  stroke: var(--sim-series-1);
  stroke-width: 4;
  stroke-linecap: round;
}

.mk-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sim-space-2);
  padding: var(--sim-space-3);
  border: var(--sim-border);
  border-radius: var(--sim-radius-lg);
  background: var(--sim-bg-surface);
  box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke);
  min-width: 0;
}
.mk-panel--off { opacity: 0.65; }
.mk-panel-title {
  font-size: var(--sim-text-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sim-label-muted);
}
.mk-panel-off {
  font-size: var(--sim-text-md);
  color: var(--sim-label-muted);
  border: 2px dashed var(--sim-stroke);
  border-radius: var(--sim-radius-md);
  padding: var(--sim-space-2);
}
.mk-reading { display: flex; flex-direction: column; gap: var(--sim-space-1); min-width: 0; }
.mk-reading-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-2); }
.mk-reading-label { font-size: var(--sim-text-sm); color: var(--sim-label-muted); font-weight: 700; }
.mk-reading-value {
  font-size: var(--sim-text-xl);
  font-weight: 800;
  color: var(--sim-label);
  font-variant-numeric: tabular-nums;
}
.mk-row--testes .mk-reading-value { color: var(--sim-accent); }
.mk-deg { font-size: var(--sim-text-sm); font-weight: 700; margin-left: 1px; }
.mk-bar {
  height: 12px;
  border-radius: var(--sim-radius-pill);
  background: var(--sim-track);
  overflow: hidden;
}
.mk-bar-fill { display: block; height: 100%; border-radius: var(--sim-radius-pill); }
.mk-row--body .mk-bar-fill { background: var(--sim-series-2); }
.mk-row--testes .mk-bar-fill { background: var(--sim-accent); }
.mk-gap { font-size: var(--sim-text-sm); font-weight: 800; color: var(--sim-label-muted); }
.mk-gap[data-gap='apart'] { color: var(--sim-accent); }

.sim-dom-root--portrait .mk-frame { grid-template-columns: minmax(0, 1fr); }
`;