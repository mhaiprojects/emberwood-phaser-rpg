#!/usr/bin/env python3
"""Generate tiny original pixel-art PNGs and a Tiled JSON map."""
import json
import os
import struct
import zlib
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")


def write_png(path, width, height, pixels):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw.extend((r, g, b, a))
    with open(path, "wb") as handle:
        handle.write(b"\x89PNG\r\n\x1a\n")
        handle.write(chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)))
        handle.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
        handle.write(chunk(b"IEND", b""))


def new_canvas(w, h, fill=(0, 0, 0, 0)):
    return [fill] * (w * h)


def put(pixels, w, x, y, color, h=None):
    if h is None:
        h = len(pixels) // w
    if 0 <= x < w and 0 <= y < h:
        pixels[y * w + x] = color


def fill_rect(pixels, w, h, x, y, rw, rh, color):
    for yy in range(y, y + rh):
        for xx in range(x, x + rw):
            put(pixels, w, xx, yy, color, h)


def blit(dest, dw, dx, dy, src, sw, sh):
    dh = len(dest) // dw
    for y in range(sh):
        for x in range(sw):
            r, g, b, a = src[y * sw + x]
            if a:
                put(dest, dw, dx + x, dy + y, (r, g, b, a), dh)


def hash_n(x, y, seed):
    return (x * 374761393 + y * 668265263 + seed * 1274126177) & 0xFFFFFFFF


# --- tiles 16 x 16x16 ---
TILE = 16
TILE_COUNT = 16

K = (22, 16, 14, 255)
SKIN = (236, 188, 132, 255)
HAIR = (92, 54, 32, 255)
BLUE = (52, 90, 168, 255)
BLUE_D = (36, 62, 122, 255)
GOLD = (212, 168, 48, 255)
BOOT = (74, 48, 32, 255)
PANTS = (48, 58, 92, 255)
ROBE = (122, 62, 168, 255)
ROBE_D = (78, 36, 118, 255)
HAT = (58, 32, 96, 255)
WHITE = (240, 236, 228, 255)
EYE = (32, 24, 20, 255)


def make_tiles():
    sheet = new_canvas(TILE * TILE_COUNT, TILE)
    # 0 grass
    for y in range(TILE):
        for x in range(TILE):
            n = hash_n(x, y, 11) % 8
            if n == 0:
                c = (58, 122, 52, 255)
            elif n == 1:
                c = (86, 158, 72, 255)
            else:
                c = (70, 140, 60, 255)
            put(sheet, TILE * TILE_COUNT, x, y, c, TILE)
    # 1 grass variant
    for y in range(TILE):
        for x in range(TILE):
            n = hash_n(x, y, 29) % 7
            if n == 0:
                c = (48, 108, 48, 255)
            elif n == 1:
                c = (96, 168, 78, 255)
            else:
                c = (64, 132, 56, 255)
            put(sheet, TILE * TILE_COUNT, TILE + x, y, c, TILE)
    # 2 path
    for y in range(TILE):
        for x in range(TILE):
            n = hash_n(x, y, 41) % 6
            if n == 0:
                c = (168, 128, 72, 255)
            elif n == 1:
                c = (140, 102, 56, 255)
            else:
                c = (156, 116, 64, 255)
            put(sheet, TILE * TILE_COUNT, TILE * 2 + x, y, c, TILE)
    # 3 flowers on grass
    for y in range(TILE):
        for x in range(TILE):
            n = hash_n(x, y, 11) % 8
            c = (70, 140, 60, 255) if n else (58, 122, 52, 255)
            put(sheet, TILE * TILE_COUNT, TILE * 3 + x, y, c, TILE)
    for fx, fy, col in ((3, 4, (220, 80, 120, 255)), (11, 6, (240, 220, 80, 255)), (7, 11, (220, 80, 120, 255)), (13, 12, (240, 220, 80, 255))):
        put(sheet, TILE * TILE_COUNT, TILE * 3 + fx, fy, col, TILE)
        put(sheet, TILE * TILE_COUNT, TILE * 3 + fx, fy + 1, (48, 108, 48, 255), TILE)
    # 4 water
    for y in range(TILE):
        for x in range(TILE):
            n = (x + y * 2) % 5
            if n == 0:
                c = (72, 148, 196, 255)
            elif n == 1:
                c = (48, 108, 168, 255)
            else:
                c = (40, 92, 156, 255)
            put(sheet, TILE * TILE_COUNT, TILE * 4 + x, y, c, TILE)
    # 5 tree (transparent corners)
    ox = TILE * 5
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 7, 10, 2, 6, (96, 64, 32, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 6, 11, 4, 2, (74, 48, 24, 255))
    for cx, cy, rad, col in ((8, 6, 6, (28, 92, 36, 255)), (8, 5, 5, (40, 122, 48, 255)), (7, 4, 3, (56, 148, 60, 255))):
        for y in range(TILE):
            for x in range(TILE):
                if (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad * 0.85:
                    put(sheet, TILE * TILE_COUNT, ox + x, y, col, TILE)
    # 6 rock
    ox = TILE * 6
    for y in range(TILE):
        for x in range(TILE):
            dx, dy = x - 8, y - 9
            if dx * dx + dy * dy * 1.4 < 36:
                shade = 130 + (x + y) % 3 * 12
                put(sheet, TILE * TILE_COUNT, ox + x, y, (shade, shade - 8, shade - 16, 255), TILE)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 5, 8, 6, 1, (190, 190, 180, 255))
    # 7 shrine
    ox = TILE * 7
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 12, 10, 3, (90, 86, 80, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 6, 6, 4, 7, (210, 200, 170, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 5, 5, 6, 2, (180, 150, 50, 255))
    put(sheet, TILE * TILE_COUNT, ox + 7, 8, (240, 220, 90, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 8, 8, (240, 220, 90, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 7, 9, (240, 220, 90, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 8, 9, (240, 220, 90, 255), TILE)

    def fill_path_bg(ox):
        for y in range(TILE):
            for x in range(TILE):
                n = hash_n(x, y, 41) % 6
                if n == 0:
                    c = (168, 128, 72, 255)
                elif n == 1:
                    c = (140, 102, 56, 255)
                else:
                    c = (156, 116, 64, 255)
                put(sheet, TILE * TILE_COUNT, ox + x, y, c, TILE)

    # 8 stall (wooden counter + cloth)
    ox = TILE * 8
    fill_path_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 8, 12, 6, (122, 78, 40, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 7, 12, 2, (168, 108, 56, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 4, 10, 4, (196, 72, 48, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 3, 8, 1, (220, 96, 60, 255))
    put(sheet, TILE * TILE_COUNT, ox + 5, 5, (240, 220, 90, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 10, 6, (80, 160, 72, 255), TILE)

    # 9 cooking range
    ox = TILE * 9
    fill_path_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 5, 10, 10, (86, 82, 76, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 6, 8, 3, (48, 44, 40, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 5, 7, 6, 2, (220, 96, 40, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 6, 8, 4, 1, (240, 180, 64, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 11, 8, 3, (64, 60, 56, 255))
    put(sheet, TILE * TILE_COUNT, ox + 7, 4, (48, 44, 40, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 8, 4, (48, 44, 40, 255), TILE)

    # 10 anvil
    ox = TILE * 10
    fill_path_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 5, 11, 6, 4, (96, 64, 32, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 6, 8, 4, 4, (72, 76, 84, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 6, 11, 3, (92, 96, 108, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 7, 3, 2, (72, 76, 84, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 6, 8, 1, (168, 176, 188, 255))

    # 11 bank booth
    ox = TILE * 11
    fill_path_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 4, 12, 11, (122, 86, 48, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 5, 10, 6, (48, 40, 28, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 6, 8, 4, (180, 150, 72, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 11, 12, 3, (148, 108, 56, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 4, 12, 1, (212, 168, 48, 255))
    put(sheet, TILE * TILE_COUNT, ox + 7, 8, (240, 220, 90, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 8, 8, (240, 220, 90, 255), TILE)

    def fill_water_bg(ox):
        for y in range(TILE):
            for x in range(TILE):
                n = (x + y * 2) % 5
                if n == 0:
                    c = (72, 148, 196, 255)
                elif n == 1:
                    c = (48, 108, 168, 255)
                else:
                    c = (40, 92, 156, 255)
                put(sheet, TILE * TILE_COUNT, ox + x, y, c, TILE)

    def fill_grass_bg(ox):
        for y in range(TILE):
            for x in range(TILE):
                n = hash_n(x, y, 11) % 8
                if n == 0:
                    c = (58, 122, 52, 255)
                elif n == 1:
                    c = (86, 158, 72, 255)
                else:
                    c = (70, 140, 60, 255)
                put(sheet, TILE * TILE_COUNT, ox + x, y, c, TILE)

    # 12 dock (planks over water)
    ox = TILE * 12
    fill_water_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 1, 3, 14, 10, (148, 108, 56, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 1, 3, 14, 1, (180, 136, 72, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 1, 7, 14, 1, (122, 86, 44, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 1, 11, 14, 1, (122, 86, 44, 255))
    put(sheet, TILE * TILE_COUNT, ox + 4, 5, (96, 64, 32, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 11, 9, (96, 64, 32, 255), TILE)

    # 13 fishing boat
    ox = TILE * 13
    fill_water_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 2, 8, 12, 4, (122, 78, 40, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 7, 10, 2, (168, 108, 56, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 11, 8, 2, (90, 58, 28, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 7, 3, 2, 5, (220, 216, 200, 255))
    put(sheet, TILE * TILE_COUNT, ox + 8, 2, (196, 72, 48, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 9, 3, (196, 72, 48, 255), TILE)

    # 14 tomb marker
    ox = TILE * 14
    fill_grass_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 5, 4, 6, 10, (150, 148, 142, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 6, 3, 4, 2, (168, 166, 158, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 6, 6, 4, 3, (112, 110, 104, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 13, 8, 2, (90, 86, 80, 255))
    put(sheet, TILE * TILE_COUNT, ox + 7, 7, (190, 188, 180, 255), TILE)
    put(sheet, TILE * TILE_COUNT, ox + 8, 8, (190, 188, 180, 255), TILE)

    # 15 closed / locked door (no open animation this tick)
    ox = TILE * 15
    fill_path_bg(ox)
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 3, 1, 10, 14, (96, 64, 32, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 2, 8, 12, (122, 78, 40, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 2, 8, 1, (74, 48, 24, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 7, 2, 1, 12, (90, 58, 28, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 4, 7, 8, 1, (90, 58, 28, 255))
    fill_rect(sheet, TILE * TILE_COUNT, TILE, ox + 10, 8, 2, 2, (212, 168, 48, 255))
    write_png(os.path.join(ASSETS, "tiles.png"), TILE * TILE_COUNT, TILE, sheet)


def draw_humanoid(frame, facing, walk, mage=False):
    """facing: 0 down, 1 side, 2 up. walk: 0 idle, 1 left-leg, 2 right-leg."""
    px = new_canvas(16, 16)
    xoff = 0
    if walk == 1:
        xoff = -1 if facing == 1 else 0
    elif walk == 2:
        xoff = 1 if facing == 1 else 0
    body = ROBE if mage else BLUE
    body_d = ROBE_D if mage else BLUE_D

    def p(x, y, c):
        put(px, 16, x + xoff, y, c, 16)

    # head
    if facing == 2:
        hair_rows = ((5, 2, 6), (4, 3, 8), (4, 4, 8))
        for x0, y, w in hair_rows:
            fill_rect(px, 16, 16, x0 + xoff, y, w, 1, HAIR if not mage else HAT)
        fill_rect(px, 16, 16, 5 + xoff, 5, 6, 3, HAIR if not mage else HAT)
    else:
        fill_rect(px, 16, 16, 5 + xoff, 2, 6, 2, HAIR if not mage else HAT)
        fill_rect(px, 16, 16, 4 + xoff, 3, 8, 5, SKIN)
        fill_rect(px, 16, 16, 5 + xoff, 2, 6, 2, HAIR if not mage else HAT)
        if mage:
            fill_rect(px, 16, 16, 4 + xoff, 1, 8, 2, HAT)
            put(px, 16, 7 + xoff, 0, HAT, 16)
            put(px, 16, 8 + xoff, 0, HAT, 16)
        if facing == 0:
            p(6, 5, EYE)
            p(9, 5, EYE)
            p(6, 6, SKIN)
            p(9, 6, SKIN)
        else:
            p(9, 5, EYE)
    # torso
    fill_rect(px, 16, 16, 5 + xoff, 8, 6, 4, body)
    fill_rect(px, 16, 16, 5 + xoff, 11, 6, 1, GOLD)
    fill_rect(px, 16, 16, 4 + xoff, 8, 2, 3, body_d)
    fill_rect(px, 16, 16, 10 + xoff, 8, 2, 3, body_d)
    # legs
    ly = 12
    if walk == 0:
        fill_rect(px, 16, 16, 6 + xoff, ly, 2, 3, PANTS if not mage else ROBE_D)
        fill_rect(px, 16, 16, 8 + xoff, ly, 2, 3, PANTS if not mage else ROBE_D)
        fill_rect(px, 16, 16, 6 + xoff, 15, 2, 1, BOOT)
        fill_rect(px, 16, 16, 8 + xoff, 15, 2, 1, BOOT)
    elif walk == 1:
        fill_rect(px, 16, 16, 5 + xoff, ly, 2, 3, PANTS if not mage else ROBE_D)
        fill_rect(px, 16, 16, 9 + xoff, ly, 2, 2, PANTS if not mage else ROBE_D)
        fill_rect(px, 16, 16, 5 + xoff, 15, 2, 1, BOOT)
        fill_rect(px, 16, 16, 9 + xoff, 14, 2, 1, BOOT)
    else:
        fill_rect(px, 16, 16, 5 + xoff, ly, 2, 2, PANTS if not mage else ROBE_D)
        fill_rect(px, 16, 16, 9 + xoff, ly, 2, 3, PANTS if not mage else ROBE_D)
        fill_rect(px, 16, 16, 5 + xoff, 14, 2, 1, BOOT)
        fill_rect(px, 16, 16, 9 + xoff, 15, 2, 1, BOOT)
    return px


def make_player():
    """4x4 sheet matching tutorial-style frame indices."""
    sheet = new_canvas(64, 64)
    frames = {
        0: ("down", 0, False),
        1: ("side", 0, False),
        2: ("up", 0, False),
        3: ("down", 0, True),
        4: ("side", 0, True),
        5: ("up", 0, True),
        6: ("down", 1, False),
        7: ("side", 1, False),
        8: ("up", 1, False),
        9: ("down", 1, True),
        10: ("side", 1, True),
        11: ("up", 1, True),
        12: ("down", 2, False),
        13: ("side", 2, False),
        14: ("up", 2, False),
        15: ("down", 2, True),
    }
    face_map = {"down": 0, "side": 1, "up": 2}
    for idx, (face, walk, mage) in frames.items():
        col, row = idx % 4, idx // 4
        spr = draw_humanoid(idx, face_map[face], walk, mage)
        blit(sheet, 64, col * 16, row * 16, spr, 16, 16)
    write_png(os.path.join(ASSETS, "player.png"), 64, 64, sheet)


def make_slime():
    px = new_canvas(16, 16)
    for y in range(16):
        for x in range(16):
            dx, dy = x - 8, y - 10
            if dx * dx + dy * dy * 0.7 < 28:
                put(px, 16, x, y, (72, 196, 92, 255), 16)
            if dx * dx + (dy + 1) * (dy + 1) * 0.7 < 12:
                put(px, 16, x, y, (120, 228, 140, 255), 16)
    put(px, 16, 6, 9, EYE, 16)
    put(px, 16, 10, 9, EYE, 16)
    put(px, 16, 6, 10, WHITE, 16)
    put(px, 16, 10, 10, WHITE, 16)
    write_png(os.path.join(ASSETS, "slime.png"), 16, 16, px)


def make_bat():
    px = new_canvas(16, 16)
    fill_rect(px, 16, 16, 6, 6, 4, 5, (92, 52, 128, 255))
    # wings
    for x, y in [(1, 7), (2, 6), (3, 6), (4, 7), (4, 8), (3, 8), (2, 9)]:
        put(px, 16, x, y, (62, 32, 96, 255), 16)
        put(px, 16, 15 - x, y, (62, 32, 96, 255), 16)
    for x, y in [(2, 7), (3, 7), (12, 7), (13, 7)]:
        put(px, 16, x, y, (110, 70, 150, 255), 16)
    put(px, 16, 7, 7, EYE, 16)
    put(px, 16, 9, 7, EYE, 16)
    fill_rect(px, 16, 16, 7, 11, 1, 3, (92, 52, 128, 255))
    fill_rect(px, 16, 16, 9, 11, 1, 3, (92, 52, 128, 255))
    write_png(os.path.join(ASSETS, "bat.png"), 16, 16, px)


def make_drake():
    px = new_canvas(24, 24)
    # body
    fill_rect(px, 24, 24, 8, 10, 10, 7, (196, 92, 40, 255))
    fill_rect(px, 24, 24, 9, 11, 8, 5, (220, 120, 52, 255))
    # head
    fill_rect(px, 24, 24, 4, 7, 7, 6, (196, 92, 40, 255))
    fill_rect(px, 24, 24, 3, 9, 4, 3, (220, 120, 52, 255))
    put(px, 24, 5, 9, EYE, 24)
    put(px, 24, 6, 9, (240, 80, 40, 255), 24)
    # horn
    put(px, 24, 7, 5, (230, 210, 160, 255), 24)
    put(px, 24, 7, 6, (230, 210, 160, 255), 24)
    # wing
    fill_rect(px, 24, 24, 12, 4, 8, 6, (150, 48, 32, 255))
    fill_rect(px, 24, 24, 13, 5, 6, 4, (180, 64, 40, 255))
    # tail
    fill_rect(px, 24, 24, 17, 14, 5, 2, (196, 92, 40, 255))
    fill_rect(px, 24, 24, 20, 12, 2, 3, (220, 120, 52, 255))
    # legs
    fill_rect(px, 24, 24, 10, 17, 2, 4, (150, 70, 32, 255))
    fill_rect(px, 24, 24, 15, 17, 2, 4, (150, 70, 32, 255))
    write_png(os.path.join(ASSETS, "drake.png"), 24, 24, px)


def make_sign():
    px = new_canvas(16, 16)
    fill_rect(px, 16, 16, 7, 8, 2, 8, (96, 64, 32, 255))
    fill_rect(px, 16, 16, 3, 3, 10, 7, (196, 164, 96, 255))
    fill_rect(px, 16, 16, 4, 4, 8, 1, (74, 48, 24, 255))
    fill_rect(px, 16, 16, 4, 6, 6, 1, (74, 48, 24, 255))
    fill_rect(px, 16, 16, 4, 8, 7, 1, (74, 48, 24, 255))
    write_png(os.path.join(ASSETS, "sign.png"), 16, 16, px)


def make_npc():
    px = draw_humanoid(0, 0, 0, False)
    # grey cloak
    for i, pix in enumerate(px):
        if pix == BLUE or pix == BLUE_D:
            px[i] = (120, 118, 128, 255) if pix == BLUE else (88, 86, 96, 255)
    write_png(os.path.join(ASSETS, "npc.png"), 16, 16, px)


def make_map():
    w, h = 40, 30
    grass = [1] * (w * h)
    obstacles = [0] * (w * h)

    def gset(arr, x, y, gid):
        if 0 <= x < w and 0 <= y < h:
            arr[y * w + x] = gid

    for y in range(h):
        for x in range(w):
            n = hash_n(x, y, 3) % 12
            grass[y * w + x] = 2 if n == 0 else 1
            if n == 1 and not (x < 12 and y < 10):
                grass[y * w + x] = 4

    # village path
    for x in range(3, 18):
        gset(grass, x, 6, 3)
    for y in range(4, 16):
        gset(grass, 6, y, 3)
    for x in range(6, 22):
        gset(grass, x, 15, 3)
    for y in range(15, 26):
        gset(grass, 21, y, 3)

    # pond
    for y in range(18, 23):
        for x in range(10, 16):
            gset(obstacles, x, y, 5)
    gset(obstacles, 10, 18, 0)
    gset(obstacles, 15, 22, 0)
    gset(grass, 10, 18, 1)
    gset(grass, 15, 22, 1)

    # shrine + flowers
    gset(grass, 8, 5, 8)
    gset(grass, 7, 5, 4)
    gset(grass, 9, 5, 4)

    # border trees
    for x in range(w):
        gset(obstacles, x, 0, 6)
        gset(obstacles, x, h - 1, 6)
    for y in range(h):
        gset(obstacles, 0, y, 6)
        gset(obstacles, w - 1, y, 6)

    # forest clumps
    clumps = [(14, 3), (24, 4), (30, 8), (28, 14), (32, 20), (8, 24), (26, 24), (16, 10), (34, 12), (18, 20)]
    for cx, cy in clumps:
        for y in range(cy, cy + 3):
            for x in range(cx, cx + 4):
                if hash_n(x, y, 9) % 3 != 0:
                    gset(obstacles, x, y, 6)

    rocks = [(12, 8), (19, 12), (25, 18), (33, 7), (4, 20), (15, 26), (29, 26)]
    for x, y in rocks:
        gset(obstacles, x, y, 7)

    # keep spawn/village walkable
    for y in range(3, 9):
        for x in range(3, 11):
            if obstacles[y * w + x] == 6:
                obstacles[y * w + x] = 0

    tiled = {
        "compressionlevel": -1,
        "height": h,
        "width": w,
        "infinite": False,
        "layers": [
            {
                "data": grass,
                "height": h,
                "id": 1,
                "name": "Grass",
                "opacity": 1,
                "type": "tilelayer",
                "visible": True,
                "width": w,
                "x": 0,
                "y": 0,
            },
            {
                "data": obstacles,
                "height": h,
                "id": 2,
                "name": "Obstacles",
                "opacity": 1,
                "type": "tilelayer",
                "visible": True,
                "width": w,
                "x": 0,
                "y": 0,
            },
        ],
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.10.2",
        "tileheight": 16,
        "tilewidth": 16,
        "tilesets": [
            {
                "columns": TILE_COUNT,
                "firstgid": 1,
                "image": "tiles.png",
                "imageheight": 16,
                "imagewidth": TILE * TILE_COUNT,
                "margin": 0,
                "name": "tiles",
                "spacing": 0,
                "tilecount": TILE_COUNT,
                "tileheight": 16,
                "tilewidth": 16,
            }
        ],
        "type": "map",
        "version": "1.10",
    }
    with open(os.path.join(ASSETS, "map.json"), "w", encoding="utf-8") as handle:
        json.dump(tiled, handle, indent=2)


def main():
    os.makedirs(ASSETS, exist_ok=True)
    make_tiles()
    make_player()
    make_slime()
    make_bat()
    make_drake()
    make_sign()
    make_npc()
    make_map()
    print("Wrote assets to", ASSETS)
    svg_tool = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generate_svgs.py")
    os.system("%s %s" % (sys.executable, svg_tool))


if __name__ == "__main__":
    main()
