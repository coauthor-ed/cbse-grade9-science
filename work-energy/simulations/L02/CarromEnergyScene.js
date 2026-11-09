import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, clamp01,
  mix, alpha, lighten, darken, rr, vectorArrow, font,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// CarromEnergyScene - blk-l02-s05, A Carrom Shot (3 beats).
// One straight shot seen from above: striker, white coin, black coin and the
// top-left pocket lie on one line, so each hit is head-on.
// Bars: one plain energy bar per piece (K and U are named only at blk-l02-s12).
// b0: the striker hits the white coin. At the contact the force on the coin
//     points the way the coin moves (F and s together): the white bar fills
//     as the striker's falls.
// b1: the same hit replayed; now the arrows on the striker: the force on it
//     points back, against its motion (F against s): its bar falls.
// b2: the white coin hits the black coin: white bar empties, black bar
//     fills, and the black coin slides into the pocket.
// Masses: striker 3 times a coin. Head-on and springy, the striker keeps a
// quarter of its K and the coin takes three quarters; equal coins swap all
// of it. Bars carry no numbers: only the shares are shown.

const BX = 14, BY = 50, BS = 420, FRAME = 26;
const FL = BX + FRAME, FH = BX + BS - FRAME;            // felt x range 40..408
const FT = BY + FRAME, FB = BY + BS - FRAME;            // felt y range 76..444
const POCKET_R = 19;
const POCKET = { x: FL + 17, y: FT + 17 };
const START = { x: 330, y: FB - 62 };                   // the striker on its baseline
const LINE_LEN = Math.hypot(POCKET.x - START.x, POCKET.y - START.y);
const UX = (POCKET.x - START.x) / LINE_LEN, UY = (POCKET.y - START.y) / LINE_LEN;
const NX = -UY, NY = UX;                                // perpendicular (towards upper right)
const R_S = 22, R_C = 16;
// the white-black hit sits near (180, 220), clear of the corner, so the black
// coin has a long straight run to the pocket and nothing bunches there
const D_WHITE = 118, D_BLACK = 244;                     // coins at rest, along the line
const D_HIT1 = D_WHITE - R_S - R_C;                     // striker centre at the first hit
const D_HIT2 = D_BLACK - 2 * R_C;                       // white centre at the second hit
const D_LIP = LINE_LEN - 12;                            // black coin at the pocket mouth
const V0 = D_HIT1 / 0.7;                                // striker speed before the hit
const VS = V0 / 2, VC = V0 * 1.5;                       // after: striker half speed, coin 1.5x
const T_A = D_HIT1 / V0;                                // 0.7 s to the first hit
const T_B = 0.14;                                       // b0/b1: just after the hit
const T_HOLD = 0.35;                                    // b2: hold before the white moves on
const T_C = (D_HIT2 - (D_WHITE + VC * T_B)) / VC;       // b2: white to the black coin
const T_D = (D_LIP - D_BLACK) / VC;                     // b2: black to the pocket
const TWEEN = 0.5;
const K_S1 = 0.25, K_C = 0.75;                          // shares after the hit

const BAR_X = 446, BAR_Y = 82, BAR_H = 214;
const PANEL_W = 230, PANEL_H = 386;                     // to y 468, the board's bottom edge

const at = (d) => ({ x: START.x + UX * d, y: START.y + UY * d });
const off = (p, k) => ({ x: p.x + NX * k, y: p.y + NY * k });

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class CarromEnergyScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A carrom board seen from above. A striker slides into a white coin; at the hit the push on the coin points the way the coin moves, and the push on the striker points back against its motion. Beside the board, three energy bars: the striker bar falls as the white bar fills. Then the white coin hits a black coin: the white bar empties, the black bar fills, and the black coin slides into the corner pocket.';

  enter() {
    this.motionT = 0;
  }

  pointerDown() {
    this.motionT = 0;   // tap: play the beat again
    this.animateFor(800);
  }

  get motionEnd() { return (this.stage >= 2 ? T_HOLD + T_C + T_D : T_A + T_B) + 0.05; }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // Piece positions (along the line, px from the striker start) at scene time t.
  stateAt(t) {
    if (this.stage < 2) {
      if (t <= T_A) return { s: V0 * t, w: D_WHITE, b: D_BLACK, hit1: -1, hit2: -1 };
      const u = t - T_A;
      return { s: D_HIT1 + VS * u, w: D_WHITE + VC * u, b: D_BLACK, hit1: u, hit2: -1 };
    }
    const base = { s: D_HIT1 + VS * T_B, w: D_WHITE + VC * T_B };
    const u = Math.max(0, t - T_HOLD);
    const s = base.s + VS * u;
    if (u <= T_C) return { s, w: base.w + VC * u, b: D_BLACK, hit1: 9, hit2: -1 };
    const v = u - T_C;
    return { s, w: D_HIT2, b: Math.min(D_LIP, D_BLACK + VC * v), hit1: 9, hit2: v };
  }

  energies(st) {
    const k1 = barsAt({ s: 1, w: 0 }, { s: K_S1, w: K_C }, st.hit1 < 0 ? 0 : clamp01(st.hit1 / TWEEN));
    if (st.hit2 < 0) return { striker: k1.s, white: k1.w, black: 0 };
    const k2 = barsAt({ w: K_C, b: 0 }, { w: 0, b: K_C }, clamp01(st.hit2 / TWEEN));
    return { striker: K_S1, white: k2.w, black: k2.b };
  }

  draw(ctx, c) {
    const t = this.motionT ?? 0;
    const st = this.stateAt(t);
    const done = !this.busy();
    drawBackdrop(ctx, c, 'plain');
    this.table(ctx, c);
    this.board(ctx, c);
    this.ghosts(ctx, c, st, t);
    this.pieces(ctx, c, st);
    if (done) this.arrows(ctx, c);
    this.bars(ctx, c, this.energies(st));
  }

  pal(c) {
    const wood = darken(mix(c.s8, c.s2, 0.35), 0.38);
    const ply = mix(lighten(c.s2, 0.62), c.bgSurface, 0.18);
    return {
      wood, woodLight: lighten(wood, 0.2), woodShade: darken(wood, 0.3), grain: alpha(darken(wood, 0.45), 0.5),
      ply, plyEdge: darken(ply, 0.12), ink: alpha(darken(c.s6, 0.45), 0.7),
      hole: darken(mix(c.s5, c.stroke, 0.5), 0.82),
      striker: mix(c.s1, c.bgSurface, 0.1),
      white: lighten(c.s2, 0.8),
      black: darken(mix(c.s5, c.stroke, 0.5), 0.72),
    };
  }

  table(ctx, c) {
    drawShadow(ctx, c, BX + BS / 2, BY + BS + 4, BS * 0.52, 12, 0.9);
  }

  board(ctx, c) {
    const p = this.pal(c);
    ctx.save();
    // the wooden frame: lip, light top/left, shade bottom/right, grain
    rr(ctx, BX, BY + 5, BS, BS, 12); ctx.fillStyle = p.woodShade; ctx.fill();
    rr(ctx, BX, BY, BS, BS, 12); ctx.fillStyle = p.wood; ctx.fill();
    ctx.fillStyle = p.woodLight;
    ctx.fillRect(BX + 8, BY + 4, BS - 16, 6);
    ctx.fillRect(BX + 4, BY + 8, 6, BS - 16);
    ctx.fillStyle = p.woodShade;
    ctx.fillRect(BX + 10, BY + BS - 10, BS - 18, 6);
    ctx.fillRect(BX + BS - 10, BY + 10, 6, BS - 18);
    ctx.strokeStyle = p.grain; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const k = 8 + i * 5;
      ctx.beginPath();
      ctx.moveTo(BX + 30, BY + k + 4); ctx.bezierCurveTo(BX + 150, BY + k, BX + 260, BY + k + 6, BX + BS - 30, BY + k + 3);
      ctx.moveTo(BX + 30, BY + BS - k - 2); ctx.bezierCurveTo(BX + 170, BY + BS - k + 3, BX + 280, BY + BS - k - 4, BX + BS - 30, BY + BS - k);
      ctx.moveTo(BX + k + 3, BY + 30); ctx.bezierCurveTo(BX + k - 2, BY + 160, BX + k + 4, BY + 270, BX + k, BY + BS - 30);
      ctx.moveTo(BX + BS - k - 2, BY + 30); ctx.bezierCurveTo(BX + BS - k + 3, BY + 150, BX + BS - k - 3, BY + 280, BX + BS - k, BY + BS - 30);
      ctx.stroke();
    }
    // the playing surface: pale ply with an inner edge shadow
    ctx.fillStyle = darken(p.wood, 0.5);
    ctx.fillRect(FL - 3, FT - 3, FH - FL + 6, FB - FT + 6);
    ctx.fillStyle = p.ply;
    ctx.fillRect(FL, FT, FH - FL, FB - FT);
    ctx.fillStyle = alpha(darken(p.ply, 0.3), 0.35);
    ctx.fillRect(FL, FT, FH - FL, 5);
    ctx.fillRect(FL, FT, 5, FB - FT);
    // markings: the four baselines with end circles, centre circles, corner arrows
    const mx = (FL + FH) / 2, my = (FT + FB) / 2;
    ctx.strokeStyle = p.ink; ctx.lineWidth = 2;
    const a = 82, b = 62, e = 270 / 2;
    const lines = [
      [[mx - e, FB - a], [mx + e, FB - a], [mx - e, FB - b], [mx + e, FB - b]],
      [[mx - e, FT + a], [mx + e, FT + a], [mx - e, FT + b], [mx + e, FT + b]],
      [[FL + a, my - e], [FL + a, my + e], [FL + b, my - e], [FL + b, my + e]],
      [[FH - a, my - e], [FH - a, my + e], [FH - b, my - e], [FH - b, my + e]],
    ];
    for (const [p1, p2, p3, p4] of lines) {
      ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.moveTo(...p3); ctx.lineTo(...p4); ctx.stroke();
      for (const [q1, q2] of [[p1, p3], [p2, p4]]) {
        ctx.beginPath(); ctx.arc((q1[0] + q2[0]) / 2, (q1[1] + q2[1]) / 2, 10, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.arc(mx, my, 62, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.stroke();
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = sx < 0 ? FL : FH, cy = sy < 0 ? FT : FB;
      ctx.beginPath();
      ctx.moveTo(cx - sx * 44, cy - sy * 44); ctx.lineTo(cx - sx * 118, cy - sy * 118);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - sx * 124, cy - sy * 124, 7, 0, Math.PI * 2); ctx.stroke();
    }
    // the pockets: a rim, a dark hole and the net shadow inside
    for (const [px, py] of [[FL + 17, FT + 17], [FH - 17, FT + 17], [FL + 17, FB - 17], [FH - 17, FB - 17]]) {
      ctx.fillStyle = darken(p.wood, 0.25);
      ctx.beginPath(); ctx.arc(px, py, POCKET_R + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.hole;
      ctx.beginPath(); ctx.arc(px, py, POCKET_R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha(lighten(p.hole, 0.25), 0.6);
      ctx.beginPath(); ctx.arc(px + 4, py + 4, POCKET_R - 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  disc(ctx, c, pt, r, fill, k = 1, grooves = 2) {
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.fillStyle = alpha(darken(fill, 0.7), 0.35);
    ctx.beginPath(); ctx.ellipse(pt.x + 3, pt.y + 4, r, r * 0.96, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(fill, 0.3);
    ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(pt.x - 1, pt.y - 1, r - 2.5, 0, Math.PI * 2); ctx.fill();
    // shade side
    ctx.fillStyle = alpha(darken(fill, 0.22), 0.7);
    ctx.beginPath(); ctx.arc(pt.x - 1, pt.y - 1, r - 2.5, -0.6, Math.PI * 0.85); ctx.fill();
    ctx.strokeStyle = alpha(darken(fill, 0.35), 0.9); ctx.lineWidth = 1.5;
    for (let i = 1; i <= grooves; i++) {
      ctx.beginPath(); ctx.arc(pt.x - 1, pt.y - 1, (r - 2.5) * (1 - i * 0.28), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = alpha(lighten(fill, 0.6), 0.65);
    ctx.beginPath(); ctx.ellipse(pt.x - r * 0.35, pt.y - r * 0.4, r * 0.32, r * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Faint copies of each moving piece at earlier moments: its path, at rest too.
  ghosts(ctx, c, st, t) {
    const p = this.pal(c);
    const back = [0.1, 0.2, 0.3];
    for (const dt of back) {
      if (t - dt < 0) continue;
      const g = this.stateAt(t - dt);
      const k = 0.26 - dt * 0.55;
      if (Math.abs(g.s - st.s) > 2) this.disc(ctx, c, at(g.s), R_S, p.striker, k, 1);
      if (Math.abs(g.w - st.w) > 2) this.disc(ctx, c, at(g.w), R_C, p.white, k, 1);
      if (Math.abs(g.b - st.b) > 2) this.disc(ctx, c, at(g.b), R_C, p.black, k, 1);
    }
  }

  pieces(ctx, c, st) {
    const p = this.pal(c);
    const sink = clamp01((st.b - (D_LIP - 40)) / 40);
    this.disc(ctx, c, at(st.b), R_C * (1 - 0.15 * sink), p.black, 1, 2);
    this.disc(ctx, c, at(st.w), R_C, p.white, 1, 2);
    this.disc(ctx, c, at(st.s), R_S, p.striker, 1, 3);
  }

  // At rest: the push at the hit, drawn on a ghost of the pair at that moment.
  arrows(ctx, c) {
    const ang = Math.atan2(UY, UX);
    const fcol = c.accent, scol = c.s2;          // one-world: F solid in the force tone, s dashed
    const label = (txt, pt, bg) => pill(ctx, c, txt, pt.x, pt.y, { bg, size: 26 });
    const sD = D_HIT1 + VS * T_B, wD = D_WHITE + VC * T_B;
    if (this.stage === 0) {
      const w0 = at(wD);
      vectorArrow(ctx, c, w0.x, w0.y, { angle: ang, length: 58, col: fcol, width: 6, head: 16 });
      label('F', off(at(wD + 34), -34), fcol);
      const a0 = off(at(wD - 10), 36), a1 = off(at(wD + 70), 36);
      displacementArrow(ctx, c, a0.x, a0.y, a1.x, a1.y, { col: scol, width: 5, head: 15 });
      label('s', off(at(wD + 30), 66), scol);
      pill(ctx, c, 'positive work', 300, 140, { bg: c.s3, size: 26 });
    } else if (this.stage === 1) {
      const s0 = at(sD);
      vectorArrow(ctx, c, s0.x, s0.y, { angle: ang + Math.PI, length: 66, col: fcol, width: 6, head: 16 });
      label('F', off(at(sD - 46), -36), fcol);
      const a0 = off(at(sD - 50), 42), a1 = off(at(sD + 20), 42);
      displacementArrow(ctx, c, a0.x, a0.y, a1.x, a1.y, { col: scol, width: 5, head: 15 });
      label('s', off(at(sD - 16), 72), scol);
      pill(ctx, c, 'negative work', 270, 412, { bg: c.s6, size: 26 });
    } else {
      const b0 = at(D_BLACK);
      this.disc(ctx, c, b0, R_C, this.pal(c).black, 0.35, 1);
      vectorArrow(ctx, c, b0.x, b0.y, { angle: ang, length: 44, col: fcol, width: 6, head: 16 });
      label('F', off(at(D_BLACK + 22), -44), fcol);   // below-left of the path, off the corner marking
    }
  }

  // The panel is drawn here, not by the kit: three names at 26 px (11 px on a phone)
  // do not fit side by side beside the board, so white sits on its own row and
  // striker and black share the row below; each name stays under its bar.
  bars(ctx, c, e) {
    const focus = this.stage === 0 ? 'white' : this.stage === 1 ? 'striker' : 'black';
    const bars = [
      { id: 'striker', label: ' ', tone: 1 },
      { id: 'white', label: ' ', tone: 1 },
      { id: 'black', label: ' ', tone: 1 },
    ];
    const pw = PANEL_W, ph = PANEL_H;
    rr(ctx, BAR_X, BAR_Y + 4, pw, ph, 14); ctx.fillStyle = darken(c.raised, 0.3); ctx.fill();
    rr(ctx, BAR_X, BAR_Y, pw, ph, 14); ctx.fillStyle = c.raised; ctx.fill();
    rr(ctx, BAR_X, BAR_Y, pw, ph, 14); ctx.strokeStyle = mix(c.raised, c.stroke, 0.7); ctx.lineWidth = 2.5; ctx.stroke();
    const out = drawEnergyBars(ctx, c, { x: BAR_X + 20, y: BAR_Y + 16, h: BAR_H, barW: 46, gap: 20, max: 1, bars, values: e, size: 26, panel: false, title: 'energy' });   // K is named only at blk-l02-s12
    const lit = (id) => id === focus || (this.stage === 2 && id === 'white');
    // dim the bars this beat does not name
    ctx.save();
    for (const b of out.bars) {
      if (lit(b.id)) continue;
      ctx.fillStyle = alpha(c.raised, 0.6);
      ctx.fillRect(b.x - 8, out.baseY - BAR_H - 4, b.w + 16, BAR_H + 10);
    }
    ctx.restore();
    // a piece swatch under each bar, then its name, so the bar and the piece are tied
    const p = this.pal(c);
    const fills = { striker: p.striker, white: p.white, black: p.black };
    ctx.save();
    ctx.font = font(c, 700, 26, true);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const b of out.bars) {
      const cx = b.x + b.w / 2;
      this.disc(ctx, c, { x: cx, y: out.baseY + 26 }, 13, fills[b.id], 1, 1);
      const lw = ctx.measureText(b.id).width;
      const x = Math.min(BAR_X + pw - 12 - lw / 2, Math.max(BAR_X + 12 + lw / 2, cx));
      const y = out.baseY + (b.id === 'white' ? 72 : 104);
      ctx.globalAlpha = lit(b.id) ? 1 : 0.45;
      ctx.fillStyle = c.label;
      ctx.fillText(b.id, x, y);
    }
    ctx.restore();
  }
}
