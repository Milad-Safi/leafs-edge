# Focus Blocker

A lightweight Chrome extension I createrd to help me eliminate distractions by blocking selected websites and hiding short form entertainment (Shorts, Reels)

Built using Chrome Manifest V3 and the declarativeNetRequest API for fast, native-level blocking without background scripts.

---

## Overview

Focus Blocker allows users to define a personalized blocklist of distracting websites (e.g. Reddit, TikTok, Instagram) and enforces those rules directly at the browser level.  
The extension prioritizes simplicity, performance, and reliability, making it ideal for daily productivity use.

All settings are persisted using Chrome Sync, allowing preferences to carry across devices.

---

## Core Features

- **Website Blocking**
  - Block any domain using Chrome’s `declarativeNetRequest` API
  - Blocks apply to main-frame navigation (prevents page loads entirely)

- **Quick Presets**
  - One-click blocking for common distractions:
    - Reddit
    - TikTok
    - Instagram
    - Twitch

- **YouTube Shorts Removal**
  - Optional toggle to hide YouTube Shorts via a content script
  - Reduces short-form distraction without blocking YouTube entirely

- **Persistent Settings**
  - Uses `chrome.storage.sync` to save preferences
  - Settings sync automatically across Chrome profiles

- **Minimal UI**
  - Simple popup interface for adding/removing domains
  - No unnecessary permissions or background workers

---

## How It Works

1. User adds a domain to the blocklist in the popup UI
2. Domain is normalized (protocol, paths, and `www` removed)
3. A dynamic blocking rule is generated:
   - `action: block`
   - `resourceTypes: ["main_frame"]`
   - `urlFilter: ||domain^`
4. Rules are registered via `declarativeNetRequest`
5. Navigation to blocked domains is immediately prevented

YouTube Shorts hiding is handled separately using a content script that removes Shorts-related DOM elements.

---

## Tech Stack

- **Chrome Extension**
  - Manifest V3
  - `declarativeNetRequest`
  - `chrome.storage.sync`

- **Frontend**
  - Vanilla JavaScript
  - HTML + CSS (popup UI)

---

## Project Structure

focus-blocker/
├── manifest.json # Extension configuration & permissions
├── popup.html # Popup UI
├── popup.css # Popup styling
├── popup.js # UI logic + rule management
├── content_youtube.js # Hides YouTube Shorts
└── icons/ # Extension icons


---

## Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `focus-blocker/` directory

The extension will now be active in your browser.

---

## Permissions Explained

- `declarativeNetRequest` — required to block websites at the network level
- `storage` — save user preferences
- `host_permissions: <all_urls>` — allows blocking across all domains

No background scripts or external services are used.

## Future Improvements

- Scheduling focus sessions
- Temporary unblock timers
- Cross-browser support (Firefox)
- Design Upgrades

