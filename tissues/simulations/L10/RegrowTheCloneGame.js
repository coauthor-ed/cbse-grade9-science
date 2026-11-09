import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * RegrowTheCloneGame - mini-game for les-10, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The win condition is the Steward protocol itself:
 * take living cells that still hold their full instructions, let them shed
 * their specialisation into a cell mass, only then supply the signals that
 * build organs, and only then move the plantlet to soil.
 *
 * Two things can go wrong and both are the lesson's own points. Choosing a
 * lignified wood vessel fails because it is dead and hollow - the case
 * q-l09-q1 asks about. Reaching for organs before the cells have unspecialised
 * fails because there is nothing yet that could build one, which is what makes
 * the order a claim about development rather than a recipe to memorise.
 *
 * Deliberately NOT built on hormone ratios: this lesson only ever says
 * "adjusted signals", so a game keyed to auxin against cytokinin would be
 * unwinnable from anything the student has been shown.
 */

const W = 900;
const H = 600;

const EXPLANTS = [
  { value: 'storage', label: 'Living storage tissue from the root', alive: true },
  { value: 'vessel',  label: 'A lignified wood vessel from the stem', alive: false },
  { value: 'leafwax', label: 'A scraping of the waxy outer coating',  alive: false },
];

const STEPS = [
  { value: 'none',         label: '- nothing -' },
  { value: 'unspecialise', label: 'Let the cells shed their specialisation and divide' },
  { value: 'organs',       label: 'Supply the signals that build shoots and roots' },
  { value: 'soil',         label: 'Move the plantlet into soil' },
];

const ORDER = ['unspecialise', 'organs', 'soil'];

const CSS = `
.rtc { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.rtc .flow {
  position: absolute; left: 40px; right: 40px; top: 54px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
}
.rtc .stage {
  border: 3px solid var(--sim-border); border-radius: 20px;
  background: var(--sim-bg-surface); padding: 14px; box-sizing: border-box;
  min-height: 300px; display: flex; flex-direction: column; align-items: center;
}
.rtc .stage.ok { border-color: var(--sim-good); }
.rtc .stage.dead { border-color: var(--sim-bad); }
.rtc .stage h4 {
  margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted); text-align: center;
}
.rtc .art { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
.rtc .cap { margin: 10px 0 0; font-size: 13px; line-height: 1.45; text-align: center; }
.rtc .stage.dead .cap { color: var(--sim-bad); }
.rtc .stage.ok .cap { color: var(--sim-good); font-weight: 700; }

.rtc .chunk { width: 62px; height: 62px; border-radius: 12px; border: 2px solid var(--sim-bg-deep); background: var(--sim-series-4); }
.rtc .chunk.dead { background: var(--sim-track); }
.rtc .mass { display: flex; flex-wrap: wrap; gap: 5px; width: 86px; justify-content: center; }
.rtc .mass i { width: 15px; height: 15px; border-radius: 50%; background: var(--sim-series-1); border: 2px solid var(--sim-bg-deep); }
.rtc .sprout { position: relative; width: 80px; height: 110px; }
.rtc .sprout .stem { position: absolute; left: 38px; top: 12px; width: 5px; height: 54px; background: var(--sim-series-2); }
.rtc .sprout .leafL, .rtc .sprout .leafR {
  position: absolute; top: 6px; width: 30px; height: 18px; border-radius: 60% 10%;
  background: var(--sim-series-2); border: 2px solid var(--sim-bg-deep);
}
.rtc .sprout .leafL { left: 8px; } .rtc .sprout .leafR { left: 42px; transform: scaleX(-1); }
.rtc .sprout .rootL, .rtc .sprout .rootR {
  position: absolute; top: 66px; width: 3px; height: 30px; background: var(--sim-series-3);
}
.rtc .sprout .rootL { left: 30px; transform: rotate(18deg); }
.rtc .sprout .rootR { left: 48px; transform: rotate(-18deg); }
.rtc .pot {
  width: 70px; height: 46px; background: var(--sim-series-6);
  border: 2px solid var(--sim-bg-deep); border-radius: 0 0 14px 14px;
}
.rtc .nothing { font-size: 34px; color: var(--sim-label-muted); }

.rtc .hintline {
  position: absolute; left: 40px; right: 270px; bottom: 26px;
  font-size: 14px; line-height: 1.5; color: var(--sim-label-muted); margin: 0;
}
.rtc .hintline b { color: var(--sim-accent); }
`;

export class RegrowTheCloneGame extends withChallenge(DomSimulation) {
  static simId = 'regrow-the-clone-game';
  static label = { en: 'Regrow the Plant' };
  static category = 'biology.tissues';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A four-stage tissue-culture bench. Choose the starting piece of plant and what happens at '
    + 'each of the three stages that follow.';

  static OBJECTIVE = {
    prompt: { en: 'Turn one scrap of a plant into a whole new plant. The starting piece matters, and so does the order.' },
  };
  static SCORING = { mode: 'accuracy' };   // checkObjective returns {ok}

  static CONTROLS = [
    { type: 'select', id: 'explant', label: 'Start from:', value: 'vessel',
      options: EXPLANTS.map((e) => ({ value: e.value, label: e.label })) },
    { type: 'select', id: 'step1', label: 'Then:', value: 'none',
      options: STEPS.map((s) => ({ value: s.value, label: s.label })) },
    { type: 'select', id: 'step2', label: 'Then:', value: 'none',
      options: STEPS.map((s) => ({ value: s.value, label: s.label })) },
    { type: 'select', id: 'step3', label: 'Finally:', value: 'none',
      options: STEPS.map((s) => ({ value: s.value, label: s.label })) },
  ];

  constructor(container, config) {
    super(container, config);
    this.explant = 'vessel';
    this.steps = ['none', 'none', 'none'];
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="rtc">
        <div class="flow">
          ${['The starting piece', 'Stage 1', 'Stage 2', 'Stage 3'].map((t, i) => `
            <div class="stage" data-stage="${i}">
              <h4>${t}</h4>
              <div class="art"></div>
              <p class="cap"></p>
            </div>`).join('')}
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._stages = Array.from(this.root.querySelectorAll('.stage'));
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 782, y: 552, height: 122, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Steward started with living carrot. That choice was half the experiment.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id === 'explant') this.explant = String(value);
    else if (id === 'step1') this.steps[0] = String(value);
    else if (id === 'step2') this.steps[1] = String(value);
    else if (id === 'step3') this.steps[2] = String(value);
    else return;
    this._moved = true;
    this._render();
  }

  /**
   * Walks the bench one stage at a time. `phase` climbs
   * explant -> mass -> plantlet -> planted, and stalls the moment a stage is
   * asked for something the culture is not yet ready to do.
   * @returns {{phase:string, caps:string[], failedAt:number}}
   */
  _run() {
    const alive = EXPLANTS.find((e) => e.value === this.explant)?.alive;
    let phase = alive ? 'explant' : 'dead';
    const caps = [];
    let failedAt = -1;

    this.steps.forEach((step, i) => {
      if (phase === 'dead') { caps.push('nothing to work with'); if (failedAt < 0) failedAt = i; return; }
      if (step === 'unspecialise') {
        if (phase === 'explant') { phase = 'mass'; caps.push('the cells let go and divide into a mass'); return; }
        caps.push('these cells have already left that stage'); if (failedAt < 0) failedAt = i; return;
      }
      if (step === 'organs') {
        if (phase === 'mass') { phase = 'plantlet'; caps.push('shoots and roots take shape'); return; }
        caps.push('there is no unspecialised mass here to build from'); if (failedAt < 0) failedAt = i; return;
      }
      if (step === 'soil') {
        if (phase === 'plantlet') { phase = 'planted'; caps.push('the young plant takes hold'); return; }
        caps.push('nothing here can survive being planted yet'); if (failedAt < 0) failedAt = i; return;
      }
      caps.push('nothing happens'); if (failedAt < 0) failedAt = i;
    });

    return { phase, caps, failedAt };
  }

  _art(kind) {
    if (kind === 'explant') return '<div class="chunk"></div>';
    if (kind === 'dead') return '<div class="chunk dead"></div>';
    if (kind === 'mass') return `<div class="mass">${'<i></i>'.repeat(11)}</div>`;
    if (kind === 'plantlet') return '<div class="sprout"><span class="leafL"></span><span class="leafR"></span><span class="stem"></span><span class="rootL"></span><span class="rootR"></span></div>';
    if (kind === 'planted') return '<div class="sprout"><span class="leafL"></span><span class="leafR"></span><span class="stem"></span></div><div class="pot"></div>';
    return '<span class="nothing">&middot;</span>';
  }

  _render() {
    const { phase, caps, failedAt } = this._run();
    const alive = EXPLANTS.find((e) => e.value === this.explant)?.alive;

    // stage 0: the starting piece
    this._stages[0].classList.toggle('dead', !alive);
    this._stages[0].classList.toggle('ok', !!alive);
    this._stages[0].querySelector('.art').innerHTML = this._art(alive ? 'explant' : 'dead');
    this._stages[0].querySelector('.cap').textContent = alive
      ? 'living cells, instructions intact'
      : 'no living contents - nothing can restart in here';

    // stages 1..3
    let running = alive ? 'explant' : 'dead';
    this.steps.forEach((step, i) => {
      const el = this._stages[i + 1];
      const failed = failedAt === i || (failedAt >= 0 && i > failedAt);
      let shown = running;
      if (!failed && running !== 'dead') {
        if (step === 'unspecialise' && running === 'explant') shown = 'mass';
        else if (step === 'organs' && running === 'mass') shown = 'plantlet';
        else if (step === 'soil' && running === 'plantlet') shown = 'planted';
      }
      if (failed) shown = 'none';
      running = shown === 'none' ? running : shown;
      el.classList.toggle('dead', failed);
      el.classList.toggle('ok', !failed && shown !== 'none' && step !== 'none');
      el.querySelector('.art').innerHTML = this._art(failed || step === 'none' ? 'none' : shown);
      el.querySelector('.cap').textContent = caps[i] || '';
    });

    this._hint.innerHTML = phase === 'planted'
      ? '<b>A whole plant</b>, from one scrap of the old one.'
      : 'The bench has not produced a plant yet.';
  }

  checkObjective() {
    if (!this._moved) return null;
    const { phase } = this._run();

    if (phase === 'planted') {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    const alive = EXPLANTS.find((e) => e.value === this.explant)?.alive;
    let hint;
    if (!alive) {
      hint = 'This piece has no living contents left. Steward needed cells that still held the whole set of instructions.';
    } else if (this.steps.includes('none')) {
      hint = 'One of the stages is still empty. Three things have to happen, in an order that makes sense.';
    } else if (this.steps.indexOf('organs') < this.steps.indexOf('unspecialise')) {
      hint = 'You asked for shoots and roots before the cells had let go of what they already were. What has to happen first?';
    } else {
      hint = 'Right ingredients, wrong order. Unspecialise, then build the organs, then plant it out.';
    }
    return { ok: false, hint };
  }
}
