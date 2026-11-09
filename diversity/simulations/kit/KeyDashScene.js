import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Key dash": an endless-lane runner through a dichotomous key, not a static
// key board. One organism at a time races down the track; a yes/no gate falls
// toward the runner asking about one of the traits that puts this organism in
// its group (the same facts KeyBuilder's static key board tests, just timed).
// Steer into the correct lane (No / Yes) before the gate arrives; get every
// gate right and the organism is keyed out, next one starts, faster. A wrong
// lane costs a life but re-runs the SAME gate rather than restarting the
// organism from scratch - it is the timing that punishes, not the retry.
//
// Motion is the same pure-CSS trick as Sort Rush (see that file's header):
// one `kd-fall` animation per gate, resumed on re-render via a negative
// `animation-delay` computed from real elapsed time, so `GameScene.paint()`
// replacing the whole board on every tap never restarts the fall.
//
// CONFIG: { ariaLabel, title?, pool: [organism ids], rounds? (10), lives? (3),
//   baseDur? (4200ms), minDur? (1900ms) }
export const KEY_DASH_CSS = `
.kd-track { position:relative; flex:1 1 auto; min-height:220px; border-radius:var(--sim-radius-lg); overflow:hidden;
  background:radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--sim-glass) 26%, transparent), transparent 45%),
    linear-gradient(180deg, color-mix(in srgb, var(--sim-series-5) 28%, var(--sim-bg-deep)) 0%, var(--sim-bg-deep) 80%);
  border:5px solid var(--sim-stroke);
  box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--sim-label) 6%, transparent), inset 0 0 24px color-mix(in srgb, var(--sim-stroke) 45%, transparent), 0 6px 0 0 color-mix(in srgb, var(--sim-stroke) 70%, transparent); }
.kd-track::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.45;
  background-image:radial-gradient(color-mix(in srgb, var(--sim-label) 22%, transparent) 1.5px, transparent 1.5px); background-size:26px 26px; }
.kd-track::after { content:''; position:absolute; inset:9px; pointer-events:none; border-radius:inherit;
  background-image:radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px),
    radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px),
    radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px),
    radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px);
  background-size:8px 8px; background-repeat:no-repeat;
  background-position:0 0, 100% 0, 0 100%, 100% 100%; }
.kd-rail { position:absolute; top:0; bottom:0; width:5px; background:color-mix(in srgb, var(--sim-label) 18%, transparent); }
.kd-rail.l { left:8%; } .kd-rail.r { right:8%; }
.kd-road { position:absolute; left:50%; top:0; bottom:0; width:8px; margin-left:-4px;
  background-image:repeating-linear-gradient(180deg, color-mix(in srgb, var(--sim-label) 40%, transparent) 0 16px, transparent 16px 32px);
  background-size:8px 32px; animation:kd-road-run 500ms linear infinite; opacity:.7; }
.kd-gate { position:absolute; left:6%; right:6%; top:-24%; height:56px; display:flex; gap:5%; }
/* A physical toll-gate arm, not a floating label pill: a solid barrel-shaped
   bar with diagonal hazard striping (own color per lane) and an end post, so
   it reads as something the runner actually crashes through or is stopped
   by - the same shape/weight for both lanes (only color/icon differ, as
   before) so neither side visually telegraphs "this one is safe". */
.kd-gate > span { position:relative; overflow:hidden; flex:1; display:flex; align-items:center; justify-content:center; gap:4px; border-radius:10px; font-weight:900; font-size:var(--sim-text-md); border:3px solid var(--sim-stroke); box-shadow:0 4px 0 0 color-mix(in srgb, currentColor 45%, transparent); }
.kd-gate > span::before { content:''; position:absolute; inset:0; pointer-events:none;
  background-image:repeating-linear-gradient(135deg, color-mix(in srgb, currentColor 38%, transparent) 0 10px, transparent 10px 20px); }
.kd-gate > span::after { content:''; position:absolute; top:-5px; bottom:-5px; left:2px; width:7px; border-radius:3px;
  background:color-mix(in srgb, currentColor 65%, var(--sim-stroke)); box-shadow:0 0 0 1px color-mix(in srgb, var(--sim-stroke) 60%, transparent); }
.kd-gate .kd-no { background:color-mix(in srgb, var(--sim-warning) 30%, var(--sim-bg-deep)); border-color:var(--sim-warning); color:var(--sim-warning); }
.kd-gate .kd-yes { background:color-mix(in srgb, var(--sim-success) 30%, var(--sim-bg-deep)); border-color:var(--sim-success); color:var(--sim-success); }
.kd-runner { position:absolute; bottom:8%; left:50%; width:56px; height:56px; margin-left:-28px; transition:transform .18s cubic-bezier(.34,1.56,.64,1); animation:kd-bob .5s ease-in-out infinite; z-index:1; }
.kd-runner.kd-lean-no { transform:translateX(-58%) rotate(-8deg); }
.kd-runner.kd-lean-yes { transform:translateX(58%) rotate(8deg); }
.kd-runner .ek-av { width:56px; height:56px; filter:drop-shadow(0 6px 4px color-mix(in srgb, var(--sim-bg-deep) 60%, transparent)); }
/* The moment a gate reaches the runner: a burst on a correct dodge-through, a
   flash+recoil on a collision. Anchored at the runner's own fixed spot (not
   the falling gate element, which has usually already animated past it) so
   the effect always lands exactly where the action is. */
.kd-runner.kd-burst { animation:kd-bob .5s ease-in-out infinite, kd-hop .4s ease-out; }
.kd-runner.kd-crash { animation:kd-recoil .4s ease-out; }
.kd-impact { position:absolute; bottom:8%; left:50%; width:0; height:0; pointer-events:none; z-index:2; }
.kd-flash { position:absolute; left:50%; top:50%; width:130px; height:130px; margin:-65px 0 0 -65px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb, var(--sim-error) 70%, var(--sim-glass)) 0%, color-mix(in srgb, var(--sim-error) 60%, transparent) 45%, transparent 72%);
  animation:kd-flash .4s ease-out forwards; }
.kd-shard { position:absolute; left:50%; top:50%; width:13px; height:13px; margin:-6.5px 0 0 -6.5px; border-radius:3px;
  background:var(--sim-success); box-shadow:0 0 6px currentColor; animation:kd-burst .45s ease-out forwards; }
.kd-shard:nth-child(1) { --dx:-46px; --dy:-38px; background:var(--sim-series-1); }
.kd-shard:nth-child(2) { --dx:0px; --dy:-54px; background:var(--sim-series-2); }
.kd-shard:nth-child(3) { --dx:46px; --dy:-38px; background:var(--sim-series-3); }
.kd-shard:nth-child(4) { --dx:-54px; --dy:6px; background:var(--sim-series-4); }
.kd-shard:nth-child(5) { --dx:54px; --dy:6px; background:var(--sim-series-6); }
.kd-shard:nth-child(6) { --dx:0px; --dy:34px; background:var(--sim-series-5); }
.kd-who { display:flex; align-items:center; gap:var(--sim-space-2); font-weight:800; }
.kd-who .ek-av { width:40px; height:40px; }
.kd-lanes { display:grid; grid-template-columns:1fr 1fr; gap:var(--sim-space-2); }
.kd-lane { position:relative; overflow:hidden; text-align:center; font-size:var(--sim-text-lg); padding:var(--sim-space-2); border-width:3px; }
.kd-lane::before { content:''; position:absolute; left:10%; right:10%; top:8%; height:30%; border-radius:999px;
  background:linear-gradient(180deg, color-mix(in srgb, var(--sim-glass) 40%, transparent), transparent); pointer-events:none; }
.kd-lane.kd-no { border-color:var(--sim-warning); box-shadow:0 4px 0 0 color-mix(in srgb, var(--sim-warning) 50%, transparent); }
.kd-lane.kd-yes { border-color:var(--sim-success); box-shadow:0 4px 0 0 color-mix(in srgb, var(--sim-success) 50%, transparent); }
.kd-lane.kd-picked { outline:3px solid var(--sim-accent); outline-offset:2px; }
.kd-stats { display:flex; align-items:center; gap:var(--sim-space-2); font-weight:800; font-size:var(--sim-text-md); flex-wrap:wrap; }
.kd-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 13px; border-radius:var(--sim-radius-sm); font-weight:900; font-family:var(--sim-font-display); letter-spacing:.02em;
  border:2.5px solid var(--c,var(--sim-stroke)); color:var(--c,var(--sim-label)); background:var(--sim-bg-deep);
  text-shadow:0 0 8px color-mix(in srgb, var(--c,var(--sim-accent)) 55%, transparent);
  box-shadow:inset 0 2px 4px color-mix(in srgb, var(--sim-stroke) 45%, transparent), 0 2px 0 0 color-mix(in srgb, var(--c,var(--sim-stroke)) 55%, transparent); }
.kd-track.kd-shake { animation:ek-shake .35s; }
/* See SortRushScene's own .sr-menu comment - same widescreen-menu centering fix. */
.kd-menu { flex:1 1 auto; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; gap:var(--sim-space-3); text-align:center; }
.kd-menu > * { max-width:520px; }
.kd-menu .gm-msg { text-align:left; }
.kd-plus { position:absolute; bottom:36%; left:50%; font-weight:900; font-size:var(--sim-text-xl); color:var(--sim-success); animation:sr-float-big .6s ease-out forwards; pointer-events:none; }
.kd-confetti-wrap { position:relative; height:0; overflow:visible; }
.kd-confetti { position:absolute; top:-6px; width:9px; height:15px; border-radius:2px; opacity:.95; animation:sr-confetti-fall 1.15s ease-in forwards; }
.kd-confetti:nth-child(1) { left:6%; background:var(--sim-series-1); animation-delay:0ms; }
.kd-confetti:nth-child(2) { left:18%; background:var(--sim-series-2); animation-delay:60ms; transform:rotate(20deg); }
.kd-confetti:nth-child(3) { left:32%; background:var(--sim-series-3); animation-delay:20ms; }
.kd-confetti:nth-child(4) { left:46%; background:var(--sim-series-4); animation-delay:100ms; transform:rotate(-15deg); }
.kd-confetti:nth-child(5) { left:58%; background:var(--sim-series-6); animation-delay:40ms; }
.kd-confetti:nth-child(6) { left:70%; background:var(--sim-series-5); animation-delay:80ms; transform:rotate(12deg); }
.kd-confetti:nth-child(7) { left:82%; background:var(--sim-series-7); animation-delay:10ms; }
.kd-confetti:nth-child(8) { left:92%; background:var(--sim-series-8); animation-delay:120ms; transform:rotate(-20deg); }
@keyframes kd-fall { from { top:-24%; } to { top:100%; } }
@keyframes kd-road-run { from { background-position:0 0; } to { background-position:0 32px; } }
@keyframes kd-bob { 0%,100% { margin-top:0; } 50% { margin-top:-5px; } }
@keyframes kd-hop { 0% { transform:translateY(0) scale(1); } 35% { transform:translateY(-24px) scale(1.18); } 100% { transform:translateY(0) scale(1); } }
@keyframes kd-recoil { 0% { transform:translateX(0) rotate(0); } 25% { transform:translateX(-14px) translateY(4px) rotate(-10deg); } 55% { transform:translateX(8px) rotate(6deg); } 100% { transform:translateX(0) rotate(0); } }
@keyframes kd-flash { from { opacity:1; transform:scale(.4); } to { opacity:0; transform:scale(1.6); } }
@keyframes kd-burst { from { opacity:1; transform:translate(0,0) scale(1); } to { opacity:0; transform:translate(var(--dx),var(--dy)) scale(.3); } }
@keyframes sr-float-big { from { opacity:1; transform:translate(-50%,0) scale(1); } to { opacity:0; transform:translate(-50%,-34px) scale(1.3); } }
@keyframes sr-confetti-fall { from { transform:translateY(0) rotate(0deg); opacity:1; } to { transform:translateY(150px) rotate(340deg); opacity:0; } }
@media (prefers-reduced-motion: reduce) { .kd-gate { animation:none !important; top:12%; } .kd-road { animation:none !important; } .kd-runner { animation:none !important; } .kd-track.kd-shake { animation:none !important; } .kd-confetti { animation:none !important; display:none; } .kd-flash, .kd-shard { animation:none !important; display:none; } }
`;

export class KeyDashScene extends FieldGuideScene {
  static CSS = KEY_DASH_CSS;
  // See SortRushScene's own WIDTH/HEIGHT comment - same widescreen reasoning
  // for the same `fullWidth: true` slide layout.
  static WIDTH = 1100;
  static HEIGHT = 300;

  init() {
    this.best = 0;
    this.stage = 'menu';
  }

  /** The organism's own key, as a run of yes/no forks (same evidence as `evidence()`, kept apart so each fork knows its expected side). */
  _forks(org) {
    const g = this.fg.group(org.group);
    if (!g) return [];
    const skip = new Set(['swallows', 'cells']);
    const forks = [
      ...g.all.filter((t) => !skip.has(t)).map((t) => ({ trait: t, yes: true })),
      ...g.none.map((t) => ({ trait: t, yes: false })),
    ];
    return forks.filter((f) => this.fg.trait(f.trait));
  }

  _start() {
    const pool = this.fg.orgs(this.cfg.pool || []).filter((o) => this._forks(o).length);
    this.queue = shuffle(pool).slice(0, this.cfg.rounds || 10);
    this.lives = this.cfg.lives || 3;
    this.oi = 0;
    this.fi = 0;
    this.correct = 0;
    this.score = 0;
    this.streak = 0;
    this.lane = null;
    this.msg = '';
    this.stage = 'play';
    this._loadOrg();
    this.paint();
  }

  _loadOrg() {
    this.org = this.queue[this.oi];
    this.forks = this.org ? this._forks(this.org) : [];
    this.fi = 0;
    this.orgClean = true;
    this._spawnGate();
  }

  _spawnGate() {
    const dur = Math.max(this.cfg.minDur || 1900, (this.cfg.baseDur || 4200) - this.correct * 90);
    this.gate = { dur, start: performance.now() };
    this.lane = null;
  }

  act(name, d) {
    if (name === 'start') return this._start();
    if (name === 'menu') { this.stage = 'menu'; return this.paint(); }
    if (name === 'lane') { if (this.stage === 'play') { this.lane = d.v; this.paint(); } return undefined; }
    return undefined;
  }

  /** The gate reaching the runner is a two-beat moment, not an instant state
   *  flip: first a short "impact" beat (a burst on a correct dodge-through, a
   *  flash+recoil on a collision - see the CSS for both), THEN the existing
   *  score/life/message resolution. Splitting it out is what gives the hit
   *  its own visible moment instead of the runner silently teleporting
   *  straight into the next gate or the retry message. */
  _arrive() {
    if (this.stage !== 'play') return;
    const fork = this.forks[this.fi];
    const picked = this.lane; // 'yes' | 'no' | null (never chose in time - always wrong)
    const correct = picked != null && (picked === 'yes') === fork.yes;
    this.impact = correct ? 'burst' : 'crash';
    this.stage = 'impact';
    this.paint();
    clearTimeout(this._impactTimer);
    this._impactTimer = setTimeout(() => this._resolveArrival(correct, fork), 380);
  }

  _resolveArrival(correct, fork) {
    this.impact = null;
    if (correct) {
      const gain = 10 + Math.min(this.streak, 6) * 2;
      this.correct++;
      this.streak++;
      this.score += gain;
      this.lastGain = gain;
      this.fi++;
      if (this.fi >= this.forks.length) return this._keyedOut();
      this._spawnGate();
      this.msg = '';
      this.stage = 'play';
      clearTimeout(this._plusTimer);
      this._plusTimer = setTimeout(() => { this.lastGain = null; if (this.board) this.paint(); }, 550);
      this.paint();
    } else {
      this.streak = 0;
      this.lives--;
      this.orgClean = false;
      const t = this.fg.trait(fork.trait);
      const say = this.fg.say(this.org, fork.trait);
      this.msg = `<b>Not quite.</b> ${esc(this.org.name)}: ${esc(say || (fork.yes ? t.yes : t.no))}`;
      this._flashShake();
      this.stage = 'pause';
      this.paint();
      this._t = setTimeout(() => {
        if (!this.board) return;
        if (this.lives <= 0) { this.stage = 'end'; this._finish(false); return this.paint(); }
        this.stage = 'play';
        this._spawnGate();
        this.msg = '';
        this.paint();
      }, 1300);
    }
  }

  _flashShake() {
    this.shake = true;
    clearTimeout(this._shakeTimer);
    this._shakeTimer = setTimeout(() => { this.shake = false; if (this.board) this.paint(); }, 350);
  }

  _keyedOut() {
    this.award(this.org.id, this.orgClean ? 'gold' : 'silver');
    this.msg = `<b>Done.</b> ${esc(this.org.name)}: ${esc(this.groupName(this.org.group))}.`;
    this.stage = 'pause';
    this.paint();
    this._t = setTimeout(() => {
      if (!this.board) return;
      this.oi++;
      this.msg = '';
      if (this.oi >= this.queue.length) { this.stage = 'end'; this._finish(true); return this.paint(); }
      this.stage = 'play';
      this._loadOrg();
      this.paint();
    }, 900);
  }

  _finish(won) {
    clearTimeout(this._t);
    this.best = Math.max(this.best, this.score);
    this.won = won;
    if (this.coll && won) { this.pack(1); this.coll.bump('keydash:wins'); this.packed = true; } else this.packed = false;
  }

  view() {
    const title = this.cfg.title || 'Key dash';
    if (this.stage === 'menu') {
      return `${this.head(title)}<div class="kd-menu"><p class="gm-msg">One organism at a time races down its own key. A yes or no gate falls toward it: steer into the right lane before it arrives. A wrong lane costs a life, and the gate asks again.</p>
        <p class="gm-h2">${this.cfg.rounds || 10} organisms · ${this.cfg.lives || 3} lives${this.best ? ` · best score ${this.best}` : ''}</p>
        <div class="ek-foot">${this.btn('Start', 'start', {}, 'ek-btn ek-run', ' data-focus="1"')}</div></div>`;
    }
    if (this.stage === 'end') {
      return `${this.head(title)}<div class="kd-menu"><div class="gm-big gm-pop">${this.oi}${this.won ? '' : '/' + this.queue.length} finished</div>
        <p class="gm-msg ${this.won ? 'gm-good' : 'gm-bad'}">Score <b>${this.score}</b>${this.packed ? ' · <b>+1 card pack</b> for your collection' : ''}. ${this.won ? 'Every key run clean!' : 'Out of lives. You can try again.'}</p>
        <div class="ek-foot">${this.btn('Play again', 'menu', {}, 'ek-btn ek-run', ' data-focus="1"')}</div></div>`;
    }
    const fork = this.forks[this.fi];
    const t = fork && this.fg.trait(fork.trait);
    const now = performance.now();
    const gateHtml = this.stage === 'play' && this.gate
      ? `<div class="kd-gate" style="animation:kd-fall ${this.gate.dur}ms linear forwards;animation-delay:-${(now - this.gate.start)}ms"><span class="kd-no">✕ No</span><span class="kd-yes">✓ Yes</span></div>`
      : '';
    const leanCls = this.lane === 'no' ? ' kd-lean-no' : this.lane === 'yes' ? ' kd-lean-yes' : '';
    const impactCls = this.impact === 'burst' ? ' kd-burst' : this.impact === 'crash' ? ' kd-crash' : '';
    const runner = `<div class="kd-runner${leanCls}${impactCls}">${this.av(this.org, 56)}</div>`;
    const impactFx = this.impact === 'burst'
      ? `<div class="kd-impact">${Array.from({ length: 6 }, () => '<i class="kd-shard"></i>').join('')}</div>`
      : this.impact === 'crash' ? `<div class="kd-impact"><i class="kd-flash"></i></div>` : '';
    const plus = this.lastGain ? `<i class="kd-plus">+${this.lastGain}</i>` : '';
    const stats = `<div class="kd-stats">${this.hearts(this.lives, this.cfg.lives || 3)}<span class="kd-chip" style="--c:var(--sim-accent)">${this.score}</span><span class="kd-chip" style="--c:var(--sim-series-2)">Streak ${this.streak}</span></div>`;
    return `${this.head(title, stats)}
      <div class="kd-who">${this.av(this.org, 40)}<span>${esc(this.org.name)}</span><span class="gm-h2">· question ${this.fi + 1} of ${this.forks.length}</span></div>
      <div class="kd-track${this.shake ? ' kd-shake' : ''}" aria-live="polite"><i class="kd-rail l"></i><i class="kd-rail r"></i><div class="kd-road"></div>${gateHtml}${runner}${impactFx}${plus}</div>
      <p class="gm-msg ${this.msg ? (this.stage === 'pause' && this.msg.includes('Keyed') ? 'gm-good' : (this.stage === 'pause' ? 'gm-bad' : '')) : ''}" style="min-height:2.6em">${this.msg || (t ? esc(t.ask) : '')}</p>
      <div class="kd-lanes">
        ${this.btn('No', 'lane', { v: 'no' }, `ek-chipbtn kd-lane kd-no${this.lane === 'no' ? ' kd-picked' : ''}`, this.stage !== 'play' ? ' disabled' : '')}
        ${this.btn('Yes', 'lane', { v: 'yes' }, `ek-chipbtn kd-lane kd-yes${this.lane === 'yes' ? ' kd-picked' : ''}`, this.stage !== 'play' ? ' disabled' : '')}
      </div>`;
  }

  async setup() {
    await super.setup();
    this.board?.addEventListener('animationend', (e) => { if (e.animationName === 'kd-fall') this._arrive(); });
  }

  destroy() {
    clearTimeout(this._t);
    clearTimeout(this._shakeTimer);
    clearTimeout(this._plusTimer);
    clearTimeout(this._impactTimer);
    super.destroy();
  }
}
