import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SetThePoreGame - mini-game for les-03, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). blk-l03-s03 sets out the two extremes - a
 * boundary that lets everything through and one that lets nothing through -
 * and blk-l03-s04 names the answer "selective permeability". The word is easy
 * to memorise and says nothing about HOW a boundary selects. Here it selects
 * the only way a hole can: by size. The student sets one gap, and the four
 * things that must happen are each decided by whether a given molecule is
 * narrower than that gap:
 *
 *   nutrient  0.8 nm  must get IN     -> gap must be wider than 0.8
 *   waste     0.6 nm  must get OUT    -> comes free with the above
 *   toxin     2.0 nm  must stay OUT   -> gap must be narrower than 2.0
 *   machinery 4.0 nm  must stay IN    -> comes free with the above
 *
 * So the win condition is a genuine window, and BOTH extremes the lesson names
 * are losing moves you can feel: sealed starves the cell, wide open poisons it
 * and empties it. There is no way to pass by opening further or closing
 * further - only by placing the gap between two specific molecules, which is
 * what selecting by size means.
 *
 * Deterministic and closed-form, so it probes headlessly.
 */

const W = 900;
const H = 600;

/** Diameters in nanometres. The ruler is drawn from these, never hard-coded. */
const SPECIES = [
  { id: 'water', label: 'Water', size: 0.3, side: 'both', cls: 'water', rule: null },
  { id: 'waste', label: 'Waste', size: 0.6, side: 'in', cls: 'waste', rule: 'out' },
  { id: 'nutrient', label: 'Nutrient', size: 0.8, side: 'out', cls: 'nutrient', rule: 'in' },
  { id: 'toxin', label: 'Toxin', size: 2.0, side: 'out', cls: 'toxin', rule: 'stay-out' },
  { id: 'machinery', label: 'Machinery', size: 4.0, side: 'in', cls: 'machinery', rule: 'stay-in' },
];

const MIN_PORE = 0.2;
const MAX_PORE = 5.0;
const START_PORE = 0.2;

/** Ruler geometry - nm mapped onto x pixels with a log scale, so 0.3 and 4.0
 *  are both legible on one axis. */
const RULER_X = 90;
const RULER_W = 640;
const nmToX = (nm) => RULER_X + (Math.log(nm / 0.2) / Math.log(MAX_PORE / 0.2)) * RULER_W;

const CSS = `
.stp { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.stp .outside, .stp .inside {
  position: absolute; top: 56px; height: 250px; border-radius: 20px;
  border: 3px solid var(--sim-border); box-sizing: border-box; padding: 34px 16px 16px;
}
.stp .outside { left: 34px; width: 330px; background: var(--sim-water); }
.stp .inside { left: 470px; width: 330px; background: var(--sim-cytoplasm); }
.stp .zonelabel {
  position: absolute; left: 16px; top: 12px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}

.stp .membrane {
  position: absolute; left: 388px; top: 56px; width: 58px; height: 250px;
  border-radius: 12px; background: var(--sim-membrane);
  box-shadow: 0 0 16px var(--sim-membrane-glow);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.stp .gap {
  width: 100%; background: var(--sim-bg-deep);
  transition: height 200ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}

.stp .chip {
  display: inline-flex; align-items: center; gap: 7px; margin: 0 8px 9px 0;
  padding: 5px 11px 5px 6px; border-radius: 999px; font-size: 13px; font-weight: 600;
  background: var(--sim-bg-surface); border: 2px solid var(--sim-border);
}
.stp .chip .dot { border-radius: 50%; border: 2px solid var(--sim-bg-deep); flex: none; }
.stp .chip.pass { border-color: var(--sim-good); }
.stp .chip.fail { border-color: var(--sim-bad); }
.stp .chip small { font-weight: 500; color: var(--sim-label-muted); }
.stp .chip.fail small { color: var(--sim-bad); }
.stp .chip.pass small { color: var(--sim-good); }

.stp .water { background: var(--sim-water); }
.stp .waste { background: var(--sim-waste); }
.stp .nutrient { background: var(--sim-nutrient); }
.stp .toxin { background: var(--sim-danger); }
.stp .machinery { background: var(--sim-protein); }

.stp .ruler { position: absolute; left: 0; right: 0; top: 348px; height: 150px; }
.stp .axis {
  position: absolute; left: ${RULER_X}px; width: ${RULER_W}px; top: 74px; height: 3px;
  background: var(--sim-track); border-radius: 2px;
}
.stp .tick { position: absolute; top: 60px; width: 2px; height: 17px; background: var(--sim-label-muted); }
.stp .ticklabel {
  position: absolute; top: 84px; font-size: 11px; color: var(--sim-label-muted);
  transform: translateX(-50%); white-space: nowrap;
}
.stp .marker { position: absolute; top: 30px; transform: translateX(-50%); text-align: center; }
.stp .marker .dot {
  border-radius: 50%; border: 2px solid var(--sim-bg-deep); margin: 0 auto;
}
.stp .marker .nm { font-size: 10px; color: var(--sim-label-muted); margin-top: 3px; }
.stp .poreline {
  position: absolute; top: 20px; height: 96px; width: 3px; background: var(--sim-accent);
  transition: left 200ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}
.stp .porecap {
  position: absolute; top: 0; transform: translateX(-50%); font-size: 12px; font-weight: 700;
  color: var(--sim-accent); white-space: nowrap;
  transition: left 200ms var(--ease-settle, cubic-bezier(0.2, 0.8, 0.3, 1));
}
.stp .rulerhead {
  position: absolute; left: ${RULER_X}px; top: 0; font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted);
}

.stp .status {
  position: absolute; left: 34px; right: 250px; bottom: 22px; margin: 0;
  font-size: 14px; line-height: 1.5; color: var(--sim-label-muted);
}
.stp .status b { color: var(--sim-accent); }
.stp .status b.ok { color: var(--sim-good); }
.stp .status b.no { color: var(--sim-bad); }
`;

export class SetThePoreGame extends withChallenge(DomSimulation) {
  static simId = 'set-the-pore-game';
  static label = { en: 'Set the Pore' };
  static category = 'biology.cells';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A membrane with one adjustable gap. Nutrients and waste must cross it, a toxin and the '
    + "cell's own machinery must not. Set the gap width in nanometres.";

  static OBJECTIVE = {
    prompt: {
      en: 'Set one gap that feeds the cell, empties its waste, keeps the toxin out and keeps the '
        + 'machinery in. Sealed and wide open both lose.',
    },
  };
  static SCORING = { mode: 'accuracy' };

  static CONTROLS = [
    { type: 'slider', id: 'pore', label: 'Gap width', min: MIN_PORE, max: MAX_PORE, step: 0.1, value: START_PORE, suffix: ' nm' },
  ];

  constructor(container, config) {
    super(container, config);
    this.pore = START_PORE;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    const dot = (s) => {
      const px = Math.max(7, Math.min(22, 6 + s.size * 4));
      return `<span class="dot ${s.cls}" style="width:${px}px;height:${px}px"></span>`;
    };
    const zone = (side) => SPECIES.filter((s) => s.side === side || s.side === 'both')
      .map((s) => `<span class="chip" data-chip="${s.id}">${dot(s)}<span>${s.label}<br><small></small></span></span>`)
      .join('');

    this.root.insertAdjacentHTML('beforeend', `
      <div class="stp">
        <div class="outside"><span class="zonelabel">Outside the cell</span>${zone('out')}</div>
        <div class="membrane"><div class="gap"></div></div>
        <div class="inside"><span class="zonelabel">Inside the cell</span>${zone('in')}</div>

        <div class="ruler">
          <span class="rulerhead">Everything, to scale, in nanometres</span>
          <div class="axis"></div>
          ${SPECIES.map((s) => `
            <div class="marker" style="left:${nmToX(s.size)}px">
              <span class="dot ${s.cls}" style="width:${Math.max(7, Math.min(22, 6 + s.size * 4))}px;height:${Math.max(7, Math.min(22, 6 + s.size * 4))}px"></span>
              <div class="nm">${s.label}<br>${s.size}</div>
            </div>
            <div class="tick" style="left:${nmToX(s.size)}px"></div>`).join('')}
          <div class="poreline"></div>
          <div class="porecap"></div>
        </div>

        <p class="status"></p>
      </div>
    `);

    this._gapEl = this.root.querySelector('.gap');
    this._poreLine = this.root.querySelector('.poreline');
    this._poreCap = this.root.querySelector('.porecap');
    this._statusEl = this.root.querySelector('.status');

    this.quill = SimMascotDom.mount(this.root, { x: 800, y: 552, height: 118, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('One gap, four jobs. Sealed starves it, open poisons it.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id !== 'pore') return;
    this.pore = Number(value);
    this._moved = true;
    this._render();
  }

  /** A molecule crosses when it is narrower than the gap. That is the whole model. */
  crosses(size) { return size < this.pore; }

  /** @returns {{id:string, label:string, ok:boolean, note:string}[]} */
  audit() {
    return SPECIES.filter((s) => s.rule).map((s) => {
      const through = this.crosses(s.size);
      switch (s.rule) {
        case 'in': return { id: s.id, label: s.label, ok: through, note: through ? 'getting in' : 'shut out - starving' };
        case 'out': return { id: s.id, label: s.label, ok: through, note: through ? 'leaving' : 'trapped - building up' };
        case 'stay-out': return { id: s.id, label: s.label, ok: !through, note: through ? 'getting in - poisoned' : 'kept out' };
        case 'stay-in': return { id: s.id, label: s.label, ok: !through, note: through ? 'leaking out' : 'staying in' };
        default: return { id: s.id, label: s.label, ok: true, note: '' };
      }
    });
  }

  _render() {
    const rows = this.audit();
    const good = rows.every((r) => r.ok);

    // The drawn gap is the pore on the same log scale the ruler uses, so the
    // picture and the axis cannot disagree.
    const frac = Math.log(this.pore / MIN_PORE) / Math.log(MAX_PORE / MIN_PORE);
    this._gapEl.style.height = `${4 + frac * 150}px`;

    const x = nmToX(this.pore);
    this._poreLine.style.left = `${x}px`;
    this._poreCap.style.left = `${x}px`;
    this._poreCap.textContent = `gap ${this.pore.toFixed(1)} nm`;

    for (const r of rows) {
      const chip = this.root.querySelector(`[data-chip="${r.id}"]`);
      if (!chip) continue;
      chip.classList.toggle('pass', r.ok);
      chip.classList.toggle('fail', !r.ok);
      chip.querySelector('small').textContent = r.note;
    }

    const broken = rows.filter((r) => !r.ok);
    this._statusEl.innerHTML = !this._moved
      ? 'Anything narrower than the gap goes through. Anything wider does not.'
      : good
        ? '<b class="ok">All four jobs done by one gap.</b>'
        : `<b class="no">${broken.length} of ${rows.length} failing:</b> ${broken.map((r) => r.label.toLowerCase()).join(', ')}.`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const rows = this.audit();
    if (rows.every((r) => r.ok)) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    const starving = rows.find((r) => r.id === 'nutrient' && !r.ok);
    const poisoned = rows.find((r) => r.id === 'toxin' && !r.ok);
    const leaking = rows.find((r) => r.id === 'machinery' && !r.ok);

    let hint;
    if (starving && !poisoned) {
      hint = 'Nothing useful is getting in. The gap is narrower than the nutrient, so the cell is '
        + 'sealed against the very thing it needs. Closing further cannot help - look at how wide '
        + 'the nutrient actually is.';
    } else if (poisoned && leaking) {
      hint = 'Wide open. Food is getting in, and so is the toxin, and the machinery is draining out. '
        + 'A hole that admits everything is barely a boundary.';
    } else if (poisoned) {
      hint = 'Fed, but poisoned. The gap is wider than the toxin. It needs to sit between two '
        + 'molecules: wider than the nutrient, narrower than the toxin.';
    } else {
      hint = 'Close. One job is still failing - check which molecule is on the wrong side of the gap '
        + 'on the ruler.';
    }
    return { ok: false, hint };
  }
}
