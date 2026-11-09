// IntensityScene.js - slide "Intensity" (blk-l05-s08, 2 beats). New 2026-11-03.
// Book Fig 10.21: a point source, rays fanning out, a small patch near and a larger one further out.
// Model: a speaker at the left sends out two wave fronts per second (the SimWave arcs). Each front
// carries the same energy as small bright dots, one dot (two for the louder sound) on each of 8 x 8
// rays spread evenly in a cone in 3D (drawn in a slanted projection, so depth reads up and right).
// The dots on ray (jy, jz) sit at y = (jy + 0.5) K x, z = (jz + 0.5) K x, so at distance x they are
// K x apart: the same energy is spread over an area that grows as x squared.
// A unit-area patch facing the source at distance R1 holds exactly 4 x 4 rays; the same patch at 2 R1
// holds 2 x 2 rays: a quarter of the dots cross it each second. The counts are counted, not typed.
// The intensity at x is the dot rate per area, E / x^2; a front fades where that falls below a
// threshold, so a front with twice the energy (the louder sound) fades sqrt(2) times further away.
// b0 the near patch, its dots lit as they cross, and the count each second.
// b1 the same patch at twice the distance (inside the dashed square the near patch's rays now cover),
//    a quarter of the dots; then the louder sound (bigger cone swing, two dots per ray per front,
//    stronger arcs) alternates with the soft one; its fronts reach further before they fade.
// The dots stream for ever: the beat is a flow per second, so the scene is CONTINUOUS.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha, mix, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';

const TAU = Math.PI * 2;
const SRC = { x: 84, y: 280, r: 40 };
const V = 160, P = 0.5;                    // two fronts every second, 80 px apart
const K = 0.1;                             // ray spacing per px of distance
const N = 8;                               // 8 x 8 rays
const R1 = 160, R2 = 2 * R1;               // the near patch and the far patch (twice the distance)
const HALF = 2 * K * R1;                   // patch half-side: 32 px, the same patch at both places
const XMAX = 596;
const OX = 0.3, OY = 0.3;                  // slanted projection: depth goes up and to the right
const R_SOFT = 480, R_LOUD = Math.round(R_SOFT * Math.SQRT2);
const PHASE = 6;                           // b1: soft and louder take turns, 6 s each
const DX = 12;                             // the louder sound's second dot on each ray, just behind
const RAYS = [];
for (let jy = 0; jy < N; jy++) for (let jz = 0; jz < N; jz++) RAYS.push({ ay: (jy - N / 2 + 0.5) * K, az: (jz - N / 2 + 0.5) * K });
const inPatch = (ray, R) => Math.abs(ray.ay * R) < HALF && Math.abs(ray.az * R) < HALF;
const NEAR_RAYS = RAYS.filter((r) => inPatch(r, R1)).length;    // 16
const FAR_RAYS = RAYS.filter((r) => inPatch(r, R2)).length;     // 4
const ORDER = RAYS.map((r, i) => i).sort((a, b) => RAYS[b].az - RAYS[a].az);   // far depth first

export class IntensityScene extends SimScene {
  static CONTINUOUS = true;   // energy streams out for ever: the beat is a count per second
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A speaker at the left sends out sound wave fronts. Small bright dots of energy stream outward '
    + 'along rays that spread apart. A small square patch of unit area faces the source near it, and the dots that '
    + 'pass through it light up: 32 cross it each second. Then the same patch at twice the distance: the same rays '
    + 'now cover a square four times as big, and only 8 dots cross the patch each second, a quarter. A louder sound '
    + 'sends twice as many dots and its fronts travel further before they fade.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.probeOut = null;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0)); }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age + 3.2; }            // the medium is already full of fronts on landing

  busy() { return true; }

  /** Is the front sent at time e from the louder sound? (b1 only; soft and louder take turns.) */
  loudAt(e) { return this.cur >= 1 && Math.floor(Math.max(0, e - 3.2) / PHASE) % 2 === 1; }

  proj(x, y, z) { return { x: SRC.x + x + OX * z, y: SRC.y + y - OY * z }; }

  /** How much a front still shows at distance x: intensity E / x^2 over the fading threshold. */
  vis(x, R) { return clamp01(((R / Math.max(x, 1)) ** 2 - 1) / 1.2) * clamp01((x - 16) / 24); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = this.t(), far = this.cur >= 1;
    const loudNow = this.loudAt(t);
    const cone = Math.sin(TAU * t / P) * (loudNow ? 1 : 0.45);
    const sp = drawSpeaker(ctx, c, { x: SRC.x, y: SRC.y, r: SRC.r, cone, facing: 1 });

    // fronts: one SimWave arc per front, as strong as the intensity there
    const n1 = Math.floor(t / P), n0 = Math.floor((t - XMAX / V) / P);
    const fronts = [];
    for (let n = n0; n <= n1; n++) {
      const e = n * P, x = V * (t - e);
      if (x < 0 || x > XMAX) continue;
      const loud = this.loudAt(e);
      fronts.push({ e, x, loud, v: this.vis(x, loud ? R_LOUD : R_SOFT) });
    }
    for (const f of fronts) {
      if (f.v <= 0.02) continue;
      drawSoundArcs(ctx, c, { x: sp.cone.x, y: sp.cone.y, dir: 0, spread: 0.45, single: true, radius: f.x, t,
        strength: (f.loud ? 0.95 : 0.6) * f.v, wavelength: V * P });
    }

    // the patches (back face), the rays through the near patch's corners
    this.rays(ctx, c, far);
    const lit = { near: 0, far: 0 };
    for (const f of fronts) {
      for (const k of (f.loud ? [0, 1] : [0])) {
        const x = f.x - k * DX;
        for (const R of far ? [R1, R2] : [R1]) {
          const d = x - R;
          if (d >= 0 && d < 40) {
            const g = 1 - d / 40;
            if (R === R1) lit.near = Math.max(lit.near, g * f.v); else lit.far = Math.max(lit.far, g * f.v);
          }
        }
      }
    }
    this.patch(ctx, c, R1, lit.near, false);
    if (far) this.patch(ctx, c, R2, lit.far, false);

    // the energy dots, far depth first
    for (const f of fronts) {
      if (f.v <= 0.02) continue;
      for (const k of (f.loud ? [0, 1] : [0])) {
        const x = f.x - k * DX;
        if (x < 16) continue;
        for (const i of ORDER) {
          const ray = RAYS[i], p = this.proj(x, ray.ay * x, ray.az * x);
          const depth = 0.62 + 0.38 * (0.5 - ray.az / (N * K));
          let glow = 0;
          for (const R of far ? [R1, R2] : [R1]) {
            if (inPatch(ray, R) && x >= R) glow = Math.max(glow, Math.exp(-(x - R) / 34));
          }
          this.dot(ctx, c, p.x, p.y, f.v * depth, glow, x >= R1 && inPatch(ray, R1) || far && x >= R2 && inPatch(ray, R2));
        }
      }
    }
    this.patch(ctx, c, R1, lit.near, true);
    if (far) this.patch(ctx, c, R2, lit.far, true);

    // tags and the counts: dots that crossed each patch in the last second, counted from the fronts
    const count = (R) => {
      let m = 0;
      for (const f of fronts) for (const k of (f.loud ? [0, 1] : [0])) {
        const x = f.x - k * DX, since = (x - R) / V;
        if (since >= 0 && since < 1 && f.v > 0.02) m += RAYS.filter((r) => inPatch(r, R)).length;
      }
      return m;
    };
    const cn = count(R1), cf = far ? count(R2) : 0;
    const nb = this.box(R1), fb = this.box(R2);
    // every tag sits in clear sky outside the beam: names above it, counts below it, each under its patch
    pill(ctx, c, far ? 'near' : 'unit area', nb.cx - 44, 155, { bg: c.raised, size: 26, display: true });
    pill(ctx, c, cn + ' per second', nb.cx - 40, SRC.y + 142, { bg: c.warning, size: 26, display: true });
    if (far) {
      pill(ctx, c, 'far', fb.cx, 70, { bg: c.raised, size: 26, display: true });
      pill(ctx, c, cf + ' per second', fb.cx - 10, SRC.y + 232, { bg: c.warning, size: 26, display: true });
    }
    this.probeOut = { near: cn, far: cf, loud: loudNow, rays: [NEAR_RAYS, FAR_RAYS] };
  }

  /** The patch's corners on screen: a square facing the source, half-side HALF, at distance R. */
  corners(R, s = 1) {
    const h = HALF * s;
    return [this.proj(R, -h, -h), this.proj(R, -h, h), this.proj(R, h, h), this.proj(R, h, -h)];
  }

  box(R) {
    const q = this.corners(R);
    return { cx: SRC.x + R, top: Math.min(...q.map((p) => p.y)), bot: Math.max(...q.map((p) => p.y)) };
  }

  /** Dashed rays from the source through the near patch's corners; in b1 on to the square they cover at R2. */
  rays(ctx, c, far) {
    const end = far ? R2 : R1 * 1.5, big = this.corners(end, end / R1);
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.38); ctx.lineWidth = 2; ctx.setLineDash([5, 7]);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(SRC.x + 6, SRC.y); ctx.lineTo(big[i].x, big[i].y); ctx.stroke(); }
    if (far) {
      ctx.strokeStyle = alpha(c.label, 0.6); ctx.lineWidth = 2.5;
      ctx.beginPath(); big.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }

  /** The unit-area patch: a framed square in the slanted view, a soft shaded fill, glowing while dots cross. */
  patch(ctx, c, R, lit, front) {
    const q = this.corners(R), col = c.s5;
    const path = () => { ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
    ctx.save();
    if (!front) {
      const g = ctx.createLinearGradient(q[0].x, q[1].y, q[2].x, q[3].y);
      g.addColorStop(0, alpha(mix(col, c.bgSurface, 0.35), 0.5 + 0.3 * lit));
      g.addColorStop(1, alpha(col, 0.3 + 0.35 * lit));
      path(); ctx.fillStyle = g; ctx.fill();
      if (lit > 0.02) { ctx.shadowColor = alpha(c.warning, 0.9 * lit); ctx.shadowBlur = 22 * lit; path(); ctx.strokeStyle = alpha(c.warning, lit); ctx.lineWidth = 4; ctx.stroke(); }
    } else {
      // over the dots: a clear pane and a bold frame, so the patch is never hidden by the stream
      path(); ctx.fillStyle = alpha(mix(col, c.bgSurface, 0.5), 0.22 + 0.15 * lit); ctx.fill();
      path(); ctx.strokeStyle = alpha(c.bgSurface, 0.85); ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.stroke();
      path(); ctx.strokeStyle = mix(col, c.label, 0.45); ctx.lineWidth = 4.5; ctx.stroke();
      ctx.strokeStyle = alpha(mix(col, c.bgSurface, 0.6), 0.9); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(q[0].x + 3, q[0].y - 2); ctx.lineTo(q[1].x + 2, q[1].y + 3); ctx.stroke();
    }
    ctx.restore();
  }

  /** An energy dot: warm, with a bright core; one that crossed a patch keeps a ring, and glows as it crosses. */
  dot(ctx, c, x, y, a, glow, crossed) {
    if (a <= 0.02) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, a);
    if (glow > 0.05) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
      g.addColorStop(0, alpha(c.warning, 0.75 * glow)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = c.warning; ctx.beginPath(); ctx.arc(x, y, 3.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha(mix(c.warning, c.label, 0.45), 0.7); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = mix(c.warning, c.bgSurface, 0.55 + 0.3 * glow); ctx.beginPath(); ctx.arc(x - 0.8, y - 0.9, 1.7, 0, TAU); ctx.fill();
    if (crossed) { ctx.strokeStyle = alpha(mix(c.warning, c.label, 0.4), 0.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 5.4, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}
