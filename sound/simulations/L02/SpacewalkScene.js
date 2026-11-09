/**
 * SpacewalkScene - predict slide "The Astronauts" (L02, blk-l02-s01). Rebuilt 2026-11-03
 * (whole-file rewrite; the old pipe-and-controls version is replaced).
 *
 * One picture, the same world as the L01 opening: deep space over the curve of the Earth,
 * the station truss with its robot arm, two astronauts close together but not touching,
 * one working at the open panel with a wrench, the other floating beside, facing them.
 * Nothing to tap, no arcs, no radio light, no words: the slide asks the question.
 * Gentle drift only (both suits bob a few px, clouds creep); comes to rest at TEND.
 * The host's predict setup (hostRole 'setup', beat MAX_SAFE_INTEGER) gets the same frame.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lighten, darken, mulberry32, ellipse } from 'simulations/base/kit/SimLook.js';
import { drawAstronaut, drawStationArm } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const TEND = 3.4;                       // the drift settles here (the loop parks)

// Seeded star field, fixed for every frame (no Math.random in drawing).
const STARS = (() => {
  const r = mulberry32(4409), out = [];
  for (let i = 0; i < 110; i++) out.push({ x: r() * 680, y: r() * 400, s: 0.6 + r() * 1.7, p: r() * TAU });
  return out;
})();

export class SpacewalkScene extends SimScene {
  static IRIS = false;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'Two astronauts in white spacesuits on a space station truss high above the curve of the Earth. One works on an open equipment panel with a wrench; the other floats close beside, facing the first, not touching.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter() { this.cur = 0; }
  busy() { return this.age < TEND; }

  draw(ctx, c) {
    // setup and the normal mount draw the same frame; time only drives the drift
    this._world(ctx, c, Math.min(this.age, TEND));
  }

  // the whole picture at time t; returns the two suits (for the drift probe)
  _world(ctx, c, t) {
    this._sky(ctx, c, t);
    this._earth(ctx, c, t);
    const arm = drawStationArm(ctx, c, { x: 10, y: 40, len: 660, at: 0.74, lift: 0.4 });
    const p = arm.panel;
    const bob = (ph) => 2.6 * Math.sin(t * 0.8 + ph);
    // the friend floats close beside, facing the worker; the worker turns the wrench on the panel
    const a2 = drawAstronaut(ctx, c, { x: p.x - 236, y: p.y + 172 + bob(1.9), s: 1.0, dir: 1, pose: 'float' });
    const a1 = drawAstronaut(ctx, c, { x: p.x - 58, y: p.y + 96 + bob(0), s: 1.0, dir: 1, pose: 'work', tool: 'wrench' });
    return { a1, a2 };
  }

  _sky(ctx, c, t) {
    const top = darken(c.water, 0.9), low = darken(mix(c.water, c.s4, 0.2), 0.7);
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    const starCol = lighten(c.water, 0.92);
    for (const s of STARS) {
      ctx.fillStyle = alpha(starCol, 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(s.p + t * 1.2)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
    }
  }

  _earth(ctx, c, t) {
    const cx = 300, cy = 1230, R = 820;
    const ag = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R + 50);
    ag.addColorStop(0, alpha(lighten(c.water, 0.55), 0.8)); ag.addColorStop(0.35, alpha(lighten(c.water, 0.35), 0.3)); ag.addColorStop(1, alpha(c.water, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, R + 50, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const sea = darken(c.water, 0.15);
    const eg = ctx.createRadialGradient(cx - 200, cy - R + 50, 30, cx, cy, R);
    eg.addColorStop(0, lighten(sea, 0.24)); eg.addColorStop(0.5, sea); eg.addColorStop(1, darken(sea, 0.5));
    ctx.fillStyle = eg; ctx.fillRect(0, 380, 680, 140);
    const land = mix(c.setGround, c.good, 0.35);
    for (const [x, y, rx, ry, rot] of [[90, 500, 110, 26, -0.1], [330, 452, 120, 22, 0.06], [600, 488, 130, 34, -0.04]]) {
      ellipse(ctx, x, y, rx, ry, rot); ctx.fillStyle = alpha(darken(land, 0.1), 0.85); ctx.fill();
      ellipse(ctx, x - rx * 0.2, y - ry * 0.25, rx * 0.6, ry * 0.5, rot); ctx.fillStyle = alpha(lighten(land, 0.15), 0.6); ctx.fill();
    }
    const cloud = lighten(c.water, 0.94);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 103 + t * 2.5) % 840) - 80, y = 438 + ((i * 41) % 80);
      ellipse(ctx, x, y, 66 + (i % 3) * 24, 7 + (i % 2) * 5, -0.04); ctx.fillStyle = alpha(cloud, 0.5); ctx.fill();
    }
    const sh = ctx.createLinearGradient(260, 420, 680, 520);
    sh.addColorStop(0, alpha(darken(sea, 0.8), 0)); sh.addColorStop(1, alpha(darken(sea, 0.8), 0.55));
    ctx.fillStyle = sh; ctx.fillRect(0, 380, 680, 140);
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.water, 0.75), 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.3, Math.PI * 1.85); ctx.stroke();
  }
}
