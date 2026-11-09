// SensorsScene.js - slide "Sensors in Cars and Skies" (blk-l07-s07, 2 beats). New 2026-11-03.
// b0 a car backs slowly toward a brick wall. Its rear parking sensor sends ultrasound bursts to the
//    wall; each echo comes back to where the sensor HAS MOVED to (hit and arrival solved from the
//    car's motion). When the gap reaches 1.2 m the car stops, the sensor ring and a warning light
//    up, a bracket shows 1.2 m and the out-and-back time tag reads 0.007 s (2.4 m / 345 m/s).
//    Sound on screen is slow motion; the car keeps pinging while parked.
// b1 dusk over hills and trees: a small drone high and faint; its low hum (wide kit sound arcs)
//    travels to a microphone on a pole, which lights when the hum reaches it. One tag.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, mulberry32, ellipse, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack } from 'simulations/base/kit/SimWave.js';
import { drawMicrophone } from 'simulations/base/kit/SimApparatus.js';
import { drawCar, drawDrone } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const GROUND = 430;
const WALL = 96;                         // the wall's face
const PXM = 95;                          // px per metre
const CAR_LEN = 300, K = CAR_LEN / 200;
const GAP0 = 2.8, GAP1 = 1.2;            // metres
const T0 = 0.4, T1 = 3.0;                // backing starts, stops (eased at the end); parked, tagged and warning by 3.8 s
const VS = 240;                          // screen sound speed px/s (slow motion; a parked round trip is about one PING)
const PING = 0.9;
const gapAt = (t) => {
  const u = clamp01((t - T0) / (T1 - T0));
  // constant speed, eased only at the very end
  const e = u < 0.8 ? u * 0.9 / 0.8 : 0.9 + 0.1 * inOutSine((u - 0.8) / 0.2);
  return GAP0 + (GAP1 - GAP0) * e;
};
const sensorX = (t) => WALL + gapAt(t) * PXM;

const HILLS = (() => {
  const r = mulberry32(3313), trees = [];
  for (let x = -20; x < 720; x += 30 + r() * 26) trees.push({ x, r: 18 + r() * 16, h: 26 + r() * 30 });
  return { trees };
})();
const HOUSES = [{ x: 210, w: 120, h: 70 }, { x: 350, w: 90, h: 92 }, { x: 470, w: 140, h: 64 }, { x: 600, w: 100, h: 84 }];

export class SensorsScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static CONTINUOUS = true;          // b0 the parked car keeps pinging; b1 the hum never stops
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A car backs slowly toward a brick wall. Bursts of ultrasound leave the parking sensor on its rear '
    + 'bumper, reach the wall and come back. When the car is 1.2 metres from the wall it stops and a warning lights; the '
    + 'sound went 2.4 metres out and back in about 0.007 seconds. Then, at dusk, a small drone hums high over the trees '
    + 'and its low hum reaches a microphone on a pole, which lights up: audio surveillance.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = Math.max(0, Math.min(1, stage | 0)); }
  busy() { return true; }
  /** Scene time (one method, so a probe can pin a frame). */
  t() { return this.age; }

  draw(ctx, c) {
    if (this.cur === 0) this.parking(ctx, c, this.t());
    else this.dusk(ctx, c, this.t());
  }

  // ---- b0 ------------------------------------------------------------------------------------
  parking(ctx, c, t) {
    this.street(ctx, c);
    const sx = sensorX(t), cx = sx + 100 * K, parked = t >= T1;
    const sy = GROUND - 30 * K;              // sensor height, close to drawCar's rear bumper
    const warn = clamp01((t - T1 + 0.05) / 0.2);
    const car = drawCar(ctx, c, { x: cx, y: GROUND, len: CAR_LEN, dir: 1, tone: 3, lit: warn > 0.5, spin: -(GAP0 - gapAt(t)) * PXM / (TAU * 26 * K) });
    const S = car.sensor ?? { x: sx, y: sy };
    // bursts: out from where the sensor was, back to where it is when the echo arrives
    const Wp = { x: WALL + 2, y: S.y };
    for (let n = Math.max(0, Math.floor((t - 0.3) / PING) - 2); n <= Math.floor((t - 0.3) / PING); n++) {
      const te = 0.3 + n * PING;
      if (te > t) continue;
      const E = { x: sensorX(te) + (S.x - sx), y: S.y };
      const th = te + (E.x - Wp.x) / VS;
      let ta = th;
      for (let i = 0; i < 40; i++) ta = th + (sensorX(ta) + (S.x - sx) - Wp.x) / VS;
      const A = { x: sensorX(ta) + (S.x - sx), y: S.y };
      if (t < th) drawOutAndBack(ctx, c, { a: E, b: Wp, v: VS, t, start: te, path: false, R: 34 });
      else if (t < ta) drawOutAndBack(ctx, c, { a: A, b: Wp, v: VS, t, start: th - (A.x - Wp.x) / VS, path: false, R: 34 });
    }
    // tags: 40 kHz while backing; at the stop the bracket, the time and the warning
    const k40 = clamp01((t - 0.6) / 0.3) * (1 - warn);
    if (k40 > 0) pill(ctx, c, '40 kHz', (WALL + S.x) / 2 + 20, S.y - 86, { ...LBL, bg: c.raised, ink: c.label, alpha: k40 });
    if (parked) {
      const k = clamp01((t - T1) / 0.3);
      // bracket on the paving under the gap
      const by = GROUND + 44;
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(WALL, by - 10); ctx.lineTo(WALL, by + 10); ctx.moveTo(WALL, by); ctx.lineTo(S.x, by); ctx.moveTo(S.x, by - 10); ctx.lineTo(S.x, by + 10); ctx.stroke();
      ctx.restore();
      pill(ctx, c, '1.2 m', (WALL + S.x) / 2 + 66, by + 2, { ...LBL, align: 'left', bg: c.raised, ink: c.label, alpha: k });
      pill(ctx, c, '2.4 m in 0.007 s', (WALL + S.x) / 2 + 110, S.y - 190, { ...LBL, bg: c.s1, ink: c.bgSurface, alpha: clamp01((t - T1 - 0.5) / 0.3) });
      // the warning: a blinking lamp on the dashboard (inside the windscreen) and a chip
      const blink = 0.55 + 0.45 * Math.sin(t * 9);
      const dx = cx + 34 * K, dy = GROUND - 58 * K;
      const g = ctx.createRadialGradient(dx, dy, 1, dx, dy, 22);
      g.addColorStop(0, alpha(lighten(c.warning, 0.3), 0.95 * warn * blink)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(dx, dy, 22, 0, TAU); ctx.fill();
      pill(ctx, c, 'warning', cx + 90, GROUND - 160, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.8), alpha: k });
    }
  }

  street(ctx, c) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, c.setSkyTop ?? lighten(c.water, 0.4)); g.addColorStop(1, c.setSkyLow ?? lighten(c.water, 0.8));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, GROUND);
    // houses across the road, soft and pale (distance)
    for (const h of HOUSES) {
      const base = 330, wall = alpha(mix(c.setSand ?? c.warning, c.water, 0.45), 0.55), roof = alpha(mix(c.s6, c.water, 0.5), 0.5);
      ctx.fillStyle = wall; ctx.fillRect(h.x - h.w / 2, base - h.h, h.w, h.h);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(h.x - h.w / 2 - 8, base - h.h); ctx.lineTo(h.x, base - h.h - 34); ctx.lineTo(h.x + h.w / 2 + 8, base - h.h); ctx.fill();
      ctx.fillStyle = alpha(lighten(c.water, 0.5), 0.6);
      for (let i = 0; i < 2; i++) ctx.fillRect(h.x - h.w / 3 + i * h.w * 0.4, base - h.h * 0.7, h.w * 0.18, h.h * 0.26);
    }
    // hedge band
    const hedge = mix(c.setGround, c.good, 0.4);
    ctx.fillStyle = darken(hedge, 0.1); ctx.fillRect(0, 316, 680, 40);
    for (let x = 0; x < 700; x += 26) { ctx.fillStyle = lighten(hedge, 0.08); ctx.beginPath(); ctx.arc(x, 318, 16, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = alpha(darken(hedge, 0.4), 0.5); ctx.fillRect(0, 346, 680, 10);
    // the paving: light top band, darker front, joints in perspective
    const pave = mix(c.labelMuted, c.setSand ?? c.warning, 0.3);
    ctx.fillStyle = lighten(pave, 0.45); ctx.fillRect(0, 356, 680, GROUND - 356);
    ctx.fillStyle = lighten(pave, 0.25); ctx.fillRect(0, GROUND, 680, 520 - GROUND);
    ctx.strokeStyle = alpha(darken(pave, 0.1), 0.35); ctx.lineWidth = 1.5;
    for (let x = -200; x < 900; x += 70) { ctx.beginPath(); ctx.moveTo(340 + (x - 340) * 0.55, 356); ctx.lineTo(x, 520); ctx.stroke(); }
    for (const y of [380, 410, 456, 490]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(680, y); ctx.stroke(); }
    // the brick wall (end-on: lit face to the right, top coping)
    const brick = mix(c.s6, c.setSand ?? c.warning, 0.35), x0 = 30, top = 150;
    ctx.fillStyle = darken(brick, 0.35); ctx.fillRect(x0, top, WALL - x0 - 12, GROUND + 6 - top);
    ctx.fillStyle = brick; ctx.fillRect(WALL - 12, top, 12, GROUND + 6 - top);
    const face = ctx.createLinearGradient(x0, 0, WALL, 0);
    face.addColorStop(0, darken(brick, 0.25)); face.addColorStop(1, lighten(brick, 0.05));
    ctx.fillStyle = face; ctx.fillRect(x0, top, WALL - x0, GROUND + 6 - top);
    ctx.strokeStyle = alpha(lighten(brick, 0.55), 0.7); ctx.lineWidth = 2;
    for (let y = top + 18, row = 0; y < GROUND + 6; y += 18, row++) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(WALL, y); ctx.stroke();
      for (let x = x0 + (row % 2 ? 16 : 0); x < WALL; x += 32) { ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x, y); ctx.stroke(); }
    }
    ctx.fillStyle = lighten(mix(c.labelMuted, c.setSand ?? c.warning, 0.4), 0.3); ctx.fillRect(x0 - 6, top - 12, WALL - x0 + 12, 14);
    ctx.fillStyle = alpha(darken(brick, 0.5), 0.5); ctx.fillRect(x0 - 6, top + 2, WALL - x0 + 12, 4);
    // the wall's shadow on the paving
    ctx.fillStyle = alpha(darken(pave, 0.5), 0.22); ellipse(ctx, WALL - 20, GROUND + 8, 64, 6, 0); ctx.fill();
  }

  // ---- b1 ------------------------------------------------------------------------------------
  dusk(ctx, c, t) {
    const top = darken(mix(c.s4, c.water, 0.5), 0.55), mid = mix(c.s4, c.flame ?? c.warning, 0.45), low = lighten(mix(c.flame ?? c.warning, c.warning, 0.5), 0.25);
    const g = ctx.createLinearGradient(0, 0, 0, 380);
    g.addColorStop(0, top); g.addColorStop(0.6, mid); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    // the set sun's glow at the horizon, right
    const sg = ctx.createRadialGradient(560, 380, 10, 560, 380, 220);
    sg.addColorStop(0, alpha(lighten(c.warning, 0.5), 0.7)); sg.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = sg; ctx.fillRect(0, 160, 680, 360);
    // two hill lines and a row of round trees, darkening toward the viewer
    const hillFar = darken(mix(c.s4, c.setGround, 0.5), 0.35), hillNear = darken(mix(c.setGround, c.s4, 0.3), 0.6);
    ctx.fillStyle = hillFar; ctx.beginPath(); ctx.moveTo(0, 520);
    for (let x = 0; x <= 680; x += 20) ctx.lineTo(x, 340 - 30 * Math.sin(x * 0.009 + 0.5) - 12 * Math.sin(x * 0.03));
    ctx.lineTo(680, 520); ctx.fill();
    const treeCol = darken(mix(c.setGround, c.s4, 0.25), 0.7);
    for (const tr of HILLS.trees) {
      const base = 414 - 10 * Math.sin(tr.x * 0.01);
      ctx.fillStyle = treeCol; ctx.fillRect(tr.x - 2, base - tr.h * 0.5, 4, tr.h * 0.5);
      ctx.beginPath(); ctx.arc(tr.x, base - tr.h * 0.5 - tr.r * 0.6, tr.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = alpha(lighten(c.warning, 0.3), 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tr.x, base - tr.h * 0.5 - tr.r * 0.6, tr.r - 2, -1.3, 0.3); ctx.stroke();
    }
    ctx.fillStyle = hillNear; ctx.beginPath(); ctx.moveTo(0, 520);
    for (let x = 0; x <= 680; x += 20) ctx.lineTo(x, 432 - 14 * Math.sin(x * 0.012 + 2));
    ctx.lineTo(680, 520); ctx.fill();
    // the drone, high and faint
    const D = { x: 520 + 14 * Math.sin(t * 0.5), y: 104 + 6 * Math.sin(t * 1.3) };
    ctx.save(); ctx.globalAlpha = 0.72;
    drawDrone(ctx, c, { x: D.x, y: D.y, s: 0.72, spin: t * 6 });
    ctx.restore();
    // the sensor: a microphone on a pole, pointing up at the sky
    const pole = { x: 150, top: 300, base: 456 };
    const steel = mix(c.labelMuted, c.water, 0.2);
    ctx.fillStyle = darken(steel, 0.35); ctx.fillRect(pole.x - 7, pole.top, 14, pole.base - pole.top);
    ctx.fillStyle = alpha(lighten(steel, 0.3), 0.7); ctx.fillRect(pole.x - 5, pole.top, 4, pole.base - pole.top);
    ctx.fillStyle = darken(steel, 0.5); ellipse(ctx, pole.x, pole.base, 30, 7, 0); ctx.fill();
    // a small box with a lamp on the pole
    const bx = pole.x + 7, by = 372;
    ctx.fillStyle = darken(steel, 0.2); ctx.fillRect(bx, by, 30, 38); ctx.fillStyle = alpha(lighten(steel, 0.3), 0.6); ctx.fillRect(bx, by, 30, 6);
    const mic = drawMicrophone(ctx, c, { x: pole.x + 34, y: pole.top - 52, r: 36, len: 110, facing: 1, tilt: 0.62, stand: true, standY: pole.top });
    // the hum: wide, faint arcs from the drone toward the sensor
    const G = mic.grille, dist = Math.hypot(G.x - D.x, G.y - D.y), dir = Math.atan2(G.y - D.y, G.x - D.x);
    const WL = 74, speed = 80, life = dist - G.r;
    const arrive = (life - 30) / speed + 0.3;
    for (let k = 0; k < 8; k++) {
      const r = 30 + ((t - 0.3) * speed - k * WL);
      if (r < 30 || r > life) continue;
      const s = clamp01((r - 30) / 40) * clamp01((life - r) / 40);
      drawSoundArcs(ctx, c, { x: D.x, y: D.y, dir, spread: 0.55, single: true, radius: r, strength: 0.75 * s });
    }
    const on = clamp01((t - arrive) / 0.3);
    if (on > 0) {
      const pulse = 0.75 + 0.25 * Math.sin(t * 2 * Math.PI * speed / WL);
      const gl = ctx.createRadialGradient(G.x, G.y, G.r * 0.6, G.x, G.y, G.r * 2.2);
      gl.addColorStop(0, alpha(lighten(c.good, 0.4), 0.55 * on * pulse)); gl.addColorStop(1, alpha(c.good, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(G.x, G.y, G.r * 2.2, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = on > 0 ? lighten(c.good, 0.2 + 0.2 * on) : darken(c.good, 0.5);
    ctx.beginPath(); ctx.arc(bx + 15, by + 22, 7, 0, TAU); ctx.fill();
    if (on > 0) { ctx.fillStyle = alpha(lighten(c.good, 0.5), 0.4 * on); ctx.beginPath(); ctx.arc(bx + 15, by + 22, 16, 0, TAU); ctx.fill(); }
    const kt = clamp01((t - 0.6) / 0.4);
    pill(ctx, c, 'audio surveillance', 330, 470, { ...LBL, bg: c.accent, ink: c.bgSurface, alpha: kt });
  }
}
