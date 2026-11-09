// SublimationScene - Fig. 5.17. Camphor leaves the sand in a china dish and builds up on the cooler inner wall of an
// upside-down funnel. Heat stays below camphor's melting point: the dial's top is that limit.
//   b0  the set-up, every part named
//   b1  the learner heats it: the camphor leaves, the white solid builds up, no liquid ever appears
//   b2  tap the dish and the funnel wall to name the two directions: sublimation and deposition (the find)
//   b3  pull out the cotton and heat a fresh dish: some solid still forms, less of it, and vapour escapes at the nozzle
//   b4  other samples: naphthalene and salt works; salt and sand do not sublime, so nothing moves
//
// What the scene must never draw: a puddle, a wet bed, a drip, a meniscus, or a crystal
// on the OUTSIDE of the glass. The sand never moves - its grains are a fixed seeded set
// that only ever get fewer, never redrawn somewhere else.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { font, alpha, luma, mix, lighten, darken, mulberry32, leader, pill, drawBackdrop, drawBench, drawReadout, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

// --- apparatus geometry (design space, px). One funnel drawn as three paths. ---
const CX = 340;                       // the apparatus is centred
const MOUTH_HW = 142;                 // half-width of the funnel's mouth, over the dish
const MOUTH_Y = 330;                  // the mouth rim, level with the dish rim
const NECK_HW = 16;                   // half-width of the stem
const NECK_Y = 166;                   // where the cone meets the stem
const NECK_TOP_Y = 124;               // the top of the stem
const PLUG_Y = 116;                   // the cotton plug fills the stem from here down
const CONE_S = Math.hypot(MOUTH_HW - NECK_HW, MOUTH_Y - NECK_Y);
const NECK_S = NECK_Y - NECK_TOP_Y;
// The kit's funnel, mouth down, built so its cavity IS the path _innerPath traces: the crust and
// the haze are clipped to that path, and the glass now wraps it with one even wall.
const FUNNEL = glassBox('funnel', CX - MOUTH_HW - 4, NECK_TOP_Y - 4, MOUTH_HW * 2 + 8, MOUTH_Y - NECK_TOP_Y + 8,
  { wall: 4, flip: true, cone: (MOUTH_Y - NECK_Y) / (MOUTH_Y - NECK_TOP_Y), stem: NECK_HW / MOUTH_HW });
const WALL_S = CONE_S + NECK_S;       // total inner-wall length the crust can climb
const CRUST_S = WALL_S - 18;          // the crust stops short of the stem's top
const DISH_Y = 344;                   // the china dish's floor
const GAUZE_Y = 360;
const TRIPOD_TOP = 364;
const BENCH_Y = 468;                  // the bench top, clear of the label block above it
const BURNER_Y = 444;                 // the flame's root
const LOOSE = { x: 396, y: 362 };     // where the pulled plug comes to rest, on the gauze

// --- the model ---
const HEAT_MIN = 0.08;                // below this nothing happens
const RATE0 = 0.08, RATE1 = 0.1;      // camphor fraction per second at 0 and at full heat
const OPEN_K = 0.45;                  // share of the vapour that still lands on the glass with the nozzle open
const RUN_S = 26;                     // a hard cap: every run ends
const GRAINS = 90;                    // camphor grains in the bed at the start
const easeCrust = (c) => 1 - Math.pow(1 - c, 0.85);
const crustS = (c) => easeCrust(c) * CRUST_S;
const crustT = (c) => 9 + 32 * c;     // the rim's thickness, px
const rateAt = (h) => RATE0 + RATE1 * h;

// One entry per beat.
const MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

const SAMPLES = {
  camphor: { label: 'Camphor, sand', sub: true },
  naphthalene: { label: 'Naphthalene, salt', sub: true },
  none: { label: 'Salt, sand', sub: false },
};

export class SublimationScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A china dish of crushed camphor and sand on a wire gauze over a tripod, a burner below, and an upside-down glass funnel with cotton in its nozzle. Gentle heat makes the camphor leave the dish and a white solid build up inside the funnel, with no liquid at any point. With the cotton out, less collects and some vapour escapes.';
  static CONTROLS = [
    { type: 'slider', id: 'heat', label: 'Heat, below the melting point', min: 0, max: 100, step: 1, value: 0, suffix: '%' },
    { type: 'toggle', id: 'plug', label: 'Cotton plug in' },
    { type: 'button', id: 'nameUp', label: 'Solid to vapour' },
    { type: 'button', id: 'nameDown', label: 'Vapour to solid' },
    { type: 'segmented', id: 'sample', label: 'Sample', value: 'camphor', options: Object.entries(SAMPLES).map(([value, v]) => ({ value, label: v.label })) },
    { type: 'button', id: 'reset', label: 'Fresh dish' },
  ];

  constructor(container, config) {
    super(container, config);
    this._heat = 0;
    this._plug = true;
    this._camphor = 1;                 // the bed's camphor fraction, 1 -> 0
    this._crust = 0;                   // the crust on the inner wall, 0 -> 1
    this._run = null;                  // { t, stage } while the bed is giving up camphor
    this._done = {};                   // celebrated runs, by the stage that launched them
    this._grain = this._seedGrains();
    this._sand = this._seedSand();
    this._crackle = this._seedCrackle();
    this._pct = 100;                 // the value the card shows, refreshed about 1x a second
    this._pctAge = 9;                // clock seconds since it was last refreshed
    this._named = { up: false, down: false };
    this._found = false;
    this._sample = 'camphor';
  }

  // The camphor percentage, rounded to 5 %. A live number redrawn every frame reads as
  // overlapping text, so update() refreshes this about once a second and draw only reads it.
  _shownPct() { return this._pct; }

  // Fixed seeded sets: a grain's place never changes, so a grain that leaves is gone, not moved.
  _seedGrains() {
    const rnd = mulberry32(7);
    const out = [];
    for (let i = 0; i < GRAINS; i++) {
      out.push({ x: (rnd() * 2 - 1), y: (rnd() * 2 - 1), r: 1.6 + rnd() * 1.9, a: 0.55 + rnd() * 0.45 });
    }
    return out;
  }
  _seedSand() {
    const rnd = mulberry32(21);
    const out = [];
    for (let i = 0; i < 150; i++) out.push({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, r: 0.8 + rnd() * 1.1 });
    return out;
  }
  // Speckle for the crust's own grain, so it reads as crystals and not as a painted band.
  _seedCrackle() {
    const rnd = mulberry32(11);
    const out = [];
    for (let i = 0; i < 220; i++) out.push({ u: rnd(), v: rnd(), r: 0.7 + rnd() * 1.5, a: 0.3 + rnd() * 0.6 });
    return out;
  }

  enter(stage) {
    // Everything the scene carries between beats is reset here, so a mount straight onto
    // any beat is identical to arriving there by walking the beats one at a time.
    this._run = null;
    this._done = {};
    this._named = { up: false, down: false };
    this._found = false;
    this._sample = 'camphor';
    this._plug = true;
    this._heat = 0;
    this._camphor = 1;
    this._crust = 0;
    if (stage === 2) { this._heat = 0.6; this._camphor = 0.05; this._crust = 0.95; }
    this._pct = Math.round(this._camphor * 20) * 5;
    this._pctAge = 9;
    this.requestUiUpdate?.();
  }

  _launch() {
    if (this._run || !SAMPLES[this._sample].sub) return;
    if (reducedMotion()) {
      const k = this._plug ? 1 : OPEN_K;
      this._crust = Math.min(1, this._crust + this._camphor * k);
      this._camphor = 0;
      this._pct = 0;
      return;
    }
    this._run = { t: 0, stage: this.stage };
  }

  update(d) {
    // the held readout: refreshed here, once a second, never inside draw()
    this._pctAge += d;
    if (this._pctAge >= 1) { this._pct = Math.round(this._camphor * 20) * 5; this._pctAge = 0; }
    const r = this._run;
    if (!r) return;
    r.t += d;
    if (this._heat < HEAT_MIN || this._camphor <= 0 || r.t > RUN_S) {
      this._run = null;
      this._pct = Math.round(this._camphor * 20) * 5;
      this.requestUiUpdate?.();
      return;
    }
    const gone = rateAt(this._heat) * d;
    this._camphor = Math.max(0, this._camphor - gone);
    // What leaves the dish lands on the cool glass. With the nozzle open, part of it gets away.
    this._crust = Math.min(1, this._crust + gone * (this._plug ? 1 : OPEN_K));
  }

  busy() { return !!this._run; }

  // The burner is lit whenever the heat is up, run or no run - that is the real burner.
  get lit() { return this._heat >= HEAT_MIN; }

  // --- drawing ---

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 60 });
    this._stand(ctx, c);
    this._dish(ctx, c);
    this._funnel(ctx, c);
    this._burner(ctx, c);
    if (this.stage === 0) this._labels(ctx, c);
    else this._reading(ctx, c);
    if (this.stage === 2) this._names(ctx, c);
    if (!this._plug && this._run) this._escape(ctx, c);
    this._hint(ctx, c);
  }

  _stand(ctx, c) {
    // tripod: two splayed legs and a back leg, under the gauze
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.15); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(CX - 96, BENCH_Y - 4); ctx.lineTo(CX - 26, TRIPOD_TOP + 6);
    ctx.moveTo(CX + 96, BENCH_Y - 4); ctx.lineTo(CX + 26, TRIPOD_TOP + 6);
    ctx.moveTo(CX, BENCH_Y - 4); ctx.lineTo(CX, TRIPOD_TOP + 10);
    ctx.stroke();
    // wire gauze: a square plate seen from the side, with its mesh
    ctx.fillStyle = mix(c.label, c.bgDeep, 0.5);
    rr(ctx, CX - 112, GAUZE_Y, 224, 8, 2); ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.42); ctx.lineWidth = 1;
    for (let i = 1; i < 20; i++) {
      const x = CX - 112 + i * (224 / 20);
      ctx.beginPath(); ctx.moveTo(x, GAUZE_Y); ctx.lineTo(x, GAUZE_Y + 8); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(CX - 112, GAUZE_Y + 4); ctx.lineTo(CX + 112, GAUZE_Y + 4); ctx.stroke();
  }

  _dish(ctx, c) {
    // the china dish: a shallow white bowl, rim at MOUTH_Y, floor at DISH_Y
    const rimHW = 152, floorHW = 118, rimY = MOUTH_Y, floorY = DISH_Y;
    ctx.beginPath();
    ctx.moveTo(CX - rimHW, rimY);
    ctx.quadraticCurveTo(CX, rimY + 34, CX + rimHW, rimY);
    ctx.quadraticCurveTo(CX, rimY + 44, CX - rimHW, rimY);
    ctx.closePath();
    ctx.fillStyle = mix(lighten(c.glass, 0.55), c.label, 0.12);
    ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2; ctx.stroke();

    // the bed: sand, then the white camphor grains sitting in it
    const bw = 132, bh = 26, by = rimY + 10;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(CX, by, bw, bh, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = mix(c.gold, c.bgDeep, 0.52);
    ctx.fillRect(CX - bw, by - bh, bw * 2, bh * 2);
    ctx.fillStyle = mix(c.gold, c.bgDeep, 0.36);
    for (const s of this._sand) {
      ctx.beginPath(); ctx.arc(CX + s.x * bw, by + s.y * bh, s.r, 0, Math.PI * 2); ctx.fill();
    }
    // camphor: the first N of a fixed set, N falling as the bed gives it up
    const left = Math.round(GRAINS * this._camphor);
    ctx.fillStyle = mix(lighten(c.glass, 0.85), c.label, 0.05);
    for (let i = 0; i < left; i++) {
      const g = this._grain[i];
      ctx.globalAlpha = g.a;
      ctx.beginPath(); ctx.arc(CX + g.x * bw, by + g.y * bh, g.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = alpha(c.label, 0.35); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(CX, by, bw, bh, 0, 0, Math.PI * 2); ctx.stroke();
    // the dish's own foot, so the bowl reads as sitting on the gauze
    ctx.fillStyle = mix(lighten(c.glass, 0.4), c.bgDeep, 0.2);
    rr(ctx, CX - floorHW, floorY, floorHW * 2, 8, 3); ctx.fill();
  }

  // The funnel's inner surface, as a path from the mouth's left rim, up the cone, to the stem's top.
  _innerPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(CX - MOUTH_HW, MOUTH_Y);
    ctx.lineTo(CX - NECK_HW, NECK_Y);
    ctx.lineTo(CX - NECK_HW, NECK_TOP_Y);
    ctx.lineTo(CX + NECK_HW, NECK_TOP_Y);
    ctx.lineTo(CX + NECK_HW, NECK_Y);
    ctx.lineTo(CX + MOUTH_HW, MOUTH_Y);
  }

  // A point on the left inner wall, s px along it from the mouth's rim, and the inward
  // normal there. This is what keeps the crust ON the glass: the band is offset along it.
  _wall(s) {
    let x, y, nx, ny;
    if (s <= CONE_S) {
      const u = s / CONE_S;
      const hw = MOUTH_HW + (NECK_HW - MOUTH_HW) * u;
      x = CX - hw;
      y = MOUTH_Y + (NECK_Y - MOUTH_Y) * u;
      const dx = -(MOUTH_HW - NECK_HW) / CONE_S, dy = -(MOUTH_Y - NECK_Y) / CONE_S;   // up the cone
      nx = -dy; ny = dx;                                       // the normal pointing into the cone
      const m = Math.hypot(nx, ny); nx /= m; ny /= m;
    } else {
      x = CX - NECK_HW; y = NECK_Y - (s - CONE_S); nx = 1; ny = 0;
    }
    return { x, y, nx, ny };
  }

  // The crust band: a crescent hugging the inner wall on one side, from the mouth's rim up
  // to the front. Returns the sampled points [outerX, outerY, innerX, innerY] for that side,
  // so the caller can fill the crescent and speckle inside it. Never a filled cone.
  _band(sEnd, th, side) {
    const N = 30;
    const out = [];
    for (let i = 0; i <= N; i++) {
      const p = this._wall((sEnd * i) / N);
      // Never thicker than the glass is wide here: in the stem the two banks must not meet.
      const cap = Math.abs(CX - p.x) - 2;
      // The inner edge is ragged, not a parallel stripe: a crust grows in clumps.
      const w = 0.72 + 0.5 * ((Math.sin(i * 1.7 + (side < 0 ? 0 : 2.1)) + 1) / 2)
        + 0.16 * ((Math.sin(i * 4.3) + 1) / 2);
      const t = Math.min(th * w, cap);
      out.push([p.x + p.nx * 1.5, p.y + p.ny * 1.5, p.x + p.nx * t, p.y + p.ny * t]);
    }
    return side < 0 ? out : out.map((q) => [2 * CX - q[0], q[1], 2 * CX - q[2], q[3]]);
  }

  _bandPath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][2], pts[i][3]);
    ctx.closePath();
  }

  // Vapour: a faint drifting fog inside the funnel only, so it can never read as a jet.
  _haze(ctx, c, t) {
    ctx.save();
    this._innerPath(ctx);
    ctx.closePath();
    ctx.clip();
    const rnd = mulberry32(31);
    for (let i = 0; i < 26; i++) {
      const bx = rnd(), sp = 0.03 + rnd() * 0.05, ph = rnd() * 6.283, r = 7 + rnd() * 11;
      const u = (((rnd() + 0.5) - t * sp * 1.6) % 1 + 1) % 1;
      const y = MOUTH_Y - 4 - u * 128;
      const spread = 1 - u * 0.5;
      const x = CX + (bx * 2 - 1) * 120 * spread + Math.sin(t * 0.7 + ph) * 7;
      ctx.globalAlpha = (0.05 + 0.07 * Math.sin(t * 1.7 + ph)) * (1 - u * 0.5);
      ctx.fillStyle = lighten(c.glass, 0.8);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _funnel(ctx, c) {
    const t = this.clock;
    const th = crustT(this._crust);
    const snow = luma(c.bgDeep) > 0.5 ? c.bgSurface : mix(c.label, c.bgSurface, 0.08);

    drawGlass(ctx, c, FUNNEL, { shadow: false, rim: false });

    // the haze between the bed and the glass - vapour only, never a line or a jet
    if (this._run) this._haze(ctx, c, t);

    // the crust: a banked band hugging the inner wall, clipped to the inside of the glass
    // so it can never reach the outside
    if (this._crust > 0.004) {
      const s = crustS(this._crust);
      ctx.save();
      this._innerPath(ctx);
      ctx.closePath();
      ctx.clip();
      const sides = [this._band(s, th, -1), this._band(s, th, 1)];
      for (const pts of sides) {
        ctx.fillStyle = snow;
        this._bandPath(ctx, pts); ctx.fill();
        // A shaded line where the bank meets the glass: on white glass in the light theme a
        // white bank on a white wall has no edge of its own without one.
        ctx.strokeStyle = alpha(darken(c.glass, 0.3), 0.8);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
        // a bright lip on the inner edge: the surface the vapour is landing on
        ctx.strokeStyle = alpha(darken(c.glass, 0.2), 0.75);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts[0][2], pts[0][3]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][2], pts[i][3]);
        ctx.stroke();
      }
      // its own grain: white speckle inside the bank, so it reads as crystals
      ctx.fillStyle = alpha(darken(c.glass, 0.15), 0.8);
      for (const pts of sides) {
        for (const k of this._crackle) {
          const i = Math.min(pts.length - 1, Math.floor(k.u * (pts.length - 1)));
          const [ox, oy, ix, iy] = pts[i];
          ctx.globalAlpha = k.a * (0.45 + 0.5 * this._crust);
          ctx.beginPath(); ctx.arc(ox + (ix - ox) * k.v, oy + (iy - oy) * k.v, k.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // the front's own bright edge, a straight line across the glass at the front's height
      ctx.restore();
    }

    // the glass on top: the kit's streaks down the cone, then the mouth's rim seen as an ellipse
    drawGlassFront(ctx, c, FUNNEL, { shade: 0 });
    ctx.strokeStyle = alpha(lighten(c.glass, 0.25), 0.85); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX, MOUTH_Y, MOUTH_HW + 2, 22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.7); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(CX, MOUTH_Y, MOUTH_HW + 2, 22, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();

    // the cotton plug: in the stem, or out on the gauze
    if (this._plug) {
      ctx.fillStyle = lighten(c.glass, 0.8);
      rr(ctx, CX - NECK_HW - 1, PLUG_Y, (NECK_HW + 1) * 2, NECK_TOP_Y - PLUG_Y + 4, 3); ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.3); ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const x = CX - NECK_HW - 1 + i * ((NECK_HW + 1) * 2 / 4);
        ctx.beginPath(); ctx.moveTo(x, PLUG_Y + 2); ctx.lineTo(x, NECK_TOP_Y + 2); ctx.stroke();
      }
    } else {
      ctx.fillStyle = lighten(c.glass, 0.8);
      rr(ctx, LOOSE.x - 13, LOOSE.y - 5, 26, 10, 5); ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.3); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(LOOSE.x - 8, LOOSE.y); ctx.lineTo(LOOSE.x + 8, LOOSE.y); ctx.stroke();
    }
  }

  _burner(ctx, c) {
    const t = this.clock;
    // barrel and foot
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.1);
    rr(ctx, CX - 17, BURNER_Y - 26, 34, 26, 4); ctx.fill();
    rr(ctx, CX - 27, BURNER_Y - 4, 54, 10, 3); ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.label, 0.3);
    rr(ctx, CX - 19, BURNER_Y - 22, 38, 7, 2); ctx.fill();
    if (!this.lit) return;
    const f = 24 + 44 * this._heat + 6 * Math.sin(t * 11);   // the flame follows the dial
    const g = ctx.createLinearGradient(CX, BURNER_Y - 26, CX, BURNER_Y - 26 - f);
    g.addColorStop(0, alpha(c.flame, 0.95));
    g.addColorStop(0.55, alpha(c.flame, 0.5));
    g.addColorStop(1, alpha(c.flame, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(CX - 10, BURNER_Y - 26);
    ctx.quadraticCurveTo(CX - 18, BURNER_Y - 26 - f * 0.7, CX, BURNER_Y - 26 - f);
    ctx.quadraticCurveTo(CX + 18, BURNER_Y - 26 - f * 0.7, CX + 10, BURNER_Y - 26);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.flame, 0.55), 0.9);
    ctx.beginPath();
    ctx.moveTo(CX - 6, BURNER_Y - 26);
    ctx.quadraticCurveTo(CX - 7, BURNER_Y - 56, CX, BURNER_Y - 63);
    ctx.quadraticCurveTo(CX + 7, BURNER_Y - 56, CX + 6, BURNER_Y - 26);
    ctx.closePath(); ctx.fill();
  }

  _reading(ctx, c) {
    const sub = SAMPLES[this._sample].sub;
    const rows = [
      { label: 'in the dish', value: sub ? `${this._pct}%` : 'all of it', meter: sub ? this._camphor : 1, col: lighten(c.glass, 0.2) },
      { label: 'on the funnel', value: this._crust > 0.02 ? (this._crust > 0.6 ? 'a lot' : 'some') : 'none', meter: this._crust, col: c.accent },
    ];
    // The kit's card has fixed type: on a phone the whole card is drawn larger instead.
    const k = PHONE ? 1.65 : 1;
    ctx.save();
    ctx.translate(PHONE ? 6 : 16, PHONE ? 8 : 22);
    ctx.scale(k, k);
    drawReadout(ctx, c, 0, 0, PHONE ? 168 : 186, rows, { rowH: 34 });
    ctx.restore();
    const x = 568;
    if (this.stage === 1 && this._camphor < 0.75) pill(ctx, c, 'no liquid', x, 60, { bg: c.warning, size: fs(21), display: true });
    if (this.stage === 3 && !this._plug && this._camphor <= 0.01) pill(ctx, c, 'less collected', x, 60, { bg: c.warning, size: fs(20), display: true });
    if (this.stage === 4) pill(ctx, c, SAMPLES[this._sample].label, x, 112, { bg: c.raised, size: fs(19), display: true });
    if (this.stage === 4) pill(ctx, c, sub ? (this._camphor < 0.9 ? 'one part sublimes' : 'heat it') : (this._heat > 0.1 ? 'neither sublimes' : 'heat it'), x, 60, { bg: sub ? c.raised : c.warning, size: fs(19), display: true });
  }

  _labels(ctx, c) {
    const chip = (t, x, y, tx, ty) => {
      pill(ctx, c, t, x, y, { bg: c.raised, size: fs(17), display: true });
      leader(ctx, x + (tx > x ? 62 : -62), y, tx, ty, darken(c.glass, 0.25), 0.95);
    };
    chip('cotton plug', 96, 92, CX - NECK_HW, PLUG_Y + 8);
    chip('glass funnel', 92, 200, CX - 86, 248);
    chip('china dish', 590, 300, CX + 148, MOUTH_Y + 12);
    chip('camphor, sand', 576, 216, CX + 60, MOUTH_Y + 8);
    chip('wire gauze', 96, 372, CX - 112, GAUZE_Y + 4);
    chip('tripod', 590, 400, CX + 70, 414);
    chip('burner', 96, 430, CX - 26, BURNER_Y - 10);
  }

  // Two arrows, one for each direction, each naming itself when tapped.
  _names(ctx, c) {
    const up = this._named.up, down = this._named.down;
    if (up) {
      vectorArrow(ctx, c, CX - 50, MOUTH_Y - 6, { angle: -Math.PI / 2, length: 112, col: c.accent, width: 9, head: 18 });
      pill(ctx, c, 'sublimation', 568, 150, { bg: c.accent, size: fs(24), display: true });
    }
    if (down) {
      vectorArrow(ctx, c, CX + 26, 232, { angle: 0.55, length: 66, col: c.good, width: 9, head: 18 });
      pill(ctx, c, 'deposition', 568, 214, { bg: c.good, size: fs(24), display: true });
    }
  }

  // Vapour leaving at the open nozzle.
  _escape(ctx, c) {
    const t = this.clock;
    for (let i = 0; i < 7; i++) {
      const u = (t * 0.45 + i / 7) % 1;
      const y = NECK_TOP_Y - 4 - u * 96;
      ctx.fillStyle = alpha(lighten(c.glass, 0.45), 0.5 * (1 - u));
      ctx.beginPath(); ctx.arc(CX + Math.sin(t * 2 + i * 1.7) * (6 + u * 16), y, 7 + u * 13, 0, Math.PI * 2); ctx.fill();
    }
    pill(ctx, c, 'some vapour escapes', 500, 76, { bg: c.warning, size: fs(18), display: true });
  }

  _hint(ctx, c) {
    let t = '';
    if (this.stage === 1 && this._heat < HEAT_MIN) t = 'push the heat up';
    if (this.stage === 2 && !(this._named.up && this._named.down)) t = 'name each direction';
    if (this.stage === 3 && this._plug) t = 'pull out the cotton';
    if (this.stage === 3 && !this._plug && this._heat < HEAT_MIN && this._camphor >= 1) t = 'now heat it';
    if (!t) return;
    pill(ctx, c, t, PHONE ? 524 : 568, 110, { bg: c.accent, size: fs(18), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
  }

  _t(ctx, text, x, y, o = {}) {
    ctx.font = font(this.colors, o.w || 700, o.s || 12, o.d);
    ctx.fillStyle = o.col || alpha(this.colors.label, 0.6);
    ctx.textAlign = o.a || 'left';
    ctx.textBaseline = o.b || 'alphabetic';
    ctx.fillText(text, x, y);
  }

  // --- controls ---

  isControlHidden(id) {
    const st = this.stage;
    if (id === 'heat') return st === 0 || st === 2;
    if (id === 'plug') return st !== 3;
    if (id === 'nameUp' || id === 'nameDown') return st !== 2;
    if (id === 'sample') return st !== 4;
    if (id === 'reset') return st === 0 || st === 2 || st === 4;   // on b4 a new sample is the fresh dish
    return false;
  }

  isControlDisabled(id) {
    if (id === 'reset') return !this._run && this._camphor >= 1 && this._crust < 0.01 && this._heat === 0;
    if (id === 'nameUp') return this._named.up;
    if (id === 'nameDown') return this._named.down;
    return false;
  }

  getControlValue(id) {
    if (id === 'heat') return String(Math.round(this._heat * 100));
    if (id === 'plug') return this._plug;
    if (id === 'sample') return this._sample;
    return super.getControlValue(id);
  }

  _name(which) {
    this._named[which] = true;
    if (this._named.up && this._named.down && !this._found) {
      this._found = true;
      this.celebrate(CX, 250, 20, { key: 'two-names', lookAt: true });
    }
  }

  _fresh() {
    this._heat = 0; this._camphor = 1; this._crust = 0; this._run = null; this._pct = 100;
    if (this.stage === 3) this._plug = true;
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'heat') {
      this._heat = clamp01(Number(v) / 100);         // the dial's top is the melting point
      if (this.lit && !this._run) this._launch();
    } else if (id === 'plug') {
      this._plug = !!v;
    } else if (id === 'nameUp') this._name('up');
    else if (id === 'nameDown') this._name('down');
    else if (id === 'sample') { this._sample = String(v); this._fresh(); }
    else if (id === 'reset') this._fresh();
    this.requestUiUpdate?.();
  }

  // The phone path: tap the plug, the burner, or (on b2) the dish and the funnel wall.
  pointerDown(p) {
    if (this.stage === 2) {
      if (Math.abs(p.x - CX) < 150 && p.y > MOUTH_Y - 20 && p.y < MOUTH_Y + 44) this._name('up');
      else if (Math.abs(p.x - CX) < 130 && p.y > NECK_Y && p.y < MOUTH_Y - 20) this._name('down');
      this.requestUiUpdate?.();
      return;
    }
    if (this.stage === 3) {
      if (this._plug && Math.hypot(p.x - CX, p.y - (PLUG_Y + 8)) < 30) { this._plug = false; this.requestUiUpdate?.(); this.animateFor(400); return; }
      if (!this._plug && Math.hypot(p.x - LOOSE.x, p.y - LOOSE.y) < 26) { this._plug = true; this.requestUiUpdate?.(); this.animateFor(400); return; }
    }
    if (this.stage !== 0 && Math.abs(p.x - CX) < 38 && p.y > BURNER_Y - 80 && p.y < BURNER_Y + 10) {
      this._heat = this._heat >= 0.5 ? 0 : 0.8;
      if (this.lit) this._launch(); else this._run = null;
      this.requestUiUpdate?.();
      this.animateFor(400);
    }
  }
}

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
