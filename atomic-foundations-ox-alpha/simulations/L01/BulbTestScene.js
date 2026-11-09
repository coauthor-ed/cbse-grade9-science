// BulbTestScene - companion to blk-l01-s3, "Salt Water Conducts".
// A glass of liquid, two electrodes, a dry cell, a switch and a real bulb.
//   b0  test         pick a sample and close the switch yourself (tap the chips and the switch)
//   b1  why-visible  the same circuit with something shown moving through the salt water; sugar
//                    water holds whole particles that do not move, and nothing flows
//   b2  takeaway     two rigs side by side: one lit, one dark
// What moves in salt water is left unnamed: this lesson does not teach ions yet.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, clamp01, lerp, pill, popAt, drawBackdrop, drawFloor, drawBench, rr, darken, lighten, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawIon, drawBall } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawBulb, drawWire, drawCell, chipInk } from './GrainKit.js';

const TAU = Math.PI * 2;
const S_TEST = 0, S_WHY = 1, S_TAKE = 2;
const BENCH = 412;
const SAMPLES = [
  { key: 'water', label: 'pure water', x: 122 },
  { key: 'salt', label: 'salt water', x: 340 },
  { key: 'sugar', label: 'sugar water', x: 558 },
];
const LEVER_S = 0.25, GLOW_S = 0.55, FLOW_S = 4.5;

// The rig, in its own units: (0, 0) is the bench under the glass.
const G = { w: 244, h: 186 };
const ROD = { l: -68, r: 68, top: -226, bot: -32 };
const RAIL = -318, LOW = -256;
const SW = { x0: 146, x1: 214 };

export class BulbTestScene extends SimScene {
  static BEAT_STEP_MAP = [S_TEST, S_WHY, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static NOTE_STAGE = 1;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'select', id: 'sample', label: 'Sample', value: 'salt', options: SAMPLES.map((s) => ({ value: s.key, label: s.label })) },
    { type: 'button', id: 'switch', label: 'Switch' },
  ];
  static ARIA_LABEL = 'A glass of liquid with two electrodes, wired through a cell, a switch and a bulb. Choose pure water, '
    + 'salt water or sugar water and close the switch: only salt water lights the bulb. Next, small charged particles are '
    + 'shown moving through the salt water, while the sugar stays still. Last, a lit rig and a dark rig stand side by side.';

  constructor(container, config) {
    super(container, config);
    this._sample = 'salt';
    this._closed = false;
    this._lever = 0;
    this._glow = 0;
    this._flowAt = -1;
    this._tested = {};
    this._found = false;
    this._foundWhy = false;
  }

  noteRows() { return this.stage === S_WHY ? [{ text: 'particles drawn far bigger than life' }] : []; }

  enter(stage) {
    this._sample = 'salt';
    this._closed = stage === S_WHY;
    this._lever = this._closed ? 1 : 0;
    this._glow = this._closed ? 1 : 0;
    this._flowAt = stage === S_WHY ? 0 : -1;
    this._tested = {};
    this._found = false;
    this._foundWhy = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return this.stage === S_TAKE || (id === 'switch' && this.stage !== S_TEST); }
  getControlValue(id) { return id === 'sample' ? this._sample : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'sample') this._pick(v);
    if (id === 'switch') this._toggle();
  }

  _pick(key) {
    if (key === this._sample) return;
    this._sample = key;
    if (this.stage === S_WHY) {
      this._flowAt = this.age;
      if (key === 'sugar' && !this._foundWhy) {
        this._foundWhy = true;
        this.after(1.4, () => this.celebrate(340, 330, 12, { key: 'sugar-still' }));
      }
    }
    this.requestUiUpdate?.();
  }

  _toggle() {
    this._closed = !this._closed;
    this.requestUiUpdate?.();
  }

  _lit() { return this._closed && this._sample === 'salt'; }

  update(d) {
    const lt = this._closed ? 1 : 0;
    this._lever += Math.sign(lt - this._lever) * Math.min(Math.abs(lt - this._lever), d / LEVER_S);
    const gt = this._lit() && this._lever > 0.9 ? 1 : 0;
    this._glow += Math.sign(gt - this._glow) * Math.min(Math.abs(gt - this._glow), d / GLOW_S);
    if (this.stage === S_TEST && this._closed && this._lever >= 1) {
      this._tested[this._sample] = this._lit() ? 'lit' : 'dark';
      if (this._lit() && this._glow >= 1 && !this._found) {
        this._found = true;
        this.celebrate(340, 96, 26, { key: 'salt-lights', lookAt: 'bulb' });
      }
    }
  }

  busy() {
    const lt = this._closed ? 1 : 0, gt = this._lit() ? 1 : 0;
    if (Math.abs(this._lever - lt) > 1e-3 || Math.abs(this._glow - gt) > 1e-3) return true;
    return this.stage === S_WHY && this._flowAt >= 0 && !reducedMotion() && this.age - this._flowAt < FLOW_S;
  }

  pointerDown(p) {
    if (this.stage === S_TAKE) return;
    if (p.y > 440) {
      const s = SAMPLES.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a));
      this._pick(s.key);
      return;
    }
    if (this.stage === S_TEST && p.y < 200) this._toggle();
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 62);
    drawBench(ctx, c, 26, 654, BENCH);
    if (this.stage === S_TAKE) {
      this._rig(ctx, c, 178, BENCH, 0.62, { sample: 'salt', lever: 1, glow: 1 });
      this._rig(ctx, c, 502, BENCH, 0.62, { sample: 'sugar', lever: 1, glow: 0 });
      this._verdict(ctx, c, 178, 'conducts', c.good, 0.3);
      this._verdict(ctx, c, 502, 'does not', c.bad, 0.6);
      return;
    }
    this._rig(ctx, c, 340, BENCH, 1, { sample: this._sample, lever: this._lever, glow: this._glow, particles: this.stage === S_WHY });
    this._chips(ctx, c);
  }

  _verdict(ctx, c, x, text, bg, at) {
    const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, at);
    if (p) pill(ctx, c, text, x, 476, { bg, ink: chipInk(c), size: 28, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
  }

  _chips(ctx, c) {
    for (const s of SAMPLES) {
      const on = this._sample === s.key, res = this._tested[s.key];
      const bg = res === 'lit' ? c.good : res === 'dark' ? c.raised : on ? c.accent : c.raised;
      pill(ctx, c, res ? `${s.label}: ${res}` : s.label, s.x, 482, { bg, size: res ? 21 : 23, display: true, ink: res === 'dark' || (!res && !on) ? c.label : chipInk(c) });
    }
    if (this.stage === S_TEST && !this._closed && !Object.keys(this._tested).length) {
      pill(ctx, c, 'tap the switch', 520, 150, { bg: c.warning, ink: chipInk(c), size: 22, display: true });
    }
  }

  _rig(ctx, c, x, y, s, o) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    const live = o.glow;
    const hx = 0;
    const g = glassBox('beaker', -G.w / 2, -G.h, G.w, G.h, { wall: 6 });
    drawGlass(ctx, c, g);
    const sy = drawGlassLiquid(ctx, c, g, { level: 0.74, fill: c.water, opacity: 0.45 }) ?? -130;
    this._rod(ctx, c, ROD.l); this._rod(ctx, c, ROD.r);
    if (o.particles) this._particles(ctx, c, o.sample, sy);
    drawGlassFront(ctx, c, g, { shade: 0.1 });
    // the wires run from each electrode, up to the rail, through the cell, the bulb and the switch
    drawWire(ctx, c, [[ROD.l, ROD.top], [ROD.l, LOW], [-214, LOW], [-214, RAIL], [-40, RAIL]], live);
    drawWire(ctx, c, [[40, RAIL], [SW.x0, RAIL]], live);
    drawWire(ctx, c, [[SW.x1, RAIL], [262, RAIL], [262, LOW], [ROD.r, LOW], [ROD.r, ROD.top]], live);
    drawCell(ctx, c, -128, RAIL, 104, 46);
    this._switch(ctx, c, o.lever);
    drawBulb(ctx, c, hx, RAIL - 16, 50, o.glow);
    if (o.particles && live > 0.5) this._arrows(ctx, c);
    ctx.restore();
  }

  _rod(ctx, c, x) {
    const col = mix(c.waste, c.label, 0.12);
    rr(ctx, x - 9, ROD.top, 18, ROD.bot - ROD.top, 6); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    rr(ctx, x - 6, ROD.top + 6, 4, ROD.bot - ROD.top - 14, 2); ctx.fillStyle = alpha(lighten(col, 0.5), 0.6); ctx.fill();
  }

  _switch(ctx, c, k) {
    const a = lerp(-0.7, 0, k);
    const metal = mix(c.waste, c.label, 0.3);
    rr(ctx, SW.x0 - 16, RAIL + 8, SW.x1 - SW.x0 + 32, 16, 6); ctx.fillStyle = darken(c.s5, 0.2); ctx.fill();
    for (const px of [SW.x0, SW.x1]) { ctx.beginPath(); ctx.arc(px, RAIL, 10, 0, TAU); ctx.fillStyle = metal; ctx.fill(); ctx.strokeStyle = darken(metal, 0.3); ctx.lineWidth = 2.5; ctx.stroke(); }
    ctx.save();
    ctx.translate(SW.x0, RAIL); ctx.rotate(a);
    rr(ctx, 0, -6, SW.x1 - SW.x0 + 6, 12, 6); ctx.fillStyle = c.s2; ctx.fill();
    ctx.strokeStyle = darken(c.s2, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  _particles(ctx, c, sample, sy) {
    if (sample === 'water') return;
    const left = -100, right = 100, y0 = sy + 30, y1 = -30;
    const rnd = mulberry32(5);
    if (sample === 'sugar') {
      for (let i = 0; i < 6; i++) {
        const x = lerp(left - 12, right + 12, (i + 0.5) / 6), y = lerp(y0, y1, rnd());
        drawBall(ctx, c, x, y, 13, c.labelMuted);
      }
      return;
    }
    const moving = this._flowAt >= 0 && !reducedMotion() ? clamp01((this.age - this._flowAt) / FLOW_S) : 1;
    for (let i = 0; i < 10; i++) {
      const pos = i % 2 === 0;
      const h = ((i * 0.618) % 1 + moving * 1.6) % 1;
      const u = pos ? h : 1 - h;
      drawIon(ctx, c, lerp(left, right, u), lerp(y0, y1, (i + 0.5) / 10), { charge: pos ? 1 : -1, r: 13 });
    }
  }

  _arrows(ctx, c) {
    // the circuit is lit: chevrons along the top wire say charge is flowing all the way round
    ctx.strokeStyle = c.warning; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const x of [-190, 100, 240]) {
      ctx.beginPath(); ctx.moveTo(x, RAIL - 21); ctx.lineTo(x + 10, RAIL - 13); ctx.lineTo(x, RAIL - 5); ctx.stroke();
    }
  }
}
