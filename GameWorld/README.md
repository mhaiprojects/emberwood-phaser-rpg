# GameWorld packs

Each subdirectory is one game pack (JSON + `assets/`).

| Pack | Title | Notes |
|------|-------|-------|
| [`emberwood/`](emberwood/) | Emberwood | Default militia / gather RPG |
| [`minecraft/`](minecraft/) | Blocklands | Minecraft-inspired progression |

Catalog: [`catalog.json`](catalog.json). Title screen lists packs; changing selection reloads with `?pack=id`. You can also set `window.EMBERWOOD_PACK` before Boot.

See [`docs/framework.md`](../docs/framework.md) for the Engine ↔ GameWorld contract and pack checklist.
