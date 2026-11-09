// FieldArt - helpers for the two eyepiece scenes of the wall lessons. Not a scene. Tokens only.
import { n1, rnd, T, mx, blobPath } from '../shared/CellWorld.js';

/** How far content has come in after m minutes in sugar: 0 at 0 min, 1 at 30 min. Slows towards the end. */
export const pull = (m) => 1 - Math.pow(1 - Math.min(30, Math.max(0, m)) / 30, 2);
/** Cheek cells, flat irregular shapes with a blue stain. k: 1 full size, smaller when shrunk. */
export function cheekPatch(x, y, r, seed, k, ghost) {
  const R = r * k, d = blobPath(x, y, R, R * 0.8, seed, 0.14 + (1 - k) * 0.5, 9), q = rnd(seed + 9);
  let g = '';
  for (let i = 0; i < 26; i++) { const a = q() * 6.28, u = Math.sqrt(q()) * R * 0.78; g += `<circle cx="${n1(x + Math.cos(a) * u)}" cy="${n1(y + Math.sin(a) * u * 0.8)}" r="${n1(0.9 + q() * 1.5)}" style="fill:${mx('sea-deep', 'series-1', 66)};opacity:.42"/>`; }
  const o = ghost ? `<path d="${blobPath(x, y, r, r * 0.8, seed, 0.14, 9)}" style="fill:none;stroke:${mx('sea-deep', 'series-1', 70)};stroke-width:2;stroke-dasharray:6 6;opacity:.7"/>` : '';
  return `${o}<path d="${d}" style="fill:${mx('series-1', 'elev-peak', 34 + (1 - k) * 60)};stroke:${mx('sea-deep', 'series-1', 74)};stroke-width:2.2"/>${g}<circle cx="${n1(x + R * 0.1)}" cy="${n1(y)}" r="${n1(Math.max(5, r * 0.16))}" style="fill:${mx('sea-deep', 'series-5', 76)}"/><circle cx="${n1(x + R * 0.06)}" cy="${n1(y - 2)}" r="${n1(Math.max(1.6, r * 0.05))}" style="fill:${mx('series-5', 'elev-peak', 50)}"/>`;
}
const CHEEK = [[-0.42, -0.42, 0.34, 3], [0.36, -0.46, 0.3, 5], [-0.08, 0.02, 0.32, 7], [0.5, 0.2, 0.3, 11], [-0.5, 0.36, 0.28, 13], [0.1, 0.6, 0.26, 17]];
export function cheekField(cx, cy, R, m, ghost) {
  const k = 1 - 0.42 * pull(m); let s = '';
  for (const [u, v, w, seed] of CHEEK) s += cheekPatch(cx + u * R, cy + v * R, w * R, seed, k, ghost);
  return s;
}
/** A small round microscope view, for two views side by side. */
export function eyepieceBare(cx, cy, R, body, id, f) {
  return `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R + 10)}" style="fill:${mx('strata-6', 'sea-deep', 50)}"/><clipPath id="${id}"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}"/></clipPath><g clip-path="url(#${id})"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:url(#${f}) ${T('elev-peak')}"/>${body}</g><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:url(#cw-vign) transparent;pointer-events:none"/>`;
}
