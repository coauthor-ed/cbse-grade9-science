// SaltPanScene - blk-l03-s06. A salt pan by the sea, cut open so the water can be seen.
//
// It is day in both themes: this scene has its own time of day (Quill card, rule 5).
// The learner sets the sun and the wind and runs the pan. The water falls and stays clear for a long
// time, because seawater holds about 3.5 g of salt per 100 g: the solution is saturated only when
// about nine-tenths of the water has gone (35 g of salt needs about 97 g of water, of 965 g).
// That is the teaching point of the first beat: evaporation first, crystals much later.
//   stage 0  run to the end. Water falls, salt stays.
//   stage 1  the run stops at saturated. Pressing Run again makes the crystals form: that is the find.
//   stage 2  the same pan; the speed of the run sets the size of the crystals.
// Depth in the pan is drawn to scale with the water left. Times are not to scale.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lighten, darken, hsl, hslOf, font, pill, rr, inkOn, clamp, mulberry32, drawCard } from 'simulations/base/kit/SimLook.js';
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const SAT_LEVEL = 0.1;        // the share of the water left when the solution becomes saturated
const PAN = { x: 44, w: 592, top: 262, floor: 424 };
const HORIZON = 214;
const STAGES = ['Seawater', 'Saturated solution', 'Salt crystals'];

export class SaltPanScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static IRIS = false;
  static COLOR_MAP = GEO_COLOR_MAP;
  static BEAT_STEP_MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A shallow salt pan beside the sea, in the sun, cut open to show the water. As water evaporates the level falls and the liquid stays clear. Only when about nine-tenths of the water has gone is the solution saturated, and then a crust of salt crystals forms on the floor of the pan. All the salt stays in the pan.';
  static CONTROLS = [
    { type: 'segmented', id: 'sun', label: 'Sun', value: '1', options: [{ value: '0', label: 'Mild' }, { value: '1', label: 'Strong' }] },
    { type: 'segmented', id: 'wind', label: 'Wind', value: '0', options: [{ value: '0', label: 'Still' }, { value: '1', label: 'Windy' }] },
    { type: 'button', id: 'run', label: 'Let the water evaporate' },
    { type: 'button', id: 'fill', label: 'Fill the pan' },
  ];

  constructor(container, config) {
    super(container, config);
    this._sun = 1;
    this._wind = 0;
    this._fresh();
  }

  _fresh() {
    this._w = 1;              // share of the water left, 1..0
    this._going = false;
    this._held = false;       // stopped at saturated, on stage 1
    this._rateUsed = 1;       // the speed the crystals formed at
    this._found = false;
    this._mist = 0;
  }

  enter() { this._sun = 1; this._wind = 0; this._fresh(); }

  get _rate() { return 1 + this._sun + this._wind; }
  get _crust() { return clamp((SAT_LEVEL - this._w) / SAT_LEVEL, 0, 1); }
  get _phase() { return this._w > SAT_LEVEL + 0.002 ? 0 : this._w > 0.04 && this._crust < 0.45 ? 1 : 2; }

  isControlDisabled(id) {
    if (id === 'run') return this._going || this._w <= 0;
    if (id === 'sun' || id === 'wind') return this._going;
    return false;
  }
  getControlValue(id) {
    if (id === 'sun') return String(this._sun);
    if (id === 'wind') return String(this._wind);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'sun') this._sun = Number(v) ? 1 : 0;
    else if (id === 'wind') this._wind = Number(v) ? 1 : 0;
    else if (id === 'fill') this._fresh();
    else if (id === 'run') {
      this._going = true;
      this._rateUsed = this._rate;
      if (this._held) {
        this._held = false;
        if (!this._found) {
          this._found = true;
          this.celebrate(340, PAN.floor - 16, 18, { key: 'crystals-form', small: true });
        }
      }
    }
    this.animateFor(1200);
    this.requestUiUpdate?.();
  }

  update(d) {
    if (this._going) {
      this._mist += d;
      const before = this._w;
      // A run from full takes 14, 8 or 5 s; the crystals' part goes at the same speed.
      const secs = { 1: 13, 2: 8, 3: 5 }[this._rate];
      this._w = Math.max(0, this._w - d / secs);
      if (this.stage === 1 && before > SAT_LEVEL && this._w <= SAT_LEVEL) {
        this._w = SAT_LEVEL; this._going = false; this._held = true; this.requestUiUpdate?.();
      } else if (this._w <= 0) { this._going = false; this.requestUiUpdate?.(); }
    }
  }

  busy() { return this._going; }

  draw(ctx, c, t) {
    this._world(ctx, c, t);
    this._pan(ctx, c, t);
    this._readout(ctx, c);
    this._chain(ctx, c);
  }

  _world(ctx, c, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, c.skyDay);
    sky.addColorStop(1, lighten(c.skyDay, 0.6));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 680, HORIZON + 2);
    // the sun, top right; its strength is its size
    const R = this._sun ? 44 : 32, sx = 572, sy = 76;
    const hue = hslOf(c.gold).h;                 // the gold token turns dark in the light theme: keep its hue only
    ctx.fillStyle = hsl(hue, 1, 0.8, 0.45);
    ctx.beginPath(); ctx.arc(sx, sy, R * 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hsl(hue, 1, 0.66);
    ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.fill();
    // the sea on the horizon
    ctx.fillStyle = c.seaShallow; ctx.fillRect(0, HORIZON, 680, 26);
    ctx.fillStyle = alpha(lighten(c.seaShallow, 0.6), 0.7);
    for (let i = 0; i < 7; i += 1) { rr(ctx, 30 + i * 96, HORIZON + 6 + (i % 3) * 6, 46, 3, 1.5); ctx.fill(); }
    // the land
    const land = ctx.createLinearGradient(0, HORIZON + 22, 0, 520);
    land.addColorStop(0, lighten(c.strata1, 0.2));
    land.addColorStop(1, c.strata2);
    ctx.fillStyle = land; ctx.fillRect(0, HORIZON + 22, 680, 520);
    // wind lines
    if (this._wind) {
      ctx.strokeStyle = alpha(lighten(c.skyDay, 0.9), 0.85); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i += 1) {
        const y = 40 + i * 32, x = ((t * 130 + i * 171) % 820) - 120;
        const lx = this._going ? x : 60 + i * 74;
        ctx.beginPath(); ctx.moveTo(lx, y); ctx.bezierCurveTo(lx + 50, y - 8, lx + 80, y + 8, lx + 120, y); ctx.stroke();
      }
    }
  }

  _pan(ctx, c, t) {
    const P = PAN, depth = P.floor - P.top;
    const wall = 22;
    // earth walls, cut open
    ctx.fillStyle = darken(c.strata2, 0.2);
    rr(ctx, P.x - wall, P.top - 12, P.w + wall * 2, depth + 12 + 24, 16); ctx.fill();
    ctx.fillStyle = lighten(c.strata2, 0.08);
    rr(ctx, P.x - wall, P.top - 16, wall + 6, 12, 6); ctx.fill();
    rr(ctx, P.x + P.w - 6, P.top - 16, wall + 6, 12, 6); ctx.fill();
    // the empty pan
    ctx.fillStyle = mix(c.strata1, c.bgDeep, 0.12);
    rr(ctx, P.x, P.top - 6, P.w, depth + 6, 8); ctx.fill();
    ctx.save();
    rr(ctx, P.x, P.top - 6, P.w, depth + 6, 8); ctx.clip();
    const sy = P.floor - depth * this._w;
    // the water: it gets a little greener-white as it nears saturation
    const k = clamp((1 - this._w) * 1.05, 0, 1);
    const fill = mix(c.seaShallow, lighten(c.seaShallow, 0.55), k);
    const wg = ctx.createLinearGradient(0, sy, 0, P.floor);
    wg.addColorStop(0, alpha(lighten(fill, 0.15), 0.92));
    wg.addColorStop(1, alpha(darken(fill, 0.12), 0.96));
    if (this._w > 0) {
      ctx.fillStyle = wg; ctx.fillRect(P.x, sy, P.w, P.floor - sy);
      ctx.fillStyle = alpha(lighten(fill, 0.7), 0.85); ctx.fillRect(P.x, sy - 1, P.w, 3);
    }
    // a mark for where the pan started
    ctx.setLineDash([9, 8]); ctx.strokeStyle = alpha(darken(c.strata2, 0.4), 0.55); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(P.x + 8, P.top); ctx.lineTo(P.x + P.w - 8, P.top); ctx.stroke(); ctx.setLineDash([]);
    this._crustDraw(ctx, c);
    ctx.restore();
    // vapour leaving, only while the pan runs
    if (this._going) {
      ctx.strokeStyle = alpha(lighten(c.skyDay, 0.85), 0.75); ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i += 1) {
        const p = (t * 0.45 + i / 6) % 1;
        const x = P.x + 60 + i * 96 + (this._wind ? p * 40 : 0), y = sy - 8 - p * 96;
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 12, x, y - 26); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  /** Salt on the floor. A slower run gives fewer, larger cubes for the same salt. */
  _crustDraw(ctx, c) {
    const u = this._crust;
    if (u <= 0) return;
    const P = PAN;
    const size = { 1: 30, 2: 20, 3: 12 }[this._rateUsed];
    const rnd = mulberry32(this._rateUsed * 37);
    const cols = Math.floor(P.w / (size * 0.92));
    const rows = this._rateUsed === 1 ? 1 : this._rateUsed === 2 ? 2 : 3;
    for (let r = 0; r < rows; r += 1) {
      for (let i = 0; i < cols; i += 1) {
        if (rnd() > u * 1.25) continue;
        const s = size * (0.72 + rnd() * 0.3);
        const x = P.x + 6 + i * (size * 0.92) + rnd() * 5;
        const y = P.floor - s - r * size * 0.72 - rnd() * 2;
        rr(ctx, x, y, s, s, 2.5);
        ctx.fillStyle = lighten(c.ice, 0.55); ctx.fill();
        ctx.strokeStyle = darken(c.ice, 0.3); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = alpha(darken(c.ice, 0.12), 0.8);
        ctx.fillRect(x + s * 0.55, y + 2, s * 0.4, s - 4);
      }
    }
  }

  _readout(ctx, c) {
    const x = 20, y = 18, w = PHONE ? 300 : 214, h = PHONE ? 182 : 170;
    drawCard(ctx, c, x, y, w, h, 1, {});
    const row = (yy, label, value) => {
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = font(c, 700, fs(16)); ctx.fillStyle = c.labelMuted;
      ctx.fillText(label, x + 16, yy);
      ctx.font = font(c, 700, fs(32), true); ctx.fillStyle = c.label;
      ctx.fillText(value, x + 16, yy + fs(16) + 5);
    };
    row(y + 12, 'water left', `${Math.round(this._w * 100)} %`);
    row(y + 90, 'salt in the pan', 'all of it');
  }

  /** The book's three stages, on the ground in front of the pan. The stage the pan is in is lit. */
  _chain(ctx, c) {
    const ph = this._phase;
    const size = fs(16);
    const y = 490;
    const xs = PHONE ? null : [130, 340, 550];
    if (PHONE) {
      pill(ctx, c, STAGES[ph], 340, y, { bg: c.accent, size, display: true });
      return;
    }
    STAGES.forEach((s, i) => {
      const on = i === ph;
      pill(ctx, c, s, xs[i], y, { bg: on ? c.accent : c.raised, ink: on ? inkOn(c, c.accent) : c.label, size, display: true, alpha: on ? 1 : 0.92 });
      if (i < 2) {
        ctx.fillStyle = darken(c.strata2, 0.45);
        const ax = (xs[i] + xs[i + 1]) / 2 + (i ? 6 : 8);
        ctx.beginPath(); ctx.moveTo(ax - 7, y - 8); ctx.lineTo(ax + 7, y); ctx.lineTo(ax - 7, y + 8); ctx.closePath(); ctx.fill();
      }
    });
    if (this._held) pill(ctx, c, 'saturated: press again', 340, 236, { bg: c.warning, size: fs(17), display: true });
  }
}
