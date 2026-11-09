// NeuronSignal - blk-l07-s14 (4 beats: neuron, parts, terminals, path). Fig 3.14: a neuron with its cell body and
// nucleus, branching dendrites, one long axon and branched axon terminals resting on a skeletal muscle fibre.
// Path: a signal enters at a dendrite, passes the cell body, runs along the axon and leaves at the terminals into the
// muscle, which twitches. One way only; the chevrons on the axon point to the terminals. A small switch-and-lamp
// inset compares the long axon to a wire. Never wired to the heart.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapMin, TAP_MIN_CSS } from '../shared/TapMin.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, depthField, nucleus, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, tube, form, tapered } from '../shared/BodyArt.js';
import { INK, W_, MUS, MUS_D, MUS_L } from '../shared/LimbArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const NV = mx('series-2', 'series-8', 62), NV_D = mx(NV, INK, 52), NV_L = mx(NV, W_, 50);
const SIG = mx('series-1', 'elev-peak', 70), SIG_D = mx('series-1', INK, 56);
const LIT = { 0: ['den', 'body', 'axon', 'term', 'mus'], 1: ['den', 'body', 'axon'], 2: ['term', 'mus'], 3: ['den', 'body', 'axon', 'term', 'mus'] };
const bez = (p, u) => { const v = 1 - u; return [0, 1].map((a) => v * v * v * p[0][a] + 3 * v * v * u * p[1][a] + 3 * v * u * u * p[2][a] + u * u * u * p[3][a]); };

/** The neuron in stage coords. g: { B body centre, R body radius, ax [4 bezier points ending at the terminal hub], away (dendrite direction, radians), mus {x, y, w, h, vertical} } */
function neuronArt(g, lit) {
  const q = rnd(9), on = (id) => lit.includes(id), op = (id) => (on(id) ? 1 : 0.3);
  const den = [], term = [];
  const branch = (x, y, a, len, w, depth, out, tip) => {
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, c = [x + Math.cos(a + (q() - 0.5) * 0.6) * len * 0.55, y + Math.sin(a + (q() - 0.5) * 0.6) * len * 0.55];
    const qp = (u) => [(1 - u) * (1 - u) * x + 2 * (1 - u) * u * c[0] + u * u * x1, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * c[1] + u * u * y1];
    const us = [0, 0.25, 0.5, 0.75, 1], w1 = depth > 0 ? w * 0.64 : w * 0.18;
    out.push({ d: `M${n1(x)} ${n1(y)}Q${n1(c[0])} ${n1(c[1])} ${n1(x1)} ${n1(y1)}`, w, end: [x1, y1], depth, shape: tapered(us.map(qp), us.map((u) => Math.max(0.8, (w + (w1 - w) * u) / 2))) });
    if (depth > 0) for (const da of [-0.48, 0.42]) branch(x1, y1, a + da + (q() - 0.5) * 0.3, len * 0.68, w * 0.64, depth - 1, out, tip);
  };
  const { B, R } = g;
  for (let i = 0; i < 6; i++) { const a = g.away + (i - 2.5) * 0.52 + (q() - 0.5) * 0.2; branch(B[0] + Math.cos(a) * R * 0.7, B[1] + Math.sin(a) * R * 0.7, a, R * 1.5, R * 0.32, 2, den); }
  const T0 = g.ax[3], ta = Math.atan2(T0[1] - g.ax[2][1], T0[0] - g.ax[2][0]);
  for (const off of [-0.75, -0.25, 0.25, 0.75]) {
    const m0 = g.mus, end = m0.vertical ? [m0.x + 3, T0[1] + off * R * 2.6] : [T0[0] + off * R * 2.4, m0.y + 3];
    const c = m0.vertical ? [T0[0] + (end[0] - T0[0]) * 0.2, end[1]] : [end[0], T0[1] + (end[1] - T0[1]) * 0.2];
    term.push({ d: `M${n1(T0[0])} ${n1(T0[1])}Q${n1(c[0])} ${n1(c[1])} ${n1(end[0])} ${n1(end[1])}`, w: R * 0.14, end, depth: 0 });
  }
  let s = '';
  // dendrites
  let d1 = '';
  // each branch tapers from the cell body out to fine tips: dark edge, body, a lit line along it
  for (const p of den) d1 += `<path d="${p.shape}" style="fill:${NV_D}"/>`;
  for (const p of den) d1 += `<path d="${p.shape}" style="fill:${NV};stroke:${NV_D};stroke-width:1.2;stroke-linejoin:round"/>`;
  for (const p of den) if (p.w > 3) d1 += `<path d="${p.d}" style="fill:none;stroke:${NV_L};stroke-width:${n1(p.w * 0.22)};stroke-linecap:round;opacity:.7;transform:translate(-${n1(p.w * 0.1)}px,-${n1(p.w * 0.12)}px)"/>`;
  s += `<g style="opacity:${op('den')}">${d1}</g>`;
  // axon: a hillock from the body, then a steady fibre
  const ax = `M${n1(g.ax[0][0])} ${n1(g.ax[0][1])}C${n1(g.ax[1][0])} ${n1(g.ax[1][1])} ${n1(g.ax[2][0])} ${n1(g.ax[2][1])} ${n1(T0[0])} ${n1(T0[1])}`;
  // a thin axon core wrapped in myelin sheath segments, with bare gaps (nodes) between them; chevrons at the nodes
  let a1 = tube(ax, NV, R * 0.16);
  const NODES = [0.06, 0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9], gap = 0.014, MY = mx('gold', 'elev-peak', 26), MY_D = mx(MY, INK, 62);
  for (let i = 0; i < NODES.length - 1; i++) {
    const us = [], ws = [];
    for (let j = 0; j <= 8; j++) { const u = NODES[i] + gap + (NODES[i + 1] - NODES[i] - 2 * gap) * (j / 8); us.push(bez(g.ax, u)); ws.push(R * 0.24 * Math.sin(Math.PI * (0.18 + 0.64 * j / 8))); }
    const sh = tapered(us, ws);
    a1 += form(sh, MY, { ao: R * 0.1, rim: 1.6, rimCol: MY_D, hi: 60, lo: 40, inner: `<path d="M${us.map((p) => `${n1(p[0])} ${n1(p[1] - R * 0.08)}`).join('L')}" style="fill:none;stroke:${W_};stroke-width:${n1(R * 0.06)};stroke-linecap:round;opacity:.7"/>` });
  }
  for (const u of NODES.slice(1, -1)) { const p = bez(g.ax, u), p2 = bez(g.ax, u + 0.01), ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]), c = 7, ox = Math.cos(ang) * 4, oy = Math.sin(ang) * 4, nx = -Math.sin(ang) * R * 0.42, ny = Math.cos(ang) * R * 0.42; a1 += `<path d="M${n1(p[0] + nx - Math.cos(ang - 0.7) * c + ox)} ${n1(p[1] + ny - Math.sin(ang - 0.7) * c + oy)}L${n1(p[0] + nx + ox)} ${n1(p[1] + ny + oy)}L${n1(p[0] + nx - Math.cos(ang + 0.7) * c + ox)} ${n1(p[1] + ny - Math.sin(ang + 0.7) * c + oy)}" style="fill:none;stroke:${NV_D};stroke-width:3;stroke-linecap:round;stroke-linejoin:round"/>`; }
  s += `<g style="opacity:${op('axon')}">${a1}</g>`;
  // two or three skeletal muscle fibres side by side, rounded ends in frame: striated, nuclei at the edge, lit side
  const m = g.mus, NF = m.n ?? 3, fw = (m.vertical ? m.w : m.h) / NF;
  let mf = '';
  for (let f = NF - 1; f >= 0; f--) {
    const fx = m.vertical ? m.x + f * fw : m.x, fy = m.vertical ? m.y + f * 6 : m.y + f * fw, w = m.vertical ? fw - 2 : m.w - f * 8, h = m.vertical ? m.h - f * 12 : fw - 2, rr = Math.min(w, h) / 2;
    const d = `M${n1(fx + rr)} ${n1(fy)}H${n1(fx + w - rr)}Q${n1(fx + w)} ${n1(fy)} ${n1(fx + w)} ${n1(fy + rr)}V${n1(fy + h - rr)}Q${n1(fx + w)} ${n1(fy + h)} ${n1(fx + w - rr)} ${n1(fy + h)}H${n1(fx + rr)}Q${n1(fx)} ${n1(fy + h)} ${n1(fx)} ${n1(fy + h - rr)}V${n1(fy + rr)}Q${n1(fx)} ${n1(fy)} ${n1(fx + rr)} ${n1(fy)}Z`;
    let t = '';
    if (m.vertical) for (let y = fy + 8; y < fy + h - 4; y += 8) t += `<rect x="${n1(fx)}" y="${n1(y)}" width="${n1(w)}" height="3.4" style="fill:${MUS_D};opacity:.36"/>`;
    else for (let x = fx + 8; x < fx + w - 4; x += 8) t += `<rect x="${n1(x)}" y="${n1(fy)}" width="3.4" height="${n1(h)}" style="fill:${MUS_D};opacity:.36"/>`;
    for (let i = 0; i < 5; i++) t += m.vertical ? `<ellipse cx="${n1(fx + (i % 2 ? w - 5 : 5))}" cy="${n1(fy + 34 + i * (h - 68) / 4)}" rx="3.2" ry="9" style="fill:url(#cw-nuc) ${INK}"/>` : `<ellipse cx="${n1(fx + 34 + i * (w - 68) / 4)}" cy="${n1(fy + (i % 2 ? h - 5 : 5))}" rx="9" ry="3.2" style="fill:url(#cw-nuc) ${INK}"/>`;
    t += `<path d="${m.vertical ? `M${n1(fx + w * 0.3)} ${n1(fy + 12)}V${n1(fy + h - 12)}` : `M${n1(fx + 12)} ${n1(fy + h * 0.3)}H${n1(fx + w - 12)}`}" style="fill:none;stroke:${MUS_L};stroke-width:3;opacity:.55;stroke-linecap:round"/>`;
    mf += form(d, f ? mx(MUS, INK, 88) : MUS, { rim: 2, ao: 8, inner: t });
  }
  s += `<g class="ns-mus" style="opacity:${op('mus')}">${mf}</g>`;
  // terminals: fine branches ending in swollen knobs, each sitting in a shallow dip (end plate) in the first fibre
  let tt = '';
  for (const p of term) tt += tube(p.d, NV, Math.max(2.4, p.w));
  for (const p of term) if (p.depth === 0) {
    const [ex, ey] = p.end, kr = R * 0.2, cx = m.vertical ? ex + kr * 0.2 : ex, cy = m.vertical ? ey : ey + kr * 0.2;
    tt += m.vertical ? `<path d="M${n1(ex + 1)} ${n1(ey - kr * 1.6)}Q${n1(ex + kr * 1.3)} ${n1(ey)} ${n1(ex + 1)} ${n1(ey + kr * 1.6)}" style="fill:${MUS_D};opacity:.55"/>` : `<path d="M${n1(ex - kr * 1.6)} ${n1(ey + 1)}Q${n1(ex)} ${n1(ey + kr * 1.3)} ${n1(ex + kr * 1.6)} ${n1(ey + 1)}" style="fill:${MUS_D};opacity:.55"/>`;
    tt += form(`M${n1(cx - kr)} ${n1(cy)}A${n1(kr)} ${n1(kr)} 0 1 0 ${n1(cx + kr)} ${n1(cy)}A${n1(kr)} ${n1(kr)} 0 1 0 ${n1(cx - kr)} ${n1(cy)}Z`, NV, { rim: 1.8, rimCol: NV_D, ao: kr * 0.5, hi: 60 });
  }
  s += `<g style="opacity:${op('term')}">${tt}</g>`;
  // the cell body with its nucleus and grains
  const body = `M${n1(B[0] - R)} ${n1(B[1])}C${n1(B[0] - R)} ${n1(B[1] - R * 1.1)} ${n1(B[0] + R * 0.6)} ${n1(B[1] - R * 1.15)} ${n1(B[0] + R * 1.1)} ${n1(B[1] - R * 0.2)}C${n1(B[0] + R * 1.3)} ${n1(B[1] + R * 0.3)} ${n1(B[0] + R * 0.5)} ${n1(B[1] + R * 1.1)} ${n1(B[0] - R * 0.2)} ${n1(B[1] + R)}C${n1(B[0] - R * 0.8)} ${n1(B[1] + R * 0.9)} ${n1(B[0] - R)} ${n1(B[1] + R * 0.5)} ${n1(B[0] - R)} ${n1(B[1])}Z`;
  let grains = '';
  for (let i = 0; i < 16; i++) { const a = q() * 6.28, r = R * (0.45 + q() * 0.4); grains += `<circle cx="${n1(B[0] + Math.cos(a) * r)}" cy="${n1(B[1] + Math.sin(a) * r)}" r="${n1(1.4 + q() * 1.4)}" style="fill:${NV_D};opacity:.5"/>`; }
  s += `<g style="opacity:${op('body')}">${form(body, NV, { rim: 2.6, inner: grains })}${nucleus(B[0] + R * 0.05, B[1], R * 0.42)}</g>`;
  // the route the signal takes (for travel), one way
  const den0 = den[2], tip = den.find((p) => p.depth === 0 && den.indexOf(p) > 2) ?? den0, knob = term.find((p) => p.depth === 0);
  const route = `M${n1(tip.end[0])} ${n1(tip.end[1])}L${n1(den0.end[0])} ${n1(den0.end[1])}L${n1(B[0])} ${n1(B[1])}L${n1(g.ax[0][0])} ${n1(g.ax[0][1])}C${n1(g.ax[1][0])} ${n1(g.ax[1][1])} ${n1(g.ax[2][0])} ${n1(g.ax[2][1])} ${n1(T0[0])} ${n1(T0[1])}L${n1(knob.end[0])} ${n1(knob.end[1])}`;
  return { s, route, tip: tip.end, den: den[8]?.end ?? den0.end, knob: knob.end };
}
// the comparison inset: a finger presses a wall switch, a long wire carries the current, a bulb at the far end glows
function lamp(x, y, w) {
  const h = 100, SK = mx('strata-1', 'flame', 74), SK_D = mx(SK, INK, 60), GL = mx('gold', 'elev-peak', 46);
  let s = `<rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" rx="14" style="fill:${INK};opacity:.16;filter:url(#cw-blur3)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" style="fill:${mx('elev-peak', 'series-2', 88)};stroke:${mx('series-2', INK, 50)};stroke-width:2"/>`;
  // switch plate and its rocker, pressed down at the top
  const sx = x + 22, sy = y + 34;
  s += form(`M${sx} ${sy + 6}Q${sx} ${sy} ${sx + 6} ${sy}H${sx + 30}Q${sx + 36} ${sy} ${sx + 36} ${sy + 6}V${sy + 48}Q${sx + 36} ${sy + 54} ${sx + 30} ${sy + 54}H${sx + 6}Q${sx} ${sy + 54} ${sx} ${sy + 48}Z`, W_, { ao: 4, rim: 1.8, rimCol: INK, hi: 40 });
  s += `<path d="M${sx + 9} ${sy + 12}L${sx + 27} ${sy + 16}V${sy + 44}L${sx + 9} ${sy + 42}Z" style="fill:${mx('strata-5', 'elev-peak', 50)};stroke:${INK};stroke-width:1.6"/>`;
  // a hand from above: the back of the hand with its knuckles, the index finger reaching down onto the rocker
  const fx = sx + 18, fy = sy + 14;
  s += form(`M${fx - 22} ${y - 18}Q${fx - 26} ${y + 6} ${fx - 18} ${y + 16}Q${fx - 13} ${y + 22} ${fx - 8} ${y + 17}Q${fx - 2} ${y + 22} ${fx + 6} ${y + 16}Q${fx + 13} ${y + 20} ${fx + 18} ${y + 12}Q${fx + 24} ${y + 2} ${fx + 20} ${y - 18}Z`, SK, { ao: 6, rim: 1.6, rimCol: SK_D, hi: 40, inner: `<path d="M${fx - 13} ${y + 14}q2 -5 0 -9M${fx + 1} ${y + 14}q2 -5 0 -9M${fx + 13} ${y + 10}q2 -5 0 -8" style="fill:none;stroke:${SK_D};stroke-width:1.3;opacity:.5"/>` });
  s += form(`M${fx - 6} ${y + 10}V${fy - 2}Q${fx - 6} ${fy + 4} ${fx} ${fy + 4}Q${fx + 6} ${fy + 4} ${fx + 6} ${fy - 2}V${y + 10}Z`, SK, { ao: 3, rim: 1.6, rimCol: SK_D, hi: 50, inner: `<path d="M${fx - 3.5} ${fy - 1}Q${fx - 3.5} ${fy + 2} ${fx} ${fy + 2}Q${fx + 3.5} ${fy + 2} ${fx + 3.5} ${fy - 1}V${fy - 7}H${fx - 3.5}Z" style="fill:${mx(SK, 'elev-peak', 50)};stroke:${SK_D};stroke-width:.8"/><path d="M${fx - 6} ${fy - 16}h5" style="fill:none;stroke:${SK_D};stroke-width:1.1;opacity:.6"/>` });
  // the long wire, then the bulb lit at the far end
  const bx = x + w - 34, by = y + 42;
  s += `<path d="M${sx + 36} ${sy + 40}C${x + w * 0.4} ${y + h + 6} ${x + w * 0.62} ${y + 30} ${bx} ${by + 38}" style="fill:none;stroke:${INK};stroke-width:3.4;stroke-linecap:round"/>`;
  s += `<defs><radialGradient id="ns-glow"><stop offset="0" style="stop-color:${GL};stop-opacity:.95"/><stop offset="1" style="stop-color:${GL};stop-opacity:0"/></radialGradient></defs><circle cx="${bx}" cy="${by}" r="34" style="fill:url(#ns-glow)"/>`;
  s += form(`M${bx - 8} ${by + 16}Q${bx - 18} ${by + 4} ${bx - 18} ${by - 6}A18 18 0 1 1 ${bx + 18} ${by - 6}Q${bx + 18} ${by + 4} ${bx + 8} ${by + 16}Z`, mx(GL, 'elev-peak', 50), { ao: 4, rim: 1.8, rimCol: mx('gold', INK, 60), hi: 30, inner: `<path d="M${bx - 6} ${by + 12}V${by}l3 -6l3 6l3 -6l3 6V${by + 12}" style="fill:none;stroke:${mx('flame', 'gold', 50)};stroke-width:1.6;stroke-linejoin:round"/>` });
  s += `<path d="M${bx - 12} ${by - 14}A13 13 0 0 1 ${bx - 2} ${by - 20}" style="fill:none;stroke:${W_};stroke-width:2.6;stroke-linecap:round;opacity:.9"/>`;
  s += form(`M${bx - 8} ${by + 16}H${bx + 8}V${by + 30}Q${bx} ${by + 36} ${bx - 8} ${by + 30}Z`, mx('strata-5', 'elev-peak', 60), { ao: 2, rim: 1.6, rimCol: INK, hi: 50, inner: `<path d="M${bx - 8} ${by + 20}H${bx + 8}M${bx - 8} ${by + 24}H${bx + 8}M${bx - 8} ${by + 28}H${bx + 8}" style="fill:none;stroke:${INK};stroke-width:1;opacity:.5"/>` });
  return s + tag(x + w / 2, y + h + 4, 'switch, wire, lamp', { size: 14 });
}

export class NeuronSignal extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 500;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 520;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A neuron: a cell body with its nucleus, short branching dendrites around it, one long axon and branched axon terminals that rest on a striped skeletal muscle fibre. A signal enters at a dendrite, passes the cell body, runs along the axon and leaves at the terminals into the muscle, which twitches. The signal goes one way only. A small picture compares the axon to the wire from a switch to a lamp.';
  static CONTROLS = [];

  sent = 0;
  async setup() { await super.setup(); tapMin(this); bindFlow(this.root, { action: (a) => this._act(a) }); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 52px; display: flex; justify-content: center; align-items: center; }' + BODY_CSS + TAP_MIN_CSS
    + ' svg .ns-mus { transform-box: fill-box; transform-origin: center; } [data-step="3"] svg .ns-mus { animation: ns-tw .5s ease-out 3.1s both; } @keyframes ns-tw { 40% { transform: scale(0.94, 1.04); } }'
    + ' svg .ns-a { animation: ns-a .45s ease-out both; animation-delay: var(--d, 0s); } @keyframes ns-a { from { opacity: 0; } }'
    + ' svg .ns-sig { animation: ns-sig 3s linear var(--d, .2s) both; } @keyframes ns-sig { 0%, 96% { opacity: 1; } 100% { opacity: 0; } }'; }
  stageHeight(st) { return st.portrait ? 440 : 420; }
  enter() { this.sent = 0; }
  _act(a) { if (a === 'send' && this.stepIndex === 3) { this.sent++; this.repaint(); } }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15, lit = LIT[step];
    let s = depthField(W, H, { tone: 'rose', seed: 21 });
    // geometry per orientation: landscape, axon left to right onto a vertical fibre; portrait, down onto a level fibre
    const g = P
      ? { B: [92, 96], R: 30, away: -2.4, ax: [[118, 112], [300, 140], [40, 300], [210, 336]], mus: { x: 30, y: 368, w: W - 50, h: 52, vertical: false, n: 2 } }
      : { B: [160, 180], R: 40, away: Math.PI, ax: [[200, 186], [320, 96], [430, 280], [528, 196]], mus: { x: 556, y: 40, w: 72, h: H - 80, vertical: true, n: 3 } };
    const art = neuronArt(g, lit);
    s += art.s;
    const L = (t, at, x, y, o = {}) => `<g class="ns-a" style="--d:${o.d ?? 0}s">${leader(x, y, at[0], at[1], o.col ?? INK, 2.4)}${tag(x, y, t, { size: fs, rim: o.rim, anchor: o.anchor, display: o.display })}</g>`;
    const axMid = bez(g.ax, 0.5);
    if (step === 0) {
      s += tag(P ? W / 2 + 40 : W / 2, P ? 28 : 40, 'a neuron (nerve cell)', { size: fs + 2, display: true });
    } else if (step === 1) {
      s += L('cell body', [g.B[0] + g.R * 0.6, g.B[1] - g.R * 0.5], P ? W - 10 : 250, P ? 40 : 70, { anchor: P ? 'end' : 'start', rim: NV_D });
      s += L('nucleus', [g.B[0], g.B[1]], P ? W - 10 : 250, P ? 84 : 116, { anchor: P ? 'end' : 'start', rim: NV_D, d: 0.6 });
      s += L('dendrites', art.den, P ? 12 : 30, P ? 190 : 400, { anchor: 'start', rim: NV_D, d: 1.2 });
      s += L('axon', axMid, P ? W - 12 : 400, P ? 220 : 380, { anchor: P ? 'end' : 'start', rim: NV_D, d: 1.8 });
    } else if (step === 2) {
      s += L('axon terminals', art.knob, P ? W - 12 : 520, P ? 300 : 70, { anchor: 'end', rim: NV_D });
      s += L('muscle fibre', [g.mus.x + g.mus.w * 0.6, g.mus.y + g.mus.h * 0.7], P ? 12 : 520, P ? H - 14 : H - 40, { anchor: P ? 'start' : 'end', rim: MUS_D });
    } else {
      // the signal: a bright pulse along the route, then the muscle twitches
      const dot = `<circle r="11" style="fill:${SIG};opacity:.5"/><circle r="7" style="fill:${SIG};stroke:${SIG_D};stroke-width:2.4"/>`;
      s += `<g class="ns-sig" style="--d:.2s"><g class="ba-go" style="offset-path:path('${art.route}');--t:3s;--d:.2s">${dot}</g></g>`;
      s += tag(art.tip[0] + (P ? 40 : 10), art.tip[1] + (P ? -14 : -26), 'in', { size: fs, rim: SIG_D }) + tag(art.knob[0] + (P ? -30 : -40), art.knob[1] + (P ? -26 : 30), 'out', { size: fs, rim: SIG_D });
      s += lamp(P ? W - 186 : 250, P ? 8 : H - 128, P ? 176 : 250);
      s = s.replace('class="ns-mus"', 'class="ns-mus" data-sent="' + this.sent + '"');
    }
    const head = step === 3 ? flowChipHtml({ action: 'send', label: 'Send a signal' }) : '';
    return { svg: cwFrame(st, 'ns', s), head };
  }
}
