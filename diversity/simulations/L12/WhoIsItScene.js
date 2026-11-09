import { GuessWhoScene } from '../kit/GuessWhoScene.js';

// Guess Who against the computer.
const CONFIG = {
  "ariaLabel": "Guess Who against the computer, using evidence questions about organisms.",
  "title": "Guess Who?",
  "pool": [
    "bacterium",
    "cyano",
    "yeast",
    "mould",
    "mushroom",
    "euglena",
    "amoeba",
    "spirogyra",
    "moss",
    "fern",
    "pine",
    "tulsi",
    "mango",
    "sponge",
    "hydra",
    "flatworm",
    "roundworm",
    "earthworm",
    "beetle",
    "snail",
    "octopus",
    "starfish",
    "amphioxus",
    "carp",
    "frog",
    "lizard",
    "sparrow",
    "ostrich",
    "hornbill",
    "tiger",
    "lion",
    "dolphin",
    "deer"
  ],
  "size": 12,
  "cols": 4
};

export class WhoIsItScene extends GuessWhoScene {
  // A 390 screen shows this board at 0.93, so 48 here is at least 44 on screen.
  static CSS = GuessWhoScene.CSS + '.gw-tab { min-height:48px; }';
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
}
