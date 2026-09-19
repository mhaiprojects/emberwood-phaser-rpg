# Emberwood loop tasks

Flat-file project manager for the event-paced loop. Emberwood is a Phaser 3.90.0 client-side RuneScape-like (no bundler, no Phaser 4). Each tick compares play to Old School RuneScape / classic point-and-click MMORPGs: click-to-act, skills with XP, shops, bank, gathering loops, context menus, and a persistent character.

**How a loop tick picks the next item**

1. Scan top to bottom. Do not start a new system if an earlier item in the same section is still `todo`/`verify` and blocking (e.g. do not add Magic until Prayer bury-bones works if you are in Skills).
2. Prefer the first remaining `verify` anywhere above Stretch (prove the existing action still plays). If no `verify` remains, take the next `todo`. Stretch stays last.
3. One spawned tick = one item (or that item plus its matching test). Finish game logic, UI/UX, and a test before setting `done`.
4. Statuses: `todo` (build it), `doing` (this tick), `done` (verified in play or tests), `blocked` (cannot proceed), `verify` (behavior exists — prove it).
5. Conclusion is `—` until work starts. After work, one short line of what was found or shipped. Mark `done` only after tests pass. Code review is not play verification.
6. Never re-enable Phaser keyboard. WASD/arrows stay on `js/input/Keys.js` only (`input.keyboard: false` in `js/main.js`). Keep WASD working if you touch input.
7. After a tick completes an item (`done` + tests), commit that tick's work: stage only the relevant files (never secrets), HEREDOC message focused on WHY, then `git status`. Do not push unless asked. Skip if nothing to commit. A verify-only tick still commits the test + this file + `AGENT.md`. Then run `python3 tools/loop-next.py`. Do not rewrite this whole file; update the one item you actioned and the tick log.
8. **Agents add tasks here; ticks implement one item.** New game-design / feature ideas are appended as `todo` (status + `Conclusion: —`) and are **not** built in the same pass. Event-paced ticks pick and implement one item. Exception: implement immediately only if the user says so (“implement now”, “fix this bug”, “redo this code”) or the change is process/docs (`AGENT.md` / this file’s format). When the user describes a feature, write well-specified items (and related follow-ups), then stop.
9. **Parent coordinator (spawn vs skip).** Cadence is **event-paced**: wake on git commit (worker finished) or an **8–10 minute** heartbeat if the worker died. Parent reads **`loop-next.md` + `git status` only** — do not paste `AGENT.md` or this file into the Task prompt. Spawn **one** worker for item #1 when Busy is empty. If `doing` is set, **skip with no user-facing essay** (do not spawn). Task prompt ~15 lines: item, files, one test name, live `http://127.0.0.1:<port>/`. Default test is `/tests/run.html?only=<substring>` (full suite only for shared-file ticks). **Do not** `open_resource` / Glass every tick. Close browsers, MCP tabs, and any `http.server` PID **this tick started** when the tick finishes.

**Last updated:** 2026-09-16 — Process: event-paced loop; `loop-next.md` tick card; targeted `?only=` tests; no Glass unless asked.

**Total tasks: 294** (289 in the 14 playable sections + 5 stretch). All unique.

---
## 1. Core movement / camera / input (27)

- [done] W walks the hero north from Emberhaven spawn via `Keys.js` only (no Phaser cursors). — Conclusion: From Emberhaven spawn (320,240), W via Keys.js walks north (~35px/400ms, x stays, `up` anim); Phaser keyboard stays off. Suite 31/31.
- [done] A / S / D walk west / south / east from spawn the same way. — Conclusion: From spawn (320,240), A/S/D via Keys.js walk west/south/east (~34.5px/400ms, no axis drift, left/down/right anim); Phaser keyboard stays off. Suite 32/32.
- [done] ArrowUp / ArrowDown / ArrowLeft / ArrowRight walk in all four directions. — Conclusion: From spawn (320,240), ArrowUp/Down/Left/Right via Keys.js walk N/S/W/E (~34.5px/400ms, no drift, matching anim); Phaser keyboard stays off. Suite 32/32.
- [done] WASD still walks after clicking every HUD tab (F1–F8) and that the focused button is blurred. — Conclusion: Real click on all 8 tabs blurs each button (`activeElement` body, not `:focus`); then W/A/S/D still walk (~36px, Phaser keyboard off). Suite 32/32.
- [done] Holding two opposite keys does not jitter or leave a stuck velocity after keyup. — Conclusion: A+D / W+S / arrow opposites cancel (stay near spawn, no sign flip); both keyup leaves vx=vy=0; leftover A after D-up walks west. Phaser keyboard off. Suite 33/33.
- [done] Diagonal move (W+D or arrows) is speed-normalized to 90px (WorldScene renormalizes velocity). — Conclusion: W+D and ArrowUp+Right via Keys.js renormalize to mag=90 (vx/vy ±63.64, not √2-boosted); Phaser keyboard off. Live from spawn (328,248) → (337.5,238.5). Suite case pass.
- [done] Click-to-walk sets `walkTarget` and shows the yellow 6×6 marker at the world pointer. — Conclusion: Click from spawn (328,248) sets walkTarget + yellow marker + purple A* line. Suite 49/49.
- [done] Arriving within 6px of the click target stops the body and hides the marker. — Conclusion: Short courtyard path arrives, marker and purple line hide. Suite path-arrive case pass.
- [done] Starting WASD/arrows cancels click-to-walk, clears `talkTarget`, and hides the marker. — Conclusion: Keys.js W cancels walkTarget/walkPath, hides marker + purple line; Phaser keyboard off. Suite case pass.
- [done] World clicks are ignored while `encounterLock`, `Hud.mode === 'battle'`, or title. — Conclusion: From spawn (328,248) unlocked click sets walk + yellow marker + purple line; encounterLock / `Hud.mode === 'battle'` / title ignore ground, chicken, and Bram clicks. Phaser 3.90 keyboard off. Suite 53/53.
- [done] Camera `startFollow` (0.12, 0.12), `roundPixels`, and bounds equal the current tilemap size. — Conclusion: From spawn (328,248) startFollow player lerp 0.12/0.12, roundPixels, bounds 576×448 (=36×28×16) in haven+Northwood; W midY follows. Phaser 3.90 keyboard off. Dedicated case pass; suite 53/53.
- [done] `collideWorldBounds` keeps the player on the map except via the 14px exit strips. — Conclusion: From spawn (328,248) collideWorldBounds on, physics bounds 576×448. Locked east D stays in haven (body right ≤576). Graves west 14px strip does not wrap. East strip enters Millfields. Phaser 3.90 keyboard off. Dedicated case pass; suite 54/54.
- [done] `window` blur clears `Keys.down` / `Keys.pressed` so a held key cannot walk after alt-tab. — Conclusion: From spawn (328,248) W via Keys.js walks north; window blur clears Keys.down/pressed (empty, moving false); vx/vy stop (no stuck walk); fresh D still walks. Phaser 3.90 keyboard off. Dedicated case pass; suite 55/55.
- [done] Space is not `preventDefault`’d on the title or death overlays (`Keys.shouldBlockBrowser`). — Conclusion: From spawn (328,248) world Space is preventDefault; title and death overlays `shouldBlockBrowser` false and Space not preventDefault. Phaser 3.90 keyboard off. Dedicated case pass; suite 56/56.
- [done] Player world scale is **1 tile** after every `enterZone` (body 12×14, not the old 1.5×). — Conclusion: `PLAYER_WORLD_SCALE` 1, body 12×14 reapplied in `placePlayer`/`enterZone`; battle scale stays 3. Suite 35/35.
- [done] Idle animation stops on the last facing frame (left/right/up/down) instead of a random frame. — Conclusion: From spawn (328,248) W/A/S/D via Keys.js idle snaps to frames 2/1/0/1 (right flipX); not mid-stride 6/7/8/12/13/14. Phaser 3.90 keyboard off. Dedicated case pass; suite 57/57.
- [done] Esc / click-self to cancel walk (OSRS-style cancel). — Conclusion: From spawn (328,248) Esc via Keys.js and click-self clear walkTarget/walkPath, hide marker + purple line; nearby ground still walks. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1; WASD cancel 1/1.
- [done] Walk vs run toggle and a run-energy bar that drains while running and restores while walking/idle. — Conclusion: From spawn (328,248) Ctrl/HUD toggle run 180 vs walk 90; energy drains while running and restores while walking/idle; 0 energy refuses run. Phaser 3.90 keyboard off. Dedicated + WASD cancel 1/1.
- [done] Click pathfinding around TREE / ROCK / WATER / SHRINE instead of sliding along collision. — Conclusion: Tile A* in Pathfind.js; 8-dir no corner-cut; same solids as arcade. Soft-avoid NPC/mob tiles; purple 2px line. Suite 49/49.
- [done] Click-to-walk pathing: A* (or equivalent) to the clicked tile; thin purple line along the path; avoid TREE/ROCK/WATER/SHRINE plus NPC/mob bodies when possible; thread 1-tile doors/entrances; line updates while walking and clears on arrive or WASD/Esc cancel. — Conclusion: walkPath + pathGfx 0xaa66ff; gate (23,15) and house door (11,10); WASD hides line. Suite 49/49.
- [done] Right-click “Walk here” on the ground (context menu; left-click stays walk). — Conclusion: From spawn (328,248) left-click still walks; right-click ground opens HTML Walk here (no immediate walk); choosing it sets walkTarget + yellow marker + purple A* line; lock/battle ignore; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Minimap cell click starts a purple walk path toward that land / the matching zone exit. — Conclusion: From spawn (328,248) Millfields/Northwood/Graves minimap clicks set walkTarget + yellow marker + purple A* line toward the east/north/west exits; current cell no-ops; lock/battle/title ignore; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] If a mob parks on the only corridor, wait or stop adjacent instead of walking through them. — Conclusion: From spawn (328,248) a chicken on the only corridor (gate 23,15) makes click-to-walk wait adjacent instead of walking through; after the mob moves, A* resumes through the gate. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Keep `game.input.keyboard === false` after any input change; add a regression test for it. — Conclusion: —
- [todo] A visible destination X (OSRS yellow X) instead of / in addition to the tiny rectangle marker. — Conclusion: —
- [done] `Keys.typing` ignores future chat `<input>` so typing “west” does not walk. — Conclusion: From spawn (328,248) focused chat `<input>` typing “west” does not record KeyW/KeyS or walk; textarea/select/contentEditable also ignored; after blur W still walks. Phaser 3.90 keyboard off. Dedicated case pass; suite 60/60.
- [done] Pointer click-to-move still works when the canvas is not focused (HUD click then world click). — Conclusion: From spawn (328,248) Inv tab click leaves canvas unfocused; pointerdown still sets walkTarget + yellow marker + purple A* line and walks west. Phaser 3.90 keyboard off. Dedicated case pass; suite 59/59.

## 2. World / zones / collision / map (32)

- [done] The nine lands exist and match the 3×3 grid: Graves, Northwood, Highlands, Westmead, Emberhaven, Millfields, Darkmine, Southshore, Mirefen. — Conclusion: ZONE_LIST is 9 cells at gx,gy −1..1 (Graves/Northwood/Highlands, Westmead/Emberhaven/Millfields, Darkmine/Southshore/Mirefen); zoneByGrid + minimap 3×3 match; from spawn (328,248) each enter updates HUD. Phaser 3.90 keyboard off. Dedicated case pass.
- [done] Walking off a path at N/S/E/W enters the neighbor and chat logs `You enter {name}.` — Conclusion: From spawn (328,248) Keys.js D/A/W/S off the 14px PATH strip enter Millfields/Westmead/Northwood/Southshore and chat `You enter {name}.`; 1px inside stays haven. Phaser 3.90 keyboard off. Dedicated case pass; suite 60/60.
- [done] Outer edges of corner zones do **not** wrap (no neighbor → no `enterZone`). — Conclusion: From spawn (328,248) Graves/Highlands/Darkmine/Mirefen outer 14px strips: neighborId null, zoneByGrid no wrap, checkExits does not enterZone; Keys.js walk stays; Phaser 3.90 keyboard off. Dedicated case pass; suite 61/61.
- [done] `spawnPointForEntry` places the player on the opposite side (enter from north → spawn near south). — Conclusion: From spawn (328,248) n/s/w/e → (288,400)/(288,48)/(528,224)/(48,224) south/north/east/west; enterZone + Keys.js walk land on the opposite side. Phaser 3.90 keyboard off. Dedicated case pass; suite 62/62.
- [done] `exitLock` (~400ms) prevents skipping a zone in one dash. — Conclusion: From spawn (328,248) haven east strip → Millfields sets exitLock; north/west strips cannot skip to Highlands/haven while locked; lock holds ~220ms and clears ~400ms; Keys.js D then W during lock stays Millfields; after unlock W enters Highlands. Phaser 3.90 keyboard off. Dedicated case pass; suite 66/66.
- [done] `enterZone` destroys the old tilemap, colliders, NPCs, mobs, float labels, and ground loot. — Conclusion: From spawn (328,248) enterZone() and Keys.js W haven→Northwood destroy old Phaser 3 tilemap/ground/collider, Bram/chickens/labels, and ground loot; Northwood rebuilds Kett+goblins. Phaser 3.90 keyboard off. Dedicated case pass; suite 67/67.
- [done] TILE.WATER / TREE / ROCK / SHRINE collide; GRASS / GRASS2 / PATH / FLOWER do not. — Conclusion: From spawn (328,248) setCollision + tile.collides + Pathfind match: TREE/ROCK/SHRINE block Keys.js walks in haven; WATER blocks in Southshore; GRASS/GRASS2/PATH/FLOWER are entered. Phaser 3.90 keyboard off. Dedicated case pass; suite 64/65 (enterZone doing case failed).
- [done] Emberhaven houses have a walkable door tile on the south wall (`house()` last-row PATH). — Conclusion: From spawn (328,248) `house()` last-row mid is PATH; all 3 Emberhaven cottages have south-wall doors (11,10)/(25,11)/(15,20); Keys.js W walks in, adjacent ROCK blocks. Phaser 3.90 keyboard off. Dedicated case pass; suite 66/66.
- [done] Biome scatter still looks like the biome (forest trees, mine rocks, swamp water, shore water band, grave rocks, farm flowers). — Conclusion: From spawn (328,248) forest TREE>plains, mine ROCK>40, swamp inland WATER, shore south band, grave ROCK, farm FLOWER>forest. Scatter hash no longer collapses to 3 cells. Phaser 3.90 keyboard off. Dedicated case pass; suite 68/68.
- [done] HUD zone title and minimap `is-here` update on every transition. — Conclusion: From spawn (328,248) Keys.js D/A/W/S off the PATH strip update `#hud-zone` + one `.is-here` to Millfields/Westmead/Northwood/Southshore; enterZone Graves/Highlands/Darkmine/Mirefen too. Phaser 3.90 keyboard off. Dedicated case pass; suite 68/68.
- [done] Default spawn (20,15 tiles) and edge spawns do not start the player inside a solid tile. — Conclusion: From spawn (328,248) tile (20,15) is PATH; 24 directed edge landings stay off WATER/TREE/ROCK/SHRINE; Keys.js W walks from courtyard and Northwood south-edge. Phaser 3.90 keyboard off. Dedicated case pass; suite 69/70 (tilemap doing case failed).
- [done] Map is 36×28 tiles at 16px via Phaser 3 `make.tilemap` + `createLayer` (not Phaser 4). — Conclusion: From spawn (328,248) all 9 lands are 36×28×16 via `make.tilemap` + `map.createLayer` (TilemapLayer, ARRAY_2D, 576×448); scene has no Phaser 4 `createLayer`. Keys.js W still walks. Phaser 3.90 keyboard off. Dedicated case pass; suite 70/71 (adj12 doing case failed).
- [todo] Click-minimap to open a world-map panel (or stop using `<button>` if cells are display-only). — Conclusion: —
- [todo] A world-map panel listing all nine lands, biome, and danger (chickens vs drakes). — Conclusion: —
- [todo] Persist mob alive/dead/respawn timers when leaving a zone and returning (currently full respawn). — Conclusion: —
- [todo] Persist ground loot when leaving a zone (currently `clearLoot` wipes it). — Conclusion: —
- [todo] Enterable interiors (bank, shop, guild hall) as a second tilemap or indoor scene. — Conclusion: —
- [todo] Examine on scenery: tree, rock, shrine, water, house wall. — Conclusion: —
- [todo] Darkmine “lower shaft” as a second mine room (Miner Corb already mentions it). — Conclusion: —
- [todo] Add interactable town props in Emberhaven: stall, range, anvil, bank booth (even if some start as examine-only). — Conclusion: —
- [todo] Add Southshore dock / boat scenery and Restless Graves tomb markers as examine objects. — Conclusion: —
- [done] Walking the 12 existing adjacencies (haven↔all four, plus the ring) does not soft-lock or spawn in water. — Conclusion: From spawn (328,248) Keys.js walks all 24 directed edges (12 adjacencies both ways). Lands stay on-map and off WATER; inward walk does not bounce. `placePlayer` now `body.reset` + camera `centerOn` so east/south entries no longer fling off-map. Phaser 3.90 keyboard off. Dedicated case pass; suite 74/74.
- [done] Player body = 1 tile; squeeze through the Emberhaven 1-tile courtyard gate. — Conclusion: From spawn (328,248) D via Keys.js to x=388 (past gate tile 23,15); rock beside the door still blocks (x=362). Suite 35/35 + Playwright.
- [done] Click-to-walk pathing through 1-tile corridors (do not slide off the door tile). — Conclusion: A* threads courtyard gate (23,15) and house south-wall door (11,10); no corner-cut through frames. Suite gate-path case pass.
- [todo] Diagonal door entry (W+D into a 1-tile gap without catching the frame). — Conclusion: —
- [todo] Closed/locked doors + keys. — Conclusion: —
- [todo] Door open/close animation. — Conclusion: —
- [todo] Examine door (flavor text on the courtyard gate and house doors). — Conclusion: —
- [done] Giant mobs (drake) occupy more than 1 tile (sprite + 28×28 body). — Conclusion: Drake world scale 2, display 48px, body 28×28; not required to fit 1-tile interiors. Suite 35/35.
- [todo] Giant mobs block 2×2 (or more) and cannot enter 1-tile interiors. — Conclusion: —
- [todo] Agility shortcuts vs doors (level-gated squeeze / climb beside a locked door). — Conclusion: —
- [todo] Collision debug overlay (toggle arcade body + colliding tiles). — Conclusion: —

## 3. NPCs — talk, examine, trade, quests (24)

- [done] Left-click NPC sets `talkTarget`, walks in, and `tryTalk` fires within 22px. — Conclusion: Click Bram sets talkTarget + walkTarget; 23px still approaching (vx west); 21px tryTalk fires (Bram briefing, quest stage 1). Suite 35/35.
- [done] Space talks to the nearest NPC within 28px when standing next to them. — Conclusion: Keys.js Space talks at 27px (Rowan); no talk at 28/29px; two in range picks nearer Bram. Phaser keyboard off. Suite 38/38.
- [done] Clicking an NPC clears `engageTarget` (no accidental fight). — Conclusion: Click chicken then Bram: engageTarget null, tryAutoEngage false beside the chicken, Bram talks, no BattleScene. Auto-attack off. Suite 36/36.
- [done] Guildmaster Bram stage 0 accepts the goblin militia quest and updates HUD/journal. — Conclusion: From spawn (328,248) tryTalk Bram stage 0 → stage 1, gold stays 8, HUD+journal `Kill goblins in Northwood (0/5).`, briefing chat. Phaser 3.90 keyboard off. Suite 49/49 + Playwright.
- [done] Bram stage 1 reports `{progress} of 5 goblins` and does not pay. — Conclusion: From spawn (328,248) stage-1 talk reports `0 of 5` then `3 of 5 goblins down. Keep at it.`; gold stays 8 and XP unchanged; HUD+journal stay `0/5` then `3/5`; no pay. Phaser 3.90 keyboard off. Dedicated case pass.
- [done] Bram stage 2 pays 50 gold + 40 combat XP, sets stage 3, and levels if needed. — Conclusion: From spawn (328,248) stage-2 talk pays 50 gold (8→58) + 40 combat XP (0→40), sets stage 3, and levelHero 1→2 (maxHp 110, damage 18); already-level-5 hero still pays but does not level. Phaser 3.90 keyboard off. Dedicated case pass; suite 72/73 (adj12 doing case failed).
- [done] Bram stage 3+ uses the post-quest line only. — Conclusion: From spawn (328,248) stage-3 and stage-4 tryTalk each emit only `Guildmaster Bram: Emberhaven stands because of you.`; gold stays 8, XP 0, stage unchanged; HUD+journal stay `Militia task complete. Explore the nine lands.`; no briefing/progress/pay. Phaser 3.90 keyboard off. Dedicated case pass; suite 74/74.
- [done] Banker Elise restores HP to max for **0** gold. — Conclusion: From spawn (328,248) Elise (160,130) heals 40→100 and 22→max at 0 gp; gold/XP/coin stack unchanged; HUD HP 100/100. Phaser 3.90 keyboard off. Dedicated case pass; suite 74/74.
- [done] Fen Witch refuses below 10 gold (`Come back with 10 gold`) and does not heal. — Conclusion: From spawn (328,248) Mirefen Witch (200,180) at 0/8/9 gp chats `Fen Witch: Come back with 10 gold.`; HP/gold/coins/XP unchanged; no heal line. Phaser 3.90 keyboard off. Dedicated case pass.
- [done] Fen Witch at ≥10 gold heals to max and removes 10 coins via `takeItem`. — Conclusion: From spawn (328,248) Mirefen Witch (200,180) at 10/11/18 gp heals wounded HP to 100, `takeItem` removes 10 coins (gold + stack stay in sync), HUD 100/100, heal line, no refuse. Phaser 3.90 keyboard off. Dedicated case pass; suite 75/75.
- [done] Flavor NPCs (Rowan, Kett, Willa, Ned, Sila, Wisp, Corb, Ola) each emit `{Name}:` plus one of their lines. — Conclusion: From spawn (328,248) Rowan/Kett/Willa/Ned/Sila/Wisp/Corb/Ola each emit `{Name}:` plus both of their lines (Between 0..1). Not healers/Bram. Phaser 3.90 keyboard off. Dedicated case pass; suite 76/76.
- [done] Every `NPC_DEFS` entry spawns at its x,y with a yellow name label. — Conclusion: From spawn (328,248) all 11 NPC_DEFS entries spawn at def.x/y with yellow `#ffe08a` name labels (not salmon mob `#ffb0a0`). Phaser 3.90 keyboard off. Dedicated case pass; suite 77/77.
- [done] Player–NPC arcade collider is immovable and does not shove NPCs around. — Conclusion: From spawn (328,248) NPC group defaults immovable, player–NPC collider stays active after enterZone. Keys.js D/S into Rowan/Bram/Kett leaves them at 252,168 / 210,150 / Northwood; player does not pass through. Phaser 3.90 keyboard off. Dedicated case pass + Playwright.
- [todo] Click-to-continue multi-page dialogue instead of a single chat line. — Conclusion: —
- [todo] Dialogue option buttons (Talk / Trade / Bank / Quest) where the NPC supports them. — Conclusion: —
- [todo] Examine on NPCs (right-click or long-press) with a short flavor sentence each. — Conclusion: —
- [todo] A Shopkeeper in Emberhaven and a Trade window (see Shops). — Conclusion: —
- [todo] Convert Elise from heal-only to a **bank booth** (deposit / withdraw); keep free heal as a separate Nurse or a bank option. — Conclusion: —
- [todo] Quest-giver head icons (blue star / gold compass) over Bram until the militia task is done. — Conclusion: —
- [todo] Walk-away to close dialogue; do not talk through TREE/ROCK walls. — Conclusion: —
- [todo] Give Fisher Ned / Miner Corb / Farmer Willa / Ranger Kett tutor lines that unlock or explain fishing, mining, cows, and combat styles. — Conclusion: —
- [todo] NPC idle facing and a tiny wander leash so they are not statues. — Conclusion: —
- [todo] Add a cook / priest / shopkeeper as original CC0 SVGs (extend `tools/generate_svgs.py`, do not use commercial packs). — Conclusion: —
- [done] Talking never starts during `Hud.mode === 'battle'` or `encounterLock`. — Conclusion: From spawn (328,248) unlocked tryTalk still speaks; encounterLock and `Hud.mode === 'battle'` keep tryTalk + Keys.js Space silent (no gold/XP/stage change); talk works after unlock. Phaser 3.90 keyboard off. Dedicated case + Playwright; suite 79/79.

## 4. Combat — styles, auto-retaliate, targeting, flee, death (32)

- [done] Left-click a living mob sets `engageTarget`, walks in, and chats `You target the {Type}.` — Conclusion: From spawn (328,248) click Chicken (400,250): engageTarget + walkTarget/marker, chat You target the Chicken, vx=90 east (72px, no fight yet). Dead mob ignored. Phaser 3.90 keyboard off. Suite 39/39.
- [done] Walking within 24px of `engageTarget` calls `beginFight` (camera shake, 260ms, `BattleScene`). — Conclusion: From spawn (328,248) click Chicken (400,250): no fight at exactly 24px; at 23px beginFight (shake 220ms, walk cleared, lock); BattleScene after ~260ms. Auto-attack off. Phaser 3.90 keyboard off. Suite case pass + Playwright.
- [done] Auto-attack **on** engages the nearest living mob within 20px after `engageGrace`. — Conclusion: From spawn (328,248) auto-attack on: engageGrace blocks at 19px; exactly 20px does not fight; a dead mob at 10px is skipped; nearest living chicken at 10px (not 19px) begins BattleScene. Phaser 3.90 keyboard off. Dedicated case + Playwright; suite 80/80.
- [done] Auto-attack **off** does not engage unless the player clicked that mob. — Conclusion: From spawn (328,248) auto-attack off, living chicken at 10px, no engageTarget: tryAutoEngage false, no BattleScene. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] `engageGrace` is ~800ms on zone enter and ~700ms after returning from battle. — Conclusion: From spawn (328,248) enterZone remaining ~800ms blocks auto-attack at 10px; wake/flee remaining ~700ms blocks re-aggro; Phaser 3.90 keyboard off. Dedicated case + Playwright; ?only=engageGrace 2/2.
- [done] Attack on a single foe auto-selects index 0 and deals damage (variance −2..+2, min 1). — Conclusion: startBattle/autoSelectTarget pick index 0; takeDamage uses Between(-2,2) min 1. Playwright from spawn (328,248) drop=16; dedicated suite case pass. Phaser 3.90 keyboard off.
- [done] Clicking a foe in the HTML battle list on your turn selects and strikes that index. — Conclusion: On player turn, `#battle-enemies` `.enemy-btn` click (`onEnemyPicked` without `fromSprite`) sets `targetIndex` and strikes that foe; the other stays full. Phaser 3.90 keyboard off. Dedicated case + Playwright; ?only=manual list click 1/1.
- [done] Canvas click on a foe selects (`fromSprite`) without striking unless `selectingEnemy`. — Conclusion: canvas `pointerdown`/`fromSprite` cow selects no strike; Attack hits cow; `selectingEnemy` fromSprite strikes; goblin full; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1
- [done] The gold target rectangle follows the selected living enemy and hides when they die. — Conclusion: Gold 0xf0d060 rect follows selected living foe (canvas cow + move) and hides on die(); reselect shows again; last death hides. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1
- [done] Accurate → Attack XP, Aggressive → Strength XP, Defensive → Defence XP on a **win**. — Conclusion: From spawn (328,248) Accurate/Aggressive/Defensive chicken wins grant Attack/Strength/Defence +4 XP; other melee skills stay 0. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Hitpoints XP on win is `ceil(mobXp / 3)` (minimum 1). — Conclusion: From spawn (328,248) chicken wins grant Hitpoints `ceil(mobXp/3)` min 1 (1→+1, 2→+1, 4→+2, 5→+2, 10→+4 from 1154). Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Eat food in combat uses shrimp then bread (`eatBestFood`), heals, consumes one, and spends the turn. — Conclusion: On player turn, Eat food calls `eatBestFood` (shrimp then bread): heals 12/20, consumes one, `queueTurn(800)`. Full HP does not spend the turn. Phaser 3.90 keyboard off. Dedicated case + Playwright; ?only=Eat food uses 1/1.
- [done] Eat at full HP does not consume food and returns the turn. — Conclusion: From spawn (328,248) full-HP Eat food chats already at full health, shrimp/bread qty unchanged, `waitingForPlayer` stays true, busy false. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Eat with no food chats `You have no food.` and returns the turn. — Conclusion: damaged no-food Eat chats `You have no food.`, HP/inventory unchanged, waitingForPlayer true, busy false; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1
- [done] Run succeeds on `Between(0,99) < 70`, chats run/break-away, outcome `flee`, no XP/loot. — Conclusion: spawn (328,248) Between(0,99) return 0 succeeds; chats run/break-away; outcome flee; no XP/loot; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1.
- [done] Run fail chats `You fail to get away!` and the enemy still gets a turn. — Conclusion: spawn (328,248) Between(0,99) return 70 fails; chats `You fail to get away!`; enemy still attacks; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1
- [done] Player death shows `#dead-overlay` “You are dead”, `Hud.mode === 'dead'`, and combat level in the subtitle. — Conclusion: done — lose starts GameOverScene; `#dead-overlay` “You are dead”, `Hud.mode === 'dead'`, `#dead-text` Combat level N; retry returns to title; Phaser 3.90 keyboard off; Playwright 1/1 —
- [done] Return to title stops scenes and shows `#title-overlay` again. — Conclusion: Return to title stops World/Battle/GameOver, only TitleScene + `#title-overlay`; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1
- [done] HP bars go green / amber / red at 65% and 35% and that ± floaters appear on hit/heal. — Conclusion: Spawn (328,248) HUD+battle bars green ≥65% / amber ≥35% / red <35%; − hit and + heal floaters. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Worn sword/shield are **display-only** today; then apply weapon `damage` and shield `defence` to the hit formula. — Conclusion: Equip tab shows Bronze sword / Wooden shield names only; hit uses `hero.damage` + Between(-2,2) min 1, not `ITEM_DB.sword.damage` 16 or `shield.defence` 1. Spawn (328,248); Phaser 3.90 keyboard off; dedicated case + Playwright 1/1.
- [todo] Reconcile `levelHero` (combat XP / 40) with `gainSkillXp` / `maxHp = 10 * hitpoints` so one combat-level rule wins. — Conclusion: —
- [todo] OSRS-like combat level from Attack, Strength, Defence, Hitpoints, Prayer, Ranged, Magic. — Conclusion: —
- [todo] Auto-retaliate as a setting **separate** from world auto-engage. — Conclusion: —
- [todo] After flee, push the player off the mob and extend `engageGrace` so auto-attack does not instantly re-aggro. — Conclusion: —
- [todo] Eat-from-inventory in combat (choose shrimp vs bread) instead of only `eatBestFood`. — Conclusion: —
- [done] Each mob type’s world/battle scale (chicken/crab/bat 0.75, goblin/skeleton/slime 1, cow 1.25, giant drake multi-tile) and `PLAYER_BATTLE_SCALE` 3. — Conclusion: World player is 1 tile; drake body 28×28; battle player stays 3. Suite 35/35.
- [done] Dead overworld mob hides ~18s then respawns in place with label and body re-enabled. — Conclusion: spawn (328,248) haven chicken hides body+label+body.enable; 18000ms timer still dead ~400ms early, then respawns in place with label+body; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1.
- [done] Mob wander uses occasional small velocity and still collides with the ground layer. — Conclusion: From spawn (328,248) wanderMobs rolls Between(0,80); miss leaves vx=vy=0; hit sets small vx/vy in −20..20; chicken still blocked by ground TREE. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Hit-splats and a 0.6s tick later; until then keep turns but document the 900ms queue. — Conclusion: —
- [todo] Death rules: gravestone or safe-death keep items; respawn in Emberhaven at low HP instead of wiping to title (title retry can remain as “abandon”). — Conclusion: —
- [todo] Disable Attack / Eat / Run while `busy` or not player-turn (already intended — verify no double-queue). — Conclusion: —
- [todo] A simple combat triangle hook (melee vs the unused Ranged/Magic skills) without adding Phaser 4. — Conclusion: —

## 5. Inventory / equipment / bank (22)

- [done] The inventory grid is 28 slots and starting kit is 8 coins, bronze sword, wooden shield, 8 shrimp, 3 bread. — Conclusion: Live Inv + suite: 28 slots (5 filled: 8 coins, Bronze sword, Wooden shield, 8 shrimp, 3 bread; 23 empty). Phaser 3.90 keyboard off. Dedicated case pass.
- [done] Click shrimp at full HP chats `already at full health` and does not consume. — Conclusion: From spawn (328,248) full-HP Inv click shrimp chats already at full health, qty unchanged, HP 100; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Click shrimp at low HP heals 12 (capped) and decrements the stack. — Conclusion: From spawn (328,248) Inv click shrimp at 70 HP heals 12→82 and at 95 caps at maxHp 100; qty −1 each; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Click bread heals 20 (capped) and decrements the stack. — Conclusion: From spawn (328,248) Inv click bread at 70 HP heals 20→90 and at 85 caps at maxHp 100; qty −1 each; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Click coins / sword / shield / bones only logs the item name (no crash). — Conclusion: From spawn (328,248) Inv click coins/sword/shield/bones logs Coins./Bronze sword./Wooden shield./Bones.; qty/HP/gold unchanged; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] `addItem('coins')` increments `hero.gold` and `syncCoins`; `takeItem('coins')` decrements both. — Conclusion: From spawn (328,248) addItem coins +5/+1 and takeItem −3/−1 keep hero.gold, syncCoins stack, and HUD gold in sync. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Stacks merge by `id` and a stack is removed when `qty` hits 0. — Conclusion: From spawn (328,248) addItem merges shrimp/bones by id (one stack); takeItem last bones and eat last shrimp/bread drop the stack; last coins drop too. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] A hard 28-stack inventory cap: loot / shop buy / gather refuse with `inventory full`. — Conclusion: —
- [todo] Drop-to-ground from inventory (creates `groundLoot` at the player). — Conclusion: —
- [todo] Shift-click drop once a Settings toggle exists (OSRS default). — Conclusion: —
- [todo] Wear / Wield / Remove for `sword` (weapon) and `shield` (shield) and refresh the Worn tab. — Conclusion: —
- [todo] Apply equipped weapon `damage` and shield `defence` in `Unit.attack` / `takeDamage`. — Conclusion: —
- [todo] Expand worn slots toward OSRS: head, cape, neck, ammo, weapon, body, shield, legs, hands, feet, ring (empty slots OK). — Conclusion: —
- [todo] An equipment-stats readout (melee +defence at minimum). — Conclusion: —
- [todo] Item examine text on each `ITEM_DB` entry. — Conclusion: —
- [todo] Left-click defaults per item: eat food, wield gear, bury bones, drop junk. — Conclusion: —
- [todo] Load `item-sword` and `item-shield` in `BootScene` (currently only coins/bones/shrimp/bread) so ground drops can show them. — Conclusion: —
- [todo] Banker Elise deposit / withdraw / withdraw-X / withdraw-all with a  bank chest UI. — Conclusion: —
- [todo] Bank search and at least two tabs (once bank exists). — Conclusion: —
- [todo] Block Use in world while `Hud.mode === 'battle'` (already: “Use Eat food on your combat turn”) — verify. — Conclusion: —
- [todo] Use-item-on (raw on fire, bones on shrine) as a target cursor. — Conclusion: —
- [todo] Item value fields used by shops and a later High Alch. — Conclusion: —

## 6. Skills (22)

- [done] Skills tab lists Attack, Strength, Defence, Hitpoints, Ranged, Prayer, Magic, Cooking, Fishing, Woodcutting, Mining, Crafting with icons. — Conclusion: Live Skills tab shows all 12 names with loaded `assets/svg/skills/{id}.svg` icons (32px); dedicated suite case pass. Phaser 3.90 keyboard off.
- [done] Start: Hitpoints 10 / 1154 XP / 100 HP; every other skill 1 / 0 XP. — Conclusion: From spawn (328,248) makeHero Hitpoints 10/1154 XP, HP 100/100, other 11 skills 1/0; Skills tab + side HUD match. Phaser 3.90 keyboard off. Dedicated case pass; suite 52/52.
- [done] `gainSkillXp` level curve `1 + floor(sqrt(xp / 50))` and Hitpoints never below 10. — Conclusion: From spawn (328,248) `gainSkillXp` is `1 + floor(sqrt(xp / 50))`; Attack 50→2, Strength 200→3; 1154 XP curves to 5 but Hitpoints stays ≥10. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] A Hitpoints level-up sets `hero.maxHp = 10 * level` and chats `{Skill} increased to N.` — Conclusion: From spawn (328,248) Hitpoints 10/1154/100; 5000 XP → 11, maxHp 110, chat `Hitpoints increased to 11.`; 6050 → 12 / 120; Attack 2 chats `Attack increased to 2.` without changing maxHp. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Show current XP and XP-to-next on skill-row hover or click. — Conclusion: —
- [todo] An XP drop floater (OSRS-style number + skill icon) on gain. — Conclusion: —
- [todo] A level-up modal / fanfare in chat (not only one log line). — Conclusion: —
- [todo] Train Attack / Strength / Defence from **hits**, not only kills (partial XP per successful attack). — Conclusion: —
- [todo] Train Hitpoints on each successful melee hit, not only on win. — Conclusion: —
- [todo] Ranged: shortbow + bronze arrows, ammo slot, Ranged XP, ammo consume. — Conclusion: —
- [todo] Prayer XP by burying bones from inventory (see Gathering / Prayer). — Conclusion: —
- [todo] Magic XP via Wind Strike (air + mind runes) from the Magic panel. — Conclusion: —
- [todo] Cooking XP via raw food on a fire or range. — Conclusion: —
- [todo] Fishing XP at Southshore spots. — Conclusion: —
- [todo] Woodcutting XP on Northwood trees. — Conclusion: —
- [todo] Mining XP on Darkmine rocks. — Conclusion: —
- [todo] Crafting XP (cowhide → leather, or string + leather). — Conclusion: —
- [todo] Show skill total and a single derived combat level on the side HUD (replace the ambiguous `hero.level`). — Conclusion: —
- [todo] Gate resources by level (e.g. copper/tin 1, iron 15) with a clear “You need level N” chat. — Conclusion: —
- [todo] After the first six gathering skills work, add **one** extra that fits: Firemaking or Smithing (not a full 23-skill dump). — Conclusion: —
- [done] Skill icons resolve under `assets/svg/skills/{id}.svg`. — Conclusion: From spawn (328,248) `skillIcon(id)` is `assets/svg/skills/{id}.svg`; all 12 Skills-tab icons + side HUD Hitpoints fetch 200 SVG and decode. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Keep unused stretch skills (Agility, Thieving, Slayer, Runecraft, Hunter, Farming, Herblore, Fletching, Construction) listed only as later backlog items — do not stub empty tabs. — Conclusion: —

## 7. Gathering / processing / skilling loops (20)

- [todo] Clickable fishing spots in Southshore; Fisher Ned explains the net. — Conclusion: —
- [todo] Catch raw shrimp (or equivalent) with a success roll, Fishing XP, and a 3–5s action that cancels on walk/combat. — Conclusion: —
- [todo] Require a small fishing net (shop or starter) and chat `You need a fishing net` without one. — Conclusion: —
- [todo] Clickable trees in Northwood; chop with a bronze axe for logs + Woodcutting XP; tree respawns. — Conclusion: —
- [todo] Clickable rocks in Darkmine; mine copper/tin with a bronze pickaxe; rock depletes and respawns. — Conclusion: —
- [todo] Add items: raw shrimp, raw beef, logs, copper ore, tin ore, bronze bar, tinderbox, bronze axe, bronze pickaxe, small net. — Conclusion: —
- [todo] Firemaking: use logs + tinderbox to make a fire on a walkable tile. — Conclusion: —
- [todo] Cooking on that fire or an Emberhaven range; burn chance falls with Cooking level. — Conclusion: —
- [todo] Smithing bronze bars on a furnace and a bronze dagger on an anvil (haven props). — Conclusion: —
- [todo] Crafting leather from cowhide (Millfields cow loot). — Conclusion: —
- [todo] Chickens drop feathers; crabs drop raw shrimp; cows drop raw beef + hide (extend `lootForMob`). — Conclusion: —
- [todo] Chat `The {resource} is exhausted` / `You need a {tool}` / `Your inventory is full` for every gather fail. — Conclusion: —
- [todo] Show a short “skilling” pose or progress in chat (`You fish…` / `You swing your axe…`). — Conclusion: —
- [todo] Interrupt gathering when a mob aggros (if auto-attack on) or when the player clicks away. — Conclusion: —
- [todo] Place a range and anvil/furnace in Emberhaven as examine + use targets. — Conclusion: —
- [todo] Bury bones: click bones → remove 1 → Prayer XP → chat `You bury the bones.` — Conclusion: —
- [todo] Use bones on the Emberhaven shrine for bonus Prayer XP (once use-on exists). — Conclusion: —
- [todo] Depleted-spot timers comparable to OSRS (tree ~seconds, rock ~seconds, fish spot moves). — Conclusion: —
- [todo] Do not auto-cook or auto-smelt; each step is a separate click (authentic skilling loop). — Conclusion: —
- [done] Gathering uses Phaser 3 arcade overlap/distance only (no Phaser 4). — Conclusion: From spawn (328,248) collectNearbyLoot/pickLoot use Phaser 3 Distance.Between <18 (18 miss / 17 gather); arcade default; no Phaser 4 createLayer. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.

## 8. Shops / economy / gold (14)

- [todo] Emberhaven general store UI (HTML, like the rest of the HUD): shop stock vs player inventory. — Conclusion: —
- [todo] Buy cooked shrimp and bread for gold; sell bones / extra food / loot at a lower price. — Conclusion: —
- [todo] Put buyPrice / sellPrice on every `ITEM_DB` entry (coins have none). — Conclusion: —
- [todo] Refuse buy with too little gold; refuse buy with a full 28-stack inventory. — Conclusion: —
- [todo] Shop stock counts deplete on buy and slowly restock (OSRS general store). — Conclusion: —
- [todo] Right-click or extra buttons: Buy-1 / Buy-5 / Buy-10 and Sell-1 / Sell-5 / Sell-all. — Conclusion: —
- [todo] Keep HUD gold and inventory coin stack identical after every shop action. — Conclusion: —
- [todo] Fen Witch remains a paid healer until a herblore shop is justified; do not dual-purpose her as a general store. — Conclusion: —
- [todo] Add a specialty food stall or weapon stall only after the general store works. — Conclusion: —
- [todo] Do **not** build a Grand Exchange until at least one local shop and the bank exist. — Conclusion: —
- [todo] High Alch as a Magic money sink only after Wind Strike and item values exist. — Conclusion: —
- [done] Starting gold is 8 and quest reward +50 is the first large income. — Conclusion: From spawn (328,248) starter gold is 8 (hero/HUD/Inv). Accept/Elise pay 0. Max mob drop 20. Bram stage 2 pays +50 → 58. Phaser 3.90 keyboard off. Dedicated case + Playwright. Suite 51/51.
- [todo] Show shopkeeper dialogue `Take a look at the wares` then open the window (not chat-only). — Conclusion: —
- [todo] Close the shop on walk-away, zone change, or combat start; WASD must still work while the shop is open (`Hud.mode` must not freeze `moveFlags` unless you treat shop like world). — Conclusion: —

## 9. Loot / ground items / pickup (17)

- [done] A combat win drops coins (mob gold) + bones, and extra shrimp (chicken/crab) or bread (cow), at the mob’s feet. — Conclusion: Chicken/crab/cow wins drop coins (mob gold qty) + bones + shrimp/bread at lastFought feet (y+4, ±10px spread); goblin table has no extra food. Suite 39/39 + Playwright from spawn (328,248).
- [done] Gold/bones are **not** added to the hero until pickup (`combat: Attack…winning loots` contract). — Conclusion: From spawn (328,248) chicken win drops coins+bones at feet; gold/HUD/coin stack/bones stay until pickup. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Click loot within 18px always picks up; walk within 18px only when auto-pickup is on; both chat `You pick up…`. — Conclusion: `collectNearbyLoot` gated by `hero.autoPickup !== false`; click `onClick` / sprite still take. Suite cases pass.
- [done] Loot sprites are interactive and offset by 10px per extra drop. — Conclusion: From spawn (328,248) spawnLoot 1/2/3-drop piles sit at 0 / ±5 / ±10px and y+4; each sprite is interactive (hand cursor + pointerdown pickup). Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Loot expires at `until = now + 20000` and the sprite is destroyed. — Conclusion: From spawn (328,248) spawnLoot until = now + 20000; pruneLoot at until keeps sprites, past until destroys them and empties groundLoot. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] `clearLoot` on zone change (until persistence is implemented). — Conclusion: From spawn (328,248) enterZone() and Keys.js W wipe coins+bones sprites and empty groundLoot; return to haven does not restore loot; gold/inventory unchanged. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Pickup during `encounterLock` is blocked or deferred. — Conclusion: From spawn (328,248) unlocked collectNearbyLoot still takes; encounterLock and `Hud.mode === 'battle'` keep tryPickup / collectNearbyLoot / onClick / sprite click silent (gold/chat unchanged); collectNearbyLoot takes after unlock. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] A “Take” / pile menu when two drops overlap the same click. — Conclusion: —
- [todo] Leave items on the ground when inventory is full (do not destroy). — Conclusion: —
- [todo] Clicking loot must not also engage a mob under the pile (priority already loot-first — verify). — Conclusion: —
- [todo] Drake uncommon unique drop (scale, hide, or token) once ITEM_DB has a slot. — Conclusion: —
- [todo] Load every droppable id as `item-{id}` in BootScene (sword/shield missing today). — Conclusion: —
- [todo] Settings: hide bones on the ground (OSRS ground-item overlay lite). — Conclusion: —
- [todo] A short “only you see this” timer even in single-player (teaches the RS rule). — Conclusion: —
- [todo] Pickup all nearby on a dedicated key later (not Area-loot until tested); for now walk-over is enough — verify it does not vacuum the whole map. — Conclusion: —
- [done] Auto-pickup loot toggle (Settings, on by default): ON keeps walk-near/overlap pickup; OFF disables walk-vacuum (click-to-take still works); chat still logs `You pick up…`; do not vacuum the whole map. — Conclusion: `hero.autoPickup` default true; missing registry key = on; Combat+Settings buttons sync, blur, log; persisted on hero like auto-attack. Dedicated suite cases pass.
- [done] Prune + pickup do not throw if a sprite was already destroyed. — Conclusion: From spawn (328,248) tryPickup, collectNearbyLoot, and pruneLoot (expired + taken) stay silent if sprite.destroy already ran; gold/bones still take. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.

## 10. Quests / diary / progression (16)

- [done] Side Task + Quest tab start as `Talk to Guildmaster Bram in Emberhaven.` — Conclusion: From spawn (328,248) side Task + Quest tab start as `Talk to Guildmaster Bram in Emberhaven.`; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Stage 1 text `Kill goblins in Northwood (N/5)` and journal `0/5` after accept. — Conclusion: From spawn (328,248) accept Bram → HUD+journal `Kill goblins in Northwood (0/5).`; N is progress. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Any `def.type === 'Goblin'` kill counts (Northwood and Westmead) — document that rule or restrict to Northwood. — Conclusion: From spawn (328,248) any `def.type === 'Goblin'` kill counts (Northwood +1, Westmead +1); chicken does not; HUD still says Northwood. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Fifth goblin sets stage 2 and chats to return to Bram. — Conclusion: From spawn (328,248) fifth Northwood goblin (4→5) sets stage 2, chats `That should be enough goblins. Return to Bram.`, and HUD+journal `Return to Guildmaster Bram for your reward.`; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] A quest-complete banner (not only chat) when Bram pays. — Conclusion: —
- [todo] Quest points (militia task = 1 QP) shown on the Quest tab. — Conclusion: —
- [todo] Quest journal as a staged checklist (talk / kill 5 / return) not a single sentence. — Conclusion: —
- [todo] A second quest: Fisher Ned / Southshore crabs (“Lost Shipment” or similar). — Conclusion: —
- [todo] A third quest: Miner Corb / Darkmine bats. — Conclusion: —
- [todo] An Emberhaven easy diary (talk to Bram, eat food, visit all 9 lands, bury bones). — Conclusion: —
- [todo] Achievement: visit all nine lands (flag per `zoneId`). — Conclusion: —
- [todo] Tutorial chat beats: first walk, first talk, first fight, first loot, first bury/shop (as those exist). — Conclusion: —
- [todo] Quest items (if any) cannot be dropped or sold. — Conclusion: —
- [todo] Hide later-stage journal text until that stage is reached (no spoilers). — Conclusion: —
- [done] Post-quest Bram line after stage 3. — Conclusion: From spawn (328,248) stage-3 and stage-4 tryTalk each emit only `Guildmaster Bram: Emberhaven stands because of you.`; gold stays 8, XP 0, stage unchanged; HUD+journal stay `Militia task complete. Explore the nine lands.`; no briefing/progress/pay. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Award a small skill XP reward on quest complete in addition to gold (OSRS-like). — Conclusion: —

## 11. HUD / UX / chat / minimap (23)

- [done] F1 Combat, F2 Skills, F3 Quest, F4 Inv, F5 Worn, F6 Prayer, F7 Magic, F8 Settings switch panels and `is-on`. — Conclusion: From spawn (328,248) F1–F8 open Combat/Skills/Quest/Inv/Worn/Prayer/Magic/Settings and mark that tab `is-on`; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Clicking the tab bar does the same as F-keys and only one `.tab-panel` is visible. — Conclusion: From spawn (328,248) tab-bar clicks match F1–F8 (Combat/Skills/Quest/Inv/Worn/Prayer/Magic/Settings) with only one `.tab-panel` visible; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Accurate / Aggressive / Defensive highlight and persist on `hero.style`. — Conclusion: From spawn (328,248) Accurate/Aggressive/Defensive clicks set `hero.style`, mark only that button `is-on`, log Combat style, and persist through Northwood/haven refreshHud; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] All three Auto-attack buttons (Combat, Settings, battle panel) stay in sync and log on/off. — Conclusion: From spawn (328,248) Combat/Settings/battle-panel clicks stay in sync (On/Off + is-on), log Auto-attack on/off, and blur; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Auto-pickup buttons on Combat and Settings stay in sync, log on/off, and blur after click. — Conclusion: Same UX as auto-attack; missing key renders On. `hud: auto-pickup toggle persists on the hero` pass.
- [done] Side HUD: zone name, combat level, HP `cur / max`, HP fill %, gold, XP, task text. — Conclusion: From spawn (328,248) side HUD shows Emberhaven, combat 1, HP `100 / 100`, fill 100%, gold 8, XP 0, talk-to-Bram; Millfields + `55 / 110` (50%) + gold 25 / XP 40 / level 2 / goblin 3/5 update. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Quest tab copies the same quest string as the side Task panel. — Conclusion: From spawn (328,248) `#hud-quest` + `#hud-quest-tab` copy the same string at stages 0/1/2/3/4 (talk-to-Bram, 0/5, 3/5, return, complete); Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Chat appends lines, auto-scrolls, and drops the oldest after 40 lines. — Conclusion: From spawn (328,248) Hud.log appends `.chat-line`, pins scrollTop to the newest line, and drops the oldest after 40; Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Title: **Click here to play** starts WorldScene in Emberhaven; Credits toggles `#credit-text`. — Conclusion: Click here to play starts WorldScene in Emberhaven (haven, spawn 328,248); Credits toggles `#credit-text`. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] `#btn-start` stays disabled until `TitleScene` binds `Hud.setStartHandler`. — Conclusion: `#btn-start` stays disabled until TitleScene `Hud.setStartHandler`; unbound click stays on title; bind enables and starts Emberhaven (328,248). Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [done] Death overlay + retry (already listed in Combat — here: HUD copy and focus). — Conclusion: From spawn (328,248) `#dead-overlay` “You are dead”, `Hud.mode === 'dead'`, `#dead-text` Combat level N, `#btn-retry` Return to title keeps focus (`bindHudBlur` skips overlay); retry returns to title. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Replace Prayer stub (“No prayers unlocked yet”) with bury-bones XP and at least Thick Skin / Burst of Strength toggles + prayer points. — Conclusion: —
- [todo] Replace Magic stub (“Wind Strike is not learned yet”) with a cast button, rune check, and autocast later. — Conclusion: —
- [todo] Chat input (local echo) and Game/Public filters; do not let the input steal WASD (`Keys.typing`). — Conclusion: —
- [todo] Minimap: draw a player dot and simple NPC/mob dots on the 3×3 (or a zoomed local minimap). — Conclusion: —
- [todo] Inventory hover tooltips (name, qty, heal/value). — Conclusion: —
- [todo] Drag-and-drop inventory rearrange inside the 28 slots. — Conclusion: —
- [todo] Right-click context menus on inventory, NPCs, mobs, and ground items (Use, Drop, Examine, Attack, Talk-to, Take). — Conclusion: —
- [todo] Update the chat hint line when bury / shop / fish / bank verbs exist. — Conclusion: —
- [todo] Add a document `<title>` (currently none) — `Emberwood`. — Conclusion: —
- [todo] Keep HUD HTML/Verdana and the world as a pixel Phaser canvas (no canvas-drawn F-keys). — Conclusion: —
- [done] `#shop-overlay` / bank overlay (when added) use `hidden` CSS like title/dead, not a Phaser text menu. — Conclusion: From spawn (328,248) title/dead use HTML `hidden` + `#id[hidden]{display:none}`; no shop/bank overlay stub yet; leftover Phaser Menu.js is not a shop/bank text menu. Phaser 3.90 keyboard off. Dedicated case + Playwright 1/1.
- [todo] Compass / XP orb are optional polish; do not block shops, bank, or gathering. — Conclusion: —

## 12. Settings / persistence (12)

- [todo] Persist `hero`, `quest`, `zone`, skills, inventory, equipment, autoAttack, autoPickup, style to `localStorage`. — Conclusion: —
- [todo] Title: **Continue** vs **New game**; New game confirms and wipes the save. — Conclusion: —
- [todo] Do not write a save in the middle of `BattleScene` in a half-applied HP state (save on world wake / logout). — Conclusion: —
- [todo] Settings: persist auto-attack, auto-pickup, music, sfx, shift-click drop, hide-bones. — Conclusion: —
- [todo] Settings: list current keys (WASD, arrows, Space, F1–F8) — remapping is later. — Conclusion: —
- [todo] Logout button: return to title **without** death, keeping the save. — Conclusion: —
- [todo] Export / import save JSON for debugging. — Conclusion: —
- [todo] Settings zoom / integer scale for the 512×320 canvas (Phaser 3 Scale.FIT stays). — Conclusion: —
- [todo] Optional show-FPS toggle. — Conclusion: —
- [done] A settings experiment never sets `input.keyboard` true. — Conclusion: From spawn (328,248) Settings auto-attack/auto-pickup toggles and F8 leave Phaser `input.keyboard` off (never true). Dedicated case + Playwright 1/1.
- [todo] Character display name on the HUD (even a default “Adventurer”). — Conclusion: —
- [todo] Refuse to load a save from a newer schema; reset gracefully. — Conclusion: —

## 13. Audio / juice / polish (12)

- [todo] UI click tick on tabs, Attack, and shop buttons (HTMLAudio, no bundler). — Conclusion: —
- [todo] Footstep loop while `Keys.moving()` or click-walking; stop on idle. — Conclusion: —
- [todo] Combat hit / eat / death / pickup / level-up short stingers. — Conclusion: —
- [todo] Per-biome music bed with a mute toggle (haven calm, graves tense, shore wash). — Conclusion: —
- [todo] Tune engage camera shake so it is noticeable but not nauseating. — Conclusion: —
- [todo] Player nameplate in the overworld (OSRS-style). — Conclusion: —
- [todo] Shore water and Mirefen mist as lightweight tile/overlay animation. — Conclusion: —
- [todo] Optional day/night tint on `cameras.main`. — Conclusion: —
- [todo] Delete or clearly unused-gate leftover canvas `Menu.js` / `Message.js` if HTML HUD fully replaced them. — Conclusion: —
- [todo] BootScene load progress text so a slow CDN Phaser script is not a white screen. — Conclusion: —
- [todo] Confirm all mob/NPC/item/UI SVGs stay original CC0 (`tools/generate_svgs.py`). — Conclusion: —
- [todo] Keep `audio: { noAudio: true }` on the Phaser game; use HTML audio so Phaser 3 audio quirks do not block mute. — Conclusion: —

## 14. Tests / QA — one case per action (16)

Existing `tests/interactions.js` cases must stay green. Add a case when you implement the matching feature.

- [todo] Re-run `tests/run.html` (reuse the live python3 http.server, or start one and kill that PID) after every behavior change; do not check items off this file without that (or headless Playwright) proof. — Conclusion: —
- [todo] Keep title, HUD tabs/F-keys, skills/worn/styles/inv, eat, WASD, arrows, HUD-focus walk, click-to-walk tests passing. — Conclusion: —
- [todo] Keep zone spawn, flavor talk, Space talk, click-NPC, Bram, Elise, Witch tests passing. — Conclusion: —
- [todo] Keep click-mob, win+ground-loot, combat eat, flee, two-foe list/canvas target, goblin quest, scales, auto-attack, auto-pickup, walk-loot, death+retry tests passing. — Conclusion: —
- [todo] Add tests: shop buy, sell, no-gold, full inventory, walk-away close. — Conclusion: —
- [todo] Add tests: bank deposit/withdraw and gold/item consistency. — Conclusion: —
- [todo] Add tests: bury bones → Prayer XP; cook raw → cooked or burn; fish/mine/chop success + tool-missing. — Conclusion: —
- [todo] Add tests: wear/unequip changes combat damage; drop item then walk-pickup. — Conclusion: —
- [todo] Add tests: loot expiry; inventory-full leaves loot; zone adjacency for all 12 edges. — Conclusion: —
- [todo] Add tests: purple click-path line appears and clears on WASD. — Conclusion: Auto-pickup ON walk-picks / OFF requires click cases shipped (`hud: auto-pickup…`, `world: auto-pickup off…`).
- [todo] Add tests: save/load roundtrip; Continue vs New game. — Conclusion: —
- [todo] Add a test that `Phaser.VERSION` starts with `3` and `game.input.keyboard` is disabled. — Conclusion: —
- [todo] Add a test that WASD works with shop/bank/chat input focused (Keys.js + blur). — Conclusion: —
- [todo] Playwright/browser smoke: title → play → walk → talk Bram → open Inv → eat refuse at full HP. — Conclusion: —
- [todo] Verify changed features in the Cursor sidebar (Glass) **only when the human asks** to see the inline browser; default playtest is headless Playwright and must not pop windows. — Conclusion: —
- [todo] Extend `tests/harness.js` with helpers (`openShop`, `buryBones`, `gatherAt`) instead of duplicating scene guts. — Conclusion: —

---

## Stretch (do not pick until the matching core section is done)

These are authentic OSRS cousins but too large for a single tick. Split them when you start the section.

- [todo] Overworld real-time hits (no instanced `BattleScene`) with a 0.6s tick. — Conclusion: —
- [todo] Full spellbooks, prayer book drain, special-attack bar, poison/venom. — Conclusion: —
- [todo] Multiplayer, trade, duel, wilderness, hiscores, clans. — Conclusion: —
- [todo] Grand Exchange, clue scrolls, random events, ironman. — Conclusion: —
- [todo] Full 23 OSRS skills and member content. — Conclusion: —

---

## Loop tick log

| Tick | Date | Item | Result |
|------|------|------|--------|
| format | 2026-09-08 | Converted checklist to flat PM (status + conclusion) | 277 items kept; none marked done |
| 3 | 2026-09-08 | W walks north from Emberhaven spawn via Keys.js only | done — live W from (320,240) y≈205, Phaser keyboard null; tests 31/31 |
| 4 | 2026-09-08 | A / S / D walk west / south / east from spawn | done — live A/S/D from (320,240) dx/dy ≈ −34.5 / +34.5 / +34.5, Phaser keyboard off; tests 32/32 |
| 5 | 2026-09-08 | Arrow keys walk in all four directions | done — live arrows from (320,240) y≈205.5 / 274.5, x≈285.5 / 354.5, Phaser keyboard off; tests 32/32 |
| 6 | 2026-09-08 | WASD still walks after clicking every HUD tab (F1–F8) and blur | done — all 8 tabs blur on mouseup; live D/A/W/S from (320,240) 356/320/204/240; suite 32/32 |
| 7 | 2026-09-08 | Opposite keys do not jitter; keyup clears velocity | done — A+D/W+S/arrows cancel in place; keyup vx=vy=0; leftover A walks west; suite 33/33 |
| doors | 2026-09-08 | Player 1-tile body + courtyard gate; giant drakes multi-tile | done — spawn D 328→388 through gate (23,15); wall blocks at 362; suite 35/35 |
| 8 | 2026-09-08 | Diagonal W+D / arrows stay speed-normalized to 90px | done — live W+D mag=90 vx/vy ±63.64 from (328,248); Phaser 3.90 keyboard off; suite case pass |
| 11 | 2026-09-08 | Clicking an NPC clears engageTarget (no accidental fight) | done — chicken then Bram clears engageTarget; no fight at 16px; Bram talks; suite 36/36 |
| 9 | 2026-09-08 | Left-click NPC sets talkTarget, walks in, tryTalk within 22px | done — click Bram walkTarget; no talk at 23px; tryTalk at 21px (briefing, stage 1); suite 35/35 |
| 13 | 2026-09-08 | Skills tab lists 12 skills with icons | done — live Attack…Crafting + loaded SVGs; `hud: skills tab lists twelve skills with icons` pass |
| 10 | 2026-09-08 | Space talks to the nearest NPC within 28px | done — Keys.js Space talks at 27px (Rowan); silent at 28/29px; nearer Bram when both in range; suite 38/38 |
| 12 | 2026-09-08 | Inventory 28 slots + starter kit | done — 28 slots, 8 coins / sword / shield / 8 shrimp / 3 bread; dedicated suite case pass |
| 15 | 2026-09-08 | Left-click living mob sets engageTarget, walks in, target chat | done — spawn (328,248) click Chicken engage+walk+chat; dead ignored; suite 39/39 + Playwright |
| 14 | 2026-09-08 | Combat win drops coins+bones+extra food at the mob feet | done — chicken/crab shrimp, cow bread at feet; goblin no extra; suite 39/39 + Playwright spawn (328,248) |
| 16 | 2026-09-08 | Attack auto-selects index 0 and rolls damage −2..+2 min 1 | done — Between(-2,2) min 1; Playwright spawn (328,248) drop=16; dedicated suite case pass |
| loot-ap | 2026-09-08 | Auto-pickup toggle default on (Settings + Combat) | done — walk-over when on, click-only when off; missing key = on; suite loot/auto-pickup cases pass |
| 17 | 2026-09-08 | Walking within 24px of engageTarget calls beginFight | done — 24px no fight; 23px shake 220ms then BattleScene ~260ms; Playwright spawn (328,248); suite case pass |
| 18 | 2026-09-08 | Nine lands match the 3×3 grid | done — live from spawn (328,248) 9 names + zoneByGrid/minimap; Phaser 3.90 keyboard off; dedicated case pass |
| path | 2026-09-08 | Click-to-walk A* + thin purple path; 1-tile doors; WASD cancel | done — Pathfind.js 8-dir no corner-cut; avoid NPC/mob if detour; gate 23,15 + house door; suite 49/49 |
| 19 | 2026-09-08 | Bram stage 0 accepts militia quest and updates HUD/journal | done — spawn (328,248) tryTalk → stage 1, gold 8, HUD+journal `Kill goblins in Northwood (0/5).`; Phaser 3.90 keyboard off; suite 49/49 + Playwright |
| 22 | 2026-09-08 | World clicks ignored during encounterLock, battle, or title | done — spawn (328,248) unlocked click walks; lock/battle/title ignore ground + chicken + Bram; Phaser 3.90 keyboard off; suite 53/53 |
| 21 | 2026-09-08 | Starting gold is 8; militia quest +50 is first large income | done — spawn (328,248) gold 8→58; max mob drop 20; Phaser 3.90 keyboard off; `economy: starting gold is 8 and militia quest pays +50` pass; suite 51/51 + Playwright |
| 23 | 2026-09-08 | Camera startFollow 0.12/0.12, roundPixels, bounds = tilemap | done — spawn (328,248) follow+lerp+roundPixels+bounds 576×448 haven/Northwood; W midY follows; Phaser 3.90 keyboard off; dedicated case pass; suite 53/53 |
| 20 | 2026-09-08 | Start skills: Hitpoints 10 / 1154 XP / 100 HP; others 1 / 0 | done — spawn (328,248) makeHero + Skills tab + HUD; Phaser 3.90 keyboard off; dedicated case pass; suite 52/52 |
| 25 | 2026-09-08 | window blur clears Keys.down / Keys.pressed so a held key cannot walk | done — spawn (328,248) W walks, blur empties Keys, velocity stops, fresh D walks; Phaser 3.90 keyboard off; dedicated case pass; suite 55/55 |
| 26 | 2026-09-08 | Space is not preventDefault on title or death overlays | done — spawn (328,248) world Space preventDefault; title/dead shouldBlockBrowser false; Phaser 3.90 keyboard off; dedicated case pass; suite 56/56 |
| 24 | 2026-09-08 | collideWorldBounds keeps player on the map except 14px exit strips | done — spawn (328,248) bounds 576×448; locked D stays haven; Graves west strip no wrap; east strip → Millfields; Phaser 3.90 keyboard off; dedicated case pass; suite 54/54 |
| 27 | 2026-09-08 | Idle animation stops on the last facing frame | done — spawn (328,248) W/A/S/D idle frames 2/1/0/1 (right flipX); Phaser 3.90 keyboard off; dedicated case pass; suite 57/57 |
| 29 | 2026-09-08 | Pointer click-to-move after HUD click when canvas is unfocused | done — spawn (328,248) Inv click then world click sets walk+marker+purple line and walks west; Phaser 3.90 keyboard off; dedicated case pass; suite 59/59 |
| 31 | 2026-09-08 | Outer edges of corner zones do not wrap | done — spawn (328,248) Graves/Highlands/Darkmine/Mirefen outer strips stay put (no neighbor → no enterZone); Phaser 3.90 keyboard off; dedicated case pass; suite 61/61 |
| 30 | 2026-09-08 | Walking off a path at N/S/E/W enters the neighbor and chats You enter | done — spawn (328,248) Keys.js D/A/W/S off 14px PATH strip → Millfields/Westmead/Northwood/Southshore + `You enter {name}.`; Phaser 3.90 keyboard off; dedicated case pass; suite 60/60 |
| 28 | 2026-09-08 | Keys.typing ignores future chat input so typing west does not walk | done — spawn (328,248) chat input “west” stays put; textarea/select/contentEditable ignored; W walks after blur; Phaser 3.90 keyboard off; dedicated case pass; suite 60/60 |
| 32 | 2026-09-08 | spawnPointForEntry places the player on the opposite side | done — spawn (328,248) n/s/w/e → south/north/east/west (288,400 / 288,48 / 528,224 / 48,224); enterZone + Keys.js walk; Phaser 3.90 keyboard off; dedicated case pass; suite 62/62 |
| 35 | 2026-09-08 | enterZone destroys old tilemap, colliders, NPCs, mobs, labels, and loot | done — spawn (328,248) enterZone + Keys.js W wipe haven map/collider/Bram/chickens/labels/loot; Northwood rebuilds; Phaser 3.90 keyboard off; dedicated case pass; suite 65/65 |
| 36 | 2026-09-08 | WATER/TREE/ROCK/SHRINE collide; GRASS/GRASS2/PATH/FLOWER do not | done — spawn (328,248) Keys.js walks blocked by TREE/ROCK/SHRINE (haven) and WATER (Southshore); GRASS/GRASS2/PATH/FLOWER entered; Phaser 3.90 keyboard off; dedicated case pass; suite 64/65 |
| 37 | 2026-09-08 | Emberhaven houses have a south-wall PATH door | done — spawn (328,248) house() last-row PATH; doors (11,10)/(25,11)/(15,20); Keys.js W walks in, ROCK frame blocks; Phaser 3.90 keyboard off; dedicated case pass; suite 66/66 |
| 33 | 2026-09-08 | exitLock (~400ms) prevents skipping a zone in one dash | done — spawn (328,248) Millfields lock blocks Highlands/haven skip; ~400ms then Keys.js W enters Highlands; Phaser 3.90 keyboard off; dedicated case pass; suite 66/66 |
| 34 | 2026-09-08 | enterZone destroys old tilemap, colliders, NPCs, mobs, labels, and loot | done — spawn (328,248) enterZone() + Keys.js W wipe haven map/collider/Bram/chickens/labels/loot; Northwood rebuilds; Phaser 3.90 keyboard off; dedicated case pass; suite 67/67 |
| 38 | 2026-09-08 | Biome scatter still looks like the biome | done — spawn (328,248) forest TREE>plains, mine ROCK>40, swamp inland WATER, shore south band, grave ROCK, farm FLOWER>forest; scatter hash mix; Phaser 3.90 keyboard off; dedicated case pass; suite 68/68 |
| 39 | 2026-09-08 | HUD zone title and minimap is-here update on every transition | done — spawn (328,248) Keys.js D/A/W/S update HUD+is-here to Millfields/Westmead/Northwood/Southshore; enterZone remaining lands too; Phaser 3.90 keyboard off; dedicated case pass; suite 68/68 |
| 40 | 2026-09-08 | Default spawn (20,15) and edge spawns are not inside a solid tile | done — spawn (328,248) courtyard PATH; 24 directed edge landings clear; Keys.js W from courtyard + Northwood south-edge; Phaser 3.90 keyboard off; dedicated case pass; suite 69/70 |
| 41 | 2026-09-08 | Map is 36×28 tiles at 16px via Phaser 3 make.tilemap + createLayer | done — spawn (328,248) all 9 lands 36×28×16 TilemapLayer via make.tilemap + map.createLayer (not Phaser 4); Keys.js W walks; Phaser 3.90 keyboard off; dedicated case pass; suite 70/71 |
| 42 | 2026-09-08 | Walking the 12 adjacencies does not soft-lock or spawn in water | done — spawn (328,248) 24 Keys.js edge walks stay on-map, not WATER, no bounce; placePlayer body.reset + centerOn; Phaser 3.90 keyboard off; dedicated case pass; suite 74/74 |
| 46 | 2026-09-08 | Bram stage 1 reports progress of 5 goblins and does not pay | done — spawn (328,248) 0/5 and 3/5 talk report progress, gold/XP unchanged; Phaser 3.90 keyboard off; dedicated case pass |
| 47 | 2026-09-08 | Bram stage 2 pays 50 gold + 40 combat XP, sets stage 3, levels if needed | done — spawn (328,248) 8→58 gold, 0→40 XP, stage 3, level 1→2; level 5 skips level-up; Phaser 3.90 keyboard off; dedicated case pass; suite 72/73 |
| 48 | 2026-09-08 | Bram stage 3+ uses the post-quest line only | done — spawn (328,248) stage 3/4 talk is only `Emberhaven stands because of you.`; gold 8, XP 0, no pay; Phaser 3.90 keyboard off; dedicated case pass; suite 74/74 |
| 49 | 2026-09-08 | Fen Witch refuses below 10 gold and does not heal | done — spawn (328,248) 0/8/9 gp refuse `Come back with 10 gold.`; HP/gold/coins/XP unchanged; Phaser 3.90 keyboard off; dedicated case pass |
| 50 | 2026-09-08 | Banker Elise restores HP to max for 0 gold | done — spawn (328,248) Elise heals 40→100 and 22→max at 0 gp; gold/XP/coins unchanged; HUD 100/100; Phaser 3.90 keyboard off; dedicated case pass; suite 74/74 |
| 51 | 2026-09-08 | Fen Witch at ≥10 gold heals and takeItem removes 10 coins | done — spawn (328,248) 10/11/18 gp heals to 100, gold+stack −10; Phaser 3.90 keyboard off; dedicated case pass; suite 75/75 |
| 52 | 2026-09-08 | Flavor NPCs emit Name: plus one of their lines | done — spawn (328,248) Rowan/Kett/Willa/Ned/Sila/Wisp/Corb/Ola both lines; Phaser 3.90 keyboard off; dedicated case pass; suite 76/76 |
| 53 | 2026-09-08 | Every NPC_DEFS entry spawns at its x,y with a yellow name label | done — spawn (328,248) all 11 NPCs at def xy + yellow #ffe08a labels; Phaser 3.90 keyboard off; dedicated case pass; suite 77/77 |
| playtest | 2026-09-08 | Background headless playtest; close owned browsers/servers/tabs | done — `tests/playwright-session.js`; no Glass/`open_resource` unless asked; `channel: chrome` removed from engage; AGENT.md cleanup rules |
| 54 | 2026-09-08 | Player–NPC arcade collider is immovable and does not shove NPCs | done — spawn (328,248) Keys.js D/S into Rowan/Bram/Kett; NPCs stay put, player does not pass through; Phaser 3.90 keyboard off; dedicated case + Playwright |
| 55 | 2026-09-08 | Talking never starts during battle or encounterLock | done — spawn (328,248) tryTalk/Space silent under lock and Hud.mode battle; unlocked post-quest line still speaks; Phaser 3.90 keyboard off; dedicated case + Playwright; suite 79/79 |
| 56 | 2026-09-08 | Auto-attack on engages nearest living mob within 20px after engageGrace | done — spawn (328,248) grace blocks 19px; 20px no fight; nearest living 10px starts BattleScene; Phaser 3.90 keyboard off; dedicated case + Playwright; suite 80/80 |
| cheap-loop | 2026-09-16 | Event-paced loop, loop-next.md tick card, targeted ?only= tests | process — stop 30s skip-spam; parent reads loop-next.md only |
| 57 | 2026-09-16 | Auto-attack off does not engage unless the player clicked that mob | done — spawn (328,248) living chicken at 10px, auto-attack off, no engageTarget: tryAutoEngage false, no BattleScene; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 58 | 2026-09-16 | engageGrace is ~800ms on zone enter and ~700ms after returning from battle | done — spawn (328,248) enterZone ~800ms blocks 10px auto-attack; wake/flee ~700ms blocks re-aggro; Phaser 3.90 keyboard off; dedicated case + Playwright 2/2 |
| 59 | 2026-09-16 | Clicking a foe in the HTML battle list on your turn selects and strikes that index | done — HTML .enemy-btn click selects+strikes chosen index (cow hit, goblin full); Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 60 | 2026-09-19 | Canvas click on a foe selects (fromSprite) without striking unless selectingEnemy | done — canvas fromSprite cow selects no strike; Attack hits cow; selectingEnemy fromSprite strikes; goblin full; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 61 | 2026-09-19 | The gold target rectangle follows the selected living enemy and hides when they die | done — gold 0xf0d060 rect follows selected living foe and hides on death; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 62 | 2026-09-19 | Accurate Attack XP, Aggressive Strength XP, Defensive Defence XP on a win | done — spawn (328,248) chicken +4 XP to Attack/Strength/Defence by style; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 63 | 2026-09-19 | Hitpoints XP on win is ceil(mobXp / 3) (minimum 1) | done — spawn (328,248) chicken wins grant Hitpoints ceil(mobXp/3) min 1 (1→+1, 2→+1, 4→+2, 5→+2, 10→+4 from 1154); Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 64 | 2026-09-19 | Eat food in combat uses shrimp then bread (eatBestFood) | done — shrimp then bread heals 12/20, consumes one, spends the turn; full HP does not; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 65 | 2026-09-19 | Eat at full HP does not consume food and returns the turn | done — spawn (328,248) full-HP Eat food chats already at full health, shrimp/bread unchanged, waitingForPlayer true, busy false; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 66 | 2026-09-19 | Eat with no food chats You have no food. and returns the turn | done — spawn (328,248) damaged no-food Eat chats `You have no food.`, HP 60 unchanged, waitingForPlayer true, busy false; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 67 | 2026-09-19 | Run succeeds on Between(0,99) < 70, chats run/break-away, outcome flee, no XP/loot | done — spawn (328,248) Between(0,99) return 0 succeeds; chats run/break-away; outcome flee; no XP/loot; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 68 | 2026-09-19 | Run fail chats You fail to get away! and the enemy still gets a turn | done — spawn (328,248) Between(0,99) return 70 fails; chats `You fail to get away!`; enemy still attacks; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 69 | 2026-09-19 | Player death shows #dead-overlay You are dead, Hud.mode dead, combat level subtitle | done — lose → GameOverScene `#dead-overlay` “You are dead”, Hud.mode dead, `#dead-text` Combat level N; retry → title; Phaser 3.90 keyboard off; Playwright 1/1 |
| 70 | 2026-09-19 | Return to title stops scenes and shows #title-overlay again | done — Return to title stops World/Battle/GameOver, only TitleScene + `#title-overlay`; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 71 | 2026-09-19 | HP bars go green / amber / red at 65% and 35%; ± floaters on hit/heal | done — spawn (328,248) HUD+battle green ≥65% / amber ≥35% / red <35%; −/+ floaters; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 72 | 2026-09-19 | Worn sword/shield are display-only today | done — HUD names only; hit uses hero.damage ±2 not ITEM_DB sword damage 16 or shield defence 1; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 73 | 2026-09-19 | Dead overworld mob hides ~18s then respawns in place with label and body re-enabled | done — spawn (328,248) chicken hides body+label+body.enable; 18000ms timer still dead ~400ms early, then respawns in place; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 74 | 2026-09-19 | Mob wander uses occasional small velocity and still collides with the ground | done — spawn (328,248) Between(0,80) miss stays still; hit vx/vy in −20..20; chicken blocked by TREE; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 75 | 2026-09-19 | Click shrimp at full HP chats already at full health and does not consume | done — spawn (328,248) full-HP Inv click shrimp chats already at full health, qty unchanged, HP 100; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 76 | 2026-09-19 | Click shrimp at low HP heals 12 (capped) and decrements the stack | done — spawn (328,248) Inv click shrimp 70→82 and 95→100 cap; qty −1 each; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 77 | 2026-09-19 | Click bread heals 20 (capped) and decrements the stack | done — spawn (328,248) Inv click bread 70→90 and 85→100 cap; qty −1 each; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 78 | 2026-09-19 | Click coins / sword / shield / bones only logs the item name | done — spawn (328,248) Inv click logs Coins./Bronze sword./Wooden shield./Bones.; qty/HP/gold unchanged; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 79 | 2026-09-19 | addItem coins increments gold and syncCoins; takeItem decrements both | done — spawn (328,248) addItem +5/+1 and takeItem −3/−1 keep gold, stack, HUD in sync; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 80 | 2026-09-19 | Stacks merge by id and drop when qty hits 0 | done — spawn (328,248) addItem merges by id; takeItem/eat last qty drops the stack; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 81 | 2026-09-19 | gainSkillXp level curve 1 + floor(sqrt(xp / 50)); Hitpoints never below 10 | done — spawn (328,248) Attack 50→2, Strength 200→3; 1154 XP curves to 5 but Hitpoints stays ≥10; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 82 | 2026-09-19 | Hitpoints level-up sets maxHp = 10 * level and chats Skill increased to N | done — spawn (328,248) 5000 XP → 11 / 110 + `Hitpoints increased to 11.`; 6050 → 12 / 120; Attack chat does not change maxHp; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 83 | 2026-09-19 | Skill icons resolve under assets/svg/skills/{id}.svg | done — spawn (328,248) skillIcon + 12 Skills-tab icons + side HUD Hitpoints fetch 200 SVG and decode; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 84 | 2026-09-19 | Gathering uses Phaser 3 arcade overlap/distance only (no Phaser 4) | done — spawn (328,248) Distance.Between <18 (18 miss / 17 gather); arcade default; no Phaser 4; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 85 | 2026-09-19 | Gold/bones are not added to the hero until pickup | done — spawn (328,248) chicken win drops coins+bones at feet; gold/HUD/bones stay until pickup; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 86 | 2026-09-19 | Loot sprites are interactive and offset by 10px per extra drop | done — spawn (328,248) 1/2/3-drop piles at 0 / ±5 / ±10px y+4; interactive hand cursor + pointerdown; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 87 | 2026-09-19 | Loot expires at until = now + 20000 and the sprite is destroyed | done — spawn (328,248) spawnLoot until = now + 20000; prune at until keeps sprites, past until destroys them; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 88 | 2026-09-19 | clearLoot on zone change wipes ground loot | done — spawn (328,248) enterZone + Keys.js W wipe loot sprites and empty groundLoot; return does not persist; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 89 | 2026-09-19 | Pickup during encounterLock is blocked or deferred | done — spawn (328,248) lock/battle keep tryPickup+walk-over+click silent; unlock defers collectNearbyLoot; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 90 | 2026-09-19 | Prune + pickup do not throw if a sprite was already destroyed | done — spawn (328,248) tryPickup/collectNearbyLoot/pruneLoot stay silent after sprite.destroy; gold/bones still take; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 91 | 2026-09-19 | Side Task + Quest tab start as Talk to Guildmaster Bram in Emberhaven | done — spawn (328,248) `#hud-quest` + `#hud-quest-tab` start as `Talk to Guildmaster Bram in Emberhaven.`; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 92 | 2026-09-19 | Stage 1 HUD Kill goblins in Northwood (N/5) and journal 0/5 after accept | done — spawn (328,248) accept Bram → HUD+journal `Kill goblins in Northwood (0/5).`; N is progress; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 93 | 2026-09-19 | Any def.type Goblin kill counts (Northwood and Westmead) | done — spawn (328,248) Northwood +1 and Westmead +1; chicken does not; HUD still Northwood; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 94 | 2026-09-19 | Fifth goblin sets stage 2 and chats to return to Bram | done — spawn (328,248) fifth kill 4→5 sets stage 2, chats `That should be enough goblins. Return to Bram.`, HUD+journal return-to-Bram; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 95 | 2026-09-19 | Post-quest Bram line after stage 3 | done — spawn (328,248) stage 3/4 talk is only `Emberhaven stands because of you.`; gold 8, XP 0, no pay; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 96 | 2026-09-19 | F1–F8 switch panels and matching tab is-on | done — spawn (328,248) F1–F8 open Combat/Skills/Quest/Inv/Worn/Prayer/Magic/Settings and mark that tab is-on; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 97 | 2026-09-19 | Tab bar clicks match F-keys and only one .tab-panel is visible | done — spawn (328,248) click matches F1–F8; only one panel visible; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 98 | 2026-09-19 | Accurate / Aggressive / Defensive highlight and persist on hero.style | done — spawn (328,248) clicks set hero.style + only that is-on; persist Northwood/haven refreshHud; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 99 | 2026-09-19 | All three Auto-attack buttons stay in sync and log on/off | done — spawn (328,248) Combat/Settings/battle-panel sync On/Off + is-on, log Auto-attack on/off, blur; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 100 | 2026-09-19 | Side HUD: zone name, combat level, HP cur/max, HP fill %, gold, XP, task text | done — spawn (328,248) Emberhaven/1/100/100/100%/8/0/talk-to-Bram; Millfields 55/110 50% gold 25 XP 40 level 2 goblin 3/5; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 101 | 2026-09-19 | Quest tab copies the same quest string as the side Task panel | done — spawn (328,248) side Task + Quest tab copy the same string at stages 0/1/2/3/4; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 102 | 2026-09-19 | Chat appends lines, auto-scrolls, and drops the oldest after 40 lines | done — spawn (328,248) Hud.log appends `.chat-line`, auto-scrolls, drops oldest after 40; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 103 | 2026-09-19 | Click here to play starts WorldScene in Emberhaven; Credits toggles #credit-text | done — play starts WorldScene in Emberhaven (328,248); Credits toggles `#credit-text`; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 104 | 2026-09-19 | #btn-start stays disabled until TitleScene binds Hud.setStartHandler | done — unbound click stays on title; setStartHandler enables and starts Emberhaven (328,248); Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 105 | 2026-09-19 | Death overlay HUD copy You are dead and retry keeps focus | done — spawn (328,248) `#dead-overlay` You are dead, Combat level subtitle, retry keeps focus; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 106 | 2026-09-19 | Shop/bank overlays use hidden CSS like title/dead not a Phaser text menu | done — title/dead hidden CSS; no shop/bank stub; leftover Menu.js unused; Phaser 3.90 keyboard off; dedicated case + Playwright 1/1 |
| 107 | 2026-09-19 | A settings experiment never sets input.keyboard true | done — spawn (328,248) Settings toggles + F8 leave Phaser keyboard off; dedicated case + Playwright 1/1 |
| 108 | 2026-09-19 | Esc / click-self to cancel walk (OSRS-style cancel) | done — spawn (328,248) Esc via Keys.js + click-self clear walk/path/marker; nearby ground still walks; Phaser keyboard off; dedicated + WASD cancel 1/1 |
| 109 | 2026-09-19 | Walk vs run toggle and run-energy bar | done — spawn (328,248) Ctrl/HUD run 180 vs walk 90; energy drains/restores; Phaser keyboard off; dedicated + WASD cancel 1/1 |
| 110 | 2026-09-19 | Right-click Walk here on the ground | done — spawn (328,248) left-click still walks; right-click opens HTML Walk here; choose sets path+marker; Phaser keyboard off; Playwright 1/1 |
| 111 | 2026-09-19 | Minimap cell click starts a purple walk path toward that land / matching zone exit | done — spawn (328,248) Millfields/Northwood/Graves clicks walk toward east/north/west exits + purple line; current cell no-ops; lock/battle/title ignore; Phaser keyboard off; dedicated + Playwright 1/1 |
| 112 | 2026-09-19 | If a mob parks on the only corridor, wait or stop adjacent instead of walking through | done — spawn (328,248) chicken on gate 23,15 waits adjacent; resumes when the mob moves; Phaser keyboard off; dedicated + Playwright 1/1 |

