// InkDropScene - blk-l05-s01, three beats. A sheet of paper on the bench, seen from above, with a thick
// black sketch-pen line across it. One drop of water lands on the line and the wet patch spreads. Inside
// the patch the black goes; at its edge three rings of colour open, each at its own distance from the
// centre: yellow furthest, then pink, then blue (the same three dyes as the strip in the rest of L05).
//   b0  the line and the full dropper. The learner presses the dropper.
//   b1  the patch spreads (released for a learner who has not pressed). Tap a ring or press the button to name the colours: the find.
//   b2  the same water on a clean corner of the paper: a wet patch and no colour. The colours came from the ink.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, darken, drawBackdrop, drawShadow, leader, lighten, luma, mix, mulberry32, pill, rr, outBack } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, u) => a + (b - a) * u;

const SHEET = { x: 34, y: 66, w: 612, h: 392, rot: -0.012 };
const LINE = { x0: 64, x1: 478, y: 262, hh: 19 };     // the pen line on the sheet
const SPOT = { x: 268, y: 262, rx: 150, ry: 124 };    // where the drop lands, the patch's full size
const CLEAN = { x: 550, y: 180, rx: 66, ry: 58 };     // the clean corner
const FALL_S = 0.5;
const SPREAD_S = 4.2;
const RINGS = [
  { key: 's2', name: 'yellow', f: 1 },
  { key: 's4', name: 'pink', f: 0.8 },
  { key: 's1', name: 'blue', f: 0.6 },
];
const S_LINE = 0, S_SPREAD = 1, S_CLEAN = 2;
const MAP = [[{ idx: S_LINE, dwellMs: null }], [{ idx: S_SPREAD, dwellMs: null }], [{ idx: S_CLEAN, dwellMs: null }]];

const isLight = (c) => luma(c.bgDeep) > 0.5;
const paperCol = (c) => (isLight(c) ? lighten(c.bgSurface, 0.3) : mix(c.label, c.bgSurface, 0.1));
const inkCol = (c) => (isLight(c) ? darken(c.label, 0.2) : c.bgDeep);

// The edge of a wet patch: never a circle, fine fingers on a slow wobble.
function patchPath(ctx, cx, cy, rx, ry, ph, f) {
  ctx.beginPath();
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const w = 1 + 0.05 * Math.sin(a * 3 + ph) + 0.035 * Math.sin(a * 7 + ph * 2.1) + 0.016 * Math.sin(a * 17 + ph * 3.3) + 0.009 * Math.sin(a * 31 + ph);
    const x = cx + Math.cos(a) * rx * f * w, y = cy + Math.sin(a) * ry * f * w;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// One ring of colour: strong at its outer edge, fading inward, so a dye reads as a band with a feathered back.
function ring(ctx, cx, cy, rx, ry, ph, f, col, a) {
  const R = rx * f * 1.1;
  if (R < 2) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
  g.addColorStop(0, alpha(col, 0));
  g.addColorStop(0.62, alpha(col, 0.5 * a));
  g.addColorStop(0.86, alpha(col, 0.95 * a));
  g.addColorStop(1, alpha(darken(col, 0.08), a));
  ctx.fillStyle = g;
  ctx.restore();
  ctx.save();
  patchPath(ctx, cx, cy, rx, ry, ph, f);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = g;
  ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
  ctx.restore();
}

export class InkDropScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A black pen line on a sheet of paper. A drop of water falls on it and the wet patch spreads. At the edge of the patch rings of yellow, pink and blue appear. The same water on clean paper shows no colour.';
  static CONTROLS = [
    { type: 'button', id: 'drop', label: 'Drop water on the line' },
    { type: 'button', id: 'name', label: 'Name the colours' },
    { type: 'button', id: 'clean', label: 'Drop water on clean paper' },
    { type: 'button', id: 'again', label: 'Fresh paper' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
    this._hairs = null;
  }

  _fresh() {
    this._fall = null;       // { t, x, y, onLand } while a drop is in the air
    this._press = 0;
    this._wet = 0;           // the patch on the line, 0..1
    this._dropped = false;
    this._named = 0;         // seconds since the colours were named, 0 = not yet
    this._cleanWet = 0;
    this._cleanDropped = false;
    this._cleanDone = 0;
    this._tipX = SPOT.x;     // the dropper's tip, eased
    this._tipGoal = SPOT.x;
    this._dropY = 0;         // 0 = down over the paper, 1 = lifted out of the way
    this._dropGoal = 0;
  }

  setup() {
    const r = mulberry32(5);
    this._hairs = Array.from({ length: 34 }, () => ({ x: r(), y: r(), l: 10 + r() * 34, a: r() }));
    return super.setup();
  }

  enter(stage) {
    if (stage === S_LINE) { this._fresh(); return; }
    if (stage === S_SPREAD && !this._dropped) { this.after(0.5, () => { if (!this._dropped) this._release(); }); return; }
    if (stage === S_CLEAN) {
      if (!this._dropped) { this._dropped = true; this._wet = 1; }      // a resumed lesson: the patch is already there
      this._wet = Math.max(this._wet, 1);
      this._fall = null;
      if (!this._named) this._named = 1;
      this._tipX = CLEAN.x; this._tipGoal = CLEAN.x;
      this._dropGoal = 0;
      if (!this._cleanDropped) this._dropY = 0;
    }
  }

  _release() {
    if (this._dropped) return;
    this._dropped = true;
    this._press = 0.3;
    if (reducedMotion()) { this._wet = 1; this._dropGoal = 1; this._dropY = 1; return; }
    this._fall = { t: 0, x: SPOT.x, y: 178, y1: SPOT.y, clean: false };
  }

  _releaseClean() {
    if (this._cleanDropped) return;
    this._cleanDropped = true;
    this._press = 0.3;
    if (reducedMotion()) { this._cleanWet = 1; this._cleanFound(); this._dropGoal = 1; this._dropY = 1; return; }
    this._fall = { t: 0, x: CLEAN.x, y: CLEAN.y - 58, y1: CLEAN.y, clean: true };
    this.after(FALL_S + 2.2, () => this._cleanFound());
  }

  _cleanFound() {
    if (this._cleanDone) return;
    this._cleanDone = 0.01;
    this.celebrate(CLEAN.x, CLEAN.y, 12, { key: 'clean-paper', lookAt: true });
    this.requestUiUpdate?.();
  }

  _name() {
    if (this._named || this._wet < 0.75) return;
    this._named = 0.01;
    this.celebrate(SPOT.x + SPOT.rx * 0.8, SPOT.y - SPOT.ry * 0.55, 24, { key: 'colours', lookAt: true });
    this.requestUiUpdate?.();
  }

  update(d) {
    this._press = Math.max(0, this._press - d);
    if (this._named) this._named = Math.min(1, this._named + d);
    if (this._cleanDone) this._cleanDone = Math.min(1, this._cleanDone + d);
    this._tipX += (this._tipGoal - this._tipX) * Math.min(1, d * 7);
    this._dropY += (this._dropGoal - this._dropY) * Math.min(1, d * 5);
    const f = this._fall;
    if (f) {
      f.t += d;
      if (f.t >= FALL_S) { this._fall = null; this._dropGoal = 1; if (f.clean) this._cleanWet = 0.02; else this._wet = 0.02; }
    }
    if (this._wet > 0 && this._wet < 1) this._wet = Math.min(1, this._wet + d / SPREAD_S);
    if (this._cleanWet > 0 && this._cleanWet < 1) this._cleanWet = Math.min(1, this._cleanWet + d / 2);
  }

  busy() {
    return !!this._fall || (this._wet > 0 && this._wet < 1) || (this._cleanWet > 0 && this._cleanWet < 1)
      || Math.abs(this._dropGoal - this._dropY) > 0.01 || Math.abs(this._tipGoal - this._tipX) > 0.5
      || (this._named > 0 && this._named < 0.6) || (this._cleanDone > 0 && this._cleanDone < 0.6);
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this._bench(ctx, c);
    ctx.save();
    ctx.translate(SHEET.x + SHEET.w / 2, SHEET.y + SHEET.h / 2);
    ctx.rotate(SHEET.rot);
    ctx.translate(-(SHEET.x + SHEET.w / 2), -(SHEET.y + SHEET.h / 2));
    this._sheet(ctx, c);
    this._line(ctx, c);
    this._patch(ctx, c);
    this._cleanPatch(ctx, c);
    ctx.restore();
    this._pen(ctx, c);
    this._dropper(ctx, c);
    this._falling(ctx, c);
    this._chips(ctx, c);
  }

  // The bench top from above: planks under a soft light from the top left.
  _bench(ctx, c) {
    const light = isLight(c);
    const wood = mix(darken(c.gold, 0.32), c.bgDeep, light ? 0.1 : 0.5);
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, 680, 520);
    ctx.fillStyle = alpha(darken(wood, 0.4), 0.55);
    for (let y = 64; y < 520; y += 118) ctx.fillRect(0, y, 680, 3);
    ctx.fillStyle = alpha(lighten(wood, 0.3), 0.2);
    for (let y = 67; y < 520; y += 118) ctx.fillRect(0, y, 680, 2);
    const g = ctx.createRadialGradient(170, 90, 40, 300, 240, 560);
    g.addColorStop(0, alpha(lighten(c.warning, 0.5), light ? 0.22 : 0.18));
    g.addColorStop(1, alpha(c.bgDeep, light ? 0.1 : 0.45));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 680, 520);
  }

  _sheet(ctx, c) {
    const { x, y, w, h } = SHEET;
    const paper = paperCol(c);
    ctx.save();
    ctx.shadowColor = alpha(darken(c.bgDeep, 0.6), 0.45);
    ctx.shadowBlur = 16; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 8;
    ctx.fillStyle = paper;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = alpha(darken(paper, 0.25), 0.8); ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = alpha(darken(paper, 0.3), 0.22); ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const p of this._hairs ?? []) {
      const hx = x + 14 + p.x * (w - 60), hy = y + 12 + p.y * (h - 24);
      ctx.moveTo(hx, hy); ctx.lineTo(hx + p.l, hy + (p.a - 0.5) * 4);
    }
    ctx.stroke();
  }

  _line(ctx, c) {
    const ink = inkCol(c);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = LINE.hh * 1.3;
    ctx.beginPath(); ctx.moveTo(LINE.x0, LINE.y - 6); ctx.bezierCurveTo(200, LINE.y - 12, 320, LINE.y + 2, LINE.x1, LINE.y - 8); ctx.stroke();
    ctx.lineWidth = LINE.hh * 1.1;
    ctx.beginPath(); ctx.moveTo(LINE.x1 - 4, LINE.y + 9); ctx.bezierCurveTo(330, LINE.y + 16, 210, LINE.y + 4, LINE.x0 + 6, LINE.y + 11); ctx.stroke();
  }

  // Inside the patch the paper is wet and the black has gone; the rings stand at their own distances.
  _patch(ctx, c) {
    const u = this._wet;
    if (u <= 0) return;
    const e = 1 - (1 - u) ** 2.2;
    const rx = SPOT.rx * e, ry = SPOT.ry * e;
    const paper = paperCol(c);
    const wet = mix(paper, c.water, 0.1);
    patchPath(ctx, SPOT.x, SPOT.y, rx, ry, 1.3, 1.02);
    ctx.fillStyle = alpha(darken(wet, 0.06), 1);
    ctx.fill();
    patchPath(ctx, SPOT.x, SPOT.y, rx, ry, 1.3, 0.97);
    ctx.fillStyle = wet;
    ctx.fill();
    // the colours only pull apart as the patch grows
    const apart = clamp01((u - 0.12) / 0.6);
    RINGS.forEach((r) => {
      const f = lerp(0.96, r.f, apart);
      ring(ctx, SPOT.x, SPOT.y, rx, ry, 1.3 + r.f, f * 0.96, c[r.key], clamp01(u * 3));
    });
    // a grey-blue ghost of the line stays at the centre: the ink has moved, it was not wiped away
    const ghost = 0.5 * (1 - apart * 0.6);
    ctx.save();
    patchPath(ctx, SPOT.x, SPOT.y, rx, ry, 1.3, 0.42);
    ctx.clip();
    const gh = ctx.createLinearGradient(0, LINE.y - LINE.hh * 2, 0, LINE.y + LINE.hh * 2);
    const gc = mix(inkCol(c), c.s1, 0.35);
    gh.addColorStop(0, alpha(gc, 0));
    gh.addColorStop(0.5, alpha(gc, ghost));
    gh.addColorStop(1, alpha(gc, 0));
    ctx.fillStyle = gh;
    ctx.fillRect(SPOT.x - rx, LINE.y - LINE.hh * 2, rx * 2, LINE.hh * 4);
    ctx.restore();
    if (u < 1) {
      // the wet shine right after landing
      const a = clamp01(1 - u * 4);
      ctx.fillStyle = alpha(lighten(c.water, 0.5), 0.55 * a);
      ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y, rx * 0.55, ry * 0.5, 0, 0, TAU); ctx.fill();
    }
  }

  _cleanPatch(ctx, c) {
    const u = this._cleanWet;
    if (u <= 0) return;
    const e = 1 - (1 - u) ** 2.2;
    const wet = mix(paperCol(c), c.water, 0.14);
    patchPath(ctx, CLEAN.x, CLEAN.y, CLEAN.rx * e, CLEAN.ry * e, 4.1, 1.02);
    ctx.fillStyle = darken(wet, 0.05);
    ctx.fill();
    patchPath(ctx, CLEAN.x, CLEAN.y, CLEAN.rx * e, CLEAN.ry * e, 4.1, 0.96);
    ctx.fillStyle = wet;
    ctx.fill();
  }

  // The sketch pen, lying where it was put down: a plain black barrel and cap, drawn big.
  _pen(ctx, c) {
    const light = isLight(c);
    const body = light ? darken(c.label, 0.1) : mix(c.bgDeep, c.label, 0.14);
    ctx.save();
    ctx.translate(556, 394);
    ctx.rotate(-0.42);
    drawShadow(ctx, c, -4, 17, 92, 6, 0.6);
    const r = 9 * lookOf().radius;
    rr(ctx, -74, -13, 104, 26, r); ctx.fillStyle = body; ctx.fill();
    rr(ctx, 26, -14, 52, 28, r); ctx.fillStyle = lighten(body, 0.1); ctx.fill();
    ctx.fillStyle = alpha(lighten(body, 0.5), 0.55 * lookOf().gloss);
    ctx.fillRect(-66, -8, 136, 3.5);
    ctx.beginPath(); ctx.moveTo(-74, -9); ctx.lineTo(-92, -3); ctx.lineTo(-92, 3); ctx.lineTo(-74, 9); ctx.closePath();
    ctx.fillStyle = lighten(body, 0.2); ctx.fill();
    ctx.fillStyle = body;
    ctx.fillRect(-100, -3, 9, 6);
    ctx.restore();
  }

  _dropper(ctx, c) {
    const lift = this._dropY;
    const rest = this._tipGoal === CLEAN.x ? CLEAN.y - 60 : 176;
    const tip = rest - lift * 330;                   // lifted right out of the frame once it has done its work
    if (tip < -8) return;
    const x = this._tipX;
    const sq = this._press > 0 ? 0.82 : 1;
    const g = glassBox('dropper', x - 13, tip - 96, 26, 100, { wall: 2.5, cone: 0.7, stem: 0.26 });
    drawGlass(ctx, c, g, { shadow: false });
    const full = (!this._dropped || (this._tipGoal === CLEAN.x && !this._cleanDropped)) ? 0.62 : 0.4;
    drawGlassLiquid(ctx, c, g, { level: full, fill: c.water, opacity: 0.6 });
    drawGlassFront(ctx, c, g);
    const bulb = darken(c.bad, 0.15);
    ctx.save();
    ctx.translate(x, tip - 100);
    ctx.scale(1 / sq, sq);
    rr(ctx, -15, -34, 30, 38, 13 * lookOf().radius); ctx.fillStyle = bulb; ctx.fill();
    ctx.fillStyle = alpha(lighten(bulb, 0.5), 0.5 * lookOf().gloss);
    ctx.fillRect(-8, -28, 5, 20);
    ctx.restore();
  }

  _falling(ctx, c) {
    const f = this._fall;
    if (!f) return;
    const u = clamp01(f.t / FALL_S);
    const y = lerp(f.y, f.y1, u * u);
    ctx.fillStyle = c.water;
    ctx.beginPath();
    ctx.moveTo(f.x, y - 15);
    ctx.bezierCurveTo(f.x + 11, y - 2, f.x + 9, y + 9, f.x, y + 9);
    ctx.bezierCurveTo(f.x - 9, y + 9, f.x - 11, y - 2, f.x, y - 15);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.water, 0.6), 0.7);
    ctx.beginPath(); ctx.arc(f.x - 3, y + 1, 2.6, 0, TAU); ctx.fill();
  }

  _chips(ctx, c) {
    const pop = (s) => (reducedMotion() ? 1 : outBack(Math.min(1, s / 0.3)));
    if (this.stage === S_LINE && !this._dropped) {
      pill(ctx, c, 'one black line', LINE.x0 + 80, 214, { bg: c.raised, size: fs(20), display: true });
    }
    if (this._named) {
      const s = pop(this._named);
      const y = 430;
      const pts = [[SPOT.x - SPOT.rx * 0.62, SPOT.y + SPOT.ry * 0.72], [SPOT.x, SPOT.y + SPOT.ry * 0.8 * 0.94], [SPOT.x + SPOT.rx * 0.34, SPOT.y + SPOT.ry * 0.46]];
      const xs = [SPOT.x - 120, SPOT.x, SPOT.x + 120];
      RINGS.forEach((r, i) => {
        leader(ctx, xs[i], y - 16, pts[i][0], pts[i][1], darken(c[r.key], 0.25), s);
        pill(ctx, c, r.name, xs[i], y, { bg: c[r.key], size: fs(22), display: true, scale: s });
      });
    }
    if (this._cleanDone) {
      pill(ctx, c, 'no colour', CLEAN.x, CLEAN.y + CLEAN.ry + 26, { bg: c.raised, size: fs(20), display: true, scale: pop(this._cleanDone) });
    }
    const hint = this._hint();
    if (hint) {
      const a = 0.82 + 0.18 * Math.sin(this.clock * 3);
      pill(ctx, c, hint, 500, 34, { bg: c.accent, size: fs(19), display: true, alpha: reducedMotion() ? 1 : a });
    }
  }

  _hint() {
    if (this.stage === S_LINE && !this._dropped) return 'press the dropper';
    if (this.stage === S_SPREAD && this._wet >= 0.75 && !this._named) return 'tap a colour at the edge';
    if (this.stage === S_CLEAN && !this._cleanDropped) return 'now try clean paper';
    return '';
  }

  pointerDown(p) {
    if (this.stage === S_LINE && !this._dropped) {
      if (p.y < 200 || Math.hypot(p.x - SPOT.x, p.y - SPOT.y) < 120) this._release();
      return;
    }
    if (this.stage === S_SPREAD) {
      const rn = Math.hypot((p.x - SPOT.x) / SPOT.rx, (p.y - SPOT.y) / SPOT.ry);
      if (rn > 0.45 && rn < 1.12) this._name();
      return;
    }
    if (this.stage === S_CLEAN && Math.hypot(p.x - CLEAN.x, p.y - CLEAN.y) < 90) this._releaseClean();
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'drop') this._release();
    else if (id === 'name') this._name();
    else if (id === 'clean') this._releaseClean();
    else if (id === 'again') { this._fresh(); if (this.stage === S_CLEAN) { this._wet = 1; this._dropped = true; this._named = 1; this._tipX = CLEAN.x; this._tipGoal = CLEAN.x; } else if (this.stage === S_SPREAD) { this._tipX = SPOT.x; } }
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    if (id === 'drop') return this.stage === S_CLEAN;
    if (id === 'name') return this.stage !== S_SPREAD;
    if (id === 'clean') return this.stage !== S_CLEAN;
    return false;
  }

  isControlDisabled(id) {
    if (id === 'drop') return this._dropped;
    if (id === 'name') return !!this._named || this._wet < 0.75;
    if (id === 'clean') return this._cleanDropped;
    if (id === 'again') return !this._dropped;
    return false;
  }
}
