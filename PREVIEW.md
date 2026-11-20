# GTA 6 Trophy Guide - Preview

## Project Overview
Offline static guide for all 55 official PS5 trophies in Grand Theft Auto VI (released Nov 19, 2026). Built for make.fun competition `gta6-trophy-guide-01`.

## Files Structure
```
makefun-gta6-trophy-guide-01/
├── main.ts                    # Build script (Node 22, stdlib only)
├── vendor/makefun-frontend.ts # make.fun dossier library (from kit, unmodified)
├── app/
│   ├── index.html             # Main page
│   ├── app.js                 # App logic (ES module, offline)
│   ├── styles.css             # Dark theme styling
│   └── data/trophies.json     # 55 trophies with guides & sources
└── screenshots/               # 4 PNG captures
    ├── 1-list.png             # Main trophy list (all 55)
    ├── 2-detail.png           # Platinum trophy detail view
    ├── 3-roadmap.png          # Roadmap to platinum (6 phases)
    └── 4-missable.png         # Missable-only filter view
```

## Trophy Data
- **55 trophies** verified from Exophase, GTABase, Insider Gaming, GTA6 Field Guide, Gamers Together, Push Square (Nov 2026)
- Breakdown: 1 Platinum, 3 Gold, 10 Silver, 41 Bronze
- Types: 13 Story, 26 Side, 10 Collection, 6 Stunt
- 8 missable trophies (Strangers & Freaks strands)
- Each trophy has: exact name, official description, grade, type, missable flag, hidden flag, custom guide, source URL

## App Features (all offline, zero network requests)
- ✅ Complete 55-trophy checklist with localStorage persistence
- ✅ Export/import progress as JSON
- ✅ Filters: grade (Platinum/Gold/Silver/Bronze), type (Story/Side/Collection/Stunt), missable only
- ✅ Spoiler toggle: hides story trophy details until earned
- ✅ Detail view per trophy with guide & source link
- ✅ Roadmap to platinum (6 phases, 55 trophies organized)
- ✅ Progress bar: count + percentage
- ✅ Deep-link hashes: `#trophy=<slug>`, `#roadmap`, `#missable`, `#demo-progress`
- ✅ Dark theme, responsive, system fonts only

## Screenshots
| File | View | Size |
|------|------|------|
| 1-list.png | Main list (all 55 trophies visible) | 38.8 KB |
| 2-detail.png | Platinum trophy "Vice Got a Price!" detail | 39.4 KB |
| 3-roadmap.png | 6-phase roadmap to platinum | 58.2 KB |
| 4-missable.png | Missable-only filter (8 trophies) | 45.1 KB |

All screenshots captured via headless browser with full JS rendering, distinct content verified by SHA256.

## Dossier
- **Schema**: makefun/dossier/v1
- **Images**: 4 (max 4, each < 256 KB)
- **Text**: ~48.5 KB (max 163.8 KB)
- **App files**: 4 source + 1 vendored + 0 assets = well under caps

## Build & Test
```bash
# Build output to ./out
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

# Serve locally
node serve.ts  # http://localhost:8080
```

## Verification Checklist
- [x] 55 trophies with exact names & official sources
- [x] Custom guides written in own words (not copied)
- [x] Zero external network requests (only local fetch of trophies.json)
- [x] localStorage persistence works
- [x] Export/import JSON works
- [x] All filters functional
- [x] Spoiler toggle works
- [x] Deep-link hashes work
- [x] 4 distinct screenshots captured
- [x] main.ts builds dossier.json successfully
- [x] dossier.json validates (schema, caps)
- [x] All screenshots < 256 KB each
- [x] Total dossier < 4 MB
- [x] No Rockstar logos/artwork (compliance)

## Sources
1. Exophase: https://exophase.com/game/grand-theft-auto-vi/
2. GTABase: https://gtabase.com/guides/gta-6-trophies/
3. Insider Gaming: https://www.insider-gaming.com/gta-6-trophy-list/
4. GTA6 Field Guide: https://gta6fieldguide.com/trophies
5. Gamers Together: https://gamerstogether.cz/en/gta-6-trophies-achievements/
6. Push Square: https://www.pushsquare.com/news/2026/11/gta-6-ps5-trophies-revealed-100percent-completion-needed-for-the-platinum

## Next Steps for FASE 2
1. Push to GitHub (repo: maxinung/gta6-trophy-guide-01)
2. Create bundle: `node cli/makefun.mjs bundle ...`
3. Submit via API using lucky-otter-66 account