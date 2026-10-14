// background.js — minimal service worker.
// Keeps an alarm so old stats keys don't grow forever (trims anything older
// than 30 days), and sets sane defaults on first install.

const KEEP_DAYS = 30;

chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    scrollLimit: 20,
    cooldownMinutes: 5,
    enabledInstagram: true,
    enabledYoutube: true,
  };
  chrome.storage.sync.get(defaults, (items) => {
    chrome.storage.sync.set(items);
  });
  chrome.alarms.create("rs-cleanup", { periodInMinutes: 60 * 12 });
  cleanupOldStats();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "rs-cleanup") cleanupOldStats();
});

function cleanupOldStats() {
  chrome.storage.local.get(null, (all) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS);

    const toRemove = Object.keys(all).filter((key) => {
      const m = key.match(/^stats-(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return false;
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return d < cutoff;
    });

    if (toRemove.length) chrome.storage.local.remove(toRemove);
  });
}
