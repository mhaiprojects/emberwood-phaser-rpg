#!/usr/bin/env python3
"""Original pixel and HUD SVGs for Emberwood (no third-party packs)."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG = os.path.join(ROOT, "assets", "svg")

PAL = {
    ".": None,
    "K": (20, 14, 12, 255),
    "k": (48, 32, 24, 255),
    "W": (240, 236, 228, 255),
    "w": (200, 196, 188, 255),
    "E": (32, 24, 20, 255),
    "S": (236, 188, 132, 255),
    "s": (196, 140, 96, 255),
    "H": (92, 54, 32, 255),
    "h": (122, 74, 42, 255),
    "B": (52, 90, 168, 255),
    "b": (36, 62, 122, 255),
    "G": (72, 196, 92, 255),
    "g": (40, 122, 48, 255),
    "N": (90, 160, 70, 255),
    "n": (58, 108, 44, 255),
    "Y": (240, 208, 72, 255),
    "y": (212, 168, 48, 255),
    "O": (220, 120, 52, 255),
    "o": (168, 72, 32, 255),
    "R": (196, 52, 48, 255),
    "r": (148, 36, 36, 255),
    "P": (122, 62, 168, 255),
    "p": (78, 36, 118, 255),
    "C": (88, 200, 220, 255),
    "c": (48, 140, 168, 255),
    "U": (180, 176, 188, 255),
    "u": (120, 118, 128, 255),
    "M": (168, 128, 72, 255),
    "m": (96, 64, 32, 255),
    "T": (196, 164, 96, 255),
    "A": (72, 148, 196, 255),
    "a": (40, 92, 156, 255),
    "F": (240, 80, 40, 255),
    "D": (196, 92, 40, 255),
    "d": (150, 48, 32, 255),
    "L": (120, 228, 140, 255),
    "I": (230, 210, 160, 255),
    "X": (220, 80, 120, 255),
    "Z": (88, 86, 96, 255),
    "Q": (210, 200, 170, 255),
    "q": (90, 86, 80, 255),
    "V": (150, 70, 32, 255),
    "v": (110, 70, 150, 255),
    "J": (62, 32, 96, 255),
    "j": (92, 52, 128, 255),
}


def pix(rows):
    h = len(rows)
    w = len(rows[0])
    pixels = []
    for row in rows:
        if len(row) != w:
            raise ValueError("row width mismatch")
        for ch in row:
            if ch not in PAL:
                raise ValueError("unknown color " + ch)
            pixels.append(PAL[ch])
    return w, h, pixels


def pixel_svg(w, h, pixels):
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" shape-rendering="crispEdges">'
        % (w, h, w, h)
    ]
    for y in range(h):
        for x in range(w):
            c = pixels[y * w + x]
            if not c or c[3] == 0:
                continue
            fill = "#%02x%02x%02x" % (c[0], c[1], c[2])
            op = "" if c[3] == 255 else ' opacity="%.2f"' % (c[3] / 255.0)
            parts.append('<rect x="%d" y="%d" width="1" height="1" fill="%s"%s/>' % (x, y, fill, op))
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def write(rel, content):
    path = os.path.join(SVG, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)


def save_pixels(rel, rows):
    w, h, pixels = pix(rows)
    write(rel, pixel_svg(w, h, pixels))


def icon(inner, size=32, fill_bg=True):
    bg = (
        '<rect x="1" y="1" width="30" height="30" rx="4" fill="#2b2418" stroke="#c9a227" stroke-width="1.5"/>'
        if fill_bg
        else ""
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" fill="none">'
        % (size, size, size, size)
        + bg
        + inner
        + "</svg>\n"
    )


MOBS = {
    "chicken": [
        "................",
        "......RR........",
        ".....RyyR.......",
        "....YYYYY.......",
        "...YYYYYYo......",
        "...YYYYYY.......",
        "....WYYYY.......",
        ".....E.E........",
        "....YYYYY.......",
        "...YY...YY......",
        "..YY.....YY.....",
        "..Y.......Y.....",
        "....O...O.......",
        "....O...O.......",
        "................",
        "................",
    ],
    "goblin": [
        "................",
        "...n......n.....",
        "..nN......Nn....",
        "...NNNNNNNN.....",
        "...NENNNEN......",
        "...NNNNNNNN.....",
        "....NNKKNN......",
        "...mmNNNNNmm....",
        "..m.NNNNNN.m....",
        "....mmmmmm......",
        "....nmmmmn......",
        "....nn..nn......",
        "....mm..mm......",
        "....kk..kk......",
        "................",
        "................",
    ],
    "cow": [
        "................",
        "...I........I...",
        "...kWWWWWWWWk...",
        "...WhWWWWWhWW...",
        "...WWEWWWEWWW...",
        "...WWWWWWWWWW...",
        "....WWKKWW......",
        "...MMMMWMMM.....",
        "..MWMWMWMWM.....",
        "..MMMMMMMMM.....",
        "..MMMM.MMMM.....",
        "..m..m.m..m.....",
        "..k..k.k..k.....",
        "................",
        "................",
        "................",
    ],
    "slime": [
        "................",
        "................",
        "................",
        "......gggg......",
        "....ggGGGGgg....",
        "...gGGLLLLGGg...",
        "...gGLWLLWLGg...",
        "..ggGLELLLELgg..",
        "..gGGLLLLLLLGg..",
        "..gGGGGGGGGGGg..",
        "...gGGGGGGGGg...",
        "....gggggggg....",
        ".....g....g.....",
        "................",
        "................",
        "................",
    ],
    "crab": [
        "................",
        "R..............R",
        "rR............Rr",
        ".RR...RRRR...RR.",
        ".R.R.RRRRRR.R.R.",
        "..RRRREEEERRRR..",
        "...RRWWWWWRRR...",
        "...RRRRRRRRRR...",
        "..R.RRRRRRRR.R..",
        ".R...RRRRRR...R.",
        "R.....R..R.....R",
        "......R..R......",
        ".....R....R.....",
        "................",
        "................",
        "................",
    ],
    "bat": [
        "................",
        "................",
        ".J..J......J..J.",
        ".JJ.J......J.JJ.",
        "..JJJjjjjjjJJJ..",
        "...JjjWWWWjjJ...",
        "...jjjEjjEjjj...",
        "..JjjjjjjjjjjJ..",
        "..J.jjjjjjjj.J..",
        ".....j.jj.j.....",
        ".....j....j.....",
        "....j......j....",
        "................",
        "................",
        "................",
        "................",
    ],
    "skeleton": [
        "................",
        ".....WWWWW......",
        "....WEEWEEW.....",
        "....WWWWWWW.....",
        ".....WKKKW......",
        "......WWW.......",
        ".....WWWWW......",
        "....W.WWW.W.....",
        "....W.WWW.W.....",
        ".....WW.WW......",
        ".....W...W......",
        ".....W...W......",
        "....WW...WW.....",
        "................",
        "................",
        "................",
    ],
    "drake": [
        "........................",
        "............dddddddd....",
        "...........ddDDDDdddd...",
        "..........ddDDDDDDddd...",
        "....I....ddDDDDDDDDd....",
        "....II..dDDDDDDDDDd.....",
        "...DDDDDDDDDDDDDDd......",
        "..DDEDDDDDDDDDDDd.......",
        "..DDDFDDDDDDDDDd........",
        ".DDDDDDDDDDDDDDd........",
        ".DDDDDDDDDDDDDDDD.......",
        "..DDDDDDDDDDDDDDDDD.....",
        "...DDDDDDDDDDDDDDdD.....",
        "....DDDDDDDDDDDDd.D.....",
        ".....VV....VV...........",
        ".....VV....VV...........",
        ".....kk....kk...........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ],
}

NPCS = {
    "guild": [
        "................",
        "....yyyyyy......",
        "...yHHHHHHy.....",
        "...HSSSSSSH.....",
        "...HSEESSEH.....",
        "...HSSKKSSH.....",
        "....HHHHHH......",
        "...yyyyyyyy.....",
        "..y.yyyyyy.y....",
        "....yyyyyy......",
        "....yyyyyy......",
        "....bb..bb......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "banker": [
        "................",
        "....WWWWWW......",
        "...WuuuuuuW.....",
        "...uSSSSSSu.....",
        "...uSEESSEu.....",
        "...uSSKKKSu.....",
        "....uuuuuu......",
        "...UUUUUUUU.....",
        "..U.UyyyyU.U....",
        "....UUUUUU......",
        "....UUUUUU......",
        "....uu..uu......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "guard": [
        "................",
        "....bbbbbb......",
        "...bWWWWWWb.....",
        "...bBEEEEBb.....",
        "...bB....Bb.....",
        "...bbBBBBbb.....",
        "....SSSSSS......",
        "...BBBBBBBB.....",
        "..B.ByyyyB.B....",
        "....BBBBBB......",
        "....BBBBBB......",
        "....bb..bb......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "ranger": [
        "................",
        "....gggggg......",
        "...gNNNNNNg.....",
        "...gNSSSSNg.....",
        "...gNEESSEg.....",
        "...gNSKKNSg.....",
        "....gggggg......",
        "...nnnnnnnn.....",
        "..n.nmmmmn.n....",
        "....nnnnnn......",
        "....nnnnnn......",
        "....nn..nn......",
        "....mm..mm......",
        "................",
        "................",
        "................",
    ],
    "farmer": [
        "................",
        "...TTTTTTTT.....",
        "....TTTTTT......",
        "...TSSSSSST.....",
        "...TSEESSET.....",
        "...TSSKKSST.....",
        "....ssssss......",
        "...MMMMMMMM.....",
        "..M.MTTTTM.M....",
        "....MMMMMM......",
        "....MMMMMM......",
        "....mm..mm......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "fisher": [
        "................",
        "....aaaaaa......",
        "...aAAAAAAa.....",
        "...aSSSSSSa.....",
        "...aSEESSEa.....",
        "...aSSKKKSa.....",
        "....aaaaaa......",
        "...AAAAAAAA.....",
        "..A.AyyyyA.A....",
        "....AAAAAA......",
        "....AAAAAA.C....",
        "....aa..aaCC....",
        "....kk..kk.c....",
        "................",
        "................",
        "................",
    ],
    "wanderer": [
        "................",
        "....pppppp......",
        "...pPPPPPPp.....",
        "...pPSSSSPp.....",
        "...pPEESSEp.....",
        "...pPSKKPSp.....",
        "....pppppp......",
        "...PPPPPPPP.....",
        "..P.PPPPPP.P....",
        "....PPPPPP......",
        "....PPPPPP......",
        "....pp..pp......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "ghost": [
        "................",
        ".....CCCCC......",
        "....CWWWWWC.....",
        "...CWWWWWWWC....",
        "...CWEWWWEWC....",
        "...CWWKKKWWC....",
        "....CCCCCCC.....",
        "...CCCCCCCCC....",
        "..C.CCCCCCC.C...",
        "...CCCCCCCCC....",
        "...CCC.CCC.C....",
        "...CC...CC......",
        "....C....C......",
        "................",
        "................",
        "................",
    ],
    "miner": [
        "................",
        "....mmmmmm......",
        "...mqqqqqqm.....",
        "...qSSSSSSq.....",
        "...qSEESSEq.....",
        "...qSSKKKSq.....",
        "....hhhhhh......",
        "...MMMMMMMM.....",
        "..M.MyyyyM.M.y..",
        "....MMMMMM...y..",
        "....MMMMMM..yy..",
        "....mm..mm.yy...",
        "....kk..kk.k....",
        "................",
        "................",
        "................",
    ],
    "hermit": [
        "................",
        "....hhhhhh......",
        "...hHHHHHHh.....",
        "...hSSSSSSh.....",
        "...hSEESSEh.....",
        "...hSSKKKSh.....",
        "....hhhhhh......",
        "...MMMMMMMM.....",
        "..M.MmmmmM.M....",
        "....MMMMMM......",
        "....MMMMMM......",
        "....mm..mm......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "witch": [
        "................",
        "......pp........",
        ".....pppp.......",
        "....pppppp......",
        "...pppppppp.....",
        "...pSSSSSSp.....",
        "...pSEESSEp.....",
        "...pSSKKKSp.....",
        "....pppppp......",
        "...PPPPPPPP.....",
        "..P.PnNNnP.P....",
        "....PPPPPP......",
        "....PPPPPP......",
        "....pp..pp......",
        "....kk..kk......",
        "................",
    ],
    "cook": [
        "................",
        ".....WWWW.......",
        "....WWWWWW......",
        "...WWWWWWWW.....",
        "...WSSSSSSW.....",
        "...WSEESSEW.....",
        "...WSSKKSSW.....",
        "....WWWWWW......",
        "...WWWRRWWW.....",
        "..W.WWWWWW.W.O..",
        "....WWWWWW...O..",
        "....ww..ww......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "priest": [
        "................",
        "....uuuuuu......",
        "...uWWWWWWu.....",
        "...uSSSSSSu.....",
        "...uSEESSEu.....",
        "...uSSKKKSu.....",
        "....WWWWWW......",
        "...bbbbbbbb.....",
        "..b.bWWWWb.b....",
        "....bbbbbb......",
        "....bbbbbb......",
        "....bb..bb......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
    "shopkeeper": [
        "................",
        "....oooooo......",
        "...oHHHHHHo.....",
        "...oSSSSSSo.....",
        "...oSEESSEo.....",
        "...oSSKKKSo.....",
        "....oooooo......",
        "...OOOOOOOO.....",
        "..O.OyyyyO.O....",
        "....OOOOOO......",
        "....OOOOOO......",
        "....oo..oo......",
        "....kk..kk......",
        "................",
        "................",
        "................",
    ],
}

ITEMS = {
    "coins": [
        "................",
        "................",
        ".....yyyyy......",
        "....yYYYYYy.....",
        "...yYYKKYYYy....",
        "...yYYyyyYYy....",
        "...yYYKKYYYy....",
        "....yYYYYYy.....",
        ".....yyyyyyY....",
        "......yYYYYYy...",
        "......yYKKYYy...",
        "......yYYYYYy...",
        ".......yyyyy....",
        "................",
        "................",
        "................",
    ],
    "shrimp": [
        "................",
        ".........SS.....",
        "........SsS.....",
        ".......SsS......",
        "......OOOO......",
        ".....OOSOOO.....",
        "....OOSESOOO....",
        "...OOOSOOO......",
        "..OOOOOO........",
        ".OOO............",
        "OO..............",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "bread": [
        "................",
        "................",
        "....TTTTTTT.....",
        "...TMMMMMMMT....",
        "..TMMWWWWMMT....",
        "..TMMWWWWMMT....",
        "..TMMMMMMMMT....",
        "...TMMMMMMT.....",
        "....TTTTTT......",
        ".....mmmm.......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "sword": [
        "................",
        ".........I......",
        "........IyI.....",
        ".......IyYI.....",
        "......IyYYI.....",
        ".....IyYYI......",
        "....IyYYI.......",
        "...mmYYI........",
        "..mmmm..........",
        ".mm.............",
        "y...............",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "shortbow": [
        "................",
        ".......HH.......",
        "......HwwH......",
        ".....Hw..wH.....",
        "....Hw....m.....",
        "...Hw......m....",
        "...H........Y...",
        "...H........Y...",
        "....H......Y....",
        ".....H....Y.....",
        "......H..Y......",
        ".......HY.......",
        "................",
        "................",
        "................",
        "................",
    ],
    "arrow": [
        "................",
        "....I...I.......",
        "...IyI.IyI......",
        "....YY..YY......",
        "....mm..mm......",
        "....mm..mm......",
        "....mm..mm......",
        "...mMMmmMM......",
        "....mm..mm......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "shield": [
        "................",
        "....mmmmmmmm....",
        "...mTTTTTTTTm...",
        "...mTyyyyyyTm...",
        "...mTyTTTTyTm...",
        "...mTyTyyTyTm...",
        "...mTyTTTTyTm...",
        "...mTyyyyyyTm...",
        "...mTTTTTTTTm...",
        "....mTTTTTTTm...",
        ".....mTTTTTm....",
        "......mTTTm.....",
        ".......mmm......",
        "................",
        "................",
        "................",
    ],
    "key": [
        "................",
        "................",
        "......yyyy......",
        ".....yYYYYy.....",
        ".....yYkkYy.....",
        ".....yYYYYy.....",
        "......yyyy......",
        ".......yY.......",
        ".......yYyY.....",
        ".......yY.......",
        ".......yYyY.....",
        ".......yY.......",
        "................",
        "................",
        "................",
        "................",
    ],
    "bones": [
        "................",
        "....WW..........",
        "...WWwW.........",
        "...WwWW.........",
        "....WWW.........",
        ".....WWWWW......",
        "......WWWWW.....",
        ".......WWWWW....",
        "........WWwW....",
        ".........WWW....",
        "........WWw.....",
        ".......WW.......",
        "................",
        "................",
        "................",
        "................",
    ],
}


def ui_icons():
    gold = "#ffe08a"
    cream = "#f2e6c9"
    stroke = 'stroke="%s" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"' % cream
    return {
        "combat": icon(
            '<path %s d="M8 22 L14 10 L18 12 L12 24 Z"/><path %s d="M24 22 L18 10 L14 12 L20 24 Z"/><path stroke="%s" stroke-width="1.6" d="M11 24 H21"/>'
            % (stroke, stroke, gold)
        ),
        "skills": icon(
            '<polygon %s points="16,7 18.4,13.2 25,13.6 20,17.8 21.6,24 16,20.4 10.4,24 12,17.8 7,13.6 13.6,13.2"/>'
            % stroke
        ),
        "quest": icon(
            '<path %s d="M10 8 H22 Q24 8 24 10 V24 H10 Q8 24 8 22 V10 Q8 8 10 8 Z"/><path %s d="M12 12 H20 M12 16 H20 M12 20 H17"/>'
            % (stroke, stroke)
        ),
        "inv": icon(
            '<path %s d="M9 13 H23 L22 25 H10 Z"/><path %s d="M12 13 V11 Q12 8 16 8 Q20 8 20 11 V13"/><path stroke="%s" stroke-width="1.6" d="M16 15 V21"/>'
            % (stroke, stroke, gold)
        ),
        "equip": icon(
            '<path %s d="M8 12 L16 8 L24 12 V18 L16 24 L8 18 Z"/><path %s d="M12 14 L16 12 L20 14 V17 L16 20 L12 17 Z"/>'
            % (stroke, stroke)
        ),
        "prayer": icon(
            '<path %s d="M16 7 L18 13 H24 L19 17 L21 23 L16 19 L11 23 L13 17 L8 13 H14 Z"/>' % stroke
        ),
        "magic": icon(
            '<path %s d="M16 8 L17.5 13.5 L23 15 L17.5 16.5 L16 22 L14.5 16.5 L9 15 L14.5 13.5 Z"/><circle cx="10" cy="10" r="1.2" fill="%s"/><circle cx="23" cy="11" r="1" fill="%s"/>'
            % (stroke, gold, gold)
        ),
        "settings": icon(
            '<circle cx="16" cy="16" r="4" %s/><path %s d="M16 7 V10 M16 22 V25 M7 16 H10 M22 16 H25 M9.5 9.5 L11.6 11.6 M20.4 20.4 L22.5 22.5 M22.5 9.5 L20.4 11.6 M11.6 20.4 L9.5 22.5"/>'
            % (stroke, stroke)
        ),
        "attack": icon(
            '<path %s d="M9 23 L21 9 L24 12 L12 26 Z"/><path %s d="M8 20 H14"/>' % (stroke, stroke)
        ),
        "heal": icon(
            '<path %s d="M8 18 Q8 10 16 10 Q24 10 24 18 Q24 24 16 26 Q8 24 8 18 Z"/><path stroke="%s" stroke-width="1.8" d="M16 14 V22 M12 18 H20"/>'
            % (stroke, gold)
        ),
        "flee": icon(
            '<path %s d="M10 24 V12 L16 8 V24 Z"/><path %s d="M16 14 H24 L21 17 L24 20 H16"/>' % (stroke, stroke)
        ),
        "accurate": icon('<path %s d="M16 7 V25 M16 7 L13 11 M16 7 L19 11 M12 16 H20"/>' % stroke),
        "aggressive": icon('<path %s d="M8 22 L16 8 L24 22 Z"/><path %s d="M12 22 L16 14 L20 22"/>' % (stroke, stroke)),
        "defensive": icon('<path %s d="M8 11 L16 7 L24 11 V18 L16 25 L8 18 Z"/>' % stroke),
        "hp": icon('<path %s d="M8 14 Q8 9 12 9 Q16 9 16 13 Q16 9 20 9 Q24 9 24 14 Q24 20 16 25 Q8 20 8 14 Z"/>' % stroke, fill_bg=False),
        "gold": icon('<circle cx="13" cy="18" r="6" %s/><circle cx="19" cy="15" r="6" %s/>' % (stroke, stroke), fill_bg=False),
        "xp": icon('<polygon %s points="16,6 19,13 27,13.5 21,18.5 23,26 16,22 9,26 11,18.5 5,13.5 13,13"/>' % stroke, fill_bg=False),
        "minimap": icon('<path %s d="M8 8 H24 V24 H8 Z M8 16 H24 M16 8 V24"/>' % stroke),
    }


def skill_icons():
    cream = "#f2e6c9"
    gold = "#ffe08a"
    s = 'stroke="%s" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"' % cream
    return {
        "attack": icon('<path %s d="M8 23 L20 9 L24 13 L12 27 Z"/>' % s),
        "strength": icon('<path %s d="M8 16 H12 V12 H20 V16 H24 V20 H20 V24 H12 V20 H8 Z"/>' % s),
        "defence": icon('<path %s d="M8 11 L16 7 L24 11 V18 L16 25 L8 18 Z"/>' % s),
        "hitpoints": icon('<path %s d="M8 14 Q8 9 12 9 Q16 9 16 13 Q16 9 20 9 Q24 9 24 14 Q24 20 16 25 Q8 20 8 14 Z"/>' % s),
        "ranged": icon('<path %s d="M8 16 H24 M20 12 L24 16 L20 20 M10 10 V22"/>' % s),
        "prayer": icon('<path %s d="M16 7 L18 13 H24 L19 17 L21 23 L16 19 L11 23 L13 17 L8 13 H14 Z"/>' % s),
        "magic": icon('<path %s d="M16 8 L18 14 L24 16 L18 18 L16 24 L14 18 L8 16 L14 14 Z"/>' % s),
        "cooking": icon('<path %s d="M10 22 H22 V12 Q16 8 10 12 Z"/><path stroke="%s" stroke-width="1.5" d="M16 8 V12"/>' % (s, gold)),
        "fishing": icon('<path %s d="M12 8 V22 M12 8 Q22 10 18 16 Q14 14 12 16"/>' % s),
        "woodcutting": icon('<path %s d="M9 23 L14 14 L18 16 L13 25 Z"/><path %s d="M16 8 L22 14 M20 8 H24 V12"/>' % (s, s)),
        "mining": icon('<path %s d="M8 22 L16 10 L20 13 L12 25 Z"/><path %s d="M18 10 L24 8 L22 14"/>' % (s, s)),
        "crafting": icon('<path %s d="M10 22 V12 L16 8 L22 12 V22 Z"/><path %s d="M13 16 H19"/>' % (s, s)),
    }


def main():
    os.makedirs(SVG, exist_ok=True)
    for name, rows in MOBS.items():
        save_pixels(os.path.join("mobs", name + ".svg"), rows)
    for name, rows in NPCS.items():
        save_pixels(os.path.join("npcs", name + ".svg"), rows)
    for name, rows in ITEMS.items():
        save_pixels(os.path.join("items", name + ".svg"), rows)
    for name, xml in ui_icons().items():
        write(os.path.join("ui", name + ".svg"), xml)
    for name, xml in skill_icons().items():
        write(os.path.join("skills", name + ".svg"), xml)

    manifest = {
        "mobs": sorted(MOBS),
        "npcs": sorted(NPCS),
        "items": sorted(ITEMS),
        "ui": sorted(ui_icons()),
        "skills": sorted(skill_icons()),
        "license": "Original Emberwood artwork. CC0-1.0.",
    }
    write("manifest.json", json.dumps(manifest, indent=2) + "\n")
    print("Wrote SVGs to", SVG)


if __name__ == "__main__":
    main()
