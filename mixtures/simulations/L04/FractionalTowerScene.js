// FractionalTowerScene.js - fractional distillation, then what heat cannot do.
//
// Two mounts, separate stages (the scene sees only the beat count):
//   4 beats  blk-l04-s06: 0 the tower, cold | 1 heat it: vapour rises, each part stops at its own level
//            2 the order of the fractions (pick one to follow) | 3 petroleum gas into a cylinder: LPG
//   3 beats  blk-l04-s09: 4 the differences used so far | 5 distil black ink: clear water comes over,
//            the dyes stay behind mixed | 6 a sketch pen line and a drop of water, the hook to lesson 5
//
// The tower is hot at the bottom and cool at the top. A part with a higher boiling point condenses
// lower down. Book's order of fractions (Fig. 5.14). Boiling points are given as a rank, not numbers,
// because the book prints none. The tower is drawn plain: no trays' caps or downcomers.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, rr, pill, font, drawBackdrop, drawBench, drawCard, drawFloor, drawShadow, clamp,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassPipe, drawGlassPipeFront } from 'simulations/base/kit/SimGlass.js';
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const TW = { x: 228, y: 34, w: 168, h: 410 };
const FLOOR_Y = 444;
const yAt = (f) => TW.y + TW.h - f * TW.h;
const FR = [
  { key: 'gas', name: 'Petroleum gas', f: 0.94, col: 's7', rank: 'lowest' },
  { key: 'petrol', name: 'Petrol', f: 0.78, col: 's2', rank: 'low' },
  { key: 'kero', name: 'Aviation fuel', f: 0.62, col: 's1', rank: 'middle' },
  { key: 'diesel', name: 'Diesel', f: 0.46, col: 's8', rank: 'high' },
  { key: 'oil', name: 'Lubricating oil', f: 0.3, col: 's5', rank: 'higher' },
  { key: 'bit', name: 'Bitumen', f: 0.08, col: 's4', rank: 'highest' },
];
const RUN_S = 9;
const S_COLD = 0, S_HEAT = 1, S_ORDER = 2, S_LPG = 3, S_SUM = 4, S_INK = 5, S_PEN = 6;
const map = (from, n) => Array.from({ length: n }, (_, i) => [{ idx: from + i, dwellMs: null }]);

export class FractionalTowerScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static IRIS = true;
  static COLOR_MAP = GEO_COLOR_MAP;
  static BEAT_MAPS = { 4: map(S_COLD, 4), 3: map(S_SUM, 3) };
  static BEAT_STEP_MAP = map(S_COLD, 4);
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A tall refinery tower, hot at the bottom and cool at the top. Crude oil vapour rises and each part condenses at its own level: petroleum gas at the top, then petrol, aviation fuel, diesel, lubricating oil, and bitumen at the bottom. Then black ink is distilled: clear water comes over and the dyes stay behind.';
  static CONTROLS = [
    { type: 'button', id: 'run', label: 'Heat the crude oil' },
    { type: 'select', id: 'follow', label: 'Follow', value: 'petrol', options: FR.map((f) => ({ value: f.key, label: f.name })) },
    { type: 'button', id: 'fill', label: 'Fill the cylinder' },
    { type: 'button', id: 'distil', label: 'Distil the ink' },
    { type: 'button', id: 'drop', label: 'Add a drop of water' },
  ];

  constructor(container, config) {
    super(container, config);
    this._zero();
  }

  _zero() {
    this._u = 0;              // 0..1 of this stage's run
    this._going = false;
    this._follow = 'petrol';
    this._found = false;
  }

  enter(stage) {
    this._zero();
    if (stage === S_ORDER || stage === S_LPG) this._done = true; else this._done = false;
  }

  _uses(id) {
    const s = this.stage;
    return (id === 'run' && s === S_HEAT) || (id === 'follow' && s === S_ORDER) || (id === 'fill' && s === S_LPG)
      || (id === 'distil' && s === S_INK) || (id === 'drop' && s === S_PEN);
  }
  isControlHidden(id) { return !this._uses(id); }
  isControlDisabled(id) { return id !== 'follow' && (this._going || this._u >= 1); }
  getControlValue(id) { return id === 'follow' ? this._follow : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'follow') { this._follow = String(v); this._u = 0; this._going = true; }
    else {
      this._u = 0; this._going = true;
      if (!this._found && (id === 'fill' || id === 'drop')) {
        this._found = true;
        const lpg = id === 'fill';
        this.celebrate(lpg ? 570 : 340, lpg ? 140 : 262, 16, { key: lpg ? 'lpg' : 'drop', small: true });
      }
    }
    this.animateFor(1000);
    this.requestUiUpdate?.();
  }

  update(d) {
    if (!this._going) return;
    const secs = this.stage === S_HEAT ? RUN_S : this.stage === S_INK ? 6 : this.stage === S_ORDER ? 2.4 : 3.2;
    this._u = Math.min(1, this._u + d / secs);
    if (this._u >= 1) { this._going = false; this.requestUiUpdate?.(); }
  }

  busy() { return this._going; }

  draw(ctx, c, t) {
    const s = this.stage;
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, s >= S_INK ? 500 : FLOOR_Y + 6);
    if (s <= S_LPG) this._tower(ctx, c, t);
    else if (s === S_SUM) this._summary(ctx, c);
    else if (s === S_INK) this._ink(ctx, c, t);
    else this._pen(ctx, c);
  }

  /** How far a fraction has got: 0 on the way, 1 when it has reached its level. */
  _arrived(i) {
    if (this.stage !== S_HEAT) return this.stage === S_COLD ? 0 : 1;
    const start = 0.08 + (5 - i) * 0.02;
    const span = 0.2 + (FR[i].f) * 0.55;
    return clamp((this._u - start) / span, 0, 1);
  }

  _tower(ctx, c, t) {
    const T = TW, s = this.stage;
    const hot = s === S_COLD ? 0 : s === S_HEAT ? clamp(this._u * 4, 0, 1) : 1;
    // furnace and its pipe
    const fx = 46, fw = 138, fy = FLOOR_Y - 96;
    drawShadow(ctx, c, fx + fw / 2, FLOOR_Y + 2, fw * 0.6, 7);
    drawGlassPipe(ctx, c, fx + fw - 8, FLOOR_Y - 36, T.x + 10, FLOOR_Y - 36, 20, { body: 1.4 });
    drawGlassPipeFront(ctx, c, fx + fw - 8, FLOOR_Y - 36, T.x + 10, FLOOR_Y - 36, 20);
    rr(ctx, fx, fy, fw, 96, 14);
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.2); ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, fx + 22, fy + 34, fw - 44, 50, 8);
    ctx.fillStyle = mix(c.bgDeep, c.stroke, 0.2); ctx.fill();
    if (hot > 0) {
      for (let i = 0; i < 3; i += 1) {
        const x = fx + 42 + i * 28, f = (26 + 4 * Math.sin((this._going ? t : 1) * 10 + i)) * hot;
        ctx.fillStyle = alpha(c.flame, 0.95);
        ctx.beginPath(); ctx.moveTo(x - 9, fy + 80); ctx.quadraticCurveTo(x - 12, fy + 80 - f * 0.6, x, fy + 80 - f); ctx.quadraticCurveTo(x + 12, fy + 80 - f * 0.6, x + 9, fy + 80); ctx.closePath(); ctx.fill();
      }
    }
    pill(ctx, c, 'Furnace', fx + fw / 2, fy + 18, { bg: c.raised, ink: c.label, size: fs(15), display: true });
    pill(ctx, c, 'Crude oil', fx + fw / 2, fy - 22, { bg: c.raised, ink: c.label, size: fs(16), display: true });

    // the tower shell, hot at the foot and cool at the head
    drawShadow(ctx, c, T.x + T.w / 2, FLOOR_Y + 2, T.w * 0.7, 9);
    rr(ctx, T.x, T.y, T.w, T.h, 26);
    ctx.fillStyle = mix(c.bgSurface, c.stroke, 0.25); ctx.fill();
    ctx.save();
    rr(ctx, T.x + 6, T.y + 6, T.w - 12, T.h - 12, 21); ctx.clip();
    const g = ctx.createLinearGradient(0, T.y, 0, T.y + T.h);
    g.addColorStop(0, alpha(c.ice, 0.2 + 0.6 * hot));
    g.addColorStop(0.55, alpha(c.gold, 0.1 + 0.3 * hot));
    g.addColorStop(1, alpha(c.flame, 0.2 + 0.72 * hot));
    ctx.fillStyle = g; ctx.fillRect(T.x, T.y, T.w, T.h);
    // shelves, with the liquid of each fraction on them
    FR.forEach((f, i) => {
      const y = yAt(f.f) + 14;
      const a = this._arrived(i);
      if (i > 0) {
        if (a > 0.98) { ctx.fillStyle = c[f.col]; ctx.fillRect(T.x + 8, y - 12, T.w - 16, 12); }
        ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.1); ctx.fillRect(T.x + 6, y, T.w - 12, 5);
      }
    });
    if ((s === S_HEAT || s === S_ORDER) && (this._going || s === S_HEAT)) this._risers(ctx, c);
    ctx.restore();
    rr(ctx, T.x, T.y, T.w, T.h, 26);
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.ice, 0.6), 0.32);
    rr(ctx, T.x + 15, T.y + 26, 9, T.h - 60, 4.5); ctx.fill();

    // side pipes and names
    FR.forEach((f, i) => {
      const y = yAt(f.f);
      const a = this._arrived(i);
      const on = s === S_ORDER ? f.key === this._follow : a > 0.98;
      const name = f.name;
      ctx.fillStyle = on ? c[f.col] : mix(c.stroke, c.bgSurface, 0.35);
      rr(ctx, T.x + T.w - 3, y - 6, 42, 12, 3); ctx.fill();
      ctx.strokeStyle = c.stroke; ctx.lineWidth = 2; ctx.stroke();
      if (s === S_LPG) return;
      pill(ctx, c, name, T.x + T.w + 46, y, { align: 'left', bg: on ? c[f.col] : c.raised, ink: on ? undefined : (s === S_COLD ? c.labelMuted : c.label), size: fs(17), display: true });
    });
    // cool and hot
    if (s !== S_COLD) {
      pill(ctx, c, 'cool', T.x - 42, T.y + 30, { bg: c.accent, size: fs(17), display: true });
      pill(ctx, c, 'hot', T.x - 36, T.y + T.h - 168, { bg: c.flame, size: fs(17), display: true });
    }
    if (s === S_ORDER) {
      const f = FR.find((x) => x.key === this._follow);
      pill(ctx, c, `boiling point: ${f.rank}`, 110, 214, { bg: c.raised, ink: c.label, size: fs(16), display: true });
    }
    if (s === S_LPG) this._cylinder(ctx, c);
  }

  /** Vapour dots rise from the foot and each colour stops at its own level. */
  _risers(ctx, c) {
    const T = TW;
    const base = T.y + T.h - 30;
    const follow = this.stage === S_ORDER ? FR.findIndex((f) => f.key === this._follow) : -1;
    FR.forEach((f, i) => {
      if (follow >= 0 && i !== follow) return;
      const yk = yAt(f.f) + 2;
      for (let j = 0; j < 4; j += 1) {
        const p = this.stage === S_ORDER ? clamp(this._u * 1.4 - j * 0.1, 0, 1) : clamp((this._u - 0.06 - j * 0.05 - (5 - i) * 0.015) / (0.2 + f.f * 0.5), 0, 1);
        if (p <= 0 || p >= 1) continue;
        const x = T.x + 22 + ((i * 2 + j * 3) % 7) * ((T.w - 44) / 6);
        ctx.beginPath(); ctx.arc(x, base + (yk - base) * p, 6, 0, Math.PI * 2);
        ctx.fillStyle = c[f.col]; ctx.fill();
        ctx.strokeStyle = alpha(darken(c[f.col], 0.4), 0.8); ctx.lineWidth = 1.5; ctx.stroke();
      }
    });
  }

  _cylinder(ctx, c) {
    const x = 520, y = 112, w = 110, h = 230;
    const top = yAt(FR[0].f);
    ctx.fillStyle = c.s7;
    rr(ctx, TW.x + TW.w + 30, top - 6, x + w / 2 - (TW.x + TW.w + 30), 12, 3); ctx.fill();
    rr(ctx, x + w / 2 - 6, top, 12, y - top, 3); ctx.fill();
    drawShadow(ctx, c, x + w / 2, y + h + 4, w * 0.6, 7);
    rr(ctx, x, y, w, h, 34);
    ctx.fillStyle = mix(c.s6, c.bgSurface, 0.1); ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 3.5; ctx.stroke();
    rr(ctx, x + 22, y + 26, w - 44, h - 52, 14);
    ctx.fillStyle = mix(c.bgDeep, c.ice, 0.2); ctx.fill();
    ctx.save();
    rr(ctx, x + 22, y + 26, w - 44, h - 52, 14); ctx.clip();
    const lv = this._u * (h - 80);
    ctx.fillStyle = mix(c.s7, c.ice, 0.3);
    ctx.fillRect(x + 22, y + h - 26 - lv, w - 44, lv);
    ctx.restore();
    pill(ctx, c, 'Petroleum gas', 492, 92, { bg: c.s7, size: fs(16), display: true });
    if (this._u >= 1) pill(ctx, c, 'LPG: a liquid', x + w / 2, y + h + 34, { bg: c.good, size: fs(17), display: true });
    else pill(ctx, c, 'steel cylinder', x + w / 2, y + h + 34, { bg: c.raised, ink: c.label, size: fs(16), display: true });
  }

  // -- the second mount ----------------------------------------------------------------------

  _summary(ctx, c) {
    pill(ctx, c, 'What each method used', 340, 44, { bg: c.raised, ink: c.label, size: fs(22), display: true });
    const rows = [['Crystallization', 'solubility', 's5'], ['Distillation', 'boiling point', 's8'], ['Fractional distillation', 'boiling point', 's8']];
    rows.forEach(([m, d, col], i) => {
      const y = 88 + i * 138;
      drawCard(ctx, c, 28, y, 624, 122, 1, {});
      this._rowIcon(ctx, c, i, 104, y + 61);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = font(c, 700, fs(21), true); ctx.fillStyle = c.label;
      ctx.fillText(m, 184, y + 40, 440);
      pill(ctx, c, d, 184, y + 82, { align: 'left', bg: c[col], size: fs(19), display: true });
    });
  }

  _rowIcon(ctx, c, i, x, y) {
    if (i === 0) {
      const g = glassBox('beaker', x - 40, y - 46, 80, 92, { wall: 4, r: 8 });
      drawGlass(ctx, c, g, { shadow: false });
      drawGlassLiquid(ctx, c, g, { level: 0.7, fill: mix(c.glass, c.gold, 0.25), opacity: 0.5 });
      for (const [dx, s] of [[-20, 9], [0, 12], [20, 8]]) {
        ctx.fillStyle = lighten(c.ice, 0.5); rr(ctx, x + dx - s / 2, g.floor - s - 2, s, s, 2); ctx.fill();
        ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.5; ctx.stroke();
      }
    } else if (i === 1) {
      const g = glassBox('round', x - 34, y - 52, 68, 104, { wall: 3, neck: 0.32 });
      drawGlass(ctx, c, g, { shadow: false });
      drawGlassLiquid(ctx, c, g, { level: 0.36, fill: mix(c.glass, c.gold, 0.2), opacity: 0.6 });
    } else {
      rr(ctx, x - 22, y - 52, 44, 104, 12);
      const gr = ctx.createLinearGradient(0, y - 52, 0, y + 52);
      gr.addColorStop(0, c.ice); gr.addColorStop(1, c.flame);
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = c.stroke; ctx.lineWidth = 3; ctx.stroke();
    }
  }

  _ink(ctx, c, t) {
    const B = 442, u = this._u;
    drawBench(ctx, c, 0, 680, B, { h: 54 });
    const F = { x: 164, y: 292, r: 92 }, neck = 124;
    const ARM = { x0: 182, y0: 166, x1: 500, y1: 262 };
    // burner
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.15); rr(ctx, F.x - 14, B - 32, 28, 28, 4); ctx.fill(); rr(ctx, F.x - 23, B - 8, 46, 8, 3); ctx.fill();
    if (this._going) {
      const f = 26 + 3 * Math.sin(t * 11);
      ctx.fillStyle = alpha(c.flame, 0.92);
      ctx.beginPath(); ctx.moveTo(F.x - 10, B - 32); ctx.quadraticCurveTo(F.x - 15, B - 32 - f * 0.6, F.x, B - 32 - f); ctx.quadraticCurveTo(F.x + 15, B - 32 - f * 0.6, F.x + 10, B - 32); ctx.closePath(); ctx.fill();
    }
    drawGlassPipe(ctx, c, ARM.x0, ARM.y0, ARM.x1, ARM.y1, 14);
    drawGlassPipe(ctx, c, 276, 195, 450, 247, 42);
    ctx.strokeStyle = alpha(c.water, 0.6); ctx.lineWidth = 34; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(276, 195); ctx.lineTo(450, 247); ctx.stroke();
    ctx.strokeStyle = alpha(c.bgDeep, 0.5); ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(276, 195); ctx.lineTo(450, 247); ctx.stroke();
    drawGlassPipeFront(ctx, c, ARM.x0, ARM.y0, ARM.x1, ARM.y1, 14);
    drawGlassPipeFront(ctx, c, 276, 195, 450, 247, 42, { ends: true });
    const g = glassBox('round', F.x - F.r, neck, F.r * 2, F.y + F.r - neck, { wall: 4, neck: 0.3 });
    drawGlass(ctx, c, g, { shadow: false });
    const ink = mix(darken(c.s5, 0.5), darken(c.s5, 0.82), u);
    const surface = g.floor - F.r * 1.05 * (1 - 0.76 * u);
    drawGlassLiquid(ctx, c, g, { surface, fill: ink, opacity: 0.92 });
    ctx.fillStyle = darken(c.stroke, 0.3); rr(ctx, F.x - 34, neck - 12, 68, 18, 5); ctx.fill();
    // the receiver: clear water
    const R = { x: 548, w: 124 };
    const rg = glassBox('flask', R.x - R.w / 2, 300, R.w, B - 300, { wall: 3, r: 8, neck: 0.36 });
    drawGlass(ctx, c, rg);
    if (u > 0.02) drawGlassLiquid(ctx, c, rg, { level: 0.05 + u * 0.46, fill: mix(c.water, c.glass, 0.72), opacity: 0.38 });
    if (this._going) {
      const p = (t * 1.6) % 1;
      ctx.fillStyle = mix(c.water, c.glass, 0.5);
      ctx.beginPath(); ctx.ellipse(ARM.x1 + 2, ARM.y1 + 6 + p * 86, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    pill(ctx, c, 'black ink', F.x, 60, { bg: c.raised, ink: c.label, size: fs(20), display: true });
    if (u >= 1) {
      pill(ctx, c, 'clear water', R.x, 268, { bg: c.good, size: fs(18), display: true });
      pill(ctx, c, 'dyes stay, still mixed', 334, 340, { bg: c.warning, size: fs(18), display: true });
    }
  }

  _pen(ctx, c) {
    const B = 442;
    drawBench(ctx, c, 0, 680, B, { h: 54 });
    const P = { x: 92, y: 76, w: 496, h: 360 };
    drawShadow(ctx, c, P.x + P.w / 2, B + 1, P.w * 0.5, 7);
    rr(ctx, P.x, P.y, P.w, P.h, 6);
    ctx.fillStyle = lighten(c.ice, 0.72); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 2.5; ctx.stroke();
    const cx = 340, cy = 262, u = this._u;
    const ink = darken(c.s5, 0.82);
    const fall = clamp(u / 0.2, 0, 1);
    const spread = clamp((u - 0.2) / 0.8, 0, 1);
    ctx.strokeStyle = ink; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(150, cy); ctx.bezierCurveTo(250, cy - 10, 430, cy + 10, 530, cy); ctx.stroke();
    if (spread > 0) {
      // the drop lifts the ink and the colours start to creep out at its edge
      const R = 30 + spread * 76;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, R);
      g.addColorStop(0, alpha(c.water, 0.5));
      g.addColorStop(0.55, alpha(c.water, 0.42));
      g.addColorStop(0.74, alpha(c.s1, 0.5 * spread));
      g.addColorStop(0.87, alpha(c.s2, 0.5 * spread));
      g.addColorStop(0.96, alpha(c.s4, 0.55 * spread));
      g.addColorStop(1, alpha(c.s4, 0));
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    }
    if (fall < 1) {
      const y = 96 + (cy - 96) * fall * fall;
      ctx.fillStyle = alpha(c.water, 0.92);
      ctx.beginPath(); ctx.moveTo(cx, y - 24); ctx.quadraticCurveTo(cx + 18, y + 2, cx, y + 12); ctx.quadraticCurveTo(cx - 18, y + 2, cx, y - 24); ctx.closePath(); ctx.fill();
    }
    pill(ctx, c, 'black sketch pen', 340, 44, { bg: c.raised, ink: c.label, size: fs(20), display: true });
  }
}
