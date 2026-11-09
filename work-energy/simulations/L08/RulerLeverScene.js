// RulerLeverScene - book Activity 7.4 (Fig 7.31): a 30 cm steel scale over a pencil,
// a stapler on one end, erasers on the other.
// Three mounts:
//   blk-l08-s01 (2 beats): stage 0 the pencil near the stapler end, one eraser drops on
//     the far end and the stapler rises; stage 1 the same rest, the fixed point lit and
//     the scale named a lever (dashed ghost of where it started, both ends turning).
//   blk-l08-s03 (1 beat): stage 2 the pencil in the middle, equal arms, erasers stack
//     into three slots until they weigh as much as the stapler and the scale levels.
//   blk-l08-s02 (predict setup, hostRole 'setup', beat MAX_SAFE_INTEGER): stage 3 the
//     pencil in the middle, the stapler on one end, no erasers, nothing else.
// Model: the stapler weighs as much as 3 erasers (a made-up ratio, said on screen in
// stage 2). Arms in cm: stage 0, 4 (stapler) and 20 (eraser): 1 x 20 > 3 x 4.
// Stage 2, 12 and 12: 3 erasers balance. The pencil is drawn about twice its real
// thickness so the tilt reads (eraser end on the desk, stapler end up about 55 px).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawShadow, pill, alpha, luma, lighten, darken, mix, rr, clamp01, lerp,
} from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const MAP2 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP1 = [[{ idx: 2, dwellMs: null }]];
const SETUP_MAP = [[{ idx: 3, dwellMs: null }]];

const PX = 19.4;          // px per cm: the scale is 582 px, 86% of the frame
const X0 = 49;            // the scale's 0 cm end
const DESK_Y = 392;       // where things touch the desk
const PEN_R = 21;         // pencil half-thickness (drawn about 3x real, so the tilt reads)
const FRONT = 11;         // the scale's front edge
const TOPF = 11;          // the scale's top face, seen a little from above
const SEAT = -FRONT - TOPF * 0.5; // objects stand on the middle of the top face
const STAP_CM = 3;
const ERAS_CM = 27;
const ER_W = 70, ER_H = 36;
const ST_W = 104;
const ST_K = 1.12; // the stapler drawn a little over its path size

const sm = (u) => u * u * (3 - 2 * u);
const settle = (u) => { // a small overshoot then rest
  const v = clamp01(u);
  return 1 - (1 - v) * (1 - v) * Math.cos(v * Math.PI * 1.5);
};

export class RulerLeverScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP2;
  static BEAT_MAPS = { 2: MAP2, 1: MAP1, 0: SETUP_MAP, [Number.MAX_SAFE_INTEGER]: SETUP_MAP };
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A 30 cm steel scale lies across a pencil on a desk, with a stapler on one end. With the pencil near the stapler end, one eraser dropped on the far end tips the scale and lifts the stapler. The pencil is the fixed point the scale turns about: the scale is a lever. With the pencil under the middle, both arms are equal and three erasers, as heavy as the stapler, are needed before the stapler lifts.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  get setupView() { return this.hostRole === 'setup' || !(this.stage <= 2); }

  enter() { this.runT0 = this.age; }

  isControlHidden(id) { return id === 'again' && this.setupView; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') { this.runT0 = this.age; this.animateFor?.(200); }
  }

  t() { return reducedMotion() ? 99 : this.age - (this.runT0 || 0); }

  busy() {
    if (this.setupView) return false;
    return this.t() < [2.3, 2.4, 3.6][this.stage];
  }

  // geometry for a pencil at p cm
  geo(p) {
    const px = X0 + p * PX;
    const P = { x: px, y: DESK_Y - 2 * PEN_R };
    const left = p * PX, right = (30 - p) * PX;
    const aL = -Math.asin((2 * PEN_R) / left);   // stapler end on the desk
    const aR = Math.asin((2 * PEN_R) / right);   // eraser end on the desk
    return { p, P, left, right, aL, aR, lx: (cm) => (cm - p) * PX };
  }

  // world point of a bar-local point
  wp(g, a, lx, ly) {
    const cs = Math.cos(a), sn = Math.sin(a);
    return { x: g.P.x + lx * cs - ly * sn, y: g.P.y + lx * sn + ly * cs };
  }

  draw(ctx, c) {
    const t = this.t();
    this.wall(ctx, c);
    this.desk(ctx, c);
    if (this.setupView) { this.rig(ctx, c, this.geo(15), { a: this.geo(15).aL, n: 0 }); return; }
    if (this.stage === 0 || this.stage === 1) this.tipStages(ctx, c, t, this.stage);
    else this.equalArms(ctx, c, t);
  }

  // -- stages 0 and 1 -----------------------------------------------------------------

  tipStages(ctx, c, t, s) {
    const g = this.geo(7);
    const LAND = 0.85, TIP0 = 0.9, TIP1 = 1.6;
    let a = g.aR, drop = 0, n = 1;
    if (s === 0) {
      const u = clamp01((t - TIP0) / (TIP1 - TIP0));
      a = lerp(g.aL, g.aR, settle(u));
      const fu = clamp01((t - 0.3) / (LAND - 0.3));
      drop = t < 0.3 ? -1 : (1 - fu * fu) * 210;
      if (t < 0.3) n = 0;
    }
    if (s === 1) this.ghostBar(ctx, c, g, g.aL);
    this.rig(ctx, c, g, { a, n, drop: n ? drop : 0, dropIdx: 0, glow: s === 1 ? clamp01(t / 0.5) : 0 });
    if (s === 1) { this.ghostStapler(ctx, c, g, g.aL, clamp01(t / 0.5)); this.leverMarks(ctx, c, g, t); }
    if (s === 0 && t > TIP1) this.riseArrow(ctx, c, g, a, clamp01((t - TIP1) / 0.4));
  }

  // a dashed rise arrow beside the stapler end: from the desk up to where the end is now
  riseArrow(ctx, c, g, a, k) {
    const end = this.wp(g, a, -g.left, 0);
    const x = end.x - 22, y0 = DESK_Y - 2, y1 = end.y - 2;
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.strokeStyle = c.accent;
    ctx.fillStyle = c.accent;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 + 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x, y1 - 2); ctx.lineTo(x - 8, y1 + 11); ctx.lineTo(x + 8, y1 + 11); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 10, y0); ctx.lineTo(x + 10, y0); ctx.stroke();
    ctx.restore();
  }

  ghostStapler(ctx, c, g, a, k) {
    ctx.save();
    ctx.globalAlpha *= 0.55 * k;
    const pt = this.wp(g, a, g.lx(STAP_CM), SEAT);
    ctx.translate(pt.x, pt.y);
    ctx.rotate(a);
    ctx.scale(ST_K, ST_K);
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2 / ST_K;
    this.staplerPath(ctx);
    ctx.stroke();
    ctx.restore();
    // a dashed rise arrow from the old place to the new one
    const top = this.wp(g, g.aR, g.lx(STAP_CM) - ST_W * ST_K / 2 - 20, SEAT);
    const bot = this.wp(g, a, g.lx(STAP_CM) - ST_W * ST_K / 2 - 20, SEAT);
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(bot.x, bot.y);
    ctx.lineTo(top.x, top.y + 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y - 4);
    ctx.lineTo(top.x - 7, top.y + 8);
    ctx.lineTo(top.x + 7, top.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    pill(ctx, c, 's', top.x, top.y - 30, { size: 26, bg: c.accent, alpha: k });
  }

  ghostBar(ctx, c, g, a) {
    ctx.save();
    ctx.translate(g.P.x, g.P.y);
    ctx.rotate(a);
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = alpha(c.label, 0.45);
    ctx.lineWidth = 2;
    rr(ctx, -g.left, -FRONT - TOPF, g.left + g.right, FRONT + TOPF, 3);
    ctx.stroke();
    ctx.restore();
  }

  // the fixed point, the turning, the word
  leverMarks(ctx, c, g, t) {
    const k = clamp01((t - 0.2) / 0.5);
    const P = g.P;
    // pulse ring on the contact point (two pulses, then still)
    const pu = clamp01(t / 1.6);
    const pr = 14 + 10 * Math.abs(Math.sin(pu * Math.PI * 2));
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.fillStyle = alpha(c.good, 0.25);
    ctx.beginPath(); ctx.arc(P.x, P.y, pr + 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.good;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(P.x, P.y, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = c.good;
    ctx.beginPath(); ctx.arc(P.x, P.y, 5, 0, Math.PI * 2); ctx.fill();
    // two turning arcs about the fixed point: the stapler end up, the eraser end down
    // two turning arcs about the fixed point, just past the ends: the stapler end up, the eraser end down
    ctx.strokeStyle = c.accent;
    ctx.fillStyle = c.accent;
    ctx.lineWidth = 3;
    for (const [R, base] of [[g.left + 20, Math.PI], [g.right + 20, 0]]) {
      const s0 = base + g.aL, s1 = base + g.aR;
      ctx.beginPath();
      ctx.arc(P.x, P.y, R, s0, s1, false);
      ctx.stroke();
      const hx = P.x + R * Math.cos(s1), hy = P.y + R * Math.sin(s1);
      const tx = -Math.sin(s1), ty = Math.cos(s1); // direction of travel
      const nx = -ty, ny = tx;
      ctx.beginPath();
      ctx.moveTo(hx + tx * 10, hy + ty * 10);
      ctx.lineTo(hx - tx * 4 + nx * 8, hy - ty * 4 + ny * 8);
      ctx.lineTo(hx - tx * 4 - nx * 8, hy - ty * 4 - ny * 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // the words
    const k2 = clamp01((t - 0.6) / 0.4);
    ctx.save();
    ctx.globalAlpha *= k2;
    ctx.strokeStyle = c.good;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(P.x + 10, P.y + 34);
    ctx.lineTo(P.x + 40, DESK_Y + 42);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, 'fixed point', P.x + 40, DESK_Y + 58, { size: 26, bg: c.good, alpha: k2, align: 'left' });
    const lp = this.wp(g, g.aR, g.lx(17), -FRONT - TOPF - 150);
    pill(ctx, c, 'lever', lp.x, lp.y, { size: 28, bg: c.accent, alpha: clamp01((t - 0.9) / 0.4) });
  }

  // -- stage 2: equal arms ------------------------------------------------------------

  equalArms(ctx, c, t) {
    const g = this.geo(15);
    const D = [0.4, 1.2, 2.0], FALL = 0.45, TIP0 = 2.6, TIP1 = 3.2;
    let n = 0, drop = 0, dropIdx = -1;
    for (let i = 0; i < 3; i++) {
      if (t >= D[i]) {
        n = i + 1;
        const fu = clamp01((t - D[i]) / FALL);
        if (fu < 1) { drop = (1 - fu * fu) * 200; dropIdx = i; }
      }
    }
    const a = lerp(g.aL, 0, settle(clamp01((t - TIP0) / (TIP1 - TIP0))));
    this.armBrackets(ctx, c, g);
    this.rig(ctx, c, g, { a, n, drop, dropIdx, slots: 3 });
    // the made-up weight, on the stapler
    const sp = this.wp(g, a, g.lx(STAP_CM), SEAT - 86);
    pill(ctx, c, 'as heavy as 3 erasers', sp.x - 50, sp.y, { size: 26, bg: c.s4, align: 'left' });
  }

  armBrackets(ctx, c, g) {
    const y = DESK_Y + 52;
    const xs = X0 + STAP_CM * PX, xp = g.P.x, xe = X0 + ERAS_CM * PX;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.75);
    ctx.lineWidth = 2.5;
    for (const [x0, x1] of [[xs, xp - 4], [xp + 4, xe]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y - 12); ctx.lineTo(x0, y + 12);
      ctx.moveTo(x1, y - 12); ctx.lineTo(x1, y + 12);
      ctx.moveTo(x0, y); ctx.lineTo(x1, y);
      ctx.stroke();
    }
    ctx.restore();
    pill(ctx, c, '12 cm', (xs + xp) / 2, y, { size: 26, bg: c.bgSurface });
    pill(ctx, c, '12 cm', (xp + xe) / 2, y, { size: 26, bg: c.bgSurface });
  }

  // -- the apparatus ------------------------------------------------------------------

  wall(ctx, c) {
    const wall = mix(c.bgSurface, c.gold, 0.1);
    const gr = ctx.createLinearGradient(0, 0, 0, 124);
    gr.addColorStop(0, darken(wall, 0.06));
    gr.addColorStop(1, lighten(wall, 0.08));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, 124);
    // a soft lamp pool on the wall behind the scale
    const rg = ctx.createRadialGradient(340, 120, 20, 340, 120, 320);
    rg.addColorStop(0, alpha(lighten(wall, 0.4), 0.7));
    rg.addColorStop(1, alpha(lighten(wall, 0.4), 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, 124);
    // the wall meets the desk's back edge
    ctx.fillStyle = alpha(darken(wall, 0.4), 0.35);
    ctx.fillRect(0, 114, W, 6);
  }

  desk(ctx, c) {
    const night = luma(c.bgDeep) < 0.4;
    const wood = darken(mix(c.gold, c.flame, 0.25), night ? 0.42 : 0);
    const back = 120, front = DESK_Y + 26;
    // top surface, lit toward the back
    const gr = ctx.createLinearGradient(0, back, 0, front);
    gr.addColorStop(0, lighten(wood, 0.28));
    gr.addColorStop(1, wood);
    ctx.fillStyle = gr;
    ctx.fillRect(0, back, W, front - back);
    // grain
    ctx.save();
    ctx.strokeStyle = alpha(darken(wood, 0.35), 0.35);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) {
      const y = back + 8 + i * i * 0.8 + i * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.013 + i * 1.7) * 2.2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = lighten(wood, 0.45);
    ctx.fillRect(0, front - 3, W, 3);
    // front apron and the dark below
    ctx.fillStyle = darken(wood, 0.22);
    ctx.fillRect(0, front, W, 30);
    ctx.fillStyle = darken(wood, 0.4);
    ctx.fillRect(0, front + 26, W, 4);
    ctx.fillStyle = mix(c.bgDeep, wood, 0.18);
    ctx.fillRect(0, front + 30, W, H - front - 30);
  }

  pencil(ctx, c, g) {
    const { x } = g.P;
    const cy = DESK_Y - PEN_R;
    drawShadow(ctx, c, x + 6, DESK_Y + 2, 34, 6, 0.9);
    // the body going back into the desk, a little up and to the right
    const dx = 26, dy = -20;
    const paint = c.s2;
    ctx.fillStyle = darken(paint, 0.25);
    ctx.beginPath();
    ctx.moveTo(x - PEN_R * 0.5, cy - PEN_R * 0.87);
    ctx.lineTo(x - PEN_R * 0.5 + dx, cy - PEN_R * 0.87 + dy);
    ctx.lineTo(x + PEN_R + dx, cy + dy);
    ctx.lineTo(x + PEN_R * 0.5 + dx, cy + PEN_R * 0.87 + dy);
    ctx.lineTo(x + PEN_R * 0.5, cy + PEN_R * 0.87);
    ctx.lineTo(x + PEN_R, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lighten(paint, 0.2);
    ctx.beginPath();
    ctx.moveTo(x - PEN_R * 0.5, cy - PEN_R * 0.87);
    ctx.lineTo(x - PEN_R * 0.5 + dx, cy - PEN_R * 0.87 + dy);
    ctx.lineTo(x + PEN_R * 0.5 + dx, cy - PEN_R * 0.87 + dy);
    ctx.lineTo(x + PEN_R * 0.5, cy - PEN_R * 0.87);
    ctx.closePath();
    ctx.fill();
    // the cut end: a painted hexagon, a wood ring, the lead
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * Math.PI * 2;
      const px = x + PEN_R * Math.cos(an), py = cy + PEN_R * Math.sin(an);
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = paint;
    ctx.fill();
    ctx.strokeStyle = darken(paint, 0.45);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = lighten(mix(c.gold, c.flame, 0.2), 0.35);
    ctx.beginPath(); ctx.arc(x, cy, PEN_R * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(c.stroke, 0.3);
    ctx.beginPath(); ctx.arc(x, cy, PEN_R * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  // the scale (bar), with what stands on it; o: { a, n, drop, dropIdx, slots, glow }
  rig(ctx, c, g, o) {
    this.pencil(ctx, c, g);
    const a = o.a;
    // contact shadows on the desk for the two ends
    const endL = this.wp(g, a, -g.left, 0), endR = this.wp(g, a, g.right, 0);
    drawShadow(ctx, c, endL.x + 10, DESK_Y + 1, 30, 4, clamp01(1 - (DESK_Y - endL.y) / 40));
    drawShadow(ctx, c, endR.x - 10, DESK_Y + 1, 30, 4, clamp01(1 - (DESK_Y - endR.y) / 40));
    const sp = this.wp(g, a, g.lx(STAP_CM), 0);
    drawShadow(ctx, c, sp.x, DESK_Y + 2, 48, 6, 0.5 * clamp01(1 - (DESK_Y - sp.y) / 80));
    ctx.save();
    ctx.translate(g.P.x, g.P.y);
    ctx.rotate(a);
    this.scaleBar(ctx, c, g, o.glow || 0);
    // stapler
    ctx.save();
    ctx.translate(g.lx(STAP_CM), SEAT);
    ctx.scale(ST_K, ST_K);
    this.stapler(ctx, c);
    ctx.restore();
    // slots for the needed erasers
    const ex = g.lx(ERAS_CM);
    for (let i = (o.n || 0); i < (o.slots || 0); i++) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = alpha(c.label, 0.55);
      ctx.lineWidth = 2;
      rr(ctx, ex - ER_W / 2, SEAT - (i + 1) * ER_H, ER_W, ER_H - 1, 5);
      ctx.stroke();
      ctx.restore();
    }
    // landed erasers
    for (let i = 0; i < (o.n || 0); i++) {
      if (i === o.dropIdx && o.drop > 0) continue;
      this.eraser(ctx, c, ex, SEAT - i * ER_H, i);
    }
    ctx.restore();
    // a falling eraser, upright in the bar's tilt, above its landing place
    if (o.dropIdx != null && o.dropIdx >= 0 && o.drop > 0) {
      const lp = this.wp(g, a, ex, SEAT - o.dropIdx * ER_H);
      ctx.save();
      ctx.translate(lp.x, lp.y - o.drop);
      ctx.rotate(a);
      this.eraser(ctx, c, 0, 0, o.dropIdx);
      ctx.restore();
    }
  }

  scaleBar(ctx, c, g, glow) {
    const x0 = -g.left, len = g.left + g.right;
    const steel = mix(c.water, c.stroke, 0.45);
    if (glow > 0) {
      ctx.save();
      ctx.globalAlpha *= glow;
      ctx.strokeStyle = alpha(c.accent, 0.5);
      ctx.lineWidth = 10;
      rr(ctx, x0 - 3, -FRONT - TOPF - 3, len + 6, FRONT + TOPF + 6, 5);
      ctx.stroke();
      ctx.restore();
    }
    // top face (lit)
    ctx.fillStyle = lighten(steel, 0.38);
    rr(ctx, x0, -FRONT - TOPF, len, TOPF + 2, 2);
    ctx.fill();
    // front edge (shade)
    ctx.fillStyle = darken(steel, 0.18);
    rr(ctx, x0, -FRONT, len, FRONT, 2);
    ctx.fill();
    ctx.fillStyle = lighten(steel, 0.12);
    ctx.fillRect(x0 + 2, -FRONT + 1, len - 4, 2);
    // the hanging hole and the end
    ctx.fillStyle = darken(steel, 0.35);
    ctx.beginPath(); ctx.ellipse(x0 + len - 14, -FRONT - TOPF * 0.5, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    // cm ticks on the top face
    ctx.strokeStyle = darken(steel, 0.5);
    ctx.lineWidth = 1.2;
    for (let i = 1; i < 30; i++) {
      const x = x0 + i * PX;
      const l = i % 10 === 0 ? TOPF : i % 5 === 0 ? TOPF * 0.75 : TOPF * 0.45;
      ctx.beginPath();
      ctx.moveTo(x, -FRONT - TOPF);
      ctx.lineTo(x, -FRONT - TOPF + l);
      ctx.stroke();
    }
    ctx.strokeStyle = darken(steel, 0.55);
    ctx.lineWidth = 1.5;
    rr(ctx, x0, -FRONT - TOPF, len, FRONT + TOPF, 2);
    ctx.stroke();
  }

  staplerPath(ctx) {
    const w = ST_W;
    // side view: base plate, then the top arm hinged at the left with a rounded nose at the right
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2, -8);
    ctx.lineTo(-w / 2 + 14, -8);
    ctx.lineTo(-w / 2 + 14, -14);
    ctx.lineTo(w / 2 + 4, -18);
    ctx.quadraticCurveTo(w / 2 + 10, -26, w / 2, -34);
    ctx.lineTo(-w / 2 + 10, -40);
    ctx.quadraticCurveTo(-w / 2, -40, -w / 2, -28);
    ctx.closePath();
  }

  stapler(ctx, c) {
    const w = ST_W;
    const body = c.s4;
    const metal = mix(c.stroke, c.bgSurface, 0.35);
    // base plate (metal)
    ctx.fillStyle = darken(metal, 0.2);
    rr(ctx, -w / 2, -8, w, 8, 3);
    ctx.fill();
    ctx.fillStyle = lighten(metal, 0.3);
    ctx.fillRect(-w / 2 + 3, -8, w - 6, 2);
    // anvil plate at the nose
    ctx.fillStyle = darken(metal, 0.4);
    ctx.fillRect(w / 2 - 22, -10, 16, 3);
    // hinge block at the back
    ctx.fillStyle = darken(body, 0.35);
    rr(ctx, -w / 2, -30, 18, 24, 4);
    ctx.fill();
    // magazine (metal, under the arm)
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 14, -14);
    ctx.lineTo(w / 2 - 4, -17);
    ctx.lineTo(w / 2 - 4, -23);
    ctx.lineTo(-w / 2 + 14, -22);
    ctx.closePath();
    ctx.fill();
    // top arm
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 2, -24);
    ctx.lineTo(w / 2 - 2, -22);
    ctx.quadraticCurveTo(w / 2 + 10, -24, w / 2 + 2, -34);
    ctx.lineTo(-w / 2 + 10, -42);
    ctx.quadraticCurveTo(-w / 2, -42, -w / 2 + 2, -24);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(-w / 2, -29, w + 12, 8);
    ctx.fillStyle = lighten(body, 0.35);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 8, -39);
    ctx.lineTo(w / 2 - 6, -33);
    ctx.lineTo(w / 2 - 6, -30);
    ctx.lineTo(-w / 2 + 8, -36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = darken(body, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // rubber foot under the nose
    ctx.fillStyle = darken(c.stroke, 0.4);
    rr(ctx, w / 2 - 20, -2, 14, 3, 1.5);
    ctx.fill();
  }

  eraser(ctx, c, x, bottom, i) {
    const col = i % 2 ? lighten(c.s1, 0.12) : c.s1;
    const x0 = x - ER_W / 2, y0 = bottom - ER_H;
    ctx.fillStyle = darken(col, 0.4);
    rr(ctx, x0 - 1, y0 - 1, ER_W + 2, ER_H + 1, 6);
    ctx.fill();
    ctx.fillStyle = col;
    rr(ctx, x0, y0, ER_W, ER_H - 1, 5);
    ctx.fill();
    ctx.fillStyle = darken(col, 0.18);
    ctx.fillRect(x0 + ER_W * 0.7, y0 + 2, ER_W * 0.3 - 3, ER_H - 4);
    ctx.fillStyle = lighten(col, 0.4);
    ctx.fillRect(x0 + 3, y0 + 2, ER_W - 8, 3);
    // the paper sleeve
    const paper = lighten(c.s2, 0.7);
    ctx.fillStyle = paper;
    ctx.fillRect(x0 + ER_W * 0.3, y0 + 1, ER_W * 0.42, ER_H - 3);
    ctx.fillStyle = darken(paper, 0.15);
    ctx.fillRect(x0 + ER_W * 0.62, y0 + 1, ER_W * 0.1, ER_H - 3);
    ctx.strokeStyle = alpha(darken(paper, 0.4), 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + ER_W * 0.36, y0 + ER_H * 0.45);
    ctx.lineTo(x0 + ER_W * 0.58, y0 + ER_H * 0.45);
    ctx.stroke();
  }
}
