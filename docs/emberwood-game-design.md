# Emberwood — Game Design Document

**Saved in-repo:** `docs/emberwood-game-design.md`  
**Audience:** humans and agents continuing the game  
**Source of truth:** live code under `js/`, `index.html`, `css/style.css`  
**Companion docs:** [Resource obtainability](emberwood-resource-obtainability.md), [Open-items Cursor plan](../.cursor/plans/emberwood-open-items.plan.md), `README.md`, `AGENT.md`, `loop-tasks.md`  
**Last refreshed:** 2026-11-12  

This document describes **current shipped behavior**. Anything aspirational is marked **(aspirational)**. Prefer code over stale AGENT.md notes when they disagree. New feature/fix requests are logged in `loop-tasks.md` (see `.cursor/rules/loop-tasks-track-requests.mdc`).

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
| Tone | Practical adventuring; warm brown panels; CC0 original SVGs |
| Fonts | **Cinzel** (display / titles) + **Alegreya Sans** (HUD UI) via Google Fonts; Phaser text uses Alegreya Sans fallbacks — not Verdana/Inter |
| Engine | **Phaser 3.90.0 only** (CDN). No Phaser 4, no bundler, no npm build |
| HUD | **Vue 3.5** global CDN on `#hud-root` — **display-only** mirror; Phaser owns state (`registry`) |
| Canvas | 512×320, `pixelArt`, `roundPixels`, `Scale.FIT`, arcade gravity 0, `input.keyboard: false`, `audio: { noAudio: true }` |
| Loop / sim clock | Render FPS capped at 60; **Simulation TPS** (`hero.simTps`, 30/60/120 default 60) + **Game Speed** (`hero.gameSpeed`, 0.5–2× default 1) via `GameClock`; movement in tiles/sec; durations in game-seconds → tick countdowns; `#fps-readout` shows `FPS N \| TPS N (configured)` |
| Audio | Phaser `noAudio` stays; WebAudio `Sfx.js` — layered biome music beds + clearer UI/hit/pickup/gather/death cues; Mute SFX / Mute Music in Settings |
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
| `haven` | Emberhaven | Town hub: stations, bank booth, shops, chickens (outside safe zone) |
| `millfields` | Millfields | Farm, cows, earth altar, locked door + key |
| `darkmine` | Darkmine | Mine band (31–35); magic trees, full ores, bats, **Deep Mine** shaft |
| `southshore` | Southshore | Fishing spots, water altar, crabs |
| `mire` | Mirefen | Swamp, oak trees, nature altar, slimes |

**Hidden zones:** `dungeon` (**Deep Mine** — UX name; not “Endless Mine”) from Darkmine shaft; `dragonden` (after diamond+ pick clears Highlands boulder).

Maps: **36×28** tiles × **16 px**. Generate in `MapGen.js`. Collide / path-block: WATER, TREE, ROCK, SHRINE, STALL, RANGE, ANVIL, BOOTH, FURNACE, DOCK, BOAT, TOMB, DOOR, WALL.

### 2.2 Zone combat level bands

Single source: `ZONE_MOB_ROSTER` in `Zones.js` (band + spawn types/spots). `ZONE_LEVEL_BAND` and `MOB_DEFS` derive from it; entrance labels use actual spawn levels + mob names.

| Zone | Mobs | Band |
|------|------|------|
| Emberhaven | Chickens | **1–3** |
| Millfields | Cows | **1–5** |
| Mirefen | Slimes | **6–10** |
| Southshore | Crabs | **11–15** |
| Northwood | Goblins | **16–20** |
| Restless Graves | Skeletons | **21–25** |
| Westmead | Rabbits & Goblins | **26–30** |
| Darkmine | Bats | **31–35** |
| Windrock Highlands | Drakes | **36–40** |
| Dragon Den | Dragons | **Lv 60** |
| Deep Mine (`dungeon`) | (floor roster) | **40 + (floor − 1)**; Dragon every 21st floor |

### 2.3 Zone transitions & entrance labels

- Walk into ~**30 px** edge strip (~**2 tiles**) on a path → neighbor zone.
- Enter chat includes mobs + band, e.g. `You enter Northwood (Goblins Lv 16–20).` (`zoneEnterChat`).
- Faint **2-line border labels** at N/S/E/W exits: zone name + mob summary (`zoneBorderLabelText`). Den/mine shaft markers use the same roster helpers.
- `exitLock` ~400 ms prevents skipping zones in one dash.
- Outer corners do **not** wrap.
- Spawn on opposite side of entry (`spawnPointForEntry`).
- Default Emberhaven spawn: tile center **(20, 15)** → world **(328, 248)**; must not overlap NPCs.
- Haven courtyard gate: tile **(23, 15)** PATH between ROCK.
- Minimap 3×3; click a neighbor cell starts a walk toward that exit. Click current cell no-ops.

### 2.4 Emberhaven safe zone

- Chebyshev radius **`HAVEN_SAFE_RADIUS_TILES = 5`** from `TOWN_CENTER_TILE` **(18, 15)** → tiles **tx 13–23, ty 10–20**.
- **No mob spawn or entry** (`mobForbiddenTile` / soft-block wander, agro, chase). Faint courtyard ring GFX.
- Chickens: **Lv 1** ring just outside the safe radius; **Lv 3** (band edge) near N/S/E/W exit approaches. Chickens **cannot** walk into the safe courtyard.

### 2.5 Mob edge margin & leash

- Mobs may **not** enter the outer **`MOB_EDGE_MARGIN_TILES = 2`** border. Player still can (for exits). Soft-push / clamp keeps wander + chase inside the inner map.
- **Leash:** `MOB_LEASH_TILES = 4` Chebyshev from spawn home (`homeX`/`homeY`). Wander / agro / fight chase stop at leash; kiting beyond → return home and drop agro.

### 2.6 Mob spawn pyramid & density

- Tier order (high → low): Dragon, Drake, Skeleton, Slime, Goblin, Bat, Crab, Cow, Rabbit, Chicken.
- Base count per type = **1 + steps below Dragon** (Dragon=1 … Chicken=10).
- Runtime count = `max(1, round(pyramidBase × mobSpawnModifier))`.
- Settings **Mob spawn density**: 0.5× / 1× / 1.5× / 2× (`hero.mobSpawnModifier`, default **1**). Applies on **next zone enter**; Deep Mine floor counts use the same multiplier.

### 2.7 Interiors / dungeon / den

| Feature | Behavior |
|---------|----------|
| Bank interior | **Removed** — courtyard booth + Elise only |
| Deep Mine | Darkmine shaft → floor N; mob level = **40 + (N − 1)**; Dragon every 21st floor; stairs up/down; escape shaft remembers floor; campfire every 5th. Always call it **Deep Mine** in UI/chat (internal id stays `dungeon`) |
| Dungeon cues | Pulsing shaft/stairs markers + approach chat (throttled); labels `Deep Mine` / `Lv 40+` |
| Dragon Den | Highlands boulder needs pick **tier ≥ 5** (diamond+); sets `hero.flags.dragonDenOpen`; pulsing markers + approach chat; step/click enter & exit; Dragons Lv 60 |

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

**Look:** warm brown panels (`#2a2116` / `#3a2f22`), Cinzel + Alegreya Sans, gold accents — not purple-on-white AI chrome.

### 3.2 Side panel

- Minimap (click chrome for world-map overlay)
- Zone name, display name, **Level** (= average of combat skills), total level
- **Shared stat bars:** Hitpoints, Run energy (click toggles run) — fill + label overlaid (`.stat-bar`). No separate Hero XP bar.
- Gold
- Task blurb
- Battle panel (overworld fight): message, enemy list, Attack / Eat food / Run — **no** auto-attack / auto-retaliate here

### 3.3 Bottom bar — tabs & F-keys

| Key | Tab | Notes |
|-----|-----|-------|
| F1 | Inventory | 28 slots; click food to eat in world |
| F2 | Combat | Styles; **Auto-attack** + **Auto-retaliate** (both default Off — **Combat tab only**); run; special |
| F3 | Skills | Full skill list + XP tooltips |
| F4 | Quest | Journal + checklist |
| F5 | Worn | Equipment grid + stats |
| F6 | Prayer | Points bar; Thick Skin / Burst of Strength |
| F7 | Magic | Strike spells + High Alchemy |
| F8 | Settings | Visuals, audio, spawn density, zoom, save I/O — **not** auto-attack/retaliate |
| F9 | — | Collision debug (not a tab) |
| Ctrl | — | Toggle run |

### 3.4 Chat

- Log in `#chat-log` (Vue lines; drop oldest after ~40)
- Compose + filter (Game / Public / Clan — local UX; not multiplayer)
- Hint text under compose covers walk / F-keys / Combat auto toggles / loot

### 3.5 Overlays (HTML)

| Overlay | Purpose |
|---------|---------|
| Title | Continue / New game / Ironman / Credits |
| Dead | Respawn in Emberhaven / Return to title |
| Dialogue | Multi-page NPC talk; **Close** button; Space advances / closes; Esc closes |
| Shop | Mira / Cole buy-sell qty buttons |
| Bank | Inv ↔ vault, search, tabs, deposit/withdraw X/all, Heal |
| Station | Cook / smelt / smith / craft recipes; **Cook-1 / Cook-5 / Cook-all** |
| Context menu | Walk here, Take, Examine, station Use, etc. |
| Level-up / Quest complete | Modal cards |
| World map | Nine lands list |
| FPS / TPS readout | `#fps-readout` top-left — **on by default**; Settings **Show FPS** toggles visibility |

Leftover canvas `Menu.js` / `Message.js` are **not** the player HUD — do not revive as primary UI.

---

## 4. UX patterns

### 4.1 Movement

| Action | Behavior |
|--------|----------|
| WASD / arrows | Walk/run via `Keys.js`; cancels click-walk, talk/engage chase, purple path |
| Click ground | Immediate walk; yellow 6×6 + dest X + purple A* line; sets `playerClickWalkActive` |
| Right-click ground | Context **Walk here** (no immediate walk); same `playerClick` flag when chosen |
| Esc / click self | Cancel walk (OSRS-style); clears `playerClickWalkActive` |
| Click-walk vs combat | While player click-walk is active, **auto-attack** and **auto-retaliate chase** pause until the path ends (mob agro hits still apply) |
| Diagonal | Velocity renormalized to walk/run speed |
| Chat focused | `Keys.typing()` ignores input so typing does not walk |
| HUD clicks | `Hud.bindHudBlur` blurs buttons so WASD still works |

### 4.2 Pathfinding

- Tile A* (`Pathfind.js`), 8-dir; **`diagonalFlanksOpen` / `clampMoveNoCornerCut`** — no diagonal squeeze between blockers; both flanking tiles must be walkable for a diagonal step (1-tile doors stay passable via cardinal / clear-flank diagonals)
- Only **fully open / walkable** ground tiles are path destinations; solids and non-ground blocked
- Soft-avoids NPC / living-mob tiles when a detour exists
- If a mob blocks the only corridor: wait / stop adjacent — do not walk through
- Repath ~every 280 ms if path becomes blocked
- Talk/fight/loot chase repaths to moving targets (`chaseWalkTarget`) unless player click-walk is active

### 4.3 Click / context on entities

| Target | Left | Right / hold (~2s) |
|--------|------|---------------------|
| NPC | Talk / option menu | Examine + options |
| Mob | Engage / attack | Examine |
| Loot pile | Take **top** item | Take menu for each + Examine |
| Tree / rock / fish / station | Use when in range else walk up | Examine |
| Gravestone | Reclaim when in range | Examine |

World clicks ignored while title, `encounterLock` (pre-fight shake), or legacy `Hud.mode === 'battle'`. Station / shop / bank set `Hud.interactionPaused` → world move and engagement freeze.

**Dialogue:** Open talk freezes engagement like other UI. **Close** ends dialogue. **Click away** on the world (not the same NPC) calls `hideDialogue` then **falls through** to normal walk / other-NPC click. Walking far from the talk NPC also closes (`closeDialogueIfAway`).

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

Architecture (combat-intent redesign): **PlayerIntent** (`world.playerIntent`) is primary; **CombatController** (`js/world/CombatController.js`) owns acquire policy, intent writers, and fight begin/end/leash hooks. Legacy `engageTarget` / `playerClickWalkActive` are **mirrors only** (Hud / older readers). Clears go through `clearAttackIntent` / `cancelPlayerCombat`. Mob agro AI stays on WorldScene. Plan: `.cursor/plans/combat-intent-redesign.plan.md`.

1. Click living mob → intent `attack` / `engageTarget` → path to **stand-in-weapon-range** tile → `beginFight` → shake → `startOverworldFight`
2. Ticks every **600 ms**; Attack / Eat / Run / special / spells from HUD. Once fighting, swings are **not** gated by autos.
3. Hit splats + optional projectiles when **Combat visuals** on
4. **Range rings** (separate Settings toggle, default on): **orange** aggro (`0xff8c20`), **red** attack (`0xff3b3b`) @ ~0.28 alpha — drawn while fighting / engage / agro chase
5. Win → XP by style + Hitpoints share; loot **on ground** (not auto-bag); mob respawn ~18 s
6. Flee: push + grace; Run success chance on legacy battle path still exists for harness

**Ranges:** weapon/mob attack = Euclidean px; auto-attack acquire = Chebyshev tiles (do not mix). Attack paths use `standInRangeWorld` (never onto unwalkable mob tiles).

**Auto-attack (default Off, Combat tab only):** walking near a living mob can engage (with grace after zone/battle). Paused during player click-walk (`intent.pauseAutos` / `playerClickWalkActive`).
**Auto-retaliate (default Off, Combat tab only, separate):** only when a foe **agros you first** — walk into weapon range and fight back; does **not** pick passive nearby mobs. Chase also pauses during player click-walk.

**In-fight chase gate:** while already fighting, player auto-close toward the mob if **inside the mob’s attack range** but outside weapon range (does **not** require auto-retaliate — that only gates *starting* retaliate engages). Safe ranging outside mob attack range does **not** auto-walk into the foe. Click-walk still pauses close-in. `startOverworldFight` restores attack intent (beginFight had cleared it). Mob fight-chase runs **once** per update (after player move). `encounterLock` stays true during the fight but must not block in-fight engage chase.

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
- Weapon hit damage also gains **0.1 ×** the matching skill level: melee→Strength, bow→Ranged, staff→Magic (`weaponSkillDamageBonus` in `equippedWeaponDamage`)  
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

Mob base levels (fallbacks): Chicken 1–3, Cow ~3, Slime ~8, Crab ~13, Goblin ~18, Skeleton ~23, Rabbit/Goblin (Mead) ~28, Bat ~33, Drake ~38, Dragon 60. Overworld spawns use §2.2 bands (Haven chickens Lv1 ring + Lv3 exits). Deep Mine: **40 + (floor − 1)**; Dragon on floors 21, 42, 63, ….

### 6.4 Mob movement

- Cap: **≤ ½ player walk** (`WALK_SPEED` 90 → cap 45); factors by type still under cap  
- **Same speed** for wander, agro chase, and in-fight chase — **no combat speed-up**  
- **Leash** 4 tiles from spawn home (see §2.5); Haven safe courtyard forbidden (see §2.4)  
- Giants (Drake/Dragon) multi-tile footprint; blocked by narrow corridors  

### 6.5 Ranges (quick reference)

| Thing | Value |
|-------|-------|
| Player walk / run | 90 / 180 |
| Melee engage / default melee | 24 px |
| Bow / magic default | 64 px (4 tiles) |
| Mob attack ranges | Per type (e.g. Bat 96, Slime 72, Drake 100, Dragon 120) |
| Aggro detection | ~112 px (`MOB_AGGRO_RANGE_PX`) |
| Loot pickup | 12 px |
| Campfire heal / effect radius | **5 tiles** (80 px); faint **effect radius ring** (`effectRadiusGfx`, same style as combat rings) |
| Haven safe courtyard | Chebyshev r=5 from (18,15) |
| Mob leash | **4 tiles** Chebyshev from spawn |
| Zone exit strip | ~30 px (~2 tiles) |
| Mob edge margin | 2 tiles |
| Talk range | ~22 px; wall block ~48 px |

### 6.6 Regen & day/night

| Condition | HP regen cadence |
|-----------|------------------|
| Base wild | ~4500 ms |
| Town | ~1800 ms |
| Within campfire range | ~1100 ms |

Day/night uses **real clock hour**: dusk/dawn warm tint, night cool overlay alpha on a scroll-factor-0 rect. Biome music beds + SFX via `Sfx.js` (Phaser `noAudio` stays; WebAudio separate; mute flags in Settings).

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
| Auto-attack | **Off** | **Combat only** | Engage nearby foes when walking close (paused during click-walk) |
| Auto-retaliate | **Off** | **Combat only** | Only after **mob agros first**; walk into range (chase paused during click-walk) |
| Auto-pickup | On | Combat, Settings | Walk-over loot vs click-only |
| Shift-click drop | On | Settings | Shift+LMB drops inv item |
| Hide bones | Off | Settings | Hide ground bones |
| Combat visuals | On | Settings | Projectiles / hit FX |
| Show range rings | On | Settings | Orange aggro + red attack rings (independent of Combat visuals) |
| Mob spawn density | 1× | Settings | 0.5 / 1 / 1.5 / 2× pyramid counts; next zone enter |
| Run | Off | Combat, Settings, run bar, Ctrl | Sprint vs walk |
| Ironman | Off | Title checkbox | No trading |
| Mute SFX / Music | — | Settings | `Sfx` flags (WebAudio; Phaser stays `noAudio`) |
| Show FPS | **On** (readout visible) | Settings | Toggle `#fps-readout` (`FPS N \| TPS N`) |
| Simulation TPS | **60** | Settings 30/60/120 | Sim resolution only (`GameClock`); does not change feel by itself |
| Game Speed | **1×** | Settings 0.5/1/1.5/2× | Global feel: scales tiles/sec movement and shortens/lengthens authored game-second durations |
| Zoom | 1–2 | Settings slider | Camera zoom |
| Collision debug | Off | Settings / F9 | Body + collide tile overlay |

Keep mirrored buttons in sync when toggling. Do **not** put auto-attack / auto-retaliate back on Settings or the battle panel.

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

### 8.2 Deep Mine (not “Endless Mine”)

- Entry: Darkmine shaft (`INTERIOR_LIST` / markers); UI/chat always say **Deep Mine**
- Procedural floors; stairs; escape remembers deepest escape floor
- Mob level **40 + (floor − 1)**; Dragon every 21st floor
- Combat-focused (not ore nodes); campfire every 5th floor + effect radius ring
- Floor mob counts scale with **mob spawn density** modifier

### 8.3 Dragon Den

- Unlock path: mine diamondore (Darkmine / Highlands) → smelt diamondbar → smith (or buy) diamondpick → mine Highlands sealing boulder (pick tier ≥ 5) → `hero.flags.dragonDenOpen`
- Markers + approach chat on sealed boulder / open cave / den exit; step or click to enter/leave
- Den biome: Dragon mobs (Lv 60), fire altar, campfire; high-tier drops (scales, ores, fire runes)

### 8.4 Starter kit (highlights)

Worn bronze sword + wooden shield; inv includes coins×8, shortbow, wood staff, bronze axe/pick, air/mind runes×30, shrimp×8, bread×3. Fishing still needs a net (Ned / Mira / craft).

### 8.5 Assets & audio

- Original CC0 SVGs only (`tools/generate_svgs.py`, `generate_assets.py`). No Zenva / commercial packs
- Fonts: Cinzel + Alegreya Sans (Google Fonts link in `index.html`; CSS vars `--font-display` / `--font-ui`)
- Music/FX: layered WebAudio biome beds + clearer combat/gather/UI cues in `Sfx.js`

---

## 9. Do not / avoid

Actionable pitfalls from project rules and recent combat/gather/save work:

### Process & tooling

| Avoid | Why |
|-------|-----|
| Run tests, Playwright, Glass, or browser “proof” | **Testing fully disabled** until human re-enables (`no-testing.mdc`, README, loop-tasks §14) |
| Re-arm `/loop` / auto test workers | Auto loop is OFF |
| Skip logging new user requests in `loop-tasks.md` | Always-apply `.cursor/rules/loop-tasks-track-requests.mdc` |
| Upgrade Phaser 4 / add bundler / enable Phaser keyboard or Phaser audio | Hard stack constraints |
| Commit secrets; **push** without ask | Local commits OK after coherent changes (workspace auto-commit); never push unless asked |
| Commercial / third-party game art | CC0 originals only |
| Grand Exchange / multiplayer / dump 23 unfinished skills before core loops | Out of scope |
| Call the dungeon **Endless Mine** in UI/chat | Ship name is **Deep Mine** (`dungeon` id stays) |

### Combat / AI

| Avoid | Why |
|-------|-----|
| Speed up mobs during chase/fight | Wander/agro/fight share `mobMoveSpeed` ≤ ½ walk |
| Auto-chase player into a mob while **safe ranging** | In-fight close only if already inside **mob attack range** |
| Treat auto-retaliate like auto-attack | Retaliate = agro-first only; no passive nearby pull |
| Default auto-attack or auto-retaliate **on** for new heroes | Both default **Off**; Combat tab only |
| Keep auto-engaging during player click-walk | `playerIntent.pauseAutos` / `playerClickWalkActive` pauses auto-attack / retaliate chase |
| Gate active-fight swings on autos | Autos only **acquire**; `tickOverworldFight` always swings in weapon range |
| Path attack onto unwalkable mob tiles | Use `standInRangeWorld` / `walkToEngage` |
| Call `chaseFightMob` twice per update | Once, after player movement |
| Require auto-retaliate for in-fight weapon-range close | Retaliate is acquire-only; active fight closes without it |
| Leave attack intent cleared after `beginFight` | `startOverworldFight` restores intent on the fight mob |
| Block `tryAutoEngage` chase with `encounterLock` during fight | Lock stays for exits; chase allowed when `overworldFight` set |
| Ignore level agro gate | Equal/higher combat player should not be agroed (unless `alwaysAgro`) |
| Let mobs sit in the outer 2-tile border | Soft-push / clamp to inner map |
| Let mobs enter Haven safe courtyard or break 4-tile leash | `mobForbiddenTile` + `MOB_LEASH_TILES` |

### World / loot / death

| Avoid | Why |
|-------|-----|
| Drop loot on trees/rocks/water/stalls/etc. | Always snap via `lootGroundWorldAt` / ground tiles |
| Spam chat every gather tick | Start + result lines only |
| `scene.start('GameOverScene')` wiping WorldScene graves | Sleep World + launch GameOver; preserve `graveZoneState` |
| Wipe graves when live sprite list is empty without `force` | Death-before-draw / asleep edge cases |
| Clear graves on Return-to-title without understanding abandon | Title abandon intentionally drops reclaim; respawn path must keep grave |
| Walk through NPCs/mobs when a detour exists | Soft-avoid occupied tiles; wait if corridor blocked |
| Diagonal squeeze between adjacent blockers | Require both flanks open (`diagonalFlanksOpen`) |
| Zone-exit strips that skip neighbors | Keep `exitLock`; ~2-tile edge, not wrap |

### UI / UX

| Avoid | Why |
|-------|-----|
| Purple generic AI UI / Inter / Verdana-only / dashboard clutter | Keep Cinzel + Alegreya Sans + warm brown Emberwood shell |
| Drawing F-keys / chat on the Phaser canvas | HTML HUD only |
| Putting live hero into Vue reactive | Snapshots via `Hud` only |
| Mounting Vue on `#content` | Phaser-owned canvas |
| Eating from Inv during battle | Use **Eat food** battle action |
| Desyncing auto-attack / retaliate / pickup button copies | Always refresh all mirrors; autos live on **Combat** only |
| Putting auto-attack / retaliate back on Settings or battle panel | Removed by design |
| Left-click opening loot pile menu | Left = take top; right/hold = menu |
| Blocking world walk while dialogue is open after click-away | Close then fall through to walk / other NPC |

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
| Request tracking | Every new user feature/fix/content/process request → `loop-tasks.md` (`loop-tasks-track-requests.mdc`) |
| AGENT.md / README drift | Older Verdana / Endless Mine / combat-default notes may lag; **prefer this GDD + code** |
| Design plan | `docs/emberwood-design-plan.md` for option-style backlog; `loop-tasks.md` for PM status |

---

## Code anchors (quick)

| Area | Files |
|------|-------|
| HUD / settings | `js/ui/Hud.js`, `HudApp.js`, `index.html`, `css/style.css` |
| Game clock | `js/world/GameClock.js`; Settings `simTps` + `gameSpeed` via `Hud.js`; readout in `js/main.js`; world/battle tick countdowns |
| World / gather / death | `js/scenes/WorldScene.js` |
| Combat / rings / leash | `js/world/OverworldCombat.js`, `WorldScene.js` (`combatRangeGfx`, `MOB_LEASH_TILES`) |
| Items / skills / examine | `js/data/Items.js` |
| Save | `js/data/Save.js` |
| Scales / loot tables | `js/data/Scales.js` |
| Maps / ores / shafts | `js/world/MapGen.js` |
| Zones / bands / spawn pyramid | `js/world/Zones.js` (`ZONE_MOB_ROSTER`, `MOB_TIER_ORDER`, `mobDefsForZone`) |
| Path / safe zone / no squeeze | `js/world/Pathfind.js` |
| Audio | `js/ui/Sfx.js` |
| Input | `js/input/Keys.js` |
| Resources doc | `docs/emberwood-resource-obtainability.md` |
| Task log | `loop-tasks.md` |
)
