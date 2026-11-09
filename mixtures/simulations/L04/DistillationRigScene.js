// DistillationRigScene - the book's Fig. 5.12 set-up, one job per beat. A camera moves in on the part
// the beat is about, so the learner works on it at a size that can be seen.
//   stage 0  the whole set-up, every part named. Four jobs: boil, measure, cool, collect.
//   stage 1  on the condenser. Water in at the bottom: the jacket fills, vapour turns to liquid.
//            Water in at the top: it runs out along the low side, air stays in, vapour gets through.
//   stage 2  on the neck. The bulb sits in the vapour, level with the side arm. Drag it: high in the
//            neck little vapour reaches it and the reading is too low; in the liquid it reads the
//            liquid in the flask, not what is leaving.
//   stage 3  the whole set-up, run with acetone and water: the reading holds near 56 C.
//   stage 4  the same with salt water: the reading holds at 100 C, pure water drips over, salt stays.
// Science: no counter-current story. One reason only for the water: fed from the bottom the jacket
// stays full. Colours only from c. Each run ends by itself and nothing celebrates at a run's end.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, font, pill, rr, chipRow, leader, drawBackdrop, drawFloor, drawBench, drawCard, drawShadow, clamp, mulberry32,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassPipe, drawGlassPipeFront } from 'simulations/base/kit/SimGlass.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const DEG = '\u00b0';

const BENCH_Y = 434;
const FL = { x: 156, y: 288, r: 58 };
const NECK_TOP = 170, NECK_HW = 11;
const ARM = { x0: FL.x + 10, y0: 226, x1: 262, y1: 282, w: 13 };
const COND = { x0: 262, y0: 282, x1: 520, y1: 350, jw: 44, tw: 13 };
const PORT_UP = { x: 306, y: 271, ex: 296, ey: 244 };
const PORT_LO = { x: 469, y: 359, ex: 478, ey: 386 };
const ADAPT = { x0: 520, y0: 350, x1: 566, y1: 346, w: 11 };
const REC = { cx: 582, top: 336, base: BENCH_Y, hw: 40 };
const TUBE_TOP = 78;
const B_OK = 226, B_HIGH = 184, B_LOW = 322;       // bulb heights
const SURF = 302;                                  // liquid surface at the start
const T_ROOM = 24;
const RUN_S = 10;
const S_ALL = 0, S_WATER = 1, S_BULB = 2, S_RUN = 3, S_SALT = 4;
const CAMS = { 0: { x: 340, y: 260, z: 1 }, 1: { x: 392, y: 322, z: 2.05 }, 2: { x: 196, y: 248, z: 2.5 }, 3: { x: 340, y: 260, z: 1 }, 4: { x: 340, y: 260, z: 1 } };
const VIEW = { x: 340, y: 262 };

export class DistillationRigScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static IRIS = false;
  static BEAT_STEP_MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A distillation set-up on a bench: burner, tripod and wire gauze, a distillation flask with a thermometer and side arm, a water condenser, and a conical flask. Cold water goes in at the lower opening of the condenser and keeps the jacket full. The thermometer bulb sits in the vapour, level with the side arm.';
  static CONTROLS = [
    { type: 'segmented', id: 'flow', label: 'Cold water goes in at', value: 'bottom', options: [{ value: 'bottom', label: 'The bottom' }, { value: 'top', label: 'The top' }] },
    { type: 'segmented', id: 'bulb', label: 'Thermometer bulb', value: 'ok', options: [{ value: 'low', label: 'In the liquid' }, { value: 'ok', label: 'At the side arm' }, { value: 'high', label: 'High in the neck' }] },
    { type: 'button', id: 'run', label: 'Run the distillation' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._cam = { ...CAMS[0] };
    this._drag = false;
    this._seed();
  }

  _seed() {
    this._flow = 'bottom';
    this._jacket = 1;          // 1 full, 0 the thin stream of a top feed
    this._live = 0;            // seconds left of the moving picture
    this._ph = 0;              // the moving picture's own clock: it stops when the picture rests
    this._bulbY = B_OK;
    this._shownT = 56;
    this._sawBad = false;
    this._found = false;
    this._tm = 0;
    this._going = false;
    this._drag = false;
  }

  enter(stage) {
    this._seed();
    this._target = CAMS[stage];
    if (this.age === 0 && this._fresh !== false) { this._cam = { ...CAMS[stage] }; this._fresh = false; }
    if (stage === S_WATER || stage === S_BULB) this._live = 7;
    this._shownT = stage >= S_RUN ? T_ROOM : 56;
  }

  isControlHidden(id) {
    const s = this.stage;
    if (id === 'flow') return s !== S_WATER;
    if (id === 'bulb') return s !== S_BULB;
    return s !== S_RUN && s !== S_SALT;
  }
  isControlDisabled(id) { return id === 'run' && (this._going || this._tm >= 1); }

  getControlValue(id) {
    if (id === 'flow') return this._flow;
    if (id === 'bulb') return this._bulbY > SURF ? 'low' : this._bulbY < B_OK - 12 ? 'high' : 'ok';
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'flow') {
      this._flow = v === 'top' ? 'top' : 'bottom';
      this._live = 7;
      const back = this._flow === 'bottom' && this._sawBad && !this._found;
      if (this._flow === 'top') this._sawBad = true;
      if (back) { this._found = true; this.celebrate(340, 262, 18, { key: 'jacket-full' }); }
    } else if (id === 'bulb') {
      this._setBulb(v === 'low' ? B_LOW : v === 'high' ? B_HIGH : B_OK);
    } else if (id === 'run') { this._going = true; this._tm = 0; }
    else if (id === 'again') { this._tm = 0; this._going = false; this._shownT = T_ROOM; }
    this.animateFor(900);
    this.requestUiUpdate?.();
  }

  _setBulb(y) {
    this._bulbY = clamp(y, B_HIGH, B_LOW);
    this._live = Math.max(this._live, 4);
    if (this._bulbY < B_OK - 22) this._sawBad = true;
    if (this._sawBad && !this._found && Math.abs(this._bulbY - B_OK) < 6) {
      this._found = true;
      this.celebrate(340, 262, 18, { key: 'bulb-at-side-arm', small: true });
    }
  }

  /** What the thermometer reads with its bulb at this height, in the acetone and water flask. */
  _bulbT() {
    const y = this._bulbY;
    if (y > SURF) return 61;
    if (y >= B_OK) return 56;
    return 56 - ((B_OK - y) / (B_OK - B_HIGH)) * 16;
  }

  // Design space to the rig's own space, for the drag.
  _world(p) {
    const k = this._cam;
    return { x: (p.x - VIEW.x) / k.z + k.x, y: (p.y - VIEW.y) / k.z + k.y };
  }
  pointerDown(p) {
    if (this.stage !== S_BULB) return;
    const w = this._world(p);
    if (Math.abs(w.x - FL.x) < 24 && Math.abs(w.y - this._bulbY) < 22) { this._drag = true; this.animateFor(500); }
  }
  pointerMove(p) {
    if (!this._drag) return false;
    this._setBulb(this._world(p).y);
    this.animateFor(500);
    return true;
  }
  pointerUp() { this._drag = false; }

  update(d) {
    const T = this._target ?? CAMS[0];
    const k = Math.min(1, d * 5);
    for (const q of ['x', 'y', 'z']) {
      this._cam[q] += (T[q] - this._cam[q]) * k;
      if (Math.abs(T[q] - this._cam[q]) < 0.004) this._cam[q] = T[q];
    }
    const want = this._flow === 'bottom' ? 1 : 0;
    this._jacket += clamp(want - this._jacket, -d * 1.2, d * 1.2);
    if (this._live > 0) { this._live = Math.max(0, this._live - d); this._ph += d; }
    if (this._going) {
      this._ph += d;
      this._tm = Math.min(1, this._tm + d / RUN_S);
      if (this._tm >= 1) { this._going = false; this.requestUiUpdate?.(); }
    }
    if (this.stage === S_BULB) this._shownT = this._bulbT();
    if (this.stage >= S_RUN) {
      const bp = this.stage === S_SALT ? 100 : 56;
      this._shownT = T_ROOM + (bp - T_ROOM) * clamp(this._tm / 0.22, 0, 1);
    }
  }

  busy() {
    const T = this._target ?? CAMS[0], cam = this._cam;
    return this._going || this._live > 0 || this._drag || cam.x !== T.x || cam.y !== T.y || cam.z !== T.z
      || Math.abs((this._flow === 'bottom' ? 1 : 0) - this._jacket) > 0.001;
  }

  get _boiling() { return this._going || this._live > 0; }
  get _vapourOn() { return this.stage === S_WATER || this.stage === S_BULB || (this._going && this._tm > 0.2); }
  get _left() { return this.stage >= S_RUN ? 1 - clamp((this._tm - 0.2) / 0.8, 0, 1) : 1; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500);
    const k = this._cam;
    ctx.save();
    ctx.translate(VIEW.x, VIEW.y); ctx.scale(k.z, k.z); ctx.translate(-k.x, -k.y);
    drawBench(ctx, c, -500, 1200, BENCH_Y, { h: 60 });
    this._stands(ctx, c);
    this._hoses(ctx, c);
    this._condenser(ctx, c);
    this._flask(ctx, c);
    this._receiver(ctx, c);
    this._burner(ctx, c);
    ctx.restore();
    if (k.z === 1 && this.stage === S_ALL) this._labels(ctx, c);
    this._overlay(ctx, c);
  }

  _stands(ctx, c) {
    const col = mix(c.stroke, c.bgDeep, 0.15);
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(84, BENCH_Y - 6); ctx.lineTo(84, 120); ctx.stroke();
    drawShadow(ctx, c, 84, BENCH_Y + 3, 26);
    ctx.fillStyle = col; rr(ctx, 58, BENCH_Y - 9, 52, 9, 3); ctx.fill();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(84, 208); ctx.lineTo(FL.x - NECK_HW - 8, 208); ctx.stroke();
    ctx.fillStyle = c.accent; rr(ctx, FL.x - NECK_HW - 12, 200, 14, 16, 3); ctx.fill();
    // the tripod and the wire gauze
    ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(114, BENCH_Y - 2); ctx.lineTo(136, 354); ctx.moveTo(198, BENCH_Y - 2); ctx.lineTo(176, 354); ctx.stroke();
    ctx.fillStyle = mix(c.label, c.bgDeep, 0.5); rr(ctx, 106, 348, 100, 6, 2); ctx.fill();
  }

  _hoses(ctx, c) {
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.1); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(PORT_LO.ex, PORT_LO.ey); ctx.quadraticCurveTo(PORT_LO.ex + 5, 406, 500, 410); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PORT_UP.ex, PORT_UP.ey); ctx.quadraticCurveTo(PORT_UP.ex - 5, 224, 318, 222); ctx.stroke();
  }

  _condenser(ctx, c) {
    const C = COND;
    for (const p of [PORT_UP, PORT_LO]) { drawGlassPipe(ctx, c, p.x, p.y, p.ex, p.ey, 13); drawGlassPipeFront(ctx, c, p.x, p.y, p.ex, p.ey, 13, { ends: true }); }
    drawGlassPipe(ctx, c, C.x0, C.y0, C.x1, C.y1, C.jw);
    const len = Math.hypot(C.x1 - C.x0, C.y1 - C.y0);
    const f = this._jacket;
    ctx.save();
    ctx.translate(C.x0, C.y0);
    ctx.rotate(Math.atan2(C.y1 - C.y0, C.x1 - C.x0));
    // water: full at f = 1; at f = 0 a thin stream along the low side, with air above it
    const yTop = C.jw / 2 - 3 - (C.jw - 6) * Math.max(0.16, f);
    ctx.fillStyle = alpha(c.water, 0.72);
    ctx.fillRect(1, yTop, len - 2, C.jw / 2 - 3 - yTop);
    // the water's movement, up the jacket or down it
    ctx.strokeStyle = alpha(lighten(c.water, 0.6), 0.85); ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 20]);
    ctx.lineDashOffset = (this._flow === 'bottom' ? 1 : -1) * (this._ph * 70) % 32;
    const ys = f > 0.5 ? [-16, 16] : [C.jw / 2 - 7];
    for (const y of ys) { ctx.beginPath(); ctx.moveTo(4, y); ctx.lineTo(len - 4, y); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    // the inner tube, with vapour and condensed liquid in it
    ctx.fillStyle = alpha(c.bgDeep, 0.55);
    ctx.fillRect(0, -C.tw / 2, len, C.tw);
    if (this._vapourOn) {
      const reach = 0.42 + 0.58 * (1 - f);          // how far the vapour gets before it condenses
      for (let i = 0; i < 10; i += 1) {
        const u = (this._ph * 0.5 + i / 10) % 1;
        const x = u * len * reach;
        ctx.beginPath(); ctx.arc(x, 0, 3.6 * (1 - 0.5 * (u * f)), 0, Math.PI * 2);
        ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.92 - u * 0.5 * f); ctx.fill();
      }
      const liquid = f;                             // liquid running on down the tube
      if (liquid > 0.05) {
        for (let i = 0; i < 5; i += 1) {
          const u = (this._ph * 0.9 + i / 5) % 1;
          ctx.beginPath(); ctx.ellipse(len * (reach + (1 - reach) * u), C.tw / 2 - 3, 4, 2.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = alpha(c.accent, liquid); ctx.fill();
        }
      }
    }
    ctx.restore();
    drawGlassPipeFront(ctx, c, C.x0, C.y0, C.x1, C.y1, C.tw, { edge: 0.7 });
    drawGlassPipeFront(ctx, c, C.x0, C.y0, C.x1, C.y1, C.jw, { ends: true });
    drawGlassPipe(ctx, c, ADAPT.x0, ADAPT.y0, ADAPT.x1, ADAPT.y1, ADAPT.w);
    drawGlassPipeFront(ctx, c, ADAPT.x0, ADAPT.y0, ADAPT.x1, ADAPT.y1, ADAPT.w);
    // vapour that got through, into the air
    if (this._vapourOn && f < 0.5) {
      ctx.strokeStyle = alpha(lighten(c.glass, 0.4), 0.85); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i += 1) {
        const p = (this._ph * 0.5 + i / 4) % 1, x = ADAPT.x1 - 6 + p * 22, y = ADAPT.y1 - 6 - p * 36;
        ctx.globalAlpha = (1 - p) * (1 - f * 2);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 7, y - 7, x, y - 14); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  _flask(ctx, c) {
    const g = glassBox('round', FL.x - FL.r, NECK_TOP, FL.r * 2, FL.y + FL.r - NECK_TOP, { wall: 3, neck: NECK_HW / FL.r });
    drawGlass(ctx, c, g, { shadow: false });
    const salt = this.stage === S_SALT;
    const left = this._left;
    const surface = SURF + (g.floor - SURF - 14) * (1 - left) * (salt ? 0.72 : 0.5);
    const fill = salt ? mix(c.water, c.glass, 0.55) : mix(c.glass, c.gold, 0.2);
    drawGlassLiquid(ctx, c, g, { surface, fill, opacity: 0.62 });
    if (this._boiling) {
      for (let i = 0; i < 9; i += 1) {
        const u = (this._ph * 0.9 + i / 9) % 1;
        const a = (i * 2.4) % 6.28;
        const x = FL.x + Math.cos(a) * 26 * (i % 3 ? 1 : 0.5), y = g.floor - 4 - u * (g.floor - surface - 6);
        ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fillStyle = alpha(lighten(c.glass, 0.7), 0.8); ctx.fill();
      }
    }
    if (salt && left < 0.7) {
      const r = mulberry32(4);
      const n = Math.round((0.7 - left) * 60);
      for (let i = 0; i < n; i += 1) {
        const w = 28;
        rr(ctx, FL.x - w + r() * w * 2 - 4, g.floor - 9 - r() * 7, 7, 7, 1.5);
        ctx.fillStyle = lighten(c.glass, 0.75); ctx.fill();
        ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 1; ctx.stroke();
      }
    }
    // the vapour, rising and turning into the side arm
    if (this._vapourOn) {
      for (let i = 0; i < 10; i += 1) {
        const p = (this._ph * 0.55 + i / 10) % 1;
        const up = Math.min(1, p / 0.72);
        let x = FL.x + Math.sin(i * 2.3) * (9 - up * 4);
        let y = surface - up * (surface - ARM.y0);
        if (p > 0.72) {
          const q = (p - 0.72) / 0.28;
          x += (ARM.x1 - x) * q * 0.9; y += (ARM.y1 - ARM.y0) * q * 0.9;
        }
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.9); ctx.fill();
      }
    }
    drawGlassPipe(ctx, c, ARM.x0, ARM.y0, ARM.x1, ARM.y1, ARM.w);
    drawGlassPipeFront(ctx, c, ARM.x0, ARM.y0, ARM.x1, ARM.y1, ARM.w);
    // the thermometer through the stopper
    ctx.fillStyle = darken(c.stroke, 0.3); rr(ctx, FL.x - NECK_HW - 3, NECK_TOP - 4, NECK_HW * 2 + 6, 14, 3); ctx.fill();
    const by = this._bulbY;
    ctx.strokeStyle = mix(c.glass, c.bgSurface, 0.3); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(FL.x, TUBE_TOP); ctx.lineTo(FL.x, by - 6); ctx.stroke();
    ctx.strokeStyle = c.bad; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(FL.x, by - 40); ctx.lineTo(FL.x, by - 6); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(FL.x, by, 5.5, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.bad; ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.5; ctx.stroke();
    if (this.stage === S_BULB) {
      ctx.strokeStyle = alpha(c.accent, 0.7); ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(FL.x - NECK_HW - 6, ARM.y0); ctx.lineTo(FL.x + 46, ARM.y0); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _receiver(ctx, c) {
    const g = glassBox('flask', REC.cx - REC.hw, REC.top, REC.hw * 2, REC.base - REC.top, { wall: 3, r: 8, neck: 0.36 });
    drawGlass(ctx, c, g);
    const had = 1 - this._left;
    if (had > 0.01) drawGlassLiquid(ctx, c, g, { level: 0.06 + had * 0.46, fill: this.stage === S_SALT ? mix(c.water, c.glass, 0.75) : mix(c.gold, c.glass, 0.7), opacity: 0.45 });
    if (this._going && this._tm > 0.2) {
      for (let i = 0; i < 2; i += 1) {
        const u = (this._ph * 1.4 + i / 2) % 1;
        ctx.fillStyle = c.accent;
        ctx.beginPath(); ctx.ellipse(REC.cx - 8, REC.top + 4 + u * 48, 2.6, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _burner(ctx, c) {
    const x = FL.x, col = mix(c.stroke, c.bgDeep, 0.15);
    ctx.fillStyle = col; rr(ctx, x - 15, 392, 30, 34, 4); ctx.fill();
    rr(ctx, x - 24, 424, 48, 10, 3); ctx.fill();
    if (this.stage !== S_ALL && (this._boiling || this.stage < S_RUN)) {
      const f = 30 + 3 * Math.sin(this._ph * 11);
      ctx.fillStyle = alpha(c.flame, 0.92);
      ctx.beginPath(); ctx.moveTo(x - 10, 392); ctx.quadraticCurveTo(x - 15, 392 - f * 0.6, x, 392 - f); ctx.quadraticCurveTo(x + 15, 392 - f * 0.6, x + 10, 392); ctx.closePath(); ctx.fill();
    }
  }

  /** The book's part names, on the whole set-up. */
  _labels(ctx, c) {
    const L = [
      ['Thermometer', 232, 92, FL.x + 4, 110],
      ['Distillation flask', 76, 158, FL.x - 40, 248],
      ['Water condenser', 434, 240, 402, 306],
      ['Water outlet', 340, 178, PORT_UP.ex + 6, PORT_UP.ey - 2],
      ['Water inlet', 404, 412, PORT_LO.ex, PORT_LO.ey + 2],
      ['Conical flask', 590, 300, REC.cx + 4, REC.top + 8],
      ['Wire gauze', 268, 346, 206, 351],
      ['Tripod stand', 272, 376, 190, 400],
      ['Burner', 248, 412, 172, 416],
    ];
    if (PHONE) {
      chipRow(ctx, c, [{ text: 'Boil', bg: c.flame }, { text: 'Measure', bg: c.bad }, { text: 'Cool', bg: c.accent }, { text: 'Collect', bg: c.good }], 340, 40, { size: fs(20), align: 'center' });
      return;
    }
    for (const [s, x, y, tx, ty] of L) {
      leader(ctx, x, y, tx, ty, alpha(c.label, 0.4));
      pill(ctx, c, s, x, y, { bg: c.raised, ink: c.label, size: 15 });
    }
    chipRow(ctx, c, [{ text: 'Boil', bg: c.flame }, { text: 'Measure', bg: c.bad }, { text: 'Cool', bg: c.accent }, { text: 'Collect', bg: c.good }], 500, 40, { size: 17, align: 'center', display: true });
  }

  _overlay(ctx, c) {
    const s = this.stage;
    if (s === S_WATER) {
      const ok = this._flow === 'bottom';
      pill(ctx, c, ok ? 'jacket full' : 'mostly air', 200, 52, { bg: ok ? c.good : c.warning, size: fs(22), display: true });
      pill(ctx, c, ok ? 'vapour turns to liquid' : 'some vapour gets through', 470, 52, { bg: c.raised, ink: c.label, size: fs(18), display: true });
      const inX = ok ? 590 : 262, inY = ok ? 430 : 118;
      pill(ctx, c, 'cold water in', inX, inY, { bg: c.accent, size: fs(17), display: true });
      return;
    }
    if (s === S_BULB) {
      const x = 468, y = 54, w = 196, h = 150;
      drawCard(ctx, c, x, y, w, h, 1, {});
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = font(c, 700, fs(16)); ctx.fillStyle = c.labelMuted;
      ctx.fillText('reading', x + 18, y + 14);
      ctx.font = font(c, 700, fs(46), true); ctx.fillStyle = c.label;
      ctx.fillText(`${Math.round(this._bulbT())} ${DEG}C`, x + 18, y + 38);
      const y2 = this._bulbY;
      const msg = y2 > SURF ? 'in the liquid' : y2 < B_OK - 12 ? 'too low' : 'vapour leaving';
      pill(ctx, c, msg, x + w / 2, y + h - 30, { bg: y2 > SURF || y2 < B_OK - 12 ? c.warning : c.good, size: fs(15), display: true });
      if (!this._sawBad) chipRow(ctx, c, [{ text: 'drag the bulb up', bg: c.warning }], 566, 240, { size: fs(16), align: 'center' });
      return;
    }
    if (s >= S_RUN) {
      const x = 372, y = 44, w = 286, h = 110;
      drawCard(ctx, c, x, y, w, h, 1, {});
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = font(c, 700, fs(16)); ctx.fillStyle = c.labelMuted;
      ctx.fillText(s === S_SALT ? 'salt water' : 'acetone and water', x + 18, y + 12);
      ctx.font = font(c, 700, fs(46), true); ctx.fillStyle = c.label;
      ctx.fillText(`${Math.round(this._shownT)} ${DEG}C`, x + 18, y + 36);
      if (this._tm >= 1) {
        pill(ctx, c, s === S_SALT ? 'pure water' : 'acetone', 582, 208, { bg: c.good, size: fs(18), display: true });
        pill(ctx, c, s === S_SALT ? 'salt stays' : 'water stays', 276, 340, { bg: c.raised, ink: c.label, size: fs(18), display: true });
      }
    }
  }
}
