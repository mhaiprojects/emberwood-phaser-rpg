# Game Engine V1 ↔ GameWorld contract

Phaser **3.90** + Vue CDN, **no bundler**. Scripts load via `index.html` with `?v=` cache-bust.

| Path | Role |
|------|------|
| `js/core/` | Engine: `Balance`, `GameDataPack`, `ContentRegistry`, `Content` API, controllers, SettingsRegistry |
| `js/world/` | MapGen algorithms, Pathfind, clock, combat helpers, peels |
| `js/data/` | Inventory/skills/XP/shop APIs (no content tables) |
| `js/scenes/` | Boot → Title → World / Battle |
| `GameWorld/emberwood/` | Emberwood pack: all JSON + `assets/` |

## GameDataPack

- Default pack: **`emberwood`** under `GameWorld/emberwood/`.
- Override: `?pack=other` or `window.EMBERWOOD_PACK = 'other'`.
- All art/JSON URLs: `GameDataPack.url(rel)` / `assetUrl(rel)` (pack-relative).
- DOM icons: `data-pack-src="assets/…"` rewritten at Boot / main via `rewriteDomAssets`.
- Saves: `pack.saveKey` (legacy keys listed in `pack.json`).

## Boot load

1. Resolve active pack.
2. Wave A: `pack.json` + every `pack.files` JSON → `ContentRegistry.applyPack` → Content API.
3. Wave B: art from `art-manifest.json` + `ITEM_DB` icons.
4. Title.

## Content API (`js/core/Content.js`)

Prefer `Content.getItem`, `getZone`, `getMobDefs`, `safeZonePolicy`, `zoneHasFeature`, `biomeParams`, `getQuest`, `assetUrl` over raw globals when adding engine code.

## Pack checklist (`GameWorld/{id}/`)

- [ ] `pack.json` (id, title, version, saveKey, files map, defaultZoneId)
- [ ] items / shops / recipes / gather-by-zone / loot / zones / npcs / zone-mobs
- [ ] skills / mob-scales / mob-combat / hero-defaults / art-manifest
- [ ] quests / biome-params
- [ ] `map/dimensions.json` + `map/props.json` + `map/specials.json`
- [ ] `assets/` tilesheet matching engine `TILE` indices (+ svg trees)
- [ ] Feature specials for safe zones / dungeon / den (or expect missing features)

## Engine vs pack

- **Engine:** TILE enum, MapGen algorithms, combat/gather controllers, pathfind, Hud DOM structure, Content façade.
- **Pack:** all numbers/names/coords/dialogue/art, biome densities, mob combat tables, safe-zone policies.

## Non-goals

No bundler/TypeScript. Mid-session pack switch unsupported. Testing disabled until re-enabled.
