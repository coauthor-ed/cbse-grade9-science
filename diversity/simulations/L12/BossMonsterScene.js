import { MonsterScene } from 'simulations/base/kit/MonsterScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// L12 misconception monster. Behaviour lives in simulations/base/kit/MonsterScene.js.
const CONFIG = {
  "ariaLabel": "Boss round: six wrong ideas from across the course.",
  "title": "Boss round",
  "monster": {
    "name": "The Grand Misconception",
    "tone": 6
  },
  "hearts": 3,
  "rounds": [
    {
      "who": "mushroom",
      "claim": "Fungi are just odd plants that do not move.",
      "counter": "A fungus has a chitin wall and absorbs its food; a plant has cellulose and makes its own.",
      "why": "Wall material and how it gets food are the evidence, not whether it moves.",
      "traps": [
        {
          "text": "Mushrooms have green leaves underground.",
          "why": "Fungi have no leaves or chlorophyll."
        },
        {
          "text": "They photosynthesise in the dark.",
          "why": "Fungi absorb food; they do not make it with light."
        }
      ]
    },
    {
      "who": "yeast",
      "claim": "It is one cell, so it cannot be a fungus.",
      "counter": "Yeast is a one-celled fungus: it has a nucleus and a chitin wall.",
      "why": "Cell count alone does not decide a kingdom.",
      "traps": [
        {
          "text": "Fungi must grow as threads.",
          "why": "Yeast is a fungus with no threads, only single cells."
        },
        {
          "text": "Every one-celled thing belongs to Monera.",
          "why": "Monera have no nucleus; yeast does."
        }
      ]
    },
    {
      "who": "octopus",
      "claim": "It has no shell, so it cannot be a mollusc.",
      "counter": "Its muscular foot became arms, and not every mollusc has a shell.",
      "why": "Mollusca are defined by the foot, not the shell.",
      "traps": [
        {
          "text": "Its arms are jointed legs, so it is an arthropod.",
          "why": "Its arms are a changed foot, not jointed legs."
        },
        {
          "text": "It swims, so it is a fish.",
          "why": "Swimming decides nothing; it has no backbone."
        }
      ]
    },
    {
      "who": "amphioxus",
      "claim": "It has a notochord, so it has a backbone.",
      "counter": "A notochord is a flexible rod; Amphioxus has no backbone at all.",
      "why": "A notochord and a backbone are different things.",
      "traps": [
        {
          "text": "Only animals with a backbone are chordates.",
          "why": "Chordates are defined by the notochord."
        },
        {
          "text": "Notochord is just another word for vertebra.",
          "why": "Vertebrae make up a backbone; a notochord is a single rod."
        }
      ]
    },
    {
      "who": "beetle",
      "claim": "Segments decide it: this beetle is an annelid.",
      "counter": "It also has jointed legs and a hard outer skeleton, so it is Arthropoda.",
      "why": "Classification uses the combination of features, not the first one they share.",
      "traps": [
        {
          "text": "Jointed legs prove it is a mollusc.",
          "why": "Jointed legs and an exoskeleton mean Arthropoda."
        },
        {
          "text": "Beetles have no segments.",
          "why": "Beetles are segmented too; segments alone just do not decide it."
        }
      ]
    },
    {
      "who": "bacterium",
      "claim": "Bacteria are just simple plants.",
      "counter": "Bacteria have no nucleus; plants have a nucleus and a cellulose wall.",
      "why": "No nucleus puts a cell in Monera, whatever else it does.",
      "traps": [
        {
          "text": "Bacteria photosynthesise like plants, so they are plants.",
          "why": "Blue-green bacteria photosynthesise but still have no nucleus."
        },
        {
          "text": "Anything with a cell wall is a plant.",
          "why": "Fungi and bacteria have walls too."
        }
      ]
    }
  ]
};

export class BossMonsterScene extends MonsterScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  paint() { super.paint(); wideFit(this); }
  _reconcileOrientation(hostWidth) { super._reconcileOrientation(hostWidth); wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); gameInk(this.root); wideBoard(this); }
}
