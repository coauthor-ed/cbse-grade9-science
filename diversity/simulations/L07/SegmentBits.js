// SegmentBits.js - shared by the three segment scenes of L07: an earthworm in soil and a beetle on a leaf, each in a
// rimmed window, with the segments of each shown. Not a scene.
import { lc, mx, ink, n1, fill, stroke, frame, seaLabel, earthwormSide, svgBio, BOX } from '../L06/BodyKit.js';

export function wormWindow(x, y, w, h, o = {}) {
  let g = `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="16" ${fill(lc('soil'))}/>`;
  for (let i = 0; i < 12; i++) g += `<circle cx="${n1(10 + (i * 89) % (w - 20))}" cy="${n1(10 + (i * 53) % (h - 20))}" r="${3 + i % 3}" ${fill(lc('soilDark'), 'opacity:0.5')}/>`;
  const n = 22, x0 = 16, x1 = w - 16, yy = h * 0.54, hh = Math.min(h * 0.14, 20), xs = [], hs = [];
  for (let i = 0; i <= n; i++) xs.push(x1 - (x1 - x0) * i / n);
  for (let i = 0; i < n; i++) hs.push(hh * (i === 0 ? 0.8 : 1));
  g += earthwormSide(xs, yy, hs, { band: [6, 9] });
  if (o.ring) for (let i = 8; i < 12; i++) g += `<rect x="${n1(xs[i + 1])}" y="${n1(yy - hh - 2)}" width="${n1(xs[i] - xs[i + 1])}" height="${n1(hh * 2 + 4)}" rx="3" ${stroke(lc('white'), 3)}/>`;
  return g + `<rect width="${w}" height="${h}" rx="16" ${stroke(ink, 3.5)}/></g>`;
}
export function beetleWindow(x, y, w, h, o = {}) {
  const [bx, by, bw, bh] = BOX.Beetle, k = Math.min((w * 0.72) / bw, (h * 0.86) / bh);
  const cx = w / 2 - (bx + bw / 2) * k, cy = h / 2 - (by + bh / 2) * k + 2;
  let g = `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="16" ${fill(mx(lc('grassLit'), lc('white'), 0.3))}/>`;
  g += `<path d="M${w * 0.1} ${h * 0.94}Q${w * 0.5} ${h * 0.6} ${w * 0.92} ${h * 0.06}" ${stroke(lc('grassDark'), 4, 'opacity:0.4')}/>`;
  g += svgBio('Beetle', cx, cy, k);
  // the abdomen's segments, lying under the wing cases, marked across them
  if (o.ring) for (let i = 0; i < 4; i++) { const yy = cy + (2 + i * 10) * k, hw = (26 - i * 4.5) * k; g += `<path d="M${n1(cx - hw)} ${n1(yy)}Q${n1(cx)} ${n1(yy + 6 * k)} ${n1(cx + hw)} ${n1(yy)}" ${stroke(lc('white'), 3, 'stroke-linecap:round')}/>`; }
  return g + `<rect width="${w}" height="${h}" rx="16" ${stroke(ink, 3.5)}/></g>`;
}
/** The pair: side by side in landscape, stacked in portrait. Returns { svg, a, b } with each window's box. */
export function pair(st, top, o = {}) {
  const { W, H, portrait: P } = st, m = 12, gap = 10;
  const a = P ? { x: m, y: top, w: W - 2 * m, h: (o.h1 ?? 130) } : { x: m, y: top, w: (W - 2 * m - gap) * 0.54, h: H - top - m };
  const b = P ? { x: m, y: top + a.h + gap, w: W - 2 * m, h: H - top - a.h - gap - m } : { x: m + a.w + gap, y: top, w: (W - 2 * m - gap) * 0.46, h: H - top - m };
  return { svg: wormWindow(a.x, a.y, a.w, a.h, o) + beetleWindow(b.x, b.y, b.w, b.h, o), a, b };
}
export { frame, seaLabel };
