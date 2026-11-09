// SurfacesScene.js - slide "Hard, Soft, Rough" (blk-l06-s07, 3 beats, one sentence each). New 2026-11-03.
// Beat N shows rows 0..N (earlier rows dimmed, later ones not yet drawn). Three rows, one surface each, the same speaker and the same train of sound arcs in every row:
//   a hard smooth tiled wall: the arcs reflect from an image source behind the face (angle in =
//     angle out), strong and bright -> "reflects";
//   a heavy curtain: the arcs run into the folds and fade there; only a weak return -> "absorbs";
//   a rough rock face: each arc that lands breaks into short arcs leaving from the bumps of the
//     face in many directions, each weak -> "scatters".
// Everything is a pure function of scene time; the run stops at REST and parks on that frame,
// which already shows all three results.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, rr } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawPropagationArrow } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';

const W = 680, TAU = Math.PI * 2;
const ROWS = [{ y0: 10, h: 160 }, { y0: 180, h: 160 }, { y0: 350, h: 160 }];
const SPK_X = 66, SX = 468;            // speaker cone x, surface face x
const V = 170, P = 0.4;                // arc speed (px/s), one arc every P s
const BURST = 8, REST = 3.6, LOOP = REST + 0.1;   // a train of 8 arcs; at rest the last ones are still going in
                                                  // while the first ones are on their way back
const DROP = 32;                       // the speaker sits DROP above the row centre and aims at the face at the centre,
                                       // so the reflection (angle in = angle out) runs back DROP below it
const KINDS = ['hard', 'soft', 'rough'];
const TAGS = { hard: 'reflects', soft: 'absorbs', rough: 'scatters' };
// bumps of the rock face: [dy from row centre, outward direction (radians), strength]
const BUMPS = [[-58, Math.PI + 1.25, 0.8], [-34, Math.PI + 0.55, 0.9], [-8, Math.PI - 0.35, 0.85], [16, Math.PI + 0.2, 0.75], [40, Math.PI - 0.95, 0.9], [62, Math.PI - 1.45, 0.7]];
const rockX = (dy) => SX + 10 + 14 * Math.sin(dy * 0.19) + 9 * Math.sin(dy * 0.53 + 1.3);

export class SurfacesScene extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Three rows, each with the same speaker sending the same train of sound arcs to a different surface. '
    + 'A hard, smooth tiled wall sends strong, bright arcs straight back: it reflects. A heavy curtain swallows the arcs '
    + 'in its folds and only a weak return comes back: it absorbs. A rough rock face breaks each arc into short arcs '
    + 'that fly off in many directions: it scatters.';

  t() { return this.age; }
  busy() { return this.t() < LOOP; }

  draw(ctx, c) {
    const a = this.t(), tl = a < LOOP ? a : REST;
    ctx.fillStyle = mix(c.bgSurface, c.s1, 0.05); ctx.fillRect(0, 0, W, 520);
    const s = Math.min(2, Math.max(0, this.stage));
    ROWS.forEach((row, i) => {
      ctx.save(); ctx.globalAlpha = i < s ? 0.5 : i > s ? 0.3 : 1; this.row(ctx, c, row, KINDS[i], tl, i <= s); ctx.restore();
    });
  }

  row(ctx, c, row, kind, tl, live) {
    const cy = row.y0 + row.h / 2;
    // the row's floor band and a soft back tone
    ctx.save();
    rr(ctx, 6, row.y0, W - 12, row.h, 14); ctx.fillStyle = mix(c.bgSurface, c.gold, 0.07); ctx.fill();
    rr(ctx, 6, row.y0, W - 12, row.h, 14); ctx.clip();
    const g = ctx.createLinearGradient(0, row.y0, 0, row.y0 + row.h);
    g.addColorStop(0, alpha(c.bgDeep, 0)); g.addColorStop(1, alpha(c.bgDeep, 0.07));
    ctx.fillStyle = g; ctx.fillRect(0, row.y0, W, row.h);
    // a floor band with a lit edge: the room the speaker stands in
    const fl = ctx.createLinearGradient(0, row.y0 + row.h - 18, 0, row.y0 + row.h);
    fl.addColorStop(0, mix(c.bgSurface, c.gold, 0.22)); fl.addColorStop(1, darken(mix(c.bgSurface, c.gold, 0.3), 0.08));
    ctx.fillStyle = fl; ctx.fillRect(0, row.y0 + row.h - 18, W, 18);
    ctx.fillStyle = alpha(lighten(c.gold, 0.6), 0.6); ctx.fillRect(0, row.y0 + row.h - 18, W, 2);
    if (kind === 'hard') this.tiles(ctx, c, row);
    else if (kind === 'soft') this.curtain(ctx, c, row, tl);
    else this.rock(ctx, c, row);
    // the arcs
    const sp = drawSpeaker(ctx, c, { x: SPK_X, y: cy - DROP, r: 32, cutaway: true, cone: live && tl < BURST * P ? Math.sin(TAU * tl / P) * 0.8 : 0 });
    const o = sp.cone, D = Math.hypot(SX - o.x, DROP), din = Math.atan2(DROP, SX - o.x);
    const img = { x: 2 * SX - o.x, y: o.y };   // image source behind the face: the reflected arcs are centred on it
    // the incoming train runs above the row centre and the reflected one below it (they meet at the face, at
    // the centre), so each half is clipped to its own side and the two trains never cross
    const half = (up, fn) => { ctx.save(); ctx.beginPath(); ctx.rect(0, up ? row.y0 : cy, W, row.h / 2); ctx.clip(); fn(); ctx.restore(); };
    for (let j = 0; live && j < BURST && j * P <= tl; j++) {
      const r = (tl - j * P) * V;
      if (r < 18) continue;
      if (r <= D) { half(true, () => drawSoundArcs(ctx, c, { x: o.x, y: o.y, dir: din, spread: 0.4, single: true, radius: r, strength: 0.95 })); continue; }
      const past = r - D, life = clamp01(1 - past / 460), back = Math.PI - din;
      if (kind === 'hard') {
        half(false, () => drawSoundArcs(ctx, c, { x: img.x, y: img.y, dir: back, spread: 0.4, single: true, radius: r, strength: 0.95 * life }));
      } else if (kind === 'soft') {
        // into the folds, fading out; a faint return
        if (past < 70) {
          ctx.save(); ctx.beginPath(); ctx.rect(SX - 6, row.y0, 140, row.h); ctx.clip();
          half(true, () => drawSoundArcs(ctx, c, { x: o.x, y: o.y, dir: din, spread: 0.4, single: true, radius: r, strength: 0.8 * (1 - past / 70) }));
          ctx.restore();
        }
        half(false, () => drawSoundArcs(ctx, c, { x: img.x, y: img.y, dir: back, spread: 0.4, single: true, radius: r, strength: 0.16 * life }));
      } else {
        for (const [dy, dir, k] of BUMPS) {
          const bx = rockX(dy) - 4, by = cy + dy, rs = past + 10;
          if (rs > 300) continue;
          drawSoundArcs(ctx, c, { x: bx, y: by, dir, spread: 0.55, single: true, radius: rs, strength: 0.85 * k * (1 - rs / 300) });
        }
      }
    }
    if (live) {
      // which way each train runs: in (upper) and, where there is one, back (lower)
      drawPropagationArrow(ctx, c, { x: 170, y: row.y0 + 20, len: 80, angle: din });
      if (kind !== 'rough') drawPropagationArrow(ctx, c, { x: 400, y: row.y0 + row.h - 14, len: 80, angle: Math.PI - din, tone: kind === 'hard' ? 'label' : 'labelMuted' });
    }
    ctx.restore();
    // the tag sits low on the left, under the speaker, where the trains leave the row empty
    if (live) pill(ctx, c, TAGS[kind], 168, row.y0 + row.h - 24, { size: 28, display: true, bg: kind === 'hard' ? lighten(c.gold, 0.55) : c.raised });
  }

  tiles(ctx, c, row) {
    const st = mix(c.bgSurface, c.s1, 0.22), x0 = SX, x1 = W;
    const g = ctx.createLinearGradient(x0, 0, x0 + 60, 0);
    g.addColorStop(0, lighten(st, 0.3)); g.addColorStop(0.2, st); g.addColorStop(1, darken(st, 0.08));
    ctx.fillStyle = g; ctx.fillRect(x0, row.y0, x1 - x0, row.h);
    ctx.strokeStyle = alpha(darken(st, 0.3), 0.7); ctx.lineWidth = 1.5;
    for (let y = row.y0 + 30; y < row.y0 + row.h; y += 30) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    for (let x = x0 + 34; x < x1; x += 34) { ctx.beginPath(); ctx.moveTo(x, row.y0); ctx.lineTo(x, row.y0 + row.h); ctx.stroke(); }
    // glossy streaks
    ctx.save(); ctx.beginPath(); ctx.rect(x0, row.y0, x1 - x0, row.h); ctx.clip();
    ctx.strokeStyle = alpha(lighten(st, 0.85), 0.75); ctx.lineCap = 'round';
    for (const [sx, w] of [[x0 + 40, 10], [x0 + 64, 4], [x0 + 130, 8]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sx, row.y0 + row.h + 10); ctx.lineTo(sx + 70, row.y0 - 10); ctx.stroke(); }
    ctx.restore();
    // the face: a bright edge
    ctx.fillStyle = lighten(st, 0.6); ctx.fillRect(x0, row.y0, 4, row.h);
    ctx.fillStyle = alpha(darken(st, 0.4), 0.6); ctx.fillRect(x0 + 4, row.y0, 2, row.h);
  }

  curtain(ctx, c, row, tl) {
    const cl = darken(c.s6, 0.18), x0 = SX - 4, x1 = SX + 150, folds = 6, fw = (x1 - x0) / folds;
    // the wall behind
    ctx.fillStyle = mix(c.bgSurface, c.gold, 0.2); ctx.fillRect(x1, row.y0, W - x1, row.h);
    const sway = Math.sin(tl * 1.3) * 1.5;
    for (let i = 0; i < folds; i++) {
      const fx = x0 + i * fw;
      const g = ctx.createLinearGradient(fx, 0, fx + fw, 0);
      g.addColorStop(0, darken(cl, 0.35)); g.addColorStop(0.35, lighten(cl, 0.2)); g.addColorStop(0.6, cl); g.addColorStop(1, darken(cl, 0.45));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(fx, row.y0 + 12); ctx.lineTo(fx + fw + 0.5, row.y0 + 12);
      ctx.lineTo(fx + fw + 0.5 + sway * (i % 2 ? 1 : -1), row.y0 + row.h); ctx.lineTo(fx + sway * (i % 2 ? -1 : 1), row.y0 + row.h); ctx.closePath(); ctx.fill();
    }
    // heavy hem and the rod with rings
    ctx.fillStyle = darken(cl, 0.3); ctx.fillRect(x0, row.y0 + row.h - 10, x1 - x0, 10);
    const rod = mix(c.gold, c.labelMuted, 0.35);
    ctx.fillStyle = rod; rr(ctx, x0 - 8, row.y0 + 4, x1 - x0 + 16, 8, 4); ctx.fill();
    ctx.fillStyle = lighten(rod, 0.5); ctx.fillRect(x0 - 4, row.y0 + 5, x1 - x0 + 8, 2);
    ctx.strokeStyle = darken(rod, 0.3); ctx.lineWidth = 2;
    for (let i = 0; i <= folds; i++) { ctx.beginPath(); ctx.arc(x0 + i * fw, row.y0 + 10, 5, 0, TAU); ctx.stroke(); }
  }

  rock(ctx, c, row) {
    const cy = row.y0 + row.h / 2, st = mix(c.labelMuted, c.s8, 0.25);
    const pts = [];
    for (let dy = -row.h / 2; dy <= row.h / 2; dy += 8) pts.push({ x: rockX(dy), y: cy + dy });
    const face = () => { ctx.beginPath(); ctx.moveTo(W, row.y0); ctx.lineTo(pts[0].x, row.y0); for (const p of pts) ctx.lineTo(p.x, p.y); ctx.lineTo(W, row.y0 + row.h); ctx.closePath(); };
    const g = ctx.createLinearGradient(SX, 0, W, 0);
    g.addColorStop(0, lighten(st, 0.18)); g.addColorStop(0.3, st); g.addColorStop(1, darken(st, 0.25));
    ctx.fillStyle = g; face(); ctx.fill();
    // facets: lit tops, shaded undersides of each bump
    ctx.save(); face(); ctx.clip();
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], up = q.x < p.x;
      ctx.fillStyle = up ? alpha(lighten(st, 0.45), 0.5) : alpha(darken(st, 0.35), 0.45);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.lineTo(q.x + 22, q.y + 3); ctx.lineTo(p.x + 22, p.y + 3); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = alpha(darken(st, 0.45), 0.6); ctx.lineWidth = 1.5;
    for (const [x, y, l, an] of [[540, -40, 34, 0.5], [600, 10, 40, -0.4], [520, 40, 26, 0.9], [630, -60, 30, 0.2]]) {
      ctx.beginPath(); ctx.moveTo(x, cy + y); ctx.lineTo(x + Math.cos(an) * l, cy + y + Math.sin(an) * l); ctx.lineTo(x + Math.cos(an) * l + 8, cy + y + Math.sin(an) * l + 10); ctx.stroke();
    }
    ctx.restore();
    // rubble at the foot
    for (const [x, r] of [[SX - 6, 9], [SX + 10, 13], [SX - 22, 6], [SX + 30, 8]]) {
      const by = row.y0 + row.h - r * 0.7;
      const rg = ctx.createRadialGradient(x - r * 0.3, by - r * 0.3, 1, x, by, r);
      rg.addColorStop(0, lighten(st, 0.3)); rg.addColorStop(1, darken(st, 0.3));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(x, by, r, r * 0.7, 0, 0, TAU); ctx.fill();
    }
  }
}
