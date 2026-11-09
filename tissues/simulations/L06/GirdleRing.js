// GirdleRing - blk-l06-s13. A young tree in a garden bed, its roots shown in a cut through the soil. Beat 0 (ring): a
// narrow ring of bark (cork and the phloem just inside it) is cut away all round; the wood is left. A close-up shows the
// layers. Beat 1 (water): water rises in the wood, past the ring, to green leaves. Beat 2 (food): sugar comes down the
// phloem and stops above the ring; the Weeks slider (0 to 8) swells the bark above the cut and starves the roots below.
// Beat 3 (takeaway): both paths side by side. Slider in the scene (beat 2). Swelling and root loss are drawn to show the
// trend, not measured.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, svgPlantColour as pc } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, travel } from '../shared/BodyArt.js';
import { leafArt, taDefs } from '../shared/TissueArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
const BARK = pc('bark'), BARK_D = mx(BARK, INK, 56), BARK_L = mx(BARK, W_, 56);
const WOOD = mx('strata-1', 'elev-peak', 50), WOOD_D = mx('strata-2', 'strata-3', 60);
const PHL = mx('elev-low', 'series-3', 50), PHL_D = mx(PHL, INK, 56);
const WAT = T('series-1'), WAT_D = mx('series-1', INK, 56), SUG = T('series-2'), SUG_D = mx('series-2', INK, 58);

function geo(W, H, P) {
  return P
    ? { tx: W * 0.33, tw: 44, gy: H * 0.68, top: H * 0.3, ry: H * 0.53, cx: W * 0.78, cy: H * 0.36, cr: 62 }
    : { tx: W * 0.34, tw: 54, gy: H * 0.7, top: H * 0.32, ry: H * 0.54, cx: W * 0.75, cy: H * 0.38, cr: 100 };
}

function backdrop(W, H, g) {
  let s = `<defs><linearGradient id="gr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-shallow', 'elev-peak', 50)}"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'elev-peak', 18)}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${n1(g.gy)}" style="fill:url(#gr-sky) ${T('sea-shallow')}"/>`;
  // a far hedge, soft and quiet
  s += `<path d="M0 ${n1(g.gy - 30)}Q${n1(W * 0.2)} ${n1(g.gy - 64)} ${n1(W * 0.4)} ${n1(g.gy - 38)}T${n1(W * 0.8)} ${n1(g.gy - 44)}T${W} ${n1(g.gy - 30)}V${n1(g.gy)}H0Z" style="fill:${mx('elev-low', 'elev-peak', 60)};opacity:.7"/>`;
  // a cut through the bed: grass lip, then soil
  const soil = pc('soil');
  s += `<rect y="${n1(g.gy)}" width="${W}" height="${n1(H - g.gy)}" style="fill:url(#pa-soil) ${soil}"/><rect y="${n1(g.gy)}" width="${W}" height="${n1(H - g.gy)}" style="fill:${INK};opacity:.16;filter:url(#pa-grain)"/>`;
  s += `<path d="M0 ${n1(g.gy)}H${W}" style="fill:none;stroke:${mx('elev-low', 'chloro', 50)};stroke-width:7"/>`;
  const r = rnd(3);
  for (let i = 0; i < 46; i++) { const x = r() * W; s += `<path d="M${n1(x)} ${n1(g.gy + 2)}l${n1((r() - 0.5) * 6)} ${n1(-6 - r() * 8)}" style="fill:none;stroke:${mx('elev-low', 'chloro', 40)};stroke-width:2;stroke-linecap:round"/>`; }
  for (let i = 0; i < 22; i++) s += `<ellipse cx="${n1(r() * W)}" cy="${n1(g.gy + 14 + r() * (H - g.gy - 18))}" rx="${n1(2 + r() * 4)}" ry="${n1(1.5 + r() * 2)}" style="fill:${mx(soil, 'elev-peak', 70)};opacity:.45"/>`;
  return s;
}

// Roots: a tap root and side roots with fine tips. health 1 -> 0 thins and greys them.
function roots(g, H, health) {
  const r = rnd(7), col = mx(mx('strata-1', 'strata-3', 60), mx('strata-4', 'strata-6', 50), Math.round(40 + health * 60)), colD = mx(col, INK, 50);
  let s = '';
  const tips = [[-1, 0.9, 0.5], [1, 0.95, 0.42], [-1, 0.6, 0.8], [1, 0.62, 0.78], [-0.3, 0.3, 1], [0.4, 0.4, 0.95]];
  for (const [sg, k, d] of tips) {
    const len = (70 + 60 * k) * (0.55 + 0.45 * health), ex = g.tx + sg * len, ey = g.gy + 20 + d * (H - g.gy - 40) * (0.6 + 0.4 * health);
    const pd = `M${n1(g.tx + sg * 6)} ${n1(g.gy + 4)}C${n1(g.tx + sg * 30)} ${n1(g.gy + 30)} ${n1(ex - sg * 20)} ${n1(ey - 30)} ${n1(ex)} ${n1(ey)}`;
    s += `<path d="${pd}" style="fill:none;stroke:${colD};stroke-width:${n1(4 + 6 * k * (0.5 + health / 2))};stroke-linecap:round"/><path d="${pd}" style="fill:none;stroke:${col};stroke-width:${n1(2 + 5 * k * (0.5 + health / 2))};stroke-linecap:round"/>`;
    if (health > 0.4) for (let h = 0; h < 5; h++) s += `<path d="M${n1(ex - sg * h * 8)} ${n1(ey - h * 5)}l${n1(sg * 6)} ${n1(8 + r() * 4)}" style="fill:none;stroke:${mx('strata-1', 'elev-peak', 60)};stroke-width:1.4;stroke-linecap:round"/>`;
  }
  return s;
}

// Trunk with ridged bark, the cut ring, and a bark swelling just above it.
function trunk(g, ringY, swell, cut) {
  const { tx, tw, gy, top } = g, rh = 22, hw = tw / 2, flare = 10;
  const bulge = (y) => (cut && y < ringY - rh / 2 && y > ringY - rh / 2 - 46 ? swell * Math.sin(Math.PI * (ringY - rh / 2 - y) / 46) : 0);
  const L = [], R = [];
  for (let y = top; y <= gy + 2; y += 4) { const f = y > gy - 30 ? flare * Math.pow((y - gy + 30) / 30, 2) : 0, w = hw * (0.82 + 0.18 * (y - top) / (gy - top)) + f + bulge(y); L.push([tx - w, y]); R.push([tx + w, y]); }
  const outline = `M${L.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}L${R.reverse().map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
  let s = `<defs><linearGradient id="gr-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${BARK_L}"/><stop offset=".4" style="stop-color:${BARK}"/><stop offset="1" style="stop-color:${BARK_D}"/></linearGradient></defs>`;
  s += `<path d="${outline}" style="fill:url(#gr-bark) ${BARK};stroke:${BARK_D};stroke-width:2.4"/>`;
  // ridges and fissures in the bark
  const r = rnd(5);
  let d = '';
  for (let i = 0; i < 9; i++) { const u = -0.8 + i * 0.2, x = tx + u * hw; let y = top + 6 + r() * 20; d += `M${n1(x)} ${n1(y)}`; while (y < gy - 8) { y += 14 + r() * 12; d += `L${n1(x + (r() - 0.5) * 4)} ${n1(y)}`; } }
  s += `<path d="${d}" style="fill:none;stroke:${BARK_D};stroke-width:2;opacity:.55"/><path d="${d}" style="fill:none;stroke:${BARK_L};stroke-width:1;opacity:.4;transform:translate(-2px,0)"/>`;
  if (cut && swell > 0) {
    // the swollen, darker lip of bark just above the cut, where food piles up inside
    const ya = ringY - rh / 2 - 50, yb = ringY - rh / 2, wAt = (y) => hw * (0.82 + 0.18 * (y - top) / (gy - top)) + bulge(y), Lp = [], Rp = [];
    for (let y = ya; y <= yb; y += 3) { Lp.push([tx - wAt(y), y]); Rp.push([tx + wAt(y), y]); }
    const k = swell / 12, band = `M${Lp.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Q${n1(tx)} ${n1(yb + 5 * k)} ${n1(Rp[Rp.length - 1][0])} ${n1(yb)}L${Rp.reverse().map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}Z`;
    s += `<path d="${band}" style="fill:${mx(BARK_D, 'series-2', 80)};opacity:${n1(0.3 + 0.5 * k)}"/>`;
    s += `<path d="M${n1(tx - wAt(yb - 20) + 3)} ${n1(yb - 34)}Q${n1(tx - wAt(yb - 18) - 1)} ${n1(yb - 18)} ${n1(tx - wAt(yb - 6) + 4)} ${n1(yb - 6)}" style="fill:none;stroke:${BARK_L};stroke-width:2.4;opacity:${n1(0.5 * k)};stroke-linecap:round"/>`;
    s += `<path d="M${n1(tx - wAt(yb) - 1)} ${n1(yb + 1)}Q${n1(tx)} ${n1(yb + 6 * k + 2)} ${n1(tx + wAt(yb) + 1)} ${n1(yb + 1)}" style="fill:none;stroke:${INK};stroke-width:3;opacity:.45"/>`;
  }
  if (cut) {
    const w = hw * (0.82 + 0.18 * (ringY - top) / (gy - top)), wi = w - 6;
    // bare wood: pale, with fine lengthwise grain; the cut edges show cork and phloem layers
    s += `<rect x="${n1(tx - wi)}" y="${n1(ringY - rh / 2)}" width="${n1(wi * 2)}" height="${rh}" style="fill:${WOOD}"/>`;
    for (let k = -4; k <= 4; k++) s += `<path d="M${n1(tx + k * wi / 5)} ${n1(ringY - rh / 2)}V${n1(ringY + rh / 2)}" style="fill:none;stroke:${WOOD_D};stroke-width:1.2;opacity:.5"/>`;
    s += `<path d="M${n1(tx - wi)} ${n1(ringY - rh / 2)}H${n1(tx + wi)}M${n1(tx - wi)} ${n1(ringY + rh / 2)}H${n1(tx + wi)}" style="fill:none;stroke:${PHL};stroke-width:3"/>`;
    s += `<path d="M${n1(tx - w - 1)} ${n1(ringY - rh / 2 - 1)}H${n1(tx + w + 1)}M${n1(tx - w - 1)} ${n1(ringY + rh / 2 + 1)}H${n1(tx + w + 1)}" style="fill:none;stroke:${BARK_D};stroke-width:3"/>`;
    s += `<path d="M${n1(tx - wi + 3)} ${n1(ringY - rh / 2 + 3)}V${n1(ringY + rh / 2 - 3)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.6"/>`;
  }
  return s;
}

// Canopy: branches out of the trunk top with real leaves along them.
function canopy(W, g, P) {
  const { tx, top } = g, r = rnd(9);
  let s = '';
  const br = [[-1, 0.9], [1, 0.8], [-0.4, 1.2], [0.5, 1.15], [0.05, 1.3]];
  const len = P ? 62 : 92;
  for (const [sg, k] of br) {
    const ex = tx + sg * len * 1.1, ey = top - len * 0.55 * k;
    s += `<path d="M${n1(tx)} ${n1(top + 10)}Q${n1(tx + sg * 10)} ${n1(top - 20)} ${n1(ex)} ${n1(ey)}" style="fill:none;stroke:${BARK_D};stroke-width:${P ? 7 : 9};stroke-linecap:round"/><path d="M${n1(tx)} ${n1(top + 10)}Q${n1(tx + sg * 10)} ${n1(top - 20)} ${n1(ex)} ${n1(ey)}" style="fill:none;stroke:${BARK};stroke-width:${P ? 4 : 5};stroke-linecap:round"/>`;
  }
  for (let i = 0; i < (P ? 26 : 34); i++) {
    const a = -Math.PI * (0.06 + r() * 0.88), d = (0.4 + r() * 0.62) * len * 1.2, x = tx + Math.cos(a) * d * 1.15, y = top - 10 + Math.sin(a) * d * 0.72;
    s += leafArt(x, y, (P ? 30 : 40) + r() * 10, (a * 180) / Math.PI + (r() - 0.5) * 60, { seed: i + 1, wide: 0.3 });
  }
  return s;
}

// The close-up of the bark just above the cut, seen lengthwise: cork outside, phloem (sieve tubes with sieve plates,
// narrow companion cells), a thin cambium line, then the wood (vessels with rings, fibres). The ring cut crosses the
// bottom of the window: cork, phloem and cambium end there in a swollen lip; the wood goes on. food 0..1 crowds the
// sieve tubes with sugar just above the cut edge.
function layers(g, P, lit, food = 0) {
  const { cx, cy, cr } = g, x0 = cx - cr, w = cr * 2, y0 = cy - cr, y1 = cy + cr, cutY = cy + cr * 0.5, r = rnd(11), k = cr / 100;
  const X = (u) => x0 + w * u, dim = (id) => (lit && !lit.includes(id) ? 0.4 : 1);
  const lip = (xa, xb) => `M${n1(xa)} ${n1(y0 - 4)}V${n1(cutY - 6)}Q${n1(xa)} ${n1(cutY + 4 + food * 4)} ${n1(xa + 8)} ${n1(cutY + 3 + food * 4)}H${n1(xb - 6)}Q${n1(xb)} ${n1(cutY + 3)} ${n1(xb)} ${n1(cutY - 6)}V${n1(y0 - 4)}Z`;
  let s = `<circle cx="${n1(cx + 3)}" cy="${n1(cy + 6)}" r="${cr}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><clipPath id="gr-lc"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${cr}"/></clipPath><g clip-path="url(#gr-lc)">`;
  // the open ring below the cut: air, with a dark shadow under the lip
  s += `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(w)}" style="fill:${mx('sea-shallow', 'elev-peak', 30)}"/>`;
  // wood: vessels with ring thickening and fibres between, full height (the cut leaves it whole)
  let wd = `<rect x="${n1(X(0.44))}" y="${n1(y0)}" width="${n1(w * 0.56)}" height="${n1(w)}" style="fill:${mx(WOOD, WOOD_D, 62)}"/>`;
  for (let xx = X(0.44); xx < X(1); xx += 8 * k) wd += `<path d="M${n1(xx)} ${n1(y0)}V${n1(y1)}" style="fill:none;stroke:${WOOD_D};stroke-width:${n1(2.2 * k)};opacity:.5"/>`;
  for (const u of [0.55, 0.72, 0.89]) {
    const vx = X(u), vw = 15 * k;
    wd += `<rect x="${n1(vx - vw)}" y="${n1(y0)}" width="${n1(2 * vw)}" height="${n1(w)}" style="fill:${mx('sea-shallow', 'elev-peak', 56)};stroke:${mx(WOOD_D, INK, 70)};stroke-width:${n1(2.6 * k)}"/>`;
    let d = ''; for (let y = y0 + 4; y < y1; y += 9 * k) d += `M${n1(vx - vw + 2)} ${n1(y)}Q${n1(vx)} ${n1(y + 3 * k)} ${n1(vx + vw - 2)} ${n1(y)}`;
    wd += `<path d="${d}" style="fill:none;stroke:${mx(WOOD_D, INK, 80)};stroke-width:${n1(2.2 * k)};opacity:.85"/><path d="M${n1(vx - vw + 2.5)} ${n1(y0)}V${n1(y1)}" style="fill:none;stroke:${W_};stroke-width:1.4;opacity:.6"/>`;
  }
  s += `<g style="opacity:${dim('wood')}">${wd}</g>`;
  // the shadow the lip throws on the bare wood below the cut
  s += `<rect x="${n1(X(0))}" y="${n1(cutY)}" width="${n1(w * 0.46)}" height="${n1(8 * k)}" style="fill:${INK};opacity:.22;filter:url(#cw-blur1)"/>`;
  // cambium: a thin line of flat cells between phloem and wood
  let cb = `<path d="${lip(X(0.4), X(0.44))}" style="fill:${mx('elev-low', 'elev-peak', 40)};stroke:${mx('elev-low', INK, 50)};stroke-width:1.2"/>`;
  for (let y = y0; y < cutY - 4; y += 6 * k) cb += `<path d="M${n1(X(0.4))} ${n1(y)}H${n1(X(0.44))}" style="fill:none;stroke:${mx('elev-low', INK, 50)};stroke-width:1"/>`;
  s += `<g style="opacity:${dim('phloem')}">${cb}</g>`;
  // phloem: two sieve tubes with pored sieve plates, a narrow companion cell beside each
  let ph = `<path d="${lip(X(0.18), X(0.4))}" style="fill:${PHL};stroke:${PHL_D};stroke-width:2"/>`;
  const seg = 34 * k;
  for (const [u, uw] of [[0.2, 0.08], [0.3, 0.08]]) {
    const sx0 = X(u), sw = w * uw;
    for (let y = y0 - 10, i = 0; y < cutY - 2; y += seg, i++) {
      const h = Math.min(seg, cutY - y);
      ph += `<rect x="${n1(sx0)}" y="${n1(y)}" width="${n1(sw)}" height="${n1(h)}" rx="2" style="fill:${mx(PHL, 'elev-peak', 56)};stroke:${PHL_D};stroke-width:1.4"/>`;
      ph += `<rect x="${n1(sx0)}" y="${n1(y - 2)}" width="${n1(sw)}" height="4" style="fill:${PHL_D}"/>`;
      for (let px = sx0 + 3; px < sx0 + sw - 2; px += 4.5) ph += `<rect x="${n1(px)}" y="${n1(y - 2)}" width="1.8" height="4" style="fill:${mx(PHL, 'elev-peak', 70)}"/>`;
    }
    // companion cell strip: dense, with nuclei
    const cx2 = sx0 + sw + w * 0.01;
    for (let y = y0 - 10; y < cutY - 2; y += seg) ph += `<rect x="${n1(cx2)}" y="${n1(y + 2)}" width="${n1(w * 0.015 + 2)}" height="${n1(Math.min(seg, cutY - y) - 4)}" rx="2" style="fill:${mx(PHL, 'series-5', 66)}"/><circle cx="${n1(cx2 + w * 0.0075 + 1)}" cy="${n1(y + seg * 0.5)}" r="${n1(2 * k + 0.6)}" style="fill:${T('series-5')}"/>`;
    // sugar inside the sieve tubes: a few all the way up, crowded just above the cut as the weeks go by
    const n = 3 + Math.round(food * 14);
    for (let j = 0; j < n; j++) {
      const t = j / Math.max(1, n - 1), yy = j < 3 ? y0 + 20 + j * (cutY - y0) * 0.26 : cutY - 7 * k - (j - 3) * 5.6 * k * (1 - food * 0.2);
      ph += `<circle cx="${n1(sx0 + sw * (0.3 + ((j * 7) % 5) * 0.1))}" cy="${n1(Math.max(y0 + 4, yy))}" r="${n1(3.6 * k + 0.8)}" style="fill:url(#cw-sug) ${SUG};stroke:${SUG_D};stroke-width:1"/>`;
      void t;
    }
  }
  s += `<g style="opacity:${dim('phloem')}">${ph}</g>`;
  // cork: flattened brick cells stacked in rows, darker and swollen at the lip
  let ck = `<path d="${lip(X(0) - 4, X(0.18))}" style="fill:${BARK};stroke:${BARK_D};stroke-width:2"/>`;
  for (let y = y0, j = 0; y < cutY - 4; y += 7 * k, j++) { ck += `<path d="M${n1(X(0) - 4)} ${n1(y)}H${n1(X(0.18))}" style="fill:none;stroke:${BARK_D};stroke-width:1.2;opacity:.7"/>`; for (let xx = X(0) + (j % 2) * 7 * k; xx < X(0.18); xx += 14 * k) ck += `<path d="M${n1(xx)} ${n1(y)}v${n1(7 * k)}" style="fill:none;stroke:${BARK_D};stroke-width:1;opacity:.6"/>`; }
  ck += `<path d="M${n1(X(0.17))} ${n1(y0)}V${n1(cutY - 6)}" style="fill:none;stroke:${BARK_L};stroke-width:1.6;opacity:.6"/>`;
  s += `<g style="opacity:${dim('cork')}">${ck}</g>`;
  // the swollen lip of bark just above the cut: darker, rounded, catching the light on top
  if (food > 0) s += `<path d="M${n1(X(0) - 4)} ${n1(cutY - 16 * k)}Q${n1(X(0.2))} ${n1(cutY - 24 * k * food)} ${n1(X(0.44))} ${n1(cutY - 14 * k)}V${n1(cutY + 2 + food * 4)}H${n1(X(0) - 4)}Z" style="fill:${mx(BARK_D, PHL_D, 60)};opacity:${n1(0.25 + food * 0.3)}"/>`;
  s += `<path d="M${n1(X(0) - 4)} ${n1(cutY + 3 + food * 4)}H${n1(X(0.44))}" style="fill:none;stroke:${INK};stroke-width:2;opacity:.6"/>`;
  s += `</g><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${cr}" style="fill:none;stroke:${INK};stroke-width:3"/><path d="M${n1(cx - cr * 0.8)} ${n1(cy - cr * 0.5)}A${n1(cr * 0.94)} ${n1(cr * 0.94)} 0 0 1 ${n1(cx - cr * 0.2)} ${n1(cy - cr * 0.92)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.5"/>`;
  return s;
}

export class GirdleRing extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A young tree with a narrow ring of bark cut away all round the trunk, showing pale wood. A close-up shows the layers: cork outside, phloem just inside it, then the wood. Water still rises through the wood past the ring to green leaves. Sugar coming down the phloem stops above the ring, and over the weeks the bark above the cut swells while the roots below get no food and shrink.';
  static CONTROLS = [];

  weeks = 0;

  async setup() {
    await super.setup();
    this._onIn = (e) => { const t = e.target; if (t?.classList?.contains('gr-range') && this.stepIndex === 2) { this.weeks = Number(t.value) || 0; this._paintKeep(); } };
    this.root.addEventListener('input', this._onIn);
  }
  destroy() { this.root?.removeEventListener('input', this._onIn); super.destroy(); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 50px; }' + BODY_CSS
    + ' .gr-w { display: flex; align-items: center; gap: 10px; font: 800 16px/1 var(--sim-font); color: var(--sim-label); }'
    + ' .gr-w b { font: 600 20px/1 var(--sim-font-display); min-width: 74px; }'
    + ' .gr-range { width: 220px; height: 44px; accent-color: var(--sim-series-2); }'
    + ' .sim-dom-root--portrait .gr-w { gap: 6px; font-size: 15px; } .sim-dom-root--portrait .gr-w b { min-width: 0; font-size: 17px; } .sim-dom-root--portrait .gr-range { width: 150px; }'; }
  stageHeight(st) { return st.portrait ? 380 : 400; }
  enter(step) { this.weeks = step === 2 ? 4 : step === 3 ? 8 : 0; }
  // keep the slider element (and its focus) while it is dragged: repaint only the picture
  _paintKeep() {
    const out = this.paint(this.sv) ?? {};
    this.sv.render(out.svg ?? '', out.over ?? '');
    const b = this.root.querySelector('.gr-w b'); if (b) b.textContent = `${this.weeks} weeks`;
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, g = geo(W, H, P), fs = P ? 15 : 16;
    const wk = this.weeks / 8, swell = (step >= 2 ? wk : 0) * (P ? 9 : 12), health = step >= 2 ? 1 - wk * 0.75 : 1;
    let s = `<defs>${taDefs()}</defs>` + backdrop(W, H, g);
    s += roots(g, H, health);
    s += canopy(W, g, P);
    s += trunk(g, g.ry, swell, true);
    const ry = g.ry, hw = g.tw / 2;
    // water in the wood: up past the ring (beats 1 and 3)
    if (step === 1 || step === 3) {
      s += `<path d="M${n1(g.tx)} ${n1(g.gy + 30)}V${n1(g.top - 6)}" style="fill:none;stroke:${WAT};stroke-width:5;stroke-dasharray:2 12;stroke-linecap:round;opacity:.9"/>`;
      for (let i = 0; i < 5; i++) s += travel(`<circle r="6" style="fill:url(#cw-wat) ${WAT};stroke:${WAT_D};stroke-width:1.4"/>`, `M${n1(g.tx + (i % 2 ? 4 : -4))} ${n1(g.gy + 40)}V${n1(g.top - 20 - i * 6)}`, { t: 3, d: i * 0.45 });
      s += label(g.tx - hw - 12, g.ry + 50, 'water up', { size: fs + 1, display: true, anchor: 'end', ink: mx(WAT_D, INK, 60) }) + label(g.tx - hw - 12, g.ry + 70, 'in the wood', { size: fs - 1, anchor: 'end' });
    }
    // food comes down the phloem inside the bark (shown in the close-up) and stops at the ring: the bark above swells
    if (step >= 2) {
      const sx = P ? g.tx + hw + 14 : g.tx - hw - 16, sy1 = P ? g.cy + g.cr + 38 : ry - 46, anc = P ? 'start' : 'end';
      s += `<path d="M${n1(sx + (P ? -2 : 2))} ${n1(sy1 - 6)}L${n1(g.tx + (P ? 1 : -1) * (hw + swell * 0.6))} ${n1(ry - 30)}" style="fill:none;stroke:${INK};stroke-width:2"/><circle cx="${n1(g.tx + (P ? 1 : -1) * (hw + swell * 0.6))}" cy="${n1(ry - 30)}" r="3.5" style="fill:${INK}"/>`;
      s += label(sx, sy1, 'food stops', { size: fs + 1, display: true, anchor: anc, ink: mx(SUG_D, INK, 50) });
      s += label(sx, sy1 + (P ? 18 : 20), this.weeks > 0 ? 'bark swells above' : 'at the ring', { size: fs - 1, anchor: anc });
      s += label(g.tx + (P ? 70 : 120), g.gy + (P ? 36 : 40), this.weeks >= 4 ? 'roots starve' : 'roots get no food', { size: fs, display: true, anchor: 'start', ink: W_, halo: INK });
    }
    if (step > 0) {
      s += layers(g, P, step === 1 ? ['wood'] : step === 2 ? ['phloem', 'cork'] : ['wood', 'phloem', 'cork'], step >= 2 ? Math.max(0.1, wk) : 0);
      const lx = g.cx - g.cr, w2 = g.cr * 2;
      if (step !== 2) for (let i = 0; i < 3; i++) s += travel(`<path d="M-8 5L0 -6L8 5" style="fill:none;stroke:${WAT_D};stroke-width:4.4;stroke-linecap:round;stroke-linejoin:round"/>`, `M${n1(lx + w2 * (0.55 + i * 0.13))} ${n1(g.cy + g.cr * 0.7)}V${n1(g.cy - g.cr * 0.6)}`, { t: 2, d: i * 0.3 });
      s += label(g.cx, g.cy - g.cr - 10, 'just above the ring', { size: fs - 1 });
      s += label(lx + w2 * 0.29, g.cy + g.cr + (P ? 18 : 22), 'phloem', { size: fs, display: true }) + label(lx + w2 * 0.74, g.cy + g.cr + (P ? 18 : 22), 'wood', { size: fs, display: true });
    }
    if (step === 0) {
      s += layers(g, P, null);
      s += `<path d="M${n1(g.tx + hw + 2)} ${n1(ry)}L${n1(g.cx - g.cr * 0.98)} ${n1(g.cy + g.cr * 0.2)}" style="fill:none;stroke:${INK};stroke-width:2.4;stroke-dasharray:6 5"/>`;
      const lx = g.cx - g.cr, w2 = g.cr * 2;
      s += label(lx + w2 * 0.16, g.cy - g.cr - 10, 'cork', { size: fs }) + label(lx + w2 * 0.29, g.cy + g.cr + (P ? 18 : 22), 'phloem', { size: fs, display: true }) + label(lx + w2 * 0.7, g.cy - g.cr - 10, 'wood (xylem)', { size: fs });
      s += label(P ? W - 10 : g.cx, g.cy + g.cr + (P ? 38 : 44), 'cut away: cork + phloem', { size: fs - 1, ink: mx(BARK_D, INK, 40), anchor: P ? 'end' : 'middle' });
      s += label(g.tx - hw - 12, ry + 5, 'ring cut', { size: fs + 1, display: true, anchor: 'end' });
    }
    const head = step === 2 ? `<label class="gr-w">Weeks<input class="gr-range" type="range" min="0" max="8" step="1" value="${this.weeks}" aria-label="Weeks after the cut"><b>${this.weeks} weeks</b></label>` : '';
    return { svg: cwFrame(st, 'gr', s), head };
  }
}
