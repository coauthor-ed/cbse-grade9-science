/**
 * SpringPullScene - predict blk-l11-s6 "Which surface pulls least?" (setup) and explain blk-l10-n02
 * "Measuring friction" (2 beats; Fig 6.14). MODE 'pull' of CoinStackScene (its surfaces and coin stack).
 * Side view: a wooden block on a surface strip, a spring balance lying flat, hooked to the block; your hand
 * pulls the ring.
 *   setup        three rows (wood, laminate, marble), block and balance at rest, "?" on each scale. Nothing moves.
 *   b0 'reading' wood: the pull rises slowly (pointer climbs); "pull" on the block grows and "friction" at its
 *                bottom grows with it, the block still; at the largest friction the block starts to move and
 *                then moves at a steady velocity, the pull steady, the two arrows equal, net force = 0.
 *   b1 'compare' three rows: pointers settle at three readings (largest on wood, smallest on marble; on the
 *                scale only); below each row, on a thin strip of the same surface, the coin stack where it stopped in
 *                CoinStack b1 (20 : 35 : 60), labelled "coins stopped" on the top row only.
 *                The marble row is the hero ("least friction").
 */
import { CoinStackScene } from './CoinStackScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn, drawSpringBalance } from '../shared/ForceCast.js';

const SETUP = 9;
const READ = { wood: 6, laminate: 3.5, marble: 1.5 };            // the reading when the block just starts to move (scale only)
const RATIO = { wood: 20 / 60, laminate: 35 / 60, marble: 1 };
const KINDS = ['wood', 'laminate', 'marble'];
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

export class SpringPullScene extends CoinStackScene {
  static MODE = 'pull';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'A wooden block is pulled with a spring balance lying flat on a table. You pull with slowly increasing force: the pointer climbs, and friction at the bottom of the block grows just as much, so the block stays still. When the block just starts to move, it then slides at a steady velocity: the pull and friction are equal and the net force is zero, so the reading is about equal to the force of friction. On three surfaces, wood, laminate and marble, the reading is largest on wood and smallest on marble, the surface where the coin stack went farthest.';

  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.isSetup() ? this.age < 0.5 : this.age < (this.cur === 0 ? 4.9 : 2.8); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.isSetup()) this.rows(ctx, c, false);
    else if (this.cur === 0) this.single(ctx, c);
    else this.rows(ctx, c, true);
  }

  /** Block on its strip, the balance hooked to its front face, your hand on the ring. -> { box, sb } */
  rigPull(ctx, c, kind, o) {
    const { x, y, w, h, reading, len, bw, x0 = 16, x1 = 664 } = o;
    if (!o.noStrip) this.surf(ctx, c, kind, x0, x1, y, o.stripH ?? 30, { r: 6, rim: o.rim, rimW: o.rimW });
    const box = drawBoxOn(ctx, c, { x, y, w, h, kind: 'block' });
    const ay = box.top.y + h * (o.axisAt ?? 0.62), hookX = box.front.x + 14, rod = 10;
    const stretch = clamp01(reading / 10) * (len - 64), ringX = hookX + 26 + len + rod + stretch + 21;
    const sb = drawSpringBalance(ctx, c, { x: ringX, y: ay, angle: Math.PI, reading, max: 10, every: 5, minor: 1, len, w: bw, rod, size: o.size ?? 26, showUnit: false });
    const metal = mix(c.bgSurface, c.label, 0.45);                                                         // a screw eye on the block, a string to the hook
    ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = darken(metal, 0.2);
    ctx.beginPath(); ctx.arc(box.front.x + 6, ay, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = metal; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(box.front.x + 12, ay); ctx.lineTo(sb.hook.x, sb.hook.y); ctx.stroke(); ctx.restore();
    this.fist(ctx, c, ringX - 8, ay, o.handS ?? 1);
    return { box, sb, ay };
  }

  /** Your fist round the ring, the sleeve running off to the right. */
  fist(ctx, c, x, y, s = 1) {
    const skin = this.skin(c), sleeve = c.s4;
    ctx.save();
    rr(ctx, x + 40 * s, y - 30 * s, 300, 60 * s, 18 * s); ctx.fillStyle = sleeve; ctx.fill(); ctx.strokeStyle = darken(sleeve, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = alpha(lighten(sleeve, 0.45), 0.6); ctx.fillRect(x + 50 * s, y - 24 * s, 240, 4);
    const body = () => rr(ctx, x - 6 * s, y - 26 * s, 56 * s, 52 * s, 20 * s);
    body(); ctx.fillStyle = skin; ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.fillStyle = darken(skin, 0.13); ctx.fillRect(x - 10 * s, y + 8 * s, 80 * s, 40 * s); ctx.restore();
    body(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(skin, 0.4), 0.6); ctx.lineWidth = 1.8;                                    // finger creases
    for (const dy of [-10, 2, 14]) { ctx.beginPath(); ctx.moveTo(x - 4 * s, y + dy * s); ctx.lineTo(x + 12 * s, y + dy * s); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x + 22 * s, y - 24 * s, 16 * s, 8 * s, -0.2, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2; ctx.stroke();   // thumb
    ctx.restore();
  }

  /** Coin stack seen from the side: four coins taped together, standing on the strip at x. */
  coinsSide(ctx, c, x, y, s = 1) {
    const gold = mix(c.gold, c.flame, 0.1), w = 30 * s, t = 5.5 * s;
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const cy = y - (i + 1) * t;
      rr(ctx, x - w / 2, cy, w, t, 2); ctx.fillStyle = i % 2 ? gold : lighten(gold, 0.12); ctx.fill();
      ctx.strokeStyle = darken(gold, 0.5); ctx.lineWidth = 1.2; ctx.stroke();
    }
    rr(ctx, x - w / 2 - 1.5, y - 3 * t, w + 3, t * 1.4, 2); ctx.fillStyle = alpha(mix(c.glass, this.pale(c), 0.4), 0.85); ctx.fill();   // tape
    ctx.strokeStyle = darken(c.glass, 0.45); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  // -- b0: one row, wood: the pull rises, the block starts, then slides steadily -------------------------------------
  single(ctx, c) {
    const a = this.age, rise = ease(a, 0.3, 2.0), R0 = READ.wood, rd = R0 * rise;
    const VB = 20, t = clamp01((a - 2.5) / 2.0) * 2.0, dx = VB * t, kn = ease(a, 2.7, 0.4);
    const r = this.rigPull(ctx, c, 'wood', { x: 112 + dx, y: 322, w: 206, h: 172, reading: rd, len: 210, bw: 122, stripH: 44 });
    const KPX = 18, L = Math.max(rd * KPX, 0.01), kf = ease(a, 0.3, 0.3);
    if (kf > 0) {
      drawForce(ctx, c, r.box.centre.x, r.box.top.y + 18, { length: L, label: 'pull', alpha: kf, fit: false, at: 0.7 });
      drawForce(ctx, c, r.box.bottom.x, r.box.bottom.y - 4, { length: L, angle: Math.PI, label: '', alpha: kf, fit: false });
      drawTag(ctx, c, 'friction', r.box.bottom.x - L * 0.5, r.box.bottom.y + 34, { size: 26, col: c.s3ink ?? darken(c.s3, 0.3), alpha: kf });
    }
    if (kn > 0) {
      drawNet(ctx, c, 330, 428, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn });
    }
    drawTag(ctx, c, 'wooden table top', 470, 428, { size: 26, alpha: 1 - kn });
  }

  // -- setup and b1: three rows ------------------------------------------------------------------------------------
  rows(ctx, c, show) {
    const a = this.age;
    KINDS.forEach((kind, i) => {
      const y = (show ? 118 : 146) + i * (show ? 148 : 160), hero = kind === 'marble' && show;
      const rd = show ? READ[kind] * ease(a, 0.3 + 0.25 * i, 1.4) : 0;
      if (show) {
        this.surf(ctx, c, kind, 16, 664, y, 30, { r: 6, rim: hero ? c.accent : undefined, rimW: hero ? 5 : 3 });
        // the coin stack where it stopped (CoinStack b1), on its own thin strip of the same surface below the
        // row, clear of the block, the balance and the hand; one label, on the top row only
        const kc = ease(a, 0.2, 0.4), C0 = 30, LY = y + 64, x = C0 + 252 * RATIO[kind];
        ctx.save(); ctx.globalAlpha = kc;
        this.surf(ctx, c, kind, 16, 300, LY, 9, { r: 3, rimW: 2 });
        ctx.setLineDash([6, 6]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(C0, LY - 10); ctx.lineTo(x - 20, LY - 10); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(C0, LY - 20); ctx.lineTo(C0, LY); ctx.stroke();
        this.coinsSide(ctx, c, x, LY, 1);
        ctx.restore();
        if (i === 0) drawTag(ctx, c, 'coins stopped', x + 26, LY - 12, { size: 26, align: 'left', col: c.labelMuted, alpha: kc });
      }
      const r = this.rigPull(ctx, c, kind, { x: show ? 330 : 240, y, w: 92, h: 62, reading: rd, len: 140, bw: 80, stripH: 30,
        noStrip: show, rim: hero ? c.accent : undefined, rimW: hero ? 5 : 3, axisAt: 0.6, handS: 0.8 });
      if (!show) drawTag(ctx, c, '?', r.sb.box.x + r.sb.box.w * 0.52, r.ay + 4, { size: 30 });
      drawTag(ctx, c, kind, show ? 150 : 90, show ? y - 30 : y - 72, { size: 26, col: hero ? c.accent : c.label });
      if (hero) drawTag(ctx, c, 'least friction', 520, y - 82, { size: 26, col: c.accent, alpha: ease(a, 1.6, 0.4) });
    });
  }
}
