// OneCellManyCells - blk-l01-s7. Tap a job; the cells that do it light, the rest dim.
//   amoeba  one amoeba cell on a quiet depth field. Every job (take in food, move, remove waste, divide) lights the
//           same one cell, with the part that does it named.
//   groups  a slice of a many-celled body wall: covering cells, muscle cells, nerve cells, food-taking lining cells,
//           each kind in its own group. A job lights only its group. The definition line sits in the title row.
//   animal  a clinical upper body lifting a school bag: move lights the arm muscle and its tissue (long fibres in a
//           bundle); carry messages lights the nerve from hand to brain and its tissue (neurons with long fibres).
//   plant   a young plant and a lengthwise slice of its stem: water and minerals lights xylem (water goes up only);
//           food lights phloem (food goes both ways). Plant tissues only.
import { SvgScene, chip } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, depthField, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { form, tapered, BODY } from '../shared/BodyArt.js';
import { taDefs, amoeba, spindle, neuron, columnar, xylemTube, phloemTube, leafArt, MUSC, MUSC_D, NERVE, NERVE_D, LINE } from '../shared/TissueArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');

const CHIPS = [
  [
    { id: 'food', label: 'take in food', targets: ['cell', 'food'], tone: 3 },
    { id: 'move', label: 'move', targets: ['cell', 'pod'], tone: 1 },
    { id: 'waste', label: 'remove waste', targets: ['cell', 'cv'], tone: 7 },
    { id: 'divide', label: 'divide', targets: ['cell', 'nuc'], tone: 5 },
  ],
  [
    { id: 'cover', label: 'cover the body', targets: ['cover'], tone: 7 },
    { id: 'move', label: 'move', targets: ['muscle'], tone: 6 },
    { id: 'msg', label: 'carry messages', targets: ['nerve'], tone: 2 },
    { id: 'food', label: 'take in food', targets: ['gut'], tone: 3 },
  ],
  [
    { id: 'move', label: 'move', targets: ['muscle'], tone: 6 },
    { id: 'msg', label: 'carry messages', targets: ['nerve'], tone: 2 },
  ],
  [
    { id: 'water', label: 'water and minerals', targets: ['xylem'], tone: 1 },
    { id: 'food', label: 'food', targets: ['phloem'], tone: 2 },
  ],
];
const HEAD = ['One cell does every job', 'Tissue: similar cells, working together', 'Tissues in animals', 'Tissues in plants'];

const arrow = (x0, y0, x1, y1, col, w = 4) => {
  const a = Math.atan2(y1 - y0, x1 - x0), h = 4 + w * 2.2;
  return `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1 - Math.cos(a) * h * 0.6)} ${n1(y1 - Math.sin(a) * h * 0.6)}" style="fill:none;stroke:${col};stroke-width:${w};stroke-linecap:round"/><path d="M${n1(x1)} ${n1(y1)}L${n1(x1 - Math.cos(a - 0.45) * h)} ${n1(y1 - Math.sin(a - 0.45) * h)}L${n1(x1 - Math.cos(a + 0.45) * h)} ${n1(y1 - Math.sin(a + 0.45) * h)}Z" style="fill:${col}"/>`;
};
// Myelin as sheath segments with bare nodes between, on the same curve the kit neuron() draws its axon along.
function sheath(x, y, s, to) {
  const mx1 = x + (to[0] - x) * 0.33, my1 = y + (to[1] - y) * 0.33 - 18 * s, mx2 = x + (to[0] - x) * 0.66, my2 = y + (to[1] - y) * 0.66 + 18 * s;
  const B = (u) => { const v = 1 - u; return [v * v * v * x + 3 * v * v * u * mx1 + 3 * v * u * u * mx2 + u * u * u * to[0], v * v * v * y + 3 * v * v * u * my1 + 3 * v * u * u * my2 + u * u * u * to[1]]; };
  let d = '';
  for (let u0 = 0.16; u0 < 0.88; u0 += 0.12) { const pts = []; for (let k = 0; k <= 6; k++) pts.push(B(u0 + (k / 6) * 0.1)); d += pts.map((p, i) => `${i ? 'L' : 'M'}${n1(p[0])} ${n1(p[1])}`).join(''); }
  return `<path d="${d}" style="fill:none;stroke:${NERVE_D};stroke-width:${n1(12 * s)};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${mx(NERVE, W_, 66)};stroke-width:${n1(9.6 * s)};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${W_};stroke-width:${n1(2.4 * s)};stroke-linecap:round;opacity:.6;transform:translate(0,-${n1(2 * s)}px)"/>`;
}
const op = (on) => `opacity="${on ? 1 : 0.22}"`;

export class OneCellManyCells extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 600;
  static MIN_SCALE = 0.85;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Tap a job to light the cells that do it. An amoeba is one cell that does every job. In a many-celled body, groups of similar cells each do one job: muscle tissue moves the arm, nervous tissue carries messages, xylem carries water and phloem carries food in a plant.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Jobs', chips: CHIPS[0], onChange: () => this.repaint() });

  async setup() { await super.setup(); this.tl.mount(this.root, this); }
  destroy() { this.tl.destroy(); super.destroy(); }
  enter(step) { this.tl.set({ chips: CHIPS[step] ?? CHIPS[0], lit: null, disabled: false }); }
  stageHeight(st) { return st.portrait ? 430 : 380; }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }

  paint(st) {
    const step = this.stepIndex, W = st.W, H = st.H;
    const fn = [this._amoeba, this._groups, this._animal, this._plant][step] ?? this._amoeba;
    const { s, over } = fn.call(this, W, H, st.portrait);
    return { svg: cwFrame(st, 'oc', `<defs>${taDefs()}</defs>${s}`), over, head: chip(HEAD[step], 0, 0, { tone: 'plain', static: true }) };
  }

  _amoeba(W, H, P) {
    const tl = this.tl, any = tl.any(), r = P ? 100 : 118, x = W * 0.5, y = H * (P ? 0.5 : 0.52);
    let s = depthField(W, H, { tone: 'blue', seed: 4 });
    s += amoeba(x, y, r, { seed: 7, lit: any, food: [x + r * 1.42, y + 2] });
    // the job's part, ringed on the one cell
    const spots = { food: [x + r * 1.4, y, r * 0.42, 'food cup'], pod: [x + r * 1.55, y - r * 0.2, 0, ''], cv: [x - r * 0.52, y - r * 0.3, r * 0.26, 'contractile vacuole'], nuc: [x + r * 0.12, y + r * 0.04, r * 0.34, 'nucleus'] };
    let over = '';
    if (tl.has('pod')) s += arrow(x + r * 0.9, y + r * 0.6, x + r * 1.5, y + r * 0.55, mx('series-1', INK, 70), 6);
    for (const k of ['food', 'cv', 'nuc']) if (tl.has(k)) { const [sx, sy, sr, lb] = spots[k]; s += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(sr)}" style="fill:none;stroke:${INK};stroke-width:3;stroke-dasharray:7 6"/>`; over += chip(lb, Math.min(W - 80, Math.max(80, sx)), Math.max(22, sy - sr - 20), { tone: 'plain' }); }
    if (tl.has('pod')) over += chip('pseudopod', Math.min(W - 70, x + r * 1.2), y + r * 0.86, { tone: 'plain' });
    over += chip(any ? 'the same one cell' : 'one cell', W * 0.5, H - 26, { tone: any ? 'accent' : 'plain' });
    return { s, over };
  }

  _groups(W, H, P) {
    const tl = this.tl, any = tl.any(), on = (t) => !any || tl.has(t);
    const x0 = 14, x1 = W - 14, w = x1 - x0;
    // bands, top (outside) to bottom (the gut space with food)
    const yW = 10, yC = P ? 52 : 46, hC = P ? 36 : 30, yM = yC + hC + 6, hM = P ? 108 : 92, yN = yM + hM + 6, hN = P ? 96 : 82, yG = yN + hN + 6, hG = P ? 80 : 68;
    let s = `<rect width="${W}" height="${H}" style="fill:${mx('sea-shallow', 'elev-peak', 26)}"/>`;
    for (let i = 0; i < 7; i++) s += `<path d="M${n1(x0 + i * w / 6)} ${yW + 18}q30 -12 60 0" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 60)};stroke-width:2;opacity:.4"/>`;
    s += `<rect x="0" y="${yC - 4}" width="${W}" height="${yG + hG - yC + 8}" style="fill:${mx('membrane', W_, 22)}"/>`;
    // covering cells: flat, wide, a flat nucleus each, tight edge to edge
    let c = '';
    const cw = P ? 58 : 64;
    for (let xx = x0 - 20, i = 0; xx < x1; xx += cw, i++) {
      const d = `M${n1(xx + 2)} ${yC + hC}V${yC + 8}Q${n1(xx + 2)} ${yC} ${n1(xx + 12)} ${yC}H${n1(xx + cw - 10)}Q${n1(xx + cw - 2)} ${yC} ${n1(xx + cw - 2)} ${yC + 8}V${yC + hC}Z`;
      c += `<path d="${d}" style="fill:url(#ta-col) ${LINE};stroke:${mx(LINE, INK, 58)};stroke-width:${tl.has('cover') ? 2.4 : 1.4}"/><ellipse cx="${n1(xx + cw / 2)}" cy="${yC + hC * 0.56}" rx="${n1(cw * 0.22)}" ry="${n1(hC * 0.2)}" style="fill:url(#cw-nuc) ${T('series-5')}"/><path d="M${n1(xx + 10)} ${yC + 5}H${n1(xx + cw - 14)}" style="fill:none;stroke:${W_};stroke-width:2;opacity:.6;stroke-linecap:round"/>`;
    }
    s += `<g ${op(on('cover'))}>${c}</g>`;
    // muscle cells: long spindles packed side by side
    let m = `<linearGradient id="oc-mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(MUSC_D, W_, 70)}"/><stop offset=".5" style="stop-color:${mx(MUSC_D, W_, 82)}"/><stop offset="1" style="stop-color:${mx(MUSC_D, INK, 80)}"/></linearGradient><rect x="0" y="${yM}" width="${W}" height="${hM}" style="fill:url(#oc-mg) ${MUSC_D}"/>`;
    for (let i = 0; i < 9; i++) { const fy = yM + 4 + i * (hM - 8) / 8; m += `<path d="M-10 ${n1(fy)}C${n1(W * 0.3)} ${n1(fy - 3)} ${n1(W * 0.6)} ${n1(fy + 3)} ${W + 10} ${n1(fy)}" style="fill:none;stroke:${mx(MUSC, W_, 60)};stroke-width:1;opacity:.35"/>`; }
    const q = rnd(3), rows = P ? 7 : 6;
    for (let r = 0; r < rows; r++) for (let xx = x0 - 40 + (r % 2) * 44; xx < x1 + 40; xx += 92) m += spindle(xx + q() * 8, yM + 8 + (r + 0.5) * ((hM - 16) / rows), 96, 15, (q() - 0.5) * 4, { lit: tl.has('muscle') });
    s += `<g ${op(on('muscle'))}><clipPath id="oc-m"><rect x="0" y="${yM}" width="${W}" height="${hM}"/></clipPath><g clip-path="url(#oc-m)">${m}</g></g>`;
    // nerve cells: cell bodies with long fibres reaching along the body
    let nv = `<linearGradient id="oc-ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(NERVE, W_, 70)}"/><stop offset="1" style="stop-color:${mx(NERVE, W_, 84)}"/></linearGradient><rect x="0" y="${yN}" width="${W}" height="${hN}" style="fill:url(#oc-ng) ${NERVE}"/>`;
    { const qn = rnd(17); for (let i = 0; i < 10; i++) { const fy = yN + qn() * hN; nv += `<path d="M-10 ${n1(fy)}Q${n1(W * (0.2 + qn() * 0.3))} ${n1(fy + (qn() - 0.5) * 30)} ${n1(W * 0.6)} ${n1(fy + (qn() - 0.5) * 16)}T${W + 10} ${n1(fy + (qn() - 0.5) * 20)}" style="fill:none;stroke:${mx(NERVE_D, W_, 50)};stroke-width:1;opacity:.35"/>`; } }
    // a chain: the first cell's axon ends in terminals just short of the second cell's dendrites (one synapse gap);
    // signals run dendrites -> cell body -> axon -> terminals, left to right
    const nk = P ? 0.7 : 0.8, ya = yN + hN * 0.42, yb = yN + hN * 0.56, toA = [x0 + w * 0.44, yN + hN * 0.5], bx = toA[0] + 18 * nk + 66 * nk, toB = [x1 + 80, yN + hN * 0.44];
    nv += neuron(x0 + 46, ya, nk, { seed: 3, to: toA, lit: tl.has('nerve'), myelin: false }) + sheath(x0 + 46, ya, nk, toA);
    nv += neuron(bx, yb, nk, { seed: 8, to: toB, lit: tl.has('nerve'), myelin: false }) + sheath(bx, yb, nk, toB);
    nv += `<circle cx="${n1(toA[0] + 18 * nk + 6)}" cy="${n1(toA[1])}" r="${n1(26 * nk)}" style="fill:none;stroke:${NERVE_D};stroke-width:1.6;stroke-dasharray:4 4;opacity:.7"/>`;
    s += `<g ${op(on('nerve'))}><clipPath id="oc-n"><rect x="0" y="${yN}" width="${W}" height="${hN}"/></clipPath><g clip-path="url(#oc-n)">${nv}</g></g>`;
    // food-taking lining cells: tall, nuclei at the base, food bits in the gut space under them
    // microvilli: a fine brush border on the gut face, drawn under the cells' free ends; a basement line on the other side
    let mv = ''; for (let xx = x0 - 10; xx < x1 + 10; xx += 2.6) mv += `M${n1(xx)} ${n1(yG - 6)}V${n1(yG + 6)}`;
    let g = `<g transform="translate(0 ${yG + hG}) scale(1 -1) translate(0 ${-yG})"><path d="${mv}" style="fill:none;stroke:${mx(LINE, INK, 60)};stroke-width:1.1;opacity:.85"/>${columnar(x0 - 10, yG, w + 20, hG - 18, P ? 9 : 14, { lit: tl.has('gut'), seed: 5 })}<path d="M${x0 - 12} ${n1(yG + hG - 17)}H${x1 + 12}" style="fill:none;stroke:${mx(LINE, INK, 40)};stroke-width:2.4"/></g>`;
    const qf = rnd(11);
    for (let i = 0; i < 9; i++) g += `<ellipse cx="${n1(x0 + qf() * w)}" cy="${n1(yG + hG + 10 + qf() * 18)}" rx="${n1(6 + qf() * 5)}" ry="${n1(4 + qf() * 3)}" style="fill:url(#cw-chl) ${T('chloro')};opacity:.85"/>`;
    s += `<rect x="0" y="${yG + hG}" width="${W}" height="${H - yG - hG}" style="fill:${mx('series-2', W_, 22)}"/><g ${op(on('gut'))}>${g}</g>`;
    let over = chip('outside', W - 52, yW + 14, { tone: 'plain' }) + chip('gut, with food', W - 80, Math.min(H - 18, yG + hG + 26), { tone: 'plain' });
    const lit = tl.chip();
    if (lit) { const yy = { cover: yC + hC / 2, muscle: yM + hM / 2, nerve: yN + hN / 2, gut: yG + hG / 2 }[lit.targets[0]]; over += chip('a group of similar cells', W * 0.5, yy, { tone: lit.tone }); }
    return { s, over };
  }

  _animal(W, H, P) {
    const tl = this.tl, any = tl.any(), on = (t) => !any || tl.has(t);
    const k = P ? 0.78 : 0.84, bx = P ? W * 0.3 : W * 0.3, by = P ? 30 : 12;
    const X = (v) => bx + v * k, Y = (v) => by + v * k;
    // a clinical figure in side view, facing right: head, neck, chest; the arm bent at the elbow, a bag in the hand
    let s = `<defs><linearGradient id="oc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('series-1', W_, 12)}"/><stop offset="1" style="stop-color:${mx('series-5', W_, 16)}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#oc-bg)"/>`;
    const skin = BODY.skin, P2 = (pts) => pts.map(([u, v]) => [X(u), Y(v)]), hw = (l) => l.map((w) => w * k);
    const torso = `M${X(-8)} ${Y(98)}C${X(-44)} ${Y(112)} ${X(-52)} ${Y(190)} ${X(-46)} ${Y(260)}C${X(-42)} ${Y(330)} ${X(-38)} ${Y(390)} ${X(-36)} ${Y(424)}H${X(76)}C${X(74)} ${Y(360)} ${X(84)} ${Y(300)} ${X(82)} ${Y(250)}C${X(80)} ${Y(190)} ${X(78)} ${Y(130)} ${X(40)} ${Y(100)}Z`;
    const head = `M${X(18)} ${Y(-4)}C${X(-30)} ${Y(-4)} ${X(-38)} ${Y(46)} ${X(-24)} ${Y(74)}C${X(-14)} ${Y(92)} ${X(2)} ${Y(104)} ${X(24)} ${Y(106)}C${X(46)} ${Y(106)} ${X(62)} ${Y(92)} ${X(66)} ${Y(70)}C${X(72)} ${Y(36)} ${X(56)} ${Y(-4)} ${X(18)} ${Y(-4)}Z`;
    const neck = tapered(P2([[14, 84], [16, 104], [16, 120]]), hw([17, 19, 22]));
    const upper = tapered(P2([[16, 118], [22, 180], [30, 246]]), hw([23, 19, 16]));
    const fore = tapered(P2([[28, 248], [100, 241], [176, 233]]), hw([16, 13, 10]));
    const hand = `M${X(170)} ${Y(222)}C${X(190)} ${Y(208)} ${X(216)} ${Y(214)} ${X(216)} ${Y(236)}C${X(216)} ${Y(258)} ${X(192)} ${Y(264)} ${X(172)} ${Y(250)}Z`;
    s += form(torso, skin, { rim: 2, ao: 16 }) + form(neck, skin, { rim: 2 }) + form(head, skin, { rim: 2, ao: 12 });
    // bones, quiet: upper arm bone, the two forearm bones
    const bone = mx('strata-1', W_, 30), boneD = mx('strata-1', INK, 60);
    const bones = `M${X(18)} ${Y(128)}L${X(27)} ${Y(242)}M${X(34)} ${Y(244)}L${X(172)} ${Y(230)}M${X(34)} ${Y(254)}L${X(172)} ${Y(240)}`;
    s += form(upper, skin, { rim: 2 }) + form(fore, skin, { rim: 2 });
    s += `<g opacity="${any ? 0.35 : 0.75}"><path d="${bones}" style="fill:none;stroke:${boneD};stroke-width:${n1(8 * k)};stroke-linecap:round"/><path d="${bones}" style="fill:none;stroke:${bone};stroke-width:${n1(5.4 * k)};stroke-linecap:round"/></g>`;
    // the biceps on the front of the upper arm, its tendon to the forearm
    const bic = tapered(P2([[25, 134], [32, 188], [35, 230]]), hw([5, 12.5, 4]));
    s += `<g ${op(on('muscle'))}>${form(bic, MUSC, { rim: tl.has('muscle') ? 4 : 2.4, inner: `<path d="M${X(26)} ${Y(146)}Q${X(36)} ${Y(188)} ${X(34)} ${Y(226)}M${X(30)} ${Y(144)}Q${X(42)} ${Y(188)} ${X(36)} ${Y(226)}M${X(22)} ${Y(150)}Q${X(30)} ${Y(190)} ${X(32)} ${Y(226)}" style="fill:none;stroke:${MUSC_D};stroke-width:1.4;opacity:.5"/>` })}<path d="M${X(35)} ${Y(230)}L${X(52)} ${Y(244)}" style="fill:none;stroke:${mx('strata-1', W_, 50)};stroke-width:${n1(4.4 * k)};stroke-linecap:round"/></g>`;
    // the school bag, hanging from its top handle in the fist
    const bagC = mx('series-5', 'series-1', 60);
    const bag = `M${X(150)} ${Y(312)}Q${X(150)} ${Y(296)} ${X(166)} ${Y(296)}H${X(268)}Q${X(284)} ${Y(296)} ${X(284)} ${Y(312)}V${Y(420)}Q${X(284)} ${Y(436)} ${X(268)} ${Y(436)}H${X(166)}Q${X(150)} ${Y(436)} ${X(150)} ${Y(420)}Z`;
    const pocket = `M${X(166)} ${Y(360)}Q${X(166)} ${Y(348)} ${X(178)} ${Y(348)}H${X(256)}Q${X(268)} ${Y(348)} ${X(268)} ${Y(360)}V${Y(418)}H${X(166)}Z`;
    s += `<g opacity="${any ? 0.5 : 1}"><path d="M${X(196)} ${Y(298)}C${X(196)} ${Y(232)} ${X(222)} ${Y(232)} ${X(226)} ${Y(298)}" style="fill:none;stroke:${mx(bagC, INK, 60)};stroke-width:${n1(8 * k)};stroke-linecap:round"/><path d="M${X(196)} ${Y(298)}C${X(196)} ${Y(232)} ${X(222)} ${Y(232)} ${X(226)} ${Y(298)}" style="fill:none;stroke:${bagC};stroke-width:${n1(4.6 * k)};stroke-linecap:round"/>${form(bag, bagC, { rim: 2.4 })}${form(pocket, mx(bagC, INK, 82), { rim: 2, ao: 6 })}`
      + `<path d="M${X(160)} ${Y(326)}H${X(274)}M${X(176)} ${Y(362)}H${X(258)}" style="fill:none;stroke:${mx(bagC, INK, 50)};stroke-width:2.4;stroke-dasharray:5 4"/><rect x="${n1(X(252))}" y="${n1(Y(320))}" width="${n1(8 * k)}" height="${n1(14 * k)}" rx="2" style="fill:${T('gold')};stroke:${mx('gold', INK, 50)};stroke-width:1.4"/></g>`;
    s += form(hand, skin, { rim: 2 }) + `<path d="M${X(188)} ${Y(218)}Q${X(196)} ${Y(228)} ${X(194)} ${Y(240)}M${X(200)} ${Y(218)}Q${X(208)} ${Y(228)} ${X(206)} ${Y(242)}" style="fill:none;stroke:${mx(skin, INK, 60)};stroke-width:1.6;opacity:.7"/>`;
    // the brain in the head, the spinal cord down the back, a nerve down the arm to the fingertips
    const brain = `M${X(-12)} ${Y(50)}C${X(-16)} ${Y(14)} ${X(20)} ${Y(4)} ${X(40)} ${Y(10)}C${X(66)} ${Y(16)} ${X(70)} ${Y(46)} ${X(56)} ${Y(60)}C${X(36)} ${Y(70)} ${X(0)} ${Y(70)} ${X(-12)} ${Y(50)}Z`;
    const path = `M${X(206)} ${Y(232)}C${X(150)} ${Y(234)} ${X(80)} ${Y(250)} ${X(34)} ${Y(248)}C${X(20)} ${Y(222)} ${X(14)} ${Y(170)} ${X(10)} ${Y(128)}C${X(4)} ${Y(112)} ${X(-12)} ${Y(112)} ${X(-16)} ${Y(104)}L${X(-6)} ${Y(64)}`;
    const nl = tl.has('nerve');
    s += `<g ${op(on('nerve'))}>${form(brain, mx('series-4', W_, 46), { rim: nl ? 3.6 : 2, inner: `<path d="M${X(0)} ${Y(40)}q10 -16 22 -4q10 -14 22 0M${X(4)} ${Y(56)}q12 -10 24 0q10 -10 22 -2" style="fill:none;stroke:${mx('series-4', INK, 60)};stroke-width:1.6;opacity:.6"/>` })}`;
    s += `<path d="M${X(-16)} ${Y(104)}C${X(-30)} ${Y(180)} ${X(-30)} ${Y(300)} ${X(-22)} ${Y(420)}" style="fill:none;stroke:${NERVE_D};stroke-width:${n1(10 * k + 2)};stroke-linecap:round"/><path d="M${X(-16)} ${Y(104)}C${X(-30)} ${Y(180)} ${X(-30)} ${Y(300)} ${X(-22)} ${Y(420)}" style="fill:none;stroke:${NERVE};stroke-width:${n1(8 * k)};stroke-linecap:round"/>`;
    s += `<path d="${path}" style="fill:none;stroke:${NERVE_D};stroke-width:${n1(5 * k + (nl ? 3 : 1.6))};stroke-linecap:round"/><path d="${path}" style="fill:none;stroke:${NERVE};stroke-width:${n1(3.6 * k)};stroke-linecap:round"/>`;
    if (nl) s += arrow(X(150), Y(226), X(70), Y(238), NERVE_D, 3) + arrow(X(16), Y(196), X(12), Y(140), NERVE_D, 3);
    s += '</g>';
    // two round insets, magnified: muscle tissue (long fibres side by side in a bundle) and nervous tissue
    const R = P ? 62 : 74, ix = P ? W - R - 12 : W - R - 24, iy1 = P ? 92 : R + 22, iy2 = P ? H - R - 64 : H - R - 26;
    const inset = (cx, cy, id, body, lit, src) => `<path d="M${n1(src[0])} ${n1(src[1])}L${n1(cx - R * 0.8)} ${n1(cy)}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:5 5;opacity:.6"/><circle cx="${n1(cx + 4)}" cy="${n1(cy + 8)}" r="${R}" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/><clipPath id="${id}"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}"/></clipPath><g clip-path="url(#${id})">${body}</g><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}" style="fill:none;stroke:${mx('strata-5', INK, 60)};stroke-width:${lit ? 6 : 4}"/><path d="M${n1(cx - R * 0.7)} ${n1(cy - R * 0.5)}A${R * 0.86} ${R * 0.86} 0 0 1 ${n1(cx - R * 0.1)} ${n1(cy - R * 0.84)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.6"/>`;
    let fib = `<rect x="${n1(ix - R)}" y="${n1(iy1 - R)}" width="${2 * R}" height="${2 * R}" style="fill:${MUSC_D}"/>`;
    for (let i = 0; i < 9; i++) {
      const fy = iy1 - R + 4 + i * (2 * R / 8.6), d = `M${n1(ix - R - 10)} ${n1(fy)}C${n1(ix - R * 0.3)} ${n1(fy - 4)} ${n1(ix + R * 0.3)} ${n1(fy + 4)} ${n1(ix + R + 10)} ${n1(fy)}`;
      fib += `<path d="${d}" style="fill:none;stroke:${MUSC};stroke-width:${n1(2 * R / 8.6 - 2)};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${MUSC_D};stroke-width:${n1(2 * R / 8.6 - 3)};stroke-dasharray:1.6 3.2;opacity:.55"/><path d="${d}" style="fill:none;stroke:${mx(MUSC, W_, 50)};stroke-width:1.4;transform:translate(0,-3px);opacity:.7"/>`;
      fib += `<ellipse cx="${n1(ix - R * 0.5 + (i % 3) * R * 0.4)}" cy="${n1(fy)}" rx="7" ry="2.6" style="fill:url(#cw-nuc) ${T('series-5')}"/>`;
    }
    const nerveBody = `<rect x="${n1(ix - R)}" y="${n1(iy2 - R)}" width="${2 * R}" height="${2 * R}" style="fill:${mx(NERVE, W_, 74)}"/>` + neuron(ix - R * 0.45, iy2 - R * 0.2, P ? 0.6 : 0.7, { seed: 4, to: [ix + R * 1.1, iy2 + R * 0.5], lit: nl });
    s += `<g ${op(on('muscle'))}>${inset(ix, iy1, 'oc-i1', fib, tl.has('muscle'), [X(34), Y(186)])}</g><g ${op(on('nerve'))}>${inset(ix, iy2, 'oc-i2', nerveBody, nl, [X(120), Y(240)])}</g>`;
    const over = chip('muscle tissue', ix, iy1 + R + 4, { tone: tl.has('muscle') ? 6 : 'plain' }) + chip('nervous tissue', ix, iy2 + R + 4, { tone: nl ? 2 : 'plain' })
      + (nl ? chip('brain', Math.max(48, X(-80)), Y(30), { tone: 'plain' }) : '') + (tl.has('muscle') ? chip('arm muscle', Math.max(64, X(-100)), Y(186), { tone: 'plain' }) : '');
    return { s, over };
  }

  _plant(W, H, P) {
    const tl = this.tl, any = tl.any(), on = (t) => !any || tl.has(t);
    let s = `<defs><linearGradient id="oc-pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sky-day', W_, 30)}"/><stop offset="1" style="stop-color:${mx('elev-low', W_, 30)}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#oc-pl)"/>`;
    // a young plant at the left: soil, stem, leaves, a box marking the slice
    const px = P ? 50 : 82, gy = H - (P ? 40 : 46), top = P ? 70 : 60;
    // soil: a cut bed with crumbs and grain; roots taper from the stem base with fine hairs behind their tips
    const sw0 = P ? 104 : 170, soil = mx('strata-3', 'strata-2', 50), qs = rnd(5);
    s += `<rect x="0" y="${gy}" width="${sw0}" height="${H - gy}" style="fill:${soil}"/><rect x="0" y="${gy}" width="${sw0}" height="${H - gy}" style="fill:${INK};opacity:.18;filter:url(#cw-grain)"/><path d="M0 ${gy}Q${sw0 * 0.5} ${gy - 4} ${sw0} ${gy}" style="fill:none;stroke:${mx(soil, INK, 60)};stroke-width:3"/>`;
    for (let i = 0; i < 18; i++) { const cx = qs() * sw0, cy = gy + 6 + qs() * (H - gy - 8), r0 = 1.6 + qs() * 3; s += `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(r0 * 1.3)}" ry="${n1(r0)}" style="fill:${mx(soil, i % 2 ? W_ : INK, 70)}"/><ellipse cx="${n1(cx - r0 * 0.3)}" cy="${n1(cy - r0 * 0.4)}" rx="${n1(r0 * 0.5)}" ry="${n1(r0 * 0.22)}" style="fill:${W_};opacity:.3"/>`; }
    const rootC = mx('strata-1', W_, 56), rootD = mx('strata-2', INK, 50);
    for (let i = 0; i < 5; i++) {
      const sg = i - 2, len = (P ? 26 : 32) + (i % 2) * 8, ex = px + sg * (P ? 14 : 20), ey = gy + len, w0 = i === 2 ? 4 : 2.8;
      const d = `M${n1(px - w0)} ${gy}C${n1(px - w0 + sg * 4)} ${n1(gy + len * 0.4)} ${n1(ex - 1 - sg * 3)} ${n1(ey - len * 0.3)} ${n1(ex)} ${n1(ey)}C${n1(ex + 1 - sg * 3)} ${n1(ey - len * 0.3)} ${n1(px + w0 + sg * 4)} ${n1(gy + len * 0.4)} ${n1(px + w0)} ${gy}Z`;
      s += `<path d="${d}" style="fill:${rootC};stroke:${rootD};stroke-width:1.2"/>`;
      for (let h = 1; h < 6; h++) { const t = 0.4 + h * 0.09, hx = px + (ex - px) * t, hy = gy + len * t, side = h % 2 ? 1 : -1; s += `<path d="M${n1(hx)} ${n1(hy)}l${n1(side * 5)} ${n1(2)}" style="fill:none;stroke:${mx(rootC, W_, 50)};stroke-width:.9;stroke-linecap:round"/>`; }
    }
    // the stem: tapering, lit on the left, with nodes where leaves join (alternate sides), a bud at the top
    const stemC = mx('elev-low', 'chloro', 46), stemD = mx(stemC, INK, 60), stemL = mx(stemC, W_, 50), sh = gy - top, wAt = (y) => 3 + 2.6 * (y - top) / sh;
    const sd = `M${n1(px - wAt(gy))} ${gy}C${n1(px - wAt(gy) - 2)} ${n1(gy - sh * 0.5)} ${n1(px - 3)} ${n1(top + 20)} ${n1(px - 2.6)} ${n1(top)}Q${n1(px)} ${n1(top - 8)} ${n1(px + 2.6)} ${n1(top)}C${n1(px + 3)} ${n1(top + 20)} ${n1(px + wAt(gy) + 2)} ${n1(gy - sh * 0.5)} ${n1(px + wAt(gy))} ${gy}Z`;
    s += `<path d="${sd}" style="fill:${stemC};stroke:${stemD};stroke-width:1.6"/><path d="M${n1(px - 2.4)} ${n1(gy - 4)}C${n1(px - 3.4)} ${n1(gy - sh * 0.5)} ${n1(px - 1.8)} ${n1(top + 20)} ${n1(px - 1.4)} ${n1(top + 6)}" style="fill:none;stroke:${stemL};stroke-width:1.6;opacity:.8"/>`;
    const lk = P ? 0.6 : 1, nodes = [[top + 22, -1, 62], [top + 22 + 50 * lk + 14, 1, 70], [top + 22 + 110 * lk + 20, -1, 64], [top + 22 + 170 * lk + 22, 1, 56]];
    for (const [ny, sg, ll] of nodes) {
      if (ny > gy - 20) continue;
      const nw = wAt(ny) + 1.6, petx = px + sg * 14 * lk, pety = ny - 8 * lk;
      s += `<path d="M${n1(px + sg * nw * 0.6)} ${n1(ny)}Q${n1(px + sg * 8 * lk)} ${n1(ny - 2)} ${n1(petx)} ${n1(pety)}" style="fill:none;stroke:${stemD};stroke-width:3.4;stroke-linecap:round"/><path d="M${n1(px + sg * nw * 0.6)} ${n1(ny)}Q${n1(px + sg * 8 * lk)} ${n1(ny - 2)} ${n1(petx)} ${n1(pety)}" style="fill:none;stroke:${stemC};stroke-width:2;stroke-linecap:round"/>`;
      s += leafArt(petx, pety, ll * lk, sg < 0 ? 200 : -22, { seed: Math.round(ny), wide: 0.34 });
      s += `<ellipse cx="${px}" cy="${n1(ny)}" rx="${n1(nw + 1)}" ry="2.6" style="fill:${stemD};opacity:.7"/><ellipse cx="${n1(px - 0.8)}" cy="${n1(ny - 1)}" rx="${n1(nw * 0.6)}" ry="1" style="fill:${stemL};opacity:.8"/>`;
    }
    const by0 = (gy + top) / 2 - 30, by1 = by0 + 60;
    s += `<rect x="${px - 12}" y="${n1(by0)}" width="24" height="60" rx="6" style="fill:none;stroke:${INK};stroke-width:3;stroke-dasharray:5 4"/>`;
    // the slice: a big lengthwise cut through the stem
    const sx0 = P ? 118 : 196, sx1 = W - 14, sy0 = 14, sy1 = H - 14, sw = sx1 - sx0;
    s += `<path d="M${px + 12} ${n1(by0)}L${sx0} ${sy0 + 10}M${px + 12} ${n1(by1)}L${sx0} ${sy1 - 10}" style="fill:none;stroke:${INK};stroke-width:2;stroke-dasharray:6 5;opacity:.55"/>`;
    s += `<rect x="${sx0 + 4}" y="${sy0 + 8}" width="${sw}" height="${sy1 - sy0}" rx="16" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><clipPath id="oc-sl"><rect x="${sx0}" y="${sy0}" width="${sw}" height="${sy1 - sy0}" rx="16"/></clipPath><g clip-path="url(#oc-sl)">`;
    s += `<rect x="${sx0}" y="${sy0}" width="${sw}" height="${sy1 - sy0}" style="fill:${mx('elev-low', W_, 30)}"/>`;
    // layout across the slice: skin, cortex, phloem, xylem, pith; mirror on the far side
    const u = sw / 20, cols = { epi: 0.5, cortex: [0.6, 3.6], phl: [3.8, 6], xyl: [6.2, 8.2] };
    const q = rnd(12);
    let cortex = '';
    const plainCell = (cx, cy, cw2, ch) => `<rect x="${n1(cx - cw2 / 2)}" y="${n1(cy - ch / 2)}" width="${n1(cw2)}" height="${n1(ch)}" rx="${n1(Math.min(cw2, ch) * 0.3)}" style="fill:url(#cw-cytoG) ${mx('elev-low', W_, 40)};stroke:${mx('elev-low', INK, 52)};stroke-width:2.6"/><ellipse cx="${n1(cx + cw2 * 0.15)}" cy="${n1(cy)}" rx="${n1(cw2 * 0.13)}" ry="${n1(ch * 0.1)}" style="fill:url(#cw-nuc) ${T('series-5')};opacity:.8"/>`;
    for (const side of [0, 1]) {
      const X = (v) => (side ? sx1 - v * u : sx0 + v * u);
      for (let yy = sy0 - 10 + side * 14; yy < sy1 + 20; yy += 28) cortex += `<rect x="${n1(Math.min(X(0), X(cols.epi)))}" y="${n1(yy)}" width="${n1(u * cols.epi)}" height="26" style="fill:${mx('elev-low', INK, 30)};stroke:${mx('elev-low', INK, 60)};stroke-width:1.4"/>`;
      for (let c = 0; c < 2; c++) for (let yy = sy0 - 20 + (c % 2) * 18 + side * 9; yy < sy1 + 30; yy += 38) cortex += plainCell(X(cols.cortex[0] + 0.55 + c * 1.15), yy + q() * 4, u * 1.05, 34);
    }
    s += cortex;
    let phl = '', xyl = '';
    for (const side of [0, 1]) {
      const X = (v) => (side ? sx1 - v * u : sx0 + v * u);
      phl += phloemTube(X(cols.phl[0] + 0.7), sy0 - 10 + side * 20, sy1 + 10, u * 1.2, { lit: tl.has('phloem'), seg: 54 });
      phl += phloemTube(X(cols.phl[0] + 2.0), sy0 - 30 + side * 10, sy1 + 10, u * 0.9, { lit: tl.has('phloem'), seg: 48 });
      xyl += xylemTube(X(cols.xyl[0] + 0.5), sy0 - 10, sy1 + 10, u * 1.1, { rings: true, water: tl.has('xylem') ? 0.8 : 0, lit: tl.has('xylem') });
      xyl += xylemTube(X(cols.xyl[0] + 1.8), sy0 - 10, sy1 + 10, u * 1.4, { water: tl.has('xylem') ? 0.8 : 0, lit: tl.has('xylem') });
    }
    s += `<g ${op(on('phloem'))}>${phl}</g><g ${op(on('xylem'))}>${xyl}</g>`;
    // pith in the middle
    const pm = (sx0 + sx1) / 2;
    for (let yy = sy0 - 10; yy < sy1 + 30; yy += 46) for (const dx of [-0.62, 0.62]) s += plainCell(pm + dx * u, yy + 20 + (dx > 0 ? 23 : 0), u * 1.1, 42);
    s += '</g>';
    s += `<rect x="${sx0}" y="${sy0}" width="${sw}" height="${sy1 - sy0}" rx="16" style="fill:none;stroke:${mx('elev-low', INK, 66)};stroke-width:3"/>`;
    // flow arrows: water up the xylem only; food along the phloem both ways
    let over = '';
    if (tl.has('xylem')) { for (const side of [0, 1]) { const X = (v) => (side ? sx1 - v * u : sx0 + v * u); s += arrow(X(cols.xyl[0] + 1.15), sy1 - 30, X(cols.xyl[0] + 1.15), sy0 + 40, mx('series-1', INK, 70), 6); } over += chip('xylem: water goes up', (sx0 + sx1) / 2, sy0 + 26, { tone: 1 }); }
    if (tl.has('phloem')) { for (const side of [0, 1]) { const X = (v) => (side ? sx1 - v * u : sx0 + v * u), ax = X(cols.phl[0] + 1.35); s += arrow(ax, sy1 * 0.48, ax, sy0 + 40, mx('series-2', INK, 70), 5) + arrow(ax, sy1 * 0.56, ax, sy1 - 30, mx('series-2', INK, 70), 5); } over += chip('phloem: food goes both ways', (sx0 + sx1) / 2, sy1 - 26, { tone: 2 }); }
    if (!any) over += chip('stem, cut lengthwise', (sx0 + sx1) / 2, sy1 - 26, { tone: 'plain' });
    return { s, over };
  }
}
