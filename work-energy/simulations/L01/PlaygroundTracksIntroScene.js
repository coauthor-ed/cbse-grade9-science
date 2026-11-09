// PlaygroundTracksIntroScene.js - the chapter's front page (blk-l01-s01, 2 beats).
// Beat 0: one platform, three slides to the ground (blue curls round, red goes
// straight down, purple waves), three children at the top, one per slide.
// Beat 1: three short question tags, each pinned at a slide's foot. No answers,
// no readings: the chapter answers them later.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, chipSize, font, alpha, lighten, darken, mix, rr, ellipse,
  clamp01, popAt,
} from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawPlaygroundKid } from './PlaygroundKids.js';

const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const GRASS_Y = 432;
const DECK_Y = 170, DECK_H = 18;
const TOP = DECK_Y + DECK_H;
const DECK_X0 = 40, DECK_X1 = 520;
const LEGS = [[56, 72], [292, 308], [500, 516]];
const KID_H = 78;

// The three slides, left to right as in the book's picture. head = where the
// child stands; foot = where the slide meets the grass.
const SLIDES = [
  { key: 'blue', col: 's7', head: 150, foot: 104, q: 'speed?' },
  { key: 'red', col: 's6', head: 336, foot: 374, q: 'heavy vs light?' },
  { key: 'purple', col: 's5', head: 470, foot: 640, q: 'which is fastest?' },
];

const DRAW_S = 0.6; // one slide drawing on
const TAG_GAP = 0.45; // tags pop one after another
const TAG_Y = 478;

// Each slide as a list of points from its head (on the deck) to its foot (on
// the grass, with a short run-out). The spiral carries a depth flag per point
// so its back half is drawn behind the front half.
function slidePts(i) {
  const pts = [];
  const drop = GRASS_Y - TOP;
  if (i === 0) {
    const cx = 110, TURNS = 1.75;
    for (let k = 0; k <= 160; k++) {
      const u = k / 160;
      const a = -0.25 * Math.PI * 2 + u * TURNS * Math.PI * 2;
      const r = 62 - 18 * u;
      const y = TOP + 8 + u * (drop - 46);
      pts.push({ x: cx + r * Math.cos(a + Math.PI / 2) * -1, y: y + r * 0.18 * Math.sin(a + Math.PI / 2), far: Math.sin(a + Math.PI / 2) < 0 });
    }
    // run-out to the grass
    const last = pts[pts.length - 1];
    for (let k = 1; k <= 12; k++) {
      const u = k / 12;
      pts.push({ x: last.x + (SLIDES[0].foot - last.x) * u, y: last.y + (GRASS_Y - 12 - last.y) * Math.sin(u * Math.PI / 2), far: false });
    }
  } else if (i === 1) {
    const x0 = SLIDES[1].head + 10, x1 = SLIDES[1].foot - 30;
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      pts.push({ x: x0 + (x1 - x0) * u, y: TOP + 4 + (GRASS_Y - 30 - TOP) * u, far: false });
    }
    for (let k = 1; k <= 10; k++) {
      const u = k / 10;
      pts.push({ x: x1 + 50 * u, y: GRASS_Y - 30 + 18 * Math.sin(u * Math.PI / 2), far: false });
    }
  } else {
    const x0 = SLIDES[2].head + 18, x1 = SLIDES[2].foot;
    for (let k = 0; k <= 140; k++) {
      const u = k / 140;
      const base = (drop - 14) * (u + (0.28 / Math.PI) * Math.sin(u * Math.PI * 2));
      const damp = Math.min(1, u / 0.12) * Math.min(1, (1 - u) / 0.18);
      pts.push({ x: x0 + (x1 - x0) * u, y: TOP + 4 + base - 26 * damp * Math.sin(u * Math.PI * 4), far: false });
    }
  }
  return pts;
}

const PTS = SLIDES.map((_, i) => slidePts(i));

function strokePts(ctx, pts, n, filter) {
  ctx.beginPath();
  let pen = false;
  for (let k = 0; k < n; k++) {
    const p = pts[k];
    if (filter && !filter(p, k)) { pen = false; continue; }
    if (!pen) { ctx.moveTo(p.x, p.y); pen = true; } else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

export class PlaygroundTracksIntroScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A playground: one raised platform with three slides to the ground. The blue slide curls round, the red slide goes straight down and the purple slide waves. Three children stand at the top, one at each slide. Then three questions appear at the foot of the slides: speed, heavy versus light, and which is fastest.';
  static CONTROLS = [];

  enter() {}

  beatOf() {
    return this.stage === 1 ? 1 : 0;
  }

  t() {
    return reducedMotion() ? 99 : this.age;
  }

  busy() {
    return this.t() < (this.beatOf() === 0 ? DRAW_S * 3 + 0.3 : TAG_GAP * 3 + 0.5);
  }

  draw(ctx, c) {
    const b = this.beatOf();
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    this.sky(ctx, c);
    this.yard(ctx, c);
    drawFloor(ctx, c, GRASS_Y, {});
    this.grass(ctx, c);
    this.structure(ctx, c, 'back');
    for (let i = 0; i < 3; i++) {
      // beat 0: each slide draws on in turn; beat 1: all there
      const u = b === 0 ? clamp01((t - i * DRAW_S) / DRAW_S) : 1;
      this.slide(ctx, c, i, u);
    }
    this.structure(ctx, c, 'front');
    for (let i = 0; i < 3; i++) {
      const s = SLIDES[i];
      const x = s.head + (i === 0 ? 0 : i === 1 ? -6 : -10);
      drawShadow(ctx, c, x, TOP - DECK_H + 2, 16, 3, 0.5);
      drawPlaygroundKid(ctx, c, i, x, DECK_Y + 1, KID_H, { t: this.clock + i * 1.3 });
    }
    this.rail(ctx, c);
    if (b === 1) this.tags(ctx, c, t);
  }

  // A sun and soft clouds: weather, not a bare band.
  sky(ctx, c) {
    ctx.save();
    ctx.fillStyle = alpha(c.gold, 0.18);
    ctx.beginPath(); ctx.arc(610, 78, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(c.gold, 0.7);
    ctx.beginPath(); ctx.arc(610, 78, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.gold, 0.4), 0.8);
    ctx.beginPath(); ctx.arc(604, 72, 9, 0, Math.PI * 2); ctx.fill();
    for (const [x, y, r] of [[200, 70, 28], [400, 54, 22], [70, 96, 18], [520, 124, 16]]) {
      ctx.fillStyle = alpha(c.label, 0.1);
      ellipse(ctx, x, y + 3, r * 1.2, r * 0.42); ctx.fill();
      ctx.fillStyle = alpha(c.bgSurface, 0.85);
      ellipse(ctx, x, y, r, r * 0.44); ctx.fill();
      ellipse(ctx, x + r * 0.72, y + 5, r * 0.56, r * 0.3); ctx.fill();
      ellipse(ctx, x - r * 0.62, y + 6, r * 0.5, r * 0.26); ctx.fill();
    }
    ctx.restore();
  }

  // Trees and a hedge behind the play structure (the book has trees at both ends).
  yard(ctx, c) {
    const leaf = mix(c.good, c.bgDeep, 0.35);
    const leafLit = lighten(leaf, 0.18);
    const leafDeep = darken(leaf, 0.2);
    const bark = mix(c.gold, c.bgDeep, 0.45);
    ctx.save();
    for (let x = -10; x < W + 40; x += 46) {
      ctx.fillStyle = leafDeep;
      ellipse(ctx, x + 18, GRASS_Y - 12, 30, 26); ctx.fill();
      ctx.fillStyle = alpha(leafLit, 0.6);
      ellipse(ctx, x + 10, GRASS_Y - 22, 12, 9); ctx.fill();
    }
    for (const [x, top, r] of [[22, 250, 34], [600, 236, 40], [664, 272, 28]]) {
      ctx.fillStyle = darken(bark, 0.1);
      ctx.fillRect(x - 6, top + r * 0.4, 12, GRASS_Y - top - r * 0.4);
      ctx.fillStyle = lighten(bark, 0.15);
      ctx.fillRect(x - 6, top + r * 0.4, 4, GRASS_Y - top - r * 0.4);
      for (const [dx, dy, k, col] of [[0, 0, 1, leaf], [-0.62, 0.5, 0.62, leafDeep], [0.6, 0.45, 0.66, leaf], [0, 0.85, 0.7, leafDeep]]) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x + dx * r, top + dy * r, r * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = alpha(leafLit, 0.7);
      ctx.beginPath(); ctx.arc(x - r * 0.3, top - r * 0.3, r * 0.34, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  grass(ctx, c) {
    ctx.save();
    ctx.strokeStyle = alpha(c.good, 0.35);
    ctx.lineWidth = 2;
    for (let x = 8; x < W; x += 23) {
      const y = GRASS_Y + 12 + ((x * 7) % 40);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 7); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 6); ctx.stroke();
    }
    ctx.restore();
  }

  // Legs, ladder and two roofs (back layer); the deck itself (front layer).
  structure(ctx, c, layer) {
    const post = mix(c.bgSurface, c.label, 0.4);
    const postLit = lighten(post, 0.25);
    const postDeep = darken(post, 0.25);
    ctx.save();
    if (layer === 'back') {
      for (const [x0, x1] of LEGS) {
        ctx.fillStyle = post; ctx.fillRect(x0, 40, x1 - x0, GRASS_Y - 40);
        ctx.fillStyle = postLit; ctx.fillRect(x0, 40, 4, GRASS_Y - 40);
        ctx.fillStyle = postDeep; ctx.fillRect(x1 - 4, 40, 4, GRASS_Y - 40);
        ctx.fillStyle = postDeep; rr(ctx, x0 - 7, GRASS_Y - 8, x1 - x0 + 14, 10, 4); ctx.fill();
      }
      // two roofs, as in the book: blue over the left end, red over the right
      for (const [x0, x1, col] of [[34, 330, c.s7], [276, 540, c.s6]]) {
        const base = mix(col, c.bgDeep, 0.15);
        ctx.fillStyle = darken(base, 0.25);
        ctx.beginPath(); ctx.moveTo(x0 - 8, 74); ctx.lineTo(x1 + 8, 74); ctx.lineTo(x1 - 16, 34); ctx.lineTo(x0 + 16, 34); ctx.closePath(); ctx.fill();
        ctx.fillStyle = base;
        ctx.beginPath(); ctx.moveTo(x0 - 4, 70); ctx.lineTo(x1 + 4, 70); ctx.lineTo(x1 - 18, 36); ctx.lineTo(x0 + 18, 36); ctx.closePath(); ctx.fill();
        ctx.fillStyle = alpha(lighten(base, 0.4), 0.7);
        ctx.fillRect(x0 + 20, 38, x1 - x0 - 40, 5);
        ctx.fillStyle = darken(base, 0.35);
        ctx.fillRect(x0 - 8, 72, x1 - x0 + 16, 6);
      }
      // the ladder under the middle of the deck
      ctx.strokeStyle = postDeep; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(214, TOP); ctx.lineTo(214, GRASS_Y - 4);
      ctx.moveTo(246, TOP); ctx.lineTo(246, GRASS_Y - 4);
      for (let y = TOP + 22; y < GRASS_Y - 10; y += 28) { ctx.moveTo(214, y); ctx.lineTo(246, y); }
      ctx.stroke();
    } else {
      // deck: top face, front face, shade
      const wood = mix(c.s5, c.bgSurface, 0.55);
      ctx.fillStyle = lighten(wood, 0.2);
      ctx.fillRect(DECK_X0, DECK_Y - 4, DECK_X1 - DECK_X0, 6);
      ctx.fillStyle = wood;
      ctx.fillRect(DECK_X0, DECK_Y + 2, DECK_X1 - DECK_X0, DECK_H - 2);
      ctx.fillStyle = darken(wood, 0.25);
      ctx.fillRect(DECK_X0, DECK_Y + DECK_H - 5, DECK_X1 - DECK_X0, 5);
      ctx.strokeStyle = darken(wood, 0.35); ctx.lineWidth = 2;
      ctx.strokeRect(DECK_X0, DECK_Y - 4, DECK_X1 - DECK_X0, DECK_H + 4);
    }
    ctx.restore();
  }

  // The rail along the back of the deck, drawn after the children so it reads as a rail, thin and behind their legs visually.
  rail(ctx, c) {
    const wood = mix(c.s5, c.bgSurface, 0.45);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = darken(wood, 0.15); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(DECK_X0 + 6, DECK_Y - 40); ctx.lineTo(DECK_X0 + 70, DECK_Y - 40);
    ctx.moveTo(196, DECK_Y - 40); ctx.lineTo(300, DECK_Y - 40);
    ctx.moveTo(380, DECK_Y - 40); ctx.lineTo(440, DECK_Y - 40);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (const x of [DECK_X0 + 8, DECK_X0 + 40, DECK_X0 + 70, 200, 232, 264, 296, 384, 412, 440]) {
      ctx.beginPath(); ctx.moveTo(x, DECK_Y - 40); ctx.lineTo(x, DECK_Y - 4); ctx.stroke();
    }
    ctx.restore();
  }

  // One slide as a ribbon: dark rim, body colour, light gloss stripe. The
  // spiral's back half is darker and drawn first, so it reads as a coil.
  slide(ctx, c, i, u) {
    if (u <= 0) return;
    const pts = PTS[i];
    const n = Math.max(2, Math.round(pts.length * u));
    const col = c[SLIDES[i].col];
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (i === 0) {
      ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 22;
      strokePts(ctx, pts, n, (p) => p.far);
      ctx.strokeStyle = darken(col, 0.2); ctx.lineWidth = 16;
      strokePts(ctx, pts, n, (p) => p.far);
      // the centre pole
      const pole = mix(c.bgSurface, c.label, 0.4);
      ctx.fillStyle = pole; ctx.fillRect(106, TOP, 8, GRASS_Y - TOP - 4);
      ctx.fillStyle = lighten(pole, 0.25); ctx.fillRect(106, TOP, 3, GRASS_Y - TOP - 4);
      ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 24;
      strokePts(ctx, pts, n, (p) => !p.far);
      ctx.strokeStyle = col; ctx.lineWidth = 17;
      strokePts(ctx, pts, n, (p) => !p.far);
      ctx.strokeStyle = alpha(lighten(col, 0.5), 0.6); ctx.lineWidth = 4;
      ctx.translate(0, -5);
      strokePts(ctx, pts, n, (p) => !p.far);
    } else {
      // a support post under the middle of the run
      if (u >= 1) {
        const mid = pts[Math.round(pts.length * 0.55)];
        const pole = mix(c.bgSurface, c.label, 0.4);
        ctx.fillStyle = pole; ctx.fillRect(mid.x - 4, mid.y, 8, GRASS_Y - mid.y);
        ctx.fillStyle = lighten(pole, 0.25); ctx.fillRect(mid.x - 4, mid.y, 3, GRASS_Y - mid.y);
      }
      ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 24;
      strokePts(ctx, pts, n);
      ctx.strokeStyle = col; ctx.lineWidth = 17;
      strokePts(ctx, pts, n);
      // raised side wall: a darker band on the lower edge
      ctx.strokeStyle = alpha(darken(col, 0.25), 0.8); ctx.lineWidth = 5;
      ctx.save(); ctx.translate(0, 6); strokePts(ctx, pts, n); ctx.restore();
      ctx.strokeStyle = alpha(lighten(col, 0.5), 0.6); ctx.lineWidth = 4;
      ctx.translate(0, -5);
      strokePts(ctx, pts, n);
    }
    ctx.restore();
  }

  // Three question tags, each pinned by a short leader to its slide's foot.
  tags(ctx, c, t) {
    for (let i = 0; i < 3; i++) {
      const s = SLIDES[i];
      const age = t - 0.2 - i * TAG_GAP;
      if (age < 0) continue;
      const pop = popAt(age, 0) || { scale: 0.01, u: 0 };
      const k = clamp01(age / 0.25);
      const size = 21;
      const sz = chipSize(ctx, c, s.q, size);
      const x = Math.max(sz.w / 2 + 12, Math.min(W - sz.w / 2 - 12, s.foot));
      const footY = GRASS_Y - 6;
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.strokeStyle = c[s.col]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s.foot, footY); ctx.lineTo(x, TAG_Y - sz.h / 2); ctx.stroke();
      ctx.fillStyle = c[s.col];
      ctx.beginPath(); ctx.arc(s.foot, footY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      pill(ctx, c, s.q, x, TAG_Y, { size, bg: c[s.col], alpha: k, scale: pop.scale ?? 1, pop: pop.u });
    }
  }
}
