/**
 * GunBulletScene - slide blk-l15-s10 "Equal forces, unequal accelerations" (2 beats; Ex 6.7, Ex 6.8).
 *   b0 'fruit'  the fruit and the Earth (as NonContactPairsScene, redrawn here): the fruit falls from rest
 *               (x = 1/2 a t squared) to mid-way. The equal F pair stays, faint ("F" on each). The fruit's
 *               acceleration arrow (kind 'a') is long, down; on the Earth the kit dot "a too small to see".
 *   b1 'gun'    a plain side-view rifle on a wooden rest, the bullet at the muzzle. The pair grows: "2 N on
 *               the bullet" (right, tail on the bullet) and "2 N on the gun" (left, along the barrel, tail at
 *               the muzzle), one px scale. The bullet leaves (off the frame within 0.4 s); the gun recoils
 *               20 px, eased. Then the a arrows: gun "0.4 m/s\u00b2" short (the kit minimum), bullet "20 m/s\u00b2"
 *               long with an "x50" chip (the true ratio cannot be drawn to one scale), and two calculation
 *               lines write on. Rest: gun recoiled, a faint ghost bullet at the muzzle carrying its arrows.
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr, font } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawForce } from '../shared/ForceCast.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
// b0
const FR = { x: 8, y: 8, w: 664, h: 504 }, FALL0 = 0.3, FALL = 1.0;
// b1
const AX = 236, MX = 424, GY = 372, PAIR = 104, RECOIL = 20;
const T_PAIR = 0.3, T_FIRE = 1.0, FLY = 0.4, T_A = 1.8, T_L1 = 2.4, T_L2 = 2.9, WRITE = 0.5;
const ACC = 2 * 340 / (FLY * FLY);                  // px/s^2: the bullet clears the frame in FLY s

// -- the fruit and the Earth (copied from NonContactPairsScene; no import between scenes) --------------
const woodOf = (c) => mix(darken(c.gold, 0.32), c.flame, 0.12);

function drawBranch(ctx, c, x0, x1, y) {
  const wood = woodOf(c), leaf = mix(c.good, c.s3, 0.35), len = x1 - x0;
  const P = (u) => ({ x: x0 + u * len, y: y + 18 * u * u });
  ctx.save(); ctx.lineCap = 'round';
  for (const [w, col] of [[16, darken(wood, 0.35)], [12, wood]]) {
    ctx.beginPath(); ctx.moveTo(x0 - 20, y - 6);
    ctx.quadraticCurveTo(x0 + len * 0.5, y - 4, x1, y + 18); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x0 - 20, y - 9); ctx.quadraticCurveTo(x0 + len * 0.5, y - 7, x1 - 6, y + 13);
  ctx.strokeStyle = alpha(lighten(wood, 0.45), 0.7); ctx.lineWidth = 2.5; ctx.stroke();
  const leaves = [[0.12, -1, 0.9], [0.3, 1, 1], [0.46, -1, 1.05], [0.62, 1, 0.9], [0.78, -1, 0.95], [0.95, 1, 0.8]];
  for (const [u, s, k] of leaves) {
    const p = P(u), ang = s * 0.75 - 0.25, L = 46 * k, W = 15 * k;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang + (s < 0 ? -Math.PI / 2 : Math.PI / 2) * 0.55);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -W, L, 0); ctx.quadraticCurveTo(L * 0.5, W, 0, 0);
    ctx.fillStyle = s < 0 ? lighten(leaf, 0.12) : darken(leaf, 0.08); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(leaf, 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L - 6, 0); ctx.strokeStyle = alpha(lighten(leaf, 0.5), 0.8); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  return P(0.55);
}

function drawMango(ctx, c, x, y, r) {
  const col = mix(c.s2, c.s8, 0.3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.3);
  const path = () => { ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r, 0, 0, TAU); };
  ctx.save(); ctx.translate(3, 5); path(); ctx.fillStyle = alpha(darken(col, 0.6), 0.25); ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.beginPath(); ctx.ellipse(r * 0.45, r * 0.35, r * 0.8, r * 1.0, 0, 0, TAU); ctx.fillStyle = alpha(darken(col, 0.25), 0.55); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.85, r * 0.7, r * 0.45, 0, 0, TAU); ctx.fillStyle = alpha(mix(col, c.good, 0.55), 0.75); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.3, r * 0.16, r * 0.3, 0.3, 0, TAU); ctx.fillStyle = alpha(lighten(col, 0.75), 0.75); ctx.fill();
  path(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.4); ctx.stroke();
  ctx.restore();
}

function drawEarth(ctx, c, x0, x1, top, bottom) {
  const w = x1 - x0, R = Math.max(w * 1.1, 260), cx = (x0 + x1) / 2, cy = top + R;
  const sea = mix(c.s1, c.s7, 0.35), land = mix(c.good, c.s3, 0.35);
  const disc = () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); };
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, top - 24, w, bottom - top + 24); ctx.clip();
  ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, TAU); ctx.fillStyle = alpha(lighten(sea, 0.55), 0.3); ctx.fill();
  const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, lighten(sea, 0.18)); g.addColorStop(1, darken(sea, 0.3));
  disc(); ctx.fillStyle = g; ctx.fill();
  ctx.save(); disc(); ctx.clip();
  for (const [u, dy, rw, rh, rot] of [[0.2, 30, 0.2, 20, -0.08], [0.72, 46, 0.17, 16, 0.1], [0.46, 84, 0.12, 12, 0.02]]) {
    ctx.beginPath(); ctx.ellipse(x0 + u * w, top + dy, rw * w, rh, rot, 0, TAU); ctx.fillStyle = land; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(land, 0.35); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x0 + u * w - 6, top + dy - rh * 0.35, rw * w * 0.6, rh * 0.35, rot, 0, TAU); ctx.fillStyle = alpha(lighten(land, 0.4), 0.5); ctx.fill();
  }
  ctx.restore();
  const span = Math.asin(Math.min(1, w / (2 * R))) + 0.05;
  ctx.beginPath(); ctx.arc(cx, cy, R - 4, -Math.PI / 2 - span, -Math.PI / 2 + span); ctx.strokeStyle = alpha(lighten(sea, 0.7), 0.85); ctx.lineWidth = 3; ctx.stroke();
  disc(); ctx.strokeStyle = darken(sea, 0.45); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  return (x) => cy - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
}

export class GunBulletScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Beat 1: a fruit falls towards the Earth. The pull of the Earth on the fruit and the pull of the fruit on the Earth are equal. The fruit has a long acceleration arrow pointing down; the Earth\'s acceleration is far too small to see. Beat 2: a gun of mass 5 kilograms fires a bullet of mass 0.1 kilograms. A force of 2 newtons acts on the bullet, forwards, and 2 newtons acts on the gun, backwards. The bullet flies off fast while the gun moves back only a little. The gun\'s acceleration is 0.4 metres per second squared and the bullet\'s is 20 metres per second squared, 50 times more.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? FALL0 + FALL + 0.8 : T_L2 + WRITE + 0.5); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.fruit(ctx, c); else this.gun(ctx, c);
  }

  tag(ctx, c, s, x, y, col, k, align = 'center') {
    if (k > 0) return drawTag(ctx, c, s, x, y, { size: 26, col, alpha: k, align, prefer: [[0, 0]] });
    return null;
  }

  // -- b0: the fruit and the Earth, with accelerations ---------------------------------------------------
  fruit(ctx, c) {
    const a = this.age, f = clamp01((a - FALL0) / FALL), k = ease(a, 0.1, 0.3), ka = ease(a, 0.4, 0.4);
    drawSheet(ctx, c, FR, { r: 16 });
    const r = 30, L = 96;
    const surf = drawEarth(ctx, c, FR.x + 2, FR.x + FR.w - 2, FR.y + FR.h - 96, FR.y + FR.h - 2);
    const stem = drawBranch(ctx, c, FR.x, FR.x + 380, FR.y + 70);
    const fx = stem.x, y0 = stem.y + 14 + r, y1 = y0 + 0.5 * (surf(fx) - y0 - r), fy = y0 + (y1 - y0) * f * f;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = darken(woodOf(c), 0.2); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(stem.x, stem.y); ctx.lineTo(fx, f > 0.02 ? stem.y + 10 : fy - r + 2); ctx.stroke(); ctx.restore();
    drawMango(ctx, c, fx, fy, r);
    // the equal pair, faint: it is not the point of this beat any more
    const ex = fx - 44, ey = surf(ex) + 4, kf = 0.35 * k;
    drawForce(ctx, c, fx, fy, { length: L, angle: Math.PI / 2, label: 'F', side: -1, alpha: kf, fit: false });
    drawForce(ctx, c, ex, ey, { length: L, angle: -Math.PI / 2, label: 'F', side: -1, alpha: kf, fit: false });
    // the accelerations: the fruit's long, down, beside it; the Earth's a dot
    if (ka <= 0) return;
    drawMotionArrow(ctx, c, 'a', fx + 52, fy - 10, { length: 150, angle: Math.PI / 2, label: 'a', side: 1, alpha: ka });
    const dx = fx + 150, dy = surf(dx) + 40;
    ctx.save(); ctx.globalAlpha *= ka;
    drawMotionArrow(ctx, c, 'a', dx, dy, { length: 0, label: '' });
    ctx.restore();
    this.tag(ctx, c, 'a too small to see', dx + 18, dy, c.s2ink, ka, 'left');
  }

  // -- b1: the gun and the bullet ---------------------------------------------------------------------------
  gun(ctx, c) {
    const a = this.age, kp = ease(a, T_PAIR, 0.5), tf = a - T_FIRE;
    const rx = -RECOIL * ease(a, T_FIRE, 0.8), m = MX + rx;
    drawSurface(ctx, c, 'rough', 0, 680, GY, { h: 30, seed: 7 });
    this.stand(ctx, c);
    this.rifle(ctx, c, m);
    // the bullet: at the muzzle, then x = 1/2 ACC t^2 after the shot; a faint ghost at the muzzle once it has gone
    const flown = tf > 0 ? 0.5 * ACC * tf * tf : 0, gone = tf > FLY;
    const kg = ease(a, T_FIRE + FLY + 0.05, 0.35);
    if (!gone) this.bullet(ctx, c, MX + 2 + flown, 1);
    if (kg > 0) this.bullet(ctx, c, m + 2, 0.55 * kg);
    if (tf > 0 && tf < 0.5) this.puff(ctx, c, m + 4, tf / 0.5);
    // the pair: on the bullet before the shot and on its ghost after; on the gun all along (it moves with it)
    const kb = tf <= 0 ? kp : kg;
    if (kp > 0) {
      drawForce(ctx, c, m - 2, AX, { length: PAIR * kp, angle: Math.PI, label: '', alpha: kp, fit: false });
      this.tag(ctx, c, '2 N on the gun', m - 14, AX - 44, c.s2ink, kp, 'right');
    }
    if (kb > 0) {
      const bx = tf <= 0 ? MX + 6 : m + 6;
      drawForce(ctx, c, bx, AX, { length: PAIR * kp, angle: 0, label: '', alpha: kb, fit: false });
      this.tag(ctx, c, '2 N on the bullet', bx + 14, AX - 44, c.s1ink, kb, 'left');
    }
    // accelerations: gun short (kit minimum length), bullet long with the true ratio stated
    const ka = ease(a, T_A, 0.45);
    if (ka > 0) {
      const gx = m - 40, gy = AX + 34;
      drawMotionArrow(ctx, c, 'a', gx, gy, { length: 26, angle: Math.PI, label: '', alpha: ka });
      this.tag(ctx, c, '0.4 m/s\u00b2', gx - 30, gy + 40, c.label, ka);
      const bx = m + 8, by = AX + 34, len = 170;
      drawMotionArrow(ctx, c, 'a', bx, by, { length: len * ka, angle: 0, label: '', alpha: ka });
      this.tag(ctx, c, '20 m/s\u00b2', bx + len * 0.45, by + 40, c.label, ka);
      this.tag(ctx, c, 'x50', bx + len + 14, by, c.accent, ka, 'left');
    }
    this.line(ctx, c, 'gun: a = 2 N / 5 kg = 0.4 m/s\u00b2', 444, clamp01((a - T_L1) / WRITE));
    this.line(ctx, c, 'bullet: a = 2 N / 0.1 kg = 20 m/s\u00b2', 488, clamp01((a - T_L2) / WRITE));
  }

  /** A calculation line that writes on left to right (a clip that widens). */
  line(ctx, c, s, y, k) {
    if (k <= 0) return;
    ctx.save();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(s).width, x = 340 - w / 2;
    ctx.beginPath(); ctx.rect(x - 4, y - 24, (w + 8) * k, 48); ctx.clip();
    ctx.fillStyle = c.label; ctx.fillText(s, x, y);
    ctx.restore();
  }

  /** The wooden rest: a post with a V cradle under the fore-end, on a plank base. It does not move. */
  stand(ctx, c) {
    const wood = woodOf(c), x = MX - 196, top = AX + 22;
    ctx.save();
    const part = (px, py, w, h, r, col) => {
      rr(ctx, px, py, w, h, r); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = alpha(darken(col, 0.2), 0.8); ctx.fillRect(px + w * 0.62, py + 2, w * 0.38 - 2, h - 4);
      ctx.fillStyle = alpha(lighten(col, 0.4), 0.7); ctx.fillRect(px + 3, py + 2, Math.max(2, w * 0.18), h - 4);
      rr(ctx, px, py, w, h, r); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(wood, 0.45); ctx.stroke();
    };
    part(x - 70, GY - 18, 140, 18, 5, wood);
    part(x - 11, top + 10, 22, GY - 18 - top - 10, 4, wood);
    // the cradle
    ctx.beginPath(); ctx.moveTo(x - 34, top - 6); ctx.lineTo(x - 12, top + 14); ctx.lineTo(x + 12, top + 14); ctx.lineTo(x + 34, top - 6);
    ctx.lineTo(x + 26, top - 8); ctx.lineTo(x + 8, top + 4); ctx.lineTo(x - 8, top + 4); ctx.lineTo(x - 26, top - 8); ctx.closePath();
    ctx.fillStyle = darken(wood, 0.1); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(wood, 0.45); ctx.stroke();
    ctx.restore();
  }

  /** A plain rifle, side view, muzzle at x = m on the axis AX: grey metal barrel and action, wooden stock. */
  rifle(ctx, c, m) {
    const metal = mix(c.bgSurface, c.label, 0.42), wood = woodOf(c), y = AX;
    const rim = (col) => darken(col, 0.45);
    ctx.save(); ctx.lineJoin = 'round';
    // stock: butt, comb, wrist and pistol grip, one wooden piece with the fore-end under the barrel
    const stock = () => {
      ctx.beginPath();
      ctx.moveTo(m - 236, y - 10); ctx.lineTo(m - 300, y - 8); ctx.lineTo(m - 372, y - 2);
      ctx.lineTo(m - 376, y + 54); ctx.lineTo(m - 352, y + 56); ctx.lineTo(m - 270, y + 22);
      ctx.lineTo(m - 262, y + 50); ctx.lineTo(m - 242, y + 52); ctx.lineTo(m - 236, y + 20);
      ctx.lineTo(m - 100, y + 18); ctx.quadraticCurveTo(m - 84, y + 16, m - 84, y + 6); ctx.lineTo(m - 236, y + 6); ctx.closePath();
    };
    ctx.save(); ctx.translate(3, 5); stock(); ctx.fillStyle = alpha(darken(wood, 0.6), 0.25); ctx.fill(); ctx.restore();
    stock(); ctx.fillStyle = wood; ctx.fill();
    ctx.save(); stock(); ctx.clip();
    ctx.fillStyle = alpha(darken(wood, 0.22), 0.9); ctx.fillRect(m - 380, y + 30, 300, 40);          // shade side, low
    ctx.fillStyle = alpha(lighten(wood, 0.35), 0.7); ctx.fillRect(m - 380, y - 10, 300, 6);          // light side, top
    ctx.strokeStyle = alpha(darken(wood, 0.35), 0.45); ctx.lineWidth = 1.5;                          // grain
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(m - 372, y + 6 + i * 10); ctx.quadraticCurveTo(m - 320, y + 2 + i * 9, m - 240, y + 10 + i * 4); ctx.stroke(); }
    ctx.restore();
    stock(); ctx.lineWidth = 2.5; ctx.strokeStyle = rim(wood); ctx.stroke();
    rr(ctx, m - 380, y - 4, 10, 60, 3); ctx.fillStyle = darken(metal, 0.35); ctx.fill();          // butt pad
    // barrel
    rr(ctx, m - 170, y - 6, 170, 12, 4); ctx.fillStyle = metal; ctx.fill();
    ctx.fillStyle = alpha(lighten(metal, 0.5), 0.8); ctx.fillRect(m - 166, y - 5, 162, 3);
    ctx.fillStyle = alpha(darken(metal, 0.25), 0.9); ctx.fillRect(m - 166, y + 2, 162, 3);
    rr(ctx, m - 170, y - 6, 170, 12, 4); ctx.lineWidth = 2; ctx.strokeStyle = rim(metal); ctx.stroke();
    rr(ctx, m - 8, y - 8, 8, 16, 2); ctx.fillStyle = darken(metal, 0.2); ctx.fill(); ctx.stroke();       // muzzle
    rr(ctx, m - 22, y - 13, 8, 8, 2); ctx.fillStyle = darken(metal, 0.3); ctx.fill();                   // front sight
    // action (receiver) with a bolt handle, trigger and guard
    rr(ctx, m - 250, y - 15, 86, 24, 6); ctx.fillStyle = metal; ctx.fill();
    ctx.fillStyle = alpha(lighten(metal, 0.45), 0.8); ctx.fillRect(m - 244, y - 13, 74, 4);
    ctx.fillStyle = alpha(darken(metal, 0.25), 0.8); ctx.fillRect(m - 244, y + 2, 74, 5);
    rr(ctx, m - 250, y - 15, 86, 24, 6); ctx.lineWidth = 2.5; ctx.strokeStyle = rim(metal); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m - 196, y - 4); ctx.lineTo(m - 204, y + 14); ctx.strokeStyle = darken(metal, 0.3); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(m - 205, y + 17, 5, 0, TAU); ctx.fillStyle = darken(metal, 0.2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(m - 236, y + 20); ctx.quadraticCurveTo(m - 230, y + 40, m - 206, y + 36); ctx.lineTo(m - 200, y + 20);
    ctx.strokeStyle = darken(metal, 0.2); ctx.lineWidth = 3.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m - 222, y + 20); ctx.quadraticCurveTo(m - 224, y + 30, m - 218, y + 32); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  /** The bullet: a copper ogive, base at x, on the axis. */
  bullet(ctx, c, x, k) {
    const col = mix(c.gold, c.flame, 0.35), L = 28, h = 11;
    ctx.save(); ctx.globalAlpha *= k;
    ctx.beginPath(); ctx.moveTo(x, AX - h / 2); ctx.lineTo(x + L * 0.55, AX - h / 2); ctx.quadraticCurveTo(x + L, AX - h / 2, x + L, AX);
    ctx.quadraticCurveTo(x + L, AX + h / 2, x + L * 0.55, AX + h / 2); ctx.lineTo(x, AX + h / 2); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.6), 0.8); ctx.fillRect(x + 2, AX - h / 2 + 1, L * 0.5, 2.5);
    ctx.lineWidth = 2; ctx.strokeStyle = darken(col, 0.45); ctx.stroke();
    ctx.restore();
  }

  /** A small grey puff at the muzzle that grows and fades (no flash, no fire). */
  puff(ctx, c, x, u) {
    const col = mix(c.bgSurface, c.label, 0.25);
    ctx.save(); ctx.globalAlpha *= 0.6 * (1 - u);
    for (const [dx, dy, r] of [[10, -4, 10], [22, 4, 13], [34, -6, 9]]) {
      ctx.beginPath(); ctx.arc(x + dx * (0.6 + u), AX + dy * (0.6 + u), r * (0.6 + 0.8 * u), 0, TAU); ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  }
}
