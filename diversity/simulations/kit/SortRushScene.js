import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Sort rush": a real-time catcher, not a turn-based quiz. Specimens fall
// from the top of the screen, sometimes several at once. The oldest one still
// falling (highlighted with a glowing outline - it never freezes, it keeps
// falling and swaying the whole time) is the current target: tap the bin its
// evidence points to, and it flies into that bin. Get it wrong and nothing is
// lost except the streak - the specimen just keeps falling and is still the
// target, so a wrong guess costs a beat, not a life. Only a specimen that
// reaches the ground uncaught costs a life, whether or not it was the current
// target yet.
//
// One tap, one decision - earlier versions asked for a "catch" tap (freeze it
// in mid-air) before the "which bin" tap; two actions for one choice read as
// fiddly rather than arcade-fast, so this version drops the catch step
// entirely and always resolves a bin tap against whichever specimen has been
// falling longest.
//
// Motion is pure CSS (one `sr-fall` animation per specimen, from spawn to the
// ground) so several can fall independently between paints without a frame
// loop: a still-falling item gets a fresh `animation-delay: -<elapsed>ms` on
// every re-render, which resumes a freshly re-rendered element at the same
// point in its fall (the same trick a re-painted `<video>` scrub bar would
// need - not literally the same element, same visible motion). The ground
// hit is `animationend` on that same animation, exactly like Conveyor's
// belt-exit miss.
//
// The fall queue is built bin-by-bin, round-robin (`_buildQueue()`), not a
// flat shuffle-and-slice: this course's kingdoms have wildly uneven organism
// counts (Monera has 2, Animalia has 17+), so a flat shuffle could - and by
// player report, did - hand back long runs from whichever bin happens to be
// biggest, reading as "the kingdoms never change" even though the pool really
// was random. Round-robin guarantees every bin gets a turn before any bin
// repeats.
//
// CONFIG: { ariaLabel, title?, pool: [organism ids], rounds? (16), lives? (3),
//   maxOnScreen? (3), baseDur? (5200ms), minDur? (2200ms), spawnEvery? (1900ms),
//   minSpawnEvery? (850ms), cols? (bins per row),
//   bins: [ groupId | { id, label, groups: [groupIds], evidence?, face? } ] }
// (same bin shape as Conveyor, so a course can share one bin list between them)
export const SORT_RUSH_CSS = `
.sr-sky { position:relative; flex:1 1 auto; min-height:230px; border-radius:var(--sim-radius-lg); overflow:hidden;
  background:radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--sim-glass) 30%, transparent), transparent 45%),
    linear-gradient(180deg, color-mix(in srgb, var(--sim-accent) 32%, var(--sim-bg-deep)) 0%, color-mix(in srgb, var(--sim-accent) 10%, var(--sim-bg-deep)) 55%, var(--sim-bg-deep) 100%);
  border:5px solid var(--sim-stroke);
  box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--sim-label) 6%, transparent), inset 0 0 24px color-mix(in srgb, var(--sim-stroke) 45%, transparent), 0 6px 0 0 color-mix(in srgb, var(--sim-stroke) 70%, transparent); }
.sr-sky::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background-image:radial-gradient(color-mix(in srgb, var(--sim-label) 22%, transparent) 1.5px, transparent 1.5px);
  background-size:26px 26px; }
/* Cabinet rivets - a purely decorative "console bezel" cue, cheap in CSS: one
   pseudo-element, four identical corner dots via repeated background layers
   rather than four extra DOM nodes. */
.sr-sky::after { content:''; position:absolute; inset:9px; pointer-events:none; border-radius:inherit;
  background-image:radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px),
    radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px),
    radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px),
    radial-gradient(circle, color-mix(in srgb, var(--sim-label) 45%, transparent) 0 3px, transparent 3px);
  background-size:8px 8px; background-repeat:no-repeat;
  background-position:0 0, 100% 0, 0 100%, 100% 100%; }
.sr-cloud { position:absolute; left:-90px; width:64px; height:20px; border-radius:20px; background:color-mix(in srgb, var(--sim-label) 16%, transparent);
  box-shadow:18px -7px 0 -2px color-mix(in srgb, var(--sim-label) 16%, transparent), -16px -3px 0 -5px color-mix(in srgb, var(--sim-label) 12%, transparent);
  animation:sr-drift 20s linear infinite; }
/* Negative delays start each cloud already mid-drift (well inside the frame) the instant
   the scene mounts, instead of at the 0% keyframe (off-frame by design, since it drifts in
   from the left) - a layout check that measures the very first paint would otherwise always
   catch a just-mounted cloud sitting off-frame, which is correct for that instant but not a
   real clipping bug (the parent's overflow:hidden always hides it there; it drifts fully into
   view within the first second). */
.sr-cloud.c1 { top:8%; animation-delay:-6s; }
.sr-cloud.c2 { top:34%; animation-duration:28s; animation-delay:-14s; transform:scale(.7); opacity:.8; }
.sr-cloud.c3 { top:14%; animation-duration:24s; animation-delay:-10s; transform:scale(.55); opacity:.6; }
.sr-ground { position:absolute; left:0; right:0; bottom:0; height:22%; pointer-events:none;
  background:linear-gradient(180deg, transparent, color-mix(in srgb, var(--sim-warning) 32%, transparent) 85%);
  border-top:3px dashed color-mix(in srgb, var(--sim-warning) 70%, var(--sim-stroke)); }
.sr-item { position:absolute; top:-16%; width:100px; margin-left:-50px; display:flex; flex-direction:column; align-items:center; gap:2px; padding:var(--sim-space-1); border:2.5px solid var(--t); border-radius:16px; background:var(--sim-bg-deep); box-shadow:0 4px 0 var(--t), 0 7px 12px -2px color-mix(in srgb, var(--t) 65%, transparent); font-weight:800; font-size:11.5px; line-height:1.1; text-align:center; overflow-wrap:anywhere; z-index:1; overflow:hidden;
  animation-name:sr-fall, sr-sway; animation-timing-function:linear, ease-in-out; animation-iteration-count:1, infinite; animation-fill-mode:forwards, none; }
.sr-item::before { content:''; position:absolute; left:8%; right:8%; top:5%; height:38%; border-radius:50%;
  background:linear-gradient(180deg, color-mix(in srgb, var(--sim-glass) 65%, transparent), transparent); pointer-events:none; }
.sr-item .ek-av { width:42px; height:42px; }
.sr-item span { position:relative; }
.sr-item.sr-target { outline:3px solid var(--sim-accent); outline-offset:2px; box-shadow:0 4px 0 var(--t), 0 0 0 7px color-mix(in srgb, var(--sim-accent) 32%, transparent); z-index:2; }
.sr-stats { display:flex; align-items:center; gap:var(--sim-space-2); font-weight:800; font-size:var(--sim-text-md); flex-wrap:wrap; }
.sr-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 13px; border-radius:var(--sim-radius-sm); font-weight:900; font-family:var(--sim-font-display); letter-spacing:.02em;
  border:2.5px solid var(--c,var(--sim-stroke)); color:var(--c,var(--sim-label)); background:var(--sim-bg-deep);
  text-shadow:0 0 8px color-mix(in srgb, var(--c,var(--sim-accent)) 55%, transparent);
  box-shadow:inset 0 2px 4px color-mix(in srgb, var(--sim-stroke) 45%, transparent), 0 2px 0 0 color-mix(in srgb, var(--c,var(--sim-stroke)) 55%, transparent); }
.sr-bins { display:grid; grid-template-columns:repeat(var(--cols,5),minmax(0,1fr)); gap:var(--sim-space-2); }
.sr-bin { position:relative; overflow:visible; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; min-height:66px; padding:var(--sim-space-1); text-align:center; line-height:1.1; font-size:var(--sim-text-sm); overflow-wrap:anywhere; border-width:3px; border-color:var(--t); box-shadow:0 4px 0 0 color-mix(in srgb, var(--t) 55%, transparent); transition:transform .1s; }
/* Phone: three bins to a row, and a name is never split mid-word. */
.sim-dom-root--portrait .sr-bins { grid-template-columns:repeat(3,minmax(0,1fr)); }
.sr-bin span { overflow-wrap:normal; word-break:normal; }
.sr-bin:active { transform:translateY(3px); box-shadow:0 1px 0 0 color-mix(in srgb, var(--t) 55%, transparent); }
.sr-bin::before { content:''; position:absolute; left:10%; right:10%; top:6%; height:30%; border-radius:999px;
  background:linear-gradient(180deg, color-mix(in srgb, var(--sim-glass) 45%, transparent), transparent); pointer-events:none; }
.sr-bin .ek-av { width:30px; height:30px; }
.sr-bin.sr-ok { background:var(--sim-success); color:var(--sim-bg-deep); transform:scale(1.06); animation:gm-pop .3s ease-out; }
.sr-plus { position:absolute; top:-6px; left:50%; font-weight:900; font-size:var(--sim-text-lg); color:var(--sim-success); animation:sr-float .55s ease-out forwards; pointer-events:none; text-shadow:0 1px 0 var(--sim-bg-deep); }
.sr-sky.sr-shake { animation:ek-shake .35s; }
/* Menu/end screens vertically center their content instead of pinning it to
   the top with a gm-grow spacer pushing the button to the bottom - at this
   scene's widescreen design size (see the class's own WIDTH/HEIGHT comment),
   a fullWidth slide can render this box considerably taller than the kit
   default, and a spacer sized for that would leave a huge, broken-looking gap. */
.sr-menu { flex:1 1 auto; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; gap:var(--sim-space-3); text-align:center; }
.sr-menu > * { max-width:520px; }
.sr-menu .gm-msg { text-align:left; }
.sr-confetti-wrap { position:relative; height:0; overflow:visible; }
.sr-confetti { position:absolute; top:-6px; width:9px; height:15px; border-radius:2px; opacity:.95; animation:sr-confetti-fall 1.15s ease-in forwards; }
.sr-confetti:nth-child(1) { left:6%; background:var(--sim-series-1); animation-delay:0ms; }
.sr-confetti:nth-child(2) { left:18%; background:var(--sim-series-2); animation-delay:60ms; transform:rotate(20deg); }
.sr-confetti:nth-child(3) { left:32%; background:var(--sim-series-3); animation-delay:20ms; }
.sr-confetti:nth-child(4) { left:46%; background:var(--sim-series-4); animation-delay:100ms; transform:rotate(-15deg); }
.sr-confetti:nth-child(5) { left:58%; background:var(--sim-series-6); animation-delay:40ms; }
.sr-confetti:nth-child(6) { left:70%; background:var(--sim-series-5); animation-delay:80ms; transform:rotate(12deg); }
.sr-confetti:nth-child(7) { left:82%; background:var(--sim-series-7); animation-delay:10ms; }
.sr-confetti:nth-child(8) { left:92%; background:var(--sim-series-8); animation-delay:120ms; transform:rotate(-20deg); }
@keyframes sr-fall { from { top:-16%; } to { top:100%; } }
@keyframes sr-sway { 0%,100% { transform:rotate(var(--rot,-4deg)); } 50% { transform:rotate(calc(var(--rot,-4deg) * -1)); } }
@keyframes sr-drift { from { left:-90px; } to { left:110%; } }
@keyframes sr-float { from { opacity:1; transform:translate(-50%,0); } to { opacity:0; transform:translate(-50%,-26px); } }
@keyframes sr-confetti-fall { from { transform:translateY(0) rotate(0deg); opacity:1; } to { transform:translateY(150px) rotate(340deg); opacity:0; } }
@media (prefers-reduced-motion: reduce) { .sr-item { animation:none !important; top:10%; } .sr-cloud { animation:none !important; } .sr-sky.sr-shake { animation:none !important; } .sr-confetti { animation:none !important; display:none; } }
`;

export class SortRushScene extends FieldGuideScene {
  static CSS = SORT_RUSH_CSS;
  // Wider/shorter than the kit default (620x520, near-square) - authored as a
  // `content-block@1` slide with `simulation.fullWidth: true` (no side text
  // to share the row with), and a near-square design scaled up to fill a wide
  // column comes out absurdly tall (990px+ at ~1180px wide) purely because
  // the aspect ratio demands it, not because the game needs that height. A
  // proper widescreen canvas keeps the scaled-up render's height reasonable.
  static WIDTH = 1100;
  static HEIGHT = 300;

  init() {
    this.binDefs = (this.cfg.bins || []).map((b) => {
      const d = typeof b === 'string' ? { id: b, groups: [b] } : b;
      const g = this.fg.group(d.groups[0]);
      return { id: d.id, groups: d.groups, label: d.label || (g && g.label) || d.id, evidence: d.evidence || '', face: d.face || this.fg.groupFace(d.groups[0]) };
    });
    this.best = 0;
    this.stage = 'menu';
    this._nextId = 1;
  }

  /** Round-robin across bins, one organism per bin per pass, each pass in a
   *  freshly shuffled bin order - guarantees every bin appears before any bin
   *  repeats, regardless of how unevenly the pool is split between bins. */
  _buildQueue(pool) {
    const buckets = this.binDefs.map((b) => shuffle(pool.filter((o) => b.groups.includes(o.group))));
    const rounds = this.cfg.rounds || 16;
    const queue = [];
    for (let pass = 0; queue.length < rounds; pass++) {
      const order = shuffle(buckets.map((_, i) => i));
      let addedAny = false;
      for (const bi of order) {
        const bucket = buckets[bi];
        if (pass < bucket.length) {
          queue.push(bucket[pass]);
          addedAny = true;
          if (queue.length >= rounds) break;
        }
      }
      if (!addedAny) break; // every bin's pool exhausted
    }
    return queue;
  }

  _start() {
    // Re-shuffle the bin ORDER (not the bins themselves - it's still all 5
    // kingdoms every game, that's the taxonomy) on every fresh game, so the
    // row of bins isn't a static layout a student can learn by position
    // alone across repeat plays - each Start/Play again puts them somewhere
    // new, so reading the label still matters every time.
    this.binDefs = shuffle(this.binDefs);
    const pool = this.fg.orgs(this.cfg.pool || []).filter((o) => this.binDefs.some((b) => b.groups.includes(o.group)));
    this.queue = this._buildQueue(pool);
    this.lives = this.cfg.lives || 3;
    this.spawned = 0;
    this.right = 0;
    this.score = 0;
    this.streak = 0;
    this.active = [];
    this.msg = '';
    this.okBin = null;
    this.stage = 'play';
    this._spawnOne();
    this._scheduleSpawn();
    this.paint();
  }

  act(name, d) {
    if (name === 'start') return this._start();
    if (name === 'menu') { this.stage = 'menu'; return this.paint(); }
    if (name === 'bin') return this._place(d.id);
    return undefined;
  }

  _scheduleSpawn() {
    if (this.stage !== 'play') return;
    const every = Math.max(this.cfg.minSpawnEvery || 850, (this.cfg.spawnEvery || 1900) - this.spawned * 70);
    this._spawnTimer = setTimeout(() => { this._spawnOne(); this._scheduleSpawn(); }, every);
  }

  _spawnOne() {
    if (this.stage !== 'play') return;
    if (this.spawned >= this.queue.length) return;
    if (this.active.length >= (this.cfg.maxOnScreen || 3)) return; // still scheduled again; retries next tick
    const org = this.queue[this.spawned++];
    const dur = Math.max(this.cfg.minDur || 2200, (this.cfg.baseDur || 5200) - this.spawned * 110);
    this.active.push({ id: this._nextId++, org, dur, x: 10 + Math.random() * 80, spawnedAt: performance.now(), firstTry: true });
    this.paint();
  }

  /** The current target: always the specimen that's been falling longest. */
  _target() { return this.active[0] || null; }

  _place(binId) {
    if (this.stage !== 'play') return;
    const it = this._target();
    const bin = this.binDefs.find((b) => b.id === binId);
    if (!it) { this.msg = 'Wait for one to fall, then tap its bin.'; return this.paint(); }
    if (!bin) return;
    if (bin.groups.includes(it.org.group)) {
      const gain = (it.firstTry ? 10 : 6) + Math.min(this.streak, 6) * 2;
      this.right++;
      this.streak++;
      this.score += gain;
      this.lastGain = gain;
      this.award(it.org.id, it.firstTry ? 'silver' : 'bronze');
      this.active = this.active.filter((x) => x !== it);
      this.msg = '';
      this.okBin = binId;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.okBin = null; if (this.board) this.paint(); }, 550);
    } else {
      it.firstTry = false;
      this.streak = 0;
      this.msg = `<b>Not ${esc(bin.label)}.</b> ${this._why(it.org)} It's still falling - try another bin.`;
      this._flashShake();
    }
    this.paint();
    this._checkEnd();
  }

  _flashShake() {
    this.shake = true;
    clearTimeout(this._shakeTimer);
    this._shakeTimer = setTimeout(() => { this.shake = false; if (this.board) this.paint(); }, 350);
  }

  _miss(id) {
    if (this.stage !== 'play') return;
    const it = this.active.find((x) => x.id === id);
    if (!it) return;
    this.active = this.active.filter((x) => x !== it);
    this.lives--;
    this.streak = 0;
    this.msg = `<b>Got away.</b> ${this._why(it.org)}`;
    this._flashShake();
    this.paint();
    this._checkEnd();
  }

  _checkEnd() {
    if (this.stage !== 'play') return;
    if (this.lives <= 0) { this.stage = 'end'; this._finish(); this.paint(); return; }
    if (this.spawned >= this.queue.length && this.active.length === 0) { this.stage = 'end'; this._finish(); this.paint(); }
  }

  _finish() {
    clearTimeout(this._spawnTimer);
    clearTimeout(this._toastTimer);
    this.best = Math.max(this.best, this.score);
    this.won = this.lives > 0 && this.right === this.spawned;
    if (this.coll && this.lives > 0 && this.right / Math.max(1, this.spawned) >= 0.7) { this.pack(1); this.coll.bump('sortrush:wins'); this.packed = true; } else this.packed = false;
  }

  /** Why an organism goes where it does: the evidence that decides its group (same as Conveyor). */
  _why(o) {
    const bin = this.binDefs.find((b) => b.groups.includes(o.group));
    const ev = bin && bin.evidence ? [bin.evidence] : this.fg.evidence(o.group);
    return `${esc(o.name)}: ${ev.length ? esc(ev.join(' + ')) : esc(o.note || '')}: ${esc(bin ? bin.label : this.groupName(o.group))}.`;
  }

  _binsHtml() {
    const cols = this.cfg.cols || Math.min(5, this.binDefs.length);
    return `<div class="sr-bins" style="--cols:${cols}">${this.binDefs.map((b) => {
      const t = b.face ? b.face.tone : 1;
      const ok = this.okBin === b.id;
      const plus = ok ? `<i class="sr-plus">+${this.lastGain}</i>` : '';
      return this.btn(`${plus}${b.face ? this.av(b.face, 28) : ''}<span>${esc(b.label)}</span>`, 'bin', { id: b.id },
        `ek-chipbtn sr-bin${ok ? ' sr-ok' : ''}`, `style="--t:var(--sim-series-${t})"`);
    }).join('')}</div>`;
  }

  view() {
    const title = this.cfg.title || 'Sort rush';
    if (this.stage === 'menu') {
      return `${this.head(title)}<div class="sr-menu"><p class="gm-msg">Specimens fall from the top. Tap the kingdom of the lit one before it lands. A wrong bin only breaks your streak, and a specimen that lands costs a life.</p>
        <p class="gm-h2">${this.cfg.rounds || 16} specimens · ${this.cfg.lives || 3} lives${this.best ? ` · best score ${this.best}` : ''}</p>
        <div class="ek-foot">${this.btn('Start', 'start', {}, 'ek-btn ek-run', ' data-focus="1"')}</div></div>`;
    }
    if (this.stage === 'end') {
      return `${this.head(title)}<div class="sr-menu"><div class="gm-big gm-pop">${this.right} of ${this.spawned} caught</div>
        <p class="gm-msg ${this.lives > 0 ? 'gm-good' : 'gm-bad'}">Score <b>${this.score}</b>${this.packed ? ' · <b>+1 card pack</b> for your collection' : ''}. ${this.lives <= 0 ? 'Out of lives. You can try again.' : (this.won ? 'Perfect run!' : 'Nice sorting.')}</p>
        <div class="ek-foot">${this.btn('Play again', 'menu', {}, 'ek-btn ek-run', ' data-focus="1"')}</div></div>`;
    }
    const now = performance.now();
    const target = this._target();
    const items = this.active.map((it) => {
      const rot = ((it.id * 47) % 15) - 7; // deterministic small tilt per specimen, for character
      const style = `left:${it.x}%; --rot:${rot}deg; animation-duration:${it.dur}ms, 1300ms; animation-delay:-${now - it.spawnedAt}ms, 0ms;`;
      return `<div class="sr-item${it === target ? ' sr-target' : ''}" data-item="${it.id}" style="--t:var(--sim-series-${it.org.tone});${style}">${this.av(it.org, 42)}<span>${esc(it.org.name)}</span></div>`;
    }).join('');
    const stats = `<div class="sr-stats">${this.hearts(this.lives, this.cfg.lives || 3)}<span class="sr-chip" style="--c:var(--sim-accent)">${this.score}</span><span class="sr-chip" style="--c:var(--sim-series-2)">Streak ${this.streak}</span></div>`;
    const hint = this.msg || (target ? `Tap the bin for the lit specimen (${esc(target.org.name)}).` : 'Waiting for the next specimen...');
    return `${this.head(title, stats)}
      <div class="sr-sky${this.shake ? ' sr-shake' : ''}" aria-live="polite">
        <i class="sr-cloud c1"></i><i class="sr-cloud c2"></i><i class="sr-cloud c3"></i>
        ${items}
        <div class="sr-ground"></div>
      </div>
      <p class="gm-msg ${this.msg ? 'gm-bad' : ''}" style="min-height:2.6em">${hint}</p>
      ${this._binsHtml()}`;
  }

  async setup() {
    await super.setup();
    // a specimen that finishes falling without being caught is a miss
    this.board?.addEventListener('animationend', (e) => { if (e.animationName === 'sr-fall') this._miss(Number(e.target.dataset.item)); });
  }

  destroy() {
    clearTimeout(this._spawnTimer);
    clearTimeout(this._toastTimer);
    super.destroy();
  }
}
