/**
 * CrystalBenchKit.js - the shared bench, glassware and crystal drawing for this lesson.
 *
 * Written by CoolingBeakerScene (L03) and used by every later scene whose stub names it:
 *   L03/CoolingBeakerScene        bench, beaker, solid heap, graduated tube, solid tray, temp dial
 *   L03/CrystallizationRigScene   bench, beaker, solid heap
 *   L03/SaltPanScene              bench backdrop, crystal cluster
 *
 * WHAT THIS FILE IS FOR: three scenes of one lesson stand beakers, pans and watches on the same
 * bench, and a beaker with liquid and a heap of solid in it is the same drawing in all of them.
 * It is the ONE place that drawing lives.
 *
 * WHAT THIS FILE IS NOT: it holds no lesson state, no lesson vocabulary and no numbers that only
 * one slide may see. Every function is pure - it draws what it is handed and returns the geometry
 * it drew to, and the SCENE owns the model (temperatures, masses, which mount is showing). Nothing
 * here reads a beat, a stage or a control, and nothing here decides what a scene is allowed to say.
 *
 * HOUSE RULES EVERY EXPORT FOLLOWS (briefs/reference/scene-rules.md):
 *   - colours only from the `c` palette passed in, and mix/alpha/lighten/darken of them - never a hex
 *   - no Math.random(): anything scattered is mulberry32(seed), so the same seed draws the same scene
 *   - no text longer than a label, and labels are the caller's, passed in
 *
 * EXPORTS, in the order a scene meets them:
 *   drawCrystalBench(ctx, c, o)       the backdrop, floor and bench slab every scene stands on
 *   drawBeaker(ctx, c, o)             a glass beaker: walls, graduations, liquid, meniscus
 *   drawSolidHeap(ctx, c, o)          the pile of solid standing on the beaker's floor
 *   drawGraduatedTube(ctx, c, o)      a graduated tube on a retort stand, with a liquid level
 *   drawSolidTray(ctx, c, o)          a small empty tray to stand at the end of a bench
 *   drawCrystalCluster(ctx, c, x, y, r, o)   one clump of solid crystal pieces
 *   drawCrystalLattice(ctx, c, o)     solid crystal drawn as an ordered repeating lattice
 *   drawTempDial(ctx, c, o)           a round 0-80 deg dial with a pointer and tick marks
 *   dialGeometry(o)                   the same dial's geometry, so a scene can drag it
 *   solutionTone(c, o)                the deep blue of a solution, a touch cooler when hot
 *
 * COLOURS: solutionTone and every tone below are built from the palette the scene passes in, so a
 * scene that wants a different solution colour passes a different `tone` and nothing else changes.
 */
import {
  alpha, mix, lighten, darken, hslOf, hsl, font, mulberry32, rr,
  drawBackdrop, drawFloor, drawBench,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ------------------------------------------------------------------ the bench

/**
 * The backdrop, the floor and one bench slab to stand glassware on.
 * o: { x0, x1, y, floorY, style, col }
 *   x0, x1  the bench slab's left and right edges (default: the full canvas)
 *   y       the slab's TOP surface - everything stands with its base here
 *   floorY  where the room floor starts (default y + 96)
 * Returns { y, floorY, cx }.
 */
export function drawCrystalBench(ctx, c, o = {}) {
  const x0 = o.x0 ?? 20, x1 = o.x1 ?? 660, y = o.y ?? 396;
  const floorY = o.floorY ?? y + 96;
  drawBackdrop(ctx, c, o.style ?? 'dots');
  drawFloor(ctx, c, floorY);
  drawBench(ctx, c, x0, x1, y, { col: o.col, h: o.h ?? 58 });
  return { y, floorY, cx: (x0 + x1) / 2 };
}

// ------------------------------------------------------------------- the beaker

/**
 * A glass beaker, drawn empty or with liquid in it. The `fill` is the fraction of the INSIDE
 * height that liquid occupies; the caller decides what a fall in it means.
 * o: { x, y, w, h, fill, tone, glass, graduations, rim }
 *   x, y, w, h  the beaker's OUTER box; (x, y) is the TOP-left corner
 * Returns the inside geometry, so a scene can stand a heap on the returned floorY:
 *   { x, y, w, h, innerX, innerW, innerTop, floorY, liquidY, wall }
 */
export function drawBeaker(ctx, c, o = {}) {
  const x = o.x, y = o.y, w = o.w, h = o.h;
  const wall = o.wall ?? 7;
  const innerX = x + wall, innerW = w - wall * 2;
  const innerTop = y + 16;                    // the rim zone: liquid never rises above it
  const floorY = y + h - wall;
  const tone = o.tone ?? solutionTone(c);
  // The glass and liquid are the kit's (SimGlass), so every bench in the course shares one material.
  const g = glassBox('beaker', x, y, w, h, { wall, r: Math.min(w * 0.22, 16), spout: o.rim !== false });
  const n = o.graduations === false ? 0 : (o.graduations ?? 5);
  drawGlass(ctx, c, g, { shadow: false, ticks: n });
  const fill = clamp(o.fill ?? 1, 0, 1);
  const liquidY = floorY - (floorY - innerTop) * fill;
  if (fill > 0.01) drawGlassLiquid(ctx, c, g, { surface: liquidY, fill: tone, opacity: 0.82 });
  return { x, y, w, h, innerX, innerW, innerTop, floorY, liquidY, wall };
}

// ----------------------------------------------------------------- the solid heap

/**
 * The pile of solid standing on a floor: a mound of crystal chunks whose HEIGHT is the amount.
 * It is scattered, not ordered - the ordered lattice is drawCrystalLattice, and a scene that wants
 * both must ask for both.
 * o: { x, w, floorY, amount, maxAmount, seed, tone }
 *   amount / maxAmount  0..1 - how much solid there is. amount 0 draws nothing at all.
 * Returns the mound's height in px (0 when there is no solid), which is what a scene animates.
 */
export function drawSolidHeap(ctx, c, o = {}) {
  const amount = clamp(o.amount ?? 0, 0, 1);
  if (amount <= 0.005) return 0;
  const maxH = o.maxH ?? 54;
  const h = maxH * amount;
  const w = o.w ?? 120;
  const floorY = o.floorY;
  const x0 = o.x;
  const tone = o.tone ?? lighten(solutionTone(c), 0.2);
  const rnd = mulberry32(o.seed ?? 11);

  // The pile is built out of PACKED CHUNKS in rows, not as a smooth hill: a solid that has come
  // out of a solution is flat-faced pieces standing on each other, and a smooth mound reads as
  // sediment instead. Rows narrow as they rise, so the heap still has a pile's silhouette.
  const s = clamp(w / 6.5, 7, 17);                 // one chunk's side
  const rows = Math.max(1, Math.round(h / s));
  const base = Math.max(2, Math.round(w / s));
  ctx.save();
  for (let r = 0; r < rows; r += 1) {
    const f = rows === 1 ? 1 : r / (rows - 1);
    // the row count narrows as the pile rises, but by a wandering amount: an even taper reads
    // as a brick wall, which is the one thing a heap of solid must not look like
    const n = Math.max(1, Math.round(base * (1 - f * 0.5) + (rnd() * 2.4 - 1.2)));
    const rowW = n * s;
    const x1 = x0 + (w - rowW) / 2 + (rnd() * s - s / 2) * 0.22;
    const yb = floorY - r * s;
    for (let i = 0; i < n; i += 1) {
      // each chunk is jittered in place, size and tilt, so no two rows line up; the jitter is
      // clamped inside the pile's own width so the heap cannot lean out of its own footprint
      const jx = clamp(x1 + i * s + (rnd() * s - s / 2) * 0.4, x0 + s * 0.4, x0 + w - s * 0.4);
      const jy = yb + (rnd() * s - s / 2) * 0.3;
      const k = 0.8 + rnd() * 0.4;                // per-chunk brightness
      chunk(ctx, c, jx, jy, s * (0.76 + rnd() * 0.34), (rnd() - 0.5) * 0.6, tone, k);
    }
  }
  // a few loose pieces standing proud of the crown, so the top edge is not a straight line
  const loose = 1 + Math.round(amount * 3);
  for (let i = 0; i < loose; i += 1) {
    chunk(ctx, c, x0 + w * (0.24 + rnd() * 0.52), floorY - rows * s + s * 0.3,
      s * (0.5 + rnd() * 0.3), (rnd() - 0.5) * 0.5, tone, 0.9 + rnd() * 0.3);
  }
  ctx.restore();
  return h;
}

/**
 * One flat-faced crystal chunk: a square body with a lit top face and a shaded right face, so a
 * pile of them has edges and shadows instead of being one silhouette.
 * (x, y) is the chunk's CENTRE; s is its side; rot tilts it; tone is its colour; k its brightness.
 */
function chunk(ctx, c, x, y, s, rot, tone, k = 1) {
  // Three flat faces with real separation between them: a shaded body, a lit top and a dark
  // outline. Chunks that sit against a body of liquid of their own colour only read as separate
  // pieces if the faces differ enough, which a single flat colour does not do.
  const body = mix(darken(tone, 0.42), tone, clamp(k - 0.85, 0, 0.35));
  const top = lighten(tone, 0.34 + k * 0.16);
  const edge = darken(tone, 0.55);
  const h = s / 2;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-h, -h * 0.2);
  ctx.lineTo(h, -h * 0.2);
  ctx.lineTo(h, h);
  ctx.lineTo(-h, h);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  // the lit top face
  ctx.beginPath();
  ctx.moveTo(-h, -h * 0.2);
  ctx.lineTo(h, -h * 0.2);
  ctx.lineTo(h * 0.7, -h * 0.92);
  ctx.lineTo(-h * 0.7, -h * 0.92);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-h, -h * 0.2);
  ctx.lineTo(h, -h * 0.2);
  ctx.lineTo(h, h);
  ctx.lineTo(-h, h);
  ctx.closePath();
  ctx.strokeStyle = alpha(edge, 0.85);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-h, -h * 0.2);
  ctx.lineTo(-h * 0.7, -h * 0.92);
  ctx.lineTo(h * 0.7, -h * 0.92);
  ctx.lineTo(h, -h * 0.2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- the crystal pieces

/**
 * One clump of solid crystal pieces - flat-faced chunks with a lit top face and a shaded side.
 * Reusable anywhere solid is drawn (a heap, a pan's bed, a watch glass).
 * (x, y) is the clump's CENTRE; r is its outer radius.
 * o: { seed, tone, count }
 */
export function drawCrystalCluster(ctx, c, x, y, r, o = {}) {
  const tone = o.tone ?? lighten(solutionTone(c), 0.2);
  const rnd = mulberry32(o.seed ?? 3);
  const n = o.count ?? 3;
  ctx.save();
  for (let i = 0; i < n; i += 1) {
    const a = rnd() * Math.PI * 2;
    const d = i === 0 ? 0 : r * (0.35 + rnd() * 0.4);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.55;
    const s = r * (i === 0 ? 1 : 0.55 + rnd() * 0.3);
    const rot = rnd() * 0.7 - 0.35;
    // a flat-faced chunk: a square body with a lit top parallelogram
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.55);
    ctx.lineTo(s, s * 0.55);
    ctx.lineTo(s * 0.86, -s * 0.6);
    ctx.lineTo(-s * 0.86, -s * 0.6);
    ctx.closePath();
    ctx.fillStyle = darken(tone, 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.86, -s * 0.6);
    ctx.lineTo(s * 0.86, -s * 0.6);
    ctx.lineTo(s * 0.66, -s * 1.05);
    ctx.lineTo(-s * 0.66, -s * 1.05);
    ctx.closePath();
    ctx.fillStyle = lighten(tone, 0.3);
    ctx.fill();
    ctx.strokeStyle = alpha(darken(tone, 0.45), 0.7);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Solid crystal as an ORDERED lattice: neat regular rows of particles, the picture of a repeating
 * pattern. A picture only - no label, no caption, no explanation is drawn here.
 * o: { x, y, w, h, cols, rows, tone, seed }
 * Returns { x, y, w, h, step } so a scene can point at it (a leader, a ring) without measuring.
 */
export function drawCrystalLattice(ctx, c, o = {}) {
  const x = o.x, y = o.y, w = o.w, h = o.h;
  const cols = o.cols ?? 6, rows = o.rows ?? 4;
  const tone = o.tone ?? lighten(solutionTone(c), 0.28);
  const step = Math.min(w / cols, h / rows);
  const r = Math.min(step * 0.34, 11);
  ctx.save();
  // the bounding box is the scene's card, not a drawn frame: nothing is stroked here
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const px = x + step * (i + 0.5);
      const py = y + step * (j + 0.5);
      // a cushion shade: a lit upper-left face and a shaded lower-right one, so order reads
      ctx.beginPath();
      ctx.arc(px - r * 0.22, py - r * 0.22, r * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = lighten(tone, 0.34);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + r * 0.2, py + r * 0.2, r * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = mix(tone, c.raised, 0.12);
      ctx.fill();
      // the connecting rods of a repeating grid, drawn behind nothing and over everything
      if (i < cols - 1) {
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.lineTo(px + step - r, py);
        ctx.strokeStyle = alpha(darken(tone, 0.3), 0.4);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (j < rows - 1) {
        ctx.beginPath();
        ctx.moveTo(px, py + r);
        ctx.lineTo(px, py + step - r);
        ctx.strokeStyle = alpha(darken(tone, 0.3), 0.4);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  return { x, y, w, h, step };
}

// --------------------------------------------------------------- the graduated tube

/**
 * A graduated tube standing in a retort-stand clamp: a glass column with graduation ticks and a
 * liquid level. The level is the scene's to set; the band it is read against is the scene's too,
 * and the ticks are drawn UNNUMBERED unless the caller passes `tickLabels`.
 * o: { x, y, w, h, level, tone, stand, tickLabels, label }
 *   x, y, w, h  the tube's OUTER box, (x, y) top-left; `y` is where the clamp hangs it
 *   level        0..1, the fraction of the tube's inside height that is filled
 * Returns { x, y, w, h, innerX, innerW, innerTop, floorY, liquidY }.
 */
export function drawGraduatedTube(ctx, c, o = {}) {
  const x = o.x, y = o.y, w = o.w, h = o.h;
  const wall = o.wall ?? 6;
  const innerX = x + wall, innerW = w - wall * 2;
  const innerTop = y + 10, floorY = y + h - wall;
  const tone = o.tone ?? solutionTone(c);
  const glass = lighten(c.glass, 0.15);

  if (o.stand !== false) {
    // the retort stand: a heavy foot on the bench, an upright rod, a clamp ring on the tube
    const rodX = x + w + 26;
    const standBase = floorY + 8;
    ctx.save();
    rr(ctx, rodX - 26, standBase - 10, 56, 12, 5);
    ctx.fillStyle = darken(c.gold, 0.42);
    ctx.fill();
    ctx.fillRect(rodX - 3, y - 26, 6, standBase - y + 26);
    ctx.fillStyle = darken(c.gold, 0.5);
    ctx.fill();
    ctx.fillStyle = lighten(c.gold, 0.05);
    ctx.fillRect(rodX - 3, y - 26, 2.5, standBase - y + 26);
    // the clamp: a short arm from the rod to a ring round the tube
    const clampY = y + h * 0.16;
    ctx.fillStyle = darken(c.gold, 0.34);
    ctx.fillRect(x + w - 2, clampY - 4, rodX - x - w + 2, 8);
    ctx.beginPath();
    ctx.ellipse(x + w / 2, clampY + 6, w / 2 + 3, 7, 0, 0, Math.PI);
    ctx.strokeStyle = darken(c.gold, 0.3);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  // the column and its liquid: the kit's glass (SimGlass), as the beaker beside it
  const g = glassBox('cylinder', x, innerTop, w, floorY - innerTop + wall, { wall, r: 7 });
  drawGlass(ctx, c, g, { shadow: false });
  const level = clamp(o.level ?? 0, 0, 1);
  const liquidY = floorY - (floorY - innerTop) * level;
  if (level > 0.01) drawGlassLiquid(ctx, c, g, { surface: liquidY, fill: tone, opacity: 0.85 });

  // graduation ticks up the right inside wall; labels only when the scene passes them
  const n = o.ticks ?? 8;
  ctx.strokeStyle = alpha(glass, 0.65);
  ctx.lineWidth = 1.5;
  for (let i = 1; i < n; i += 1) {
    const ty = floorY - ((floorY - innerTop) * i) / n;
    const long = i % 2 === 0;
    ctx.beginPath();
    ctx.moveTo(x + w - wall - 2, ty);
    ctx.lineTo(x + w - wall - 2 - (long ? 15 : 8), ty);
    ctx.stroke();
    const lab = o.tickLabels?.[i - 1];
    if (lab != null && long) {
      ctx.font = font(c, 700, 12);
      ctx.fillStyle = alpha(c.labelMuted, 0.95);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(lab), x + w - wall - 20, ty);
    }
  }
  ctx.restore();

  return { x, y, w, h, innerX, innerW, innerTop, floorY, liquidY };
}

// ---------------------------------------------------------------------- the solid tray

/**
 * A small shallow tray, the place a heap of solid is put. `fill` is 0..1: 0 is the bare tray, and
 * anything more stands a low mound of the same crystal in it.
 * o: { x, y, w, h, fill, tone, seed }   (x, y) is the tray's TOP-LEFT; `y` is its rim line.
 * Returns { x, y, w, h, cx, floorY }.
 */
export function drawSolidTray(ctx, c, o = {}) {
  const x = o.x, y = o.y, w = o.w, h = o.h ?? 26;
  const tone = o.tone ?? lighten(solutionTone(c), 0.2);
  const fill = clamp(o.fill ?? 0, 0, 1);
  const innerH = h - 8;
  ctx.save();
  // the dish: a rim ellipse and a body under it, both in one glass tone
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + innerH * 0.5, w / 2, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = mix(c.raised, c.glass, 0.35);
  ctx.fill();
  ctx.strokeStyle = darken(c.glass, 0.1);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + innerH * 0.5 - 3, w / 2 - 6, h * 0.5 - 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = mix(c.bgDeep, c.raised, 0.5);
  ctx.fill();

  if (fill > 0.01) {
    const mh = (h * 0.5 - 6) * 2 * fill;
    const fx = x + w / 2, fy = y + innerH * 0.5;
    ctx.beginPath();
    ctx.ellipse(fx, fy - mh * 0.25, (w / 2 - 8) * (0.5 + fill * 0.5), mh * 0.42, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = darken(tone, 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(fx, fy - mh * 0.32, (w / 2 - 8) * (0.5 + fill * 0.5) * 0.7, mh * 0.26, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = lighten(tone, 0.2);
    ctx.fill();
  }
  ctx.restore();
  return { x, y, w, h, cx: x + w / 2, floorY: y + innerH * 0.5 };
}

// ------------------------------------------------------------------------ the dial

// One shared sweep for every round dial in the kit: 270 degrees, low left round the top to low right.
const DIAL_A0 = Math.PI * 0.75;
const DIAL_SWEEP = Math.PI * 1.5;

/**
 * A round dial: a face, tick marks, a pointer, and the value at the hub. 0 is at the low left and
 * max is at the low right, so the numbers climb clockwise the way a control is read.
 * o: { cx, cy, r, min, max, value, label, unit, ticks, tone }
 * Returns the same geometry drawTempDial drew to.
 */
export function drawTempDial(ctx, c, o = {}) {
  const g = dialGeometry(o);
  const face = mix(c.raised, c.bgDeep, 0.3);
  const ring = lighten(c.stroke, 0.1);
  ctx.save();
  // the face
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = alpha(ring, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();

  // the tick marks: one per 10 units, taller every other
  const n = o.ticks ?? 8;
  for (let i = 0; i <= n; i += 1) {
    const a = DIAL_A0 + (DIAL_SWEEP * i) / n;
    const long = i % 2 === 0;
    const r0 = g.r - (long ? 14 : 8), r1 = g.r - 4;
    ctx.beginPath();
    ctx.moveTo(g.cx + Math.cos(a) * r0, g.cy + Math.sin(a) * r0);
    ctx.lineTo(g.cx + Math.cos(a) * r1, g.cy + Math.sin(a) * r1);
    ctx.strokeStyle = alpha(c.labelMuted, long ? 0.9 : 0.5);
    ctx.lineWidth = long ? 2 : 1.5;
    ctx.stroke();
  }

  // the value arc from the low-left start round to the pointer
  const va = g.angleOf(o.value ?? g.min);
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.r - 18, DIAL_A0, va);
  ctx.strokeStyle = alpha(o.tone ?? c.accent, 0.55);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // the pointer: a needle from the hub out to just inside the ticks
  ctx.beginPath();
  ctx.moveTo(g.cx - Math.cos(va) * 10, g.cy - Math.sin(va) * 10);
  ctx.lineTo(g.cx + Math.cos(va) * (g.r - 12), g.cy + Math.sin(va) * (g.r - 12));
  ctx.strokeStyle = o.tone ?? c.accent;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = darken(o.tone ?? c.accent, 0.25);
  ctx.fill();

  // the value under the hub, big enough to read, small enough to stay a reading and not a sentence
  const v = o.value ?? g.min;
  ctx.font = font(c, 800, 22, true);
  ctx.fillStyle = c.label;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(v)}`, g.cx, g.cy + g.r * 0.42);
  if (o.unit) {
    ctx.font = font(c, 700, 12);
    ctx.fillStyle = c.labelMuted;
    ctx.fillText(o.unit, g.cx, g.cy + g.r * 0.42 + 16);
  }
  // the end labels: min at the low left, max at the low right
  ctx.font = font(c, 700, 12);
  ctx.fillStyle = c.labelMuted;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(g.min), g.cx - g.r * 0.74, g.cy + g.r * 0.8);
  ctx.fillText(String(g.max), g.cx + g.r * 0.74, g.cy + g.r * 0.8);
  if (o.label) {
    ctx.font = font(c, 800, 13);
    ctx.fillStyle = c.labelMuted;
    ctx.fillText(o.label, g.cx, g.cy - g.r - 12);
  }
  ctx.restore();
  return g;
}

/**
 * The SAME dial's geometry, so a scene can hit-test and drag it without measuring the drawing.
 * o: { cx, cy, r, min, max }
 * Returns { cx, cy, r, min, max, angleOf(value), valueAt(px, py), hit(px, py) }:
 *   angleOf  value -> canvas radians
 *   valueAt  a point -> the value the pointer is over, clamped into [min, max]
 *   hit      is a point on the dial face (a slightly generous radius, for a thumb)
 */
export function dialGeometry(o = {}) {
  const cx = o.cx, cy = o.cy, r = o.r;
  const min = o.min ?? 0, max = o.max ?? 80;
  const span = max - min || 1;
  return {
    cx, cy, r, min, max,
    angleOf: (v) => DIAL_A0 + (DIAL_SWEEP * (clamp(v, min, max) - min)) / span,
    valueAt(px, py) {
      let a = Math.atan2(py - cy, px - cx);
      if (a < DIAL_A0 - Math.PI) a += Math.PI * 2;      // fold the bottom gap onto the ends
      const t = (a - DIAL_A0) / DIAL_SWEEP;
      return min + clamp(t, 0, 1) * span;
    },
    hit(px, py) { return Math.hypot(px - cx, py - cy) <= r + 12; },
  };
}

/**
 * The deep blue of a solution, built from the palette. `heat` is 0 (cold) to 1 (hot) and moves the
 * tone only along the water token's own hue - darker and a shade more saturated when cold, lighter
 * when hot - because drifting off the hue is what turns a deep blue solution into grey-green in one
 * of the two themes. Never a hex: a scene in either theme gets its colour from its own tokens.
 */
export function solutionTone(c, o = {}) {
  const heat = clamp(o.heat ?? 0, 0, 1);
  const cold = darken(saturate(c.water, 0.3), 0.28);
  const hot = lighten(c.water, 0.12);
  return mix(cold, hot, heat);
}

/** Push a colour's saturation up by k (0..1), leaving its hue and lightness alone. */
function saturate(col, k) {
  const { h, s, l } = hslOf(col);
  return hsl(h, clamp(s + k * (1 - s), 0, 1), l, 1);
}
