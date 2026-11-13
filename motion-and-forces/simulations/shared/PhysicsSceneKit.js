import { SimDraw } from 'simulations/base/SimDrawUtils.js';

/**
 * PhysicsSceneKit — shared drawing vocabulary for this course's motion/force
 * simulations (L01-L16, all subjects `science.motion`/`science.force`).
 *
 * Adapts the platform's Kurzgesagt visual language
 * (docs/sprints/completed/kurzgesagt-simulation-visual-language.md — written
 * for the biology `OrganelleZoomSimulation` scenes, but §3's shape/color/
 * motion rules are subject-agnostic) to physics: flat fills, two-tone
 * shading via `SimDraw.shade()`, no gradients/shadowBlur on structural
 * fills, silhouette-first shapes, consistent stroke weights. Every scene in
 * this bundle should build its people/vehicles/forces from these primitives
 * instead of ad hoc rectangles-with-a-label, both for visual quality and so
 * every scene in the chapter reads as one consistent world.
 *
 * Process-first discipline still applies per scene (see the Kurzgesagt doc
 * §2): before drawing, each scene should still be able to state in one
 * sentence what invisible mechanism it exists to make obvious. This kit
 * only supplies the vocabulary; it doesn't replace that discipline.
 *
 * Every helper takes already-resolved colors (hex strings from a scene's
 * own `readSimColors()`), never a raw `var(...)` — canvas can't resolve CSS
 * custom properties. `FORCE_COLORS` below is the one exception: it's a
 * fixed semantic palette (force *kind* is simulation semantics, not app
 * theme — same precedent as `OsmosisScene`'s `MODE_THEMES`), reused as
 * fallback values inside each scene's own `COLOR_TOKEN_MAP` so a future
 * central `--sim-force-*` token migration is a value swap, not a rewrite.
 */

/** Fixed semantic force-vector palette — same force kind, same color, in
 *  every scene in this chapter. Length of a drawn arrow should scale with
 *  the force's actual magnitude (see `drawForceArrow`'s `magnitude`/`scale`
 *  options) so "equal and opposite" pairs are visually equal, not just
 *  labeled equal. */
export const FORCE_COLORS = {
  applied:  '#38bdf8', // cyan — the force being actively studied/applied
  reaction: '#f472b6', // pink — the third-law reaction partner of `applied`
  friction: '#fb923c', // orange — resists relative motion
  gravity:  '#a78bfa', // violet — weight
  normal:   '#2dd4bf', // teal — surface push-back
  tension:  '#facc15', // yellow — rope/string/spring pull
  netGood:  '#34d399', // green — net force / outcome that matches the lesson's point
  netBad:   '#f87171', // red — net force / outcome that's the counterexample
  muted:    '#94a3b8',
};

/** Shared corner-radius / stroke-weight scale, per the Kurzgesagt doc §3.1 —
 *  don't pick arbitrary values per shape. */
export const STROKE = { fine: 2, boundary: 2.75, primary: 4 };
export const RADIUS = { chip: 7, panel: 10, stadium: 999 };

// ── Ground / surfaces ───────────────────────────────────────────────────

/**
 * A ground/track/table line with a texture that reads its physical kind at
 * a glance (the silhouette-test from the Kurzgesagt doc, applied to
 * surfaces): `kind: 'solid'` (default, short 45° hatch ticks — the standard
 * technical-diagram "this is fixed ground" convention), `'ice'` (flat pale
 * fill + a couple of short diagonal "shine" strokes, no hatching — reads as
 * slick rather than gripped), `'rough'` (denser, irregular hatch spacing —
 * reads as high-friction), or `'table'` (a filled band under the line, for
 * a tabletop rather than open ground).
 */
export function drawGround(ctx, x0, x1, y, colors, opts = {}) {
  const kind = opts.kind || 'solid';
  const lineColor = opts.color || colors.muted;
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = STROKE.primary;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();

  if (kind === 'table') {
    ctx.fillStyle = SimDraw.withAlpha(lineColor, 0.12);
    ctx.fillRect(x0, y, x1 - x0, 18);
  } else if (kind === 'ice') {
    ctx.strokeStyle = SimDraw.withAlpha('#7dd3fc', 0.55);
    ctx.lineWidth = STROKE.fine;
    for (let x = x0 + 30; x < x1 - 10; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x + 26, y + 4);
      ctx.stroke();
    }
  } else {
    const spacing = kind === 'rough' ? 11 : 16;
    ctx.strokeStyle = SimDraw.withAlpha(lineColor, 0.45);
    ctx.lineWidth = STROKE.fine;
    for (let x = x0; x < x1; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x - 7, y + 13);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── People ───────────────────────────────────────────────────────────────

/**
 * A flat, Kurzgesagt-style figure — circle head, capsule (thick rounded-cap
 * stroke) torso/limbs. No facial detail beyond an implied gaze via head
 * offset; identity comes from pose, not decoration.
 *
 * @param {number} x,y - ground contact point (feet), the pivot everything
 *   else is measured from
 * @param {object} opts
 *   scale=1, color, shade (defaults to SimDraw.shade(color,-0.22)),
 *   facing=1 (1 right, -1 left),
 *   lean=0 (radians; torso+head tilt about the hip pivot — THE primary
 *     device for inertia/lurch scenes: a rider's body lean lagging or
 *     leading the vehicle's own motion is what makes inertia visible),
 *   armPose='hang' | 'overhead-grip' | 'out-balance' | 'push' | 'raise',
 *   legPose='stand' | 'walk' (phase 0..1 via `legPhase`) | 'brace',
 *   legPhase=0
 */
export function drawPerson(ctx, x, y, opts = {}) {
  const s = opts.scale ?? 1;
  const facing = opts.facing ?? 1;
  const color = opts.color || '#e2e8f0';
  const shade = opts.shade || SimDraw.shade(color, -0.22);
  const lean = opts.lean || 0;
  const armPose = opts.armPose || 'hang';
  const legPose = opts.legPose || 'stand';
  const legPhase = opts.legPhase || 0;

  const HIP_Y = y - 34 * s;
  const SHOULDER_Y = HIP_Y - 30 * s;
  const HEAD_R = 10 * s;
  const HEAD_Y = SHOULDER_Y - HEAD_R - 2 * s;

  // The whole figure leans as one rigid shape, pivoting at the feet (x, y)
  // — the simplest honest reading of "a rider's body keeps its old motion
  // while the vehicle under their feet changes speed": feet stay planted at
  // the pivot, everything above tips relative to them. This is the primary
  // device for inertia/lurch scenes — see `lean` above.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.translate(-x, -y);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  _drawLegs(ctx, x, HIP_Y, y, s, shade, facing, legPose, legPhase);

  // torso
  ctx.strokeStyle = color;
  ctx.lineWidth = 13 * s;
  ctx.beginPath();
  ctx.moveTo(x, HIP_Y);
  ctx.lineTo(x, SHOULDER_Y);
  ctx.stroke();

  // arms
  _drawArms(ctx, x, SHOULDER_Y, s, shade, facing, armPose);

  // head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + facing * 1.5 * s, HEAD_Y, HEAD_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function _drawLegs(ctx, x, hipY, groundY, s, color, facing, pose, phase) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 11 * s;
  const spread = pose === 'brace' ? 16 * s : 6 * s;
  if (pose === 'walk') {
    const swing = Math.sin(phase * Math.PI * 2) * 18 * s;
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x + swing, groundY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x - swing, groundY);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x - spread, groundY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x + spread, groundY);
    ctx.stroke();
  }
}

function _drawArms(ctx, x, shoulderY, s, color, facing, pose) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 9 * s;
  const L = 26 * s;
  if (pose === 'overhead-grip') {
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + facing * 10 * s, shoulderY - L); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x - facing * 6 * s, shoulderY + 8 * s); ctx.stroke();
  } else if (pose === 'out-balance') {
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + 22 * s, shoulderY - 4 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x - 22 * s, shoulderY - 4 * s); ctx.stroke();
  } else if (pose === 'push') {
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + facing * L, shoulderY + 2 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x - facing * 4 * s, shoulderY + 10 * s); ctx.stroke();
  } else if (pose === 'raise') {
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + facing * 12 * s, shoulderY - L); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x - facing * 8 * s, shoulderY + 12 * s); ctx.stroke();
  } else { // hang
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + 8 * s, shoulderY + L); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x - 8 * s, shoulderY + L); ctx.stroke();
  }
}

// ── Vehicles ─────────────────────────────────────────────────────────────

/**
 * A flat bus/car body on two visibly-spoked wheels. `wheelAngle` (radians)
 * lets a scene tie visible wheel rotation to actual displacement
 * (`wheelAngle += dx / wheelRadius`) instead of a vehicle that slides
 * without its wheels turning — a small detail that's the difference between
 * "moving" and "sliding like a sticker."
 *
 * @param {number} x,y - ground contact point (bottom-center of the wheels)
 * @param {object} opts
 *   type='bus'|'car', scale=1, color, shade, facing=1, wheelAngle=0,
 *   speedLines=false (draws a few trailing horizontal dashes behind the
 *     vehicle when it's moving fast enough that "wheel spin alone" under-
 *     sells the speed)
 */
export function drawVehicle(ctx, x, y, opts = {}) {
  const s = opts.scale ?? 1;
  const type = opts.type || 'bus';
  const color = opts.color || '#38bdf8';
  const shade = opts.shade || SimDraw.shade(color, -0.22);
  const facing = opts.facing ?? 1;
  const wheelAngle = opts.wheelAngle || 0;
  const wheelR = (type === 'bus' ? 16 : 14) * s;
  const bodyW = (type === 'bus' ? 190 : 140) * s;
  const bodyH = (type === 'bus' ? 78 : 46) * s;
  const bodyY = y - wheelR * 1.1 - bodyH;
  const bodyX = x - bodyW / 2;

  ctx.save();

  if (opts.speedLines) {
    ctx.strokeStyle = SimDraw.withAlpha(color, 0.35);
    ctx.lineWidth = 3 * s;
    for (let i = 0; i < 3; i++) {
      const ly = bodyY + bodyH * 0.3 + i * bodyH * 0.25;
      ctx.beginPath();
      ctx.moveTo(bodyX - facing * (26 + i * 14) * s, ly);
      ctx.lineTo(bodyX - facing * (8 + i * 14) * s, ly);
      ctx.stroke();
    }
  }

  // body — flat fill, two-tone shade on lower third (Kurzgesagt "one hard
  // shadow band", not a gradient)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, type === 'bus' ? 14 * s : 18 * s);
  ctx.fill();
  ctx.fillStyle = SimDraw.withAlpha(shade, 0.9);
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY + bodyH * 0.62, bodyW, bodyH * 0.38, { tl: 0, tr: 0, br: type === 'bus' ? 14 * s : 18 * s, bl: type === 'bus' ? 14 * s : 18 * s });
  ctx.fill();
  ctx.strokeStyle = shade;
  ctx.lineWidth = STROKE.boundary;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, type === 'bus' ? 14 * s : 18 * s);
  ctx.stroke();

  // windows
  const winColor = '#e0f2fe';
  const winCount = type === 'bus' ? 4 : 2;
  const winW = (bodyW * 0.62) / winCount - 4 * s;
  const winH = bodyH * 0.32;
  const winY = bodyY + bodyH * 0.14;
  const winX0 = bodyX + bodyW * (type === 'bus' ? 0.1 : 0.16);
  ctx.fillStyle = SimDraw.withAlpha(winColor, 0.9);
  for (let i = 0; i < winCount; i++) {
    ctx.beginPath();
    ctx.roundRect(winX0 + i * (winW + 6 * s), winY, winW, winH, 4 * s);
    ctx.fill();
  }

  // wheels
  _drawWheel(ctx, bodyX + bodyW * 0.24, y - wheelR * 0.15, wheelR, wheelAngle, shade);
  _drawWheel(ctx, bodyX + bodyW * 0.76, y - wheelR * 0.15, wheelR, wheelAngle, shade);

  // brake light — a small glow (this one earns the exception in the
  // Kurzgesagt doc's "gradients/blur are earned, not default" rule: it
  // represents a literal light source, not decoration) at whichever end is
  // the rear given `facing`
  if (opts.brakeLight) {
    const lightX = facing >= 0 ? bodyX + bodyW - 6 * s : bodyX + 6 * s;
    const lightY = bodyY + bodyH * 0.5;
    SimDraw.drawGlow(ctx, lightX, lightY, 10 * s, '#ef4444', 0.55);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(lightX, lightY, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function _drawWheel(ctx, x, y, r, angle, color) {
  ctx.save();
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE.fine;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  // two spokes, rotating — the actual "is this wheel turning" tell
  for (let i = 0; i < 2; i++) {
    const a = angle + i * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * r * 0.5, y - Math.sin(a) * r * 0.5);
    ctx.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

/** A simple flatbed cart/trolley — for f=ma-cart-style scenes where the
 *  full bus/car silhouette would be the wrong register (a lab cart, not a
 *  vehicle). Same wheel-rotation contract as `drawVehicle`. */
export function drawCart(ctx, x, y, opts = {}) {
  const s = opts.scale ?? 1;
  const color = opts.color || '#38bdf8';
  const shade = opts.shade || SimDraw.shade(color, -0.22);
  const w = (opts.width ?? 120) * s;
  const h = (opts.height ?? 46) * s;
  const wheelR = 11 * s;
  const bodyY = y - wheelR * 1.2 - h;
  const bodyX = x - w / 2;

  ctx.save();
  ctx.fillStyle = SimDraw.withAlpha(color, 0.28);
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE.boundary;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, w, h, 8 * s);
  ctx.fill();
  ctx.stroke();
  // deck line for "flatbed" read
  ctx.strokeStyle = SimDraw.withAlpha(shade, 0.7);
  ctx.lineWidth = STROKE.fine;
  ctx.beginPath();
  ctx.moveTo(bodyX + 6 * s, bodyY + 6 * s);
  ctx.lineTo(bodyX + w - 6 * s, bodyY + 6 * s);
  ctx.stroke();

  _drawWheel(ctx, bodyX + w * 0.22, y - wheelR * 0.15, wheelR, opts.wheelAngle || 0, shade);
  _drawWheel(ctx, bodyX + w * 0.78, y - wheelR * 0.15, wheelR, opts.wheelAngle || 0, shade);
  ctx.restore();
}

// ── Instruments ──────────────────────────────────────────────────────────

/**
 * A spring balance / newton-meter: coiled spring, case with a numeric
 * scale, a needle. `reading`/`maxReading` drive both the needle angle and
 * the spring's visible stretch, so "the spring stretches more" and "the
 * needle reads higher" are the same underlying number, not two separate
 * animations that could drift out of sync.
 */
export function drawSpringBalance(ctx, x, y, opts = {}) {
  const s = opts.scale ?? 1;
  const reading = opts.reading ?? 0;
  const maxReading = opts.maxReading ?? 10;
  const frac = Math.max(0, Math.min(1, reading / maxReading));
  const color = opts.color || '#fbbf24';
  const caseColor = opts.caseColor || '#1e293b';
  const label = opts.unit || 'N';
  const vertical = opts.orientation !== 'horizontal';

  ctx.save();
  const caseLen = (opts.caseLength ?? 90) * s;
  const caseW = (opts.caseWidth ?? 34) * s;
  const springLen = (opts.springLength ?? 40) * s * (0.6 + frac * 0.8);

  if (vertical) {
    // spring coil above the case
    ctx.strokeStyle = color;
    ctx.lineWidth = STROKE.boundary;
    ctx.beginPath();
    const coilTop = y - springLen;
    const coils = 6;
    for (let i = 0; i <= coils; i++) {
      const cy = coilTop + (springLen * i) / coils;
      const cx = x + (i % 2 === 0 ? -10 * s : 10 * s);
      if (i === 0) ctx.moveTo(x, cy); else ctx.lineTo(cx, cy);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    // case
    ctx.fillStyle = caseColor;
    ctx.strokeStyle = SimDraw.shade(caseColor, 0.5);
    ctx.lineWidth = STROKE.fine;
    ctx.beginPath();
    ctx.roundRect(x - caseW / 2, y, caseW, caseLen, 6 * s);
    ctx.fill();
    ctx.stroke();

    // scale ticks + reading fill bar
    const barX = x - caseW / 2 + 8 * s;
    const barH = caseLen - 16 * s;
    const barY = y + 8 * s;
    ctx.strokeStyle = SimDraw.withAlpha('#e2e8f0', 0.5);
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 5; i++) {
      const ty = barY + barH - (barH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(barX, ty);
      ctx.lineTo(barX + caseW - 16 * s, ty);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY + barH * (1 - frac), caseW - 16 * s, barH * frac);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `700 ${12 * s}px Inter, system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(`${reading.toFixed(1)} ${label}`, x, y + caseLen + 20 * s);
  } else {
    const coilLen = springLen;
    ctx.strokeStyle = color;
    ctx.lineWidth = STROKE.boundary;
    ctx.beginPath();
    const coils = 6;
    const startX = x - coilLen;
    for (let i = 0; i <= coils; i++) {
      const cx = startX + (coilLen * i) / coils;
      const cy = y + (i % 2 === 0 ? -9 * s : 9 * s);
      if (i === 0) ctx.moveTo(startX, y); else ctx.lineTo(cx, cy);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = caseColor;
    ctx.strokeStyle = SimDraw.shade(caseColor, 0.5);
    ctx.lineWidth = STROKE.fine;
    ctx.beginPath();
    ctx.roundRect(x, y - caseW / 2, caseLen, caseW, 6 * s);
    ctx.fill();
    ctx.stroke();

    const barY = y - caseW / 2 + 8 * s;
    const barW = caseLen - 16 * s;
    const barX = x + 8 * s;
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barW * frac, caseW - 16 * s);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `700 ${12 * s}px Inter, system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(`${reading.toFixed(1)} ${label}`, x + caseLen / 2, y + caseW / 2 + 22 * s);
  }
  ctx.restore();
}

// ── Force vectors ────────────────────────────────────────────────────────

/**
 * A force arrow with a consistent arrowhead + label-pill style, colored
 * from `FORCE_COLORS`. Length is driven by `magnitude * pxPerUnit`
 * (clamped to `[minLen, maxLen]`) when given, so two equal forces always
 * draw as two equal-length arrows — the visual argument for "equal and
 * opposite" pairs, not just a caption asserting it.
 */
export function drawForceArrow(ctx, x, y, opts = {}) {
  const angle = opts.angle ?? 0; // 0 = pointing right (+x)
  const color = opts.color || FORCE_COLORS.applied;
  const pxPerUnit = opts.pxPerUnit ?? 4;
  const minLen = opts.minLen ?? 22;
  const maxLen = opts.maxLen ?? 160;
  let len = opts.length;
  if (len == null && opts.magnitude != null) {
    len = Math.max(minLen, Math.min(maxLen, Math.abs(opts.magnitude) * pxPerUnit));
  }
  len = len ?? 60;

  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = opts.lineWidth ?? STROKE.primary;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const headLen = 11;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  if (opts.label) {
    const midX = (x + x2) / 2;
    const midY = (y + y2) / 2;
    const above = Math.sin(angle) >= 0 ? -14 : 14;
    drawLabelPill(ctx, opts.label, midX, midY + above, { color, textColor: opts.labelTextColor });
  }
  ctx.restore();
  return { x2, y2, len };
}

/** A small flat rounded pill with centered text — the shared label style
 *  every force arrow / readout should use instead of ad hoc fillText. */
export function drawLabelPill(ctx, text, cx, cy, opts = {}) {
  ctx.save();
  ctx.font = opts.font || `700 12px Inter, system-ui`;
  const paddingX = opts.paddingX ?? 8;
  const metrics = ctx.measureText(text);
  const w = metrics.width + paddingX * 2;
  const h = opts.height ?? 20;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = opts.bg || SimDraw.withAlpha('#0a0f1e', 0.82);
  ctx.fill();
  if (opts.color) {
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = opts.textColor || opts.color || '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 0.5);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// ── Pulleys & hanging masses ────────────────────────────────────────────

/**
 * A pulley wheel — an outer rim and a small hub, the standard technical-
 * diagram read for "wheel on a fixed axle." Purely a wheel; the string
 * itself is drawn separately (a scene's own straight `lineTo` segments
 * plus a short arc over the top of this wheel) since every scene's string
 * routing is different.
 */
export function drawPulley(ctx, x, y, r, colors) {
  ctx.save();
  ctx.fillStyle = colors.panelBg || '#111827';
  ctx.strokeStyle = colors.label || '#e2e8f0';
  ctx.lineWidth = STROKE.boundary;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.muted || '#94a3b8';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A rectangular hanging/resting mass block, anchored at its own top-center
 * (`x`,`y` = the point a string ties onto), with a centered mass label.
 * Same flat-fill + boundary-stroke language as `drawCart`, sized for a
 * pulley-problem block rather than a vehicle.
 */
export function drawMassBlock(ctx, x, y, opts = {}) {
  const w = opts.width ?? 76;
  const h = opts.height ?? 76;
  const color = opts.color || '#38bdf8';
  ctx.save();
  ctx.fillStyle = SimDraw.withAlpha(color, 0.22);
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE.boundary;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  if (opts.label) {
    ctx.fillStyle = color;
    ctx.font = opts.font || '700 15px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(opts.label, x, y + h / 2 + 5);
  }
  ctx.restore();
  return { top: y, bottom: y + h, left: x - w / 2, right: x + w / 2 };
}

// ── Text ─────────────────────────────────────────────────────────────────

/** Word-wrapped `fillText` — every scene in this bundle re-implemented this
 *  identically; centralized here so a future tweak (line-height, hyphen
 *  handling) happens once. */
export function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
  const prev = ctx.textAlign;
  ctx.textAlign = align;
  const words = text.split(' ');
  let line = '';
  let cy = y;
  const drawX = align === 'center' ? x + maxWidth / 2 : x;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, drawX, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, drawX, cy);
  ctx.textAlign = prev;
  return cy;
}
