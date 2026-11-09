import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, clamp01,
  mix, lighten, darken, rr, ellipse,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';

// PlaygroundTracksScene-closing - blk-l09-s11, The Playground Again (book p 116).
// b0: the chapter's first playground: one deck, three slides (a blue spiral,
//     a red straight slide, a purple wavy one), all starting at h = 1.8 m.
//     Three children of different mass slide down together. No friction:
//     each child's speed comes from v^2 = 2 g (height dropped), so they reach
//     the foot at different times but every one arrives at sqrt(2gh) = 6.0 m/s.
//     Each child has K, U, heat-and-sound bars: U drains into K, heat stays 0.
// b1: the same run with friction: a little energy goes to heat and sound on
//     the way (more on the longer slide), so the speeds at the foot are a bit
//     lower (example numbers, said so on screen); the dashed total stays.
// Tap: slide again.

const G = 10, H0 = 1.8;
const V_FREE = Math.sqrt(2 * G * H0);         // 6.0 m/s
const SQRT = String.fromCharCode(8730);
const GRASS_Y = 300, DECK_Y = 104, DECK_H = 14;
const TOP_Y = DECK_Y + DECK_H;                // 118: where every slide starts
const PXM = (GRASS_Y - TOP_Y) / H0;           // px per metre on this picture
const SLOW = 0.5;                             // the run is shown at half speed
const TAG_Y = 322;
const BAR_Y = 340;

// Each slide as a dense polyline (x, y) from the deck to its foot on the grass.
function spiralPts() {
  const pts = [], TURNS = 1.75, cx = 108;
  for (let i = 0; i <= 160; i++) {
    const u = i / 160, a = u * TURNS * Math.PI * 2;
    const r = 48 - 18 * u;
    pts.push([cx + r * Math.cos(a), TOP_Y + u * (GRASS_Y - 22 - TOP_Y)]);
  }
  for (let i = 1; i <= 12; i++) {
    const u = i / 12;
    pts.push([cx + 46 * u, GRASS_Y - 22 + 20 * Math.sin(u * Math.PI / 2)]);
  }
  return pts;
}
function straightPts() {
  const pts = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([274 + 74 * u, TOP_Y + u * (GRASS_Y - 16 - TOP_Y)]); }
  for (let i = 1; i <= 10; i++) { const u = i / 10; pts.push([348 + 34 * u, GRASS_Y - 16 + 14 * Math.sin(u * Math.PI / 2)]); }
  return pts;
}
function wavyPts() {
  const pts = [];
  for (let i = 0; i <= 140; i++) {
    const u = i / 140;
    const base = (GRASS_Y - 14 - TOP_Y) * (u + (0.3 / Math.PI) * Math.sin(u * Math.PI * 2));
    const damp = Math.min(1, u / 0.1) * Math.min(1, (1 - u) / 0.15);
    pts.push([470 + 118 * u, TOP_Y + base - 20 * damp * Math.sin(u * Math.PI * 4)]);
  }
  for (let i = 1; i <= 8; i++) { const u = i / 8; pts.push([588 + 22 * u, GRASS_Y - 14 + 12 * Math.sin(u * Math.PI / 2)]); }
  return pts;
}
function withArc(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, s, len: s[s.length - 1] };
}
function at(tr, d) {
  const { pts, s } = tr;
  d = Math.max(0, Math.min(tr.len, d));
  let i = 1;
  while (i < s.length - 1 && s[i] < d) i++;
  const k = (d - s[i - 1]) / Math.max(1e-6, s[i] - s[i - 1]);
  const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
  return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, ang: Math.atan2(by - ay, bx - ax) };
}

// lanes: colour, track, the child's mass and height, and (b1) the share of the
// start energy that is still kinetic at the foot (example numbers)
const LANES = [
  { key: 'spiral', col: 's1', tr: withArc(spiralPts()), kg: 20, ht: 62, keep: 0.8, roof: 's1' },
  { key: 'straight', col: 's6', tr: withArc(straightPts()), kg: 45, ht: 72, keep: 0.9, roof: 's6' },
  { key: 'wavy', col: 's5', tr: withArc(wavyPts()), kg: 30, ht: 66, keep: 0.85, roof: 's5' },
];
const PANEL_X = [4, 229, 454];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class PlaygroundTracksScene_closing extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'The playground from the start of the chapter: one deck 1.8 m above the grass with three slides, a blue spiral, a red straight slide and a purple wavy slide. Three children of 20 kg, 45 kg and 30 kg slide down together. Without friction each reaches the bottom at v = square root of 2gh = 6.0 m/s, at different times but with the same speed; each child has energy bars where potential energy U turns into kinetic energy K. Then the same run on real slides: a little energy turns into heat and sound on the way, more on the long spiral, so the speeds at the bottom are a bit lower, about 5.4, 5.7 and 5.5 m/s in this example, and the total stays the same.';

  enter() {
    this.runs = LANES.map(() => ({ d: 0, v: 0, done: false }));
    this.restT = 0;
  }

  pointerDown() {
    this.enter();
    this.animateFor(600);
  }

  // friction loss per px of slide (in v^2 units), set so the foot keeps `keep`
  loss(lane) {
    if (this.stage < 1) return 0;
    return (1 - lane.keep) * 2 * G * H0 / lane.tr.len;
  }

  update(d) {
    if (!this.runs) this.enter();
    const dt = d * SLOW;
    let all = true;
    LANES.forEach((lane, i) => {
      const r = this.runs[i];
      if (r.done) return;
      all = false;
      // a few small steps per frame: v from energy, never integrated by force
      for (let k = 0; k < 4; k++) {
        const p = at(lane.tr, r.d);
        const v2 = 2 * G * (p.y - TOP_Y) / PXM - this.loss(lane) * r.d;
        r.v = Math.sqrt(Math.max(0.09, v2));
        r.d += r.v * PXM * dt / 4;
        if (r.d >= lane.tr.len) { r.d = lane.tr.len; r.done = true; break; }
      }
    });
    if (all) this.restT = Math.min(0.6, this.restT + d);
  }

  busy() { return !this.runs || this.runs.some((r) => !r.done) || this.restT < 0.6; }

  footV(lane) { return this.stage < 1 ? V_FREE : V_FREE * Math.sqrt(lane.keep); }

  draw(ctx, c) {
    if (!this.runs) this.enter();
    drawBackdrop(ctx, c, 'sky');
    this.yard(ctx, c);
    drawFloor(ctx, c, GRASS_Y, { col: c.s3 });
    this.frame(ctx, c);
    LANES.forEach((lane) => this.slide(ctx, c, lane));
    this.deck(ctx, c);
    this.heightMark(ctx, c);
    LANES.forEach((lane, i) => this.child(ctx, c, lane, this.runs[i], i));
    // bars first: each tag row is laid out on its bar panel's real width
    const panels = LANES.map((lane, i) => this.bars(ctx, c, lane, this.runs[i], i));
    LANES.forEach((lane, i) => this.tags(ctx, c, lane, this.runs[i], panels[i]));
    if (this.stage < 1) pill(ctx, c, `v = ${SQRT}(2gh) = 6.0 m/s`, 340, 30, { bg: c.s1, size: 24 });
    else pill(ctx, c, 'real slides: example speeds', 340, 30, { bg: c.s8, size: 24 });
  }

  // trees and a hedge behind the playground, as on the book's page
  yard(ctx, c) {
    const leaf = mix(c.s3, c.bgDeep, 0.35);
    const bark = darken(mix(c.s8, c.gold, 0.3), 0.4);
    ctx.save();
    for (let x = -10; x < W + 40; x += 46) {
      ctx.fillStyle = mix(leaf, c.bgSurface, 0.25);
      ellipse(ctx, x + 14, GRASS_Y - 12, 30, 24);
      ctx.fill();
      ctx.fillStyle = darken(leaf, 0.12);
      ellipse(ctx, x + 22, GRASS_Y - 6, 22, 14);
      ctx.fill();
    }
    for (const [x, top, r] of [[226, 150, 36], [648, 160, 30]]) {
      ctx.fillStyle = bark;
      ctx.fillRect(x - 5, top + r * 0.4, 10, GRASS_Y - 20 - top - r * 0.4);
      for (const [dx, dy, k, sh] of [[0, 0, 1, 0], [-r * 0.6, r * 0.5, 0.62, 0], [r * 0.55, r * 0.45, 0.66, 0.15], [0, r * 0.7, 0.7, 0.1]]) {
        ctx.fillStyle = darken(leaf, sh);
        ctx.beginPath(); ctx.arc(x + dx, top + dy, r * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = lighten(leaf, 0.2);
      ctx.beginPath(); ctx.arc(x - r * 0.3, top - r * 0.25, r * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // posts and two canopies: the play structure
  frame(ctx, c) {
    const post = mix(c.bgSurface, c.label, 0.3);
    ctx.save();
    for (const x of [56, 184, 252, 432, 496, 620]) {
      ctx.fillStyle = post;
      ctx.fillRect(x - 5, 40, 10, GRASS_Y - 40);
      ctx.fillStyle = lighten(post, 0.3);
      ctx.fillRect(x - 5, 40, 3, GRASS_Y - 40);
      ctx.fillStyle = darken(post, 0.25);
      ctx.fillRect(x + 2, 40, 3, GRASS_Y - 40);
      drawShadow(ctx, c, x, GRASS_Y + 1, 12, 3, 0.6);
    }
    for (const [x0, x1, col] of [[40, 200, 's1'], [480, 636, 's6']]) {
      const cc = c[col];
      ctx.fillStyle = cc;
      ctx.beginPath(); ctx.moveTo(x0, 52); ctx.lineTo(x0 + 26, 24); ctx.lineTo(x1 - 26, 24); ctx.lineTo(x1, 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = darken(cc, 0.22);
      ctx.beginPath(); ctx.moveTo((x0 + x1) / 2 + 20, 24); ctx.lineTo(x1 - 26, 24); ctx.lineTo(x1, 52); ctx.lineTo((x0 + x1) / 2 + 30, 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = lighten(cc, 0.3);
      ctx.fillRect(x0 + 28, 25, (x1 - x0) * 0.35, 3);
      ctx.fillStyle = darken(cc, 0.3);
      ctx.fillRect(x0, 52, x1 - x0, 5);
    }
    ctx.restore();
  }

  deck(ctx, c) {
    const deck = mix(c.s5, c.bgSurface, 0.45);
    ctx.save();
    // rail with diagonal bars
    ctx.strokeStyle = mix(c.s5, c.bgSurface, 0.3);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(56, DECK_Y - 30); ctx.lineTo(620, DECK_Y - 30);
    for (let x = 64; x < 612; x += 30) { ctx.moveTo(x, DECK_Y - 2); ctx.lineTo(x + 18, DECK_Y - 30); }
    ctx.stroke();
    rr(ctx, 40, DECK_Y, 600, DECK_H, 4);
    ctx.fillStyle = deck;
    ctx.fill();
    ctx.fillStyle = lighten(deck, 0.3);
    ctx.fillRect(44, DECK_Y + 1, 592, 3);
    ctx.fillStyle = darken(deck, 0.25);
    ctx.fillRect(44, DECK_Y + DECK_H - 4, 592, 4);
    ctx.restore();
  }

  slide(ctx, c, lane) {
    const { pts } = lane.tr;
    const col = c[lane.col];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pass = (dy, w, s) => {
      ctx.strokeStyle = s; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] + dy);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + dy);
      ctx.stroke();
    };
    pass(4, 16, darken(col, 0.35));
    pass(0, 14, col);
    pass(-4, 4, lighten(col, 0.35));
    // the foot of each slide rests on a small block
    const [fx, fy] = pts[pts.length - 1];
    ctx.fillStyle = darken(col, 0.3);
    rr(ctx, fx - 10, fy - 2, 18, GRASS_Y - fy + 4, 3);
    ctx.fill();
    ctx.restore();
  }

  heightMark(ctx, c) {
    const x = 14;
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(x, TOP_Y); ctx.lineTo(x, GRASS_Y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x - 8, TOP_Y); ctx.lineTo(x + 18, TOP_Y); ctx.moveTo(x - 8, GRASS_Y); ctx.lineTo(x + 8, GRASS_Y); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(x + 18, (TOP_Y + GRASS_Y) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = font(c, 800, 26, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label;
    ctx.fillText('h = 1.8 m', 0, 0);
    ctx.restore();
  }

  child(ctx, c, lane, run, i) {
    const p = at(lane.tr, run.d);
    const q = at(lane.tr, run.d + lane.ht * 0.5);
    const dx = q.x - p.x;
    const facing = Math.abs(dx) < 2 ? (run.facing ?? 1) : Math.sign(dx);
    run.facing = facing;
    const hip = { x: p.x, y: p.y - 6 };
    const foot = { x: q.x, y: q.y - 5 };
    const spec = figureFor(this, {
      role: 'child', pose: 'sit', x: p.x, y: p.y, height: lane.ht, facing, i: i + 2,
      hip, feet: [foot, { x: foot.x - facing * 4, y: foot.y }],
      hands: [{ x: p.x + facing * 6, y: p.y - 4 }, { x: p.x - facing * 4, y: p.y - 4 }],
    });
    drawFigure(ctx, c, spec, spec.look, { noShadow: !run.done });
  }

  // mass at the panel's left edge, the foot speed at its right edge
  tags(ctx, c, lane, run, panel) {
    pill(ctx, c, `${lane.kg} kg`, panel.x0 + 2, TAG_Y, { bg: c.s2, size: 24, align: 'left' });
    if (run.done) {
      const v = this.footV(lane);
      pill(ctx, c, `${v.toFixed(1)} m/s`, panel.x0 + panel.w - 2, TAG_Y, { bg: this.stage < 1 ? c.s1 : c.s8, size: 24, align: 'right' });
    }
  }

  bars(ctx, c, lane, run, i) {
    const p = at(lane.tr, run.d);
    const U = clamp01((GRASS_Y - p.y) / (GRASS_Y - TOP_Y));
    const heat = this.loss(lane) * run.d / (2 * G * H0);
    const K = Math.max(0, 1 - U - heat);
    return drawEnergyBars(ctx, c, {
      x: PANEL_X[i], y: BAR_Y, h: 70, barW: 34, gap: 12, max: 1, total: 1, size: 24, minSize: 24,
      values: { K, U, heat },
    });
  }
}
