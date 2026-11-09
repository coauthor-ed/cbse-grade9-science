// KneeJoint - blk-l07-s9 (6 beats: intro, bone, cartilage, tendon, ligament, pair). Fig 3.12c: a side view of the
// knee. Femur (thigh bone), tibia (shin bone) and fibula, the kneecap in front, cartilage caps on the bone ends, the
// thigh muscle and its tendon over the kneecap to the shin (muscle to bone), ligaments from bone to bone (one on the
// outer side from femur to fibula, one crossing inside the joint). A round inset shows each tissue as it looks under a
// microscope. On the ligament beat the lower leg straightens from bent and stops at its limit. Name chips light each one.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, field } from '../shared/BodyArt.js';
import { boneForm, muscleForm, fibreBand, INK, W_, BONE, BONE_D, CART, CART_D, TEND, TEND_D, LIGA, LIGA_D } from '../shared/LimbArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const CHIPS = [
  { id: 'bone', label: 'Bone', targets: ['bone'], tone: 2 },
  { id: 'cart', label: 'Cartilage', targets: ['cart'], tone: 1 },
  { id: 'tendon', label: 'Tendon', targets: ['tendon'], tone: 5 },
  { id: 'liga', label: 'Ligament', targets: ['liga'], tone: 3 },
];
const LIT = { 0: [], 1: ['bone'], 2: ['cart'], 3: ['tendon'], 4: ['liga'], 5: ['tendon', 'liga'] };
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const KC = [150, 214];   // knee centre (local)

// -- the knee, local box x 40..280, y -10..420 -----------------------------------------------------------
const FEMUR = 'M128 -10L170 -10C172 60 172 120 176 160C190 172 198 196 190 212C180 226 156 226 146 220C134 228 112 226 106 210C100 192 112 170 124 160C128 120 128 60 128 -10Z';
const TIBIA = 'M104 232C120 226 180 226 196 232C200 244 196 258 190 264C192 272 186 280 180 284C174 330 172 380 172 420L140 420C140 380 136 330 128 288C116 276 104 262 104 232Z';
const FIBULA = 'M100 252C112 246 122 250 122 260C118 280 116 340 118 420L106 420C106 340 104 280 98 264C96 258 96 254 100 252Z';
const PATELLA = 'M200 140C216 140 222 162 218 182C214 198 204 204 198 198C190 190 188 160 192 148C194 142 196 140 200 140Z';
function kneeArt(lit, any, o = {}) {
  const a = (id) => (!any || lit.includes(id) || id === 'bone' ? 1 : 0.4);
  const g = (id, body) => `<g style="opacity:${a(id)}">${body}</g>`;
  const rw = (id) => (lit.includes(id) ? 4.2 : 2.4), on = (id) => lit.includes(id);
  const cl = (d, w) => `<path d="${d}" style="fill:none;stroke:${CART_D};stroke-width:${w + 3.6};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${CART};stroke-width:${w};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${W_};stroke-width:1.4;stroke-linecap:round;opacity:.6;transform:translate(-1px,-1.4px)"/>`;
  const cw = on('cart') ? 7.4 : 5.6;
  // swing on the ligament beat: lower leg 30 deg to straight, the kneecap half of that; reduced motion: straight
  const sw = (deg) => (o.swing && !still() ? `<animateTransform attributeName="transform" type="rotate" values="${deg} ${KC[0]} ${KC[1]};${deg} ${KC[0]} ${KC[1]};0 ${KC[0]} ${KC[1]}" keyTimes="0;.25;1" dur="2.6s" fill="freeze" calcMode="spline" keySplines="0 0 1 1;.3 0 .4 1"/>` : '');
  let s = '';
  // muscles: the hamstring behind (back of the thigh), the thigh muscle in front ending in its tendon
  s += `<g style="opacity:${any ? 0.45 : 0.85}">${muscleForm([[100, -10], [92, 60], [98, 120], [112, 170]], [18, 22, 15, 5], { rim: 2, col: mx('series-6', 'series-4', 50) })}</g>`;
  s += g('tendon', muscleForm([[176, -10], [190, 46], [198, 94], [202, 118]], [24, 28, 20, 9], { rim: 2.4 }));
  // the lower leg: tibia (front bump, the tuberosity), fibula, cartilage on the tibia top, the kneecap ligament to the tuberosity
  const lower = g('bone', boneForm(TIBIA, { ends: [[150, 250, 26]], line: 'M150 300L156 410', rim: rw('bone') }) + boneForm(FIBULA, { ends: [[110, 258, 8]], rim: rw('bone') }))
    + g('cart', cl('M108 233C124 226 178 226 194 233', cw))
    + g('tendon', fibreBand([211, 184], [192, 270], 10, 6.5, TEND, TEND_D, { lit: on('tendon'), fan: true, bow: -3 }));
  // the cross ligaments inside the joint, behind the side face of the thigh bone: drawn first so the bone end covers their tops
  const cru = g('liga', fibreBand([132, 244], [170, 194], 4.5, 4, LIGA, LIGA_D, { lit: on('liga') }) + fibreBand([172, 248], [128, 198], 4.5, 4, LIGA, LIGA_D, { lit: on('liga') }));
  s += cru + `<g>${sw(30)}<g transform="translate(0 12)">${lower}</g></g>`;
  // thigh bone, its cartilage cap
  s += g('bone', boneForm(FEMUR, { ends: [[150, 196, 26]], line: 'M140 0L142 150', rim: rw('bone') })) + g('cart', cl('M106 204C108 222 130 230 148 224C166 230 188 224 192 206', cw));
  // the side ligament, thigh bone to fibula, on the outer face of the joint
  s += g('liga', fibreBand([124, 182], [106, 274], 7, 6, LIGA, LIGA_D, { lit: on('liga'), fan: true }) + fibreBand([106, 274], [124, 182], 6, 7, LIGA, LIGA_D, { fan: true }));
  // the thigh-muscle tendon down to the kneecap and over its front; the kneecap with cartilage on its back
  s += g('tendon', fibreBand([198, 98], [212, 160], 15, 9, TEND, TEND_D, { lit: on('tendon'), bow: 3 }));
  s += `<g>${sw(15)}${g('bone', boneForm(PATELLA, { rim: rw('bone') }))}${g('cart', `<path d="M193 150C189 166 190 186 197 197" style="fill:none;stroke:${CART};stroke-width:4.6;stroke-linecap:round"/>`)}`
    + `<g style="opacity:${a('tendon') * 0.75}">${fibreBand([213, 150], [212, 192], 6, 6, TEND, TEND_D, { bow: 4 })}</g></g>`;
  return s;
}
// -- microscope insets -----------------------------------------------------------------------------------
function inset(kind, cx, cy, r) {
  const q = rnd(kind.length * 7), id = `kj-${kind}`;
  let b = '';
  if (kind === 'bone') {
    b += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" style="fill:${mx(BONE, 'series-2', 80)}"/>`;
    for (const [ox, oy, rr] of [[-0.34, -0.3, 0.42], [0.42, 0.08, 0.4], [-0.2, 0.52, 0.34], [0.6, -0.62, 0.3]]) {
      const x = cx + ox * r, y = cy + oy * r, R = rr * r;
      for (let i = 4; i >= 1; i--) b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1((R * i) / 4)}" style="fill:${i % 2 ? BONE : mx(BONE, 'series-2', 70)};stroke:${BONE_D};stroke-width:1;opacity:.95"/>`;
      b += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R * 0.14)}" style="fill:${mx('series-6', INK, 60)}"/>`;
      for (let i = 0; i < 6; i++) { const a2 = i * 1.05 + q(), rr2 = R * (0.4 + (i % 2) * 0.3); b += `<ellipse cx="${n1(x + Math.cos(a2) * rr2)}" cy="${n1(y + Math.sin(a2) * rr2)}" rx="3" ry="1.6" transform="rotate(${n1((a2 * 180) / Math.PI + 90)} ${n1(x + Math.cos(a2) * rr2)} ${n1(y + Math.sin(a2) * rr2)})" style="fill:${BONE_D}"/>`; }
    }
  } else if (kind === 'cart') {
    b += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" style="fill:${mx(CART, 'elev-peak', 80)}"/><rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" style="fill:${CART_D};opacity:.08;filter:url(#cw-grain)"/>`;
    for (let i = 0; i < 9; i++) {
      const x = cx + (q() - 0.5) * r * 1.6, y = cy + (q() - 0.5) * r * 1.6, two = q() > 0.5;
      b += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(r * 0.16)}" ry="${n1(r * 0.12)}" style="fill:${mx(CART, 'elev-peak', 50)};stroke:${CART_D};stroke-width:1.4"/>`;
      b += `<circle cx="${n1(x - (two ? 3 : 0))}" cy="${n1(y)}" r="${n1(r * 0.06)}" style="fill:${mx('series-5', INK, 60)}"/>` + (two ? `<circle cx="${n1(x + 4)}" cy="${n1(y + 1)}" r="${n1(r * 0.05)}" style="fill:${mx('series-5', INK, 60)}"/>` : '');
    }
  } else {
    const col = kind === 'tendon' ? TEND : LIGA, dk = kind === 'tendon' ? TEND_D : LIGA_D;
    b += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" style="fill:${mx(col, 'elev-peak', 70)}"/>`;
    for (let y = cy - r; y < cy + r; y += 7) {
      let d = `M${cx - r} ${n1(y)}`;
      for (let x = cx - r; x <= cx + r; x += 12) d += `Q${n1(x + 6)} ${n1(y + (kind === 'liga' ? 3 : 1.6) * ((x / 12) % 2 ? 1 : -1))} ${n1(x + 12)} ${n1(y)}`;
      b += `<path d="${d}" style="fill:none;stroke:${dk};stroke-width:1.6;opacity:.6"/>`;
    }
    for (let i = 0; i < 8; i++) b += `<ellipse cx="${n1(cx + (q() - 0.5) * r * 1.6)}" cy="${n1(cy - r + 3.5 + Math.floor(q() * (2 * r / 7)) * 7)}" rx="${n1(r * 0.13)}" ry="2.4" style="fill:${mx('series-5', INK, 64)}"/>`;
  }
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r + 9}" style="fill:${mx('strata-6', 'sea-deep', 70)}"/><g clip-path="url(#${id})">${b}<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:url(#cw-vign);opacity:.6"/></g>`
    + `<circle cx="${cx}" cy="${cy}" r="${r + 3}" style="fill:none;stroke:${mx('strata-5', W_, 60)};stroke-width:3;opacity:.7"/>`;
}

export class KneeJoint extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5)];
  static WIDTH = 640;
  static HEIGHT = 540;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 640;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Side view of the knee: the thigh bone above, the shin bone and the thin fibula below, the kneecap in front. Smooth cartilage caps cover the bone ends. The thigh muscle joins the kneecap and the shin bone through a tendon, muscle to bone. Ligaments join bone to bone: one on the outer side from the thigh bone to the fibula and one crossing inside the joint. A round close-up shows each tissue under a microscope: bone in rings, cartilage cells in a jelly-like matrix, tendon and ligament as wavy bundles of fibres. On the ligament step the lower leg straightens and stops at its limit.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Connective tissues at the knee', chips: CHIPS, onChange: () => this.repaint() });
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.repaint(); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }' + BODY_CSS; }
  stageHeight(st) { return st.portrait ? 500 : 430; }
  enter() { this.tl.reset(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    const held = this.tl.any(), lit = held ? this.tl.lit() : LIT[step] ?? [], any = lit.length > 0;
    let s = field(st, 'kj', { a: 1, b: 4, k: 9 });
    // the knee fills the stage (thigh and shin cropped); the close-up sits in its own column (landscape) or band (portrait)
    const bandH = P ? 96 : 0, k = (H - bandH - 8) / 330, kx = P ? W * 0.46 : W * 0.43, tx = kx - 150 * k, ty = 4 - 66 * k;
    const M = (p) => [tx + p[0] * k, ty + p[1] * k];
    s += `<g transform="translate(${n1(tx)} ${n1(ty)}) scale(${n1(k * 1000) / 1000})">${kneeArt(lit, any, { swing: step === 4 && !held })}</g>`;
    const L = (t, at, y, o = {}) => { const x = o.left ? (P ? 6 : 14) : W - (P ? 6 : 12); return leader(x, y, at[0], at[1], o.col ?? INK, 2.4) + tag(x, y, t, { size: fs, rim: o.rim, anchor: o.left ? 'start' : 'end', display: o.display }); };
    const show = (id) => lit.includes(id) || !any, Y = (u) => 8 + u * (H - bandH - 16);
    const rows = [];
    if (!any) rows.push(['thigh muscle', M([192, 96]), 0.05, {}]);
    if (show('bone')) rows.push(['thigh bone', M([150, 110]), 0.17, { rim: BONE_D }], ['kneecap', M([210, 168]), 0.32, { rim: BONE_D }], ['shin bone', M([160, 360]), 0.95, { rim: BONE_D }]);
    if (show('cart')) rows.push(['cartilage', M([176, 222]), 0.47, { rim: CART_D }]);
    if (show('liga')) rows.push([any ? 'ligament: bone to bone' : 'ligament', M([114, 236]), P ? 0.86 : 0.71, { rim: LIGA_D, left: true }]);
    if (show('tendon')) rows.push([any ? 'tendon: muscle to bone' : 'tendon', M([199, 258]), 0.68, { rim: TEND_D }]);
    for (const [t, at, u, o] of rows) s += L(t, at, Y(u), o);
    const one1 = lit.length === 1 ? lit[0] : null;
    if (one1) {
      const cap = { bone: ['hard, rigid', 'calcium and phosphorus'], cart: ['jelly-like matrix', 'cushion'], tendon: ['strong, flexible', 'muscle to bone'], liga: ['tough band', 'bone to bone'] }[one1];
      if (P) {
        const r = 40, cx = 56, cy = H - bandH / 2;
        s += inset(one1, cx, cy, r) + tag(cx + r + 18, cy - 18, cap[0], { size: 14, anchor: 'start' }) + tag(cx + r + 18, cy + 18, cap[1], { size: 14, anchor: 'start', display: true });
      } else {
        const r = 74, cx = 104, cy = 120;
        s += inset(one1, cx, cy, r) + tag(cx, cy + r + 30, cap[0], { size: 14 }) + tag(cx, cy + r + 62, cap[1], { size: 14, display: true });
      }
      if (one1 === 'liga' && step === 4 && !held) s += tag(P ? W / 2 : 104, P ? H - bandH - 18 : 360, 'stops at its limit', { size: fs });
    }
    return { svg: cwFrame(st, 'kj', s) };
  }
}
