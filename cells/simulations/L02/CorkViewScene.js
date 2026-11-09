// CorkViewScene - what Hooke looked at. Beat 0: a cork, a thin slice, a convex lens that makes it look larger. Beat 1: the eyepiece field, rows of boxes.
// Beat 2: one box lit: walls only, nothing inside. Cork is dead tissue, so no box holds a nucleus or cytoplasm.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwDefs, eyepiece, blobPath, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, stroke, fill } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const defs = `<radialGradient id="ck-box" cx=".6" cy=".6" r=".7"><stop offset="0" style="stop-color:${mx('strata-1', 'elev-peak', 50)}"/><stop offset=".7" style="stop-color:${mx('strata-1', 'strata-2', 60)}"/><stop offset="1" style="stop-color:${mx('strata-3', 'strata-6', 60)}"/></radialGradient>`
  + `<linearGradient id="ck-cork" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${mx('strata-1', 'elev-peak', 80)}"/><stop offset="1" style="stop-color:${T('strata-2')}"/></linearGradient>`;
function boxes(cx, cy, R, seed, lit) {
  // cork: thick shared walls, hollow rooms. The walls are the ground and each room is cut into it, with shade on its upper left inner edge.
  const q = rnd(seed), w = R * 0.25, h = R * 0.18, wall = R * 0.022; let s = `<rect x="${n1(cx - R * 1.3)}" y="${n1(cy - R * 1.3)}" width="${n1(R * 2.6)}" height="${n1(R * 2.6)}" style="fill:${mx('strata-3', 'strata-1', 74)}"/>`;
  for (let j = -7; j <= 7; j++) for (let i = -6; i <= 6; i++) {
    const x = cx + i * w + (j % 2 ? w / 2 : 0) + (q() - 0.5) * 3, y = cy + j * h + (q() - 0.5) * 2, bw = w - 2 * wall, bh = h - 2 * wall, on = lit && i === 0 && j === 0;
    s += `<rect x="${n1(x - bw / 2)}" y="${n1(y - bh / 2)}" width="${n1(bw)}" height="${n1(bh)}" rx="${n1(R * 0.026)}" style="fill:url(#ck-box) ${T('strata-1')};stroke:${on ? T('magma') : mx('strata-3', 'strata-6', 70)};stroke-width:${on ? 5 : 1.6};opacity:${lit && !on ? 0.62 : 1}"/>`;
  }
  return s;
}
export class CorkViewScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A cork stopper with a thin slice cut from it, under a convex lens. Then a round microscope field full of rows of small empty boxes. One box is lit: it has walls and nothing inside.';
  static CONTROLS = [];
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 410; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, size = P ? 15 : 18;
    let s = `<defs>${cwDefs()}${defs}</defs>`;
    if (step === 0) {
      const gy = H * 0.78, cx = W * 0.3, sx = W * 0.62;
      // a school lab: pale wall, a window on the left letting in daylight, glassware out of focus at the back, a dark lab bench top
      const wl = mx('sea-shallow', 'elev-peak', 18), wd = mx('strata-5', 'elev-peak', 44), bt = mx('strata-6', 'sea-deep', 70);
      s += `<linearGradient id="ck-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".5" style="stop-color:${wl}"/><stop offset="1" style="stop-color:${wd}"/></linearGradient><linearGradient id="ck-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('strata-5', 'strata-6', 50)}"/><stop offset="1" style="stop-color:${bt}"/></linearGradient>`;
      s += `<rect width="${W}" height="${n1(gy)}" style="fill:url(#ck-wall) ${wl}"/>`;
      const wx = P ? -20 : W * 0.02, ww = P ? 90 : 120, wy = 26, wh = gy * 0.6;
      s += `<rect x="${n1(wx)}" y="${wy}" width="${ww}" height="${n1(wh)}" style="fill:${mx('sky-day', 'elev-peak', 40)};stroke:${wd};stroke-width:6"/><path d="M${n1(wx + ww / 2)} ${wy}V${n1(wy + wh)}M${n1(wx)} ${n1(wy + wh / 2)}H${n1(wx + ww)}" ${stroke(wd, 4)}/>`;
      s += `<path d="M${n1(wx + ww)} ${n1(wy + wh)}L${n1(wx + ww + 60)} ${n1(gy)}H${n1(wx + ww * 2.6)}L${n1(wx + ww * 1.2)} ${n1(wy + wh * 0.2)}Z" style="fill:${T('elev-peak')};opacity:.35"/>`;
      // out-of-focus glassware: a flask and a rack of tubes, pale and soft
      const fx = P ? W * 0.82 : W * 0.9, fb = gy - 2;
      s += `<g opacity=".55" filter="url(#cw-blur3)"><path d="M${n1(fx - 8)} ${n1(fb - 92)}V${n1(fb - 60)}L${n1(fx - 34)} ${n1(fb)}H${n1(fx + 34)}L${n1(fx + 8)} ${n1(fb - 60)}V${n1(fb - 92)}Z" style="fill:${mx('sea-shallow', 'elev-peak', 40)};stroke:${mx('sea-shallow', 'sea-deep', 50)};stroke-width:2"/><path d="M${n1(fx - 26)} ${n1(fb - 16)}H${n1(fx + 26)}L${n1(fx + 33)} ${n1(fb)}H${n1(fx - 33)}Z" style="fill:${mx('series-1', 'elev-peak', 50)}"/></g>`;
      if (!P) { const rx = W * 0.44; s += `<g opacity=".45" filter="url(#cw-blur3)">${[0, 1, 2, 3].map((i) => `<rect x="${n1(rx + i * 16)}" y="${n1(gy - 70)}" width="9" height="62" rx="4.5" style="fill:${mx('sea-shallow', 'elev-peak', 50)};stroke:${mx('sea-shallow', 'sea-deep', 50)};stroke-width:1.5"/>`).join('')}<rect x="${n1(rx - 6)}" y="${n1(gy - 34)}" width="72" height="8" style="fill:${wd}"/></g>`; }
      s += `<rect y="${n1(gy)}" width="${W}" height="${n1(H - gy)}" style="fill:url(#ck-top) ${bt}"/><path d="M0 ${n1(gy + 1.5)}H${W}" ${stroke(T('elev-peak'), 2)} opacity=".35"/>`;
      s += `<ellipse cx="${n1(cx + 8)}" cy="${n1(gy + 12)}" rx="70" ry="10" ${fill(T('strata-6'))} opacity=".3"/>`;
      s += `<path d="M${n1(cx - 56)} ${n1(gy - 100)}L${n1(cx - 66)} ${n1(gy + 2)}Q${n1(cx)} ${n1(gy + 18)} ${n1(cx + 66)} ${n1(gy + 2)}L${n1(cx + 56)} ${n1(gy - 100)}Z" style="fill:url(#ck-cork) ${T('strata-2')};stroke:${mx('strata-3', 'strata-6', 66)};stroke-width:2.4"/><ellipse cx="${n1(cx)}" cy="${n1(gy - 100)}" rx="56" ry="14" style="fill:${mx('strata-1', 'elev-peak', 70)};stroke:${mx('strata-3', 'strata-6', 66)};stroke-width:2.4"/>`;
      const q = rnd(3); for (let i = 0; i < 40; i++) s += `<circle cx="${n1(cx - 50 + q() * 100)}" cy="${n1(gy - 90 + q() * 96)}" r="${n1(1 + q() * 2.2)}" ${fill(mx('strata-3', 'strata-6', 70))} opacity=".6"/>`;
      s += `<ellipse cx="${n1(sx)}" cy="${n1(gy + 8)}" rx="74" ry="11" ${fill(mx('strata-1', 'strata-2', 60))}/><ellipse cx="${n1(sx)}" cy="${n1(gy + 5)}" rx="74" ry="11" style="fill:url(#ck-cork) ${T('strata-1')};stroke:${mx('strata-3', 'strata-6', 60)};stroke-width:2"/>`;
      s += label(sx, gy + 42, 'a thin slice', { size }) + label(cx, gy + 42, 'cork', { size });
      const R = P ? 74 : 86, lx = sx, ly = gy - R - 40;
      s += `<clipPath id="ck-l"><circle cx="${n1(lx)}" cy="${n1(ly)}" r="${R}"/></clipPath><path d="M${n1(lx + R * 0.7)} ${n1(ly + R * 0.7)}l46 46" ${stroke(mx('strata-3', 'strata-6', 60), 13)}/><circle cx="${n1(lx)}" cy="${n1(ly)}" r="${R}" ${fill(mx('strata-1', 'elev-peak', 60))}/><g clip-path="url(#ck-l)">${boxes(lx, ly, R * 1.2, 4, false)}</g><circle cx="${n1(lx)}" cy="${n1(ly)}" r="${R}" ${stroke(mx('strata-5', 'elev-peak', 50), 9)}/><path d="M${n1(lx - R * 0.66)} ${n1(ly - R * 0.3)}A${R * 0.72} ${R * 0.72} 0 0 1 ${n1(lx - R * 0.1)} ${n1(ly - R * 0.72)}" ${stroke(T('elev-peak'), 5)} opacity=".7"/>`;
      s += label(lx, 28, 'a convex lens makes it look larger', { size: P ? 14 : 16 });
    } else {
      const R = Math.min(W, H) * 0.4, cx = W / 2, cy = H / 2 - 12;
      s += eyepiece(W, H, cx, cy, R, boxes(cx, cy, R, 7, step === 2), { id: 'ck-e' });
      if (step === 1) s += label(cx, H - 10, 'small box-like compartments', { size });
      if (step === 2) { const q = cx + R * 0.86; s += `<path d="M${n1(cx + 24)} ${n1(cy)}L${n1(q)} ${n1(cy - R * 0.72)}" ${stroke(T('elev-peak'), 2.6)}/>` + label(cx, H - 10, 'walls only: the box is empty', { size }); }
    }
    return { svg: frame(st, 'ck', s) };
  }
}
