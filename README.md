# Emberwood

A playable client-side Phaser 3 RPG with a RuneScape-style overworld: click-to-walk, named NPCs, visible monsters, and nine connected map zones around Emberhaven.

There is no build step. Serve the folder with any static HTTP server. The canvas world is Phaser 3.90; the HTML HUD is mirrored with **Vue 3** from a CDN (`js/ui/HudApp.js`). Phaser keeps game state; Vue only displays snapshots pushed through `Hud`.

## Play online

**GitHub Pages:** https://mhaiprojects.github.io/emberwood-phaser-rpg/

## How to run locally

A local static server is required (`file://` will fail CORS).

```bash
cd /path/to/CursorWS4-PhaserIO-RPG
python3 -m http.server 8765
```

Open http://localhost:8765/ (use another port if that one is taken).

## Tests

**DISABLED until further notice.** Do not run the suite, Playwright scripts, or browser/agent verification. Feature work only; the human playtests.

When re-enabled, interaction tests live in `tests/` and run in the browser against the live game (no build step):

```bash
python3 -m http.server 8765
```

Open http://localhost:8765/tests/run.html — the suite starts automatically. Add `?autorun=0` to load the runner without starting it.

The same cases are in `tests/interactions.js` and can be reused from the console:

```js
runEmberwoodTests()
```


## Controls

HUD, chat, combat buttons, and the title screen are **HTML** (Verdana) so they stay sharp. The world is a Phaser pixel canvas.

- **Title:** click **Click here to play**
- **Walk:** WASD or arrow keys, or left-click the ground (a thin purple line shows the path). Right-click the ground for **Walk here**
- **Talk:** click an NPC (or walk up and press Space)
- **Fight:** click a monster, then walk into range. Auto-attack and auto-retaliate (both default off) are on the Combat tab
- **Loot:** walk over a pile when auto-pickup is on (default), or click the pile. Toggle is on Combat and Settings
- **Bottom bar:** Combat, Skills, Quest, Inventory, Worn, Prayer, Magic, Settings (F1–F8)
- **Inventory:** 28 slots. Click cooked shrimp or bread to eat
- **Minimap:** 3×3 of the nine lands; current zone is highlighted
- **Battle:** Attack hits the highlighted foe (auto-selected when there is one). Click a foe on the canvas or in the list to choose a target and strike. Eat food uses inventory. Run to flee.

## The nine lands

```
Restless Graves   Northwood        Windrock Highlands
Westmead          Emberhaven       Millfields
Darkmine          Southshore       Mirefen
```

Walk off a path at the map edge to enter the next land.

Starter task: talk to **Guildmaster Bram** in Emberhaven, kill **5 goblins** in Northwood, return for gold and XP.

Useful NPCs: Banker Elise (free heal), Fen Witch in Mirefen (heal for 10 gp).

## Phaser / Vue (CDN, no build)

- Phaser **3.90.0** — https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js
- Vue **3.5** global build — https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.prod.js
- HUD mount: `#hud-root` (Phaser parent `#content` is not Vue-managed)

## Sources

Tutorial structure (battle turns, scenes): GameDev Academy Phaser 3 RPG series via https://phaser.io/news/2018/09/how-to-create-a-turn-based-rpg-in-phaser-3

Phaser 3 examples pin: [phaserjs/examples@3e33e020](https://github.com/phaserjs/examples/commit/3e33e020681113ecbe27b53fec9a9843f135d212) (`createLayer`, arcade, cursor keys). Overworld input uses window key listeners plus pointer click-to-move so keys still work when the canvas is not focused.

Mob, NPC, item, and HUD icons are original SVGs in `assets/svg/` (CC0). Regenerate with `python3 tools/generate_svgs.py`.
