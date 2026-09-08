# Emberwood

A playable client-side Phaser 3 RPG with a RuneScape-style overworld: click-to-walk, named NPCs, visible monsters, and nine connected map zones around Emberhaven.

There is no build step. Serve the folder with any static HTTP server.

## How to run

A local static server is required (`file://` will fail CORS).

```bash
cd /path/to/CursorWS4-PhaserIO-RPG
python3 -m http.server 8765
```

Open http://localhost:8765/ (use another port if that one is taken).

## Tests

Interaction tests for the HUD, NPCs, mobs, and combat live in `tests/`. They run in the browser against the live game (no build step).

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
- **Walk:** WASD or arrow keys, or click the ground (a thin purple line shows the path)
- **Talk:** click an NPC (or walk up and press Space)
- **Fight:** click a monster, then walk into range. Auto-attack (default on) is on Combat, Settings, and the battle panel
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

## Phaser version

- Phaser **3.90.0**
- CDN: https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js

## Sources

Tutorial structure (battle turns, scenes): GameDev Academy Phaser 3 RPG series via https://phaser.io/news/2018/09/how-to-create-a-turn-based-rpg-in-phaser-3

Phaser 3 examples pin: [phaserjs/examples@3e33e020](https://github.com/phaserjs/examples/commit/3e33e020681113ecbe27b53fec9a9843f135d212) (`createLayer`, arcade, cursor keys). Overworld input uses window key listeners plus pointer click-to-move so keys still work when the canvas is not focused.

Mob, NPC, item, and HUD icons are original SVGs in `assets/svg/` (CC0). Regenerate with `python3 tools/generate_svgs.py`.
