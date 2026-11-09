// ForceDisplacementAreaScene.js - work as an area (blk-l01-s08, 2 beats), rebuilt on canvas.
//   stage 0: a steady 10 N over 1 m: a flat line, the rectangle under it fills, "10 J".
//   stage 1: a changing force (book Fig 7.37 shape): 0 to 50 N over 0-1 m, flat 50 N to 3 m,
//            back to 0 at 4 m. The three pieces light in turn: 25 J, 100 J, 25 J.
//            Then the sum is set up, "25 J + 100 J + 25 J = ?", to show the
//            adding; the total itself is NOT shown, because the very next item
//            (q-l01-s04) asks for exactly this graph's total.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, pill, font, alpha, lighten, darken,
  clamp01, popAt,
} from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const OX = 112, OY = 430; // origin
const PW = 520, PH = 290; // plot size
// per stage: axis ranges and ticks
const AX = [
  { xMax: 2, yMax: 15, xt: [0, 1, 2], yt: [0, 5, 10, 15] },
  { xMax: 4, yMax: 56, xt: [0, 1, 2, 3, 4], yt: [0, 10, 20, 30, 40, 50] },
];
// stage 1 line and its three pieces
const LINE1 = [[0, 0], [1, 50], [3, 50], [4, 0]];
const PIECES = [
  { poly: [[0, 0], [1, 50], [1, 0]], at: 1.3, text: '25 J', lab: [0.7, 9], tone: 's1' },
  { poly: [[1, 0], [1, 50], [3, 50], [3, 0]], at: 1.9, text: '100 J', lab: [2, 25], tone: 's3' },
  { poly: [[3, 0], [3, 50], [4, 0]], at: 2.5, text: '25 J', lab: [3.3, 9], tone: 's1' },
];
const LINE_S = [0.3, 1.2]; // line draws on
const SUM_AT = 3.1;        // the sum pill pops after the three pieces

export class ForceDisplacementAreaScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A graph with force in newtons going up and displacement in metres going across. A steady force of 10 N over 1 m is a flat line with a rectangle under it of area 10 J. Then a changing force rises from 0 to 50 N over the first metre, stays at 50 N to 3 m, and falls to 0 at 4 m; its area splits into a triangle of 25 J, a rectangle of 100 J and a triangle of 25 J, and the three are set up to be added: 25 J + 100 J + 25 J.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() {
    this.runT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.runT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.runT0 || 0);
  }

  st() {
    return this.stage === 1 ? 1 : 0;
  }

  busy() {
    return this.t() < (this.st() === 0 ? 2.4 : SUM_AT + 0.7);
  }

  px(s, x) { return OX + (x / AX[s].xMax) * PW; }
  py(s, y) { return OY - (y / AX[s].yMax) * PH; }

  draw(ctx, c) {
    const s = this.st();
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    this.board(ctx, c);
    this.axes(ctx, c, s);
    if (s === 0) this.steady(ctx, c, t);
    else this.changing(ctx, c, t);
  }

  // a light card under the graph so the plot reads as a page, not floating lines
  board(ctx, c) {
    ctx.save();
    ctx.fillStyle = darken(c.bgSurface, 0.08);
    ctx.beginPath(); ctx.roundRect(24, 58, W - 48, H - 62, 18); ctx.fill();
    ctx.fillStyle = c.bgSurface;
    ctx.beginPath(); ctx.roundRect(24, 54, W - 48, H - 64, 18); ctx.fill();
    ctx.restore();
  }

  axes(ctx, c, s) {
    const A = AX[s];
    ctx.save();
    // grid
    ctx.strokeStyle = alpha(c.stroke, 0.45); ctx.lineWidth = 2;
    for (const v of A.yt) {
      if (!v) continue;
      ctx.beginPath(); ctx.moveTo(OX, this.py(s, v)); ctx.lineTo(OX + PW, this.py(s, v)); ctx.stroke();
    }
    for (const v of A.xt) {
      if (!v) continue;
      ctx.beginPath(); ctx.moveTo(this.px(s, v), OY); ctx.lineTo(this.px(s, v), OY - PH); ctx.stroke();
    }
    // axes with arrowheads
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(OX, OY); ctx.lineTo(OX + PW + 26, OY); ctx.moveTo(OX, OY); ctx.lineTo(OX, OY - PH - 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(OX + PW + 36, OY); ctx.lineTo(OX + PW + 22, OY - 7); ctx.lineTo(OX + PW + 22, OY + 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(OX, OY - PH - 36); ctx.lineTo(OX - 7, OY - PH - 22); ctx.lineTo(OX + 7, OY - PH - 22); ctx.fill();
    // tick numbers
    ctx.font = font(c, 700, 26, true); ctx.fillStyle = c.labelMuted;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of A.yt) ctx.fillText(String(v), OX - 10, this.py(s, v));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const v of A.xt) if (v) ctx.fillText(String(v), this.px(s, v), OY + 8);
    // axis titles
    ctx.fillStyle = c.label;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('force (N)', OX + 16, OY - PH - 26);
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('displacement (m)', OX + PW + 30, OY + 42);
    ctx.restore();
  }

  fillPoly(ctx, c, s, poly, col, a) {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(this.px(s, x), this.py(s, y)) : ctx.moveTo(this.px(s, x), this.py(s, y))));
    ctx.closePath();
    const xs = poly.map((p) => this.px(s, p[0]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, alpha(lighten(col, 0.15), 0.8));
    g.addColorStop(0.7, alpha(col, 0.75));
    g.addColorStop(1, alpha(darken(col, 0.15), 0.85));
    ctx.fillStyle = g;
    ctx.fill();
    // hatch: thin diagonal lines inside, so the area reads as a surface
    ctx.clip();
    ctx.strokeStyle = alpha(darken(col, 0.2), 0.35); ctx.lineWidth = 2;
    for (let x = x0 - PH; x < x1; x += 16) { ctx.beginPath(); ctx.moveTo(x, OY); ctx.lineTo(x + PH, OY - PH); ctx.stroke(); }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = darken(col, 0.2); ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(this.px(s, x), this.py(s, y)) : ctx.moveTo(this.px(s, x), this.py(s, y))));
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // the force line, drawn on along its length up to fraction u
  line(ctx, c, s, pts, u) {
    const P = pts.map(([x, y]) => [this.px(s, x), this.py(s, y)]);
    const seg = [];
    let total = 0;
    for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); total += d; }
    let left = total * u;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [w, col] of [[11, darken(c.accent, 0.3)], [7, c.accent]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      let rem = left;
      for (let i = 1; i < P.length && rem > 0; i++) {
        const k = Math.min(1, rem / seg[i - 1]);
        ctx.lineTo(P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k);
        rem -= seg[i - 1];
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  steady(ctx, c, t) {
    const u = clamp01((t - LINE_S[0]) / (LINE_S[1] - LINE_S[0]));
    const f = clamp01((t - 1.3) / 0.5);
    if (f > 0) this.fillPoly(ctx, c, 0, [[0, 0], [0, 10], [1, 10], [1, 0]], c.s1, f);
    this.line(ctx, c, 0, [[0, 10], [1, 10]], u);
    const p = popAt(t - 1.8, 0);
    if (p) pill(ctx, c, '10 J', this.px(0, 0.5), this.py(0, 5), { size: 36, bg: c.gold, scale: p.scale, alpha: p.alpha, pop: p.u });
  }

  changing(ctx, c, t) {
    const u = clamp01((t - LINE_S[0]) / (LINE_S[1] - LINE_S[0]));
    for (const pc of PIECES) {
      const f = clamp01((t - pc.at) / 0.45);
      if (f > 0) this.fillPoly(ctx, c, 1, pc.poly, c[pc.tone], f);
    }
    this.line(ctx, c, 1, LINE1, u);
    for (const pc of PIECES) {
      const p = popAt(t - pc.at - 0.2, 0);
      if (p) pill(ctx, c, pc.text, this.px(1, pc.lab[0]), this.py(1, pc.lab[1]), { size: 26, bg: c.gold, scale: p.scale, alpha: p.alpha, pop: p.u });
    }
    // add the areas: the sum is set up above the graph, the answer left to the learner
    const q = popAt(t - SUM_AT, 0);
    if (q) pill(ctx, c, '25 J + 100 J + 25 J = ?', this.px(1, 2.6), 98, { size: 26, bg: c.gold, scale: q.scale, alpha: q.alpha, pop: q.u });
  }
}
