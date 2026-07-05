#!/usr/bin/env python3
"""
Извлекает акварельные иллюстрации из watercolor-frame.png.
Создаёт PNG с прозрачным фоном в assets/botanical/
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

DIR = Path(__file__).resolve().parent
OUT = DIR / "assets" / "botanical"
FRAME = DIR / "assets" / "watercolor-frame.png"


def remove_paper(img: Image.Image) -> Image.Image:
    """Убирает кремовую бумагу, оставляет акварель."""
    arr = np.array(img.convert("RGBA"))
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)

    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = max_c - min_c
    lum = (r + g + b) / 3.0

    cream = (r > 210) & (g > 200) & (b > 175) & (sat < 45)
    gray_grain = (sat < 22) & (np.abs(r - g) < 18) & (np.abs(g - b) < 18) & (lum > 90) & (lum < 210)
    light_bg = (lum > 215) & (sat < 30)

    is_bg = cream | gray_grain | light_bg

    is_lemon = (r > 150) & (g > 120) & (b < 140) & (r > g) & (g > b * 0.8)
    is_leaf = (g > r * 0.9) & (g > b) & (g > 80) & (sat > 15)
    is_flower = (r > 120) & (b > 80) & (r > g * 1.1) & (sat > 20)
    is_white_flower = (lum > 170) & (sat < 40) & ~is_bg
    is_stem = (r > 55) & (g > 40) & (b < 95) & (r > b) & (sat > 12) & (lum < 175)

    is_paint = is_lemon | is_leaf | is_flower | is_white_flower | is_stem
    is_shadow = (sat > 10) & (lum < 120) & (g > r * 0.7)

    alpha = np.where(is_bg, 0, 255).astype(float)
    alpha[is_paint | is_shadow] = 255

    edge = (~is_bg) & (~is_paint) & (~is_shadow) & (sat > 8)
    alpha[edge] = np.clip((sat[edge] / 60) * 200, 40, 220)

    arr[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(arr)


def soften_alpha(img: Image.Image, radius: float = 1.0) -> Image.Image:
    arr = np.array(img)
    alpha = Image.fromarray(arr[:, :, 3]).filter(ImageFilter.GaussianBlur(radius=radius))
    arr[:, :, 3] = np.array(alpha)
    return Image.fromarray(arr)


def trim_transparent(img: Image.Image, pad: int = 8) -> Image.Image:
    arr = np.array(img)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 30)
    if len(xs) == 0:
        return img
    return img.crop((
        max(0, xs.min() - pad),
        max(0, ys.min() - pad),
        min(arr.shape[1], xs.max() + pad),
        min(arr.shape[0], ys.max() + pad),
    ))


def save_botanical(name: str, img: Image.Image, box: tuple[int, int, int, int]) -> None:
    crop = img.crop(box)
    cut = trim_transparent(soften_alpha(remove_paper(crop)))
    if cut.size[0] < 24 or cut.size[1] < 24:
        print(f"  ✗ {name} — пустой результат")
        return
    cut.save(OUT / f"{name}.png", "PNG", optimize=True)
    print(f"  ✓ {name}.png  {cut.size}")


def make_bg_soft(frame: Image.Image) -> None:
    bg = frame.resize((900, 900), Image.Resampling.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=22))
    bg = ImageEnhance.Brightness(bg).enhance(1.12)
    bg = ImageEnhance.Color(bg).enhance(0.8)
    bg.save(OUT / "bg-soft.jpg", "JPEG", quality=88)
    print("  ✓ bg-soft.jpg")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    if not FRAME.exists():
        print(f"Нет {FRAME}")
        return

    frame = Image.open(FRAME).convert("RGB")
    fw, fh = frame.size

    print("Из watercolor-frame.png:")
    crops = {
        "corner-tl": (0, 0, 500, 500),
        "corner-tr": (fw - 500, 0, fw, 500),
        "corner-bl": (0, fh - 480, 480, fh),
        "corner-br": (fw - 480, fh - 480, fw, fh),
        "garland-bottom": (60, fh - 380, fw - 60, fh),
        "garland-top": (120, 420, fw - 120, 580),
        "sprig-left": (0, 180, 300, 580),
        "sprig-right": (fw - 300, 180, fw, 580),
        "lemon-cluster": (40, 40, 340, 340),
    }
    for name, box in crops.items():
        save_botanical(name, frame, box)

    make_bg_soft(frame)
    print(f"\nГотово → {OUT}/")


if __name__ == "__main__":
    main()
