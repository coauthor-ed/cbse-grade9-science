/**
 * ForceCast - course-local force helpers for Ch 6 How Forces Affect Motion (L09-L15).
 * Pure draw helpers, no scene state, no clock. Built on the kit: drawMotionArrow kind 'F'
 * (via MotionCast), SimFigure (push / pull poses, groupLook), SimApparatus (crate, spring),
 * SimProps (block), MotionCast drawSurface. Manual: M/briefs/force-cast-api.md.
 *
 *   forceScale(pxPerN) -> { pxPerN, len(n) }                       one scale per scene
 *   drawForce(ctx, c, x, y, { newtons | length, angle, scale, label, side, at, alpha, fit, size })
 *       -> arrow { x2, y2, len, label: box }                         kind 'F', tail at (x, y)
 *   drawNet(ctx, c, x, y, forces, { scale, label, angle, side, alpha, unit })
 *       forces [{ newtons, dir: +1 | -1 }] -> { net, arrow, box }   dot form "net force = 0" at zero
 *   drawBoxOn(ctx, c, { x, y, w, h, kind: 'crate' | 'block', surface, x0, x1, tone, alpha })
 *       -> { centre, bottom, front, back, top, box, surface }       y = top of the surface strip
 *   drawTank(ctx, c, { x, y, w, h, level, part: 'all' | 'back' | 'front' }) -> { surface, x0, x1, top, bottom }
 *   drawField(ctx, c, { x0, x1, y, h }) -> { y, top }               grass ground strip
 *   drawPusher(ctx, c, { at, y, height, effort, facing, look, x, build }) -> sk   hands at `at`
 *   drawTeam(ctx, c, { ropeX, ropeY, y, n, facing, effort, height, gap, looks, seed, skid })
 *       -> { figures, front, back }                                  pullers leaning back on a rope
 *   drawRope(ctx, c, { x0, x1, y, markX, lineX, groundY }) -> { ribbon, line }
 *   drawSpringBalance(ctx, c, { x, y, angle, reading, max, every, minor, unit, len, rod, alpha })
 *       -> { ring, hook, box, pointer }                              numbers 26 px, upright
 * Colours: tokens only. ASCII only.
 */
import { drawFigure, figureLook, groupLook } from 'simulations/base/kit/SimFigure.js';
import { drawCrate, drawSpring } from 'simulations/base/kit/SimApparatus.js';
import { propRig, drawBlock } from 'simulations/base/kit/SimProps.js';
import { font, mix, darken, lighten, alpha, luma, rr, ellipse, drawShadow, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow, drawSurface } from './MotionCast.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const pxOf = (s) => (typeof s === 'number' ? s : s?.pxPerN ?? 8);
const pale = (c) => darken(luma(c.label) > luma(c.bgSurface) ? c.label : c.bgSurface, 0.04);
const fmt = (n) => (Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1));

function textW(ctx, c, t, size) {
  ctx.save(); ctx.font = font(c, 800, size, true); const w = ctx.measureText(t).width; ctx.restore(); return w;
}

/** One px-per-newton scale for a scene, so equal forces get equal arrows. */
export function forceScale(pxPerN = 8) { return { pxPerN, len: (n) => Math.abs(n) * pxPerN }; }

/**
 * A force arrow (kit kind 'F'), tail at (x, y) on the object it acts on. Length = newtons x scale,
 * or o.length for a conceptual arrow. fit (default true): a horizontal arrow is stretched just
 * enough that its label does not reach back over the tail. Label above a horizontal arrow,
 * right of a downward one, left of an upward one, unless o.side says otherwise.
 */
export function drawForce(ctx, c, x, y, o = {}) {
  const size = o.size ?? 26, ang = o.angle ?? 0, at = o.at ?? 0.55;
  let len = o.length ?? (o.newtons != null ? Math.abs(o.newtons) * pxOf(o.scale) : 90);
  if (len > 0 && o.fit !== false && o.label && Math.abs(Math.cos(ang)) > 0.5) len = Math.max(len, (textW(ctx, c, o.label, size) / 2 + 8) / at);
  const side = o.side ?? (Math.cos(ang) < -0.01 ? -1 : 1);
  return drawMotionArrow(ctx, c, 'F', x, y, { length: len, angle: ang, label: o.label, side, at, alpha: o.alpha, size, frame: o.frame });
}

/** The net force of forces along one line, drawn as its own F arrow from (x, y); zero: the dot form. */
export function drawNet(ctx, c, x, y, forces, o = {}) {
  const net = forces.reduce((s, f) => s + (f.newtons ?? 0) * (f.dir ?? 1), 0);
  if (Math.abs(net) < 1e-6) {
    const arrow = drawMotionArrow(ctx, c, 'F', x, y, { length: 0, label: o.label ?? 'net force = 0', side: o.side ?? 1, alpha: o.alpha, size: o.size });
    return { net: 0, arrow, box: arrow.label };
  }
  const ang = (o.angle ?? 0) + (net < 0 ? Math.PI : 0);
  const arrow = drawForce(ctx, c, x, y, { newtons: Math.abs(net), scale: o.scale, angle: ang, label: o.label ?? ('net ' + fmt(Math.abs(net)) + ' ' + (o.unit ?? 'N')),
    side: o.side, alpha: o.alpha, size: o.size, fit: o.fit, frame: o.frame });
  return { net, arrow, box: arrow.label };
}

/** A crate (or a wooden block) standing on a surface strip whose top is y. Anchors for force tails. */
export function drawBoxOn(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 400, w = o.w ?? 120, kind = o.kind ?? 'crate', h = o.h ?? (kind === 'block' ? w * 0.6 : w * 0.8);
  let surface = null;
  if (o.surface) surface = drawSurface(ctx, c, o.surface, o.x0 ?? x - w * 1.6, o.x1 ?? x + w * 1.6, y, { h: o.surfaceH ?? 32 });
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  if (kind === 'block') {
    const wood = o.tone != null ? (typeof o.tone === 'number' ? c['s' + o.tone] : c[o.tone] ?? o.tone) : darken(c.gold, 0.22);
    drawBlock(ctx, c, propRig({ x0: 0, groundY: y, scale: 1 }), x, { w, h, tone: wood });
    ctx.strokeStyle = alpha(darken(wood, 0.35), 0.55); ctx.lineWidth = 2; ctx.lineCap = 'round';   // wood grain
    for (let i = 1; i <= 3; i++) {
      const gy = y - h + (h * i) / 4.2;
      ctx.beginPath(); ctx.moveTo(x - w / 2 + 10, gy); ctx.bezierCurveTo(x - w / 6, gy - 4, x + w / 6, gy + 4, x + w / 2 - 10, gy - 1); ctx.stroke();
    }
  } else {
    drawCrate(ctx, c, { x, y, w, h, kind: o.crate ?? 'crate', tone: o.tone });
  }
  ctx.restore();
  return { centre: { x, y: y - h / 2 }, bottom: { x, y }, front: { x: x + w / 2, y: y - h / 2 }, back: { x: x - w / 2, y: y - h / 2 }, top: { x, y: y - h },
    box: { x: x - w / 2, y: y - h, w, h }, surface };
}

/** A glass tank of water, front view. part 'back' (glass and water), then your floating thing, then 'front'. */
export function drawTank(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 440, w = o.w ?? 240, h = o.h ?? 150, lv = o.level ?? 0.62, part = o.part ?? 'all';
  const x0 = x - w / 2, x1 = x + w / 2, top = y - h, ws = y - h * lv, glass = mix(c.glass ?? c.water, c.bgSurface, 0.35), water = c.water;
  ctx.save();
  if (part !== 'front') {
    drawShadow(ctx, c, x, y + 3, w * 0.52, 7);
    rr(ctx, x0, top, w, h, 10); ctx.fillStyle = alpha(glass, 0.28); ctx.fill();
    ctx.save(); rr(ctx, x0, top, w, h, 10); ctx.clip();
    const g = ctx.createLinearGradient(0, ws, 0, y);
    g.addColorStop(0, alpha(lighten(water, 0.1), 0.62)); g.addColorStop(1, alpha(darken(water, 0.18), 0.78));
    ctx.fillStyle = g; ctx.fillRect(x0, ws, w, y - ws);
    ctx.restore();
  }
  if (part !== 'back') {
    ctx.save(); rr(ctx, x0, top, w, h, 10); ctx.clip();
    ctx.fillStyle = alpha(water, 0.32); ctx.fillRect(x0, ws, w, y - ws);                 // water in front of what floats
    ctx.fillStyle = alpha(lighten(water, 0.55), 0.85); ctx.fillRect(x0, ws - 2, w, 4);  // the surface line
    ctx.strokeStyle = alpha(lighten(water, 0.7), 0.6); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const yy = ws + 18 + i * 22; ctx.beginPath(); ctx.moveTo(x0 + 22 + i * 30, yy); ctx.lineTo(x0 + 50 + i * 30, yy); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = alpha(lighten(glass, 0.8), 0.55); rr(ctx, x0 + 10, top + 12, 8, h - 30, 4); ctx.fill();   // glass shine
    rr(ctx, x0, top, w, h, 10); ctx.strokeStyle = darken(glass, 0.35); ctx.lineWidth = 3.5; ctx.stroke();
    rr(ctx, x0 + 4, top + 4, w - 8, h - 8, 7); ctx.strokeStyle = alpha(lighten(glass, 0.5), 0.6); ctx.lineWidth = 1.5; ctx.stroke();
    rr(ctx, x0 - 6, y - 10, w + 12, 14, 5); ctx.fillStyle = darken(glass, 0.3); ctx.fill();   // base
  }
  ctx.restore();
  return { surface: ws, x0, x1, top, bottom: y };
}

/** A grass ground strip (field, playground) with blades on its top edge; top = y. */
export function drawField(ctx, c, o = {}) {
  const x0 = o.x0 ?? 0, x1 = o.x1 ?? 680, y = o.y ?? 420, h = o.h ?? 100, rnd = mulberry32(o.seed ?? 7);
  const grass = mix(c.good, c.setGround ?? c.gold, 0.35), soil = mix(c.gold, c.waste ?? c.label, 0.4);
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, lighten(grass, 0.12)); g.addColorStop(1, darken(grass, 0.2));
  ctx.fillStyle = g; ctx.fillRect(x0, y, x1 - x0, h);
  ctx.fillStyle = alpha(soil, 0.35);
  for (let i = 0; i < (x1 - x0) / 26; i++) { ellipse(ctx, x0 + rnd() * (x1 - x0), y + 14 + rnd() * (h - 20), 10 + rnd() * 22, 3 + rnd() * 3); ctx.fill(); }
  ctx.strokeStyle = darken(grass, 0.3); ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let x = x0 + 3; x < x1; x += 7) { const bh = 5 + rnd() * 7, lean = (rnd() - 0.5) * 6; ctx.moveTo(x, y + 3); ctx.lineTo(x + lean, y - bh); }
  ctx.stroke();
  ctx.fillStyle = alpha(lighten(grass, 0.5), 0.5); ctx.fillRect(x0, y, x1 - x0, 3);
  ctx.restore();
  return { y, top: y };
}

const youLook = (c) => figureLook(c, { skin: 2, hairStyle: 'short', hair: 1, top: 4, bottom: 5 });

/** A person pushing with both palms at `at` ({x, y}); feet on y; leans in by effort 0..1. */
export function drawPusher(ctx, c, o = {}) {
  const H = o.height ?? 170, f = o.facing === -1 ? -1 : 1, e = clamp01(o.effort ?? 0.5), y = o.y ?? 400;
  const at = o.at ?? { x: (o.x ?? 300) + f * 0.45 * H, y: y - 0.55 * H };
  const x = o.x ?? at.x - f * (0.4 + 0.1 * e) * H;
  return drawFigure(ctx, c, { x, y, height: H, build: o.build ?? 'adult', facing: f, pose: { name: 'push', lean: 14 + 14 * e, crouch: 0.04 + 0.08 * e },
    hands: [{ x: at.x, y: at.y }, { x: at.x - f * 3, y: at.y + 0.05 * H }] }, o.look ?? youLook(c));
}

/**
 * n pullers on one rope, facing `facing` (+1: the team stands left and faces right). ropeX is the
 * front hand of the first puller (nearest the middle); the others stand gap px further back.
 * effort 0..1 leans them back. skid 0..1 draws drag marks behind their feet (they are being pulled).
 */
export function drawTeam(ctx, c, o = {}) {
  const n = o.n ?? 3, f = o.facing === -1 ? -1 : 1, H = o.height ?? 140, gap = o.gap ?? 0.62 * H, e = clamp01(o.effort ?? 0.6);
  const y = o.y ?? 420, ry = o.ropeY ?? y - 0.5 * H, figures = [];
  for (let i = n - 1; i >= 0; i--) {
    const hx = o.ropeX - f * i * gap, x = hx - f * (0.36 + 0.08 * e) * H;
    if (o.skid > 0) {
      ctx.save(); ctx.strokeStyle = alpha(darken(c.gold, 0.45), 0.5 * clamp01(o.skid)); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const dx of [-0.14, 0.14]) { ctx.beginPath(); ctx.moveTo(x + dx * H, y + 3); ctx.lineTo(x + dx * H - f * 46 * clamp01(o.skid), y + 3); ctx.stroke(); }
      ctx.restore();
    }
    const look = o.looks?.[i] ?? groupLook(c, i + (o.seed ?? 0));
    figures.unshift(drawFigure(ctx, c, { x, y, height: H, build: 'adult', facing: f, pose: { name: 'pull', lean: -(8 + 16 * e), crouch: 0.08 + 0.08 * e },
      hands: [{ x: hx, y: ry }, { x: hx - f * 0.13 * H, y: ry }] }, look));
  }
  return { figures, front: { x: o.ropeX, y: ry }, back: { x: o.ropeX - f * ((n - 1) * gap + 0.13 * H), y: ry } };
}

/** A taut rope x0..x1 at y with a red ribbon at markX; a chalk centre line on the ground at lineX. Draw before the teams. */
export function drawRope(ctx, c, o = {}) {
  const x0 = o.x0 ?? 40, x1 = o.x1 ?? 640, y = o.y ?? 300, jute = mix(c.gold, c.waste ?? c.label, 0.25);
  ctx.save();
  let line = null;
  if (o.lineX != null && o.groundY != null) {
    const gy = o.groundY, lx = o.lineX, ll = o.lineLen ?? 70, sk = ll / 70;
    ctx.beginPath(); ctx.moveTo(lx + 6 * sk, gy - 2); ctx.lineTo(lx + 6 * sk + 7, gy - 2); ctx.lineTo(lx - 2 * sk, gy + ll); ctx.lineTo(lx - 2 * sk - 12, gy + ll); ctx.closePath();
    ctx.fillStyle = alpha(pale(c), 0.92); ctx.fill();
    ctx.strokeStyle = alpha(darken(pale(c), 0.25), 0.6); ctx.lineWidth = 1.5; ctx.stroke();
    line = { x: lx, y0: gy, y1: gy + ll };
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = darken(jute, 0.4); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x0, y + 1); ctx.lineTo(x1, y + 1); ctx.stroke();
  ctx.strokeStyle = jute; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.strokeStyle = alpha(darken(jute, 0.3), 0.8); ctx.lineWidth = 2;                  // twist
  ctx.beginPath(); for (let x = x0 + 4; x < x1 - 4; x += 9) { ctx.moveTo(x, y + 4); ctx.lineTo(x + 5, y - 4); } ctx.stroke();
  ctx.strokeStyle = alpha(lighten(jute, 0.5), 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y - 2.5); ctx.lineTo(x1, y - 2.5); ctx.stroke();
  let ribbon = null;
  if (o.markX != null) {
    const mx = o.markX, red = c.bad;
    for (const [dx, sw] of [[-1, -1], [1, 1]]) {
      ctx.beginPath(); ctx.moveTo(mx, y + 2); ctx.quadraticCurveTo(mx + dx * 4, y + 18, mx + sw * 9, y + 30); ctx.lineTo(mx + sw * 3, y + 31); ctx.quadraticCurveTo(mx + dx * 1, y + 16, mx, y + 2);
      ctx.fillStyle = darken(red, 0.1); ctx.fill(); ctx.strokeStyle = darken(red, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
    }
    rr(ctx, mx - 7, y - 8, 14, 16, 4); ctx.fillStyle = red; ctx.fill(); ctx.strokeStyle = darken(red, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(red, 0.5), 0.7); ctx.fillRect(mx - 4, y - 5, 4, 4);
    ribbon = { x: mx, y };
  }
  ctx.restore();
  return { ribbon, line };
}

/**
 * A spring balance. (x, y) is the top ring; angle is the axis from the ring to the hook (PI/2: hanging
 * down; 0: lying flat, hook to the right). reading 0..max moves the pointer and stretches the spring
 * (seen through the slot); the hook rod comes out by the same stretch. Numbers upright, 26 px.
 */
export function drawSpringBalance(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 60, ang = o.angle ?? Math.PI / 2, max = o.max ?? 10, every = o.every ?? max / 5, unit = o.unit ?? 'N';
  const L = o.len ?? 250, W = o.w ?? 124, minor = o.minor ?? every / 2, size = o.size ?? 26, k = clamp01((o.reading ?? 0) / max);
  const ux = Math.cos(ang), uy = Math.sin(ang), P = (a, b) => ({ x: x + ux * a + uy * b, y: y + uy * a - ux * b });   // a along the axis, b = local x across it
  const c0 = 26, z0 = c0 + 34, span = L - 64, stretch = k * span, zp = z0 + stretch, hookY = c0 + L + (o.rod ?? 26) + stretch;
  const shell = mix(c.bgSurface, c.label, 0.12), metal = mix(c.bgSurface, c.label, 0.4), face = mix(c.gold, c.bgSurface, 0.55), red = c.bad;
  const stroke2 = (path, col, w1, w2) => { ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = w1; path(); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w2; path(); ctx.stroke(); };
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang - Math.PI / 2);            // local frame: +y along the axis (ring to hook)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  stroke2(() => { ctx.beginPath(); ctx.arc(0, 10, 11, 0, TAU); }, metal, 7, 4);                              // ring
  stroke2(() => { ctx.beginPath(); ctx.moveTo(0, c0 + L - 8); ctx.lineTo(0, hookY); }, metal, 7, 4);           // hook rod: out by the stretch
  stroke2(() => { ctx.beginPath(); ctx.moveTo(0, hookY); ctx.lineTo(0, hookY + 12); ctx.arc(-9, hookY + 12, 9, 0, Math.PI * 0.95); }, metal, 7, 4);
  rr(ctx, -W / 2 + 3, c0 + 5, W, L, 14); ctx.fillStyle = darken(shell, 0.4); ctx.fill();   // case lip
  rr(ctx, -W / 2, c0, W, L, 14); ctx.fillStyle = shell; ctx.fill();
  ctx.save(); rr(ctx, -W / 2, c0, W, L, 14); ctx.clip();
  ctx.fillStyle = darken(shell, 0.14); ctx.fillRect(W * 0.3, c0, W, L);
  ctx.fillStyle = alpha(lighten(shell, 0.5), 0.8); ctx.fillRect(-W / 2 + 4, c0 + 8, 4, L - 16);
  ctx.restore();
  rr(ctx, -W / 2, c0, W, L, 14); ctx.strokeStyle = darken(shell, 0.45); ctx.lineWidth = 3; ctx.stroke();
  rr(ctx, -W / 2 + 7, c0 + 10, W - 14, L - 20, 8); ctx.fillStyle = face; ctx.fill();          // scale face
  ctx.strokeStyle = darken(face, 0.35); ctx.lineWidth = 2; ctx.stroke();
  rr(ctx, 6, c0 + 16, 28, L - 32, 7); ctx.fillStyle = mix(c.bgDeep, face, 0.3); ctx.fill();   // slot
  ctx.strokeStyle = darken(face, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
  drawSpring(ctx, c, { x1: 20, y1: c0 + 18, x2: 20, y2: zp - 3, rest: z0 - c0 - 20, coils: 10, r: 9, wire: 2.6, plates: false });
  stroke2(() => { ctx.beginPath(); ctx.moveTo(20, zp); ctx.lineTo(20, c0 + L - 18); ctx.lineTo(0, c0 + L - 8); }, metal, 5, 2.5);
  ctx.strokeStyle = darken(c.labelMuted, 0.1); ctx.lineWidth = 2;                             // ticks, left of the slot
  for (let v = 0; v <= max + 1e-9; v += minor) {
    const ty = z0 + (v / max) * span, major = Math.abs(v / every - Math.round(v / every)) < 1e-6;
    ctx.beginPath(); ctx.moveTo(3, ty); ctx.lineTo(major ? -9 : -3, ty); ctx.stroke();
  }
  rr(ctx, -8, zp - 4, 46, 8, 4); ctx.fillStyle = red; ctx.fill();                             // pointer
  ctx.strokeStyle = darken(red, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  // Numbers upright, left of the ticks.
  ctx.font = font(c, 800, size, true); ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= max + 1e-9; v += every) { const p = P(z0 + (v / max) * span, -28); ctx.fillText(fmt(v), p.x, p.y + 1); }
  if (o.showUnit !== false) { const p = P(c0 + L - 26, 46); ctx.font = font(c, 800, 22, true); ctx.fillStyle = c.label; ctx.fillText(unit, p.x, p.y); }
  ctx.restore();
  const bb = [P(0, -W / 2), P(hookY + 22, W / 2), P(0, W / 2), P(hookY + 22, -W / 2)];
  const bx0 = Math.min(...bb.map((p) => p.x)), by0 = Math.min(...bb.map((p) => p.y));
  return { ring: { x, y }, hook: P(hookY + 21, -9), pointer: P(zp, 20), stretch,
    box: { x: bx0, y: by0, w: Math.max(...bb.map((p) => p.x)) - bx0, h: Math.max(...bb.map((p) => p.y)) - by0 } };
}
