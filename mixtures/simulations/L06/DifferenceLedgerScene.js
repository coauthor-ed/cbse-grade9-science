// DifferenceLedgerScene - blk-l06-s09, three beats, closing lesson 6.
//   b0  three mixtures on the bench. Tap each: the method and the difference it used. All three seen is the find.
//   b1  brass: filter, magnet and funnel each have nothing to work on
//   b2  muddy water: the learner lets it stand (grains settle, the water stays cloudy) and filters it (still cloudy). Hook to lesson 7.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, darken, drawBackdrop, drawBench, drawCard, drawShadow, font, lighten, mix, mulberry32, outBack, pill } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassBand, drawGlassFront, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const BENCH_Y = 442;
const ITEMS = [
  { id: 'oil', x: 122, name: 'Mustard oil and water', method: 'separating funnel', diff: 'density' },
  { id: 'iron', x: 340, name: 'Iron nails and sawdust', method: 'magnet', diff: 'magnetism' },
  { id: 'camphor', x: 558, name: 'Camphor and sand', method: 'heat under a funnel', diff: 'only one sublimes' },
];
const S_TABLE = 0, S_BRASS = 1, S_MUD = 2;
const MAP = [[{ idx: S_TABLE, dwellMs: null }], [{ idx: S_BRASS, dwellMs: null }], [{ idx: S_MUD, dwellMs: null }]];
const TOOLS = ['filter', 'magnet', 'funnel'];
const mud = (c) => mix(c.gold, c.waste, 0.55);

export class DifferenceLedgerScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'Three mixtures on a bench. Tap each to see the method and the difference it used. Then brass, where no tool has anything to work on, and muddy water, which stays cloudy after standing and after filtering.';
  static CONTROLS = [
    { type: 'segmented', id: 'pick', label: 'Mixture', value: '', options: [{ value: 'oil', label: 'Oil, water' }, { value: 'iron', label: 'Nails, sawdust' }, { value: 'camphor', label: 'Camphor, sand' }] },
    { type: 'button', id: 'stand', label: 'Leave it to stand' },
    { type: 'button', id: 'filter', label: 'Pour through filter paper' },
  ];

  constructor(container, config) {
    super(container, config);
    const r = mulberry32(13);
    this._saw = Array.from({ length: 46 }, () => ({ x: r() * 2 - 1, y: r(), a: r() * 3 }));
    this._grain = Array.from({ length: 70 }, () => ({ x: r() * 2 - 1, y: r(), r: 1.5 + r() * 2 }));
    this._state();
  }

  _state() {
    this._pick = '';
    this._seen = new Set();
    this._pop = 0;
    this._settle = 0;
    this._standing = false;
    this._drip = 0;
    this._dripping = false;
    this._pressedFilter = false;
  }

  enter() { this._state(); }

  update(d) {
    this._pop = Math.min(2, this._pop + d);
    if (this._standing) {
      this._settle = Math.min(1, this._settle + d / 4);
      if (this._settle >= 1) this._standing = false;
    }
    if (this._dripping) {
      this._drip = Math.min(1, this._drip + d / 3);
      if (this._drip >= 1) this._dripping = false;
    }
  }

  busy() { return this._standing || this._dripping || this._pop < 0.5; }

  _spr(a) { return reducedMotion() ? 1 : outBack(clamp01(a / 0.4)); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 110 });
    if (this.stage === S_TABLE) this._table(ctx, c);
    else if (this.stage === S_BRASS) this._brass(ctx, c);
    else this._mudScene(ctx, c);
  }

  _table(ctx, c) {
    const it = ITEMS.find((i) => i.id === this._pick);
    drawCard(ctx, c, 40, 22, 600, 148, 1, { accent: it ? c.good : c.accent });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (it) {
      const s = this._spr(this._pop);
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(20));
      ctx.fillText(`${it.name}: ${it.method}`, 340, 60);
      ctx.fillStyle = c.label; ctx.font = font(c, 700, 40 * s, true);
      ctx.fillText(it.diff, 340, 116);
    } else {
      ctx.fillStyle = c.label; ctx.font = font(c, 700, 28, true);
      ctx.fillText('What difference did the work?', 340, 78);
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(20));
      ctx.fillText('tap a mixture', 340, 122);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    this._oilGlass(ctx, c, ITEMS[0].x);
    this._tray(ctx, c, ITEMS[1].x);
    this._dish(ctx, c, ITEMS[2].x);
    for (const i of ITEMS) {
      if (this._seen.has(i.id)) pill(ctx, c, i.diff, i.x, 472, { bg: i.id === this._pick ? c.good : c.raised, size: fs(18), display: true });
      if (i.id === this._pick) {
        ctx.strokeStyle = c.accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(i.x - 98, 188, 196, BENCH_Y - 188 + 8, 16); ctx.stroke();
      }
    }
  }

  _oilGlass(ctx, c, x) {
    const g = glassBox('beaker', x - 66, 236, 132, BENCH_Y - 236 + 2, { wall: 6, spout: false });
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.86, fill: c.water, opacity: 0.6 });
    drawGlassBand(ctx, c, g, { from: 0.56, to: 0.86, fill: mix(c.gold, c.s8, 0.25), opacity: 0.95 });
  }

  _tray(ctx, c, x) {
    const y = BENCH_Y - 8;
    drawShadow(ctx, c, x, y + 8, 92, 7);
    const wood = mix(c.gold, c.waste, 0.3);
    ctx.fillStyle = alpha(wood, 0.95);
    ctx.fillRect(x - 84, y - 26, 168, 30);
    for (const s of this._saw) {
      ctx.fillStyle = lighten(wood, 0.2 + (s.a % 1) * 0.3);
      ctx.fillRect(x + s.x * 80, y - 34 + s.y * 28, 5, 2.4);
    }
    ctx.strokeStyle = darken(c.glass, 0.35); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - 66 + i * 30, y - 12 + (i % 2) * 8); ctx.lineTo(x - 42 + i * 30, y - 20 + (i % 2) * 8); ctx.stroke(); }
    // the magnet above, a horseshoe in side view
    const my = y - 164;
    ctx.lineWidth = 26; ctx.lineCap = 'butt'; ctx.strokeStyle = c.s6;
    ctx.beginPath(); ctx.moveTo(x - 34, my + 84); ctx.lineTo(x - 34, my + 26); ctx.arc(x, my + 26, 34, Math.PI, 0); ctx.lineTo(x + 34, my + 84); ctx.stroke();
    ctx.strokeStyle = c.labelMuted;
    ctx.beginPath(); ctx.moveTo(x - 34, my + 84); ctx.lineTo(x - 34, my + 100); ctx.moveTo(x + 34, my + 84); ctx.lineTo(x + 34, my + 100); ctx.stroke();
  }

  _dish(ctx, c, x) {
    const y = BENCH_Y - 4;
    drawShadow(ctx, c, x, y + 4, 76, 6);
    const g = glassBox('funnel', x - 68, 212, 136, y - 26 - 212, { flip: true, wall: 4, cone: 0.68, stem: 0.11 });
    drawGlass(ctx, c, g, { shadow: false });
    ctx.fillStyle = lighten(c.glass, 0.35);
    ctx.beginPath(); ctx.moveTo(x - 76, y - 28); ctx.quadraticCurveTo(x, y + 18, x + 76, y - 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(c.glass, 0.3); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = mix(c.gold, c.waste, 0.2);
    ctx.beginPath(); ctx.ellipse(x, y - 24, 56, 7, 0, 0, Math.PI * 2); ctx.fill();
  }

  _brass(ctx, c) {
    const a = this._spr(this._pop);
    const bx = 170, by = 278, bw = 340, bh = 150;
    drawShadow(ctx, c, 340, BENCH_Y + 2, 180, 10);
    const col = mix(c.gold, c.s8, 0.12);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(bx + 34, by); ctx.lineTo(bx + bw - 34, by); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx, by + bh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lighten(col, 0.28);
    ctx.fillRect(bx + 44, by + 14, bw - 88, 12);
    ctx.fillStyle = darken(col, 0.22);
    ctx.beginPath(); ctx.moveTo(bx + bw - 34, by); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - 48, by + bh); ctx.lineTo(bx + bw - 60, by); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx + 34, by); ctx.lineTo(bx + bw - 34, by); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx, by + bh); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = c.label; ctx.font = font(c, 700, 42, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = darken(col, 0.62);
    ctx.fillText('brass', 340, by + bh / 2 + 6);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    TOOLS.forEach((t, i) => pill(ctx, c, `${t}: nothing to work on`, 340, 74 + i * 62, { bg: c.raised, size: fs(21), display: true, scale: this._spr(this._pop - i * 0.2) }));
  }

  _mudScene(ctx, c) {
    const col = mud(c);
    const g = glassBox('cylinder', 112, 112, 160, BENCH_Y - 112 + 2, { wall: 7, r: 26 });
    drawGlass(ctx, c, g);
    const u = this._settle;
    const cloudy = mix(col, c.water, 0.22 + 0.2 * u);
    drawGlassLiquid(ctx, c, g, { level: 0.8, fill: cloudy, opacity: 0.9 - 0.16 * u });
    ctx.save();
    for (const d of this._grain) {
      const inTop = g.top + (g.inner.h) * 0.2;
      const yMid = inTop + d.y * (g.floor - inTop - 6);
      const y = yMid + (g.floor - 6 - yMid) * u * (d.r > 2.2 ? 1 : 0.1);
      ctx.fillStyle = alpha(darken(col, 0.3), d.r > 2.2 ? 1 - u * 0.4 : 0.7);
      ctx.beginPath(); ctx.arc(g.cx + d.x * 62, y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    if (u > 0) drawGlassBand(ctx, c, g, { from: 0, to: 0.13 * u, fill: darken(col, 0.3), opacity: 0.98, edge: 'soft' });
    drawGlassFront(ctx, c, g);
    const r = this._drip;
    if (u >= 1) pill(ctx, c, 'still cloudy', g.cx, 70, { bg: c.warning, size: fs(21), display: true });
    if (this._pressedFilter) this._filterRig(ctx, c, col, r);
    const hint = u < 1 && !this._standing ? 'leave it to stand' : (u >= 1 && !this._pressedFilter ? 'now try filter paper' : '');
    if (hint) pill(ctx, c, hint, 480, 180, { bg: c.accent, size: fs(20), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
  }

  _filterRig(ctx, c, col, r) {
    const x = 480;
    const f = glassBox('flask', x - 80, 266, 160, BENCH_Y - 266 + 2, { neck: 0.34 });
    drawGlass(ctx, c, f);
    if (r > 0.02) drawGlassLiquid(ctx, c, f, { level: 0.34 * r, fill: mix(col, c.water, 0.5), opacity: 0.75 });
    const fn = glassBox('funnel', x - 74, 118, 148, 174, { cone: 0.62, stem: 0.1, wall: 4 });
    drawGlass(ctx, c, fn, { shadow: false });
    ctx.fillStyle = lighten(c.glass, 0.5);
    ctx.beginPath(); ctx.moveTo(x - 60, 128); ctx.lineTo(x + 60, 128); ctx.lineTo(x, 216); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x - 36, 164); ctx.lineTo(x + 36, 164); ctx.lineTo(x, 214); ctx.closePath(); ctx.fill();
    drawGlassFront(ctx, c, fn);
    if (this._dripping) {
      const y = 296 + ((this.clock * 120) % 70);
      ctx.fillStyle = mix(col, c.water, 0.4);
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    if (r >= 1) pill(ctx, c, 'still cloudy', x, 80, { bg: c.warning, size: fs(21), display: true });
  }

  _choose(v) {
    if (!ITEMS.some((i) => i.id === v)) return;
    this._pick = v;
    this._pop = 0;
    const was = this._seen.size;
    this._seen.add(v);
    if (was < 3 && this._seen.size === 3) this.celebrate(340, 110, 22, { key: 'every-difference' });
  }

  pointerDown(p) {
    if (this.stage === S_TABLE && p.y > 180 && p.y < BENCH_Y + 20) {
      const hit = ITEMS.find((i) => Math.abs(p.x - i.x) < 104);
      if (hit) this._choose(hit.id);
    }
  }

  _stand() {
    if (this._settle > 0 || this._standing) return;
    if (reducedMotion()) { this._settle = 1; return; }
    this._standing = true;
  }

  _filter() {
    if (this._pressedFilter) return;
    this._pressedFilter = true;
    if (reducedMotion()) { this._drip = 1; return; }
    this._dripping = true;
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'pick') this._choose(String(v));
    else if (id === 'stand') this._stand();
    else if (id === 'filter') this._filter();
    this.requestUiUpdate?.();
  }

  getControlValue(id) { return id === 'pick' ? this._pick : super.getControlValue(id); }

  isControlHidden(id) {
    if (id === 'pick') return this.stage !== S_TABLE;
    return this.stage !== S_MUD;
  }

  isControlDisabled(id) {
    if (id === 'stand') return this._settle > 0;
    if (id === 'filter') return this._settle < 1 || !!this._pressedFilter;
    return false;
  }
}
