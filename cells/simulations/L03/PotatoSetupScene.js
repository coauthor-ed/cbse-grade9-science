// PotatoSetupScene - the predict's setup: two equal pieces on a board, a knife, Beaker A with plain water, Beaker B with 20 per cent salt solution. No result shown.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { T, mx, n1 } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, fill, stroke } from '../shared/PlantArt.js';
import { potatoDefs, bench, beaker, piece } from './PotatoArt.js';

export class PotatoSetupScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'On a kitchen bench, two equal cut pieces of potato lie on a wooden board beside a knife. Beaker A holds plain water and Beaker B holds a 20 per cent salt solution.';
  static CONTROLS = [];
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * (P ? 0.84 : 0.8), bw = P ? 112 : 150, bh = P ? 136 : 176, ax = W * 0.24, bx = W * 0.76, pw = P ? 58 : 70;
    let s = potatoDefs() + bench(W, H, gy);
    s += beaker(ax, gy - 8, bw, bh, { tint: 'water' }) + beaker(bx, gy - 8, bw, bh, { tint: 'salt' });
    const ly = gy - 8 - bh - 16;
    if (P) s += label(ax, ly - 24, 'A', { size: 20, display: true }) + label(ax, ly, 'plain water', { size: 17, display: true }) + label(bx, ly - 24, 'B', { size: 20, display: true }) + label(bx, ly, 'salt solution', { size: 17, display: true });
    else s += label(ax, ly, 'A: plain water', { size: 19, display: true }) + label(bx, ly, 'B: salt solution', { size: 19, display: true });
    const by = gy + (P ? 26 : 30);
    s += `<rect x="${n1(W / 2 - pw * 1.5)}" y="${n1(by - 6)}" width="${n1(pw * 3)}" height="20" rx="6" style="fill:url(#pa-wood) ${T('strata-3')};stroke:${mx('strata-3', 'strata-6', 70)};stroke-width:2"/>`;
    s += piece(W / 2 - pw * 0.6, by - 24, pw, 36, { seed: 4 }) + piece(W / 2 + pw * 0.6, by - 24, pw, 36, { seed: 8 });
    return { svg: frame(st, 'ps', s) };
  }
}
