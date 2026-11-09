import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, drawCard, pill, font, clamp01, outBack,
  mix, alpha, lighten, darken, rr, mulberry32, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawCrate } from 'simulations/base/kit/SimApparatus.js';

// EffortLoadScene - blk-l07-s03, Effort, Load, Mechanical Advantage.
// The same plank job as TruckBoxScene on the slide before: the same yard,
// truck, plank and red carton, the student pushing it up the plank.
// b0: the effort arrow (the push of the hands, along the plank, from the box's
//     front face as in TruckBox) and the load arrow (the box's weight, straight down
//     from its middle) grow and are named.
// b1: the arrows carry 600 N and 200 N, drawn to one scale (effort length =
//     load length / 3); three effort-lengths stack beside the load arrow and
//     match it, then the card fills: load / effort = 600 N / 200 N = 3.
// The plank is drawn with length / height = 3, so the picture agrees with 3.

const GROUND = 470;
const DECK = 372;                              // top of the truck bed, as TruckBox
const TX = 430;                                // the truck's rear edge
const BW = 80, BH = 66;                        // the carton, as TruckBox
const P1 = { x: TX + 4, y: DECK };             // plank top, on the bed's lip
const RISE = GROUND - P1.y;                    // 98
const PLEN = RISE * 3;                         // length / height = 3
const PANG = -Math.asin(RISE / PLEN);          // negative: up to the right
const P0 = { x: P1.x - Math.cos(PANG) * PLEN, y: GROUND };
const S_BOX = PLEN - BW / 2 - 78;              // where TruckBox's push comes to rest
const LOAD_N = 600, EFFORT_N = 200, MA = LOAD_N / EFFORT_N;
const LOAD_LEN = 114;
const EFFORT_LEN = LOAD_LEN / MA;              // 38: one scale for both arrows
const CARD = { x: 18, y: 18, w: 400, h: 140 };

const GRIT = (() => {
  const r = mulberry32(21);
  return Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * 40, w: 2 + r() * 5 }));
})();

const along = (s) => ({ x: P0.x + Math.cos(PANG) * s, y: P0.y + Math.sin(PANG) * s });
const groundAt = (x) => (x <= P0.x ? GROUND : x >= P1.x ? DECK : P0.y + (x - P0.x) * Math.tan(PANG));

const B0_END = 1.3;
const STACK_T0 = 0.5, STACK_DT = 0.5;
const CARD_T0 = STACK_T0 + 3 * STACK_DT + 0.1;
const B1_END = CARD_T0 + 1.3;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class EffortLoadScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student pushes a heavy box up a plank that leans on the back of a truck. A short arrow along the plank, from the front of the box, the push of the student\'s hands, is the effort. A long arrow straight down from the box, its weight, is the load. Then the load arrow is marked 600 N and the effort arrow 200 N; three effort lengths stacked together match the load arrow, and a card reads mechanical advantage = load / effort = 600 N / 200 N = 3.';

  enter() {
    this.motionT = 0;
  }

  get maBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.maBeat ? B1_END : B0_END) + 0.1; }

  pointerDown() {
    this.motionT = 0;   // tap: play the beat again
    this.animateFor(600);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // 0..1 progress of a step that starts at t0 and lasts dt
  prog(t0, dt) { return clamp01(((this.motionT ?? 0) - t0) / dt); }

  // world point from box-local (dx along the plank, dy up from its face)
  loc(dx, dy) {
    const b = along(S_BOX), ca = Math.cos(PANG), sa = Math.sin(PANG);
    return { x: b.x + ca * dx + sa * dy, y: b.y + sa * dx - ca * dy };
  }

  draw(ctx, c) {
    this.yard(ctx, c);
    this.truck(ctx, c);
    this.plank(ctx, c);
    this.boxAndStudent(ctx, c);
    this.forces(ctx, c);
    if (this.maBeat) {
      this.stack(ctx, c);
      this.card(ctx, c);
    }
  }

  boxAndStudent(ctx, c) {
    const bc = along(S_BOX);
    const hb = this.loc(-BW / 2 - 1, 22);
    const ht = this.loc(-BW / 2 + 3, 46);
    const fx = hb.x - 52;
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: 18 }, x: fx, y: groundAt(fx), scale: 100, facing: 1,
      ground: groundAt, hands: [hb, ht],
    });
    drawFigure(ctx, c, spec, { ...spec.look, mood: 'effort' }, {
      between: () => {
        ctx.save();
        ctx.translate(bc.x, bc.y);
        ctx.rotate(PANG);
        drawCrate(ctx, c, { x: 0, y: 0, w: BW, h: BH, kind: 'carton', tone: 6, held: true });
        ctx.restore();
      },
    });
  }

  forces(ctx, c) {
    const t = this.motionT ?? 0;
    const b1 = this.maBeat;
    const ue = b1 ? 1 : outBack(this.prog(0.1, 0.55));
    const ul = b1 ? 1 : outBack(this.prog(0.55, 0.6));
    const eff = c.s5, load = c.s6;
    // effort: the push the hands give the box, along the plank, drawn from the
    // box's front face exactly as TruckBoxScene draws its F
    const e0 = this.loc(BW / 2 + 2, BH / 2);
    if (ue > 0.01) vectorArrow(ctx, c, e0.x, e0.y, { angle: PANG, length: EFFORT_LEN * ue, col: eff, width: 7, head: 14 });
    // load: the box's weight, straight down from its middle
    const m = this.loc(0, BH / 2);
    if (ul > 0.01) {
      vectorArrow(ctx, c, m.x, m.y, { angle: Math.PI / 2, length: LOAD_LEN * ul, col: load, width: 7, head: 16 });
      ctx.save();
      ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = load; ctx.fill();
      ctx.restore();
    }
    // names, then (b1) the numbers: effort above its head, load beside its head
    const nk = b1 ? clamp01(t / 0.4) : 1;
    const eText = b1 ? `effort ${EFFORT_N} N` : 'effort';
    const lText = b1 ? `load ${LOAD_N} N` : 'load';
    const ep = this.loc(BW / 2 + EFFORT_LEN, BH / 2 + 46);
    if (ue >= 0.6) pill(ctx, c, eText, ep.x + 14, ep.y, { bg: eff, size: 24, scale: b1 ? 0.9 + 0.1 * nk : outBack(this.prog(0.4, 0.4)) });
    const lx = b1 ? m.x + 192 : m.x + 66;
    if (ul >= 0.6) pill(ctx, c, lText, lx, GROUND + 26, { bg: load, size: 24, scale: b1 ? 0.9 + 0.1 * nk : outBack(this.prog(0.9, 0.4)) });
  }

  // three effort-lengths, laid end to end beside the load arrow
  stack(ctx, c) {
    const m = this.loc(0, BH / 2);
    const x = m.x + 90;
    for (let i = 0; i < 3; i++) {
      const u = this.prog(STACK_T0 + i * STACK_DT, STACK_DT * 0.8);
      if (u <= 0) continue;
      const y0 = m.y + i * EFFORT_LEN;
      ctx.save();
      ctx.globalAlpha = Math.min(1, u * 1.6);
      const drop = (1 - outBack(u)) * -26;
      vectorArrow(ctx, c, x, y0 + drop, { angle: Math.PI / 2, length: EFFORT_LEN - 3, col: c.s5, width: 6, head: 12 });
      ctx.fillStyle = c.s5;
      ctx.fillRect(x - 8, y0 + drop - 1.5, 16, 3);
      ctx.restore();
    }
    const done = this.prog(STACK_T0 + 3 * STACK_DT - 0.1, 0.3);
    if (done > 0) pill(ctx, c, `x ${MA}`, x + 48, m.y + EFFORT_LEN, { bg: c.s5, size: 26, scale: outBack(done) });
  }

  card(ctx, c) {
    const k = this.prog(CARD_T0 - 0.4, 0.4);
    if (k <= 0) return;
    const { x, y, w, h } = CARD;
    drawCard(ctx, c, x, y, w, h, k);
    ctx.save();
    ctx.globalAlpha = k;
    const cy = y + h / 2 + 2;
    const fx = x + 186;   // the fraction column
    ctx.textBaseline = 'middle';
    ctx.font = font(c, 800, 30, true);
    ctx.fillStyle = c.label;
    ctx.textAlign = 'left';
    ctx.fillText('MA =', x + 16, cy);
    const nUp = this.prog(CARD_T0, 0.35), nDn = this.prog(CARD_T0 + 0.3, 0.35), nEq = this.prog(CARD_T0 + 0.7, 0.4);
    ctx.font = font(c, 800, 24, true);
    ctx.textAlign = 'center';
    ctx.fillStyle = c.s6ink;
    ctx.fillText('load', x + 122, cy - 24);
    ctx.fillStyle = c.s5ink;
    ctx.fillText('effort', x + 122, cy + 26);
    ctx.fillStyle = c.label;
    ctx.fillRect(x + 88, cy - 1.5, 68, 3);
    ctx.font = font(c, 800, 30, true);
    ctx.fillText('=', x + 170, cy);
    ctx.globalAlpha = k * nUp;
    ctx.fillStyle = c.s6ink;
    ctx.fillText(`${LOAD_N} N`, fx + 48, cy - 26);
    ctx.globalAlpha = k * nDn;
    ctx.fillStyle = c.s5ink;
    ctx.fillText(`${EFFORT_N} N`, fx + 48, cy + 28);
    ctx.globalAlpha = k * Math.max(nUp, nDn);
    ctx.fillStyle = c.label;
    ctx.fillRect(fx + 6, cy - 1.5, 84, 3);
    ctx.restore();
    if (nEq > 0) pill(ctx, c, `= ${MA}`, x + w - 54, cy, { bg: c.accent, size: 34, scale: outBack(nEq) });
  }

  // -- the world: the same yard, truck and plank as TruckBoxScene ------------
  yard(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
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

  plank(ctx, c) {
    const wood = mix(c.gold, c.flame, 0.25);
    const th = 18;
    ctx.save();
    ctx.translate(P0.x, P0.y);
    ctx.rotate(PANG);
    rr(ctx, -2, -2, PLEN + 4, th + 4, 3);
    ctx.fillStyle = darken(wood, 0.45);
    ctx.fill();
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, PLEN, th);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(0, 0, PLEN, 3);
    ctx.fillStyle = darken(wood, 0.2);
    ctx.fillRect(0, th - 6, PLEN, 6);
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

  // the back of an Indian goods truck: slatted body, tailgate, deck, rear wheels
  truck(ctx, c) {
    const body = mix(c.s1, c.bgDeep, 0.15);
    const top = 140;
    ctx.fillStyle = darken(body, 0.55);
    ctx.fillRect(TX, top, W - TX, DECK - top);
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
    ctx.fillStyle = darken(body, 0.45);
    ctx.fillRect(TX - 2, top - 4, 44, 12);
    ctx.fillRect(TX - 2, top, 18, DECK - top);
    ctx.fillStyle = body;
    ctx.fillRect(TX, top - 2, 40, 7);
    ctx.fillRect(TX, top, 14, DECK - top);
    ctx.fillStyle = lighten(body, 0.3);
    ctx.fillRect(TX, top, 4, DECK - top);
    const gate = mix(c.labelMuted, c.raised, 0.35);
    ctx.fillStyle = darken(gate, 0.3);
    ctx.fillRect(TX + 18, top + 52, 22, DECK - top - 52);
    ctx.fillStyle = gate;
    ctx.fillRect(TX + 20, top + 54, 18, DECK - top - 56);
    ctx.fillStyle = darken(c.stroke, 0.35);
    ctx.fillRect(TX - 4, DECK, W - TX + 4, 18);
    ctx.fillStyle = lighten(c.stroke, 0.25);
    ctx.fillRect(TX - 4, DECK, W - TX + 4, 4);
    ctx.fillStyle = mix(c.gold, c.stroke, 0.45);
    ctx.fillRect(TX, DECK - 4, W - TX, 4);
    ctx.fillStyle = darken(c.stroke, 0.5);
    ctx.fillRect(TX + 20, DECK + 18, W - TX - 20, 16);
    ctx.fillStyle = darken(c.stroke, 0.3);
    rr(ctx, TX - 8, DECK + 22, 46, 12, 3);
    ctx.fill();
    ctx.fillStyle = c.s6;
    rr(ctx, TX - 6, DECK + 24, 14, 8, 2);
    ctx.fill();
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
    ctx.fillRect(wx - 44, DECK + 34, 10, 30);
  }
}
