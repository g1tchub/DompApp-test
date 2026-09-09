import { lessons, defaultJourney, goals } from "./content.js";
import {
  scoreRecall,
  createSession,
  makeAttempt,
  reviewDue,
  streak,
  brainProgress,
  moveStop,
  normalise,
} from "./learning.js";
import { load, save, empty, validateJourney } from "./storage.js";
import { mountBrain } from "./brain.js";

const html = String.raw;
const root = document.querySelector("#app");
const preview = true;
if (preview) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./design-preview.css", import.meta.url).href;
  const styleReady = new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
  });
  document.head.append(link);
  await styleReady;
  document.body.classList.add("design-preview");
}
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const loaded = load(storage);
let data = loaded.data,
  notice = loaded.warning;
let section = "home",
  review = null,
  reviewResult = null,
  brainDemo = null,
  disposeBrain = () => {};
let draft = data.draft || structuredClone(data.journeys[0]);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const portrait = () =>
  new URL("./assets/dominic/dominic-photo.png", import.meta.url).href;
const names = {
  home: "Today",
  learn: "Learn",
  train: "Practise",
  build: "My journeys",
  profile: "My progress",
  dominic: "Meet Dominic",
  session: "Your practice",
  review: "Recall review",
};
const symbols = {
  home: "◉",
  learn: "◇",
  train: "↻",
  build: "⌂",
  profile: "✧",
};
const navigationIcon = (id) => {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    learn:
      '<path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
    train: '<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',
    build:
      '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
    profile: '<path d="M4 20h16M6 16v-5M12 16V4M18 16V8"/>',
    dominic:
      '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  };
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]}</svg>`;
};
const button = (label, action, extra = "", secondary = false) =>
  `<button type="button" class="${secondary ? "secondary-action" : "primary-action"}" data-action="${action}" ${extra}>${label}</button>`;
const done = () => new Set(data.attempts.map((a) => a.lessonId));
const nextLesson = () => lessons.find((l) => !done().has(l.id)) || lessons[6];
const due = () => data.attempts.filter((a) => reviewDue(a, data.reviews));
function persist() {
  const error = save(storage, data);
  if (error) {
    notice = error;
    const el = document.querySelector("#storage-notice");
    if (el) {
      el.hidden = false;
      el.textContent = error;
    }
  }
}
let detailView = "";
function nav(target) {
  detailView = "";
  if (names[target]) section = target;
  render();
  window.scrollTo(0, 0);
  document.querySelector("main h1")?.focus();
}
function launch(id) {
  if (!lessons.some((l) => l.id === id)) return;
  if (data.session) {
    notice =
      "You have a saved exercise. Finish it, or choose “Start this lesson instead” below.";
    section = "learn";
    return render();
  }
  data.session = createSession(
    id,
    data.attempts,
    (lessons.find((l) => l.id === id).ownRoute
      ? data.journeys[0]
      : defaultJourney
    ).stops,
  );
  persist();
  nav("session");
}
function render() {
  disposeBrain();
  document.body.classList.toggle("home-preview", preview && section === "home");
  document.body.classList.toggle(
    "utility-preview",
    preview && ["build", "profile"].includes(section),
  );
  document.body.classList.toggle(
    "practice-preview",
    preview && section === "session",
  );
  root.innerHTML = html`<div class="app-shell">
    <aside class="side-nav">
      <button class="brand-lockup" data-action="nav" data-section="home">
        <span class="brand-mark">m.</span
        ><span
          ><strong>memory mastery</strong
          ><small>with Dominic O’Brien</small></span
        >
      </button>
      <nav class="nav-list" aria-label="Main navigation">
        ${Object.keys(symbols)
          .map(
            (id) =>
              `<button class="nav-button ${id === section ? "is-active" : ""}" data-action="nav" data-section="${id}" ${id === section ? 'aria-current="page"' : ""}><span aria-hidden="true">${preview && section === "home" ? navigationIcon(id) : symbols[id]}</span>${names[id]}</button>`,
          )
          .join("")}
      </nav>
      <button
        type="button"
        class="nav-coach ${section === "dominic" ? "is-active" : ""}"
        data-action="nav"
        data-section="dominic"
        ${section === "dominic" ? 'aria-current="page"' : ""}
      >
        <img src="${portrait()}" alt="" />
        <span class="nav-coach-copy"
          ><strong>Meet Dominic <span aria-hidden="true">→</span></strong
          ><small>Your memory coach</small></span
        >
      </button>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <div>
          ${
            preview &&
            ["home", "learn", "session", "build", "profile"].includes(section)
              ? ""
              : html`<p class="eyebrow">Memory Mastery</p>`
          }
          <h1 tabindex="-1">${names[section]}</h1>
        </div>
        <span class="local-label">Saved on this device</span>
      </header>
      <p
        id="storage-notice"
        class="notice"
        role="status"
        ${notice ? "" : "hidden"}
      >
        ${esc(notice)}
      </p>
      ${({ home: home, learn: learn, train: train, build: build, profile: profile, dominic: dominic, session: sessionView, review: reviewView }[section] || home)()}
      <footer class="app-footer">
        <span>Local prototype · no account or cloud sync</span>
      </footer>
    </main>
  </div>`;
  const screenKey = `${section}:${detailView}:${section === "session" ? data.session?.step : ""}`;
  if (preview && render.lastScreen && render.lastScreen !== screenKey) {
    const screen = document.querySelector(
      ".session-stage, .practice-home, .learn-surface, .utility-screen",
    );
    if (screen && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      screen.animate(
        [
          { opacity: 0, transform: "translateX(14px)" },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    }
  }
  render.lastScreen = screenKey;
  if (section === "profile" && preview && detailView === "")
    disposeBrain = mountBrain(
      document.querySelector("#memory-brain"),
      brainDemo ??
        [0, 18, 35, 50][brainProgress(data.attempts, data.reviews).stage],
    );
}
function home() {
  if (preview) return homePreview();
  const lesson = nextLesson(),
    completed = done().size;
  return html`<div class="home-intro">
      <p class="eyebrow">Small practice. Lasting skills.</p>
      <h2>
        ${completed ? "Keep making connections." : "You can remember more."}
      </h2>
      <p>Learn a technique. Make it your own. See what you remember.</p>
    </div>
    <div class="home-layout">
      <div>
        <section class="hero-panel">
          <div class="hero-copy">
            <p class="eyebrow">
              ${data.session ? "Ready when you are" : `Session ${lesson.day} · foundations`}
            </p>
            <h2>
              ${data.session ? "Pick up where you left off." : esc(lesson.title)}
            </h2>
            <p>${esc(lesson.objective)}</p>
            <div class="hero-actions">
              ${button(data.session ? "Continue practice" : "Let’s begin", data.session ? "resume" : "lesson", `data-id="${lesson.id}"`)}<span
                class="quiet-metric"
                >About 5–10 minutes</span
              >
            </div>
          </div>
        </section>
        <div class="coach-strip">
          <img src="${portrait()}" alt="Dominic O’Brien" />
          <div>
            <strong>A champion in your corner.</strong>
            <p>
              Use imagination, association and familiar places to make everyday
              information memorable.
            </p>
            <button
              class="text-button"
              data-action="nav"
              data-section="dominic"
            >
              Meet Dominic →
            </button>
          </div>
        </div>
        <div class="section-heading">
          <h3>Your first seven sessions</h3>
          <span>${completed} of 7 explored</span>
        </div>
        <div class="week-path">
          ${lessons.map((l) => `<button data-action="lesson" data-id="${l.id}" aria-label="Session ${l.day}: ${esc(l.title)}${done().has(l.id) ? ", completed" : ""}" class="week-node ${done().has(l.id) ? "is-done" : l.id === lesson.id ? "is-next" : ""}"><span>${done().has(l.id) ? "✓" : l.day}</span><small>${["First win", "Images", "My route", "Recall", "Linking", "Real life", "Reflect"][l.day - 1]}</small></button>`).join("")}
        </div>
      </div>
      <aside class="home-aside">
        <section class="panel">
          <p class="eyebrow">Keep it with you</p>
          <h3>
            ${due().length ? `${due().length} reviews ready` : "A little space helps."}
          </h3>
          <p>
            ${due().length ? "Try remembering before you see the answers." : "After practice, your first recall review will be ready the next day."}
          </p>
          ${button("Open practice", "nav", 'data-section="train"', true)}
        </section>
        <section class="panel">
          <p class="eyebrow">Your progress</p>
          <strong class="big-number">${completed}<small> / 7</small></strong>
          <p>Foundation lessons explored</p>
          <p>${streak(data.attempts, data.reviews)} day practice streak</p>
          ${button(preview ? "See your memory network" : "View progress", "nav", 'data-section="profile"', true)}
        </section>
      </aside>
    </div>`;
}
function homePreview() {
  const completed = done().size;
  const lesson = data.session
    ? lessons.find((item) => item.id === data.session.lessonId) || nextLesson()
    : nextLesson();
  const reviews = due().length;
  const allDone = completed === lessons.length;
  return html`<div class="practice-home">
    <section
      class="hero-panel practice-focus"
      aria-labelledby="next-practice-title"
    >
      <div class="practice-meta">
        <span
          >${data.session ? "In progress" : allDone ? "Practise again" : `Session ${lesson.day} of ${lessons.length}`}</span
        ><span>5–10 min</span>
      </div>
      <h2 id="next-practice-title">${esc(lesson.title)}</h2>
      <p>${esc(lesson.objective)}</p>
      <div class="practice-start">
        <span
          >${data.session ? "Continue where you left off" : "Begin practice"}</span
        ><span aria-hidden="true">→</span>
      </div>
      <button
        type="button"
        class="practice-tap-target"
        data-action="${data.session ? "resume" : "lesson"}"
        data-id="${lesson.id}"
        aria-label="${data.session ? "Continue practice" : "Start practice"}: ${esc(lesson.title)}"
      ></button>
    </section>
    <section class="home-recall" aria-labelledby="home-recall-title">
      <div>
        <h2 id="home-recall-title">
          ${reviews ? `${reviews} recall ${reviews === 1 ? "review" : "reviews"} ready` : "Recall reviews"}
        </h2>
        <p>
          ${reviews ? "See what you remember from earlier practice." : completed ? "You’re up to date. Your next review will appear here when it’s ready." : "After your first practice, come back the next day to see what stayed."}
        </p>
      </div>
      ${reviews ? button("Review", "nav", 'data-section="train"', true) : '<span class="recall-status">Nothing due</span>'}
    </section>
    <section class="home-foundations" aria-label="Your sessions">
      <button
        type="button"
        class="home-navigation-row"
        data-action="nav"
        data-section="learn"
      >
        <span
          ><strong>Your sessions</strong
          ><span>Browse all seven sessions</span></span
        >
        <span aria-hidden="true">→</span>
      </button>
      <div class="home-session-list">
        ${lessons
          .filter((item) => item.id !== lesson.id && !done().has(item.id))
          .slice(0, 2)
          .map(
            (item) =>
              `<button class="home-session-row" data-action="lesson" data-id="${item.id}"><span class="session-index">${item.day}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.skill)}</small></span><span aria-hidden="true">→</span></button>`,
          )
          .join("")}
      </div>
    </section>
    <button
      type="button"
      class="home-navigation-row home-progress-target"
      data-action="nav"
      data-section="profile"
    >
      <span
        ><strong>Your progress</strong
        ><span>${completed} of ${lessons.length} sessions completed</span>
        <span class="session-track" aria-hidden="true"
          >${lessons.map((item) => `<span class="${done().has(item.id) ? "track-done" : ""}"></span>`).join("")}</span
        >
      </span>
      <span aria-hidden="true">→</span>
    </button>
    <button class="home-coach-link" data-action="nav" data-section="dominic">
      <img src="${portrait("neutral")}" alt="" /><span
        >Practising with Dominic O’Brien<span>Meet your teacher</span></span
      ><span aria-hidden="true">→</span>
    </button>
  </div>`;
}
function learn() {
  if (preview)
    return html`<section class="learn-surface" aria-label="Foundation sessions">
      <p class="learn-summary">
        Seven sessions. Pick up where you left off, or revisit any lesson.
      </p>
      <div class="tap-lesson-list">
        ${lessons
          .map((l) => {
            const saved = data.session?.lessonId === l.id;
            const replace = data.session && !saved;
            return `<button type="button" class="tap-lesson ${saved ? "has-saved-practice" : ""}" data-action="${saved ? "resume" : replace ? "replace-session" : "lesson"}" data-id="${l.id}" aria-label="${saved ? "Continue" : replace ? "Start this lesson instead:" : done().has(l.id) ? "Practise again:" : "Start"} ${esc(l.title)}"><span class="tap-lesson-number" aria-hidden="true">${done().has(l.id) ? "✓" : l.day}</span><span class="tap-lesson-copy"><strong>${esc(l.title)}</strong><span>${esc(l.objective)}</span><small>${saved ? "In progress · continue" : done().has(l.id) ? "Completed · practise again" : `${esc(l.skill)} · 5–10 min`}</small></span><span class="tap-lesson-arrow" aria-hidden="true">→</span></button>`;
          })
          .join("")}
      </div>
    </section>`;
  return html`<section class="panel">
    <p class="eyebrow">Foundation path</p>
    <h2>One skill builds on another.</h2>
    <p>
      Follow the sequence at your own pace. Repeat any session. Completion means
      you practised; delayed recall shows what stayed.
    </p>
    ${data.session ? `<div class="notice">Saved exercise: ${esc(lessons.find((l) => l.id === data.session.lessonId).title)} ${button("Continue", "resume", "", true)}</div>` : ""}
    <div class="lesson-list">
      ${lessons.map((l) => `<article class="lesson-row"><span class="lesson-number">${done().has(l.id) ? "✓" : String(l.day).padStart(2, "0")}</span><div><p class="eyebrow">${esc(l.skill)}</p><h3>${esc(l.title)}</h3><p>${esc(l.objective)}</p></div>${button(data.session && data.session.lessonId !== l.id ? "Start this lesson instead" : done().has(l.id) ? "Practise again" : "Open lesson", data.session && data.session.lessonId !== l.id ? "replace-session" : "lesson", `data-id="${l.id}"`, true)}</article>`).join("")}
    </div>
    <p class="fine-print">
      Suggested teaching copy; Dominic’s editorial review is still needed before
      publication.
    </p>
  </section>`;
}
function train() {
  return html`<section class="panel">
    <p class="eyebrow">Recall, then revisit</p>
    <h2>${due().length ? "Your reviews are ready." : "You’re up to date."}</h2>
    <p>
      Reviews start a day after practice. Successful reviews get a longer
      interval; difficult ones return sooner.
    </p>
    ${
      due()
        .map(
          (a) =>
            `<article class="lesson-row"><div><h3>${esc(lessons.find((l) => l.id === a.lessonId).title)}</h3><p>Five objects · practised ${new Date(a.completedAt).toLocaleDateString("en-GB")}</p></div>${button("Recall now", "review", `data-id="${esc(a.id)}"`)}</article>`,
        )
        .join("") ||
      '<p class="empty-state">Nothing due yet. You can still repeat a lesson with another list.</p>'
    }${button("Choose a lesson", "nav", 'data-section="learn"', true)}
  </section>`;
}
function answerInputs(values, field) {
  return html`<div class="recall-input-grid">
      ${values.map((v, i) => `<label><span>Object ${i + 1}</span><input autocomplete="off" maxlength="80" data-field="${field}" data-index="${i}" value="${esc(v)}"></label>`).join("")}
    </div>
    <p class="fine-print">
      One object per box, in any order. Leave a box empty if you don’t remember.
      Exact names are checked; case and extra spaces are ignored.
    </p>`;
}
function sessionView() {
  const s = data.session;
  if (!s)
    return html`<section class="panel">
      <h2>No exercise in progress.</h2>
      ${button("Choose a lesson", "nav", 'data-section="learn"')}
    </section>`;
  const l = lessons.find((l) => l.id === s.lessonId);
  const steps = [
    "baseline-study",
    "baseline-recall",
    "teach",
    "study",
    "recall",
    "result",
  ];
  let body = "";
  if (s.step === "baseline-study")
    body = html`<h2>Five objects. Your starting point.</h2>
      <p>Study the list, then hide it and recall as many objects as you can.</p>
      <div class="word-grid">
        ${s.baselineWords.map((w) => `<span>${esc(w)}</span>`).join("")}
      </div>
      ${button("Hide the list & recall", "advance")}`;
  if (s.step === "baseline-recall")
    body = html`<h2>What do you remember?</h2>
      <p>You don’t need to get them all. This is your first attempt.</p>
      ${answerInputs(s.baselineAnswers, "baselineAnswers")}${button("Learn the technique", "advance")}`;
  if (s.step === "teach")
    body = html`<div class="coach-layout">
      ${mentor()}
      <article>
        <h2>${esc(l.title)}</h2>
        <p>${esc(l.teach)}</p>
        <div class="example-note">
          <strong>Try this scene</strong>
          <p>${esc(l.example)}</p>
        </div>
        ${l.ownRoute ? `<p>Using: <strong>${esc(data.journeys[0].name)}</strong></p>${button("Edit my route", "nav", 'data-section="build"', true)}` : ""}${l.custom ? `<label class="text-field"><span>Your five objects, separated by commas</span><input data-field="customText" maxlength="450" value="${esc(s.customText)}" placeholder="apple, soap, rice, coffee, towel"></label>` : ""}${button("Try it yourself", "advance")}
      </article>
    </div>`;
  if (s.step === "study")
    body = html`<h2>
        ${l.mode === "link" ? "Connect each object to the next." : l.mode === "image" ? "Make each object distinctive." : "Give each object a place."}
      </h2>
      <p>
        ${l.mode === "link" ? "Write a short action joining neighbouring objects." : l.mode === "image" ? "Add a vivid action, sound or detail for each object." : "Imagine an object at each stop. Add your own scene if it helps."}
      </p>
      <div class="journey-study-list">
        ${s.words.map((w, i) => `<article class="journey-study-card"><span>${i + 1}</span><div><strong>${esc(w)}${l.mode === "journey" ? ` · ${esc(s.route[i])}` : l.mode === "link" && i < 4 ? ` → ${esc(s.words[i + 1])}` : ""}</strong><label class="text-field"><span>${l.mode === "link" ? "Your connection" : "Your memorable detail"} (optional)</span><input maxlength="500" data-field="notes" data-index="${i}" value="${esc(s.notes[i])}" placeholder="Make something surprising happen"></label></div></article>`).join("")}
      </div>
      ${button(l.custom ? "Hide the list & return later" : "Hide the list & recall", "advance")}`;
  if (s.step === "recall") {
    const waiting = l.custom && Date.now() - s.recallAt < 600000;
    body = html`<h2>Let your memories come back.</h2>
      <p>
        Recall without the list or location labels. You can leave and resume
        this step.
      </p>
      ${waiting ? '<p class="notice">For this real-life exercise, return at least ten minutes after hiding the list. Your answers will remain saved.</p>' : ""}${answerInputs(s.answers, "answers")}${button("Check my recall", "advance")}`;
  }
  if (s.step === "result") {
    const result = scoreRecall(s.answers, s.words),
      baseline = scoreRecall(s.baselineAnswers, s.baselineWords).score,
      delta = result.score - baseline;
    body = html`<p class="eyebrow">Practice complete</p>
      <h2>
        ${result.score === 5 ? "All five found." : result.score ? "You’ve made a start." : "Let’s strengthen the scenes."}
      </h2>
      <div class="result-grid">
        <article class="result-score">
          <span>Unaided recall</span><strong>${result.score}/5</strong
          ><small>${Math.round(s.studyMs / 1000)} seconds studying</small>
        </article>
        ${l.day === 1 ? `<article class="result-score"><span>Starting attempt</span><strong>${baseline}/5</strong><small>${Math.round(s.baselineStudyMs / 1000)} seconds studying</small></article><article class="result-score"><span>Difference</span><strong>${delta > 0 ? "+" : ""}${delta}</strong><small>objects</small></article>` : ""}
      </div>
      <p>
        ${result.missing.length ? `Revisit: ${result.missing.map(esc).join(", ")}. Make each scene more distinctive before trying another list.` : "Next, find out what you can recall after a delay."}
      </p>
      ${l.day === 1 ? '<p class="fine-print">Both attempts used five objects and unaided, any-order recall. Lists and study times differ; this is practice feedback, not a controlled measure of memory improvement.</p>' : ""}${!s.fresh ? '<p class="fine-print">This list may have appeared in previous practice.</p>' : ""}
      <div class="example-note">
        <strong>Take it into real life</strong>
        <p>${esc(l.apply)}</p>
      </div>
      ${button("Save practice & finish", "finish")}`;
  }
  return html`<section class="session-panel">
    <div class="session-top">
      <p class="eyebrow">Session ${l.day} · ${esc(l.skill)}</p>
      ${button("Save & leave", "nav", 'data-section="home"', true)}
    </div>
    <progress
      class="lesson-progress"
      aria-label="Lesson progress"
      max="6"
      value="${steps.indexOf(s.step) + 1}"
    ></progress>
    <div class="session-stage">${body}</div>
  </section>`;
}
function mentor() {
  return html`<figure class="mentor-portrait">
    <img src="${portrait()}" alt="Dominic O’Brien" />
    <figcaption>
      <strong>Dominic O’Brien</strong
      ><span>Eight-time World Memory Champion</span>
    </figcaption>
  </figure>`;
}
function reviewView() {
  if (!review)
    return html`<section class="panel">
      <h2>Choose a due review.</h2>
      ${button("Open practice", "nav", 'data-section="train"')}
    </section>`;
  return html`<section class="session-panel">
    <p class="eyebrow">Delayed recall</p>
    ${reviewResult ? `<h2>${reviewResult.score} of 5 remembered</h2><p>After ${Math.floor(reviewResult.delayMs / 3600000)} hours since your last recorded practice or review.</p><p>${reviewResult.missing.length ? `Review these: ${reviewResult.missing.map(esc).join(", ")}` : "You retrieved every object."}</p><div class="word-grid">${review.words.map((w) => `<span>${esc(w)}</span>`).join("")}</div>${button("Done", "nav", 'data-section="train"')}` : `<h2>Revisit the scene in your mind.</h2><p>${esc(lessons.find((l) => l.id === review.lessonId).title)} · ${new Date(review.completedAt).toLocaleDateString("en-GB")}</p>${answerInputs(review.answers, "reviewAnswers")}${button("Check recall", "finish-review")}`}
  </section>`;
}
function build() {
  if (preview && detailView !== "edit")
    return `<section class="utility-screen">${detailRow(esc(draft.name), `${draft.stops.length} stops · ${data.draft ? "Unsaved changes" : "Saved journey"}`, "edit")}<ol class="route-overview">${draft.stops.map((s) => `<li>${esc(s.name)}</li>`).join("")}</ol>${data.session ? button("Return to practice", "resume", "", true) : ""}</section>`;
  return html`<section class="panel builder-panel">
    ${
      preview
        ? `${detailBack()}<h2>Edit journey</h2><p>Use distinct places in order. Practice uses the first five stops.</p>`
        : html`<p class="eyebrow">Your reusable route</p>
            <h2>Five places you know by heart.</h2>
            <p>
              Start with five distinct stops. You can extend to twenty;
              foundation exercises use the first five.
            </p>`
    }
    <label class="text-field"
      ><span>Journey name</span
      ><input
        maxlength="100"
        data-field="journeyName"
        value="${esc(draft.name)}"
    /></label>
    <div class="stop-list">
      ${draft.stops.map((stop, i) => `<article class="stop-row"><strong>${i + 1}</strong><div class="stop-fields"><label><span>Location ${i + 1}</span><input maxlength="100" data-field="stopName" data-index="${i}" value="${esc(stop.name)}"></label><label><span>Association (optional)</span><input maxlength="500" data-field="stopAssociation" data-index="${i}" value="${esc(stop.association)}"></label></div><div class="row-actions"><button data-action="move-stop" data-index="${i}" data-direction="-1" aria-label="Move stop ${i + 1} up" ${i === 0 ? "disabled" : ""}>↑</button><button data-action="move-stop" data-index="${i}" data-direction="1" aria-label="Move stop ${i + 1} down" ${i === draft.stops.length - 1 ? "disabled" : ""}>↓</button></div></article>`).join("")}
    </div>
    <div class="builder-actions">
      ${button("Add stop", "add-stop", draft.stops.length >= 20 ? "disabled" : "", true)}${button("Save journey", "save-journey")}${data.session ? button("Return to lesson", "resume", "", true) : ""}
    </div>
  </section>`;
}
const brainEvolutions = [
  {
    at: 0,
    name: "Dormant",
    detail: "A world of potential. Your first lesson lights the spark.",
    reward: "Your journey starts here",
  },
  {
    at: 15,
    name: "First spark",
    detail: "New points of light appear. Your first memories begin to connect.",
    reward: "Unlocked · living connections",
  },
  {
    at: 32,
    name: "Connected",
    detail: "A richer web of memories, with energy travelling between them.",
    reward: "Unlocked · travelling pulses",
  },
  {
    at: 48,
    name: "Aurora",
    detail:
      "Your network radiates violet light. Satellites orbit your growing mind.",
    reward: "Unlocked · aurora orbits",
  },
  {
    at: 65,
    name: "Code flow",
    detail:
      "Streams of knowledge fall behind a brilliant, ever-denser network.",
    reward: "Unlocked · knowledge rain",
  },
  {
    at: 82,
    name: "Golden",
    detail:
      "Connections turn to gold. Every lesson becomes part of something extraordinary.",
    reward: "Unlocked · golden radiance",
  },
  {
    at: 100,
    name: "Ascended",
    detail:
      "Wings unfurled. Halo alight. Your entire learning journey, made luminous.",
    reward: "Unlocked · wings & halo",
  },
];
function brainState() {
  const value =
    brainDemo ??
    [0, 18, 35, 50][brainProgress(data.attempts, data.reviews).stage];
  const index = brainEvolutions.findLastIndex((s) => value >= s.at);
  return { value, index, evolution: brainEvolutions[index] };
}
function brainPanel() {
  const { value, index, evolution } = brainState();
  return `<section class="brain-panel">
    <div class="brain-heading"><div><p class="eyebrow">Your evolving mind</p><h2 id="brain-title">${evolution.name}</h2></div><span id="brain-badge" class="preview-badge">${brainDemo === null ? "Your practice" : "Demo mode"}</span></div>
    <div class="brain-stage-art"><canvas id="memory-brain" role="img" aria-label="${evolution.name}: ${evolution.detail}"></canvas><span class="brain-unlock" id="brain-unlock">${evolution.reward}</span></div>
    <div class="brain-simulator">
      <div class="brain-slider-heading"><label for="brain-timeline">Explore your evolution</label><output id="brain-percent" for="brain-timeline">${value}%</output></div>
      <input id="brain-timeline" type="range" min="0" max="100" step="1" value="${value}" aria-describedby="brain-demo-note" aria-valuetext="${value}% · ${evolution.name}">
      <div class="brain-range-labels"><span>Not started</span><span>All lessons & books complete</span></div>
      <div class="brain-controls" aria-label="Jump to an evolution">${brainEvolutions.map((s, i) => `<button data-action="brain-stage" data-stage="${i}" aria-pressed="${i === index}">${s.name}</button>`).join("")}</div>
      <p id="brain-detail" class="brain-detail">${evolution.detail}</p>
      <p id="brain-next" class="brain-next">${index < brainEvolutions.length - 1 ? `Next: ${brainEvolutions[index + 1].name} · ${brainEvolutions[index + 1].at}%` : "Final evolution · every milestone shines"}</p>
    </div>
    <p class="brain-explainer" id="brain-demo-note">Slide through a future learning journey. Demo milestones are illustrative; saved progress stays unchanged. ${button("Show my progress", "brain-reset", "", true)}</p>
    <p class="fine-print">A visual celebration of learning, not a measure of brain activity.</p>
  </section>`;
}
function updateBrainDemo() {
  const { value, index, evolution } = brainState();
  const slider = document.querySelector("#brain-timeline");
  slider.value = value;
  slider.setAttribute("aria-valuetext", `${value}% · ${evolution.name}`);
  document.querySelector("#brain-title").textContent = evolution.name;
  document.querySelector("#brain-badge").textContent =
    brainDemo === null ? "Your practice" : "Demo mode";
  document.querySelector("#brain-percent").textContent = `${value}%`;
  document.querySelector("#brain-detail").textContent = evolution.detail;
  document.querySelector("#brain-unlock").textContent = evolution.reward;
  document.querySelector("#brain-next").textContent =
    index < brainEvolutions.length - 1
      ? `Next: ${brainEvolutions[index + 1].name} · ${brainEvolutions[index + 1].at}%`
      : "Final evolution · every milestone shines";
  document
    .querySelector("#memory-brain")
    .setAttribute("aria-label", `${evolution.name}: ${evolution.detail}`);
  document
    .querySelectorAll("[data-action='brain-stage']")
    .forEach((b, i) => b.setAttribute("aria-pressed", i === index));
  disposeBrain.setProgress?.(value);
}
const detailRow = (title, subtitle, view) =>
  `<button type="button" class="home-navigation-row" data-action="detail" data-view="${view}"><span><strong>${title}</strong><span>${subtitle}</span></span><span aria-hidden="true">→</span></button>`;
const detailBack = () =>
  `<button type="button" class="detail-back" data-action="detail" data-view="">← Back to ${section === "build" ? "my journeys" : "my progress"}</button>`;
const goalExplanations = {
  "Remember names":
    "Focus on remembering the names of people you meet by connecting them with memorable images.",
  "Study more effectively":
    "Focus on remembering key facts and ideas from what you study, then practising recall over time.",
  "Remember everyday lists":
    "Focus on keeping shopping lists, packing lists and other everyday items in mind.",
  "Learn memory techniques":
    "Explore association, vivid imagery and the Journey Method to build your memory toolkit.",
};
function practiceGoalButton() {
  return `<div class="practice-goal-entry"><button type="button" class="primary-action practice-goal-button" data-action="detail" data-view="goal">Set a practice goal <span aria-hidden="true">→</span></button>${data.goal ? `<p>Current goal: <strong>${esc(data.goal)}</strong></p>` : ""}</div>`;
}
function practiceGoalScreen() {
  return `<section class="utility-screen practice-goal-screen">${detailBack()}<h2 tabindex="-1">Set a practice goal</h2><p>What would you like to work on? Choose a focus for your practice. You can change it at any time.</p><div class="practice-goal-options">${goals.map((goal) => `<button type="button" class="practice-goal-option" data-action="set-goal" data-goal="${esc(goal)}" aria-pressed="${data.goal === goal}"><span class="practice-goal-option-heading"><strong>${esc(goal)}</strong>${data.goal === goal ? '<span class="practice-goal-selected">Selected</span>' : '<span aria-hidden="true">→</span>'}</span><span>${esc(goalExplanations[goal])}</span></button>`).join("")}</div></section>`;
}
function profilePreview() {
  const latest = data.attempts.at(-1),
    delayed = data.reviews.at(-1);
  const content = `<dl class="progress-summary"><div><dt>Sessions completed</dt><dd>${done().size} <small>of 7</small></dd></div><div><dt>Latest practice recall</dt><dd>${latest ? `${latest.score} <small>of 5</small>` : "—"}</dd></div><div><dt>Latest delayed recall</dt><dd>${delayed ? `${delayed.score} <small>of 5</small>` : "—"}</dd></div></dl><p class="progress-context">${latest ? "Recall results count the objects you remembered. Session completion records practice." : "Complete a practice to see your recall results. Delayed reviews become available the next day."}</p>${practiceGoalButton()}`;
  return `<section class="utility-screen">${brainPanel()}${content}</section>`;
}
function profile() {
  if (detailView === "goal") return practiceGoalScreen();
  if (preview) return profilePreview();
  const latest = data.attempts.at(-1),
    delayed = data.reviews.at(-1);
  return html`${preview ? brainPanel() : ""}
    <div class="content-grid">
      <article class="metric-card">
        <span>Lessons explored</span><strong>${done().size}/7</strong>
        <p>Practice completion, not a mastery score.</p>
      </article>
      <article class="metric-card">
        <span>Latest unaided recall</span
        ><strong>${latest ? latest.score + "/5" : "—"}</strong>
        <p>
          ${latest ? "Five-object practice" : "Complete a session to see a result."}
        </p>
      </article>
      <article class="metric-card">
        <span>Latest delayed recall</span
        ><strong>${delayed ? delayed.score + "/5" : "—"}</strong>
        <p>
          ${delayed ? `${Math.floor(delayed.delayMs / 3600000)} hours since the last recorded practice or review` : "Your first review is due after 24 hours."}
        </p>
      </article>
      <section class="wide-panel">${practiceGoalButton()}</section>
    </div>`;
}
function dominic() {
  return html`<div class="dominic-page">
    <section class="dominic-hero" aria-labelledby="dominic-intro">
      <div>
        <p class="eyebrow">Your memory coach</p>
        <h2 id="dominic-intro">Dominic O’Brien</h2>
        <p class="dominic-credential">
          Eight-time World Memory Champion · Author &amp; trainer
        </p>
        <p>
          A familiar place. An unexpected image. A connection that means
          something to you. These are the building blocks of Dominic’s approach
          to remembering.
        </p>
        <p>Here, you can explore those ideas one small practice at a time.</p>
        ${button("Explore the lessons", "nav", 'data-section="learn"')}
      </div>
      <img
        class="dominic-photo"
        src="${portrait()}"
        alt="Dominic O’Brien smiling, seated in a television studio"
        width="315"
        height="420"
      />
    </section>
    <section class="dominic-story" aria-labelledby="dominic-background">
      <p class="eyebrow">The person behind the practice</p>
      <h2 id="dominic-background">From curiosity to world champion</h2>
      <p>
        In 1987, Dominic watched Creighton Carvello memorise a shuffled pack of
        cards on television. It sparked an interest that led him to develop his
        own memory techniques and go on to win the World Memory Championship
        eight times.
      </p>
      <p>
        Alongside competition, he has built a career as an author, speaker and
        memory trainer, teaching students and professionals how to apply memory
        techniques to everyday life. His books include
        <cite>How to Develop a Brilliant Memory – Week by Week</cite>.
      </p>
      <p>
        His teaching brings together established techniques, such as remembering
        through familiar locations, and his own Dominic System for turning
        numbers into people and actions.
      </p>
    </section>
    <section class="dominic-methods" aria-labelledby="dominic-methods-title">
      <p class="eyebrow">How the methods work</p>
      <h2 id="dominic-methods-title">
        Give information something to connect to
      </h2>
      <p>
        Dominic’s teaching centres on three keys: association, imagination and
        location. Here’s how they come together, with simple examples to try.
      </p>
      <div class="dominic-method-grid">
        <article>
          <span class="eyebrow">01 · Make it distinctive</span>
          <h3>Imagination &amp; association</h3>
          <p>
            Connect new information to something familiar. Add movement, sound
            or an unusual detail to give yourself a clear cue for recall.
          </p>
          <p class="method-example">
            <strong>Try it:</strong> To remember a lemon, imagine one growing
            until it fills your sink. Hear it squeak against the taps and
            imagine its sharp citrus smell.
          </p>
        </article>
        <article>
          <span class="eyebrow">02 · Give it a place</span>
          <h3>The Journey Method</h3>
          <p>
            Choose a route you know well and a fixed sequence of stops. Place
            one memorable scene at each stop, then mentally walk the route again
            to recall the items in order.
          </p>
          <p class="method-example">
            <strong>Try it:</strong> Picture an umbrella blocking your front
            door, a giant watch ticking on the hall table and that lemon in the
            kitchen sink.
          </p>
        </article>
        <article>
          <span class="eyebrow">03 · Connect the sequence</span>
          <h3>The Link Method</h3>
          <p>
            Connect each item directly to the next through an action or short
            story. Each scene becomes a cue for the item that follows.
          </p>
          <p class="method-example">
            <strong>Try it:</strong> An umbrella scoops up a watch. The watch
            bursts open and a lemon rolls out. Replay those actions to recover
            the three objects.
          </p>
        </article>
        <article>
          <span class="eyebrow">04 · Make numbers personal</span>
          <h3>The Dominic System</h3>
          <p>
            Give each two-digit number a familiar person and a distinctive
            action, using letters as a bridge to their initials. Combine one
            person with another person’s action to represent four digits, then
            place the scene on a journey.
          </p>
          <p class="method-example">
            <strong>For example:</strong> With 1 = A and 5 = E, 15 becomes AE.
            You might choose Albert Einstein writing on a blackboard as your
            personal cue for 15.
          </p>
          <small
            >This is part of Dominic’s wider teaching; number training is not
            included in the seven foundation sessions yet.</small
          >
        </article>
      </div>
    </section>
    <section class="dominic-next" aria-labelledby="dominic-practice-title">
      <div>
        <h2 id="dominic-practice-title">Start with five things</h2>
        <p>
          The foundation sessions let you practise images, links and familiar
          routes. Try recalling before checking the answers, adjust the cues
          that didn’t work, and return for a later review.
        </p>
      </div>
      ${button("Explore the lessons", "nav", 'data-section="learn"')}
    </section>
    <aside class="dominic-sources" aria-label="Further reading">
      <strong>More about Dominic and his teaching</strong>
      <a
        href="https://peakperformancetraining.org/"
        target="_blank"
        rel="noopener noreferrer"
        >Dominic’s official website ↗</a
      >
      <a
        href="https://peakperformancetraining.org/memory-training-courses/"
        target="_blank"
        rel="noopener noreferrer"
        >His memory training methods ↗</a
      >
      <a
        href="https://www.nightingale.com/pages/dominic-obrien"
        target="_blank"
        rel="noopener noreferrer"
        >Biography from his audio publisher ↗</a
      >
    </aside>
  </div>`;
}
function advance() {
  const s = data.session;
  if (!s) return;
  const l = lessons.find((l) => l.id === s.lessonId),
    now = Date.now();
  if (s.step === "baseline-study") {
    s.baselineStudyMs = now - s.studyStartedAt;
    s.step = "baseline-recall";
  } else if (s.step === "baseline-recall") s.step = "teach";
  else if (s.step === "teach") {
    if (l.custom) {
      const words = s.customText.split(",").map((w) => w.trim());
      if (
        words.length !== 5 ||
        words.some((w) => !w || w.length > 80) ||
        new Set(words.map(normalise)).size !== 5
      ) {
        notice = "Enter five different objects, separated by commas.";
        return render();
      }
      s.words = words;
      s.listId = -1;
      s.fresh = false;
    }
    if (l.ownRoute)
      s.route = data.journeys[0].stops.slice(0, 5).map((x) => x.name);
    s.step = "study";
    s.studyStartedAt = now;
  } else if (s.step === "study") {
    s.studyMs = now - s.studyStartedAt;
    s.recallAt = now;
    s.step = "recall";
  } else if (s.step === "recall") {
    if (l.custom && now - s.recallAt < 600000) {
      notice =
        "For this exercise, wait at least ten minutes after hiding the list. Your recall step is saved.";
      return render();
    }
    s.step = "result";
  }
  notice = "";
  persist();
  render();
  window.scrollTo(0, 0);
  const heading = document.querySelector(".session-stage h2");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}
root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const a = b.dataset.action;
  if (a === "detail") {
    if (!["", "edit", "goal"].includes(b.dataset.view)) return;
    detailView = b.dataset.view;
    render();
    window.scrollTo(0, 0);
    const heading = document.querySelector(
      ".utility-screen h2, .builder-panel h2, main h1",
    );
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    return;
  }
  if (a === "set-goal") {
    if (!goals.includes(b.dataset.goal)) return;
    data.goal = b.dataset.goal;
    notice = "Practice goal saved.";
    persist();
    return nav("profile");
  }
  if (a === "nav") return nav(b.dataset.section);
  if (a === "lesson") return launch(b.dataset.id);
  if (a === "resume") return nav("session");
  if (a === "replace-session") {
    if (
      !confirm(
        "Replace the unfinished exercise? Completed practice and saved journeys will stay.",
      )
    )
      return;
    data.session = null;
    return launch(b.dataset.id);
  }
  if (a === "advance") return advance();
  if (a === "finish") {
    if (data.session?.step !== "result") return;
    const attempt = makeAttempt(data.session);
    if (!data.attempts.some((x) => x.id === attempt.id))
      data.attempts.push(attempt);
    data.session = null;
    notice = "Practice saved. Your first review will be ready tomorrow.";
    persist();
    return nav("home");
  }
  if (a === "review") {
    const attempt = data.attempts.find((x) => x.id === b.dataset.id);
    if (!attempt || !reviewDue(attempt, data.reviews)) return;
    review = { ...attempt, answers: Array(5).fill("") };
    reviewResult = null;
    return nav("review");
  }
  if (a === "finish-review") {
    if (!review || reviewResult) return;
    const last = data.reviews.filter((r) => r.attemptId === review.id).at(-1),
      now = Date.now();
    reviewResult = {
      ...scoreRecall(review.answers, review.words),
      delayMs: now - (last?.completedAt || review.completedAt),
    };
    data.reviews.push({
      id: crypto.randomUUID(),
      attemptId: review.id,
      score: reviewResult.score,
      delayMs: reviewResult.delayMs,
      completedAt: now,
    });
    persist();
    return render();
  }
  if (a === "move-stop") {
    draft.stops = moveStop(
      draft.stops,
      Number(b.dataset.index),
      Number(b.dataset.direction),
    );
    data.draft = draft;
    persist();
    return render();
  }
  if (a === "add-stop") {
    if (draft.stops.length >= 20) return;
    draft.stops.push({
      name: `Stop ${draft.stops.length + 1}`,
      association: "",
    });
    data.draft = draft;
    persist();
    return render();
  }
  if (a === "save-journey") {
    const cleaned = validateJourney(draft);
    if (!cleaned) {
      notice = "Give every stop a name before saving.";
      return render();
    }
    if (
      new Set(cleaned.stops.map((s) => normalise(s.name))).size !==
      cleaned.stops.length
    ) {
      notice = "Choose distinct names for each stop.";
      return render();
    }
    data.journeys[0] = cleaned;
    draft = structuredClone(cleaned);
    data.draft = null;
    notice = "Journey saved. New practice will use this route.";
    persist();
    return render();
  }
  if (a === "brain-stage") {
    brainDemo = brainEvolutions[Number(b.dataset.stage)].at;
    updateBrainDemo();
    return;
  }
  if (a === "brain-reset") {
    brainDemo = null;
    updateBrainDemo();
    return;
  }
  if (a === "export") {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "memory-mastery-progress.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (a === "delete") {
    if (
      !confirm(
        "Delete this browser’s Memory Mastery progress and journeys? Export a copy first if you need it.",
      )
    )
      return;
    try {
      for (const key of [
        "memory-mastery-v2",
        "memory-mastery-progress",
        "memory-mastery-journeys",
      ])
        storage.removeItem(key);
    } catch {
      notice = "Could not delete browser data.";
      return render();
    }
    data = empty();
    draft = structuredClone(data.journeys[0]);
    review = null;
    reviewResult = null;
    notice = "Local progress deleted.";
    return nav("home");
  }
});
root.addEventListener("input", (e) => {
  if (e.target.id === "brain-timeline") {
    brainDemo = Number(e.target.value);
    updateBrainDemo();
    return;
  }
  const field = e.target.dataset.field,
    i = Number(e.target.dataset.index),
    value = e.target.value;
  if (!field) return;
  if (
    ["answers", "baselineAnswers", "notes"].includes(field) &&
    data.session &&
    Number.isInteger(i) &&
    i >= 0 &&
    i < 5
  )
    data.session[field][i] = value.slice(0, field === "notes" ? 500 : 80);
  if (field === "customText" && data.session)
    data.session.customText = value.slice(0, 450);
  if (field === "reviewAnswers" && review && i >= 0 && i < 5)
    review.answers[i] = value.slice(0, 80);
  if (field === "journeyName") draft.name = value.slice(0, 100);
  if (field === "stopName" && draft.stops[i])
    draft.stops[i].name = value.slice(0, 100);
  if (field === "stopAssociation" && draft.stops[i])
    draft.stops[i].association = value.slice(0, 500);
  if (["journeyName", "stopName", "stopAssociation"].includes(field))
    data.draft = draft;
  persist();
});
render();
