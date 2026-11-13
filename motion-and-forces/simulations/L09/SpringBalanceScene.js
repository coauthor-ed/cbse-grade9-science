/**
 * SpringBalanceScene - slide blk-l09-s5 "Measuring a force" (2 beats; Fig 6.2).
 *   b0 'weight' a spring balance hangs from a lab stand. A stone is hung on the hook: the spring
 *               stretches and the pointer bobs and settles; F arrow "pull of the Earth" on the stone.
 *               The stone is taken off (pointer back to 0); then your hand takes the hook and pulls
 *               it down: the reading rises as the spring stretches; F arrow "your pull" on the hook.
 *               Readings only on the scale. Rest: hand pulling, reading steady.
 *   b1 'small'  a ladder of forces in steps of ten (each rung ten times smaller): 10 N and 1 N dimmed
 *               at the top, down to 0.001 N, where a fingertip touches (the hero, a light touch);
 *               below it a break ("21 more steps") and the last rung: smallest measured,
 *               1 yoctonewton. Words only, no power-of-ten glyphs.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr, drawShadow } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawSpringBalance } from '../shared/ForceCast.js';
import { drawSurface } from '../shared/MotionCast.js';

const FLOOR = 492, BX = 250, BY = 46, LEN = 172, MAX = 10, R_STONE = 4, R_HAND = 6;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
/** Damped settle from v0 to v1 starting at t0 (a spring that bobs, then rests). */
const settle = (a, t0, v0, v1) => (a <= t0 ? v0 : v1 + (v0 - v1) * Math.exp(-3.4 * (a - t0)) * Math.cos(7.5 * (a - t0)));
const RUNGS = [
  { text: '10 N', y: 48 }, { text: '1 N', y: 100 }, { text: '0.1 N', y: 152 }, { text: '0.01 N', y: 204 },
  { text: '0.001 N', y: 262, hero: true },
];
const BOTTOM = 468, LX0 = 70, LX1 = 118;

export class SpringBalanceScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A spring balance hangs from a stand. A stone is hung on its hook; the spring stretches and the pointer settles on the scale: the balance shows the pull of the Earth on the stone, its weight. The stone is taken off and your hand pulls the hook down; the pointer moves further: the balance reads the force of your pull. Then a ladder of forces, each rung ten times smaller: 10 newtons, 1 newton, down to 0.001 newton, the lightest touch a fingertip can feel. Below a break of 21 more steps, the smallest force measured: 1 yoctonewton.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? 6.4 : 3.6); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.weight(ctx, c); else this.small(ctx, c);
  }

  /** A lab stand: heavy base on the bench, upright rod, boss and the arm the balance hangs from. */
  stand(ctx, c) {
    const metal = mix(c.bgSurface, c.label, 0.42), base = mix(c.s8, c.label, 0.2);
    drawShadow(ctx, c, 96, FLOOR + 2, 70, 6);
    rr(ctx, 30, FLOOR - 20, 132, 22, 7); ctx.fillStyle = base; ctx.fill();
    ctx.fillStyle = darken(base, 0.2); ctx.fillRect(32, FLOOR - 8, 128, 8);
    ctx.fillStyle = alpha(lighten(base, 0.5), 0.6); ctx.fillRect(40, FLOOR - 17, 70, 3);
    rr(ctx, 30, FLOOR - 20, 132, 22, 7); ctx.strokeStyle = darken(base, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    const rod = (x0, y0, x1, y1, w) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = darken(metal, 0.4); ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = metal; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = alpha(lighten(metal, 0.6), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - (y1 !== y0 ? 2 : 0), y0 - (y1 === y0 ? 2 : 0)); ctx.lineTo(x1 - (y1 !== y0 ? 2 : 0), y1 - (y1 === y0 ? 2 : 0)); ctx.stroke();
    };
    rod(70, FLOOR - 20, 70, 30, 10);
    rod(70, 40, BX + 18, 40, 8);
    rr(ctx, 58, 28, 26, 24, 5); ctx.fillStyle = darken(metal, 0.15); ctx.fill(); ctx.strokeStyle = darken(metal, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = darken(metal, 0.35); ctx.beginPath(); ctx.moveTo(BX, 40); ctx.lineTo(BX, BY + 2); ctx.stroke();
  }

  /** A stone hung by a thread loop; top of the thread at (x, y). Returns its centre. */
  stone(ctx, c, x, y, k) {
    const cx = x, cy = y + 64, rock = mix(c.waste ?? c.label, c.gold, 0.3);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.strokeStyle = darken(c.labelMuted, 0.1); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx - 26, cy - 22); ctx.moveTo(x, y); ctx.lineTo(cx + 24, cy - 24); ctx.stroke();
    const path = () => {
      ctx.beginPath(); ctx.moveTo(cx - 46, cy - 4); ctx.bezierCurveTo(cx - 44, cy - 30, cx - 10, cy - 36, cx + 18, cy - 32);
      ctx.bezierCurveTo(cx + 44, cy - 28, cx + 52, cy - 6, cx + 44, cy + 16); ctx.bezierCurveTo(cx + 34, cy + 34, cx - 30, cy + 36, cx - 42, cy + 18); ctx.closePath();
    };
    path(); ctx.fillStyle = rock; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = darken(rock, 0.2); ctx.fillRect(cx - 60, cy + 8, 120, 40);
    ctx.fillStyle = alpha(lighten(rock, 0.45), 0.8); ctx.beginPath(); ctx.ellipse(cx - 16, cy - 18, 18, 6, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(darken(rock, 0.35), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 30); ctx.lineTo(cx + 2, cy - 6); ctx.lineTo(cx + 20, cy + 6); ctx.stroke();
    ctx.restore();
    path(); ctx.strokeStyle = darken(rock, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    return { x: cx, y: cy };
  }

  weight(ctx, c) {
    const a = this.age;
    drawSurface(ctx, c, 'tiles', 0, 680, FLOOR, { h: 30 });
    this.stand(ctx, c);
    // Readings: stone on at 0.3 (bob, settle), off at 2.9, hand from 3.4 (ease up to R_HAND, steady).
    let rd = 0, stoneK = 0, handK = 0;
    if (a < 2.9) { rd = Math.max(0, settle(a, 0.3, 0, R_STONE)); stoneK = clamp01((a - 0.1) / 0.2); }
    else if (a < 3.4) { const u = ease(a, 2.9, 0.4); rd = R_STONE * (1 - u); stoneK = 1 - u; }
    else { const u = ease(a, 3.6, 1.1); rd = R_HAND * u; handK = 1; }
    const sb = drawSpringBalance(ctx, c, { x: BX, y: BY, angle: Math.PI / 2, reading: rd, max: MAX, every: 5, minor: 1, len: LEN, rod: 12 });
    if (stoneK > 0) {
      const lift = a >= 2.9 ? 40 * ease(a, 2.9, 0.4) : 0;
      const s = this.stone(ctx, c, sb.hook.x + 9, sb.hook.y - 2 - lift, stoneK);
      const kf = a < 2.9 ? ease(a, 1.7, 0.4) : stoneK;
      if (kf > 0) drawForce(ctx, c, s.x, s.y, { length: 84, angle: Math.PI / 2, label: 'pull of the Earth', alpha: kf });
    }
    if (handK > 0) {
      const reach = ease(a, 3.4, 0.25), hook = { x: sb.hook.x + 9, y: sb.hook.y + 4 };
      const hand = { x: hook.x + 60 * (1 - reach), y: hook.y + 30 * (1 - reach) };
      drawFigure(ctx, c, { x: 322, y: FLOOR + 4, height: 236, build: 'teen', facing: -1, pose: { name: 'stand', lean: 3 * reach }, hands: [hand, null], autoReach: false },
        figureLook(c, { skin: 2, hairStyle: 'ponytail', hair: 1, top: 3, bottom: 5 }));
      const kf = ease(a, 3.9, 0.4);
      if (kf > 0) drawForce(ctx, c, hook.x, hook.y + 8, { length: 76, angle: Math.PI / 2, label: 'your pull', side: -1, alpha: kf });
    }
  }

  /** A pointing hand from the right edge, fingertip at (x, y): sleeve, fist, thumb, index finger with a nail. */
  finger(ctx, c, x, y) {
    const skin = figureLook(c, { skin: 2 }).skin, sleeve = c.s4, rim = darken(skin, 0.38);
    const body = (path, col, r) => { path(); ctx.fillStyle = col; ctx.fill(); ctx.save(); path(); ctx.clip(); ctx.fillStyle = darken(col, 0.14); ctx.fillRect(x - 20, y + r, 800, 200); ctx.restore(); path(); ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.5; ctx.stroke(); };
    ctx.save();
    body(() => rr(ctx, x + 176, y - 30, 600, 92, 18), sleeve, 24);
    ctx.fillStyle = alpha(lighten(sleeve, 0.5), 0.6); ctx.fillRect(x + 190, y - 24, 400, 5);
    body(() => rr(ctx, x + 70, y - 18, 118, 74, 26), skin, 26);                               // fist
    ctx.strokeStyle = alpha(rim, 0.6); ctx.lineWidth = 2;
    for (const dy of [12, 30]) { ctx.beginPath(); ctx.moveTo(x + 84, y + dy); ctx.quadraticCurveTo(x + 100, y + dy + 6, x + 120, y + dy); ctx.stroke(); }
    body(() => rr(ctx, x, y - 14, 120, 28, 14), skin, 4);                                      // index finger
    ctx.beginPath(); ctx.ellipse(x + 14, y - 3, 9, 7, 0, 0, Math.PI * 2); ctx.fillStyle = lighten(skin, 0.35); ctx.fill();   // nail
    ctx.strokeStyle = alpha(rim, 0.7); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = alpha(rim, 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 50, y - 10); ctx.lineTo(x + 50, y + 6); ctx.stroke();
    body(() => { ctx.beginPath(); ctx.ellipse(x + 112, y + 46, 34, 14, -0.3, 0, Math.PI * 2); }, skin, 6);   // thumb
    ctx.fillStyle = alpha(lighten(skin, 0.5), 0.6); ctx.fillRect(x + 20, y - 10, 80, 3);
    ctx.restore();
  }

  small(ctx, c) {
    const a = this.age, rail = mix(c.gold, c.label, 0.25), lit = (i) => ease(a, 0.2 + i * 0.3, 0.3);
    const hero = RUNGS[RUNGS.length - 1], heroK = lit(RUNGS.length - 1), dim = 1 - 0.6 * ease(a, 1.7, 0.4);
    const brk = ease(a, 2.3, 0.4), last = ease(a, 2.7, 0.4);
    // rails: solid down to the break, then a zigzag gap, then the last stretch
    ctx.save(); ctx.lineCap = 'round';
    const rails = (y0, y1, k) => {
      for (const x of [LX0, LX1]) {
        ctx.globalAlpha = k; ctx.strokeStyle = darken(rail, 0.4); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
        ctx.strokeStyle = rail; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
        ctx.strokeStyle = alpha(lighten(rail, 0.5), 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 1.5, y0); ctx.lineTo(x - 1.5, y1); ctx.stroke();
      }
    };
    rails(24, 330, 1);
    if (brk > 0) {
      rails(384, BOTTOM + 22, brk);
      ctx.globalAlpha = brk; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3;
      for (const yy of [336, 378]) { ctx.beginPath(); ctx.moveTo(LX0 - 18, yy + 6); ctx.lineTo(LX0 + 2, yy - 6); ctx.lineTo(LX1 - 2, yy + 6); ctx.lineTo(LX1 + 18, yy - 6); ctx.stroke(); }
      ctx.globalAlpha = brk; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.labelMuted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('21 more steps', LX1 + 26, 357);
    }
    ctx.restore();
    const rung = (y, k, big) => {
      ctx.save(); ctx.globalAlpha = k; ctx.lineCap = 'round';
      ctx.strokeStyle = darken(rail, 0.4); ctx.lineWidth = big ? 10 : 8; ctx.beginPath(); ctx.moveTo(LX0, y); ctx.lineTo(LX1, y); ctx.stroke();
      ctx.strokeStyle = big ? c.s3 : rail; ctx.lineWidth = big ? 7 : 5; ctx.beginPath(); ctx.moveTo(LX0, y); ctx.lineTo(LX1, y); ctx.stroke();
      ctx.restore();
    };
    const word = (t, x, y, k, size, col) => {
      ctx.save(); ctx.globalAlpha = k; ctx.font = font(c, 800, size, true); ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(t, x, y); const w = ctx.measureText(t).width; ctx.restore(); return w;
    };
    RUNGS.forEach((r, i) => {
      const k = lit(i); if (k <= 0) return;
      rung(r.y, r.hero ? k : k * dim, r.hero);
      if (!r.hero) word(r.text, LX1 + 26, r.y, k * dim, 28, c.label);
    });
    if (heroK > 0) {
      const w = word(hero.text, LX1 + 26, hero.y, heroK, 40, darken(c.s3, 0.15));
      word('light touch', LX1 + 30, hero.y + 36, heroK, 26, c.labelMuted);
      const tip = { x: LX1 + 26 + w + 18, y: hero.y };
      const reach = ease(a, 1.6, 0.6);
      ctx.save(); ctx.globalAlpha *= heroK; this.finger(ctx, c, tip.x + 120 * (1 - reach), tip.y); ctx.restore();
      const pulse = clamp01((a - 2.2) / 0.6);
      if (pulse > 0 && pulse < 1) {
        ctx.save(); ctx.globalAlpha = 1 - pulse; ctx.strokeStyle = c.s3; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 10 + 26 * pulse, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    if (last > 0) {
      rung(BOTTOM, last, false);
      word('1 yoctonewton', LX1 + 26, BOTTOM, last, 30, c.label);
      drawTag(ctx, c, 'smallest measured', LX1 + 26, BOTTOM - 42, { align: 'left', size: 26, col: c.s4, alpha: last });
    }
  }
}
