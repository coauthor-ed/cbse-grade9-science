// RampChoiceGameScene - blk-l07-s12, mini-game@1. A worker must push a crate up onto a
// loading platform of height h. Each round gives the load (its weight, mg) and the effort
// the worker pushes with (F). Three planks are offered; picking one lays it as the ramp,
// and Push sends the crate up. The plank that works with exactly this effort is the one with
// MA = L / h = load / effort (no friction): a shorter plank needs more than F, so the crate
// stalls and slides back; a longer one works but is not the shortest. Every round's answer
// is one of its planks, so every round can be won. Made-up numbers.
// Board: GameFrame (DOM) with one canvas picture drawn with kit SimFigure, SimApparatus and
// SimLook helpers. Control names: .plank, .push, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, pill, mix, darken, lighten, alpha, rr, drawShadow, vectorArrow, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawCrate } from 'simulations/base/kit/SimApparatus.js';

const ROUNDS = [
  { h: 1, load: 600, effort: 200, planks: [2, 3, 4] },          // 3 m
  { h: 1.5, load: 800, effort: 300, planks: [3, 4, 5] },        // 4 m
  { h: 0.5, load: 500, effort: 100, planks: [1.5, 2.5, 3.5] },  // 2.5 m
  { h: 2, load: 900, effort: 300, planks: [4, 5, 6] },          // 6 m
  { h: 1.2, load: 500, effort: 150, planks: [3, 4, 6] },        // 4 m
];

// Canvas design 680 x 280 (drawn at 2x).
const DW = 680, DH = 250, DPR = 2;
const GY = 226;
const DOCK_X = 540;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));


// a pill kept inside the canvas width: measured first (alpha 0 draws nothing), then shifted in
function fitPill(ctx, c, text, x, y, o) {
  const m = pill(ctx, c, text, x, y, { ...o, alpha: 0 });
  const dx = Math.max(0, 6 - m.x0) - Math.max(0, m.x0 + m.w - (DW - 6));
  return pill(ctx, c, text, x + dx, y, o);
}

const CSS = `
.gm.rc { background: var(--sim-bg-deep); border-radius: 14px; }
.rc .play { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; align-items: start; }
.rc .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.rc canvas { display: block; width: 100%; max-width: 700px; margin: 0 auto; aspect-ratio: ${DW} / ${DH}; border-radius: calc(var(--sim-radius-lg) - 4px); }
.rc .side { display: flex; flex-direction: column; gap: 8px; }
.rc .dots { display: flex; gap: 6px; align-items: center; }
.rc .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.rc .dot[data-on="1"] { background: var(--sim-good); }
.rc .dots .pn { margin-left: 8px; font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.rc .lbl { margin: 0; font-size: 15px; font-weight: 700; color: var(--sim-label-muted); }
.rc .planks { display: flex; gap: 8px; }
.rc .plank { flex: 1; font-size: 18px; font-weight: 800; padding: 6px 4px;
             background: linear-gradient(180deg, color-mix(in oklab, var(--sim-gold) 55%, var(--sim-bg-surface)) 0 38%,
                                         color-mix(in oklab, var(--sim-gold) 72%, var(--sim-label)) 38% 44%,
                                         color-mix(in oklab, var(--sim-gold) 60%, var(--sim-bg-surface)) 44% 100%); }
.rc .plank[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.rc .push { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
            box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.rc .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.rc .say[data-k="good"] { color: var(--sim-good); }
.rc .say:empty { display: none; }
.rc .again, .rc .next { display: none; }
.rc .acts { display: none; gap: 8px; }
.rc .acts:has([data-on="1"]) { display: flex; }
.rc .again[data-on="1"], .rc .next[data-on="1"] { display: inline-block; }
.rc .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.rc .btn[disabled] { opacity: 0.45; cursor: default; }
.sim-dom-root--portrait .rc .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .rc canvas { max-width: none; }
`;

export class RampChoiceGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a worker must push a crate up onto a loading platform. Each round gives the height, the weight of the load and the effort the worker pushes with. Pick one of three planks as the ramp and push: the right plank has mechanical advantage L / h equal to load / effort.';
  static HEIGHT = 380;   // the board's content, so no empty band under it
  static OBJECTIVE = { prompt: { en: 'Pick the ramp that lets the worker push the load up with the effort shown. Use MA = L / h.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.pick = null;        // the chosen plank length (m)
    this.pushed = false;
    this.roundWon = false;
    this.allWon = false;
    this.anim = null;
    this.loopId = 0;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm rc">
        <div class="gm-head"><p class="kicker">Inclined plane</p><h2>Pick the <b>shortest</b> ramp that works</h2>
          <p class="sub">MA = L / h must equal load / effort.</p></div>
        <div class="play">
          <div class="stage"><canvas class="art" width="${DW * DPR}" height="${DH * DPR}" role="img" aria-label="A worker behind a crate, a loading platform of height h, the weight of the crate and the worker's push as arrows"></canvas></div>
          <div class="side">
            <div class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}<span class="pn">numbers for example</span></div>
            <p class="lbl">Planks</p>
            <div class="planks">${[0, 1, 2].map((i) => `<button type="button" class="tap btn plank" data-i="${i}" aria-pressed="false"></button>`).join('')}</div>
            <button type="button" class="tap btn push">Push</button>
            <p class="say" aria-live="polite"></p>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next load</button></div>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.push')) return;
    this.cv = q('canvas.art');
    this.colors = loadColors(this.root);
    this.root.querySelectorAll('.plank').forEach((b) => onTap(b, () => this.choose(Number(b.dataset.i))));
    onTap(q('.push'), () => this.push());
    onTap(q('.again'), () => this.back());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick a plank, then push.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  // px per metre for this round: the longest plank's run and the platform both fit the stage
  get P() {
    const r = this.round, L = Math.max(...r.planks);
    return Math.min(104, (DOCK_X - 48) / (Math.sqrt(L * L - r.h * r.h) + 1.65), 150 / r.h);
  }
  get crw() { return 0.8 * this.P; }
  get crh() { return 0.68 * this.P; }
  get figH() { return 1.7 * this.P; }
  get startX() { return 48 + 1.25 * this.P; }   // crate centre before the push: the worker fits behind it

  deal() {
    const r = this.round;
    this.pick = null;
    this.roundWon = false;
    this.root.querySelectorAll('.plank').forEach((b, i) => { b.textContent = `${fmt(r.planks[i])} m`; b.setAttribute('aria-label', `Plank ${fmt(r.planks[i])} m long`); });
    this.root.querySelector('.next').dataset.on = '0';
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.back();
  }

  choose(i) {
    if (this.pushed) return;
    this.pick = this.round.planks[i];
    this.paint();
  }

  push() {
    if (this.pushed || this.pick == null) return;
    this.pushed = true;
    const r = this.round, L = this.pick;
    const ma = L / r.h, need = r.load / ma, maNeed = r.load / r.effort;
    const say = this.root.querySelector('.say');
    const maTxt = `MA = ${fmt(L)} / ${fmt(r.h)} = ${fmt(ma)}`;
    this.outcome = need > r.effort ? 'stall' : 'up';
    if (Math.abs(ma - maNeed) < 1e-9) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `${maTxt} = ${r.load} / ${r.effort}. ${r.effort} N is just enough.`;
      this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
      if (this.roundNo === ROUNDS.length - 1) {
        this.allWon = true;
        finishGame(this);
        this.quill?.perform('hop');
      } else {
        this.root.querySelector('.next').dataset.on = '1';
        this.quill?.speak('Up it goes.', 2500);
      }
    } else if (need > r.effort) {
      say.dataset.k = 'miss';
      say.textContent = `${maTxt}: needs ${r.load} / ${fmt(ma)} = ${fmt(need)} N, more than ${r.effort} N.`;
      this.root.querySelector('.again').dataset.on = '1';
    } else {
      say.dataset.k = 'miss';
      say.textContent = `${maTxt}: needs only ${fmt(need)} N. A shorter plank also works.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.startAnim(this.outcome === 'stall' ? 2.0 : 1.8);
    this.paint();
  }

  back() {
    this.pushed = false;
    this.outcome = null;
    this.stopAnim();
    const q = (s) => this.root.querySelector(s);
    q('.again').dataset.on = '0';
    q('.say').textContent = '';
    q('.say').dataset.k = '';
    this.paint();
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= ROUNDS.length - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  paint() {
    const q = (s) => this.root.querySelector(s);
    if (!q('.push')) return;
    this.root.querySelectorAll('.plank').forEach((b, i) => {
      b.setAttribute('aria-pressed', String(this.round.planks[i] === this.pick));
      b.disabled = this.pushed;
    });
    q('.push').disabled = this.pushed || this.pick == null;
    this.draw();
  }

  startAnim(dur) {
    this.stopAnim();
    const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (calm) { this.draw(); return; }
    this.anim = { t0: performance.now(), dur };
    const loop = () => {
      this.draw();
      if (this.anim && (performance.now() - this.anim.t0) / 1000 < this.anim.dur) this.loopId = requestAnimationFrame(loop);
      else { this.anim = null; this.loopId = 0; this.draw(); }
    };
    this.loopId = requestAnimationFrame(loop);
  }
  stopAnim() { if (this.loopId) cancelAnimationFrame(this.loopId); this.loopId = 0; this.anim = null; }

  // Where the crate is: { flat, up } in px. flat = distance walked on the ground to the
  // ramp foot, up = distance along the ramp. At rest after a push it is the end state.
  progress(run, len) {
    const flat = Math.max(0, (DOCK_X - run) - this.crw / 2 - 4 - this.startX);
    if (!this.pushed) return { flat: 0, up: 0 };
    const end = this.outcome === 'stall' ? { flat: 0, up: 0 } : { flat, up: len - this.crw / 2 + 2 };
    if (!this.anim) return end;
    const t = (performance.now() - this.anim.t0) / 1000;
    if (this.outcome !== 'stall') {
      const u = inOutSine(clamp01(t / this.anim.dur));
      const tot = flat + len - this.crw / 2 + 2, d = u * tot;
      return d <= flat ? { flat: d, up: 0 } : { flat, up: d - flat };
    }
    // stall: walk in, climb 40 percent, hold, slide back to the ramp foot, then home
    const top = len * 0.4;
    const a = clamp01(t / 1.1), tot = flat + top, d = inOutSine(a) * tot;
    if (t < 1.1) return d <= flat ? { flat: d, up: 0 } : { flat, up: d - flat };
    if (t < 1.4) return { flat, up: top };
    const b = inOutSine(clamp01((t - 1.4) / 0.6));
    return { flat: flat * (1 - b), up: top * (1 - b) };
  }

  refreshTheme() { if (this.cv) { this.colors = loadColors(this.root); this.draw(); } }
  destroy() { this.stopAnim(); super.destroy(); }

  // canvas text size, design px: the canvas shows at about 0.43 scale on a 390 phone, so
  // portrait draws 34 (about 14.5 px on screen); landscape keeps 26
  get fs() { return this.root?.classList?.contains('sim-dom-root--portrait') ? 34 : 26; }

  draw() {
    const cv = this.cv, c = this.colors;
    if (!cv || !c) return;
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, DW, DH);
    const r = this.round, hp = r.h * this.P, topY = GY - hp;
    this.scenery(ctx, c, topY);
    let run = 0, len = 0, ang = 0;
    if (this.pick != null) {
      len = this.pick * this.P;
      run = Math.sqrt(Math.max(0, this.pick * this.pick - r.h * r.h)) * this.P;
      ang = Math.atan2(hp, run);
      this.ramp(ctx, c, DOCK_X - run, topY, len, ang);
    }
    // the crate and the worker
    const p = this.progress(run, len);
    const foot = { x: DOCK_X - run, y: GY };
    let cx, cy, a = 0;
    if (p.up > 0) {
      const s = p.up + this.crw / 2 - 2;     // centre of the crate's base along the ramp
      cx = foot.x + Math.cos(ang) * s; cy = foot.y - Math.sin(ang) * s; a = -ang;
    } else { cx = this.startX + p.flat; cy = GY; }
    if (p.up > 0 && p.up >= len - this.crw / 2 - 1) { cx = DOCK_X + this.crw / 2 + 6; cy = topY; a = 0; }
    const lifted = cy < GY - 0.5;
    if (!lifted) drawShadow(ctx, c, cx, GY + 2, this.crw * 0.5, 4, 0.7);
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(a);
    drawCrate(ctx, c, { x: 0, y: 0, w: this.crw, h: this.crh, held: lifted });
    ctx.restore();
    // crate-local point (lx along its base, ly up is negative) to the picture
    const W_ = (lx, ly) => ({ x: cx + lx * Math.cos(a) - ly * Math.sin(a), y: cy + lx * Math.sin(a) + ly * Math.cos(a) });
    // the worker behind the crate, on the same surface
    const surf = (x) => (x <= foot.x || this.pick == null ? GY : x >= DOCK_X ? topY : GY - (x - foot.x) * Math.tan(ang));
    const hands = [W_(-this.crw / 2 - 2, -this.crh * 0.6), W_(-this.crw / 2 - 2, -this.crh * 0.42)];
    const fx = hands[0].x - this.figH * 0.36;
    const feet = [{ x: fx - this.figH * 0.2, y: surf(fx - this.figH * 0.2) }, { x: fx + this.figH * 0.08, y: surf(fx + this.figH * 0.08) }];
    const spec = figureFor(this, {
      role: 'adult', pose: { name: 'push', lean: 22 }, x: fx, y: surf(fx), height: this.figH, facing: 1,
      hands, feet, look: { mood: 'effort' }, i: 0,
    });
    drawFigure(ctx, c, spec, spec.look);
    // forces on the crate: its weight straight down, the push along the surface
    const mid = W_(0, -this.crh / 2);
    const settled = !this.anim;
    if (!this.pushed || (settled && this.outcome === 'stall')) {
      vectorArrow(ctx, c, mid.x, mid.y, { angle: Math.PI / 2, length: this.crh / 2 + 14, col: c.s6, width: 5, head: 14 });
      // on the phone the bigger tag goes right of the crate, clear of the worker's head
      if (this.fs > 26) pill(ctx, c, `mg = ${r.load} N`, mid.x + this.crw / 2 + 6, mid.y - this.crh / 2 - 34, { bg: c.s6, size: this.fs, align: 'left' });
      else pill(ctx, c, `mg = ${r.load} N`, mid.x - this.crw / 2 + 2, mid.y - this.crh / 2 - 26, { bg: c.s6, size: this.fs, align: 'left' });
      const f0 = W_(this.crw / 2 + 4, -this.crh / 2);
      vectorArrow(ctx, c, f0.x, f0.y, { angle: a, length: 56, col: c.s1, width: 5, head: 14 });
      pill(ctx, c, `F = ${r.effort} N`, f0.x + 62, f0.y, { bg: c.s1, size: this.fs, align: 'left' });
    }
  }

  scenery(ctx, c, topY) {
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, c.setSkyTop); sky.addColorStop(1, mix(c.setSkyLow, c.setGround, 0.15));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, DW, GY);
    // a far shed roofline, toned down
    ctx.fillStyle = alpha(mix(c.setGroundFar, c.setSkyLow, 0.4), 0.55);
    ctx.beginPath(); ctx.moveTo(0, GY - 70); ctx.lineTo(120, GY - 110); ctx.lineTo(260, GY - 70); ctx.lineTo(260, GY); ctx.lineTo(0, GY); ctx.fill();
    // yard: paving with joints
    const pav = mix(c.setGround, c.label, 0.1);
    ctx.fillStyle = pav; ctx.fillRect(0, GY, DW, DH - GY);
    ctx.fillStyle = lighten(pav, 0.2); ctx.fillRect(0, GY, DW, 3);
    ctx.strokeStyle = darken(pav, 0.18); ctx.lineWidth = 2;
    for (let x = 30; x < DW; x += 70) { ctx.beginPath(); ctx.moveTo(x, GY + 3); ctx.lineTo(x - 10, DH); ctx.stroke(); }
    // the loading platform: concrete block, lighter top edge, a steel nosing, shade on the face
    const conc = mix(c.bgSurface, c.label, 0.28);
    const hp = GY - topY;
    ctx.fillStyle = conc; ctx.fillRect(DOCK_X, topY, DW - DOCK_X, hp);
    ctx.fillStyle = darken(conc, 0.12); ctx.fillRect(DOCK_X, topY + hp * 0.55, DW - DOCK_X, hp * 0.45);
    ctx.strokeStyle = darken(conc, 0.2); ctx.lineWidth = 1.5;
    for (let y = GY - 24; y > topY + 6; y -= 24) { ctx.beginPath(); ctx.moveTo(DOCK_X, y); ctx.lineTo(DW, y); ctx.stroke(); }
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.55); ctx.fillRect(DOCK_X - 2, topY - 4, DW - DOCK_X + 2, 8);
    ctx.fillStyle = lighten(mix(c.bgSurface, c.label, 0.55), 0.3); ctx.fillRect(DOCK_X - 2, topY - 4, DW - DOCK_X + 2, 2);
    ctx.fillStyle = alpha(darken(conc, 0.4), 0.5); ctx.fillRect(DOCK_X, topY + 4, 6, hp - 4);
    // h: dashed, up the platform face, with its value on the face
    ctx.save();
    ctx.strokeStyle = c.s2ink; ctx.fillStyle = c.s2ink; ctx.lineWidth = 4; ctx.setLineDash([9, 7]);
    const ax = DOCK_X + 18;
    ctx.beginPath(); ctx.moveTo(ax, GY - 3); ctx.lineTo(ax, topY + 16); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ax, topY + 5); ctx.lineTo(ax - 8, topY + 18); ctx.lineTo(ax + 8, topY + 18); ctx.closePath(); ctx.fill();
    ctx.restore();
    fitPill(ctx, c, `h = ${fmt(this.round.h)} m`, (ax + DW) / 2 + 6, Math.min(GY - 20, (GY + topY) / 2), { bg: c.s2, size: this.fs });
  }

  ramp(ctx, c, x0, topY, len, ang) {
    const wood = mix(c.gold, c.bgSurface, 0.25), th = 10;
    ctx.save();
    ctx.translate(x0, GY); ctx.rotate(-ang);
    ctx.fillStyle = darken(wood, 0.35); rr(ctx, -2, 0, len + 6, th + 3, 3); ctx.fill();
    ctx.fillStyle = wood; rr(ctx, -2, -2, len + 6, th, 3); ctx.fill();
    ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(0, -2, len + 2, 2.5);
    ctx.strokeStyle = darken(wood, 0.2); ctx.lineWidth = 1.5;
    for (let s = 40; s < len; s += 64) { ctx.beginPath(); ctx.moveTo(s, 1); ctx.quadraticCurveTo(s + 18, 4, s + 34, 1); ctx.stroke(); }
    ctx.restore();
    // its length, on a tag above the plank's upper part
    const mx = x0 + Math.cos(ang) * len * 0.42, my = GY - Math.sin(ang) * len * 0.42;
    fitPill(ctx, c, `L = ${fmt(this.pick)} m`, mx - Math.sin(ang) * 30 - 10, my - Math.cos(ang) * 30, { bg: mix(c.gold, c.bgSurface, 0.1), size: this.fs });
  }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.push')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
