// PugaArt.js - the drawn Puga valley: cold bare mountains, pale high-altitude sky, a steaming pool with a mineral rim. Not a scene.
//   valley(W, H, o) -> markup   o.crust 0..1 white deposit round the pool, o.seed
//   POOL(W, H) -> { x, y, rx, ry } the pool on the stage
import { T, mx, n1, rnd, blobPath } from '../shared/CellWorld.js';
import { fill, stroke } from '../shared/PlantArt.js';

const W_ = T('elev-peak');
export const POOL = (W, H) => ({ x: W * 0.5, y: H * 0.72, rx: W * 0.3, ry: H * 0.12 });

function ridge(W, base, peaks, col, shade, snow, seed) {
  const q = rnd(seed); let s = '';
  for (const [px, py, hw] of peaks) {
    const l = px - hw, r = px + hw, j = (t) => (q() - 0.5) * t;
    const left = `M${n1(l)} ${n1(base)}L${n1(l + hw * 0.34)} ${n1(py + (base - py) * 0.56 + j(8))}L${n1(l + hw * 0.62)} ${n1(py + (base - py) * 0.3 + j(8))}L${n1(px)} ${n1(py)}`;
    s += `<path d="${left}L${n1(px + hw * 0.36)} ${n1(py + (base - py) * 0.34 + j(8))}L${n1(px + hw * 0.66)} ${n1(py + (base - py) * 0.62 + j(8))}L${n1(r)} ${n1(base)}Z" ${fill(col)}/>`;
    s += `<path d="M${n1(px)} ${n1(py)}L${n1(px + hw * 0.36)} ${n1(py + (base - py) * 0.34)}L${n1(px + hw * 0.66)} ${n1(py + (base - py) * 0.62)}L${n1(r)} ${n1(base)}L${n1(px + hw * 0.12)} ${n1(base)}L${n1(px - hw * 0.08)} ${n1(py + (base - py) * 0.46)}Z" ${fill(shade)} opacity=".9"/>`;
    for (let g = 0; g < 5; g++) { const t = 0.2 + g * 0.15 + j(0.04), gx = px + (g - 2) * hw * 0.16; s += `<path d="M${n1(px + (gx - px) * 0.3)} ${n1(py + (base - py) * t)}Q${n1(gx + j(10))} ${n1(py + (base - py) * (t + 0.3))} ${n1(gx + (gx - px) * 0.5)} ${n1(base - 2)}" ${stroke(snow ? W_ : mx(col, 'strata-6', 70), 1.4)} opacity="${snow ? '.3' : '.35'}"/>`; }
    if (snow) s += `<path d="M${n1(px)} ${n1(py)}L${n1(px + hw * 0.2)} ${n1(py + (base - py) * 0.2)}L${n1(px + hw * 0.07)} ${n1(py + (base - py) * 0.16)}L${n1(px - hw * 0.02)} ${n1(py + (base - py) * 0.27)}L${n1(px - hw * 0.1)} ${n1(py + (base - py) * 0.16)}L${n1(px - hw * 0.24)} ${n1(py + (base - py) * 0.24)}Z" ${fill(W_)}/>`;
  }
  return s;
}
function steam(x, y, h, seed) {
  const q = rnd(seed); let s = '';
  for (let i = 0; i < 4; i++) {
    const dx = (i - 1.5) * 34 + q() * 12; let c = '';
    for (let k = 0; k < 7; k++) { const t = k / 6, r = 9 + t * 22; c += `<circle cx="${n1(x + dx + Math.sin(t * 5 + i) * (8 + t * 20))}" cy="${n1(y - t * h * (0.76 + q() * 0.2))}" r="${n1(r)}" style="fill:${W_};opacity:${n1(0.34 * (1 - t * 0.7))}"/>`; }
    s += `<g class="pg-steam" style="--d:${n1(i * 0.7)}s" filter="url(#pa-soft)">${c}</g>`;
  }
  return s;
}
export function valley(W, H, o = {}) {
  const hz = H * 0.56, p = POOL(W, H), cr = o.crust ?? 0;
  const sky = `<linearGradient id="pg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sky-day', 'sea-deep', 72)}"/><stop offset=".7" style="stop-color:${mx('sky-day', W_, 44)}"/><stop offset="1" style="stop-color:${W_}"/></linearGradient>`
    + `<linearGradient id="pg-gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(mx('strata-1', 'strata-5', 50), W_, 70)}"/><stop offset=".5" style="stop-color:${mx('strata-1', 'strata-5', 52)}"/><stop offset="1" style="stop-color:${mx('strata-5', 'strata-1', 60)}"/></linearGradient>`
    + `<radialGradient id="pg-pool" cx=".42" cy=".4" r=".7"><stop offset="0" style="stop-color:${mx('sea-shallow', W_, 54)}"/><stop offset=".6" style="stop-color:${T('sea-shallow')}"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'sea-deep', 54)}"/></radialGradient>`;
  let s = `<defs>${sky}</defs><rect width="${W}" height="${n1(hz + 6)}" style="fill:url(#pg-sky) ${T('sky-day')}"/>`;
  s += ridge(W, hz + 2, [[W * 0.12, H * 0.2, W * 0.26], [W * 0.46, H * 0.12, W * 0.3], [W * 0.86, H * 0.17, W * 0.3]], mx('strata-5', W_, 66), mx('strata-5', 'sea-deep', 76), true, 3);
  s += ridge(W, hz + 8, [[W * 0.02, H * 0.34, W * 0.24], [W * 0.3, H * 0.38, W * 0.22], [W * 0.68, H * 0.33, W * 0.24], [W * 1.0, H * 0.3, W * 0.24]], mx('strata-3', 'strata-1', 70), mx('strata-3', 'strata-6', 66), false, 5);
  s += `<defs>${''}</defs><rect y="${n1(hz)}" width="${W}" height="${n1(H - hz)}" style="fill:url(#pg-gd) ${T('strata-2')}"/>`;
  // ground: pebbles and streaks, quiet
  const q = rnd(o.seed ?? 8);
  // cold desert floor: grey gravel fans with long streaks, a few stones with a lit top and a shadow, a thin outflow from the pool
  for (let i = 0; i < 14; i++) { const y = hz + 6 + (H - hz) * (i / 14) ** 1.4, x0 = q() * W * 0.5; s += `<path d="M${n1(x0)} ${n1(y)}Q${n1(x0 + W * 0.25)} ${n1(y - 3)} ${n1(x0 + W * (0.4 + q() * 0.4))} ${n1(y + 2)}" ${stroke(mx('strata-5', W_, 40 + Math.round(q() * 30)), 1 + (i / 14) * 2)} opacity=".45"/>`; }
  for (let i = 0; i < 40; i++) { const x = q() * W, y = hz + 10 + q() * (H - hz - 10), d = (y - hz) / (H - hz), r = 1.4 + q() * 3.4 * (d + 0.3); s += `<ellipse cx="${n1(x + 1)}" cy="${n1(y + r * 0.5)}" rx="${n1(r * 1.6)}" ry="${n1(r * 0.7)}" style="fill:${T('strata-6')};opacity:.18"/><ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(r * 1.5)}" ry="${n1(r)}" style="fill:${mx('strata-5', 'strata-3', 40 + Math.round(q() * 40))}"/><ellipse cx="${n1(x - r * 0.4)}" cy="${n1(y - r * 0.4)}" rx="${n1(r * 0.6)}" ry="${n1(r * 0.3)}" style="fill:${W_};opacity:.5"/>`; }
  s += `<path d="M${n1(p.x + p.rx * 0.8)} ${n1(p.y + p.ry * 0.5)}C${n1(p.x + p.rx * 1.1)} ${n1(p.y + p.ry * 1.6)} ${n1(p.x + p.rx * 1.5)} ${n1(H - 30)} ${n1(W + 4)} ${n1(H - 10)}" ${stroke(mx('strata-1', 'magma', 70), 9)} opacity=".7"/><path d="M${n1(p.x + p.rx * 0.8)} ${n1(p.y + p.ry * 0.5)}C${n1(p.x + p.rx * 1.1)} ${n1(p.y + p.ry * 1.6)} ${n1(p.x + p.rx * 1.5)} ${n1(H - 30)} ${n1(W + 4)} ${n1(H - 10)}" ${stroke(mx('sea-shallow', W_, 50), 3.4)}/>`;
  // mineral rim, then deposit, then water
  const rim = blobPath(p.x, p.y, p.rx * 1.16, p.ry * 1.26, 4, 0.05, 12);
  s += `<path d="${rim}" style="fill:${mx('strata-1', 'magma', 74)}"/>`;
  s += `<path d="${blobPath(p.x, p.y, p.rx * 1.08, p.ry * 1.14, 6, 0.04, 12)}" style="fill:${mx('strata-1', W_, 60)}"/>`;
  if (cr > 0) {
    const k = 1.1 + cr * 0.34;
    s += `<g class="sv-pop"><path d="${blobPath(p.x, p.y + 4, p.rx * k * 1.06, p.ry * k * 1.34, 7, 0.07, 12)}" transform="translate(0 7)" style="fill:${mx('strata-5', W_, 56)}"/><path d="${blobPath(p.x, p.y + 4, p.rx * k * 1.06, p.ry * k * 1.34, 7, 0.07, 12)}" style="fill:${W_}"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="${blobPath(p.x, p.y + 3, p.rx * (1.08 + i * 0.09 * cr), p.ry * (1.2 + i * 0.14 * cr), 9 + i, 0.05, 12)}" ${stroke(mx('strata-5', W_, 34), 1.6)}/>`;
    s += '</g>';
  }
  s += `<path d="${blobPath(p.x, p.y, p.rx, p.ry, 5, 0.03, 12)}" style="fill:url(#pg-pool) ${T('sea-shallow')};stroke:${mx('sea-deep', 'strata-1', 60)};stroke-width:2"/>`;
  s += `<path d="M${n1(p.x - p.rx * 0.6)} ${n1(p.y - p.ry * 0.3)}Q${n1(p.x - p.rx * 0.1)} ${n1(p.y - p.ry * 0.7)} ${n1(p.x + p.rx * 0.34)} ${n1(p.y - p.ry * 0.4)}" ${stroke(W_, 3)} opacity=".6"/>`;
  s += steam(p.x, p.y - 4, H * 0.42, 3);
  return `<defs>${sky}</defs>` + s;
}
export const PUGA_CSS = `
@keyframes pg-rise { 0%, 100% { transform: translateY(0); opacity: .42; } 50% { transform: translateY(-9px); opacity: .6; } }
.pg-steam { animation: pg-rise 5s ease-in-out infinite; animation-delay: var(--d, 0s); }
@media (prefers-reduced-motion: reduce) { .pg-steam { animation: none; } }
`;
