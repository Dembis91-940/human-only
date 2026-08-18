#!/usr/bin/env python3
"""Génère les icônes PNG de Human Only (16/32/48/128) + og-image.png (1200×630).

Pure Python (zlib + struct) — aucune dépendance externe.
Design : badge circulaire bleu ciel #38bdf8 → dégradé, anneau blanc,
coche blanche, point menthe #6ee7b7 (rappel de la double identité).

Usage : python3 dev/gen_icons.py
"""
import math
import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ICONS = os.path.join(ROOT, "extension", "icons")

SKY = (0x38, 0xBD, 0xF8)
SKY_D = (0x0E, 0xA5, 0xE9)
MINT = (0x6E, 0xE7, 0xB7)
WHITE = (255, 255, 255)


def chunk(tag, data):
    c = tag + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)


def write_png(path, w, h, rows):
    raw = b"".join(b"\x00" + b"".join(struct.pack("4B", *px) for px in row) for row in rows)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def clamp01(v):
    return 0.0 if v < 0 else (1.0 if v > 1 else v)


def dist_seg(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    c1 = vx * wx + vy * wy
    if c1 <= 0:
        return math.hypot(px - ax, py - ay)
    c2 = vx * vx + vy * vy
    if c2 <= c1:
        return math.hypot(px - bx, py - by)
    t = c1 / c2
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))


def lerp(a, b, t):
    return a + (b - a) * t


def icon_pixels(size):
    cx = cy = (size - 1) / 2.0
    R = size * 0.44
    ring_in = R - size * 0.075
    p1 = (0.29, 0.53)
    p2 = (0.43, 0.67)
    p3 = (0.73, 0.35)
    th = size * 0.085
    sx, sy = size * 0.72, size * 0.26
    sr = size * 0.085
    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            d = math.hypot(x - cx, y - cy)
            edge = clamp01(R + 0.75 - d)
            if edge <= 0:
                row.append((0, 0, 0, 0))
                continue
            t = y / size
            sr_ = int(lerp(SKY[0], SKY_D[0], t))
            sg = int(lerp(SKY[1], SKY_D[1], t))
            sb = int(lerp(SKY[2], SKY_D[2], t))
            ring = clamp01(min(d - ring_in, R - d) + 0.75) if d >= ring_in - 0.75 else 0.0
            dc = min(
                dist_seg(x, y, p1[0] * size, p1[1] * size, p2[0] * size, p2[1] * size),
                dist_seg(x, y, p2[0] * size, p2[1] * size, p3[0] * size, p3[1] * size),
            )
            chk = clamp01(th - dc + 0.75)
            dd = math.hypot(x - sx, y - sy)
            sp = clamp01(sr + 0.75 - dd)
            r = sr_ * (1 - ring) + WHITE[0] * ring
            g = sg * (1 - ring) + WHITE[1] * ring
            b = sb * (1 - ring) + WHITE[2] * ring
            r = r * (1 - chk) + WHITE[0] * chk
            g = g * (1 - chk) + WHITE[1] * chk
            b = b * (1 - chk) + WHITE[2] * chk
            r = r * (1 - sp) + MINT[0] * sp
            g = g * (1 - sp) + MINT[1] * sp
            b = b * (1 - sp) + MINT[2] * sp
            row.append((int(r), int(g), int(b), int(edge * 255)))
        rows.append(row)
    return rows


def og_pixels(w=1200, h=630):
    rows = []
    for y in range(h):
        t = y / h
        r = int(lerp(0xE0, 0xF2, t))
        g = int(lerp(0xF2, 0xFD, t))
        b = int(lerp(0xFE, 0xF5, t))
        rows.append([(r, g, b, 255)] * w)

    def blend(px, col, alpha):
        return tuple(int(px[i] * (1 - alpha) + col[i] * alpha) for i in range(3)) + (255,)

    # Badge principal : cercle bleu ciel, anneau blanc, coche blanche, point menthe
    cx, cy = w * 0.30, h * 0.50
    R = h * 0.30
    ring_in = R - w * 0.012
    th = w * 0.016
    p1 = (cx + R * -0.30, cy + R * 0.10)
    p2 = (cx + R * -0.05, cy + R * 0.35)
    p3 = (cx + R * 0.55, cy - R * 0.25)
    sx, sy = cx + R * 0.72, cy - R * 0.72
    sr = w * 0.014
    # Puces décoratives à droite
    chips = [(0.60, 0.30, w * 0.012), (0.70, 0.50, w * 0.014), (0.60, 0.70, w * 0.012)]
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy)
            t = y / h
            sr_ = int(lerp(SKY[0], SKY_D[0], t))
            sg = int(lerp(SKY[1], SKY_D[1], t))
            sb = int(lerp(SKY[2], SKY_D[2], t))
            col = (sr_, sg, sb, 255)
            edge = clamp01(R + 1.0 - d)
            if edge > 0:
                rows[y][x] = blend(rows[y][x], col, edge)
                if d >= ring_in - 1.0:
                    ring = clamp01(min(d - ring_in, R - d) + 1.0)
                    rows[y][x] = blend(rows[y][x], WHITE + (255,), ring * edge)
                dc = min(dist_seg(x, y, *p1, *p2), dist_seg(x, y, *p2, *p3))
                chk = clamp01(th - dc + 1.0)
                rows[y][x] = blend(rows[y][x], WHITE + (255,), chk * edge)
                dd = math.hypot(x - sx, y - sy)
                sp = clamp01(sr + 1.0 - dd)
                rows[y][x] = blend(rows[y][x], MINT + (255,), sp * edge)
            for fx, fy, fr in chips:
                fd = math.hypot(x - w * fx, y - h * fy)
                fc = clamp01(fr + 1.0 - fd)
                if fc > 0:
                    fcol = SKY + (255,) if fy < 0.5 else MINT + (255,)
                    rows[y][x] = blend(rows[y][x], fcol, fc)
    return rows


def main():
    os.makedirs(ICONS, exist_ok=True)
    for size in (16, 32, 48, 128):
        path = os.path.join(ICONS, "icon%d.png" % size)
        write_png(path, size, size, icon_pixels(size))
        print("OK %s" % path)
    path = os.path.join(ROOT, "og-image.png")
    write_png(path, 1200, 630, og_pixels())
    print("OK %s" % path)


if __name__ == "__main__":
    main()
