// PitchLoudnessScene - blk-l04-s08 (4 beats) and blk-l05-s02 (5 beats), one panel, two walkthroughs.
// One density-vs-distance curve and two dials. Frequency moves the crest spacing and
// nothing else; amplitude moves the crest height and nothing else; the source picker
// changes a badge, a chip and a pictogram and NOTHING in the curve's draw path reads it,
// so the curve is pixel-identical between flute and voice - that identity is the point
// of beat 1. No number is printed anywhere on the panel, so the human edge can sit at
// 0.72 of a unitless frequency dial without claiming a hertz value the lesson has not taught.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, pill, leader, rr, font, popAt, inOutSine,
  drawBackdrop, drawCard, drawMeter, Burst,
} from 'simulations/base/kit/SimLook.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const RAD = Math.PI / 180;

// -- the panel -----------------------------------------------------------------------
const PANEL = { x: 16, y: 56, w: 648, h: 422 };        // 16..664 x 56..478
const AVGY = 196;                                       // the dashed average density line
const WX0 = 108, WX1 = 456;                             // the curve's own span (348 px)
const AXE = 464;                                        // the dashed line runs a little further
const AMAX = 60;                                        // px of crest height at full amplitude
const SP0 = 240, SP1 = 26;                              // px of crest spacing at the dial's ends
const F0 = 0.18, A0 = 0.78;                             // where both mounts start
const EAR_EDGE = 0.72;                                  // the human edge, in dial travel
const SRC = { x: 78, y: AVGY, chip: 122, r: 19 };       // source marker box and its chip
const TILE = { y: 104, w: 60, h: 108, xs: [500, 566, 632] };
const TILE_GLYPH = 142;
const DIAL = { x0: 140, x1: 628, rows: [340, 434], tag: 78, mid: 384, r: 15 };
const TAG_UP = 32, SUB_DOWN = 30;
const DOT_Y = 276;                                      // the particle strip under the curve
const N_DOT = 32;
const DENS_K = 0.55;

const MAP4 = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];
const MAP5 = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

// -- small text helper -----------------------------------------------------------------
function txt(ctx, c, text, x, y, o = {}) {
  ctx.save();
  ctx.font = font(c, o.weight ?? 800, o.size ?? 13, o.display);
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.col ?? c.labelMuted;
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

function dot(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.arc(x, y + 2.5, r, 0, Math.PI * 2);
  ctx.fillStyle = darken(col, 0.4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
}

// -- the three listener glyphs (labels sit under them, so each stays schematic) --------
function speakerGlyph(ctx, x, y, s, col) {
  ctx.fillStyle = col;
  rr(ctx, x - s * 0.46, y - s * 0.17, s * 0.20, s * 0.34, 2.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.26, y - s * 0.17);
  ctx.lineTo(x - s * 0.26, y + s * 0.17);
  ctx.lineTo(x + s * 0.02, y + s * 0.36);
  ctx.lineTo(x + s * 0.02, y - s * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(x + s * 0.12, y, s * (0.17 + i * 0.15), -1.0, 1.0);
    ctx.stroke();
  }
}

function earGlyph(ctx, x, y, s, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(2, s * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();                                    // the outer shell, open at the lobe
  ctx.moveTo(x - s * 0.14, y + s * 0.46);
  ctx.bezierCurveTo(x - s * 0.44, y + s * 0.22, x - s * 0.42, y - s * 0.40, x - s * 0.02, y - s * 0.40);
  ctx.bezierCurveTo(x + s * 0.34, y - s * 0.40, x + s * 0.34, y + s * 0.02, x + s * 0.14, y + s * 0.12);
  ctx.bezierCurveTo(x - s * 0.02, y + s * 0.20, x + s * 0.02, y + s * 0.36, x + s * 0.20, y + s * 0.44);
  ctx.stroke();
  ctx.beginPath();                                    // the whorl
  ctx.moveTo(x + s * 0.00, y + s * 0.24);
  ctx.bezierCurveTo(x - s * 0.18, y + s * 0.12, x - s * 0.12, y - s * 0.14, x + s * 0.06, y - s * 0.12);
  ctx.bezierCurveTo(x + s * 0.18, y - s * 0.10, x + s * 0.14, y + s * 0.04, x + s * 0.02, y + s * 0.08);
  ctx.stroke();
}

function dogGlyph(ctx, x, y, s, col, c) {
  ctx.fillStyle = mix(col, c.bgDeep, 0.18);           // ears first, so the head sits over their roots
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + sx * s * 0.20, y - s * 0.34);
    ctx.quadraticCurveTo(x + sx * s * 0.66, y - s * 0.14, x + sx * s * 0.46, y + s * 0.40);
    ctx.quadraticCurveTo(x + sx * s * 0.26, y + s * 0.22, x + sx * s * 0.16, y - s * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = mix(col, c.bgSurface, 0.28);
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.08, s * 0.36, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.stroke();
  ctx.fillStyle = col;                                // snout and nose
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.16, s * 0.19, s * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix(col, c.bgDeep, 0.5);
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.09, s * 0.06, s * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.bgDeep;                           // eyes
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + sx * s * 0.16, y - s * 0.16, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class PitchLoudnessScene extends SimScene {
  static BEAT_MAPS = { 4: MAP4, 5: MAP5 };
  static BEAT_STEP_MAP = MAP4;
  static CONTINUOUS = false;
  static NOTE_STAGE = 0;
  static ARIA_LABEL = 'One sound wave drawn as a density curve about a dashed average line, with a frequency dial that changes how close the crests sit and an amplitude dial that changes how far each crest swings from the average. Three listeners stand at the right: a speaker, a human ear and a dog. On one beat a picker swaps the source between flute and voice without the curve changing at all; on another the frequency dial is walked up past the point where the speaker and the human ear stop answering while the dog keeps listening.';
  static CONTROLS = [
    { type: 'slider', id: 'frequency', label: 'frequency', min: 0, max: 100, step: 1, value: Math.round(F0 * 100) },
    { type: 'slider', id: 'amplitude', label: 'amplitude', min: 0, max: 100, step: 1, value: Math.round(A0 * 100) },
    {
      type: 'segmented', id: 'source', label: 'source', value: 'flute',
      options: [{ value: 'flute', label: 'flute' }, { value: 'voice', label: 'voice' }],
    },
  ];

  constructor(container, config) {
    super(container, config);
    this._freq = F0;
    this._amp = A0;
    this._src = 'none';                                // 'none' | 'flute' | 'voice'
    this._walk = null;                                 // { key, from, to, t, dur } while a dial walks
    this._drag = -1;                                   // which dial the pointer holds, -1 none
    this._hint = null;                                 // { x, y, t } one-shot invitation ring
    this._edgeSeen = false;                            // the celebration fires once per mount
    this._lit = { spk: 1, ear: 1, dog: 1 };            // 1 lit, 0 grey, eased
    this._fx = new Burst();
    this._appliedKey = '';
  }

  noteRows() {
    return [{ text: 'the two dials fix everything measurable here \u00b7 no hertz, no picture of a flute' }];
  }

  // -- the model: two dials in, one curve out. this._src is not an input here. ----------
  _spacing() { return SP0 * Math.pow(SP1 / SP0, this._freq); }
  _ampPx() { return AMAX * this._amp; }
  _curveY(x) { return AVGY - this._ampPx() * Math.sin((2 * Math.PI * (x - WX0)) / this._spacing()); }
  // Local air density at x: the same curve the panel draws, read as a number.
  _dens(x) { return 1 + DENS_K * this._amp * Math.sin((2 * Math.PI * (x - WX0)) / this._spacing()); }
  // Dot positions uniform in AIR, so denser air takes less room and the dots bunch at each crest.
  _dotXs() {
    const step = (WX1 - WX0) / N_DOT;
    const xs = [];
    for (let x = WX0; x <= WX1;) {
      xs.push(x);
      x += step / this._dens(x + step / 2);
    }
    return xs;
  }
  _crestX(k) { return WX0 + this._spacing() / 4 + k * this._spacing(); }
  _troughX(k) { return WX0 + this._spacing() * 0.75 + k * this._spacing(); }
  _edgeLit() { return this._mount !== 4 || this._freq < EAR_EDGE; }

  _pickStage() { return this._m5() ? 4 : 1; }
  _pickerLive() { return this.stage === this._pickStage(); }
  _words(row) {
    if (this._m5()) return row === 0 ? ['deep', 'shrill'] : ['soft', 'loud'];
    return row === 0 ? ['low', 'high'] : ['small', 'big'];
  }

  // -- the mount: SimScene owns onBeatChange, so the count is read live off beatCount.
  // It is 0 during setup(), which is why the beat's own events are applied from draw()
  // (the first frame after the host has sent its beat), not from enter().
  get _mount() { return (this.beatCount ?? 0) === 5 ? 5 : 4; }
  _m5() { return this._mount === 5; }

  _applyBeat() {
    const key = this._mount + ':' + this.stage;
    if (key === this._appliedKey) return;
    this._appliedKey = key;
    this._beat(this.stage);
    this.requestUiUpdate?.();
  }

  // -- run control --------------------------------------------------------------------
  _setDial(key, v) {
    const u = clamp(v, 0, 1);
    if (key === 'freq') this._freq = u; else this._amp = u;
    if (this._walk && this._walk.key === key) this._walk = null;    // the learner takes the dial
  }

  _walkTo(key, from, to, dur) {
    const d = Math.max(0.3, dur);
    this._walk = { key, from, to, t: 0, dur: d };
    this._setDialRaw(key, from);
    this.animateFor(d * 1000 + 250);
  }

  _setDialRaw(key, v) {
    if (key === 'freq') this._freq = clamp(v, 0, 1); else this._amp = clamp(v, 0, 1);
  }

  // What each beat of each mount asks the panel to do. Idempotent: also called from
  // onBeatChange when the host lands on the stage the scene is already in.
  _beat(stage) {
    if (this._m5()) {
      if (stage === 0) this._walkTo('freq', F0, 0.45, 2.5);
      else if (stage === 2) this._walkTo('amp', this._amp, 0.95, clamp(1.2 + (0.95 - this._amp) * 4, 1.2, 3.2));
      else if (stage === 4) { this._src = 'voice'; this.requestUiUpdate?.(); }
      return;
    }
    if (stage === 2) {
      const from = Math.max(this._freq, F0);
      this._src = 'none';                               // the picker fades back: this beat keeps no source
      this._walkTo('freq', from, 1.0, clamp(1.4 + (1.0 - from) * 4.4, 1.4, 5.4));
    } else if (stage === 1) {
      this._hint = { x: SRC.x, y: SRC.y, t: 0 };
      this.animateFor(1000);
    } else if (stage === 0) {
      this._hint = { x: DIAL.mid, y: DIAL.rows[0], t: 0 };
      this.animateFor(1000);
    }
  }

  enter(stage) {
    this._walk = null;
    this._drag = -1;
    this._fx.parts.length = 0;
    this._fx.rings.length = 0;
    this._fx.twinks.length = 0;
    if (stage === 0) {                                // a fresh mount starts at the defaults
      this._freq = F0;
      this._amp = A0;
      this._src = 'none';
      this._edgeSeen = false;
      this._lit.spk = this._lit.ear = this._lit.dog = 1;
    }
    this._appliedKey = '';                            // this stage's own events wait for draw()
  }

  update(d) {
    const w = this._walk;
    if (w) {
      w.t += d;
      const u = clamp(w.t / w.dur, 0, 1);
      this._setDialRaw(w.key, w.from + (w.to - w.from) * inOutSine(u));
      if (u >= 1) this._walk = null;
    }
    if (this._hint && (this._hint.t += d) > 1.0) this._hint = null;
    const on = this._edgeLit() ? 1 : 0;
    for (const k of ['spk', 'ear', 'dog']) {
      const target = k === 'dog' ? 1 : on;
      if (Math.abs(target - this._lit[k]) > 0.004) this._lit[k] += (target - this._lit[k]) * Math.min(1, d * 9);
    }
    if (!this._edgeSeen && !this._edgeLit() && this.colors) {
      this._edgeSeen = true;
      const x = TILE.xs[2], y = TILE_GLYPH;
      this._fx.ring(x, y, this.colors.good, 46, 0.5, 5);
      this._fx.twinkle(x, y, [this.colors.gold, this.colors.good, this.colors.accent], 8, 42);
    }
    this._fx.update(d);
  }

  busy() {
    if (this._walk || this._hint || this._fx.alive) return true;
    if (this._drag >= 0) return true;
    const on = this._edgeLit() ? 1 : 0;
    return Math.abs(on - this._lit.spk) > 0.01 || Math.abs(on - this._lit.ear) > 0.01 || Math.abs(1 - this._lit.dog) > 0.01;
  }

  // -- the host's control bar ---------------------------------------------------------
  isControlHidden(id) { return id === 'source' && !this._pickerLive(); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'frequency') this._setDial('freq', Number(v) / 100);
    else if (id === 'amplitude') this._setDial('amp', Number(v) / 100);
    else if (id === 'source') { this._src = v === 'voice' ? 'voice' : 'flute'; this.animateFor(400); }
    this.requestUiUpdate?.();
  }

  getControlValue(id) {
    if (id === 'frequency') return Math.round(this._freq * 100);
    if (id === 'amplitude') return Math.round(this._amp * 100);
    if (id === 'source') return this._src === 'voice' ? 'voice' : 'flute';
    return super.getControlValue(id);
  }

  // -- pointer: the two dials, and the source chip while the picker is live ------------
  _hitDial(p) {
    for (let i = 0; i < 2; i++) {
      if (Math.abs(p.y - DIAL.rows[i]) <= 26 && p.x >= DIAL.x0 - 26 && p.x <= DIAL.x1 + 26) return i;
    }
    return -1;
  }

  _dialFromX(i, x) { return clamp((x - DIAL.x0) / (DIAL.x1 - DIAL.x0), 0, 1); }

  _onSource(p) {
    if (!this._pickerLive()) return false;
    const b = this._srcBox || { x0: SRC.x - 40, y0: SRC.chip - 14, w: 80, h: 28 };
    const onChip = p.x > b.x0 - 10 && p.x < b.x0 + b.w + 10 && p.y > b.y0 - 8 && p.y < b.y0 + b.h + 8;
    return onChip || Math.hypot(p.x - SRC.x, p.y - SRC.y) < SRC.r + 12;
  }

  _pick() {
    this._src = this._src === 'flute' ? 'voice' : 'flute';
    this.animateFor(400);
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this._onSource(p)) { this._pick(); return; }
    const i = this._hitDial(p);
    if (i < 0) return;
    this._drag = i;
    this._setDial(i === 0 ? 'freq' : 'amp', this._dialFromX(i, p.x));
    this.animateFor(500);
  }

  pointerMove(p) {
    if (this._drag < 0) return false;
    this._setDial(this._drag === 0 ? 'freq' : 'amp', this._dialFromX(this._drag, p.x));
    this.animateFor(300);
    return true;
  }

  pointerUp() { this._drag = -1; }

  // -- drawing -------------------------------------------------------------------------
  _srcWord() { return this._src === 'none' ? 'one source' : this._src; }
  _srcCol(c) { return this._src === 'flute' ? c.s1 : this._src === 'voice' ? c.s2 : c.accent; }

  _drawWave(ctx, c) {
    const sp = this._spacing();
    const steps = 120;
    ctx.save();                                       // the density fill, between curve and average
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = WX0 + (WX1 - WX0) * i / steps;
      const y = this._curveY(x);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.lineTo(WX1, AVGY);
    ctx.lineTo(WX0, AVGY);
    ctx.closePath();
    ctx.fillStyle = alpha(c.accent, 0.2);
    ctx.fill();
    ctx.beginPath();                                  // the curve itself
    for (let i = 0; i <= steps; i++) {
      const x = WX0 + (WX1 - WX0) * i / steps;
      const y = this._curveY(x);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    for (let k = 0, x = this._crestX(0); x <= WX1; k++, x = this._crestX(k)) {
      dot(ctx, x, this._curveY(x), 3.2, lighten(c.accent, 0.28));   // one dot per crest: countable
    }
    ctx.setLineDash([7, 7]);                          // the average density line
    ctx.strokeStyle = alpha(c.label, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WX0, AVGY);
    ctx.lineTo(AXE, AVGY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = alpha(c.accent, 0.5);          // the air itself, one dot per lump of air
    for (const x of this._dotXs()) {
      ctx.beginPath();
      ctx.arc(x, DOT_Y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // The nearest crest / trough to a label's own x, so the leader stays short at any spacing.
  _nearest(which, near) {
    const at = which === 'crest' ? (k) => this._crestX(k) : (k) => this._troughX(k);
    let k = 0, best = at(0), bd = Infinity;
    for (; k < 40; k++) {
      const x = at(k);
      if (x < WX0 - 4) continue;
      if (x > WX1 + 4) break;
      const d = Math.abs(x - near);
      if (d < bd) { bd = d; best = x; }
    }
    return best;
  }

  _drawWaveLabels(ctx, c) {
    // Below a quarter of the full swing there is no crest or trough left to point at.
    if (this._ampPx() >= 15) {
      const cx = this._nearest('crest', 176);
      txt(ctx, c, 'crest', 170, 120, { size: 13 });
      leader(ctx, 172, 132, cx, Math.max(this._curveY(cx) - 8, 138), alpha(c.label, 0.5));
      const tx = this._nearest('trough', 266);
      txt(ctx, c, 'trough', 260, 300, { size: 13 });
      leader(ctx, 262, 288, tx, this._curveY(tx) + 8, alpha(c.label, 0.5));
    }
    txt(ctx, c, 'average density', 296, 106, { size: 13, col: c.labelMuted });
    leader(ctx, 296, 120, 296, AVGY - 6, alpha(c.label, 0.4));
  }

  _drawSource(ctx, c) {
    const col = this._srcCol(c);
    dot(ctx, SRC.x, SRC.y, SRC.r + 6, mix(c.bgSurface, c.stroke, 0.35));   // the source plate
    dot(ctx, SRC.x, SRC.y, SRC.r + 3, mix(c.bgSurface, c.stroke, 0.55));
    if (this._src === 'flute') this._flute(ctx, c, SRC.x, SRC.y, 26, col);
    else if (this._src === 'voice') this._voice(ctx, c, SRC.x, SRC.y, 26, col);
    else dot(ctx, SRC.x, SRC.y, 6, alpha(c.label, 0.55));
    ctx.save();
    ctx.setLineDash([3, 5]);                          // the connector from chip to marker
    ctx.strokeStyle = alpha(c.label, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SRC.x, SRC.chip + 16);
    ctx.lineTo(SRC.x, SRC.y - SRC.r - 6);
    ctx.stroke();
    ctx.restore();
    const live = this._pickerLive();
    this._srcBox = pill(ctx, c, this._srcWord(), SRC.x, SRC.chip, {
      size: 13, bg: live ? lighten(col, 0.12) : col, align: 'center',
    });
  }

  _flute(ctx, c, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-16 * RAD);
    ctx.fillStyle = col;
    rr(ctx, -s * 0.5, -s * 0.14, s, s * 0.28, s * 0.14);
    ctx.fill();
    ctx.fillStyle = mix(col, c.bgDeep, 0.55);   // the keys
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-s * 0.24 + i * s * 0.26, 0, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = col;                                  // the embouchure lip
    rr(ctx, s * 0.38, -s * 0.26, s * 0.12, s * 0.2, s * 0.05);
    ctx.fill();
    ctx.restore();
  }

  _voice(ctx, c, x, y, s, col) {
    const plate = mix(c.bgSurface, c.bgDeep, 0.3);      // the colour the mouth is cut out in
    ctx.fillStyle = col;
    ctx.beginPath();                                     // the head
    ctx.arc(x - s * 0.10, y - s * 0.10, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = plate;                               // the open mouth, cut into it
    ctx.beginPath();
    ctx.moveTo(x + s * 0.10, y - s * 0.30);
    ctx.lineTo(x + s * 0.52, y - s * 0.06);
    ctx.lineTo(x + s * 0.08, y + s * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = col;                               // the sound leaving the mouth
    ctx.lineWidth = Math.max(2, s * 0.1);
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(x + s * 0.14, y - s * 0.08, s * (0.16 + i * 0.15), -0.85, 0.85);
      ctx.stroke();
    }
    ctx.strokeStyle = alpha(col, 0.8);                   // the throat
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.04, y + s * 0.26);
    ctx.quadraticCurveTo(x + s * 0.14, y + s * 0.36, x + s * 0.20, y + s * 0.48);
    ctx.stroke();
  }

  _drawTiles(ctx, c) {
    const cols = [this._srcCol(c), c.accent, c.good];
    const words = [['speaker'], ['human', 'ear'], ['dog']];
    for (let i = 0; i < 3; i++) {
      const x = TILE.xs[i], y = TILE.y, w = TILE.w, h = TILE.h;
      const lit = this._lit[['spk', 'ear', 'dog'][i]];
      const col = mix(c.stroke, cols[i], 0.22 + 0.78 * lit);
      rr(ctx, x - w / 2, y, w, h, 10);
      ctx.fillStyle = mix(c.bgSurface, c.bgDeep, 0.55 - 0.45 * lit);
      ctx.fill();
      ctx.strokeStyle = alpha(c.stroke, 0.3 + 0.4 * lit);
      ctx.lineWidth = 2;
      ctx.stroke();
      const g = col;                                     // a greyed tile keeps its glyph, unlit
      if (i === 0) speakerGlyph(ctx, x, TILE_GLYPH, 34, g);
      else if (i === 1) earGlyph(ctx, x, TILE_GLYPH, 34, g);
      else dogGlyph(ctx, x, TILE_GLYPH, 34, g, c);
      const ink = mix(c.labelMuted, c.label, lit);
      const lineY = words[i].length > 1 ? TILE_GLYPH + 34 : TILE_GLYPH + 40;
      words[i].forEach((w2, j) => txt(ctx, c, w2, x, lineY + j * 17, { size: 13, col: ink }));
    }
  }

  _drawDial(ctx, c, i) {
    const y = DIAL.rows[i];
    const v = i === 0 ? this._freq : this._amp;
    const col = i === 0 ? c.accent : c.s3;
    const [wa, wb] = this._words(i);
    const wbg = mix(c.bgSurface, c.label, 0.18);
    pill(ctx, c, wa, DIAL.x0 + 36, y - TAG_UP, { size: 13, bg: wbg, ink: c.labelMuted });
    pill(ctx, c, wb, DIAL.x1 - 36, y - TAG_UP, { size: 13, bg: wbg, ink: c.labelMuted });
    drawMeter(ctx, c, DIAL.x0, y - 6, DIAL.x1 - DIAL.x0, 12, v, { col });
    const kx = DIAL.x0 + (DIAL.x1 - DIAL.x0) * v;
    dot(ctx, kx, y, DIAL.r, c.raised);
    dot(ctx, kx, y, 4.5, col);
    pill(ctx, c, i === 0 ? 'frequency' : 'amplitude', DIAL.tag, y, { size: 13, bg: c.raised, ink: c.label });
  }

  _drawPop(ctx, c, text, x, y, bg, at) {
    const p = popAt(this.age, at);
    if (!p) return;
    pill(ctx, c, text, x, y, { size: 13, bg, scale: p.scale, alpha: p.alpha, pop: p.u });
  }

  draw(ctx, c) {
    this._applyBeat();
    drawBackdrop(ctx, c, 'dots');
    drawCard(ctx, c, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 1, { r: 14 });
    this._drawWave(ctx, c);
    this._drawWaveLabels(ctx, c);
    this._drawSource(ctx, c);
    this._drawTiles(ctx, c);
    this._drawDial(ctx, c, 0);
    this._drawDial(ctx, c, 1);
    if (this._m5()) {                                  // the 5-beat mount's extra tags
      if (this.stage >= 1) this._drawPop(ctx, c, 'pitch', DIAL.mid, DIAL.rows[0] - TAG_UP, c.accent, 0);
      if (this.stage >= 2) this._drawPop(ctx, c, 'loudness', DIAL.mid, DIAL.rows[1] - TAG_UP, c.s3, 0);
      if (this.stage >= 4) this._drawPop(ctx, c, 'voice', DIAL.mid, DIAL.rows[0] + SUB_DOWN, this._srcCol(c), 0);
    }
    if (this._hint) {                                  // one-shot invitation ring, never a loop
      const u = clamp(this._hint.t / 1.0, 0, 1);
      const r = 22 + u * 40;
      ctx.save();
      ctx.globalAlpha = (1 - u) * 0.9;
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this._hint.x, this._hint.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this._fx.draw(ctx);
  }
}