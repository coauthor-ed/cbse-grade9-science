// SimpleTissues - blk-l06-s7. Book Fig 3.8 as stained microscope fields, each beside the thing it is found in.
// parenchyma: thin-walled living cells, loosely packed, with intercellular spaces; a cut potato.
// air: a lotus stalk cut across, big air spaces ringed by thin parenchyma; a lotus leaf floating on a pond.
// collenchyma: living cells with walls thickened at the corners; a young tendril coiled round a stick.
// sclerenchyma: thick lignified walls, tiny empty centres; coconut husk fibres and a walnut shell.
// bend: try it. Bend the fresh twig: it curves and springs back. Bend the dry twig: it snaps.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, svgPotato, textureRect, ctlBar, anim } from '../shared/PlantArt.js';
import { cwFrame, eyepiece, T, mx, n1, rnd, blobPath } from '../shared/CellWorld.js';
import { bench, water } from '../shared/Scapes.js';
import { stDefs, STAIN, gridCells, cells } from '../shared/StemArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const TITLE = ['Parenchyma', 'Parenchyma with air spaces', 'Collenchyma', 'Sclerenchyma', 'The bend test'];

// -- microscope fields ---------------------------------------------------------
// Potato parenchyma: loose thin-walled cells, clear triangular air spaces where three cells meet, and clusters of
// oval layered starch grains in most cells.
function parField(cx, cy, R) {
  const l = gridCells(cx - R, cy - R, 2 * R, 2 * R, { size: 54, seed: 3, jit: 5 }), q = rnd(21);
  let s = `<rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${n1(2 * R)}" height="${n1(2 * R)}" style="fill:${mx('sea-shallow', W_, 16)}"/>` + cells(l, 'pith', { seed: 4, loose: true, vac: true });
  const air = mx('sea-shallow', W_, 78), airD = STAIN.cellD;
  for (const c of l) for (const k of [4, 6]) {
    const [x, y] = c.pts[k], t = 9.5;
    s += `<path d="M${n1(x - t)} ${n1(y - t * 0.55)}Q${n1(x)} ${n1(y - t * 0.2)} ${n1(x + t)} ${n1(y - t * 0.55)}Q${n1(x + t * 0.2)} ${n1(y + t * 0.1)} ${n1(x)} ${n1(y + t)}Q${n1(x - t * 0.2)} ${n1(y + t * 0.1)} ${n1(x - t)} ${n1(y - t * 0.55)}Z" style="fill:${air};stroke:${airD};stroke-width:1.6"/><path d="M${n1(x - t * 0.5)} ${n1(y - t * 0.3)}L${n1(x + t * 0.2)} ${n1(y - t * 0.32)}" style="stroke:${W_};stroke-width:1.2;opacity:.8"/>`;
  }
  for (const c of l) {
    if (c.q > 0.85) continue;
    const n = 3 + Math.floor(q() * 4);
    for (let i = 0; i < n; i++) {
      const gx = c.x + (q() - 0.5) * c.w * 0.5, gy = c.y + (q() - 0.5) * c.h * 0.46, gr = 3.6 + q() * 3.4, a = q() * 180;
      s += `<g transform="rotate(${n1(a)} ${n1(gx)} ${n1(gy)})"><ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="${n1(gr * 1.3)}" ry="${n1(gr)}" style="fill:${mx('strata-1', W_, 34)};stroke:${mx('strata-2', 'strata-6', 60)};stroke-width:1"/><ellipse cx="${n1(gx + gr * 0.25)}" cy="${n1(gy + gr * 0.1)}" rx="${n1(gr * 0.8)}" ry="${n1(gr * 0.6)}" style="fill:none;stroke:${mx('strata-2', 'strata-6', 60)};stroke-width:.7;opacity:.6"/><ellipse cx="${n1(gx + gr * 0.42)}" cy="${n1(gy + gr * 0.18)}" rx="${n1(gr * 0.38)}" ry="${n1(gr * 0.28)}" style="fill:none;stroke:${mx('strata-2', 'strata-6', 60)};stroke-width:.6;opacity:.5"/><circle cx="${n1(gx + gr * 0.5)}" cy="${n1(gy + gr * 0.2)}" r="1" style="fill:${mx('strata-2', 'strata-6', 60)}"/><ellipse cx="${n1(gx - gr * 0.5)}" cy="${n1(gy - gr * 0.4)}" rx="${n1(gr * 0.4)}" ry="${n1(gr * 0.18)}" style="fill:${W_};opacity:.75"/></g>`;
    }
  }
  return s;
}
function collField(cx, cy, R) {
  const l = gridCells(cx - R, cy - R, 2 * R, 2 * R, { size: 44, seed: 5, jit: 4 });
  return `<rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${n1(2 * R)}" height="${n1(2 * R)}" style="fill:url(#st-pect) ${STAIN.pect}"/>` + cells(l, 'coll', { seed: 6 });
}
function sclField(cx, cy, R) {
  const l = gridCells(cx - R, cy - R, 2 * R, 2 * R, { size: 36, seed: 7, jit: 4 });
  return `<rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${n1(2 * R)}" height="${n1(2 * R)}" style="fill:${STAIN.ligD}"/>` + cells(l, 'scl');
}
const HOLES = [[-0.42, -0.36, 0.3], [0.2, -0.5, 0.26], [0.56, 0.02, 0.24], [0.06, 0.18, 0.2], [-0.5, 0.36, 0.26], [0.2, 0.66, 0.22], [-0.1, -0.02, 0.1]];
function airField(cx, cy, R) {
  const holes = HOLES.map(([x, y, r]) => [cx + x * R, cy + y * R, r * R]);
  const keep = (c) => holes.every(([x, y, r]) => Math.hypot(c.x - x, c.y - y) > r + 4);
  const l = gridCells(cx - R, cy - R, 2 * R, 2 * R, { size: 22, seed: 9, jit: 2 }).filter(keep);
  let s = `<rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${n1(2 * R)}" height="${n1(2 * R)}" style="fill:${mx('sea-shallow', W_, 16)}"/>` + cells(l, 'par', { seed: 10, green: true });
  for (const [x, y, r] of holes) {
    s += `<path d="${blobPath(x, y, r + 3, r + 3, Math.round(x), 0.05, 10)}" style="fill:${mx('sea-shallow', W_, 34)};stroke:${STAIN.cellD};stroke-width:2.6"/>`;
    s += `<path d="M${n1(x - r * 0.7)} ${n1(y - r * 0.2)}A${n1(r * 0.8)} ${n1(r * 0.8)} 0 0 1 ${n1(x - r * 0.1)} ${n1(y - r * 0.72)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.7"/>`;
  }
  return s;
}
const FIELDS = [parField, airField, collField, sclField];

// -- things the tissue is found in ---------------------------------------------
function cutPotato(x, y, k) {
  let s = svgPotato(x - 34 * k, y, 1.1 * k, { rot: -8 });
  const cx = x + 44 * k, cy = y + 10 * k;
  s += `<ellipse cx="${n1(cx + 4)}" cy="${n1(cy + 26 * k)}" rx="${n1(52 * k)}" ry="${n1(9 * k)}" style="fill:${INK};opacity:.2;filter:url(#pa-soft)"/>`;
  s += `<path d="${blobPath(cx, cy, 50 * k, 30 * k, 4, 0.06, 10)}" style="fill:${mx('strata-2', 'strata-3', 50)};stroke:${mx('strata-3', INK, 50)};stroke-width:2"/>`;
  s += `<path d="${blobPath(cx, cy - 4 * k, 45 * k, 25 * k, 4, 0.06, 10)}" style="fill:${mx('strata-1', W_, 46)};stroke:${mx('strata-1', 'strata-3', 60)};stroke-width:1.4"/>`;
  s += `<path d="${blobPath(cx, cy - 4 * k, 34 * k, 17 * k, 6, 0.08, 10)}" style="fill:none;stroke:${mx('strata-1', 'strata-3', 70)};stroke-width:1.2;opacity:.6"/>`;
  const q = rnd(5); for (let i = 0; i < 26; i++) { const a = q() * 6.28, r = q() * 0.8; s += `<circle cx="${n1(cx + Math.cos(a) * r * 40 * k)}" cy="${n1(cy - 4 * k + Math.sin(a) * r * 20 * k)}" r="${n1(1.3 * k)}" style="fill:${W_};opacity:.8"/>`; }
  return s;
}
function lotusPond(x, y, w, h, k) {
  let s = `<clipPath id="stp-pond"><rect x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="18"/></clipPath><g clip-path="url(#stp-pond)"><g transform="translate(${n1(x - w / 2)} ${n1(y - h / 2)})">${water(w, h)}</g>`;
  const ly = y - h * 0.18;
  s += `<rect x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${n1(w)}" height="${n1(ly - (y - h / 2) + 4)}" style="fill:${mx('sea-shallow', W_, 40)}"/><rect x="${n1(x - w / 2)}" y="${n1(ly + 2)}" width="${n1(w)}" height="3" style="fill:${W_};opacity:.6"/>`;
  // stalk going down into the water, cut piece above showing holes
  s += `<path d="M${n1(x + 6 * k)} ${n1(ly + 10 * k)}C${n1(x + 14 * k)} ${n1(ly + 60 * k)} ${n1(x - 6 * k)} ${n1(ly + 110 * k)} ${n1(x + 4 * k)} ${n1(y + h / 2)}" style="fill:none;stroke:${mx('elev-low', 'sea-deep', 50)};stroke-width:${n1(9 * k)};opacity:.7"/>`;
  // floating leaf: a round pad seen from the side, a notch, veins from the centre, a lit rim
  const R = 74 * k, ry = R * 0.3, n0 = -0.15, n1a = 0.15;
  const E = (a) => [x + Math.cos(a) * R, ly + Math.sin(a) * ry];
  const [ax, ay] = E(n1a), [bx0, by0] = E(n0 + 6.283);
  s += `<ellipse cx="${n1(x + 6)}" cy="${n1(ly + 8)}" rx="${n1(R * 1.04)}" ry="${n1(ry * 1.1)}" style="fill:${T('sea-deep')};opacity:.4"/>`;
  s += `<path d="M${n1(x)} ${n1(ly)}L${n1(ax)} ${n1(ay)}A${n1(R)} ${n1(ry)} 0 1 1 ${n1(bx0)} ${n1(by0)}Z" style="fill:url(#pa-leaf) ${T('elev-low')};stroke:${mx('elev-low', INK, 56)};stroke-width:2"/>`;
  s += `<path d="M${n1(x - R * 0.96)} ${n1(ly + ry * 0.2)}A${n1(R)} ${n1(ry)} 0 0 0 ${n1(x + R * 0.6)} ${n1(ly + ry * 0.8)}" style="fill:none;stroke:${mx('elev-low', INK, 40)};stroke-width:${n1(5 * k)};opacity:.8"/>`;
  for (let i = 0; i < 11; i++) { const a = n1a + 0.25 + (i / 10) * (6.283 - 0.8); const e = E(a); s += `<path d="M${n1(x)} ${n1(ly)}L${n1(x + (e[0] - x) * 0.92)} ${n1(ly + (e[1] - ly) * 0.92)}" style="stroke:${mx('elev-low', W_, 46)};stroke-width:1.3;opacity:.7"/>`; }
  s += `<circle cx="${n1(x)}" cy="${n1(ly)}" r="${n1(3 * k)}" style="fill:${mx('elev-low', W_, 40)}"/><ellipse cx="${n1(x - R * 0.36)}" cy="${n1(ly - ry * 0.4)}" rx="${n1(R * 0.3)}" ry="${n1(ry * 0.18)}" style="fill:${W_};opacity:.4"/>`;
  s += `<path d="M${n1(x - R * 1.3)} ${n1(ly + ry * 1.2)}Q${n1(x)} ${n1(ly + ry * 1.5)} ${n1(x + R * 1.3)} ${n1(ly + ry * 1.2)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.45"/>`;
  // a pink bud on its stalk
  const bx = x + R * 0.55, by = ly - 70 * k;
  s += `<path d="M${n1(bx)} ${n1(ly + 4)}Q${n1(bx - 6)} ${n1(by + 30 * k)} ${n1(bx)} ${n1(by + 12 * k)}" style="fill:none;stroke:${mx('elev-low', INK, 30)};stroke-width:${n1(4 * k)}"/>`;
  s += `<path d="M${n1(bx)} ${n1(by - 20 * k)}C${n1(bx + 16 * k)} ${n1(by - 4 * k)} ${n1(bx + 14 * k)} ${n1(by + 14 * k)} ${n1(bx)} ${n1(by + 16 * k)}C${n1(bx - 14 * k)} ${n1(by + 14 * k)} ${n1(bx - 16 * k)} ${n1(by - 4 * k)} ${n1(bx)} ${n1(by - 20 * k)}Z" style="fill:${mx('series-4', W_, 70)};stroke:${mx('series-4', INK, 60)};stroke-width:1.6"/><path d="M${n1(bx - 3 * k)} ${n1(by - 12 * k)}Q${n1(bx - 8 * k)} ${n1(by)} ${n1(bx - 4 * k)} ${n1(by + 10 * k)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.7"/>`;
  return s + '</g>';
}
function tendril(x, y, k) {
  // a bamboo stake, a young gourd vine climbing beside it, its tendrils coiled round the stake: they bend, never snap
  const sx = x + 30 * k, top = y - 270 * k;
  let s = `<rect x="${n1(sx - 9 * k)}" y="${n1(top)}" width="${n1(18 * k)}" height="${n1(y - top + 6)}" rx="${n1(6 * k)}" style="fill:${mx('strata-1', 'gold', 60)};stroke:${mx('strata-2', INK, 50)};stroke-width:2"/><path d="M${n1(sx - 4 * k)} ${n1(top + 6)}V${n1(y)}" style="stroke:${W_};stroke-width:${n1(3 * k)};opacity:.6"/>`;
  for (let i = 1; i < 4; i++) { const yy = top + i * 68 * k; s += `<rect x="${n1(sx - 10 * k)}" y="${n1(yy)}" width="${n1(20 * k)}" height="${n1(6 * k)}" rx="3" style="fill:${mx('strata-2', 'gold', 40)};stroke:${mx('strata-2', INK, 50)};stroke-width:1.4"/>`; }
  const vine = `M${n1(x - 70 * k)} ${n1(y + 4)}C${n1(x - 40 * k)} ${n1(y - 80 * k)} ${n1(x - 80 * k)} ${n1(y - 150 * k)} ${n1(x - 40 * k)} ${n1(y - 210 * k)}C${n1(x - 20 * k)} ${n1(y - 240 * k)} ${n1(x - 10 * k)} ${n1(y - 250 * k)} ${n1(x)} ${n1(y - 262 * k)}`;
  s += `<path d="${vine}" style="fill:none;stroke:${mx('elev-low', INK, 50)};stroke-width:${n1(9 * k)};stroke-linecap:round"/><path d="${vine}" style="fill:none;stroke:${T('elev-low')};stroke-width:${n1(6 * k)};stroke-linecap:round"/>`;
  const leaf = (lx, ly, r, rot) => `<g transform="translate(${n1(lx)} ${n1(ly)}) rotate(${rot}) scale(${n1(r)})"><path d="M0 0C-26 -6 -40 -26 -34 -46C-26 -40 -20 -46 -14 -56C-6 -48 0 -52 6 -58C10 -48 18 -46 26 -50C28 -30 18 -8 0 0Z" style="fill:url(#pa-leaf) ${T('elev-low')};stroke:${mx('elev-low', INK, 56)};stroke-width:1.6"/><path d="M0 0L-12 -46M0 0L4 -52M0 0L18 -40" style="stroke:${mx('elev-low', W_, 40)};stroke-width:1.3;fill:none"/></g>`;
  s += leaf(x - 58 * k, y - 96 * k, 1.1 * k, -40) + leaf(x - 46 * k, y - 196 * k, 1.0 * k, -20) + leaf(x - 2 * k, y - 262 * k, 0.8 * k, 10);
  const coil = (bx, by) => {
    let d = `M${n1(bx)} ${n1(by)}C${n1(bx + 30 * k)} ${n1(by - 4 * k)} ${n1(sx - 30 * k)} ${n1(by - 16 * k)} ${n1(sx - 10 * k)} ${n1(by - 18 * k)}`;
    for (let i = 0; i < 3; i++) { const yy = by - 18 * k - i * 14 * k; d += `C${n1(sx + 16 * k)} ${n1(yy + 2 * k)} ${n1(sx + 16 * k)} ${n1(yy - 10 * k)} ${n1(sx)} ${n1(yy - 10 * k)}C${n1(sx - 16 * k)} ${n1(yy - 10 * k)} ${n1(sx - 16 * k)} ${n1(yy - 16 * k)} ${n1(sx - 6 * k)} ${n1(yy - 14 * k)}`; }
    return `<path d="${d}" style="fill:none;stroke:${mx('elev-low', INK, 46)};stroke-width:${n1(4.4 * k)};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${mx('elev-low', W_, 34)};stroke-width:${n1(2.2 * k)};stroke-linecap:round"/>`;
  };
  s += coil(x - 50 * k, y - 120 * k) + coil(x - 34 * k, y - 220 * k);
  return s;
}
function coconutWalnut(x, y, k) {
  // half a coconut: husk of fibres round a hard brown shell, white flesh inside; and a walnut
  const cx = x - 40 * k, cy = y - 10 * k, R = 66 * k;
  let s = `<ellipse cx="${n1(cx + 6)}" cy="${n1(cy + R * 0.9)}" rx="${n1(R * 1.1)}" ry="${n1(10 * k)}" style="fill:${INK};opacity:.24;filter:url(#pa-soft)"/>`;
  s += `<path d="M${n1(cx - R)} ${n1(cy)}A${n1(R)} ${n1(R * 0.92)} 0 0 0 ${n1(cx + R)} ${n1(cy)}Z" style="fill:${mx('strata-2', 'strata-1', 60)};stroke:${mx('strata-3', INK, 40)};stroke-width:2"/>`;
  const q = rnd(8); for (let i = 0; i < 46; i++) { const a = 0.05 + q() * 3.04, r0 = R * (0.66 + q() * 0.1), r1 = R * (0.94 + q() * 0.05); s += `<path d="M${n1(cx + Math.cos(a) * r0)} ${n1(cy + Math.sin(a) * r0 * 0.92)}L${n1(cx + Math.cos(a + 0.05) * r1)} ${n1(cy + Math.sin(a + 0.05) * r1 * 0.92)}" style="stroke:${q() < 0.5 ? mx('strata-3', INK, 70) : mx('strata-1', W_, 70)};stroke-width:1.3;opacity:.8"/>`; }
  s += `<path d="M${n1(cx - R * 0.66)} ${n1(cy)}A${n1(R * 0.66)} ${n1(R * 0.6)} 0 0 0 ${n1(cx + R * 0.66)} ${n1(cy)}Z" style="fill:${mx('strata-3', INK, 70)}"/><path d="M${n1(cx - R * 0.58)} ${n1(cy)}A${n1(R * 0.58)} ${n1(R * 0.52)} 0 0 0 ${n1(cx + R * 0.58)} ${n1(cy)}Z" style="fill:${W_};stroke:${mx('strata-1', W_, 40)};stroke-width:2"/>`;
  s += `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(R * 0.46)}" ry="${n1(R * 0.08)}" style="fill:${mx('sea-shallow', W_, 30)};opacity:.7"/>`;
  // walnut: wrinkled shell, a seam
  const wx = x + 66 * k, wy = y + 18 * k, wr = 32 * k;
  s += `<ellipse cx="${n1(wx + 4)}" cy="${n1(wy + wr * 0.92)}" rx="${n1(wr)}" ry="${n1(6 * k)}" style="fill:${INK};opacity:.24;filter:url(#pa-soft)"/>`;
  s += `<path d="${blobPath(wx, wy, wr, wr * 0.9, 12, 0.06, 12)}" style="fill:${mx('strata-2', 'strata-1', 40)};stroke:${mx('strata-3', INK, 50)};stroke-width:2"/>`;
  for (let i = 0; i < 9; i++) { const a = q() * 6.28, r = wr * (0.2 + q() * 0.6); s += `<path d="M${n1(wx + Math.cos(a) * r)} ${n1(wy + Math.sin(a) * r)}q${n1((q() - 0.5) * 14 * k)} ${n1((q() - 0.5) * 14 * k)} ${n1((q() - 0.5) * 18 * k)} ${n1((q() - 0.5) * 10 * k)}" style="fill:none;stroke:${mx('strata-3', INK, 30)};stroke-width:1.6;opacity:.7"/>`; }
  s += `<path d="M${n1(wx)} ${n1(wy - wr * 0.9)}Q${n1(wx + 4)} ${n1(wy)} ${n1(wx)} ${n1(wy + wr * 0.9)}" style="fill:none;stroke:${mx('strata-3', INK, 50)};stroke-width:2.4"/>`;
  s += `<ellipse cx="${n1(wx - wr * 0.4)}" cy="${n1(wy - wr * 0.42)}" rx="${n1(wr * 0.26)}" ry="${n1(wr * 0.12)}" style="fill:${W_};opacity:.4"/>`;
  return s;
}

// -- twigs ---------------------------------------------------------------------
// A twig as 10 segments; bend b (0..1) curls it, a snap splits it at the middle and drops the halves apart.
function twig(x, y, len, o) {
  const N = 10, seg = len / N, fresh = o.fresh, b = o.bend ?? 0, snap = o.snap ?? 0;
  const col = fresh ? T('elev-low') : mx('strata-2', 'strata-5', 60), dark = fresh ? mx('elev-low', INK, 50) : mx('strata-3', INK, 40), lit = fresh ? mx('elev-low', W_, 50) : mx('strata-1', W_, 40);
  const half = (sideSign) => {
    // from the middle outward
    let px = x, py = y, a = 0, pts = [[px, py]];
    for (let i = 0; i < N / 2; i++) {
      a += (b * 0.11 + snap * (i === 0 ? 0.4 : 0)) * -1;
      px += Math.cos(a) * seg * sideSign; py += Math.sin(a) * seg;
      pts.push([px, py + snap * 18 * (i + 1) / (N / 2)]);
    }
    return pts;
  };
  const L = half(-1), Rr = half(1), gap = snap * 10;
  const path = (pts, dx) => `M${pts.map((p) => `${n1(p[0] + dx)} ${n1(p[1])}`).join('L')}`;
  let s = '';
  for (const [pts, dx] of [[L, -gap], [Rr, gap]]) {
    const d = path(pts, dx);
    // a tapered body: thick at the middle, thin at the far end
    const lf = [], rt = [];
    pts.forEach((p, i) => { const q2 = pts[Math.min(i + 1, pts.length - 1)], q0 = pts[Math.max(i - 1, 0)], tx = q2[0] - q0[0], ty = q2[1] - q0[1], L = Math.hypot(tx, ty) || 1, w = 9 - i * 1.2; lf.push([p[0] + dx - (ty / L) * w, p[1] + (tx / L) * w]); rt.push([p[0] + dx + (ty / L) * w, p[1] - (tx / L) * w]); });
    const body = `M${lf.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}L${rt.reverse().map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
    s += `<path d="${body}" transform="translate(4 10)" style="fill:${INK};opacity:.16"/><path d="${body}" style="fill:${col};stroke:${dark};stroke-width:2.2;stroke-linejoin:round"/>`;
    s += `<path d="${d}" transform="translate(0 4)" style="fill:none;stroke:${dark};stroke-width:5;stroke-linecap:round;opacity:.35"/><path d="${d}" transform="translate(0 -4)" style="fill:none;stroke:${lit};stroke-width:2.6;stroke-linecap:round;opacity:.85"/>`;
    const tip = pts[pts.length - 1];
    s += `<ellipse cx="${n1(tip[0] + dx)}" cy="${n1(tip[1])}" rx="3" ry="3.4" style="fill:${fresh ? mx('elev-low', W_, 40) : mx('strata-1', W_, 30)};stroke:${dark};stroke-width:1.4"/>`;
    s += `<path d="${d}" style="fill:none;stroke:${fresh ? mx('elev-low', W_, 60) : mx('strata-3', INK, 40)};stroke-width:2;stroke-dasharray:${fresh ? '1 13' : '9 6 3 8'};stroke-linecap:round;opacity:.8"/>`;
    // nodes, and leaves on the fresh one; cracks on the dry one
    pts.forEach((p, i) => {
      if (i === 2 || i === 4) {
        if (fresh) s += `<path d="M${n1(p[0] + dx)} ${n1(p[1] - 4)}c-8 -26 10 -40 24 -42c-2 16 -8 34 -24 42Z" style="fill:url(#pa-leaf) ${T('elev-low')};stroke:${mx('elev-low', INK, 56)};stroke-width:1.6"/>`;
        else s += `<path d="M${n1(p[0] + dx - 6)} ${n1(p[1] - 2)}l5 3l4 -2" style="fill:none;stroke:${INK};stroke-width:1.4;opacity:.6"/>`;
      }
    });
  }
  if (snap > 0.5) { const e1 = L[0], e2 = Rr[0]; for (const [e, dx, sg] of [[e1, -gap, -1], [e2, gap, 1]]) s += `<path d="M${n1(e[0] + dx)} ${n1(e[1] - 4)}l${sg * 9} -3M${n1(e[0] + dx)} ${n1(e[1])}l${sg * 12} 2M${n1(e[0] + dx)} ${n1(e[1] + 4)}l${sg * 8} 5" style="fill:none;stroke:${mx('strata-1', W_, 30)};stroke-width:2.2;stroke-linecap:round"/>`; }
  return s;
}

export class SimpleTissues extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 680;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 600;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Stained microscope fields of the three simple tissues, each beside where it is found: parenchyma beside a cut potato, air spaces in a lotus stalk beside a floating lotus leaf, collenchyma beside a coiled tendril, sclerenchyma beside coconut husk and a walnut. Then a fresh twig that bends and springs back and a dry twig that snaps.';
  static CONTROLS = [];

  async setup() {
    this._tw = { fresh: 0, dry: 0, go: null, celebrated: false };
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'fresh', label: 'Bend the fresh twig' }, { kind: 'btn', id: 'dry', label: 'Bend the dry twig' }], (id) => this.onControlChange(id, true));
    this._showCtl();
  }
  enter() { if (this._tw) this._tw = { fresh: 0, dry: 0, go: null, celebrated: false }; this._showCtl(); }
  _showCtl() { if (!this.ctl) return; const on = this.stepIndex === 4; this.ctl.show('fresh', on); this.ctl.show('dry', on); }
  onControlChange(id) {
    if (this.stepIndex !== 4 || this.isPlaying()) return;
    if (id === 'dry' && this._tw.dry) return;
    this._tw.go = id;
    const beat = this.stepIndex, other = id === 'fresh' ? this._tw.dry : this._tw.fresh;
    if (beat === 4 && other && !this._tw.celebrated) { this._tw.celebrated = true; const L = this._twLayout(); this.celebrate(L.x, id === 'dry' ? L.dy : L.fy); }
    this.play(id === 'fresh' ? 1.6 : 1.0);
    this.after(id === 'fresh' ? 1.7 : 1.1, () => {
      if (id === 'fresh') this._tw.fresh = 1; else this._tw.dry = 1;
      this._tw.go = null;
      this.repaint();
    });
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? (this.stepIndex === 4 ? 410 : 480) : 400; }
  _twLayout() { const st = this.sv, P = st.portrait; return { x: st.W * 0.5, fy: P ? st.H * 0.32 : st.H * 0.34, dy: P ? st.H * 0.72 : st.H * 0.74, len: P ? 280 : 420 }; }

  animate(st, t) {
    if (this.stepIndex !== 4) return;
    const L = this._twLayout(), go = this._tw.go;
    let fb = 0, ds = this._tw.dry ? 1 : 0, db = 0;
    if (go === 'fresh') { const u = Math.min(1, t / 1.6); fb = u < 0.45 ? Math.sin((u / 0.45) * Math.PI / 2) : Math.cos(((u - 0.45) / 0.55) * Math.PI * 2.5) * Math.exp(-((u - 0.45) / 0.55) * 3.2); }
    if (go === 'dry') { const u = Math.min(1, t / 1.0); db = u < 0.3 ? (u / 0.3) * 0.28 : 0; ds = u < 0.3 ? 0 : Math.min(1, (u - 0.3) / 0.4); }
    anim(this, 'fresh', twig(L.x, L.fy, L.len, { fresh: true, bend: fb }));
    anim(this, 'dry', twig(L.x, L.dy, L.len, { fresh: false, bend: db, snap: ds }));
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const defs = `<defs>${stDefs()}</defs>`;
    if (step === 4) return { svg: cwFrame(st, 'stp', defs + this._bendView(W, H, P)) };
    const R = P ? 128 : 170, fx = P ? W / 2 : W * 0.33, fy = P ? R + 40 : H / 2 + 8;
    let s = `<rect width="${W}" height="${H}" style="fill:${mx('strata-1', W_, 30)}"/>` + bench(W, P ? fy + R + 30 : H * 0.8, H, { planks: 3 });
    s += eyepiece(W, P ? fy + R + 30 : H, fx, fy, R, FIELDS[step](fx, fy, R + 4), { id: 'stp-eye', tint: 'pale' });
    // the stage round the lens: the glass slide's edges, a soft pool of light and darker corners
    { const sh = P ? fy + R + 30 : H, ro = R + 28;
      s += `<radialGradient id="stp-vg" gradientUnits="userSpaceOnUse" cx="${n1(fx)}" cy="${n1(fy)}" r="${n1(Math.max(W, sh))}"><stop offset="${n1(ro / Math.max(W, sh))}" style="stop-color:${W_};stop-opacity:.1"/><stop offset=".55" style="stop-color:${INK};stop-opacity:0"/><stop offset="1" style="stop-color:${INK};stop-opacity:.4"/></radialGradient>`;
      s += `<clipPath id="stp-out"><path d="M0 0H${W}V${n1(sh)}H0Z M${n1(fx + ro)} ${n1(fy)}A${n1(ro)} ${n1(ro)} 0 1 0 ${n1(fx - ro)} ${n1(fy)}A${n1(ro)} ${n1(ro)} 0 1 0 ${n1(fx + ro)} ${n1(fy)}Z" style="clip-rule:evenodd"/></clipPath>`;
      s += `<g clip-path="url(#stp-out)"><rect width="${W}" height="${n1(sh)}" style="fill:url(#stp-vg) transparent"/><rect x="-10" y="${n1(fy - R * 0.62)}" width="${W + 20}" height="${n1(R * 1.24)}" style="fill:${W_};opacity:.06"/><path d="M-10 ${n1(fy - R * 0.62)}H${W + 10}M-10 ${n1(fy + R * 0.62)}H${W + 10}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.28"/></g>`; }
    s += label(fx, P ? 24 : 28, TITLE[step], { size: P ? 18 : 21, display: true, ink: W_, halo: INK });
    const ox = P ? W / 2 : W * 0.78, oy = P ? H - 70 : H * 0.62, k = P ? 0.8 : 1;
    if (step === 0) s += cutPotato(ox, oy, k * 1.3) + label(ox, oy + (P ? 64 : 84), 'potato: stores food', { size: P ? 15 : 17 });
    if (step === 1) s += lotusPond(ox, oy - (P ? 0 : 20), P ? 300 : 210, P ? 130 : 220, k) + label(ox, P ? H - 10 : oy + 112, 'lotus floats', { size: P ? 15 : 17 });
    if (step === 2) s += tendril(ox + 10, oy + (P ? 56 : 92), P ? 0.42 : 0.92) + label(ox, P ? H - 8 : oy + 118, 'tendril bends', { size: P ? 15 : 17 });
    if (step === 3) s += coconutWalnut(ox, oy - 10, k * 1.15) + label(ox, oy + (P ? 54 : 78), 'coconut husk, walnut shell', { size: P ? 14 : 16 });
    s += this._fieldLabels(step, fx, fy, R, P);
    return { svg: cwFrame(st, 'stp', defs + s) };
  }

  _fieldLabels(step, fx, fy, R, P) {
    const fs = P ? 14 : 16, L = (x, y, t, ax, ay) => `<path d="M${n1(x)} ${n1(y + 4)}L${n1(ax)} ${n1(ay)}" style="stroke:${INK};stroke-width:2.2;fill:none"/><circle cx="${n1(ax)}" cy="${n1(ay)}" r="3.6" style="fill:${INK};stroke:${W_};stroke-width:1.4"/>` + label(x, y, t, { size: fs });
    const top = fy - R * 0.62, bot = fy + R * 0.78;
    if (step === 0) {
      const g = gridCells(fx - R - 4, fy - R - 4, 2 * R + 8, 2 * R + 8, { size: 54, seed: 3, jit: 5 }), c = g.reduce((b, c) => (Math.hypot(c.x - fx, c.y - fy) < Math.hypot(b.x - fx, b.y - fy) ? c : b));
      return L(fx - R * 0.3, top, 'thin wall', c.x - c.w * 0.5 + 3, c.y - 6) + L(fx + R * 0.2, bot, 'intercellular space', c.pts[4][0] - 1, c.pts[4][1] - 1);
    }
    if (step === 1) return L(fx + R * 0.05, top - R * 0.1, 'air space', fx + R * 0.2, fy - R * 0.5) + L(fx - R * 0.1, bot + R * 0.06, 'air space', fx - R * 0.5, fy + R * 0.36);
    if (step === 2) {
      const g = gridCells(fx - R - 4, fy - R - 4, 2 * R + 8, 2 * R + 8, { size: 44, seed: 5, jit: 4 }), c = g.reduce((b, c) => (Math.hypot(c.x - fx, c.y - fy) < Math.hypot(b.x - fx, b.y - fy) ? c : b));
      return L(fx + R * 0.1, top, 'thick corner', c.pts[2][0], c.pts[2][1]) + L(fx - R * 0.1, bot, 'living cell', c.x, c.y + 6);
    }
    const g = gridCells(fx - R - 4, fy - R - 4, 2 * R + 8, 2 * R + 8, { size: 36, seed: 7, jit: 4 }), c = g.reduce((b, c) => (Math.hypot(c.x - fx, c.y - fy) < Math.hypot(b.x - fx, b.y - fy) ? c : b));
    return L(fx - R * 0.2, top, 'thick lignin wall', c.pts[0][0] + 3, c.pts[0][1] + 3) + L(fx + R * 0.1, bot, 'empty centre', c.x, c.y);
  }

  _bendView(W, H, P) {
    const L = this._twLayout();
    let s = `<rect width="${W}" height="${H}" style="fill:${mx('strata-1', W_, 30)}"/>` + bench(W, H * 0.86, H, { planks: 2 });
    s += `<rect width="${W}" height="${n1(H * 0.86)}" style="fill:${mx('sea-shallow', W_, 16)}"/><circle cx="${n1(W * 0.2)}" cy="${n1(H * 0.2)}" r="${n1(W * 0.4)}" style="fill:${W_};opacity:.5;filter:url(#pa-softer)"/>${textureRect(0, 0, W, H * 0.86, 'grain', 0.06)}`;
    s += `<g data-anim="fresh">${twig(L.x, L.fy, L.len, { fresh: true })}</g><g data-anim="dry">${twig(L.x, L.dy, L.len, { fresh: false, snap: this._tw.dry ? 1 : 0 })}</g>`;
    const tf = this._tw.fresh ? 'fresh: bends, springs back' : 'fresh twig', td = this._tw.dry ? 'dry: snaps' : 'dry twig';
    s += label(W / 2, L.fy - (P ? 66 : 70), tf, { size: P ? 16 : 19, display: true });
    s += label(W / 2, L.dy - (P ? 50 : 56), td, { size: P ? 16 : 19, display: true });
    return s;
  }

  destroy() { this.ctl?.destroy(); super.destroy(); }
}
