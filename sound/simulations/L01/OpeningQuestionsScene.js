/**
 * OpeningQuestionsScene - slide "Two Questions" (L01, blk-l01-n01), 2 beats. New 2026-11-03.
 *
 * b0 deep space over the curve of the Earth: a station truss with its robot arm across the
 *    width, two astronauts close together, one working on the open panel with a wrench, the
 *    other floating beside. A "?" between their helmets. No sound arcs (L02 answers it).
 * b1 night sky over trees: a bat flapping, a moth ahead of it, a "?" by the bat. No pulses
 *    or echoes (L07 answers it).
 * Pictures only; nothing to tap. Each beat settles on a fixed frame (bat wings raised).
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lighten, darken, pill, clamp01, outBack, mulberry32, ellipse } from 'simulations/base/kit/SimLook.js';
import { drawAstronaut, drawStationArm, drawBat, drawMoth } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const FLAP_HZ = 2.2;
const HUB = { x: 312, y: 132 };          // the arm's elbow joint (drawStationArm, at 0.76 / lift 0.35)
const TEND0 = 3.2;                      // b0 comes to rest here
const TEND1 = 10.5 / FLAP_HZ;           // b1: parks at phase 0.5 (wings raised over the body, both in sight)

// Seeded star field, fixed for every frame (no Math.random in drawing).
const STARS = (() => {
  const r = mulberry32(1007), out = [];
  for (let i = 0; i < 90; i++) out.push({ x: r() * 680, y: r() * 520, s: 0.6 + r() * 1.6, p: r() * TAU });
  return out;
})();
const TREES = (() => {
  const r = mulberry32(2203), far = [], near = [];
  for (let x = -20; x < 720; x += 34 + r() * 18) far.push({ x, h: 70 + r() * 50, w: 40 + r() * 26 });
  for (let x = -30; x < 730; x += 60 + r() * 40) near.push({ x, h: 90 + r() * 80, w: 64 + r() * 40 });
  return { far, near };
})();

export class OpeningQuestionsScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two astronauts work close together on a space station truss above the curve of the Earth, one with a wrench at an open panel; a question mark sits between their helmets. Next, a bat flies through the night sky over trees with a moth ahead of it, and a question mark by the bat.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) {
    this.cur = Math.max(0, Math.min(1, stage | 0));
  }

  busy() { return this.age < (this.cur === 0 ? TEND0 : TEND1); }

  draw(ctx, c) {
    if (this.cur === 0) this._space(ctx, c, Math.min(this.age, TEND0));
    else this._night(ctx, c, Math.min(this.age, TEND1));
  }

  _ask(ctx, c, x, y, t, at) {
    const k = clamp01((t - at) / 0.5);
    if (k <= 0) return;
    const s = outBack(k);
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.translate(x, y); ctx.scale(s, s);
    pill(ctx, c, '?', 0, 0, { size: 52, display: true, bg: c.warning, ink: darken(c.warning, 0.78) });
    ctx.restore();
  }

  // ---- b0: space --------------------------------------------------------------
  _space(ctx, c, t) {
    const top = darken(c.water, 0.9), low = darken(mix(c.water, c.s4, 0.2), 0.72);
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    const starCol = lighten(c.water, 0.92);
    for (const s of STARS) {
      ctx.fillStyle = alpha(starCol, 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(s.p + t * 1.3)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
    }
    this._earth(ctx, c, t);
    const arm = drawStationArm(ctx, c, { x: 18, y: 44, len: 644, at: 0.76, lift: 0.35 });
    const bob = (ph) => 3 * Math.sin(t * 0.9 + ph);
    const p = arm.panel;
    // the worker: wrench on the panel's upper box; the friend floats close beside
    const a1 = drawAstronaut(ctx, c, { x: p.x - 62, y: p.y + 92 + bob(0), s: 0.92, dir: 1, pose: 'work', tool: 'wrench' });
    // the friend works too: a wrench on the arm's elbow joint, placed so the near glove lands on it
    const hub = arm.elbow || HUB;
    ctx.save(); ctx.globalAlpha = 0;
    const cal = drawAstronaut(ctx, c, { x: 0, y: 0, s: 0.92, dir: 1, pose: 'work', tool: 'wrench' });
    ctx.restore();
    const a2 = drawAstronaut(ctx, c, { x: hub.x - 10 - cal.hands[0].x, y: hub.y + 8 - cal.hands[0].y + bob(1.7) * 0.3, s: 0.92, dir: 1, pose: 'work', tool: 'wrench' });
    // the question between the two of them, below the arm
    const qx = (a1.chest.x + a2.chest.x) / 2 + 4, qy = Math.max(a1.chest.y, a2.chest.y) + 40;
    this._ask(ctx, c, qx, qy, t, 0.6);
  }

  _earth(ctx, c, t) {
    const cx = 470, cy = 1180, R = 800;
    // atmosphere glow on the limb
    const ag = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R + 46);
    ag.addColorStop(0, alpha(lighten(c.water, 0.55), 0.8)); ag.addColorStop(0.35, alpha(lighten(c.water, 0.35), 0.3)); ag.addColorStop(1, alpha(c.water, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, R + 46, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const sea = darken(c.water, 0.15);
    const eg = ctx.createRadialGradient(cx - 260, cy - R + 60, 30, cx, cy, R);
    eg.addColorStop(0, lighten(sea, 0.22)); eg.addColorStop(0.5, sea); eg.addColorStop(1, darken(sea, 0.5));
    ctx.fillStyle = eg; ctx.fillRect(0, 300, 680, 220);
    // land, then cloud bands drifting slowly
    const land = mix(c.setGround, c.good, 0.35);
    for (const [x, y, rx, ry, rot] of [[150, 470, 120, 34, -0.2], [420, 430, 90, 22, 0.12], [610, 500, 150, 40, 0.05]]) {
      ellipse(ctx, x, y, rx, ry, rot); ctx.fillStyle = alpha(darken(land, 0.1), 0.85); ctx.fill();
      ellipse(ctx, x - rx * 0.2, y - ry * 0.25, rx * 0.6, ry * 0.5, rot); ctx.fillStyle = alpha(lighten(land, 0.15), 0.6); ctx.fill();
    }
    const cloud = lighten(c.water, 0.94);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 97 + t * 3) % 820) - 70, y = 400 + ((i * 53) % 120);
      ellipse(ctx, x, y, 70 + (i % 3) * 26, 9 + (i % 2) * 6, -0.08); ctx.fillStyle = alpha(cloud, 0.55); ctx.fill();
    }
    // night side shade toward the lower right
    const sh = ctx.createLinearGradient(240, 360, 680, 520);
    sh.addColorStop(0, alpha(darken(sea, 0.8), 0)); sh.addColorStop(1, alpha(darken(sea, 0.8), 0.55));
    ctx.fillStyle = sh; ctx.fillRect(0, 300, 680, 220);
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.water, 0.75), 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
  }

  // ---- b1: night --------------------------------------------------------------
  _night(ctx, c, t) {
    const top = darken(c.water, 0.88), low = darken(mix(c.water, c.s4, 0.25), 0.62);
    const g = ctx.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    const starCol = lighten(c.water, 0.9);
    for (const s of STARS) {
      if (s.y > 330) continue;
      ctx.fillStyle = alpha(starCol, 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(s.p + t * 1.1)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 0.8, 0, TAU); ctx.fill();
    }
    // moon with a soft halo and a few maria
    const mx = 590, my = 86, mr = 36, moon = lighten(mix(c.warning, c.s4, 0.15), 0.75);
    const hg = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3);
    hg.addColorStop(0, alpha(moon, 0.35)); hg.addColorStop(1, alpha(moon, 0));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, TAU); ctx.fill();
    const mg = ctx.createRadialGradient(mx - 10, my - 10, 4, mx, my, mr);
    mg.addColorStop(0, lighten(moon, 0.4)); mg.addColorStop(1, darken(moon, 0.08));
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    for (const [dx, dy, r] of [[-10, -6, 8], [9, 8, 6], [4, -14, 4]]) {
      ctx.fillStyle = alpha(darken(moon, 0.2), 0.45); ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, TAU); ctx.fill();
    }
    this._trees(ctx, c, mx);
    // the moth ahead, the bat behind it; wings up at rest
    const flap = t * FLAP_HZ;
    const by = 250 - 8 * Math.cos(TAU * flap);
    drawMoth(ctx, c, { x: 515 + 6 * Math.sin(t * 1.4), y: 215 + 8 * Math.sin(t * 2.1), s: 1.25, dir: -1, angle: 0.2, flap: t * 6 });
    drawBat(ctx, c, { x: 265, y: by, s: 1.95, dir: 1, flap });
    this._ask(ctx, c, 130, 96, t, 0.6);
  }

  _trees(ctx, c, mx) {
    // two layered lines of conifers: each a tiered spire (zigzag branch tips, no round crowns).
    // Every tree has a moonlit side (toward the moon, upper right) and a shade side, plus a few
    // branch-tier strokes for texture; the near line is darker and larger.
    const farCol = darken(mix(c.setGround, c.water, 0.45), 0.6), nearCol = darken(mix(c.setGround, c.water, 0.2), 0.78);
    const spire = (x, base, h, w, tiers) => {
      const pts = [[x, base - h]];
      for (let i = 1; i <= tiers; i++) {
        const u = i / tiers, y = base - h + h * 0.9 * u, hw = w * (0.18 + 0.82 * u) / 2;
        pts.push([x + hw, y], [x + hw * 0.45, y - h * 0.035]);
      }
      pts.push([x + w * 0.1, base + 40], [x - w * 0.1, base + 40]);
      for (let i = tiers; i >= 1; i--) {
        const u = i / tiers, y = base - h + h * 0.9 * u, hw = w * (0.18 + 0.82 * u) / 2;
        pts.push([x - hw * 0.45, y - h * 0.035], [x - hw, y]);
      }
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
    };
    const line = (list, base, col, seed, sc) => {
      const r = mulberry32(seed);
      const lit = lighten(mix(col, c.water, 0.35), 0.18), shade = darken(col, 0.35);
      for (const tr of list) {
        const h = tr.h * sc, w = tr.w * sc * 0.95, tiers = 4 + Math.floor(r() * 3), x = tr.x + (r() - 0.5) * 10;
        spire(x, base, h, w, tiers);
        const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        const toMoon = x < mx ? 1 : -1;
        g.addColorStop(0, toMoon > 0 ? shade : lit); g.addColorStop(0.5, col); g.addColorStop(1, toMoon > 0 ? lit : shade);
        ctx.fillStyle = g; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.strokeStyle = alpha(shade, 0.7); ctx.lineWidth = 2;
        for (let i = 1; i <= tiers; i++) {
          const y = base - h + h * 0.9 * (i / tiers) - h * 0.02;
          ctx.beginPath(); ctx.moveTo(x - w * 0.4, y + 6); ctx.quadraticCurveTo(x, y - 6, x + w * 0.4, y + 6); ctx.stroke();
        }
        ctx.restore();
      }
      ctx.fillStyle = col; ctx.fillRect(0, base, 680, 520 - base);
      const gg = ctx.createLinearGradient(0, base, 0, 520);
      gg.addColorStop(0, alpha(shade, 0)); gg.addColorStop(1, alpha(shade, 0.8));
      ctx.fillStyle = gg; ctx.fillRect(0, base, 680, 520 - base);
    };
    line(TREES.far, 452, farCol, 11, 1.2);
    line(TREES.near, 520, nearCol, 12, 1.15);
  }
}
