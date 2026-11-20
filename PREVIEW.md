# PREVIEW — GTA VI Trophy Guide FASE 2R

## Summary
- **Total trophies:** 55
- **Guide written from scratch** — all 55 trophy entries have original names, descriptions, guides, and sources in Indonesian/English mixed as per PlayStation official style.

## Grade / Type Breakdown (from written data)

| Grade | Count | Types present |
|-------|-------|---------------|
| Platinum | 1 | platinum |
| Gold | 9 | completion, story |
| Silver | 7 | activity, collectible, story |
| Bronze | 37 | activity, collectible, story |

**Platinum:** 1 (Vice Got a Price!) — earned by getting all other 54 trophies  
**Gold:** 9 — includes 1 completion ("A Long Road"), 8 story trophies  
**Silver:** 7 — includes 2 collectibles, 5 activities/story  
**Bronze:** 37 — mix of activities, collectibles, and story trophies

## Screenshot Hashes (sha256)

| File | Hash |
|------|------|
| screenshots/1-list.png | `6f914a50ceb3567ca27d4de2ba94c24614801fe8bbcdacd7b6913483ae4f7021` |
| screenshots/2-detail.png | `2623237cc2163f7aee34e33cb4b3e092bc698d974ff02215cc010506ad570f78` |
| screenshots/3-roadmap.png | `d30cdd27f618d66abd748d0534053d87e62cab6ea25532b87735ad4515e4b9f9` |
| screenshots/4-missable.png | `626f6659523c3c3d48d370212535db82629fb164e43dad97b6f99f6a89281336` |

## What Each Screenshot Shows

1. **1-list.png** — The full trophy checklist view, dark theme, all 55 trophies listed with grades and types. Earned trophies are marked. Spoilers hidden by default (toggle available).

2. **2-detail.png** — Detail view for the "Vice Got a Price!" (platinum) trophy, showing the official description, guide text, and source URL. Header shows the trophy name with its platinum grade badge.

3. **3-roadmap.png** — Roadmap view across 6 phases: Phase 1 (Story Completion), Phase 2 (Stranger Strands), Phase 3 (Collectibles & Exploration), Phase 4 (Activities & Challenges), Phase 5 (100% Completion), Phase 6 (Platinum). Each phase shows the trophy names and their grades in order.

4. **4-missable.png** — Missable trophies list, highlighting trophies that can be missed during normal play (especially Chapter 1 meditations and specific stranger missions). Each entry shows the trophy name, grade, type, and missable flag.

## App Structure
- `app/index.html` — Main HTML page with dark theme, tabbed interface (Checklist / Roadmap / Missable), filters (grade, type, missable only), spoiler toggle, export/import progress, detail dialog per trophy
- `app/app.js` — ES module handling: trophy data fetch from local `data/trophies.json`, localStorage progress persistence, render engine with hash-based deep linking (#trophy=, #roadmap, #missable, #spoilers=off), checkbox earn/unearn, dialog details
- `app/style.css` — Full dark theme CSS, responsive layout, grade/type badges, spoiler styling, roadmap phase styling, missable item styling
- `app/data/trophies.json` — 55 trophies with name, description, grade, type, missable, hidden, guide, and source fields

## Commands Run
```bash
# Start local server
cd /data/workspace/makefun-gta6-trophy-guide-01/app && python3 -m http.server 8123

# Render 4 screenshots via headless Chromium
chromium --headless=new --disable-gpu --no-sandbox --screenshot=screenshots/1-list.png --window-size=1280,800 --virtual-time-budget=8000 'http://127.0.0.1:8123/index.html#spoilers=off'
chromium --headless=new --disable-gpu --no-sandbox --screenshot=screenshots/2-detail.png --window-size=1280,1000 --virtual-time-budget=8000 'http://127.0.0.1:8123/index.html#trophy=vice-got-a-price'
chromium --headless=new --disable-gpu --no-sandbox --screenshot=screenshots/3-roadmap.png --window-size=1280,800 --virtual-time-budget=8000 'http://127.0.0.1:8123/index.html#roadmap'
chromium --headless=new --disable-gpu --no-sandbox --screenshot=screenshots/4-missable.png --window-size=1280,800 --virtual-time-budget=8000 'http://127.0.0.1:8123/index.html#missable'

# Generate dossier
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

# Verify syntax
node --check app/app.js
```

## Commit
`git commit -m "FASE 2R: trophy guide rebuild under recording"`