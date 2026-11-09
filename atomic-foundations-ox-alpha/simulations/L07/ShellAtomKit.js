// ShellAtomKit - the Bohr-atom drawing parts shared by the L07 and L08 scenes (shell rings,
// a nucleus that can wear a face, electrons, empty seats, and labels with raised charges and
// lowered formula digits). Not a scene. Flat fills with one darker cushion and one gloss spot,
// colours only from the scene's this.colors (closed palette), ASCII only.
import { alpha, darken, lighten, mix, font, inkOn, rr, stadium, drawFace, ellipse } from 'simulations/base/kit/SimLook.js';

const TAU = Math.PI * 2;

export const SHELL_NAMES = ['K', 'L', 'M'];

/** The course's atom colours, from the resolved tokens (same Na / Cl as L09's salt lattice). */
export function atomPal(c) {
  return {
    ring: [c.s1, c.s5, c.s4],                 // K, L, M
    ringInk: [c.s1ink, c.s5ink, c.s4ink],
    plain: mix(c.label, c.bgSurface, 0.55),   // a shell ring when the shell itself is not the point
    e: c.s2,                                  // an electron
    eIn: mix(c.s1, c.label, 0.15),            // an inner (buried) electron
    eInk: c.s2ink,
    nuc: mix(c.s6, c.s8, 0.35),               // a generic nucleus
    na: mix(c.s5, c.s4, 0.2),
    cl: mix(c.s3, c.s7, 0.3),
    mg: mix(c.s8, c.s2, 0.35),
    s: mix(c.s2, c.s3, 0.45),
    plus: c.s8, plusInk: c.s8ink,             // a cation's charge
    minus: c.s7, minusInk: c.s7ink,           // an anion's charge
    full: c.good,
  };
}

/** n points spread evenly round a ring, the first at angle a0 (default straight up). */
export function ringPts(x, y, r, n, a0 = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i * TAU) / Math.max(1, n);
    out.push({ x: x + r * Math.cos(a), y: y + r * Math.sin(a), a });
  }
  return out;
}

/**
 * A shell ring. o: { a, w (line width), dash, full (0..1: a green halo for a full shell),
 * hi (0..1: a highlight halo in o.hiCol) }.
 */
export function drawRing(ctx, c, x, y, r, col, o = {}) {
  const a = o.a ?? 1;
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const halo = (k, hc) => {
    if (!(k > 0)) return;
    ctx.strokeStyle = alpha(hc, 0.28 * k);
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  };
  halo(o.full, c.good);
  halo(o.hi, o.hiCol ?? c.warning);
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeStyle = alpha(darken(col, 0.35), 0.35);
  ctx.lineWidth = (o.w ?? 2.5) + 2;
  ctx.beginPath(); ctx.arc(x, y + 1.5, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = o.full > 0.5 ? mix(col, c.good, 0.6) : col;
  ctx.lineWidth = o.w ?? 2.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.restore();
}

/**
 * A nucleus: a flat ball with a darker cushion and a gloss spot. o: { a, face: mood or null,
 * look, sym (drawn in the ball when there is no face), symSize, ring (outline colour) }.
 */
export function drawNucleus(ctx, c, x, y, r, col, o = {}) {
  const a = o.a ?? 1;
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.arc(x, y + r * 0.12, r, 0, TAU);
  ctx.fillStyle = darken(col, 0.4); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = col; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.beginPath(); ctx.arc(x, y, r * 2, 0, TAU);
  ctx.arc(x - r * 0.22, y - r * 0.28, r, 0, TAU, true);
  ctx.fillStyle = alpha(darken(col, 0.25), 0.55); ctx.fill();
  ctx.restore();
  ellipse(ctx, x - r * 0.42, y - r * 0.5, r * 0.24, r * 0.14, -0.6);
  ctx.fillStyle = alpha(lighten(col, 0.85), 0.75); ctx.fill();
  if (o.ring) {
    ctx.strokeStyle = o.ring; ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.beginPath(); ctx.arc(x, y, r + 2, 0, TAU); ctx.stroke();
  }
  if (o.face) drawFace(ctx, x, y + r * 0.06, r, { col, c, mood: o.face, look: o.look, t: 0 });
  else if (o.sym) {
    const sz = o.symSize ?? Math.max(14, Math.round(r * 0.8));
    drawRich(ctx, c, o.sym, x, y + 1, { size: sz, weight: 900, col: inkOn(c, col), align: 'center' });
  }
  ctx.restore();
}

/** An electron: a flat dot with a lift and a gloss spot. o: { a, glow (0..1) }. */
export function drawElectron(ctx, c, x, y, r, col, o = {}) {
  const a = o.a ?? 1;
  if (a <= 0 || r <= 0.3) return;
  ctx.save();
  ctx.globalAlpha *= a;
  if (o.glow > 0) {
    ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, TAU);
    ctx.fillStyle = alpha(col, 0.25 * o.glow); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y + r * 0.22, r, 0, TAU);
  ctx.fillStyle = darken(col, 0.45); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.33, y - r * 0.33, r * 0.3, 0, TAU);
  ctx.fillStyle = alpha(lighten(col, 0.9), 0.85); ctx.fill();
  ctx.restore();
}

/** An empty seat for an electron: a dashed ring. o: { a, glow (0..1) }. */
export function drawSlot(ctx, c, x, y, r, col, o = {}) {
  const a = o.a ?? 1;
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  if (o.glow > 0) {
    ctx.beginPath(); ctx.arc(x, y, r * 2, 0, TAU);
    ctx.fillStyle = alpha(col, 0.22 * o.glow); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = alpha(c.bgSurface, 0.9); ctx.fill();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// -- Labels with charges and formula digits -------------------------------------------------
// "Na^+", "Mg^2+", "S^2-", "n^2" raise the charge or power; "MgCl_2" lowers the digit. The body font has no
// superscript or subscript glyphs, so they are drawn small and shifted.

function parts(s) {
  const out = [];
  const re = /\^([0-9]+[+-]?|[+-])|_([0-9]+)/g;
  let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: s.slice(i, m.index), k: 0 });
    if (m[1] != null) out.push({ t: m[1].replace('-', '\u2212'), k: 1 });
    else out.push({ t: m[2], k: -1 });
    i = re.lastIndex;
  }
  if (i < s.length) out.push({ t: s.slice(i), k: 0 });
  return out;
}

const smallPx = (size) => Math.max(14, Math.round(size * 0.72));

/** Width of a label drawn by drawRich. */
export function richWidth(ctx, c, s, size = 16, weight = 800) {
  let w = 0;
  ctx.save();
  for (const p of parts(String(s))) {
    ctx.font = font(c, weight, p.k ? smallPx(size) : size);
    w += ctx.measureText(p.t).width;
  }
  ctx.restore();
  return w;
}

/** Draw a label with raised charges and lowered digits. o: { size, weight, col, align }. Returns its width. */
export function drawRich(ctx, c, s, x, y, o = {}) {
  const size = o.size ?? 16, weight = o.weight ?? 800;
  const w = richWidth(ctx, c, s, size, weight);
  let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  ctx.save();
  ctx.fillStyle = o.col ?? c.label;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const p of parts(String(s))) {
    ctx.font = font(c, weight, p.k ? smallPx(size) : size);
    ctx.fillText(p.t, cx, p.k > 0 ? y - size * 0.34 : p.k < 0 ? y + size * 0.3 : y);
    cx += ctx.measureText(p.t).width;
  }
  ctx.restore();
  return w;
}

/** A kit-style chip (flat fill, darker lift) whose text may carry charges and digits. o: { bg, ink, size, align, scale, alpha }. */
export function richPill(ctx, c, s, x, y, o = {}) {
  const size = Math.max(14, o.size ?? 15);
  const bg = o.bg ?? c.accent;
  const w = richWidth(ctx, c, s, size, 800) + 26, h = size + 15;
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  const sc = o.scale ?? 1, a = o.alpha ?? 1;
  if (sc <= 0.02 || a <= 0) return { x0, y0: y - h / 2, w, h };
  const cx = x0 + w / 2, sw = w * sc, sh = h * sc;
  ctx.save();
  ctx.globalAlpha *= a;
  stadium(ctx, cx - sw / 2, y - sh / 2 + 3.5 * sc, sw, sh);
  ctx.fillStyle = darken(bg, 0.38); ctx.fill();
  rr(ctx, cx - sw / 2, y - sh / 2, sw, sh, sh / 2);
  ctx.fillStyle = bg; ctx.fill();
  drawRich(ctx, c, s, cx, y + sc, { size: size * sc, weight: 800, col: o.ink ?? inkOn(c, bg), align: 'center' });
  ctx.restore();
  return { x0, y0: y - h / 2, w, h };
}

/** A small rounded tag in the top-right corner naming the model's simplification. */
export function cornerTag(ctx, c, s) {
  ctx.save();
  ctx.font = font(c, 700, 14);
  const w = ctx.measureText(s).width;
  rr(ctx, 664 - w - 20, 10, w + 20, 24, 12);
  ctx.fillStyle = alpha(c.bgSurface, 0.85); ctx.fill();
  ctx.fillStyle = c.labelMuted;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(s, 654, 23);
  ctx.restore();
}
