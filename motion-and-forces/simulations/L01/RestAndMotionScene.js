/**
 * RestAndMotionScene - slide "In motion or at rest" (blk-l01-n01, 1 beat).
 * The straight track with O and a ruler; a tree stands beside the track at 70 m.
 * The athlete runs from O at 10 m/s (x = 10 t, the book's speed) for 4 s of book time,
 * compressed to about 2 s; the stopwatch shows the book's t. Her tag reads her position
 * from O (0 m ... 20 m ... 40 m) as it changes; at every whole second the tree's tag
 * gives a small nod and still reads "70 m". Under the ruler a time tag (0 s, 2 s, 4 s)
 * pops at 0, 20 and 40 m as she passes, so at rest the picture still shows the change. Words: "motion" by her, "rest" by the tree.
 * Rests at 40 m, clock 4 s.
 * Reuses AthleteRunScene (L02): spec, drawTrack, drawAthlete, say.
 * ASCII only.
 */
import { AthleteRunScene } from '../L02/AthleteRunScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha, font, outBack, popAt } from 'simulations/base/kit/SimLook.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const PACE1 = 0.5, GO1 = 0.6, END_T = 4, V1 = 10;
const TREE_M = 70, TOP = 305;               // the tree's metre mark; the far edge of the track
const HER_TAG_Y = 158, TREE_TAG_Y = 122;

/** A light tag with a coloured rim (never a dark pill); returns its box. */
function tagAt(ctx, c, text, x, y, col, size = 26) {
  ctx.save();
  ctx.font = font(c, 800, size, true);
  const w = ctx.measureText(text).width + 26, h = size * 1.3;
  x = Math.max(w / 2 + 8, Math.min(680 - w / 2 - 8, x));
  ctx.save(); ctx.translate(0, 3); rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = darken(col, 0.35); ctx.fill(); ctx.restore();
  rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = c.bgSurface; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
  return { x0: x - w / 2, y0: y - h / 2, w, h };
}

/** A roadside tree standing on y at x, about h tall: trunk with a shade side, a three-lobed crown with light and shade. */
function drawTree(ctx, c, x, y, h) {
  const bark = darken(c.s8, 0.45), leaf = c.s3, tw = h * 0.11, th = h * 0.42;
  ctx.save();
  ctx.fillStyle = alpha(darken(c.bgDeep, 0.5), 0.22); ctx.beginPath(); ctx.ellipse(x, y + 2, h * 0.26, 6, 0, 0, Math.PI * 2); ctx.fill();
  rr(ctx, x - tw / 2, y - th, tw, th + 2, 4); ctx.fillStyle = bark; ctx.fill();
  ctx.fillStyle = darken(bark, 0.25); ctx.fillRect(x + tw * 0.1, y - th + 4, tw * 0.35, th - 4);
  rr(ctx, x - tw / 2, y - th, tw, th + 2, 4); ctx.strokeStyle = darken(bark, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
  const lobes = [[-0.2, -0.56, 0.22], [0.2, -0.56, 0.22], [0, -0.78, 0.26]];
  const crown = () => { ctx.beginPath(); for (const [dx, dy, r] of lobes) { ctx.moveTo(x + dx * h + r * h, y + dy * h); ctx.arc(x + dx * h, y + dy * h, r * h, 0, Math.PI * 2); } };
  ctx.save(); ctx.translate(0, 4); crown(); ctx.fillStyle = darken(leaf, 0.45); ctx.fill(); ctx.restore();     // lip
  crown(); ctx.fillStyle = leaf; ctx.fill();
  ctx.save(); crown(); ctx.clip();
  ctx.fillStyle = darken(leaf, 0.2); ctx.fillRect(x - h, y - h * 0.62, 2 * h, h);                            // shade side, low
  ctx.fillStyle = alpha(lighten(leaf, 0.45), 0.85); ctx.beginPath(); ctx.ellipse(x - h * 0.1, y - h * 0.9, h * 0.1, h * 0.05, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.5; ctx.strokeStyle = darken(leaf, 0.4);
  for (const [dx, dy, r] of lobes) { ctx.beginPath(); ctx.arc(x + dx * h, y + dy * h, r * h, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
  ctx.restore();
  return { top: y - h * 1.04 };
}

export class RestAndMotionScene extends AthleteRunScene {
  static MODE = 'rest';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A straight track from O at 0 m to 100 m, with a tree beside it at 70 m. A stopwatch runs from 0 s to 4 s while the athlete runs from O: her position from O changes, 0 m, 20 m, 40 m, so she is in motion. The tree stays at 70 m the whole time, so it is at rest.';

  enter(stage) { this.cur = 0; }
  busy() { return this.age < GO1 + END_T * PACE1 + 0.8; }
  bookT() { return Math.min(END_T, Math.max(0, this.age - GO1) / PACE1); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const spec = this.spec(), t = this.bookT(), m = V1 * t;
    const moving = this.age > GO1 && t < END_T;
    // The tree first (behind the track), its drop to the ruler, then the track.
    const tx = spec.toPx(TREE_M);
    const tree = drawTree(ctx, c, tx, TOP + 2, 150);
    this.drawTrack(ctx, c, { every: 20 });
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.4); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(tx, TOP + 6); ctx.lineTo(tx, 362); ctx.stroke(); ctx.restore();
    // The clock.
    drawStopwatch(ctx, c, { x: 596, y: 104, r: 54, seconds: t, dialSeconds: 20, text: 't = ' + Math.round(t) + ' s', readout: 'below' });
    // Her readings: a time tag under the ruler at 0, 20 and 40 m as she passes (book t = 0, 2, 4 s).
    for (const k of [0, 2, 4]) { const pop = popAt(this.age, GO1 + k * PACE1); if (pop !== null) this.timeTag(ctx, c, V1 * k, k + ' s', 0, pop); }
    // The tree's tag: the same at every reading (a nod at each whole second shows it was read again).
    const tick = Math.floor(t + 1e-6), since = (this.age - GO1) - tick * PACE1;
    const nod = tick >= 1 && since >= 0 && since < 0.3 ? Math.sin((since / 0.3) * Math.PI) : 0;
    const treeY = Math.min(TREE_TAG_Y, tree.top - 24);
    ctx.save(); ctx.translate(tx, treeY); ctx.scale(1 + 0.1 * nod, 1 + 0.1 * nod); ctx.translate(-tx, -treeY);
    tagAt(ctx, c, '70 m', tx, treeY, c.s3);
    ctx.restore();
    this.say(ctx, c, 'rest', tx, treeY - 42, { col: c.s3ink ?? c.label, size: 28 });
    // Her: runs, her tag reads her position from O as it changes.
    const x = spec.toPx(m);
    this.drawAthlete(ctx, c, m, { facing: 1, dist: m, moving });
    const p = clamp01(this.age / 0.4);
    ctx.save(); ctx.globalAlpha = p;
    tagAt(ctx, c, Math.round(m) + ' m', x, HER_TAG_Y + 8 * (1 - outBack(p)), c.s4);
    this.say(ctx, c, 'motion', Math.max(70, x), HER_TAG_Y - 42, { col: c.s4ink ?? c.label, size: 28 });
    ctx.restore();
  }
}
