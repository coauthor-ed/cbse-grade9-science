/**
 * PitchMatchGame - mini-game for L05 (blk-l05-n03). Rebuilt 2026-11-03 (whole file; the old canvas dial
 * game is replaced by a GameFrame board in the WaveTunerGame / LabelWaveGame conventions).
 *
 * Five rounds. Each round a target sound is drawn as a density-against-time graph on green paper (purple):
 * its pitch is its frequency (how many repeats fit in the window), its loudness its amplitude (how far the
 * curve swings from the average line). The learner steps the frequency (Hz) and the amplitude with - and +;
 * their sound (blue) is drawn over the target on the same time axis and the same yOf. The round is won the
 * moment both equal the target: then the two curves lie on each other. Every list holds the target, so the
 * learner can always win; after many presses with no match, Try again puts the round back to its start.
 * Round 1 needs only the pitch, round 2 only the loudness, rounds 3-5 both.
 * After round 5: allWon, finishGame (which reads checkObjective), Quill hops once.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { plotSound, overlayCurve } from './TimbreArt.js';

const MINUS = '−', DPR = 2;
const FREQS = [100, 150, 200, 300, 400, 500];   // Hz
const LEVELS = 4;                               // amplitude steps 1..4
const WINDOW = 0.02;                            // seconds shown across the graph: 100 Hz = 2 repeats
const AMP = (lv) => 0.2 * lv;                   // swing on the paper (0.8 fills the room)
const ROUNDS = [
  { f: 3, a: 3, sf: 0, sa: 3 },
  { f: 2, a: 1, sf: 2, sa: 4 },
  { f: 5, a: 2, sf: 1, sa: 4 },
  { f: 1, a: 4, sf: 4, sa: 1 },
  { f: 4, a: 3, sf: 0, sa: 1 },
];
const N = ROUNDS.length, STUCK = 12;

const CSS = `
.pm .round { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; white-space: nowrap; }
.pm .dots { display: flex; gap: 6px; }
.pm .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); }
.pm .dot[data-on="1"] { background: var(--sim-good); border-color: var(--sim-good); }
.pm .board { position: relative; width: 100%; flex: 1 1 auto; min-height: 150px; }
.pm canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.pm .ctls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 22px; }
.pm { gap: 8px; }
.pm .ctl { display: flex; align-items: center; gap: 8px; }
.pm .tagp { display: inline-flex; align-items: center; min-height: 30px; padding: 0 12px; border-radius: 999px; font-weight: 800; font-size: 17px;
            border: 2px solid var(--sim-series-5); background: color-mix(in oklab, var(--sim-series-5) 16%, var(--sim-bg-surface)); }
.pm .tagp.ld { border-color: var(--sim-series-2); background: color-mix(in oklab, var(--sim-series-2) 18%, var(--sim-bg-surface)); }
.pm .ctl .btn { min-width: 48px; min-height: 48px; font-size: 24px; font-weight: 800; padding: 0; }
.pm .val { min-width: 112px; text-align: center; font-family: var(--sim-font-display); font-size: 20px; font-weight: 700; }
.pm .val.av { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; min-width: 100px; font-size: 16px; line-height: 1.1; }
.pm .meter { display: inline-flex; gap: 4px; }
.pm .seg { width: 10px; height: 20px; border-radius: 3px; border: 2px solid var(--sim-series-1); background: var(--sim-bg-surface); }
.pm .seg[data-on="1"] { background: var(--sim-series-1); }
.pm .keys { display: inline-flex; gap: 14px; align-items: center; }
.pm .key { display: inline-flex; align-items: center; gap: 6px; font-size: 17px; font-weight: 700; }
.pm .key i { display: inline-block; width: 22px; height: 0; border-top: 4px solid var(--sim-series-1); }
.pm .key i.tg { border-top-color: var(--sim-series-5); }
.pm .acts { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }
.pm .acts .btn { min-height: 48px; padding: 0 18px; font-weight: 800; font-size: 17px; }
.pm .next, .pm .again { display: none; }
.pm .next[data-on="1"], .pm .again[data-on="1"] { display: inline-flex; align-items: center; }
.pm .say { margin: 0; font-size: 17px; font-weight: 700; flex: 1 1 200px; }
.pm .say[data-k="good"] { color: var(--sim-good); }
.sim-dom-root--portrait .pm .board { flex: none; height: 150px; }
.sim-dom-root--portrait .pm .val { font-size: 18px; }
.sim-dom-root--portrait .pm .key, .sim-dom-root--portrait .pm .say, .sim-dom-root--portrait .pm .val.av { font-size: 15px; }
.sim-dom-root--portrait .pm .sub { padding-right: 62px; }
.sim-dom-root--portrait .pm .ctls { flex-direction: column; align-items: stretch; gap: 6px; }
.sim-dom-root--portrait .pm .ctl { justify-content: space-between; }
.sim-dom-root--portrait .pm .tagp { min-width: 80px; justify-content: center; }
.sim-dom-root--portrait .pm .ctl { gap: 6px; }
.sim-dom-root--portrait .pm .val { min-width: 84px; }
.sim-dom-root--portrait .pm .round { flex: 1 1 100%; }
.sim-dom-root--portrait .pm .acts .btn { flex: 1 1 auto; }
`;

export class PitchMatchGame extends GameBoard {
  static HEIGHT = 405;   // the full landscape frame (GAME_H): fits 1280x720
  static ARIA_LABEL = 'A five-round game. A target sound is drawn as a graph of density against time. Step the '
    + 'frequency, which sets the pitch, and the amplitude, which sets the loudness, with minus and plus buttons; '
    + 'your sound is drawn over the target. The round is won when both match and the two curves lie on each other.';
  static OBJECTIVE = { prompt: { en: "Set the frequency and the amplitude so your sound matches the target's pitch and loudness." } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.fi = 0;
    this.lv = 1;
    this.presses = 0;
    this.roundWon = false;
    this.allWon = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      onResize: () => this.paint(),
      html: `<div class="gm pm">
        <div class="gm-head"><p class="kicker">Pitch match</p><h2 class="ttl">Match the target sound</h2><p class="sub">Set the frequency and the amplitude with ${MINUS} and +.</p></div>
        <div class="board"><canvas aria-hidden="true"></canvas></div>
        <div class="ctls">
          <span class="ctl"><span class="tagp">pitch</span><button type="button" class="tap btn fm" aria-label="Lower frequency">${MINUS}</button><span class="val fv" aria-live="polite"></span><button type="button" class="tap btn fp" aria-label="Higher frequency">+</button></span>
          <span class="ctl"><span class="tagp ld">loudness</span><button type="button" class="tap btn am" aria-label="Smaller amplitude">${MINUS}</button><span class="val av" aria-live="polite"></span><button type="button" class="tap btn ap" aria-label="Bigger amplitude">+</button></span>
          <span class="keys"><span class="key"><i class="tg"></i>target</span><span class="key"><i></i>your sound</span></span>
        </div>
        <div class="acts"><div class="round"><span class="rtxt" aria-live="polite"></span><span class="dots">${Array.from({ length: N }, () => '<span class="dot"></span>').join('')}</span></div>
          <button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next round</button>
          <p class="say" aria-live="polite"></p></div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.next')) return;
    onTap(q('.next'), () => this.nextRound());
    onTap(q('.again'), () => this.deal());
    onTap(q('.fm'), () => this.press('f', -1));
    onTap(q('.fp'), () => this.press('f', 1));
    onTap(q('.am'), () => this.press('a', -1));
    onTap(q('.ap'), () => this.press('a', 1));
    this.deal();
    this.quill?.speak('Count the repeats. Check the height.', 4000);
  }

  get round() { return ROUNDS[this.roundNo]; }

  deal() {
    const q = (s) => this.root.querySelector(s), r = this.round;
    this.roundWon = false;
    this.presses = 0;
    this.fi = r.sf;
    this.lv = r.sa;
    q('.rtxt').textContent = `Round ${this.roundNo + 1} of ${N}`;
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    q('.next').dataset.on = '0';
    q('.again').dataset.on = '0';
    this.say('', '');
    this.show();
    this.paint();
  }

  say(text, k) { const s = this.root.querySelector('.say'); s.textContent = text; s.dataset.k = k; }

  press(which, d) {
    if (this.roundWon) return;
    const r = this.round;
    let line;
    if (which === 'f') {
      const ni = Math.max(0, Math.min(FREQS.length - 1, this.fi + d));
      if (ni === this.fi) return;
      this.fi = ni;
      line = d > 0 ? 'Higher frequency: higher pitch.' : 'Lower frequency: lower pitch.';
      line += this.fi === r.f ? ' Pitch matches.' : this.fi < r.f ? ' Still lower than the target.' : ' Higher than the target.';
    } else {
      const nl = Math.max(1, Math.min(LEVELS, this.lv + d));
      if (nl === this.lv) return;
      this.lv = nl;
      line = d > 0 ? 'Bigger amplitude: louder sound.' : 'Smaller amplitude: softer sound.';
      line += this.lv === r.a ? ' Loudness matches.' : this.lv < r.a ? ' Still softer than the target.' : ' Louder than the target.';
    }
    this.presses += 1;
    this.show();
    this.paint();
    if (this.fi === r.f && this.lv === r.a) { this.winRound(); return; }
    this.say(line, 'miss');
    if (this.presses >= STUCK) this.root.querySelector('.again').dataset.on = '1';
  }

  show() {
    const q = (s) => this.root.querySelector(s);
    q('.fv').textContent = `${FREQS[this.fi]} Hz`;
    q('.av').innerHTML = `amplitude<span class="meter" aria-hidden="true">${Array.from({ length: LEVELS }, (_, i) => `<span class="seg" data-on="${i < this.lv ? 1 : 0}"></span>`).join('')}</span>`;
    q('.av').setAttribute('aria-label', `amplitude ${this.lv} of ${LEVELS}`);
    q('.fm').disabled = this.roundWon || this.fi === 0;
    q('.fp').disabled = this.roundWon || this.fi === FREQS.length - 1;
    q('.am').disabled = this.roundWon || this.lv === 1;
    q('.ap').disabled = this.roundWon || this.lv === LEVELS;
  }

  winRound() {
    this.roundWon = true;
    this.show();
    this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
    this.root.querySelector('.again').dataset.on = '0';
    const text = 'Match: same pitch, same loudness. The curves lie on each other.';
    if (this.roundNo === N - 1) {
      this.allWon = true;
      this.say(`${text} All five rounds done.`, 'good');
      finishGame(this);
      this.quill?.perform('hop');
    } else {
      this.say(text, 'good');
      this.root.querySelector('.next').dataset.on = '1';
      this.quill?.speak('Right.', 2000);
    }
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= N - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  // ---- drawing
  paint() {
    const cv = this.root?.querySelector('.board canvas');
    if (!cv) return;
    this.colors = this.colors || loadColors(this.root);
    const c = this.colors;
    const W = Math.max(120, Math.round(cv.parentElement?.clientWidth || 300));
    const H = Math.max(60, Math.round(cv.parentElement?.clientHeight || 120));
    cv.width = W * DPR; cv.height = H * DPR;
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const r = this.round, x = 14, w = W - 36, y = 10, h = H - 22;
    const tc = FREQS[r.f] * WINDOW, yc = FREQS[this.fi] * WINDOW;
    // the kit graph carries the target (purple); your sound is drawn over it on the same yOf
    const g = plotSound(ctx, c, { x, y, w, h, kind: 'tone', cycles: tc, amp: AMP(r.a), tone: 5, cell: 8 });
    overlayCurve(ctx, c, g, { x, w, period: w / yc, amp: AMP(this.lv), fn: (u) => Math.sin(2 * Math.PI * u), col: c.s1, width: 3.5, alpha: 0.92 });
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
