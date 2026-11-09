// SoundDeck.js - the sound chapter's arcade decks, one export per game.
// A deck is plain data; several games share the file. Later games ADD an export
// beside these ones and never edit an item that is already here.
//
// Every `why` is the one line the why card shows after a mix-up, so it is written
// as evidence, not as a restated answer. `myth: true` marks an item students
// commonly get wrong: it is worth double in the boss round. Two house rules, both
// from the stub that commissioned the deck:
//   - art: false on every item (no face, no picture), no per-item colour: a picture or a tint a learner can remember
//     lets them match on resemblance instead of on the meaning;
//   - no `why` may name the term it explains, and the `group` values are never
//     drawn - a why that hands the answer over teaches nothing and gives the
//     next pair away for free.
// Answers are kept to one bubble (about 37 characters): the `why` card carries the
// full one-line reading, which is the width a bubble does not have.

// Wave vocabulary -> what it actually describes. Term on the bottom card, the
// meaning goes past in a bubble. Grouped so the confusable names are the ones the
// engine draws as distractors for each other.
export const WAVE_TERMS_TO_MEANING = {
  pairs: [
    // the two kinds of region in a sound wave
    { art: false, prompt: 'Compression', group: 'density', answer: 'region packed closer than average', why: 'the particles there are closer together, so the density is higher than average' },
    { art: false, prompt: 'Rarefaction', group: 'density', answer: 'region spread out more than average', why: 'the particles there are further apart, so the density is lower than average' },
    // the high and low points of the density graph
    { art: false, prompt: 'Crest', group: 'graph', answer: 'highest point of the density graph', why: 'it sits under a compression, where the density is highest', myth: true },
    { art: false, prompt: 'Trough', group: 'graph', answer: 'lowest point of the density graph', why: 'it sits under a rarefaction, where the density is lowest' },
    // the quantities, kept together because learners swap them
    { art: false, prompt: 'Wavelength', group: 'measure', answer: 'distance from crest to next crest', why: 'it is a length along the wave, measured in metres', myth: true },
    { art: false, prompt: 'Frequency', group: 'measure', answer: 'oscillations per second', why: 'it counts oscillations in one second at a fixed place; the time for one is the time period', myth: true },
    { art: false, prompt: 'Time period', group: 'measure', answer: 'time for one oscillation', why: 'it is a time in seconds, measured at one fixed place' },
    { art: false, prompt: 'Speed of sound', group: 'measure', answer: 'distance a crest moves each second', why: 'it is wavelength times frequency, in metres per second' },
    // the unit
    { art: false, prompt: 'Hertz', group: 'unit', answer: 'unit of frequency', why: 'one oscillation per second is one Hz' },
    // the word from L02 the rest of the deck leans on
    { art: false, prompt: 'Medium', group: 'thing', answer: 'material that sound travels through', why: 'a solid, a liquid or a gas; a vacuum has none' },
  ],
};

// Which range of the strip a sound sits in - for the L05 arcade sort. Sounds,
// not numbers: each item is something a learner can picture, and every one of
// them is decided by where its frequency falls against 20 Hz and 20 kHz. The
// stub's two hard rules ride with the data: no `art` and no per-item tone, so a
// learner cannot match on a remembered picture or colour, and every `why` gives
// the property that decides the band rather than the band's own name. L05 has
// taught the bands but not their uses, so nothing here names echo, sonar or
// echolocation - a bat and a scanner appear as frequencies only.
export const HEARING_RANGES = {
  groups: [
    // the bin `why` is the edge a learner measures the sound against
    { id: 'infrasonic', label: 'Infrasonic', tone: 1, why: 'below 20 Hz' },
    { id: 'audible', label: 'Audible', tone: 3, why: '20 Hz to 20 kHz' },
    { id: 'ultrasonic', label: 'Ultrasonic', tone: 5, why: 'above 20 kHz' },
  ],
  items: [
    { art: false, name: "An elephant's rumble", is: 'infrasonic', why: 'elephants can detect sounds below 20 Hz, which humans cannot hear' },
    { art: false, name: 'Waves from an earthquake', is: 'infrasonic', myth: true, why: 'their frequency is below 20 Hz, so they are used to detect earthquakes, not heard' },
    { art: false, name: 'A conversation across a room', is: 'audible', why: 'speech is well inside 20 Hz to 20 kHz' },
    { art: false, name: 'A steam kettle whistling', is: 'audible', myth: true, why: 'a shrill whistle has a high frequency, but still below 20 kHz, so you hear it' },
    { art: false, name: 'A child singing', is: 'audible', why: 'you hear it, so its frequency is between 20 Hz and 20 kHz' },
    { art: false, name: 'A dog whistle', is: 'ultrasonic', myth: true, why: 'it is above 20 kHz: a dog hears it, the person blowing it does not' },
    { art: false, name: "A bat's calls at night", is: 'ultrasonic', why: 'most bats send out bursts above 20 kHz, which humans cannot hear' },
    { art: false, name: 'An ultrasound scanner', is: 'ultrasonic', myth: true, why: '"ultra" means the frequency is above 20 kHz, not that the sound is loud' },
  ],
};
