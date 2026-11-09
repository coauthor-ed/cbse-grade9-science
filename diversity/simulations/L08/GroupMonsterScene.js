import { MonsterScene } from 'simulations/base/kit/MonsterScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// L08 misconception monster. Behaviour lives in simulations/base/kit/MonsterScene.js.
const CONFIG = {
  "ariaLabel": "Pick the fact that breaks each wrong idea about vertebrate groups.",
  "title": "Misconception Monster",
  "monster": {
    "name": "Grumbo",
    "tone": 4
  },
  "hearts": 3,
  "rounds": [
    {
      "who": "dolphin",
      "claim": "It lives in water, so it must be a fish.",
      "counter": "It has mammary glands and breathes air with lungs.",
      "why": "Mammary glands and lungs mark a mammal; the water is only where it lives.",
      "traps": [
        {
          "text": "It has gills hidden behind its head.",
          "why": "A dolphin has no gills. It comes up to the surface to breathe."
        },
        {
          "text": "It lays its eggs on the sea floor.",
          "why": "A dolphin lays no eggs. Its calf feeds on milk."
        }
      ]
    },
    {
      "who": "ostrich",
      "claim": "It cannot fly, so it cannot be a bird.",
      "counter": "It has feathers and lays hard-shelled eggs.",
      "why": "Feathers and hard-shelled eggs mark a bird; flying does not.",
      "traps": [
        {
          "text": "It feeds its chicks on milk.",
          "why": "Birds have no mammary glands."
        },
        {
          "text": "Its body is covered in dry scales.",
          "why": "An ostrich's body has feathers."
        }
      ]
    },
    {
      "who": "frog",
      "claim": "Its tadpole lives in water with gills, so a frog is a fish.",
      "counter": "The adult breathes with lungs and through moist skin.",
      "why": "A young stage with gills and an adult with lungs mark an amphibian.",
      "traps": [
        {
          "text": "A frog is covered in dry scales.",
          "why": "A frog has moist skin, with no scales."
        },
        {
          "text": "The adult frog keeps its tail and its gills.",
          "why": "The tail goes as the frog grows, and the adult has lungs."
        }
      ]
    },
    {
      "who": "lizard",
      "claim": "It has scales, as a fish does, so it is a fish.",
      "counter": "Its scales are dry and it breathes with lungs.",
      "why": "Dry scales and lungs mark a reptile; a fish breathes with gills.",
      "traps": [
        {
          "text": "It breathes with gills on land.",
          "why": "A lizard breathes with lungs."
        },
        {
          "text": "It has fins in place of legs.",
          "why": "A lizard has four legs, not fins."
        }
      ]
    },
    {
      "claim": "A bat flies, so it must be a bird.",
      "counter": "A bat has mammary glands and feeds its young on milk.",
      "why": "Feathers would mark a bird; milk marks a mammal.",
      "traps": [
        {
          "text": "A bat is covered in feathers.",
          "why": "A bat has fur, and no feathers."
        },
        {
          "text": "A bat lays hard-shelled eggs.",
          "why": "A bat lays no eggs. It feeds its young on milk."
        }
      ]
    }
  ]
};

export class GroupMonsterScene extends MonsterScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  paint() { super.paint(); wideFit(this); }
  _reconcileOrientation(hostWidth) { super._reconcileOrientation(hostWidth); wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
