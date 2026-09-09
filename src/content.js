export const CONTENT_VERSION = 2;
export const goals = [
  "Remember names",
  "Study more effectively",
  "Remember everyday lists",
  "Learn memory techniques",
];
export const defaultJourney = {
  id: "home",
  name: "My home journey",
  stops: ["Front door", "Hall table", "Kitchen sink", "Sofa", "Window"].map(
    (name) => ({ name, association: "" }),
  ),
};
// Similar-format concrete-noun lists, not psychometrically equated.
export const lists = [
  ["violin", "lantern", "orange", "key", "feather"],
  ["umbrella", "watch", "lemon", "book", "balloon"],
  ["bicycle", "candle", "apple", "shoe", "ribbon"],
  ["trumpet", "bucket", "pear", "hat", "butterfly"],
  ["guitar", "basket", "cherry", "sock", "kite"],
  ["camera", "bottle", "peach", "glove", "flower"],
  ["piano", "teapot", "melon", "scarf", "shell"],
  ["drum", "suitcase", "plum", "boot", "flag"],
];
export const lessons = [
  {
    id: "first-win",
    day: 1,
    title: "Your first memory win",
    skill: "Journeys",
    objective: "Place five objects on a familiar route.",
    teach:
      "Picture each object doing something surprising at one stop. Move through the same places in the same order.",
    example:
      "An umbrella springs open and blocks the front door. At the hall table, a giant watch ticks loudly.",
    apply:
      "Later today, mentally walk your route once without opening the app.",
    mode: "journey",
  },
  {
    id: "images",
    day: 2,
    title: "Make your images stick",
    skill: "Imagination",
    objective: "Create one distinctive action for every object.",
    teach:
      "Add movement, size, sound or texture. Choose details that mean something to you. Use words, sounds and spatial relationships if visual imagery is difficult.",
    example:
      "A lemon rolls into your sink and grows until it fills the room. Feel its bumpy skin and smell the juice.",
    apply: "Turn one thing you need to remember today into an unusual scene.",
    mode: "image",
  },
  {
    id: "my-journey",
    day: 3,
    title: "Build your own journey",
    skill: "Journeys",
    objective: "Use five distinct places you know well.",
    teach:
      "Open Build and save five stops from a real route. Keep their order consistent and avoid nearly identical locations. Then return here to practise.",
    example:
      "Front door → hall table → kitchen sink → sofa → window. Each place is distinct and easy to revisit.",
    apply: "Walk your real route and check whether each stop is unmistakable.",
    mode: "journey",
    ownRoute: true,
  },
  {
    id: "independent",
    day: 4,
    title: "Recall without prompts",
    skill: "Journeys",
    objective: "Use your route independently with a fresh list.",
    teach:
      "Place the objects yourself. When the list disappears, walk the route without visible location hints. Check missed items and strengthen those scenes.",
    example:
      "If two images blend together, give them separate locations and different actions.",
    apply: "Try recalling today’s list later, before you look at it again.",
    mode: "journey",
    ownRoute: true,
  },
  {
    id: "linking",
    day: 5,
    title: "Connect a story",
    skill: "Association",
    objective: "Link neighbouring objects into one memorable sequence.",
    teach:
      "Make the first object act on the second, then the second on the third. Build clear transitions rather than unrelated pictures.",
    example:
      "A violin plays so loudly that a lantern bursts open. The lantern spills oranges. One orange turns a giant key.",
    apply:
      "Compare a short story chain with your journey. Which is easier to recover?",
    mode: "link",
  },
  {
    id: "real-life",
    day: 6,
    title: "Use it away from the app",
    skill: "Application",
    objective: "Choose a real list, then recall it after a delay.",
    teach:
      "Enter five everyday objects you actually want to remember. Place them on your route. Return to the saved recall step after at least ten minutes.",
    example:
      "Choose shopping items or things to pack. Practise with low-stakes material.",
    apply:
      "Use your list away from the screen. Notice which scenes were useful.",
    mode: "journey",
    ownRoute: true,
    custom: true,
  },
  {
    id: "reflect",
    day: 7,
    title: "See what stayed with you",
    skill: "Retention",
    objective: "Review older items and try a fresh five-object challenge.",
    teach:
      "Start with due reviews in Train. Then use your preferred technique on a new list. Compare only attempts with the same conditions.",
    example:
      "Five recalled today and five recalled tomorrow tell you different things. Both are useful, so record them separately.",
    apply:
      "Choose a technique to practise again next week. Repeating a lesson is part of learning.",
    mode: "journey",
    ownRoute: true,
  },
];
