// CycleGuardGame - two tasks on the monthly cycle, no timer. First: tap a stage card, then tap its place on a 28-day track.
// Then: Rina's period comes every 28 days and began on 5 March; tap the date of the next one on a calendar. A wrong date
// says how many days it is from 5 March. Nothing here is about preventing pregnancy. Quill is left out in this subject.
// Controls: .st-card (data-c), .st-slot (data-s), Check my answer on the track, .cal-day (data-d, day count from 1 March).
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';

const STAGES = [
  { id: 'm', name: 'Menstruation', sub: 'Lining sheds', slot: 0 },
  { id: 'r', name: 'Lining rebuilds', sub: 'Egg matures', slot: 1 },
  { id: 'o', name: 'Ovulation', sub: 'Mature egg released', slot: 2 },
  { id: 't', name: 'Lining thickens', sub: 'Rich in blood vessels', slot: 3 },
];
const SLOTS = [{ d: 'Day 1 to 5', g: 5 }, { d: 'Day 6 to 14', g: 8 }, { d: 'Day 14', g: 4 }, { d: 'Day 15 to 28', g: 11 }];
const SHUFFLE = ['o', 't', 'm', 'r'];
const START = 5, NEXT = 33;                 // 5 March + 28 days = day 33 counted from 1 March = 2 April
const LAST = 42;                            // the calendar runs to 11 April
const CSS = `
.gm.cg { background: var(--sim-bg-deep); border-radius: 14px; }
.cg .kicker { display: none; }
.q-mascot { display: none !important; }
.cg .pick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.cg .st-card { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 66px; line-height: 1.25; gap: 2px; padding: 4px 6px; }
.cg .st-card b { font-size: 15px; }
.cg .st-card small { font-size: 14px; font-weight: 600; color: var(--sim-label-muted); }
.cg .st-card[aria-pressed="true"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.cg .st-card[data-used="1"] { opacity: 0.5; border-style: dashed; }
.cg .track { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 8fr) minmax(0, 4fr) minmax(0, 11fr); gap: 4px; margin-top: 4px; }
.cg .st-slot { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-height: 84px; padding: 4px; text-align: center; line-height: 1.2; }
.cg .st-slot small { font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.cg .st-slot b { font-size: 15px; min-height: 19px; }
.cg .st-slot[data-w="1"] { border-color: var(--sim-bad); }
.sim-dom-root:not(.sim-dom-root--portrait) .cg .st-card { min-height: 94px; }
.sim-dom-root:not(.sim-dom-root--portrait) .cg .st-card b, .sim-dom-root:not(.sim-dom-root--portrait) .cg .st-slot b { font-size: 17px; }
.sim-dom-root:not(.sim-dom-root--portrait) .cg .st-slot { min-height: 128px; }
.sim-dom-root:not(.sim-dom-root--portrait) .cg .st-slot small { font-size: 15px; }
.cg .say { margin: 0; min-height: 22px; font-size: 15px; font-weight: 700; line-height: 1.3; color: var(--sim-label-muted); }
.cg .say[data-tone="good"] { color: var(--sim-label); }
.cg .cal { display: grid; grid-template-columns: repeat(14, minmax(0, 1fr)); gap: 4px; }
.cg .cal-day { min-height: 44px; padding: 0; font-size: 15px; font-weight: 800; line-height: 1.05; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cg .cal-day { white-space: nowrap; }
.cg .cal-day[data-m="a"] { background: color-mix(in oklab, var(--sim-series-1) 16%, var(--sim-bg-surface)); }
.cg .cal-day[data-k="start"] { background: color-mix(in oklab, var(--sim-series-4) 40%, var(--sim-bg-surface)); border-color: var(--sim-series-4); }
.cg .cal-day[data-k="miss"] { border-color: var(--sim-bad); }
.cg .cal-day[data-k="win"] { background: color-mix(in oklab, var(--sim-good) 34%, var(--sim-bg-surface)); border-color: var(--sim-good); }
.cg .again { align-self: flex-start; }
.cg .again[hidden], .cg [hidden] { display: none !important; }
.cg .chk { align-self: flex-end; min-width: 190px; background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); }
.sim-dom-root--portrait .cg .pick { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .cg .track { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .cg .cal { grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px; margin: 0 -4px; }
`;

export class CycleGuardGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: "Put the four stages on a 28-day track, then find the date of Rina's next period." } };
  static ARIA_LABEL = 'Place the four stages of the monthly cycle on a 28-day track, then tap the date of the next period on a calendar.';

  constructor(c, o) { super(c, o); this._part = 0; this._pick = null; this._at = {}; this._wrong = {}; this._miss = null; this._won = false; }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm cg"><div class="gm-head"><p class="kicker">The monthly cycle</p><h2 class="ttl"></h2><p class="sub sb"></p></div>
        <div class="p1"><div class="pick">${SHUFFLE.map((id) => { const c = STAGES.find((x) => x.id === id); return `<button type="button" class="tap btn st-card" data-c="${id}" aria-pressed="false"><b>${c.name}</b><small>${c.sub}</small></button>`; }).join('')}</div>
        <div class="track">${SLOTS.map((q, i) => `<button type="button" class="tap btn st-slot" data-s="${i}"><small>${q.d}</small><b></b></button>`).join('')}</div></div>
        <div class="p2" hidden><div class="cal"></div></div>
        <p class="say" aria-live="polite"></p><button type="button" class="tap btn chk">Check the track</button>
        <button type="button" class="tap btn again" hidden>Start again</button></div>`,
    });
    if (!this.root.querySelector('.chk')) return;
    this.root.querySelectorAll('.st-card').forEach((el) => onTap(el, () => { this._pick = el.dataset.c; for (const k of Object.keys(this._at)) if (this._at[k] === this._pick) delete this._at[k]; this._wrong = {}; this._draw(); }));
    this.root.querySelectorAll('.st-slot').forEach((el) => onTap(el, () => {
      const s = Number(el.dataset.s);
      if (this._pick) { this._at[s] = this._pick; this._pick = null; } else delete this._at[s];
      this._wrong = {}; this._say = ''; this._draw();
    }));
    onTap(this.root.querySelector('.chk'), () => this._checkTrack());
    onTap(this.root.querySelector('.again'), () => { this._part = 0; this._pick = null; this._at = {}; this._wrong = {}; this._miss = null; this._won = false; this._say = ''; this._draw(); });
    const cal = this.root.querySelector('.cal');
    let h = '';
    for (let d = 1; d <= LAST; d++) { const apr = d > 31, num = apr ? d - 31 : d; h += `<button type="button" class="tap btn cal-day" data-d="${d}" data-m="${apr ? 'a' : 'm'}" aria-label="${num} ${apr ? 'April' : 'March'}">${d === 1 ? '1 Mar' : d === 32 ? '1 Apr' : num}</button>`; }
    cal.innerHTML = h;
    cal.querySelectorAll('.cal-day').forEach((el) => onTap(el, () => this._day(Number(el.dataset.d))));
    this._draw();
  }
  _day(d) {
    if (this._won) return;
    if (d === NEXT) { this._miss = null; this._won = true; this._say = '5 + 28 = 33, and March has 31 days, so her next period is likely on 2 April.'; this._tone = 'good'; this._draw(); finishGame(this); return; }
    this._miss = d;
    const gap = d - START;
    this._say = gap <= 0 ? 'Her next period comes after 5 March. Count forward 28 days.' : `That is ${gap} days after 5 March. Rina's cycle is 28 days.`;
    this._tone = ''; this._draw();
  }
  _draw() {
    const part = this._part, $ = (q) => this.root.querySelector(q);
    $('.ttl').textContent = part ? "When is Rina's next period?" : 'Put the stages on the track';
    $('.sb').textContent = part ? 'Her period comes every 28 days. The last one was on 5 March.' : 'Tap a stage, then tap its place on the track.';
    $('.p1').hidden = !!part; $('.p2').hidden = !part; $('.chk').hidden = !!part;
    const used = Object.values(this._at);
    this.root.querySelectorAll('.st-card').forEach((el) => { el.setAttribute('aria-pressed', String(el.dataset.c === this._pick)); el.dataset.used = used.includes(el.dataset.c) ? '1' : '0'; });
    this.root.querySelectorAll('.st-slot').forEach((el) => { const i = el.dataset.s, c = STAGES.find((x) => x.id === this._at[i]); el.querySelector('b').textContent = c ? c.name : ''; el.dataset.w = this._wrong[i] ? '1' : '0'; });
    this.root.querySelectorAll('.cal-day').forEach((el) => { const d = Number(el.dataset.d); el.dataset.k = d === START ? 'start' : d === this._miss ? 'miss' : this._won && d === NEXT ? 'win' : ''; });
    const say = $('.say'); say.textContent = this._say ?? ''; say.dataset.tone = this._tone ?? '';
    $('.again').hidden = !this._won;
  }
  _checkTrack() {
    if (Object.keys(this._at).length < 4) { this._say = 'Place all four stages first.'; this._tone = ''; this._draw(); return; }
    this._wrong = {};
    for (const c of STAGES) { const k = Object.keys(this._at).find((a) => this._at[a] === c.id); if (Number(k) !== c.slot) this._wrong[k] = true; }
    if (Object.keys(this._wrong).length) { this._say = 'The red places need another look. A cycle starts with day 1 of a period.'; this._tone = ''; this._draw(); return; }
    this._part = 1; this._say = ''; this._draw();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
}
