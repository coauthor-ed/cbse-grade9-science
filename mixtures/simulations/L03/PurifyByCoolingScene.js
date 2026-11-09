// PurifyByCoolingScene - blk-l03-s03b. Why crystals come out pure.
//
// One beaker: 100 g of water, 60 g of potassium nitrate and 5 g (or 50 g) of common salt.
// A gauge either side of it shows the amount of that solid in the beaker and its limit in water at
// this temperature. The nitrate's limit falls through the 60 g mark near 39 C; the salt's limit
// hardly moves. In the liquid each dot is one gram still dissolved, so at 20 C the nitrate dots have
// gone to the crystals on the floor and the salt dots are all still swimming: that is the idea.
//
//   stage 0  80 C, everything dissolved. Two limits, two amounts.
//   stage 1  the learner cools it. The find is the first crystal, as the limit crosses 60 g.
//   stage 2  20 C: 28 g of crystals, 5 g of salt still dissolved.
//   stage 3  the same, with the salt control live: 50 g is over its limit even hot.
//
// Numbers: the book's Table 5.4, straight lines between its temperatures.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, font, pill, chipRow, rr, drawBackdrop, drawFloor, drawBench, drawShadow, drawCard,
  clamp, mulberry32,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const DEG = '\u00b0';

const KNO3 = [[10, 21], [20, 32], [30, 45], [40, 62], [60, 106], [80, 167]];
const NACL = [[10, 36], [20, 36], [30, 36.3], [40, 36.5], [60, 37], [80, 37]];
const at = (pts, t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i += 1) {
    if (t <= pts[i][0]) {
      const [t1, g1] = pts[i], [t0, g0] = pts[i - 1];
      return g0 + ((g1 - g0) * (t - t0)) / (t1 - t0);
    }
  }
  return pts[pts.length - 1][1];
};

const NITRATE_G = 60;
const T_MIN = 20, T_MAX = 80;
const GAUGE_MAX = 175;
const BENCH_Y = 446;
const BK = { x: 170, y: 116, w: 340, h: 330 };
const FILL = 0.8;
const GA = { y: 118, h: 268, w: 40 };
const G_SALT = { x: 62, tone: 's8', ink: 's8ink', name: 'salt' };
const G_NIT = { x: 578, tone: 's5', ink: 's5ink', name: 'nitrate' };

export class PurifyByCoolingScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A beaker holding potassium nitrate and common salt dissolved in 100 g of hot water, with a gauge for each solid showing how much is in the beaker and its limit at this temperature. As the solution cools, the limit for potassium nitrate falls past the amount present and crystals form, while the salt stays far below its limit and stays dissolved.';
  static CONTROLS = [
    { type: 'slider', id: 'temp', label: 'Temperature', min: T_MIN, max: T_MAX, step: 1, value: 80, suffix: ` ${DEG}C` },
    { type: 'segmented', id: 'salt', label: 'Salt in the mixture', value: '5', options: [{ value: '5', label: '5 g' }, { value: '50', label: '50 g' }] },
  ];

  constructor(container, config) {
    super(container, config);
    this._T = 80;
    this._saltG = 5;
    this._showK = 0;           // nitrate crystals as drawn, g
    this._showS = 0;           // salt solid as drawn, g
    this._found = false;
    this._pts = null;
  }

  get _crystals() { return Math.max(0, NITRATE_G - at(KNO3, this._T)); }
  get _saltSolid() { return Math.max(0, this._saltG - at(NACL, this._T)); }

  /** One dot per gram in the liquid, seeded, so the picture is the same on every mount. */
  _dots() {
    if (this._pts) return this._pts;
    const rnd = mulberry32(11);
    const mk = (n) => Array.from({ length: n }, () => ({ u: rnd(), v: rnd() }));
    this._pts = { nit: mk(NITRATE_G), salt: mk(50) };
    return this._pts;
  }

  enter(stage) {
    this._T = stage >= 2 ? 20 : 80;
    this._saltG = 5;
    this._showK = this._crystals;
    this._showS = this._saltSolid;
    this._found = false;
  }

  isControlHidden(id) {
    if (id === 'temp') return this.stage === 0;
    if (id === 'salt') return this.stage !== 3;
    return false;
  }

  getControlValue(id) {
    if (id === 'temp') return String(this._T);
    if (id === 'salt') return String(this._saltG);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'temp') {
      this._T = clamp(Math.round(Number(v)), T_MIN, T_MAX);
      if (this.stage === 1 && !this._found && this._crystals > 0) {
        this._found = true;
        this.celebrate(BK.x + BK.w / 2, BK.y + BK.h - 60, 18, { key: 'first-crystals' });
      }
    } else if (id === 'salt') {
      this._saltG = Number(v) === 50 ? 50 : 5;
    }
    this.animateFor(1000);
    this.requestUiUpdate?.();
  }

  update(d) {
    const k = Math.min(1, d * 7);
    this._showK += (this._crystals - this._showK) * k;
    this._showS += (this._saltSolid - this._showS) * k;
    if (Math.abs(this._crystals - this._showK) < 0.05) this._showK = this._crystals;
    if (Math.abs(this._saltSolid - this._showS) < 0.05) this._showS = this._saltSolid;
  }

  busy() { return this._showK !== this._crystals || this._showS !== this._saltSolid; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 498);
    drawBench(ctx, c, 0, 680, BENCH_Y, { h: 52 });
    this._beaker(ctx, c);
    this._gauge(ctx, c, G_SALT, this._saltG, at(NACL, this._T));
    this._gauge(ctx, c, G_NIT, NITRATE_G, at(KNO3, this._T));
    pill(ctx, c, `${this._T} ${DEG}C`, 340, 60, { bg: c.raised, ink: c.label, size: fs(30), display: true });
    if (this.stage === 0) {
      chipRow(ctx, c, [{ text: 'each dot is 1 g dissolved', bg: c.raised, ink: c.label }], BK.x + BK.w / 2, BK.y + BK.h - 34, { size: fs(16), align: 'center' });
    }
    if (this.stage === 1 && !this._found) {
      chipRow(ctx, c, [{ text: 'cool it slowly', bg: c.warning }], 340, 100, { size: fs(16), align: 'center' });
    }
    if (this.stage === 2 && this._crystals > 1) {
      pill(ctx, c, `${Math.round(this._crystals)} g crystals`, BK.x + BK.w / 2, BK.y + BK.h - 142, { bg: c.s5, size: fs(18), display: true });
    }
    if (this.stage === 3 && this._saltG === 50 && this._saltSolid > 1) {
      pill(ctx, c, 'crystals and salt mixed', BK.x + BK.w / 2, BK.y + BK.h - 150, { bg: c.warning, size: fs(18), display: true });
    }
  }

  _beaker(ctx, c) {
    const g = glassBox('beaker', BK.x, BK.y, BK.w, BK.h, { wall: 6, r: 14 });
    drawShadow(ctx, c, BK.x + BK.w / 2, BENCH_Y + 2, BK.w * 0.52, 8);
    drawGlass(ctx, c, g, { shadow: false, ticks: 6 });
    const sy = drawGlassLiquid(ctx, c, g, { level: FILL, fill: mix(c.glass, c.bgSurface, 0.3), opacity: 0.4 });
    const i = g.inner;
    const box = { x: i.x + 16, y: sy + 14, w: i.w - 32, h: g.floor - sy - 40 };
    const P = this._dots();
    const nitLeft = Math.round(NITRATE_G - this._showK);
    const saltLeft = Math.round(this._saltG - this._showS);
    const dot = (p, col, r) => {
      ctx.beginPath(); ctx.arc(box.x + p.u * box.w, box.y + p.v * box.h, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = alpha(darken(col, 0.45), 0.7); ctx.lineWidth = 1.2; ctx.stroke();
    };
    for (let n = 0; n < nitLeft; n += 1) dot(P.nit[n], c.s5, PHONE ? 6 : 4.5);
    for (let n = 0; n < saltLeft; n += 1) dot(P.salt[n], c.s8, PHONE ? 7.5 : 6.5);
    this._floorCrystals(ctx, c, g);
  }

  /** Needles of potassium nitrate and cubes of salt on the floor of the beaker. */
  _floorCrystals(ctx, c, g) {
    const i = g.inner;
    const nNeedles = Math.round(this._showK * 1.6);
    const rnd = mulberry32(5);
    ctx.save();
    ctx.beginPath(); ctx.rect(i.x, i.y, i.w, i.h); ctx.clip();
    for (let n = 0; n < nNeedles; n += 1) {
      const x = i.x + 18 + rnd() * (i.w - 36);
      const row = rnd();
      const y = g.floor - 4 - row * row * Math.min(90, 8 + this._showK * 1.7);
      const a = (rnd() - 0.5) * 2.4;
      const L = 15 + rnd() * 15;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L + 4, -3.6); ctx.lineTo(L - 4, -3.6); ctx.lineTo(L, 0); ctx.lineTo(L - 4, 3.6); ctx.lineTo(-L + 4, 3.6); ctx.closePath();
      ctx.fillStyle = lighten(c.s5, 0.42); ctx.fill();
      ctx.strokeStyle = darken(c.s5, 0.3); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    }
    const nCubes = Math.round(this._showS * 1.3);
    for (let n = 0; n < nCubes; n += 1) {
      const x = i.x + 18 + rnd() * (i.w - 36);
      const y = g.floor - 14 - rnd() * 30;
      const s = 10 + rnd() * 5;
      rr(ctx, x - s / 2, y - s / 2, s, s, 2);
      ctx.fillStyle = lighten(c.s8, 0.3); ctx.fill();
      ctx.strokeStyle = darken(c.s8, 0.35); ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * One gauge: the bar is the amount of this solid in the beaker, the line is its limit in water at
   * this temperature. Anything above the line cannot stay dissolved, so it is drawn as solid.
   */
  _gauge(ctx, c, G, amount, limit) {
    const col = c[G.tone], ink = c[G.ink];
    const Y = (g) => GA.y + GA.h - (g / GAUGE_MAX) * GA.h;
    const x = G.x - GA.w / 2;
    drawCard(ctx, c, x - 34, GA.y - 42, GA.w + 68, GA.h + 112, 1, { r: 14 });
    rr(ctx, x, GA.y, GA.w, GA.h, 10);
    ctx.fillStyle = mix(c.bgDeep, c.track, 0.5); ctx.fill();
    ctx.save();
    rr(ctx, x, GA.y, GA.w, GA.h, 10); ctx.clip();
    const dis = Math.min(amount, limit);
    ctx.fillStyle = col;
    ctx.fillRect(x, Y(dis), GA.w, GA.y + GA.h - Y(dis));
    if (amount > limit) {
      ctx.fillStyle = lighten(col, 0.5);
      ctx.fillRect(x, Y(amount), GA.w, Y(limit) - Y(amount));
      ctx.save();
      ctx.beginPath(); ctx.rect(x, Y(amount), GA.w, Y(limit) - Y(amount)); ctx.clip();
      ctx.strokeStyle = alpha(darken(col, 0.3), 0.7); ctx.lineWidth = 2;
      for (let yy = Y(amount) - 40; yy < Y(limit) + 20; yy += 11) {
        ctx.beginPath(); ctx.moveTo(x, yy + 22); ctx.lineTo(x + GA.w, yy - 8); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    rr(ctx, x, GA.y, GA.w, GA.h, 10);
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 2.5; ctx.stroke();
    // the limit line
    const ly = Y(Math.min(limit, GAUGE_MAX));
    ctx.fillStyle = c.label;
    rr(ctx, x - 9, ly - 2.5, GA.w + 18, 5, 2.5); ctx.fill();

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = font(c, 700, fs(17), true); ctx.fillStyle = ink;
    ctx.fillText(`${G.name} ${amount} g`, G.x, GA.y - 16, GA.w + 60);
    const by = GA.y + GA.h;
    ctx.font = font(c, 700, fs(15)); ctx.fillStyle = c.labelMuted;
    ctx.fillText('limit', G.x, by + 22);
    ctx.font = font(c, 700, fs(24), true); ctx.fillStyle = c.label;
    ctx.fillText(`${Math.round(limit)} g`, G.x, by + 48);
  }
}
