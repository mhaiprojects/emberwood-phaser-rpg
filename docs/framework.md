# Game Engine V1 ↔ GameWorld contract

Phaser **3.90** + Vue CDN, **no bundler**. Scripts load via `index.html` with `?v=` cache-bust.

| Path | Role |
|------|------|
| `js/core/` | Engine: `Balance`, `GameDataPack`, `ContentRegistry`, `Content` API, `GatherController`, `SettingsRegistry` |
| `js/world/` | MapGen algorithms, Pathfind, GameClock, CombatController, combat helpers, peels |
| `js/data/` | Inventory/skills/XP/shop APIs (no content tables) |
| `js/scenes/` | Boot → Title → World / Battle / GameOver |
| `js/ui/` | Hud façade, HudApp Vue mirror, Sfx |
| `GameWorld/{packId}/` | One folder = one game: all JSON + `assets/` |

## North star

Swapping `GameWorld/emberwood` for another valid pack boots a different game without editing combat, pathfind, or gather controller code.

## GameDataPack

- Default pack: **`emberwood`** under `GameWorld/emberwood/`.
- Override: `?pack=other` or `window.EMBERWOOD_PACK = 'other'`.
- All art/JSON URLs: `GameDataPack.url(rel)` / `assetUrl(rel)` (pack-relative).
- DOM icons: `data-pack-src="assets/…"` rewritten at Boot / main via `rewriteDomAssets`.
- Saves: `pack.saveKey` (legacy keys listed in `pack.json`). Never share one localStorage key across packs.

## Boot load (two-wave)

1. Resolve active pack (`?pack=` / `EMBERWOOD_PACK` / default).
2. **Wave A:** `pack.json` + every `pack.files` JSON → validate all present (loud fail) → `ContentRegistry.applyPack` → Content API → `rewriteDomAssets`.
3. **Wave B:** art from `art-manifest.json` + every `ITEM_DB` icon.
4. Walk anims → Title (`document.title` from pack) → World generates maps via MapGen.

Missing `pack.files` entries **fail loudly** on the Boot bar; they do not silently boot an empty world.

## Content API (`js/core/Content.js`)

Prefer these over raw globals when adding engine code:

| API | Purpose |
|-----|---------|
| `GameDataPack.getActive()` / `assetUrl` / `saveKey` | Pack identity and URLs |
| `Content.getMeta()` / `defaultZoneId` / `defaultQuestId` | Title, defaults |
| `Content.getItem` / `allItems` / `itemIcon` | Item DB |
| `Content.getZone` / `listZones` | World meta |
| `Content.listNpcs` / `getNpc` | Spawn + dialogue |
| `Content.getMobDefs` / `lootForMob` | Spawns + drops |
| `Content.getRecipe` / `getShop` | Stations / trade |
| `Content.gatherSpec` | Resource rows + gates |
| `Content.getBalance` | Tunables |
| `Content.getMobCombat` | Combat numbers by type |
| `Content.mapProps` / `mapSpecials` / `biomeParams` | Generation + policies |
| `Content.policy.safeZone` / `safeZonePolicy` | Injected into pathfind / mob AI |
| `Content.getQuest` / `applyNpcQuestTalk` / `journalSteps` | Quest stage machine |
| `Content.getArtManifest` | Boot Wave B |

## Range metrics (keep distinct)

| Metric | Meaning | Source |
|--------|---------|--------|
| Weapon range | Euclidean px for melee/ranged hit | item / combat helpers |
| Auto-acquire | Chebyshev tiles (`hero.autoAttackRange`) | Settings + Balance |
| Mob aggro | px from `balance.combat.mobAggroRangePx` | `balance.json` |
| Gather / station reach | `interact.fishRangePx` / `stationRangePx` | `balance.json` |

## SettingsRegistry

One declaration drives UI control, hero field, normalize, and persist. Avoid paired click/render handlers per toggle.

## Engine vs pack

- **Engine:** TILE enum + collide/walk sets, MapGen algorithms, combat/gather controllers, pathfind, Hud DOM shell, Content façade, Save schema.
- **Pack:** all numbers/names/coords/dialogue/art, biome densities, mob combat tables, safe-zone policies, quests, balance caps/XP curve.

`TILE` sheet is an engine contract — packs ship a matching tilesheet (full atlas remapping is out of V1 scope).

## Pack checklist (`GameWorld/{id}/`)

A new pack must provide:

- [ ] `pack.json` with unique `id`, `saveKey`, `defaultZoneId`, `defaultQuestId`, and complete `files` map
- [ ] `balance.json` (move/combat/regen/interact/gather/craft/**caps**/**xp** curve)
- [ ] `items.json` / `shops.json` / `recipes.json` (smelt/smith/craft + **altarRunes** + **itemCombos**)
- [ ] `gather-by-zone.json` (levels, tools, trees/fish, **tileBindings**, **oreByZone**)
- [ ] `loot.json` / `zones.json` (include `gx`/`gy`/`short` for minimap) / `npcs.json` (**tutorGift** per tutor)
- [ ] `zone-mobs.json` (serialize-friendly level rules — **no functions**)
- [ ] `skills.json` (SKILL_NAMES, EQUIP_SLOTS, **slayer** config)
- [ ] `mob-scales.json` / `mob-combat.json` (ranges, poison, **statsByType**, **MOB_TIER_ORDER**)
- [ ] `hero-defaults.json` / `spells.json` / `clues.json` / `onboarding.json` / `legacy-migrations.json`
- [ ] `quests.json` (stages, `mobType`, `completeHint`, journal)
- [ ] `biome-params.json` / `art-manifest.json`
- [ ] `map/dimensions.json` + `map/props.json` (station/`shopStall` keys) + `map/specials.json` (features) + `map/interiors.json`
- [ ] `assets/` tilesheet matching engine `TILE` indices + SVG/png under `assets/svg/`
- [ ] Same **system kinds** the engine implements (or accept missing features)

Clone `GameWorld/emberwood/` as a starting point; change `id`/`saveKey`/tables/art.

Engine JS may keep **empty stubs** and algorithms; **definitions** belong in the pack. Boot fails loudly if any `pack.files` entry is missing.

## Non-goals (V1)

- Bundler, TypeScript, or npm app packaging
- Fully data-driven TILE atlas remapping
- Hand-authored tilemaps as primary world format
- Mid-session pack switching
- Merging turn-based Battle with overworld combat
- Automated suite proof while testing is disabled (human playtest gates)

## Definition of done

- Engine has **no** item/mob/zone content tables and **no** hard-coded art paths.
- Sample pack defines a playable loop: move, fight, gather, shop/bank, save/load.
- Feature flags and safe zones come from pack policies.
- Balance and biome densities editable in JSON without touching MapGen/combat controllers.
- A second empty/invalid pack fails at Boot with clear errors; a valid second pack boots without engine source edits.
