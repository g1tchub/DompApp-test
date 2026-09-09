import { defaultJourney, lessons, CONTENT_VERSION } from "./content.js";
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
  goal: "",
  attempts: [],
  reviews: [],
  journeys: [structuredClone(defaultJourney)],
  session: null,
  draft: null,
});
export function validateJourney(v) {
  if (
    !v ||
    !Array.isArray(v.stops) ||
    v.stops.length < 5 ||
    v.stops.length > 20 ||
    v.stops.some((s) => !s || typeof s.name !== "string" || !s.name.trim())
  )
    return null;
  return {
    id: text(v.id, 80) || "home",
    name: text(v.name, 100).trim() || "My journey",
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
export function validateStore(raw) {
  const data = empty();
  if (!raw || raw.version !== CONTENT_VERSION) return data;
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
  const journeys = (Array.isArray(raw.journeys) ? raw.journeys : [])
    .map(validateJourney)
    .filter(Boolean)
    .slice(0, 20);
  if (journeys.length) data.journeys = journeys;
  data.session = validateSession(raw.session);
  data.draft = validateJourney(raw.draft);
  return data;
}
export function load(storage) {
  try {
    const raw = storage.getItem(key);
    if (raw) return { data: validateStore(JSON.parse(raw)), warning: "" };
    const data = empty(),
      old = JSON.parse(storage.getItem("memory-mastery-journeys") || "null");
    if (Array.isArray(old)) {
      const routes = old.map(validateJourney).filter(Boolean);
      if (routes.length) data.journeys = routes;
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
