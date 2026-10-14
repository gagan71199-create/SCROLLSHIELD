// content.js — runs on Instagram & YouTube pages.
// Detects when the user is inside Reels/Shorts, counts scroll-throughs,
// tracks time spent, and shows a blocking overlay once a limit is hit.

(function () {
  let settings = null;
  let overrideBudget = 0;      // extra reels allowed after a reflection override
  let lastScrollAt = 0;
  const SCROLL_DEBOUNCE_MS = 450;

  let timeTrackerHandle = null;
  let overlayShown = false;
  let cooldownEndsAt = null;

  function isReelsOrShorts() {
    const host = location.hostname;
    const path = location.pathname;
    if (host.includes("instagram.com")) {
      return /^\/reels?(\/|$)/.test(path);
    }
    if (host.includes("youtube.com")) {
      return path.startsWith("/shorts");
    }
    return false;
  }

  function platformEnabled() {
    if (!settings) return false;
    if (location.hostname.includes("instagram.com")) return settings.enabledInstagram;
    if (location.hostname.includes("youtube.com")) return settings.enabledYoutube;
    return false;
  }

  function shouldTrack() {
    return platformEnabled() && isReelsOrShorts();
  }

  // ---------- Time tracking ----------
  function startTimeTracker() {
    if (timeTrackerHandle) return;
    timeTrackerHandle = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      if (!shouldTrack()) return;
      if (overlayShown) return;
      await RS.addTime(5000);
    }, 5000);
  }

  // ---------- Scroll counting ----------
  async function registerScroll() {
    const now = Date.now();
    if (now - lastScrollAt < SCROLL_DEBOUNCE_MS) return;
    lastScrollAt = now;

    const stats = await RS.incrementCount(1);
    checkLimit(stats);
  }

  function isYoutube() {
    return location.hostname.includes("youtube.com");
  }

  function onWheel() {
    if (!shouldTrack() || overlayShown) return;
    if (isYoutube()) return; // YouTube Shorts is counted via URL change instead — avoids double counting
    registerScroll();
  }

  function onTouchEnd(e) {
    if (!shouldTrack() || overlayShown) return;
    if (isYoutube()) return;
    registerScroll();
  }

  function onKeyDown(e) {
    if (!shouldTrack() || overlayShown) return;
    if (isYoutube()) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "j" || e.key === "k") {
      registerScroll();
    }
  }

  // YouTube Shorts changes the URL per short — this is the ONLY signal used for
  // counting on YouTube (wheel/touch/key are skipped there) to avoid double counting.
  let lastPath = location.pathname;
  let lastUrlScrollAt = 0;
  const URL_SCROLL_DEBOUNCE_MS = 400;
  function watchUrlChanges() {
    setInterval(() => {
      if (location.pathname !== lastPath) {
        const wasShorts = lastPath.startsWith("/shorts");
        lastPath = location.pathname;
        const now = Date.now();
        if (wasShorts && shouldTrack() && !overlayShown && now - lastUrlScrollAt > URL_SCROLL_DEBOUNCE_MS) {
          lastUrlScrollAt = now;
          registerScroll();
        }
      }
    }, 300);
  }

  function checkLimit(stats) {
    const effectiveLimit = settings.scrollLimit + overrideBudget;
    if (stats.count >= effectiveLimit && !overlayShown) {
      showOverlay(stats);
    }
  }

  // ---------- Overlay ----------
  function fmtMinutes(ms) {
    const mins = Math.round(ms / 60000);
    return mins < 1 ? "<1" : String(mins);
  }

  function showOverlay(stats) {
    overlayShown = true;
    cooldownEndsAt = Date.now() + settings.cooldownMinutes * 60 * 1000;

    const root = document.createElement("div");
    root.id = "rs-overlay-root";
    root.innerHTML = `
      <div class="rs-backdrop">
        <div class="rs-card">
          <span class="rs-emoji">⏸️</span>
          <h2>That's a lot of scrolling</h2>
          <div class="rs-sub">You've hit your reels limit for right now. A short break helps reset the urge to keep going.</div>
          <div class="rs-guilt-quote">${rsRandomOverlayQuote()}</div>
          <div class="rs-stat-row">
            <div class="rs-stat"><b id="rs-stat-count">${stats.count}</b><span>Reels today</span></div>
            <div class="rs-stat"><b id="rs-stat-time">${fmtMinutes(stats.timeMs)}</b><span>Minutes</span></div>
          </div>
          <div class="rs-countdown">Locked for <b id="rs-countdown-val">--:--</b></div>
          <textarea id="rs-reason" placeholder="Optional: why do you need to keep scrolling? Writing it out often kills the urge."></textarea>
          <div class="rs-hint">Waiting out the timer is free. Writing a real reason unlocks 5 more reels early.</div>
          <div class="rs-buttons">
            <button class="rs-primary" id="rs-continue" disabled>Continue scrolling</button>
            <button class="rs-secondary" id="rs-leave">Close this tab instead</button>
          </div>
        </div>
      </div>
    `;
    document.documentElement.appendChild(root);

    document.body.style.overflow = "hidden";

    // Block all scroll/touch/key input while overlay is up.
    const blockEvent = (e) => {
      if (root.contains(e.target)) return; // allow interacting with the overlay itself
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("wheel", blockEvent, { passive: false, capture: true });
    window.addEventListener("touchmove", blockEvent, { passive: false, capture: true });
    window.addEventListener("keydown", blockEvent, { capture: true });

    const continueBtn = root.querySelector("#rs-continue");
    const leaveBtn = root.querySelector("#rs-leave");
    const reasonBox = root.querySelector("#rs-reason");
    const countdownEl = root.querySelector("#rs-countdown-val");

    function tick() {
      const remaining = cooldownEndsAt - Date.now();
      if (remaining <= 0) {
        countdownEl.textContent = "0:00";
        continueBtn.disabled = false;
        continueBtn.textContent = "Continue scrolling";
        return;
      }
      const s = Math.ceil(remaining / 1000);
      const mm = Math.floor(s / 60);
      const ss = String(s % 60).padStart(2, "0");
      countdownEl.textContent = `${mm}:${ss}`;
      requestAnimationFrame(() => setTimeout(tick, 250));
    }
    tick();

    reasonBox.addEventListener("input", () => {
      if (reasonBox.value.trim().length >= 15) {
        continueBtn.disabled = false;
        continueBtn.textContent = "Unlock 5 more reels";
        continueBtn.dataset.override = "1";
      } else if (Date.now() >= cooldownEndsAt) {
        continueBtn.disabled = false;
        continueBtn.textContent = "Continue scrolling";
        delete continueBtn.dataset.override;
      } else {
        continueBtn.disabled = true;
      }
    });

    continueBtn.addEventListener("click", async () => {
      if (continueBtn.dataset.override === "1") {
        overrideBudget += 5;
        await RS.incrementOverride();
      }
      closeOverlay(root, blockEvent);
    });

    leaveBtn.addEventListener("click", () => {
      window.location.href = "about:blank";
    });
  }

  // ---------- Return-visit motivational quote ----------
  function showQuoteToast() {
    if (document.getElementById("rs-quote-toast")) return;

    const toast = document.createElement("div");
    toast.id = "rs-quote-toast";
    toast.innerHTML = `
      <span class="rs-quote-emoji">💭</span>
      <span class="rs-quote-text">${rsRandomQuote()}</span>
    `;
    document.documentElement.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("rs-show"));

    setTimeout(() => {
      toast.classList.remove("rs-show");
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  const RETURN_THRESHOLD_MS = 2 * 60 * 1000; // "away for 2+ minutes" counts as a fresh return

  async function maybeShowReturnQuote() {
    if (!settings.showQuotes) return;
    if (!shouldTrack()) return;

    const lastLeftAt = await RS.getLastLeftAt();
    const now = Date.now();
    if (now - lastLeftAt > RETURN_THRESHOLD_MS) {
      showQuoteToast();
    }
  }

  function markLeftNow() {
    RS.setLastLeftAt(Date.now());
  }

  function closeOverlay(root, blockEvent) {
    window.removeEventListener("wheel", blockEvent, { capture: true });
    window.removeEventListener("touchmove", blockEvent, { capture: true });
    window.removeEventListener("keydown", blockEvent, { capture: true });
    root.remove();
    document.body.style.overflow = "";
    overlayShown = false;
  }

  // ---------- Init ----------
  async function init() {
    settings = await RS.getSettings();
    startTimeTracker();
    watchUrlChanges();
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });

    // Show a motivational quote if the user is returning after being away a while.
    await maybeShowReturnQuote();

    // Track when the user leaves so we know it's a genuine "return" next time.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && shouldTrack()) {
        markLeftNow();
      } else if (document.visibilityState === "visible") {
        maybeShowReturnQuote();
      }
    });
    window.addEventListener("beforeunload", () => {
      if (shouldTrack()) markLeftNow();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") {
        RS.getSettings().then((s) => (settings = s));
      }
    });
  }

  init();
})();
