# Emberwood agent brief

Standing rules for agents working in this repo. Update this file when a durable decision changes. Keep it scannable.

## Stack

- Phaser **3.90.0 only**. Do not upgrade to Phaser 4.
- CDN script: `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js` in `index.html`.
- **No bundler**, no npm build, no Phaser 4 APIs (`createLayer` + arcade, not Phaser 4 tilemap).
- Vanilla JS files loaded by `<script>` tags. Cache-bust with `?v=` when you change a loaded file.
- Game config is in `js/main.js`: 512×320, `pixelArt`, `roundPixels`, `Phaser.Scale.FIT`, arcade gravity 0, `input.keyboard: false`, `audio: { noAudio: true }`.

## How to run

- Serve the folder with a static HTTP server (`file://` fails CORS): `python3 -m http.server 8765` (or another free port), then open `http://127.0.0.1:<port>/` (or `http://localhost:<port>/`).
- Tests: same server, open `http://127.0.0.1:<port>/tests/run.html` (autoruns). `?autorun=0` loads without starting. Console: `runEmberwoodTests()`.

## Playtest browser (prefer Cursor sidebar / Glass)

Prefer the **Cursor sidebar / Glass in-IDE browser** for playtesting and verifying UI/game flows when it is available. Isolated Playwright / headless Chromium is still OK for automated `tests/run.html` suite runs and CI-style checks, but if both are available, also (or instead) open the game in the Cursor sidebar browser and exercise the changed flow there.

**How to open (do not guess params):** Discover `open_resource` via `GetDynamicTools` (`namespace: cursor-app-control`, `toolName: open_resource`) before calling it. Confirmed schema (2026-09-08):

- MCP: `cursor-app-control` → `open_resource`
- Only argument: `{ "uri": "<string>" }` (required). No other properties.
- For the game: pass the local HTTP URL, e.g. `http://127.0.0.1:8765/` or `http://127.0.0.1:<port>/tests/run.html`.
- `http(s)` URLs open through the default workbench opener / Glass browser setting (sidebar when Glass Simple Browser is enabled). File URIs go to the editor panel; `vscode-terminal:` and `output:` are also supported. Command and product-protocol schemes are not.
- Then CallDynamicTool: `namespace` `cursor-app-control`, `toolName` `open_resource`, `arguments.uri` = that URL, plus MCP `mcpDetails.description`.

`user-playwright` MCP can still drive pages. Prefer connecting to / verifying the sidebar-opened page when that works. If `open_resource` or the sidebar browser is unavailable, fall back to Playwright / headless Chromium and say so.

**Smoke check (2026-09-08):** Local `python3 -m http.server` was already up (`http://127.0.0.1:39310/` → 200). `open_resource` from a nested/subagent call failed with `unknown agent: <uuid>` (Glass routes to the parent conversation). Retry `open_resource` from the top-level agent if the sidebar did not open. Playwright remains the fallback until that succeeds.

## Input (do not regress)

- Movement is **window `Keys.js` only**. Never mix Phaser cursors / `this.input.keyboard` for walk.
- Keep `game.input.keyboard === false`.
- Capture-phase `keydown`/`keyup` record keys. **Do not `preventDefault` in capture.**
- Bubble-phase `preventDefault` only for arrows/Space, and only when `Hud.mode` is not `title` or `dead` (`Keys.shouldBlockBrowser`).
- `Keys.typing()` must ignore `<input>`, `<textarea>`, `<select>`, and `contentEditable` so chat does not walk the hero.
- `window` blur clears `Keys.down` / `Keys.pressed` (no stuck walk after alt-tab).
- WASD and arrow keys must still walk after HUD tab clicks. `Hud.bindHudBlur` blurs `#shell button` on mouseup.
- Click-to-walk uses world pointer + yellow 6×6 marker plus a thin purple path line. Keyboard move cancels walk / talk target and hides the line.
- World clicks ignored while `encounterLock`, `Hud.mode === 'battle'`, or title.

## Pathfinding

- Tile A* in `js/world/Pathfind.js` (8-dir, no corner-cutting so 1-tile doors stay passable). Walkable = not WATER / TREE / ROCK / SHRINE (same as arcade collision). Soft-avoid NPC and living-mob tiles when a detour exists; if the only route is through them, walk through (or stop adjacent for talk/fight as today). `walkTarget` is still the final destination; `walkPath` holds remaining waypoints. Purple 2px line (`0xaa66ff`, depth 4) redraws from the player and clears on arrive, WASD, zone change, or combat. Occupied tiles are skipped at compute time; WorldScene also repaths about every 280ms if a mob steps onto the remaining path.

## HUD / UI

- HUD, chat, combat buttons, and title/death overlays are **HTML + Verdana** (`index.html`, `css/style.css`, `js/ui/Hud.js`). Keep them sharp; do not draw F-keys on the canvas.
- Tabs: Combat, Skills, Quest, Inv, Worn, Prayer, Magic, Settings. F1–F8 and the tab bar switch panels.
- Combat styles: Accurate / Aggressive / Defensive (`hero.style`). Auto-attack toggle lives on Combat, Settings, and the battle panel — keep all three in sync. Auto-pickup toggle lives on Combat and Settings — keep both in sync.
- Chat log: append, auto-scroll, drop oldest after 40 lines.
- Inventory is 28 HTML slots. Click food to eat in the world. In battle, use **Eat food** (do not eat from Inv).
- Prayer and Magic panels are stubs today (“No prayers unlocked yet”, “Wind Strike is not learned yet”).
- Leftover canvas `js/ui/Menu.js` / `js/ui/Message.js` are from the old battle menu. Do not revive them as the player HUD.

## World / spawn / scale

- Nine lands in a 3×3 grid (see `js/world/Zones.js`): Restless Graves, Northwood, Windrock Highlands, Westmead, Emberhaven, Millfields, Darkmine, Southshore, Mirefen.
- Maps are 36×28 tiles at 16px, generated in `js/world/MapGen.js`. Collide: WATER, TREE, ROCK, SHRINE.
- Walk off a path at a 14px edge strip to enter the neighbor. `exitLock` ~400ms. Outer corners do not wrap.
- Default spawn is tile **(20, 15)** = tile center `(328, 248)` in the Emberhaven courtyard (was the tile corner `320, 240`; center so a 1-tile body lines up with 1-tile doors). **Hero spawn must not overlap NPCs.** Haven NPCs sit around the courtyard (Bram 210,150; Elise 160,130; Rowan 252,168), not on the spawn tile.
- Player **world** scale is **1** (`PLAYER_WORLD_SCALE`): sprite and collision body are one tile (body 12×14, slightly under 16px so 1-tile doors/gaps are passable). Battle player scale stays **3** (readable on the battle canvas).
- Emberhaven has a 1-tile courtyard gate at tile **(23, 15)** (`HAVEN_GATE_TILE`, PATH between ROCK, just east of the courtyard). House south walls still use a 1-tile PATH door (`house()`).
- Mobs in `js/data/Scales.js`: chicken/crab/bat small (0.75), humanoid goblin/skeleton/slime **1 tile**, cow a bit bigger (1.25), **giant** drake may be **multi-tile** (world scale 2, body 28×28). Giants are not required to fit 1-tile interiors.
- NPC names are yellow float labels; mob names are salmon. NPCs are immovable arcade bodies.

## Combat / loot

- Overworld: click a living mob → `engageTarget` → walk in → `beginFight` within 24px. Camera shake, then `BattleScene`.
- Auto-attack **on** (default): nearest living mob within 20px after `engageGrace` (~800ms on zone enter, ~700ms after battle).
- Auto-attack **off**: only the clicked mob engages.
- Battle is turn-based (Attack / Eat food / Run). Attack variance −2..+2, min 1. Run succeeds if `Between(0,99) < 70`.
- Win XP: style skill (Accurate→Attack, Aggressive→Strength, Defensive→Defence) plus Hitpoints `ceil(mobXp / 3)` (min 1). Worn sword/shield are **display-only** today (damage/defence not applied).
- `levelHero` uses combat XP / 40 and overwrites `maxHp` / `damage` — this disagrees with `gainSkillXp` / `maxHp = 10 * hitpoints`. Reconcile before adding more combat-level rules.
- Loot drops on the ground at the mob (coins + bones; shrimp for chicken/crab; bread for cow). **Not** auto-added on win. Auto-pickup **on** (default, `hero.autoPickup !== false` if the registry key is missing): walk within 18px picks up. Auto-pickup **off**: click the pile (walk-over does not take). Both paths chat `You pick up…`. Expires at 20s. Zone change `clearLoot` wipes it. Setting is on the hero in the Phaser registry (survives World ↔ Battle like auto-attack).
- Death: `#dead-overlay` “You are dead”, then Return to title. No gravestone / Emberhaven respawn yet.

## Items / hero start

- `ITEM_DB`: coins, cooked shrimp (heal 12), bread (heal 20), bronze sword, wooden shield, bones.
- Starter kit: 8 gold, sword, shield, 8 shrimp, 3 bread. Skills: Hitpoints 10 / 1154 XP / 100 HP; others 1 / 0 XP.
- `addItem('coins')` updates `hero.gold` + `syncCoins`. Inventory has **no 28-cap** yet.
- BootScene loads item SVGs for coins/bones/shrimp/bread only — sword/shield ground sprites are missing until loaded.
- Banker Elise: free full heal. Fen Witch: heal for 10 gold. No bank UI, no shop UI.

## Quest

- Militia task: talk to Guildmaster Bram → kill **any** `type === 'Goblin'` (Northwood and Westmead both count) → return for 50 gold + 40 combat XP.
- Stages 0 talk / 1 kill 5 / 2 return / 3+ post-quest line.

## Assets

- Original CC0 only. No Zenva / commercial packs.
- Pixel PNGs + Tiled JSON: `python3 tools/generate_assets.py`.
- Mob / NPC / item / HUD / skill SVGs: `python3 tools/generate_svgs.py`.
- Do not drop in third-party sprites. New characters stay original SVGs.

## Tests

- Interaction suite: `tests/run.html` → `tests/runner.js` + `tests/harness.js` + `tests/interactions.js`.
- Cases already cover title, HUD tabs/F-keys, skills/worn/styles/inv, eat, W-from-spawn (Keys.js only, Phaser keyboard off), WASD, arrows, HUD-focus walk (all 8 tabs + `bindHudBlur`), click-to-walk, HUD-then-world click-to-walk (canvas unfocused), purple A* path + courtyard-gate / house-door path + WASD cancel, zone NPC/mob spawn, `enterZone` cleanup (old tilemap/colliders/NPCs/mobs/labels/loot), talk (Space + click), Bram / Elise / Witch, click-mob, win+loot, combat eat/flee/target, goblin quest, player/mob scales (1-tile world player; giant drake multi-tile), 1-tile door walk + wall block, auto-attack, auto-pickup (default on; off skips walk-over; click still takes), walk-loot, death+retry, Space not `preventDefault` on title/dead (`Keys.shouldBlockBrowser`).
- Playwright (or the live browser) is the extra proof for movement and HUD smoke. Prefer the Cursor sidebar / Glass browser for that live proof when possible; keep Playwright for the autorun suite / CI. Keep WASD green if you touch input.
- Add a case in `tests/interactions.js` when you ship a matching feature. Extend `tests/harness.js` instead of copying scene guts.

## Project management

- `loop-tasks.md` is the **flat-file PM** (not a wiki). Filename is `loop-tasks.md` (not `loops-tasks.md`).
- Max nesting 3: `#` title, `##` area, then a simple list. Each item has a status (`todo` | `doing` | `done` | `blocked` | `verify`) and a one-line Conclusion (`—` if not started).
- The 2-minute loop: pick the next `verify` in a section, else the next `todo`. One item per tick. Mark `done` only after tests pass. Do not invent dones. Then **commit that tick's work** (see Loop-tick commits).
- Do **not** rewrite the whole task list unless the human asks for a format change.

### Loop-tick commits

Every 2-minute loop tick that completes an item **must** create a git commit of that tick's work. The human asked for commits after each loop; this overrides “do not commit unless asked.”

- Follow git safety: NEVER update git config; NEVER `--no-verify` / `--no-gpg-sign`; NEVER force push; NEVER destructive git; NEVER commit secrets (`.env`, credentials).
- After finishing a PM item (status `done` + tests), stage only the relevant files and commit with a concise 1–2 sentence message focused on WHY (e.g. “Verify Bram stage 3 post-quest line.” or “Fix east/south zone entry spawning off-map.”).
- Use HEREDOC for the message: `git commit -m "$(cat <<'EOF'
...
EOF
)"`
- Run `git status` after the commit.
- Do **not** push unless the human asks.
- If there is nothing to commit, skip (no empty commit).
- If a tick only verified existing behavior and added a test, still commit the test + `loop-tasks.md` + `AGENT.md` updates.

### New game-design work goes on the PM first

- New game-design / feature ideas are **added to `loop-tasks.md`** as `todo` (status + short `Conclusion: —`) and are **not implemented in the same pass**.
- The 2-minute loop (and later ticks) **action** items from the PM — one item per tick.
- **Exception — implement immediately** only if the user explicitly says to do it now (e.g. “implement now”, “fix this bug”, “redo this code”) or the change is process/docs (`AGENT.md` / `loop-tasks.md` format).
- When the user describes a feature, the correct response is: write well-specified PM items (and related follow-ups), then **stop**.

## Hard no's

- Do not commit unless the human asks, **except** after each completed 2-minute loop tick (see Loop-tick commits). Do not push unless asked.
- Do not enable Phaser keyboard or Phaser audio.
- Do not introduce a bundler or Phaser 4.
- Do not use commercial / third-party game art.
- Do not implement a Grand Exchange, multiplayer, or a full 23-skill dump before local shop + bank + core gathering exist (see Stretch in `loop-tasks.md`).
- Do not implement new gameplay/features in the same pass as capturing them — add them to `loop-tasks.md` first (unless the user says implement now, or it is process/docs).

## Scenes and key files

- Scenes: `BootScene` → `TitleScene` → `WorldScene` ↔ `BattleScene` + `UIScene`; lose → `GameOverScene`.
- `js/input/Keys.js` — window keys.
- `js/ui/Hud.js` — HTML HUD / chat / tabs / battle actions.
- `js/world/Zones.js` — lands, NPCs, mobs, spawn points.
- `js/world/MapGen.js` — tiles and biomes.
- `js/world/Pathfind.js` — tile A* + purple-path helpers (`findTilePath`, `tilesToWorldPath`).
- `js/data/Items.js` — items, hero factory, eat, skill XP.
- `js/data/Scales.js` — player/mob scale + `lootForMob`.
- `js/scenes/WorldScene.js` — walk, click path + purple line, talk, fight, loot, zone exits.
- `js/scenes/BattleScene.js` — turns, Attack / Eat / Run.
- `README.md` — player-facing run/test/controls notes. Keep it in sync when controls change.
