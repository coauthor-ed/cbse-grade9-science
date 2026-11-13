/**
 * MotionCast - the one world of the motion-and-forces course (Grade 9, Ch 4
 * Describing Motion Around Us, Ch 6 How Forces Affect Motion). Course words and
 * presets only; every part is drawn by the kit (SimVehicles, SimTrack, SimProps,
 * SimFigure, SimPlot).
 *
 *   ARROW_KINDS, drawMotionArrow      v / a / F / s arrows (re-export, one tone each)
 *   trackPreset(o)                     running track 0..100 m with O, every 10 m
 *   highwayPreset(o)                   highway 0..500 m, every 100 m
 *   drawRunTrack(ctx, c, spec, o)      drawTrack kind 'track' with O and the course defaults
 *   drawHighway(ctx, c, spec, o)       drawTrack kind 'road'
 *   drawAthlete(ctx, c, spec, { m, dist, height, look })          runner on the track -> sk
 *   drawBusPassenger(ctx, c, { x, y, length, lean, roll, ground })  bus inside + passenger tilted about the feet -> { bus, sk }
 *   drawScooterGirl(ctx, c, { x, y, length, roll, flip })           -> { scooter, sk }
 *   drawCanoeist(ctx, c, { x, y, length, stroke })                  -> { canoe, sk }
 *   drawChairGirl(ctx, c, { x, y, height = 170, facing })           girl on a wheeled office chair -> { chair, sk, wheels }
 *   drawOfficeChair(ctx, c, { x, y, forHeight, facing, tone })       5-star base (side view), castors -> { seat, box, back, wheels }
 *   SURFACES, drawSurface(ctx, c, key, x0, x1, y, { h = 32 })        rough floor, tiles, ice, marble table (own textures)
 * ASCII only.
 */
import { drawFigure, figureLook, walkPhase, figureMetrics } from 'simulations/base/kit/SimFigure.js';
import { drawBus, drawBusStander, drawScooter, drawCanoe } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, ARROW_KINDS, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { mix, darken, lighten, alpha, ellipse, rr, luma, mulberry32 } from 'simulations/base/kit/SimLook.js';

export { ARROW_KINDS, drawMotionArrow };

const DEG = 180 / Math.PI;

export const LOOKS = {
  athlete: { skin: 2, hairStyle: 'bun', hair: 0 },   // she: bun, the short crop read as a boy (W1)
  girl: { skin: 1, hairStyle: 'braid', hair: 1 },
  passenger: { skin: 0, hairStyle: 'sidepart', hair: 0 },
  canoeist: { skin: 3, hairStyle: 'crop', hair: 0 },
  chairGirl: { skin: 2, hairStyle: 'buns', hair: 1 },
};

export function trackPreset(o = {}) { return trackSpec({ from: 0, to: 100, x0: 50, x1: 630, y: 400, ...o }); }
export function highwayPreset(o = {}) { return trackSpec({ from: 0, to: 500, x0: 50, x1: 630, y: 400, ...o }); }
export function drawRunTrack(ctx, c, spec, o = {}) { return drawTrack(ctx, c, spec, { kind: 'track', every: 10, lanes: 2, ...o }); }
export function drawHighway(ctx, c, spec, o = {}) { return drawTrack(ctx, c, spec, { kind: 'road', every: 100, ...o }); }

/** The athlete running on the track at metre m; legs cycle with dist (metres run). */
export function drawAthlete(ctx, c, spec, o = {}) {
  const H = o.height ?? 120, x = spec.toPx(o.m ?? 0), dist = (o.dist ?? o.m ?? 0) * spec.scale;
  return drawFigure(ctx, c, { x, y: spec.y, height: H, build: 'teen', facing: o.facing ?? 1, pose: { name: 'run', phase: walkPhase(dist, H, 'run') } },
    figureLook(c, { ...LOOKS.athlete, ...(o.look ?? {}) }));
}

/** A cut-away bus with one standing passenger holding the strap; lean (radians, + forward) tilts both. */
export function drawBusPassenger(ctx, c, o = {}) {
  const bus = drawBus(ctx, c, { x: o.x ?? 340, y: o.y ?? 430, length: o.length ?? 600, roll: o.roll ?? 0, inside: true, lean: o.lean ?? 0, flip: o.flip, ground: o.ground ?? true });
  const sk = drawBusStander(ctx, c, bus, figureLook(c, { ...LOOKS.passenger, ...(o.look ?? {}) }));
  return { bus, sk };
}

/** The girl on the scooter. */
export function drawScooterGirl(ctx, c, o = {}) {
  const scooter = drawScooter(ctx, c, { x: o.x ?? 340, y: o.y ?? 430, length: o.length ?? 170, roll: o.roll ?? 0, flip: o.flip, tone: o.tone });
  const A = scooter.anchors;
  const sk = drawFigure(ctx, c, { x: A.seat.x, y: scooter.ground, height: A.riderHeight, build: 'teen', facing: scooter.f, pose: 'sit',
    seat: A.seat, hands: [A.handlebar, A.handlebar], feet: [A.footrest, A.footrest] }, figureLook(c, { ...LOOKS.girl, ...(o.look ?? {}) }));
  return { scooter, sk };
}

/** The canoeist paddling; stroke 0..1 (catch to finish). */
export function drawCanoeist(ctx, c, o = {}) {
  const base = { x: o.x ?? 340, y: o.y ?? 400, length: o.length ?? 300, stroke: o.stroke ?? 0, flip: o.flip };
  const canoe = drawCanoe(ctx, c, { ...base, part: 'back' });
  const A = canoe.anchors;
  const sk = drawFigure(ctx, c, { x: A.seat.x, y: A.seat.y + 4, height: A.paddlerHeight, build: 'adult', facing: canoe.f, pose: 'sit',
    seat: A.seat, hands: [A.paddle.lower, A.paddle.pivot] }, figureLook(c, { ...LOOKS.canoeist, ...(o.look ?? {}) }));
  drawCanoe(ctx, c, { ...base, part: 'front' });
  return { canoe, sk };
}

function shellPath(ctx, path, col, k = 0.17) {
  path(); ctx.fillStyle = col; ctx.fill();
  path(); ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
}

function castor(ctx, c, x, y, r) {
  const tyre = mix(c.bgDeep, c.label, 0.22);
  ctx.beginPath(); ctx.arc(x, y - r, r, 0, Math.PI * 2); ctx.fillStyle = tyre; ctx.fill();
  ctx.strokeStyle = darken(tyre, 0.35); ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - r, r * 0.4, 0, Math.PI * 2); ctx.fillStyle = mix(c.bgSurface, c.label, 0.4); ctx.fill();
  ctx.fillStyle = alpha(lighten(tyre, 0.5), 0.6); ellipse(ctx, x - r * 0.4, y - r * 1.5, r * 0.3, r * 0.15, -0.6); ctx.fill();
}

/** A wheeled office chair, side view: five-star base (three legs show), castors, gas column, seat, back. */
export function drawOfficeChair(ctx, c, o = {}) {
  const H = o.forHeight ?? 170, M = figureMetrics(H, o.build ?? 'teen'), x = o.x ?? 340, y = o.y ?? 430, f = o.facing === -1 ? -1 : 1;
  const col = typeof o.tone === 'number' ? c['s' + o.tone] : c[o.tone ?? 's5'] ?? c.s5, metal = mix(c.bgSurface, c.label, 0.45), rc = Math.max(8, 0.05 * H);
  const sy = y - M.seatSit, hubY = y - 2 * rc - 0.03 * H;
  const feet = [x - 0.17 * H, x + 0.04 * H, x + 0.19 * H];
  ctx.save();
  ellipse(ctx, x, y + 1, 0.22 * H, 5); ctx.fillStyle = alpha(darken(c.bgDeep, 0.5), luma(c.bgDeep) > 0.5 ? 0.14 : 0.45); ctx.fill();
  ctx.strokeStyle = darken(metal, 0.35); ctx.lineCap = 'round';
  for (const fx of feet) { ctx.lineWidth = Math.max(6, 0.035 * H); ctx.beginPath(); ctx.moveTo(x, hubY); ctx.lineTo(fx, y - 2 * rc + 1); ctx.stroke(); }
  ctx.strokeStyle = metal; for (const fx of feet) { ctx.lineWidth = Math.max(3, 0.018 * H); ctx.beginPath(); ctx.moveTo(x, hubY - 1); ctx.lineTo(fx, y - 2 * rc); ctx.stroke(); }
  for (const fx of feet) castor(ctx, c, fx, y, rc);
  rr(ctx, x - 0.02 * H, sy, 0.04 * H, hubY - sy, 0.02 * H); ctx.fillStyle = darken(metal, 0.15); ctx.fill(); ctx.strokeStyle = darken(metal, 0.4); ctx.lineWidth = 2; ctx.stroke();
  const bx = x - f * 0.17 * H, by = sy - 0.34 * H;
  ctx.strokeStyle = darken(metal, 0.3); ctx.lineWidth = Math.max(5, 0.03 * H);
  ctx.beginPath(); ctx.moveTo(x - f * 0.06 * H, sy + 0.03 * H); ctx.quadraticCurveTo(bx, sy + 0.03 * H, bx + f * 0.01 * H, by + 0.2 * H); ctx.stroke();
  shellPath(ctx, () => rr(ctx, bx - 0.04 * H, by, 0.08 * H, 0.24 * H, 0.04 * H), col);
  ctx.fillStyle = alpha(lighten(col, 0.4), 0.8); ellipse(ctx, bx - 0.012 * H, by + 0.05 * H, 0.012 * H, 0.04 * H); ctx.fill();
  shellPath(ctx, () => rr(ctx, x - 0.17 * H, sy - 0.035 * H, 0.34 * H, 0.06 * H, 0.03 * H), col);
  ctx.fillStyle = alpha(lighten(col, 0.4), 0.8); rr(ctx, x - 0.13 * H, sy - 0.03 * H, 0.2 * H, 0.012 * H, 0.006 * H); ctx.fill();
  ctx.restore();
  return { seat: { x, y: sy - 0.035 * H }, box: { x0: x - 0.22 * H, y0: by, w: 0.44 * H, h: y - by }, back: { x: bx, y: by }, wheels: feet.map((fx) => ({ x: fx, y: y - rc, r: rc })) };
}

/** The girl on a wheeled office chair (pushed, or pushing off a wall). */
export function drawChairGirl(ctx, c, o = {}) {
  const H = o.height ?? 170, x = o.x ?? 340, y = o.y ?? 430, facing = o.facing ?? 1;
  const chair = drawOfficeChair(ctx, c, { x, y, forHeight: H, facing, tone: o.tone });
  const sk = drawFigure(ctx, c, { x: chair.seat.x, y, height: H, build: 'teen', facing, pose: 'sit', seat: chair.seat },
    figureLook(c, { ...LOOKS.chairGirl, ...(o.look ?? {}) }));
  return { chair, sk, wheels: chair.wheels };
}

/** Surfaces of Ch 6 (friction): each with its own texture, readable at a glance in both themes. */
export const SURFACES = {
  rough: { kind: 'rough', label: 'Rough floor' },
  tiles: { kind: 'tiles', label: 'Tiled floor' },
  ice: { kind: 'ice', label: 'Ice' },
  marble: { kind: 'marble', label: 'Marble table' },
};

const pale = (c) => darken(luma(c.label) > luma(c.bgSurface) ? c.label : c.bgSurface, 0.04);

export function drawSurface(ctx, c, key, x0, x1, y, o = {}) {
  const s = SURFACES[key] ?? SURFACES.tiles, h = Math.max(28, o.h ?? 32), w = x1 - x0, rnd = mulberry32(o.seed ?? (key.length * 97 + 11));
  const base = s.kind === 'rough' ? mix(pale(c), c.waste, 0.55) : s.kind === 'tiles' ? mix(pale(c), c.gold, 0.22)
    : s.kind === 'ice' ? mix(pale(c), c.glass, 0.6) : mix(pale(c), c.labelMuted, 0.08);
  const path = () => rr(ctx, x0, y, w, h, 6);
  ctx.save();
  ctx.save(); ctx.translate(0, 5); path(); ctx.fillStyle = darken(base, 0.45); ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = base; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.fillStyle = darken(base, 0.12); ctx.fillRect(x0, y + h * 0.7, w, h);
  if (s.kind === 'rough') {                                                          // gravel grain: dark and light specks
    for (let i = 0; i < w * 0.9; i++) {
      const px = x0 + rnd() * w, py = y + 3 + rnd() * (h - 5), rr0 = 1.2 + rnd() * 2.6;
      ellipse(ctx, px, py, rr0, rr0 * 0.75); ctx.fillStyle = rnd() < 0.6 ? darken(base, 0.35 + rnd() * 0.2) : lighten(base, 0.35); ctx.fill();
    }
  } else if (s.kind === 'tiles') {                                                   // grid joints, a gloss line on each tile
    const tw = Math.max(26, h * 1.1);
    ctx.fillStyle = darken(base, 0.32);
    for (let x = x0 + tw; x < x1; x += tw) ctx.fillRect(x - 1.5, y, 3, h);
    ctx.fillRect(x0, y + h * 0.5 - 1.5, w, 3);
    ctx.fillStyle = alpha(lighten(base, 0.7), 0.85);
    for (let x = x0 + 5; x < x1 - 8; x += tw) { ctx.fillRect(x, y + 4, tw * 0.55, 2.5); ctx.fillRect(x, y + h * 0.5 + 4, tw * 0.4, 2.5); }
  } else if (s.kind === 'ice') {                                                     // white streaks and one shine
    ctx.strokeStyle = alpha(lighten(base, 0.9), 0.9); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = x0 + 10; x < x1; x += 34) { const yy = y + 6 + rnd() * (h - 14); ctx.moveTo(x, yy + 6); ctx.lineTo(x + 20, yy); }
    ctx.stroke();
    ctx.fillStyle = alpha(lighten(base, 0.95), 0.75); ellipse(ctx, x0 + w * 0.3, y + h * 0.28, w * 0.18, 3); ctx.fill();
  } else {                                                                           // marble: pale stone, soft grey veins
    ctx.strokeStyle = alpha(darken(mix(base, c.waste, 0.45), 0.12), 0.85); ctx.lineCap = 'round';
    for (let i = 0; i < Math.max(3, w / 45); i++) {
      const sx = x0 + rnd() * w, sy = y + rnd() * h; ctx.lineWidth = 1.5 + rnd() * 1.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx + 18, sy + (rnd() - 0.5) * h, sx + 34, sy + (rnd() - 0.5) * h, sx + 52, sy + (rnd() - 0.5) * h * 0.6); ctx.stroke();
    }
    ctx.fillStyle = alpha(lighten(base, 0.8), 0.8); ctx.fillRect(x0 + 6, y + 3, w - 12, 2.5);
  }
  ctx.restore();
  path(); ctx.strokeStyle = darken(base, 0.42); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  return { x0, x1, y, h, label: s.label, kind: s.kind };
}
