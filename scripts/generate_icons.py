from __future__ import annotations

from pathlib import Path
from PIL import Image

SOURCE_IMAGE = Path("assets/burgermeister-schmidt.png")

OUTPUTS = {
    "assets/icon.png": 1024,
    "assets/adaptive-icon.png": 1024,
    "assets/splash-icon.png": 2048,
    "assets/favicon.png": 512,
}


def generate_icon(size: int) -> Image.Image:
    if not SOURCE_IMAGE.exists():
        raise FileNotFoundError(
            f"Source artwork '{SOURCE_IMAGE}' is missing. Please place the logo there."
        )

    img = Image.open(SOURCE_IMAGE).convert("RGBA")
    if img.width != img.height:
        min_edge = min(img.width, img.height)
        left = (img.width - min_edge) // 2
        top = (img.height - min_edge) // 2
        img = img.crop((left, top, left + min_edge, top + min_edge))

    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]

    for relative_path, size in OUTPUTS.items():
        target = project_root / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        icon = generate_icon(size)
        icon.save(target, format="PNG")
        print(f"Generated {target} ({size}x{size})")

if __name__ == "__main__":
    main()
