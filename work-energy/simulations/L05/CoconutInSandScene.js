import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, clamp01, vectorArrow,
  mix, alpha, lighten, darken, rr, mulberry32,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// CoconutInSandScene - blk-l05-s11, A Coconut Falls (book Revise Q15).
// b0: a 1.5 kg coconut hangs 10 m up a palm on a beach: U = 150 J. It falls:
//     U drains into K. It rests just before it lands, K = 150 J, v = 14.1 m/s.
// b1: it lands in wet sand. The sand pushes up with F = 3000 N and takes all
//     150 J as heat and sound; a zoom shows the dent: 150 / 3000 = 0.05 m = 5 cm.
// The fall is a real fall: y = g t^2 / 2, t = sqrt(2h/g) = 1.41 s, real time.

const G = 10, MASS = 1.5, HM = 10, F_SAND = 3000;
const U0 = MASS * G * HM;                     // 150 J
const DEPTH_CM = U0 / F_SAND * 100;           // 5 cm
const SURF = 440;                             // the sand where it lands
const PXM = 34;                               // px per metre in the main view
const COCO_X = 300, COCO_R = 14;
const TOP_Y = SURF - HM * PXM;                // 100: the coconut's centre at the start
const HUB = { x: 268, y: 84 };
const BRACKET_X = 370;
const HOLD_S = 0.5, FALL_S = Math.sqrt(2 * HM / G), DIG_S = 0.6;
// the zoom: 8 px per cm
const IN = { x: 432, y: 268, w: 236, h: 240 };
const PXCM = 8;
const IN_SURF = IN.y + 150;
const IN_R = 64;                              // the coconut, about 16 cm across

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const quad = (a, b, cc, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * cc;

export class CoconutInSandScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A coconut palm on a beach. A 1.5 kg coconut falls 10 m: its potential energy bar of 150 J drains into kinetic energy, and just before it lands it moves at 14.1 m/s. Then it lands in wet sand: the sand pushes up with 3000 N, the kinetic energy becomes heat and sound, and a zoom shows the dent, 5 cm deep.';

  enter() { this.mt = 0; }

  pointerDown() { this.mt = 0; this.animateFor(800); }

  get runS() { return this.stage <= 0 ? HOLD_S + FALL_S : DIG_S + 0.3; }

  update(d) { this.mt = Math.min(this.runS + 0.1, (this.mt ?? 0) + d); }

  busy() { return (this.mt ?? 0) < this.runS + 0.1; }

  // b0: metres fallen; b1: dent depth as a fraction of 5 cm
  get fallM() {
    if (this.stage >= 1) return HM;
    const t = clamp01(((this.mt ?? 0) - HOLD_S) / FALL_S) * FALL_S;
    return Math.min(HM, 0.5 * G * t * t);
  }

  get digU() {
    if (this.stage <= 0) return 0;
    const u = clamp01((this.mt ?? 0) / DIG_S);
    return 1 - (1 - u) * (1 - u);              // the sand slows it to a stop
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky');
    this.sea(ctx, c);
    this.beach(ctx, c);
    this.palm(ctx, c);
    this.coconut(ctx, c);
    this.bracket(ctx, c);
    this.bars(ctx, c);
    if (this.stage >= 1) this.zoom(ctx, c);
  }

  sea(ctx, c) {
    const top = 318, shore = 372;
    const sea = mix(c.water, c.setWaterTop, 0.35);
    ctx.save();
    const g = ctx.createLinearGradient(0, top, 0, shore);
    g.addColorStop(0, darken(sea, 0.12));
    g.addColorStop(1, lighten(sea, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, shore - top);
    ctx.fillStyle = lighten(sea, 0.35);
    ctx.fillRect(0, top, W, 2);
    // wave crests: short light strokes, longer near the shore
    const rng = mulberry32(11);
    ctx.strokeStyle = alpha(lighten(sea, 0.55), 0.7); ctx.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const y = top + 8 + rng() * (shore - top - 14), x = rng() * W, l = 10 + (y - top) * 0.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 3, x + l, y); ctx.stroke();
    }
    ctx.restore();
  }

  beach(ctx, c) {
    const dry = mix(c.gold, c.setSand, 0.3);
    const wet = darken(mix(c.gold, c.setSand, 0.5), 0.18);
    ctx.save();
    // dry sand, then the wet band where the coconut lands, then the foam line
    ctx.fillStyle = dry;
    ctx.beginPath(); ctx.moveTo(0, 372); ctx.quadraticCurveTo(340, 360, W, 376); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = wet;
    ctx.beginPath(); ctx.moveTo(0, 412); ctx.quadraticCurveTo(320, 404, W, 416); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha(lighten(wet, 0.35), 0.6);
    ctx.beginPath(); ctx.moveTo(0, 412); ctx.quadraticCurveTo(320, 404, W, 416); ctx.lineTo(W, 419); ctx.quadraticCurveTo(320, 408, 0, 415); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(wet, 0.16);
    ctx.fillRect(0, H - 34, W, 34);
    const rng = mulberry32(5);
    for (let i = 0; i < 180; i++) {
      const x = rng() * W, y = 376 + rng() * (H - 376);
      ctx.fillStyle = alpha(rng() < 0.5 ? darken(dry, 0.3) : lighten(dry, 0.4), 0.7);
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = alpha(lighten(c.label, 0.2), 0.55);
    ctx.beginPath(); ctx.moveTo(0, 372); ctx.quadraticCurveTo(340, 360, W, 376); ctx.lineTo(W, 379); ctx.quadraticCurveTo(340, 364, 0, 375); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  palm(ctx, c) {
    const trunk = darken(mix(c.s2, c.s6, 0.45), 0.2);
    const base = { x: 168, y: SURF + 14 }, cp = { x: 150, y: 250 };
    const at = (t) => ({ x: quad(base.x, cp.x, HUB.x, t), y: quad(base.y, cp.y, HUB.y + 6, t), w: 13 - 6 * t });
    ctx.save();
    drawShadow(ctx, c, base.x + 30, base.y - 2, 60, 8, 0.8);
    const L = [], R = [];
    for (let i = 0; i <= 24; i++) { const p = at(i / 24); L.push([p.x - p.w, p.y]); R.push([p.x + p.w, p.y]); }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (const [x, y] of L) ctx.lineTo(x, y);
    for (const [x, y] of R.slice().reverse()) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = trunk; ctx.fill();
    ctx.save(); ctx.clip();
    // light side (left), shade side (right), ring scars
    ctx.fillStyle = alpha(lighten(trunk, 0.4), 0.45);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const p = at(i / 24); ctx.lineTo(p.x - p.w * 0.35, p.y); }
    for (let i = 24; i >= 0; i--) { const p = at(i / 24); ctx.lineTo(p.x - p.w - 2, p.y); }
    ctx.fill();
    ctx.fillStyle = alpha(darken(trunk, 0.35), 0.5);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const p = at(i / 24); ctx.lineTo(p.x + p.w * 0.4, p.y); }
    for (let i = 24; i >= 0; i--) { const p = at(i / 24); ctx.lineTo(p.x + p.w + 2, p.y); }
    ctx.fill();
    ctx.strokeStyle = alpha(darken(trunk, 0.5), 0.6); ctx.lineWidth = 2;
    for (let i = 1; i < 22; i++) {
      const p = at(i / 22);
      ctx.beginPath(); ctx.moveTo(p.x - p.w - 1, p.y); ctx.quadraticCurveTo(p.x, p.y + 4, p.x + p.w + 1, p.y); ctx.stroke();
    }
    ctx.restore();
    // fronds: back ones darker, then the front ones
    const leaf = mix(c.s3, c.bgDeep, 0.12);
    const fr = [
      [-2.75, 120, 0.25], [-2.2, 140, 0.18], [-1.75, 96, 0.22], [-1.3, 92, 0.2], [-0.75, 140, 0.15],
      [-0.3, 150, 0.1], [0.25, 120, 0.05], [2.85, 128, 0.08], [-3.1, 110, 0.0],
    ];
    for (const [a, l, dk] of fr) this.frond(ctx, HUB.x, HUB.y, a, l, darken(leaf, dk));
    // the crown boss and two coconuts that stay
    ctx.fillStyle = darken(trunk, 0.15);
    ctx.beginPath(); ctx.ellipse(HUB.x, HUB.y + 6, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    this.nut(ctx, c, HUB.x - 16, HUB.y + 20, 12, 0.3);
    this.nut(ctx, c, HUB.x + 6, HUB.y + 24, 12, -0.2);
    ctx.restore();
  }

  frond(ctx, x0, y0, ang, len, col) {
    // leaves the crown steeply, arches over, hangs at the tip
    const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len + len * 0.42;
    const ex = x0 + dx, ey = y0 + dy, mx = x0 + dx * 0.55, my = y0 + dy * 0.5 - len * 0.34;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i <= 14; i++) {
      const t = i / 15;
      const px = quad(x0, mx, ex, t), py = quad(y0, my, ey, t);
      const tx = 2 * (1 - t) * (mx - x0) + 2 * t * (ex - mx), ty = 2 * (1 - t) * (my - y0) + 2 * t * (ey - my);
      const a = Math.atan2(ty, tx);
      const l = len * 0.3 * (1 - Math.abs(t - 0.4) * 0.9);
      for (const sd of [-1, 1]) {
        // a leaflet: a thin filled blade that droops
        const ax = px + Math.cos(a + sd * 1.0) * l, ay = py + Math.sin(a + sd * 1.0) * l + l * 0.35;
        ctx.fillStyle = sd > 0 ? darken(col, 0.12) : col;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo((px + ax) / 2 + 3, (py + ay) / 2 - 3, ax, ay);
        ctx.quadraticCurveTo((px + ax) / 2 - 2, (py + ay) / 2 + 3, px, py);
        ctx.fill();
      }
    }
    ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
    ctx.strokeStyle = lighten(col, 0.3); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y0 - 1); ctx.quadraticCurveTo(mx, my - 1, ex, ey - 1); ctx.stroke();
    ctx.restore();
  }

  // a coconut in its husk: an egg shape, light side, shade side, fibre lines. No eyes.
  nut(ctx, c, x, y, r, tilt = 0) {
    const husk = mix(c.s3, c.s2, 0.55);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(tilt);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = husk; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(husk, 0.28);
    ctx.beginPath(); ctx.ellipse(r * 0.45, r * 0.2, r * 0.7, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(husk, 0.5), 0.7);
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.4, r * 0.28, r * 0.42, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(darken(husk, 0.4), 0.55); ctx.lineWidth = Math.max(1, r / 14);
    for (const k of [-0.5, 0, 0.5]) {
      ctx.beginPath(); ctx.moveTo(k * r, -r); ctx.quadraticCurveTo(k * r * 1.6, 0, k * r, r); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = darken(husk, 0.45); ctx.lineWidth = Math.max(1.5, r / 10);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r, 0, 0, Math.PI * 2); ctx.stroke();
    // the stalk end
    ctx.fillStyle = darken(husk, 0.5);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.92, r * 0.2, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  coconut(ctx, c) {
    const fm = this.fallM;
    const landed = this.stage >= 1;
    const y = landed ? SURF - COCO_R + 2 * this.digU : TOP_Y + fm * PXM - (fm >= HM ? 2 : 0);
    const yy = Math.min(y, SURF - COCO_R + 2);
    if (landed) {
      // the small dent in the main view
      ctx.fillStyle = darken(mix(c.gold, c.setSand, 0.5), 0.4);
      ctx.beginPath(); ctx.ellipse(COCO_X, SURF + 1, 20 * this.digU + 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      drawShadow(ctx, c, COCO_X, SURF + 2, 14 + 10 * (fm / HM), 4, 0.4 + 0.6 * fm / HM);
    }
    // the stalk it hung from, until it lets go
    if (!landed && fm <= 0) {
      ctx.strokeStyle = darken(mix(c.s2, c.s6, 0.45), 0.3); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(HUB.x + 8, HUB.y + 8); ctx.quadraticCurveTo(COCO_X - 4, HUB.y, COCO_X, yy - COCO_R); ctx.stroke();
    }
    this.nut(ctx, c, COCO_X, yy, COCO_R, landed ? 0.4 : 0);
    if (this.stage <= 0) {
      pill(ctx, c, `${MASS} kg`, COCO_X - 64, TOP_Y + 52, { bg: c.s2, size: 26 });
      if (!this.busy()) {
        // just before it lands: its speed, downward
        vectorArrow(ctx, c, COCO_X - 36, SURF - 112, { angle: Math.PI / 2, length: 96, col: c.s1, width: 5, head: 14 });
        pill(ctx, c, '14.1 m/s', COCO_X - 56, SURF - 138, { bg: c.s1, size: 26 });
      }
    }
  }

  bracket(ctx, c) {
    const a = this.stage >= 1 ? 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = c.label; ctx.lineWidth = 2.5;
    const x = BRACKET_X;
    ctx.beginPath();
    ctx.moveTo(x, SURF); ctx.lineTo(x, TOP_Y);
    ctx.moveTo(x - 10, SURF); ctx.lineTo(x + 10, SURF);
    ctx.moveTo(x - 10, TOP_Y); ctx.lineTo(x + 10, TOP_Y);
    ctx.stroke();
    ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(c.label, 0.6);
    ctx.beginPath(); ctx.moveTo(COCO_X + COCO_R + 4, TOP_Y); ctx.lineTo(x - 10, TOP_Y); ctx.stroke();
    ctx.restore();
    pill(ctx, c, '10 m', x, (SURF + TOP_Y) / 2 + 40, { bg: c.raised, ink: c.label, size: 26, alpha: a });
  }

  bars(ctx, c) {
    let K, U, heat;
    if (this.stage <= 0) { U = U0 * (1 - this.fallM / HM); K = U0 - U; heat = 0; } else { U = 0; heat = U0 * this.digU; K = U0 - heat; }
    drawEnergyBars(ctx, c, {
      x: 386, y: 12, h: 120, max: U0, total: U0, units: 'J', showValues: true, size: 26, minSize: 26, gap: 26,
      values: { K, U, heat },
    });
  }

  zoom(ctx, c) {
    const fade = clamp01((this.mt ?? 0) / 0.3);
    const u = this.digU;
    const dent = DEPTH_CM * PXCM * u;              // 40 px at the end
    const wet = darken(mix(c.gold, c.setSand, 0.5), 0.18);
    ctx.save();
    ctx.globalAlpha = fade;
    // a dashed tie from the landing spot to the zoom
    ctx.strokeStyle = alpha(c.label, 0.75); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(COCO_X, SURF - 6, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(COCO_X + 26, SURF - 6); ctx.lineTo(IN.x, IN.y + IN.h * 0.55); ctx.stroke();
    ctx.setLineDash([]);
    // the card
    rr(ctx, IN.x, IN.y, IN.w, IN.h, 14);
    ctx.fillStyle = mix(c.bgSurface, c.s7, 0.12); ctx.fill();
    ctx.save();
    rr(ctx, IN.x, IN.y, IN.w, IN.h, 14); ctx.clip();
    // sand in section: surface with the dent, layers below
    const cx = IN.x + 92;
    const half = Math.sqrt(Math.max(0, IN_R * IN_R - (IN_R - dent) * (IN_R - dent)));
    ctx.beginPath();
    ctx.moveTo(IN.x, IN_SURF);
    ctx.lineTo(cx - half - 8, IN_SURF);
    if (dent > 0.5) ctx.arc(cx, IN_SURF + dent - IN_R, IN_R + 2, Math.PI / 2 + Math.asin(Math.min(1, half / (IN_R + 2))), Math.PI / 2 - Math.asin(Math.min(1, half / (IN_R + 2))), true);
    ctx.lineTo(IN.x + IN.w, IN_SURF);
    ctx.lineTo(IN.x + IN.w, IN.y + IN.h); ctx.lineTo(IN.x, IN.y + IN.h); ctx.closePath();
    ctx.fillStyle = wet; ctx.fill();
    ctx.save(); ctx.clip();
    const rng = mulberry32(3);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = alpha(rng() < 0.5 ? darken(wet, 0.3) : lighten(wet, 0.35), 0.8);
      ctx.fillRect(IN.x + rng() * IN.w, IN_SURF + rng() * (IN.h - 150), 3, 3);
    }
    ctx.fillStyle = darken(wet, 0.14);
    ctx.fillRect(IN.x, IN_SURF + 62, IN.w, 40);
    ctx.restore();
    ctx.strokeStyle = lighten(wet, 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(IN.x, IN_SURF); ctx.lineTo(cx - half - 8, IN_SURF); ctx.moveTo(cx + half + 8, IN_SURF); ctx.lineTo(IN.x + IN.w, IN_SURF); ctx.stroke();
    // the coconut, to the same zoom
    this.nut(ctx, c, cx, IN_SURF + dent - IN_R * 0.98, IN_R, 0.4);
    // the sand's push on it: F up from the bottom of the dent
    vectorArrow(ctx, c, cx, IN_SURF + dent + 2, { angle: -Math.PI / 2, length: 92 * (0.4 + 0.6 * u), col: c.s6, width: 7, head: 18 });
    ctx.restore();
    // the depth, on a cm ruler at the right
    const rx = IN.x + IN.w - 46;
    ctx.strokeStyle = c.label; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 12, IN_SURF + dent); ctx.lineTo(rx + 8, IN_SURF + dent); ctx.stroke();
    // the old surface, dashed across the dent
    ctx.setLineDash([5, 4]); ctx.strokeStyle = alpha(c.label, 0.8);
    ctx.beginPath(); ctx.moveTo(cx - half - 8, IN_SURF); ctx.lineTo(cx + half + 8, IN_SURF); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = c.label;
    for (let k = 0; k <= 6; k++) {
      const y = IN_SURF + k * PXCM;
      ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + (k % 5 === 0 ? 18 : 10), y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(rx, IN_SURF); ctx.lineTo(rx, IN_SURF + 6 * PXCM); ctx.stroke();
    ctx.restore();
    pill(ctx, c, 'F = 3000 N', IN.x + IN.w / 2, IN.y + 26, { bg: c.s6, size: 22, alpha: fade });
    if (u > 0.98) {
      displacementArrow(ctx, c, rx - 12, IN_SURF, rx - 12, IN_SURF + dent, { tone: 2, width: 3, head: 9, dash: [4, 3] });
      pill(ctx, c, '5 cm', rx - 4, IN_SURF + dent + 28, { bg: c.s2, size: 22, alpha: fade });
    }
  }
}
