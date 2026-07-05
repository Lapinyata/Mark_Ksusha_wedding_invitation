#!/usr/bin/env python3
"""
Извлекает КАЖДЫЙ элемент отдельно из двух PNG в photos/.
Авто: connected components. Ручные кропы — где элементы слипаются.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

DIR = Path(__file__).resolve().parent
PHOTOS = DIR / "photos"
OUT = PHOTOS / "deco"

MANUAL_CROPS: dict[int, list[tuple[str, tuple[int, int, int, int]]]] = {
    0: [
        ("corner-tl", (35, 38, 455, 380)),
        ("corner-tr", (820, 455, 990, 820)),
    ],
    1: [
        ("corner-tl", (38, 28, 455, 400)),
        ("roses-duo", (175, 388, 385, 605)),
    ],
}


def content_mask(img: Image.Image) -> np.ndarray:
    arr = np.array(img.convert("RGBA"))
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)
    lum = (r + g + b) / 3.0
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    return (((lum > 35) | (sat > 20)) & (arr[:, :, 3] > 10)).astype(np.uint8)


def clean_alpha(crop: Image.Image) -> Image.Image:
    arr = np.array(crop)
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)
    lum = (r + g + b) / 3.0
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    bg = (lum < 42) | ((lum < 90) & (sat < 28))
    arr[bg, 3] = 0
    return Image.fromarray(arr)


def trim(im: Image.Image, pad: int = 6) -> Image.Image:
    arr = np.array(im)
    ys, xs = np.where(arr[:, :, 3] > 20)
    if len(xs) == 0:
        return im
    return im.crop((
        max(0, xs.min() - pad),
        max(0, ys.min() - pad),
        min(arr.shape[1], xs.max() + pad),
        min(arr.shape[0], ys.max() + pad),
    ))


def soften(im: Image.Image) -> Image.Image:
    arr = np.array(im)
    alpha = Image.fromarray(arr[:, :, 3]).filter(ImageFilter.GaussianBlur(radius=0.5))
    arr[:, :, 3] = np.array(alpha)
    return Image.fromarray(arr)


def save(im: Image.Image, name: str) -> None:
    im = soften(trim(clean_alpha(im)))
    im.save(OUT / f"{name}.png", "PNG", optimize=True)
    print(f"  ✓ {name}.png  {im.size}")


def extract_blob(img: Image.Image, labeled: np.ndarray, lid: int, pad: int = 14) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    ys, xs = np.where(labeled == lid)
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(arr.shape[1] - 1, x1 + pad), min(arr.shape[0] - 1, y1 + pad)
    crop = arr[y0 : y1 + 1, x0 : x1 + 1].copy()
    local = labeled[y0 : y1 + 1, x0 : x1 + 1]
    crop[local != lid, 3] = 0
    return Image.fromarray(crop)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.png"):
        f.unlink()

    sheets = sorted(PHOTOS.glob("*.png"))
    sheets = [p for p in sheets if p.parent == PHOTOS]

    for si, path in enumerate(sheets):
        img = Image.open(path)
        labeled, n = ndimage.label(content_mask(img))
        blobs: list[tuple[int, int, int, int, int, int]] = []
        for i in range(1, n + 1):
            ys, xs = np.where(labeled == i)
            if len(xs) < 900:
                continue
            blobs.append((len(xs), i, xs.min(), ys.min(), xs.max(), ys.max()))
        blobs.sort(key=lambda b: (b[3], b[2]))

        print(f"\nЛист {si + 1}: {path.name}")
        for j, (_, lid, *_rest) in enumerate(blobs):
            save(extract_blob(img, labeled, lid), f"sheet{si + 1}-auto{j + 1:02d}")

        for name, box in MANUAL_CROPS.get(si, []):
            x0, y0, x1, y1 = box
            arr = np.array(img.convert("RGBA"))
            save(Image.fromarray(arr[y0 : y1 + 1, x0 : x1 + 1]), f"sheet{si + 1}-{name}")

    print(f"\nГотово → {OUT}/")


if __name__ == "__main__":
    main()
