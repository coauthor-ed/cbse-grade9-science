// CliffEchoRig.js - the shared flat-vector rig for this lesson's cliff scenes.
//
// It is a set of PURE FUNCTIONS, not a class and not a base class: no state, no
// timer, no beat map, no import of any scene. Each scene imports only the few
// pieces it draws, so a panel that wants a night field and no ear marker never
// gets one, and L07's bat/sea panels (which need neither a cliff nor a shouter)
// build standalone.
//
// The pieces, all in the same house style so the learner meets one person and
// one chip across every mount of the lesson:
//   drawGroundLine  a ground line to stand on
//   drawRockFace    a bare hatched rock block, nobody on it
//   drawHardWall    a plain hard vertical wall (plaster, optional window)
//   drawShouter     the figure, via the kit's drawFigure, with mouth/ear anchors
//   drawSoundChip   the outgoing/returning chip - SAME shape, colour and size
//   drawEarMarker   the marker that lights when a return arrives
//   drawNormalLine  a dashed line perpendicular to a face
//   gapSeconds      the round-trip time for a one-way distance (340 m/s)
//
// Colours come only from `c` (the scene's resolved tokens) and mix/alpha/
// lighten/darken of them. No hex, no text, no new --sim-* token.

import { mix, alpha, lighten, darken, rr, ellipse, drawShadow } from 'simulations/base/kit/SimLook.js';
import { drawFigure } from 'simulations/base/kit/SimFigure.js';

/** Speed of sound, the course convention (m/s). Used only for arithmetic, never printed. */
export const SOUND_SPEED = 340;

/** Round-trip seconds for a ONE-WAY distance in metres - out to the surface and
 *  back to the ears. Halving it is the lesson's prose, never this file's job. */
export function gapSeconds(distanceM) {
  return (2 * distanceM) / SOUND_SPEED;
}

/** One colour for every chip in the lesson, so an outgoing and a returning
 *  chip are visibly the same shout and not two voices. */
export function shoutCol(c) {
  return mix(c.accent, c.gold, 0.3);
}

// -- the ground -------------------------------------------------------------------

/** A ground line to stand on: a lit lip with a flat band under it. */
export function drawGroundLine(ctx, c, x0, x1, y, o = {}) {
  const h = o.h ?? 13;
  const col = o.col ?? mix(c.stroke, c.bgSurface, 0.2);
  ctx.fillStyle = col;
  ctx.fillRect(x0, y, x1 - x0, h);
  ctx.fillStyle = alpha(o.lip ?? c.label, 0.45);
  ctx.fillRect(x0, y - 2, x1 - x0, 2);
  ctx.fillStyle = alpha(darken(col, 0.4), 0.5);
  ctx.fillRect(x0, y + h - 2, x1 - x0, 2);
}

// -- the surfaces -----------------------------------------------------------------

/** A bare rock face: a flat block of stone with a hatched reflecting face on its
 *  left (the side a shouter stands on). Nobody on it, nothing growing on it, no
 *  expression - it is rock. Returns the rect so a scene can aim a chip at it. */
export function drawRockFace(ctx, c, x, y, o = {}) {
  const w = o.w ?? 54;
  const h = o.h ?? 150;
  const x0 = x - w / 2;
  const stone = mix(c.stroke, c.bgSurface, 0.34);
  const face = darken(stone, 0.16);
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0, y - h);
  ctx.lineTo(x0 + w * 0.34, y - h - 11);          // a broken top, not a box
  ctx.lineTo(x0 + w * 0.72, y - h + 5);
  ctx.lineTo(x0 + w, y - h + 9);
  ctx.lineTo(x0 + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = face;                              // the shaded near face
  ctx.fillRect(x0, y - h, w * 0.3, h);
  ctx.strokeStyle = alpha(c.label, 0.16);           // hatched stone
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 7; i += 1) {
    const hy = y - h + (h * i) / 7;
    ctx.moveTo(x0 + 3, hy);
    ctx.lineTo(x0 + w * 0.28 - 2, hy + 10);
  }
  ctx.stroke();
  ctx.strokeStyle = alpha(c.label, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();                                  // the reflecting edge itself
  ctx.moveTo(x0, y);
  ctx.lineTo(x0, y - h);
  ctx.stroke();
  return { x: x0, y: y - h, w, h, faceX: x0, top: y - h, groundY: y };
}

/** A plain hard wall: smooth hard plaster, vertical, its reflecting face on the
 *  left. Deliberately hard and bare - a soft bedroom would answer the lesson
 *  wrongly. `courses: true` adds masonry lines for a panel whose wall is meant to
 *  read as built; plain plaster is the default, so a bedroom wall stays plain. */
export function drawHardWall(ctx, c, x, y, o = {}) {
  const w = o.w ?? 28;
  const h = o.h ?? 140;
  const x0 = x - w / 2;
  const plaster = mix(c.raised, c.label, o.tone ?? 0.16);
  ctx.fillStyle = plaster;
  ctx.fillRect(x0, y - h, w, h);
  ctx.fillStyle = darken(plaster, 0.22);
  ctx.fillRect(x0, y - h, w * 0.34, h);
  ctx.fillStyle = lighten(plaster, 0.28);           // lit top edge
  ctx.fillRect(x0, y - h - 3, w, 3);
  if (o.courses === true) {                          // opt-in: a scene asks for built masonry
    ctx.strokeStyle = alpha(darken(plaster, 0.3), 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const step = h / Math.max(3, Math.round(h / 46));
    for (let cy = y - step; cy > y - h; cy -= step) {
      ctx.moveTo(x0 + 1, cy);
      ctx.lineTo(x0 + w - 1, cy);
    }
    ctx.stroke();
  }
  if (o.window) {
    const ww = w * 0.62, wh = ww * 0.8;
    const wx = x0 + (w - ww) / 2, wy = y - h * 0.62;
    ctx.fillStyle = mix(c.water, c.bgSurface, 0.3);
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = alpha(darken(plaster, 0.45), 0.9);
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, ww, wh);
  }
  ctx.strokeStyle = alpha(c.label, 0.5);            // the reflecting edge
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0, y - h);
  ctx.stroke();
  return { x: x0, y: y - h, w, h, faceX: x0, top: y - h, groundY: y };
}

// -- the person -------------------------------------------------------------------

/** The shouter/listener: the kit's figure, standing, hands together in front, and
 *  the two anchors a scene needs - `mouth` where a chip leaves, `ear` where a
 *  return lights. Anchors hang off the figure's own solved head, so they cannot
 *  drift onto the face when the pose changes. */
export function drawShouter(ctx, c, x, groundY, o = {}) {
  const h = o.height ?? 96;
  const f = o.facing ?? 1;
  const handX = x + f * h * 0.26;
  const sk = drawFigure(ctx, c, {
    x, y: groundY, height: h, facing: f, build: o.build ?? 'adult',
    pose: o.pose ?? 'stand',
    hands: o.hands ?? [
      { x: handX, y: groundY - h * 0.6 },
      { x: handX + f * h * 0.05, y: groundY - h * 0.55 },
    ],
  }, {
    top: o.top ?? c.s3, bottom: o.bottom ?? c.s6, skin: o.skin ?? 2,
    hair: o.hair ?? 1, hairStyle: o.hairStyle ?? 'short',
    mood: o.mood ?? 'smile', t: o.t ?? 0,
  }, { noShadow: true });
  if (o.shadow !== false) drawShadow(ctx, c, x, groundY + 4, h * 0.26);
  const hd = sk.anchors.head;
  return {
    x, groundY, height: h, head: hd,
    mouth: { x: hd.x + f * hd.r * 0.92, y: hd.y + hd.r * 0.2 },
    ear: { x: hd.x - f * hd.r * 0.56, y: hd.y + hd.r * 0.1 },
    top: hd.y - hd.r,
  };
}

// -- the chip and the ear ---------------------------------------------------------

/** The travelling chip. `k` (0..1) shrinks and fades it, for a return that has
 *  spread over a long way - the outgoing and the returning chip are otherwise
 *  the same shape in the same colour, because it is the same shout. */
export function drawSoundChip(ctx, c, x, y, o = {}) {
  const k = o.k ?? 1;
  const rw = 20 * k, rh = 12 * k;
  const col = o.col ?? shoutCol(c);
  ctx.save();
  ctx.globalAlpha *= Math.max(0.12, Math.min(1, k));
  ctx.fillStyle = darken(col, 0.3);
  rr(ctx, x - rw, y - rh + 3, rw * 2, rh * 2, rh);
  ctx.fill();
  ctx.fillStyle = col;
  rr(ctx, x - rw, y - rh, rw * 2, rh * 2 - 3, rh);
  ctx.fill();
  ctx.fillStyle = alpha(lighten(col, 0.5), 0.9);
  rr(ctx, x - rw * 0.62, y - rh * 0.5, rw * 1.24, rh * 0.42, rh * 0.2);
  ctx.fill();
  ctx.restore();
  return { x, y, r: rw };
}

/** The marker on the ear. Unlit it is a small grey cup; on arrival it lights and
 *  a ring runs out of it. `lit` is false, or 0..1 and counting up (values over 1
 *  mean the ring has finished and only the lit colour stays). */
export function drawEarMarker(ctx, c, x, y, o = {}) {
  const lit = o.lit ?? false;
  const on = lit !== false && lit !== 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.22);
  ctx.fillStyle = on ? c.good : mix(c.raised, c.label, 0.32);
  ellipse(ctx, 0, 0, 8.5, 12.5, 0);
  ctx.fill();
  ctx.strokeStyle = on ? lighten(c.good, 0.4) : alpha(c.label, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1, 1, 3.6, 5.8, 0, 0.4, Math.PI * 1.7);
  ctx.stroke();
  if (on && lit !== true) {
    ctx.strokeStyle = alpha(c.good, 0.75 * Math.max(0, 1 - lit));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 15 + lit * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** The dashed normal: straight at right angles to a vertical face, which is the
 *  one line the law of reflection is measured against. */
export function drawNormalLine(ctx, c, x, y0, y1, o = {}) {
  ctx.save();
  ctx.strokeStyle = o.col ?? alpha(c.label, 0.55);
  ctx.lineWidth = 2;
  ctx.setLineDash(o.dash ?? [7, 6]);
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
  ctx.restore();
}
