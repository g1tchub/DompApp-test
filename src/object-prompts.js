// Optional examples for the practice lists: action, exaggeration and a sensory cue.
const objects = {
  violin: [
    "🎻",
    "plays itself",
    "Its bow stretches across the room.",
    "Hear a deep, vibrating note.",
  ],
  lantern: [
    "🏮",
    "bounces into the air",
    "Its light turns everything bright pink.",
    "Feel the warmth of its glow.",
  ],
  orange: [
    "🍊",
    "rolls in circles",
    "It grows as big as a beach ball.",
    "Smell the fresh peel.",
  ],
  key: [
    "🔑",
    "spins like a propeller",
    "It grows taller than you.",
    "Hear its metallic clink.",
  ],
  feather: [
    "🪶",
    "floats around you",
    "It becomes an enormous waving fan.",
    "Feel its soft tickle.",
  ],
  umbrella: [
    "☂️",
    "springs open",
    "It expands until it covers the ceiling.",
    "Hear rain drumming on it.",
  ],
  watch: [
    "⌚",
    "jumps with every tick",
    "Its hands spin faster and faster.",
    "Hear an impossibly loud tick-tock.",
  ],
  lemon: [
    "🍋",
    "rolls into your sink",
    "It grows until it fills the room.",
    "Feel its bumpy skin and smell the juice.",
  ],
  book: [
    "📖",
    "flaps its pages like wings",
    "It grows as tall as a doorway.",
    "Hear the pages rustling.",
  ],
  balloon: [
    "🎈",
    "bobs up and down",
    "It inflates until it fills the room.",
    "Hear it squeak as it stretches.",
  ],
  bicycle: [
    "🚲",
    "pedals itself in circles",
    "Its wheels grow taller than you.",
    "Hear its bell ringing.",
  ],
  candle: [
    "🕯️",
    "dances on its base",
    "Bright purple wax piles up around it.",
    "Feel the warmth nearby.",
  ],
  apple: [
    "🍎",
    "bounces like a ball",
    "It grows as large as a chair.",
    "Hear a loud crunch.",
  ],
  shoe: [
    "👟",
    "hops by itself",
    "Its laces stretch across the room.",
    "Hear its squeaky sole.",
  ],
  ribbon: [
    "🎀",
    "twirls through the air",
    "It ties an enormous bow around everything.",
    "Feel its silky surface.",
  ],
  trumpet: [
    "🎺",
    "blasts itself into the air",
    "Its bell grows as wide as a doorway.",
    "Hear its bright, brassy blast.",
  ],
  bucket: [
    "🪣",
    "tips over by itself",
    "An endless waterfall pours out.",
    "Hear the water splashing.",
  ],
  pear: [
    "🍐",
    "wobbles like a spinning top",
    "It grows as tall as you.",
    "Feel its grainy skin.",
  ],
  hat: [
    "🎩",
    "leaps off an invisible head",
    "Its brim stretches across the room.",
    "Feel its soft lining.",
  ],
  butterfly: [
    "🦋",
    "flutters around you",
    "Its wings grow as large as curtains.",
    "Imagine the gentle brush of its wings.",
  ],
  guitar: [
    "🎸",
    "strums itself",
    "Its strings stretch from floor to ceiling.",
    "Hear a booming chord.",
  ],
  basket: [
    "🧺",
    "hops across the floor",
    "It expands into a giant woven boat.",
    "Feel its rough weave.",
  ],
  cherry: [
    "🍒",
    "swings from its stalk",
    "It grows as big as a balloon.",
    "Taste its sweet juice in your imagination.",
  ],
  sock: [
    "🧦",
    "wiggles like a snake",
    "It stretches the length of the room.",
    "Feel its fluffy fabric.",
  ],
  kite: [
    "🪁",
    "swoops around you",
    "Its tail wraps around the whole room.",
    "Hear it flapping in the wind.",
  ],
  camera: [
    "📷",
    "jumps each time it takes a photo",
    "Its flash lights up the whole room.",
    "Hear a loud click with every jump.",
  ],
  bottle: [
    "🍾",
    "wobbles and spins",
    "A fountain of bright bubbles bursts out.",
    "Hear the fizz and pop.",
  ],
  peach: [
    "🍑",
    "rolls towards you",
    "It grows as large as a sofa.",
    "Feel its fuzzy skin and smell its sweet juice.",
  ],
  glove: [
    "🧤",
    "waves by itself",
    "Its fingers grow as long as your arms.",
    "Feel its soft fabric.",
  ],
  flower: [
    "🌸",
    "springs up and opens",
    "Its petals grow as big as umbrellas.",
    "Smell its strong perfume.",
  ],
  piano: [
    "🎹",
    "plays itself",
    "Its keys bounce high into the air.",
    "Hear a thundering tune.",
  ],
  teapot: [
    "🫖",
    "spins and pours",
    "A huge cloud of steam fills the space.",
    "Smell the warm tea.",
  ],
  melon: [
    "🍈",
    "rolls and splits open",
    "It grows until it fills the room.",
    "Smell its sweet flesh.",
  ],
  scarf: [
    "🧣",
    "winds through the air",
    "It stretches into an enormous spiral.",
    "Feel its woolly softness.",
  ],
  shell: [
    "🐚",
    "rocks back and forth",
    "It grows big enough to step inside.",
    "Hear the sea roaring within it.",
  ],
  drum: [
    "🥁",
    "bounces with every beat",
    "It grows as wide as a table.",
    "Feel the rhythm vibrating through the floor.",
  ],
  suitcase: [
    "🧳",
    "rolls along by itself",
    "It opens and spills a mountain of clothes.",
    "Hear its wheels rattling.",
  ],
  plum: [
    "🟣",
    "bounces towards you",
    "It grows as big as a beach ball.",
    "Imagine its smooth skin and juicy centre.",
  ],
  boot: [
    "🥾",
    "stomps by itself",
    "It grows as tall as a doorway.",
    "Hear its heavy thud.",
  ],
  flag: [
    "🚩",
    "waves without any wind",
    "It unfurls across the whole room.",
    "Hear its fabric snapping.",
  ],
};

export function objectPrompt(word, { mode, place, next } = {}) {
  const name = String(word).trim().toLowerCase();
  const item = Object.hasOwn(objects, name) ? objects[name] : undefined;
  const [icon, action, size, sense] = item || [
    "💡",
    "moves in an unexpected way",
    "Make it enormous or give it an unusual colour.",
    "Imagine a sound, texture or smell you associate with it.",
  ];
  return {
    icon,
    cues: [
      item
        ? `Imagine it ${action}.`
        : `Imagine “${word}” moving in an unexpected way.`,
      size,
      sense,
      mode === "journey" && place
        ? `Put the action at ${place}, so that place brings the object back to mind.`
        : mode === "link" && next
          ? `Now make it act on ${next} to connect the two objects.`
          : "Use this idea or invent a detail that means something to you.",
    ],
  };
}
