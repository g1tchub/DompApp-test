import {
  defaultJourney,
  periodicJourney,
  lessons,
  CONTENT_VERSION,
} from "./content.js";
const key = "memory-mastery-v2",
  text = (s, n = 500) => (typeof s === "string" ? s.slice(0, n) : ""),
  num = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
const wordList = (a) =>
    Array.isArray(a) &&
    a.length === 5 &&
    a.every((s) => typeof s === "string" && s.length > 0 && s.length <= 80),
  known = (id) => lessons.some((l) => l.id === id);
export const empty = () => ({
  version: CONTENT_VERSION,
  preferences: { lessonAnimations: "system" },
  goal: "",
  attempts: [],
  reviews: [],
  journeys: [structuredClone(defaultJourney), structuredClone(periodicJourney)],
  practiceJourney: structuredClone(defaultJourney),
  session: null,
  draft: null,
});
export function validateJourney(v, { allowBlank = false } = {}) {
  if (
    !v ||
    !Array.isArray(v.stops) ||
    v.stops.length < 1 ||
    v.stops.some(
      (s) =>
        !s || typeof s.name !== "string" || (!allowBlank && !s.name.trim()),
    )
  )
    return null;
  return {
    id: text(v.id, 80) || "home",
    name: text(v.name, 100).trim() || (allowBlank ? "" : "My journey"),
    template: Boolean(v.template),
    stops: v.stops.map((s) => ({
      name: text(s.name, 100).trim(),
      association: text(s.association),
    })),
  };
}
export function validateSession(s) {
  if (
    !s ||
    s.version !== CONTENT_VERSION ||
    !known(s.lessonId) ||
    typeof s.id !== "string" ||
    !wordList(s.words) ||
    !wordList(s.baselineWords) ||
    ![
      "baseline-study",
      "baseline-recall",
      "teach",
      "study",
      "recall",
      "result",
    ].includes(s.step)
  )
    return null;
  if (
    ![s.answers, s.baselineAnswers, s.notes, s.route].every(
      (a) =>
        Array.isArray(a) &&
        a.length === 5 &&
        a.every((t) => typeof t === "string" && t.length <= 500),
    )
  )
    return null;
  if (
    !num(s.startedAt, 0, 1e15) ||
    !num(s.studyMs, 0, 1e15) ||
    !num(s.baselineStudyMs, 0, 1e15) ||
    !num(s.listId, -1, 7)
  )
    return null;
  return {
    ...s,
    id: text(s.id, 80),
    customText: text(s.customText),
    studyStartedAt: num(s.studyStartedAt, 0, 1e15) ? s.studyStartedAt : null,
    recallAt: num(s.recallAt, 0, 1e15) ? s.recallAt : null,
  };
}
function normaliseJourneys(rawJourneys) {
  const journeys = [],
    ids = new Set();
  for (const [index, raw] of (Array.isArray(rawJourneys)
    ? rawJourneys
    : []
  ).entries()) {
    const journey = validateJourney(raw);
    if (!journey) continue;
    let id = journey.id || `journey-${index + 1}`;
    if (ids.has(id)) {
      let suffix = 2;
      while (ids.has(`${id}-${suffix}`)) suffix++;
      id = `${id}-${suffix}`;
    }
    ids.add(id);
    journeys.push(
      id === periodicJourney.id && journey.template
        ? structuredClone(periodicJourney)
        : { ...journey, id },
    );
  }
  if (!journeys.length) return [];
  if (!ids.has(periodicJourney.id))
    journeys.push(structuredClone(periodicJourney));
  return journeys;
}
export function validateStore(raw) {
  const data = empty();
  if (!raw || raw.version !== CONTENT_VERSION) return data;
  if (
    raw.preferences &&
    typeof raw.preferences === "object" &&
    !Array.isArray(raw.preferences) &&
    ["system", "on", "off"].includes(raw.preferences.lessonAnimations)
  )
    data.preferences.lessonAnimations = raw.preferences.lessonAnimations;
  data.goal = text(raw.goal, 100);
  const ids = new Set();
  data.attempts = (Array.isArray(raw.attempts) ? raw.attempts : [])
    .filter(
      (a) =>
        a &&
        typeof a.id === "string" &&
        !ids.has(a.id) &&
        known(a.lessonId) &&
        wordList(a.words) &&
        a.total === 5 &&
        Number.isInteger(a.score) &&
        num(a.score, 0, 5) &&
        num(a.completedAt, 0, 1e15) &&
        (ids.add(a.id), true),
    )
    .slice(-500);
  data.reviews = (Array.isArray(raw.reviews) ? raw.reviews : [])
    .filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        ids.has(r.attemptId) &&
        Number.isInteger(r.score) &&
        num(r.score, 0, 5) &&
        num(r.completedAt, 0, 1e15) &&
        num(r.delayMs, 0, 1e15),
    )
    .slice(-1000);
  const journeys = normaliseJourneys(raw.journeys);
  if (journeys.length) data.journeys = journeys;
  const savedPracticeJourney = validateJourney(raw.practiceJourney),
    legacyPracticeJourney = journeys.find(
      (journey) => journey.stops.length >= 5,
    );
  data.practiceJourney = structuredClone(
    savedPracticeJourney?.stops.length >= 5
      ? savedPracticeJourney
      : legacyPracticeJourney?.stops.length >= 5
        ? legacyPracticeJourney
        : defaultJourney,
  );
  data.session = validateSession(raw.session);
  data.draft = validateJourney(raw.draft, { allowBlank: true });
  return data;
}
export function load(storage) {
  try {
    const raw = storage.getItem(key);
    if (raw) return { data: validateStore(JSON.parse(raw)), warning: "" };
    const data = empty(),
      old = JSON.parse(storage.getItem("memory-mastery-journeys") || "null");
    if (Array.isArray(old)) {
      const routes = normaliseJourneys(old);
      if (routes.length) {
        data.journeys = routes;
        data.practiceJourney = structuredClone(
          routes.find((journey) => journey.stops.length >= 5) || defaultJourney,
        );
      }
    }
    return {
      data,
      warning: storage.getItem("memory-mastery-progress")
        ? "Your routes are available. Earlier scores used a different test and are kept separately in this browser."
        : "",
    };
  } catch {
    return {
      data: empty(),
      warning:
        "Saved data could not be read. Check browser storage before relying on saved progress.",
    };
  }
}
export function save(storage, data) {
  try {
    storage.setItem(key, JSON.stringify(data));
    return "";
  } catch {
    return "Changes are only in memory. Browser storage is unavailable or full; keep this tab open and export your progress.";
  }
}
