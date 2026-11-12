# Emberwood agent brief

Standing rules for agents working in this repo. Update this file when a durable decision changes. Keep it scannable.

## Stack

- Phaser **3.90.0 only**. Do not upgrade to Phaser 4.
- CDN scripts in `index.html`: Phaser 3.90 + **Vue 3.5 global build** (`vue.global.prod.js`). No bundler, no npm build, no SFCs.
- Phaser owns all game logic/data (`registry`, scenes). Vue is a **display-only** HUD mirror on `#hud-root` (`js/ui/HudApp.js`). Push snapshots via `window.Hud` (`setWorld`, `renderHero`, `log`, mode helpers). Never put live `hero` into Vue `reactive()`.
- `#content` is Phaser-only — outside Vue. `#hud-root` is a grid overlay (`pointer-events: none` with auto on panels) so Vue never owns the canvas node. Imperative islands (inv, minimap, bank grids) use the `v-manual` directive so Vue patches do not wipe Hud-built DOM.
- **No Phaser 4** APIs (`createLayer` + arcade, not Phaser 4 tilemap). Vanilla JS `<script>` tags; cache-bust with `?v=` when you change a loaded file.
- Game config is in `js/main.js`: 512×320, `pixelArt`, `roundPixels`, `Phaser.Scale.FIT`, arcade gravity 0, `input.keyboard: false`, `audio: { noAudio: true }`.

## How to run

- Serve the folder with a static HTTP server (`file://` fails CORS): `python3 -m http.server 8765` (or another free port), then open `http://127.0.0.1:<port>/` (or `http://localhost:<port>/`).
- Tests: same server, open `http://127.0.0.1:<port>/tests/run.html` (autoruns). `?autorun=0` loads without starting. Console: `runEmberwoodTests()`.

## Background playtest (default) vs Glass (on request)

Automated playtest and the suite run in the **background**. Loop ticks / subagents must **not** pop Cursor Glass, system Chrome, or headed Playwright windows unless the human **explicitly** asks to see the sidebar.

There are **two different browsers**. Do not conflate them.

1. **Glass / Simple Browser** (the Cursor sidebar tab the human sees). Opened only via `cursor-app-control` `open_resource` with `{ "uri": "http://127.0.0.1:<port>/" }`. Glass routes to the **parent conversation**. Nested Task / loop-tick subagents **cannot** drive or retarget that tab (`unknown agent`). **Do not open Glass on every loop tick** — that interrupts the human. The parent calls `open_resource` **only** when the human asks to playtest in the inline browser.
2. **Headless Playwright** (automated suite / CI). Prefer `node tests/playwright-*.js <port>`, which uses `tests/playwright-session.js`: `{ headless: true }`, no `slowMo`, no `channel: 'chrome'`. The `user-playwright` MCP (`browser_navigate` `{ "url" }` only; `browser_tabs` list/new/close/select by index) is isolated Chromium — never the sidebar. There is **no** attach-to-Glass, no CDP endpoint, no “same tab as sidebar” flag.

There is **no supported way** for a nested/subagent to target the same Glass tab the parent opened. Cursor’s native Browser Automation MCP (`cursor-ide-browser`) can be an inline pane **when enabled**, but it is a separate control surface from Glass `open_resource`, is **not** in this workspace’s MCP catalog today, and still has no API to hijack an existing Glass tab from a child agent.

**How to open Glass (parent only, and only if the human asked; do not guess params):** Discover `open_resource` via `GetDynamicTools` (`namespace: cursor-app-control`, `toolName: open_resource`) before calling it. Schema:

- MCP: `cursor-app-control` → `open_resource`
- Only argument: `{ "uri": "<string>" }` (required).
- Game: `http://127.0.0.1:<port>/` — tests: `http://127.0.0.1:<port>/tests/run.html`.
- `http(s)` URLs go through the workbench opener / Glass browser setting (sidebar when Simple Browser + “Show Localhost Links in Browser” are on). File URIs go to the editor; `vscode-terminal:` and `output:` also work. Command / product-protocol schemes do not.
- CallDynamicTool: `namespace` `cursor-app-control`, `toolName` `open_resource`, `arguments.uri` = that URL, plus MCP `mcpDetails.description`.

### Parent coordinator — each loop tick

1. Reuse the existing static server (do not start a second `python3 -m http.server` if one already serves the repo). Note the port.
2. Put that **exact base URL** in the Task prompt so the subagent points tests at the same origin (`http://127.0.0.1:<port>/`).
3. **Do not** call `open_resource` on every tick. Opening Glass steals focus. Open it only when the human asked to playtest in the inline browser.
4. Do not ask the subagent to open Glass. Do not treat a Playwright screenshot as the sidebar.

### Tick cleanup (mandatory — success, fail, or abort)

Close everything **this tick opened**. Use `try` / `finally`, or `tests/playwright-session.js` (`withGamePage` / `session.close()` already does this).

- **Playwright node scripts:** `playwright-session` launches headless Chromium and always closes pages + browser in `finally`. SIGINT/SIGTERM also close. Do not leave headed windows. Do not use `slowMo`. Do not launch system Chrome (`channel: 'chrome'`).
- **Owned HTTP server:** if this tick started `python3 -m http.server`, kill **that PID only** in `finally` (`stopOwnedServer`). Never `pkill` unrelated servers. Prefer reuse; `reuseOrStartServer` sets `owned` only when this process started the child.
- **`user-playwright` MCP:** if this tick called `browser_navigate` or `browser_tabs` new, close those tabs (`browser_tabs` close by index) and `browser_close` when done. Do not leave extra MCP tabs.
- **Glass:** if this tick did not open it, do not close the human’s sidebar. If the human asked for Glass, leave it.

### Subagents / future loop ticks must not

- Call `open_resource` (fails with `unknown agent`, and would interrupt the human if it worked).
- Treat Playwright as the Cursor sidebar / Glass tab.
- Start a duplicate HTTP server when the parent already passed a live `http://127.0.0.1:<port>/` URL.
- Launch headed Playwright, `slowMo` GUI, or system Chrome for routine playtest.
- Return without closing browsers / owned servers / MCP tabs this tick opened.

### Point tests at the shared origin

Same origin; Glass is optional and human-requested only:

- Subagent: `node tests/playwright-*.js <port>` (or MCP `browser_navigate` to **that same URL**, then close the tab). Game: `http://127.0.0.1:<port>/` — suite: `http://127.0.0.1:<port>/tests/run.html`.

`tests/run.html` autoruns on load (`?autorun=0` to skip; console `runEmberwoodTests()`). Headless Playwright is the automated suite runner. Glass is the human-visible playtest **when asked**. They share files and port, not a tab.

## Input (do not regress)

- Movement is **window `Keys.js` only**. Never mix Phaser cursors / `this.input.keyboard` for walk.
- Keep `game.input.keyboard === false`.
- Capture-phase `keydown`/`keyup` record keys. **Do not `preventDefault` in capture.**
- Bubble-phase `preventDefault` only for arrows/Space, and only when `Hud.mode` is not `title` or `dead` (`Keys.shouldBlockBrowser`).
- `Keys.typing()` must ignore `<input>`, `<textarea>`, `<select>`, and `contentEditable` so chat does not walk the hero.
- `window` blur clears `Keys.down` / `Keys.pressed` (no stuck walk after alt-tab).
- WASD and arrow keys must still walk after HUD tab clicks. `Hud.bindHudBlur` blurs `#shell button` on mouseup.
- Click-to-walk uses world pointer + yellow 6×6 marker plus a thin purple path line. Keyboard move cancels walk / talk target and hides the line.
- Right-click empty ground opens a small HTML `#ctx-menu` with **Walk here** (same `setWalk` path). Left-click still walks immediately. Entity right-click menus are later. `input.mouse.disableContextMenu()` keeps the browser menu off the canvas.
- World clicks ignored while `encounterLock`, `Hud.mode === 'battle'`, or title.

## Pathfinding

- Tile A* in `js/world/Pathfind.js` (8-dir, no corner-cutting so 1-tile doors stay passable). Walkable = not WATER / TREE / ROCK / SHRINE (same as arcade collision). Soft-avoid NPC and living-mob tiles when a detour exists; if a mob parks on the only corridor, wait or stop adjacent instead of walking through them (talk/fight still walk up to the clicked target). `walkTarget` is still the final destination; `walkPath` holds remaining waypoints. Purple 2px line (`0xaa66ff`, depth 4) redraws from the player and clears on arrive, WASD, zone change, or combat. Occupied tiles are skipped at compute time; WorldScene also repaths about every 280ms if a mob steps onto the remaining path or the corridor is blocked.

## HUD / UI

- HUD, chat, combat buttons, and title/death overlays are **HTML + Cinzel/Alegreya Sans**, mirrored by Vue 3 CDN (`index.html`, `css/style.css`, `js/ui/HudApp.js`, `js/ui/Hud.js`). Keep them sharp; do not draw F-keys on the canvas. Behavior source of truth: `docs/emberwood-game-design.md`.
- Tabs: Combat, Skills, Quest, Inv, Worn, Prayer, Magic, Settings. F1–F8 and the tab bar switch panels.
- Combat styles: Accurate / Aggressive / Defensive (`hero.style`). Auto-attack and auto-retaliate toggles live on the Combat tab only. Auto-pickup toggle lives on Combat and Settings — keep both in sync.
- Chat log: append, auto-scroll, drop oldest after 40 lines.
- Inventory is 28 HTML slots. Click food to eat in the world. In battle, use **Eat food** (do not eat from Inv).
- Prayer and Magic panels are stubs today (“No prayers unlocked yet”, “Wind Strike is not learned yet”).
- Leftover canvas `js/ui/Menu.js` / `js/ui/Message.js` are from the old battle menu. Do not revive them as the player HUD.

## World / spawn / scale

- Nine lands in a 3×3 grid (see `js/world/Zones.js`): Restless Graves, Northwood, Windrock Highlands, Westmead, Emberhaven, Millfields, Darkmine, Southshore, Mirefen.
- Maps are 36×28 tiles at 16px, generated in `js/world/MapGen.js`. Collide: WATER, TREE, ROCK, SHRINE.
- Walk off a path at a 14px edge strip to enter the neighbor. `exitLock` ~400ms. Outer corners do not wrap.
- Default spawn is tile **(20, 15)** = tile center `(328, 248)` in the Emberhaven courtyard (was the tile corner `320, 240`; center so a 1-tile body lines up with 1-tile doors). **Hero spawn must not overlap NPCs.** Haven NPCs sit around the courtyard (Bram 210,150; Elise 160,130; Rowan 252,168), not on the spawn tile.
- Player **world** scale is **0.9** (`PLAYER_WORLD_SCALE`); collision body **10×11** (~62–69% of `TILE_SIZE` 16) so 1-tile corridors stay passable. Battle player scale stays **3**.
- Emberhaven has a 1-tile courtyard gate at tile **(23, 15)** (`HAVEN_GATE_TILE`, PATH between ROCK, just east of the courtyard). House south walls still use a 1-tile PATH door (`house()`).
- Mobs in `js/data/Scales.js`: chicken/crab/bat small (0.75), humanoid goblin/skeleton/slime **1 tile**, cow a bit bigger (1.25), **giant** drake may be **multi-tile** (world scale 2, body 28×28). Giants are not required to fit 1-tile interiors.
- NPC names are yellow float labels; mob names are salmon. NPCs are immovable arcade bodies.

## Combat / loot

- Overworld: click a living mob → `engageTarget` → walk in → `beginFight` within 24px. Camera shake, then `BattleScene`.
- Auto-attack **off** (default): only the clicked mob engages. Missing `hero.autoAttack` is treated as off.
- Auto-attack **on**: nearest living mob within 20px after `engageGrace` (~800ms on zone enter, ~700ms after battle).
- Auto-retaliate **on** (default, separate): when a foe agros first, walk into weapon range and fight back. Missing `hero.autoRetaliate` is treated as on.
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

## Tests (manual only — loop stopped)

- **No automatic test loop.** Do not arm `/loop`, sleep wakeups, git-HEAD watchers, or spawn workers that autorun Playwright / `tests/run.html`.
- Suite still exists for **on-request** checks: `tests/run.html` → `tests/runner.js` + `tests/harness.js` + `tests/interactions.js`. Targeted: `/tests/run.html?only=<substring>`. Headless: `node tests/playwright-*.js <port>` when the human asks.
- Default workflow: **implement → human playtest in browser** (`python3 -m http.server 8765`). Do not burn tokens on suite runs unless asked or a regression is reported.
- Keep WASD / Keys.js green if you touch input. Add or update a case in `tests/interactions.js` only when the human asks for coverage, or when fixing a reported suite failure.

## Project management (feature-first)

- `loop-tasks.md` is the **flat-file PM** (not a wiki). Max nesting 3: `#` title, `##` area, list items with status (`todo` | `doing` | `done` | `blocked` | `verify`) and a one-line Conclusion (`—` if not started).
- `loop-next.md` is a **short next-5 card**. Refresh with `python3 tools/loop-next.py` when useful. Prefer reading that + `git status` over the full PM.
- **Auto loop is OFF.** Work only when the human asks (chat). One feature/fix at a time. Mark `doing` while in progress, `done` when the feature works in playtest — suite pass is not required to mark done unless the human asked for tests.
- Do **not** rewrite the whole task list unless the human asks for a format change.
- Commit only when the human asks. Do not push unless asked.

### New game-design work

- Capture new ideas on `loop-tasks.md` as `todo` when the human is brainstorming.
- When the human says implement / fix / do it now — implement in the same pass.

## Hard no's

- Do not commit or push unless the human asks.
- Do not re-arm the event-paced / heartbeat loop or auto-spawn test workers.
- Do not enable Phaser keyboard or Phaser audio.
- Do not introduce a bundler or Phaser 4.
- Do not use commercial / third-party game art.
- Do not implement a Grand Exchange, multiplayer, or a full 23-skill dump before local shop + bank + core gathering exist (see Stretch in `loop-tasks.md`).

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
- `loop-next.md` / `tools/loop-next.py` — compact next-5 queue for parent ticks.
