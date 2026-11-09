/**
 * LabelWaveGame - mini-game for L03 (book Pause and Ponder 6). New 2026-11-03.
 *
 * Four rounds. Each shows a frozen tube of air (SimWave particle strip, piston at the left,
 * faint density tint) carrying a sound wave. The tube is split into tap zones, one per
 * computed compression or rarefaction (field.regions at the frozen time). Tapping a zone
 * cycles blank -> C -> R. Check marks each zone right or wrong; wrong ones flash and can be
 * changed. A round is won when all are right; no lives, no timer. Rounds vary the
 * wavelength and the number of regions; in round 4 the piston is pulled back, so the region
 * next to it is a rarefaction. After round 4 the game finishes through finishGame.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { waveField, sineSource, drawParticleStrip } from 'simulations/base/kit/SimWave.js';

// n regions; phase 0.25 = piston pushed in (C next to it), 0.75 = pulled back (R next to it)
const ROUNDS = [{ n: 3, phase: 0.25 }, { n: 4, phase: 0.25 }, { n: 5, phase: 0.25 }, { n: 4, phase: 0.75 }];
// landscape: the tube takes what is left of a 330-high frame (fits 1280x720 with the host card);
// portrait: a fixed 214-high tube. The strip starts just under the '?' marks.
const PHONE_TUBE_H = 214, STRIP_Y = 46, ROD = 62, DPR = 2;

const CSS = `
.lw .round { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; white-space: nowrap; }
.lw .dots { display: flex; gap: 6px; }
.lw .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); }
.lw .dot[data-on="1"] { background: var(--sim-good); border-color: var(--sim-good); }
.lw .tube { position: relative; width: 100%; flex: 1 1 auto; min-height: 140px; }
.sim-dom-root--portrait .lw .tube { flex: none; height: ${PHONE_TUBE_H}px; }
.lw .tube canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.lw .zone { position: absolute; top: 0; height: 100%; min-width: 44px; padding: 0; margin: 0;
            background: transparent; box-shadow: none; border: 2px dashed color-mix(in oklab, var(--sim-stroke) 70%, transparent);
            border-radius: var(--sim-radius-md, 10px); display: flex; justify-content: center; align-items: flex-start; padding-top: 2px; }
.lw .zone:active { transform: none; box-shadow: none; }
.lw .zone .mk { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                font-family: var(--sim-font-display); font-size: 26px; font-weight: 700;
                background: var(--sim-bg-surface); border: 2px solid var(--sim-stroke); color: var(--sim-label-muted); }
.lw .zone[data-m="C"] .mk { background: var(--sim-series-5); border-color: var(--sim-series-5); color: var(--sim-bg-surface); }
.lw .zone[data-m="R"] .mk { background: var(--sim-series-2); border-color: var(--sim-series-2); color: var(--sim-label); }
.lw .zone[data-v="good"] { border: 3px solid var(--sim-good); }
.lw .zone[data-v="bad"] { border: 3px solid var(--sim-bad); animation: lwflash 0.5s ease-in-out 2; }
@keyframes lwflash { 50% { background: color-mix(in oklab, var(--sim-bad) 22%, transparent); } }
@media (prefers-reduced-motion: reduce) { .lw .zone[data-v="bad"] { animation: none; } }
.lw .acts { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
.lw .acts .btn { min-height: 48px; padding: 0 20px; font-weight: 800; font-size: 17px; }
.lw .next { display: none; }
.lw .next[data-on="1"] { display: inline-flex; align-items: center; }
.lw .say { margin: 0; font-size: 17px; font-weight: 700; flex: 1 1 220px; }
.lw .say[data-k="good"] { color: var(--sim-good); }
.lw .say[data-k="miss"] { color: var(--sim-bad); }
.sim-dom-root--portrait .lw .acts .btn { flex: 1 1 auto; }
.sim-dom-root--portrait .lw .sub { padding-right: 62px; }
.sim-dom-root--portrait .lw .round { flex: 1 1 100%; }
`;

export class LabelWaveGame extends GameBoard {
  static HEIGHT = 330;
  static ARIA_LABEL = 'A four-round game: a tube of air with a piston at the left holds a sound wave, frozen. The tube is split into regions. Mark each region C for a compression, where the particles are packed closer than average, or R for a rarefaction, where they are spread out more than average, then check.';
  static OBJECTIVE = { prompt: { en: 'Mark each compression with C and each rarefaction with R. Packed closer than average is C; spread out more than average is R.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.marks = [];
    this.zones = [];
    this.roundWon = false;
    this.allWon = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      onResize: () => this.paint(),
      html: `<div class="gm lw">
        <div class="gm-head"><p class="kicker">Pause and ponder</p><h2>Mark each <b>C</b> and each <b>R</b></h2>
          <p class="sub">Tap each region: C or R. Then Check.</p></div>
        <div class="tube"><canvas aria-hidden="true"></canvas><div class="zones"></div></div>
        <div class="acts"><div class="round"><span class="rtxt" aria-live="polite"></span><span class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</span></div>
          <button type="button" class="tap btn chk">Check</button><button type="button" class="tap btn next">Next round</button>
          <p class="say" aria-live="polite"></p></div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.chk')) return;
    onTap(q('.chk'), () => this.check());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Packed closer than average is C.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }

  // the frozen wave for this round, at the canvas's current width
  model() {
    const cv = this.root.querySelector('.tube canvas');
    const W = Math.max(280, cv?.parentElement?.clientWidth || 1000);
    const narrow = W < 520;
    const x = ROD, w = W - ROD - 10, r = this.round;
    const lambda = w / (r.n / 2);
    const field = waveField({ source: sineSource({ amp: 0.07 * lambda, freq: 1 }), v: lambda, origin: x });
    const t = 40 + r.phase;
    const regs = field.regions(t, 2, w - 2).filter((g) => g.x > x + 6 && g.x < x + w - 6).slice(0, r.n);
    const zones = regs.map((g, i) => {
      const prev = regs[i - 1], next = regs[i + 1];
      const l = prev ? (prev.x + g.x) / 2 : x, rr = next ? (g.x + next.x) / 2 : x + w;
      return { kind: g.kind, l, w: rr - l };
    });
    return { W, x, w, field, t, zones, spacing: narrow ? 8 : 11, dot: narrow ? 2.8 : 3.4 };
  }

  deal() {
    this.roundWon = false;
    const m = this.model();
    this.zones = m.zones;
    this.marks = m.zones.map(() => '');
    const q = (s) => this.root.querySelector(s);
    q('.rtxt').textContent = `Round ${this.roundNo + 1} of ${ROUNDS.length}`;
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    const box = q('.zones');
    box.innerHTML = m.zones.map((z, i) => `<button type="button" class="tap btn zone" data-i="${i}" data-m="" aria-label="Region ${i + 1}: not marked"><span class="mk">?</span></button>`).join('');
    box.querySelectorAll('.zone').forEach((el) => onTap(el, () => this.cycle(+el.dataset.i)));
    q('.next').dataset.on = '0';
    q('.chk').disabled = false;
    q('.say').textContent = '';
    q('.say').dataset.k = '';
    this.paint();
  }

  cycle(i) {
    if (this.roundWon) return;
    const next = { '': 'C', C: 'R', R: '' };
    this.marks[i] = next[this.marks[i]];
    const el = this.root.querySelector(`.zone[data-i="${i}"]`);
    el.dataset.m = this.marks[i];
    el.dataset.v = '';
    el.querySelector('.mk').textContent = this.marks[i] || '?';
    el.setAttribute('aria-label', `Region ${i + 1}: ${this.marks[i] === 'C' ? 'compression' : this.marks[i] === 'R' ? 'rarefaction' : 'not marked'}`);
  }

  check() {
    if (this.roundWon) return;
    const say = this.root.querySelector('.say');
    if (this.marks.some((m) => !m)) { say.dataset.k = 'miss'; say.textContent = 'Mark every region first.'; return; }
    let wrong = 0;
    this.root.querySelectorAll('.zone').forEach((el, i) => {
      const ok = this.marks[i] === this.zones[i].kind;
      if (!ok) wrong++;
      el.dataset.v = '';
      void el.offsetWidth;   // restart the flash on a second miss
      el.dataset.v = ok ? 'good' : 'bad';
    });
    if (wrong) {
      say.dataset.k = 'miss';
      say.textContent = `${wrong} not right yet. Compare the spacing with the average.`;
      return;
    }
    this.roundWon = true;
    say.dataset.k = 'good';
    this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
    this.root.querySelector('.chk').disabled = true;
    if (this.roundNo === ROUNDS.length - 1) {
      this.allWon = true;
      say.textContent = 'All four tubes marked right.';
      finishGame(this);
      this.quill?.perform('hop');
    } else {
      say.textContent = 'All right.';
      this.root.querySelector('.next').dataset.on = '1';
      this.quill?.speak(this.roundNo === 2 ? 'Watch the piston next.' : 'Right.', 2500);
    }
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= ROUNDS.length - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  paint() {
    const cv = this.root?.querySelector('.tube canvas');
    if (!cv) return;
    const m = this.model();
    // zones follow the canvas width (portrait and landscape differ)
    this.root.querySelectorAll('.zone').forEach((el, i) => {
      const z = m.zones[i];
      if (!z) return;
      el.style.left = `${z.l}px`;
      el.style.width = `${z.w}px`;
    });
    const H = Math.max(140, Math.round(cv.parentElement?.clientHeight || PHONE_TUBE_H));
    cv.width = Math.round(m.W * DPR); cv.height = H * DPR;
    cv.style.width = `${m.W}px`; cv.style.height = `${H}px`;
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, m.W, H);
    drawParticleStrip(ctx, this.colors, { x: m.x, y: STRIP_Y, w: m.w, h: H - STRIP_Y - 4, field: m.field, t: m.t, piston: true,
      densityShade: true, spacing: m.spacing, r: m.dot, seed: 3 + this.roundNo });
  }

  refreshTheme() { if (this.root?.querySelector('.tube canvas')) { this.colors = loadColors(this.root); this.paint(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.chk')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
