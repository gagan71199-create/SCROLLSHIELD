// popup.js — renders today's stats, a 7-day bar chart, and settings form.

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function renderStats() {
  const today = await RS.getTodayStats();
  document.getElementById("today-count").textContent = today.count || 0;
  document.getElementById("today-time").textContent = Math.round((today.timeMs || 0) / 60000);
  document.getElementById("today-overrides").textContent = today.overrides || 0;
}

async function renderChart() {
  const chartEl = document.getElementById("chart");
  chartEl.innerHTML = "";

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const stats = await RS.getStatsFor(i);
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ count: stats.count || 0, label: DAY_LABELS[d.getDay()] });
  }

  const max = Math.max(1, ...days.map((d) => d.count));

  days.forEach((d) => {
    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    const pct = Math.max(4, Math.round((d.count / max) * 100));
    bar.style.height = pct + "%";
    bar.title = `${d.count} reels`;

    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = d.label;

    wrap.appendChild(bar);
    wrap.appendChild(label);
    chartEl.appendChild(wrap);
  });
}

async function renderSettings() {
  const s = await RS.getSettings();
  document.getElementById("scrollLimit").value = s.scrollLimit;
  document.getElementById("cooldownMinutes").value = s.cooldownMinutes;
  document.getElementById("enabledInstagram").checked = s.enabledInstagram;
  document.getElementById("enabledYoutube").checked = s.enabledYoutube;
  document.getElementById("showQuotes").checked = s.showQuotes;
}

function showSaveMsg(text) {
  const el = document.getElementById("save-msg");
  el.textContent = text;
  setTimeout(() => (el.textContent = ""), 2000);
}

document.getElementById("save-btn").addEventListener("click", async () => {
  const scrollLimit = Math.max(3, Math.min(200, Number(document.getElementById("scrollLimit").value) || 20));
  const cooldownMinutes = Math.max(1, Math.min(60, Number(document.getElementById("cooldownMinutes").value) || 5));
  const enabledInstagram = document.getElementById("enabledInstagram").checked;
  const enabledYoutube = document.getElementById("enabledYoutube").checked;
  const showQuotes = document.getElementById("showQuotes").checked;

  await RS.setSettings({ scrollLimit, cooldownMinutes, enabledInstagram, enabledYoutube, showQuotes });
  showSaveMsg("Settings saved ✓");
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  await RS.resetAllStats();
  showSaveMsg("Stats reset ✓");
  renderStats();
  renderChart();
});

renderStats();
renderChart();
renderSettings();
