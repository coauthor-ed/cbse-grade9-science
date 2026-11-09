// CellArt.js - living-looking cells and chromosomes for the division scenes. Not a scene. SVG strings, tokens only, no
// faces. Cytoplasm has grain and small organelles, the membrane is soft, the nucleus is translucent. A chromosome is a
// banded, waisted rod; its copy sits against it. Pairs share a shape and take their colour from the series, the two
// members of a pair told apart by shade: dark from one parent, light from the other. Needs frame() from PlantArt for its
// gradients.
//   cellBody(x, y, rx, ry, o)        o: nucleus (default true), nr, pinch 0..1, seed
//   rod(x, y, h, col, o)             one chromosome at (x, y). o: rot, w, dim
//   doubled(x, y, h, col, o)         a chromosome with its copy
//   pairTone(i, side)                colour of pair i (0..); side 0 dark, 1 light
//   sperm(x, y, s, o), egg(x, y, r, o)   a sperm, head to the right; an egg with its coat and nucleus. o: rot, wave, nr
//   yeastCell(x, y, r, o)            a yeast cell with a vacuole. o: rot, bud (0..1 size of a joined bud), budAt (radians)
//   hydra(x, y, s, o)                origin the foot; a soft tube about 330 tall with its tentacles, a ring of slender tentacles at the top,
//                                    a foot pad at the base. o: L, tentL, lean, n (tentacles), buds [{ t, side, len, n }], lite (small use), tentW, line, pale
//   hydraThumb(x, y, h, o)           the same animal for a small panel: origin the foot, about h tall to the crown of its tentacles. o: flip. Best on a dark field, as in hydra's hero
import { fill, stroke, textureRect } from './PlantArt.js';

const n1 = (v) => Math.round(v * 10) / 10;
const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
let uid = 0;
export const pairTone = (i, side = 0) => (side ? `color-mix(in oklab, var(--sim-series-${i + 1}) 52%, var(--sim-elev-peak))` : `color-mix(in oklab, var(--sim-series-${i + 1}) 82%, var(--sim-strata-6))`);
const RIM = 'var(--sim-membrane)', NRIM = 'var(--sim-nucleus-stroke, var(--sim-nucleus))';

export function cellBody(x, y, rx, ry, o = {}) {
  const p = o.pinch ?? 0, w = ry * (1 - 0.72 * p), id = `cb${(uid = (uid + 1) % 1000)}`, r = rnd((o.seed ?? 3) + Math.round(rx));
  const d = p > 0
    ? `M${n1(x - rx)} ${n1(y)}C${n1(x - rx)} ${n1(y - ry * 1.3)} ${n1(x - rx * 0.3)} ${n1(y - ry)} ${n1(x)} ${n1(y - w)}C${n1(x + rx * 0.3)} ${n1(y - ry)} ${n1(x + rx)} ${n1(y - ry * 1.3)} ${n1(x + rx)} ${n1(y)}C${n1(x + rx)} ${n1(y + ry * 1.3)} ${n1(x + rx * 0.3)} ${n1(y + ry)} ${n1(x)} ${n1(y + w)}C${n1(x - rx * 0.3)} ${n1(y + ry)} ${n1(x - rx)} ${n1(y + ry * 1.3)} ${n1(x - rx)} ${n1(y)}Z`
    : `M${n1(x - rx)} ${n1(y)}a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(2 * rx)} 0a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(-2 * rx)} 0Z`;
  let org = '', mito = '';
  const count = Math.round(Math.min(46, 10 + rx * ry / 420));
  for (let i = 0; i < count; i++) {
    const a = r() * 6.28, q = 0.56 + r() * 0.38, px = x + Math.cos(a) * rx * q, py = y + Math.sin(a) * ry * q * (p ? w / ry + 0.1 : 1), z = 0.7 + rx * 0.006 * r() * 2;
    if (i % 5 === 0) mito += `<ellipse cx="${n1(px)}" cy="${n1(py)}" rx="${n1(z * 5)}" ry="${n1(z * 2.4)}" transform="rotate(${Math.round(a * 57)} ${n1(px)} ${n1(py)})" style="fill:color-mix(in oklab, var(--sim-strata-2) 44%, var(--sim-elev-peak));stroke:var(--sim-strata-3);stroke-width:.8;opacity:.8"/>`;
    else org += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${n1(z * 1.4)}" style="fill:var(--sim-membrane);opacity:.3"/>`;
  }
  let s = `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" style="fill:${RIM};opacity:.3;filter:url(#pa-soft)"/><path d="${d}" style="fill:url(#pa-cyto) color-mix(in oklab, ${RIM} 22%, var(--sim-elev-peak))"/>`;
  s += `<g clip-path="url(#${id})">${textureRect(x - rx * 1.1, y - ry * 1.4, rx * 2.2, ry * 2.8, 'grain', 0.16)}${org}${mito}</g>`;
  s += `<path d="${d}" style="fill:none;stroke:${RIM};stroke-width:${n1(Math.max(5, rx * 0.05))};opacity:.22;filter:url(#pa-soft)"/><path d="${d}" style="fill:none;stroke:color-mix(in oklab, ${RIM} 70%, var(--sim-elev-peak));stroke-width:2.2"/><path d="${d}" style="fill:none;stroke:var(--sim-elev-peak);stroke-width:1.2;opacity:.8" transform="translate(${n1(x * 0.03)} ${n1(y * 0.03)}) scale(0.97)"/>`;
  if (o.nucleus !== false) {
    const nr = o.nr ?? Math.min(rx, ry) * 0.62;
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(nr)}" style="fill:url(#pa-nuc) var(--sim-ice);stroke:${NRIM};stroke-width:1.6;stroke-opacity:.7;stroke-dasharray:${n1(nr * 0.2)} 2"/><ellipse cx="${n1(x - nr * 0.34)}" cy="${n1(y - nr * 0.44)}" rx="${n1(nr * 0.28)}" ry="${n1(nr * 0.13)}" style="fill:var(--sim-elev-peak);opacity:.6"/>`;
  }
  return s;
}
export function rod(x, y, h, col, o = {}) {
  const w = o.w ?? h * 0.24, r = o.rot ?? 0, ink = `color-mix(in oklab, ${col} 58%, var(--sim-strata-6))`;
  const body = `M${n1(-w / 2)} ${n1(-h / 2 + w / 2)}a${n1(w / 2)} ${n1(w / 2)} 0 0 1 ${n1(w)} 0V${n1(-w * 0.22)}q${n1(-w * 0.2)} ${n1(w * 0.22)} 0 ${n1(w * 0.44)}V${n1(h / 2 - w / 2)}a${n1(w / 2)} ${n1(w / 2)} 0 0 1 ${n1(-w)} 0V${n1(w * 0.22)}q${n1(w * 0.2)} ${n1(-w * 0.22)} 0 ${n1(-w * 0.44)}Z`;
  let bands = '';
  for (const u of [-0.38, -0.27, -0.14, 0.16, 0.25, 0.37]) bands += `M${n1(-w / 2)} ${n1(h * u)}H${n1(w / 2)}`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(r)})"${o.dim ? ' opacity="0.28"' : ''}><path d="${body}" ${fill(col, `stroke:${ink};stroke-width:1.6`)}/><path d="${bands}" style="stroke:${ink};stroke-width:${n1(Math.max(1, h * 0.022))};opacity:.6;fill:none"/><path d="M${n1(w * 0.22)} ${n1(-h / 2 + w * 0.6)}V${n1(-w * 0.3)}M${n1(w * 0.22)} ${n1(w * 0.3)}V${n1(h / 2 - w * 0.6)}" style="stroke:${ink};stroke-width:${n1(w * 0.26)};opacity:.4;fill:none"/><path d="M${n1(-w * 0.2)} ${n1(-h / 2 + w * 0.6)}V${n1(-w * 0.4)}" style="stroke:var(--sim-elev-peak);stroke-width:${n1(w * 0.2)};opacity:.6;fill:none;stroke-linecap:round"/></g>`;
}
export function doubled(x, y, h, col, o = {}) {
  const w = o.w ?? h * 0.24, r = (o.rot ?? 0) * Math.PI / 180, gap = w * 0.52, c = Math.cos(r), sn = Math.sin(r);
  return rod(x - c * gap, y - sn * gap, h, col, { ...o, w }) + rod(x + c * gap, y + sn * gap, h, col, { ...o, w });
}
export function sperm(x, y, s = 1, o = {}) {
  const w = o.wave ?? 0, col = 'color-mix(in oklab, var(--sim-series-5) 58%, var(--sim-elev-peak))', ink = 'color-mix(in oklab, var(--sim-series-5) 72%, var(--sim-strata-6))';
  const tail = `M-26 0C-40 ${n1(-13 + w)} -52 ${n1(13 - w)} -68 0S-96 ${n1(-13 + w)} -116 ${n1(5 - w)}`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(o.rot ?? 0)}) scale(${s})"><path d="${tail}" ${stroke(ink, 3.4)}/><path d="${tail}" ${stroke(col, 1.4)}/><path d="M-30 -3.4Q-22 -5 -18 -6V6Q-22 5 -30 3.4Z" ${fill(ink)}/><path d="M-20 0C-20 -16 8 -17 24 0C8 17 -20 16 -20 0Z" ${fill(col, `stroke:${ink};stroke-width:2.2`)}/><path d="M-13 0C-13 -10 4 -11 13 -1C4 7 -13 9 -13 0Z" ${fill(ink)} opacity=".62"/><path d="M6 -8Q18 -6 24 0" ${stroke('var(--sim-elev-peak)', 2)} opacity=".7"/></g>`;
}
export function egg(x, y, r, o = {}) {
  const ink = 'var(--sim-strata-3)', q = rnd(9); let cor = '', yolk = '';
  const n = 26; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + q() * 0.1, R = r * (1.22 + q() * 0.05), z = r * (0.09 + q() * 0.03); cor += `<ellipse cx="${n1(Math.cos(a) * R)}" cy="${n1(Math.sin(a) * R)}" rx="${n1(z * 1.2)}" ry="${n1(z)}" transform="rotate(${Math.round(a * 57)} ${n1(Math.cos(a) * R)} ${n1(Math.sin(a) * R)})" style="fill:color-mix(in oklab, var(--sim-strata-1) 54%, var(--sim-elev-peak));stroke:var(--sim-strata-2);stroke-width:1.2;opacity:.9"/>`; }
  for (let i = 0; i < 70; i++) { const a = q() * 6.28, R = r * (0.12 + Math.sqrt(q()) * 0.82); yolk += `<circle cx="${n1(Math.cos(a) * R)}" cy="${n1(Math.sin(a) * R)}" r="${n1(1 + q() * r * 0.024)}" style="fill:var(--sim-strata-2);opacity:.42"/>`; }
  return `<g transform="translate(${n1(x)} ${n1(y)})"><circle r="${n1(r * 1.16)}" style="fill:var(--sim-strata-1);opacity:.4;filter:url(#pa-soft)"/>${cor}<circle r="${n1(r * 1.09)}" style="fill:color-mix(in oklab, var(--sim-ice) 40%, var(--sim-elev-peak));opacity:.86;stroke:${ink};stroke-width:2"/><circle r="${n1(r)}" style="fill:url(#pa-egg) var(--sim-strata-1);stroke:${ink};stroke-width:1.6"/>${yolk}<ellipse cx="${n1(-r * 0.42)}" cy="${n1(-r * 0.52)}" rx="${n1(r * 0.24)}" ry="${n1(r * 0.11)}" style="fill:var(--sim-elev-peak);opacity:.7"/><circle r="${n1(r * (o.nr ?? 0.36))}" style="fill:url(#pa-nuc) var(--sim-ice);stroke:${NRIM};stroke-width:2.4;stroke-dasharray:${n1(r * 0.08)} 2.4"/></g>`;
}
export function yeastCell(x, y, r, o = {}) {
  const rot = o.rot ?? 0, b = o.bud ?? 0, a = o.budAt ?? -0.8, ink = 'var(--sim-strata-3)', F = 'url(#pa-yeast) var(--sim-strata-1)', q = rnd(Math.round(r * 7) + Math.round(x)), bx = x + Math.cos(a) * r * (0.96 + b * 0.54), by = y + Math.sin(a) * r * (0.84 + b * 0.54), br = r * (0.26 + b * 0.42);
  let g = ''; for (let i = 0; i < 7; i++) { const t = q() * 6.28, R = r * (0.3 + q() * 0.48); g += `<circle cx="${n1(x + Math.cos(t) * R)}" cy="${n1(y + Math.sin(t) * R * 0.8)}" r="${n1(r * 0.05)}" style="fill:var(--sim-strata-3);opacity:.6"/>`; }
  let s = `<ellipse cx="${n1(x + 2)}" cy="${n1(y + r * 0.12)}" rx="${n1(r * 1.06)}" ry="${n1(r * 0.94)}" style="fill:var(--sim-strata-6);opacity:.2;filter:url(#pa-soft)"/>`;
  if (b > 0) s += `<circle cx="${n1(bx)}" cy="${n1(by)}" r="${n1(br)}" style="fill:${F};stroke:${ink};stroke-width:2"/>`;
  s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(r)}" ry="${n1(r * 0.86)}" transform="rotate(${rot} ${n1(x)} ${n1(y)})" style="fill:${F};stroke:${ink};stroke-width:2.4"/>`;
  if (b > 0) s += `<circle cx="${n1(x + Math.cos(a) * r * 0.92)}" cy="${n1(y + Math.sin(a) * r * 0.8)}" r="${n1(br * 0.56)}" style="fill:var(--sim-strata-1)"/>`;
  s += `<circle cx="${n1(x + r * 0.2)}" cy="${n1(y + r * 0.14)}" r="${n1(r * 0.34)}" style="fill:color-mix(in oklab, var(--sim-ice) 60%, var(--sim-elev-peak));stroke:var(--sim-strata-5);stroke-width:1.4;opacity:.86"/>${g}<ellipse cx="${n1(x - r * 0.34)}" cy="${n1(y - r * 0.4)}" rx="${n1(r * 0.26)}" ry="${n1(r * 0.13)}" style="fill:var(--sim-elev-peak);opacity:.8"/>`;
  return s;
}

const HY_MID = 'color-mix(in oklab, var(--sim-elev-low) 46%, var(--sim-strata-1))';
const HY_LIT = `color-mix(in oklab, ${HY_MID} 36%, var(--sim-elev-peak))`, HY_DARK = `color-mix(in oklab, ${HY_MID} 58%, var(--sim-strata-6))`;
const tubePath = (pts) => { const l = [], r = []; pts.forEach(([a, b, w], i) => { const p = pts[Math.max(i - 1, 0)], q = pts[Math.min(i + 1, pts.length - 1)], dx = q[0] - p[0], dy = q[1] - p[1], h = Math.hypot(dx, dy) || 1; l.push(`${n1(a + (dy / h) * w)} ${n1(b - (dx / h) * w)}`); r.unshift(`${n1(a - (dy / h) * w)} ${n1(b + (dx / h) * w)}`); }); return `M${l.join('L')}L${r.join('L')}Z`; };
/** One slender tentacle: leaves its base along `deg` (0 up), arches out, then hangs, and tapers. Beads along it are its stinging cells. */
function hyTent(bx, by, deg, len, w, seed, beads, col = HY_LIT) {
  const N = 20, pts = []; let a = (deg * Math.PI) / 180, px = bx, py = by; const dir = deg < 0 ? -1 : 1;
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([px, py, Math.max(w * (1 - t * 0.86), 0.5)]); a += dir * (0.02 + t * 0.13) + Math.sin(t * 7 + seed) * 0.09; px += Math.sin(a) * len / N; py -= Math.cos(a) * len / N; }
  const d = tubePath(pts);
  let c = `<path d="${d}" style="fill:${HY_DARK};stroke:${HY_DARK};stroke-width:1.6;stroke-linejoin:round"/><path d="${d}" style="fill:${col}"/>`;
  if (beads) for (let i = 3; i < N - 1; i += 3) c += `<circle cx="${n1(pts[i][0])}" cy="${n1(pts[i][1])}" r="${n1(pts[i][2] * 0.62)}" style="fill:var(--sim-elev-peak);opacity:.6"/>`;
  return `<circle cx="${n1(bx)}" cy="${n1(by)}" r="${n1(w * 1.1)}" style="fill:${HY_MID}"/>${c}`;
}
export const HYDRA_FIELD = 'color-mix(in oklab, var(--sim-sea-deep) 34%, var(--sim-strata-6))';
export function hydra(x, y, s = 1, o = {}) {
  const L = o.L ?? 190, lean = o.lean ?? 12, lite = !!o.lite, N = o.n ?? (lite ? 5 : 7), g = `hyb${++uid}`, tentL = o.tentL ?? L * 0.92, tentW = o.tentW ?? (lite ? 3 : 4.2), lw = o.line ?? 1, tentCol = lite && !o.pale ? HY_MID : HY_LIT;
  const mid = (t) => [lean * Math.sin(t * 2.7), -L * t];
  const wk = Math.min(1, L / 190) ** 1.4, wid = (t) => wk * (t < 0.14 ? 7 + 8 * t : 8 + 17 * Math.sin(Math.min((t - 0.14) / 0.74, 1) * 1.57));
  const pts = []; for (let i = 0; i <= 26; i++) { const t = i / 26; pts.push([...mid(t), wid(t)]); }
  const body = tubePath(pts), [hx, hy] = mid(1), rw = wid(1);
  const paint = (d, sw) => `<path d="${d}" style="fill:url(#${g});stroke:${HY_DARK};stroke-width:${n1(sw * lw)};stroke-linejoin:round"/>`;
  let back = '', front = '', buds = '';
  // A ring: bases on an ellipse round the head. The far half goes behind the head, the near half over it.
  for (let i = 0; i < N; i++) {
    const u = (i - (N - 1) / 2) / ((N - 1) / 2), deg = u * 112 + (i % 2 ? 7 : -4), len = tentL * (0.86 + ((i * 37) % 10) * 0.03), bx = hx + u * rw * 0.9, by = hy - 1 + Math.abs(u) * 5;
    const t = hyTent(bx, by, deg, len, tentW, i * 1.7, !lite, tentCol);
    if (i % 2) front += t; else back += t;
  }
  for (const b of o.buds ?? [{ t: 0.46, side: 1, len: 0.5, n: 5 }]) {
    const [ax, ay] = mid(b.t), l = L * b.len, sd = b.side, w0 = wid(b.t) * 0.62, p2 = [], R = (u) => [ax + sd * (l * 0.86 * Math.sin(u * 1.2 + 0.1)), ay - l * 0.2 * u - l * 0.72 * u * u];
    for (let i = 0; i <= 14; i++) { const u = i / 14; p2.push([...R(u), w0 * (0.62 + 0.36 * Math.sin(u * 2.4 + 0.5))]); }
    const [ex, ey] = R(1), [fx, fy] = R(0.93), ang = (Math.atan2(ex - fx, fy - ey) * 180) / Math.PI;
    for (let i = 0; i < (b.n ?? 0); i++) { const u = b.n > 1 ? i / (b.n - 1) - 0.5 : 0; buds += hyTent(ex, ey, ang + u * 170, l * 0.5 * (0.9 + (i % 2) * 0.2), tentW * 0.72, i * 2.3 + 1, false, tentCol); }
    const bd = tubePath(p2);
    buds += paint(bd, lite ? 1.4 : 2) + `<path d="${tubePath(p2.map(([a, c, w]) => [a, c, w * 0.34]))}" style="fill:${HY_DARK};opacity:.28"/>`;
    if (!b.n) buds += `<circle cx="${n1(ex)}" cy="${n1(ey)}" r="${n1(p2[14][2])}" style="fill:url(#${g})"/>`;
  }
  let c = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${HY_LIT}"/><stop offset=".42" style="stop-color:${HY_MID}"/><stop offset="1" style="stop-color:${HY_DARK}"/></linearGradient></defs>`;
  c += back + buds + paint(body, lite ? 1.6 : 2.4);
  // The hollow inside shows through the soft wall; a wet light down one side; faint rings where the tube folds.
  c += `<path d="${tubePath(pts.slice(3, 25).map(([a, b, w]) => [a, b, w * 0.42]))}" style="fill:${HY_DARK};opacity:.34;filter:url(#pa-soft)"/>`;
  c += `<path d="M${pts.slice(5, 24).map(([a, b, w]) => `${n1(a - w * 0.58)} ${n1(b)}`).join('L')}" ${stroke('var(--sim-elev-peak)', lite ? 2 : 3.4, 'opacity:.46')}/>`;
  if (!lite) for (let i = 7; i < 23; i += 3) { const [a, b, w] = pts[i]; c += `<path d="M${n1(a - w * 0.9)} ${n1(b)}q${n1(w * 0.9)} ${n1(w * 0.26)} ${n1(w * 1.8)} 0" ${stroke(HY_DARK, 1.1, 'opacity:.34')}/>`; }
  const q = rnd(11); if (!lite) for (let i = 0; i < 26; i++) { const t = 0.16 + q() * 0.76, [a, b] = mid(t), w = wid(t) * (q() * 1.6 - 0.8); c += `<circle cx="${n1(a + w)}" cy="${n1(b)}" r="${n1(0.8 + q())}" style="fill:${HY_LIT};opacity:.6"/>`; }
  // The head: a small raised cone with the mouth at its tip, inside the ring of tentacles.
  c += `<path d="M${n1(hx - rw * 0.86)} ${n1(hy + 2)}Q${n1(hx - rw * 0.5)} ${n1(hy - rw * 0.86)} ${n1(hx)} ${n1(hy - rw * 0.98)}Q${n1(hx + rw * 0.5)} ${n1(hy - rw * 0.86)} ${n1(hx + rw * 0.86)} ${n1(hy + 2)}Z" style="fill:url(#${g});stroke:${HY_DARK};stroke-width:${lite ? 1.4 : 2}"/><circle cx="${n1(hx)}" cy="${n1(hy - rw * 0.8)}" r="${lite ? 1.4 : 2.4}" style="fill:${HY_DARK}"/>`;
  // The foot: the tube ends in a small flat pad, pressed on what it stands on.
  c += `<path d="M-13 3Q-11 -6 -7 -9Q0 -12 7 -9Q11 -6 13 3Q0 7 -13 3Z" style="fill:url(#${g});stroke:${HY_DARK};stroke-width:${lite ? 1.4 : 2}"/>`;
  c += front;
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${o.flip ? -s : s} ${s})">${c}</g>`;
}
/** hydra() at thumbnail size: the same proportions and the same side bud, with tentacles and line thickened to survive the scale. */
export function hydraThumb(x, y, h, o = {}) {
  const s = h / 300;
  return hydra(x, y, s, { lite: true, L: 190, tentL: 150, lean: 12, n: 7, tentW: Math.min(1.9 / s, 9), line: Math.min(0.5 / s, 2.6), pale: true, buds: [{ t: 0.3, side: 1, len: 0.46, n: 4 }], flip: o.flip });
}
