import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, clamp01,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';

// MachineStopsScene - blk-l09-s01, Why Real Machines Stop (P and P 13).
// b0: an overbalanced wheel (eight weights on hinged arms: they swing out on
//     the falling right side and fold in on the rising left side) is given one
//     push. It turns three times, slower each turn, and stops.
// b1: the same run with the energy shown. Friction at the axle glows and
//     rings, air drags on the weights; the K bar falls by the same slice each
//     turn (dashed turn marks) and the heat and sound bar rises by that slice.
//     The dashed total line never moves: nothing is lost, nothing comes back.

const CX = 236, CY = 232, R = 132;      // the wheel: centre and rim radius
const ARM = 52, BALL_R = 15, N_W = 8;
const FLOOR = 470;
const TURNS = 3;
const RUN_S = 5.2;                      // the push to the stop
const PUSH_S = 0.7;
const THETA_MAX = TURNS * Math.PI * 2;
const BAR_X = 492, BAR_Y = 58, BAR_H = 300;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class MachineStopsScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'An overbalanced wheel on a wooden stand: eight weights on hinged arms, swung out on the right side and folded in on the left. It is given one push, turns three times, slower each turn, and stops. Then the same run with two energy bars: the kinetic energy bar falls by the same slice each turn while the heat and sound bar rises by that slice, as friction at the axle and air resistance act, until the wheel stops with all of it as heat and sound.';

  enter() {
    this.runT = 0;      // seconds since the push
  }

  get energyBeat() { return this.stage >= 1; }

  pointerDown() {
    this.runT = 0;      // tap: push it again
    this.animateFor(800);
  }

  get runEnd() { return RUN_S + 0.1; }
  update(d) { this.runT = Math.min(this.runEnd, (this.runT ?? 0) + d); }
  busy() { return (this.runT ?? 0) < this.runEnd; }

  // Constant friction torque: the wheel loses the same energy every turn, so
  // K falls linearly with the angle turned and the speed falls linearly in time.
  get u() { return clamp01((this.runT ?? 0) / RUN_S); }
  get theta() { const v = 1 - this.u; return THETA_MAX * (1 - v * v); }
  get speed() { return 1 - this.u; }            // omega / omega0
  get kFrac() { const v = 1 - this.u; return v * v; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'grid');
    drawFloor(ctx, c, FLOOR, { seams: true });
    this.stand(ctx, c, 'back');
    this.wheel(ctx, c);
    this.stand(ctx, c, 'front');
    this.push(ctx, c);
    if (this.energyBeat) {
      this.losses(ctx, c);
      this.bars(ctx, c);
    }
  }

  // The A-frame: two splayed wooden legs to a floor beam, the axle block on top.
  stand(ctx, c, layer) {
    const wood = mix(c.gold, c.s4, 0.35);
    const leg = (x0, x1, w) => {
      ctx.beginPath();
      ctx.moveTo(CX - w / 2, CY + 6);
      ctx.lineTo(CX + w / 2, CY + 6);
      ctx.lineTo(x1 + w * 0.7, FLOOR - 14);
      ctx.lineTo(x1 - w * 0.7, FLOOR - 14);
      ctx.closePath();
      ctx.fillStyle = wood;
      ctx.fill();
      ctx.strokeStyle = darken(wood, 0.42);
      ctx.lineWidth = 2;
      ctx.stroke();
      // light side and shade side along the leg
      ctx.strokeStyle = lighten(wood, 0.3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CX - w / 2 + 3 * Math.sign(x1 - CX), CY + 10);
      ctx.lineTo(x1 - w * 0.5, FLOOR - 18);
      ctx.stroke();
      ctx.strokeStyle = darken(wood, 0.2);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(CX + w / 2 - 3, CY + 12);
      ctx.lineTo(x1 + w * 0.5, FLOOR - 18);
      ctx.stroke();
    };
    ctx.save();
    if (layer === 'back') {
      drawShadow(ctx, c, CX, FLOOR + 2, 170, 12, 0.9);
      leg(CX, CX + 118, 20);          // far leg, behind the wheel
      ctx.globalAlpha = 1;
    } else {
      leg(CX, CX - 118, 22);          // near leg, in front of the wheel
      // floor beam
      rr(ctx, CX - 168, FLOOR - 18, 336, 20, 5);
      ctx.fillStyle = darken(wood, 0.08);
      ctx.fill();
      ctx.fillStyle = lighten(wood, 0.22);
      ctx.fillRect(CX - 164, FLOOR - 16, 328, 4);
      ctx.fillStyle = darken(wood, 0.3);
      ctx.fillRect(CX - 164, FLOOR - 5, 328, 5);
      // the axle block and the axle end
      rr(ctx, CX - 20, CY - 16, 40, 32, 7);
      ctx.fillStyle = darken(c.stroke, 0.1);
      ctx.fill();
      ctx.fillStyle = lighten(c.stroke, 0.25);
      ctx.fillRect(CX - 16, CY - 13, 9, 26);
      ctx.beginPath();
      ctx.arc(CX, CY, 9, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.stroke, 0.45);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CX - 2, CY - 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = lighten(c.stroke, 0.4);
      ctx.fill();
    }
    ctx.restore();
  }

  // One weight: hinge on the rim, an arm, a ball. Swung straight out on the
  // right; folded back along the rim on the left (the old design's trick).
  arm(i) {
    const phi = this.theta + i * (Math.PI * 2 / N_W) - Math.PI / 2;
    const hx = CX + R * Math.cos(phi), hy = CY + R * Math.sin(phi);
    const fold = clamp01((-Math.cos(phi) + 0.2) / 0.4);
    const s = fold * fold * (3 - 2 * fold);
    const a = phi - s * 2.05;
    return { phi, hx, hy, tx: hx + ARM * Math.cos(a), ty: hy + ARM * Math.sin(a) };
  }

  wheel(ctx, c) {
    const wood = mix(c.gold, c.s4, 0.2);
    const th = this.theta;
    ctx.save();
    // spokes
    for (let i = 0; i < N_W; i++) {
      const a = th + i * Math.PI * 2 / N_W;
      const ex = CX + (R - 6) * Math.cos(a), ey = CY + (R - 6) * Math.sin(a);
      ctx.lineCap = 'round';
      ctx.strokeStyle = darken(wood, 0.4);
      ctx.lineWidth = 11;
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = wood;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = lighten(wood, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(CX + 2, CY - 2); ctx.lineTo(ex + 2 * Math.sin(a), ey - 2 * Math.cos(a)); ctx.stroke();
    }
    // the rim: dark rim line, wood body, light top-left arc, shade bottom-right arc
    ctx.lineWidth = 22;
    ctx.strokeStyle = darken(wood, 0.42);
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 17;
    ctx.strokeStyle = wood;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = lighten(wood, 0.34);
    ctx.beginPath(); ctx.arc(CX, CY, R + 4, Math.PI * 0.95, Math.PI * 1.75); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = darken(wood, 0.2);
    ctx.beginPath(); ctx.arc(CX, CY, R - 4, -0.1, Math.PI * 0.8); ctx.stroke();
    // an inner line on the rim face, broken at the joints so it reads as felloes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = darken(wood, 0.3);
    for (let i = 0; i < N_W; i++) {
      const a0 = th + i * Math.PI * 2 / N_W + 0.08, a1 = a0 + Math.PI * 2 / N_W - 0.16;
      ctx.beginPath(); ctx.arc(CX, CY, R + 1, a0, a1); ctx.stroke();
    }
    // the hub
    ctx.beginPath(); ctx.arc(CX, CY, 26, 0, Math.PI * 2);
    ctx.fillStyle = darken(wood, 0.1); ctx.fill();
    ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(CX - 5, CY - 5, 13, Math.PI, Math.PI * 1.6);
    ctx.strokeStyle = lighten(wood, 0.35); ctx.lineWidth = 3; ctx.stroke();

    // speed streaks behind each ball, as long as the wheel is fast
    const sp = this.speed;
    const arms = Array.from({ length: N_W }, (_, i) => this.arm(i));
    if (sp > 0.03) {
      for (const p of arms) {
        const rr2 = Math.hypot(p.tx - CX, p.ty - CY);
        const a1 = Math.atan2(p.ty - CY, p.tx - CX);
        ctx.strokeStyle = alpha(c.labelMuted, 0.45 * Math.min(1, sp * 1.6));
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (const k of [-6, 6]) {
          ctx.beginPath();
          ctx.arc(CX, CY, rr2 + k, a1 - 0.08 - 0.5 * sp, a1 - 0.14);
          ctx.stroke();
        }
      }
    }
    // arms and balls; one ball is a different colour so each turn can be counted
    arms.forEach((p, i) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = darken(c.stroke, 0.35);
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.hx, p.hy); ctx.lineTo(p.tx, p.ty); ctx.stroke();
      ctx.strokeStyle = lighten(c.stroke, 0.2);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p.hx, p.hy); ctx.lineTo(p.tx, p.ty); ctx.stroke();
      // the hinge pin
      ctx.beginPath(); ctx.arc(p.hx, p.hy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.stroke, 0.4); ctx.fill();
      ctx.beginPath(); ctx.arc(p.hx - 1, p.hy - 1, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = lighten(c.stroke, 0.45); ctx.fill();
      drawBall(ctx, c, { x: p.tx, y: p.ty, r: BALL_R, tone: i === 0 ? 2 : 6 });
    });
    ctx.restore();
  }

  // The push: a curved arrow over the top of the wheel, only as the run starts.
  push(ctx, c) {
    const t = this.runT ?? 0;
    const k = t < PUSH_S ? 1 : clamp01(1 - (t - PUSH_S) / 0.4);
    if (k <= 0) return;
    const r = R + ARM + 34, a0 = -Math.PI * 0.78, a1 = -Math.PI * 0.36;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.strokeStyle = c.accent;
    ctx.fillStyle = c.accent;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(CX, CY, r, a0, a1); ctx.stroke();
    const hx = CX + r * Math.cos(a1), hy = CY + r * Math.sin(a1);
    const tan = a1 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(hx + 10 * Math.cos(tan), hy + 10 * Math.sin(tan));
    ctx.lineTo(hx - 12 * Math.cos(tan) + 11 * Math.cos(a1), hy - 12 * Math.sin(tan) + 11 * Math.sin(a1));
    ctx.lineTo(hx - 12 * Math.cos(tan) - 11 * Math.cos(a1), hy - 12 * Math.sin(tan) - 11 * Math.sin(a1));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    pill(ctx, c, 'push', CX - 150, CY - R - 44, { bg: c.accent, size: 24, alpha: k });
  }

  // Where the energy goes: a warm glow and a ring of sound at the axle, and the
  // two names, both only while the wheel turns (they leave with the speed).
  losses(ctx, c) {
    const sp = this.speed;
    const t = this.runT ?? 0;
    ctx.save();
    if (sp > 0.02) {
      const g = ctx.createRadialGradient(CX, CY, 4, CX, CY, 46);
      g.addColorStop(0, alpha(c.s8, 0.75 * Math.min(1, sp * 1.5)));
      g.addColorStop(1, alpha(c.s8, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(CX, CY, 46, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = alpha(c.s8, 0.8 * Math.min(1, sp * 1.5));
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const ph = ((t * 1.6 + j / 3) % 1);
        const rad = 34 + ph * 30;
        ctx.globalAlpha = 1 - ph;
        ctx.beginPath(); ctx.arc(CX, CY, rad, -0.5, 0.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(CX, CY, rad, Math.PI - 0.5, Math.PI + 0.5); ctx.stroke();
      }
    }
    ctx.restore();
    const a = 1;
    // friction: beside the near leg, a dashed leader up the leg to the axle;
    // air resistance: over the top right, where the streaks are longest
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(104, 382); ctx.lineTo(CX - 34, CY + 22); ctx.stroke();
    ctx.restore();
    pill(ctx, c, 'friction', 66, 398, { bg: c.s8, size: 22, alpha: a });
    pill(ctx, c, 'air resistance', 404, 28, { bg: c.s5, size: 22, alpha: a });
  }

  bars(ctx, c) {
    const k = this.kFrac;
    const fade = clamp01((this.runT ?? 0) / 0.4);
    const box = drawEnergyBars(ctx, c, {
      x: BAR_X, y: BAR_Y, h: BAR_H, max: 1, total: 1, size: 22, alpha: fade,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'heat', label: 'heat and sound', tone: 8 }],
      values: { K: k, heat: 1 - k },
    });
    // one slice per turn: the same three slices on both slots
    if (!box || !box.bars) return;
    ctx.save();
    ctx.globalAlpha = 0.75 * fade;
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    for (const b of box.bars) {
      for (let n = 1; n < TURNS; n++) {
        const y = box.baseY - BAR_H * (n / TURNS);
        ctx.beginPath(); ctx.moveTo(b.x + 3, y); ctx.lineTo(b.x + b.w - 3, y); ctx.stroke();
      }
    }
    ctx.restore();
    // the turn count beside the K slot, so a slice reads as one turn
    const kb = box.bars[0];
    const done = Math.min(TURNS, Math.floor(this.theta / (Math.PI * 2) + 1e-6));
    pill(ctx, c, `turns: ${done}`, kb.x + kb.w / 2 + 34, BAR_Y + BAR_H + 112, { bg: c.s2, size: 22, alpha: fade });
  }
}
