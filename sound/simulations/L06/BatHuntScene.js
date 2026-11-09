// BatHuntScene.js - one wide night panel: a bat flies across it, wavefronts leave it,
// come back off a moth, and the path kinks exactly where a return lands.
//
// Four beats: 0 the hunt in the dark  1 the lamp beat (lit, wandering)  2 the round trip
// held slow, each part picked out in turn  3 the lit closing hold.
// The only control is the lamp; the pulses fire themselves as part of the flight.
//
// Nothing numeric and no method name is drawn on the panel - that is the next lesson's.
// The drawing helpers (field, bat, moth, pulse arc) are exported as BatFieldKit so the
// L07 variant imports the same animals instead of drawing its own.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, luma, rr, ellipse, mulberry32,
  drawBackdrop, drawSpotlight,
} from 'simulations/base/kit/SimLook.js';

// ---------------------------------------------------------------- the panel's geometry
export const PANEL = { x: 20, y: 84, w: 640, h: 352 };
export const GROUND_Y = 380;
export const BAT_START = { x: 86, y: 236 };
export const FLOWER = { x: 536, y: GROUND_Y, headY: 300 };
export const MOTH_HOME = { x: 556, y: 258 };
export const LAMP = { x: 52, y: 150 };

const BAT_LEN = 20, MOUTH = 16;                      // body length, nose along the heading
const ARC_SPAN = 0.55, ARC_PAIR = 7;                  // wavefront: half-width of the fan, band spacing
const ARC_MAX = 52;                                    // a wave train keeps its length: past this the pair travels on
const CLEAN = { bat: 95, pulse: 300, emit: 1.00, again: 0.36, contact: 26, hold: 0.55 };
const SLOW = 0.76;                                    // beat 2 runs the same flight slower
const WANDER = { bat: 150, limit: 6.2, hold: 0.5 };
const WANDER_AIMS = [{ x: 300, y: 140 }, { x: 470, y: 330 }, { x: 215, y: 286 }, { x: 560, y: 165 }, { x: 660, y: 404 }];
const RING_LIFE = 0.9;

const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }]];
const S_HUNT = 0, S_LAMP = 1, S_ECHO = 2, S_HOLD = 3;

const ss = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };

// The moth: sways about the flower head, drifts up, and settles by t 5.4 s.
function mothAt(t) {
  const amp = 16 * (1 - ss(3.6, 5.4, t));
  return { x: MOTH_HOME.x + amp * Math.sin(1.3 * t), y: MOTH_HOME.y - 44 * Math.min(t / 6, 1) };
}

// ---------------------------------------------------------------- the shared drawing kit
export const BatFieldKit = { PANEL, GROUND_Y, mothAt, fieldColours, drawNightField, drawLamp, drawMoth, drawBat, drawPulseArc, batHead };

// Colours for the panel, built only from theme tokens (never a hex).
export function fieldColours(c, lampOn) {
  const dark = luma(c.bgDeep) < 0.5;
  if (lampOn) {
    const lit = dark ? lighten(c.bgDeep, 0.68) : c.bgDeep;     // a daytime panel, even inside a dark page
    return {
      lampOn: true,
      sky: mix(lit, c.s1, 0.14), sky2: mix(lit, c.s1, 0.26),
      ground: mix(lit, c.good, 0.26), tuft: mix(c.good, darken(c.good, 0.25), 0.5),
      plant: mix(c.good, darken(c.good, 0.25), 0.35), petal: c.gold,
      ink: darken(c.label, 0.20), pale: mix(darken(c.label, 0.20), lit, 0.15),
      bat: darken(c.label, 0.30), batEdge: darken(c.label, 0.60), moth: darken(c.gold, 0.20),
      arc: c.gold, arcBack: c.gold, star: null,
      trail: mix(darken(c.label, 0.25), lit, 0.30), lampCol: darken(c.label, 0.35), ring: c.accent,
    };
  }
  const pale = lighten(c.label, dark ? 0.10 : 0.82);
  const deep = dark ? darken(c.bgDeep, 0.50) : darken(c.bgDeep, 0.90);   // darker than the page, so the field reads as night
  return {
    lampOn: false,
    sky: deep,
    sky2: mix(deep, c.bgSurface, dark ? 0.16 : 0.07),
    ground: mix(deep, c.stroke, dark ? 0.30 : 0.14),
    tuft: alpha(pale, 0.34), plant: alpha(pale, 0.72), petal: alpha(pale, 0.86),
    ink: pale, pale, bat: dark ? mix(pale, deep, 0.55) : mix(pale, deep, 0.45),
    batEdge: pale, moth: lighten(pale, 0.25), arc: c.accent, arcBack: c.accent,
    star: alpha(pale, 0.38),
    trail: alpha(pale, 0.34), lampCol: pale, ring: lighten(c.accent, 0.25),
  };
}

// Sky, ground line with tufts, and the flower stalk. Stars are fixed marks, not motion.
const STARS = (() => {
  const r = mulberry32(7), out = [];
  for (let i = 0; i < 26; i++) out.push({ x: PANEL.x + 14 + r() * (PANEL.w - 28), y: PANEL.y + 12 + r() * (GROUND_Y - PANEL.y - 54), r: 0.7 + r() * 1.1 });
  return out;
})();

export function drawNightField(ctx, c, k) {
  const { x, y, w, h } = PANEL;
  ctx.fillStyle = k.sky;
  rr(ctx, x, y, w, h, 14); ctx.fill();
  ctx.fillStyle = k.sky2;                                // a flat band of lighter sky at the horizon
  ctx.fillRect(x + 1, GROUND_Y - 52, w - 2, 52);
  ctx.fillStyle = k.ground;
  ctx.fillRect(x + 1, GROUND_Y, w - 2, PANEL.y + h - GROUND_Y - 1);
  ctx.strokeStyle = k.pale; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 2, GROUND_Y + 0.5); ctx.lineTo(x + w - 2, GROUND_Y + 0.5); ctx.stroke();
  if (k.star) for (const s of STARS) {                   // a night sky needs marks, not a flat wash
    ctx.fillStyle = k.star;
    ellipse(ctx, s.x, s.y, s.r, s.r); ctx.fill();
  }

  ctx.strokeStyle = k.tuft; ctx.lineWidth = 2;           // tufts along the ground line
  for (let i = 0; i < 9; i++) {
    const gx = x + 26 + i * 68, lean = ((i * 37) % 13) - 6;
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y + 2); ctx.quadraticCurveTo(gx + lean * 0.5, GROUND_Y - 9, gx + lean, GROUND_Y - 15);
    ctx.moveTo(gx + 7, GROUND_Y + 2); ctx.quadraticCurveTo(gx + 9, GROUND_Y - 7, gx + 13, GROUND_Y - 11);
    ctx.stroke();
  }
  // flower stalk
  ctx.strokeStyle = k.plant; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(FLOWER.x, GROUND_Y + 3);
  ctx.quadraticCurveTo(FLOWER.x - 9, (GROUND_Y + FLOWER.headY) / 2, FLOWER.x, FLOWER.headY);
  ctx.stroke();
  ctx.beginPath();                                       // two leaves
  ctx.moveTo(FLOWER.x - 1, GROUND_Y - 30);
  ctx.quadraticCurveTo(FLOWER.x - 20, GROUND_Y - 40, FLOWER.x - 24, GROUND_Y - 30);
  ctx.quadraticCurveTo(FLOWER.x - 12, GROUND_Y - 26, FLOWER.x - 1, GROUND_Y - 30);
  ctx.moveTo(FLOWER.x - 3, GROUND_Y - 50);
  ctx.quadraticCurveTo(FLOWER.x + 17, GROUND_Y - 60, FLOWER.x + 21, GROUND_Y - 50);
  ctx.quadraticCurveTo(FLOWER.x + 10, GROUND_Y - 46, FLOWER.x - 3, GROUND_Y - 50);
  ctx.fillStyle = k.plant; ctx.fill();
  ctx.fillStyle = k.petal;                               // the head: five petals round a centre
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    ellipse(ctx, FLOWER.x + Math.cos(a) * 7, FLOWER.headY + Math.sin(a) * 7, 5, 4.2, a);
    ctx.fill();
  }
  ctx.fillStyle = k.plant;
  ellipse(ctx, FLOWER.x, FLOWER.headY, 3.6, 3.6); ctx.fill();
}

// The lamp on its post, drawn on the panel: the visible cause of the tints.
export function drawLamp(ctx, c, k, on) {
  const lc = k.lampCol || k.pale;
  ctx.strokeStyle = lc; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(LAMP.x, GROUND_Y + 3); ctx.lineTo(LAMP.x, LAMP.y + 10); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(LAMP.x, LAMP.y + 10); ctx.lineTo(LAMP.x + 24, LAMP.y + 10); ctx.stroke();
  ctx.fillStyle = on ? lc : mix(lc, k.sky, 0.55);               // shade
  ctx.beginPath();
  ctx.moveTo(LAMP.x + 14, LAMP.y + 10); ctx.lineTo(LAMP.x + 34, LAMP.y + 10);
  ctx.lineTo(LAMP.x + 29, LAMP.y - 8); ctx.lineTo(LAMP.x + 19, LAMP.y - 8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = lc; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(LAMP.x + 24, LAMP.y + 10); ctx.lineTo(LAMP.x + 24, LAMP.y + 15); ctx.stroke();
  ctx.fillStyle = on ? lighten(lc, 0.35) : mix(lc, k.sky, 0.75);
  ellipse(ctx, LAMP.x + 24, LAMP.y + 20, 6, 6); ctx.fill();
  if (on) { ctx.strokeStyle = alpha(lc, 0.5); ctx.lineWidth = 1.6;           // the bulb is lit
    ctx.beginPath(); ctx.arc(LAMP.x + 24, LAMP.y + 20, 11, 0, Math.PI * 2); ctx.stroke(); }
}

// The moth: small, pale, two wing poses, never anything else.
export function drawMoth(ctx, c, k, x, y, pose) {
  ctx.fillStyle = k.moth;
  ellipse(ctx, x, y, 7.6, 4.4, 0); ctx.fill();
  ellipse(ctx, x - 5.4, y - 0.8, 3.4, 2.8); ctx.fill();
  ctx.strokeStyle = k.moth; ctx.lineWidth = 1.4;                // antennae
  ctx.beginPath();
  ctx.moveTo(x + 5, y - 1.6); ctx.quadraticCurveTo(x + 10, y - 6.5, x + 12.5, y - 5);
  ctx.moveTo(x + 5, y + 0.8); ctx.quadraticCurveTo(x + 10, y + 4.5, x + 12.5, y + 3.4);
  ctx.stroke();
  const up = pose ? -9 : 6;                                     // wings, two positions
  ctx.fillStyle = alpha(k.moth, 0.72);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x - 1, y);
    ctx.quadraticCurveTo(x - 5, y + up * s * 0.9, x - 15, y + up * s);
    ctx.quadraticCurveTo(x - 10, y + 1.8 * s, x - 1, y + 2.2 * s);
    ctx.fill();
  }
}

// Flat-vector bat from primitives, facing `hdg`; wings in two poses, pale rim on the dark panel.
export function drawBat(ctx, c, k, x, y, hdg, pose, flap) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(hdg);
  const up = pose ? -1 : 1;                                     // two wing positions
  ctx.fillStyle = k.bat; ctx.strokeStyle = k.batEdge; ctx.lineWidth = 1.6;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(2, 4 * s);
    ctx.quadraticCurveTo(-6, (16 + flap * 3) * s * up, -21, (12 + flap * 5) * s * up);   // pointed tip
    ctx.quadraticCurveTo(-15, 5 * s * up, -12, 6 * s);                                     // scalloped trailing edge
    ctx.quadraticCurveTo(-9, 2 * s, -6, 3.4 * s);
    ctx.quadraticCurveTo(-3, 1.4 * s, -2, 0);
    ctx.fill(); ctx.stroke();
  }
  ellipse(ctx, 0, 0, BAT_LEN * 0.5, 5.8, 0); ctx.fill(); ctx.stroke();
  ellipse(ctx, MOUTH - 5, 0, 5.8, 5, 0); ctx.fill(); ctx.stroke(); // head
  ctx.beginPath();                                               // ears
  ctx.moveTo(MOUTH - 7, -3.8); ctx.lineTo(MOUTH - 9, -10); ctx.lineTo(MOUTH - 1.6, -4.6);
  ctx.moveTo(MOUTH - 7, 3.8); ctx.lineTo(MOUTH - 9, 10); ctx.lineTo(MOUTH - 1.6, 4.6);
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = k.pale;                                        // eye
  ellipse(ctx, x + Math.cos(hdg) * 12 - Math.sin(hdg) * 2.6, y + Math.sin(hdg) * 12 + Math.cos(hdg) * 2.6, 1.5, 1.5);
  ctx.fill();
}

// The mouth point: where a pulse leaves from and where a return lands. Never a wing.
export function batHead(x, y, hdg) { return { x: x + Math.cos(hdg) * MOUTH, y: y + Math.sin(hdg) * MOUTH }; }

// One wavefront off a moving point: a PAIR of concentric arc bands inside a fan about `dir`.
// `r` is the distance the wavefront has covered; `over` is how far its centre has advanced past
// the emitter once the pair has reached its full size (a wave train keeps its length).
export function drawPulseArc(ctx, c, k, x, y, r, dir, a, back, over = 0) {
  x += Math.cos(dir) * over; y += Math.sin(dir) * over;
  if (r < 2) return;
  ctx.strokeStyle = alpha(back ? k.arcBack : k.arc, a);
  ctx.lineCap = 'round';
  for (const off of [0, -ARC_PAIR]) {
    const rr0 = r + off;
    if (rr0 < 2) continue;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, rr0, dir - ARC_SPAN, dir + ARC_SPAN); ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, rr0, dir - ARC_SPAN * 0.6, dir + ARC_SPAN * 0.6); ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// ---------------------------------------------------------------- the scene
export class BatHuntScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static KIT = BatFieldKit;                        // the same drawing, for L07's variant
  static NOTE_STAGE = 0;
  static ARIA_LABEL = 'A bat flies across a dark night panel. Pairs of arcs leave it, come back from a moth and the path bends when they land. A lamp toggle lights the panel.';
  static CONTROLS = [{ type: 'toggle', id: 'lamp', label: 'lamp', value: false }];

  constructor(container, config) {
    super(container, config);
    this._lamp = false;
    this._run = null;                              // { kind, stage, t, p, aim, hdg, k, emitAt, arrived, hold, trail, pulse, wing }
    this._rest = { ...BAT_START, hdg: 0, pose: 1 };// where the bat waits when no flight is in the air
    this._rings = [];
    this._mothTaken = false;
  }

  noteRows() {
    return [{ text: 'a stage diagram: a real bat\'s eyes are not switched off by a lamp' }];
  }

  enter(stage) {
    this._run = null;
    this._rings.length = 0;
    this._mothTaken = false;
    const m0 = mothAt(0);
    this._rest = { ...BAT_START, hdg: Math.atan2(m0.y - BAT_START.y, m0.x - BAT_START.x), pose: 1 };
    this._lamp = stage === S_LAMP || stage === S_HOLD;
    if (stage === S_HUNT) this.after(0.35, () => this._launch('clean'));
    else if (stage === S_LAMP) this.after(0.45, () => this._launch('wander'));
    else if (stage === S_ECHO) this.after(0.45, () => this._launch('clean', true));
    this.requestUiUpdate?.();
  }

  // One flight. `slow` is beat 2's slower pass over the same flight.
  _launch(kind, slow = false) {
    if (this._run) return;
    const m = mothAt(0);
    this._mothTaken = false;
    this._rings.length = 0;
    this._run = {
      kind, stage: this.stage, slow, t: 0, p: { ...BAT_START }, aim: { ...m },
      hdg: Math.atan2(m.y - BAT_START.y, m.x - BAT_START.x), k: 0,
      emitAt: CLEAN.emit, arrived: 0, hold: 0, aimI: 0, wing: 0, wingPose: 1, flap: 0,
      trail: [{ ...BAT_START }], pulse: null, lit: false,
    };
  }

  _moth() { return this._run ? mothAt(this._run.t) : mothAt(0); }

  _ring(x, y) {
    if (this.stage !== S_ECHO) return;              // the pick-out rings belong to the round-trip beat
    this._rings.push({ x, y, t: 0 });
  }

  update(d) {
    for (const r of this._rings) r.t += d;
    while (this._rings.length && this._rings[0].t > RING_LIFE) this._rings.shift();
    const f = this._run;
    if (!f) return;
    f.t += d;
    f.flap = Math.sin(f.t * 26) * 0.5 + 0.5;
    f.wing += d;
    if (f.wing > 0.09) { f.wing = 0; f.wingPose = f.wingPose ? 0 : 1; }

    const m = this._moth();
    const slow = f.slow ? SLOW : 1;

    if (f.arrived) {                                     // the flight is over: hold a moment, then rest
      f.hold -= d;
      if (f.hold <= 0) { this._rest = { x: f.p.x, y: f.p.y, hdg: f.hdg, pose: f.wingPose }; this._run = null; }
      return;
    }

    if (f.kind === 'wander') {
      const aim = WANDER_AIMS[Math.min(f.aimI, WANDER_AIMS.length - 1)];
      if (f.aimI < WANDER_AIMS.length && Math.hypot(aim.x - f.p.x, aim.y - f.p.y) < 6) {
        f.aimI++;
        if (f.aimI >= WANDER_AIMS.length) { f.arrived = f.t; f.hold = WANDER.hold; }
      }
      this._flyTo(f, aim, WANDER.bat * d * slow, 9 * d * slow);
      if (!f.arrived && f.t > WANDER.limit) { f.arrived = f.t; f.hold = WANDER.hold; }   // it never arrives
    } else {
      this._flyTo(f, f.aim, CLEAN.bat * d * slow, 9 * d * slow);
      // the call, the moth, the return - all from real distances, so the kink is where the return lands
      if (!f.pulse && f.k < 2 && f.t >= f.emitAt) {
        const h = batHead(f.p.x, f.p.y, f.hdg);
        f.pulse = { mode: 'out', x: h.x, y: h.y, r: 1, dir: f.hdg, flagged: false };
        f.emitAt = f.t + CLEAN.again;
        this._ring(h.x + Math.cos(f.hdg) * 46, h.y + Math.sin(f.hdg) * 46);
      }
      if (f.pulse) {
        const p = f.pulse;
        p.r += CLEAN.pulse * d * slow;
        if (p.mode === 'out') {
          if (p.r >= Math.hypot(m.x - p.x, m.y - p.y)) {                 // swallowed by the moth
            p.mode = 'back'; p.x = m.x; p.y = m.y; p.r = 1;
            p.dir = Math.atan2(f.p.y - m.y, f.p.x - m.x);
            this._ring(m.x, m.y);
          }
        } else {
          const h = batHead(f.p.x, f.p.y, f.hdg);
          if (!p.flagged && p.r > 52) { p.flagged = true; this._ring(p.x + Math.cos(p.dir) * 52, p.y + Math.sin(p.dir) * 52); }
          if (p.r >= Math.hypot(h.x - p.x, h.y - p.y)) {                 // it lands on the head: now the line bends
            f.k++;
            f.aim = mothAt(f.t);
            f.pulse = null;
            this._ring(h.x, h.y);
            if (f.k === 2) this.celebrate(h.x, h.y, 8);
          }
        }
      }
      if (!f.arrived && Math.hypot(m.x - f.p.x, m.y - f.p.y) < CLEAN.contact) {
        f.arrived = f.t; f.hold = CLEAN.hold; this._mothTaken = true;      // the moth is taken
      }
    }
    const last = f.trail[f.trail.length - 1];
    if (Math.hypot(last.x - f.p.x, last.y - f.p.y) > 4) f.trail.push({ x: f.p.x, y: f.p.y });
  }

  // Move toward `aim`, easing the heading: the turn starts where the turn is wanted.
  _flyTo(f, aim, step, turn) {
    const dx = aim.x - f.p.x, dy = aim.y - f.p.y, d = Math.hypot(dx, dy);
    if (d < 0.001) return;
    const want = Math.atan2(dy, dx);
    let diff = ((want - f.hdg + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    f.hdg += Math.max(-turn, Math.min(turn, diff));
    const s = Math.min(step, d);
    f.p.x += Math.cos(f.hdg) * s; f.p.y += Math.sin(f.hdg) * s;
  }

  busy() { return !!this._run || this._rings.length > 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const k = fieldColours(c, this._lamp);
    ctx.save();
    ctx.beginPath(); rr(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 14); ctx.clip();
    drawNightField(ctx, c, k);
    drawLamp(ctx, c, k, this._lamp);
    this._drawTrail(ctx, k);
    if (!this._lamp) this._drawPulse(ctx, c, k);      // the arcs are marks on the dark panel only
    if (!this._mothTaken) drawMoth(ctx, c, k, this._moth().x, this._moth().y, this._run ? this._run.wingPose : 1);
    const f = this._run;
    drawBat(ctx, c, k, f ? f.p.x : this._rest.x, f ? f.p.y : this._rest.y,
      f ? f.hdg : this._rest.hdg, f ? f.wingPose : this._rest.pose, f ? f.flap : 0.5);
    this._drawRings(ctx, k);
    if (this._lamp) drawSpotlight(ctx, c, 300, 250, 300, 0.5);   // the lamp's own light, over the set
    ctx.restore();
    ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 1.5;
    rr(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 14); ctx.stroke();
  }

  _drawTrail(ctx, k) {
    const f = this._run;
    if (!f || f.trail.length < 2) return;
    ctx.strokeStyle = this._lamp ? alpha(k.trail, 1.6) : k.trail;
    ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(f.trail[0].x, f.trail[0].y);
    for (const p of f.trail) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  _drawPulse(ctx, c, k) {
    const p = this._run && this._run.pulse;
    if (!p) return;
    const back = p.mode === 'back';
    drawPulseArc(ctx, c, k, p.x, p.y, Math.min(p.r, ARC_MAX), p.dir, back ? 0.55 : 1, back, Math.max(0, p.r - ARC_MAX));
  }

  _drawRings(ctx, k) {
    for (const r of this._rings) {
      const u = Math.min(1, r.t / RING_LIFE);
      ctx.strokeStyle = alpha(k.ring, 0.9 * (1 - u));
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(r.x, r.y, 10 + u * 30, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ---- the one control. It changes the drawing, and at rest it flies the matching flight.
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'lamp') {
      const on = v === true || v === 'true' || v === 'on' || v === 1;
      if (on !== this._lamp) {
        this._lamp = on;
        this._mothTaken = false;
        if (!this._run && this.stage !== S_HOLD) this._launch(on ? 'wander' : 'clean', this.stage === S_ECHO);
      }
    }
    this.requestUiUpdate?.();
  }

  // Tap-to-replay (phones): the stub's pulses fire themselves, so the panel itself is the button.
  pointerDown(p) {
    if (this.stage === S_HOLD || this._run) return;
    if (p.x < PANEL.x || p.x > PANEL.x + PANEL.w || p.y < PANEL.y || p.y > PANEL.y + PANEL.h) return;
    this._launch(this._lamp ? 'wander' : 'clean', this.stage === S_ECHO);
    this.animateFor(600);
  }

  getControlValue(id) { return id === 'lamp' ? this._lamp : super.getControlValue(id); }
}
