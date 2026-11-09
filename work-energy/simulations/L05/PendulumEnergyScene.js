import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, alpha, lighten, darken, mix, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawPendulum } from 'simulations/base/kit/SimApparatus.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// Book Fig 7.20 (Activity 7.2): P on the right at the level line, Q the lowest point, R on the left.
//   blk-l05-s05 (2 beats): stage 0 an ideal swing P to R and back, the K and U bars swap;
//                          stage 1 a real pendulum: each swing a little smaller, the heat bar grows.
//   blk-l05-n01 (1 beat):  stage 2 the swing dies away until the bob hangs still at Q: K and U
//                          empty, the heat bar full, level with the dashed total line.
const MAP_S05 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP_N01 = [[{ idx: 2, dwellMs: null }]];

const PIV = { x: 200, y: 96 };
const LEN = 230;
const A0 = 0.72; // rad: P
const T = 1.4; // s per full swing
const GROUND = 470;
const ROUNDS = [2, 2, 4]; // full swings per stage
const DECAY = [0, 0.05, 0.2]; // amplitude loss rate per second
const START = [A0, A0, A0 * Math.exp(-0.05 * 2 * T)]; // stage 2 picks up where stage 1 stopped
const mech = (a) => 1 - Math.cos(a);
const E0 = mech(A0);

export class PendulumEnergyScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP_S05;
  static BEAT_MAPS = { 2: MAP_S05, 1: MAP_N01 };
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A pendulum hangs from a clamp. The bob is pulled to P, level with a dashed line, and let go: at P the U bar is full and K is empty, at Q, the lowest point, K is full and U empty, and at R, on the other side, U is full again. On a real pendulum each swing is a little smaller and a heat bar grows. Last, the swing dies away until the bob hangs still at Q, K and U empty and the heat bar full to the dashed total line.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Swing again' }];

  enter() {
    this.swingT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.swingT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    const run = ROUNDS[this.stage] * T;
    return reducedMotion() ? run : Math.min(run, Math.max(0, this.age - (this.swingT0 || 0) - 0.2));
  }

  busy() {
    return this.age - (this.swingT0 || 0) < ROUNDS[this.stage] * T + 0.5;
  }

  // the swing at time t of this stage: amplitude, angle, and the energy split
  state(t) {
    const s = this.stage;
    // the last stage dies right away: the bob comes to hang still at Q
    const amp = START[s] * Math.exp(-DECAY[s] * t) * (s === 2 ? Math.max(0, 1 - t / (ROUNDS[2] * T)) : 1);
    const ang = amp * Math.cos((2 * Math.PI * t) / T);
    const m = mech(amp) / E0; // mechanical energy left, of the start
    const U = mech(ang) / E0;
    return { amp, ang, U, K: Math.max(0, m - U), heat: 1 - m };
  }

  draw(ctx, c) {
    const s = this.stage;
    const st = this.state(this.t());
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, GROUND, {});
    this.stand(ctx, c);
    const bobAt = (a) => ({ x: PIV.x + LEN * Math.sin(a), y: PIV.y + LEN * Math.cos(a) });
    // Fig 7.20's h: from the level of the bob at Q up to the level of P and R
    this.hMark(ctx, c, bobAt(0), bobAt(A0));
    // where the bob reaches on this swing: a faint ghost at the far end when it falls short
    if (s >= 1 && st.amp > 0.03) {
      const g = bobAt(-st.amp);
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = alpha(c.label, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const bob = bobAt(st.ang);
    drawShadow(ctx, c, bob.x, GROUND + 2, 24, 5, 0.5);
    drawPendulum(ctx, c, {
      x: PIV.x, y: PIV.y, len: LEN, angle: st.ang, bobR: 20, tone: 6, support: true,
      arc: A0, level: true, size: 26,
      points: [{ angle: A0, label: 'P' }, { angle: 0, label: 'Q' }, { angle: -A0, label: 'R' }],
    });
    // heat at the support and in the air (stage 1 on): soft wavy lines that stay
    if (s >= 1 && st.heat > 0.02) this.heat(ctx, c, st.heat);
    this.bars(ctx, c, st, s);
  }

  stand(ctx, c) {
    // a lab stand: heavy base, rod, and the arm the kit's beam and clamp hang from
    const metal = mix(c.stroke, c.bgDeep, 0.15);
    const rodX = PIV.x - 178;
    ctx.fillStyle = darken(metal, 0.35);
    rr(ctx, rodX - 14, GROUND - 20, 110, 22, 5);
    ctx.fill();
    ctx.fillStyle = metal;
    rr(ctx, rodX - 12, GROUND - 22, 106, 16, 5);
    ctx.fill();
    ctx.fillStyle = lighten(metal, 0.3);
    ctx.fillRect(rodX - 8, GROUND - 21, 98, 3);
    ctx.fillStyle = darken(metal, 0.3);
    ctx.fillRect(rodX - 6, PIV.y - 30, 12, GROUND - PIV.y + 10);
    ctx.fillStyle = lighten(metal, 0.25);
    ctx.fillRect(rodX - 6, PIV.y - 30, 4, GROUND - PIV.y + 10);
    // the arm across to the pivot
    ctx.fillStyle = darken(metal, 0.3);
    rr(ctx, rodX - 10, PIV.y - 26, PIV.x - rodX + 30, 12, 4);
    ctx.fill();
    ctx.fillStyle = lighten(metal, 0.3);
    ctx.fillRect(rodX - 8, PIV.y - 25, PIV.x - rodX + 26, 3);
    // the boss (clamp block) where the arm meets the rod
    ctx.fillStyle = darken(metal, 0.45);
    rr(ctx, rodX - 12, PIV.y - 34, 24, 28, 4);
    ctx.fill();
  }

  heat(ctx, c, k) {
    ctx.save();
    ctx.strokeStyle = alpha(c.s8, 0.35 + 0.5 * k);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const wig = (x, y, n) => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const yy = y - i * 4;
        const xx = x + Math.sin(i * 0.9) * 3.5;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    };
    // at the support
    wig(PIV.x - 14, PIV.y - 34, 6);
    wig(PIV.x + 14, PIV.y - 34, 6);
    // in the air along the path
    const n = Math.round(2 + 4 * k);
    for (let i = 0; i < n; i++) {
      const a = -A0 * 0.8 + (1.6 * A0 * (i + 0.5)) / n;
      const x = PIV.x + (LEN + 58) * Math.sin(a);
      const y = PIV.y + (LEN + 58) * Math.cos(a);
      wig(x, y + 14, 4);
    }
    ctx.restore();
  }

  hMark(ctx, c, q, p) {
    const x = p.x + 40;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.45);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(q.x + 26, q.y);
    ctx.lineTo(x + 10, q.y);
    ctx.stroke();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, q.y - 4);
    ctx.lineTo(x, p.y + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.label;
    for (const [y, d] of [[p.y, 1], [q.y, -1]]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y + 10 * d);
      ctx.lineTo(x + 6, y + 10 * d);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    pill(ctx, c, 'h', x + 30, (p.y + q.y) / 2, { size: 26 });
  }

  bars(ctx, c, st, s) {
    // the one-world bars: K, U, heat (the slides' word), with the dashed total line inside the panel
    drawEnergyBars(ctx, c, {
      x: 452, y: 64, h: 230, barW: 40, gap: 16, max: 1, total: 1, size: 26, minSize: 26,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }, { id: 'heat', label: 'heat', tone: 8 }],
      values: { K: st.K, U: st.U, heat: s >= 1 ? st.heat : 0 },
    });
  }
}
