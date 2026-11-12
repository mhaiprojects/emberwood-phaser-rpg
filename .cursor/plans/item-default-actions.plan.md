---
name: Item default actions
overview: Define and wire OSRS-style left-click default verbs per item type so food/gear/tools/materials do the useful action, and Drop is never the silent left-click default.
todos:
  - id: verbs
    content: Expand itemDefaultVerb priority table in Items.js (no left-click drop fallback)
    status: completed
  - id: hud-use
    content: Handle use/examine/drink in Hud.useItem; put default first in inv context menu
    status: completed
  - id: commit
    content: Cache-bust Items/Hud and local auto-commit
    status: completed
isProject: true
---

# Item default actions by type

## Current behavior

Left-click inventory calls [`Hud.useItem`](js/ui/Hud.js) which reads [`itemDefaultVerb`](js/data/Items.js). Today that function only special-cases `heal` → eat, equip → wield/wear, `bury`, `tan`, then **falls back to `drop`**. So left-clicking an axe, pick, logs, runes, raw food, or coins drops them.

Right-click [`showInvDropMenu`](js/ui/Hud.js) only lists wield/wear/bury/tan before Use/Drop/Examine — food never shows **Eat** as a menu option.

## Recommended defaults

Priority order for `itemDefaultVerb(id)`:

| Item type | Signal in data | Default verb |
|-----------|----------------|--------------|
| Food | `heal` | `eat` |
| Potion | `attackpot` / future `drink` | `drink` (treat like eat via existing heal path or small drink handler) |
| Weapon | `slot === 'weapon'` | `wield` |
| Armour / ammo / shield / etc. | other equip slots | `wear` |
| Bones | `bury` | `bury` |
| Untanned hide | `tan` | `tan` |
| Tools | `tool` (axe/pick/net) | `use` |
| Raw food | `cook` | `use` |
| Firemake logs | `firemake` | `use` |
| Tinderbox / craft mats / ores / bars / runes / essence / feathers / string / leather | stackable materials + known ids | `use` |
| Quest items | `questItem` | `examine` |
| Coins, burnt food, junk | value-only / no action flags | `examine` |
| Fallback | everything else | `use` (never `drop`) |

**Drop stays right-click / Shift-click only** (already supported).

## Implementation

1. **Rewrite `itemDefaultVerb` in** [`js/data/Items.js`](js/data/Items.js)  
   - Keep eat / equip / bury / tan first.  
   - Add `tool` → `use`.  
   - Add `cook` / `firemake` / `rune` / common mat ids → `use`.  
   - Add `questItem` → `examine`.  
   - Fallback `use` instead of `drop`.  
   - Optional small helper `itemIsMaterial(id)` to avoid a huge id list.

2. **Teach `Hud.useItem` new verbs** in [`js/ui/Hud.js`](js/ui/Hud.js)  
   - `use` → `beginUseOn(id)` (same as choosing Use from the menu).  
   - `examine` → `examineItem(id)`.  
   - `drink` → reuse eat/heal path for `attackpot` if it gains a heal/buff, or call existing herblore drink if present; otherwise map potion ids to a short “You drink…” that applies the buff.

3. **Fix right-click menu ordering** in `showInvDropMenu`  
   - Always put the default verb first with the right label (`Eat`, `Wield`, `Wear`, `Bury`, `Tan`, `Use`, `Examine`).  
   - Then the remaining actions without duplicating the default.  
   - Keep Drop and Examine available (Examine once).

4. **Cache-bust** `Items.js` / `Hud.js` in [`index.html`](index.html) and local commit.

## Out of scope

- Giving tools an equip slot (ownership-based tools stay as today; default is Use).  
- Changing world scenery default actions (tree/rock/NPC).  
- Per-player remappable defaults.
