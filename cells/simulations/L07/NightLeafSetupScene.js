// NightLeafSetupScene - predict setup, blk-l07-n01. A tulsi plant on a ledge at night and one leaf cell in a round lens:
// chloroplasts only. Mitochondria are left out of the drawing so the setup does not show the answer.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, labelWhite, svgLeaf, svgPot, stroke } from '../shared/PlantArt.js';
import { cwFrame, plantCell, T, mx, n1, rnd } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];

export class NightLeafSetupScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0)];
  static WIDTH = 640;
  static HEIGHT = 334;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Night outside a window. A potted tulsi plant stands on a ledge under a moon and stars. A round lens shows one of its leaf cells, full of green chloroplasts. No sunlight reaches it.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 320; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, q = rnd(5), gy = H - (P ? 60 : 56);
    const sky = mx('sea-deep', 'strata-6', 56);
    let s = `<defs><linearGradient id="nl-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-deep', 'strata-6', 44)}"/><stop offset="1" style="stop-color:${mx('sea-deep', 'series-5', 66)}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#nl-s) ${sky}"/>`;
    for (let i = 0; i < 46; i++) s += `<circle cx="${n1(q() * W)}" cy="${n1(q() * H * 0.7)}" r="${n1(0.8 + q() * 1.5)}" style="fill:${T('elev-peak')};opacity:${n1(0.4 + q() * 0.5)}"/>`;
    const mx0 = P ? W - 54 : W - 80, my = P ? 56 : 66;
    s += `<circle cx="${mx0}" cy="${my}" r="${P ? 44 : 56}" style="fill:${T('elev-peak')};opacity:.1;filter:url(#pa-soft)"/><circle cx="${mx0}" cy="${my}" r="${P ? 24 : 30}" style="fill:${mx('elev-peak', 'gold', 84)}"/><circle cx="${mx0 + 8}" cy="${my - 6}" r="5" style="fill:${mx('elev-peak', 'strata-4', 80)};opacity:.5"/><circle cx="${mx0 - 8}" cy="${my + 8}" r="4" style="fill:${mx('elev-peak', 'strata-4', 80)};opacity:.5"/>`;
    s += `<rect y="${gy}" width="${W}" height="${H - gy}" style="fill:${mx('strata-4', 'strata-6', 44)}"/><rect y="${gy}" width="${W}" height="7" style="fill:${mx('strata-3', 'sea-deep', 60)}"/>`;
    const px = P ? 80 : W * 0.24, k = P ? 1.1 : 1.5;
    s += `<g opacity=".92">${tulsi(px, gy - 54 * k, k)}</g>${svgPot(px, gy - 58 * k, k * 0.86, {})}`;
    const cx = P ? W * 0.56 : W * 0.68, cy = P ? 172 : H * 0.46, R = P ? 118 : 124;
    const lx = px + 22 * k, ly = gy - 150 * k;
    s += `<path d="M${n1(lx)} ${n1(ly)}L${n1(cx - R * 0.8)} ${n1(cy - R * 0.6)}M${n1(lx)} ${n1(ly + 8)}L${n1(cx - R * 0.74)} ${n1(cy + R * 0.66)}" ${stroke(T('elev-peak'), 1.6, 'opacity:.5')}/><circle cx="${n1(lx)}" cy="${n1(ly)}" r="12" ${stroke(T('elev-peak'), 2.6)}/>`;
    s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 8}" style="fill:${mx('strata-6', 'sea-deep', 70)}"/><clipPath id="nl-c"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}"/></clipPath><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}" style="fill:${mx('elev-low', 'sea-deep', 34)}"/><g clip-path="url(#nl-c)">${plantCell(cx, cy, R * 1.52, R * 1.4, { parts: ['wall', 'cytoplasm', 'membrane', 'chloro', 'vacuole', 'nucleus'], seed: 6 })}<rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${2 * R}" height="${2 * R}" style="fill:${T('sea-deep')};opacity:.22"/></g>`;
    s += labelWhite(cx, P ? gy + 34 : cy + R + 28, 'A leaf cell at night', { size: P ? 16 : 19, display: true });
    return { svg: cwFrame(st, 'nl', s) };
  }
}
function tulsi(x, y, k) {
  let s = `<path d="M${x} ${y + 8}Q${x + 6 * k} ${y - 60 * k} ${x - 2 * k} ${y - 118 * k}" ${stroke(mx('elev-low', 'strata-3', 50), 7 * k)}/>`;
  const L = [[0.25, -1, 60], [0.3, 1, 56], [0.5, -1, 54], [0.56, 1, 58], [0.72, -1, 46], [0.78, 1, 50], [0.9, -1, 40], [0.96, 1, 36], [1, -1, 28]];
  for (const [u, sd, len] of L) s += svgLeaf(x + 2 * k * sd * 0.2, y - 118 * k * u, k * 0.92, { len, wide: len * 0.5, rot: sd * (72 - u * 34), teeth: 3 });
  return s;
}
