// BalanceKit.js - the digital balance and the flask-and-balloon rig of lesson 2.
// Pure drawing: the scene owns time and passes a run time t. Bubbles, wisps and the pour are seeded,
// so a resumed beat draws what a walked-through beat draws. No face on the balloon: it is evidence.
import { alpha, darken, lighten, luma, mix, font, rr, ellipse, clamp01, lerp, drawShadow } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { ease, hash2 } from 'simulations/base/kit/SimAnim.js';

const TAU = Math.PI * 2;
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
const sm = (a, b, t) => ease.smooth(seg(t, a, b));

/**
 * A digital bench balance, (x, y) the bench under its centre. text: the display; tone: 'live' | 'good' | 'bad' | 'idle'.
 * o: { w = 300 }. Returns the y of the pan's top surface.
 */
export function drawDigitalBalance(ctx, c, x, y, text, tone = 'live', o = {}) {
  const w = o.w ?? 300, hw = w / 2, pan = y - 74;
  const dark = luma(c.bgDeep) < 0.5;
  const body = mix(c.bgSurface, c.label, dark ? 0.14 : 0.05);
  const metal = mix(c.glass, c.label, dark ? 0.25 : 0.45);
  drawShadow(ctx, c, x, y, hw * 1.04, 8);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = darken(body, 0.3);
  rr(ctx, -hw + 16, -10, 34, 10, 3); ctx.fill();
  rr(ctx, hw - 50, -10, 34, 10, 3); ctx.fill();
  rr(ctx, -hw, -56, w, 50, 12); ctx.fillStyle = darken(body, 0.22); ctx.fill();
  rr(ctx, -hw, -62, w, 50, 12); ctx.fillStyle = body; ctx.fill();
  ctx.strokeStyle = c.stroke; ctx.lineWidth = 2.5; ctx.stroke();
  rr(ctx, -hw + 10, -74 + 3, w - 20, 10, 5); ctx.fillStyle = darken(metal, 0.3); ctx.fill();
  rr(ctx, -hw + 10, -74, w - 20, 9, 4.5); ctx.fillStyle = metal; ctx.fill();
  const scrW = Math.min(w - 90, 196);
  const screen = darken(mix(c.bgDeep, c.label, dark ? 0 : 0.85), 0.5);
  rr(ctx, -scrW / 2, -58, scrW, 42, 8); ctx.fillStyle = screen; ctx.fill();
  ctx.strokeStyle = c.stroke; ctx.lineWidth = 2.5; ctx.stroke();
  const ink = tone === 'bad' ? lighten(c.bad, 0.2) : tone === 'good' ? lighten(c.good, 0.15) : tone === 'idle' ? mix(lighten(c.s3, 0.3), screen, 0.45) : lighten(c.s3, 0.35);
  ctx.font = font(c, 800, 32, true);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -36);
  ctx.restore();
  return pan;
}

// ---- the flask and balloon, in rig units: (0, 0) is the middle of the pan top --------------

const FLASK = { x: -96, w: 136, h: 170 };
const FCX = FLASK.x + FLASK.w / 2;
const MOUTH = { x: FCX, y: -FLASK.h };
const REST = { x: 62, y: -13 };
const POUR = { x: FCX + 2, y: MOUTH.y - 28 };

/** How long a run takes (s). */
export const RUN_S = { sealed: 6.6, open: 6.6 };

function fizzAt(mode, t) {
  return sm(1.5, 2.1, t) * (1 - sm(3.8, 6.2, t));
}

function looseBalloon(t) {
  const up = ease.inOutCubic(seg(t, 0, 0.7)), down = ease.inOutCubic(seg(t, 1.7, 2.4));
  const k = up * (1 - down);
  const tip = ease.inOutCubic(seg(t, 0.5, 0.85)) * (1 - ease.inOutCubic(seg(t, 1.45, 1.75)));
  return { x: lerp(REST.x, POUR.x, k), y: lerp(REST.y, POUR.y, k) - Math.sin(Math.PI * k) * 30, a: lerp(0, -Math.PI / 2, tip), r: lerp(14, 12, seg(t, 0.9, 1.6)), limp: 1, full: t < 0.95 };
}

function sealedBalloon(t) {
  const lift = ease.inOutCubic(seg(t, 0, 0.8)), grow = ease.inOutCubic(seg(t, 1.6, 4.6));
  return { x: MOUTH.x, y: MOUTH.y - 4, a: lerp(0.75, -Math.PI / 2, lift), r: lerp(14, 46, grow), limp: 1 - grow, full: t < 1.1 };
}

function balloon(ctx, c, b, sealed) {
  const col = c.s1;
  const along = b.r * (1.08 + 0.55 * b.limp), across = b.r, neck = 8 + 3 * b.limp;
  const ux = Math.cos(b.a), uy = Math.sin(b.a);
  const cx = b.x + ux * (neck + along), cy = b.y + uy * (neck + along);
  ctx.save();
  ctx.fillStyle = darken(col, 0.12);
  ctx.beginPath();
  ctx.moveTo(b.x - uy * 6, b.y + ux * 6);
  ctx.lineTo(b.x + ux * (neck + 4) - uy * 9, b.y + uy * (neck + 4) + ux * 9);
  ctx.lineTo(b.x + ux * (neck + 4) + uy * 9, b.y + uy * (neck + 4) - ux * 9);
  ctx.lineTo(b.x + uy * 6, b.y - ux * 6);
  ctx.closePath(); ctx.fill();
  ellipse(ctx, cx, cy, along, across, b.a); ctx.fillStyle = col; ctx.fill();
  ctx.save(); ctx.clip();
  ellipse(ctx, cx + across * 0.3, cy + across * 0.34, along, across, b.a); ctx.fillStyle = darken(col, 0.2); ctx.fill();
  ellipse(ctx, cx - across * 0.08, cy - across * 0.1, along * 0.92, across * 0.9, b.a); ctx.fillStyle = col; ctx.fill();
  ctx.restore();
  ellipse(ctx, cx, cy, along, across, b.a); ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = 3; ctx.stroke();
  ellipse(ctx, cx - across * 0.35, cy - across * 0.4, across * 0.24, across * 0.13, -0.6);
  ctx.fillStyle = alpha(lighten(col, 0.85), 0.75); ctx.fill();
  if (b.full) {
    ellipse(ctx, cx + ux * along * 0.25, cy + uy * along * 0.25 + 2, along * 0.5, across * 0.5, b.a);
    ctx.fillStyle = alpha(mix(c.label, col, 0.5), luma(c.bgDeep) < 0.5 ? 0.55 : 0.25); ctx.fill();
  }
  if (sealed) {
    rr(ctx, MOUTH.x - 24, MOUTH.y - 8, 48, 15, 6); ctx.fillStyle = darken(col, 0.35); ctx.fill();
  }
  ctx.restore();
}

/** The flask, the vinegar, the fizz and the balloon. mode: 'sealed' | 'open'; t: run time (s), 0 before it starts. */
export function drawFlaskRig(ctx, c, mode, t) {
  const fizz = t > 0 ? fizzAt(mode, t) : 0;
  const g = glassBox('flask', FLASK.x, -FLASK.h, FLASK.w, FLASK.h, { neck: 0.3, wall: 5 });
  const vinegar = luma(c.bgDeep) < 0.5 ? mix(c.s2, c.glass, 0.45) : mix(c.s2, c.bgSurface, 0.4);
  drawGlass(ctx, c, g);
  const sy = drawGlassLiquid(ctx, c, g, { level: 0.34 + fizz * 0.1, fill: vinegar, opacity: 0.82 });
  if (sy != null && t > 0) {
    const RATE = 34, depth = g.floor - sy;
    const n0 = Math.max(0, Math.floor((t - 2.5) * RATE)), n1 = Math.floor(t * RATE);
    for (let i = n0; i <= n1; i++) {
      const ti = i / RATE;
      if (hash2(i, 3) > fizzAt(mode, ti)) continue;
      const y = g.floor - 6 - (t - ti) * (40 + 34 * hash2(i, 4));
      if (y < sy + 3 || y > g.floor) continue;
      const half = (g.inner.w / 2) * (0.55 - 0.3 * ((g.floor - y) / Math.max(1, depth)));
      ctx.beginPath(); ctx.arc(FCX + (hash2(i, 5) * 2 - 1) * half, y, 2 + 2.8 * hash2(i, 6), 0, TAU);
      ctx.fillStyle = alpha(lighten(vinegar, 0.75), 0.9); ctx.fill();
    }
    if (fizz > 0.05) {
      const foam = lighten(vinegar, 0.8);
      for (let i = 0; i < 9; i++) {
        const r = (4 + 3 * hash2(i, 9)) * fizz;
        ctx.beginPath(); ctx.arc(FCX - 36 + i * 9, sy - r * 0.3, r, 0, TAU);
        ctx.fillStyle = alpha(foam, 0.9); ctx.fill();
      }
    }
  }
  // the soda falling
  const t0 = mode === 'open' ? 0.85 : 0.65;
  if (t > t0 && t < t0 + 1.2) {
    const from = mode === 'open' ? POUR : { x: MOUTH.x, y: MOUTH.y - 6 };
    ctx.fillStyle = mix(c.label, c.bgDeep, luma(c.bgDeep) < 0.5 ? 0.08 : 0.92);
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const u = seg(t, t0 + i * 0.04, t0 + i * 0.04 + 0.45);
      if (u <= 0 || u >= 1) continue;
      ctx.beginPath(); ctx.arc(from.x + (hash2(i, 1) - 0.5) * 10, lerp(from.y, sy ?? -40, u * u), 2.8, 0, TAU);
      ctx.fill(); ctx.stroke();
    }
  }
  drawGlassFront(ctx, c, g, { shade: 0.12 });
  // gas: out of the open mouth and away
  if (mode === 'open' && t > 0) {
    const RATE = 10, LIFE = 2.4;
    const n0 = Math.max(0, Math.floor((t - LIFE) * RATE)), n1 = Math.floor(t * RATE);
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = mix(c.labelMuted, c.glass, 0.4); ctx.lineWidth = 3.5;
    for (let i = n0; i <= n1; i++) {
      const ti = i / RATE, age = t - ti;
      if (hash2(i, 7) > fizzAt(mode, ti)) continue;
      ctx.globalAlpha = 0.9 * (1 - age / LIFE);
      const x = MOUTH.x + (hash2(i, 8) - 0.3) * 12 + age * (16 + 22 * hash2(i, 9)) + Math.sin(age * 3 + i) * 5;
      ctx.beginPath(); ctx.arc(x, MOUTH.y - 6 - age * 52, 6, age * 5, age * 5 + Math.PI * 1.3); ctx.stroke();
    }
    ctx.restore();
  }
  if (mode === 'sealed') balloon(ctx, c, sealedBalloon(t), true);
  else balloon(ctx, c, t > 0 ? looseBalloon(t) : { x: REST.x, y: REST.y, a: 0, r: 14, limp: 1, full: true }, false);
}

/** The display value at run time t. */
export function massAt(mode, t, m0, m1) {
  if (mode === 'sealed') return m0;
  return lerp(m0, m1, ease.inOutCubic(seg(t, 2.2, 5.6)));
}
