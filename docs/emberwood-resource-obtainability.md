# Emberwood resource obtainability

**Saved in-repo:** `docs/emberwood-resource-obtainability.md`  
**Source of truth:** live game data in `js/data/Items.js`, `js/world/MapGen.js`, `js/world/Zones.js`, `js/data/Scales.js`, and station use in `js/scenes/WorldScene.js` / `js/ui/Hud.js`  
**Last refreshed:** 2026-11-11

How major Emberwood resources are obtained today — gathering zones, crafting/smelting/smithing, shops, mob drops, altars, and tutors. Invented content is omitted; if a path is not listed, it is not wired in code.

---

## Quick map (nine lands)

| Zone id | Name | Gathering / craft relevance |
|---------|------|-----------------------------|
| `haven` | Emberhaven | Range, anvil, furnace, craft stall, Mira + Cole shops, bank, air altar, chickens |
| `northwood` | Northwood | Oak trees (WC 15), goblins |
| `millfields` | Millfields | Normal logs, cows (beef + hide), earth altar |
| `southshore` | Southshore | Fishing spots (raw shrimp), water altar, crabs |
| `darkmine` | Darkmine | Dedicated ore nodes (copper–dragonite + rune essence), bats, dungeon shaft |
| `westmead` | Westmead | Normal logs, rabbits (fur), goblins |
| `highlands` | Windrock Highlands | Yew trees (WC 40), mixed rocks (incl. diamond/iron), fire altar, Dragon Den gate |
| `graves` | Restless Graves | Magic trees (WC 60), mixed rocks, mind altar, skeletons |
| `mire` | Mirefen | Oak trees (WC 15), nature altar, slimes |

Hidden: `dungeon` (Endless Dungeon from Darkmine — combat, not ore nodes) and `dragonden` (after diamond-pick boulder clear).

---

## Level gates (`RESOURCE_LEVEL`)

| Resource | Skill | Need |
|----------|-------|------|
| Logs | Woodcutting | 1 |
| Oak logs | Woodcutting | 15 |
| Yew logs | Woodcutting | 40 |
| Magic logs | Woodcutting | 60 |
| Copper / tin / rune essence | Mining | 1 |
| Iron ore | Mining | 15 |
| Diamond ore | Mining | 40 |
| Dragonite ore | Mining | 60 |

Failure chat: `You need level N.`

---

## Gathering

### Fishing (Southshore)

- **Where:** three fish spots at tiles `(16,24)`, `(20,24)`, `(24,23)` (`SHORE_PROPS.spots`).
- **Tool:** small fishing net (`net`). Timed 3–5s cast; success chance scales with Fishing level.
- **Catch:** `rawshrimp` + Fishing XP (10).
- **Also:** crabs drop `rawshrimp`.

### Woodcutting (any overworld TREE)

- **Tool:** any axe (`tool: 'axe'`); starter includes bronze axe.
- **By zone (`TREE_BY_ZONE`):**

| Zone(s) | Log | WC need |
|---------|-----|---------|
| haven, millfields, westmead, southshore, darkmine | `logs` | 1 |
| northwood, mire | `oaklogs` | 15 |
| highlands | `yewlogs` | 40 |
| graves | `magiclogs` | 60 |

- Tree depletes → respawns (~12s). XP: base 10 + (need level − 1).
- Not available in the Endless Dungeon.

### Mining

- **Tool:** any pickaxe; starter includes bronze pick.
- **Darkmine** uses fixed nodes (`MINE_PROPS`):

| Ore | Example tiles |
|-----|----------------|
| copper | (14,16), (15,20) |
| tin | (16,16), (17,20) |
| iron | (22,16), (24,20) |
| diamondore | (20,18), (26,14) |
| dragoniteore | (28,18) |
| runeessence | (12,18), (13,20), (18,22) |

- **Other zones** with rocks: hash of tile coords — copper/tin by default; Graves mixes iron; Highlands mixes iron and diamondore.
- Rock depletes → respawns (~10s). Mining XP 10 per success.
- **Dragon Den boulder** (Highlands): needs pickaxe **tier ≥ 5** (diamond+). Clears seal into `dragonden`.

### Hunting / combat skins (not a gather click)

| Source zone | Mob | Resource drops (plus bones + gold) |
|-------------|-----|-------------------------------------|
| haven | Chicken | feathers ×3 |
| millfields | Cow | rawbeef, cowhide |
| westmead | Rabbit | rabbitfur |
| southshore | Crab | rawshrimp |
| northwood / westmead | Goblin | chance copper/tin, air runes, logs |
| graves | Skeleton | chance iron, mind runes, key |
| darkmine | Bat | chance rune essence, air rune |
| mire | Slime | chance earth/water runes |
| highlands | Drake | chance drakescale, diamondore, dragoniteore, fire runes |
| dragonden | Dragon | drakescale, chance dragoniteore / diamondore / fire runes |

Hunter XP is granted on rabbit kills (`HUNTER_KILL_XP`).

---

## Emberhaven stations

Courtyard props (`TOWN_PROPS`):

| Station | Kind | Skill / use |
|---------|------|-------------|
| Range `(16,17)` | cook | Cooking — raw → cooked (burn chance) |
| Furnace `(22,12)` | smelt | Smithing — ores → bars |
| Anvil `(21,12)` | smith | Smithing — bars → tools/weapons/staves |
| Craft stall `(16,11)` | stall | Crafting / Fletching / Construction recipes |
| Mira stall `(16,12)` | shop-stall | General shop (`mira`) |
| Campfire `(18,15)` | rest / cook | Permanent fire (also in several wild zones) |

Player fires: Use **tinderbox** on **firemake-capable logs** on a walkable tile (`FIREMAKE_XP` / item `firemakeXp`).

---

## Smelting (`SMELT_RECIPES` → furnace)

| Output | Inputs | Smithing need | XP |
|--------|--------|---------------|----|
| copperbar | copper ×1 | 1 | 12 |
| bronzebar | copper ×1 + tin ×1 | 1 | 18 |
| ironbar | iron ×1 | 15 | 25 |
| diamondbar | diamondore ×1 | 40 | 50 |
| dragonitebar | dragoniteore ×1 | 60 | 70 |

---

## Smithing (`SMITH_RECIPES` → anvil)

| Output | Bars / extras | Need | XP |
|--------|---------------|------|----|
| copperdagger / copperaxe / copperpick | copperbar ×1 | 1 | 14–16 |
| bronzedagger | bronzebar ×1 | 1 | 22 |
| sword / bronzeaxe / bronzepick | bronzebar ×1–2 | 5 | 24–28 |
| bronzestaff | bronzebar ×2 + logs ×1 | 8 | 30 |
| ironsword / ironaxe / ironpick | ironbar ×1–2 | 15 | 36–40 |
| ironstaff | ironbar ×2 + oaklogs ×1 | 20 | 44 |
| diamondaxe / diamondpick | diamondbar ×1 | 40 | 70 |
| diamondstaff | diamondbar ×2 + yewlogs ×1 | 45 | 80 |
| dragoniteaxe / dragonitepick | dragonitebar ×1 | 60 | 100 |
| dragonitestaff | dragonitebar ×2 + magiclogs ×1 | 65 | 120 |

---

## Crafting / fletching / construction (craft stall)

Selected `CRAFT_RECIPES` (full list in `Items.js`):

| Output | Inputs | Skill | Need | Notes |
|--------|--------|-------|------|-------|
| leather | cowhide | Crafting | — | Tan recipe |
| string | rabbitfur ×1 | Crafting | 1 | Spin |
| gloves | leather + string | Crafting | 1 | Also Use-on stitch |
| net | string ×3 | Crafting | 1 | Weave net |
| woodclub / shield / woodaxe / woodpick / staff | logs | Crafting | 1 | Carve |
| wizardhat / wizardrobe | leather + feather/string | Crafting | 5 / 8 | Sew |
| woodbow → magicbow | matching logs + string | Fletching | 1–60 | By log tier |
| woodarrow / arrow / ironarrow | logs or bars + feather | Fletching | 1 / 5 / 15 | ×10 arrows |
| shortbowunstrung | logs ×1 | Fletching | 1 | |
| oakplank | oaklogs ×1 | Construction | 1 | |

---

## Cooking

| Raw | Cooked | Burnt | Cook XP |
|-----|--------|-------|---------|
| rawshrimp | shrimp | burntshrimp | 30 |
| rawbeef | beef | burntbeef | 30 |

Stations: town **range**, player **fire**, or permanent **campfire**. Burn chance falls with Cooking level.

---

## Runecraft (altars)

Consume **runeessence** ×1 at the matching altar (`RUNE_ALTARS` + Dragon Den fire altar):

| Rune | Zone | Runecraft need | XP |
|------|------|----------------|----|
| airrune | Emberhaven | 1 | 10 |
| mindrune | Restless Graves | 1 | 10 |
| waterrune | Southshore | 5 | 12 |
| earthrune | Millfields | 5 | 12 |
| firerune | Highlands (+ den) | 10 | 14 |
| naturerune | Mirefen | 20 | 20 |

Essence: mine Darkmine nodes, buy from Mira, or bat drops.

---

## Shops

### Mira (`GENERAL_SHOP_STOCK`) — general / resources

Food: cooked shrimp, bread. Tools: tinderbox, net, bronze axe/pick. Mats: string, logs, oak/yew/magic logs, copper/tin/iron ore, bronze/iron bars, diamond/dragonite ore, rune essence, guam, feathers, elemental + nature + air/mind runes.

### Armsman Cole (`WEAPON_SHOP_STOCK`) — gear / tools

Melee/ranged/magic weapons through dragonite tier, shields, gloves, wizard cloth, arrows, axes and picks (wood → dragonite), air/mind runes.

Buy/sell prices come from `ITEM_DB.buyPrice` / `sellPrice`. Stocks restock on timers. Quest items are unsellable.

---

## Tutors (one-time gifts)

First talk with each tutor (`applyNpcTutor`) marks the tutor and gifts if you lack the item:

| NPC | Zone | Tutor | Gift |
|-----|------|-------|------|
| Fisher Ned | Southshore | fishing | `net` ×1 |
| Miner Corb | Darkmine | mining | `bronzepick` ×1 |
| Ranger Kett | Northwood | combat | `bronzeaxe` ×1 |
| Farmer Willa | Millfields | cows | `string` ×3 |
| Cook Pell | Emberhaven | firemaking | `tinderbox` ×1 |

---

## Starter kit (`makeHero`)

Worn: bronze sword + wooden shield. Inventory highlights: coins ×8, shortbow, wood staff, bronze axe, bronze pick, air/mind runes ×30, cooked shrimp ×8, bread ×3.

So early woodcutting/mining work without tutors or shops; fishing still needs a net (Ned gift, Mira, or craft from string).

---

## Other obtain paths

| Item / output | How |
|---------------|-----|
| bones | Any mob kill; bury for Prayer XP (more at shrine) |
| key | Rare skeleton drop; opens Millfields locked farm door |
| shipcrate / batfang | Side-quest tokens (Ned shipment / Corb bats) — not trade goods |
| attackpot | Herblore from guam (`Items.js` brew helper); guam also on Mira |
| cluescroll | Quest/clue flow (not a gather node) |
| High Alchemy | Magic convert item → coins (nature + fire runes); not a gather source |

---

## Practical loops (code-backed)

1. **Bronze gear:** Darkmine copper+tin → furnace bronzebar → anvil dagger/sword/tools (or buy Cole/Mira).
2. **Food:** Southshore net fishing → range/fire cook; or Millfields cows → beef; or Mira shrimp/bread.
3. **Leather gloves:** Millfields cowhide → craft stall tan → string (Willa / rabbits / Mira) → stitch.
4. **Bows:** chop zone-tier logs → string → fletch at stall (or buy Cole).
5. **High-tier metals:** Darkmine diamond/dragonite nodes (level-gated), Highlands/den combat drops, or Mira stock → smelt → smith axes/picks/staves.
6. **Runes:** essence (mine/shop/bats) → zone altars; combat also drops some runes.

---

## Code anchors

- Item defs, shops, recipes, gather helpers: `js/data/Items.js`
- Ore nodes, fish spots, altars, town props, `mineRockAt` / `woodcutTreeAt`: `js/world/MapGen.js`
- Zone grid, NPCs/tutors, mob spawns: `js/world/Zones.js`
- Mob loot tables: `js/data/Scales.js` (`lootForMob`)
)
