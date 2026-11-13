/**
 * MotionGraph - the course graph board for position-time and velocity-time graphs
 * (L05-L07). Pure drawing helpers on top of kit SimPlot (plotFrame, axesOn, plotLine);
 * no scene state lives here. Manual: M/briefs/motion-graph-api.md. Summary:
 *
 *   graphLayout(w, h, { portrait, mode: 'strip' | 'side', road, strip })
 *       -> { road, graph, portrait }  rects. 'strip': a road strip across the top, the
 *       graph below (same both ways). 'side': road and graph side by side on a landscape
 *       host, stacked (road on top) when portrait (pass this.config?.isPortrait).
 *   graphFrame(rect, { x: { max, step, minor = 5, title }, y: { ... }, size = 26 })
 *       -> f: a SimPlot plotFrame with SQUARE small cells (minor cells per step) plus
 *       f.at([t, v]) -> [px, py], f.cell (px), f.sheet (the paper rect), f.base, f.opt.
 *   drawSheet(ctx, c, rect, { alpha, r })  a raised paper sheet (tables, panels).
 *   drawGraphPaper(ctx, c, f, { alpha })   the paper sheet (Quill rim and lip) with a flat
 *       grid inside the plot: thin small squares, a darker line every `minor` squares.
 *   drawAxes(ctx, c, f, t, { alpha })      axes building at t seconds (SimPlot axesOn, 26 px
 *       numbers), arrow ends, the origin O, axis titles; { done }. Pass a large t at rest.
 *   drawPoint(ctx, c, f, d, age, { col, r, alpha })  a ringed dot that pops in over 0.35 s.
 *   drawGuides(ctx, c, f, d, k, { col, alpha, from: 'x' | 'y' })  dashed guide from the
 *       X-axis up to the point, then across to the Y-axis (k 0..1 drawn on).
 *   curveData(fn, t0, t1, n)               data [[t, fn(t)]...] computed from a formula.
 *   drawThrough(ctx, c, f, data, k, { col, width, head, alpha })  a line or curve through
 *       the data drawing on (k 0..1) with a head dot; { head, done }.
 *   drawCellRun(ctx, c, f, axis, from, to, k, { col })  outlines the small squares on an
 *       axis from one value to another (for "5 squares = 1 s"); returns its box.
 *   drawBracket(ctx, c, f, a, b, label, { side, gap, col, size })  a bracket between two
 *       data points along one axis (vertical when a and b share t) with its label.
 *   drawTag(ctx, c, text, x, y, { col, size, avoid, segs, prefer, alpha })  a tag near (x, y)
 *       placed clear of the avoid boxes and the polyline segs; returns its box.
 *   roadSpec(rect, from, to, { pad, y })   a kit trackSpec fitted to the road rect.
 *   DIM                                    alpha for the parts a beat does not name (0.35).
 * Colours are resolved c.* tokens only (grid: series-3 like the book's green paper).
 */
import { plotFrame, axesOn, plotLine } from 'simulations/base/kit/SimPlot.js';
import { trackSpec, stackLayout } from 'simulations/base/kit/SimTrack.js';
import { alpha, darken, lighten, font, rr, clamp01, outBack } from 'simulations/base/kit/SimLook.js';

export const DIM = 0.35;
const SIZE = 26;

// -- Layout ----------------------------------------------------------------------------------

/** Rects for the road and the graph; the same arrangement for every scene in the wave. */
export function graphLayout(w = 680, h = 520, o = {}) {
  const portrait = !!o.portrait, pad = 12;
  if ((o.mode ?? 'strip') === 'strip') {
    const sh = o.strip ?? 132;
    return { portrait, road: { x: pad, y: pad, w: w - 2 * pad, h: sh }, graph: { x: pad, y: pad + sh + 6, w: w - 2 * pad, h: h - 2 * pad - sh - 6 } };
  }
  const r = o.road ?? (portrait ? 0.34 : 0.42);
  const [road, graph] = stackLayout(w, h, [r, 1 - r], { portrait, pad, gap: 10 });
  return { portrait, road, graph };
}

/** A trackSpec fitted to a road rect (pad at both ends; y = ground line). */
export function roadSpec(rect, from, to, o = {}) {
  const pad = o.pad ?? 36;
  return trackSpec({ from, to, x0: rect.x + pad, x1: rect.x + rect.w - pad, y: o.y ?? rect.y + rect.h * 0.45 });
}

// -- Frame -----------------------------------------------------------------------------------

/** A graph frame with square small cells inside rect; see the header. */
export function graphFrame(rect, o = {}) {
  const X = { min: 0, minor: 5, ...(o.x ?? {}) }, Y = { min: 0, minor: 5, ...(o.y ?? {}) };
  const size = o.size ?? SIZE;
  const digits = Math.max(String(Y.max).length, String(Y.min).length);
  const left = 22 + digits * size * 0.62, top = 46, bottom = size * 2 + 30, right = 34;
  const nx = Math.round(((X.max - X.min) / X.step) * X.minor), ny = Math.round(((Y.max - Y.min) / Y.step) * Y.minor);
  const aw = rect.w - left - right, ah = rect.h - top - bottom;
  const cell = Math.max(2, Math.min(aw / nx, ah / ny));
  const pw = cell * nx, ph = cell * ny;
  const px0 = rect.x + left + (aw - pw) / 2, py0 = rect.y + top + (ah - ph) / 2;
  const ticks = (A) => { const out = []; for (let v = A.min + A.step; v <= A.max + 1e-9; v += A.step) out.push(+v.toFixed(6)); return out; };
  // plotFrame with no axis labels puts the plot 54 px in and 18 px down, 38 px above the bottom.
  const fake = { x: px0 - 54, y: py0 - 18, w: pw + 54, h: ph + 56 };
  const f = plotFrame(fake, { x: { min: X.min, max: X.max, ticks: ticks(X), fmt: o.x?.fmt }, y: { min: Y.min, max: Y.max, ticks: ticks(Y), fmt: o.y?.fmt }, rightPad: 0 });
  f.xticks = ticks(X); f.yticks = ticks(Y);
  f.cell = cell; f.nx = nx; f.ny = ny; f.opt = { X, Y, size };
  f.base = f.plot.y + f.plot.h;
  f.at = (d) => [f.px(d[0]), f.py(d[1])];
  f.sheet = { x: f.plot.x - left + 6, y: f.plot.y - top + 2, w: pw + left + right - 10, h: ph + top + bottom - 6 };
  return f;
}

// -- Paper and axes ----------------------------------------------------------------------------

/** A raised paper sheet (Quill: lit top edge, shaded foot and lip, inner line, darker rim). */
export function drawSheet(ctx, c, S, o = {}) {
  const paper = c.bgSurface, rim = darken(c.stroke, 0.25), R = o.r ?? 16;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  rr(ctx, S.x, S.y + 6, S.w, S.h, R); ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.55); ctx.fill();
  rr(ctx, S.x, S.y, S.w, S.h, R); ctx.fillStyle = paper; ctx.fill();
  ctx.save(); rr(ctx, S.x, S.y, S.w, S.h, R); ctx.clip();
  ctx.fillStyle = alpha(darken(paper, 0.06), 0.9); ctx.fillRect(S.x, S.y + S.h - 18, S.w, 18);
  ctx.fillStyle = alpha(lighten(paper, 0.6), 0.7); ctx.fillRect(S.x + 10, S.y + 4, S.w - 20, 4);
  ctx.restore();
  rr(ctx, S.x + 5, S.y + 5, S.w - 10, S.h - 10, Math.max(4, R - 4)); ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(c.stroke, 0.35); ctx.stroke();
  rr(ctx, S.x, S.y, S.w, S.h, R); ctx.lineWidth = 2.5; ctx.strokeStyle = rim; ctx.stroke();
  ctx.restore();
}

/** The graph paper: a raised sheet (lit top, shaded lip, inner line, darker rim), flat grid inside. */
export function drawGraphPaper(ctx, c, f, o = {}) {
  const p = f.plot;
  ctx.save();
  drawSheet(ctx, c, f.sheet, o);
  ctx.globalAlpha = o.alpha ?? 1;
  // Flat grid inside the plot (maths look: no texture, no glow).
  const g = c.s3, X = f.opt.X, Y = f.opt.Y;
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    for (let i = 0; i <= f.nx; i++) {
      if ((i % X.minor === 0) !== (pass === 1)) continue;
      const x = Math.round(p.x + i * f.cell) + 0.5; ctx.moveTo(x, p.y); ctx.lineTo(x, p.y + p.h);
    }
    for (let j = 0; j <= f.ny; j++) {
      if ((j % Y.minor === 0) !== (pass === 1)) continue;
      const y = Math.round(p.y + p.h - j * f.cell) + 0.5; ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y);
    }
    ctx.lineWidth = pass ? 1.6 : 1; ctx.strokeStyle = alpha(g, pass ? 0.5 : 0.2); ctx.stroke();
  }
  ctx.restore();
}

/** Axes building at t s: kit axesOn (26 px numbers, no grid), then arrow ends, O and titles. */
export function drawAxes(ctx, c, f, t, o = {}) {
  const p = f.plot, size = f.opt.size, base = f.base;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  const r = axesOn(ctx, c, f, t, { grid: false, size, titleSize: size });
  const k = clamp01((t - 0.3) / 0.5);
  if (k > 0) {
    ctx.globalAlpha = (o.alpha ?? 1) * k;
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x + p.w, base); ctx.lineTo(p.x + p.w + 22, base); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 22); ctx.stroke();
    head(ctx, p.x + p.w + 28, base, 0); head(ctx, p.x, p.y - 28, -Math.PI / 2);
    ctx.font = font(c, 800, size); ctx.textBaseline = 'top'; ctx.textAlign = 'right';
    ctx.fillText('O', p.x - 8, base + 10);
  }
  const kt = clamp01((t - 0.9) / 0.4);
  if (kt > 0) {
    ctx.globalAlpha = (o.alpha ?? 1) * kt;
    ctx.fillStyle = c.label; ctx.font = font(c, 800, size);
    if (f.opt.Y.title) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(f.opt.Y.title, p.x + 16, p.y - 26); }
    if (f.opt.X.title) { ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(f.opt.X.title, p.x + p.w / 2, base + 12 + size + 30); }
  }
  ctx.restore();
  return { done: r.done && kt >= 1 };
}

function head(ctx, x, y, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-12, -8); ctx.lineTo(-8, 0); ctx.lineTo(-12, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// -- Data marks ----------------------------------------------------------------------------------

/** A ringed dot at data point d, popping in over 0.35 s (age in s; null or < 0: hidden). */
export function drawPoint(ctx, c, f, d, age, o = {}) {
  if (age == null || age < 0) return null;
  const [x, y] = f.at(d), s = Math.max(0, outBack(clamp01(age / 0.35))), r = (o.r ?? 9) * s, col = o.col ?? c.s1;
  if (r <= 0.5) return [x, y];
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fillStyle = c.bgSurface; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.38, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(col, 0.6), 0.85); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.35); ctx.stroke();
  ctx.restore();
  return [x, y];
}

/** Dashed guides for point d: up from the X-axis, then across to the Y-axis (k 0..1). */
export function drawGuides(ctx, c, f, d, k, o = {}) {
  if (!(k > 0)) return;
  const [x, y] = f.at(d), x0 = f.plot.x, yb = f.base;
  const L1 = yb - y, L2 = x - x0, L = L1 + L2 || 1, s = clamp01(k) * L;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.setLineDash([9, 7]); ctx.lineWidth = o.width ?? 3; ctx.lineCap = 'butt'; ctx.strokeStyle = o.col ?? c.annot;
  ctx.beginPath();
  ctx.moveTo(x, yb); ctx.lineTo(x, yb - Math.min(s, L1));
  if (s > L1) { ctx.moveTo(x, y); ctx.lineTo(x - Math.min(s - L1, L2), y); }
  ctx.stroke();
  ctx.restore();
}

/** Data [[t, fn(t)]] for n + 1 evenly spaced times from t0 to t1 (a curve from its formula). */
export function curveData(fn, t0, t1, n = 60) {
  return Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [t, fn(t)]; });
}

/** A line or curve through data drawing on (k 0..1, by length) via kit plotLine; { head, done }. */
export function drawThrough(ctx, c, f, data, k, o = {}) {
  const pts = data.map(f.at);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  const r = plotLine(ctx, c, pts, clamp01(k), { dur: 1, ease: (u) => u, col: o.col ?? c.s1, width: o.width ?? 5, head: o.head ?? k < 1, headR: 7, shade: (col) => darken(col, 0.3) });
  ctx.restore();
  return r;
}

/** Outline the small squares along an axis ('x' or 'y') from one value to another; returns the box. */
export function drawCellRun(ctx, c, f, axis, from, to, k = 1, o = {}) {
  const p = f.plot, col = o.col ?? c.annot, cell = f.cell;
  const b = axis === 'x'
    ? { x: f.px(from), y: f.base - cell, w: (f.px(to) - f.px(from)) * clamp01(k), h: cell }
    : { x: p.x, y: f.py(from) - (f.py(from) - f.py(to)) * clamp01(k), w: cell, h: (f.py(from) - f.py(to)) * clamp01(k) };
  if (!(k > 0)) return b;
  ctx.save();
  ctx.fillStyle = alpha(col, 0.22); ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.lineWidth = 1.2; ctx.beginPath();
  const n = Math.round((axis === 'x' ? b.w : b.h) / cell);
  for (let i = 1; i < n; i++) {
    if (axis === 'x') { ctx.moveTo(b.x + i * cell, b.y); ctx.lineTo(b.x + i * cell, b.y + b.h); }
    else { ctx.moveTo(b.x, b.y + b.h - i * cell); ctx.lineTo(b.x + b.w, b.y + b.h - i * cell); }
  }
  ctx.stroke();
  ctx.restore();
  return b;
}

/** A bracket between data points a and b (vertical when a[0] === b[0]) with a label; returns the label box. */
export function drawBracket(ctx, c, f, a, b, label, o = {}) {
  const [ax, ay] = f.at(a), [bx, by] = f.at(b), vert = a[0] === b[0], side = o.side ?? 1, gap = o.gap ?? 16, col = o.col ?? c.annot;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  if (vert) { const x = ax + side * gap; ctx.moveTo(x - side * 7, ay); ctx.lineTo(x, ay); ctx.lineTo(x, by); ctx.lineTo(x - side * 7, by); }
  else { const y = ay + side * gap; ctx.moveTo(ax, y - side * 7); ctx.lineTo(ax, y); ctx.lineTo(bx, y); ctx.lineTo(bx, y - side * 7); }
  ctx.stroke();
  ctx.restore();
  if (!label) return null;
  return vert
    ? drawTag(ctx, c, label, ax + side * (gap + 10), (ay + by) / 2, { col, size: o.size, align: side > 0 ? 'left' : 'right', alpha: o.alpha })
    : drawTag(ctx, c, label, (ax + bx) / 2, ay + side * (gap + 22), { col, size: o.size, alpha: o.alpha });
}

const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function segHit(box, segs) {
  if (!segs || segs.length < 2) return false;
  for (let i = 1; i < segs.length; i++) {
    const [x0, y0] = segs[i - 1], [x1, y1] = segs[i];
    for (let s = 0; s <= 8; s++) { const x = x0 + ((x1 - x0) * s) / 8, y = y0 + ((y1 - y0) * s) / 8; if (x > box.x - 4 && x < box.x + box.w + 4 && y > box.y - 4 && y < box.y + box.h + 4) return true; }
  }
  return false;
}

/**
 * A tag (text on a light chip with a tone rim) near (x, y), placed clear of o.avoid boxes and the
 * o.segs polyline (px). o.align: 'center' | 'left' | 'right' anchoring; o.prefer: candidate offsets
 * [[dx, dy]...] tried in order. Returns the box drawn.
 */
export function drawTag(ctx, c, text, x, y, o = {}) {
  const size = o.size ?? SIZE, col = o.col ?? c.label;
  ctx.save();
  ctx.font = font(c, 800, size);
  const w = ctx.measureText(text).width + 20, h = size + 12;
  const ax = o.align === 'left' ? 0 : o.align === 'right' ? -w : -w / 2;
  const cands = o.prefer ?? [[0, 0], [0, -h - 6], [0, h + 6], [w / 2 + 12, 0], [-w / 2 - 12, 0], [0, -2 * h - 10], [0, 2 * h + 10]];
  let box = null;
  for (const [dx, dy] of cands) {
    const b = { x: x + ax + dx, y: y - h / 2 + dy, w, h };
    if (!(o.avoid ?? []).some((a) => a && hit(a, b)) && !segHit(b, o.segs)) { box = b; break; }
  }
  box = box ?? { x: x + ax, y: y - h / 2, w, h };
  ctx.globalAlpha = o.alpha ?? 1;
  rr(ctx, box.x, box.y + 3, w, h, 10); ctx.fillStyle = alpha(darken(col, 0.3), 0.35); ctx.fill();
  rr(ctx, box.x, box.y, w, h, 10); ctx.fillStyle = c.bgSurface; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col === c.label ? c.label : darken(col, 0.05); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, box.x + w / 2, box.y + h / 2 + 1);
  ctx.restore();
  return box;
}
