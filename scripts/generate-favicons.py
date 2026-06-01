#!/usr/bin/env python3
"""Generate PNG favicon sizes from the app/icon.svg design."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Install Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
PUBLIC = ROOT / "public"


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Bold "N" — scale font to icon size
    font_size = int(size * 0.62)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

    text = "N"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((x, y), text, fill="black", font=font)
    return img


def save_png(path: Path, size: int) -> None:
    draw_icon(size).save(path, format="PNG")
    print(f"Wrote {path} ({size}x{size})")


def save_ico(path: Path) -> None:
    sizes = [16, 32, 48]
    images = [draw_icon(s) for s in sizes]
    images[0].save(
        path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=images[1:],
    )
    print(f"Wrote {path} ({', '.join(str(s) for s in sizes)}px)")


if __name__ == "__main__":
    APP.mkdir(exist_ok=True)
    PUBLIC.mkdir(exist_ok=True)

    save_png(APP / "apple-icon.png", 180)
    save_png(PUBLIC / "icon-192.png", 192)
    save_png(PUBLIC / "icon-512.png", 512)
    save_png(PUBLIC / "favicon-32x32.png", 32)
    save_png(PUBLIC / "favicon-16x16.png", 16)
    save_ico(PUBLIC / "favicon.ico")
