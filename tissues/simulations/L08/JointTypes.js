// JointTypes - blk-l08-s7 (5 beats: ball, hinge, pivot, fixed, sum). Fig 3.16, each joint moving in its true range.
// Ball and socket: the round head of the humerus in the shallow hollow of the shoulder bone, the collarbone beside it;
// the arm swings sideways and up, forward (it shortens as it points at you) and round a full circle. Hinge: the elbow
// bends and straightens in one plane only; the knee, with its kneecap, the same. Pivot: the skull on the top of the
// backbone; seen from above, the skull turns side to side round the peg of the second neck bone. Fixed: the skull
// bones joined along wavy lines; nothing moves. Sum: all four at once.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, mx, n1 } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, field, tapered, tube } from '../shared/BodyArt.js';
import { boneForm, muscleForm, fibreBand, armGeom, armSvg, ARM, INK, W_, BONE, BONE_D, CART, CART_D, TEND, TEND_D, LIGA, LIGA_D } from '../shared/LimbArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const JOINT = mx('series-1', 'strata-6', 70), SUT = mx('series-6', 'strata-6', 70);
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** SMIL rotation about (cx, cy) through the angles in vals (degrees), looping. Nothing under reduced motion. */
function spin(cx, cy, vals, dur, extra = '') {
  if (still()) return '';
  const v = vals.map((a) => `${a} ${cx} ${cy}`).join(';'), ks = vals.slice(1).map(() => '.42 0 .58 1').join(';');
  return `<animateTransform attributeName="transform" type="rotate" values="${v}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines="${ks}"${extra}/>`;
}
const arc = (cx, cy, r, a0, a1) => { const p = (a) => [cx + Math.sin(a) * r, cy + Math.cos(a) * r]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${n1(x0)} ${n1(y0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 0 : 1} ${n1(x1)} ${n1(y1)}`; };
const dashed = (d, col = INK, w = 2.6) => `<path d="${d}" style="fill:none;stroke:${col};stroke-width:${w};stroke-dasharray:7 6;stroke-linecap:round;opacity:.75"/>`;
const head = (x, y, ang, col = INK) => `<path d="M${n1(x - Math.cos(ang - 0.55) * 12)} ${n1(y - Math.sin(ang - 0.55) * 12)}L${n1(x)} ${n1(y)}L${n1(x - Math.cos(ang + 0.55) * 12)} ${n1(y - Math.sin(ang + 0.55) * 12)}" style="fill:none;stroke:${col};stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round"/>`;

// -- the four joints, each in its own box [x0, y0, w, h]; pts: where labels point -----------------------------
// Ball and socket, front view of the right shoulder. Ball centre (215, 118), arm 176 long.
const BALL = { box: [-10, -78, 420, 400], zoom: [120, 40, 170, 280], pts: { ball: [222, 120], socket: [200, 116], collar: [110, 84], arm: [226, 230] } };
function ballArt() {
  let s = '';
  // shoulder blade behind the ribs: a wide plate whose outer corner holds the shallow hollow (glenoid)
  s += `<g style="opacity:.8">${boneForm('M112 94C150 82 200 88 208 102L206 136C196 182 176 232 146 266C126 236 108 160 112 94Z', { line: 'M128 108L138 230', lineW: 2 })}</g>`;
  // ribs and the breastbone in front of it
  for (let i = 0; i < 6; i++) { const y = 112 + i * 30; s += tube(`M38 ${y}C80 ${y - 18} 140 ${y - 6} 176 ${y + 30 + i * 4}`, BONE, 9); }
  s += boneForm('M18 92C26 86 40 86 44 94L42 286C36 294 24 294 20 286Z', { line: 'M26 100L26 280', lineW: 2 });
  s += `<path d="M206 100Q214 118 205 138" style="fill:none;stroke:${CART_D};stroke-width:6;stroke-linecap:round"/><path d="M206 100Q214 118 205 138" style="fill:none;stroke:${CART};stroke-width:3;stroke-linecap:round"/>`;
  // collarbone: S-curve from the breastbone to the top of the shoulder
  s += boneForm(tapered([[34, 98], [80, 86], [130, 92], [176, 80], [212, 86]], [9, 7, 7, 7, 9]), { line: 'M44 94Q100 82 200 82', lineW: 2 });
  // acromion over the ball
  s += boneForm('M180 76C206 70 236 74 240 90C236 98 222 100 206 96Z');
  // the arm: humerus with its round head, elbow end, forearm bones below; swings round the ball
  const hum = tapered([[226, 132], [229, 180], [230, 240], [230, 282]], [10, 9, 10, 17]);
  const arm = `<circle cx="222" cy="120" r="21" style="fill:${BONE};stroke:${BONE_D};stroke-width:2.4"/><path d="M206 108A20 20 0 0 1 228 100" style="fill:none;stroke:${W_};stroke-width:3.4;opacity:.7"/>`
    + boneForm(hum, { ends: [[230, 276, 10]], line: 'M225 140L226 270', lineW: 2.4 })
    + boneForm(tapered([[222, 286], [222, 340], [222, 380]], [6, 5, 5]), {}) + boneForm(tapered([[238, 284], [238, 340], [236, 380]], [7, 5, 6]), {});
  s += `<g>${spin(222, 120, [0, -95, -168, -95, 0, 0, 0, 35, 0], 8.5)}${arm}</g>`;
  // ring: the path of the elbow round the ball
  s += dashed(`M${222 + 160} 120A160 160 0 1 1 ${222 + 160} 119.5`, JOINT, 2.4) + head(222 + 160, 126, Math.PI / 2, JOINT);
  return s;
}
// Hinge: side view of the elbow (bones only), forearm bends forwards from straight to fully bent, one plane.
// Hinge: side view of the arm (skin, humerus, radius, ulna, hand), the forearm bends forwards from straight to fully
// bent and back, one plane. Knee: thigh bone, kneecap, shin bone and fibula; the lower leg bends backwards.
const HINGE = { box: [-70, -50, 270, 380], zoom: [-62, 40, 150, 250], pts: { joint: [0, 140] } };
const KNEE = { box: [40, 10, 220, 430], pts: { cap: [208, 172] } };
const FEMUR = 'M128 -10L170 -10C172 60 172 120 176 160C190 172 198 196 190 212C180 226 156 226 146 220C134 228 112 226 106 210C100 192 112 170 124 160C128 120 128 60 128 -10Z';
const TIBIA = 'M104 232C120 226 180 226 196 232C200 244 196 258 190 264C192 272 186 280 180 284C174 330 172 380 172 420L140 420C140 380 136 330 128 288C116 276 104 262 104 232Z';
const FIBULA = 'M100 252C112 246 122 250 122 260C118 280 116 340 118 420L106 420C106 340 104 280 98 264C96 258 96 254 100 252Z';
const PATELLA = 'M200 140C216 140 222 162 218 182C214 198 204 204 198 198C190 190 188 160 192 148C194 142 196 140 200 140Z';
function hingeArt(knee = false) {
  if (!knee) {
    const g = armGeom(0), art = armSvg(g, { trunk: false, dim: (id) => (id === 'biceps' || id === 'triceps' || id === 'tendon' ? 0 : 1) }).svg;
    const anim = spin(0, ARM.L1, [-4, -140, -4], 4.2);
    return art.split(`<g transform="rotate(0 0 ${ARM.L1})">`).join(`<g transform="rotate(0 0 ${ARM.L1})">${anim}`) + dashed(arc(0, ARM.L1, 150, 0.06, 2.46), JOINT);
  }
  // the knee from the side, front to the right: thigh bone, kneecap held by the thigh-muscle tendon above and the
  // kneecap ligament below to the front of the shin bone; a side ligament from thigh bone to fibula. The lower leg
  // bends backwards only: the dashed arc shows the one direction. Soft fade at the top and the bottom (a close-up).
  const id = 'jt-kf', KC = [150, 216];
  let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:black"/><stop offset=".1" style="stop-color:white"/><stop offset=".9" style="stop-color:white"/><stop offset="1" style="stop-color:black"/></linearGradient><mask id="${id}m" maskUnits="userSpaceOnUse" x="20" y="0" width="260" height="440"><rect x="20" y="0" width="260" height="440" style="fill:url(#${id})"/></mask></defs><g mask="url(#${id}m)">`;
  s += muscleForm([[168, -10], [184, 40], [192, 90], [196, 118]], [14, 22, 18, 8]);
  s += muscleForm([[118, -10], [110, 50], [114, 120], [120, 168]], [12, 20, 16, 6], { col: mx('series-6', 'series-4', 50) });
  s += boneForm(FEMUR, { ends: [[150, 196, 26]], line: 'M140 20L142 150' });
  s += boneForm(TIBIA, { ends: [[150, 250, 26]], line: 'M150 300L156 410' }) + boneForm(FIBULA, { ends: [[110, 258, 8]] });
  s += `<path d="M108 233C124 226 178 226 194 233" style="fill:none;stroke:${CART};stroke-width:6;stroke-linecap:round"/>`;
  s += `<path d="M106 204C108 222 130 230 148 224C166 230 188 224 192 206" style="fill:none;stroke:${CART};stroke-width:6;stroke-linecap:round"/>`;
  s += fibreBand([126, 190], [110, 258], 6, 5, LIGA, LIGA_D, { fan: true });
  s += fibreBand([194, 108], [206, 146], 9, 8, TEND, TEND_D);
  s += boneForm(PATELLA, {}) + `<path d="M192 152Q188 172 196 196" style="fill:none;stroke:${CART};stroke-width:4;stroke-linecap:round"/>`;
  s += fibreBand([206, 198], [194, 268], 8, 6, TEND, TEND_D, { fan: true });
  s += `</g>` + dashed(arc(KC[0], KC[1], 150, 0.1, -1.7), JOINT) + head(KC[0] + Math.sin(-1.7) * 150, KC[1] + Math.cos(-1.7) * 150, Math.PI * 0.42, JOINT);
  return s;
}
// Skull, side view facing right, about 250 by 220.
const SKULL = 'M40 140C22 90 52 20 122 14C184 10 222 42 228 92L232 102C236 108 230 112 236 120L246 134C240 140 236 146 236 152C240 160 240 168 236 174L200 178C188 170 162 160 150 152L130 152C118 160 90 168 60 162C48 158 41 150 40 140Z';
const JAW = 'M236 180C242 196 236 210 222 214L160 212C140 208 128 200 126 186L124 152C126 142 134 140 138 146L146 160C160 170 186 178 200 182Z';
const zig = (pts, amp = 4, step = 7) => {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L, m = Math.max(2, Math.round(L / step));
    for (let j = i ? 1 : 0; j <= m; j++) { const t = j / m, a = (j % 2 ? amp : -amp) * (j === 0 || j === m ? 0 : 1); d += `${d ? 'L' : 'M'}${n1(x0 + (x1 - x0) * t + nx * a)} ${n1(y0 + (y1 - y0) * t + ny * a)}`; }
  }
  return d;
};
const SUTURES = [zig([[146, 14], [150, 50], [158, 100]]), zig([[92, 124], [110, 96], [140, 88], [176, 112]], 3, 6), zig([[70, 36], [56, 80], [54, 128]])];
function skull(o = {}) {
  let s = boneForm(SKULL, { ends: [[100, 70, 40], [170, 60, 30]], line: 'M70 50Q120 22 190 40', lineW: 3 });
  s += `<ellipse cx="205" cy="114" rx="17" ry="15" style="fill:${mx(BONE, INK, 62)};stroke:${BONE_D};stroke-width:2"/><ellipse cx="208" cy="118" rx="11" ry="9" style="fill:${mx(BONE, INK, 46)}"/>`;
  s += `<path d="M232 128L242 146L230 150Z" style="fill:${mx(BONE, INK, 58)}"/>`;
  s += `<path d="M190 134Q166 128 140 138" style="fill:none;stroke:${BONE_D};stroke-width:7;stroke-linecap:round;opacity:.5"/><circle cx="128" cy="138" r="6" style="fill:${mx(BONE, INK, 50)};stroke:${BONE_D};stroke-width:1.6"/>`;
  s += boneForm('M128 146C150 142 200 146 232 150L236 176L200 180C180 176 160 168 146 160L132 156Z', {});
  s += boneForm(JAW, {});
  for (let i = 0; i < 6; i++) s += `<rect x="${200 + i * 6}" y="182" width="5" height="8" rx="2" style="fill:${W_};stroke:${BONE_D};stroke-width:1"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${200 + i * 6}" y="${i < 3 ? 173 : 174}" width="5" height="9" rx="2" style="fill:${W_};stroke:${BONE_D};stroke-width:1"/>`;
  const sw = o.lit ? 4.4 : 2.4, col = o.lit ? SUT : BONE_D;
  for (const d of SUTURES) s += `<path d="${d}" style="fill:none;stroke:${col};stroke-width:${sw};stroke-linejoin:round"/>`;
  return s;
}
// Neck bones under the skull: atlas, axis with its peg, three more, discs between.
function neck() {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const y = 166 + i * 30, x = 66 + i * 3;
    s += boneForm(`M${x} ${y}h40q8 0 8 8v10q0 8 -8 8h-40q-8 0 -8 -8v-10q0 -8 8 -8Z`, {}) + boneForm(`M${x - 6} ${y + 8}l-30 6l-2 8l32 -2Z`, {});
    if (i) s += `<rect x="${x + 2}" y="${y - 5}" width="38" height="5" rx="2" style="fill:${CART};stroke:${CART_D};stroke-width:1.2"/>`;
  }
  return s;
}
const PIVOT = { box: [0, 0, 270, 340], zoom: [10, 70, 170, 250], pts: { joint: [88, 164] } };
const FIXED = { box: [20, 0, 240, 226], zoom: [30, 0, 200, 170], pts: { sut: [150, 50], sut2: [62, 90], sut3: [140, 92] } };
// Top view: the skull seen from above turning on the peg in the ring of the top neck bone.
function topView(cx, cy, r) {
  const ring = `<circle cx="${cx}" cy="${cy}" r="${r * 0.36}" style="fill:none;stroke:${BONE_D};stroke-width:${n1(r * 0.16)}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.36}" style="fill:none;stroke:${BONE};stroke-width:${n1(r * 0.11)}"/>`
    + `<circle cx="${cx}" cy="${n1(cy - r * 0.12)}" r="${n1(r * 0.12)}" style="fill:${CART};stroke:${CART_D};stroke-width:2"/>`;
  const sk = `<path d="M${cx} ${n1(cy - r)}C${n1(cx + r * 0.82)} ${n1(cy - r)} ${n1(cx + r * 0.86)} ${n1(cy + r * 0.9)} ${cx} ${n1(cy + r * 0.92)}C${n1(cx - r * 0.86)} ${n1(cy + r * 0.9)} ${n1(cx - r * 0.82)} ${n1(cy - r)} ${cx} ${n1(cy - r)}Z" style="fill:${BONE};opacity:.55;stroke:${BONE_D};stroke-width:2.4"/>`
    + `<path d="M${n1(cx - r * 0.2)} ${n1(cy - r * 0.96)}L${cx} ${n1(cy - r * 1.14)}L${n1(cx + r * 0.2)} ${n1(cy - r * 0.96)}" style="fill:${BONE};stroke:${BONE_D};stroke-width:2.4;stroke-linejoin:round"/>`
    + `<path d="M${cx} ${n1(cy - r * 0.9)}V${n1(cy + r * 0.8)}" style="fill:none;stroke:${SUT};stroke-width:2;opacity:.6"/>`;
  return ring + `<g>${spin(cx, cy, [0, -40, 0, 40, 0], 4.4)}${sk}</g>` + dashed(`M${n1(cx - Math.sin(0.7) * r * 1.3)} ${n1(cy - Math.cos(0.7) * r * 1.3)}A${n1(r * 1.3)} ${n1(r * 1.3)} 0 0 1 ${n1(cx + Math.sin(0.7) * r * 1.3)} ${n1(cy - Math.cos(0.7) * r * 1.3)}`, JOINT);
}

export class JointTypes extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 640;
  static HEIGHT = 470;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 480;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Four kinds of joint moving. Shoulder: the round head of the upper arm bone in a shallow hollow of the shoulder bone, the collarbone beside it; the arm swings sideways, up, forwards and round in a circle. Elbow and knee: hinge joints that bend and straighten in one direction only; the kneecap sits in front of the knee. Pivot: the skull sits on the top of the backbone and turns from side to side round a peg. Fixed: the bones of the skull are joined along wavy lines and do not move.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }' + BODY_CSS; }
  stageHeight(st) { return st.portrait ? 440 : 430; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    let back = field(st, 'jt', { a: 1, b: 5, k: 9 });
    // fit a box into a rect; returns the group and a point mapper
    const fit = (spec, art, x, y, w, h) => {
      const [bx, by, bw, bh] = spec.zoomed ?? spec.box, k = Math.min(w / bw, h / bh), ox = x + (w - bw * k) / 2 - bx * k, oy = y + (h - bh * k) / 2 - by * k;
      return { g: `<g transform="translate(${n1(ox)} ${n1(oy)}) scale(${n1(k * 1000) / 1000})">${art}</g>`, M: (p) => [ox + p[0] * k, oy + p[1] * k], k };
    };
    const L = (t, at, x, y, o = {}) => leader(x, y, at[0], at[1], o.col ?? INK, 2.4) + tag(x, y, t, { size: o.size ?? fs, rim: o.rim, anchor: o.anchor, display: o.display });
    let s = '';
    if (step === 0) {
      const f = fit(BALL, ballArt(), P ? 4 : 120, 10, P ? W - 8 : 400, H - 20);
      s += f.g;
      s += L('ball', f.M([224, 122]), P ? W - 10 : W - 20, P ? 40 : 60, { anchor: 'end', rim: JOINT });
      s += L('shallow hollow', f.M([209, 132]), P ? W - 10 : W - 20, P ? 84 : 110, { anchor: 'end', rim: CART_D });
      s += L('collarbone', f.M([90, 88]), P ? 10 : 20, P ? 40 : 60, { anchor: 'start', rim: BONE_D });
      s += tag(P ? W / 2 : W - 20, H - (P ? 28 : 40), 'forward, back, sideways, circle', { size: fs, rim: JOINT, anchor: P ? undefined : 'end' });
    } else if (step === 1) {
      const a = fit(HINGE, hingeArt(false), P ? 0 : 30, P ? 20 : 20, P ? W * 0.55 : 330, H - (P ? 70 : 60));
      const b = fit(KNEE, hingeArt(true), P ? W * 0.5 : 340, P ? 20 : 20, P ? W * 0.5 : 280, H - (P ? 70 : 60));
      s += a.g + b.g;
      s += tag(a.M([0, 0])[0], H - (P ? 26 : 30), 'elbow', { size: fs + 1, display: true }) + tag(b.M([150, 0])[0], H - (P ? 26 : 30), 'knee', { size: fs + 1, display: true });
      s += L('kneecap', b.M([206, 168]), P ? W - 8 : W - 20, P ? 30 : 46, { anchor: 'end', rim: BONE_D });
      s += tag(P ? W / 2 : W / 2, P ? 30 : 30, 'one direction only', { size: fs, rim: JOINT, anchor: P ? 'end' : undefined });
    } else if (step === 2) {
      const a = fit(PIVOT, skull() + neck(), P ? 0 : 20, 10, P ? W * 0.6 : 340, H - 20);
      s += a.g;
      const tcx = P ? W * 0.78 : 500, tcy = P ? 120 : 180, tr = P ? 46 : 74;
      s += `<circle cx="${n1(tcx)}" cy="${n1(tcy)}" r="${n1(tr * 1.55)}" style="fill:${mx('series-1', 'elev-peak', 14)};stroke:${mx('series-1', INK, 50)};stroke-width:2;opacity:.9"/>` + topView(tcx, tcy, tr);
      s += tag(tcx, tcy + tr * 1.55 + 22, 'seen from above', { size: 14 });
      s += L('where the skull meets the backbone', a.M([88, 166]), P ? W / 2 : W - 20, H - (P ? 28 : 40), { anchor: P ? undefined : 'end', rim: JOINT, size: fs });
    } else if (step === 3) {
      const a = fit(FIXED, skull({ lit: true }), P ? 10 : 90, P ? 30 : 20, P ? W - 20 : 460, H - (P ? 90 : 70));
      s += a.g;
      s += L('fixed joints', a.M([148, 40]), P ? W - 10 : W - 30, P ? 30 : 40, { anchor: 'end', rim: SUT });
      s += leader(P ? W - 60 : W - 90, P ? 30 : 40, ...a.M([60, 70]), SUT, 2.4) + leader(P ? W - 60 : W - 90, P ? 30 : 40, ...a.M([136, 92]), SUT, 2.4);
      s += tag(P ? W / 2 : 150, H - (P ? 26 : 34), 'no movement', { size: fs + 1, display: true });
    } else {
      const cw = P ? W / 2 : W / 4, ch = P ? (H - 20) / 2 : H - 60;
      const cells = [[BALL, ballArt(), 'ball and socket'], [HINGE, hingeArt(false), 'hinge'], [PIVOT, skull() + neck(), 'pivot'], [FIXED, skull({ lit: true }), 'fixed']];
      cells.forEach(([spec, art, t], i) => {
        const x = P ? (i % 2) * cw : i * cw, y = P ? Math.floor(i / 2) * ch + 4 : 20;
        s += `<rect x="${n1(x + 4)}" y="${n1(y + 2)}" width="${n1(cw - 8)}" height="${n1(ch - 4)}" rx="14" style="fill:${mx('elev-peak', 'series-1', 70)};opacity:.5;stroke:${mx('series-1', INK, 40)};stroke-width:2"/>`;
        const f = fit({ ...spec, zoomed: spec.zoom }, art, x + 8, y + 8, cw - 16, ch - 46);
        s += `<defs><clipPath id="jt-c${i}"><rect x="${n1(x + 6)}" y="${n1(y + 4)}" width="${n1(cw - 12)}" height="${n1(ch - 40)}" rx="12"/></clipPath></defs><g clip-path="url(#jt-c${i})">${f.g}</g>` + tag(x + cw / 2, y + ch - 22, t, { size: 14, display: true });
        if (i === 2) { const tr = P ? 18 : 24, tcx = x + cw - tr * 1.55 - 10, tcy = y + ch - 46 - tr * 1.55 - 6; s += `<circle cx="${n1(tcx)}" cy="${n1(tcy)}" r="${n1(tr * 1.55)}" style="fill:${mx('series-1', 'elev-peak', 14)};stroke:${mx('series-1', INK, 50)};stroke-width:2"/>` + topView(tcx, tcy, tr); }
      });
    }
    return { svg: cwFrame(st, 'jt', `<g>${back}</g>${s}`) };
  }
}
