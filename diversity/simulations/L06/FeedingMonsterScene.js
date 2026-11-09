import { MonsterScene } from 'simulations/base/kit/MonsterScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// L06 misconception monster. Behaviour lives in simulations/base/kit/MonsterScene.js.
const CONFIG = {
  "ariaLabel": "Pick the fact that breaks each wrong idea about feeding.",
  "title": "Misconception Monster",
  "monster": {
    "name": "Fibbo",
    "tone": 6
  },
  "hearts": 3,
  "rounds": [
    {
      "who": "sponge",
      "claim": "It never moves, so it must make its own food, like a plant.",
      "counter": "Water carries food to its cells, so it feeds without moving.",
      "why": "Staying in one place does not decide how an organism feeds.",
      "traps": [
        {
          "text": "Sponges have leaves hidden inside.",
          "why": "Sponges are animals and have no leaves."
        },
        {
          "text": "It survives by photosynthesis in shallow water.",
          "why": "A sponge takes in food particles from the water; it does not photosynthesise."
        }
      ]
    },
    {
      "who": "hydra",
      "claim": "Hydra has tentacles, so it must have a separate exit for waste.",
      "counter": "It has ONE opening: food goes in and waste comes back out the same way.",
      "why": "Count the openings: Hydra has one, doing both jobs.",
      "traps": [
        {
          "text": "Its tentacles carry the waste out.",
          "why": "Tentacles catch prey; they are not an exit."
        },
        {
          "text": "The exit is under its foot.",
          "why": "The gut of a Hydra has no second opening."
        }
      ]
    },
    {
      "who": "flatworm",
      "claim": "All flatworms have a gut with one opening.",
      "counter": "Tapeworms are flatworms with no gut at all: they absorb food through the body surface.",
      "why": "One example does not describe a whole group.",
      "traps": [
        {
          "text": "Flatworms have a mouth and an anus, like roundworms.",
          "why": "That is the roundworm plan; flatworms have one opening or none."
        },
        {
          "text": "Only tapeworms have organs.",
          "why": "Flatworms have organs, including a feeding pharynx."
        }
      ]
    },
    {
      "who": "roundworm",
      "claim": "A roundworm and a flatworm are the same: just long worms.",
      "counter": "A roundworm has a mouth AND a separate anus; a flatworm has one opening or none.",
      "why": "Body shape alone misleads: count the openings and check the organisation.",
      "traps": [
        {
          "text": "A flatworm is round and a roundworm is flat.",
          "why": "The names describe the shapes the other way round."
        },
        {
          "text": "Both feed in exactly the same way.",
          "why": "A roundworm has a mouth and an anus; a flatworm has one opening or none."
        }
      ]
    },
    {
      "who": "roundworm",
      "claim": "A long, thin body means it is a parasite.",
      "counter": "Many long, thin worms live freely in soil or water, with no host.",
      "why": "A parasite lives in or on a host. Its shape does not decide that.",
      "traps": [
        {
          "text": "All worms live inside other animals.",
          "why": "Earthworms and many roundworms live freely."
        },
        {
          "text": "Only flatworms can be parasites.",
          "why": "Some roundworms are parasites too."
        }
      ]
    }
  ]
};

export class FeedingMonsterScene extends MonsterScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  paint() { super.paint(); wideFit(this); }
  _reconcileOrientation(hostWidth) { super._reconcileOrientation(hostWidth); wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
