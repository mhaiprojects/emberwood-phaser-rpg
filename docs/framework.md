# Emberwood framework contract

Phaser **3.90** + Vue CDN, **no bundler**. Scripts load via `index.html` with `?v=` cache-bust. **Content packs** live under `game-data/{packId}/`; `js/` is engine only.

## Layout

| Path | Role |
|------|------|
| `js/core/` | Engine: `Balance`, `GameDataPack`, `ContentRegistry`, `GatherController`, `SettingsRegistry` |
| `game-data/game1/` | Emberwood pack: JSON tables + `assets/` (tiles, SVGs, sprites) |
| `js/world/` | Map/path/combat/clock + peels |
| `js/data/` | Logic APIs over content globals (`Items.js`, `Scales.js`, `Save.js`) |
| `js/scenes/` | Boot → Title → World / Battle |

## GameDataPack

- Default pack: `game1` (`game-data/game1/`).
- Override: `?pack=game2` or `window.EMBERWOOD_PACK = 'game2'` before scripts run.
- All art/JSON URLs: `GameDataPack.url(rel)` / `assetUrl(rel)` (pack-relative, e.g. `assets/svg/items/coins.svg`).
- Saves: `pack.saveKey` (legacy `emberwood-save-v1` migrated once).

## Boot load

1. Resolve active pack.
2. Wave A: `pack.json` + every `pack.files` JSON → `ContentRegistry.applyPack`.
3. Wave B: art from `art-manifest.json` + `ITEM_DB` icons.
4. Title.

## Pack checklist (`game-data/game2/`)

- [ ] `pack.json` (id, title, version, saveKey, files map)
- [ ] items / shops / recipes / gather-by-zone / loot / zones / npcs / zone-mobs
- [ ] skills / mob-scales / hero-defaults / art-manifest
- [ ] `map/dimensions.json` + `map/props.json`
- [ ] `assets/` tilesheet matching engine `TILE` indices (+ svg/items|mobs|npcs|skills|ui)
- [ ] Same zone ids used by WorldScene special cases **or** expect code changes

## Engine vs pack

- **Engine:** TILE enum, MapGen algorithms, combat/gather controllers, pathfind, Hud DOM structure.
- **Pack:** all numbers/names/coords/dialogue/art. MapGen prop tables are filled from `map/props.json` at Boot.

## Non-goals

No bundler/TypeScript. Mid-session pack switch unsupported. Testing disabled until re-enabled.
