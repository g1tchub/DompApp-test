import { CONTENT_VERSION, lessons, lists } from "./content.js";
export const normalise = (value) =>
  String(value).normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
export function scoreRecall(answers, words) {
  const expected = words.map(normalise),
    seen = new Set();
  const matched = answers.map((answer) => {
    const token = normalise(answer);
    if (!expected.includes(token) || seen.has(token)) return false;
    seen.add(token);
    return true;
  });
  return {
    score: seen.size,
    total: words.length,
    matched,
    missing: words.filter((w) => !seen.has(normalise(w))),
  };
}
export function createSession(
  lessonId,
  attempts = [],
  route = [],
  now = Date.now(),
) {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) throw Error("Unknown lesson");
  const used = new Set(attempts.map((a) => a.listId));
  const available = lists.map((_, i) => i).filter((i) => !used.has(i));
  const pick = available.length
    ? available[Math.floor(Math.random() * available.length)]
    : Math.floor(Math.random() * lists.length);
  return {
    id: globalThis.crypto.randomUUID(),
    version: CONTENT_VERSION,
    lessonId,
    step: lesson.day === 1 ? "baseline-study" : "teach",
    words: [...lists[pick]],
    listId: pick,
    baselineWords: [...lists[(pick + 1) % lists.length]],
    answers: Array(5).fill(""),
    baselineAnswers: Array(5).fill(""),
    notes: Array(5).fill(""),
    route: route.slice(0, 5).map((s) => s.name),
    startedAt: now,
    studyStartedAt: lesson.day === 1 ? now : null,
    studyMs: 0,
    baselineStudyMs: 0,
    recallAt: null,
    customText: "",
    fresh: available.length > 0,
  };
}
export function makeAttempt(s, now = Date.now()) {
  return {
    id: s.id,
    lessonId: s.lessonId,
    version: CONTENT_VERSION,
    listId: s.listId,
    words: s.words,
    score: scoreRecall(s.answers, s.words).score,
    total: 5,
    completedAt: now,
    studyMs: s.studyMs,
    baselineStudyMs: s.baselineStudyMs,
    baselineScore:
      s.lessonId === "first-win"
        ? scoreRecall(s.baselineAnswers, s.baselineWords).score
        : null,
    delayMs: Math.max(0, now - (s.recallAt || now)),
    fresh: s.fresh,
  };
}
export function streak(attempts, reviews = [], now = new Date()) {
  const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    dates = new Set(
      [...attempts, ...reviews].map((a) => key(new Date(a.completedAt))),
    ),
    cursor = new Date(now);
  if (!dates.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (dates.has(key(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function reviewDue(a, reviews, now = Date.now()) {
  const history = reviews
      .filter((r) => r.attemptId === a.id)
      .sort((a, b) => a.completedAt - b.completedAt),
    last = history.at(-1),
    interval = last && last.score >= 4 ? Math.min(7, 2 ** history.length) : 1;
  return (last?.completedAt || a.completedAt) + interval * 86400000 <= now;
}
export function brainProgress(attempts, reviews) {
  const completed = new Set(attempts.map((a) => a.lessonId)),
    retained = new Set(
      reviews
        .filter((r) => r.score >= 4 && r.delayMs >= 86400000)
        .map((r) => r.attemptId),
    ),
    stage =
      completed.size === 0
        ? 0
        : retained.size >= 3 && completed.size >= 5
          ? 3
          : retained.size >= 1
            ? 2
            : 1;
  return {
    stage,
    label: ["First spark", "Connections", "Reinforced", "Constellation"][stage],
    completed: completed.size,
    retained: retained.size,
  };
}
export function moveStop(stops, index, direction) {
  const next = [...stops],
    target = index + direction;
  if (
    Number.isInteger(index) &&
    [-1, 1].includes(direction) &&
    index >= 0 &&
    index < next.length &&
    target >= 0 &&
    target < next.length
  )
    [next[index], next[target]] = [next[target], next[index]];
  return next;
}
