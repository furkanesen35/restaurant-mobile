from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

SIZE = 1024
CENTER = SIZE // 2
BG_START = (35, 26, 19)
BG_END = (58, 42, 30)
RING_COLOR = (212, 175, 55)
TEXT_COLOR = (255, 230, 170)


def draw_gradient_background(draw: ImageDraw.ImageDraw):
    for y in range(SIZE):
        ratio = y / (SIZE - 1)
        color = tuple(
            int(BG_START[i] + (BG_END[i] - BG_START[i]) * ratio) for i in range(3)
        )
        draw.line([(0, y), (SIZE, y)], fill=color)


def build_primary_icon():
    img = Image.new("RGB", (SIZE, SIZE))
    draw = ImageDraw.Draw(img)
    draw_gradient_background(draw)

    radius = int(SIZE * 0.38)
    ring_width = 32
    for offset in range(-ring_width // 2, ring_width // 2):
        r = radius + offset
        draw.ellipse(
            (CENTER - r, CENTER - r, CENTER + r, CENTER + r), outline=RING_COLOR
        )

    inner_radius = radius - 60
    draw.ellipse(
        (
            CENTER - inner_radius,
            CENTER - inner_radius,
            CENTER + inner_radius,
            CENTER + inner_radius,
        ),
        outline=TEXT_COLOR,
    )

    utensil_height = int(SIZE * 0.35)
    utensil_width = int(SIZE * 0.04)
    spacing = int(SIZE * 0.07)
    start_y = CENTER - utensil_height // 2

    fork_x = CENTER - spacing
    prong_width = max(4, utensil_width // 3)
    prong_height = int(utensil_height * 0.25)
    handle_rect = [
        fork_x - utensil_width // 2,
        start_y + prong_height,
        fork_x + utensil_width // 2,
        start_y + utensil_height,
    ]
    draw.rounded_rectangle(handle_rect, radius=utensil_width // 2, fill=RING_COLOR)
    for i in range(3):
        x0 = fork_x - utensil_width // 2 + i * prong_width
        x1 = x0 + prong_width - 2
        draw.rounded_rectangle(
            [x0, start_y, x1, start_y + prong_height],
            radius=max(2, prong_width // 2),
            fill=RING_COLOR,
        )

    spoon_x = CENTER + spacing
    spoon_handle_rect = [
        spoon_x - utensil_width // 2,
        start_y + int(utensil_height * 0.25),
        spoon_x + utensil_width // 2,
        start_y + utensil_height,
    ]
    draw.rounded_rectangle(spoon_handle_rect, radius=utensil_width // 2, fill=RING_COLOR)
    spoon_bowl_radius = utensil_width
    draw.ellipse(
        [
            spoon_x - spoon_bowl_radius,
            start_y,
            spoon_x + spoon_bowl_radius,
            start_y + spoon_bowl_radius * 1.6,
        ],
        fill=RING_COLOR,
    )

    img.save(ASSETS / "icon.png", format="PNG")


def build_adaptive_icon():
    adaptive = Image.new("RGBA", (SIZE, SIZE), (234, 209, 136, 255))
    draw = ImageDraw.Draw(adaptive)
    plate_radius = int(SIZE * 0.35)
    draw.ellipse(
        (CENTER - plate_radius, CENTER - plate_radius, CENTER + plate_radius, CENTER + plate_radius),
        fill=BG_START,
    )
    symbol_color = (255, 215, 120)
    utensil_height = int(SIZE * 0.35)
    utensil_width = int(SIZE * 0.045)
    spacing = int(SIZE * 0.07)
    start_y = CENTER - utensil_height // 2
    fork_rect = [
        CENTER - spacing - utensil_width // 2,
        start_y,
        CENTER - spacing + utensil_width // 2,
        start_y + utensil_height,
    ]
    spoon_rect = [
        CENTER + spacing - utensil_width // 2,
        start_y,
        CENTER + spacing + utensil_width // 2,
        start_y + utensil_height,
    ]
    draw.rounded_rectangle(fork_rect, radius=utensil_width // 2, fill=symbol_color)
    draw.rounded_rectangle(spoon_rect, radius=utensil_width // 2, fill=symbol_color)
    adaptive.save(ASSETS / "adaptive-icon.png", format="PNG")


def build_splash():
    splash = Image.new("RGB", (SIZE, SIZE), BG_START)
    draw = ImageDraw.Draw(splash)
    plate_radius = int(SIZE * 0.42)
    draw.ellipse(
        (CENTER - plate_radius, CENTER - plate_radius, CENTER + plate_radius, CENTER + plate_radius),
        outline=RING_COLOR,
        width=36,
    )
    splash.save(ASSETS / "splash-icon.png", format="PNG")


def main():
    build_primary_icon()
    build_adaptive_icon()
    build_splash()


if __name__ == "__main__":
    main()
