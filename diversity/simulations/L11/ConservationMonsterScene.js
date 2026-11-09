import { MonsterScene } from 'simulations/base/kit/MonsterScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// L11 misconception monster. Behaviour lives in simulations/base/kit/MonsterScene.js.
const CONFIG = {
  "ariaLabel": "Pick the fact that breaks each wrong idea about protecting living things.",
  "title": "Misconception Monster",
  "monster": {
    "name": "Skimpy",
    "tone": 5
  },
  "hearts": 3,
  "rounds": [
    {
      "who": "deer",
      "claim": "The Sangai is on a protected-species list, so its home is safe.",
      "counter": "A name on a list does not protect the floating habitat it depends on.",
      "why": "Protection has to reach what the species depends on.",
      "traps": [
        {
          "text": "Lists are always enforced everywhere.",
          "why": "A list shows the danger. It does not mend the habitat."
        },
        {
          "text": "Sangai can live on any grassland.",
          "why": "It depends specifically on the floating phumdis."
        }
      ]
    },
    {
      "who": "hornbill",
      "claim": "I saw hornbills today, so they must be doing fine.",
      "counter": "A sighting does not show that the nest trees they need will last.",
      "why": "A species can be present today while something it depends on is threatened.",
      "traps": [
        {
          "text": "More sightings always mean more birds.",
          "why": "Counting sightings is not counting birds or habitat."
        },
        {
          "text": "Hornbills nest anywhere.",
          "why": "They need nesting cavities in old trees."
        }
      ]
    },
    {
      "claim": "Diversity prevents every disaster.",
      "counter": "Villages with more mangroves had less destruction, not none.",
      "why": "A rich forest lowers a risk. It does not remove it.",
      "traps": [
        {
          "text": "Mangroves protected every coast in the 1999 cyclone.",
          "why": "Villages with more mangroves saw less destruction. That is not every coast."
        },
        {
          "text": "More species always means less disease.",
          "why": "Rich biodiversity generally goes with lower risk of tick-borne disease, not always."
        }
      ]
    },
    {
      "claim": "Microbes are everywhere, so they will clean up any pollution for us.",
      "counter": "Soil microbes can break down some pollutants, which helps but does not make pollution safe.",
      "why": "Microbes help. They do not remove the need to stop pollution.",
      "traps": [
        {
          "text": "Adding microbes to polluted water is a safe fix.",
          "why": "Nobody should add microbes to water on their own, and the pollution would still be there."
        },
        {
          "text": "Any microbe breaks down any pollutant.",
          "why": "Different microbes act on different substances."
        }
      ]
    },
    {
      "claim": "Deforestation, pollution, overuse and climate change are all one kind of damage, so one fix works.",
      "counter": "Each pressure changes something different, so each needs its own answer.",
      "why": "Different pressures need different responses.",
      "traps": [
        {
          "text": "Planting any trees fixes all four.",
          "why": "Planting trees does not stop pollution or overuse."
        },
        {
          "text": "Only climate change matters.",
          "why": "Habitat loss and overuse hit species directly today."
        }
      ]
    }
  ]
};

export class ConservationMonsterScene extends MonsterScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  paint() { super.paint(); wideFit(this); }
  _reconcileOrientation(hostWidth) { super._reconcileOrientation(hostWidth); wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); gameInk(this.root); wideBoard(this); }
}
