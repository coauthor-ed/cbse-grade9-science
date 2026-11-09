import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, rr, ellipse, alpha, lighten, darken, mix,
  clamp01, inOutSine, outBack,
} from 'simulations/base/kit/SimLook.js';
import { drawLeverPlank } from 'simulations/base/kit/SimApparatus.js';

// BeamBalanceScene - blk-l08-s07, A Beam Balance (book Activity 7.5).
// Clear plastic cups on threads (the slide says cups; coins show through), a
// cm scale ticked along the beam, and each arm's length in cm above its bracket.
// b0: a beam hung by a string at its middle, a cup at each end. 1 coin and
//     1 coin: level. A coin drops into the right cup: it tips. The right cup
//     slides in from 16 cm to 8 cm and the beam comes level again.
// b1: the left cup stays at 1 coin, 16 cm. The right cup takes 1, 2, 4, 8
//     coins; each time it tips, slides in to 16, 8, 4, 2 cm and levels, and
//     its row (coins x distance = 16) joins the record.
// The beam's tilt is computed from coins x distance on each side, so the
// tip and the level are the rule itself, not a script.

const GROUND = 492;
const BX = 360, BY = 190;            // beam pivot: plank underside at the string
const TH = 16;
const ARM = 270;
const PX_CM = 15;                    // 16 cm = 240 px
const DROP = 118;
const CUP_H = 64, CUP_TOP = 34, CUP_BOT = 24;   // a clear plastic cup, coins visible inside
const L_COINS = 1, L_CM = 16;
const MOM = L_COINS * L_CM;          // 16 on the left, always
const TILT_K = 0.0075, TILT_MAX = 0.13;
const POST_X = 44, ARM_Y = 70;

const tiltOf = (n, d) => Math.max(-TILT_MAX, Math.min(TILT_MAX, TILT_K * (n * d - MOM)));

// One beat = a list of phases; the state at time t is a pure function of t.
function phasesFor(stage) {
  if (stage < 1) {
    return [
      { k: 'hold', dur: 0.6, n: 1, d: 16 },
      { k: 'drop', dur: 0.55, n: 1, add: 1, d: 16 },
      { k: 'tip', dur: 0.6, n0: 1, n: 2, d: 16 },
      { k: 'hold', dur: 0.5, n: 2, d: 16 },
      { k: 'slide', dur: 1.3, n: 2, d0: 16, d1: 8 },
    ];
  }
  const out = [{ k: 'hold', dur: 0.5, n: 1, d: 16 }, { k: 'rec', dur: 0.4, n: 1, d: 16, row: 0 }];
  let n = 1;
  for (let i = 1; i <= 3; i += 1) {
    const d = 16 / n, m = n * 2;
    out.push({ k: 'drop', dur: 0.5, n, add: n, d });
    out.push({ k: 'tip', dur: 0.5, n0: n, n: m, d });
    out.push({ k: 'slide', dur: 0.9, n: m, d0: d, d1: 16 / m });
    out.push({ k: 'rec', dur: 0.4, n: m, d: 16 / m, row: i });
    n = m;
  }
  return out;
}
const total = (ph) => ph.reduce((s, p) => s + p.dur, 0);

function stateAt(stage, t) {
  const ph = phasesFor(stage);
  let left = Math.max(0, t), rows = 0, rowU = 1;
  let st = null;
  for (const p of ph) {
    const u = clamp01(left / p.dur);
    if (p.k === 'rec' && left >= 0) {
      if (u > 0) { rows = p.row + 1; rowU = u; }
    }
    if (left <= p.dur) { st = { p, u }; break; }
    left -= p.dur;
  }
  if (!st) st = { p: ph[ph.length - 1], u: 1 };
  const { p, u } = st;
  let n = p.n, d = p.d ?? p.d1, ang, fall = null;
  if (p.k === 'drop') { fall = { count: p.add, u: inOutSine(u) }; ang = tiltOf(p.n, p.d); }
  else if (p.k === 'tip') { const a = tiltOf(p.n0, p.d), b = tiltOf(p.n, p.d); ang = a + (b - a) * outBack(u); }
  else if (p.k === 'slide') { d = p.d0 + (p.d1 - p.d0) * inOutSine(u); ang = tiltOf(n, d); }
  else ang = tiltOf(n, d);
  return { n, d, ang, fall, rows, rowU };
}

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class BeamBalanceScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A beam balance: a wooden scale hangs by a string at its middle from a stand, with a cup hung at each end. One coin sits in each cup and the beam is level. A coin drops into the right cup and the beam tips to the right; the right cup slides closer to the middle and the beam comes level again. Then the right cup takes 1, 2, 4 and 8 coins, balancing at 16, 8, 4 and 2 cm, while the left cup keeps 1 coin at 16 cm; each balance is recorded as coins times distance, always 16.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get motionEnd() { return total(phasesFor(this.stage)) + 0.1; }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    const s = stateAt(this.stage, this.motionT ?? 0);
    drawBackdrop(ctx, c, 'grid');
    drawFloor(ctx, c, GROUND);
    this.stand(ctx, c);
    this.cup(ctx, c, s, -L_CM * PX_CM, L_COINS, c.s2);
    this.cup(ctx, c, s, s.d * PX_CM, s.n, c.s6);
    const g = drawLeverPlank(ctx, c, {
      x: BX, y: BY, angle: s.ang, left: ARM, right: ARM, thick: TH, fulcrum: false, pans: [],
    });
    this.scale(ctx, c, s);
    this.string(ctx, c, s.ang);
    this.arms(ctx, c, s);
    if (s.fall) this.falling(ctx, c, s);
    this.tags(ctx, c, s, g);
    if (this.stage >= 1) this.record(ctx, c, s);
  }

  // A lab stand: heavy base plate, upright rod, boss clamp and a cross rod over the
  // beam's middle, with the hook the string hangs from.
  stand(ctx, c) {
    const metal = mix(c.labelMuted, c.bgSurface, 0.25);
    const base = darken(mix(c.s4, c.labelMuted, 0.5), 0.15);
    drawShadow(ctx, c, 78, GROUND + 1, 84, 8, 0.8);
    this.block(ctx, c, () => rr(ctx, 6, GROUND - 22, 150, 22, 6), { x: 6, y: GROUND - 22, w: 150, h: 22 }, base, 'down');
    this.block(ctx, c, () => rr(ctx, POST_X - 6, ARM_Y - 14, 12, GROUND - ARM_Y - 4, 5), { x: POST_X - 6, y: ARM_Y - 14, w: 12, h: GROUND - ARM_Y - 8 }, metal, 'right');
    this.block(ctx, c, () => rr(ctx, POST_X, ARM_Y - 5, BX - POST_X + 22, 11, 5), { x: POST_X, y: ARM_Y - 5, w: BX - POST_X + 22, h: 11 }, metal, 'down');
    this.block(ctx, c, () => rr(ctx, POST_X - 15, ARM_Y - 15, 30, 30, 6), { x: POST_X - 15, y: ARM_Y - 15, w: 30, h: 30 }, darken(metal, 0.12), 'right');
    ctx.save();
    ctx.fillStyle = darken(metal, 0.4);
    ctx.beginPath(); ctx.arc(POST_X + 18, ARM_Y + 9, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(metal, 0.3);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(BX, ARM_Y + 6); ctx.lineTo(BX, ARM_Y + 12); ctx.stroke();
    ctx.beginPath(); ctx.arc(BX, ARM_Y + 18, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Body, shade side, light side, rim: the kit's solid-form recipe for the stand.
  block(ctx, c, path, b, col, shade) {
    ctx.save();
    path(); ctx.fillStyle = col; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = darken(col, 0.2);
    if (shade === 'right') ctx.fillRect(b.x + b.w * 0.62, b.y - 2, b.w, b.h + 6);
    else ctx.fillRect(b.x - 2, b.y + b.h * 0.6, b.w + 4, b.h);
    ctx.fillStyle = alpha(lighten(col, 0.4), 0.85);
    if (shade === 'right') ctx.fillRect(b.x, b.y, b.w * 0.18, b.h + 4);
    else ctx.fillRect(b.x, b.y, b.w, Math.min(5, b.h * 0.25));
    ctx.strokeStyle = alpha(darken(col, 0.3), 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (shade === 'right') { ctx.moveTo(b.x + b.w * 0.45, b.y + 10); ctx.lineTo(b.x + b.w * 0.45, b.y + b.h - 10); }
    else { ctx.moveTo(b.x + 8, b.y + b.h * 0.45); ctx.lineTo(b.x + b.w - 8, b.y + b.h * 0.45); }
    ctx.stroke();
    ctx.restore();
    path(); ctx.strokeStyle = darken(col, 0.34); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  // The string from the hook to the top of the beam at its middle.
  string(ctx, c, ang) {
    const tx = BX + Math.sin(ang) * TH, ty = BY - Math.cos(ang) * TH;
    ctx.save();
    ctx.strokeStyle = darken(c.labelMuted, 0.15);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(BX, ARM_Y + 24); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.restore();
  }

  // Each arm, string to cup, as a bar along the top of the beam (left tone 2, right tone 6).
  arms(ctx, c, s) {
    ctx.save();
    ctx.translate(BX, BY);
    ctx.rotate(s.ang);
    const y = -TH - 12;
    for (const [d, col] of [[-L_CM * PX_CM, c.s2], [s.d * PX_CM, c.s6]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(d, y); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(d, y - 9); ctx.lineTo(d, y + 9); ctx.stroke();
    }
    ctx.strokeStyle = darken(c.labelMuted, 0.15);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, y - 9); ctx.lineTo(0, y + 9); ctx.stroke();
    ctx.restore();
    // each arm's length in cm, above its bracket (a short arm's pill steps out past the string)
    const rd = Math.round(s.d);
    const lift = TH + 44;
    const ptAt = (d) => ({ x: BX + Math.cos(s.ang) * d + Math.sin(s.ang) * lift, y: BY + Math.sin(s.ang) * d - Math.cos(s.ang) * lift });
    const lp = ptAt(-L_CM * PX_CM / 2), rp = ptAt(Math.max(s.d * PX_CM / 2, 62));
    pill(ctx, c, `${L_CM} cm`, lp.x, lp.y, { bg: c.s2, size: 24, display: true });
    pill(ctx, c, `${rd} cm`, rp.x, rp.y, { bg: c.s6, size: 24, display: true });
  }

  // A cup on a thread, hung plumb from the beam's underside at signed distance d:
  // thread, a two-string bail to the rim, then back rim, coins, clear body, front rim.
  cup(ctx, c, s, d, n, tint) {
    const hx = BX + Math.cos(s.ang) * d, hy = BY + Math.sin(s.ang) * d;
    const by = hy + DROP, ty = by - CUP_H, ky = ty - 24;
    const thread = darken(c.labelMuted, 0.15);
    ctx.save();
    ctx.strokeStyle = thread; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy); ctx.lineTo(hx, ky);
    ctx.moveTo(hx, ky); ctx.lineTo(hx - CUP_TOP + 3, ty + 2);
    ctx.moveTo(hx, ky); ctx.lineTo(hx + CUP_TOP - 3, ty + 2);
    ctx.stroke();
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(hx - CUP_TOP, ty); ctx.lineTo(hx - CUP_BOT, by);
      ctx.quadraticCurveTo(hx, by + 7, hx + CUP_BOT, by);
      ctx.lineTo(hx + CUP_TOP, ty); ctx.closePath();
    };
    // the inside, seen through the clear wall
    body(); ctx.fillStyle = alpha(mix(tint, c.bgSurface, 0.55), 0.55); ctx.fill();
    ellipse(ctx, hx, ty, CUP_TOP, 7); ctx.fillStyle = alpha(darken(mix(tint, c.bgSurface, 0.4), 0.15), 0.8); ctx.fill();
    const gold = c.gold;
    for (let k = 0; k < n; k += 1) {
      const cy = by - 6 - k * 6;
      ellipse(ctx, hx, cy + 2, 16, 5); ctx.fillStyle = darken(gold, 0.35); ctx.fill();
      ellipse(ctx, hx, cy, 16, 5); ctx.fillStyle = gold; ctx.fill();
      ctx.strokeStyle = darken(gold, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
    }
    // the clear wall in front: a light sheen down the left, a shade down the right
    ctx.save(); body(); ctx.clip();
    ctx.fillStyle = alpha(lighten(tint, 0.5), 0.35);
    ctx.fillRect(hx - CUP_TOP, ty, 12, CUP_H + 8);
    ctx.fillStyle = alpha(darken(tint, 0.2), 0.3);
    ctx.fillRect(hx + CUP_BOT - 6, ty, CUP_TOP, CUP_H + 8);
    ctx.restore();
    body(); ctx.strokeStyle = darken(tint, 0.25); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    ellipse(ctx, hx, ty, CUP_TOP, 7); ctx.strokeStyle = darken(tint, 0.3); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  // The beam is a scale: a tick every centimetre from the middle, a taller one every 2 cm.
  scale(ctx, c, s) {
    ctx.save();
    ctx.translate(BX, BY);
    ctx.rotate(s.ang);
    ctx.strokeStyle = alpha(darken(c.gold, 0.5), 0.75);
    for (let cm = 1; cm <= 17; cm += 1) {
      const h = cm % 2 ? 4 : 8;
      ctx.lineWidth = cm % 2 ? 1.2 : 2;
      for (const sg of [-1, 1]) {
        const x = sg * cm * PX_CM;
        ctx.beginPath(); ctx.moveTo(x, -TH + 1); ctx.lineTo(x, -TH + 1 + h); ctx.stroke();
      }
    }
    ctx.restore();
  }

  panPoint(s, d) {
    return { x: BX + Math.cos(s.ang) * d, y: BY + Math.sin(s.ang) * d + DROP };
  }

  // Coins dropping into the right cup.
  falling(ctx, c, s) {
    const p = this.panPoint(s, s.d * PX_CM);
    const topY = p.y - 4 - s.n * 6;
    const y = topY - 120 * (1 - s.fall.u);
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.fall.u * 4);
    for (let k = 0; k < s.fall.count; k += 1) {
      const cy = y - k * 6;
      ellipse(ctx, p.x, cy + 2, 15, 5); ctx.fillStyle = darken(c.gold, 0.35); ctx.fill();
      ellipse(ctx, p.x, cy, 15, 5); ctx.fillStyle = c.gold; ctx.fill();
      ctx.strokeStyle = darken(c.gold, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  }

  // Under each cup: how many coins it holds (the distances sit on the arms above).
  tags(ctx, c, s) {
    const lp = this.panPoint(s, -L_CM * PX_CM), rp = this.panPoint(s, s.d * PX_CM);
    const ty = Math.max(lp.y, rp.y) + 38;   // just under the lower cup
    const coins = (n) => `${n} coin${n === 1 ? '' : 's'}`;
    pill(ctx, c, coins(L_COINS), lp.x, ty, { bg: c.raised, ink: c.label, size: 24, display: true });
    pill(ctx, c, coins(s.n), Math.max(rp.x, 300), ty, { bg: c.raised, ink: c.label, size: 24, display: true });
  }

  // b1: the right cup's balances, row by row, each n x d = 16 like the left.
  record(ctx, c, s) {
    const cols = [170, 314, 458, 602];
    const done = [[1, 16], [2, 8], [4, 4], [8, 2]];
    for (let i = 0; i < 4; i += 1) {
      const x = cols[i], y = 446;
      if (i >= s.rows) {
        ctx.save();
        rr(ctx, x - 66, y - 19, 132, 38, 12);
        ctx.strokeStyle = alpha(c.labelMuted, 0.35);
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        continue;
      }
      const pop = i === s.rows - 1 ? outBack(clamp01(s.rowU)) : 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pop, pop);
      const [n, d] = done[i];
      pill(ctx, c, `${n} x ${d} = ${n * d}`, 0, 0, { bg: c.raised, ink: c.label, size: 22, display: true });
      ctx.restore();
    }
  }
}
