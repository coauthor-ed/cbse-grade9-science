// SonarScene.js - predict "How Deep?" (blk-l07-s02, hostRole 'setup'), explain "Sonar" (blk-l07-s03,
// 2 beats) and example (blk-l07-s06, 1 beat). Rebuilt 2026-11-03 (whole-file rewrite; the old
// ping-and-drag scene is gone). The mounts are told apart by beat count (BEAT_MAPS) and hostRole.
// setup  a ship on the sea; a burst of ultrasound leaves its sonar straight down and fades in the
//        water; the stopwatch reads 0.0 s. No echo, no depth, no time beyond what the prompt gives.
// b0     one trip, slow motion: the burst goes down to the sea bed (stopwatch 1.0 s there) and the
//        echo comes back up (2.0 s at the ship). Tags "down 1.0 s", "up 1.0 s"; bracket 1500 m.
// b1     Fig 10.28: bursts go down at angles to a submarine and to a shipwreck on the bed; echoes
//        come back from each. Tag "sonar".
// ex     3 beats, one per line of the slide; each replays the trip to an object and back:
//        e0 stopwatch 0.90 s on return; e1 adds "0.45 s" at the object; e2 adds the bracket 688.5 m.
// Every time on screen is real time; the screen runs SLOW times slower (the kit outAndBack).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, mulberry32, ellipse } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { drawSeaCut, drawShip, drawSubmarine } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const SURF = 210;
const SHIP = { x: 196, len: 240 };
const FLAT = (u) => 0.86 + 0.012 * Math.sin(u * 9);
const SW = { x: 566, y: 106, r: 58 };
const TS = 0.7;                                  // the burst leaves this long after landing
const SLOW0 = 1.4, SLOWX = 3;                   // screen s per real s: b0 (2.0 s trip, at rest by 3.7 s), example (0.90 s trip, at rest by 3.4 s)
const B1P = 2.2;                                 // b1: a new burst this often, shorter than a trip, so bursts and echoes are always on screen

const CLOUDS = (() => {
  const r = mulberry32(919), out = [];
  for (let i = 0; i < 5; i++) out.push({ x: r() * 680, y: 40 + r() * 90, w: 70 + r() * 70 });
  return out;
})();

export class SonarScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { 2: [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]], 3: [[{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]] };
  static CONTINUOUS = true;          // setup and b1 repeat their bursts; b0 and the example come to rest (busy)
  static ARIA_LABEL = 'A ship floats on the sea, seen in a side cut. Its sonar sends a burst of ultrasound straight down '
    + 'and a stopwatch times it. The burst reaches the sea bed after 1.0 second and the echo is back at the ship '
    + 'after 2.0 seconds; a bracket shows the depth, 1500 metres. Then bursts go down at angles to a submarine and to '
    + 'a shipwreck and echoes come back from each: sonar. In the example the echo returns after 0.90 seconds, the '
    + 'burst reached the object at 0.45 seconds, and the object is 688.5 metres away.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  isSetup() { return this.hostRole === 'setup' || this.beatCount > 1000; }
  enter(stage) { this.cur = Math.max(0, Math.min(4, stage | 0)); }
  /** Scene time (one method, so a probe can pin a frame). */
  t() { return this.age; }
  busy() {
    if (this.isSetup() || this.cur === 1) return true;
    return this.t() < TS + (this.cur === 0 ? 2.0 * SLOW0 : 0.9 * SLOWX) + 0.8;
  }

  draw(ctx, c) {
    const t = this.t();
    if (this.isSetup()) return this.setupView(ctx, c, t);
    if (this.cur === 0) this.depth(ctx, c, t);
    else if (this.cur === 1) this.survey(ctx, c, t);
    else this.example(ctx, c, t, this.cur - 2);
  }

  // ---- shared world --------------------------------------------------------------------------
  world(ctx, c, t, bed) {
    const g = ctx.createLinearGradient(0, 0, 0, SURF);
    g.addColorStop(0, c.setSkyTop ?? lighten(c.water, 0.4)); g.addColorStop(1, c.setSkyLow ?? lighten(c.water, 0.8));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, SURF);
    for (const cl of CLOUDS) {
      const x = ((cl.x + t * 4) % 820) - 70;
      ctx.fillStyle = alpha(lighten(c.water, 0.95), 0.85);
      ellipse(ctx, x, cl.y, cl.w * 0.5, 13, 0); ctx.fill();
      ellipse(ctx, x - cl.w * 0.18, cl.y - 9, cl.w * 0.26, 13, 0); ctx.fill();
      ellipse(ctx, x + cl.w * 0.12, cl.y - 12, cl.w * 0.22, 14, 0); ctx.fill();
      ctx.fillStyle = alpha(darken(c.water, 0.1), 0.18); ellipse(ctx, x, cl.y + 6, cl.w * 0.46, 6, 0); ctx.fill();
    }
    // far coast on the horizon
    ctx.fillStyle = alpha(mix(c.setGround, c.water, 0.6), 0.55);
    ctx.beginPath(); ctx.moveTo(420, SURF); ctx.quadraticCurveTo(500, SURF - 26, 560, SURF - 18); ctx.quadraticCurveTo(620, SURF - 30, 690, SURF - 12); ctx.lineTo(690, SURF); ctx.fill();
    return drawSeaCut(ctx, c, { y: SURF, bottom: 520, t, bed });
  }

  ship(ctx, c, x = SHIP.x) { return drawShip(ctx, c, { x, y: SURF, len: SHIP.len, sonar: true }); }

  watch(ctx, c, secs, text) {
    drawStopwatch(ctx, c, { x: SW.x, y: SW.y, r: SW.r, seconds: secs, dialSeconds: 2, text, readout: 'below', size: 30 });
  }

  // a vertical bracket with its label to the right
  bracket(ctx, c, x, y0, y1, text, k) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k;
    ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 10, y0); ctx.lineTo(x + 10, y0); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.moveTo(x - 10, y1); ctx.lineTo(x + 10, y1); ctx.stroke();
    ctx.restore();
    pill(ctx, c, text, x + 16, (y0 + y1) / 2, { ...LBL, align: 'left', bg: c.raised, ink: c.label, alpha: k });
  }

  // ---- setup: the burst leaves, nothing more ---------------------------------------------------
  setupView(ctx, c, t) {
    this.world(ctx, c, t, FLAT);
    const sh = this.ship(ctx, c);
    const P = 2.2, tp = (t - 0.4) % P;
    if (t > 0.4) {
      const r = 22 + tp * 70;
      for (let k = 0; k < 3; k++) {
        const rk = r - k * 10;
        if (rk > 14) drawSoundArcs(ctx, c, { x: sh.transducer.x, y: sh.transducer.y, dir: Math.PI / 2, spread: 0.7, single: true, radius: rk, strength: (1 - k * 0.3) * clamp01(1 - (rk - 60) / 110) });
      }
    }
    this.watch(ctx, c, 0, '0.0 s');
  }

  // ---- b0: down 1.0 s, up 1.0 s ----------------------------------------------------------------
  depth(ctx, c, t) {
    const sea = this.world(ctx, c, t, FLAT);
    const sh = this.ship(ctx, c);
    const a = sh.transducer, b = { x: a.x, y: sea.seabedY(a.x) - 3 };
    const D = b.y - a.y, v = D / SLOW0;
    const st = drawOutAndBack(ctx, c, { a, b, v, t, start: TS, R: 30 });
    const e = Math.max(0, t - TS) / SLOW0;           // real seconds since the burst left
    const secs = Math.min(2, e);
    if (e >= 1) { ctx.fillStyle = alpha(c.s2, 0.5 * clamp01(1.4 - (e - 1))); ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, TAU); ctx.fill(); }
    const kd = clamp01((e - 1) / 0.15), ku = clamp01((e - 2) / 0.15);
    const my = (a.y + b.y) / 2;
    if (kd > 0) pill(ctx, c, 'down 1.0 s', a.x - 22, my - 40, { ...LBL, align: 'right', bg: c.s1, ink: c.bgSurface, alpha: kd });
    if (ku > 0) pill(ctx, c, 'up 1.0 s', a.x + 22, my + 40, { ...LBL, align: 'left', bg: c.s2, alpha: ku });
    this.bracket(ctx, c, 450, SURF, b.y, '1500 m', ku);
    this.watch(ctx, c, secs, secs.toFixed(1) + ' s');
    return st;
  }

  // ---- b1: sonar, Fig 10.28 --------------------------------------------------------------------
  survey(ctx, c, t) {
    const sea = this.world(ctx, c, t, (u) => 0.8 + 0.06 * Math.sin(u * 5 + 0.4) + 0.03 * Math.sin(u * 13));
    const wx = 250, wy = sea.seabedY(wx);
    this.wreck(ctx, c, wx, wy);
    const sub = drawSubmarine(ctx, c, { x: 500, y: 350, len: 220, dir: -1, spin: t * 1.5 });
    const sh = this.ship(ctx, c, 150);
    const a = sh.transducer, v = 150, base = Math.floor(t / B1P) * B1P;
    const subB = { x: sub.box.x + sub.box.w * 0.35, y: sub.box.y + 18 }, wreckB = { x: wx + 6, y: wy - 46 };
    // overlapping trips (a burst every B1P s, each trip longer than B1P): at any moment one burst is
    // going down and one echo is coming up from each object
    for (let n = -3; n <= 0; n++) {
      const s0 = base + n * B1P;
      if (s0 + 0.5 >= 0) drawOutAndBack(ctx, c, { a, b: subB, v, t, start: s0 + 0.5, R: 36, path: false });
      if (s0 + 1.3 >= 0) drawOutAndBack(ctx, c, { a, b: wreckB, v, t, start: s0 + 1.3, R: 36, path: false });
    }
    const k = clamp01((t - 0.4) / 0.4);
    pill(ctx, c, 'sonar', 360, 150, { ...LBL, bg: c.accent, ink: c.bgSurface, alpha: k });
  }

  // a sunken ship, half in the sand, listing; broken mast, portholes, weed
  wreck(ctx, c, x, y) {
    const hull = darken(mix(c.labelMuted, c.setSand ?? c.warning, 0.3), 0.35), rust = mix(hull, c.s6, 0.25);
    ctx.save(); ctx.translate(x, y - 16); ctx.rotate(-0.16);
    const shape = () => { ctx.beginPath(); ctx.moveTo(-96, -34); ctx.lineTo(90, -40); ctx.quadraticCurveTo(84, -6, 66, 18); ctx.lineTo(-80, 18); ctx.quadraticCurveTo(-94, 0, -96, -34); ctx.closePath(); };
    shape(); const g = ctx.createLinearGradient(0, -40, 0, 18); g.addColorStop(0, lighten(hull, 0.18)); g.addColorStop(1, darken(hull, 0.3)); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = darken(hull, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
    // broken bow gap
    ctx.fillStyle = darken(hull, 0.6); ctx.beginPath(); ctx.moveTo(30, -38); ctx.lineTo(44, -14); ctx.lineTo(36, 4); ctx.lineTo(52, 18); ctx.lineTo(62, 18); ctx.lineTo(56, -39); ctx.closePath(); ctx.fill();
    // cabin, mast snapped and leaning
    ctx.fillStyle = darken(hull, 0.1); ctx.fillRect(-56, -62, 52, 24);
    ctx.fillStyle = darken(hull, 0.55); for (let i = 0; i < 3; i++) ctx.fillRect(-50 + i * 16, -55, 9, 9);
    ctx.strokeStyle = darken(hull, 0.3); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -62); ctx.lineTo(-18, -92); ctx.lineTo(8, -104); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = darken(hull, 0.55); ctx.beginPath(); ctx.arc(-70 + i * 26, -14, 4.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = alpha(rust, 0.6); for (const [px, py, r] of [[-60, 4, 10], [10, -20, 7], [70, 0, 6]]) { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); }
    ctx.restore();
    // sand drift over the lower hull, and weed
    ctx.fillStyle = c.setSand ?? lighten(c.warning, 0.5);
    ctx.beginPath(); ctx.moveTo(x - 130, y + 3); ctx.quadraticCurveTo(x - 70, y - 24, x, y - 6); ctx.quadraticCurveTo(x + 64, y - 20, x + 130, y + 3); ctx.quadraticCurveTo(x, y + 8, x - 130, y + 3); ctx.fill();
    ctx.strokeStyle = alpha(darken(c.setSand ?? c.warning, 0.25), 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 120, y + 1); ctx.quadraticCurveTo(x - 70, y - 22, x, y - 6); ctx.quadraticCurveTo(x + 64, y - 20, x + 120, y + 1); ctx.stroke();
    ctx.strokeStyle = alpha(mix(c.good, c.water, 0.4), 0.8); ctx.lineWidth = 3;
    for (const dx of [-80, -66, 70, 84]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 6); ctx.quadraticCurveTo(x + dx + 8, y - 26, x + dx - 2, y - 44); ctx.stroke(); }
  }

  // ---- example: 0.90 s back, 0.45 s there, 688.5 m --------------------------------------------
  example(ctx, c, t, step) {
    const sea = this.world(ctx, c, t, FLAT);
    const sub = drawSubmarine(ctx, c, { x: SHIP.x + 40, y: 400, len: 230, dir: 1, spin: 0 });
    const sh = this.ship(ctx, c);
    const a = sh.transducer, b = { x: a.x, y: 400 - 26 };
    const D = b.y - a.y, v = D / (0.45 * SLOWX);
    drawOutAndBack(ctx, c, { a, b, v, t, start: TS, R: 28 });
    const e = Math.max(0, t - TS) / SLOWX;
    const secs = Math.min(0.9, e);
    const km = clamp01((e - 0.45) / 0.05);
    if (step >= 1 && km > 0) pill(ctx, c, '0.45 s', b.x - 26, b.y - 78, { ...LBL, align: 'right', bg: c.s1, ink: c.bgSurface, alpha: km });
    if (step >= 2) this.bracket(ctx, c, 450, a.y, b.y, '688.5 m', km);
    this.watch(ctx, c, secs, secs.toFixed(2) + ' s');
    return sea;
  }
}
