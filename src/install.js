// Keep local development uncached; the published app can work offline.
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(new URL("../sw.js", import.meta.url), {
        updateViaCache: "none",
      })
      .catch((error) => console.warn("Offline support is unavailable.", error));
  });
}
