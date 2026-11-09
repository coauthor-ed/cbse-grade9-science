// Scapes.js - settings for the reproduction module's SVG scenes. Not a scene. Each returns a string to place first in a stage:
// a world with its own light, kept quiet so the subject leads. No two scenes should use the same one unchanged. Tokens only.
//   sky(W, H, o)                  o.warm 0..1, o.sun [x, y]
//   hills(W, y, o)                far ridges fading into the sky
//   orchard(W, y, o)              a band of far trees, softly out of focus
//   hedge(W, y, h, o)             a nearer mass of real leaves
//   gardenWall(W, y, h)           a shaded old wall, out of focus
//   field(W, H, top, o)           ploughed ground running to a horizon at top
//   grass(W, y, h, o)             a band of blades
//   bench(W, y, H, o)             a wooden bench top with grain and a front edge
//   slats(W, H, o)                a nursery shade wall with light falling through
//   tiles(W, H, o)                a tiled wall with light across it; o.cool
//   lightFall(W, H, x, o)         a slanting sheet of light
//   microField(W, H, o)           a field under a microscope: bright centre, soft cells out of focus; o.tone 'blue' 'green' 'warm'
//   water(W, H, o)                pond water with shafts of light
import { svgPlantColour as pc, blend as m, svgFoliage, textureRect, pathEllipse, fill } from './PlantArt.js';

const n1 = (v) => Math.round(v * 10) / 10;
const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
let uid = 0;
const id = () => `sc${(uid = (uid + 1) % 1000)}`;
const vgrad = (i, l) => `<linearGradient id="${i}" x1="0" y1="0" x2="0" y2="1">${l.map(([o, c, a]) => `<stop offset="${o}" style="stop-color:${c}${a !== undefined ? `;stop-opacity:${a}` : ''}"/>`).join('')}</linearGradient>`;

export function sky(W, H, o = {}) {
  const g = id(), r = id(), [sx, sy] = o.sun ?? [W * 0.18, H * 0.1], warm = o.warm ?? 0.3, low = `color-mix(in oklab, ${pc('skyPale')} ${Math.round(100 - warm * 60)}%, var(--sim-strata-1))`;
  return `<defs>${vgrad(g, [[0, pc('sky')], [0.7, pc('skyPale')], [1, low]])}<radialGradient id="${r}"><stop offset="0" style="stop-color:var(--sim-elev-peak);stop-opacity:.95"/><stop offset=".3" style="stop-color:var(--sim-strata-1);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--sim-strata-1);stop-opacity:0"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#${g})"/><circle cx="${sx}" cy="${sy}" r="${W * 0.34}" style="fill:url(#${r})"/>`
    + `<ellipse cx="${W * 0.62}" cy="${H * 0.16}" rx="${W * 0.2}" ry="16" style="fill:var(--sim-elev-peak);opacity:.62;filter:url(#pa-soft)"/><ellipse cx="${W * 0.86}" cy="${H * 0.26}" rx="${W * 0.14}" ry="10" style="fill:var(--sim-elev-peak);opacity:.5;filter:url(#pa-soft)"/>`;
}
export function hills(W, y, o = {}) {
  const r = rnd(o.seed ?? 2);
  const ridge = (base, amp, tone, a) => { let d = `M0 ${base}`; for (let i = 0; i <= 8; i++) d += `Q${n1(W * (i - 0.5) / 8)} ${n1(base - amp * (0.5 + r()))} ${n1(W * i / 8)} ${n1(base - amp * r() * 0.5)}`; return `<path d="${d}V${y + 400}H0Z" style="fill:${tone};opacity:${a}"/>`; };
  return ridge(y - 18, 42, `color-mix(in oklab, ${pc('skyPale')} 62%, var(--sim-strata-5))`, 0.7) + ridge(y - 4, 30, `color-mix(in oklab, var(--sim-elev-low) 52%, ${pc('skyPale')})`, 1);
}
export function orchard(W, y, o = {}) {
  let s = ''; const r = rnd(o.seed ?? 4), n = o.n ?? 9;
  for (let i = 0; i < n; i++) { const x = W * (i + 0.2 + r() * 0.6) / n, q = 0.34 + r() * 0.12; s += svgFoliage(x, y - 34 * q * 2, q, { rx: 96, ry: 76, n: 60, seed: i + 2 }); }
  return `<g style="filter:url(#pa-soft);opacity:.86">${s}</g>`;
}
export function hedge(W, y, h, o = {}) {
  let s = ''; const n = Math.ceil(W / 90);
  for (let i = 0; i <= n; i++) s += svgFoliage(W * i / n, y + h * 0.5, 1, { rx: 76, ry: h * 0.62, n: 150, seed: (o.seed ?? 1) + i });
  return `<g style="${o.soft === false ? '' : 'filter:url(#pa-soft);'}opacity:${o.a ?? 1}">${s}</g>`;
}
export function gardenWall(W, y, h) {
  const g = id(); let br = ''; const r = rnd(5);
  for (let row = 0; row * 22 < h; row++) for (let x = -(row % 2) * 30; x < W; x += 60) br += `<rect x="${x + 2}" y="${y + row * 22 + 2}" width="56" height="18" rx="3" style="fill:color-mix(in oklab, var(--sim-strata-2) ${50 + Math.round(r() * 30)}%, var(--sim-strata-5));opacity:${0.55 + r() * 0.3}"/>`;
  return `<defs>${vgrad(g, [[0, 'var(--sim-strata-1)'], [1, 'var(--sim-strata-5)']])}</defs><rect y="${y}" width="${W}" height="${h}" style="fill:url(#${g})"/><g style="filter:url(#pa-soft)">${br}</g>`;
}
export function field(W, H, top, o = {}) {
  const g = id(); let rows = ''; const cx = o.vanish ?? W * 0.6, n = 11;
  for (let i = 0; i <= n; i++) { const x = (i / n - 0.5) * W * 2.6 + W * 0.5; rows += `<path d="M${n1(cx)} ${top}L${n1(x - 16)} ${H}H${n1(x + 16)}Z" style="fill:var(--sim-strata-6);opacity:.2"/>`; }
  return `<defs>${vgrad(g, [[0, pc('soilLit')], [0.4, pc('soil')], [1, pc('soilDeep')]])}</defs><rect y="${top}" width="${W}" height="${H - top}" style="fill:url(#${g})"/>${rows}${textureRect(0, top, W, H - top, 'grain', 0.3)}`;
}
export function grass(W, y, h, o = {}) {
  const r = rnd(o.seed ?? 3), n = Math.round(W / (o.gap ?? 2.4)); let a = '', b = '';
  for (let i = 0; i < n; i++) { const x = r() * W, q = h * (0.5 + r() * 0.7), l = (r() - 0.5) * 12, s = `M${n1(x - 1.6)} ${y}Q${n1(x + l * 0.4)} ${n1(y - q * 0.6)} ${n1(x + l)} ${n1(y - q)}Q${n1(x + l * 0.5 + 2)} ${n1(y - q * 0.5)} ${n1(x + 1.6)} ${y}Z`; if (i % 2) a += s; else b += s; }
  return `<path d="${a}" ${fill(pc('leaf'))}/><path d="${b}" ${fill(pc('leafLit'))}/>`;
}
export function bench(W, y, H, o = {}) {
  const g = id(), n = o.planks ?? 4; let s = `<defs>${vgrad(g, [[0, `color-mix(in oklab, var(--sim-strata-3) 62%, var(--sim-strata-1))`], [1, 'var(--sim-strata-3)']])}</defs><rect y="${y}" width="${W}" height="${H - y}" style="fill:url(#${g})"/>`;
  for (let i = 1; i < n; i++) { const q = y + (H - y) * i / n; s += `<path d="M0 ${q}H${W}" style="stroke:var(--sim-strata-6);stroke-width:2;opacity:.5"/><path d="M0 ${q + 2}H${W}" style="stroke:var(--sim-strata-1);stroke-width:1;opacity:.4"/>`; }
  return s + textureRect(0, y, W, H - y, 'fibre', 0.36) + `<rect y="${y}" width="${W}" height="5" style="fill:var(--sim-strata-1);opacity:.45"/>`;
}
export function slats(W, H, o = {}) {
  const g = id(); let s = `<defs>${vgrad(g, [[0, 'color-mix(in oklab, var(--sim-strata-1) 60%, var(--sim-elev-peak))'], [1, 'color-mix(in oklab, var(--sim-strata-2) 60%, var(--sim-strata-5))']])}</defs><rect width="${W}" height="${H}" style="fill:url(#${g})"/>`;
  for (let x = 0; x < W; x += 54) s += `<rect x="${x}" width="4" height="${H}" style="fill:var(--sim-strata-6);opacity:.22"/><rect x="${x + 5}" width="2" height="${H}" style="fill:var(--sim-elev-peak);opacity:.3"/>`;
  return s + textureRect(0, 0, W, H, 'fibre', 0.2) + lightFall(W, H, W * 0.1) + lightFall(W, H, W * 0.5, { a: 0.26 });
}
export function tiles(W, H, o = {}) {
  const base = o.cool ? 'color-mix(in oklab, var(--sim-ice) 60%, var(--sim-elev-peak))' : 'color-mix(in oklab, var(--sim-strata-1) 36%, var(--sim-elev-peak))', g = id(), q = o.size ?? 56;
  let s = `<defs>${vgrad(g, [[0, 'var(--sim-elev-peak)', 0.4], [1, 'var(--sim-strata-5)', 0.4]])}</defs><rect width="${W}" height="${H}" style="fill:${base}"/>`, d = '';
  for (let x = q; x < W; x += q) d += `M${x} 0V${H}`;
  for (let y = q; y < H; y += q) d += `M0 ${y}H${W}`;
  return s + `<path d="${d}" style="stroke:var(--sim-strata-5);stroke-width:2;opacity:.26;fill:none"/><rect width="${W}" height="${H}" style="fill:url(#${g})"/>` + lightFall(W, H, W * 0.16, { a: 0.3 });
}
export function lightFall(W, H, x, o = {}) {
  const w = o.w ?? W * 0.2;
  return `<path d="M${n1(x)} 0H${n1(x + w)}L${n1(x + w + H * 0.5)} ${H}H${n1(x + H * 0.5)}Z" style="fill:var(--sim-elev-peak);opacity:${o.a ?? 0.32};filter:url(#pa-soft)"/>`;
}
export function microField(W, H, o = {}) {
  const t = { blue: 'var(--sim-ice)', green: 'color-mix(in oklab, var(--sim-elev-low) 26%, var(--sim-elev-peak))', warm: 'color-mix(in oklab, var(--sim-strata-1) 42%, var(--sim-elev-peak))' }[o.tone ?? 'blue'];
  const g = id(), r = rnd(o.seed ?? 6); let c = '';
  for (let i = 0; i < 9; i++) { const q = 18 + r() * 40; c += `<circle cx="${n1(r() * W)}" cy="${n1(r() * H)}" r="${n1(q)}" style="fill:var(--sim-membrane);opacity:${(0.07 + r() * 0.1).toFixed(2)}"/>`; }
  return `<defs><radialGradient id="${g}" cx=".42" cy=".4" r=".78"><stop offset="0" style="stop-color:var(--sim-elev-peak)"/><stop offset=".55" style="stop-color:${t}"/><stop offset="1" style="stop-color:color-mix(in oklab, ${t} 58%, var(--sim-strata-5))"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#${g})"/><g style="filter:url(#pa-softer)">${c}</g>${textureRect(0, 0, W, H, 'grain', 0.14)}`;
}
export function water(W, H, o = {}) {
  const g = id();
  return `<defs>${vgrad(g, [[0, 'color-mix(in oklab, var(--sim-sea-shallow) 72%, var(--sim-elev-low))'], [0.6, 'var(--sim-sea-deep)'], [1, 'color-mix(in oklab, var(--sim-sea-deep) 70%, var(--sim-strata-6))']])}</defs><rect width="${W}" height="${H}" style="fill:url(#${g})"/>${lightFall(W, H, W * 0.06, { a: 0.2 })}${lightFall(W, H, W * 0.42, { a: 0.14, w: W * 0.12 })}${lightFall(W, H, W * 0.68, { a: 0.16 })}${textureRect(0, 0, W, H, 'grain', 0.1)}`;
}
export const contact = (x, y, rx, ry = 7, a = 0.34) => `<path d="${pathEllipse(x, y, rx, ry)}" style="fill:${pc('ink')};opacity:${a};filter:url(#pa-soft)"/>`;
