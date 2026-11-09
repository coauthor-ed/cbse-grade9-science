import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, inOutSine, clamp01, mix, alpha, lighten, darken, rr, ellipse,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { vectorArrow } from 'simulations/base/kit/SimLook.js';

// EnergySourcesScene - blk-l02-n01 (book Fig 7.1, drawn fresh).
// b0: three panels. A student walks (food: a tiffin), a ceiling fan turns
//     (electricity: the wall switchboard and its wire), a car drives off
//     (fuel: the pump behind it). Beads run from each source into its user.
// b1: the same three, each now doing work (the sources leave the picture): the student pushes a crate, the
//     fan pushes air down, the car pushes a carton out of its way. Each has a
//     solid force arrow F and a dashed displacement arrow s, both the same way.

const PY0 = 22, PY1 = 470, PH = PY1 - PY0;
const PW = 206, GAP = 15;
const PX = [16, 16 + PW + GAP, 16 + 2 * (PW + GAP)];   // 16, 237, 458
const GROUND = 416;                                    // the floor or road line in every panel
const MOVE_S = 2.4;
const FIG_H = 196;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class EnergySourcesScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Three pictures side by side. A student walks, with a tiffin of food. A ceiling fan turns, wired to a switchboard on the wall. A car drives away from a fuel pump. On the next step each one does work: the student pushes a crate, the fan pushes air down, and the car pushes a carton along; each has a force arrow F and a displacement arrow s pointing the same way.';

  enter() { this.mt = 0; }

  get workBeat() { return this.stage >= 1; }

  pointerDown() { this.mt = 0; this.animateFor(600); }

  update(d) { this.mt = Math.min(MOVE_S + 0.1, (this.mt ?? 0) + d); }

  busy() { return (this.mt ?? 0) < MOVE_S + 0.1; }

  get u() { return inOutSine(clamp01((this.mt ?? 0) / MOVE_S)); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.panel(ctx, c, 0, () => this.walkPanel(ctx, c));
    this.panel(ctx, c, 1, () => this.fanPanel(ctx, c));
    this.panel(ctx, c, 2, () => this.carPanel(ctx, c));
  }

  // One rimmed panel; its own setting is painted inside a clip.
  panel(ctx, c, i, paint) {
    const x = PX[i];
    ctx.save();
    rr(ctx, x, PY0, PW, PH, 18);
    ctx.fillStyle = c.bgSurface;
    ctx.fill();
    ctx.save();
    rr(ctx, x, PY0, PW, PH, 18);
    ctx.clip();
    ctx.translate(x, 0);
    paint();
    ctx.restore();
    rr(ctx, x, PY0, PW, PH, 18);
    ctx.strokeStyle = darken(mix(c.bgSurface, c.label, 0.2), 0.1);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // A row of travelling beads from a to b (quadratic through m): energy on its way.
  beads(ctx, c, a, m, b) {
    if (this.workBeat) return;
    const t = (this.mt ?? 0) / MOVE_S;
    const k = Math.min(1, t * 1.4);
    ctx.save();
    for (let j = 0; j < 7; j++) {
      const s = ((j / 7) + t * 0.9) % 1;
      if (s > k) continue;
      const q = 1 - s;
      const x = q * q * a.x + 2 * q * s * m.x + s * s * b.x;
      const y = q * q * a.y + 2 * q * s * m.y + s * s * b.y;
      ctx.fillStyle = alpha(c.s3, 0.35);
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.s3;
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lighten(c.s3, 0.5);
      ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  sourcePill(ctx, c, text, x, y) {
    pill(ctx, c, text, x, y, { bg: c.s3, size: 26 });
  }

  // The two arrows of work: force solid (F), displacement dashed (s), same direction.
  workArrows(ctx, c, fx, fy, sx, sy, ang, fLen, sLen) {
    if (!this.workBeat) return;
    const a = clamp01((this.mt ?? 0) / 0.5);
    vectorArrow(ctx, c, fx, fy, { angle: ang, length: fLen, col: c.accent, width: 5, head: 14, alpha: a });
    // labels beside the middle of each arrow (above a level one), inside a narrow panel
    const ox = Math.sin(ang) * 28, oy = -Math.cos(ang) * 28;
    pill(ctx, c, 'F', fx + Math.cos(ang) * fLen / 2 + ox, fy + Math.sin(ang) * fLen / 2 + oy, { bg: c.accent, size: 26, alpha: a });
    displacementArrow(ctx, c, sx, sy, sx + Math.cos(ang) * sLen, sy + Math.sin(ang) * sLen, { alpha: a });
    pill(ctx, c, 's', sx + Math.cos(ang) * sLen / 2 + ox, sy + Math.sin(ang) * sLen / 2 + oy, { bg: c.s2, size: 26, alpha: a });
  }

  // ---------------- panel 1: walking, food ----------------
  walkPanel(ctx, c) {
    // outdoors: sky, a far hedge, a paved path
    const g = ctx.createLinearGradient(0, PY0, 0, GROUND);
    g.addColorStop(0, mix(c.water ?? c.s1, c.bgSurface, 0.55));
    g.addColorStop(1, mix(c.water ?? c.s1, c.bgSurface, 0.85));
    ctx.fillStyle = g;
    ctx.fillRect(0, PY0, PW, GROUND - PY0);
    const hedge = mix(c.good, c.bgSurface, 0.45);
    ctx.fillStyle = hedge;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(10 + i * 40, GROUND - 92, 30, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillRect(0, GROUND - 92, PW, 92);
    ctx.fillStyle = darken(hedge, 0.16);
    ctx.fillRect(0, GROUND - 40, PW, 40);
    ctx.fillStyle = lighten(hedge, 0.18);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(2 + i * 40, GROUND - 108, 9, 0, Math.PI * 2); ctx.fill(); }
    this.pavement(ctx, c);

    if (!this.workBeat) {
      const x0 = 70, x1 = 140;
      const x = x0 + (x1 - x0) * this.u;
      const dist = x - x0;
      const phase = (walkPhase(dist, FIG_H, 'walk') + 0.25) % 1;
      this.tiffin(ctx, c, 34, GROUND);
      const spec = figureFor(this, { role: 'student', pose: { name: 'walk', phase }, x, y: GROUND, height: FIG_H, facing: 1 });
      drawFigure(ctx, c, spec, spec.look);
      this.beads(ctx, c, { x: 34, y: GROUND - 74 }, { x: x - 30, y: GROUND - 190 }, { x, y: GROUND - 112 });
      this.sourcePill(ctx, c, 'food', 52, GROUND + 30);
    } else {
      const shift = 24 * this.u;
      const cx = 136 + shift;
      drawCrate(ctx, c, { x: cx, y: GROUND, w: 74, h: 92, kind: 'crate' });
      const gx = cx - 37, hy = GROUND - 82;
      const spec = figureFor(this, { role: 'student', pose: 'push', x: gx - 66, y: GROUND, height: FIG_H, facing: 1,
        hands: [{ x: gx, y: hy }, { x: gx + 2, y: hy - 10 }] });
      drawFigure(ctx, c, spec, spec.look);
      this.workArrows(ctx, c, cx - 34, GROUND - 116, cx - 34, GROUND - 176, 0, 60, 60);
    }
  }

  pavement(ctx, c) {
    const p = mix(c.bgSurface, c.label, 0.18);
    ctx.fillStyle = p;
    ctx.fillRect(0, GROUND, PW, PY1 - GROUND);
    ctx.fillStyle = lighten(p, 0.18);
    ctx.fillRect(0, GROUND, PW, 4);
    ctx.strokeStyle = darken(p, 0.14);
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(i * 44 - 10, GROUND + 4); ctx.lineTo(i * 44 - 22, PY1); ctx.stroke();
    }
  }

  // A three-tier steel tiffin carrier with its clip handle.
  tiffin(ctx, c, x, y, a = 1) {
    ctx.save();
    ctx.globalAlpha *= a;
    drawShadow(ctx, c, x, y + 1, 24, 5, 0.8);
    const steel = mix(c.bgSurface, c.label, 0.3);
    const w = 40, th = 19;
    for (let i = 0; i < 3; i++) {
      const y0 = y - (i + 1) * th;
      rr(ctx, x - w / 2, y0, w, th - 2, 5);
      ctx.fillStyle = steel; ctx.fill();
      ctx.fillStyle = lighten(steel, 0.32);
      ctx.fillRect(x - w / 2 + 4, y0 + 3, 6, th - 8);
      ctx.fillStyle = darken(steel, 0.2);
      ctx.fillRect(x + w / 2 - 11, y0 + 2, 8, th - 6);
      ctx.fillStyle = darken(steel, 0.35);
      ctx.fillRect(x - w / 2 - 2, y0 + th - 4, w + 4, 3);
    }
    const top = y - 3 * th;
    ctx.strokeStyle = darken(steel, 0.3);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 3, y - 6); ctx.lineTo(x - w / 2 - 3, top - 12);
    ctx.quadraticCurveTo(x, top - 26, x + w / 2 + 3, top - 12); ctx.lineTo(x + w / 2 + 3, y - 6);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------- panel 2: ceiling fan, electricity ----------------
  fanPanel(ctx, c) {
    const wall = mix(c.bgSurface, c.s5, 0.14);
    ctx.fillStyle = wall;
    ctx.fillRect(0, PY0, PW, GROUND - PY0);
    ctx.fillStyle = lighten(wall, 0.1);
    ctx.fillRect(0, PY0, 18, GROUND - PY0);
    const ceil = darken(wall, 0.12);
    ctx.fillStyle = ceil;
    ctx.fillRect(0, PY0, PW, 34);
    ctx.fillStyle = darken(ceil, 0.2);
    ctx.fillRect(0, PY0 + 34, PW, 4);
    // floor
    const fl = mix(c.gold, c.bgSurface, 0.55);
    ctx.fillStyle = fl;
    ctx.fillRect(0, GROUND, PW, PY1 - GROUND);
    ctx.fillStyle = darken(wall, 0.2);
    ctx.fillRect(0, GROUND - 8, PW, 8);
    ctx.fillStyle = lighten(fl, 0.2);
    ctx.fillRect(0, GROUND, PW, 3);

    const hx = PW / 2 + 6, hy = 168;
    // the wire: from the switchboard up the wall into the ceiling, along to the rod
    const sbx = 34, sby = 300;
    if (!this.workBeat) {
      ctx.strokeStyle = darken(wall, 0.32);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sbx, sby - 34); ctx.lineTo(sbx, PY0 + 40); ctx.lineTo(hx, PY0 + 40);
      ctx.stroke();
      this.switchboard(ctx, c, sbx, sby);
    }
    this.beads(ctx, c, { x: sbx, y: sby - 34 }, { x: sbx, y: PY0 + 40 }, { x: hx, y: PY0 + 44 });

    // the down-rod and canopy
    ctx.fillStyle = darken(c.bgSurface, 0.25);
    rr(ctx, hx - 16, PY0 + 34, 32, 12, 4); ctx.fill();
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.35);
    ctx.fillRect(hx - 4, PY0 + 44, 8, hy - PY0 - 60);
    ctx.fillStyle = lighten(mix(c.bgSurface, c.label, 0.35), 0.3);
    ctx.fillRect(hx - 3, PY0 + 44, 2, hy - PY0 - 60);

    const spin = (this.workBeat ? 0.6 : 0.2) + (this.mt ?? 0) * 7 * (0.4 + 0.6 * Math.min(1, (this.mt ?? 0) / 0.8));
    const R = 92, flat = 0.3;
    // the turning blur: an ellipse swept by the blades
    ctx.fillStyle = alpha(c.labelMuted, 0.1);
    ellipse(ctx, hx, hy, R + 4, (R + 4) * flat); ctx.fill();
    ctx.strokeStyle = alpha(c.labelMuted, 0.28);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(hx, hy, R - 6, (R - 6) * flat, 0, 0.2, 1.4); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx, hy, R - 6, (R - 6) * flat, 0, Math.PI + 0.2, Math.PI + 1.4); ctx.stroke();
    const blades = [0, 1, 2].map((i) => spin + i * (Math.PI * 2 / 3));
    const back = blades.filter((a) => Math.sin(a) < 0), front = blades.filter((a) => Math.sin(a) >= 0);
    for (const a of back) this.blade(ctx, c, hx, hy, a, R, flat);
    this.motor(ctx, c, hx, hy);
    for (const a of front) this.blade(ctx, c, hx, hy, a, R, flat);

    if (!this.workBeat) {
      this.sourcePill(ctx, c, 'electricity', PW / 2, GROUND + 30);
    } else {
      // the air the fan pushes: four columns of wavy streaks running down to the floor
      const t = this.mt ?? 0;
      const cols = [hx - 68, hx - 16, hx + 34, hx + 78];
      const air = mix(c.s1, c.bgSurface, 0.25);
      ctx.save();
      ctx.lineCap = 'round';
      cols.forEach((x, j) => {
        for (let n = 0; n < 3; n++) {
          const s = ((t * 0.45 + n / 3 + j * 0.11) % 1);
          const y = hy + 40 + s * (GROUND - hy - 90);
          ctx.strokeStyle = alpha(air, 0.85 - 0.5 * s);
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + 10, y + 10, x - 10, y + 22, x, y + 34);
          ctx.stroke();
        }
      });
      ctx.restore();
      // F from the blades into the air; s along one air column, the same way
      this.workArrows(ctx, c, hx - 42, hy + 44, hx + 34, hy + 52, Math.PI / 2, 84, 150);
    }
  }

  blade(ctx, c, hx, hy, a, R, flat) {
    const ca = Math.cos(a), sa = Math.sin(a) * flat;
    const px = -Math.sin(a), py = Math.cos(a) * flat;   // across the blade, in the tilted plane
    const r0 = 22, wr = 7, wt = 20;
    const p = (r, w) => ({ x: hx + ca * r + px * w, y: hy + sa * r + py * w });
    const pts = [p(r0, -wr), p(R, -wt), p(R + 4, 0), p(R, wt * 0.7), p(r0, wr)];
    const col = mix(c.gold, c.bgSurface, 0.15);
    const near = Math.sin(a) >= 0;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
    ctx.closePath();
    ctx.fillStyle = near ? col : darken(col, 0.14);
    ctx.fill();
    // shade along the trailing edge, a lit line along the leading one
    ctx.beginPath();
    ctx.moveTo(p(r0, 0).x, p(r0, 0).y); ctx.lineTo(p(R, 0).x, p(R, 0).y); ctx.lineTo(pts[3].x, pts[3].y); ctx.lineTo(pts[4].x, pts[4].y);
    ctx.closePath();
    ctx.fillStyle = darken(col, 0.18);
    ctx.fill();
    ctx.strokeStyle = lighten(col, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
    ctx.closePath();
    ctx.strokeStyle = darken(col, 0.38);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  motor(ctx, c, hx, hy) {
    const m = mix(c.bgSurface, c.label, 0.4);
    ctx.fillStyle = darken(m, 0.25);
    ellipse(ctx, hx, hy + 8, 30, 10); ctx.fill();
    rr(ctx, hx - 30, hy - 14, 60, 22, 10);
    ctx.fillStyle = m; ctx.fill();
    ctx.fillStyle = darken(m, 0.2);
    ctx.fillRect(hx + 10, hy - 12, 18, 18);
    ctx.fillStyle = lighten(m, 0.35);
    ctx.fillRect(hx - 24, hy - 10, 14, 4);
    ctx.fillStyle = lighten(m, 0.15);
    ellipse(ctx, hx, hy - 14, 30, 7); ctx.fill();
    ctx.strokeStyle = darken(m, 0.4);
    ctx.lineWidth = 2;
    rr(ctx, hx - 30, hy - 14, 60, 22, 10); ctx.stroke();
  }

  // A wall switchboard: plate, two rocker switches, a three-pin socket.
  switchboard(ctx, c, x, y) {
    const pl = lighten(c.bgSurface, 0.06);
    const w = 46, h = 70;
    ctx.fillStyle = alpha(c.label, 0.12);
    rr(ctx, x - w / 2 + 3, y - h / 2 + 4, w, h, 6); ctx.fill();
    rr(ctx, x - w / 2, y - h / 2, w, h, 6);
    ctx.fillStyle = pl; ctx.fill();
    ctx.fillStyle = darken(pl, 0.1);
    ctx.fillRect(x + w / 2 - 9, y - h / 2 + 3, 6, h - 6);
    ctx.strokeStyle = darken(pl, 0.3);
    ctx.lineWidth = 2;
    rr(ctx, x - w / 2, y - h / 2, w, h, 6); ctx.stroke();
    for (const dx of [-10, 10]) {
      rr(ctx, x + dx - 6, y - 28, 12, 20, 3);
      ctx.fillStyle = dx < 0 ? c.s3 : darken(pl, 0.2); ctx.fill();
      ctx.fillStyle = darken(dx < 0 ? c.s3 : pl, 0.35);
      ctx.fillRect(x + dx - 5, y - 18, 10, 9);
    }
    ctx.fillStyle = darken(pl, 0.55);
    for (const [dx, dy] of [[0, 8], [-8, 22], [8, 22]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 3.2, 0, Math.PI * 2); ctx.fill(); }
  }

  // ---------------- panel 3: car, fuel ----------------
  carPanel(ctx, c) {
    const g = ctx.createLinearGradient(0, PY0, 0, GROUND);
    g.addColorStop(0, mix(c.water ?? c.s1, c.bgSurface, 0.55));
    g.addColorStop(1, mix(c.water ?? c.s1, c.bgSurface, 0.85));
    ctx.fillStyle = g;
    ctx.fillRect(0, PY0, PW, GROUND - PY0);
    // a far roadside wall
    const far = mix(c.bgSurface, c.label, 0.14);
    ctx.fillStyle = far;
    ctx.fillRect(0, GROUND - 120, PW, 70);
    ctx.fillStyle = darken(far, 0.12);
    for (let i = 0; i < 6; i++) ctx.fillRect(i * 38 + 6, GROUND - 120, 3, 70);
    ctx.fillStyle = lighten(far, 0.15);
    ctx.fillRect(0, GROUND - 124, PW, 6);
    // the road
    const road = mix(c.bgDeep, c.label, 0.5);
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.22);
    ctx.fillRect(0, GROUND - 50, PW, 14);
    ctx.fillStyle = road;
    ctx.fillRect(0, GROUND - 36, PW, PY1 - GROUND + 36);
    ctx.fillStyle = alpha(c.bgSurface, 0.75);
    for (let i = 0; i < 4; i++) ctx.fillRect(i * 60 + 6, GROUND + 26, 30, 5);

    if (!this.workBeat) {
      this.pump(ctx, c, 40, GROUND - 46);
      const x = 70 + 66 * this.u;
      const speed = Math.sin(Math.PI * clamp01((this.mt ?? 0) / MOVE_S));
      this.car(ctx, c, x, GROUND + 8, this.u * 8, 0.35 + speed * 0.65);
      this.beads(ctx, c, { x: 52, y: GROUND - 120 }, { x: 70, y: GROUND - 150 }, { x: x - 50, y: GROUND - 40 });
      this.sourcePill(ctx, c, 'fuel', 46, GROUND - 170);
    } else {
      const shift = 24 * this.u;
      const x = 40 + shift;
      this.car(ctx, c, x, GROUND + 8, this.u * 3, 0.6);
      const bx = x + 74 + 28;
      drawCrate(ctx, c, { x: bx, y: GROUND + 8, w: 54, h: 54, kind: 'carton' });
      this.workArrows(ctx, c, bx - 22, GROUND - 74, bx - 22, GROUND - 134, 0, 48, 48);
    }
  }

  // A fuel dispenser: body, display window, hose looped to the nozzle.
  pump(ctx, c, x, y, a = 1) {
    ctx.save();
    ctx.globalAlpha *= a;
    const body = c.s8;
    drawShadow(ctx, c, x, y + 1, 26, 5, 0.7);
    rr(ctx, x - 22, y - 96, 44, 96, 7);
    ctx.fillStyle = body; ctx.fill();
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(x + 8, y - 92, 11, 90);
    ctx.fillStyle = lighten(body, 0.3);
    ctx.fillRect(x - 18, y - 90, 5, 84);
    rr(ctx, x - 14, y - 84, 26, 22, 4);
    ctx.fillStyle = mix(c.glass ?? c.s6, c.bgSurface, 0.3); ctx.fill();
    ctx.fillStyle = darken(body, 0.35);
    ctx.fillRect(x - 24, y - 100, 48, 7);
    ctx.strokeStyle = darken(body, 0.4);
    ctx.lineWidth = 2;
    rr(ctx, x - 22, y - 96, 44, 96, 7); ctx.stroke();
    // hose and nozzle on its hook
    ctx.strokeStyle = mix(c.label, c.bgDeep, 0.3);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 22, y - 70);
    ctx.quadraticCurveTo(x + 40, y - 20, x + 26, y - 48);
    ctx.stroke();
    ctx.fillStyle = mix(c.label, c.bgDeep, 0.3);
    rr(ctx, x + 20, y - 56, 12, 16, 3); ctx.fill();
    ctx.restore();
  }

  // A small hatchback in side view, facing right; (x, y) = road contact under the middle.
  car(ctx, c, x, y, wheelTurn, motion) {
    const body = c.s1;
    const L = 148, wr = 15;
    const x0 = x - L / 2, base = y - wr;
    drawShadow(ctx, c, x, y + 1, L * 0.52, 6, 0.9);
    // speed lines behind
    if (motion > 0.2) {
      ctx.save();
      ctx.strokeStyle = alpha(c.labelMuted, 0.5 * motion);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const [dy, len] of [[-44, 30], [-28, 44], [-12, 26]]) {
        ctx.beginPath(); ctx.moveTo(x0 - 8, base + dy); ctx.lineTo(x0 - 8 - len, base + dy); ctx.stroke();
      }
      ctx.restore();
    }
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x0 + 4, base - 6);
      ctx.lineTo(x0 + 2, base - 34);
      ctx.quadraticCurveTo(x0 + 4, base - 44, x0 + 16, base - 46);
      ctx.lineTo(x0 + 30, base - 72);
      ctx.quadraticCurveTo(x0 + 36, base - 80, x0 + 50, base - 80);
      ctx.lineTo(x0 + 96, base - 80);
      ctx.quadraticCurveTo(x0 + 106, base - 80, x0 + 114, base - 70);
      ctx.lineTo(x0 + 128, base - 50);
      ctx.quadraticCurveTo(x0 + L, base - 46, x0 + L - 2, base - 30);
      ctx.lineTo(x0 + L - 2, base - 8);
      ctx.quadraticCurveTo(x0 + L - 4, base, x0 + L - 14, base);
      ctx.lineTo(x0 + 10, base);
      ctx.quadraticCurveTo(x0 + 4, base, x0 + 4, base - 6);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = body; ctx.fill();
    ctx.save();
    path(); ctx.clip();
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(x0, base - 24, L, 30);
    ctx.fillStyle = lighten(body, 0.28);
    ctx.fillRect(x0, base - 50, L, 4);
    ctx.restore();
    // windows
    ctx.fillStyle = mix(c.glass ?? c.s6, c.bgDeep, 0.35);
    ctx.beginPath();
    ctx.moveTo(x0 + 24, base - 50); ctx.lineTo(x0 + 36, base - 72); ctx.lineTo(x0 + 68, base - 72); ctx.lineTo(x0 + 68, base - 50); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0 + 74, base - 50); ctx.lineTo(x0 + 74, base - 72); ctx.lineTo(x0 + 98, base - 72); ctx.lineTo(x0 + 114, base - 50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha(c.bgSurface, 0.45);
    ctx.beginPath();
    ctx.moveTo(x0 + 80, base - 70); ctx.lineTo(x0 + 88, base - 70); ctx.lineTo(x0 + 80, base - 56); ctx.closePath(); ctx.fill();
    // door line, handle, lights, bumper
    ctx.strokeStyle = darken(body, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + 71, base - 74); ctx.lineTo(x0 + 71, base - 6); ctx.stroke();
    ctx.fillStyle = darken(body, 0.4);
    ctx.fillRect(x0 + 78, base - 42, 12, 3);
    ctx.fillStyle = c.gold;
    rr(ctx, x0 + L - 10, base - 40, 8, 9, 3); ctx.fill();
    ctx.fillStyle = c.bad;
    rr(ctx, x0 + 2, base - 38, 6, 10, 2); ctx.fill();
    ctx.fillStyle = mix(c.label, c.bgDeep, 0.35);
    rr(ctx, x0 + L - 14, base - 12, 14, 8, 3); ctx.fill();
    rr(ctx, x0, base - 12, 12, 8, 3); ctx.fill();
    path();
    ctx.strokeStyle = darken(body, 0.42);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    for (const wx of [x0 + 32, x0 + L - 32]) this.wheel(ctx, c, wx, y - wr, wr, wheelTurn);
  }

  wheel(ctx, c, x, y, r, turn) {
    const tyre = mix(c.label, c.bgDeep, 0.25);
    ctx.fillStyle = darken(c.s1, 0.5);
    ctx.beginPath(); ctx.arc(x, y - 2, r + 4, Math.PI, 0); ctx.fill();
    ctx.fillStyle = tyre;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    const hub = mix(c.bgSurface, c.label, 0.3);
    ctx.fillStyle = hub;
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(hub, 0.35);
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const a = turn + k * (Math.PI * 2 / 5);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); ctx.stroke();
    }
    ctx.fillStyle = lighten(hub, 0.3);
    ctx.beginPath(); ctx.arc(x - 2, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}
