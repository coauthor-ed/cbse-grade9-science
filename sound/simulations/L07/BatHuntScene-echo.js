// BatHuntScene-echo.js - slide "Bats Find Prey by Echo" (blk-l07-s04, 2 beats).
// Rebuilt 2026-11-03 (whole-file rewrite; the old fire-button field is gone).
// b0 a moonlit night over layered trees. A bat flies from the left; a moth hovers ahead and a bare
//    branch reaches in from a tree on the right (the obstacle). Every BURST_P s a short burst
//    (three kit sound arcs) leaves the bat's mouth; where its front meets the branch or the moth
//    an echo (the fainter second tone) starts back, centred on that point. The bat flies on while
//    the sound travels, so each echo is aimed at, and arrives at, where the bat WILL be: every
//    hit and arrival time is solved at load from the paths below. After each moth echo arrives,
//    the bat turns toward the moth (eased 0.5 s). The loop ends with the catch (the moth hidden).
// b1 under the sea: a dolphin sends clicks from its melon; echoes come back from a fish; one tag.
// Screen sound speed is slow motion (V px/s) so a burst can be followed; nothing else is scaled.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, mulberry32, ellipse, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawBat, drawMoth, drawSeaCut, drawDolphin, drawFish } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const V = 230;                         // screen sound speed, px/s
const BAT_S = 1.3, SPEED = 52, FLAP_HZ = 2.4;
const START = { x: 92, y: 214 }, H0 = -0.16;
const BRANCH = { x: 482, y: 150 };     // the branch tip that reflects
const BURST_P = 1.0, BURST0 = 0.3;   // one burst a second: a moth echo is on its way back at almost every moment
const DT = 1 / 120;
const mothAt = (t) => ({ x: 556 + 10 * Math.sin(t * 1.3), y: 330 + 12 * Math.sin(t * 2.1 + 0.4) });
const mouthOf = (p) => ({ x: p.x + BAT_S * 37, y: p.y + BAT_S });

// ---- b0 flight, solved once (pure function of time afterwards) ---------------------------
const FLIGHT = (() => {
  const pos = [], hd = [];
  const bursts = [];                 // { te, E, dir, hits: [{ kind, P, tHit, tArr }] }
  let p = { ...START }, h = H0, turn = { from: H0, to: H0, t0: -1 }, tc = null, end = null;
  for (let i = 0; i < 4000; i++) {
    const t = i * DT;
    // heading: eased turn toward the moth after the latest moth echo
    const k = turn.t0 < 0 ? 1 : inOutSine(clamp01((t - turn.t0) / 0.5));
    h = turn.from + (turn.to - turn.from) * k;
    pos.push({ ...p }); hd.push(h);
    const m = mothAt(t), mo = mouthOf(p);
    // new burst
    if (tc === null && t >= BURST0 + bursts.length * BURST_P) bursts.push({ te: t, E: mo, dir: h, hits: [
      { kind: 'branch', P: null, tHit: null, tArr: null }, { kind: 'moth', P: null, tHit: null, tArr: null }] });
    for (const b of bursts) for (const hit of b.hits) {
      const tgt = hit.kind === 'moth' ? m : BRANCH;
      if (hit.tHit === null && Math.hypot(tgt.x - b.E.x, tgt.y - b.E.y) <= V * (t - b.te)) { hit.tHit = t; hit.P = { ...tgt }; }
      else if (hit.tHit !== null && hit.tArr === null && Math.hypot(mo.x - hit.P.x, mo.y - hit.P.y) <= V * (t - hit.tHit)) {
        hit.tArr = t; hit.A = { ...mo };
        if (hit.kind === 'moth' && tc === null) {
          const to = Math.atan2(m.y - mo.y, m.x - mo.x);
          turn = { from: h, to, t0: t };
        }
      }
    }
    if (tc === null && Math.hypot(m.x - mo.x, m.y - mo.y) < 26) tc = t;
    if (tc !== null && t >= tc + 1.5) { end = t; break; }
    if (t > 30) { end = t; break; }
    p = { x: p.x + Math.cos(h) * SPEED * DT, y: p.y + Math.sin(h) * SPEED * DT };
  }
  return { pos, hd, bursts, tc, end };
})();
const LOOP0 = FLIGHT.end;

const STARS = (() => {
  const r = mulberry32(7301), out = [];
  for (let i = 0; i < 80; i++) out.push({ x: r() * 680, y: r() * 300, s: 0.5 + r() * 1.5, p: r() * TAU });
  return out;
})();
const RIDGE = (() => {
  const r = mulberry32(5150), far = [], near = [];
  for (let x = -40; x <= 720; x += 22) far.push({ x, y: 382 - 26 * Math.sin(x * 0.011 + 1.2) - 10 * Math.sin(x * 0.037) - r() * 6 });
  for (let x = -40; x < 740; x += 46 + r() * 30) near.push({ x, h: 70 + r() * 70, w: 46 + r() * 24, lean: (r() - 0.5) * 0.2 });
  return { far, near };
})();
const SCHOOL = [{ dx: 0, dy: 0, s: 1.35, ph: 0 }, { dx: 70, dy: -58, s: 1.0, ph: 0.35 }, { dx: 84, dy: 52, s: 0.95, ph: 0.7 }];

export class BatHuntScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static CONTINUOUS = true;          // b0 the hunt loops (ending each time with the catch); b1 the clicks repeat
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A bat flies through a moonlit night over trees, with a moth ahead and a bare branch reaching in. '
    + 'Short bursts of sound leave the bat\'s mouth; fainter echoes come back from the branch and from the moth to '
    + 'where the bat has flown. After each echo from the moth the bat turns toward it, and at the end it catches the '
    + 'moth. Then, under the sea, a dolphin sends clicks from its forehead and echoes come back from a fish: echolocation.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = Math.max(0, Math.min(1, stage | 0)); }
  busy() { return true; }
  /** Scene time (one method, so a probe can pin a frame). */
  t() { return this.age; }

  draw(ctx, c) {
    if (this.cur === 0) this.hunt(ctx, c, this.t() % LOOP0);
    else this.sea(ctx, c, this.t());
  }

  // ---- b0 ---------------------------------------------------------------------------------
  hunt(ctx, c, t) {
    this.night(ctx, c, t);
    const i = Math.min(FLIGHT.pos.length - 1, Math.round(t / DT));
    const p = FLIGHT.pos[i], h = FLIGHT.hd[i];
    const caught = FLIGHT.tc !== null && t >= FLIGHT.tc;
    // the moth (hidden at the catch: a quick shrink into the bat's mouth)
    const m = mothAt(t);
    const gone = FLIGHT.tc === null ? 0 : clamp01((t - FLIGHT.tc) / 0.18);
    if (gone < 1) {
      ctx.save(); ctx.globalAlpha = 1 - gone;
      drawMoth(ctx, c, { x: m.x, y: m.y, s: 0.95 * (1 - 0.6 * gone), dir: -1, angle: 0.25, flap: t * 7 });
      ctx.restore();
    }
    // sound: bursts out (tone 1), echoes back (tone 2), each a packet of three single arcs
    let echoTag = null;
    for (const b of FLIGHT.bursts) {
      const r = V * (t - b.te);
      if (r > 0 && r < 560) {
        for (let k = 0; k < 3; k++) {
          const rk = r - k * 11;
          if (rk < 14) continue;
          drawSoundArcs(ctx, c, { x: b.E.x, y: b.E.y, dir: b.dir + 0.12, spread: 1.15, single: true, radius: rk, strength: (1 - k * 0.3) * clamp01(1 - rk / 540) });
        }
      }
      for (const hit of b.hits) {
        if (hit.tHit === null || t < hit.tHit || (hit.tArr !== null && t > hit.tArr)) continue;
        const A = hit.A ?? mouthOf(p);
        const re = V * (t - hit.tHit), dir = Math.atan2(A.y - hit.P.y, A.x - hit.P.x);
        for (let k = 0; k < 3; k++) {
          const rk = re - k * 11;
          if (rk < 10) continue;
          drawSoundArcs(ctx, c, { x: hit.P.x, y: hit.P.y, dir, spread: 0.8, single: true, radius: rk, tone: 2, strength: 0.78 * (1 - k * 0.3) });
        }
        if (hit.kind === 'moth' && re > 110) echoTag = { x: hit.P.x + Math.cos(dir) * re - Math.sin(dir) * 52, y: hit.P.y + Math.sin(dir) * re + Math.cos(dir) * 52 };
      }
    }
    // the bat, tilted a little with its heading
    // wingbeat kept in the upper half (phase 0 = wings up .. 0.34): the fully lowered wing reads weakly
    const flap = 0.11 * (1 - Math.cos(TAU * FLAP_HZ * t));   // 0..0.22: the wings stay spread (no folded dart frame)
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(Math.max(-0.3, Math.min(0.3, h)) * 0.6); ctx.translate(-p.x, -p.y);
    drawBat(ctx, c, { x: p.x, y: p.y + 4 * Math.cos(TAU * FLAP_HZ * t), s: BAT_S, dir: 1, flap });
    ctx.restore();
    // tags: prey and obstacle sit by their things; echo rides under the moth's echo
    if (!caught) pill(ctx, c, 'prey', m.x + 6, m.y + 64, { ...LBL, bg: c.raised, ink: c.label });
    pill(ctx, c, 'obstacle', BRANCH.x - 10, BRANCH.y - 64, { ...LBL, bg: c.raised, ink: c.label });
    if (echoTag) pill(ctx, c, 'echo', echoTag.x, echoTag.y, { ...LBL, bg: c.s2 });
    // loop seam: a short dark veil
    const veil = Math.max(clamp01(1 - t / 0.35), clamp01((t - (LOOP0 - 0.35)) / 0.35));
    if (veil > 0) { ctx.fillStyle = alpha(darken(c.water, 0.9), veil * 0.85); ctx.fillRect(0, 0, 680, 520); }
  }

  night(ctx, c, t) {
    const sky = darken(mix(c.s4, c.water, 0.55), 0.82), low = darken(mix(c.s4, c.water, 0.3), 0.55);
    const g = ctx.createLinearGradient(0, 0, 0, 400);
    g.addColorStop(0, sky); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    const starCol = lighten(c.water, 0.92);
    for (const s of STARS) {
      ctx.fillStyle = alpha(starCol, 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(s.p + t * 0.9)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
    }
    // a crescent moon high on the left, behind a thin cloud bank
    const mx = 250, my = 70, mr = 30, moon = lighten(mix(c.warning, c.s4, 0.1), 0.78);
    const hg = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 3.4);
    hg.addColorStop(0, alpha(moon, 0.3)); hg.addColorStop(1, alpha(moon, 0));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(mx, my, mr * 3.4, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.clip();
    const mg = ctx.createRadialGradient(mx - 12, my + 6, 4, mx, my, mr);
    mg.addColorStop(0, lighten(moon, 0.4)); mg.addColorStop(1, darken(moon, 0.06));
    ctx.fillStyle = mg; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    ctx.fillStyle = mix(sky, low, my / 400); ctx.beginPath(); ctx.arc(mx + 14, my - 8, mr * 0.88, 0, TAU); ctx.fill();
    ctx.restore();
    for (const [x, y, rx] of [[200, 92, 90], [330, 84, 70], [470, 60, 110]]) {
      ellipse(ctx, x + (t * 2) % 40, y, rx, 7, 0); ctx.fillStyle = alpha(lighten(sky, 0.25), 0.35); ctx.fill();
    }
    // far ridge, lit edge toward the moon
    const ridge = darken(mix(c.setGround, c.s4, 0.4), 0.62);
    ctx.beginPath(); ctx.moveTo(-40, 520);
    for (const q of RIDGE.far) ctx.lineTo(q.x, q.y);
    ctx.lineTo(720, 520); ctx.closePath(); ctx.fillStyle = ridge; ctx.fill();
    ctx.strokeStyle = alpha(lighten(c.water, 0.6), 0.28); ctx.lineWidth = 2;
    ctx.beginPath(); RIDGE.far.forEach((q, j) => (j ? ctx.lineTo(q.x, q.y + 1) : ctx.moveTo(q.x, q.y + 1))); ctx.stroke();
    // near treeline: pointed crowns (layered tiers), a moonlit left flank on each
    const tree = darken(mix(c.setGround, c.water, 0.3), 0.8), flank = alpha(lighten(mix(c.setGround, c.water, 0.5), 0.15), 0.32);
    for (const tr of RIDGE.near) {
      const base = 470, top = base - tr.h;
      for (let k = 0; k < 3; k++) {
        const ty = top + k * tr.h * 0.24, wk = tr.w * (0.55 + k * 0.22), by = ty + tr.h * 0.42;
        const tri = () => { ctx.beginPath(); ctx.moveTo(tr.x + tr.lean * 20, ty); ctx.quadraticCurveTo(tr.x - wk * 0.35, by - 10, tr.x - wk / 2, by); ctx.lineTo(tr.x + wk / 2, by); ctx.quadraticCurveTo(tr.x + wk * 0.35, by - 10, tr.x + tr.lean * 20, ty); ctx.closePath(); };
        tri(); ctx.fillStyle = tree; ctx.fill();
        ctx.save(); tri(); ctx.clip(); ctx.fillStyle = flank; ctx.fillRect(tr.x - wk, ty, wk * 0.85, by - ty); ctx.restore();
      }
    }
    ctx.fillStyle = darken(tree, 0.2); ctx.fillRect(0, 466, 680, 54);
    this.bigTree(ctx, c, tree);
  }

  // the tree on the right whose bare branch reaches toward the bat's path (the obstacle)
  bigTree(ctx, c, tree) {
    const bark = darken(mix(c.setGround, c.labelMuted, 0.4), 0.55), lit = alpha(lighten(c.water, 0.65), 0.35);
    const limb = (pts, w0, w1) => {
      for (let j = 0; j < pts.length - 1; j++) {
        const u = j / (pts.length - 1);
        ctx.strokeStyle = bark; ctx.lineCap = 'round'; ctx.lineWidth = w0 + (w1 - w0) * u;
        ctx.beginPath(); ctx.moveTo(pts[j].x, pts[j].y); ctx.lineTo(pts[j + 1].x, pts[j + 1].y); ctx.stroke();
      }
      ctx.strokeStyle = lit; ctx.lineWidth = 2;
      ctx.beginPath(); pts.forEach((q, j) => (j ? ctx.lineTo(q.x - 1, q.y - w0 * 0.3 * (1 - j / pts.length)) : ctx.moveTo(q.x - 1, q.y - w0 * 0.3))); ctx.stroke();
    };
    // trunk
    ctx.beginPath(); ctx.moveTo(612, 520); ctx.quadraticCurveTo(622, 330, 640, 120); ctx.lineTo(690, 120); ctx.lineTo(690, 520); ctx.closePath();
    ctx.fillStyle = bark; ctx.fill();
    ctx.strokeStyle = lit; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(614, 518); ctx.quadraticCurveTo(624, 330, 642, 120); ctx.stroke();
    for (let y = 160; y < 500; y += 38) { ctx.strokeStyle = alpha(darken(bark, 0.4), 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(630 + (y % 3) * 4, y); ctx.lineTo(660, y + 10); ctx.stroke(); }
    // the bare branch and its twigs
    limb([{ x: 632, y: 214 }, { x: 590, y: 190 }, { x: 540, y: 172 }, { x: BRANCH.x, y: BRANCH.y }], 18, 5);
    limb([{ x: 560, y: 178 }, { x: 538, y: 140 }, { x: 526, y: 120 }], 6, 2.5);
    limb([{ x: 512, y: 162 }, { x: 494, y: 176 }, { x: 476, y: 182 }], 5, 2);
    limb([{ x: 600, y: 196 }, { x: 590, y: 232 }, { x: 572, y: 250 }], 7, 2.5);
    // a dark canopy mass above, off the top
    for (const [x, y, r] of [[650, 40, 70], [600, 20, 54], [560, 60, 40], [680, 110, 60]]) {
      ctx.fillStyle = tree; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = alpha(lighten(c.water, 0.55), 0.18);
    for (const [x, y, r] of [[546, 52, 26], [590, 12, 30]]) { ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.8, Math.PI * 1.5); ctx.lineTo(x, y); ctx.fill(); }
  }

  // ---- b1 ---------------------------------------------------------------------------------
  sea(ctx, c, t) {
    const sea = drawSeaCut(ctx, c, { y: 36, bottom: 520, t, bed: (u) => 0.86 + 0.05 * Math.sin(u * 6 + 1) });
    const bob = 6 * Math.sin(t * 1.1);
    const dol = drawDolphin(ctx, c, { x: 196, y: 262 + bob, s: 1.4, dir: 1, swim: (t * 1.1) % 1 });
    const fx = 590 + 8 * Math.sin(t * 0.9), fy = 270 + 6 * Math.sin(t * 1.4);
    for (const f of SCHOOL) drawFish(ctx, c, { x: fx + f.dx, y: fy + f.dy, s: f.s, dir: -1, swim: (t * 2 + f.ph) % 1, tone: 7 });
    // clicks: a packet every P s from the melon; the echo from the nearest fish comes back
    // a click every P s (shorter than the trip), so at any moment clicks are leaving the melon AND an echo is coming back
    const P = 1.3, VD = 150, M = dol.melon, F = { x: fx - 66, y: fy };
    const d = Math.hypot(F.x - M.x, F.y - M.y);
    let echoTag = null;
    for (let n = 0; n < 4; n++) {
      const tp = ((t - 0.3) % P + P) % P + n * P;
      if (t - 0.3 < n * P) continue;
      const r = VD * tp;
      for (let k = 0; k < 3; k++) {
        const rk = r - k * 10;
        if (rk > 12 && rk < d + 90) drawSoundArcs(ctx, c, { x: M.x, y: M.y, dir: Math.atan2(F.y - M.y, F.x - M.x), spread: 0.9, single: true, radius: rk, strength: (1 - k * 0.3) * clamp01((d + 90 - rk) / 90) });
        const re = rk - d;
        const de = Math.atan2(M.y - F.y, M.x - F.x);
        if (re > 8 && re < d) drawSoundArcs(ctx, c, { x: F.x, y: F.y, dir: de, spread: 0.75, single: true, radius: re, tone: 2, strength: 0.78 * (1 - k * 0.3) });
        if (k === 0 && re > 50 && re < d - 40) echoTag = { x: F.x + Math.cos(de) * re, y: F.y + 92 };
      }
    }
    if (echoTag) pill(ctx, c, 'echo', echoTag.x, echoTag.y, { ...LBL, bg: c.s2 });
    const k = clamp01((t - 0.6) / 0.4);
    if (k > 0) pill(ctx, c, 'echolocation', 340, 432, { ...LBL, bg: c.accent, ink: c.bgSurface, alpha: k });
    return sea;
  }
}
