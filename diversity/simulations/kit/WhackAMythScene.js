import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Does it decide?": a reflex tapper over facts that decide a group and facts
// that do not. Specimens rise from the ground, each showing one TRUE fact; tap
// the ones showing a fact that decides a group (kind: "evidence") and leave the
// others (kind: "lure" - true, but never decisive). Nothing is hit. A trait's kind never depends on
// which organism is showing it - a lure is a lure no matter whose fact it is.
//
// Loop: tap a lure = -1 life; let real evidence escape = -1 life; leave a
// lure alone = +3 and it shows. The queue alternates evidence/lure pairs so
// every run is a balanced discrimination exercise regardless of the data's
// kind ratios. Mistakes pause spawning for a beat and explain themselves on
// the notebook strip; the first slip of a run is a labeled "practice pardon".
//
// Motion keeps the pure-CSS resume trick (negative animation-delay on
// re-render) for the pop, the per-mole fuse bar and the impact FX. Expiry is
// wall-clock setTimeout instead of animationend, so reduced-motion (no
// animation, no animationend) still plays correctly.
//
// CONFIG: { ariaLabel, title?, pool: [organism ids], rounds? (20), lives? (3),
//   holes? (6), baseDur? (3400ms), minDur? (1900ms), spawnEvery? (1450ms),
//   minSpawnEvery? (750ms) }
export const WHACK_CSS = `
.wm-field { position:relative; overflow:hidden; flex:1 1 auto; min-height:230px; display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr)); grid-template-rows:repeat(2,minmax(0,1fr));
  gap:var(--sim-space-2); padding:calc(var(--sim-space-3) + 8px) var(--sim-space-3) var(--sim-space-3);
  border-radius:var(--sim-radius-lg); border:5px solid var(--sim-stroke); cursor:pointer;
  background:
    radial-gradient(120% 70% at 50% -12%, color-mix(in srgb, var(--sim-glass) 26%, transparent), transparent 60%),
    radial-gradient(circle at 10% 94%, color-mix(in srgb, var(--sim-series-6) 16%, transparent), transparent 34%),
    radial-gradient(circle at 90% 94%, color-mix(in srgb, var(--sim-series-5) 14%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--sim-success) 30%, var(--sim-bg-deep)) 0%, color-mix(in srgb, var(--sim-success) 12%, var(--sim-bg-deep)) 100%);
  box-shadow:inset 0 0 30px color-mix(in srgb, var(--sim-stroke) 38%, transparent), 0 6px 0 0 color-mix(in srgb, var(--sim-stroke) 70%, transparent); }
.wm-field::before { content:''; position:absolute; left:-4px; right:-4px; top:-9px; height:20px; pointer-events:none; opacity:.75;
  background:radial-gradient(circle at 50% 0, color-mix(in srgb, var(--sim-success) 62%, var(--sim-stroke)) 0 10px, transparent 10.5px) repeat-x; background-size:23px 20px; }
.wm-field::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.45;
  background-image:radial-gradient(color-mix(in srgb, var(--sim-label) 15%, transparent) 1.5px, transparent 1.6px),
    radial-gradient(color-mix(in srgb, var(--sim-bg-cell) 45%, transparent) 2px, transparent 2.2px);
  background-size:28px 28px, 41px 41px; background-position:0 0, 14px 19px; }
.wm-field.wm-shake { animation:ek-shake .35s; }

/* The hole is a clipping window: pit behind (::before), mole rises through it,
   soil lip in front (::after) overlaps the mole's base. overflow:hidden also
   stops waiting moles (translateY ~100%) from painting into the row below. */
.wm-hole { position:relative; overflow:hidden; border-radius:12px; display:flex; align-items:flex-end; justify-content:center; min-height:0; }
.wm-hole::before { content:''; position:absolute; left:12%; right:12%; bottom:3px; height:42px; border-radius:50%;
  background:radial-gradient(ellipse at 50% 36%, var(--sim-bg-deep) 0%, color-mix(in srgb, var(--sim-bg-deep) 66%, var(--sim-stroke)) 58%, color-mix(in srgb, var(--sim-success) 34%, var(--sim-bg-cell)) 100%);
  border:4px solid color-mix(in srgb, var(--sim-success) 52%, var(--sim-stroke));
  box-shadow:inset 0 9px 10px -4px color-mix(in srgb, var(--sim-bg-deep) 88%, transparent), 0 3px 0 0 color-mix(in srgb, var(--sim-success) 26%, var(--sim-bg-deep)); }
.wm-hole::after { content:''; position:absolute; left:9%; right:9%; bottom:-20px; height:42px; border-radius:50%; z-index:2; pointer-events:none;
  background:linear-gradient(180deg, color-mix(in srgb, var(--sim-success) 55%, var(--sim-stroke)) 0 4px, color-mix(in srgb, var(--sim-success) 34%, var(--sim-bg-cell)) 4px 100%);
  box-shadow:0 -2px 4px color-mix(in srgb, var(--sim-bg-deep) 60%, transparent); }

.wm-mole { position:relative; z-index:1; width:80%; min-width:0; display:flex; flex-direction:column; align-items:center; gap:3px;
  padding:0; border:none; background:none; color:inherit; font:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent;
  transform:translateY(103%); animation-name:wm-pop; animation-timing-function:cubic-bezier(.3,1.4,.5,1); animation-fill-mode:forwards; will-change:transform; }
.wm-mole:focus-visible { outline:3px dashed var(--sim-accent); outline-offset:-3px; border-radius:14px; }
.wm-mole:hover .wm-bub { border-color:var(--sim-accent); box-shadow:0 2px 0 var(--sim-accent); }
.wm-mole:hover .wm-ava { transform:scale(1.07) rotate(-2deg); }
.wm-mole:active .wm-ava { transform:scale(.94); }
.wm-bub { position:relative; z-index:1; max-width:100%; min-height:2.6em; display:flex; align-items:center; justify-content:center;
  padding:6px 10px; border-radius:12px; border:2.5px solid var(--t, var(--sim-stroke)); background:var(--sim-bg-surface);
  color:var(--sim-label); font-size:12.5px; line-height:1.2; font-weight:800; text-align:center; overflow-wrap:anywhere;
  box-shadow:0 2px 0 var(--t, var(--sim-stroke)); animation:wm-bob 2.6s ease-in-out infinite; }
.wm-bub::after { content:''; position:absolute; left:50%; bottom:-6.5px; width:10px; height:10px; transform:translateX(-50%) rotate(45deg);
  background:var(--sim-bg-surface); border-right:2.5px solid var(--t, var(--sim-stroke)); border-bottom:2.5px solid var(--t, var(--sim-stroke)); }
.wm-fuse { display:block; width:74%; height:5px; border-radius:99px; background:var(--sim-success); transform-origin:50% 50%;
  animation-name:wm-fuse; animation-timing-function:linear; animation-fill-mode:both; }
.wm-ava { display:block; line-height:0; filter:drop-shadow(0 3px 3px color-mix(in srgb, var(--sim-bg-deep) 55%, transparent)); transition:transform .15s ease; }
.wm-ava .ek-av, .wm-ava svg { width:48px; height:48px; }
.wm-name { position:relative; z-index:1; max-width:100%; padding:1px 9px 2px; border-radius:99px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  border:2px solid color-mix(in srgb, var(--t, var(--sim-stroke)) 70%, transparent);
  background:color-mix(in srgb, var(--t, var(--sim-stroke)) 16%, var(--sim-bg-deep)); color:var(--sim-label);
  font-size:10px; font-weight:900; letter-spacing:.03em; }

/* impact fx */
.wm-fx-good { --bc:var(--sim-success); } .wm-fx-bad { --bc:var(--sim-error); }
.wm-fx-safe { --bc:var(--sim-accent); } .wm-fx-dust { --bc:color-mix(in srgb, var(--sim-label) 45%, transparent); }
.wm-boom { position:absolute; left:50%; bottom:24%; width:74px; height:74px; margin-left:-37px; z-index:3; pointer-events:none; }
.wm-boom.wm-fx-dust { width:46px; height:46px; margin-left:-23px; }
.wm-boom::before { content:''; position:absolute; inset:0; border-radius:50%; border:4px solid var(--bc); opacity:.9;
  animation:wm-ring .5s ease-out both; animation-delay:var(--d,0ms); }
.wm-boom::after { content:''; position:absolute; inset:16%; background:var(--bc);
  clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
  animation:wm-star .5s ease-out both; animation-delay:var(--d,0ms); }
.wm-pop-label { position:absolute; left:50%; bottom:62%; z-index:4; pointer-events:none; white-space:nowrap;
  font-family:var(--sim-font-display); font-weight:900; font-size:var(--sim-text-xl); color:var(--bc, var(--sim-label));
  text-shadow:0 2px 0 color-mix(in srgb, var(--sim-bg-deep) 70%, transparent), 0 0 14px color-mix(in srgb, var(--bc, var(--sim-accent)) 60%, transparent);
  animation:wm-rise .62s ease-out both; animation-delay:var(--d,0ms); }
.wm-pop-label.wm-fx-dust { font-size:var(--sim-text-md); }

/* chrome */
.wm-stats { display:flex; align-items:center; gap:var(--sim-space-2); flex-wrap:wrap; min-width:0; }
.wm-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 12px; border-radius:var(--sim-radius-pill); white-space:nowrap;
  font-weight:900; font-family:var(--sim-font-display); font-size:var(--sim-text-md); letter-spacing:.02em;
  border:2.5px solid var(--c,var(--sim-stroke)); color:var(--c,var(--sim-label)); background:var(--sim-bg-deep);
  text-shadow:0 0 8px color-mix(in srgb, var(--c,var(--sim-accent)) 55%, transparent);
  box-shadow:0 2px 0 0 color-mix(in srgb, var(--c,var(--sim-stroke)) 55%, transparent); }
.wm-hot { animation:wm-throb .5s ease-in-out infinite alternate; }
.wm-prog { flex:0 0 110px; display:inline-block; }
.wm-prog .gm-bar { height:12px; }
.wm-note { min-height:2.7em; display:flex; align-items:center; }
.wm-note--good { border-left-color:var(--sim-success); }
.wm-note--bad { border-left-color:var(--sim-error); background:color-mix(in srgb, var(--sim-error) 9%, var(--sim-bg-surface)); }
.wm-note--pardon { border-left-color:var(--sim-warning); background:color-mix(in srgb, var(--sim-warning) 10%, var(--sim-bg-surface)); }
.wm-note--idle { border-left-color:var(--sim-stroke); color:var(--sim-label-muted); }

/* menu / end */
.wm-menu { flex:1 1 auto; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; gap:var(--sim-space-3); text-align:center; overflow:auto; padding:var(--sim-space-2); }
.wm-menu > * { max-width:640px; }
.wm-how { display:flex; gap:var(--sim-space-2); flex-wrap:wrap; justify-content:center; }
.wm-how-card { flex:1 1 200px; max-width:260px; display:flex; flex-direction:column; gap:2px; text-align:left;
  padding:var(--sim-space-2) var(--sim-space-3); border-radius:var(--sim-radius-md); border:2.5px solid var(--c); background:var(--sim-bg-surface);
  font-size:var(--sim-text-sm); font-weight:700; }
.wm-how--do { --c:var(--sim-success); } .wm-how--dont { --c:var(--sim-error); }
.wm-how-card b { font-family:var(--sim-font-display); color:var(--c); font-size:var(--sim-text-md); }
.wm-how-card small { color:var(--sim-label-muted); font-weight:800; text-transform:uppercase; letter-spacing:.06em; font-size:10px; }
.wm-recap { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; text-align:left; font-size:var(--sim-text-sm); font-weight:700; line-height:1.35; }
.wm-recap em { color:var(--sim-label-muted); font-style:normal; font-weight:700; }
.wm-rc { display:inline-block; padding:0 8px; border-radius:99px; margin-right:6px; border:2px solid var(--c); color:var(--c);
  font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.06em; }
.wm-rc--miss { --c:var(--sim-error); } .wm-rc--trap { --c:var(--sim-warning); }
.wm-confetti-wrap { position:relative; height:0; overflow:visible; }
.wm-confetti { position:absolute; top:-12px; width:9px; height:15px; border-radius:2px; opacity:.95; animation:wm-fall 1.25s ease-in both; }

/* the resume trick: duration/delay set inline per render (delay negative) */
@keyframes wm-pop {
  0% { transform:translateY(103%) scale(1); }
  16% { transform:translateY(-9%) scale(1.05,.95); }
  28% { transform:translateY(1.5%) scale(.985,1.015); }
  38% { transform:translateY(-1%) scale(1.005,.995); }
  46%,84% { transform:translateY(0) scale(1); }
  93% { transform:translateY(-5%) scale(1.02,.98); }
  100% { transform:translateY(103%) scale(.9,1.06); } }
@keyframes wm-fuse { 0% { transform:scaleX(1); background-color:var(--sim-success); } 55% { background-color:var(--sim-warning); } 100% { transform:scaleX(0); background-color:var(--sim-error); } }
@keyframes wm-bob { 0%,100% { transform:translateY(0) rotate(-.4deg); } 50% { transform:translateY(-3px) rotate(.4deg); } }
@keyframes wm-ring { from { transform:scale(.35); opacity:1; } to { transform:scale(1.3); opacity:0; } }
@keyframes wm-star { 0% { transform:scale(.3) rotate(-20deg); opacity:1; } 55% { opacity:1; } 100% { transform:scale(1.1) rotate(30deg); opacity:0; } }
@keyframes wm-rise { 0% { opacity:0; transform:translate(-50%,10px) scale(.7); } 18% { opacity:1; transform:translate(-50%,0) scale(1.08); } 100% { opacity:0; transform:translate(-50%,-30px) scale(1); } }
@keyframes wm-fall { from { transform:translateY(0) rotate(0deg); opacity:1; } 80% { opacity:1; } to { transform:translateY(190px) rotate(var(--spin,320deg)); opacity:0; } }
@keyframes wm-throb { from { transform:scale(1); } to { transform:scale(1.12); } }

.sim-dom-root--portrait .wm-field { grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(3,minmax(0,1fr)); }
.sim-dom-root--portrait .wm-bub { font-size:11.5px; }
@media (prefers-reduced-motion: reduce) {
  .wm-mole, .wm-bub, .wm-fuse, .wm-boom::before, .wm-boom::after, .wm-pop-label, .wm-field.wm-shake, .wm-hot { animation:none !important; }
  .wm-mole { transform:translateY(0); }
  .wm-confetti { display:none; }
}
`;

export class WhackAMythScene extends FieldGuideScene {
  static CSS = WHACK_CSS;
  // Same widescreen reasoning as SortRushScene - see its WIDTH comment.
  static WIDTH = 1100;
  static HEIGHT = 300;

  init() {
    this.best = 0;
    this.stage = 'menu';
    this._nextId = 1;
    this._lifeTimers = new Map();
    this._pauseUntil = 0;
    this._lastHole = -1;
  }

  // Trait OBJECTS for an organism - resolved here, not by callers. The
  // original helper returned raw ids for this.fg.trait() to resolve; the
  // queue builder needs kind/yes, so a bare string id reads as an empty,
  // kind-less lure (see the empty-bubble bug). Guards: skip traits with no
  // `yes` sentence (empty bubble) and traits that are neither kind (the
  // whole game rests on `kind` being one of the two).
  _eligibleTraits(org) {
    return (org.traits || [])
      .map((id) => this.fg.trait(id))
      .filter((t) => t && t.yes && (t.kind === 'evidence' || t.kind === 'lure') && !this.fg.isMarker(t.id));
  }

  // Balanced queue: evidence and lure moles alternate, nothing repeats
  // back-to-back, and lists reshuffle if a run outlasts the pool.
  _buildQueue(pool) {
    const rounds = this.cfg.rounds || 20;
    const ev = [], lu = [];
    for (const o of pool) {
      for (const t of this._eligibleTraits(o)) {
        (t.kind === 'lure' ? lu : ev).push({ org: o, trait: t });
      }
    }
    if (!ev.length && !lu.length) return [];
    let es = shuffle(ev), ls = shuffle(lu), i = 0, j = 0;
    const q = [];
    while (q.length < rounds) {
      if (i >= es.length && ev.length) { es = shuffle(ev); i = 0; }
      if (j >= ls.length && lu.length) { ls = shuffle(lu); j = 0; }
      const useEv = !ls.length ? true : (!es.length ? false : q.length % 2 === 0);
      q.push(useEv ? es[i++] : ls[j++]);
    }
    for (let k = 1; k < q.length; k++) {
      if (q[k].trait.id !== q[k - 1].trait.id) continue;
      const n = q.findIndex((x, m) => m > k && x.trait.id !== q[k].trait.id);
      if (n > k) { const t = q[k]; q[k] = q[n]; q[n] = t; }
    }
    return q;
  }

  // Difficulty lerps with progress, so it scales with any `rounds` value.
  _pace() {
    const p = Math.min(1, this.spawned / Math.max(1, this.rounds));
    const lerp = (a, b) => Math.round(a + (b - a) * p);
    return {
      dur: Math.max(this.cfg.minDur || 1900, lerp(this.cfg.baseDur || 3400, this.cfg.minDur || 1900)),
      every: Math.max(this.cfg.minSpawnEvery || 750, lerp(this.cfg.spawnEvery || 1450, this.cfg.minSpawnEvery || 750)),
    };
  }

  _start() {
    const pool = this.fg.orgs(this.cfg.pool || []).filter((o) => this._eligibleTraits(o).length);
    this.queue = this._buildQueue(pool);
    if (!this.queue.length) { this.stage = 'menu'; return this.paint(); }
    this.rounds = this.queue.length;
    this.holes = new Array(this.cfg.holes || 6).fill(null);
    this.lives = this.cfg.lives || 3;
    this.maxLives = this.lives;
    this.pardon = true;
    this.spawned = 0;
    this.right = 0;   // evidence whacked
    this.safe = 0;    // lures left alone
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.traps = [];  // lures the player whacked (for the end recap)
    this.misses = []; // evidence that escaped (for the end recap)
    this.msg = '';
    this.msgKind = 'idle';
    this._pauseUntil = 0;
    this.stage = 'play';
    this._spawnOne();
    this._scheduleSpawn();
    this.paint();
  }

  act(name, d) {
    if (name === 'start') return this._start();
    if (name === 'menu') { this.stage = 'menu'; return this.paint(); }
    if (name === 'hole') return this._hit(Number(d.i));
    return undefined;
  }

  _scheduleSpawn() {
    if (this.stage !== 'play') return;
    const cooldown = Math.max(0, (this._pauseUntil || 0) - performance.now());
    this._spawnTimer = setTimeout(() => { this._spawnOne(); this._scheduleSpawn(); }, Math.max(this._pace().every, cooldown));
  }

  _spawnOne() {
    if (this.stage !== 'play') return;
    if (this.spawned >= this.queue.length) return;
    const empty = this.holes.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0);
    if (!empty.length) return; // board full; the scheduler retries next tick
    const item = this.queue[this.spawned++];
    let hole = empty[Math.floor(Math.random() * empty.length)];
    if (empty.length > 1 && hole === this._lastHole) hole = empty[(empty.indexOf(hole) + 1) % empty.length];
    this._lastHole = hole;
    const mole = { id: this._nextId++, org: item.org, trait: item.trait, good: item.trait.kind === 'evidence', start: performance.now(), dur: this._pace().dur };
    this.holes[hole] = mole;
    // wall-clock expiry (works with or without animations running)
    this._lifeTimers.set(mole.id, setTimeout(() => { this._lifeTimers.delete(mole.id); this._expire(mole.id); }, mole.dur + 80));
    this.paint();
  }

  _hit(i) {
    if (this.stage !== 'play') return;
    if (!this.holes[i]) { this._pop(i, '', 'dust'); return this.paint(); } // whiffed the ground
    const m = this.holes[i];
    this.holes[i] = null;
    clearTimeout(this._lifeTimers.get(m.id));
    this._lifeTimers.delete(m.id);
    if (m.good) {
      const gain = 10 + Math.min(this.streak, 6) * 2;
      this.right++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.score += gain;
      this.award(m.org.id, this.streak >= 5 ? 'gold' : 'silver');
      this.msg = `<b>Yes.</b> ${esc(m.trait.yes)}: that helps decide ${esc(this.groupName(m.org.group))}.`;
      this.msgKind = 'good';
      this._pop(i, `+${gain}`, 'good');
    } else {
      this.streak = 0;
      this._remember(this.traps, { id: m.trait.id, yes: m.trait.yes });
      if (this.pardon) {
        this.pardon = false;
        this.msg = `<b>First slip forgiven.</b> ${esc(m.trait.yes)} is true of the ${esc(m.org.name)}, but a fact like this never decides a group.`;
        this.msgKind = 'pardon';
        this._pop(i, 'No', 'bad');
        this._cooldown(1100);
      } else {
        this.lives--;
        this.msg = `<b>That one decides nothing.</b> ${esc(m.trait.yes)} is true of the ${esc(m.org.name)}, but it never decides a group. <b>One life lost.</b>`;
        this.msgKind = 'bad';
        this._pop(i, 'No', 'bad');
        this._flashShake();
        this._cooldown(1200);
      }
    }
    this.paint();
    this._checkEnd();
  }

  _expire(id) {
    if (this.stage !== 'play') return;
    const i = this.holes.findIndex((h) => h && h.id === id);
    if (i < 0) return;
    const m = this.holes[i];
    this.holes[i] = null;
    if (m.good) {
      this.streak = 0;
      this._remember(this.misses, { id: m.trait.id, yes: m.trait.yes, group: this.groupName(m.org.group) });
      if (this.pardon) {
        this.pardon = false;
        this.msg = `<b>First slip forgiven.</b> "${esc(m.trait.yes)}" helps decide ${esc(this.groupName(m.org.group))}, and it went by.`;
        this.msgKind = 'pardon';
        this._pop(i, 'Missed', 'bad');
        this._cooldown(1100);
      } else {
        this.lives--;
        this.msg = `<b>It went by.</b> "${esc(m.trait.yes)}" helps decide ${esc(this.groupName(m.org.group))}. <b>One life lost.</b>`;
        this.msgKind = 'bad';
        this._pop(i, 'Missed', 'bad');
        this._flashShake();
        this._cooldown(1200);
      }
    } else {
      // correct restraint - make it visible and worth a little
      this.safe++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.score += 3;
      this.msg = `<b>Good.</b> "${esc(m.trait.yes)}" decides nothing, so you were right to leave it. +3`;
      this.msgKind = 'good';
      this._pop(i, '+3', 'safe');
    }
    this.paint();
    this._checkEnd();
  }

  _remember(list, item, cap = 3) {
    if (!list.some((x) => x.id === item.id)) {
      list.push(item);
      if (list.length > cap) list.shift();
    }
  }

  _cooldown(ms) { this._pauseUntil = Math.max(this._pauseUntil || 0, performance.now() + ms); }

  _pop(i, text, kind) {
    this.popup = { i, text, kind, start: performance.now() };
    clearTimeout(this._popTimer);
    this._popTimer = setTimeout(() => { this.popup = null; this.paint(); }, 640);
  }

  _flashShake() {
    this.shake = true;
    clearTimeout(this._shakeTimer);
    this._shakeTimer = setTimeout(() => { this.shake = false; this.paint(); }, 350);
  }

  _checkEnd() {
    if (this.stage !== 'play') return;
    if (this.lives <= 0) { this.stage = 'end'; this._finish(); return this.paint(); }
    if (this.spawned >= this.queue.length && this.holes.every((h) => !h)) { this.stage = 'end'; this._finish(); this.paint(); }
  }

  _finish() {
    clearTimeout(this._spawnTimer);
    this._lifeTimers.forEach((t) => clearTimeout(t));
    this._lifeTimers.clear();
    this.best = Math.max(this.best, this.score);
    this.won = this.lives > 0;
    const acc = (this.right + this.safe) / Math.max(1, this.spawned);
    if (this.coll && this.won && acc >= 0.7) { this.pack(1); this.coll.bump('whack:wins'); this.packed = true; } else this.packed = false;
  }

  _field() {
    const now = performance.now();
    const holes = this.holes.map((m, i) => {
      let fx = '';
      if (this.popup && this.popup.i === i) {
        const d = Math.max(0, Math.round(now - this.popup.start));
        fx = `<i class="wm-boom wm-fx-${this.popup.kind}" style="--d:-${d}ms"></i>` +
             (this.popup.text ? `<i class="wm-pop-label wm-fx-${this.popup.kind}" style="--d:-${d}ms">${this.popup.text}</i>` : '');
      }
      if (!m) return `<div class="wm-hole" data-act="hole" data-i="${i}">${fx}</div>`;
      const anim = `animation-duration:${m.dur}ms;animation-delay:-${Math.max(0, now - m.start)}ms`;
      const mole = this.btn(
        `<span class="wm-bub">${esc(m.trait.yes)}</span><i class="wm-fuse" style="${anim}"></i><span class="wm-ava">${this.av(m.org, 48)}</span><span class="wm-name">${esc(m.org.name)}</span>`,
        'hole', { i }, 'wm-mole',
        ` style="--t:var(--sim-series-${m.org.tone || 1});${anim}" aria-label="${esc(m.org.name)} shows: ${esc(m.trait.yes)}. Tap it if that decides a group."`);
      return `<div class="wm-hole" data-act="hole" data-i="${i}">${mole}${fx}</div>`;
    });
    return `<div class="wm-field${this.shake ? ' wm-shake' : ''}" role="group" aria-label="Six places where specimens rise">${holes.join('')}</div>`;
  }

  _stats() {
    const total = this.rounds || this.cfg.rounds || 20;
    return `<div class="wm-stats">${this.hearts(this.lives, this.maxLives || this.cfg.lives || 3)}
      ${this.pardon ? '<span class="wm-chip" style="--c:var(--sim-series-6)" title="Your first slip is forgiven">Free slip</span>' : ''}
      <span class="wm-chip" style="--c:var(--sim-accent)">${this.score}</span>
      <span class="wm-chip${this.streak >= 3 ? ' wm-hot' : ''}" style="--c:var(--sim-series-2)">Streak ${this.streak}</span>
      <span class="wm-chip" style="--c:var(--sim-series-4)">${Math.min(this.spawned, total)}/${total}</span>
      <span class="wm-prog">${this.bar(this.spawned, total, 4)}</span></div>`;
  }

  _note() {
    if (this.msg) return `<p class="gm-msg wm-note wm-note--${this.msgKind}" aria-live="polite">${this.msg}</p>`;
    return `<p class="gm-msg wm-note wm-note--idle" aria-live="polite">Tap the facts that decide a group, and leave the others.</p>`;
  }

  _menu(title) {
    const ev = this.fg && this.fg.traits.find((t) => t.kind === 'evidence' && !t.marker);
    const lu = this.fg && this.fg.traits.find((t) => t.kind === 'lure');
    const rounds = this.cfg.rounds || 20;
    const lives = this.cfg.lives || 3;
    return `${this.head(title)}
      <div class="wm-menu">
        <p class="gm-msg">Specimens rise, each showing one <b>true fact</b>. Tap the ones whose fact <b>decides a group</b>. Leave the others: they are true too, but they decide nothing.</p>
        <div class="wm-how">
          <div class="wm-how-card wm-how--do"><b>Tap</b><span>${ev ? `“${esc(ev.yes)}”` : 'facts that decide a group'}</span><small>decides a group</small></div>
          <div class="wm-how-card wm-how--dont"><b>Leave</b><span>${lu ? `“${esc(lu.yes)}”` : 'true facts that decide nothing'}</span><small>true, but decides nothing</small></div>
        </div>
        <p class="gm-h2">${rounds} specimens · ${lives} lives · first slip forgiven${this.best ? ` · best ${this.best}` : ''}</p>
        <div class="ek-foot">${this.btn('Start', 'start', {}, 'ek-btn ek-run', ' data-focus="1"')}</div>
      </div>`;
  }

  _end(title) {
    const acc = Math.round(((this.right + this.safe) / Math.max(1, this.spawned)) * 100);
    const recap = [
      ...this.misses.map((t) => `<li><span class="wm-rc wm-rc--miss">you missed</span>"${esc(t.yes)}" <em>helps decide ${esc(t.group)}</em></li>`),
      ...this.traps.map((t) => `<li><span class="wm-rc wm-rc--trap">you tapped</span>"${esc(t.yes)}" <em>true, but decides nothing</em></li>`),
    ].slice(0, 4);
    return `${this.head(title)}
      <div class="wm-menu">
        <div class="gm-big gm-pop">${this.right} tapped, ${this.safe} left alone</div>
        <p class="gm-msg ${this.won ? 'gm-good' : 'gm-bad'}">Score <b>${this.score}</b> · ${acc}% clean decisions · best streak ${this.bestStreak}${this.packed ? ' · <b>+1 card pack</b> for your collection' : ''}. ${this.won ? 'You told them apart.' : 'Out of lives. Skim the notes below, then go again.'}</p>
        ${recap.length ? `<ul class="wm-recap">${recap.join('')}</ul>` : ''}
        <div class="ek-foot">${this.btn('Play again', 'start', {}, 'ek-btn ek-run', ' data-focus="1"')}${this.btn('Menu', 'menu', {}, 'ek-btn')}</div>
      </div>`;
  }

  view() {
    const title = this.cfg.title || 'Does it decide?';
    if (this.stage === 'menu') return this._menu(title);
    if (this.stage === 'end') return this._end(title);
    return `${this.head(title, this._stats())}${this._field()}${this._note()}`;
  }

  destroy() {
    clearTimeout(this._spawnTimer);
    clearTimeout(this._popTimer);
    clearTimeout(this._shakeTimer);
    if (this._lifeTimers) this._lifeTimers.forEach((t) => clearTimeout(t));
    super.destroy();
  }
}

