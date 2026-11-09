/**
 * ReproKit - the shared gamete drawings and the body-section geometry for L07.
 *
 * Three scenes must agree on what a gamete looks like, or the lesson quietly
 * teaches two different gametes:
 *
 *   - FemaleSystemScene   (blk-l07-s04) - the egg waiting inside one oviduct,
 *                         on a frontal cutaway, at a size where the egg is
 *                         visibly INSIDE the tube and not in the ovary.
 *   - GameteCompareScene  (blk-l07-s05) - the same egg and a plain sperm at one
 *                         shared scale, for the four comparison rows.
 *   - FertilisationScene  (blk-l07-s08) - the same egg, the same sperm, and the
 *                         single cell they make, big enough to read a nucleus.
 *   - FertilisationRouteGame (L07 arcade) - the same route geometry on canvas.
 *
 * So the egg is drawn ONCE here, at a unit size, and every scene scales it. The
 * egg is deliberately plain: a membrane ring, a stored-nutrient layer inside it,
 * and a nucleus that a scene opts into with `nucleus: true`. GameteCompareScene
 * must show no nucleus in either gamete before its chromosome strip appears, so
 * the nucleus is off by default rather than something that scene has to unpaint.
 *
 * The body-section geometry is exported as PLAIN DATA as well, because the
 * FertilisationRouteGame stub asks for the same route on a canvas SimScene,
 * where an SVG markup string is of no use.
 *
 * Rules the drawings keep to, from the stubs they were written against:
 *   - a sperm is a plain oval head and one long tail. No chromosomes are ever
 *     drawn inside the head unless a scene asks for the nucleus explicitly.
 *   - the egg carries no sperm, and nothing here is fertilised: there is no
 *     second cell, no fusion, no zygote state inside the egg.
 *   - no anatomy is named on a gamete. A gamete is not an ovary or a uterus.
 */

// The egg is drawn once in this box, centre at (0, 0), and every scene scales it.
export const EGG_UNIT_R = 20;

// The plain sperm, same deal: drawn once in a box, nose pointing right, tail
// trailing left. HEAD_L is the head's half-length along x.
export const SPERM_UNIT = { headL: 9, headH: 6.5, tailLen: 40 };

// ---------------------------------------------------------------- the egg

/**
 * The egg, as SVG markup centred on (0, 0) in EGG_UNIT_R-sized units.
 * o = { nucleus: boolean } - the nucleus is off by default (see the header).
 * The class names are prefixed so a scene can style it in its own namespace.
 */
export function eggSvg(o = {}) {
  const r = EGG_UNIT_R;
  const nucleus = o.nucleus ? `
      <circle class="${cls(o)}-nuc" cx="0" cy="0" r="${(r * 0.42).toFixed(1)}"/>` : '';
  return `<g class="${cls(o)}-egg">
    <circle class="${cls(o)}-mem" cx="0" cy="0" r="${r}"/>
    <circle class="${cls(o)}-nut" cx="0" cy="0" r="${(r * 0.74).toFixed(1)}"/>
    ${nucleus}
  </g>`;
}

// ---------------------------------------------------------------- the sperm

/**
 * A plain sperm: oval head, one long tail, nose to the right. `o.flip` mirrors
 * it so a scene can point it whichever way the route runs.
 */
export function spermSvg(o = {}) {
  const { headL, headH, tailLen } = SPERM_UNIT;
  const c = cls(o);
  return `<g class="${c}-sperm"${o.flip ? ' transform="scale(-1,1)"' : ''}>
    <path class="${c}-tail" d="M ${-headL} 0 C ${-headL - tailLen * 0.42} ${-headH * 1.1}, ${-headL - tailLen * 0.68} ${headH * 0.8}, ${-headL - tailLen} 0"/>
    <ellipse class="${c}-head" cx="0" cy="0" rx="${headL}" ry="${headH}"/>
  </g>`;
}

// ------------------------------------------------- the chromosome-pair chip

/**
 * A strip of small paired bars - the count made visible without a drawn cell.
 * `count` is the TOTAL of bars and is rounded down to whole pairs, so 23 and 46
 * both come out as pairs and nothing is drawn half-finished.
 */
export function chromosomeBarsSvg(count, o = {}) {
  const c = cls(o);
  const barW = o.barW ?? 3;
  const barH = o.barH ?? 18;
  const inner = o.inner ?? 2;      // gap inside one pair
  const outer = o.outer ?? 3;      // gap between pairs
  const pairs = Math.max(0, Math.floor(count / 2));
  if (!pairs) return '';
  const groupW = barW * 2 + inner + outer;
  const totalW = pairs * groupW - outer;
  let x = -totalW / 2;
  const bars = [];
  for (let i = 0; i < pairs; i += 1) {
    bars.push(`<rect class="${c}-bar" x="${x.toFixed(1)}" y="0" width="${barW}" height="${barH}" rx="${barW / 2}"/>`);
    bars.push(`<rect class="${c}-bar" x="${(x + barW + inner).toFixed(1)}" y="0" width="${barW}" height="${barH}" rx="${barW / 2}"/>`);
    x += groupW;
  }
  return `<g class="${c}-pairs" transform="translate(0,${-barH / 2})">${bars.join('')}</g>`;
}

// ------------------------------------------ the female body section (s04)

// The section's own box and centre line. Every other number below is read off
// this box, so a scene that scales the section scales all of it. The box is
// wider than the anatomy on purpose: the gutters are where the leader lines and
// the organ names go, so no name ever sits on the drawing it names.
export const FEMALE_SECTION = {
  cx: 170,
  w: 360,
  h: 342,
  // The viewBox starts below the top of the box: nothing is drawn above the
  // topmost organ name, and a scene that framed the whole box would shrink the
  // anatomy into the middle of its card.
  viewY0: 70,
  // Uterus: a pear-shaped chamber, thick wall, distinct lining band inside.
  uterus: { top: 126, bottom: 232, halfW: 40, wall: 13 },
  // Oviduct centreline, from the uterus corner out to the fringes, and the
  // point the fringes sit at. `s` is +1 for the drawing's right side, -1 left.
  tubeFrom: { x: 200, y: 144 },
  tubeCtl: [{ x: 224, y: 138 }, { x: 246, y: 120 }],
  tubeEnd: { x: 268, y: 102 },
  // Where the egg waits: on the tube centreline, a little inside the fringes.
  egg: { x: 253, y: 114, r: 7 },
  // Ovaries: ovals lying against the fringe ends.
  ovary: { cxOff: 112, cy: 120, rx: 12, ry: 16 },   // cx = cx +/- cxOff
  cervix: { y0: 232, y1: 258, halfW: 13 },
  vagina: { y0: 256, y1: 326, halfWTop: 16, halfWBottom: 18 },
};

/** Mirror a viewBox x about the section's centre line. `s` = +1 right, -1 left. */
export function mirrorX(x, s = 1) {
  const cx = FEMALE_SECTION.cx;
  return cx + s * (x - cx);
}

/** The centreline of one oviduct, as an SVG path `d`. Mirrored, never redrawn. */
export function oviductPathD(s = 1) {
  const { tubeFrom, tubeCtl, tubeEnd } = FEMALE_SECTION;
  return `M ${mirrorX(tubeFrom.x, s)} ${tubeFrom.y} C ${mirrorX(tubeCtl[0].x, s)} ${tubeCtl[0].y}, `
    + `${mirrorX(tubeCtl[1].x, s)} ${tubeCtl[1].y}, ${mirrorX(tubeEnd.x, s)} ${tubeEnd.y}`;
}

/** The same centreline as plain points, for a canvas scene that strokes a polyline. */
export function oviductPoints(s = 1) {
  const { tubeFrom, tubeCtl, tubeEnd } = FEMALE_SECTION;
  return [tubeFrom, tubeCtl[0], tubeCtl[1], tubeEnd].map((p) => ({ x: mirrorX(p.x, s), y: p.y }));
}

/** Where the egg sits on side `s` (+1 = the side drawn on the right). */
export function eggAt(s = 1) {
  const e = FEMALE_SECTION.egg;
  return { x: mirrorX(e.x, s), y: e.y, r: e.r };
}

/** Where one ovary sits on side `s`. */
export function ovaryAt(s = 1) {
  const o = FEMALE_SECTION.ovary;
  return { cx: mirrorX(FEMALE_SECTION.cx + o.cxOff, s), cy: o.cy, rx: o.rx, ry: o.ry };
}

/** Where the fringes sit on side `s` - the open end of the tube. */
export function fringeAt(s = 1) {
  return { x: mirrorX(FEMALE_SECTION.tubeEnd.x, s), y: FEMALE_SECTION.tubeEnd.y };
}

// Where the route leaves the uterus and enters the tube, and where it sits along
// the tube itself. Exported so a canvas scene strokes the same polyline.
export const ROUTE = {
  start: { x: FEMALE_SECTION.cx, y: 322 },              // the bottom of the vagina
  neck: { x: FEMALE_SECTION.cx, y: 242 },               // through the cervix
  chamber: { x: FEMALE_SECTION.cx, y: 208 },            // across the uterus
  enters: { x: FEMALE_SECTION.tubeFrom.x, y: FEMALE_SECTION.tubeFrom.y },
  along: [{ x: 222, y: 141 }, { x: 240, y: 127 }],
};

/**
 * The route line: up the vagina, through the cervix, across the uterus and out
 * along the tube on side `s`, ending at the egg. With `past`, it runs on out
 * through the open end of that tube and into nothing - the empty tube's dead end,
 * which has to go past the fringes or it reads as simply not drawn.
 */
export function routePathD(s = 1, o = {}) {
  const e = eggAt(s);
  const cx = FEMALE_SECTION.cx;
  const end = o.past ? fringeAt(s) : e;
  return `M ${ROUTE.start.x} ${ROUTE.start.y} L ${ROUTE.neck.x} ${ROUTE.neck.y} L ${ROUTE.chamber.x} ${ROUTE.chamber.y}`
    + ` C ${cx + 2} 186, ${cx + 12} 168, ${mirrorX(ROUTE.enters.x, s)} ${ROUTE.enters.y}`
    + ` C ${mirrorX(ROUTE.along[0].x, s)} ${ROUTE.along[0].y}, ${mirrorX(ROUTE.along[1].x, s)} ${ROUTE.along[1].y}, ${end.x} ${end.y}`
    + (o.past
      ? ` L ${(fringeAt(s).x + s * 20).toFixed(1)} ${(fringeAt(s).y - 19).toFixed(1)}`
      : '');
}

/** The route as plain points, for a canvas scene that strokes a polyline. */
export function routePoints(s = 1, o = {}) {
  const pts = [
    ROUTE.start,
    ROUTE.neck,
    ROUTE.chamber,
    { x: mirrorX(ROUTE.enters.x, s), y: ROUTE.enters.y },
    { x: mirrorX(ROUTE.along[0].x, s), y: ROUTE.along[0].y },
    { x: mirrorX(ROUTE.along[1].x, s), y: ROUTE.along[1].y },
  ];
  pts.push(o.past ? fringeAt(s) : eggAt(s));
  if (o.past) {
    const f = fringeAt(s);
    pts.push({ x: f.x + s * 20, y: f.y - 19 });
  }
  return pts;
}

/** The finger-like fringes at the open end of one tube, as SVG path data. */
export function fringePathD(s = 1) {
  const f = fringeAt(s);
  // They fan out around the direction that points at the ovary on this side.
  const base = s > 0 ? 0.70 : Math.PI - 0.70;      // radians, toward the ovary
  const spread = [-0.96, -0.48, 0, 0.48, 0.96];     // radians, about `base`
  const out = spread.map((d) => {
    const a = base + d * (s > 0 ? 1 : -1);
    const len = d === 0 ? 12 : 10;
    return `M ${f.x.toFixed(1)} ${f.y.toFixed(1)} L ${(f.x + Math.cos(a) * len).toFixed(1)} ${(f.y + Math.sin(a) * len).toFixed(1)}`;
  });
  return out.join(' ');
}

/** Tap targets, in viewBox units, tested in this order - the first that contains the point wins. */
export const FEMALE_HITS = [
  { key: 'oviduct', rects: [{ x: 188, y: 92, w: 92, h: 62 }, { x: 80, y: 92, w: 92, h: 62 }] },
  { key: 'ovary', rects: [{ x: 274, y: 100, w: 32, h: 42 }, { x: 54, y: 100, w: 32, h: 42 }] },
  { key: 'uterus', rects: [{ x: 128, y: 122, w: 84, h: 112 }] },
  { key: 'cervix', rects: [{ x: 152, y: 228, w: 36, h: 34 }] },
  { key: 'vagina', rects: [{ x: 148, y: 256, w: 44, h: 74 }] },
];

function cls(o) {
  return o.cls || 'rk';
}