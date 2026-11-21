"""Generates the PWA PNG icons (a japa-mala ring of beads on saffron).
Run once: python3 scripts/generate-icons.py  (needs Pillow)."""
import math
from PIL import Image, ImageDraw

ORANGE = (249, 115, 22, 255)
WHITE = (255, 255, 255, 255)

def draw(size, maskable=False, rounded=True):
    s = size * 4  # supersample for smooth edges
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable or not rounded:
        d.rectangle([0, 0, s, s], fill=ORANGE)
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.25), fill=ORANGE)
    scale = 0.62 if maskable else 0.84  # keep glyph inside the maskable safe zone
    cx = cy = s / 2
    R = s * 0.30 * scale / 0.84
    bead = s * 0.053 * scale / 0.84
    for i in range(12):
        if i == 0:
            continue  # gap at the bottom for the head bead
        a = math.pi / 2 + i * (2 * math.pi / 12)
        x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        d.ellipse([x - bead, y - bead, x + bead, y + bead], fill=WHITE)
    hx, hy, hr = cx, cy + R, bead * 1.55
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)

draw(192).save("public/pwa-192.png")
draw(512).save("public/pwa-512.png")
draw(512, maskable=True).save("public/pwa-512-maskable.png")
draw(180, rounded=False).save("public/apple-touch-icon.png")
print("icons written")
