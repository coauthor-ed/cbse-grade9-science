// StewardCulture - blk-l09-s4 (beats fragments, divide, mass, embryo, plant) and the predict setup on blk-l09-s3
// (role setup). Follows the book's Fig 3.19 on a lab bench. Setup (step 0): a carrot cut across, its cross section with
// a notch taken from the phloem, tiny 2-mg pieces, and a flask of liquid nutrient medium kept stirring: no division and
// no plant. Step 1: in the stirred flask, single cells break away from a piece and float free (a lens shows it).
// Step 2: one single cell divides, 1, 2, 4, many. Step 3: a mass of alike, unspecialised cells. Step 4: the mass takes
// the shape of a tiny embryo, like the young plant in a seed. Step 5: a plantlet with roots and a shoot on agar in a
// tube, then planted in soil it grows into an adult flowering carrot plant. Real people: no portrait.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, artDefs } from '../shared/PlantArt.js';
import { cwDefs, T, mx, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, frame, tag, leader, txt, n, form } from '../shared/BodyArt.js';
import { tiles, bench } from '../shared/Scapes.js';
import { carrot, carrotSection, piece, flask, flaskBox, testTube, cell, cellSplit, cellMass, plantlet, carrotPlant, MEDIUM, SOIL, CARROT_D, CELL } from '../shared/CultureArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const SETUP = 0;

// a lens: a magnified round window into the liquid
function lens(cx, cy, r, body, o = {}) {
  const id = `sc-l${Math.round(cx)}${Math.round(cy)}`;
  let s = '';
  if (o.from) s += `<path d="M${n(o.from[0])} ${n(o.from[1])}L${n(cx - r * 0.7)} ${n(cy - r * 0.7)}M${n(o.from[0])} ${n(o.from[1])}L${n(cx - r * 0.7)} ${n(cy + r * 0.7)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:5 5;opacity:.5"/>`;
  s += `<circle cx="${n(cx + 3)}" cy="${n(cy + 6)}" r="${n(r + 6)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + 6)}" style="fill:${mx('strata-5', 'strata-6', 50)}"/>`;
  s += `<clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath><g clip-path="url(#${id})"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" style="fill:${mx('gold', 'elev-peak', 24)}"/><circle cx="${n(cx - r * 0.3)}" cy="${n(cy - r * 0.3)}" r="${n(r * 0.8)}" style="fill:${W_};opacity:.35;filter:url(#cw-blur3)"/>${o.medium === false ? '' : medium(cx, cy, r, o.seed ?? Math.round(cx))}${body}</g>`;
  s += `<path d="M${n(cx - r * 0.86)} ${n(cy - r * 0.2)}A${n(r * 0.88)} ${n(r * 0.88)} 0 0 1 ${n(cx - r * 0.2)} ${n(cy - r * 0.86)}" style="fill:none;stroke:${W_};stroke-width:3;stroke-linecap:round;opacity:.6"/>`;
  return s;
}
// the liquid medium seen through the lens: faint currents, out-of-focus cell clumps drifting deeper down, a few bubbles
function medium(cx, cy, r, seed) {
  const q = rnd(seed);
  let s = '';
  for (let i = 0; i < 3; i++) { const y = cy - r * 0.6 + i * r * 0.55 + q() * 10; s += `<path d="M${n(cx - r)} ${n(y)}q${n(r * 0.5)} ${n(-r * 0.08)} ${n(r)} 0t${n(r)} 0" style="fill:none;stroke:${mx(MEDIUM, INK, 70)};stroke-width:${n(r * 0.05)};opacity:.08;filter:url(#cw-blur3)"/>`; }
  for (let i = 0; i < 5; i++) {
    const a = q() * 6.283, d = r * (0.55 + q() * 0.35), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, k = r * (0.05 + q() * 0.05);
    let cl = '';
    for (let j = 0; j < 5; j++) cl += `<circle cx="${n(x + (q() - 0.5) * k * 2.4)}" cy="${n(y + (q() - 0.5) * k * 2)}" r="${n(k * (0.6 + q() * 0.5))}" style="fill:${mx(CELL, 'gold', 80)};stroke:${mx(CELL, INK, 70)};stroke-width:1"/>`;
    s += `<g style="opacity:.42;filter:url(#cw-blur3)">${cl}</g>`;
  }
  for (let i = 0; i < 7; i++) {
    const a = q() * 6.283, d = r * (0.3 + q() * 0.62), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, b = r * (0.015 + q() * 0.03);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(b)}" style="fill:${W_};fill-opacity:.25;stroke:${mx('sea-shallow', INK, 50)};stroke-width:1;stroke-opacity:.5"/><circle cx="${n(x - b * 0.35)}" cy="${n(y - b * 0.35)}" r="${n(b * 0.3)}" style="fill:${W_};opacity:.9"/>`;
  }
  return s;
}
const arrow = (x0, y0, x1, y1, col = INK) => { const a = Math.atan2(y1 - y0, x1 - x0), h = 10; return `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}M${n(x1 - Math.cos(a - 0.5) * h)} ${n(y1 - Math.sin(a - 0.5) * h)}L${n(x1)} ${n(y1)}L${n(x1 - Math.cos(a + 0.5) * h)} ${n(y1 - Math.sin(a + 0.5) * h)}" style="fill:none;stroke:${col};stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round"/>`; };
// a seed cut open with the young plant inside (for the embryo beat)
function seedHalf(x, y, r) {
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 1.3)}" ry="${n(r)}" style="fill:${mx('strata-1', 'gold', 70)};stroke:${mx('strata-3', INK, 60)};stroke-width:2"/><ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 1.12)}" ry="${n(r * 0.84)}" style="fill:${mx('strata-1', 'elev-peak', 56)}"/>`
    + `<path d="M${n(x - r * 0.1)} ${n(y + r * 0.5)}Q${n(x - r * 0.2)} ${n(y)} ${n(x - r * 0.1)} ${n(y - r * 0.2)}Q${n(x - r * 0.6)} ${n(y - r * 0.6)} ${n(x - r * 0.3)} ${n(y - r * 0.66)}Q${n(x)} ${n(y - r * 0.5)} ${n(x)} ${n(y - r * 0.3)}Q${n(x)} ${n(y - r * 0.5)} ${n(x + r * 0.3)} ${n(y - r * 0.66)}Q${n(x + r * 0.6)} ${n(y - r * 0.6)} ${n(x + r * 0.1)} ${n(y - r * 0.2)}Q${n(x + r * 0.2)} ${n(y)} ${n(x + r * 0.1)} ${n(y + r * 0.5)}Z" style="fill:${mx('elev-low', 'elev-peak', 60)};stroke:${mx('elev-low', INK, 60)};stroke-width:1.6"/>`;
}

export class StewardCulture extends SvgScene {
  static BEAT_STEP_MAP = [one(1), one(2), one(3), one(4), one(5)];
  static WIDTH = 640;
  static HEIGHT = 446;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 480;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Steward\'s carrot experiment, as in the book\'s figure. A carrot root is cut across; tiny 2 mg pieces of its phloem go into a flask of liquid nutrient medium that is kept stirring. Stirring breaks single cells away from the pieces. A single cell divides: one, two, four, many. The cells form a mass of alike, unspecialised cells. The mass takes the shape of a tiny embryo, like the young plant in a seed. On agar in a tube it grows into a plantlet with roots and a shoot, and planted in soil it grows into an adult flowering carrot plant.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }' + BODY_CSS + ' svg .sc-pop { transform-box: fill-box; transform-origin: center; animation: sc-pop .45s var(--look-spring-soft, ease-out) var(--d, 0s) both; } @keyframes sc-pop { from { transform: scale(.4); opacity: 0; } }'; }
  stageHeight(st) { return st.portrait ? 470 : 430; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.hostRole === 'setup' ? SETUP : this.stepIndex, fs = P ? 14 : 15;
    const by = H * (P ? 0.84 : 0.8);
    let s = tiles(W, by, { cool: true, size: 64 }) + bench(W, by, H, { planks: 2 });
    if (step === SETUP) {
      // carrot cut across on the bench, its cross section, the pieces, the stirred flask
      const cl = P ? 170 : 240, cx0 = P ? 16 : 26;
      s += carrot(cx0 + 30, by - 18, cl, 0, { cut: 0.42, gap: 26, seed: 4 });
      const sx = P ? 88 : 150, sy = P ? 150 : 150, sr = P ? 52 : 70;
      s += `<path d="M${n(cx0 + 30 + cl * 0.42 + 10)} ${n(by - 32)}L${n(sx)} ${n(sy + sr + 6)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:5 5;opacity:.5"/>`;
      s += carrotSection(sx, sy, sr, { taken: true, takenAt: -0.5 });
      const fx = P ? W * 0.74 : W * 0.76, fh = P ? 200 : 250, b = flaskBox(fx, by + 6, fh, { level: 0.42 });
      const pcs = [[-0.4, 0.4], [0.1, 0.6], [0.36, 0.3], [-0.1, 0.2]].map(([u, v], i) => piece(fx + u * (b.x1 - b.x0) * 0.8, b.top + 10 + v * (b.bot - b.top - 20), P ? 1 : 1.25, { seed: i + 2, rot: i * 40 }));
      s += flask(fx, by + 6, fh, { level: 0.42, stir: true, inner: pcs.join('') });
      // pieces on their way: from the notch to the flask
      const nx = sx + Math.cos(-0.5) * sr * 0.72, ny = sy + Math.sin(-0.5) * sr * 0.72;
      s += `<path d="M${n(nx + 6)} ${n(ny - 4)}Q${n((nx + fx) / 2)} ${n(Math.min(ny, b.top) - 70)} ${n(fx - 14)} ${n(by - fh + 6)}" style="fill:none;stroke:${CARROT_D};stroke-width:2.4;stroke-dasharray:6 6"/>`;
      s += piece((nx + fx) / 2 - 18, Math.min(ny, b.top) - 40, 1.3, { seed: 9 }) + piece((nx + fx) / 2 + 6, Math.min(ny, b.top) - 46, 1.3, { seed: 3, rot: 60 });
      s += tag((nx + fx) / 2 - 6, Math.min(ny, b.top) - (P ? 76 : 80), '2-mg pieces', { size: fs, display: true });
      s += tag(sx, sy - sr - 18, 'cross section', { size: fs }) + leader(sx + sr + (P ? 8 : 24), sy + sr * 0.5, nx + 4, ny + 6, INK, 2, 0.8) + tag(sx + sr + (P ? 8 : 24), sy + sr * 0.5 + 4, 'phloem', { size: fs, display: true, anchor: 'start' });
      s += tag(cx0 + 18, by - 66, 'carrot root', { size: fs, anchor: 'start', display: true });
      s += leader(W - (P ? 60 : 70), (P ? 70 : 92), fx + b.w * 0.4, b.top + 14, INK, 2, 0.75) + tag(W - 8, (P ? 56 : 78), 'liquid medium', { size: fs, anchor: 'end' }) + txt(fx, by + 26, 'kept stirring', { size: fs, display: true });
    } else if (step === 1) {
      const fx = P ? W * 0.26 : W * 0.24, fh = P ? 170 : 230, b = flaskBox(fx, by + 6, fh, { level: 0.42 });
      const pcs = [[-0.3, 0.4], [0.2, 0.6], [0.3, 0.2]].map(([u, v], i) => piece(fx + u * (b.x1 - b.x0) * 0.8, b.top + 10 + v * (b.bot - b.top - 20), 1.1, { seed: i + 2, rot: i * 50 }));
      s += flask(fx, by + 6, fh, { level: 0.42, stir: true, inner: pcs.join('') });
      const cx = P ? W * 0.62 : W * 0.66, cy = P ? H * 0.4 : H * 0.46, r = P ? 108 : 146;
      let body = '';
      // a piece of phloem tissue (cells stuck together) with single cells breaking away and drifting off
      const cr = P ? 13 : 18;
      body += cellMass(cx - r * 0.28, cy + r * 0.04, cr * 2.9, { cr: cr * 0.95, seed: 3, tight: true, col: mx(CELL, 'flame', 88) });
      const free = [[0.28, -0.42], [0.46, 0.06], [0.2, 0.46], [-0.1, -0.6], [0.6, -0.3]];
      free.forEach(([u, v], i) => {
        const x = cx + u * r, y = cy + v * r;
        body += `<path d="M${n(x - u * r * 0.4)} ${n(y - v * r * 0.3)}L${n(x - u * 14)} ${n(y - v * 10)}" style="fill:none;stroke:${mx('gold', INK, 50)};stroke-width:2;stroke-dasharray:3 5;opacity:.6"/>`;
        body += `<g class="sc-pop" style="--d:${n(0.1 + i * 0.08)}s">${cell(x, y, cr, { seed: i + 20 })}</g>`;
      });
      for (const k of [0, 1]) body += `<path d="M${n(cx - r * 0.8)} ${n(cy + r * (0.55 + k * 0.18))}q${n(r * 0.4)} ${n(-r * 0.12)} ${n(r * 0.8)} 0t${n(r * 0.8)} 0" style="fill:none;stroke:${mx(MEDIUM, INK, 50)};stroke-width:2;opacity:.4"/>`;
      s += lens(cx, cy, r, body, { from: [fx + 10, b.top + 20] });
      s += tag(cx - r * 0.28, cy + r + (P ? 24 : 26), 'piece of phloem', { size: fs, display: true });
      s += tag(cx + r * 0.5, cy - r - (P ? 10 : 14), 'single cells float free', { size: fs, display: true, anchor: P ? 'end' : 'middle' });
      s += txt(fx, by + 26, 'stirring', { size: fs, display: true });
    } else if (step === 2) {
      const fx = P ? W * 0.16 : W * 0.1, fh = P ? 120 : 150;
      if (!P) s += flask(fx, by + 6, fh, { level: 0.42, stir: true });
      const pos = P ? [[W * 0.29, H * 0.24], [W * 0.73, H * 0.24], [W * 0.29, H * 0.64], [W * 0.73, H * 0.64]] : [[W * 0.29, H * 0.4], [W * 0.5, H * 0.4], [W * 0.71, H * 0.4], [W * 0.9, H * 0.4]];
      const r = P ? 66 : 56, cr = P ? 15 : 13;
      const sets = [[[0, 0]], [[-0.5, 0], [0.5, 0]], [[-0.5, -0.45], [0.5, -0.45], [-0.5, 0.45], [0.5, 0.45]], null];
      const counts = ['1 cell', '2 cells', '4 cells', 'many cells'];
      pos.forEach(([x, y], i) => {
        let body = '';
        if (i === 0) body += cell(x, y, cr * 2.3, { seed: 2 });
        else if (i < 3) body += cellSplit(x, y, cr * 2.4, i === 1 ? 2 : 4, { seed: i + 4 });
        else body += cellMass(x, y, r * 0.72, { cr: cr * 0.5, seed: 5, div: 0.2 });
        s += `<g class="sc-pop" style="--d:${n(i * 0.25)}s">${lens(x, y, r, body)}${tag(x, y + r + 24, counts[i], { size: fs, display: true })}</g>`;
        if (i < 3) s += P ? (i === 1 ? arrow(W * 0.62, H * 0.38, W * 0.4, H * 0.5) : arrow(x + r + 4, y, pos[i + 1][0] - r - 6, y)) : arrow(x + r + 6, y, pos[i + 1][0] - r - 8, y);
      });
      s += txt(P ? W / 2 : W * 0.6, P ? H - 20 : H * 0.12, 'still in the liquid medium', { size: fs, display: true });
    } else if (step === 3 || step === 4) {
      const fx = P ? W * 0.12 : W * 0.15, fh = P ? 110 : 170;
      s += flask(fx, by + 6, fh, { level: 0.42, stir: step === 3 });
      const cx = P ? W * 0.6 : W * 0.6, cy = P ? H * 0.42 : H * 0.47, r = P ? 116 : 150;
      const body = step === 3 ? cellMass(cx, cy, r * 0.8, { cr: r * 0.085, seed: 4, div: 0.12 }) : cellMass(cx, cy + r * 0.02, r * 0.74, { cr: r * 0.062, seed: 4, shape: 'embryo', tight: true });
      s += lens(cx, cy, r, body, { from: [fx + 12, by - fh * 0.3] });
      if (step === 3) {
        s += tag(cx, cy - r - (P ? 12 : 16), 'a mass of alike cells', { size: fs + 1, display: true });
        s += tag(cx, cy + r + (P ? 22 : 26), 'unspecialised: no special job yet', { size: fs });
      } else {
        s += tag(cx, cy - r - (P ? 12 : 16), 'shaped like a tiny embryo', { size: fs + 1, display: true });
        const sx = P ? W * 0.2 : W * 0.15, sy = P ? H * 0.12 : H * 0.16;
        s += seedHalf(sx, sy, P ? 26 : 34) + txt(sx, sy + (P ? 44 : 56), 'young plant', { size: fs, display: true }) + txt(sx, sy + (P ? 62 : 74), 'inside a seed', { size: fs });
        s += tag(cx, cy + r + (P ? 22 : 26), 'shoot end up, root end down', { size: fs });
      }
    } else {
      // plantlet on agar in a tube, then the adult plant in soil
      const tx = P ? W * 0.2 : W * 0.2, th = P ? 210 : 260;
      s += testTube(tx, by + 4, th, { agar: 0.4, above: plantlet(tx, by + 4 - th * 0.4 + 6, th * 0.36, { seed: 4 }) });
      s += tag(tx, by - th - 30, 'plantlet on agar', { size: fs, display: true }) + txt(tx, by + 28, 'agar: firm jelly', { size: fs });
      s += arrow(tx + (P ? 40 : 60), by - th * 0.5, P ? W * 0.44 : W * 0.46, by - th * 0.5);
      // a clay pot cut open to show the soil and the orange root
      const px = P ? W * 0.72 : W * 0.7, pw = P ? 100 : 130, ptop = by - (P ? 70 : 90);
      const CLAY = mx('flame', 'strata-3', 46);
      s += `<ellipse cx="${n(px + 6)}" cy="${n(by + 6)}" rx="${n(pw * 0.5)}" ry="6" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
      s += form(`M${n(px - pw / 2)} ${n(ptop)}L${n(px + pw / 2)} ${n(ptop)}L${n(px + pw * 0.38)} ${n(by + 6)}L${n(px - pw * 0.38)} ${n(by + 6)}Z`, CLAY, { ao: 10, rim: 2.2, hi: 44 });
      const win = `M${n(px - pw / 2 + 12)} ${n(ptop + 10)}L${n(px + pw / 2 - 12)} ${n(ptop + 10)}L${n(px + pw * 0.38 - 10)} ${n(by - 4)}L${n(px - pw * 0.38 + 10)} ${n(by - 4)}Z`;
      s += `<path d="${win}" style="fill:${SOIL}"/><path d="${win}" style="fill:${INK};opacity:.18;filter:url(#pa-grain)"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<ellipse cx="${n(px - pw * 0.3 + i * pw * 0.1)}" cy="${n(ptop + 24 + (i % 3) * 16)}" rx="3" ry="2" style="fill:${mx(SOIL, 'elev-peak', 70)};opacity:.5"/>`).join('') + `<path d="${win}" style="fill:none;stroke:${mx(CLAY, INK, 50)};stroke-width:3"/>`;
      s += form(`M${n(px - pw / 2 - 6)} ${n(ptop - 10)}H${n(px + pw / 2 + 6)}V${n(ptop + 4)}H${n(px - pw / 2 - 6)}Z`, mx(CLAY, 'elev-peak', 88), { ao: 4, rim: 2, hi: 50 });
      s += carrot(px, ptop + 4, P ? 66 : 82, 90, { tops: false, seed: 7 });
      s += carrotPlant(px, ptop + 2, ptop - (P ? 70 : 64), { seed: 11 });
      s += (P ? tag(px, by + 26, 'in soil', { size: fs }) : tag(px + pw / 2 + 8, ptop + 40, 'in soil', { size: fs, anchor: 'start' })) + tag(px, P ? 28 : 24, 'adult carrot plant', { size: fs + 1, display: true });
    }
    return { svg: frame(st, 'sc', `<defs>${artDefs()}${cwDefs()}</defs>${s}`, { back: '' }) };
  }
}
