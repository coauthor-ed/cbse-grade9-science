// PondSpawnScene.js - the pond, the cloud, and the count falling.
// One pond that never leaves the frame: a current runs left to right, a cloud of eggs is
// released into open water, the current pulls it apart, and most of the eggs end up in the
// mud, in the reeds or eaten. The slide's point is the NUMBER, so the count is the one
// thing that is never approximated: every egg drawn is an egg counted.
//
// Five beats, one stage each:
//   0 the empty pond            1 the two clouds released      2 where that happened
//   3 the water takes it apart  4 what is left
//
// Rules this file follows (briefs/reference/scene-rules.md has the rest):
//   - colours only from `c` and mix/alpha/lighten/darken of them, never a hex
//   - no timer that outlives its stage: sequencing reads this.age, which the base resets
//   - busy() is true while anything that matters moves; every sequence ends
//   - the dial changes the RATE of the drift, never the outcome
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, W, H, alpha, mix, lighten, darken, chipRow, mulberry32, leader, luma,
} from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// The pond fills the full width: a wide shallow box seen from just above the water line.
const POND = { x: ZONES.heroWide.x + 10, y: ZONES.heroWide.y + 10, w: ZONES.heroWide.w - 20, h: ZONES.heroWide.h - 20 };
const SURFACE_Y = POND.y + 58;                                  // the water line
const MUD_Y = POND.y + POND.h - 24;                              // the mud bed
const WATER = { x: POND.x + 7, y: SURFACE_Y, w: POND.w - 14, h: MUD_Y - SURFACE_Y };
const REED_X = WATER.x + WATER.w - 58;                           // the reed bed, right edge
const CLOUD = { x: WATER.x + WATER.w * 0.32, y: SURFACE_Y + 104, r: 56 };  // where the eggs are let out
const FISH_A = { x: WATER.x + WATER.w * 0.34, y: SURFACE_Y + 26, len: 46, dir: 1 };
const FISH_B = { x: REED_X + 26, y: SURFACE_Y + 118, len: 40, dir: -1 };

const N_EGGS = 300;                                              // the number the panel shows
const FATE_MUD = 78, FATE_REED = 60, FATE_EATEN = 159, FATE_FREE = 3;      // sums to 300
const FLOW_PX = 26;                                              // current speed, px/s at `slow`
const FLOW_SCALE = [0.35, 1, 2.2];                               // still / slow / fast
const STEER_PX = 55;                                             // an egg being taken moves this fast
const RAMP = 2.0;                                                // seconds of full steering before its fate time
const CLOUD_AT = 1.4, SPERM_AT = 1.6, SPERM_IN = 1.2;            // seconds into beat 1

const S_EMPTY = 0, S_RELEASE = 1, S_MET = 2, S_DRIFT = 3, S_LEFT = 4;
const MAP = [
  [{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }],
];
const BEAT_CHIP = ['before', 'eggs, then sperm', 'outside both bodies', 'drifting apart', 'what is left'];
const STATE_CHIP = { drifting: 'drifting', mud: 'in the mud', reed: 'in the reeds', eaten: 'eaten' };

// A fish, lit from above: dark back, pale belly, translucent fins, a tail that beats with
// `t`. Used for both the release and the feeding. (x, y) is the body centre, dir the way it
// faces, len its length in px.
function drawFish(ctx, c, x, y, len, dir, t) {
  const col = mix(c.s2, c.flame, 0.3);
  const back = darken(col, 0.35), belly = lighten(col, 0.45);
  const rx = len * 0.36, ry = len * 0.16;
  const beat = Math.sin(t * 7) * 0.22;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  // tail, beating
  ctx.save();
  ctx.translate(-rx * 0.85, 0);
  ctx.rotate(beat);
  ctx.fillStyle = alpha(darken(col, 0.15), 0.85);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-rx * 0.5, -ry * 0.3, -rx * 0.75, -ry * 1.35);
  ctx.quadraticCurveTo(-rx * 0.55, 0, -rx * 0.75, ry * 1.35);
  ctx.quadraticCurveTo(-rx * 0.5, ry * 0.3, 0, 0);
  ctx.fill();
  ctx.restore();
  // dorsal and pelvic fins, see-through
  ctx.fillStyle = alpha(darken(col, 0.1), 0.7);
  ctx.beginPath();
  ctx.moveTo(-rx * 0.35, -ry * 0.85);
  ctx.quadraticCurveTo(-rx * 0.2, -ry * 2.1, rx * 0.25, -ry * 0.95);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-rx * 0.1, ry * 0.85);
  ctx.quadraticCurveTo(-rx * 0.25, ry * 1.7, -rx * 0.45, ry * 0.8);
  ctx.fill();
  // body: a teardrop, blunt at the head
  ctx.beginPath();
  ctx.moveTo(rx, 0);
  ctx.bezierCurveTo(rx, -ry * 1.1, -rx * 0.3, -ry * 1.15, -rx * 0.9, 0);
  ctx.bezierCurveTo(-rx * 0.3, ry * 1.15, rx, ry * 1.1, rx, 0);
  const g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, back);
  g.addColorStop(0.45, col);
  g.addColorStop(1, belly);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = alpha(darken(col, 0.3), 0.35);             // a few scale rows
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const sx = -rx * 0.45 + i * rx * 0.25;
    ctx.beginPath(); ctx.arc(sx, -ry * 0.2, ry * 0.45, -1.2, 1.2); ctx.stroke();
  }
  ctx.fillStyle = alpha(lighten(col, 0.7), 0.45);               // the sky's sheen along the back
  ctx.beginPath(); ctx.ellipse(rx * 0.05, -ry * 0.55, rx * 0.6, ry * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = alpha(darken(col, 0.4), 0.6);                // gill
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(rx * 0.42, 0, ry * 0.75, -1.1, 1.1); ctx.stroke();
  ctx.fillStyle = alpha(lighten(col, 0.3), 0.75);               // pectoral fin, beating with the tail
  ctx.beginPath();
  ctx.ellipse(rx * 0.22, ry * 0.35, rx * 0.2, ry * 0.32, 0.6 + beat, 0, Math.PI * 2);
  ctx.fill();
  const er = Math.max(1.8, len * 0.05);                          // eye
  ctx.fillStyle = lighten(col, 0.85);
  ctx.beginPath(); ctx.arc(rx * 0.62, -ry * 0.22, er * 1.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = darken(c.bgDeep, luma(c.bgDeep) > 0.5 ? 0.8 : 0.2);
  ctx.beginPath(); ctx.arc(rx * 0.65, -ry * 0.22, er, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = alpha(lighten(col, 0.9), 0.95);
  ctx.beginPath(); ctx.arc(rx * 0.6, -ry * 0.3, er * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export class PondSpawnScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = 0;
  static VISUAL_PROFILE = 'rich';
  static IRIS = false;
  static CONTINUOUS = true;      // a pond current never stops: the streaks drift on every beat, the held one too
  static ARIA_LABEL = 'A pond with a current running across it. A cloud of eggs is released into open water, the current pulls it apart, and eggs are lost into the mud, into the reeds and to fish.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._flowIdx = 1;
    this._eggs = [];
    this._streaks = [];
    this._sperm = [];
    this._mark = -1;
    this._driftT = 0;
    this._dispN = -2;
    this._dispAt = 0;
    this._built = false;
  }

  noteRows() {
    return [];
  }

  // One cloud of eggs, one fate each, drawn once from a fixed seed: the dial must not be
  // able to change the answer, so the fates are decided here and never re-rolled.
  _build() {
    if (this._built) return;
    const r = mulberry32(7);
    const pool = [];
    for (let i = 0; i < FATE_FREE; i++) pool.push('free');
    for (let i = 0; i < FATE_MUD; i++) pool.push('mud');
    for (let i = 0; i < FATE_REED; i++) pool.push('reed');
    for (let i = 0; i < FATE_EATEN; i++) pool.push('eaten');
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    for (let i = 0; i < N_EGGS; i++) {
      const fate = pool[i];
      const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * CLOUD.r;
      const wd = r() * Math.PI * 2;
      const sx = CLOUD.x + Math.cos(a) * rad, sy = CLOUD.y + Math.sin(a) * rad * 0.72;
      const muX = CLOUD.x + (r() - 0.5) * 2.4;                  // where it goes if it sinks
      const rdY = SURFACE_Y + 30 + r() * (MUD_Y - SURFACE_Y - 50);
      // How long it survives is the time it needs to reach where it is going, plus a spread,
      // so an egg is always seen travelling to its fate rather than vanishing at it.
      const d0 = fate === 'mud' ? Math.abs(MUD_Y - sy)
        : fate === 'reed' ? Math.hypot(WATER.x + WATER.w - 4 - sx, rdY - sy)
          : Math.min(Math.hypot(FISH_A.x + FISH_A.len * 0.34 - sx, FISH_A.y - sy),
            Math.hypot(FISH_B.x - FISH_B.len * 0.34 - sx, FISH_B.y - sy));
      this._eggs.push({
        fate,
        life: 0.4 + 1.15 * d0 / STEER_PX + r() * 5.5,   // seconds of drift at `slow` before it is lost
        sx, sy, muX, muY: MUD_Y - 3, rdY,
        wd, wd0: wd, wv: 5 + r() * 9, wcurl: (r() - 0.5) * 0.7, near: 1e9,
        x: 0, y: 0, vx: 0, vy: 0, lost: false, lx: 0, ly: 0, fade: 0,
      });
    }
    for (let i = 0; i < 30; i++) {
      this._streaks.push({
        x: POND.x + r() * POND.w, y: SURFACE_Y + 8 + r() * (MUD_Y - SURFACE_Y - 12),
        len: 10 + r() * 26, sp: 0.6 + r() * 0.8,
      });
    }
    // The sperm arrive over the same water and close on the eggs: a shrinking orbit, so the
    // two clouds are seen meeting rather than merely drawn near each other.
    for (let i = 0; i < 110; i++) {
      this._sperm.push({
        a: r() * Math.PI * 2, rad: 66 + r() * 84, ph: r() * Math.PI * 2,
        spin: (0.35 + r() * 0.45) * (i % 2 ? 1 : -1), len: 3 + r() * 3.5,
        x: 0, y: 0,
      });
    }
    this._built = true;
  }

  // Every egg back in the cloud, none lost yet. Fates, life times and spawn points stay.
  _cloud() {
    if (!this._eggs.length) this._built = false;                 // beat 0 holds an empty pond
    this._build();
    for (const e of this._eggs) {
      e.x = e.sx; e.y = e.sy; e.vx = 0; e.vy = 0;
      e.lost = false; e.lx = 0; e.ly = 0; e.fade = 0; e.near = 1e9; e.wd = e.wd0;
    }
    this._mark = -1;
    this._driftT = 0;
    this._dispN = -2;
  }

  enter(stage) {
    this._build();
    this._mark = -1;
    this._dispN = -2;
    this._dispAt = 0;
    if (stage === S_EMPTY) {
      this._cloud();
      this._eggs.length = 0;                                    // nothing has been released
      return;
    } else if (stage === S_RELEASE || stage === S_MET) {
      this._cloud();
    } else if (stage === S_DRIFT) {
      this._cloud();
    } else {
      this._cloud();
      this._settle();
    }
  }

  // The ending: every egg takes the fate it was given, and the three that were always going
  // to make it are left well apart in open water. The count is exactly 3 whatever the dial did.
  _settle() {
    const free = this._eggs.filter((e) => e.fate === 'free');
    const spots = [
      { x: WATER.x + WATER.w * 0.24, y: SURFACE_Y + 62 },
      { x: WATER.x + WATER.w * 0.55, y: SURFACE_Y + 150 },
      { x: WATER.x + WATER.w * 0.33, y: MUD_Y - 46 },
    ];
    free.forEach((e, i) => {
      const s = spots[i % spots.length];
      e.x = s.x + (i > 2 ? (i - 2) * 18 : 0); e.y = s.y;
      e.vx = 0; e.vy = 0;
    });
    for (const e of this._eggs) {
      if (e.fate === 'free') continue;
      const s = this._sink(e);
      e.lx = s.x; e.ly = s.y; e.lost = true; e.fade = 1;
    }
    this._driftT = 0;
  }

  // Where an egg is being taken: down into the mud, sideways into the reeds, or into the
  // mouth of whichever fish is nearer. Eggs are never removed at a label.
  _sink(e) {
    if (e.fate === 'mud') return { x: e.muX, y: e.muY };
    if (e.fate === 'reed') return { x: WATER.x + WATER.w - 4, y: e.rdY };
    let best = null, bd = 1e9;
    for (const f of this._fishSpots()) {
      const d = Math.hypot(f.mx - e.x, f.my - e.y);
      if (d < bd) { bd = d; best = f; }
    }
    return { x: best.mx, y: best.my };
  }

  // The two flat fish: one at the surface, one at the reeds. Idle-swimming, so the sink
  // moves with them.
  _fishSpots() {
    const t = this.clock;
    const a = {
      x: FISH_A.x + Math.sin(t * 0.31) * 16,
      y: FISH_A.y + Math.sin(t * 0.9) * 3.5, len: FISH_A.len, dir: FISH_A.dir,
    };
    const b = {
      x: FISH_B.x + Math.sin(t * 0.24 + 1.7) * 12,
      y: FISH_B.y + Math.sin(t * 0.75 + 2) * 4, len: FISH_B.len, dir: FISH_B.dir,
    };
    a.mx = a.x + a.dir * a.len * 0.34; a.my = a.y;
    b.mx = b.x + b.dir * b.len * 0.34; b.my = b.y;
    return [a, b];
  }

  // How visible the fish are on this beat: released on 1, gone by 2, feeding on 3.
  _fishAlpha() {
    const s = this.stage, a = this.age;
    if (s === S_EMPTY) return 0;
    if (s === S_RELEASE) return Math.min(1, a / 0.5);
    if (s === S_MET) return Math.max(0, 1 - a / 1.0);
    if (s === S_DRIFT) return Math.min(1, a / 0.4);
    return 1;
  }

  _alive() { let n = 0; for (const e of this._eggs) if (!e.lost) n++; return n; }

  // An egg still waiting for its fate is the only thing that keeps the drift moving: the three
  // that were always going to make it are already still, so busy() goes false once the rest are gone.
  _pending() { return this._eggs.some((e) => !e.lost && e.fate !== 'free'); }

  update(d) {
    const flow = FLOW_SCALE[this._flowIdx];
    for (const s of this._streaks) {
      s.x += (FLOW_PX * flow * 0.55 + 4) * s.sp * d;
      if (s.x - s.len > W + 4) s.x = -4 - s.sp * 20;
    }
    // Sperm move only while the release is on the screen (beats 1 and 2), never on a timer.
    if ((this.stage === S_RELEASE || this.stage === S_MET) && this.age > SPERM_AT) {
      for (const p of this._sperm) {
        p.a += p.spin * d;
        p.rad = Math.max(5, p.rad - 54 * d);
        p.x = CLOUD.x + Math.cos(p.a + p.ph) * p.rad * 1.2;
        p.y = CLOUD.y + Math.sin(p.a + p.ph) * p.rad * 0.82;
      }
    }

    const stage = this.stage;
    if (stage === S_DRIFT) {
      this._driftT += d * flow;
      for (const e of this._eggs) {
        if (e.lost) { e.fade = Math.min(1, e.fade + d * 2.2); continue; }
        e.wd += e.wcurl * d;                                   // the cloud breaks into curving pieces
        const s = e.fate === 'free' ? null : this._sink(e);
        let tvx = FLOW_PX * flow + Math.cos(e.wd) * e.wv;
        let tvy = Math.sin(e.wd) * e.wv;
        let u = 0;
        if (s) {
          const dx = s.x - e.x, dy = s.y - e.y, dd = Math.hypot(dx, dy) || 1;
          u = Math.max(0, Math.min(1, (this._driftT - (e.life - RAMP)) / RAMP));
          tvx += (dx / dd) * STEER_PX * u;
          tvy += (dy / dd) * STEER_PX * u;
          e.near = dd;
        }
        const k = Math.min(1, d * 1.6);
        e.vx += (tvx - e.vx) * k;
        e.vy += (tvy - e.vy) * k;
        e.x += e.vx * d;
        e.y += e.vy * d;
        e.x = Math.max(WATER.x + 4, Math.min(WATER.x + WATER.w - 3, e.x));
        e.y = Math.max(SURFACE_Y + 8, Math.min(MUD_Y - 2, e.y));
        if (s && e.near < 9) {                                   // taken: it arrives where it is taken
          e.lost = true; e.lx = s.x; e.ly = s.y; e.fade = 0;
        } else if (s && this._driftT > e.life + 6) {             // safety net, so every egg resolves
          e.lost = true; e.lx = e.x; e.ly = e.y; e.fade = 0;
        }
      }
    }
  }

  busy() {
    if (this.stage === S_DRIFT) return this._pending();
    if (this.stage === S_RELEASE) return this.age < SPERM_AT + 2.4;   // until the two clouds have met
    if (this.stage === S_MET) return this.age < 1.2;
    return false;
  }

  // Ambient time: frozen under reduced motion, so a still frame is the same frame.
  get _amb() { return reducedMotion() ? 0 : this.clock; }

  draw(ctx, c) {
    const t = this._amb;
    this._drawSky(ctx, c, t);
    this._drawWater(ctx, c, t);
    this._drawBranch(ctx, c);
    this._drawMud(ctx, c);
    this._drawReeds(ctx, c, t, 0);
    this._drawStreaks(ctx, c);
    this._drawEggs(ctx, c);
    this._drawFish(ctx, c);
    this._drawReeds(ctx, c, t, 1);
    this._drawSurface(ctx, c, t);
    this._drawLeft(ctx, c);
    this._drawMark(ctx, c);
    this._drawChips(ctx, c);
  }

  // Seen from just above the water line: early-summer sky, two rows of far trees in haze, the
  // near bank. The whole frame is the pond's world - no card around it.
  _drawSky(ctx, c, t) {
    const lt = luma(c.bgDeep) > 0.5;
    const top = lt ? mix(c.water, c.bgSurface, 0.55) : mix(darken(c.water, 0.45), c.bgDeep, 0.5);
    const hor = lt ? lighten(mix(c.water, c.warning, 0.18), 0.55) : mix(c.water, c.warning, 0.22);
    const g = ctx.createLinearGradient(0, 0, 0, SURFACE_Y);
    g.addColorStop(0, top);
    g.addColorStop(1, hor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, SURFACE_Y);
    const sun = ctx.createRadialGradient(96, 18, 4, 96, 18, 220);
    sun.addColorStop(0, alpha(lighten(c.warning, 0.6), lt ? 0.7 : 0.45));
    sun.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, SURFACE_Y);
    const rows = [
      { y: SURFACE_Y - 40, h: 26, col: mix(mix(c.good, c.water, 0.35), hor, 0.55), seed: 31, r: 16 },
      { y: SURFACE_Y - 22, h: 18, col: mix(darken(c.good, 0.35), hor, 0.25), seed: 47, r: 12 },
    ];
    for (const row of rows) {
      const rnd = mulberry32(row.seed);
      ctx.fillStyle = row.col;
      ctx.beginPath();
      ctx.moveTo(0, SURFACE_Y);
      for (let x = -10; x < W + 20; x += row.r * (0.9 + rnd() * 0.6)) {
        const cy = row.y + rnd() * row.h * 0.5;
        ctx.moveTo(x + row.r, cy);
        ctx.arc(x, cy, row.r * (0.7 + rnd() * 0.6), 0, Math.PI * 2);
      }
      ctx.rect(0, row.y + row.h * 0.4, W, SURFACE_Y - row.y);
      ctx.fill();
    }
    const bank = mix(darken(c.good, 0.25), c.warning, 0.22);   // the near bank and its grass
    ctx.fillStyle = bank;
    ctx.fillRect(0, SURFACE_Y - 9, W, 9);
    const rnd = mulberry32(5);
    ctx.strokeStyle = alpha(lighten(bank, 0.25), 0.9);
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = 4; x < W; x += 5 + rnd() * 6) {
      const h = 5 + rnd() * 9, lean = (rnd() - 0.4) * 5 + Math.sin(t * 0.8 + x * 0.05) * 1.2;
      ctx.moveTo(x, SURFACE_Y - 6); ctx.quadraticCurveTo(x + lean * 0.4, SURFACE_Y - 6 - h * 0.6, x + lean, SURFACE_Y - 6 - h);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // The water: lit from the surface, greener and darker towards the mud, with sun shafts that
  // sway slowly, a caustic shimmer under the surface and fine silt drifting with the current.
  _drawWater(ctx, c, t) {
    const lt = luma(c.bgDeep) > 0.5;
    const wTop = lt ? lighten(mix(c.water, c.good, 0.12), 0.25) : mix(c.water, c.good, 0.12);
    const g = ctx.createLinearGradient(0, SURFACE_Y, 0, MUD_Y + 20);
    g.addColorStop(0, wTop);
    g.addColorStop(0.5, darken(mix(c.water, c.good, 0.22), lt ? 0.12 : 0.3));
    g.addColorStop(1, darken(mix(c.water, c.good, 0.38), lt ? 0.35 : 0.6));
    ctx.fillStyle = g;
    ctx.fillRect(0, SURFACE_Y, W, MUD_Y + 20 - SURFACE_Y);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, SURFACE_Y, W, MUD_Y + 10 - SURFACE_Y); ctx.clip();
    for (let i = 0; i < 5; i++) {                                // sun shafts from the upper left
      const x0 = 40 + i * 120 + Math.sin(t * 0.17 + i * 1.7) * 14, wd = 26 + (i % 3) * 16;
      const sg = ctx.createLinearGradient(0, SURFACE_Y, 0, MUD_Y);
      sg.addColorStop(0, alpha(lighten(c.water, 0.7), lt ? 0.22 : 0.16));
      sg.addColorStop(1, alpha(lighten(c.water, 0.7), 0));
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(x0, SURFACE_Y); ctx.lineTo(x0 + wd, SURFACE_Y);
      ctx.lineTo(x0 + wd + 120, MUD_Y); ctx.lineTo(x0 + 90, MUD_Y);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = alpha(lighten(c.water, 0.75), lt ? 0.35 : 0.22);   // caustics
    ctx.lineWidth = 1.2;
    for (let row = 0; row < 3; row++) {
      const y0 = SURFACE_Y + 10 + row * 11;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = y0 + Math.sin(x * 0.045 + t * 1.1 + row * 2) * 2.4 + Math.sin(x * 0.11 - t * 0.7) * 1.4;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.globalAlpha = 1 - row * 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const flow = FLOW_SCALE[this._flowIdx];                      // silt in the current
    const rnd = mulberry32(19);
    ctx.fillStyle = alpha(lighten(c.water, 0.5), lt ? 0.5 : 0.35);
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const bx = rnd() * W, by = SURFACE_Y + 14 + rnd() * (MUD_Y - SURFACE_Y - 24), sp = 0.5 + rnd(), r = 0.7 + rnd() * 1.1;
      const x = ((bx + t * FLOW_PX * 0.6 * flow * sp) % (W + 20)) - 10;
      const y = by + Math.sin(t * 0.6 + i) * 3;
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.water, 0.65), 0.5);           // bubbles rising from the mud
    ctx.strokeStyle = alpha(lighten(c.water, 0.8), 0.7);
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 5; i++) {
      const bx = 90 + i * 113 + (i % 2) * 31, span = MUD_Y - SURFACE_Y;
      const y = MUD_Y - (((t * (14 + i * 3)) + i * 61) % span);
      const x = bx + Math.sin(t * 2 + i) * 2.5, r = 1.6 + (i % 3) * 0.7;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // The water line drawn last, over everything under it: the bright surface and the sky's
  // reflection on its underside.
  _drawSurface(ctx, c, t) {
    const u = ctx.createLinearGradient(0, SURFACE_Y, 0, SURFACE_Y + 12);
    u.addColorStop(0, alpha(lighten(c.water, 0.6), 0.5));
    u.addColorStop(1, alpha(lighten(c.water, 0.6), 0));
    ctx.fillStyle = u;
    ctx.fillRect(0, SURFACE_Y, W, 12);
    ctx.strokeStyle = alpha(lighten(c.water, 0.8), 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const y = SURFACE_Y + Math.sin(x * 0.06 + t * 1.4) * 0.9;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // The payoff: on the last beat the pond dims and the few that are left sit in pools of light.
  _drawLeft(ctx, c) {
    if (this.stage !== S_LEFT) return;
    const k = reducedMotion() ? 1 : Math.min(1, this.age / 1.2);
    const left = this._eggs.filter((e) => !e.lost);
    const shade = darken(mix(c.water, c.good, 0.38), 0.65);     // dark in both themes
    const R0 = 22, R1 = 44;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, SURFACE_Y, W, H - SURFACE_Y);
    for (const e of left) { ctx.moveTo(e.x + R1, e.y); ctx.arc(e.x, e.y, R1, 0, Math.PI * 2, true); }
    ctx.fillStyle = alpha(shade, 0.34 * k);
    ctx.fill('evenodd');
    for (const e of left) {                                      // feather each hole's edge
      const fg = ctx.createRadialGradient(e.x, e.y, R0, e.x, e.y, R1);
      fg.addColorStop(0, alpha(shade, 0));
      fg.addColorStop(1, alpha(shade, 0.34 * k));
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(e.x, e.y, R1, 0, Math.PI * 2); ctx.fill();
      const sg = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, R0 + 6);
      sg.addColorStop(0, alpha(lighten(c.warning, 0.5), 0.45 * k));
      sg.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(e.x, e.y, R0 + 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _drawBranch(ctx, c) {                                          // a fallen branch lying under the water
    const bark = mix(darken(c.warning, 0.55), c.stroke, 0.35);
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(WATER.x - 40, SURFACE_Y + 156);
      ctx.quadraticCurveTo(WATER.x + 180, SURFACE_Y + 108, WATER.x + 330, SURFACE_Y + 138);
    };
    const twigs = () => {
      ctx.beginPath();
      ctx.moveTo(WATER.x + 190, SURFACE_Y + 122); ctx.quadraticCurveTo(WATER.x + 215, SURFACE_Y + 100, WATER.x + 250, SURFACE_Y + 86);
      ctx.moveTo(WATER.x + 250, SURFACE_Y + 127); ctx.quadraticCurveTo(WATER.x + 270, SURFACE_Y + 108, WATER.x + 300, SURFACE_Y + 96);
      ctx.moveTo(WATER.x + 80, SURFACE_Y + 132); ctx.lineTo(WATER.x + 60, SURFACE_Y + 108);
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(darken(bark, 0.4), 0.9);
    ctx.lineWidth = 13; path(); ctx.stroke();
    ctx.lineWidth = 6; twigs(); ctx.stroke();
    ctx.strokeStyle = bark;
    ctx.lineWidth = 10; path(); ctx.stroke();
    ctx.lineWidth = 4; twigs(); ctx.stroke();
    ctx.save();                                                  // the lit top of the bark
    ctx.translate(0, -2.5);
    ctx.strokeStyle = alpha(lighten(bark, 0.35), 0.8);
    ctx.lineWidth = 2.5; path(); ctx.stroke();
    ctx.restore();
    const rnd = mulberry32(23);                                  // green weed growing on it
    ctx.strokeStyle = alpha(mix(c.good, c.water, 0.3), 0.7);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const u = rnd();
      const x = WATER.x - 40 + u * 370, y = SURFACE_Y + 156 - u * 30 - 4 + Math.sin(u * 3) * 6;
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3, y - 4, x + 6 + rnd() * 3, y - 6 - rnd() * 5);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  _drawMud(ctx, c) {
    const bed = mix(darken(c.bgSurface, 0.3), c.warning, 0.22);
    ctx.beginPath();
    ctx.moveTo(0, MUD_Y + 10);
    for (let x = 0; x <= W; x += 26) {
      ctx.quadraticCurveTo(x + 13, MUD_Y - 4 - ((x / 26) % 3) * 3, x + 26, MUD_Y + ((x / 26) % 2) * 3);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, MUD_Y - 6, 0, H);
    g.addColorStop(0, lighten(bed, 0.12));
    g.addColorStop(1, darken(bed, 0.4));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = alpha(lighten(bed, 0.3), 0.85);              // the lit lip of the bed
    ctx.fillRect(0, MUD_Y - 2, W, 2);
    const rnd = mulberry32(13);
    for (let i = 0; i < 26; i++) {                               // pebbles, lit top-left
      const x = rnd() * W, y = MUD_Y + 8 + rnd() * 36, rx = 3 + rnd() * 6, ry = rx * (0.5 + rnd() * 0.2);
      const pc = mix(bed, c.labelMuted, 0.15 + rnd() * 0.25);
      ctx.fillStyle = alpha(darken(bed, 0.45), 0.5);
      ctx.beginPath(); ctx.ellipse(x + 1.5, y + ry * 0.6, rx, ry * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pc;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha(lighten(pc, 0.35), 0.7);
      ctx.beginPath(); ctx.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.4, ry * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = alpha(darken(bed, 0.35), 0.45);              // grain
    for (let i = 0; i < 160; i++) ctx.fillRect(rnd() * W, MUD_Y + 4 + rnd() * (H - MUD_Y), 1.3, 1.3);
  }

  // The reed bed along the right edge, rising out of the mud and through the surface. Row 0 is
  // the back rank (drawn behind the eggs), row 1 the front rank (in front of them).
  _drawReeds(ctx, c, t, row) {
    const stalk = mix(c.good, c.stroke, row ? 0.3 : 0.5);
    const head = darken(mix(c.flame, c.waste, 0.45), 0.25);
    const rnd = mulberry32(row ? 61 : 67);
    const n = row ? 6 : 8;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = REED_X - 8 + rnd() * 70 + (row ? 6 : 0);
      const h = MUD_Y - SURFACE_Y + 6 + rnd() * 70;              // tall enough to break the surface
      const sway = Math.sin(t * 0.7 + i * 1.3 + row) * 3;
      const tx = x + (rnd() - 0.5) * 10 + sway, ty = MUD_Y - h;
      const mx = x + (tx - x) * 0.4, my = MUD_Y - h * 0.55;
      ctx.strokeStyle = alpha(darken(stalk, 0.25), row ? 1 : 0.75);
      ctx.lineWidth = row ? 3.6 : 2.8;
      ctx.beginPath(); ctx.moveTo(x, MUD_Y + 8); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
      ctx.strokeStyle = alpha(lighten(stalk, 0.25), row ? 0.9 : 0.6);
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(x - 0.8, MUD_Y + 8); ctx.quadraticCurveTo(mx - 0.8, my, tx - 0.8, ty); ctx.stroke();
      if (i % 2 === 0) {                                       // a long blade off the stalk
        const by = MUD_Y - h * (0.3 + rnd() * 0.3), bx = x + (tx - x) * ((MUD_Y - by) / h);
        ctx.fillStyle = alpha(stalk, row ? 0.95 : 0.7);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 22, by - 18 + sway, bx - 30 + sway, by - 46);
        ctx.quadraticCurveTo(bx - 14, by - 20, bx + 2, by - 6);
        ctx.closePath(); ctx.fill();
      }
      if (ty < SURFACE_Y - 8) {                                   // a seed head in the air
        const hg = ctx.createLinearGradient(tx - 3, 0, tx + 3, 0);
        hg.addColorStop(0, lighten(head, 0.25));
        hg.addColorStop(1, darken(head, 0.2));
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.ellipse(tx, ty + 9, 3.2, 9, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.lineCap = 'butt';
  }

  _drawStreaks(ctx, c) {                                         // the current, left to right
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.2;
    for (const s of this._streaks) {
      if (s.x < -20 || s.x - s.len > W) continue;
      const g = ctx.createLinearGradient(s.x - s.len, 0, s.x, 0);   // a tapered wisp, brightest at its head
      g.addColorStop(0, alpha(lighten(c.water, 0.6), 0));
      g.addColorStop(1, alpha(lighten(c.water, 0.6), 0.45));
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(s.x - s.len, s.y + 1.5);
      ctx.quadraticCurveTo(s.x - s.len * 0.5, s.y - 1.5, s.x, s.y);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  // The eggs, then the marks of the ones that were lost: 300 in, 300 on the board.
  _drawEggs(ctx, c) {
    const a = this._eggAlpha();
    if (a > 0) {
      const fert = this.stage >= S_MET;
      const last = this.stage === S_LEFT;
      const base = lighten(c.water, 0.62);
      const col = fert ? mix(base, c.gold, 0.28) : base;
      const radii = [];
      for (const e of this._eggs) {
        if (e.lost) { radii.push(0); continue; }
        // an egg being taken shrinks into whatever is taking it, so the loss is seen happen
        let r = (last ? 3.6 : 2.2) * (this.stage === S_RELEASE ? 0.45 + 0.55 * a : 1);
        if (e.near < 26) r *= Math.max(0.18, e.near / 26);
        radii.push(r);
      }
      const egg = last ? lighten(col, 0.2) : col;
      const pass = (fill, dx, dy, k) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        this._eggs.forEach((e, i) => {
          const r = radii[i] * k;
          if (r <= 0) return;
          ctx.moveTo(e.x + dx + r, e.y + dy);
          ctx.arc(e.x + dx, e.y + dy, r, 0, Math.PI * 2);
        });
        ctx.fill();
      };
      pass(alpha(darken(c.water, 0.45), 0.35 * a), 0.4, 0.6, 1.12);   // the jelly's dark rim
      pass(alpha(egg, 0.85 * a), 0, 0, 1);
      pass(alpha(lighten(egg, 0.6), 0.9 * a), -0.35 * 2.2, -0.35 * 2.2, 0.36);   // the glint
      if (last) {                                          // the three that made it are ringed
        ctx.strokeStyle = alpha(c.gold, 0.9);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (const e of this._eggs) {
          if (e.lost) continue;
          ctx.moveTo(e.x + 6.5, e.y);
          ctx.arc(e.x, e.y, 6.5, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    }
    if (this.stage === S_RELEASE && this.age > SPERM_AT) {
      this._drawSperm(ctx, c, Math.min(1, (this.age - SPERM_AT) / SPERM_IN));
    } else if (this.stage === S_MET) {
      this._drawSperm(ctx, c, Math.max(0, 1 - this.age / 1.0));
    }
    // lost: a dim mark where each egg ended up, so a tap can still read it. The tone follows
    // the theme - the marks have to read on pale blue water AND on a dark mud bed.
    ctx.fillStyle = alpha(mix(c.label, c.bgDeep, luma(c.bgDeep) > 0.5 ? 0.72 : 0.42), 0.62);
    ctx.beginPath();
    for (const e of this._eggs) {
      if (!e.lost) continue;
      ctx.moveTo(e.lx + 1.6, e.ly);
      ctx.arc(e.lx, e.ly, 1.6, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  _drawSperm(ctx, c, a) {
    ctx.strokeStyle = alpha(mix(c.label, c.water, 0.25), 0.85 * a);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const p of this._sperm) {
      if (p.x === 0 && p.y === 0) continue;
      const ang = p.a + p.ph + p.spin * 0.4;              // pointing the way it is going
      const tx = p.x + Math.cos(ang) * p.len, ty = p.y + Math.sin(ang) * p.len;
      ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty);
      ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(ang + 2.5) * 2, ty + Math.sin(ang + 2.5) * 2);
    }
    ctx.stroke();
  }

  _eggAlpha() {
    if (this.stage === S_EMPTY) return 0;                        // nothing has been released yet
    if (this.stage === S_RELEASE) return Math.min(1, this.age / CLOUD_AT);
    return 1;
  }

  _drawFish(ctx, c) {
    const k = this._fishAlpha();
    if (k <= 0) return;
    for (const f of this._fishSpots()) {
      ctx.globalAlpha = k;
      drawFish(ctx, c, f.x, f.y, f.len, f.dir, this._amb);
      ctx.globalAlpha = 1;
    }
  }

  /** A design size that reaches at least 12 px on screen: on a phone the stage is drawn at under half size. */
  _px(design) {
    const w = this._canvas?.getBoundingClientRect?.().width;
    return w > 0 ? Math.max(design, Math.ceil((12 * 680) / w)) : design;
  }

  // The tapped egg: a thin ring on it, its own chip beside it, never on it.
  _drawMark(ctx, c) {
    const e = this._eggs[this._mark];
    if (!e) return;
    const x = e.lost ? e.lx : e.x, y = e.lost ? e.ly : e.y;
    ctx.strokeStyle = alpha(c.gold, 0.95);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
    const text = STATE_CHIP[e.lost ? e.fate : 'drifting'];
    const right = x < POND.x + POND.w - 140;
    const cx = right ? x + 12 : x - 12;
    const cy = Math.max(SURFACE_Y + 16, Math.min(MUD_Y - 10, y - 34));
    leader(ctx, right ? cx + 4 : cx - 4, cy + 8, x, y - 6, c.gold, 0.5, this.clock);
    chipRow(ctx, c, [{ text, bg: c.gold }], cx, cy, { align: right ? 'left' : 'right', size: this._px(15) });
  }

  _drawChips(ctx, c) {
    // A live number redrawn every frame reads as overlapping text: hold it, refresh it twice a second.
    const n = this.stage === S_EMPTY ? -1 : this._alive();
    if (n !== this._dispN && (this._dispN === -2 || this.clock - this._dispAt > 0.45)) {
      this._dispN = n; this._dispAt = this.clock;
    }
    const shown = this._dispN < 0 ? -1 : this._dispN;
    const items = [];
    if (shown >= 0) {
      items.push({ text: this.stage === S_LEFT ? 'a few eggs left' : 'many eggs', bg: this.stage === S_LEFT ? c.good : c.accent });
    }
    items.push({ text: BEAT_CHIP[this.stage], bg: c.raised });
    const size = this._px(15);
    chipRow(ctx, c, items, ZONES.top.x + 16, ZONES.top.y + 28, { align: 'left', size });
  }

  pointerDown(p) {
    let best = -1, bd = 11;
    for (let i = 0; i < this._eggs.length; i++) {
      const e = this._eggs[i];
      const x = e.lost ? e.lx : e.x, y = e.lost ? e.ly : e.y;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = i; }
    }
    if (this.stage === S_EMPTY) return;                          // nothing in the pond to mark yet
    this._mark = best;
    this.animateFor(400);
  }
}
