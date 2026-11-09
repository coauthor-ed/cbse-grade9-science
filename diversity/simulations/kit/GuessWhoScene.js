import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Guess Who?" against the computer, played with evidence. You pick a mode first,
// so only one side is ever guessing at a time:
//   You guess    the bot hides an organism; you ask yes/no questions and flip the
//                cards that no longer fit (a card that still fits refuses to flip).
//   Bot guesses  you hide an organism; the bot asks the questions and you answer
//                truthfully from what you know - a wrong answer is corrected, not
//                punished - while the board greys out cards the bot has ruled out.
//
// CONFIG: { ariaLabel, title?, pool: [organism ids], size? (12), cols? (4) }
// WhoBase holds the board/question-list rendering helpers this scene builds on.
export const WHO_CSS = `
.gw-menu { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-3); }
.gw-mode { display:flex; flex-direction:column; align-items:flex-start; gap:var(--sim-space-1); padding:var(--sim-space-3); text-align:left; line-height:1.25; min-height:120px; }
.gw-mode b { font-size:var(--sim-text-lg); }
.gw-mode span { font-size:var(--sim-text-sm); font-weight:700; color:var(--sim-label-muted); }
.gw-info { display:flex; align-items:center; gap:var(--sim-space-2); min-height:36px; }
.gw-me { display:inline-flex; align-items:center; gap:var(--sim-space-1); padding:2px var(--sim-space-2); border:2px solid var(--sim-accent); border-radius:var(--sim-radius-pill); font-size:var(--sim-text-sm); font-weight:800; }
.gw-me .ek-av { width:26px; height:26px; }
.gw-tabs { display:flex; flex-wrap:wrap; gap:var(--sim-space-1); }
.gw-tab { min-height:44px; padding:0 var(--sim-space-2); border:2px solid var(--sim-stroke); border-radius:var(--sim-radius-pill); background:var(--sim-bg-cell); font-weight:800; }
.gw-tab[aria-pressed="true"] { border-color:var(--sim-accent); background:var(--sim-accent); color:var(--sim-bg-deep); }
.gw-qs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-1); }
.gw-q { min-height:32px; padding:2px var(--sim-space-2); text-align:left; font-size:var(--sim-text-sm); line-height:1.2; }
.gw-q:disabled { opacity:.45; cursor:default; }
.gw-answer { display:flex; gap:var(--sim-space-2); }
.gw-answer .ek-btn { flex:1 1 0; font-size:var(--sim-text-lg); }
.gw-tile { min-height:66px; }
.gw-tile .ek-av { width:34px; height:34px; }
.gw-guessing .gw-tile:not(.gm-out) { border-color:var(--sim-warning); box-shadow:0 3px 0 var(--sim-warning); }
.gw-log { display:flex; flex-wrap:wrap; gap:var(--sim-space-1); }
.sim-dom-root--portrait .gw-qs { grid-template-columns:minmax(0,1fr); }
`;

export class WhoBase extends FieldGuideScene {
  static CSS = WHO_CSS;

  /** A random board of `size` organisms from the config pool. */
  newBoard() {
    const ids = this.cfg.pool || this.fg.organisms.map((o) => o.id);
    return shuffle(this.fg.orgs(ids)).slice(0, this.cfg.size || 12);
  }

  /** Cards still consistent with every {trait, yes} answer. */
  consistent(cards, answers) {
    return cards.filter((o) => answers.every((a) => o.set.has(a.trait) === a.yes));
  }

  tabsHtml() {
    const tabs = this.fg.tabs();
    return `<div class="gw-tabs" role="tablist">${tabs.map(([n], i) => `<button type="button" class="gw-tab" role="tab" aria-pressed="${i === this.tab}" data-act="tab" data-i="${i}">${esc(n)}</button>`).join('')}</div>`;
  }

  /** Question buttons for the current tab; traits already asked are greyed. */
  questionsHtml(asked, act = 'ask') {
    const ids = this.fg.tabs()[this.tab]?.[1] || [];
    return `<div class="gw-qs">${ids.map((id) => {
      const t = this.fg.trait(id);
      return this.btn(esc(t.ask), act, { t: id }, 'ek-chipbtn gw-q', asked.has(id) ? ' disabled' : '');
    }).join('')}</div>`;
  }

  /** A grid of tiles; `state(o)` -> extra classes. Tiles are buttons when `act` is set. */
  gridHtml(cards, state, act) {
    const cols = this.cfg.cols || 4;
    return `<div class="gm-grid" style="--cols:${cols}">${cards.map((o) => {
      const cls = `gm-tile gw-tile ${state(o)}`;
      return act
        ? `<button type="button" class="${cls}" style="--t:var(--sim-series-${o.tone})" data-act="${act}" data-id="${o.id}">${this.av(o)}<span>${esc(o.name)}</span></button>`
        : `<div class="${cls}" style="--t:var(--sim-series-${o.tone})">${this.av(o)}<span>${esc(o.name)}</span></div>`;
    }).join('')}</div>`;
  }

  /** "It has no feathers" style sentence for a trait about an organism. */
  fact(o, traitId) { return this.fg.say(o, traitId); }
}

export class GuessWhoScene extends WhoBase {
  init() { this._menu(); }

  _menu() { clearTimeout(this._t); this.stage = 'menu'; }

  /** whoGuesses: 'you' - the bot hides a secret and you find it; 'bot' - you hide one and the bot finds it. */
  _start(whoGuesses) {
    clearTimeout(this._t);
    this.stage = 'play';
    this.whoGuesses = whoGuesses;
    this.cards = this.newBoard();
    this.mine = null;
    this.bot = whoGuesses === 'you' ? this.cards[Math.floor(Math.random() * this.cards.length)] : null;
    this.flipped = new Set();
    this.answers = [];            // what the bot told me about ITS secret (mode: you guess)
    this.asked = new Set();       // traits I asked
    this.botAsked = new Set();    // traits the bot asked
    this.botAnswers = [];         // what I told the bot about MY secret (mode: bot guesses)
    this.botOut = new Set();      // cards the bot guessed wrongly
    this.pending = null;          // trait the bot is waiting on
    this.guessing = false;        // I am naming the bot's secret (mode: you guess)
    this.tab = 0;
    this.qMine = 0;
    this.slips = 0;
    this.end = null;
    this.msg = whoGuesses === 'you'
      ? 'Ask yes/no questions about traits to find the bot\'s secret organism.'
      : 'Pick YOUR secret organism from the board. The bot will ask questions to find it.';
  }

  act(name, d) {
    switch (name) {
      case 'mode': this._start(d.m); break;
      case 'menu': this._menu(); break;
      case 'tab': this.tab = Number(d.i); break;
      case 'again': this._start(this.whoGuesses); break;
      case 'tile': this._tile(d.id); return;
      case 'guessmode': this.guessing = !this.guessing; this.msg = this.guessing ? 'Tap the organism you think the bot is hiding.' : ''; break;
      case 'ask': this._ask(d.t); return;
      case 'answer': this._answer(d.v === 'yes'); return;
      default: return;
    }
    this.paint();
  }

  _tile(id) {
    const o = this.fg.org(id);
    if (this.end) return;
    if (this.whoGuesses === 'bot') {
      if (!this.mine) {
        this.mine = o;
        this.msg = `Your secret is ${o.name}. Answer the bot's questions truthfully.`;
        return this._botAsks();
      }
      return; // secret is locked in; the board is just a picture of the bot's progress now
    }
    if (this.guessing) return this._guess(o);
    if (this.flipped.has(id)) this.flipped.delete(id);
    else if (this.consistent([o], this.answers).length) this.msg = `${o.name} still fits every answer the bot gave. Keep it on the board!`;
    else this.flipped.add(id);
    return this.paint();
  }

  _ask(traitId) {
    if (this.whoGuesses !== 'you' || this.end || this.asked.has(traitId)) return;
    const t = this.fg.trait(traitId);
    this.asked.add(traitId);
    this.qMine++;
    const yes = this.bot.set.has(traitId);
    this.answers.push({ trait: traitId, yes });
    const before = this.consistent(this.cards.filter((c) => !this.flipped.has(c.id)), this.answers.slice(0, -1)).length;
    const left = this.consistent(this.cards.filter((c) => !this.flipped.has(c.id)), this.answers).length;
    const help = left === before ? ' That did not narrow the board: every card left gives the same answer.' : (yes ? ' Flip the cards without it.' : ' Flip the cards that have it.');
    this.msg = `<b>${yes ? 'Yes' : 'No'}</b> - ${esc(t.ask.replace('?', ''))}.${help}${left === 1 ? ' Only one is left...' : ''}`;
    this.paint();
  }

  /** Cards the bot still thinks could be my secret. */
  _botCands() { return this.consistent(this.cards, this.botAnswers).filter((c) => !this.botOut.has(c.id)); }

  /** The bot's turn: name the organism if it knows it, otherwise ask the best question. */
  _botAsks() {
    let cands = this._botCands();
    // "Cornered": no unasked trait tells these candidates apart (they may be true
    // twins in the guide's traits) - asking again would stall forever, so guess.
    const cornered = cands.length === 1 || !this.fg.randomTrait(cands, this.botAsked);
    if (cornered || (cands.length === 2 && Math.random() < 0.15)) {
      const guess = cands[Math.floor(Math.random() * cands.length)];
      if (guess.id === this.mine.id) {
        this.end = 'done';
        const medal = this.slips === 0 ? 'gold' : 'silver';
        this.award(this.mine.id, medal);
        if (this.coll) { this.pack(1); this.coll.bump('guesswho:wins'); }
        this.msg = `The bot found <b>${esc(guess.name)}</b> in ${this.botAsked.size} question${this.botAsked.size === 1 ? '' : 's'}${this.slips === 0 ? ' - you never slipped, gold!' : ''}.${this.coll ? ' <b>+1 card pack</b>.' : ''}`;
        return this.paint();
      }
      this.botOut.add(guess.id);
      // A wrong guess must be shown, and paced - otherwise it lands invisibly in
      // the same instant as the last answer, and looks like THAT answer wrongly
      // ruled the card out (the trait it just eliminated on may not even involve it).
      this.msg = `The bot guesses <b>${esc(guess.name)}</b> - not quite.`;
      this.paint();
      this._t = setTimeout(() => { if (this.board) this._botAsks(); }, 1000);
      return;
    }
    // A friendly opponent: mostly random useful questions, sometimes the best one.
    const t = Math.random() < 0.3 ? this.fg.bestTrait(cands, this.botAsked) : this.fg.randomTrait(cands, this.botAsked);
    this.pending = t;
    if (t) this.botAsked.add(t);
    this.paint();
  }

  _answer(yes) {
    const t = this.fg.trait(this.pending);
    if (!t) { this.pending = null; return this.paint(); }
    const truth = this.mine.set.has(this.pending);
    if (yes !== truth) {
      this.slips++;
      this.msg = `<b>Check again:</b> ${esc(this.mine.name)} - ${esc(this.fact(this.mine, this.pending))}. So the answer is ${truth ? 'Yes' : 'No'}.`;
      return this.paint();
    }
    // the bot only learns what you told it, and it was true
    this.botAnswers.push({ trait: this.pending, yes: truth });
    this.pending = null;
    this.msg = '';
    return this._botAsks();
  }

  _guess(o) {
    if (o.id === this.bot.id) {
      this.end = 'win';
      const medal = this.qMine <= 4 ? 'gold' : 'silver';
      this.award(this.bot.id, medal);
      if (this.coll) { this.pack(1); this.coll.bump('guesswho:wins'); }
      this.msg = `<b>You got it!</b> The bot was hiding ${esc(this.bot.name)} - found in ${this.qMine} question${this.qMine === 1 ? '' : 's'}${this.qMine <= 4 ? ' (gold!)' : ''}.${this.coll ? ' <b>+1 card pack</b>.' : ''}`;
    } else {
      this.flipped.add(o.id);
      this.guessing = false;
      this.msg = `Not ${esc(o.name)}. Keep asking, or try another guess.`;
    }
    return this.paint();
  }

  view() {
    if (this.stage === 'menu') {
      return `${this.head(this.cfg.title || 'Guess Who?')}<p class="gm-msg">Play with evidence: yes/no questions about traits, not looks. Who should guess?</p>
        <div class="gw-menu">
          ${this.btn('<b>You guess</b><span>The bot hides an organism. Ask questions and find it.</span>', 'mode', { m: 'you' }, 'ek-chipbtn gw-mode', ' data-focus="1"')}
          ${this.btn('<b>Bot guesses</b><span>You hide an organism. Answer the bot\'s questions truthfully.</span>', 'mode', { m: 'bot' }, 'ek-chipbtn gw-mode')}
        </div>
        <div class="gm-grow"></div>`;
    }
    const youGuess = this.whoGuesses === 'you';
    const tag = youGuess
      ? `<span class="gw-me gm-tag">Question ${this.qMine}</span>`
      : `<span class="gw-me${this.mine ? '' : ' gm-tag'}">${this.mine ? `${this.av(this.mine)}<span>${esc(this.mine.name)}</span>` : 'No secret yet'}</span>`;
    const head = this.head(this.cfg.title || 'Guess Who?', `${tag}${this.end ? '' : this.btn('Menu', 'menu', {}, 'ek-btn')}`);
    const botCands = !youGuess && this.mine ? new Set(this._botCands().map((c) => c.id)) : null;
    const state = (o) => [
      this.flipped.has(o.id) ? 'gm-out' : '',
      botCands && !botCands.has(o.id) ? 'gm-out' : '',
      (youGuess && this.end && this.bot.id === o.id) || (!youGuess && this.mine && this.mine.id === o.id) ? 'gm-mine' : '',
      youGuess && !this.end && !this.flipped.has(o.id) && !this.consistent([o], this.answers).length ? 'gm-fits' : '',
    ].join(' ');
    const gridAct = youGuess ? 'tile' : (this.mine ? null : 'tile');
    const grid = `<div class="${this.guessing ? 'gw-guessing' : ''}">${this.gridHtml(this.cards, (o) => state(o), gridAct)}</div>`;
    const msg = this.msg ? `<p class="gm-msg ${this.end === 'win' || this.end === 'done' ? 'gm-good' : ''}">${this.msg}</p>` : '';
    let panel = '';
    if (this.end) {
      panel = `<div class="ek-foot gm-row">${this.btn('Play again', 'again', {}, 'ek-btn ek-run', ' data-focus="1"')}${this.btn('Change mode', 'menu', {}, 'ek-btn')}</div>`;
    } else if (this.pending) {
      const t = this.fg.trait(this.pending);
      panel = `<div class="gm-bubble">The bot asks about <b>${esc(this.mine.name)}</b>: ${esc(t.ask)}</div>
        <div class="gw-answer">${this.btn('Yes', 'answer', { v: 'yes' }, 'ek-btn', ' data-focus="1"')}${this.btn('No', 'answer', { v: 'no' })}</div>`;
    } else if (youGuess) {
      panel = `<div class="gm-row">${this.tabsHtml()}<span class="gm-grow"></span>${this.btn(this.guessing ? 'Cancel guess' : 'I know it!', 'guessmode', {}, 'ek-btn')}</div>
        <div class="ek-scroll">${this.questionsHtml(this.asked)}</div>`;
    } else {
      panel = '<div class="gm-grow"></div>';
    }
    return `${head}${msg}${grid}${panel}`;
  }

  destroy() {
    clearTimeout(this._t);
    super.destroy();
  }
}
