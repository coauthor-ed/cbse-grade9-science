// PigmentRaceScene - why the three colours part, and what the finished strip can tell you.
// Same jar, strip and dyes as ChromatographyScene (StripKit). The scene tells its two mounts apart by beat count.
//   s04 (4 beats): b0 run: same start, three distances | b1 pick the dye the paper holds hardest, then two meters per dye
//                  b2 chroma + graphein | b3 the word
//   s08 (3 beats): b0 count the spots, at least 3 dyes, two dyes can share a spot | b1 a tiny amount beside a dish and a flask
//                  b2 oil on water, the next lesson
// Distances are the dyes' rf x 10 cm, so the card and the strip cannot disagree.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, darken, drawBackdrop, drawBench, drawCard, drawMeter, drawShadow, font, leader, lighten, mix, outBack, pill } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassBand, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';
import { DYES, colourSpot, gasJarBack, gasJarFront, isLight, paperStrip } from './StripKit.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const PX = 21;
const BENCH_Y = 442;
const JAR = { x: 92, y: 62, w: 250, h: BENCH_Y - 60 };
const CX = JAR.x + JAR.w / 2;
const FLOOR = JAR.y + JAR.h - 7;
const SB = { x: CX - 1.5 * PX, y: 92, w: 3 * PX, h: FLOOR - 4 - 92 };
const FOOT = SB.y + SB.h;
const LINE_Y = FOOT - 2 * PX;
const SURFACE = FOOT - PX;
const CLIMB_CM = 10;                       // the water ends 10 cm above the line
const RUN_S = 8;
const HOLD = { yellow: 0.18, pink: 0.5, blue: 0.82 };   // how hard the paper holds each dye, schematic
const PANEL = { x: 382, w: 280 };
const MAP4 = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const MAP3 = [4, 5, 6].map((i) => [{ idx: i, dwellMs: null }]);
const S_RUN = 0, S_WHY = 1, S_PIECES = 2, S_WORD = 3, S_COUNT = 4, S_TINY = 5, S_NEXT = 6;
const spotY = (d, u) => LINE_Y - d.rf * CLIMB_CM * PX * u;

export class PigmentRaceScene extends SimScene {
  static BEAT_MAPS = { 4: MAP4, 3: MAP3 };
  static BEAT_STEP_MAP = MAP4;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A paper strip in a jar. Yellow, pink and blue start on one pencil line. Yellow travels furthest and blue the least, because each dye dissolves and sticks to the paper to a different degree.';
  static CONTROLS = [
    { type: 'button', id: 'run', label: 'Run the strip' },
    { type: 'segmented', id: 'pick', label: 'Held hardest', value: '', options: [{ value: 'yellow', label: 'Yellow' }, { value: 'pink', label: 'Pink' }, { value: 'blue', label: 'Blue' }] },
    { type: 'button', id: 'count', label: 'Count the next spot' },
  ];

  constructor(container, config) {
    super(container, config);
    this._u = 0;             // the water's climb, 0..1
    this._going = false;
    this._ran = 0;
    this._pick = '';
    this._right = 0;         // seconds since the right pick
    this._wrong = '';
    this._counted = 0;
    this._countAge = 0;
    this._pop = 0;
  }

  enter(stage) {
    this._pop = 0;
    this._going = false;
    this._pick = ''; this._right = 0; this._wrong = '';
    this._counted = 0; this._countAge = 0;
    this._u = stage === S_RUN ? 0 : 1;
    this._ran = 0;
  }

  _go() {
    if (this._going) return;
    this._u = 0;
    if (reducedMotion()) { this._u = 1; this._ran += 1; return; }
    this._going = true;
  }

  update(d) {
    this._pop = Math.min(2, this._pop + d);
    if (this._right) this._right = Math.min(2, this._right + d);
    if (this._counted) this._countAge = Math.min(3, this._countAge + d);
    if (this._going) {
      this._u = Math.min(1, this._u + d / RUN_S);
      if (this._u >= 1) { this._going = false; this._ran += 1; }
    }
  }

  busy() { return this._going || this._pop < 0.9 || (this._right > 0 && this._right < 0.6) || (this._counted > 0 && this._countAge < 0.9); }

  _spring(age) { return reducedMotion() ? 1 : outBack(clamp01(age / 0.4)); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 110 });
    if (this.stage === S_TINY) { this._tiny(ctx, c); return; }
    if (this.stage === S_NEXT) { this._next(ctx, c); return; }
    if (this.stage === S_COUNT) { this._drystrip(ctx, c); this._count(ctx, c); return; }
    this._jar(ctx, c);
    if (this.stage === S_RUN) this._distances(ctx, c);
    else if (this.stage === S_WHY) this._why(ctx, c);
    else if (this.stage === S_PIECES) this._pieces(ctx, c);
    else this._word(ctx, c);
  }

  _jar(ctx, c) {
    const g = gasJarBack(ctx, c, JAR, { surface: SURFACE });
    ctx.strokeStyle = darken(c.glass, 0.25); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(JAR.x + 26, SB.y - 2); ctx.lineTo(JAR.x + JAR.w - 26, SB.y - 2); ctx.stroke();
    const front = LINE_Y - (CLIMB_CM * PX + 6) * this._u;
    paperStrip(ctx, c, SB, { lineY: LINE_Y, frontY: this._u > 0 ? front : SURFACE });
    this._spots(ctx, c, CX, this._u);
    ctx.fillStyle = alpha(c.water, 0.2);
    ctx.fillRect(SB.x, SURFACE, SB.w, FOOT - SURFACE);
    gasJarFront(ctx, c, g);
  }

  _spots(ctx, c, x, u) {
    if (u <= 0.015) {
      colourSpot(ctx, x, LINE_Y, 12, 12, this._black(c), 1);
      return;
    }
    const open = clamp01(u / 0.14);
    colourSpot(ctx, x, LINE_Y - 8 * u, 12, 12, this._black(c), 1 - open);
    for (const d of DYES) colourSpot(ctx, x, spotY(d, u), 19, 13, darken(c[d.key], 0.04), open);
  }

  _black(c) { return isLight(c) ? darken(c.label, 0.2) : c.bgDeep; }

  // How far each dye has gone, as three bars from one start line: the same start is the point of the picture.
  _distances(ctx, c) {
    const { x, w } = PANEL, y0 = 92;
    drawCard(ctx, c, x, y0, w, 244, 1, { accent: c.accent });
    ctx.textBaseline = 'alphabetic';
    const shown = this._going ? Math.floor(this._u * 8) / 8 : this._u;
    DYES.forEach((d, i) => {
      const yy = y0 + 58 + i * 70;
      ctx.textAlign = 'left'; ctx.font = font(c, 700, fs(19), true); ctx.fillStyle = c.label;
      ctx.fillText(d.name, x + 18, yy - 12);
      ctx.textAlign = 'right'; ctx.font = font(c, 700, 26, true);
      const cm = d.rf * CLIMB_CM * shown;
      ctx.fillText(`${cm.toFixed(1)} cm`, x + w - 18, yy - 10);
      ctx.textAlign = 'left';
      drawMeter(ctx, c, x + 18, yy, w - 36, 16, d.rf * this._u, { col: c[d.key] });
    });
    const y = 380;
    if (this._u >= 1) pill(ctx, c, this._ran > 1 ? 'same order again' : 'same start, three distances', x + w / 2, y, { bg: c.good, size: fs(20), display: true });
    else if (!this._going) pill(ctx, c, 'press Run', x + w / 2, y, { bg: c.accent, size: fs(20), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
  }

  _why(ctx, c) {
    const { x, w } = PANEL;
    if (!this._right) {
      drawCard(ctx, c, x, 110, w, 130, 1, { accent: c.accent });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(24), true);
      ctx.fillText('Which dye does', x + w / 2, 152);
      ctx.fillText('the paper hold', x + w / 2, 182);
      ctx.fillText('hardest?', x + w / 2, 212);
      ctx.textAlign = 'left';
      if (this._wrong) pill(ctx, c, `${this._wrong} moved further`, x + w / 2, 276, { bg: c.warning, size: fs(20), display: true });
      return;
    }
    const s = this._spring(this._right);
    drawCard(ctx, c, x, 76, w, 342 * s, 1, { accent: c.good });
    if (s < 0.9) return;
    ctx.textBaseline = 'alphabetic';
    pill(ctx, c, 'dissolves in water', x + w / 2, 104, { bg: c.water, size: fs(17), display: true });
    pill(ctx, c, 'sticks to paper', x + w / 2, 258, { bg: c.gold, size: fs(17), display: true });
    DYES.forEach((d, i) => {
      const y1 = 132 + i * 38, y2 = 286 + i * 38;
      for (const [yy, v] of [[y1, 1 - HOLD[d.name]], [y2, HOLD[d.name]]]) {
        ctx.font = font(c, 700, fs(17)); ctx.fillStyle = c.label; ctx.textBaseline = 'middle';
        ctx.fillText(d.name, x + 16, yy + 8);
        drawMeter(ctx, c, x + 88, yy, w - 106, 16, v, { col: c[d.key] });
      }
    });
    ctx.textBaseline = 'alphabetic';
  }

  _bigCard(ctx, c, x, y, w, h, top, bottom, a, col) {
    if (a <= 0.02) return;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(a, a); ctx.translate(-(x + w / 2), -(y + h / 2));
    drawCard(ctx, c, x, y, w, h, 1, { accent: col });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label; ctx.font = font(c, 700, top.length > 10 ? 33 : 42, true);
    ctx.fillText(top, x + w / 2, y + h * 0.44);
    ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(21));
    ctx.fillText(bottom, x + w / 2, y + h * 0.76);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _pieces(ctx, c) {
    const { x, w } = PANEL;
    this._bigCard(ctx, c, x, 90, w, 130, 'chroma', 'colour', this._spring(this._pop), c.s4);
    this._bigCard(ctx, c, x, 250, w, 130, 'graphein', 'to write', this._spring(this._pop - 0.25), c.s1);
  }

  _word(ctx, c) {
    const { x, w } = PANEL;
    this._bigCard(ctx, c, x, 130, w, 170, 'chromatography', 'writing with colour', this._spring(this._pop), c.good);
  }

  // The strip out of the jar, dry, held up by a clip: the colours stay where they stopped.
  _drystrip(ctx, c) {
    const B = { x: SB.x, y: 70, w: SB.w, h: BENCH_Y - 70 - 14 };
    ctx.fillStyle = darken(c.gold, 0.3);
    ctx.fillRect(CX - 26, 52, 52, 26);
    ctx.fillRect(CX - 4, 26, 8, 28);
    drawShadow(ctx, c, CX, BENCH_Y + 2, 60, 7);
    const ln = B.y + B.h - 2 * PX;
    paperStrip(ctx, c, B, { lineY: ln });
    DYES.forEach((d, i) => {
      const y = ln - d.rf * CLIMB_CM * PX * 0.98;
      colourSpot(ctx, CX, y, 19, 13, darken(c[d.key], 0.04), 1);
      if (i < this._counted) {
        const s = this._spring(this._countAge + (this._counted - 1 - i));
        pill(ctx, c, String(i + 1), CX + 66, y, { bg: c[d.key], size: fs(24), display: true, scale: s });
      }
    });
  }

  _count(ctx, c) {
    const { x, w } = PANEL;
    drawCard(ctx, c, x, 90, w, 112, 1, { accent: this._counted === 3 ? c.good : c.accent });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.label;
    ctx.font = font(c, 700, 42, true);
    ctx.fillText(this._counted === 3 ? 'at least 3' : String(this._counted), x + w / 2, 134);
    ctx.font = font(c, 700, fs(20)); ctx.fillStyle = c.labelMuted;
    ctx.fillText(this._counted === 3 ? 'dyes in the ink' : 'spots counted', x + w / 2, 176);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (this._counted < 3) {
      pill(ctx, c, 'tap each spot', x + w / 2, 244, { bg: c.accent, size: fs(20), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
      return;
    }
    // Two dyes at one speed: one spot. A mini strip, so "at least" has a picture.
    const s = this._spring(this._countAge - 0.3);
    if (s <= 0.05) return;
    const mx = x + 66, my = 232, mh = 186;
    ctx.save();
    ctx.translate(mx, my + mh / 2); ctx.scale(s, s); ctx.translate(-mx, -(my + mh / 2));
    paperStrip(ctx, c, { x: mx - 26, y: my, w: 52, h: mh }, { lineY: my + mh - 26 });
    colourSpot(ctx, mx - 3, my + 74, 15, 12, c.s4, 0.9);
    colourSpot(ctx, mx + 4, my + 76, 15, 12, c.s5, 0.8);
    ctx.restore();
    ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(21), true); ctx.textBaseline = 'middle';
    ctx.fillText('2 dyes,', mx + 50, my + 62);
    ctx.fillText('same speed:', mx + 50, my + 90);
    ctx.fillText('1 spot', mx + 50, my + 118);
    ctx.textBaseline = 'alphabetic';
  }

  // Three results side by side: only the amounts differ here.
  _tiny(ctx, c) {
    const a = this._spring(this._pop);
    // a dish of crystals
    const dx = 124, dy = BENCH_Y;
    drawShadow(ctx, c, dx, dy + 2, 92, 8);
    ctx.fillStyle = lighten(c.glass, 0.35);
    ctx.beginPath(); ctx.moveTo(dx - 90, dy - 44); ctx.quadraticCurveTo(dx, dy + 20, dx + 90, dy - 44); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(c.glass, 0.25); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = mix(c.s1, c.label, isLight(c) ? 0.05 : 0.2);
    for (let i = 0; i < 11; i++) {
      const px = dx - 56 + i * 11, py = dy - 44 - (i % 3) * 7 - Math.sin(i / 10 * Math.PI) * 12;
      ctx.beginPath(); ctx.moveTo(px, py - 11); ctx.lineTo(px + 10, py); ctx.lineTo(px, py + 9); ctx.lineTo(px - 10, py); ctx.closePath(); ctx.fill();
    }
    // a flask of liquid
    const f = glassBox('flask', 256, BENCH_Y - 230, 160, 230, { neck: 0.34 });
    drawGlass(ctx, c, f);
    drawGlassLiquid(ctx, c, f, { level: 0.42, fill: c.water, opacity: 0.6 });
    // the strip
    const ln = BENCH_Y - 50;
    const S = { x: 530, y: 124, w: 50, h: BENCH_Y - 124 - 12 };
    drawShadow(ctx, c, S.x + 25, BENCH_Y + 2, 40, 6);
    paperStrip(ctx, c, S, { lineY: ln });
    DYES.forEach((d) => colourSpot(ctx, S.x + 25, ln - d.rf * 240, 11, 8, darken(c[d.key], 0.04), 1));
    const y = 66;
    pill(ctx, c, 'crystallization', 124, y + 216, { bg: c.raised, size: fs(19), display: true, scale: a });
    pill(ctx, c, 'distillation', 336, y, { bg: c.raised, size: fs(19), display: true, scale: a });
    pill(ctx, c, 'chromatography', 555, y, { bg: c.good, size: fs(19), display: true, scale: a });
    ctx.font = font(c, 700, fs(20), true); ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = isLight(c) ? c.bgDeep : c.label;
    pill(ctx, c, 'a dish of crystals', 124, 480, { bg: c.bgSurface, size: fs(18), scale: a });
    pill(ctx, c, 'a flask of liquid', 336, 480, { bg: c.bgSurface, size: fs(18), scale: a });
    pill(ctx, c, 'a trace of each dye', 555, 480, { bg: c.bgSurface, size: fs(18), scale: a });
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  _next(ctx, c) {
    const g = glassBox('tumbler', 232, 120, 216, BENCH_Y - 120 + 2, { wall: 7 });
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.82, fill: c.water, opacity: 0.5 });
    drawGlassBand(ctx, c, g, { from: 0.5, to: 0.82, fill: c.gold, opacity: 0.9 });
    const a = this._spring(this._pop);
    const yl = g.floor - g.inner.h * 0.5;
    pill(ctx, c, 'mustard oil', 560, g.floor - g.inner.h * 0.68, { bg: c.gold, size: fs(22), display: true, scale: a });
    pill(ctx, c, 'water', 572, g.floor - g.inner.h * 0.22, { bg: c.water, size: fs(22), display: true, scale: a });
    pill(ctx, c, 'one sharp line', 118, yl, { bg: c.raised, size: fs(21), display: true, scale: a });
    if (a > 0.9) leader(ctx, 196, yl, g.x + 16, yl, darken(c.glass, 0.25), 0.95);
  }

  _choose(v) {
    if (this._right || !v) return;
    this._pick = v;
    if (v === 'blue') {
      this._wrong = '';
      this._right = 0.01;
      this.celebrate(CX, spotY(DYES[2], 1), 20, { key: 'held-hardest', lookAt: true });
    } else {
      this._wrong = v;
      this.oops(CX, spotY(DYES.find((d) => d.name === v), 1));
    }
  }

  _countOne() {
    if (this._counted >= 3) return;
    this._counted += 1;
    this._countAge = 0;
    if (this._counted === 3) this.celebrate(CX, 220, 20, { key: 'at-least-three', lookAt: true });
    this.animateFor?.(800);
  }

  pointerDown(p) {
    if (this.stage === S_RUN && Math.abs(p.x - CX) < 90 && p.y > 80 && p.y < BENCH_Y) this._go();
    if (this.stage === S_WHY) {
      const hit = DYES.find((d) => Math.abs(p.x - CX) < 60 && Math.abs(p.y - spotY(d, 1)) < 34);
      if (hit) this._choose(hit.name);
    }
    if (this.stage === S_COUNT && Math.abs(p.x - CX) < 80 && p.y > 70 && p.y < BENCH_Y) this._countOne();
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'run') this._go();
    else if (id === 'pick') this._choose(String(v));
    else if (id === 'count') this._countOne();
    this.requestUiUpdate?.();
  }

  getControlValue(id) { return id === 'pick' ? this._pick : super.getControlValue(id); }

  isControlHidden(id) {
    if (id === 'run') return this.stage !== S_RUN;
    if (id === 'pick') return this.stage !== S_WHY;
    if (id === 'count') return this.stage !== S_COUNT;
    return false;
  }

  isControlDisabled(id) {
    if (id === 'run') return this._going;
    if (id === 'pick') return !!this._right;
    if (id === 'count') return this._counted >= 3;
    return false;
  }
}
