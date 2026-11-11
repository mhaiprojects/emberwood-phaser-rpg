# Emberwood design plan

**Saved in-repo:** `docs/emberwood-design-plan.md`  
**Also mirrored:** Cursor plan `combat_tiers_bank_plan`  
**Source of truth for feature status:** [`loop-tasks.md`](../loop-tasks.md) (snapshot below)  
**Last refreshed:** 2026-11-11

---

## Status snapshot from loop-tasks.md

| Area | Status |
|------|--------|
| Core gameplay, gathering, shops, bank polish, HUD, save, audio/juice | Almost all `[done]` |
| Bank interior removed; courtyard booth + Elise remain | `[done]` |
| New automated test *cases* written (shop, bank, bury, path, save, smoke, harness) | `[done]` (suite run deferred) |
| Re-run suite / keep existing suites green | `[blocked]` — testing disabled until you say otherwise |
| Stretch (overworld combat, spells/prayer/spec/poison, MP/GE/clues, 23 skills) | Marked `[done]` in PM |
| Multiplayer / GE | **Out of scope for this design plan** (your call: not planned going forward) |

**Open PM items right now:** only the four `[blocked]` test-process lines in §14.

**This plan’s remaining design work** (after 2026-11-11 implementation pass):

1. Deeper diamond/dragonite armour smithing recipes (tools + staves data exist)  
2. Optional smoke-only testing reopen (still blocked)

---

## How to read each item

```
### {number} Title
- Status: …
- In plain words: …
- Options:
  - A. …
  - B. …
  - C. …
- Suggestion: …
```

---

## 1. Closing the loop-tasks “complete” bar

### 1.1 Testing gate (only open PM work)

#### 1.1.1 Re-run the full test page after changes
- **Status:** `[blocked]` in loop-tasks — you turned testing off for now.
- **In plain words:** Features were added, and new test files were written, but we have not been allowed to press “run all tests” to prove everything still works together.
- **Options:**
  - A. Keep blocked until you explicitly re-enable testing.
  - B. Re-enable and run `tests/run.html` / Playwright once as a proof pass.
  - C. Re-enable only a small smoke list, not the full suite.
- **Suggestion:** A until you ask; then B.

#### 1.1.2 Keep title / HUD / movement tests green
- **Status:** `[blocked]`
- **In plain words:** The “walking and menus still work” safety net is frozen, so we cannot mark that checkoff done with fresh proof.
- **Options:**
  - A. Leave blocked.
  - B. Run that block when testing returns.
  - C. Spot-check manually in Glass only when you ask.
- **Suggestion:** A, then B.

#### 1.1.3 Keep NPC / Bram / Elise / Witch tests green
- **Status:** `[blocked]`
- **In plain words:** Talking to townsfolk and quest NPCs may have shifted (Elise moved to the booth). We have not re-proven those chats.
- **Options:**
  - A. Leave blocked.
  - B. Run NPC cases after bank layout settles.
  - C. Manual talk-through of Mira / Elise / Bram only.
- **Suggestion:** A, then B after §5 bank work.

#### 1.1.4 Keep combat / loot / death tests green
- **Status:** `[blocked]`
- **In plain words:** Fights now lean on overworld hits (0.6s ticks). Old “battle room” tests may not match reality until someone re-runs them.
- **Options:**
  - A. Leave blocked.
  - B. Update failing combat cases to overworld fights, then run.
  - C. Keep a tiny BattleScene path only for harness custom fights.
- **Suggestion:** A now; B + C when testing returns.

### 1.2 Test cases already added (PM done; proof deferred)

#### 1.2.1 Shop / bank / gather / save / path / Phaser / smoke / harness
- **Status:** `[done]` in loop-tasks (cases exist; suite run deferred).
- **In plain words:** The homework of *writing* the missing tests is done. The homework of *running* them is not, because testing is blocked.
- **Options:**
  - A. Treat writing as enough until you reopen testing.
  - B. When testing returns, run these cases first.
  - C. Delete unused cases if they drift too far.
- **Suggestion:** A + B.

### 1.3 Stretch marked done in PM (context only)

#### 1.3.1 Overworld combat, spells/prayer/spec/poison, 23 skills
- **Status:** `[done]` in loop-tasks.
- **In plain words:** The big stretch combat and skills work is checked off in the task list. Fine-tuning Ranger/Mage feel and gear tiers is still this plan’s job (§3–§4).
- **Options:**
  - A. Leave PM as done; improve via this design plan.
  - B. Reopen stretch lines if play feels unfinished.
  - C. Split “lite done” vs “deep polish” in a new PM section.
- **Suggestion:** A.

#### 1.3.2 Multiplayer / trade / duel / wilderness / hiscores / clans
- **Status:** `[done]` in loop-tasks; **out of scope here** per your request.
- **In plain words:** The task file says these shipped in some form. You do not want multiplayer as a product direction, so this plan will not grow them.
- **Options:**
  - A. Ignore for design; do not expand.
  - B. Strip or unused-gate MP UI later in a cleanup pass.
  - C. Keep as flavor-only ghosts / local toys, never true online.
- **Suggestion:** A (optionally B later).

#### 1.3.3 Grand Exchange / clues / random events / ironman
- **Status:** `[done]` in loop-tasks; **GE not planned** for this design plan (no multiplayer economy).
- **In plain words:** Same story — PM checked them off; you do not want a real GE focus.
- **Options:**
  - A. Leave as-is; do not design further GE work.
  - B. Remove GE booth / ironman trade blocks in a cleanup pass.
  - C. Keep single-player clues / random events only; drop GE.
- **Suggestion:** A, prefer C if you ever tidy stretch toys.

---

## 2. World layers — how the map works today, and how to harden it

### 2.1 What exists now

#### 2.1.1 One ground tile layer
- **Status:** Current architecture.
- **In plain words:** The whole land is one sheet of tiles (grass, path, trees, booth). The game walks and bumps into that sheet. There is not a separate “furniture layer” or “second floor” stack yet.
- **Options:**
  - A. Keep one collision sheet forever (simplest).
  - B. Add a paint-only decoration layer on top (carpets/shadows) that you cannot bump into.
  - C. Import full multi-layer Tiled maps (heavier tooling).
- **Suggestion:** A + B.

#### 2.1.2 Props are special tile numbers
- **Status:** Current (`TILE.BOOTH`, furnace, doors, etc.).
- **In plain words:** The bank booth is not a separate object — it is a tile type stamped into the map, like a rock.
- **Options:**
  - A. Keep tile stamps; add a lookup table of “what happens if you click this tile.”
  - B. Place prop sprites on top of plain path tiles.
  - C. Mix: solids as tiles, interact points as data.
- **Suggestion:** A (registry) then C if needed.

#### 2.1.3 Characters and effects use draw-order (“depth”)
- **Status:** Current (`setDepth`).
- **In plain words:** People, mist, the purple path line, and day/night tint are drawn in layers like tracing paper so the right thing appears on top.
- **Options:**
  - A. Write down fixed depth bands (ground / fx / people / overlays).
  - B. Put depths in named constants.
  - C. Keep ad hoc numbers.
- **Suggestion:** A + B.

#### 2.1.4 “Interiors” still swap the whole map for shop / guild / mine shaft
- **Status:** Done — A (haven) + B (shaft only). Shop/guild removed from `INTERIOR_LIST`; courtyard stall + guild post; Darkmine shaft keeps stairs-down interior.
- **In plain words:** Walking some doors still teleports you into a fake room that replaces the whole land. That fights the “stay on one open map” rule unless the door is clearly stairs.
- **Options:**
  - A. Remove haven shop/guild interiors; put stalls on the courtyard.
  - B. Keep interiors only when marked with stairs up/down.
  - C. Keep shop/guild teleports as-is.
- **Suggestion:** A for haven; B for Darkmine shaft.

### 2.2 Future-proofing for richer interactions

#### 2.2.1 One walk grid as the brain of the world
- **In plain words:** Pathfinding and collision should always read the same grid so the purple line never disagrees with walls.
- **Options:**
  - A. Keep `tileGrid` + Pathfind as source of truth.
  - B. Rebuild from the Phaser layer every frame.
  - C. Physics bodies only (worse for click-paths).
- **Suggestion:** A.

#### 2.2.2 Interaction registry
- **Status:** Done — A. `ZONE_INTERACT` / `setTileInteract` / `getTileInteract` per tile.
- **In plain words:** Instead of hard-coded “booth is always at 14,12,” store a list: “this tile opens bank / that tile is a furnace / that tile is stairs.”
- **Options:**
  - A. Per-tile registry `{ kind, verb, npcKey }`.
  - B. Per-zone tables in JS.
  - C. External JSON map manifests.
- **Suggestion:** A.

#### 2.2.3 Access tags (doors, stairs, counter front)
- **Status:** Done — A. `ZONE_TILE_TAGS` with `counter_front`, `stairs_down`, `blocked_npc`, `staff`, `apron`.
- **In plain words:** Mark special tiles so NPCs never stand on the doorway and the player knows where to click the bank.
- **Options:**
  - A. Tags on tiles: `counter_front`, `stairs_down`, `blocked_npc`, etc.
  - B. A second tiny tag grid beside the map.
  - C. Encode tags in weird tile IDs.
- **Suggestion:** A.

#### 2.2.4 NPC spawn safety check
- **Status:** Done — A + B. `assertNpcSpawnSafety` + `nudgeNpcOffTaggedTiles` (banker exempt on staff tiles).
- **In plain words:** At startup, fail a check if Elise is standing on the door or the only tile in front of the bank.
- **Options:**
  - A. Boot assert.
  - B. Auto-nudge NPCs off bad tiles.
  - C. Manual layout only.
- **Suggestion:** A (+ B as convenience).

---

## 3. Ranger and Mage — no classes, just skills and gear

**Locked idea:** You are not a “Ranger class.” If you wield a bow, you fight as ranged. If you wield a staff and cast, you fight as magic. Skills (Ranged, Magic, Attack…) grow from what you do.

### 3.1 Rules

#### 3.1.1 No class flag
- **Status:** Done — A. `heroCombatClass` from equipped weapon only.
- **In plain words:** The save file should not say “this character is a mage.” Gear and actions decide.
- **Options:**
  - A. Always derive style from the worn weapon.
  - B. Derive and cache a `stance` field for speed.
  - C. Let players pick Warrior/Ranger/Mage (rejected).
- **Suggestion:** A or B; never C.

#### 3.1.2 Melee attack styles
- **Status:** Done — custom. All styles train Attack/Defence; power skill is Strength / Ranged / Magic by weapon; Shared default splits three ways.
- **In plain words:** Accurate / Aggressive / Defensive only reshuffle melee training (Attack / Strength / Defence), like classic RuneScape.
- **Options:**
  - A. Keep that mapping.
  - B. Shared XP splits like modern OSRS.
  - C. Always train Attack only.
- **Suggestion:** A.

#### 3.1.3 Ranged needs a bow and arrows
- **Status:** Done — A (+ empty ammo = infinite wooden arrows).
- **In plain words:** No arrows in the ammo slot → you cannot shoot; the game should say so clearly.
- **Options:**
  - A. Require ammo + consume one per hit (already partly there).
  - B. Infinite bronze arrows.
  - C. Arrows only in inventory, not a worn slot.
- **Suggestion:** A.

#### 3.1.4 Magic needs a casting setup
- **Status:** Done — A (staff + Air/Mind for overworld Air Strike). Autocast later.
- **In plain words:** A staff (or chosen spell) plus the right runes; no “mage class” unlock.
- **Options:**
  - A. Staff/wand with `combatClass: magic` + runes.
  - B. Autocast with runes and no staff.
  - C. A now, autocast later.
- **Suggestion:** C.

#### 3.1.5 HUD should show what you are fighting with
- **Status:** Done — B. Labels swap to Strength / Ranger / Mage (+ Longrange / Ward); weapon line shows Bow/Staff/Melee.
- **In plain words:** The Combat tab should say “Bow” or “Staff,” not leave melee style buttons looking important when they do nothing.
- **Options:**
  - A. Label + disable melee styles when ranged/magic.
  - B. Swap labels to Rapid / Longrange / spell styles.
  - C. Hide the style row for non-melee.
- **Suggestion:** A short-term; B later.

#### 3.1.6 One damage/XP brain for overworld fights
- **Status:** Done — A. `rollOverworldDamage` + `grantStyleHitXp` shared with battle sprites.
- **In plain words:** Whether you click a goblin in the woods or an old battle screen, the same math should decide hits and skill XP.
- **Options:**
  - A. Shared helpers only.
  - B. Overworld-only forever.
  - C. Keep two systems (risky).
- **Suggestion:** A.

### 3.2 Content so players can actually try range/mage

#### 3.2.1 Ranger onboarding
- **Status:** Done — A + B. Kett + Cole; starter shortbow; infinite wooden arrows if ammo empty.
- **In plain words:** A new player should learn “buy/wield bow + arrows” from a tutor or shop, not guess.
- **Options:**
  - A. Kett mentions bows; Armsman sells the kit.
  - B. Give a starter shortbow.
  - C. Mira sells a bow kit.
- **Suggestion:** A.

#### 3.2.2 Mage onboarding
- **Status:** Done — A (+ tier staves / robes seeded). Staff + Air/Mind in shop and starter kit; staff auto-attacks via Air Strike.
- **In plain words:** Same for a basic staff and air/mind runes.
- **Options:**
  - A. Add `staff` + shop runes.
  - B. Mob rune drops only.
  - C. Full mage tier set with §4.
- **Suggestion:** A, then C over time.

---

## 4. Tool and equipment tiers

**Locked idea:** Shared ladder — wood, copper, bronze, iron, diamond, dragonite. Copper is early tools/ore; bronze is the first full fighting set. Bows and staves get matching power bands.

### 4.1 Melee / tools

#### 4.1.1 Wood
- **Status:** Done — A. Wood axe/pick/club/shield/bow/staff.
- **In plain words:** Starter junk gear so bronze feels like an upgrade.
- **Options:**
  - A. Wood axe + club/shield.
  - B. Skip wood; stay bronze-first.
  - C. Wood tools only.
- **Suggestion:** A or C.

#### 4.1.2 Copper
- **Status:** Done — A. Copper axe/pick/dagger + ore smelting path.
- **In plain words:** What you dig up early; maybe weak tools; mainly feeds bronze smelting with tin.
- **Options:**
  - A. Copper tools + ore → bronze bars.
  - B. Full copper armour set.
  - C. Ore only.
- **Suggestion:** A.

#### 4.1.3 Bronze (current default)
- **Status:** Done — A. Bronze remains early-game baseline.
- **In plain words:** Today’s normal axe, pick, sword, dagger.
- **Options:**
  - A. Keep as early-game baseline.
  - B. Retune stats when wood exists.
  - C. Rename ids to always say `bronze*`.
- **Suggestion:** A.

#### 4.1.4 Iron
- **Status:** Done — B then A light. Iron tools + iron sword in data/shop.
- **In plain words:** Next step; mining already talks about iron around level 15.
- **Options:**
  - A. Iron tools + some armour/weapons.
  - B. Tools only first.
  - C. Ore until smithing recipes exist.
- **Suggestion:** B then A.

#### 4.1.5 Diamond / 4.1.6 Dragonite
- **Status:** Done — B. Diamond/dragonite tools (+ staves); full armour sets later.
- **In plain words:** Mid and end shiny gear so the ladder has a destination.
- **Options:**
  - A. Full tools + weapons/armour each.
  - B. Tools first, armour later.
  - C. Rare drops only, no smithing.
- **Suggestion:** B, then A.

### 4.2 Ranged equivalents
- **Status:** Done — A. Wood→oak→yew→magic bows; wood/bronze/iron arrows; ammo cannot out-tier bow.
- **In plain words:** Bows get stronger woods; arrows get stronger tips. Rough map: wood bow → oak/willow ≈ bronze/iron power → yew ≈ diamond → magic bow ≈ dragonite.
- **Options:**
  - A. Full bow + ammo ladder with “ammo cannot out-tier the bow.”
  - B. One bow; only ammo tiers change damage.
  - C. Numeric power only, same art.
- **Suggestion:** A.

### 4.3 Magic equivalents
- **Status:** Done — A. Staff tiers + wizard hat/robe pieces.
- **In plain words:** Staves climb the same materials; robes give a little magic help without being a class.
- **Options:**
  - A. Staff per tier + robe pieces.
  - B. Two staves only (wood / dragonite).
  - C. Level-only magic; ignore staff tier.
- **Suggestion:** A.

### 4.4 How to build it in data
- **Status:** Done — A. `tier` / `tool` / `toolTier` + `bestOwnedTool` / `hasAnyToolKind`.
- **In plain words:** Tag every item with its tier; when chopping/mining, automatically use your best good-enough tool instead of “must be exactly the bronze axe.”
- **Options:**
  - A. `tier` / `tool` fields + `bestOwnedTool`.
  - B. Long allow-lists of item ids.
  - C. Must wield the tool (not just own it).
- **Suggestion:** A; optionally C for authenticity.

---

## 5. Same-plane layout and stairs

### 5.1 Policy

#### 5.1.1 Stay on the open map by default
- **Status:** Done — A. Shop/guild courtyard props; interiors deleted from haven.
- **In plain words:** Players should bank, shop, and quest in the courtyard they can see — not vanish into a copy-paste room — unless the story uses stairs.
- **Options:**
  - A. Move shop/guild to courtyard props; delete those interiors.
  - B. Keep interiors but only behind stair tiles.
  - C. Leave shop/guild teleports.
- **Suggestion:** A.

#### 5.1.2 Darkmine shaft
- **Status:** Done — A. `stairs_down` tag + enterChat climb line.
- **In plain words:** Going “down the mine” is the one place stairs-down makes story sense.
- **Options:**
  - A. Mark shaft entry as stairs-down + chat “You climb down…”
  - B. Remove shaft interior too.
  - C. Keep current door teleport without stairs art.
- **Suggestion:** A.

#### 5.1.3 NPCs must not block access
- **Status:** Done — A (+ B nudge). Tags + assert/nudge; Elise on staff tiles.
- **In plain words:** Nobody stands on the bank click-tile, doors, or stairs.
- **Options:**
  - A. Spawn rules + assert.
  - B. Auto-nudge.
  - C. Hand-place carefully each time.
- **Suggestion:** A.

---

## 6. Bank redesign (courtyard counter)

**Current (loop-tasks):** no bank interior; one booth tile + Elise near it.

### 6.1 Goal

#### 6.1.1 Build a real bank desk on the map
- **Status:** Done — A. `BANK_COUNTER` footprint in MapGen.
- **In plain words:** Instead of one lonely booth square, build a short counter the player walks up to, with bankers standing behind it — still outside in Emberhaven.
- **Options:**
  - A. Author a fixed counter footprint in MapGen (booth/wall/path).
  - B. Only move Elise; keep one booth tile.
  - C. Prop sprites without solid counter.
- **Suggestion:** A.

#### 6.1.2 One clear “talk to bank” spot
- **Status:** Done — A. Single `counter_front` (+ talk to Elise).
- **In plain words:** The player should always know which tile opens the bank window.
- **Options:**
  - A. Single `counter_front` interact tile.
  - B. Any tile touching the counter.
  - C. Only by clicking Elise.
- **Suggestion:** A (+ talk to Elise still works).

#### 6.1.3 Staff behind the counter
- **Status:** Done — B. Elise on staff WALL tiles behind the desk.
- **In plain words:** Elise (and maybe a clerk) stand where the player cannot walk, behind the desk.
- **Options:**
  - A. Elise + optional clerk on staff tiles.
  - B. Elise only.
  - C. No NPC; booth opens UI alone.
- **Suggestion:** A or B.

#### 6.1.4 Player cannot walk into the teller area
- **Status:** Done — A. Staff tiles are WALL (solid for hero).
- **In plain words:** The pathfinder treats “behind the desk” as blocked for you.
- **Options:**
  - A. Staff tiles solid for the hero.
  - B. Invisible blocker boxes.
  - C. Trust the player (no).
- **Suggestion:** A.

#### 6.1.5 Apron space in front
- **Status:** Done — A. Marked apron path tiles in front of the counter.
- **In plain words:** Leave a couple of empty path tiles so click-to-walk and queuing feel fair.
- **Options:**
  - A. Two-tile apron.
  - B. One-tile apron.
  - C. Open courtyard with no marked apron.
- **Suggestion:** A.

---

## 7. Suggested order of work

#### 7.1 Respect the testing block
- **Status:** Done — A. Features shipped; no suite claims while testing disabled.
- **In plain words:** Do not claim suite-green while testing is disabled.
- **Options:**
  - A. Design/implement features; defer proof.
  - B. Wait idle until testing returns.
  - C. Ask to reopen smoke-only testing.
- **Suggestion:** A for design work; C when you want proof.

#### 7.2 Same-plane shop/guild + bank counter
- **Status:** Done — A/B. Bank counter + shop/guild courtyard; haven interiors gone.
- **In plain words:** Finish the “everything visible on the town square” promise, with a proper bank desk.
- **Options:**
  - A. Bank counter first, then shop/guild.
  - B. All haven interiors removed in one pass.
  - C. Bank only; leave shop/guild teleports.
- **Suggestion:** A.

#### 7.3 Ranger / Mage clarity
- **Status:** Done — A with §4 depth. HUD styles + XP + shops/tutors.
- **In plain words:** Make bows and staves feel intentional in HUD and XP.
- **Options:**
  - A. After bank/layout.
  - B. Before layout.
  - C. Together with tiers.
- **Suggestion:** A, light touch; deeper with §4.

#### 7.4 Tier ladder
- **Status:** Done — C then A. `bestOwnedTool` + wood→dragonite tools; iron in shops.
- **In plain words:** Teach the game “best tool you own,” then add iron, then later diamond/dragonite.
- **Options:**
  - A. Data model + bronze/iron next.
  - B. All tiers at once.
  - C. Tools-only ladder first.
- **Suggestion:** C then A.

#### 7.5 Do not expand multiplayer / GE
- **Status:** Done — A. GE booth frozen (chat only); no multiplayer growth.
- **In plain words:** Even if loop-tasks checked them off, this plan will not grow online features or a real exchange.
- **Options:**
  - A. Freeze.
  - B. Later cleanup/removal.
  - C. Keep single-player toys only.
- **Suggestion:** A.

---

## Key files

- [`loop-tasks.md`](../loop-tasks.md) — feature checklist status  
- [`js/scenes/WorldScene.js`](../js/scenes/WorldScene.js) — map load, fights, interiors  
- [`js/world/MapGen.js`](../js/world/MapGen.js) — tiles, booth, interiors  
- [`js/world/Zones.js`](../js/world/Zones.js) — NPC spots, `INTERIOR_LIST`  
- [`js/data/Items.js`](../js/data/Items.js) — items, combat style, tools  
- [`js/world/OverworldCombat.js`](../js/world/OverworldCombat.js) — 0.6s combat  
- [`tests/harness.js`](../tests/harness.js), [`tests/interactions.js`](../tests/interactions.js) — written tests (run blocked)

---

## Discuss by number

Reply with an id and a letter, e.g. `6.1.1 A`, `4.1.4 B`, `5.1.1 A`.
