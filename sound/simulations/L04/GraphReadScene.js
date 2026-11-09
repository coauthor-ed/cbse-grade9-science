// GraphReadScene.js - slide "Reading a Wave Graph" (blk-l04-n02, 2 beats). New 2026-11-03.
// Book Fig 10.22 (Example 10.4): density against distance for a sound wave in steel, on green graph paper,
// distance ticks 0, 25, 50, 75 m. The curve starts at the average density rising, crests at 12.5 m and
// 62.5 m, troughs at 37.5 m and 87.5 m, as the book draws it. The lambda bracket joins the two crests the
// kit graph FOUND in that density, so its 50 m is read off the graph, not typed beside it.
// b0 the graph, the lambda bracket "lambda = 50 m", the tag "steel: 5000 m/s".
// b1 the graph stays; the two result lines appear one after the other.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha, lighten, darken, mix, rr } from 'simulations/base/kit/SimLook.js';
import { drawDensityGraph } from 'simulations/base/kit/SimWave.js';

const GX = 96, GW = 540, GY = 74, GH = 230;
const METRES = 100, PXM = GW / METRES, LAM_M = 50, LAM = LAM_M * PXM;
// The book's curve: average density at 0 m, rising; a static graph, so the time argument is ignored.
const GRAPH = { origin: GX, dir: 1, xAt: (d) => GX + d, rhoLin: (d) => 1 + 0.55 * Math.sin((2 * Math.PI * d) / LAM) };
const RANGE = [0.25, 2.25];                     // headroom above the crests for the bracket
const LAM_S = '\u03bb', NU_S = '\u03bd';

const ramp = (a, t0, dur) => Math.max(0, Math.min(1, (a - t0) / dur));

export class GraphReadScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A green graph of density against distance in metres for a sound wave in steel, with ticks at '
    + '0, 25, 50 and 75 metres. The curve has crests at 12.5 and 62.5 metres; a bracket from one crest to the next '
    + 'reads lambda equals 50 metres. A tag reads steel, 5000 metres per second. Then two lines appear under the '
    + 'graph: nu equals 5000 divided by 50 equals 100 hertz, and T equals 1 divided by 100 equals 0.01 seconds.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage === 0 ? this.t() < 1.6 : this.t() < 2.0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const a = this.t();
    const g = drawDensityGraph(ctx, c, { x: GX, y: GY, w: GW, h: GH, field: GRAPH, t: 0, linear: true, range: RANGE,
      axes: { y: 'density' }, progress: this.stage === 0 ? ramp(a, 0, 0.9) : 1 });
    this.ticks(ctx, c);
    pill(ctx, c, 'steel: 5000 m/s', GX + GW, GY - 26, { bg: c.raised, size: 26, display: true, align: 'right' });
    const [p, q] = g.crests;
    const u = this.stage === 0 ? ramp(a, 0.9, 0.6) : 1;
    if (p && q) this.bracket(ctx, c, p.x, q.x, p.y, p.y - 44, LAM_S + ' = 50 m', u);
    if (this.stage >= 1) {
      this.card(ctx, c, 92, 388, 496, 152);
      this.line(ctx, c, [[NU_S, c.s2ink], [' = 5000 \u00f7 50 = ', c.label], ['100 Hz', c.s2ink]], 430, ramp(a, 0.2, 0.5));
      this.line(ctx, c, [['T', c.s6ink], [' = 1 \u00f7 100 = ', c.label], ['0.01 s', c.s6ink]], 498, ramp(a, 1.1, 0.5));
    }
    this.probeOut = { crestsM: g.crests.map((k) => +((k.x - GX) / PXM).toFixed(1)),
      lamM: p && q ? +((q.x - p.x) / PXM).toFixed(1) : null };
  }

  /** Distance ticks at 0, 25, 50, 75 m under the axis, and the axis words, as Fig 10.22 prints them. */
  ticks(ctx, c) {
    const y = GY + GH;
    ctx.save(); ctx.strokeStyle = c.label; ctx.lineWidth = 2.5; ctx.fillStyle = c.label;
    ctx.font = font(c, 700, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const m of [0, 25, 50, 75]) {
      const x = GX + m * PXM;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 9); ctx.stroke();
      ctx.fillText(String(m), x, y + 13);
    }
    ctx.textAlign = 'right'; ctx.fillText('distance (m)', GX + GW + 22, y + 48);
    ctx.restore();
  }

  /** A dimension bracket between two crests: dashed ticks up from them, a double arrow, its tag in a gap. */
  bracket(ctx, c, x1, x2, y0, by, label, u) {
    if (u <= 0) return;
    const xe = x1 + (x2 - x1) * u, mid = (x1 + x2) / 2, gap = u >= 1 ? 74 : 0;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y0 - 9); ctx.lineTo(x1, by - 8);
    if (u >= 1) { ctx.moveTo(x2, y0 - 9); ctx.lineTo(x2, by - 8); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    if (gap) { ctx.moveTo(x1 + 3, by); ctx.lineTo(mid - gap, by); ctx.moveTo(mid + gap, by); ctx.lineTo(x2 - 3, by); }
    else { ctx.moveTo(x1 + 3, by); ctx.lineTo(xe, by); }
    ctx.stroke();
    const head = (x, s) => { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x - s * 11, by - 6); ctx.lineTo(x - s * 11, by + 6); ctx.closePath(); ctx.fill(); };
    head(x1, -1); head(xe, 1);
    ctx.restore();
    if (gap) pill(ctx, c, label, mid, by, { bg: c.s5, size: 28, display: true });
  }

  /** A raised card for the two results: a soft drop shadow, a lit top. */
  card(ctx, c, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = alpha(darken(c.raised, 0.5), 0.25); rr(ctx, x + 4, y + 7, w, h, 20); ctx.fill();
    const gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, lighten(c.raised, 0.08)); gr.addColorStop(1, mix(c.raised, c.bgSurface, 0.35));
    ctx.fillStyle = gr; rr(ctx, x, y, w, h, 20); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  /** One result line in coloured runs, centred, sliding up a little as it fades in. */
  line(ctx, c, runs, y, u) {
    if (u <= 0) return;
    ctx.save(); ctx.globalAlpha = u; ctx.font = font(c, 700, 40, true); ctx.textBaseline = 'middle';
    const total = runs.reduce((s, [txt]) => s + ctx.measureText(txt).width, 0);
    let x = 340 - total / 2;
    for (const [txt, col] of runs) { ctx.fillStyle = col; ctx.fillText(txt, x, y + (1 - u) * 8); x += ctx.measureText(txt).width; }
    ctx.restore();
  }
}
