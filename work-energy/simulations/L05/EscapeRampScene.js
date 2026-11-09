import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, clamp01,
  mix, alpha, lighten, darken, rr, mulberry32, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// EscapeRampScene - blk-l05-s09, An Escape Ramp (book Example 7.9).
// b0: a goods truck rolls in on the road at 20 m/s to the foot of a 30 degree
//     sand ramp. Marks every 2 m along the ramp; each 2 m step rises 1 m.
//     The sand pushes back on the truck with F = 50000 N.
// b1: the truck climbs to d = 10 m. K drains into U and heat in
//     two equal parts: U = 50000 x d and heat = 50000 x d.
// b2: it climbs on and stops at d = 20 m: K is empty, U = heat = 1 000 000 J.
// Motion: d(t) = 20t - 5t^2 (a = 100000 N / 10000 kg = 10 m/s^2 back down
// the ramp), stopping at t = 2 s, shown slowed down by SLOW.

const MASS = 10000, V0 = 20, F_SAND = 50000;
const K0 = 0.5 * MASS * V0 * V0;               // 2 000 000 J
const ANG = Math.PI / 6;
const CA = Math.cos(ANG), SA = Math.sin(ANG);
const FOOT_X = 196, GROUND = 468, PX = 24;     // 24 px per metre
const L_MAX = 21.5;                            // metres of ramp drawn
const TS = 1.3;                                 // truck drawing scale
const TL = 126 * TS;                           // truck length, px
const D_MID = 10, D_STOP = 20;
const SLOW = 1.6;
const BED = 40;                                // depth of the sand bed, px
const sandOf = (c) => mix(c.gold, c.setSand, 0.32);
const DRIVE_S = 0.9;                           // b0 roll in

const tAt = (d) => (20 - Math.sqrt(Math.max(0, 400 - 20 * d))) / 10;   // inverse of d = 20t - 5t^2
const dAt = (t) => 20 * t - 5 * t * t;

// a point on the bed (p metres along: below 0 is the road)
function pathPt(p) {
  if (p <= 0) return { x: FOOT_X + p * PX, y: GROUND };
  return { x: FOOT_X + p * PX * CA, y: GROUND - p * PX * SA };
}
const along = (d, off = 0) => {                 // off > 0: up off the bed, along its normal
  const q = pathPt(d);
  return { x: q.x - SA * off, y: q.y - CA * off };
};
function fmt(v) {
  const s = String(Math.round(v / 1000) * 1000);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class EscapeRampScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A goods truck of mass 10000 kg rolls at 20 m/s to the foot of a sand ramp at 30 degrees, marked every 2 m along; each 2 m rises 1 m. The sand pushes back with 50000 N. Then the truck climbs: its kinetic energy bar drains into equal potential energy and heat bars. It stops 20 m up the ramp, where kinetic energy is zero and potential energy and heat are 1 000 000 J each.';

  enter() { this.mt = 0; }

  pointerDown() { this.mt = 0; this.animateFor(800); }

  get runS() {
    if (this.stage <= 0) return DRIVE_S;
    if (this.stage === 1) return tAt(D_MID) * SLOW;
    return (tAt(D_STOP) - tAt(D_MID)) * SLOW;
  }

  update(d) { this.mt = Math.min(this.runS + 0.1, (this.mt ?? 0) + d); }

  busy() { return (this.mt ?? 0) < this.runS + 0.1; }

  // front bumper, metres along the path, now
  get pos() {
    const m = this.mt ?? 0;
    if (this.stage <= 0) { const u = clamp01(m / DRIVE_S); return -9 + 9 * (1 - (1 - u) * (1 - u)); }
    const t0 = this.stage === 1 ? 0 : tAt(D_MID);
    const t1 = this.stage === 1 ? tAt(D_MID) : tAt(D_STOP);
    return dAt(Math.min(t1, t0 + m / SLOW));
  }

  get dNow() { return Math.max(0, this.stage <= 0 ? 0 : this.pos); }

  draw(ctx, c) {
    const rng = mulberry32(7);
    drawBackdrop(ctx, c, 'sky');
    this.hills(ctx, c);
    this.road(ctx, c);
    this.ramp(ctx, c, rng);
    this.marks(ctx, c);
    this.truck(ctx, c);
    this.arrows(ctx, c);
    if (this.stage >= 1) this.bars(ctx, c);
  }

  hills(ctx, c) {
    const far = mix(c.setGroundFar, c.bgDeep, 0.25);
    ctx.save();
    ctx.fillStyle = far;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    const ridge = [[0, 300], [70, 250], [130, 272], [210, 214], [300, 250], [380, 196], [470, 236], [560, 168], [680, 210]];
    for (const [x, y] of ridge) ctx.lineTo(x, y);
    ctx.lineTo(680, GROUND); ctx.lineTo(0, GROUND); ctx.closePath(); ctx.fill();
    // light flank on each peak, so the ridge has a sunny side
    ctx.fillStyle = lighten(far, 0.12);
    for (let i = 1; i < ridge.length - 1; i += 2) {
      const [x, y] = ridge[i], [bx, by] = ridge[i + 1];
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx, by); ctx.lineTo(x + 12, by + 40); ctx.closePath(); ctx.fill();
    }
    // the near hill the ramp is cut into, on the right
    const near = mix(c.setGround, c.s3, 0.18);
    ctx.fillStyle = near;
    const top = along(L_MAX);
    ctx.beginPath();
    ctx.moveTo(top.x - 30, top.y + 4);
    ctx.quadraticCurveTo(top.x + 4, top.y - 46, 680, top.y - 60);
    ctx.lineTo(680, GROUND); ctx.lineTo(top.x - 30, GROUND); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  road(ctx, c) {
    const tar = mix(c.stroke, c.bgDeep, 0.35);
    ctx.save();
    ctx.fillStyle = mix(c.setGround, c.label, 0.06);
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = tar;
    ctx.fillRect(0, GROUND, FOOT_X + 30, 22);
    ctx.fillStyle = lighten(tar, 0.18);
    ctx.fillRect(0, GROUND, FOOT_X + 30, 3);
    ctx.fillStyle = darken(tar, 0.25);
    ctx.fillRect(0, GROUND + 19, FOOT_X + 30, 3);
    ctx.fillStyle = alpha(c.label, 0.75);
    for (let x = 10; x < FOOT_X - 10; x += 46) ctx.fillRect(x, GROUND + 9, 24, 3);
    // kerb stones under the road edge
    for (let x = 0; x < W; x += 28) {
      ctx.fillStyle = (x / 28) % 2 ? alpha(c.label, 0.5) : alpha(c.s6, 0.55);
      ctx.fillRect(x, GROUND + 22, 28, 6);
    }
    ctx.restore();
  }

  ramp(ctx, c, rng) {
    const top = along(L_MAX);
    const earth = mix(c.setBand, c.setGround, 0.45);
    const sand = sandOf(c);
    ctx.save();
    // the embankment under the bed
    ctx.beginPath();
    ctx.moveTo(FOOT_X, GROUND); ctx.lineTo(top.x, top.y); ctx.lineTo(top.x + 30, top.y + 6);
    ctx.lineTo(top.x + 30, GROUND); ctx.closePath();
    ctx.fillStyle = earth; ctx.fill();
    ctx.fillStyle = darken(earth, 0.2);
    ctx.fillRect(top.x - 6, top.y + 14, 36, GROUND - top.y - 14);
    // earth strata: lighter streaks parallel to the ground
    ctx.save(); ctx.clip();
    ctx.strokeStyle = alpha(lighten(earth, 0.25), 0.5); ctx.lineWidth = 2;
    for (let y = GROUND - 20; y > top.y; y -= 26) {
      ctx.beginPath(); ctx.moveTo(FOOT_X, y); ctx.lineTo(top.x + 30, y + 6); ctx.stroke();
    }
    ctx.restore();
    // the arrester bed: a deep layer of loose sand and gravel along the slope,
    // a light top skin, a shaded foot, grain dots and pebbles
    const bed = BED;
    const a0 = pathPt(0), a1 = pathPt(L_MAX);
    ctx.beginPath();
    ctx.moveTo(a0.x - 6, a0.y); ctx.lineTo(a1.x, a1.y);
    ctx.lineTo(a1.x + SA * bed, a1.y + CA * bed); ctx.lineTo(a0.x + bed / SA, a0.y);
    ctx.closePath();
    ctx.fillStyle = sand; ctx.fill();
    ctx.save(); ctx.clip();
    // shade side: the lower half of the bed is darker, the deep sand under the skin
    ctx.fillStyle = darken(sand, 0.14);
    ctx.beginPath();
    for (const [p, k] of [[a0, 0.45], [a1, 0.45], [a1, 3], [a0, 3]]) ctx.lineTo(p.x + SA * bed * k, p.y + CA * bed * k);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 70; i++) {
      const d = rng() * L_MAX, o = 6 + rng() * (bed - 8);
      const p = pathPt(d);
      ctx.fillStyle = rng() < 0.5 ? darken(sand, 0.32) : mix(sand, c.stroke, 0.35);
      ctx.beginPath(); ctx.ellipse(p.x + SA * o, p.y + CA * o, 3 + rng() * 2.5, 2 + rng() * 1.5, rng() * 3, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 520; i++) {
      const d = rng() * L_MAX, o = rng() * bed * 1.6;
      const p = pathPt(d);
      ctx.fillStyle = rng() < 0.5 ? darken(sand, 0.22) : lighten(sand, 0.3);
      ctx.fillRect(p.x + SA * o, p.y + CA * o, 2, 2);
    }
    ctx.restore();
    ctx.strokeStyle = lighten(sand, 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y - 1); ctx.lineTo(a1.x, a1.y - 1); ctx.stroke();
    ctx.strokeStyle = darken(sand, 0.3); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a0.x + bed / SA, a0.y); ctx.lineTo(a1.x + SA * bed, a1.y + CA * bed); ctx.stroke();
    // a sand berm at the far end
    ctx.fillStyle = darken(sand, 0.08);
    ctx.beginPath(); ctx.ellipse(a1.x - 4, a1.y - 4, 22, 12, -ANG, Math.PI, 0); ctx.fill();
    ctx.restore();
  }

  marks(ctx, c) {
    const showRise = this.stage <= 0;
    ctx.save();
    // a marker post every 2 m along the bed
    for (let i = 1; i * 2 <= L_MAX; i++) {
      ctx.strokeStyle = alpha(c.label, 0.9); ctx.lineWidth = 3;
      const a = along(i * 2, 8), b = along(i * 2, -16);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // the 30 degree angle at the foot
    ctx.strokeStyle = alpha(c.label, 0.8); ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(FOOT_X, GROUND - 2); ctx.lineTo(FOOT_X + 120, GROUND - 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(FOOT_X, GROUND - 2, 72, -ANG, 0); ctx.stroke();
    pill(ctx, c, '30\u00b0', FOOT_X + 140, GROUND - 22, { bg: c.raised, ink: c.label, size: 26 });
    if (showRise) {
      // one step named: 2 m along, 1 m up (the step from 14 m to 16 m)
      const lo = pathPt(14), hi = pathPt(16);
      ctx.strokeStyle = c.gold; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(lo.x, lo.y); ctx.lineTo(hi.x, hi.y); ctx.stroke();
      ctx.strokeStyle = c.s7; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(hi.x, hi.y + 1); ctx.lineTo(hi.x, lo.y); ctx.stroke();
      const m = along(14.5, 36);
      pill(ctx, c, '2 m', m.x, m.y, { bg: c.gold, size: 26 });
      pill(ctx, c, '1 m', hi.x + 44, (hi.y + lo.y) / 2 + 4, { bg: c.s7, size: 26 });
    }
    ctx.restore();
  }

  truck(ctx, c) {
    const front = pathPt(this.pos);
    const back = this.pos <= 0 ? pathPt(this.pos - TL / PX)
      : (() => { const r = this.pos - TL / PX; return r >= 0 ? pathPt(r) : backOnKink(front, TL); })();
    const ang = Math.atan2(front.y - back.y, front.x - back.x);
    const sand = sandOf(c);
    const rear = this.pos - TL / PX;
    // ruts: the grooves the wheels cut in the bed behind the truck
    if (this.pos > 0) {
      const r1 = Math.max(0, rear + 0.6);
      if (r1 > 0.2) {
        const a = along(0, -3), b = along(r1, -3);
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = darken(sand, 0.34); ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        const a2 = along(0, 1), b2 = along(r1, 1);
        ctx.strokeStyle = lighten(sand, 0.3); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
        ctx.restore();
      }
    }
    // on the bed the wheels sink into the sand
    const sink = 13 * clamp01(this.pos / 1.5);
    if (sink < 1) drawShadow(ctx, c, (front.x + back.x) / 2, (front.y + back.y) / 2 + 2, TL * 0.52, 7, 0.9);
    ctx.save();
    ctx.translate(front.x, front.y);
    ctx.rotate(ang);
    ctx.translate(0, sink);
    ctx.scale(TS, TS);
    paintTruck(ctx, c);
    ctx.restore();
    if (sink >= 1) {
      // sand over the sunk wheel bottoms, heaped a little in front of each wheel
      const lo = Math.max(0, rear - 0.3), hi = this.pos + 0.4;
      const p0 = along(lo, 0), p1 = along(hi, 0), q1 = along(hi, -sink - 6), q0 = along(lo, -sink - 6);
      ctx.save();
      ctx.fillStyle = sand;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(q1.x, q1.y); ctx.lineTo(q0.x, q0.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = darken(sand, 0.14);
      ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.lineTo(along(hi, -sink - 14).x, along(hi, -sink - 14).y); ctx.lineTo(along(lo, -sink - 14).x, along(lo, -sink - 14).y); ctx.closePath(); ctx.fill();
      for (const wx of [22, 86, 102]) {
        const wd = this.pos - (wx * TS) / PX + 0.85;
        if (wd < 0.3) continue;
        const m = along(wd, 1);
        ctx.fillStyle = lighten(sand, 0.08);
        ctx.beginPath(); ctx.ellipse(m.x, m.y, 15, 7, -ANG, Math.PI, 0); ctx.fill();
      }
      ctx.strokeStyle = lighten(sand, 0.35); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y - 1); ctx.lineTo(p1.x, p1.y - 1); ctx.stroke();
      ctx.restore();
    }
  }

  arrows(ctx, c) {
    const red = c.s6;
    if (this.stage <= 0) {
      // the sand's push, drawn on the bed ahead of the truck, pointing back down the ramp
      const a = along(9, 16);
      vectorArrow(ctx, c, a.x, a.y, { angle: Math.PI - ANG, length: 110, col: red, width: 6, head: 16 });
      const lp = along(10.4, -52);
      pill(ctx, c, 'F = 50000 N', lp.x + 8, lp.y, { bg: red, size: 26 });
      // the truck: mass and speed
      const u = clamp01((this.mt ?? 0) / DRIVE_S);
      const f = pathPt(this.pos);
      pill(ctx, c, `${MASS} kg`, f.x - TL / 2, f.y - 136, { bg: c.s2, size: 26 });
      vectorArrow(ctx, c, f.x - TL / 2 - 60, f.y - 180, { angle: 0, length: 80, col: c.s1, width: 5, alpha: 0.4 + 0.6 * u });
      pill(ctx, c, `${V0} m/s`, f.x - TL / 2 + 78, f.y - 180, { bg: c.s1, size: 26 });
      return;
    }
    const d = this.pos;
    // F on the truck, from its front wheel's contact, down the ramp
    // F on the truck, from its rear, pointing back down the ramp
    const rear = d - TL / PX;
    const w = along(rear + 0.2, 22);
    vectorArrow(ctx, c, w.x, w.y, { angle: Math.PI - ANG, length: 92, col: red, width: 6, head: 16 });
    // its name sits just left of the arrowhead, level with it (not down on the road)
    const hx = w.x - 92 * CA, hy = w.y + 92 * SA;
    const fw = pill(ctx, c, 'F = 50000 N', 0, 0, { size: 26, alpha: 0 }).w;
    let fx = hx - 10, fy = hy - 14;
    if (fx - fw < 8) { fx = 8 + fw; fy = hy - 52; }   // near the foot: inside the frame, just above the head
    pill(ctx, c, 'F = 50000 N', fx, fy, { bg: red, size: 26, align: 'right' });
    // d: from the foot to the front bumper, above the truck
    const p0 = along(0, 168), p1 = along(d, 168);
    displacementArrow(ctx, c, p0.x, p0.y, p1.x, p1.y, {
      tone: 2, label: this.stage >= 2 && !this.busy() ? 'd = 20 m' : 'd', side: -1, at: this.stage >= 2 && !this.busy() ? 0.62 : 0.9, size: 26,
    });
    ctx.save();
    ctx.strokeStyle = alpha(c.s2, 0.6); ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    const f0 = along(0, 0), f1 = along(d, 0);
    ctx.beginPath(); ctx.moveTo(f0.x, f0.y); ctx.lineTo(p0.x, p0.y);
    ctx.moveTo(f1.x, f1.y - 2); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.restore();
  }

  bars(ctx, c) {
    const d = this.dNow;
    const fade = this.stage === 1 ? clamp01((this.mt ?? 0) / 0.3) : 1;
    const values = { K: K0 - 2 * F_SAND * d, U: F_SAND * d, heat: F_SAND * d };
    const box = drawEnergyBars(ctx, c, { x: 14, y: 14, h: 128, max: K0, total: K0, size: 26, minSize: 26, values,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }, { id: 'heat', label: 'heat', tone: 8 }], alpha: fade });
    // one number: the total line is the 2 000 000 J the truck starts with
    const ty = box.baseY - 3 - (128 - 6);
    pill(ctx, c, `${fmt(K0)} J`, box.x0 + box.w + 96, ty, { bg: c.raised, ink: c.label, size: 26, alpha: fade });
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(box.x0 + box.w - 6, ty); ctx.lineTo(box.x0 + box.w + 20, ty); ctx.stroke();
    ctx.restore();
  }
}

// When the rear is still on the road and the front is on the ramp: the rear
// point on the road TL px from the front.
function backOnKink(front, len) {
  // solve (FOOT_X - s - front.x)^2 + (GROUND - front.y)^2 = len^2 for s >= 0
  const dy = GROUND - front.y;
  const dx = Math.sqrt(Math.max(0, len * len - dy * dy));
  return { x: front.x - dx, y: GROUND };
}

// The goods truck, side on, facing right; origin at the front bumper on the
// ground, x back is negative, up is negative. No face: one lamp, side view.
function paintTruck(ctx, c) {
  const cab = c.s2, wood = mix(c.gold, c.setBand, 0.45), steel = mix(c.stroke, c.bgDeep, 0.3);
  const tyre = darken(mix(c.stroke, c.bgDeep, 0.3), 0.45);
  // chassis
  ctx.fillStyle = steel;
  ctx.fillRect(-120, -30, 118, 9);
  ctx.fillStyle = darken(steel, 0.3);
  ctx.fillRect(-120, -23, 118, 2);
  // cargo body: wooden planks, painted top band, corner posts
  const bx = -122, bw = 78, by = -86, bh = 56;
  rr(ctx, bx, by, bw, bh, 3);
  ctx.fillStyle = wood; ctx.fill();
  ctx.fillStyle = lighten(wood, 0.22); ctx.fillRect(bx + 3, by + 14, 5, bh - 17);
  ctx.fillStyle = darken(wood, 0.2); ctx.fillRect(bx + bw - 12, by + 14, 9, bh - 17);
  ctx.strokeStyle = darken(wood, 0.32); ctx.lineWidth = 1.5;
  for (let y = by + 22; y < by + bh - 2; y += 8) { ctx.beginPath(); ctx.moveTo(bx + 2, y); ctx.lineTo(bx + bw - 2, y); ctx.stroke(); }
  // the painted band along the top, in the truck-art way: triangles of two colours
  ctx.fillStyle = c.s6; ctx.fillRect(bx, by, bw, 14);
  ctx.fillStyle = c.s3;
  for (let x = bx + 2; x < bx + bw - 8; x += 12) {
    ctx.beginPath(); ctx.moveTo(x, by + 13); ctx.lineTo(x + 6, by + 2); ctx.lineTo(x + 12, by + 13); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = lighten(c.s6, 0.3); ctx.fillRect(bx, by, bw, 2);
  ctx.fillStyle = darken(wood, 0.4);
  for (const x of [bx, bx + bw / 2 - 2, bx + bw - 5]) ctx.fillRect(x, by + 14, 5, bh - 14);
  ctx.strokeStyle = darken(wood, 0.5); ctx.lineWidth = 2;
  rr(ctx, bx, by, bw, bh, 3); ctx.stroke();
  // cab: boxy, a raked front, a visor over the windscreen
  ctx.beginPath();
  ctx.moveTo(-42, -26); ctx.lineTo(-42, -78); ctx.lineTo(-12, -78); ctx.lineTo(-3, -52); ctx.lineTo(-1, -26); ctx.closePath();
  ctx.fillStyle = cab; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = lighten(cab, 0.3); ctx.fillRect(-42, -78, 40, 5);
  ctx.fillStyle = darken(cab, 0.22); ctx.fillRect(-42, -40, 42, 14);
  ctx.restore();
  ctx.strokeStyle = darken(cab, 0.45); ctx.lineWidth = 2; ctx.stroke();
  // side window and windscreen edge
  ctx.beginPath();
  ctx.moveTo(-36, -72); ctx.lineTo(-14, -72); ctx.lineTo(-7, -54); ctx.lineTo(-36, -54); ctx.closePath();
  ctx.fillStyle = mix(c.glass, c.bgDeep, 0.25); ctx.fill();
  ctx.fillStyle = alpha(c.label, 0.45);
  ctx.beginPath(); ctx.moveTo(-32, -70); ctx.lineTo(-24, -70); ctx.lineTo(-30, -56); ctx.lineTo(-34, -56); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = darken(cab, 0.45); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-36, -72); ctx.lineTo(-14, -72); ctx.lineTo(-7, -54); ctx.lineTo(-36, -54); ctx.closePath(); ctx.stroke();
  // visor
  ctx.fillStyle = darken(cab, 0.3);
  ctx.beginPath(); ctx.moveTo(-14, -80); ctx.lineTo(0, -80); ctx.lineTo(-6, -74); ctx.lineTo(-14, -74); ctx.closePath(); ctx.fill();
  // door line and handle, step
  ctx.strokeStyle = darken(cab, 0.4); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-38, -50); ctx.lineTo(-38, -30); ctx.moveTo(-38, -50); ctx.lineTo(-10, -50); ctx.stroke();
  ctx.fillStyle = darken(cab, 0.5); ctx.fillRect(-20, -46, 8, 3);
  // bumper and the one lamp
  ctx.fillStyle = steel; rr(ctx, -6, -32, 9, 12, 2); ctx.fill();
  ctx.fillStyle = c.gold; ctx.beginPath(); ctx.arc(-3, -40, 4, 0, Math.PI * 2); ctx.fill();
  // mud flap behind the rear wheel
  ctx.fillStyle = darken(steel, 0.35); ctx.fillRect(-118, -24, 5, 18);
  // wheels: tyre, rim, hub
  for (const x of [-22, -86, -102]) {
    ctx.fillStyle = tyre; ctx.beginPath(); ctx.arc(x, -14, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix(c.label, c.stroke, 0.45); ctx.beginPath(); ctx.arc(x, -14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lighten(mix(c.label, c.stroke, 0.45), 0.3); ctx.beginPath(); ctx.arc(x - 2, -16, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}
