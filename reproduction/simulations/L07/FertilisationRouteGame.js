// FertilisationRouteGame - Trace three journeys. The learner taps the parts of a labelled diagram in order: a sperm
// leaving the male body, the same sperm through the female body, an egg, and a zygote. A wrong tap gives a hint and costs
// nothing. Quill is left out: this is a medical diagram, not a place for a mascot. No counter, no clock.
// Controls: .pick (data-p) on the figure, .next (Next journey) and .again (Start again).
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { maleSystemSvg, femaleSystemSvg, n } from '../shared/BodyArt.js';

const JOURNEY = [
  { name: 'A sperm leaves the male body', fig: 'male', mark: 'sperm', order: ['testis', 'vas', 'urethra'], done: 'Sperm form in a testis, travel along the vas deferens and leave through the urethra.',
    hint: { testis: 'Start where sperm are made.', vas: 'Which long tube leaves the testis?', urethra: 'Which passage opens to the outside?' } },
  { name: 'A sperm swims through the female body', fig: 'female', mark: 'sperm', order: ['vagina', 'cervix', 'uterus', 'tube'], done: 'Sperm enter through the vagina, pass the cervix, swim through the uterus and may reach the oviduct.',
    hint: { vagina: 'Where do sperm enter?', cervix: 'Which narrow passage comes next?', uterus: 'Which bag-like part lies above the cervix?', tube: 'Where can a sperm meet an egg?' } },
  { name: 'An egg leaves the ovary', fig: 'female', mark: 'egg', order: ['ovary', 'tube'], done: 'An ovary releases the egg, and the oviduct moves it along.',
    hint: { ovary: 'Where is an egg released from?', tube: 'Which tube gathers the egg?' } },
  { name: 'A zygote finds its place', fig: 'female', mark: 'zygote', order: ['tube', 'uterus', 'lining'], done: 'The zygote forms in the oviduct, divides on its way to the uterus and implants in the lining. Pregnancy begins here.',
    hint: { tube: 'Where does the zygote form?', uterus: 'Where does the oviduct lead?', lining: 'What does the ball of cells implant into?' } },
];
const LABEL = { testis: 'Testis', vas: 'Vas deferens', urethra: 'Urethra', bladder: 'Urinary bladder', vagina: 'Vagina', cervix: 'Cervix', uterus: 'Uterus', tube: 'Oviduct', ovary: 'Ovary', lining: 'Lining of uterus' };
// button middle (box units) and the point on the part (box units)
const SPOT = {
  male: { testis: [[270, 318], [150, 296]], vas: [[46, 22], [88, 110]], urethra: [[40, 196], [92, 250]], bladder: [[250, 40], [165, 110]] },
  female: { vagina: [[348, 306], [250, 300]], cervix: [[348, 246], [246, 238]], uterus: [[84, 262], [150, 120]], tube: [[350, 16], [344, 62]], ovary: [[84, 206], [86, 150]], lining: [[116, 16], [196, 84]] },
};
const FIG = { male: ['vas', 'urethra', 'testis', 'bladder'], female: ['tube', 'ovary', 'uterus', 'cervix', 'vagina'] };
const CSS = `
.frt .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 500px minmax(0, 1fr); gap: 16px; align-items: start; }
.frt .kicker { display: none; }
.frt .fig { position: relative; width: 500px; height: 284px; border: var(--sim-border); border-radius: var(--sim-radius-lg); background: color-mix(in oklab, var(--sim-series-8) 7%, var(--sim-bg-deep)); overflow: hidden; }
.frt .fig svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.frt .pick { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; min-height: 44px; padding: 4px 10px; font-size: 15px; }
.frt .pick[data-done="1"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 24%, var(--sim-bg-surface)); }
.frt .pick[data-miss="1"] { border-color: var(--sim-bad); }
.frt .side { display: flex; flex-direction: column; gap: 8px; }
.frt ol { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.frt li { display: flex; gap: 8px; align-items: center; font-size: 15px; font-weight: 700; color: var(--sim-label-muted); min-height: 28px; line-height: 1.2; }
.frt li i { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 50%; border: var(--sim-border); font: 800 14px/18px var(--sim-font); text-align: center; color: var(--sim-label); }
.frt li[data-s="now"] { color: var(--sim-label); }
.frt li[data-s="now"] i { background: var(--sim-accent); color: var(--sim-bg-deep); }
.frt li[data-s="done"] i { background: var(--sim-good); color: var(--sim-bg-deep); }
.frt .say { min-height: 62px; padding: 8px 12px; margin: 0; border: var(--sim-border); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); font-size: 15px; font-weight: 700; line-height: 1.3; }
.frt .say[data-tone="miss"] { border-color: var(--sim-bad); }
.frt .say[data-tone="good"] { border-color: var(--sim-good); }
.frt .next, .frt .again { width: 100%; }
.frt .next[hidden], .frt .again[hidden] { display: none; }
.gm.frt { background: var(--sim-bg-deep); border-radius: 14px; }
.q-mascot { display: none !important; }
.sim-dom-root--portrait .frt .board { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .frt .fig { width: 100%; height: 308px; }
.sim-dom-root--portrait .frt .side { width: 100%; }
.sim-dom-root--portrait .frt .pick { font-size: 14px; padding: 2px 8px; }
.gm-quill .sim-dom-root--portrait .frt h2 { padding-right: 0; }
`;

export class FertilisationRouteGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Trace three journeys on the diagram, one part at a time: a sperm, an egg and a zygote.' } };
  static ARIA_LABEL = 'Trace three journeys: tap the parts of a labelled diagram in the right order for a sperm, an egg and a zygote.';

  constructor(c, o) { super(c, o); this._j = 0; this._at = 0; this._miss = null; this._say = null; this._tone = ''; this._won = false; }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm frt"><div class="gm-head"><p class="kicker">Three journeys</p><h2 class="ttl"></h2></div>
        <div class="board"><div class="fig"></div><div class="side"><ol></ol><p class="say" aria-live="polite"></p>
        <button type="button" class="tap btn next" hidden>Next journey</button><button type="button" class="tap btn again" hidden>Start again</button></div></div></div>`,
    });
    const next = this.root.querySelector('.next'), again = this.root.querySelector('.again');
    if (!next) return;
    onTap(next, () => this._next());
    onTap(again, () => { this._j = 0; this._at = 0; this._say = null; this._tone = ''; this._miss = null; this._won = false; this._draw(); });
    this._draw();
  }
  relayout(...a) { const w = this._w; super.relayout?.(...a); const cur = this.root?.querySelector?.('.fig')?.clientWidth; if (cur && cur !== w) { this._w = cur; this._draw(); } }
  _next() {
    this._j += 1; this._at = 0; this._say = null; this._tone = ''; this._miss = null;
    this._draw();
  }
  _tap(p) {
    const J = JOURNEY[this._j], want = J.order[this._at];
    if (this._at >= J.order.length) return;
    if (p !== want) { this._miss = p; this._say = J.hint[want]; this._tone = 'miss'; this._draw(); return; }
    this._miss = null; this._at += 1; this._say = null; this._tone = '';
    if (this._at === J.order.length) {
      this._say = J.done; this._tone = 'good';
      if (this._j === JOURNEY.length - 1) { this._won = true; this._draw(); finishGame(this); return; }
    }
    this._draw();
  }
  _draw() {
    const J = JOURNEY[this._j], fig = this.root.querySelector('.fig'), male = J.fig === 'male';
    this.root.querySelector('.ttl').textContent = J.name;
    const W = fig.clientWidth || 500, H = fig.clientHeight || 284, boxW = male ? 356 : 440, boxH = male ? 345 : 340;
    const k = Math.min((W - 8) / boxW, (H - 8) / boxH), ax = (W - boxW * k) / 2, ay = (H - boxH * k) / 2;
    const pt = (p) => [ax + p[0] * k, ay + p[1] * k];
    const tapped = J.order.slice(0, this._at);
    const lit = (id) => tapped.includes(id) || (id === 'lining' && tapped.includes('lining'));
    const o = { lit, id: 'frt', lining: J.mark === 'zygote' ? 0.9 : 0.5 };
    let s = male ? maleSystemSvg(ax, ay, k, { lit }) : femaleSystemSvg(ax, ay, k, o);
    const names = [...(male ? FIG.male : FIG.female)];
    if (J.mark === 'zygote') { names.splice(names.indexOf('ovary'), 1, 'lining'); }
    for (const id of names) {
      const [b, tp] = SPOT[J.fig][id];
      const [x0, y0] = pt(b), [x1, y1] = pt(tp), on = tapped.includes(id);
      s += `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}" style="fill:none;stroke:var(--sim-label);stroke-width:${on ? 3 : 2};opacity:${on ? 1 : 0.55}"/><circle cx="${n(x1)}" cy="${n(y1)}" r="4" style="fill:var(--sim-label)"/>`;
    }
    fig.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${s}</svg>`;
    for (const id of names) {
      const [b] = SPOT[J.fig][id], [x, y] = pt(b), idx = tapped.indexOf(id);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'tap btn pick'; btn.dataset.p = id;
      btn.textContent = `${idx >= 0 ? `${idx + 1}. ` : ''}${LABEL[id]}`;
      btn.dataset.done = idx >= 0 ? '1' : '0'; btn.dataset.miss = this._miss === id ? '1' : '0';
      btn.style.left = `${n(Math.max(58, Math.min(W - 58, x)))}px`; btn.style.top = `${n(Math.max(26, Math.min(H - 26, y)))}px`;
      onTap(btn, () => this._tap(id));
      fig.appendChild(btn);
    }
    this.root.querySelector('ol').innerHTML = JOURNEY.map((q, i) => `<li data-s="${i < this._j || (i === this._j && this._at === q.order.length) ? 'done' : i === this._j ? 'now' : 'wait'}"><i>${i + 1}</i>${q.name}</li>`).join('');
    const say = this.root.querySelector('.say');
    say.textContent = this._say ?? 'Tap the first part of this journey.';
    if (!this._say && this._at > 0) say.textContent = 'Now tap the next part.';
    say.dataset.tone = this._tone;
    const end = this._at === J.order.length;
    this.root.querySelector('.next').hidden = !(end && this._j < JOURNEY.length - 1);
    this.root.querySelector('.again').hidden = !this._won;
  }
  checkObjective() { return this._won ? { ok: true } : null; }
}
