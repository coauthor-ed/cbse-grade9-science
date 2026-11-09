// LeverTransferScene - blk-l08-s06 "Small Force, Long Way": the crowbar of LeverPartsScene
// (same rock, stone, bar and student) is pushed down at its long end.
//   stage 0 (b0, The two ends move): the student pushes the grip down; the bar turns 26 degrees
//     about the stone. The long end moves d1 with a small force F1; the claw lifts the rock's
//     edge d2 with a large F2. Both pairs are 5 : 1, the drawn arm ratio (360 : 72 px).
//   stage 1 (b1, Work in, work out): at rest, with example numbers on the same 5 : 1:
//     F1 x d1 = 100 N x 1 m = 100 J and F2 x d2 = 500 N x 0.2 m = 100 J.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, alpha, luma, lighten, darken, mix, clamp01, lerp, vectorArrow, outBack,
} from 'simulations/base/kit/SimLook.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';

const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const GY = 440;                       // ground
const CP = { x: 232, y: 400 };        // where the bar's underside rests on the stone
const LA = 72, EA = 360;              // load arm, effort arm (px): 1 : 5
const BT = 16;                        // bar thickness
const A0 = -29 * Math.PI / 180;       // the bar's tilt at rest: claw on the ground, long end up
const PIV = { x: 36, y: 440 };        // the rock tips about its far bottom corner
const T0 = { x: CP.x - LA * Math.cos(A0) + BT * Math.sin(A0), y: CP.y - LA * Math.sin(A0) - BT * Math.cos(A0) };   // along(A0, -LA, -BT)
// the rock: its undercut near edge rests on the claw's top at the load point T0
const ROCK = [[PIV.x, 440], [128, 440], [150, 431], [T0.x, T0.y], [182, 404], [204, 368], [214, 326], [204, 296], [172, 278], [112, 272], [64, 284], [34, 314], [20, 372], [24, 420]];
const STONE = [[198, 440], [206, 425], [220, 412], [232, 401], [246, 404], [260, 416], [268, 440]];
const TUFTS = (() => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 26 }, () => ({ x: r() * W, h: 6 + r() * 9, k: r() }));
})();
const PEBBLES = (() => {
  let s = 31;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 22 }, () => ({ x: r() * W, y: GY + 14 + r() * 60, r: 2 + r() * 4 }));
})();

const dirOf = (a) => ({ x: Math.cos(a), y: Math.sin(a) });
const nrmOf = (a) => ({ x: -Math.sin(a), y: Math.cos(a) });        // toward the bar's underside
const along = (a, d, off = 0) => {
  const u = dirOf(a), n = nrmOf(a);
  return { x: CP.x + u.x * d + n.x * off, y: CP.y + u.y * d + n.y * off };
};

function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function ground(ctx, c) {
  const soil = darken(mix(c.gold, c.flame, 0.35), luma(c.bgDeep) < 0.4 ? 0.45 : 0);
  const gr = ctx.createLinearGradient(0, GY, 0, H);
  gr.addColorStop(0, darken(soil, 0.1));
  gr.addColorStop(1, darken(soil, 0.38));
  ctx.fillStyle = gr;
  ctx.fillRect(0, GY, W, H - GY);
  ctx.fillStyle = lighten(soil, 0.18);
  ctx.fillRect(0, GY, W, 4);
  for (const p of PEBBLES) {
    ctx.fillStyle = darken(soil, 0.3);
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.4, p.r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lighten(soil, 0.25);
    ctx.beginPath(); ctx.ellipse(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.6, p.r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = mix(c.good, c.stroke, 0.25);
  ctx.lineWidth = 2;
  for (const t of TUFTS) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(t.x + i * 3, GY + 2);
      ctx.lineTo(t.x + i * 6 + (t.k - 0.5) * 4, GY + 2 - t.h * (i ? 0.75 : 1));
      ctx.stroke();
    }
  }
}

// a faceted boulder: light upper left, shade lower right, cracks, darker rim
function boulder(ctx, c, pts, o = {}) {
  const base = o.col ?? mix(c.stroke, c.bgSurface, 0.3);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = x1 - x0, h = y1 - y0;
  ctx.save();
  poly(ctx, pts);
  ctx.fillStyle = base;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = lighten(base, 0.3);
  ctx.beginPath();
  ctx.ellipse(x0 + w * 0.3, y0 + h * 0.25, w * 0.42, h * 0.3, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = darken(base, 0.25);
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.62, y0 - 4);
  ctx.lineTo(x1 + 6, y0 - 4);
  ctx.lineTo(x1 + 6, y1 + 4);
  ctx.lineTo(x0 + w * 0.2, y1 + 4);
  ctx.quadraticCurveTo(x0 + w * 0.72, y0 + h * 0.7, x0 + w * 0.62, y0 - 4);
  ctx.fill();
  ctx.fillStyle = alpha(darken(base, 0.4), 0.5);
  ctx.fillRect(x0, y1 - h * 0.08, w, h * 0.08);
  // facet and crack lines
  ctx.strokeStyle = alpha(darken(base, 0.45), 0.7);
  ctx.lineWidth = 2;
  for (const cr of o.cracks ?? []) {
    ctx.beginPath();
    cr.forEach(([u, v], i) => {
      const x = x0 + u * w, y = y0 + v * h;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
  ctx.restore();
  poly(ctx, pts);
  ctx.strokeStyle = darken(base, 0.5);
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// the crowbar: a steel bar with a flat claw tip under the rock
function crowbar(ctx, c, a, o = {}) {
  const steel = mix(c.stroke, c.water, 0.2);
  ctx.save();
  ctx.translate(CP.x, CP.y);
  ctx.rotate(a);
  const xa = -LA - 10, xb = EA + 14;
  if (o.glowEnd) {
    ctx.fillStyle = alpha(c.accent, 0.35 * o.glowEnd);
    ctx.beginPath(); ctx.ellipse(EA, -BT / 2, 34, 20, 0, 0, Math.PI * 2); ctx.fill();
  }
  // the claw: flattened and bent a little down at the load end
  ctx.beginPath();
  ctx.moveTo(-LA + 14, -BT);
  ctx.lineTo(xa, -BT + 5);
  ctx.quadraticCurveTo(xa - 10, -BT + 9, xa - 12, 3);
  ctx.lineTo(-LA + 14, 0);
  ctx.closePath();
  ctx.fillStyle = darken(steel, 0.1);
  ctx.fill();
  // body
  ctx.fillStyle = darken(steel, 0.45);
  ctx.beginPath(); ctx.roundRect(-LA + 10, -BT - 1.5, xb - (-LA + 10) + 1.5, BT + 3, 7); ctx.fill();
  ctx.fillStyle = steel;
  ctx.beginPath(); ctx.roundRect(-LA + 10, -BT, xb - (-LA + 10), BT, 6); ctx.fill();
  ctx.fillStyle = darken(steel, 0.25);
  ctx.fillRect(-LA + 12, -BT * 0.38, xb + LA - 16, BT * 0.38);
  ctx.fillStyle = lighten(steel, 0.45);
  ctx.fillRect(-LA + 14, -BT + 3, xb + LA - 20, 3);
  // a grip wrap at the effort end
  const grip = mix(c.bad, c.flame, 0.3);
  ctx.fillStyle = grip;
  ctx.beginPath(); ctx.roundRect(EA - 58, -BT - 2, 72, BT + 4, 6); ctx.fill();
  ctx.fillStyle = darken(grip, 0.3);
  for (let i = 0; i < 6; i++) ctx.fillRect(EA - 52 + i * 11, -BT - 2, 3, BT + 4);
  ctx.fillStyle = lighten(grip, 0.3);
  ctx.fillRect(EA - 56, -BT, 68, 3);
  ctx.restore();
}

function dot(ctx, col, p, r = 7) {
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
}

const A1 = -3 * Math.PI / 180;        // after the push
const F1_LEN = 30, F2_LEN = 150;      // 100 N and 500 N at 0.3 px per N: 1 : 5
const sm = (u) => u * u * (3 - 2 * u);

export class LeverTransferScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A crowbar rests on a small stone with its claw under the edge of a big rock. A student pushes the long end down a long way, d1, with a small force F1. The short end lifts the edge of the rock a little way, d2, with a large force F2. The two distances and the two forces are both in the ratio 5 to 1, the ratio of the arms. With example numbers, F1 x d1 = 100 N x 1 m = 100 J and F2 x d2 = 500 N x 0.2 m = 100 J: the work in equals the work out.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() { this.runT0 = this.age; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') { this.runT0 = this.age; this.animateFor?.(200); }
  }

  t() { return reducedMotion() ? 99 : this.age - (this.runT0 || 0); }

  busy() { return this.t() < (this.stage === 0 ? 2.4 : 1.8); }

  draw(ctx, c) {
    const t = this.t();
    const s = this.stage;
    const u = s === 0 ? sm(clamp01((t - 0.6) / 1.0)) : 1;
    const a = lerp(A0, A1, u);
    drawBackdrop(ctx, c, 'dots');
    ground(ctx, c);
    // the rock tips about its far corner so its near edge stays on the claw
    const T = along(a, -LA, -BT);
    const phi = -(T0.y - T.y) / (T0.x - PIV.x);
    drawShadow(ctx, c, 116, GY + 3, 104 - 30 * u, 9, 1 - 0.3 * u);
    drawShadow(ctx, c, 234, GY + 2, 40, 6, 1);
    if (u > 0.02) this.ghostRock(ctx, c);
    boulder(ctx, c, STONE, { col: mix(c.stroke, c.gold, 0.3), cracks: [[[0.3, 0.5], [0.5, 0.62], [0.7, 0.55]]] });
    ctx.save();
    ctx.translate(PIV.x, PIV.y);
    ctx.rotate(phi);
    ctx.translate(-PIV.x, -PIV.y);
    boulder(ctx, c, ROCK, { cracks: [[[0.2, 0.3], [0.45, 0.42], [0.52, 0.7]], [[0.7, 0.2], [0.8, 0.45]], [[0.15, 0.7], [0.35, 0.8]]] });
    ctx.restore();
    if (u > 0.02) this.ghost(ctx, c);
    // the student's far arm and legs go behind the bar, the near arm in front
    const fig = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: lerp(-8, 22, u), crouch: lerp(0, 0.5, u) }, x: 618,
      feet: [{ x: 596, y: GY }, { x: 640, y: GY }], y: GY, height: 300, facing: -1, mood: 'effort',
      hands: [along(a, EA + 2, -BT / 2), along(a, EA - 26, -BT / 2)],
    });
    fig.look.t = 0;
    drawFigure(ctx, c, fig, fig.look, { between: () => crowbar(ctx, c, a) });
    this.travels(ctx, c, a, u);
    this.forces(ctx, c, a, s === 0 ? clamp01((t - 0.15) / 0.4) : 1);
    if (s === 1) this.sums(ctx, c, t);
  }

  // dashed outlines of the bar and the rock edge where they started
  ghost(ctx, c) {
    ctx.save();
    ctx.translate(CP.x, CP.y);
    ctx.rotate(A0);
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = alpha(c.label, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-LA - 10, -BT, LA + EA + 24, BT, 6); ctx.stroke();
    ctx.restore();
  }

  ghostRock(ctx, c) {
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = alpha(c.label, 0.4);
    ctx.lineWidth = 2;
    poly(ctx, ROCK);
    ctx.stroke();
    ctx.restore();
  }

  // d1 and d2: vertical dashed dimensions, each from where its point started to where it is.
  // Drops are arm x (sin a - sin A0), so d1 : d2 is exactly EA : LA = 5 : 1.
  travels(ctx, c, a, u) {
    if (u <= 0.02) return;
    const dim = (p0, p1, x, col) => {
      ctx.save();
      ctx.strokeStyle = alpha(col, 0.55);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(x, p0.y); ctx.moveTo(p1.x, p1.y); ctx.lineTo(x, p1.y); ctx.stroke();
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      const dir = Math.sign(p1.y - p0.y);
      ctx.beginPath(); ctx.moveTo(x, p0.y); ctx.lineTo(x, p1.y - dir * 10); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x, p1.y); ctx.lineTo(x - 8, p1.y - dir * 13); ctx.lineTo(x + 8, p1.y - dir * 13); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 9, p0.y); ctx.lineTo(x + 9, p0.y); ctx.stroke();
      ctx.restore();
    };
    const E0 = along(A0, EA, 0), E = along(a, EA, 0);
    const L0 = along(A0, -LA, 0), L = along(a, -LA, 0);
    dim(E0, E, E0.x - 62, c.accent);
    dim(L0, L, L0.x - 22, c.bad);
    const k = clamp01((u - 0.8) / 0.2);
    pill(ctx, c, 'd1', E0.x - 100, (E0.y + E.y) / 2, { size: 26, bg: c.accent, alpha: k });
    pill(ctx, c, 'd2', L0.x - 58, (L0.y + L.y) / 2, { size: 26, bg: c.bad, alpha: k });
  }

  forces(ctx, c, a, k) {
    if (k <= 0) return;
    const E = along(a, EA - 12, -BT - 14);
    const T = along(a, -LA, -BT);
    vectorArrow(ctx, c, E.x, E.y - F1_LEN - 3, { angle: Math.PI / 2, length: F1_LEN, col: c.accent, width: 6, head: 14, alpha: k });
    pill(ctx, c, 'F1', E.x - 46, E.y - F1_LEN * 0.5 - 4, { size: 26, bg: c.accent, alpha: k });
    vectorArrow(ctx, c, T.x, T.y, { angle: -Math.PI / 2, length: F2_LEN, col: c.bad, width: 9, head: 20, alpha: k });
    pill(ctx, c, 'F2', T.x + 34, T.y - F2_LEN + 14, { size: 26, bg: c.bad, alpha: k });
  }

  sums(ctx, c, t) {
    const k1 = clamp01((t - 0.3) / 0.35), k2 = clamp01((t - 0.9) / 0.35), k3 = clamp01((t - 1.4) / 0.35);
    const xl = 24;
    if (k1 > 0) drawWorkCounter(ctx, c, { x: xl, y: 40, text: 'F1 x d1 = 100 N x 1 m = 100 J', tone: 'accent', size: 26, align: 'left', alpha: k1 });
    if (k2 > 0) drawWorkCounter(ctx, c, { x: xl, y: 94, text: 'F2 x d2 = 500 N x 0.2 m = 100 J', tone: 'bad', size: 26, align: 'left', alpha: k2 });
    if (k3 > 0) pill(ctx, c, 'example numbers', xl, 148, { size: 26, bg: c.bgSurface, align: 'left', alpha: k3, scale: outBack(k3) });
  }
}
