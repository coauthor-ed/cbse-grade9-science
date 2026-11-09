// PlatesNotNotochordScene - L07 blk-l07-s06, 2 beats. Beat 0: a starfish with one arm opened to show the hard plates
// under the skin, and a sea urchin. Beat 1: the plates beside the flexible rod of Amphioxus, which bends with the
// body while the plates stay plates.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, n1, LIFE_COLOR_MAP, frame, anim, fill, seaLabel, tag, svgBio, BOX, amphioxus, cross } from '../L06/BodyKit.js';

const PLATE = mx(lc('white'), lc('sand'), 0.35), PLATE_D = mx(lc('sand'), lc('wood'), 0.5);
function plates(cx, cy, len, deg) {
  // two rows of hard plates along one arm, seen through opened skin
  const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a); let g = '';
  const opened = `M${n1(cx + sa * len * 0.18)} ${n1(cy - ca * len * 0.18)}L${n1(cx + ca * len * 0.98)} ${n1(cy + sa * len * 0.98)}L${n1(cx - sa * len * 0.18)} ${n1(cy + ca * len * 0.18)}Z`;
  g += `<path d="${opened}" ${fill(mx(lc('wood'), lc('sand'), 0.25), `stroke:${PLATE_D};stroke-width:2.5;stroke-linejoin:round`)}/>`;
  for (let i = 0; i < 7; i++) for (const q of [-1, 1]) {
    const u = 0.16 + i * 0.105, w = (0.13 - i * 0.012) * len * 0.9, x = cx + ca * len * u - sa * q * w * 0.62, y = cy + sa * len * u + ca * q * w * 0.62;
    g += `<rect x="${n1(x - w * 0.52)}" y="${n1(y - w * 0.46)}" width="${n1(w * 1.04)}" height="${n1(w * 0.92)}" rx="${n1(w * 0.26)}" transform="rotate(${deg} ${n1(x)} ${n1(y)})" ${fill(PLATE, `stroke:${PLATE_D};stroke-width:2`)}/>`;
  }
  return g;
}

export class PlatesNotNotochordScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 400; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A starfish with one arm opened to show hard plates of calcium carbonate, then those plates beside the flexible rod of Amphioxus.';
  static CONTROLS = [];
  enter(step) { if (step === 1) this.play?.(6); }
  stageHeight(st) { return st.portrait ? [330, 370][this.stepIndex] ?? 340 : 400; }
  animate(st, t = 0) {
    if (this.stepIndex !== 1) return;
    const { W, H, portrait: P } = st;
    anim(this, 'a', amphioxus(P ? W * 0.5 : W * 0.5, P ? H * 0.74 : H * 0.72, P ? W - 50 : 480, { amp: 1, phase: t * 1.5 }));
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.42))}/><path d="M0 ${H - 30}Q${W / 2} ${H - 46} ${W} ${H - 26}V${H}H0Z" ${fill(lc('sand'))}/>`;
    const star = (cx, cy, size) => { const [x, y, bw, bh] = BOX.Starfish, k = size / Math.max(bw, bh); return { k, svg: svgBio('Starfish', cx - (x + bw / 2) * k, cy - (y + bh / 2) * k, k), ox: cx - (x + bw / 2) * k, oy: cy - (y + bh / 2) * k }; };
    if (step === 0) {
      const size = P ? 230 : 340, cx = P ? W * 0.5 : W * 0.38, cy = P ? H * 0.5 : H * 0.48, s = star(cx, cy, size);
      g += s.svg + plates(s.ox, s.oy, 56 * s.k, -18);
      const [ux, uy, uw, uh] = BOX.Urchin, ku = (P ? 74 : 130) / uw;
      g += svgBio('Urchin', (P ? W - 50 : W * 0.84) - (ux + uw / 2) * ku, (P ? H - 62 : H * 0.72) - (uy + uh / 2) * ku, ku);
      g += seaLabel(P ? W - 54 : W * 0.84, P ? H - 14 : H * 0.72 + 90, 'Sea urchin', { size: 15 });
      g += tag(P ? W / 2 : W * 0.7, P ? 26 : 40, s.ox + 34 * s.k, s.oy - 12 * s.k, 'Hard plates of calcium carbonate', { size: P ? 15 : 16 });
    } else {
      const s = star(P ? W * 0.3 : W * 0.26, P ? 100 : H * 0.28, P ? 150 : 190), s2 = s;
      g += s.svg + plates(s2.ox, s2.oy, 56 * s.k, -18);
      g += seaLabel(P ? W * 0.74 : W * 0.66, P ? 50 : 66, 'Starfish', { size: 19, display: true }) + seaLabel(P ? W * 0.74 : W * 0.66, P ? 76 : 96, 'hard plates', { size: 16 });
      g += cross(n1(P ? W * 0.74 : W * 0.66), P ? 106 : 132, 14) + seaLabel(P ? W * 0.74 : W * 0.66, P ? 144 : 170, 'no notochord', { size: 16 });
      g += `<g data-anim="a"></g>`;
      g += seaLabel(W / 2, P ? H * 0.74 - 56 : H * 0.72 - 72, 'Amphioxus: a flexible rod', { size: 18 });
    }
    return { svg: frame(st, 'pn', g) };
  }
}
