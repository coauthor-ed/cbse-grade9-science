import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * ShipTheProteinGame - mini-game for les-05, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). blk-l05-s11a lists the assembly line as five
 * numbered steps, and a numbered list is exactly the thing a student can
 * recite without understanding. What makes the order real is that each stage
 * needs the PREVIOUS stage's product and produces something new: instructions,
 * then a raw chain, then a folded shape, then a packaged parcel.
 *
 * So the cargo here carries a state, and every station accepts only one state.
 * The student is never asked "what comes third" - they are told what they are
 * holding, and each wrong station refuses for its own reason. The two most
 * common wrong models both have a station that punishes them:
 *
 *   skip the ER      the Golgi packages an unfolded chain, and a parcel with
 *                    the wrong shape inside is junk - packaging is not folding
 *   ship it early    the membrane sends out something unfinished
 *   recycle it       blk-l05-s10's lysosome breaks down "unwanted molecules",
 *                    and it does not check whether you meant it
 *
 * Deterministic state machine, so it probes headlessly.
 */

const W = 900;
const H = 600;

const MAX_MOVES = 7;

/**
 * Cargo states, in the order the lesson builds them. `junk` and `destroyed`
 * are terminal failures rather than steps.
 */
const STATE_LABEL = {
  none: 'nothing yet',
  instructions: 'a copy of the instructions',
  chain: 'a raw protein chain',
  folded: 'a correctly folded protein',
  packaged: 'a packaged parcel, addressed',
  delivered: 'delivered',
  junk: 'a ruined parcel',
  destroyed: 'broken up for parts',
};

/**
 * Station -> what it needs, what it produces, and why it refuses. Every
 * refusal names the cargo rather than the step number, so the student reasons
 * about what they are holding.
 */
const STATIONS = [
  {
    id: 'nucleus', name: 'Nucleus', role: 'The blueprint', cls: 'nucleus',
    x: 96, y: 118,
    needs: 'none', gives: 'instructions',
    refuse: 'The instructions have already been copied. Copying them again gets you no further.',
  },
  {
    id: 'ribosome', name: 'Ribosomes', role: 'The workbench', cls: 'ribosome',
    x: 330, y: 96,
    needs: 'instructions', gives: 'chain',
    refuse: 'The workbench builds from instructions. Without them there is nothing to build from.',
  },
  {
    id: 'er', name: 'Rough ER', role: 'The assembly hall', cls: 'er',
    x: 566, y: 118,
    needs: 'chain', gives: 'folded',
    refuse: 'The assembly hall folds a raw chain into shape. What you are carrying is not a raw chain.',
  },
  {
    id: 'golgi', name: 'Golgi apparatus', role: 'The shipping centre', cls: 'golgi',
    x: 566, y: 330,
    needs: 'folded', gives: 'packaged',
    // Packaging an unfolded chain is the interesting failure, so it is not a
    // refusal - it succeeds, and ruins the product.
    spoils: { from: 'chain', to: 'junk', why: 'The Golgi packaged it exactly as handed over - an unfolded chain, sealed in a parcel. Packaging is not folding.' },
    refuse: 'The shipping centre packages a finished, folded protein. This is not one.',
  },
  {
    id: 'membrane', name: 'Cell membrane', role: 'Delivery', cls: 'membrane',
    x: 330, y: 452,
    needs: 'packaged', gives: 'delivered',
    spoils: { from: 'folded', to: 'junk', why: 'It went out unpackaged and unaddressed, so nothing received it.' },
    refuse: 'Delivery sends out a packaged parcel. There is nothing here ready to send.',
  },
  {
    id: 'lysosome', name: 'Lysosome', role: 'Recycling', cls: 'lysosome',
    x: 96, y: 330,
    needs: null, gives: 'destroyed',
    refuse: '',
  },
];

const CSS = `
.stpg { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.stpg .floor {
  position: absolute; left: 30px; top: 52px; width: 700px; height: 508px;
  border: 3px dashed var(--sim-border); border-radius: 26px; background: var(--sim-cytoplasm);
}
.stpg .floorlabel {
  position: absolute; left: 46px; top: 30px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}

.stpg .station {
  position: absolute; width: 168px; padding: 11px 13px; box-sizing: border-box;
  border-radius: 16px; border: 3px solid var(--sim-border); background: var(--sim-bg-surface);
  cursor: pointer; text-align: left; font: inherit; color: inherit;
  transition: transform 140ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1)), border-color 140ms;
}
.stpg .station:hover { transform: translateY(-3px); }
.stpg .station:focus-visible { outline: 3px solid var(--sim-gold); outline-offset: 3px; }
.stpg .station:disabled { cursor: default; opacity: 0.55; }
.stpg .station .swatch {
  display: inline-block; width: 12px; height: 12px; border-radius: 3px;
  border: 2px solid var(--sim-bg-deep); vertical-align: -1px; margin-right: 7px;
}
.stpg .station .name { font-size: 14px; font-weight: 700; }
.stpg .station .role {
  display: block; margin-top: 2px; font-size: 11.5px; color: var(--sim-label-muted);
}
.stpg .station.visited { border-color: var(--sim-good); }
.stpg .station.bad { border-color: var(--sim-bad); }

.stpg .sw-nucleus { background: var(--sim-nucleus); }
.stpg .sw-ribosome { background: var(--sim-ribosome); }
.stpg .sw-er { background: var(--sim-er); }
.stpg .sw-golgi { background: var(--sim-golgi); }
.stpg .sw-membrane { background: var(--sim-membrane); }
.stpg .sw-lysosome { background: var(--sim-lysosome); }

.stpg .cargo {
  position: absolute; left: 268px; top: 246px; width: 224px; padding: 14px;
  box-sizing: border-box; border-radius: 18px; text-align: center;
  background: var(--sim-bg-deep); border: 3px solid var(--sim-accent);
}
.stpg .cargo .what {
  font-family: var(--sim-font-display); font-size: 17px; line-height: 1.25;
}
.stpg .cargo .holding {
  display: block; font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--sim-label-muted); margin-bottom: 5px;
}
.stpg .cargo.ok { border-color: var(--sim-good); }
.stpg .cargo.ok .what { color: var(--sim-good); }
.stpg .cargo.bad { border-color: var(--sim-bad); }
.stpg .cargo.bad .what { color: var(--sim-bad); }

.stpg .side { position: absolute; right: 26px; top: 52px; width: 140px; }
.stpg .side h4 {
  margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--sim-label-muted);
}
.stpg .route { margin: 0; padding: 0; list-style: none; font-size: 12.5px; line-height: 1.7; }
.stpg .route li { color: var(--sim-label-muted); }
.stpg .moves { margin: 12px 0 0; font-size: 12.5px; color: var(--sim-label-muted); }
.stpg .moves b { color: var(--sim-accent); }

.stpg .note {
  position: absolute; left: 30px; right: 200px; bottom: 14px; margin: 0;
  font-size: 13.5px; line-height: 1.5; color: var(--sim-label-muted); min-height: 40px;
}
.stpg .note b { color: var(--sim-bad); }
`;

export class ShipTheProteinGame extends withChallenge(DomSimulation) {
  static simId = 'ship-the-protein-game';
  static label = { en: 'Ship the Protein' };
  static category = 'biology.cells';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Six organelles around a cell. You are carrying one protein-to-be; click an organelle to take '
    + 'it there. Each one accepts only a particular stage of the work.';

  static OBJECTIVE = {
    prompt: {
      en: 'Get one finished protein out of the cell. Each stop only accepts what the stop before it '
        + `produced, and you have ${MAX_MOVES} moves.`,
    },
  };
  static SCORING = { mode: 'accuracy' };

  static CONTROLS = [
    { type: 'button', id: 'reset', label: 'Start over' },
  ];

  constructor(container, config) {
    super(container, config);
    this.state = 'none';
    this.route = [];
    this.note = '';
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="stpg">
        <p class="floorlabel">Inside one large cell</p>
        <div class="floor"></div>
        ${STATIONS.map((s) => `
          <button type="button" class="station" data-station="${s.id}" style="left:${s.x}px;top:${s.y}px">
            <span class="name"><span class="swatch sw-${s.cls}"></span>${s.name}</span>
            <span class="role">${s.role}</span>
          </button>`).join('')}
        <div class="cargo">
          <span class="holding">You are carrying</span>
          <div class="what"></div>
        </div>
        <div class="side">
          <h4>Route so far</h4>
          <ol class="route"></ol>
          <p class="moves"></p>
        </div>
        <p class="note"></p>
      </div>
    `);

    this._cargoEl = this.root.querySelector('.cargo');
    this._whatEl = this.root.querySelector('.what');
    this._routeEl = this.root.querySelector('.route');
    this._movesEl = this.root.querySelector('.moves');
    this._noteEl = this.root.querySelector('.note');

    this.root.querySelectorAll('[data-station]').forEach((b) => {
      b.addEventListener('click', () => this._visit(b.dataset.station));
    });

    this.quill = SimMascotDom.mount(this.root, { x: 806, y: 556, height: 116, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Do not go by the numbers. Go by what is in your hands.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id) {
    if (id !== 'reset') return;
    this.state = 'none';
    this.route = [];
    this.note = '';
    this._moved = true;
    this._render();
  }

  get finished() {
    return this.state === 'delivered' || this.state === 'junk' || this.state === 'destroyed';
  }

  /** Take the cargo to a station. Terminal states and the move budget stop it. */
  _visit(id) {
    if (this.finished || this.route.length >= MAX_MOVES) return;
    const station = STATIONS.find((s) => s.id === id);
    if (!station) return;
    this._moved = true;

    if (station.id === 'lysosome') {
      this.state = 'destroyed';
      this.note = 'Recycling breaks down whatever it is given. It had no way to know this one was wanted.';
    } else if (station.spoils && station.spoils.from === this.state) {
      this.state = station.spoils.to;
      this.note = station.spoils.why;
    } else if (station.needs === this.state) {
      this.state = station.gives;
      this.note = '';
    } else {
      this.note = station.refuse;
      this.route.push({ id, name: station.name, ok: false });
      this._render();
      return;
    }

    this.route.push({ id, name: station.name, ok: this.state !== 'junk' && this.state !== 'destroyed' });
    this._render();
  }

  _render() {
    const spent = this.route.length;
    const dead = this.finished;

    this._whatEl.textContent = STATE_LABEL[this.state];
    this._cargoEl.classList.toggle('ok', this.state === 'delivered');
    this._cargoEl.classList.toggle('bad', this.state === 'junk' || this.state === 'destroyed');

    this._routeEl.innerHTML = this.route.length
      ? this.route.map((r) => `<li>${r.name}</li>`).join('')
      : '<li>nothing yet</li>';
    this._movesEl.innerHTML = `<b>${MAX_MOVES - spent}</b> moves left`;

    this.root.querySelectorAll('[data-station]').forEach((b) => {
      const hit = this.route.filter((r) => r.id === b.dataset.station);
      b.classList.toggle('visited', hit.some((r) => r.ok));
      b.classList.toggle('bad', hit.length > 0 && !hit.some((r) => r.ok));
      b.disabled = dead || spent >= MAX_MOVES;
    });

    this._noteEl.innerHTML = this.note
      ? `<b>${this.note}</b>`
      : this.state === 'delivered'
        ? 'Out of the cell, folded, packaged and addressed.'
        : 'Every stop accepts one thing and hands back another.';
  }

  checkObjective() {
    if (!this._moved) return null;

    if (this.state === 'delivered') {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    let hint;
    if (this.state === 'destroyed') {
      hint = 'The lysosome broke it up. Recycling is a department like any other - it does its job on '
        + 'whatever arrives, which is exactly why the cell keeps it in its own compartment.';
    } else if (this.state === 'junk') {
      hint = this.note || 'It got shipped, but not as a working protein.';
    } else if (this.route.length >= MAX_MOVES) {
      hint = `Out of moves, still holding ${STATE_LABEL[this.state]}. There is a route that takes `
        + 'five stops - each one needs what the stop before it produced.';
    } else {
      hint = `Still holding ${STATE_LABEL[this.state]}. Ask which department takes that as its input, `
        + 'rather than which one comes next in the list.';
    }
    return { ok: false, hint };
  }
}
