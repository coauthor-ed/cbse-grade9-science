import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, clamp01, inOutSine,
  mix, alpha, lighten, darken, rr, ellipse,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, walkPhase } from 'simulations/base/kit/SimFigure.js';

// EnergyConversionScene - blk-l02-n02, Energy Changes Form (2 beats).
// b0: a plug in a wall socket feeds two cords (electrical energy runs along
//     them as moving dots). One goes to a bulb: a wide light arrow and a thin
//     heat arrow come out ("light, and some heat"). The other goes to a water
//     heater on the wall: a wide thermal arrow comes out, and the tap below
//     pours steaming water into a bucket.
// b1: left, a plate of food and a chemical arrow from it to a student who
//     runs; right, a mallet strikes a hanging bell (a mechanical arrow on the
//     swing) and sound waves spread from the bell.
// Arrow tones: electrical series 7, light 2, heat and thermal 8, chemical 3,
// mechanical 1, sound 8 (as in the forms board and the energy bars).

const FLOOR_Y = 470;
const PLAY_S = 2.2;
// b0 geometry
const SOCK = { x: 86, y: 300 };
const BULB = { x: 330, y: 150 };
const HEATER = { x: 296, y: 222, w: 104, h: 144 };
// b1 geometry
const PLATE = { x: 96, y: 438 };
const RUN_X0 = 190, RUN_X1 = 246;
const DIVIDE_X = 360;
const BELL = { x: 540, y: 200 };      // the crown of the bell
const PIVOT = { x: 456, y: 128 };     // the mallet's pivot, under the cross bar

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class EnergyConversionScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Beat 1: a plug in a wall socket feeds a bulb and a water heater. Out of the bulb come a wide arrow labelled light and a thin arrow labelled heat; out of the water heater comes a wide arrow labelled thermal, and its tap pours steaming water. Beat 2: an arrow labelled chemical goes from a plate of food to a running student; a mallet swings into a hanging bell, labelled mechanical, and sound waves spread from the bell.';

  enter() {
    this.motionT = 0;
  }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  update(d) { this.motionT = Math.min(PLAY_S, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < PLAY_S; }

  draw(ctx, c) {
    const t = this.motionT ?? 0;
    drawBackdrop(ctx, c, this.stage >= 1 ? 'dots' : 'plain');
    if (this.stage >= 1) {
      drawFloor(ctx, c, FLOOR_Y, { col: mix(c.s3, c.bgSurface, 0.55) });
      this.food(ctx, c, t);
      this.divider(ctx, c);
      this.bell(ctx, c, t);
    } else {
      this.wall(ctx, c);
      drawFloor(ctx, c, FLOOR_Y, { col: mix(c.s8, c.bgSurface, 0.6) });
      this.electric(ctx, c, t);
    }
  }

  // b1 holds two separate examples: a clear gap and a soft rule between them,
  // so the runner never reads as the one who rings the bell.
  divider(ctx, c) {
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.4);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 10]);
    // from below the mechanical tag down to the floor
    ctx.beginPath(); ctx.moveTo(DIVIDE_X, 244); ctx.lineTo(DIVIDE_X, FLOOR_Y + 30); ctx.stroke();
    ctx.restore();
  }

  // A broad flow arrow from (x0, y0) to (x1, y1), drawn to fraction u.
  flow(ctx, c, x0, y0, x1, y1, w, col, u) {
    if (u <= 0.01) return;
    const len = Math.hypot(x1 - x0, y1 - y0) * u, head = Math.max(22, w * 1.1);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
    const L = Math.max(head + 2, len);
    ctx.beginPath();
    ctx.moveTo(0, -w / 2); ctx.lineTo(L - head, -w / 2); ctx.lineTo(L - head, -w / 2 - head * 0.45);
    ctx.lineTo(L, 0); ctx.lineTo(L - head, w / 2 + head * 0.45); ctx.lineTo(L - head, w / 2); ctx.lineTo(0, w / 2); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = alpha(darken(col, 0.3), 0.6); ctx.fillRect(0, w * 0.15, L - head, w * 0.35);
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.75); ctx.fillRect(2, -w / 2 + 2, L - head - 4, Math.max(2, w * 0.14));
    ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  // ---- b0 -------------------------------------------------------------------

  wall(ctx, c) {
    const plaster = mix(c.bgSurface, c.s2, 0.12);
    ctx.fillStyle = plaster; ctx.fillRect(0, 0, 440, FLOOR_Y);
    ctx.fillStyle = darken(plaster, 0.1); ctx.fillRect(434, 0, 6, FLOOR_Y);
    ctx.fillStyle = alpha(darken(plaster, 0.25), 0.5); ctx.fillRect(0, FLOOR_Y - 14, 440, 14);
  }

  cord(ctx, c, pts) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const trace = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    trace(); ctx.strokeStyle = darken(c.stroke, 0.35); ctx.lineWidth = 9; ctx.stroke();
    trace(); ctx.strokeStyle = mix(c.stroke, c.labelMuted, 0.4); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }

  dotsAlong(ctx, c, pts, t, n) {
    const segs = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); total += l; }
    for (let k = 0; k < n; k++) {
      let s = ((k / n) * total + t * 80) % total, i = 0;
      while (s > segs[i]) { s -= segs[i]; i++; }
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], f = s / segs[i];
      const px = ax + (bx - ax) * f, py = ay + (by - ay) * f;
      ctx.fillStyle = c.s7; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha(lighten(c.s7, 0.6), 0.9); ctx.beginPath(); ctx.arc(px - 2, py - 2, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  electric(ctx, c, t) {
    const uIn = clamp01(t / 0.8), uOut = inOutSine(clamp01((t - 0.7) / 0.8));
    const toBulb = [[SOCK.x + 44, SOCK.y - 4], [200, SOCK.y - 4], [200, BULB.y + 70], [BULB.x, BULB.y + 70], [BULB.x, BULB.y + 52]];
    const toHeat = [[SOCK.x + 44, SOCK.y + 10], [220, SOCK.y + 10], [220, HEATER.y + 40], [HEATER.x, HEATER.y + 40]];
    this.cord(ctx, c, toBulb);
    this.cord(ctx, c, toHeat);
    this.socket(ctx, c);
    // bulb holder on its bracket, then the bulb
    this.bulb(ctx, c, uOut);
    this.heater(ctx, c, t, uOut);
    if (uIn > 0) { this.dotsAlong(ctx, c, toBulb, t, 5); this.dotsAlong(ctx, c, toHeat, t, 4); }
    // outputs
    this.flow(ctx, c, BULB.x + 54, BULB.y - 18, 628, BULB.y - 58, 30, c.s2, uOut);
    this.flow(ctx, c, BULB.x + 50, BULB.y + 16, 560, BULB.y + 50, 10, c.s8, uOut);
    this.flow(ctx, c, HEATER.x + HEATER.w + 16, HEATER.y + 70, 640, HEATER.y + 70, 30, c.s8, uOut);
    pill(ctx, c, 'electrical', SOCK.x + 20, SOCK.y - 82, { bg: c.s7, size: 24 });
    pill(ctx, c, 'light', 560, BULB.y - 100, { bg: c.s2, size: 24, alpha: uOut });
    pill(ctx, c, 'heat', 600, BULB.y + 48, { bg: c.s8, size: 24, alpha: uOut });
    pill(ctx, c, 'thermal', 560, HEATER.y + 120, { bg: c.s8, size: 24, alpha: uOut });
  }

  socket(ctx, c) {
    const plate = mix(c.label, c.bgSurface, 0.84);
    const x = SOCK.x - 40, y = SOCK.y - 44;
    rr(ctx, x + 3, y + 5, 84, 92, 10); ctx.fillStyle = darken(plate, 0.25); ctx.fill();
    rr(ctx, x, y, 84, 92, 10); ctx.fillStyle = plate; ctx.fill();
    ctx.fillStyle = alpha(lighten(plate, 0.5), 0.8); ctx.fillRect(x + 4, y + 4, 76, 4);
    ctx.strokeStyle = darken(plate, 0.35); ctx.lineWidth = 2; rr(ctx, x, y, 84, 92, 10); ctx.stroke();
    // switch
    rr(ctx, x + 12, y + 12, 18, 26, 4); ctx.fillStyle = darken(plate, 0.15); ctx.fill();
    rr(ctx, x + 14, y + 14, 14, 11, 3); ctx.fillStyle = c.s6; ctx.fill();
    // the plug in it: a squared body with its cord exits
    const pb = mix(c.stroke, c.bgSurface, 0.2);
    rr(ctx, SOCK.x - 8, SOCK.y - 18, 52, 42, 8); ctx.fillStyle = pb; ctx.fill();
    ctx.fillStyle = darken(pb, 0.3); ctx.fillRect(SOCK.x + 26, SOCK.y - 14, 14, 34);
    ctx.fillStyle = alpha(lighten(pb, 0.45), 0.8); ctx.fillRect(SOCK.x - 4, SOCK.y - 14, 4, 34);
    ctx.strokeStyle = darken(pb, 0.4); ctx.lineWidth = 2; rr(ctx, SOCK.x - 8, SOCK.y - 18, 52, 42, 8); ctx.stroke();
  }

  bulb(ctx, c, on) {
    const bx = BULB.x, by = BULB.y;
    // holder
    const hold = mix(c.label, c.bgSurface, 0.75);
    rr(ctx, bx - 16, by + 34, 32, 30, 6); ctx.fillStyle = hold; ctx.fill();
    ctx.fillStyle = darken(hold, 0.2); ctx.fillRect(bx + 4, by + 36, 10, 26);
    ctx.strokeStyle = darken(hold, 0.4); ctx.lineWidth = 2; rr(ctx, bx - 16, by + 34, 32, 30, 6); ctx.stroke();
    // glow
    for (let k = 3; k >= 1; k--) {
      ctx.fillStyle = alpha(c.s2, 0.12 * on * (4 - k));
      ctx.beginPath(); ctx.arc(bx, by - 8, 46 + k * 16, 0, Math.PI * 2); ctx.fill();
    }
    // screw base
    const metal = mix(c.labelMuted, c.bgSurface, 0.3);
    rr(ctx, bx - 16, by + 14, 32, 22, 4); ctx.fillStyle = metal; ctx.fill();
    ctx.strokeStyle = darken(metal, 0.35); ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx - 16, by + 18 + i * 5); ctx.lineTo(bx + 16, by + 20 + i * 5); ctx.stroke(); }
    // glass
    ctx.beginPath();
    ctx.moveTo(bx - 14, by + 14);
    ctx.bezierCurveTo(bx - 16, by, bx - 42, by - 4, bx - 42, by - 24);
    ctx.arc(bx, by - 24, 42, Math.PI, 0);
    ctx.bezierCurveTo(bx + 42, by - 4, bx + 16, by, bx + 14, by + 14);
    ctx.closePath();
    ctx.fillStyle = mix(alpha(c.glass, 0.55), lighten(c.s2, 0.35), 0.75 * on); ctx.fill();
    ctx.strokeStyle = darken(c.glass, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.glass, 0.8), 0.8); ctx.beginPath(); ctx.ellipse(bx - 20, by - 36, 6, 14, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = mix(c.s8, c.s2, on); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx - 8, by + 12); ctx.lineTo(bx - 10, by - 22);
    for (let i = 0; i < 5; i++) ctx.lineTo(bx - 8 + i * 4, by - (i % 2 ? 18 : 28));
    ctx.lineTo(bx + 10, by - 22); ctx.lineTo(bx + 8, by + 12); ctx.stroke();
  }

  heater(ctx, c, t, on) {
    const { x, y, w, h } = HEATER;
    const tank = mix(c.label, c.bgSurface, 0.8);
    // rounded tank: shade side, light side, a band and a dial-free lamp
    rr(ctx, x + 4, y + 6, w, h, 26); ctx.fillStyle = alpha(darken(tank, 0.5), 0.35); ctx.fill();
    rr(ctx, x, y, w, h, 26); ctx.fillStyle = tank; ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, 26); ctx.clip();
    ctx.fillStyle = darken(tank, 0.18); ctx.fillRect(x + w * 0.66, y, w * 0.34, h);
    ctx.fillStyle = darken(tank, 0.08); ctx.fillRect(x + w * 0.5, y, w * 0.16, h);
    ctx.fillStyle = alpha(lighten(tank, 0.6), 0.8); ctx.fillRect(x + 10, y + 16, 8, h - 32);
    ctx.fillStyle = mix(c.s1, tank, 0.35); ctx.fillRect(x, y + h - 46, w, 12);
    ctx.restore();
    ctx.strokeStyle = darken(tank, 0.4); ctx.lineWidth = 2; rr(ctx, x, y, w, h, 26); ctx.stroke();
    ctx.fillStyle = on > 0.5 ? c.s6 : darken(c.s6, 0.5); ctx.beginPath(); ctx.arc(x + 30, y + 30, 7, 0, Math.PI * 2); ctx.fill();
    // pipe and tap below, hot water into a bucket
    const px = x + w / 2;
    const pipe = mix(c.labelMuted, c.bgSurface, 0.3);
    ctx.fillStyle = pipe; ctx.fillRect(px - 5, y + h, 10, 22); ctx.fillRect(px - 5, y + h + 16, 30, 10);
    ctx.fillStyle = darken(pipe, 0.3); ctx.fillRect(px + 2, y + h, 3, 22);
    rr(ctx, px + 12, y + h + 8, 16, 7, 3); ctx.fillStyle = c.s6; ctx.fill();
    const bucketTop = FLOOR_Y - 46;
    if (on > 0.05) {
      ctx.fillStyle = alpha(c.water, 0.8);
      ctx.fillRect(px + 18, y + h + 26, 6, (bucketTop - (y + h + 26)) * on);
    }
    const bk = mix(c.s1, c.bgSurface, 0.2);
    ctx.beginPath(); ctx.moveTo(px - 8, bucketTop); ctx.lineTo(px + 50, bucketTop); ctx.lineTo(px + 44, FLOOR_Y - 2); ctx.lineTo(px - 2, FLOOR_Y - 2); ctx.closePath();
    ctx.fillStyle = bk; ctx.fill();
    ctx.fillStyle = darken(bk, 0.25); ctx.fillRect(px + 28, bucketTop + 2, 16, 42);
    ctx.strokeStyle = darken(bk, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ellipse(ctx, px + 21, bucketTop, 29, 6); ctx.fillStyle = darken(bk, 0.35); ctx.fill();
    // steam from the bucket
    ctx.strokeStyle = alpha(c.labelMuted, 0.6 * on); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const sx = px + 8 + i * 22, ph = t * 2 + i;
      ctx.beginPath();
      for (let k = 0; k <= 10; k++) { const yy = bucketTop - 8 - k * 4, xx = sx + Math.sin(ph + k * 0.5) * 5; if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
      ctx.stroke();
    }
  }

  // ---- b1 -------------------------------------------------------------------

  food(ctx, c, t) {
    const uA = inOutSine(clamp01(t / 0.7));
    // a low table with the plate on it
    const tb = darken(mix(c.s8, c.s2, 0.4), 0.3);
    rr(ctx, PLATE.x - 72, PLATE.y - 6, 144, 14, 4); ctx.fillStyle = tb; ctx.fill();
    ctx.fillStyle = lighten(tb, 0.2); ctx.fillRect(PLATE.x - 70, PLATE.y - 5, 140, 3);
    ctx.fillStyle = darken(tb, 0.25); ctx.fillRect(PLATE.x - 62, PLATE.y + 8, 10, FLOOR_Y - PLATE.y - 8); ctx.fillRect(PLATE.x + 52, PLATE.y + 8, 10, FLOOR_Y - PLATE.y - 8);
    const plate = mix(c.label, c.bgSurface, 0.8);
    ellipse(ctx, PLATE.x, PLATE.y - 10, 62, 14); ctx.fillStyle = darken(plate, 0.25); ctx.fill();
    ellipse(ctx, PLATE.x, PLATE.y - 13, 60, 12); ctx.fillStyle = plate; ctx.fill();
    // rice heap and a roti
    const rice = lighten(c.s2, 0.8);
    ctx.beginPath(); ctx.ellipse(PLATE.x - 18, PLATE.y - 18, 26, 14, 0, Math.PI, 0); ctx.fillStyle = rice; ctx.fill();
    ctx.beginPath(); ctx.ellipse(PLATE.x - 10, PLATE.y - 18, 12, 9, 0, Math.PI, 0); ctx.fillStyle = darken(rice, 0.1); ctx.fill();
    const roti = mix(c.s2, c.s8, 0.35);
    ellipse(ctx, PLATE.x + 26, PLATE.y - 17, 24, 7); ctx.fillStyle = darken(roti, 0.2); ctx.fill();
    ellipse(ctx, PLATE.x + 26, PLATE.y - 19, 22, 6); ctx.fillStyle = roti; ctx.fill();
    // the runner
    const uR = inOutSine(clamp01((t - 0.5) / 1.6));
    const x = RUN_X0 + (RUN_X1 - RUN_X0) * uR;
    const phase = walkPhase(x - RUN_X0, 180, 'run') + 0.15;
    // the kit run pose folds the forearms over the belly: swing the hands at the
    // sides instead, near and far in opposition, the same sense as the kit walk
    // at rest the arms hold a clear mid-stride swing (never both at the belly)
    const sn = uR >= 1 ? 0.8 : Math.sin(2 * Math.PI * phase);
    const hy = FLOOR_Y - 96 - 10 * Math.abs(sn);
    const spec = figureFor(this, { role: 'student', pose: { name: 'run', phase }, x, y: FLOOR_Y, height: 180, facing: 1,
      hands: [{ x: x + 14 - 46 * sn, y: hy }, { x: x + 14 + 46 * sn, y: hy }] });
    ctx.strokeStyle = alpha(c.s1, 0.6); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) { const yy = FLOOR_Y - 160 + k * 34; ctx.beginPath(); ctx.moveTo(x - 58 - k * 6, yy); ctx.lineTo(x - 30 - k * 6, yy); ctx.stroke(); }
    drawFigure(ctx, c, spec, spec.look);
    // chemical arrow from the food into the runner's body (it ends on the hip,
    // over the leg muscles); drawn over the figure so its head lands on him
    this.flow(ctx, c, PLATE.x + 20, PLATE.y - 34, x - 6, FLOOR_Y - 92, 22, c.s3, uA);
    pill(ctx, c, 'chemical', PLATE.x - 4, PLATE.y - 82, { bg: c.s3, size: 24, alpha: uA });
  }

  bell(ctx, c, t) {
    // a wooden stand with a cross bar; the bell hangs from it
    const wood = darken(mix(c.s8, c.s2, 0.4), 0.3);
    const post = (x) => { ctx.fillStyle = wood; ctx.fillRect(x - 8, 120, 16, FLOOR_Y - 120); ctx.fillStyle = lighten(wood, 0.2); ctx.fillRect(x - 8, 120, 4, FLOOR_Y - 120); ctx.fillStyle = darken(wood, 0.25); ctx.fillRect(x + 3, 120, 5, FLOOR_Y - 120); };
    drawShadow(ctx, c, BELL.x, FLOOR_Y, 110, 8, 0.7);
    post(BELL.x - 100); post(BELL.x + 100);
    rr(ctx, BELL.x - 112, 108, 224, 20, 5); ctx.fillStyle = wood; ctx.fill();
    ctx.fillStyle = lighten(wood, 0.2); ctx.fillRect(BELL.x - 110, 110, 220, 4);
    ctx.fillStyle = darken(wood, 0.25); ctx.fillRect(BELL.x - 110, 122, 220, 5);
    ctx.strokeStyle = darken(c.labelMuted, 0.2); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(BELL.x, 128); ctx.lineTo(BELL.x, BELL.y); ctx.stroke();
    // strike at 0.5 s: the bell shivers a little after it
    const hit = t >= 0.5;
    const shiver = hit ? Math.sin((t - 0.5) * 60) * 2 * Math.max(0, 1 - (t - 0.5) / 1.2) : 0;
    const bx = BELL.x + shiver, top = BELL.y, bot = BELL.y + 130;
    const brass = mix(c.s2, c.s8, 0.3);
    ctx.beginPath();
    ctx.moveTo(bx - 20, top);
    ctx.bezierCurveTo(bx - 50, top + 10, bx - 46, top + 80, bx - 70, bot);
    ctx.lineTo(bx + 70, bot);
    ctx.bezierCurveTo(bx + 46, top + 80, bx + 50, top + 10, bx + 20, top);
    ctx.closePath();
    ctx.fillStyle = brass; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(brass, 0.22); ctx.fillRect(bx + 22, top, 60, bot - top);
    ctx.fillStyle = alpha(lighten(brass, 0.55), 0.85); ctx.fillRect(bx - 34, top + 16, 9, bot - top - 26);
    ctx.fillStyle = darken(brass, 0.12); ctx.fillRect(bx - 80, bot - 26, 160, 8);
    ctx.restore();
    ctx.strokeStyle = darken(brass, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ellipse(ctx, bx, bot, 70, 10); ctx.fillStyle = darken(brass, 0.4); ctx.fill();
    ctx.fillStyle = darken(brass, 0.5); ctx.beginPath(); ctx.arc(bx, bot + 6, 10, 0, Math.PI * 2); ctx.fill();
    // the mallet: swings from its pivot into the bell's side
    const aRest = -0.45, aHit = 0.24;
    const a = t < 0.5 ? aRest + (aHit - aRest) * inOutSine(t / 0.5) : aHit - 0.14 * clamp01((t - 0.5) / 0.4);
    const L = 112;
    const hx = PIVOT.x + Math.sin(a) * L, hy = PIVOT.y + Math.cos(a) * L;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(wood, 0.1); ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(PIVOT.x, PIVOT.y); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = lighten(wood, 0.25); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(PIVOT.x - 2, PIVOT.y); ctx.lineTo(hx - 2, hy); ctx.stroke();
    ctx.translate(hx, hy); ctx.rotate(-a);
    rr(ctx, -20, -15, 40, 30, 7); ctx.fillStyle = mix(c.labelMuted, c.bgSurface, 0.2); ctx.fill();
    ctx.fillStyle = darken(mix(c.labelMuted, c.bgSurface, 0.2), 0.25); ctx.fillRect(-20, 4, 40, 10);
    ctx.strokeStyle = darken(c.labelMuted, 0.4); ctx.lineWidth = 2; rr(ctx, -20, -15, 40, 30, 7); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = darken(wood, 0.3); ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 7, 0, Math.PI * 2); ctx.fill();
    // mechanical arrow along the swing
    const mu = clamp01(t / 0.5);
    ctx.save();
    ctx.strokeStyle = c.s1; ctx.fillStyle = c.s1; ctx.lineWidth = 7; ctx.lineCap = 'round';
    const r = L + 30, a0 = -0.55, a1 = a0 + (0.18 - a0) * Math.max(0.15, mu);
    ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, r, Math.PI / 2 - a0, Math.PI / 2 - a1, true); ctx.stroke();
    const ex = PIVOT.x + Math.sin(a1) * r, ey = PIVOT.y + Math.cos(a1) * r;
    const ta = Math.atan2(-Math.sin(a1), Math.cos(a1));
    ctx.beginPath(); ctx.moveTo(ex + Math.cos(ta) * 12, ey + Math.sin(ta) * 12);
    ctx.lineTo(ex + Math.cos(ta + 2.5) * 14, ey + Math.sin(ta + 2.5) * 14);
    ctx.lineTo(ex + Math.cos(ta - 2.5) * 14, ey + Math.sin(ta - 2.5) * 14); ctx.closePath(); ctx.fill();
    ctx.restore();
    pill(ctx, c, 'mechanical', 360, 196, { bg: c.s1, size: 24 });
    // sound waves both sides, after the strike
    if (hit) {
      const u = clamp01((t - 0.5) / 1.4);
      ctx.save(); ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const rr2 = 76 + k * 20 + u * 10;
        const aa = 0.95 * (1 - k * 0.25) * (0.4 + 0.6 * u);
        ctx.strokeStyle = alpha(c.s8, aa); ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(BELL.x, BELL.y + 76, rr2, -0.55, 0.45); ctx.stroke();
      }
      ctx.restore();
      pill(ctx, c, 'sound', 600, 72, { bg: c.s8, size: 24, alpha: u });
    }
  }
}
