// RegrowNodes - two slides, one scene; the slide's beat count picks the view.
// blk-l04-s13 (2 beats: not-tip, from-base): a grazed grass clump in a field, a zebu cow grazing behind. Days slider:
//   the cut tops stay flat and rise; new length appears at the base, where a zone of dividing cells sits. Ink marks
//   on the front blade keep their spacing and ride up, so the growth is below them.
// blk-l04-s14 (3 beats: node-internode, where, stem-tip-cut): a grass stem with nodes and internodes; the intercalary
//   meristem at the base of each internode, just above a node; then a young hedge shoot whose tip is cut: it stops
//   lengthening and buds at the nodes grow into branches (Weeks slider). The intercalary meristem never makes branches.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, ctlBar, textureRect, svgLeaf } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { field, grass } from '../shared/Scapes.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const G = mx('elev-low', 'strata-4', 30), GL = mx('elev-low', 'gold', 30), GD = mx('elev-low', INK, 52), MERI = T('series-5');
const GRASS_MAP = [one(0), one(1)], STEM_MAP = [one(2), one(3), one(4)];

// -- a zebu cow grazing, side view facing left, head down to the grass ---------------------------------
function cow(x, y, k) {
  const c = mx('strata-1', W_, 26), cs = mx('strata-1', 'strata-5', 58), cd = mx('strata-5', INK, 50), dk = mx('strata-5', 'strata-6', 40), hoof = mx('strata-6', 'strata-5', 30);
  const P = (px, py) => `${n1(x + px * k)} ${n1(y + py * k)}`;
  let s = `<ellipse cx="${n1(x)}" cy="${n1(y + 2 * k)}" rx="${n1(118 * k)}" ry="${n1(9 * k)}" style="fill:${INK};opacity:.28;filter:url(#pa-soft)"/>`;
  // a leg: thigh or forearm, a knee or hock, a thin cannon, a dark hoof
  const leg = (lx, hind, far) => {
    const col = far ? cs : c, kx = hind ? 6 : -2;
    return `<path d="M${P(lx - 13, -78)}C${P(lx - 14, -56)} ${P(lx - 8 + kx, -46)} ${P(lx - 6 + kx, -36)}C${P(lx - 6, -24)} ${P(lx - 6, -14)} ${P(lx - 5, -6)}L${P(lx + 5, -6)}C${P(lx + 5, -16)} ${P(lx + 5, -26)} ${P(lx + 5 + kx * 0.4, -36)}C${P(lx + 9 + kx, -48)} ${P(lx + 14, -60)} ${P(lx + 13, -80)}Z" style="fill:${col};stroke:${cd};stroke-width:1.8"/>`
      + `<path d="M${P(lx - 6, -7)}L${P(lx + 6, -7)}L${P(lx + 7, 0)}L${P(lx - 7, 0)}Z" style="fill:${hoof}"/>` + (far ? '' : `<path d="M${P(lx - 7, -70)}C${P(lx - 6, -56)} ${P(lx - 2 + kx, -46)} ${P(lx - 1 + kx, -38)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.6"/>`);
  };
  s += leg(-34, false, true) + leg(84, true, true);
  // tail with a dark tuft
  s += `<path d="M${P(98, -118)}C${P(108, -100)} ${P(104, -66)} ${P(106, -40)}" style="fill:none;stroke:${cd};stroke-width:${n1(3.2 * k)}"/><path d="M${P(106, -44)}c${n1(-7 * k)} ${n1(8 * k)} ${n1(-5 * k)} ${n1(20 * k)} ${n1(2 * k)} ${n1(22 * k)}c${n1(7 * k)} ${n1(-4 * k)} ${n1(7 * k)} ${n1(-16 * k)} ${n1(-2 * k)} ${n1(-22 * k)}Z" style="fill:${hoof}"/>`;
  // body: hump over the shoulders, straight back, rounded rump, belly
  s += `<path d="M${P(-62, -136)}C${P(-60, -158)} ${P(-34, -164)} ${P(-24, -142)}C${P(4, -132)} ${P(48, -134)} ${P(80, -134)}C${P(100, -132)} ${P(106, -112)} ${P(100, -90)}C${P(96, -74)} ${P(84, -64)} ${P(66, -62)}C${P(30, -58)} ${P(-20, -58)} ${P(-48, -62)}C${P(-66, -64)} ${P(-80, -74)} ${P(-82, -92)}C${P(-82, -110)} ${P(-74, -128)} ${P(-62, -136)}Z" style="fill:url(#rg-cow) ${c};stroke:${cd};stroke-width:2.2"/>`;
  s += `<path d="M${P(-58, -146)}C${P(-50, -158)} ${P(-36, -158)} ${P(-30, -146)}C${P(-40, -138)} ${P(-52, -136)} ${P(-58, -146)}Z" style="fill:${dk};opacity:.35"/>`;
  s += `<path d="M${P(-20, -136)}C${P(20, -130)} ${P(60, -130)} ${P(84, -128)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.75"/><path d="M${P(-44, -66)}C${P(0, -62)} ${P(50, -62)} ${P(86, -72)}" style="fill:none;stroke:${cs};stroke-width:6;opacity:.6"/>`;
  s += `<path d="M${P(66, -128)}C${P(58, -110)} ${P(60, -90)} ${P(72, -74)}" style="fill:none;stroke:${cs};stroke-width:1.6;opacity:.7"/><path d="M${P(-40, -120)}C${P(-34, -100)} ${P(-36, -84)} ${P(-46, -70)}" style="fill:none;stroke:${cs};stroke-width:1.6;opacity:.7"/>`;
  s += leg(-50, false, false) + leg(66, true, false);
  // neck down to the grass, a hanging dewlap underneath
  s += `<path d="M${P(-66, -140)}C${P(-90, -130)} ${P(-108, -100)} ${P(-118, -66)}L${P(-104, -40)}C${P(-96, -56)} ${P(-86, -70)} ${P(-76, -78)}Z" style="fill:${c};stroke:${cd};stroke-width:2"/>`;
  s += `<path d="M${P(-78, -80)}C${P(-80, -60)} ${P(-90, -44)} ${P(-102, -38)}C${P(-96, -52)} ${P(-92, -66)} ${P(-90, -82)}Z" style="fill:${cs};stroke:${cd};stroke-width:1.4"/>`;
  // head: long face down, muzzle in the grass; short horns, a drooping ear, one eye
  s += `<path d="M${P(-104, -82)}L${P(-100, -98)}L${P(-96, -96)}L${P(-98, -80)}Z" style="fill:${mx('strata-2', INK, 40)}"/>`;
  s += `<path d="M${P(-120, -70)}C${P(-112, -76)} ${P(-102, -74)} ${P(-100, -64)}C${P(-104, -44)} ${P(-112, -22)} ${P(-118, -8)}C${P(-122, 0)} ${P(-134, 0)} ${P(-138, -6)}C${P(-140, -24)} ${P(-132, -50)} ${P(-120, -70)}Z" style="fill:url(#rg-cow) ${c};stroke:${cd};stroke-width:2"/>`;
  s += `<path d="M${P(-138, -10)}C${P(-136, -2)} ${P(-124, 0)} ${P(-118, -8)}C${P(-122, -16)} ${P(-132, -18)} ${P(-138, -10)}Z" style="fill:${mx('strata-5', 'strata-1', 50)}"/>`;
  s += `<path d="M${P(-104, -64)}C${P(-92, -66)} ${P(-84, -56)} ${P(-86, -48)}C${P(-94, -48)} ${P(-102, -54)} ${P(-104, -64)}Z" style="fill:${cs};stroke:${cd};stroke-width:1.6"/>`;
  s += `<ellipse cx="${n1(x - 118 * k)}" cy="${n1(y - 50 * k)}" rx="${n1(2.6 * k)}" ry="${n1(2 * k)}" style="fill:${INK}"/><path d="M${P(-128, -40)}C${P(-126, -54)} ${P(-122, -62)} ${P(-116, -68)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.6"/>`;
  return s;
}

// -- grass ------------------------------------------------------------------------------------------
// one blade from (x, gy): o.len (total), o.cut (true: flat top), o.lean, o.w, o.grow (length added at the base), o.marks
function blade(x, gy, o) {
  const L = o.len, w = o.w ?? 12, lean = o.lean ?? 0, top = gy - L, q = (u) => [x + lean * u * u * L * 0.25, gy - u * L];
  const wAt = (u) => w * (o.cut ? 1 - u * 0.35 : 1 - u * 0.92);
  const N = 10, left = [], right = [];
  for (let i = 0; i <= N; i++) { const u = i / N, [px, py] = q(u); left.push([px - wAt(u) / 2, py]); right.push([px + wAt(u) / 2, py]); }
  const tipL = left[N], tipR = right[N];
  let d = `M${left.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}`;
  d += o.cut ? `L${n1(tipR[0])} ${n1(tipR[1])}` : `L${n1(q(1.04)[0])} ${n1(q(1.04)[1])}`;
  d += `L${right.reverse().map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
  let s = `<path d="${d}" style="fill:url(#rg-blade) ${G};stroke:${GD};stroke-width:1.6;stroke-linejoin:round"/>`;
  // the young part at the base, paler, made since the cut
  if (o.grow > 0) {
    const u1 = Math.min(1, o.grow / L), sub = [];
    for (let i = 0; i <= 6; i++) { const u = (i / 6) * u1, [px, py] = q(u); sub.push([px - wAt(u) / 2 + 1, py]); }
    for (let i = 6; i >= 0; i--) { const u = (i / 6) * u1, [px, py] = q(u); sub.push([px + wAt(u) / 2 - 1, py]); }
    s += `<path d="M${sub.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z" style="fill:${GL};opacity:.75"/>`;
  }
  { const u1 = Math.min(0.16, 26 / L), sh = []; for (let i = 0; i <= 4; i++) { const u = (i / 4) * u1, [px, py] = q(u); sh.push([px - wAt(u) / 2, py]); } for (let i = 4; i >= 0; i--) { const u = (i / 4) * u1, [px, py] = q(u); sh.push([px + wAt(u) / 2, py]); } s += `<path d="M${sh.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z" style="fill:${GD};opacity:.45"/>`; }
  // midrib and a lit edge
  const mid = []; for (let i = 0; i <= N; i++) mid.push(q(i / N));
  s += `<path d="M${mid.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}" style="fill:none;stroke:${GD};stroke-width:1.2;opacity:.6"/>`;
  s += `<path d="M${left.slice(1, N).map((p) => `${n1(p[0] + 1.4)} ${n1(p[1])}`).join('L')}" style="fill:none;stroke:${W_};stroke-width:1.2;opacity:.5"/>`;
  if (o.cut) s += `<path d="M${n1(tipL[0])} ${n1(tipL[1])}L${n1(tipR[0])} ${n1(tipR[1])}" style="stroke:${mx('strata-2', 'gold', 50)};stroke-width:3;stroke-linecap:round"/>`;
  if (o.marks) for (const m of o.marks) { const [px, py] = q(1 - m / L); s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="3.6" style="fill:${INK};stroke:${W_};stroke-width:1.2"/>`; }
  if (o.meri) { const [px, py] = q(Math.min(0.12, 18 / L)); s += `<rect x="${n1(px - w / 2 - 3)}" y="${n1(py - 8)}" width="${n1(w + 6)}" height="16" rx="5" style="fill:${MERI};opacity:${o.meri};stroke:${mx('series-5', INK, 40)};stroke-width:1.4"/>`; }
  return { svg: s, top: q(1), base: q(0) };
}

// -- grass stem (culm) with nodes; the intercalary meristem above each node ---------------------------
// A grass leaf arises AT a node: its sheath starts at the node and wraps the internode above it, with parallel veins;
// at the sheath's top a small pale ligule, then the blade bends out, alternate sides. Each node is a swollen shaded
// band. Just above each node, inside the sheath base, a paler, softer growing collar: the intercalary meristem.
function grassBlade(bx, by, side, len, k, o = {}) {
  // a long strap blade, rising out then arching over; parallel veins along it
  const pts = [], N = 12, up = o.up ?? 0.62;
  for (let i = 0; i <= N; i++) { const u = i / N, x = bx + side * len * (0.12 * u + 0.62 * u * u), y = by - len * (up * Math.sin(u * 2.2)) + len * 0.18 * u * u * u; pts.push([x, y]); }
  const wAt = (u) => (o.w ?? 11 * k) * (u < 0.1 ? 0.75 + u * 2.5 : 1 - Math.pow((u - 0.1) / 0.9, 1.6) * 0.96);
  const nrm = (i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const L = [], R = [];
  for (let i = 0; i <= N; i++) { const [nx, ny] = nrm(i), w = wAt(i / N) / 2; L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]); }
  const d = `M${L.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}L${R.reverse().map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
  const vein = (f) => `M${pts.slice(0, N).map((p, i) => { const [nx, ny] = nrm(i), w = wAt(i / N) / 2 * f; return `${n1(p[0] + nx * w)} ${n1(p[1] + ny * w)}`; }).join('L')}`;
  return `<path d="${d}" style="fill:url(#rg-blade) ${G};stroke:${GD};stroke-width:1.4;stroke-linejoin:round"/>`
    + `<path d="${vein(0)}" style="fill:none;stroke:${GD};stroke-width:1.3;opacity:.7"/><path d="${vein(0.5)}${vein(-0.5)}" style="fill:none;stroke:${GD};stroke-width:.7;opacity:.45"/><path d="${vein(0.78)}" style="fill:none;stroke:${W_};stroke-width:1;opacity:.45"/>`;
}
function culm(x, gy, k, o) {
  const nodes = [0, 86, 168, 244, 312].map((v) => gy - v * k), w = 12 * k, top = nodes[4] - 54 * k, a = o.alpha ?? 1;
  let s = `<rect x="${n1(x - w / 2)}" y="${n1(top)}" width="${n1(w)}" height="${n1(gy - top)}" rx="${n1(w / 2)}" style="fill:url(#rg-culm) ${G};stroke:${GD};stroke-width:1.6"/>`;
  s += `<path d="M${n1(x - w * 0.18)} ${n1(top + 4)}V${n1(gy - 4)}M${n1(x + w * 0.2)} ${n1(top + 4)}V${n1(gy - 4)}" style="stroke:${GD};stroke-width:.8;opacity:.4"/><path d="M${n1(x - w * 0.28)} ${n1(top + 6)}V${n1(gy - 4)}" style="stroke:${W_};stroke-width:2;opacity:.5"/>`;
  // flower head at the top
  for (let i = 0; i < 10; i++) { const yy = top - i * 9 * k; s += `<ellipse cx="${n1(x + (i % 2 ? 5 : -5) * k)}" cy="${n1(yy)}" rx="${n1(4.4 * k)}" ry="${n1(7.4 * k)}" transform="rotate(${i % 2 ? 18 : -18} ${n1(x + (i % 2 ? 5 : -5) * k)} ${n1(yy)})" style="fill:url(#rg-seed) ${mx('gold', 'elev-low', 50)};stroke:${GD};stroke-width:1"/>`; }
  // growing collars above each node: paler, soft, under the sheath
  nodes.forEach((ny, i) => {
    if (i === 0 || i === 4) return;
    const z0 = ny - 4 * k, z1 = ny - 26 * k;
    s += `<rect x="${n1(x - w / 2 - 1)}" y="${n1(z1)}" width="${n1(w + 2)}" height="${n1(z0 - z1)}" rx="${n1(w * 0.4)}" style="fill:url(#rg-collar) ${GL}"/>`;
  });
  const sheaths = [], blades = [];
  nodes.forEach((ny, i) => {
    const above = i < 4 ? nodes[i + 1] : top, sh = Math.min((ny - above) * 0.72, 62 * k), side = i % 2 ? 1 : -1, sw = w + 7 * k, lig = ny - sh;
    // the sheath: starts at the node, wraps the stem, its overlapping margin running up one side
    sheaths.push(`<path d="M${n1(x - sw / 2)} ${n1(ny)}L${n1(x - sw / 2 + 1)} ${n1(lig + 4)}Q${n1(x)} ${n1(lig - 4)} ${n1(x + sw / 2 - 1)} ${n1(lig + 2)}L${n1(x + sw / 2)} ${n1(ny)}Z" style="fill:url(#rg-sheath) ${G};stroke:${GD};stroke-width:1.3;opacity:.86"/>`
      + `<path d="M${n1(x - sw * 0.28)} ${n1(ny - 2)}V${n1(lig + 4)}M${n1(x)} ${n1(ny - 2)}V${n1(lig + 1)}M${n1(x + sw * 0.28)} ${n1(ny - 2)}V${n1(lig + 3)}" style="stroke:${GD};stroke-width:.8;opacity:.5"/>`
      + `<path d="M${n1(x + side * sw * 0.42)} ${n1(ny - 3)}Q${n1(x + side * sw * 0.1)} ${n1((ny + lig) / 2)} ${n1(x - side * sw * 0.2)} ${n1(lig + 3)}" style="fill:none;stroke:${GD};stroke-width:1.2;opacity:.7"/>`
      + `<path d="M${n1(x - sw * 0.44)} ${n1(ny - 3)}V${n1(lig + 6)}" style="stroke:${W_};stroke-width:1.4;opacity:.5"/>`
      + `<path d="M${n1(x - sw / 2 + 1)} ${n1(lig + 3)}Q${n1(x)} ${n1(lig - 6)} ${n1(x + sw / 2 - 1)} ${n1(lig + 1)}" style="fill:none;stroke:${mx(GL, W_, 40)};stroke-width:2.6;stroke-linecap:round"/>`);
    if (i < 4) blades.push(grassBlade(x + side * sw * 0.3, lig + 2, side, (o.bladeLen ?? 170) * k * (1 - i * 0.08), k, { w: 11 * k }));
  });
  // the swollen nodes: a shaded band, wider than the stem, lit on its upper left
  let nd = '';
  nodes.forEach((ny, i) => {
    if (i === 0) return;
    const rx = w / 2 + 6 * k, ry = 5.4 * k;
    nd += `<ellipse cx="${n1(x)}" cy="${n1(ny)}" rx="${n1(rx)}" ry="${n1(ry)}" style="fill:url(#rg-node) ${mx(G, 'strata-3', 60)};stroke:${GD};stroke-width:1.3"/><path d="M${n1(x - rx * 0.8)} ${n1(ny - ry * 0.2)}Q${n1(x - rx * 0.2)} ${n1(ny - ry * 0.95)} ${n1(x + rx * 0.4)} ${n1(ny - ry * 0.7)}" style="fill:none;stroke:${W_};stroke-width:1.4;opacity:.6"/>`;
  });
  let meri = '';
  if (o.meri) nodes.forEach((ny, i) => {
    if (i === 0 || i === 4) return;
    const z0 = ny - 5 * k, z1 = ny - 26 * k;
    // a soft violet glow on the pale collar: dividing cells inside the sheath base, fading out at both ends
    meri += `<rect x="${n1(x - w / 2 - 6)}" y="${n1(z1 + 2)}" width="${n1(w + 12)}" height="${n1(z0 - z1 - 2)}" rx="${n1(w * 0.6)}" style="fill:${mx('series-5', W_, 60)};opacity:${n1(o.meri * 0.55)};filter:url(#cw-blur3)"/>`
      + `<rect x="${n1(x - w / 2 - 1)}" y="${n1(z1 + 5)}" width="${n1(w + 2)}" height="${n1(z0 - z1 - 8)}" rx="${n1(w * 0.45)}" style="fill:${mx('series-5', W_, 40)};opacity:${n1(o.meri * 0.5)};filter:url(#cw-blur1)"/>`;
  });
  s = `<g opacity="${a}">${blades.join('')}${s}${sheaths.join('')}${meri}${nd}</g>`;
  return { svg: s, nodes, w };
}
/** A pasture behind the stem: soft sky over a far meadow, blurred grass heads and tufts, no hills. */
function pasture(W, H, hz, o = {}) {
  const q = rnd(o.seed ?? 8);
  let s = `<defs><linearGradient id="rg-past" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sky-day', W_, 36)}"/><stop offset="${n1(hz / H)}" style="stop-color:${mx('sky-day', W_, 70)}"/><stop offset="${n1(Math.min(1, hz / H + 0.04))}" style="stop-color:${mx('elev-low', W_, 50)}"/><stop offset="1" style="stop-color:${mx('elev-low', 'strata-4', 30)}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#rg-past)"/>`;
  s += `<ellipse cx="${n1(W * 0.7)}" cy="${n1(hz * 0.5)}" rx="${n1(W * 0.3)}" ry="${n1(hz * 0.4)}" style="fill:${W_};opacity:.4;filter:url(#pa-softer)"/>`;
  // a far line of trees, soft, then rows of blurred tufts getting bigger toward us
  let tr = ''; for (let i = 0; i < 14; i++) { const x = (i / 13) * W + (q() - 0.5) * 30, r = 18 + q() * 22; tr += `<ellipse cx="${n1(x)}" cy="${n1(hz - r * 0.3)}" rx="${n1(r)}" ry="${n1(r * 0.7)}"/>`; }
  s += `<g style="fill:${mx('elev-low', 'sky-day', 46)};opacity:.7;filter:url(#pa-soft)">${tr}</g>`;
  for (let row = 0; row < 4; row++) {
    const y = hz + 10 + row * (H - hz) * 0.22, h = 10 + row * 12;
    let t = ''; for (let i = 0; i < 30 - row * 5; i++) { const x = q() * W, hh = h * (0.6 + q() * 0.6); t += `M${n1(x - 3)} ${n1(y)}Q${n1(x)} ${n1(y - hh)} ${n1(x + (q() - 0.5) * 10)} ${n1(y - hh * 1.1)}Q${n1(x + 2)} ${n1(y - hh * 0.5)} ${n1(x + 3)} ${n1(y)}Z`; }
    s += `<path d="${t}" style="fill:${mx('elev-low', row % 2 ? 'gold' : 'sky-day', 70 + row * 6)};opacity:${n1(0.35 + row * 0.12)};filter:url(#cw-blur${row < 2 ? 3 : 1})"/>`;
  }
  return s;
}
// -- a young hedge shoot, opposite leaves at each node, buds in the leaf axils ------------------------
function shoot(x, gy, k, o) {
  const cut = o.cut, wk = o.weeks ?? 0, nodes = [0, 70, 132, 186, 232].map((v) => gy - v * k), stemTop = cut ? nodes[3] - 14 * k : nodes[4] - 50 * k, w = 9 * k;
  let s = `<path d="M${n1(x - w / 2)} ${n1(gy)}L${n1(x - w * 0.4)} ${n1(stemTop)}H${n1(x + w * 0.4)}L${n1(x + w / 2)} ${n1(gy)}Z" style="fill:url(#rg-culm) ${G};stroke:${GD};stroke-width:1.8"/>`;
  if (cut) s += `<path d="M${n1(x - w * 0.6)} ${n1(stemTop)}H${n1(x + w * 0.6)}" style="stroke:${mx('strata-1', W_, 30)};stroke-width:3.4;stroke-linecap:round"/>`;
  else s += `<path d="M${n1(x)} ${n1(stemTop - 22 * k)}C${n1(x - 10 * k)} ${n1(stemTop - 6 * k)} ${n1(x - 4 * k)} ${n1(stemTop)} ${n1(x)} ${n1(stemTop + 4)}C${n1(x + 4 * k)} ${n1(stemTop)} ${n1(x + 10 * k)} ${n1(stemTop - 6 * k)} ${n1(x)} ${n1(stemTop - 22 * k)}Z" style="fill:${GL};stroke:${GD};stroke-width:1.4"/>`;
  const branch = (bx, by, side, len) => {
    if (len < 2) return `<ellipse cx="${n1(bx + side * 6 * k)}" cy="${n1(by - 6 * k)}" rx="${n1(4 * k)}" ry="${n1(6 * k)}" transform="rotate(${side * 30} ${n1(bx + side * 6 * k)} ${n1(by - 6 * k)})" style="fill:${GL};stroke:${GD};stroke-width:1.4"/>`;
    const ex = bx + side * len * 0.7, ey = by - len * 0.75;
    let b = `<path d="M${n1(bx)} ${n1(by)}Q${n1(bx + side * len * 0.2)} ${n1(by - len * 0.5)} ${n1(ex)} ${n1(ey)}" style="fill:none;stroke:${GD};stroke-width:${n1(6 * k)};stroke-linecap:round"/><path d="M${n1(bx)} ${n1(by)}Q${n1(bx + side * len * 0.2)} ${n1(by - len * 0.5)} ${n1(ex)} ${n1(ey)}" style="fill:none;stroke:${G};stroke-width:${n1(3.6 * k)};stroke-linecap:round"/>`;
    if (len > 24) b += svgLeaf(ex, ey, 0.34 * k, { rot: side * 40 - 10, len: 70 }) + svgLeaf(ex, ey, 0.3 * k, { rot: side * -20, len: 60 });
    if (len > 50) { const mx2 = bx + side * len * 0.38, my2 = by - len * 0.42; b += svgLeaf(mx2, my2, 0.3 * k, { rot: side * 80, len: 60 }) + svgLeaf(mx2, my2, 0.28 * k, { rot: side * -50, len: 60 }); }
    return b;
  };
  nodes.slice(1).forEach((ny, i) => {
    if (ny < stemTop) return;
    s += `<rect x="${n1(x - w / 2 - 2)}" y="${n1(ny - 3 * k)}" width="${n1(w + 4)}" height="${n1(6 * k)}" rx="3" style="fill:${mx(G, 'strata-3', 70)};stroke:${GD};stroke-width:1.2"/>`;
    s += svgLeaf(x - w / 2, ny, 0.42 * k, { rot: -64, len: 80 }) + svgLeaf(x + w / 2, ny, 0.42 * k, { rot: 64, len: 80 });
    const grow = cut ? Math.max(0, (wk - (3 - i) * 0.6)) * (i >= 2 ? 22 : 12) * k : 0;
    s += branch(x - w / 2, ny - 2, -1, grow) + branch(x + w / 2, ny - 2, 1, grow * 0.9);
  });
  return { svg: s, nodes, top: stemTop };
}

export class RegrowNodes extends SvgScene {
  static BEAT_STEP_MAP = GRASS_MAP;
  static BEAT_MAPS = { 2: GRASS_MAP, 3: STEM_MAP };
  static WIDTH = 680;
  static HEIGHT = 482;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 580;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Grass after grazing, a cow grazing behind: the cut tops stay flat while the blades grow taller from a zone of dividing cells near the base. A grass stem with nodes and internodes, and the intercalary meristem at the base of each internode just above a node. A young shoot whose tip is cut: it stops growing taller and buds at the nodes grow into branches.';
  static CONTROLS = [];

  async setup() {
    this._days = 6; this._weeks = 4;
    await super.setup();
    this.ctl = ctlBar(this, [
      { kind: 'range', id: 'days', label: 'Days after grazing', min: 0, max: 12, step: 1, value: 6, read: (v) => `${v}`, say: (v) => `${v} days` },
      { kind: 'range', id: 'weeks', label: 'Weeks after cutting', min: 0, max: 6, step: 1, value: 4, read: (v) => `${v}`, say: (v) => `${v} weeks` },
    ], (id, v) => { if (id === 'days') this._days = v; else this._weeks = v; this.repaint(); });
    this._show();
  }
  enter(step) { this._days = 6; this._weeks = 4; this.ctl?.set('days', 6); this.ctl?.set('weeks', 4); this._show(step); }
  _show(step = this.stepIndex) { if (!this.ctl) return; this.ctl.show('days', step <= 1); this.ctl.show('weeks', step === 4); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 470 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 15 : 16;
    let s = `<defs><linearGradient id="rg-blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${GL}"/><stop offset=".5" style="stop-color:${G}"/><stop offset="1" style="stop-color:${GD}"/></linearGradient>`
      + `<linearGradient id="rg-culm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${GD}"/><stop offset=".3" style="stop-color:${GL}"/><stop offset=".7" style="stop-color:${G}"/><stop offset="1" style="stop-color:${GD}"/></linearGradient>`
      + `<linearGradient id="rg-sheath" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${mx(G, INK, 80)}"/><stop offset=".3" style="stop-color:${mx(GL, W_, 70)}"/><stop offset=".75" style="stop-color:${G}"/><stop offset="1" style="stop-color:${GD}"/></linearGradient>`
      + `<linearGradient id="rg-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(GL, W_, 50)};stop-opacity:0"/><stop offset=".45" style="stop-color:${mx(GL, W_, 40)}"/><stop offset="1" style="stop-color:${mx(GL, W_, 30)}"/></linearGradient>`
      + `<radialGradient id="rg-node" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:${mx(GL, W_, 70)}"/><stop offset=".6" style="stop-color:${mx(G, 'strata-3', 70)}"/><stop offset="1" style="stop-color:${mx(GD, 'strata-3', 70)}"/></radialGradient>`
      + `<radialGradient id="rg-seed" cx=".35" cy=".3" r=".9"><stop offset="0" style="stop-color:${mx('gold', W_, 60)}"/><stop offset="1" style="stop-color:${mx('gold', 'elev-low', 40)}"/></radialGradient>`
      + `<linearGradient id="rg-cow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${W_}"/><stop offset=".6" style="stop-color:${mx('strata-1', W_, 30)}"/><stop offset="1" style="stop-color:${mx('strata-1', 'strata-5', 60)}"/></linearGradient></defs>`;
    if (step <= 1) return { svg: cwFrame(st, 'rg', s + this._grass(W, H, P, step, fs)) };
    return { svg: cwFrame(st, 'rg', s + this._stem(W, H, P, step, fs)) };
  }

  _grass(W, H, P, step, fs) {
    const hz = H * (P ? 0.3 : 0.36), gy = H - (P ? 40 : 34);
    let s = pasture(W, H, hz + 16, { seed: 3 }) + grass(W, hz + 30, 14, { seed: 2 });
    s += `<rect y="${n1(hz + 20)}" width="${W}" height="${n1(H - hz)}" style="fill:${T('elev-low')};opacity:.35"/>`;
    s += cow(P ? W * 0.74 : W * 0.75, hz + (P ? 86 : 110), P ? 0.6 : 0.95);
    s += grass(W, gy + 8, 22, { seed: 7, gap: 3.4 });
    // the clump: cut blades, all cut at the same height, regrowing from the base
    const cx = P ? W * 0.42 : W * 0.36, cut = P ? 150 : 170, g = this._days * (P ? 9 : 11), q = rnd(4);
    let back = '', front = '';
    const blades = [[-74, 0.84], [-58, 0.92], [-42, 0.97], [-26, 1], [-12, 0.9], [18, 0.96], [32, 1], [48, 0.93], [62, 0.88], [78, 0.82]];
    let far = '';
    for (const [dx, f] of [[-50, 0.8], [-20, 0.86], [10, 0.84], [40, 0.8], [70, 0.76]]) far += blade(cx + dx * 0.4, gy - 2, { len: cut * f + g, cut: true, lean: dx / 46, w: P ? 12 : 15, grow: step === 1 ? g : 0, meri: step === 1 ? 0.3 : 0 }).svg;
    back += `<g style="filter:brightness(.82)">${far}</g>`;
    for (const [dx, f] of blades) back += blade(cx + dx * (P ? 0.36 : 0.45), gy, { len: cut * f + g, cut: true, lean: dx / 52, w: P ? 14 : 18, grow: step === 1 ? g : 0, meri: step === 1 ? 0.4 : 0 }).svg;
    const hero = blade(cx + 4, gy, { len: cut + g, cut: true, lean: 0.1, w: P ? 20 : 24, grow: step === 1 ? g : 0, marks: [16, 46, 76], meri: step === 1 ? 0.75 : 0 });
    front += hero.svg;
    // soil mound at the base
    s += back + front + `<ellipse cx="${n1(cx)}" cy="${n1(gy + 6)}" rx="${n1(P ? 90 : 120)}" ry="12" style="fill:url(#pa-soil) ${T('strata-3')}"/>${textureRect(cx - 110, gy - 4, 220, 20, 'grain', 0.25, 10)}`;
    for (let i = 0; i < 10; i++) s += `<ellipse cx="${n1(cx - 100 + q() * 200)}" cy="${n1(gy + 2 + q() * 8)}" rx="${n1(3 + q() * 4)}" ry="2.4" style="fill:${mx('strata-3', 'strata-1', 50)}"/>`;
    // the cut height
    const cy = gy - cut, lx0 = cx - (P ? 100 : 130), lx1 = cx + (P ? 100 : 120);
    s += `<path d="M${n1(lx0)} ${n1(cy)}H${n1(lx1)}" style="stroke:${W_};stroke-width:2.6;stroke-dasharray:8 6;opacity:.95"/><path d="M${n1(lx0)} ${n1(cy)}H${n1(lx1)}" style="stroke:${INK};stroke-width:1;stroke-dasharray:8 6"/>`;
    s += P ? label(lx1 + 4, cy + 5, 'cut here', { size: fs - 1, anchor: 'start' }) : label(lx0 - 4, cy + 5, 'cut here', { size: fs - 1, anchor: 'end' });
    const tx = hero.top[0], ty = hero.top[1];
    if (step === 0) s += `<path d="M${n1(tx + 16)} ${n1(ty)}L${n1(tx + (P ? 50 : 70))} ${n1(ty - 16)}" style="stroke:${INK};stroke-width:2.2"/>` + label(tx + (P ? 52 : 74), ty - 20, 'top stays flat', { size: fs, anchor: 'start' });
    if (step === 1) {
      const by = gy - 14;
      s += `<path d="M${n1(cx + 18)} ${n1(by)}L${n1(cx + (P ? 54 : 76))} ${n1(by - 30)}" style="stroke:${INK};stroke-width:2.2"/>` + label(cx + (P ? 56 : 78), by - 34, 'dividing cells', { size: fs, anchor: 'start', ink: T('series-5') });
      if (g > 0) s += label(cx + (P ? 56 : 78), by - 14, 'new growth', { size: fs - 1, anchor: 'start' });
    }
    s += label(P ? W * 0.5 : W * 0.5, 26, `${this._days} ${this._days === 1 ? 'day' : 'days'} after grazing`, { size: P ? 17 : 19, display: true });
    return s;
  }

  _stem(W, H, P, step, fs) {
    // a pasture in soft morning light: the stem stands in a grass clump, other tillers behind it
    const gy = H - (P ? 26 : 22);
    if (step <= 3) {
      let s = pasture(W, H, H * 0.34, { seed: 8 });
      const k = P ? 1.0 : 0.96, x = W * (P ? 0.36 : 0.4);
      // the clump: older tillers behind, softer and shorter, each with its own nodes and sheathing leaves
      for (const [dx, kk, al] of [[-46, 0.8, 0.5], [40, 0.86, 0.55], [-18, 0.7, 0.62], [70, 0.66, 0.5]]) s += culm(x + dx * (P ? 0.7 : 1), gy, k * kk, { alpha: al, bladeLen: P ? 120 : 150 }).svg;
      s += `<ellipse cx="${n1(x)}" cy="${n1(gy + 4)}" rx="${n1(P ? 100 : 130)}" ry="10" style="fill:${mx('strata-3', 'elev-low', 50)};opacity:.7;filter:url(#pa-soft)"/>`;
      const c = culm(x, gy, k, { meri: step === 3 ? 0.9 : 0, bladeLen: P ? 120 : 170 });
      s += c.svg;
      const lx = P ? W * 0.63 : W * 0.72, lead = (y0, y1, x1) => `<path d="M${n1(lx - 6)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" style="stroke:${INK};stroke-width:2.2"/><circle cx="${n1(x1)}" cy="${n1(y1)}" r="3.6" style="fill:${INK};stroke:${W_};stroke-width:1.2"/>`;
      const n1y = c.nodes[2], n2y = c.nodes[3], ex = x + c.w / 2 + 7 * k;
      if (step === 2) {
        s += lead(n1y + 30, n1y, ex) + label(lx, n1y + 35, 'node', { size: fs + 1, anchor: 'start', display: true });
        s += lead((n1y + n2y) / 2, (n1y + n2y) / 2 - 16 * k, x + c.w / 2 + 6) + label(lx, (n1y + n2y) / 2 + 5, 'internode', { size: fs + 1, anchor: 'start', display: true });
        s += lead(n2y - 24, n2y, ex) + label(lx, n2y - 19, 'node', { size: fs + 1, anchor: 'start', display: true });
        s += lead(n2y - 70, n2y - 30 * k, x + c.w / 2 + 4) + label(lx, n2y - 72, P ? 'leaf sheath' : 'leaf starts at a node', { size: fs - 1, anchor: 'start' });
      } else {
        const by = c.nodes[2] - 15 * k;
        s += lead(by, by, x + c.w / 2 + 3) + label(lx, by - 4, 'intercalary', { size: fs + 1, anchor: 'start', display: true, ink: T('series-5') }) + label(lx, by + 16, 'meristem', { size: fs + 1, anchor: 'start', display: true, ink: T('series-5') });
        s += label(lx, by + 38, 'just above a node', { size: fs - 1, anchor: 'start' });
      }
      return s;
    }
    let s = pasture(W, H, H * 0.5, { seed: 6 }) + field(W, H, H * 0.82, { vanish: W * 0.3 }) + grass(W, H * 0.84, 14, { seed: 5 });
    const k = P ? 1.2 : 1.25, x = W * (P ? 0.4 : 0.3), sh = shoot(x, gy, k, { cut: true, weeks: this._weeks });
    s += sh.svg;
    // where the tip was: a dashed ghost, and a dashed line: no taller than this
    const full = gy - 282 * k;
    s += `<path d="M${n1(x)} ${n1(sh.top)}V${n1(full)}" style="stroke:${INK};stroke-width:2;stroke-dasharray:5 6;opacity:.45"/><path d="M${n1(x - 70)} ${n1(sh.top)}H${n1(x + 90)}" style="stroke:${W_};stroke-width:2.6;stroke-dasharray:8 6"/>`;
    s += label(x + 26, Math.max(full + 14, 64), 'tip cut off', { size: fs, anchor: 'start' }) + label(x + 96, sh.top + 5, 'no taller', { size: fs, anchor: 'start' });
    if (this._weeks >= 2) s += `<path d="M${n1(P ? W * 0.56 : W * 0.54)} ${n1(sh.nodes[2] - 4)}L${n1(x + 60 * k)} ${n1(sh.nodes[3] - 30 * k)}" style="stroke:${INK};stroke-width:2.2"/>` + label(P ? W * 0.72 : W * 0.68, sh.nodes[2] - 10, 'buds at the nodes', { size: fs, display: true }) + label(P ? W * 0.72 : W * 0.68, sh.nodes[2] + 12, 'grow into branches', { size: fs, display: true });
    s += label(W * 0.5, 26, `${this._weeks} ${this._weeks === 1 ? 'week' : 'weeks'} after cutting`, { size: P ? 17 : 19, display: true });
    return s;
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }
}
