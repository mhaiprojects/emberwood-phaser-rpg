---
name: Emberwood open items
overview: "Open work only: five blocked testing lines in loop-tasks. Feature/stretch/plate/den/gather work already shipped. Multiplayer/GE out of scope."
todos:
  - id: testing-gate
    content: "1.x Keep testing blocked until human re-enables; then proof pass (suite / keep-green / browser)"
    status: pending
isProject: true
---

# Emberwood open items

**Canonical Cursor plan (in project):** `.cursor/plans/emberwood-open-items.plan.md`  
**Source:** [`loop-tasks.md`](../../loop-tasks.md)  
**Last refreshed:** 2026-11-12

Completed design work (layers, Ranger/Mage, tiers, same-plane shop/guild, bank counter, stretch, plate armour, Dragon Den, zone gather mix) is **not** listed here. Multiplayer / GE stay **out of scope**.

---

## Status snapshot

| Area | Status |
|------|--------|
| Feature / stretch lines in loop-tasks | `[done]` |
| New test cases written | `[done]` (not run) |
| Suite / keep-green / browser proof | `[blocked]` (5 lines) — testing disabled |
| Plate / Dragon Den / zone gather mix | `[done]` |

---

## How to read each item

- **Status** — where it stands now
- **In plain words** — simple explanation
- **Options** — nested A / B / C
- **Suggestion** — recommended pick

Discuss with an id + letter, e.g. `1.1 A`.

---

## 1. Testing gate (only open loop-tasks items)

### 1.1 Re-run the full test page after changes

- **Status:** `[blocked]` — all testing + browser proof disabled until you say otherwise.
- **In plain words:** We wrote tests, but we are not allowed to run them yet, so nothing is freshly proven green.
- **Options:**
  - A. Keep blocked until you explicitly re-enable testing.
  - B. Re-enable and run full `tests/run.html` / Playwright once.
  - C. Re-enable a small smoke list only.
- **Suggestion:** A until you ask; then B or C.

### 1.2 Keep title / HUD / movement tests green

- **Status:** `[blocked]`
- **In plain words:** The “menus and walking still work” safety net cannot be checked off with new proof while testing is off.
- **Options:**
  - A. Leave blocked.
  - B. Run that block when testing returns.
  - C. Manual spot-check in Glass only if you ask.
- **Suggestion:** A, then B.

### 1.3 Keep NPC / Bram / Elise / Witch tests green

- **Status:** `[blocked]`
- **In plain words:** Town talk and bank/shop NPCs moved; those chats are unproven until tests run again.
- **Options:**
  - A. Leave blocked.
  - B. Run the NPC block when testing returns.
  - C. Manual talk-through of Mira / Elise / Bram only.
- **Suggestion:** A, then B.

### 1.4 Keep combat / loot / death tests green

- **Status:** `[blocked]`
- **In plain words:** Fights use overworld 0.6s hits now; old battle-room expectations may need updates when the suite runs.
- **Options:**
  - A. Leave blocked.
  - B. Fix cases for overworld fights, then run.
  - C. Keep a tiny BattleScene path only for harness custom fights.
- **Suggestion:** A now; B + C when testing returns.

### 1.5 Agent browser / Playwright MCP / Glass verification

- **Status:** `[blocked]` — same ban; do not open a browser to prove loot/path/UI.
- **In plain words:** No live browser proof pass is allowed right now.
- **Options:**
  - A. Keep blocked.
  - B. Allow headless Playwright only (no Glass).
  - C. Allow Glass only when you ask to see something.
- **Suggestion:** A; later B, with C only on request.

---

## Key files (for when testing resumes)

- [`loop-tasks.md`](../../loop-tasks.md) — blocked test lines
- [`tests/run.html`](../../tests/run.html) — suite entry
- [`tests/harness.js`](../../tests/harness.js) / [`tests/interactions.js`](../../tests/interactions.js) — written cases
