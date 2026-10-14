// storage.js — shared helpers for reading/writing extension state.
// Loaded by content.js and popup.js (plain scripts, not modules, so everything
// hangs off a single global `RS` namespace to avoid collisions).

const RS = (function () {
  const DEFAULT_SETTINGS = {
    scrollLimit: 20,       // reels/shorts before a block kicks in
    cooldownMinutes: 5,    // minutes the overlay stays locked before override is allowed
    enabledInstagram: true,
    enabledYoutube: true,
    showQuotes: true,
  };

  function todayKey() {
    const d = new Date();
    return `stats-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function dateKeyFor(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return `stats-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
    });
  }

  function setSettings(partial) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(partial, resolve);
    });
  }

  function getTodayStats() {
    const key = todayKey();
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => {
        resolve(res[key] || { count: 0, timeMs: 0, overrides: 0 });
      });
    });
  }

  function getStatsFor(offsetDays) {
    const key = dateKeyFor(offsetDays);
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => {
        resolve(res[key] || { count: 0, timeMs: 0, overrides: 0 });
      });
    });
  }

  function saveTodayStats(stats) {
    const key = todayKey();
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: stats }, resolve);
    });
  }

  async function incrementCount(n = 1) {
    const stats = await getTodayStats();
    stats.count += n;
    await saveTodayStats(stats);
    return stats;
  }

  async function addTime(ms) {
    const stats = await getTodayStats();
    stats.timeMs += ms;
    await saveTodayStats(stats);
    return stats;
  }

  async function incrementOverride() {
    const stats = await getTodayStats();
    stats.overrides = (stats.overrides || 0) + 1;
    await saveTodayStats(stats);
    return stats;
  }

  async function resetAllStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (all) => {
        const keysToRemove = Object.keys(all).filter((k) => k.startsWith("stats-"));
        chrome.storage.local.remove(keysToRemove, resolve);
      });
    });
  }

  function getLastLeftAt() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["rsLastLeftAt"], (res) => resolve(res.rsLastLeftAt || 0));
    });
  }

  function setLastLeftAt(timestamp) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ rsLastLeftAt: timestamp }, resolve);
    });
  }

  return {
    DEFAULT_SETTINGS,
    todayKey,
    dateKeyFor,
    getSettings,
    setSettings,
    getTodayStats,
    getStatsFor,
    saveTodayStats,
    incrementCount,
    addTime,
    incrementOverride,
    resetAllStats,
    getLastLeftAt,
    setLastLeftAt,
  };
})();
