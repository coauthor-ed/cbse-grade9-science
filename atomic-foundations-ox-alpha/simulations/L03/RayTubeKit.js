// RayTubeKit - drawing helpers shared by the lesson 3 tube scenes (CathodeRayScene,
// RivalLineupScene, GhostScaleScene) and the bead / stamp look of the other L03 / L04 scenes.
// Helpers only, no scene. Colours come from the scene's this.colors (kit COLOR_TOKEN_MAP keys).
import { alpha, darken, lighten, luma, mix, rr, font, inkOn } from 'simulations/base/kit/SimLook.js';

const TAU = Math.PI * 2;

/** A glass discharge tube lying on its side: a capsule from x0 to x1, centre cy, half-height hh. */
export function glassTube(ctx, c, x0, x1, cy, hh, o = {}) {
  const r = hh;
  const light = o.light ?? false;
  ctx.save();
  // the gas glow inside (a tint, faint)
  rr(ctx, x0, cy - hh, x1 - x0, hh * 2, r);
  ctx.fillStyle = alpha(o.gas ?? c.glass, light ? 0.16 : 0.12);
  ctx.fill();
  // body: dense at both edges, clear across the middle
  const g = ctx.createLinearGradient(0, cy - hh, 0, cy + hh);
  g.addColorStop(0, alpha(darken(c.glass, 0.1), 0.42));
  g.addColorStop(0.18, alpha(c.glass, 0.1));
  g.addColorStop(0.8, alpha(c.glass, 0.08));
  g.addColorStop(1, alpha(darken(c.glass, 0.25), 0.5));
  rr(ctx, x0, cy - hh, x1 - x0, hh * 2, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/** The front of the tube, over what is inside: the rim and the key light's streak. */
export function glassTubeFront(ctx, c, x0, x1, cy, hh) {
  ctx.save();
  rr(ctx, x0, cy - hh, x1 - x0, hh * 2, hh);
  ctx.strokeStyle = alpha(mix(c.glass, c.label, 0.25), 0.9);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.75);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0 + hh * 0.9, cy - hh * 0.72);
  ctx.lineTo(x1 - hh * 1.3, cy - hh * 0.72);
  ctx.stroke();
  ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1 - hh * 1.0, cy - hh * 0.72);
  ctx.lineTo(x1 - hh * 0.7, cy - hh * 0.72);
  ctx.stroke();
  ctx.restore();
}

/** A glowing beam along a polyline pts [[x, y], ...]: wide soft glow, mid glow, bright core. */
export function beam(ctx, c, pts, col, k = 1) {
  if (pts.length < 2 || k <= 0) return;
  const trace = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = alpha(col, 0.18 * k); ctx.lineWidth = 16; trace(); ctx.stroke();
  ctx.strokeStyle = alpha(col, 0.45 * k); ctx.lineWidth = 7; trace(); ctx.stroke();
  ctx.strokeStyle = alpha(lighten(col, 0.55), 0.95 * k); ctx.lineWidth = 2.5; trace(); ctx.stroke();
  ctx.restore();
}

/** Point at fraction u (0..1) of the way along a polyline. */
export function along(pts, u) {
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let s = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? Math.min(1, s / seg[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    s -= seg[i];
  }
  return pts[pts.length - 1];
}

/** n bright dots riding the beam at phase t (0..1 repeating): the particles in the ray. */
export function beamDots(ctx, c, pts, t, n, col, r = 3.4) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = ((t + i / n) % 1 + 1) % 1;
    const [x, y] = along(pts, u);
    ctx.fillStyle = alpha(col, 0.35);
    ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = lighten(col, 0.7);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/** A flat bead with one darker cushion shade and one gloss highlight (electrons, balls, atoms). */
export function bead(ctx, x, y, r, col, o = {}) {
  if (r <= 0.3) return;
  ctx.save();
  if (o.a != null) ctx.globalAlpha *= o.a;
  ctx.fillStyle = darken(col, 0.3);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x - r * 0.07, y - r * 0.1, r * 0.88, 0, TAU); ctx.fill();
  ctx.fillStyle = alpha(lighten(col, 0.75), 0.85);
  ctx.beginPath(); ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.28, r * 0.17, -0.6, 0, TAU); ctx.fill();
  if (o.sign) {
    ctx.fillStyle = inkOn(o.c, col);
    ctx.font = font(o.c, 900, Math.max(14, r * 1.2));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.sign, x - r * 0.05, y - r * 0.02);
  }
  ctx.restore();
}

/** A charged plate seen edge-on: a rounded bar, lit by its charge colour when on (0..1). */
export function plate(ctx, c, x0, x1, y, col, on, sign) {
  const h = 10;
  const fill = on > 0.02 ? mix(c.waste, col, on) : c.waste;
  ctx.save();
  if (on > 0.02) {
    ctx.fillStyle = alpha(col, 0.18 * on);
    rr(ctx, x0 - 8, y - h / 2 - 8, x1 - x0 + 16, h + 16, 12); ctx.fill();
  }
  rr(ctx, x0, y - h / 2 + 3, x1 - x0, h, 4); ctx.fillStyle = darken(fill, 0.35); ctx.fill();
  rr(ctx, x0, y - h / 2, x1 - x0, h, 4); ctx.fillStyle = fill; ctx.fill();
  ctx.fillStyle = alpha(lighten(fill, 0.6), 0.6); ctx.fillRect(x0 + 5, y - h / 2 + 1.5, x1 - x0 - 10, 2);
  if (sign && on > 0.02) {
    ctx.globalAlpha *= on;
    bead(ctx, x1 + 18, y, 12, col, { sign, c });
  }
  ctx.restore();
}

/** A rubber stamp, slammed in at k (0..1+): a rounded frame with bold text, tilted. */
export function stamp(ctx, c, text, x, y, col, k, o = {}) {
  if (k <= 0) return;
  const size = o.size ?? 22;
  const s = k < 1 ? 1.5 - 0.5 * Math.min(1, k) : 1;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, k * 2);
  ctx.translate(x, y);
  ctx.rotate(o.rot ?? -0.12);
  ctx.font = font(c, 900, size * s, true);
  const w = ctx.measureText(text).width + 26 * s, h = size * s + 18 * s;
  ctx.fillStyle = alpha(c.bgSurface, 0.92);
  rr(ctx, -w / 2, -h / 2, w, h, 8 * s); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 3.5 * s;
  rr(ctx, -w / 2, -h / 2, w, h, 8 * s); ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

/** A clamp stand foot and rod holding the tube up from the bench (x, from yTop down to yBench). */
export function standRod(ctx, c, x, yTop, yBench) {
  const metal = mix(c.waste, c.label, 0.25);
  ctx.save();
  rr(ctx, x - 3, yTop, 6, yBench - yTop, 3); ctx.fillStyle = darken(metal, 0.15); ctx.fill();
  rr(ctx, x - 26, yBench - 8, 52, 10, 4); ctx.fillStyle = darken(metal, 0.35); ctx.fill();
  rr(ctx, x - 26, yBench - 10, 52, 8, 4); ctx.fillStyle = metal; ctx.fill();
  rr(ctx, x - 12, yTop - 6, 24, 10, 4); ctx.fillStyle = darken(metal, 0.25); ctx.fill();
  ctx.restore();
}

// ---- the whole tube, big, for the L03 scenes (added for the atomic-foundations rewrite) --------

export const RIG = { x0: 34, x1: 646, cy: 186, hh: 92, cath: 96, anode: 196, px0: 280, px1: 452, gap: 54, far: 628 };

/** The ray's path. bend: px at the far end, up towards the + plate when positive. */
export function rayPath(bend, y0 = RIG.cy) {
  const pts = [[RIG.cath + 10, y0], [RIG.px0, y0]];
  const N = 16, L = RIG.px1 - RIG.px0;
  const slopeOut = bend / ((RIG.far - RIG.px1) + L / 2);
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    pts.push([RIG.px0 + L * u, y0 - slopeOut * (L / 2) * u * u]);
  }
  pts.push([RIG.far, y0 - bend]);
  return pts;
}

/**
 * The tube on the bench. o: { bench, plates (0..1), bend, beam (0..1), beamCol, metal (cathode tone),
 * gas (tint), labels (bool), dots ({ t, n, r }: particles on the ray), ghost (px: a dashed path), ghostCol }
 */
export function drawRayRig(ctx, c, o = {}) {
  const R = RIG, bench = o.bench ?? 400;
  const metal = o.metal ?? mix(c.waste, c.label, 0.3);
  standRod(ctx, c, 340, R.cy + R.hh - 6, bench);
  standRod(ctx, c, 560, R.cy + R.hh - 6, bench);
  glassTube(ctx, c, R.x0, R.x1, R.cy, R.hh, { gas: o.gas });
  // the far screen
  rr(ctx, R.far - 4, R.cy - R.hh * 0.78, 10, R.hh * 1.56, 5);
  ctx.fillStyle = mix(c.s3, c.bgSurface, 0.45); ctx.fill();
  // cathode: a metal disc, anode: a ring with a slot
  rr(ctx, R.cath - 8, R.cy - 50, 18, 100, 7); ctx.fillStyle = metal; ctx.fill();
  ctx.strokeStyle = darken(metal, 0.32); ctx.lineWidth = 3; ctx.stroke();
  const an = mix(c.waste, c.label, 0.3);
  for (const s of [-1, 1]) {
    rr(ctx, R.anode - 7, s > 0 ? R.cy + 10 : R.cy - 54, 14, 44, 5); ctx.fillStyle = an; ctx.fill();
    ctx.strokeStyle = darken(an, 0.32); ctx.lineWidth = 3; ctx.stroke();
  }
  const p = o.plates ?? 0;
  plateBar(ctx, c, R.cy - R.gap, c.proton, p, '+');
  plateBar(ctx, c, R.cy + R.gap, c.electron, p, '-');
  const bend = o.bend ?? 0, path = rayPath(bend);
  if (o.ghost != null) {
    const g = rayPath(o.ghost);
    ctx.save();
    ctx.setLineDash([11, 11]); ctx.lineCap = 'round';
    ctx.strokeStyle = o.ghostCol ?? c.labelMuted; ctx.lineWidth = 5;
    ctx.beginPath(); g.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
    ctx.restore();
  }
  const col = o.beamCol ?? c.electron;
  const k = o.beam ?? 1;
  if (k > 0) {
    beam(ctx, c, path, col, k);
    if (c.bgSurface && luma(c.bgDeep) > 0.5) {              // by day a pale core vanishes: a solid line under it
      ctx.save();
      ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.globalAlpha *= k;
      ctx.beginPath(); path.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      ctx.restore();
    }
    const end = path[path.length - 1];
    ctx.save();
    if (k > 0.5) {
      ctx.beginPath(); ctx.arc(end[0], end[1], 18, 0, TAU); ctx.fillStyle = alpha(lighten(col, 0.3), 0.45); ctx.fill();
      ctx.beginPath(); ctx.arc(end[0], end[1], 8.5, 0, TAU); ctx.fillStyle = lighten(col, 0.65); ctx.fill();
    }
    ctx.restore();
  }
  if (o.dots) beamDots(ctx, c, path, o.dots.t, o.dots.n, col, o.dots.r);
  glassTubeFront(ctx, c, R.x0, R.x1, R.cy, R.hh);
  return path;
}

function plateBar(ctx, c, y, col, on, sign) {
  const R = RIG, h = 14, fill = mix(mix(c.waste, c.label, 0.2), col, on);
  rr(ctx, R.px0, y - h / 2 + 4, R.px1 - R.px0, h, 5); ctx.fillStyle = darken(fill, 0.34); ctx.fill();
  rr(ctx, R.px0, y - h / 2, R.px1 - R.px0, h, 5); ctx.fillStyle = fill; ctx.fill();
  if (on > 0.3) {
    const sy = y + (sign === '+' ? -24 : 24);
    bead(ctx, (R.px0 + R.px1) / 2, sy, 17, col, { sign: sign === '-' ? '\u2212' : sign, c });
  }
}
