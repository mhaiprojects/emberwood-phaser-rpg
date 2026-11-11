# Emberwood — Game Design Document

**Saved in-repo:** `docs/emberwood-game-design.md`  
**Audience:** humans and agents continuing the game  
**Source of truth:** live code under `js/`, `index.html`, `css/style.css`  
**Companion docs:** [Resource obtainability](emberwood-resource-obtainability.md), [Design plan](emberwood-design-plan.md), `README.md`, `AGENT.md`, `loop-tasks.md`  
**Last refreshed:** 2026-11-11  

This document describes **current shipped behavior**. Anything aspirational is marked **(aspirational)**. Prefer code over stale AGENT.md notes when they disagree.

---

## Table of contents

1. [Overview / fantasy / tech](#1-overview--fantasy--tech)
2. [World & zones layout](#2-world--zones-layout)
3. [UI layout](#3-ui-layout)
4. [UX patterns](#4-ux-patterns)
5. [Core gameplay loops](#5-core-gameplay-loops)
6. [Systems & logic](#6-systems--logic)
7. [Settings & persistence](#7-settings--persistence)
8. [Content notes](#8-content-notes)
9. [Do not / avoid](#9-do-not--avoid)
10. [Open / known design intents](#10-open--known-design-intents)

---

## 1. Overview / fantasy / tech

| Topic | Current design |
|-------|----------------|
| Fantasy | Small RuneScape-like free-roam RPG: Emberhaven hub, nine connected lands, gathering/crafting, shops/bank, overworld combat |
| Tone | Practical adventuring; Verdana HUD; warm brown panels; CC0 original SVGs |
| Engine | **Phaser 3.90.0 only** (CDN). No Phaser 4, no bundler, no npm build |
| HUD | **Vue 3.5** global CDN on `#hud-root` — **display-only** mirror; Phaser owns state (`registry`) |
| Canvas | 512×320, `pixelArt`, `roundPixels`, `Scale.FIT`, arcade gravity 0, `input.keyboard: false`, `audio: { noAudio: true }` |
| Input | Window `Keys.js` only for walk; never Phaser cursors for movement |
| Scenes | `BootScene` → `TitleScene` → `WorldScene` ↔ (legacy) `BattleScene` / `UIScene`; death → `GameOverScene` (launched while World sleeps) |
| Primary combat | **Overworld tick combat** (`OverworldCombat.js` + `WorldScene.startOverworldFight`), ~600 ms ticks — not the old full-screen battle room for normal fights |
| Run locally | Static server (`python3 -m http.server 8765`); `file://` fails CORS |
| Play online | GitHub Pages: https://mhaiprojects.github.io/emberwood-phaser-rpg/ |

**Architecture split:** Phaser parent `#content` is never Vue-managed. `#hud-root` overlays with `pointer-events: none` except interactive panels. Imperative grids (inv, bank, minimap) use `v-manual` so Vue patches do not wipe Hud-built DOM. Never put live `hero` into Vue `reactive()`.

---

## 2. World & zones layout

### 2.1 Nine lands (3×3)

```
Restless Graves   Northwood        Windrock Highlands
Westmead          Emberhaven       Millfields
Darkmine          Southshore       Mirefen
```

| id | Name | Biome / notes |
|----|------|---------------|
| `graves` | Restless Graves | Magic trees, tombs, mind altar, skeletons |
| `northwood` | Northwood | Oak trees, goblins, Ranger Kett |
| `highlands` | Windrock Highlands | Yew trees, fire altar, Dragon Den boulder |
| `westmead` | Westmead | Plains, rabbits, goblins |
| `haven` | Emberhaven | Town hub: stations, bank booth, shops, chickens |
| `millfields` | Millfields | Farm, cows, earth altar, locked door + key |
| `darkmine` | Darkmine | Hardest overworld (36–40); magic trees, full ores, bats, Endless Mine shaft |
| `southshore` | Southshore | Fishing spots, water altar, crabs |
| `mire` | Mirefen | Swamp, oak trees, nature altar, slimes |

**Hidden zones:** `dungeon` (Endless Mine from Darkmine shaft), `dragonden` (after diamond+ pick clears Highlands boulder).

Maps: **36×28** tiles × **16 px**. Generate in `MapGen.js`. Collide / path-block: WATER, TREE, ROCK, SHRINE, STALL, RANGE, ANVIL, BOOTH, FURNACE, DOCK, BOAT, TOMB, DOOR, WALL.

### 2.2 Zone transitions

- Walk into ~**30 px** edge strip (~**2 tiles**) on a path → neighbor zone; chat `You enter {name}.`
- `exitLock` ~400 ms prevents skipping zones in one dash.
- Outer corners do **not** wrap.
- Spawn on opposite side of entry (`spawnPointForEntry`).
- Default Emberhaven spawn: tile center **(20, 15)** → world **(328, 248)**; must not overlap NPCs.
- Haven courtyard gate: tile **(23, 15)** PATH between ROCK.
- Minimap 3×3; click a neighbor cell starts a walk toward that exit. Click current cell no-ops.

### 2.3 Mob edge margin

Mobs may **not** enter the outer **`MOB_EDGE_MARGIN_TILES = 2`** border. Player still can (for exits). Soft-push / clamp keeps wander + chase inside the inner map.

### 2.4 Interiors / dungeon / den

| Feature | Behavior |
|---------|----------|
| Bank interior | **Removed** — courtyard booth + Elise only |
| Endless Mine | Darkmine shaft → floor N; mob level = 20 + (N − 1); Dragon every 21st floor; stairs up/down; escape shaft remembers floor; campfire every 5th |
| Dungeon cues | Pulsing shaft/stairs markers + approach chat (throttled) |
| Dragon Den | Highlands boulder needs pick **tier ≥ 5** (diamond+); sets `hero.flags.dragonDenOpen`; pulsing markers + approach chat; step/click enter & exit |

---

## 3. UI layout

### 3.1 Shell grid

`#shell` / `#hud-root` share CSS vars:

| Var | Default | Role |
|-----|---------|------|
| `--shell-side` | 230px | Right column (minimap, stats, quest, battle) |
| `--shell-bottom` | 210px | Chat + interface row |
| `--shell-iface` | 300px | Tab panels width |

Drag handles: `#resize-side`, `#resize-bottom`, `#resize-iface`. Sizes persist in `localStorage` key `emberwood-shell-sizes`. Phaser `scale.refresh` after resize.

**Look:** warm brown panels (`#2a2116` / `#3a2f22`), Verdana, gold accents — not purple-on-white AI chrome.

### 3.2 Side panel

- Minimap (click chrome for world-map overlay)
- Zone name, display name, combat level, total level
- **Shared stat bars:** Hitpoints, Run energy (click toggles run), XP — fill + label overlaid (`.stat-bar`)
- Gold
- Task blurb
- Battle panel (overworld fight): message, enemy list, Attack / Eat food / Run, auto-attack, auto-retaliate

### 3.3 Bottom bar — tabs & F-keys

| Key | Tab | Notes |
|-----|-----|-------|
| F1 | Inventory | 28 slots; click food to eat in world |
| F2 | Combat | Styles, auto toggles, run, special |
| F3 | Skills | Full skill list + XP tooltips |
| F4 | Quest | Journal + checklist |
| F5 | Worn | Equipment grid + stats |
| F6 | Prayer | Points bar; Thick Skin / Burst of Strength |
| F7 | Magic | Strike spells + High Alchemy |
| F8 | Settings | Toggles, audio, zoom, save I/O |
| F9 | — | Collision debug (not a tab) |
| Ctrl | — | Toggle run |

### 3.4 Chat

- Log in `#chat-log` (Vue lines; drop oldest after ~40)
- Compose + filter (Game / Public / Clan — local UX; not multiplayer)
- Hint text under compose covers walk / F-keys / loot

### 3.5 Overlays (HTML)

| Overlay | Purpose |
|---------|---------|
| Title | Continue / New game / Ironman / Credits |
| Dead | Respawn in Emberhaven / Return to title |
| Dialogue | Multi-page NPC talk; Space advances |
| Shop | Mira / Cole buy-sell qty buttons |
| Bank | Inv ↔ vault, search, tabs, deposit/withdraw X/all, Heal |
| Station | Cook / smelt / smith / craft recipes; **Cook-1 / Cook-5 / Cook-all** |
| Context menu | Walk here, Take, Examine, station Use, etc. |
| Level-up / Quest complete | Modal cards |
| World map | Nine lands list |
| FPS readout | Optional |

Leftover canvas `Menu.js` / `Message.js` are **not loaded** — do not revive as player HUD.

---

## 4. UX patterns

### 4.1 Movement

| Action | Behavior |
|--------|----------|
| WASD / arrows | Walk/run via `Keys.js`; cancels click-walk, talk/engage chase, purple path |
| Click ground | Immediate walk; yellow 6×6 + dest X + purple A* line |
| Right-click ground | Context **Walk here** (no immediate walk) |
| Esc / click self | Cancel walk (OSRS-style) |
| Diagonal | Velocity renormalized to walk/run speed |
| Chat focused | `Keys.typing()` ignores input so typing does not walk |
| HUD clicks | `Hud.bindHudBlur` blurs buttons so WASD still works |

### 4.2 Pathfinding

- Tile A* (`Pathfind.js`), 8-dir, **no corner-cutting** (1-tile doors stay passable)
- Avoids terrain blockers + soft-avoids NPC / living-mob tiles when a detour exists
- If a mob blocks the only corridor: wait / stop adjacent — do not walk through
- Repath ~every 280 ms if path becomes blocked
- Talk/fight/loot chase repaths to moving targets (`chaseWalkTarget`)

### 4.3 Click / context on entities

| Target | Left | Right / hold (~2s) |
|--------|------|---------------------|
| NPC | Talk / option menu | Examine + options |
| Mob | Engage / attack | Examine |
| Loot pile | Take **top** item | Take menu for each + Examine |
| Tree / rock / fish / station | Use when in range else walk up | Examine |
| Gravestone | Reclaim when in range | Examine |

World clicks ignored while title, `encounterLock` (pre-fight shake), or legacy `Hud.mode === 'battle'`. Dialogue / station / shop / bank set `Hud.interactionPaused` → world move and engagement freeze.

### 4.4 Stations & Use

- Range, furnace, anvil, craft stall, campfires, altars, bank booth
- Open station UI within ~28 px; walk-away / WASD / zone change closes
- Campfire / range cook supports **Cook-1 / Cook-5 / Cook-all**
- Use tinderbox + firemake logs on walkable ground → temporary fire (~45 s)

### 4.5 Examine

- Items: base examine + **Value / Buy / Sell** + effect lines (heal, damage, defence, magic bonus, potions) via `itemExamineText`
- Scenery / NPCs / loot / ore rocks have dedicated examine helpers
- Inventory tooltips show heal + value shorthand

---

## 5. Core gameplay loops

### 5.1 Combat (overworld)

1. Click living mob → `engageTarget` → path into **weapon range** → `beginFight` → shake → `startOverworldFight`
2. Ticks every **600 ms**; Attack / Eat / Run / special / spells from HUD
3. Hit splats + optional range rings / projectiles when **Combat visuals** on
4. Win → XP by style + Hitpoints share; loot **on ground** (not auto-bag); mob respawn ~18 s
5. Flee: push + grace; Run success chance on legacy battle path still exists for harness

**Auto-attack (default off):** walking near a living mob can engage (with grace after zone/battle).  
**Auto-retaliate (default on, separate):** only when a foe **agros you first** — walk into weapon range and fight back; does **not** pick passive nearby mobs.

**In-fight chase gate:** while already fighting, player auto-close toward the mob only if **inside the mob’s attack range** but outside weapon range (and retaliate on). Safe ranging outside mob attack range does **not** auto-walk into the foe.

### 5.2 Gather

| Skill | Loop |
|-------|------|
| Fishing | Southshore spots + net → timed cast → raw shrimp |
| Woodcutting | Axe + zone tree tier → timed chop → logs; tree depletes ~12 s |
| Mining | Pick + rock/node → timed mine + ore-color FX → ore; rock ~10 s |
| Firemaking | Tinderbox + logs on ground |
| Hunter | Kill rabbits (Westmead) for Hunter XP + fur |

Chat: start line (`You swing…`) + success/fail line. Do **not** spam mid-timer ticks.

### 5.3 Craft / smith / cook / runecraft

See [emberwood-resource-obtainability.md](emberwood-resource-obtainability.md) for recipes, level gates, shops, tutors. Short loops:

1. Copper+tin → furnace bronze → anvil tools/weapons  
2. Fish/cook or cows → food  
3. Cowhide → leather → gloves  
4. Logs + string → bows/arrows  
5. Essence → zone altars → runes  

### 5.4 Quest

| Quest | Flow |
|-------|------|
| Militia goblins (Bram) | Talk → kill 5 `type === 'Goblin'` (Northwood/Westmead) → return → 50 gp + XP |
| Side: Ned shipment | Collect crate marks |
| Side: Corb bats | Collect bat fangs |
| Diary | Visit/talk/eat/bury milestones in haven |

Quest head icons: bang (available) → grey quest → green (ready to turn in).

### 5.5 Bank / shop

- **Bank:** Elise or booth; deposit/withdraw 1/X/all; search; All/Food/Gear tabs; free Heal
- **Shops:** Mira (general), Cole (arms); buy 1/5/10, sell 1/5/all; timed restock; ironman blocks trading
- Inventory cap **28**

### 5.6 Death

1. Strip inventory + worn gear into a **gravestone** at death tile (quest items kept)
2. WorldScene **sleeps**; GameOver launches — **do not** `scene.start` in a way that wipes graves
3. Dead overlay: **Respawn in Emberhaven** (weak HP) or **Return to title** (abandons reclaim)
4. After respawn, walk back and click grave within ~28 px to reclaim
5. Graves persist in `graveZoneState` / save; empty live list must not wipe queued graves

---

## 6. Systems & logic

### 6.1 Skills (23)

Attack, Strength, Defence, Hitpoints, Ranged, Prayer, Magic, Cooking, Fishing, Woodcutting, Mining, Crafting, Firemaking, Smithing, Hunter, Agility, Thieving, Slayer, Runecraft, Farming, Herblore, Fletching, Construction.

Hitpoints: `maxHp` tied to Hitpoints level (starter HP 100 / level 10). Combat level derived from combat skills. XP drops float near the canvas when skills gain XP.

### 6.2 Combat styles & gear

| Style | XP emphasis |
|-------|-------------|
| Accurate | Attack |
| Aggressive / Power | Strength (or Ranged/Magic power skill when relevant) |
| Defensive | Defence |
| Shared | Split Attack/Defence/power |

- Weapon `combatClass`: melee / ranged / magic  
- **Melee range** default **24 px**; bows/staves **64 px (4 tiles)**  
- No equipped ammo → infinite wooden arrows; other ammo consumed; ammo tier must not exceed bow tier  
- Worn defence/damage from gear **is applied** in overworld math (shield/body/etc. as coded)  
- Special energy builds on hits; Special spends 25% for a stronger strike  
- Prayers: Thick Skin / Burst of Strength (drain while on)  
- Magic: Wind/Water/Earth/Fire Strike + High Alchemy (rune costs)  
- Poison chance from Slime / Skeleton / Drake / Dragon  

### 6.3 Agro

| Rule | Detail |
|------|--------|
| Detection | ~112 px (`MOB_AGGRO_RANGE_PX`) |
| Level gate | Proactive agro only if `mobLevel > player combat level` |
| Equal/higher player | Mob ignores (unless `alwaysAgro`) |
| Labels | `Type (Lvl N)` salmon float labels |

Mob base levels (fallbacks): Chicken/Rabbit 1, Cow 3, Crab/Bat/Goblin 8, Slime 13, Skeleton 18, Drake 28, Dragon 53. Zone spawns use 5-level bands (haven/millfields/westmead 1–5; southshore/northwood 6–10; mire 11–15; graves 16–20; highlands 26–30; darkmine 36–40; dragonden 51–55). Endless Mine mobs: level 20 + (floor − 1); Dragon on floors 21, 42, 63, ….

### 6.4 Mob movement

- Cap: **≤ ½ player walk** (`WALK_SPEED` 90 → cap 45); factors by type still under cap  
- **Same speed** for wander, agro chase, and in-fight chase — **no combat speed-up**  
- Giants (Drake/Dragon) multi-tile footprint; blocked by narrow corridors  

### 6.5 Ranges (quick reference)

| Thing | Value |
|-------|-------|
| Player walk / run | 90 / 180 |
| Melee engage / default melee | 24 px |
| Bow / magic default | 64 px (4 tiles) |
| Mob attack ranges | Per type (e.g. Bat 96, Slime 72, Drake 100, Dragon 120) |
| Loot pickup | 12 px |
| Campfire heal radius | **5 tiles** (80 px) |
| Zone exit strip | ~30 px (~2 tiles) |
| Mob edge margin | 2 tiles |
| Talk range | ~22 px; wall block ~48 px |

### 6.6 Regen & day/night

| Condition | HP regen cadence |
|-----------|------------------|
| Base wild | ~4500 ms |
| Town | ~1800 ms |
| Within campfire range | ~1100 ms |

Day/night uses **real clock hour**: dusk/dawn warm tint, night cool overlay alpha on a scroll-factor-0 rect. Biome music / SFX via `Sfx.js` (Phaser `noAudio` stays; WebAudio beeps/music separate).

### 6.7 Loot

- Drop via `lootGroundWorldAt` → **nearest walkable ground tile only** (never trees/rocks/stalls/water/…)
- Item **SVG icons** as ground sprites (`itemTextureKey`)
- Lifetime ~20 s; private tint ~10 s; zone change snapshots/restores via `lootZoneState`
- Auto-pickup default on (within pickup px); hide-bones option hides bone piles
- Mob tables: `lootForMob` in `Scales.js` (+ coins/bones always)

### 6.8 Ore colors & mining FX

| Ore | Node color |
|-----|------------|
| copper | `#c47a3a` |
| tin | `#b0bcc8` |
| iron | `#8a9098` |
| diamondore | `#6ec8ff` |
| dragoniteore | `#e85d3a` |
| runeessence | `#c9a0ff` |

While mining: flash + spark FX tinted to ore; cleared on finish/cancel.

---

## 7. Settings & persistence

### 7.1 Hero toggles (registry / save)

| Toggle | Default | Where | Meaning |
|--------|---------|-------|---------|
| Auto-attack | Off | Combat, Settings, battle panel | Engage nearby foes when walking close |
| Auto-retaliate | On | Combat, Settings, battle panel | Only after **mob agros first**; walk into range |
| Auto-pickup | On | Combat, Settings | Walk-over loot vs click-only |
| Shift-click drop | On | Settings | Shift+LMB drops inv item |
| Hide bones | Off | Settings | Hide ground bones |
| Combat visuals | On | Settings | Range rings + projectiles |
| Run | Off | Combat, Settings, run bar, Ctrl | Sprint vs walk |
| Ironman | Off | Title checkbox | No trading |
| Mute SFX / Music | — | Settings | `Sfx` flags |
| Show FPS | Off | Settings | Readout |
| Zoom | 1–2 | Settings slider | Camera zoom |
| Collision debug | Off | Settings / F9 | Body + collide tile overlay |

Keep mirrored buttons in sync when toggling.

### 7.2 Save (`Save.js`, key `emberwood-save-v1`, schema 1)

**Payload:**

| Field | Contents |
|-------|----------|
| `schema`, `savedAt` | Version + timestamp |
| `zone`, `playerX/Y`, `facing` | Position |
| `interiorId`, `dungeonFloor`, `dungeonEscapeFloor` | Dungeon/interior resume |
| `hero` | Full hero (skills, inv, equipment, toggles, flags, tutors, side quests, …) |
| `quest` | Main quest progress |
| `world` | `mobZoneState`, `lootZoneState`, `graveZoneState`, `depletedTiles`, `unlockedDoors` |

**Autosave triggers:** pagehide / visibility, hero edits, zone/interior enter, ~every 12 s.  
**Title:** Continue restores `resumeAt`; New game clears; Export/Import JSON; Logout to title.

Shell sizes: separate key `emberwood-shell-sizes` (not inside save schema).

---

## 8. Content notes

### 8.1 Resources

Full obtainability matrix (gather zones, smelt/smith/craft, shops, tutors, starter kit):  
→ **[docs/emberwood-resource-obtainability.md](emberwood-resource-obtainability.md)**

### 8.2 Dungeon

- Entry: Darkmine shaft (`INTERIOR_LIST` / markers)
- Procedural floors; stairs; escape remembers deepest escape floor
- Combat-focused (not ore nodes); optional floor campfire

### 8.3 Dragon Den

- Unlock path: mine diamondore (Darkmine / Highlands) → smelt diamondbar → smith (or buy) diamondpick → mine Highlands sealing boulder (pick tier ≥ 5) → `hero.flags.dragonDenOpen`
- Markers + approach chat on sealed boulder / open cave / den exit; step or click to enter/leave
- Den biome: Dragon mobs, fire altar, campfire; high-tier drops (scales, ores, fire runes)

### 8.4 Starter kit (highlights)

Worn bronze sword + wooden shield; inv includes coins×8, shortbow, wood staff, bronze axe/pick, air/mind runes×30, shrimp×8, bread×3. Fishing still needs a net (Ned / Mira / craft).

### 8.5 Assets

Original CC0 SVGs only (`tools/generate_svgs.py`, `generate_assets.py`). No Zenva / commercial packs.

---

## 9. Do not / avoid

Actionable pitfalls from project rules and recent combat/gather/save work:

### Process & tooling

| Avoid | Why |
|-------|-----|
| Run tests, Playwright, Glass, or browser “proof” | **Testing fully disabled** until human re-enables (`no-testing.mdc`, README, loop-tasks §14) |
| Re-arm `/loop` / auto test workers | Auto loop is OFF |
| Upgrade Phaser 4 / add bundler / enable Phaser keyboard or Phaser audio | Hard stack constraints |
| Commit secrets; **push** without ask | Local commits OK after coherent changes (workspace auto-commit); never push unless asked |
| Commercial / third-party game art | CC0 originals only |
| Grand Exchange / multiplayer / dump 23 unfinished skills before core loops | Out of scope |

### Combat / AI

| Avoid | Why |
|-------|-----|
| Speed up mobs during chase/fight | Wander/agro/fight share `mobMoveSpeed` ≤ ½ walk |
| Auto-chase player into a mob while **safe ranging** | In-fight close only if already inside **mob attack range** |
| Treat auto-retaliate like auto-attack | Retaliate = agro-first only; no passive nearby pull |
| Ignore level agro gate | Equal/higher combat player should not be agroed (unless `alwaysAgro`) |
| Let mobs sit in the outer 2-tile border | Soft-push / clamp to inner map |

### World / loot / death

| Avoid | Why |
|-------|-----|
| Drop loot on trees/rocks/water/stalls/etc. | Always snap via `lootGroundWorldAt` / ground tiles |
| Spam chat every gather tick | Start + result lines only |
| `scene.start('GameOverScene')` wiping WorldScene graves | Sleep World + launch GameOver; preserve `graveZoneState` |
| Wipe graves when live sprite list is empty without `force` | Death-before-draw / asleep edge cases |
| Clear graves on Return-to-title without understanding abandon | Title abandon intentionally drops reclaim; respawn path must keep grave |
| Walk through NPCs/mobs when a detour exists | Soft-avoid occupied tiles; wait if corridor blocked |
| Zone-exit strips that skip neighbors | Keep `exitLock`; ~2-tile edge, not wrap |

### UI / UX

| Avoid | Why |
|-------|-----|
| Purple generic AI UI / Inter / dashboard clutter | Keep Verdana + warm brown Emberwood shell |
| Drawing F-keys / chat on the Phaser canvas | HTML HUD only |
| Putting live hero into Vue reactive | Snapshots via `Hud` only |
| Mounting Vue on `#content` | Phaser-owned canvas |
| Eating from Inv during battle | Use **Eat food** battle action |
| Desyncing auto-attack / retaliate / pickup button copies | Always refresh all mirrors |
| Left-click opening loot pile menu | Left = take top; right/hold = menu |

### Input regressions

| Avoid | Why |
|-------|-----|
| `preventDefault` in capture phase | Keys.js rule |
| Stuck keys after blur | Window blur clears `Keys.down` |
| Ignoring `Keys.typing()` for chat inputs | Prevents walk-while-typing |

---

## 10. Open / known design intents

| Item | Status / note |
|------|----------------|
| Testing reopen | **Blocked** until human says otherwise |
| Full diamond/dragonite plate sets | `[done]` — iron / diamond / dragonite helm·body·legs·shield; smith + arms shop |
| Legacy `BattleScene` | Still in repo for harness/custom fights; normal play uses overworld ticks — keep both coherent if touched |
| Prayer/Magic depth | Lite set shipped; more prayers/spells **(aspirational)** |
| GE / multiplayer | Explicitly not planned |
| AGENT.md drift | Some AGENT combat/death notes are outdated (e.g. old “no gravestone”, old 14 px exits); **prefer this GDD + code** |
| Design plan | `docs/emberwood-design-plan.md` for option-style backlog; `loop-tasks.md` for PM status |

---

## Code anchors (quick)

| Area | Files |
|------|-------|
| HUD / settings | `js/ui/Hud.js`, `HudApp.js`, `index.html`, `css/style.css` |
| World / gather / death | `js/scenes/WorldScene.js` |
| Combat | `js/world/OverworldCombat.js`, `BattleScene.js` |
| Items / skills / examine | `js/data/Items.js` |
| Save | `js/data/Save.js` |
| Scales / loot tables | `js/data/Scales.js` |
| Maps / ores / shafts | `js/world/MapGen.js` |
| Zones / NPCs / mobs | `js/world/Zones.js` |
| Path / mob edge | `js/world/Pathfind.js` |
| Input | `js/input/Keys.js` |
| Resources doc | `docs/emberwood-resource-obtainability.md` |
)
