import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, alpha, lighten, darken, mix, rr, mulberry32, clamp01, lerp, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawCrate } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// TruckBoxScene - book Fig 7.26, two slides.
// blk-l07-s01 (2 beats):
//   b0 a student lifts a heavy box straight up to the back of a truck: the
//      force F up equals the weight mg down (equal arrows).
//   b1 a plank slides in from the ground to the truck bed; the student pushes
//      the box up it. F now points along the plank and is shorter than the
//      straight-lift F (drawn faint from the box's top; both arrows start on the box): a changed size and direction.
// blk-l07-s02 (predict setup, hostRole 'setup', beat MAX_SAFE_INTEGER): the
//   plank in place, the box at its foot, the student beside it. No arrows, no
//   numbers, no work: the answer belongs to the next slides.
const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const SETUP_MAP = [[{ idx: 2, dwellMs: null }]];

const GROUND = 470;
const DECK = 372; // top of the truck bed (about 1 m up)
const TX = 430; // the truck's rear edge
const BW = 80;
const BH = 66;
const LBX = 344; // box centre for the straight lift
const P0 = { x: 176, y: GROUND }; // plank foot
const P1 = { x: TX + 4, y: DECK }; // plank top, on the bed's lip
const PLEN = Math.hypot(P1.x - P0.x, P1.y - P0.y);
const PANG = Math.atan2(P1.y - P0.y, P1.x - P0.x); // negative: up to the right
const S_FOOT = 70; // box centre along the plank at the foot (px)
const S_TOP = PLEN - BW / 2 - 78; // the push comes to rest part way up, the box on the plank
const LIFT = 110; // F = mg, px (both beats)
const L0 = 0.4, L1 = 2.4; // lift
const K0 = 0.2, K1 = 0.8; // plank slides in
const U0 = 1.1, U1 = 3.6; // push up the plank

const GRIT = (() => {
  const r = mulberry32(21);
  return Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * 40, w: 2 + r() * 5 }));
})();

const sm = (u) => u * u * (3 - 2 * u);
const along = (s) => ({ x: P0.x + Math.cos(PANG) * s, y: P0.y + Math.sin(PANG) * s });

export class TruckBoxScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static BEAT_MAPS = { 2: MAP, 0: SETUP_MAP, 1: SETUP_MAP, [Number.MAX_SAFE_INTEGER]: SETUP_MAP };
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A student and a heavy box beside the back of a truck. Lifting the box straight up needs an upward force F equal to its weight mg. Then a plank is laid from the ground to the truck bed and the student pushes the box up it, with a smaller force along the plank.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  get setupView() { return this.hostRole === 'setup' || !(this.stage <= 1); }

  enter() {
    this.runT0 = this.age;
  }

  isControlHidden(id) { return id === 'again' && this.setupView; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.runT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.runT0 || 0);
  }

  busy() {
    if (this.setupView) return false;
    return this.t() < (this.stage === 0 ? L1 + 0.5 : U1 + 0.5);
  }

  draw(ctx, c) {
    const t = this.t();
    this.yard(ctx, c);
    this.truck(ctx, c);
    if (this.setupView) { this.ramp(ctx, c, 99, true); return; }
    if (this.stage === 0) this.lift(ctx, c, t);
    else this.ramp(ctx, c, t, false);
  }

  // -- b0: straight up ----------------------------------------------------------
  lift(ctx, c, t) {
    const u = sm(clamp01((t - L0) / (L1 - L0)));
    const bottom = lerp(GROUND, DECK - 2, u);
    const left = LBX - BW / 2;
    const up = clamp01((GROUND - bottom) / 60);
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'stand', crouch: lerp(0.45, 0, up), lean: lerp(10, 0, up) },
      x: left - 32, y: GROUND, scale: 100, facing: 1,
      hands: [{ x: left + 2, y: bottom - 14 }, { x: left + 6, y: bottom - BH + 14 }],
    });
    drawFigure(ctx, c, spec, { ...spec.look, mood: 'effort' }, {
      between: () => this.box(ctx, c, LBX, bottom, 0, u > 0.02),
    });
    // F up = mg down: equal arrows from the box's middle
    const fa = clamp01((t - L0) / 0.4);
    if (fa > 0) {
      const cx = LBX + 10;
      vectorArrow(ctx, c, cx, bottom - BH, { angle: -Math.PI / 2, length: LIFT, col: c.accent, width: 6, head: 16, alpha: fa });
      vectorArrow(ctx, c, cx, bottom, { angle: Math.PI / 2, length: LIFT, col: c.bad, width: 6, head: 16, alpha: fa });
      pill(ctx, c, 'F = mg', cx, bottom - BH - LIFT - 24, { size: 26, bg: c.accent, alpha: fa });
      // the weight label goes beside its arrow once the arrow runs into the ground
      const my = bottom + 56;
      pill(ctx, c, 'mg', cx + 50, Math.min(my, GROUND + 26), { size: 26, bg: c.bad, alpha: fa });
    }
  }

  // -- b1 and the predict setup: the plank ------------------------------------
  ramp(ctx, c, t, setup) {
    const k = sm(clamp01((t - K0) / (K1 - K0)));
    // the plank slides up into place along its own line
    const back = (1 - k) * 120;
    this.plank(ctx, c, back, k);
    const u = setup ? 0 : sm(clamp01((t - U0) / (U1 - U0)));
    const s = lerp(S_FOOT, S_TOP, u);
    const bc = along(s);
    const ang = PANG;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    // world point from box-local (dx along the plank, dy up from its face)
    const loc = (dx, dy) => ({ x: bc.x + ca * dx + sa * dy, y: bc.y + sa * dx - ca * dy });
    const ground = (x) => (x <= P0.x ? GROUND : x >= P1.x ? DECK : P0.y + (x - P0.x) * Math.tan(PANG));
    let spec;
    if (setup) {
      spec = figureFor(this, { role: 'student', pose: 'stand', x: P0.x - 64, y: GROUND, scale: 100, facing: 1 });
    } else {
      const hb = loc(-BW / 2 - 1, 22);
      const ht = loc(-BW / 2 + 3, 46);
      const fx = hb.x - 52;
      spec = figureFor(this, {
        role: 'student', pose: { name: 'push', lean: 18 }, x: fx, y: ground(fx), scale: 100, facing: 1, ground,
        hands: [hb, ht],
      });
    }
    drawFigure(ctx, c, spec, { ...spec.look, mood: setup ? 'smile' : 'effort' }, {
      between: () => this.box(ctx, c, bc.x, bc.y, ang, false),
    });
    if (setup) return;
    const fa = clamp01((t - U0 + 0.3) / 0.4);
    if (fa > 0) {
      // both forces on the box: the straight-up F = mg of the last beat (faint)
      // from its top, and the push along the plank from its front face, h / L of it
      const fl = LIFT * (GROUND - DECK) / PLEN;
      const top = loc(0, BH);
      vectorArrow(ctx, c, top.x, top.y, { angle: -Math.PI / 2, length: LIFT, col: c.accent, width: 6, head: 16, alpha: fa * 0.4 });
      pill(ctx, c, 'F = mg', top.x, top.y - LIFT - 22, { size: 24, bg: mix(c.accent, c.bgSurface, 0.55), ink: c.label, alpha: fa });
      const tail = loc(BW / 2 + 2, BH / 2);
      vectorArrow(ctx, c, tail.x, tail.y, { angle: ang, length: fl, col: c.accent, width: 7, head: 18, alpha: fa });
      const lp = loc(BW / 2 + fl + 30, BH / 2 + 4);
      pill(ctx, c, 'F', lp.x, lp.y, { size: 26, bg: c.accent, alpha: fa });
    }
  }

  plank(ctx, c, back, a) {
    if (a <= 0) return;
    const wood = mix(c.gold, c.flame, 0.25);
    const th = 18;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(P0.x, P0.y);
    ctx.rotate(PANG);
    ctx.translate(-back, 0);
    // the board: rim, top face, underside shade, grain
    rr(ctx, -2, -2, PLEN + 4, th + 4, 3);
    ctx.fillStyle = darken(wood, 0.45);
    ctx.fill();
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, PLEN, th);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(0, 0, PLEN, 3);
    ctx.fillStyle = darken(wood, 0.2);
    ctx.fillRect(0, th - 6, PLEN, 6);
    // the board's near edge: a darker side band under the top face
    ctx.fillStyle = alpha(darken(wood, 0.3), 0.5);
    ctx.fillRect(0, 9, PLEN, 2);
    ctx.strokeStyle = alpha(darken(wood, 0.4), 0.6);
    ctx.lineWidth = 1.4;
    for (let x = 30; x < PLEN - 20; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.quadraticCurveTo(x + 20, 3, x + 40, 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  box(ctx, c, x, y, ang, held) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    drawCrate(ctx, c, { x: 0, y: 0, w: BW, h: BH, kind: 'carton', tone: 6, held: held || ang !== 0 });
    ctx.restore();
  }

  // -- the world ---------------------------------------------------------------
  yard(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    // a far hedge line
    const hedge = mix(c.s3, c.bgDeep, 0.35);
    ctx.fillStyle = hedge;
    ctx.beginPath();
    ctx.moveTo(0, 400);
    for (let x = 0; x <= W; x += 30) ctx.quadraticCurveTo(x + 15, 372 + ((x / 30) % 3) * 6, x + 30, 400);
    ctx.lineTo(W, 420);
    ctx.lineTo(0, 420);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(hedge, 0.15);
    ctx.fillRect(0, 410, W, 10);
    // packed earth
    const dirt = mix(c.gold, c.stroke, 0.5);
    ctx.fillStyle = dirt;
    ctx.fillRect(0, 420, W, GROUND - 420);
    ctx.fillStyle = darken(dirt, 0.12);
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(dirt, 0.18);
    ctx.fillRect(0, GROUND, W, 3);
    for (const g of GRIT) {
      ctx.fillStyle = alpha(darken(dirt, 0.35), 0.5);
      ctx.fillRect(g.x, GROUND + 6 + g.y, g.w, 2);
    }
  }

  // the back of an Indian goods truck: slatted body, tailgate, deck, rear wheels
  truck(ctx, c) {
    const body = mix(c.s1, c.bgDeep, 0.15);
    const top = 140;
    // the open back: dark inside
    ctx.fillStyle = darken(body, 0.55);
    ctx.fillRect(TX, top, W - TX, DECK - top);
    // side body, seen past the open back (slats), on the far side
    ctx.fillStyle = darken(body, 0.3);
    ctx.fillRect(TX + 40, top + 6, W - TX - 40, DECK - top - 6);
    for (let y = top + 14; y < DECK - 8; y += 16) {
      ctx.fillStyle = body;
      ctx.fillRect(TX + 40, y, W - TX - 40, 9);
      ctx.fillStyle = lighten(body, 0.25);
      ctx.fillRect(TX + 40, y, W - TX - 40, 2);
    }
    for (let x = TX + 96; x < W; x += 70) {
      ctx.fillStyle = darken(body, 0.35);
      ctx.fillRect(x, top + 6, 8, DECK - top - 6);
    }
    // the near corner post and top rail
    ctx.fillStyle = darken(body, 0.45);
    ctx.fillRect(TX - 2, top - 4, 44, 12);
    ctx.fillRect(TX - 2, top, 18, DECK - top);
    ctx.fillStyle = body;
    ctx.fillRect(TX, top - 2, 40, 7);
    ctx.fillRect(TX, top, 14, DECK - top);
    ctx.fillStyle = lighten(body, 0.3);
    ctx.fillRect(TX, top, 4, DECK - top);
    // the tailgate, swung open flat against the far side (grey panel, as in the book)
    const gate = mix(c.labelMuted, c.raised, 0.35);
    ctx.fillStyle = darken(gate, 0.3);
    ctx.fillRect(TX + 18, top + 52, 22, DECK - top - 52);
    ctx.fillStyle = gate;
    ctx.fillRect(TX + 20, top + 54, 18, DECK - top - 56);
    // the deck: a thick bed with a steel lip
    ctx.fillStyle = darken(c.stroke, 0.35);
    ctx.fillRect(TX - 4, DECK, W - TX + 4, 18);
    ctx.fillStyle = lighten(c.stroke, 0.25);
    ctx.fillRect(TX - 4, DECK, W - TX + 4, 4);
    ctx.fillStyle = mix(c.gold, c.stroke, 0.45);
    ctx.fillRect(TX, DECK - 4, W - TX, 4);
    // chassis rail, bumper, tail lamp
    ctx.fillStyle = darken(c.stroke, 0.5);
    ctx.fillRect(TX + 20, DECK + 18, W - TX - 20, 16);
    ctx.fillStyle = darken(c.stroke, 0.3);
    rr(ctx, TX - 8, DECK + 22, 46, 12, 3);
    ctx.fill();
    ctx.fillStyle = c.s6;
    rr(ctx, TX - 6, DECK + 24, 14, 8, 2);
    ctx.fill();
    // rear wheels: duals, with a mudguard
    const wx = 566;
    const wy = GROUND - 40;
    drawShadow(ctx, c, wx, GROUND + 2, 70, 7, 0.7);
    ctx.fillStyle = darken(c.stroke, 0.45);
    ctx.beginPath();
    ctx.arc(wx, wy, 52, Math.PI, 0);
    ctx.lineTo(wx + 52, DECK + 34);
    ctx.lineTo(wx - 52, DECK + 34);
    ctx.closePath();
    ctx.fill();
    for (const dx of [8, 0]) {
      ctx.beginPath();
      ctx.arc(wx + dx, wy, 40, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.stroke, dx ? 0.65 : 0.55);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(wx, wy, 22, 0, Math.PI * 2);
    ctx.fillStyle = lighten(c.stroke, 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx + 2, wy + 2, 22, -0.3, Math.PI * 0.8);
    ctx.strokeStyle = darken(c.stroke, 0.15);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = darken(c.stroke, 0.4);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(wx + Math.cos(a) * 13, wy + Math.sin(a) * 13, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = darken(c.stroke, 0.5);
    ctx.fillRect(wx - 44, DECK + 34, 10, 30); // mud flap
  }
}
