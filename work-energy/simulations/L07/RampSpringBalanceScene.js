import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, clamp01, outBack, inOutSine,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { propRig, drawCart, drawSpringBalance } from 'simulations/base/kit/SimProps.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';

// RampSpringBalanceScene - blk-l07-s06, Measuring with a Spring Balance
// (book Activity 7.3, Fig 7.27 and 7.28).
// A pile of books is the platform, height h. A person's hand (the arm comes
// in from the edge of the frame) holds the spring balance and pulls a toy cart.
// b0: left of the pile, the cart is lifted straight up to the top of the pile:
//     6 N, its weight. Right of the pile, a steep plank (length 1.5 h): the
//     cart is pulled up it and the balance reads 4 N.
// b1: a gentler plank on the left (length 3 h, same h): the balance reads
//     2 N. The steep plank stays at low contrast with its cart and 4 N. Both
//     pull distances (foot to top) are dashed s arrows: the gentle one is twice
//     as long.
// Readings follow F = W h / L with W = 6 N (friction left out, as in the book).

const GROUND = 470;
const RISE = 146;                             // h, the top of the pile
const TOP_Y = GROUND - RISE;
const BOOKS = { x0: 438, x1: 514 };
const WEIGHT = 6;
const CART_W = 104, CART_H = 34, WHEEL_R = 15;
const CART_TALL = CART_H + WHEEL_R * 1.6;
const BAL_S = 1.25, BAL_MAX = 10;
const BAL_LEN = (k) => (30 + k * 40 + 90 + 14) * BAL_S;
const LIFT_X = 190;

// side -1: the plank leans on the left face of the pile; +1: on the right face
function plankGeom(Lh, side) {
  const L = RISE * Lh, th = Math.asin(1 / Lh), run = L * Math.cos(th);
  const top = { x: side < 0 ? BOOKS.x0 : BOOKS.x1, y: TOP_Y };
  const foot = { x: top.x + side * run, y: GROUND };
  const ux = (top.x - foot.x) / L, uy = (top.y - foot.y) / L;
  const nx = side < 0 ? uy : -uy, ny = side < 0 ? -ux : ux;   // up, off the plank's top face
  return { L, th, side, top, foot, ux, uy, nx, ny, read: WEIGHT / Lh, dir: Math.atan2(uy, ux) };
}
const STEEP = plankGeom(1.5, 1);              // 4 N
const GENTLE = plankGeom(3, -1);              // 2 N
const at = (p, s, off = 0) => ({ x: p.foot.x + p.ux * s + p.nx * off, y: p.foot.y + p.uy * s + p.ny * off });
const REST_S = (p) => p.L * 0.5;              // the cart rests half way up

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class RampSpringBalanceScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A pile of books is a platform. A hand holds a spring balance. On the left a toy cart is lifted straight up to the top of the pile: the balance reads 6 N, the cart\'s weight. On the right the same cart is pulled up a steep plank to the same height: the balance reads 4 N. Then a gentler plank, twice as long, leads to the same height: the balance reads 2 N, and the dashed pull distance is twice as long as on the steep plank.';

  enter() { this.motionT = 0; }

  get gentleBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.gentleBeat ? 2.6 : 3.4) + 0.1; }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(600);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }
  prog(t0, dt) { return clamp01(((this.motionT ?? 0) - t0) / dt); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, { seams: true });
    this.books(ctx, c);
    if (!this.gentleBeat) {
      const take = inOutSine(this.prog(0.2, 0.4)), up = inOutSine(this.prog(0.6, 0.9));
      this.lift(ctx, c, up, WEIGHT * take, this.prog(1.4, 0.35));
      this.plank(ctx, c, STEEP, 1, this.prog(1.6, 0.4));
      const go = inOutSine(this.prog(2.2, 1.1));
      this.run(ctx, c, STEEP, go, STEEP.read * inOutSine(this.prog(2.0, 0.3)), this.prog(3.0, 0.35), true);
    } else {
      // the steep plank of the last beat, at low contrast: its cart and its 4 N
      ctx.save();
      ctx.globalAlpha *= 0.5;
      this.plank(ctx, c, STEEP, 1, 1);
      this.cartOn(ctx, c, STEEP, REST_S(STEEP));
      ctx.restore();
      this.readPill(ctx, c, STEEP, REST_S(STEEP), `${STEEP.read} N`, 1, true);
      this.plank(ctx, c, GENTLE, 1, this.prog(0.1, 0.4));
      const go = inOutSine(this.prog(0.7, 1.2));
      this.run(ctx, c, GENTLE, go, GENTLE.read * inOutSine(this.prog(0.5, 0.3)), this.prog(1.8, 0.35), true);
      this.distances(ctx, c, this.prog(1.9, 0.6));
    }
  }

  books(ctx, c) {
    const tones = [c.s1, c.s6, c.s3, c.s2, c.s5, c.s4, c.s8];
    const n = tones.length, th = RISE / n;
    ctx.save();
    drawShadow(ctx, c, (BOOKS.x0 + BOOKS.x1) / 2, GROUND + 2, (BOOKS.x1 - BOOKS.x0) * 0.7, 6, 0.9);
    for (let i = 0; i < n; i++) {
      const y = GROUND - (i + 1) * th;
      const off = [0, 3, -2, 2, -1, 3, 0][i], wcut = [0, 4, 2, 5, 1, 4, 0][i];
      const x0 = BOOKS.x0 + off, x1 = BOOKS.x1 + off - wcut;
      const cov = mix(tones[i], c.bgSurface, 0.25);
      rr(ctx, x0, y, x1 - x0, th, 3);
      ctx.fillStyle = cov;
      ctx.fill();
      const pg = mix(c.bgSurface, c.label, 0.06);
      ctx.fillStyle = lighten(pg, 0.1);
      ctx.fillRect(x0 + 8, y + 3.5, x1 - x0 - 12, th - 7);
      ctx.strokeStyle = alpha(darken(pg, 0.18), 0.8);
      ctx.lineWidth = 1;
      for (const f of [0.38, 0.62]) {
        ctx.beginPath(); ctx.moveTo(x0 + 8, y + th * f); ctx.lineTo(x1 - 4, y + th * f); ctx.stroke();
      }
      ctx.fillStyle = lighten(cov, 0.22);
      ctx.fillRect(x0 + 1, y + 1.5, 5, th - 3);
      ctx.fillStyle = darken(cov, 0.3);
      ctx.fillRect(x0 + 2, y + th - 2.5, x1 - x0 - 4, 2.5);
      rr(ctx, x0, y, x1 - x0, th, 3);
      ctx.strokeStyle = darken(cov, 0.35);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  plank(ctx, c, p, a, grow) {
    if (grow <= 0) return;
    const T = 13, ext = 12;
    const ax = p.foot.x, ay = p.foot.y;
    const bx = p.top.x + p.ux * ext, by = p.top.y + p.uy * ext;
    const wood = mix(c.gold, c.flame, 0.2);
    ctx.save();
    ctx.globalAlpha *= a * Math.min(1, grow * 1.5);
    const sw = (1 - outBack(grow)) * 0.25 * p.side;
    ctx.translate(ax, ay); ctx.rotate(sw); ctx.translate(-ax, -ay);
    const quad = () => {
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx - p.nx * T, by - p.ny * T); ctx.lineTo(ax - p.nx * T, ay - p.ny * T);
      ctx.closePath();
    };
    quad();
    ctx.fillStyle = darken(wood, 0.08);
    ctx.fill();
    // lit top face, shaded underside, grain
    ctx.strokeStyle = lighten(wood, 0.32); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax - p.nx * 1.5, ay - p.ny * 1.5); ctx.lineTo(bx - p.nx * 1.5, by - p.ny * 1.5); ctx.stroke();
    ctx.strokeStyle = darken(wood, 0.32); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(ax - p.nx * (T - 2), ay - p.ny * (T - 2)); ctx.lineTo(bx - p.nx * (T - 2), by - p.ny * (T - 2)); ctx.stroke();
    ctx.strokeStyle = alpha(darken(wood, 0.35), 0.6); ctx.lineWidth = 1.3;
    for (let s = 24; s < p.L - 30; s += 62) {
      const q0 = at(p, s, -6), q1 = at(p, s + 30, -7);
      ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
    }
    quad();
    ctx.strokeStyle = darken(wood, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // a cart with its wheel line at (x, y); ang = travel direction; flip faces it left
  cart(ctx, c, x, y, ang, wheelAng, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) { ctx.scale(-1, 1); ctx.rotate(Math.PI - ang); } else ctx.rotate(ang);
    const rig = propRig({ x0: 0, groundY: 0, scale: 1 });
    drawCart(ctx, c, rig, 0, { w: CART_W, h: CART_H, tone: 6, wheelAngle: wheelAng });
    // own wheels over the kit ones: tyre, rim, studs (no two-eye hubs)
    for (const wx of [-CART_W * 0.26, CART_W * 0.26]) {
      const wy = -WHEEL_R;
      const tyre = darken(mix(c.stroke, c.label, 0.35), 0.45), rim = mix(c.bgSurface, c.labelMuted, 0.5);
      ctx.beginPath(); ctx.arc(wx, wy, WHEEL_R + 0.5, 0, Math.PI * 2); ctx.fillStyle = tyre; ctx.fill();
      ctx.beginPath(); ctx.arc(wx, wy, WHEEL_R * 0.58, 0, Math.PI * 2); ctx.fillStyle = rim; ctx.fill();
      ctx.fillStyle = darken(rim, 0.35);
      for (let i = 0; i < 6; i++) {
        const a = wheelAng + (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(wx + Math.cos(a) * WHEEL_R * 0.38, wy + Math.sin(a) * WHEEL_R * 0.38, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  cartOn(ctx, c, p, s) {
    const q = at(p, s);
    this.cart(ctx, c, q.x, q.y, p.dir, -s / WHEEL_R, p.side > 0);
  }

  // a kit balance whose hook end is at (hx, hy), body along dir (hook -> ring)
  balance(ctx, c, hx, hy, dir, reading) {
    const k = clamp01(reading / BAL_MAX), len = BAL_LEN(k);
    const tx = hx + Math.cos(dir) * len, ty = hy + Math.sin(dir) * len;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(dir + Math.PI / 2);
    ctx.scale(BAL_S, BAL_S);
    drawSpringBalance(ctx, c, 0, 0, { reading, max: BAL_MAX, tone: 5 });
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.45);
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(tx + Math.cos(dir) * 6, ty + Math.sin(dir) * 6, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return { x: tx + Math.cos(dir) * 8, y: ty + Math.sin(dir) * 8 };
  }

  // the person's hand round the balance ring; the arm runs on along dir out of the frame
  hand(ctx, c, ring, dir) {
    const look = figureLook(c, { skin: 1 });
    const skin = look.skin, sleeve = mix(c.s1, c.bgDeep, 0.2);
    const ux = Math.cos(dir), uy = Math.sin(dir), px = -uy, py = ux;
    const wrist = { x: ring.x + ux * 26, y: ring.y + uy * 26 };
    ctx.save();
    ctx.lineCap = 'round';
    // forearm (skin), then the sleeve from the elbow on, out past the frame edge
    const elbow = { x: wrist.x + ux * 120, y: wrist.y + uy * 120 }, far = { x: wrist.x + ux * 900, y: wrist.y + uy * 900 };
    const limb = (a, b, w, col) => {
      ctx.strokeStyle = darken(col, 0.25); ctx.lineWidth = w + 4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // shade side
      ctx.strokeStyle = darken(col, 0.12); ctx.lineWidth = w * 0.35;
      ctx.beginPath(); ctx.moveTo(a.x - px * w * 0.28, a.y - py * w * 0.28); ctx.lineTo(b.x - px * w * 0.28, b.y - py * w * 0.28); ctx.stroke();
      // lit edge
      ctx.strokeStyle = alpha(lighten(col, 0.35), 0.8); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x + px * w * 0.32, a.y + py * w * 0.32); ctx.lineTo(b.x + px * w * 0.32, b.y + py * w * 0.32); ctx.stroke();
    };
    limb(wrist, elbow, 22, skin);
    limb(elbow, far, 34, sleeve);
    // cuff band
    ctx.strokeStyle = darken(sleeve, 0.2); ctx.lineWidth = 36;
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(elbow.x, elbow.y); ctx.lineTo(elbow.x + ux * 7, elbow.y + uy * 7); ctx.stroke();
    // the fist: palm round the ring, four curled fingers over it, thumb on top
    ctx.translate(ring.x, ring.y);
    ctx.rotate(dir);
    ctx.fillStyle = skin;
    ctx.strokeStyle = darken(skin, 0.28);
    ctx.lineWidth = 2;
    rr(ctx, 4, -15, 26, 30, 10); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const fy = -12 + i * 7.5;
      rr(ctx, -6, fy - 3.6, 14, 7.6, 3.8);
      ctx.fillStyle = i % 2 ? darken(skin, 0.05) : skin;
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = lighten(skin, 0.08);
    rr(ctx, 4, -20, 20, 9, 4.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = alpha(lighten(skin, 0.3), 0.6);
    ctx.fillRect(12, -13, 14, 3);
    ctx.restore();
  }

  // the balance's reading, under the plank (or beside a straight lift)
  readPill(ctx, c, p, s, label, k, ghost) {
    if (k <= 0) return;
    const q = at(p, s + CART_W * 0.2, -44);
    pill(ctx, c, label, q.x, q.y, { bg: ghost ? c.raised : c.s5, ink: ghost ? c.label : undefined, size: 26, scale: outBack(k) });
  }

  lift(ctx, c, up, reading, k) {
    const y = GROUND - up * RISE;
    // a dotted line from the pile top across: the same height
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = alpha(c.labelMuted, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(LIFT_X + CART_W / 2 + 6, TOP_Y); ctx.lineTo(BOOKS.x0 - 4, TOP_Y); ctx.stroke();
    ctx.restore();
    if (up > 0.02) drawShadow(ctx, c, LIFT_X, GROUND + 2, CART_W * 0.4, 3.5, 0.5);
    this.cart(ctx, c, LIFT_X, y, 0, 0, false);
    const hook = { x: LIFT_X, y: y - CART_TALL - 4 };
    ctx.save();
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.45); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(LIFT_X - 20, y - CART_TALL + 2); ctx.lineTo(hook.x, hook.y); ctx.lineTo(LIFT_X + 20, y - CART_TALL + 2); ctx.stroke();
    ctx.restore();
    const ring = this.balance(ctx, c, hook.x, hook.y, -Math.PI / 2, reading);
    this.hand(ctx, c, ring, -Math.PI / 2);
    if (k > 0) pill(ctx, c, `${WEIGHT} N`, LIFT_X + 92, hook.y - BAL_LEN(reading / BAL_MAX) * 0.55, { bg: c.s5, size: 26, scale: outBack(k) });
  }

  // the cart pulled up plank p; u 0..1 from the foot to its rest half way up
  run(ctx, c, p, u, reading, k, withHand) {
    const s0 = CART_W / 2 + 6, s1 = REST_S(p);
    const s = s0 + (s1 - s0) * u;
    this.cartOn(ctx, c, p, s);
    const nose = at(p, s + CART_W / 2, CART_TALL * 0.55);
    const hook = { x: nose.x + p.ux * 10, y: nose.y + p.uy * 10 };
    ctx.save();
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.45); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(nose.x, nose.y); ctx.lineTo(hook.x, hook.y); ctx.stroke();
    ctx.restore();
    const ring = this.balance(ctx, c, hook.x, hook.y, p.dir, reading);
    if (withHand) this.hand(ctx, c, ring, p.dir);
    this.readPill(ctx, c, p, s, `${p.read} N`, k, false);
  }

  // b1: the pull distance on each plank, foot to top, dashed, above the cart
  distances(ctx, c, k) {
    if (k <= 0) return;
    for (const [p, a] of [[STEEP, 0.75], [GENTLE, 1]]) {
      const off = CART_TALL + 20;
      const a0 = at(p, 4, off), a1 = at(p, 4 + (p.L - 4) * outBack(k), off);
      ctx.save();
      ctx.globalAlpha *= a;
      displacementArrow(ctx, c, a0.x, a0.y, a1.x, a1.y, { tone: 2, width: 5, head: 15 });
      // end ticks: the arrow spans the whole plank
      ctx.strokeStyle = c.s2; ctx.lineWidth = 2.5;
      const t0 = at(p, 0, off - 12), t1 = at(p, 0, off + 12);
      ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.stroke();
      ctx.restore();
      if (k >= 1) {
        const m = at(p, p.L * (p.side > 0 ? 0.78 : 0.42), off + 26);
        pill(ctx, c, 's', m.x, m.y, { bg: c.s2, size: 24, alpha: a });
      }
    }
  }
}
