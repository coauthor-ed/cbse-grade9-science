// AnimalStrategyKit.js - the animal drawings L06 shares between its scenes.
//
// Written for WombTimelapseScene (the first consumer). It holds the one drawing
// three scenes must agree on: a generic four-legged mammal seen from the side,
// in section, with its interior space marked inside it. YolkStrategyScene beat 4
// (the third strategy) and YolkBudgetGame (the strategy row) must IMPORT these
// rather than redraw them - the same silhouette in all three places is the point.
//
// Deliberately schematic and unnamed: no anatomy, no labels, no human. A mammal
// may be drawn; how any gamete is made or where is not this file's business.
//
// Colours come from the caller's `c` and mix/alpha/lighten/darken of them only.
import { alpha, mix, lighten, darken, ellipse } from 'simulations/base/kit/SimLook.js';

// The animal is drawn once in a 200 x 120 unit box, feet on y = 120, then scaled.
// Facing LEFT, so the head end is at small x.
export const MAMMAL_UNIT_W = 200;
export const MAMMAL_UNIT_H = 120;
const GROUND_Y = 120;
// How much of the box the animal's 200-unit width is allowed to take at k = 1.
// Below 1 so the body's own growth (k up to 1.16) still fits inside the hero card.
const BODY_FIT = 0.80;

// Interior space, as a fraction of the unit box, and its growth across nine months.
// The space has to grow as its occupant grows, or the occupant outgrows it.
export const INTERIOR_CX = 0.52, INTERIOR_CY = 0.54;   // fractions of the unit box
const IRX = [13, 40], IRY = [9, 22];                  // month 0 -> month 9, unit px
export const MONTHS = 9;

/** The interior space at month `m` (0..9): radii in UNIT px. Linear in months. */
export function interiorSpaceAt(month) {
  const u = Math.min(1, Math.max(0, month / MONTHS));
  return {
    rx: IRX[0] + (IRX[1] - IRX[0]) * u,
    ry: IRY[0] + (IRY[1] - IRY[0]) * u,
    u,
  };
}

/** Where the interior space sits on screen, for a body drawn to fill `box` with scale `k`. */
export function interiorCentre(box, k = 1) {
  const s = (box.w * BODY_FIT / MAMMAL_UNIT_W) * k;
  const ox = box.x + (box.w - MAMMAL_UNIT_W * s) / 2;
  const oy = box.y + box.h - MAMMAL_UNIT_H * s;          // feet on the bottom of the box
  return {
    x: ox + INTERIOR_CX * MAMMAL_UNIT_W * s,
    y: oy + INTERIOR_CY * MAMMAL_UNIT_H * s,
    s,
  };
}

/** The contact shadow under the animal: an ellipse on the feet line, in `box`. */
export function mammalShadow(ctx, c, box, k = 1) {
  const s = (box.w * BODY_FIT / MAMMAL_UNIT_W) * k;
  const w = 150 * s, h = 7 * s;
  ctx.fillStyle = alpha(c.bgDeep, 0.5);
  ellipse(ctx, box.x + box.w / 2, box.y + box.h - 2, w / 2, Math.max(2, h), 0);
  ctx.fill();
}

/**
 * The interior space drawn on its own: a warm oval inside the torso, with a lit
 * upper edge so it reads as a cavity and not a hole. Call it AFTER the body fill
 * and BEFORE anything that lives inside it.
 */
export function drawInteriorSpace(ctx, c, cx, cy, rx, ry, o = {}) {
  const a = o.alpha ?? 1;
  ctx.fillStyle = alpha(mix(c.gold, c.bgSurface, 0.55), 0.55 * a);
  ellipse(ctx, cx, cy, rx, ry, 0);
  ctx.fill();
  ctx.fillStyle = alpha(lighten(c.gold, 0.25), 0.16 * a);   // a pool of warmth at the floor
  ellipse(ctx, cx, cy + ry * 0.35, rx * 0.82, ry * 0.6, 0);
  ctx.fill();
  ctx.strokeStyle = alpha(darken(c.gold, 0.25), 0.55 * a);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 0.9, Math.PI * 1.95);
  ctx.stroke();
}

/**
 * The mammal silhouette, seen from the side, in section, feet on the floor of
 * `box`. `k` scales it about its feet (the nine-month growth of the enclosing
 * body). `o.legs` false draws the body without legs, for a small row icon.
 *
 * Returns the unit->screen transform so a caller can put something inside it.
 */
export function drawMammalSection(ctx, c, box, o = {}) {
  const k = o.k ?? 1;
  const s = (box.w * BODY_FIT / MAMMAL_UNIT_W) * k;
  const ox = box.x + (box.w - MAMMAL_UNIT_W * s) / 2;
  const oy = box.y + box.h - MAMMAL_UNIT_H * s;
  const P = (x, y) => [ox + x * s, oy + y * s];
  const body = o.body ?? mix(c.raised, c.label, 0.30);
  const far = darken(body, 0.22);
  const ink = darken(body, 0.45);
  const a = o.alpha ?? 1;

  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // A ghost: the same silhouette at an earlier size, drawn as a dashed outline
  // and nothing else, so the beat that shows a body change can show it honestly.
  if (o.outlineOnly) {
    ctx.strokeStyle = o.ghostCol ?? c.gold;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    const [gx0, gy0] = P(44, 50), [gx1, gy1] = P(150, 40), [gx2, gy2] = P(178, 60);
    const [gx3, gy3] = P(172, 90), [gx4, gy4] = P(60, 92), [gx5, gy5] = P(40, 70);
    ctx.moveTo(gx0, gy0);
    ctx.bezierCurveTo(ox + 82 * s, oy + 34 * s, gx1, gy1, gx2, gy2);
    ctx.bezierCurveTo(ox + 184 * s, oy + 78 * s, gx3, gy3, gx4, gy4);
    ctx.bezierCurveTo(ox + 48 * s, oy + 98 * s, gx5, gy5, gx0, gy0);
    ctx.closePath();
    ctx.stroke();
    // the head and the legs, so the ghost is the whole animal and not a bag
    ctx.beginPath();
    ctx.ellipse(ox + 20 * s, oy + 30 * s, 15 * s, 11 * s, -0.25, 0, Math.PI * 2);
    ctx.moveTo(ox + 30 * s, oy + 34 * s);
    ctx.quadraticCurveTo(ox + 24 * s, oy + 44 * s, ox + 44 * s, oy + 62 * s);
    ctx.moveTo(ox + 8 * s, oy + 35 * s);
    ctx.lineTo(ox + 44 * s, oy + 62 * s);
    ctx.stroke();
    if (o.legs !== false) {
      for (const [hx, hy, fx, fy] of [[58, 84, 52, GROUND_Y], [142, 84, 150, GROUND_Y]]) {
        const [x1, y1] = P(hx, hy), [x2, y2] = P(fx, fy);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
    return { ox, oy, s, P };
  }

  // --- far legs first, darker and narrower: the pair behind the body
  if (o.legs !== false) {
    ctx.strokeStyle = far;
    ctx.lineWidth = 7 * s;
    for (const [hx, hy, fx, fy] of [[74, 84, 70, GROUND_Y], [128, 86, 136, GROUND_Y]]) {
      const [x1, y1] = P(hx, hy), [x2, y2] = P(fx, fy);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // --- far foreleg reaches the ground; the near one stands on it
    ctx.strokeStyle = body;
    ctx.lineWidth = 9 * s;
    const legs = [[58, 84, 52, GROUND_Y], [142, 84, 150, GROUND_Y]];
    for (const [hx, hy, fx, fy] of legs) {
      const [x1, y1] = P(hx, hy), [x2, y2] = P(fx, fy);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = body;                              // a foot, so the leg does not end in a point
      ellipse(ctx, x2, y2, 6 * s, 3.4 * s, 0); ctx.fill();
    }
  }

  // --- tail
  ctx.strokeStyle = body;
  ctx.lineWidth = 6 * s;
  const [tx0, ty0] = P(172, 56), [tx1, ty1] = P(192, 30), [tx2, ty2] = P(186, 14);
  ctx.beginPath(); ctx.moveTo(tx0, ty0);
  ctx.quadraticCurveTo(tx1, ty1, tx2, ty2); ctx.stroke();

  // --- neck and head, at the left (small x) end
  const [nx, ny] = P(44, 62), [h1x, h1y] = P(30, 34);
  ctx.strokeStyle = body;
  ctx.lineWidth = 17 * s;
  ctx.beginPath(); ctx.moveTo(nx, ny);
  ctx.quadraticCurveTo(ox + 24 * s, oy + 44 * s, h1x, h1y);
  ctx.stroke();
  ctx.fillStyle = body;
  ellipse(ctx, ox + 20 * s, oy + 30 * s, 15 * s, 11 * s, -0.25); ctx.fill();   // skull
  ellipse(ctx, ox + 8 * s, oy + 35 * s, 10 * s, 7 * s, -0.12); ctx.fill();    // muzzle
  ctx.strokeStyle = ink;                                                       // ear
  ctx.lineWidth = 3 * s;
  const [ex, ey] = P(26, 20);
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ox + 32 * s, oy + 12 * s); ctx.stroke();

  // --- torso: one closed silhouette, the only body outline in the file
  ctx.beginPath();
  const [ax, ay] = P(44, 50), [bx, by] = P(150, 40), [cx2, cy2] = P(178, 60);
  const [dx, dy] = P(172, 90), [ex2, ey2] = P(60, 92), [fx2, fy2] = P(40, 70);
  ctx.moveTo(ax, ay);
  ctx.bezierCurveTo(ox + 82 * s, oy + 34 * s, bx, by, cx2, cy2);   // back line, shoulder to rump
  ctx.bezierCurveTo(ox + 184 * s, oy + 78 * s, dx, dy, ex2, ey2); // rump down to the belly
  ctx.bezierCurveTo(ox + 48 * s, oy + 98 * s, fx2, fy2, ax, ay);   // belly line, back to the chest
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = alpha(ink, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
  return { ox, oy, s, P };
}

/**
 * The whole body with its interior space marked: the one drawing the strategy
 * row, the third-strategy beat and this scene all share.
 */
export function drawMammalWithInterior(ctx, c, box, month, o = {}) {
  const sp = interiorSpaceAt(month);
  const t = drawMammalSection(ctx, c, box, o);
  const ctr = interiorCentre(box, o.k ?? 1);
  drawInteriorSpace(ctx, c, ctr.x, ctr.y, sp.rx * ctr.s, sp.ry * ctr.s, o);
  return { ...t, interior: ctr, sp };
}