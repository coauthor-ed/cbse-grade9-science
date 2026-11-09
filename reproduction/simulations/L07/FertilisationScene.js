// FertilisationScene - egg + sperm = zygote, then the route to a prepared lining.
// Lit cells, ambient life, one camera move. Also the opener of the lesson, with 2 beats on the equation.
//   b0  the equation: egg (23 single bars) + sperm (23) = one cell (23 pairs = 46)
//   b1  the sperm swims to the egg; in the right-hand cell two pronuclei meet and
//       their bars pair up, one from each parent
//   b2  the camera glides down into the oviduct; the cell divides 1 -> 2 -> 4 -> 8
//       while it travels, every nucleus two-tone (a full set)
//   b3  the ball reaches the uterus and sinks half into the lining, vessels reach it;
//       the lining is already thick and stays one thickness
// Taps (b0, b1): egg, sperm or the one cell rings it and shows a one-line chip.
// A tap while a beat is playing skips to its end state.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { COLOR_TOKEN_MAP, mix, alpha, lighten, darken, luma, font, pill, chipSize, drawVignette } from 'simulations/base/kit/SimLook.js';
import { withCamera, layer, toScreen, toWorld, zlerp } from 'simulations/base/kit/SimCamera.js';
import { ease, reducedMotion, kick, hash2 } from 'simulations/base/kit/SimAnim.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp01((t - a) / (b - a));

// Equation set (world = screen at b0)
const ROW_Y = 232;
const EGG = { x: 124, y: ROW_Y, r: 80 };
const SK = 1.25;                       // sperm drawing scale
const SPERM_HOME = { x: 324, y: ROW_Y };
const SPERM_MEET = { x: EGG.x + EGG.r + 12 + 18 * SK, y: ROW_Y };
const ZYG = { x: 574, y: ROW_Y, r: 74 };
const PLUS_X = 262, EQ_X = 486;
const NUM_Y = ROW_Y + 134;

// Route set, below the equation in the same world
const Y0 = 660;
// Uterus in section: a curved-triangle cavity; lining and wall are constant-width bands around it
const CL = [282, Y0 + 206], CR = [548, Y0 + 206], CB = [415, Y0 + 396];
const CTL = [415, Y0 + 184], CRB = [492, Y0 + 300], CLB = [338, Y0 + 300];
const LINING = 46, WALL = 104;                 // one lining thickness on every beat
function quad(p0, q, p1, u) { const v = 1 - u; return [v * v * p0[0] + 2 * v * u * q[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * q[1] + u * u * p1[1]]; }
const CAV_PTS = [];
for (const [p0, q, p1] of [[CL, CTL, CR], [CR, CRB, CB], [CB, CLB, CL]]) for (let i = 0; i < 40; i++) CAV_PTS.push(quad(p0, q, p1, i / 40));
// outward normal at each outline point (the outline runs clockwise on screen)
const CAV_N = CAV_PTS.map((p, i) => {
  const a = CAV_PTS[(i + CAV_PTS.length - 1) % CAV_PTS.length], b = CAV_PTS[(i + 1) % CAV_PTS.length];
  const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
  return [ty / l, -tx / l];
});
const SPOT_I = 17;                            // on the upper wall, near the fundus
const SPOT = { x: CAV_PTS[SPOT_I][0], y: CAV_PTS[SPOT_I][1] };
const TUBE = [[-90, Y0 + 300], [-10, Y0 + 20], [150, Y0 + 70], CL];
const TUBE_W = 76, LUMEN_W = 50;
// where the tube meets the outer wall: from here on it is a narrow channel through the muscle
let TUBE_IN = 1;
for (let u = 0; u <= 1; u += 0.005) if (Math.hypot(bez(TUBE, u)[0] - CL[0], bez(TUBE, u)[1] - CL[1]) < LINING + WALL + 6) { TUBE_IN = u; break; }
const CAM_EQ = { x: 340, y: 260, z: 1 };
const CAM_ROUTE = { x: 300, y: Y0 + 214, z: 1 };
const CHIP = { egg: 'an egg, which cannot swim', sperm: 'a sperm, which swims', zyg: 'a zygote: 46 chromosomes' };
const B1_END = 4.0, B2_END = 4.6, B3_END = 3.5;

function bez(p, u) {
  const v = 1 - u;
  return [0, 1].map((k) => v * v * v * p[0][k] + 3 * v * v * u * p[1][k] + 3 * v * u * u * p[2][k] + u * u * u * p[3][k]);
}
function bezTan(p, u) {
  const v = 1 - u;
  const d = [0, 1].map((k) => 3 * v * v * (p[1][k] - p[0][k]) + 6 * v * u * (p[2][k] - p[1][k]) + 3 * u * u * (p[3][k] - p[2][k]));
  const l = Math.hypot(d[0], d[1]) || 1;
  return [d[0] / l, d[1] / l];
}
const TUBE_PTS = Array.from({ length: 49 }, (_, i) => bez(TUBE, i / 48));

// 23 = 4 + 5 + 5 + 5 + 4: a round-ish grid for chromosome bars
const ROWS = [4, 5, 5, 5, 4];
function grid(i, colP, rowP) {
  let r = 0, n = i;
  while (n >= ROWS[r]) { n -= ROWS[r]; r += 1; }
  return [(n - (ROWS[r] - 1) / 2) * colP, (r - 2) * rowP];
}

// Cluster layouts (unit offsets) for 1, 2, 4, 8 cells; child j of a level comes from parent j >> 1
const LAYOUT = {
  1: [[0, 0]],
  2: [[-1, 0], [1, 0]],
  4: [[-1, -0.9], [1, -0.9], [-1, 0.9], [1, 0.9]],
  8: [[-1.6, -0.5], [-0.55, -1.45], [0.55, -1.45], [1.6, -0.5], [-1.15, 0.95], [0, 0.15], [1.15, 0.95], [0, 1.55]],
};
const CELL_R = { 1: 19, 2: 14, 4: 11.5, 8: 9.5 };
const CELL_GAP = { 1: 0, 2: 13.5, 4: 11, 8: 9.6 };

export class FertilisationScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static CONTINUOUS = true; // rich: tails beat, cilia wave, granules drift while the slide is open
  static IRIS = false;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }]];
  static BEAT_MAPS = { 2: [[{ idx: 0, dwellMs: null }], [{ idx: 0, dwellMs: null }]], 4: [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }]] };   // the lesson opener: the equation only
  static CONTROLS = [];
  static COLOR_MAP = {
    ...COLOR_TOKEN_MAP,
    membrane: ['--sim-membrane', '#4f9cf7'],
    nucleus: ['--sim-nucleus', '#6366f1'],
    nucleusStroke: ['--sim-nucleus-stroke', '#4f46e5'],
  };
  static ARIA_LABEL = 'An egg, a plus sign, a sperm, an equals sign and one new cell, drawn as lit cells. The egg nucleus holds 23 gold bars, the sperm is marked 23, and the new cell holds 23 pairs of bars, each pair one gold and one cyan, marked 46. On the second beat the sperm swims to the egg while, in the new cell, a gold and a cyan nucleus meet and their bars pair up. On the third beat the view glides down into the oviduct, where the single cell divides into two, four and eight cells as it travels, each nucleus half gold and half cyan. On the last beat the ball of cells reaches the uterus and sinks half into its thick lining, and nearby blood vessels reach it. The lining is the same thickness throughout. Tap the egg, the sperm or the new cell to read a line about it.';

  enter() {
    this._sel = null;
    this._jump = 0;
  }

  get _t() { return reducedMotion() ? 99 : this.age + this._jump; }

  /** A design size that reaches at least 12 px on screen: on a phone the stage is drawn at under half size. */
  _px(design) {
    const w = this._canvas?.getBoundingClientRect?.().width;
    return w > 0 ? Math.max(design, Math.ceil((12 * 680) / w)) : design;
  }

  busy() {
    const t = this._t;
    return (this.stage === 1 && t < B1_END) || (this.stage === 2 && t < B2_END) || (this.stage === 3 && t < B3_END);
  }

  _cam() {
    const t = this._t;
    if (this.stage <= 1) return CAM_EQ;
    if (this.stage === 2) {
      const e = ease.inOutCubic(seg(t, 0, 1.4));
      return { x: lerp(CAM_EQ.x, CAM_ROUTE.x, e), y: lerp(CAM_EQ.y, CAM_ROUTE.y, e), z: 1 };
    }
    const e2 = ease.inOutCubic(seg(t, 1.2, 3.0));
    return { x: lerp(CAM_ROUTE.x, SPOT.x, e2), y: lerp(CAM_ROUTE.y, SPOT.y + 40, e2), z: zlerp(1, 1.55, e2) };
  }

  pointerDown(p) {
    if (this.busy()) { this._jump = 99; return; }
    if (this.stage > 1) return;
    const [x, y] = toWorld(this._cam(), p.x, p.y);
    const sp = this._spermPos();
    const hit = Math.hypot(x - EGG.x, y - EGG.y) < EGG.r + 26 ? 'egg'
      : Math.hypot(x - ZYG.x, y - ZYG.y) < ZYG.r + 14 ? 'zyg'
        : (x > sp.x - 26 && x < sp.x + 120 && Math.abs(y - sp.y) < 30) ? 'sperm' : null;
    this._sel = hit === this._sel ? null : hit;
  }

  _spermPos() {
    if (this.stage !== 1) return SPERM_HOME;
    const u = ease.inOutCubic(seg(this._t, 0.2, 1.6));
    return { x: lerp(SPERM_HOME.x, SPERM_MEET.x, u), y: ROW_Y + Math.sin(u * TAU * 1.5) * 6 * (1 - u) };
  }

  draw(ctx, c, clock) {
    const amb = reducedMotion() ? 0 : clock;
    const dark = luma(c.bgDeep) < 0.5;
    const cam = this._cam();
    this._backdrop(ctx, c, dark);
    layer(ctx, cam, 0.35, (g) => this._bokeh(g, c, dark, amb));
    withCamera(ctx, cam, (g) => {
      if (this.stage <= 1 || (this.stage === 2 && this._t < 1.5)) this._equation(g, c, dark, amb);
      if (this.stage >= 2) this._route(g, c, dark, amb);
    });
    this._screenText(ctx, c, cam, dark);
    drawVignette(ctx, c, 0.9);
  }

  // ---- set ----
  _backdrop(ctx, c, dark) {
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, mix(c.bgDeep, c.s5, dark ? 0.16 : 0.07));
    g.addColorStop(1, mix(c.bgDeep, c.s4, dark ? 0.12 : 0.06));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 680, 520);
  }

  _bokeh(ctx, c, dark, t) {
    const cols = [c.s4, c.s5, c.s7, c.s2];
    for (let i = 0; i < 18; i++) {
      const x = -60 + hash2(i, 1) * 800 + Math.sin(t * 0.17 + i) * 10;
      const y = -120 + hash2(i, 2) * 1500 + Math.cos(t * 0.13 + i * 2) * 8;
      const r = 26 + hash2(i, 3) * 70;
      const col = cols[i % 4];
      const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, alpha(col, dark ? 0.16 : 0.13));
      g.addColorStop(0.7, alpha(col, dark ? 0.06 : 0.05));
      g.addColorStop(1, alpha(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }

  // ---- lit sphere: one key light from the top left ----
  _sphere(ctx, x, y, r, col, dark, o = {}) {
    if (o.shadow !== false) {
      const sg = ctx.createRadialGradient(x + r * 0.18, y + r * 0.95, 0, x + r * 0.18, y + r * 0.95, r * 1.05);
      sg.addColorStop(0, alpha(darken(col, 0.85), dark ? 0.45 : 0.22));
      sg.addColorStop(1, alpha(darken(col, 0.85), 0));
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(x + r * 0.18, y + r * 0.95, r * 1.05, r * 0.28, 0, 0, TAU); ctx.fill();
    }
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.05, x, y, r);
    g.addColorStop(0, lighten(col, o.hi ?? 0.45));
    g.addColorStop(0.55, col);
    g.addColorStop(1, darken(col, o.lo ?? 0.38));
    ctx.globalAlpha = o.a ?? 1;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // rim light on the lit edge, bounce light on the far edge
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.strokeStyle = alpha(lighten(col, 0.7), 0.55);
    ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(col, 0.3), 0.25);
    ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, Math.PI * 0.1, Math.PI * 0.55); ctx.stroke();
    if (o.spec !== false) {
      const sx = x - r * 0.4, sy = y - r * 0.45;
      const s = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.32);
      s.addColorStop(0, alpha(lighten(col, 0.95), dark ? 0.42 : 0.6));
      s.addColorStop(1, alpha(lighten(col, 0.95), 0));
      ctx.fillStyle = s;
      ctx.beginPath(); ctx.ellipse(sx, sy, r * 0.32, r * 0.22, -0.6, 0, TAU); ctx.fill();
    }
  }

  _ring(ctx, x, y, r, w, col, dark, a = 1) {
    // translucent shell (zona pellucida): glassy band, brighter on the lit side
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, alpha(lighten(col, 0.5), (dark ? 0.55 : 0.7) * a));
    g.addColorStop(1, alpha(col, (dark ? 0.22 : 0.35) * a));
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }

  _nucleusBody(ctx, x, y, r, c, dark, a = 1) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, alpha(lighten(c.nucleus, 0.35), 0.75 * a));
    g.addColorStop(1, alpha(darken(c.nucleus, 0.25), 0.85 * a));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = alpha(lighten(c.nucleus, 0.5), 0.7 * a);
    ctx.stroke();
  }

  _bar(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, w / 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.6), 0.6);
    ctx.fillRect(x - w / 2 + w * 0.2, y - h / 2 + 1, w * 0.25, h - 2);
  }

  // ---- equation ----
  _equation(ctx, c, dark, t) {
    const T = this._t;
    const s1 = this.stage === 1;
    this._egg(ctx, c, dark, t, s1 ? T : -1);
    const plusA = s1 ? 1 - seg(T, 0.5, 1.1) : 1;
    this._sign(ctx, c, '+', PLUS_X, ROW_Y, plusA);
    this._sign(ctx, c, '=', EQ_X, ROW_Y, 1);
    const sp = this._spermPos();
    const swim = s1 && T > 0.2 && T < 1.6;
    this._sperm(ctx, c, dark, sp.x, sp.y, t * (swim ? 2.2 : 1));
    this._zygote(ctx, c, dark, t, s1 ? T : 99);
  }

  _sign(ctx, c, s, x, y, a) {
    if (a <= 0.01) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = alpha(c.label, 0.9);
    ctx.font = font(c, 700, 44, true);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y + 2);
    ctx.globalAlpha = 1;
  }

  _egg(ctx, c, dark, t, T) {
    const { x, y, r } = EGG;
    const egg = mix(c.s2, c.s8, 0.25);
    const ring = this._sel === 'egg';
    // corona radiata: a loose crown of follicle cells
    const crown = mix(egg, c.bgSurface, dark ? 0.35 : 0.15);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU + hash2(i, 7) * 0.12;
      const rr = r + 24 + hash2(i, 8) * 5 + Math.sin(t * 0.8 + i) * 1.2;
      this._sphere(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 8 + hash2(i, 9) * 3.5, crown, dark, { shadow: false, spec: false, hi: 0.35 });
    }
    this._sphere(ctx, x, y, r, egg, dark, { hi: 0.5 });
    // yolk granules
    for (let i = 0; i < 90; i++) {
      const a = hash2(i, 11) * TAU, d = Math.sqrt(hash2(i, 12)) * r * 0.86;
      const gx = x + Math.cos(a + t * 0.02) * d, gy = y + Math.sin(a + t * 0.02) * d;
      ctx.fillStyle = alpha(i % 3 ? darken(egg, 0.3) : lighten(egg, 0.55), 0.35);
      ctx.beginPath(); ctx.arc(gx, gy, 1.3 + hash2(i, 13) * 1.6, 0, TAU); ctx.fill();
    }
    // zona pellucida, rippling where the sperm lands
    this._ring(ctx, x, y, r + 7, 9, c.glass, dark);
    if (T >= 1.5) {
      const k = Math.max(0, kick(T - 1.5, 'playful'));
      const w = seg(T, 1.5, 2.6);
      ctx.strokeStyle = alpha(lighten(c.s7, 0.5), (1 - w) * 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + r + 7, y, 6 + w * 30 + k * 4, Math.PI * 0.55, Math.PI * 1.45); ctx.stroke();
    }
    // nucleus: 23 single gold bars (one set)
    this._nucleusBody(ctx, x - 6, y - 4, 35, c, dark);
    for (let i = 0; i < 23; i++) {
      const [gx, gy] = grid(i, 8.6, 12);
      this._bar(ctx, x - 6 + gx, y - 4 + gy, 3.4, 9.5, c.s2);
    }
    if (ring) this._selRing(ctx, c, x, y, r + 40, t);
  }

  _sperm(ctx, c, dark, x, y, t) {
    const col = c.s7;
    const ring = this._sel === 'sperm';
    // tail: tapering travelling wave behind the head (head points left, toward the egg)
    const N = 30, L = 118, x0 = x + 17 * SK;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([x0 + s * L, y + Math.sin(s * TAU * 1.4 - t * 7) * 10 * Math.pow(s, 0.8)]);
    }
    for (let i = 0; i < N; i++) {
      const s = i / N;
      ctx.strokeStyle = alpha(i < 4 ? lighten(col, 0.1) : col, 1 - s * 0.45);
      ctx.lineWidth = i < 4 ? 6 : 4.2 * (1 - s) + 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
    // head: teardrop with a paler acrosome cap at the front
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(SK, SK);
    const g = ctx.createRadialGradient(-6, -5, 1, 0, 0, 19);
    g.addColorStop(0, lighten(col, 0.55)); g.addColorStop(0.6, col); g.addColorStop(1, darken(col, 0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 12.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.7), 0.55);
    ctx.beginPath(); ctx.ellipse(-8, 0, 9, 10, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
    ctx.fillStyle = alpha(darken(col, 0.45), 0.55);
    ctx.beginPath(); ctx.ellipse(3, 1, 8, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.95), dark ? 0.45 : 0.6);
    ctx.beginPath(); ctx.ellipse(-7, -6, 5, 2.6, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
    if (ring) this._selRing(ctx, c, x + 40, y, 62, t);
  }

  _zygote(ctx, c, dark, t, T) {
    const { x, y, r } = ZYG;
    const cyto = mix(mix(c.s2, c.s8, 0.25), c.s4, 0.18);
    this._sphere(ctx, x, y, r, cyto, dark, { hi: 0.5 });
    for (let i = 0; i < 60; i++) {
      const a = hash2(i, 21) * TAU, d = Math.sqrt(hash2(i, 22)) * r * 0.85;
      ctx.fillStyle = alpha(i % 3 ? darken(cyto, 0.3) : lighten(cyto, 0.55), 0.3);
      ctx.beginPath(); ctx.arc(x + Math.cos(a - t * 0.02) * d, y + Math.sin(a - t * 0.02) * d, 1.2 + hash2(i, 23) * 1.4, 0, TAU); ctx.fill();
    }
    this._ring(ctx, x, y, r + 6, 8, c.glass, dark);
    // b1: two pronuclei slide together (1.4..2.4 s), then the bars pair up (2.2..3.8 s)
    const m = ease.inOutCubic(seg(T, 1.4, 2.4));
    const pairT = seg(T, 2.2, 3.9);
    const nR = lerp(25, 45, m);
    const sep = lerp(26, 0, m);
    if (m < 1) {
      this._nucleusBody(ctx, x - sep, y, nR, c, dark);
      this._nucleusBody(ctx, x + sep, y, nR, c, dark);
    } else {
      this._nucleusBody(ctx, x, y, 45, c, dark);
    }
    for (let s = 0; s < 2; s++) {
      const col = s ? c.s7 : c.s2;
      for (let i = 0; i < 23; i++) {
        const [ax, ay] = grid(i, 6.4, 8.6);
        const [bx, by] = grid(i, 12, 14.2);
        const u = ease.inOutCubic(clamp01((pairT - (i / 23) * 0.45) / 0.55));
        const sx = x + (s ? sep : -sep) + ax * (nR / 25) * 0.9;
        const sy = y + ay * (nR / 25) * 0.9;
        this._bar(ctx, lerp(sx, x + bx + (s ? 2.5 : -2.5), u), lerp(sy, y + by, u), lerp(2.6, 3.4, u), lerp(7, 11.5, u), col);
      }
    }
    if (this._sel === 'zyg') this._selRing(ctx, c, x, y, r + 20, t);
  }

  _selRing(ctx, c, x, y, r, t) {
    ctx.strokeStyle = alpha(c.label, 0.85);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -t * 18;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ---- route ----
  _cavPath(ctx) {
    ctx.beginPath(); ctx.moveTo(...CL);
    ctx.quadraticCurveTo(...CTL, ...CR); ctx.quadraticCurveTo(...CRB, ...CB); ctx.quadraticCurveTo(...CLB, ...CL);
    ctx.closePath();
  }

  _route(ctx, c, dark, t) {
    const T = this._t;
    const wall = mix(c.s4, c.s6, 0.45);
    const lin = mix(c.s5, c.s4, 0.45);
    const fluid = mix(c.bgDeep, c.s4, dark ? 0.12 : 0.08);
    this._tube(ctx, c, dark, t);   // drawn first: the wall covers its end
    const band = (w, col) => { ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.strokeStyle = col; this._cavPath(ctx); ctx.stroke(); };
    const wg = ctx.createLinearGradient(CL[0] - 140, CL[1] - 160, CR[0] + 60, CB[1] + 140);
    wg.addColorStop(0, lighten(wall, dark ? 0.14 : 0.32)); wg.addColorStop(1, darken(wall, dark ? 0.42 : 0.22));
    // contact shadow, then the muscle wall in rings (each ring line is a band edge)
    ctx.save(); ctx.translate(10, 16); band(2 * (LINING + WALL), alpha(darken(wall, 0.8), dark ? 0.4 : 0.16)); ctx.restore();
    band(2 * (LINING + WALL) + 4, lighten(wall, 0.45));
    band(2 * (LINING + WALL), wg);
    for (const d of [70, 48, 26]) { band(2 * (LINING + d), alpha(darken(wall, 0.4), 0.45)); band(2 * (LINING + d) - 3, wg); }
    // lining band
    const lg = ctx.createLinearGradient(CL[0], CL[1] - 60, CR[0], CB[1]);
    lg.addColorStop(0, lighten(lin, dark ? 0.3 : 0.42)); lg.addColorStop(1, darken(lin, 0.08));
    band(2 * LINING + 3, darken(lin, 0.25));
    band(2 * LINING, lg);
    // glands and coiled vessels across the lining, along the outline normals
    ctx.lineCap = 'round';
    for (let i = 0; i < CAV_PTS.length; i += 3) {
      const [x, y] = CAV_PTS[i], [nx, ny] = CAV_N[i];
      ctx.strokeStyle = alpha(darken(lin, 0.3), 0.5); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + nx * 7, y + ny * 7);
      ctx.quadraticCurveTo(x + nx * 18 + ny * 4, y + ny * 18 - nx * 4, x + nx * (30 + hash2(i, 32) * 8), y + ny * (30 + hash2(i, 32) * 8));
      ctx.stroke();
    }
    for (let i = 1; i < CAV_PTS.length; i += 8) this._vessel(ctx, c, i, t);
    // cavity: a slit of fluid, its surface catching the light
    this._cavPath(ctx);
    const fg = ctx.createLinearGradient(0, CL[1] - 20, 0, CB[1]);
    fg.addColorStop(0, mix(fluid, lin, dark ? 0.12 : 0.1)); fg.addColorStop(1, fluid);
    ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = alpha(lighten(lin, 0.7), dark ? 0.65 : 0.9); ctx.lineWidth = 2.5; ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const x = 330 + hash2(i, 51) * 170 + Math.sin(t * 0.3 + i) * 6, y = Y0 + 214 + hash2(i, 52) * 90 + Math.cos(t * 0.25 + i) * 5;
      ctx.fillStyle = alpha(lighten(lin, 0.5), 0.18 + 0.12 * Math.sin(t + i));
      ctx.beginPath(); ctx.arc(x, y, 1.5 + hash2(i, 53) * 2, 0, TAU); ctx.fill();
    }
    // the tube's last stretch: a narrow channel through the muscle into the corner of the cavity
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    const ch = TUBE_PTS.filter((_, i) => i / (TUBE_PTS.length - 1) >= TUBE_IN - 0.02).concat([CL]);
    for (const [w, col] of [[24, darken(wall, 0.3)], [16, mix(fluid, lin, 0.2)]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ch.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
    // the travelling, dividing cell
    if (this.stage === 2) {
      const u = ease.inOutCubic(seg(T, 1.1, 4.4));
      const lvl = u < 0.24 ? 1 : u < 0.5 ? 2 : u < 0.76 ? 4 : 8;
      const at = u < 0.24 ? 0 : u < 0.5 ? 0.24 : u < 0.76 ? 0.5 : 0.76;
      const split = lvl === 1 ? 1 : ease.outCubic(clamp01((u - at) / 0.1));
      const [px, py] = bez(TUBE, 0.12 + u * (TUBE_IN - 0.15));
      this._cluster(ctx, c, dark, px, py, lvl, split, t);
    } else {
      // through the channel (0..0.9 s), across the cavity (0.8..1.9 s), into the lining (1.8..2.6 s)
      const v = ease.inOutCubic(seg(T, 0, 0.9));
      const uu = lerp(TUBE_IN - 0.03, 1, v);
      const [mx, my] = uu < 1 ? bez(TUBE, uu) : CL;
      const u = ease.inOutCubic(seg(T, 0.8, 1.9));
      const sink = ease.outCubic(seg(T, 1.8, 2.6));
      const [nx, ny] = CAV_N[SPOT_I];
      const ax = SPOT.x - nx * 40, ay = SPOT.y - ny * 40;
      const px = lerp(mx, ax, u), py = lerp(my, ay, u) + Math.sin(u * Math.PI) * 24;
      const qx = lerp(px, SPOT.x, sink), qy = lerp(py, SPOT.y, sink);
      const reach = seg(T, 2.4, 3.4);
      // inside the cavity: drawn plainly; inside the lining: seen through the tissue
      ctx.save(); this._cavPath(ctx); ctx.clip();
      this._cluster(ctx, c, dark, qx, qy, 8, 1, t);
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.rect(qx - 80, qy - 80, 160, 160);
      ctx.moveTo(...CL); ctx.quadraticCurveTo(...CTL, ...CR); ctx.quadraticCurveTo(...CRB, ...CB); ctx.quadraticCurveTo(...CLB, ...CL); ctx.closePath();
      ctx.clip('evenodd');
      ctx.globalAlpha = 0.62;
      this._cluster(ctx, c, dark, qx, qy, 8, 1, t);
      ctx.restore();
      ctx.globalAlpha = 1;
      if (reach > 0) this._reach(ctx, c, qx, qy, reach, t);
    }
  }

  _vesselPath(i) {
    const [x, y] = CAV_PTS[i], [nx, ny] = CAV_N[i];
    return (s) => {
      const k = lerp(LINING + 20, 9, s), w = Math.sin(s * 15 + i) * 3.2;
      return [x + nx * k + ny * w, y + ny * k - nx * w];
    };
  }

  _vessel(ctx, c, i, t) {
    const blood = c.s6;
    const path = this._vesselPath(i);
    ctx.strokeStyle = alpha(darken(blood, 0.15), 0.8); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 28; k++) { const [a, b] = path(k / 28); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const s = (t * 0.25 + k / 3 + hash2(i, 41)) % 1;
      const [a, b] = path(s);
      ctx.fillStyle = alpha(lighten(blood, 0.45), 0.9 * Math.sin(Math.PI * s));
      ctx.beginPath(); ctx.arc(a, b, 2.2, 0, TAU); ctx.fill();
    }
  }

  _reach(ctx, c, px, py, k, t) {
    // the nearest vessels branch toward the ball of cells
    const blood = c.s6;
    for (const d of [-3, 0, 3]) {
      const i = SPOT_I + d;
      const [x0, y0] = this._vesselPath(i)(0.15);
      const [nx, ny] = CAV_N[SPOT_I];
      const x1 = px + nx * 20 + d * 4, y1 = py + ny * 20;
      const n = 18, m = Math.max(1, Math.round(n * k));
      const at = (s) => [lerp(x0, x1, s) + Math.sin(s * 7 + d) * 2.5, lerp(y0, y1, ease.smooth(s))];
      ctx.strokeStyle = alpha(darken(blood, 0.05), 0.95); ctx.lineWidth = 2.8; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j <= m; j++) { const [xx, yy] = at(j / n); j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
      if (k >= 1) {
        const s = (t * 0.4 + d * 0.1 + 1) % 1;
        const [xx, yy] = at(s);
        ctx.fillStyle = alpha(lighten(blood, 0.5), Math.sin(Math.PI * s));
        ctx.beginPath(); ctx.arc(xx, yy, 2.2, 0, TAU); ctx.fill();
      }
    }
  }

  _tube(ctx, c, dark, t) {
    const tw = mix(c.s4, c.bgSurface, dark ? 0.25 : 0.1);
    const path = () => { ctx.beginPath(); ctx.moveTo(...TUBE[0]); ctx.bezierCurveTo(...TUBE[1], ...TUBE[2], ...TUBE[3]); };
    const stroke = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; path(); ctx.stroke(); };
    // soft drop shadow, wall, wall face, lumen
    ctx.save(); ctx.translate(6, 10); stroke(TUBE_W + 6, alpha(darken(tw, 0.8), dark ? 0.35 : 0.14)); ctx.restore();
    stroke(TUBE_W, darken(tw, 0.18));
    stroke(TUBE_W - 12, tw);
    const lum = mix(c.bgDeep, tw, dark ? 0.28 : 0.22);
    stroke(LUMEN_W, lum);
    // lit outer edge along the top of the tube
    ctx.strokeStyle = alpha(lighten(tw, 0.65), 0.55); ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < TUBE_PTS.length; i++) {
      const [x, y] = TUBE_PTS[i];
      const [tx, ty] = bezTan(TUBE, i / (TUBE_PTS.length - 1));
      const sx = -tx < 0 ? 1 : -1;   // the normal that points up
      const ox = x + ty * (TUBE_W / 2 - 4) * sx, oy = y - tx * (TUBE_W / 2 - 4) * sx;
      i ? ctx.lineTo(ox, oy) : ctx.moveTo(ox, oy);
    }
    ctx.stroke();
    // cilia on both inner walls, beating in a travelling wave toward the uterus
    ctx.strokeStyle = alpha(lighten(tw, 0.4), 0.75); ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    for (let i = 1; i < TUBE_PTS.length - 2; i++) {
      const u = i / (TUBE_PTS.length - 1);
      if (u > TUBE_IN) break;
      const [x, y] = TUBE_PTS[i];
      const [tx, ty] = bezTan(TUBE, u);
      const nx = -ty, ny = tx;
      for (const side of [1, -1]) {
        for (const off of [0, 0.5]) {
          const [x2, y2] = off ? bez(TUBE, u + 0.5 / (TUBE_PTS.length - 1)) : [x, y];
          const bx = x2 + nx * side * (LUMEN_W / 2), by = y2 + ny * side * (LUMEN_W / 2);
          const sw = Math.sin(t * 6 - (i + off) * 0.7);
          const ex = bx - nx * side * 9 + tx * 6 * sw, ey = by - ny * side * 9 + ty * 6 * sw;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        }
      }
    }
  }

  _cluster(ctx, c, dark, x, y, lvl, split, t) {
    const cyto = mix(mix(c.s2, c.s8, 0.25), c.s4, 0.18);
    const parent = lvl / 2;
    const items = LAYOUT[lvl].map(([ux, uy], j) => {
      let ox = ux * CELL_GAP[lvl], oy = uy * CELL_GAP[lvl];
      let r = CELL_R[lvl];
      if (lvl > 1 && split < 1) {
        const [qx, qy] = LAYOUT[parent][j >> 1];
        ox = lerp(qx * CELL_GAP[parent], ox, split); oy = lerp(qy * CELL_GAP[parent], oy, split);
        r = lerp(CELL_R[parent] * 0.8, r, split);
      }
      const bob = Math.sin(t * 1.3 + j) * 0.6;
      return { x: x + ox, y: y + oy + bob, r };
    }).sort((a, b) => a.y - b.y);
    for (const it of items) {
      this._sphere(ctx, it.x, it.y, it.r, cyto, dark, { shadow: false, hi: 0.55 });
      // a full set in every nucleus: half gold, half cyan
      const nr = it.r * 0.36;
      ctx.fillStyle = c.s2;
      ctx.beginPath(); ctx.arc(it.x, it.y, nr, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      ctx.fillStyle = c.s7;
      ctx.beginPath(); ctx.arc(it.x, it.y, nr, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
    }
    this._ring(ctx, x, y, 30, 4, c.glass, dark, 0.8);
  }

  // ---- text at screen size ----
  _screenText(ctx, c, cam, dark) {
    const T = this._t;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (this.stage <= 2) {
      const fade = this.stage === 2 ? 1 - seg(T, 0, 0.5) : 1;
      if (fade > 0) {
        ctx.globalAlpha = fade;
        const nums = [[EGG.x, '23', c.s2ink], [SPERM_HOME.x + 30, '23', c.s7ink], [ZYG.x, '46', c.label]];
        for (const [wx, s, col] of nums) {
          const [sx, sy] = toScreen(cam, wx, NUM_Y);
          ctx.font = font(c, 700, 34, true);
          ctx.fillStyle = col;
          ctx.fillText(s, sx, sy);
        }
        // legend for the two bar colours
        const [lx, ly] = toScreen(cam, 340, NUM_Y + 66);
        this._legend(ctx, c, lx, ly);
        if (this.stage === 0 && !this._sel) {
          ctx.font = font(c, 600, this._px(17));
          ctx.fillStyle = c.labelMuted;
          ctx.fillText('tap a cell', 340, 34);
        }
        if (this._sel && this.stage <= 1) {
          const wx = this._sel === 'egg' ? EGG.x + 20 : this._sel === 'zyg' ? ZYG.x - 30 : this._spermPos().x + 40;
          const [px, sy] = toScreen(cam, Math.max(150, Math.min(530, wx)), 48);
          const half = chipSize(ctx, c, CHIP[this._sel], this._px(17)).w / 2 + 8, sx = Math.max(half, Math.min(680 - half, px));
          pill(ctx, c, CHIP[this._sel], sx, sy, { bg: c.raised, size: this._px(17) });
        }
        ctx.globalAlpha = 1;
      }
    }
    const ns = this._px(14), nh = ns + 8;
    ctx.font = font(c, 600, ns);
    ctx.textAlign = 'right';
    const nw = ctx.measureText('not to scale').width;
    ctx.fillStyle = alpha(c.bgDeep, 0.72);
    ctx.beginPath(); ctx.roundRect(668 - nw - 10, 519 - nh, nw + 20, nh, nh / 2); ctx.fill();
    ctx.fillStyle = c.labelMuted;
    ctx.fillText('not to scale', 668, 519 - nh / 2);
    ctx.textAlign = 'center';
  }

  _legend(ctx, c, x, y) {
    ctx.font = font(c, 600, this._px(16));
    const a = 'from the egg', b = 'from the sperm';
    const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
    const total = 16 + wa + 30 + 16 + wb;
    let cx = x - total / 2;
    for (const [txt, col, w] of [[a, c.s2, wa], [b, c.s7, wb]]) {
      this._bar(ctx, cx + 4, y, 5, 14, col);
      ctx.fillStyle = c.labelMuted; ctx.textAlign = 'left';
      ctx.fillText(txt, cx + 14, y + 1);
      cx += 16 + w + 30;
    }
    ctx.textAlign = 'center';
  }
}


