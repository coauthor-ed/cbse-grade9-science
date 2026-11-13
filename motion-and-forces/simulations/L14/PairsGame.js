/**
 * PairsGame - mini-game blk-l15-game (third law). One picture per round, drawn like the L14 scenes
 * (CanoeScene water, PushGroundScene road and walker, BalloonRocketScene walls, thread, rocket).
 * The GIVEN force is a solid F arrow with its label. Three CANDIDATE forces are dashed F-tone arrows with
 * a letter badge A, B, C (no words that give the answer). Tap a dashed arrow on the picture, or its
 * letter button.
 *   step 1  pick the candidate that makes a pair with the given force.
 *           wrong: one hint line naming the rule (same object, or other object but wrong direction);
 *           the tried arrow fades; Try again clears the line; any other letter can be tapped at once.
 *   step 2  two object buttons ("the paddle" / "the water"): which object does that force act on?
 *           wrong: "Look where its tail is." Try again keeps the board.
 *   right   the dashed arrow turns solid and gets its label; Quill hops once; Next round.
 * Rounds from a fixed list, never all choices right; the right letter moves between rounds.
 * Won after round 4 (finishGame). Keys: A B C pick a force, 1 2 pick an object, Enter = the action button.
 *
 * Test notes (real controls; the action button is .pg-go, the letters .pg-cand[data-i], objects .pg-obj[data-i]):
 *   R1 canoe: tap B, then "the paddle", then Next round.   R2 walker: tap C, then "the foot", then Next round.
 *   R3 rocket: tap A, then "the rocket", then Next round.  R4 balloon: tap B, then "the balloon": game won.
 * Hooks: _pick(i) (0..2 = A..C), _obj(i) (0..1), _go() (Try again / Next round / Play again), _state().
 * ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, alpha, font, mix } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawRocket, drawBalloonOnThread } from 'simulations/base/kit/SimVehicles.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { drawCanoeist, drawSurface } from '../shared/MotionCast.js';
import { drawForce } from '../shared/ForceCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { CanoeScene } from './CanoeScene.js';
import { BalloonRocketScene } from './BalloonRocketScene.js';

const CANOE = CanoeScene.prototype, BALL = BalloonRocketScene.prototype;
const W = 680, H = 380, L = 96, LETTERS = ['A', 'B', 'C'];
const SAME = 'That force is on the same object, so it is not its pair.';
const OTHER = 'A pair acts on the OTHER object, in the opposite direction.';
const OBJ = 'Look where its tail is.';

// kind: 'pair' (right), 'same' (on the same object as the given force), 'dir' (other object, wrong direction)
const ROUNDS = [
  { id: 'canoe', given: 'paddle pushes the water', kinds: ['dir', 'pair', 'same'], objs: ['the paddle', 'the water'], obj: 0, done: 'water pushes the paddle' },
  { id: 'walk', given: 'foot pushes the ground', kinds: ['dir', 'same', 'pair'], objs: ['the ground', 'the foot'], obj: 1, done: 'ground pushes the foot' },
  { id: 'rocket', given: 'rocket pushes the gas', kinds: ['pair', 'dir', 'same'], objs: ['the gas', 'the rocket'], obj: 1, done: 'gas pushes the rocket' },
  { id: 'balloon', given: 'balloon pushes the air', kinds: ['same', 'pair', 'dir'], objs: ['the balloon', 'the air'], obj: 0, done: 'air pushes the balloon' },
];
const WY = 228, CX = 316, CL = 480;                 // canoe: water line (CanoeScene's), centre, length
const GY = 300, WH = 262;                            // walker: road line, figure height
const RGY = 350, RX = 330, RL = 236, RP = 64;                 // rocket: ground, centre x, length
const THY = 96, BX = 420, BR = 80;                  // balloon: thread y, balloon position, radius

const CSS = `
.gm.pg { gap: 6px; }
.pg .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.pg .play { display: grid; grid-template-columns: 610px minmax(0, 1fr); gap: 14px; align-items: start; flex: 1; min-height: 0; }
.pg canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; touch-action: manipulation; }
.pg .side { display: flex; flex-direction: column; gap: 9px; min-width: 0; max-width: 460px; padding: 12px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.pg .goal { margin: 0; padding-right: 46px; font: 800 20px/1.25 var(--sim-font-display); }
.pg .goal b { color: var(--sim-series-3-ink); }
.pg .ask { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.3; }
.pg .row { display: flex; gap: 10px; flex-wrap: wrap; }
.pg .row[hidden] { display: none; }
.pg .row .tap { min-width: 64px; height: 50px; padding: 0 14px; display: flex; align-items: center; justify-content: center; font: 800 19px/1 var(--sim-font); }
.pg .row .tap[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; background: var(--sim-bg-deep); }
.pg .row .tap[data-tried="1"] { opacity: 0.5; }
.pg .row .tap[data-good="1"] { border-color: var(--sim-good); }
.pg .acts { display: flex; }
.pg .acts .tap { min-width: 170px; display: flex; align-items: center; justify-content: center; }
.pg .acts .tap[hidden] { display: none; }
.pg .why { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 700; }
.pg .why:empty { display: none; }
.pg .why[data-k="bad"] { color: var(--sim-bad); }
.pg[data-lock="1"] .cands .tap { pointer-events: none; }
.sim-dom-root--portrait .pg .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .pg .side { padding: 10px; max-width: none; }
.sim-dom-root--portrait .pg .goal { font-size: 18px; }
.sim-dom-root--portrait .pg .ask { font-size: 16px; }
.sim-dom-root--portrait .pg .row .tap { flex: 1 1 0; min-width: 0; padding: 0 6px; }
.sim-dom-root--portrait .pg .acts .tap { flex: 1 1 auto; min-width: 0; }
.sim-dom-root--portrait .pg .why { font-size: 15px; }
`;

/** Shortest distance from P to the segment a-b. */
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

export class PairsGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Each picture shows one force. Tap the force that makes a pair with it. Then choose the object that this second force acts on.' } };
  static ARIA_LABEL = 'Four pictures: a canoe paddle in water, a walker on a road, a rocket lifting off, and a balloon on a thread. Each shows one force as a solid arrow with its name, and three dashed arrows marked A, B and C. Pick the dashed force that makes a pair with the given force, then choose the object it acts on. A pair acts on the other object, in the opposite direction.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm pg"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><canvas aria-hidden="true"></canvas>
        <div class="side"><p class="goal"></p><p class="ask" aria-live="polite"></p>
        <div class="row cands">${LETTERS.map((l, i) => `<div class="tap btn pg-cand" role="button" tabindex="0" aria-pressed="false" data-i="${i}" aria-label="Force ${l}">${l}</div>`).join('')}</div>
        <div class="row objs" hidden>${[0, 1].map((i) => `<div class="tap btn pg-obj" role="button" tabindex="0" aria-pressed="false" data-i="${i}"></div>`).join('')}</div>
        <p class="why" aria-live="polite"></p>
        <div class="acts"><div class="tap btn pg-go" role="button" tabindex="0" hidden>Try again</div></div></div></div></div>`,
    });
    for (const el of this.root.querySelectorAll('.pg-cand')) onTap(el, () => this._pick(Number(el.dataset.i)));
    for (const el of this.root.querySelectorAll('.pg-obj')) onTap(el, () => this._obj(Number(el.dataset.i)));
    const go = this.root.querySelector('.pg-go');
    if (go) onTap(go, () => this._go());
    const cv = this.root.querySelector('canvas');
    cv?.addEventListener('click', (e) => this._canvasTap(e, cv));
    this.root.querySelector('.pg')?.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase(), li = ['a', 'b', 'c'].indexOf(k);
      if (li >= 0) { e.preventDefault(); this._pick(li); }
      else if (k === '1' || k === '2') { e.preventDefault(); this._obj(Number(k) - 1); }
      else if (e.key === 'Enter' && !e.target.closest?.('.tap')) { e.preventDefault(); this._go(); }
    });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }
  _load() { this._step = 'pick'; this._sel = null; this._tried = new Set(); this._objBad = null; this._line = ''; this._bad = false; this._geo = null; }
  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }
  _done() { return this._round >= ROUNDS.length; }

  _pick(i) {
    if (this._done() || this._step !== 'pick' || !(i >= 0 && i < 3)) return;
    const kind = this._rd().kinds[i];
    if (kind === 'pair') {
      this._sel = i; this._step = 'obj'; this._bad = false; this._line = '';
    } else {
      this._tried.add(i); this._sel = i; this._bad = true;
      this._line = kind === 'same' ? SAME : OTHER;
    }
    this._render();
  }

  _obj(i) {
    if (this._done() || this._step !== 'obj' || !(i === 0 || i === 1)) return;
    const r = this._rd();
    if (i === r.obj) {
      this._step = 'won'; this._objBad = null; this._bad = false;
      this._line = `Right: ${r.done}. It acts on ${r.objs[r.obj]}.`;
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._objBad = i; this._bad = true; this._line = OBJ;
    }
    this._render();
  }

  /** Try again (clears the wrong try, keeps the board), Next round, Play again. */
  _go() {
    if (this._done()) { this._reset(); this._render(); return; }
    if (this._step === 'won') { this._round += 1; this._load(); this._render(); return; }
    if (this._bad) {
      this._bad = false; this._line = ''; this._objBad = null;
      if (this._step === 'pick') this._sel = null;
      this._render();
    }
  }

  /** The find: once per round, from the right-answer branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _state() {
    const done = this._done(), r = this._rd();
    return `round ${Math.min(this._round + 1, ROUNDS.length)}/${ROUNDS.length} ${r.id} step ${done ? 'won' : this._step} sel ${this._sel == null ? '-' : LETTERS[this._sel]} line ${this._line || '-'}${done ? ' won' : ''}`;
  }

  _canvasTap(e, cv) {
    if (!this._geo || this._step !== 'pick' || this._done()) return;
    const b = cv.getBoundingClientRect(), px = (e.clientX - b.left) / b.width * W, py = (e.clientY - b.top) / b.height * H;
    let best = -1, bd = 34;
    this._geo.forEach((g, i) => {
      const d = Math.min(segDist(px, py, g.x, g.y, g.x2, g.y2), Math.hypot(px - g.bx, py - g.by));
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) this._pick(best);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._done(), r = this._rd(), st = done ? 'won' : this._step;
    g.dataset.lock = st === 'pick' ? '0' : '1';
    root.querySelector('.sub').textContent = done ? 'All four pictures done.' : `Picture ${this._round + 1} of ${ROUNDS.length}`;
    root.querySelector('.goal').innerHTML = `The given force: <b>${r.given}</b>`;
    const sel = this._sel == null ? '' : LETTERS[this._sel];
    root.querySelector('.ask').textContent = st === 'pick' ? 'Which dashed force makes a pair with it? Tap A, B or C.'
      : st === 'obj' ? `Force ${sel} makes the pair. Which object does it act on?` : `Force ${sel} acts on ${r.objs[r.obj]}.`;
    for (const el of root.querySelectorAll('.pg-cand')) {
      const i = Number(el.dataset.i), right = r.kinds[i] === 'pair' && st !== 'pick';
      el.setAttribute('aria-pressed', i === this._sel ? 'true' : 'false');
      el.dataset.tried = this._tried.has(i) && i !== this._sel ? '1' : '0';
      el.dataset.good = right ? '1' : '0';
    }
    const objs = root.querySelector('.objs');
    objs.hidden = st === 'pick';
    for (const el of root.querySelectorAll('.pg-obj')) {
      const i = Number(el.dataset.i);
      el.textContent = r.objs[i];
      el.setAttribute('aria-pressed', (st === 'won' && i === r.obj) || i === this._objBad ? 'true' : 'false');
      el.dataset.good = st === 'won' && i === r.obj ? '1' : '0';
      el.style.pointerEvents = st === 'obj' ? '' : 'none';
    }
    const go = root.querySelector('.pg-go');
    if (go) {
      go.hidden = !(done || st === 'won' || this._bad);
      go.textContent = done ? 'Play again' : st === 'won' ? 'Next round' : 'Try again';
    }
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this._paint();
    this.relayout?.();
  }

  _ctx(cv) {
    const css = cv.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / W * dpr;
    const bw = Math.round(W * k), bh = Math.round(H * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
    return ctx;
  }

  // -- the pictures: each returns { given, cands: [{ x, y, a, len, bx, by }], tag } -------------------------
  canoe(ctx, c) {
    CANOE.water.call(CANOE, ctx, c, 0);
    const { canoe } = drawCanoeist(ctx, c, { x: CX, y: WY, length: CL, stroke: 0.5 });
    const bl = canoe.anchors.paddle.blade, x0 = canoe.x0 ?? CX - CL / 2;
    return {
      given: { x: bl.x - 4, y: bl.y + 28, a: Math.PI, tag: [Math.max(150, bl.x - 70), bl.y + 74] },
      cands: [
        { x: x0 + CL * 0.2, y: WY - 30, a: Math.PI, bx: x0 + CL * 0.2 + 26, by: WY - 70 },     // backward on the canoe
        { x: bl.x + 4, y: bl.y - 28, a: 0, bx: bl.x + L + 30, by: bl.y - 28 },                 // forward on the blade
        { x: bl.x + 120, y: bl.y + 48, a: 0, bx: bl.x + 120 + L + 30, by: bl.y + 48 },         // forward on the water
      ],
      doneTag: [bl.x + 52, bl.y - 66],
    };
  }

  walk(ctx, c) {
    drawTrack(ctx, c, trackSpec({ from: 0, to: 100, x0: 0, x1: W, y: GY }), { kind: 'road', ticks: false });
    const look = figureLook(c, { skin: 3, hairStyle: 'ponytail', hair: 1, top: 's2', bottom: 'navy', shoeStyle: 'sneaker', mood: 'smile' });
    const d = (1 + 0.72) * 0.68 * WH;
    const sk = drawFigure(ctx, c, { x: 300, y: GY, height: WH, facing: 1, pose: { name: 'walk', phase: walkPhase(d, WH, 'walk') } }, look);
    const fx = sk.anchors.foot[0].x - 6;
    return {
      given: { x: fx, y: GY + 20, a: Math.PI, tag: [Math.max(150, fx - 70), GY + 62] },
      cands: [
        { x: fx - 4, y: GY - 44, a: Math.PI, bx: fx - L - 30, by: GY - 44 },                   // backward on the foot
        { x: fx + 200, y: GY + 4, a: Math.PI / 2, len: 56, bx: fx + 232, by: GY + 32 },        // down on the ground
        { x: fx + 2, y: GY - 14, a: 0, bx: fx + 62, by: GY + 34 },                             // forward on the foot
      ],
      doneTag: [W - 8, GY - 44, 'right'],
    };
  }

  rocket(ctx, c) {
    drawSurface(ctx, c, 'rough', 0, W, RGY, { h: 44, seed: 7 });
    const cy = RGY - 92 - RL / 2;
    const rk = drawRocket(ctx, c, { x: RX, y: cy, length: RL, angle: -Math.PI / 2, thrust: 1, t: 1.2 });
    const R = 0.12 * RL, nz = rk.anchors.nozzle;
    return {
      given: { x: nz.x, y: nz.y + 6, a: Math.PI / 2, len: RP, tag: [nz.x + 40, nz.y + 44, 'left'] },
      cands: [
        { x: RX + R + 18, y: cy + 52, a: -Math.PI / 2, len: RP, bx: RX + R + 18, by: cy - 40 },     // up on the rocket
        { x: RX - R - 18, y: cy - 40, a: Math.PI / 2, len: 48, bx: RX - R - 18, by: cy + 36 },      // down on the rocket
        { x: nz.x - 40, y: nz.y + 76, a: -Math.PI / 2, len: 48, bx: nz.x - 72, by: nz.y + 52 },     // up on the gas
      ],
      doneTag: [W - 8, cy + 20, 'right'],
    };
  }

  balloon(ctx, c) {
    const FL = 340;
    drawSurface(ctx, c, 'tiles', 0, W, FL, { h: 40, seed: 4 });
    BALL.wall.call(BALL, ctx, c, 0, 30, FL); BALL.wall.call(BALL, ctx, c, 650, 680, FL);
    BALL.nail.call(BALL, ctx, c, 30, THY, 1); BALL.nail.call(BALL, ctx, c, 650, THY, -1);
    const bb = drawBalloonOnThread(ctx, c, { x0: 44, x1: 636, y: THY, at: BX, r: BR, air: 0.6, t: 1.1, jet: true, tone: 4 });
    const A = bb.anchors, n = A.neck, ce = A.centre ?? { x: BX, y: THY + BR };
    return {
      given: { x: n.x - 10, y: n.y + 26, a: Math.PI, tag: [Math.max(150, n.x - 70), Math.max(n.y, ce.y + BR) + 40] },
      cands: [
        { x: n.x - 150, y: n.y - 26, a: 0, len: 72, bx: n.x - 160, by: n.y - 64 },             // right on the air
        { x: n.x + 14, y: n.y - 22, a: 0, bx: n.x + L + 40, by: n.y - 22 },                     // right on the balloon
        { x: ce.x + 30, y: ce.y + BR - 12, a: Math.PI, len: 80, bx: ce.x + 62, by: ce.y + BR - 12 }, // left on the balloon
      ],
      doneTag: [Math.min(520, n.x + 14 + L / 2), THY - 30],
    };
  }

  _paint() {
    const cv = this.root?.querySelector('canvas');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv), r = this._rd();
    const scene = this[r.id].call(this, ctx, c);
    const st = this._done() ? 'won' : this._step, kf = st === 'won' ? 1 : 0;
    // the given force: solid, with its label
    const gv = scene.given;
    drawForce(ctx, c, gv.x, gv.y, { length: gv.len ?? L, angle: gv.a, label: '', fit: false });
    const [tx, ty, al] = gv.tag;
    drawTag(ctx, c, r.given, tx, ty, { size: 26, col: c.s2ink, align: al ?? 'center', prefer: [[0, 0]] });
    // the candidates
    this._geo = scene.cands.map((k, i) => {
      const len = k.len ?? L, x2 = k.x + Math.cos(k.a) * len, y2 = k.y + Math.sin(k.a) * len;
      const right = r.kinds[i] === 'pair', tried = this._tried.has(i) && !(right && st !== 'pick');
      const solid = right && st === 'won';
      const fade = st !== 'pick' && !right ? 0.28 : tried ? 0.32 : 1;
      if (solid && kf > 0) drawForce(ctx, c, k.x, k.y, { length: len, angle: k.a, label: '', alpha: kf, fit: false });
      if (!solid || kf < 1) {
        ctx.save(); ctx.globalAlpha *= fade * (1 - kf);
        displacementArrow(ctx, c, k.x, k.y, x2, y2, { col: alpha(c.bgSurface, 0.8), width: 11, head: 22, dash: [12, 6] });
        displacementArrow(ctx, c, k.x, k.y, x2, y2, { col: c.s3, width: 6, head: 17, dash: [11, 7] });
        ctx.restore();
      }
      const on = this._sel === i && (st === 'obj' || (this._bad && st === 'pick'));
      this.badge(ctx, c, LETTERS[i], k.bx, k.by, { on, bad: on && this._bad && st === 'pick', alpha: solid ? 1 - 0.6 * kf : fade });
      return { x: k.x, y: k.y, x2, y2, bx: k.bx, by: k.by };
    });
    if (kf > 0) {
      const [dx, dy, da] = scene.doneTag;
      drawTag(ctx, c, r.done, dx, dy, { size: 26, col: c.s1ink, align: da ?? 'center', alpha: kf, prefer: [[0, 0]] });
    }
  }

  /** A letter in a round badge (F tone rim); on = picked (accent ring), bad = a wrong pick. */
  badge(ctx, c, s, x, y, o = {}) {
    const R = 21;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    if (o.on) { ctx.beginPath(); ctx.arc(x, y, R + 6, 0, Math.PI * 2); ctx.strokeStyle = o.bad ? c.bad : c.accent; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = mix(c.s3, c.label, 0.2); ctx.stroke();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.s3ink ?? c.label; ctx.fillText(s, x, y + 1);
    ctx.restore();
  }

  checkObjective() { return this._done() ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
}
