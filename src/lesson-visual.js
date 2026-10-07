import { lessonMedia } from "./lesson-media.js";
import { lessonScenes } from "./lesson-scenes.js";

const VALID_PREFERENCES = new Set(["system", "on", "off"]);
const normalisePreference = (value) =>
  VALID_PREFERENCES.has(value) ? value : "system";

/** A still-first lesson example with one deliberately finite animation. */
export function lessonVisualMarkup(lessonId) {
  const media = lessonMedia[lessonId];
  const details = lessonScenes[lessonId];
  if (!media || !details) return "";
  const videoUrl = new URL(media.video, import.meta.url).href;
  const posterUrl = new URL(media.poster, import.meta.url).href;

  return `
    <figure class="lesson-visual" data-lesson-visual="${lessonId}" data-state="still" data-ready="false">
      <div class="lesson-visual-heading">
        <span class="lesson-visual-eyebrow">See the idea</span>
        <span class="lesson-visual-duration">A moment to remember</span>
      </div>
      <div class="lesson-visual-scene">
        <div class="lesson-visual-fallback" hidden>
          <strong>Imagine this.</strong>
          <span>${details.description}</span>
        </div>
        <video class="lesson-visual-video" src="${videoUrl}" poster="${posterUrl}" preload="auto" muted playsinline aria-hidden="true" tabindex="-1" hidden></video>
        <img class="lesson-visual-poster" src="${posterUrl}" alt="${details.description}" decoding="async" />
        ${details.timeLabels ? '<span class="lesson-visual-time" aria-hidden="true">The next day</span>' : ""}
      </div>
      <figcaption class="lesson-visual-caption">
        <strong>${details.title}</strong>
        <span>${details.caption}</span>
      </figcaption>
      <div class="lesson-visual-controls">
        <button class="lesson-visual-button" type="button" data-visual-replay>Replay animation</button>
        <button class="lesson-visual-button" type="button" data-visual-skip hidden>Show final image</button>
        <p class="lesson-visual-status" role="status" aria-live="polite" aria-atomic="true">Final image · preparing replay</p>
      </div>
      <div class="lesson-visual-preferences">
        <label class="lesson-visual-setting">
          <span>Autoplay</span>
          <select data-visual-preference aria-label="Play lesson animations automatically" aria-describedby="lesson-visual-motion-help">
            <option value="system">Device preference</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <p id="lesson-visual-motion-help">Device preference respects reduced motion. Replay is always your choice.</p>
      </div>
    </figure>`;
}

/**
 * Mount after inserting lessonVisualMarkup. Call the returned function before
 * removing the lesson; use dispose.setPreference(value) for external settings.
 */
export function mountLessonVisual(
  element,
  { preference = "system", onPreferenceChange } = {},
) {
  const root = element?.matches?.("[data-lesson-visual]")
    ? element
    : element?.querySelector?.("[data-lesson-visual]");
  if (!root) {
    const dispose = () => {};
    dispose.setPreference = () => {};
    return dispose;
  }

  const video = root.querySelector(".lesson-visual-video");
  const details = lessonScenes[root.dataset.lessonVisual];
  const timeLabel = root.querySelector(".lesson-visual-time");
  const poster = root.querySelector(".lesson-visual-poster");
  const fallback = root.querySelector(".lesson-visual-fallback");
  const scene = root.querySelector(".lesson-visual-scene");
  const replay = root.querySelector("[data-visual-replay]");
  const skip = root.querySelector("[data-visual-skip]");
  const select = root.querySelector("[data-visual-preference]");
  const status = root.querySelector(".lesson-visual-status");
  const durationLabel = root.querySelector(".lesson-visual-duration");
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const cleanups = [];
  let currentPreference = normalisePreference(preference);
  let disposed = false;
  let ready = false;
  let failure = "";
  let autoplayBlocked = false;
  let posterFailed = false;
  let playing = false;
  let runId = 0;
  let loadTimeout;

  const allowsAutomaticMotion = () =>
    currentPreference === "on" ||
    (currentPreference === "system" && !motionQuery?.matches);
  let automaticPlayPending = allowsAutomaticMotion();

  function listen(target, event, listener) {
    target.addEventListener(event, listener);
    cleanups.push(() => target.removeEventListener(event, listener));
  }

  function stillStatus() {
    if (failure === "unsupported")
      return "This browser cannot play the video · final image shown";
    if (failure === "decode")
      return "Video could not be decoded · final image shown";
    if (failure)
      return "Animation could not load · final image shown. You can retry.";
    if (autoplayBlocked) return "Final image · press Play to watch";
    if (currentPreference === "off") return "Final image · animations off";
    if (currentPreference === "system" && motionQuery?.matches)
      return "Final image · reduced motion";
    if (!ready) return "Final image · preparing replay";
    return "Final image · take a moment to picture it";
  }

  function updateReplay() {
    replay.textContent = failure
      ? "Retry animation"
      : autoplayBlocked
        ? "Play animation"
        : "Replay animation";
  }

  function showFinal({ restoreFocus = false } = {}) {
    const focusReplay = restoreFocus || document.activeElement === skip;
    runId += 1;
    playing = false;
    video.pause();
    video.hidden = true;
    poster.hidden = posterFailed;
    fallback.hidden = !posterFailed;
    root.dataset.state = "still";
    if (timeLabel) timeLabel.textContent = details.timeLabels.at(-1).text;
    replay.hidden = false;
    skip.hidden = true;
    updateReplay();
    status.textContent = stillStatus();
    if (focusReplay && !disposed) replay.focus({ preventScroll: true });
  }

  function fail(reason) {
    if (disposed) return;
    window.clearTimeout(loadTimeout);
    failure = reason;
    ready = false;
    automaticPlayPending = false;
    root.dataset.ready = "error";
    showFinal();
  }

  function guardLoading() {
    window.clearTimeout(loadTimeout);
    loadTimeout = window.setTimeout(() => fail("timeout"), 20000);
  }

  function play(explicit = false) {
    if (disposed || document.hidden || (!explicit && !allowsAutomaticMotion()))
      return;

    automaticPlayPending = false;
    showFinal();
    const thisRun = ++runId;
    if (failure) {
      failure = "";
      ready = false;
      root.dataset.ready = "false";
      video.load();
    }
    autoplayBlocked = false;
    playing = true;
    if (timeLabel) timeLabel.textContent = details.timeLabels[0].text;
    // Keep a rendered video box for mobile autoplay; the poster covers it until
    // the first video frame is ready, so loading never flashes an empty player.
    video.hidden = false;
    root.dataset.state = "playing";
    replay.hidden = true;
    skip.hidden = false;
    status.textContent = "Preparing the animation…";
    if (explicit) {
      // Put the scene back in view after the browser scrolls to the button.
      scene.scrollIntoView({ behavior: "instant", block: "center" });
      skip.focus({ preventScroll: true });
    }
    guardLoading();
    try {
      video.currentTime = 0;
      // Setting the property as well as the attribute supports mobile autoplay.
      video.muted = true;
      const started = video.play();
      started?.catch((error) => {
        if (disposed || thisRun !== runId) return;
        window.clearTimeout(loadTimeout);
        if (error.name === "NotAllowedError") {
          // Autoplay policy is not an asset failure. A gesture can still play it.
          autoplayBlocked = true;
          showFinal();
        } else if (error.name === "AbortError") {
          showFinal();
        } else {
          fail(video.canPlayType("video/mp4") ? "load" : "unsupported");
        }
      });
    } catch {
      fail(video.canPlayType("video/mp4") ? "load" : "unsupported");
    }
  }

  function setPreference(value) {
    const next = normalisePreference(value);
    if (disposed || next === currentPreference) return;
    const previouslyAllowed = allowsAutomaticMotion();
    currentPreference = next;
    select.value = next;
    if (!allowsAutomaticMotion()) {
      automaticPlayPending = false;
      window.clearTimeout(loadTimeout);
      showFinal();
    } else if (!previouslyAllowed) {
      automaticPlayPending = true;
      if (ready || failure) play();
    } else if (!playing) status.textContent = stillStatus();
  }

  const posterUnavailable = () => {
    posterFailed = true;
    if (!playing || video.hidden) {
      poster.hidden = true;
      fallback.hidden = false;
    }
  };
  listen(poster, "error", posterUnavailable);
  listen(poster, "load", () => {
    posterFailed = false;
    if (!playing || video.hidden) {
      poster.hidden = false;
      fallback.hidden = true;
    }
  });
  if (poster.complete && !poster.naturalWidth) posterUnavailable();

  const videoReady = () => {
    if (disposed) return;
    ready = true;
    failure = "";
    root.dataset.ready = "true";
    window.clearTimeout(loadTimeout);
    updateReplay();
    if (automaticPlayPending && !document.hidden) play();
    else if (!playing) status.textContent = stillStatus();
  };
  listen(video, "canplay", videoReady);
  listen(video, "loadedmetadata", () => {
    if (Number.isFinite(video.duration) && video.duration > 0)
      durationLabel.textContent = `${Math.ceil(video.duration)}-second example`;
  });
  listen(video, "playing", () => {
    if (disposed || !playing) {
      video.pause();
      return;
    }
    window.clearTimeout(loadTimeout);
    video.hidden = false;
    poster.hidden = true;
    fallback.hidden = true;
    status.textContent = details.watching;
  });
  listen(video, "waiting", () => {
    if (!playing || disposed) return;
    status.textContent = "Loading the animation…";
    guardLoading();
  });
  if (timeLabel)
    listen(video, "timeupdate", () => {
      if (playing)
        timeLabel.textContent =
          details.timeLabels.findLast((label) => video.currentTime >= label.at)
            ?.text || "Today";
    });
  listen(video, "ended", () => {
    window.clearTimeout(loadTimeout);
    if (!disposed) showFinal();
  });
  listen(video, "error", () => {
    const reason = !video.canPlayType("video/mp4")
      ? "unsupported"
      : video.error?.code === 3
        ? "decode"
        : "load";
    fail(reason);
  });
  listen(replay, "click", () => play(true));
  listen(skip, "click", () => {
    automaticPlayPending = false;
    window.clearTimeout(loadTimeout);
    showFinal({ restoreFocus: true });
  });
  listen(select, "change", () => {
    setPreference(select.value);
    onPreferenceChange?.(currentPreference);
  });
  listen(document, "visibilitychange", () => {
    if (document.hidden) {
      automaticPlayPending = false;
      window.clearTimeout(loadTimeout);
      showFinal();
    }
  });
  const deviceMotionChanged = () => {
    if (currentPreference !== "system") return;
    if (motionQuery.matches) {
      automaticPlayPending = false;
      window.clearTimeout(loadTimeout);
      showFinal();
    } else if (!playing) status.textContent = stillStatus();
  };
  if (motionQuery?.addEventListener)
    listen(motionQuery, "change", deviceMotionChanged);
  else if (motionQuery?.addListener) {
    motionQuery.addListener(deviceMotionChanged);
    cleanups.push(() => motionQuery.removeListener(deviceMotionChanged));
  }
  select.value = currentPreference;
  video.muted = true;
  showFinal();
  if (video.error) fail("load");
  else if (video.readyState >= 3) videoReady();
  else guardLoading();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    automaticPlayPending = false;
    showFinal();
    window.clearTimeout(loadTimeout);
    cleanups.forEach((cleanup) => cleanup());
    // Release the decoder and pending network work when navigating away.
    video.removeAttribute("src");
    video.load();
  };
  dispose.setPreference = setPreference;
  return dispose;
}
