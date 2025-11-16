from __future__ import annotations

from pathlib import Path
from typing import Dict

from PIL import Image, ImageDraw

BRAND_COLORS: Dict[str, str] = {
    "background": "#231a13",
    "plate_outer": "#fff5e1",
    "plate_inner": "#f3e3c5",
    "utensil": "#f4d195",
    "utensil_shadow": "#c79c5c",
}

OUTPUTS = {
    "assets/icon.png": 1024,
    "assets/adaptive-icon.png": 1024,
    "assets/splash-icon.png": 2048,
    "assets/favicon.png": 512,
}


def draw_plate(draw: ImageDraw.ImageDraw, size: int) -> None:
    center = size / 2
    outer_radius = size * 0.38
    inner_radius = outer_radius * 0.78

    outer_bbox = [
        center - outer_radius,
        center - outer_radius,
        center + outer_radius,
        center + outer_radius,
    ]
    inner_bbox = [
        center - inner_radius,
        center - inner_radius,
        center + inner_radius,
        center + inner_radius,
    ]

    draw.ellipse(outer_bbox, fill=BRAND_COLORS["plate_outer"])
    draw.ellipse(inner_bbox, fill=BRAND_COLORS["plate_inner"])


def draw_fork(draw: ImageDraw.ImageDraw, size: int) -> None:
    fork_x = size * 0.35
    handle_width = size * 0.035
    handle_top = size * 0.22
    handle_bottom = size * 0.78

    draw.rounded_rectangle(
        [
            fork_x - handle_width,
            handle_top,
            fork_x + handle_width,
            handle_bottom,
        ],
        radius=handle_width,
        fill=BRAND_COLORS["utensil"],
    )

    prong_height = size * 0.08
    prong_gap = handle_width * 0.7
    for offset in (-prong_gap, 0, prong_gap):
        draw.rectangle(
            [
                fork_x + offset - handle_width * 0.25,
                handle_top - prong_height,
                fork_x + offset + handle_width * 0.25,
                handle_top,
            ],
            fill=BRAND_COLORS["utensil"],
        )


def draw_spoon(draw: ImageDraw.ImageDraw, size: int) -> None:
    spoon_x = size * 0.65
    bowl_height = size * 0.2
    bowl_width = size * 0.13
    bowl_top = size * 0.18

    draw.ellipse(
        [
            spoon_x - bowl_width,
            bowl_top,
            spoon_x + bowl_width,
            bowl_top + bowl_height,
        ],
        fill=BRAND_COLORS["utensil"],
    )

    handle_width = size * 0.035
    handle_bottom = size * 0.8
    draw.rounded_rectangle(
        [
            spoon_x - handle_width,
            bowl_top + bowl_height * 0.6,
            spoon_x + handle_width,
            handle_bottom,
        ],
        radius=handle_width,
        fill=BRAND_COLORS["utensil"],
    )

    # Add a subtle shadow to give depth
    draw.rounded_rectangle(
        [
            spoon_x + handle_width * 0.25,
            bowl_top + bowl_height * 0.6,
            spoon_x + handle_width * 0.65,
            handle_bottom,
        ],
        radius=handle_width,
        fill=BRAND_COLORS["utensil_shadow"],
    )


def generate_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BRAND_COLORS["background"])
    draw = ImageDraw.Draw(img)

    draw_plate(draw, size)
    draw_fork(draw, size)
    draw_spoon(draw, size)

    return img


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
