/**
 * WaveTunerGame - mini-game for L04 (blk-l04-n03). Rebuilt 2026-11-03 (whole file; the old SVG dial game stays
 * in history only through this note).
 *
 * Six rounds on the GameFrame, all graphs are SimWave density graphs on green paper.
 * Rounds 1-2 (warm-up) "Which graph matches this strip?": a frozen strip of air particles with C and R tags,
 *   and three small density graphs to tap. One is the strip's own field (its density at each particle's mean
 *   place, as DensityGraphScene draws it); one is that field half a wavelength on; one has another wavelength.
 *   A wrong tap marks that graph and offers Try again.
 * Rounds 3-6 a target wave in a named medium (air 340, water 1500, steel 5000 m/s). The learner steps the
 *   frequency with - and +; their wave is drawn over the target on one metre scale, with the line
 *   lambda = v / nu = ... m. The round is won the moment the wavelengths are equal, so every crest lines up.
 *   Every list holds the target, so the learner can always win.
 * After round 6: finishGame, Quill hops once.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, alpha, pill } from 'simulations/base/kit/SimLook.js';
import { waveField, sineSource, drawParticleStrip, drawDensityGraph } from 'simulations/base/kit/SimWave.js';

const LAM = '\u03bb', NU = '\u03bd', DIV = '\u00f7', MINUS = '\u2212';
const V = 120, DPR = 2, RANGE = [0.3, 1.7];

// warm-up rounds: wavelength and first crest as fractions of the strip width; order = which graph is where
const PICKS = [
  { lam: 0.4, first: 0.14, other: 0.6, order: ['shift', 'right', 'other'] },
  { lam: 0.27, first: 0.1, other: 0.4, order: ['other', 'shift', 'right'] },
];
// tune rounds: the target's frequency is in the list; span = metres shown across the graph
const TUNES = [
  { medium: 'air', v: 340, list: [85, 170, 340, 680], target: 340, start: 0, span: 4 },
  { medium: 'water', v: 1500, list: [250, 500, 750, 1500], target: 500, start: 3, span: 12 },
  { medium: 'steel', v: 5000, list: [500, 1000, 2500, 5000], target: 2500, start: 0, span: 8 },
  { medium: 'air', v: 340, list: [170, 340, 680, 1360], target: 680, start: 1, span: 2 },
];
const N = PICKS.length + TUNES.length;
const fmt = (m) => String(+m.toFixed(2));

/** A frozen wave of wavelength lam px whose first crest is `first` px from x0, plus its mean-place density field. */
function wave(lam, first, x0) {
  const freq = V / lam, origin = x0 - 3 * lam;
  const F = waveField({ v: V, origin, source: sineSource({ wavelength: lam, freq }) });
  const t = (x0 - origin + first) / V + 20 / freq;
  const G = { origin, dir: 1, xAt: (d) => origin + d, rhoLin: F.rhoLin, rhoRangeLin: F.rhoRangeLin };
  return { F, G, t };
}

const CSS = `
.wt .round { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; white-space: nowrap; }
.wt .dots { display: flex; gap: 6px; }
.wt .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); }
.wt .dot[data-on="1"] { background: var(--sim-good); border-color: var(--sim-good); }
.wt .board { position: relative; width: 100%; flex: 1 1 auto; min-height: 84px; }
.wt[data-mode="pick"] .board { flex: none; height: 104px; }
.wt canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.wt .picks { display: none; gap: 10px; flex: 1 1 auto; min-height: 96px; }
.wt[data-mode="pick"] .picks { display: flex; }
.wt .pick { position: relative; flex: 1 1 0; min-height: 96px; padding: 0; margin: 0; background: var(--sim-bg-surface);
            border: 3px solid color-mix(in oklab, var(--sim-stroke) 60%, transparent); border-radius: var(--sim-radius-md, 10px); overflow: hidden; }
.wt .pick[data-v="good"] { border-color: var(--sim-good); }
.wt .pick[data-v="bad"] { border-color: var(--sim-bad); opacity: 0.55; }
.wt .tune { display: none; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.wt[data-mode="tune"] .tune { display: flex; }
.wt .med { margin: 0; font-size: 17px; font-weight: 800; }
.wt .key { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; }
.wt .key i { display: inline-block; width: 22px; height: 0; border-top: 4px solid var(--sim-series-1); }
.wt .key i.tg { border-top-color: var(--sim-series-5); }
.wt .dial { display: flex; align-items: center; gap: 8px; }
.wt .dial .btn { min-width: 48px; min-height: 48px; font-size: 24px; font-weight: 800; padding: 0; }
.wt .nu { min-width: 118px; text-align: center; font-family: var(--sim-font-display); font-size: 20px; font-weight: 700; }
.wt .lam { margin: 0; font-family: var(--sim-font-display); font-size: 18px; font-weight: 700; }
.wt .acts { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }
.wt .acts .btn { min-height: 48px; padding: 0 18px; font-weight: 800; font-size: 17px; }
.wt .next, .wt .again { display: none; }
.wt .next[data-on="1"], .wt .again[data-on="1"] { display: inline-flex; align-items: center; }
.wt .say { margin: 0; font-size: 16px; font-weight: 700; flex: 1 1 200px; }
.wt .say[data-k="good"] { color: var(--sim-good); }
.wt .say[data-k="miss"] { color: var(--sim-bad); }
.sim-dom-root--portrait .wt[data-mode="pick"] .board { height: 84px; }
.sim-dom-root--portrait .wt .picks { flex-direction: column; flex: none; }
.sim-dom-root--portrait .wt .pick { flex: none; height: 74px; min-height: 74px; }
.sim-dom-root--portrait .wt[data-mode="tune"] .board { flex: none; height: 176px; }
.sim-dom-root--portrait .wt .sub { padding-right: 62px; }
.sim-dom-root--portrait .wt .round { flex: 1 1 100%; }
.sim-dom-root--portrait .wt .acts .btn { flex: 1 1 auto; }
`;

export class WaveTunerGame extends GameBoard {
  static HEIGHT = 405;   // the full landscape frame (GAME_H): fits 1280x720; the tune row wraps to two lines at 1100
  static ARIA_LABEL = 'A six-round game. In the first two rounds a frozen strip of air particles with compressions and '
    + 'rarefactions is shown over three small density graphs; pick the graph whose crests sit under the compressions. '
    + 'In the next four rounds a target density wave is drawn for air, water or steel; step the frequency up or down '
    + 'until your wave, whose wavelength is speed divided by frequency, lines up with the target.';
  static OBJECTIVE = { prompt: { en: 'Set the frequency so your wave matches the target wave in each medium. Use v = \u03bb \u00d7 \u03bd.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.idx = 0;
    this.roundWon = false;
    this.allWon = false;
    this.bad = new Set();
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      onResize: () => this.paint(),
      html: `<div class="gm wt" data-mode="pick">
        <div class="gm-head"><p class="kicker">Wave tuner</p><h2 class="ttl"></h2><p class="sub"></p></div>
        <div class="board"><canvas aria-hidden="true"></canvas></div>
        <div class="picks">${[0, 1, 2].map((i) => `<button type="button" class="tap btn pick" data-i="${i}" aria-label="Graph ${i + 1}"><canvas aria-hidden="true"></canvas></button>`).join('')}</div>
        <div class="tune"><p class="med" aria-live="polite"></p>
          <span class="key"><i class="tg"></i>target</span><span class="key"><i></i>your wave</span>
          <span class="dial"><button type="button" class="tap btn minus" aria-label="Lower frequency">${MINUS}</button><span class="nu" aria-live="polite"></span><button type="button" class="tap btn plus" aria-label="Higher frequency">+</button></span>
          <p class="lam"></p></div>
        <div class="acts"><div class="round"><span class="rtxt" aria-live="polite"></span><span class="dots">${Array.from({ length: N }, () => '<span class="dot"></span>').join('')}</span></div>
          <button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next round</button>
          <p class="say" aria-live="polite"></p></div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.next')) return;
    onTap(q('.next'), () => this.nextRound());
    onTap(q('.again'), () => this.deal());
    onTap(q('.minus'), () => this.nudge(-1));
    onTap(q('.plus'), () => this.nudge(1));
    this.root.querySelectorAll('.pick').forEach((el) => onTap(el, () => this.choose(+el.dataset.i)));
    this.deal();
  }

  get isPick() { return this.roundNo < PICKS.length; }
  get tune() { return TUNES[this.roundNo - PICKS.length]; }

  deal() {
    const q = (s) => this.root.querySelector(s);
    this.roundWon = false;
    this.bad = new Set();
    q('.wt').dataset.mode = this.isPick ? 'pick' : 'tune';
    q('.rtxt').textContent = `Round ${this.roundNo + 1} of ${N}`;
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    q('.next').dataset.on = '0';
    q('.again').dataset.on = '0';
    this.say('', '');
    if (this.isPick) {
      q('.ttl').textContent = 'Which graph matches this strip?';
      q('.sub').textContent = 'Tap the graph whose crests sit under the Cs.';
      this.root.querySelectorAll('.pick').forEach((el) => { el.dataset.v = ''; el.disabled = false; });
    } else {
      const r = this.tune;
      this.idx = r.start;
      q('.ttl').innerHTML = `Match the target wave in <b>${r.medium}</b>`;
      q('.sub').textContent = `Set ${NU} with ${MINUS} and +.`;
      q('.med').textContent = `${r.medium}: v = ${r.v} m/s. Target ${LAM} = ${fmt(r.v / r.target)} m`;
      this.showTune();
    }
    this.paint();
  }

  say(text, k) { const s = this.root.querySelector('.say'); s.textContent = text; s.dataset.k = k; }

  // ---- warm-up rounds
  choose(i) {
    if (this.roundWon || this.bad.has(i)) return;
    const el = this.root.querySelector(`.pick[data-i="${i}"]`);
    const kind = PICKS[this.roundNo].order[i];
    if (kind === 'right') {
      el.dataset.v = 'good';
      this.root.querySelector('.again').dataset.on = '0';
      this.winRound('Yes: each crest sits under a C, each trough under an R.');
      return;
    }
    this.bad.add(i);
    el.dataset.v = 'bad';
    this.say(kind === 'shift' ? 'Its crests sit under the Rs. Try again.' : 'Its crests are spaced differently from the Cs. Try again.', 'miss');
    // no dead end in a pick round (the other graphs stay tappable), so no Try again: keeps 390 within the frame
    this.quill?.speak('Crests sit under the Cs.', 3000);
  }

  // ---- tune rounds
  nudge(d) {
    if (this.roundWon || this.isPick) return;
    const r = this.tune;
    this.idx = Math.max(0, Math.min(r.list.length - 1, this.idx + d));
    this.showTune();
    this.paint();
    const lam = r.v / r.list[this.idx], tgt = r.v / r.target;
    if (r.list[this.idx] === r.target) this.winRound(`Match: every crest lines up. ${LAM} = ${fmt(tgt)} m.`);
    else this.say(lam > tgt ? `Your ${LAM} is too long. A higher ${NU} makes ${LAM} shorter.` : `Your ${LAM} is too short. A lower ${NU} makes ${LAM} longer.`, 'miss');
  }

  showTune() {
    const r = this.tune, nu = r.list[this.idx], q = (s) => this.root.querySelector(s);
    q('.nu').textContent = `${NU} = ${nu} Hz`;
    q('.lam').textContent = `${LAM} = v ${DIV} ${NU} = ${r.v} ${DIV} ${nu} = ${fmt(r.v / nu)} m`;
    q('.minus').disabled = this.roundWon || this.idx === 0;
    q('.plus').disabled = this.roundWon || this.idx === r.list.length - 1;
  }

  winRound(text) {
    this.roundWon = true;
    this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
    if (!this.isPick) this.showTune();
    if (this.roundNo === N - 1) {
      this.allWon = true;
      this.say(`${text} All six rounds done.`, 'good');
      finishGame(this);
      this.quill?.perform('hop');
    } else {
      this.say(text, 'good');
      this.root.querySelector('.next').dataset.on = '1';
      this.quill?.speak(this.roundNo === 1 ? 'Now use v = \u03bb \u00d7 \u03bd.' : 'Right.', 2500);
    }
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= N - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  // ---- drawing
  canvasCtx(cv) {
    const W = Math.max(120, Math.round(cv.parentElement?.clientWidth || 300));
    const H = Math.max(60, Math.round(cv.parentElement?.clientHeight || 84));
    cv.width = W * DPR; cv.height = H * DPR;
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    return { ctx, W, H };
  }

  paint() {
    const board = this.root?.querySelector('.board canvas');
    if (!board) return;
    this.colors = this.colors || loadColors(this.root);
    const c = this.colors;
    if (this.isPick) {
      const p = PICKS[this.roundNo], { ctx, W, H } = this.canvasCtx(board), x0 = 8, w = W - 16;
      const s = wave(p.lam * w, p.first * w, x0);
      drawParticleStrip(ctx, c, { x: x0, y: H - 40, w, h: 34, field: s.F, t: s.t, densityShade: true,
        spacing: W < 520 ? 9 : 11, r: W < 520 ? 3 : 3.4, seed: 5 + this.roundNo });
      // C and R tags on the field's computed regions; a broad region the finder splits keeps one tag
      const regs = [];
      for (const g of s.F.regions(s.t, x0 - s.G.origin, x0 + w - s.G.origin)) {
        if (g.x < x0 + 12 || g.x > x0 + w - 12) continue;
        const last = regs[regs.length - 1];
        if (last && last.kind === g.kind) { if (Math.abs(g.rho - 1) > Math.abs(last.rho - 1)) regs[regs.length - 1] = g; continue; }
        regs.push(g);
      }
      for (const g of regs) pill(ctx, c, g.kind, g.x, H - 62, { bg: g.kind === 'C' ? c.s5 : c.s2, size: W < 520 ? 16 : 20, display: true });
      this.root.querySelectorAll('.pick canvas').forEach((cv, i) => {
        const g = this.canvasCtx(cv), gx = 8, gw = g.W - 16, kind = p.order[i];
        const lam = (kind === 'other' ? p.other : p.lam) * gw;
        const first = kind === 'shift' ? p.first * gw + (p.lam * gw) / 2 : p.first * gw;
        const f = wave(lam, first, gx);
        drawDensityGraph(g.ctx, c, { x: gx, y: 8, w: gw, h: g.H - 16, field: f.G, t: f.t, linear: true, range: RANGE, marks: false, cell: 8 });
      });
      return;
    }
    const r = this.tune, { ctx, W, H } = this.canvasCtx(board);
    const x0 = 20, w = W - 44, ppm = w / r.span, first = 0.1 * w;
    const tgt = wave((r.v / r.target) * ppm, first, x0), you = wave((r.v / r.list[this.idx]) * ppm, first, x0);
    // the kit graph carries the target (purple); your wave is drawn over it on the same yOf
    const g = drawDensityGraph(ctx, c, { x: x0, y: 12, w, h: H - 34, field: tgt.G, t: tgt.t, linear: true, range: RANGE, tone: 5, marks: false });
    ctx.save();
    ctx.strokeStyle = c.s1; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (let X = x0; X <= x0 + w; X += 1) { const y = g.yOf(you.G.rhoLin(X - you.G.origin, you.t)); if (X === x0) ctx.moveTo(X, y); else ctx.lineTo(X, y); }
    ctx.stroke();
    // a metre ruler under the graph
    ctx.globalAlpha = 1; ctx.fillStyle = c.label; ctx.font = `700 ${W < 520 ? 13 : 16}px ${c.fontBody || 'sans-serif'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const stepM = r.span <= 4 ? (r.span <= 2 ? 0.5 : 1) : r.span / 4;
    for (let m = 0; m <= r.span + 1e-9; m += stepM) ctx.fillText(`${fmt(m)} m`, Math.min(x0 + w - 14, Math.max(x0 + 12, x0 + m * ppm)), H - 18);
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 1.5;
    ctx.restore();
  }

  refreshTheme() { if (this.root?.querySelector('.board canvas')) { this.colors = loadColors(this.root); this.paint(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.next')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
