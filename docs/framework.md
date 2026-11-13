# Emberwood framework contract

Phaser **3.90** + Vue CDN, **no bundler**. Scripts load via `index.html` with `?v=` cache-bust. Content is data; `js/core` + shared pipelines are the engine.

## Layout

| Path | Role |
|------|------|
| `js/core/` | Engine adapters: `Balance`, `ContentRegistry`, `GatherController`, `SettingsRegistry` |
| `js/content/` | JSON tables + `*-data.js` sync globals (items, shops, recipes, gather-by-zone, zones, NPCs, mob roster, loot) |
| `js/world/` | Map/path/combat/clock + thin peels (`ZoneRuntime`, `EntitySpawner`, `InteractionRouter`, `WorldPersist`) |
| `js/data/` | Logic APIs over content globals (`Items.js`, `Scales.js`, `Save.js`) |
| `js/scenes/` | Boot → Title → World / Battle |
| `js/game/` | Reserved for Emberwood-specific glue |

## Load order (simplified)

1. CDN (Vue, Phaser)
2. `Balance` + `ContentRegistry` + `SettingsRegistry`
3. **Content `*-data.js`** (fills `ITEM_DB`, shops, recipes, zones, NPCs, roster, loot)
4. `Items.js` / `Save` / `Scales` (APIs; empty stubs if content missing)
5. Hud → MapGen → Pathfind → CombatController → **GatherController** → GameClock → zone peels → Zones
6. Boot loads `balance.json` → `ContentRegistry.applyFromScene` → Title → World

Boot still iterates `ITEM_DB` for SVG preload, so content scripts must run **before** Boot.

## Core vs content

**Swap for a second game skin:** `js/content/*` + art under `assets/`, keep `js/core`, pathfind, GameClock, CombatController, GatherController.

**Content-pack checklist**

- [ ] `items.json` / `items-data.js` (+ SVG icons)
- [ ] `shops.json`, `recipes.json`, `gather-by-zone.json`
- [ ] `zones.json` (grid + biome + seed)
- [ ] `npcs.json` (dialogue / shop keys)
- [ ] `zone-mobs.json` — use `spotLevels` / `attackRangeBySpot` (not live functions)
- [ ] `loot.json` (`byType`, `clueChance`)
- [ ] `balance.json` tunables
- [ ] MapGen biome/prop hooks if new terrain
- [ ] Bump `?v=` on touched scripts in `index.html`

## Pipelines

- **Combat:** `CombatController` intent → WorldScene chase/swing → `OverworldCombat`
- **Gather:** click/scenery on WorldScene → `GatherController.startTimed` / `tick` / `hardFail` → domain finish in Items helpers
- **Settings:** add a toggle to `SettingsRegistry.entries` (id, heroKey, dataAttr, label) — Hud click/render + `normalizeHero` share one declaration
- **Balance:** edit `js/content/balance.json`; Boot applies via `Balance.apply`

## Data rules (serialize-friendly)

Zone mob extras that used to be functions:

- `spotLevels: { "tx,ty": level }` → adapter builds `levelFor`
- `attackRangeBySpot: { "tx,ty": tiles }` → adapter builds `attackRangeFor`

## Non-goals (for now)

No bundler/TypeScript. No big-bang Hud rewrite. Automated tests stay disabled until re-enabled.
