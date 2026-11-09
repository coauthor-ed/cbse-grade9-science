// EpitheliaMap - blk-l07-n01 (7 beats: intro, exchange, protection, secretion, sensory, absorption, summary).
// Book Table 3.2 and Fig 3.11. A calm front outline of the body (no face) with its organs drawn faintly, and for the
// job of each beat a 3D block of that epithelium: (a) one layer of thin flat cells over a capillary, gas dots crossing;
// (b) many layers, the outer cells flat and tight, a germ turned back and a rub on the surface; (c) cuboidal and
// columnar cells round a small gland, droplets released at the top; (d) receptor cells with hair-like cilia among
// supporting cells, a nerve fibre from each; (e) one layer of tall pillar-like cells with a brush of hair-like tops,
// nutrient dots taken in. Job chips light the places in the body and show that block on any beat.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, depthField, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, tube, tapered } from '../shared/BodyArt.js';
import { INK, W_, SKIN, SKIN_D } from '../shared/LimbArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const JOBS = ['exch', 'prot', 'secr', 'sens', 'abso'];
const CHIPS = [
  { id: 'exch', label: 'Exchange', targets: ['exch'], tone: 1 },
  { id: 'prot', label: 'Protection', targets: ['prot'], tone: 2 },
  { id: 'secr', label: 'Secretion', targets: ['secr'], tone: 3 },
  { id: 'sens', label: 'Sensing', targets: ['sens'], tone: 5 },
  { id: 'abso', label: 'Absorption', targets: ['abso'], tone: 8 },
];
const TONE = { exch: 'series-1', prot: 'series-2', secr: 'series-3', sens: 'series-5', abso: 'series-8' };
const NAME = { exch: 'Exchange', prot: 'Protection', secr: 'Secretion', sens: 'Sensing', abso: 'Absorption' };
const WHERE = { exch: 'lungs, blood vessels', prot: 'skin, mouth, oesophagus', secr: 'salivary and sweat glands, stomach', sens: 'nostrils, taste buds, inner ear', abso: 'small intestine' };
const SHAPE = { exch: 'one layer of thin, flat cells', prot: 'many layers, outer cells flat', secr: 'cuboidal or columnar cells', sens: 'receptor cells with cilia', abso: 'one layer of tall cells' };
// spots in the body (local coords of the outline, 200 by 420)
const SPOTS = { exch: [[72, 158], [128, 158], [104, 250]], prot: [[100, 57], [100, 112], [15, 236]], secr: [[84, 72], [116, 72], [132, 240], [185, 230]], sens: [[100, 40], [100, 57], [71, 40], [129, 40]], abso: [[100, 274]] };
const STEP_JOB = { 1: 'exch', 2: 'prot', 3: 'secr', 4: 'sens', 5: 'abso' };

const CELL = mx('series-4', 'elev-peak', 26), CELL_D = mx('series-4', 'strata-6', 46), CELL_L = mx('series-4', 'elev-peak', 12);
const CT = mx('series-4', 'elev-peak', 14), CT_D = mx('series-4', 'strata-6', 30);
const BLD = mx('series-6', 'strata-6', 78), BLD_D = mx('series-6', 'strata-6', 46);

// -- the body outline with faint organs ------------------------------------------------------------------------
function body(job, all) {
  const on = (j) => all || job === j, a = (j) => (on(j) ? 1 : 0.28);
  const parts = [
    `<ellipse cx="100" cy="40" rx="29" ry="35"/>`, `<rect x="87" y="66" width="26" height="30" rx="8"/>`,
    `<path d="M66 88C42 92 32 100 32 122C34 160 46 200 52 232C50 260 44 280 44 300L156 300C156 280 150 260 148 232C154 200 166 160 168 122C168 100 158 92 134 88Z"/>`,
    `<path d="${tapered([[36, 102], [22, 170], [14, 240], [10, 300]], [12, 10, 8, 8])}"/>`, `<path d="${tapered([[164, 102], [178, 170], [186, 240], [190, 300]], [12, 10, 8, 8])}"/>`,
    `<path d="${tapered([[74, 290], [72, 360], [70, 420]], [27, 23, 18])}"/>`, `<path d="${tapered([[126, 290], [128, 360], [130, 420]], [27, 23, 18])}"/>`,
  ].join('');
  const rimW = on('prot') && !all ? 7 : 5;
  let s = `<g style="fill:none;stroke:${on('prot') && !all ? mx('series-2', INK, 60) : SKIN_D};stroke-width:${rimW}">${parts}</g><g style="fill:${mx(SKIN, 'elev-peak', 60)};stroke:none">${parts}</g>`;
  s += `<g style="fill:${W_};opacity:.35;stroke:none"><ellipse cx="90" cy="28" rx="10" ry="14"/><path d="M48 100C40 120 38 170 42 220" style="fill:none;stroke:${W_};stroke-width:8;stroke-linecap:round"/></g>`;
  // organs
  const lung = (sx) => `M${100 + sx * 8} 116C${100 + sx * 40} 104 ${100 + sx * 54} 150 ${100 + sx * 50} 206C${100 + sx * 34} 214 ${100 + sx * 14} 206 ${100 + sx * 10} 190Z`;
  s += `<g style="opacity:${a('exch')}"><path d="${lung(-1)}" style="fill:${mx('series-4', 'elev-peak', 50)};stroke:${mx('series-4', INK, 50)};stroke-width:2"/><path d="${lung(1)}" style="fill:${mx('series-4', 'elev-peak', 50)};stroke:${mx('series-4', INK, 50)};stroke-width:2"/>`
    + tube('M104 150V292M104 292L80 330M104 292L124 330', BLD, 4) + tube('M86 100C60 120 30 150 22 230', BLD, 3) + `</g>`;
  s += `<g style="opacity:${on('exch') || on('prot') ? 1 : 0.4}">${tube('M100 74V132M100 132L84 146M100 132L116 146', mx('series-1', 'elev-peak', 40), 5)}</g>`;
  const glow = on('prot') && !all;
  if (glow) s += `<path d="M96 62C94 90 96 160 112 220L124 230" style="fill:none;stroke:${mx('series-2', 'elev-peak', 50)};stroke-width:20;opacity:.75;stroke-linecap:round;filter:url(#cw-blur3)"/><ellipse cx="100" cy="58" rx="16" ry="9" style="fill:${mx('series-2', 'elev-peak', 50)};opacity:.85;filter:url(#cw-blur3)"/>`;
  s += `<g style="opacity:${a('prot')}">${tube('M96 62C94 90 96 160 112 220L124 230', glow ? mx('series-2', 'series-8', 60) : mx('series-8', 'elev-peak', 40), glow ? 8 : 6)}</g>`;
  s += `<g style="opacity:${on('secr') ? 1 : 0.18}"><path d="M110 218C112 206 140 206 150 222C160 240 152 262 132 262C120 262 116 250 122 242C128 236 116 232 110 218Z" style="fill:${mx('series-4', 'series-8', 60)};stroke:${mx('series-4', INK, 50)};stroke-width:2"/></g>`;
  s += `<g style="opacity:${a('secr')}">` + [[84, 72], [116, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" style="fill:${mx('series-3', 'elev-peak', 50)};stroke:${mx('series-3', INK, 50)};stroke-width:1.6"/><circle cx="${x - 2}" cy="${y - 2}" r="2.4" style="fill:${W_};opacity:.6"/>`).join('') + `</g>`;
  s += `<g style="opacity:${a('abso')}">${tube('M80 252C120 246 132 256 128 266C120 276 80 270 76 282C74 294 124 296 128 286', mx('series-8', 'series-4', 60), 9)}</g>`;
  return s;
}

// -- 3D tissue blocks ----------------------------------------------------------------------------------------
function cellRect(x, y, w, h, o = {}) {
  const r = Math.min(o.r ?? 5, w / 2, h / 2), col = o.col ?? CELL;
  return `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(r)}" style="fill:${col};stroke:${o.colD ?? CELL_D};stroke-width:${o.sw ?? 1.6}"/>`
    + (h > 10 ? `<path d="M${n1(x + r)} ${n1(y + 2.2)}H${n1(x + w - r)}" style="fill:none;stroke:${CELL_L};stroke-width:1.6;opacity:.8;stroke-linecap:round"/>` : '');
}
/** front face content for each kind, in the box (x, y, w, h); returns { s, top } where top is the surface y */
function front(kind, x, y, w, h) {
  const q = rnd(kind.length * 13);
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:${CT}"/>`;
  for (let i = 0; i < 30; i++) { const fx = x - 20 + q() * (w + 20), fy = y + h * 0.36 + q() * h * 0.62, L = 26 + q() * 40, a = (q() - 0.5) * 0.8; s += `<path d="M${n1(fx)} ${n1(fy)}Q${n1(fx + Math.cos(a) * L / 2)} ${n1(fy + Math.sin(a) * L / 2 + (q() - 0.5) * 10)} ${n1(fx + Math.cos(a) * L)} ${n1(fy + Math.sin(a) * L)}" style="fill:none;stroke:${CT_D};stroke-width:${n1(1.8 + q() * 2.4)};opacity:.22;stroke-linecap:round"/>`; }
  for (let i = 0; i < 12; i++) s += `<ellipse cx="0" cy="0" rx="3.6" ry="1.4" transform="translate(${n1(x + q() * w)} ${n1(y + h * 0.4 + q() * h * 0.56)}) rotate(${n1((q() - 0.5) * 50)})" style="fill:${mx('series-5', INK, 60)};opacity:.65"/>`;
  const memb = (yy) => `<path d="M${x} ${n1(yy)}H${x + w}" style="fill:none;stroke:${CT_D};stroke-width:2.6"/>`;
  if (kind === 'exch') {
    const t = y + 26, th = 13;
    // capillaries right under the thin layer: their own wall is also one layer of thin, flat cells
    for (const [u, r] of [[0.3, 30], [0.72, 34], [0.08, 22]]) {
      const cx = x + w * u, cy = t + th + r + 4;
      s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${r}" style="fill:${mx('series-6', 'elev-peak', 50)};stroke:${CELL_D};stroke-width:4"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${r - 2}" style="fill:none;stroke:${CELL};stroke-width:2.4"/>`;
      for (let i = 0; i < 3; i++) { const a2 = i * 2.1 + 0.6; s += `<ellipse cx="${n1(cx + Math.cos(a2) * (r - 1))}" cy="${n1(cy + Math.sin(a2) * (r - 1))}" rx="6" ry="2.2" transform="rotate(${n1((a2 * 180) / Math.PI + 90)} ${n1(cx + Math.cos(a2) * (r - 1))} ${n1(cy + Math.sin(a2) * (r - 1))})" style="fill:url(#cw-nuc) ${mx('series-5', INK, 60)}"/>`; }
      for (const [dx, dy] of [[-r * 0.3, -r * 0.2], [r * 0.32, r * 0.1], [-r * 0.1, r * 0.42]]) s += `<ellipse cx="${n1(cx + dx)}" cy="${n1(cy + dy)}" rx="${n1(r * 0.3)}" ry="${n1(r * 0.2)}" style="fill:${BLD};stroke:${BLD_D};stroke-width:1"/>`;
    }
    s += `<rect x="${x}" y="${y}" width="${w}" height="${t - y}" style="fill:${mx('series-1', 'elev-peak', 16)}"/>`;
    for (let cx = x - 20, i = 0; cx < x + w; cx += 70, i++) {
      s += `<path d="M${n1(cx)} ${n1(t + th)}C${n1(cx)} ${n1(t)} ${n1(cx + 30)} ${n1(t - 1)} ${n1(cx + 35)} ${n1(t - 6)}C${n1(cx + 40)} ${n1(t - 1)} ${n1(cx + 70)} ${n1(t)} ${n1(cx + 70)} ${n1(t + th)}Z" style="fill:${CELL};stroke:${CELL_D};stroke-width:1.8"/>`;
      s += `<ellipse cx="${n1(cx + 35)}" cy="${n1(t + 3)}" rx="11" ry="5" style="fill:url(#cw-nuc) ${mx('series-5', INK, 60)}"/>`;
    }
    s += memb(t + th + 1);
    return { s, top: t, dots: [] };
  }
  if (kind === 'prot') {
    // stratified: a basal row of upright cells with dark nuclei on the basement line, round-to-polygonal cells above,
    // then flattening cells with granules, then flat dead scales (no nuclei) on top, the outermost lifting off
    const t = y + 14, q2 = rnd(17), SQ = mx(CELL, 'series-2', 62), SQ_D = mx(SQ, INK, 66);
    s += `<rect x="${x}" y="${y}" width="${w}" height="${t - y}" style="fill:${mx('series-2', 'elev-peak', 14)}"/>`;
    let yy = t;
    for (let r = 0; r < 4; r++, yy += 5) for (let cx = x - 10 - q2() * 30; cx < x + w; cx += 38 + q2() * 12) s += `<rect x="${n1(cx)}" y="${n1(yy)}" width="${n1(36 + q2() * 10)}" height="4.6" rx="2.3" style="fill:${mx(SQ, 'elev-peak', 80 - r * 6)};stroke:${SQ_D};stroke-width:.9"/>`;
    for (let r = 0; r < 2; r++, yy += 9) for (let cx = x - 8 - (r % 2) * 12; cx < x + w; cx += 25) {
      s += `<rect x="${n1(cx)}" y="${n1(yy)}" width="24" height="8.6" rx="4" style="fill:${mx(CELL, 'series-2', 82)};stroke:${CELL_D};stroke-width:1"/><ellipse cx="${n1(cx + 12)}" cy="${n1(yy + 4.3)}" rx="4.4" ry="1.8" style="fill:${mx('series-5', INK, 60)};opacity:.8"/>`;
      for (let k = 0; k < 3; k++) s += `<circle cx="${n1(cx + 4 + k * 7 + q2() * 2)}" cy="${n1(yy + 2.4 + q2() * 4)}" r=".9" style="fill:${INK};opacity:.6"/>`;
    }
    for (let r = 0; r < 3; r++, yy += 14) for (let cx = x - 8 - (r % 2) * 8.5; cx < x + w + 10; cx += 17) {
      const j = () => (q2() - 0.5) * 2.4, c = [cx + 8.5, yy + 7];
      const d = `M${n1(cx + j())} ${n1(yy + 3.5 + j())}L${n1(c[0] + j())} ${n1(yy + j())}L${n1(cx + 17 + j())} ${n1(yy + 3.5 + j())}L${n1(cx + 17 + j())} ${n1(yy + 10.5 + j())}L${n1(c[0] + j())} ${n1(yy + 14 + j())}L${n1(cx + j())} ${n1(yy + 10.5 + j())}Z`;
      s += `<path d="${d}" style="fill:${CELL};stroke:${CELL_D};stroke-width:1.1;stroke-linejoin:round"/><circle cx="${n1(c[0] + j() * 0.5)}" cy="${n1(c[1])}" r="3" style="fill:url(#cw-nuc) ${mx('series-5', INK, 60)}"/>`;
    }
    const bm = yy + 19;
    for (let cx = x - 2; cx < x + w; cx += 9) s += `<rect x="${n1(cx)}" y="${n1(yy)}" width="8.4" height="18.6" rx="3.4" style="fill:${mx(CELL, 'series-4', 78)};stroke:${CELL_D};stroke-width:1"/><ellipse cx="${n1(cx + 4.2)}" cy="${n1(yy + 11)}" rx="2.6" ry="4.4" style="fill:${mx('series-5', INK, 70)}"/>`;
    s += memb(bm);
    // a capillary loop rising into the connective tissue just under the basement line
    const lx = x + w * 0.36, top = bm + 12;
    s += tube(`M${n1(lx - 12)} ${n1(y + h + 4)}L${n1(lx - 12)} ${n1(top + 8)}Q${n1(lx - 12)} ${n1(top)} ${n1(lx)} ${n1(top)}Q${n1(lx + 12)} ${n1(top)} ${n1(lx + 12)} ${n1(top + 8)}L${n1(lx + 12)} ${n1(y + h + 4)}`, mx('series-6', 'elev-peak', 40), 8);
    // flakes lifting off the surface
    for (const [u, dy, a] of [[0.12, -6, -8], [0.18, -11, 6], [0.46, -5, -4]]) s += `<rect x="${n1(x + w * u)}" y="${n1(t + dy)}" width="30" height="4" rx="2" transform="rotate(${a} ${n1(x + w * u + 15)} ${n1(t + dy + 2)})" style="fill:${mx(SQ, 'elev-peak', 70)};stroke:${SQ_D};stroke-width:.9"/>`;
    return { s, top: t, dots: [] };
  }
  if (kind === 'secr') {
    const t = y + 20, ch = 34, gx = x + w * 0.55, gw = 52, gd = 70;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${t - y}" style="fill:${mx('series-3', 'elev-peak', 14)}"/>`;
    for (let cx = x; cx < x + w; cx += 26) {
      if (cx + 26 > gx - gw / 2 && cx < gx + gw / 2) continue;
      s += cellRect(cx + 1, t, 24, ch, { r: 5 });
      for (let k = 0; k < 3; k++) s += `<circle cx="${n1(cx + 7 + k * 6)}" cy="${n1(t + 7 + (k % 2) * 3)}" r="2.6" style="fill:${mx('series-3', 'elev-peak', 40)};stroke:${mx('series-3', INK, 50)};stroke-width:.8"/>`;
      s += `<ellipse cx="${n1(cx + 13)}" cy="${n1(t + ch * 0.7)}" rx="6" ry="5" style="fill:url(#cw-nuc) ${mx('series-5', INK, 60)}"/>`;
    }
    // the gland: a flask-shaped pit lined with cuboidal cells, droplets in its middle
    const pit = `M${n1(gx - gw / 2)} ${n1(t)}C${n1(gx - gw / 2)} ${n1(t + gd * 0.6)} ${n1(gx - gw)} ${n1(t + gd)} ${n1(gx)} ${n1(t + gd + 14)}C${n1(gx + gw)} ${n1(t + gd)} ${n1(gx + gw / 2)} ${n1(t + gd * 0.6)} ${n1(gx + gw / 2)} ${n1(t)}`;
    s += `<path d="${pit}" style="fill:none;stroke:${CELL_D};stroke-width:28"/><path d="${pit}" style="fill:none;stroke:${CELL};stroke-width:25"/><path d="${pit}" style="fill:none;stroke:${CELL_D};stroke-width:24;stroke-dasharray:1.6 22;opacity:.9"/>`;
    s += `<path d="${pit}" style="fill:${mx('series-3', 'elev-peak', 14)};stroke:none;transform:scale(.84);transform-box:fill-box;transform-origin:50% 0%"/>`;
    for (let k = 0; k < 4; k++) s += `<circle cx="${n1(gx + (k % 2 ? 6 : -6))}" cy="${n1(t + 20 + k * 14)}" r="4" style="fill:${mx('series-3', 'elev-peak', 50)};stroke:${mx('series-3', INK, 50)};stroke-width:1"/>`;
    s += memb(t + ch + 1).replace(`M${x}`, `M${x}`);
    return { s, top: t, dots: [[gx, t + 40], [gx, y - 50]] };
  }
  if (kind === 'sens') {
    const t = y + 40, ch = 70;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${t - y}" style="fill:${mx('series-5', 'elev-peak', 12)}"/>`;
    for (let cx = x, i = 0; cx < x + w; cx += i % 3 === 1 ? 18 : 24, i++) {
      const rec = i % 3 === 1, cw = rec ? 16 : 22;
      s += cellRect(cx + 1, t, cw, ch, { r: 6, col: rec ? mx('series-5', 'elev-peak', 40) : CELL, colD: rec ? mx('series-5', INK, 56) : CELL_D });
      s += `<ellipse cx="${n1(cx + 1 + cw / 2)}" cy="${n1(t + (rec ? ch * 0.45 : ch * 0.72))}" rx="${n1(cw * 0.3)}" ry="7" style="fill:url(#cw-nuc) ${mx('series-5', INK, 60)}"/>`;
      if (rec) {
        let c = '';
        for (let k = -2; k <= 2; k++) c += `<path d="M${n1(cx + 9 + k * 2.4)} ${n1(t)}q${n1(k * 2)} -12 ${n1(k * 3 + 4)} -24" style="fill:none;stroke:${mx('series-5', INK, 56)};stroke-width:1.8;stroke-linecap:round"/>`;
        s += `<g class="ep-cil" style="animation-delay:${n1(-i * 0.13)}s">${c}</g>`;
        s += `<path d="M${n1(cx + 9)} ${n1(t + ch)}C${n1(cx + 9)} ${n1(t + ch + 20)} ${n1(cx + 30)} ${n1(t + ch + 30)} ${n1(cx + 26)} ${n1(y + h)}" style="fill:none;stroke:${mx('series-2', 'series-8', 50)};stroke-width:2.6"/>`;
      }
    }
    s += memb(t + ch + 1);
    return { s, top: t, dots: [] };
  }
  // abso: tall pillar cells, brush border on top, nuclei at the base
  const t = y + 30, ch = 86;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${t - y}" style="fill:${mx('series-8', 'elev-peak', 14)}"/>`;
  for (let cx = x; cx < x + w; cx += 20) {
    s += cellRect(cx + 1, t, 18, ch, { r: 5 });
    s += `<ellipse cx="${n1(cx + 10)}" cy="${n1(t + ch * 0.74)}" rx="5.4" ry="9" style="fill:url(#cw-nuc) ${mx('series-5', INK, 60)}"/>`;
    for (let k = 0; k < 6; k++) s += `<path d="M${n1(cx + 3 + k * 2.6)} ${n1(t)}v-7" style="fill:none;stroke:${CELL_D};stroke-width:1.4;stroke-linecap:round"/>`;
  }
  s += memb(t + ch + 1);
  return { s, top: t - 8, dots: [] };
}
/** Top face pattern in (u, v) space, u 0..w, v 0..D. */
function topFace(kind, w, D) {
  const q = rnd(kind.length * 7 + 1);
  let s = `<rect width="${w}" height="${D}" style="fill:${mx(CELL, 'elev-peak', 70)}"/>`;
  const size = { exch: 46, prot: 38, secr: 22, sens: 18, abso: 16 }[kind];
  for (let v = 0, r = 0; v < D + size; v += size * 0.8, r++) for (let u = (r % 2) * size * 0.5 - size; u < w + size; u += size) {
    const cx = u + (q() - 0.5) * size * 0.2, cy = v + (q() - 0.5) * size * 0.2, rr = size * 0.55;
    let d = '';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.5; d += `${i ? 'L' : 'M'}${n1(cx + Math.cos(a) * rr)} ${n1(cy + Math.sin(a) * rr * 0.9)}`; }
    s += `<path d="${d}Z" style="fill:${mx(CELL, 'elev-peak', 76)};stroke:${CELL_D};stroke-width:1.4"/>`;
    if (kind === 'exch') s += `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(size * 0.14)}" ry="${n1(size * 0.1)}" style="fill:${mx('series-5', INK, 60)};opacity:.6"/>`;
    if (kind === 'abso') s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(size * 0.32)}" style="fill:${CELL_D};opacity:.25"/>`;
    if (kind === 'secr' && q() > 0.82) s += `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="6" ry="4" style="fill:${mx('series-3', INK, 60)}"/>`;
    if (kind === 'sens' && q() > 0.7) s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="3" style="fill:${mx('series-5', INK, 50)}"/>`;
  }
  return s;
}
function block(kind, x, y, w, h) {
  const dz = Math.min(46, w * 0.14), D = 70, k = dz / D, fy = y + dz;
  const f = front(kind, x, fy, w, h - dz);
  const id = `ep-f-${kind}`, idt = `ep-t-${kind}`;
  let s = `<path d="M${x + 6} ${n1(y + h + 8)}H${n1(x + w + dz + 4)}" style="fill:none;stroke:${INK};stroke-width:10;opacity:.12;stroke-linecap:round;filter:url(#cw-blur3)"/>`;
  s += `<clipPath id="${id}"><rect x="${x}" y="${n1(fy)}" width="${w}" height="${n1(h - dz)}"/></clipPath><g clip-path="url(#${id})">${f.s}</g>`;
  // the side face: the same layers, darker
  s += `<path d="M${x + w} ${n1(fy)}L${n1(x + w + dz)} ${y}V${n1(y + h - dz)}L${x + w} ${n1(y + h)}Z" style="fill:${mx(CT, INK, 80)};stroke:${CT_D};stroke-width:1.6"/>`;
  s += `<path d="M${x + w} ${n1(f.top)}L${n1(x + w + dz)} ${n1(f.top - dz)}" style="fill:none;stroke:${CELL_D};stroke-width:2;opacity:.6"/>`;
  s += `<clipPath id="${idt}"><rect width="${w}" height="${D}"/></clipPath><g transform="matrix(1 0 ${n1(k)} ${n1(-k)} ${x} ${n1(fy)})"><g clip-path="url(#${idt})">${topFace(kind, w, D)}</g></g>`;
  s += `<path d="M${x} ${n1(fy)}L${n1(x + dz)} ${y}H${n1(x + w + dz)}L${x + w} ${n1(fy)}ZM${x} ${n1(fy)}V${n1(y + h)}H${x + w}V${n1(fy)}" style="fill:none;stroke:${mx(CELL_D, INK, 70)};stroke-width:2.4;stroke-linejoin:round"/>`;
  // motion that says the job
  const dot = (col, r = 5) => `<circle r="${r}" style="fill:${col};stroke:${mx(col, INK, 50)};stroke-width:1.4"/>`;
  if (kind === 'exch') for (let i = 0; i < 4; i++) s += `<g class="ep-go" style="offset-path:path('M${n1(x + w * (i < 2 ? 0.22 + i * 0.12 : 0.62 + (i - 2) * 0.14))} ${n1(fy + 6)}L${n1(x + w * (i < 2 ? 0.3 : 0.72) + (i % 2 ? 8 : -8))} ${n1(f.top + 44)}');--t:1.6s;--d:${n1(i * 0.4)}s">${dot(T1)}</g>`;
  if (kind === 'prot') {
    s += `<g class="ep-bump" style="offset-path:path('M${n1(x + w * 0.1)} ${n1(y - 50)}L${n1(x + w * 0.1)} ${n1(fy - 8)}')"><path d="M-14 -2q-8 -6 -14 -2M14 2q8 6 14 2" style="fill:none;stroke:${mx('series-3', INK, 60)};stroke-width:1.4"/><rect x="-14" y="-6" width="28" height="12" rx="6" style="fill:${mx('series-3', 'strata-6', 70)};stroke:${INK};stroke-width:1.4"/><rect x="-9" y="-3.4" width="11" height="2.4" rx="1.2" style="fill:${W_};opacity:.45"/></g>`;
    // a fingertip pressing and sliding on the surface (side view): pad, nail, skin creases
    const fx0 = x + w * 0.66, fy0 = y + dz * 0.5 - 4, SK = mx('series-8', 'elev-peak', 30), SK_D = mx('series-8', 'strata-6', 46);
    const fin = `M${n1(fx0 - 46)} ${n1(fy0)}C${n1(fx0 - 60)} ${n1(fy0)} ${n1(fx0 - 62)} ${n1(fy0 - 28)} ${n1(fx0 - 44)} ${n1(fy0 - 32)}L${n1(fx0 + 80)} ${n1(fy0 - 62)}L${n1(fx0 + 92)} ${n1(fy0 - 22)}L${n1(fx0 - 20)} ${n1(fy0 + 2)}Z`;
    s += `<g class="ep-rub"><path d="${fin}" style="fill:${SK};stroke:${SK_D};stroke-width:2.2;stroke-linejoin:round"/><path d="M${n1(fx0 - 42)} ${n1(fy0 - 30)}C${n1(fx0 - 26)} ${n1(fy0 - 40)} ${n1(fx0 - 4)} ${n1(fy0 - 44)} ${n1(fx0 + 6)} ${n1(fy0 - 46)}L${n1(fx0 + 4)} ${n1(fy0 - 38)}C${n1(fx0 - 14)} ${n1(fy0 - 34)} ${n1(fx0 - 30)} ${n1(fy0 - 28)} ${n1(fx0 - 42)} ${n1(fy0 - 26)}Z" style="fill:${mx(SK, 'elev-peak', 50)};stroke:${SK_D};stroke-width:1.4"/>`
      + `<path d="M${n1(fx0 + 30)} ${n1(fy0 - 50)}q4 10 8 22M${n1(fx0 + 40)} ${n1(fy0 - 52)}q4 10 8 22" style="fill:none;stroke:${SK_D};stroke-width:1.4;opacity:.6"/><path d="M${n1(fx0 - 50)} ${n1(fy0 - 8)}Q${n1(fx0 - 36)} ${n1(fy0 - 2)} ${n1(fx0 - 10)} ${n1(fy0 - 4)}" style="fill:none;stroke:${W_};stroke-width:2.4;opacity:.5"/></g>`;
    s += `<path d="M${n1(fx0 - 70)} ${n1(fy0 - 50)}H${n1(fx0 - 30)}" style="fill:none;stroke:${mx('series-2', INK, 50)};stroke-width:4;stroke-linecap:round"/><path d="M${n1(fx0 - 60)} ${n1(fy0 - 58)}L${n1(fx0 - 70)} ${n1(fy0 - 50)}L${n1(fx0 - 60)} ${n1(fy0 - 42)}M${n1(fx0 - 40)} ${n1(fy0 - 58)}L${n1(fx0 - 30)} ${n1(fy0 - 50)}L${n1(fx0 - 40)} ${n1(fy0 - 42)}" style="fill:none;stroke:${mx('series-2', INK, 50)};stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`;
  }
  if (kind === 'secr') for (let i = 0; i < 3; i++) s += `<g class="ep-go" style="offset-path:path('M${n1(f.dots[0][0])} ${n1(f.dots[0][1])}L${n1(f.dots[1][0] + (i - 1) * 16)} ${n1(f.dots[1][1])}');--t:2.6s;--d:${n1(i * 0.8)}s">${dot(mx('series-3', 'elev-peak', 40), 6)}</g>`;
  if (kind === 'abso') for (let i = 0; i < 5; i++) s += `<g class="ep-go" style="offset-path:path('M${n1(x + 20 + i * w * 0.18)} ${n1(y - 40)}L${n1(x + 30 + i * w * 0.18)} ${n1(fy + 60)}');--t:2.2s;--d:${n1(i * 0.45)}s">${dot(mx('series-8', 'series-2', 60))}</g>`;
  return s;
}
const T1 = mx('series-1', 'elev-peak', 60);

export class EpitheliaMap extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5), one(6)];
  static WIDTH = 640;
  static HEIGHT = 540;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 600;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'An outline of the body with five kinds of epithelial tissue. Exchange, in the lungs and blood vessels: one layer of thin, flat cells, gases crossing quickly. Protection, in the skin, mouth and oesophagus: many layers of cells, the outer ones flat and tightly packed; a germ is turned back. Secretion, in the salivary and sweat glands and the stomach lining: cuboidal or columnar cells releasing droplets. Sensing, in the nostrils, taste buds and inner ear: receptor cells with hair-like cilia. Absorption, in the small intestine: one layer of tall pillar-like cells with hair-like tops taking in nutrients. Each is drawn as a small 3D block of cells.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Jobs of epithelial tissue', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.repaint(); }
  css() {
    return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs:not(.sim-dom-root--portrait) .tl-row { gap: var(--sim-space-1); } .svs:not(.sim-dom-root--portrait) .tl-row .tl-chip { padding-inline: var(--sim-space-2); }' + BODY_CSS
      + ' svg .ep-go { offset-rotate: 0deg; animation: ep-go var(--t, 2s) linear var(--d, 0s) infinite; } @keyframes ep-go { 0% { offset-distance: 0%; opacity: 0; } 12% { opacity: 1; } 85% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }'
      + ' svg .ep-bump { offset-rotate: 0deg; animation: ep-bump 2.4s ease-in infinite; } @keyframes ep-bump { 0% { offset-distance: 0%; } 50% { offset-distance: 100%; animation-timing-function: ease-out; } 100% { offset-distance: 0%; } }'
      + ' svg .ep-rub { animation: ep-rub 2.4s ease-in-out infinite alternate; } @keyframes ep-rub { from { transform: translateX(-16px); } to { transform: translateX(16px); } }'
      + ' svg .ep-cil { transform-box: fill-box; transform-origin: 50% 100%; animation: ep-cil 1.1s ease-in-out infinite alternate; } @keyframes ep-cil { from { transform: skewX(-14deg); } to { transform: skewX(14deg); } }'
      + ' svg .ep-ring { transform-box: fill-box; transform-origin: center; animation: ep-ring 1.6s ease-out 2 both; } @keyframes ep-ring { from { transform: scale(.6); opacity: .3; } }';
  }
  stageHeight(st) { return st.portrait ? 440 : 420; }
  enter() { this.tl.reset(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    const held = this.tl.any() ? this.tl.lit()[0] : null, job = held ?? STEP_JOB[step] ?? null, all = !job && step === 6;
    let s = depthField(W, H, { tone: 'rose', seed: 12 });
    const L = (t, at, x, y, o = {}) => leader(x, y, at[0], at[1], o.col ?? INK, 2.4) + tag(x, y, t, { size: fs, rim: o.rim, anchor: o.anchor, display: o.display });
    const ring = (p, j, big) => `<circle class="ep-ring" cx="${n1(p[0])}" cy="${n1(p[1])}" r="${big ? 11 : 8}" style="fill:${mx(TONE[j], 'elev-peak', 50)};fill-opacity:.35;stroke:${mx(TONE[j], INK, 70)};stroke-width:3.4"/>`;
    if (!job) {
      // the whole body, large; five places dim (intro) or lit with names (summary)
      const k = (H - 20) / 420, tx = W / 2 - 100 * k, ty = 10;
      const M = (p) => [tx + p[0] * k, ty + p[1] * k];
      s += `<g transform="translate(${n1(tx)} ${n1(ty)}) scale(${n1(k * 1000) / 1000})">${body(null, all)}</g>`;
      for (const j of JOBS) for (const p of SPOTS[j]) s += all ? ring(M(p), j, true) : `<circle cx="${n1(M(p)[0])}" cy="${n1(M(p)[1])}" r="7" style="fill:${mx(TONE[j], 'elev-peak', 40)};stroke:${mx(TONE[j], INK, 60)};stroke-width:2;opacity:.55"/>`;
      if (all) {
        const pos = { exch: [M([72, 158]), 0.2, 'start'], prot: [M([15, 236]), 0.6, 'start'], secr: [M([116, 72]), 0.12, 'end'], sens: [M([71, 40]), 0.06, 'start'], abso: [M([100, 274]), 0.72, 'end'] };
        for (const j of JOBS) {
          const [at, u, an] = pos[j], x = an === 'start' ? (P ? 6 : 30) : W - (P ? 6 : 30);
          s += L(NAME[j], at, x, 20 + u * (H - 40), { anchor: an, rim: mx(TONE[j], INK, 60), display: true });
        }
      } else s += tag(W / 2, H - 22, 'five places, five kinds', { size: fs });
      return { svg: cwFrame(st, 'ep', s) };
    }
    // body on the left, small; the block for this job on the right
    const bk = P ? 0.52 : 0.92, bx = P ? 6 : 14, by = P ? 8 : 18;
    const M = (p) => [bx + p[0] * bk, by + p[1] * bk];
    s += `<g transform="translate(${bx} ${by}) scale(${bk})">${body(job, false)}</g>`;
    for (const p of SPOTS[job]) s += ring(M(p), job, false);
    const X = P ? 120 : 250, Y = P ? 70 : 90, BW = P ? W - X - 40 : W - X - 70, BH = P ? 210 : 220;
    s += block(job, X, Y, BW, BH);
    s += tag(X + BW / 2, Y + BH + (P ? 30 : 34), SHAPE[job], { size: fs, display: true, rim: mx(TONE[job], INK, 60) });
    s += tag(P ? W / 2 : X + BW / 2, Y + BH + (P ? 66 : 72), WHERE[job], { size: P ? 14 : fs });
    s += tag(X + BW / 2, P ? 24 : 30, NAME[job], { size: fs + 2, display: true, rim: mx(TONE[job], INK, 60) });
    if (job === 'prot') { const dz = Math.min(46, BW * 0.14), fx0 = X + BW * 0.66, fy0 = Y + dz * 0.5 - 4; s += tag(fx0 - 76, P ? fy0 - 2 : fy0 - 50, 'rubbing', { size: 14, anchor: 'end' }); }
    return { svg: cwFrame(st, 'ep', s) };
  }
}
