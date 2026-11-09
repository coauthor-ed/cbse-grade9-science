import { ExpeditionScene } from '../kit/ExpeditionScene.js';

// Expedition through a forest.
const CONFIG = {
  "ariaLabel": "A forest expedition: solve a field puzzle at each stop.",
  "title": "Expedition: the forest trail",
  "ship": "Trail Team",
  "stops": [
    {
      "place": "Gate",
      "story": "A tall tree with cones instead of flowers.",
      "step": {
        "kind": "classify",
        "org": "pine",
        "options": [
          "gymnosperm",
          "angiosperm",
          "pteridophyta"
        ]
      }
    },
    {
      "place": "Stream",
      "story": "Feathery green leaves unroll beside the stream.",
      "step": {
        "kind": "evidence",
        "org": "fern"
      }
    },
    {
      "place": "Log",
      "story": "A damp cushion on a rotting log.",
      "step": {
        "kind": "classify",
        "org": "moss",
        "options": [
          "bryophyta",
          "pteridophyta",
          "thallophyta"
        ]
      }
    },
    {
      "place": "Glade",
      "story": "Four things growing in the glade. Three take in food the same way.",
      "step": {
        "kind": "odd",
        "ids": [
          "mushroom",
          "yeast",
          "mould",
          "tulsi"
        ],
        "odd": "tulsi",
        "why": "Mushroom, yeast and bread mould have a chitin wall and absorb their food: Fungi. Tulsi makes its own food with light: a plant."
      }
    },
    {
      "place": "Pond",
      "story": "A green speck in the pond that swims and photosynthesises.",
      "step": {
        "kind": "classify",
        "org": "euglena",
        "options": [
          "protista",
          "monera",
          "fungi"
        ]
      }
    },
    {
      "place": "Bank",
      "story": "Green threads with coiled chloroplasts float in the shallows.",
      "step": {
        "kind": "classify",
        "org": "spirogyra",
        "options": [
          "thallophyta",
          "bryophyta",
          "pteridophyta"
        ]
      }
    }
  ]
};

export class ForestExpeditionScene extends ExpeditionScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
}
