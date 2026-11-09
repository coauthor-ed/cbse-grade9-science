// OrganArt - the chest organs for the tissues module (fix round F3): lungs and a heart, front view, drawn to stand
// beside reproduction BodyArt. Not a scene. SVG strings, tokens only, no faces. Light from the top left.
//   lungsSvg(x, y, k)     both lungs with lobes, fissures, the cardiac notch, trachea with rings and the two bronchi;
//                         (x, y) the top of the trachea, about 230 by 250 at k = 1
//   heartSvg(x, y, k)     the heart: ventricles with the apex down to the left side of the body (right of the picture),
//                         right atrium, left auricle, aorta arch, pulmonary trunk, vena cava, coronary vessels in fat;
//                         (x, y) its middle, about 130 by 150 at k = 1
import { form, tube } from './BodyArt.js';
import { mx, n1 } from './CellWorld.js';

const INK = 'var(--sim-strata-6)', W_ = 'var(--sim-elev-peak)';
const LUNG = mx('series-4', 'elev-peak', 40), LUNG_D = mx('series-4', 'strata-6', 52);
const HRT = mx('series-6', 'series-4', 70), HRT_D = mx(HRT, INK, 58);
const ART = mx('series-6', 'strata-6', 84), VEIN = mx('series-1', 'series-5', 56), FATC = mx('series-2', 'elev-peak', 46);
const CARTI = mx('series-1', 'elev-peak', 26);
const h = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };

export function lungsSvg(x, y, k = 1) {
  const P = (px, py) => `${n1(x + px * k)} ${n1(y + py * k)}`;
  // right lung (left of the picture): three lobes; left lung: two lobes and the notch for the heart
  const R = `M${P(-22, 56)}C${P(-40, 40)} ${P(-84, 46)} ${P(-104, 110)}C${P(-118, 160)} ${P(-118, 220)} ${P(-108, 252)}C${P(-80, 262)} ${P(-40, 252)} ${P(-14, 236)}C${P(-12, 180)} ${P(-14, 110)} ${P(-22, 56)}Z`;
  const L = `M${P(22, 56)}C${P(40, 40)} ${P(84, 46)} ${P(104, 110)}C${P(118, 160)} ${P(118, 220)} ${P(108, 252)}C${P(88, 262)} ${P(64, 256)} ${P(50, 246)}C${P(36, 230)} ${P(40, 196)} ${P(22, 176)}C${P(16, 140)} ${P(16, 96)} ${P(22, 56)}Z`;
  let tex = '';
  for (let i = 0; i < 70; i++) { const sx = h(i, 2) < 0.5 ? -1 : 1, px = sx * (24 + h(i, 3) * 84), py = 70 + h(i, 4) * 180; tex += `<circle cx="${n1(x + px * k)}" cy="${n1(y + py * k)}" r="${n1((1.4 + h(i, 5) * 2.4) * k)}" style="fill:${LUNG_D};opacity:.16"/>`; }
  const fis = `M${P(-108, 140)}C${P(-80, 150)} ${P(-50, 150)} ${P(-20, 130)}M${P(-110, 210)}C${P(-80, 190)} ${P(-50, 170)} ${P(-30, 140)}M${P(104, 120)}C${P(80, 160)} ${P(60, 196)} ${P(52, 240)}`;
  let s = form(R, LUNG, { rim: 2.4, rimCol: LUNG_D, ao: 16, aoOp: 0.45, inner: tex }) + form(L, LUNG, { rim: 2.4, rimCol: LUNG_D, ao: 16, aoOp: 0.45, inner: tex });
  s += `<path d="${fis}" style="fill:none;stroke:${LUNG_D};stroke-width:${n1(1.8 * k)};opacity:.6"/>`;
  // trachea and bronchi with cartilage rings
  const bro = `M${P(0, 58)}Q${P(-6, 70)} ${P(-40, 92)}M${P(0, 58)}Q${P(6, 70)} ${P(40, 92)}`;
  s += tube(`M${P(0, -10)}L${P(0, 60)}`, CARTI, 16 * k) + tube(bro, CARTI, 10 * k);
  for (let i = 0; i < 6; i++) s += `<path d="M${P(-8, i * 11 - 4)}Q${P(0, i * 11 - 1)} ${P(8, i * 11 - 4)}" style="fill:none;stroke:${mx(CARTI, INK, 60)};stroke-width:${n1(1.6 * k)};opacity:.6"/>`;
  return s;
}

export function heartSvg(x, y, k = 1) {
  const P = (px, py) => `${n1(x + px * k)} ${n1(y + py * k)}`;
  let s = '';
  // great vessels behind: vena cava (blue) on the left, aorta arch (red) curving over to the right
  s += tube(`M${P(-34, -30)}L${P(-36, -96)}`, VEIN, 16 * k);
  s += tube(`M${P(-4, -34)}C${P(-8, -92)} ${P(36, -104)} ${P(50, -80)}L${P(54, -50)}`, ART, 20 * k);
  for (const [a, b] of [[-2, -86], [12, -96], [26, -98]]) s += tube(`M${P(a, b)}L${P(a + (a < 10 ? -4 : 2), b - 22)}`, ART, 7 * k);
  // pulmonary trunk in front, from the right ventricle up and splitting
  s += tube(`M${P(10, -20)}C${P(12, -52)} ${P(-4, -62)} ${P(-24, -66)}M${P(8, -48)}C${P(20, -60)} ${P(36, -62)} ${P(48, -62)}`, VEIN, 13 * k);
  // right atrium (left of the picture), left auricle (an ear at the top right)
  s += form(`M${P(-30, -36)}C${P(-62, -34)} ${P(-66, 16)} ${P(-44, 34)}C${P(-30, 30)} ${P(-20, 0)} ${P(-24, -32)}Z`, mx(HRT, VEIN, 70), { rim: 2, rimCol: HRT_D, ao: 8 });
  s += form(`M${P(24, -24)}C${P(40, -36)} ${P(58, -30)} ${P(54, -16)}C${P(48, -8)} ${P(34, -10)} ${P(26, -12)}Z`, HRT, { rim: 2, rimCol: HRT_D, ao: 6 });
  // the ventricles: a rounded cone, apex down and to the right
  const V = `M${P(-36, -10)}C${P(-22, -30)} ${P(30, -32)} ${P(50, -12)}C${P(70, 10)} ${P(70, 56)} ${P(50, 86)}Q${P(42, 100)} ${P(30, 96)}C${P(-6, 78)} ${P(-46, 40)} ${P(-44, 10)}Q${P(-42, -2)} ${P(-36, -10)}Z`;
  const groove = `M${P(10, -24)}C${P(2, 14)} ${P(16, 60)} ${P(40, 94)}`;
  const inner = `<path d="${groove}" style="fill:none;stroke:${FATC};stroke-width:${n1(9 * k)};opacity:.85;stroke-linecap:round"/><path d="${groove}" style="fill:none;stroke:${ART};stroke-width:${n1(2.4 * k)}"/>`
    + `<path d="M${P(-40, -4)}C${P(-14, -14)} ${P(30, -18)} ${P(52, -6)}" style="fill:none;stroke:${FATC};stroke-width:${n1(7 * k)};opacity:.8"/>`
    + `<path d="M${P(8, 20)}Q${P(30, 24)} ${P(48, 44)}M${P(16, 56)}Q${P(-6, 60)} ${P(-24, 54)}M${P(4, 0)}Q${P(-16, 14)} ${P(-30, 30)}" style="fill:none;stroke:${ART};stroke-width:${n1(1.6 * k)};opacity:.8"/>`;
  s += form(V, HRT, { rim: 2.6, rimCol: HRT_D, ao: 14, aoOp: 0.5, inner });
  return s;
}
