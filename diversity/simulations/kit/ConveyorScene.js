import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Conveyor belt": specimens ride a belt and you drop each into the right bin.
//   Chill - the belt waits for you; a wrong bin explains why and lets you retry.
//   Rush  - the belt moves; a wrong bin or a miss loses the specimen; streaks score more.
// Chill earns a bronze medal per specimen sorted first time, Rush a silver.
// Sort 75% or better to win a card pack.
//
// CONFIG: { ariaLabel, title?, rounds? (12), rushMs? (6500), pool: [organism ids],
//           cols? (bins per row), bins: [ groupId | { id, label, groups: [groupIds],
//           evidence? (text shown on a wrong bin), face?: { art, tone } } ] }
export const CONVEYOR_CSS = `
.cv-menu { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-3); }
.cv-mode { display:flex; flex-direction:column; align-items:flex-start; gap:var(--sim-space-1); padding:var(--sim-space-3); text-align:left; line-height:1.25; min-height:120px; }
.cv-mode b { font-size:var(--sim-text-lg); }
.cv-mode span { font-size:var(--sim-text-sm); font-weight:700; color:var(--sim-label-muted); }
.cv-belt { position:relative; height:104px; border-radius:var(--sim-radius-md); background:var(--sim-track); border:3px solid var(--sim-stroke); overflow:hidden; flex:none; }
.cv-belt::before { content:''; position:absolute; inset:0; background-image:linear-gradient(45deg, var(--sim-stroke) 25%, transparent 25%, transparent 50%, var(--sim-stroke) 50%, var(--sim-stroke) 75%, transparent 75%); background-size:40px 40px; opacity:.4; animation:cv-tread 1s linear infinite; }
.cv-belt.cv-rush::before { animation-duration:.4s; }
.cv-belt::after { content:''; position:absolute; top:50%; left:0; right:0; height:24px; margin-top:-12px; background-image:radial-gradient(circle at 15px 50%, var(--sim-bg-deep) 0 8px, var(--sim-stroke) 8px 11px, transparent 12px), radial-gradient(circle at calc(100% - 15px) 50%, var(--sim-bg-deep) 0 8px, var(--sim-stroke) 8px 11px, transparent 12px); pointer-events:none; }
@keyframes cv-tread { from { background-position:0 0; } to { background-position:40px 0; } }
.cv-item { position:absolute; top:10px; left:50%; width:150px; margin-left:-75px; display:flex; align-items:center; gap:var(--sim-space-2); padding:var(--sim-space-1) var(--sim-space-2); border:2px solid var(--t); border-radius:var(--sim-radius-md); background:var(--sim-bg-deep); box-shadow:0 3px 0 var(--t); font-weight:800; line-height:1.15; animation:gm-pop .3s ease-out; z-index:1; }
.cv-item .ek-av { width:44px; height:44px; }
.cv-item span { min-width:0; overflow-wrap:anywhere; }
.cv-rush .cv-item { left:auto; margin-left:0; right:-160px; animation:cv-run var(--dur,6500ms) linear forwards; }
@keyframes cv-run { from { right:-160px; } to { right:calc(100% + 10px); } }
.cv-bins { display:grid; grid-template-columns:repeat(var(--cols,4),minmax(0,1fr)); gap:var(--sim-space-2); }
.cv-bin { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; min-height:64px; padding:var(--sim-space-1); text-align:center; line-height:1.1; font-size:var(--sim-text-sm); overflow-wrap:anywhere; border-color:var(--t); }
.cv-bin .ek-av { width:30px; height:30px; }
.cv-bin.cv-ok { background:var(--sim-success); color:var(--sim-bg-deep); }
.cv-stats { display:flex; align-items:center; gap:var(--sim-space-3); font-weight:800; font-size:var(--sim-text-md); }
.cv-stats b { color:var(--sim-accent); }
/* Phone: three bins to a row, and a name is never split mid-word. */
.sim-dom-root--portrait .cv-bins { grid-template-columns:repeat(3,minmax(0,1fr)); }
.cv-bin span { overflow-wrap:normal; word-break:normal; }
.sim-dom-root--portrait .cv-bin { font-size:var(--sim-text-sm); }
@media (prefers-reduced-motion: reduce) { .cv-rush .cv-item { animation:none; right:auto; left:50%; margin-left:-75px; } .cv-belt::before { animation:none; } }
`;

export class ConveyorScene extends FieldGuideScene {
  static CSS = CONVEYOR_CSS;

  init() {
    this.binDefs = (this.cfg.bins || []).map((b) => {
      const d = typeof b === 'string' ? { id: b, groups: [b] } : b;
      const g = this.fg.group(d.groups[0]);
      return { id: d.id, groups: d.groups, label: d.label || (g && g.label) || d.id, evidence: d.evidence || '', face: d.face || this.fg.groupFace(d.groups[0]) };
    });
    this.best = { chill: 0, rush: 0 };
    this.stage = 'menu';
  }

  _start(mode) {
    const pool = this.fg.orgs(this.cfg.pool || []).filter((o) => this.binDefs.some((b) => b.groups.includes(o.group)));
    this.queue = shuffle(pool).slice(0, this.cfg.rounds || 12);
    this.mode = mode;
    this.i = 0;
    this.score = 0;
    this.streak = 0;
    this.right = 0;
    this.firstTry = true;
    this.msg = '';
    this.okBin = null;
    this.stage = 'play';
    this.paint();
  }

  act(name, d) {
    if (name === 'mode') return this._start(d.m);
    if (name === 'menu') { this.stage = 'menu'; return this.paint(); }
    if (name === 'bin') return this._sort(d.id);
    return undefined;
  }

  get cur() { return this.queue[this.i]; }

  _sort(binId) {
    const o = this.cur;
    if (!o || this.stage !== 'play') return;
    const bin = this.binDefs.find((b) => b.id === binId);
    const good = bin.groups.includes(o.group);
    if (good) {
      this.right++;
      this.streak++;
      const first = this.mode === 'rush' || this.firstTry;
      if (first) this.score += 10 + Math.min(this.streak, 6) * 2;
      this.award(o.id, this.mode === 'rush' ? 'silver' : (this.firstTry ? 'bronze' : null));
      this.okBin = binId;
      this.msg = '';
      this._advance(true);
    } else {
      this.streak = 0;
      this.firstTry = false;
      const why = this._why(o);
      if (this.mode === 'rush') { this.msg = `<b>Lost it.</b> ${why}`; this._advance(false); } else { this.msg = `<b>Not ${esc(bin.label)}.</b> ${why} Try another bin.`; this.paint(); }
    }
  }

  _miss() {
    if (this.stage !== 'play' || this.mode !== 'rush') return;
    this.streak = 0;
    this.msg = `<b>Too slow.</b> ${this._why(this.cur)}`;
    this._advance(false);
  }

  /** Why an organism goes where it does: the evidence that decides its group. */
  _why(o) {
    const bin = this.binDefs.find((b) => b.groups.includes(o.group));
    const ev = bin && bin.evidence ? [bin.evidence] : this.fg.evidence(o.group);
    return `${esc(o.name)}: ${ev.length ? esc(ev.join(' + ')) : esc(o.note || '')}: ${esc(bin ? bin.label : this.groupName(o.group))}.`;
  }

  _advance(ok) {
    this.stage = 'pause';
    this.paint();
    const wait = ok ? 380 : 1400;
    this._t = setTimeout(() => {
      if (!this.board) return;
      this.i++;
      this.firstTry = true;
      this.okBin = null;
      if (ok) this.msg = '';
      this.stage = this.i >= this.queue.length ? 'end' : 'play';
      if (this.stage === 'end') this._finish();
      this.paint();
    }, wait);
  }

  _finish() {
    const total = this.queue.length;
    this.best[this.mode] = Math.max(this.best[this.mode], this.score);
    if (this.coll && this.right / total >= 0.75) { this.pack(1); this.coll.bump('conveyor:wins'); this.packed = true; } else this.packed = false;
  }

  _binsHtml() {
    const cols = this.cfg.cols || Math.min(4, this.binDefs.length);
    return `<div class="cv-bins" style="--cols:${cols}">${this.binDefs.map((b) => {
      const t = b.face ? b.face.tone : 1;
      return this.btn(`${b.face ? this.av(b.face, 30) : ''}<span>${esc(b.label)}</span>`, 'bin', { id: b.id },
        `ek-chipbtn cv-bin${this.okBin === b.id ? ' cv-ok' : ''}`, `${this.stage !== 'play' ? ' disabled' : ''} style="--t:var(--sim-series-${t})"`);
    }).join('')}</div>`;
  }

  view() {
    const title = this.cfg.title || 'Conveyor belt';
    if (this.stage === 'menu') {
      return `${this.head(title)}<p class="gm-msg">Sort each specimen into the bin its evidence points to. Judge by evidence, not by looks.</p>
        <div class="cv-menu">
          ${this.btn(`<b>Chill</b><span>The belt waits. A wrong bin explains why. Earns bronze medals.</span>`, 'mode', { m: 'chill' }, 'ek-chipbtn cv-mode', ' data-focus="1"')}
          ${this.btn(`<b>Rush</b><span>The belt moves and a slip loses the specimen. Streaks score more. Earns silver medals.</span>`, 'mode', { m: 'rush' }, 'ek-chipbtn cv-mode')}
        </div>
        <div class="gm-grow"></div>
        <p class="gm-h2">${this.cfg.rounds || 12} specimens per round${this.best.chill || this.best.rush ? ` · best: Chill ${this.best.chill}, Rush ${this.best.rush}` : ''}</p>`;
    }
    if (this.stage === 'end') {
      const total = this.queue.length;
      return `${this.head(title)}<div class="gm-big gm-pop">${this.right} of ${total} sorted</div>
        <p class="gm-msg gm-good">Score <b>${this.score}</b>${this.packed ? ' · <b>+1 card pack</b> for your collection' : ''}. ${this.right === total ? 'Perfect belt!' : 'The missed ones are the ones to revisit.'}</p>
        <div class="gm-grow"></div><div class="ek-foot gm-row">${this.btn('Play again', 'menu', {}, 'ek-btn ek-run', ' data-focus="1"')}</div>`;
    }
    const o = this.cur;
    const item = o ? `<div class="cv-item" style="--t:var(--sim-series-${o.tone});--dur:${this.cfg.rushMs || 6500}ms" data-item="${o.id}">${this.av(o)}<span>${esc(o.name)}</span></div>` : '';
    const stats = `<div class="cv-stats"><span>Score <b>${this.score}</b></span><span>Streak <b>${this.streak}</b></span><span>${Math.min(this.i + 1, this.queue.length)}/${this.queue.length}</span></div>`;
    return `${this.head(title, stats)}
      <div class="cv-belt ${this.mode === 'rush' && this.stage === 'play' ? 'cv-rush' : ''}" aria-live="polite">${this.stage === 'pause' && this.okBin ? '' : item}</div>
      <p class="gm-msg ${this.msg ? 'gm-bad' : ''}" style="min-height:2.6em">${this.msg || (this.mode === 'rush' ? 'Tap a bin before the specimen leaves the belt.' : 'Which bin does this one belong in?')}</p>
      <div class="gm-grow"></div>${this._binsHtml()}`;
  }

  async setup() {
    await super.setup();
    // a specimen that rides off the end of the belt is a miss
    this.board?.addEventListener('animationend', (e) => { if (e.animationName === 'cv-run') this._miss(); });
  }

  destroy() {
    clearTimeout(this._t);
    super.destroy();
  }
}
