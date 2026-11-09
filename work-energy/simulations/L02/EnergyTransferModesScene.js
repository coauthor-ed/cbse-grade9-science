import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, clamp01, inOutSine,
  mix, alpha, lighten, darken, rr, ellipse, mulberry32,
} from 'simulations/base/kit/SimLook.js';

// EnergyTransferModesScene - blk-l02-s07, Other Ways Energy Moves (2 beats).
// b0 (heat): a cup of hot tea with a steel spoon standing in it. A warm tint
//     creeps up the spoon from the tea, step by step, and a broad heat arrow
//     runs the same way, from the hot tea to the colder spoon handle.
// b1 (without touching): three pictures. Top: the Sun and the Earth across
//     dark empty space, waves of light travelling between them (radiation).
//     Bottom left: a cell, wires and a bulb that lights (a circuit).
//     Bottom right: a speaker with sound waves spreading out.
// Each beat plays once (about 2.4 s), then rests; a tap plays it again.

const PLAY_S = 2.4;
const TABLE_Y = 468;
// the cup (side view)
const CUP_X = 262, RIM_Y = 236, RIM_RX = 136, RIM_RY = 26;
const BASE_Y = 436, BASE_RX = 96;
const TEA_Y = RIM_Y + 20, TEA_RX = 122, TEA_RY = 20;
// the spoon: from where it leaves the tea to the handle end
const SP_A = { x: 366, y: TEA_Y + 2 }, SP_B = { x: 548, y: 50 };
const CREEP_STEPS = 3, STEP_S = 0.6;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class EnergyTransferModesScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Beat 1: a cup of hot tea with a steel spoon in it; a warm colour creeps up the spoon from the tea, and an arrow labelled heat points from the hot tea to the spoon handle. Beat 2: three pictures. The Sun sends waves across dark space to the Earth (radiation); a cell lights a bulb through wires (circuit); a speaker sends out sound waves.';

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
    if (this.stage >= 1) {
      drawBackdrop(ctx, c, 'plain');
      this.space(ctx, c, t);
      this.circuit(ctx, c, t);
      this.speaker(ctx, c, t);
    } else {
      drawBackdrop(ctx, c, 'dots');
      drawFloor(ctx, c, TABLE_Y, { col: mix(c.s8, c.bgSurface, 0.55) });
      this.cup(ctx, c, t);
    }
  }

  // ---- b0: tea and spoon ---------------------------------------------------

  cup(ctx, c, t) {
    const china = mix(c.s1, c.bgSurface, 0.35);
    const tea = darken(mix(c.s8, c.s6, 0.35), 0.42);
    // saucer
    drawShadow(ctx, c, CUP_X, TABLE_Y - 2, 190, 14, 0.9);
    ellipse(ctx, CUP_X, TABLE_Y - 14, 176, 24); ctx.fillStyle = darken(china, 0.2); ctx.fill();
    ellipse(ctx, CUP_X, TABLE_Y - 18, 172, 22); ctx.fillStyle = china; ctx.fill();
    ellipse(ctx, CUP_X, TABLE_Y - 20, 110, 13); ctx.fillStyle = darken(china, 0.1); ctx.fill();
    // handle on the left
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(china, 0.22); ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(CUP_X - 128, RIM_Y + 50); ctx.bezierCurveTo(CUP_X - 210, RIM_Y + 40, CUP_X - 200, RIM_Y + 160, CUP_X - 110, RIM_Y + 150); ctx.stroke();
    ctx.strokeStyle = china; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(CUP_X - 128, RIM_Y + 50); ctx.bezierCurveTo(CUP_X - 206, RIM_Y + 40, CUP_X - 196, RIM_Y + 158, CUP_X - 110, RIM_Y + 150); ctx.stroke();
    ctx.restore();
    // body: a tapering bowl, light side left, shade side right
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(CUP_X - RIM_RX, RIM_Y);
      ctx.bezierCurveTo(CUP_X - RIM_RX + 2, RIM_Y + 120, CUP_X - BASE_RX - 20, BASE_Y - 20, CUP_X - BASE_RX, BASE_Y);
      ctx.ellipse(CUP_X, BASE_Y, BASE_RX, 14, 0, Math.PI, 0, true);
      ctx.bezierCurveTo(CUP_X + BASE_RX + 20, BASE_Y - 20, CUP_X + RIM_RX - 2, RIM_Y + 120, CUP_X + RIM_RX, RIM_Y);
      ctx.ellipse(CUP_X, RIM_Y, RIM_RX, RIM_RY, 0, 0, Math.PI, false);
      ctx.closePath();
    };
    body(); ctx.fillStyle = china; ctx.fill();
    ctx.save();
    body(); ctx.clip();
    ctx.fillStyle = darken(china, 0.2);
    ctx.fillRect(CUP_X + 50, RIM_Y, 120, BASE_Y - RIM_Y + 20);
    ctx.fillStyle = darken(china, 0.1);
    ctx.fillRect(CUP_X + 20, RIM_Y, 30, BASE_Y - RIM_Y + 20);
    ctx.fillStyle = alpha(lighten(china, 0.6), 0.7);
    ctx.fillRect(CUP_X - 104, RIM_Y + 34, 16, 140);
    // a painted band round the cup
    ctx.fillStyle = mix(c.s5, china, 0.25);
    ctx.fillRect(CUP_X - 200, RIM_Y + 88, 400, 12);
    ctx.fillStyle = alpha(darken(c.s5, 0.3), 0.7);
    ctx.fillRect(CUP_X + 50, RIM_Y + 88, 120, 12);
    ctx.restore();
    body(); ctx.strokeStyle = darken(china, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    // rim and inside wall, then the tea surface
    ellipse(ctx, CUP_X, RIM_Y, RIM_RX, RIM_RY); ctx.fillStyle = darken(china, 0.28); ctx.fill();
    ellipse(ctx, CUP_X, RIM_Y, RIM_RX, RIM_RY); ctx.strokeStyle = lighten(china, 0.4); ctx.lineWidth = 4; ctx.stroke();
    ellipse(ctx, CUP_X, TEA_Y, TEA_RX, TEA_RY); ctx.fillStyle = tea; ctx.fill();
    ellipse(ctx, CUP_X - 30, TEA_Y - 4, 60, 7); ctx.fillStyle = alpha(lighten(tea, 0.45), 0.55); ctx.fill();
    // steam
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x0 = CUP_X - 50 + i * 46, ph = t * 2.2 + i * 1.7;
      ctx.strokeStyle = alpha(c.labelMuted, 0.55);
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const y = TEA_Y - 22 - k * 5;
        const x = x0 + Math.sin(ph + k * 0.35) * 9;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    this.spoon(ctx, c, t, tea);
    this.heatArrow(ctx, c, t);
    pill(ctx, c, 'hot tea', CUP_X - 150, 150, { bg: c.s8, size: 24 });
    pill(ctx, c, 'spoon', 606, 96, { bg: c.s1, size: 24 });
  }

  // The steel spoon; the warm tint reaches f (0..1) of the way up from the tea.
  spoon(ctx, c, t, tea) {
    const steel = mix(c.labelMuted, c.bgSurface, 0.25);
    const warm = mix(c.s8, c.s6, 0.25);
    const steps = Math.min(CREEP_STEPS, Math.floor(t / STEP_S));
    const part = clamp01((t - steps * STEP_S) / STEP_S);
    const f = Math.min(1, (steps + (steps < CREEP_STEPS ? inOutSine(part) : 0)) / CREEP_STEPS) * 0.72;
    const dx = SP_B.x - SP_A.x, dy = SP_B.y - SP_A.y, len = Math.hypot(dx, dy);
    ctx.save();
    ctx.translate(SP_A.x, SP_A.y);
    ctx.rotate(Math.atan2(dy, dx));
    // handle: thin near the tea, flared at the end
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(len - 80, -9);
      ctx.quadraticCurveTo(len - 14, -26, len, -8);
      ctx.quadraticCurveTo(len + 8, 0, len, 8);
      ctx.quadraticCurveTo(len - 14, 26, len - 80, 9);
      ctx.lineTo(-6, 8);
      ctx.closePath();
    };
    shape(); ctx.fillStyle = steel; ctx.fill();
    ctx.save();
    shape(); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, warm);
    g.addColorStop(Math.max(0.001, f * 0.85), alpha(warm, 0.92));
    g.addColorStop(Math.min(1, f + 0.08), alpha(warm, 0));
    g.addColorStop(1, alpha(warm, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-10, -20, len + 20, 40);
    ctx.fillStyle = alpha(darken(steel, 0.4), 0.3);            // shade side
    ctx.fillRect(-10, 3, len + 20, 24);
    ctx.fillStyle = alpha(lighten(steel, 0.7), 0.8);           // light streak
    ctx.fillRect(4, -5, len - 40, 3);
    ctx.restore();
    shape(); ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // a ripple ring where it enters the tea
    ellipse(ctx, SP_A.x - 2, SP_A.y + 2, 16, 4); ctx.strokeStyle = alpha(lighten(tea, 0.4), 0.8); ctx.lineWidth = 2; ctx.stroke();
  }

  // Broad heat arrow alongside the spoon, growing with the tint.
  heatArrow(ctx, c, t) {
    const u = inOutSine(clamp01(t / (CREEP_STEPS * STEP_S)));
    const dx = SP_B.x - SP_A.x, dy = SP_B.y - SP_A.y, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, nx = uy, ny = -ux;   // left of the spoon
    const off = 46;
    const x0 = SP_A.x + nx * off - ux * 10, y0 = SP_A.y + ny * off - uy * 10;
    const L = (len - 40) * Math.max(0.12, u);
    const col = c.s8;
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(Math.atan2(uy, ux));
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(L - 26, -9); ctx.lineTo(L - 26, -20); ctx.lineTo(L, 0);
    ctx.lineTo(L - 26, 20); ctx.lineTo(L - 26, 9); ctx.lineTo(0, 9); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = alpha(darken(col, 0.3), 0.6);
    ctx.fillRect(0, 3, L - 26, 6);
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.7);
    ctx.fillRect(2, -7, L - 30, 3);
    ctx.restore();
    const mid = 0.5 * (len - 40);
    pill(ctx, c, 'heat', x0 + ux * mid + nx * 40, y0 + uy * mid + ny * 40, { bg: c.s8, size: 24, alpha: clamp01((u - 0.3) / 0.3) });
  }

  // ---- b1: three pictures --------------------------------------------------

  panel(ctx, c, x, y, w, h, fill) {
    rr(ctx, x, y + 5, w, h, 16); ctx.fillStyle = darken(fill, 0.3); ctx.fill();
    rr(ctx, x, y, w, h, 16); ctx.fillStyle = fill; ctx.fill();
    rr(ctx, x, y, w, h, 16); ctx.strokeStyle = mix(fill, c.stroke, 0.6); ctx.lineWidth = 2.5; ctx.stroke();
  }

  space(ctx, c, t) {
    const x = 16, y = 14, w = 648, h = 236;
    const sky = darken(mix(c.s5, c.s1, 0.3), 0.78);
    this.panel(ctx, c, x, y, w, h, sky);
    ctx.save();
    rr(ctx, x, y, w, h, 16); ctx.clip();
    const rnd = mulberry32(7);
    for (let i = 0; i < 46; i++) {
      const sx = x + rnd() * w, sy = y + rnd() * h, r = 0.8 + rnd() * 1.6;
      ctx.fillStyle = alpha(lighten(c.s2, 0.8), 0.35 + rnd() * 0.5);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    // the Sun, cut by the left edge: glow, body, light and shade
    const sx = 64, sy = y + h / 2;
    for (let k = 3; k >= 1; k--) {
      ctx.fillStyle = alpha(c.s2, 0.1 * (4 - k));
      ctx.beginPath(); ctx.arc(sx, sy, 92 + k * 16, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = mix(c.s2, c.s8, 0.35);
    ctx.beginPath(); ctx.arc(sx, sy, 92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.s2, 0.5), 0.8);
    ctx.beginPath(); ctx.arc(sx - 14, sy - 16, 62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(c.s8, 0.4);
    for (const [a, b, r] of [[30, 30, 10], [-10, 50, 7], [50, -20, 8]]) { ctx.beginPath(); ctx.arc(sx + a, sy + b, r, 0, Math.PI * 2); ctx.fill(); }
    // the Earth on the right: ocean, land, night side
    const ex = 588, ey = sy, er = 54;
    ctx.save();
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = mix(c.s1, c.s5, 0.15); ctx.fillRect(ex - er, ey - er, er * 2, er * 2);
    ctx.fillStyle = mix(c.s3, c.s2, 0.25);
    ctx.beginPath(); ctx.moveTo(ex - 30, ey - 40); ctx.bezierCurveTo(ex + 6, ey - 52, ex + 20, ey - 10, ex - 2, ey + 4); ctx.bezierCurveTo(ex - 14, ey + 14, ex - 34, ey - 6, ex - 30, ey - 40); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ex + 8, ey + 18); ctx.bezierCurveTo(ex + 34, ey + 10, ex + 40, ey + 44, ex + 14, ey + 50); ctx.bezierCurveTo(ex, ey + 40, ex - 4, ey + 26, ex + 8, ey + 18); ctx.fill();
    ctx.fillStyle = alpha(darken(sky, 0.4), 0.55);              // the night side faces away from the Sun
    ctx.beginPath(); ctx.arc(ex + 22, ey, er + 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.s1, 0.5), 0.8); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.stroke();
    // rays: wavy lines from the Sun to the Earth, wave crests travelling right
    const x0 = sx + 104, x1 = ex - er - 10, phase = t * 9;
    ctx.lineCap = 'round';
    for (const dyy of [-38, 0, 38]) {
      const y0 = sy + dyy, y1 = ey + dyy * 0.55;
      ctx.strokeStyle = alpha(c.s2, 0.9);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let k = 0; k <= 80; k++) {
        const u = k / 80, px = x0 + (x1 - x0) * u;
        const py = y0 + (y1 - y0) * u + Math.sin(u * 30 - phase) * 6;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      const hx = x1, hy = y1;
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.fillStyle = c.s2;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8);
      ctx.lineTo(hx - Math.cos(a - 0.5) * 16, hy - Math.sin(a - 0.5) * 16);
      ctx.lineTo(hx - Math.cos(a + 0.5) * 16, hy - Math.sin(a + 0.5) * 16);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    pill(ctx, c, 'radiation', 340, y + 30, { bg: c.s2, size: 24 });
    pill(ctx, c, 'Sun', 200, y + h - 26, { bg: c.s8, size: 22 });
    pill(ctx, c, 'Earth', ex, y + h - 24, { bg: c.s1, size: 22 });
  }

  circuit(ctx, c, t) {
    const x = 16, y = 268, w = 316, h = 236;
    this.panel(ctx, c, x, y, w, h, c.raised);
    const wire = mix(c.s8, c.label, 0.3);
    // loop: cell on the left side, bulb at the top right
    const L = x + 56, R = x + 270, T = y + 112, B = y + h - 30;
    const bulbX = x + 196, bulbY = T;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = darken(wire, 0.35); ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(bulbX - 18, T); ctx.lineTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.lineTo(R, T); ctx.lineTo(bulbX + 18, T); ctx.stroke();
    ctx.strokeStyle = wire; ctx.lineWidth = 4.5; ctx.stroke();
    // charges moving round the loop
    const path = [[L, T], [L, B], [R, B], [R, T], [bulbX + 18, T]];
    const segs = []; let total = 0;
    for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(l); total += l; }
    for (let k = 0; k < 9; k++) {
      let s = ((k / 9) * total + t * 70) % total;
      let i = 0; while (s > segs[i]) { s -= segs[i]; i++; }
      const [ax, ay] = path[i], [bx, by] = path[i + 1];
      const px = ax + (bx - ax) * (s / segs[i]), py = ay + (by - ay) * (s / segs[i]);
      ctx.fillStyle = c.s7; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha(lighten(c.s7, 0.6), 0.9); ctx.beginPath(); ctx.arc(px - 1.5, py - 1.5, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // the cell, standing on the left wire
    const cx = L, cy = (T + B) / 2 + 4, cw = 42, ch = 70;
    rr(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 8); ctx.fillStyle = mix(c.s3, c.bgSurface, 0.2); ctx.fill();
    ctx.fillStyle = darken(mix(c.s3, c.bgSurface, 0.2), 0.25); ctx.fillRect(cx + 6, cy - ch / 2 + 4, 14, ch - 8);
    ctx.fillStyle = alpha(lighten(c.s3, 0.5), 0.7); ctx.fillRect(cx - cw / 2 + 5, cy - ch / 2 + 6, 6, ch - 12);
    ctx.fillStyle = darken(c.s3, 0.5); ctx.fillRect(cx - cw / 2, cy + 6, cw, 6);
    rr(ctx, cx - 9, cy - ch / 2 - 9, 18, 11, 3); ctx.fillStyle = mix(c.labelMuted, c.bgSurface, 0.2); ctx.fill();
    ctx.strokeStyle = darken(mix(c.s3, c.bgSurface, 0.2), 0.45); ctx.lineWidth = 2; rr(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 8); ctx.stroke();
    // the bulb: glow, glass, filament, screw base
    const on = clamp01(t / 0.6);
    for (let k = 3; k >= 1; k--) {
      ctx.fillStyle = alpha(c.s2, 0.13 * on * (4 - k));
      ctx.beginPath(); ctx.arc(bulbX, bulbY - 40, 30 + k * 13, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = mix(c.labelMuted, c.bgSurface, 0.3);
    rr(ctx, bulbX - 14, bulbY - 12, 28, 18, 4); ctx.fill();
    ctx.strokeStyle = darken(mix(c.labelMuted, c.bgSurface, 0.3), 0.35); ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(bulbX - 14, bulbY - 8 + i * 5); ctx.lineTo(bulbX + 14, bulbY - 6 + i * 5); ctx.stroke(); }
    ctx.beginPath();
    ctx.moveTo(bulbX - 12, bulbY - 12);
    ctx.bezierCurveTo(bulbX - 14, bulbY - 26, bulbX - 30, bulbY - 34, bulbX - 30, bulbY - 52);
    ctx.arc(bulbX, bulbY - 52, 30, Math.PI, 0);
    ctx.bezierCurveTo(bulbX + 30, bulbY - 34, bulbX + 14, bulbY - 26, bulbX + 12, bulbY - 12);
    ctx.closePath();
    ctx.fillStyle = mix(alpha(c.glass, 0.5), c.s2, 0.6 * on); ctx.fill();
    ctx.strokeStyle = darken(c.glass, 0.35); ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.glass, 0.7), 0.8); ctx.beginPath(); ctx.ellipse(bulbX - 14, bulbY - 60, 5, 11, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = mix(c.s8, c.s2, on); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bulbX - 6, bulbY - 14); ctx.lineTo(bulbX - 8, bulbY - 44);
    for (let i = 0; i < 4; i++) ctx.lineTo(bulbX - 6 + i * 4, bulbY - (i % 2 ? 40 : 48));
    ctx.lineTo(bulbX + 8, bulbY - 44); ctx.lineTo(bulbX + 6, bulbY - 14); ctx.stroke();
    pill(ctx, c, 'circuit', x + 160, (T + B) / 2 + 4, { bg: c.s7, size: 24 });
  }

  speaker(ctx, c, t) {
    const x = 348, y = 268, w = 316, h = 236;
    this.panel(ctx, c, x, y, w, h, c.raised);
    const box = darken(mix(c.s5, c.stroke, 0.4), 0.45);
    const bx = x + 26, by = y + 36, bw = 96, bh = 168;
    // cabinet
    rr(ctx, bx, by + 4, bw, bh, 10); ctx.fillStyle = darken(box, 0.35); ctx.fill();
    rr(ctx, bx, by, bw, bh, 10); ctx.fillStyle = box; ctx.fill();
    ctx.fillStyle = alpha(lighten(box, 0.35), 0.8); ctx.fillRect(bx + 4, by + 8, 5, bh - 16);
    ctx.fillStyle = alpha(darken(box, 0.3), 0.8); ctx.fillRect(bx + bw - 14, by + 8, 10, bh - 16);
    // two cones; the big one moves with the sound
    const cone = (cx, cy, r, push) => {
      ctx.fillStyle = darken(box, 0.4); ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mix(c.labelMuted, box, 0.55); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mix(c.labelMuted, box, 0.3); ctx.beginPath(); ctx.arc(cx - r * 0.12, cy - r * 0.12, r * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = darken(box, 0.2); ctx.beginPath(); ctx.arc(cx + push, cy, r * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha(lighten(c.labelMuted, 0.4), 0.7); ctx.beginPath(); ctx.arc(cx + push - r * 0.09, cy - r * 0.09, r * 0.1, 0, Math.PI * 2); ctx.fill();
    };
    cone(bx + bw / 2, by + 40, 18, 0);
    cone(bx + bw / 2, by + 112, 34, Math.sin(t * 25) * 2);
    // sound waves: arcs spreading right, spaced evenly, moving out
    const ox = bx + bw + 4, oy = by + 112;
    ctx.save();
    rr(ctx, x, y, w, h, 16); ctx.clip();
    ctx.lineCap = 'round';
    const sp = 30, shift = (t * 60) % sp;
    for (let k = 0; k < 5; k++) {
      const r = 26 + k * sp + shift;
      const a = 0.95 * (1 - (r - 26) / (5 * sp));
      if (a <= 0) continue;
      ctx.strokeStyle = alpha(c.s8, a); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(ox, oy, r, -0.6, 0.6); ctx.stroke();
    }
    ctx.restore();
    pill(ctx, c, 'sound', x + 228, y + 38, { bg: c.s8, size: 24 });
  }
}
