import { ExpeditionScene } from '../kit/ExpeditionScene.js';

// Expedition along a coast.
const CONFIG = {
  "ariaLabel": "A coastal expedition: solve a field puzzle at each stop.",
  "title": "Expedition: the dawn net",
  "ship": "Sea Sparrow",
  "stops": [
    {
      "place": "Dock",
      "story": "Dawn. The net comes up heavy, with something soft and eight-armed in it.",
      "step": {
        "kind": "classify",
        "org": "octopus",
        "options": [
          "mollusca",
          "cnidaria",
          "pisces"
        ]
      },
      "after": "Log it."
    },
    {
      "place": "Reef",
      "story": "On the rock, a five-armed specimen clings on.",
      "step": {
        "kind": "evidence",
        "org": "starfish"
      }
    },
    {
      "place": "Bay",
      "story": "Four animals on the chart. Three belong to one group.",
      "step": {
        "kind": "odd",
        "ids": [
          "tiger",
          "lion",
          "dolphin",
          "carp"
        ],
        "odd": "carp",
        "why": "Tiger, lion and dolphin all feed their young milk. The carp has gills and fins for life: Pisces.",
        "prompt": "Which one does NOT belong with the others?"
      }
    },
    {
      "place": "Estuary",
      "story": "A tadpole in the mud flats grows into this adult.",
      "step": {
        "kind": "classify",
        "org": "frog",
        "options": [
          "amphibia",
          "pisces",
          "reptilia"
        ]
      }
    },
    {
      "place": "Cove",
      "story": "A smooth grey swimmer surfaces to breathe.",
      "step": {
        "kind": "evidence",
        "org": "dolphin"
      }
    },
    {
      "place": "Cliff",
      "story": "Four animals in the logbook. Three belong to one group.",
      "step": {
        "kind": "odd",
        "ids": [
          "sparrow",
          "ostrich",
          "hornbill",
          "lizard"
        ],
        "odd": "lizard",
        "why": "Sparrow, ostrich and hornbill have feathers (Aves) - even the ostrich that cannot fly. The lizard has dry scales: Reptilia."
      }
    },
    {
      "place": "Camp",
      "story": "A tiny sea animal with a stiff rod along its back, but no backbone.",
      "step": {
        "kind": "classify",
        "org": "amphioxus",
        "options": [
          "protochordata",
          "pisces",
          "annelida"
        ]
      }
    }
  ]
};

export class CoastExpeditionScene extends ExpeditionScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
}
