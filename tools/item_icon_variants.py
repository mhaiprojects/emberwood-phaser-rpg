"""Derived unique item / mob / NPC pixel icons for Emberwood.

Imported by generate_svgs.py so every live ITEM_DB id can own a distinct SVG.
"""

from __future__ import annotations


def remap_rows(rows, table):
    return ["".join(table.get(ch, ch) for ch in row) for row in rows]


def translate_rows(rows, fr, to):
    if len(fr) != len(to):
        raise ValueError("translate length mismatch")
    table = str.maketrans(fr, to)
    return [row.translate(table) for row in rows]


# Metal head / blade recolors (copper palette letters OoYy as source).
METAL = {
    "wood": ("OoYy", "MmTT"),
    "copper": None,
    "iron": ("OoYy", "Uuww"),
    "diamond": ("OoYy", "CcWw"),
    "dragonite": ("OoYy", "DdYy"),
}

# Sword blade letters IyY → metal.
SWORD_METAL = {
    "copper": ("IyY", "OoY"),
    "iron": ("IyY", "UuW"),
    "diamond": ("IyY", "CcW"),
    "dragonite": ("IyY", "DdY"),
}

# Net ring letter A/a.
NET_METAL = {
    "copper": ("Aa", "Oo"),
    "iron": ("Aa", "Uu"),
    "diamond": ("Aa", "Cc"),
    "dragonite": ("Aa", "Dd"),
}

# Bow limb H + tip Y accents.
BOW_TIER = {
    "wood": None,
    "copper": ("HmY", "OmY"),
    "ash": ("HmY", "NmG"),
    "yew": ("HmY", "VmO"),
    "magic": ("HmY", "PmC"),
}


def apply_tier(rows, tier_map, tier):
    spec = tier_map.get(tier)
    if not spec:
        return [r for r in rows]
    return translate_rows(rows, spec[0], spec[1])


# --- Unique base arts (not simple recolors of another live id) ---

WOODCLUB = [
    "................",
    "................",
    ".........TT.....",
    "........TMMT....",
    ".......TMMmT....",
    "......TMmm......",
    ".....TMm........",
    "....TMm.........",
    "...TMm..........",
    "..TMm...........",
    ".TMm............",
    "Tm..............",
    "................",
    "................",
    "................",
    "................",
]

SHELL = [
    "................",
    "................",
    "......OOOO......",
    "....OOooooOO....",
    "...OoWWWWWoO....",
    "...OoWyyWWoO....",
    "...OoWWWWWoO....",
    "....OOooooOO....",
    "......OOOO......",
    ".......oo.......",
    "......o..o......",
    "................",
    "................",
    "................",
    "................",
    "................",
]

STAFF = [
    "................",
    ".......CCC......",
    "......CwWC......",
    "......CwWC......",
    ".......mm.......",
    ".......mm.......",
    ".......mm.......",
    ".......mm.......",
    ".......mm.......",
    ".......mm.......",
    ".......mm.......",
    "......mmmm......",
    "................",
    "................",
    "................",
    "................",
]

WIZARDROBE = [
    "................",
    "......vvvv......",
    ".....vVVVVv.....",
    "....vVWWWVv.....",
    "....vVEEVv......",
    "....vVVVVv......",
    "...vvVVVVvv.....",
    "..v.vVVVVv.v....",
    "..v..vvvv..v....",
    ".....vvvv.......",
    "....vv..vv......",
    "....JJ..JJ......",
    "................",
    "................",
    "................",
    "................",
]

ARMOUR = [
    "................",
    ".....OOOOOO.....",
    "....OoYYYYOo....",
    "...OoYEEEYoO....",
    "...OoYYYYYoO....",
    "...OoYooYoO.....",
    "...OoYYYYYoO....",
    "....OoYYYYOo....",
    ".....OOOOOO.....",
    ".....Oo..oO.....",
    ".....Oo..oO.....",
    "................",
    "................",
    "................",
    "................",
    "................",
]

GUAM = [
    "................",
    "................",
    "......gg........",
    ".....gGGg.......",
    "....gGYGGg......",
    "...gGYYYGg......",
    "....gGYGGg......",
    ".....gGGg.......",
    "......mm........",
    "......mm........",
    ".....mmm........",
    "................",
    "................",
    "................",
    "................",
    "................",
]

ATTACKPOT = [
    "................",
    "......WWWW......",
    ".....WyyyyW.....",
    ".....WyRRyW.....",
    ".....WyRRyW.....",
    ".....WyRRyW.....",
    ".....WyyyyW.....",
    "......WWWW......",
    ".......mm.......",
    "......mmmm......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

OAKPLANK = [
    "................",
    "................",
    "..TTTTTTTTTTTT..",
    ".TMMMMMMMMMMMMT.",
    ".TMmMmMmMmMmMmT.",
    ".TMMMMMMMMMMMMT.",
    ".TMmMmMmMmMmMmT.",
    ".TMMMMMMMMMMMMT.",
    "..TTTTTTTTTTTT..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

CLUESCROLL = [
    "................",
    "...IIIIIIIIII...",
    "..IWWWWWWWWWWI..",
    "..IWmmmmmmmmWI..",
    "..IWmYYYYYYmWI..",
    "..IWmY....YmWI..",
    "..IWmYYYYYYmWI..",
    "..IWmYYm...mWI..",
    "..IWmYYYYYYmWI..",
    "..IWmmmmmmmmWI..",
    "..IWWWWWWWWWWI..",
    "...IIIIIIIIII...",
    "................",
    "................",
    "................",
    "................",
]

BATFANG = [
    "................",
    "................",
    "....WW..........",
    "...WwW..........",
    "...WWw..........",
    "....WWW.........",
    ".....WwW........",
    "......WwW.......",
    ".......WwW......",
    "........Ww......",
    ".........W......",
    "................",
    "................",
    "................",
    "................",
    "................",
]

WATERRUNE = [
    "................",
    "................",
    "......BBBB......",
    "....BBccBBcc....",
    "...BcWWWWWWcB...",
    "...BWWCWWWWWB...",
    "..BcWCWWWCCWcB..",
    "..BBWWCWWCWWBB..",
    "..BBWWWCWCWWBB..",
    "..BcWWWWWCCWcB..",
    "...BWWWWWWWWB...",
    "...BcWWWWWWcB...",
    "....BBccBBcc....",
    "......BBBB......",
    "................",
    "................",
]

EARTHRUNE = [
    "................",
    "................",
    "......HHHH......",
    "....HHmmHHmm....",
    "...HmWWWWWWmH...",
    "...HWWHWWWWWH...",
    "..HmWHWWWHHWmH..",
    "..HHWWHWWHWWHH..",
    "..HHWWWHWHWWHH..",
    "..HmWWWWWHHWmH..",
    "...HWWWWWWWWH...",
    "...HmWWWWWWmH...",
    "....HHmmHHmm....",
    "......HHHH......",
    "................",
    "................",
]

# Cooked / raw meat silhouettes (distinct from beef / shrimp).
MEATS = {
    "chicken": [
        "................",
        "................",
        ".....YYYYYY.....",
        "....YyyyyyyY....",
        "...YyYoooYyY....",
        "...YyyyyyyyY....",
        "...YyYoooYyY....",
        "....YyyyyyyY....",
        ".....YYYYYY.....",
        "......O..O......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawchicken": [
        "................",
        "................",
        ".....SSSSSS.....",
        "....SssssssS....",
        "...SsSoooSsS....",
        "...SsssssssS....",
        "...SsSoooSsS....",
        "....SssssssS....",
        ".....SSSSSS.....",
        "......s..s......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "cookedslime": [
        "................",
        "................",
        "......gggg......",
        "....ggLLLLgg....",
        "...gLLyyLLgg....",
        "...gLLLLLLgg....",
        "....ggLLLLgg....",
        "......gggg......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawslime": [
        "................",
        "................",
        "......nnnn......",
        "....nnNNNNnn....",
        "...nNNyyNNnn....",
        "...nNNNNNNnn....",
        "....nnNNNNnn....",
        "......nnnn......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "crab": [
        "................",
        "................",
        "....OO....OO....",
        "...OoO....OoO...",
        "....OOOOOOOO....",
        "...OoOyoyoOoO...",
        "...OoOOOOOoO....",
        "....OOOOOOOO....",
        ".....Oo..oO.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawcrab": [
        "................",
        "................",
        "....RR....RR....",
        "...RrR....RrR...",
        "....RRRRRRRR....",
        "...RrRyryrRrR...",
        "...RrRRRRrR.....",
        "....RRRRRRRR....",
        ".....Rr..rR.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "cookedgoblin": [
        "................",
        "................",
        ".....nnnnnn.....",
        "....nNNNNNNn....",
        "...nNnoooNNn....",
        "...nNNNNNNNn....",
        "...nNnoooNNn....",
        "....nNNNNNNn....",
        ".....nnnnnn.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawgoblin": [
        "................",
        "................",
        ".....gggggg.....",
        "....gGGGGGGg....",
        "...gGGoooGGg....",
        "...gGGGGGGGg....",
        "...gGGoooGGg....",
        "....gGGGGGGg....",
        ".....gggggg.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "ribs": [
        "................",
        "................",
        "...W.W.W.W.W....",
        "...WwWwWwWwW....",
        "...W.W.W.W.W....",
        "...mmmmmmmmm....",
        "...W.W.W.W.W....",
        "...WwWwWwWwW....",
        "...W.W.W.W.W....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawrib": [
        "................",
        "................",
        "...I.I.I.I.I....",
        "...IwIwIwIwI....",
        "...I.I.I.I.I....",
        "...RRRRRRRRR....",
        "...I.I.I.I.I....",
        "...IwIwIwIwI....",
        "...I.I.I.I.I....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rabbit": [
        "................",
        "................",
        ".....SSSSSS.....",
        "....SwwwwwwS....",
        "...SwSooSwwS....",
        "...SwwwwwwwS....",
        "...SwSooSwwS....",
        "....SwwwwwwS....",
        ".....SSSSSS.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawrabbit": [
        "................",
        "................",
        ".....XXXXXX.....",
        "....XssssssX....",
        "...XsXooXssX....",
        "...XsssssssX....",
        "...XsXooXssX....",
        "....XssssssX....",
        ".....XXXXXX.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "cookedbat": [
        "................",
        "................",
        ".....JJJJJJ.....",
        "....JjJJJJjJ....",
        "...JjJooJjJ.....",
        "...JjJJJJJjJ....",
        "...JjJooJjJ.....",
        "....JjJJJJjJ....",
        ".....JJJJJJ.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawbat": [
        "................",
        "................",
        ".....jjjjjj.....",
        "....jJJJJJj.....",
        "...jJJooJJj.....",
        "...jJJJJJJj.....",
        "...jJJooJJj.....",
        "....jJJJJJj.....",
        ".....jjjjjj.....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "drakesteak": [
        "................",
        "................",
        "....DDDDDDDD....",
        "...DdOOOOOOdD...",
        "...DdOYYoOdD....",
        "...DdOOOOOOdD...",
        "...DdOYYoOdD....",
        "...DdOOOOOOdD...",
        "....DDDDDDDD....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawdrake": [
        "................",
        "................",
        "....dddddddd....",
        "...dDoooooDd....",
        "...dDoYYoDd.....",
        "...dDoooooDd....",
        "...dDoYYoDd.....",
        "...dDoooooDd....",
        "....dddddddd....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "dragonsteak": [
        "................",
        "................",
        "....RRRRRRRR....",
        "...RrFFFFFFrR...",
        "...RrFYYFFrR....",
        "...RrFFFFFFrR...",
        "...RrFYYFFrR....",
        "...RrFFFFFFrR...",
        "....RRRRRRRR....",
        "......YYYY......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "rawdragon": [
        "................",
        "................",
        "....rrrrrrrr....",
        "...rRdddddRr....",
        "...rRdYYdRr.....",
        "...rRdddddRr....",
        "...rRdYYdRr.....",
        "...rRdddddRr....",
        "....rrrrrrrr....",
        "......oooo......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
}

SHORTBOW_UNSTRUNG = [
    "................",
    ".......HH.......",
    "......HwwH......",
    ".....Hw..wH.....",
    "....Hw..........",
    "...Hw...........",
    "...H............",
    "...H............",
    "....H...........",
    ".....H..........",
    "......H.........",
    ".......H........",
    "................",
    "................",
    "................",
    "................",
]

SCALE_GLOVES = [
    "................",
    "................",
    "...gg..gg..gg...",
    "..gGGggGGggGGg..",
    "..gGYGgGYGgGYg..",
    "..gGGGGGGGGGGg..",
    "..gGGGGGGGGGGg..",
    "...gGGGGGGGGg...",
    "....gGGGGGGg....",
    ".....gggggg.....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

# Mobs / NPCs
DRAGON = [
    "........................",
    "..........rrrrrrrr......",
    ".........rrRRRRrrrr.....",
    "........rrRRRRRRrrr.....",
    "....Y...rRRRRRRRRr......",
    "....YY.rRRRRRRRRRr......",
    "...RRRRRRRRRRRRRr.......",
    "..RREFRRRRRRRRRr........",
    "..RRFFRRRRRRRRr.........",
    ".RRRRRRRRRRRRRr.........",
    ".RRRRRRRRRRRRRRR........",
    "..RRRRRRRRRRRRRRRR......",
    "...RRRRRRRRRRRRRrR......",
    "....RRRRRRRRRRRr.R......",
    ".....kk....kk...........",
    ".....kk....kk...........",
    ".....KK....KK...........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
]

DUMMY = [
    "................",
    "......TTTT......",
    ".....TSSSST.....",
    ".....TSEEET.....",
    ".....TSSSST.....",
    "......TTTT......",
    ".......mm.......",
    "....mmmmmmmm....",
    "...mYYYYYYYYm...",
    "...mYmmmmmmYm...",
    "....mmmmmmmm....",
    ".......mm.......",
    "......mmmm......",
    ".....mm..mm.....",
    "................",
    "................",
]

ARMS = [
    "................",
    "....oooooo......",
    "...oOOOOOOo.....",
    "...oOSEESOo.....",
    "...oOSKKSoO.....",
    "....oOOOOO......",
    "...IIIIIIII.....",
    "..I.IyyyyI.I....",
    "....IIIIII......",
    "....IIIIII......",
    "....UUyyUU......",
    "....oo..oo......",
    "....kk..kk......",
    "................",
    "................",
    "................",
]


def expand_items(base_items):
    """Return a full ITEMS dict including unique live-id icons."""
    items = dict(base_items)

    # Drop deleted / unused legacy icons from the generator set.
    for dead in ("burntshrimp", "burntbeef", "tin", "naturerune", "mindrune"):
        items.pop(dead, None)

    # Canonical renames keeping copper* as live file names.
    if "bronzebar" in items:
        items["copperbar"] = items.pop("bronzebar")
    if "bronzeaxe" in items:
        items["copperaxe"] = items.pop("bronzeaxe")
    if "bronzepick" in items:
        items["copperpick"] = items.pop("bronzepick")
    if "bronzedagger" in items:
        items["copperdagger"] = items.pop("bronzedagger")

    # Unique singles
    items["woodclub"] = WOODCLUB
    items["shell"] = SHELL
    items["staff"] = STAFF
    items["wizardrobe"] = WIZARDROBE
    items["guam"] = GUAM
    items["attackpot"] = ATTACKPOT
    items["oakplank"] = OAKPLANK
    items["cluescroll"] = CLUESCROLL
    items["batfang"] = BATFANG
    items["waterrune"] = WATERRUNE
    items["earthrune"] = EARTHRUNE
    items["shortbowunstrung"] = SHORTBOW_UNSTRUNG
    items["scalegloves"] = SCALE_GLOVES
    items.update(MEATS)

    # Axes from copperaxe template
    axe = items["copperaxe"]
    items["woodaxe"] = apply_tier(axe, METAL, "wood")
    items["ironaxe"] = apply_tier(axe, METAL, "iron")
    items["diamondaxe"] = apply_tier(axe, METAL, "diamond")
    items["dragoniteaxe"] = apply_tier(axe, METAL, "dragonite")

    # Picks
    pick = items["copperpick"]
    items["woodpick"] = apply_tier(pick, METAL, "wood")
    items["ironpick"] = apply_tier(pick, METAL, "iron")
    items["diamondpick"] = apply_tier(pick, METAL, "diamond")
    items["dragonitepick"] = apply_tier(pick, METAL, "dragonite")

    # Bars
    bar = items["copperbar"]
    items["ironbar"] = apply_tier(bar, METAL, "iron")
    items["diamondbar"] = apply_tier(bar, METAL, "diamond")
    items["dragonitebar"] = apply_tier(bar, METAL, "dragonite")

    # Swords
    sword = items["sword"]
    items["coppersword"] = apply_tier(sword, SWORD_METAL, "copper")
    items["ironsword"] = apply_tier(sword, SWORD_METAL, "iron")
    items["diamondsword"] = apply_tier(sword, SWORD_METAL, "diamond")
    items["dragonitesword"] = apply_tier(sword, SWORD_METAL, "dragonite")

    # Shields — template uses m/T/y wood letters, not Oo metal heads.
    shield = items["shield"]
    items["coppershield"] = translate_rows(shield, "mTyY", "oOYY")
    items["ironshield"] = translate_rows(shield, "mTyY", "uUww")
    items["diamondshield"] = translate_rows(shield, "mTyY", "cCWW")
    items["dragoniteshield"] = translate_rows(shield, "mTyY", "dDYY")

    # Nets
    net = items["net"]
    items["coppernet"] = apply_tier(net, NET_METAL, "copper")
    items["ironnet"] = apply_tier(net, NET_METAL, "iron")
    items["diamondnet"] = apply_tier(net, NET_METAL, "diamond")
    items["dragonitenet"] = apply_tier(net, NET_METAL, "dragonite")

    # Bows
    bow = items["shortbow"]
    items["woodbow"] = [r for r in bow]
    items["copperbow"] = apply_tier(bow, BOW_TIER, "copper")
    items["oakbow"] = apply_tier(bow, BOW_TIER, "ash")
    items["yewbow"] = apply_tier(bow, BOW_TIER, "yew")
    items["magicbow"] = apply_tier(bow, BOW_TIER, "magic")

    # Arrows — tip I/Y metalized, shafts stay
    arrow = items["arrow"]
    items["woodarrow"] = translate_rows(arrow, "IyY", "TTY")
    items["copperarrow"] = translate_rows(arrow, "IyY", "OoY")
    items["ironarrow"] = translate_rows(arrow, "IyY", "UuW")
    items["diamondarrow"] = translate_rows(arrow, "IyY", "CcW")
    items["dragonitearrow"] = translate_rows(arrow, "IyY", "DdY")

    # Staves — gem color by tier
    staff = STAFF
    items["copperstaff"] = translate_rows(staff, "Cw", "Oo")
    items["ironstaff"] = translate_rows(staff, "Cw", "Uu")
    items["diamondstaff"] = translate_rows(staff, "Cw", "CW")
    items["dragonitestaff"] = translate_rows(staff, "Cw", "Dd")

    # Armour tiers
    armour = ARMOUR
    items["copperarmour"] = armour
    items["ironarmour"] = apply_tier(armour, METAL, "iron")
    items["diamondarmour"] = apply_tier(armour, METAL, "diamond")
    items["dragonitearmour"] = apply_tier(armour, METAL, "dragonite")

    return items


def extra_mobs():
    return {"dragon": DRAGON}


def extra_npcs():
    return {"dummy": DUMMY, "arms": ARMS}
