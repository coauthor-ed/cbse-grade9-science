/**
 * SalineDripScene - blk-l02-s01, a drip bottle that must be right.
 *
 * One big hanging bottle, two sliders, one reading. The salt is drawn as white specks: the number of
 * specks is the mass of salt, and they spread through whatever solution there is. So more solution
 * thins them out and more salt crowds them, which IS concentration, before any number is read.
 *   b0  match the label: 0.9 g in every 100 mL. Any matching pair counts (1.8 g in 200 mL as well).
 *   b1  the same bottle, with its parts named: solute, solvent, solution.
 *   b2  the reading takes its proper name, concentration.
 * The bottle hangs mouth down, so the liquid pools at the neck and the level is read from there.
 * The patient is cut: the tube leaves the frame.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, mulberry32, lighten, darken, font, pill, rr, inkOn, clamp01, outBack,
  drawBackdrop, drawCard, drawFloor, drawShadow,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, glassPath, drawGlass } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const TARGET = 0.9;
const TOL = 0.004;
const ML_MAX = 500;
const SALT_0 = 1.2, ML_0 = 100;
const SPECKS_PER_G = 24;
const DRIP_S = 2.4;

const FLOOR_Y = 452;
const POLE_X = 96, POLE_TOP = 18;
const G = glassBox('bottle', 158, 30, 226, 304, { neck: 0.3, wall: 6, r: 14 });
const MID = G.y + G.h / 2;                 // the bottle is drawn flipped about this line
const MOUTH = G.y + G.h;
const BODY_TOP = G.y + 14, BODY_LOW = MOUTH - G.h * 0.32;    // the straight part of the hanging bottle
const CHAMBER = { x: G.cx - 23, y: MOUTH + 16, w: 46, h: 56 };
const CARD = { x: 436, y: 44, w: 228, h: 366 };
const METER = { x: CARD.x + 20, y: 196, w: CARD.w - 40, max: 2 };

const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
const S_MATCH = 0, S_PARTS = 1, S_WORD = 2;

export class SalineDripScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL =
    'A big glass drip bottle hangs mouth down from a stand. White specks in the liquid show the salt. A slider sets the '
    + 'grams of salt and another the millilitres of solution; the specks crowd together or spread out. A reading gives '
    + 'the percentage of salt and says whether it matches the label, 0.9 g in every 100 mL. The parts are then named: '
    + 'salt the solute, water the solvent, and the whole the solution.';
  static CONTROLS = [
    { type: 'slider', id: 'salt', label: 'Salt', min: 0.1, max: 3, step: 0.1, value: SALT_0, suffix: ' g' },
    { type: 'slider', id: 'ml', label: 'Solution', min: 50, max: ML_MAX, step: 10, value: ML_0, suffix: ' mL' },
  ];

  constructor(container, config) {
    super(container, config);
    this._salt = SALT_0;
    this._ml = ML_0;
    this._drip = 0;
    this._found = false;
    const rnd = mulberry32(11);
    this._specks = [];                               // a jittered grid, so they spread without clumps or rows
    for (let i = 0; i < 90; i++) {
      this._specks.push({ u: ((i * 7) % 10 + rnd() * 0.8) / 10, v: ((i * 11) % 9 + rnd() * 0.8) / 9 });
    }
  }

  get _pct() { return (this._salt / this._ml) * 100; }
  get _ok() { return Math.abs(this._pct - TARGET) <= TOL; }

  enter() { this._drip = DRIP_S; }

  update(d) { if (this._drip > 0) this._drip = Math.max(0, this._drip - d); }

  busy() { return this._drip > 0; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'salt') this._salt = Math.round(Number(v) * 10) / 10;
    if (id === 'ml') this._ml = Number(v);
    this._drip = DRIP_S;
    if (this._ok && !this._found) {
      this._found = true;
      this.celebrate(G.cx, this._levelY() + 60, 24, { key: 'label-matched', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  getControlValue(id) {
    if (id === 'salt') return String(this._salt);
    if (id === 'ml') return String(this._ml);
    return super.getControlValue(id);
  }

  _levelY() { return BODY_LOW - (BODY_LOW - BODY_TOP) * clamp01(this._ml / ML_MAX); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR_Y);
    this._stand(ctx, c);
    this._line(ctx, c);
    this._bottle(ctx, c);
    this._chamber(ctx, c);
    this._card(ctx, c);
  }

  _stand(ctx, c) {
    const steel = mix(c.stroke, c.label, 0.4);
    ctx.fillStyle = darken(steel, 0.35);
    rr(ctx, POLE_X - 7, POLE_TOP, 14, FLOOR_Y - POLE_TOP - 6, 6); ctx.fill();
    ctx.fillStyle = steel;
    rr(ctx, POLE_X - 4, POLE_TOP + 2, 7, FLOOR_Y - POLE_TOP - 10, 3); ctx.fill();
    drawShadow(ctx, c, POLE_X, FLOOR_Y + 4, 66, 7);
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(steel, 0.2);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(POLE_X - 58, FLOOR_Y); ctx.lineTo(POLE_X, FLOOR_Y - 24); ctx.lineTo(POLE_X + 58, FLOOR_Y);
    ctx.stroke();
    ctx.strokeStyle = steel;
    ctx.lineWidth = 7;
    ctx.beginPath();                                 // the arm, and the band that carries the bottle
    ctx.moveTo(POLE_X, 26); ctx.lineTo(G.cx, 26); ctx.lineTo(G.cx, G.y + 2);
    ctx.stroke();
  }

  /** Mouth down: the kit's bottle drawn in a flip, and the liquid clipped to the flipped cavity. */
  _bottle(ctx, c) {
    const flip = () => { ctx.translate(0, MID * 2); ctx.scale(1, -1); };
    ctx.save(); flip();
    drawGlass(ctx, c, G, { shadow: false, rim: false });
    ctx.restore();

    const sy = this._levelY();
    ctx.save();
    flip();
    glassPath(ctx, G, G.inner);
    flip();                                          // the path is set: back to plain space
    ctx.clip();
    const lg = ctx.createLinearGradient(0, sy, 0, MOUTH);
    lg.addColorStop(0, alpha(lighten(c.water, 0.35), 0.5));
    lg.addColorStop(1, alpha(c.water, 0.62));
    ctx.fillStyle = lg;
    ctx.fillRect(G.x, sy, G.w, MOUTH - sy);
    ctx.fillStyle = alpha(lighten(c.water, 0.7), 0.9);
    ctx.fillRect(G.x, sy - 1.5, G.w, 3.5);
    this._saltSpecks(ctx, c, sy);
    ctx.restore();

    ctx.fillStyle = darken(c.glass, 0.35);           // the stopper in the neck
    rr(ctx, G.cx - 34, MOUTH - 4, 68, 18, 5); ctx.fill();
    this._marks(ctx, c);
    this._label(ctx, c);
  }

  /** One speck per bit of salt, spread evenly through whatever liquid there is. */
  _saltSpecks(ctx, c, sy) {
    const n = Math.round(this._salt * SPECKS_PER_G);
    const x0 = G.inner.x + 14, w = G.inner.w - 28, h = BODY_LOW + 24 - sy;
    const glow = this.stage === S_PARTS;
    for (let i = 0; i < n; i++) {
      const p = this._specks[i % this._specks.length];
      const x = x0 + p.u * w, y = sy + 8 + p.v * (h - 12);
      ctx.fillStyle = darken(c.glass, 0.34);
      ctx.beginPath(); ctx.arc(x + 0.8, y + 1, glow ? 5 : 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lighten(c.glass, 0.94);
      ctx.beginPath(); ctx.arc(x, y, glow ? 5 : 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  _marks(ctx, c) {
    const x = G.x + G.w + 6;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = font(c, 700, PHONE ? 23 : 14);
    for (let ml = 100; ml <= ML_MAX; ml += 100) {
      const y = BODY_LOW - (BODY_LOW - BODY_TOP) * (ml / ML_MAX);
      ctx.fillStyle = c.label;
      ctx.fillRect(G.x + G.w - 18, y - 1, 18, 2.5);
      if (!PHONE || ml % 200 === 100) ctx.fillText(String(ml), x, y);      // a phone has room for every other number
    }
  }

  /** A paper label wrapped round the bottle, as the book's figure shows it. */
  _label(ctx, c) {
    const w = PHONE ? 176 : 132, h = 56, x = G.x + 26 - (w - 132) / 2, y = 90;
    const paper = lighten(c.glass, 0.92);
    ctx.fillStyle = darken(paper, 0.2);
    rr(ctx, x, y + 3, w, h, 6); ctx.fill();
    ctx.fillStyle = paper;
    rr(ctx, x, y, w, h, 6); ctx.fill();
    ctx.fillStyle = inkOn(c, paper);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, fs(22), true);
    ctx.fillText('0.9 %', x + w / 2, y + 20);
    ctx.font = font(c, 700, PHONE ? 20 : 14);
    ctx.fillText('sodium chloride', x + w / 2, y + 42);
  }

  _chamber(ctx, c) {
    const { x, y, w, h } = CHAMBER;
    const g = glassBox('tube', x, y, w, h, { wall: 3, r: 12 });
    drawGlass(ctx, c, g, { shadow: false, rim: false });
    ctx.fillStyle = alpha(c.water, 0.6);
    rr(ctx, x + 4, y + h * 0.62, w - 8, h * 0.38 - 4, 10); ctx.fill();
    if (this._drip > 0) {
      const u = (this.clock * 1.3) % 1;
      ctx.fillStyle = mix(c.water, c.glass, 0.3);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 4 + (h * 0.58) * u, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _line(ctx, c) {
    const x0 = G.cx, y0 = CHAMBER.y + CHAMBER.h - 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(c.glass, 0.75);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0, y0 + 56, 330, 440, 410, 524);
    ctx.stroke();
  }

  _card(ctx, c) {
    const r = CARD;
    const ok = this._ok;
    const high = this._pct > TARGET;
    drawCard(ctx, c, r.x, r.y, r.w, r.h, 1, { accent: ok ? c.good : c.accent });
    const cx = r.x + r.w / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.labelMuted;
    ctx.font = font(c, 800, PHONE ? 21 : 16);
    ctx.fillText(this.stage === S_WORD ? 'concentration' : 'salt in the solution', cx, r.y + 30);
    ctx.fillStyle = c.label;
    ctx.font = font(c, 800, 54, true);
    ctx.fillText(`${this._pct.toFixed(2)} %`, cx, r.y + 82);
    this._meter(ctx, c);
    if (this.stage === S_PARTS) { this._parts(ctx, c); return; }
    pill(ctx, c, ok ? 'matches the label' : high ? 'too strong' : 'too weak', cx, 276, { bg: ok ? c.good : c.warning, size: fs(20) });
    ctx.fillStyle = c.labelMuted;
    ctx.font = font(c, 700, PHONE ? 21 : 16);
    ctx.fillText('label: 0.9 g in 100 mL', cx, 330);
    ctx.fillStyle = c.label;
    ctx.font = font(c, 800, PHONE ? 21 : 18, true);
    ctx.fillText(`yours: ${this._salt} g in ${this._ml} mL`, cx, 362);
  }

  _meter(ctx, c) {
    const m = METER;
    const px = (v) => m.x + m.w * clamp01(v / m.max);
    ctx.fillStyle = c.track ?? alpha(c.label, 0.14);
    rr(ctx, m.x, m.y, m.w, 14, 7); ctx.fill();
    ctx.fillStyle = c.good;
    rr(ctx, px(TARGET) - 7, m.y - 3, 14, 20, 5); ctx.fill();
    const x = px(this._pct);
    ctx.fillStyle = c.label;
    ctx.beginPath();
    ctx.moveTo(x, m.y - 1); ctx.lineTo(x - 9, m.y - 15); ctx.lineTo(x + 9, m.y - 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.labelMuted;
    ctx.font = font(c, 700, fs(14));
    ctx.textAlign = 'center';
    ctx.fillText('0.9 %', px(TARGET), m.y + 30);
  }

  /** The parts of the bottle, by name. The specks above light up as the solute. */
  _parts(ctx, c) {
    const k = outBack(clamp01(this.age / 0.45));
    const rows = [
      ['solute', 'salt', c.s5],
      ['solvent', 'water', c.s1],
      ['solution', 'both', c.s3],
    ];
    rows.forEach(([word, what, col], i) => {
      const y = 262 + i * 46;
      const x = CARD.x + 18;
      ctx.save();
      ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
      pill(ctx, c, word, x + (PHONE ? 58 : 52), y, { bg: col, size: PHONE ? 22 : 18 });
      ctx.restore();
      ctx.fillStyle = c.label;
      ctx.font = font(c, 700, PHONE ? 22 : 16);
      ctx.textAlign = 'left';
      ctx.fillText(what, x + (PHONE ? 132 : 114), y);
    });
  }
}
