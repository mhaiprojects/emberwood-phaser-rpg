#!/usr/bin/env python3
"""Rewrite loop-next.md with the next 5 actionable PM items.

Pick order: every remaining `verify` (document order, skip Stretch), then
every remaining `todo`. Parent ticks should read loop-next.md, not the
full 294-item list.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PM = os.path.join(ROOT, "loop-tasks.md")
OUT = os.path.join(ROOT, "loop-next.md")
INTERACTIONS = os.path.join(ROOT, "tests", "interactions.js")

ITEM_RE = re.compile(
    r"^- \[(todo|doing|done|blocked|verify)\] (.+?) — Conclusion: (.*)$"
)
HEADING_RE = re.compile(r"^## (.+)$")
TEST_ADD_RE = re.compile(r"EmberwoodTests\.add\('([^']+)'")

SECTION_FILES = {
    "1": ["js/input/Keys.js", "js/scenes/WorldScene.js", "js/world/Pathfind.js"],
    "2": ["js/world/MapGen.js", "js/world/Zones.js", "js/scenes/WorldScene.js"],
    "3": ["js/world/Zones.js", "js/scenes/WorldScene.js", "js/ui/Hud.js"],
    "4": ["js/scenes/WorldScene.js", "js/scenes/BattleScene.js", "js/ui/Hud.js"],
    "5": ["js/data/Items.js", "js/ui/Hud.js", "js/scenes/BootScene.js"],
    "6": ["js/data/Items.js", "js/ui/Hud.js"],
    "7": ["js/scenes/WorldScene.js", "js/data/Items.js", "js/world/Zones.js"],
    "8": ["js/ui/Hud.js", "js/data/Items.js", "js/world/Zones.js"],
    "9": ["js/scenes/WorldScene.js", "js/data/Scales.js", "js/scenes/BootScene.js"],
    "10": ["js/world/Zones.js", "js/ui/Hud.js", "js/scenes/WorldScene.js"],
    "11": ["js/ui/Hud.js", "index.html", "css/style.css"],
    "12": ["js/ui/Hud.js", "js/data/Items.js", "js/scenes/TitleScene.js"],
    "13": ["js/main.js", "js/ui/Hud.js", "js/ui/Menu.js"],
    "14": ["tests/interactions.js", "tests/harness.js", "tests/runner.js"],
}

KEYWORD_FILES = (
    (re.compile(r"Keys\.js|WASD|keyboard|preventDefault|typing", re.I),
     ["js/input/Keys.js", "js/main.js"]),
    (re.compile(r"pathfind|purple|A\*|walkPath|Walk here|Esc", re.I),
     ["js/world/Pathfind.js", "js/scenes/WorldScene.js"]),
    (re.compile(r"BattleScene|Eat food|flee|Run succeed|selectingEnemy", re.I),
     ["js/scenes/BattleScene.js", "js/ui/Hud.js"]),
    (re.compile(r"auto-attack|engageGrace|tryAutoEngage|engageTarget", re.I),
     ["js/scenes/WorldScene.js"]),
    (re.compile(r"ground loot|clearLoot|auto-pickup|item-sword|item-shield", re.I),
     ["js/scenes/WorldScene.js", "js/data/Scales.js", "js/scenes/BootScene.js"]),
    (re.compile(r"ITEM_DB|inventory|addItem|takeItem|gainSkillXp|levelHero", re.I),
     ["js/data/Items.js"]),
    (re.compile(r"BootScene", re.I), ["js/scenes/BootScene.js"]),
    (re.compile(r"NPC_DEFS|Guildmaster|Elise|Witch|talkTarget", re.I),
     ["js/world/Zones.js"]),
    (re.compile(r"<title>|index\.html", re.I), ["index.html"]),
    (re.compile(r"playwright", re.I), ["tests/playwright-session.js"]),
    (re.compile(r"localStorage|Continue|New game", re.I),
     ["js/scenes/TitleScene.js", "js/ui/Hud.js"]),
)


def load_tests():
    if not os.path.isfile(INTERACTIONS):
        return []
    with open(INTERACTIONS, encoding="utf-8") as handle:
        return TEST_ADD_RE.findall(handle.read())


STOP = {
    "a", "an", "the", "and", "or", "to", "of", "in", "on", "for", "is", "are",
    "that", "this", "with", "from", "not", "does", "do", "be", "as", "at",
    "by", "it", "if", "then", "when", "only", "still", "must", "already",
}

STEM = (
    (re.compile(r"\bclicking\b|\bclicked\b"), "click"),
    (re.compile(r"\bselects\b|\bselected\b|\bselecting\b"), "select"),
    (re.compile(r"\bstriking\b|\bstrikes\b"), "strike"),
    (re.compile(r"\bwalking\b"), "walk"),
    (re.compile(r"\bengages\b|\bengaged\b"), "engage"),
)


def normalize(text):
    text = re.sub(r"[*_`]", " ", text.lower())
    for pattern, repl in STEM:
        text = pattern.sub(repl, text)
    return text


def words(text):
    text = normalize(text)
    hyphenated = set(re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)+", text))
    singles = set(re.findall(r"[a-z0-9]+", text))
    return (hyphenated | singles) - STOP


def guess_test(spec, names):
    spec_words = words(spec)
    if not spec_words or not names:
        return "add a dedicated case in tests/interactions.js"
    best = None
    best_score = 0
    spec_n = normalize(spec)
    for name in names:
        name_n = normalize(name)
        name_words = words(name)
        score = len(spec_words & name_words)
        for phrase in ("auto-attack", "engagegrace", "fromsprite", "canvas select", "list click", "battle list"):
            if phrase in spec_n and phrase in name_n:
                score += 3
        if "fromsprite" in spec_n and "canvas select" in name_n:
            score += 4
        if "battle list" in spec_n and "list click" in name_n:
            score += 4
        if "auto-attack" in spec_n and "auto-attack" in name_n:
            if (" off" in " %s " % spec_n) != (" off" in " %s " % name_n):
                score -= 3
        if score > best_score:
            best_score = score
            best = name
    spec_has_off = " off " in " %s " % spec_n
    name_has_off = best and " off " in " %s " % normalize(best)
    if best_score < 3 or (spec_has_off and not name_has_off):
        return "add a dedicated case; nearest existing: %s" % (best or names[0])
    return best


def guess_files(section_id, spec):
    ordered = []
    seen = set()

    def add(paths):
        for path in paths:
            if path not in seen:
                seen.add(path)
                ordered.append(path)

    add(SECTION_FILES.get(section_id, []))
    for pattern, paths in KEYWORD_FILES:
        if pattern.search(spec):
            add(paths)
    add(["tests/interactions.js"])
    return ordered[:4]


def parse_pm(text):
    verifies = []
    todos = []
    doing = []
    blocked = []
    section_id = ""
    section_name = ""
    skip = False
    for line in text.splitlines():
        heading = HEADING_RE.match(line)
        if heading:
            title = heading.group(1).strip()
            if title.lower().startswith("stretch") or title.lower().startswith("loop tick"):
                skip = True
                continue
            skip = False
            num = title.split(".", 1)[0].strip()
            section_id = num if num.isdigit() else title
            section_name = title
            continue
        if skip:
            continue
        item = ITEM_RE.match(line.strip())
        if not item:
            continue
        status, spec, conclusion = item.groups()
        row = {
            "status": status,
            "spec": spec.strip(),
            "conclusion": conclusion.strip(),
            "section_id": section_id,
            "section": section_name,
        }
        if status == "doing":
            doing.append(row)
        elif status == "blocked":
            blocked.append(row)
        elif status == "verify":
            verifies.append(row)
        elif status == "todo":
            todos.append(row)
    return verifies, todos, doing, blocked


def render(items, doing, tests):
    lines = [
        "# Emberwood next ticks",
        "",
        "Generated by `python3 tools/loop-next.py`. Parent reads **this file** + `git status`.",
        "Do not paste `AGENT.md` or `loop-tasks.md` into the Task prompt.",
        "",
    ]
    if doing:
        lines.append("**Busy:**")
        for row in doing:
            lines.append("- `%s` %s" % (row["section"], row["spec"]))
        lines.append("")
        lines.append("If Busy is set, skip spawn (no user-facing essay).")
        lines.append("")
    else:
        lines.append("**Busy:** none")
        lines.append("")

    if not items:
        lines.append("Queue empty (or only Stretch remains).")
        lines.append("")
        return "\n".join(lines)

    lines.append("Pick **#1**. One spawned tick = one item. Refresh this file after commit.")
    lines.append("")
    for i, row in enumerate(items, 1):
        files = guess_files(row["section_id"], row["spec"])
        test = guess_test(row["spec"], tests)
        lines.append("## %d. [%s] %s" % (i, row["status"], row["spec"]))
        lines.append("")
        lines.append("- Section: %s" % row["section"])
        lines.append("- Files: `%s`" % "`, `".join(files))
        lines.append("- Test: `%s`" % test)
        lines.append("- URL: reuse live `http://127.0.0.1:<port>/` (suite: `/tests/run.html?only=` + the test name)")
        lines.append("")
    lines.append("After `done` + tests: commit, then `python3 tools/loop-next.py`.")
    lines.append("")
    return "\n".join(lines)


def main():
    with open(PM, encoding="utf-8") as handle:
        verifies, todos, doing, _blocked = parse_pm(handle.read())
    queue = (verifies + todos)[:5]
    body = render(queue, doing, load_tests())
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(body)
    sys.stdout.write("Wrote %s (%d queued, %d doing)\n" % (OUT, len(queue), len(doing)))


if __name__ == "__main__":
    main()
