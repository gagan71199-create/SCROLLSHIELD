# Reels Stopper — Break the Scroll

A Chrome extension (Manifest V3) that limits mindless scrolling on **Instagram Reels** and **YouTube Shorts**. It counts how many reels you scroll through, tracks time spent, and blocks the feed with a cooldown + reflection prompt once you hit your limit.

## Features
- Detects when you're inside Reels (`instagram.com/reels`) or Shorts (`youtube.com/shorts`)
- Counts each scroll/swipe/keypress as one "reel" (debounced so one swipe = one count)
- Tracks time spent per day
- Blocks further scrolling with a full-screen overlay once your limit is hit
- Cooldown timer before you can continue
- "Reflection override": write 15+ characters explaining why you need to keep going, and you get 5 more reels unlocked immediately (adds friction instead of a hard ban)
- Popup dashboard: today's reel count, minutes spent, override count, and a 7-day bar chart
- Configurable limit, cooldown length, and per-platform on/off toggles
- Daily stats auto-clean after 30 days

## How to install (Developer Mode)
1. Unzip this project somewhere on your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `reels-stopper` folder.
5. The extension icon should appear in your toolbar.
6. Visit `instagram.com/reels` or `youtube.com/shorts` and start scrolling — click the toolbar icon anytime to see your stats.

## How it works (architecture)
```
manifest.json     -> extension config, permissions, content script registration
storage.js         -> shared chrome.storage helpers (settings + daily stats), loaded first
content.js          -> injected into IG/YT pages: detects reels, counts scrolls,
                        tracks time, renders the blocking overlay
overlay.css          -> styling for the full-screen block overlay
background.js       -> service worker: sets defaults on install, cleans old stats
popup.html/.css/.js  -> toolbar popup dashboard (stats, chart, settings)
icons/               -> extension icons
```

## Customizing for your project report
Good things to mention/demo:
- **Detection logic**: uses `wheel`, `touchend`, and `keydown` events with a 450ms debounce so one swipe/scroll only counts once, plus a URL-change watcher as a backup signal for YouTube Shorts.
- **Data model**: daily stats stored under `stats-YYYY-MM-DD` keys in `chrome.storage.local`, settings in `chrome.storage.sync` (syncs across signed-in Chrome devices).
- **Behavioral design choice**: instead of a hard, permanent block, the extension uses a *cooldown + reflection* pattern — research on digital wellbeing tools shows friction-based nudges are less likely to be immediately disabled than hard blocks.

## Possible extensions (stretch goals)
- Add TikTok web support (same wheel/touch detection pattern, different URL match)
- Adaptive limit that tightens automatically if the user overrides often
- Time-of-day rules (stricter at night)
- Export stats as CSV/JSON from the popup
