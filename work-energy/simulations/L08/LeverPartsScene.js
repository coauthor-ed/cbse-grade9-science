// LeverPartsScene - blk-l08-s04 "Parts of a Lever" (book Fig 7.32): a crowbar over a
// small stone (the fulcrum), its flat tip under a big rock.
//   stage 0 (b0, Three points): the fulcrum, the load and the effort light in turn.
//   stage 1 (b1, Two arms): the load arm (fulcrum to load) and the effort arm (fulcrum
//     to effort) measured with brackets along the bar; the rock and the stone stay solid.
// Geometry (shared with LeverTransferScene): fulcrum contact C = (232, 400), load arm
// 72 px, effort arm 360 px, bar at 29 degrees, claw under the rock's undercut edge,
// the student's hands on the grip.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, alpha, luma, lighten, darken, mix, clamp01, vectorArrow, outBack,
} from 'simulations/base/kit/SimLook.js';
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

export class LeverPartsScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A crowbar rests on a small stone with its flat tip under a big rock. The stone is the fulcrum, the fixed point the lever turns about. The load is the force of the rock on the tip. The effort is the push down on the long end. The load arm runs from the fulcrum to the load; the effort arm, much longer, runs from the fulcrum to the effort.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() { this.runT0 = this.age; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') { this.runT0 = this.age; this.animateFor?.(200); }
  }

  t() { return reducedMotion() ? 99 : this.age - (this.runT0 || 0); }

  busy() { return this.t() < (this.stage === 0 ? 2.6 : 1.8); }

  draw(ctx, c) {
    const t = this.t();
    const s = this.stage;
    drawBackdrop(ctx, c, 'dots');
    ground(ctx, c);
    const on = (t0) => clamp01((t - t0) / 0.45);
    const kF = s === 0 ? on(0.3) : 0, kL = s === 0 ? on(1.0) : 0, kE = s === 0 ? on(1.7) : 0;
    drawShadow(ctx, c, 116, GY + 3, 104, 9, 1);
    drawShadow(ctx, c, 234, GY + 2, 40, 6, 1);
    // stone (fulcrum) and its glow; rock and stone stay solid on both beats
    ctx.save();
    if (kF > 0) {
      ctx.fillStyle = alpha(c.good, 0.3 * kF);
      ctx.beginPath(); ctx.ellipse(CP.x, 420, 54, 40, 0, 0, Math.PI * 2); ctx.fill();
    }
    boulder(ctx, c, STONE, { col: mix(c.stroke, c.gold, 0.3), cracks: [[[0.3, 0.5], [0.5, 0.62], [0.7, 0.55]]] });
    ctx.restore();
    ctx.save();
    if (kL > 0) {
      ctx.save();
      poly(ctx, ROCK);
      ctx.strokeStyle = alpha(c.bad, 0.5 * kL);
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.restore();
    }
    boulder(ctx, c, ROCK, { cracks: [[[0.2, 0.3], [0.45, 0.42], [0.52, 0.7]], [[0.7, 0.2], [0.8, 0.45]], [[0.15, 0.7], [0.35, 0.8]]] });
    ctx.restore();
    const fig = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: -8, crouch: 0 }, x: 618,
      feet: [{ x: 596, y: GY }, { x: 640, y: GY }], y: GY, height: 300, facing: -1, mood: s === 0 ? 'effort' : 'smile',
      hands: [along(A0, EA + 2, -BT / 2), along(A0, EA - 26, -BT / 2)],
    });
    fig.look.t = 0;
    drawFigure(ctx, c, fig, fig.look, { between: () => crowbar(ctx, c, A0) });

    const T = along(A0, -LA, -BT);      // load point, on the bar's top under the rock edge
    const E = along(A0, EA - 12, -BT - 14);  // effort point, the hands on the grip
    const F = { x: CP.x, y: CP.y };
    if (s === 0) this.points(ctx, c, T, E, F, kF, kL, kE);
    else this.arms(ctx, c, T, E, F, t);
  }

  points(ctx, c, T, E, F, kF, kL, kE) {
    if (kF > 0) {
      const sc = outBack(kF);
      dot(ctx, c.good, F, 8);
      ctx.save();
      ctx.strokeStyle = alpha(c.good, kF);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(F.x + 20, F.y + 30); ctx.lineTo(F.x + 74, GY + 22); ctx.stroke();
      ctx.restore();
      pill(ctx, c, 'fulcrum', F.x + 74, GY + 40, { size: 26, bg: c.good, scale: sc, align: 'left' });
    }
    if (kL > 0) {
      vectorArrow(ctx, c, T.x + 2, T.y - 92, { angle: Math.PI / 2, length: 88, col: c.bad, width: 6, head: 16, alpha: kL });
      dot(ctx, c.bad, T, 7);
      pill(ctx, c, 'load', T.x - 70, T.y - 110, { size: 26, bg: c.bad, scale: outBack(kL) });
    }
    if (kE > 0) {
      vectorArrow(ctx, c, E.x, E.y - 92, { angle: Math.PI / 2, length: 86, col: c.accent, width: 6, head: 16, alpha: kE });
      pill(ctx, c, 'effort', E.x - 12, E.y - 118, { size: 26, bg: c.accent, scale: outBack(kE) });
    }
  }

  // two brackets along the bar's top side, from the fulcrum to each point
  arms(ctx, c, T, E, F, t) {
    const OFF = -42;
    const kL = clamp01((t - 0.2) / 0.5), kE = clamp01((t - 0.8) / 0.6);
    dot(ctx, c.good, F, 8);
    dot(ctx, c.bad, T, 7);
    const bracket = (d0, d1, col, k) => {
      const a = along(A0, d0, OFF), b = along(A0, d0 + (d1 - d0) * k, OFF);
      const a0 = along(A0, d0, -BT - 4), b0 = along(A0, d0 + (d1 - d0) * k, -BT - 4);
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a.x, a.y); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 4;
      const n = nrmOf(A0);
      for (const p of [a, b]) {
        ctx.beginPath(); ctx.moveTo(p.x - n.x * 10, p.y - n.y * 10); ctx.lineTo(p.x + n.x * 10, p.y + n.y * 10); ctx.stroke();
      }
      ctx.restore();
    };
    if (kL > 0) bracket(0, -LA, c.bad, kL);
    if (kE > 0) bracket(0, EA - 12, c.accent, kE);
    const pL = along(A0, -LA / 2, OFF);
    if (kL >= 1) {
      ctx.save();
      ctx.strokeStyle = c.bad;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(pL.x - 8, pL.y - 8); ctx.lineTo(140, 236); ctx.stroke();
      ctx.restore();
      pill(ctx, c, 'load arm', 130, 222, { size: 26, bg: c.bad, scale: outBack(clamp01((t - 0.7) / 0.35)) });
    }
    const pE = along(A0, EA * 0.42, OFF - 66);
    if (kE >= 1) pill(ctx, c, 'effort arm', pE.x, pE.y, { size: 26, bg: c.accent, scale: outBack(clamp01((t - 1.4) / 0.35)) });
  }
}
