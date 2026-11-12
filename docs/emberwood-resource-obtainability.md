# Emberwood resource obtainability

**Saved in-repo:** `docs/emberwood-resource-obtainability.md`  
**Source of truth:** `js/data/Items.js`, `js/world/MapGen.js`, `js/world/Zones.js`, `js/data/Scales.js`  
**Design plan:** [`.cursor/plans/resource-locks-inventory.plan.md`](../.cursor/plans/resource-locks-inventory.plan.md)  
**Last refreshed:** 2026-11-12 (post resource-locks execute)

## Parallel ladders (Wood + 4)

| Step | Metal | Wood | Rune | Fish | toolTier |
|------|-------|------|------|------|----------|
| 1 Wood | — | `logs` | — | `rawshrimp` | 1 |
| 2 Copper | copper / `copperbar` | `oaklogs` | `airrune` | `rawtrout` | 2 |
| 3 Iron | iron / `ironbar` | `ashlogs` | `waterrune` | `rawlobster` | 3 |
| 4 Diamond | `diamondore` / `diamondbar` | `yewlogs` | `earthrune` | `rawswordfish` | 4 |
| 5 Dragonite | `dragoniteore` / `dragonitebar` | `magiclogs` | `firerune` | `rawshark` | 5 |

**Removed:** tin, bronze/alloys, mind rune, nature rune, burnt foods, helm/body/legs (single `armour` slot).

## Craft rules

| Product | Inputs |
|---------|--------|
| Armour | string + leather + hard mat (logs or bar) |
| Melee | tier wood + tier metal |
| Bow | tier wood + string |
| Staff | tier wood + tier rune |
| Arrows ×10 | tier wood + tier metal (+ feather) |

## Zone gather (ore / trees / fish)

| Zone | Ore | Trees | Fish |
|------|-----|-------|------|
| haven, millfields | copper | logs | shrimp |
| southshore | copper | logs | shrimp |
| mire, northwood | copper/iron | oak | trout |
| graves, westmead | copper/iron | ash | trout / lobster |
| darkmine | diamond+essence (+ore ladder) | yew | lobster |
| highlands | diamond (+rare dragonite) | yew | swordfish |
| dungeon | rare by floor | — | swordfish |
| dragonden | dragonite/diamond | magic | shark |

Min tool tiers: see `RESOURCE_TOOL_TIER` in `Items.js`. Higher tools always work. Den boulder needs diamond pick (tier 4).

## Mob drops (always meat + ≥1 other + bones/coins)

See `lootForMob` in `Scales.js`. Clue scrolls: rare kill drop + genie grant.

## Saves

`LEGACY_ITEM_ID_MAP` + `migrateLegacyHeroItems` remap bronze/tin/mind/nature/old plate pieces on load.
