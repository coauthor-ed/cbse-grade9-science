import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, rr, alpha, lighten, darken,
  clamp01, inOutSine, outBack,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawLeverPlank } from 'simulations/base/kit/SimApparatus.js';

// SeesawScene - blk-l08-s09, A Seesaw (book Example 7.13, Fig 7.34).
// b0: an empty seesaw, seats A and B on the left, D and E on the right, C the
//     fulcrum; the distances AC = EC = 2 m and BC = DC = 1 m are drawn in.
// b1: a 15 kg child sits at A and the plank tips left (15 x 2 = 30). A 30 kg
//     child sits at D (30 x 1 = 30) and the plank comes level. After that a
//     tap on seat E or D moves the 30 kg child there: E tips it right (60), D
//     levels it again. The tilt is computed from mass x distance on each side.

const PIV_X = 340, PIV_Y = 300;        // plank underside at the pivot
const TH = 16;
const PX_M = 120;
const SEATS = { A: -2, B: -1, D: 1, E: 2 };
const KEYS = ['A', 'B', 'D', 'E'];
const HALF = 2 * PX_M + 28;
const GROUND = 444;
const TILT_K = 0.0055, TILT_MAX = 0.165;
const KIDS = [
  { kg: 15, h: 116, build: 'kid', skin: 1, hairStyle: 'long', tone: 's3', standX: 40 },
  { kg: 30, h: 148, build: 'kid', skin: 2, hairStyle: 'short', tone: 's5', standX: 628 },
];
const tiltOf = (net) => Math.max(-TILT_MAX, Math.min(TILT_MAX, net * TILT_K));
const netOf = (s0, s1) => (s0 ? KIDS[0].kg * SEATS[s0] : 0) + (s1 ? KIDS[1].kg * SEATS[s1] : 0);

// b1 timeline (s)
const HOP0 = [0.5, 1.1], TIP0 = [1.1, 1.8], HOP1 = [2.1, 2.7], TIP1 = [2.7, 3.4];
const B1_END = 3.5;
const B0_END = 1.6;
const TRY_HOP = 0.5, TRY_TIP = 0.6;
const span = (t, [a, b]) => clamp01((t - a) / (b - a));

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class SeesawScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A playground seesaw: a plank on a stand with four seats. Seats A and B are on the left and D and E on the right; C is the fulcrum in the middle. A and E are 2 m from C, B and D are 1 m from C. A 15 kg child sits at A and the plank tips down on the left: 15 times 2 is 30. A 30 kg child sits at D, 1 m from C: 30 times 1 is 30, and the plank comes level. Tap seat E or D to move the 30 kg child and watch the plank tip or level.';

  enter() {
    this.motionT = 0;
    this.trial = null;                 // b1 after the run: { from, to, t }
  }

  get motionEnd() { return this.stage >= 1 ? B1_END : B0_END; }

  update(d) {
    this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d);
    if (this.trial) this.trial.t = Math.min(TRY_HOP + TRY_TIP, this.trial.t + d);
  }

  busy() {
    return (this.motionT ?? 0) < this.motionEnd || (this.trial != null && this.trial.t < TRY_HOP + TRY_TIP);
  }

  pointerDown(p) {
    if (this.stage >= 1 && (this.motionT ?? 0) >= this.motionEnd) {
      const now = this.trial ? this.trial.to : 'D';
      for (const k of ['D', 'E']) {
        const sx = PIV_X + SEATS[k] * PX_M;
        if (Math.abs(p.x - sx) <= 56 && p.y > 150 && p.y < 400) {
          if (k !== now && (!this.trial || this.trial.t >= TRY_HOP + TRY_TIP)) this.trial = { from: now, to: k, t: 0 };
          return;
        }
      }
    }
    this.motionT = 0;
    this.trial = null;
    this.animateFor(800);
  }

  // Everything on screen is a function of the beat, motionT and the one trial.
  state() {
    const t = this.motionT ?? 0;
    if (this.stage < 1) return { ang: 0, kids: [null, null], dims: inOutSine(clamp01((t - 0.2) / 1.2)) };
    const s = { dims: 0, kids: [], ang: 0 };
    // kid 0 to A
    const h0 = span(t, HOP0);
    s.kids[0] = { seat: h0 >= 1 ? 'A' : null, hop: h0 > 0 && h0 < 1 ? { to: 'A', u: h0, fromX: KIDS[0].standX } : null };
    const h1 = span(t, HOP1);
    let seat1 = h1 >= 1 ? 'D' : null;
    let hop1 = h1 > 0 && h1 < 1 ? { to: 'D', u: h1, fromX: KIDS[1].standX } : null;
    const a0 = tiltOf(netOf('A', null)), aD = tiltOf(netOf('A', 'D'));
    if (t < TIP0[0]) s.ang = 0;
    else if (t < TIP1[0]) s.ang = a0 * outBack(span(t, TIP0));
    else s.ang = a0 + (aD - a0) * outBack(span(t, TIP1));
    if (this.trial) {
      const tr = this.trial;
      const hu = clamp01(tr.t / TRY_HOP), tu = clamp01((tr.t - TRY_HOP) / TRY_TIP);
      seat1 = hu >= 1 ? tr.to : null;
      hop1 = hu < 1 ? { to: tr.to, u: hu, fromSeat: tr.from } : null;
      const af = tiltOf(netOf('A', tr.from)), at = tiltOf(netOf('A', tr.to));
      s.ang = af + (at - af) * outBack(tu);
    }
    s.kids[1] = { seat: seat1, hop: hop1 };
    s.pill0 = t >= TIP0[0] + 0.2;
    s.pill1 = seat1 != null && (this.trial ? this.trial.t >= TRY_HOP : t >= TIP1[0] + 0.1);
    return s;
  }

  draw(ctx, c) {
    const s = this.state();
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND);
    this.levelLine(ctx, c);
    this.stand(ctx, c);
    // kids still on the ground stand behind nothing; draw them before the plank
    for (let k = 0; k < 2; k += 1) if (s.kids[k] && !s.kids[k].seat && !s.kids[k].hop) this.standing(ctx, c, k);
    const g = drawLeverPlank(ctx, c, {
      x: PIV_X, y: PIV_Y, angle: s.ang, left: HALF, right: HALF, thick: TH, fulcrum: false, tone: 1,
      seats: KEYS.map((k) => ({ at: SEATS[k] * PX_M })),
    });
    this.letters(ctx, c, s.ang);
    if (s.dims > 0) this.dims(ctx, c, s.dims);
    for (let k = 0; k < 2; k += 1) this.kid(ctx, c, k, s, g);
    this.cap(ctx, c);
    if (this.stage >= 1) this.moments(ctx, c, s, g);
  }

  seatPoint(g, key) {
    const p = g.at(SEATS[key] * PX_M);
    return { x: p.x, y: p.y - 7 };
  }

  levelLine(ctx, c) {
    const y = PIV_Y - TH / 2;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.3);
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(PIV_X - HALF - 8, y); ctx.moveTo(PIV_X + HALF + 8, y); ctx.lineTo(666, y); ctx.stroke();
    ctx.restore();
  }

  // The A-frame the plank turns on: two legs, a cross brace, foot pads, bearing.
  stand(ctx, c) {
    const col = darken(c.s1, 0.15);
    const feet = [PIV_X - 86, PIV_X + 86];
    const leg = (x0, y0, x1, y1, w = 14) => {
      const len = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
      ctx.save();
      ctx.translate(x0, y0); ctx.rotate(a);
      rr(ctx, 0, -w / 2, len, w, w / 2); ctx.fillStyle = col; ctx.fill();
      rr(ctx, 0, w * 0.1, len, w * 0.4, w * 0.2); ctx.fillStyle = darken(col, 0.22); ctx.fill();
      rr(ctx, 3, -w / 2 + 2, len - 6, w * 0.22, 2); ctx.fillStyle = lighten(col, 0.35); ctx.fill();
      rr(ctx, 0, -w / 2, len, w, w / 2); ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    };
    for (const fx of feet) drawShadow(ctx, c, fx, GROUND + 2, 32, 7, 0.8);
    leg(PIV_X, PIV_Y + 6, feet[0], GROUND - 6);
    leg(PIV_X, PIV_Y + 6, feet[1], GROUND - 6);
    const by = PIV_Y + (GROUND - PIV_Y) * 0.5, bs = 86 * 0.5;
    leg(PIV_X - bs, by, PIV_X + bs, by, 10);
    for (const fx of feet) {
      rr(ctx, fx - 24, GROUND - 9, 48, 11, 5); ctx.fillStyle = darken(col, 0.4); ctx.fill();
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(PIV_X - 20, PIV_Y + 14); ctx.lineTo(PIV_X + 20, PIV_Y + 14);
    ctx.lineTo(PIV_X + 10, PIV_Y - 4); ctx.lineTo(PIV_X - 10, PIV_Y - 4); ctx.closePath();
    ctx.fillStyle = darken(col, 0.25); ctx.fill();
    ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // Seat letters on tabs under the plank (they turn with it), as in Fig 7.34.
  letters(ctx, c, ang) {
    ctx.save();
    ctx.translate(PIV_X, PIV_Y);
    ctx.rotate(ang);
    for (const k of KEYS) {
      const x = SEATS[k] * PX_M;
      ctx.save();
      ctx.translate(x, 30);
      ctx.rotate(-ang);
      rr(ctx, -16, -15, 32, 30, 8); ctx.fillStyle = c.raised; ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.35); ctx.lineWidth = 2; ctx.stroke();
      ctx.font = font(c, 800, 22, true);
      ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k, 0, 1);
      ctx.restore();
    }
    ctx.restore();
  }

  // The fulcrum's own letter on the pivot pin.
  cap(ctx, c) {
    const x = PIV_X, y = PIV_Y - TH / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = c.raised; ctx.fill();
    ctx.strokeStyle = darken(c.s1, 0.3); ctx.lineWidth = 3; ctx.stroke();
    ctx.font = font(c, 800, 22, true);
    ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('C', x, y + 1);
    ctx.restore();
  }

  // b0: AC = EC = 2 m on the upper tier, BC = DC = 1 m on the lower, drawn out from C.
  dims(ctx, c, u) {
    const tiers = [[1, 238, c.s2], [2, 186, c.s6]];
    ctx.save();
    for (const [m, y, col] of tiers) {
      const len = m * PX_M * u;
      ctx.strokeStyle = alpha(c.labelMuted, 0.5);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      for (const sgn of [-1, 1]) { ctx.moveTo(PIV_X + sgn * m * PX_M, y + 10); ctx.lineTo(PIV_X + sgn * m * PX_M, PIV_Y - TH - 18); }
      ctx.moveTo(PIV_X, y + 10); ctx.lineTo(PIV_X, PIV_Y - TH - 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(PIV_X - len, y); ctx.lineTo(PIV_X + len, y); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const x of [PIV_X - len, PIV_X, PIV_X + len]) { ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); }
      ctx.stroke();
      if (u >= 1) {
        for (const sgn of [-1, 1]) pill(ctx, c, `${m} m`, PIV_X + sgn * m * PX_M / 2, y - 28, { bg: col, size: 22, display: true });
      }
    }
    ctx.restore();
  }

  look(c, k) {
    const kd = KIDS[k];
    return { skin: kd.skin, hairStyle: kd.hairStyle, top: c[kd.tone], mood: 'smile' };
  }

  standing(ctx, c, k) {
    const kd = KIDS[k];
    drawFigure(ctx, c, { x: kd.standX, y: GROUND, height: kd.h, build: kd.build, facing: k === 0 ? 1 : -1, pose: 'stand' }, this.look(c, k));
    this.tag(ctx, c, k, kd.standX, GROUND - kd.h - 22);
  }

  tag(ctx, c, k, x, y) {
    pill(ctx, c, `${KIDS[k].kg} kg`, x, y, { bg: c[KIDS[k].tone], size: 21, display: true });
  }

  kid(ctx, c, k, s, g) {
    const st = s.kids[k];
    if (!st) return;
    const kd = KIDS[k];
    const facing = SEATS[st.seat ?? st.hop?.to] < 0 ? 1 : -1;
    if (st.seat) {
      const p = this.seatPoint(g, st.seat);
      const sk = drawFigure(ctx, c, { x: p.x, y: p.y, height: kd.h, build: kd.build, facing, pose: 'sit', seat: p }, this.look(c, k));
      const top = sk?.anchors?.top?.y ?? p.y - kd.h * 0.6;
      this.tag(ctx, c, k, p.x, top - 20);
      st.headY = top;
      return;
    }
    if (!st.hop) return;
    // a hop along an arc from where the child stood (or sat) to the seat
    const to = this.seatPoint(g, st.hop.to);
    const from = st.hop.fromSeat ? this.seatPoint(g, st.hop.fromSeat) : { x: st.hop.fromX, y: GROUND };
    const u = inOutSine(st.hop.u);
    const x = from.x + (to.x - from.x) * u;
    const y = from.y + (to.y - from.y) * u - Math.sin(Math.PI * st.hop.u) * 46;
    drawFigure(ctx, c, { x, y, height: kd.h, build: kd.build, facing, pose: 'stand' }, this.look(c, k));
  }

  // Mass x distance for each seated child, above the tags.
  moments(ctx, c, s, g) {
    const rows = [];
    if (s.pill0) rows.push([0, 'A']);
    if (s.pill1) rows.push([1, s.kids[1].seat]);
    for (const [k, seat] of rows) {
      const p = this.seatPoint(g, seat);
      const d = Math.abs(SEATS[seat]);
      const y = (s.kids[k].headY ?? p.y - 80) - 70;
      pill(ctx, c, `${KIDS[k].kg} x ${d} = ${KIDS[k].kg * d}`, Math.max(96, Math.min(584, p.x)), y, { bg: c.raised, ink: c.label, size: 24, display: true });
    }
  }
}
