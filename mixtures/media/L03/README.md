# Media provenance - L03

Per `docs/copyright-and-sourcing.md`: never extract the textbook's own
photographs or illustrations; source an openly-licensed equivalent and
record its source and licence here.

Every image referenced by `blocks/L03/*.json` was sourced from Wikimedia
Commons as a **real photograph**, verified page-by-page through the Commons
`imageinfo` API (licence read from each file's own `extmetadata`, not from
the search snippet), downloaded, and then **opened and viewed** so the
`alt` text describes what the file actually contains rather than what its
title claims. Nothing was extracted from the textbook PDF and nothing was
generated or synthesised.

The textbook's own three photographs in `FIGURES.md` (Fig. 5.7 rock salt /
mishri / frost, Fig. 5.10a Mawsmai Cave) were **not** extracted and are not
in this folder.

## rock-salt-halite.jpg

- Used by: `blocks/L03/blk-l03-s05.json`, `reveal.images["rock-salt"]`, beat 0.
- Stands in for: the source's Fig. 5.7(a) rock salt crystal photograph
  (p.7 / book p.78), recorded in `FIGURES.md`. That entry describes
  "coarse, jagged, translucent chunks of pink-orange mineral rock salt";
  the photograph chosen here is the same substance but a different specimen
  and a different colour, so the slide's `alt` says **clear cubic** halite
  and not pink and jagged. The slide's prose makes the same choice
  honestly: it says the crystals are *cubic*, which is what the file shows,
  and it does not claim the jaggedness the textbook photograph has.
- Viewed: yes. Four clear, colourless, glassy cubic crystals roughly
  1-2 cm across on a plain white ground, one broken face visible on the
  large one at the left.
- Licence verified: `LicenseShortName: CC BY 2.0`, artist `James St. John`,
  credit `https://www.flickr.com/photos/47445767@N05/32237023905/`,
  `LicenseUrl: https://creativecommons.org/licenses/by/2.0`.

## rock-candy-mishri.jpg

- Used by: `blocks/L03/blk-l03-s05.json`, `reveal.images["mishri"]`, beat 1.
- Stands in for: the source's Fig. 5.7(b) candy sugar / mishri photograph
  (p.7 / book p.78). The textbook's shows white rock candy on a watch
  glass over an orange table; this is a commercial product shot of white
  rock sugar lumps on a dark ground, not a laboratory-grown specimen. The
  slide's prose explicitly makes the growth story - a saturated sugar
  solution left standing over days - and the `alt` says only what the file
  shows (`several large irregular white sugar crystals, the size of a
  fist`), so nothing claims the picture is a laboratory one.
- Viewed: yes. Five large, chalky-white, irregular lumps with flat cleavage
  faces, roughly fist-sized, on a dark surface.
- Licence verified: `LicenseShortName: CC BY-SA 4.0`, artist `Dietmar Rabich`,
  credit `Own work`, `LicenseUrl: https://creativecommons.org/licenses/by-sa/4.0`.
- Note: the 5472x3648 original was downloaded at a 1280 px thumbnail width
  to keep the bundle's repository size sane; the crop is the full frame.

## frost-window.jpg

- Used by: `blocks/L03/blk-l03-s05.json`, `reveal.images["frost"]`, beat 2.
- Stands in for: the source's Fig. 5.7(c) frost photograph (p.7 / book
  p.78), which is white dendritic ice on a windowpane against soft
  light-blue. This one is the same phenomenon on a dark pane; the `alt`
  says `dark windowpane` rather than repeating the textbook's colour.
- Viewed: yes. Large fern-shaped and needle-shaped white ice crystals
  branching across dark glass, with a broad unfrozen area at the lower left.
- Licence verified: `LicenseShortName: CC BY-SA 4.0`, artist `Jojoo64`,
  credit `Own work`, `LicenseUrl: https://creativecommons.org/licenses/by-sa/4.0`.
- Downloaded at 1280 px thumbnail width; full frame, not cropped.

## mawsmai-cave.jpg

- Used by: `blocks/L03/blk-l03-s07.json`, `image.src`, `position: "right"`.
- Stands in for: the source's Fig. 5.10(a) Mawsmai Cave photograph (p.8 /
  book p.79). `FIGURES.md` already recorded the candidate
  "Mawsmai Cave Meghalaya Wikimedia Commons | found" and this is that
  file, confirmed through `imageinfo`.
- Viewed: yes, and it is the right photograph: a real cave interior with a
  lamp on the rock throwing a visible beam, a wet rock floor, and pale
  calcified formations coating the walls and ceiling. The block's `alt`
  and `caption` were written from what is actually in the frame.
- Licence verified: `LicenseShortName: CC0`, artist `Wann Majaw`,
  credit `Own work`, `LicenseUrl: http://creativecommons.org/publicdomain/zero/1.0/deed.en`.
  CC0 was chosen deliberately over the two CC BY-SA alternatives
  (`File:Mawsmai Cave (2).jpg` and `(3).jpg`, both by `ANKAN`) because a
  public-domain dedication raises no attribution obligation in this
  bundle and needs no licence text on the slide.
- Downloaded at 1280 px thumbnail width from a 2700x1800 original; full
  frame, not cropped.

### Licence record

| file | source | author | licence | added |
|---|---|---|---|---|
| rock-salt-halite.jpg | `File:Halite crystals (four).jpg`, Wikimedia Commons | James St. John | CC BY 2.0 | 2026-10-03 |
| rock-candy-mishri.jpg | `File:Kandiszucker -- 2018 -- 3588.jpg`, Wikimedia Commons | Dietmar Rabich | CC BY-SA 4.0 | 2026-10-03 |
| frost-window.jpg | `File:Ice Crystals on Window Pane.jpg`, Wikimedia Commons | Jojoo64 | CC BY-SA 4.0 | 2026-10-03 |
| mawsmai-cave.jpg | `File:Mawsmai cave.jpg`, Wikimedia Commons | Wann Majaw | CC0 1.0 | 2026-10-03 |

If any file is ever replaced, the replacement's licence must be verified
from its own file page before it is committed. Do not carry the present
credits over to a different image.

### Attribution the engine must surface

`rock-salt-halite.jpg` is **CC BY 2.0**, which requires attribution. The
other three are CC BY-SA 4.0 (also attribution) or CC0 (none). Whichever
of them a slide ends up showing, the block's `image.caption` should carry
the photographer and licence. Only `blk-l03-s07.json` does so at present,
and it does so for the CC0 file where it is not strictly required. **A
reviewer should decide whether the other three captions need a credit
line** - see the flag in `GENERATION-LOG.md`, Stage 2 - L03.