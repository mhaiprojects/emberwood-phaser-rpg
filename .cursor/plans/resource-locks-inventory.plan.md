---
name: Resource locks inventory
overview: "Complete redesign: Wood+4 parallel ladders (metal/rune/wood), single Armour (string+leather+hard), craft rules by weapon type, 1 meat/mob, per-zone ore/tree/fish. Unified execute list. Plan-only until execute."
todos:
  - id: execute-unified
    content: "Unified execute list for full redesign"
    status: pending
  - id: ladders-locked
    content: "Wood+4 metals / 4 runes / 4 woods + zone gather + craft rules locked"
    status: completed
  - id: decisions-complete
    content: "L1–L13 + E1–E8 decisions locked"
    status: completed
isProject: true
---

# Emberwood resource & equipment plan (complete)

**Phase:** plan only — no code until you say execute.

---

## Locked decisions

| Id | Decision |
|----|----------|
| **L1** | Clue = rare mob drop + genie grant |
| **L2** | Real uses for `oakplank` / `shortbowunstrung` |
| **L3** | Craft using `drakescale` |
| **L4** | Clearer den-boulder examine |
| **L5** | Keep late shop stock as backup |
| **L6** | Document three dragonite paths |
| **L7** | Tutor names drop mobs; RNG kept; expensive shop key |
| **L8** | Expand fishing with tiered catches (supersedes shrimp-only) |
| **L9** | Cook fail auto-discard — no burnt items |
| **L10** | Verify/document quest tokens |
| **L11** | Haven herb/mix station or NPC |
| **L12** | Clear recipe UI (bars, logs, runes, string/leather) |
| **L13** | Min tool tier for mine/chop/fish; higher OK |
| **E1** | One **Armour** slot (no helm/body/legs) |
| **E2** | **No bronze, no tin, no alloys** |
| **E3** | Armour craft = **string + leather + hard resource** (wood→dragonite) |
| **E4** | **1 raw meat per mob type**; all cookable |
| **E5** | Runes = 4-tier ladder like metals; **Fire highest**; **remove Nature** (and Mind — see ladder) |
| **E6** | Woods = Wood basic + **4 log types** (add mid-tier **ash**) |
| **E7** | Weapon craft rules: melee wood+metal; bow wood+string; staff wood+rune; arrows wood+metal |
| **E8** | **Every zone** has ore + trees + fishing at difficulty-appropriate tiers |

---

## Parallel ladders (Wood + 4)

Wood is the universal starter. Four progression tiers align across systems:

| Step | Tier name | Metal | Wood (logs) | Rune | Fish (new ladder) | toolTier |
|------|-----------|-------|-------------|------|-------------------|----------|
| 1 | **Wood** | — (carve only) | `logs` (Wood) | — | `rawshrimp` | 1 |
| 2 | **Copper** | copper / `copperbar` | `oaklogs` | `airrune` | `rawtrout` **NEW** | 2 |
| 3 | **Iron** | iron / `ironbar` | `ashlogs` **NEW** | `waterrune` | `rawlobster` **NEW** | 3 |
| 4 | **Diamond** | diamondore / `diamondbar` | `yewlogs` | `earthrune` | `rawswordfish` **NEW** | 4 |
| 5 | **Dragonite** | dragoniteore / `dragonitebar` | `magiclogs` | `firerune` | `rawshark` **NEW** | 5 |

### Rune changes (E5)
- **Keep (4):** Air → Water → Earth → Fire (highest).
- **Remove:** `naturerune` (and mire nature altar); `mindrune` (Air Strike / Wind Strike retune to **Air only** or Air×2).
- High Alchemy: **Fire only** (e.g. 5× `firerune`) — no nature.
- Elemental strikes: Air + matching tier rune (Water/Earth/Fire); Air Strike = air only.
- Staff craft consumes the **tier rune** (see E7), not mind.

### Wood changes (E6)
- Add **`ashlogs`** (mid tier, WC ~25–30) between oak and yew.
- Display: Wood / Oak / Ash / Yew / Magic.
- Update `TREE_BY_ZONE`, `RESOURCE_LEVEL`, firemake, bow/staff recipes to ash where iron-tier.

### Remove (E2, carried forward)
`tin`, tin rocks, all bronze*, burnt foods; migrate bronze gear → copper as before.

---

## Craft rules (E3 / E7)

| Product | Always needs | Plus tier hard mat | Example (iron tier) |
|---------|--------------|--------------------|---------------------|
| **Armour** | string + leather | wood logs **or** metal bar | string + leather + ironbar×N → `ironarmour` |
| **Melee** | tier wood + tier metal | — | ashlogs + ironbar → `ironsword` |
| **Bow** | tier wood + string | — | ashlogs + string → iron-tier bow (rename oakbow path) |
| **Staff** | tier wood + tier rune | — | ashlogs + waterrune → `ironstaff` |
| **Arrows** ×10 | tier wood + tier metal | — | ashlogs + ironbar + (feather optional keep) → `ironarrow` |
| **Shield** | tier wood **or** metal | (leather optional) | ironbar×N → `ironshield`; wood: logs×2 |
| **Tools** axe/pick | metal bar (wood tools: logs only) | — | unchanged smith pattern |

Wood-tier armour: string + leather + `logs` → `wizardrobe` (magicBonus kept).  
Copper armour: string + leather + copperbar.  
… same through dragonite.

---

## Equipment matrix (target)

| Tier | Melee (wood+metal) | Bow (wood+string) | Staff (wood+rune) | Arrows (wood+metal) | Armour (string+leather+hard) | Shield |
|------|--------------------|-------------------|-------------------|---------------------|------------------------------|--------|
| Wood | `woodclub` (logs) | `woodbow` | `staff` (logs; no rune / 1 air) | `woodarrow` (logs) | `wizardrobe` | `shield` |
| Copper | `copperdagger` / `coppersword` | `copperbow` | `copperstaff` + air | `copperarrow` | `copperarmour` **NEW** | `coppershield` **NEW** |
| Iron | `ironsword` + ashlogs | bow from ashlogs (retune `oakbow`) | `ironstaff` + water | `ironarrow` + ash | `ironarmour` | `ironshield` |
| Diamond | `diamondsword` **NEW** + yew | `yewbow` | `diamondstaff` + earth | `diamondarrow` **NEW** | `diamondarmour` | `diamondshield` |
| Dragonite | `dragonitesword` **NEW** + magic | `magicbow` | `dragonitestaff` + fire | `dragonitearrow` **NEW** | `dragonitearmour` | `dragoniteshield` |

Names unchanged from prior plan for NEW pieces (Copper armour/shield, Diamond/Dragonite blade & arrows).

---

## E4 — One meat per mob

| Mob | Raw meat id | Cooked | Notes |
|-----|-------------|--------|-------|
| Chicken | `rawchicken` **NEW** | `chicken` | Also keeps feathers |
| Cow | `rawbeef` | `beef` | Keep |
| Slime | `rawslime` **NEW** | `slimepudding` or `cookedslime` | Thematic |
| Crab | `rawcrab` **NEW** | `crab` | Shrimp stays **fish**, not crab meat |
| Goblin | `rawgoblin` **NEW** | `cookedgoblin` | “Goblin meat” |
| Skeleton | `rawrib` **NEW** | `ribs` | Undead cut |
| Rabbit | `rawrabbit` **NEW** | `rabbit` | Also keeps fur |
| Bat | `rawbat` **NEW** | `cookedbat` | |
| Drake | `rawdrake` **NEW** | `drakesteak` | |
| Dragon | `rawdragon` **NEW** | `dragonsteak` | |

All: cook at range/fire; L9 fail = discard (no burnt). Heal values scale with tier/zone.

---

## E8 — Per-zone ore / trees / fishing

Difficulty order (band) drives resource tier. **Every** overworld zone gets all three.

| Zone | Band | Ore | Trees | Fish |
|------|------|-----|-------|------|
| `haven` | 1–3 | copper | logs | shrimp (pond/river spot **add**) |
| `millfields` | 1–5 | copper | logs | shrimp |
| `mire` | 6–10 | copper + iron mix | oak | trout |
| `southshore` | 11–15 | copper | logs + oak fringe | shrimp + trout |
| `northwood` | 16–20 | iron | oak | trout |
| `graves` | 21–25 | iron | oak + ash | trout / lobster |
| `westmead` | 26–30 | iron | ash | lobster |
| `darkmine` | 31–35 | diamond + essence (+ copper remnant) | yew (surface scrub) / magic in deep | — fishing at mine pool: lobster/swordfish |
| `highlands` | 36–40 | diamond (+ rare dragonite) | yew | swordfish |
| `dungeon` | 40+ | rare ore nodes on floors (diamond→dragonite) | none or rare magic roots | underground pool fish by floor |
| `dragonden` | 60 | dragonite nodes | magic | shark |

Den boulder still needs diamond pick (toolTier 4).  
L13 mins follow ladder: e.g. iron ore need copper pick; ash need copper axe; lobster need copper/iron net tier as assigned.

### Fishing tools (expand L8)
| Tier | Tool | Catches |
|------|------|---------|
| 1 | `net` | shrimp |
| 2 | `coppernet` or rod **NEW** | trout |
| 3 | iron fishing tool **NEW** | lobster |
| 4 | diamond tool **NEW** | swordfish |
| 5 | dragonite tool **NEW** | shark |

---

## Recipe matrix (rules + issues)

Issue tags: OK · ADD · MIGRATE · DELETE · DEAD · NEVER · MILD

### Smelt
| Output | Inputs | Planned | Issue |
|--------|--------|---------|-------|
| copperbar | copper×1 | Keep | OK |
| bronzebar | copper+tin | **DELETE** | DELETE |
| ironbar | iron×1 | Keep | OK |
| diamondbar | diamondore×1 | Keep | OK |
| dragonitebar | dragoniteore×1 | Keep | OK |

### Smith / craft weapons (E7 pattern)
| Output | Planned inputs | Issue |
|--------|----------------|-------|
| woodclub | logs×1 | OK |
| copperdagger | logs×1 + copperbar×1 | MIGRATE add wood |
| coppersword ←sword | logs×1 + copperbar×2 | MIGRATE |
| ironsword | ashlogs×1 + ironbar×2 | MIGRATE add ash |
| diamondsword | yewlogs×1 + diamondbar×2 | ADD |
| dragonitesword | magiclogs×1 + dragonitebar×2 | ADD |
| woodbow | logs + string | OK |
| copperbow ←shortbow | oaklogs + string | MIGRATE |
| iron bow ←oakbow | ashlogs + string | MIGRATE |
| yewbow | yewlogs + string | OK |
| magicbow | magiclogs + string | OK |
| staff | logs (+ optional air×1) | MIGRATE |
| copperstaff | oaklogs + airrune | MIGRATE |
| ironstaff | ashlogs + waterrune | MIGRATE (was oak+ironbar) |
| diamondstaff | yewlogs + earthrune | MIGRATE (was yew+diamondbar) |
| dragonitestaff | magiclogs + firerune | MIGRATE |
| woodarrow×10 | logs + (feather) | OK |
| copperarrow | oaklogs + copperbar + feather | MIGRATE |
| ironarrow | ashlogs + ironbar + feather | MIGRATE |
| diamondarrow | yewlogs + diamondbar + feather | ADD |
| dragonitearrow | magiclogs + dragonitebar + feather | ADD |

### Armour (E1+E3)
| Output | Inputs | Issue |
|--------|--------|-------|
| wizardrobe | string + leather + logs | MIGRATE (merge hat; add logs) |
| copperarmour | string + leather + copperbar | ADD |
| ironarmour | string + leather + ironbar | MIGRATE merge plates |
| diamondarmour | string + leather + diamondbar | MIGRATE merge |
| dragonitearmour | string + leather + dragonitebar | MIGRATE merge |
| wizardhat | — | DELETE merge |
| *helm/*body/*legs | — | DELETE merge |

### Shields / tools
| Output | Planned | Issue |
|--------|---------|-------|
| shield | logs×2 | OK |
| coppershield | copperbar×2–3 | ADD |
| iron/diamond/dragonite shield | bars as today | OK |
| wood/copper/iron/diamond/dragonite axe&pick | bars or logs; **delete bronze*** | MIGRATE/DELETE |
| fishing tools tier 2–5 | string + metal | ADD |

### Cook
| Raw → cooked | Issue |
|--------------|-------|
| shrimp, beef + **8 new meats** | ADD meats; L9 no burnt |
| burnt* | DELETE |

### Runecraft
| Output | Planned | Issue |
|--------|---------|-------|
| air / water / earth / fire | Keep; altars move to match zones | OK |
| mindrune | **DELETE**; spells retune | DELETE |
| naturerune | **DELETE**; alch = fire only; remove mire altar | DELETE |

### Dead / never (unchanged intent)
| Id | Issue | Fix |
|----|-------|-----|
| shortbowunstrung, oakplank | DEAD | L2 |
| drakescale | DEAD | L3 |
| cluescroll | NEVER | L1 |
| shipcrate, batfang | NEVER | L10 |

---

## L13 tool gates (5-tier)

| Resource | Min toolTier |
|----------|---------------|
| copper, essence | pick 1 |
| iron | pick 2 |
| diamond ore | pick 3 |
| dragonite ore / boulder | pick 4 |
| logs | axe 1 |
| oak | axe 2 |
| ash | axe 3 |
| yew | axe 4 |
| magic | axe 5 (or 4 diamond — prefer **5** dragonite-adjacent: use axe 4 diamond for magic to avoid chicken-egg; magic axe is flex) |
| shrimp | net 1 |
| trout | 2 |
| lobster | 3 |
| swordfish | 4 |
| shark | 5 |

Anti-chicken-egg: magic logs choppable with **diamond** axe (4); dragonite tools are prestige.

---

## Unified Execute list

1. **E2** — Remove tin/bronze; migrate ids to copper; starter = copper tools/sword; save migrate.
2. **E5** — Remove nature + mind runes; 4-rune ladder; retune spells + high alch; relocate altars (mire→water or earth as fits zone table).
3. **E6** — Add `ashlogs`; WC level + TREE_BY_ZONE; retarget iron-tier recipes from oak→ash where required.
4. **E8** — Per-zone ore/tree/fish tables; add fishing spots to all zones; add fish items + tiered fishing tools.
5. **E1** — Single Armour slot; merge plates + wizard hat.
6. **E3** — Armour recipes = string + leather + hard mat; add copperarmour.
7. **E7** — Rewrite melee/bow/staff/arrow recipes to wood+metal / wood+string / wood+rune / wood+metal; add diamond/dragonite blades + arrows; coppershield.
8. **E4** — One raw+cooked meat per mob; update loot tables; cook hooks; L9 no burnt.
9. **L13** — toolTier 1–5 gates for mine/chop/fish.
10. **L1** — Clue drop + genie.
11. **L2** — Unstrung→bow; oakplank sink; fix tutor string bug.
12. **L3** — Drakescale craft.
13. **L4** — Boulder examine.
14. **L7** — Key tutor + expensive shop.
15. **L11** — Herb/mix station.
16. **L12** — Recipe UI shows all mats (wood, metal, rune, string, leather).
17. **L10 / L5 / L6** — Quest tokens; shop backup; dragonite paths doc.
18. **Catalog + GDD + loop-tasks** — Full rewrite of obtainability; log execute rows (no suite proof).

---

Still **plan only** until you say to execute.
