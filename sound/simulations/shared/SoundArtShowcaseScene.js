/**
 * SoundArtShowcaseScene - a dev page for the course art in SoundArt.js (not linked from
 * any lesson). Every number here is sample data. No sound arcs or air dots (SimWave).
 *
 * Beats (2): b0 an ear (glows when the sound arrives), a plate struck by a beater, a
 * rubber-covered bowl with rice grains hopping; b1 a jet, a cracker going off, a
 * seismograph drawing a record with the first wave marked; b2 box and band (swinging, held
 * off the box), the five instruments lit; b3 head cutaway, vocal cord insets (open, closed),
 * cricket, water dish, bucket and spoons; b4 astronauts with the station arm, bat, moth.
 * Wave 2 (K4): b5 ear cutaway with tags and a pulse, head from above; b6 sea section, ship
 * with sonar, submarine, dolphin, fish; b7 phones (spectrum, cone), hearing aid, thermometer,
 * siren, whistle, snake; b8 storm cloud and bolt, drone, car, rover, mosquito; b9 halls
 * (panels and curtains, bare), dome, balloon whole and bursting.
 * Fix round (KF2): b10 sitar (extra strings shimmer, lit 0.7), taal (domes on the back
 * edge, lit 0.5), mridangam, tabla lit 0.35; b11 bat at four flap phases, faded vocal
 * cords with a full-strength label, bucket with side grip, thick band, worn hearing aid
 * on a side-view head; b12 ear cutaway with its eardrum/bones tags, head from above
 * (shirt shoulders), dome with depth, phone seated in its paper cone.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill } from 'simulations/base/kit/SimLook.js';
import { drawEar, drawPlateAndBeater, drawRubberBowl, drawJet, drawCracker, drawSeismograph,
  drawBoxAndBand, drawEktara, drawTabla, drawBansuri, drawTaal, drawSitar, drawHeadCutaway, drawVocalCords,
  drawCricket, drawAstronaut, drawStationArm, drawBat, drawMoth, drawWaterDish, drawBucketAndSpoons,
  drawEarCutaway, drawHeadTop, drawDolphin, drawFish, drawSnake, drawShip, drawSubmarine, drawSeaCut, drawPhone,
  drawHearingAid, drawSiren, drawWhistle, drawThermometer, drawStormCloud, drawBolt, drawDrone, drawCar, drawRover,
  drawMosquito, drawHall, drawDome, drawBalloon, drawMridangam } from './SoundArt.js';

const GROUND = 486;
const RUN = 3.2;
const GRAINS = Array.from({ length: 16 }, (_, i) => ({ u: (i + 0.5) / 16, d: ((i * 37) % 16) / 16, ph: (i * 2.39) % 6.28 }));
const quake = (u) => (u < 0.42 ? 0.05 * Math.sin(u * 90) : Math.exp(-(u - 0.42) * 5) * Math.sin((u - 0.42) * 70) * (u < 0.62 ? 0.55 : 1));

export class SoundArtShowcaseScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }],
    [{ idx: 5, dwellMs: null }], [{ idx: 6, dwellMs: null }], [{ idx: 7, dwellMs: null }], [{ idx: 8, dwellMs: null }], [{ idx: 9, dwellMs: null }],
    [{ idx: 10, dwellMs: null }], [{ idx: 11, dwellMs: null }], [{ idx: 12, dwellMs: null }]];
  static ARIA_LABEL = 'A sample sheet of sound course art: an ear, a steel plate struck with a wooden beater, a bowl covered with a rubber sheet with rice grains jumping, a jet plane, a firecracker going off, a seismograph drawing a record, a cardboard box with a rubber band, an ektara, a tabla, a bansuri, a taal, a sitar, a head in section showing the voice box, vocal cords open and closed, a cricket, a water dish, a bucket with spoons, astronauts at a space station arm, a bat and a moth; the ear in section and a head seen from above; a ship, a submarine, a dolphin and fish in a sea section; phones with a sound spectrum, a hearing aid, a thermometer, a siren, a whistle and a snake; a storm cloud with lightning, a drone, a car, a rover and a mosquito; two halls, a dome and balloons; a sitar, a taal, a mridangam and a tabla; four bats in flight, vocal cords, a bucket with spoons, a box with a thick band and a hearing aid worn behind an ear; the ear in section with labels, a head from above, a dome and a phone in a paper cone.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = stage; }
  busy() { return this.age < RUN; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    const t = Math.min(this.age, RUN);
    if (this.cur === 0) {
      const beat = (t * 1.5) % 1, hit = beat < 0.15 ? 1 - beat / 0.15 * 0.2 : Math.max(0, 1 - (beat - 0.15) * 2.5);
      const ring = Math.max(0, 1 - ((t * 1.5 + 0.85) % 1) * 1.2);
      drawEar(ctx, c, { x: 105, y: 235, h: 72, facing: 1, head: true, listen: 0.5 + 0.5 * Math.sin(t * 4) });
      drawPlateAndBeater(ctx, c, { x: 330, y: 200, r: 96, held: true, swing: t >= RUN ? 0.35 : 1 - hit, hard: true, ring: t >= RUN ? 1 : ring, t });
      const sheet = Math.sin(t * 25) * 0.8;
      drawRubberBowl(ctx, c, { x: 540, y: GROUND, w: 240, h: 96, sheet,
        grains: GRAINS.map((g) => ({ u: g.u, d: g.d, h: Math.max(0, Math.sin(t * 9 + g.ph)) * 16 })) });
    } else if (this.cur === 1) {
      drawJet(ctx, c, { x: 250, y: 110, len: 300, dir: 1 });
      const flash = Math.max(0, Math.sin(Math.min(t, 1.6) / 1.6 * Math.PI)) * 0.4 + 0.6;
      drawCracker(ctx, c, { x: 110, y: GROUND, s: 1.3, flash, t });
      drawSeismograph(ctx, c, { x: 400, y: 330, len: 320, R: 52, trace: quake, upTo: Math.min(1, 0.2 + t / RUN), marks: [{ u: 0.42, label: 'first wave' }] });
    } else if (this.cur === 2) {
      const sw = Math.sin(t * 30) * 14 * Math.exp(-t * 0.4);
      drawBoxAndBand(ctx, c, { x: 110, y: 150, w: 150, swing: sw, ghost: 1, amp: 14, tension: 0.4 });
      drawBoxAndBand(ctx, c, { x: 110, y: 330, w: 170, off: true, swing: -sw, ghost: 1, amp: 12, tension: 0.8 });
      drawEktara(ctx, c, { x: 265, y: GROUND, h: 290, vib: 1, t, lit: true });
      drawTabla(ctx, c, { x: 395, y: GROUND, r: 58, vib: 1, t, lit: true });
      drawBansuri(ctx, c, { x: 490, y: 70, len: 340, wd: 34, cutaway: true, vib: 1, t, lit: true });
      drawTaal(ctx, c, { x: 595, y: 175, r: 40, meet: 0.6 + 0.4 * Math.abs(Math.sin(t * 2)), vib: 1, t, lit: true });
      drawSitar(ctx, c, { x: 530, y: 440, len: 250, ang: -0.95, vib: 1, t, lit: true, litExtra: true });
    } else if (this.cur === 3) {
      drawHeadCutaway(ctx, c, { x: 150, y: 150, h: 220, lit: true, vib: 1, t });
      drawVocalCords(ctx, c, { x: 420, y: 90, r: 52, state: 'open', label: 'open' });
      drawVocalCords(ctx, c, { x: 580, y: 90, r: 52, state: 'closed', vib: 1, t, label: 'closed', lit: true });
      drawCricket(ctx, c, { x: 565, y: 215, s: 0.8, rub: t * 3, lit: true });
      drawWaterDish(ctx, c, { x: 135, y: GROUND, w: 200 });
      drawBucketAndSpoons(ctx, c, { x: 480, y: GROUND, R: 80, H: 120, under: true, tap: Math.abs(Math.sin(t * 3)) });
    } else if (this.cur === 4) {
      drawStationArm(ctx, c, { x: 30, y: 60, len: 620, lift: 0.4, at: 0.6 });
      drawAstronaut(ctx, c, { x: 210, y: 330, pose: 'work', tool: 'wrench', s: 0.85 });
      drawAstronaut(ctx, c, { x: 470, y: 340, pose: 'float', dir: -1, radio: true, radioLit: 0.5 + 0.5 * Math.sin(t * 5), s: 0.85 });
      drawAstronaut(ctx, c, { x: 625, y: 380, pose: 'reach', dir: -1, s: 0.6 });
      drawBat(ctx, c, { x: 90, y: 455, s: 0.9, flap: 0.08 * Math.sin(t * 2) });
      drawMoth(ctx, c, { x: 340, y: 470, s: 0.8, flap: t * 3 });
    } else if (this.cur === 5) {
      const u = (t / RUN) % 1, drumNow = Math.sin(t * 22) * 0.8;
      const ear = drawEarCutaway(ctx, c, { x: 300, y: 240, w: 430, drum: drumNow, bones: Math.abs(drumNow), lit: 'cochlea', pulse: 0.15 + u * 0.85 });
      for (const [k, txt] of [['pinna', 'outer ear'], ['canal', 'ear canal'], ['eardrum', 'eardrum'], ['bones', 'tiny bones'], ['cochlea', 'cochlea'], ['nerve', 'nerve']]) pill(ctx, c, txt, ear.tags[k].x, ear.tags[k].y, { size: 22 });
      drawHeadTop(ctx, c, { x: 585, y: 430, r: 40, litLeft: 1, litRight: 0.3 });
    } else if (this.cur === 6) {
      drawSeaCut(ctx, c, { y: 150, bottom: 520, t });
      drawShip(ctx, c, { x: 210, y: 150, len: 250, sonar: true });
      drawSubmarine(ctx, c, { x: 480, y: 290, len: 230, dir: -1, spin: t * 2 });
      drawDolphin(ctx, c, { x: 170, y: 320, swim: (t * 1.2) % 1 });
      drawFish(ctx, c, { x: 560, y: 410, swim: (t * 2) % 1, dir: -1 });
      drawFish(ctx, c, { x: 610, y: 445, s: 0.7, swim: (t * 2 + 0.4) % 1, dir: -1, tone: 2 });
    } else if (this.cur === 7) {
      drawPhone(ctx, c, { x: 80, y: 150, h: 200, peaks: [{ u: 0.3, h: 0.85 }], lit: true });
      drawPhone(ctx, c, { x: 225, y: 140, h: 180, cone: true, peaks: [{ u: 0.15, h: 0.9 }, { u: 0.3, h: 0.55 }, { u: 0.45, h: 0.4 }, { u: 0.6, h: 0.22 }, { u: 0.75, h: 0.12 }] });
      drawHearingAid(ctx, c, { x: 455, y: 390, w: 300, lit: 1, pulse: (t / RUN) % 1, labels: ['microphone', 'amplifier', 'speaker'] });
      drawThermometer(ctx, c, { x: 480, y: 150, level: 0.7, label: 'hot' });
      drawSiren(ctx, c, { x: 615, y: 160, on: 0.5 + 0.5 * Math.sin(t * 8) });
      drawWhistle(ctx, c, { x: 600, y: 230 });
      drawSnake(ctx, c, { x: 140, y: GROUND, len: 240, wave: t * 0.5 });
    } else if (this.cur === 8) {
      const fl = t >= RUN ? 0.9 : Math.max(0, Math.sin(t * 5)) ** 3;
      drawStormCloud(ctx, c, { x: 185, y: 250, w: 280, flash: fl, rain: 0.6, t });
      drawBolt(ctx, c, { from: { x: 170, y: 246 }, to: { x: 235, y: GROUND }, glow: fl, seed: 5 });
      drawDrone(ctx, c, { x: 480, y: 90, spin: t * 7 });
      drawCar(ctx, c, { x: 570, y: GROUND, len: 180, lit: true });
      drawRover(ctx, c, { x: 365, y: GROUND, s: 0.75, spin: t * 0.2 });
      drawMosquito(ctx, c, { x: 600, y: 250, s: 1.4, flap: t * 6 });
    } else if (this.cur === 9) {
      drawHall(ctx, c, { x: 20, y: 30, w: 420, h: 240, panels: true, seats: 'cushioned', curtains: true, rows: 6 });
      drawHall(ctx, c, { x: 20, y: 290, w: 300, h: 190, seats: 'bare', rows: 4 });
      drawDome(ctx, c, { x: 545, y: 476, R: 115 });
      drawBalloon(ctx, c, { x: 520, y: 100, r: 34 });
      drawBalloon(ctx, c, { x: 625, y: 100, r: 34, tone: 2, burst: Math.min(0.3, t / RUN * 0.3) });
    } else if (this.cur === 10) {
      drawSitar(ctx, c, { x: 110, y: 400, len: 400, ang: -0.62, vib: 1, litExtra: 0.7, t });
      drawTaal(ctx, c, { x: 560, y: 110, r: 50, meet: 0.35, vib: 1, lit: 0.5, t });
      drawMridangam(ctx, c, { x: 500, y: GROUND, len: 250, r: 52, vib: 1, t, lit: 0.5 + 0.5 * Math.sin(t * 3) });
      drawTabla(ctx, c, { x: 300, y: GROUND, r: 44, vib: 1, t, lit: 0.35 });
    } else if (this.cur === 11) {
      [0, 0.25, 0.5, 0.75].forEach((f, i) => drawBat(ctx, c, { x: 95 + i * 160, y: 90, s: 0.95, flap: f }));
      ctx.save(); ctx.globalAlpha = 0.55; drawVocalCords(ctx, c, { x: 80, y: 290, r: 50, state: 'closed', vib: 1, t, label: 'closed' }); ctx.restore();
      drawBucketAndSpoons(ctx, c, { x: 245, y: GROUND, R: 66, H: 100, grip: 'side', side: 1, tap: 0.5 + 0.5 * Math.sin(t * 6) });
      drawBoxAndBand(ctx, c, { x: 420, y: 300, w: 120, thick: 12, swing: Math.sin(t * 20) * 8, ghost: 1 });
      drawEar(ctx, c, { x: 590, y: 340, h: 62, head: true, facing: 1 });
      drawHearingAid(ctx, c, { x: 590, y: 340, h: 62, worn: true, facing: 1, glow: 0.4 });
    } else if (this.cur === 12) {
      const ear = drawEarCutaway(ctx, c, { x: 250, y: 240, w: 380, lit: 'bones', drum: Math.sin(t * 20) * 0.6, bones: 0.5 + 0.5 * Math.sin(t * 20) });
      pill(ctx, c, 'eardrum', ear.tags.eardrum.x, ear.tags.eardrum.y, {});
      pill(ctx, c, 'bones', ear.tags.bones.x, ear.tags.bones.y, {});
      drawHeadTop(ctx, c, { x: 570, y: 120, r: 48, litRight: 0.6 });
      drawDome(ctx, c, { x: 560, y: 476, R: 100 });
      drawPhone(ctx, c, { x: 110, y: 400, h: 120, cone: true, peaks: [{ u: 0.3, h: 0.8 }] });
    }
  }
}
